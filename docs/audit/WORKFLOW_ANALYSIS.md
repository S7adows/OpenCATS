# OpenCATS — Current Workflow Analysis
Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **What this is:** a description of how work actually flows through OpenCATS today, end to end, for twelve workflows (W1–W12), with the defects that sit on those flows. It is new in this edition.
- **Runtime evidence:** the Phase 0.5 baseline (`docs/baseline/`): `SMOKE_TEST.md` step numbers (#NN), screenshots `screenshots/NN-*.png` and `S1`–`S6`, `KNOWN_RUNTIME_ERRORS.md` (RT-01…RT-17), `CURRENT_UI_MAP.md`, `INSTALLATION.md`, and `evidence/final-run/` (`results.json`, `console-summary.log`, `php_errors.log`). The baseline used PHP 7.2.16 / nginx / MariaDB, an empty install, fictional data and **only the administrator account** (level 500); no SMTP server existed.
- **Code evidence:** controllers and templates under `modules/`, libraries under `lib/`, the schema `db/cats_schema.sql`, `config.php`, `constants.php`. Read with `sed -n`, `grep -n`; no code was run for this document.
- **Step counts:** "loads" counts top-level document loads including popup (iframe) loads and redirects; AJAX calls are not counted. Counts are taken from the smoke run where the step was exercised, otherwise from the code path.
- **Confirmation:** steps and findings seen in the baseline are **Runtime**; flows derived only from code are **Static**; where a flow was run but the finding's consequence on that path was inferred, the finding is **Partial** and says which part is which.
- **Not done:** no new runtime testing, no multi-user permission testing, no real e-mail delivery, no LDAP, no import or backup execution. Findings stay at finding level; no redesign, strategy or roadmap.
- **Relation to other documents:** UI-level defects are owned by `UX_UI_AUDIT.md` (UX-xxx) and product-feature defects by `FEATURE_INVENTORY.md` (FEAT-xxx); this document cites them on the step where they bite and raises WF-xxx findings only for flow-level problems (broken steps, partial writes, data-loss points, missing handoffs).

## Summary

### Workflow status

| Workflow | Runtime status | Main evidence |
|---|---|---|
| W1 Installation and first-run administration | Partly broken | empty install works; demo path fatal (RT-01); test e-mail fatal (#77); web installer UI not exercised |
| W2 Client and job intake | Works with errors | #10–#20; PHP warnings on company page (RT-06); editor does not start (RT-07) |
| W3 Candidate intake (recruiter side) | Works | manual add, resume text pre-fill, duplicate notice (#21–#25); CSV import and self-registration not exercised |
| W4 Pipeline management | Works | add to job order (#30), status change with activity (#31, #32) — exercised with the e-mail box unchecked only |
| W5 Interviews and calendar | Works | event add/view (#35–#37), shown on dashboard (#90); reminders unavailable without a scheduler |
| W6 Submission, offer, placement | Not exercised in baseline | statuses listed in the popup (#31); reports ran with no placements (#50, #51) |
| W7 Candidate communication | Broken | every send ended in a PHP fatal (#77, #79; RT-04); compose addressed to unselected rows (#78) |
| W8 Search and retrieval | Works with errors | quick and module searches (#38–#48); PDF resumes not searchable (#43, RT-08) |
| W9 Reporting | Partly broken | reports and EEO render (#49–#52); job-order PDF fails in this topology (#54, RT-09); EEO page JS error (RT-10) |
| W10 Data maintenance | Works | edit (#33); delete, merge, export and backup not exercised |
| W11 Applicant experience (careers) | Partly broken | browse and apply work (#80–#84); applicant sees a fatal (#85, #86); resume dropped without "Upload" (RT-12); RSS fatal (RT-05) |
| W12 User and access administration | Partly broken | add user works (#74); forgot password fatal (#04, RT-03); LDAP and non-admin roles not exercised |

### Workflow map

```
 W1 install & first-run admin ──> W12 users & access
 W2 company ─> contact ─> job order ──(Public, status Active)──> W11 careers site
                              │                                        │ apply
                              ▼                                        ▼
 W3 recruiter intake ─────> W4 pipeline row at 100 No Contact  <───────┘
                              │  any status → any status (no enforced order)
                              ▼
        200 / 250 / 300 ─> 400 Submitted ─> 500 Interviewing ─> 600 Offered ─> 800 Placed (W6)
        side exits: 650 Not in Consideration, 700 Client Declined
   each change: activity + status history (+ optional candidate e-mail W7, + optional event W5)
 W8 search / lists / MRU and W9 reports read all of this; W10 edits, deletes, exports, backs up.
```

### Findings

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| WF-001 | Fresh install keeps admin/admin and the first-run wizard never asks to change it | HIGH | Runtime |
| WF-002 | E-mail is a hard dependency of core workflows but cannot be configured or checked from the UI | MEDIUM | Runtime |
| WF-003 | Demo-data install path leaves every page fatal; first request on an unseeded database half-builds the schema | MEDIUM | Runtime |
| WF-004 | Duplicate candidates are created and flagged, but only an administrator can resolve them and merge is unsafe | MEDIUM | Runtime |
| WF-005 | Import revert deletes imported records but leaves their pipelines, attachments and activities behind | MEDIUM | Static |
| WF-006 | Status change with candidate e-mail stops half-way when mail fails: openings and the scheduled event are not updated | HIGH | Partial |
| WF-007 | Scheduled interviews stay internal; reminder e-mails need a scheduler the product does not ship | MEDIUM | Partial |
| WF-008 | Placement does not close the loop on the job order: filled jobs stay public and the openings counter drifts | MEDIUM | Static |
| WF-009 | Submission to the client is not recorded against or sent to the client contact | LOW | Static |
| WF-010 | Free-text bulk e-mail sends one message with every recipient in the To header | HIGH | Static |
| WF-011 | Backups can be created in the UI but restored only through the installer with server file access | MEDIUM | Static |
| WF-012 | New-applicant notification to the job owner and recruiter is lost when the applicant's e-mail fails | MEDIUM | Runtime |
| WF-013 | A returning applicant's new contact details are silently discarded | MEDIUM | Static |
| WF-014 | No offboarding path: users cannot be deleted and their records cannot be reassigned | MEDIUM | Static |
| WF-015 | Account onboarding and recovery depend entirely on an administrator acting out of band | MEDIUM | Runtime |

15 findings — 0 CRITICAL / 3 HIGH / 11 MEDIUM / 1 LOW · Runtime 6 / Static 7 / Partial 2 / Unverified 0 (no withdrawn or merged stubs).

## Actors and access levels

OpenCATS has one kind of logged-in user (a recruiting-team member) whose rights come from a single global **access level**, optionally adjusted per module by a user **category** (`config.php:346-366` `ACL_SETUP`; `lib/ACL.php:52`). The public careers site has anonymous applicants. Client contacts are records, not users; there is no client or hiring-manager login.

| Level | Name (seed `db/cats_schema.sql:26-31`) | What it unlocks in the workflows below | Evidence |
|---|---|---|---|
| 0 | Account Disabled | cannot log in; also the state of a first-time LDAP user awaiting approval | `constants.php:75`; `lib/Users.php:846-851` |
| 100 | Read Only | view lists, records, reports, searches; **export any grid** (no check in `ExportUI.php`); create/rename/delete saved lists (AJAX needs only a session) | `constants.php:76`; FEATURE_INVENTORY 2.9, 2.12 |
| 200 | Add / Edit | add/edit candidates, companies, contacts, job orders; add to pipeline; change status; log activities; schedule events; upload attachments; run imports | `CandidatesUI.php:97,113,184,208`; `ImportUI.php:411` |
| 300 | Add / Edit / Delete | delete records, remove from pipeline, delete attachments and events | `CandidatesUI.php:129,225,279` |
| 350 | Demo | demo accounts: may open most settings pages read-only; cannot send e-mail | `constants.php:79`; `CandidatesUI.php:3064`; not seeded in `access_level` |
| 400 | Site Administrator | settings changes, user management, **bulk e-mail**, duplicate link/merge/dismiss, backups, tag admin, "show other users' calendar entries" | `CandidatesUI.php:298-305,317-357`; `SettingsUI.php` gates |
| 500 | Root | all of the above plus version-check and passwords pages; the seeded `admin` user is level 500 | `db/cats_schema.sql:1108` |

Other actors:
- **Anonymous applicant** — browses and applies on `careers/index.php`; with "candidate registration" enabled, can "log in" by e-mail plus template fields (UX-007).
- **Automated user** `cats@rootadmin` (user 1250, site 180) — recorded as owner and author of everything the careers site creates, and as the sender of careers e-mails (`CareersUI.php:1255`, `lib/Users.php:1192-1199`).
- **Queue processor** (`QueueCLI.php`, meant for cron) — sends calendar reminders; not shipped with a cron entry (FEAT-010).
- `450` (`ACCESS_LEVEL_MULTI_SA`) exists as a constant for hosted multi-site "administrative hide" and is not assignable in the add-user form (the form offers six levels, #74).
- Runtime note: only level 500 was used in the baseline; a second user (riley.test) was created (#74) but never logged in, so **no permission difference was exercised**.

## 1. W1 — Installation and first-run administration

- **Purpose:** get a working, secured instance with users, e-mail and (optionally) the careers site.
- **Actors:** installer operator (shell/web access), Root administrator (500).
- **Entry points:** `installwizard.php` (web installer, writes `config.php` and loads `db/cats_schema.sql`); first request to `index.php` (runs module schema migrations); `index.php?m=login`; `m=settings&a=administration`, `a=careerPortalSettings`, `a=emailSettings`, `a=emailTemplates`, `a=manageUsers`.

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | Run web installer: environment tests, DB create/load, config write, "Finishing Installation" page tells the operator to log in with **admin / admin** | `installwizard.php` | several | not exercised (INSTALLATION.md §3); text at `installwizard.php:413-419` |
| 1a | Baseline equivalent: scripted DB seed (empty path), first `GET /index.php` runs migration install 363→364 (MD5-hashes the seeded `admin` password), finalize sets from-address, `configured=1`, date format, time zone | — | 1 | INSTALLATION.md §1 steps 5a–5c |
| 2 | Log in as admin/admin → lands directly on the Dashboard | `m=login&a=attemptLogin` → `m=home` | 2 | #05 |
| 3 | Settings → Administration hub | `m=settings&a=administration` | 2 | #57 |
| 4 | Optional: site name, localization (saving forces logout) | `s=siteName`, `s=localization` | 1 each | #59, #64 |
| 5 | Careers Website: enable (portal is blank until then) | `a=careerPortalSettings` | 1 + postback | #75 (enabled after reload); RT-16 |
| 6 | E-mail settings: on/off, from-address, per-status defaults, **Send Test E-Mail** | `a=emailSettings` | 1 (+AJAX test) | #76; #77 test → fatal with stack trace (RT-04) |
| 7 | E-mail templates: edit the 7 system templates | `a=emailTemplates` | 1 | #63 (page only) |
| 8 | Users: User Management → Add User → user page | `a=manageUsers` → `a=addUser` → `a=showUser` | 4 | #60, #61, #74 (see W12) |
| 9 | Optional: EEO, tags, extra fields, calendar settings | `a=eeo`, `a=tags`, … | 1 each | #66–#69 (pages only) |

- **Step count:** after install, a minimal secured setup (steps 2–8) is about 12 page loads; step 6 cannot be completed from the UI (WF-002).
- **Data written:** `site`, `settings` (careers enabled, mail settings, from-address), `email_template`, `user`, `user_login` (every login attempt), `module_schema` (migrations).
- **Side effects:** first request after install applies pending migrations (RT-02 if the DB is empty); the Dashboard calls a daily version check to catsone.com (`HomeUI.php:95`, FEAT-012).
- **Runtime status:** Partly broken — the empty-database install and all admin pages work (#57–#76, HTTP 200, no PHP errors); the demo-data path is fatal (RT-01); the e-mail test is fatal (#77); the web installer UI itself was not exercised.

First-login wizard pages and what triggers them (`modules/login/LoginUI.php:290-345`):

| Page | Shown when | On a default empty install |
|---|---|---|
| Welcome / Setup Users | `site.first_time_setup` set | not shown (seed 0) |
| License | licence not agreed | not shown (seed 1) |
| Password | username `admin` **and** password `cats` | not shown (password is `admin`) — WF-001 |
| E-mail | user has no e-mail | not shown (seed `admin@testdomain.com`) |
| Site name | level ≥ 400 and site name `default_site` | not shown (seed `testdomain.com`) |
| "E-Mail Disabled" notice | level ≥ 400 and mail `configured = 0` | depends on the installer's mail step |

Settings a first-run administrator cannot change in the UI (they live in `config.php`, which the installer writes):

| Setting | Shipped value | Workflow affected | Evidence |
|---|---|---|---|
| SMTP host, port, auth, user, password, TLS | `localhost`, 587, auth on, `user`/`password`, TLS | every e-mail (W4, W7, W11) | `config.php:208-225` |
| Resume text tools (`pdftotext`, `antiword`, `html2text`, `unrtf`) | Windows-style placeholder paths | PDF/DOC resume search (W8) | `config.php:62-81`; RT-08 |
| Authentication mode and LDAP server | `sql`; LDAP defaults point to a public test directory | login (W12) | `config.php:48,266-278` |
| Resume parsing | `PARSING_ENABLED` false (UI still shows parse controls) | intake (W3, W11) | `config.php:51`; UX-017 |
| Job-order status groups, sharing and statistics statuses | only by uncommenting PHP arrays | W2, W6, W9 | `config.php:292-325`; `lib/JobOrderStatuses.php:40-55` |
| MRU size, recent-search size | 5, 5 | W8 | `config.php:121,127` |

### WF-001 — Fresh install keeps admin/admin and the first-run wizard never asks to change it
*Confirmation: **Runtime** · New in this edition · Related: SEC area, UX-022*

- **Confirmed fact:** A new install's administrator logs in with admin/admin and lands on the Dashboard; the first-run wizard's password page only appears when the password is `cats`.
- **Evidence:**
  - Runtime #05: login "admin/admin" → `/index.php?m=home` (no wizard, no password prompt); INSTALLATION.md §4 "Default credentials after install: admin / admin".
  - `db/cats_schema.sql:1108` seeds user `admin` with password `admin` (level 500); `installwizard.php:418-419` tells the operator "Username: admin / Password: admin".
  - `modules/login/LoginUI.php:332` adds the "Password" wizard page only if `$password === DEFAULT_ADMIN_PASSWORD`, and `constants.php:178` defines that as `'cats'`; `:392-395` redirects to `newInstallPassword` under the same condition.
  - The other wizard pages do not trigger on this seed either: `site.first_time_setup = 0`, `agreed_to_license = 1`, admin e-mail set, site name `testdomain.com` (`db/cats_schema.sql:1017,1108`; `LoginUI.php:290-340`).
- **Impact:** Unless the operator changes the password on their own initiative, every fresh install is reachable with published credentials; the login page script also advertises default accounts (UX-022).
- **Severity:** HIGH — account compromise with a common precondition (operator does not change the default).
- **Recommendation:** The first-run flow should force a password change whenever the seeded default is still in use, whatever its value; today the check compares against a password the installer never sets.
- **Unknown / needs further validation:** Whether the web installer (not clicked through in the baseline) changes the admin password in any branch; `grep` found only the `'cats'` check (`modules/install/ajax/ui.php:1048`). Needs one run of the real installer on an isolated instance.

### WF-002 — E-mail is a hard dependency of core workflows but cannot be configured or checked from the UI
*Confirmation: **Runtime** · New in this edition · Related: RT-04, RT-15, WF-006, WF-012, UX-013, UX-023*

- **Confirmed fact:** SMTP host, port and credentials exist only in `config.php`; the E-Mail Settings page offers on/off, from-address, per-status defaults and a test button, and the test button returns a PHP stack trace when the relay is unreachable. Every e-mail send path is synchronous and has no exception handling.
- **Evidence:**
  - `config.php:208-225` — `MAIL_MAILER 3` (SMTP), `MAIL_SMTP_HOST "localhost"`, port 587, TLS, `MAIL_SMTP_USER "user"`, `MAIL_SMTP_PASS "password"`.
  - `modules/settings/EmailSettings.tpl` — form fields: `configured`, `fromAddress`, `statusChange*` (8), `testEmailAddress`, `test`; no host/port/user/password fields.
  - Runtime #76 (settings page), #77 (test → "An error occurred. Fatal error: Uncaught PHPMailer…Exception" with stack trace); #79 (bulk e-mail → full-page fatal); #85/#86 (careers apply → applicant sees fatal). `php_errors.log`: 4 PHPMailer fatals. `lib/Mailer.php:241` calls `PHPMailer::send()` without try/catch.
  - Static paths with the same call and no guard: status-change e-mail (`lib/Pipelines.php:367-378`), owner-change e-mails sent inside the record update, after the row is written (`lib/Candidates.php:345`, `lib/Companies.php:196`, `lib/Contacts.php:283`, `lib/JobOrders.php:254`); calendar reminders (`lib/Calendar.php:952`).
- **Impact:** An administrator cannot finish or verify e-mail setup inside the product. Until someone edits `config.php`, every workflow step that sends mail (status changes with the e-mail box ticked, owner changes, bulk e-mail, careers applications) ends on a fatal page, usually after the data was saved.
- **Severity:** MEDIUM — setup cannot be completed in the product and several workflows degrade; the data-integrity consequence is rated separately in WF-006.
- **Recommendation:** Let administrators see and test the full mail configuration from the settings page, and make a failed send a reported condition rather than a fatal error, so a mail outage cannot abort unrelated saves.
- **Unknown / needs further validation:** Behaviour with a reachable relay; and whether unticking "use this template" on the E-Mail Templates page (read at `lib/EmailTemplates.php:353-360`) reliably skips each send path — needs a run with a test relay on an isolated instance.

### WF-003 — Demo-data install path leaves every page fatal; first request on an unseeded database half-builds the schema
*Confirmation: **Runtime** · New in this edition · Related: RT-01, RT-02, DATABASE area, DEPENDENCY area*

- **Confirmed fact:** Installing with the bundled demo data produces an application that fatals on every request on PHP 7.2; starting the app before the database is loaded renders 24 warnings and creates 16 tables in the empty schema.
- **Evidence:** RT-01: migration `'225'` (`modules/install/Schema.php:702`, call `:725`) and `'341'` (`:1232`, call `:1236`) call the removed `mysql_real_escape_string()`; the version is not advanced, so the next request dies again; `evidence/demo-data-path/`. Also `db/upgrade-0.9.4-0.9.5.sql` fails with `Unknown column 'questionnaire_id'` and the installer ignores the error. RT-02: `evidence/empty-db-before-seed/first-request.html`.
- **Impact:** An evaluator who picks "demo data" gets a dead instance; an operator who starts containers before seeding gets a half-built schema. **Inference (RT-01):** any upgrade of a pre-225 database on PHP 7 hits the same fatal.
- **Severity:** MEDIUM — an install path is broken; the empty-database path works.
- **Recommendation:** The installer should refuse or repair these paths instead of leaving a site that fails on every request, and should stop ignoring SQL errors during upgrade.
- **Unknown / needs further validation:** The upgrade-from-old-database case is inferred; needs a restore of a pre-225 backup on an isolated instance.

## 2. W2 — Client and job intake

- **Purpose:** record a client company, its contacts, and an open requisition (job order), optionally copied from an earlier one, optionally published to the careers site.
- **Actors:** Add/Edit (200) and above.
- **Entry points:** `m=companies&a=add`; `m=contacts&a=add` (or "Add Contact" on the company page, `companies/Show.tpl:389`, pre-selects the company); `m=joborders` → sub-tab "Add Job Order" → popup `a=addJobOrderPopup` → `a=add[&typeOfAdd=existing&jobOrderID=]`; or "Add Job Order" on the company page (`companies/Show.tpl:289`, `a=add&selected_company_id=`, skips the popup).

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | Companies tab → Add Company → fill name, address block, phones, URL, key technologies, notes, Hot → Save | `m=companies&a=add` → `a=show&companyID=` | 3 | #09, #10 |
| 2 | Company detail shows fields, job-order and contact grids — with three PHP warnings at the top | `a=show` | (same) | #10, #11 (RT-06) |
| 3 | Contacts tab → Add Contact → type company name, pick from AJAX suggest list (sets hidden `companyID`) → fill name, title, e-mails, phones → Save | `m=contacts&a=add` → `a=show&contactID=` | 3 | #14 ("autocomplete: clicked; #companyID=2") |
| 4 | Job Orders tab → "Add Job Order" popup: Empty / Copy Existing (select of **all** job orders) → Create Job Order (parent navigates) | popup `a=addJobOrderPopup` → `a=add` | 3 | #17, #18 |
| 5 | Fill title, company (AJAX suggest), contact (loaded for that company), type, openings, recruiter, owner, Hot, **Public**, description (editor does not start → plain textarea), internal notes, questionnaire (if careers enabled) → Add Job Order | `a=add` → `a=show&jobOrderID=` | 2 | #19, `S1` (RT-07) |
| 6 | Job order detail: fields, attachments, pipeline graph and grid, actions (Edit, Delete, Generate Report, View History, Add Candidate to This Job Order Pipeline, Online Application link if public and careers enabled) | `a=show` | (same) | #20; `joborders/Show.tpl:349-351` |

- **Step count:** company + contact + job order ≈ 11 page loads and 3 popup/AJAX interactions; starting the job order from the company page saves the popup load.
- **Data written:** `company` (+ `company_department`), `contact`, `joborder`, `extra_field`, `history` (new-record rows, `lib/Companies.php:108`, `lib/Contacts.php:171-172`, `lib/JobOrders.php:132`).
- **Side effects:** MRU entry on each detail view (#32 "Recent:" bar); a public job in a sharing status (default: `Active` only, `lib/JobOrderStatuses.php:52`; new jobs default to `Active`, `:54`) appears on the careers site, RSS and XML feeds once careers is enabled (#81, #89); changing an owner later sends a synchronous "ownership assigned" e-mail (WF-002).
- **Runtime status:** Works with errors — all records were created (#10, #14, #19); company detail prints PHP warnings (RT-06); the description editor does not start (RT-07).
- **Findings:** no new flow-level finding. Existing findings on this flow: job order requires a pre-existing company, copy-from lists all job orders, Reset next to Save (UX-021); names with `&` or `'` are stored escaped on first save (UX-003); editor (UX-018); warnings (UX-013); company delete cascades (FEAT-003, see W10).

## 3. W3 — Candidate intake (recruiter side)

- **Purpose:** get candidates into the database with contact data and a searchable resume, without creating duplicates.
- **Actors:** Add/Edit (200) and above; Site Administrator (400) for duplicate resolution; any logged-in user can revert an import.
- **Entry points:** `m=candidates&a=add`; `m=joborders&a=addCandidateModal` (create and add to a pipeline in one step, `JobOrdersUI.php:1321-1416`); `m=import` (CSV/tab import wizard); `m=import&a=massImport` (server-directory resume import); careers applications and self-registration are in W11.

**Manual add (exercised):**

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | Candidates tab | `m=candidates` | 1 | #21 |
| 2 | "Add Candidate" sub-tab | `a=add` | 1 | #22 |
| 3 | Choose a resume file; optionally click **Upload**: the page re-posts and the extracted text appears in the text box | `a=add` (postback) | +1 | #22 ("documentText length after upload: 186") |
| 4 | Optionally click the "transfer" arrow to parse text into fields (third-party service, disabled by config) | postback | +1 | not exercised; UX-017 |
| 5 | Type the fields; e-mail fields run an AJAX duplicate check on change | — | AJAX | `candidates/Add.tpl:163` (`checkEmailAlreadyInSystem`) |
| 6 | "Add Candidate" → saved; the chosen file is attached even if Upload was not clicked | POST → `a=show` | 2 | #23; `CandidatesUI.php:2764-2800` |
| 7 | If first **and** last name match an existing record plus a phone, e-mail, middle name or address: the record is still created and flagged; the detail page shows a duplicate notice and "Link duplicate" | `a=show&candidateID=3` | (same) | #24 ("duplicate notice: yes"); `lib/Candidates.php:1136-1210` |

- **Step count:** 4 loads minimum; 5–6 with Upload/parse. About 30 fields on one page.
- **Data written:** `candidate`, `attachment` (with extracted text for search), `candidate_duplicates`, `extra_field`, `history` (new record, `lib/Candidates.php:210-211`), `activity` type 400 "Added a new candidate." (`CandidatesUI.php:1046-1054`; visible in #32).
- **Side effects:** MRU entry; resume text becomes searchable (#42, #44); PDF text is not extracted with the shipped config (RT-08).

**CSV / tab import (not exercised; from code):** `m=import` → choose type (Candidates, Job Orders, Companies, Contacts; `Import1.tpl`) → upload file (`Import2.tpl`) → map columns, optionally create extra fields and auto-create companies (`Import.tpl`) → commit (`onImport()`, `ImportUI.php:409`) → recent imports list with errors and **Revert** (`ImportRecent.tpl`, `a=revert`). Each row is stamped with `import_id`. No duplicate check runs on import (FEAT-007). Page #73 loads.

**Mass resume import (not exercised):** files must first be copied into `upload/<site>/massimport` on the server (`MassImportStep1.tpl:14-41`), then a 4-step wizard creates candidates.

**Candidate self-registration and "login" on the careers site (not exercised; from code; off by default, `lib/CareerPortal.php:79`):**

| # | Step | Screen / URL | Evidence |
|---|---|---|---|
| 1 | With "candidate registration" enabled, "Apply to Position" leads to a registration page instead of the form, unless a cookie already identifies the applicant | `?p=candidateRegistration&ID=` | `CareersUI.php:836-846` |
| 2 | Applicant chooses "new" or "registered"; a registered applicant types e-mail plus the template's other fields (default: last name and ZIP); "remember me" is pre-checked | same | `CareersUI.php:359-411`, `:370-372`; `db/cats_schema.sql:440` |
| 3 | Fields are matched against `candidate` columns; on a match a cookie holding the typed values is set for two weeks | POST | `CareersUI.php:1635-1735` (`:1728`) |
| 4 | Apply form is pre-filled from the matched record; submit updates that candidate (`Candidates::update`) and applies | `?p=applyToJob` → `onApplyToJobOrder` | `CareersUI.php:1284-1293` (argument order issue: API-003) |
| 5 | "Registered candidate profile": view and edit own data, see and replace the latest resume, log out | `?p=registeredCandidateProfile` | `CareersUI.php:183-358` |

The identity check is knowledge of e-mail, surname and ZIP (UX-007, FEAT-005).

- **Runtime status:** Works — manual add, resume pre-fill, attachment and duplicate notice (#21–#25); import and mass import not exercised in baseline.

### WF-004 — Duplicate candidates are created and flagged, but only an administrator can resolve them and merge is unsafe
*Confirmation: **Runtime** · New in this edition · Related: FEAT-002, FEAT-007, UX-020*

- **Confirmed fact:** Adding a candidate who matches an existing one creates a second record and shows a notice; linking, dismissing and merging duplicates all require level 400, and the merge routine is known to corrupt unrelated records.
- **Evidence:**
  - Runtime #24: adding the same name and e-mail again created candidate 3 with a duplicate notice. Both records then appear as identical entries: "Recent: Alex Baseline-Test | Alex Baseline-Test" (#32) and two identical addresses on the e-mail compose page (#78).
  - `CandidatesUI.php:317-357` — `linkDuplicate`, `merge`, `mergeInfo`, `removeDuplicity`, `addDuplicates` all require `ACCESS_LEVEL_SA`.
  - FEAT-002 — `lib/Candidates.php:1314-1359` moves activities, attachments and events by numeric id without the data-item type.
  - `candidates/Duplicates.tpl` (a duplicates worklist) is never rendered (UX-020).
- **Impact:** Recruiters (200/300) can see the warning but cannot act on it; duplicates accumulate and split pipelines, activities and e-mails across two records. The only resolution tool can damage other records.
- **Severity:** MEDIUM — data quality degrades in the core intake flow; no immediate loss.
- **Recommendation:** Give the people who meet the duplicate notice a safe way to resolve it (or to hand it to someone who can), because today the flow ends at a warning that most users cannot act on.
- **Unknown / needs further validation:** Merge was not exercised; its behaviour needs a test on an isolated copy with overlapping ids across entity types.

### WF-005 — Import revert deletes imported records but leaves their pipelines, attachments and activities behind
*Confirmation: **Static** · New in this edition · Related: FEAT-003, FEATURE_INVENTORY 2.11*

- **Confirmed fact:** Revert deletes rows with the import's `import_id` from the target table, created extra fields and auto-created companies; it does not touch rows that other workflows attached to those records after the import. The revert action has no access-level check.
- **Evidence:** `modules/import/Import.php:203-260` — four `DELETE` statements (`extra_field_settings`, the entity table, `extra_field`, `company`), none on `candidate_joborder`, `candidate_joborder_status_history`, `attachment`, `activity`, `saved_list_entry` or `calendar_event`; `modules/import/ImportUI.php:69-70` calls `revert()` with no `getUserAccessLevel` check.
- **Impact:** If recruiters started working imported candidates (pipelines, notes, lists) before someone reverts, those rows stay behind pointing at deleted ids; pipeline counts and reports then include records that no longer exist. Any logged-in user, including Read Only, can trigger it.
- **Severity:** MEDIUM — data-integrity risk in a maintenance path.
- **Recommendation:** Revert should either remove or refuse to orphan dependent rows, and should require the same level as deleting records.
- **Unknown / needs further validation:** Import and revert were not exercised; confirm on an isolated instance by importing, adding one imported candidate to a pipeline, then reverting.

## 4. W4 — Pipeline management

- **Purpose:** move a candidate through a job order's pipeline (status 100 → 800), with a note, an optional candidate e-mail and an optional event.
- **Actors:** Add/Edit (200) to add and change status; Delete (300) to remove from a pipeline.
- **Entry points:** candidate detail "Add This Candidate to Job Order" (`candidates/Show.tpl:561`) → popup `m=candidates&a=considerForJobSearch` → `a=addToPipeline`; job order detail "Add Candidate to This Job Order Pipeline" (`joborders/Show.tpl:419`) → popup `m=joborders&a=considerCandidateSearch` (name search) or `a=addCandidateModal`; candidate list selection → "Add To Job Order" (broken selection, UX-002); status change popup `a=addActivityChangeStatus` from either detail page.

**Statuses** (`db/cats_schema.sql:267-277`; runtime list #31): 100 No Contact · 200 Contacted · 250 Candidate Responded · 300 Qualifying · 400 Submitted · 500 Interviewing · 600 Offered · 650 Not in Consideration · 700 Client Declined · 800 Placed. Any status can move to any other; nothing enforces order (`lib/Pipelines.php:294-379`, FEAT-001). `triggers_email = 1` for 300, 400, 500, 600, 800.

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | Open candidate detail | `m=candidates&a=show` | 1 | #26 |
| 2 | "Add This Candidate to Job Order" → popup (750×390) | `a=considerForJobSearch` | 1 | #30 |
| 3 | Search by title or company, or show recently modified job orders | popup POST | 1 | #30 |
| 4 | Click the job title (a GET that writes the pipeline row) | `a=addToPipeline` | 1 | `CandidatesUI.php:1561-1656` |
| 5 | Close → whole parent page reloads | `parentHidePopWinRefresh` | 1 | `subModal.js:252-258` |
| 6 | Pipeline row icon "Log an Activity / Change Status" → popup (600×480) | `a=addActivityChangeStatus` | 1 | `candidates/Show.tpl:529-530` |
| 7 | Tick Change Status, pick a status: note pre-fills "Status change: X"; e-mail box set checked for 300/400/500/600/800; optionally tick Schedule Event (type, date `MM-DD-YY`, 12-hour time, duration, title) | — | 0 | `js/activity.js:697-720`; #31 (Contacted, e-mail unchecked) |
| 8 | Save → popup shows what happened (status, activity, event, e-mail) | POST | 1 | #31 confirmation text |
| 9 | Close → parent reloads; pipeline row shows the new status, activity log shows the entry | `parentGoToURL` | 1 | #32 |

**From the job-order side (static, except the detail page #20):**

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | Job order detail with the pipeline grid (loaded by AJAX; sortable, paged, star rating, "Mark as Screened", select + Export) | `m=joborders&a=show` | 1 | #20; `ajax/getPipelineJobOrder.php` |
| 2 | "Add Candidate to This Job Order Pipeline" → popup (820×550): search candidates **by name only** | `a=considerCandidateSearch` | 1–2 | `joborders/Show.tpl:419`; `JobOrdersUI.php:195-215` |
| 3a | Click a candidate → added at status 100 with activity "Added candidate to job order." | `a=addToPipeline` | 1 | `JobOrdersUI.php:1271-1319` |
| 3b | Or "add new candidate" inside the popup → the candidate add form in modal mode → saved and added to this pipeline in one step | `a=addCandidateModal` | 2 | `JobOrdersUI.php:1321-1416` |
| 4 | Close → parent reloads | — | 1 | `parentHidePopWinRefresh` |
| 5 | Pipeline row action → the same status popup as the candidate side, but the e-mail default comes from E-Mail Settings per status, not from `triggers_email` | `m=joborders&a=addActivityChangeStatus` | 3 | `JobOrdersUI.php:1454-1466`; FEAT-018 |

What each status does beyond the status and history rows:

| Status | E-mail box default (candidate side) | Counted as | Other effect |
|---|---|---|---|
| 100 No Contact | off | — | initial status on every add (no history row) |
| 200 Contacted / 250 Candidate Responded | off | — | — |
| 300 Qualifying | **on** | — | — |
| 400 Submitted | **on** | submission (every history row) | dashboard "Important Candidates"; job-order "Submitted" column |
| 500 Interviewing | **on** | interview column | dashboard "Important Candidates" |
| 600 Offered | **on** | — | dashboard "Important Candidates" |
| 650 Not in Consideration / 700 Client Declined | off | — | excluded from the candidate grid's "submitted" join |
| 800 Placed | **on** | placement | openings guard and −1; "Recent Hires" |

Source: `db/cats_schema.sql:267-277` (`triggers_email`), `lib/Statistics.php`, `lib/Dashboard.php:85`, `modules/home/dataGrids.php:163-172`, FEATURE_INVENTORY §3.

- **Step count:** candidate side, 8 page loads and about 12 clicks for one candidate from "open record" to "status changed"; job-order side, 7–8 loads. Repeating a status change is 3 loads (open popup, save, close and reload). There is no multi-candidate status change.
- **Data written:** on add — `candidate_joborder` (status 100; careers adds set rating −1) and `activity` type 400 "Added candidate to job order." (`CandidatesUI.php:1640`, `JobOrdersUI.php:1301`); no status-history row is written on add. On status change (`CandidatesUI.php:2900-3302`, in this order): `activity` (if "add activity" ticked, `:2978`) → `candidate_joborder.status` + `candidate_joborder_status_history` (from, to) + `history` + synchronous candidate e-mail and `email_history` (`lib/Pipelines.php:333-378`) → `joborder.openings_available` −1 on entering 800 / +1 on leaving 800 (`:3089-3100`) → `calendar_event` (`:3223`).
- **Side effects:** candidate e-mail from template `EMAIL_TEMPLATE_STATUSCHANGE` (defaults differ by entry side, FEAT-018); dashboard "Important Candidates" lists 400/500/600 on open jobs (#90 shows 0 because the test pipeline was at 200); job-order grid Submitted/Pipeline/Interviews columns; submission and placement reports count history rows (FEAT-008); "Recent Hires" on entering 800.
- **Removal:** "remove from pipeline" (level 300) deletes the pipeline row **and all its status history** (`lib/Pipelines.php:139-189`; FEAT-003); openings are not restored.
- **Runtime status:** Works — add from the candidate side and a status change to Contacted with the e-mail box unchecked (#30–#32). Status changes that send e-mail, placement, the job-order-side popup and removal were not exercised.

### WF-006 — Status change with candidate e-mail stops half-way when mail fails: openings and the scheduled event are not updated
*Confirmation: **Partial** · New in this edition · Related: RT-04, WF-002, WF-008, FEAT-018*

- **Confirmed fact (static):** In the status-change handler the candidate e-mail is sent synchronously **before** the openings counter is adjusted and **before** the calendar event is created; the send has no exception handling. The e-mail box is checked by default for Qualifying, Submitted, Interviewing, Offered and Placed.
- **Confirmed fact (runtime, other paths):** `Mailer::sendToOne()` throws an uncaught PHPMailer exception when the relay is unreachable, ending the request with a fatal page (#77 stack trace shows `Mailer->sendToOne`; RT-04). The committed configuration points at an SMTP relay that did not exist in the baseline.
- **Evidence:** `modules/candidates/CandidatesUI.php:2978` (activity written), `:3084` (`$pipelines->setStatus(...)`), `lib/Pipelines.php:333-365` (status, status history, `history` row written) and `:367-378` (send), then `CandidatesUI.php:3089-3100` (openings) and `:3222-3223` (event). Default check: `js/activity.js:697-701` with `triggers_email` seed.
- **Inferred (not exercised):** with mail unavailable, moving a candidate to Placed with the default e-mail box ticked records the placement but leaves `openings_available` unchanged, drops the requested interview event, and shows the recruiter a fatal page inside the popup.
- **Impact:** Placement counts and remaining openings disagree; interviews the recruiter thinks are scheduled do not exist; the recruiter cannot tell which parts were saved.
- **Severity:** HIGH — core-workflow partial write with a default-on trigger.
- **Recommendation:** A failed notification must not abort the rest of the status change; all record updates of one status change should complete (or fail) together and the popup should report the e-mail result separately.
- **Unknown / needs further validation:** Needs one run on an isolated instance with an unreachable relay: change a pipeline to Placed with an event, then read `joborder.openings_available` and `calendar_event`.

## 5. W5 — Interviews and calendar

- **Purpose:** schedule and track interviews, calls and meetings tied to candidates, contacts and job orders.
- **Actors:** Add/Edit (200) to add/edit; Delete (300) to delete; Site Administrator (400) to show other users' entries.
- **Entry points:** "Schedule Event" in the status popup (W4 step 7); candidate detail "Schedule Event" (`#32`, Upcoming Events); contact detail "Log an Activity / Schedule Event" (`contacts/Show.tpl:192,298`); Calendar tab → Add Event (`m=calendar`, `a=addEvent`).

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | Calendar tab → month view | `m=calendar` | 1 | #35 |
| 2 | Add Event (in-page form): title, type (Call, Email, Meeting, Interview, Personal, Other — required, `alert` if missing), public, date (`MM-DD-YY`), all day or 12-hour time, duration, description; reminder only if the scheduler is active | — | 0 | #36 (event types listed) |
| 3 | Save → month view shows the event; side panel shows type, date, time, duration, "Reminder: (None Set)" | `a=addEvent` → `showEvent=` | 1 | #36 |
| 4 | My Upcoming Events | JS view | 0–1 | #37 |
| 5 | Dashboard "My Upcoming Calls" (type Call) / "My Upcoming Events" (other types) | `m=home` | 1 | #90 ("09-25-26 01:00 AM: Baseline interview (TEST)") |

- **Step count:** 2 loads from the Calendar tab; 0 extra loads when scheduled from the status popup.
- **Data written:** `calendar_event` (type, date, duration, public, data item, regarding job order, reminder fields); an activity only when scheduled through the activity popups.
- **Side effects:** event appears on the candidate/contact "Upcoming Events" and the owner's dashboard; reminder e-mail only via the queue processor; nothing is sent to the candidate or the client contact.
- **Runtime status:** Works — add and view (#35–#37, #90). Reminders, event edit/delete and scheduling from the status popup were not exercised.

### WF-007 — Scheduled interviews stay internal; reminder e-mails need a scheduler the product does not ship
*Confirmation: **Partial** · New in this edition · Related: FEAT-004, FEAT-010, WF-006*

- **Confirmed fact (runtime):** The baseline event shows "Reminder: (None Set)" (#36); the baseline stack ran only the php, web and db containers, with no queue processor (INSTALLATION.md §1).
- **Confirmed fact (static):** The reminder option is shown only if the queue processor ran in the last 5 minutes (`CandidatesUI.php:1747-1754` and `CalendarUI.php:258-262` → `SystemUtility::isSchedulerEnabled()` → `QueueProcessor::isActive()`, `lib/QueueProcessor.php:513-525`; hidden in `Calendar.tpl:117,267`). Reminders are sent by `QueueCLI.php`, which must be run by an external cron (FEAT-010). Creating an event writes only `calendar_event` (`lib/Calendar.php:297`); there is no invitation, attendee or calendar-file output. The candidate e-mail on moving to Interviewing is the generic status-change template (`%CANDSTATUS% %CANDPREVSTATUS% %JBODTITLE% %JBODCLIENT%`, `js/activity.js:738-750`), which carries no date or time.
- **Inferred:** whether the reminder checkbox was hidden in the baseline popup was not recorded.
- **Impact:** Interview logistics with the candidate and the client happen outside the system and are not recorded against the event; recruiters cannot rely on reminders on a default install.
- **Severity:** MEDIUM — the shipped reminder feature does not work on a default install, and the scheduling step has no outbound handoff.
- **Recommendation:** Reminders should either work on a default install or be clearly unavailable in the UI, and a scheduled interview should be able to reach the people it concerns.
- **Unknown / needs further validation:** Needs a run with the queue processor on cron and a mail relay on an isolated instance.

## 6. W6 — Submission, offer and placement

- **Purpose:** submit a candidate to the client, record offers, and mark a hire against a job order's openings.
- **Actors:** Add/Edit (200) and above; the client contact is not an actor.
- **Entry points:** the status popup (W4) with statuses 400 Submitted, 600 Offered, 800 Placed; job order Edit for openings and status (`joborders/Edit.tpl:182-185`); Reports tab (W9).

| # | Step | What the system does | Evidence |
|---|---|---|---|
| 1 | Change status to 400 Submitted | status + history row; e-mail box checked by default → e-mail **to the candidate**; counted as a submission in reports; dashboard "Important Candidates" | `lib/Statistics.php:90-121`; `modules/home/dataGrids.php:163-172` |
| 2 | Change status to 500 Interviewing / 600 Offered | same pattern; optional event (W5) | §3.3 of FEATURE_INVENTORY |
| 3 | Change status to 800 Placed | guard: if `openings_available <= 0` → popup error "This job order has been filled. Cannot assign the status Placed to any other candidate."; else status + history, candidate e-mail (default on), then `openings_available − 1` | `CandidatesUI.php:2932-2942,3089-3093` |
| 4 | Move a placed candidate to another status | `openings_available + 1` | `CandidatesUI.php:3096-3100` |
| 5 | Dashboard "Recent Hires", placement report | read `candidate_joborder_status_history` rows with `status_to = 800` | `lib/Dashboard.php:57-97`; #51 |

- **Step count:** each status move is 3–4 loads (W4 steps 6–9).
- **Data written:** as W4; plus `joborder.openings_available`.
- **Side effects:** none toward the client contact; job order status is not changed automatically.
- **Runtime status:** Not exercised in baseline — the statuses were available (#31) and the reports rendered with no placements (#50, #51, #90 "Recent Hires" empty).

### WF-008 — Placement does not close the loop on the job order: filled jobs stay public and the openings counter drifts
*Confirmation: **Static** · New in this edition · Related: WF-006, FEAT-003, FEAT-008*

- **Confirmed fact:** When the last opening is filled the job order keeps its status (default `Active`) and stays on the careers site, RSS and XML feeds; the openings counter is not restored when a placed candidate is removed from the pipeline, and it is also a free-text field on the edit form.
- **Evidence:**
  - Careers listing criteria are `joborder.public = 1` and status in the sharing list (`lib/JobOrders.php:599,617`); sharing list default `Active` (`lib/JobOrderStatuses.php:52`); no code moves a job to `Full` or `Closed` (the string `'Full'` appears only in the status arrays, `lib/JobOrderStatuses.php:13,33,43`). The apply path does not check openings (`CareersUI.php:1190-1603`).
  - `lib/Pipelines.php:139-189` (`remove()`) deletes the pipeline and its history without touching `openings_available`.
  - `modules/joborders/Edit.tpl:182-185` — "Remaining Openings" is a plain text input saved as posted (`JobOrdersUI.php:1037,1126`).
  - WF-006: with mail unavailable the decrement is skipped entirely.
- **Impact:** Applicants keep applying to filled roles; the "filled" guard blocks legitimate placements after a removal or a manual edit, or lets extra placements through; openings shown to recruiters do not match placements.
- **Severity:** MEDIUM — requisition state and counts are unreliable.
- **Recommendation:** Keep the openings count consistent with placements on every path that adds or removes a placement, and make a filled job stop being advertised unless someone reopens it.
- **Unknown / needs further validation:** How production users handle this today (manual status changes); needs interviews or a query of `joborder` rows with `openings_available = 0` and status `Active`.

### WF-009 — Submission to the client is not recorded against or sent to the client contact
*Confirmation: **Static** · New in this edition · Related: FEAT-001*

- **Confirmed fact:** Moving a pipeline to Submitted writes a status-history row and, by default, e-mails the **candidate**; nothing is sent to, or logged against, the job order's client contact.
- **Evidence:** status-change side effects `CandidatesUI.php:2900-3302` and `lib/Pipelines.php:294-379` (only candidate e-mail); the contact's activity log is written only by the contact popup (`ContactsUI.php:1315`); `candidate_joborder.date_submitted` is never written (`grep -rn date_submitted modules lib src` → none, FEATURE_INVENTORY §3.1).
- **Impact:** Which resume went to which client contact, and when, lives in the recruiter's own mailbox; the client side of the pipeline has no trail.
- **Severity:** LOW — missing handoff; the pipeline status itself is recorded.
- **Recommendation:** A submission should leave a record on the client side (contact or job order) of what was sent and when, so the client trail does not depend on personal mailboxes.
- **Unknown / needs further validation:** None.

## 7. W7 — Candidate communication

- **Purpose:** e-mail one or many candidates (free text or template) and keep a record of it.
- **Actors:** Site Administrator (400) for bulk e-mail (`CandidatesUI.php:298-305`; the action is only listed when `MAIL_MAILER != 0` and the user is ≥ 400, `modules/candidates/dataGrids.php:62-65`); Add/Edit (200) for status-change e-mails (W4); the automated user for careers e-mails (W11).
- **Entry points:** candidate list → tick rows → action area "Send E-Mail" → "Selected" → `m=candidates&a=emailCandidates`; the status popup's "Send E-Mail Notification" (W4); the candidate detail shows e-mail addresses as `mailto:` links (`candidates/Show.tpl:81,89`), which open the user's own mail client; e-mail templates are edited at `m=settings&a=emailTemplates` (#63).

System e-mail templates (seed `db/cats_schema.sql:631-637`; edited on the E-Mail Templates page, #63, where each has a "use this template" checkbox, `settings/EmailTemplates.tpl:145`):

| Template tag | Sent when | To | Sent synchronously from |
|---|---|---|---|
| `EMAIL_TEMPLATE_STATUSCHANGE` | pipeline status change with the box ticked ("Your previous status was … Your new status is …") | candidate | `lib/Pipelines.php:367-378` |
| `EMAIL_TEMPLATE_OWNERSHIPASSIGNCANDIDATE` / `…CLIENT` / `…CONTACT` / `…JOBORDER` | owner field changed on a record | new owner | `lib/Candidates.php:345`, `lib/Companies.php:196`, `lib/Contacts.php:283`, `lib/JobOrders.php:254` |
| `EMAIL_TEMPLATE_CANDIDATEAPPLY` | careers application saved ("Thank you for applying …") | applicant | `CareersUI.php:1518` |
| `EMAIL_TEMPLATE_CANDIDATEPORTALNEW` | careers application saved | job owner, then recruiter if different | `CareersUI.php:1585,1595` |
| custom templates | bulk e-mail with a template chosen | each selected candidate | `CandidatesUI.php:3365` |

**Bulk e-mail from the candidate list (exercised):**

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | Candidates list, tick one or more rows | `m=candidates` | 1 | #25 |
| 2 | "Send E-Mail" → "Selected" → compose page; "To" is pre-filled from the grid — **not** from the ticked rows; a PHP warning is printed at the top; the body editor does not start | `a=emailCandidates&i=…&p=a:7:{…}` | 1 | #78 (1 row ticked, 2 recipients shown; RT-11, RT-07) |
| 3 | Choose a template (AJAX fills the body) or type free text; optionally "Preview for" a candidate | — | AJAX | UX-026 (template/preview depend on the missing editor instance) |
| 4 | Send E-Mail | POST `a=emailCandidates` | 1 | #79 → full-page PHP fatal (RT-04) |
| 5 | Confirmation page listing recipients (when sending works) | same | (same) | `CandidatesUI.php:3375-3377` |

- **Step count:** 3 page loads.
- **Data written:** `email_history` (one row per send, `lib/Mailer.php:363-400`), only when the send succeeds. No `activity` row and nothing on the candidate record.
- **Side effects:** none visible in the product: no screen reads `email_history` (FEAT-013); `mailto:` e-mails are not recorded at all.
- **Runtime status:** Broken — both the test e-mail (#77) and the bulk send (#79) ended in a PHP fatal; the compose page was addressed to rows the user had not selected (#78, UX-002).
- **Related findings:** UX-002 (wrong recipients), UX-026 (templates), WF-002 (mail configuration and unguarded sends), FEAT-013 (no communication history on the record).

### WF-010 — Free-text bulk e-mail sends one message with every recipient in the To header
*Confirmation: **Static** · New in this edition · Related: UX-002, FEAT-013, SEC area*

- **Confirmed fact:** When no template is chosen, the bulk e-mail handler sends a single message and adds every address from the To box as a visible To recipient. The template path sends one message per candidate.
- **Evidence:** `modules/candidates/CandidatesUI.php:3309-3318` (splits `emailTo` on ", " into `$destination`), `:3320-3331` (template "-1" → one `$mailer->send(..., $destination, ...)` at `:3324`), `lib/Mailer.php:232-234` (`foreach ($recipients …) AddAddress(...)`). Template path: `CandidatesUI.php:3340-3372` (`sendToOne` per candidate at `:3365`).
- **Impact:** Every candidate receives every other candidate's e-mail address. Combined with UX-002, the To box can hold up to 15 candidates the recruiter never selected. This is a personal-data disclosure between candidates.
- **Severity:** HIGH — disclosure of candidate personal data to third parties on a routine action.
- **Recommendation:** Send bulk e-mail as one message per recipient (as the template path already does), so recipients never see each other's addresses.
- **Unknown / needs further validation:** No mail was delivered in the baseline; confirm the resulting headers with a test relay on an isolated instance.

## 8. W8 — Search and retrieval

- **Purpose:** find a record again: by name, phone, e-mail, skill, city or resume text; through saved lists, hot flags and recently viewed records.
- **Actors:** Read Only (100) and above.
- **Entry points:** header Quick Search on every page (`m=home&a=quickSearch`); module "Search" sub-tabs: candidates (`a=search`, modes full name, key skills, resume, city, phone), job orders (title, company), companies (name, key technologies), contacts (name, company, title); recent and saved searches (per user); Lists tab (`m=lists`, `a=showList`); "Only Hot" / "Only My" filters on lists; "Recent:" MRU bar.

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | Type a term in Quick Search → Go → four result tables (candidates, companies, contacts, job orders) | `m=home&a=quickSearch` | 1 | #38 (all four test records found) |
| 2 | Candidates → Search → mode + term → results; the search is kept as a "recent search" and can be pinned | `a=search&mode=…` | 2 | #39–#41 (name, key skills, city) |
| 3 | Resume keyword search → results with highlighted excerpts; open the resume text in a window | `mode=searchByResume` | 1 (+1 window) | #42, #44 found; #43 PDF not found (RT-08); #45 negative control; #34 |
| 4 | Job order / company / contact search | module `a=search` | 2 each | #46, #47, #48 |
| 5 | Saved lists: tick rows → "Add To List" → popup: pick or create list; or a record's quick-action menu → Add To List | popup `m=lists&a=addToListFromDatagridModal` | 1–2 | not exercised; grid "Selected" adds every row in the grid (UX-002) |
| 6 | Lists tab → open a list → member grid; "Remove From This List" | `m=lists&a=showList` | 2 | #08 (tab only); remove acts on unselected rows (UX-002) |
| 7 | Click an entry in "Recent:" | — | 1 | #32, #90 |

| Search | Fields matched | Runtime |
|---|---|---|
| Quick Search | candidate name, e-mail, phone (normalised); company name, phone, URL; contact name, phone, company, e-mail; job-order title, company | #38 |
| Candidates: full name / key skills / city / phone | name columns; `key_skills`; `city`; phone columns | #39–#41 |
| Candidates: resume keywords | extracted attachment text (boolean mode; Sphinx optional and off) | #42–#45 |
| Job orders | title, company name | #46 |
| Companies | name, key technologies | #47 |
| Contacts | full name, company name, title | #48 |

Source: `lib/Search.php:364-722,724-839,1099-1304,1306-1618` (FEATURE_INVENTORY 2.1–2.8).

- **Step count:** 1–2 loads per search.
- **Data written:** `saved_search` (recent/saved searches), `saved_list`, `saved_list_entry`, `mru`.
- **Side effects:** none.
- **Runtime status:** Works with errors — all searches returned the expected records, except that PDF resume text is not extracted with the shipped tool paths (#43, RT-08).
- **Findings:** no new flow-level finding. Related: UX-002 (list add/remove act on the wrong rows), UX-006 (quick-search value echoed raw), RT-08 (PDF text), PERFORMANCE area (unpaginated quick search, unindexed `LIKE`/`REGEXP`).

## 9. W9 — Reporting

- **Purpose:** count submissions and placements, produce EEO statistics and a per-job client report, and give each user a dashboard.
- **Actors:** any logged-in user (no access checks in `ReportsUI.php`); EEO data is not gated on the user's `can_see_eeo_info` flag in reports (FEATURE_INVENTORY 2.10).
- **Entry points:** Dashboard (`m=home`); Reports tab (`m=reports`); `a=showSubmissionReport&period=`, `a=showPlacementReport&period=`; EEO sub-tab `a=customizeEEOReport` → `a=generateEEOReportPreview`; job order detail "Generate Report" → `a=customizeJobOrderReport&jobOrderID=` → `a=generateJobOrderReportPDF`.

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | Dashboard: recent calls, upcoming calls/events, recent hires, hiring-overview graph (image), important candidates grid | `m=home` | 1 (+graph image) | #06, #90 (UX-025) |
| 2 | Reports tab: submissions/placements and new-record counts for 9 fixed periods | `m=reports` | 1 | #49 |
| 3 | Click a period's submissions or placements → report opens in a new tab | `a=showSubmissionReport` / `a=showPlacementReport` | 1 | #50, #51 |
| 4 | EEO: choose period (All / Last Month / Last Week) and status → Preview (charts and numbers) | `a=generateEEOReportPreview` | 2 | #52 (2 JS errors, RT-10) |
| 5 | Job order → Generate Report → editable form (site, company, position, period, managers, notes) → PDF | `a=customizeJobOrderReport` → PDF | 2 | #53; #54 FPDF error in this topology (RT-09); works when the PHP container can reach the request host (`evidence/final-run/joborder-report-with-internal-host.pdf`) |

| Dashboard widget | What it actually shows | Evidence |
|---|---|---|
| My Recent Calls | last 6 activities of **any** type entered by the user in the last month | `modules/home/dataGrids.php:281-395`; #90 (UX-025) |
| My Upcoming Calls / My Upcoming Events | today's and future events of the user; "Calls" = type Call, "Events" = other types | `lib/Calendar.php:641-712`; #90 |
| Recent Hires | last 10 status-history rows with `status_to = 800` | `lib/Dashboard.php:57-97` |
| Hiring Overview | server-rendered JPEG of submissions/interviews/hires per week/month/year | `Home.tpl:58-66`; #90 (placeholder bars when empty) |
| Important Candidates | pipelines at 400/500/600 on open job orders (not limited to the user) | `modules/home/dataGrids.php:163-172`; #90 |

- **Step count:** 1–2 loads per report.
- **Data written:** none (reports read `candidate_joborder_status_history`, `joborder`, `candidate`, EEO columns).
- **Side effects:** the PDF step makes the server fetch its own graph URL over HTTP (RT-09).
- **Runtime status:** Partly broken — reports and the EEO preview render; the job-order PDF fails in the repo's Docker topology; the EEO page throws JS errors.
- **Findings:** no new flow-level finding. Related: FEAT-008 (counts are history rows, `'OnHold'` typo, PDF figures taken from editable form fields), FEAT-003 (deletes erase report history), UX-021 (fixed periods, no export), UX-025 (dashboard labels), RT-09, RT-10.

## 10. W10 — Data maintenance

- **Purpose:** correct, remove, de-duplicate, export and back up recruiting data.
- **Actors:** Add/Edit (200) to edit; Delete (300) to delete; Site Administrator (400) for duplicates and backups; Read Only (100) can export any grid (no check in `ExportUI.php`).
- **Entry points:** record "Edit" (`a=edit`), "Delete" (GET `a=delete` behind `confirm()`), "View History" (`m=settings&a=viewItemHistory`), "Link duplicate"/merge (W3), DataGrid "Export" (`m=export&a=exportByDataGrid`), Settings → Site Backup (`m=settings&a=createBackup`), import revert (W3).

| # | Step | What happens | Evidence |
|---|---|---|---|
| 1 | Edit a candidate → Save | fields updated; field-level `history` rows; MRU entry; owner change sends an e-mail (WF-002); names/titles re-escaped on save (UX-003) | #33 (2 loads); `lib/Candidates.php:327-345` |
| 2 | Delete a record | GET after `confirm()`; hard delete with cascades: company → its contacts, job orders, pipelines, status history, attachments, list entries; candidate/job order → pipelines and status history; activities and events are left orphaned | FEAT-003; `lib/Companies.php:214-305` |
| 3 | View History | field-level change list per record | `a=viewItemHistory` (not opened in baseline) |
| 4 | Export | grid → Export → Selected / All → CSV; both variants return the first 15 rows of the default sort (UX-002) | `lib/DataGrid.php:1988,1993` |
| 5 | Backup | Site Backup page → create (AJAX) → zip of SQL dump (and optionally attachments) stored as an attachment of the default company and offered for download | #65 (page only); `modules/settings/ajax/backup.php:93-95,156-209` |
| 6 | Restore | not available in the application; only the installer's "restore" step reads `./restore/catsbackup.bak` | `modules/install/ajax/ui.php:679-694`; installer blocked while `INSTALL_BLOCK` exists (`:54-55`) |

What a delete removes and what it leaves behind (static; not exercised):

| Delete | Also deleted | Left behind (orphans) | Evidence |
|---|---|---|---|
| Candidate | pipelines, their status history, list entries, duplicate links, attachments (files), extra-field values | activities, calendar events | `lib/Candidates.php:363-456`; FEAT-003 |
| Job order | pipelines, their status history, attachments, list entries, extra-field values | activities "regarding" the job, events | `lib/JobOrders.php:272-350` |
| Contact | list entries, extra-field values; `reports_to` of other contacts reset | activities, events | `lib/Contacts.php:347-395` |
| Company | **all its contacts and job orders** (with the cascades above), attachments, list entries | as above | `lib/Companies.php:214-305`; only the default company is protected (`CompaniesUI.php:889-893`) |
| Pipeline (remove) | the pipeline row and **all** its status history | activities; openings not restored | `lib/Pipelines.php:139-189` |

Removing status history also removes the submissions and placements that reports and "Recent Hires" count (FEAT-003, FEAT-008).

- **Data written:** `history`, deletes across many tables, `attachment` (backup file).
- **Runtime status:** Works — edit and save (#33). Delete, merge, export, history and backup creation were not exercised.
- **Related findings:** FEAT-002 (merge corrupts), FEAT-003 (cascades erase history), UX-002 (export rows), UX-003 (edit corrupts names), UX-013 (GET deletes), WF-004, WF-005.

### WF-011 — Backups can be created in the UI but restored only through the installer with server file access
*Confirmation: **Static** · New in this edition · Related: FEATURE_INVENTORY 2.16, RT-17*

- **Confirmed fact:** The Site Backup page creates a backup zip inside the application; there is no restore function in the application. Restore exists only as an installer step that reads a fixed server path, and the installer refuses to run while `INSTALL_BLOCK` exists.
- **Evidence:** `modules/settings/ajax/backup.php:93-95` (backup stored via `AttachmentCreator` as `catsbackup.bak`), `:156-209` (zip and SQL chunks); `modules/install/ajax/ui.php:679-694` (`restoreFromBackup` extracts `./restore/catsbackup.bak`); `:54-55` (`INSTALL_BLOCK` check). Runtime #65: the backup page loads; creation was deliberately not run (`SMOKE_TEST.md` §1 row 11).
- **Impact:** An administrator without shell access cannot restore; a restore needs someone to copy the file to `restore/`, remove `INSTALL_BLOCK` (re-opening the installer to anyone who can reach it) and run the installer. The backup file lives in the attachments tree, which RT-17 found directly downloadable under nginx.
- **Severity:** MEDIUM — the recovery half of the backup workflow is missing from the product.
- **Recommendation:** The backup workflow should be completable end to end by the same role that creates backups, without re-opening the installer, and backup files should not be stored where web-served attachments live.
- **Unknown / needs further validation:** Whether a restore actually succeeds on the current schema was not tested; needs a backup-and-restore round trip on an isolated instance. Whether the backup file path is guessable is for the SEC area.

## 11. W11 — Applicant experience on the careers portal

- **Purpose:** let a job seeker find an open position and apply with a resume, optional questionnaire and EEO data, and get it to a recruiter.
- **Actors:** anonymous applicant; optionally a "registered" applicant (UX-007); the automated user (owner of what the portal creates); job owner and recruiter as recipients of the new-applicant e-mail.
- **Entry points:** `careers/index.php` (or `index.php?m=careers`); `?p=showAll`, `?p=showJob&ID=`, `?p=applyToJob&ID=`, POST `?m=careers&p=onApplyToJobOrder`; `?p=candidateRegistration`, `?p=registeredCandidateProfile` when registration is enabled; `rss/`, `xml/`.

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 0 | Portal is off after install: every careers URL returns an empty page until an admin enables it | any | — | RT-16; #75 |
| 1 | Careers home with shortcuts "Return to Main", "Show All Jobs", "RSS Feed" | `careers/index.php` | 1 | #80 |
| 2 | All jobs: one unpaginated table | `?p=showAll` | 1 | #81 (test job listed) |
| 3 | Job detail → "Apply to Position" (image link) | `?p=showJob&ID=1` | 1 | #82 |
| 4 | Apply form: 1 resume (Choose File, **Upload**, text box, "Populate Fields ->"), 2 about you, 3 contact, 4 additional info | `?p=applyToJob&ID=1` | 1 | #84, `S3` |
| 5 | Click **Upload** → page re-posts, text box filled, hidden `file` field set. If skipped, the chosen resume is dropped on submit | postback | +1 | #86 notes; #85 (RT-12, UX-024) |
| 6 | "Submit Application Now" (image) → `alert()` if first name, last name or e-mail missing | POST | 1 | `CareersUI.php:973-1112` |
| 7 | If the job has a questionnaire: questionnaire page (first radio answer pre-selected) → Continue | POST | +1 | UX-011; not exercised |
| 8 | Server: find candidate by e-mail or create one (source "Online Careers Website", owner = automated user); questionnaire actions; attach resume; pipeline row at 100 with rating −1; activity "User applied through candidate portal …"; e-mail to applicant; e-mail to job owner and recruiter; 1-hour cookie; "Thanks" content | — | (same) | `CareersUI.php:1190-1603` |
| 9 | What the applicant saw in the baseline: a PHP fatal error page with a stack trace | — | — | #85, #86 (RT-04, UX-023) |
| 10 | What the recruiter sees: applicant in the job's pipeline at "No Contact"; resume searchable when it was uploaded | recruiter UI | — | #87 |

Questionnaire lifecycle (static; not exercised):

| Stage | What happens | Evidence |
|---|---|---|
| Set-up | Settings → Careers Website → questionnaires: questions of type text, checkbox, select or radio; each answer can trigger actions (set source, add notes, set Hot, set active, set "can relocate", add key skills). Create/update needs only level 350 (Demo), not 400 | `SettingsUI.php:516-538`; `lib/Questionnaire.php:169-174,422-427` |
| Attach | Pick a questionnaire on the job-order add/edit form (only shown when careers is enabled) | `joborders/Add.tpl:286`; `JobOrdersUI.php:474-489` |
| Answer | After "Submit Application Now", the applicant's form data is re-emitted as hidden fields and the questionnaire page is shown; the first radio answer is pre-selected | `CareersUI.php:737-792`; UX-011 |
| Store and act | Answers saved to `career_portal_questionnaire_history`; `doActions()` changes the candidate record according to the chosen answers | `lib/Questionnaire.php:549` (`log()`), `:583` (`doActions()`); `CareersUI.php:1341-1346` |
| Review | Candidate detail lists the questionnaire; `a=show_questionnaire` shows answers and resume text (looked up by questionnaire title from the URL) | `candidates/Show.tpl:345-349`; `CandidatesUI.php:3419-3454` |

- **Step count:** 5 loads minimum (home → list → detail → form → submit); 6 with Upload; 7–8 with a questionnaire. Search (`?p=search`, #83) is an empty page and the RSS shortcut is a fatal (#88, RT-05); the XML feed works (#89).
- **Data written:** `candidate` (new applicants only), `attachment` (only if Upload was used), `candidate_joborder`, `activity`, `career_portal_questionnaire_history` (with a questionnaire), `extra_field`, EEO columns; `email_history` only for sends that succeed (it stayed empty in the baseline, RT-04).
- **Side effects:** e-mails to applicant, job owner and recruiter (none sent in the baseline); applicant cookie.
- **Runtime status:** Partly broken — browse and apply work and the data is saved (#80–#87); the applicant sees a fatal page, the resume can be silently lost, and search and RSS are dead ends.

### WF-012 — New-applicant notification to the job owner and recruiter is lost when the applicant's e-mail fails
*Confirmation: **Runtime** · New in this edition · Related: RT-04, UX-023, WF-002*

- **Confirmed fact:** The portal e-mails the applicant first and the job owner and recruiter afterwards, in the same request; when the applicant e-mail fails, the request ends and the internal notification is never attempted. Applicants are owned by the automated user from the system site, so nothing else brings them to a recruiter's attention.
- **Evidence:**
  - Runtime: RT-04 — for #85/#86 "the application itself was saved … but the later notification steps did not run. `email_history` stayed empty"; the fatal's subject was the applicant confirmation ("Thank You for Y…").
  - Code order: applicant e-mail `CareersUI.php:1518`, then owner `:1585` and recruiter `:1595`; no exception handling (`lib/CareerPortal.php:461-470` → `lib/Mailer.php:241`).
  - Owner/author: `CareersUI.php:1255` `getAutomatedUser()` → user `cats@rootadmin` of site 180 (`lib/Users.php:1192-1199`; seed `db/cats_schema.sql:1108`). The dashboard's "Important Candidates" lists only statuses 400–600, so new applicants at 100 do not appear there either (`modules/home/dataGrids.php:163-172`).
  - Runtime #87: the applicants were found only by opening the job's pipeline and by resume search.
- **Impact:** With mail unavailable or misconfigured, new applications arrive silently; they surface only if someone opens the job order's pipeline.
- **Severity:** MEDIUM — missing handoff on the main inbound channel; the data itself is saved.
- **Recommendation:** The recruiter-side notice of a new application should not depend on the applicant's confirmation e-mail succeeding, and new applications should be discoverable in the recruiter UI without opening each job.
- **Unknown / needs further validation:** Behaviour with a working relay (both e-mails would then be attempted); needs a test relay on an isolated instance.

### WF-013 — A returning applicant's new contact details are silently discarded
*Confirmation: **Static** · New in this edition · Related: FEAT-007, UX-007*

- **Confirmed fact:** If the e-mail typed on the apply form matches an existing candidate, the application is attached to that candidate and the profile is deliberately not updated; the phone numbers, address, key skills and EEO answers typed on the form are dropped without telling anyone.
- **Evidence:** `modules/careers/CareersUI.php:1296-1298` ("Lookup the candidate by e-mail, use that candidate instead if found (but don't update profile)"); only the new-candidate branch stores the typed fields (`:1299-1333`); extra notes are appended to the activity text only (`:1457-1460`).
- **Impact:** Recruiters call old numbers and see old addresses; EEO data for the new application is lost; nothing in the activity says the applicant supplied new details.
- **Severity:** MEDIUM — silent loss of applicant-supplied data.
- **Recommendation:** When a returning applicant supplies different details, keep them (for example in the activity or a pending-changes note) instead of discarding them, so the recruiter can decide what to update.
- **Unknown / needs further validation:** Not exercised (both baseline applicants used new e-mail addresses); confirm with a second application using an existing e-mail on an isolated instance.

## 12. W12 — User and access administration

- **Purpose:** add team members with the right access, change and recover passwords, and remove access when people leave.
- **Actors:** Site Administrator (400) and Root (500); every user for their own password; LDAP directory when `AUTH_MODE` includes `ldap` (default `sql`, `config.php:48`).
- **Entry points:** Settings → Administration → User Management (`a=manageUsers`) → Add User (`a=addUser`) / user page (`a=showUser`) / Edit User (`a=editUser`, with "Reset Password" and access level); My Profile → Change Password (`a=myProfile&s=changePassword`); Login Activity (`a=loginActivity`); login page → forgot password (`m=login&a=forgotPassword`, not linked).

| # | Step | Screen / URL | Loads | Evidence |
|---|---|---|---|---|
| 1 | User Management list | `a=manageUsers` | 1 | #60 |
| 2 | Add User: first/last name, e-mail, username, password ×2, access level (6 radio options), role/category, EEO visibility | `a=addUser` | 1 | #61; #74 field list |
| 3 | Submit → user page | POST → `a=showUser&userID=1251` | 2 | #74 |
| 4 | Tell the new user their username and password outside the system (no e-mail is sent) | — | — | `SettingsUI.php:1130-1231` (no mail call) |
| 5 | User changes own password (needs current password; LDAP users blocked) | `a=myProfile&s=changePassword` | 2 | #58 (page only); `lib/Users.php:649-654` |
| 6 | Forgotten password: user must know the URL; submitting shows a PHP fatal | `m=login&a=forgotPassword` | 2 | #03 (2 missing images, RT-13), #04 (RT-03) |
| 7 | Admin resets another user's password: Edit User → "Reset Password" → new password ×2 | `a=editUser` | 2 | `settings/EditUser.tpl:139-160`; `SettingsUI.php:1408` |
| 8 | Leaver: set access level to "Account Disabled"; "delete user" is refused unless the request carries the automated-tester flag | `a=editUser`; `a=deleteUser` | 2 | `SettingsUI.php:1449-1470` |
| 9 | LDAP first login: a disabled local user is created and the person sees "Your account has been created and is pending approval." | login | 1 | `lib/Users.php:846-851`; `lib/Session.php:780-782`; not exercised |

- **Step count:** add a user in 4 loads.
- **Data written:** `user`, `user_login` (every attempt, #62), `access_level` read; seat check `lib/Users.php:873-915`.
- **Side effects:** none — no welcome, reset or approval e-mails; the access level is read into the session at login (`lib/Session.php:796`).
- **Runtime status:** Partly broken — adding a user works (#74); self-service password recovery is a fatal (#04); change password, admin reset, disable and LDAP were not exercised; no non-admin login was tried.

### WF-014 — No offboarding path: users cannot be deleted and their records cannot be reassigned
*Confirmation: **Static** · New in this edition · Related: FEATURE_INVENTORY 2.16*

- **Confirmed fact:** The only way to remove a person's access is to set their level to "Account Disabled"; the delete action is reserved for the automated test framework; there is no function to move a leaver's candidates, contacts, companies, job orders or events to another user.
- **Evidence:** `modules/settings/SettingsUI.php:1449-1470` (`onDeleteUser` fails with "You are not the automated tester." unless `iAmTheAutomatedTester` is present; comment "Deleting a user this way … will cause referential integrity problems"); `lib/Users.php:250-270` (delete is "only here for use by the CATS Automated Testing Framework"); `grep -rni "reassign\|transferOwner\|changeOwner" modules lib` → no matches. Owner changes are per record on each edit form (and each sends an e-mail, WF-002).
- **Impact:** A leaver's records keep a disabled owner; "Only My …" views, ownership e-mails and dashboards stop covering them; reassigning means editing every record by hand.
- **Severity:** MEDIUM — a routine administrative workflow has no supported path.
- **Recommendation:** Provide a supported way to hand a departing user's open records to someone else, because disabling alone leaves those records without an active owner.
- **Unknown / needs further validation:** How production sites handle leavers today; needs a query of records owned by level-0 users on a production copy.

### WF-015 — Account onboarding and recovery depend entirely on an administrator acting out of band
*Confirmation: **Runtime** · New in this edition · Related: RT-03, RT-13, FEAT-009, UX-020, WF-001*

- **Confirmed fact:** Self-service password recovery ends in a fatal error; new users receive no e-mail and are not asked to replace the password the administrator chose; LDAP users awaiting approval are not announced to anyone.
- **Evidence:**
  - Runtime #04: submitting the forgot-password form for `admin` → `Fatal error: Uncaught Error: Call to undefined method Users::getPassword()` (`LoginUI.php:455`); #03 shows two missing images (RT-13). The page is not linked from `login/Login.tpl` (UX-020).
  - `SettingsUI.php:1130-1231` — `onAddUser()` saves and redirects; no mail call. The first-run wizard pages appear only for a missing e-mail, default site name, first-time setup or the `cats` password (`LoginUI.php:290-340`), so a new user is never asked to change the admin-set password.
  - `lib/Users.php:846-851` + `lib/Session.php:780-782` — LDAP pending-approval message; no notification code on this path.
  - Recovery path that does exist: an administrator's "Reset Password" in Edit User (`settings/EditUser.tpl:139-160`). A site with a single administrator who forgets the password has no in-product recovery.
- **Impact:** Every onboarding and every forgotten password needs an administrator to act and to pass credentials by other means; the administrator also knows each user's password.
- **Severity:** MEDIUM — the account lifecycle works only through manual administrator effort; the broken forgot-password page is visible to anyone.
- **Recommendation:** Account creation and recovery should not require passing passwords out of band; at minimum the broken forgot-password page should not be reachable while it fatals.
- **Unknown / needs further validation:** LDAP was not exercised; needs a directory on an isolated instance.

## Handoffs and dead ends

| From → to | What should pass | What happens today | Evidence / finding |
|---|---|---|---|
| Installer → administrator | secure credentials | admin/admin, never forced to change | WF-001 |
| Administrator → mail relay | working e-mail | configurable only in `config.php`; test button shows a stack trace | WF-002, RT-04 |
| Recruiter → candidate (status change) | notification | default-on for 5 statuses; defaults differ by entry side; on failure the status change stops half-way | WF-006, FEAT-018 |
| Recruiter → candidate (bulk) | e-mail to the selected people | addressed to unselected rows; free text exposes all addresses; send fatal in baseline | UX-002, WF-010, RT-04 |
| Recruiter → candidate / client (interview) | invitation, reminder | internal calendar entry only; reminders need a cron not shipped | WF-007 |
| Recruiter → client (submission) | resume sent, record of it | nothing recorded on the contact or job order | WF-009 |
| Placement → job order | openings and status updated, posting closed | openings −1 (skipped if the e-mail fails); status unchanged; job stays public | WF-008, WF-006 |
| Careers site → recruiter | new applicant with resume, notified | saved and pipelined; resume dropped without "Upload"; notification lost if the applicant e-mail fails; owner is a system user | UX-024, WF-012 |
| Careers site → applicant | confirmation | PHP fatal page | UX-023 |
| Returning applicant → record | updated contact details | discarded | WF-013 |
| Recruiter → administrator (duplicates) | resolve duplicate | notice only; SA-only tools; merge unsafe | WF-004, FEAT-002 |
| Import → revert | clean undo | dependent rows orphaned; no access check | WF-005 |
| Backup → restore | restore in product | installer-only, needs server files | WF-011 |
| Leaver → colleague | ownership handover | no tool | WF-014 |
| User → self (password) | self-service reset | fatal page; unlinked | WF-015, RT-03 |
| Any e-mail send → communication history | visible trail on the record | `email_history` written on success, shown nowhere; `mailto:` not recorded | FEAT-013 |
| Careers shortcuts → search / RSS | search results / feed | empty page / fatal | UX-012, RT-05 |

Dead ends seen at runtime: `?p=search` empty page (#83); `rss/` fatal (#88); forgot password fatal (#04); job-order PDF in the two-container topology (#54, RT-09); careers URLs before enabling (RT-16).

## Area-level unknowns

1. **Mail-dependent paths with a working relay.** WF-002, WF-006, WF-010, WF-012 and UX-023 need a run with a test SMTP relay (and one with an unreachable relay for WF-006) on an isolated instance.
2. **Permission differences.** Only level 500 was used; each workflow's gates (100/200/300/400) need a run with one user per level on an isolated instance.
3. **Placement path.** W6 was not exercised; run 100 → 400 → 500 → 600 → 800 on a job with one opening, then remove the placed candidate, and read `openings_available` and the reports.
4. **Import and revert.** Import a small CSV, work one record into a pipeline, revert, and check for orphan rows (WF-005).
5. **Backup and restore round trip** (WF-011) on an isolated instance.
6. **Questionnaire and registration.** Apply to a job with a questionnaire and with candidate registration enabled (UX-011, UX-007, WF-013).
7. **Web installer.** Click through `installwizard.php` once to confirm whether any branch changes the admin password (WF-001).
8. **Real usage.** Step counts are from a near-empty database; how recruiters actually work around WF-004, WF-008 and WF-014 needs interviews or production data.

## Changes from the Phase 0 edition

- This document is **new in this edition**; there is no Phase 0 counterpart. It supersedes the "Key user journeys" section (J1–J5) of the Phase 0 `UX_UI_AUDIT.md`, now covered with runtime evidence in W3 (J1), W2 (J2), W4 (J3), W11 (J4) and W9 (J5).
- New findings: WF-001 … WF-015. No re-rated, withdrawn or merged IDs.
- Runtime evidence used for confirmation: #04, #05, #24, #36, #76–#79, #85–#87 and RT-01, RT-02, RT-03, RT-04, RT-12, RT-13.
