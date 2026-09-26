# OpenCATS — UX/UI Assessment
Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **Inspected:** all 136 templates (`modules/*/*.tpl`, `Error.tpl`, `lib/datagrid/FilterArea.tpl`); the shared chrome `lib/TemplateUtility.php`; `lib/DataGrid.php`; `lib/MRU.php`; first-party JS (`js/*.js`, `js/submodal/subModal.js`, `modules/*/*.js`); `main.css`; the careers module (`modules/careers/*`, `careers/index.php`) and the database-stored careers templates (`db/cats_schema.sql:408-447`).
- **Re-verification:** more than 100 Phase 0 `file:line` citations were re-checked with `sed -n`/`grep -n`. Application code is byte-identical to Phase 0, so almost all held. Count-based claims were re-run with a small script (`scratchpad/audit-work/ux/counts.py`); changed counts are noted in the findings.
- **Read-only checks:** `php -r` (PHP 8.4 CLI) to confirm the double-encoding behaviour of `getSanitisedInput()` (UX-003).
- **Runtime evidence used:** `docs/baseline/KNOWN_RUNTIME_ERRORS.md` (RT-04, RT-05, RT-06, RT-07, RT-10–RT-16), `SMOKE_TEST.md` steps #NN, `CURRENT_UI_MAP.md`, `evidence/final-run/results.json`, `console-summary.log`, `php_errors.log`, and screenshots #31, #32, #36, #78, #83, #90, `S3`, `S4`.
- **Confirmation rule for grouped findings:** a finding is marked **Runtime** when its core claim was observed in the baseline; sub-items that were only read in code are labelled "(static)" inside the finding.
- **Not done:** no browser, screen-reader or keyboard session was run for this edition. No automated accessibility scan result exists in committed evidence: the preview tooling can run axe-core (`docs/baseline/preview/verify-preview.js`, check 10), but no axe output is committed, so no axe numbers are quoted here. No redesign or design-system proposals are made; recommendations stay at finding level.

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| UX-001 | No responsive layout in the app or the careers portal | MEDIUM | Runtime |
| UX-002 | DataGrid bulk actions ("Selected" / "All") ignore the user's selection | HIGH | Runtime |
| UX-003 | Encode-on-input double-escapes names and text, worse on every edit | HIGH | Static |
| UX-004 | EEO self-identification options are wrong in careers and recruiter forms | HIGH | Static |
| UX-005 | Core interactions not operable by keyboard or screen reader; no ARIA | HIGH | Static |
| UX-006 | Output-encoding gaps in the shared chrome (quick search, MRU, `<title>`) | HIGH | Static |
| UX-007 | Careers "registered candidate" login is e-mail + last name + ZIP, stored in a cookie | HIGH | Static |
| UX-008 | Shared chrome and every list view fatal on PHP ≥ 8.0 (`implode` argument order) | HIGH | Static |
| UX-009 | Colour-contrast failures and colour-only status meaning | MEDIUM | Static |
| UX-010 | Form-semantics defects: wrong `label for`, duplicate ids, duplicate `tabindex` | MEDIUM | Static |
| UX-011 | Careers questionnaire pre-selects the first radio answer | MEDIUM | Static |
| UX-012 | Careers portal functional gaps: empty search page, broken RSS link, blank disabled state | MEDIUM | Runtime |
| UX-013 | Error handling: PHP warnings and fatals in pages, lost input, `alert()`, GET deletes | MEDIUM | Runtime |
| UX-014 | Full-page-reload interaction model for lists and popups | LOW | Static |
| UX-015 | No i18n; US-only date, address and phone model | MEDIUM | Runtime |
| UX-016 | Legacy JS stack: jQuery 1.3.2, globals, inline handlers, `eval`, `document.write` | MEDIUM | Static |
| UX-017 | Resume "parse" controls always shown but backed by a disabled third-party service | MEDIUM | Partial |
| UX-018 | Rich-text editor never starts (CKEditor 4.25.1 licence check) | MEDIUM | Runtime |
| UX-019 | Inconsistent visual implementation and heavy template duplication | MEDIUM | Static |
| UX-020 | Dead or broken UI remnants | LOW | Static |
| UX-021 | Journey friction in core recruiter flows | LOW | Static |
| UX-022 | Login and footer hygiene | LOW | Runtime |
| UX-023 | Careers applicant is shown a raw PHP fatal error after a saved application | HIGH | Runtime |
| UX-024 | Careers resume silently discarded unless the applicant clicks "Upload" | HIGH | Runtime |
| UX-025 | Dashboard widgets mislabel their data and draw misleading empty states | LOW | Runtime |
| UX-026 | E-mail compose template and preview controls depend on an editor instance that never exists | MEDIUM | Partial |

26 findings — 0 CRITICAL / 9 HIGH / 12 MEDIUM / 5 LOW · Runtime 10 / Static 14 / Partial 2 / Unverified 0 (no withdrawn or merged stubs).

## 1. Information architecture and navigation

### 1.1 Shared chrome (every recruiter page)

Every full page calls the same static printers in order: `printHeader` → `printHeaderBlock` → `printTabs` → `printQuickSearch` → content → `printFooter` (e.g. `modules/candidates/Add.tpl:5-10`).

| Printer | What it emits | Evidence |
|---|---|---|
| `_printCommonHeader` | XHTML 1.0 Transitional doctype, `<html lang="en">`, 5 scripts on every page (`lib.js`, `quickAction.js`, `calendarDateInput.js`, `submodal/subModal.js`, `jquery-1.3.2.min.js`), CSS via `@import`, IE conditional comments | `lib/TemplateUtility.php:1178-1216` |
| `printHeaderBlock` | Logo in a layout `<table>`; user/site/access-level line; Logout | `lib/TemplateUtility.php:96-205` (table `:106`) |
| `printTabs` | 10 tabs + blue sub-tab bar; visibility rules encoded in strings (`*al=`, `*hrmode=`, `*js=`) | `lib/TemplateUtility.php:570-800` |
| `printQuickSearch` | "Recent:" MRU bar (last 5 records) and Quick Search box | `lib/TemplateUtility.php:255-301` |
| `printFooter` | Version, licence-required "Powered by OpenCATS", "Server Response Time" | `lib/TemplateUtility.php:802-852` |

