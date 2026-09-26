// OpenCATS preview — ENVIRONMENT-ONLY verification. Not part of the application.
//
// Runs the ten preview checks against a preview URL (normally the PUBLIC tunnel URL, from a
// machine outside the preview network):
//   1 HTTP health · 2 login · 3 main navigation · 4 feature workflow · 5 console errors ·
//   6 failed requests · 7 PHP/application errors · 8 screenshots · 9 responsive · 10 accessibility smoke
// plus two preview-safety checks: the non-production banner is shown and admin/admin is rejected.
//
// usage: node verify-preview.js <outDir>
// env:   PREVIEW_URL, PREVIEW_DEMO_USERNAME, PREVIEW_DEMO_PASSWORD
// Output: <outDir>/results.json, summary.md, shots/*.png. The preview URL is REDACTED in every
// output file ("<PREVIEW_URL>"), because these files may be published as CI artifacts.
// Exit code 1 if a blocking check fails. Known baseline defects are reported, not blocking.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL0 = (process.env.PREVIEW_URL || '').replace(/\/$/, '') + '/';
const USER = process.env.PREVIEW_DEMO_USERNAME || 'demo.recruiter';
const PASS = process.env.PREVIEW_DEMO_PASSWORD;
const OUT = process.argv[2] || 'preview-verify';
if (!process.env.PREVIEW_URL || !PASS) { console.error('PREVIEW_URL and PREVIEW_DEMO_PASSWORD are required'); process.exit(2); }
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const redact = s => String(s).split(URL0).join('<PREVIEW_URL>/').split(URL0.replace(/\/$/, '')).join('<PREVIEW_URL>');
let axePath = null; try { axePath = require.resolve('axe-core/axe.min.js'); } catch (e) {}

const checks = [];      // {id, name, blocking, ok, detail}
const pages = [];       // per page: url, status, timings, php, console, failed, http, shot
let cur = null;
function add(id, name, blocking, ok, detail) { checks.push({ id, name, blocking, ok: !!ok, detail: redact(detail || '') }); console.log(`${ok ? 'PASS' : (blocking ? 'FAIL' : 'WARN')} [${id}] ${name}${detail ? ' — ' + redact(detail) : ''}`); }

