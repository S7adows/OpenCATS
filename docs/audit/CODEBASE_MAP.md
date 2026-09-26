# OpenCATS — Codebase Map
Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **What this is:** a navigable reference of what exists and where — root files, top-level directories, the 23 modules, the 81 first-party `lib/` files, vendored code, the include graph and dead code — plus five map-level findings. How the parts interact at runtime is in `ARCHITECTURE.md`.
- **Counts (re-run for this edition):** `git ls-files` + `wc -l`. Directory LOC sums text files (`php tpl js sql sh yml css wsdl md feature conf html awk txt .htaccess`); images count as files only. Classes by `grep "^\s*(abstract )?class"`. "Incl." = number of repository files that `include`/`require` a `lib/` file by path (vendored code and `optional-updates/` excluded; string-embedded includes inside `modules/install/Schema.php` migrations counted). Bootstrap closure by a read-only Python walk of literal include paths.
- **"Dead"** means no static reference was found by `git grep` for the file name or class name across `*.php`, `*.tpl`, `*.js`; dynamic includes built from variables (`DataGrid::get()`, `QueueProcessor`, module discovery) were checked and do not target the listed files.
- **Runtime evidence:** `docs/baseline/` (RT-01, RT-02: all 23 modules are instantiated at discovery; smoke steps as cited).
- **Not assessed as product:** `.github/workflows/preview.yml`, `docs/baseline/env/`, `docs/baseline/preview/` (audit tooling).

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| ARCH-M01 | Dead first-party code: 7 `lib/` files (4,181 LOC) never loaded; legacy modules and stubs still shipped | MEDIUM | Static |
| ARCH-M02 | Vendored, locally patched, unmaintained libraries in `lib/` and `js/`; three do not parse on PHP 8 | HIGH | Static |
| ARCH-M03 | Duplicate or forked copies of core files (queue tasks, `Task.php`, `Search.php`, `config.php`) | MEDIUM | Static |
| ARCH-M04 | Hosted-CATS operations scripts and configs with internal hosts and plaintext credentials | MEDIUM | Static |
| ARCH-M05 | Mislabeled file headers and class/file-name mismatches | LOW | Static |

5 findings — 0 CRITICAL / 1 HIGH / 3 MEDIUM / 1 LOW · Runtime 0 / Static 5 / Partial 0 / Unverified 0 · no withdrawn or merged stubs.

---

## 1. Dead, duplicated and forked code

### ARCH-M01 — Dead first-party code; legacy modules and stubs still shipped
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-015, ARCH-019, TEST-009, API-022*

- **Confirmed fact:** Seven `lib/` files totalling 4,181 LOC have no reachable reference: `ControlPanel.php` (1,573), `Profile.php` (1,219, included only by `Display.php`), `CBFUtility.php` (715), `Display.php` (233), `DefaultQuestionnaires.php` (206), `JavaScriptCompressor.php` (121), `Encryption.php` (114, `mcrypt_*`, which PHP 7.2 removed). Two legacy modules are still shipped and live: `modules/tests` (3,019 PHP LOC + `lib/simpletest`, 31,112 LOC) and `modules/toolbar` (Firefox toolbar). Empty or stub files remain (`ajax/getReportHTML.php`, `modules/careers/Openings.tpl`, `modules/careers/SearchOpenings.tpl`, the `QueueUI` stub), and 241 of 251 hook names are never implemented.
- **Evidence:** `git grep -lw` for each file and class name returns only the file itself (or the `Display`↔`Profile` pair); `wc -l`; §R8 inventory. RT-02 shows all 23 modules, including `tests`, are instantiated at discovery on a login-page request.
- **Impact:** Audit, security and PHP-upgrade scope include code that never runs; contributors cannot tell live from dead; test and toolbar code adds reachable surface in production.
- **Severity:** MEDIUM — notable maintenance and review cost.
- **Recommendation:** Remove code with no references and keep test harnesses out of production builds, so the shipped code base is the code that runs.
- **Unknown / needs further validation:** Whether any external plug-in loads these classes by name. Needs a survey of third-party extensions (none are in the repository).

### ARCH-M03 — Duplicate or forked copies of core files
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-016, ARCH-017, ARCH-014, DEBT-013*

- **Confirmed fact:** Several core files exist in two diverging copies: `optional-updates/latest-sphinx-search/Search.php` (2,487 LOC, CRLF, uses `create_function`) vs `lib/Search.php` (2,096); `optional-updates/latest-sphinx-search/config.php` (lacks `LEGACY_ROOT`, `AUTH_MODE` and all LDAP constants) vs `config.php`; `test/config.php` (lacks `LDAP_ACCOUNT`, `LDAP_AD`, `LDAP_ATTRIBUTE_*`, `LDAP_SITEID`, adds `LDAP_UID`); `modules/queue/tasks.php` vs `modules/queue/tasks/tasks.php`; `modules/queue/lib/Task.php` vs `modules/queue/tasks/lib/Task.php`. The optional-update README tells users to copy the forks over the core files.
- **Evidence:** `diff` of `define()` names; `grep -c` of `LEGACY_ROOT|AUTH_MODE|LDAP_HOST` in the fork config (0 each); `lib/ModuleUtility.php:86-101` loads only `tasks/tasks.php`; `optional-updates/latest-sphinx-search/Search.php:228,240,301,313`.
- **Impact:** Following the optional-update instructions replaces a working `config.php` with one that breaks the app; fixes to `lib/Search.php` never reach users of the fork; test runs use a different configuration from production.
- **Severity:** MEDIUM — silent divergence and a documented path that breaks installations.
- **Recommendation:** Keep one copy of each core file and express variants as configuration, so fixes apply everywhere and no instruction overwrites working files.
- **Unknown / needs further validation:** How many installations applied the optional Sphinx update. Needs field data.

