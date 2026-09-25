# OpenCATS Feature Inventory (as implemented in code)

**Scope.** This document enumerates every user-facing and administrative feature that actually exists in the OpenCATS 0.9.7.4 code base (`constants.php:45`), derived from the code rather than documentation. For every module under `modules/` the `<Module>UI::handleRequest()` switch was read and each `a=` action (and each careers `p=` / `pa=` page) was traced to its template(s), backing `lib/` class, database tables and access-level check. Each feature receives a maturity note and a disposition for a modernization programme: **KEEP** (preserve behaviour as-is in the new system), **REDESIGN** (keep the capability, rebuild UX/logic), **REPLACE** (swap for a modern equivalent / off-the-shelf service), **RETIRE** (dead, obsolete or harmful). It also documents the recruitment pipeline state machine and all half-implemented/disabled features. Security issues are mentioned only where they change what a feature really does; the security audit owns them.

## Method

Inspected (read-only):
- All 23 `modules/*/*UI.php` `handleRequest()` switches, their private handlers and templates; `lib/*.php` backing classes; `ajax.php` + `ajax/*.php` + `modules/*/ajax/*.php`; `careers/`, `rss/`, `xml/` entry points; `QueueCLI.php`; `db/cats_schema.sql` (55 tables); `config.php`, `constants.php`.
- Commands (representative):
  - `grep -n "case '\|function handleRequest\|getUserAccessLevel" modules/*/*UI.php` (action + access-check extraction)
  - `for d in modules/*/; do find $d -name '*.php' | xargs cat | wc -l; find $d -name '*.tpl' | wc -l; done` (LOC/template counts)
  - orphan-template scan: for each `modules/**/*.tpl`, `grep -rls <basename>` across `modules lib index.php ajax js careers` (excluding itself) + manual check of dynamic `sprintf('MassImportStep%d.tpl')`
  - `grep -rn "PIPELINE_STATUS_\|status_to = [0-9]" lib modules ajax src` (hard-coded pipeline codes)
  - `grep -rn "eval(Hooks::get" ... | wc -l` → 278 hook points
  - License decode: copied `lib/License.php` to the scratchpad and ran it under PHP 8.4 with the shipped `LICENSE_KEY` → `isProfessional()=true`, expiry `17179869183`, seats `63`.
  - `php -r 'var_dump(function_exists("get_magic_quotes_runtime"));'` under PHP 8.4 → `false`.
- No code was executed against a database; runtime behaviour is inferred from code and labelled.

## Summary of findings

| ID | Title | Severity |
|---|---|---|
| FEAT-001 | Recruitment pipeline is a fixed, hard-coded 11-status list with no transition rules, no per-job workflows and no admin UI | HIGH |
| FEAT-002 | Candidate "merge duplicates" re-points activities/attachments/events of *any* entity type and builds SQL from raw POST/DB strings | HIGH |
| FEAT-003 | Company delete hard-cascades to contacts, job orders, pipelines, status history and attachments; pipeline/job-order/candidate deletes erase reporting history | HIGH |
| FEAT-004 | "Private" calendar events are delivered to every user and only hidden client-side | HIGH |
| FEAT-005 | Careers-portal "candidate login" authenticates with e-mail + last name + ZIP (no password) and stores PII in a cookie | HIGH |
| FEAT-006 | Coarse, global access-level model; several feature entry points have no access check at all (export-all, activity edit/delete, lists, reports, import revert, tag admin) | HIGH |
| FEAT-007 | Duplicate detection: exact first+last name match only, not site-scoped, only on manual add; dedicated duplicates page orphaned | MEDIUM |
| FEAT-008 | Reporting counts are derived from mutable status-history rows (double counting, erasure) and the default statistics filter has an `'OnHold'` typo | MEDIUM |
| FEAT-009 | Forgot-password feature is broken (undefined method/constants) and designed to e-mail plaintext passwords | MEDIUM |
| FEAT-010 | Event reminders and all background tasks depend on an undocumented cron running `QueueCLI.php`, which fatals on PHP 8 | MEDIUM |
| FEAT-011 | Careers portal job search pages (`p=search`, `p=searchResults`) are empty stubs; portal is single-tenant (`getFirstSiteID`) | MEDIUM |
| FEAT-012 | Dead third-party integrations still wired in: Resfly SOAP parser over HTTP, catsone.com phone-home, Firefox XUL toolbar (exposes license key unauthenticated) | MEDIUM |
| FEAT-013 | Bulk candidate e-mail: SA-only, synchronous, no unsubscribe/consent, recipient query not site-scoped; e-mail log never shown | MEDIUM |
| FEAT-014 | Web test-runner module (`m=tests`) ships in production and is reachable by any logged-in user | MEDIUM |
| FEAT-015 | Extension model = 278 `eval()`'d hook strings kept in `$_SESSION`; only one module defines hooks | MEDIUM |
| FEAT-016 | Localization limited to integer GMT offsets (no DST) and MDY/DMY; UI English-only | MEDIUM |
| FEAT-017 | Numerous half-implemented / stubbed features (dynamic lists, Customize Reports, Passwords page, tag edit, etc.) | LOW |
| FEAT-018 | Per-status "send e-mail" defaults from E-Mail Settings are honoured only in the job-order-side modal | LOW |
| FEAT-019 | First-login wizard "Setup Users" cannot add users when licenses = 0 (the default "unlimited") | LOW |
| FEAT-020 | Job-order pipeline "Export selected" sends PHP `serialize()` to an endpoint that `json_decode()`s | LOW |

---

## 1. Module summary

Access-level constants (`constants.php:74-82`): DELETED −100, DISABLED 0, **READ 100**, **EDIT 200**, **DELETE 300**, **DEMO 350**, **SA 400** (site admin), **MULTI_SA 450**, **ROOT 500**. Abbreviations used below: `AUTH` = any logged-in user (module sets `_authenticationRequired = true` but no `getUserAccessLevel()` check), `PUBLIC` = no login.

| Module | Live `a=` actions | Commented-out / dead actions | `.tpl` files (orphans) | PHP LOC (module dir) | TPL LOC | Main backing libs (LOC) |
|---|---|---|---|---|---|---|
| activity | 2 | – | 2 | 616 | 158 | `ActivityEntries.php` (553) |
| attachments | 1 | – | 0 | 149 | 0 | `Attachments.php` (1386), `DocumentToText.php` (586) |
| calendar | 5 (+1 queue task) | – | 2 | 948 | 644 | `Calendar.php` (1084) |
| candidates | 23 | `savedLists` (`CandidatesUI.php:287-295`) | 19 (2: `HotList.tpl`, `Duplicates.tpl`) | 3717 | 3396 | `Candidates.php` (2473), `Pipelines.php` (741), `Search.php` (2096) |
| careers | 1 `a=` (default) + 10 `p=` + 2 `pa=` | `p=search`, `p=searchResults` empty | 6 (4: `Openings`, `SearchOpenings`, `Blank2`, `BlankNoMargin`) | 1794 | 140 | `CareerPortal.php` (471), `Questionnaire.php` (737) |
| companies | 9 | – | 8 | 1375 | 1106 | `Companies.php` (994) |
| contacts | 9 | – | 9 | 1708 | 1336 | `Contacts.php` (1050), `VCard.php` |
| export | 2 | – | 0 | 155 | 0 | `Export.php` (173), `DataGrid.php` (2649) |
| graphs | 11 | `testGraph` intentionally empty | 0 | 632 | 0 | `Graphs.php` (304), `GraphGenerator.php` (455), `lib/artichow` |
| home | 4 | `getAttachment` (`HomeUI.php:75-81`) | 4 | 793 | 362 | `Dashboard.php` (272), `Search.php` (`QuickSearch`, `SavedSearches`) |
| import | 13 | – | 15 (1: `ImportCommits.tpl`) | 2680 | 1521 | `modules/import/Import.php`, `CandidatesImport/CompaniesImport/ContactsImport.php`, `ImportUtility.php` |
| install | 0 (`CATSUI::handleRequest()` empty, `CATSUI.php:42-44`) | installer lives in `installwizard.php` + `modules/install/ajax/ui.php` | 0 | 3346 | 0 | `modules/install/Schema.php` |
| joborders | 15 | `setCandidateJobOrder` (`JobOrdersUI.php:282-290`) | 10 | 2128 | 1565 | `JobOrders.php` (1294), `JobOrderStatuses.php`, `JobOrderTypes.php` |
| lists | 6 (+4 module AJAX) | `show` (`ListsUI.php:71-75`) | 3 | 978 | 237 | `SavedLists.php` (617) |
| login | 4 | – | 12 (login/wizard `Localization.tpl` never added; `Register/Reregister` only under undefined `CATS_TEST_MODE`) | 511 | 494 | `Session.php` (1257), `Users.php` (1257), `LDAP.php` (142) |
| queue | 0 (empty switch, `QueueUI.php:49-56`) | – | 0 | 729 | 0 | `QueueProcessor.php` (658), `QueueCLI.php` |
| reports | 8 | – | 8 (1: `NewDataItems.tpl`) | 725 | 1246 | `Statistics.php` (1058), `lib/fpdf` |
| rss | 1 | – | 0 | 159 | 0 | `JobOrders.php` |
| settings | 51 | – | 32 | 4149 | 4406 | `Users, EmailTemplates, Mailer, CareerPortal, Questionnaire, ExtraFields, Tags, LoginActivity, History, License, NewVersionCheck` |
| tests | 2 | – | 1 | 3019 | 86 | `lib/simpletest` |
| toolbar | 7 (handler for `attemptLogin` missing) | – | 2 (1: `install.tpl`) | 288 | 86 | `DocumentToText.php` |
| wizard | 2 | page list commented out (`WizardUI.php:52-73`) | 1 | 188 | 93 | `Wizard.php` (102) |
| xml | 1 | – | 0 (+3 `.xtpl`) | 331 | 0 | `XmlJobExport.php` (224), `HttpLogger.php` |

Dead library code with **zero** references outside itself (grep across `modules lib index.php ajax careers src`): `lib/ControlPanel.php` (1573), `lib/Profile.php` (1219, only referenced by the equally unreferenced `lib/Display.php`, 233), `lib/CBFUtility.php` (715), `lib/JavaScriptCompressor.php` (121), `lib/Encryption.php` (uses removed `mcrypt_*`, `lib/Encryption.php:52-79`). ≈3,900 LOC.

---

## 2. Feature inventory by module

Columns: **Entry** = `m=`/`a=` and `file:line` of the `case`; **Access** = the check that gates it; **Disp.** = disposition.

### 2.1 Home / Dashboard (`modules/home`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Maturity notes | Disp. |
|---|---|---|---|---|---|---|---|
| Dashboard | Renders 6 widgets: My Recent Calls, My Upcoming Calls, My Upcoming Events, Recent Hires, Hiring Overview graph, Important Candidates grid | `m=home` (`HomeUI.php:83-86`, `home()` 91-135) | `Dashboard`, `Calendar`, `DataGrid` | see below | AUTH | Also calls `NewVersionCheck::getNews()` (`HomeUI.php:95`) which phones home daily (see FEAT-012) and discards the return value | REDESIGN |
| "My Recent Calls" | Misnamed: last 6 activities of **any** type entered by the current user on candidates/contacts in the last month | `home:CallsDataGrid` (`modules/home/dataGrids.php:201`, SQL `:329-360`, `LIMIT 6`) | `DataGrid` | activity, candidate, contact, joborder, company | AUTH | Label does not match query | REDESIGN |
| My Upcoming Events / Calls | Today + upcoming events entered by the user; "Calls" = event type 100, "Events" = all other types | `Calendar::getUpcomingEventsHTML()` (`lib/Calendar.php:641-661`, filter `:697-712`) | `Calendar` | calendar_event, calendar_event_type, user | AUTH | Returns pre-rendered HTML from the lib layer | REDESIGN |
| Recent Hires | Last 10 `status_to = 800` history rows | `Dashboard::getPlacements()` (`lib/Dashboard.php:57-97`, literal `800` at `:85`) | `Dashboard` | candidate_joborder_status_history, candidate, joborder, company, user | AUTH | Hard-coded status literal; erased if pipeline removed (FEAT-003) | REDESIGN |
| Hiring Overview graph | Weekly/monthly/yearly bar chart of submissions/interviews/hires from status history | `<img src=m=graphs&a=miniPlacementStatistics>` (`Home.tpl:66`); `GraphsUI.php:405-463`, `Dashboard::getPipelineData()` | `Dashboard`, artichow | candidate_joborder_status_history | AUTH (graph action requires login, `GraphsUI.php:101`) | Server-side JPEG via 2006-era artichow | REPLACE (client-side charting over an analytics API) |
| Important Candidates | Pipelines in status 400/500/600 on job orders in the "Open" status group | `home:ImportantPipelineDashboard` (`modules/home/dataGrids.php:40`, WHERE `:163-172`) | `DataGrid`, `JobOrderStatuses::getOpenStatusSQL()` | candidate_joborder, candidate, joborder, candidate_joborder_status, user | AUTH | Useful "my hot pipeline" view but not user-scoped | REDESIGN |
| Quick search ("search everything") | LIKE search over candidates (name/email/phone), companies (name/phone/url), contacts (name/phone/company/email), job orders (title/company) | `a=quickSearch` (`HomeUI.php:56`), `SearchEverything.tpl` | `QuickSearch` (`lib/Search.php:1306-1618`) | candidate, company, contact, joborder | AUTH | Lists search commented out (`HomeUI.php:204`); unindexed `%LIKE%` | REPLACE (search index) |
| Saved / recent searches | Pin or remove a recent search (per user) | `a=addSavedSearch` (`HomeUI.php:69`), `a=deleteSavedSearch` (`:63`) | `SavedSearches` (`lib/Search.php:1620+`) | saved_search | AUTH (scoped by user_id/site_id `lib/Search.php:1645-1652`) | Redirects to caller-supplied `currentURL` | REDESIGN |

