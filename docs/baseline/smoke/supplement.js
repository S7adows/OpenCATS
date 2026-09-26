const { chromium } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', m => { if (m.type() === 'error') logs.push(m.text().slice(0, 200)); });
  p.on('pageerror', e => logs.push('pageerror: ' + e.message));
  const B = 'http://localhost:8080/';
  await p.goto(B + 'index.php'); await p.fill('#username', 'admin'); await p.fill('#password', 'admin');
  await Promise.all([p.waitForNavigation(), p.press('#password', 'Enter')]);
  const shots = [
    ['S1-job-order-add-form', 'index.php?m=joborders&a=add', 'desktop'],
    ['S2-email-candidate-compose', null, 'desktop'],
    ['S3-careers-apply-form', 'careers/index.php?p=applyToJob&ID=1', 'desktop'],
    ['S4-dashboard-390px', 'index.php?m=home', 'mobile'],
    ['S5-candidate-detail-390px', 'index.php?m=candidates&a=show&candidateID=2', 'mobile'],
    ['S6-login-page-390px', 'LOGOUT', 'mobile'],
  ];
  for (const [name, u, vp] of shots) {
    await p.setViewportSize(vp === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 900 });
    logs.length = 0;
    if (name.startsWith('S2')) {
      await p.goto(B + 'index.php?m=candidates');
      await p.evaluate(() => { const row = Array.from(document.querySelectorAll('tr')).find(r => r.innerText.includes('Baseline-Test') && r.querySelector('input[type=checkbox]')); row.querySelector('input[type=checkbox]').click(); Array.from(document.querySelectorAll('a')).find(x => (x.getAttribute('onclick') || '').includes('a=emailCandidates')).click(); });
      await p.waitForLoadState('load'); await p.waitForTimeout(2500);
    } else if (u === 'LOGOUT') { await p.goto(B + 'index.php?m=logout'); await p.waitForTimeout(500); }
    else { await p.goto(B + u); await p.waitForTimeout(2500); }
    const ck = await p.evaluate(() => ({ ckeditorLoaded: !!window.CKEDITOR, instances: window.CKEDITOR ? Object.keys(CKEDITOR.instances) : [], scrollWidth: document.documentElement.scrollWidth, ckeNotice: !!document.querySelector('.cke_notification, .cke_notifications_area') }));
    await p.screenshot({ path: `${OUT}/shots/${name}.png`, fullPage: true });
    console.log(name, JSON.stringify(ck), logs.length ? 'console: ' + logs.join(' || ') : '');
  }
  await b.close();
})();