Runtime view: `CURRENT_UI_MAP.md` §1 and every recruiter screenshot (e.g. #32, #90) show exactly this chrome.

### 1.2 Tabs and primary screens

| # | Tab | Sub-tabs | Main screens (runtime shot) |
|---|---|---|---|
| 1 | Dashboard | none | widgets (#06, #90) |
| 2 | Activities | none | period-filtered grid (#07, #91) |
| 3 | Job Orders | Add Job Order (popup), Search | list #17, add popup #18, detail #20, search #46 |
| 4 | Candidates | Add Candidate, Search | list #21/#25, add #22/#23, detail #26/#32, search #39–#45 |
| 5 | Companies ("My Company" in HR mode) | Add, Search, Go To My Company | list #09, detail #11, edit #12 |
| 6 | Contacts | Add, Search, Cold Call List | list #13, detail #15, cold call #16 |
| 7 | Lists | Show Lists | #08 |
| 8 | Calendar | My Upcoming Events, Add Event, Goto Today | #35–#37 |
| 9 | Reports | EEO Reports (only if EEO enabled) | #49–#53 |
| 10 | Settings | Administration, My Profile | #56–#76 |

Tab source: `constants.php:30-41` and each module's `_subTabs`. The active sub-tab is shown only by `style="color:#cccccc;"` (`lib/TemplateUtility.php:685`).

Screens per module (from `handleRequest()` switch cases; runtime shots where opened):

| Module | List | Detail | Add / Edit | Search | Other screens and popups |
|---|---|---|---|---|---|
| candidates | `Candidates.tpl` DataGrid | `Show.tpl` | `Add.tpl`, `Edit.tpl` | name, resume keywords, key skills, city, phone | popups: status change, add to job order, attachment, image, tags, link duplicate; pages: merge, send e-mail, questionnaire, resume text window |
| joborders | `JobOrders.tpl` DataGrid (50 rows) | `Show.tpl` with AJAX pipeline | chooser popup → `Add.tpl`; `Edit.tpl` | title, company | popups: consider candidate search, add new candidate into pipeline, attachment |
| companies | `Companies.tpl` | `Show.tpl` (job orders + contacts grids) | `Add.tpl`, `Edit.tpl` | name, key technologies | "My Company" / internal postings |
| contacts | `Contacts.tpl` | `Show.tpl` | `Add.tpl`, `Edit.tpl` | name, company, title | activity/event popup, cold-call list, vCard |
| activity | period-filtered grid | — | inline AJAX edit/delete | — | — |
| lists | `Lists.tpl` | `List.tpl` | lists created inside the "Add To List" popup | — | — |
| calendar | month/week/day in JS | inline | inline forms | — | upcoming events |
| reports | `Reports.tpl` (9 fixed periods) | submission / placement reports (new tab) | — | — | EEO report, job-order report → PDF |
| settings | Administration hub | user detail | add/edit user | — | careers settings, template and questionnaire editors, e-mail settings/templates, EEO, tags, extra fields, backup, localization, login activity |

### 1.3 Popups and secondary windows (reference)

| Mechanism | Count / where | Evidence |
|---|---|---|
| iframe popups (`showPopWin(url, w, h)`), each a full server-rendered page with `printModalHeader` | 27 call sites: add-job-order chooser (#18), add to pipeline (#30), status change (#31), attachments (#27), tags, add to list, link duplicate | `lib/TemplateUtility.php:543-560`, `js/submodal/subModal.js:132-177`; fixed sizes e.g. `600, 480` (`candidates/Show.tpl:529`), `820, 550` (`joborders/Show.tpl:419`) |
| New browser windows (`window.open`) | resume text viewer (#34), job order from search popups | `CandidatesUI.php:792` |
| Absolutely positioned `div` menus | quick-action menus, DataGrid column chooser, `suggest.js` autocomplete | `js/quickAction.js`, `lib/DataGrid.php:1616-1660`, `js/suggest.js` |
| Native dialogs | 137 `alert(` (132 JS, 5 templates), 26 `confirm(` | recount, `counts.py` |

Closing a popup usually reloads the parent: `parentGoToURL` (10 templates) or `parentHidePopWinRefresh` (7), which sets `window.location.href = sURL + ' '` (`subModal.js:252-258`). Keyboard and focus problems are in UX-005; the reload cost is in UX-014.

### 1.4 MRU, quick search, lists and hot records

- **MRU.** Last 5 viewed records (`MRU_MAX_ITEMS`, `config.php:121`), table `mru`, rendered as "Recent:" on every page (`lib/MRU.php:115-162`). Runtime: the bar reflects the run order (#32, #90). Two records with the same name appear as identical entries ("Alex Baseline-Test | Alex Baseline-Test", #78) because the MRU shows only the name.
- **Quick Search.** `m=home&a=quickSearch` searches candidates, companies, contacts and job orders at once; four unpaginated result tables (`lib/Search.php:1329-1600`, `modules/home/SearchEverything.tpl:19-182`). Runtime: finds all four test records (#38).
- **Saved lists.** Static lists only; filled from DataGrid selection or the record quick-action menu (`ListsUI.php:54-59`). Dynamic lists are commented out.
- **Hot.** `is_hot` is shown only as red link colour (`main.css:857-868`); "Only Hot" filters exist on list pages.

### UX-006 — Output-encoding gaps in the shared chrome (cross-ref SEC)
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: UX-003, SEC area*

- **Confirmed fact:** Several shared printers echo user- or request-controlled strings without escaping. They appear on about 80 templates.
- **Evidence:**
  - `lib/TemplateUtility.php:295-296` — quick-search box value `$wildCardString` echoed raw; fed from `$_GET['quickSearchFor']` (`modules/home/HomeUI.php:201-202,373`).
  - `lib/MRU.php:150-156` — MRU entries built from `data_item_text` (record names) without escaping; the code comment at `:150` notes the URL is "already htmlspecialchars()d... bad design".
  - `lib/TemplateUtility.php:1182` — `<title>OpenCATS - $pageTitle</title>` built from raw names (e.g. `candidates/Show.tpl:7-9`).
  - `lib/TemplateUtility.php:318-340` — advanced-search state echoed into HTML and JS.
  - `modules/candidates/Candidates.tpl:71` — tag titles echoed raw; `AddActivityChangeStatusModal.tpl:271` — activity note echoed with `echo` (the note is HTML-escaped on input at `CandidatesUI.php:2961`, so this one is currently safe by accident).
  - Recruiter-added candidates store raw names (`CandidatesUI.php:2620-2626`, `getTrimmedInput`).
- **Impact:** Script injection through record names or a crafted quick-search link would run in every recruiter page header. Exploitability is for the SEC area to assess.
- **Severity:** HIGH — script execution in authenticated sessions with a low precondition.
- **Recommendation:** Escape at the point of output in these printers (HTML context for MRU text and title, JS-string context for advanced-search values). This must be done together with UX-003 so stored text is escaped exactly once.
- **Unknown / needs further validation:** Real exploitability and reach; needs authorized security testing on an isolated instance.

### UX-020 — Dead or broken UI remnants
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: RT-13, UX-022*

- **Confirmed fact:** Several UI pieces are unreachable, point to missing files, or contain one-line bugs.
- **Evidence:**
  - 13 templates with no reference: `toolbar/install.tpl`, `candidates/HotList.tpl` (calls non-existent `TemplateUtility::printNonSelectableHeader`), `candidates/Duplicates.tpl`, `careers/{BlankNoMargin,Blank2,Openings,SearchOpenings}.tpl` (`Openings.tpl`, `SearchOpenings.tpl` are 0 bytes), `import/MassImportStep{1..4}.tpl`, `import/ImportCommits.tpl`, `reports/NewDataItems.tpl`.
  - `modules/toolbar/install.tpl:62` installs `catstoolbar.xpi`, which is not in the repo; `settings/getFirefoxModal.tpl` promotes "Firefox 2".
  - `settings/CareerPortalTemplateEdit.tpl:76` — "Insert Site Name" calls `insertAtCursor(insertAtCursor(...` with an unbalanced parenthesis, so the button does nothing; `:70` tests `'Body - Search Results'`, a key that does not exist.
  - `AddActivityChangeStatusModal.tpl:217` — reminder checkbox sets `display=''` in both branches, so the area never hides.
  - `js/suggest.js:473` — `evt.keyCode == 48` (the "0" key) is treated like Enter.
  - `candidates/Add.tpl:513-518` — after a parse reload, the phone pre-check calls `checkEmailAlreadyInSystem`.
  - `LoginUI.php:57-65` has `a=forgotPassword`, but `login/Login.tpl` has no link to it. The page itself loads with two missing images (runtime, RT-13, #03).
  - 37 `catsone.com` links remain in UI code; `lib/JavaScriptCompressor.php` has no callers.
- **Impact:** Confusing or non-working controls; typing "0" in a company name can select an autocomplete entry; the forgot-password page is undiscoverable (and broken, see WORKFLOW_ANALYSIS W12).
- **Severity:** LOW — cosmetic or minor, each item isolated.
- **Recommendation:** Remove the dead templates and assets and fix the four one-line JS defects so the visible controls do what their labels say.
- **Unknown / needs further validation:** Whether any deployment selects the `Blank*` careers shells via the DB setting `useCATSTemplate` (`CareersUI.php:962-967`); needs a check of production `settings` rows.

### UX-021 — Journey friction in core recruiter flows
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: WORKFLOW_ANALYSIS W2, W4, W9; FEAT-018*

- **Confirmed fact:** Several core flows add steps or risk that the code could avoid.
- **Evidence:**
  - A job order needs an existing company: client check "You must select a company." (`modules/joborders/validator.js:166`), server `fatal('Invalid company ID.')` (`JobOrdersUI.php:686-688`). No inline "create company".
  - Add Job Order is a popup chooser (Empty / Copy Existing) and then a full page (`AddModalPopup.tpl:20-35`; runtime #18, #19).
  - "Copy Existing" loads **all** job orders into one `<select>` (`JobOrdersUI.php:538` `getAll(JOBORDERS_STATUS_ALL)`).
  - Reset buttons sit next to the primary submit (`candidates/Add.tpl:496-497`, `joborders/Add.tpl:306`; also visible on the compose page, #78).
  - Status-change e-mail checkbox is set to checked when the target status has `triggers_email=1` (300, 400, 500, 600, 800) (`js/activity.js:697-701`). Runtime #31 confirms the unchecked case for "Contacted" only.
  - No bulk status change on the job-order pipeline (`ajax/getPipelineJobOrder.php` offers select-and-export only).
  - Reports use fixed periods and open in new tabs; no export (`Reports.tpl`; EEO offers 3 periods, `EEOReport.tpl:33-35`).
- **Impact:** Extra page loads and context switches; risk of wiping a long form by mis-click; risk of an unintended candidate e-mail on common statuses.
- **Severity:** LOW — friction, no data loss on its own.
- **Recommendation:** Offer company creation from the job-order form, make the copy source searchable, and leave the notification checkbox unchecked unless the user opts in, because the current default can e-mail candidates without a deliberate choice.
- **Unknown / needs further validation:** Real click counts and error rates need observation of recruiters on production-size data.

### UX-025 — Dashboard widgets mislabel their data and draw misleading empty states
*Confirmation: **Runtime** · New in this edition · Related: RT-14*

- **Confirmed fact:** "My Recent Calls" lists activities of any type, and the empty "Hiring Overview" graph draws coloured bars behind "NO DATA".
- **Evidence:**
  - Runtime #90: "My Recent Calls" shows four entries for Alex Baseline-Test; the candidate's activity log (#32) shows that only one of them is a Call — the others are "Other" entries ("Added a new candidate.", "Added candidate to job order.").
  - Code: the widget query takes the last 6 activities of any type (`modules/home/dataGrids.php:281-395`, `LIMIT 6` at `:393`); the label is fixed text (`modules/home/Home.tpl:13`).
  - Runtime #06/#90: "Hiring Overview" shows placeholder bars with a "NO DATA" overlay; "Recent Hires" repeats a "NO DATA" watermark clipped at the panel edge ("NO D") (RT-14).
- **Impact:** Recruiters read system events as calls they made; an empty chart looks like data at a glance.
- **Severity:** LOW — misleading display, no data change.
- **Recommendation:** Either filter the widget to call-type activities or rename it to match the query, and render empty charts without sample bars so an empty state cannot be mistaken for data.
- **Unknown / needs further validation:** None.

## 2. List and grid interactions

DataGrid (`lib/DataGrid.php`, 2,649 lines) powers every list: server-side sort/page/filter, rows-per-page 15/30/50/100 (`:740`), column chooser with drag-reorder and resize persisted per user, row checkboxes and an action area ("Add To List", "Add To Job Order", "Send E-Mail", "Export", "Remove From This List"). State travels in the URL (`parameters<instance>`, JSON) or the session. Runtime: lists render and sort (#09, #13, #17, #21, #25).

DataGrid action matrix (which grids offer which bulk actions, and how each encodes its parameters):

| Action | Grids | Mechanism | `p` encoding | Selected IDs encoding | Result today |
|---|---|---|---|---|---|
| Add To List | candidates, companies, contacts, job orders | popup | JSON | PHP-serialized | selection dropped → all grid rows (static) |
| Add To Job Order | candidates (+ saved-list view) | popup | JSON | PHP-serialized | selection dropped → all grid rows (static) |
| Send E-Mail | candidates (≥ 400 and mail on) | page | PHP-serialized | PHP-serialized | first 15 rows (runtime #78) |
| Export (Selected / All) | all list grids; job-order pipeline | page | PHP-serialized | PHP-serialized | first 15 rows (static) |
| Remove From This List | saved-list views | page | PHP-serialized | PHP-serialized | first 15 list entries removed (static) |

Source: `modules/{candidates,companies,contacts,joborders}/dataGrids.php` action areas; `lib/DataGrid.php:1965-2082`; `modules/joborders/Show.tpl:405`.

### UX-002 — DataGrid bulk actions ("Selected" / "All") ignore the user's selection
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-11, FEAT-020, WORKFLOW_ANALYSIS W7/W8/W10*

- **Confirmed fact:** The action links send parameters in PHP `serialize()` format, but the server decodes them with `json_decode()`, which returns `NULL`. The selection is then dropped and the action runs on a default row set. Observed at runtime for "Send E-Mail → Selected".
- **Evidence:**
  - Runtime #78 (`results.json`): the request URL carries `p=a:7:{…"exportIDs";s:9:"<dynamic>"…}` (PHP-serialized) and `dynamicArgument…=a:1:{i:0;s:1:"2";}` — one selected candidate (ID 2). The page shows `Warning: Invalid argument supplied for foreach() in lib/DataGrid.php on line 248` (RT-11) and the "To" box lists **two** recipients: the selected candidate and the unselected duplicate (ID 3), i.e. every row then in the grid (screenshot #78).
  - `lib/DataGrid.php:1988,1993` — non-popup items ("Send E-Mail", "Export", "Remove From This List") build `p` with `urlencode(serialize(...))` for both "Selected" and "All".
  - `lib/DataGrid.php:2042-2068` — popup items ("Add To List", "Add To Job Order") use `json_encode` for `p`, but the selected IDs still come from JS `serializeArray()` (`js/lib.js:231`), PHP-serialized text.
  - `lib/DataGrid.php:301` `json_decode($_REQUEST['p'], true)` → `NULL`; `:248` `foreach` over `NULL` (the RT-11 warning); `:257` `if ($index = 'exportIDs')` is an assignment (always true); `:259` `json_decode(urldecode(...))` of serialized IDs → `NULL`; `:486-488` a non-array `exportIDs` is silently unset; `:453-464` `maxResults` then defaults to 15.
  - `modules/joborders/Show.tpl:405` — pipeline "Export" uses the same `serialize()` pattern.
  - Consumers: `CandidatesUI.php:3381` (e-mail), `:1449` (add to job order), `ListsUI.php:261,304` (add to / remove from list), `ExportUI.php` (export).
- **Impact (per action; only "Send E-Mail → Selected" was exercised):**
  - Send E-Mail → Selected: compose form is addressed to the first 15 rows of the default sort, not the selection (observed with 2 rows).
  - Export → Selected **and** Export → All (static): CSV contains the first 15 rows of the default sort.
  - Remove From This List → Selected (static): removes up to 15 list entries that the user did not select.
  - Add To List / Add To Job Order → Selected (static): `maxResults` is 100,000,000 with no ID filter, so every row matching the grid is added.
- **Severity:** HIGH — a core bulk workflow acts on the wrong records; it can e-mail unselected candidates, pollute pipelines and lists, and silently remove list entries.
- **Recommendation:** Use one encoding (JSON) for both the grid parameters and the selected IDs and fix the assignment at `:257`, so the server receives exactly the rows the user ticked; reject the request if the selection cannot be decoded instead of falling back to defaults.
- **Unknown / needs further validation:** Export, list and pipeline paths were not exercised; confirm on an isolated instance with more than 15 rows and a non-default sort.

## 3. Forms, validation and data entry

Forms are long single pages with fixed-width inputs (158 × `width: 150px`), client validation by `alert()` (`candidates/validator.js:20`), server validation by fatal error page (UX-013), and a `MM-DD-YY` date widget (`js/calendarDateInput.js`). Runtime: company, contact, candidate and job-order forms submit successfully (#10, #14, #19, #23, #33).

| Entry form | Named controls (`name="` count, incl. hidden) | Client validation | Server validation failure | Runtime |
|---|---|---|---|---|
| Candidate add (`candidates/Add.tpl`) | 41 | `alert()` via `checkAddForm` (`candidates/validator.js`) | fatal page, input lost | #22–#24 |
| Job order add (`joborders/Add.tpl`) | 31 | `alert()` ("You must select a company.") | fatal page ("Invalid company ID.") | #19 |
| Company add (`companies/Add.tpl`) | 17 | `alert()` | returns to the company list with "Required fields are missing."; input lost (`CompaniesUI.php:553-557`) | #10 |
| Contact add (`contacts/Add.tpl`) | 21 | `alert()` | fatal page | #14 |
| Status / activity popup (`AddActivityChangeStatusModal.tpl`) | 31 | `checkActivityForm` | fatal inside the popup (e.g. "This job order has been filled…") | #31 |
| Careers apply (DB template) | 20 (runtime field list) | sequential `alert()` for first name, last name, e-mail only | — | #84, `S3` |

### UX-003 — Encode-on-input double-escapes names and text, worse on every edit
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: UX-006, SEC area, DATABASE area*

- **Confirmed fact:** Many add and edit handlers store HTML-escaped text, and templates escape it again on output. Each edit escapes the stored value once more.
- **Evidence:**
  - `lib/UserInterface.php:388-395` — `getSanitisedInput()` returns `trim(htmlspecialchars($v, ENT_QUOTES, FALSE))`. The third argument is the *encoding* parameter, so double-encoding stays on.
  - `php -r` check: `O'Brien & Co` → `O&#039;Brien &amp; Co`; feeding that back in → `O&amp;#039;Brien &amp;amp; Co`.
  - 161 call sites in 7 controllers (Phase 0: 162). They include company add/edit `name` (`CompaniesUI.php:541,812`), contact add/edit names (`ContactsUI.php:521-523,809-811`), job order add/edit `title` (`JobOrdersUI.php:760,1103`), candidate **edit** (`CandidatesUI.php:1313-1327`), calendar event title (`CalendarUI.php:396,586`), user add/edit (`SettingsUI.php:1138-1139,1342-1343`) and careers apply.
  - Candidate **add** uses raw `getTrimmedInput()` (`CandidatesUI.php:2620-2626`); `candidates/Edit.tpl:40` and `Show.tpl:67` escape on output with `$this->_()`.
- **Impact:** A company named "Smith & Sons" is shown as "Smith &amp; Sons" from its first save. A candidate "O'Brien" added by a recruiter shows correctly until the first edit, then shows `O&#039;Brien`, and gets longer with each save. Search, duplicate detection and exports on such names stop matching.
- **Severity:** HIGH — progressive corruption of core names and titles. It is visible on screen, which is why it is not rated CRITICAL.
- **Recommendation:** Store user text unescaped and escape once on output, then repair affected rows; otherwise every edit keeps corrupting the stored value.
- **Unknown / needs further validation:** Not observed at runtime: the baseline test data had no `'`, `&`, `<` or `>` characters, and a grep of `docs/baseline/` for `&amp;amp;` finds nothing. How many production rows are affected needs a query on real data.

### UX-004 — EEO self-identification options are wrong in careers and recruiter forms
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-003 (careers profile update misalignment)*

- **Confirmed fact:** The careers veteran list offers "Male" as value 1 (= "No Veteran Status"), and the recruiter form's "Disabled Veteran" option has no `value` attribute.
- **Evidence:**
  - `modules/careers/CareersUI.php:636-642` — `<option value="1">Male</option>` inside `<input-eeo-veteran>`; `db/cats_schema.sql` `eeo_veteran_type` row 1 is "No Veteran Status".
  - `modules/candidates/Add.tpl:365` — `<option valie="3">Disabled Veteran</option>`; the browser submits the text, which `makeQueryInteger` casts to 0 (`lib/DatabaseConnection.php:546-549`).
  - `CareersUI.php:621,630,636,644` — `<select … />` self-closed in the generated EEO HTML.
- **Impact:** Applicants see a nonsensical option on a legally sensitive question; disabled veterans entered by recruiters are stored as "none"; EEO reports (#52) are wrong.
- **Severity:** HIGH — integrity of compliance data.
- **Recommendation:** Generate the option lists from the `eeo_*_type` tables so labels and stored values cannot drift.
- **Unknown / needs further validation:** EEO fields were not filled in the baseline; the number of affected rows needs a query for `eeo_veteran_type_id = 0` on candidates added by recruiters.

### UX-010 — Form-semantics defects: wrong `label for`, duplicate ids, duplicate `tabindex`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: UX-005*

- **Confirmed fact:** Many labels point to the wrong control or to no control, and tab order is erratic.
- **Evidence:**
  - `candidates/Add.tpl:327,341,358,374,407` — Gender, Ethnic Background, Veteran, Disability and Can Relocate all use `id="canRelocateLabel" for="canRelocate"`; `:263` "Best Time to Call" uses `for="state"`; `:437,446` Current/Desired Pay use `for="currentEmployer"`.
  - `candidates/Add.tpl:145,154` both `tabindex="2"`; `:255,266` both `tabindex="13"`; 76 literal positive `tabindex` values in templates plus PHP-generated ones.
  - `candidates/Add.tpl:46` — `enctype` attribute appears twice on the form.
  - `login/Login.tpl:30,112` — two elements with `id="login"`.
  - Careers default template labels (`db/cats_schema.sql:439`): `for="homePhone"`, `mobilePhone`, `workPhone`, `bestTime`, `mailingAddress`, `cityProvince`, `stateCountry`, `zipPostal`, while the generated inputs are `phoneHome`, `phoneCell`, `phone`, `bestTimeToCall`, `city`, `state`, `zip` (runtime field list, #84) and the address `<textarea>` has no id.
  - Quick-search label is a `<span>` (`TemplateUtility.php:292`).
- **Impact:** Screen readers announce wrong names; clicking a label focuses the wrong field; keyboard order jumps.
- **Severity:** MEDIUM — accessibility and usability defect across the main entry forms.
- **Recommendation:** Pair every label with its own control id and remove positive `tabindex` values so assistive technology and keyboard order follow the visual form.
- **Unknown / needs further validation:** Real screen-reader behaviour needs a manual test.

### UX-017 — Resume "parse" controls always shown but backed by a disabled third-party service
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: DEPENDENCY area*

- **Confirmed fact (runtime):** The recruiter add form and the careers apply form show the parse controls ("transfer" arrow; "Populate Fields ->"), enabled once text is present (#22; `S3`).
- **Confirmed fact (static):** `LicenseUtility::isParsingEnabled()` returns `true` on every path (`lib/License.php:687-706`), while `PARSING_ENABLED` is `false` (`config.php:51`). Parsing calls a SOAP service at `http://soap.resfly.com/parse.php` (`wsdl/parse.wsdl:78`, `lib/ParseUtility.php:55-90`).
- **Evidence:** `candidates/Add.tpl:53-119,191-197`; `CareersUI.php:612`; runtime #22 (Upload pre-fills 186 characters of text); screenshot `S3` shows "Populate Fields ->" on the careers form.
- **Inferred (not exercised):** pressing the parse control does nothing useful (SOAP fault → no fields filled), or sends resume text to a third party over plain HTTP if the endpoint answers.
- **Impact:** A visible primary control likely does nothing, or leaks resume text off-site.
- **Severity:** MEDIUM — misleading control with a possible privacy side effect.
- **Recommendation:** Show the parse controls only when parsing is actually configured, so users are not offered a control that fails silently or sends data to an unknown service.
- **Unknown / needs further validation:** Whether `soap.resfly.com` still answers and what happens when `ext-soap` is missing; needs a network-isolated test.

## 4. Popups and modals

The mechanisms are listed in §1.3. What works at runtime: the add-to-pipeline popup (#30), the status-change popup with its confirmation text (#31: "The candidate's status has been changed from No Contact to Contacted. An activity entry of type Call has been added… No event has been scheduled. No e-mail notification has been sent"), the attachment popups (#27, #28) and the add-job-order chooser (#18). No popup produced a JS error in the final run (`console-summary.log`). Keyboard and screen-reader defects of the popups are in UX-005; the reload-on-close model is in UX-014. No separate popup finding is raised.

## 5. Feedback, empty and error states

Error and warning states observed in the baseline:

| Screen | What the user sees | Evidence |
|---|---|---|
| Company detail (every view) | three `count()` warnings above the header | #10, #11 (RT-06) |
| E-mail compose | `foreach()` warning above the header; panel wider than the page | #78 (RT-11, RT-14) |
| Send Test E-Mail | "An error occurred. Fatal error: Uncaught PHPMailer…" with stack trace in the result box | #77 (RT-04) |
| Send E-Mail | full-page fatal with stack trace | #79 (RT-04) |
| Forgot password | two broken images; submit → full-page fatal | #03, #04 (RT-03, RT-13) |
| Careers application submit | full-page fatal shown to the applicant | #85, #86 (RT-04, UX-023) |
| Careers RSS button | full-page fatal | #88 (RT-05) |
| Job-order PDF report | HTML warning and "FPDF error" instead of a PDF | #54 (RT-09) |
| EEO report | JS errors in the console only; page renders | #52 (RT-10) |
| Calendar Add Event without type | `alert("You must select an Event Type")` | #36 |
| Dashboard, empty data | "NO DATA" watermark clipped; placeholder chart bars | #06, #90 (UX-025) |

All PHP fatals were served with HTTP 200 (RT-15).

### UX-013 — Error handling: PHP warnings and fatals in pages, lost input, `alert()`, GET deletes
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-03, RT-04, RT-06, RT-11, RT-15, UX-023*

- **Confirmed fact:** Users see raw PHP warnings and fatal errors inside normal pages; server-side validation failures replace the form with a generic error page; client validation uses `alert()`; record deletes are GET links behind `confirm()`.
- **Evidence:**
  - Runtime: company detail prints three `count()` warnings on every view (#10, #11, RT-06); the compose page prints a `foreach()` warning (#78, RT-11); Send Test E-Mail shows "An error occurred. Fatal error: Uncaught PHPMailer…" with a stack trace in the result box (#77, RT-04); Send E-Mail (#79) and forgot password (#04, RT-03) replace the page with a fatal error. All fatals were served with HTTP 200 and absolute server paths (RT-15).
  - Static: missing or invalid input calls `CommonErrors::fatal(...)`, which renders "A fatal error has occurred." and discards the typed data (`candidates/Error.tpl:17-21`; e.g. `JobOrdersUI.php:686-729`).
  - Static: `alert(` appears 132 times in JS; runtime #36 notes the calendar's "You must select an Event Type" alert.
  - Static: deletes are GET links with `confirm()` (`candidates/Show.tpl:432`, `companies/Show.tpl:227`, `contacts/Show.tpl:209`, `joborders/Show.tpl:330`); e-mail template delete has no confirmation (`settings/EmailTemplates.tpl:135`).
- **Impact:** Users lose typed work, cannot tell whether an action succeeded, and are shown internal paths and call arguments. Deletes are easy to trigger by accident.
- **Severity:** MEDIUM — degraded feedback on many screens; the candidate-facing case is rated separately (UX-023).
- **Recommendation:** Show validation errors next to the fields on the re-rendered form and keep the user's input; stop rendering PHP diagnostics into pages, because they hide the real result and disclose server details.
- **Unknown / needs further validation:** Behaviour with `display_errors=Off` (the baseline used the image default On); needs a run with production PHP settings.

### UX-022 — Login and footer hygiene
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: UX-020, SEC area*

- **Confirmed fact:** The login page carries demo-login helpers with credentials in its page script, has no `lang`, duplicates an id and renders errors below the form; every page footer shows version and server timing.
- **Evidence:**
  - Runtime: `CURRENT_UI_MAP.md` (Login row) records that the login page JS defines `defaultLogin()` (admin/cats) and `demoLogin()` (john@mycompany.net/john99); code `login/Login.tpl:94-103`.
  - Runtime: footer "OpenCATS Version 0.9.7.4 … Server Response Time: 0.02 seconds." on every recruiter page (#32, #78, #90); code `TemplateUtility.php:830-832`.
  - Static: `login/Login.tpl:4` `<html>` without `lang`; `:30,112` duplicate `id="login"`; error message rendered after the form (`:111-121`).
  - Static: the report footer says "Powered by CATS" and links catsone.com (`TemplateUtility.php:875`), while the app footer says OpenCATS (`:831`).
- **Impact:** Error messages are easy to miss; page source advertises default credentials; branding is inconsistent.
- **Severity:** LOW — hygiene.
- **Recommendation:** Remove the demo-login helpers and show login errors above the form. The "Powered by OpenCATS" line must stay; the licence requires it (`TemplateUtility.php:816-829`, `careers/Blank.tpl:38-41`).
- **Unknown / needs further validation:** None.

## 6. Rich text

CKEditor 4 (`ckeditor/ckeditor` locked at 4.25.1, `composer.lock:10-19`) is wired to the job-order **description** (`joborders/Add.tpl:272,311`, `Edit.tpl:298,337`) and the candidate e-mail body (`candidates/SendEmail.tpl:137`, `js/emailHandler.js:158-199`). Job-order **notes** carry `class="ckEditor"` but are never initialised (`joborders/Add.tpl:281`). E-mail templates are plain textareas with `%TOKEN%` insert buttons (`settings/EmailTemplates.tpl:142-175`). The careers page injects the description HTML verbatim (`CareersUI.php:831`).

### UX-018 — Rich-text editor never starts (CKEditor 4.25.1 licence check)
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-07, UX-026, DEPENDENCY area*

- **Confirmed fact:** The locked CKEditor build refuses to create an editor without a licence key; the description and e-mail fields stay plain textareas.
- **Evidence:** RT-07; `results.json` steps #19 and #78 record the console error "[CKEDITOR]: The license key is missing or invalid… This version of the editor is under commercial terms…" and an aborted `contents.css` request; screenshot `S1` shows a plain textarea. Wiring: `js/ckeditor-manager.js:2-21` (`CKEDITOR.replace`).
- **Impact:** No formatting in job descriptions or e-mails; every editor page logs a console error; content still saves as plain text (#19 saved the job order).
- **Severity:** MEDIUM — feature silently degraded on two core forms.
- **Recommendation:** Pin an editor build that runs without a commercial key, or remove the editor wiring, so that pages stop depending on a component that refuses to start.
- **Unknown / needs further validation:** The e-mail template and career-portal template editors were not checked individually at runtime (RT-07 infers the same behaviour).

### UX-026 — E-mail compose template and preview controls depend on an editor instance that never exists
*Confirmation: **Partial** · New in this edition · Related: RT-07, UX-018, WORKFLOW_ANALYSIS W7*

- **Confirmed fact (runtime):** On the compose page no CKEditor instance is created (#78, RT-07); the Template and "Preview for" selects are present (#78 screenshot).
- **Confirmed fact (static):** Choosing a template or a preview candidate runs `CKEDITOR.instances["emailBody"].setData(...)` / `.getData()` (`js/emailHandler.js:158,162,187,199`) via `onchange` handlers (`candidates/SendEmail.tpl:96,104`). With no instance, `CKEDITOR.instances["emailBody"]` is undefined.
- **Evidence:** as above.
- **Inferred (not exercised):** selecting a template throws a JS TypeError and leaves the body empty; preview for a candidate also fails.
- **Impact:** Recruiters cannot use saved e-mail templates for bulk e-mail in this build and get no message saying why.
- **Severity:** MEDIUM — part of the bulk e-mail feature is unusable.
- **Recommendation:** Make the template and preview handlers work on the plain textarea when no editor instance exists, so the feature does not depend on the editor starting.
- **Unknown / needs further validation:** Needs one browser run on an isolated instance selecting a template on the compose page.

## 7. Responsiveness and mobile

### UX-001 — No responsive layout in the app or the careers portal
*Confirmation: **Runtime** · Phase 0 severity: HIGH → now MEDIUM (runtime shows pages render and stay operable with horizontal scroll; degraded, not broken) · Related: RT-14*

- **Confirmed fact:** No page declares a viewport and no stylesheet has a media query; at phone width the pages keep their desktop width.
- **Evidence:**
  - Runtime RT-14: at 390 px viewport the candidates list is 978 px wide (#92, `scrollWidth=978`), the dashboard is 978 px with the user/role line drawn over the tab row (`S4`), candidate detail is 978 px (`S5`), the careers job list is 940 px (#93). Only the login page fits (`S6`).
  - Runtime RT-14 / `S2`: the e-mail compose panel is 1,325 px wide on a 1,280 px desktop viewport (also visible in #78, where the grey panel runs past the page frame).
  - Static: `grep` finds 0 `viewport` in templates, PHP, CSS and JS outside `vendor/`, and 0 `@media` rules. Fixed widths: `main.css:148` (`width: 80em`), image tabs `main.css:163-192`, DataGrid absolute widths (`DataGrid.php:1592,2640`), careers `#container { width: 940px }` and two 450×470 px apply boxes (`db/cats_schema.sql:434`).
- **Impact:** Applicants on phones must pinch and scroll sideways through the apply form; recruiters cannot use the app comfortably on tablets or phones; also a WCAG 1.4.10 (reflow) failure.
- **Severity:** MEDIUM — degraded use on small screens; the flows still complete.
- **Recommendation:** Give the careers pages and the recruiter chrome a viewport declaration and fluid widths so they reflow at phone width; the careers apply form matters most because it is candidate-facing.
- **Unknown / needs further validation:** Real device and browser mix of applicants; needs analytics from a production careers site.

## 8. Accessibility

| WCAG 2.1 criterion | Status | Evidence (recounted for this edition) |
|---|---|---|
| 1.1.1 Non-text content | Fail | 327 `<img>` in templates, 108 without `alt`, 61 with `alt=""` incl. functional icons (`candidates/Show.tpl:530` edit icon with `alt=""` and only `title`; `DataGrid.php:1623,1766,1774`); EEO chart `<img>` without `alt` (`EEOReport.tpl:64`) |
| 1.3.1 Info and relationships | Fail | 0 `<fieldset>`, 0 `<caption>`, 0 `scope=`, 0 `<h1>` (88 `<h2>`); 428 `<table>` vs 275 `<th>` (layout tables) |
| 1.3.5 Identify input purpose | Fail | no input-purpose `autocomplete` tokens; 31 × `autocomplete="off"` |
| 1.4.1 Use of colour | Fail | hot/submitted/placed by link colour only (`main.css:857-902`); active sub-tab by colour only (`TemplateUtility.php:685`) |
| 1.4.3 Contrast | Fail | see UX-009 |
| 1.4.10 Reflow | Fail | UX-001 (runtime RT-14) |
| 2.1.1 Keyboard | Fail | column reorder/resize `onmousedown` only (`DataGrid.php:1719,1840`); rating stars are image-map `<area>` (`TemplateUtility.php:891-950`); popup close is `<img onclick>` (`:548-549`); careers apply/submit are `<img onclick>` (`db/cats_schema.sql:437,439`; runtime `S3`) |
| 2.4.1 Bypass blocks | Fail | no skip link |
| 2.4.3 Focus order | Fail | positive/duplicate `tabindex` (UX-010); popups do not move focus, Tab trapped via `document.onkeypress` (`subModal.js:94,264`) |
| 3.1.1 Language of page | Partial | app pages `lang="en"` (`TemplateUtility.php:1180`); login (`Login.tpl:4`) and careers (`careers/Blank.tpl:3`) have none |
| 3.3.1 Error identification | Fail | `alert()` and generic fatal pages (UX-013) |
| 4.1.2 Name, role, value | Fail | 0 `aria-*` and 0 `role=` in templates, PHP and first-party JS |
| 2.4.7 Focus visible | Pass (browser default) | no `outline: none` found |

No automated (axe) result is committed in `docs/baseline/`; the table is based on code counts.

### UX-005 — Core interactions not operable by keyboard or screen reader; no ARIA
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: UX-010, UX-009*

- **Confirmed fact:** Primary workflows depend on mouse-only or unnamed controls, and the codebase has no ARIA semantics.
- **Evidence:**
  - Popup close `<img … onclick="hidePopWin(false);">` (`TemplateUtility.php:548-549`); no `role="dialog"`, no Esc handling, no focus move (`subModal.js:132-177`); Tab suppressed through `keypress` (`subModal.js:94,264`).
  - Column reorder/resize via `onmousedown` (`DataGrid.php:1719,1840`); chooser and sort icons `alt=""` (`:1623,1766,1774`); row checkboxes without labels (`:1880`).
  - Pipeline "Log an Activity / Change Status" is an icon with `alt=""` (`candidates/Show.tpl:529-530`).
  - Careers "Apply to Position" and "Submit Application Now" are images with `onclick` (`db/cats_schema.sql:437,439`); the smoke harness had to click an image instead of a button (`SMOKE_TEST.md` §3).
  - 0 `aria-` and 0 `role=` (grep over templates, PHP and first-party JS).
- **Impact:** Keyboard-only and screen-reader users cannot manage grid columns, rate candidates, reliably use popups or, on the careers site, submit an application.
- **Severity:** HIGH — candidate-facing application and core recruiter actions are inaccessible; legal exposure under accessibility law.
- **Recommendation:** Make every action a real button or link with an accessible name and give popups dialog semantics with keyboard close and focus handling, so the core flows can be completed without a mouse.
- **Unknown / needs further validation:** Needs a manual keyboard and screen-reader pass (NVDA/VoiceOver) and an automated axe run on an isolated instance; no such result is committed.

### UX-009 — Colour-contrast failures and colour-only status meaning
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: UX-005*

- **Confirmed fact:** Several text/background pairs are below the 4.5:1 minimum, and record state is shown by colour alone.
- **Evidence:** ratios computed from literal colours: sub-tab links `#f4f4f4` on `#6c94eb` 2.70:1 (`main.css:225`); active sub-tab `#cccccc` on `#6c94eb` 1.85:1 (`TemplateUtility.php:685`); "placed" `#00ff00` on white 1.37:1 (`main.css:891,902`); "submitted" `#ff6c00` 2.84:1 (`:875,881`); MRU "Recent:" `#ff6600` 2.94:1 (`:297`); "(INACTIVE)" orange 1.97:1 (`candidates/Show.tpl:71`); disabled-looking labels `#aaa` on `#eee` 2.00:1 (`AddActivityChangeStatusModal.tpl:82`); links not underlined (`main.css:79-83`); validation marks only the label red (`js/lib.js:841-846`). The colours are visible in runtime screenshots (#32, #90) but ratios were not measured in a browser.
- **Impact:** Low-vision and colour-blind users cannot read sub-navigation or tell hot/submitted/placed records apart.
- **Severity:** MEDIUM — accessibility defect on primary navigation and triage cues.
- **Recommendation:** Raise the failing colour pairs to at least 4.5:1 and add a text cue next to colour-coded states, because colour is currently the only signal.
- **Unknown / needs further validation:** Rendered contrast over the gradient header images (`images/bgBlue.gif`) was approximated; needs a browser contrast check.

## 9. Visual consistency and legacy UI technology

| Aspect | Fact | Evidence |
|---|---|---|
| Doctype / layout | XHTML 1.0 Transitional; 428 `<table>`; icon + `<h2>` header table copy-pasted in about 85 templates | `TemplateUtility.php:1178-1180` |
| Inline styling | 1,065 `style="…"` attributes in templates; 17 distinct inline font sizes (4 px–36 px) | `counts.py` |
| JS | jQuery 1.3.2 on every page (`TemplateUtility.php:1194`) for about 15 calls in 3 files (`js/emailHandler.js:183,198`, `settings/tags.tpl:41-79`, `settings/EmailTemplates.tpl:21-22`); about 330 top-level functions in `js/*.js`; 342 `onclick=`, 108 `javascript:` URLs, 109 `<script>` blocks in templates | recount |
| AJAX | custom XHR helpers posting to `ajax.php`; XML or HTML fragments injected via `innerHTML` and run with `eval` (`js/lib.js:852-880`) | — |
| IE hacks | `<!--[if IE]>` / `<![if !IE]>` stylesheets (`TemplateUtility.php:1215-1216`), CSS `expression()` (`DataGrid.php:1592`), ActiveX XHR fallback (`js/lib.js:260-300`) | — |
| Images | 300 raster images; text baked into images for empty states and careers buttons (`images/nodata/*`, `careers_submit.gif`) | runtime #90 ("NO DATA"), `S3` |

### UX-008 — Shared chrome and every list view fatal on PHP ≥ 8.0 (`implode` argument order)
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEPENDENCY area, TECHNICAL_DEBT area*

- **Confirmed fact:** `implode()` is called with the legacy (array, glue) order in the MRU renderer and the DataGrid SQL builder. PHP 8 throws `TypeError` for this order.
- **Evidence:** `lib/MRU.php:159-161`; `lib/DataGrid.php:1292,1328,1329`. `printQuickSearch()` calls the MRU renderer on every recruiter page (`TemplateUtility.php:258`). Phase 0 confirmed the `TypeError` with `php -r` on PHP 8.4. The baseline ran PHP 7.2, where this works (all pages rendered).
- **Impact:** On PHP 8 essentially every authenticated page and every list fails, so no UI work can be tested on a supported PHP version until this is fixed.
- **Severity:** HIGH — major barrier to any modernization.
- **Recommendation:** Swap the argument order at these four call sites; it is a precondition for running the UI on PHP 8.
- **Unknown / needs further validation:** Other PHP 8 incompatibilities on the same pages; needs a PHP 8 run of the smoke test on an isolated instance.

### UX-016 — Legacy JS stack: jQuery 1.3.2, globals, inline handlers, `eval`, `document.write`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEPENDENCY area, SEC area*

- **Confirmed fact:** The UI relies on jQuery 1.3.2 (2009), about 330 global functions, several hundred inline handlers, `eval` for AJAX fragments and a `document.write` date widget; there is no build step.
- **Evidence:** table above; `js/calendarDateInput.js:29,603` (`document.write`/`writeln`), `:566-569` (`eval`); `js/lib.js:852-880` (`execJS` via `eval`); duplicate global names across files (e.g. `checkAddForm`, `findNode`).
- **Impact:** A strict Content-Security-Policy is impossible; the jQuery version has published advisories (external knowledge); global name collisions make changes risky.
- **Severity:** MEDIUM — maintainability and security-hardening cost.
- **Recommendation:** Remove the jQuery dependency (it serves about 15 calls) and stop evaluating server-sent script, because both block basic browser hardening.
- **Unknown / needs further validation:** Whether any published jQuery 1.3.2 advisory is reachable through these call sites; needs SEC review.

### UX-019 — Inconsistent visual implementation and heavy template duplication
*Confirmation: **Static** · Phase 0 severity: unchanged*

- **Confirmed fact:** The same UI parts are hand-copied across many templates with differing colours, fonts and markup.
- **Evidence:** 44 distinct hex colours in `main.css` and 50 in template inline styles; three font families (Arial/Tahoma, Verdana, Helvetica on careers); 18 near-identical error templates (root `Error.tpl`, 12 module `Error.tpl`, 5 `ErrorModal.tpl`); header table repeated in about 85 templates; `insertAtCursor()` re-implemented in `CareerPortalTemplateEdit.tpl:19-40` and `EmailTemplates.tpl:40-60`; three sorting mechanisms (DataGrid reload, `sorttable.js`, AJAX pipeline sort); "Only My Candidates" is plain text (`Candidates.tpl:35`) while "Only My Job Orders" is a `<label>` (`JobOrders.tpl:47`).
- **Impact:** Any visual or behavioural fix must be repeated in many files and drifts; users meet slightly different controls for the same job.
- **Severity:** MEDIUM — notable maintainability cost.
- **Recommendation:** Collapse the duplicated error templates and page-header markup into single shared templates, because today each fix has to be copied by hand.
- **Unknown / needs further validation:** None.

## 10. Internationalisation and localisation

### UX-015 — No i18n; US-only date, address and phone model
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: DATABASE area*

- **Confirmed fact:** All UI text is hard-coded English, dates are shown as two-digit-year `MM-DD-YY`, and the data model is US-only.
- **Evidence:**
  - Runtime: dates render as `09-25-26 (10:59 PM)` on candidate detail and the dashboard (#32, #90); the calendar shows "Date: 09-25-26" (#36).
  - Static: no gettext/`setlocale`/`Intl` in first-party code; `Template::_()` is only `htmlspecialchars` (`lib/Template.php:51-54`).
  - Static: every `DateInput()` picker is fixed to `'MM-DD-YY'` (e.g. `candidates/Add.tpl:419`, `AddActivityChangeStatusModal.tpl:157`, `lib/ExtraFields.php:680,870`); DMY sites are supported by rewriting SQL text (`lib/DatabaseConnection.php:703-709`); client date sort assumes MM-DD (`js/sorttable.js:291-306`).
  - Static: Localization offers an integer GMT offset and MDY/DMY only (`settings/Localization.tpl`, runtime page #64); scheduling is 12-hour AM/PM only (`AddActivityChangeStatusModal.tpl:162-177`).
  - Static: State/ZIP fields, NANP phone formatting (`lib/StringUtility.php:128-160`), no country field on candidate/company/contact/job order, salary as free text, US EEO categories.
- **Impact:** Unusable for non-English teams; two-digit years and MM/DD order cause date errors for non-US users; international candidates cannot be recorded properly.
- **Severity:** MEDIUM — limits the product to US English users.
- **Recommendation:** Show four-digit, unambiguous dates and add country to address data, since these cause data errors even for English-speaking non-US users.
- **Unknown / needs further validation:** DMY sites were not exercised; end-to-end correctness of DMY input, storage, sorting and reports needs a run with the DMY setting.

## 11. Candidate-facing careers UX

How it works: `careers/index.php` → `CareersUI`; templates are HTML fragments stored in `career_portal_template(_site)` and filled by `str_replace` on pseudo-tags (`<input-firstName>`, `<a-applyToJob>`…); the shell is `modules/careers/Blank.tpl`. Runtime path (after enabling, #75): home #80 → all jobs #81 → job detail #82 → apply #84/`S3` → submit #85/#86. Registration/login and questionnaires were not exercised.

| Careers element | Current behaviour | Evidence |
|---|---|---|
| Template model | Named fragments (Header, Footer, Left, CSS, Content - Main / Search Results / Job Details / Apply for Position / Questionnaire / Thanks / Candidate Registration / Candidate Profile); two stock boards "CATS 2.0" and "Blank Page" | `lib/CareerPortal.php:146-330`, `db/cats_schema.sql:410-447` |
| Admin customisation | Raw HTML/CSS in 920 px textareas with token-insert buttons and a full-page preview; no logo upload or colour setting | `settings/CareerPortalTemplateEdit.tpl:61-187`, `CareerPortalSettings.tpl:246` |
| Apply form (default) | Four boxes: 1 import resume (Choose File → Upload → text → "Populate Fields ->"), 2 about you, 3 contact, 4 additional info; image button "Submit Application Now" | runtime `S3`, #84; `db/cats_schema.sql:439` |
| Required fields | Asterisks on 9 fields; only first name, last name and e-mail enforced, by sequential `alert()` | `S3`; `CareersUI.php:973-1112` |
| Extra notes | 450-character limit enforced by an `onkeyup` alert | `CareersUI.php:617` |
| Questionnaire | If the job has one, all POST data is re-emitted as hidden fields and the questionnaire page is shown before the thank-you page | `CareersUI.php:737-792,1605-1627` |
| Error / edge pages | Disabled portal → blank page (RT-16); "no longer available" → bare text + 1.5 s JS redirect; e-mail failure → PHP fatal (UX-023) | `CareersUI.php:103,192,555,720` |
| Attribution | "Powered by OpenCATS" image link on every page (licence) | `modules/careers/Blank.tpl:36-41` |

### UX-023 — Careers applicant is shown a raw PHP fatal error after a saved application
*Confirmation: **Runtime** · New in this edition · Related: RT-04, RT-15, UX-013, WORKFLOW_ANALYSIS W11*

- **Confirmed fact:** After "Submit Application Now", the applicant sees a PHP fatal error page with a stack trace instead of a thank-you page, although the application was saved.
- **Evidence:** Runtime #85 and #86 (`results.json`, `php_errors.log`): "Fatal error: Uncaught PHPMailer\PHPMailer\Exception: SMTP Error: Could not connect to SMTP host…" with absolute paths; RT-04 records that the candidate, the pipeline row (status 100) and the activity "User applied through candidate portal" were saved first. Code: the confirmation e-mail is sent from `CareersUI.php:1475` onwards with no exception handling (`lib/Mailer.php:241`), before the "Thanks" content is rendered (`CareersUI.php:760`). The trigger is the committed default mail configuration (SMTP `localhost:587`, placeholder credentials).
- **Impact:** Applicants believe the application failed and may re-apply (logged as "User re-applied through candidate portal", `CareersUI.php:1433-1440`); they see server paths and part of their own e-mail address in the trace; the site looks broken to the public.
- **Severity:** HIGH — the candidate-facing core flow ends in an error page on a default configuration.
- **Recommendation:** Never let a notification failure replace the applicant's confirmation page; the saved application should always end on the thank-you content.
- **Unknown / needs further validation:** Behaviour with a reachable SMTP server was not tested (no real mail allowed in the baseline).

### UX-024 — Careers resume silently discarded unless the applicant clicks "Upload"
*Confirmation: **Runtime** · New in this edition · Related: RT-12, WORKFLOW_ANALYSIS W11*

- **Confirmed fact:** A resume chosen in the file input but not "uploaded" with the separate Upload button is ignored on submit, with no message.
- **Evidence:** Runtime #85 (file chosen, Upload not clicked) → candidate and pipeline created, **no attachment**; #86 (Choose File → Upload → submit) → attachment stored and found by resume search (#87: `Applicant-Test attachments: []`, `Applicant2-Test attachments: ["resume_morgan.docx"]`). Code: the visible input is `resumeFile` (`CareersUI.php:602`); submit attaches only `$_FILES['file']` or the hidden `$_POST['file']` set by the Upload postback (`:1351,1375`). The recruiter add form, by contrast, attaches the chosen file on submit (`CandidatesUI.php:2764-2800`).
- **Impact:** The recruiter receives an applicant without a resume; the applicant believes it was sent.
- **Severity:** HIGH — silent loss of candidate-supplied data on the main intake channel.
- **Recommendation:** Attach the file chosen in the visible input on final submit (as the recruiter form already does), or block submit with a clear message, so a chosen resume is never dropped silently.
- **Unknown / needs further validation:** Behaviour of custom careers templates that place the file input differently; needs a check against real `career_portal_template_site` rows.

### UX-012 — Careers portal functional gaps: empty search page, broken RSS link, blank disabled state
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-05, RT-16, FEAT-011*

- **Confirmed fact:** The portal's search page is empty, its "RSS Feed" shortcut leads to a fatal error, a disabled portal is a blank page, and job listing has no search, filter or paging.
- **Evidence:**
  - Runtime #83: `?p=search` renders only the header, shortcuts and footer — no search form (code: empty branches `CareersUI.php:180-182,856-858`; `Openings.tpl`/`SearchOpenings.tpl` are 0 bytes).
  - Runtime #88 / RT-05: the "RSS Feed" shortcut on every careers page (`S3`) points to `../rss/`, which is a PHP fatal.
  - Runtime RT-16: before enabling, every careers URL returns `<html><body><!-- Job Board Disabled --></body></html>` (`CareersUI.php:103`).
  - Static: `p=showAll` renders all public jobs in one unpaginated table (`CareersUI.php:1115-1187`); "no longer available" pages are bare HTML with a JS redirect (`:192,266,555,720,756,815`); labels mark "Best time to call", City, State, ZIP and Key Skills as required (`S3`) but only first name, last name and e-mail are validated (`_makeApplyValidator`, `CareersUI.php:973-1112`); label typo "Email Adddress" (`S3`); relative `../` asset paths assume the `/careers/` entry (`Blank.tpl:7,40`).
- **Impact:** Applicants cannot search jobs, hit a fatal page from a visible button, and get no explanation when the portal is off; required-field markers mislead.
- **Severity:** MEDIUM — degraded public portal; applying still works.
- **Recommendation:** Hide or implement the search page and the RSS shortcut, show a readable message when the portal is disabled, and make the asterisks match the fields actually required.
- **Unknown / needs further validation:** Behaviour of customised production templates.

### UX-011 — Careers questionnaire pre-selects the first radio answer
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: WORKFLOW_ANALYSIS W11*

- **Confirmed fact:** For radio questions the first answer is rendered `checked`; answers have no labels and share one id; question and answer text are echoed raw.
- **Evidence:** `settings/CareerPortalQuestionnaireShow.tpl:55-60` (`$nochecked` sets `checked` on the first answer; every radio in the group gets the same `id`); `:50` `echo $question['questionText']`; answer text echoed at `:59`.
- **Impact:** An applicant who skips a question silently submits the first answer; questionnaire actions (`Questionnaire::doActions()`, e.g. set Hot, set Key Skills) then fire on an answer the applicant never chose.
- **Severity:** MEDIUM — skews screening data and automatic record changes.
- **Recommendation:** Render radio groups with no default selection so the stored answer is always the applicant's own choice.
- **Unknown / needs further validation:** Questionnaires were not exercised at runtime.

### UX-007 — Careers "registered candidate" login is e-mail + last name + ZIP, stored in a cookie (cross-ref SEC)
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: FEAT-005, API-003, SEC area*

- **Confirmed fact:** With registration enabled, a returning applicant is identified by e-mail plus the other fields of the registration template (default: last name and ZIP); "remember me" is checked by default and stores these values in a cookie for two weeks; the profile page shows and replaces the latest resume.
- **Evidence:** default registration template `db/cats_schema.sql:440`; matching `CareersUI.php:1635-1735` (comment `:1700-1701` calls the field "equivilant of a 'password'"); `rememberMe` checked `:372,900`; cookie `:1728` (2 weeks), `:354`, `:1277` (1 hour after applying); profile `:183-358`.
- **Impact:** Anyone who knows an applicant's e-mail, surname and postcode can view and change their profile and resume.
- **Severity:** HIGH — account takeover of applicant profiles with public-ish data.
- **Recommendation:** Do not expose profile view/edit on knowledge of e-mail, surname and ZIP, and do not store these values in a cookie; until changed, the setting should warn admins of this risk.
- **Unknown / needs further validation:** Registration was not exercised (`SMOKE_TEST.md` §4); exploitability needs authorized security testing on an isolated instance.

## 12. Perceived performance

Runtime on the near-empty baseline: server time to first byte 24–46 ms for 14 main pages, browser `load` 12–150 ms, no page over 73 ms server time (`KNOWN_RUNTIME_ERRORS.md` §Performance). Nothing felt slow at this size; larger data volumes were not tested (PERFORMANCE area).

### UX-014 — Full-page-reload interaction model for lists and popups
*Confirmation: **Static** · Phase 0 severity: MEDIUM → now LOW (runtime shows page loads of 12–150 ms on small data; remaining cost is lost context and extra loads) · Related: PERFORMANCE area*

- **Confirmed fact:** Every list interaction and most popup closes reload the whole page.
- **Evidence:** `ajaxMode = false` in the module grids of candidates, job orders, companies, contacts, activities and lists (`modules/*/dataGrids.php`); only the dashboard grids use AJAX (`modules/home/dataGrids.php`). Popup close calls `parentGoToURL` (10 templates) or `parentHidePopWinRefresh` (7) → `window.location.href = sURL + ' '` (`subModal.js:252-258`). Resume Upload and Parse are full form re-posts (`CareersUI.php:467` "giving the illusion of AJAX").
- **Impact:** Scroll position and context are lost after each sort, page change or popup; one pipeline status change costs about 7–8 page loads (WORKFLOW_ANALYSIS W4). On the small baseline each load is fast.
- **Severity:** LOW — friction; speed on real data is a PERFORMANCE question.
- **Recommendation:** Keep the user's place after popups and grid actions, because losing scroll and context is the main cost users feel today.
- **Unknown / needs further validation:** Timings on production-size data; needs a performance run with realistic volumes.

## Working UI behaviours observed at runtime (reference)

These behaviours worked in the baseline and carry real value; they are recorded so they are not lost.

| Behaviour | Evidence |
|---|---|
| One popup combines status change, activity note ("Status change: X" pre-filled), optional candidate e-mail and optional calendar event, and reports each outcome in plain text | #31 confirmation text; `AddActivityChangeStatusModal.tpl`, `js/activity.js:645-720` |
| Candidate detail shows contact data, attachments with text preview, pipelines with status and rating, lists and a full activity log on one page | #26, #32 |
| Duplicate notice when a candidate with the same name/e-mail is added, with a "Link duplicate" action | #24 |
| Resume "Upload" in the recruiter add form extracts text into the form before saving | #22 (186 characters extracted) |
| Company autocomplete sets the hidden company id on contact and job-order forms | #14, #19 |
| Global quick search finds candidates, companies, contacts and job orders in one query | #38 |
| Resume keyword search over TXT and DOCX attachment text | #42, #44, #45 (negative control) |
| "Recent:" MRU bar for fast return to the last five records | #32, #90 |
| Per-user column choice, width and order persisted for grids | `user.column_preferences`; post-install snapshot contains saved preferences (`SMOKE_TEST.md` §3) |
| Licence-required "Powered by OpenCATS" attribution | `TemplateUtility.php:816-831`, `careers/Blank.tpl:38-41` |

## Area-level unknowns

1. **Accessibility in a real browser.** No keyboard, screen-reader or axe result exists. Validate with a manual NVDA/VoiceOver pass and an axe-core run on an isolated instance (the preview tooling already has an axe check, `verify-preview.js` check 10; its output is not committed).
2. **Bulk actions (UX-002).** Only "Send E-Mail → Selected" was observed. Exercise Export (Selected/All), Add To List, Add To Job Order and Remove From This List with more than 15 rows and a non-default sort.
3. **E-mail compose templates (UX-026).** Select a template and a preview candidate on the compose page and record console errors.
4. **Double-encoding at scale (UX-003).** Count rows containing `&amp;`, `&#039;` or `&amp;amp;` in name/title columns on a production copy.
5. **Custom careers templates.** Production sites may have edited `career_portal_template_site` rows; UX-010, UX-012, UX-024 and UX-011 must be re-checked against them.
6. **Mail configured.** UX-023 and UX-026 behaviour with a reachable SMTP relay.
7. **PHP 8.** Which UI pages fail beyond UX-008 on PHP 8; run the smoke test on PHP 8 in isolation.
8. **Hooks.** 278 `eval(Hooks::get(...))` points can change UI output in deployments with plugins; their content is not in the repo.
9. **DMY and time zones.** End-to-end check of DMY sites across pickers, grids, calendar and reports.

## Changes from the Phase 0 edition

- **Re-rated:** UX-001 HIGH → MEDIUM (runtime RT-14 shows pages render and remain operable; degraded, not broken). UX-014 MEDIUM → LOW (runtime page loads 12–150 ms on small data; remaining impact is lost context).
- **Confirmation upgrades from runtime evidence:** UX-001 (RT-14, #92, #93, `S2`, `S4`, `S5`); UX-002 (#78 request URL, compose recipients, RT-11); UX-012 (#83 empty search page, RT-05, RT-16); UX-013 (RT-03, RT-04, RT-06, RT-11, RT-15); UX-015 (two-digit US dates in #32, #36, #90); UX-018 (RT-07, #19, #78, `S1`); UX-022 (`CURRENT_UI_MAP.md` login helpers, footer in screenshots). UX-017 is **Partial** (controls observed, behaviour inferred).
- **Refined:** UX-002 now covers "Export → All" (exports only 15 rows) and "Remove From This List → Selected" (removes unselected entries), both static. UX-003 now names the add paths that store escaped text on first save (company, contact, job order, calendar, user). UX-006 notes the activity-note echo is escaped on input (`CandidatesUI.php:2961`). UX-019 retitled to describe the defect instead of a missing design system.
- **Corrected counts/lines:** `getSanitisedInput` call sites 161 (was 162); `onclick=` 342 (was 340); `confirm(` 26 (was 28); top-level functions in `js/*.js` about 330 (was 344); jQuery used by about 15 calls in 3 files (was "about 7 call sites"); `License.php:687-706` (was 687-705); `joborders/Add.tpl:306` for Reset.
- **New:** UX-023 (applicant sees fatal after saved application), UX-024 (careers resume dropped without Upload), UX-025 (dashboard widget labels and empty states), UX-026 (compose template/preview depends on a missing editor instance).
- **Withdrawn / merged:** none.
- **Moved out:** Phase 0 §2 "Key user journeys" (J1–J5) is superseded by `WORKFLOW_ANALYSIS.md`, which covers the same journeys with runtime evidence. Phase 0 §12.2–12.3 (redesign targets, quick wins) were removed because this edition records findings only; §12.1 "patterns worth preserving" is kept as the runtime-backed reference table above.
