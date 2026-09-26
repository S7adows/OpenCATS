# OpenCATS — Codebase Map

**Scope.** This is a navigable inventory of the repository at commit `d607279`. It lists every top-level directory and root file, every module under `modules/`, and every first-party file in `lib/`. For each it gives purpose, LOC, main classes and dependencies. Third-party code bundled in the repo is marked as vendored. It ends with an include/dependency graph summary and a list of dead or legacy code with evidence. How the pieces interact at runtime is described in `ARCHITECTURE.md`; this map covers only what exists and where.

## Method

- **LOC:** `wc -l` on files; directory totals sum `*.php, *.tpl, *.js, *.sql, *.sh, *.yml, *.css, *.wsdl, *.md, *.feature, *.conf, *.html, .htaccess, *.awk`. Binary images are counted as files only.
- **Classes:** `grep -oE "^\s*(abstract )?class X"` per file.
- **Responsibilities:** taken from each file's header docblock and class/method signatures (first methods read with `awk`). Several headers are mislabeled and are corrected below.
- **Dependencies:** `grep -oE "lib/[A-Za-z]+\.php"` in each module, plus an include count of how many files `include`/`require` each lib file. The include-closure numbers come from a static Python walk that is read-only.
- **"Dead" status** comes from a grep for class and file references across `*.php`, `*.tpl` and `*.js`. It is labelled INFERENCE wherever runtime reachability cannot be proven statically.

## Summary of Findings

| ID | Title | Severity |
|---|---|---|
| ARCH-M01 | ~5k LOC of first-party `lib/` files and whole modules have no references (dead code) | MEDIUM |
| ARCH-M02 | Vendored, locally patched third-party libraries (artichow, fpdf 1.53, SimpleTest 1.1.0, Sphinx API 2007, jQuery 1.3.2) in `lib/` and `js/`, some not parseable on PHP 8 and one GPL-licensed | HIGH |
| ARCH-M03 | Duplicate or forked copies of core files (queue tasks, `Task.php`, `Search.php`, `config.php`) | MEDIUM |
| ARCH-M04 | Hosted-CATS / SVN-era artifacts with hard-coded hosts and credentials in `scripts/` and `lib/sphinx/conf/` | HIGH |
| ARCH-M05 | Mislabeled headers and class/file-name mismatches hinder navigation | LOW |

(The main architectural findings, ARCH-001…ARCH-025, are in `ARCHITECTURE.md`.)

---

## 1. Repository at a Glance

| Area | Files | LOC | Notes |
|---|---|---|---|
| All PHP (`*.php`, excl. `.git`) | 355 | 137,356 | — |
| PHP outside `lib/` | — | 43,253 | modules 31,118; root 2,138; ajax 1,862; src 3,903; test/other rest |
| First-party `lib/*.php` | 83 | 46,703 | — |
| Vendored PHP under `lib/*/` | — | ~47,400 | artichow 13,377; simpletest 31,112; fpdf 2,232; sphinx 679 |
| Templates (`*.tpl`) | 136 | 16,914 | 134 in `modules/`, `Error.tpl`, `lib/datagrid/FilterArea.tpl` |
| JavaScript (all) | — | 16,296 | `js/` 11,564 incl. jQuery 1.3.2 min |
| SQL (`db/`) | 9 | 45,472 | of which `upgrade-zipcodes.sql` is 42,847 |

## 2. Root Files

| File | LOC | Purpose | Notes |
|---|---|---|---|
| `index.php` | 276 | Main front controller: install gate, bootstrap, session, dispatch to modules | See ARCHITECTURE §3. Calls `get_magic_quotes_runtime()` at `:93` (removed in PHP 8). |
| `ajax.php` | 138 | AJAX dispatcher: `f=name` → `ajax/name.php`, `f=mod:name` → `modules/mod/ajax/name.php` | `:77-92`. Each handler does its own auth. |
| `config.php` | 500 | 82 `define()`s: DB, mail, LDAP, paths, flags, license key; commented ACL/job-status examples | Rewritten at runtime by `CATSUtility::changeConfigSetting`. |
| `constants.php` | 297 | Version `0.9.7.4`, core module order, access levels, data item types, statuses, time zones, bad extensions | — |
| `installwizard.php` | 551 | Installer UI (7 steps) driving `ajax.php?f=install:ui` | Links to `catsone.com/resumeIndexingSoftware.php` (`:145`). |
| `installtest.php` | 186 | Stand-alone environment test page | No auth, no `INSTALL_BLOCK` check. |
| `QueueCLI.php` | 124 | Cron runner for the queue processor | Web-reachable, no CLI guard. |
| `rebuild_old_docs.php` | 66 | One-off 2011 re-index of RTF/DOCX/ODT attachment text | Raw `mysqli_*`, `addslashes` SQL, no auth. |
| `Error.tpl` | 12 | Fatal error template used by `ModuleUtility::_fatal` | — |
| `main.css`, `ie.css`, `not-ie.css`, `careersPage.css` | 1,379 / 31 / 31 / 59 | Global styles; IE conditional; careers page | — |
| `composer.json` / `composer.lock` | 21 / — | PSR-4 `OpenCATS\\` → `src/OpenCATS/`; runtime deps `phpmailer/phpmailer` (locked v6.8.0), `ckeditor/ckeditor` (4.25.1); dev: PHPUnit 7.5.7, Behat 3.0.15, Mink | No `php` platform constraint. |
| `.htaccess` | 3 | `IndexIgnore *`, `Options -Indexes` | Only root-level Apache protection. |
| `robots.txt` | 19 | Disallow all except `/careers/` and static assets | Added recently (commit `ca971b1`). |
| `.travis.yml` | 38 | Legacy Travis CI (PHP 7.2/8.0/8.2) + GitHub release deploy | Superseded by `.github/workflows/ci.yml` (INFERENCE). |
| `README.md`, `README-testing.md`, `CHANGELOG.MD` (1,531), `Security.MD`, `LICENSE.md` (CPL 1.1a), `issue_template.md` | — | Documentation | CHANGELOG top entry is 0.9.3-3 (2016) while `CATS_VERSION` is 0.9.7.4. |

## 3. Top-Level Directories

