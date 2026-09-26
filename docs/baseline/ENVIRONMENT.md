# Baseline Environment — OpenCATS as it is today (Phase 0.5)

**Purpose.** Record the minimum environment the *current* repository needs, the exact environment that was used to run it for the baseline, and every environment-only deviation. Nothing here changes application code, `config.php`, the schema or dependencies.

**Code under test.** Branch `claude/friendly-pasteur-cmsxc5`, commit `f50734a`. Application files are identical to the fork's base commit `d607279` (`git diff d607279 HEAD -- . ':!docs'` is empty); later commits only add documentation. `CATS_VERSION` = `0.9.7.4` (footer: "OpenCATS Version 0.9.7.4").

**Date of run.** 2026-09-25 (final smoke run 22:58:43Z → 23:00:23Z).

Evidence grades as in earlier phases: **FACT** (observed or read in the repo), **INFERENCE**, **UNKNOWN**.

---

## 1. What the repository expects (minimum environment)

| Component | Expected by the repo | Evidence | Grade |
|---|---|---|---|
| **PHP** | **7.x — specifically 7.2.** PHP 8 is not supported. | CI matrix `php-version: ['7.2']` (`.github/workflows/ci.yml`); both compose files use `opencats/php-base:7.2-fpm-alpine`; the code uses constructs removed in PHP 8: curly-brace string offsets (`lib/CATSUtility.php:108`), `get_magic_quotes_gpc()` (`index.php:93`, `ajax.php:50`) | FACT |
| PHP extensions | mysqli, session, ctype, pcre, gd (GD2), zip, soap, ldap (optional), mbstring, curl, xml | `lib/InstallationTests.php:162-385` (checks), image `php -m` | FACT |
| **Composer** | Composer 2 in CI (`tools: composer:v2`); the PHP 7.2 image ships Composer 1.8.4, which also installs from the lock | CI file; image | FACT |
| Runtime PHP packages (`composer.lock`, `--no-dev`) | `phpmailer/phpmailer` **v6.8.0** (df16b615), `ckeditor/ckeditor` **4.25.1** (3fa1987d) | `composer.lock` | FACT |
| **Database** | MySQL-compatible; **MariaDB 10.7** pinned in `docker/docker-compose-test.yml` (the dev compose uses an unpinned `mariadb` tag). Tables are MyISAM, charset utf8 | compose files; `db/cats_schema.sql` | FACT |
| **Web server** | Apache-style deployments are assumed (`.htaccess` files in `attachments/`, `upload/`); the repo's Docker setup uses **nginx** (`prooph/nginx:www`) in front of PHP-FPM | `attachments/.htaccess`, `upload/.htaccess`; compose files | FACT |
| **Node.js** | **Not needed.** There is no `package.json`/JS build; JavaScript is served as static files from `js/` and `vendor/ckeditor` | repo tree | FACT |
| Configuration | `config.php` (tracked). DB: user `cats`, password `password`, host `localhost`, name `cats_dev`; `AUTH_MODE` sql; `MAIL_MAILER` 3 (SMTP) → `localhost:587`, TLS, auth user/password placeholders; document-conversion tool paths are placeholders (`\path\to\antiword`, `\path\to\pdftotext`, …); `PARSING_ENABLED` false; `ENABLE_DEMO_MODE` false; `OFFSET_GMT` 2; `SQL_CHARACTER_SET` utf8 | `config.php` | FACT |
| Installer gate | A file named `INSTALL_BLOCK` in the web root; without it every request is sent to the installer (`modules/install/notinstalled.php`). It is git-ignored and normally created by the installer's last step | `index.php`; `.gitignore`; `modules/install/ajax/ui.php` (`maintComplete`) | FACT |
| Writable storage | `attachments/`, `temp/` (installer checks both, plus the web root and `config.php`); `upload/` is used by the careers portal and add-candidate upload | `lib/InstallationTests.php:510-517, 720-760`; runtime | FACT |
| Optional tools | antiword, pdftotext, html2text, unrtf for text extraction (present in the PHP image, but `config.php` points to placeholder paths) | `config.php`; image | FACT |
| Browser | Any modern browser; markup is XHTML 1.0 Transitional, fixed-width layout | page source | FACT |

## 2. Environment actually used

