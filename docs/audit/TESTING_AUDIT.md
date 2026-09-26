# OpenCATS — Testing Assessment

Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **Inspected:** every test asset in the tree — PHPUnit tests (`src/OpenCATS/Tests/**`), Behat/Mink suites and fixtures (`test/**`), the in-app SimpleTest runner (`modules/tests/**`, `lib/simpletest/**`), CI and packaging (`.github/workflows/ci.yml`, `.github/workflow/*.yml`, `.travis.yml`, `ci/package-code.sh`), `docker/docker-compose-test.yml`, `README-testing.md`.
- **Out of scope as product:** `.github/workflows/preview.yml`, `docs/baseline/preview/**` and `docs/baseline/env/**` are audit support tooling added in this fork. They are mentioned only where they explain evidence.
- **Commands (read-only):** `git ls-files`, `wc -l`, `grep -c 'function test'`, `grep -cE '^\s*(Scenario|Scenario Outline):'`, `git grep` for assertions, hooks and status checks, `diff` of DDL blocks, `php -r` over `composer.lock`, `php -l` (PHP 8.4 CLI).
- **Execution evidence used:**
  - The CI job log of the check **"Tests (PHP 7.2)"** on this fork's PR #1 (merge of `f9f4978` into `d607279`, workflow run [36237531847](https://github.com/S7adows/OpenCATS/actions/runs/36237531847), 2026-09-26 11:01–11:08Z). The job log is public on GitHub Actions for the log-retention period; a copy is not committed. Application files in that run are identical to `d607279`. In this document "Runtime" also covers facts observed in that CI run, and each such claim says so.
  - The Phase 0.5 baseline (`docs/baseline/`): `SMOKE_TEST.md` (94 steps), `KNOWN_RUNTIME_ERRORS.md` (RT-01…RT-17), `ENVIRONMENT.md`, `INSTALLATION.md`, `evidence/final-run/`.
  - Phase 0 execution logs on PHP 8.4 (PHPUnit 7.5 / 9.6, Behat dry-run, `composer install`) kept in the audit scratch area. They were not re-run in this edition and are labelled as Phase 0 measurements.
- **Not done:** no test suite, app, Docker stack or database was started for this edition. No line or branch coverage was measured (no coverage driver). No security testing.

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| TEST-001 | Automated tests barely touch domain logic; no controller, careers, upload, e-mail or AJAX code is tested | HIGH | Static |
| TEST-002 | Test toolchain is locked to PHP 7.x / PHPUnit 7.5 and cannot run on PHP 8 | HIGH | Static |
| TEST-003 | CI runs only PHP 7.2 and lints only the 24 files in `src/` | HIGH | Runtime |
| TEST-004 | Security suite checks only the module/action access gate, and its "has permission" assertion passes on error pages | HIGH | Static |
| TEST-005 | CI quality gates are partly ineffective (audit never fails, Behat not reported, screenshot artifact always empty) | MEDIUM | Runtime |
| TEST-006 | Vacuous, placeholder and disabled tests report green | MEDIUM | Static |
| TEST-007 | Behat fixture schema and test config drift from production; no DB reset between scenarios or suites | MEDIUM | Static |
| TEST-008 | Behat uploads failure screenshots to a third-party anonymous file host | MEDIUM | Static |
| TEST-009 | Legacy SimpleTest runner ships as a production module (`m=tests`) and loads during module discovery | MEDIUM | Static |
| TEST-010 | No static analysis, PHP-compatibility or coding-standard tooling | MEDIUM | Static |
| TEST-011 | No JavaScript tests or lint for about 16.3k lines of first-party JS | MEDIUM | Static |
| TEST-012 | No contract, performance, SAST or DAST tests; a public feed has been broken without any test noticing | MEDIUM | Static |
| TEST-013 | No `phpunit.xml`; tests depend on the working directory and fixed Docker hostnames; `die()` in the DB test base | LOW | Static |
| TEST-014 | Obsolete or inactive CI definitions (`.travis.yml`, `.github/workflow/`, `runAllTests.sh`) are misleading | LOW | Static |
| TEST-015 | A green "Tests (PHP 7.2)" check does not show the application works: it passed on code with 3 fatal-error paths and several broken features | HIGH | Runtime |

15 findings — 0 CRITICAL / 5 HIGH / 8 MEDIUM / 2 LOW · Runtime 3 / Static 12 / Partial 0 / Unverified 0 (no withdrawn or merged stubs).

## 1. What CI runs and what a green check means

### TEST-015 — A green "Tests (PHP 7.2)" check does not show the application works
*Confirmation: **Runtime** · New in this edition · Related: TEST-001, TEST-004, TEST-012, RT-03, RT-04, RT-05, RT-06, RT-07, RT-11, RT-12*