| Directory | Files | LOC | Purpose | Key files | Notes |
|---|---|---|---|---|---|
| `.github/` | 5 | 193 | CI/CD and bots | `workflows/ci.yml` (tests on PHP 7.2; release zip), `dependabot.yml`, `no-response.yml`, `workflow/needs-reply*.yml` | `workflow/` (singular) is **not** a directory GitHub reads workflows from; those two files never run (INFERENCE from GitHub conventions). |
| `ajax/` | 21 | 1,862 | Core AJAX handlers included by `ajax.php` | `getPipelineJobOrder.php` (the largest), `editActivity.php`, `deleteActivity.php`, `getDataGridPager.php`, `testEmailSettings.php` | 18 use `SecureAJAXInterface` (login check only); `getParsedAddress.php` and `zipLookup.php` are public; `getReportHTML.php` is 0 bytes. |
| `attachments/` | 2 | 8 | Runtime storage root for uploaded files (`site_N/NNNxxx/<md5>/file`) | `.htaccess` (script-exec disabled, extension allow-list), `index.php` (0 bytes) | Git-ignored content (`.gitignore:8`). |
| `careers/` | 1 | 41 | Public careers-portal URL shim → root `index.php` with `$careerPage=true` | `index.php` | Includes the file named by `PHP_SELF` (ARCH-022). |
| `ci/` | 1 | 11 | Travis packaging script | `package-code.sh` (runs `composer install --no-dev`, tar/zip) | Legacy. |
| `db/` | 9 | 45,472 | Schema, demo data, legacy upgrades | `cats_schema.sql` (1,188 lines, 55 MyISAM tables), `cats_testdata.bak` (ZIP of demo data, used by installer `modules/install/ajax/ui.php:786`), `upgrade-0.5.0…0.9.5*.sql` (used by installer upgrade path `ui.php:899-923`), `upgrade-zipcodes.sql` (US ZIPs) | Web-accessible static files unless the web server blocks them. |
| `docker/` | 2 | 108 | Dev and test compose stacks | `docker-compose.yml` (nginx + php 7.2 fpm + mariadb + phpMyAdmin), `docker-compose-test.yml` (+ second MariaDB + Selenium) | No Dockerfile. |
| `images/` | 301 | — | UI images (2.3 MB) | icons, `careers_*.gif`, `add_licenses.jpg`, `CATS-powered.gif` | Several are Professional/licensing leftovers (`add_licenses.jpg`). |
| `js/` | 42 | 11,577 | Global client-side JS | `lib.js` (core helpers), `activity.js`, `dataGrid.js`, `calendarDateInput.js` (3rd-party, Jason Moon), `sorttable.js` (3rd-party, Stuart Langridge, modified), `sweetTitles.js` (3rd-party, Dustin Diaz, CC-BY-SA), `jquery-1.3.2.min.js` (vendored), `submodal/subModal.js` (vendored, subimage.com), `index.php` (0 bytes) | See ARCHITECTURE §15. |
| `lib/` | 298 | 106,564 | First-party library classes (83 files) + vendored libraries | See §5 and §6 | No `.htaccess`; files are directly requestable. |
| `modules/` | 236 | 53,887 | 23 feature modules (`<Name>UI.php` + `.tpl` + JS) | See §4 | — |
| `optional-updates/` | 4 | 2,820 | Manual drop-in "latest Sphinx" update | `latest-sphinx-search/Search.php` (fork of `lib/Search.php`, 2,487 LOC, CRLF), `config.php` (stale fork of `config.php`), `sphinx.conf`, `README.MD` | Uses `create_function` (removed PHP 8). |
| `reports/` | 1 | 0 | CI report output dir (`index.html` placeholder) | — | `ci.yml:51` writes JUnit here. |
| `rss/` | 1 | 40 | RSS URL shim | `index.php` | Broken: uses `LEGACY_ROOT` before config (`:37`). |
| `scripts/` | 14 | 921 | Maintenance scripts from hosted CATS | `makeBackup.php` (CLI/web backup), `sphinxtest.php`, `sphinx_{reindex,rotate,restart,update_delta}.sh`, `storeDeletedAttachments.sh`, `mysql_get_prod_db.sh`, `svnkeywords.sh`, `newversion.sh`, `countcode.sh`, `countfilecode.awk`, `killwhitespace.sh`, `index.php` (0 bytes) | Hard-coded `catsone.com`/`cognizo.com` paths and credentials (ARCH-M04). |
| `src/` | 24 | 3,903 | PSR-4 `OpenCATS\` namespace | `Entity/{Company,CompanyRepository,JobOrder,JobOrderRepository}.php`, `UI/QuickActionMenu.php`, `Tests/UnitTests/*` (12), `Tests/IntegrationTests/*` (3) | Used only by `Companies::add`, `JobOrders::add` and 4 `Show.tpl` (ARCH-012). |
| `temp/` | 1 | 0 | Temp dir (`CATS_TEMP_DIR`) | `empty` marker | Git-ignored. |
| `test/` | 16 | 5,369 | Behat/Mink functional + security suites, test DB data | `behat.yml`, `features/*.feature` (7), `features/bootstrap/{Feature,Security}Context.php`, `data/test.sql`, `data/securityTests.sql`, `config.php` (test config), `runAllTests.sh`, `scripts/securityTestData.sh` | `test/config.php` has drifted from `config.php`. |
| `upload/` | 1 | 10 | Upload staging dir (mass import) | `.htaccess` | Not actually git-ignored: `.gitignore:10` lists `uploads/*` but the directory is `upload/` (spelling mismatch). |
| `wsdl/` | 3 | 225 | SOAP definitions for external services | `parse.wsdl`, `status.wsdl` (→ `http://soap.resfly.com`), `keyCheck.wsdl` (→ `http://catsone.com`) | Resfly parsing is disabled by default (`PARSING_ENABLED false`); `keyCheck.wsdl` has no consumer. |
| `xml/` | 1 | 41 | XML job-feed URL shim | `index.php` | — |

## 4. Modules (`modules/`, 23 directories)

Every module has one `<Name>UI.php` extending `UserInterface`, discovered by `ModuleUtility::_refreshModuleList`. "Auth" is the module's `_authenticationRequired` flag. LOC is given as PHP / TPL / JS.

| Module | Purpose | LOC (php/tpl/js) | Key files (LOC) | Main classes | Actions (`a=`) | lib/ dependencies (from includes) | Auth |
|---|---|---|---|---|---|---|---|
| `activity` | Activity log listing by period | 616 / 158 / 64 | `ActivityUI.php` (340), `dataGrids.php` (276) | `ActivityUI`, `ActivityDataGrid` | `viewByDate`, `listByViewDataGrid` | ActivityEntries, Candidates, Contacts, DateUtility, Hooks, InfoString, StringUtility, Width | yes |
| `attachments` | Streams attachment files | 149 / 0 / 0 | `AttachmentsUI.php` (149) | `AttachmentsUI` | `getAttachment` | Attachments, CommonErrors | yes |
| `calendar` | Calendar UI and event reminders task | 948 / 644 / 2,062 | `CalendarUI.php` (760), `Calendar.tpl` (619), `Calendar.js` (1,395), `CalendarUI.js` (568), `tasks/Reminders.php` (147), `tasks/tasks.php` | `CalendarUI`, `Reminders` | `addEvent`, `editEvent`, `dynamicData`, `deleteEvent`, `showCalendar` | Calendar, DateUtility, SystemUtility, `modules/queue/lib/Task.php` | yes |
| `candidates` | Candidate CRUD, search, pipelines, attachments, duplicates, e-mail | 3,717 / 3,396 / 430 | `CandidatesUI.php` (3,582), `Show.tpl` (635), `Add.tpl` (531), `Edit.tpl` (400), `validator.js` (338), `AddActivityChangeStatusModal.tpl` (295), `dataGrids.php` | `CandidatesUI`, `candidatesListByViewDataGrid`, `candidatesSavedListByViewDataGrid` | 38 incl. `show`, `add`, `edit`, `delete`, `search*`, `viewResume`, `addToPipeline`, `addActivityChangeStatus`, `createAttachment`, `emailCandidates`, `merge`, `linkDuplicate`, `listByView` | ActivityEntries, Attachments, Calendar, Candidates, CommonErrors, DatabaseSearch, DateUtility, DocumentToText, EmailTemplates, Export, ExtraFields, FileUtility, JobOrders, License, ParseUtility, Pipelines, Questionnaire, ResultSetUtility, SavedLists, Search, StringUtility, Tags, Width | yes |
| `careers` | Public careers portal (job list, apply, candidate login/profile) rendered from DB templates | 1,794 / 140 / 0 | `CareersUI.php` (1,794), `Blank*.tpl`; `Openings.tpl`/`SearchOpenings.tpl` are 0 bytes | `CareersUI` | driven by `p=` (showAll, showJob, applyToJob, …) | ActivityEntries, Candidates, CareerPortal, CommonErrors, Companies, Contacts, DatabaseConnection, DatabaseSearch, DocumentToText, FileUtility, JobOrders, ParseUtility, Questionnaire, Site, Users | **no** |
| `companies` | Company CRUD, attachments, internal postings | 1,375 / 1,106 / 163 | `CompaniesUI.php` (1,224), `Show.tpl` (408), `Edit.tpl` (255), `dataGrids.php` (151) | `CompaniesUI`, `CompaniesListByViewDataGrid`, `companiesSavedListByViewDataGrid` | `show`, `internalPostings`, `add`, `edit`, `delete`, `search`, `createAttachment`, `deleteAttachment`, `listByView` | Attachments, CommonErrors, Companies, Contacts, DateUtility, DocumentToText, Export, ExtraFields, FileUtility, Hooks, JobOrders, ListEditor, ResultSetUtility, Search, StringUtility, Width | yes |
| `contacts` | Contact CRUD, cold-call list, vCard | 1,708 / 1,336 / 196 | `ContactsUI.php` (1,563), `Show.tpl` (306), `Edit.tpl` (286) | `ContactsUI`, `ContactsListByViewDataGrid`, `contactSavedListByViewDataGrid` | `show`, `add`, `edit`, `delete`, `search`, `addActivityScheduleEvent`, `showColdCallList`, `downloadVCard`, `listByView` | ActivityEntries, Calendar, CommonErrors, Companies, Contacts, DateUtility, Export, ExtraFields, Hooks, JobOrders, ResultSetUtility, Search, StringUtility, VCard, Width | yes |
| `export` | CSV export of selected rows | 155 / 0 / 0 | `ExportUI.php` | `ExportUI` | `exportByDataGrid`, `export` | CommonErrors, Export | yes |
| `graphs` | PNG charts (artichow) and captcha | 632 / 0 / 0 | `GraphsUI.php` | `GraphsUI` | public: `testGraph`, `wordVerify`, `jobOrderReportGraph`, `generic`, `genericPie`; logged-in: `activity`, `newCandidates`, `newJobOrders`, `newSubmissions`, `miniPlacementStatistics`, `miniJobOrderPipeline` | CommonErrors, Dashboard, DateUtility, GraphGenerator, Graphs, Statistics | **no** (partly checks login at `:101`) |
| `home` | Dashboard, quick search, saved searches | 793 / 362 / 0 | `HomeUI.php` (381), `dataGrids.php` (412), `SearchEverything.tpl` | `HomeUI`, `CallsDataGrid`, `ImportantPipelineDashboard` | `quickSearch`, `deleteSavedSearch`, `addSavedSearch`, `getAttachment`, `home` | ActivityEntries, Attachments, CommonErrors, Dashboard, Hooks, InfoString, NewVersionCheck, Pipelines, Search, StringUtility, Width | yes |
| `import` | CSV import (candidates/companies/contacts), bulk resume import, revert | 2,680 / 1,521 / 277 | `ImportUI.php` (2,104), `Import.php` (487), `MassImportEdit.tpl` (304), `import.js` | `ImportUI`, `Import`, `JobOrdersImport` | `revert`, `viewerrors`, `viewpending`, `importSelectType`, `importUploadFile`, `massImport*`, `importBulkResumes`, `deleteBulkResumes`, `import` | Attachments, Candidates, CandidatesImport, Companies, CompaniesImport, Contacts, ContactsImport, DatabaseSearch, ExtraFields, FileUtility, ImportUtility, JobOrders, ParseUtility, Statistics, StringUtility | yes |
| `install` | Core DB migrations holder + installer AJAX backend + backup/restore helpers | 3,346 / 0 / 0 | `Schema.php` (1,336; 364 versions, 25 `PHP:`), `ajax/ui.php` (1,171), `backupDB.php` (283), `ajax/maint.php`, `ajax/attachmentsReindex.php`, `ajax/attachmentsToThreeDirectory.php`, `OptionalComponents.php`, `notinstalled.php`, `phpVersion.php`, `scripts/114.php`, `scripts/150.php`, `scripts/359.sql`, `testdocs/*` | `CATSUI` (empty `handleRequest`), `CATSSchema` | none | Attachments, CATSUtility, DatabaseConnection, FileCompressor, FileUtility, InstallationTests, ListEditor, ModuleUtility, SystemUtility | **no** |
| `joborders` | Job order CRUD, pipeline management, attachments | 2,128 / 1,565 / 341 | `JobOrdersUI.php` (1,972), `Show.tpl` (427), `Edit.tpl` (345), `Add.tpl` (322) | `JobOrdersUI`, `JobOrdersListByViewDataGrid`, `joborderSavedListByViewDataGrid` | 16 incl. `show`, `add`, `edit`, `delete`, `search`, `considerCandidateSearch`, `addToPipeline`, `removeFromPipeline`, `setCandidateJobOrder`, `listByView` | ActivityEntries, Attachments, Candidates, CareerPortal, CommonErrors, Companies, DateUtility, DocumentToText, EmailTemplates, Export, ExtraFields, FileUtility, Graphs, Hooks, InfoString, JobOrderStatuses, JobOrderTypes, JobOrders, Pipelines, Questionnaire, ResultSetUtility, Search, StringUtility, Width | yes |
| `lists` | Saved (static) lists | 978 / 237 / 0 | `ListsUI.php` (378), `dataGrids.php` (202), `ajax/{addToLists,newList,editListName,deleteList}.php` | `ListsUI`, `ListsDataGrid` | `show`, `showList`, `quickActionAddToListModal`, `addToListFromDatagridModal`, `removeFromListDatagrid`, `deleteStaticList`, `listByView` | ActivityEntries, Attachments, Companies, Contacts, DateUtility, Export, ExtraFields, FileUtility, Hooks, JobOrders, ListEditor, ResultSetUtility, SavedLists, StringUtility, Width | yes |
| `login` | Login, forgot password, first-login wizard pages | 511 / 494 / 84 | `LoginUI.php` (511), `Login.tpl`, `wizard/*.tpl` (9) | `LoginUI` | `attemptLogin`, `forgotPassword`, `noCookiesModal`, `showLoginForm` | License, Mailer, NewVersionCheck, Site, SystemInfo, Wizard | **no** |
| `queue` | Asynchronous task framework (tasks + samples) | 729 / 0 / 0 | `tasks/tasks.php`, `tasks/CleanExceptions.php`, `tasks/SampleRecurring.php`, `tasks/SampleTask.php`, `lib/Task.php`, `tasks/lib/Task.php` (dup), `tasks.php` (dup), `constants.php`, `QueueUI.php` (stub) | `QueueUI`, `Task`, `CleanExceptions`, `SampleRecurring` | none | `modules/queue/lib/Task.php` | yes |
| `reports` | EEO, submission, placement, job order (PDF) reports | 725 / 1,246 / 0 | `ReportsUI.php` (725), `Reports.tpl`, `NewDataItems.tpl`, `EEOReport.tpl`, `JobOrderReport.tpl` | `ReportsUI` | `graphView`, `generateJobOrderReportPDF`, `showSubmissionReport`, `showPlacementReport`, `customizeJobOrderReport`, `customizeEEOReport`, `generateEEOReportPreview`, `reports` | Candidates, CommonErrors, DateUtility, Statistics (+ `lib/fpdf/fpdf.php` at `ReportsUI.php:414`) | yes |
| `rss` | Public RSS job feed | 159 / 0 / 0 | `RssUI.php` | `RssUI` | `jobOrders` | ActivityEntries, DateUtility, JobOrders, Site, StringUtility | **no** |
| `settings` | Administration: users, career portal, e-mail templates, extra fields, backups, tags, EEO, license, wizard AJAX | 4,149 / 4,406 / 488 | `SettingsUI.php` (3,842), `CustomizeExtraFields.tpl` (540), `CareerPortalQuestionnaire.tpl` (380), `Professional.tpl` (327), `ajax/backup.php` (307), `Administration.tpl` (278) | `SettingsUI` | 51 incl. `manageUsers`, `addUser`, `editUser`, `createBackup`, `careerPortal*`, `emailTemplates`, `customizeExtraFields`, `professional`, `getFirefoxModal`, `ajax_wizard*`, `administration`, `myProfile` | Attachments, BrowserDetection, Candidates, CareerPortal, CommonErrors, Companies, Contacts, EmailTemplates, FileCompressor, Graphs, History, ImportUtility, License, ListEditor, LoginActivity, Mailer, NewVersionCheck, Pipelines, Questionnaire, Site, SystemUtility, Tags, WebForm | yes |
| `tests` | Legacy in-app SimpleTest web/AJAX test harness | 3,019 / 86 / 50 | `testcases/AJAXTests.php` (927), `testcases/WebTests.php` (919), `CATSWebTestCase.php` (634), `CATSTestReporter.php`, `TestsUI.php`, `TestCaseList.php`, `ajax/getCandidateJobOrderID.php` | `TestsUI`, `CATSWebTestCase`, `CATSAJAXTestCase`, `CATSTestReporter`, 17 test-case classes | `runSelectedTests`, `selectTests` | ActivityEntries, DatabaseConnection, Pipelines; `lib/simpletest/*` | yes (any logged-in user) |
| `toolbar` | Legacy Firefox toolbar API (CATS Professional) | 288 / 86 / 278 | `ToolbarUI.php`, `toolbarlibForLegacy.js`, `install.tpl` | `ToolbarUI` | `attemptLogin`, `getRemoteVersion`, `getJavaScriptLib`, `authenticate`, `checkEmailIsInSystem`, `storeMonsterResumeText`, `getLicenseKey` | Candidates, DocumentToText, License, Site, SystemInfo | **no** |
| `wizard` | Generic multi-page modal wizard renderer (pages stored in session by `lib/Wizard.php`) | 188 / 93 / 299 | `WizardUI.php`, `Show.tpl`, `wizard.js` | `WizardUI` | `ajax_getPage` | ActivityEntries, CareerPortal, DateUtility, JobOrders, Site, StringUtility | **no** |
| `xml` | Public XML job feeds (Indeed, SimplyHired, RSS templates) | 331 / 0 / 0 (+3 `.xtpl`) | `XmlUI.php`, `xml_templates/{indeed,simplyhired,rss}.xtpl` | `XmlUI` | `jobOrders` | ActivityEntries, CareerPortal, DateUtility, HttpLogger, JobOrders, Site, StringUtility, XmlJobExport | **no** |

Module-level AJAX endpoints (via `ajax.php?f=<module>:<name>`): `import:processMassImportItem`, `install:{ui,maint,attachmentsReindex,attachmentsToThreeDirectory}`, `lists:{addToLists,deleteList,editListName,newList}`, `settings:backup`, `tests:getCandidateJobOrderID`.

## 5. `lib/*.php` — First-Party Library Files (83)

"Incl." is the number of repo files that `include`/`require` the file by path (excluding vendored code and `optional-updates/`). Status: **core** = in the `index.php` bootstrap closure; **active** = referenced by modules; **dead** = no reference found (INFERENCE, see §8).

| File | LOC | Classes | Responsibility (one line) | Incl. | Status |
|---|---|---|---|---|---|
| `ACL.php` | 93 | `ACL` | Resolves access level per secured object and user category from `ACL_SETUP` (only an example in comments, so inert by default) | 1 | core |
| `AJAXInterface.php` | 263 | `AJAXInterface`, `SecureAJAXInterface` | Base for AJAX handlers: XML responses, input helpers; the secure variant starts the session and requires login | 2 | active |
| `ActivityEntries.php` | 553 | `ActivityEntries` | Activity (call/email/meeting) records gateway | 17 | active |
| `AddressParser.php` | 901 | `AddressParser` | Heuristic parser of free-text address blocks (name/phone/email/address) | 2 | active |
| `ArrayUtility.php` | 108 | `ArrayUtility` | Array helpers (`arrayMapKeys` using `eval`) | 3 | core |
| `Attachments.php` | 1,386 | `Attachments`, `AttachmentCreator` | Attachment records, on-disk layout, upload/creation, text extraction trigger, duplicate detection | 14 | core |
| `BrowserDetection.php` | 483 | `BrowserDetection` | User-agent parsing for login history | 3 | active |
| `CATSUtility.php` | 454 | `CATSUtility` | Version/build (SVN), config-file rewriting, URL helpers (`getIndexName`, redirects), SSL helpers | 11 | core (**PHP 8 parse error**) |
| `CBFUtility.php` | 715 | `CBFUtility` | "CATS Backup Format" export/import of site data with GUID remapping | 0 | dead |
| `Calendar.php` | 1,084 | `Calendar`, `CalendarSettings` | Calendar events gateway, upcoming-event HTML, reminder e-mail, calendar settings | 7 | core |
| `Candidates.php` | 2,473 | `Candidates`, `CandidatesDataGrid`, `EEOSettings` | Candidate gateway (CRUD, duplicates, merge), candidate DataGrid column definitions (eval'd HTML), EEO settings | 18 | core |
| `CandidatesImport.php` | 60 | `CandidatesImport` | Import-row adapter for candidates (extends `ImportableEntity`) | 1 | active |
| `CareerPortal.php` | 471 | `CareerPortalSettings` | Career-portal settings and templates (DB-stored) | 5 | active |
| `CommonErrors.php` | 323 | `CommonErrors` | Friendly fatal-error pages by error code (incl. "Upgrade to Professional" text) | 13 | core |
| `Companies.php` | 994 | `Companies`, `CompaniesDataGrid` | Company gateway; `add()` delegates to `OpenCATS\Entity\CompanyRepository` | 17 | core |
| `CompaniesImport.php` | 59 | `CompaniesImport` | Import-row adapter for companies | 1 | active |
| `Contacts.php` | 1,050 | `Contacts`, `ContactsDataGrid` | Contact gateway, departments, cold-call list | 13 | core |
| `ContactsImport.php` | 57 | `ContactImport` (name ≠ file) | Import-row adapter for contacts | 1 | active |
| `ControlPanel.php` | 1,573 | `ControlPanel` | "Seamless MySQL Table Viewer / Editor" (generic table admin UI) | 0 | dead |
| `Dashboard.php` | 272 | `Dashboard` | Home dashboard queries (placements, pipeline data) | 2 | active |
| `DataGrid.php` | 2,649 | `DataGrid` | Generic sortable/filterable/pageable grid: builds SQL, evals column renderers, exports, column prefs | 3 | core (**PHP 8 TypeError** `implode`) |
| `DatabaseConnection.php` | 764 | `DatabaseConnection` | mysqli singleton: connect, query, fetch helpers, escaping, advisory locks, TZ/date query rewriting, pseudo-transactions | 14 | core |
| `DatabaseSearch.php` | 468 | `DatabaseSearch` | Boolean search → SQL REGEXP compiler; Sphinx query conversion; fulltext encode/decode | 6 | core |
| `DateUtility.php` | 747 | `DateUtility` | Date parsing/formatting and validation (uses `strftime`) | 19 | core |
| `DefaultQuestionnaires.php` | 206 | `DefaultQuestionnaireUtility` | Seed questionnaires for career portal | 0 | dead |
| `Display.php` | 233 | `Display` | Profile-driven display rendering (depends on `Profile.php`) | 0 | dead |
| `DocumentToText.php` | 586 | `DocumentToText` | Resume text extraction via antiword/pdftotext/html2text (`exec`) and in-PHP RTF/DOCX/ODT parsing | 8 | core |
| `EmailTemplates.php` | 420 | `EmailTemplates` | E-mail template gateway and tag replacement | 7 | core |
| `Encryption.php` | 114 | `Encryption` | mcrypt wrapper (mcrypt removed in PHP 7.2) | 0 | dead |
| `Export.php` | 173 | `ExportUtility`, `Export` | CSV export form and output | 6 | active |
| `ExtraFields.php` | 965 | `ExtraFields` | Site-defined custom fields per data item type (header mislabeled "Job Orders Library") | 8 | core |
| `FileCompressor.php` | 1,577 | `ZipFileCreator`, `ZipFileExtractor`, `FileCompressorUtility` | Pure-PHP ZIP writer/reader for backups and demo data | 2 | active |
| `FileUtility.php` | 610 | `FileUtility` | File type detection, safe names, unique dirs, upload paths, icons | 11 | core |
| `GraphGenerator.php` | 455 | `GraphSimple`, `GraphPie`, `GraphComparisonChart`, `pipelineStatisticsGraph`, `jobOrderReportGraph`, `WordVerify` | Chart/captcha image generation using vendored artichow | 1 | active (**PHP 8 fatal via artichow**) |
| `Graphs.php` | 304 | `Graphs` | Graph data/URL helpers for dashboard and job order pages | 4 | active |
| `HashUtility.php` | 152 | `HashUtility` | CRC32 of files (for ZIP creation) | 1 | active |
| `History.php` | 299 | `History` | Change-history (audit) records per data item | 8 | core |
| `Hooks.php` | 75 | `Hooks` | Returns hook PHP code from `$_SESSION['hooks']` for `eval` | 11 | core |
| `HttpLogger.php` | 132 | `HTTPLogger` (case ≠ file) | Logs feed HTTP hits per site into `http_log` | 1 | active |
| `ImportUtility.php` | 92 | `ImportUtility` | Directory listing for bulk import | 2 | active |
| `ImportableEntity.php` | 28 | `ImportableEntity` (abstract) | Base for import adapters | 3 | active |
| `InfoString.php` | 449 | `InfoString` | Builds hover "info strings" for data items | 4 | active |
| `InstallationTests.php` | 904 | `InstallationTests` | Environment/DB/converter checks for installer and `installtest.php` | 2 | active |
| `JavaScriptCompressor.php` | 121 | `JavaScriptCompressor` | JS minifier | 0 | dead |
| `JobOrderStatuses.php` | 154 | `JobOrderStatuses` | Job order status groups/filters, overridable via optional `config.php` constants | 5 | core |
| `JobOrderTypes.php` | 41 | `JobOrderTypes` | Job type code → label map (overridable via `JOB_TYPES` class) | 2 | core |
| `JobOrders.php` | 1,294 | `JobOrders`, `JobOrdersDataGrid` | Job order gateway; `add()` delegates to `OpenCATS\Entity\JobOrderRepository` | 16 | core |
| `LDAP.php` | 142 | `LDAP` | LDAP bind/search for `AUTH_MODE` `ldap`/`sql+ldap` | 1 | core (conditional) |
| `License.php` | 730 | `License`, `LicenseUtility` | Legacy license-key decoding; all validity checks hard-wired to `true` | 5 | core |
| `ListEditor.php` | 293 | `ListEditor` | CSV/list helpers for editable dropdowns (header mislabeled "Array Utility Library") | 4 | core |
| `LoginActivity.php` | 193 | `LoginActivityPager` | Paged login history | 1 | active |
| `MRU.php` | 306 | `MRU` | Most-recently-used items list (stored in session) | 2 | core |
| `Mailer.php` | 517 | `Mailer`, `MailerSettings` | PHPMailer wrapper (SMTP/sendmail/mail), e-mail history, mailer settings | 6 | core |
| `ModuleUtility.php` | 576 | `ModuleUtility` | Module discovery, loading, auth flag, hooks collection, schema migrations | 3 | core |
| `NewVersionCheck.php` | 227 | `NewVersionCheck` | Phones home to `www.catsone.com:80` for version/news | 3 | active |
| `Pager.php` | 509 | `Pager` | Older (pre-DataGrid) result pager | 5 | core |
| `ParseUtility.php` | 208 | `ParseUtility` | SOAP client for the Resfly resume-parsing service | 4 | core |
| `Pipelines.php` | 741 | `Pipelines` | Candidate↔job-order pipeline and status changes (sends mail) | 13 | core |
| `Profile.php` | 1,219 | `Profile` | Page/field "profile" customization store (only used by `Display.php`) | 1 | dead |
| `Questionnaire.php` | 737 | `Questionnaire` | Career-portal questionnaires | 5 | active |
| `QueueProcessor.php` | 658 | `QueueProcessor` | Queue task scheduling/execution, cron-string evaluation | 2 | core (via `SystemUtility`) |
| `ResultSetUtility.php` | 234 | `ResultSetUtility` | Find/sort helpers over result-set arrays | 9 | core |
| `SavedLists.php` | 617 | `SavedLists` | Saved list gateway | 7 | core |
| `Search.php` | 2,096 | `SearchUtility`, `SearchCandidates`, `SearchCompanies`, `SearchJobOrders`, `ContactsSearch`, `QuickSearch`, `SavedSearches`, `SearchByResumePager`, `SearchPager` | All search features (LIKE/REGEXP/Sphinx), excerpts, saved searches | 7 | active |
| `Session.php` | 1,257 | `CATSSession` | Session object: login (SQL/LDAP), user/site state, access levels, MRU, grid prefs | 3 | core |
| `Site.php` | 240 | `Site` | Site (tenant) records; `getFirstSiteID` | 12 | core |
| `Statistics.php` | 1,058 | `Statistics` | Report and dashboard counts | 4 | active |
| `StringUtility.php` | 730 | `StringUtility` | String validation/formatting (phones, emails, URLs, names) | 25 | core |
| `SystemInfo.php` | 136 | `SystemInfo` | `system` table: UID, version-check prefs/state | 4 | core |
| `SystemUtility.php` | 91 | `SystemUtility` | OS detection; includes QueueProcessor | 5 | core |
| `Tags.php` | 280 | `Tags` | Candidate tags gateway | 2 | active |
| `Template.php` | 141 | `Template` | Minimal PHP-include template engine | 2 | core |
| `TemplateUtility.php` | 1,245 | `TemplateUtility` | Page chrome (header, tabs, quick search, footer), ratings, misc HTML helpers | 5 | core |
| `UserInterface.php` | 435 | `UserInterface` | Base class for module UIs | 2 | core |
| `Users.php` | 1,257 | `Users` | User accounts, login verification (md5), LDAP integration, access levels, login history | 5 | core |
| `VCard.php` | 390 | `VCard` | vCard generation | 2 | active |
| `WebForm.php` | 1,619 | `WebForm` | Server-side form builder/validator with embedded JS (used by Settings) | 2 | active |
| `Width.php` | 29 | `Width` | Column-width value object for DataGrid | 8 | core |
| `Wizard.php` | 102 | `Wizard` | Stores wizard page definitions (incl. PHP code) in `$_SESSION['CATS_WIZARD']` | 1 | active |
| `XmlJobExport.php` | 224 | `XmlTemplate` (name ≠ file) | Loads `.xtpl` XML feed templates and renders job feeds | 1 | active |
| `ZipLookup.php` | 82 | `ZipLookup` | US ZIP → city/state and distance SQL (header says "Google API") | 1 | active |

Non-PHP files in `lib/`: `IFrameBlank.html` (blank iframe source), `mime.types` (MIME map for `Attachments::fileMimeType`), `datagrid/FilterArea.tpl` (**first-party** DataGrid filter UI template).

## 6. Vendored Third-Party Code (VENDORED — not first-party)

| Path | Upstream / version evidence | Size | Used by | Local modifications | PHP 8 status |
|---|---|---|---|---|---|
| `lib/artichow/` | Artichow (public-domain charting, PHP 4/5 era) (`Artichow.class.php` header) | 40 files, 13,377 LOC PHP | `lib/GraphGenerator.php:36-45` | CATS-specific `BarPlotDashboard.class.php`, `BarPlotPipeline.class.php` | `AntiSpam.class.php:63` parse error; optional-before-required deprecations |
| `lib/fpdf/` | FPDF 1.53 (`fpdf.php:16` `define('FPDF_VERSION','1.53')`) | 34 files, 2,232 LOC | `modules/reports/ReportsUI.php:414` | `function_exists('set_magic_quotes_runtime')` guards added (`fpdf.php:912-928`) | `fpdf.php:434` parse error; `each()` at `:1285`; `get_magic_quotes_runtime` `:911` |
| `lib/simpletest/` | SimpleTest 1.1.0 (`lib/simpletest/VERSION`) | 131 files, 31,112 LOC | `modules/tests/TestsUI.php:43-46` | — | `mock_objects.php:704` `${var}` deprecation; test fixture parse error (intended) |
| `lib/sphinx/` | Sphinx searchd PHP API, "Copyright (c) 2001-2007, Andrew Aksyonoff", **GPL** (`sphinxapi.php:1-12`), plus `conf/` (sample configs with credentials), `index/`, `var/` placeholder dirs | 9 files, 679 LOC | `lib/Search.php:37-40` when `ENABLE_SPHINX` | — | parses |
| `js/jquery-1.3.2.min.js` | jQuery 1.3.2 | 57 KB | every page (`TemplateUtility.php:1194`) | — | n/a |
| `js/submodal/` | subModal (subimage.com) | 3 files | every page (`TemplateUtility.php:1193`) | — | n/a |
| `js/sorttable.js`, `js/calendarDateInput.js`, `js/sweetTitles.js` | Stuart Langridge (modified), Jason Moon, Dustin Diaz (CC-BY-SA 2.5) | — | various templates | sorttable "Modifications by Cognizo" | n/a |
| `vendor/` (Composer, not committed) | `phpmailer/phpmailer v6.8.0`, `ckeditor/ckeditor 4.25.1` (+ 64 dev packages) | — | `lib/Mailer.php:43`, `modules/joborders/Add.tpl:2` | — | — |

## 7. Dependency / Include Graph Summary

- **Most-included lib files** (number of including files):

  | Rank | File | Includers |
  |---|---|---|
  | 1 | `StringUtility.php` | 25 |
  | 2 | `DateUtility.php` | 19 |
  | 3 | `Candidates.php` | 18 |
  | 4 | `Companies.php` | 17 |
  | 4 | `ActivityEntries.php` | 17 |
  | 6 | `JobOrders.php` | 16 |
  | 7 | `DatabaseConnection.php` | 14 |
  | 7 | `Attachments.php` | 14 |
  | 9 | `Pipelines.php` | 13 |
  | 9 | `Contacts.php` | 13 |
  | 9 | `CommonErrors.php` | 13 |
  | 12 | `Site.php` | 12 |
  | 13 | `Hooks.php` | 11 |
  | 13 | `FileUtility.php` | 11 |
  | 13 | `CATSUtility.php` | 11 |

- **Bootstrap closure.** A static walk from `index.php` reaches **49 files / 29,276 LOC** (upper bound, including conditional includes such as `LDAP.php` and `modules/install/notinstalled.php`): `config.php`, `constants.php`, `ACL`, `ArrayUtility`, `Attachments`, `CATSUtility`, `Calendar`, `Candidates`, `CommonErrors`, `Companies`, `Contacts`, `DataGrid`, `DatabaseConnection`, `DatabaseSearch`, `DateUtility`, `DocumentToText`, `EmailTemplates`, `ExtraFields`, `FileUtility`, `History`, `Hooks`, `JobOrderStatuses`, `JobOrderTypes`, `JobOrders`, `LDAP`, `License`, `ListEditor`, `MRU`, `Mailer`, `ModuleUtility`, `Pager`, `ParseUtility`, `Pipelines`, `QueueProcessor`, `ResultSetUtility`, `SavedLists`, `Session`, `Site`, `StringUtility`, `SystemInfo`, `SystemUtility`, `Template`, `TemplateUtility`, `UserInterface`, `Users`, `Width`, `modules/queue/constants.php`, `modules/install/notinstalled.php`, `index.php`.
- **Hub edges:**
  - `TemplateUtility` → `Candidates` (`:39`), which pulls `Attachments`, `DataGrid`, `ExtraFields`, `History`, `Pipelines`, `SavedLists`.
  - `Calendar` → `Companies`, `Candidates`, `JobOrders`, `Contacts`, `Mailer` (`lib/Calendar.php:44-48`).
  - `Companies` → `JobOrders`, `Contacts`, `Attachments`, `EmailTemplates` (`lib/Companies.php:38-43`).
  - `Users` → `LDAP` (conditional), `License`.
  - `SystemUtility` → `QueueProcessor` (`lib/SystemUtility.php:33`).
- **Cycles:**
  - `Calendar` → `JobOrders` → `Calendar` (`lib/JobOrders.php:44`).
  - `Calendar` → `Contacts` → `Calendar` (`lib/Contacts.php:35`).
  - `Calendar` → `Companies` → `JobOrders` → `Calendar`.
  - `Mailer` → `Pipelines`, while `Pipelines` uses `Mailer` without including it (`lib/Pipelines.php:371`).
- **Composer autoload** is used only for `src/OpenCATS` + `vendor/`, and is loaded via cwd-relative includes at `lib/TemplateUtility.php:38`, `lib/Companies.php:2`, `lib/JobOrders.php:2`, `lib/Mailer.php:43`, `modules/{candidates,companies,contacts,joborders}/Show.tpl`.
- **Modules with the widest lib fan-out:** `candidates` (23 lib files), `joborders` (24), `settings` (23), `companies` (16), `contacts` (15), `lists` (15), `import` (15), `careers` (15).

## 8. Dead / Legacy Code Inventory

| Item | Evidence | Status |
|---|---|---|
| `lib/ControlPanel.php` (1,573), `lib/CBFUtility.php` (715), `lib/DefaultQuestionnaires.php` (206), `lib/JavaScriptCompressor.php` (121) | 0 files include them; class names not referenced elsewhere (grep) | Dead (INFERENCE: no dynamic include by name found) |
| `lib/Display.php` (233) + `lib/Profile.php` (1,219) | `Profile.php` is included only by `Display.php:33`; nothing includes `Display.php`; no `Display::`/`new Display`/`new Profile` references | Dead (INFERENCE) |
| `lib/Encryption.php` (114) | No includers; uses `mcrypt_*` (`:52-110`), removed in PHP 7.2 | Dead (FACT: cannot run on supported PHP) |
| `modules/tests/` (3,019 PHP) + `lib/simpletest/` (31k) | Replaced by PHPUnit/Behat (`CHANGELOG.MD`: "Replace deprecated simpletest with phpunit and behat #123"); still discovered and instantiated on every new session (`TestsUI.php:42-46` file-scope side effects) | Legacy; live in production |
| `modules/toolbar/` (Firefox toolbar, CATS Professional) | `ToolbarUI.php:114-119` "only available to CATS Professional users"; `Session.php` doc "firefox toolbar download"; `SettingsUI` action `getFirefoxModal` | Legacy (ASSUMPTION: legacy Firefox XUL extensions have not worked since Firefox 57, 2017) |
| License / Professional machinery | `lib/License.php:580-591,658-669` (always `true`); `TemplateUtility.php:842-848`; `modules/settings/Professional.tpl` (links to `catsone.com/professional`); `lib/CommonErrors.php:74-88`; `images/add_licenses.jpg` | Legacy / neutered |
| Phone-home & remote services | `lib/NewVersionCheck.php:121-122` (`www.catsone.com:80`); `wsdl/keyCheck.wsdl:66`; `wsdl/parse.wsdl:78`, `wsdl/status.wsdl:69` (`soap.resfly.com`); `installwizard.php:145` | Legacy (ASSUMPTION: remote endpoints defunct) |
| Hosted/ASP multi-tenant code | `lib/Session.php:939` `transparentLogin` (no callers); `Session.php:200-212` (`'cognizo'`, site 200 "TODO: Remove me"); `index.php:246-250` (`demo.catsone.com`); `settings.aspLocalization`; `db/cats_schema.sql:858` (`extension-statistics` module row) | Legacy |
| Unused hook points | 232 distinct hook names, only 10 implemented (`SettingsUI.php:87-128`) | Dead extension points |
| Demo mode | `config.php:177,196-197` (`ENABLE_DEMO_MODE`, `DEMO_LOGIN`); `ACCESS_LEVEL_DEMO`; `isDemo()` checks in ~20 files | Legacy feature, still wired |
| SVN-era tooling | `lib/CATSUtility.php:98-132` (`.svn/entries`); `scripts/svnkeywords.sh`; `$Id: … $` SVN keywords in almost every header | Legacy (git repo) |
| `rebuild_old_docs.php` | Header: "patch on 2011 July, 08 … If you used version 0.9.2 or earlier" (`:3-11`) | One-off migration script left in the web root |
| `scripts/*.sh` hosted ops scripts | `scripts/sphinx_reindex.sh:14-17` (`/usr/local/www/catsone.com/data`), `scripts/storeDeletedAttachments.sh:4-10` (`fs1.cognizo.com`), `scripts/mysql_get_prod_db.sh:8-10` (`10.0.0.66`, `sae99`) | Legacy hosted-CATS operations |
| `db/upgrade-0.5.0-0.5.1.sql` … `upgrade-0.9.4-0.9.5.sql` | Only used by the installer's old-version upgrade path (`modules/install/ajax/ui.php:899-923`) | Legacy (upgrades from 2007-era releases) |
| `Schema.php` `PHP:` migrations using `mysql_*` | `modules/install/Schema.php:725,854,1236` | Legacy; fatal if ever executed on PHP ≥ 7 |
| Empty files | `ajax/getReportHTML.php`, `modules/careers/Openings.tpl`, `modules/careers/SearchOpenings.tpl` (no references), plus placeholders `attachments/index.php`, `js/index.php`, `scripts/index.php`, `temp/empty`, `reports/index.html` | Dead / placeholders |
| Duplicate queue files | `modules/queue/tasks.php` vs `modules/queue/tasks/tasks.php`; `modules/queue/lib/Task.php` vs `modules/queue/tasks/lib/Task.php` (diff: header/formatting only; `tasks.php` differs in task path and has `include_once('config.php')`) | Only `tasks/tasks.php` and `lib/Task.php` are loaded (`ModuleUtility.php:94-96`; includes in `tasks/*.php`) |
| `Template::addFilter()` / `$filters` | `lib/Template.php:85-88` no callers; `ajax.php:108` `$filters` never populated by any handler (grep) | Dead mechanism |
| `.github/workflow/*.yml` | Singular `workflow/` directory | Never executed (INFERENCE) |
| `.travis.yml`, `ci/package-code.sh` | Travis-specific env vars (`$TRAVIS_TAG`) | Legacy CI (INFERENCE) |
| `lib/sphinx/conf/old/sphinx-{fs1,www}.conf` | hosted-CATS server configs | Legacy |

## 9. Findings (map-specific)

### ARCH-M01 — Dead first-party code in `lib/` and modules
- **Severity:** MEDIUM
- **Finding:** Seven `lib/` files totalling 4,181 LOC have no reachable references, plus two whole modules (`tests`, `toolbar`), 3 empty files, duplicate queue files, and 222 no-op hook points.
- **Evidence:** §8 rows. Include counts (0 includers) for `ControlPanel.php`, `CBFUtility.php`, `DefaultQuestionnaires.php`, `JavaScriptCompressor.php`, `Encryption.php`; `Display.php`/`Profile.php` form a closed pair.
- **Impact:** Inflates audit and PHP-8 migration scope (e.g. `Encryption.php` mcrypt, `Profile.php` deprecations) and confuses contributors.
- **Recommendation:** Delete these files in one PR, verified by `grep -rn "<ClassName>\|<file>.php"` returning nothing and by a smoke run of all module default actions. Remove `modules/tests` and `lib/simpletest` from the release zip (`ci.yml:119` exclude list) if not deleted outright.

### ARCH-M02 — Vendored, patched, outdated third-party libraries inside `lib/` and `js/`
- **Severity:** HIGH
- **Finding:** Charting, PDF, test and search client libraries are copied into `lib/` with local edits, and old jQuery/subModal are copied into `js/`. None is managed by Composer or npm. Three do not parse on PHP 8, and the Sphinx API is GPL-licensed inside a CPL project.
- **Evidence:** §6 table: `lib/fpdf/fpdf.php:16` (1.53), `lib/simpletest/VERSION` (1.1.0), `lib/sphinx/sphinxapi.php:1-12` (GPL), `lib/artichow/AntiSpam.class.php:63` and `lib/fpdf/fpdf.php:434` (PHP 8 parse errors), `js/jquery-1.3.2.min.js`.
- **Impact:** Reports and graphs break on PHP 8; there is no security-update path; license compatibility is questionable (cross-ref dependency audit).
- **Recommendation:** Replace with Composer packages (e.g. `setasign/fpdf` or `tecnickcom/tcpdf`, a maintained chart library or client-side charts), drop SimpleTest, move the Sphinx client behind an interface or remove it, and manage JS via a package manager with pinned versions.

### ARCH-M03 — Forked copies of core files
- **Severity:** MEDIUM
- **Finding:** Several core files exist in two diverging copies, and one of them is meant to be copied over the core file by hand.
- **Evidence:** `optional-updates/latest-sphinx-search/Search.php` (2,487 LOC) vs `lib/Search.php` (2,096); `optional-updates/latest-sphinx-search/config.php` (lacks `LEGACY_ROOT`, `AUTH_MODE`, LDAP constants); `test/config.php` vs `config.php` (missing `LDAP_ATTRIBUTE_*`, `LDAP_SITEID`); queue duplicates (§8).
- **Impact:** Following the optional-update README overwrites a working `config.php` with a stale one. Fixes to `lib/Search.php` do not reach users of the fork.
- **Recommendation:** Merge the Sphinx changes behind `ENABLE_SPHINX` in `lib/Search.php`, delete the fork, and replace config copies with `config.php.dist` + overrides (see ARCH-014).

### ARCH-M04 — Hosted-CATS artifacts with hard-coded hosts and credentials
- **Severity:** HIGH
- **Finding:** Operational scripts and sample configs from the commercial hosted service ship in the repo with internal hostnames, IPs and passwords.
- **Evidence:** `lib/sphinx/conf/sphinx.conf:14-18` (`sql_host = 192.168.48.4`, `sql_user = dit_db_user`, `sql_pass = '_dit_db_user_P@$$w0r8123.'`); `scripts/mysql_get_prod_db.sh:8-10` (`MYSQL_PROD_HOST=10.0.0.66`, `MYSQL_PROD_PASSWORD=sae99`); `scripts/storeDeletedAttachments.sh:4-7` (`fs1.cognizo.com`, `cats`/`password`).
- **Impact:** Credential leakage (if ever valid) and copy-paste risk for operators. These files are web-accessible in the default layout (`lib/`, `scripts/` have no `.htaccess`).
- **Recommendation:** Remove these files (or replace them with redacted `.example` versions outside the web root), and rotate any credentials that were real (UNKNOWN; see Unknowns).

### ARCH-M05 — Mislabeled headers and class/file-name mismatches
- **Severity:** LOW
- **Finding:** Several file headers describe the wrong thing, and several classes do not match their file names.
- **Evidence:** `lib/ExtraFields.php` header says "Job Orders Library"; `lib/ListEditor.php` says "Array Utility Library"; `lib/ZipLookup.php` says "Google API Zip Code Lookup" but queries the local `zipcodes` table. Class names `ContactImport` in `ContactsImport.php`, `HTTPLogger` in `HttpLogger.php`, `XmlTemplate` in `XmlJobExport.php`, `DefaultQuestionnaireUtility` in `DefaultQuestionnaires.php`, `LoginActivityPager` in `LoginActivity.php`, `CATSUI` in `modules/install/CATSUI.php` (module `install`).
- **Impact:** Slows navigation. PSR-4 autoloading of `lib/` would require renames (classmap autoloading would not).
- **Recommendation:** Fix the headers. Use a Composer `classmap` for `lib/` (tolerates mismatches) until files are renamed during refactoring.

## Facts vs Assumptions

**FACTS:**
- All LOC figures, file lists, class lists, include counts and include-graph edges above (computed with `wc -l`/`grep`).
- The `php -l` failures.
- The committed credentials.
- Empty files.
- Diff results between duplicate files.

**ASSUMPTIONS / INFERENCES:**
- "Dead" status is inferred from the absence of static references; dynamic includes built from variables (e.g. `DataGrid.php:280` `sprintf('modules/%s/dataGrids.php', $module)`, `QueueProcessor::getInstantiatedTask`) were checked and do not target the listed files, but reflection-style loading cannot be excluded completely.
- The Firefox toolbar, the Resfly/catsone remote services and Travis CI are defunct (external knowledge).
- `.github/workflow/` files never run (GitHub only reads `.github/workflows/`).

## Unknowns / Needs Further Investigation

1. Whether any deployed installations still use `modules/toolbar` clients, Resfly parsing (`PARSING_ENABLED`) or Sphinx.
2. Git history of `lib/sphinx/conf/sphinx.conf` and `scripts/mysql_get_prod_db.sh` (who added them, whether the credentials were real).
3. License compatibility of GPL `sphinxapi.php` and CC-BY-SA `sweetTitles.js` with the CPL 1.1a (dependency/legal review).
4. Whether `modules/tests` is ever used by maintainers (it is reachable by any logged-in user as `index.php?m=tests`).