### 2.2 Candidates (`modules/candidates`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Maturity notes | Disp. |
|---|---|---|---|---|---|---|---|
| Candidate list (datagrid) | Paged, sortable, column-configurable grid; filters "Only My", "Only Hot", tag filter; action area: Add To List, Add To Job Order, Send E-Mail (SA + mailer on), Export; duplicate warning icon | `a=listByView` (`CandidatesUI.php:360-368`) → `Candidates.tpl`; grid `modules/candidates/dataGrids.php:8,56-67` | `CandidatesDataGrid` (`lib/Candidates.php:1926`), `DataGrid` | candidate, candidate_joborder, candidate_duplicates, candidate_tag, tag, attachment, user, saved_list_entry | `candidates.list` ≥ READ (`:362`) | Core feature; grid state stored in session | REDESIGN |
| Add candidate | Form incl. EEO fields, source picker, extra fields, optional pre-attached resume / text; on save runs duplicate check and links duplicates; optional "parse resume" | `a=add` (`:96-110`), `_addCandidate()` (`:2543-2725`) | `Candidates::add()` (`lib/Candidates.php:94`), `checkDuplicity()` | candidate, candidate_duplicates, attachment, extra_field, history | `candidates.add` ≥ EDIT (`:97`) | Live e-mail duplicate lookup via AJAX (`js/candidate.js:33`); `Add.tpl:514-520` calls `checkEmailAlreadyInSystem` for *phone* fields (bug) | REDESIGN |
| Edit candidate | Update all fields, owner change sends "ownership assigned" e-mail (`EMAIL_TEMPLATE_OWNERSHIPASSIGNCANDIDATE`, `CandidatesUI.php:1126-1128,1264-1266`); field-level history captured | `a=edit` (`:112-126`) | `Candidates::update()` (`lib/Candidates.php:249-361`, history `:327-334`, mail `:345`) | candidate, history, extra_field, email_history | `candidates.edit` ≥ EDIT (`:113`) | – | REDESIGN |
| Show candidate | Detail page: data, EEO block (if enabled and user `can_see_eeo_info`), attachments with preview, pipelines with star rating, activities, upcoming events, extra fields, lists, tags, questionnaires, duplicate banner with merge/remove actions, history link | `a=show` (`:88-94`, `show()` `:458-750`) | `Candidates`, `Pipelines`, `ActivityEntries`, `Attachments`, `Questionnaire`, `Tags` | candidate, attachment, candidate_joborder, activity, calendar_event, extra_field, saved_list*, candidate_tag, career_portal_questionnaire_history, candidate_duplicates, mru | `candidates.show` ≥ READ (`:89`); admin-hidden rows need MULTI_SA (`:497`) | Can also resolve `?email=` to an ID (`:475-481`) | REDESIGN |
| Delete candidate | Hard delete + pipelines + status history + saved-list entries + duplicates + attachments + extra fields | `a=delete` (`:128-134`) | `Candidates::delete()` (`lib/Candidates.php:363-456`, history delete `:394-397`) | candidate, candidate_joborder, candidate_joborder_status_history, saved_list_entry, candidate_duplicates, attachment, extra_field, history | `candidates.delete` ≥ DELETE (`:129`) | Activities and calendar events are **not** deleted (orphans); erases placement stats (FEAT-003) | REDESIGN (soft delete + retention) |
| Search | Modes: full name (`:1981`), key skills (`:2012`), resume full text (`:2044`, boolean REGEXP or Sphinx), city (`:2111`), phone (`:2142`) | `a=search` (`:136-152`) | `SearchCandidates` (`lib/Search.php:364-722`), `SearchByResumePager` (`:1843`), `DatabaseSearch` | candidate, attachment, saved_search | `candidates.search` ≥ READ (`:137`) | Sphinx optional (`ENABLE_SPHINX=false`, `config.php:97`) | REPLACE (search engine) |
| Hot candidates | `is_hot` flag, bold styling, "Only Hot" filter | edit form + grid filter (`Candidates.tpl:38`) | – | candidate.is_hot | EDIT to set | Cosmetic flag | KEEP |
| Tags | Assign hierarchical (parent/child) tags; filter list by tag | `a=addCandidateTags` (`:191-205`), `AssignCandidateTagModal.tpl` | `Tags` (`lib/Tags.php`, parent `:94,112-128`) | tag, candidate_tag | `candidates.addCandidateTags` ≥ EDIT (`:192`) | Tag admin in Settings (2.15) | KEEP |
| Attachments / resume upload + text extraction | Upload file; text extracted with antiword / pdftotext / html2text / unrtf / built-in ODT/DOCX/RTF readers, stored for search; preview | `a=createAttachment` (`:249-267`), `a=deleteAttachment` (`:278-284`) | `AttachmentCreator`/`Attachments`, `DocumentToText::convert()` (`lib/DocumentToText.php:72-200`) | attachment | create ≥ EDIT (`:250`); delete ≥ DELETE (`:279`) | External binaries default to Windows-style placeholder paths (`config.php:62-81`) | REPLACE (object storage + modern extraction) |
| Resume view | Shows extracted text with keyword highlighting | `a=viewResume` (`:154-163`, `viewResume()` `:2216-2244`) | `Candidates::getResume()`, `SearchUtility::makePreview()` | attachment | `candidates.viewResume` ≥ READ | – | REDESIGN |
| Profile image | Upload/replace candidate photo (attachment flagged `is_profile_image`) | `a=addEditImage` (`:232-246`) | `Attachments` | attachment | ≥ EDIT (`:233`) | – | KEEP |
| Parse resume (Resfly) | Sends document text to `http://soap.resfly.com/parse.php` via SOAP with the license key and pre-fills name/e-mail/address/phone/skills | Add form postback → `checkParsingFunctions()` (`:893-1031`) | `ParseUtility::documentParse()` (`lib/ParseUtility.php:85-129`), `wsdl/parse.wsdl:78` | – | via `a=add` | `LicenseUtility::isParsingEnabled()` returns `true` on every path (`lib/License.php:687-706`); third-party over plain HTTP; service availability unknown | REPLACE (in-house or current parsing vendor) |
| Consider for job / add to pipeline | Modal job-order search (title/company, `:1487-1497`); adds one or many candidates to a pipeline at status 100 and logs activity "Added candidate to job order." | `a=considerForJobSearch` (`:168-179`), `a=addToPipeline` (`:183-189`, `onAddToPipeline()` `:1561-1656`) | `Pipelines::add()` | candidate_joborder, activity | search ≥ EDIT (`:169`); `pipelines.addToPipeline` ≥ EDIT (`:184`) | No initial status-history row written | REDESIGN |
| Log activity / change status / schedule event | Single modal combining: status change (any→any), optional candidate e-mail, activity note, calendar event with reminder | `a=addActivityChangeStatus` (`:207-222`), `_addActivityChangeStatus()` (`:2900-3302`) | `Pipelines::setStatus()`, `ActivityEntries::add()`, `Calendar::addEvent()` | candidate_joborder, candidate_joborder_status_history, history, activity, calendar_event, joborder, email_history | `pipelines.addActivityChangeStatus` ≥ EDIT (`:208`) | See §3 state machine | REDESIGN |
| Remove from pipeline | Deletes pipeline row **and all its status history** | `a=removeFromPipeline` (`:224-230`) | `Pipelines::remove()` (`lib/Pipelines.php:139-189`) | candidate_joborder, candidate_joborder_status_history, history | `pipelines.removeFromPipeline` ≥ DELETE (`:225`) | Openings not restored if candidate was Placed | REDESIGN |
| E-mail candidates (bulk) | From grid selection: free-text or custom template; per-recipient `%CAND…%` substitution; sent synchronously | `a=emailCandidates` (`:297-307`, `onEmailCandidates()` `:3305-3417`) | `Mailer` (instantiated with `CATS_ADMIN_SITE`, `:3320`), `EmailTemplates::getAllCustom()` | candidate, email_template, email_history | ≥ READ then ≥ **SA** (`:298-305`) | Recipient lookup `WHERE candidate_id IN (...)` without site_id (`:3398-3403`); see FEAT-013 | REPLACE (campaign/communications service) |
| Questionnaire view | Shows answers the candidate gave on the careers portal + resume text; printable | `a=show_questionnaire` (`:309-315`, `:3419-3454`) | `Questionnaire::getCandidateQuestionnaire()` | career_portal_questionnaire_history, attachment | ≥ READ (`:310`) | Keyed by questionnaire *title* from GET | REDESIGN |
| EEO info | Gender/ethnicity/veteran/disability captured on add/edit/careers; shown only if EEO tracking enabled per category and user flag `can_see_eeo_info` | `show()` `:703-727`; `Show.tpl:260,278` | `EEOSettings` (`lib/Candidates.php:2367+`) | candidate.eeo_*, eeo_ethnic_type, eeo_veteran_type, settings | per-user flag (`lib/Session.php:814`) | US-specific categories | REDESIGN (configurable, jurisdiction-aware diversity data) |
| Source tracking | Free-text `candidate.source` + per-site pick list editable inline | add/edit forms; `Candidates::getPossibleSources()/updatePossibleSources()` (`lib/Candidates.php:989-1115`) | `ListEditor` | candidate.source, candidate_source | EDIT | No source analytics anywhere (`grep -c source lib/Statistics.php` → 0) | REDESIGN |
| Extra fields | EAV custom fields (text, textarea, checkbox, date, dropdown, radio, `constants.php:133-138`) shown on add/edit/show/grid | `ExtraFields` (`lib/ExtraFields.php`) | – | extra_field, extra_field_settings | as parent form | No required/validation flags | REDESIGN |
| Duplicates: auto-detect on add | Flags new record as possible duplicate of existing ones (exact first+last name AND (middle name, or any phone, or any e-mail, or city+address)) | `_addCandidate()` `:2663,2704` | `Candidates::checkDuplicity()` (`lib/Candidates.php:1136-1210`) | candidate, candidate_duplicates | via add | Not site-scoped; manual add only (FEAT-007) | REDESIGN |
| Duplicates: link manually | Search candidates and link as duplicate | `a=linkDuplicate` (`:317-323`), `a=addDuplicates` (`:351-357`), `LinkDuplicity.tpl` | `Candidates::addDuplicates()` (`:1263`) | candidate_duplicates | `candidates.duplicates` ≥ SA | – | REDESIGN |
| Duplicates: merge | Field-by-field chooser (`Merge.tpl`), then re-points related rows and deletes the newer record | `a=merge` (`:326-332`), `a=mergeInfo` (`:334-340`) | `Candidates::mergeDuplicates()` (`lib/Candidates.php:1310-1587`) | activity, attachment, calendar_event, candidate_duplicates, candidate_tag, candidate_joborder(+history), saved_list_entry, candidate | ≥ SA | **Data-corrupting** (FEAT-002) | REDESIGN (rewrite) |
| Duplicates: dismiss | Remove duplicate warning | `a=removeDuplicity` (`:343-349`) | `Candidates::removeDuplicity()` (`:1240`) | candidate_duplicates | ≥ SA | DELETE not site-scoped (`:1242-1250`) | REDESIGN |
| Duplicates list page | `Duplicates.tpl` exists (datagrid of duplicates) but no action renders it and `totalDuplicates` is never assigned | – | `getDuplicatesCount()` unused | – | – | Orphan | RETIRE (rebuild as part of dedupe queue) |
| Administrative hide/show | ROOT/ASP operator can hide a candidate from site users | `a=administrativeHideShow` (`:269-275`) | `Candidates::administrativeHideShow()` (`:1117`) | candidate.is_admin_hidden | `candidates.hidden` ≥ MULTI_SA | Multi-tenant ASP remnant | RETIRE (or fold into retention/legal-hold) |
| Saved lists from candidate | Add to static list (quick action / grid) | see Lists (2.9) | – | – | – | `a=savedLists` commented: `// FIXME: function savedList() missing` (`:287`) | – |
| MRU | Viewing a record adds it to the user's 5-item most-recently-used bar | `show()` `:680-683` | `MRU` (`lib/MRU.php`) | mru | AUTH | `MRU_MAX_ITEMS=5` (`config.php:121`) | KEEP |
| Upcoming events | Candidate-linked future events on Show | `Candidates::getUpcomingEvents()` (`:975`) | `Calendar::getUpcomingEventsByDataItem()` | calendar_event | READ | – | KEEP |
| Hot lists | `HotList.tpl` references `candidates.manageHotLists`; no handler | – | – | – | – | Orphan (superseded by saved lists) | RETIRE |

