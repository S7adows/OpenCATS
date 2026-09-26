# OpenCATS — Testing & Quality-Assurance Audit

**Scope.** This audit covers every automated test asset and quality gate in the repository: PHPUnit unit and integration tests (`src/OpenCATS/Tests/**`), the Behat/Mink acceptance and security suites (`test/**`), the legacy SimpleTest in-app test runner (`modules/tests/**`, `lib/simpletest/**`), CI definitions (`.github/workflows/ci.yml`, `.travis.yml`, `.github/workflow/*.yml`, `ci/package-code.sh`), test data and configuration (`test/data/*.sql`, `test/config.php`, `docker/docker-compose-test.yml`), and `README-testing.md`. It estimates what the tests exercise compared with the size of `lib/`, `modules/` and `src/`. It also runs the test toolchain in an isolated copy to measure how ready it is for PHP 8. The document ends with a test strategy for the planned modernization, tied to specific files.

---

## Method

All inspection was read-only against `/home/user/OpenCATS`. Anything that executed code ran in a scratch copy (`$SCRATCH/oc-copy`, made with `tar --exclude=./.git`). Nothing was written to the repository apart from this document.

| Step | Command / action | Result |
|---|---|---|
| Inventory | `find src test ci .github -type f`, `wc -l`, `grep -c 'function test'`, `grep -c assert` per file | see §1 |
| Config search | `find . \( -name 'phpunit*.xml*' -o -name 'phpstan*' -o -name 'psalm*' -o -name '.php_cs*' -o -name 'phpcs*' -o -name 'package.json' -o -name '.eslintrc*' \)` | **no matches** (no phpunit.xml, no static-analysis, no JS tooling) |
| Dependency install (PHP 8.4.19, Composer 2.8.12) | `composer install` in the copy | **fails**: 28 problems, 27 locked packages require PHP `^7.x`/`^5.x` (log: `$SCRATCH/notes/composer-install-plain.txt`) |
| Runtime-only install | `composer install --no-dev` | OK (ckeditor 4.25.1, phpmailer v6.8.0) |
| Forced dev install | `composer install --ignore-platform-reqs` (**LABELLED: platform checks bypassed**) | OK |
| Unit tests, locked PHPUnit 7.5.7 on PHP 8.4 | `php vendor/bin/phpunit src/OpenCATS/Tests/UnitTests` | 88 tests, 631 assertions, **3 errors, 1 failure** (log: `notes/phpunit75-php84.txt`) |
| Same, with `-d error_reporting=-1` | — | PHPUnit 7.5 itself aborts on its own PHP 8.4 deprecations (`notes/phpunit75-php84-allerrors.txt`) |
| Unit tests, PHPUnit 9.6.37 (installed separately in `$SCRATCH/pu9`) on PHP 8.4, **unmodified tests** | `phpunit --bootstrap … src/OpenCATS/Tests/UnitTests` | **Fatal**: `Declaration of AddressParserTest::setUp() must be compatible with PHPUnit\Framework\TestCase::setUp(): void` |
| Unit tests, PHPUnit 9.6 on a **mechanically patched copy** (only `setUp()/tearDown()` gained `: void`), deprecations→exceptions | `phpunit -c phpunit-legacy.xml $SCRATCH/pu9-tests/UnitTests` | 88 tests, 613 assertions, **16 errors, 2 warnings** (`notes/phpunit96-php84-patched.txt`) |
| Behat on PHP 8.4 | `vendor/bin/behat -c test/behat.yml --suite=default --dry-run` | **Fatal**: `PHP Parse error: syntax error, unexpected token "{" in lib/CATSUtility.php on line 108` |
| behat.yml with modern Symfony YAML 7 | `Yaml::parseFile('test/behat.yml')` | `ParseException: The reserved indicator "%" cannot start a plain scalar … at line 4` |
| PHP 8 lint signal | `php -d error_reporting=-1 -l` on all 355 `*.php` + 136 `*.tpl` outside `vendor/` | 6 parse errors, 23 distinct compile-time deprecations in 8 files (`notes/lint-php84-mine.txt`) |
| Integration tests / Behat execution | needs MariaDB + Selenium containers | **not run**: `docker info` → `failed to connect to the docker API at unix:///var/run/docker.sock`; no `mysqld` binary available |
| Coverage | `php -m` shows neither xdebug nor pcov | **numeric line coverage was NOT measured**; §3 is a static estimate |
| Static analysis attempt | `composer require --dev phpstan/phpstan` in scratch | failed: `Could not authenticate against github.com` (proxy); not run |

---

## Summary of Findings

| ID | Title | Severity |
|---|---|---|
| TEST-001 | Near-zero automated coverage of domain logic; tests exercise utility helpers only | HIGH |
| TEST-002 | Test toolchain is frozen on PHP 7.2 / PHPUnit 7.5 and cannot run on PHP 8 (measured) | HIGH |
| TEST-003 | CI tests only PHP 7.2 and lints only `src/`, so PHP 8 fatal errors in `lib/` are invisible | HIGH |
| TEST-004 | Security suite checks only the module/action access-level gate; its assertions can pass falsely; AJAX, careers, uploads and object-level access are untested | HIGH |
| TEST-005 | CI quality gates are soft or broken (audit `\|\| true`, report `fail_on_failure: false`, Behat not reported, screenshot artifact always empty) | MEDIUM |
| TEST-006 | Vacuous, placeholder and disabled tests report green | MEDIUM |
| TEST-007 | Test schema and config drift from production; no DB isolation between Behat scenarios | MEDIUM |
| TEST-008 | Behat context uploads failure screenshots to a third-party anonymous file host (wsend.net) | MEDIUM |
| TEST-009 | Legacy SimpleTest runner ships as a production module (`m=tests`) and loads during module discovery | MEDIUM |
| TEST-010 | No static analysis, PHP-compatibility or coding-standard tooling | MEDIUM |
| TEST-011 | No JavaScript tests or lint for about 15.9k lines of first-party JS | MEDIUM |
| TEST-012 | No contract, performance, SAST or DAST testing | LOW |
| TEST-013 | No `phpunit.xml`; tests depend on the working directory and hard-coded Docker hostnames; `die()` inside the test base class | LOW |
| TEST-014 | Obsolete or inactive CI definitions (`.travis.yml`, `.github/workflow/`) are misleading | LOW |

---

## 1. Inventory of test assets (FACT)

### 1.1 PHPUnit unit tests — `src/OpenCATS/Tests/UnitTests/` (12 files)

