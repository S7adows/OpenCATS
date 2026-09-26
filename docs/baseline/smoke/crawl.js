const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const base = 'http://localhost:8080/';
  await p.goto(base + 'index.php');
  await p.fill('#username', 'admin'); await p.fill('#password', 'admin');
  await Promise.all([p.waitForNavigation(), p.press('#password', 'Enter')]);
  const pages = ['index.php?m=home','index.php?m=activity','index.php?m=joborders','index.php?m=candidates','index.php?m=companies','index.php?m=contacts','index.php?m=lists','index.php?m=calendar','index.php?m=reports','index.php?m=settings','index.php?m=settings&a=administration','index.php?m=import'];
  const out = {};
  for (const u of pages) {
    await p.goto(base + u);
    out[u] = await p.evaluate(() => {
      const seen = new Set(); const res = [];
      for (const a of document.querySelectorAll('a')) {
        const h = a.getAttribute('href') || ''; const oc = a.getAttribute('onclick') || '';
        const t = (a.textContent || a.title || (a.querySelector('img') && a.querySelector('img').alt) || '').trim().replace(/\s+/g,' ');
        const key = t + '|' + h + '|' + oc.slice(0,120);
        if (seen.has(key)) continue; seen.add(key);
        if (/m=|showPopWin|javascript/.test(h + oc)) res.push({t, h, oc: oc.slice(0,160)});
      }
      return {title: document.title, links: res};
    });
  }
  fs.writeFileSync('crawl.json', JSON.stringify(out, null, 1));
  for (const [u, v] of Object.entries(out)) {
    console.log('\n## ' + u + ' — ' + v.title);
    for (const l of v.links) if (!/m=(home|activity|joborders|candidates|companies|contacts|lists|calendar|reports|settings|logout)$/.test(l.h) ) console.log(' - ' + l.t.slice(0,50) + ' | ' + l.h.slice(0,110) + (l.oc ? ' | ' + l.oc.slice(0,110) : ''));
  }
  await b.close();
})();