### 2.3 Job Orders (`modules/joborders`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Maturity notes | Disp. |
|---|---|---|---|---|---|---|---|
| Job order list | Grid with status-group filter (`JobOrderStatuses::getFilters()`, `JobOrdersUI.php:318`), "Only My", "Only Hot"; computed Submitted/Pipeline/Interviews columns from status history | `a=listByView` (`:301-308`) | `JobOrdersDataGrid` (`lib/JobOrders.php:863+`, Interviews `:1054-1062`) | joborder, company, contact, user, candidate_joborder, candidate_joborder_status_history | `joborders.list` ≥ READ (`:303`) | – | REDESIGN |
| Add job order (popup) | Choose empty or **copy existing** job order, then full form | `a=addJobOrderPopup` (`:108-114`, `AddModalPopup.tpl:20-35`), `a=add` (`:116-130`) | `JobOrders::add()` → `JobOrder::create()` + `JobOrderRepository::persist()` (`lib/JobOrders.php:94-140`, `src/OpenCATS/Entity/*`) | joborder, history, extra_field | `joborders.add` ≥ EDIT | Only code path using the newer `src/` repository pattern; default status via `JobOrderStatuses::getDefaultStatus()` (`src/OpenCATS/Entity/JobOrder.php:291`) | REDESIGN |
| Edit job order | Title, company/contact/department, type, status, openings/openings available, salary, rate, duration, start date, public flag, questionnaire, recruiter, owner; owner change e-mails `EMAIL_TEMPLATE_OWNERSHIPASSIGNJOBORDER` (`:838-840,1052-1054`) | `a=edit` (`:132-146`) | `JobOrders::update()` (`lib/JobOrders.php:163-270`) | joborder, history | `joborders.edit` ≥ EDIT | `openings_available` manually editable and auto-adjusted on Placed | REDESIGN |
| Delete job order | Hard delete incl. pipelines + status history + attachments + list entries + extra fields | `a=delete` (`:148-154`) | `JobOrders::delete()` (`lib/JobOrders.php:272-350`, history delete `:304-307`) | joborder, candidate_joborder, candidate_joborder_status_history, attachment, saved_list_entry, extra_field | ≥ DELETE | Erases reporting data (FEAT-003) | REDESIGN |
| Show job order + pipeline | Details, attachments, extra fields, pipeline mini-graph, AJAX pipeline table (sortable, paged, star rating, "Mark as Screened", select-all + Export), public posting link and questionnaire | `a=show` (`:100-106`, `show()` `:351-532`); pipeline HTML `ajax/getPipelineJobOrder.php` | `JobOrders`, `Pipelines::getJobOrderPipeline()` (`lib/Pipelines.php:537-646`), `Graphs` | joborder, candidate_joborder, candidate, attachment, activity, career_portal_questionnaire | `joborders.show` ≥ READ; rating `pipelines.screening`/`editRating` ≥ EDIT (`ajax/getPipelineJobOrder.php:293`, `ajax/setCandidateJobOrderRating.php`) | Rating −1..5 on candidate_joborder.rating_value; hidden for category `sourcer` | REDESIGN |
| Statuses & status groups | Job-order statuses are free strings grouped as Open (Active, On Hold, Full), Closed (Closed, Canceled), Pre-Open (Upcoming, Lead); sharing statuses (careers/RSS/XML) default `Active`; statistics statuses; default status — all overridable only by uncommenting PHP constants in `config.php:292-325` | `lib/JobOrderStatuses.php:40-155` | – | joborder.status (varchar) | – | Default statistics list contains `'OnHold'` (no space) (`lib/JobOrderStatuses.php:55`) → On Hold jobs silently excluded from stats (FEAT-008). No automation (e.g. to `Full` when openings reach 0: `grep "'Full'"` only in config arrays) | REDESIGN (DB-configurable) |
| Job types | C / C2H / FL / H; overridable via commented `JOB_TYPES` class in `config.php` | `lib/JobOrderTypes.php` | – | joborder.type | – | Config-file customisation | REDESIGN |
| Openings / openings available | `openings` = total; `openings_available` decremented on → Placed, incremented on Placed → other; Placed blocked if 0 | `CandidatesUI.php:2932-2942,3089-3100`; `JobOrders::checkOpenings()` (`lib/JobOrders.php:827-860`) | – | joborder | – | Not restored on pipeline removal; not transactional | REDESIGN |
| Public / careers posting | `public=1` + status in sharing list ⇒ listed on careers portal, RSS and XML feeds | form flag; `JobOrders::getAll(JOBORDERS_STATUS_SHARE)` (`lib/JobOrders.php:40,616-618`) | – | joborder.public | EDIT | – | KEEP (capability) / REDESIGN (multiposting) |
| Questionnaire attach | Select a careers questionnaire per job order | add/edit form; `show()` `:474-489` | `Questionnaire` | joborder.questionnaire_id | EDIT | – | REDESIGN |
| Consider candidate search | Modal name search to add candidates to this pipeline | `a=considerCandidateSearch` (`:195-215`, search `:1224`) | `SearchCandidates::byFullName()` | candidate | `joborders.considerCandidateSearch` ≥ EDIT | Name-only search; no matching/ranking | REDESIGN |
| Add to pipeline | Adds candidate at status 100 + activity type 400 "Added candidate to job order." | `a=addToPipeline` (`:217-226`, `onAddToPipeline()` `:1271-1319`) | `Pipelines::add()`, `ActivityEntries::add()` | candidate_joborder, activity | `pipelines.addToPipeline` ≥ EDIT | – | REDESIGN |
| Add new candidate into pipeline (modal) | Create candidate and add to this job in one step | `a=addCandidateModal` (`:228-243`) | `CandidatesUI::publicAddCandidate()` | candidate, candidate_joborder | `candidates.add` ≥ EDIT | Duplicates code with CandidatesUI::add (comment `CandidatesUI.php:886-888`) | REDESIGN |
| Change status from job order | Delegates to the candidates implementation with `isJobOrdersMode=true` | `a=addActivityChangeStatus` (`:175-193`, `onAddActivityChangeStatus()` `:1538-1554`) | `CandidatesUI::publicAddActivityChangeStatus()` (`CandidatesUI.php:402-412`) | as §3 | ≥ EDIT | Uses per-status e-mail defaults (`:1462-1466`) unlike candidate side (FEAT-018) | REDESIGN |
| Remove from pipeline | as candidates | `a=removeFromPipeline` (`:245-252`) | `Pipelines::remove()` | as above | ≥ DELETE | – | REDESIGN |
| Attachments | Upload / delete job-order files | `a=createAttachment` (`:254-272`), `a=deleteAttachment` (`:274-280`) | `Attachments` | attachment | EDIT / DELETE | – | REPLACE (storage) |
| Hot jobs | `is_hot` flag, styling, filter | form | – | joborder.is_hot | EDIT | – | KEEP |
| Company/contact/department linking; recruiter & owner | FK-less integer links; department resolved by name (`lib/JobOrders.php:100-105`) | form | `Contacts::getDepartmentIDByName()` (`lib/Contacts.php:769`) | joborder.company_id/contact_id/company_department_id/recruiter/owner | EDIT | MyISAM, no FK integrity | REDESIGN |
| Job order report (PDF) | See Reports 2.10 | link from Show (`Show.tpl` → `m=reports&a=customizeJobOrderReport`) | – | – | – | – | – |
| Administrative hide/show | as candidates | `a=administrativeHideShow` (`:292-298`) | `JobOrders::administrativeHideShow()` (`:808`) | joborder.is_admin_hidden | ≥ MULTI_SA | ASP remnant | RETIRE |
| HR mode | If site `is_hr_mode`, company is fixed to the internal company | `JobOrdersUI.php:580,671,936` | `Session::isHrMode()` | site.is_hr_mode | – | Toggle has no UI in repo (set in DB) | REDESIGN |
| Set candidate job order | `case` commented: `FIXME: function setCandidateJobOrder() does not exist` (`:282-290`) | – | – | – | – | Dead | RETIRE |

### 2.4 Pipelines (cross-cutting, `lib/Pipelines.php`)

| Feature | What it really does | Entry | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|
| Status list | Read from `candidate_joborder_status` (`is_enabled=1`), picker excludes 0 | `getStatuses()` `:382-401`, `getStatusesForPicking()` `:404-424` | candidate_joborder_status (seed `db/cats_schema.sql:267-277`) | – | No admin UI to rename/enable/add; codes duplicated as PHP constants (`constants.php:120-130`) and literals (`lib/Statistics.php:102,133,241,312,351,422,559,591`; `lib/Dashboard.php:85`; `lib/Pipelines.php:110`) | REDESIGN |
| Status change | UPDATE status, insert history row (from→to), audit row, optional e-mail | `setStatus()` `:294-379` | candidate_joborder, candidate_joborder_status_history, history, email_history | via callers (EDIT) | No transition validation; e-mail subject is a config constant (`:370-374`, `config.php:166`) | REDESIGN |
| Ratings | 0..5 stars per pipeline row; −1 = unscreened | `updateRatingValue()` `:648`, `ajax/setCandidateJobOrderRating.php` | candidate_joborder.rating_value | `pipelines.editRating` ≥ EDIT | Single rating, no rater, no criteria | REPLACE (structured scorecards) |
| Submission/placement counting | Submission = any history row `status_to=400`; placement = `status_to=800` | `lib/Statistics.php:90-149`; pipeline "submitted" flag `lib/Pipelines.php:592-607` | candidate_joborder_status_history | – | FEAT-008 | REDESIGN |
| Pipeline details | Per-pipeline activity/history popup | `ajax/getPipelineDetails.php`, `getPipelineDetails()` `:697` | activity, candidate_joborder | AUTH (SecureAJAXInterface) | – | REDESIGN |

### 2.5 Activities (`modules/activity`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|---|
| Activity list | Site-wide activity grid, default last month | `a=listByViewDataGrid`/default (`ActivityUI.php:77-80`) | `ActivityDataGrid` (`modules/activity/dataGrids.php:39`) | activity, activity_type, candidate, contact, company, joborder, user | AUTH (0 `getUserAccessLevel` calls in `ActivityUI.php`) | Not user-scoped | REDESIGN |
| Filter by period | last week / month / 6 months / year / all or explicit date range | `a=viewByDate` (`:65-75`, periods `:147-168`) | `DataGrid` | activity | AUTH | – | REDESIGN |
| Log activity | Types: Call 100, Email 200, Meeting 300, Other 400, Call (Talked) 500, Call (LVM) 600, Call (Missed) 700 (`db/cats_schema.sql:73-79`); optional "regarding" job order | via candidates/contacts modals | `ActivityEntries::add()` | activity, history | EDIT (in callers) | Manual logging only; no e-mail/phone integration | REDESIGN |
| Edit / delete activity | Inline AJAX edit/delete | `ajax/editActivity.php:113`, `ajax/deleteActivity.php:47` | `ActivityEntries::update()/delete()` | activity, history | **AUTH only** (SecureAJAXInterface, no level check) | READ users can alter the audit trail (FEAT-006) | REDESIGN |

