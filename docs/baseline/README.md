# Phase 0.5 — Baseline of the current OpenCATS

The current application (commit `f50734a`; application files identical to `d607279`, OpenCATS 0.9.7.4) was run **as is** in an isolated Docker environment and smoke-tested. Nothing in the application was changed, fixed, upgraded or merged.

**Result:** it runs on PHP 7.2.16 + nginx 1.17.3 + MariaDB 10.7.8 using the empty-database install path. 14 of 15 tested areas are usable; e-mail sending could not be verified and fails with uncaught PHP fatal errors; the demo-data install path is unusable on PHP 7.2.

| Document | Contents |
|---|---|
| [ENVIRONMENT.md](ENVIRONMENT.md) | Minimum environment the repo expects, exact versions/digests used, environment-only deviations E1–E8 |
| [INSTALLATION.md](INSTALLATION.md) | How it was installed (one command), install paths tried, test data |
| [RUNBOOK.md](RUNBOOK.md) | Start/stop/reset, logs, running the smoke test, troubleshooting |
| [SMOKE_TEST.md](SMOKE_TEST.md) | Checklist *Feature \| Works \| Broken \| Error \| Notes* for the 15 areas, totals, method |
| [KNOWN_RUNTIME_ERRORS.md](KNOWN_RUNTIME_ERRORS.md) | RT-01…RT-17 with evidence, by category (PHP, JS, console, server, DB, links, layout, assets, performance) |
| [CURRENT_UI_MAP.md](CURRENT_UI_MAP.md) | Screens, URLs, popups and interaction patterns as observed |
| [CURRENT_SYSTEM_SCREENSHOTS.md](CURRENT_SYSTEM_SCREENSHOTS.md) | Index of the 100 screenshots |

| Folder | Contents |
|---|---|
| `env/` | Environment-only tooling: `baseline-up.sh`, `baseline-down.sh`, `docker-compose.yml`, `php-conf/zz-baseline.ini`, `seed_install.php` (never copied into the application) |
| `smoke/` | Playwright harness (`smoke.js`, `supplement.js`, `crawl.js`) and synthetic resume fixtures |
| `evidence/` | Final-run results and logs, demo-data-path failure, unseeded-database behaviour |
| `screenshots/` | Full-page PNGs referenced by the documents |
