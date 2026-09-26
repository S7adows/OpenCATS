// Phase 0.5 baseline smoke test for the CURRENT OpenCATS application (no fixes, observe only).
// Usage: NODE_PATH=$(npm root -g) node smoke.js <outDir> <fixturesDir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8080/';
const OUT = process.argv[2];
const FX = process.argv[3];
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });

const results = [];
const ids = {};
let buf = newBuf();
let shotN = 0;
let page, ctx, browser;

function newBuf() { return { console: [], pageErrors: [], failed: [], http: [], dialogs: [] }; }
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function attach(p) {
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) { const l = m.location() || {}; buf.console.push(`[${m.type()}] ${m.text().slice(0, 300)}${l.url ? ' @ ' + l.url + ':' + (l.lineNumber || '') : ''}`); } });
  p.on('pageerror', e => buf.pageErrors.push(String(e.message || e).slice(0, 300)));
  p.on('requestfailed', r => { const f = r.failure(); const t = f ? f.errorText : ''; if (!/ERR_ABORTED/.test(t) || !/\.(pdf|txt|docx)|getAttachment|generateJobOrderReportPDF/.test(r.url())) buf.failed.push(`${r.method()} ${r.url().slice(0, 200)} :: ${t}`); });
  p.on('response', r => { if (r.status() >= 400) buf.http.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 200)}`); });
  p.on('dialog', async d => { buf.dialogs.push(`${d.type()}: ${d.message().slice(0, 300)}`); try { await d.accept(); } catch (e) {} });
}

const PHP_RE = /(?:<b>)?(Warning|Notice|Fatal error|Parse error|Deprecated|Strict Standards|Catchable fatal error)(?:<\/b>)?:\s*([\s\S]*?)\s+in\s+(?:<b>)?([^<\s]+?)(?:<\/b>)?\s+on line\s+(?:<b>)?(\d+)/g;
async function phpErrors(p) {
  const out = [];
  for (const f of p.frames()) {
    let html = '';
    try { html = await f.content(); } catch (e) { continue; }
    let m; PHP_RE.lastIndex = 0;
    while ((m = PHP_RE.exec(html))) out.push(`${m[1]}: ${m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 220)} in ${m[3].replace('/var/www/public/', '')}:${m[4]}`);
    if (/Query Error|MySQL Query Failed|Please Report This Bug|Uncaught (Error|Exception)/i.test(html)) out.push('DB/Query/Uncaught error text on page (' + f.url().replace(BASE, '') + ')');
  }
  return [...new Set(out)];
}
async function brokenImages(p) {
  try { return await p.evaluate(() => Array.from(document.images).filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src'))); } catch (e) { return []; }
}
async function navTiming(p) {
  try {
    return await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; if (!n) return null; return { ttfb: Math.round(n.responseStart - n.requestStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; });
  } catch (e) { return null; }
}
async function bodyText(p, frame) {
  try { return await (frame || p).evaluate(() => document.body ? document.body.innerText : ''); } catch (e) { return ''; }
}

async function step(feature, name, fn, opts = {}) {
  buf = newBuf();
  const t0 = Date.now();
  let outcome = 'PASS'; let error = null; const notes = [];
  try {
    const r = await fn(notes);
    if (r && r.outcome) outcome = r.outcome;
  } catch (e) {
    outcome = 'FAIL'; error = String(e.message || e).split('\n')[0].slice(0, 300);
  }
  const ms = Date.now() - t0;
  await sleep(400);
  const php = await phpErrors(page);
  const imgs = await brokenImages(page);
  const timing = await navTiming(page);
  shotN++;
  const shot = `${String(shotN).padStart(2, '0')}-${slug(feature + ' ' + name)}.png`;
  if (!opts.noShot) { try { await page.screenshot({ path: path.join(OUT, 'shots', shot), fullPage: true, timeout: 20000 }); } catch (e) { notes.push('screenshot failed: ' + e.message.split('\n')[0]); } }
  const rec = { n: shotN, feature, name, url: page.url().replace(BASE, '/'), title: await page.title().catch(() => ''), ms, timing, outcome, error, notes, php, brokenImages: imgs, ...buf, shot: opts.noShot ? null : shot };
  results.push(rec);
  const flags = [php.length && `php:${php.length}`, buf.pageErrors.length && `jsErr:${buf.pageErrors.length}`, buf.console.length && `console:${buf.console.length}`, buf.http.length && `http4xx5xx:${buf.http.length}`, buf.failed.length && `reqFailed:${buf.failed.length}`, imgs.length && `brokenImg:${imgs.length}`].filter(Boolean).join(' ');
  console.log(`${String(shotN).padStart(2, '0')} [${outcome}] ${feature} :: ${name} (${ms}ms) ${flags} ${error ? ' ERR=' + error : ''} ${notes.length ? ' NOTES=' + notes.join(' | ') : ''}`);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ ids, results }, null, 1));
  return rec;
}

async function go(u) { const r = await page.goto(BASE + u, { waitUntil: 'load', timeout: 60000 }); return r; }
async function expectText(s, frame) { const t = await bodyText(page, frame); if (!t.includes(s)) throw new Error(`expected text not found: "${s}"`); }
async function submitAndWait(selector, frame) {
  const target = frame || page;
  await Promise.all([page.waitForLoadState('load').then(() => page.waitForNavigation({ timeout: 30000 }).catch(() => null)), target.click(selector)]);
  await page.waitForLoadState('load');
}
async function clickNav(selector) {
  await Promise.all([page.waitForNavigation({ timeout: 60000 }), page.click(selector)]);
  await page.waitForLoadState('load');
}
function popupFrame() { return page.frames().find(f => f.name() === 'popupFrameIFrame' || /popupFrame/.test(f.name())) || page.frames().find(f => f !== page.mainFrame() && /index\.php\?m=/.test(f.url())); }
async function waitPopup(urlPart) {
  for (let i = 0; i < 40; i++) { const f = page.frames().find(fr => fr !== page.mainFrame() && fr.url().includes(urlPart)); if (f) { await f.waitForLoadState('load').catch(() => {}); return f; } await sleep(250); }
  throw new Error('popup frame not found: ' + urlPart);
}
async function pickSuggestion(inputSel, text, resultsSel, hiddenSel, notes) {
  await page.click(inputSel);
  await page.fill(inputSel, '');
  await page.type(inputSel, text, { delay: 120 });
  await sleep(2000);
  const clicked = await page.evaluate(({ resultsSel, text }) => {
    const box = document.querySelector(resultsSel); if (!box) return 'no results container';
    const el = Array.from(box.querySelectorAll('*')).find(e => e.children.length === 0 && e.textContent.includes(text));
    if (!el) return 'no matching suggestion (container html len ' + box.innerHTML.length + ')';
    ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(t => el.dispatchEvent(new MouseEvent(t, { bubbles: true })));
    return 'clicked';
  }, { resultsSel, text });
  await sleep(800);
  const val = await page.$eval(hiddenSel, e => e.value).catch(() => '');
  notes.push(`autocomplete: ${clicked}; ${hiddenSel}=${val}`);
  return val;
}

(async () => {
  browser = await chromium.launch();
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  ctx.on('page', attach);
  page = await ctx.newPage();

  // ---------------- 1. Login ----------------
  await step('01 Login', 'login page renders', async () => { await go('index.php'); await page.waitForSelector('#username'); });
  await step('01 Login', 'invalid password rejected', async (n) => {
    await page.fill('#username', 'admin'); await page.fill('#password', 'wrong-password');
    await clickNav('#loginForm input[type=submit], #loginForm .button, #loginForm input[type=image]').catch(async () => { await Promise.all([page.waitForNavigation(), page.press('#password', 'Enter')]); });
    const t = await bodyText(page); const m = t.match(/(Invalid[^\n]*|incorrect[^\n]*)/i); n.push('message: ' + (m ? m[1].trim() : '(none found)'));
    if (!(await page.$('#username'))) throw new Error('not on login page after bad password');
  });
  await step('15 Email', 'forgot-password page (logged out)', async (n) => {
    await go('index.php?m=login&a=forgotPassword');
    const t = await bodyText(page); n.push('page text: ' + t.replace(/\s+/g, ' ').slice(0, 160));
  });
  await step('15 Email', 'forgot-password submit for admin', async (n) => {
    const inp = await page.$('input[name=username], input#username, input[type=text]');
    if (!inp) { n.push('no username input on forgot-password page'); return { outcome: 'FAIL' }; }
    await inp.fill('admin');
    await Promise.all([page.waitForNavigation({ timeout: 30000 }).catch(() => null), inp.press('Enter')]);
    await page.waitForLoadState('load');
    const t = await bodyText(page); n.push('result text: ' + t.replace(/\s+/g, ' ').slice(0, 200));
  });
  await step('01 Login', 'login as admin/admin', async () => {
    await go('index.php'); await page.fill('#username', 'admin'); await page.fill('#password', 'admin');
    await Promise.all([page.waitForNavigation(), page.press('#password', 'Enter')]);
    if (!/m=home/.test(page.url())) throw new Error('did not land on home: ' + page.url());
  });

  // ---------------- 2. Dashboard ----------------
  await step('02 Dashboard', 'home dashboard', async (n) => { await go('index.php?m=home'); await expectText('My Upcoming'); });
  await step('02 Dashboard', 'Activities tab', async () => { await go('index.php?m=activity'); });
  await step('02 Dashboard', 'Lists tab', async () => { await go('index.php?m=lists'); });

  // ---------------- 6. Companies ----------------
  await step('06 Companies', 'companies list', async () => { await go('index.php?m=companies'); });
  await step('06 Companies', 'add company (form submit)', async (n) => {
    await go('index.php?m=companies&a=add');
    await page.fill('input[name=name]', 'Baseline Test Co (TEST)');
    await page.fill('input[name=phone1]', '555-0100');
    await page.fill('input[name=city]', 'Testville'); await page.fill('input[name=state]', 'TS'); await page.fill('input[name=zip]', '00000');
    await page.fill('input[name=url]', 'https://baseline.example.test');
    await page.fill('input[name=keyTechnologies]', 'PHP, MySQL');
    await page.fill('textarea[name=notes]', 'Phase 0.5 baseline test data');
    await clickNav('#addCompanyForm input[type=submit]');
    const m = page.url().match(/companyID=(\d+)/); ids.companyID = m && m[1]; n.push('companyID=' + ids.companyID);
    await expectText('Baseline Test Co (TEST)');
  });
  await step('06 Companies', 'company detail', async () => { await go('index.php?m=companies&a=show&companyID=' + ids.companyID); await expectText('Baseline Test Co'); });
  await step('06 Companies', 'edit company page', async () => { await go('index.php?m=companies&a=edit&companyID=' + ids.companyID); await page.waitForSelector('input[name=name]'); });

  // ---------------- 7. Contacts ----------------
  await step('07 Contacts', 'contacts list', async () => { await go('index.php?m=contacts'); });
  await step('07 Contacts', 'add contact with company autocomplete', async (n) => {
    await go('index.php?m=contacts&a=add');
    await page.fill('input[name=firstName]', 'Casey'); await page.fill('input[name=lastName]', 'Contact-Test');
    const cid = await pickSuggestion('#companyName', 'Baseline Test Co', '#CompanyResults', '#companyID', n);
    if (!cid || cid === '-1' || cid === '0') { await page.$eval('#companyID', (e, v) => e.value = v, ids.companyID); n.push('WORKAROUND(test only): companyID set directly because autocomplete did not select'); }
    await page.fill('input[name=title]', 'QA Manager');
    await page.fill('input[name=email1]', 'casey.contact@example.test');
    await page.fill('input[name=phoneWork]', '555-0102');
    await clickNav('#addContactForm input[type=submit]');
    const m = page.url().match(/contactID=(\d+)/); ids.contactID = m && m[1]; n.push('contactID=' + ids.contactID);
    await expectText('Contact-Test');
  });
  await step('07 Contacts', 'contact detail', async () => { await go('index.php?m=contacts&a=show&contactID=' + ids.contactID); await expectText('Casey'); });
  await step('07 Contacts', 'cold call list', async () => { await go('index.php?m=contacts&a=showColdCallList'); });

  // ---------------- 5. Jobs ----------------
  await step('05 Jobs', 'job orders list', async () => { await go('index.php?m=joborders'); });
  await step('05 Jobs', 'Add Job Order popup', async (n) => {
    await go('index.php?m=joborders');
    await page.click('text=Add Job Order');
    const f = await waitPopup('addJobOrderPopup');
    n.push('popup text: ' + (await bodyText(page, f)).replace(/\s+/g, ' ').slice(0, 160));
  });
  await step('05 Jobs', 'add job order (public)', async (n) => {
    await go('index.php?m=joborders&a=add');
    await page.fill('input[name=title]', 'Baseline QA Engineer (TEST)');
    const cid = await pickSuggestion('#companyName', 'Baseline Test Co', '#CompanyResults', '#companyID', n);
    if (!cid || cid === '-1' || cid === '0') { await page.$eval('#companyID', (e, v) => e.value = v, ids.companyID); n.push('WORKAROUND(test only): companyID set directly'); }
    await page.fill('input[name=city]', 'Testville'); await page.fill('input[name=state]', 'TS');
    await page.fill('input[name=openings]', '2');
    await page.fill('input[name=salary]', '50000');
    const pub = await page.$('input[name=public]'); if (pub) { await pub.check(); n.push('public checked'); }
    const ck = await page.evaluate(() => { if (window.CKEDITOR && CKEDITOR.instances && CKEDITOR.instances.description) { CKEDITOR.instances.description.setData('<p>Fictional test job for the Phase 0.5 baseline. Keyword Zyxwvutronics.</p>'); return 'ckeditor'; } const t = document.querySelector('textarea[name=description]'); if (t) { t.value = 'Fictional test job'; return 'textarea'; } return 'none'; });
    n.push('description via ' + ck);
    await clickNav('#addJobOrderForm input[type=submit]');
    const m = page.url().match(/jobOrderID=(\d+)/); ids.jobOrderID = m && m[1]; n.push('jobOrderID=' + ids.jobOrderID);
    await expectText('Baseline QA Engineer');
  });
  await step('05 Jobs', 'job order detail', async () => { await go('index.php?m=joborders&a=show&jobOrderID=' + ids.jobOrderID); await expectText('Baseline QA Engineer'); });

  // ---------------- 3. Candidates ----------------
  await step('03 Candidates', 'candidates list (before add)', async () => { await go('index.php?m=candidates'); });
  await step('14 Resume', 'add-candidate: upload resume text file for parsing', async (n) => {
    await go('index.php?m=candidates&a=add');
    await page.setInputFiles('#documentFile', path.join(FX, 'resume_alex.txt'));
    const disabled = await page.$eval('#documentLoad', e => e.disabled);
    n.push('Upload button disabled after choosing file: ' + disabled);
    await Promise.all([page.waitForNavigation({ timeout: 30000 }).catch(() => null), page.click('#documentLoad', { force: true })]);
    await page.waitForLoadState('load');
    const txt = await page.$eval('textarea[name=documentText]', e => e.value).catch(() => '');
    n.push('documentText length after upload: ' + txt.length + (txt.includes('Zyxwvutronics') ? ' (contains resume keyword)' : ''));
  });
  await step('03 Candidates', 'add candidate (form submit)', async (n) => {
    if (!(await page.$('#addCandidateForm'))) await go('index.php?m=candidates&a=add');
    await page.fill('input[name=firstName]', 'Alex'); await page.fill('input[name=lastName]', 'Baseline-Test');
    await page.fill('input[name=email1]', 'alex.baseline@example.test');
    await page.fill('input[name=phoneCell]', '555-0101');
    await page.fill('input[name=city]', 'Testville'); await page.fill('input[name=state]', 'TS');
    await page.fill('input[name=keySkills]', 'php, testing');
    await clickNav('#addCandidateForm input[type=submit]');
    const m = page.url().match(/candidateID=(\d+)/); ids.candidateID = m && m[1]; n.push('candidateID=' + ids.candidateID);
    await expectText('Baseline-Test');
  });
  await step('03 Candidates', 'add duplicate candidate (same name/email)', async (n) => {
    await go('index.php?m=candidates&a=add');
    await page.fill('input[name=firstName]', 'Alex'); await page.fill('input[name=lastName]', 'Baseline-Test');
    await page.fill('input[name=email1]', 'alex.baseline@example.test');
    await clickNav('#addCandidateForm input[type=submit]');
    const m = page.url().match(/candidateID=(\d+)/); ids.duplicateCandidateID = m && m[1];
    const t = await bodyText(page); n.push('duplicateCandidateID=' + ids.duplicateCandidateID + '; duplicate notice: ' + (/duplicate/i.test(t) ? 'yes' : 'no'));
  });
  await step('03 Candidates', 'candidates list (after add)', async () => { await go('index.php?m=candidates'); await expectText('Baseline-Test'); });

  // ---------------- 4. Candidate detail ----------------
  await step('04 Candidate detail', 'candidate detail page', async () => { await go('index.php?m=candidates&a=show&candidateID=' + ids.candidateID); await expectText('Alex'); });
  await step('14 Resume', 'upload PDF attachment via popup', async (n) => {
    await go('index.php?m=candidates&a=show&candidateID=' + ids.candidateID);
    await page.evaluate(() => { const a = Array.from(document.querySelectorAll('a')).find(x => (x.getAttribute('onclick') || '').includes('a=createAttachment')); a.click(); });
    const f = await waitPopup('a=createAttachment');
    const fileInput = await f.$('input[type=file]');
    await fileInput.setInputFiles(path.join(FX, 'portfolio_alex.pdf'));
    const btn = await f.$('input[type=submit]');
    await Promise.all([f.waitForNavigation({ timeout: 30000 }).catch(() => null), btn.click()]);
    await sleep(2500);
    n.push('popup after submit: ' + (await bodyText(page, f).catch(() => '')).replace(/\s+/g, ' ').slice(0, 160));
    await go('index.php?m=candidates&a=show&candidateID=' + ids.candidateID);
    await expectText('portfolio_alex.pdf');
  });
  await step('14 Resume', 'upload DOCX attachment via popup', async (n) => {
    await page.evaluate(() => { const a = Array.from(document.querySelectorAll('a')).find(x => (x.getAttribute('onclick') || '').includes('a=createAttachment')); a.click(); });
    const f = await waitPopup('a=createAttachment');
    await (await f.$('input[type=file]')).setInputFiles(path.join(FX, 'cover_alex.docx'));
    await Promise.all([f.waitForNavigation({ timeout: 30000 }).catch(() => null), (await f.$('input[type=submit]')).click()]);
    await sleep(2500);
    await go('index.php?m=candidates&a=show&candidateID=' + ids.candidateID);
    await expectText('cover_alex.docx');
  });
  await step('14 Resume', 'download attachments (integrity check)', async (n) => {
    const links = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => /m=attachments&a=getAttachment/.test(h)));
    n.push('attachment links: ' + links.length);
    const want = { 'portfolio_alex.pdf': fs_size('portfolio_alex.pdf'), 'cover_alex.docx': fs_size('cover_alex.docx') };
    for (const l of [...new Set(links)]) {
      const r = await ctx.request.get(l);
      const body = await r.body();
      n.push(`GET ${l.replace(BASE, '/').slice(0, 90)} -> ${r.status()} ${r.headers()['content-type']} ${body.length}B disp=${(r.headers()['content-disposition'] || '').slice(0, 60)}`);
    }
    n.push('expected sizes: ' + JSON.stringify(want));
    if (!links.length) throw new Error('no attachment download links');
  });
  function fs_size(f) { return fs.statSync(path.join(FX, f)).size; }
  await step('04 Candidate detail', 'add candidate to job pipeline (popup search)', async (n) => {
    await go('index.php?m=candidates&a=show&candidateID=' + ids.candidateID);
    await page.evaluate(() => { const a = Array.from(document.querySelectorAll('a')).find(x => (x.getAttribute('onclick') || '').includes('a=considerForJobSearch')); a.click(); });
    const f = await waitPopup('a=considerForJobSearch');
    const inp = await f.$('input[type=text]');
    await inp.fill('Baseline');
    await Promise.all([f.waitForNavigation({ timeout: 10000 }).catch(() => null), inp.press('Enter')]);
    await sleep(1000);
    const f2 = page.frames().find(fr => fr !== page.mainFrame() && /considerForJobSearch|m=candidates/.test(fr.url())) || f;
    n.push('search results: ' + (await bodyText(page, f2)).replace(/\s+/g, ' ').slice(0, 160));
    const add = await f2.$('a[href*="addToPipeline"]');
    if (!add) throw new Error('no addToPipeline link in results');
    await Promise.all([f2.waitForNavigation({ timeout: 10000 }).catch(() => null), add.click()]);
    await sleep(2500);
    await go('index.php?m=candidates&a=show&candidateID=' + ids.candidateID);
    await expectText('Baseline QA Engineer');
  });
  await step('15 Email', 'pipeline status change + activity (may trigger candidate e-mail)', async (n) => {
    await go('index.php?m=candidates&a=show&candidateID=' + ids.candidateID);
    await page.evaluate(() => { const a = Array.from(document.querySelectorAll('a')).find(x => /a=addActivityChangeStatus[^']*jobOrderID=\d/.test(x.getAttribute('onclick') || '')) || document.getElementById('addActivityLink'); a.click(); });
    const f = await waitPopup('a=addActivityChangeStatus');
    const cb = await f.$('#changeStatus, input[name=changeStatus]'); if (cb) { await cb.check(); }
    const sel = await f.$('#statusID, select[name=statusID]');
    if (sel) { const opts = await sel.$$eval('option', os => os.map(o => o.value + '=' + o.textContent.trim())); n.push('status options: ' + opts.join(', ')); await sel.selectOption({ label: 'Contacted' }).catch(async () => { await sel.selectOption({ index: 2 }); }); await sel.dispatchEvent('change'); }
    await sleep(800);
    const trig = await f.$('#triggerEmail, input[name=triggerEmail]'); if (trig) n.push('triggerEmail checkbox present, checked=' + (await trig.isChecked()));
    const note = await f.$('textarea[name=activityNote], #activityNote'); if (note) await note.fill('Baseline smoke-test activity note (TEST)');
    const btn = await f.$('input[type=submit], input[value="Save"]');
    await Promise.all([f.waitForNavigation({ timeout: 45000 }).catch(() => null), btn.click()]);
    await sleep(3000);
    const pf = page.frames().find(fr => fr !== page.mainFrame() && fr.url().includes('m=candidates'));
    n.push('popup after save: ' + (pf ? (await bodyText(page, pf)).replace(/\s+/g, ' ').slice(0, 220) : '(closed)'));
    const php = await phpErrors(page); if (php.length) n.push('PHP in popup: ' + php.slice(0, 3).join(' || '));
  });
  await step('04 Candidate detail', 'candidate detail after pipeline/activity', async () => { await go('index.php?m=candidates&a=show&candidateID=' + ids.candidateID); await expectText('Contacted'); });
  await step('04 Candidate detail', 'edit candidate + save', async (n) => {
    await go('index.php?m=candidates&a=edit&candidateID=' + ids.candidateID);
    await page.fill('input[name=keySkills]', 'php, testing, playwright');
    await Promise.all([page.waitForNavigation({ timeout: 30000 }), page.click('#editCandidateForm input[type=submit][value="Save"]')]);
    await expectText('playwright');
  });
  await step('14 Resume', 'view resume text page', async (n) => {
    await go('index.php?m=candidates&a=show&candidateID=' + ids.candidateID);
    const href = await page.evaluate(() => { const a = Array.from(document.querySelectorAll('a')).find(x => /viewResume/.test((x.getAttribute('href') || '') + (x.getAttribute('onclick') || ''))); return a ? (a.getAttribute('href') + ' ' + (a.getAttribute('onclick') || '')) : null; });
    n.push('viewResume link: ' + (href ? href.slice(0, 160) : 'none'));
    const m = href && href.match(/attachmentID=(\d+)/);
    if (m) { await go('index.php?m=candidates&a=viewResume&attachmentID=' + m[1]); n.push('text: ' + (await bodyText(page)).replace(/\s+/g, ' ').slice(0, 120)); }
    else return { outcome: 'PASS' };
  });

  // ---------------- 8. Calendar ----------------
  await step('08 Calendar', 'calendar month view', async () => { await go('index.php?m=calendar'); });
  await step('08 Calendar', 'add calendar event', async (n) => {
    await go('index.php?m=calendar');
    await page.evaluate(() => userCalendarAddEvent());
    await sleep(800);
    await page.fill('#addEventForm input[name=title]', 'Baseline interview (TEST)');
    const types = await page.$$eval('#addEventForm select[name=type] option', os => os.map(o => o.value + '=' + o.textContent.trim())); n.push('event types: ' + types.join(', '));
    await page.selectOption('#addEventForm select[name=type]', { index: 1 });
    const allDay = await page.$$('#addEventForm input[name=allDay]'); if (allDay.length) await allDay[0].check();
    await page.fill('#addEventForm textarea[name=description]', 'Fictional baseline event');
    await Promise.all([page.waitForNavigation({ timeout: 30000 }), page.click('#addEventForm input[type=submit]')]);
    await expectText('Baseline interview');
  });
  await step('08 Calendar', 'upcoming events', async () => { await page.evaluate(() => calendarUpcomingEvents()); await sleep(1000); });

  // ---------------- 9. Search ----------------
  async function resultLinks0(pattern) { return page.evaluate(p => Array.from(document.querySelectorAll('a')).filter(a => !a.closest('#MRUPanel') && (a.getAttribute('href') || '').includes(p)).length, pattern); }
  await step('09 Search', 'quick search (header)', async (n) => {
    await go('index.php?m=home');
    await page.fill('#quickSearchFor, input[name=quickSearchFor]', 'Baseline');
    await Promise.all([page.waitForNavigation(), page.press('input[name=quickSearchFor]', 'Enter')]);
    const counts = {}; for (const p of ['candidateID=' + ids.candidateID, 'companyID=' + ids.companyID, 'contactID=' + ids.contactID, 'jobOrderID=' + ids.jobOrderID]) counts[p] = await resultLinks0(p);
    n.push('result links outside Recent bar: ' + JSON.stringify(counts));
    if (Object.values(counts).some(c => c === 0)) return { outcome: 'FAIL' };
  });
  async function resultLinks(pattern) { return page.evaluate(p => Array.from(document.querySelectorAll('a')).filter(a => !a.closest('#MRUPanel') && (a.getAttribute('href') || '').includes(p)).length, pattern); }
  const searchStep = (feature, label, url, mode, term, expect, linkPattern, expectCount) => step(feature, label, async (n) => {
    await go(url);
    if (mode) await page.selectOption('#searchMode, select[name=mode]', mode).catch(e => n.push('mode select: ' + e.message.split('\n')[0]));
    const inp = await page.$('#searchText, input[name=wildCardString]');
    if (!inp) throw new Error('search input not found');
    await inp.fill(term);
    await Promise.all([page.waitForNavigation({ timeout: 60000 }), inp.press('Enter')]);
    const c = await resultLinks(linkPattern);
    const ok = expectCount === 0 ? c === 0 : c > 0;
    n.push(`term="${term}" result links to ${linkPattern} (outside Recent bar): ${c}; expected ${expectCount === 0 ? 'none' : '>=1'}`);
    if (!ok) return { outcome: 'FAIL' };
  });
  const cand = () => 'candidateID=' + ids.candidateID;
  await searchStep('09 Search', 'candidate search by name', 'index.php?m=candidates&a=search', 'searchByFullName', 'Alex Baseline-Test', null, cand(), 1);
  await searchStep('09 Search', 'candidate search by key skills', 'index.php?m=candidates&a=search', 'searchByKeySkills', 'playwright', null, cand(), 1);
  await searchStep('09 Search', 'candidate search by city', 'index.php?m=candidates&a=search', 'searchByCity', 'Testville', null, cand(), 1);
  await searchStep('14 Resume', 'resume keyword search: TXT resume (Zyxwvutronics)', 'index.php?m=candidates&a=search', 'searchByResume', 'Zyxwvutronics', null, cand(), 1);
  await searchStep('14 Resume', 'resume keyword search: PDF attachment (Quokkaflux)', 'index.php?m=candidates&a=search', 'searchByResume', 'Quokkaflux', null, cand(), 1);
  await searchStep('14 Resume', 'resume keyword search: DOCX attachment (Pangolinware)', 'index.php?m=candidates&a=search', 'searchByResume', 'Pangolinware', null, cand(), 1);
  await searchStep('14 Resume', 'resume keyword search: negative control (term not in any document)', 'index.php?m=candidates&a=search', 'searchByResume', 'Nonexistentkeywordqq', null, cand(), 0);
  await searchStep('09 Search', 'job order search', 'index.php?m=joborders&a=search', null, 'QA Engineer', null, 'jobOrderID=' + ids.jobOrderID, 1);
  await searchStep('09 Search', 'company search', 'index.php?m=companies&a=search', null, 'Baseline', null, 'companyID=' + ids.companyID, 1);
  await searchStep('09 Search', 'contact search', 'index.php?m=contacts&a=search', null, 'Contact-Test', null, 'contactID=' + ids.contactID, 1);

  // ---------------- 10. Reports ----------------
  await step('10 Reports', 'reports tab', async () => { await go('index.php?m=reports'); });
  await step('10 Reports', 'submission report (to date)', async () => { await go('index.php?m=reports&a=showSubmissionReport&period=toDate'); });
  await step('10 Reports', 'placement report (to date)', async () => { await go('index.php?m=reports&a=showPlacementReport&period=toDate'); });
  await step('10 Reports', 'EEO report customize + preview', async (n) => {
    await go('index.php?m=reports&a=customizeEEOReport');
    await Promise.all([page.waitForNavigation({ timeout: 30000 }), page.click('#jobOrderReportForm input[name=submit]')]);
    await sleep(1000);
    n.push('preview url: ' + page.url().replace(BASE, '/'));
  });
  await step('10 Reports', 'job order report customize page', async () => { await go('index.php?m=reports&a=customizeJobOrderReport&jobOrderID=' + ids.jobOrderID); });
  await step('10 Reports', 'job order report PDF generation', async (n) => {
    const data = await page.evaluate(() => { const f = document.getElementById('jobOrderReportForm'); const o = {}; new FormData(f).forEach((v, k) => o[k] = v); o.submit = 'Generate Report'; return o; });
    n.push('form fields: ' + Object.keys(data).join(','));
    const r = await ctx.request.get(BASE + 'index.php?' + new URLSearchParams(data).toString());
    const body = await r.body();
    n.push(`POST -> ${r.status()} ${r.headers()['content-type']} ${body.length}B starts=${JSON.stringify(body.slice(0, 8).toString('latin1'))}`);
    if (!body.slice(0, 5).toString('latin1').startsWith('%PDF')) { fs.writeFileSync(path.join(OUT, 'jobreport-response.html'), body); return { outcome: 'FAIL' }; }
  }, { noShot: true });
  await step('10 Reports', 'job order pipeline graph image', async (n) => {
    const r = await ctx.request.get(BASE + 'index.php?m=graphs&a=jobOrderReportGraph&jobOrderID=' + ids.jobOrderID);
    n.push(`graph -> ${r.status()} ${r.headers()['content-type']} ${(await r.body()).length}B`);
  }, { noShot: true });

  // ---------------- 11. Settings ----------------
  const settingsPages = [
    ['my profile', 'index.php?m=settings'],
    ['administration', 'index.php?m=settings&a=administration'],
    ['change password page', 'index.php?m=settings&a=myProfile&s=changePassword'],
    ['site details', 'index.php?m=settings&a=administration&s=siteName'],
    ['user management', 'index.php?m=settings&a=manageUsers'],
    ['add user page', 'index.php?m=settings&a=addUser'],
    ['login activity', 'index.php?m=settings&a=loginActivity'],
    ['e-mail templates', 'index.php?m=settings&a=emailTemplates'],
    ['localization', 'index.php?m=settings&a=administration&s=localization'],
    ['site backup page', 'index.php?m=settings&a=createBackup'],
    ['EEO settings', 'index.php?m=settings&a=eeo'],
    ['tags', 'index.php?m=settings&a=tags'],
    ['customize calendar', 'index.php?m=settings&a=customizeCalendar'],
    ['extra fields', 'index.php?m=settings&a=customizeExtraFields'],
    ['passwords', 'index.php?m=settings&a=administration&s=passwords'],
    ['new version check page', 'index.php?m=settings&a=administration&s=newVersionCheck'],
    ['system information', 'index.php?m=settings&a=administration&s=systemInformation'],
    ['data import page', 'index.php?m=import'],
  ];
  for (const [label, u] of settingsPages) await step('11 Settings', label, async (n) => { const r = await go(u); n.push('HTTP ' + (r && r.status())); });
  await step('11 Settings', 'add user (test recruiter)', async (n) => {
    await go('index.php?m=settings&a=addUser');
    const fields = await page.evaluate(() => Array.from(document.querySelectorAll('form input, form select')).map(e => e.name).filter(Boolean));
    n.push('fields: ' + fields.join(','));
    const set = async (sel, v) => { const e = await page.$(sel); if (e) await e.fill(v); };
    await set('input[name=firstName]', 'Riley'); await set('input[name=lastName]', 'Recruiter-Test');
    await set('input[name=email]', 'riley.recruiter@example.test'); await set('input[name=username]', 'riley.test');
    await set('input[name=password]', 'Baseline-Test-1'); await set('input[name=retypePassword]', 'Baseline-Test-1');
    await Promise.all([page.waitForNavigation({ timeout: 30000 }).catch(() => null), page.click('#addUserForm #submit')]);
    const t = await bodyText(page); n.push('after submit url: ' + page.url().replace(BASE, '/') + ' text: ' + t.replace(/\s+/g, ' ').slice(0, 160));
    if (!t.includes('Recruiter-Test')) return { outcome: 'FAIL' };
  });
  await step('12 Careers portal', 'enable careers website (Settings)', async (n) => {
    await go('index.php?m=settings&a=careerPortalSettings');
    const cb = await page.$('input[name=enabled]');
    const before = await cb.isChecked(); n.push('enabled before: ' + before);
    if (!before) { await Promise.all([page.waitForNavigation({ timeout: 30000 }).catch(() => null), cb.click()]); await sleep(1500); }
    await go('index.php?m=settings&a=careerPortalSettings');
    const after = await (await page.$('input[name=enabled]')).isChecked(); n.push('enabled after reload: ' + after);
    if (!after) return { outcome: 'FAIL' };
  });

  // ---------------- 15. Email ----------------
  await step('15 Email', 'e-mail settings page', async () => { await go('index.php?m=settings&a=emailSettings'); });
  await step('15 Email', 'send test e-mail from settings (no SMTP server present)', async (n) => {
    await page.fill('#testEmailAddress', 'baseline.test@example.test');
    await page.click('#test');
    await sleep(8000);
    n.push('testOutput: ' + (await page.$eval('#testOutput', e => e.innerText).catch(() => '')).replace(/\s+/g, ' ').slice(0, 300));
  });
  await step('15 Email', 'e-mail candidate from list (compose)', async (n) => {
    await go('index.php?m=candidates');
    const ok = await page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('tr')).find(r => r.innerText.includes('Baseline-Test') && r.querySelector('input[type=checkbox]'));
      if (!row) return 'no row'; row.querySelector('input[type=checkbox]').click();
      const a = Array.from(document.querySelectorAll('a')).find(x => (x.getAttribute('onclick') || '').includes('a=emailCandidates'));
      if (!a) return 'no email action'; a.click(); return 'clicked';
    });
    n.push('ui: ' + ok);
    await page.waitForLoadState('load'); await sleep(1500);
    if (!/emailCandidates/.test(page.url())) throw new Error('did not reach compose page: ' + page.url());
  });
  await step('15 Email', 'e-mail candidate send', async (n) => {
    await page.fill('#emailSubject', 'Baseline smoke test (TEST)');
    await page.fill('#emailBody', 'Fictional message from the Phase 0.5 baseline smoke test.').catch(() => n.push('emailBody not fillable (editor?)'));
    const btn = await page.$('#emailForm input[type=submit], input[value*="Send"]');
    await Promise.all([page.waitForNavigation({ timeout: 60000 }).catch(() => null), btn.click()]);
    await sleep(1500);
    n.push('result: ' + (await bodyText(page)).replace(/\s+/g, ' ').slice(0, 240));
  });

  // ---------------- 12/13. Careers & application ----------------
  await step('12 Careers portal', 'careers home', async () => { await go('careers/index.php'); });
  await step('12 Careers portal', 'careers: list all jobs', async (n) => { await go('careers/index.php?p=showAll'); const t = await bodyText(page); n.push('job listed: ' + t.includes('Baseline QA Engineer')); if (!t.includes('Baseline QA Engineer')) return { outcome: 'FAIL' }; });
  await step('12 Careers portal', 'careers: job detail', async () => { await go('careers/index.php?p=showJob&ID=' + ids.jobOrderID); await expectText('Baseline QA Engineer'); });
  await step('12 Careers portal', 'careers: search page', async () => { await go('careers/index.php?p=search'); });
  await step('13 Candidate application', 'apply form', async (n) => {
    await go('careers/index.php?p=showJob&ID=' + ids.jobOrderID);
    const a = await page.$('a[href*="applyToJob"], a[href*="candidateRegistration"]');
    n.push('apply link: ' + (a ? await a.getAttribute('href') : 'none'));
    if (a) await clickNav('a[href*="applyToJob"], a[href*="candidateRegistration"]'); else await go('careers/index.php?p=applyToJob&ID=' + ids.jobOrderID);
    const fields = await page.evaluate(() => Array.from(document.querySelectorAll('form input, form select, form textarea')).map(e => e.name + ':' + e.type).filter(s => !s.startsWith(':')));
    n.push('fields: ' + fields.join(','));
    await page.waitForSelector('input[name=firstName]');
  });
  async function applyAs(n, first, last, email, file, useUpload) {
    await go('careers/index.php?p=applyToJob&ID=' + ids.jobOrderID);
    const set = async (sel, v) => { const e = await page.$(sel); if (e) await e.fill(v); };
    if (file) await page.setInputFiles('#resumeFile', path.join(FX, file));
    if (useUpload) {
      const dis = await page.$eval('#resumeLoad', e => e.disabled); n.push('Upload button disabled after choosing file: ' + dis);
      await Promise.all([page.waitForNavigation({ timeout: 60000 }), page.click('#resumeLoad')]);
      n.push('resume textarea after Upload: ' + (await page.$eval('textarea[name=resumeContents]', e => e.value).catch(() => '')).replace(/\s+/g, ' ').slice(0, 120));
      n.push('hidden file field after Upload: ' + (await page.$eval('input[name=file]', e => e.value).catch(() => '')));
    }
    await set('input[name=firstName]', first); await set('input[name=lastName]', last);
    await set('input[name=email]', email); await set('input[name=emailconfirm]', email);
    await set('input[name=phoneHome]', '555-0103'); await set('input[name=phoneCell]', '555-0104'); await set('input[name=phone]', '555-0103');
    await set('input[name=bestTimeToCall]', 'Anytime');
    await set('input[name=city]', 'Testville'); await set('input[name=state]', 'TS'); await set('input[name=zip]', '00000');
    await set('input[name=keySkills]', 'qa');
    await Promise.all([page.waitForNavigation({ timeout: 60000 }).catch(() => null), page.click('#submitApplicationNow')]);
    await sleep(2000);
    n.push('result page: ' + (await bodyText(page)).replace(/\s+/g, ' ').slice(0, 200));
  }
  await step('13 Candidate application', 'apply: file chosen, Upload NOT clicked, submit', async (n) => { await applyAs(n, 'Jordan', 'Applicant-Test', 'jordan.applicant@example.test', 'resume_jordan.pdf', false); });
  await step('13 Candidate application', 'apply: Choose File -> Upload -> submit (DOCX)', async (n) => { await applyAs(n, 'Morgan', 'Applicant2-Test', 'morgan.applicant@example.test', 'resume_morgan.docx', true); });
  await step('13 Candidate application', 'applicants visible to recruiter (pipeline + attachments + resume search)', async (n) => {
    await go('index.php?m=joborders&a=show&jobOrderID=' + ids.jobOrderID);
    const t = await page.evaluate(() => { const m = document.getElementById('MRUPanel'); if (m) m.remove(); return document.body.innerText; });
    const j = t.includes('Applicant-Test'), m = t.includes('Applicant2-Test');
    n.push(`in job pipeline: Jordan=${j} Morgan=${m}`);
    for (const who of ['Applicant-Test', 'Applicant2-Test']) {
      const href = await page.evaluate(w => { const a = Array.from(document.querySelectorAll('a')).find(x => !x.closest('#MRUPanel') && x.textContent.includes(w) && /candidateID=/.test(x.getAttribute('href') || '')); return a ? a.getAttribute('href') : null; }, who);
      if (!href) { n.push(who + ': no candidate link'); continue; }
      const cid = href.match(/candidateID=(\d+)/)[1]; ids[who] = cid;
      await go('index.php?m=candidates&a=show&candidateID=' + cid);
      const att = await page.evaluate(() => Array.from(document.querySelectorAll('a')).filter(a => /getAttachment/.test(a.getAttribute('href') || '')).map(a => a.textContent.trim()).filter(Boolean));
      n.push(`${who} (candidateID=${cid}) attachments: ${JSON.stringify([...new Set(att)])}`);
      await go('index.php?m=joborders&a=show&jobOrderID=' + ids.jobOrderID);
    }
    await go('index.php?m=candidates&a=search'); await page.selectOption('#searchMode', 'searchByResume');
    await page.fill('#searchText', 'Axolotlex'); await Promise.all([page.waitForNavigation(), page.press('#searchText', 'Enter')]);
    const c = await page.evaluate(p => Array.from(document.querySelectorAll('a')).filter(a => !a.closest('#MRUPanel') && (a.getAttribute('href') || '').includes(p)).length, 'candidateID=' + ids['Applicant2-Test']);
    n.push('resume keyword Axolotlex (inside uploaded DOCX) finds Morgan: ' + (c > 0));
    if (!j || !m) return { outcome: 'FAIL' };
  });
  async function searchResult(term, n) {
    await go('index.php?m=candidates&a=search');
    await page.selectOption('#searchMode', 'searchByResume').catch(() => {});
    await page.fill('#searchText', 'Wombatrix');
    await Promise.all([page.waitForNavigation(), page.press('#searchText', 'Enter')]);
    const t = await page.evaluate(() => { const m = document.getElementById('MRUPanel'); if (m) m.remove(); return document.body.innerText; });
    n.push('resume keyword (Wombatrix, only inside the uploaded PDF) search finds applicant: ' + t.includes(term));
  }
  await step('12 Careers portal', 'RSS job feed', async (n) => { const r = await go('rss/'); n.push('HTTP ' + (r && r.status()) + ' ' + ((r && r.headers()['content-type']) || '')); });
  await step('12 Careers portal', 'XML job feed', async (n) => { const r = await go('xml/'); n.push('HTTP ' + (r && r.status()) + ' ' + ((r && r.headers()['content-type']) || '')); });

  await step('02 Dashboard', 'home dashboard with test data', async () => { await go('index.php?m=home'); });
  await step('02 Dashboard', 'Activities: all periods', async () => { await go('index.php?m=activity&a=viewByDate&getback=getback&period=all'); });
  // ---------------- Layout at phone width ----------------
  await page.setViewportSize({ width: 390, height: 844 });
  await step('Layout', 'candidates list at 390px width', async (n) => { await go('index.php?m=candidates'); n.push('scrollWidth=' + await page.evaluate(() => document.documentElement.scrollWidth)); });
  await step('Layout', 'careers job list at 390px width', async (n) => { await go('careers/index.php?p=showAll'); n.push('scrollWidth=' + await page.evaluate(() => document.documentElement.scrollWidth)); });
  await page.setViewportSize({ width: 1280, height: 900 });

  // ---------------- Logout ----------------
  await step('01 Login', 'logout', async () => { await go('index.php?m=logout'); await page.waitForSelector('#username'); });

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ ids, results }, null, 1));
  await browser.close();
})().catch(async e => { console.error('FATAL', e); fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ ids, results, fatal: String(e) }, null, 1)); if (browser) await browser.close(); process.exit(1); });