### 2.6 Calendar (`modules/calendar`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|---|
| Calendar view (day/week/month) + "Goto Today", "My Upcoming Events" | JS calendar fed by `dynamicData` string of all site events for the month | `a=showCalendar` (`CalendarUI.php:83-86`), `a=dynamicData` (`:75-77`, `:305-341`) | `Calendar::getEventArray()` (`lib/Calendar.php:83-150`), `makeEventString()` | calendar_event, calendar_event_type, user | AUTH (tab `*al=READ` is cosmetic, `:44`) | Private events leaked (FEAT-004) | REPLACE (calendar sync) |
| Add / edit / delete event | Type (Call, Email, Meeting, Interview, Personal, Other — `db/cats_schema.sql:151-156`), date/time or all-day, duration, public flag, regarding data item + job order, reminder (e-mail address + minutes before) | `a=addEvent` (`:61`), `a=editEvent` (`:68`), `a=deleteEvent` (`:79`) | `Calendar::addEvent/updateEvent/deleteEvent` (`:297,392,471`) | calendar_event | add ≥ EDIT (`:345`), edit ≥ EDIT (`:504`), delete ≥ DELETE (`:689`) | Single owner; no attendees/invites/ICS | REPLACE |
| Show other users' entries | SA toggle "Show Entries from Other Users" | `Calendar.tpl:16-21`, `CalendarUI.php:173` | – | – | `calendar.show` ≥ SA | Client-side filter only | REDESIGN |
| Reminders | Recurring queue task `* * * * *` e-mails due reminders using `$GLOBALS['eventReminderEmail']` text (`config.php:228-242`), then disables reminder | `modules/calendar/tasks/Reminders.php:47-100`, registered `modules/calendar/tasks/tasks.php:39` | `Calendar::getAllDueReminders()` (`lib/Calendar.php:209-250`), `Calendar::sendEmail()` (`:944`) | calendar_event, queue, email_history | – | Reminder checkbox shown only if queue ran within 5 min (`CandidatesUI.php:1748-1755`, `lib/QueueProcessor.php:513-525`); needs external cron (FEAT-010) | REPLACE (job scheduler + calendar provider reminders) |
| Customize calendar | Site calendar preferences | `m=settings&a=customizeCalendar` (`SettingsUI.php:453`) | `CalendarSettings` (`lib/Calendar.php:981+`) | settings | GET ≥ DEMO, POST ≥ SA | – | REDESIGN |

### 2.7 Companies (`modules/companies`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|---|
| Company list | Grid; "Only My", "Only Hot" | `a=listByView` (`CompaniesUI.php:178-186`) | `CompaniesDataGrid` (`lib/Companies.php:743`) | company, user, joborder, contact | ≥ READ (`:180`) | In HR mode the list redirects to internal company (`:198`) | REDESIGN |
| Add / edit | Name, address, phones, URL, key technologies, notes, hot, billing contact, departments (inline list editor), extra fields; owner change e-mails `EMAIL_TEMPLATE_OWNERSHIPASSIGNCLIENT` (`:633-635,766-768`) | `a=add` (`:91`), `a=edit` (`:107`) | `Companies::add()` → `CompanyRepository` (`lib/Companies.php:85-110`), `update()` (`:134`), `updateDepartments()` (`:624`) | company, company_department, contact (address propagation `Contacts::updateByCompany()`), history | ≥ EDIT | – | REDESIGN |
| Show | Details, contacts, job orders, attachments, extra fields | `a=show` (`:75-81`) | `Companies::get()` | company, contact, joborder, attachment | ≥ READ | – | REDESIGN |
| Delete | Hard delete **cascading to all contacts, job orders (with pipelines and status history), attachments, list entries** | `a=delete` (`:123-129`, `onDelete()` `:869-910`) | `Companies::delete()` (`lib/Companies.php:214-305`) | company, contact, joborder, candidate_joborder*, attachment, saved_list_entry, extra_field | ≥ DELETE | Only guard: default company cannot be deleted (`:889-893`) (FEAT-003) | REDESIGN |
| Search | By name, by key technologies | `a=search` (`:131-148`, modes `:995-1005`) | `SearchCompanies` (`lib/Search.php:724-839`) | company | ≥ READ | – | REPLACE (search) |
| Internal postings / default company | Redirects to the site's `default_company=1` record (used for internal/HR job orders) | `a=internalPostings` (`:83-89`, `:458-466`) | `Companies::getDefaultCompany()` (`:452`) | company.default_company | ≥ READ | – | REDESIGN (explicit "internal employer" concept) |
| Attachments | Upload / delete | `a=createAttachment` (`:150`), `a=deleteAttachment` (`:169`) | `Attachments` | attachment | EDIT / DELETE | – | REPLACE (storage) |

### 2.8 Contacts (`modules/contacts`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|---|
| Contact list | Grid; "Only My", "Only Hot" | `a=listByView` (`ContactsUI.php:186-194`) | `ContactsDataGrid` (`lib/Contacts.php:804`) | contact, company, user | ≥ READ | – | REDESIGN |
| Add / edit | Company, name, title, department, **reports-to** (contact), e-mails, phones, address, **left company** flag, notes, hot, owner; owner change e-mails `EMAIL_TEMPLATE_OWNERSHIPASSIGNCONTACT` (`:627-629,759-761`) | `a=add` (`:93`), `a=edit` (`:109`) | `Contacts::add()/update()` (`lib/Contacts.php:81,204`, reports_to `:97`, left_company `:108,234`) | contact, company_department, history | ≥ EDIT | HR mode pre-selects internal company (`:426`) | REDESIGN |
| Show | Details, job orders, activities, upcoming events | `a=show` (`:85-91`) | `Contacts::get()` | contact, joborder, activity, calendar_event | ≥ READ | – | REDESIGN |
| Delete | Hard delete | `a=delete` (`:125-131`) | `Contacts::delete()` (`:347`) | contact, ... | ≥ DELETE | – | REDESIGN |
| Search | By full name, company name, title | `a=search` (`:133-149`, modes `:976-991`) | `ContactsSearch` (`lib/Search.php:1099-1304`) | contact, company | ≥ READ | – | REPLACE (search) |
| Log activity / schedule event | Modal: activity on contact (optionally regarding a job order) and/or event | `a=addActivityScheduleEvent` (`:151-165`, `_addActivityScheduleEvent()` `:1315`) | `ActivityEntries`, `Calendar` | activity, calendar_event | ≥ EDIT | – | REDESIGN |
| Cold call list | Printable list of contacts with a work phone, grouped by company | `a=showColdCallList` (`:167-173`, `ColdCallList.tpl`) | `Contacts::getColdCallList()` (`lib/Contacts.php:698-760`) | contact, company | ≥ READ | Legacy sales feature | RETIRE (or fold into CRM export) |
| vCard download | vCard 2.1-style file for a contact | `a=downloadVCard` (`:175-184`, `:1150`) | `VCard` (`lib/VCard.php`) | contact, company | ≥ READ | Works; niche | KEEP |

### 2.9 Lists (`modules/lists`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|---|
| Lists overview | Grid of saved lists with type column "Static/Dynamic" | `a=listByView` (`ListsUI.php:100-103`) | `ListsDataGrid` (`modules/lists/dataGrids.php:38,82`) | saved_list | AUTH (no level checks in `ListsUI.php`) | – | REDESIGN |
| Show list | Grid of list members for candidates/companies/contacts/job orders | `a=showList` (`:77-80`, `:141-212`) | `candidatesSavedListByViewDataGrid` etc. | saved_list, saved_list_entry + entity | AUTH | Dynamic lists unimplemented: `$dataGridInstance` only set when `isDynamic == 0` (`:159-180`); nothing ever creates `is_dynamic=1` (`lib/SavedLists.php:212`) | REDESIGN |
| Add to list | From quick-action menu or grid selection; create/rename/delete list inline | `a=quickActionAddToListModal` (`:82`), `a=addToListFromDatagridModal` (`:87`); `modules/lists/ajax/{newList,editListName,deleteList,addToLists}.php` | `SavedLists` | saved_list, saved_list_entry | AUTH (SecureAJAXInterface only) | READ users can delete lists | REDESIGN |
| Remove from list / delete list | – | `a=removeFromListDatagrid` (`:91`), `a=deleteStaticList` (`:95`) | `SavedLists::removeEntryMany()/delete()` | saved_list, saved_list_entry | AUTH | – | REDESIGN |
| `a=show` | commented `FIXME: function show() undefined` (`:71-75`) | – | – | – | – | Dead | RETIRE |

### 2.10 Reports & Graphs (`modules/reports`, `modules/graphs`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|---|
| Reports overview | 6 entity counts × 9 periods (54 COUNT queries per page load) | `a=reports` (`ReportsUI.php:86-89`, `:93-168`) | `Statistics` (`lib/Statistics.php:64-227`) | company, candidate, contact, joborder, candidate_joborder_status_history | AUTH (0 checks in `ReportsUI.php`) | – | REPLACE (analytics) |
| Submission report | Per period: job orders with submissions and the submitted candidates | `a=showSubmissionReport` (`:66`, `:188-266`) | `Statistics::getSubmissionJobOrders()/getSubmissionsByJobOrder()` | status history, joborder, candidate | AUTH | Counts history rows (FEAT-008) | REPLACE |
| Placement report | Same for placements | `a=showPlacementReport` (`:70`, `:268-346`) | `Statistics::getPlacementsJobOrders()` | as above | AUTH | – | REPLACE |
| Job order report (PDF) | Editable form (site, company, position, period, managers, notes) → FPDF "Recruiting Summary Report" with a bar graph of pipeline / submitted / interviewing / placed | `a=customizeJobOrderReport` (`:74`, `:348-398`); `a=generateJobOrderReportPDF` (`:62`, `:409-565`) | `Statistics::getJobOrderReport()` (`:601`), FPDF | joborder, candidate_joborder, status history | AUTH | PDF content comes entirely from GET parameters (`:421-439`); bar labelled "Screened" is total pipeline (`GraphsUI.php:176`, `ReportsUI.php:374-377`); hard-coded `cognizo` branding (`:450-456`); server fetches its own graph over HTTP (`:487-500`) | REPLACE |
| EEO report | Pie/bar charts by gender/ethnicity/veteran/disability over period (week/month/all) and status (all/rejected/placed) | `a=customizeEEOReport` (`:78`), `a=generateEEOReportPreview` (`:82`, `:567-720`) | `Statistics::getEEOReport()` (`:694`) | candidate, candidate_joborder, eeo_* | AUTH (not gated on `can_see_eeo_info`) | Chart data passed in image URLs | REDESIGN (compliance reporting) |
| Graph view | Displays an image URL passed in `theImage` | `a=graphView` (`:58`, `:171-186`) | – | – | AUTH | – | RETIRE |
| Graphs (images) | Unauthenticated: `jobOrderReportGraph`, `generic`, `genericPie`, `wordVerify` (CAPTCHA), `testGraph`; logged-in: `activity`, `newCandidates`, `newJobOrders`, `newSubmissions`, `miniPlacementStatistics`, `miniJobOrderPipeline` | `GraphsUI.php:78-131` | `GraphGenerator`, artichow | status history etc. | mixed (`_authenticationRequired=false`, `:48`) | artichow is PHP-4-era | REPLACE |
| Customize Reports (settings) | Form with `reportImageURL` inputs; POST branch is empty | `m=settings&a=reports` (`SettingsUI.php:473-486`; empty `if ($this->isPostBack()) { }` `:478-481`) | – | – | ≥ DEMO | Stub | RETIRE |
| `NewDataItems.tpl` | Template never referenced | – | – | – | – | Orphan | RETIRE |

### 2.11 Import (`modules/import`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|---|
| CSV / tab import wizard | Choose type (Candidates, Job Orders, Companies, Contacts — `Import1.tpl:84-87`), upload, map columns (incl. "add as Extra Field", SA only `Import.tpl:206`), options (auto-create companies for contacts `Import.tpl:159-168`), commit | `a=import` (`ImportUI.php:117-128`), `a=importSelectType` (`:81`), `a=importUploadFile` (`:85`), `onImport()` (`:409`), `onImportFieldsDelimited()` (`:740`) | `modules/import/Import.php` (`Import`, `JobOrdersImport` `:368`), `CandidatesImport`, `CompaniesImport`, `ContactsImport` | candidate, joborder, company, contact, extra_field, extra_field_settings, import | onImport ≥ EDIT (`:411,742`); select/upload steps AUTH | Each row stamped with `import_id` for revert; no duplicate detection on import | REDESIGN |
| View recent imports / errors | List imports, view per-import errors | `a=viewpending` (`:77`), `a=viewerrors` (`:73`) | `Import` | import | AUTH | – | REDESIGN |
| Revert import | Deletes all rows with that `import_id` from the target table + created extra fields | `a=revert` (`:69`, `:134-168`), `Import::revert()` (`Import.php:203-260`) | – | target entity table, extra_field, extra_field_settings, import | **AUTH only** | Does not cascade to pipelines/attachments created since | REDESIGN |
| Mass resume import | Resumes must be copied to the server directory `upload/<site>/massimport` (`MassImportStep1.tpl:14-41`, advises `chmod -R 777`); 4-step wizard converts, optionally parses (Resfly), lets user edit, creates candidates | `a=massImport` (`:97`, `:1496-1654`), `a=massImportDocument` (`:101`, `:1340`), `a=massImportEdit` (`:105`) | `DocumentToText`, `ParseUtility`, `AttachmentCreator` | candidate, attachment | ≥ EDIT (`:1507`) | No browser upload; relies on shell access | REPLACE (browser bulk upload + async processing) |
| Bulk resumes (unattached) | Import or delete "bulk resume" attachments (`DATA_ITEM_BULKRESUME`) | `a=importBulkResumes` (`:109`), `a=deleteBulkResumes` (`:113`), `a=whatIsBulkResumes` (`:89`) | `Attachments::getBulkAttachments()` | attachment | ≥ SA (`:2027,2060`) | – | RETIRE (fold into bulk upload) |
| Legacy server-dir scan | Lists every file under `./upload/` recursively | `a=showMassImport` (`:93`, `:1290-1332`) | – | – | **AUTH only** | Directory listing of server upload dir | RETIRE |
| `ImportCommits.tpl` | never referenced | – | – | – | – | Orphan | RETIRE |

