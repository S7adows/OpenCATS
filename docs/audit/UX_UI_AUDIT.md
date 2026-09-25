# OpenCATS UX / UI Audit

**Scope.** This document audits the user-facing frontend of the OpenCATS repository (CATS 0.9.7.4 lineage, `constants.php:45`). It covers the recruiter application and the public careers portal. In scope: all 136 `.tpl` templates (`modules/*/*.tpl`, `Error.tpl`, `lib/datagrid/FilterArea.tpl`); the shared chrome renderer `lib/TemplateUtility.php`; the template engine `lib/Template.php`; the list-view engine `lib/DataGrid.php`; all first-party JavaScript (`js/*.js`, `js/submodal/subModal.js`, `modules/*/*.js`); all CSS (`main.css`, `ie.css`, `not-ie.css`, `careersPage.css`, `modules/*/*.css`); `images/`; the careers module (`modules/careers/*`, `careers/index.php`); the career-portal template system, which stores templates in the database; the dashboard, first-run wizard, login and e-mail template screens. The audit reconstructs navigation, key user journeys, the layout and JavaScript stack, accessibility, internationalization, visual consistency, careers-portal UX and perceived performance. Every claim cites code. Where the effect of the code on a live user cannot be proven without running it, the claim is labelled as an inference.

---

## Method

- **Static reading.** I read `lib/TemplateUtility.php` (all 1,245 lines), `lib/Template.php` and the relevant parts of `lib/DataGrid.php` (constructor, `get`/`getFromRequest`, `draw`, action area, navigation). I read the full controllers or the relevant actions of `modules/{candidates,joborders,careers,home,reports,settings,login,lists}/*UI.php`, plus `lib/MRU.php`, `lib/CareerPortal.php`, `lib/Search.php` (QuickSearch), `lib/License.php`, `lib/ParseUtility.php`, `lib/StringUtility.php` and `lib/DatabaseConnection.php` (DMY handling).
- **Templates read in full or in large part:** `candidates/{Add,Show,AddActivityChangeStatusModal,ConsiderSearchModal,Candidates,Error}.tpl`, `joborders/{Add,AddModalPopup,Show}.tpl`, `home/{Home,SearchEverything}.tpl`, `settings/{CareerPortalTemplateEdit,CareerPortalSettings,CareerPortalQuestionnaireShow,Localization,EmailTemplates,Administration,getFirefoxModal}.tpl`, `reports/{Reports,EEOReport,SubmissionReport}.tpl`, `careers/Blank.tpl`, `login/Login.tpl`, `toolbar/install.tpl`.
- **Database-stored careers templates:** `db/cats_schema.sql:408-447`, covering the `career_portal_template` rows for "Blank Page" and "CATS 2.0".
- **Quantitative scans**, run with `grep`/`find` and small Python scripts kept in the scratchpad (`notes/imgalt.py`, `notes/labels.py`, `notes/contrast.py`):
  - counts of inline handlers, inline styles, `<table>`, ARIA, `<label>`, `tabindex`, `alt`, `@media`, `viewport`, jQuery call sites, global JS functions, fixed pixel widths, hex colours and font sizes;
  - WCAG 2.1 contrast ratios computed from the `main.css` colour pairs;
  - unreferenced templates, found by grepping each template's basename across `modules/`, `lib/`, `index.php` and `careers/`.
- **Runtime checks, kept outside the repo:** I used `php -r` (PHP 8.4.19) to confirm that (a) `json_decode()` of a PHP-`serialize()`d string returns `NULL`, and (b) `implode($array, $string)` (legacy argument order) throws a `TypeError` on PHP 8.
- **Not done:** I did not run the application in a browser. No screen-reader, Lighthouse or axe runs were possible (see Unknowns). The deployment target is PHP 7.2 (`docker/docker-compose.yml:14` `opencats/php-base:7.2-fpm-alpine`, CI matrix `php-version: ['7.2']`).

---

## Summary of findings

| ID | Title | Severity |
|---|---|---|
| UX-001 | No responsive/mobile support anywhere (app or public careers portal) | HIGH |
| UX-002 | Bulk "Selected" list actions: parameter encoding mismatch (PHP `serialize` vs `json_decode`) drops the selection | HIGH |
| UX-003 | Encode-on-input + encode-on-output double-escapes names and text and corrupts them progressively on every edit | HIGH |
| UX-004 | EEO self-identification options are wrong in both the careers and the recruiter forms (data-integrity/compliance) | HIGH |
| UX-005 | Core interactions not operable by keyboard or screen reader (modals, grid column management, ratings, icon-only links, image "submit" buttons); zero ARIA | HIGH |
| UX-006 | Output-encoding gaps in the shared UI chrome (quick search, MRU, `<title>`, advanced search) (cross-ref SEC) | HIGH |
| UX-007 | Careers "registered candidate" login = e-mail + last name + ZIP; a 2-week cookie stores the PII; profile shows the resume and allows replacing it (cross-ref SEC) | HIGH |
| UX-008 | Shared chrome (MRU/quick search) and every DataGrid list view fatal on PHP ≥ 8.0 (legacy `implode` argument order) (cross-ref DEP) | HIGH |
| UX-009 | Colour-contrast failures and colour-only meaning (hot/submitted/placed, sub-tabs, validation) | MEDIUM |
| UX-010 | Form-semantics defects: wrong/missing `label for`, duplicate ids, duplicate positive `tabindex`, no fieldsets | MEDIUM |
| UX-011 | Careers questionnaire pre-selects the first radio answer; unlabelled answers; duplicate ids | MEDIUM |
| UX-012 | Careers portal functional gaps: no search (empty branches, 0-byte templates), no pagination, fixed 940 px layout, required markers not enforced, blank `die()` pages | MEDIUM |
| UX-013 | Error-handling UX: validation failures become "A fatal error has occurred." pages; `alert()`-based validation; `confirm()`-guarded GET deletes | MEDIUM |
| UX-014 | Full-page-reload interaction model (list views non-AJAX; modal close reloads parent; parse round trips) | MEDIUM |
| UX-015 | No i18n; US-centric locale model (MM-DD-YY pickers, 2-digit years, DMY via SQL string replace, client sort assumes MDY, State/ZIP/NANP, US EEO, no country or currency) | MEDIUM |
| UX-016 | Legacy JS stack: jQuery 1.3.2 on every page for about 7 call sites, 344 global functions, 340 inline `onclick`, `document.write` widget, `eval`, no build | MEDIUM |
| UX-017 | Resume "import/parse" UI is always shown (`isParsingEnabled()` always `true`) but depends on a third-party SOAP service over HTTP | MEDIUM |
| UX-018 | CKEditor 4 used inconsistently (job description and candidate e-mail only; e-mail templates are plain text; Internal Notes marked but not initialised) | MEDIUM |
| UX-019 | No design system: 44+50 hex colours, 17 inline font sizes, 1,065 inline `style=`, 18 near-duplicate error templates, 85 duplicated page headers, raster-only icons, text-in-image | MEDIUM |
| UX-020 | Dead or broken UI remnants (13 unreferenced templates, Firefox toolbar, broken "Insert Site Name", reminder toggle, `suggest.js` key 48, unreachable forgot-password) | LOW |
| UX-021 | Journey friction: job order requires a pre-existing company; copy-from loads all job orders; reports limited to fixed periods with no export; Reset beside Submit | LOW |
| UX-022 | Login and footer hygiene: no `lang`, duplicate ids, error below the fold, default credentials in page JS (cross-ref SEC), server timing and version in footer, report footer says "CATS/catsone" | LOW |

---

## 1. Information architecture

### 1.1 Page composition (shared chrome)

Every full-page template builds the same chrome by calling static printers in order. From `modules/candidates/Add.tpl:5-10`:

```php
TemplateUtility::printHeader('Candidates', array(... 'js/candidate.js' ...));
TemplateUtility::printHeaderBlock();
TemplateUtility::printTabs($this->active, $this->subActive);
<div id="main"> TemplateUtility::printQuickSearch(); <div id="contents"> ...
TemplateUtility::printFooter();
```

| Printer | What it emits | Evidence |
|---|---|---|
| `_printCommonHeader` | XHTML 1.0 Transitional doctype; `<html lang="en">`; 5 core scripts on every page (`lib.js`, `quickAction.js`, `calendarDateInput.js`, `submodal/subModal.js`, `jquery-1.3.2.min.js`); per-page includes; CSS via `@import`; IE conditional comments | `lib/TemplateUtility.php:1178-1216` |
| `printHeader` / `printModalHeader` | `<body style="background: #fff">` or `#eee` for modals, the quick-action holder, and the popup container | `lib/TemplateUtility.php:64-89` |
| `printHeaderBlock` | Logo inside a layout `<table>`; top-right user block with Logout, name, site, Administrator badge, "new version" and upsell links | `lib/TemplateUtility.php:96-205` (table at `:106`) |
| `printTabs` | `<div id="header"><ul id="primary">` tabs plus `<ul id="secondary">` sub-tabs, with ad-hoc access rules encoded in strings (`*al=`, `*hrmode=`, `*js=`) | `lib/TemplateUtility.php:570-800` |
| `printQuickSearch` | MRU ("Recent:") and the Quick Search form | `lib/TemplateUtility.php:255-301` |
| `printFooter` | Version, "Powered by OpenCATS" (license-mandated, see comment `:816-829`) and "Server Response Time" | `lib/TemplateUtility.php:802-852` |

This chrome appears in 82 templates (`printTabs`), with 86 calling `printHeaderBlock` and 22 modal templates using `printModalHeader`.

### 1.2 Top-level navigation (tabs)

The tab order comes from `$coreModules` (`constants.php:30-41`). Labels and sub-tabs come from each module's `_moduleTabText`/`_subTabs`. Modules with empty tab text (attachments, export, graphs, import, queue, rss, wizard, xml, toolbar, careers, login) have no tab.