| File | Test methods | `assert*`/`expects` call sites | Subject under test | Notes |
|---|---|---|---|---|
| `AJAXInterfaceTest.php` | 2 | 15 | `lib/AJAXInterface.php` `isRequiredIDValid`, `isOptionalIDValid` | contains a vacuous loop, see TEST-006 |
| `AddressParserTest.php` | 18 | 237 | `lib/AddressParser.php` `parse`, `getAddressArray` | 15 person and 3 company samples |
| `ArrayUtilityTest.php` | 1 | 9 | `ArrayUtility::implodeRange` | |
| `BrowserDetectionTest.php` | 1 | 1 (in a 25-case loop) | `BrowserDetection::detect` | user agents from 2006–07 (Firefox 2, IE7, AOL) |
| `CompanyRepositoryTest.php` | 4 | 4 mock expectations | `src/OpenCATS/Entity/CompanyRepository::persist` | class is named `CompanyRepositoryTests` (`:14`); uses `@expectedException` (`:95`), `withConsecutive` (`:38,53,87`), `setMethods` (`:115`) |
| `CompanyTest.php` | 14 | 15 | `OpenCATS\Entity\Company` getters/setters | dynamic property `$this->company` (`:25`) |
| `DateUtilityTest.php` | 5 | 23 | `DateUtility` `getStartingWeekday`, `getDaysInMonth`, `getMonthName`, `validate`, `convert` | |
| `FileUtilityTest.php` | 2 | 15 | `FileUtility::sizeToHuman`, `getUniqueDirectory` | uses relative dir `attachments` |
| `JobOrderTest.php` | 23 | 23 | `OpenCATS\Entity\JobOrder` getters | pure data-holder tests |
| `ResultSetUtilityTest.php` | 1 | 17 | `findRowByColumnValue(Strict)` | |
| `StringUtilityTest.php` | 14 active + 1 disabled | 46 | 15 `StringUtility` helpers | `disabledtestIsCityStateZip` (`:409`) |
| `VCardTest.php` | 3 | 26 | `lib/VCard.php` | `assertRegExp` (`:34,94`) |
| **Total** | **88** | 631 executed assertions (PHPUnit 7.5 run) | | |

### 1.2 PHPUnit integration tests — `src/OpenCATS/Tests/IntegrationTests/` (3 files)

| File | Tests | What it does |
|---|---|---|
| `DatabaseTestCase.php` | base class | `setUp()` (`:10`) connects to host `'integrationtestdb'` with `'dev'/'dev'` (`:31-35`), drops and recreates `cats_integrationtest`, and loads `db/cats_schema.sql` (`:48`). A failed statement calls `die(...)` (`:84`). |
| `DatabaseConnectionTest.php` | 7 | `makeQueryString`, `escapeString`, `makeQueryStringOrNULL`, `makeQueryInteger(OrNULL)`, `makeQueryDouble`, plus a CRUD smoke test on table `installtest` (`:158`) |
| `DatabaseSearchTest.php` | 2 | `testMakeREGEXPString` is a placeholder (`:17-20`, `assertTrue(true, 'Placeholder for future REGEXP test')`); `testMakeBooleanSQLWhere` checks 12 boolean-query cases that produce MySQL `[[:<:]]` word-boundary regex |

### 1.3 Behat/Mink acceptance tests — `test/`

`test/behat.yml` defines two suites that share `features/`. Suite `default` uses context `FeatureContext` and tag `@core` (`:3-8`). Suite `security` uses `SecurityContext` and tag `@security` (`:9-14`). Mink runs against `base_url: http://opencats` with the Goutte and Selenium2 drivers (`wd_host: 'http://selenium:4444/wd/hub'`, `:15-21`).

| Feature file | Tag | Scenarios | Example rows | Modules / actions exercised |
|---|---|---|---|---|
| `login.feature` | @core | 7 | – | login form, invalid credentials, logout, spoofed cookie |
| `activities.feature` | @core | 1 (@javascript) | – | candidates → Log an Activity → activity list |
| `candidate-filters.feature` | @core | 4 (@javascript) | – | candidates DataGrid filter UI |
| `customize-extra-fields.feature` | @core | 1 (@javascript) | – | `settings&a=customizeExtraFields` |
| `job-orders.feature` | @core | 14 (@javascript) | – | add, edit, search, delete job order; add candidate to pipeline from modal |
| `moduleMainPagesSecurity.feature` | @security | 10 outlines | 80 | 10 module landing pages × 8 access levels, checks for visible text |
| `moduleSubPagesSecurity.feature` | @security | 6 outlines | 40 | `show` pages for joborders, candidates, companies, contacts, lists |
| `GET_POST_requestsSecurity.feature` | @security @actions | 10 outlines | 1,176 | 127 unique `m=…&a=…` URLs across candidates, joborders, companies, contacts, activity, home, lists, calendar, reports, settings. Line `:1330` says `#### AJAX not tested`. |