### 2.12 Export (`modules/export`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|---|
| Datagrid CSV export | Exports selected rows / current page / all rows of any datagrid, respecting visible columns | `a=exportByDataGrid` (`ExportUI.php:60-62`), `DataGrid::drawCSV()` | `DataGrid` (`lib/DataGrid.php:1380+`) | any grid | **AUTH only** (0 checks in `ExportUI.php`) | READ users can export the whole candidate DB; no formula-injection escaping; not logged | REDESIGN |
| Legacy candidate export | `a=export` with `dataItemType`, "only selected"/ids/all; only `DATA_ITEM_CANDIDATE` supported (`lib/Export.php:132-140`) | `a=export` (`:64-67`) | `Export::getFormattedOutput()` | candidate | AUTH | Superseded by datagrid export | RETIRE |

### 2.13 Attachments (`modules/attachments`)

| Feature | What it really does | Entry | Backing lib | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|---|
| Download attachment | Streams file inline; authorisation = logged in + `md5(directoryName)` in URL; loads with `new Attachments(-1)` (no site filter) | `a=getAttachment` (`AttachmentsUI.php:59-61`, `:67-147`) | `Attachments::get($id, false)` | attachment | AUTH + hash | Also serves backup archives (`contentType == 'catsbackup'`, `:95-102`) | REPLACE (signed URLs from object storage) |
| Local copy of remote attachment | `ajax/getAttachmentLocal.php` | – | `Attachments` | attachment | AUTH | – | REPLACE |

### 2.14 Careers portal (`modules/careers`, `careers/index.php`)

All careers features are **PUBLIC** (no login) and operate on `Site::getFirstSiteID()` only (`CareersUI.php:79`). Portal disabled by default (`lib/CareerPortal.php:77`).

| Feature | What it really does | Entry (`p=` unless noted) | Backing lib | Tables | Notes | Disp. |
|---|---|---|---|---|---|---|
| Portal home | Renders "Content - Main" template of the active board | default (`CareersUI.php:859-933`) | `CareerPortalSettings::getTemplate()` (`lib/CareerPortal.php:307`) | settings, career_portal_template(_site) | `?templateName=` overrides active template (`:106-109`) | REDESIGN |
| Job listings | Table of shared public jobs if `allowBrowse` | `showAll` (`:151-178`), `getResultsTable()` (`:1115`) | `JobOrders::getAll(JOBORDERS_STATUS_SHARE)` (`:115`) | joborder, company | – | REDESIGN |
| Job details | Single job page | `showJob` (`:793-854`) | `JobOrders::get()` | joborder | – | REDESIGN |
| Job search | `search` (`:180-182`) and `searchResults` (`:856-858`) are **empty branches**; `<a-LinkSearch>` still rendered (`:939`) | – | – | – | Broken/stub (FEAT-011) | REDESIGN |
| Apply (with resume upload, questionnaire, EEO) | Form built from template tags incl. `<input-eeo-*>` (`:620-650`); multi-step if questionnaire | `applyToJob` (`:412-713`) | `Questionnaire`, `AttachmentCreator` | – | No CAPTCHA/rate limit (`grep -i captcha modules/careers/CareersUI.php` → none) | REDESIGN |
| Apply submit | Finds candidate by e-mail (`:1298`) else creates one (source "Online Careers Website" `:1251`, owner = automated user); runs questionnaire actions (`:1345`); attaches resume; adds to pipeline at 100 (`:1414`); logs activity; e-mails candidate (`EMAIL_TEMPLATE_CANDIDATEAPPLY` `:1475`) and job owner + recruiter (`EMAIL_TEMPLATE_CANDIDATEPORTALNEW` `:1529`) | `onApplyToJobOrder` (`:715`, `onApplyToJobOrder()` `:1190-1603`) | `Candidates`, `Pipelines`, `ActivityEntries`, `CareerPortalSettings::sendEmail()` | candidate, attachment, candidate_joborder, activity, career_portal_questionnaire_history, email_history | No consent capture, no duplicate check beyond e-mail | REDESIGN |
| Candidate "registration/login" | Enabled by `candidateRegistration`; "login" = POSTed template fields matched against candidate columns (default template: e-mail + last name + ZIP) | `candidateRegistration` (`:359-410`), `ProcessCandidateRegistration()` (`:1635-1735`) | – | candidate | No password; cookie `cats<site>cw` holds the fields for 2 weeks (`:1720-1728`) (FEAT-005) | REPLACE (proper candidate accounts / magic-link) |
| Candidate profile update | View/edit own profile, latest resume, logout | `registeredCandidateProfile` (`:183-257`), `onRegisteredCandidateProfile` (`:259-357`), `pa=updateProfile`/`pa=logout` (`:134-148`) | `Candidates::update()` | candidate, attachment | As above | REPLACE |
| Questionnaires | Admin-defined questions (text/checkbox/select/radio); answers can trigger actions: set source, notes, hot, active, can relocate, key skills | admin: `m=settings&a=careerPortalQuestionnaire*`; runtime `Questionnaire::doActions()` (`lib/Questionnaire.php:583`, action columns `:169-174,422-427`) | `Questionnaire` | career_portal_questionnaire, _question, _answer, _history | Crude knockout/auto-tagging; no scoring | REDESIGN |
| Template customization | Raw-HTML templates with custom `<input-…>`, `<searchResultsTable>` etc. tags; two stock boards ("CATS 2.0", "Blank Page": 22 seed rows) | `m=settings&a=careerPortalSettings` (`SettingsUI.php:560`), `a=careerPortalTemplateEdit` (`:540`), `a=onCareerPortalTweak` (`:603`), preview `a=previewPage/previewPageTop` (`:351,359`) | `CareerPortalSettings` | career_portal_template, career_portal_template_site, settings | Not responsive (no viewport meta anywhere: `grep -rn viewport lib modules careers` → none) | REPLACE (modern hosted careers site) |
| Unused settings/templates | `allowXMLSubmit` defined only (`lib/CareerPortal.php:83`); `useCATSTemplate` has no UI; `Openings.tpl`, `SearchOpenings.tpl`, `Blank2.tpl`, `BlankNoMargin.tpl` unreferenced | – | – | – | Dead | RETIRE |

### 2.15 RSS / XML job feeds (`modules/rss`, `modules/xml`)

| Feature | What it really does | Entry | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|
| RSS feed | RSS 2.0 of shared public jobs linking to careers page | `m=rss` / `rss/index.php` (`RssUI.php:57-66`, `displayPublicJobOrders()`) | joborder | PUBLIC | First site only | KEEP (minor) |
| XML job feed | Template-driven XML for job boards: `indeed.xtpl`, `simplyhired.xtpl`, `rss.xtpl`; `?t=` picks template; access logged to `http_log` | `m=xml` / `xml/index.php` (`XmlUI.php:62-70`, `:128-340`) | joborder, xml_feeds, http_log | PUBLIC | Formats date from 2008-era; ASSUMPTION: current Indeed/other boards require different schemas/APIs | REPLACE (job distribution/multiposting) |

### 2.16 Settings / Administration (`modules/settings`)

All 51 `a=` actions, `SettingsUI.php` line of the `case` and effective gate:

| Feature | Entry (`a=`, line) | What it does / notes | Tables | Access | Disp. |
|---|---|---|---|---|---|
| My Profile (default) | `myProfile` (`:884`) | Profile page, change password link | user | ≥ READ | KEEP |
| Change password | `changePassword` (`:248`) | Verifies current password (md5) and sets new (`lib/Users.php:642-710`); LDAP users blocked | user | ≠ DEMO | REDESIGN |
| Administration hub | `administration` (`:856`) | Links: site name, version check, passwords, localization, system info, users, e-mail, templates, career portal, EEO, extra fields, calendar, reports, backup, login activity, tags; plus link to `catsone.com/?a=careerswebsite` (`Administration.tpl:39`) | – | GET ≥ DEMO, POST ≥ SA (or `careerportal` category) | REDESIGN |
| Site name | `administration&s=siteName` (`:2386`), POST `changeSiteName` (`:2525`) | Rename site | site | ≥ SA | KEEP |
| New version check | `s=newVersionCheck` (`:2390`), POST `changeVersionCheck` (`:2544`) | Toggle phone-home to catsone.com | system | ROOT or DEMO | RETIRE |
| Passwords | `s=passwords` (`:2403`) | Shows a "Allow retrieval of forgotten passwords" checkbox with **no form/handler** (`Passwords.tpl:26-33`) | – | ROOT or DEMO | RETIRE |
| Localization | `s=localization` (`:2412`), POST (`:2558-2583`) | Integer time-zone offset + MDY/DMY; forces logout | site | ≥ SA | REPLACE (IANA TZ + i18n) |
| System information | `s=systemInformation` (`:2423`) | DB version, install dir, OS, module schema versions | module_schema | ≥ SA | KEEP (ops page) |
| User management | `manageUsers` (`:335`), `showUser` (`:367`), `addUser` (`:376`), `editUser` (`:396`), `deleteUser` (`:613`) | CRUD users; access level; EEO visibility; categories/roles from `ACL_SETUP` (`:72-74`); seat licensing (`lib/Users.php:873-915`) | user, access_level, site | view ≥ DEMO; POST ≥ SA; delete ≥ SA | REDESIGN (RBAC, SSO provisioning) |
| Login activity | `loginActivity` (`:652`) | Successful/unsuccessful logins with IP/host | user_login | ≥ DEMO | REDESIGN (security audit log) |
| Item history | `viewItemHistory` (`:663`) | Field-level change history for a record | history | ≥ DEMO | REDESIGN (immutable audit) |
| E-mail settings | `emailSettings` (`:488`), handler `:2027-2067` | Mailer on/off & from-address; per-status "send e-mail by default" toggles; enable/disable each template; test mail (`ajax/testEmailSettings.php`) | settings, email_template | GET ≥ DEMO, POST ≥ SA | REDESIGN |
| E-mail templates | `emailTemplates` (`:621`), `addEmailTemplate` (`:875`), `deleteEmailTemplate` (`:879`) | Edit 7 system templates (seed `db/cats_schema.sql:631-637`) + custom templates with `%VAR%` placeholders | email_template | POST ≥ SA; add/delete check `_realAccessLevel ≥ SA` (`:910-916`) | REDESIGN |
| Career portal settings / templates / questionnaires | `careerPortalSettings` (`:560`), `careerPortalTemplateEdit` (`:540`), `onCareerPortalTweak` (`:603`), `careerPortalQuestionnaire` (`:516`), `careerPortalQuestionnaireUpdate` (`:532`), `careerPortalQuestionnairePreview` (`:508`), `previewPage(Top)` (`:351,359`) | See 2.14 | settings, career_portal_* | mostly GET ≥ DEMO / POST ≥ SA, **but questionnaire create/update only ≥ DEMO** (`:516-538`) | REPLACE |
| EEO settings | `eeo` (`:583`) | Enable EEO and each category | settings | GET ≥ DEMO, POST ≥ SA | REDESIGN |
| Extra fields | `customizeExtraFields` (`:433`), command script `ADDFIELD/DELETEFIELD/ADDOPTION/DELETEOPTION/SWAPFIELDS/RENAMEROW` (`:1519-1560`) | Per entity type | extra_field_settings, extra_field | GET ≥ DEMO, POST ≥ SA | REDESIGN |
| Calendar customization | `customizeCalendar` (`:453`) | – | settings | GET ≥ DEMO, POST ≥ SA | REDESIGN |
| Reports customization | `reports` (`:473`) | Empty POST handler (`:478-481`) | – | ≥ DEMO | RETIRE |
| Tags admin | `tags` (`:232`), `ajax_tags_add/del/upd` (`:675,684,693`) | Tag tree; AJAX add/delete need **only a session** (`:676-699`, handlers `:130-190`); `onChangeTags()` is an empty TODO (`:201-205`); `onChangeTag()` update is commented (`:190`) | tag | page ≥ SA; AJAX AUTH | REDESIGN |
| Backup | `createBackup` (`:417`), `deleteBackup` (`:425`), `modules/settings/ajax/backup.php` | Zip of SQL dump (+restore chunks) and/or attachments stored as a `catsbackup` attachment; **restore only via installer** (`modules/install/ajax/ui.php:679-694`) | attachment, all tables | ≥ SA | REPLACE (managed DB/object-store backups) |
| Professional / upgrade | `professional` (`:343`, `manageProfessional()` `:2684`), `Professional.tpl` | License-key entry and catsone.com upsell; with the shipped key every install is already "Professional" (§5) | – | ≥ DEMO | RETIRE |
| Firefox toolbar modal | `getFirefoxModal` (`:671`) | "Download Firefox" prompt | – | AUTH | RETIRE |
| First-run pages | `newInstallPassword` (`:260`), `forceEmail` (`:275`), `newSiteName` (`:290`), `upgradeSiteName` (`:305`), `newInstallFinished` (`:320`) | Legacy post-install prompts (also driven from `LoginUI::attemptLogin()` `:396-426`) | user, site | ≥ SA | REDESIGN (onboarding) |
| Wizard AJAX | `ajax_wizardAddUser` (`:702`), `…DeleteUser` (`:716`), `…CheckKey` (`:730`), `…Localization` (`:744`), `…FirstTimeSetup` (`:758`), `…License` (`:772`), `…Password` (`:786`, password in GET, min 5 chars `:3206`), `…SiteName` (`:800`), `…Email` (`:814`, ≥ READ), `…Import` (`:828`), `…Website` (`:842`, only a hook) | Back-end of the login wizard | user, site, settings | ≥ SA unless noted | REDESIGN |
| ASP localization | `aspLocalization` (`:641`) | Hosted-edition localization prompt | site | ≥ SA | RETIRE |