| # | Tab | Sub-tabs | Visibility rules / evidence |
|---|---|---|---|
| 1 | Dashboard | none | `modules/home/HomeUI.php:43-44` |
| 2 | Activities | none | `modules/activity/ActivityUI.php:54` |
| 3 | Job Orders | *Add Job Order* (opens a modal via `showPopWin`), *Search Job Orders* | `modules/joborders/JobOrdersUI.php:83-88` |
| 4 | Candidates | *Add Candidate*, *Search Candidates* | `modules/candidates/CandidatesUI.php:73-77` |
| 5 | Companies (renamed "My Company" in HR mode) | *Add Company*, *Search Companies*, *Go To My Company* | `modules/companies/CompaniesUI.php:58-63`; rename `lib/TemplateUtility.php:608` |
| 6 | Contacts | *Add Contact*, *Search Contacts*, *Cold Call List* | `modules/contacts/ContactsUI.php:68-73` |
| 7 | Lists | *Show Lists* ("New Static/Dynamic List" commented out) | `modules/lists/ListsUI.php:54-59` |
| 8 | Calendar (ACL-gated) | *My Upcoming Events*, *Add Event*, *Goto Today* (all JS) | `modules/calendar/CalendarUI.php:44-49` |
| 9 | Reports | *EEO Reports* (only if EEO tracking enabled) | `modules/reports/ReportsUI.php:44-47`; rule `lib/TemplateUtility.php:765` |
| 10 | Settings | *Administration* (ACL), *My Profile* | `modules/settings/SettingsUI.php:69-82`; rule `lib/TemplateUtility.php:757` |

The active sub-tab is shown only by an inline lighter colour, `style="color:#cccccc;"` (`lib/TemplateUtility.php:685`).

### 1.3 Primary screens per module

Screens are reconstructed from `handleRequest()` switch cases.

| Module | List | Show | Add/Edit | Search | Other screens and modals |
|---|---|---|---|---|---|
| candidates | `listByView` → `Candidates.tpl` (DataGrid) | `Show.tpl` | `Add.tpl`, `Edit.tpl` | `Search.tpl`: name, resume keywords, key skills, city, phone (`Search.tpl:31-36`) | Modals: `AddActivityChangeStatusModal`, `ConsiderSearchModal`, `CreateAttachmentModal`, `CreateImageAttachmentModal`, `AssignCandidateTagModal`, `LinkDuplicity`; pages: `Merge`, `SendEmail`, `Questionnaire`, `ResumeView` (popup window) |
| joborders | `JobOrders.tpl` (DataGrid, 50 rows, `JobOrdersUI.php:327`) | `Show.tpl` (AJAX pipeline) | `AddModalPopup.tpl` → `Add.tpl`, `Edit.tpl` | `Search.tpl` | `ConsiderSearchModal` (820×550), `addCandidateModal` (reuses candidates `Add.tpl` in modal mode), `CreateAttachmentModal` |
| companies | `Companies.tpl` | `Show.tpl` | `Add.tpl`, `Edit.tpl` | `Search.tpl` | `internalPostings` ("My Company") |
| contacts | `Contacts.tpl` | `Show.tpl` | `Add.tpl`, `Edit.tpl` | `Search.tpl` | `AddActivityScheduleEventModal`, `ColdCallList`, vCard download |
| activity | `ActivityDataGrid.tpl` (period filter) | none | inline edit via AJAX (`ajax/editActivity.php`) | `Search.tpl` | none |
| lists | `Lists.tpl` | `List.tpl` | lists are created inside `QuickActionAddToListModal.tpl` ("New List") | none | "Add To List" modal from DataGrid and quick actions |
| calendar | `Calendar.tpl` (month/week/day in JS) | inline | inline forms in `Calendar.tpl` | none | upcoming events |
| reports | `Reports.tpl` (9 fixed periods) | `SubmissionReport.tpl`, `PlacedReport.tpl` (new tab) | none | none | `EEOReport.tpl`, `JobOrderReport.tpl` → PDF, `GraphView.tpl` |
| home | `Home.tpl` dashboard | none | none | `SearchEverything.tpl` (Quick Search results) | saved/recent searches |
| settings | `Administration.tpl` hub (Site Management / Feature Settings / GUI Customization / System / Other) | `ShowUser` | `AddUser`, `EditUser` | none | Career portal settings, template editor, questionnaire editor; e-mail settings and templates; EEO; tags; extra fields; backup; localization; login activity; item history |

### 1.4 Modals and popups

There are three mechanisms, plus native dialogs:

1. **subModal iframe dialogs.** `showPopWin(url, w, h)` appears 27 times. The dialog body is a separate document rendered with `printModalHeader` inside `#popupFrameIFrame` (`lib/TemplateUtility.php:543-560`, `js/submodal/subModal.js:132-177`). Sizes are fixed in pixels at the call site, e.g. `600, 480` (`modules/candidates/Show.tpl:529`) and `820, 550` (`modules/joborders/Show.tpl:419`).
2. **Real popup windows.** `window.open`/`openCenteredPopup` appears 19 times, e.g. resume preview (`CandidatesUI.php:792`) and "Show Job Order" from the consider modal (`ConsiderSearchModal.tpl:90`).
3. **Absolutely positioned `div` menus.** Quick-action menus (`js/quickAction.js`, `src/OpenCATS/UI/QuickActionMenu.php`), the DataGrid column chooser and the `suggest.js` autocomplete.
4. **Native dialogs.** `alert()` appears 132 times in JS and 5 in templates; `confirm()` appears 28 times.

### 1.5 MRU, quick search, "Search Everything", saved lists, hot

- **MRU.** The last 5 records viewed (`MRU_MAX_ITEMS`, `config.php:121`) are stored in table `mru` and rendered on every page as "Recent:" links (`lib/MRU.php:115-162`, `lib/TemplateUtility.php:263-272`). Entries are added on Show/Edit (e.g. `CandidatesUI.php:672-674`, `CompaniesUI.php:418`, `ContactsUI.php:384`).
- **Quick Search** (the "Search Everything" screen). A GET to `m=home&a=quickSearch` runs four unpaginated queries (candidates, companies, contacts, job orders), with phone-number normalization via nested `REPLACE` (`lib/Search.php:1329-1600`, `modules/home/HomeUI.php:191-377`). Results are four static tables in `modules/home/SearchEverything.tpl:19-182`. List search is commented out (`HomeUI.php:209`). The label is a `<span>`, not a `<label>` (`TemplateUtility.php:292-296`).
- **Recent and saved searches.** Up to 5 are kept, promoted with a "+" icon (`RECENT_SEARCH_MAX_ITEMS`, `config.php:127`; `lib/TemplateUtility.php:366-507`).
- **Saved lists.** These are static lists only; dynamic lists are commented out (`ListsUI.php:57-58`). Items are added from DataGrid "Add To List" (a popup) or from a record's quick-action menu.
- **Hot.** "Hot" is a per-record `is_hot` flag rendered only as red link colour (`main.css:857-868`, `lib/Candidates.php:1992`), with "Only Hot …" filters on the list pages. The old Hot Lists screen is dead: `modules/candidates/HotList.tpl` calls a non-existent `TemplateUtility::printNonSelectableHeader` and there is no `hotList` action.

### 1.6 Unreferenced (dead) templates

These 13 templates have no static reference in any PHP or template file: `toolbar/install.tpl`, `candidates/HotList.tpl`, `candidates/Duplicates.tpl`, `careers/{BlankNoMargin,Blank2,Openings,SearchOpenings}.tpl` (`Openings.tpl` and `SearchOpenings.tpl` are **0 bytes**), `import/MassImportStep{1,2,3,4}.tpl`, `import/ImportCommits.tpl` and `reports/NewDataItems.tpl`. The careers `Blank*` templates could still be chosen through the DB setting `useCATSTemplate` (`CareersUI.php:962-967`).

---

## 2. Key user journeys

"Loads" counts top-level document loads, including iframe loads and redirects. AJAX calls are listed separately.

### J1. Recruiter adds a candidate and uploads a resume

| Step | User action | Loads | Evidence |
|---|---|---|---|
| 1 | Click the **Candidates** tab | 1 (list grid) | `CandidatesUI.php:360`, `Candidates.tpl` |
| 2 | Click the **Add Candidate** sub-tab | 1 | `CandidatesUI.php:75`, `Add.tpl` |
| 3 | Choose a resume file (`documentFile`); optionally click **Upload** to extract its text into the textarea | +1 POST round trip (optional) | `Add.tpl:88-89`, `js/candidateParser.js:6-15`, `CandidatesUI.php:935-996` |
| 4 | Optionally click the "transfer" arrow to parse text into fields | +1 POST round trip (optional; needs the external SOAP service, see UX-017) | `Add.tpl:196`, `CandidatesUI.php:1005-1026` |
| 5 | Type fields; AJAX duplicate check runs on e-mail/phone `onchange` | 0 (AJAX ×n) | `Add.tpl:163,190`, `ajax/getCandidateIdByEmail.php` |
| 6 | Click **Add Candidate** | POST + 302 → Show = 2 | `CandidatesUI.php:1034-1060` |

**Totals:** 4 loads and about 3 decisive clicks minimum; up to 6 loads with Upload and Parse. The selected file is attached on submit even if Upload was not clicked (`CandidatesUI.php:2764-2800`).

**Friction:**
- The parser UI is always shown because `isParsingEnabled()` always returns `true` (UX-017).
- There is a 30+ field single form with duplicate `tabindex` values (UX-010).
- The date picker is fixed to `MM-DD-YY` (`Add.tpl:419`).
- A **Reset** button sits next to submit (`Add.tpl:496-497`).
- Server-side validation failures render a "fatal error" page and the input is lost (UX-013).
- After a parse reload, phone pre-checks call the *e-mail* checker (`Add.tpl:513-520`).
- The "Disabled Veteran" option has no `value` (`Add.tpl:365`) (UX-004).

### J2. Recruiter creates a job order

| Step | Action | Loads | Evidence |
|---|---|---|---|
| 1 | Click the **Job Orders** tab | 1 | `JobOrders.tpl` |
| 2 | Click the **Add Job Order** sub-tab; an iframe modal opens | 1 (iframe) | `JobOrdersUI.php:86`, `AddModalPopup.tpl` |
| 3 | Choose "Empty" or "Copy existing" (a `<select>` of **all** job orders, `JobOrdersUI.php:538`), then **Create Job Order**; the parent navigates | 1 | `AddModalPopup.tpl:20-35` (`parentGoToURL`) |
| 4 | Fill the form: company via AJAX autocomplete (`suggest.js`), contacts loaded for that company (AJAX), description in CKEditor | 0 (AJAX ×n) | `joborders/Add.tpl:53-75,272,311` |
| 5 | Click **Add Job Order** | POST + 302 → Show = 2 | `JobOrdersUI.php:683-760` |

**Totals:** 5 loads.

**Friction:**
- The company must already exist. The client check reads "You must select a company." (`modules/joborders/validator.js:166`) and the server rejects the request with "Invalid company ID." (`JobOrdersUI.php:686-688`). There is no inline "create company", so the user must leave the form.
- The two-step modal-then-page flow adds a load for the common "Empty" case.
- "Copy existing" is a flat `<select>` that will not scale.
- The `suggest.js` "Enter or Tab" handler uses key code **48** (the `0` key) instead of 9 (`js/suggest.js:472-477`). Typing "0" in a company name (e.g. "Studio 100") triggers selection or verification.