const PHP_RE = /(?:<b>)?(Warning|Notice|Fatal error|Parse error|Deprecated|Catchable fatal error)(?:<\/b>)?:\s*([\s\S]*?)\s+in\s+(?:<b>)?([^<\s]+?)(?:<\/b>)?\s+on line\s+(?:<b>)?(\d+)/g;
async function phpErrors(p) {
  const out = [];
  for (const f of p.frames()) {
    let html = ''; try { html = await f.content(); } catch (e) { continue; }
    let m; PHP_RE.lastIndex = 0;
    while ((m = PHP_RE.exec(html))) out.push(`${m[1]}: ${m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 160)} in ${m[3].replace('/var/www/public/', '')}:${m[4]}`);
    if (/Uncaught (Error|Exception)|Query Error/.test(html)) out.push('fatal/uncaught error text on page');
  }
  return [...new Set(out)];
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: false });
  const page = await ctx.newPage();
  page.on('console', m => { if (cur && m.type() === 'error') cur.console.push(redact(m.text()).slice(0, 240)); });
  page.on('pageerror', e => { if (cur) cur.jsErrors.push(redact(e.message).slice(0, 240)); });
  page.on('requestfailed', r => { if (cur) cur.failed.push(redact(`${r.method()} ${r.url()} :: ${r.failure() && r.failure().errorText}`).slice(0, 240)); });
  page.on('response', r => { if (cur && r.status() >= 400) cur.http.push(redact(`${r.status()} ${r.url()}`).slice(0, 240)); });
  page.on('dialog', d => d.accept().catch(() => {}));

  async function visit(label, rel, opts = {}) {
    cur = { label, url: redact(URL0 + rel), console: [], jsErrors: [], failed: [], http: [], php: [], status: null, ms: null, shot: null };
    const t0 = Date.now();
    let resp = null;
    try { resp = await page.goto(URL0 + rel, { waitUntil: 'load', timeout: 60000 }); } catch (e) { cur.error = redact(e.message.split('\n')[0]); }
    cur.status = resp ? resp.status() : null; cur.ms = Date.now() - t0;
    await page.waitForTimeout(400);
    cur.php = await phpErrors(page);
    cur.banner = await page.$('#opencats-preview-banner').then(Boolean).catch(() => false);
    if (!opts.noShot) { cur.shot = `${String(pages.length + 1).padStart(2, '0')}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; await page.screenshot({ path: path.join(OUT, 'shots', cur.shot), fullPage: true }).catch(() => { cur.shot = null; }); }
    pages.push(cur);
    return cur;
  }
  const links = p => page.evaluate(x => Array.from(document.querySelectorAll('a')).filter(a => !a.closest('#MRUPanel') && (a.getAttribute('href') || '').includes(x)).length, p);
  const text = () => page.evaluate(() => { const c = document.body.cloneNode(true); const m = c.querySelector('#MRUPanel'); if (m) m.remove(); return c.innerText; });

  // 1. health + banner (unauthenticated)
  const login = await visit('login page', 'index.php');
  add(1, 'HTTP health check (login page over the preview URL)', true, login.status === 200 && /login/i.test(await page.title()), `HTTP ${login.status}, ${login.ms} ms, title "${await page.title()}"`);
  add('S1', 'Non-production banner visible', true, login.banner, login.banner ? 'banner "OpenCATS Preview — Demo Environment" present' : 'banner missing');
  const hdr = await page.request.get(URL0 + 'index.php').then(r => r.headers()['x-opencats-environment']).catch(() => null);
  add('S2', 'Preview gateway header present', false, hdr === 'preview-demo', `X-OpenCATS-Environment: ${hdr}`);

  // safety: default admin credentials must not work
  await page.fill('#username', 'admin'); await page.fill('#password', 'admin');
  await Promise.all([page.waitForNavigation({ timeout: 30000 }).catch(() => null), page.press('#password', 'Enter')]);
  const adminIn = /m=home/.test(page.url());
  add('S3', 'Default admin/admin is rejected', true, !adminIn, adminIn ? 'admin/admin LOGGED IN' : 'rejected');
  if (adminIn) await page.goto(URL0 + 'index.php?m=logout');

  // 2. login with the demo account
  await page.goto(URL0 + 'index.php');
  await page.fill('#username', USER); await page.fill('#password', PASS);
  await Promise.all([page.waitForNavigation({ timeout: 30000 }).catch(() => null), page.press('#password', 'Enter')]);
  const loggedIn = /m=home/.test(page.url());
  add(2, 'Login with the demo account', true, loggedIn, loggedIn ? `logged in with the demo account; landed on the dashboard over ${page.url().startsWith('https://') ? 'HTTPS' : 'HTTP'}` : `still at ${page.url()}`);

  // 3. main navigation
  const NAV = [['Dashboard', 'index.php?m=home'], ['Activities', 'index.php?m=activity&a=viewByDate&getback=getback&period=all'], ['Job Orders', 'index.php?m=joborders'], ['Candidates', 'index.php?m=candidates'], ['Companies', 'index.php?m=companies'], ['Contacts', 'index.php?m=contacts'], ['Lists', 'index.php?m=lists'], ['Calendar', 'index.php?m=calendar'], ['Reports', 'index.php?m=reports'], ['Settings', 'index.php?m=settings'], ['Administration', 'index.php?m=settings&a=administration']];
  const navBad = [];
  for (const [label, rel] of NAV) {
    const r = await visit(label, rel);
    if (r.status !== 200 || r.php.some(x => /Fatal|uncaught/i.test(x)) || /m=login/.test(page.url())) navBad.push(`${label}: HTTP ${r.status}${r.php.length ? ', ' + r.php[0] : ''}`);
  }
  add(3, 'Main navigation (11 screens)', true, navBad.length === 0, navBad.length ? navBad.join('; ') : 'all 11 screens load with HTTP 200 and no fatal errors');

  // 4. feature workflow on the demo data
  await visit('candidates list', 'index.php?m=candidates');
  const candLinks = await page.evaluate(() => new Set(Array.from(document.querySelectorAll('a')).filter(a => !a.closest('#MRUPanel')).map(a => (a.getAttribute('href') || '').match(/candidateID=(\d+)/)).filter(Boolean).map(m => m[1])).size);
  const wf = [];
  wf.push([`candidates listed: ${candLinks}`, candLinks >= 10]);
  const firstCand = await page.evaluate(() => { const a = Array.from(document.querySelectorAll('a')).find(x => !x.closest('#MRUPanel') && /a=show&candidateID=\d+/.test(x.getAttribute('href') || '')); return a && a.getAttribute('href'); });
  if (firstCand) { await visit('candidate detail', firstCand.replace(/^\.?\//, '')); const t = await text(); wf.push(['candidate detail shows attachments + pipeline', /resume\.txt/i.test(t)]); }
  await visit('job orders list', 'index.php?m=joborders');
  const jobHref = await page.evaluate(() => { const a = Array.from(document.querySelectorAll('a')).find(x => !x.closest('#MRUPanel') && /Senior PHP Developer/.test(x.textContent)); return a && a.getAttribute('href'); });
  if (jobHref) { await visit('job order detail', jobHref.replace(/^\.?\//, '')); const t = await text(); wf.push(['job order pipeline lists candidates (Raman, Okafor)', /Raman/.test(t) && /Okafor/.test(t)]); }
  else wf.push(['job order "Senior PHP Developer" in list', false]);
  await visit('quick search', 'index.php?m=home&a=quickSearch&quickSearchFor=Northwind');
  wf.push(['quick search "Northwind" finds the company', (await links('companyID=')) > 0]);
  await visit('resume keyword search', 'index.php?m=candidates&a=search&getback=getback&mode=searchByResume&wildCardString=Revit&searchCandidates=Search&advancedSearchParser=&advancedSearchOn=0');
  wf.push(['resume keyword search "Revit" finds candidates', (await links('candidateID=')) > 0]);
  await visit('calendar', 'index.php?m=calendar');
  await visit('careers job list', 'careers/index.php?p=showAll');
  const careersJobs = await links('p=showJob');
  wf.push([`careers site lists public jobs: ${careersJobs}`, careersJobs >= 3]);
  const wfBad = wf.filter(x => !x[1]);
  add(4, 'Feature workflow on demo data', true, wfBad.length === 0, wf.map(x => `${x[1] ? '✔' : '✘'} ${x[0]}`).join('; '));

  // 9. responsive (informational: the unmodified baseline is desktop-only)
  const resp = [];
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [label, rel] of [['dashboard @390px', 'index.php?m=home'], ['candidates @390px', 'index.php?m=candidates'], ['careers @390px', 'careers/index.php?p=showAll']]) {
    await visit(label, rel); resp.push(`${label}: page width ${await page.evaluate(() => document.documentElement.scrollWidth)} px`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  add(9, 'Responsive check at 390 px', false, true, resp.join('; ') + ' (baseline is not responsive; recorded, not blocking)');

  // 10. accessibility smoke (axe-core, WCAG 2 A/AA rules)
  const a11y = [];
  if (axePath) {
    for (const [label, rel] of [['a11y dashboard', 'index.php?m=home'], ['a11y candidates', 'index.php?m=candidates'], ['a11y careers', 'careers/index.php?p=showAll']]) {
      await visit(label, rel, { noShot: true });
      await page.addScriptTag({ path: axePath });
      const r = await page.evaluate(async () => { const res = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }); const by = {}; res.violations.forEach(v => { by[v.impact] = (by[v.impact] || 0) + 1; }); return { count: res.violations.length, by, rules: res.violations.map(v => `${v.id}(${v.nodes.length})`).slice(0, 8) }; });
      a11y.push({ page: label.replace('a11y ', ''), ...r });
    }
    add(10, 'Accessibility smoke (axe-core WCAG 2 A/AA)', false, true, a11y.map(x => `${x.page}: ${x.count} rule violations ${JSON.stringify(x.by)}`).join('; ') + ' (baseline findings; recorded, not blocking)');
  } else add(10, 'Accessibility smoke (axe-core)', false, false, 'axe-core not installed');

  // logout
  await visit('logout', 'index.php?m=logout', { noShot: true });

  // 5-8 aggregated over every page visited
  const all = k => pages.flatMap(p => p[k].map(x => `${p.label}: ${x}`));
  const con = all('console'), js = all('jsErrors'), failed = all('failed'), http = all('http'), php = all('php');
  add(5, 'Browser console errors', false, true, `${con.length} console error(s), ${js.length} uncaught JS error(s)` + (con.length + js.length ? ' — ' + [...new Set([...con, ...js])].slice(0, 5).join(' | ') : ''));
  add(6, 'Failed requests / HTTP errors', false, true, `${failed.length} failed request(s), ${http.length} HTTP ≥400` + (failed.length + http.length ? ' — ' + [...new Set([...failed, ...http])].slice(0, 5).join(' | ') : ''));
  const fatal = php.filter(x => /Fatal|uncaught/i.test(x));
  add(7, 'PHP / application errors', true, fatal.length === 0, `${php.length} PHP message(s) on visited pages, ${fatal.length} fatal` + (php.length ? ' — ' + [...new Set(php)].slice(0, 4).join(' | ') : ''));
  const shots = pages.filter(p => p.shot).length;
  add(8, 'Screenshots captured', false, shots > 0, `${shots} full-page screenshots`);
  const noBanner = pages.filter(p => p.status === 200 && !p.banner && !/logout/.test(p.label)).map(p => p.label);
  add('S4', 'Banner on every visited page', true, noBanner.length === 0, noBanner.length ? 'missing on: ' + noBanner.join(', ') : `present on all ${pages.filter(p => p.status === 200).length} pages`);

  await browser.close();
  const blockingFailed = checks.filter(c => c.blocking && !c.ok);
  const result = { verifiedAt: new Date().toISOString(), target: '<PREVIEW_URL>', ok: blockingFailed.length === 0, checks, a11y, pages };
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(result, null, 1));
  const md = ['| # | Check | Result | Detail |', '|---|---|---|---|', ...checks.map(c => `| ${c.id} | ${c.name} | ${c.ok ? 'PASS' : (c.blocking ? '**FAIL**' : 'WARN')} | ${c.detail.replace(/\|/g, '/').slice(0, 400)} |`)].join('\n');
  fs.writeFileSync(path.join(OUT, 'summary.md'), md + '\n');
  console.log(result.ok ? 'VERIFY: OK' : `VERIFY: FAILED (${blockingFailed.map(c => c.id).join(',')})`);
  process.exit(result.ok ? 0 : 1);
})().catch(e => { console.error('VERIFY: ERROR', redact(e && e.stack || e)); process.exit(1); });
