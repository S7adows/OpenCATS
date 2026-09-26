# Baseline Installation — how the current OpenCATS was brought up (Phase 0.5)

**Result: the application runs.** Login, dashboard and all main modules load on PHP 7.2.16 / nginx 1.17.3 / MariaDB 10.7.8 using the **empty-database** install path. The **demo-data** install path does **not** produce a usable application on PHP 7.2 (details in §5).

Everything below is environment-only. No tracked application file was modified; `config.php` is used exactly as committed (see `ENVIRONMENT.md` §3 for the list of deviations E1–E8).

---

## 1. One-command install (what to use)

```bash
# from the repository root; needs Docker + docker compose; <work-dir> must not contain an "app" folder yet
docs/baseline/env/baseline-up.sh /tmp/opencats-baseline 8080
# → http://localhost:8080/   login: admin / admin
```

The script was verified end-to-end on a second, independent stack (port 8081): it produced the same schema and seed rows as the stack used for the smoke test and a working login → dashboard. The only differences between the two databases were login-history rows, saved grid-column preferences and the `site.page_views` counter — all written by browsing.

What it does, in order:

| Step | Action | Mirrors |
|---|---|---|
| 1 | `git archive HEAD` into `<work-dir>/app` (runtime copy; the git working tree is never mounted) | — |
| 2 | `composer install --no-dev` from `composer.lock` inside `opencats/php-base:7.2-fpm-alpine` (Composer 1.8.4) | CI "Install Dependencies" (CI uses Composer 2 and also installs dev packages) |
| 3 | `touch INSTALL_BLOCK`; `chmod 777 attachments temp upload` in the copy | Installer `maintComplete` creates `INSTALL_BLOCK`; installer requires writable dirs |
| 4 | `docker compose up -d` with `docs/baseline/env/docker-compose.yml` (php, web, db) | `docker/docker-compose-test.yml` images |
| 5a | `seed_install.php empty` — runs `db/cats_schema.sql` split on `";\n"` (188 statements, 0 errors); skips `upgrade-0.6.x-0.7.0.sql` because `history` exists | Installer `doInstallEmptyDatabase` |
| 5b | One `GET /index.php` — the app applies its pending module schema migrations on the first request (`install` module 363 → 364: MD5-hashes the seeded admin password) | Installer `maint` step (`ajax.php?f=install:maint`) |
| 5c | `seed_install.php finalize` — sets `fromAddress` (test value `noreply@baseline.example.test`), `configured=1`, date format `mdy`, site time zone `2` (= `OFFSET_GMT` in `config.php`) | Installer `maintComplete` |

Stop and remove: `docs/baseline/env/baseline-down.sh /tmp/opencats-baseline`.

## 2. Dependencies (Composer)

- Only the two runtime packages are installed (`--no-dev`): `phpmailer/phpmailer` v6.8.0 and `ckeditor/ckeditor` 4.25.1 at the exact commits in `composer.lock`. No dependency was upgraded or added.
- **Session-specific workaround (E8).** In this cloud session, Composer's default dist downloads (`https://api.github.com/repos/<pkg>/zipball/<ref>`) returned HTTP 403 from the session's GitHub scope, while `git clone` of the same repositories was allowed. The install was therefore run with source installs through the session proxy:
  ```bash
  COMPOSER_DOCKER_ARGS="--network host -e https_proxy=$HTTPS_PROXY -e GIT_SSL_CAINFO=/ca.crt -v <proxy-ca-bundle>:/ca.crt:ro" \
  COMPOSER_FLAGS="--prefer-source" docs/baseline/env/baseline-up.sh <work-dir> 8080
  ```
  On a normal machine with internet access, leave both variables unset (default `--prefer-dist`).
- Resulting `vendor/` commits were checked: ckeditor `3fa1987d…7328`, phpmailer `df16b615…18f1` (= lock).

## 3. Why the web installer was not clicked through

The installer is the documented path, but several of its steps call `CATSUtility::changeConfigSetting()` and rewrite `config.php` (`DATABASE_*`, `MAIL_*`, `OFFSET_GMT`, `ENABLE_DEMO_MODE`). Changing configuration was out of bounds for this phase. The seeding script therefore replays **only the installer's database steps**, with the same SQL files and the same statement-splitting rules, and skips every config-file write. In the runtime copy `config.php` is additionally read-only for the web user, so the application itself could not have rewritten it either.