### 2.17 Login / authentication (`modules/login`, `lib/Session.php`, `lib/Users.php`, `lib/LDAP.php`)

| Feature | What it really does | Entry | Tables | Access | Notes | Disp. |
|---|---|---|---|---|---|---|
| Login form / login | Username (or `user@siteID`) + password; md5 compare (`lib/Users.php:840`); records attempt | `a=showLoginForm` (`LoginUI.php:72`), `a=attemptLogin` (`:53`, `:186-435`) | user, user_login, site | PUBLIC | Then drives wizard/first-run redirects (`:296-433`); optional single-session (`ENABLE_SINGLE_SESSION`, `config.php:183`) | REPLACE (IdP/SSO + modern hashing) |
| LDAP / AD auth | `AUTH_MODE` `sql`, `ldap`, `sql+ldap` (`config.php:48`); first LDAP login auto-creates a **disabled** local user pending approval (`lib/Users.php:846-851`) | `Users::isCorrectLogin()` (`:782-870`), `LDAP` | user | PUBLIC | Only directory integration present; no SAML/OIDC | REPLACE |
| Forgot password | Form posts username; handler calls non-existent `Users::getPassword()` and undefined `PASSWORD_RESET_SUBJECT/BODY` | `a=forgotPassword` (`:57-66`, `:448-480`) | – | PUBLIC | Broken; not linked from `Login.tpl` (FEAT-009) | REPLACE (token reset) |
| No-cookies modal | Help popup | `a=noCookiesModal` (`:68`) | – | PUBLIC | – | RETIRE |
| Demo login | "Login to Demo Account" links (`Login.tpl:38,72`) when demo mode | – | – | PUBLIC | `ENABLE_DEMO_MODE=false` | RETIRE |
| Logout | `m=logout` pseudo-module (`index.php:220-226`) | – | – | AUTH | – | KEEP |

### 2.18 Toolbar (`modules/toolbar`) — Firefox extension back-end

| Feature | Entry | Notes | Disp. |
|---|---|---|---|
| Authenticate (credentials in GET `CATSUser`/`CATSPassword`) | `a=authenticate` (`ToolbarUI.php:71`, `_authenticate()` `:90-121`) | Requires Professional (`:114`) — always true | RETIRE |
| Check e-mail in system | `a=checkEmailIsInSystem` (`:75`) | Candidate lookup by e-mail | RETIRE |
| Store Monster resume text | `a=storeMonsterResumeText` (`:79`) | Scrapes pasted Monster.com HTML into session for Add Candidate | RETIRE |
| Legacy JS lib / remote version | `a=getJavaScriptLib` (`:67`), `a=getRemoteVersion` (`:63`, returns 99999) | "Obsolete" per comment | RETIRE |
| Get license key | `a=getLicenseKey` (`:83`, `:282-285`) | **Unauthenticated** echo of `LICENSE_KEY` (module `_authenticationRequired=false`, `:46`) | RETIRE |
| Attempt login | `a=attemptLogin` (`:59`) | Calls `$this->attemptLogin()` which does not exist in `ToolbarUI` or `UserInterface` → fatal | RETIRE |
| Install page | `install.tpl` references `modules/toolbar/catstoolbar.xpi` (`install.tpl:62`) which is not in the repo | Orphan | RETIRE |

### 2.19 Queue / background tasks (`modules/queue`, `lib/QueueProcessor.php`, `QueueCLI.php`)

| Feature | What it really does | Notes | Disp. |
|---|---|---|---|
| Queue processor | `QueueCLI.php` (meant for cron) registers module tasks and runs the next due task; cleans up errored/old tasks hourly | Uses `get_magic_quotes_runtime()` (`QueueCLI.php:59`) → fatal on PHP ≥ 8.0; no cron in `docker/` (`grep -rn cron docker/` → none) | REPLACE (worker + scheduler) |
| Registered tasks | `Calendar Reminders` (`modules/calendar/tasks/tasks.php:39`), `CleanExceptions` (`modules/queue/tasks/tasks.php:39`) | `SampleRecurring`/`SampleTask` are samples; only other async use is `QueueProcessor.php:156` | REPLACE |
| Web UI | `m=queue` has an empty switch (`QueueUI.php:49-56`) | No admin visibility of jobs | RETIRE |

### 2.20 Wizard (`modules/wizard`, `lib/Wizard.php`)

| Feature | Notes | Disp. |
|---|---|---|
| Generic modal wizard engine (pages stored in `$_SESSION['CATS_WIZARD']`, `a=ajax_getPage`) used by the post-login first-run wizard: Welcome, License, Password (if admin/`cats`), E-mail, Site name, Setup Users (`LoginUI.php:300-362`) | `WizardUI` page list is commented out (`WizardUI.php:52-73`); login-wizard `Localization.tpl` never added; "Setup Users" add fails with 0 licenses (FEAT-019) | REDESIGN (onboarding) |

### 2.21 Tests (`modules/tests`)

| Feature | Notes | Disp. |
|---|---|---|
| In-app SimpleTest runner: `a=selectTests`, `a=runSelectedTests` (`TestsUI.php:84-92`), `WebTests` log in with `TESTER_LOGIN` and create users with DELETE level (`modules/tests/testcases/WebTests.php:29-35`) | Reachable by any logged-in user (`TestsUI.php:65`) (FEAT-014) | RETIRE |

### 2.22 Install / upgrade (`installwizard.php`, `modules/install`)

| Feature | Notes | Disp. |
|---|---|---|
| Web installer: environment tests (`lib/InstallationTests.php`), DB create/load, config write, optional components, **restore from `./restore/catsbackup.bak`** (`modules/install/ajax/ui.php:691-694`), attachment re-index/re-layout (`modules/install/ajax/attachmentsReindex.php`, `attachmentsToThreeDirectory.php`, ≥ SA/ROOT), schema migrations per module (`modules/install/Schema.php`) | `CATSUI::handleRequest()` is empty | REPLACE (migrations tool + IaC) |

### 2.23 Cross-cutting UI services

| Feature | Evidence | Disp. |
|---|---|---|
| Tabs & sub-tabs with `*al=LEVEL@secobj` visibility (cosmetic only) | `CandidatesUI.php:73-76`, `lib/TemplateUtility.php:600-720` | REDESIGN |
| Datagrid engine (column chooser, resize `ajax/setColumnWidth.php`, filters, paging, selection, export, action area) | `lib/DataGrid.php` (2649 LOC) | REPLACE (modern table component + API) |
| Quick-action menus (Add To List, Add To Pipeline, Merge) | `src/OpenCATS/UI/*QuickActionMenu.php`, `js/quickAction.js` | REDESIGN |
| Address parsing / ZIP lookup | `ajax/getParsedAddress.php`, `ajax/zipLookup.php` (unauthenticated `AJAXInterface`); US ZIP DB off (`US_ZIPS_ENABLED=false`, `config.php:262`) | REPLACE |
| Company/contact autocomplete | `ajax/getCompanyNames.php`, `getCompanyContacts.php`, `getCompanyLocation*.php` | REDESIGN |
| E-mail template tag preview | `ajax/replaceTemplateTags.php`, `ajax/showTemplate.php` | REDESIGN |
| Hooks (plugin points) | 278 `eval(Hooks::get(...))` sites; only `SettingsUI::defineHooks()` (`:87-127`) registers any | REPLACE (FEAT-015) |
| Empty endpoint | `ajax/getReportHTML.php` is 0 bytes | RETIRE |

---

## 3. Recruitment pipeline state machine

### 3.1 Statuses

| Code | Constant (`constants.php:120-130`) | Label (seed `db/cats_schema.sql:267-277`) | `triggers_email` seed | Special handling in code |
|---|---|---|---|---|
| 0 | `PIPELINE_STATUS_NOSTATUS` | No Status | 0 | Excluded from picker (`lib/Pipelines.php:419`) |
| 100 | `PIPELINE_STATUS_NOCONTACT` | No Contact | 0 | **Initial status** on every add (`lib/Pipelines.php:110`, literal) |
| 200 | `PIPELINE_STATUS_CONTACTED` | Contacted | 0 | – |
| 250 | `PIPELINE_STATUS_CANDIDATE_REPLIED` | Candidate Responded | 0 | – |
| 300 | `PIPELINE_STATUS_QUALIFYING` | Qualifying | 1 | – |
| 400 | `PIPELINE_STATUS_SUBMITTED` | Submitted | 1 | Counted as a *submission* for every history row (`lib/Statistics.php:102,241,312,559`); pipeline "submitted" flag (`lib/Pipelines.php:592-607`); dashboard "important" |
| 500 | `PIPELINE_STATUS_INTERVIEWING` | Interviewing | 1 | Dashboard "important"; "Interviews" grid column (`lib/JobOrders.php:1054-1062`) |
| 600 | `PIPELINE_STATUS_OFFERED` | Offered | 1 | Dashboard "important" |
| 650 | `PIPELINE_STATUS_NOTINCONSIDERATION` | Not in Consideration | 0 | Excluded from "submitted" join in candidate grid (`lib/Candidates.php` grid, `:1979`) |
| 700 | `PIPELINE_STATUS_CLIENTDECLINED` | Client Declined | 0 | – |
| 800 | `PIPELINE_STATUS_PLACED` | Placed | 1 | Guard + openings arithmetic; counted as *placement* (`lib/Statistics.php:133,351,422,591`, `lib/Dashboard.php:85`) |

`can_be_scheduled` column exists but is never read (`grep -rn canBeScheduled` outside `lib/Pipelines.php` → none). `candidate_joborder.date_submitted` is never written or read (`grep -rn date_submitted modules lib src` → none).

### 3.2 Diagram

```
                     Add to pipeline (UI a=addToPipeline, careers onApplyToJobOrder)
                     INSERT candidate_joborder.status = 100  (NO status-history row)
                                          |
                                          v
 +--------------------------------------------------------------------------------------+
 |  ANY enabled status  --->  ANY other enabled status   (lib/Pipelines.php:294-379)     |
 |  no transition table, no required order, no per-job workflow, no approvals           |
 |                                                                                      |
 |   100 No Contact -> 200 Contacted -> 250 Cand. Responded -> 300 Qualifying           |
 |        ("conventional" order only; nothing enforces it)          |                   |
 |                                                                  v                   |
 |   800 Placed <- 600 Offered <- 500 Interviewing <- 400 Submitted                     |
 |      ^   |                                                                           |
 |      |   +--(leave 800)--> openings_available + 1   (CandidatesUI.php:3096-3100)      |
 |      +--(enter 800) guard: checkOpenings() > 0 else fatal "job order has been filled"|
 |                      then openings_available - 1   (CandidatesUI.php:2932-2942,3089) |
 |                                                                                      |
 |   side exits (not terminal in code): 650 Not in Consideration, 700 Client Declined   |
 +--------------------------------------------------------------------------------------+
                                          |
                     Remove from pipeline (a=removeFromPipeline, >= DELETE)
                     DELETE candidate_joborder + ALL candidate_joborder_status_history
                     (submission/placement stats for that pair vanish; openings NOT restored)
```

