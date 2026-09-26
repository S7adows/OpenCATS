# OpenCATS — Technical Debt Assessment

Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **Inspected:** all tracked first-party code (PHP, `.tpl` templates, JS, shell), with vendored libraries (`lib/artichow`, `lib/fpdf`, `lib/simpletest`, `lib/sphinx`) counted separately. Security, database, performance and API behaviour appear here only where they are also code-quality debt; those areas are cross-referenced (SEC-, DB-, PERF-, ARCH-, API-, DEP-, TEST-).
- **Scope terms:** *first-party PHP* = 213 files / 89,956 lines; *production* = first-party minus test code (186 files / 82,914 lines); *vendored PHP* = 142 files / 47,400 lines; *templates* = 136 `.tpl` files / 16,914 lines (§8.1).
- **Commands:** read-only `git ls-files`, `git grep`, `grep -c`, `wc -l`, `diff -w`, `git log --name-only`, `php -l` and small `php -r` checks on the local PHP 8.4 CLI. Token, complexity, clone, dynamic-property and docblock counts come from the Phase 0 scanner scripts (PHP tokenizer and a Python clone detector; they read repository files and write only to the audit scratch area), re-run for this edition with the same results. §11 lists the commands behind every number kept.
- **Execution evidence:** Phase 0.5 baseline (`KNOWN_RUNTIME_ERRORS.md` RT-01…RT-17, `SMOKE_TEST.md` steps #NN, `INSTALLATION.md`, `ENVIRONMENT.md`, `evidence/final-run/php_errors.log`); the CI job log of the check "Tests (PHP 7.2)" on PR #1 (workflow run [36237531847](https://github.com/S7adows/OpenCATS/actions/runs/36237531847), 2026-09-26; public on GitHub Actions for the log-retention period, a copy is not committed).
- **Limits:** history is shallow (boundary `8ad6c59`, 2022-07-07), so churn covers about 3.5 years. Complexity and function length are token heuristics; clone detection finds exact 8-line normalized windows only, so clone figures are lower bounds. Nothing was run on PHP 8 except one-line checks of language behaviour.

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| DEBT-001 | The application cannot parse or boot on any PHP 8.x runtime | CRITICAL | Static |
| DEBT-002 | CI, Docker and the installer are pinned to or unaware of PHP versions; CI lints 24 of 355 PHP files | HIGH | Runtime |
| DEBT-003 | Dynamic properties are a core mechanism (879 `assign()` sites, 178 undeclared properties in 28 classes), plus other PHP 8.x deprecations | HIGH | Static |
| DEBT-004 | Extension model based on `eval()`: 278 hook sites, 251 hook names, 10 implemented, and part of authorization runs through them | HIGH | Static |
| DEBT-005 | Code stored as strings elsewhere (DataGrid renderers, 25 `PHP:` migrations, wizard, installer, careers) and run with `eval()` | HIGH | Runtime |
| DEBT-006 | God classes and god methods: 17 functions over 300 lines, 13 with approximate complexity above 50 | HIGH | Static |
| DEBT-007 | Business rules live in controllers and are duplicated and divergent | HIGH | Static |
| DEBT-008 | Global state everywhere: `$_SESSION['CATS']` (386 uses), DB singleton (110), 1,505 cross-class static calls, 0 interfaces | HIGH | Static |
| DEBT-009 | The PSR-4 `src/OpenCATS` layer stalled at about 1% of runtime code and contains a broken exception class and a dead `catch` | MEDIUM | Static |
| DEBT-010 | Latent defects in core classes (column preferences lost, `=` in a condition, no-op sanitiser, dead DB error path, undefined methods) | HIGH | Runtime |
| DEBT-011 | Configuration is tracked PHP source with secrets and placeholder defaults; the installer writes request values into PHP code | HIGH | Runtime |
| DEBT-012 | Domain enumerations and IDs are hard-coded and duplicated (pipeline statuses in code, DB and literal SQL; magic site IDs) | MEDIUM | Static |
| DEBT-013 | Duplicated code: 13.7% of first-party PHP lines and 20.8% of template lines sit in exact clones, plus forked files | MEDIUM | Static |
| DEBT-014 | Library code handles errors by `die()`, `@` and `echo` (153 / 178 / 539 in production) | MEDIUM | Static |
| DEBT-015 | Dead code and commercial CATS remnants: 4,181 lines never loaded, neutered licensing, phone-home, SOAP parser, toolbar | MEDIUM | Static |
| DEBT-016 | 47,400 lines of unmaintained vendored PHP in `lib/`, jQuery 1.3.2 and IE-era front-end code | MEDIUM | Static |
| DEBT-017 | Runtime module discovery loads every controller and applies schema migrations during page views; three migration mechanisms | MEDIUM | Runtime |
| DEBT-018 | Build and tooling: no analysers or formatters, dead Travis setup, workflows that never run, release zip without `vendor/`, manual versioning | MEDIUM | Static |
| DEBT-019 | Documentation is stale or missing (changelog ends 2016, no architecture or API docs, placeholder docblocks) | MEDIUM | Static |
| DEBT-020 | Almost no type information (7 typed parameters, 0 return types, 0 `strict_types`) | MEDIUM | Static |
| DEBT-021 | Controllers and `lib/` emit HTML strings, templates carry logic, escaping is opt-in | MEDIUM | Static |
| DEBT-022 | SVN-era and Cognizo legacy headers; build number read from `.svn/entries` | LOW | Static |
| DEBT-023 | Formatting hygiene: mixed indentation, trailing whitespace, CRLF files, output after `?>` | LOW | Static |
| DEBT-024 | Includes relative to the working directory make entry points depend on the CWD | LOW | Static |
| DEBT-025 | [Merged into DEBT-007] Absolute URLs built from `http://` + `HTTP_HOST` | — | — |
| DEBT-026 | [Merged into DEBT-005] Unused `eval` extension points | — | — |
| DEBT-027 | [Merged into DEBT-003] Optional-before-required parameters | — | — |
| DEBT-028 | [Merged into DEBT-023] Stray output after `?>` in an AJAX endpoint | — | — |
| DEBT-029 | No application error boundary: fatals and uncaught dependency exceptions render as HTTP 200 pages with stack traces | HIGH | Runtime |
| DEBT-030 | Loose type handling prints PHP warnings into pages today and becomes fatal `TypeError`s on PHP 8 | MEDIUM | Runtime |
| DEBT-031 | Front-controller bootstrap is copied across entry points and the copies have drifted (RSS feed broken) | MEDIUM | Runtime |

27 findings — 1 CRITICAL / 10 HIGH / 13 MEDIUM / 3 LOW · Runtime 8 / Static 19 / Partial 0 / Unverified 0 · 4 merged stubs (DEBT-025…DEBT-028) excluded from the counts.

## 1. Platform and runtime compatibility

### DEBT-001 — The application cannot parse or boot on any PHP 8.x runtime
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-001, TEST-003, ARCH-001, DEBT-030*

- **Confirmed fact:** The shared bootstrap file has a PHP 8 parse error, and the request path calls functions removed in PHP 8.0. Any PHP ≥ 8.0 stops every entry point before a page is served. The blockers are layered: fixing one exposes the next. The application runs on PHP 7.2 (baseline, 14 of 15 areas usable).
- **Evidence:**
  1. Parse error in a file every entry point includes: `lib/CATSUtility.php:108` `if ($data{0} === '<')` and `:122` → `php -l` (PHP 8.4): "syntax error, unexpected token "{" … on line 108". Included at `index.php:61`, `ajax.php:43`, `careers/index.php:38`, `rss/index.php:37`, `xml/index.php:38`, `QueueCLI.php:40`.
  2. Removed functions in the bootstrap: `index.php:93,99`, `ajax.php:50,56`, `QueueCLI.php:59,65` call `get_magic_quotes_runtime()`/`get_magic_quotes_gpc()`; on PHP 8.4 this is "Call to undefined function" (`php -r` check).
  3. List views: `lib/DataGrid.php:1292,1299,1328,1329` call `implode($array, $glue)`; on PHP 8.4 this is a `TypeError` (`php -r` check). `_getData()` runs for every DataGrid.
  4. Uploads and import: `lib/Attachments.php:944`, `modules/import/ImportUI.php:495` call `get_magic_quotes_gpc()`.
  5. Graphs and PDF: `lib/GraphGenerator.php:43` includes `lib/artichow/AntiSpam.class.php` (parse error `:63`); `modules/reports/ReportsUI.php:414` includes `lib/fpdf/fpdf.php` (parse error `:434`).
  6. Job-order save failure path: `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` does not parse (DEBT-009).
  7. Warnings seen on PHP 7.2 that turn into `TypeError`s on PHP 8 (DEBT-030: RT-02, RT-06).
- **Impact:** Operators must keep an end-of-life PHP 7.x runtime; any hosting upgrade takes the application down completely. CI does not show any of this (DEBT-002).
- **Severity:** CRITICAL — the system cannot run on any supported PHP platform.
- **Recommendation:** Treat PHP 8 compatibility as one tracked piece of work: remove the parse errors and removed-function calls listed above first (they are mechanical), then run the whole tree on PHP 8 with all errors reported to find the runtime-only breakages.
- **Unknown / needs further validation:** Runtime-only PHP 8 breakages (string/number comparison changes, `null` passed to string functions, `count()` on failed query results) cannot be listed statically in untyped code; needs the suites and the smoke harness on PHP 8 after the parse errors are fixed.

### DEBT-002 — CI, Docker and the installer are pinned to or unaware of PHP versions; CI lints 24 of 355 PHP files
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: TEST-003, TEST-005, DEP-001, DEBT-018*

- **Confirmed fact:** The only CI that runs uses PHP 7.2 and lints only the 24 files under `src/`. Both Docker images are PHP 7.2. The Travis file claims PHP 8.0/8.2 but no longer runs. `composer.json` declares no PHP constraint and the installer accepts PHP ≥ 5.
- **Evidence:** `.github/workflows/ci.yml:21` `php-version: ['7.2']`, `:44` `find src -name "*.php" … php -l`; CI log: "Installed PHP 7.2.34", 24 "No syntax errors detected" lines, all under `src/`, including `JobOrderRepositoryException.php`; `docker/docker-compose.yml:14`, `docker/docker-compose-test.yml:14`; `.travis.yml:17-20`; `composer.json` (no `php`); `composer.json:5` `phpunit/phpunit ^7.5.7`; `installwizard.php:14`; `lib/InstallationTests.php:164`.
- **Impact:** PHP 8 regressions and blockers can merge silently; operators get no warning at install time.
- **Severity:** HIGH — the build hides the platform blocker in DEBT-001.
- **Recommendation:** Lint the whole tree on every runtime the project claims to support and declare that range in Composer and the installer (see TEST-003, DEP-001).
- **Unknown / needs further validation:** None.

### DEBT-003 — Dynamic properties are a core mechanism, plus other PHP 8.x deprecations
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-020, DEBT-021, ARCH-008*

- **Confirmed fact:** Templates receive data as properties created at runtime on the `Template` object. DataGrid classes, graph classes and several controllers also assign properties they never declare. PHP 8.2 deprecates each such assignment (verified on 8.4) and a future major version is expected to make it an error (external knowledge). Other deprecated constructs remain.
- **Evidence:**
  - `lib/Template.php:64-67` `assign()` does `$this->$propertyName = $propertyValue;` (`:77-80` `assignByReference`, 0 callers). `git grep -o -- '->assign('` → 879 call sites.
  - Phase 0 dynamic-property scanner, re-run: "undeclared assigned properties: 178 in 28 classes". The base `DataGrid` declares only `$_rs`, `$_parameters`, `$_instanceName`, `$_currentColumns`, `$_defaultColumns` (`lib/DataGrid.php:227-232`) but assigns `_classColumns` (first at `:877`), `_currentPage` (`:533`), `_totalPages` (`:534`), `globalStyle` (`:568`), `_totalEntries` (`:1338`) and more. Subclasses: `lib/Candidates.php:1933-1938`, `lib/Companies.php:751-756`, `lib/Contacts.php:812-817`, `lib/JobOrders.php:871-876`, `modules/*/dataGrids.php`. Others: `lib/GraphGenerator.php:65-66`, `modules/import/ImportUI.php:230,249,263,280`, `modules/toolbar/ToolbarUI.php:214-215`, `src/OpenCATS/UI/QuickActionMenu.php:13`.
  - `strftime()` ×5 (`lib/DateUtility.php:148,472,476,480`, `lib/Calendar.php:575`); `utf8_encode()` ×2 (`lib/DocumentToText.php:424,515`); `libxml_disable_entity_loader()` (`lib/DocumentToText.php:415`); `ini_get('safe_mode'/'register_globals')` ×9 (e.g. `lib/DatabaseConnection.php:171`).
  - Optional-before-required parameters (absorbed from DEBT-027): first-party `lib/ActivityEntries.php:162`, `lib/DatabaseConnection.php:262` (`getColumn($query = null, $row, $column)`), `lib/Tags.php:112`, `lib/Profile.php:448,488` (dead file); vendored Artichow ×3.
- **Impact:** Once DEBT-001 is fixed, every page will log deprecations, and every template and grid breaks when dynamic properties become errors. Which variables a template needs is implicit and cannot be checked by tools.
- **Severity:** HIGH — major barrier to running on current PHP.
- **Recommendation:** Give `Template` an explicit variable store that templates can still read as properties, declare the DataGrid properties on the base class, and replace the deprecated functions; this removes most of the 178 cases in a few classes.
- **Unknown / needs further validation:** How many deprecations the baseline image hides: its `error_reporting` excludes deprecations (`ENVIRONMENT.md` §2), so the count at runtime was not measured.

### DEBT-030 — Loose type handling prints PHP warnings into pages today and becomes fatal `TypeError`s on PHP 8
*Confirmation: **Runtime** · New in this edition · Related: RT-02, RT-06, RT-11, DEBT-001, DEBT-010, DEBT-029, UX*

- **Confirmed fact:** Several code paths pass non-arrays to `count()` or `foreach`, or pass a failed query result (`false`) to `mysqli_fetch_assoc()`. On PHP 7.2 with the image's `display_errors=On`, these print warnings into the page users see. On PHP 8, `count()` on a non-array and `mysqli_fetch_assoc(false)` throw `TypeError` (verified with `php -r` on 8.4), so the same pages would stop with a fatal error; `foreach` over `null` stays a warning.
- **Evidence:**
  - RT-06: `modules/companies/Show.tpl:311,349,393` `count($this->contactsRSWC)` → three "count(): Parameter must be an array…" warnings on every company detail view (#10, #11); `evidence/final-run/php_errors.log` (6 occurrences).
  - RT-11: `lib/DataGrid.php:248` `foreach ($parameters as $index => $data)` → "Invalid argument supplied for foreach()" on the e-mail compose page reached from the candidate list (#78).
  - RT-02: against an unseeded database the login page shows 23 × "mysqli_fetch_assoc() expects parameter 1 to be mysqli_result, boolean given in `lib/DatabaseConnection.php:321`" plus one in `modules/install/scripts/150.php:56` (`evidence/empty-db-before-seed/first-request.html`).
  - PHP 8.4: `php -r 'count(null);'` → `TypeError: count(): Argument #1 ($value) must be of type Countable|array, null given`; `mysqli_fetch_assoc(false)` → `TypeError … must be of type mysqli_result, false given`.
  - The baseline image hides notices and deprecations (`error_reporting=22519`, `ENVIRONMENT.md` §2), so more cases of this kind may exist unseen.
- **Impact:** Users see raw PHP warnings on normal pages today. After a PHP 8 move, the company detail page (a core screen) and any page reached after a failed query would stop with a fatal error.
- **Severity:** MEDIUM — cosmetic on PHP 7.2, but a hidden PHP 8 blocker on core screens.
- **Recommendation:** Make these call sites handle empty or failed results explicitly (normalise to arrays, check query results), and find the remaining cases by running the smoke harness with all error levels reported.
- **Unknown / needs further validation:** The number of similar sites; needs a run with `error_reporting=E_ALL` and, later, on PHP 8.

## 2. Architecture

### DEBT-004 — Extension model based on `eval()`, with part of authorization delivered through it
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-011, ARCH-004, PERF-020, API-017, DEBT-005*

- **Confirmed fact:** Almost every controller action and many library methods start with `if (!eval(Hooks::get('NAME'))) return;`. `Hooks::get()` concatenates PHP code strings held in `$_SESSION['hooks']` and returns them for `eval`. There are 251 distinct hook names, but only 10 are implemented, all in the settings module. Seven of those 10 keep the "careerportal" user category out of seven modules, so part of authorization lives in PHP strings copied into the session.
- **Evidence:**
  - `lib/Hooks.php:52-72` (`$hooks = @$_SESSION['hooks']; … return $hookCommands . ' return true;';`).
  - `git grep -o 'eval(Hooks::get('` → 267 in PHP + 11 in `.tpl` = 278 sites; distinct names `git grep -ohE "Hooks::get\('[A-Z0-9_]+'\)" | sort -u | wc -l` → 251.
  - Hooks collected at module discovery (`lib/ModuleUtility.php:276`) or from an unserialized cache file (`:210` `unserialize(file_get_contents('modules.cache'))`, when `CACHE_MODULES` is on).
  - Implementations: `modules/settings/SettingsUI.php:91` `TEMPLATE_UTILITY_EVALUATE_TAB_VISIBLE`, `:102` `HOME`, `:111` `SETTINGS_DISPLAY_PROFILE_SETTINGS`, `:120-126` seven `*_HANDLE_REQUEST` strings of the form `if ($_SESSION['CATS']->hasUserCategory('careerportal')) $this->fatal(…)`.
  - Guard sites: `CompaniesUI.php:71`, `ContactsUI.php:81`, `CalendarUI.php:57`, `JobOrdersUI.php:96`, `CandidatesUI.php:83`, `ActivityUI.php:61`, `ReportsUI.php:53`. `LISTS_HANDLE_REQUEST` (`ListsUI.php:67`) is evaluated but never defined. `ajax.php:118` `eval(Hooks::get('AJAX_HOOK'))`.
- **Impact:** 278 `eval` calls on hot paths that opcache cannot cache; 241 dead indirection points that static analysis and IDEs cannot follow; access control for one user category depends on per-session code strings.
- **Severity:** HIGH — a major barrier to analysis and refactoring, with a security dimension (SEC-011).
- **Recommendation:** Replace the ten implemented hooks with explicit code (an access check for the careerportal category and a tab filter), then remove the hook mechanism and the dead call sites.
- **Unknown / needs further validation:** Whether out-of-tree modules define hooks (would need a deprecation period).

### DEBT-005 — Code stored as strings elsewhere, run with `eval()`
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-01, SEC-011, ARCH-004, DB-006, DEBT-017*

- **Confirmed fact:** Besides hooks, executable PHP is stored as strings in DataGrid column definitions, in the migration list, in session wizard data and in installer component definitions, and run with `eval`. The migration strings still call a function removed in PHP 7.0; the baseline hit that on the demo-data install path and every request then died inside `eval()`'d code.
- **Evidence:**
  - DataGrid: `git grep -cE "['\"]pagerRender['\"]\s*=>"` → 77 definitions in 8 files; 208 `pagerRender`/`exportRender`/`filterRender`/`filterHavingRender`/`sortableColumn` definitions in total. Evaluated at `lib/DataGrid.php:1206,1211` (WHERE/HAVING), `:1441` (export), `:1530`, `:1912` (cells). Example `lib/Candidates.php:1943` mixes an access check, session access and HTML in one string.
  - Migrations: `modules/install/Schema.php` holds 195 numbered entries in one array (`CATSSchema::get`, 1,303 lines from `:31`); 25 start with `'PHP:'` and run via `lib/ModuleUtility.php:542` `eval($PHPCode)`.
  - RT-01: loading the demo dataset makes migration 225 run `mysql_real_escape_string()` (`Schema.php:725`; migration 341 at `:1236`) → "Fatal error: Uncaught Error: Call to undefined function mysql_real_escape_string() in lib/ModuleUtility.php(542) : eval()'d code:24" on every request (`evidence/demo-data-path/`).
  - Wizard `modules/wizard/WizardUI.php:181` `eval($php)`; installer `modules/install/ajax/ui.php:544,551,1162`.
  - `eval` used instead of variables: `modules/careers/CareersUI.php:280,285,1272`, `lib/ArrayUtility.php:101`, `lib/QueueProcessor.php:210`.
  - Unused `eval` extension points (absorbed from DEBT-026): `lib/Template.php:85-88,123-126` `addFilter()` (0 callers), `ajax.php:125-128` `$filters` loop (always empty).
- **Impact:** This logic is invisible to linters, static analysis and coverage; SQL fragments built inside strings cannot be parameterised; each `eval` is a code-injection sink (SEC-011); upgrades of old databases fail fatally on PHP 7+.
- **Severity:** HIGH — major barrier to modernization, already failing at runtime on one install path.
- **Recommendation:** Turn DataGrid renderers into real callables, replace the variable-variable `eval`s with arrays and `new $class`, freeze the string-based migrations, and delete the unused filter hooks.
- **Unknown / needs further validation:** How many real installations still carry pre-225 schema versions (they cannot be upgraded on PHP 7+).

### DEBT-006 — God classes and god methods
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-011, TEST-001, DEBT-021*

- **Confirmed fact:** A few very large classes each own routing, validation, authorization, orchestration, HTML generation and sometimes SQL. Complexity concentrates in their request dispatchers.
- **Evidence:** (re-measured; §8.3–§8.4; superglobal and session columns are `grep -oE` occurrence counts)

  | File | Lines | Methods | Longest function | `$_GET/POST/REQUEST/FILES/COOKIE` uses | `$_SESSION` uses | hook sites |
  |---|---:|---:|---|---:|---:|---:|
  | `modules/settings/SettingsUI.php` | 3,842 | 72 | `handleRequest` `:224`, 670 lines, ≈CC 169, 74 `case` labels | 234 | 118 | 11 |
  | `modules/candidates/CandidatesUI.php` | 3,582 | 38 | `_addActivityChangeStatus` `:2900`, 401 lines | 270 | 18 | 37 |
  | `lib/DataGrid.php` | 2,649 | 41 | `draw` `:1559`, 373 lines, ≈CC 57 | 14 | 10 | 0 |
  | `lib/Candidates.php` (3 classes) | 2,473 | 34 | `CandidatesDataGrid::__construct` `:1931`, 353 lines | 0 | 5 | 0 |
  | `modules/careers/CareersUI.php` | 1,794 | 12 | `careersPage` `:71`, 900 lines, ≈CC 168 | 127 | 0 | 2 |
  | `lib/TemplateUtility.php` | 1,245 | 25 | 226 lines | 7 | 31 | 10 |

  - `DataGrid` in one class reads request parameters (`lib/DataGrid.php:246-256,295-301,382-398`), reads and writes the session, builds SQL (`:1040-1339`), `eval`s renderers, echoes HTML/JS (120 `echo`s) and `die()`s on configuration errors (`:407,420,440,483,1490,2223`).
  - `CareersUI::careersPage` builds the public portal by `str_replace` of custom tags with HTML strings, e.g. `:225-232` splices `$candidate['firstName']` into an `<input value="…">` without escaping (SEC-005).
  - Across first-party code: 1,845 functions; 17 over 300 lines, 43 over 200 and 128 over 100 (production); ≈CC > 10: 143, > 20: 61, > 50: 13, > 100: 3.
- **Impact:** Most change and most security fixes land in these files (§9). They cannot be unit-tested without a database, a session and output buffering, and any API or new UI must untangle them first.
- **Severity:** HIGH — major barrier to modernization.
- **Recommendation:** Split the largest dispatchers by responsibility, starting with the most-changed files, and keep new code within a complexity budget enforced by tooling.
- **Unknown / needs further validation:** None.

### DEBT-007 — Business rules live in controllers and are duplicated and divergent
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-010, SEC-017, DB-012, DEBT-013*

- **Confirmed fact:** Domain rules sit in UI controllers and are copied across modules, and the copies have drifted, so behaviour depends on the screen used.
- **Evidence:**
  - Placing a candidate decrements the job order's openings in the controller (`modules/candidates/CandidatesUI.php:3089` `if ($statusID == PIPELINE_STATUS_PLACED && is_numeric($data['openingsAvailable']) …`), not in `Pipelines::setStatus()` (`lib/Pipelines.php:294`). Any other caller of `setStatus()` skips the rule.
  - A controller instantiates another controller: `modules/joborders/JobOrdersUI.php:1406-1407,1550-1551` include `CandidatesUI.php` and call `publicAddActivityChangeStatus()` (`CandidatesUI.php:402`).
  - Divergent status-change dialogs: `JobOrdersUI::addActivityChangeStatus` (`:1419`) applies the site's "status change sends e-mail" setting (`:1459-1466`, `new MailerSettings`, `candidateJoborderStatusSendsMessage`); `CandidatesUI::addActivityChangeStatus` (`:1658`) does not (`MailerSettings` does not occur in `CandidatesUI.php`). The e-mail checkbox default for the same status therefore differs by screen; the smoke run changed status only from the candidate screen, where the option was unchecked by default (#31).
  - Ownership-change e-mail block copied 8 times: `CompaniesUI.php:635,768`, `JobOrdersUI.php:840,1054`, `CandidatesUI.php:1128,1266`, `ContactsUI.php:629,761`.
  - Absolute URLs built as `'http://' . $_SERVER['HTTP_HOST'] …` (absorbed from DEBT-025): 7 live copies at `lib/CATSUtility.php:295`, `CompaniesUI.php:790`, `JobOrdersUI.php:1081`, `CandidatesUI.php:1290`, `ContactsUI.php:787`, `CareersUI.php:1570,1573`, plus a commented one at `CareersUI.php:1506`. They ignore HTTPS and trust the `Host` header (SEC-017; RT-09 shows the server-side effect).
  - HTML in controllers: `CandidatesUI.php:3054-3080` (`$notificationHTML`), `:3248-3253` (`$eventHTML`).
- **Impact:** Inconsistent behaviour between screens, fixes that must be applied up to 8 times, and rules an API, import or queue job would silently skip.
- **Severity:** HIGH — data-integrity risk (openings count) and a major barrier to adding non-UI entry points.
- **Recommendation:** Move each rule (status change with its side effects, ownership notification, absolute-URL building) into one shared service used by every entry point, then delete the copies.
- **Unknown / needs further validation:** Whether any existing path other than the two controllers changes pipeline status (e.g. import or careers apply) and thus already skips the openings rule; needs a runtime trace.

### DEBT-008 — Global state everywhere; no dependency injection and no interfaces
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-003, PERF-008, TEST-001*

- **Confirmed fact:** Library code reads `$_SESSION['CATS']` (a serialized `CATSSession` object) and the `DatabaseConnection` singleton instead of receiving dependencies, and the singleton itself reads the session. Production code declares no interface. Collaborators are created with `new` or reached through static utility classes.
- **Evidence:**
  - `lib/DatabaseConnection.php:53-75` `getInstance()` with "FIXME: Remove Session tight-coupling here." and reads of `$_SESSION['CATS']->getTimeZoneOffset()` / `isDateDMY()`.
  - `git grep -o "\$_SESSION\['CATS'\]"` → 373 in PHP (53 files) + 13 in `.tpl`; `DatabaseConnection::getInstance()` → 110 in 53 files; token scan: 1,505 static calls to another class in production; most-called targets in first-party PHP (`git grep -oE "\b<Class>::"`, vendored excluded): `CommonErrors` 367, `CATSUtility` 282, `Hooks` 267, `StringUtility` 165, `DatabaseConnection` 110, `DateUtility` 104; 0 interfaces, 0 traits, 1 abstract class.
  - At least 21 FIXMEs admit the coupling ("Library code Session dependencies suck" ×13, "Factor out Session dependency" ×5, "Remove session dependancy" ×3), e.g. `lib/Search.php:375`, `lib/Candidates.php:2292`, `lib/Mailer.php:88`.
  - `index.php:61-69` must include `Session.php` and its dependencies before `session_start()` so the session object can unserialize.
- **Impact:** Classes cannot be tested in isolation, CLI and queue code must fake a web session, session state carries behaviour (a scaling blocker), and dependencies are invisible.
- **Severity:** HIGH — major barrier to testing and restructuring.
- **Recommendation:** Pass the database connection and a small user context into constructors (defaulting to today's globals so callers can change gradually), starting with removing the session read from the DB singleton.
- **Unknown / needs further validation:** None.

### DEBT-009 — The PSR-4 `src/OpenCATS` layer stalled at about 1% of runtime code
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-012, TEST-003, DEBT-010*

- **Confirmed fact:** A namespaced entity/repository/UI layer under Composer PSR-4 was started and then stopped. It is used for two write paths and a quick-action menu. Its repositories are the same `sprintf` SQL on the global connection. Both entity exception paths are broken.
- **Evidence:**
  - `src/OpenCATS/{Entity,UI}`: 9 files, 859 lines (≈1.0% of 82,914 production lines).
  - Use outside `src/`: `lib/Companies.php:3-4,106-111` (`Companies::add` only); `lib/JobOrders.php:4-6,130-133` (`JobOrders::add` only); `lib/TemplateUtility.php:43` and `modules/{candidates,companies,contacts,joborders}/Show.tpl` (`QuickActionMenu`).
  - The autoloader is loaded through CWD-relative paths in four files: `lib/Companies.php:2`, `lib/JobOrders.php:2`, `lib/TemplateUtility.php:38`, `lib/Mailer.php:43`.
  - `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` `namespace \OpenCATS\Entity;` — a parse error on PHP 8.4; on PHP 7.2 it lints clean (CI log), so it cannot declare the class `OpenCATS\Entity\JobOrderRepositoryException` that `JobOrderRepository.php:117` throws and `lib/JobOrders.php:6,133` imports and catches (INFERENCE for the exact PHP 7 runtime error).
  - `lib/Companies.php:109` `catch(CompanyRepositoryException $e)` with no `use` for that class (imports only `Company` and `CompanyRepository` at `:3-4`), so it names the non-existent global class and the `return -1` fallback is dead.
- **Impact:** Two ways of doing the same thing with no path between them; persistence failures on company or job-order creation escape as uncaught errors instead of the designed `-1`.
- **Severity:** MEDIUM — confusing and partly broken, but small.
- **Recommendation:** Fix the two exception bugs, then make and record an explicit decision to either grow this layer as the target structure or retire it.
- **Unknown / needs further validation:** The exact PHP 7.2 behaviour when the job-order save fails (not triggered in the baseline).

### DEBT-017 — Runtime module discovery loads every controller and applies schema migrations during page views
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-01, RT-02, ARCH-005, ARCH-015, PERF-006, DB-006, TEST-009*

- **Confirmed fact:** When a session has no module list, `ModuleUtility` scans `modules/`, includes every `*UI.php` (including the SimpleTest runner), instantiates each module, collects hooks and applies pending schema migrations under a global DB lock. The baseline observed migrations running on ordinary page requests. Separately, `db/upgrade-*.sql` and `modules/install/scripts/*` form two more migration mechanisms.
- **Evidence:**
  - `lib/ModuleUtility.php:154` (refresh when the session has no list), `:243` `getAdvisoryLock('CATSUpdateLock', 120)`, `:262` `include_once($fullFilePath)`, `:276` hooks, `:282` `processModuleSchema(…)`; `config.php:256` `CACHE_MODULES false`; `modules/tests/TestsUI.php:43-46` loads SimpleTest.
  - `INSTALLATION.md` §1 step 5b: the first `GET /index.php` applies module `install` 363 → 364 (MD5-hashes the seeded admin password).
  - RT-02: against an empty database, one login-page request made the runner create 16 tables. RT-01: on the demo path, the runner executes migrations 51→224 and dies in 225 on every request.
  - Migration sources: `modules/install/Schema.php` (195 entries, 25 PHP), `db/upgrade-*.sql` (7 files), `modules/install/scripts/114.php`, `150.php`, `359.sql`.
- **Impact:** A slow first request per session (PERF-006), schema changes triggered by anonymous page views, half-built schemas after operator mistakes (RT-02), and three migration systems that can drift (DB-006, DB-007).
- **Severity:** MEDIUM — operational risk and maintenance cost; normal installs work.
- **Recommendation:** Register modules statically and move schema migration to an explicit install/upgrade command, with a single migration mechanism from now on.
- **Unknown / needs further validation:** Behaviour under concurrent first requests (the lock waits up to 120 s); needs a load test.

### DEBT-031 — Front-controller bootstrap is copied across entry points and the copies have drifted
*Confirmation: **Runtime** · New in this edition · Related: RT-05, ARCH-006, ARCH-022, API-012, TEST-012, DEBT-024*

- **Confirmed fact:** There is no shared bootstrap file. `index.php`, `ajax.php` and `QueueCLI.php` each carry their own copy of the start-up sequence (config, core includes in a fixed order, magic-quotes blocks, session start), and `careers/index.php`, `xml/index.php` and `rss/index.php` are three near-identical shims that change directory, include the config and `CATSUtility`, and then include the main front controller (§8.7). A fix for a missing config include was applied to the XML shim in 2024 but not to its RSS twin, which is now a fatal error on every request.
- **Evidence:** `diff <(sed -n 30,60p rss/index.php) <(sed -n 30,60p xml/index.php)` differs only in the `$Id` line, the page flag and `xml/index.php:37` `include_once('config.php');`, which `rss/index.php` lacks. `git show c315cbd` (2024-01-19, "Update XML Module index.php (#636)") adds exactly that line to `xml/index.php` only. `careers/index.php:37` has it. RT-05: `/rss/` → "Use of undefined constant LEGACY_ROOT" … "Class 'CATSUtility' not found" (#88), linked from every careers page; `/xml/` works (#89).
- **Impact:** Each bootstrap change has to be made up to six times, and missed copies break public features without any test noticing (TEST-012).
- **Severity:** MEDIUM — one public feature broken; recurring maintenance cost.
- **Recommendation:** Put the shared bootstrap in one included file used by every entry point, so a fix applies everywhere at once.
- **Unknown / needs further validation:** Whether other copies differ in security-relevant ways (e.g. session or input handling); needs a side-by-side review of all six.

## 3. Error handling and latent defects

### DEBT-029 — No application error boundary: fatals and uncaught dependency exceptions render as HTTP 200 pages with stack traces
*Confirmation: **Runtime** · New in this edition · Related: RT-03, RT-04, RT-05, RT-15, DEP-016, SEC-012, ARCH-020, DEBT-014*

- **Confirmed fact:** No entry point installs an error or exception handler, and no code catches `Throwable` at the top level. Every PHP fatal in the baseline was served with HTTP status 200 and a page body containing the stack trace, absolute server paths and call arguments, including on the public careers site. Monitoring based on HTTP status sees no errors.
- **Evidence:**
  - `git grep -nE "set_error_handler|set_exception_handler|register_shutdown_function" -- '*.php' ':!lib/simpletest'` → only `modules/install/backupDB.php:68` (local to the backup routine). Apart from LDAP, the code never calls `error_log()`.
  - Production code (vendored and test code excluded) contains 4 `catch` blocks in total: `lib/Companies.php:109` and `lib/JobOrders.php:133` (both broken, DEBT-009) and 2 in `lib/ParseUtility.php` (`git grep -cE "catch\s*\("`). None of the six entry points has one.
  - RT-15: nginx access log in the final run has only 200 and 302 responses for 206 requests, while `evidence/final-run/php_errors.log` records 3 distinct fatal errors (6 occurrences).
  - The fatals: RT-03 `modules/login/LoginUI.php:455` calls the non-existent `Users::getPassword()` (#04); RT-04 uncaught `PHPMailer\PHPMailer\Exception` from `lib/Mailer.php` (#77, #79, #85, #86); RT-05 `Class 'CATSUtility' not found` in `rss/index.php` (#88).
  - The image default `display_errors=On` (`ENVIRONMENT.md` §2) is what puts the traces in the page; the application sets no display policy of its own.
- **Impact:** Applicants and users see raw PHP errors with internal paths (information disclosure, SEC-012); operators get no status-code signal; any unexpected exception, including one from a dependency, aborts multi-step actions half-way (RT-04: application saved, notifications not sent).
- **Severity:** HIGH — core workflows fail uncontrolled and invisibly to monitoring.
- **Recommendation:** Add one error boundary per entry point that logs the error, returns a 5xx status and shows a generic page, independent of the server's `display_errors` setting.
- **Unknown / needs further validation:** Behaviour under a production PHP configuration (`display_errors=Off`): the page would likely be blank but still HTTP 200 (INFERENCE; not tested).

### DEBT-014 — Library code handles errors by `die()`, `@` and `echo`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-020, SEC-012, DEBT-029*

- **Confirmed fact:** Errors are handled by printing HTML and calling `die()`, including inside library classes; warnings are suppressed with `@`; library classes `echo` markup directly. There is no exception model and no logging abstraction.
- **Evidence:**
  - Token scan (production): 153 `exit`/`die` (29 in top-level `lib/*.php`, e.g. `lib/DatabaseConnection.php:120,135,188,219`, `lib/DataGrid.php:407,420,440,483,1490,2223`, `lib/GraphGenerator.php:75,147,217,260,304,356,392,426`, `lib/ModuleUtility.php:65,293,365,534`); 178 `@` (113 in `lib/`: `Attachments.php` 22, `FileUtility.php` 16, `FileCompressor.php` 13; `lib/Hooks.php:59`); 539 `echo` inside class methods (445 in `lib/`: `TemplateUtility` 158, `DataGrid` 120, `InstallationTests` 71, `WebForm` 36).
  - `lib/DatabaseConnection.php:188-193` prints the failing SQL into the page before `die()` (SEC-012).
  - `CommonErrors::` is the most-called static target (367): fatal-and-render helpers, not exceptions.
- **Impact:** Library code cannot be reused from CLI, queue or tests without side effects; suppressed errors are lost, printed errors leak details, and a consistent error format is impossible.
- **Severity:** MEDIUM — notable maintainability cost.
- **Recommendation:** Have library code raise errors to the caller instead of printing or exiting, and keep output in controllers and templates only.
- **Unknown / needs further validation:** None.

### DEBT-010 — Latent defects in core classes
*Confirmation: **Runtime** (items 4 and 7 observed in the baseline; items 1–3, 5, 6 Static) · Phase 0 severity: unchanged · Related: RT-02, RT-03, RT-11, PERF-007, API-007, SEC-027, DB-002, ARCH-009, DEBT-009*

- **Confirmed fact:** Several small, real defects sit in core classes. Items 4 and 7 showed up at runtime; the others are confirmed by reading the code.
- **Evidence:**
  1. **Saved column preferences are never restored.** `lib/Session.php:850` `$this->_ = unserialize($rs['columnPreferences']);` should assign `$this->_dataGridColumnPreferences` (declared `:80`, read `:1185,1234`). `setColumnPreferences()` (`:1200-1204`) later writes the in-memory array back. INFERENCE: preferences for other grids are overwritten on the first column change after each login.
  2. **Assignment instead of comparison.** `lib/DataGrid.php:257` `if ($index = 'exportIDs')` is always true inside the `dynamicArgument` block (`:246-260`). RT-11 (#78) shows this block is live: the candidate-list "E-Mail" action reaches it and it already emits a `foreach` warning at `:248`.
  3. **No-op sanitiser.** `lib/DataGrid.php:267-268` `preg_replace("[^A-Za-z0-9]", "", …)`: the brackets act as delimiters, so `preg_replace("[^A-Za-z0-9]", "", "../../x;Foo")` returns the input unchanged (`php -r` check). The values reach `include_once(sprintf('modules/%s/dataGrids.php', $module))` and `new $class(...)`. `ajax.php` uses the correct `/[^A-Za-z0-9]/`. Security impact: API-007, SEC-027.
  4. **DB error handling is dead code.** `lib/DatabaseConnection.php:184` and `:198` test `$this->_queryResult->connect_errno`, but `mysqli_query()` returns `mysqli_result|bool`, so both branches never fire and failed queries return `false` silently. RT-02 shows the consequence: 23 × `mysqli_fetch_assoc() … boolean given` at `:321`. No `mysqli_report()` call exists; PHP 8.1 changed mysqli's default to throw exceptions (external knowledge).
  5. **Undefined toolbar route.** `modules/toolbar/ToolbarUI.php:59-60` `case 'attemptLogin': $this->attemptLogin();` — no such method in `ToolbarUI` or `UserInterface`.
  6. **Dead `catch`** in `lib/Companies.php:109` (DEBT-009).
  7. **Undefined method on the forgot-password path.** `modules/login/LoginUI.php:455` calls `$user->getPassword($username)`, which `lib/Users.php` does not define. RT-03: submitting the form is a fatal error (#04).
- **Impact:** User-visible data loss (grid preferences), a request-controlled include path, silent DB failures that become exceptions on PHP 8.1+, and a broken self-service password flow.
- **Severity:** HIGH — data-integrity and security-relevant defects with one-line causes.
- **Recommendation:** Fix each one-line defect with a regression test, and make the DB layer check the connection's error state explicitly.
- **Unknown / needs further validation:** Item 1's user-visible effect was not reproduced (the baseline used one account and did not compare preferences across logins).

## 4. Configuration and domain constants

### DEBT-011 — Configuration is tracked PHP source with secrets and placeholder defaults; the installer writes request values into PHP code
*Confirmation: **Runtime** (placeholder defaults and config rewriting observed; the installer's injection path is Static) · Phase 0 severity: unchanged · Related: RT-08, ARCH-014, SEC-018, DEP-009, TEST-007*

- **Confirmed fact:** All configuration is `define()` calls in the git-tracked `config.php` (82 `define` lines), including DB and SMTP credentials and a licence key; domain constants are in `constants.php` (100). The code reads no environment variables. The installer changes configuration by rewriting `config.php` line by line with unescaped request values. Committed defaults point the document tools at placeholder paths, which disabled PDF text extraction in the baseline. The baseline had to avoid the web installer because it rewrites `config.php`, and CI replaces `config.php` with a forked `test/config.php`.
- **Evidence:**
  - `config.php:31` `LICENSE_KEY`, `:40-43` DB credentials, `:62-81` tool-path placeholders, `:188-197` tester and demo credentials, `:219-225` SMTP settings, `:256` `CACHE_MODULES false`; `grep -c "^\s*define\s*(" config.php` → 82; `git grep -nE 'getenv\(|\$_ENV'` → 0.
  - `lib/CATSUtility.php:142` `changeConfigSetting()`, `:162` `sprintf("define('%s', %s);", $name, $value)`; `modules/install/ajax/ui.php:120,125,130,135` `changeConfigSetting('DATABASE_USER', "'" . $_REQUEST['user'] . "'")` (and pass, host, name).
  - RT-08 (placeholder `PDFTOTEXT_PATH` → PDFs not indexed, #27, #43); `ENVIRONMENT.md` §3 E6/E7 (config made read-only; installer DB steps replayed from the CLI because the installer rewrites `config.php`); `ci.yml:59` `cp test/config.php ./config.php`.
  - Forks: `test/config.php` (a near-copy, TEST-007); `optional-updates/latest-sphinx-search/config.php`, which its README tells operators to copy over their configuration.
- **Impact:** Secrets in version control and every deployment; defaults that are wrong for the supplied image; drift across forks; a `'` in an installer field breaks `config.php`, and a crafted value becomes code (SEC-018, ARCH-014); container-style configuration is impossible without editing PHP.
- **Severity:** HIGH — security-relevant (installer) and blocks standard deployment practice.
- **Recommendation:** Separate configuration data from code: ship a template, read values from the environment or a data file with safe defaults, and have the installer write data rather than PHP source.
- **Unknown / needs further validation:** Whether the web installer's own screens reject quotes in DB fields (the web installer was not run in the baseline).

### DEBT-012 — Domain enumerations and IDs are hard-coded and duplicated
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-014, DB-024, ARCH-013, DEBT-007*

- **Confirmed fact:** Pipeline statuses, data-item types and access levels are PHP constants used across the code, while the same statuses also exist as rows in `candidate_joborder_status`. Some SQL bypasses even the constants and uses literal numbers. Site IDs from the hosted CATS service are hard-coded.
- **Evidence:**
  - `constants.php:120-130` 11 `PIPELINE_STATUS_*` constants (e.g. `PLACED` 800, `SUBMITTED` 400); seeded as data in `db/cats_schema.sql` (`candidate_joborder_status`); `git grep -c "PIPELINE_STATUS_"` → 63 uses in 10 files.
  - Literal statuses in SQL: `lib/Statistics.php:102,133,241,312,351,422,559,591` (`status_to = 400` / `800`) and `lib/Dashboard.php:85`, while the same file also uses the constant (`lib/Statistics.php:682,717,930`).
  - Magic site IDs: `constants.php:187` `CATS_ADMIN_SITE` 180; `lib/Session.php:208-214` "Don't force logout for site 200. TODO: Remove me."; `modules/import/ImportUI.php:1643` `getSiteID() == 201`.
  - Job-order status groups come either from config or from class defaults (`lib/JobOrderStatuses.php:63-67`; commented alternatives in `config.php:295-325`).
- **Impact:** Adding or renaming a pipeline status needs coordinated edits in constants, seed data, templates and literal SQL; statistics silently diverge if one is missed; tenant-specific branches remain for a service that no longer exists.
- **Severity:** MEDIUM — maintainability and reporting-consistency risk.
- **Recommendation:** Keep one source of truth for statuses and use the named constants everywhere, starting with the literal numbers in the statistics and dashboard SQL; remove the special cases for hosted sites.
- **Unknown / needs further validation:** Whether any installation has customised the status table (which would already make the literal SQL wrong).

## 5. Duplication, dead code and vendored code

### DEBT-013 — Duplicated code: 13.7% of first-party PHP and 20.8% of templates in exact clones, plus forked files
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-007, DEBT-031, TEST-007*

- **Confirmed fact:** Beyond the domain duplication in DEBT-007, there is measurable copy-paste, mostly per-module boilerplate, plus whole-file forks meant to be copied over the originals.
- **Evidence:** clone detector re-run: first-party PHP "physical_lines=89986 lines_in_duplicated_windows=12286 (13.7%)"; templates "16919 … 3520 (20.8%)". About a third of the PHP clone lines come from one pair: `optional-updates/latest-sphinx-search/Search.php` (2,135 duplicated lines) and `lib/Search.php` (1,930). Other pairs: `config.php` ↔ `test/config.php`; `CandidatesUI.php` ↔ `ContactsUI.php`; `modules/activity/dataGrids.php` ↔ `modules/home/dataGrids.php`; `modules/queue/lib/Task.php` ↔ `modules/queue/tasks/lib/Task.php` (identical but for the `$Id` line and braces; the second is never included); `modules/reports/NewDataItems.tpl` ↔ `Reports.tpl` (381 duplicated lines each). Per-module copies: 12 `Error.tpl` (nine differ from `modules/candidates/Error.tpl` only in `$Id`, title and icon), 5 `ErrorModal.tpl`, 3 `CreateAttachmentModal.tpl`, 9 `validator.js`, 7 `dataGrids.php` with the same preamble.
- **Impact:** Fixes must be repeated (e.g. escaping in each `Error.tpl`) and forks rot: the Sphinx fork uses the removed `create_function` (`optional-updates/latest-sphinx-search/Search.php:228,240,301,313`) independently of the main file.
- **Severity:** MEDIUM — notable maintenance cost.
- **Recommendation:** Merge or delete the forks and replace per-module boilerplate with shared, parameterised templates and helpers.
- **Unknown / needs further validation:** How many deployments copied the Sphinx fork over `lib/Search.php` and therefore run different search code.

### DEBT-015 — Dead code and commercial CATS remnants
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-019, API-009, API-010, DEP-010, TEST-009*

- **Confirmed fact:** A large amount of shipped code belongs to the defunct commercial CATS product or is never loaded.
- **Evidence:**
  - Never included (no `include`, `new`, `::` or `extends` reference outside the file itself; `git grep -nE "<Name>\.php|new <Name>\b|<Name>::"`): `lib/ControlPanel.php` (1,573 lines; references an undefined `EncryptionUtility` at `:563`), `lib/Profile.php` (1,219; only includer is the dead `lib/Display.php:33`), `lib/CBFUtility.php` (715), `lib/Display.php` (233), `lib/DefaultQuestionnaires.php` (206), `lib/JavaScriptCompressor.php` (121), `lib/Encryption.php` (114, `mcrypt_*`) — 4,181 lines.
  - Neutered licensing: `lib/License.php` (730 lines) — `isLicenseValid()` (`:580-590`), `validateProfessionalKey()` (`:658-660`) and `isParsingEnabled()` (`:687-705`) return `true` on every path; `LicenseUtility::` is still referenced 36 times.
  - Hosted resume parser: `lib/ParseUtility.php:53,60,135` with `wsdl/*.wsdl` pointing at `soap.resfly.com` and `catsone.com` over HTTP; gated by `config.php:51`.
  - Phone-home: `lib/NewVersionCheck.php:106-122` sends version, UID, PHP version, server software, site name, user count and licence key to `www.catsone.com:80`; called from `modules/login/LoginUI.php:409`, `modules/settings/SettingsUI.php:2229,2631,2642` and `modules/home/HomeUI.php:95`; disabled in the seeded schema.
  - Toolbar module: `modules/toolbar/ToolbarUI.php` (Monster resume capture `:186`, `_authenticationRequired = false` `:46`, undefined route `:59-60`).
  - Upsell links to catsone.com: `modules/settings/Professional.tpl` (8), `modules/candidates/Add.tpl:125`, `modules/import/MassImportStep1.tpl:95`, `index.php:249`, `SettingsUI.php` (several).
  - Web-root maintenance script `rebuild_old_docs.php` (SQL built with `addslashes`, `:38`); in-app SimpleTest runner `modules/tests/` (3,019 lines) plus `lib/simpletest` (31,112), superseded per `CHANGELOG.MD` ("Replace deprecated simpletest with phpunit and behat #123").
- **Impact:** About 40k lines (with SimpleTest) to maintain, scan and port for no value; confusing UI; plain-HTTP calls to third parties if features are enabled; extra attack surface (unauthenticated toolbar module, web-root script).
- **Severity:** MEDIUM — notable maintenance cost and avoidable surface.
- **Recommendation:** Remove the never-loaded files, the licensing shim, the hosted-parser and phone-home code, the toolbar module, the in-app test runner and the upsell links, each as a separate reviewed change.
- **Unknown / needs further validation:** Whether any deployment still uses the toolbar or the parser (needs operator input).

### DEBT-016 — Unmaintained vendored PHP in `lib/`, jQuery 1.3.2 and IE-era front-end code
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-003, DEP-006, DEP-007, ARCH-024, PERF-019*

- **Confirmed fact:** 142 third-party PHP files (47,400 lines) are copied into `lib/` instead of being managed by Composer, and three of them fail on PHP 8. The front end ships jQuery 1.3.2 and code written for old Internet Explorer.
- **Evidence:** `lib/fpdf/fpdf.php:16` `FPDF_VERSION '1.53'` (parse error `:434`, `each()` at `:1285`); `lib/artichow/AntiSpam.class.php:63` (parse error); `lib/simpletest/VERSION` `1.1.0` with 11,868 lines of HTML docs; `lib/sphinx/sphinxapi.php` (2007); `js/jquery-1.3.2.min.js` loaded from `lib/TemplateUtility.php:1194`; IE code: `lib/TemplateUtility.php:1215-1216` conditional `ie.css`/`not-ie.css`, 17 uses of `document.all`/`attachEvent`/`ActiveXObject`/`navigator.appName` in 7 JS files other than jQuery (5 first-party, plus the vendored `calendarDateInput.js` and `subModal.js`; `git grep -cE`), `lib/BrowserDetection.php` (483 lines; `detect()` 424 lines, ≈CC 64) used only to label login history (`lib/LoginActivity.php:186`, `modules/settings/SettingsUI.php:1021`).
- **Impact:** These libraries cannot be audited or updated with Composer tooling and block PHP 8 (DEBT-001); dead browser branches add weight to every page.
- **Severity:** MEDIUM — maintenance and upgrade cost (dependency risk rated in DEP-003/DEP-006).
- **Recommendation:** Bring the libraries under dependency management or replace them, and remove browser-specific branches for browsers no longer supported.
- **Unknown / needs further validation:** None.

### DEBT-024 — Includes relative to the working directory make entry points depend on the CWD
*Confirmation: **Static** · Phase 0 severity: unchanged (was a register-only item) · Related: DEBT-009, DEBT-031, TEST-013*

- **Confirmed fact:** Most includes use `LEGACY_ROOT`, but some use paths relative to the current working directory, so code only works when PHP runs from the web root.
- **Evidence:** Phase 0 token scan: 35 CWD-relative and 7 variable-path includes out of 506 in production. Examples: `lib/CATSUtility.php:34` `include_once('./config.php')`; `lib/ACL.php:10`; `lib/Companies.php:2`, `lib/JobOrders.php:2`, `lib/TemplateUtility.php:38` `./vendor/autoload.php`; `lib/Mailer.php:43` `require './vendor/autoload.php'`; `modules/tests/TestsUI.php:43-46`; `lib/DataGrid.php:280` `include_once(sprintf('modules/%s/dataGrids.php', $module))`. CI runs the integration suite with `--workdir /var/www/public` (CI log).
- **Impact:** CLI scripts, tests and alternative deployments break unless started from the right directory.
- **Severity:** LOW — friction with known workarounds.
- **Recommendation:** Resolve every include from a single root constant or an autoloader.
- **Unknown / needs further validation:** None.

### DEBT-025 — [Merged into DEBT-007] Absolute URLs built from `http://` + `HTTP_HOST`
Same code sites and cause as the URL-building bullet in DEBT-007; kept there with the corrected count (7 live copies, 1 commented).

### DEBT-026 — [Merged into DEBT-005] Unused `eval` extension points
`Template::addFilter()` and the `ajax.php` `$filters` loop are listed in DEBT-005.

### DEBT-027 — [Merged into DEBT-003] Optional-before-required parameters
The six first-party declarations are listed in DEBT-003 with the other PHP 8 deprecations.

### DEBT-028 — [Merged into DEBT-023] Stray output after `?>` in an AJAX endpoint
`ajax/getCandidateIdByPhone.php` is listed in DEBT-023.

## 6. Presentation, typing and documentation

### DEBT-021 — Controllers and `lib/` emit HTML strings, templates carry logic, escaping is opt-in
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-008, SEC-005, DEBT-006, DEBT-003*

- **Confirmed fact:** Presentation is spread across three layers: PHP templates with inline logic, controllers that build HTML strings, and `lib/` classes that `echo` markup. Output escaping is something each template line must opt into.
- **Evidence:**
  - `git grep -o "<?php" -- '*.tpl' | wc -l` → 5,285 PHP blocks in 136 templates.
  - `<?php $this->_(…)` (the escaping echo helper) → 857 uses; `<?php echo $this->…` printing a template property directly (helper excluded) → 412 (`git grep -hoE "<\?php echo\(?\s*\\\$this->[A-Za-z_]+[\[(-]?" -- '*.tpl' | grep -v '\$this->_('`). Some of these print numbers or pre-escaped values; the count is approximate (XSS impact: SEC-005).
  - `modules/calendar/Calendar.tpl:590-593` builds a JS array from DB values inside the template.
  - Controllers: `modules/careers/CareersUI.php:225-232` splices HTML with request/DB values; `modules/candidates/CandidatesUI.php:3248-3253` `sprintf('<p>An event of type <span class="bold">%s</span>…')`.
  - `lib/`: 445 `echo`s inside methods (DEBT-014); `lib/WebForm.php:1209` `getJavaScript()`, a 408-line PHP function that emits JavaScript; DataGrid renderer strings emit HTML from `lib/Candidates.php`, `lib/JobOrders.php` (DEBT-005).
- **Impact:** Escaping cannot be enforced in one place, a redesign or API needs output logic pulled out of three layers, and front-end changes require PHP changes.
- **Severity:** MEDIUM — notable maintainability cost with a security dimension handled in SEC-005.
- **Recommendation:** Make escaping the default in the template layer and move HTML out of controllers and `lib/` classes into templates.
- **Unknown / needs further validation:** How many of the 412 direct echoes print user-controlled data (needs a per-template review, see SEC-005).

### DEBT-020 — Almost no type information, so static analysis has little to work with
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-010, DEBT-019*

- **Confirmed fact:** Production code declares almost no types, and docblocks cannot substitute because most `@param` tags have no parameter name.
- **Evidence:** 7 typed parameters in 5 declarations (`lib/TemplateUtility.php:1140`, `src/OpenCATS/Entity/CompanyRepository.php:11,16`, `src/OpenCATS/Entity/JobOrderRepository.php:14,19`); 0 return types; 0 `declare(strict_types=1)` (`git grep` in production code, vendored and test code excluded); of 1,126 `@param` tags only 36 match `@param type $name` (≈97% unnamed); 0 interfaces (DEBT-008); template variables are dynamic properties (DEBT-003); data moves as associative arrays from `getAllAssoc()`/`getAssoc()`.
- **Impact:** Analysers start with thousands of findings; refactors are unsafe without tests; PHP 8 type-juggling changes cannot be found statically.
- **Severity:** MEDIUM — raises the cost and risk of every refactor.
- **Recommendation:** Introduce types where code is touched and run a static analyser with a baseline so the count can only go down.
- **Unknown / needs further validation:** None.

### DEBT-019 — Documentation is stale or missing
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-001, DEBT-009, DEBT-020*

- **Confirmed fact:** Apart from this audit's `docs/`, the repository has no architecture description, design decisions, contributor guide, coding standard or API reference. The changelog stops at 0.9.3-3 (2016) while the code is 0.9.7.4. Inline documentation is patchy and partly placeholder text.
- **Evidence:** top-level docs are `README.md` (965 bytes of links), `README-testing.md`, `Security.MD`, `issue_template.md`, `LICENSE.md`, `CHANGELOG.MD`; `CHANGELOG.MD:1` `**0.9.3-3 (2016-11-22)**` vs `constants.php:45` `0.9.7.4`; no commit after the history boundary touches `CHANGELOG.MD`; `scripts/svnkeywords.sh:20` references a `doc/DEVELOPMENT-GUIDELINES` that does not exist; no documentation for the 32 AJAX functions (21 `ajax/*.php` + 11 `modules/*/ajax/*.php`), the XML feed or the careers portal; docblock scanner re-run: 41.4% of 1,846 named functions have a docblock (`lib/` 61%, `modules/` 8%, `src/` 1%); `git grep -oi "document me"` → 175 placeholders; `Security.MD:11` "OpenCATS uses MD5 hashing to store passwords. This will be replaced in future versions" (SEC-001).
- **Impact:** Onboarding depends on tribal knowledge; the reasons behind hooks, DataGrid strings and the `src/` layer are unrecorded; operators cannot see what changed between 0.9.3 and 0.9.7.4.
- **Severity:** MEDIUM — notable maintainability cost.
- **Recommendation:** Rebuild the changelog from tags and merged pull requests, and record the architecture and the key design decisions (including the DEBT-009 decision) in the repository.
- **Unknown / needs further validation:** Whether the external wiki holds material that should be brought in-repo.

## 7. Build, tooling and hygiene

### DEBT-018 — Build and tooling: no analysers or formatters, dead Travis setup, workflows that never run, release zip without `vendor/`, manual versioning
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-005, TEST-010, TEST-014, DEP-004, DEP-012, ARCH-002*

- **Confirmed fact:** The repository has no static-analysis, style, editor or JS tooling configuration. It keeps a dead Travis pipeline, and two GitHub workflows live in a directory GitHub does not read. The active release job zips the checkout without dependencies. Versioning is manual and has already shipped a wrong value once.
- **Evidence:**
  - No `phpcs.xml`, `phpstan.neon`, `psalm.xml`, `rector.php`, `.php-cs-fixer*`, `.editorconfig`, `.gitattributes`, `package.json` or `phpunit.xml` (`find`, `docs/` excluded); `ci.yml:119` excludes a non-existent `phpunit.xml`.
  - `.travis.yml:17-20` (PHP 7.2/8.0/8.2), `:28-31` deploy with an encrypted key; `ci/package-code.sh:4-10` depends on `$TRAVIS_TAG`; `.travis.yml` is the most-changed file in the history window (8 of 56 commits).
  - `.github/workflow/needs-reply.yml`, `needs-reply-remove.yml` (added in `69de98e`/`e4e6004`, 2022-09-02) sit in the singular directory; `.github/no-response.yml` configures a different label.
  - Release job `ci.yml:106-128` zips without `composer install` (DEP-004).
  - Version bumps: `5781f41` edits the version header in 12 files; its predecessor `1ba02b1` set `define('CATS_VERSION', '-s');` (`git show 1ba02b1 -- constants.php`), fixed in the next commit. `d607279` and `0386702` are empty "Triggering CI/CD" commits.
  - `composer audit || true` (`ci.yml:48`); `composer.json:7` `"behat/mink-extension": "dev-master"`; SVN-era scripts `scripts/svnkeywords.sh`, `newversion.sh`, `killwhitespace.sh`, `countcode.sh`.
- **Impact:** Nothing guards style, types, complexity or PHP compatibility; issue automation silently does nothing; release archives may not run; manual version edits can ship wrong values.
- **Severity:** MEDIUM — process debt that lets the other debt grow.
- **Recommendation:** Retire the dead CI and scripts, add basic analysis and formatting checks to the active pipeline, build releases from a dependency-installed tree, and derive the version from one place.
- **Unknown / needs further validation:** None.

### DEBT-022 — SVN-era and Cognizo legacy headers; build number read from `.svn/entries`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-001, DEBT-018, DEP-011*

- **Confirmed fact:** File headers from SVN and CATS 2005–2007 dominate the codebase. One function reads `.svn/entries`, always returns 0 in a git checkout, and holds the PHP 8 parse error.
- **Evidence:** `git grep -c "\$Id:"` over first-party `.php/.tpl/.js/.css/.sh` → 322 files (dated 2005: 2, 2006: 11, 2007: 309 lines); 217 files mention "Cognizo"; 11 code files carry a hand-maintained `* CATS Version: 0.9.7.4` header (`index.php`, `ajax.php`, `careers/index.php`, `rss/index.php`, `xml/index.php`, six `modules/*/dataGrids.php`); `lib/CATSUtility.php:98-131` `getBuild()` reads `.svn/entries` (`:108,122` are the PHP 8 parse errors), used by `lib/Session.php:115,131`.
- **Impact:** Header churn on every version bump, misleading ownership information, and a PHP 8 blocker inside SVN-only code.
- **Severity:** LOW — noise, apart from the parse error already counted in DEBT-001.
- **Recommendation:** Remove the frozen `$Id` and version headers in one mechanical change, keep licence headers as decided by counsel, and drop the SVN build lookup.
- **Unknown / needs further validation:** None.

### DEBT-023 — Formatting hygiene
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-018*

- **Confirmed fact:** Formatting is inconsistent, and two files emit stray output after their closing tag.
- **Evidence:** over the 213 first-party PHP files: 26 contain tab-indented lines and 25 mix tabs and spaces; 1,197 lines end in spaces or tabs; 8 files use CRLF (`grep -lU $'\r'`); 172 end with a closing `?>`. `ajax/getCandidateIdByPhone.php` ends in `?>\n\n\n` and `lib/FileCompressor.php` in `?>\n\n` (`tail -c | od -c`), so the first adds blank lines to its AJAX response (absorbed from DEBT-028) and the second emits output whenever it is included, risking "headers already sent".
- **Impact:** Noisy diffs and a real risk of corrupted responses.
- **Severity:** LOW — hygiene.
- **Recommendation:** Add an editor/line-ending configuration and apply one formatting-only change, including removal of closing tags from pure-PHP files.
- **Unknown / needs further validation:** None.

## 8. Metrics (reference)

### 8.1 Size by language and area

| Language | Files | Lines | Notes |
|---|---:|---:|---|
| PHP (all tracked, `docs/` excluded) | 355 | 137,356 | first-party 213 / 89,956; vendored 142 / 47,400 |
| Templates `.tpl` | 136 | 16,914 | plain PHP included by `lib/Template.php` |
| JavaScript | 57 | 16,296 | `js/` 38 first-party files / 11,546 + jQuery; `modules/**` 18 / 4,732 |
| SQL | 11 | 47,081 | 42,847 of them are zip-code data |
| HTML | 29 | 11,885 | 11,868 are SimpleTest docs |
| CSS | 14 | 2,863 | |
| Shell | 13 | 481 | |

| Directory | PHP files | PHP lines |
|---|---:|---:|
| `lib/` first-party (top level) | 81 | 46,703 |
| `lib/simpletest/` (vendored) | 95 | 31,112 |
| `lib/artichow/` (vendored) | 33 | 13,377 |
| `lib/fpdf/` (vendored) | 13 | 2,232 |
| `lib/sphinx/` (vendored) | 1 | 679 |
| `modules/` (incl. `modules/tests` 9 / 3,019) | 66 | 31,118 |
| `src/` (runtime 9 / 859; tests 15 / 3,044) | 24 | 3,903 |
| `optional-updates/` | 2 | 2,736 |
| root (`index.php`, `ajax.php`, `config.php`, `constants.php`, `QueueCLI.php`, `installtest.php`, `installwizard.php`, `rebuild_old_docs.php`) | 8 | 2,138 |
| `ajax/` | 21 | 1,862 |
| `test/` | 3 | 979 |
| `scripts/` | 3 | 395 |
| `careers/`, `rss/`, `xml/` entry shims | 3 | 122 |

### 8.2 Structure and coupling (production first-party unless noted)

| Metric | Value | Source |
|---|---:|---|
| Classes / interfaces / traits | 168 / 0 / 0 | token scan |
| Methods / global functions | 1,594 / 18 | token scan |
| `global` statements | 25 | token scan |
| Static calls / to another class | 1,697 / 1,505 | token scan |
| `$_SESSION['CATS']` | 373 PHP (53 files) + 13 `.tpl` | `git grep -o` |
| `DatabaseConnection::getInstance()` | 110 (53 files) | `git grep -o` |
| include/require statements | 506 | token scan |
| `eval(Hooks::get(` | 267 PHP + 11 `.tpl` | `git grep -o` |
| `eval` tokens | 279 | token scan |
| `@` suppression / `exit`,`die` | 178 / 153 | token scan |
| `echo` inside class methods | 539 (`lib/` 445) | token scan |
| `case` labels in `modules/*/*UI.php` | 293 (23 controllers; `SettingsUI` 74) | `grep -cE "^\s*case '"` |
| `->assign(` | 879 | `git grep -o` |
| Typed params / return types / `strict_types` | 7 / 0 / 0 | `git grep` |

### 8.3 Largest first-party files

| File | Lines | Methods | Longest function (lines) | eval | FIXME/TODO | Churn* |
|---|---:|---:|---:|---:|---:|---:|
| `modules/settings/SettingsUI.php` | 3,842 | 72 | 670 | 11 | 22 | 1 |
| `modules/candidates/CandidatesUI.php` | 3,582 | 38 | 401 | 37 | 9 | 2 |
| `lib/DataGrid.php` | 2,649 | 41 | 373 | 5 | 5 | 0 |
| `optional-updates/latest-sphinx-search/Search.php` | 2,487 | 46 | 209 | 7 | 18 | 0 |
| `lib/Candidates.php` | 2,473 | 34 | 353 | 0 | 6 | 1 |
| `modules/import/ImportUI.php` | 2,104 | 27 | 302 | 32 | 2 | 2 |
| `lib/Search.php` | 2,096 | 37 | 209 | 7 | 14 | 0 |
| `modules/joborders/JobOrdersUI.php` | 1,972 | 25 | 219 | 30 | 5 | 2 |
| `modules/careers/CareersUI.php` | 1,794 | 12 | 900 | 5 | 10 | 2 |
| `lib/WebForm.php` | 1,619 | 23 | 408 | 0 | 0 | 0 |
| `lib/FileCompressor.php` | 1,577 | 18 | 326 | 0 | 4 | 0 |
| `lib/ControlPanel.php` (never loaded) | 1,573 | 34 | 404 | 0 | 1 | 0 |
| `modules/contacts/ContactsUI.php` | 1,563 | 17 | 246 | 20 | 3 | 1 |
| `lib/Attachments.php` | 1,386 | 35 | 226 | 5 | 7 | 0 |
| `modules/install/Schema.php` | 1,336 | 1 | 1,303 | 0 | 0 | 0 |
| `lib/JobOrders.php` | 1,294 | 15 | 344 | 5 | 6 | 0 |
| `lib/Session.php` | 1,257 | 61 | 286 | 1 | 18 | 4 |
| `lib/Users.php` | 1,257 | 27 | 85 | 1 | 7 | 0 |
| `lib/TemplateUtility.php` | 1,245 | 25 | 226 | 11 | 7 | 1 |
| `modules/companies/CompaniesUI.php` | 1,224 | 16 | 224 | 19 | 0 | 2 |

\* commits touching the file in `8ad6c59..d607279` (56 commits, 2022-07-07 → 2026-01-26). `eval` here counts every `eval(` occurrence (`grep -oE '\beval\s*\('`).

### 8.4 Function length and complexity (first-party, token heuristics)

| Measure | Count |
|---|---:|
| Named functions and methods | 1,845 |
| Longer than 100 / 200 / 300 lines (production) | 128 / 43 / 17 |
| Approximate cyclomatic complexity > 10 / > 20 / > 50 / > 100 | 143 / 61 / 13 / 3 |

Top by complexity: `SettingsUI::handleRequest` (≈169, `modules/settings/SettingsUI.php:224`), `CareersUI::careersPage` (≈168, `modules/careers/CareersUI.php:71`), `ControlPanel::getListView` (≈108, dead), `SettingsUI::onCareerPortalQuestionnaire` (≈88, `:3370`), `ControlPanel::getWebForm` (≈83, dead), `BrowserDetection::detect` (≈64), `DataGrid::draw` (≈57), `DataGrid::_getData` (≈56), `CandidatesUI::handleRequest` (≈56), `dumpDB` (≈56, `modules/install/backupDB.php:66`).

### 8.5 PHP 8.4 syntax check and removed APIs

`php -l` over all 355 PHP files: 6 failures (5 unintended) — `lib/CATSUtility.php:108`, `lib/artichow/AntiSpam.class.php:63`, `lib/fpdf/fpdf.php:434`, `lib/fpdf/font/makefont/makefont.php:18`, `src/OpenCATS/Entity/JobOrderRepositoryException.php:2`, and the intentional `lib/simpletest/test/test_with_parse_error.php:5`. All 136 templates pass.

| Pattern | PHP status | First-party sites |
|---|---|---|
| `get_magic_quotes_gpc/_runtime()` | removed 8.0 | 9: `index.php:93,99`; `ajax.php:50,56`; `QueueCLI.php:59,65`; `lib/Attachments.php:944`; `lib/InstallationTests.php:185`; `modules/import/ImportUI.php:495` |
| `implode($array, $glue)` | removed 8.0 (TypeError) | 4: `lib/DataGrid.php:1292,1299,1328,1329` |
| `$str{n}` | removed 8.0 (parse error) | 2: `lib/CATSUtility.php:108,122` (+ vendored) |
| `create_function()` | removed 8.0 | 4, only in the Sphinx fork (`optional-updates/…/Search.php:228,240,301,313`) |
| `mysql_*` | removed 7.0 | 3, in `eval`'d migration strings (`modules/install/Schema.php:725,854,1236`) — fatal at runtime (RT-01) |
| `mcrypt_*` | removed 7.2 | `lib/Encryption.php` (never loaded) |
| `strftime()` / `utf8_encode()` / `libxml_disable_entity_loader()` | deprecated 8.1 / 8.2 / 8.0 | 5 / 2 / 1 (DEBT-003) |
| Dynamic properties | deprecated 8.2 | 879 `assign()` sites + 178 properties in 28 classes (DEBT-003) |
| `count()` / `mysqli_fetch_assoc()` on non-array or `false` | TypeError in 8.0 | observed as warnings on 7.2 (RT-02, RT-06; DEBT-030) |
| mysqli default error mode | throws since 8.1 (external knowledge) | no `mysqli_report()` call anywhere (DEBT-010) |

### 8.6 Debt markers

| Marker | Count (first-party PHP, TPL, JS) | Notes |
|---|---:|---|
| `FIXME` | 408 | themes: "Document me" placeholders; library code coupled to the session (≥21); missing validation (e.g. `modules/careers/CareersUI.php:548`, `modules/settings/SettingsUI.php:1951,1957`); security acknowledged (`lib/DatabaseConnection.php:482` "this function is not enough for sanitizing user input"); "Generate valid XHTML error pages" (`CareersUI.php:102,554,719,755`); duplication acknowledged (`SettingsUI.php:1271,2665`) |
| `TODO` | 51 | e.g. `lib/Session.php:208-214` site-200 special case |
| "Document me" | 175 | `git grep -oi "document me"` |

### 8.7 Entry points and their bootstrap

| Entry point | Lines | Includes `config.php` | Magic-quotes calls | `session_start` | Top-level includes |
|---|---:|:-:|---:|---:|---:|
| `index.php` | 276 | yes | 2 | 2 | 15 |
| `ajax.php` | 138 | yes | 2 | 0 | 9 |
| `QueueCLI.php` | 124 | yes | 2 | 1 | 15 |
| `careers/index.php` | 41 | yes (`:37`) | 0 | 0 | 3 (then `index.php`) |
| `xml/index.php` | 41 | yes (`:37`, added in `c315cbd`) | 0 | 0 | 3 (then `index.php`) |
| `rss/index.php` | 40 | **no** → RT-05 | 0 | 0 | 2 |
| `installwizard.php` | 551 | yes | 0 | 0 | 3 |
| `installtest.php` | 186 | yes | 0 | 0 | 3 |
| `rebuild_old_docs.php` (web-root maintenance script) | 66 | no | 0 | 0 | 2 |

Counts: `grep -cE "include(_once)?\s*\(?\s*['\"](\./)?config\.php"`, `grep -c get_magic_quotes`, `grep -c session_start`, `grep -cE "^\s*(include|require)(_once)?"` per file. `rebuild_old_docs.php:42` repeats the dead `connect_errno` error check of DEBT-010 item 4.

## 9. Hotspots (size × churn × markers, with baseline defects)

Score = (lines/100) × (1 + churn) × (1 + FIXME_TODO/10), over first-party PHP and templates. Churn is `git log --format= --name-only 8ad6c59..d607279`. "Baseline" lists runtime defects that surfaced in or through the file.

| Rank | File | Lines | Churn | FIXME/TODO | Score | Why it matters | Baseline |
|---:|---|---:|---:|---:|---:|---|---|
| 1 | `modules/settings/SettingsUI.php` | 3,842 | 1 | 22 | 245.9 | largest file; `handleRequest` 670 lines, ≈CC 169; 118 `$_SESSION` and 234 request-superglobal uses | test e-mail fatal via `ajax/testEmailSettings.php` (RT-04, #77) |
| 2 | `modules/candidates/CandidatesUI.php` | 3,582 | 2 | 9 | 204.2 | owns the placed→openings rule; divergent status dialog (DEBT-007) | candidate e-mail fatal (RT-04, #79) |
| 3 | `lib/Session.php` | 1,257 | 4 | 18 | 176.0 | session god object; `:850` defect; site-200 branch; SVN build check | — |
| 4 | `modules/careers/CareersUI.php` | 1,794 | 2 | 10 | 107.6 | public surface; 900-line `careersPage`; HTML in controller; `eval` | RT-04 (#85, #86), RT-12 resume dropped, RT-16 |
| 5 | `modules/joborders/JobOrdersUI.php` | 1,972 | 2 | 5 | 88.7 | status-dialog copy; instantiates `CandidatesUI` | RT-07 editor (#19), RT-09 PDF via reports |
| 6 | `lib/Candidates.php` | 2,473 | 1 | 6 | 79.1 | 3 classes; 353-line grid definition with `eval` strings | — |
| 7 | `modules/import/ImportUI.php` | 2,104 | 2 | 2 | 75.7 | raw SQL in controller (`:1711-1748`), magic quotes (`:495`) | not exercised |
| 8 | `optional-updates/latest-sphinx-search/Search.php` | 2,487 | 0 | 18 | 69.6 | stale fork with `create_function` | not exercised |
| 9 | `lib/Search.php` | 2,096 | 0 | 14 | 50.3 | 9 classes; session-coupling FIXMEs | PDF keyword search empty because of RT-08 (#43) |
| 10 | `lib/TemplateUtility.php` | 1,245 | 1 | 7 | 42.3 | 158 `echo`s; loads jQuery/legacy JS; relative autoloader include | — |
| 11 | `modules/contacts/ContactsUI.php` | 1,563 | 1 | 3 | 40.6 | ownership-e-mail copy; shared clones with `CandidatesUI` | — |
| 12 | `lib/DataGrid.php` | 2,649 | 0 | 5 | 39.7 | PHP 8 `implode` blockers, dynamic properties, `:257` and `:267` defects; every list view | RT-11 warning at `:248` (#78) |

Files outside the size ranking with baseline defects: `lib/Mailer.php` (RT-04), `modules/login/LoginUI.php:455` (RT-03), `rss/index.php:37` (RT-05, DEBT-031), `modules/companies/Show.tpl:311,349,393` (RT-06), `modules/reports/ReportsUI.php:488-500` + `lib/fpdf/fpdf.php:1508` (RT-09), `modules/reports/EEOReport.tpl:159` (RT-10), `lib/DatabaseConnection.php:321` and `lib/ModuleUtility.php:542` (RT-01, RT-02).

Reading: the recent churn is almost all security patching (cookies and session, XSS escaping, upload allow-list) and version bumps; no refactoring commits appear in the window. The files that attract security fixes are the most complex and debt-dense, and they have no unit tests (TEST-001). `lib/DataGrid.php` and `constants.php` change rarely but every list view and module depends on them.

## 10. Debt register (quantified)

| ID | Area | What, quantified | Key evidence | Severity |
|---|---|---|---|---|
| DEBT-001 | Runtime | 5 unintended PHP 8 parse errors; 9 removed-function calls; 4 reversed `implode` | `lib/CATSUtility.php:108`; `index.php:93,99`; `lib/DataGrid.php:1292` | CRITICAL |
| DEBT-002 | CI/runtime | 1 PHP version in CI; lint covers 24 of 355 PHP files | `ci.yml:21,44`; CI log | HIGH |
| DEBT-003 | Runtime | 879 `assign()` sites; 178 undeclared properties in 28 classes; 14 deprecated calls/params | `lib/Template.php:64-67` | HIGH |
| DEBT-004 | Architecture | 278 `eval(Hooks::get())`; 251 names; 10 implemented | `lib/Hooks.php:52-72` | HIGH |
| DEBT-005 | Architecture | 77 `pagerRender` strings (208 renderer/filter strings); 25 `PHP:` migrations; 9 other `eval` sites (wizard 1, installer 3, careers 3, `ArrayUtility` 1, `QueueProcessor` 1) | `lib/DataGrid.php:1206-1912`; `lib/ModuleUtility.php:542`; RT-01 | HIGH |
| DEBT-006 | Architecture | 17 functions > 300 lines; 13 with ≈CC > 50; 4 files > 2,400 lines | §8.3–8.4 | HIGH |
| DEBT-007 | Architecture | 1 rule only in a controller; 2 divergent dialogs; 8 e-mail copies; 7 URL copies | `CandidatesUI.php:3089`; `JobOrdersUI.php:1459` | HIGH |
| DEBT-008 | Architecture | 386 session reads; 110 singleton calls; 1,505 cross-class statics; 0 interfaces | `lib/DatabaseConnection.php:53-75` | HIGH |
| DEBT-009 | Architecture | 859 lines (≈1%); 2 broken exception paths | `JobOrderRepositoryException.php:2`; `Companies.php:109` | MEDIUM |
| DEBT-010 | Quality | 7 latent defects, 2 seen at runtime | `Session.php:850`; `DataGrid.php:257,267`; `LoginUI.php:455` | HIGH |
| DEBT-011 | Config | 82 `define`s in tracked config; 0 env reads; 4 request values written into PHP | `config.php:31`; `modules/install/ajax/ui.php:120-135` | HIGH |
| DEBT-012 | Domain | 11 status constants + DB rows; 9 literal status numbers in SQL; 3 magic site IDs | `lib/Statistics.php:102…591` | MEDIUM |
| DEBT-013 | Duplication | 13.7% PHP / 20.8% TPL clone lines; 2 forks; 12 `Error.tpl` | §DEBT-013 | MEDIUM |
| DEBT-014 | Quality | 153 `exit`/`die`; 178 `@`; 539 `echo` in methods | token scan | MEDIUM |
| DEBT-015 | Dead code | 4,181 never-loaded lines; 730-line licence shim; ~34k lines of in-app test runner | §DEBT-015 | MEDIUM |
| DEBT-016 | Dependencies | 142 vendored files / 47,400 lines; 3 PHP-8-fatal; 17 IE-specific JS uses | `lib/fpdf/fpdf.php:16` | MEDIUM |
| DEBT-017 | Architecture | migrations on page views; 3 migration mechanisms (195 + 7 + 3 items) | `lib/ModuleUtility.php:154-282`; RT-02 | MEDIUM |
| DEBT-018 | Tooling | 0 analyser configs; 1 dead CI; 2 inactive workflows; 12 files per version bump | `.travis.yml`; `1ba02b1` | MEDIUM |
| DEBT-019 | Docs | changelog 8+ releases behind; 41.4% docblocks; 175 "Document me" | `CHANGELOG.MD:1` | MEDIUM |
| DEBT-020 | Quality | 7 typed params; 0 return types; ≈97% unnamed `@param` | `git grep` | MEDIUM |
| DEBT-021 | Presentation | 5,285 PHP blocks in templates; 412 direct echoes vs 857 escaped | §DEBT-021 | MEDIUM |
| DEBT-022 | Hygiene | 322 `$Id` files; 217 Cognizo files; 11 version headers | `lib/CATSUtility.php:98-131` | LOW |
| DEBT-023 | Hygiene | 1,197 trailing-whitespace lines; 8 CRLF files; 2 files with output after `?>` | §DEBT-023 | LOW |
| DEBT-024 | Hygiene | 35 CWD-relative includes | `lib/CATSUtility.php:34` | LOW |
| DEBT-029 | Errors | 0 error handlers; 3 distinct fatals served as HTTP 200 | RT-15 | HIGH |
| DEBT-030 | Runtime | 3 warning sites observed (RT-02, RT-06, RT-11), 2 of them fatal on PHP 8 | `Show.tpl:311`; `DatabaseConnection.php:321` | MEDIUM |
| DEBT-031 | Architecture | 6 hand-copied bootstraps; 1 drifted copy broken | `rss/index.php:37`; `c315cbd` | MEDIUM |

## 11. Commands behind the numbers

```bash
# size
git ls-files "*.php" | grep -v '^docs/' | xargs cat | wc -l                 # 137,356 (355 files)
git ls-files '*.php' | grep -E '^lib/(artichow|fpdf|simpletest|sphinx)/' | xargs cat | wc -l   # 47,400
# PHP 8.4 syntax
while read f; do php -l "$f"; done < <(git ls-files '*.php')
# global state, hooks, eval
git grep -o "\$_SESSION\['CATS'\]" -- '*.php' | wc -l                        # 373 (+13 in *.tpl)
git grep -o 'DatabaseConnection::getInstance()' -- '*.php' | wc -l           # 110
git grep -o 'eval(Hooks::get(' -- '*.php' '*.tpl' | wc -l                    # 278
git grep -ohE "Hooks::get\('[A-Z0-9_]+'\)" -- '*.php' '*.tpl' | sort -u | wc -l   # 251
git grep -o -- '->assign(' -- '*.php' | wc -l                                # 879
grep -cE "^\s*case '" modules/*/*UI.php                                      # 293 in total
# dead code (per class name)
git grep -nE "ControlPanel\.php|new ControlPanel\b|ControlPanel::" -- '*.php' '*.tpl'
# duplication, tokens, dynamic properties, docblocks (Phase 0 scanners, re-run)
python3 dupscan.py fp_php.txt 8 ; python3 dupscan.py tpl.txt 8
php tokscan.php prod_php.txt prod ; php ccscan.php fp_php.txt
php dynprops.php fp_php.txt ; php doccov.php fp_php.txt
# PHP 8 behaviour checks (one-liners, PHP 8.4)
php -r 'try { count(null); } catch (\Throwable $e) { echo $e->getMessage(); }'
php -r 'var_dump(preg_replace("[^A-Za-z0-9]", "", "../../x;Foo"));'
# churn
git log --format= --name-only 8ad6c59..d607279 | grep . | sort | uniq -c | sort -rn
```

## Area-level unknowns

1. **PHP 8 runtime breakages beyond the static list.** Type-juggling changes, `null` passed to string functions and `count()` on failed results cannot be enumerated statically; needs the suites and the smoke harness on PHP 8 after DEBT-001 is fixed, with all error levels reported.
2. **Hidden notices and deprecations on PHP 7.2.** The baseline image suppresses them (`error_reporting=22519`); needs a smoke run with `E_ALL`.
3. **Careerportal-category users and modules without an implemented guard hook** (lists, attachments, import, export, graphs, xml, queue, wizard); needs a runtime check with such a user (cross-ref SEC, ARCH-007).
4. **Out-of-tree modules using hooks**; needs operator/community input before removing the hook mechanism.
5. **Churn before 2022-07-07**; the clone is shallow. A full-history analysis could change the hotspot ranking for files stable in this window (`lib/DataGrid.php`, `lib/Search.php`).
6. **Deployments running the Sphinx fork or `modules.cache`**; operators who copied `optional-updates/` run different, PHP-8-incompatible search code.
7. **Web reachability of `rebuild_old_docs.php`, `installtest.php` and `scripts/`** in typical deployments; depends on the web server (the nginx image ignores `.htaccess`, DEP-017).
8. **Concurrency of first-request migrations** under load (DEBT-017); needs a load test on an isolated instance.

## Changes from the Phase 0 edition

- **New:** DEBT-029 (no error boundary; RT-15, RT-03, RT-04, RT-05), DEBT-030 (warnings in pages that become PHP 8 `TypeError`s; RT-02, RT-06, RT-11), DEBT-031 (drifted bootstrap copies; RT-05, commit `c315cbd`).
- **Promoted:** DEBT-024 from register-only item to a full LOW finding.
- **Merged (stubs kept):** DEBT-025 → DEBT-007 (same URL-building sites); DEBT-026 → DEBT-005; DEBT-027 → DEBT-003; DEBT-028 → DEBT-023.
- **Confirmation upgrades from execution evidence:** DEBT-002 → Runtime (CI log: PHP 7.2.34, 24-file lint); DEBT-005 → Runtime (RT-01 fatal inside `eval()`'d migration code); DEBT-010 → Runtime for items 4 (RT-02) and 7 (new item, RT-03); DEBT-011 → Runtime (RT-08 placeholder defaults; installer config rewriting avoided in the baseline); DEBT-017 → Runtime (migrations applied on page requests, RT-02 and `INSTALLATION.md` step 5b).
- **Re-rated:** none.
- **Corrected figures:** `->assign(` 878 → 879; HTTP_HOST URL copies 8 → 7 live + 1 commented (`CareersUI.php:1506`); `DatabaseConnection.php` dead error branches at `:184,198` (Phase 0 `:183,197`); `CHANGELOG.MD:1` (Phase 0 `:3`); Cognizo mentions 214 → 217 files; "Document me" 141 → 175 (all occurrences, not only FIXME lines); files ending in `?>` 175 → 172; direct template echoes 352 → 412 (broader, stated pattern); DataGrid renderer strings now counted as 77 `pagerRender` / 208 renderer-and-filter definitions (Phase 0: "238 lines"); `config.php` `define` lines 67 → 82 (all `define(` lines); IE-specific JS uses 15 → 17; `@param` unnamed 96% → ≈97%. All other Phase 0 numbers re-measured unchanged (13.7% / 20.8% clones, 178 properties in 28 classes, 41.4% docblocks, 4,181 dead lines, 1,845 functions and the complexity distribution, churn ranking).
- **Removed:** effort estimates, treatments and the "suggested sequencing" from the Phase 0 register. They were planning content and are out of scope for this findings-only edition; the register in §10 keeps the quantities.
- **Cross-reference note:** the Phase 0 statement that `JobOrderRepositoryException.php` "likely" parses on PHP 7 is now confirmed by the CI lint on PHP 7.2.34 (DEBT-009).
