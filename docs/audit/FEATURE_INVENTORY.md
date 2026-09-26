# OpenCATS — Feature Inventory Assessment

Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **What was inspected (read-only):** every `modules/*/*UI.php` `handleRequest()` switch (23 modules) and the handlers behind each `a=` action; the careers `p=` / `pa=` pages; `ajax.php` with all 21 `ajax/*.php` and 11 `modules/*/ajax/*.php` endpoints; the `careers/`, `rss/`, `xml/` shims; `index.php` routing; `QueueCLI.php`; `installwizard.php` and `modules/install`; backing `lib/` classes; `db/cats_schema.sql` seed rows; `config.php` and `constants.php`.
- **Commands (representative):** `awk '/function handleRequest/…' modules/*/*UI.php | grep "case '"` (action + gate extraction, saved to `scratchpad/audit-work/feat/cases_all.txt`); `grep -c getUserAccessLevel modules/*/*UI.php`; per-module `find … | xargs cat | wc -l` (LOC); orphan-template scan (`grep -rl <basename>` across `modules lib js careers index.php ajax.php`); `grep -rn "PIPELINE_STATUS_" …` (52 references in 9 files); `grep -rn "eval(Hooks::get" …` (278 sites); targeted `sed -n` reads of every cited line.
- **Every Phase 0 `file:line` citation was re-checked** against the current code. Corrections are listed in the change log.
- **Runtime evidence used:** Phase 0.5 baseline on PHP 7.2.16 / nginx 1.17.3 / MariaDB 10.7.8 — `docs/baseline/SMOKE_TEST.md` (steps #01–#94), `KNOWN_RUNTIME_ERRORS.md` (RT-01…RT-17), `CURRENT_UI_MAP.md`, `CURRENT_SYSTEM_SCREENSHOTS.md` (screenshots #78 and #83 were opened), `INSTALLATION.md`, `evidence/final-run/results.json`.
- **Not done:** no runtime testing in this phase; no requests to any running app; no security testing. The baseline used only the administrator account, so every access-level statement below is from code. Features the baseline did not exercise are marked *Not exercised* and their findings stay **Static**.
- **Ownership:** security specifics belong to `SECURITY_AUDIT.md` (SEC-xx); they are cross-referenced here and kept short. Modernization decisions are not made here; candidates are returned to the lead separately.

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| FEAT-001 | Pipeline is a fixed, hard-coded status list with no transition rules, no per-job workflow and no admin UI | HIGH | Runtime |
| FEAT-002 | Candidate merge re-points activities, attachments and events of any entity type and builds SQL from raw POST | CRITICAL | Static |
| FEAT-003 | Company delete cascades to contacts, job orders and pipelines; deletes erase status history that feeds all KPIs | HIGH | Static |
| FEAT-004 | "Private" calendar events are sent to every user and hidden only in the browser; no ownership check on edit/delete | HIGH | Static |
| FEAT-005 | Careers "candidate login" matches e-mail + last name + ZIP (no secret) and keeps them in a 2-week cookie | HIGH | Static |
| FEAT-006 | Coarse global access levels; several feature entry points check only "logged in" | HIGH | Static |
| FEAT-007 | Duplicate detection: exact first+last name, not site-scoped, manual add only; duplicates page orphaned | MEDIUM | Static |
| FEAT-008 | KPI counts come from mutable status-history rows; statistics filter has an `'OnHold'` typo and is applied inconsistently | MEDIUM | Static |
| FEAT-009 | Forgot-password is a PHP fatal error and was designed to e-mail the current password | MEDIUM | Runtime |
| FEAT-010 | Event reminders and queue tasks need an external cron that is not provisioned anywhere | MEDIUM | Static |
| FEAT-011 | Careers portal: search pages empty, "RSS Feed" button leads to a fatal page, blank until enabled, first site only | MEDIUM | Runtime |
| FEAT-012 | Obsolete third-party integrations still wired in (Resfly parsing over HTTP, catsone.com version check, Firefox toolbar) | MEDIUM | Static |
| FEAT-013 | Bulk candidate e-mail: SA-only, synchronous, no opt-out, unscoped recipient query; failures are fatal; e-mail log never shown | MEDIUM | Runtime |
| FEAT-014 | In-app test runner (`m=tests`) ships in production and is open to any logged-in user | MEDIUM | Static |
| FEAT-015 | Extension model is 278 `eval()`'d hook strings; only one module defines hooks | MEDIUM | Static |
| FEAT-016 | Localization limited to integer GMT offsets and MDY/DMY; UI English-only | MEDIUM | Static |
| FEAT-017 | Numerous half-implemented or stubbed features (see §10) | LOW | Static |
| FEAT-018 | Per-status "send e-mail" defaults from E-Mail Settings apply only in the job-order-side modal | LOW | Static |
| FEAT-019 | First-login "Setup Users" wizard refuses every add when licences = 0 (the default, meaning unlimited) | LOW | Static |
| FEAT-020 | Data-grid "Selected" actions lose the selection (serialize/JSON mismatch); e-mail compose addressed unselected candidates | HIGH | Runtime |
| FEAT-021 | Careers questionnaire actions overwrite candidate source/skills/notes/EEO and send a bogus "ownership change" e-mail | HIGH | Static |
| FEAT-022 | Job-order PDF report fails unless PHP can reach its own public URL; its figures and labels come from editable GET fields | MEDIUM | Runtime |
| FEAT-023 | Careers application drops the resume unless "Upload" is clicked, and shows the applicant a PHP fatal page when mail fails | HIGH | Runtime |
| FEAT-024 | Resume text extraction for PDF/DOC/HTML depends on binaries with placeholder paths; PDFs are not searchable by default | MEDIUM | Runtime |
| FEAT-025 | Job-order "openings available" counter drifts (double decrement, no restore on removal) and then blocks placements | MEDIUM | Static |

25 findings — 1 CRITICAL / 8 HIGH / 13 MEDIUM / 3 LOW · Runtime 8 / Static 17 / Partial 0 / Unverified 0 (no withdrawn or merged stubs).

## 1. Pipeline and job-order workflow

### FEAT-001 — Pipeline is a fixed, hard-coded status list with no transition rules, no per-job workflow and no admin UI
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: DB-014, §9*

- **Confirmed fact:** The 11 pipeline statuses exist in three places that must agree: seed rows, PHP constants and numeric literals in SQL. No screen adds, renames, reorders or disables a status. The status-change handler accepts any enabled status from any other; it only rejects unknown or unchanged values. No per-job-order or per-client workflow exists.
- **Evidence:**
  - `constants.php:120-130` (constants 0…800); seed `db/cats_schema.sql:267-277`; literal `100` on insert `lib/Pipelines.php:110`; literals `status_to = 400/800` in `lib/Statistics.php:102,133,241,312,351,422,559,591` and `lib/Dashboard.php:85`; `grep -rn PIPELINE_STATUS_` → 52 uses in 9 files.
  - Per-status e-mail toggles are hard-coded per constant (`modules/settings/SettingsUI.php:2042-2049`; 100 and 650 have no toggle).
  - Validation is "enabled and different" only: `CandidatesUI.php:3019-3023` (`findRowByColumnValue($statusRS…)`), `lib/Pipelines.php:324`.
  - Runtime: the status picker offered exactly the seeded list (#31 notes: `100=No Contact … 800=Placed`); a 100→200 change with activity note worked (#31, #32). None of the Settings pages opened in #56–#76 manages statuses.
- **Impact:** Client- or role-specific stages (phone screen, onsite, references, offer approval) cannot be modelled. Adding a status by SQL would silently break statistics, the dashboard and e-mail settings.
- **Severity:** HIGH — the core recruiting workflow cannot be adapted and its semantics are scattered across code.
- **Recommendation:** Treat the status set, allowed transitions and stage meanings ("counts as submission", "counts as hire", "consumes an opening") as data owned in one place, and derive statistics and notifications from those meanings instead of literals.
- **Unknown / needs further validation:** Whether any deployment has added statuses directly in SQL (needs production DB inspection).

### FEAT-018 — Per-status "send e-mail" defaults from E-Mail Settings apply only in the job-order-side modal
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: FEAT-001*

- **Confirmed fact:** The status-change modal pre-ticks "Send E-Mail Notification" from two different sources. Opened from a job order it uses the site's E-Mail Settings; opened from a candidate it uses the seed column `candidate_joborder_status.triggers_email`.
- **Evidence:** `modules/joborders/JobOrdersUI.php:1454-1466` (overrides `triggersEmail` from `candidateJoborderStatusSendsMessage`); `modules/candidates/CandidatesUI.php:1688` (`getStatusesForPicking()` without override); template consumes `statusTriggersEmailArray` (`modules/candidates/AddActivityChangeStatusModal.tpl:41`). Runtime #31 (candidate side) showed the box unchecked for 100→200, consistent with both sources for that status.
- **Impact:** Whether a candidate is e-mailed depends on which page the recruiter used.
- **Severity:** LOW — inconsistent default; the recruiter can still tick or untick the box.
- **Recommendation:** Read the per-status default from one configuration source on both entry points.
- **Unknown / needs further validation:** None.

### FEAT-025 — Job-order "openings available" counter drifts and then blocks placements
*Confirmation: **Static** · New in this edition · Related: FEAT-003, DB-003*

- **Confirmed fact:** `openings_available` is adjusted by the status-change handler, not by the pipeline data. (a) Choosing "Placed" decrements the counter even when the pipeline is already Placed and no status change happens. (b) Removing a Placed candidate from the pipeline, or deleting the candidate, does not give the opening back. (c) Before any Placed status is saved, `checkOpenings()` refuses the action with a fatal modal when the counter is 0 — also when the candidate is already Placed.
- **Evidence:**
  - Decrement is conditioned on `$statusID == PIPELINE_STATUS_PLACED` and `openingsAvailable > 0`, not on `$statusChanged` (`modules/candidates/CandidatesUI.php:3089-3093`); `setStatus()` returns early for an unchanged status (`lib/Pipelines.php:324-331`), so the counter moves without a history row.
  - Increment only on a real change away from 800 (`CandidatesUI.php:3096-3100`).
  - `Pipelines::remove()` deletes the row and history with no openings logic (`lib/Pipelines.php:139-189`); caller `CandidatesUI.php:1858-1880`.
  - Guard: `CandidatesUI.php:2932-2942` → `JobOrders::checkOpenings()` (`lib/JobOrders.php:827-860`).
  - The status select is enabled only after ticking "Change Status" (`AddActivityChangeStatusModal.tpl:81,85`), so case (a) needs that tick with "Placed" left selected.
- **Impact:** The "Openings" column (`lib/JobOrders.php:1157`) becomes wrong and a later legitimate placement can be refused with "This job order has been filled".
- **Severity:** MEDIUM — a counter that gates a core action can become inconsistent; there is a manual workaround (edit the job order).
- **Recommendation:** Derive available openings from the number of Placed pipelines (or adjust it only on a real transition, including removal and delete), and do not block an unchanged status.
- **Unknown / needs further validation:** How often recruiters hit these paths; needs production data (compare `openings_available` with counts of status-800 pipelines).

## 2. Candidate records and resumes

### FEAT-002 — Candidate merge re-points activities, attachments and events of any entity type and builds SQL from raw POST
*Confirmation: **Static** · Phase 0 severity: HIGH → now CRITICAL (matches the scale's "silent corruption of core recruiting data"; aligned with DB-001) · Related: DB-001, DB-010, SEC-005*

- **Confirmed fact:** `mergeDuplicates()` moves `activity`, `attachment` and `calendar_event` rows by `data_item_id` only, without `data_item_type`. A contact, company or job order whose numeric ID equals the discarded candidate's ID therefore loses its activities, files and events to the surviving candidate. The final candidate `UPDATE` is concatenated from POST values (e-mails) and DB values. The discarded candidate is deleted without a `site_id` filter. On MyISAM the steps are not atomic.
- **Evidence:** `lib/Candidates.php:1314-1326` (activity), `:1330-1342` (attachment), `:1346-1358` (calendar_event); string building `:1504-1520` (e.g. `"email1 = '" . $params['emails'][0]."'"`), fed by `modules/candidates/CandidatesUI.php:3540` (`$_POST['email']`) and `:3554`; delete `lib/Candidates.php:1579-1584`. Merge is gated at SA (`CandidatesUI.php:326-340`). Merge was not exercised in the baseline (`SMOKE_TEST.md` §4).
- **Impact:** Silent cross-entity data corruption that nobody would notice until a contact's or job order's history is missing; a name with an apostrophe can make the final `UPDATE` fail after rows were already moved (partial merge).
- **Severity:** CRITICAL — silent corruption of core recruiting data by a routine admin action.
- **Recommendation:** Disable merge until it filters by `(data_item_type, data_item_id)`, uses parameters, runs atomically and records an audit entry of what moved.
- **Unknown / needs further validation:** Extent of past damage in real databases (needs a production query for activities/attachments whose `data_item_type` does not match their owner).

### FEAT-007 — Duplicate detection: exact first+last name, not site-scoped, manual add only; duplicates page orphaned
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-012*

- **Confirmed fact:** Duplicates are flagged only on manual add (candidate form and the job-order "add candidate" modal, both via `_addCandidate()`), only when first **and** last name match exactly, plus one of: same middle name, any shared phone, any shared e-mail, or same city+address. The query has no `site_id`. Careers applications match an existing candidate by e-mail only; CSV import, mass import and the toolbar do no check. `Duplicates.tpl` and `getDuplicatesCount()` are unused.
- **Evidence:** `lib/Candidates.php:1136-1210` (`WHERE candidate.first_name = %s AND candidate.last_name = %s`, `:1152-1153`); only caller `modules/candidates/CandidatesUI.php:2663` (links at `:2704`); careers `modules/careers/CareersUI.php:1298` (`getIDByEmail`); orphan scan → `Duplicates.tpl` unreferenced; `getDuplicatesCount()` defined `lib/Candidates.php:1217`, no caller. Runtime: adding the same name + e-mail again showed the duplicate notice (#24) — the manual-add path works.
- **Impact:** Duplicates from typos, nicknames, imports and multi-site installs are not caught; in multi-site installs records of other sites can be linked.
- **Severity:** MEDIUM — data-quality degradation; the working manual path limits the damage.
- **Recommendation:** Run one duplicate check, scoped to the site and based on normalized e-mail/phone as well as names, on every ingestion path, and expose the pending duplicates as a work list.
- **Unknown / needs further validation:** Duplicate rate in real data (needs production statistics).

### FEAT-024 — Resume text extraction for PDF/DOC/HTML depends on binaries with placeholder paths; PDFs are not searchable by default
*Confirmation: **Runtime** · New in this edition · Related: RT-08, DEP-009, ARCH-018*

- **Confirmed fact:** Keyword search over resumes uses text extracted at upload. TXT, RTF, ODT and DOCX use built-in readers; PDF, DOC and HTML call `pdftotext`, `antiword` and `html2text` at the paths in `config.php`, which ship as Windows-style placeholders. With the shipped config a PDF is stored and downloadable but has no text, so resume search cannot find it; the user only sees a generic "unable to index" note.
- **Evidence:** `config.php:62,69,75,81` (`"\\path\\to\\antiword"`, `…pdftotext`, `…html2text`, `…unrtf`); `lib/DocumentToText.php:106-189` (tool vs built-in per type); `modules/candidates/CreateAttachmentModal.tpl:27` (message). Runtime: PDF upload → "unable to index", FPM stderr `sh: \path\to\pdftotext: not found`, `attachment.text = NULL` (#27, RT-08); keyword search for the PDF's term found nothing (#43, FAIL); TXT (#42) and DOCX (#44, #87) were found.
- **Impact:** Recruiters relying on resume keyword search silently miss every PDF (the most common resume format) unless an operator fixes the config and re-indexes.
- **Severity:** MEDIUM — a core search feature is degraded by a default; the fix is configuration, not code.
- **Recommendation:** Detect the converters at install/health-check time, surface "not indexed" per attachment, and offer re-indexing once tools are available.
- **Unknown / needs further validation:** DOC and HTML behaviour was not exercised (same mechanism, Static); the installer's re-index step (`modules/install/ajax/attachmentsReindex.php`) was not run.

## 3. Data lifecycle and access control

### FEAT-003 — Company delete cascades to contacts, job orders and pipelines; deletes erase status history that feeds all KPIs
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-004, DB-013, DB-016*

- **Confirmed fact:** Deleting a company deletes all its contacts, all its job orders (each with pipelines and status history), attachments and extra fields. Deleting a job order or a candidate, or removing one pipeline row, deletes the matching `candidate_joborder_status_history` rows — the only source for submission/placement counts, reports and "Recent Hires". Activities and calendar events of deleted records are left orphaned. There is no soft delete, undo or retention hold; the only guard is that the site's default company cannot be deleted.
- **Evidence:** `lib/Companies.php:214-305` (loops `$contacts->delete()` `:272`, `$jobOrders->delete()` `:279`, `$attachments->delete()` `:285`); `lib/JobOrders.php:303-310`; `lib/Candidates.php:394-404`; `lib/Pipelines.php:156-169`; guard `modules/companies/CompaniesUI.php:889-891`; `grep -rniE "soft ?delet|deleted_at|is_deleted"` → none. Deletes were not exercised in the baseline.
- **Impact:** One DELETE-level click can wipe a client's history and retroactively change historical KPIs.
- **Severity:** HIGH — data-integrity risk on core recruiting records with no recovery path except a backup.
- **Recommendation:** Make destructive actions reversible (soft delete or archive) and keep pipeline transitions as an append-only record that deletes do not rewrite.
- **Unknown / needs further validation:** None.

### FEAT-006 — Coarse global access levels; several feature entry points check only "logged in"
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-026, API-005, ARCH-007, API-020*

- **Confirmed fact:** Each user has one numeric level for everything (READ 100 < EDIT 200 < DELETE 300 < DEMO 350 < SA 400 < MULTI_SA 450 < ROOT 500), optionally refined by code-defined `ACL_SETUP` categories that are commented out in the shipped config. There is no record ownership or team scoping. Modules `activity`, `export`, `home`, `lists`, `reports` contain no `getUserAccessLevel()` call; several AJAX handlers check only the session. So a READ user can export any grid, edit or delete activities, manage lists, revert imports, add/rename/delete tags, send the test e-mail and view EEO reports. Careers questionnaire create/update needs only DEMO.
- **Evidence:** `grep -c getUserAccessLevel modules/*/*UI.php` → 0 for the five modules above; `ajax/editActivity.php:113`, `ajax/deleteActivity.php:47`, `ajax/testEmailSettings.php` (SecureAJAXInterface only); `modules/lists/ajax/*.php` (no level check); `modules/import/ImportUI.php:69-70` → `revert()` `:134-168` (no check); tag AJAX `modules/settings/SettingsUI.php:675-699` → `:130,170,182`; questionnaire `:516-538` (≥ DEMO); `config.php:346` (`class ACL_SETUP`, roles commented). The baseline used only the administrator (`SMOKE_TEST.md` §4).
- **Impact:** Least-privilege and data-segregation requirements cannot be met; mass PII export is unrestricted and unlogged.
- **Severity:** HIGH — sensitive data and audit trails are exposed to the lowest role; detail and reachability are owned by SEC-026.
- **Recommendation:** Enforce a documented permission for every action and AJAX handler in one place, and treat export, import revert and activity edits as privileged, logged operations.
- **Unknown / needs further validation:** Behaviour with non-admin roles needs a runtime check with READ/EDIT test users on an isolated instance.

### FEAT-004 — "Private" calendar events are sent to every user and hidden only in the browser; no ownership check on edit/delete
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-022*

- **Confirmed fact:** The month data feed returns every event of the site; the `public` flag and "Show Entries from Other Users" are applied only in JavaScript, and for non-SA users that checkbox is merely hidden. Editing requires EDIT and deleting requires DELETE, but neither checks who entered the event.
- **Evidence:** `lib/Calendar.php:136-142` (WHERE month, year, site only); `modules/calendar/CalendarUI.php:305-337` (`dynamicData` echoes the string); `modules/calendar/Calendar.js:961-963` (client-side skip); `modules/calendar/Calendar.tpl:16-19` (checkbox hidden for non-SA); edit `CalendarUI.php:502-510`, delete `:687-708` (level check, then act on `eventID`). Runtime: month view, add event and upcoming events worked as admin (#35–#37, #90); visibility between users was not tested.
- **Impact:** Interview or personal events marked private are readable by any logged-in user from the data feed, and any EDIT user can change another recruiter's events.
- **Severity:** HIGH — a privacy control that users rely on does not exist server-side.
- **Recommendation:** Filter private events on the server (owner or explicit admin override) and restrict edit/delete to the owner or an admin.
- **Unknown / needs further validation:** Needs a two-user runtime check on an isolated instance.

## 4. Careers portal

### FEAT-005 — Careers "candidate login" matches e-mail + last name + ZIP (no secret) and keeps them in a 2-week cookie
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-025, API-004, UX-007*

- **Confirmed fact:** When the portal setting `candidateRegistration` is on (default off), a visitor is treated as a known candidate if the posted template fields match a candidate row. The default "CATS 2.0" template asks for e-mail, last name and ZIP. The matched field values are stored in a cookie for two weeks and used to show and update the profile, including replacing the latest resume. A code comment notes the need for a password-like field.
- **Evidence:** `modules/careers/CareersUI.php:1635-1735` (comment `:1700-1701`); cookie `:1728` (also `:354`); profile `:183-257`; profile update `:259-357`; default off `lib/CareerPortal.php:79`; template row "Content - Candidate Registration" `db/cats_schema.sql:440`. Registration was not exercised (`SMOKE_TEST.md` §4).
- **Impact:** Anyone who knows an applicant's e-mail, surname and ZIP can read and overwrite that person's profile and resume.
- **Severity:** HIGH — personal-data exposure when a shipped option is enabled; reachability and abuse detail are owned by SEC-025.
- **Recommendation:** Keep the option disabled; a returning-candidate feature needs a real secret (e.g. a one-time link to a verified e-mail address) and must not keep PII in cookies.
- **Unknown / needs further validation:** How many deployments enable `candidateRegistration` (needs production settings data).

### FEAT-011 — Careers portal: search pages empty, "RSS Feed" button leads to a fatal page, blank until enabled, first site only
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-05, RT-16, UX-012, API-012, ARCH-013*

- **Confirmed fact:** (a) `p=search` and `p=searchResults` have empty branches, yet every page links to "search". (b) The "RSS Feed" shortcut on every careers page points to `../rss/`, which dies with a PHP fatal error. (c) The portal is disabled on a fresh install and then returns a blank page with only an HTML comment. (d) Careers, RSS and XML serve only `Site::getFirstSiteID()`. (e) Any visitor can switch the rendering template with `?templateName=`.
- **Evidence:**
  - `modules/careers/CareersUI.php:180-182`, `:856-858` (empty); `<a-LinkSearch>` rendered `:939`. Runtime: `?p=search` renders the header and shortcuts only, no form or results (screenshot #83).
  - `rss/index.php:37` uses `LEGACY_ROOT` without including `config.php` (compare `careers/index.php`, `xml/index.php`). Runtime: fatal on `/rss/` (#88, RT-05). The XML feed works (#89).
  - `CareersUI.php:98-103` (`die('<html><body><!-- Job Board Disabled --></body></html>')`); default `enabled => '0'` `lib/CareerPortal.php:77`. Runtime: RT-16; enabling in Settings fixed it (#75).
  - `CareersUI.php:79`, `modules/rss/RssUI.php:103`, `modules/xml/XmlUI.php:107` (`getFirstSiteID()`); template override `CareersUI.php:106-109`.
- **Impact:** Applicants cannot search jobs and hit a raw error page from a visible button; a new admin sees an empty site with no explanation; multi-site or multi-brand hosting is impossible.
- **Severity:** MEDIUM — the public job site works for browse/apply but has visible dead ends.
- **Recommendation:** Remove or implement the search pages, fix or remove the RSS link, show a clear "careers site disabled" message, and resolve the site from the request instead of "first site".
- **Unknown / needs further validation:** `index.php?m=rss` loads the same RSS module without the broken shim; it was not exercised and its absolute links (`../careers/`) may be wrong from that path.

### FEAT-021 — Careers questionnaire actions overwrite candidate source/skills/notes/EEO and send a bogus "ownership change" e-mail
*Confirmation: **Static** · New in this edition · Related: API-003, FEAT-023, RT-04*

- **Confirmed fact:** When the job order has a questionnaire, the apply handler calls `Questionnaire::doActions()`. It starts from empty `source`, `notes`, `keySkills`, `isHot = 0`, `canRelocate = 0`, `isActive = 1`, adds only what the chosen answers specify (the code comments say "Append to candidate …"), and writes the result with `Candidates::update()`. That call (a) replaces the candidate's existing source ("Online Careers Website" or a recruiter value), key skills and notes; (b) resets hot/relocate flags; (c) passes no EEO values, so the defaults `''` overwrite the EEO answers just captured on the form; (d) passes the candidate's own address as both the `$email` body and `$emailAddress` recipient, so `update()` sends "CATS Notification: Candidate Ownership Change" to the applicant. This happens before the resume is attached and before the pipeline row is created.
- **Evidence:** trigger `modules/careers/CareersUI.php:1341-1346`; defaults `lib/Questionnaire.php:589-592`; accumulation `:642-669`; update call `:682-710` (last two arguments `$cData['email1']`, no EEO arguments); signature `lib/Candidates.php:249-254` (`…$isHot, $email, $emailAddress, $gender = '', $race = '', $veteran = '', $disability = ''`); EEO written unconditionally `:319-322`; mail `:341-351`; resume/pipeline steps come later (`CareersUI.php:1351`, `:1414`). Questionnaires were not exercised in the baseline.
- **Impact:** Silent loss of recruiter-entered notes and skills for returning candidates, corrupted EEO data, a confusing e-mail to applicants, and — **INFERENCE** from RT-04 — when mail fails the uncaught mailer exception stops the application before resume, pipeline row and activity are saved.
- **Severity:** HIGH — data-integrity risk on candidate records and EEO data for every application to a job with a questionnaire.
- **Recommendation:** Make questionnaire actions merge into the existing values, leave EEO and ownership notification untouched, and run them after the application is fully stored.
- **Unknown / needs further validation:** Needs a runtime test on an isolated instance with a questionnaire attached to a public job order, with and without a working SMTP relay.

### FEAT-023 — Careers application drops the resume unless "Upload" is clicked, and shows the applicant a PHP fatal page when mail fails
*Confirmation: **Runtime** · New in this edition · Related: RT-12, RT-04, RT-15, API-011, UX-013*

- **Confirmed fact:** In the default apply form the visible file input is `resumeFile`; only the separate "Upload" button stores it into the hidden `file` field. The final submit reads only `$_FILES['file']` or `$_POST['file']`, so a chosen but not "uploaded" file is discarded without any message. After the candidate, pipeline row (status 100) and activity are saved, the applicant confirmation e-mail is sent synchronously; any mailer exception is uncaught and the applicant sees a raw PHP fatal page (HTTP 200) with a stack trace, and the recruiter notifications are not sent.
- **Evidence:** form `modules/careers/CareersUI.php:601-603`; submit reads `:1351`, `:1375`; e-mails `:1475/1518` (applicant), `:1529/1585-1595` (owner/recruiter). Runtime: #85 (file chosen, no Upload) → candidate and pipeline created, no attachment; #86 (Upload clicked) → attachment stored and searchable (#87); both applicants saw the fatal page (RT-04, RT-15; screenshot #86); `email_history` stayed empty.
- **Impact:** Applicant resumes are lost with no feedback, and every applicant sees an error page (with internal paths) whenever mail is misconfigured, so they may re-apply or give up.
- **Severity:** HIGH — the core inbound-application workflow loses data and fails visibly on the public site.
- **Recommendation:** Accept the file from the visible input on submit (or block submit until it is uploaded), and make notification failures non-fatal and invisible to the applicant while logging them for staff.
- **Unknown / needs further validation:** Behaviour with a working SMTP relay was not tested (no mail allowed in the baseline).

## 5. Communication, scheduling and reporting

### FEAT-013 — Bulk candidate e-mail: SA-only, synchronous, no opt-out, unscoped recipient query; failures are fatal; e-mail log never shown
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-04, RT-11, RT-07, API-011, PERF-005, FEAT-020*

- **Confirmed fact:** "Send E-Mail" from the candidate grid needs SA. Mail is sent synchronously, one SMTP send per recipient, with no unsubscribe, consent check or bounce handling. Template variables (`%CANDOWNER%`, `%CANDFIRSTNAME%`, `%CANDFULLNAME%` plus the global `%DATETIME% %SITENAME% %USERFULLNAME% %USERMAIL%`) are substituted only when a saved template is chosen; free text is sent as typed. The recipient lookup has no `site_id` filter. The mailer is built for `CATS_ADMIN_SITE` (180), so sent mail is logged under site 180. `email_history` is written but never read by any screen. A mailer exception is not caught.
- **Evidence:** gate `modules/candidates/CandidatesUI.php:297-307`; handler `:3305-3417`, loop and substitution `:3340-3365`, `new Mailer(CATS_ADMIN_SITE)` `:3320`, `constants.php:187`; recipient SQL `CandidatesUI.php:3398-3403`; per-recipient send `lib/Mailer.php:223-252`, log insert `:363-400`; `grep -rn email_history lib modules` → only `Mailer.php:368` and schema migrations. Runtime: compose page shows a PHP warning (#78, RT-11) and no rich-text editor (RT-07); "Send" ends in an uncaught PHPMailer fatal error page (#79, RT-04); `email_history` stayed empty.
- **Impact:** No compliant outreach, no per-candidate communication timeline, and a mail misconfiguration turns every send into an error page.
- **Severity:** MEDIUM — a useful feature that is fragile and lacks basic safeguards.
- **Recommendation:** Send candidate mail through a queued, logged path that records per-recipient outcome against the candidate, honours opt-out, and reports failures without a fatal page.
- **Unknown / needs further validation:** Delivery with a working SMTP relay (not allowed in the baseline).

### FEAT-020 — Data-grid "Selected" actions lose the selection (serialize/JSON mismatch); e-mail compose addressed unselected candidates
*Confirmation: **Runtime** · Phase 0 severity: LOW → now HIGH (runtime shows the action targeting unselected records; aligned with UX-002) · Related: UX-002, RT-11, FEAT-013*

- **Confirmed fact:** Grid bulk actions encode their parameters with PHP `serialize()` (non-popup items such as Export, Send E-Mail, Remove From This List, and the job-order pipeline export) and the checked IDs with a JavaScript PHP-serializer, but the receiver decodes both with `json_decode()`, which returns `NULL`. For non-popup items the grid is rebuilt from `NULL` parameters, so the action runs on the grid's default rows, not the selection. For popup items (Add To List, Add To Job Order) the parameters decode but the ID filter is dropped while `maxResults` is 100,000,000.
- **Evidence:**
  - `lib/DataGrid.php:1988,1993` (`urlencode(serialize(...))`); `modules/joborders/Show.tpl:405`; popup items use `json_encode` (`lib/DataGrid.php:2047,2054`); IDs via `serializeArray()` (`js/lib.js:231-242`).
  - Receiver: `lib/DataGrid.php:301` (`json_decode($_REQUEST['p'], true)`); `:248` (`foreach` over the result); `:257-259` (always-true `if ($index = 'exportIDs')` then `json_decode`); non-array `exportIDs` unset `:486-488`. Consumers: `modules/export/ExportUI.php:137`, `modules/lists/ListsUI.php:261,304`, `modules/candidates/CandidatesUI.php:1449,3381`.
  - Runtime (#78): the request carried a serialized `p` and `dynamicArgument…=a:1:{i:0;s:1:"2";}` (one candidate selected, `results.json`); the page printed `Invalid argument supplied for foreach() in lib/DataGrid.php on line 248` (RT-11), and the "To" box listed two recipients — both candidates that existed at that point (IDs 2 and 3, same test address; screenshot #78).
- **Impact:** Bulk e-mail can go to candidates who were not selected; exports, "remove from list", "add to list" and "add to job order" can act on the wrong or on all records.
- **Severity:** HIGH — core bulk workflows act on the wrong records, including outbound candidate e-mail.
- **Recommendation:** Use one encoding (JSON) for grid parameters and selected IDs end to end, and refuse to run a "Selected" action when the selection cannot be decoded.
- **Unknown / needs further validation:** Only Send E-Mail was exercised; Export, Add To List, Add To Job Order and Remove From List need a runtime check with two selected rows on an isolated instance.

### FEAT-010 — Event reminders and queue tasks need an external cron that is not provisioned anywhere
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-016, API-018, API-019, PERF-017*

- **Confirmed fact:** Reminder e-mails (task scheduled `* * * * *`) and exception clean-up run only when something invokes `QueueCLI.php` periodically. The repository ships no cron entry or worker, and the baseline did not run one. The "Send e-mail reminder" option in the calendar and status modals is hidden unless the queue ran in the last 5 minutes. On PHP ≥ 8.0, `QueueCLI.php` (like `index.php` and `ajax.php`) calls the removed `get_magic_quotes_runtime()`.
- **Evidence:** `QueueCLI.php:59,65`; `modules/calendar/tasks/Reminders.php:35-48` (schedule), registered `modules/calendar/tasks/tasks.php:39`, `modules/queue/tasks/tasks.php:39`; `lib/QueueProcessor.php:513-525` (5-minute test) via `lib/SystemUtility.php:85-88`; gating `modules/calendar/CalendarUI.php:256-262`, `Calendar.tpl:117`, `CandidatesUI.php:1747-1754`; `grep -rni cron docker*` → none; `index.php:93`, `ajax.php:50` (same removed call).
- **Impact:** Calendar reminders silently never send in a default deployment; operators get no signal that the scheduler is missing.
- **Severity:** MEDIUM — a promised feature is inert unless an undocumented operational step is taken.
- **Recommendation:** Document and provision the scheduler as part of the deployment, and show administrators whether it is running.
- **Unknown / needs further validation:** Whether production installs run `QueueCLI.php` from cron and deliver reminders (needs operator input or `queue` table data).

### FEAT-008 — KPI counts come from mutable status-history rows; statistics filter has an `'OnHold'` typo and is applied inconsistently
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: FEAT-003, DB-013, FEAT-022*

- **Confirmed fact:** Submissions and placements are `COUNT(*)` of status-history rows with `status_to = 400` / `800`, so moving a candidate into Submitted twice counts two submissions, and deletes erase history (FEAT-003). Submission counts are limited to job orders whose status is in the "statistics" list; placement counts are not. The default statistics list contains `'OnHold'`, while the status is `'On Hold'`, so On-Hold job orders are silently excluded from submission counts.
- **Evidence:** `lib/Statistics.php:90-114` (submissions, `joborder.status IN %s`), `:121-139` (placements, no job-order filter); `lib/JobOrderStatuses.php:55` (`'OnHold'`) vs `:43` (`'On Hold'`); used via `getStatisticsStatusSQL()` `lib/Statistics.php:108,265,375`; the commented override in `config.php:320` spells it correctly. Runtime: Reports tab, submission and placement reports rendered on the small test dataset (#49–#51), which does not exercise these cases.
- **Impact:** KPIs (submittals, placements, time-to-fill) are unreliable and not reproducible over time.
- **Severity:** MEDIUM — reporting is misleading but no source data is damaged by this finding itself.
- **Recommendation:** Count distinct transitions from an append-only record, apply the same job-order filter to all KPIs, and correct the status spelling.
- **Unknown / needs further validation:** Size of the distortion on real data (needs production data).

### FEAT-022 — Job-order PDF report fails unless PHP can reach its own public URL; its figures and labels come from editable GET fields
*Confirmation: **Runtime** · New in this edition (split out of Phase 0 FEAT-008) · Related: RT-09, SEC-017, DEP-006*

- **Confirmed fact:** The PDF generator fetches its own bar chart over HTTP from `http://<Host header>/index.php?m=graphs&a=jobOrderReportGraph…` and embeds it with FPDF. If the PHP process cannot reach that URL, the response is an HTML warning plus "FPDF error" instead of a PDF. Every text and number in the PDF (site, company, position, period, managers, notes, the four bar values) is taken from the editable GET form, not recomputed. The first bar is labelled "Screened" but carries the total pipeline count. A branch adds a hard-coded `cognizo` logo for one hosted customer.
- **Evidence:** `modules/reports/ReportsUI.php:422-439` (GET inputs), `:450-456` (`cognizo`), `:494-500` (self-fetch + `$pdf->Image`); `:382-385` (`dataSet1 = pipeline`); `modules/graphs/GraphsUI.php:177` (labels). Runtime: form rendered (#53); PDF request returned `Warning: getimagesize(http://localhost:8080/…) … FPDF error` (#54, RT-09); with an internally reachable `Host` the same request produced a valid PDF (`evidence/final-run/joborder-report-with-internal-host.pdf`); the graph image itself works (#55).
- **Impact:** Behind a proxy, container or TLS terminator the report fails outright; where it works, the "report" is whatever the user typed, so it is not an auditable figure.
- **Severity:** MEDIUM — a client-facing report is broken in common topologies and unreliable where it works.
- **Recommendation:** Render the chart in-process from the job order's own data and compute the figures server-side rather than accepting them from the form.
- **Unknown / needs further validation:** Whether single-host production installs succeed (INFERENCE in RT-09: yes when `http://<Host>/` resolves locally).

## 6. Authentication, onboarding and platform remnants

### FEAT-009 — Forgot-password is a PHP fatal error and was designed to e-mail the current password
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-03, RT-13, SEC-002, SEC-001*

- **Confirmed fact:** `onForgotPassword()` calls `Users::getPassword()`, which does not exist, and constants `PASSWORD_RESET_SUBJECT/BODY`, which are not defined (config defines `FORGOT_PASSWORD_*`, whose body says "Your current password is %s"). Passwords are stored as unsalted MD5, so the design could never work. The page is not linked from the login form.
- **Evidence:** `modules/login/LoginUI.php:448-480` (call `:455`); `config.php:170-174`; `grep -rn "function getPassword" lib` → only `lib/Session.php` (unrelated); `grep -n forgotPassword modules/login/Login.tpl` → none. Runtime: page loads with two missing images (#03, RT-13); submit → `Fatal error: Uncaught Error: Call to undefined method Users::getPassword()` with stack trace (#04, RT-03).
- **Impact:** No self-service recovery; administrators must reset passwords by hand; anyone who finds the URL gets a stack trace.
- **Severity:** MEDIUM — a secondary account feature is broken; its security aspects are owned by SEC-002.
- **Recommendation:** Remove the page, or replace it with a time-limited reset-token flow that never sends a password.
- **Unknown / needs further validation:** None.

### FEAT-019 — First-login "Setup Users" wizard refuses every add when licences = 0 (the default, meaning unlimited)
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: FEAT-017*

- **Confirmed fact:** `wizard_addUser()` refuses when `totalUsers >= userLicenses`. The seeded `site.user_licenses` is 0, which `Users::getLicenseData()` treats as "unlimited" everywhere else.
- **Evidence:** `modules/settings/SettingsUI.php:3042-3046`; `lib/Users.php:905-909` (`userLicenses == 0` → `unlimited = 1`); seed `db/cats_schema.sql:1017`. The first-run wizard did not appear in the baseline (install path replayed DB steps only, `INSTALLATION.md` §3).
- **Impact:** The onboarding step shows "You cannot add any more users with your license"; admins must use User Management, which works (#74).
- **Severity:** LOW — a first-run convenience fails; a working alternative exists.
- **Recommendation:** Apply the same "0 means unlimited" rule in the wizard, or drop seat licensing from onboarding.
- **Unknown / needs further validation:** Whether `isFirstTimeSetup()` is ever true after the current installer (needs a clean web-installer run).

### FEAT-012 — Obsolete third-party integrations still wired in (Resfly parsing over HTTP, catsone.com version check, Firefox toolbar)
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-009, API-010, SEC-010, SEC-017, DEP-010*

- **Confirmed fact:** (a) Resume parsing sends the resume text and the licence key by SOAP to `http://soap.resfly.com/parse.php` when a user clicks the parse button (add-candidate form, or "Populate Fields" on the public careers apply form). `LicenseUtility::isParsingEnabled()` returns `true` on every path, so `PARSING_ENABLED = false` in `config.php` does not stop the call. (b) The "new version check" posts site name, UID, active-user count, PHP version, server software, user agent and licence key to `http://www.catsone.com/catsnewversion.php`; it is **disabled in the seeded schema** and only runs if an admin enables it. (c) The Firefox toolbar back-end remains, including an unauthenticated action that returns `LICENSE_KEY` and an action that calls a missing method.
- **Evidence:** `wsdl/parse.wsdl:78`; `lib/ParseUtility.php:85-95`; `lib/License.php:687-706`; `config.php:51`; careers trigger `modules/careers/CareersUI.php:521-527`, button `:612`; `lib/NewVersionCheck.php:76` (honours `disable_version_check`), `:106-122` (payload); seed `db/cats_schema.sql:1044` (`disable_version_check` = 1); `modules/toolbar/ToolbarUI.php:46` (no auth), `:83` / `:282-285` (`getLicenseKey`), `:59-61` (`attemptLogin` → undefined method). None of these paths was exercised (`SMOKE_TEST.md` §4).
- **Impact:** Candidate PII can leave the system in clear text to a third party on a single click, including by an anonymous applicant; dead integrations confuse users and widen the public surface.
- **Severity:** MEDIUM — a real data-leak path exists but needs a click and a reachable service.
- **Recommendation:** Remove the toolbar back-end and the dead parsing call, or gate parsing behind an explicit, working configuration with an encrypted, contracted endpoint.
- **Unknown / needs further validation:** Whether `soap.resfly.com` and the catsone.com endpoint still answer (no outbound calls were made).

### FEAT-014 — In-app test runner (`m=tests`) ships in production and is open to any logged-in user
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-009, API-022*

- **Confirmed fact:** `m=tests` is discovered and loaded like any module, requires only authentication, and its web tests create users with DELETE level in the live database.
- **Evidence:** `modules/tests/TestsUI.php:65` (`_authenticationRequired = true`, no level check), actions `:84-92`; `modules/tests/testcases/WebTests.php:29-35` (`addUser(… ACCESS_LEVEL_DELETE …)`). Not exercised.
- **Impact:** A READ user can create accounts and data; noise in audit data.
- **Severity:** MEDIUM — privilege and data side effects from a developer tool in production.
- **Recommendation:** Exclude the test module from production deployments.
- **Unknown / needs further validation:** None.

### FEAT-015 — Extension model is 278 `eval()`'d hook strings; only one module defines hooks
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-004, SEC-011, API-017*

- **Confirmed fact:** 278 call sites run `if (!eval(Hooks::get('NAME'))) return;`. Hook code is PHP source kept in `$_SESSION`, collected from modules' `getHooks()`. In this repository only `SettingsUI::defineHooks()` returns hook code (career-portal user mode).
- **Evidence:** `grep -rn "eval(Hooks::get" --include=*.php --include=*.tpl .` (excluding `vendor`) → 278; `lib/Hooks.php`; `lib/ModuleUtility.php:276-296`; `modules/settings/SettingsUI.php:87-127`.
- **Impact:** There is no usable extension or integration point; the pattern blocks static analysis.
- **Severity:** MEDIUM — maintainability and extensibility cost.
- **Recommendation:** Replace string hooks with typed events or explicit extension interfaces.
- **Unknown / needs further validation:** Whether any deployment drops third-party modules that define hooks.

### FEAT-016 — Localization limited to integer GMT offsets and MDY/DMY; UI English-only
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-021, UX-015, DB-020*

- **Confirmed fact:** Time zone is an integer GMT offset (fractional offsets not supported, no DST), date format is MDY or DMY only, saving localization logs the user out, and all UI strings are hard-coded English.
- **Evidence:** `constants.php:196` (`// FIXME: Support fractional GMT offsets.`); `modules/settings/SettingsUI.php:2558-2583` (`setLocalization`, `logout()`); `lib/DateUtility.php`; Localization page loads (#64).
- **Impact:** Unsuitable for DST regions and non-English users; dates shift by an hour for half the year.
- **Severity:** MEDIUM — functional limitation for international use.
- **Recommendation:** Store a named time zone and format dates and times per locale.
- **Unknown / needs further validation:** None.

### FEAT-017 — Numerous half-implemented or stubbed features
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: UX-020, ARCH-019*

- **Confirmed fact:** 27 dead, stubbed or upsell-only items remain reachable or visible (list and evidence in §10).
- **Evidence:** §10 (file:line per item); runtime examples: empty careers search (#83), Passwords page checkbox without a form (#70).
- **Impact:** Dead UI paths confuse users and cost maintenance.
- **Severity:** LOW — hygiene; no data impact.
- **Recommendation:** Remove or finish each item; do not carry them forward unexamined.
- **Unknown / needs further validation:** Usage of dormant features (needs production data).

## 7. Module summary (reference)

Access levels (`constants.php:74-82`): READ 100 · EDIT 200 · DELETE 300 · DEMO 350 · SA 400 · MULTI_SA 450 · ROOT 500. In the tables below **AUTH** = any logged-in user (module requires login but the action checks no level); **none** = public, no login. "Actions" = live `case` labels in `handleRequest()` (commented-out ones in brackets). LOC = all `.php` in the module directory.

| Module | PHP LOC | `.tpl` (orphans) | Actions | Level checks in UI | Runtime status (baseline) |
|---|---|---|---|---|---|
| activity | 616 | 2 | 2 | 0 | Works (#07, #91) |
| attachments | 149 | 0 | 1 | 0 | Works (#29); files also reachable without session under nginx (RT-17) |
| calendar | 948 | 2 | 5 | 4 | Works (#35–#37, #90); reminders not exercised |
| candidates | 3,717 | 19 (2) | 23 (+1) | 32 | Works for list/add/edit/detail/pipeline/search (#21–#34, #39–#45); bulk e-mail broken (#78–#79) |
| careers | 1,794 | 6 (4) | default + 10 `p=` + 2 `pa=` | n/a (public) | Partly broken (#80–#87; RT-04, RT-12, RT-16; empty search #83) |
| companies | 1,375 | 8 | 9 | 11 | Works with errors (#09–#12, #47; RT-06) |
| contacts | 1,708 | 9 | 9 | 11 | Works (#13–#16, #48) |
| export | 155 | 0 | 2 | 0 | Not exercised (see FEAT-020) |
| graphs | 632 | 0 | 11 | 0 (4 actions public) | Works (#55; dashboard graph #06/#90; EEO graphs #52) |
| home | 793 | 4 | 4 (+1) | 0 | Works (#06, #38, #90); cosmetic RT-14 |
| import | 2,680 | 15 (1) | 13 | 7 | Page loads (#73); imports not exercised |
| install | 3,346 | 0 | 0 (installer is `installwizard.php` + `install:ui` AJAX) | n/a | Partly broken: demo-data path fatal (RT-01); empty path DB steps work (`INSTALLATION.md`); UI not exercised |
| joborders | 2,128 | 10 | 15 (+1) | 19 | Works with errors (#17–#20, #46; RT-07); PDF report broken (RT-09) |
| lists | 978 | 3 | 6 (+1) | 0 | Tab loads (#08); list actions not exercised |
| login | 511 | 12 (3 never used) | 4 | 0 (public) | Works (#01, #02, #05, #94); forgot password broken (#04, RT-03) |
| queue | 729 | 0 | 0 (empty switch) | 0 | Not exercised; no scheduler provisioned (FEAT-010) |
| reports | 725 | 8 (1) | 8 | 0 | Partly broken (#49–#53 work; #54 RT-09; RT-10) |
| rss | 159 | 0 | 1 | n/a (public) | Broken via `/rss/` (#88, RT-05) |
| settings | 4,149 | 32 | 51 | 62 | Works (#56–#76; add user #74; careers enable #75); test e-mail broken (#77, RT-04) |
| tests | 3,019 | 1 | 2 | 0 | Not exercised |
| toolbar | 288 | 2 (1) | 7 | 0 (public) | Not exercised |
| wizard | 188 | 1 | 1 | 0 (public) | Not exercised |
| xml | 331 | 0 (+3 `.xtpl`) | 1 | n/a (public) | Works (#89) |

Unreferenced library files (re-checked with `grep -rln <file>` across `modules lib ajax careers src index.php ajax.php`; `Profile.php` is referenced only by the equally unreferenced `Display.php`): `lib/ControlPanel.php` (1,573), `lib/Profile.php` (1,219), `lib/CBFUtility.php` (715), `lib/Display.php` (233), `lib/JavaScriptCompressor.php` (121), `lib/Encryption.php` (114) — 3,975 LOC (see ARCH-M01).

## 8. Feature inventory by module (reference)

Columns: **Entry** = `a=` (or other route) and `file:line` of the `case`; **Access** = minimum level enforced in code; **Runtime** = baseline status with step/RT; **Value** = Core / Useful / Niche / Obsolete.

### 8.1 Home / dashboard (`modules/home/HomeUI.php`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Dashboard | default `:83-86`, `home()` `:91` | Six widgets: "My Recent Calls", upcoming calls, upcoming events, Recent Hires, Hiring Overview graph, Important Candidates grid; also triggers the daily version check (off by default, FEAT-012) | `Dashboard`, `Calendar`, `DataGrid`; activity, calendar_event, candidate_joborder(_status_history) | AUTH | Works #06, #90 (RT-14 "NO D" watermark) | Core — daily landing page |
| "My Recent Calls" | `home:CallsDataGrid` (`modules/home/dataGrids.php:201`, `LIMIT 6` `:393`) | Last 6 activities of **any** type the user entered (label says calls) | activity, candidate, contact | AUTH | Works #90 | Useful — mislabelled |
| Recent Hires | `Dashboard::getPlacements()` (`lib/Dashboard.php:57-97`, literal 800 `:85`) | Last 10 transitions to Placed | candidate_joborder_status_history | AUTH | Works #06, #90 | Useful |
| Hiring Overview | `m=graphs&a=miniPlacementStatistics` (`Home.tpl:66`) | Weekly/monthly/yearly bars of submitted/interviewing/placed | status history; artichow JPEG | AUTH | Works #06, #90 | Useful |
| Important Candidates | `home:ImportantPipelineDashboard` (`dataGrids.php:40`, filter `:172-184`) | Pipelines at 400/500/600 on "Open" job orders (not user-scoped) | candidate_joborder, joborder | AUTH | Works #90 | Core — hot pipeline view |
| Quick search | `a=quickSearch` `:56` | LIKE search over candidates, companies, contacts, job orders together | `QuickSearch` (`lib/Search.php`) | AUTH | Works #38 | Core |
| Saved / recent searches | `a=addSavedSearch` `:69`, `a=deleteSavedSearch` `:63` | Pin or remove a recent search per user | saved_search | AUTH | Not exercised | Niche |
| `a=getAttachment` | `:75-81` commented (`FIXME: undefined function`) | — | — | — | Dead | Obsolete |

### 8.2 Candidates (`modules/candidates/CandidatesUI.php`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Candidate list | `a=listByView` / default `:360-366` | Configurable grid; Only My / Only Hot / tag filters; selection actions Add To List, Add To Job Order, Send E-Mail (SA), Export | `CandidatesDataGrid`, `DataGrid`; candidate, candidate_tag, attachment | READ | Works #21, #25; selection actions see FEAT-020 | Core |
| Add candidate | `a=add` `:96-107`, `_addCandidate()` `:2543` | Form incl. EEO, source list, extra fields, resume upload that fills a text box; live e-mail/phone lookup; duplicate check on save | `Candidates::add()`; candidate, candidate_duplicates, attachment, history | EDIT | Works #22, #23; duplicate notice #24 | Core |
| Edit candidate | `a=edit` `:112-123` | Update all fields; owner change can e-mail the new owner (`EMAIL_TEMPLATE_OWNERSHIPASSIGNCANDIDATE` `:1128,1266`); field history | `Candidates::update()` (`lib/Candidates.php:249`); history | EDIT | Works #33 | Core |
| Candidate detail | `a=show` `:88-93`, `show()` `:458` | Data, EEO block (if allowed), attachments, pipelines with rating, activities, upcoming events, lists, tags, questionnaires, duplicate banner, history link; MRU entry | many; mru | READ (admin-hidden rows MULTI_SA `:496`) | Works #26, #32 | Core |
| Delete candidate | `a=delete` `:128-133` | Hard delete incl. pipelines, status history, list entries, duplicates, attachments, extra fields (activities/events orphaned) | `lib/Candidates.php:363-456` | DELETE | Not exercised | Core need, unsafe (FEAT-003) |
| Search | `a=search` `:136-149` | By name, key skills, resume text (REGEXP or optional Sphinx), city, phone | `SearchCandidates`, `SearchByResumePager` | READ | Works #39–#42, #44–#45; PDFs not found #43 (FEAT-024) | Core |
| Resume viewer | `a=viewResume` `:154-161` | Extracted text with highlighting | attachment | READ | Works #34 | Useful |
| Attachments | `a=createAttachment` `:249-263`, `a=deleteAttachment` `:278-283` | Upload/delete files; text extracted for search | `AttachmentCreator`, `DocumentToText`; attachment | EDIT / DELETE | Works #27–#29 (PDF not indexed, RT-08) | Core |
| Profile image | `a=addEditImage` `:232-243` | Upload candidate photo | attachment | EDIT | Not exercised | Niche |
| Resume parsing (Resfly) | add-form postback `checkParsingFunctions()` `:893` | Sends text + licence key to a third-party SOAP service | `ParseUtility` | EDIT | Not exercised | Obsolete (FEAT-012) |
| Add to job order | `a=considerForJobSearch` `:168-175`, `a=addToPipeline` `:183-188` | Search job orders (title/company) and add one or many candidates at status 100 with an activity | `Pipelines::add()`; candidate_joborder, activity | EDIT | Works #30 | Core |
| Log activity / change status / schedule event | `a=addActivityChangeStatus` `:207-218`, `_addActivityChangeStatus()` `:2900` | One modal: status change, activity note, optional candidate e-mail, optional event/reminder | `Pipelines::setStatus()`, `ActivityEntries`, `Calendar`; see §9 | EDIT | Works #31, #32 (e-mail not sent) | Core |
| Remove from pipeline | `a=removeFromPipeline` `:224-229` | Deletes pipeline row and its whole status history | `Pipelines::remove()` | DELETE | Not exercised | Core need, unsafe (FEAT-003/025) |
| Tags | `a=addCandidateTags` `:191-202` | Assign parent/child tags | `Tags`; tag, candidate_tag | EDIT | Not exercised | Useful |
| Bulk e-mail | `a=emailCandidates` `:297-307` | Compose to selected candidates, optional template with per-candidate placeholders | `Mailer`, `EmailTemplates`; email_history | SA (compose and send); menu item shown only if mailer on (`dataGrids.php:63`) | Broken #78–#79 (RT-04, RT-11, FEAT-020) | Useful |
| Questionnaire view | `a=show_questionnaire` `:309-314` | Show careers questionnaire answers + resume text | career_portal_questionnaire_history | READ | Not exercised | Useful |
| Link duplicate | `a=linkDuplicate` `:317-322`, `a=addDuplicates` `:351-356` | Search and link a record as duplicate | candidate_duplicates | SA | Not exercised | Useful |
| Merge duplicates | `a=merge` `:326-331`, `a=mergeInfo` `:334-339` | Field chooser, then moves related rows and deletes the newer record | `Candidates::mergeDuplicates()` | SA | Not exercised | Core need, unsafe (FEAT-002) |
| Dismiss duplicate | `a=removeDuplicity` `:343-348` | Remove duplicate warning | candidate_duplicates | SA | Not exercised | Useful |
| Administrative hide | `a=administrativeHideShow` `:269-274` | Hide a candidate from site users | candidate.is_admin_hidden | MULTI_SA | Not exercised | Obsolete — hosted-edition remnant |
| Source list, EEO, extra fields, hot flag, MRU, upcoming events | add/edit/show forms | Per-site source pick list; US EEO fields (visible per user flag); EAV custom fields; hot styling; 5-item recent bar | `ExtraFields`, `EEOSettings`, `MRU` | as parent | Works (forms #22, #33; MRU bar on every page) | Useful |
| `a=savedLists` | `:287-295` commented (`FIXME: savedList() missing`) | — | — | — | Dead | Obsolete |

### 8.3 Job orders (`modules/joborders/JobOrdersUI.php`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Job order list | `a=listByView` / default `:301-303` | Grid with status-group filter, Only My / Only Hot; Submitted/Pipeline columns | `JobOrdersDataGrid`; joborder, candidate_joborder(_status_history) | READ | Works #17 | Core |
| Add (empty or copy) | `a=addJobOrderPopup` `:108-109`, `a=add` `:116-117` | Chooser then form; company autocomplete or internal postings; public flag; questionnaire; recruiter, owner | `JobOrders::add()` → `src/OpenCATS/Entity/JobOrder*`; joborder, history | EDIT | Works with errors #18, #19 (CKEditor inactive, RT-07) | Core |
| Edit | `a=edit` `:132-133` | All fields incl. openings/available; owner change e-mail (`:840,1054`) | `JobOrders::update()` | EDIT | Not exercised | Core |
| Detail + pipeline | `a=show` `:100-101` | Details, attachments, pipeline graph, AJAX pipeline grid with rating, "Mark as Screened", status change, remove, export | `Pipelines::getJobOrderPipeline()`, `ajax/getPipelineJobOrder.php` | READ (row actions EDIT/DELETE) | Works #20 | Core |
| Delete | `a=delete` `:148-149` | Hard delete incl. pipelines and status history | `lib/JobOrders.php:272` | DELETE | Not exercised | Core need, unsafe (FEAT-003) |
| Search | `a=search` `:156-157` | By title or company | `SearchJobOrders` | READ | Works #46 | Core |
| Consider candidate / add to pipeline | `a=considerCandidateSearch` `:195-196`, `a=addToPipeline` `:217-218` | Name search, add at status 100 + activity | `Pipelines::add()` | EDIT | Not exercised from this side | Core |
| Add new candidate into pipeline | `a=addCandidateModal` `:228-229` | Create candidate (with duplicate check) and add in one step | `CandidatesUI::publicAddCandidate()` | EDIT | Not exercised | Useful |
| Change status | `a=addActivityChangeStatus` `:175-176` | Same modal as candidates, with E-Mail Settings defaults (FEAT-018) | as §9 | EDIT | Not exercised from this side | Core |
| Remove from pipeline | `a=removeFromPipeline` `:245-246` | As candidates | `Pipelines::remove()` | DELETE | Not exercised | Core need |
| Attachments | `a=createAttachment` `:254-255`, `a=deleteAttachment` `:274-275` | Job-order files | attachment | EDIT / DELETE | Not exercised | Useful |
| Job order report (PDF) | link to `m=reports&a=customizeJobOrderReport` | See 8.10 | — | AUTH | Broken RT-09 | Useful (FEAT-022) |
| Status groups, job types | `lib/JobOrderStatuses.php:40-55`, `lib/JobOrderTypes.php` | Open/Closed/Pre-Open groups; sharing status "Active"; types C/C2H/FL/H; changeable only by editing `config.php` | joborder.status (text) | — | Filter works #17 | Core (config-only) |
| Openings counter | `CandidatesUI.php:2932-2942,3089-3100` | Decrement on Placed, increment when leaving Placed, guard at 0 | joborder.openings_available | — | Not exercised | Core, drifts (FEAT-025) |
| Public posting | form flag | `public=1` + sharing status ⇒ careers, RSS, XML | joborder.public | EDIT | Works #19, #81, #89 | Core |
| HR mode, administrative hide | `:580,671,936`; `a=administrativeHideShow` `:292-293` | Fix company to internal; hide job | site.is_hr_mode; joborder.is_admin_hidden | —; MULTI_SA | Not exercised | Niche / Obsolete |
| `a=setCandidateJobOrder` | `:282-290` commented | — | — | — | Dead | Obsolete |

### 8.4 Pipelines and activities (`lib/Pipelines.php`, `modules/activity/ActivityUI.php`, `ajax/`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Status history | `Pipelines::setStatus()` `:294-379`, `addStatusHistory()` `:427` | Row per real change (from, to, date) + audit row | candidate_joborder_status_history, history | EDIT (callers) | Works #31 | Core |
| Rating | `ajax/setCandidateJobOrderRating.php:35` | −1 (unscreened) … 5 stars per pipeline | candidate_joborder.rating_value | EDIT | Not exercised | Useful |
| Pipeline details popup | `ajax/getPipelineDetails.php` | Activities for one pipeline | activity | AUTH | Not exercised | Useful |
| Activity list | `m=activity` default / `a=listByViewDataGrid` `:77` | Site-wide activity grid | `ActivityDataGrid`; activity | AUTH | Works #07, #91 | Core |
| Period filter | `a=viewByDate` `:65` | Last week/month/6 months/year/all or date range | activity | AUTH | Works #91 | Useful |
| Log activity | via candidate/contact modals | Types Call, Email, Meeting, Other, Call (Talked/LVM/Missed); optional "regarding" job order | `ActivityEntries::add()` | EDIT | Works #31 | Core |
| Edit / delete activity | `ajax/editActivity.php:113`, `ajax/deleteActivity.php:47` | Inline AJAX edit/delete | activity | AUTH (FEAT-006) | Not exercised | Useful |

### 8.5 Calendar (`modules/calendar/CalendarUI.php`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Month/week/day view, Goto Today, My Upcoming Events | `a=showCalendar` `:83`, data feed `a=dynamicData` `:75` | JS calendar fed with all site events of the month | `Calendar::getEventArray()`; calendar_event | AUTH | Works #35, #37 | Core |
| Add / edit / delete event | `a=addEvent` `:61`, `a=editEvent` `:68`, `a=deleteEvent` `:79` | Type (Call, Email, Meeting, Interview, Personal, Other), all-day or time, duration, public flag, "regarding" record, reminder | `Calendar::addEvent/updateEvent/deleteEvent`; calendar_event | EDIT / EDIT / DELETE (no owner check, FEAT-004) | Add works #36; event on dashboard #90 | Core |
| Other users' entries | `Calendar.tpl:16-19`, `CalendarUI.php:173` | SA checkbox "Show Entries from Other Users" (client-side only) | — | SA (cosmetic) | Not exercised | Useful, unsafe (FEAT-004) |
| E-mail reminders | queue task `modules/calendar/tasks/Reminders.php` | Sends due reminders; option hidden unless scheduler ran in last 5 min | calendar_event, queue | — | Not exercised (no scheduler) | Useful, inert (FEAT-010) |
| Customize calendar | `m=settings&a=customizeCalendar` (`SettingsUI.php:453`) | Site calendar preferences | settings | view DEMO, save SA | Page loads #68 | Niche |

### 8.6 Companies (`modules/companies/CompaniesUI.php`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Company list | `a=listByView` / default `:178-180` | Grid; Only My / Only Hot | `CompaniesDataGrid`; company | READ | Works #09 | Core |
| Add / edit | `a=add` `:91-92`, `a=edit` `:107-108` | Name, address, phones, URL, key technologies, departments, billing contact, extra fields, hot; owner e-mail (`:635,768`); address change propagates to contacts | `Companies::add()/update()`; company, company_department, contact | EDIT | Works #10, #12 | Core |
| Detail | `a=show` `:75-76` | Details, attachments, job orders, contacts | company, joborder, contact | READ | Works with errors #10, #11 (3 PHP warnings, RT-06) | Core |
| Delete | `a=delete` `:123-124` | Cascades to contacts, job orders, pipelines, history (default company protected `:889-891`) | `lib/Companies.php:214-305` | DELETE | Not exercised | Core need, unsafe (FEAT-003) |
| Search | `a=search` `:131-132` | By name or key technologies | `SearchCompanies` | READ | Works #47 | Core |
| Internal postings | `a=internalPostings` `:83-84` | Opens the site's default (internal) company | company.default_company | READ | Not exercised (link seen in UI map) | Useful |
| Attachments | `a=createAttachment` `:150-151`, `a=deleteAttachment` `:169-170` | Company files | attachment | EDIT / DELETE | Not exercised | Useful |

### 8.7 Contacts (`modules/contacts/ContactsUI.php`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Contact list | `a=listByView` / default `:186-188` | Grid; Only My / Only Hot | `ContactsDataGrid`; contact | READ | Works #13 | Core |
| Add / edit | `a=add` `:93-94`, `a=edit` `:109-110` | Company (autocomplete), title, department, reports-to, e-mails, phones, address, "left company", hot, owner e-mail (`:629,761`) | `Contacts::add()/update()`; contact | EDIT | Add works #14 | Core |
| Detail | `a=show` `:85-86` | Details, job orders, activities, upcoming events | contact, activity, calendar_event | READ | Works #15 | Core |
| Delete | `a=delete` `:125-126` | Deletes contact, list entries, extra fields; clears reports-to | `lib/Contacts.php:347-392` | DELETE | Not exercised | Core |
| Search | `a=search` `:133-134` | By name, company, title | `ContactsSearch` | READ | Works #48 | Core |
| Log activity / schedule event | `a=addActivityScheduleEvent` `:151-152` | Activity on contact (optionally regarding a job) and/or event | activity, calendar_event | EDIT | Not exercised | Useful |
| Cold call list | `a=showColdCallList` `:167-168` | Printable list of contacts with phone, by company | `Contacts::getColdCallList()` (`lib/Contacts.php:698`) | READ | Works #16 | Niche |
| vCard | `a=downloadVCard` `:175-176`, `:1150` | vCard file for a contact | `VCard` | READ | Not exercised | Niche |

### 8.8 Lists (`modules/lists/ListsUI.php`, `modules/lists/ajax/`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Lists overview | `a=listByView` / default `:100` | Grid of saved lists (Static/Dynamic column) | `SavedLists`; saved_list | AUTH | Works #08 | Useful |
| Show list | `a=showList` `:77`, `:141-212` | Members of a static list (candidates, companies, contacts, job orders) | saved_list_entry | AUTH | Not exercised | Useful |
| Add to list | `a=quickActionAddToListModal` `:82`, `a=addToListFromDatagridModal` `:87`; AJAX `newList`, `editListName`, `deleteList`, `addToLists` | Create/rename/delete lists inline and add records | saved_list, saved_list_entry | AUTH (FEAT-006) | Not exercised; grid path affected by FEAT-020 | Useful |
| Remove from list / delete list | `a=removeFromListDatagrid` `:91`, `a=deleteStaticList` `:95` | — | saved_list_entry | AUTH | Not exercised; FEAT-020 | Useful |
| Dynamic lists | `SavedLists.php:212` always writes `is_dynamic = 0`; `ListsUI.php:159` handles static only | — | — | — | Dead | Obsolete as shipped |
| `a=show` | `:71-75` commented (`FIXME: show() undefined`) | — | — | — | Dead | Obsolete |

### 8.9 Import / export / attachments

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| CSV/TSV import wizard | `m=import` default, `a=importSelectType` `:81`, `a=importUploadFile` `:85`, `onImport()` `:409` | Candidates, job orders, companies, contacts; column mapping (SA may create extra fields `:716,903`); contacts can auto-create companies; each row stamped with `import_id`; no duplicate check | `modules/import/Import.php`, `*Import.php`; entity tables, import | select/upload AUTH; commit EDIT (`:411,742`) | Page loads #73; import not exercised | Core — onboarding |
| Recent imports / errors | `a=viewpending` `:77`, `a=viewerrors` `:73` | List imports and per-import errors | import | AUTH | Not exercised | Useful |
| Revert import | `a=revert` `:69`, `:134-168`; `Import::revert()` `Import.php:203-260` | Deletes rows of that `import_id` from the target table, extra-field values/settings, and companies auto-created for contacts | entity table, extra_field(_settings), company, import | AUTH (FEAT-006) | Not exercised | Useful — safe undo of a bad import |
| Mass resume import | `a=massImport` `:97`, `a=massImportDocument` `:101`, `a=massImportEdit` `:105` | Files must first be copied to `upload/<site>/massimport` on the server (`MassImportStep1.tpl` advises `chmod -R 777`); 4 steps convert, optionally parse, edit, create candidates | `DocumentToText`, `ParseUtility`; candidate, attachment | EDIT (`:1507`) | Not exercised | Niche — needs shell access |
| Bulk resumes | `a=importBulkResumes` `:109`, `a=deleteBulkResumes` `:113`, `a=whatIsBulkResumes` `:89` | Import/delete unattached "bulk resume" files | attachment | SA (`:2027,2060`) | Not exercised | Obsolete |
| Upload-directory listing | `a=showMassImport` `:93`, `:1290` | Lists files under `./upload/` | — | AUTH | Not exercised | Obsolete |
| Grid CSV export | `m=export&a=exportByDataGrid` (`ExportUI.php:60`, `:135-140`) | Selected / all rows of any grid, visible columns | `DataGrid::drawCSV()` | AUTH (FEAT-006) | Not exercised; selection lost (FEAT-020) | Core — data portability |
| Legacy candidate export | `a=export` `:64`, `:77` | Candidate CSV by IDs or all | `lib/Export.php` | AUTH | Not exercised | Obsolete |
| Attachment download | `m=attachments&a=getAttachment` (`AttachmentsUI.php:59`, `:69-127`) | Streams file inline; checks login + `md5(directoryName)`; loads with `new Attachments(-1)` (no site filter, `:83`); also serves backups | attachment | AUTH + hash (SEC-008) | Works #29; direct file URLs work without session under nginx (RT-17) | Core |
| Local attachment copy | `ajax/getAttachmentLocal.php` | Fetch attachment for preview | attachment | AUTH | Not exercised | Niche |

### 8.10 Reports and graphs (`modules/reports/ReportsUI.php`, `modules/graphs/GraphsUI.php`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Reports overview | default / `a=reports` `:86`, `reports()` `:93` | Submissions and placements for 9 periods (54 COUNT queries) | `Statistics`; status history | AUTH | Works #49 | Useful (FEAT-008) |
| Submission report | `a=showSubmissionReport` `:66`, `:188` | Job orders with submissions in a period and the submitted candidates | status history, joborder, candidate | AUTH | Works #50 | Useful |
| Placement report | `a=showPlacementReport` `:70`, `:268` | Same for placements | as above | AUTH | Works #51 | Useful |
| EEO report | `a=customizeEEOReport` `:78`, `a=generateEEOReportPreview` `:82`, `:567` | Gender/ethnicity/veteran/disability charts by period and status; not gated by the per-user EEO flag | `Statistics::getEEOReport()` (`lib/Statistics.php:694`) | AUTH | Works with errors #52 (RT-10 JS error) | Niche — US compliance |
| Job order report (PDF) | `a=customizeJobOrderReport` `:74`, `a=generateJobOrderReportPDF` `:62`, `:409` | Form → FPDF "Recruiting Summary" with chart | `Statistics::getJobOrderReport()`, FPDF | AUTH | Form works #53; PDF broken #54 (RT-09) | Useful (FEAT-022) |
| Graph viewer | `a=graphView` `:58`, `:171` | Shows an image URL passed in the request | — | AUTH | Not exercised | Obsolete |
| Graph images | `m=graphs` `GraphsUI.php:78-131` | Public: `jobOrderReportGraph`, `generic`, `genericPie`, `wordVerify`, `testGraph`; logged-in (`:101`): `activity`, `newCandidates`, `newJobOrders`, `newSubmissions`, `miniPlacementStatistics`, `miniJobOrderPipeline` | `GraphGenerator`, artichow | none / AUTH | Works #55, #06, #90 | Useful (charts), Obsolete (engine) |
| Customize reports | `m=settings&a=reports` `:473-486` | Form whose POST branch is empty | — | DEMO | Not exercised | Obsolete |

### 8.11 Careers portal (`careers/index.php` → `modules/careers/CareersUI.php`)

All careers features are public (no login), serve only `Site::getFirstSiteID()` (`:79`), and are off until enabled (`lib/CareerPortal.php:77`; RT-16). Also reachable as `index.php?showCareerPortal=1` (`index.php:176-179`).

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Portal home | default (`p=` empty, `:858-933`) | Renders "Content - Main" of the active template; `?templateName=` overrides it (`:106-109`) | `CareerPortalSettings`; career_portal_template(_site), settings | none | Works #80 after enabling #75 | Core |
| Job list | `p=showAll` `:151-178` | Table of public jobs in sharing statuses, if `allowBrowse` | `JobOrders::getAll(JOBORDERS_STATUS_SHARE)`; joborder | none | Works #81 | Core |
| Job detail | `p=showJob` `:793-854` | One job with apply link | joborder | none | Works #82 | Core |
| Job search | `p=search` `:180-182`, `p=searchResults` `:856-858` | Empty branches | — | none | Broken — blank content #83 (FEAT-011) | Core need, missing |
| Apply form | `p=applyToJob` `:412-713` | Resume upload + text, "Populate Fields" (parsing, FEAT-012), contact fields, EEO selects, optional questionnaire step | `Questionnaire`, `AttachmentCreator` | none | Works #84 (S3) | Core |
| Apply submit | `p=onApplyToJobOrder` `:715`, `onApplyToJobOrder()` `:1190-1603` | Matches candidate by e-mail (`:1298`) or creates one (source "Online Careers Website", owner = automated user); questionnaire actions (`:1341-1346`, FEAT-021); attaches resume; adds to pipeline at 100 with rating −1 or logs "re-applied" (`:1405-1433`); activity; e-mails applicant and job owner/recruiter | `Candidates`, `Pipelines`, `ActivityEntries`; candidate, attachment, candidate_joborder, activity | none | Partly broken #85–#87 (RT-12 resume dropped; RT-04 fatal page) | Core (FEAT-023) |
| Candidate registration / login | `p=candidateRegistration` `:359-410`, `ProcessCandidateRegistration()` `:1635-1735` | Knowledge-based "login" (FEAT-005) | candidate | none | Not exercised (option off) | Obsolete as designed |
| Candidate profile | `p=registeredCandidateProfile` `:183-257`, `p=onRegisteredCandidateProfile` `:259-357`, `pa=updateProfile` / `pa=logout` `:134-148` | View/update own profile and resume | candidate, attachment | cookie (FEAT-005; API-003 misaligned update) | Not exercised | Obsolete as designed |
| Questionnaires (runtime) | `Questionnaire::doActions()` (`lib/Questionnaire.php:583`) | Text/checkbox/select/radio answers; chosen answers can set source, notes, key skills, hot, active, relocate; answers logged per candidate | career_portal_questionnaire* | none | Not exercised | Useful, unsafe (FEAT-021) |
| RSS Feed button | template shortcut → `../rss/` | — | — | none | Broken #88 (RT-05) | Useful |

### 8.12 Job feeds (`rss/`, `xml/`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| RSS feed | `rss/index.php` → `m=rss` (`RssUI.php:57-66`, `:103-108`) | RSS 2.0 of public jobs of the first site | joborder | none | Broken via `/rss/` #88 (RT-05); `index.php?m=rss` not exercised | Useful |
| XML job feed | `xml/index.php` → `m=xml` (`XmlUI.php:62-70`, `:103-190`) | Template-driven XML (`indeed.xtpl`, `simplyhired.xtpl`, `rss.xtpl`, `?t=`); access logged to `http_log` (`:117`) | joborder, xml_feeds, http_log | none | Works #89 | Useful — job-board pull feed |
| Push to job boards | `XmlTemplate::submitXMLFeeds()` (`lib/XmlJobExport.php:108-111`) | Only a hook call; no caller | xml_feeds, xml_feed_submits | — | Dead | Obsolete |

### 8.13 Settings and administration (`modules/settings/SettingsUI.php`, 51 actions)

"view DEMO, save SA" means GET needs ≥ DEMO and POST needs ≥ SA; because DEMO (350) > DELETE (300), a DELETE user cannot open these pages. `careerportal` = ACL category exemption.

| Feature | Entry (line of `case`) | What it does | Main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| My profile, change password | `myProfile` `:884`, `changePassword` `:248` | Profile; change own password (MD5; LDAP users blocked) | user | READ; not DEMO | Pages load #56, #58; change not executed | Core |
| Administration hub | `administration` `:856` | Links to all admin pages plus a catsone.com "careers website" link | — | view DEMO, save SA (or `careerportal`) | Works #57 | Core |
| Site name, localization, system info | `administration&s=siteName/localization/systemInformation` | Rename site; integer GMT offset + MDY/DMY (forces logout); version and module-schema info | site, module_schema | SA | Pages load #59, #64, #72 | Useful (FEAT-016) |
| New version check, passwords | `s=newVersionCheck`, `s=passwords` | Toggle phone-home (off in seed); a "retrieve forgotten passwords" checkbox with no form (`Passwords.tpl:26-33`) | system | ROOT or DEMO | Pages load #70, #71 | Obsolete |
| User management | `manageUsers` `:335`, `showUser` `:367`, `addUser` `:376`, `editUser` `:396`, `deleteUser` `:613` | CRUD users, access level, EEO visibility, ACL categories, seat licences | user, access_level | view DEMO, save/delete SA (SEC-013) | Works #60, #61, #74 (user added) | Core |
| Login activity | `loginActivity` `:652` | Successful/failed logins with IP/host | user_login | DEMO | Works #62 | Useful |
| Item history | `viewItemHistory` `:663` | Field-level change history of a record | history | DEMO | Not exercised | Useful |
| E-mail settings | `emailSettings` `:488`, `onEmailSettings()` `:2027` | From address, per-status default toggles (8 statuses), template enable flags; test e-mail (`ajax/testEmailSettings.php`, AUTH) | settings, email_template | view DEMO, save SA | Page #76; test mail fatal #77 (RT-04) | Core |
| E-mail templates | `emailTemplates` `:621`, `addEmailTemplate` `:875`, `deleteEmailTemplate` `:879` | Edit 7 system templates (`db/cats_schema.sql:631-637`) and custom templates with `%VAR%` placeholders | email_template | view DEMO, save SA; add/delete real level SA (`:895-916`) | Page loads #63; editing not exercised | Core |
| Careers settings / templates / questionnaires | `careerPortalSettings` `:560`, `careerPortalTemplateEdit` `:540`, `onCareerPortalTweak` `:603`, `careerPortalQuestionnaire` `:516`, `…Update` `:532`, `…Preview` `:508`, `previewPage(Top)` `:351,359` | Enable portal, browse/registration flags, raw-HTML templates with custom tags, questionnaires | settings, career_portal_* | view DEMO, save SA; questionnaire create/update DEMO | Enable works #75; rest not exercised | Core (enable) / Useful |
| EEO settings | `eeo` `:583` | Enable EEO tracking per category | settings | view DEMO, save SA | Page loads #66 | Niche — US-specific |
| Extra fields | `customizeExtraFields` `:433` | Add/delete/rename/reorder custom fields and options per entity | extra_field_settings | view DEMO, save SA | Page loads #69 | Core |
| Tags | `tags` `:232`, `ajax_tags_add/del/upd` `:675,684,693` | Tag tree; AJAX add/delete/rename work (rename sets description to "-", `:191`); postback handler empty (`:201-205`) | tag | page SA (or `careerportal`); AJAX AUTH | Page loads #67 | Useful |
| Backup | `createBackup` `:417`, `deleteBackup` `:425`, `modules/settings/ajax/backup.php` | Zip of DB dump and/or attachments stored as an attachment; restore only via installer | attachment | SA | Page loads #65; not executed (DB-005: data dump fails on PHP 7/8) | Useful need, unreliable |
| First-run pages and wizard AJAX | `newInstallPassword` `:260`, `forceEmail` `:275`, `newSiteName` `:290`, `upgradeSiteName` `:305`, `newInstallFinished` `:320`, `ajax_wizard*` `:702-842` | Post-install prompts and login-wizard back-end | user, site, settings | SA (`ajax_wizardEmail` READ) | Not exercised | Niche (FEAT-019) |
| Professional / licence | `professional` `:343`, `manageProfessional()` `:2684` | Licence-key entry and catsone.com upsell | — | DEMO | Not exercised | Obsolete (§10) |
| Customize reports, ASP localization, Firefox modal | `reports` `:473`, `aspLocalization` `:641`, `getFirefoxModal` `:671` | Stub / hosted-edition / toolbar remnants | — | DEMO / SA / AUTH | Not exercised | Obsolete |
| Data import link | Administration → `m=import` | See 8.9 | — | — | #73 | Core |

### 8.14 Login, session and onboarding (`modules/login/LoginUI.php`, `lib/Session.php`, `lib/Users.php`)

| Feature | Entry | What it does | Lib / main tables | Access | Runtime | Value |
|---|---|---|---|---|---|---|
| Login | `a=showLoginForm` `:72`, `a=attemptLogin` `:53`, `attemptLogin()` `:179-431` | Username (or `user@site`) + password; logs attempt; then first-run redirects (new-install password, site name, e-mail prompt) | `Users::isCorrectLogin()`; user, user_login | none | Works #01, #02, #05 | Core |
| LDAP / AD | `AUTH_MODE` (`config.php:48`: `sql`) | `ldap` or `sql+ldap`; first LDAP login creates a disabled local user | `LDAP` | none | Not exercised | Useful (SEC-006) |
| Logout | `m=logout` (`index.php:220-251`) | Ends session, back to login | — | AUTH | Works #94 | Core |
| Forgot password | `a=forgotPassword` `:57-66`, `:448-480` | Broken by construction | — | none | Broken #03, #04 (RT-03, RT-13) | Obsolete as designed (FEAT-009) |
| No-cookies help, demo login | `a=noCookiesModal` `:68`; `Login.tpl` demo links | Help popup; demo account links (demo mode off) | — | none | Not exercised | Obsolete |
| Single-session option | `ENABLE_SINGLE_SESSION` (`config.php:183`, false) | Force-logout other sessions | user | — | Not exercised | Niche |
| First-login wizard | `LoginUI.php:293-371` + `m=wizard&a=ajax_getPage` (`WizardUI.php:82`) | Welcome, licence, password, e-mail, site name, setup users; Localization/Register pages never added (`Register` only under undefined `CATS_TEST_MODE`, `:312`) | `Wizard`; session | SA | Not exercised | Niche (FEAT-019) |

### 8.15 Toolbar, queue, tests, installer and operations scripts

| Feature | Entry | What it does | Access | Runtime | Value |
|---|---|---|---|---|---|
| Firefox toolbar back-end | `m=toolbar`: `authenticate` `:71` (credentials in GET), `checkEmailIsInSystem` `:75`, `storeMonsterResumeText` `:79`, `getJavaScriptLib` `:67`, `getRemoteVersion` `:63`, `getLicenseKey` `:83`, `attemptLogin` `:59` (undefined method) | Browser-extension API for a XUL add-on that no longer exists (`install.tpl` points to a missing `.xpi`) | none (module public, `:46`) | Not exercised | Obsolete (FEAT-012, SEC-010) |
| Queue processor | `QueueCLI.php` (meant for cron) | Runs the next due task (`Calendar Reminders`, `CleanExceptions`) | none (CLI script, web-reachable, API-008) | Not exercised | Useful need, inert (FEAT-010) |
| Queue web UI | `m=queue` (`QueueUI.php:47-55`) | Empty switch | AUTH | — | Obsolete |
| In-app tests | `m=tests`: `selectTests` `:89`, `runSelectedTests` `:84` | SimpleTest runner against the live DB | AUTH | Not exercised | Obsolete in production (FEAT-014) |
| Web installer | `installwizard.php` + `ajax.php?f=install:ui` (`modules/install/ajax/ui.php`) | Environment checks, DB create/load (empty or demo), config write, optional components, restore from `./restore/catsbackup.bak`, module migrations (`modules/install/Schema.php`) | none until `INSTALL_BLOCK` exists | DB steps replayed and work for empty DB (`INSTALLATION.md` §2); demo-data path fatal (RT-01); UI not clicked | Core need, fragile |
| Attachment re-index / re-layout | `install:attachmentsReindex`, `install:attachmentsToThreeDirectory` | Rebuild extracted text; move files to 3-level layout | SA / ROOT | Not exercised | Useful (after FEAT-024 fix) |
| Maintenance scripts | `ajax.php?f=install:maint`, `installtest.php`, `rebuild_old_docs.php` | Migrations/maintenance, install test page, document re-processing | none (API-008) | Not exercised | Niche |

### 8.16 Cross-cutting UI services and AJAX endpoints

| Feature | Entry | What it does | Access | Runtime | Value |
|---|---|---|---|---|---|
| Tabs, sub-tabs, MRU bar, quick search box | `lib/TemplateUtility.php` (`printTabs()`), `lib/MRU.php` (`MRU_MAX_ITEMS=5`) | Global chrome; tab visibility by level is cosmetic only | AUTH | Works on every page; not responsive (RT-14) | Core |
| Data-grid engine | `lib/DataGrid.php` (2,649 LOC), `ajax/getDataGridPager.php`, `ajax/setColumnWidth.php` | Column chooser, resize, filters, paging, selection, action area, CSV | AUTH | Lists work (#09, #13, #17, #21); selection actions broken (FEAT-020) | Core |
| Company/contact autocomplete, locations, departments | `ajax/getCompanyNames.php`, `getCompanyContacts.php`, `getCompanyLocation*.php` | Suggest lists and form fill | AUTH | Works #14, #19 | Useful |
| Duplicate lookups | `ajax/getCandidateIdByEmail.php`, `getCandidateIdByPhone.php` | Live "already in system" check on add form | AUTH | Not observed separately | Useful |
| "Regarding" job orders | `ajax/getDataItemJobOrders.php` | Job orders for activity modals | AUTH | Works #31 | Useful |
| Address parser, ZIP lookup | `ajax/getParsedAddress.php`, `ajax/zipLookup.php` (public `AJAXInterface`) | Parse pasted address; keyless Google geocode (API-013) | none | Not exercised | Niche |
| Template tag preview | `ajax/replaceTemplateTags.php`, `ajax/showTemplate.php` | E-mail template preview | AUTH | Not exercised | Useful |
| Test e-mail | `ajax/testEmailSettings.php` | Sends a test mail to any address | AUTH (no level check) | Fatal #77 (RT-04) | Useful |
| Empty endpoint | `ajax/getReportHTML.php` (0 bytes) | — | — | — | Obsolete |
| Rich-text editor | CKEditor 4.25.1 in job-order add/edit and e-mail compose | Does not start (licence check) | — | Broken (RT-07, `S1`, `S2`) | Useful (DEP-002) |

## 9. Recruitment pipeline state machine (reference)

### 9.1 Statuses

| Code | Constant (`constants.php:120-130`) | Label (seed `db/cats_schema.sql:267-277`) | `triggers_email` seed | E-Mail Settings toggle (`SettingsUI.php:2042-2049`) | Special handling in code |
|---|---|---|---|---|---|
| 0 | `PIPELINE_STATUS_NOSTATUS` | No Status | 0 | — | Excluded from picker (`lib/Pipelines.php:417`) |
| 100 | `PIPELINE_STATUS_NOCONTACT` | No Contact | 0 | — | Initial status on every add (literal, `lib/Pipelines.php:110`); no history row written |
| 200 | `PIPELINE_STATUS_CONTACTED` | Contacted | 0 | yes | — |
| 250 | `PIPELINE_STATUS_CANDIDATE_REPLIED` | Candidate Responded | 0 | yes | — |
| 300 | `PIPELINE_STATUS_QUALIFYING` | Qualifying | 1 | yes | — |
| 400 | `PIPELINE_STATUS_SUBMITTED` | Submitted | 1 | yes | Every history row counts as a submission (`lib/Statistics.php:102,241,312,559`); "submitted" flag in pipeline grid (`lib/Pipelines.php:604-636`); dashboard "important" |
| 500 | `PIPELINE_STATUS_INTERVIEWING` | Interviewing | 1 | yes | Dashboard "important"; job-order "Interviews" column (`lib/JobOrders.php:1062`) |
| 600 | `PIPELINE_STATUS_OFFERED` | Offered | 1 | yes | Dashboard "important" |
| 650 | `PIPELINE_STATUS_NOTINCONSIDERATION` | Not in Consideration | 0 | — (no toggle) | — |
| 700 | `PIPELINE_STATUS_CLIENTDECLINED` | Client Declined | 0 | yes | — |
| 800 | `PIPELINE_STATUS_PLACED` | Placed | 1 | yes | Openings guard and arithmetic; counts as placement (`lib/Statistics.php:133,351,422,591`; `lib/Dashboard.php:85`) |

Runtime: the picker listed exactly 100…800 in this order (#31). `can_be_scheduled` is never read; `candidate_joborder.date_submitted` is never written or read.

### 9.2 Transitions

```
 Add to pipeline  (recruiter: a=addToPipeline, activity type 400 "Added candidate to job order.";
                   careers: onApplyToJobOrder, rating -1, activity "User applied through candidate portal")
     INSERT candidate_joborder.status = 100          (no status-history row)
                         |
                         v
 +----------------------------------------------------------------------------------+
 | ANY enabled status (except 0) --> ANY other enabled status                        |
 | enforced: status exists and is enabled; differs from current (CandidatesUI:3019-3023)|
 | not enforced: order, required fields, approvals, per-job workflow, terminal states|
 |                                                                                  |
 |  conventional order only: 100 -> 200 -> 250 -> 300 -> 400 -> 500 -> 600 -> 800   |
 |  side exits (not terminal in code): 650 Not in Consideration, 700 Client Declined |
 |                                                                                  |
 |  -> 800: guard checkOpenings() > 0, else fatal modal "job order has been filled"  |
 |          then openings_available - 1  (also when already 800: FEAT-025)            |
 |  800 -> other: openings_available + 1                                             |
 +----------------------------------------------------------------------------------+
                         |
 Remove from pipeline (>= DELETE): DELETE candidate_joborder + ALL its status history,
 two audit rows in `history`; openings NOT restored; activities kept
```

### 9.3 Side effects of one status change (`CandidatesUI::_addActivityChangeStatus()`, `CandidatesUI.php:2900-3302`)

| Step | Condition | Effect | Evidence |
|---|---|---|---|
| 1 | target = 800 | Abort with fatal modal if `openings_available <= 0` | `:2932-2942`; `lib/JobOrders.php:827-860` |
| 2 | "Add activity" ticked | Insert activity (chosen type, note; "Status change: X" note pre-filled in JS, status names highlighted) | `:2949-2996` |
| 3 | status valid and different | UPDATE status + `date_modified` | `lib/Pipelines.php:333-347` |
| 4 | same | INSERT status history (from, to, date) | `lib/Pipelines.php:350-352`, `:427-462` |
| 5 | same | INSERT audit row in `history` (`DATA_ITEM_PIPELINE`) | `lib/Pipelines.php:354-365` |
| 6 | "Send E-Mail" ticked, status changed, candidate has e-mail, message not blank, user not DEMO | Synchronous mail; subject `CANDIDATE_STATUSCHANGE_SUBJECT` (`config.php:166`); body from `EMAIL_TEMPLATE_STATUSCHANGE` with `%CANDSTATUS% %CANDPREVSTATUS% %JBODTITLE% %JBODCLIENT%` replaced in the browser (`js/activity.js:743-744`) and `%CANDOWNER% %CANDFIRSTNAME% %CANDFULLNAME%` on the server (`CandidatesUI.php:1718-1724`) | `:3046-3082`; `lib/Pipelines.php:367-378` |
| 7 | target = 800 and `openings_available > 0` | `openings_available - 1` (not conditioned on a real change) | `:3089-3093` |
| 8 | old = 800, new ≠ 800 | `openings_available + 1` | `:3096-3100` |
| 9 | "Schedule event" ticked | INSERT calendar event, optional reminder | `:3103-3260` |

Order matters: the mail in step 6 is sent inside `setStatus()` after steps 3–5. If it throws (RT-04), the status is already changed but steps 7–9 and the confirmation are skipped (**INFERENCE** from code order; the baseline did not tick "Send E-Mail", #31).

Not implemented: automatic job-order status change when openings reach 0 (`'Full'` appears only in status lists), automatic rejection mail, interview scheduling tied to status, SLA timers, hiring-manager notifications, webhooks, state-dependent required fields.

## 10. Half-implemented, disabled and upsell features (reference)

| # | Item | Evidence | Status |
|---|---|---|---|
| 1 | Candidate `a=savedLists` | `modules/candidates/CandidatesUI.php:287`: `/* FIXME: function savedList() missing` | Commented out |
| 2 | Job order `a=setCandidateJobOrder` | `modules/joborders/JobOrdersUI.php:282`: `/* FIXME: … does not exist` | Commented out |
| 3 | Home `a=getAttachment` | `modules/home/HomeUI.php:75`: `/* FIXME: undefined function getAttachment()` | Commented out |
| 4 | Lists `a=show` | `modules/lists/ListsUI.php:71`: `/* FIXME: function show() undefined` | Commented out |
| 5 | Dynamic saved lists | only `is_dynamic = 0` written (`lib/SavedLists.php:212`); `showList()` handles static only (`ListsUI.php:159`); "New Dynamic List" sub-tab commented (`:57-58`) | Schema + label only |
| 6 | Quick search over lists | `modules/home/HomeUI.php:209` (`//$listsRS = $search->lists($query);`) | Commented out |
| 7 | Careers job search | `CareersUI.php:180-182`, `:856-858`; runtime #83 blank | Stub (FEAT-011) |
| 8 | Careers `allowXMLSubmit`, `useCATSTemplate` | defaults `lib/CareerPortal.php:83-84`; `useCATSTemplate` read only at `CareersUI.php:962-964`; no UI for either | No UI |
| 9 | Customize Reports | `modules/settings/SettingsUI.php:478-481` (empty postback) | Stub |
| 10 | Passwords admin page | `modules/settings/Passwords.tpl:26-33` (checkbox, no form); runtime #70 | Stub |
| 11 | Tag bulk edit | `SettingsUI.php:201-205` (`// TODO: Add tags changing code`); single-tag AJAX add/delete/rename do work (`:130-195`) | Stub (postback only) |
| 12 | Forgot password | `modules/login/LoginUI.php:448-480`; RT-03 | Broken (FEAT-009) |
| 13 | Toolbar `attemptLogin`, `.xpi` | `modules/toolbar/ToolbarUI.php:59-61` (undefined method); `modules/toolbar/install.tpl` references a missing `catstoolbar.xpi` | Broken / dead |
| 14 | Queue web UI | `modules/queue/QueueUI.php:47-55` (empty switch) | Stub |
| 15 | Wizard module page list | `modules/wizard/WizardUI.php:52-73` (commented) | Stub |
| 16 | Login-wizard Localization / Register / Reregister | templates exist (`modules/login/wizard/`); Localization never added; Register only under `CATS_TEST_MODE` (`LoginUI.php:312-329`), which is not defined | Dead |
| 17 | `m=graphs&a=testGraph` | "intentionally empty" (`GraphsUI.php:136-139`) | Stub |
| 18 | Orphan templates (9) | `candidates/HotList.tpl`, `candidates/Duplicates.tpl`, `careers/{Openings,SearchOpenings,Blank2,BlankNoMargin}.tpl`, `import/ImportCommits.tpl`, `reports/NewDataItems.tpl`, `toolbar/install.tpl` (scan re-run; `MassImportStep1-4.tpl` are used via `sprintf`, `ImportUI.php:1647`) | Dead |
| 19 | Empty AJAX file | `ajax/getReportHTML.php` (0 bytes) | Dead |
| 20 | Unused columns | `candidate_joborder.date_submitted`, `candidate_joborder_status.can_be_scheduled` | Dead |
| 21 | Unreferenced libraries | `ControlPanel.php`, `Profile.php`, `Display.php`, `CBFUtility.php`, `JavaScriptCompressor.php`, `Encryption.php` | Dead (ARCH-M01) |
| 22 | "Professional" licensing | `License::__construct()` sets professional, 999 seats, expiry 32767, then applies `LICENSE_KEY` (`lib/License.php:59-73`); `validateProfessionalKey()` returns `true` (`:658-661`); `isParsingEnabled()` returns `true` on every path (`:687-706`); random footer re-validation (`lib/TemplateUtility.php:842-848`); upsell pages and links remain (`modules/settings/Professional.tpl:58,90`, `modules/candidates/Add.tpl:125`, `ToolbarUI.php:114-118`) | Neutered upsell |
| 23 | Hosted-edition (ASP) gates | `isASP()`, `isHrMode()` (no UI to set), MULTI_SA "administrative hide", `aspLocalization`, `ASP_WIZARD_*` hooks (`LoginUI.php:350,365`), `cognizo` branding (`ReportsUI.php:450-456`) | Dormant |
| 24 | `ACL_SETUP` roles | whole role/ACL map commented (`config.php:343-368`); `lib/ACL.php:54` falls back to the single level | Disabled by default |
| 25 | Sphinx search, US ZIP radius, resume parsing flags | `ENABLE_SPHINX=false` (`config.php:97`), `US_ZIPS_ENABLED=false` (`:262`), `PARSING_ENABLED=false` (`:51`, not honoured — FEAT-012) | Off by default |
| 26 | Job-board push submission | `XmlTemplate::submitXMLFeeds()` is only a hook call (`lib/XmlJobExport.php:108-111`), no caller; `xml_feeds.post_url` / `xml_feed_submits` unused | Stub |
| 27 | E-mail log | every sent mail is written to `email_history` (`lib/Mailer.php:368`); no screen reads it | Write-only |

## Area-level unknowns

1. **Non-admin behaviour.** All baseline steps used the administrator. Access gaps (FEAT-006), calendar privacy (FEAT-004) and the test runner (FEAT-014) need a runtime check with READ, EDIT and DELETE users on an isolated instance.
2. **Bulk "Selected" actions.** Only Send E-Mail was observed (FEAT-020). Export, Add To List, Add To Job Order and Remove From List need a two-row selection test to confirm which records they affect.
3. **E-mail with a working relay.** Status-change mail, owner-change mail, careers notifications, reminders and bulk mail were only seen failing (RT-04). Behaviour with a real SMTP relay (and what the applicant receives in FEAT-021) needs a sandboxed relay.
4. **Questionnaires and candidate registration** were not exercised; FEAT-005 and FEAT-021 need an isolated runtime test with a questionnaire attached to a public job.
5. **Scheduler in production.** Whether deployments run `QueueCLI.php` from cron (FEAT-010) needs operator input or `queue` table data.
6. **Data-quality effects on real data** — duplicates (FEAT-007), openings drift (FEAT-025), merge damage (FEAT-002), KPI distortion (FEAT-008) — need read-only queries on a production-size copy.
7. **Dormant-feature usage** (dynamic lists, bulk resumes, toolbar, `candidateRegistration`, `useCATSTemplate`, `ACL_SETUP`, LDAP) needs production settings/usage statistics.
8. **Third-party endpoints** (`soap.resfly.com`, catsone.com version check) were not contacted; their availability is unknown.
9. **Web installer UI** was not clicked through (config writes were out of bounds); only its DB steps were replayed (`INSTALLATION.md` §3).
10. **`index.php?m=rss`** may serve RSS despite the broken `/rss/` shim; not exercised.

## Changes from the Phase 0 edition

- **Format:** findings converted to the shared template; the KEEP/REDESIGN/REPLACE/RETIRE disposition column was removed from all tables and replaced by *Runtime* (baseline status) and *Value* (Core/Useful/Niche/Obsolete). Modernization candidates are returned to the lead separately.
- **Re-rated:**
  - FEAT-002 HIGH → CRITICAL: silent cross-entity corruption matches the scale's CRITICAL definition; aligned with DB-001.
  - FEAT-020 LOW → HIGH: runtime (#78, RT-11) shows the e-mail compose addressing a candidate that was not selected; the defect affects all non-popup and popup "Selected" actions (aligned with UX-002).
- **Confirmation upgraded to Runtime:** FEAT-001 (#31), FEAT-009 (#03–#04, RT-03, RT-13), FEAT-011 (#83, #88, RT-05, RT-16), FEAT-013 (#78–#79, RT-04, RT-11), FEAT-020 (#78, RT-11).
- **New findings:** FEAT-021 (questionnaire actions overwrite candidate data and send a bogus e-mail), FEAT-022 (job-order PDF self-fetch, RT-09; split out of FEAT-008), FEAT-023 (careers resume dropped and fatal page, RT-12/RT-04), FEAT-024 (PDF/DOC/HTML text extraction off by default, RT-08), FEAT-025 (openings counter drift).
- **Scope changes to existing findings:** FEAT-008 now covers KPI counting only (PDF items moved to FEAT-022) and adds that placements ignore the statistics job-order filter; FEAT-011 now also covers the broken careers "RSS Feed" link (RT-05) and the blank disabled page (RT-16); FEAT-004 adds the missing ownership check on event edit/delete; FEAT-010 reframed — `QueueCLI.php` runs on the baseline PHP 7.2 if scheduled, but nothing schedules it; the PHP ≥ 8 fatal applies to `index.php` and `ajax.php` too (ARCH-001/API-019); FEAT-012 corrected — the version check is **disabled in the seeded schema** (`db/cats_schema.sql:1044`), and Resfly is also reachable from the public careers "Populate Fields" button; FEAT-013 adds that bulk mail is logged under site 180 and that failures are fatal.
- **Corrected citations:** `lib/JobOrderStatuses.php` groups at `:43` and typo at `:55` (unchanged) but statistics usage added (`lib/Statistics.php:108,265,375`); merge statements `lib/Candidates.php:1330-1342` / `:1346-1358` (were `:1331-1343` / `:1347-1359`); merge POST source `CandidatesUI.php:3540` (was `:3538-3541`); company-delete guard `CompaniesUI.php:889-891`; e-mail template add/delete gate `SettingsUI.php:895-916`; forgot-password constants `config.php:170-174`; queue UI switch `QueueUI.php:47-55`; logout `index.php:220-251`.
- **Corrected claims:** tag rename over AJAX works (`SettingsUI.php:191`; Phase 0 said the update was commented) — only the bulk postback handler is empty; §10 grew from 26 to 27 items (write-only `email_history` added).
- **Withdrawn / merged:** none.