Contexts: `test/features/bootstrap/FeatureContext.php` (456 lines) and `SecurityContext.php` (239 lines). Fixtures: `test/data/test.sql` (1,770 lines: full DDL for all 55 tables plus seed data) and `test/data/securityTests.sql` (8 users `tester*` with access levels 0–500, password MD5 `f5d1278e…` = `md5('tester')`). The runner is `test/runAllTests.sh` (`#!/bin/sh -x`, no `set -e`, so a failing phpunit or behat step does not change the script's exit status except for the last command).

### 1.4 Legacy in-app SimpleTest harness — `modules/tests/`

`modules/tests/TestsUI.php` is a normal application module. It requires `lib/simpletest/{web_tester,unit_tester,reporter,form}.php` (`:43-46`, SimpleTest `lib/simpletest/VERSION` = `1.1.0`, LGPL-2.1). It runs 6 web-test classes from `testcases/WebTests.php` (Candidates, Companies, Contacts, Reports, Calendar, Settings; 30–79 assertions each) and 12 AJAX test classes from `testcases/AJAXTests.php`. Five of the AJAX classes have **zero assertions**: `GetCompanyNamesTest`, `GetPipelineJobOrderTest`, `SetCandidateJobOrderRatingTest`, `TestEmailSettingsTest`, and `ZipLookupTest` (empty body, `AJAXTests.php:920-925`). CI does not invoke this harness, although `test/runAllTests.sh:28` uses its helper `modules/tests/waitForDb.php`.

### 1.5 CI definitions

| File | What runs | Key facts |
|---|---|---|
| `.github/workflows/ci.yml` | job `tests` on `ubuntu-latest`, matrix `php-version: ['7.2']` (`:21`) | `composer install` (`:41`); **lint only `src/`**: `find src -name "*.php" … php -l` (`:44`); `composer audit \|\| true` (`:48`, comment "so legacy vulnerabilities don't block the build"); unit tests (`:54`); Docker stack, integration tests, Behat default and security suites in one step (`:56-82`, `# continue-on-error: true` left commented at `:82`); JUnit publish with `fail_on_failure: false` (`:92`); screenshot upload from `test/screenshots/` (`:94-100`); release job zips the checkout (`:117-128`) |
| `.travis.yml` | PHP 7.2 / 8.0 / 8.2 (`:17-20`), unit tests (`:24`), `runAllTests.sh` in Docker (`:26`), package and deploy | legacy; cannot install on 8.x with this lock (see TEST-002) |
| `.github/workflow/needs-reply*.yml` | issue housekeeping | in the singular directory `workflow/`, so GitHub never runs them (external knowledge: only `.github/workflows/` is read) |
| `ci/package-code.sh` | `composer install --no-dev` then tar/zip for Travis tags | Travis only |

---

## 2. Execution results (PHP 8 readiness signal)

### 2.1 Composer on PHP 8.4 (FACT, measured)
`composer install` from the lock fails before anything installs: *"Your lock file does not contain a compatible set of packages."* It reports 28 problems. 27 locked dev packages declare PHP constraints that exclude PHP 8, for example `phpunit/phpunit 7.5.7 requires php ^7.1`, `doctrine/instantiator 1.1.0 requires php ^7.1`, `symfony/browser-kit v4.2.4 requires php ^7.1.3`, and `gitonomy/gitlib v1.0.4 requires php ^5.3 || ^7.0`. Problem 28 is `fabpot/goutte` failing transitively. The runtime-only set (`--no-dev`) installs cleanly.

### 2.2 PHPUnit 7.5.7 (locked) on PHP 8.4 — platform checks bypassed (FACT, measured)
```
Tests: 88, Assertions: 631, Errors: 3, Failures: 1.
1) OpenCATS\Tests\UnitTests\CompanyRepositoryTests::test_persist_CreatesNewCompany_InputValuesAreEscaped
ParseError: syntax error, unexpected token "match", expecting variable
```
All four problems are in `CompanyRepositoryTest.php`. PHPUnit 7's mock generator emits code that uses `match`, which became a reserved keyword in PHP 8.0. The other 84 tests pass only because Debian's CLI `error_reporting` (22527) hides `E_DEPRECATED`. With `-d error_reporting=-1`, PHPUnit 7.5 crashes on its own deprecations (`Implicitly marking parameter … as nullable`, `Constant E_STRICT is deprecated`).

### 2.3 PHPUnit 9.6.37 on PHP 8.4 (FACT, measured)
- Unmodified tests: fatal at load, `Declaration of AddressParserTest::setUp() must be compatible with PHPUnit\Framework\TestCase::setUp(): void` (`AddressParserTest.php:77`; the same pattern appears in `CompanyTest.php:23,28` and `DatabaseTestCase.php:10,95`).
- Scratch copy patched only for `: void`, with deprecations converted to exceptions: `Tests: 88, Assertions: 613, Errors: 16, Warnings: 2`:
  - 14 × `Creation of dynamic property CompanyTest::$company is deprecated` (`CompanyTest.php:25`, deprecated since PHP 8.2)
  - 1 × `CompanyRepositoryTests::test_persist_FailToCreateNewCompany_ThrowsException` because `@expectedException` (`CompanyRepositoryTest.php:95`) is ignored by PHPUnit 9
  - 1 × **application code**: `Function strftime() is deprecated since 8.1` at `lib/DateUtility.php:148`
  - Warnings: `assertRegExp() is deprecated` (`VCardTest.php:34,94`); `Test case class not matching filename is deprecated … Class name was 'CompanyRepositoryTests'`

### 2.4 Behat on PHP 8.4 (FACT, measured)
`behat --dry-run` fails with `PHP Parse error: syntax error, unexpected token "{" in lib/CATSUtility.php on line 108`. The include chain is `test/features/bootstrap/FeatureContext.php:21` (`lib/Users.php`) → `lib/Users.php:33` (`lib/License.php`) → `lib/License.php:33` (`lib/CATSUtility.php`). Separately, `test/behat.yml:4` (`paths: [ %paths.base%/features ]`) and the unquoted `@core`/`@security` tags (`:8,14`) are rejected by Symfony YAML 7. Every maintained Behat 3.x release uses a Symfony YAML version that rejects them (external knowledge on Behat's dependency range).

### 2.5 `php -l` (PHP 8.4) over 491 first-party and bundled files (FACT, measured)
| File:line | Error |
|---|---|
| `lib/CATSUtility.php:108` | `$data{0}`: string offset with curly braces (removed in PHP 8.0). Included by `index.php:61`, `ajax.php:43`, `careers/index.php:38`, `rss/index.php:37`, `xml/index.php:38`, `QueueCLI.php:40` |
| `lib/artichow/AntiSpam.class.php:63` | `$letters{…}`; included by `lib/GraphGenerator.php:43` |
| `lib/fpdf/fpdf.php:434` | `$s{$i}`; included by `modules/reports/ReportsUI.php:414` |
| `lib/fpdf/font/makefont/makefont.php:18` | `$l{0}` (utility script) |
| `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` | `namespace \OpenCATS\Entity;`, a leading backslash in the namespace declaration |
| `lib/simpletest/test/test_with_parse_error.php:5` | intentional SimpleTest fixture |

Compile-time deprecations ("optional parameter declared before required") appear in `lib/ActivityEntries.php:162`, `lib/DatabaseConnection.php:262`, `lib/Profile.php` (11 methods, e.g. `:448,488,529,569,676,734,806,950,989,1081,1131`), `lib/Tags.php:112`, three Artichow classes, and `${var}` interpolation in `lib/simpletest/mock_objects.php:704`. All 136 `.tpl` templates lint clean.

Runtime-removed APIs that lint cannot see: `get_magic_quotes_runtime()` / `get_magic_quotes_gpc()` (removed in 8.0) at `index.php:93,99`, `ajax.php:50,56`, `QueueCLI.php:59,65`, `lib/InstallationTests.php:185`, `lib/Attachments.php:944`, `modules/import/ImportUI.php:495`. `strftime()` (deprecated in 8.1) at `lib/DateUtility.php:148,472,476,480` and `lib/Calendar.php:575`.

---

## 3. Coverage estimate (static; numeric coverage NOT measured)

No coverage driver (xdebug/pcov) is installed. The repository has no coverage configuration, and `codacy/coverage` is installed but never invoked (`grep -rn codacy` finds only `composer.json:10` and a README badge). The figures below come from `grep` and count *references*, not executed lines.

| Metric | Value |
|---|---|
| `lib/*.php` (first-party, top level) | 81 files, 108 classes, ~1,106 functions/methods, 46,703 lines |
| `modules/**/*.php` | 66 files, 66 classes, ~460 functions, 31,118 lines, **293 `case '…'` action labels** in `*UI.php` switch statements |
| `src/OpenCATS` (excluding tests) | 9 files, 87 functions |
| First-party JS | 11,181 lines in 37 `js/*.js` files (excluding jQuery), plus 4,732 lines in 18 `modules/**/*.js` files |
| Distinct `lib` class::method pairs referenced by PHPUnit tests | **49 of ~1,106 (≈4.4 %)** in 11 of 81 `lib` files (plus `History` mocked only) |
| `modules/*UI.php` classes with any unit test | **0 of 66** |
| `src/OpenCATS/Entity/JobOrderRepository.php`, `src/OpenCATS/UI/*QuickActionMenu.php` | no unit tests |
| Unique module/action URLs hit by the Behat security suite | 127 (vs. 293 action labels, plus 21 `ajax/*.php` endpoints) |

| Area (key files) | Test type present | Coverage level |
|---|---|---|
| String/Date/Array/File/ResultSet/Browser/VCard/AddressParser helpers (`lib/StringUtility.php`, `lib/DateUtility.php`, …) | PHPUnit unit | **partial** (utility functions only) |
| DB escaping helpers and boolean search parser (`lib/DatabaseConnection.php`, `lib/DatabaseSearch.php`) | PHPUnit integration (needs MariaDB) | **partial** (7 of 31 and 1 of 8 methods) |
| New entity layer (`src/OpenCATS/Entity/*`) | PHPUnit unit | **partial** (Company and JobOrder accessors, CompanyRepository persist; JobOrderRepository **none**) |
| Authentication, session, LDAP (`lib/Session.php` 1,257 lines, `lib/LDAP.php`, `modules/login`) | Behat `login.feature` (7 scenarios) | **minimal**; LDAP **none** |
| ACL / access levels (`lib/ACL.php`, `lib/UserInterface.php:431`, `constants.php`) | Behat security suites | **partial**: module/action gate only; no object-level or multi-site checks |
| Candidates (`lib/Candidates.php` 2,473, `modules/candidates/CandidatesUI.php` 3,582) | Behat (add via step, filters, activity) | **minimal** |
| Job orders and pipelines (`lib/JobOrders.php` 1,294, `lib/Pipelines.php` 741, `modules/joborders/JobOrdersUI.php` 1,972) | Behat `job-orders.feature` (14) | **partial** (UI happy paths) |
| Companies and contacts (`lib/Companies.php`, `lib/Contacts.php`) | Behat access matrix only | **minimal** |
| Activities and calendar (`lib/ActivityEntries.php`, `lib/Calendar.php`) | Behat (1 scenario) + access matrix | **minimal** |
| **Careers portal (public, unauthenticated)** (`careers/index.php`, `modules/careers/CareersUI.php` 1,794, `lib/CareerPortal.php`) | none | **none** |
| **Attachments, uploads, resume text extraction** (`lib/Attachments.php` 1,386, `lib/DocumentToText.php`, `upload/.htaccess`) | none (two `FileUtility` helpers only) | **none** |
| **AJAX endpoints** (`ajax.php`, 21 × `ajax/*.php`) | none (`GET_POST_requestsSecurity.feature:1330` "AJAX not tested") | **none** |
| Import / export / reports / graphs / PDF (`modules/import/ImportUI.php` 2,104, `lib/Export.php`, `modules/reports`, `lib/GraphGenerator.php`) | access matrix only | **none** (functional) |
| Email (`lib/Mailer.php`, `lib/EmailTemplates.php`) | none | **none** |
| Search / DataGrid (`lib/Search.php` 2,096, `lib/DataGrid.php` 2,649) | Behat filters and search; 1 integration test | **minimal** |
| Settings / admin (`modules/settings/SettingsUI.php` 3,842, 74 action labels) | Behat (1 scenario) + access matrix | **minimal** |
| XML/RSS feeds, toolbar, queue (`xml/`, `rss/`, `modules/toolbar`, `QueueCLI.php`) | none | **none** |
| Install/upgrade and schema migrations (`installwizard.php`, `modules/install/Schema.php` 1,336) | integration tests load `db/cats_schema.sql` only | **none** for migrations |
| JavaScript (`js/*.js`, `modules/**/*.js`) | none | **none** |

---

## 4. Findings

### TEST-001 — Near-zero automated coverage of domain logic; tests exercise utility helpers only
- **Severity:** HIGH
- **Finding:** The 88 unit tests and 9 integration tests exercise leaf utilities (string, date and address parsing, SQL escaping) and trivial entity getters. None of the business-critical classes has a unit test: candidates, pipelines and status transitions, users and sessions, ACL, attachments, careers portal, mailer, import/export, DataGrid. None of the 66 `modules/*UI.php` controllers has a unit test either. 23 of the 88 unit tests (`JobOrderTest.php`) only assert that a getter returns the constructor argument.
- **Evidence:** §3 counts (49 of ~1,106 `lib` methods referenced). `grep -ohE "[A-Z][A-Za-z]+::[a-zA-Z_]+\(" src/OpenCATS/Tests -r` lists only `DateUtility`, `StringUtility`, `ArrayUtility`, `ResultSetUtility`, `FileUtility`, `BrowserDetection`, `DatabaseSearch`, `DatabaseConnection`, `Company`, and `JobOrder`. `JobOrderTest.php:33-165` contains 23 `test_create_CreateAndGet…` methods.
- **Impact:** Refactoring the legacy code (PHP 8 port, DB layer replacement, MVC extraction) has no safety net. Regressions in permissions, pipelines or uploads will surface only in production.
- **Recommendation:** Before any refactor, build characterization tests (§5.2) around `lib/Candidates.php`, `lib/Pipelines.php`, `lib/Attachments.php`, `lib/Users.php`/`lib/Session.php`, `lib/ACL.php` and `modules/careers/CareersUI.php`. Treat new unit tests on `src/OpenCATS/Entity/*` as a secondary priority.

### TEST-002 — Test toolchain is frozen on PHP 7.2 / PHPUnit 7.5 and cannot run on PHP 8 (measured)
- **Severity:** HIGH
- **Finding:** The dev dependency lock cannot be installed on PHP 8. When forced, PHPUnit 7.5 breaks on PHP 8 (mock generator, deprecations), and the test code uses constructs that PHPUnit 8, 9 and 10 reject. Behat cannot boot on PHP 8 because its context includes application code that no longer parses, and `test/behat.yml` is invalid for current Symfony YAML.
- **Evidence:** §2.1 (27 packages with `php ^7.x` constraints, e.g. `phpunit/phpunit 7.5.7 requires php ^7.1`); §2.2 (`ParseError: syntax error, unexpected token "match"` in `CompanyRepositoryTest.php:36,69,80,100`); §2.3 (`setUp()` without `: void` at `AddressParserTest.php:77`, `CompanyTest.php:23,28`, `DatabaseTestCase.php:10,95`; `@expectedException` at `CompanyRepositoryTest.php:95`; `withConsecutive` at `:38,53,87`, removed in PHPUnit 10; `setMethods` at `:115`, removed in PHPUnit 10; `assertRegExp` at `VCardTest.php:34,94`; class/file mismatch at `CompanyRepositoryTest.php:14`; dynamic property at `CompanyTest.php:25`); §2.4 (Behat parse error via `FeatureContext.php:21`; `behat.yml:4` ParseException).
- **Impact:** The team cannot use the existing suite to validate a PHP 8 migration, which is exactly when it is needed most. PHPUnit 7 went EOL in February 2020 (external knowledge).
- **Recommendation:** Step 1: make the tests PHPUnit 8.5-compatible (`protected function setUp(): void`, `expectException()`, rename the class to `CompanyRepositoryTest`, declare `private $company`). PHPUnit 8.5 runs on both PHP 7.2 and 8.x (external knowledge), so one suite can cover both runtimes. Upgrade to ≥ 8.5.52 because `composer audit` flags CVE-2026-24765 for `<8.5.52`. Step 2: after the app parses on PHP 8, move to PHPUnit 10/11 and replace `withConsecutive`/`setMethods`. Quote `%paths.base%` and the tags in `test/behat.yml` and move to a maintained Behat 3.x with `friends-of-behat/mink-extension` (see DEPENDENCY_AUDIT).

### TEST-003 — CI tests only PHP 7.2 and lints only `src/`, so PHP 8 fatal errors in `lib/` are invisible
- **Severity:** HIGH
- **Finding:** The only CI matrix entry is PHP 7.2, which went EOL on 30 Nov 2020 (external knowledge). The lint step covers `src/` only, which holds 9 non-test files out of 491 PHP/TPL files. The parse errors that break every request on PHP 8 are in `lib/`, which is never linted. The `src/` parse error in `JobOrderRepositoryException.php:2` passes PHP 7.2 lint (INFERENCE, see below), so CI stays green.
- **Evidence:** `.github/workflows/ci.yml:21` `php-version: ['7.2']`; `:44` `find src -name "*.php" -print0 | xargs -0 -n1 php -l`; `lib/CATSUtility.php:108` `if ($data{0} === '<')` is included by `index.php:61`. `src/OpenCATS/Entity/JobOrderRepositoryException.php:2-3`:
  ```php
  namespace \OpenCATS\Entity;
  class JobOrderRepositoryException extends Exception {}
  ```
  INFERENCE: on PHP 7.x this parses as an expression statement (a namespace-relative constant fetch `namespace\OpenCATS\Entity`), so lint passes. At runtime it would raise "Undefined constant" and would declare the class in the global namespace. `lib/JobOrders.php:133` `catch (JobOrderRepositoryException $e)` and `src/OpenCATS/Entity/JobOrderRepository.php:117` rely on this class. No PHP 7.2 binary was available to confirm.
- **Impact:** Nothing in the pipeline signals that the application does not start on any supported PHP version. The job-order persistence error path is broken on all PHP versions and untested.
- **Recommendation:** Lint every `*.php` and `*.tpl` outside `vendor/` on each target runtime, e.g. `git ls-files '*.php' '*.tpl' | xargs -n1 -P4 php -l`, with the `lib/simpletest/test/test_with_parse_error.php` fixture excluded. Add PHP 8.2/8.3 to the matrix as allowed-to-fail, then make it required. Add PHPCompatibility sniffs (TEST-010). Fix `JobOrderRepositoryException.php:2` (`namespace OpenCATS\Entity;` and `extends \Exception`) and add a unit test for the `JobOrderRepository::persist` failure path, mirroring `CompanyRepositoryTest.php:97-105`.

### TEST-004 — Security suite checks only the module/action access-level gate; its assertions can pass falsely; AJAX, careers, uploads and object-level access are untested
- **Severity:** HIGH
- **Finding:** The 1,296 security example rows check one thing: whether a user at access level X gets an "access denied" string for `index.php?m=M&a=A`. None of the URLs carries an object ID. As a result the suite cannot detect IDOR or cross-site (`site_id`) access, CSRF, XSS, SQL injection or upload bypass. The positive assertion "should have permission" only checks that three strings are absent, so an HTTP 500, a PHP fatal or an empty page also passes. POST checks send only `postback=postback`. AJAX endpoints are explicitly excluded. The public careers portal, `xml/`, `rss/` and `modules/toolbar` never appear.
- **Evidence:** `test/features/bootstrap/SecurityContext.php:171-176`:
  ```php
  public function iShouldHavePermission() {
      $this->theResponseShouldNotContain("You don't have permission");
      $this->theResponseShouldNotContain("Invalid user level for action");
      $this->theResponseShouldNotContain("opencats - Login");
  ```
  `SecurityContext.php:111` `$data = array('postback' => 'postback');`. `GET_POST_requestsSecurity.feature:1330` `#### AJAX not tested`, followed by commented-out `ajax_*` rows. `grep -ciE "careers|m=xml|m=rss|m=toolbar|upload" test/features/*.feature` returns 0 hits outside the commented AJAX block. The step annotation at `SecurityContext.php:156` is wrapped in backticks, so it can never match.
- **Impact:** The suite gives false assurance about authorization, which is the most security-sensitive part of a multi-tenant ATS holding PII. The main public attack surface (careers apply and upload, per `Security.MD`) has no regression protection.
- **Recommendation:** See §5.4. Replace the absence-of-string assertion with a positive one (HTTP 200 plus a page-specific marker) and assert the status code. Add object-level cases with real IDs from `test/data/test.sql` (e.g. `candidateID=20000`, `jobOrderID=1`) across two sites. Add `ajax.php?f=…` cases for all 21 `ajax/*.php` functions and careers-portal cases (apply, questionnaire, resume upload with disallowed extensions against `upload/.htaccess`). Add XSS and SQLi payload probes.

### TEST-005 — CI quality gates are soft or broken
- **Severity:** MEDIUM
- **Finding:** (a) The dependency audit can never fail the build. (b) The JUnit check is configured not to fail. (c) Behat writes only progress output, so its results never reach the report even though `reports/behat-*` folders are created. (d) The screenshot artifact path is never written to, because `FeatureContext` saves to `sys_get_temp_dir()` inside the container. (e) The integration step chains phpunit → Behat default → Behat security under the default `bash -e` shell (external knowledge of GitHub Actions defaults), so a failure in the default suite silently skips the security suite. (f) `codacy/coverage` is a dependency but coverage is never produced. (g) A stale `# continue-on-error: true` comment misleads readers.
- **Evidence:** `.github/workflows/ci.yml:48` `run: composer audit || true`; `:92` `fail_on_failure: false`; `:51` `mkdir -p reports/behat-default reports/behat-security test/screenshots`; `:80-81` `--format=progress`; `:99` `path: test/screenshots/`; `test/features/bootstrap/FeatureContext.php:191` `return sprintf('%s/%s.png', sys_get_temp_dir(), $filename);`; `ci.yml:82` comment. `composer audit` on the lock returns 22 advisories in 8 packages (`notes/composer-audit.json`), which this gate currently ignores.
- **Impact:** Known-vulnerable dependencies and test regressions can merge. Behat failures are hard to diagnose.
- **Recommendation:** Gate on `composer audit --no-dev --locked` (runtime) and report dev advisories separately. Set `fail_on_failure: true`. Add `--format=progress --format=junit --out=std --out=/var/www/public/reports/behat-default`. Write screenshots to `test/screenshots/` (mounted at `/var/www/public/test/screenshots`). Split the Docker step into one step per suite with `if: always()`. Remove `codacy/coverage` or wire in pcov coverage.

### TEST-006 — Vacuous, placeholder and disabled tests report green
- **Severity:** MEDIUM
- **Finding:** Several tests cannot fail or do not run: a loop in `AJAXInterfaceTest` sets one key and asserts on a different, unset key; `DatabaseSearchTest::testMakeREGEXPString` is `assertTrue(true)`; `StringUtilityTest::disabledtestIsCityStateZip` never runs; five legacy SimpleTest AJAX tests contain no assertions. `README-testing.md` says placeholder tests are flagged as "Risky", but an `assertTrue(true)` test is not risky in PHPUnit, so it passes silently.
- **Evidence:** `src/OpenCATS/Tests/UnitTests/AJAXInterfaceTest.php:124-126`:
  ```php
  $_REQUEST['isRequiredIDValidTest'] = $ID;
  $this->assertFalse($AJAXInterface->isOptionalIDValid('isOptionalIDValidTest'), …
  ```
  These are 12 invalid-ID assertions (0, -1, '-0', 'test', '$', …), all evaluated against an unset key. Also `IntegrationTests/DatabaseSearchTest.php:17-20`, `UnitTests/StringUtilityTest.php:409`, `modules/tests/testcases/AJAXTests.php:380-390,884-925`, and `README-testing.md` "Risky Tests" paragraph.
- **Impact:** Reported test counts overstate protection. `isOptionalIDValid`'s rejection of negative and non-numeric IDs, which is security-relevant input validation, is in fact unverified.
- **Recommendation:** Fix the key at `AJAXInterfaceTest.php:124` to `'isOptionalIDValidTest'`. Implement or delete the placeholder, or use `markTestIncomplete()`. Re-enable or delete `disabledtestIsCityStateZip`. Enable `failOnRisky`, `failOnIncomplete` and `beStrictAboutTestsThatDoNotTestAnything` in a new `phpunit.xml.dist`.

### TEST-007 — Test schema and config drift from production; no DB isolation between Behat scenarios
- **Severity:** MEDIUM
- **Finding:** Behat runs against `test/data/test.sql`, which contains its own full copy of the DDL, not the production `db/cats_schema.sql`, and the two have diverged. Integration tests use `db/cats_schema.sql`. `test/config.php` is a hand-maintained fork of `config.php` that lacks LDAP constants the code needs. No Behat hook resets the DB, so scenarios that add candidates, users and job orders accumulate state across runs and suites. All 55 tables are MyISAM, so transaction-rollback isolation is impossible (external knowledge: MyISAM is non-transactional).
- **Evidence:** Diffing the `CREATE TABLE` blocks gives 72 differing lines. Examples: `joborder.status` is `varchar(64)` at `db/cats_schema.sql:808` vs `varchar(16)` at `test/data/test.sql:1196`; `user.session_cookie` is `varchar(256)` at `db/cats_schema.sql:1083` vs `varchar(48)` at `test/data/test.sql:1588`; `attachment.content_type` is `varchar(255)` at `db/cats_schema.sql:91` vs `varchar(64)` at `test/data/test.sql:126`; datetime defaults are `'1000-01-01 00:00:00'` in the schema vs `'0000-00-00 00:00:00'` in the fixture (e.g. `test/data/test.sql:58`). Config: `diff config.php test/config.php` shows `LDAP_ACCOUNT` and `LDAP_ATTRIBUTE_*` missing from the test config, yet they are used at `lib/LDAP.php:68,96,135`. Hooks: `grep -n "@Before\|@After\|TRUNCATE" test/features/bootstrap/*.php` finds only `FeatureContext.php:118` (caches the scenario name) and `:127` (screenshot).
- **Impact:** Behaviour that depends on column width or zero-date handling differs between test and production. The LDAP path cannot be tested without a fatal error. Flaky, order-dependent tests are likely (INFERENCE).
- **Recommendation:** See §5.3. Generate the test DB from `db/cats_schema.sql` (plus `modules/install/Schema.php` migrations) and keep `test/data/*.sql` as seed-only `INSERT`s. Derive the test config from `config.php` using environment overrides instead of a forked file. Reset the DB per feature via a `@BeforeFeature` hook (drop/create and reseed, which is cheap at the current fixture size).

### TEST-008 — Behat context uploads failure screenshots to a third-party anonymous file host
- **Severity:** MEDIUM
- **Finding:** On any failed `@javascript` step, `FeatureContext` takes a browser screenshot, creates an anonymous account on `wsend.net`, uploads the PNG with `curl`, and prints the public URL.
- **Evidence:** `test/features/bootstrap/FeatureContext.php:127-135` (`@AfterStep` → `takeAScreenshot`), `:159-169` (`exec(sprintf('curl -F "uid=%s" -F "filehandle=@%s" %s', …, 'https://wsend.net/upload_cli'))`), `:173-184` (`curl_init('https://wsend.net/createunreg')`).
- **Impact:** Screenshots of application pages, which could contain candidate PII if a developer points Behat at a real data copy, go to an uncontrolled external service. The upload uses a shell `exec`. If the service is gone, failures produce no artifact (UNKNOWN: current status of wsend.net).
- **Recommendation:** Delete `getScreenshotUrl()` and `getWsendUser()`. Save screenshots to `test/screenshots/` and rely on the existing `actions/upload-artifact` step (`ci.yml:94-100`).

### TEST-009 — Legacy SimpleTest runner ships as a production module and loads during module discovery
- **Severity:** MEDIUM
- **Finding:** `modules/tests` is auto-discovered like any other module. Any authenticated user can reach `index.php?m=tests`, because `TestsUI` checks no access level. From there a user can run web tests that log in as `TESTER_LOGIN` and create and delete users and records in the live database. Test-user cleanup is not in a teardown. Module discovery `include`s every `*UI.php` whenever `$_SESSION['modules']` is empty, so `TestsUI.php`'s top-level code runs in normal requests: it loads SimpleTest, calls `set_time_limit(300)` and forces `error_reporting(E_ALL)`.
- **Evidence:** `lib/ModuleUtility.php:152-155` (refresh module list when the session has none), `:247-262` (`include_once($fullFilePath)` for every `*UI.php`), `config.php:256` `define('CACHE_MODULES', false)`; `modules/tests/TestsUI.php:38` `set_time_limit(300)`, `:42` `error_reporting(E_ALL)`, `:43-46` `require_once('lib/simpletest/…')`, `:65` `_authenticationRequired = true` with no access-level check in `handleRequest()` (`:79-94`); `modules/tests/testcases/WebTests.php:29-35` `addUser('Test User','ATxyz','testuser101', ACCESS_LEVEL_DELETE, 'password101')`, deletion only at the end (`:203`); `config.php:188-193` `TESTER_LOGIN`/`TESTER_PASSWORD`. The tester account `john@mycompany.net` is not seeded by `db/cats_schema.sql` (0 matches), so on a default install the web tests likely abort at login (INFERENCE).
- **Impact:** Unnecessary authenticated attack surface and production side effects. If a run crashes mid-test, it can leave a known-password DELETE-level account (`testuser101`/`password101`) behind (INFERENCE). It is also dead weight for PHP upgrades.
- **Recommendation:** Remove `modules/tests/` and `lib/simpletest/` from the production tree and releases. Keep `modules/tests/waitForDb.php` under `test/scripts/` (it is used by `test/runAllTests.sh:28`). Port the 6 web tests' assertions (170+ checks of add, edit, search and delete flows) into Behat or HTTP characterization tests.

### TEST-010 — No static analysis, PHP-compatibility or coding-standard tooling
- **Severity:** MEDIUM
- **Finding:** The repository has no PHPStan, Psalm, PHP_CodeSniffer/PHPCompatibility, php-cs-fixer or Rector configuration, and CI has no such step. The README carries a Codacy badge, but whether Codacy analysis is active is UNKNOWN.
- **Evidence:** The config `find` in Method returned no files. `.github/workflows/ci.yml` steps are checkout, setup-php, cache, composer install, lint (src), audit, phpunit, docker tests, report, and release. `README.md:2` has the Codacy badge.
- **Impact:** PHP 8 blockers (§2.5), undefined-constant bugs (TEST-003) and removed functions (`get_magic_quotes_*`, `mysql_*` in `modules/install/Schema.php:725,854,1236`) are found only by manual audit.
- **Recommendation:** Add PHPStan at level 0 with a generated baseline over `lib/`, `modules/`, `src/`, `ajax/`, `careers/` (excluding `lib/artichow`, `lib/fpdf`, `lib/simpletest`, `vendor`) and fail on new errors. Add `phpcompatibility/php-compatibility` with `testVersion 7.2-8.3`. Use Rector's PHP 8 sets as a codemod tool, not a CI gate.

### TEST-011 — No JavaScript tests or lint
- **Severity:** MEDIUM
- **Finding:** About 15.9k lines of first-party JavaScript drive critical UI (DataGrid filters, pipeline modals, email templates, careers apply). There is no `package.json`, no test runner and no linter, and Behat `@javascript` coverage runs only through a 2016 Selenium image.
- **Evidence:** `js/*.js` has 11,181 lines excluding `jquery-1.3.2.min.js`; `modules/**/*.js` has 4,732 lines; no `package.json` or `.eslintrc*` exist; `docker/docker-compose-test.yml:53` `mlespiau/standalone-chrome:2.53.1-cd2.23`.
- **Impact:** A jQuery upgrade (see DEPENDENCY_AUDIT) or a template refactor will break client behaviour silently.
- **Recommendation:** Add ESLint (`eslint:recommended`, browser env, legacy globals declared) in report-only mode. Add Playwright smoke tests for the flows already in `job-orders.feature` and `candidate-filters.feature`. Replace the Selenium 2 container with current `selenium/standalone-chrome` or Playwright.

### TEST-012 — No contract, performance, SAST or DAST testing
- **Severity:** LOW
- **Finding:** External contracts have no tests: the XML job feed (`modules/xml/XmlUI.php`, 17 template tokens such as `jobTitle`, `jobURL`, `jobDescription`), the RSS feed (`modules/rss/RssUI.php`), `ajax.php` XML responses, SOAP WSDLs (`wsdl/*.wsdl`) and `QueueCLI.php`. The repository has no load or performance tests and no DAST (e.g. ZAP) or SAST (e.g. Semgrep) configuration.
- **Evidence:** `ls test/features` shows none of these endpoints; `.github/workflows/ci.yml` has no such steps.
- **Impact:** Job-board integrations and cron tasks can break unnoticed. Performance regressions on large `DataGrid` lists (`lib/DataGrid.php`, 2,649 lines) are unmeasured (no baseline exists).
- **Recommendation:** Add golden-file tests for `xml/index.php` and `rss/index.php` output against the seeded DB. Run a ZAP baseline scan against the compose stack on a nightly schedule. Add Semgrep `p/php` in report mode.

### TEST-013 — No `phpunit.xml`; tests depend on the working directory and hard-coded Docker hostnames
- **Severity:** LOW
- **Finding:** Suites are selected by directory path on the command line. Tests `include` via `LEGACY_ROOT '.'` and relative paths, so they only work from the repo root. Integration tests ignore `DATABASE_*` constants and connect to the literal host `integrationtestdb`. A SQL error calls `die()`, which kills the whole PHPUnit process without a report. The CI release job still excludes a non-existent `phpunit.xml`.
- **Evidence:** No `phpunit*.xml*` exists; `ci.yml:54,77` pass directories; `DatabaseTestCase.php:16-27` (`define('LEGACY_ROOT','.')`, `include_once('./config.php')`), `:31-35` (`mysqli_connect('integrationtestdb','dev','dev')`), `:84` `die (`; `FileUtilityTest.php` uses relative `'attachments'`; `ci.yml:119` `-x … "phpunit.xml"`.
- **Impact:** The tests are hard to run locally or in parallel, and failures are opaque.
- **Recommendation:** Add `phpunit.xml.dist` with a `bootstrap` that defines `LEGACY_ROOT` from `__DIR__`, `unit` and `integration` testsuites, and DB settings from env vars (`DB_HOST` defaulting to `integrationtestdb`). Replace `die()` with `throw new \RuntimeException()`.

### TEST-014 — Obsolete or inactive CI definitions are misleading
- **Severity:** LOW
- **Finding:** `.travis.yml` still declares PHP 7.2/8.0/8.2 jobs and a release deploy. The 8.x jobs cannot pass with this lock (§2.1), and travis-ci.org stopped operating in 2021 (external knowledge). The issue-housekeeping workflows sit in `.github/workflow/` (singular), which GitHub never executes. `test/runAllTests.sh` lacks `set -e`, so earlier failures are masked.
- **Evidence:** `.travis.yml:17-20,23-27`; `.github/workflow/needs-reply.yml`, `.github/workflow/needs-reply-remove.yml`; `test/runAllTests.sh:1` `#!/bin/sh -x`.
- **Impact:** Contributors may believe PHP 8 is tested, or that stale-issue automation is active.
- **Recommendation:** Delete `.travis.yml` and `ci/package-code.sh`, or port packaging into `ci.yml` (see DEPENDENCY_AUDIT DEP-007). Move or delete `.github/workflow/`. Add `set -eu` to `runAllTests.sh`.

---

## 5. Recommended test strategy for the transformation

Ordered by dependency. Every item is anchored to existing files.

### 5.1 Stabilize the harness first (about 1–2 days, prerequisite for everything else)
1. Add `phpunit.xml.dist` (TEST-013) with suites `unit` (`src/OpenCATS/Tests/UnitTests`), `integration` (`…/IntegrationTests`) and `characterization` (new), a bootstrap defining `LEGACY_ROOT`, and strict flags (`failOnRisky`, `failOnWarning`).
2. Make tests PHPUnit 8.5-compatible (TEST-002) so one suite runs on PHP 7.2 (today's production) and 8.x (target). Fix the vacuous tests (TEST-006).
3. CI (TEST-003, TEST-005): matrix `['7.2', '8.3']` with `continue-on-error: ${{ matrix.php-version != '7.2' }}` until the port lands. Lint all PHP/TPL files. Add PHPStan level 0 plus baseline and PHPCompatibility (TEST-010). Make `composer audit --no-dev` gating. Set `fail_on_failure: true`. Emit Behat JUnit output.

### 5.2 Characterization (golden-master) tests before refactoring legacy modules
- **HTTP golden masters.** For each `case` label in `modules/*/*UI.php` (293 in total; start with `candidates`, `joborders`, `companies`, `contacts`, `settings`, `careers`), log in as each fixture user from `test/data/securityTests.sql`. Request `index.php?m=<module>&a=<action>` with representative IDs from `test/data/test.sql` (`candidateID=20000`, `jobOrderID=1`, `companyID=2`, `contactID=1`) and snapshot the status code plus normalized HTML. Normalization must strip session cookies, timestamps, the `$javascriptAntiCache` query string (`lib/TemplateUtility.php:1190-1194`) and md5-style DataGrid instance IDs (e.g. `filterResultsAreaTable0279d9da…` in `candidate-filters.feature:14`). Store snapshots under `test/golden/`. A plain PHP HTTP client is enough (Symfony HttpBrowser; Goutte is abandoned), so no Selenium is required.
- **Library-level characterization.** Call the public static and instance methods of `lib/Candidates.php`, `lib/Pipelines.php`, `lib/JobOrders.php`, `lib/ActivityEntries.php`, `lib/SavedLists.php`, `lib/DataGrid.php` and `lib/Search.php` against the seeded DB and snapshot the returned arrays and resulting table rows. This locks in current behaviour, including bugs, so a PDO or ORM migration can be diffed.
- **AJAX surface.** Snapshot `ajax.php?f=<name>` for all 21 `ajax/*.php` functions (currently untested per `GET_POST_requestsSecurity.feature:1330`).
- **Output contracts.** Golden files for `xml/index.php`, `rss/index.php`, `careers/index.php` (job list and apply form), vCard download (`lib/VCard.php`) and PDF/report output (`modules/reports/ReportsUI.php:414`), comparing structure rather than bytes for PDFs.

### 5.3 DB fixture strategy
- Build the schema from **`db/cats_schema.sql` only**, followed by any required `modules/install/Schema.php` migrations. Convert `test/data/test.sql` and `securityTests.sql` to seed-only `INSERT` files (remove the drifted DDL, TEST-007).
- Because tables are MyISAM (`ENGINE=MyISAM` on all 55 tables), use **drop/create and reseed per test class (PHPUnit) and per feature (Behat)**, not transactions. At about 1,800 fixture lines this takes seconds. Once the planned move to InnoDB lands, switch to per-test transactions.
- Keep two sites in the fixture (site 1 and a second site) so multi-tenant isolation (`site_id` in every table) can be asserted.
- Parameterize host and credentials from env, replacing the literals in `DatabaseTestCase.php:31-35` and `test/config.php:41-44`. Pin the DB image to the production-supported MariaDB LTS instead of `mariadb:10.7` (`docker-compose-test.yml:27,42`).
- Note that `DatabaseSearch::makeBooleanSQLWhere` emits `[[:<:]]` (`DatabaseSearchTest.php:22-72`). MySQL 8's ICU regex engine rejects this syntax (external knowledge), so run integration tests against every DB engine you intend to support.

### 5.4 Security regression suite (extend `test/features/bootstrap/SecurityContext.php`)
1. Replace `iShouldHavePermission` (`:171-176`) with positive assertions: status 200 and an expected marker per page.
2. **Object-level authorization.** For each `show`/`edit`/`delete`/`viewResume`/`deleteAttachment` action, request IDs belonging to site 2 while logged in to site 1 and expect denial.
3. **CSRF.** Replay state-changing POSTs (e.g. `settings&a=addUser`, `candidates&a=delete`) cross-origin without a token. Today this documents current behaviour. Once tokens exist, the tests assert rejection.
4. **XSS and SQLi probes.** Inject marker payloads into fields rendered by `.tpl` templates and into DataGrid parameters (`ajax/getDataGridPager.php`), then assert they come back encoded or rejected.
5. **Careers portal and uploads.** Unauthenticated apply flow, questionnaire, and resume upload with allowed and blocked extensions (list in `upload/.htaccess` and `attachments/.htaccess`), plus path-traversal file names.
6. **Session.** Keep `login.feature:5` (spoofed cookie) and add session-fixation and logout-invalidation checks.
7. Run the suite on every PR (required), plus a nightly ZAP baseline scan (TEST-012).

### 5.5 CI gates (target state)
| Gate | Blocking? |
|---|---|
| `php -l` on all PHP/TPL, per matrix PHP version | yes |
| PHPStan level 0→2 with baseline; PHPCompatibility 7.2–8.3 | yes (no new errors) |
| PHPUnit unit + integration + characterization | yes |
| Behat `@core` + `@security`, JUnit published | yes |
| `composer audit --no-dev` | yes (explicit, documented ignores) |
| `composer audit` (dev), retire.js over `js/` and `vendor/ckeditor` | report only |
| ESLint | report only, then yes |
| ZAP baseline, Semgrep | nightly, report only |

---

## Facts vs Assumptions

**FACT (verified in code or by execution):**
- Counts: 88 unit tests, 9 integration tests (1 placeholder), 27 `@core` scenarios, 26 `@security` outlines expanding to 1,296 example rows over 127 unique URLs; 0 JS tests; no `phpunit.xml`, PHPStan, Psalm, PHPCS or ESLint config.
- All §2 execution results (composer failure on PHP 8.4; PHPUnit 7.5: 3 errors and 1 failure; PHPUnit 9.6: `setUp()` fatal, then 16 errors on the patched copy; Behat parse error; lint results).
- The CI configuration details quoted from `.github/workflows/ci.yml`.
- Schema and config drift (diffs), vacuous assertions (`AJAXInterfaceTest.php:124-126`), wsend.net upload code, `modules/tests` module discovery and include-time side effects.

**ASSUMPTION / INFERENCE / external knowledge (labelled where used):**
- On PHP 7.2, `namespace \OpenCATS\Entity;` lints as an expression and fails at runtime (not executed; no PHP 7.2 binary).
- GitHub Actions' default `bash -e` shell stops the multi-command step at the first failure. GitHub runs only `.github/workflows/`. travis-ci.org is shut down.
- EOL dates: PHP 7.2 (Nov 2020), PHPUnit 7 (Feb 2020). PHPUnit 8.5 supports PHP 7.2 and 8.x. MySQL 8 rejects `[[:<:]]`. MyISAM has no transactions.
- The legacy web tests abort on default installs because the tester account is not seeded, and a mid-run crash could leave `testuser101` behind.
- Behat scenarios are order-dependent because the DB is never reset.

## Unknowns / Needs Further Investigation
1. **Actual line and branch coverage.** Needs a run with pcov/xdebug inside the PHP 7.2 container. This environment has neither a coverage driver nor a Docker daemon.
2. **Whether CI currently passes on GitHub.** Needs the Actions run history (not available offline). Particularly whether the Selenium 2.53 / Chrome image still works and whether Behat `@javascript` scenarios are green.
3. **Integration and Behat results on MariaDB 10.7.** Not executed (no DB and no Docker here).
4. **Whether Codacy static analysis is still active** for the repository (README badge only).
5. **Contents of `opencats/php-base:7.2-fpm-alpine`** (`dockerize`, antiword/pdftotext, enabled extensions): there is no Dockerfile in the repo, which affects what the tests really exercise.
6. **Behaviour of `DatabaseSearch` regex generation on MySQL 8 / MariaDB 11.** Needs an execution matrix.
7. **Whether wsend.net still accepts uploads**, i.e. whether screenshots have been leaking or silently failing.
