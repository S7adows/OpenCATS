// OpenCATS preview — ENVIRONMENT-ONLY demo data seeder. Not part of the application.
//
// Creates a realistic but entirely FICTIONAL dataset by driving the application's own screens
// and form endpoints (the same requests a recruiter's browser sends), so every row is written by
// the unmodified application code. No real people, companies or addresses are used: e-mail
// addresses use the reserved example.test domain, phone numbers use the 555-01xx range.
//
// Env: PREVIEW_BASE_URL, PREVIEW_ADMIN_PASSWORD, PREVIEW_DEMO_USERNAME, PREVIEW_DEMO_PASSWORD
// Requires the "playwright" package (NODE_PATH) and a Chromium build.
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = (process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '') + '/';
const ADMIN_PW = process.env.PREVIEW_ADMIN_PASSWORD;
const DEMO_USER = process.env.PREVIEW_DEMO_USERNAME || 'demo.recruiter';
const DEMO_PW = process.env.PREVIEW_DEMO_PASSWORD;
if (!ADMIN_PW || !DEMO_PW) { console.error('PREVIEW_ADMIN_PASSWORD and PREVIEW_DEMO_PASSWORD are required'); process.exit(2); }

// ------------------------------------------------------------------ fictional dataset
const COMPANIES = [
  { key: 'northwind', name: 'Northwind Analytics (Demo)', city: 'Austin', state: 'TX', zip: '73301', phone: '555-0100', tech: 'PHP, MySQL, Python, AWS', notes: 'Data and analytics consultancy. Key account.' },
  { key: 'bluepeak', name: 'Bluepeak Health Systems (Demo)', city: 'Denver', state: 'CO', zip: '80014', phone: '555-0110', tech: 'Epic, ICU, telemetry', notes: 'Regional hospital network; high-volume nursing hiring.' },
  { key: 'harborline', name: 'Harborline Logistics (Demo)', city: 'Tacoma', state: 'WA', zip: '98402', phone: '555-0120', tech: 'WMS, TMS, SAP', notes: 'Third-party logistics, two distribution centres.' },
  { key: 'cedar', name: 'Cedar & Stone Architects (Demo)', city: 'Portland', state: 'OR', zip: '97201', phone: '555-0130', tech: 'Revit, AutoCAD, BIM', notes: 'Boutique architecture studio.' },
  { key: 'lumen', name: 'Lumen Retail Group (Demo)', city: 'Chicago', state: 'IL', zip: '60601', phone: '555-0140', tech: 'Retail POS, merchandising', notes: 'Specialty retail chain, 40 stores.' },
];
const CONTACTS = [
  ['northwind', 'Rebecca', 'Holt', 'VP Engineering'], ['northwind', 'Arjun', 'Desai', 'Talent Partner'],
  ['bluepeak', 'Monica', 'Reyes', 'Director of Nursing'], ['bluepeak', 'Peter', 'Lang', 'HR Business Partner'],
  ['harborline', 'Dana', 'Whitfield', 'Operations Manager'], ['harborline', 'Luis', 'Ortega', 'Recruiting Coordinator'],
  ['cedar', 'Helen', 'Park', 'Principal Architect'], ['cedar', 'Owen', 'Burke', 'Studio Manager'],
  ['lumen', 'Tanya', 'Brooks', 'Regional Director'], ['lumen', 'Victor', 'Sato', 'HR Manager'],
];
// type: H = Hire, C = Contract, C2H = Contract to Hire, FL = Freelance (values from config.php JOB_TYPES)
const JOBS = [
  { key: 'php', company: 'northwind', title: 'Senior PHP Developer', city: 'Austin', state: 'TX', type: 'H', openings: 2, salary: '120,000 - 140,000 USD', public: true, description: 'Build and maintain data products in PHP 8 and MySQL. Mentor two junior developers. Hybrid, 2 days in office.' },
  { key: 'analyst', company: 'northwind', title: 'Data Analyst', city: 'Austin', state: 'TX', type: 'H', openings: 1, salary: '85,000 - 95,000 USD', public: true, description: 'SQL, Python and Power BI reporting for client engagements.' },
  { key: 'rn', company: 'bluepeak', title: 'Registered Nurse - ICU', city: 'Denver', state: 'CO', type: 'H', openings: 3, salary: '42 - 55 USD / hour', public: true, description: 'Critical care nursing, 12-hour shifts. BLS and ACLS required.' },
  { key: 'warehouse', company: 'harborline', title: 'Warehouse Operations Supervisor', city: 'Tacoma', state: 'WA', type: 'H', openings: 1, salary: '68,000 - 75,000 USD', public: true, description: 'Lead a team of 25 on the evening shift; WMS experience preferred.' },
  { key: 'dispatch', company: 'harborline', title: 'Fleet Dispatcher', city: 'Seattle', state: 'WA', type: 'C', openings: 2, salary: '28 USD / hour', public: false, description: 'Six-month contract covering peak season dispatch.' },
  { key: 'architect', company: 'cedar', title: 'Junior Architect', city: 'Portland', state: 'OR', type: 'C2H', openings: 1, salary: '65,000 USD', public: true, description: 'Revit production work on residential projects; path to licensure supported.' },
  { key: 'store', company: 'lumen', title: 'Store Manager', city: 'Chicago', state: 'IL', type: 'H', openings: 1, salary: '70,000 USD + bonus', public: false, description: 'Full P&L responsibility for a flagship store.' },
  { key: 'ta', company: null, title: 'Talent Acquisition Partner', city: 'Remote', state: 'US', type: 'H', openings: 1, salary: '80,000 - 90,000 USD', public: true, description: 'Internal role: partner with hiring managers across agency clients.' },
];
const CANDIDATES = [
  ['Priya', 'Raman', 'Austin', 'TX', 'PHP, Laravel, MySQL, REST APIs', 'Northwind-like SaaS'],
  ['Marcus', 'Okafor', 'Dallas', 'TX', 'PHP, Symfony, Docker, AWS', 'FinServ startup'],
  ['Elena', 'Petrova', 'Seattle', 'WA', 'Python, SQL, Tableau, statistics', 'Consulting firm'],
  ['Diego', 'Hernandez', 'Denver', 'CO', 'Registered Nurse, ICU, BLS, ACLS', 'County hospital'],
  ['Hannah', 'Lindqvist', 'Boulder', 'CO', 'ICU nursing, patient care, telemetry', 'University hospital'],
  ['Tomasz', 'Nowak', 'Tacoma', 'WA', 'Warehouse operations, lean, forklift certified', 'Distribution centre'],
  ['Aisha', 'Bello', 'Seattle', 'WA', 'Dispatch, logistics, TMS', 'Courier company'],
  ['Kenji', 'Watanabe', 'Portland', 'OR', 'AutoCAD, Revit, BIM', 'Design studio'],
  ['Sofia', 'Marchetti', 'Portland', 'OR', 'Revit, sustainable design, LEED', 'Architecture firm'],
  ['Jamal', 'Carter', 'Chicago', 'IL', 'Retail management, P&L, scheduling', 'Department store'],
  ['Olivia', 'Brennan', 'Evanston', 'IL', 'Merchandising, team leadership', 'Fashion retailer'],
  ['Rahul', 'Mehta', 'Austin', 'TX', 'Data analysis, Python, Power BI', 'Insurance carrier'],
  ['Grace', 'Kim', 'San Antonio', 'TX', 'Recruiting, sourcing, ATS, interviewing', 'Staffing agency'],
  ['Lucas', 'Moreau', 'Remote', 'US', 'JavaScript, React, PHP', 'E-commerce agency'],
  ['Nadia', 'Haddad', 'Denver', 'CO', 'Nursing, telemetry, step-down', 'Community hospital'],
  ['Samuel', 'Adeyemi', 'Houston', 'TX', 'SQL, ETL, Airflow', 'Energy company'],
  ['Chloe', 'Nguyen', 'Seattle', 'WA', 'Supply chain, SAP, inventory planning', 'Manufacturer'],
  ['Ethan', 'Walsh', 'Chicago', 'IL', 'Store operations, inventory, loss prevention', 'Grocery chain'],
  ['Mei', 'Lin', 'Portland', 'OR', 'Interior architecture, SketchUp, Revit', 'Hospitality design'],
  ['Omar', 'Farouk', 'Dallas', 'TX', 'DevOps, Kubernetes, PHP, CI/CD', 'Hosting provider'],
  ['Isabella', 'Rossi', 'Austin', 'TX', 'UX research, Figma, usability testing', 'Product studio'],
  ['Noah', 'Fischer', 'Denver', 'CO', 'Emergency nursing, triage', 'Trauma centre'],
  ['Amara', 'Diallo', 'Tacoma', 'WA', 'Inventory control, WMS, cycle counts', '3PL provider'],
  ['Ben', 'Schwartz', 'Chicago', 'IL', 'Talent acquisition, employer branding', 'Tech company'],
  ['Yuki', 'Tanaka', 'Seattle', 'WA', 'Data engineering, Spark, SQL', 'Streaming service'],
  ['Carlos', 'Mendes', 'Houston', 'TX', 'Fleet dispatch, route planning', 'Transport company'],
  ['Fatima', 'Zahra', 'Austin', 'TX', 'QA automation, Playwright, PHP', 'SaaS vendor'],
  ["Liam", "O'Connor", 'Chicago', 'IL', 'Retail operations, customer service', 'Electronics retailer'],
  ['Zoe', 'Papadopoulos', 'Chicago', 'IL', 'Visual merchandising, planograms', 'Home goods retailer'],
  ['Victor', 'Alvarez', 'Denver', 'CO', 'Healthcare administration, scheduling', 'Clinic group'],
];
// [candidate last name, job key, final pipeline status, schedule interview?]
const PIPELINES = [
  ['Raman', 'php', 500, true], ['Okafor', 'php', 400], ['Moreau', 'php', 300], ['Farouk', 'php', 200], ['Zahra', 'php', 650], ['Rossi', 'php', 100],
  ['Petrova', 'analyst', 600], ['Mehta', 'analyst', 500, true], ['Adeyemi', 'analyst', 400], ['Tanaka', 'analyst', 700],
  ['Hernandez', 'rn', 800], ['Lindqvist', 'rn', 500, true], ['Haddad', 'rn', 400], ['Fischer', 'rn', 250], ['Alvarez', 'rn', 650],
  ['Nowak', 'warehouse', 600], ['Diallo', 'warehouse', 400], ['Nguyen', 'warehouse', 200],
  ['Bello', 'dispatch', 500], ['Mendes', 'dispatch', 300],
  ['Watanabe', 'architect', 800], ['Marchetti', 'architect', 400], ['Lin', 'architect', 500, true],
  ['Carter', 'store', 400], ['Brennan', 'store', 300], ['Walsh', 'store', 700], ['Papadopoulos', 'store', 100],
  ['Kim', 'ta', 500], ['Schwartz', 'ta', 400],
];
const STEP_NOTES = {
  200: [100, 'Intro call: interested, available in 4 weeks.'],
  250: [200, 'Candidate replied by e-mail with updated availability.'],
  300: [500, 'Screening call: meets must-have requirements.'],
  400: [200, 'Profile submitted to the hiring manager.'],
  500: [300, 'First interview arranged with the hiring team.'],
  600: [400, 'Verbal offer extended; waiting for decision.'],
  650: [400, 'Not moving forward: skills gap for this role.'],
  700: [200, 'Client declined after reviewing the profile.'],
  800: [400, 'Offer accepted; start date confirmed.'],
};
function pathTo(status) {
  if (status === 100) return [];
  if (status === 250) return [200, 250];
  if (status === 650 || status === 700) return [200, 400, status];
  return [200, 300, 400, 500, 600, 800].filter(s => s <= status);
}
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function mdy(d) { return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '-' + String(d.getFullYear()).slice(2); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept().catch(() => {}));
  const go = async u => { const r = await page.goto(BASE + u, { waitUntil: 'load' }); if (!r || r.status() >= 400) throw new Error(`GET ${u} -> ${r && r.status()}`); return r; };
  const submit = async sel => { await Promise.all([page.waitForNavigation({ timeout: 30000 }), page.click(sel)]); };
  const idFrom = (re) => { const m = page.url().match(re); if (!m) throw new Error('id not found in ' + page.url()); return m[1]; };
  async function login(user, pw) {
    await go('index.php?m=logout').catch(() => {});
    await go('index.php');
    await page.fill('#username', user); await page.fill('#password', pw);
    await Promise.all([page.waitForNavigation(), page.press('#password', 'Enter')]);
    if (!/m=home/.test(page.url())) throw new Error('login failed for ' + user);
  }
  const log = (...a) => console.log('[seed]', ...a);

  // 1. As the built-in administrator: demo user, site name, careers website.
  await login('admin', ADMIN_PW);
  await go('index.php?m=settings&a=addUser');
  await page.fill('input[name=firstName]', 'Demo'); await page.fill('input[name=lastName]', 'Recruiter');
  await page.fill('input[name=email]', 'demo.recruiter@example.test'); await page.fill('input[name=username]', DEMO_USER);
  await page.fill('input[name=password]', DEMO_PW); await page.fill('input[name=retypePassword]', DEMO_PW);
  await page.check('input[name=accessLevel][value="400"]');   // Site Administrator: can use every module incl. Settings
  await submit('#addUserForm #submit');
  log('demo user created:', DEMO_USER, '(access level 400 / Site Administrator)');

  await go('index.php?m=settings&a=administration&s=siteName');
  await page.fill('#siteName', 'OpenCATS Preview (Demo)');
  await submit('#changeSiteNameForm input[name=save]');

  await go('index.php?m=settings&a=careerPortalSettings');
  const enabled = await page.$('input[name=enabled]');
  if (!(await enabled.isChecked())) { await Promise.all([page.waitForNavigation({ timeout: 30000 }).catch(() => null), enabled.click()]); await sleep(1000); }
  log('site renamed; careers website enabled');

  // 2. Everything else as the demo user, so the demo user's dashboard, calls and events are populated.
  await login(DEMO_USER, DEMO_PW);
  const companyIDs = {};
  for (const c of COMPANIES) {
    await go('index.php?m=companies&a=add');
    await page.fill('input[name=name]', c.name); await page.fill('input[name=phone1]', c.phone);
    await page.fill('input[name=city]', c.city); await page.fill('input[name=state]', c.state); await page.fill('input[name=zip]', c.zip);
    await page.fill('input[name=url]', `https://${c.key}.example.test`); await page.fill('input[name=keyTechnologies]', c.tech);
    await page.fill('textarea[name=notes]', c.notes + ' (fictional demo company)');
    await submit('#addCompanyForm input[type=submit]');
    companyIDs[c.key] = idFrom(/companyID=(\d+)/);
  }
  log('companies:', Object.keys(companyIDs).length);

  let n = 0;
  for (const [ck, first, last, title] of CONTACTS) {
    const c = COMPANIES.find(x => x.key === ck);
    await go('index.php?m=contacts&a=add');
    await page.fill('input[name=firstName]', first); await page.fill('input[name=lastName]', last);
    // Equivalent of picking the company in the autocomplete list (it fills these two fields).
    await page.evaluate(([id, name]) => { document.getElementById('companyID').value = id; document.getElementById('companyName').value = name; }, [companyIDs[ck], c.name]);
    await page.fill('input[name=title]', title);
    await page.fill('input[name=email1]', `${slug(first)}.${slug(last)}@${ck}.example.test`);
    await page.fill('input[name=phoneWork]', `555-01${String(50 + n).padStart(2, '0')}`);
    await page.fill('input[name=city]', c.city); await page.fill('input[name=state]', c.state);
    await submit('#addContactForm input[type=submit]');
    n++;
  }
  log('contacts:', n);

  const jobIDs = {};
  for (const j of JOBS) {
    await go('index.php?m=joborders&a=add' + (j.company ? '&selected_company_id=' + companyIDs[j.company] : ''));
    await page.fill('input[name=title]', j.title);
    if (!j.company) { const internal = await page.$('#defaultCompany'); if (internal) await internal.check(); }
    await page.fill('input[name=city]', j.city); await page.fill('input[name=state]', j.state);
    await page.fill('input[name=openings]', String(j.openings)); await page.fill('input[name=salary]', j.salary);
    const types = await page.$$eval('select[name=type] option', os => os.map(o => o.value));
    if (types.includes(j.type)) await page.selectOption('select[name=type]', j.type);
    if (j.public) await page.check('input[name=public]');
    await page.evaluate(d => { const t = document.querySelector('textarea[name=description]'); if (window.CKEDITOR && CKEDITOR.instances.description) CKEDITOR.instances.description.setData(d); else if (t) t.value = d; }, j.description + ' (Fictional demo job.)');
    await submit('#addJobOrderForm input[type=submit]');
    jobIDs[j.key] = idFrom(/jobOrderID=(\d+)/);
  }
  log('job orders:', Object.keys(jobIDs).length, '(public:', JOBS.filter(j => j.public).length + ')');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oc-demo-'));
  const candIDs = {};
  let i = 0;
  for (const [first, last, city, state, skills, employer] of CANDIDATES) {
    await go('index.php?m=candidates&a=add');
    await page.fill('input[name=firstName]', first); await page.fill('input[name=lastName]', last);
    await page.fill('input[name=email1]', `${slug(first)}.${slug(last)}@example.test`);
    await page.fill('input[name=phoneCell]', `555-01${String(i).padStart(2, '0')}`);
    await page.fill('input[name=city]', city); await page.fill('input[name=state]', state);
    await page.fill('input[name=keySkills]', skills);
    await page.fill('input[name=currentEmployer]', employer + ' (fictional)');
    await page.fill('textarea[name=notes]', 'Fictional demo candidate created for the OpenCATS preview.');
    await submit('#addCandidateForm input[type=submit]');
    const cid = idFrom(/candidateID=(\d+)/);
    candIDs[last] = cid;
    // Plain-text resume attachment (text is indexed, so resume keyword search works).
    const file = path.join(tmp, `${slug(first)}_${slug(last)}_resume.txt`);
    fs.writeFileSync(file, `${first} ${last} - FICTIONAL DEMO RESUME\n${city}, ${state} | ${slug(first)}.${slug(last)}@example.test\n\nSummary\nExperienced professional. Skills: ${skills}.\n\nExperience\n2019-present  ${employer} (fictional)\n2015-2019     Previous role (fictional)\n\nThis document is synthetic test data.\n`);
    await go('index.php?m=candidates&a=createAttachment&candidateID=' + cid);
    await page.setInputFiles('input[type=file]', file);
    await Promise.all([page.waitForLoadState('load'), page.click('input[type=submit]')]);
    await sleep(300);
    i++;
  }
  log('candidates:', i, 'with resume attachments');

  // Pipelines and status history through the same endpoints the "Add to pipeline" and
  // "Log an Activity / Change Status" pop-ups submit to.
  let steps = 0, events = 0;
  const day = new Date(); day.setHours(0, 0, 0, 0);
  for (const [last, jobKey, status, interview] of PIPELINES) {
    const cid = candIDs[last], jid = jobIDs[jobKey];
    const r = await page.request.get(BASE + `index.php?m=joborders&a=addToPipeline&getback=getback&jobOrderID=${jid}&candidateID=${cid}`);
    if (r.status() >= 400) throw new Error('addToPipeline failed ' + r.status());
    for (const s of pathTo(status)) {
      const [activityTypeID, note] = STEP_NOTES[s];
      const form = { postback: 'postback', candidateID: cid, regardingID: jid, statusID: String(s), changeStatus: 'on', addActivity: 'on', activityTypeID: String(activityTypeID), activityNote: note };
      if (interview && s === 500) {
        const d = new Date(day); d.setDate(d.getDate() + 1 + events * 2);
        const [hour, meridiem] = [['9', 'AM'], ['10', 'AM'], ['11', 'AM'], ['2', 'PM']][events % 4];
        Object.assign(form, { scheduleEvent: 'on', eventTypeID: '400', dateAdd: mdy(d), allDay: '0', hour, minute: '30', meridiem, duration: '60', publicEntry: 'on', title: `Interview: ${last} (${JOBS.find(j => j.key === jobKey).title})`, description: 'Fictional interview (demo).' });
        events++;
      }
      const res = await page.request.post(BASE + 'index.php?m=candidates&a=addActivityChangeStatus', { form });
      if (res.status() >= 400) throw new Error('status change failed ' + res.status());
      steps++;
    }
  }
  log('pipelines:', PIPELINES.length, 'status changes:', steps, 'interviews scheduled:', events);

  // One general calendar entry through the Calendar screen.
  await go('index.php?m=calendar');
  await page.evaluate(() => userCalendarAddEvent());
  await sleep(500);
  await page.fill('#addEventForm input[name=title]', 'Weekly hiring sync (demo)');
  await page.selectOption('#addEventForm select[name=type]', '300');
  const timed = await page.$$('#addEventForm input[name=allDay]'); if (timed.length > 1) await timed[1].check();
  await page.selectOption('#addEventForm select[name=hour]', '4').catch(() => {});
  await page.selectOption('#addEventForm select[name=minute]', '00').catch(() => {});
  await page.selectOption('#addEventForm select[name=meridiem]', 'PM').catch(() => {});
  await page.fill('#addEventForm textarea[name=description]', 'Fictional recurring team meeting.');
  await submit('#addEventForm input[type=submit]');

  await go('index.php?m=logout');
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  log('done: companies', COMPANIES.length, '| contacts', CONTACTS.length, '| jobs', JOBS.length, '| candidates', CANDIDATES.length, '| pipelines', PIPELINES.length);
})().catch(e => { console.error('[seed] FAILED:', e && e.stack || e); process.exit(1); });
