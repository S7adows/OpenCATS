# Baseline Runbook — operating the current OpenCATS locally (Phase 0.5)

Environment-only operations for the baseline stack described in `ENVIRONMENT.md` and installed per `INSTALLATION.md`. Nothing here modifies application code or `config.php`.

## Quick reference

| Item | Value |
|---|---|
| Start (fresh) | `docs/baseline/env/baseline-up.sh <work-dir> [port]` (default port 8080) |
| Stop + delete DB | `docs/baseline/env/baseline-down.sh <work-dir>` |
| Recruiter app | `http://localhost:<port>/` → login **admin / admin** |
| Careers site | `http://localhost:<port>/careers/` — shows a blank page ("Job Board Disabled" HTML comment) until *Settings → Administration → Careers Website → enable* is ticked |
| XML job feed | `http://localhost:<port>/xml/` |
| RSS feed | `http://localhost:<port>/rss/` — currently a PHP fatal error (RT-05) |
| Compose project | `opencats-baseline` (override with `OPENCATS_BASELINE_PROJECT`) |
| Services | `php` (PHP-FPM 7.2.16), `web` (nginx 1.17.3, port mapping), `db` (MariaDB 10.7.8) |
| DB access | `docker compose -p opencats-baseline -f docs/baseline/env/docker-compose.yml exec db mysql -ucats -ppassword cats_dev` |
| PHP error log | `<work-dir>/logs/php/php_errors.log` |
| nginx access/error log | `docker compose … logs web` |
| MariaDB log | `docker compose … logs db` |

For every `docker compose` command, export the same variables the scripts use:

```bash
export OPENCATS_APP_DIR=<work-dir>/app OPENCATS_LOG_DIR=<work-dir>/logs OPENCATS_PORT=8080
DC="docker compose -p opencats-baseline -f docs/baseline/env/docker-compose.yml"
```

## Routine operations

| Task | Command |
|---|---|
| Status | `$DC ps` |
| Stop without losing data | `$DC stop` / resume with `$DC start` |
| Tail PHP errors | `tail -f $OPENCATS_LOG_DIR/php/php_errors.log` |
| Tail FPM worker stderr (e.g. document-conversion tool errors) | `$DC logs -f php` |
| Snapshot DB | `$DC exec -T db mysqldump -uroot -proot cats_dev > snapshot.sql` |
| Restore DB | `$DC exec -T db mysql -uroot -proot -e "DROP DATABASE cats_dev; CREATE DATABASE cats_dev; GRANT ALL ON cats_dev.* TO 'cats'@'%';" && $DC exec -T db mysql -uroot -proot cats_dev < snapshot.sql` |
| Reset uploaded files | delete the `site_*` folders under `<work-dir>/app/attachments/` and the sub-folders of `<work-dir>/app/upload/` (keep the `.htaccess`/`index.php` files) |
| Confirm `config.php` untouched | `sha256sum config.php <work-dir>/app/config.php` → both `3e12f172…c2e0` |
| Rebuild from scratch | `baseline-down.sh <work-dir>`, delete `<work-dir>`, run `baseline-up.sh` again |

## Running the smoke test

Prerequisites: Node 18+ and Playwright with a Chromium build (`npm i -g playwright`; in this session Chromium was pre-installed under `/opt/pw-browsers`). The harness expects the app at `http://localhost:8080/` and a **freshly installed** database (it creates records with fixed names and expects IDs such as the first job order).

```bash
cd docs/baseline/smoke
NODE_PATH=$(npm root -g) node smoke.js /tmp/opencats-smoke-out "$PWD/fixtures"        # ~100 s, 94 steps
NODE_PATH=$(npm root -g) node supplement.js /tmp/opencats-smoke-out                    # extra screenshots (S1–S6); run after smoke.js
```

Output: `results.json` (per step: URL, navigation timing, PHP errors found in the HTML of every frame, JS page errors, console errors/warnings, failed requests, HTTP ≥ 400 responses, broken images, dialogs, notes) and full-page screenshots in `shots/`. The harness never edits application files; it only drives the UI.

`crawl.js` (read-only) lists the links of every main tab; it was used to build `CURRENT_UI_MAP.md`.

To reproduce the exact final run: restore the post-install snapshot, clear uploads, truncate the PHP log, then run `smoke.js`.

## Troubleshooting (observed in this baseline)

| Symptom | Cause | What to do (environment only) |
|---|---|---|
| Every page shows the installer | `INSTALL_BLOCK` missing in the runtime copy | `touch <work-dir>/app/INSTALL_BLOCK` |
| Login page with many `mysqli_fetch_assoc()` warnings | App started before the DB was seeded (RT-02) | Reset DB, run seeding steps 5a–5c |
| `Call to undefined function mysql_real_escape_string()` on every page | Demo data was loaded (RT-01) | Reset DB and use the empty install path |
| Careers URL shows a blank page | Careers website disabled by default | Enable it in Settings → Careers Website (application setting stored in the DB) |
| E-mail actions end in "Fatal error: Uncaught PHPMailer\…\Exception: SMTP Error" | No SMTP server at `localhost:587` (committed config) | Expected in this baseline; do not point it at a real mail server with real addresses |
| Job-order PDF report returns an FPDF image error | Server-side fetch of `http://<Host>/…` not reachable from the PHP container (RT-09) | Expected in the two-container topology; for a one-off check send the request with `Host: web` and the session cookie |
| MariaDB not ready / seeding fails to connect | The MariaDB entrypoint runs a temporary server first | Wait for `port: 3306` in `$DC logs db` before seeding (the script does this) |
| Composer 403 from `api.github.com` | Session-specific GitHub scope (E8) | Use `COMPOSER_FLAGS=--prefer-source` with proxy settings (see `INSTALLATION.md` §2) |

## Safety rules for this baseline

- Test data only; every address uses `example.test`. Never connect this stack to a production database or a real SMTP relay.
- Do not run the web installer against this runtime copy — it rewrites `config.php`.
- Do not "fix" errors in the runtime copy; this stack exists to reproduce current behaviour.