### J3. Add candidate to pipeline → change status → log activity → schedule event

| Step | Action | Loads | Evidence |
|---|---|---|---|
| 1 | Open the candidate (Show) | 1 | `candidates/Show.tpl` |
| 2 | Click "Add This Candidate to Job Order"; modal 750×390 | 1 (iframe) | `Show.tpl:560-561` |
| 3 | Search by title or company (POST), or click "Show Recently Modified Job Orders" | 1 | `ConsiderSearchModal.tpl:9-40,100` |
| 4 | Click a job title; this is a GET `a=addToPipeline` that changes state | 1 | `ConsiderSearchModal.tpl:75,125`, `CandidatesUI.php:1561-1655` |
| 5 | **Close**; the whole parent page reloads | 1 | `ConsiderSearchModal.tpl:155` (`parentHidePopWinRefresh`), `subModal.js:252-258` |
| 6 | In the pipeline row click the edit icon ("Log an Activity / Change Status"); modal 600×480 | 1 (iframe) | `Show.tpl:529-531` |
| 7 | Tick **Change Status** and pick a status. The activity note auto-fills "Status change: …" and the "Send E-Mail Notification" box is auto-ticked if the status triggers e-mail. Tick **Schedule Event**, then set type, date (MM-DD-YY), time (12 h AM/PM), duration, title and reminder | 0 | `AddActivityChangeStatusModal.tpl:76-242`, `js/activity.js:645-720` |
| 8 | **Save** | 1 (POST, confirmation shown in modal) | `AddActivityChangeStatusModal.tpl:245,257-291` |
| 9 | **Close**; the parent reloads | 1 | `AddActivityChangeStatusModal.tpl:289` (`parentGoToURL`) |

**Totals:** about 8 loads and 12+ clicks for one candidate.

**What works (worth preserving):** status change, activity, e-mail notification and event are combined in one dialog, and "Placed" updates openings (`CandidatesUI.php:3089-3100`).

**Friction:**
- There is no bulk status change and no board view.
- The candidate-notification e-mail is **pre-checked** whenever the status triggers e-mail (`activity.js:697-701`), which risks unintended candidate e-mails.
- The reminder checkbox can never hide its area; both branches set `display=''` (`AddActivityChangeStatusModal.tpl:217`).
- Hour, minute and AM/PM selects have no labels (`:162-177`).
- The success text echoes `activityDescription` unescaped (`:271`).
- A shortcut exists from the job order side: "Add Candidate to This Job Order Pipeline" (820×550) can create a *new* candidate in the modal and auto-add it to the pipeline (`JobOrdersUI.php:1387-1416`).

### J4. Candidate applies via the careers portal (default "CATS 2.0" template, registration off)

| Step | Action | Loads | Evidence |
|---|---|---|---|
| 1 | Open `/careers/` (or `index.php?m=careers`) | 1 | `careers/index.php`, `CareersUI.php:71-190` |
| 2 | Click "current opening positions" → `p=showAll` (one unpaginated table of all public jobs) | 1 | `CareersUI.php:151-179,1115-1187` |
| 3 | Click a title → `p=showJob` | 1 | `CareersUI.php:793-853` |
| 4 | Click the "Apply to Position" **image** → `p=applyToJob` | 1 | DB template `db/cats_schema.sql:437` |
| 5 | Optionally choose a resume and click **Upload** (full POST, text pasted back) | +1 | `CareersUI.php:494-519`, `js/careerPortalApply.js:26-30` |
| 6 | Optionally click "Populate Fields ->" (parse, full POST; external SOAP) | +1 | `CareersUI.php:521-540` |
| 7 | Click the submit **image**; `applyValidate()` shows `alert()` popups | 1 | `db/cats_schema.sql:439` (`<img … onclick="if (applyValidate()) {document.applyToJobForm.submit();}">`), `CareersUI.php:973-1112` |
| 8 | If the job has a questionnaire, answer it and click **Continue** | +1 | `CareersUI.php:715-792` |
| 9 | "Thanks" page | (same as 7/8) | `CareersUI.php:760-764` |

**Totals:** minimum 5 loads, up to 8. With registration enabled, `p=candidateRegistration` adds one step (`CareersUI.php:359-411`).

**Friction:** listed under UX-001, UX-005, UX-011 and UX-012. In short: no keyword search or filters, fixed 940 px layout, image buttons, asterisked fields that are not validated, and alert-based errors.

### J5. Reporting (EEO, submission, placement)

| Report | Path | Loads | Limits | Evidence |
|---|---|---|---|---|
| Submission / Placement | Reports tab → click "New Submissions" or "New Placements" in one of 9 fixed-period tables (Today … To Date) | 1 + 1 (opens `target="_blank"`) | Fixed periods only. No filter by recruiter, client or job; no CSV/PDF export; no custom range. The report footer uses server time (`// FIXME: LOCAL TIME ZONE!`) | `Reports.tpl:20-375`, `ReportsUI.php:203-330`, `TemplateUtility.php:860` |
| EEO | Reports → "EEO Reports" sub-tab (hidden unless EEO is enabled) → choose period (All / Last Month / Last Week) and status (All / Placed / Not in Consideration) → **Preview Report** | 2 + 4 chart images | Only 3 periods; chart `<img>` without `alt` (`EEOReport.tpl:64,96,130,141`); numbers are also listed as text (good); radio groups labelled with `for="siteName"`/`for="companyName"` (copy-paste, `EEOReport.tpl:30,41`) | `EEOReport.tpl:20-160` |
| Job Order report | Job order Show → "Generate Report" → customize → PDF | 2 | Per job only | `joborders/Show.tpl:356`, `JobOrderReport.tpl:20-22` |

The dashboard has "Hiring Overview" (a server-rendered image whose Weekly/Monthly/Yearly toggles are `<area>` hot-spots, `Home.tpl:58-66`), "Recent Hires" and "Important Candidates" (AJAX grid).

---

## 3. Layout technology and browser support

| Aspect | Fact | Evidence |
|---|---|---|
| Doctype | XHTML 1.0 Transitional for app pages and careers | `TemplateUtility.php:1178-1180`, `careers/Blank.tpl:1-3` |
| Viewport meta | **None** anywhere (grep of `.tpl/.php/.css/.js` outside vendor finds 0) | none |
| Media queries | **0** `@media` rules across `main.css`, `careersPage.css` and all `modules/*/*.css` | none |
| Tables for layout | 428 `<table>` in templates versus 275 `<th>`. Page headers use a table with `<td width="3%">` icon and `<h2>` in 85 templates. The logo is in a table (`TemplateUtility.php:106`) | e.g. `candidates/Add.tpl:14-21` |
| Inline styles | 1,065 `style="…"` attributes; 1,324 `align=`; 299 `border="0"`; 1,071 `&nbsp;` used for spacing; 24 `<style>` blocks inside templates | counts via grep |
| Fixed widths | 359 inline `width: NNNpx` (158× `width: 150px`), 124 `width="NNN"` attributes; tab bar `width: 80em` (`main.css:148`); 81 px image tabs (`main.css:163-192`); top-right block 650 px (`main.css:325`); DataGrid computes absolute pixel table widths (`DataGrid.php:2640`) | none |
| IE hacks | `<!--[if IE]> ie.css` and the non-standard `<![if !IE]> not-ie.css` (`TemplateUtility.php:1215-1216`); the two files differ only in `.dataGridResizeAreaInnerDiv` width (`ie.css`/`not-ie.css`); `filter: alpha(opacity=40)` (`main.css:940`); IE `height: auto !important; height: 400px` idiom (`main.css:104-106`); CSS `expression()` in the DataGrid inline style (`DataGrid.php:1592`); IE6 select hiding (`subModal.js:108-112`); ActiveX XHR fallback (`js/lib.js:260-300`); 18 `attachEvent`/`document.all`/`MSIE`/`ActiveXObject` references in first-party JS | none |
| Browser detection | `lib/BrowserDetection.php` is used only to label login-activity rows (`LoginActivity.php:186`, `SettingsUI.php:1021`), not to adapt the UI | none |
| Firefox toolbar | `modules/toolbar/install.tpl:61-82` calls `InstallTrigger.install()` for `modules/toolbar/catstoolbar.xpi`, which **does not exist** in the repo. `settings/getFirefoxModal.tpl` promotes "Firefox 2". Both are dead | none |

---

## 4. JavaScript stack

| Item | Fact | Evidence |
|---|---|---|
| jQuery | **v1.3.2 (2009-02-19)** loaded on every page (`TemplateUtility.php:1194`) but used at only about 7 call sites in 3 files: `js/emailHandler.js:183,198`, `settings/tags.tpl:38-68`, `settings/EmailTemplates.tpl:22`. External knowledge: publicly known advisories affect jQuery < 1.9 / < 3.5 (CVE-2012-6708, CVE-2015-9251, CVE-2019-11358, CVE-2020-11022/11023) | `js/jquery-1.3.2.min.js:1-10` |
| Other libraries | `subModal.js` v1.1 (subimage.com, IE6 era), Sweet Titles (2005), sorttable (Stuart Langridge), `calendarDateInput.js` (`with(document){writeln(...)}`, 39 `writeln`), custom `suggest.js`, `dataGrid.js` (drag, resize, AJAX pager), `quickAction.js` (prototype objects) | file headers |
| Globals | 344 top-level `function` declarations in `js/*.js`. Duplicate global names across files include `checkAddForm`, `checkEditForm`, `trackTableHighlight`, `buttonMouseOver` and `findNode`. `CATSIndexName` is a global set inline (`TemplateUtility.php:1195`) | grep |
| Inline JS | 340 `onclick=`, 66 `onchange=`, 28 `onsubmit=`, 108 `javascript:` URLs and 109 `<script>` blocks in templates. PHP also generates JS strings, e.g. DataGrid filter functions and quick-action constructors (`QuickActionMenu.php` `getHtml()`) | grep |
| AJAX | Custom `AJAX_getXMLHttpObject`/`AJAX_POST`/`AJAX_callCATSFunction` post form-encoded data to `ajax.php` (`js/lib.js:256-420`). Responses are XML (`ajax.php:65-66`, `lib/AJAXInterface.php:47-52`) or HTML fragments injected with `innerHTML` and executed by `execJS()` via `eval` (`js/pipeline.js:99-101`, `js/lib.js:852-880`). The session cookie is appended to POST bodies (`lib.js:332-338`). There are 21 endpoints in `ajax/` | none |
| State | DataGrid state (sort, page, filter, columns) is JSON in the URL (`parameters<instance>` in `DataGrid.php:2409-2411`) or in the session; column prefs are persisted PHP-serialized in `user.column_preferences` (`db/cats_schema.sql:1085`) | none |
| Build / modules | No `package.json`, bundler or module system. No minification except jQuery. `lib/JavaScriptCompressor.php` exists but is unused (grep finds no callers). Cache busting uses `?v=<version>` (`TemplateUtility.php:1169-1176`). CSS is loaded by `@import` inside `<style>` (`:1211`), which serialises downloads | none |
| Weight | The core payload on every page (5 JS files + `main.css`) is **165,131 bytes** uncompressed. `js/lib.js` is re-included by 4 templates (e.g. `candidates/Show.tpl:7-9`, `joborders/Add.tpl:2`) | `ls -l` |