### 3.3 Side effects of one status change (`CandidatesUI::_addActivityChangeStatus()`, `CandidatesUI.php:2900-3302`)

| Step | Condition | Effect | Evidence |
|---|---|---|---|
| 1 | target = 800 | Abort if `openings_available <= 0` | `:2932-2942`, `lib/JobOrders.php:827-860` |
| 2 | "Add activity" checked | Insert activity (type chosen, default note "Status change: X" pre-filled by JS `js/activity.js:710-714`; status names highlighted orange) | `:2946-2990` |
| 3 | status actually differs | UPDATE `candidate_joborder.status`, `date_modified` | `lib/Pipelines.php:333-347` |
| 4 | " | INSERT `candidate_joborder_status_history(from,to,date)` | `lib/Pipelines.php:350-352,427-462` |
| 5 | " | INSERT `history` audit row (`DATA_ITEM_PIPELINE`) | `lib/Pipelines.php:355-365` |
| 6 | "Send e-mail" checked AND template not disabled AND candidate has e-mail AND user not DEMO | Synchronous e-mail, subject `CANDIDATE_STATUSCHANGE_SUBJECT`, body = `EMAIL_TEMPLATE_STATUSCHANGE` with `%CANDSTATUS% %CANDPREVSTATUS% %JBODTITLE% %JBODCLIENT%` substituted client-side | `:3040-3080`, `lib/Pipelines.php:367-378`, `js/activity.js:738-750` |
| 7 | target = 800 | `openings_available - 1` | `:3089-3093` |
| 8 | source = 800, target ≠ 800 | `openings_available + 1` | `:3096-3100` |
| 9 | "Schedule event" checked | INSERT calendar_event (reminder fields) | `:3103-3230` |

Not implemented: automatic job-order status change when full, automatic rejection e-mails, interview scheduling, SLA timers, hiring-manager notifications, webhooks, any state-dependent required fields. The only e-mail trigger is the manual checkbox; the default checkbox state comes from `candidate_joborder_status.triggers_email` on the candidate side (`:1688`) but from E-Mail Settings on the job-order side (`JobOrdersUI.php:1462-1466`).

---

## 4. Half-implemented, disabled and upsell features

| # | Item | Evidence | Status |
|---|---|---|---|
| 1 | Candidate `a=savedLists` | `CandidatesUI.php:287`: `/* FIXME: function savedList() missing` | Commented out |
| 2 | Job order `a=setCandidateJobOrder` | `JobOrdersUI.php:282`: `/* FIXME: function setCandidateJobOrder() does not exist` | Commented out |
| 3 | Home `a=getAttachment` | `HomeUI.php:75`: `/* FIXME: undefined function getAttachment()` | Commented out |
| 4 | Lists `a=show` | `ListsUI.php:71`: `/* FIXME: function show() undefined` | Commented out |
| 5 | Dynamic saved lists | Only `is_dynamic = 0` is ever written (`lib/SavedLists.php:212`); `showList()` has no dynamic branch (`ListsUI.php:159-180`) | Schema + label only |
| 6 | Quick-search over lists | `HomeUI.php:204` `//$listsRS = $search->lists($query);` | Commented out |
| 7 | Careers job search | `CareersUI.php:180-182`, `:856-858` empty branches | Stub |
| 8 | Careers `allowXMLSubmit`, `useCATSTemplate` | `lib/CareerPortal.php:83-84`; only read at `CareersUI.php:962` | No UI |
| 9 | Customize Reports | `SettingsUI.php:478-481` empty postback | Stub |
| 10 | Passwords admin page | `Passwords.tpl:26-33` checkbox without form | Stub |
| 11 | Tag bulk edit / rename | `SettingsUI.php:201-205` `// TODO: Add tags changing code`; `:190` update commented | Stub |
| 12 | Forgot password | `LoginUI.php:456-461` calls undefined method/constants | Broken |
| 13 | Toolbar `attemptLogin`, XPI | `ToolbarUI.php:59-61`; `install.tpl:62` points to missing `catstoolbar.xpi` | Broken |
| 14 | Queue web UI | `QueueUI.php:49-56` empty switch | Stub |
| 15 | Wizard module page list | `WizardUI.php:52-73` commented | Stub |
| 16 | Login-wizard Localization / Register / Reregister pages | Localization never added; Register only under `CATS_TEST_MODE` (`LoginUI.php:313-329`), which is not defined in `config.php` | Dead |
| 17 | `graphs a=testGraph` | "intentionally empty" (`GraphsUI.php:139`) | Stub |
| 18 | Orphan templates | `candidates/HotList.tpl`, `candidates/Duplicates.tpl`, `careers/{Openings,SearchOpenings,Blank2,BlankNoMargin}.tpl`, `import/ImportCommits.tpl`, `reports/NewDataItems.tpl`, `toolbar/install.tpl` | Dead |
| 19 | Empty AJAX file | `ajax/getReportHTML.php` (0 bytes) | Dead |
| 20 | Unused columns | `candidate_joborder.date_submitted`, `candidate_joborder_status.can_be_scheduled` | Dead |
| 21 | Dead libs | `ControlPanel.php`, `Profile.php`, `Display.php`, `CBFUtility.php`, `JavaScriptCompressor.php`, `Encryption.php` | Dead (~3.9k LOC) |
| 22 | "Professional" licensing | `License::__construct()` sets professional + 32767 expiry (`lib/License.php:59-73`); `setKey()` returns true for any key (`:137-162`); `LicenseUtility::validateProfessionalKey()` returns true (`:658-661`); `isParsingEnabled()` returns true on every path (`:687-706`). Upsell pages remain (`Professional.tpl`, links to `catsone.com/professional`), random re-validation on page footer (`lib/TemplateUtility.php:842-848`) | Neutered upsell |
| 23 | ASP / hosted-edition gates | `isASP()` (company_id≠0), `isHrMode()`, MULTI_SA "administrative hide", `aspLocalization`, `ASP_WIZARD_*` hooks (`LoginUI.php:350,364`) | Dormant |
| 24 | `ACL_SETUP` roles | Entire role/ACL map is commented in `config.php:336-360` (only code-level customisation) | Disabled by default |
| 25 | Sphinx full-text, US ZIP radius search, resume parsing | `ENABLE_SPHINX=false` (`config.php:97`), `US_ZIPS_ENABLED=false` (`:262`), `PARSING_ENABLED=false` (`:51`) | Off by default |

---

## 5. Detailed findings

### FEAT-001 — Recruitment pipeline is a fixed, hard-coded status list with no workflow engine
- **Severity:** HIGH
- **Finding:** The 11 pipeline statuses exist in three places that must agree: seed rows in `candidate_joborder_status`, PHP constants, and numeric literals in SQL. There is no UI to add/rename/reorder statuses, no per-job or per-department workflow, and `Pipelines::setStatus()` accepts any enabled status from any other.
- **Evidence:** `constants.php:120-130`; `db/cats_schema.sql:267-277`; literals `lib/Pipelines.php:110` (`100,`), `lib/Statistics.php:102` (`status_to = 400`), `:133` (`status_to = 800`), `lib/Dashboard.php:85`; 52 `PIPELINE_STATUS_` references in 9 files; per-status e-mail toggles hard-coded per constant (`modules/settings/SettingsUI.php:2042-2049`); `setStatus()` only checks `$oldStatusID == $statusID` (`lib/Pipelines.php:324-331`).
- **Impact:** Cannot model client-specific or role-specific hiring stages (phone screen, onsite, reference check, offer approval). Adding a status silently breaks statistics, dashboard and e-mail settings.
- **Recommendation:** In the rebuild, model `workflow → stages → allowed transitions → stage actions` as data; migrate the 11 codes as a default template; replace every literal/constant with stage "semantics" flags (`is_submission`, `is_hire`, `is_rejection`).

### FEAT-002 — Candidate merge corrupts unrelated records and concatenates untrusted strings into SQL
- **Severity:** HIGH
- **Finding:** `mergeDuplicates()` moves `activity`, `attachment` and `calendar_event` rows by `data_item_id` only, without `data_item_type`, so contacts/companies/job orders whose numeric ID equals the discarded candidate ID lose their activities/attachments/events to the surviving candidate. The final `UPDATE candidate SET ...` is assembled from DB values and raw POST values (`$params['emails']`), and the loser is deleted without `site_id`, history or extra-field cleanup. MyISAM makes the sequence non-atomic.
- **Evidence:** `lib/Candidates.php:1314-1326` (`UPDATE activity SET data_item_id = %s WHERE data_item_id = %s AND site_id = %s`), `:1331-1343` (attachment), `:1347-1359` (calendar_event); string concatenation `:1437-1560`, e.g. `:1509` `"email1 = '" . $params['emails'][0]."'"` fed from `CandidatesUI.php:3537-3543`; delete `:1579-1584` (`DELETE FROM candidate WHERE candidate_id = %s`).
- **Impact:** Silent cross-entity data corruption; SQL errors on names containing `'` after activities were already moved (partial merge); SQL injection surface for SA users.
- **Recommendation:** Disable merge until rewritten; the new implementation must filter by `(data_item_type, data_item_id)`, run in a transaction, use parameters, and write an audit record of the merge.

### FEAT-003 — Destructive cascades erase business and reporting history
- **Severity:** HIGH
- **Finding:** Deleting a company deletes all its contacts and job orders; deleting a job order or candidate, or removing a pipeline row, deletes `candidate_joborder_status_history`, which is the sole source for submission/placement statistics and "Recent Hires". Activities and calendar events are left orphaned. No soft delete, undo, or retention hold exists.
- **Evidence:** `lib/Companies.php:214-305` (loops `$contacts->delete()` / `$jobOrders->delete()` / `$attachments->delete()`); `lib/JobOrders.php:304-307`; `lib/Candidates.php:394-397`; `lib/Pipelines.php:156-169`; only guard `CompaniesUI.php:889-893` (default company). `grep -rniE "soft ?delet|deleted_at|is_deleted"` → 0.
- **Impact:** A single DELETE-level click can wipe a client's full history and retroactively change historical KPIs.
- **Recommendation:** Soft-delete with retention policy; immutable event log for pipeline transitions; reporting from an append-only fact table.

### FEAT-004 — "Private" calendar events are only hidden in the browser
- **Severity:** HIGH
- **Finding:** `dynamicData` returns every event of the site for the month; the `public` flag is only applied by JavaScript, and the "show other users' entries" checkbox is just hidden for non-SA users.
- **Evidence:** `lib/Calendar.php:137-142` (WHERE month/year/site only); `modules/calendar/CalendarUI.php:305-341` (echoes all); `modules/calendar/Calendar.js:961-963` (`getData('public') == 0 && ... hideNonPublic ... continue`); `Calendar.tpl:16-21`.
- **Impact:** Personal/interview events marked private are readable by any logged-in user via the AJAX response.
- **Recommendation:** Filter server-side (`public = 1 OR entered_by = :user`, SA override explicit); in the rebuild delegate to Google/Microsoft calendars with proper ACLs.

### FEAT-005 — Careers-portal candidate "login" without a secret
- **Severity:** HIGH
- **Finding:** When `candidateRegistration` is enabled, a visitor is "logged in" if the POSTed template fields match a candidate row; the default template asks for e-mail, last name and ZIP. The matched fields are then stored URL-encoded in a 2-week cookie and used for subsequent profile views and updates (including the latest resume).
- **Evidence:** `modules/careers/CareersUI.php:1635-1735` (comment at `:1700`: "There needs to be 1 verification field (equivilant of a "password")"); default fields from `db/cats_schema.sql` "Content - Candidate Registration" (`<input-email>`, `<input-lastName>`, `<input-zip>`); cookie `:1720-1728`; profile/resume `:183-257`; update `:259-357`.
- **Impact:** Anyone knowing an applicant's e-mail, surname and ZIP can read and overwrite their profile — a personal-data exposure.
- **Recommendation:** Keep disabled; in the rebuild provide real candidate accounts (passwordless magic link / OIDC) with consent and self-service data export/erasure.