Consequences to keep in mind:
- `ENABLE_DEMO_MODE` stays `false`, `OFFSET_GMT` stays `2`, and mail settings stay as committed (SMTP `localhost:587`, TLS, placeholder credentials) — exactly the committed configuration.
- The installer's optional-components step (`setupOptional`) and resume re-indexing step (`onReindexResumes`) were not replayed; on an empty database there is nothing to re-index. **INFERENCE:** optional components keep their schema defaults.

## 4. Test data

Only fictional test data was used. It was created **through the application UI** by the smoke test (`docs/baseline/smoke/smoke.js`), not imported:

| Record | Values |
|---|---|
| Company | "Baseline Test Co (TEST)", Testville TS, `baseline.example.test` |
| Contact | Casey Contact-Test, `casey.contact@example.test` |
| Job order | "Baseline QA Engineer (TEST)", public (visible on the careers site) |
| Candidates | Alex Baseline-Test (+ a deliberate duplicate), Jordan Applicant-Test and Morgan Applicant2-Test (both applied via the careers site) |
| User | riley.test (Riley Recruiter-Test) |
| Calendar | "Baseline interview (TEST)" |
| Files | `docs/baseline/smoke/fixtures/` — synthetic TXT/PDF/DOCX resumes, each with a unique nonsense keyword used to verify resume search |

All e-mail addresses use the reserved `example.test` domain; no mail server existed, so nothing could be sent.

Default credentials after install: **admin / admin** (the schema seeds plaintext `admin`, migration 364 turns it into its MD5 hash on first request). The login page's JavaScript also contains `defaultLogin()` (admin/cats) and `demoLogin()` (john@mycompany.net/john99) helpers from the demo dataset; neither account exists after an empty install.

## 5. Install paths attempted

| Path | Result | Evidence |
|---|---|---|
| **Empty database** (`db/cats_schema.sql`) | **Works.** Used for the baseline | `evidence/final-run/` |
| **Demo data** (`db/cats_testdata.bak` → `db/catsbackup.sql.0`, CATS 0.5.5-era data, site 201, admin/cats) | **Fails on PHP 7.2.** The dump loads (144/144 statements); the installer's `upgradeCats` step runs `db/upgrade-0.9.4-0.9.5.sql` with 1 SQL error (`Unknown column 'questionnaire_id'`), and on the first page request the module migration `install` → **225** calls the removed function `mysql_real_escape_string()` → PHP fatal error. The migration version is not advanced, so **every request** (login page, careers page) fails with the same fatal error. Migration 341 has the same call. | `evidence/demo-data-path/` (seed log, fatal page, PHP log); `KNOWN_RUNTIME_ERRORS.md` RT-01 |
| **App started against an empty database** (before seeding) | Login page renders but with 24 PHP warnings, and the migration runner creates 16 tables in the empty database | `evidence/empty-db-before-seed/first-request.html`; RT-02 |

After the demo attempt the database was dropped and recreated; the demo attachment files were removed from the runtime copy before the empty install.

## 6. Manual equivalent (without the script)

```bash
W=/tmp/opencats-baseline; mkdir -p $W/app $W/logs/php && chmod 777 $W/logs/php
git archive HEAD | tar -x -C $W/app
docker run --rm -v $W/app:/app -w /app opencats/php-base:7.2-fpm-alpine composer install --no-dev --prefer-dist
touch $W/app/INSTALL_BLOCK && chmod 777 $W/app/attachments $W/app/temp $W/app/upload
export OPENCATS_APP_DIR=$W/app OPENCATS_LOG_DIR=$W/logs OPENCATS_PORT=8080
DC="docker compose -p opencats-baseline -f docs/baseline/env/docker-compose.yml"
$DC up -d            # wait until: $DC logs db | grep "port: 3306"
$DC exec -T -w /var/www/public php php /baseline-env/seed_install.php empty
curl -s -o /dev/null http://localhost:8080/index.php      # runs pending schema migrations
$DC exec -T -w /var/www/public php php /baseline-env/seed_install.php finalize
```