---

## 5. Rich text (CKEditor)

- The dependency is `ckeditor/ckeditor ^4.16.0`, locked at **4.25.1** (`composer.json:19`, `composer.lock:10-11`). It is served from `vendor/ckeditor/ckeditor/ckeditor.js`. `vendor/` is not committed, so the page breaks without `composer install`.
- The wrapper `js/ckeditor-manager.js:2-21` calls `CKEDITOR.replace(nodeId, {extraPlugins:'font'})` and adjusts output formatting.
- It is used in only three places: job order **Description** (`joborders/Add.tpl:311`, `Edit.tpl:337`) and candidate **Send E-Mail** body (`candidates/SendEmail.tpl:137`, `js/emailHandler.js:158-199`).
- The inconsistencies are covered in UX-018: job order "Internal Notes" carries `class="ckEditor"` but is never initialised (`joborders/Add.tpl:281`), and e-mail templates are plain `<textarea>`s with `%TOKEN%` insert buttons (`settings/EmailTemplates.tpl:63,142-175`) while the send-mail body is rich text.
- On the careers side, the job description HTML is injected verbatim into the careers page (`CareersUI.php:831`).

---

## 6. Accessibility (WCAG 2.1 AA) assessment

| WCAG criterion | Status | Evidence |
|---|---|---|
| 1.1.1 Non-text content | **Fail** | 327 `<img>` in templates: **108 without `alt`**, 61 with `alt=""`, including functional images. PHP-generated markup in `modules/` and `lib/` has 75 `<img>`, 20 without `alt`. Icon-only links: pipeline actions `edit.gif alt="" title="Log an Activity…"` (`candidates/Show.tpl:530`), DataGrid column chooser `tab_add.gif alt=""` (`DataGrid.php:1623`), sort icons `alt=""` (`:1766-1774`), quick-action trigger `downward.gif` with no alt (`QuickActionMenu.php` `getHtml`), list-modal icons (9 missing, `lists/QuickActionAddToListModal.tpl`). Empty-state CTAs are background images in `div`s containing only `&nbsp;` (`candidates/Candidates.tpl:7-10,151-158`). EEO chart images have no alt (`EEOReport.tpl:64,96,130,141`) |
| 1.3.1 Info and relationships | **Fail** | 0 `scope=`, 0 `<caption>`, 0 `<fieldset>`/`<legend>`, 0 `<h1>` (page titles are `<h2>`, 88 occurrences). Radio groups have no grouping (`EEOReport.tpl:33-46`, questionnaire). Layout tables are not marked presentational. Invalid nesting: `<form>` directly inside `<table>` (`candidates/ConsiderSearchModal.tpl:8-9`), stray `</td>` (`candidates/Show.tpl:60`) |
| 1.3.5 Identify input purpose | Fail | 0 `autocomplete` tokens; the candidate form sets `autocomplete="off"` (`Add.tpl:46`) |
| 1.4.1 Use of colour | **Fail** | Hot, submitted and placed records are distinguished only by link colour (`main.css:857-902`). Validation marks the label red only (`js/lib.js:841-846`, `modules/candidates/validator.js:147-227`). The active sub-tab is shown by colour only (`TemplateUtility.php:685`). Links have `text-decoration: none` (`main.css:79-83`) |
| 1.4.3 Contrast (minimum) | **Fail** | Computed ratios (text on background): sub-tab links `#f4f4f4` on `#6c94eb` = **2.70:1** (`main.css:225`); active sub-tab `#cccccc` on `#6c94eb` = **1.85:1**; placed links `#00ff00` on white = **1.37:1** (`main.css:891,902`); submitted `#ff6c00` = **2.84:1** (`:875,881`); MRU title `#ff6600` = **2.94:1** (`:297`); "(INACTIVE)" orange = **1.97:1** (`candidates/Show.tpl:71`); disabled-looking labels `#aaa` on `#eee` = **2.00:1** (`AddActivityChangeStatusModal.tpl:82`); hot red `#ff0000` = 4.00:1. 17 inline font sizes include 8 px/9 px/8 pt text (footer at 8 pt, `main.css:364-384`) |
| 1.4.4 / 1.4.10 Resize, reflow | **Fail** | Pixel font sizes throughout; no reflow (UX-001) |
| 2.1.1 Keyboard | **Fail** | DataGrid column **reorder** and **resize** are `onmousedown` only (`DataGrid.php:1719,1840`). The star-rating control is an `<area>` image map with `alt=""` and hover semantics (`TemplateUtility.php:891-950`). The modal close control is an `<img onclick>` (`TemplateUtility.php:548-549`). The careers submit and apply buttons are `<img onclick>` (`db/cats_schema.sql:437,439`). `EmailTemplates.tpl:91` uses `<select onclick="showTemplate(...)">`, which does not fire on keyboard selection |
| 2.1.2 / 2.4.3 Focus order and trap | **Fail** | Modals do not move focus into the dialog, have no Esc handling and no `role="dialog"`. The "tab trap" is `document.onkeypress = keyDownHandler` returning false on Tab (`subModal.js:94,262-268`); `keypress` is unreliable for Tab in modern browsers. Parent tab indexes are rewritten to -1 (`subModal.js:275-320`). Positive `tabindex` is used 101 times, with duplicates (`Add.tpl:145,154` both `2`; `:255,266` both `13`) |
| 2.4.1 Bypass blocks | Fail | No skip link; a large header precedes the content on every page |
| 2.4.4 / 4.1.2 Name, role, value | **Fail** | **0 ARIA attributes and 0 `role=`** in the codebase. The quick-search input has no label (`TemplateUtility.php:292-296`). Autocomplete lists (`suggest.js`) and quick-action menus are plain `div`s |
| 3.1.1 Language of page | Partial | App pages have `lang="en"` (`TemplateUtility.php:1180`). Login (`login/Login.tpl:4`), careers (`careers/Blank.tpl:3`) and `ResumeView.tpl:2` do not |
| 3.3.1 / 3.3.3 Error identification and suggestion | **Fail** | `alert("Form Error:\n"…)` (`candidates/validator.js:20`); server errors go to a generic "A fatal error has occurred." page (`candidates/Error.tpl:17-21`) |
| 2.4.7 Focus visible | Pass (default) | No `outline:none` found; only `.inputbox:focus` restyles (`main.css:490`) |

---

## 7. Internationalization and localization

- **No i18n framework.** There is no `gettext`, `setlocale`, `.po`/`.mo`, `Intl` or `NumberFormatter` in first-party code. `Template::_()` is only `htmlspecialchars` despite its gettext-like name (`lib/Template.php:51-54`). About 2,491 literal English text nodes appear in templates, plus about 30 English `alert()` strings in JS. Tab labels are PHP literals, and status names and activity types are English DB rows or hard-coded `<option>`s (`AddActivityChangeStatusModal.tpl:124-130`; statuses `candidate_joborder_status`, e.g. `db/cats_schema.sql` values 100…800).
- **What "Localization" does.** `settings/Localization.tpl` offers exactly (a) a time zone as an **integer GMT offset** from a fixed list (`constants.php:197+`, `TemplateUtility.php:212-250`), so DST and IANA zones are not handled, and (b) a date format **MM-DD-YYYY (US) or DD-MM-YYYY (UK)** (`Localization.tpl`). Saving forces logout ("Save (And Logout)"). The help text claims it affects "numbers", but no number option exists.
- **Dates:**
  - Every `DateInput()` picker is hard-coded to `'MM-DD-YY'`, with 10 call sites in templates plus `lib/ExtraFields.php:680,870`, and English month names (`js/calendarDateInput.js:26`).
  - Two-digit years are used broadly: 28 SQL `DATE_FORMAT` calls use `%m-%d-%y`.
  - DMY support works by rewriting the SQL text: `str_replace('%m-%d-%y','%d-%m-%y',$query)` (`lib/DatabaseConnection.php:703-709`). Controllers convert DMY→MDY for pickers (`CandidatesUI.php:1139-1149`, `JobOrdersUI.php:875-880`).
  - Client-side date sorting assumes MM-DD (`js/sorttable.js:291-306`), so date columns on DMY sites sort wrongly (inference from the code).
  - Scheduling is 12-hour AM/PM only (`AddActivityChangeStatusModal.tpl:162-177`).
- **Addresses, phones, names:**
  - Fields are State and ZIP, with a US-only ZIP lookup (`zipcodes.zipcode mediumint`, `db/cats_schema.sql:1178-1179`; `lib/ZipLookup.php:8`).
  - Phone numbers are normalised to NANP `xxx-xxx-xxxx` (`lib/StringUtility.php:128-160`).
  - There is **no country field** on candidate, company, contact or job order; only `user.country` exists (`db/cats_schema.sql:1097`).
  - Names are first/middle/last, displayed as "First L." (`StringUtility.php:492-520`).
- **Currency:** salary, rate and pay are free-text `varchar`s (`db/cats_schema.sql:192-193,806-807`); there is no currency code.
- **EEO:** categories are the US EEO-1 set, hard-coded in both forms (`candidates/Add.tpl:346-350`, `CareersUI.php:621-650`).

---

## 8. Visual design consistency

- **Colours:** 44 distinct hex colours in `main.css` and 50 in template inline styles. Examples: the primary blue `#6c94eb`, plus `#4172E3` and `#E6EEFF`/`#E7EEFF` for empty states; status colours pure red, `#00ff00` and orange.
- **Fonts:** three families: Arial and Tahoma in body and table text, Verdana in headings/notes (`main.css:42-471`), and Helvetica in careers. Font sizes mix px and pt, with 17 distinct inline values from 4 px to 36 px.
- **Icons and images:**
  - There are 300 raster images (187 GIF, 92 JPG, 20 PNG): no SVG, one `background-position` (no sprites) and no hi-DPI assets.
  - Tabs are JPG backgrounds (`images/tabs/*.jpg`, `main.css:163-192`).
  - Empty states and CTAs are text baked into JPGs (`images/nodata/*`, used in `candidates/Candidates.tpl:7-10,136`, `joborders/JobOrders.tpl:6-7,107`, `companies/Companies.tpl:6-7`, `activity/ActivityDataGrid.tpl:44`, `home/Home.tpl:50,79`).
  - The careers buttons are images of text (`careers_submit.gif`, `careers_apply.gif`).