### FEAT-006 — Access control is global, coarse and missing on several features
- **Severity:** HIGH
- **Finding:** Each user has one numeric level for everything (plus optional code-defined `ACL_SETUP` categories). There is no record-level ownership or team scoping. Several modules perform no level check, so READ users can export all data, edit/delete activities, manage lists and tags, revert imports and view EEO reports; DEMO users can create/update careers questionnaires.
- **Evidence:** `lib/ACL.php` (global map), `lib/Session.php:403-406`; zero `getUserAccessLevel` calls in `modules/export/ExportUI.php`, `modules/lists/ListsUI.php`, `modules/reports/ReportsUI.php`, `modules/activity/ActivityUI.php`, `modules/home/HomeUI.php`; `ajax/editActivity.php:113`, `ajax/deleteActivity.php:47` (session only); `ImportUI.php:69-72` (revert, no check); `SettingsUI.php:675-699` (tag AJAX); `SettingsUI.php:516-538` (questionnaire ≥ DEMO).
- **Impact:** Least-privilege and data-segregation requirements of enterprise customers cannot be met; mass PII export is unrestricted and unlogged.
- **Recommendation:** Central policy layer (RBAC + record ownership/teams) enforced in services, not templates; export as a privileged, audited operation.

### FEAT-007 — Weak, unscoped duplicate detection; orphaned duplicate queue
- **Severity:** MEDIUM
- **Finding:** Duplicates are only detected for manual adds, only when first **and** last name match exactly, and the query has no `site_id` filter. Careers applicants are matched by e-mail only; CSV/mass imports and toolbar adds perform no check. `Duplicates.tpl` (a duplicates worklist) is never rendered.
- **Evidence:** `lib/Candidates.php:1136-1210` (`WHERE candidate.first_name = %s AND candidate.last_name = %s`, `:1152-1153`); only caller `CandidatesUI.php:2663`; careers `CareersUI.php:1298`; `Duplicates.tpl` unreferenced; `getDuplicatesCount()` unused.
- **Impact:** Duplicates proliferate (name typos, nicknames, imports); in multi-site installs cross-site IDs are linked.
- **Recommendation:** Rebuild as a dedupe service (normalized e-mail/phone, fuzzy name) invoked on every ingestion path with a review queue.

### FEAT-008 — Reporting numbers are fragile
- **Severity:** MEDIUM
- **Finding:** Submissions/placements are `COUNT(*)` of status-history rows, so toggling a candidate into Submitted twice counts two submissions; deletions erase history (FEAT-003). The default statistics job-order status list contains `'OnHold'` whereas the status is `'On Hold'`, excluding On-Hold jobs. The job-order PDF's numbers and labels come from GET parameters and "Screened" actually shows the total pipeline.
- **Evidence:** `lib/Statistics.php:90-121`; `lib/JobOrderStatuses.php:55` vs `:43`; `modules/reports/ReportsUI.php:421-439`; `modules/graphs/GraphsUI.php:176`; `ReportsUI.php:374-377`.
- **Impact:** KPIs (time-to-fill, submittal counts) are unreliable and non-reproducible.
- **Recommendation:** Event-sourced pipeline transitions + analytics model; fix the typo in any interim release.

### FEAT-009 — Forgot-password is broken by construction
- **Severity:** MEDIUM
- **Finding:** `onForgotPassword()` calls `Users::getPassword()` (not defined anywhere) and constants `PASSWORD_RESET_SUBJECT/BODY` (not defined; config defines `FORGOT_PASSWORD_*` instead, whose body says "Your current password is %s"). Passwords are stored as unsalted md5, so retrieval is impossible anyway. The page is not linked from `Login.tpl`.
- **Evidence:** `modules/login/LoginUI.php:448-480`; `grep -rn "function getPassword" lib` → only `lib/Session.php:366` (unrelated); `config.php:172-174`; `lib/Users.php:93,840`.
- **Impact:** No self-service recovery; admins must reset passwords manually.
- **Recommendation:** Replace with token-based reset (or delegate to IdP); remove the plaintext-password e-mail design.

### FEAT-010 — Reminders and background jobs cannot run on the supported stack
- **Severity:** MEDIUM
- **Finding:** Reminders (and exception cleanup) run only when an external cron invokes `QueueCLI.php` every minute; the repo ships no cron configuration and `QueueCLI.php` calls `get_magic_quotes_runtime()`/`get_magic_quotes_gpc()`, removed in PHP 8. The reminder option is hidden unless the queue ran within 5 minutes.
- **Evidence:** `QueueCLI.php:59,65`; PHP 8.4 `function_exists("get_magic_quotes_runtime")` → false; `modules/calendar/tasks/Reminders.php:47`; `lib/QueueProcessor.php:513-525`; `CandidatesUI.php:1748-1755`; `grep -rn cron docker/` → none.
- **Impact:** Calendar reminders silently never send.
- **Recommendation:** Replace with a supervised worker/scheduler; move reminders to calendar-provider notifications.

### FEAT-011 — Careers portal is single-tenant and its search is a stub
- **Severity:** MEDIUM
- **Finding:** `p=search` and `p=searchResults` render nothing although templates link to them; all careers/RSS/XML entry points use `Site::getFirstSiteID()`. Template overrides are selectable by any visitor via `?templateName=`.
- **Evidence:** `CareersUI.php:180-182`, `:856-858`, `:939`; `:79`; `RssUI.php` `displayPublicJobOrders()`; `XmlUI.php` `displayPublicJobOrders()`; `CareersUI.php:106-109`.
- **Impact:** Candidates cannot search jobs; multi-brand/multi-site hosting impossible.
- **Recommendation:** Rebuild the careers site (search, filters, SEO/structured data, responsive) against a public jobs API.

### FEAT-012 — Obsolete third-party integrations and telemetry
- **Severity:** MEDIUM
- **Finding:** (a) Resume parsing sends resume text + license key to `http://soap.resfly.com/parse.php` over HTTP; (b) daily "new version" check POSTs site name, UID, active-user count, PHP version, user agent and license key to `http://www.catsone.com/catsnewversion.php` from the dashboard; (c) Firefox XUL toolbar endpoints remain, including unauthenticated `a=getLicenseKey`.
- **Evidence:** `wsdl/parse.wsdl:78`, `wsdl/status.wsdl:69`, `lib/ParseUtility.php:85-95`; `lib/NewVersionCheck.php:100-123`, `:165-177`, `modules/home/HomeUI.php:95`; `modules/toolbar/ToolbarUI.php:46,83,282-285`.
- **Impact:** Data leakage to third parties without consent; dead features confuse users.
- **Recommendation:** RETIRE toolbar and phone-home; REPLACE parsing with a contracted, GDPR-compliant parser behind an interface.

### FEAT-013 — Bulk candidate e-mail and communication history
- **Severity:** MEDIUM
- **Finding:** Bulk e-mail is SA-only, synchronous, has no unsubscribe/opt-out, and the recipient query is not site-scoped. Every sent mail is written to `email_history` but nothing ever reads it; candidate pages show only manually logged activities.
- **Evidence:** `CandidatesUI.php:297-307`, `:3305-3417` (`WHERE candidate_id IN (%s)` `:3398-3403`); `lib/Mailer.php:363-400` (only writer); `grep -rn email_history modules lib` → only `Mailer.php`, `Schema.php`, `CBFUtility.php`.
- **Impact:** No compliant outreach; no auditable communication timeline per candidate.
- **Recommendation:** Communications service with templates, queues, consent/unsubscribe, bounce handling and per-candidate timeline.

### FEAT-014 — Test runner shipped in production
- **Severity:** MEDIUM
- **Finding:** `m=tests` is loaded like any module, requires only authentication, and its web tests create users with DELETE level on the live DB.
- **Evidence:** `modules/tests/TestsUI.php:65,79-92`; `modules/tests/testcases/WebTests.php:29-35`.
- **Impact:** Unintended data changes; noise in audit data.
- **Recommendation:** RETIRE from the runtime tree.

### FEAT-015 — eval-based hook "plugin" system
- **Severity:** MEDIUM
- **Finding:** 278 `if (!eval(Hooks::get('NAME'))) return;` sites evaluate PHP strings stored in `$_SESSION['hooks']`, populated from modules' `getHooks()`; only the settings module defines any (career-portal user mode).
- **Evidence:** `lib/Hooks.php` (`get()` returns concatenated code); `lib/ModuleUtility.php:276-296`; `SettingsUI.php:87-127`.
- **Impact:** Extensibility is unusable in practice and blocks static analysis.
- **Recommendation:** Replace with typed domain events/webhooks.

### FEAT-016 — Minimal localization
- **Severity:** MEDIUM
- **Finding:** Time zone is an integer GMT offset (fractional zones commented out, no DST), date format only MDY/DMY, all UI strings hard-coded English; no i18n library.
- **Evidence:** `constants.php:196` `// FIXME: Support fractional GMT offsets.`; `lib/DateUtility.php:318,380`; `SettingsUI.php:2558-2583`; `grep -rniE "gettext|i18n|locale|translat"` → only unrelated matches (e.g. `getTextExtractionError`).
- **Impact:** Unsuitable for international/multi-region customers.
- **Recommendation:** IANA time zones, ICU formatting, translation catalogs in the rebuild.

### FEAT-017 — Half-implemented features
- **Severity:** LOW
- **Finding / Evidence:** See §4 (25 items with file:line).
- **Impact:** Dead UI paths and confusing admin pages; wasted maintenance.
- **Recommendation:** Do not port; list as RETIRE in the migration backlog.

### FEAT-018 — Inconsistent default for status-change e-mail
- **Severity:** LOW
- **Finding:** E-Mail Settings per-status toggles are applied only when the status modal is opened from a job order; from a candidate page the seed `triggers_email` column is used.
- **Evidence:** `modules/joborders/JobOrdersUI.php:1454-1466` vs `modules/candidates/CandidatesUI.php:1688`.
- **Impact:** Candidates may or may not be e-mailed depending on which page the recruiter used.
- **Recommendation:** Single stage-action configuration in the workflow model (FEAT-001).

### FEAT-019 — First-run "Setup Users" wizard rejects all adds on default installs
- **Severity:** LOW
- **Finding:** `wizard_addUser()` refuses when `totalUsers >= userLicenses`; the default `site.user_licenses` is 0, which elsewhere means "unlimited".
- **Evidence:** `SettingsUI.php:3042-3046`; `lib/Users.php:905-909`; seed `db/cats_schema.sql:1017` (`user_licenses` = 0).
- **Impact:** Onboarding step fails; admins must use User Management.
- **Recommendation:** Irrelevant after rebuild; RETIRE seat licensing.

### FEAT-020 — Pipeline "Export selected" parameter format mismatch
- **Severity:** LOW
- **Finding:** The job-order pipeline export link passes `urlencode(serialize($params))` but `DataGrid::getFromRequest()` expects JSON.
- **Evidence:** `modules/joborders/Show.tpl:405`; `lib/DataGrid.php:293-304` (`json_decode($_REQUEST['p'], true)`).
- **Impact:** INFERENCE: parameters decode to `null`, so the export likely ignores the selection or fails (runtime not verified).
- **Recommendation:** Covered by datagrid/export REDESIGN.

---

## 6. Facts vs Assumptions

**Facts (verified in code):** every action list, access check, table name and line reference above; the pipeline codes and side effects in §3; that license checks always yield Professional with the shipped key (executed `lib/License.php` copy under PHP 8.4); that `get_magic_quotes_runtime` does not exist in PHP 8.4; the orphan-template list (grep-based, including dynamic `MassImportStep%d.tpl` handling); that `email_history` is never read; that careers search branches are empty.

**Assumptions / inferences (labelled):**
- Resfly (`soap.resfly.com`) and the catsone.com version endpoint may no longer be operational — not tested (no outbound calls made).
- Indeed/SimplyHired XML feed formats in `modules/xml/xml_templates/*.xtpl` are assumed outdated relative to current job-board ingestion requirements.
- FEAT-020 runtime outcome is inferred from code.
- "READ users can export all candidates" assumes the Export datagrid link is reachable by URL even though the grid shows the action only by module; the handler itself has no check (fact).

## 7. Unknowns / needs further investigation

1. Whether any production deployment runs `QueueCLI.php` under PHP 7.x cron (reminders actually delivered?).
2. Real-world use of hooks via external modules dropped into `modules/` (none in repo).
3. Whether `useCATSTemplate` is ever set in customer databases (would revive orphan careers templates).
4. Behaviour of `DataGrid::get()` with `null` parameters for pipeline export (FEAT-020).
5. Whether customers rely on `ACL_SETUP` roles (commented in the shipped `config.php`; customised configs unknown).
6. Data volume/usage of dormant features (dynamic lists, hot lists, bulk resumes, toolbar) — requires production DB statistics.
