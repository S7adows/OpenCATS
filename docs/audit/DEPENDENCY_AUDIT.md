# OpenCATS — Dependency Assessment

Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **Inspected:** Composer manifests (`composer.json`, `composer.lock`); third-party code copied into the tree (`lib/artichow`, `lib/fpdf`, `lib/simpletest`, `lib/sphinx`, `js/*`, fonts); system binaries and PHP extensions the code calls; PHP and database version expectations; container images (`docker/*.yml`); GitHub Actions and Dependabot; external network services named in code, WSDLs and seed data; stated licences of bundled components.
- **Commands (read-only):** `php -r` over `composer.lock`; `git ls-files` / `wc` / `du -b` for sizes; `head`/`grep` for version and licence headers; `git grep` for usage sites, network calls (`fsockopen`, `curl_init`, `SoapClient`, `simplexml_load_file`, `getimagesize`) and extension functions; `php -l` (PHP 8.4 CLI); `git show e1c2c9b -- composer.lock`.
- **Installed-package check:** `vendor/` is git-ignored. The CKEditor and PHPMailer facts below were read from the `vendor/` tree that the Phase 0.5 baseline installed from the lock (`composer install --no-dev`, Composer 1.8.4 on the PHP 7.2 image; `INSTALLATION.md` §2), kept in the audit scratch area.
- **Execution evidence:** Phase 0.5 baseline (`ENVIRONMENT.md`, `INSTALLATION.md`, `KNOWN_RUNTIME_ERRORS.md` RT-04, RT-07, RT-08, RT-09, RT-17, smoke steps #NN); the CI job log of the check "Tests (PHP 7.2)" on PR #1 (workflow run [36237531847](https://github.com/S7adows/OpenCATS/actions/runs/36237531847), 2026-09-26), which contains a `composer audit` run over the lock. The log is public on GitHub Actions for the log-retention period; a copy is not committed. Phase 0 Packagist and PHP 8.4 install logs are cited as Phase 0 measurements.
- **CVE policy:** only advisories printed by `composer audit` in that CI run, or listed in a package's own changelog in the installed copy, are cited. For everything else this document states the version and date and marks CVE exposure as unknown pending a scanner run. End-of-life dates not stated inside the repository are marked "external knowledge".
- **Not done:** no image pull or image scan, no network probing of external services, no legal assessment. Licence statements are recorded as facts only; see `docs/transformation/LICENSE_AND_DISTRIBUTION_ANALYSIS.md` for the full licence inventory prepared for counsel.

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| DEP-001 | Runtime is locked to PHP 7.2 (EOL); code does not parse on PHP 8; no PHP constraint is declared | CRITICAL | Static |
| DEP-002 | CKEditor is locked to the commercial 4.25.1-lts build with no licence key, and the editor refuses to start | HIGH | Runtime |
| DEP-003 | jQuery 1.3.2 (2009) loads on every back-office page and is tracked by no tool | MEDIUM | Static |
| DEP-004 | The GitHub release archive omits `vendor/` although the app requires it | HIGH | Static |
| DEP-005 | Dev/test toolchain cannot install on PHP 8, includes abandoned and `dev-master` packages, and carries 22 advisories | HIGH | Static |
| DEP-006 | Bundled PHP libraries (Artichow, FPDF 1.53, SimpleTest 1.1.0, Sphinx API 2007, mcrypt wrapper) are frozen copies, partly PHP-8-fatal | HIGH | Static |
| DEP-007 | Vendored JavaScript has no version or licence tracking; some licences are unclear or share-alike | MEDIUM | Static |
| DEP-008 | Container images are old, tag-pinned or of unknown build provenance; the dev stack exposes default credentials | MEDIUM | Runtime |
| DEP-009 | Required system binaries and PHP extensions are undeclared; committed tool paths are placeholders, so PDF text extraction is off | MEDIUM | Runtime |
| DEP-010 | Hard-coded third-party services over plain HTTP (catsone.com, resfly.com, Google Geocoding) | MEDIUM | Static |
| DEP-011 | Bundled components carry licences that differ from the project's own and are not recorded in one place | MEDIUM | Static |
| DEP-012 | Dependabot covers only Composer; Actions are tag-pinned and run on a deprecated Node runtime; some workflows never run | LOW | Static |
| DEP-013 | PHPMailer v6.8.0 lags current releases (no advisory reported) | LOW | Static |
| DEP-014 | `composer.json` constraints are loose where they should be tight and tight where they should move | LOW | Static |
| DEP-015 | The job-order PDF report makes FPDF fetch its own graph over HTTP from the request's `Host` | MEDIUM | Runtime |
| DEP-016 | PHPMailer is used in exception mode but no caller handles its exceptions; every send failure is a fatal | HIGH | Runtime |
| DEP-017 | Access protection relies on Apache `.htaccess`, but the supplied nginx image ignores it | HIGH | Runtime |
| DEP-018 | Supported database versions are undeclared; only MariaDB 10.7 is exercised | MEDIUM | Partial |

18 findings — 1 CRITICAL / 6 HIGH / 8 MEDIUM / 3 LOW · Runtime 6 / Static 11 / Partial 1 / Unverified 0 (no withdrawn or merged stubs).

## 1. Platform: PHP, database, web server, containers

### DEP-001 — Runtime is locked to PHP 7.2 (EOL); code does not parse on PHP 8; no PHP constraint is declared
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-001, TEST-003, ARCH-001, SEC-019*

- **Confirmed fact:** Every environment the repository defines runs PHP 7.2. The baseline ran successfully on PHP 7.2.16 and CI on PHP 7.2.34. On PHP 8.x the shared bootstrap file does not parse, so no entry point can serve a request. `composer.json` declares no `php` requirement and no `config.platform`. The installer accepts any PHP ≥ 5.0.0.
- **Evidence:**
  - `docker/docker-compose.yml:14`, `docker/docker-compose-test.yml:14` `image: opencats/php-base:7.2-fpm-alpine`; `.github/workflows/ci.yml:21` `php-version: ['7.2']`; `ENVIRONMENT.md` §2 (PHP 7.2.16); CI log "Installed PHP 7.2.34".
  - `php -l` on PHP 8.4: `lib/CATSUtility.php:108` `if ($data{0} === '<')` → "syntax error, unexpected token "{"". Included by `index.php:61`, `ajax.php:43`, `careers/index.php:38`, `xml/index.php:38`, `rss/index.php:37`, `QueueCLI.php:40`.
  - Other removed APIs on the request path: `get_magic_quotes_runtime()`/`get_magic_quotes_gpc()` at `index.php:93,99`, `ajax.php:50,56`, `QueueCLI.php:59,65`, `lib/Attachments.php:944`, `lib/InstallationTests.php:185`, `modules/import/ImportUI.php:495`.
  - `composer.json:1-21` (no `php` key); `lib/InstallationTests.php:164` `version_compare(PHP_VERSION, '5.0.0', '>=')`; `installwizard.php:14` `if ($phpVersionParts[0] >= 5)`.
  - External knowledge: PHP 7.2 reached end of life on 2020-11-30; every PHP branch still supported at the audit date is 8.x.
- **Impact:** Operators must run an interpreter without security fixes, or the application does not start. Nothing warns them at install time.
- **Severity:** CRITICAL — the system cannot run on any supported PHP platform.
- **Recommendation:** Declare the PHP range the code actually supports in `composer.json` and in the installer check, so the constraint is visible and enforced, and remove the PHP 8 parse and removed-function blockers (DEBT-001) before the floor can move.
- **Unknown / needs further validation:** The full list of PHP 8 runtime breakages beyond parse errors and removed functions (needs the suites running on PHP 8 once the code parses).

### DEP-018 — Supported database versions are undeclared; only MariaDB 10.7 is exercised
*Confirmation: **Partial** (verified: declared versions, schema settings, MariaDB 10.7 works at runtime; inferred: behaviour on MySQL 8 and newer MariaDB) · New in this edition · Related: DB-003, DB-008, DB-017, DB-021, DEP-008*

- **Confirmed fact:** The installer requires only MySQL ≥ 4.1.0. The schema creates all 55 tables as MyISAM with `utf8` (utf8mb3) and sets `SQL_MODE=''` while loading. The application never sets `sql_mode` itself. Boolean search builds `REGEXP '[[:<:]]…[[:>:]]'` word-boundary patterns. The test stack pins `mariadb:10.7`; the dev stack uses an unpinned `mariadb` tag. The baseline and CI both ran on MariaDB 10.7 and worked.
- **Evidence:** `lib/InstallationTests.php:780` `version_compare($version, '4.1.0', '>=')`; `db/cats_schema.sql:10` `SET SQL_MODE=''`; `grep -c ENGINE=MyISAM db/cats_schema.sql` → 55; `grep -o "DEFAULT CHARSET=[a-z0-9]*" db/cats_schema.sql | sort | uniq -c` → 55 × `utf8`; `lib/DatabaseSearch.php:362` `REGEXP '[[:<:]]\1[[:>:]]'`; `lib/DatabaseConnection.php:128` `mysqli_set_charset(…, SQL_CHARACTER_SET)` with `config.php:136` `'utf8'`; `docker/docker-compose-test.yml:27,42` `mariadb:10.7`; `docker/docker-compose.yml:27` `mariadb`; `ENVIRONMENT.md` §2 (MariaDB 10.7.8); CI log (both `mariadb:10.7` containers).
- **Impact:** Operators cannot tell which database versions are supported. Moving to MySQL 8 or a newer MariaDB may change search results or strictness without any test signal (INFERENCE).
- **Severity:** MEDIUM — compatibility risk for upgrades, no current breakage.
- **Recommendation:** State the supported database engines and versions, pin the test image to one of them, and run the integration suite against each.
- **Unknown / needs further validation:** Inferred, not tested: MySQL 8 rejects `[[:<:]]` (external knowledge: MySQL 8 uses the ICU regex library) and newer defaults such as strict `sql_mode` may break inserts. Needs the integration and Behat suites on MySQL 8.x and a current MariaDB LTS. MariaDB 10.7 end of life (February 2023) is external knowledge.

### DEP-017 — Access protection relies on Apache `.htaccess`, but the supplied nginx image ignores it
*Confirmation: **Runtime** · New in this edition · Related: RT-17, SEC-008, SEC-009, ARCH-018, DEP-008*

- **Confirmed fact:** The only web-server protection for stored attachments and uploads in the repository is Apache `.htaccess` files. Both compose files use the third-party image `prooph/nginx:www`, whose configuration is not in the repository. Under that image the baseline retrieved a stored attachment by direct URL without a session. The same image adds `Access-Control-Allow-Origin: *` and two HSTS headers to responses.
- **Evidence:** `attachments/.htaccess`, `upload/.htaccess`; `docker/docker-compose.yml:5`, `docker/docker-compose-test.yml:5` `image: prooph/nginx:www`; `ENVIRONMENT.md` §2 (nginx 1.17.3, root `/var/www/public`, all `*.php` → `php:9000`, headers added by the image; digest `sha256:43ebf7de…`, built 2019-08-22) and §4 ("nginx ignores `.htaccess`"); RT-17 (unauthenticated `GET /attachments/site_1/…/resume_alex.txt` → 200).
- **Impact:** Anyone deploying with the repository's own Docker setup, or any nginx setup, loses the file protections the code assumes. Stored resumes (PII) become reachable to anyone who has or guesses a file URL; the application itself writes such URLs into activity notes (RT-17). Security impact is assessed in SEC-008/SEC-009.
- **Severity:** HIGH — serious data-exposure weakness with a precondition (knowing a file path), caused by an undeclared platform dependency.
- **Recommendation:** Declare the web-server requirement and ship the equivalent rules for every supported server, or stop serving attachment and upload directories from the web root so no server-specific file is needed.
- **Unknown / needs further validation:** Whether other directories (`lib/simpletest/test/`, `vendor/`, `test/`, `scripts/`) are reachable under the nginx image; the baseline checked only one attachment URL. Needs authorized testing on an isolated instance.

### DEP-008 — Container images are old, tag-pinned or of unknown build provenance; the dev stack exposes default credentials
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: SEC-023, ARCH-025, DEP-017*

- **Confirmed fact:** The PHP image has no Dockerfile in the repository. The baseline resolved it to PHP 7.2.16 on Alpine 3.9.2, built 2019-03-19; the nginx image to nginx 1.17.3, built 2019-08-22. Images are referenced by tag, never by digest. The Selenium image is Selenium 2.53.1 / chromedriver 2.23 from a personal namespace. The compose files use the obsolete `version: '2'` key. The dev compose file publishes MariaDB with `root`/`root` and phpMyAdmin with auto-login, and seeds the test fixtures, which contain `admin`/`admin` and eight `tester*` accounts (one at root level) with password `tester`. The image contains the document-conversion tools the app needs (antiword, pdftotext, html2text, unrtf) and the PHP extensions it uses.
- **Evidence:**
  - `ENVIRONMENT.md` §2: `opencats/php-base:7.2-fpm-alpine` → PHP 7.2.16, Alpine 3.9.2, digest `sha256:711fa181…`, built 2019-03-19; loaded modules list; `prooph/nginx:www` → nginx 1.17.3; `mariadb:10.7` → 10.7.8. RT-08: tools present under `/usr/bin` and `/usr/local/bin`.
  - `docker/docker-compose.yml:1` `version: '2'`, `:5,14,20,27,41` images (`busybox` and `mariadb` untagged), `:6-8` ports 80/443, `:28-31` DB port and `MYSQL_ROOT_PASSWORD=root`, `:36` `../test/data:/docker-entrypoint-initdb.d`, `:41-49` phpMyAdmin with `PMA_USER=dev`/`PMA_PASSWORD=dev`.
  - `docker/docker-compose-test.yml:53` `mlespiau/standalone-chrome:2.53.1-cd2.23`; CI log warns "the attribute `version` is obsolete".
  - `test/data/test.sql:1618` (`admin`, MD5 of `admin`, access level 500); `test/data/securityTests.sql` (8 `tester*` users, MD5 of `tester`).
- **Impact:** Builds are not reproducible, the base OS and PHP receive no updates, and anyone who runs the dev compose file on a reachable host exposes known administrator credentials and a database admin UI.
- **Severity:** MEDIUM — dev-stack defaults; harmful only if used beyond a local machine.
- **Recommendation:** Keep the image definitions in the repository, pin images by digest, and make the dev stack bind to localhost with credentials taken from the environment instead of seeded test accounts.
- **Unknown / needs further validation:** OS-level CVE exposure of the 2019 images (needs an image scanner run). Current upstream status of `opencats/php-base` and `prooph/nginx` (needs registry access).

### DEP-009 — Required system binaries and PHP extensions are undeclared; committed tool paths are placeholders
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-08, RT-01, DB-006, DEBT-011*

- **Confirmed fact:** Resume text extraction calls four external programs whose paths in the committed `config.php` are Windows-style placeholders. With those defaults, PDF text is not extracted, so PDF resumes cannot be found by keyword search, although the tools exist in the PHP image. The installer checks 8 extensions but not mbstring, iconv, dom/simplexml/xml or zlib, which the code uses. The installer's own magic-quotes check calls a function removed in PHP 8. Upgrade migrations call `mysql_*` functions removed in PHP 7.0, which the baseline hit on the demo-data path.
- **Evidence:**
  - `config.php:62` `ANTIWORD_PATH "\\path\\to\\antiword"`, `:69` `PDFTOTEXT_PATH`, `:75` `HTML2TEXT_PATH`, `:81` `UNRTF_PATH "\\path\\to\unrtf"`; `lib/DocumentToText.php:101` `escapeshellarg`, `:119` `if (PDFTOTEXT_PATH == '')` (an empty path is handled as "disabled"), `:127` command, `:378` `@exec($command, …)`.
  - RT-08: upload of `portfolio_alex.pdf` (#27) → "unable to index the resume keywords"; FPM stderr `sh: \path\to\pdftotext: not found`; keyword search finds nothing (#43). TXT (#42) and DOCX (#44, #87) are indexed.
  - `lib/InstallationTests.php:47-66` (`runCoreTests`: PHP version, magic quotes, register_globals, session auto-start, mysqli, session, ctype, gd, ldap, pcre, soap, zip), `:185` `get_magic_quotes_runtime()`, `:571` `checkPdftotext()` (called from `modules/install/ajax/ui.php:436` only when the path is non-empty).
  - Unchecked extensions in use: mbstring (`lib/StringUtility.php:502,507,514`), iconv (`modules/import/ImportUI.php:871`), dom (`lib/DocumentToText.php:416`), simplexml (`lib/ZipLookup.php:26`), zlib (`lib/FileCompressor.php:668`).
  - RT-01: `modules/install/Schema.php:725,1236` `mysql_real_escape_string()` run through `eval()` at `lib/ModuleUtility.php:542` → fatal on every request after loading the demo data.
- **Impact:** A default install silently loses PDF resume search, which recruiters rely on. A host can pass the installer and still fail at runtime. Old databases cannot be upgraded on PHP 7+.
- **Severity:** MEDIUM — a degraded core feature by default, with a known workaround (set the paths).
- **Recommendation:** Declare required and optional extensions and binaries in one place that both Composer and the installer read, and ship tool-path defaults that are either correct for the supplied image or explicitly empty ("disabled") so the failure is visible.
- **Unknown / needs further validation:** Whether the web installer's resume step shows the placeholder-path failure to the operator (the web installer was not run in the baseline, `INSTALLATION.md` §3).

## 2. Composer-managed packages

### DEP-002 — CKEditor is locked to the commercial 4.25.1-lts build with no licence key, and the editor refuses to start
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-07, DEP-011, DEP-014, SEC-019, UX*

- **Confirmed fact:** The lock pins `ckeditor/ckeditor` 4.25.1. The installed package's own licence says CKEditor 4 LTS (4.23.0 and above) is available only under commercial terms, and its changelog says 4.22.1 was the last open-source release, that CKEditor 4 reached end of life in June 2023, and that "all editor versions below 4.25.0-lts can no longer be considered as secure". OpenCATS sets no licence key. At runtime the editor script loads but creates no editor; the fields stay plain text areas and the console reports that the licence key is missing or invalid. The lock metadata still lists GPL/LGPL/MPL.
- **Evidence:**
  - `composer.lock`: `ckeditor/ckeditor` `4.25.1`, time 2025-02-05, `license` `["GPL-2.0+","LGPL-2.1+","MPL-1.1+"]`; `composer.json:19` `"ckeditor/ckeditor": "^4.16.0"` allowed the jump; `git show e1c2c9b -- composer.lock` (2026-01-09, "Feature/migrate ci to GitHub actions (#695)") changes `"version": "4.20.2"` → `"4.25.1"`.
  - Installed copy (baseline `vendor/ckeditor/ckeditor`): `LICENSE.md:1` "Software License Agreement for CKEditor 4 LTS (4.23.0 and above)"; `CHANGES.md:5` "## CKEditor 4.25.1-lts", `:18` "All editor versions below 4.25.0-lts can no longer be considered as secure!", `:76` "This is the last open source release of CKEditor 4 … End of Life in June 2023"; `ckeditor.js` contains "license key is missing or invalid" and a version-check URL on `cke4.ckeditor.com`.
  - `grep -rn "licenseKey\|versionCheck" js modules` finds no CKEditor setting; `js/ckeditor-manager.js:4` `CKEDITOR.replace(nodeId, { extraPlugins: 'font' })`.
  - Usage: `modules/joborders/Add.tpl:2`, `modules/joborders/Edit.tpl:2`, `modules/candidates/SendEmail.tpl:2`; `js/emailHandler.js:158,162,187,199` (`CKEDITOR.instances["emailBody"]`).
  - RT-07: job order add (#19, `S1`) and e-mail compose (#78, `S2`) — no editor instance, console licence error, aborted `contents.css` request.
- **Impact:** Rich-text editing of job descriptions and candidate e-mails does not work, and the project ships a build whose licence terms it has not met. The only open-source alternative in the 4.x line is end of life and, per the vendor, insecure.
- **Severity:** HIGH — licence problem plus a broken user-facing feature, with no in-line fix.
- **Recommendation:** Resolve the editor dependency explicitly: either obtain the licence the pinned build requires, or move to an editor whose licence and support status fit the project, and pin the constraint so a lock refresh cannot change licence terms again. Any change must keep server-side sanitising of the stored HTML, because job descriptions are published on the careers site.
- **Unknown / needs further validation:** Behaviour on `modules/joborders/Edit.tpl` (not checked individually; INFERENCE: same). Whether `js/emailHandler.js` raises JS errors when choosing an e-mail template while the editor is absent (not exercised). Licence obligations need legal review.

### DEP-016 — PHPMailer is used in exception mode but no caller handles its exceptions
*Confirmation: **Runtime** · New in this edition · Related: RT-04, RT-15, API-011, DEBT-029, PERF-005*

- **Confirmed fact:** `lib/Mailer.php` constructs `new PHPMailer(true)`, which makes PHPMailer throw on failure. The same file checks `Send()`'s return value, a branch that cannot run in exception mode, and nothing in the file or its callers catches `PHPMailer\PHPMailer\Exception`. With the committed SMTP settings and no reachable mail server, every e-mail action ended in an uncaught exception rendered as a PHP fatal page, including for careers applicants.
- **Evidence:** `lib/Mailer.php:38-43` (`use PHPMailer\PHPMailer\PHPMailer; … require './vendor/autoload.php';`), `:76` `new PHPMailer(true)`, `:241` `if (!$this->_mailer->Send())`; `git grep -n catch lib/Mailer.php` → none; callers include `modules/login/LoginUI.php:31`, `modules/settings/SettingsUI.php:39`, `lib/EmailTemplates.php:33`, `lib/Calendar.php:48`, `lib/CareerPortal.php:32`, `ajax/testEmailSettings.php:30`. `config.php:208-225` (`MAIL_MAILER 3`, SMTP `localhost:587`, TLS, placeholder user/password). RT-04: #77 test e-mail, #79 candidate e-mail, #85/#86 careers apply → "Uncaught PHPMailer\PHPMailer\Exception: SMTP Error: Could not connect to SMTP host" with stack trace; the application row was saved but later notification steps did not run; `evidence/final-run/php_errors.log` (4 fatals).
- **Impact:** Any SMTP problem (wrong settings, outage, timeout) turns e-mail actions into fatal pages, leaks stack traces to applicants (RT-15) and leaves multi-step actions half-done.
- **Severity:** HIGH — core workflows (careers apply, candidate e-mail) break on a common, external precondition.
- **Recommendation:** Make the mail wrapper handle the dependency's exception contract (catch, log, return a failure the callers already expect), so a mail failure degrades to a message instead of a fatal.
- **Unknown / needs further validation:** Behaviour with a reachable SMTP server (no real mail was allowed in the baseline).

### DEP-013 — PHPMailer v6.8.0 lags current releases
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-016*

- **Confirmed fact:** The lock pins PHPMailer v6.8.0 (2023-03-06); the installed copy reports `VERSION = '6.8.0'`. `composer audit` in the CI run lists no advisory for it. Newer releases exist.
- **Evidence:** `composer.lock` (`phpmailer/phpmailer` `v6.8.0`, `LGPL-2.1-only`, requires `php >=5.5.0`); installed `vendor/phpmailer/phpmailer/src/PHPMailer.php:753` `const VERSION = '6.8.0'`; CI log audit table (8 packages, PHPMailer not among them); Phase 0 Packagist query listed v6.12.0 and v7.1.1.
- **Impact:** Low today; the project misses fixes and hardening released since 2023.
- **Severity:** LOW — no known advisory.
- **Recommendation:** Keep PHPMailer and track its 6.x releases through Dependabot; revisit the major version when the PHP floor moves.
- **Unknown / needs further validation:** None.

### DEP-004 — The GitHub release archive omits `vendor/` although the app requires it
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-002, DEBT-018, DEP-002*

- **Confirmed fact:** The `release` job checks out the repository and zips it without running Composer. `vendor/` is git-ignored. Runtime code `require`s the Composer autoloader, and templates load CKEditor from `vendor/`. The baseline could only run after `composer install --no-dev`. The legacy Travis packager did install dependencies.
- **Evidence:** `.github/workflows/ci.yml:106-128` (checkout, then `zip -r opencats-${{ github.ref_name }}.zip . -x "*.git*" "docker/*" "test/*" "reports/*" ".github/*" "phpunit.xml"`); `.gitignore:7,13`; `lib/Mailer.php:43` `require './vendor/autoload.php'`; `lib/TemplateUtility.php:38`, `lib/Companies.php:2`, `lib/JobOrders.php:2` `include_once('./vendor/autoload.php')`; `INSTALLATION.md` §1 step 2; `ci/package-code.sh:3` `composer install --no-dev` (Travis only).
- **Impact:** A tagged release built by this job would fail wherever the mailer or the autoloader is loaded (INFERENCE: `require` of a missing file is fatal; `lib/Mailer.php` is loaded by the login module).
- **Severity:** HIGH — the official distribution path would ship a broken application.
- **Recommendation:** Build the release archive from a dependency-installed tree and check it starts before publishing; resolve DEP-002 first so the archive does not redistribute the commercial editor build.
- **Unknown / needs further validation:** Whether any release has been produced by this job since 2026-01-09 (needs the GitHub Releases list).

### DEP-005 — Dev/test toolchain cannot install on PHP 8, includes abandoned and `dev-master` packages, and carries 22 advisories
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-002, TEST-005, DEP-014*

- **Confirmed fact:** 27 of 64 locked dev packages have PHP constraints that exclude PHP 8. Behat is held on the 2015 3.0.x line by `~3.0.4`, and `behat/mink-extension` is locked from `dev-master`. `composer audit` reports 22 advisories in 8 packages, all dev-only, including one critical (`symfony/dependency-injection` v2.8.49) and three high. CI installs dev packages into the checkout, and the dev compose stack mounts the whole repository into the web root.
- **Evidence:**
  - `php -r` over `composer.lock`: 64 dev packages, 27 with `^5.x`/`^7.x`-only constraints; `composer.json:4-10`.
  - CI log: "Found 22 security vulnerability advisories affecting 8 packages" — `guzzlehttp/guzzle` 6.5.8 (9, one high CVE-2026-69246), `guzzlehttp/psr7` 1.9.1 (4 medium), `phpunit/phpunit` 7.5.7 (high CVE-2026-24765, affected `<8.5.52`), `symfony/dependency-injection` v2.8.49 (critical CVE-2019-10910), `symfony/process` v4.4.44 (high CVE-2024-51736, medium CVE-2026-24739), `symfony/yaml` v2.8.49 (3 low), `symfony/dom-crawler` v4.2.4 (low CVE-2026-45071), `symfony/polyfill-intl-idn` v1.33.0 (low CVE-2026-46644).
  - Phase 0 measurements: `composer install` on PHP 8.4 → "Your lock file does not contain a compatible set of packages" (28 problems); Packagist marks `fabpot/goutte`, `behat/mink-goutte-driver`, `behat/mink-extension`, `codacy/coverage`, `symfony/class-loader`, `symfony/debug` as abandoned.
  - `docker/docker-compose.yml:21-22` busybox data container mounts `..` into the web root; `modules/joborders/Add.tpl:2` loads from `vendor/ckeditor/…`, so `vendor/` must be web-served.
- **Impact:** The test suite cannot move to PHP 8 (TEST-002). Where dev dependencies are installed into a web-served tree, vulnerable test libraries sit under the document root.
- **Severity:** HIGH — major barrier to a PHP upgrade; advisories are dev-only.
- **Recommendation:** Replace the abandoned and `dev-master` packages with maintained ones on a line that installs on the target PHP versions, and never install dev dependencies into a web-served directory.
- **Unknown / needs further validation:** Whether any advisory is reachable over HTTP in a real deployment (needs the deployment layout and authorized testing).

### DEP-014 — `composer.json` constraints are loose where they should be tight and tight where they should move
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-002, DEP-005*

- **Confirmed fact:** `^4.16.0` for CKEditor allowed the move into the commercial LTS line. `~3.0.4` freezes Behat on a 2015 release line. `dev-master` for `behat/mink-extension` is not reproducible across lock refreshes. `codacy/coverage` is required but never run. There is no `php`, `ext-*` or `license` entry and no `config.platform`.
- **Evidence:** `composer.json:3-20`; `git grep -n codacy` → only `composer.json:10` and the badge at `README.md:2`.
- **Impact:** A lock refresh can silently change licence terms or behaviour, and the manifest does not describe the runtime.
- **Severity:** LOW — hygiene, with DEP-002 as the realised consequence.
- **Recommendation:** Tighten the editor constraint, move the test tools to maintained lines, remove unused entries, and declare the PHP and extension requirements.
- **Unknown / needs further validation:** None.

### DEP-012 — Dependabot covers only Composer; Actions are tag-pinned and run on a deprecated Node runtime; some workflows never run
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-014, DEBT-018*

- **Confirmed fact:** Dependabot watches only Composer and still ignores stale versions (phpunit 9.5.1–9.5.3, ckeditor 4.15.1). It has no `github-actions`, `docker` or `npm` entries, so jQuery, the vendored JS, images and Actions are not tracked. Actions are pinned by major tag, not commit SHA. The CI run warns that `actions/checkout@v4`, `actions/cache@v4` and `mikepenz/action-junit-report@v4` target Node.js 20 and are forced onto Node.js 24. Two workflows sit in `.github/workflow/`, which GitHub does not read.
- **Evidence:** `.github/dependabot.yml:1-16`; `.github/workflows/ci.yml:25,28,34,85,96,115`; CI log final warning "Node.js 20 is deprecated…"; `.github/workflow/needs-reply.yml:12` (`dwieeb/needs-reply@v2`), `.github/workflow/needs-reply-remove.yml:16` (`octokit/request-action@v2.x`). The CI job has `checks: write` and `pull-requests: write` (`ci.yml:15-17`).
- **Impact:** Vulnerable front-end code, images and Actions go unnoticed. A moved tag of a third-party Action would run with write permissions on checks and pull requests.
- **Severity:** LOW — hygiene with an indirect supply-chain risk.
- **Recommendation:** Extend update tracking to Actions and images, drop stale ignores, pin third-party Actions by commit, and move or delete the singular-directory workflows.
- **Unknown / needs further validation:** None.

## 3. Vendored libraries

### DEP-006 — Bundled PHP libraries are frozen copies, partly PHP-8-fatal
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-016, DEP-015, TEST-009, RT-09*

- **Confirmed fact:** Four third-party PHP libraries are copied into `lib/` with no package manager: Artichow (charts, "PHP 4+5 version"), FPDF 1.53 (dated 2004-12-31), SimpleTest 1.1.0 and the Sphinx client API (`$Id … 2007-04-27`, protocol `0x107`). Artichow and FPDF contain PHP 8 parse errors, so graphs and PDF reports cannot load on PHP 8 even after the core is fixed. SimpleTest is loaded into production by module discovery. The repository's "latest Sphinx" instructions point to a file it does not ship. `lib/Encryption.php` wraps the removed mcrypt extension and is never included. On PHP 7.2 the graph and PDF paths work (pipeline graph #55; PDF works when the self-fetch can reach the host, RT-09).
- **Evidence:** sizes from `git ls-files` / `wc -l` / `du -b`: `lib/artichow` 40 files (33 PHP, 13,377 lines), `lib/fpdf` 34 files (13 PHP, 2,232 lines), `lib/simpletest` 131 files (95 PHP, 31,112 lines, 1.6 MB), `lib/sphinx` 9 files (1 PHP, 679 lines). `lib/artichow/Graph.class.php:12` "For PHP 4+5 version"; `lib/fpdf/fpdf.php:4-5,16` (`Version: 1.53`, `Date: 2004-12-31`, `FPDF_VERSION '1.53'`); `lib/simpletest/VERSION` `1.1.0`; `lib/sphinx/sphinxapi.php:4,26`. `php -l` (PHP 8.4): `lib/artichow/AntiSpam.class.php:63`, `lib/fpdf/fpdf.php:434`, `lib/fpdf/font/makefont/makefont.php:18`. Includes: `lib/GraphGenerator.php:36-44` (Artichow, when GD is present), `modules/reports/ReportsUI.php:414` (FPDF), `modules/tests/TestsUI.php:43-46` (SimpleTest), `lib/Search.php:37-40` (Sphinx, when `ENABLE_SPHINX`; `config.php:97` false); `optional-updates/latest-sphinx-search/config.php:90` → `/var/www/cats/lib/sphinx_latest/sphinxapi.php` (not in the repo); `git grep -nE "Encryption\.php|new Encryption"` → no includer.
- **Impact:** Hidden PHP 8 blockers outside Composer's view, no security updates for image, font and parser code, and test scripts shipped under the web root.
- **Severity:** HIGH — major barrier to a PHP upgrade in two user-facing features (graphs, PDF reports).
- **Recommendation:** Bring each library under a package manager at a maintained version, replace it, or remove it if unused (SimpleTest, the mcrypt wrapper, the Sphinx fork instructions).
- **Unknown / needs further validation:** CVE exposure of FPDF 1.53, Artichow and SimpleTest 1.1.0 is unknown: no local advisory database covers them; needs a manual review or scanner. Protocol compatibility of the 2007 Sphinx client with any current `searchd` is untested.

### DEP-015 — The job-order PDF report makes FPDF fetch its own graph over HTTP from the request's `Host`
*Confirmation: **Runtime** · New in this edition · Related: RT-09, SEC-017, PERF-013, DEP-006*

- **Confirmed fact:** To embed the pipeline graph, the report builds an absolute URL from the incoming request's host and passes it to FPDF, which opens it with `GetImageSize()` from inside PHP. When the PHP container cannot reach that host, FPDF aborts with "Missing or incorrect image file" and the user receives an HTML error instead of a PDF. With a host the PHP container can reach, the same request returns a valid PDF.
- **Evidence:** `modules/reports/ReportsUI.php:488-500` (comments "Pass session cookie in URL? … There has to be a way"; `CATSUtility::getAbsoluteURI(… '?m=graphs&a=jobOrderReportGraph&data=' …)`; `$pdf->Image($URI, …, 'jpg')`); `lib/CATSUtility.php:295` builds the URL as `'http://' . $_SERVER['HTTP_HOST'] …`; `lib/fpdf/fpdf.php:1505-1510` `_parsejpg()` → `GetImageSize($file)` → `Error('Missing or incorrect image file')`. RT-09: #54 (`getimagesize(http://localhost:8080/…): failed to open stream: Connection refused` + FPDF error); control request with `Host: web` → 1-page PDF (`evidence/final-run/joborder-report-with-internal-host.pdf`).
- **Impact:** PDF reports fail in the repository's own two-container Docker layout and in any setup where the server cannot reach its public name. The server makes an outbound HTTP request to a host taken from the request header; the security aspect is covered by SEC-017.
- **Severity:** MEDIUM — one report broken in common deployments; works on single-host installs (INFERENCE).
- **Recommendation:** Generate the graph image in-process (or read it from a local file) instead of fetching it over HTTP, so the report does not depend on network topology or the `Host` header.
- **Unknown / needs further validation:** Behaviour behind TLS-terminating proxies (the URL is always `http://`); not tested.

### DEP-003 — jQuery 1.3.2 (2009) loads on every back-office page and is tracked by no tool
*Confirmation: **Static** · Phase 0 severity: HIGH → now MEDIUM (the Phase 0 CVE list was external knowledge and cannot be verified locally; exposure is Unknown pending a scanner run) · Related: SEC-019, ARCH-024, PERF-019, DEP-012*

- **Confirmed fact:** The shared page header loads `js/jquery-1.3.2.min.js`, whose header dates it 2009-02-19, on every back-office page. Only 3 files use jQuery directly, two of them with HTML-string sinks. No manifest, scanner or Dependabot entry tracks it.
- **Evidence:** `js/jquery-1.3.2.min.js:2,9` ("jQuery JavaScript Library v1.3.2", "Date: 2009-02-19"); `lib/TemplateUtility.php:1194`; direct use in `modules/settings/tags.tpl:41-79` (`$.ajax`, `.prepend(data)`, `.html(...)`), `modules/settings/EmailTemplates.tpl:21-22`, `js/emailHandler.js:183,198`; no `package.json`; `.github/dependabot.yml:3` (Composer only).
- **Impact:** A 17-year-old library runs on every authenticated page of an application holding candidate PII, and customer security scanners will flag it.
- **Severity:** MEDIUM — unmaintained library in a sensitive context; specific vulnerabilities not verified here.
- **Recommendation:** Remove the dependency (only 3 call sites use it) or move to a maintained version, and put whatever remains under dependency tracking.
- **Unknown / needs further validation:** CVE exposure of jQuery 1.3.2: Unknown; needs a JS vulnerability scanner (e.g. retire.js) run against `js/`. Whether the two HTML-string sinks in `tags.tpl` can receive untrusted data (needs SEC review).

### DEP-007 — Vendored JavaScript has no version or licence tracking; some licences are unclear or share-alike
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-011, ARCH-024*

- **Confirmed fact:** Five third-party JS components ship as hand-copied files: subModal 1.1, sweetTitles (2006), sorttable, calendarDateInput and EventCache/`addEvent()` inside `js/lib.js`. `sorttable.js` and `calendarDateInput.js` state no licence; `sweetTitles.js` is CC BY-SA 2.5; `js/lib.js` embeds CC-GNU LGPL 2.1 code in a file carrying the CATS header. Three of them load on the public careers pages.
- **Evidence:** `js/submodal/subModal.js:1-8` ("POPUP WINDOW CODE v1.1 … By Seth Banks"); `js/sweetTitles.js:2-3,12`; `js/sorttable.js:1-3` ("Originally by Stuart Langridge. Modifications by Cognizo"); `js/calendarDateInput.js:1-4`; `js/lib.js:5-12`; loaded by `lib/TemplateUtility.php:1190-1193`, `modules/login/Login.tpl:11`, `installwizard.php:28`; sweetTitles in 20 templates and sorttable in 17 (`git grep -l`); careers `modules/careers/Blank.tpl:9-15`, `Blank2.tpl:8-12`, `BlankNoMargin.tpl`.
- **Impact:** Licence ambiguity in redistributed releases; old DOM code (`document.writeln` in `calendarDateInput.js`) blocks a strict Content Security Policy.
- **Severity:** MEDIUM — distribution and maintenance cost on public pages.
- **Recommendation:** Record each component's origin, version and licence in one inventory, and replace components whose licence is unclear or whose function the browser now provides natively.
- **Unknown / needs further validation:** Upstream licence of the specific sorttable and calendarDateInput versions (needs provenance research).

## 4. External services and licences

### DEP-010 — Hard-coded third-party services over plain HTTP
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-017, API-010, API-013, DEBT-015*

- **Confirmed fact:** The code calls CATS-era vendor endpoints and Google Geocoding over `http://`. The resume-parsing SOAP client would send resume content to `soap.resfly.com`; the version check would send site name, user count and licence key to `www.catsone.com:80`; the ZIP lookup calls Google without an API key. Parsing is off by default and the version check is disabled in the seeded schema, but ZIP lookup is reachable through `ajax/zipLookup.php`. Indeed and SimplyHired appear only as seeded feed descriptions; no outbound call to them exists (they pull the XML feed).
- **Evidence:** `lib/NewVersionCheck.php:106-122,200` (`fsockopen('www.catsone.com', 80 …)`); `wsdl/parse.wsdl:78`, `wsdl/status.wsdl:69` (`http://soap.resfly.com/…`), `wsdl/keyCheck.wsdl:66` (`http://catsone.com/keyCheck.php`); `lib/ParseUtility.php:53,60,135` (`new SoapClient`); `lib/ZipLookup.php:23-26` (`http://maps.googleapis.com/maps/api/geocode/xml?sensor=false&address=` + `simplexml_load_file`); `config.php:31` shared `LICENSE_KEY`, `:51` `PARSING_ENABLED false`; `db/cats_schema.sql:1044` `disable_version_check`; `db/cats_schema.sql:1173-1174` `xml_feeds` rows for Indeed and SimplyHired with `http://` URLs; `git grep -nE "fsockopen|curl_init|new SoapClient|simplexml_load_file"` finds no other outbound call outside tests and vendored Sphinx. `modules/companies/CompaniesUI.php:293-304` builds a client-side `http://maps.google.com/maps?q=` link.
- **Impact:** If parsing is enabled, candidate resumes travel in clear text to a third party. Dead endpoints keep code, attack surface and a SOAP extension requirement alive.
- **Severity:** MEDIUM — PII disclosure only with a non-default setting.
- **Recommendation:** Remove integrations with defunct services unless a current contract exists, and make any remaining outbound call configurable, keyed and HTTPS-only.
- **Unknown / needs further validation:** Whether the endpoints still answer (containers in the baseline had no outbound internet; network probing was out of scope). Whether keyless Google Geocoding still responds (external knowledge suggests keys are required).

### DEP-011 — Bundled components carry licences that differ from the project's own and are not recorded in one place
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-002, DEP-007, DEBT-022*

- **Confirmed fact:** `LICENSE.md` states two licences: MPL 2.0 for OpenCATS code and the CATS Public License 1.1a ("a modified Mozilla Public License") for original 2007 CATS code. The tree also bundles components under other stated terms: the Sphinx API under "GNU General Public License" with no version, SimpleTest under LGPL-2.1, jQuery under MIT/GPL, sweetTitles under CC BY-SA 2.5, EventCache under CC-GNU LGPL 2.1, FPDF as "Freeware", Artichow as Public Domain, sorttable and calendarDateInput with no licence statement, and CKEditor 4.25.1-lts under a commercial licence. `composer.json` has no `license` field. No third-party notices file exists.
- **Evidence:** `LICENSE.md:1-5`; `lib/sphinx/sphinxapi.php:8-13`; `lib/simpletest/LICENSE:1-2`; `js/jquery-1.3.2.min.js:6`; `js/sweetTitles.js:2-3`; `js/lib.js:7-9`; `lib/fpdf/fpdf.php:7-9`; `lib/artichow/Artichow.cfg.php:2-6`; `js/sorttable.js:1-3`; `js/calendarDateInput.js:1-4`; installed CKEditor `LICENSE.md:1`; `composer.json` (no `license`). Full inventory: `docs/transformation/LICENSE_AND_DISTRIBUTION_ANALYSIS.md` §4.
- **Impact:** Redistributors and adopters cannot see the obligations of the combined distribution without their own review, and licence scanners will flag the release.
- **Severity:** MEDIUM — distribution risk; no functional effect.
- **Recommendation:** Keep one generated inventory of bundled components with their stated licences, ship it with releases, and have the combination reviewed by counsel.
- **Unknown / needs further validation:** Compatibility of the combined licences is a legal question and is not assessed here (see the questions in `LICENSE_AND_DISTRIBUTION_ANALYSIS.md` §9).

## 5. Reference

### 5.1 Inventory

"Maintained?" is based on facts inside the repository or the installed package unless marked (ext.) for external knowledge.

| Component | Version | Where | Maintained? | Licence (as stated) | Used by | Notes |
|---|---|---|---|---|---|---|
| PHP | 7.2 (image 7.2.16; CI 7.2.34) | `docker/*.yml:14`, `ci.yml:21` | EOL 2020-11-30 (ext.) | PHP License | everything | no PHP 8 parse (DEP-001) |
| MariaDB | `10.7` (baseline 10.7.8) / untagged `mariadb` | `docker/*.yml:27,42` | 10.7 EOL Feb 2023 (ext.) | GPL-2.0 (ext.) | all data | MyISAM, utf8mb3 (DEP-018) |
| `opencats/php-base:7.2-fpm-alpine` | PHP 7.2.16, Alpine 3.9.2, built 2019-03-19 | `docker/*.yml:14` | no Dockerfile in repo | — | runtime | has extraction tools (DEP-008) |
| `prooph/nginx:www` | nginx 1.17.3, built 2019-08-22 | `docker/*.yml:5` | config not in repo | — | web | ignores `.htaccess` (DEP-017) |
| `mlespiau/standalone-chrome` | Selenium 2.53.1 / chromedriver 2.23 | `docker-compose-test.yml:53` | personal namespace | — | Behat `@javascript` | worked in 2026-09-26 CI |
| phpMyAdmin, busybox | untagged | `docker-compose.yml:20,41` | floating | — | dev stack | auto-login (DEP-008) |
| `phpmailer/phpmailer` | v6.8.0 (2023-03-06) | `composer.lock` | newer releases exist (Phase 0 Packagist) | LGPL-2.1-only | `lib/Mailer.php` | exception mode unhandled (DEP-016) |
| `ckeditor/ckeditor` | 4.25.1-lts (2025-02-05) | `composer.lock` | OSS 4.x EOL June 2023 (vendor, in package) | package: commercial LTS; lock: GPL/LGPL/MPL | 3 templates, 2 JS files | does not start, RT-07 (DEP-002) |
| Composer dev set | 64 packages: PHPUnit 7.5.7, Behat 3.0.15, Mink 1.7.1, Guzzle 6.5.8, Symfony 2.8–4.4 … | `composer.lock` | 6 abandoned (Phase 0 Packagist) | MIT, BSD-3-Clause, Apache-2.0, Artistic-1.0 | tests | 22 advisories (DEP-005) |
| Artichow | none ("PHP 4+5 version") | `lib/artichow/` (33 PHP) | frozen copy | Public Domain | `lib/GraphGenerator.php` | PHP 8 parse error |
| Tuffy fonts | — | `lib/artichow/font/` | frozen copy | public domain (ext.) | Artichow | — |
| FPDF | 1.53 (2004-12-31) | `lib/fpdf/` | frozen copy | "Freeware" | `ReportsUI.php:414` | PHP 8 parse error; self-HTTP fetch (DEP-015) |
| SimpleTest | 1.1.0 | `lib/simpletest/` (95 PHP) | frozen copy | LGPL-2.1 | `modules/tests` | loaded by module discovery |
| Sphinx client API | `$Id 2394 2007-04-27`, protocol 0x107 | `lib/sphinx/` | frozen copy | GPL, version unstated | `lib/Search.php:37-40` | disabled by default |
| mcrypt wrapper | — | `lib/Encryption.php` | first-party, dead | CATS header | none | ext/mcrypt removed in PHP 7.2 (ext.) |
| jQuery | 1.3.2 (2009-02-19) | `js/` | frozen copy | MIT / GPL | every back-office page | CVE exposure unknown (DEP-003) |
| subModal | 1.1 | `js/submodal/` | frozen copy | "free … keep this comment" | all modal dialogs | — |
| sweetTitles | `$Id 754 2006-09-05` | `js/sweetTitles.js` | frozen copy | CC BY-SA 2.5 | 20 templates | — |
| sorttable | — | `js/sorttable.js` | frozen copy | none stated | 17 templates incl. careers | — |
| calendarDateInput | — | `js/calendarDateInput.js` | frozen copy | none stated | every page incl. careers | `document.writeln` |
| EventCache / `addEvent()` | — | inside `js/lib.js` | frozen copy | CC-GNU LGPL 2.1 / none given | every page | mixed-licence file |
| antiword, pdftotext, html2text, unrtf | image-provided | `config.php:62-81` | — | — | `lib/DocumentToText.php` | placeholder paths (DEP-009) |
| GitHub Actions | checkout@v4, setup-php@v2, cache@v4, action-junit-report@v4, upload-artifact@v4 | `ci.yml` | tag-pinned | — | CI | Node 20 deprecation warning (DEP-012) |

### 5.2 Platform versions: declared vs. observed

| Layer | Declared in the repository | Observed in the Phase 0.5 baseline | Observed in the CI run (2026-09-26) |
|---|---|---|---|
| PHP | no Composer constraint; installer `>= 5.0.0` (`lib/InstallationTests.php:164`); images `7.2-fpm-alpine`; CI matrix `7.2` | 7.2.16 FPM, `display_errors=On`, `error_reporting=22519` | host PHP 7.2.34 (`ini-file: production`) for unit tests; the 7.2 image for integration and Behat |
| Composer | CI `tools: composer:v2` (`ci.yml:31`) | 1.8.4 inside the PHP image; installed from the lock unchanged | 2.10.3; 66 packages installed |
| Database | installer `>= 4.1.0` (`:780`); `mariadb:10.7` (test), untagged `mariadb` (dev) | MariaDB 10.7.8 | two `mariadb:10.7` containers |
| Web server | Apache `.htaccess` files in `attachments/`, `upload/`; `prooph/nginx:www` in both compose files | nginx 1.17.3, `.htaccess` ignored (RT-17) | `prooph/nginx:www` |
| OS | none | Alpine 3.9.2 (PHP image, built 2019-03-19) | Ubuntu 24.04 runner |
| Browser automation | Selenium 2.53.1 / chromedriver 2.23 image | Chromium 141 via Playwright 1.56 (support tooling) | Selenium 2.53.1 container; 20 `@javascript` scenarios passed |

Sources: `ENVIRONMENT.md` §1–§2, `INSTALLATION.md` §2, CI job log.

### 5.3 PHP extensions

| Extension | Used at (example) | Checked by installer? |
|---|---|---|
| mysqli | `lib/DatabaseConnection.php:111,128` | yes (`lib/InstallationTests.php:229`) |
| session, ctype, pcre | pervasive | yes (`:247`, `:265`, `:284`) |
| gd | `lib/artichow/Image.class.php`, `lib/GraphGenerator.php:36` | yes, optional (`:303`) |
| ldap | `lib/LDAP.php` | yes, optional (`:325`) |
| soap | `lib/ParseUtility.php:60,135` | yes, optional (`:346`) |
| zip | `lib/DocumentToText.php:401` | yes, optional (`:371`) |
| mbstring | `lib/StringUtility.php:502,507,514` | no |
| iconv | `modules/import/ImportUI.php:871` | no |
| dom / simplexml / xml | `lib/DocumentToText.php:416`, `lib/ZipLookup.php:26` | no |
| zlib | `lib/FileCompressor.php:668`, `lib/fpdf/fpdf.php` | no |
| mcrypt (removed) | `lib/Encryption.php` (dead) | no |
| mysql (removed in PHP 7.0) | `modules/install/Schema.php:725,854,1236` (via `eval`) | no — fatal on old-DB upgrade (RT-01) |

The baseline image loads all of the above except mcrypt and mysql (`ENVIRONMENT.md` §2).

### 5.4 External services

| Service | Evidence | Transport | Default |
|---|---|---|---|
| CATS version check `www.catsone.com:80/catsnewversion.php` | `lib/NewVersionCheck.php:106-122,200` | HTTP | disabled in seeded schema |
| Resfly parsing `soap.resfly.com/parse.php`, `status.php` | `wsdl/parse.wsdl:78`, `wsdl/status.wsdl:69` | HTTP | `PARSING_ENABLED false` |
| CATS key check `catsone.com/keyCheck.php` | `wsdl/keyCheck.wsdl:66` | HTTP | no caller found |
| Google Geocoding | `lib/ZipLookup.php:23-26` | HTTP, no key | reachable via `ajax/zipLookup.php` |
| Google Maps link | `modules/companies/CompaniesUI.php:293-304` | browser link | always |
| Indeed / SimplyHired | `db/cats_schema.sql:1173-1174` | none (feed is pulled from `xml/`) | seeded rows |
| CKEditor version check `cke4.ckeditor.com` | installed `ckeditor.js`, `CHANGES.md:28,83` | HTTPS from browsers | not disabled (behaviour of the unlicensed build unknown) |
| Self (job-order graph) | `modules/reports/ReportsUI.php:494-500` | HTTP to request `Host` | always (DEP-015) |
| wsend.net (tests only) | `test/features/bootstrap/FeatureContext.php:168,176` | HTTPS | on Behat failure (TEST-008) |

### 5.5 `composer audit` over the lock (CI run, 2026-09-26)

"Found 22 security vulnerability advisories affecting 8 packages." All 8 are dev-only; the two runtime packages have none.

| Package (locked) | Advisories | Highest |
|---|---|---|
| `guzzlehttp/guzzle` 6.5.8 | CVE-2026-69246, -69245, -67354, -67355, -67353, -59883, -67339, -55767, -55568 | high (CVE-2026-69246) |
| `guzzlehttp/psr7` 1.9.1 | CVE-2026-59882, -55766, -49214, -48998 | medium |
| `phpunit/phpunit` 7.5.7 | CVE-2026-24765 (affected `<8.5.52`, `9.0–9.6.32`, …) | high |
| `symfony/dependency-injection` v2.8.49 | CVE-2019-10910 | critical |
| `symfony/process` v4.4.44 | CVE-2024-51736, CVE-2026-24739 | high |
| `symfony/yaml` v2.8.49 | CVE-2026-45304, -45305, -45133 | low |
| `symfony/dom-crawler` v4.2.4 | CVE-2026-45071 | low |
| `symfony/polyfill-intl-idn` v1.33.0 | CVE-2026-46644 | low |

The step runs as `composer audit || true` (`ci.yml:48`), so none of these can fail the build (TEST-005).

### 5.6 Dev toolchain (64 locked packages), grouped

| Group | Packages (locked version) | PHP constraint excludes 8? | Notes |
|---|---|---|---|
| PHPUnit 7 stack | `phpunit/phpunit` 7.5.7, `php-code-coverage` 6.1.4, `php-file-iterator` 2.0.2, `php-timer` 2.1.1, `php-token-stream` 3.0.1, `php-text-template` 1.2.1, 11 `sebastian/*`, `phar-io/manifest` 1.0.3, `phar-io/version` 2.0.1, `theseer/tokenizer` 1.1.0, `myclabs/deep-copy` 1.8.1, `doctrine/instantiator` 1.1.0, `phpspec/prophecy` 1.8.0, `phpdocumentor/*` (3), `webmozart/assert` 1.4.0 | yes for 24 of them | released 2015–2019 |
| Behat / Mink | `behat/behat` v3.0.15 (2015), `behat/gherkin` v4.6.0, `behat/mink` v1.7.1, `mink-extension` dev-master (abandoned), `mink-goutte-driver` v1.2.1 (abandoned), `mink-selenium2-driver` v1.3.1, `mink-browserkit-driver` 1.3.3, `behat/transliterator` v1.2.0 (Artistic-1.0), `instaclick/php-webdriver` 1.4.5 (Apache-2.0), `fabpot/goutte` v3.2.3 (abandoned) | no (`>=5.3`) | runs on PHP 7.2 (CI) |
| HTTP client | `guzzlehttp/guzzle` 6.5.8, `guzzlehttp/psr7` 1.9.1, `guzzlehttp/promises` 1.5.3, `psr/http-message` 1.1, `ralouphie/getallheaders` 3.0.3 | no | 13 advisories |
| Symfony 2.8 / 3.x / 4.x | `config`, `console`, `dependency-injection`, `event-dispatcher`, `translation`, `yaml`, `class-loader` (abandoned) at v2.8.49; `css-selector` v3.4.23, `debug` v3.0.9 (abandoned), `filesystem` v3.0.9; `browser-kit` v4.2.4, `dom-crawler` v4.2.4, `process` v4.4.44; polyfills v1.10.0 / v1.33.0 | yes for `browser-kit`, `dom-crawler` | 9 advisories |
| Other | `codacy/coverage` 1.4.2 (abandoned, unused), `gitonomy/gitlib` v1.0.4, `psr/log` 1.1.0 | yes for `gitlib` | — |

Command: `php -r` over `composer.lock` printing `name`, `version`, `require.php` and `time` for each `packages-dev` entry. Abandonment is the Phase 0 Packagist query.

## Area-level unknowns

1. **OS and library CVEs in the 2019 container images** — needs an image scanner run on the pinned digests in `ENVIRONMENT.md` §2.
2. **CVE exposure of jQuery 1.3.2, FPDF 1.53, Artichow, SimpleTest 1.1.0 and the vendored JS** — no local advisory data; needs a JS scanner and a manual review.
3. **Release history** — whether the `release` job has published an archive without `vendor/`; needs the GitHub Releases list.
4. **Reachability of external endpoints** (catsone.com, soap.resfly.com, Google Geocoding without key, wsend.net) — needs network probing from an authorized environment.
5. **Database compatibility beyond MariaDB 10.7** — needs the integration and Behat suites on MySQL 8.x and a current MariaDB LTS.
6. **nginx exposure beyond attachments** — which other paths the `prooph/nginx:www` configuration serves; needs the image configuration or authorized testing.
7. **Legal assessment** of the licence combination and of running the CKEditor LTS build without a contract — needs counsel (`LICENSE_AND_DISTRIBUTION_ANALYSIS.md` §9).

## Changes from the Phase 0 edition

- **New:** DEP-015 (PDF report self-fetch over HTTP, RT-09), DEP-016 (PHPMailer exceptions unhandled, RT-04), DEP-017 (Apache `.htaccess` dependency vs. nginx image, RT-17), DEP-018 (database versions undeclared).
- **Re-rated:** DEP-003 HIGH → MEDIUM: the jQuery CVE list in Phase 0 was external knowledge; under this edition's CVE policy exposure is recorded as Unknown pending a scanner run.
- **Confirmation upgrades from runtime evidence:** DEP-002 → Runtime (RT-07: editor does not start; the Phase 0 inference is confirmed); DEP-008 → Runtime (baseline resolved image versions, build dates and contents); DEP-009 → Runtime (RT-08 PDF extraction disabled by placeholder paths; RT-01 `mysql_*` migration fatal).
- **Re-verified with new sources:** the 22 `composer audit` advisories now come from the CI run of 2026-09-26 (same set as Phase 0); CKEditor licence and changelog facts re-read from the baseline's installed copy (`CHANGES.md:5,18,76`).
- **Resolved Phase 0 unknowns:** contents of `opencats/php-base:7.2-fpm-alpine` (extensions and tools present); nginx behaviour for `.htaccess` (ignored); CKEditor behaviour without a licence key (no editor instance).
- **Corrected details:** `lib/sphinx/sphinxapi.php` licence lines `:8-13`; library sizes re-measured in bytes (`du -b`); PHP 8 blocker list moved to DEBT-001 to avoid duplication; DEP-011 reworded to state licence facts only (the Phase 0 GPL-compatibility assumption is now an open legal question).
- **Removed:** the Phase 0 §9 "Upgrade / replacement plan" table (targets and ordering). It was a roadmap and is out of scope for this findings-only edition; each finding keeps a short recommendation.
- **Withdrawn or merged:** none.