- **Duplication:**
  - **18 error templates** (root `Error.tpl`, 12 module `Error.tpl`, 5 `ErrorModal.tpl`) differ only in title and icon (e.g. `diff candidates/Error.tpl companies/Error.tpl` shows 3 changed lines).
  - The icon+`<h2>` header table is copy-pasted in 85 templates.
  - `insertAtCursor()` is re-implemented inline in `CareerPortalTemplateEdit.tpl:19-40` and `EmailTemplates.tpl:40-60`.
- **Three sorting mechanisms:**
  - server-side DataGrid with full reload;
  - client-side `sorttable.js` (31 `class="sortable"` tables on Show pages);
  - AJAX sort in the job-order pipeline (`ajax/getPipelineJobOrder.php:208-243`).
- **Three popup mechanisms** (§1.4).
- **Inconsistent controls:** "Only My Candidates" is plain text next to its checkbox (`Candidates.tpl:34-35`) whereas "Only My Job Orders" is a `<label>` (`JobOrders.tpl:47`).
- **Branding drift:** the app footer says "Powered by OpenCATS" (`TemplateUtility.php:831`) while the report footer says "Powered by CATS" linking catsone.com (`:875`). 37 `catsone.com` links remain in UI code, including upsells in `settings/Professional.tpl` and `candidates/Add.tpl:125`.

---

## 9. Career portal UX

**How it works:**
- The portal is served via `careers/index.php` (sets `$careerPage`, `chdir('..')`, includes `index.php`) or `index.php?m=careers`.
- Templates are **stored in the database**: defaults in `career_portal_template` ("Blank Page", "CATS 2.0") and site copies in `career_portal_template_site` (`lib/CareerPortal.php:146-330`, `db/cats_schema.sql:410-447`).
- Each template is a set of named HTML fragments (Header, Footer, Left, CSS, Content - Main / Search Results / Job Details / Apply for Position / Questionnaire / Thanks / Candidate Registration / Candidate Profile).
- Fragments are filled with **pseudo-tags** such as `<input-firstName>`, `<title>`, `<a-applyToJob>` and `<searchResultsTable>`, substituted with `str_replace`/`preg_replace` (`CareersUI.php:151-180,359-411,578-713,818-853,935-958`).
- The page shell is `modules/careers/Blank.tpl`, which echoes `template['CSS']`, `['Header']`, `['Content']` and `['Footer']` raw (`Blank.tpl:18-32`).

**Branding and customization:**
- Admins edit raw HTML and CSS in 920 px textareas, with helper buttons that insert tokens (`settings/CareerPortalTemplateEdit.tpl:61-187`). There is a full-screen preview (`CareerPortalSettings.tpl:246`, `PreviewPage.tpl`).
- There is no logo upload, colour picker or font setting; images must be referenced by URL.
- The "Insert Site Name" button contains a JS syntax error: `onclick="insertAtCursor(insertAtCursor(document.getElementById('edittext…'), "<siteName>");"` has one unclosed parenthesis (`CareerPortalTemplateEdit.tpl:76`), so it does nothing.
- The condition `$setting == 'Body - Search Results'` never matches the real key `'Content - Search Results'` (`:70`).

**Mobile:** there is no viewport meta (`Blank.tpl:4-23`). The default CSS fixes `#container` at 940 px and `table.sortable` at 940 px, and uses two 450×470 px apply boxes (`db/cats_schema.sql:434`). The orphan `careersPage.css` (930 px) is not referenced anywhere.

**Application form** (default template, `db/cats_schema.sql:439`):
- Labels point to non-existent ids: `for="homePhone"` vs input `phoneHome`, `mobilePhone` vs `phoneCell`, `workPhone` vs `phone`, `bestTime` vs `bestTimeToCall`, `mailingAddress` vs an address `<textarea>` with **no id**, `cityProvince` vs `city`, `stateCountry` vs `state`, `zipPostal` vs `zip` (the generated ids are at `CareersUI.php:582-600`).
- Labels mark "*Best time to call", "*City/Province", "*State/Country", "*Zip/Postal Code" and "*Key Skills" as required, but the template uses `<input-city>` etc. **without** the `req` suffix. `_makeApplyValidator` therefore validates only first name, last name and e-mail (`CareersUI.php:973-1112`).
- The label reads "Email Adddress" (typo).
- The submit control is an `<img>` with `onclick`.
- Validation uses sequential `alert()`s.
- The extra-notes limit is enforced by an `onkeyup` alert (`CareersUI.php:617`).

**Questionnaire flow:**
- After submit, if the job has a questionnaire, all POST data is re-emitted as hidden fields and `CareerPortalQuestionnaireShow.tpl` is rendered (`CareersUI.php:737-792,1605-1627`).
- The first radio answer is **pre-checked** (`CareerPortalQuestionnaireShow.tpl:56-59`).
- Answers have no `<label>` (0 labels in the file), all radios in a group share one `id`, question text is output raw (`:47`), and there is no progress indication.

**Search and browse:**
- `p=search` and `p=searchResults` are **empty branches** (`CareersUI.php:180-182,856-858`), and `Openings.tpl`/`SearchOpenings.tpl` are 0 bytes.
- `p=showAll` renders one unpaginated table of all public jobs (`CareersUI.php:1115-1187`) with client-side sort only.

**Error and edge pages:**
- When the portal is disabled the page is `die('<html><body><!-- Job Board Disabled --></body></html>')`, i.e. blank (`CareersUI.php:103`).
- "Position no longer available" pages are bare HTML with a 1.5 s JS redirect (`:192,266,555,720,756,815`).

**Relative asset paths:**
- `Blank.tpl:7` always loads `../js/careerPortalApply.js`, `Blank.tpl:40` always loads `../images/CATS-powered.gif`, and `careerPortalApply.js:55+` preloads `../images/…`.
- These are correct only for the `/careers/` entry point. When OpenCATS is installed in a sub-directory and reached via `index.php?m=careers`, they resolve outside the install (inference).

**Registration / "login":** see UX-007. Registration is off by default (`lib/CareerPortal.php:79`).

---

## 10. Perceived performance

- **List views** reload the full page for every sort, page change, filter, rows-per-page change, column add/remove/reorder and alphabet jump. Every list DataGrid sets `ajaxMode = false`: `modules/{candidates,joborders,companies,contacts,activity,lists}/dataGrids.php`, e.g. `candidates/dataGrids.php:15,81`. Only the two dashboard grids use AJAX (`home/dataGrids.php:51,212`). The link builder is `DataGrid.php:2391-2424`.
- **Page size** defaults to 15 (`DataGrid.php:453-464`; `maxResults => 15` in 8 controllers); job orders use 50. The selector offers 15/30/50/100 (`DataGrid.php:740`). The pipeline shows 15 per user by default (`user.pipeline_entries_per_page DEFAULT '15'`, `db/cats_schema.sql:1084`).
- **Modals:** closing most modals reloads the whole parent (`parentGoToURL` ×10, `parentHidePopWinRefresh` ×7; `subModal.js:252-258` does `window.location.href = sURL + ' '`).
- **Resume load and parse** each cost a full POST round trip in both the recruiter and careers forms ("giving the illusion of AJAX", `CareersUI.php:467`).
- **Quick Search** returns four unpaginated result sets (no `LIMIT` in `QuickSearch::candidates/companies/contacts/jobOrders`, `lib/Search.php:1329-1620`).
- **Caching:** every HTML response sends `Expires: 1997` (`index.php:78-79`). Static assets are version-busted, but CSS loads through serial `@import`, and 5 scripts load synchronously in `<head>` on every page, including `calendarDateInput.js` (40 KB) and jQuery (57 KB).
- **Footer:** every page shows "Server Response Time: x seconds" (`TemplateUtility.php:832`).

---

## 11. Detailed findings

### UX-001 — No responsive/mobile support (app and careers portal)
- **Severity:** HIGH
- **Finding:** No page declares a viewport, and there are zero `@media` rules in any stylesheet. The layout relies on fixed pixel widths, image tabs and absolutely positioned header lists. The public careers portal, the page most likely to be visited on phones, is fixed at 940 px.
- **Evidence:** `lib/TemplateUtility.php:1178-1216` (head has no viewport); `main.css:148` `width: 80em;` and `:163-192` (81 px tabs); `:325` 650 px top-right; 359 inline `width:NNNpx` in templates; `DataGrid.php:2640` `getTableWidth()`; `careers/Blank.tpl:4-23` (no viewport); `db/cats_schema.sql:434` `#container { … width: 940px; }`, `div.applyBoxLeft, div.applyBoxRight { width: 450px; height: 470px; …}`.
- **Impact:** Candidates on mobile face pinch-zoom forms and 16:9 layouts, which lowers applications. Recruiters cannot use the app on tablets or phones. It is also a WCAG 1.4.10 failure.
- **Recommendation:** Short term, ship a responsive default careers template: add a viewport meta to `modules/careers/Blank.tpl`, a fluid `#container`, stacked apply boxes, and real `<button type="submit">`. Keep token compatibility so custom templates in `career_portal_template_site` keep working. For the app, see §12 (a new layout shell replacing `printHeaderBlock`/`printTabs` table and absolute markup).

### UX-002 — Bulk "Selected" actions lose the selection (serialize vs JSON mismatch)
- **Severity:** HIGH
- **Finding:** The server decodes DataGrid bulk-action links as JSON, but the links are generated partly with PHP `serialize()` and partly with a JS PHP-serializer.
  - The non-popup items "Export" and "Send E-Mail" put `urlencode(serialize($params))` into `p` (`DataGrid.php:1988,1993`). The job-order pipeline export does the same (`joborders/Show.tpl:405`).
  - All "Selected" links pass the checked IDs as `serializeArray(exportArray…)`, which produces PHP-serialized text such as `a:2:{i:0;s:1:"5";…}` (`js/lib.js:231-243`; `DataGrid.php:1983,1999,2042,2062`).
  - The receivers decode JSON only: `$parameters = json_decode($_REQUEST['p'], true)` (`DataGrid.php:301`) and `$parameters['exportIDs'] = json_decode(urldecode($parameters['exportIDs']), true)` (`:259`, under the always-true `if ($index = 'exportIDs')`, `:257`).
  - `json_decode` of serialized text returns `NULL` (verified with `php -r`). A non-array `exportIDs` is silently unset (`DataGrid.php:486-488`).
