# OpenCATS — What We Must NOT Rebuild

Complete edition · 2026-09-26 · code at `d607279` (OpenCATS 0.9.7.4)

## Purpose

This list names the capabilities, workflows, data rules and obligations in today's OpenCATS that **work** and carry **real value**. Any later change must keep them. They must not be dropped, re-invented from scratch or "simplified away".

"Preserve" means keeping the **behaviour, the data and its meaning**. It does not mean keeping the current code. Most of these capabilities sit on code with serious defects, and those defects are named next to each item so that nobody preserves them by accident. Section 7 lists behaviours that exist today but must **not** be carried over.

Each item gives:

- **Preserve:** the exact behaviour, data or meaning to keep.
- **Evidence it works:** a smoke step in the Phase 0.5 baseline (#NN, `docs/baseline/SMOKE_TEST.md`) or, if it was not exercised, the code. The confirmation label follows [README.md](README.md).
- **Why it matters.**
- **Do not carry over:** known defects inside or next to it, with finding IDs.

---

## 1. Recruiting data and its meaning

### MNR-01 — The recruiting record set and its relationships
- **Preserve:**
  - The entities: candidates, client companies, contacts, job orders, the candidate-to-job pipelines, activities, calendar events, attachments with their extracted text, saved lists, tags and extra-field values.
  - How these link to each other, including "regarding" a job order.
  - All historical data.
- **Evidence it works:** **Runtime.** Every entity was created, linked, edited and viewed in the smoke run (#09–#37). The empty-install schema `db/cats_schema.sql` loaded with 0 errors and reached revision 364 (`docs/baseline/INSTALLATION.md`).
- **Why it matters:** the data is what users have built over years. The model fits agency recruiting.
- **Do not carry over:**
  - Records are linked by number without their type, so merges corrupt data (DB-001).
  - Deletes leave orphans (DB-004).
  - A vestigial multi-site column (DB-012).
  - Stored text is a mix of raw and HTML-encoded values (DB-026).
  - Old, non-transactional storage (DB-003, DB-008).

### MNR-02 — Pipeline status codes and their meanings
- **Preserve:** the status codes and labels, and which statuses offer an e-mail to the candidate by default:

  | Code | Label | E-mail offered by default |
  |---|---|---|
  | 100 | No Contact | no |
  | 200 | Contacted | no |
  | 250 | Candidate Responded | no |
  | 300 | Qualifying | yes |
  | 400 | Submitted | yes |
  | 500 | Interviewing | yes |
  | 600 | Offered | yes |
  | 650 | Not in Consideration | no |
  | 700 | Client Declined | no |
  | 800 | Placed | yes |
  | 0 | No Status | no |

  Existing data and every report are keyed on these codes.
- **Evidence it works:** **Runtime.** The status list and a change were exercised in #31. The seed rows are at `db/cats_schema.sql:267-277`.
- **Why it matters:** migrated pipelines and past reports only make sense if the codes keep their meaning.
- **Do not carry over:** the codes are hard-coded, with no transition rules and no admin control (FEAT-001).

### MNR-03 — Status-history semantics
- **Preserve:**
  - Exactly one history row (from, to, date) per real status change.
  - No row when the status does not change (`lib/Pipelines.php:324-330`).
  - A new pipeline starts at 100 with no history row.
  - A **submission** is a transition to 400 and a **placement** is a transition to 800; the submission and placement reports count these transitions.
- **Evidence it works:** **Runtime** for the change (#31, #32) and for the reports built on history (#49–#51).
- **Why it matters:** these rules define the historic KPIs users already rely on.
- **Do not carry over:**
  - Removing a pipeline or deleting a record erases its history, so past reports change silently (DB-013, FEAT-003).
  - Repeated transitions are double-counted (FEAT-008).
  - The two history tables use different keys (DB-018).

### MNR-04 — The "openings" rule
- **Preserve:**
  - Moving a candidate to Placed uses up one opening on the job order.
  - Moving a placed candidate to another status gives the opening back.
  - Placement is refused when no openings remain (`modules/candidates/CandidatesUI.php:2932-2942`, `:3089-3100`).
- **Evidence it works:** **Static**. It was not exercised; no candidate was placed in the smoke run.
- **Why it matters:** it is the only capacity control on a job order.
- **Do not carry over:**
  - The counter drifts, and filled jobs stay public (FEAT-025, WF-008).
  - The update is skipped when the status-change e-mail fails (WF-006, ARCH-027).

### MNR-05 — Automatic activity trail and change history
- **Preserve:**
  - The system writes activities without user effort, for example "Added candidate to job order.", "Status change: X" and "User applied through candidate portal … attached a new resume".
  - Every add, edit and delete writes field-level `history` rows.
  - Every login attempt is recorded (Login Activity).
- **Evidence it works:** **Runtime.** Activities in #31, #32 and #87; the Login Activity page in #62.
- **Why it matters:** this is the working record of who did what with a candidate, and the only audit trail today.
- **Do not carry over:**
  - The history is incomplete, can be changed and is not backed up (DB-016).
  - It holds personal data with no erasure path (DB-011, SEC-022).
  - Activities are left behind when records are deleted (DB-004).

---

## 2. Recruiter workflows

### MNR-06 — One action for a status change
- **Preserve:** a single step that does all of the following and then reports each outcome in plain text:
  - changes the pipeline status;
  - logs an activity whose note is pre-filled "Status change: X";
  - optionally sends a templated e-mail to the candidate;
  - optionally schedules a calendar event.
- **Evidence it works:** **Runtime.** The confirmation text in #31 and the activity row in #32. Code: `modules/candidates/AddActivityChangeStatusModal.tpl`, `js/activity.js:645-720`.
- **Why it matters:** this is the recruiter's most frequent action, and it is efficient today.
- **Do not carry over:**
  - The steps are not saved together, so a mail failure leaves the openings and the event unwritten (WF-006, ARCH-027).
  - The e-mail default differs depending on which side the change is made from (FEAT-018).
  - A mail failure ends in a fatal page (RT-04).

### MNR-07 — Candidate intake with resume text pre-fill
- **Preserve:**
  - On the add-candidate form, uploading a resume extracts its text into the form before saving.
  - The chosen file is attached even if the user skips "Upload" (`modules/candidates/CandidatesUI.php:2764-2800`).
  - Extraction built into the code covers TXT, RTF and DOCX.
- **Evidence it works:** **Runtime.** #22 pre-filled 186 characters; #23 saved the candidate.
- **Why it matters:** it makes adding a candidate fast.
- **Do not carry over:**
  - ODT extraction always fails because of an undefined variable (`lib/DocumentToText.php:166`; ARCH-018).
  - PDF, DOC and HTML need external tools whose paths are placeholders in the committed config (RT-08, FEAT-024).

### MNR-08 — Duplicate warning when adding a candidate
- **Preserve:**
  - On manual add, a warning appears when the first and last names match exactly and at least one more detail matches: middle name, any phone, any e-mail, or city plus address.
  - The user can then link the records as duplicates or dismiss the warning (`lib/Candidates.php:1136-1210`).
- **Evidence it works:** **Runtime** (#24).
- **Why it matters:** it prevents duplicate candidate records at the point of entry.
- **Do not carry over:**
  - The check ignores the site and runs only on manual add (FEAT-007).
  - Only administrators can resolve duplicates (WF-004).
  - **The merge implementation corrupts unrelated records** (DB-001, FEAT-002).

### MNR-09 — Resume keyword search
- **Preserve:**
  - Boolean AND/OR/NOT, wildcards and whole-word matching over the extracted text.
  - Matches are highlighted in the resume viewer.
  - A resume is searchable as soon as it is stored, including one uploaded on the careers site.
- **Evidence it works:** **Runtime.** TXT and DOCX content was found, and a negative control found nothing (#42, #44, #45). A careers-uploaded DOCX was found (#87). The word-boundary syntax works on MariaDB 10.7.8.
- **Why it matters:** this is the main way recruiters re-find candidates.
- **Do not carry over:**
  - The search is a full-table REGEXP scan with no text index (PERF-001).
  - Whether it works on MySQL 8 is unknown (DB-021).
  - A failed extraction stores no text and is never retried (DB-028).

### MNR-10 — Finding records again
- **Preserve:**
  - Quick search across candidates, companies, contacts and job orders in one box, with phone-number normalisation.
  - A search page for each module.
  - Recent and saved searches.
  - The "Recent" bar of the last records visited.
  - Candidate lists filtered to "Only My" and "Only Hot" candidates, and column choices that persist within a session.
- **Evidence it works:** **Runtime.** Quick search in #38; module searches in #39–#48; the Recent bar in #32 and #90.
- **Why it matters:** fast retrieval is most of a recruiter's day.
- **Do not carry over:**
  - Quick search and the Recent bar print record text unescaped (UX-006, SEC-005).
  - Saved column preferences are written but never restored at login, because of a wrong property assignment at `lib/Session.php:850`.
  - Quick search is unpaginated.

### MNR-11 — Candidate record on one page
- **Preserve:** one page for a candidate showing, together:
  - contact data;
  - attachments with a text preview;
  - pipelines with status and rating;
  - the lists the candidate is on;
  - the activity log;
  - upcoming events.
- **Evidence it works:** **Runtime** (#26, #32).
- **Why it matters:** a recruiter can see the whole candidate without switching screens.
- **Do not carry over:** a fixed-width, non-responsive layout (UX-001, RT-14).

### MNR-12 — Client and job intake conveniences
- **Preserve:**
  - Company autocomplete on the contact and job-order forms.
  - "Add Job Order" and "Add Contact" from a company page arrive with the company already selected.
  - "Copy existing job order".
  - "Add new candidate into this pipeline" from a job order (`modules/joborders/JobOrdersUI.php:1321-1416`).
  - Adding a candidate to a job order from either side.
- **Evidence it works:** **Runtime.** Autocomplete in #14 and #19; copy in #18; add to pipeline in #30.
- **Why it matters:** these are small savings on frequent tasks.
- **Do not carry over:** the rich-text job description does not start, because CKEditor 4.25.1 needs a commercial licence key (RT-07, UX-018).

### MNR-13 — Lists and flags
- **Preserve:** static saved lists of records, hot flags, and hierarchical tags.
- **Evidence it works:** **Runtime** for the Lists tab (#08). Tags and extra fields: the admin pages load (#69); the rest is **Static**.
- **Why it matters:** recruiters organise shortlists with them.
- **Do not carry over:**
  - "Selected" actions in data grids lose the user's selection, so they act on the wrong records: in #78 one candidate was ticked and two became recipients (UX-002, FEAT-020).
  - The tag filter hard-codes site 1 (`lib/Candidates.php:2250`).

### MNR-14 — Calendar linked to records
- **Preserve:**
  - Events linked to a candidate, contact or job order, with an event type.
  - Upcoming events shown on the dashboard and the candidate page.
  - Scheduling an event from a status change.
- **Evidence it works:** **Runtime** (#35–#37, #90).
- **Why it matters:** this is interview and follow-up tracking.
- **Do not carry over:**
  - "Private" events are sent to every user and hidden only in the browser (FEAT-004).
  - Reminders need a scheduler that nothing provides (FEAT-010, WF-007).
  - Edit and delete have no ownership check.

---

## 3. Candidate-facing capabilities

### MNR-15 — The careers application data flow
- **Preserve:** an application from the public careers site does all of the following:
  - creates the candidate, with source "Online Careers Website";
  - creates a pipeline row at status 100 on that job;
  - logs an "applied through candidate portal" activity with the resume attached;
  - makes the resume searchable;
  - notifies the applicant, the job owner and the recruiter through templates.

  A repeat application by the same e-mail address is detected: it is logged as "re-applied" and no second pipeline row is created.
- **Evidence it works:** **Runtime** (#84–#87). The notifications are shown in the code only; sending failed in the baseline because it has no SMTP server.
- **Why it matters:** this is the inbound applicant pipeline.
- **Do not carry over:**
  - The form trusts a candidate ID sent by the browser, so anyone can overwrite any candidate (SEC-024, API-002).
  - The resume is dropped silently unless "Upload" is clicked (RT-12).
  - The applicant sees a raw fatal error page when mail fails (RT-04, UX-023).
  - Questionnaire actions overwrite candidate data (FEAT-021).
  - The e-mail + surname + ZIP pseudo-login (SEC-025).
  - The site is blank until enabled (RT-16).

### MNR-16 — Which jobs are public
- **Preserve:** a job appears on the careers site and in the XML job feed when it is flagged Public **and** its status is in the configured sharing list (default: Active).
- **Evidence it works:** **Runtime.** The job was created in #19, appeared in #81 and #82, and was in the XML feed in #89.
- **Why it matters:** recruiters control publication with one flag.
- **Do not carry over:**
  - The feed names "CATS (www.catsone.com)" as the employer and "US" as the country, and double-encodes URLs (API-012).
  - The RSS feed is a fatal error, and the careers site links to it (RT-05).
  - Filled jobs stay listed (WF-008).

### MNR-17 — Screening questionnaires
- **Preserve:**
  - Questions of four types: text, checkbox, select and radio.
  - Actions per answer: set the source, add notes or key skills, mark hot, set active, set relocate.
  - A per-candidate log of answers, viewable on the candidate page.

  There is **no numeric scoring** in the code. The intent is that actions **add to** what the candidate record already holds.
- **Evidence it works:** **Static**. It was not exercised.
- **Why it matters:** it is lightweight screening that recruiters can configure.
- **Do not carry over:** the current actions **overwrite** the source, skills, notes, flags and EEO answers, and send a bogus "ownership change" e-mail to the applicant (FEAT-021).

---

## 4. Communication and compliance

### MNR-18 — E-mail templates with placeholders
- **Preserve:**
  - Seven system templates that administrators can edit and switch on or off one by one.
  - Their placeholder names:
    - globals: `%DATETIME%`, `%SITENAME%`, `%USERFULLNAME%`, `%USERMAIL%`;
    - candidate: `%CAND…%`;
    - job order: `%JBOD…%`;
    - company: `%CLNT…%`;
    - contact: `%CONT…%`.
- **Evidence it works:** **Runtime** for the templates page (#63). Placeholder filling is **Static** (`lib/EmailTemplates.php:249-278` and callers). Delivery was never verified: the baseline has no SMTP server.
- **Why it matters:** users have customised these texts.
- **Do not carry over:**
  - Sending runs inside the request and an uncaught failure is fatal (RT-04).
  - Bulk free-text mail puts every recipient in the To header (WF-010).

### MNR-19 — EEO capture and report
- **Preserve:**
  - Optional capture of EEO data (gender, ethnicity, veteran status, disability), switched on per site.
  - The per-user permission to see EEO data.
  - The EEO report.
- **Evidence it works:** **Runtime.** The EEO settings page loaded (#66) and the report preview rendered (#52).
- **Why it matters:** US users need it for compliance.
- **Do not carry over:**
  - The report and the full CSV export have no access check (SEC-022).
  - The permission is enforced only in templates.
  - A JavaScript error on the report page (RT-10).
  - Questionnaire actions blank the EEO answers (FEAT-021).

### MNR-20 — Submission and placement reports
- **Preserve:** report definitions based on status transitions (MNR-03), by period.
- **Evidence it works:** **Runtime** (#49–#51).
- **Why it matters:** continuity of the numbers users report.
- **Do not carry over:**
  - Counts come from history rows that can be changed (FEAT-008, DB-013).
  - An `'OnHold'` typo in the statistics filter.
  - The job-order PDF report fetches its own public URL over HTTP to embed a graph (RT-09, ARCH-026).

---

## 5. Administration, access and integration

### MNR-21 — Access levels and their names
- **Preserve:**
  - Stored user rights use nine levels: DELETED −100, DISABLED 0, READ 100, EDIT 200, DELETE 300, DEMO 350, SA 400, MULTI_SA 450, ROOT 500 (`constants.php:74-82`).
  - The per-action checks that exist in the core modules (candidates, companies, contacts, job orders, calendar).
  - The generic "Invalid username or password." message on a failed login.
- **Evidence it works:** **Runtime** for the login message (#02) and user management (#74). The per-level behaviour is **Static**, because only the administrator account was used.
- **Why it matters:** the stored rights of every existing user map onto these levels.
- **Do not carry over:**
  - AJAX, reports, lists, export, import revert and the test module check only that someone is logged in (SEC-026, FEAT-006).
  - There is no clamp on the level an administrator can grant (SEC-013).
  - The default `admin`/`admin` login (SEC-003).

### MNR-22 — CSV import with revert, and export
- **Preserve:**
  - Every imported row is stamped with an `import_id`.
  - "Revert" removes exactly that import: its rows, the extra-field values and settings it created, and companies auto-created for contacts (`modules/import/Import.php:203-260`).
  - CSV export of records, and vCard export of contacts.
- **Evidence it works:** **Static**. Not exercised.
- **Why it matters:** revert is a safe undo for bulk loads, and export is the user's way out of the system.
- **Do not carry over:**
  - Revert has no access check (`modules/import/ImportUI.php:69-70`).
  - Revert leaves orphan rows (WF-005).
  - CSV exports do not neutralise spreadsheet formulas (SEC-031).
  - "Export selected" loses the selection (UX-002).

### MNR-23 — LDAP sign-in
- **Preserve:** sign-in against an existing LDAP directory, as an option next to local accounts.
- **Evidence it works:** **Static**. Not exercised: no directory is available.
- **Why it matters:** it is the only external identity source today.
- **Do not carry over:**
  - The username is not escaped in the LDAP filter, and TLS is not required (SEC-006).
  - A public test LDAP host is committed as the default (SEC-018).

### MNR-24 — Licence attribution
- **Preserve:**
  - The "Powered by OpenCATS" attribution.
  - The CPL 1.1a / MPL 2.0 notices required by `LICENSE.md` (context: `docs/transformation/LICENSE_AND_DISTRIBUTION_ANALYSIS.md`; not legal advice).
- **Evidence it works:** **Runtime**. The footer shows on every recruiter page (`docs/baseline/CURRENT_UI_MAP.md` §1).
- **Why it matters:** it is a legal obligation, not a feature.

---

## 6. Sound practices already in the code

These are small, but they are correct and worth keeping as rules:

| Practice | Where | Caveat |
|---|---|---|
| SQL values escaped through `makeQueryString` / `makeQueryInteger` in most queries | `lib/DatabaseConnection.php` | The DataGrid bypasses it for sort direction and tag lists (SEC-016). `makeQueryStringOrNULL` turns the string `"0"` into NULL (`:508-516`). |
| Escape-at-render helper `$this->_()` (892 uses) | `lib/Template.php:51-54` | Many fields are escaped at input instead, which causes double-encoding (SEC-005, DB-026). |
| Upload file names normalised: directories stripped, extension allowlist, anything else gets `.txt` | `makeSafeFilename` | `html` is on the allowlist (SEC-009). |
| `escapeshellarg` on converter calls | `lib/DocumentToText.php` | Tool paths are placeholders (RT-08). |
| Generic failed-login message | #02 | No throttling (SEC-014). |

---

## 7. Behaviours that exist today and must NOT be carried over

Listed so that "keep the behaviour" is never read as "keep the defect".

| Current behaviour | Finding |
|---|---|
| Candidate merge re-links records of other types that share the same number | DB-001, FEAT-002 |
| Public apply form trusts a candidate ID sent by the browser | SEC-024, API-002 |
| Fresh install accepts `admin`/`admin` and never forces a change | SEC-003, WF-001 |
| Unsalted MD5 passwords; forgot-password is designed to e-mail the password (and is a fatal error today) | SEC-001, SEC-002, RT-03 |
| No CSRF protection; AJAX checks login only | SEC-004, SEC-026 |
| Data-grid sort direction concatenated into SQL | SEC-016 |
| Stored files served from the web root without a session under nginx | SEC-008, RT-17 |
| Deletes erase status history and change past reports | DB-013, FEAT-003 |
| Schema migrations run inside web requests, as `eval`'d strings | DB-006, ARCH-005, RT-01 |
| Database errors never detected; fatals served as HTTP 200 with stack traces | DB-002, ARCH-020, RT-15 |
| Extension hooks and renderers executed with `eval` | ARCH-004, FEAT-015 |
| Multi-step writes with no transaction (status change, application) | ARCH-027, WF-006 |
| Bulk "Selected" actions act on unselected records | UX-002, FEAT-020 |
| Bulk e-mail exposes all recipients to each other | WF-010 |
| Careers resume dropped silently; applicant shown a stack trace | RT-12, RT-04, UX-023/024 |
| Questionnaire actions overwrite candidate data and EEO answers | FEAT-021 |
| Absolute URLs built from the client's `Host` header | SEC-030, ARCH-026 |
| Resume text sent over plain HTTP to a defunct parsing service | SEC-017, API-010 |
| XML feed publishes "CATS (www.catsone.com)" as the employer | API-012 |
| Hard-coded site 1 in the tag filter; vestigial multi-site model | DB-012 |