---

## 2. Vendored and hosted-service artifacts

### ARCH-M02 — Vendored, locally patched, unmaintained libraries in `lib/` and `js/`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-003, DEP-006, DEP-007, DEP-011, SEC-019, ARCH-001*

- **Confirmed fact:** Charting (Artichow), PDF (FPDF 1.53), test (SimpleTest 1.1.0) and search-client (Sphinx API 2007, GPL) libraries are copied into `lib/` with local edits; jQuery 1.3.2, subModal, sorttable (modified), calendarDateInput and sweetTitles are copied into `js/`. None is managed by Composer or a JS package manager. `lib/artichow/AntiSpam.class.php:63`, `lib/fpdf/fpdf.php:434` and `lib/fpdf/font/makefont/makefont.php:18` do not parse on PHP 8.4.
- **Evidence:** §R6 table; `lib/fpdf/fpdf.php:16` (`FPDF_VERSION '1.53'`), `lib/simpletest/VERSION` (1.1.0), `lib/sphinx/sphinxapi.php` header (GPL, 2007); `php -l` results (ARCHITECTURE R5). At runtime on PHP 7.2 graphs render (#55) and FPDF produces a PDF when its image fetch succeeds (RT-09 control).
- **Impact:** Reports and graphs cannot run on PHP 8; there is no security-update path; the GPL client inside a CPL project is a licence question (DEP-011).
- **Severity:** HIGH — a major barrier to moving to a supported PHP version.
- **Recommendation:** Track every third-party component with a known version, source and licence through a package manager, so updates and PHP compatibility can be managed instead of hand-patched.
- **Unknown / needs further validation:** Licence compatibility of the GPL Sphinx client and CC BY-SA `sweetTitles.js` with CPL 1.1a. Needs legal review (DEP-011).

### ARCH-M04 — Hosted-CATS operations scripts and configs with internal hosts and plaintext credentials
*Confirmation: **Static** · Phase 0 severity: HIGH → now MEDIUM (the credentials target private hosts of the defunct hosted service and grant nothing on an OpenCATS installation; consistent with SEC-018) · Related: SEC-018, DEP-010, ARCH-019*

- **Confirmed fact:** Files from the commercial hosted service ship in the repository with internal hostnames or private IPs and plaintext passwords: `lib/sphinx/conf/sphinx.conf` (a `192.168.x` SQL host, user and password), `scripts/mysql_get_prod_db.sh` (a `10.0.0.x` production DB host, user and password), `scripts/storeDeletedAttachments.sh` (`fs1.cognizo.com` with a user and password) and `scripts/sphinx_*.sh` (paths under `/usr/local/www/catsone.com/`). `lib/` and `scripts/` have no `.htaccess`, so under the repository-as-docroot layout these files are web-served as static text unless the web server blocks them.
- **Evidence:** `lib/sphinx/conf/sphinx.conf:14-18`; `scripts/mysql_get_prod_db.sh:8-10`; `scripts/storeDeletedAttachments.sh:4-10`; `scripts/sphinx_reindex.sh:14-17`. (Values are deliberately not reproduced here.)
- **Impact:** Leaked credentials (if they were ever real and reused) and copy-paste risk for operators; noise in every secret scan.
- **Severity:** MEDIUM — credential hygiene issue with no direct access to OpenCATS installations.
- **Recommendation:** Remove hosted-service operations files and any embedded credentials from the product repository, so no secrets or internal hostnames are distributed.
- **Unknown / needs further validation:** Whether these credentials were ever valid or reused elsewhere. Needs the git history and the original maintainers.

---

## 3. Navigation hygiene

### ARCH-M05 — Mislabeled file headers and class/file-name mismatches
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEBT-019, DEBT-022*

- **Confirmed fact:** Some file headers describe the wrong thing and several classes do not match their file names: `lib/ExtraFields.php` header "Job Orders Library"; `lib/ListEditor.php` header "Array Utility Library"; classes `ContactImport` in `ContactsImport.php`, `HTTPLogger` in `HttpLogger.php`, `XmlTemplate` in `XmlJobExport.php`, `DefaultQuestionnaireUtility` in `DefaultQuestionnaires.php`, `LoginActivityPager` in `LoginActivity.php`, `CATSUI` in `modules/install/CATSUI.php` (module `install`). Almost every header carries SVN `$Id:` keywords.
- **Evidence:** `lib/ExtraFields.php:4`; `lib/ListEditor.php:4`; `grep "^class"` per file (`ContactsImport.php:5`, `HttpLogger.php:38`, `XmlJobExport.php:38`, `DefaultQuestionnaires.php:32`, `LoginActivity.php:41`, `modules/install/CATSUI.php:30`).
- **Impact:** Slower navigation; name-based autoloading of `lib/` would need renames.
- **Severity:** LOW — hygiene.
- **Recommendation:** Correct the headers and align class and file names when files are next touched, so names can be trusted.
- **Unknown / needs further validation:** None.

---

## Reference map

### R1. Repository at a glance

| Area | Files | LOC | Notes |
|---|---|---|---|
| All PHP (`*.php`, tracked, excl. `docs/`) | 355 | 137,356 | — |
| PHP outside `lib/` | — | 43,253 | `modules` 31,118; root 2,138; `ajax` 1,862; `src` 3,903; rest in `test/`, `scripts/`, shims |
| First-party `lib/*.php` | 81 | 46,703 | Phase 0 said 83; the table always listed 81 |
| Vendored code under `lib/*/` | 214 (all types) | 47,400 (PHP) | artichow 13,377 (40 files); simpletest 31,112 (131); fpdf 2,232 (34); sphinx 679 (9) |
| Templates (`*.tpl`) | 136 | 16,914 | 134 in `modules/`, `Error.tpl`, `lib/datagrid/FilterArea.tpl` |
| JavaScript (`*.js`) | 57 | 16,296 | `js/` 39 files, 11,564 LOC incl. minified jQuery 1.3.2 |
| SQL (`db/*.sql`) | 8 | 45,157 | `upgrade-zipcodes.sql` 42,847; `cats_schema.sql` 1,188 (55 MyISAM tables); plus `cats_testdata.bak` (ZIP) |

### R2. Root files

| File | LOC | Purpose | Notes |
|---|---|---|---|
| `index.php` | 276 | Main front controller: install gate, bootstrap, session, dispatch | `get_magic_quotes_runtime()` at `:93` (removed in PHP 8) |
| `ajax.php` | 138 | AJAX dispatcher `f=name` / `f=mod:name` | `:76-92`; handlers authenticate themselves |
| `config.php` | 500 | 82 `define()`s: DB, mail, LDAP, paths, flags, licence key; commented ACL/job-type examples | Rewritten at runtime (ARCH-014) |
| `constants.php` | 297 | Version `0.9.7.4`, core module order, access levels, data item types, statuses, time zones, bad extensions | — |
| `installwizard.php` | 551 | Installer UI driving `ajax.php?f=install:ui` | Requires only PHP ≥ 5.0.0 |
| `installtest.php` | 186 | Stand-alone environment test page | No auth, no `INSTALL_BLOCK` check |
| `QueueCLI.php` | 124 | Queue runner meant for cron | Web-reachable, no CLI guard |
| `rebuild_old_docs.php` | 66 | One-off 2011 attachment re-index | Raw `mysqli_*`, `addslashes`, no auth |
| `Error.tpl` | 12 | Template for `ModuleUtility::_fatal` | — |
| `main.css`, `ie.css`, `not-ie.css`, `careersPage.css` | 1,379 / 31 / 31 / 59 | Global, IE-conditional and careers styles | — |
| `composer.json` / `composer.lock` | 21 / — | PSR-4 `OpenCATS\` → `src/OpenCATS/`; runtime `phpmailer/phpmailer` (locked v6.8.0), `ckeditor/ckeditor` (4.25.1); dev PHPUnit 7.5.7, Behat, Mink | No `php` platform constraint |
| `.htaccess` | 4 | `IndexIgnore *`, `Options -Indexes` | Apache only |
| `robots.txt` | 19 | Disallow all except `/careers/` and assets | Commit `ae4e93c` |
| `.travis.yml`, `ci/package-code.sh` | 38 / 11 | Legacy Travis CI and packaging (runs `composer install --no-dev`) | Superseded by GitHub Actions (inferred) |
| `README.md`, `README-testing.md`, `CHANGELOG.MD` (1,531), `Security.MD`, `LICENSE.md` (CPL 1.1a) | — | Documentation | CHANGELOG top entry is 0.9.3-3 (2016) while the code is 0.9.7.4 |

### R3. Top-level directories

| Directory | Files | LOC | Purpose / key files | Notes |
|---|---|---|---|---|
| `.github/` | 5 (+ `preview.yml`, audit tooling) | 193 | `workflows/ci.yml` (PHP 7.2 tests, release zip), `dependabot.yml`, `no-response.yml`, `workflow/needs-reply*.yml` | `workflow/` (singular) is not read by GitHub (inferred) |
| `ajax/` | 21 | 1,862 | Core AJAX handlers | 18 `SecureAJAXInterface`, 2 public, 1 empty (API §2.1) |
| `attachments/` | 2 | 8 | Runtime file store `site_N/NNNxxx/<md5>/file` | `.htaccess` (Apache only); content git-ignored; directly downloadable under nginx (RT-17) |
| `careers/`, `rss/`, `xml/` | 1 each | 41 / 40 / 41 | Portal URL shims into `index.php` | `rss/` broken (RT-05) |
| `ci/` | 1 | 11 | Travis packaging | Legacy |
| `db/` | 9 | 45,157 | Schema, demo data (`cats_testdata.bak`), upgrade SQL 0.5→0.9.5, US ZIP codes | Upgrade SQL fails on demo data (RT-01) |
| `docker/` | 2 | 108 | Dev and test compose stacks | No Dockerfile; PHP 7.2 image (ARCH-025) |
| `images/` | 301 | — | UI images | Includes licensing leftovers (`add_licenses.jpg`); `login.gif`, `security.gif` missing (RT-13) |
| `js/` | 42 | 11,577 | Global JS: `lib.js`, `activity.js`, `dataGrid.js`, vendored jQuery 1.3.2, subModal, sorttable, calendarDateInput, sweetTitles | `index.php` empty listing guard |
| `lib/` | 298 | 106,564 | 81 first-party files + vendored libraries | No `.htaccess` |
| `modules/` | 236 | 54,249 | 23 feature modules | §R4 |
| `optional-updates/` | 4 | 2,820 | Manual "latest Sphinx" drop-in (`Search.php`, `config.php`, `sphinx.conf`, README) | Forks (ARCH-M03) |
| `reports/` | 1 | 0 | CI JUnit output placeholder | — |
| `scripts/` | 14 | 921 | Hosted-CATS maintenance (`makeBackup.php`, `sphinx_*.sh`, `mysql_get_prod_db.sh`, `svnkeywords.sh`, …) | ARCH-M04 |
| `src/` | 24 | 3,903 | PSR-4 `OpenCATS\` (2 entities + repositories, 3 UI menus, 15 tests) | ARCH-012 |
| `temp/` | 1 | 0 | `CATS_TEMP_DIR` placeholder | Git-ignored |
| `test/` | 16 | 5,369 | Behat/Mink features, contexts, test SQL, `test/config.php`, `runAllTests.sh` | Config drift (ARCH-M03) |
| `upload/` | 1 | 10 | Upload staging (`.htaccess`) | `.gitignore` lists `uploads/*`, not `upload/` |
| `wsdl/` | 3 | 225 | SOAP client descriptors (`soap.resfly.com`, `catsone.com/keyCheck.php`) | `keyCheck.wsdl` unused (API-010) |

### R4. Modules (`modules/`, 23)

LOC = PHP / TPL / JS. Auth = `_authenticationRequired`.

| Module | Purpose | LOC | Main classes | Key actions (`a=`) | Auth |
|---|---|---|---|---|---|
| `activity` | Activity log by period | 616 / 158 / 64 | `ActivityUI`, `ActivityDataGrid` | `viewByDate`, `listByViewDataGrid` | yes |
| `attachments` | Streams attachment files | 149 / 0 / 0 | `AttachmentsUI` | `getAttachment` | yes |
| `calendar` | Calendar UI; reminders task | 948 / 644 / 2,062 | `CalendarUI`, `Reminders` | `showCalendar`, `addEvent`, `editEvent`, `deleteEvent`, `dynamicData` | yes |
| `candidates` | Candidate CRUD, search, pipelines, attachments, duplicates, e-mail | 3,717 / 3,396 / 430 | `CandidatesUI` + 2 grids | 32 cases incl. `show`, `add`, `edit`, `search`, `viewResume`, `addActivityChangeStatus`, `emailCandidates`, `merge`, `linkDuplicate` | yes |
| `careers` | Public careers portal | 1,794 / 140 / 0 | `CareersUI` | driven by `p=` (API R4) | **no** |
| `companies` | Company CRUD, attachments, internal postings | 1,375 / 1,106 / 163 | `CompaniesUI` + 2 grids | `show`, `add`, `edit`, `delete`, `search`, `internalPostings` | yes |
| `contacts` | Contact CRUD, cold-call list, vCard | 1,708 / 1,336 / 196 | `ContactsUI` + 2 grids | `show`, `add`, `edit`, `showColdCallList`, `downloadVCard` | yes |
| `export` | CSV export | 155 / 0 / 0 | `ExportUI` | `export`, `exportByDataGrid` | yes (no ACL) |
| `graphs` | Chart images and CAPTCHA | 632 / 0 / 0 | `GraphsUI` | 5 public + 6 logged-in actions | **no** (partly checks login) |
| `home` | Dashboard, quick search, saved searches | 793 / 362 / 0 | `HomeUI`, `CallsDataGrid`, `ImportantPipelineDashboard` | `home`, `quickSearch`, `addSavedSearch` | yes |
| `import` | CSV import, bulk résumé import, revert | 2,680 / 1,521 / 277 | `ImportUI`, `Import` | `import*`, `massImport*`, `revert` | yes |
| `install` | Migrations holder, installer AJAX, backup helpers | 3,346 / 0 / 0 | `CATSUI` (empty `handleRequest`), `CATSSchema` | — (AJAX only) | **no** |
| `joborders` | Job-order CRUD, pipeline management | 2,128 / 1,565 / 341 | `JobOrdersUI` + 2 grids | 16 cases incl. `show`, `add`, `considerCandidateSearch`, `addToPipeline` | yes |
| `lists` | Saved lists | 978 / 237 / 0 | `ListsUI`, `ListsDataGrid` | `showList`, `addToListFromDatagridModal`, `deleteStaticList` | yes |
| `login` | Login, forgot password, first-login wizard | 511 / 494 / 84 | `LoginUI` | `attemptLogin`, `forgotPassword` (fatal, RT-03) | **no** |
| `queue` | Task framework, samples, stub UI | 729 / 0 / 0 | `QueueUI` (stub), `Task`, `CleanExceptions` | — | yes |
| `reports` | EEO, submission, placement, job-order PDF reports | 725 / 1,246 / 0 | `ReportsUI` | `showSubmissionReport`, `generateJobOrderReportPDF` (RT-09), `customizeEEOReport` | yes |
| `rss` | Public RSS feed | 159 / 0 / 0 | `RssUI` | `jobOrders` | **no** |
| `settings` | Administration: users, portal, e-mail templates, extra fields, backups, tags, EEO, licence | 4,149 / 4,406 / 488 | `SettingsUI` | 51 cases incl. `manageUsers`, `careerPortalSettings`, `emailTemplates`, `ajax_wizard*`, `ajax_tags_*` | yes |
| `tests` | SimpleTest web/AJAX harness | 3,019 / 86 / 50 | `TestsUI` + 17 test cases | `selectTests`, `runSelectedTests` | yes (any user) |
| `toolbar` | Legacy Firefox toolbar API | 288 / 86 / 278 | `ToolbarUI` | `authenticate`, `getLicenseKey`, `storeMonsterResumeText`, … | **no** |
| `wizard` | Generic modal wizard renderer | 188 / 93 / 299 | `WizardUI` | `ajax_getPage` | **no** |
| `xml` | Public XML job feeds | 331 / 0 / 0 (+3 `.xtpl`) | `XmlUI` | `jobOrders` | **no** |

Module AJAX endpoints (`ajax.php?f=<module>:<name>`): `import:processMassImportItem`, `install:{ui,maint,attachmentsReindex,attachmentsToThreeDirectory}`, `lists:{addToLists,deleteList,editListName,newList}`, `settings:backup`, `tests:getCandidateJobOrderID`.

### R5. `lib/*.php` — first-party files (81)

Status: **core** = in the `index.php` bootstrap closure; **active** = referenced by modules; **dead** = no reference (M01).

| File | LOC | Classes | Responsibility | Incl. | Status |
|---|---|---|---|---|---|
| `ACL.php` | 93 | `ACL` | Access level per secured object from `ACL_SETUP` (inert by default) | 1 | core |
| `AJAXInterface.php` | 263 | `AJAXInterface`, `SecureAJAXInterface` | AJAX base: XML output, input helpers, login check | 2 | active |
| `ActivityEntries.php` | 553 | `ActivityEntries` | Activity records gateway | 17 | active |
| `AddressParser.php` | 901 | `AddressParser` | Heuristic free-text address parser | 2 | active |
| `ArrayUtility.php` | 108 | `ArrayUtility` | Array helpers (`eval` in `arrayMapKeys`) | 3 | core |
| `Attachments.php` | 1,386 | `Attachments`, `AttachmentCreator` | Attachment records, storage layout, upload, text extraction | 15 | core |
| `BrowserDetection.php` | 483 | `BrowserDetection` | User-agent parsing for login history | 3 | active |
| `CATSUtility.php` | 454 | `CATSUtility` | Version/build (SVN), config rewriting, URL helpers | 11 | core (PHP 8 parse error) |
| `CBFUtility.php` | 715 | `CBFUtility` | "CATS Backup Format" export/import | 0 | dead |
| `Calendar.php` | 1,084 | `Calendar`, `CalendarSettings` | Events gateway, upcoming-events HTML, reminder mail | 7 | core |
| `Candidates.php` | 2,473 | `Candidates`, `CandidatesDataGrid`, `EEOSettings` | Candidate gateway, grid definitions (eval'd HTML), EEO settings | 18 | core |
| `CandidatesImport.php` | 60 | `CandidatesImport` | Import adapter | 1 | active |
| `CareerPortal.php` | 471 | `CareerPortalSettings` | Portal settings and templates | 5 | active |
| `CommonErrors.php` | 323 | `CommonErrors` | Fatal error pages (incl. "Upgrade to Professional") | 13 | core |
| `Companies.php` | 994 | `Companies`, `CompaniesDataGrid` | Company gateway; `add()` via `CompanyRepository` | 17 | core |
| `CompaniesImport.php` | 59 | `CompaniesImport` | Import adapter | 1 | active |
| `Contacts.php` | 1,050 | `Contacts`, `ContactsDataGrid` | Contact gateway, cold-call list | 13 | core |
| `ContactsImport.php` | 57 | `ContactImport` | Import adapter | 1 | active |
| `ControlPanel.php` | 1,573 | `ControlPanel` | Generic MySQL table viewer/editor | 0 | dead |
| `Dashboard.php` | 272 | `Dashboard` | Dashboard queries | 2 | active |
| `DataGrid.php` | 2,649 | `DataGrid` | Sortable/filterable grid: SQL, eval'd renderers, export, column prefs | 3 | core (PHP 8 `TypeError`) |
| `DatabaseConnection.php` | 764 | `DatabaseConnection` | mysqli singleton, escaping, locks, TZ rewrite | 14 | core |
| `DatabaseSearch.php` | 468 | `DatabaseSearch` | Boolean search → REGEXP SQL; Sphinx query conversion | 6 | core |
| `DateUtility.php` | 747 | `DateUtility` | Date parsing/formatting (`strftime`) | 19 | core |
| `DefaultQuestionnaires.php` | 206 | `DefaultQuestionnaireUtility` | Seed questionnaires | 0 | dead |
| `Display.php` | 233 | `Display` | Profile-driven rendering | 0 | dead |
| `DocumentToText.php` | 586 | `DocumentToText` | Text extraction (`exec` converters; PHP RTF/DOCX/ODT) | 8 | core |
| `EmailTemplates.php` | 420 | `EmailTemplates` | E-mail templates and placeholders | 7 | core |
| `Encryption.php` | 114 | `Encryption` | mcrypt wrapper | 0 | dead |
| `Export.php` | 173 | `ExportUtility`, `Export` | CSV export | 6 | active |
| `ExtraFields.php` | 965 | `ExtraFields` | Custom fields per data item type | 8 | core |
| `FileCompressor.php` | 1,577 | `ZipFileCreator`, `ZipFileExtractor`, `FileCompressorUtility` | Pure-PHP ZIP for backups/demo data | 2 | active |
| `FileUtility.php` | 610 | `FileUtility` | File types, safe names, upload paths | 12 | core |
| `GraphGenerator.php` | 455 | 6 graph/CAPTCHA classes | Images via Artichow | 1 | active (PHP 8 fatal via Artichow) |
| `Graphs.php` | 304 | `Graphs` | Graph data/URL helpers | 4 | active |
| `HashUtility.php` | 152 | `HashUtility` | File CRC32 | 1 | active |
| `History.php` | 299 | `History` | Change history per data item | 8 | core |
| `Hooks.php` | 75 | `Hooks` | Hook code from `$_SESSION['hooks']` for `eval` | 11 | core |
| `HttpLogger.php` | 132 | `HTTPLogger` | Feed hit logging (`http_log`) | 1 | active |
| `ImportUtility.php` | 92 | `ImportUtility` | Bulk-import directory listing | 2 | active |
| `ImportableEntity.php` | 28 | `ImportableEntity` | Import adapter base | 3 | active |
| `InfoString.php` | 449 | `InfoString` | Hover info strings | 4 | active |
| `InstallationTests.php` | 904 | `InstallationTests` | Environment checks for installer/`installtest.php` | 2 | active |
| `JavaScriptCompressor.php` | 121 | `JavaScriptCompressor` | JS minifier | 0 | dead |
| `JobOrderStatuses.php` | 154 | `JobOrderStatuses` | Job-order status groups | 5 | core |
| `JobOrderTypes.php` | 41 | `JobOrderTypes` | Job type labels | 2 | core |
| `JobOrders.php` | 1,294 | `JobOrders`, `JobOrdersDataGrid` | Job-order gateway; `add()` via `JobOrderRepository` | 16 | core |
| `LDAP.php` | 142 | `LDAP` | LDAP bind/search | 1 | core (conditional) |
| `License.php` | 730 | `License`, `LicenseUtility` | Legacy licence decoding; checks return `true` | 5 | core |
| `ListEditor.php` | 293 | `ListEditor` | Editable dropdown helpers | 5 | core |
| `LoginActivity.php` | 193 | `LoginActivityPager` | Login history pager | 1 | active |
| `MRU.php` | 306 | `MRU` | Recently used items (session) | 2 | core |
| `Mailer.php` | 517 | `Mailer`, `MailerSettings` | PHPMailer wrapper, `email_history` | 6 | core |
| `ModuleUtility.php` | 576 | `ModuleUtility` | Module discovery/loading, hooks, migrations | 3 | core |
| `NewVersionCheck.php` | 227 | `NewVersionCheck` | Phone-home to `www.catsone.com:80` | 3 | active |
| `Pager.php` | 509 | `Pager` | Pre-DataGrid pager | 5 | core |
| `ParseUtility.php` | 208 | `ParseUtility` | Resfly SOAP client | 4 | core |
| `Pipelines.php` | 741 | `Pipelines` | Pipeline and status changes (sends mail) | 13 | core |
| `Profile.php` | 1,219 | `Profile` | Field "profile" store (only for `Display.php`) | 1 | dead |
| `Questionnaire.php` | 737 | `Questionnaire` | Career-portal questionnaires | 5 | active |
| `QueueProcessor.php` | 658 | `QueueProcessor` | Queue scheduling/execution | 2 | core (via `SystemUtility`) |
| `ResultSetUtility.php` | 234 | `ResultSetUtility` | Result-set helpers | 9 | core |
| `SavedLists.php` | 617 | `SavedLists` | Saved lists gateway | 7 | core |
| `Search.php` | 2,096 | 9 search classes | All search features (LIKE/REGEXP/Sphinx) | 7 | active |
| `Session.php` | 1,257 | `CATSSession` | Session object: login, user/site state, ACL, MRU, grid prefs | 3 | core |
| `Site.php` | 240 | `Site` | Sites; `getFirstSiteID()` | 12 | core |
| `Statistics.php` | 1,058 | `Statistics` | Report/dashboard counts | 4 | active |
| `StringUtility.php` | 730 | `StringUtility` | String validation/formatting | 25 | core |
| `SystemInfo.php` | 136 | `SystemInfo` | `system` table (UID, version check) | 4 | core |
| `SystemUtility.php` | 91 | `SystemUtility` | OS detection; scheduler status | 5 | core |
| `Tags.php` | 280 | `Tags` | Candidate tags | 2 | active |
| `Template.php` | 141 | `Template` | PHP-include template engine | 2 | core |
| `TemplateUtility.php` | 1,245 | `TemplateUtility` | Page chrome, tabs, footer, HTML helpers | 5 | core |
| `UserInterface.php` | 435 | `UserInterface` | Module UI base class | 2 | core |
| `Users.php` | 1,257 | `Users` | Accounts, MD5 login, LDAP, login history | 5 | core |
| `VCard.php` | 390 | `VCard` | vCard 2.1 | 2 | active |
| `WebForm.php` | 1,619 | `WebForm` | Form builder with embedded JS (Settings) | 2 | active |
| `Width.php` | 29 | `Width` | Grid column width value object | 8 | core |
| `Wizard.php` | 102 | `Wizard` | Wizard pages (incl. PHP code) in session | 1 | active |
| `XmlJobExport.php` | 224 | `XmlTemplate` | XML feed templates and rendering | 1 | active |
| `ZipLookup.php` | 82 | `ZipLookup` | ZIP → city/state via Google; distance SQL via local `zipcodes` | 1 | active |

Non-PHP files in `lib/`: `IFrameBlank.html`, `mime.types` (used by `Attachments`), `datagrid/FilterArea.tpl` (first-party).

### R6. Vendored third-party code

| Path | Upstream / version | Size | Used by | Local changes | PHP 8 |
|---|---|---|---|---|---|
| `lib/artichow/` | Artichow (PHP 4/5 era) | 40 files, 13,377 LOC | `lib/GraphGenerator.php:36-45` | CATS-specific plot classes | `AntiSpam.class.php:63` parse error |
| `lib/fpdf/` | FPDF 1.53 (`fpdf.php:16`) | 34 files, 2,232 LOC | `modules/reports/ReportsUI.php:414` | magic-quotes guards | `fpdf.php:434` parse error; `each()` `:1285` |
| `lib/simpletest/` | SimpleTest 1.1.0 | 131 files, 31,112 LOC | `modules/tests/TestsUI.php:42-45` | — | deprecations; intended fixture parse error |
| `lib/sphinx/` | Sphinx API 2007 (GPL) + sample configs | 9 files, 679 LOC | `lib/Search.php:37-40` when `ENABLE_SPHINX` | — | parses |
| `js/jquery-1.3.2.min.js` | jQuery 1.3.2 | 1 file | every page (`TemplateUtility.php:1194`) | — | n/a |
| `js/submodal/` | subModal (subimage.com) | 3 files | every page (`TemplateUtility.php:1193`) | — | n/a |
| `js/sorttable.js`, `js/calendarDateInput.js`, `js/sweetTitles.js` | Stuart Langridge (modified), Jason Moon, Dustin Diaz (CC BY-SA 2.5) | 3 files | various templates | sorttable modified by Cognizo | n/a |
| `vendor/` (Composer, not committed) | `phpmailer/phpmailer` v6.8.0, `ckeditor/ckeditor` 4.25.1 | — | `lib/Mailer.php:43`, editor pages | — | CKEditor refuses to start without licence (RT-07) |

### R7. Include and dependency graph

- **Bootstrap closure** (static walk, re-run): `index.php` → 49 files / 29,276 LOC (upper bound; includes conditional `LDAP.php` and `notinstalled.php`); `QueueCLI.php` → 46 / 28,668; `ajax.php` → 10 / 4,451 before the handler.
- **Most included:** `StringUtility` 25, `DateUtility` 19, `Candidates` 18, `Companies` 17, `ActivityEntries` 17, `JobOrders` 16, `Attachments` 15, `DatabaseConnection` 14, `Pipelines`/`Contacts`/`CommonErrors` 13, `Site` 12, `FileUtility` 12, `Hooks`/`CATSUtility` 11.
- **Hub edges:** `TemplateUtility` → `Candidates` at file scope (`:39`), which pulls `Attachments`, `DataGrid`, `ExtraFields`, `History`, `Pipelines`, `SavedLists`; `Calendar` → `Companies`, `Candidates`, `JobOrders`, `Contacts`, `Mailer` (`lib/Calendar.php:44-48`); `Companies` → `JobOrders`, `Contacts`, `Attachments`, `EmailTemplates`; `Users` → `LDAP` (conditional), `License`; `SystemUtility` → `QueueProcessor`.
- **Cycles:** `Calendar` ↔ `JobOrders` (`lib/JobOrders.php:44`); `Calendar` ↔ `Contacts` (`lib/Contacts.php:35`); `Calendar` → `Companies` → `JobOrders` → `Calendar`; `Mailer` → `Pipelines`, which uses `Mailer` without including it (`lib/Pipelines.php:371`).
- **Composer autoload** is loaded by cwd-relative includes at `lib/TemplateUtility.php:38`, `lib/Companies.php:2`, `lib/JobOrders.php:2`, `lib/Mailer.php:43` (`require`) and four `Show.tpl` files; nothing in `lib/` is autoloaded.
- **Widest module fan-out** (lib files included): `joborders` 24, `candidates` 23, `settings` 23, `companies` 16, `contacts` 15, `lists` 15, `import` 15, `careers` 15.

### R8. Dead and legacy code inventory

| Item | Evidence | Status |
|---|---|---|
| `lib/ControlPanel.php`, `CBFUtility.php`, `DefaultQuestionnaires.php`, `JavaScriptCompressor.php`, `Encryption.php`, `Display.php` + `Profile.php` (4,181 LOC) | No includers or class references outside themselves | Dead (M01) |
| `modules/tests/` + `lib/simpletest/` | Replaced by PHPUnit/Behat (CHANGELOG #123); still discovered on every new session (`TestsUI.php:41-45`; RT-02) | Legacy, live |
| `modules/toolbar/` | "only available to CATS Professional users" (`ToolbarUI.php:114-119`) | Legacy (API-009) |
| Licence / Professional machinery | `lib/License.php:580-591,658-706`; `TemplateUtility.php:842-848`; `modules/settings/Professional.tpl`; `lib/CommonErrors.php:74-88` | Neutered but active (ARCH-019) |
| Phone-home and remote services | `lib/NewVersionCheck.php:122`; `wsdl/*.wsdl`; `installwizard.php` links to catsone.com | Legacy (API-010, SEC-017) |
| Hosted/ASP multi-site code | `lib/Session.php:200-212`, `:939`; `index.php:246-250`; `db/cats_schema.sql:858` | Legacy (ARCH-013) |
| Unimplemented hook points | 241 of 251 names | Dead extension points (ARCH-004) |
| Demo mode | `config.php:177,196-197`; `ACCESS_LEVEL_DEMO`; `isDemo()` checks | Legacy, still wired |
| SVN-era tooling | `lib/CATSUtility.php:98-132` (`.svn/entries`); `scripts/svnkeywords.sh`; `$Id:` headers | Legacy |
| `rebuild_old_docs.php` | Header: one-off 2011 patch for ≤ 0.9.2 | One-off script in web root |
| `db/upgrade-0.5.0…0.9.5*.sql` | Used only by the installer upgrade path (`modules/install/ajax/ui.php:899-924`) | Legacy; fails on demo data (RT-01) |
| `Schema.php` `PHP:` steps with `mysql_*` | `modules/install/Schema.php:725,854,1236` | Fatal on PHP ≥ 7 (RT-01) |
| Empty files | `ajax/getReportHTML.php`, `modules/careers/Openings.tpl`, `modules/careers/SearchOpenings.tpl`; placeholders `attachments/index.php`, `js/index.php`, `scripts/index.php`, `temp/empty`, `reports/index.html` | Dead / placeholders |
| Duplicate queue files | `modules/queue/tasks.php`, `modules/queue/tasks/lib/Task.php` | Never loaded (M03) |
| `Template::addFilter()`, `ajax.php` `$filters` | No callers; never populated | Dead mechanisms |
| `.github/workflow/*.yml`, `.travis.yml`, `ci/package-code.sh` | Singular directory; Travis variables | Inactive CI (inferred) |
| `lib/sphinx/conf/old/sphinx-{fs1,www}.conf` | Hosted-CATS server configs | Legacy (M04) |

---

## Area-level unknowns

1. **External users of legacy parts.** Whether any installation still uses the toolbar, Resfly parsing, Sphinx or the optional-update fork. Validate with field data.
2. **Hidden dynamic loading.** Whether third-party plug-ins load "dead" classes by name. Validate with a survey of extensions (none are in the repository).
3. **History of committed credentials.** Who added the hosted-service configs and whether the credentials were ever valid. Validate from git history and the original maintainers.
4. **Licence compatibility** of the GPL Sphinx client and CC BY-SA `sweetTitles.js` with CPL 1.1a. Validate with legal review.

## Changes from the Phase 0 edition

- **Format:** the five map findings now use the shared finding template with confirmation levels; a Summary table and counts were added.
- **Re-rated:** ARCH-M04 HIGH → MEDIUM (credentials target private hosts of the defunct hosted service; consistent with SEC-018).
- **Corrected counts:** first-party `lib/*.php` is 81 files (Phase 0 header said 83); `db/*.sql` is 8 files / 45,157 lines (Phase 0 counted 9 files / 45,472 including the `.bak` archive); `modules/` text LOC 54,249 with the stated extension list; `Attachments.php`, `FileUtility.php` and `ListEditor.php` includer counts are 15/12/5 when string-embedded includes in `Schema.php` are counted; hook names 251 (241 unimplemented); `robots.txt` commit is `ae4e93c`.
- **Corrected facts:** `lib/ZipLookup.php`'s header ("Google API Zip Code Lookup") is accurate for `getCityStateByZip()`; the file also builds local-table distance SQL (Phase 0 called the header wrong). `.github/` has 5 product files; `preview.yml` is audit tooling.
- **Security hygiene:** plaintext credential values quoted in Phase 0 (ARCH-M04) are no longer reproduced.
- **Confirmed unchanged:** per-module LOC, per-file `lib/` LOC, the 49-file / 29,276-LOC bootstrap closure, dead-file list (4,181 LOC).