- **Evidence:** as above. The consumers are `ExportUI.php:137`, `ListsUI.php:261,304`, `CandidatesUI.php:1449,3381` (add-to-job-order and e-mail).
- **Impact (inference from static trace; confirm at runtime):**
  - "Export → Selected/All" and "Send E-Mail → Selected" build the grid from `NULL` parameters, so they act on the default first page (15 rows) instead of the user's selection.
  - The popup actions "Add To List → Selected" and "Add To Job Order → Selected" drop the ID filter while `maxResults=100000000`, so they may act on **every row matching the current view**.
  - Consequences are wrong exports, e-mails composed to the wrong candidates, and lists or pipelines polluted in bulk.
- **Recommendation:** Standardise on JSON. Replace `serialize()` at `DataGrid.php:1988,1993` and `joborders/Show.tpl:405` with `json_encode`. Replace `serializeArray()` with `JSON.stringify` in the generated `onclick`s. Fix `if ($index = …)`. Add a Behat scenario for "select 2 rows → Export/Add to list" (current features cover only security, `test/features/*.feature`).

### UX-003 — Encode-on-input corrupts user text progressively
- **Severity:** HIGH
- **Finding:** Edit handlers store HTML-escaped values, and templates escape again on output.
  - `getSanitisedInput()` returns `htmlspecialchars($v, ENT_QUOTES)` (`lib/UserInterface.php:388-395`). It is used 162 times across controllers, including candidate **edit** (`CandidatesUI.php:1313-1327`) and careers apply (`CareersUI.php:1213-1232`).
  - Candidate **add** uses raw `getTrimmedInput()` (`CandidatesUI.php:2623`).
  - `Edit.tpl` re-escapes the stored value into the input (`candidates/Edit.tpl:40` `value="<?php $this->_($this->data['firstName']); ?>"`), and `Show.tpl:67` escapes it again.
- **Evidence:** as above.
- **Impact:** "O'Brien" saved once becomes `O&#039;Brien`, and the next save turns it into `O&amp;#039;Brien`. Records get worse with each edit. Search and duplicate detection on names or companies containing `' & < >` stop matching, and exports carry entities.
- **Recommendation:** Store raw text and escape only on output (`Template::_`). Remove `getSanitisedInput` from persistence paths. Write a one-off data migration that `html_entity_decode`s affected columns, detecting rows changed via edit paths. Add unit tests round-tripping `O'Brien & Co <x>`.

### UX-004 — EEO self-identification options are wrong
- **Severity:** HIGH
- **Finding:**
  - (a) The careers veteran select lists `<option value="1">Male</option>`, where value 1 means "No Veteran Status" (`CareersUI.php:636-642`; lookup `db/cats_schema.sql` `eeo_veteran_type` rows `(1,'No Veteran Status')…`).
  - (b) The recruiter form has `<option valie="3">Disabled Veteran</option>` (`candidates/Add.tpl:365`). The browser submits the text "Disabled Veteran", which `makeQueryInteger` casts to `0` (`lib/DatabaseConnection.php:546-549`; `lib/Candidates.php:103`).
  - (c) `<select … />` is self-closed in the generated careers EEO HTML (`CareersUI.php:621,630,636,644`).
- **Evidence:** as above.
- **Impact:** Applicants see a nonsensical option on a legally sensitive question. Disabled veterans entered by recruiters are recorded as "none". The EEO reports (`EEOReport.tpl`) are therefore wrong, which is a compliance risk for US users.
- **Recommendation:** Fix both option lists, generating them from the `eeo_*_type` tables instead of hard-coding them. Add a "Prefer not to say" option. Add a data-quality query to find `eeo_veteran_type_id=0` rows created via the recruiter add path.

### UX-005 — Core interactions are not keyboard or screen-reader operable
- **Severity:** HIGH
- **Finding:** Primary workflows depend on mouse-only or unnamed controls, and there are no ARIA semantics anywhere (0 `aria-`, 0 `role=`).
  - Modal close is an `<img onclick>` (`TemplateUtility.php:548-549`), with no Esc, no focus move and no dialog role (`subModal.js:132-177,262-268`).
  - DataGrid column reorder and resize use `onmousedown` (`DataGrid.php:1719,1840`).
  - The column chooser and sort icons have `alt=""` (`:1623,1766-1774`).
  - Row checkboxes have no labels (`:1880`).
  - The rating stars are image-map `<area … alt="">` (`TemplateUtility.php:918-932`).
  - Pipeline action icons are `alt=""`, relying on `title` (`candidates/Show.tpl:530`).
  - The careers apply and submit controls are `<img onclick>` (`db/cats_schema.sql:437,439`).
  - Empty-state CTAs contain only `&nbsp;` (`Candidates.tpl:151-158`).
- **Evidence:** as above; counts in §6.
- **Impact:** Keyboard and screen-reader users cannot manage columns, rate candidates or, on the careers portal, submit an application. This exposes the product to legal risk under the ADA/EAA (the EAA has applied in the EU since June 2025).
- **Recommendation:** Replace subModal with an accessible dialog (`<dialog>` or a component with `role="dialog"`, `aria-modal`, focus trap, Esc, and a returned-focus target). Convert icon links to `<button>`s with text or `aria-label`. Add a keyboard column manager (menu with move up/down). Make ratings a radio group. Update the default careers template to use `<button>`s.

### UX-006 — Output-encoding gaps in shared UI chrome (cross-ref SEC)
- **Severity:** HIGH
- **Finding:** Several shared printers echo user- or request-controlled strings without escaping:
  - the quick search box value is echoed raw from `$_GET['quickSearchFor']` (`TemplateUtility.php:295-296` ← `HomeUI.php:201-202,373`);
  - MRU entries print `data_item_text` raw (`lib/MRU.php:150-156`), fed from record names (`CandidatesUI.php:672-674`);
  - the page `<title>` is built from raw candidate names (`candidates/Show.tpl:7-9` → `TemplateUtility.php:1182`);
  - `printAdvancedSearch` echoes `$_GET['advancedSearchOn']` and `advancedSearchParser` pieces into HTML and JS (`TemplateUtility.php:318-340`);
  - candidate tag titles are echoed raw (`candidates/Candidates.tpl:71`);
  - the activity success message is echoed raw (`AddActivityChangeStatusModal.tpl:271`).
- **Evidence:** as above. Candidates created by recruiters store raw names (`CandidatesUI.php:2623`).
- **Impact:** Reflected XSS and stored XSS in the header of every page (the MRU appears on 80 templates). A malicious careers applicant name could execute in recruiter sessions (the careers path pre-encodes on input, UX-003; the recruiter path does not).
- **Recommendation:** Escape in the printers (`htmlspecialchars` for MRU text and the title; `json_encode` for JS contexts). Longer term, adopt an auto-escaping template engine (§12). The SEC audit should own the exploitability assessment.

### UX-007 — Weak careers "registered candidate" identity (cross-ref SEC)
- **Severity:** HIGH
- **Finding:** When `candidateRegistration` is enabled, a "returning candidate" is identified by e-mail plus the other `<input-*>` tags in the registration template. The default template has **last name + ZIP** (`db/cats_schema.sql:440`; matching logic `CareersUI.php:1635-1700`). "Remember me" is **checked by default** (`CareersUI.php:372,900`) and stores these fields in plaintext in a cookie for 2 weeks (`CareersUI.php:1728`; re-set on profile save `:354`; a 1-hour cookie is also set after applying, `:1277`). The profile page then shows the candidate's latest **resume text** and allows replacing it (`CareersUI.php:183-258,259-358`).
- **Evidence:** as above. The code comment itself calls the verification field the "equivalent of a 'password'" (`CareersUI.php:1700-1701`).
- **Impact:** Anyone who knows an applicant's e-mail, surname and postcode can view and alter their profile and resume. The PII sits in a plaintext cookie.
- **Recommendation:** Replace this with e-mail magic-link verification (or disable the feature) and stop persisting PII in cookies. Until then, document the risk in `CareerPortalSettings.tpl:52` next to the checkbox.

### UX-008 — UI chrome and list views fatal on PHP ≥ 8.0 (cross-ref DEP)
- **Severity:** HIGH (modernization blocker; not CRITICAL, because the supported target is PHP 7.2 per `docker/docker-compose.yml:14`)
- **Finding:** Legacy `implode($array, $glue)` argument order is used in `lib/MRU.php:159-161` and `lib/DataGrid.php:1292,1328-1329`. On PHP 8 this throws `TypeError` even for an empty array (verified with PHP 8.4.19).
- **Evidence:** as above. `printQuickSearch()` calls `getMRU()->getFormatted()` on 80 templates (`TemplateUtility.php:258`), and every list view calls `DataGrid::_getData()`.
- **Impact:** On PHP 8 essentially every authenticated page and every list fails, so no UI modernization can land on a current PHP until this is fixed.
- **Recommendation:** Swap the arguments (a 3-line fix). Add a PHP 8 CI job that loads the dashboard and one list.

### UX-009 — Contrast failures and colour-only meaning
- **Severity:** MEDIUM
- **Finding:** Several key text/background pairs fall below 4.5:1, down to 1.37:1. Record state (hot, submitted, placed, inactive) and validation errors are conveyed by colour alone. Links are not underlined.
- **Evidence:** §6 table (ratios computed from `main.css:225,297,875,891,902`, `TemplateUtility.php:685`, `candidates/Show.tpl:71`); `main.css:79-83` `text-decoration: none`; `js/lib.js:841-846` (red label only).
- **Impact:** Low-vision and colour-blind recruiters cannot see status or errors. Hot and placed are the primary triage signals.
- **Recommendation:** Adopt a token palette that passes AA (see §12). Add text or icon badges ("Hot", "Placed") next to the colours. Underline links in body text. Show inline error text next to fields.

### UX-010 — Form semantics defects
- **Severity:** MEDIUM
- **Finding:**
  - 509 visible form controls but only 257 `<label for>`, of which 32 point to ids absent from the same file (script `notes/labels.py`).
  - Several labels point to the *wrong* control: EEO Gender, Ethnic, Veteran and Disability all use `for="canRelocate"` and duplicate `id="canRelocateLabel"` (`candidates/Add.tpl:327,341,358,374,407`); "Best Time to Call" reuses `id="stateLabel" for="state"` (`:263`); Current and Desired Pay use `for="currentEmployer"` (`:437,446`).
  - Duplicate positive tabindex values (`:145,154` → `2`; `:255,266` → `13`).
  - A duplicate `enctype` attribute (`:46`).
  - Login has duplicate `id="login"` (`login/Login.tpl:30,112`).
  - The quick-search field is unlabelled (`TemplateUtility.php:292-296`).
