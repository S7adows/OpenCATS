# OpenCATS — Architecture Assessment
Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **Inspected (read-only):** every entry point (`index.php`, `ajax.php`, `careers/`, `rss/`, `xml/`, `QueueCLI.php`, `installwizard.php`, `installtest.php`, `rebuild_old_docs.php`, `scripts/*`), the core framework in `lib/` (`ModuleUtility`, `UserInterface`, `Template`, `TemplateUtility`, `Hooks`, `Session`, `ACL`, `DatabaseConnection`, `AJAXInterface`, `QueueProcessor`, `CATSUtility`, `License`, `Attachments`, `DocumentToText`, `Site`), module controllers (`modules/*/*UI.php`), `modules/install/Schema.php` and `modules/install/ajax/*`, `src/OpenCATS/**`, `config.php`, `constants.php`, `composer.json`, `docker/*.yml`, `.github/workflows/ci.yml`.
- **Commands:** `grep`/`git grep`, `sed -n`, `wc -l`; `php -l` (PHP 8.4.19 CLI) over all 491 tracked `*.php`/`*.tpl` files outside `docs/`; small read-only `php -r` checks on PHP 8.4 (removed functions, `implode()` argument order, property on `null`, mysqli default report mode, the `DataGrid` regex); a read-only Python include walk from each entry point.
- **Runtime evidence used:** the Phase 0.5 baseline in `docs/baseline/` (unmodified app on PHP 7.2.16 / nginx 1.17.3 / MariaDB 10.7.8, pinned `composer.lock`): `KNOWN_RUNTIME_ERRORS.md` (RT-01…RT-17), `SMOKE_TEST.md` (steps #01–#94), `CURRENT_UI_MAP.md`, `ENVIRONMENT.md`, `INSTALLATION.md`, and raw files in `docs/baseline/evidence/` (`final-run/nginx.log`, `final-run/php_errors.log`, `demo-data-path/*`, `empty-db-before-seed/first-request.html`).
- **Not done:** no code was executed against a web server or database by this audit; the app was not run on PHP 8; no security testing; no load testing. `.github/workflows/preview.yml`, `docs/baseline/env/` and `docs/baseline/preview/` are audit tooling and are not assessed as product.
- Security, database, dependency, performance and test details are owned by `SECURITY_AUDIT.md` (SEC-xxx), `DATABASE_AUDIT.md` (DB-xxx), `DEPENDENCY_AUDIT.md` (DEP-xxx), `PERFORMANCE_AUDIT.md` (PERF-xxx) and `TESTING_AUDIT.md` (TEST-xxx). This document states only the architectural part and cross-references them.

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| ARCH-001 | Application cannot run on any supported PHP version (≥ 8.0); stack pinned to EOL PHP 7.2 | CRITICAL | Static |
| ARCH-002 | Release artifact omits `vendor/` although the runtime hard-requires it; CI lints only `src/` | HIGH | Static |
| ARCH-003 | Pervasive global state: serialized session god-object and DB singleton used as service locators | HIGH | Static |
| ARCH-004 | Executable PHP stored as strings (hooks, grid renderers, migrations, wizard, installer) and run with `eval()` | HIGH | Runtime |
| ARCH-005 | Schema migrations run inside ordinary web requests; a failing migration blocks every request | HIGH | Runtime |
| ARCH-006 | No single front controller: eight independent bootstraps; maintenance scripts in the web root without guards | MEDIUM | Partial |
| ARCH-007 | Authorization is opt-in per action; no central policy; AJAX checks only "logged in" | HIGH | Static |
| ARCH-008 | Raw-PHP templates with opt-in escaping; stored data is a mix of HTML-encoded and raw text | HIGH | Static |
| ARCH-009 | Database errors are not detected (PHP 7.2) or become uncaught exceptions (PHP ≥ 8.1) | HIGH | Runtime |
| ARCH-010 | Data layer is hand-built SQL in table gateways that also emit HTML and read the session | MEDIUM | Static |
| ARCH-011 | God classes and god methods concentrate logic in a few files | MEDIUM | Static |
| ARCH-012 | `src/OpenCATS` PSR-4 layer is stalled: two entities, three UI classes, broken exception paths | MEDIUM | Partial |
| ARCH-013 | Multi-site (`site_id`) model is vestigial: portals serve one site, attachment download bypasses the filter | MEDIUM | Static |
| ARCH-014 | Configuration is tracked, mutable PHP source rewritten at runtime; no environment support | HIGH | Partial |
| ARCH-015 | Module discovery (scan, include, instantiate 23 modules, DB lock) runs on every new session | MEDIUM | Runtime |
| ARCH-016 | Background work depends on an unprovisioned cron calling a web-reachable script; task framework defects | MEDIUM | Static |
| ARCH-017 | Search is REGEXP/LIKE scanning; optional Sphinx integration is a 2007 client and a forked file | MEDIUM | Partial |
| ARCH-018 | File storage inside the web root; protection relies on Apache `.htaccess`; converter paths broken by default | HIGH | Runtime |
| ARCH-019 | Hosted-CATS / "Professional" remnants are still loaded and still change behaviour | MEDIUM | Partial |
| ARCH-020 | No error model: `die()` pages, no handler, no logging; fatals are served as HTTP 200 with stack traces | HIGH | Runtime |
| ARCH-021 | Time zones are integer GMT offsets applied by rewriting SQL text | MEDIUM | Static |
| ARCH-022 | Portal shims include a file named by `PHP_SELF`; the RSS shim is broken | MEDIUM | Runtime |
| ARCH-023 | Include-order coupling, include cycles and eager loading (49 files / 29,276 LOC per request) | MEDIUM | Static |
| ARCH-024 | Legacy front-end stack loaded globally; rich-text editor does not start; layout not responsive | MEDIUM | Runtime |
| ARCH-025 | Docker setup is development-only, not reproducible, and its topology breaks features | MEDIUM | Runtime |
| ARCH-026 | PDF report fetches its own public URL over HTTP (built from the `Host` header) to embed a graph | MEDIUM | Runtime |
| ARCH-027 | Multi-step workflows have no transaction or outbox; a late failure leaves partial writes | HIGH | Runtime |
| ARCH-028 | No startup or configuration validation; unusable defaults and empty databases are accepted silently | MEDIUM | Runtime |

28 findings — 1 CRITICAL / 11 HIGH / 16 MEDIUM / 0 LOW · Runtime 12 / Static 11 / Partial 5 / Unverified 0 · no withdrawn or merged stubs in this document (API-018 and API-019 from `API_AUDIT.md` are merged into ARCH-016 and ARCH-001).

---

## 1. Runtime topology and entry points

**As built.** A server-rendered PHP monolith from about 2007 (`constants.php:45` `CATS_VERSION '0.9.7.4'`). No framework, router, container or ORM. Traffic enters through a handful of root scripts; pages are `*UI` classes in `modules/<name>/`; persistence goes through a `mysqli` singleton and about 80 procedural `lib/` classes; output is `.tpl` files included as PHP.

```
 Browser / applicant / feed reader / cron (expected)
   |            |               |              |                 |
 index.php   ajax.php        careers/ xml/    rss/ (broken)    QueueCLI.php, rebuild_old_docs.php,
   |        f=fn | f=mod:fn   (chdir + include index.php)       installtest.php, installwizard.php
   |            |                                               (own bootstraps, no auth)
   v            v
 config.php (constants, secrets) + constants.php + eager lib/* includes (49 files)
 session_start() -> $_SESSION['CATS'] (serialized CATSSession), $_SESSION['modules'|'hooks']
   |                              |
   | first request of a session:  ModuleUtility::_refreshModuleList()
   |   scan modules/ -> include + new every *UI.php -> GET_LOCK -> processModuleSchema() (eval'd PHP:)
   v                              v
 ModuleUtility::loadModule($_GET['m'])        ajax/<fn>.php | modules/<m>/ajax/<fn>.php
   -> <M>UI::handleRequest(): switch($_GET['a'])   SecureAJAXInterface (login only) -> XML/HTML/text
      eval(Hooks::get(...)), inline access checks
   |
   v
 lib/* table gateways (sprintf SQL, some HTML, read $_SESSION) --> DatabaseConnection::getInstance()
   |                                                                (mysqli, DATE_FORMAT rewrite)
   v                                                                        |
 Template::display(.tpl) = ob_start + include (raw PHP)                     v
 TemplateUtility::print* (header, tabs, footer)                   MySQL/MariaDB: 55 MyISAM tables
   |
   +--> Filesystem in web root: attachments/site_N/..., upload/, temp/, config.php (rewritten), queue.time
   +--> exec(): antiword / pdftotext / html2text      +--> SMTP (PHPMailer, synchronous)
   +--> HTTP to own public URL (PDF graph, RT-09)     +--> optional: LDAP, Sphinx, Resfly SOAP, catsone.com
 src/OpenCATS (PSR-4): Company/JobOrder repositories + QuickActionMenu, loaded via cwd-relative vendor/autoload.php
```

Baseline topology (`docs/baseline/ENVIRONMENT.md` §2): nginx 1.17.3 container → PHP-FPM 7.2.16 container (all `*.php` → `php:9000`) → MariaDB 10.7.8; the repo is the document root. The full entry-point inventory is in Reference R1.

### ARCH-006 — No single front controller; maintenance scripts in the web root without guards
*Confirmation: **Partial** · Phase 0 severity: HIGH → now MEDIUM (security part is owned by SEC-028/API-008 at MEDIUM; the remaining cost is maintainability) · Related: SEC-028, API-008, ARCH-022, RT-05*

- **Confirmed fact:** Eight scripts bootstrap the application independently, each with its own include list: `index.php`, `ajax.php`, `QueueCLI.php`, `installwizard.php`, `installtest.php`, `rebuild_old_docs.php`, `scripts/makeBackup.php`, `modules/install/ajax/ui.php`. The magic-quotes shim is copied three times. `ajax.php` has no `INSTALL_BLOCK` gate (only `index.php:44` has one). `QueueCLI.php`, `rebuild_old_docs.php` and `installtest.php` have no authentication and no `php_sapi_name()` check; only `scripts/makeBackup.php:37` and `scripts/sphinxtest.php:18` check the SAPI.
- **Evidence:**
  - Bootstraps: `index.php:42-75`, `ajax.php:36-41`, `QueueCLI.php:34-56`, `installtest.php:32`, `rebuild_old_docs.php:14`, `modules/install/ajax/ui.php:30-32`.
  - Magic-quotes copies: `index.php:93-109`, `ajax.php:50-61`, `QueueCLI.php:59-70`.
  - Drift observed at runtime: `rss/index.php` lacks the `config.php` include its siblings have and is fatal (RT-05, step #88; see ARCH-022).
  - Reachability: the baseline nginx routes every `*.php` under the repo root to PHP-FPM (`ENVIRONMENT.md` §2). Not requested during the baseline.
- **Impact:** Each entry point drifts on its own (one is already broken). Cross-cutting concerns (error handling, security headers, session settings) have no single place to live. Anonymous users can start queue runs, attachment re-indexing and environment tests (details under SEC-028).
- **Severity:** MEDIUM — notable maintainability cost; the security consequence is rated separately in SEC-028.
- **Recommendation:** Give all entry points one shared bootstrap so configuration, session and error handling are defined once, and keep CLI-only scripts out of the web root or behind a CLI check, so that they cannot be triggered over HTTP.
- **Unknown / needs further validation:** Whether production web servers deny these scripts (the repo ships no nginx rules). Needs a review of real deployment configurations.

### ARCH-022 — Portal shims include a file named by `PHP_SELF`; the RSS shim is broken
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-05, API-012, SEC-010*

- **Confirmed fact:** `careers/index.php` and `xml/index.php` set a flag, `chdir('..')`, include `config.php` and then `include_once(CATSUtility::getIndexName())`, which returns the last path segment of `$_SERVER['PHP_SELF']`. `rss/index.php` uses `LEGACY_ROOT` before any config is loaded. The same `getIndexName()` value is printed unescaped into a JavaScript string on every page.
- **Evidence:**
  - `careers/index.php:34-39`, `xml/index.php:34-39`, `rss/index.php:34-38` (`LEGACY_ROOT` at `:37`); `lib/CATSUtility.php:304-329`; `lib/TemplateUtility.php:1195`.
  - RT-05 / step #88: `/rss/` returns HTTP 200 with "Use of undefined constant LEGACY_ROOT" and "Class 'CATSUtility' not found in rss/index.php:38" (`evidence/final-run/php_errors.log`). The careers "RSS Feed" button links to it.
  - The careers shim (#80–#86) and XML shim (#89) work.
- **Impact:** The advertised RSS feed URL is dead. The include target and a JS string depend on a request-derived value; with PATH_INFO enabled this could influence what is included (see SEC-010; not tested).
- **Severity:** MEDIUM — one public feature is broken; the include pattern is a latent weakness.
- **Recommendation:** Make the shims include the front controller by a fixed path and stop deriving file names or script URLs from `PHP_SELF`, so behaviour no longer depends on the request path.
- **Unknown / needs further validation:** Whether PATH_INFO is enabled on real deployments and whether it changes the include target. Needs authorized security testing on an isolated instance.

### ARCH-025 — Docker setup is development-only, not reproducible, and its topology breaks features
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-09, RT-17, DEP-008, SEC-023, ARCH-026*

- **Confirmed fact:** The repo has no Dockerfile. `docker/docker-compose.yml` uses third-party images (`prooph/nginx:www`, `opencats/php-base:7.2-fpm-alpine`), an unpinned `mariadb` image with port 3306 published, and phpMyAdmin on 8080 with `PMA_USER`/`PMA_PASSWORD` set (auto-login). The whole repo is mounted as the document root and the dev DB is seeded from `test/data`. There is no cron, healthcheck or TLS service.
- **Evidence:**
  - `docker/docker-compose.yml:5,14,20-22,26-36,41-49`; `docker/docker-compose-test.yml`.
  - Baseline images: nginx image built 2019-08-22, PHP image built 2019-03-19 (PHP 7.2.16, Composer 1.8.4); the nginx image adds its own headers, including `Access-Control-Allow-Origin: *` (`ENVIRONMENT.md` §2).
  - In this two-container topology the job-order PDF fails (RT-09, #54) and `.htaccess` protections are ignored, so stored files are downloadable by URL (RT-17).
- **Impact:** There is no supported production deployment recipe. Following the compose file exposes the database through phpMyAdmin without a login. Behaviour depends on image contents the repo does not control.
- **Severity:** MEDIUM — deployment is fragile and features break in the project's own topology.
- **Recommendation:** Keep the image build and web-server rules in the repository and pin every image, so the tested topology is reproducible and matches what the code assumes (Apache-style protections, self-reachable host).
- **Unknown / needs further validation:** What real installations use (Apache vs nginx, single host vs containers). Needs a deployment survey.

### ARCH-026 — PDF report fetches its own public URL over HTTP to embed a graph
*Confirmation: **Runtime** · New in this edition · Related: RT-09, ARCH-025, API-014, SEC-017, PERF-013*

- **Confirmed fact:** `generateJobOrderReportPDF` builds `http(s)://<HTTP_HOST>/<dir>/index.php?m=graphs&a=jobOrderReportGraph&data=…` with `CATSUtility::getAbsoluteURI()` and passes it to FPDF, which fetches it with `GetImageSize()`/`fopen()` from inside PHP. The server-side request carries no session cookie, so the graph action must be public; `GraphsUI` serves it (and four other actions) without login.
- **Evidence:**
  - `modules/reports/ReportsUI.php:490-500` (FIXME comments on the cookie problem; `$pdf->Image($URI, …)`); `lib/CATSUtility.php:220-240` (`$_SERVER['HTTP_HOST']`); `lib/fpdf/fpdf.php:1508`; `modules/graphs/GraphsUI.php:76-98` (public actions).
  - RT-09 / #54: `getimagesize(http://localhost:8080/…): failed to open stream: Connection refused` then "FPDF error: Missing or incorrect image file"; the same request with `Host: web` returns a valid PDF (`evidence/final-run/joborder-report-with-internal-host.pdf`).
- **Impact:** The job-order PDF works only where the PHP host can reach the public URL the browser used. It fails behind containers, proxies, split DNS or TLS termination. The design also forces an unauthenticated graph endpoint and makes the server request a URL chosen by the client's `Host` header.
- **Severity:** MEDIUM — a feature is broken in common topologies, and the coupling widens the public surface.
- **Recommendation:** Generate report images in-process instead of over HTTP, so report generation no longer depends on network topology or on a public graph endpoint.
- **Unknown / needs further validation:** Behaviour behind a TLS-terminating proxy and on single-host Apache installs. Needs a test on those topologies.

---

## 2. Request lifecycle, modules and schema migrations

**As built.** `index.php` loads config and 11 lib files (whose own includes pull in 49 files), starts the session, and on the first request of each session calls `ModuleUtility::_refreshModuleList()`. That scans `modules/`, includes and instantiates every `*UI.php`, takes `GET_LOCK('CATSUpdateLock', 120)`, merges hook strings into `$_SESSION['hooks']`, and runs `processModuleSchema()` for each module. Then `loadModule($_GET['m'])` includes the controller, evaluates the `LOAD_MODULE` hook and calls `handleRequest()`, which switches on `$_GET['a']`. Details in Reference R2–R4. The runtime stack trace in `docs/baseline/evidence/demo-data-path/migration-request.html` shows this exact path on a login-page request: `index.php(215) → loadModule('login') → getModules() → _refreshModuleList() → processModuleSchema('install') → eval() at ModuleUtility.php:542`.

### ARCH-005 — Schema migrations run inside ordinary web requests; a failing migration blocks every request
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-01, RT-02, DB-006, DB-002, ARCH-004, ARCH-015*

- **Confirmed fact:** Pending schema changes are applied by `processModuleSchema()` during module discovery, i.e. on the first request of any session, including anonymous careers visitors. Only the `install` module declares a schema: `modules/install/Schema.php` has 195 version keys (highest 364; key `'283'` is declared twice, so the first `'283'` step never runs) and 25 of them are `PHP:` blocks executed with `eval()`. The version row is updated after each step (`:554-569`) without checking the result, so a failed SQL step is recorded as applied; a PHP fatal inside a step aborts before the update, so the same step is retried, and fails, on every later request.
- **Evidence:**
  - `lib/ModuleUtility.php:152-156` (discovery when the session has no module list), `:242-243` (lock), `:282` (per-module call), `:443-573` (runner; `eval` at `:542`; version update `:559-569`).
  - `modules/install/Schema.php:702/725` (`'225'` uses `mysql_real_escape_string()`), `:854` (`mysql_fetch_row`), `:1232/1236` (`'341'`), `:1026-1031` (duplicate `'283'`), `:1328` (`'364'` MD5-hashes passwords); `db/cats_schema.sql:862` seeds `install` at 363.
  - RT-01 (demo-data install): migrations run from 51 up to 224, then `'225'` fatals ("Call to undefined function mysql_real_escape_string() in ModuleUtility.php(542) : eval()'d code:24"); the version is not saved and every request, including `/careers/index.php`, fails the same way (`evidence/demo-data-path/`).
  - RT-02 (empty database): the runner treated the missing `module_schema` row as version 0 and created 16 tables in the empty schema, printing 23 warnings from `DatabaseConnection.php:321` (one per module) plus one from `modules/install/scripts/150.php:56`.
  - `INSTALLATION.md` §1 step 5b: on a normal install, the first `GET /index.php` runs `'364'`, which turns the seeded plaintext admin password into its MD5 hash.
  - The installer's own SQL runner checks only the connection, not each query (`modules/install/ajax/ui.php:1111-1131`); RT-01 records an ignored error in `db/upgrade-0.9.4-0.9.5.sql`.
- **Impact:** Upgrade timing is decided by whichever visitor arrives first, under a 120 s DB lock. A broken migration makes the whole application, including the public careers site, return a fatal error on every request, with no recovery path in the UI. Upgrades from pre-225 databases cannot complete on PHP 7 or later. Failed SQL steps are silently marked done.
- **Severity:** HIGH — the upgrade workflow is broken and one bad step takes the whole site down.
- **Recommendation:** Run schema changes only as an explicit, operator-invoked step that records a version only after the step succeeds, so ordinary traffic can never trigger or loop on a migration.
- **Unknown / needs further validation:** How many real installations still carry pre-225 schemas. Needs field data. Behaviour of the remaining 24 `PHP:` steps on PHP 7/8 was not exercised.

### ARCH-015 — Module discovery runs on every new session
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: PERF-006, DEBT-017, TEST-009, ARCH-005*

- **Confirmed fact:** When `$_SESSION['modules']` is empty, `_refreshModuleList()` scans `modules/`, includes and instantiates all 23 `*UI.php` classes (including `TestsUI`, whose file scope sets `error_reporting(E_ALL)` and loads SimpleTest), takes a DB advisory lock and issues one `module_schema` SELECT per module. `moduleRequiresAuthentication()` also includes and instantiates the requested module before the login check. `CACHE_MODULES` is `false` by default, and its write path assigns properties on an undefined variable (a fatal `Error` on PHP 8). Code-change detection (`getBuild()`) reads `.svn/entries`, which does not exist in a git checkout, so logged-in sessions never refresh their module and hook lists after a deployment.
- **Evidence:**
  - `lib/ModuleUtility.php:109-140`, `:152-156`, `:193-313` (instantiation `:262-274`, cache write `:305-310`); `modules/tests/TestsUI.php:41-46`; `config.php:256`; `lib/CATSUtility.php:98-132`; `lib/Session.php:111-160`.
  - PHP 8.4: `$m->x = 1` on an undefined variable throws `Error: Attempt to assign property "x" on null`.
  - RT-02: 23 `mysqli_fetch_assoc()` warnings, one for each module's `module_schema` SELECT, on a single login-page request; RT-01 stack trace shows discovery on the login page.
- **Impact:** Every cookie-less client (bots, feed readers, first careers visit) pays a full scan, 23 class instantiations and a DB lock, and can trigger migrations. Test-harness code is loaded into production requests. After an upgrade, existing sessions keep stale module and hook definitions.
- **Severity:** MEDIUM — measurable per-session cost and a stale-state risk; no functional failure on its own.
- **Recommendation:** Replace runtime discovery with a static module registry and a version marker that does not depend on SVN, so requests do not scan the filesystem or load test code.
- **Unknown / needs further validation:** Cost under real traffic (the baseline measured 24–73 ms per page on an almost empty DB). Needs profiling with production-like traffic.

### ARCH-004 — Executable PHP stored as strings and run with `eval()`
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: SEC-011, DEBT-004, DEBT-005, API-017, RT-01*

- **Confirmed fact:** Several extension and rendering mechanisms store PHP source as strings and execute it with `eval()`. Hook bodies live in `$_SESSION['hooks']` and are evaluated at 278 call sites in 50 files (251 distinct hook names); only 10 hooks are implemented, all in `SettingsUI::defineHooks()`, and they are the only enforcement of the `careerportal` user category. Other `eval` sites: DataGrid column renderers (82 `pagerRender` definitions), `PHP:` migrations, queue task instantiation, wizard pages stored in the session, installer optional components, careers field handling, template and AJAX output filters.
- **Evidence:**
  - `lib/Hooks.php:52-72`; `lib/ModuleUtility.php:276-280,296`; `modules/settings/SettingsUI.php:87-128`.
  - `lib/DataGrid.php:1206,1211,1441,1530,1912`; `lib/ModuleUtility.php:542`; `lib/QueueProcessor.php:210`; `lib/Wizard.php:75-80` → `modules/wizard/WizardUI.php:181`; `modules/install/ajax/ui.php:544,551,1162`; `modules/careers/CareersUI.php:280,285,1272`; `lib/Template.php:125`; `ajax.php:127`; `lib/ArrayUtility.php:101`.
  - Runtime: RT-01 shows a migration executing as "eval()'d code" inside a page request.
- **Impact:** Code is invisible to static analysis, IDEs, opcache and type checks; errors in it surface only at runtime (RT-01). Anyone able to write session data can run code (SEC-011). 241 of 251 hook points cost `eval` calls and do nothing.
- **Severity:** HIGH — a major barrier to refactoring, analysis and PHP upgrades, with a security precondition.
- **Recommendation:** Replace string code with ordinary callables and explicit checks, so behaviour can be analysed and the career-portal restriction no longer depends on session-stored strings.
- **Unknown / needs further validation:** Whether any deployment adds its own hooks via modules outside this repository. Needs a survey of installations.

### ARCH-023 — Include-order coupling, include cycles and eager loading
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-024, PERF-020*

- **Confirmed fact:** `lib/` has no autoloading. Files `include_once` their dependencies with paths relative to the working directory, depend on include order, and form cycles. A static walk from `index.php` reaches 49 files / 29,276 LOC before any module code (upper bound; conditional includes counted); from `QueueCLI.php` 46 files / 28,668 LOC; from `ajax.php` 10 files / 4,451 LOC.
- **Evidence:**
  - `index.php:59-70` (comments such as `/* Depends: MRU, Users, DatabaseConnection. */`); `lib/TemplateUtility.php:38-39` (vendor autoload and `Candidates.php` at file scope).
  - Cycles: `lib/Calendar.php:44-48` ↔ `lib/JobOrders.php:44`; `lib/Contacts.php:35` ↔ `Calendar`; `lib/Mailer.php:46` → `Pipelines`, which uses `Mailer` without including it (`lib/Pipelines.php:371`).
  - Walk re-run for this edition (Python, read-only).
- **Impact:** Moving or renaming a file breaks unrelated pages; scripts run from another directory fail; every request parses most of the domain layer. The baseline shows no measurable latency on a tiny DB (24–46 ms TTFB), so this is a change-risk issue more than a speed issue today.
- **Severity:** MEDIUM — notable maintainability cost.
- **Recommendation:** Load `lib/` classes through an autoloader and remove order-dependent includes, so files can be moved and tested in isolation.
- **Unknown / needs further validation:** Whether opcache is enabled in real deployments (it affects parse cost). Needs deployment data.

### ARCH-028 — No startup or configuration validation
*Confirmation: **Runtime** · New in this edition · Related: RT-02, RT-04, RT-08, RT-16, ARCH-014, ARCH-005*

- **Confirmed fact:** The application never checks at runtime that its database, configuration and external tools are usable. It starts against an empty database and builds part of the schema (RT-02). It ships converter paths that cannot work (`\path\to\pdftotext`) and an SMTP default (`localhost:587`, TLS, auth `user`/`password`) that fails where no relay exists; both are only discovered when a user action fails. The careers site returns an empty page with an HTML comment until enabled. Environment checks exist only in the installer and the unauthenticated `installtest.php`.
- **Evidence:**
  - `config.php:62-81` (placeholder converter paths), `:208-225` (mail defaults); `lib/InstallationTests.php` (installer-only checks); `modules/careers/CareersUI.php:98-103`.
  - RT-02 (empty DB accepted, 16 tables created, 24 warnings); RT-08 / #27, #43 (`sh: \path\to\pdftotext: not found`, PDF not searchable); RT-04 / #77, #79, #85, #86 (every send is a fatal); RT-16 (careers blank until enabled, no message).
- **Impact:** Fresh installs look healthy but lose functions silently: PDF résumés are not searchable, all e-mail paths fatal, careers is blank. Operators get no single place that reports what is misconfigured.
- **Severity:** MEDIUM — several features are degraded by default without any diagnostic.
- **Recommendation:** Add a runtime readiness check that validates database schema version, writable paths, converter binaries and mail settings and reports problems to administrators, so misconfiguration is visible before users hit it.
- **Unknown / needs further validation:** Behaviour with a working SMTP relay and correct converter paths. Needs a test environment with those services.

---

## 3. Layering, state and data access

**As built.** Three layers exist by convention only: `*UI` controllers → `lib/` table-gateway classes (`Candidates`, `JobOrders`, `Pipelines`, …, each constructed with a site ID) → `DatabaseConnection::getInstance()` (procedural `mysqli`). All request context lives in one serialized `CATSSession` object in `$_SESSION['CATS']`, read directly by controllers, gateways, templates and the DB wrapper. Tables are MyISAM, so the transaction API is a no-op (DB-003).

### ARCH-003 — Pervasive global state: session god-object and DB singleton as service locators
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-008, PERF-008, PERF-018, TEST-001*

- **Confirmed fact:** `CATSSession` holds 46 private fields (user, site, access level, time zone, MRU, grid state, stored values and the password hash). Library, controller, template and DB code read it directly. The DB wrapper is a static singleton whose `getInstance()` copies the time-zone offset and date format from the session on every call. There is no dependency injection, container or request object.
- **Evidence:**
  - `lib/Session.php:40-87` (fields; `_password` set at `:788`); `$_SESSION` appears 127 times in 27 `lib/*.php` files and 332 times under `modules/` (`git grep -o`).
  - `lib/DatabaseConnection.php:53-75` (`// FIXME: Remove Session tight-coupling here.` at `:62`); 110 `DatabaseConnection::getInstance()` calls; 21 static-only classes in `lib/` (`private function __construct() {}`); 44 `global`/`$GLOBALS` uses outside vendored code.
- **Impact:** Domain code cannot be tested without a live session and database (existing unit tests cover utilities only, TEST-001). Changing the session class shape breaks live sessions. Scaling out needs shared session storage. Hidden coupling makes every refactoring risky.
- **Severity:** HIGH — a major barrier to testing and to any structural change.
- **Recommendation:** Build the request context once and pass it explicitly to the code that needs it, and stop keeping credentials and derived data in the session, so components can be tested and reasoned about in isolation.
- **Unknown / needs further validation:** Session size and lock contention under real use. Needs production-size data and concurrent users.

### ARCH-009 — Database errors are not detected (PHP 7.2) or become uncaught exceptions (PHP ≥ 8.1)
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: DB-002, DB-023, ARCH-005, ARCH-020, RT-02*

- **Confirmed fact:** `DatabaseConnection::query()` detects errors by testing `isset($this->_queryResult->connect_errno)`. `mysqli_query()` returns `false` or a `mysqli_result`, neither of which has that property, so both error branches are unreachable: on PHP 7.2 failed queries return `false` silently and callers continue. The code never calls `mysqli_report()`; on PHP 8.1+ the default report mode is `MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT`, so every SQL error becomes an uncaught `mysqli_sql_exception` and the friendly error branches are bypassed.
- **Evidence:**
  - `lib/DatabaseConnection.php:159-223` (checks at `:184` and `:198`); no `mysqli_report` in the repository (`git grep`).
  - PHP 8.4: `(new mysqli_driver)->report_mode` is `3`.
  - RT-02: SELECTs on a missing table returned `false`; the code continued and printed 23 `mysqli_fetch_assoc() expects parameter 1 to be mysqli_result, boolean given` warnings instead of an error (`evidence/empty-db-before-seed/first-request.html`).
  - `lib/ModuleUtility.php:554-569` records a migration step as applied whatever the result.
- **Impact:** Failed writes look successful to users on PHP 7.2, and failed migrations are recorded as done. On PHP 8.1+ the same failures become fatal pages. Behaviour differs completely between PHP versions.
- **Severity:** HIGH — silent data-integrity risk on the supported runtime.
- **Recommendation:** Make the DB layer detect and surface every failed statement in one consistent way, so callers and operators see errors instead of false success.
- **Unknown / needs further validation:** How often writes fail silently in production. Needs server-side query error logging on a real installation.

### ARCH-010 — Data layer: hand-built SQL in table gateways that also emit HTML and read the session
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-010, SEC-016, DEBT-021*

- **Confirmed fact:** Persistence uses `sprintf` SQL templates with values passed through escape helpers (`makeQueryString`, `makeQueryInteger`, …). No prepared statements exist in `lib/`, `modules/` or `src/`. Gateway classes also hold presentation code: DataGrid column definitions are HTML-producing PHP strings evaluated per cell. Gateways create each other with `include_once` and `new` inside methods.
- **Evidence:**
  - `lib/DatabaseConnection.php:480-498` (`// FIXME: Security issue, this function is not enough for sanitizing` at `:482`); `git grep` for `prepare(`/`bind_param` returns nothing.
  - `lib/Candidates.php:1943,1992,2001` (HTML in `pagerRender`), evaluated in `lib/DataGrid.php:1530,1912`; 82 `pagerRender` definitions.
  - `lib/JobOrders.php:103,240,254,318` (creates `Contacts`, `History`, `Mailer`, `Attachments`); direct SQL also in `modules/install/Schema.php`, `modules/import/Import.php` and several `dataGrids.php`.
- **Impact:** SQL safety depends on every developer choosing the right helper for every value. Business rules cannot be reused outside the web UI or tested without a database.
- **Severity:** MEDIUM — notable maintainability and safety cost; concrete injection points are rated in DB-010/SEC-016.
- **Recommendation:** Move to parameterised queries and keep HTML out of data classes, so query safety no longer depends on per-call discipline and data access can be tested on its own.
- **Unknown / needs further validation:** None.

### ARCH-011 — God classes and god methods
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-006*

- **Confirmed fact:** A few files hold most of the logic, with large hand-written dispatchers and long positional parameter lists.

  | File | LOC | `case` actions in `handleRequest()` |
  |---|---|---|
  | `modules/settings/SettingsUI.php` | 3,842 | 51 |
  | `modules/candidates/CandidatesUI.php` | 3,582 | 32 |
  | `lib/DataGrid.php` | 2,649 | — |
  | `lib/Candidates.php` | 2,473 (3 classes) | — |
  | `modules/import/ImportUI.php` | 2,104 | — |
  | `lib/Search.php` | 2,096 (9 classes) | — |
  | `modules/joborders/JobOrdersUI.php` | 1,972 | — |
  | `modules/careers/CareersUI.php` | 1,794 | — |

- **Evidence:** `wc -l`; `awk` over `handleRequest()`; `Candidates::add()` takes 29 positional parameters and `Candidates::update()` 32 (`lib/Candidates.php:94-99`, `:249-254`). The misaligned `update()` call in the careers portal (API-003) is a direct result.
- **Impact:** High change risk, merge conflicts, slow review and onboarding; argument-order bugs are easy to make and hard to see.
- **Severity:** MEDIUM — notable maintainability cost.
- **Recommendation:** Split the largest controllers by sub-area and replace long positional parameter lists with named structures, so changes are local and argument mistakes are caught.
- **Unknown / needs further validation:** None.

### ARCH-027 — Multi-step workflows have no transaction or outbox; a late failure leaves partial writes
*Confirmation: **Runtime** · New in this edition · Related: RT-04, DB-003, API-011, PERF-005, ARCH-020*

- **Confirmed fact:** Business workflows write several tables and then call external services (SMTP) synchronously in the same request, with no transaction (all tables are MyISAM; `beginTransaction()` ignores errors by design) and no queue or outbox. When a late step throws, earlier writes stay and later steps never run.
- **Evidence:**
  - Careers apply, `modules/careers/CareersUI.php:1190-1600`: candidate add/update (`:1279-1304`), questionnaire (`:1345`), attachment (`:1354`), pipeline (`:1414`), activity (`:1463`), then e-mails (`:1518`, `:1585`, `:1595`).
  - RT-04 / #85, #86: the SMTP exception reached the applicant as a fatal page after the candidate, pipeline row (status 100) and activity were saved; the owner notification did not run and `email_history` stayed empty.
  - Status change: `lib/Pipelines.php:334-347` (UPDATE), `:350-365` (history), `:367-377` (mail); the caller then adjusts job-order openings and schedules an event (`modules/candidates/CandidatesUI.php:3084-3100`, `:3223`), which are skipped if the mail throws (static reading).
  - `lib/DatabaseConnection.php:718-731` (`BEGIN` sent with errors ignored); DB-003 (all 55 tables MyISAM).
- **Impact:** A mail outage leaves records half-processed (e.g. status "Placed" without the openings update) and shows applicants an error after their application was stored, which invites duplicate submissions. There is no retry for the failed side effect.
- **Severity:** HIGH — data-integrity risk in core recruiting workflows, triggered by a common failure.
- **Recommendation:** Make each workflow's writes atomic and move external side effects out of the request path with retry, so a mail or network failure cannot leave partial state or abort the user's action.
- **Unknown / needs further validation:** Behaviour with a reachable but failing SMTP relay (e.g. rejected recipient). Needs a controlled SMTP test server.

---

## 4. Authorization and presentation

**As built.** Authentication is a per-module flag (`_authenticationRequired`); eight modules are public (`careers`, `graphs`, `install`, `login`, `rss`, `toolbar`, `wizard`, `xml`). Authorization is written inline in each action: `if ($this->getUserAccessLevel('candidates.show') < ACCESS_LEVEL_READ) …`. Access levels are integers (`constants.php:74-82`); the fine-grained `ACL_SETUP` map exists only as a commented example in `config.php:343-368`, so `ACL::getAccessLevel()` returns the user's global level (`lib/ACL.php:52-56`). Templates are PHP files included by `Template::display()` (`lib/Template.php:98-129`); `$this->_()` escapes, `echo` does not.

### ARCH-007 — Authorization is opt-in per action with no central policy
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-026, API-005, SEC-013, TEST-004*

- **Confirmed fact:** Each module decides authorization inside its own `switch`. Some modules have no access-level checks at all; AJAX handlers only check that a session is logged in; the fine-grained ACL is inert by default; and the `careerportal` user category is restricted only by eval'd hooks (ARCH-004). Those hooks cover the dispatchers of seven modules (activity, calendar, candidates, companies, contacts, job orders, reports) plus home, profile and tab visibility; `lists`, `import`, `export`, `attachments`, `graphs`, `tests` and every AJAX handler have no such restriction.
- **Evidence:**
  - `modules/candidates/CandidatesUI.php:89-92` (typical inline check); no access-level references in `modules/reports/ReportsUI.php`, `modules/export/ExportUI.php`, `modules/activity/ActivityUI.php`, `modules/home/HomeUI.php` (`grep`).
  - `lib/AJAXInterface.php:202-222`, `:251-260` (login check only); 4 of 32 AJAX handlers check an access level (API §2).
  - `lib/ACL.php:52-56`; `config.php:343-368` (commented `ACL_SETUP`); `modules/settings/SettingsUI.php:87-128`.
  - The baseline used only the administrator account (`SMOKE_TEST.md` §4), so permission differences were not exercised.
- **Impact:** Every new action is a potential privilege bug; the real permission model can only be learned by reading about 10k lines of switch statements. Concrete gaps are listed in SEC-026/API-005.
- **Severity:** HIGH — the design makes authorization gaps likely and hard to audit.
- **Recommendation:** Declare required access per action and per AJAX handler in one place and enforce it before the handler runs, denying by default, so coverage can be reviewed and tested.
- **Unknown / needs further validation:** Actual behaviour for READ/EDIT/"sourcer"/"careerportal" users. Needs authorized role-based testing on an isolated instance.

### ARCH-008 — Raw-PHP templates with opt-in escaping; mixed storage encoding
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-005, DB-014, API-012, API-015*

- **Confirmed fact:** Templates are full PHP (they read `$_SESSION`, call static services and include the Composer autoloader). Escaping requires `$this->_()`; helper classes echo concatenated HTML. Storage encoding is mixed: most recruiter add/edit handlers and the careers portal HTML-encode input with `getSanitisedInput()` before saving (`htmlspecialchars(…, ENT_QUOTES)`), migration `'362'` HTML-encoded all job-order descriptions and notes, while other writers (AJAX handlers, imports, some fields such as EEO values and `source` on add) store raw text.
- **Evidence:**
  - `lib/Template.php:51-54`, `:64-67`, `:98-129`; `modules/candidates/Show.tpl:2-4`.
  - Across 136 templates: 892 `$this->_(` calls vs 429 `echo $this->…` and 15 `<?= $this->…` raw outputs (`git grep -o`; not every raw output is unsafe).
  - `lib/UserInterface.php:388-392`; `getSanitisedInput` call counts: CandidatesUI 44, ContactsUI 38, CompaniesUI 29, CareersUI 22, JobOrdersUI 14, SettingsUI 8, CalendarUI 7; `modules/candidates/CandidatesUI.php:902-926` (mostly sanitised, EEO/`source` raw).
  - `modules/install/Schema.php:1296-1322` (`'362'`); `lib/XmlJobExport.php:218` encodes again for feeds (double encoding, API-012).
- **Impact:** No single output rule is correct: some values are escaped twice (visible entities), others not at all (XSS, SEC-005). Any move to an auto-escaping view layer first needs the stored data normalised.
- **Severity:** HIGH — systemic XSS exposure and a data-normalisation prerequisite for any view change.
- **Recommendation:** Adopt one rule — store raw text, escape on output — and record which stored fields are already encoded, so output escaping can be made automatic without double encoding.
- **Unknown / needs further validation:** How much stored production data is encoded vs raw. Needs a read-only scan of a real database.

### ARCH-024 — Legacy front-end stack loaded globally; editor does not start; not responsive
*Confirmation: **Runtime** · Phase 0 severity: LOW → now MEDIUM (runtime shows broken rich-text editing and a non-responsive layout) · Related: RT-07, RT-13, RT-14, DEP-002, DEP-003, UX findings*

- **Confirmed fact:** Every page loads jQuery 1.3.2 (2009), a custom `lib.js` and `subModal.js` (iframe pop-ups via `showPopWin`) and uses XHTML 1.0 Transitional table layouts with IE-conditional CSS. CKEditor 4 is served from `vendor/`, so `vendor/` must be web-served. One referenced script, `modules/contacts/activityvalidator.js`, does not exist (the candidates counterpart does).
- **Evidence:**
  - `lib/TemplateUtility.php:1178-1216` (`:1193-1194` subModal and jQuery); `modules/joborders/Add.tpl:2`, `modules/candidates/SendEmail.tpl:2` (CKEditor from `vendor/`); `modules/contacts/AddActivityScheduleEventModal.tpl:4,6` (missing file).
  - RT-07 (#19, #78): locked CKEditor 4.25.1 refuses to start without a licence key; fields stay plain textareas.
  - RT-14 (#92, #93, S4–S6): recruiter pages stay 978 px wide at a 390 px viewport; header overlaps.
  - RT-13 (#03): two missing images on the forgot-password page.
- **Impact:** Rich-text editing is unavailable; phones are not usable; old client libraries carry known vulnerabilities (DEP-003).
- **Severity:** MEDIUM — degraded features on every editor page and on mobile.
- **Recommendation:** Stop loading one global legacy bundle on every page and serve third-party assets from a controlled public path, so front-end libraries can be upgraded page by page (details in the UX and dependency assessments).
- **Unknown / needs further validation:** Whether the contacts activity pop-up fails without its validator script (not opened in the baseline). Needs a UI check of that pop-up.

---

## 5. Configuration, errors and operations

**As built.** Configuration is `config.php` (500 lines, 82 `define()`s, tracked in git) plus `constants.php`, plus per-site rows in the `settings` table (types MAILER / CALENDAR / EEO / CAREER_PORTAL, some values PHP-`serialize`d). There is no environment-variable support. Errors end the request with `die()` after an HTML error page. Background work is a DB-backed queue run by `QueueCLI.php`, which is expected to be called by cron. Details in Reference R6–R7.

### ARCH-014 — Configuration is tracked, mutable PHP source rewritten at runtime; no environment support
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: SEC-018, SEC-010, DEBT-011, RT-04, RT-08, ARCH-028*

- **Confirmed fact:** `config.php` is tracked and holds a licence key, DB credentials (`cats`/`password`/`cats_dev`), tester/demo logins, SMTP and LDAP credentials and feature flags. `getenv`/`$_ENV` are not used anywhere. `CATSUtility::changeConfigSetting()` rewrites `config.php` by line prefix and writes the value as raw PHP; the installer passes request values straight into it (`"'" . $_REQUEST['user'] . "'"`), and the settings module, the footer and migrations write it too. Copies of the config have drifted.
- **Evidence:**
  - `config.php:31`, `:40-43`, `:188-197`, `:219-225`, `:273`; `lib/CATSUtility.php:142-181`.
  - Writers: `modules/install/ajax/ui.php:120-135`, `:224-237`, `:410-422`, `:524`, `:696`, `:758`, `:782`; `modules/settings/SettingsUI.php:2727`, `:3124`; `lib/TemplateUtility.php:842-848`; `modules/install/Schema.php:859,863`; `modules/install/OptionalComponents.php:35,39`.
  - Drift: `test/config.php` lacks `LDAP_ACCOUNT`, `LDAP_AD`, `LDAP_ATTRIBUTE_*`, `LDAP_SITEID` and adds `LDAP_UID`; `optional-updates/latest-sphinx-search/config.php` lacks `LEGACY_ROOT`, `AUTH_MODE` and all LDAP constants (`grep`).
  - Runtime: the baseline could not use the web installer without letting it rewrite `config.php`, so it replayed only the DB steps and kept `config.php` read-only; `changeConfigSetting()` then returns `false` silently (`ENVIRONMENT.md` §3 E6–E7, `INSTALLATION.md` §3). Committed defaults caused RT-04 (SMTP) and RT-08 (converter paths).
  - Not exercised: the installer's config writes themselves.
- **Impact:** The web server needs write access to executable code. A quote in installer input corrupts or injects into `config.php` (SEC-010). Container and multi-environment deployment requires editing tracked code. Committed secrets must be treated as public.
- **Severity:** HIGH — writable executable configuration fed from request data, and no safe way to configure per environment.
- **Recommendation:** Separate tracked defaults from per-installation settings, read secrets from the environment or a non-executable file, and stop writing PHP source at runtime, so the code base can be deployed read-only.
- **Unknown / needs further validation:** Whether real installations keep `config.php` writable after install. Needs deployment data.

### ARCH-020 — No error model: `die()` pages, no handler, no logging; fatals served as HTTP 200
*Confirmation: **Runtime** · Phase 0 severity: MEDIUM → now HIGH (runtime shows fatals with stack traces reaching applicants as HTTP 200, and core e-mail paths failing) · Related: RT-03, RT-04, RT-05, RT-06, RT-15, SEC-012, ARCH-027*

- **Confirmed fact:** The application registers no error or exception handler and has no logging facility; the only `set_error_handler` is local to `modules/install/backupDB.php:68`. Failures call `die()` after rendering an error template; `UserInterface::fatal()` echoes the whole `$_REQUEST` into an HTML comment, and the DB connect error prints the MySQL error. Uncaught exceptions and PHP errors are left to `display_errors`.
- **Evidence:**
  - 112 `die(`/`exit(` calls in `lib/*.php` and `modules/` (`git grep`); `lib/UserInterface.php:242-272` (request echo at `:260`); `lib/DatabaseConnection.php:115-140`; `lib/CommonErrors.php:68+`.
  - RT-15: every fatal in the final run was served with HTTP 200 (nginx log: 195 × 200, 11 × 302, no 5xx) and the body contained stack traces with server paths and call arguments.
  - RT-03 (#04) `Users::getPassword()` fatal; RT-04 (#77, #79, #85, #86) uncaught PHPMailer exception, shown to the careers applicant; RT-05 (#88) RSS fatal; RT-06 warnings rendered in the company page.
- **Impact:** Monitoring cannot see failures (all 200). Applicants and users see raw PHP output with internals. Operators have no log beyond whatever `php.ini` provides. Behaviour depends on host `display_errors` settings.
- **Severity:** HIGH — failures are invisible to operations and leak internals on the public site.
- **Recommendation:** Handle all errors in one place so users get a clean error page with a correct status code and operators get a server-side log entry, instead of `die()` pages and displayed stack traces.
- **Unknown / needs further validation:** Behaviour with `display_errors=Off` (typical production); the error pages would then be blank. Needs a run with production PHP settings.

### ARCH-021 — Time zones are integer GMT offsets applied by rewriting SQL text
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-020*

- **Confirmed fact:** Time zones are integer hour offsets relative to the server constant `OFFSET_GMT`; there is no DST handling and fractional zones are commented out. Every `SELECT` containing `DATE_FORMAT(` is rewritten by string manipulation to add or subtract hours; the rewriter splits on the first comma.
- **Evidence:** `config.php:180`; `constants.php:196-283` (`// FIXME: Support fractional GMT offsets.`); `lib/Session.php:607`, `:811`; `lib/DatabaseConnection.php:648-712`; `index.php:54-57`.
- **Impact:** Event and activity times are off by one hour for part of the year in DST regions and wrong for half-hour zones; nested `DATE_FORMAT(` expressions can be corrupted.
- **Severity:** MEDIUM — incorrect times for many users; limited data damage.
- **Recommendation:** Store times in one reference zone and convert per user with real zone names in application code, so DST and fractional zones are correct and SQL is not rewritten.
- **Unknown / needs further validation:** Real-world impact on stored calendar data. Needs production data from DST regions.

### ARCH-016 — Background work depends on an unprovisioned cron calling a web-reachable script
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-018 (merged here), PERF-017, SEC-028*

- **Confirmed fact:** Calendar reminders and queue clean-up run only when something executes `QueueCLI.php`. Nothing in the repository provisions a cron job, and the script has no CLI guard. Each run includes every `modules/*/tasks/tasks.php`, which immediately runs due recurring tasks, then processes one queued task. The UI offers reminder e-mails only if `queue.time` in the web root is less than five minutes old. The framework has defects: duplicate diverging files, recurring tasks stored by name while the runner expects a path, a duplicated `case TASKRET_SUCCESS` (the `SUCCESS_NOLOG` label is unreachable) and a `print_r` of a void return.
- **Evidence:**
  - `QueueCLI.php:26-29` (header: "should be called by cron … (not the website)"), `:78-86`, `:115-118`; `lib/ModuleUtility.php:86-101`.
  - `lib/QueueProcessor.php:126-158` (`:156` stores the name), `:201-226` (path expected), `:210` (`eval`), `:493-525`; `lib/SystemUtility.php:85-88`; `modules/calendar/CalendarUI.php:256-263`.
  - Duplicates: `modules/queue/tasks.php:41` (never loaded) vs `modules/queue/tasks/tasks.php:39`; `modules/queue/lib/Task.php` vs `modules/queue/tasks/lib/Task.php`.
  - No cron in `docker/*.yml`, CI or docs; the baseline environment ran no scheduler (`ENVIRONMENT.md` §2), so the queue was not exercised.
- **Impact:** Reminder e-mails silently never go out on default deployments and the option is hidden without explanation. Anyone who can reach the script over HTTP can trigger task runs.
- **Severity:** MEDIUM — a feature silently absent by default, plus an unguarded trigger.
- **Recommendation:** Document and ship the scheduler as part of the deployment, make the runner CLI-only, and remove the duplicate task files, so background work is reliable and cannot be triggered by visitors.
- **Unknown / needs further validation:** Whether any installation runs `QueueCLI.php` under cron (check the age of `queue.time`). Needs field data.

---

## 6. Storage, search and integrations

**As built.** Attachments are stored under the web root at `attachments/site_<id>/<n>xxx/<md5>/<file>`; text is extracted by `exec()` of external converters (antiword, pdftotext, html2text) or in PHP (RTF, DOCX, ODT) and stored in `attachment.text` for search. Search uses `LIKE` and `REGEXP` over MyISAM tables; Sphinx is optional. External integrations (SMTP, LDAP, Google geocoding, Resfly SOAP, catsone.com version check, job-board XML) are assessed in `API_AUDIT.md` §5.

### ARCH-018 — File storage inside the web root; protection relies on Apache `.htaccess`; converters broken by default
*Confirmation: **Runtime** · Phase 0 severity: MEDIUM → now HIGH (runtime shows candidate files downloadable without a session in the project's own topology) · Related: RT-17, RT-08, SEC-008, SEC-009, SEC-020, DB-011*

- **Confirmed fact:** Attachments, uploads, temp files, backups, `modules.cache` and `queue.time` are written under the document root. Directories are created and chmod'ed `0777`. Protection is Apache-only: `attachments/.htaccess` and `upload/.htaccess` disable script execution but explicitly grant direct access to document and image extensions, so even on Apache files are meant to be reachable by URL. The careers portal writes the raw file path into activity notes. Converter paths default to Windows-style placeholders. ODT extraction passes an undefined variable (`$filename` instead of `$fileName`) and always fails.
- **Evidence:**
  - `lib/Attachments.php:1282-1382` (`0777` at `:1288,1299,1313,1349,1364,1382`); `lib/FileUtility.php:479,488`; `attachments/.htaccess`, `upload/.htaccess`; `modules/careers/CareersUI.php:1447`.
  - `config.php:62-81`; `lib/DocumentToText.php:72` vs `:166`, `:362` (Windows COM), `:378` (`exec`), `:417` (`LIBXML_NOENT | LIBXML_XINCLUDE`, SEC concern).
  - RT-17: an unauthenticated `GET /attachments/site_1/0xxx/<hash>/resume_alex.txt` returned the file under nginx, which ignores `.htaccess`.
  - RT-08 (#27, #43): `sh: \path\to\pdftotext: not found`; PDF text not stored, PDF résumés not searchable. TXT and DOCX extraction work (#42, #44, #87).
- **Impact:** Candidate résumés (PII) are reachable without a session by anyone who obtains the path, which the app itself prints into notes. Security depends on the web server honouring Apache files. PDF and ODT résumés are silently excluded from search by default.
- **Severity:** HIGH — exposure of candidate PII with a modest precondition (knowing the path), in the project's own deployment setup.
- **Recommendation:** Keep stored files outside the document root and serve them only through an access-checked download path, and ship working converter defaults, so file access no longer depends on web-server-specific rules and all résumé formats are indexed.
- **Unknown / needs further validation:** How attachment paths leak in practice (notes, e-mails, logs, referrers). Needs authorized security testing on an isolated instance.

### ARCH-017 — Search is REGEXP/LIKE scanning; Sphinx integration is a 2007 client and a forked file
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: PERF-001, PERF-002, DB-021, DEP-006, ARCH-M03*

- **Confirmed fact:** No FULLTEXT index exists (all 55 tables MyISAM). Boolean résumé and key-skill search compiles to nested `REGEXP '[[:<:]]word[[:>:]]'` predicates; quick search uses leading-wildcard `LIKE` over `CONCAT`/`REPLACE` expressions. Optional Sphinx uses a 2007 client API; `optional-updates/latest-sphinx-search/` ships a forked `Search.php` that uses `create_function` (removed in PHP 8).
- **Evidence:**
  - `lib/DatabaseSearch.php:214-425` (`:360-363`); `lib/Search.php:1358-1376`, `:1866-1900`; `grep -ci fulltext db/cats_schema.sql` → 0; `lib/sphinx/sphinxapi.php` (`$Id … 2007-04-27`); `optional-updates/latest-sphinx-search/Search.php:228,240,301,313`.
  - Runtime (tiny data set): quick search, candidate/company/contact/job-order search and résumé keyword search for TXT/DOCX all work on MariaDB 10.7 (#38–#48).
  - Inferred, not tested: scan cost at scale; MySQL ≥ 8.0.4 rejects the `[[:<:]]` word-boundary syntax (external knowledge).
- **Impact:** Search cost grows linearly with résumé volume and takes table locks on MyISAM. Boolean résumé search would likely fail on MySQL 8.
- **Severity:** MEDIUM — works today on small data and MariaDB; scaling and portability are at risk.
- **Recommendation:** Back text search with an index-supported mechanism and keep one maintained search implementation, so cost does not grow with every résumé and the code runs on current MySQL.
- **Unknown / needs further validation:** Response times at production volume, and behaviour on MySQL 8. Needs production-size data and a MySQL 8 test instance.

---

## 7. Platform compatibility and build

**As built.** The baseline ran on PHP 7.2.16 (EOL since November 2020) with Composer-installed PHPMailer 6.8.0 and CKEditor 4.25.1 (`ENVIRONMENT.md` §2). CI tests PHP 7.2 only. The full PHP 8.4 lint and grep results are in Reference R5.

### ARCH-001 — Application cannot run on any supported PHP version; stack pinned to EOL PHP 7.2
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-019 (merged here), DEP-001, DEBT-001, TEST-002, TEST-003*

- **Confirmed fact:** `lib/CATSUtility.php`, included by `index.php:61`, `ajax.php:41`, `QueueCLI.php:40` and the portal shims, does not parse on PHP 8 (curly-brace string offsets at `:108` and `:122`), so every entry point dies at include time. Behind it, `get_magic_quotes_runtime()`/`get_magic_quotes_gpc()` (removed in 8.0) are called at `index.php:93,99`, `ajax.php:50,56`, `QueueCLI.php:59,65`; the legacy `implode($array, $glue)` order in `DataGrid::_getData()` throws `TypeError` (every list page); vendored FPDF and Artichow do not parse (PDF reports, all graphs). CI, Docker and PHPUnit 7.5 are pinned to PHP 7; the installer only requires PHP ≥ 5.0.0 and does not warn on PHP 8.
- **Evidence:**
  - `php -l` (PHP 8.4.19) over 491 files: 6 parse failures — `lib/CATSUtility.php:108`, `lib/fpdf/fpdf.php:434`, `lib/fpdf/font/makefont/makefont.php:18`, `lib/artichow/AntiSpam.class.php:63`, `src/OpenCATS/Entity/JobOrderRepositoryException.php:2`, and an intentional SimpleTest fixture.
  - PHP 8.4: `function_exists('get_magic_quotes_gpc')` → `false`; `implode(array('a'), ',')` → `TypeError`; `lib/DataGrid.php:1292,1299,1328,1329`.
  - `.github/workflows/ci.yml:21` (`php-version: ['7.2']`); `docker/docker-compose.yml:14`; `composer.json` (`phpunit/phpunit ^7.5.7`, no `php` constraint); `lib/InstallationTests.php:164`.
  - Runtime: the baseline ran only on PHP 7.2.16; PHP 8 was not run.
- **Impact:** Operators must run an end-of-life PHP with no security fixes. Hosts that offer only PHP 8.x cannot run OpenCATS at all.
- **Severity:** CRITICAL — the system cannot run on any supported PHP platform.
- **Recommendation:** Remove the PHP-8-incompatible constructs listed in Reference R5 and test on a supported PHP version in CI, so the application can run on a maintained runtime.
- **Unknown / needs further validation:** Further PHP 8 runtime breakages hidden behind the first fatal (null-to-string, `count()` on non-arrays; RT-06 already shows `count()` warnings on 7.2 that become `TypeError` on 8). Needs a PHP 8 test environment with a database.

### ARCH-002 — Release artifact omits `vendor/` although the runtime hard-requires it; CI lints only `src/`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-004, TEST-003*

- **Confirmed fact:** The GitHub `release` job zips the checkout without running Composer, and `vendor/` is git-ignored. Runtime code unconditionally loads `./vendor/autoload.php` (with `require` in `Mailer.php`) and serves CKEditor from `vendor/`. The CI lint step covers only `src/` (24 of 355 PHP files).
- **Evidence:** `.github/workflows/ci.yml:106-119` (zip at `:119`, no Composer step), `:44` (lint); `.gitignore` (`vendor/*`, `/vendor/`); `lib/TemplateUtility.php:38`, `lib/Companies.php:2`, `lib/JobOrders.php:2`, `lib/Mailer.php:43`, `modules/*/Show.tpl:2-3`, `modules/joborders/Add.tpl:2`. The baseline had to run `composer install --no-dev` before the app would start (`INSTALLATION.md` §1 step 2).
- **Impact:** A release zip used as-is fails with a missing-file fatal on the first page (inferred; the release job was not run). PHP-version regressions in `lib/` and `modules/` pass CI.
- **Severity:** HIGH — the official release artifact is not runnable without undocumented steps.
- **Recommendation:** Make the release artifact self-contained and lint all PHP and template files in CI, so what is published runs and parse errors are caught before release.
- **Unknown / needs further validation:** Whether published release zips were ever tested by users. Needs the release download history or a test of a published artifact.

---

## 8. Legacy layers: `src/OpenCATS`, multi-site and licensing remnants

**As built.** Three unfinished or abandoned structures sit inside the running code: a small PSR-4 layer (`src/OpenCATS`, Composer autoload), the multi-tenant (`site_id`) model from hosted CATS, and the licensing/"Professional" machinery of the commercial CATS product.

### ARCH-012 — `src/OpenCATS` PSR-4 layer is stalled and partly broken
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: DEBT-009*

- **Confirmed fact:** `src/OpenCATS` has 24 files / 3,903 LOC: 6 `Entity` files (Company and JobOrder entities, repositories, exceptions), 3 `UI` quick-action-menu classes and 15 test files. Only `Companies::add()` and `JobOrders::add()` use the repositories; the menus are built in four `Show.tpl` files and `TemplateUtility`. Repositories take the legacy `DatabaseConnection` and build SQL the same way as `lib/`. `JobOrderRepositoryException.php` does not parse on PHP 8 (`namespace \OpenCATS\Entity;`), and `lib/Companies.php:109` catches `CompanyRepositoryException` without importing it, so that catch never matches.
- **Evidence:**
  - `lib/Companies.php:2-4`, `:105-112`; `lib/JobOrders.php:2-6`, `:106-136`; `lib/TemplateUtility.php:43`, `:1140`; `modules/{candidates,companies,contacts,joborders}/Show.tpl:2-4`; `src/OpenCATS/Entity/JobOrderRepositoryException.php:2`; `src/OpenCATS/UI/QuickActionMenu.php:13,22,28`.
  - Runtime: adding a company (#10) and a job order (#19) succeeded, i.e. the repository happy path works on PHP 7.2; the error paths were not exercised.
- **Impact:** Two conventions coexist without a direction; an insert failure for companies or job orders becomes a fatal instead of a handled error.
- **Severity:** MEDIUM — maintainability cost and two latent error-path fatals.
- **Recommendation:** Fix the broken namespace and import, and record whether `src/` is the intended home for new code, so contributors do not extend two patterns at once.
- **Unknown / needs further validation:** How PHP 7.2 treats `namespace \OpenCATS\Entity;` when the file is autoloaded (expected: an "undefined constant" error). Needs a PHP 7.2 check of the error path.

### ARCH-013 — Multi-site (`site_id`) model is vestigial
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-012, SEC-008, API-012*

- **Confirmed fact:** 36 of 55 tables carry `site_id`, and gateways are constructed with the session's site ID (about 320 `site_id = %s` predicates, 901 `_siteID` references). But the careers, RSS and XML portals always serve `Site::getFirstSiteID()` (lowest non-admin site); the per-site override is an unimplemented hook. Attachment download builds its WHERE clause with `|| true`, bypassing the site filter, and relies on an MD5 of the directory name. Hosted-service branches remain: login `&s=<unixName>`, a special `CATS_ADMIN_SITE = 180`, hard-coded `'cognizo'` and site `200` exceptions ("TODO: Remove me"), an unused `transparentLogin()`, a `demo.catsone.com` redirect.
- **Evidence:** `awk` over `db/cats_schema.sql` (36 tables with `site_id`); `lib/Site.php:161-182`; `modules/careers/CareersUI.php:79,81`, `modules/rss/RssUI.php:103,105`, `modules/xml/XmlUI.php:107,109`; `modules/attachments/AttachmentsUI.php:83-86`, `lib/Attachments.php:595-605`; `constants.php:187`; `lib/Session.php:200-212`, `:939`; `index.php:246-250`; `db/cats_schema.sql:858` (`extension-statistics` module row).
- **Impact:** The code carries multi-tenant complexity without end-to-end support; a second site gets no careers page or feeds, and tenant isolation cannot be relied on.
- **Severity:** MEDIUM — complexity and a latent isolation gap; single-site installs work (baseline).
- **Recommendation:** Decide whether the product is single-site or multi-site and make the code consistent with that decision, so isolation is either enforced everywhere or the unused machinery is removed.
- **Unknown / needs further validation:** Whether any installation runs more than one site. Needs field data.

### ARCH-019 — Hosted-CATS / "Professional" remnants are still loaded and still change behaviour
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: DEBT-015, API-009, API-010, SEC-017, ARCH-M01*

- **Confirmed fact:** Licence checks are hard-wired to `true` (`LicenseUtility::isProfessional()`, `validateProfessionalKey()`, `isParsingEnabled()`), which switches on Professional-only paths: the Resfly parsing UI, the Firefox-toolbar module, and a footer routine that may rewrite `LICENSE_KEY` in `config.php` on about 1 in 11 page views (a no-op today because validation returns `true`). A version check can phone home to `www.catsone.com:80` with the site name and licence key (off only because the seeded `system` row disables it). 241 of 251 hook names are unimplemented hosted-CATS extension points. Seven `lib/` files (4,181 LOC) have no references (CODEBASE_MAP §8).
- **Evidence:**
  - `lib/License.php:580-591`, `:658-706`; `lib/TemplateUtility.php:842-848`; `modules/toolbar/ToolbarUI.php:114`; `lib/NewVersionCheck.php:76`, `:100-122`, `:198-224`; `db/cats_schema.sql:1038-1044`; `lib/CommonErrors.php:74-88` ("Upgrade to Professional").
  - Runtime: with `PARSING_ENABLED=false`, the add-candidate page still renders the parser layout ("Manually enter information / OR import resume", step #22), showing that `isParsingEnabled()` returned `true`. The SOAP call itself was not exercised.
- **Impact:** Dead features look live (parsing, toolbar), attack surface and PHP-upgrade scope are larger than the product, and a phone-home path exists for any database missing the seeded row.
- **Severity:** MEDIUM — misleading behaviour and wasted scope; no core workflow broken.
- **Recommendation:** Remove or explicitly disable the commercial and hosted-service paths, so the code base matches the open-source product and no hidden outbound calls remain.
- **Unknown / needs further validation:** Whether any installation relies on the toolbar or Resfly parsing. Needs field data.

---

## Reference material

### R1. Entry-point inventory

"Auth" is what the entry point itself enforces.

| Entry point | Bootstrap (evidence) | Auth | Runtime status (baseline) |
|---|---|---|---|
| `index.php` | `config.php` `:42`; install gate `:44-48` (bypassed by `POST performMaintenence`); `constants.php` + 11 lib files `:59-70`; session `:74-75`; magic quotes `:93-109`; dispatch `:176-274` | Per module: `moduleRequiresAuthentication($_GET['m'])` `:195`, `:256` | Works (#01–#94) |
| `ajax.php` | `config.php`, `constants.php`, `DatabaseConnection`, `Session`, `AJAXInterface`, `CATSUtility` `:36-41`; `f=fn` → `ajax/fn.php`, `f=mod:fn` → `modules/mod/ajax/fn.php` `:75-92`; buffered include, `AJAX_HOOK` eval, `$filters` eval `:108-131`. No install gate | Delegated to each handler (`SecureAJAXInterface` = login only) | 42 POSTs in the final run, all HTTP 200 (`nginx.log`) |
| `careers/index.php` | `$careerPage = true; chdir('..')`, `config.php`, `CATSUtility`, include `getIndexName()` `:34-39` | None (module public) | Works after enabling (#80–#86); blank before (RT-16) |
| `xml/index.php` | Same pattern `:34-39` | None | Works (#89) |
| `rss/index.php` | Uses `LEGACY_ROOT` before config `:37` | None | Fatal (RT-05, #88); `index.php?m=rss` path not tested |
| `QueueCLI.php` | `chdir(__DIR__)`, config, 13 lib files, `modules/queue/constants.php` `:34-52`; session `:55-56` | None, no SAPI check | Not run (no scheduler in baseline) |
| `installwizard.php` → `ajax.php?f=install:ui` | `constants.php`, `config.php`, `TemplateUtility` | `modules/install/ajax/ui.php:55` refuses when `INSTALL_BLOCK` exists | Not run (would rewrite `config.php`) |
| `installtest.php` | `config.php`, `InstallationTests` `:32` | None, no `INSTALL_BLOCK` check | Not run |
| `rebuild_old_docs.php` | `config.php`, raw `mysqli_connect` | None, no SAPI check | Not run |
| `scripts/*.php`, `scripts/*.sh` | `makeBackup.php` (CLI check `:37`, runs when `argv[1]` set `:52-62`), `sphinxtest.php` (CLI check `:18`); shell scripts target hosted-CATS paths | `scripts/index.php` is empty; no `.htaccess` | Not run |
| `attachments/…` (static files) | Served by the web server; `.htaccess` is Apache-only | None under nginx | Directly downloadable (RT-17) |
| `index.php?m=toolbar` | `modules/toolbar/ToolbarUI.php` (public module) | Logs in from `$_GET` credentials `:95-96` | Not tested |
| `wsdl/*.wsdl` | Static client descriptors for `soap.resfly.com` and `catsone.com` | n/a | Not used in baseline |

### R2. Request lifecycle (authenticated page, e.g. `index.php?m=candidates&a=show&candidateID=5`)

1. **Config and gate.** `config.php` (`:42`) defines constants; without `INSTALL_BLOCK` the request is sent to `modules/install/notinstalled.php` (`:44-48`).
2. **Eager includes.** `index.php:59-70`; `lib/TemplateUtility.php:38-39` loads `./vendor/autoload.php` and `Candidates.php` at file scope, which pulls in most of the domain layer (49 files in total).
3. **Session.** `session_name('CATS')`, `session_start()` (`:74-75`); `$_SESSION['CATS']` is unserialized into `CATSSession` (class loaded first at `:67`). No `session_regenerate_id()` anywhere (SEC-007).
4. **Per-request DB work.** Forced-logout SELECT (`:142-173`); `logPageView()` UPDATE of `user_login` on each page view (`:207`, `:271`; `lib/Session.php:618-630`).
5. **Module list.** First request of a session: discovery + migrations (§2). Module names are whitelisted against the discovered list, so `m` cannot traverse paths.
6. **Dispatch.** `loadModule()` includes the controller (`lib/ModuleUtility.php:71`), evals `LOAD_MODULE` (`:76`), instantiates and calls `handleRequest()` (`:78-79`). The controller evals its `*_HANDLE_REQUEST` hook, reads `$_GET['a']` (`lib/UserInterface.php:193-201`) and switches (e.g. `CandidatesUI.php:81-370`, 32 cases; default `listByView`).
7. **Authorization.** Inline, e.g. `getUserAccessLevel('candidates.show')` → `CATSSession::getAccessLevel()` → `ACL::getAccessLevel()` (inert map) → the user's global level.
8. **Data.** Gateways (`new Candidates($siteID)`) build SQL with `sprintf` + escape helpers; `DatabaseConnection::query()` rewrites `DATE_FORMAT(` for the user's offset (`:648-712`).
9. **Render.** `$this->_template->assign(...)`, `display('./modules/candidates/Show.tpl')`: `ob_start`, `include`, leading-whitespace stripping unless the page contains `<!-- NOSPACEFILTER -->` or `textarea`, filter `eval`, echo (`lib/Template.php:98-129`). Templates call static `TemplateUtility::print*` helpers that read `$_SESSION` directly.
10. **End.** Errors call `die()` via `CommonErrors::fatal()` or `UserInterface::fatal()`; the footer prints server response time and version.

**Other interaction paths (runtime, `CURRENT_UI_MAP.md`):** pop-ups are full server-rendered pages loaded into an iframe by `showPopWin(url, w, h)` (`js/submodal/subModal.js:122`); AJAX goes to `ajax.php` with `f=<module>:<function>` in a POST body; data-grid state is JSON in the `parametersN` GET parameter; the careers site uses `careers/index.php?p=<page>`; graphs are server-rendered images from `index.php?m=graphs&a=…`.

### R3. Module system

- 23 module directories, each with one `<Name>UI.php` extending `UserInterface` (`lib/UserInterface.php:38-433`). Public modules: `careers`, `graphs`, `install`, `login`, `rss`, `toolbar`, `wizard`, `xml` (`_authenticationRequired = false`).
- Tabs and sub-tabs with access levels are encoded in strings such as `'…&a=add*al=200@candidates.add'` and parsed at render time by `TemplateUtility::printTabs()` (`lib/TemplateUtility.php:570-800`).
- Module schema: `getSchema()` returns `version => SQL | 'PHP:<code>'`; only `CATSUI` (install) declares one (`modules/install/CATSUI.php:39`).
- Module tasks: `registerModuleTasks()` includes `modules/*/tasks/tasks.php` (`lib/ModuleUtility.php:86-101`); only `calendar` (Reminders) and `queue` (CleanExceptions) register tasks.
- Core order and presence: `$coreModules` (`constants.php:30-41`), checked by `_checkCoreModules()` (`lib/ModuleUtility.php:302`, `:321-344`).

### R4. Code-as-string (`eval`) inventory

| Mechanism | Storage | Executed at | Count |
|---|---|---|---|
| Hooks | `$_SESSION['hooks']` (from `getHooks()`) | `eval(Hooks::get('X'))` | 278 sites, 50 files, 251 names, 10 implemented |
| DataGrid renderers | PHP strings in column definitions | `lib/DataGrid.php:1206,1211,1441,1530,1912` | 82 `pagerRender` definitions |
| Schema migrations | `modules/install/Schema.php` | `lib/ModuleUtility.php:542` | 25 `PHP:` steps |
| Queue tasks | Class name from task path | `lib/QueueProcessor.php:210` | 2 recurring tasks |
| Wizard pages | `$_SESSION['CATS_WIZARD']` | `modules/wizard/WizardUI.php:181` | — |
| Installer components | `modules/install/OptionalComponents.php` | `modules/install/ajax/ui.php:544,551,1162` | — |
| Careers fields / cookie | Field names | `modules/careers/CareersUI.php:280,285,1272` | — |
| Output filters | `Template::addFilter()` (no callers), `ajax.php` `$filters` (never filled) | `lib/Template.php:125`, `ajax.php:127` | dead |

### R5. PHP 8 compatibility matrix (PHP 8.4.19 CLI, re-run for this edition)

| Construct | Locations | PHP status | Effect on PHP ≥ 8.0 |
|---|---|---|---|
| `$str{n}` string offsets (parse error) | `lib/CATSUtility.php:108,122`; `lib/fpdf/fpdf.php:434`; `lib/fpdf/font/makefont/makefont.php:18`; `lib/artichow/AntiSpam.class.php:63` | removed 8.0 | Every entry point dies (CATSUtility); PDF report and all graphs die |
| `namespace \OpenCATS\Entity;` | `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` | parse error | Job-order insert error path fatal |
| `get_magic_quotes_runtime/gpc()` | `index.php:93,99`; `ajax.php:50,56`; `QueueCLI.php:59,65`; `lib/Attachments.php:944`; `lib/InstallationTests.php:185`; `modules/import/ImportUI.php:495`; `lib/fpdf/fpdf.php:911,1170` | removed 8.0 | Fatal on every request and in the installer check |
| `implode($array, $glue)` | `lib/DataGrid.php:1292,1299,1328,1329` | removed 8.0 (`TypeError` verified) | Every data-grid list page fatal |
| Property on undefined variable | `lib/ModuleUtility.php:307-308` | `Error` in 8.0 | Fatal when `CACHE_MODULES=true` |
| `each()` | `lib/fpdf/fpdf.php:1285` | removed 8.0 | PDF output fatal |
| `mysql_*` | `modules/install/Schema.php:725,854,1236` | removed 7.0 | Already fatal on 7.2 (RT-01) |
| `mcrypt_*` | `lib/Encryption.php:52-110` | removed 7.2 | Unused file |
| `create_function` | `optional-updates/latest-sphinx-search/Search.php:228,240,301,313` | removed 8.0 | Fatal if the optional update is applied |
| mysqli default report mode | `lib/DatabaseConnection.php` (no `mysqli_report`) | changed 8.1 (mode `3` verified) | SQL errors become uncaught exceptions |
| `count()` on non-countable | `modules/companies/Show.tpl:311,349,393` | warning on 7.2 (RT-06), `TypeError` on 8.0 | Company detail page fatal (inferred) |
| Dynamic properties | `lib/Template.php:66` (every `assign()`), `src/OpenCATS/UI/QuickActionMenu.php:13`, `lib/Session.php:850` | deprecated 8.2 | Notices on every page; `Session.php:850` also means column preferences are never loaded |
| `array('self', …)` callable | `lib/ModuleUtility.php:299` | deprecated 8.2 | Notice |
| `strftime()` | `lib/DateUtility.php:148,472,476,480`; `lib/Calendar.php:575` | deprecated 8.1 | Notice |
| `utf8_encode()` / `libxml_disable_entity_loader()` | `lib/DocumentToText.php:424,515` / `:415` | deprecated 8.2 / 8.0 | Notice |

### R6. Configuration surfaces

| Surface | Contents | Writers |
|---|---|---|
| `config.php` (tracked) | 82 constants: DB, paths, mail, LDAP, licence key, feature flags (`ENABLE_SPHINX`, `CACHE_MODULES`, `US_ZIPS_ENABLED`, `CATS_SLAVE`, `ENABLE_DEMO_MODE`, `PARSING_ENABLED`), commented `ACL_SETUP`/`JOB_TYPES`/status examples | Installer, settings (licence), footer, migrations (ARCH-014) |
| `constants.php` | Version, core module order, access levels, data-item types, pipeline statuses, `CATS_ADMIN_SITE`, time zones, bad file extensions | Code only |
| `settings` table | Per-site key/value by type (MAILER, CALENDAR, EEO, CAREER_PORTAL); some serialized PHP (DB-019) | Settings UI |
| `system` table | UID, version-check state (`disable_version_check`) | Installer seed, settings |
| Files in web root | `INSTALL_BLOCK`, `modules.cache`, `queue.time`, `cleanup.time` | Installer, runtime |
| Copies | `test/config.php`, `optional-updates/latest-sphinx-search/config.php` (drifted) | Manual |

### R7. Runtime baseline facts used in this document

- Stack: PHP 7.2.16 FPM (image built 2019), nginx 1.17.3, MariaDB 10.7.8; `display_errors=On`, `error_reporting` hides notices and deprecations (`ENVIRONMENT.md` §2).
- Final smoke run: 206 nginx requests, 195 × 200 and 11 × 302, no 4xx/5xx from PHP routes; 3 distinct PHP fatals (6 occurrences) and 8 distinct warnings; server time 24–73 ms per page on a near-empty DB (`KNOWN_RUNTIME_ERRORS.md`).
- Install path: empty-database install works; demo-data install is unusable (RT-01); first request after seeding runs migration `'364'` (`INSTALLATION.md` §1, §5).

---

## Area-level unknowns

1. **Behaviour on PHP 8.x beyond the first fatal.** Static checks list the hard blockers; null-to-string, `count()` and arithmetic changes cannot be enumerated statically. Validate by running the app with a database on PHP 8.x after the blockers are removed in a throw-away copy.
2. **Real deployment topologies.** Apache vs nginx, single host vs containers, TLS proxies, PATH_INFO, opcache and `display_errors` settings decide ARCH-018, ARCH-022, ARCH-026 and ARCH-020 in practice. Validate with a survey of installations or published deployment guides.
3. **Upgrade population.** How many installations carry schemas older than migration `'225'` and would hit RT-01 on upgrade. Validate with field data or upgrade reports.
4. **Scheduler use.** Whether any installation runs `QueueCLI.php` under cron (age of `queue.time`). Validate on real installations.
5. **Stored encoding mix.** How much production data is HTML-encoded vs raw (ARCH-008). Validate with a read-only scan of a real database.
6. **Scale.** Cost of per-session module discovery, eager loading and REGEXP search at production volume. Validate with production-size data and load (PERFORMANCE_AUDIT owns the method).
7. **Role behaviour.** Actual authorization outcomes for non-administrator roles (baseline used only `admin`). Validate with authorized role-based testing on an isolated instance.
8. **Multi-site use.** Whether any installation runs more than one site (ARCH-013). Validate with field data.
9. **Release artifacts.** Whether published GitHub release zips run without a manual `composer install` (ARCH-002). Validate by testing a published artifact on a clean host.

## Changes from the Phase 0 edition

- **Re-rated:** ARCH-006 HIGH → MEDIUM (security part owned by SEC-028 at MEDIUM; remainder is maintainability). ARCH-018 MEDIUM → HIGH (RT-17: candidate files downloadable without a session in the project's own topology). ARCH-020 MEDIUM → HIGH (RT-15/RT-04: fatals with stack traces served as HTTP 200, including to applicants). ARCH-024 LOW → MEDIUM (RT-07 editor does not start; RT-14 not responsive).
- **New:** ARCH-026 (PDF report self-HTTP fetch; RT-09), ARCH-027 (no transaction/outbox around multi-step workflows; RT-04), ARCH-028 (no startup/configuration validation; RT-02, RT-08, RT-16).
- **Merged in from `API_AUDIT.md`:** API-019 → ARCH-001 (same PHP 8 blockers); API-018 → ARCH-016 (queue/cron defects; the duplicated `case TASKRET_SUCCESS` detail moved here).
- **Upgraded to Runtime:** ARCH-004 (RT-01 eval stack trace), ARCH-005 (RT-01, RT-02, INSTALLATION 5b), ARCH-009 (RT-02), ARCH-015 (RT-01, RT-02), ARCH-018 (RT-17, RT-08), ARCH-020 (RT-03/04/05/15), ARCH-022 (RT-05), ARCH-024 (RT-07/13/14), ARCH-025 (RT-09, RT-17). Partial: ARCH-006, ARCH-012 (#10, #19), ARCH-014, ARCH-017 (#38–#48), ARCH-019 (#22).
- **Corrected facts:**
  - ARCH-005: `Schema.php` has 195 version keys up to 364 (not "364 versions"), and key `'283'` is duplicated. A failed SQL step is recorded as applied, but a PHP fatal in a `PHP:` step is not, so the step re-runs and re-fails on every request (RT-01) — Phase 0 described only the first case.
  - ARCH-004/ARCH-019: 251 distinct hook names (not 232), 241 unimplemented (not 222).
  - ARCH-003: `$_SESSION` occurrence counts re-measured (127 in 27 lib files, 332 in modules); 44 `global`/`$GLOBALS` uses.
  - ARCH-008: most recruiter add/edit handlers also HTML-encode on input (`getSanitisedInput`), not only the careers portal; the storage mix is broader than Phase 0 stated.
  - ARCH-011: `Candidates::add()` has 29 parameters (not 30).
  - ARCH-020: 112 `die(`/`exit(` calls (not 89).
  - ARCH-024: `modules/candidates/activityvalidator.js` exists; only `modules/contacts/activityvalidator.js` is missing.
  - ARCH-013: about 320 `site_id = %s` predicates with the stated pattern (Phase 0 quoted 342 with a looser pattern).
- **Removed from this document:** Phase 0 implementation-level recommendations (specific libraries, file names, CI steps, target designs) were reduced to findings-level statements of what should change and why.