| Layer | Used | Pin / digest |
|---|---|---|
| Container runtime | Docker Engine 29.3.1, Docker Compose v5.1.1 (Linux, cloud session container) | — |
| PHP | `opencats/php-base:7.2-fpm-alpine` → **PHP 7.2.16** (NTS, FPM), Alpine 3.9.2 | `sha256:711fa18180f03f685a6958f75e498aefd589aba29f3d1ea5bc6ddc14bb746aa3` (built 2019-03-19) |
| PHP modules loaded | Core ctype curl date dom fileinfo filter ftp gd hash iconv json ldap libxml mbstring mysqli mysqlnd openssl pcre PDO pdo_sqlite Phar posix readline Reflection session SimpleXML soap sodium SPL sqlite3 standard tokenizer xml xmlreader xmlwriter zip zlib | — |
| PHP ini (image defaults, no `php.ini`) | `display_errors=On`, `error_reporting=22519` (= E_ALL & ~E_NOTICE & ~E_STRICT & ~E_DEPRECATED), `upload_max_filesize=2M`, `post_max_size=8M`, `memory_limit=128M`, `max_execution_time=30`, `date.timezone` unset | — |
| Web server | `prooph/nginx:www` → **nginx 1.17.3**, root `/var/www/public`, all `*.php` → `php:9000`; the image adds X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, two HSTS headers and `Access-Control-Allow-Origin: *` | `sha256:43ebf7de649b41ebd05eddd3fb271b74e59ae4131b765535c328a2b21e28e89b` (built 2019-08-22) |
| Database | `mariadb:10.7` → **MariaDB 10.7.8** | `sha256:9a48ac9f196f3d4fd6fea2cab59a49df9e7ca459bf14b2f7b85a0e38a5454571` |
| Composer | 1.8.4 (inside the PHP 7.2 image) | — |
| Installed packages | ckeditor 4.25.1 @ `3fa1987d35342526e4eb2e64f6ec7172561b7328`; phpmailer v6.8.0 @ `df16b615e371d81fb79e506277faea67a1be18f1` — exactly the `composer.lock` references | verified with `git rev-parse HEAD` in `vendor/*` |
| Test browser | Chromium 141 (headless) driven by Playwright 1.56.1 | — |
| Network | Containers had **no outbound internet** and no SMTP server listening; e-mail could not leave the environment | `wget` to example.com failed from the PHP container |
| Data | Empty install (`db/cats_schema.sql`) + fictional test records created through the UI (see `INSTALLATION.md` §4) | — |

## 3. Environment-only deviations and workarounds

All of these live outside the application code (`docs/baseline/env/` in the repo, or the throw-away runtime copy). None edits a tracked application file.

| # | Deviation | Why | Where |
|---|---|---|---|
| E1 | The app runs from a **runtime copy** (`git archive HEAD`) in a scratch directory, never from the git working tree | Keep the repository untouched; `vendor/`, `INSTALL_BLOCK`, attachments and uploads are created only in the copy | `env/baseline-up.sh` step 1 |
| E2 | Compose file mirrors `docker/docker-compose-test.yml` images but uses the **credentials already in `config.php`** (`cats`/`password`/`cats_dev`) | Avoid editing `config.php` (CI instead copies `test/config.php` over it) | `env/docker-compose.yml` |
| E3 | MariaDB's Unix socket is shared into the PHP container and set as `mysqli.default_socket` | `config.php` uses `DATABASE_HOST 'localhost'`, which mysqli treats as a socket connection | `env/php-conf/zz-baseline.ini` |
| E4 | PHP errors are **also** written to a log file (`log_errors=On`, `error_log=…`) | Collect server-side errors; browser-visible behaviour unchanged | `env/php-conf/zz-baseline.ini` |
| E5 | `INSTALL_BLOCK` created in the runtime copy | Installer gate; the installer would create it itself | `env/baseline-up.sh` step 3 |
| E6 | `attachments/`, `temp/`, `upload/` made world-writable in the runtime copy; `config.php` left **read-only** for the web user | The app needs to write uploads; a read-only `config.php` guarantees the app cannot rewrite it (its writer, `CATSUtility::changeConfigSetting()`, returns false silently when the file is not writable) | `env/baseline-up.sh` step 3 |
| E7 | The database was seeded by **replaying the installer's SQL steps from the command line** instead of clicking through the web installer | The web installer rewrites `config.php` (DB, mail, `OFFSET_GMT`, `ENABLE_DEMO_MODE`), which is out of bounds for this phase | `env/seed_install.php`; `INSTALLATION.md` §3 |
| E8 | Composer was run with `--prefer-source` through the session's egress proxy | In this session GitHub zip downloads (`api.github.com/.../zipball`) were refused by the session's GitHub scope; `git clone` of the same pinned commits was allowed. Same package versions, same commits | `INSTALLATION.md` §2 |

**Hash check.** `sha256(config.php)` = `3e12f172…c2e0` in the repository **and** in the runtime copy after all runs — unchanged.

## 4. Known environment sensitivities (observed)

- **Server-side self-requests use the browser's `Host` header.** The job-order PDF report fetches its own graph over HTTP from `http://<Host>/index.php?...`. With the repo's two-container Docker topology (nginx and PHP-FPM in separate containers) the PHP container cannot reach that URL, so the PDF fails; it succeeds when the request carries a host the PHP container can resolve (verified with `Host: web`). See `KNOWN_RUNTIME_ERRORS.md` RT-09. **FACT** (reproduced both ways).
- **nginx ignores `.htaccess`.** Protections the repo expresses in `attachments/.htaccess` and `upload/.htaccess` are not applied under the repo's nginx image; stored attachment files were retrievable by direct URL without a session. See RT-17. **FACT** (one HEAD/GET check; not explored further).
- **PHP 7.2 default error settings** show warnings and fatal errors in the page (`display_errors=On`) and hide notices/deprecations. The baseline keeps these image defaults. **FACT**.
- **Data volume.** All timings in this baseline come from a nearly empty database (4 candidates, 1 job order, 2 companies incl. the built-in "Internal Postings"). They say nothing about performance at scale. **INFERENCE**.