- **Evidence:** as above.
- **Impact:** Screen readers announce the wrong labels, clicking a label focuses the wrong field, and tab order is erratic.
- **Recommendation:** Build a single form-row partial that generates `id`/`for` pairs. Remove positive `tabindex`. Lint templates with an HTML validator in CI.

### UX-011 — Careers questionnaire biases answers
- **Severity:** MEDIUM
- **Finding:** For radio questions the first answer is checked by default (`$nochecked` logic, `settings/CareerPortalQuestionnaireShow.tpl:56-59`). All radios in the group share one id, answers have no `<label>`, and question and answer text are echoed raw (`:47,59`).
- **Evidence:** as above.
- **Impact:** Applicants who skip a question silently submit the first answer. Screening data is skewed, and in knockout questionnaires applicants can be mis-screened.
- **Recommendation:** Render no default selection, with an explicit "required" option per question. Wrap each group in `<fieldset><legend>`, give each answer a `<label for>` with a unique id, and escape the text.

### UX-012 — Careers portal functional gaps
- **Severity:** MEDIUM
- **Finding:**
  - Search is unimplemented (`CareersUI.php:180-182,856-858` are empty branches; `modules/careers/Openings.tpl` and `SearchOpenings.tpl` are 0 bytes).
  - All public jobs render in one unpaginated table (`:1115-1187`).
  - Asterisked fields are not enforced (§9).
  - Validation uses `alert()`s.
  - Error states are blank or near-blank `die()` pages (`:103,192,555,720,756,815`).
  - The "Apply" and "Submit" controls are images.
  - Relative `../` asset paths assume the `/careers/` entry (`Blank.tpl:7,40`).
- **Evidence:** as above.
- **Impact:** A poor candidate experience lowers applicant conversion. The portal is effectively unusable for sites with many openings.
- **Recommendation:** Add keyword, location and department filters and pagination to `p=showAll` (reuse `JobOrders::getAll` with limits), properly templated error and "closed" pages, and inline validation that honours `req`. Mark the required fields with `req` in the default template, or remove the asterisks.

### UX-013 — Error-handling UX
- **Severity:** MEDIUM
- **Finding:**
  - Missing or invalid input on the server calls `CommonErrors::fatal(...)`, which renders "A fatal error has occurred." and loses the form (`candidates/Error.tpl:17-21`; e.g. `CandidatesUI.php` `_addCandidate` missing names → `COMMONERROR_MISSINGFIELDS`; `JobOrdersUI.php:686-729`).
  - Client validation uses `alert()` (132 in JS).
  - Destructive actions are GET links guarded by `confirm()`: candidate, company, contact and job order delete (`candidates/Show.tpl:432`, `companies/Show.tpl:227`, `contacts/Show.tpl:209`, `joborders/Show.tpl:330`).
  - E-mail template delete has **no confirm** (`settings/EmailTemplates.tpl:135`).
- **Evidence:** as above.
- **Impact:** Users lose work and get unhelpful messages. GET deletes are easy to trigger accidentally (and via CSRF, which SEC should assess).
- **Recommendation:** Re-render the form with field-level messages (one shared error partial replacing the 18 error templates). Use POST with confirmation dialogs for deletes. Provide undo or soft delete for records.

### UX-014 — Full-page-reload interaction model
- **Severity:** MEDIUM
- **Finding:** List grids are non-AJAX (`ajaxMode = false` in all module grids except home). Closing a modal reloads its parent (`subModal.js:252-258`, 17 call sites). Resume load and parse are form resubmits. The default page size is 15.
- **Evidence:** §10.
- **Impact:** High latency per action, loss of scroll position, and flicker. Pipeline work (J3) costs about 8 loads per candidate.
- **Recommendation:** Short term, turn on the existing `ajaxMode` for list grids and patch rows in place after modal saves instead of `parentGoToURL`. Long term, move to a JSON API with client-side rendering (§12).

### UX-015 — No i18n; US-centric locale model
- **Severity:** MEDIUM
- **Finding / Evidence:** §7. The main points are hard-coded English, no translation layer, `'MM-DD-YY'` pickers (`candidates/Add.tpl:419`, `joborders/Add.tpl:47`, `AddActivityChangeStatusModal.tpl:157`, `lib/ExtraFields.php:680,870`), DMY via SQL text replacement (`lib/DatabaseConnection.php:703-709`), MDY-only client sort (`js/sorttable.js:291-306`), GMT-offset time zones (`constants.php:197+`), State/ZIP/NANP fields, no country, and US-only EEO.
- **Impact:** Unusable for non-English teams. Date ambiguity causes data errors for DMY users. International recruiting cannot record country or currency.
- **Recommendation:** Introduce a translation catalog (e.g. Symfony Translation or gettext) keyed from templates. Use locale-aware formatting (PHP `Intl`), ISO-8601 storage with `<input type="date">`, 4-digit years, IANA time zones, and country and currency fields. Make EEO configurable per jurisdiction.

### UX-016 — Legacy JavaScript stack blocks modernization
- **Severity:** MEDIUM
- **Finding / Evidence:** §4. jQuery 1.3.2 is loaded globally (`TemplateUtility.php:1194`) for about 7 uses. There are 344 global functions with name collisions, 340 inline `onclick`s, a `document.write` date widget (`js/calendarDateInput.js:29,603`), `eval` in `execJS` and `DateInput` (`js/lib.js:852-880`, `calendarDateInput.js:566-569`), an ActiveX XHR fallback, and no build.
- **Impact:** A Content Security Policy is impossible without `unsafe-inline`/`unsafe-eval`. The library carries known CVEs. Refactoring is risky because global names collide.
- **Recommendation:** Remove jQuery by rewriting its 7 call sites with `fetch`/DOM APIs. Replace `DateInput` with `<input type="date">`. Move inline handlers to delegated listeners in ES modules built with a small bundler (esbuild or Vite). Keep `ajax.php` contracts initially.

### UX-017 — Resume parse UI always shown but backed by a third-party SOAP service
- **Severity:** MEDIUM
- **Finding:** `LicenseUtility::isParsingEnabled()` returns `true` on every path (`lib/License.php:687-705`), so the Add Candidate page always shows the parser UI (`candidates/Add.tpl:53-119,191-197`) and the careers "Populate Fields ->" button (`CareersUI.php:612`). Parsing calls a SOAP WSDL whose endpoint is `http://soap.resfly.com/parse.php` (`wsdl/parse.wsdl:78`; `lib/ParseUtility.php:55-90`), while `PARSING_ENABLED` is `false` (`config.php:51`).
- **Evidence:** as above.
- **Impact:** A primary control likely does nothing: SoapFault → `false` → no fields filled. If `ext-soap` is missing it may fatal (inference). If the endpoint is live, resume text would travel to a third party over plain HTTP.
- **Recommendation:** Make `isParsingEnabled()` honour `PARSING_ENABLED` and hide the parse controls otherwise. Replace parsing with a local or pluggable parser behind an explicit setting.

### UX-018 — Inconsistent rich-text editing (CKEditor 4)
- **Severity:** MEDIUM
- **Finding / Evidence:** §5. CKEditor 4.25.1 (`composer.lock:10-11`) is used only on job description and candidate e-mail. Internal Notes has `class="ckEditor"` but is never initialised (`joborders/Add.tpl:281`). E-mail templates are plain text (`settings/EmailTemplates.tpl:142`). Careers renders description HTML verbatim (`CareersUI.php:831`).
- **Impact:** Users get inconsistent formatting ability. Editor HTML reaches the public portal unsanitized (for SEC). CKEditor 4's open-source line ended upstream, and the licensing and behaviour of 4.2x "LTS" builds without a key are unverified (see Unknowns).
- **Recommendation:** Choose one maintained editor (CKEditor 5, TipTap or ProseMirror) or Markdown. Apply it to description, notes and e-mail templates. Sanitize HTML server-side (e.g. HTML Purifier) before storage and before careers output.

### UX-019 — No design system; heavy duplication
- **Severity:** MEDIUM
- **Finding / Evidence:** §8. 94 distinct hex colours (main.css and templates), 3 font families, 17 inline font sizes, 1,065 inline `style=`, 18 error templates, 85 duplicated header tables, 3 sorting and 3 popup mechanisms, and 300 raster icons with text-in-image empty states.
- **Impact:** Every UI change is a many-file edit. Inconsistencies confuse users. Hi-DPI rendering is blurry.
- **Recommendation:** Define design tokens (colour, spacing and type scale that pass AA), an SVG icon set, and shared partials: page header, form row, data table, dialog, error panel and empty state. Migrate templates to them incrementally.

### UX-020 — Dead or broken UI remnants
- **Severity:** LOW
- **Finding / Evidence:**
  - 13 unreferenced templates (§1.6), including `HotList.tpl`, which calls a non-existent printer.
  - The Firefox toolbar installer points at a missing `catstoolbar.xpi` (`toolbar/install.tpl:62`); `getFirefoxModal.tpl` promotes "Firefox 2".
  - "Insert Site Name" has a syntax error (`CareerPortalTemplateEdit.tpl:76`).
  - The reminder toggle never hides (`AddActivityChangeStatusModal.tpl:217`).
  - `suggest.js` treats key code 48 ("0") as Enter/Tab (`js/suggest.js:473`).
  - The post-parse phone pre-check calls the e-mail checker (`candidates/Add.tpl:513-520`).
  - `a=forgotPassword` exists (`LoginUI.php:57-65`) but `Login.tpl` has no link to it.
  - 37 stale `catsone.com` links remain.
  - `lib/JavaScriptCompressor.php` is unused.
- **Impact:** Confusion and maintenance cost; the forgot-password flow is undiscoverable.
- **Recommendation:** Delete the dead templates and assets, fix the four one-line JS bugs, and add a "Forgot password?" link.

### UX-021 — Journey friction in core flows
- **Severity:** LOW
- **Finding / Evidence:**
  - Job orders require a pre-existing company (`JobOrdersUI.php:686-688`, `modules/joborders/validator.js:166`).
  - "Copy existing job order" loads *all* job orders into a `<select>` (`JobOrdersUI.php:538`, `AddModalPopup.tpl:27-31`).
  - The Add Job Order modal-then-page flow adds a hop (`AddModalPopup.tpl:35`).
  - Reset buttons sit next to primary submit (`candidates/Add.tpl:497`, `joborders/Add.tpl:306`).
  - Reports use fixed periods only, open new tabs and have no export (`Reports.tpl`).
  - The EEO report offers only 3 periods (`EEOReport.tpl:33-35`).
  - The status-change e-mail is pre-checked (`js/activity.js:697-701`).
  - There is no bulk status change on the pipeline (`ajax/getPipelineJobOrder.php` offers only select-and-export).