- **Confirmed fact:** The CI check passed with every suite green on application code identical to `d607279`. The Phase 0.5 baseline ran the same code and observed 3 distinct fatal errors (6 occurrences), 8 distinct PHP warnings, a non-starting editor, a broken RSS feed and silent resume loss. No CI suite exercises any of those paths, and no Behat step checks the HTTP status or looks for PHP error text.
- **Evidence:**
  - CI job log: `PHPUnit 7.5.7` on `Installed PHP 7.2.34` → `OK (88 tests, 634 assertions)`; integration → `OK (9 tests, 60 assertions)`; Behat default → `27 scenarios (27 passed)`, `431 steps (431 passed)`; Behat security → `1296 scenarios (1296 passed)`, `5528 steps (5528 passed)`; JUnit publisher → "97 tests run, 97 passed"; conclusion posted as `success` for `f9f4978`.
  - Baseline on the same app files: `docs/baseline/SMOKE_TEST.md` §2 (3 fatal, 8 warnings, 2 functional step failures); RT-03 forgot password fatal (#04), RT-04 every e-mail send fatal (#77, #79, #85, #86), RT-05 RSS fatal (#88), RT-06 warnings on company detail (#10, #11), RT-07 CKEditor refuses to start (#19, #78), RT-11 warning on candidate e-mail compose (#78), RT-12 careers resume silently dropped (#85).
  - `git grep -niE "warning|fatal|error|getStatusCode|status code" test/features` matches only a code comment (`FeatureContext.php:300`) and client-side "Form Error" alert checks (`job-orders.feature:49,148`). No step asserts an HTTP status or looks for PHP warning/fatal text.
  - Feature files never touch `m=rss`, `careers/`, the forgot-password form, e-mail sending or the job-order description editor (`grep -n "rss\|careers\|forgot" test/features/*.feature` returns nothing; `job-orders.feature` never fills the description).
- **Impact:** Maintainers and reviewers can read "all checks passed" as "the application works". It means only that 97 PHPUnit tests and 1,323 Behat scenarios passed on PHP 7.2 against a fixture database. Regressions in the flows recruiters and applicants use most (apply, e-mail, feeds, uploads) cannot turn the check red.
- **Severity:** HIGH — the only automated quality signal gives false assurance on a core workflow (careers apply, e-mail) and is a major barrier to safe change.
- **Recommendation:** Treat the current check as a narrow regression signal and state its scope in `README-testing.md`. Add at least one assertion per request that fails on a PHP error string or a non-2xx status, so fatals like RT-03/RT-05 cannot pass.
- **Unknown / needs further validation:** Whether branch protection requires this check before merge (needs the repository settings). Whether a Behat run with `display_errors=On` actually rendered warnings on the pages it visited (the log records only dots).

### TEST-003 — CI runs only PHP 7.2 and lints only the 24 files in `src/`
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: DEBT-001, DEBT-002, DEP-001, TEST-015*

- **Confirmed fact:** The single matrix entry is PHP 7.2. The lint step runs `php -l` only on files under `src/` (24 files, 9 of them non-test). On PHP 7.2 it reports `src/OpenCATS/Entity/JobOrderRepositoryException.php` as clean, although that file does not parse on PHP 8 and does not declare the namespaced class the code expects. `lib/`, `modules/`, `ajax/` and the entry points are never linted.
- **Evidence:**
  - `.github/workflows/ci.yml:21` `php-version: ['7.2']`; `:44` `find src -name "*.php" -print0 | xargs -0 -n1 php -l`.
  - CI job log: setup-php "Installed PHP 7.2.34"; the lint step lists exactly 24 files, including `No syntax errors detected in src/OpenCATS/Entity/JobOrderRepositoryException.php`. This confirms the Phase 0 inference that PHP 7.x accepts `namespace \OpenCATS\Entity;` (`JobOrderRepositoryException.php:2`).
  - `php -l` on PHP 8.4 over all tracked PHP files: 6 parse errors — `lib/CATSUtility.php:108`, `lib/artichow/AntiSpam.class.php:63`, `lib/fpdf/fpdf.php:434`, `lib/fpdf/font/makefont/makefont.php:18`, `src/OpenCATS/Entity/JobOrderRepositoryException.php:2`, and the intentional fixture `lib/simpletest/test/test_with_parse_error.php:5`. `lib/CATSUtility.php` is included by `index.php:61`, `ajax.php:43`, `careers/index.php:38`, `xml/index.php:38`, `rss/index.php:37`, `QueueCLI.php:40`.
  - `src/OpenCATS/Entity/JobOrderRepository.php:4,117` throws `OpenCATS\Entity\JobOrderRepositoryException`; `lib/JobOrders.php:133` catches `JobOrderRepositoryException`.
- **Impact:** CI cannot signal that the application does not start on any supported PHP version. The job-order persistence failure path is broken and untested on every PHP version.
- **Severity:** HIGH — the pipeline hides a platform blocker for any modernization.
- **Recommendation:** Lint every tracked `*.php` and `*.tpl` (excluding the SimpleTest parse-error fixture) on each runtime the project claims to support, and add a PHP 8.x matrix entry so the known blockers are visible.
- **Unknown / needs further validation:** Runtime behaviour of the job-order failure path on PHP 7.2 (the class name mismatch is read from code; the path was not triggered in the baseline).

### TEST-005 — CI quality gates are partly ineffective
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: DEP-005, DEP-012, TEST-008*

- **Confirmed fact:**
  - The dependency audit runs but cannot fail the build.
  - Behat output is progress dots only, so Behat results never reach the JUnit report (the report counts 97 PHPUnit tests only).
  - Failure screenshots are written inside the PHP container's temp directory, not to the uploaded `test/screenshots/` path.
  - `codacy/coverage` is installed but never run, and a stale `# continue-on-error: true` comment remains.
  - Correction to Phase 0: test failures **do** fail the job. Every `run:` step uses `bash -e`, so a non-zero exit from PHPUnit or Behat stops the step. `fail_on_failure: false` only affects the extra check-run created by the JUnit publisher. A failure in the Behat default suite, however, stops the step before the security suite runs, so that run has no security-suite result.
- **Evidence:**
  - `.github/workflows/ci.yml:48` `composer audit || true`; CI log prints "Found 22 security vulnerability advisories affecting 8 packages" and the job continues.
  - `ci.yml:80-81` `--format=progress`; `ci.yml:51` creates `reports/behat-*` folders that nothing writes to; CI log "Found and parsed 2 test report files … 97 tests run".
  - `ci.yml:92` `fail_on_failure: false`; CI log shows `shell: /usr/bin/bash -e {0}` for every run step.
  - `test/features/bootstrap/FeatureContext.php:191` `sprintf('%s/%s.png', sys_get_temp_dir(), $filename)` vs `ci.yml:99` `path: test/screenshots/`.
  - `composer.json:10` `codacy/coverage`; no coverage step anywhere; `ci.yml:82` stale comment.
- **Impact:** Known-vulnerable dev dependencies merge unnoticed. When Behat fails, the report and artifacts do not help diagnose it.
- **Severity:** MEDIUM — gates exist but two of them do nothing.
- **Recommendation:** Make the audit step meaningful for runtime dependencies (report dev advisories separately), emit Behat JUnit output into the published reports, write screenshots to the uploaded path, and remove the unused coverage package and stale comment.
- **Unknown / needs further validation:** Whether the repository requires this check for merging (branch protection settings).

### TEST-014 — Obsolete or inactive CI definitions are misleading
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-018, DEP-012*

- **Confirmed fact:** `.travis.yml` still declares PHP 7.2/8.0/8.2 jobs and a deploy step, although the locked dev dependencies cannot install on PHP 8 (TEST-002). Two issue-housekeeping workflows sit in `.github/workflow/` (singular), which GitHub does not load. `test/runAllTests.sh` has no `set -e`, so only the last command's exit status counts.
- **Evidence:** `.travis.yml:17-20` (`php: 7.2, 8.0, 8.2`), `:21-27` (script), `:28-31` (deploy with encrypted key); `ci/package-code.sh:3-10` (Travis-only packaging); `.github/workflow/needs-reply.yml`, `.github/workflow/needs-reply-remove.yml`; `test/runAllTests.sh:1` `#!/bin/sh -x`, `:3` `dockerize …`, `:4` `php modules/tests/waitForDb.php`, `:6-8` phpunit and two Behat runs. External knowledge: GitHub reads workflows only from `.github/workflows/`; travis-ci.org stopped operating in 2021.
- **Impact:** Contributors may believe PHP 8 is tested or that issue automation is active. Running `runAllTests.sh` locally can report success after an integration failure.
- **Severity:** LOW — misleading, no direct product effect.
- **Recommendation:** Remove or clearly retire the Travis files, move or delete the singular-directory workflows, and make `runAllTests.sh` stop on the first failure.
- **Unknown / needs further validation:** Whether any external service still reads `.travis.yml` (needs the Travis/GitHub integration settings).

### TEST-013 — No `phpunit.xml`; tests depend on the working directory and fixed Docker hostnames
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-007*

- **Confirmed fact:** Suites are selected by directory on the command line. Tests include files relative to the current directory. The integration base class connects to the literal host `integrationtestdb` with `dev`/`dev` and calls `die()` on a failed statement, which ends the PHPUnit process without a report. The release job excludes a `phpunit.xml` that does not exist.
- **Evidence:** no `phpunit*.xml*` in the tree (`find` over the repo, `docs/` excluded); `ci.yml:54,77` pass directories; CI runs integration tests with `--workdir /var/www/public` (log); `src/OpenCATS/Tests/IntegrationTests/DatabaseTestCase.php:10` `setUp()`, `:16-27` `define('LEGACY_ROOT','.')` and `include_once('./config.php')`, `:31-35` `mysqli_connect('integrationtestdb','dev','dev')`, `:84` `die (`; `ci.yml:119` `-x … "phpunit.xml"`.
- **Impact:** Tests are hard to run outside the CI container layout, and a SQL failure produces no JUnit record.
- **Severity:** LOW — friction, not a product defect.
- **Recommendation:** Add a PHPUnit configuration with a bootstrap that resolves paths from the file location and takes DB settings from the environment, and make the base class throw instead of `die()`.
- **Unknown / needs further validation:** None.

## 2. Coverage

### TEST-001 — Automated tests barely touch domain logic
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-015, DEBT-006, DEBT-008*

- **Confirmed fact:** The 88 unit tests and 9 integration tests exercise leaf utilities (string, date, address parsing, SQL escaping, a boolean-search parser) and trivial entity getters. No class for candidates, pipelines and status changes, users and sessions, ACL, attachments, careers, mailer, import/export or DataGrid has a unit test. None of the 23 `modules/*/*UI.php` controllers is unit-tested. 23 of the 88 unit tests only check that a getter returns its constructor argument.
- **Evidence:**
  - Test files include 12 `lib/` files: `AJAXInterface`, `AddressParser`, `ArrayUtility`, `BrowserDetection`, `DatabaseConnection`, `DatabaseSearch`, `DateUtility`, `FileUtility`, `History` (mocked only), `ResultSetUtility`, `StringUtility`, `VCard` (`grep -rhoE "include_once\([^)]*lib/[A-Za-z]+\.php" src/OpenCATS/Tests`). `lib/` has 81 top-level files and about 1,100 functions (`grep -c 'function '` gives 1,146, which includes commented code).
  - Phase 0 counted 49 distinct `lib` class::method pairs referenced by tests (≈4.4 %); the file list above is consistent with that figure.
  - No test file includes anything under `modules/`.
  - `src/OpenCATS/Tests/UnitTests/JobOrderTest.php:33-165`: 23 `test_create_CreateAndGet…` methods.
  - Baseline defects sit in untested code: `modules/login/LoginUI.php:455` (RT-03), `lib/Mailer.php:76,241` (RT-04), `rss/index.php:37` (RT-05), `modules/companies/Show.tpl:311,349,393` (RT-06), `modules/careers/CareersUI.php` apply path (RT-12).
- **Impact:** Any refactor, PHP upgrade or data-layer change has no safety net for permissions, pipelines, uploads or e-mail. Regressions surface in production.
- **Severity:** HIGH — major barrier to any modernization.
- **Recommendation:** Before structural change, add characterization tests around the flows the baseline showed to be fragile or valuable (candidate and pipeline changes, careers apply with upload, attachments and resume search, login/session, access checks), so current behaviour is recorded before it is changed.
- **Unknown / needs further validation:** Real line and branch coverage (needs a PHP 7.2 container with pcov or xdebug).

### TEST-004 — Security suite checks only the module/action access gate; its "has permission" assertion passes on error pages
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-004, SEC-005, SEC-008, SEC-026, API-005, API-021*

- **Confirmed fact:** The 1,296 security scenarios log in at one of 8 access levels and request `index.php?m=M&a=A` or open a module page. None of the request URLs carries an object ID, so object-level and cross-site access are not tested. "I should have permission" only checks that three strings are absent, so an HTTP 500, a PHP fatal or an empty page also passes. POST checks send only `postback=postback`. AJAX endpoints are explicitly excluded. The careers portal, `xml/`, `rss/`, the toolbar and uploads never appear. One step definition is wrapped in backticks and cannot match.
- **Evidence:** `test/features/bootstrap/SecurityContext.php:171-176` (`iShouldHavePermission` checks absence of "You don't have permission", "Invalid user level for action", "opencats - Login"); `:111` `$data = array('postback' => 'postback');`; `:156` step annotation in backticks; `test/features/GET_POST_requestsSecurity.feature:1330` `#### AJAX not tested`, followed by commented-out rows; `grep -n "rss\|careers\|upload\|m=xml\|m=toolbar" test/features/*.feature` finds only the commented AJAX block. CI log: `1296 scenarios (1296 passed)`.
- **Impact:** The suite gives false assurance about authorization in a multi-user system holding candidate PII. The public attack surface (careers apply and upload) has no regression protection.
- **Severity:** HIGH — security regression coverage is misleading on the most sensitive paths.
- **Recommendation:** Make the positive permission assertion require a success status and a page-specific marker, and extend the suite to object-level access with real fixture IDs, AJAX functions and the careers upload path.
- **Unknown / needs further validation:** Which of the 1,296 passing scenarios landed on error pages (needs a Behat run that records status codes and PHP error text).

### TEST-011 — No JavaScript tests or lint
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-003, DEP-007, RT-10*

- **Confirmed fact:** First-party JavaScript has 11,546 lines in 38 `js/*.js` files (jQuery excluded) and 4,732 lines in 18 `modules/**/*.js` files. There is no `package.json`, test runner or linter. Browser behaviour is exercised only through Behat `@javascript` scenarios on a 2016 Selenium image.
- **Evidence:** `git ls-files 'js/*.js' | grep -v jquery | xargs cat | wc -l` → 11,546; `git ls-files 'modules/*.js' | xargs cat | wc -l` → 4,732; no `package.json` or `.eslintrc*` exist; `docker/docker-compose-test.yml:53` `mlespiau/standalone-chrome:2.53.1-cd2.23`. Runtime: RT-10 (`modules/reports/EEOReport.tpl:159` calls `.focus()` on a missing field, #52) is the kind of error a linter or smoke test would catch.
- **Impact:** A jQuery or CKEditor change, or a template refactor, can break client behaviour without any signal.
- **Severity:** MEDIUM — notable maintainability cost on a UI-heavy application.
- **Recommendation:** Add a JS linter in report-only mode and browser smoke tests for the flows already described in `job-orders.feature` and `candidate-filters.feature`.
- **Unknown / needs further validation:** Whether the Selenium 2.53 image will keep working with current runners (it worked in the 2026-09-26 CI run).

### TEST-012 — No contract, performance, SAST or DAST tests; a public feed has been broken without any test noticing
*Confirmation: **Static** · Phase 0 severity: LOW → now MEDIUM (runtime shows a public feed broken unnoticed, RT-05) · Related: RT-05, API-012, PERF-001*

- **Confirmed fact:** External contracts have no tests: the XML job feed (`modules/xml/XmlUI.php`), the RSS feed (`rss/index.php`, `modules/rss/RssUI.php`), `ajax.php` responses, SOAP WSDLs (`wsdl/*.wsdl`) and `QueueCLI.php`. The repository has no load tests and no SAST or DAST configuration. The RSS feed, linked from every careers page, is a PHP fatal on the committed code.
- **Evidence:** `ls test/features` shows no feed, careers or queue scenario; `.github/workflows/ci.yml` has no such steps. RT-05: `rss/index.php:37` uses `LEGACY_ROOT` before `config.php` defines it → fatal (#88); the XML feed works (#89). `git log --format='%h %ad' -S "LEGACY_ROOT . '/lib/CATSUtility.php'" -- rss/index.php` shows the line has existed since the shallow-history boundary `8ad6c59` (2022-07-07).
- **Impact:** Job-board integrations and cron tasks can break unnoticed, as RSS already has. Performance on large DataGrid lists has no baseline beyond the near-empty-database timings in `KNOWN_RUNTIME_ERRORS.md` §Performance.
- **Severity:** MEDIUM — a degraded public feature has gone undetected; raised from LOW because of RT-05.
- **Recommendation:** Add output-contract tests for `xml/`, `rss/` and the careers job list against the seeded database, and a scheduled baseline security scan of the test stack.
- **Unknown / needs further validation:** How long RSS has been broken before 2022 (history is shallow).

## 3. Test quality and test data

### TEST-006 — Vacuous, placeholder and disabled tests report green
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-015*

- **Confirmed fact:** Some tests cannot fail or never run. A loop in `AJAXInterfaceTest` sets one request key and asserts on a different, unset key. `DatabaseSearchTest::testMakeREGEXPString` asserts `true`. `StringUtilityTest::disabledtestIsCityStateZip` never runs. Five legacy SimpleTest AJAX classes contain no assertions. `README-testing.md` says placeholders are flagged "Risky"; an `assertTrue(true)` test is not risky, and the CI output shows no risky tests.
- **Evidence:** `src/OpenCATS/Tests/UnitTests/AJAXInterfaceTest.php:124-126` (sets `isRequiredIDValidTest`, asserts on `isOptionalIDValid('isOptionalIDValidTest')`, 12 invalid IDs); `IntegrationTests/DatabaseSearchTest.php:17-20`; `UnitTests/StringUtilityTest.php:409`; `modules/tests/testcases/AJAXTests.php` classes `GetCompanyNamesTest` (`:380`), `GetPipelineJobOrderTest` (`:884`), `SetCandidateJobOrderRatingTest` (`:896`), `TestEmailSettingsTest` (`:908`), `ZipLookupTest` (`:920`) with 0 assertions; `README-testing.md:40`; CI log `OK (9 tests, 60 assertions)` with no risky marker.
- **Impact:** Reported counts overstate protection. The rejection of negative and non-numeric optional IDs, which is input validation, is not actually verified.
- **Severity:** MEDIUM — misleading test signal on input validation.
- **Recommendation:** Fix the key in the `AJAXInterfaceTest` loop, implement or mark incomplete the placeholder, delete or enable the disabled test, and make PHPUnit fail on tests without assertions.
- **Unknown / needs further validation:** None.

### TEST-007 — Behat fixture schema and test config drift from production; no DB reset between scenarios or suites
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-007, DB-003, SEC-003*

- **Confirmed fact:** Behat runs against `test/data/test.sql`, which carries its own full DDL for all 55 tables instead of loading `db/cats_schema.sql`. The two DDL sets differ. Integration tests load `db/cats_schema.sql`. `test/config.php` is a hand-maintained fork of `config.php` that lacks LDAP constants the code uses, and CI copies it over `config.php`. No Behat hook resets the database, and the security suite runs after the default suite on the same database.
- **Evidence:**
  - `diff` of the `CREATE TABLE` blocks: 72 differing lines. Examples: `joborder.status` `varchar(64)` at `db/cats_schema.sql:808` vs `varchar(16)` at `test/data/test.sql:1196`; `user.session_cookie` `varchar(256)` at `db/cats_schema.sql:1083` vs `varchar(48)` at `test/data/test.sql:1588`; `attachment.content_type` `varchar(255)` at `db/cats_schema.sql:91` vs `varchar(64)` at `test/data/test.sql:126`.
  - `diff` of the `define` lines of `config.php` and `test/config.php`: `LDAP_ACCOUNT` and `LDAP_ATTRIBUTE_*` are missing from the test config; they are used at `lib/LDAP.php:68,96,135`. `ci.yml:59` `cp test/config.php ./config.php`.
  - Fixture content: `test/data/test.sql` holds DDL plus 17 reference-data inserts and the `admin` user (`:1618`, MD5 of `admin`); `test/data/securityTests.sql` adds candidates, companies, contacts, job orders, lists and 8 `tester*` users with password `tester`.
  - Hooks: `grep -n "@Before\|@After\|TRUNCATE" test/features/bootstrap/*.php` finds only `FeatureContext.php:118` (caches the scenario title) and `:127` (screenshot). CI log: default suite then security suite on the same `opencatsdb`.
  - All 55 tables are MyISAM (`grep -c ENGINE=MyISAM db/cats_schema.sql` → 55), so transaction rollback cannot isolate tests.
  - Every business record in the fixture belongs to site 1 (the only other site is the internal `CATS_ADMIN` site 180), so no test can check isolation between tenants (§5.5).
- **Impact:** Behaviour that depends on column width, zero dates or config differs between test and production. The LDAP path cannot be tested. Scenarios that create records can affect later scenarios (INFERENCE; the CI run was green).
- **Severity:** MEDIUM — tests can pass against a schema and config production does not use.
- **Recommendation:** Build the test database from the production schema plus seed-only inserts, derive the test config from the real one with overrides, and reset data between features or suites.
- **Unknown / needs further validation:** Whether any current scenario depends on state created by an earlier one (needs a run in shuffled order).

### TEST-008 — Behat uploads failure screenshots to a third-party anonymous file host
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-010, TEST-005*

- **Confirmed fact:** On a failed step in a `@javascript` scenario, `FeatureContext` takes a browser screenshot, creates an anonymous account on `wsend.net`, uploads the PNG with a shell `curl` via `exec()`, and prints the public URL.
- **Evidence:** `test/features/bootstrap/FeatureContext.php:127-135` (`@AfterStep` → `takeAScreenshot`), `:141-157` (screenshot then `getScreenshotUrl`), `:159-169` (`exec(sprintf('curl -F …', …, 'https://wsend.net/upload_cli'))`), `:173-184` (`curl_init('https://wsend.net/createunreg')`). The CI run on 2026-09-26 had no failures, so no upload happened in it.
- **Impact:** Screenshots of application pages go to an uncontrolled external service. If a developer points Behat at a copy of real data, candidate PII leaves the organisation.
- **Severity:** MEDIUM — data-handling risk with a precondition (failure while testing against real data).
- **Recommendation:** Remove the upload and keep screenshots as CI artifacts only.
- **Unknown / needs further validation:** Whether wsend.net still accepts uploads (network probing was out of scope).

### TEST-009 — Legacy SimpleTest runner ships as a production module and loads during module discovery
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-022, DEBT-015, DEBT-017, DEP-006*

- **Confirmed fact:** `modules/tests` is discovered like any other module. `TestsUI` requires authentication but checks no access level, so any logged-in user can reach `index.php?m=tests`. Its web tests log in as `TESTER_LOGIN` and create and delete users and records in the live database, with cleanup only at the end of each test. Module discovery includes every `*UI.php` when the session has no module list, so `TestsUI.php`'s top-level code runs in ordinary requests: it loads SimpleTest, calls `set_time_limit(300)` and sets `error_reporting(E_ALL)`.
- **Evidence:** `lib/ModuleUtility.php:154` (refresh when the session has none), `:262` `include_once($fullFilePath)`; `config.php:256` `define('CACHE_MODULES', false)`; `modules/tests/TestsUI.php:38` `set_time_limit(300)`, `:42` `error_reporting(E_ALL)`, `:43-46` `require_once('lib/simpletest/…')`, `:65` `_authenticationRequired = true`, `:79` `handleRequest()` with no access-level check; `modules/tests/testcases/WebTests.php:29` `addUser(…)`, `:203` `deleteUser`; `config.php:188-193` `TESTER_LOGIN` `john@mycompany.net`. `test/data/test.sql:1256` registers module `tests` in `module_schema`.
- **Impact:** Unneeded authenticated attack surface with side effects on production data, and dead weight for PHP upgrades. A crashed run can leave a known-password user behind (INFERENCE from the teardown order).
- **Severity:** MEDIUM — authenticated-only reach, real side effects.
- **Recommendation:** Remove the in-app test runner and SimpleTest from the shipped product; keep the one helper CI uses (`modules/tests/waitForDb.php`) under `test/`.
- **Unknown / needs further validation:** What `m=tests` does on a default install where the tester account does not exist (not exercised in the baseline).

## 4. Toolchain and tooling

### TEST-002 — Test toolchain is locked to PHP 7.x / PHPUnit 7.5 and cannot run on PHP 8
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-005, TEST-003, DEBT-001*

- **Confirmed fact:** 27 of the 64 locked dev packages declare PHP constraints that exclude PHP 8, so the lock cannot install on PHP 8. The test code uses PHPUnit 7-only constructs. The Behat context includes application code that does not parse on PHP 8. On PHP 7.2 the toolchain works (CI run).
- **Evidence:**
  - `php -r` over `composer.lock`: 2 runtime + 64 dev packages; 27 dev packages with `^5.x`/`^7.x`-only PHP constraints (e.g. `phpunit/phpunit 7.5.7` `^7.1`, `doctrine/instantiator 1.1.0` `^7.1`, `symfony/browser-kit v4.2.4` `^7.1.3`).
  - Test code: `setUp()` without `: void` at `UnitTests/AddressParserTest.php:77`, `UnitTests/CompanyTest.php:23,28`, `IntegrationTests/DatabaseTestCase.php:10,95`; `@expectedException` at `UnitTests/CompanyRepositoryTest.php:95`; `withConsecutive` at `:38,53,87`; `setMethods` at `:115`; `assertRegExp` at `UnitTests/VCardTest.php:34,94`; class `CompanyRepositoryTests` in `CompanyRepositoryTest.php:14`; dynamic property `$this->company` at `CompanyTest.php:25`.
  - Behat: `test/features/bootstrap/FeatureContext.php:21` includes `lib/Users.php`, which includes `lib/License.php` → `lib/CATSUtility.php`, which fails to parse on PHP 8 (line 108).
  - Phase 0 measurements on PHP 8.4 (scratch copy, not re-run): `composer install` "Your lock file does not contain a compatible set of packages" (28 problems); PHPUnit 7.5.7 `Tests: 88, Assertions: 631, Errors: 3, Failures: 1` (mock generator uses the reserved word `match`); PHPUnit 9.6 fatal `Declaration of AddressParserTest::setUp() must be compatible …: void`; Behat dry-run `PHP Parse error … lib/CATSUtility.php on line 108`; Symfony YAML 7 rejects `%paths.base%` and unquoted `@core` in `test/behat.yml:4,8,14`.
  - CI log: `composer audit` reports CVE-2026-24765 (high) for `phpunit/phpunit` 7.5.7 (affected `<8.5.52`).
- **Impact:** The existing suite cannot validate a PHP 8 move, which is when it would be needed most. PHPUnit 7 is out of support (external knowledge).
- **Severity:** HIGH — major barrier to modernization.
- **Recommendation:** Make the tests compatible with a PHPUnit line that runs on both PHP 7.2 and 8.x, and fix the YAML syntax in `test/behat.yml`, so one suite can run on both runtimes during a transition.
- **Unknown / needs further validation:** Full PHP 8 results of the integration and Behat suites (blocked until the application parses on PHP 8).

### TEST-010 — No static analysis, PHP-compatibility or coding-standard tooling
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-018, DEBT-020*

- **Confirmed fact:** The repository has no PHPStan, Psalm, PHP_CodeSniffer/PHPCompatibility, php-cs-fixer, Rector or EditorConfig configuration, and CI has no such step. The README carries a Codacy badge; whether Codacy analysis still runs is unknown.
- **Evidence:** `find . -path ./docs -prune -o \( -name 'phpstan*' -o -name 'psalm*' -o -name 'phpcs*' -o -name '.php-cs-fixer*' -o -name 'rector.php' -o -name '.editorconfig' -o -name 'package.json' \) -print` → nothing; `ci.yml` steps (checkout, setup-php, cache, install, lint `src/`, audit, phpunit, docker tests, report, screenshots, shutdown, release); `README.md:2` Codacy badge.
- **Impact:** PHP 8 blockers, undefined methods (RT-03 `Users::getPassword()`), undefined constants (RT-05) and removed functions (RT-01 `mysql_real_escape_string`) are found only by manual audit or at runtime.
- **Severity:** MEDIUM — notable maintainability cost; several baseline fatals are of a kind static analysis reports.
- **Recommendation:** Add a static analyser with a baseline and a PHP-compatibility check in CI, failing only on new findings.
- **Unknown / needs further validation:** Whether Codacy is still connected (needs the Codacy project settings).

## 5. Reference

### 5.1 Inventory of test assets

| Asset | Location | Size | Runs in CI? | Notes |
|---|---|---|---|---|
| PHPUnit unit tests | `src/OpenCATS/Tests/UnitTests/` (12 files) | 88 test methods, 634 assertions (CI) | yes, host PHP 7.2.34 | utilities and entity getters only (§5.3) |
| PHPUnit integration tests | `src/OpenCATS/Tests/IntegrationTests/` (3 files) | 9 tests, 60 assertions (CI) | yes, in the PHP 7.2 container | DB escaping helpers, boolean search parser; 1 placeholder |
| Behat `@core` (suite `default`) | `test/features/{login,activities,candidate-filters,customize-extra-fields,job-orders}.feature` | 27 scenarios, 431 steps | yes | 20 `@javascript` scenarios via Selenium 2.53.1 |
| Behat `@security` | `test/features/{moduleMainPages,moduleSubPages,GET_POST_requests}Security.feature` | 26 outlines → 1,296 scenarios (80 + 40 + 1,176 rows), 5,528 steps | yes | access-level gate only (TEST-004) |
| Behat contexts | `test/features/bootstrap/FeatureContext.php` (456 lines), `SecurityContext.php` (239) | — | yes | wsend.net upload (TEST-008) |
| Behat config | `test/behat.yml` (24 lines) | 2 suites | yes | base URL `http://opencats`, Selenium at `selenium:4444` |
| Fixtures | `test/data/test.sql` (1,770 lines: 55-table DDL + reference data + `admin`), `test/data/securityTests.sql` (128 lines: sample records + 8 `tester*` users) | — | yes (DB init) | drift from production schema (TEST-007) |
| Test config | `test/config.php` (284 lines) | — | yes (copied over `config.php`) | fork of `config.php` |
| Runner scripts | `test/runAllTests.sh` (8 lines), `test/scripts/securityTestData.sh` | — | no (Travis only) | no `set -e` |
| In-app SimpleTest | `modules/tests/` (TestsUI, 6 web-test and 12 AJAX-test classes), `lib/simpletest/` 1.1.0 | 5 AJAX classes with 0 assertions | no | ships in production (TEST-009) |
| CI | `.github/workflows/ci.yml` (128 lines) | jobs `tests`, `release` | — | see §5.2 |
| Inactive CI | `.travis.yml`, `ci/package-code.sh`, `.github/workflow/*.yml` | — | no | TEST-014 |
| Support tooling (not product) | `.github/workflows/preview.yml`, `docs/baseline/preview/`, `docs/baseline/env/`, `docs/baseline/smoke/` | — | preview only on `claude/**` pushes | audit tooling; see §5.4 |

### 5.2 What the "Tests (PHP 7.2)" check runs

Source: `.github/workflows/ci.yml` and the CI job log for PR #1 (2026-09-26).

| # | Step (`ci.yml` line) | What it does | Result in the run | Can it fail the job? |
|---|---|---|---|---|
| 1 | Checkout (`:24-25`) | PR merge commit | `4bc300f` = `f9f4978` merged into `d607279` | yes |
| 2 | Setup PHP (`:27-31`) | host PHP from `setup-php`, Composer 2 | PHP 7.2.34, Composer 2.10.3, `ini-file: production` | yes |
| 3 | Install (`:40-41`) | `composer install --prefer-dist` incl. dev | 66 packages | yes |
| 4 | Lint (`:43-44`) | `php -l` on `src/**/*.php` only | 24 files clean | yes, but only for `src/` |
| 5 | Audit (`:46-48`) | `composer audit \|\| true` | 22 advisories in 8 packages | **no** |
| 6 | Unit tests (`:53-54`) | PHPUnit 7.5.7 on host PHP 7.2 | 88 tests OK | yes |
| 7 | Docker step (`:56-82`) | copies `test/config.php` over `config.php`; starts `docker-compose-test.yml` (`opencats/php-base:7.2-fpm-alpine`, `prooph/nginx:www`, `mariadb:10.7` ×2, Selenium 2.53.1); integration tests; Behat default; Behat security | 9 OK; 27 passed; 1,296 passed | yes (`bash -e`); a default-suite failure skips the security suite |
| 8 | Publish report (`:84-92`) | JUnit from `reports/**/*.xml` | 97 tests (PHPUnit only) | no (`fail_on_failure: false`) |
| 9 | Screenshots (`:94-100`) | upload `test/screenshots/` on failure | not triggered | — (path never written, TEST-005) |
| 10 | Release job (`:106-128`) | tags `v*` only: zip the checkout without `vendor/` | not triggered | — (see DEP-004) |

**A green check proves:** the 24 `src/` files parse on PHP 7.2; the locked dev toolchain installs on PHP 7.2; 88 utility/entity unit tests and 9 DB-helper integration tests pass; the 27 core Behat scenarios (login, job-order CRUD from the UI, candidate filters, one activity, extra-field settings) pass in Chrome via Selenium; the 1,296 access-gate scenarios do not show a denial string where one is not expected (and vice versa).

**A green check does not prove:** that anything outside `src/` parses on any PHP version other than 7.2 (and nothing in it parses on PHP 8 — TEST-003); that pages render without PHP warnings or fatals (TEST-015); that e-mail, careers apply, uploads, resume indexing, RSS, PDF reports or the rich-text editor work (RT-03…RT-12); that object-level or cross-site authorization holds (TEST-004); that runtime dependencies are free of known advisories (step 5 never fails); that a tagged release archive runs (DEP-004).

### 5.3 Coverage estimate (static; line coverage not measured)

| Area (key files) | Tests present | Level |
|---|---|---|
| String/Date/Array/File/ResultSet/Browser/VCard/AddressParser helpers | PHPUnit unit | partial (utilities only) |
| DB escaping and boolean search (`lib/DatabaseConnection.php`, `lib/DatabaseSearch.php`) | PHPUnit integration | partial (about 7 of 31 and 1 of 8 methods, Phase 0 count) |
| `src/OpenCATS/Entity/*` | PHPUnit unit | partial (Company/JobOrder accessors, CompanyRepository persist; JobOrderRepository none) |
| Login, session, LDAP (`lib/Session.php`, `lib/LDAP.php`, `modules/login`) | Behat `login.feature` (7) | minimal; LDAP and forgot-password none (RT-03 untested) |
| Access control (`lib/ACL.php`, `UserInterface`) | Behat security suite | partial: module/action gate only |
| Candidates, pipelines, job orders | Behat (filters, 1 activity, 14 job-order scenarios) | minimal to partial (UI happy paths) |
| Companies, contacts, calendar, lists | access matrix only | minimal |
| Careers portal (public) | none | none (RT-12, RT-16 untested) |
| Attachments, uploads, resume text extraction | none | none (RT-08, RT-17 untested) |
| AJAX endpoints (21 `ajax/*.php` + 11 `modules/*/ajax/*.php`) | none (`GET_POST_requestsSecurity.feature:1330`) | none |
| Import/export, reports, graphs, PDF | access matrix only | none functional (RT-09 untested) |
| E-mail (`lib/Mailer.php`, templates) | none | none (RT-04 untested) |
| XML/RSS feeds, toolbar, queue | none | none (RT-05 untested) |
| Install/upgrade and migrations (`modules/install/Schema.php`) | integration tests load `db/cats_schema.sql` only | none for migrations (RT-01 untested) |
| JavaScript | none | none (RT-07, RT-10 untested) |

Counts behind the table: 293 `case '…'` action labels in the 23 `modules/*/*UI.php` controllers (`grep -cE "^\s*case '"`), of which the security suite requests 127 unique `m=…&a=…` URLs; 0 controller unit tests.

### 5.4 What the Phase 0.5 baseline added (support tooling, not a product test suite)

- **Runnable environment.** `docs/baseline/env/baseline-up.sh` starts the unmodified app on PHP 7.2.16 / nginx 1.17.3 / MariaDB 10.7.8 with the committed `config.php` and an empty-database install (`INSTALLATION.md` §1). It is environment-only tooling and is not wired into CI.
- **Browser smoke harness.** `docs/baseline/smoke/smoke.js` (558 lines, Playwright + Chromium) drives 94 steps across 15 feature areas and records, per step, PASS/FAIL, PHP error text found in every frame, JS errors, console errors, failed requests, HTTP ≥ 400 and a screenshot (`smoke.js:54-78`). `supplement.js` adds 6 captures; `crawl.js` lists links. Synthetic fixtures are in `docs/baseline/smoke/fixtures/`.
- **What it showed that CI does not:** 8 of 15 areas work without errors; RT-03, RT-04, RT-05, RT-06, RT-07, RT-08, RT-11, RT-12 on the same code on which CI is green (TEST-015).
- **Limits:** it is characterization evidence, not a regression suite. It needs a freshly installed database and a fixed base URL (`smoke.js:7` `http://localhost:8080/`), records outcomes instead of failing the process, used only the administrator account, and did not cover real mail delivery, LDAP, import, backup, questionnaires or multi-user permissions (`SMOKE_TEST.md` §4).

### 5.5 Test data (fixtures)

| Source | Content | Notes |
|---|---|---|
| `test/data/test.sql` (loaded by `docker-compose-test.yml:38` and the dev compose `:36`) | full DDL for 55 tables; reference data (access levels, activity types, pipeline statuses, e-mail templates, EEO types, career-portal templates, XML feeds, settings); sites `1` (`testdomain.com`) and `180` (`CATS_ADMIN`); user `admin` (MD5 of `admin`, level 500, `:1618`); `module_schema` with `install` at 364 (`:1256`) | DDL drifts from `db/cats_schema.sql` (TEST-007) |
| `test/data/securityTests.sql` (`docker-compose-test.yml:39`) | 8 users `testerDisabled` … `testerRoot` (ids 2001–2008, levels 0–500, password MD5 of `tester`); companies "Internal Postings" and "Google"; contact "Elizabeth Blue"; candidate 20000 "Pipin Tuk"; job order 1 "OpenCATS Tester" (London); one pipeline row; list "UK Candidates"; 2 activities; 3 attachment rows | all business records are in site 1, so cross-site isolation cannot be exercised; attachment rows have no files behind them (`git ls-files attachments` lists only `.htaccess` and `index.php`) |
| `db/cats_schema.sql` (integration tests) | production schema with its seed rows | recreated per test class by `DatabaseTestCase` |
| `docs/baseline/smoke/fixtures/` (support tooling) | synthetic TXT/PDF/DOCX resumes with unique keywords | used only by the baseline harness |

Nothing in the repository resets the Behat database between features or suites, and nothing seeds a second tenant.

### 5.6 PHP 8 readiness of the test toolchain (Phase 0 measurements on PHP 8.4, not re-run)

| Check | Result | Cause (file:line) |
|---|---|---|
| `composer install` from the lock | fails: 28 problems, 27 dev packages exclude PHP 8 | `composer.lock` PHP constraints (TEST-002) |
| `composer install --no-dev` | installs (ckeditor 4.25.1, phpmailer v6.8.0) | runtime packages have no PHP 8 blocker |
| PHPUnit 7.5.7, platform checks bypassed | 88 tests, 631 assertions, 3 errors, 1 failure | PHPUnit 7 mock generator emits the reserved word `match`; all in `CompanyRepositoryTest.php` |
| PHPUnit 9.6, unmodified tests | fatal at load | `setUp()` without `: void` (`AddressParserTest.php:77`) |
| PHPUnit 9.6, `: void` patched copy | 88 tests, 16 errors, 2 warnings | dynamic property `CompanyTest.php:25` (×14); `@expectedException` ignored (`CompanyRepositoryTest.php:95`); `strftime()` deprecated in **application** code (`lib/DateUtility.php:148`) |
| Behat dry-run | parse error | `lib/CATSUtility.php:108` via `FeatureContext.php:21` |
| `test/behat.yml` with Symfony YAML 7 | parse exception | `%paths.base%` unquoted (`:4`), `@core`/`@security` unquoted (`:8,14`) |
| `php -l` on all tracked PHP (re-run in this edition) | 6 parse errors, 5 unintended | see TEST-003 |

## Area-level unknowns

1. **Real line and branch coverage.** Needs a PHP 7.2 container with pcov or xdebug and a run of the current suites.
2. **Merge protection.** Whether "Tests (PHP 7.2)" is a required check on `master`/`develop`; needs the repository's branch-protection settings.
3. **Error pages inside passing Behat runs.** Which security scenarios landed on warning or fatal pages; needs a Behat run that records status codes and scans for PHP error text.
4. **PHP 8 behaviour of the integration and Behat suites.** Blocked until the application parses on PHP 8; the Phase 0 PHP 8.4 measurements covered only unit tests and a Behat dry-run.
5. **Order dependence.** Whether scenarios depend on state from earlier scenarios; needs a run in random order or with a DB reset per feature.
6. **Codacy.** Whether the badge reflects an active analysis; needs the Codacy project.
7. **wsend.net.** Whether screenshots have ever been uploaded from a developer machine; not knowable from the repo.

## Changes from the Phase 0 edition

- **New:** TEST-015 (green CI check vs. baseline defects; Runtime, HIGH).
- **Re-rated:** TEST-012 LOW → MEDIUM (RT-05 shows a public feed broken without any test noticing).
- **Confirmation upgrades from execution evidence:** TEST-003 → Runtime (CI log shows PHP 7.2.34 and the 24-file lint, and confirms that `JobOrderRepositoryException.php` lints clean on PHP 7.2, which Phase 0 had only inferred); TEST-005 → Runtime (CI log shows the ignored audit and the JUnit report limited to 97 PHPUnit tests).
- **Corrected claims:** TEST-005 — test failures do fail the job (`bash -e`); `fail_on_failure: false` affects only the extra check-run, and a default-suite failure skips the security suite rather than being silent. TEST-014 — `runAllTests.sh` line references corrected to `:3` (dockerize) and `:4` (`waitForDb.php`); Phase 0 cited `:27-28` of an 8-line file. TEST-011 — JS line count re-measured as 11,546 lines in 38 `js/` files (Phase 0: 11,181 in 37). TEST-009 — `ModuleUtility.php` citations tightened to `:154` and `:262`.
- **Resolved Phase 0 unknowns:** "Whether CI currently passes" — it passes (2026-09-26 run); "Selenium 2.53 still works" — it did in that run.
- **Removed:** the Phase 0 §5 "Recommended test strategy" (target CI gates, fixture strategy, sequencing). It was forward-looking and is out of scope for this findings-only edition; each finding keeps its own short recommendation.
- **Withdrawn or merged:** none.