- **Impact:** Extra clicks and context switches, and a risk of accidental form resets and unintended e-mails.
- **Recommendation:** Add an inline "create company" (typeahead with "+ Add 'X'"), a searchable copy-from, a single-page job-order form, removal of Reset, report date ranges with CSV export, a default-off notification toggle, and bulk status change on the pipeline.

### UX-022 — Login and footer hygiene
- **Severity:** LOW
- **Finding / Evidence:**
  - `Login.tpl` lacks `lang` (`:4`), duplicates `id="login"` (`:30,112`) and renders the error message after the support-forum link, below the form (`:111-121`).
  - `?defaultlogin` triggers a JS function containing `'admin'`/`'cats'` (`:94-103`), which appears in page source for every visitor (cross-ref SEC).
  - Every page shows version and server response time (`TemplateUtility.php:830-832`).
  - The report footer brands "CATS / catsone.com" (`:875`).
- **Impact:** Error messages are easy to miss, the source discloses information, and branding is inconsistent.
- **Recommendation:** Move messages above the form with `role="alert"`, remove `defaultLogin()`, hide timing unless in debug, and unify the footer. The "Powered by OpenCATS" link must stay because the license requires it (`TemplateUtility.php:816-829`, `careers/Blank.tpl:38-41`).

---

## 12. Recommendations: preserve vs. redesign

### 12.1 Patterns worth preserving (validated in code)

| Pattern | Why keep it | Where it lives today |
|---|---|---|
| **One-dialog status workflow**: status change auto-writes the activity note, offers a templated candidate e-mail and an optional calendar event; "Placed" decrements openings | This is the product's core recruiter efficiency | `candidates/AddActivityChangeStatusModal.tpl`, `js/activity.js:645-720`, `CandidatesUI.php:3089-3100` |
| **Quick-action menus** on records (add to list, add to pipeline, merge duplicates) | Low-click access to common actions | `src/OpenCATS/UI/*QuickActionMenu.php`, `js/quickAction.js` |
| **MRU + global quick search** (name, e-mail and normalized phone across 4 entities) | Fast re-finding | `lib/MRU.php`, `lib/Search.php:1306+`, `TemplateUtility::printQuickSearch` |
| **Recent and saved searches** | Repeatable sourcing | `TemplateUtility::printSavedSearch` |
| **Duplicate detection at entry** (AJAX e-mail and phone checks, server `checkDuplicity`, merge UI) | Data quality | `candidates/Add.tpl:27-38,163,190`, `CandidatesUI.php` `_addCandidate`, `Merge.tpl`, `LinkDuplicity.tpl` |
| **Per-user column chooser with persisted widths and order** | Power-user customization | `DataGrid.php:1616-1660`, `ajax/setColumnWidth.php`, `user.column_preferences` |
| **"Add new candidate from the job order" auto-pipelines** | Removes a step | `JobOrdersUI.php:1387-1416` |
| **First-run wizard** (license, admin password change, e-mail, site name, users) | Onboarding | `LoginUI.php:299-370`, `modules/login/wizard/*.tpl` |
| **Token-based e-mail and career templates** (concept, not implementation) | Admin-editable content without code | `settings/EmailTemplates.tpl:156-175`, `career_portal_template*` |
| **License-required attribution** | Legal obligation | `TemplateUtility.php:816-831`, `careers/Blank.tpl:38-41` |

### 12.2 Redesign targets, tied to concrete code

1. **Pipeline board (kanban).** Replace the "Candidate in Job Order" table on `modules/joborders/Show.tpl:371-420` (AJAX table from `ajax/getPipelineJobOrder.php`) with columns per `candidate_joborder_status` (No Contact 100 … Placed 800, plus Not in Consideration 650 and Client Declined 700). Dropping a card opens the **same** status side-panel so the §12.1 side-effects are preserved. Add multi-select bulk status change and fix UX-002 first. Keep the table view as an accessible alternative, since drag-and-drop needs a keyboard equivalent.
2. **App shell and design system.** Replace the string-built chrome in `TemplateUtility::printHeader/printHeaderBlock/printTabs/printQuickSearch/printFooter` (`lib/TemplateUtility.php:64-852`) with a responsive shell template: viewport, semantic `<header>/<nav>/<main>`, skip link, AA tokens, SVG icons. Replace the 85 duplicated header tables with a `page-header` partial and the 18 error templates with one error partial. The access rules currently encoded in tab strings (`*al=`, `*hrmode=`, `*js=`) should become data (`lib/TemplateUtility.php:574-790`).
3. **Hybrid SPA, incrementally.** Keep server routing (`index.php?m=&a=`) but serve JSON for lists and pipelines. Replace `DataGrid` HTML/JS generation (`lib/DataGrid.php`, 2,649 lines; `js/dataGrid.js`) with a client grid that consumes the existing column definitions, and keep the column chooser and persisted prefs. Replace subModal (`js/submodal/subModal.js`) with an accessible dialog and in-place updates (no `parentGoToURL`).
4. **Template engine with auto-escaping.** Move `.tpl` (raw PHP includes, `lib/Template.php:98-127`) to Twig or Plates with auto-escape on. This eliminates UX-006-class bugs and lets UX-003 be fixed safely (store raw, escape on output).
5. **Careers portal v2.** Keep DB-stored templates and pseudo-tags for backward compatibility, but render them through the auto-escaping engine. Ship a responsive, WCAG-AA default template replacing "CATS 2.0" (`db/cats_schema.sql:430-441`). Implement search, filters and pagination (`CareersUI.php:180,856`), accessible questionnaire markup (UX-011), inline validation that honours `req`, correct EEO lists (UX-004), and magic-link candidate identity (UX-007). Add branding settings (logo upload, primary colour, font) so most sites never touch raw HTML in `CareerPortalTemplateEdit.tpl`.
6. **WCAG 2.1 AA program.** Work through §6 criterion by criterion. Suggested order: labels and names (UX-010 and quick search), dialogs and keyboard (UX-005), contrast and colour-only (UX-009), alt text (108 missing), headings and landmarks. Add axe-core checks to the Behat/Selenium suite (`test/behat.yml` already drives Selenium via `behat/mink-selenium2-driver` in `composer.json`).
7. **i18n foundation.** Extract strings, add `Intl` formatting and ISO dates, remove the SQL `str_replace` DMY hack (`lib/DatabaseConnection.php:703-709`), and add country and currency fields (§7).
8. **Frontend toolchain.** Drop jQuery 1.3.2, `document.write` and `eval`. Move to ES modules and a bundler. Move inline handlers out to allow a strict CSP (UX-016).

### 12.3 Quick wins (≤ 1 day each)

- Fix `implode` argument order (UX-008).
- Fix the `serialize`→`json_encode` mismatch and `if ($index = …)` (UX-002).
- Fix `valie`→`value` and the "Male"→"No Veteran Status" option (UX-004).
- Remove the default radio selection (UX-011).
- Escape MRU, title and quick-search output (UX-006).
- Add a viewport meta and fluid width to careers `Blank.tpl` (UX-001, partial).
- Fix `CareerPortalTemplateEdit.tpl:76`, `AddActivityChangeStatusModal.tpl:217`, `suggest.js:473` and `Add.tpl:513-520` (UX-020).
- Add the forgot-password link.
- Label the quick-search input.
- Default the notification e-mail checkbox to unchecked.

---

## Facts vs Assumptions

**Facts (verified in code or by command):**
- Everything cited with `file:line` above.
- Counts from grep and scripts: 136 templates; 0 viewport and 0 `@media`; 0 ARIA and `role`; 108/327 template images without `alt`; 340 `onclick`; 1,065 inline `style`; 344 global JS functions; 7 jQuery call sites; 165,131-byte core payload.
- Contrast ratios computed from literal CSS colours.
- `json_decode(serialize(...))` returns `NULL`, and legacy `implode` throws `TypeError` on PHP 8.4, both verified with `php -r`.
- `isParsingEnabled()` returns `true` on all paths.
- Template edits corrupt text: the double-escape path is a direct code trace (`getSanitisedInput` → DB → `$this->_()`).

**Assumptions / inferences (labelled in text):**
- UX-002 end-user effect: *which* rows are exported, e-mailed or added depends on runtime grid defaults; the loss of the selection is certain from the decode path.
- UX-017: whether `soap.resfly.com` still answers, and whether a missing `ext-soap` fatals in practice.
- UX-012: relative `../` asset paths break only for sub-directory installs reached via `index.php?m=careers`.
- DMY client-sort breakage assumes DMY sites display `%d-%m-%y` in sortable tables (from `DatabaseConnection.php:703-709`).
- The contrast for `p.note` over `images/bgBlue.gif` was approximated with `#E7EEFF`.
- jQuery CVE applicability and CKEditor 4 support status are external knowledge, not derived from the repo.

---

## Unknowns / Needs Further Investigation

1. **Runtime rendering.** No browser session was run. Visual layout, overflow at 1024/768/375 px, and modal sizing need screenshots, e.g. a Playwright pass over the J1–J5 flows.
2. **Bulk actions (UX-002).** Exercise Export, Send E-Mail, Add To List and Add To Job Order with "Selected" on candidates, companies, contacts and job orders to confirm which record set is affected.
3. **CKEditor 4.25.1.** Establish whether this build requires a license key and what it does without one (a warning banner, or refusal to load), and whether `vendor/` is present in production deployments.
4. **Resume parsing endpoint.** Reachability of `http://soap.resfly.com` and behaviour with and without `ext-soap`.
5. **Custom career templates.** Production sites may have customised `career_portal_template_site` rows. Any careers-rendering change must be regression-tested against real stored templates.
6. **Screen-reader and keyboard behaviour.** Behaviour of the iframe modals, `suggest.js` and the DataGrid with NVDA/JAWS/VoiceOver needs a manual test, and axe-core should be run automatically.
7. **Performance numbers.** Real timings for list pages, Quick Search (unpaginated) and dashboard graphs on realistic data volumes. Only structural observations were made here.
8. **Hooks.** `Hooks::get(...)` `eval` points in templates and TemplateUtility (e.g. `TEMPLATE_UTILITY_EVALUATE_TAB_VISIBLE`, `CANDIDATE_TEMPLATE_ABOVE_FREEFORM`) could alter the UI in deployments with plugins. Their runtime content is not in the repo.
9. **DMY and timezone correctness.** An end-to-end check that dates entered via MM-DD-YY pickers on DMY sites are stored and displayed correctly across calendar, pipelines and reports.
