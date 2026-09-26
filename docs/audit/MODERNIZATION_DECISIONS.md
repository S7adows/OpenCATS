# OpenCATS — Modernization Decision Per Area

Complete edition · 2026-09-26 · code at `d607279` (OpenCATS 0.9.7.4)

## Purpose and limits

This document records **one decision per major subsystem**, based only on the evidence in this audit. It says what should happen to each part of the **existing** system. It is not a plan:

- It sets no order and no timeline.
- It chooses no technology.
- It does not decide the OpenCATS 2.0 product scope, which comes from the later competitor research and product strategy.

Where a decision depends on an open strategy question, the row says so (§12).

The ten area assessments each proposed candidate decisions. They mostly agreed. Where they did not, the resolution is recorded in §13.

## Decision vocabulary

| Decision | Meaning for the existing subsystem |
|---|---|
| **KEEP** | Sound as it is. Keep the implementation; only routine upkeep. |
| **REFACTOR** | Keep the capability and its design intent. Repair or restructure the existing implementation. |
| **REPLACE** | Keep the capability. Swap the implementation for a different mechanism. |
| **REMOVE** | Drop it. It has no retained value, or it does harm. |
| **NEW** | The capability does not exist today, and the findings show it is needed. |

"Preserve" names the behaviour to keep, whatever the decision. It links to [MUST_NOT_REBUILD.md](MUST_NOT_REBUILD.md) (MNR-xx). A REPLACE or REFACTOR must keep that behaviour.

## Summary

| Decision | Subsystems |
|---|---|
| KEEP | 4 |
| REFACTOR | 45 |
| REPLACE | 21 |
| REMOVE | 11 |
| NEW | 9 |
| **Total** | **90** |

REFACTOR dominates because most capabilities are worth keeping, but their implementation has defects. The per-area breakdown is in §11.

---

## 1. Runtime platform and application structure

| # | Subsystem | Decision | Evidence | Reasoning | Preserve |
|---|---|---|---|---|---|
| 1.1 | PHP runtime (7.2, end of life) | **REPLACE** | ARCH-001, DEP-001, DEBT-001, DEBT-030 | The code does not parse on any supported PHP version. The runtime has to change, and the code has to be refactored to run on the new one. | — |
| 1.2 | Entry points and bootstraps (`index.php`, `ajax.php`, `careers/`, `xml/`, `rss/`) | **REFACTOR** | ARCH-006, ARCH-022, DEBT-031, RT-05 | The copies have drifted: the RSS bootstrap is broken, the XML one was fixed. They need one shared bootstrap. The public URLs are used externally. | careers and XML feed URLs (MNR-15, MNR-16) |
| 1.3 | Module discovery and the in-request schema-migration runner (`ModuleUtility`, `Schema.php`) | **REPLACE** | ARCH-005, DB-006, DB-027, DEBT-017, RT-01, RT-02 | Migrations are `eval`'d strings run inside page requests. One failure blocks every page, and a half-built schema is possible. | install revision history as data to map from |
| 1.4 | Controllers (`modules/*/…UI.php`) and business rules inside them | **REFACTOR** | DEBT-007, ARCH-003, ARCH-027 | The rules users rely on live only here, for example the status-change rule and the openings rule. They must be extracted, not lost. | MNR-04, MNR-06 |
| 1.5 | Session god-object and global state (`$_SESSION['CATS']`) | **REFACTOR** | ARCH-003, SEC-029 | It blocks testing. The session ID is copied into pages and into the database. | — |
| 1.6 | Hooks and other `eval` code-as-data | **REMOVE** | ARCH-004, DEBT-005, FEAT-015, SEC-011 | There are 278 hook sites but only about 10 implemented hooks, all of them careers-portal restrictions. Those few should become explicit code. | the careers-portal restrictions they enforce |
| 1.7 | Configuration (`config.php` constants, rewritten by the installer) | **REPLACE** | ARCH-014, ARCH-028, DEBT-011, SEC-018, RT-08 | It is tracked PHP source with secrets and placeholder defaults. Nothing validates it at start-up. | — |
| 1.8 | Error handling and logging | **NEW** | ARCH-020, DEBT-029, DEP-016, SEC-012, RT-04, RT-15 | There is none. Fatal errors are served as HTTP 200 with stack traces, including to applicants. | — |
| 1.9 | Background work (queue, `QueueCLI.php`, cron) | **REFACTOR** | ARCH-016, FEAT-010, PERF-017, WF-007 | The queue design exists and runs on PHP 7.2 if scheduled, but nothing provisions or schedules it. The runner must become part of the product. | reminder behaviour (MNR-14) |
| 1.10 | Transactions across multi-step workflows | **NEW** | ARCH-027, WF-006, RT-04 | A late failure leaves partial writes: status saved but openings or event missing; application saved but notifications not sent. | MNR-06, MNR-15 |
| 1.11 | `src/OpenCATS` PSR-4 layer (about 1% of code) | **REFACTOR** | ARCH-012, DEBT-009 | Two paths use it and their success cases work (#10, #19). Its error paths are broken. Whether it grows or is absorbed is a strategy question (§12). | company and job-order add (MNR-12) |
| 1.12 | Absolute URL generation (from the client's `Host` header) | **REFACTOR** | SEC-030, ARCH-026, RT-09 | Links and server-side fetches follow a value the client controls. The base URL should come from configuration. | — |
| 1.13 | Deployment (Docker images, compose files) | **REPLACE** | DEP-008, DEP-017, SEC-023, ARCH-025 | The images are not built from the repository, date from 2019, and include an nginx that ignores the app's `.htaccess` protection. Compose ships known passwords. | — |

## 2. Data

| # | Subsystem | Decision | Evidence | Reasoning | Preserve |
|---|---|---|---|---|---|
| 2.1 | Core relational model (candidate, company, contact, job order, pipeline) | **REFACTOR** | DB-004, DB-014, DB-018 | The model works (whole smoke run) but has no constraints, types or unique keys. | MNR-01 |
| 2.2 | Storage engine and character set (MyISAM, utf8mb3) | **REPLACE** | DB-003, DB-008, PERF-009 | They rule out transactions, foreign keys and full Unicode. Table locks limit concurrency. | all data |
| 2.3 | Polymorphic links (`data_item_type` / `data_item_id`) | **REFACTOR** | DB-001, DB-025, DB-004 | The type is sometimes ignored, which is the root cause of the merge corruption. Links need to be enforceable. | MNR-05 |
| 2.4 | Data-access layer (`DatabaseConnection`) | **REFACTOR** | DB-002, DB-010, ARCH-009, SEC-016 | Keep the single choke point. Errors are never detected, and a few paths bypass escaping. | escaping rule (MNR §6) |
| 2.5 | Pipeline status history (`candidate_joborder_status_history`) | **REFACTOR** | DB-013, FEAT-003, FEAT-008 | The semantics are right. The problems are that deletes erase history and repeated transitions double-count. | MNR-03 |
| 2.6 | Change history (`history`) and login history | **REPLACE** | DB-016, DB-011, SEC-022 | It is incomplete, can be changed, is not backed up and holds personal data. It is the only audit trail. | MNR-05 |
| 2.7 | Delete behaviour (hard cascades) | **REFACTOR** | FEAT-003, DB-004, DB-013 | Deletes erase reporting history and leave orphans. | MNR-03 |
| 2.8 | Extra fields (typed custom fields) | **REFACTOR** | DB-015 | Useful, but keyed by name with no uniqueness. | MNR-13 |
| 2.9 | Settings key/value store | **REFACTOR** | DB-019 | Malformed delete, no unique key, serialized PHP values. | per-site settings values |
| 2.10 | Time-zone handling (fixed `OFFSET_GMT`, SQL text rewriting) | **REPLACE** | DB-020, FEAT-016 | Integer offsets with no daylight saving time, applied by rewriting SQL text. | stored dates |
| 2.11 | Stored text encoding (a mix of raw and HTML-encoded values) | **REFACTOR** | DB-026, SEC-005, UX-003 | Output escaping cannot be fixed until the stored text is made consistent. | all text data |
| 2.12 | Built-in backup and restore | **REPLACE** | DB-005, WF-011 | The backup cannot dump the data. Restore goes through the installer. Backups are written where RT-17 shows files can be downloaded. | — |
| 2.13 | Seed and demo data | **REPLACE** | DB-024, DB-006, RT-01 | The shipped demo dump breaks the app on PHP 7.2. | `db/cats_schema.sql` as the reference schema |
| 2.14 | Data retention and erasure | **NEW** | DB-011, SEC-022, DB-013 | There is no retention, export or erasure path for personal and EEO data. | — |

## 3. Identity, access and security controls

| # | Subsystem | Decision | Evidence | Reasoning | Preserve |
|---|---|---|---|---|---|
| 3.1 | Local password authentication and reset | **REPLACE** | SEC-001, SEC-002, SEC-003, SEC-014, DB-009, RT-03 | Unsalted MD5, a reset that is a fatal error (and was designed to e-mail the password), a default `admin`/`admin` login, and no throttling. | generic login message (MNR-21) |
| 3.2 | Session handling | **REFACTOR** | SEC-007, SEC-021, SEC-029 | Keep server sessions. They need ID regeneration, cookie flags and timeouts, and the ID must stop being copied elsewhere. | — |
| 3.3 | Access-control model and enforcement | **REFACTOR** | SEC-026, SEC-013, SEC-022, FEAT-006, ARCH-007, API-005 | The stored levels are coherent and every user has one. Enforcement is opt-in per action and missing in AJAX, reports, lists, export and import revert. It must become central and deny by default. | MNR-21 |
| 3.4 | CSRF protection | **NEW** | SEC-004 | None exists, and state changes also happen over GET. | — |
| 3.5 | Output encoding in templates | **REFACTOR** | SEC-005, ARCH-008, DEBT-021 | The escaping helper exists (892 uses) but is opt-in. Escaping must happen when rendering, after 2.11. | escape-at-render rule (MNR §6) |
| 3.6 | Security response headers | **NEW** | SEC-015 | The application sends none. | — |
| 3.7 | LDAP sign-in | **REFACTOR** | SEC-006, API-016 | It is the only external identity source. The filter needs escaping and TLS needs to be required. | MNR-23 |
| 3.8 | Stored-file storage and delivery (attachments, uploads, backups) | **REFACTOR** | SEC-008, SEC-009, ARCH-018, DEP-017, RT-17 | Keep the attachment model and the download handler. Move storage out of the web root, check access on every download, and stop serving files inline. | MNR-01, MNR-07 |
| 3.9 | Privacy tooling (read audit, data-subject requests) | **NEW** | SEC-022, DB-011 | Nothing exists today. | — |

## 4. Integration surfaces

| # | Subsystem | Decision | Evidence | Reasoning | Preserve |
|---|---|---|---|---|---|
| 4.1 | Internal AJAX RPC (`ajax.php`, XML responses) | **REFACTOR** | API-005, API-006, API-015, SEC-026 | It drives working UI helpers such as autocomplete and the duplicate check. It needs access checks, CSRF protection and one response format. | the UI behaviours it serves |
| 4.2 | Public API, machine credentials, webhooks | **NEW** | API-001, API-016, API-017 | None exist. The only integration points are feeds, CSV and `eval` hooks. | — |
| 4.3 | XML job feed (pull by job boards) | **REFACTOR** | API-012, #89 | It works, but publishes "CATS (www.catsone.com)" as the employer, the wrong country and double-encoded URLs. | MNR-16 |
| 4.4 | RSS job feed | **REMOVE** | RT-05, API-012, DEBT-031 | It is a fatal error on every request, so nobody can be using it today. The XML feed covers the same need. The careers-page link to it goes too. | — |
| 4.5 | E-mail delivery (the `Mailer` wrapper) | **REFACTOR** | API-011, DEP-016, RT-04, WF-010 | Sending runs inside the request, and every failure is fatal. Bulk free-text mail exposes all recipients to each other. | MNR-18 |
| 4.6 | PHPMailer library | **KEEP** | DEP-013, DEP-016 | Maintained, and no advisory was found in the CI `composer audit`. The fault is in how the app calls it, not in the library. | — |
| 4.7 | CSV import (with revert) | **REFACTOR** | FEAT-006, WF-005 | Revert is a safe undo, but it has no access check and leaves orphan rows. | MNR-22 |
| 4.8 | CSV and vCard export | **REFACTOR** | SEC-031, SEC-022, UX-002 | Export needs a permission check and must neutralise spreadsheet formulas. "Export selected" loses the selection. | MNR-22 |
| 4.9 | Mass resume import (reads a folder on the server) | **REPLACE** | FEAT inventory §8 | It needs shell access to the server. | — |
| 4.10 | ZIP-code lookup (Google, without an API key) | **REPLACE** | API-013, SEC-017 | Google refuses keyless requests. A local `zipcodes` table exists. | — |

## 5. Recruiting features

| # | Subsystem | Decision | Evidence | Reasoning | Preserve |
|---|---|---|---|---|---|
| 5.1 | Pipeline and status model (hard-coded statuses) | **REFACTOR** | FEAT-001, FEAT-018, FEAT-025 | Keep the codes and their meanings, but hold them as data. Today there are no transition rules and no admin control. | MNR-02, MNR-03, MNR-04 |
| 5.2 | Status-change action (one popup) | **REFACTOR** | WF-006, FEAT-018, ARCH-027 | Keep what it does. Change how it does it: save all steps together, and use the same defaults on both sides. | MNR-06 |
| 5.3 | Candidate intake and resume text pre-fill | **REFACTOR** | FEAT-024, ARCH-018 | Works for TXT and DOCX. ODT extraction is broken, and PDF/DOC depend on tool paths that are placeholders. | MNR-07 |
| 5.4 | Resume text extraction (built-in readers and external tools) | **REFACTOR** | FEAT-024, DB-028, DEP-009, RT-08 | The tools are present in the image, but the configured paths are placeholders. Failed extractions are never retried. | MNR-07, MNR-09 |
| 5.5 | Resume keyword search (REGEXP over MyISAM) | **REPLACE** | PERF-001, DB-021, ARCH-017 | The query semantics are right. The implementation is a full scan with no index, and MySQL 8 support is unknown. | MNR-09 |
| 5.6 | Quick search, module searches, saved searches, Recent bar | **REFACTOR** | UX-006, SEC-005 | Works (#38–#48). Output is unescaped, quick search is unpaginated, and saved column preferences are not restored. | MNR-10 |
| 5.7 | Duplicate detection at add | **REFACTOR** | FEAT-007, WF-004 | Works (#24), but only on manual add and not per site. | MNR-08 |
| 5.8 | Candidate merge | **REPLACE** | DB-001, FEAT-002, DB-010 | It corrupts unrelated records and builds SQL from raw input. The capability is needed; this implementation is not. | — |
| 5.9 | Saved lists, hot flags, tags | **REFACTOR** | UX-002, FEAT-020, DB-012 | Works, but "Selected" actions act on the wrong records, and the tag filter hard-codes site 1. | MNR-13 |
| 5.10 | Calendar and events | **REFACTOR** | FEAT-004, FEAT-010, WF-007 | Works (#35–#37). Private events leak to every user, edit and delete have no ownership check, and reminders need the scheduler (1.9). | MNR-14 |
| 5.11 | Client and job intake (companies, contacts, job orders, copy job) | **KEEP** | #09–#20 | Works as designed. Its defects belong to other rows: the editor (8.4), output encoding (3.5), openings (5.1). | MNR-12 |
| 5.12 | Dashboard widgets | **REFACTOR** | UX-025 | Renders (#06, #90), but some labels do not match the data behind them. | MNR-10 |
| 5.13 | First-run wizard and user lifecycle (onboarding, offboarding, recovery) | **REFACTOR** | WF-001, WF-014, WF-015, FEAT-019 | The default password is kept, there is no reassignment when a user leaves, and the wizard cannot add users under the default licence value. | MNR-21 |
| 5.14 | Access-limited settings and admin pages | **REFACTOR** | FEAT-006, SEC-013 | All 15 admin pages load (#59–#73). Some are guarded by the wrong level, and there is no clamp on the level an administrator can grant. | — |

## 6. Candidate-facing capabilities

| # | Subsystem | Decision | Evidence | Reasoning | Preserve |
|---|---|---|---|---|---|
| 6.1 | Careers application flow (apply, pipeline, activity, notifications) | **REFACTOR** | SEC-024, API-002, API-023, FEAT-023, UX-023, UX-024, WF-012, RT-04, RT-12 | This is the core inbound flow. It trusts a candidate ID sent by the browser, drops resumes, and shows applicants fatal errors. | MNR-15 |
| 6.2 | Careers job list and detail pages | **REFACTOR** | FEAT-011, RT-16, UX-001 | Works (#80–#82). The search pages are empty stubs, the site is blank until enabled, only the first site is served, and the layout is not responsive. | MNR-16 |
| 6.3 | Careers candidate "login" and registration (e-mail + surname + ZIP) | **REMOVE** | SEC-025, FEAT-005, UX-007 | It has no secret, and the profile can be read and written by anyone who knows three public facts. Whether real candidate accounts are wanted is a strategy question (§12). | — |
| 6.4 | Screening questionnaires | **REFACTOR** | FEAT-021 | The model is useful, but its actions overwrite candidate data and EEO answers and send a bogus e-mail. | MNR-17 |
| 6.5 | Careers page templates (edited by admins, stored in the database) | **KEEP** | #75 (Careers Website settings incl. templates load; `docs/baseline/CURRENT_UI_MAP.md` §2) | Users have customised them. Presentation changes belong to 6.2. | admin-edited templates |

## 7. Communication, compliance and reporting

| # | Subsystem | Decision | Evidence | Reasoning | Preserve |
|---|---|---|---|---|---|
| 7.1 | E-mail templates and placeholders | **KEEP** | #63, `lib/EmailTemplates.php:249-278` | They work and users customise them. The sending path is 4.5. | MNR-18 |
| 7.2 | Bulk candidate e-mail | **REFACTOR** | FEAT-013, WF-010, UX-002, UX-026 | It targets the wrong recipients, exposes recipients to each other, is limited to administrators, and runs inside the request. | MNR-18 |
| 7.3 | EEO capture and report | **REFACTOR** | SEC-022, RT-10, FEAT-021 | Needed for US compliance. The report and the export have no access check, the page has a JavaScript error, and questionnaire actions blank the answers. | MNR-19 |
| 7.4 | Submission, placement and statistics reports | **REFACTOR** | FEAT-008, DB-013, PERF-012 | They render (#49–#51). Counts come from history rows that can change, there is an `'OnHold'` typo, and each view runs 54 COUNT queries. | MNR-20 |
| 7.5 | Graph images (Artichow) and PDF reports (FPDF with a self-HTTP fetch) | **REPLACE** | DEP-006, DEP-015, PERF-013, PERF-021, ARCH-026, RT-09 | Both fail to parse on PHP 8. The PDF report fetches its own URL and fails in the repo's Docker layout. | report content |

## 8. User interface

| # | Subsystem | Decision | Evidence | Reasoning | Preserve |
|---|---|---|---|---|---|
| 8.1 | Recruiter page shell and templates (table layout, `TemplateUtility` printers, IE code) | **REPLACE** | UX-001, UX-005, UX-006, UX-008, UX-019, RT-14 | Not responsive (978 px at a 390 px viewport), no ARIA, raw output, and it breaks on PHP 8. | MNR-11 page content |
| 8.2 | DataGrid list engine | **REPLACE** | SEC-016, SEC-027, UX-002, PERF-003, PERF-010, DEBT-005 | Request data shapes both the SQL and a file include. Renderers use `eval`. The selection encoding is broken, and the whole result set is materialised. The behaviours are valued. | filters, sorting, column choice, "Only My/Hot" (MNR-10, MNR-13) |
| 8.3 | Popups in iframes (subModal) | **REPLACE** | UX-005, UX-014 | Not usable from the keyboard, and closing one reloads the whole page. | — |
| 8.4 | Rich-text editor (CKEditor 4.25.1 LTS) | **REPLACE** | DEP-002, UX-018, UX-026, RT-07 | It is a commercial build with no licence key and never starts. | formatted content already stored |
| 8.5 | Legacy JavaScript (jQuery 1.3.2 in 3 files, `calendarDateInput`, `suggest.js`) | **REPLACE** | DEP-003, DEP-007, UX-016, UX-020, DEBT-016 | End of life, and several one-line defects. | autocomplete behaviour (MNR-12) |
| 8.6 | Localisation (languages, date formats) | **NEW** | UX-015, FEAT-016 | English only, with two-digit US or European dates. | — |

## 9. Engineering system

| # | Subsystem | Decision | Evidence | Reasoning | Preserve |
|---|---|---|---|---|---|
| 9.1 | Behat access-level suite (1,296 scenarios, 8 test users) | **REFACTOR** | TEST-004, TEST-015 | It encodes the expected access matrix. Its "has permission" assertion also passes on error pages, and one list row accepts a missing check as correct. | the level-per-page matrix |
| 9.2 | Test toolchain (PHPUnit 7, Behat 3.0, Selenium 2.53) | **REFACTOR** | TEST-002, DEP-005 | Keep the scenarios and move them to maintained versions. | existing tests |
| 9.3 | CI (`ci.yml`) | **REFACTOR** | TEST-003, TEST-005, TEST-015, DEBT-002 | CI is green while there are 3 fatal-error paths. It tests only PHP 7.2, lints 24 of 355 files, and no step checks HTTP status or PHP error text. | — |
| 9.4 | Release packaging | **REFACTOR** | DEBT-018, DEP-004 | The release job ships without `vendor/`, which the application requires. | — |
| 9.5 | Observability (timing, query logs, load baseline) | **NEW** | PERF-023, ARCH-020 | Nothing is measured. There is no performance baseline at realistic data volume. | — |

## 10. Remnants to remove

| # | Subsystem | Decision | Evidence | Reasoning |
|---|---|---|---|---|
| 10.1 | Licence / "Professional" gating, upsell pages, hosted-edition gates | **REMOVE** | ARCH-019, FEAT-017, DEBT-015 | It is neutered (always "professional") but still changes behaviour, for example `isParsingEnabled()` always returns true. |
| 10.2 | Resfly SOAP resume parsing | **REMOVE** | SEC-017, API-010, UX-017 | Defunct service, called over plain HTTP. The control is shown even when parsing is disabled, and anonymous careers visitors can trigger it. |
| 10.3 | catsone.com version check (phone-home) | **REMOVE** | SEC-017, FEAT-012 | Dead vendor. It is off in the seeded schema (`db/cats_schema.sql:1044`) but still wired in. |
| 10.4 | Firefox toolbar module | **REMOVE** | SEC-010, FEAT-012 | The client is dead. It exposes the licence key and a GET login. |
| 10.5 | In-app test runner (`m=tests`) and `lib/simpletest` | **REMOVE** | TEST-009, FEAT-014, API-022 | Any logged-in user can run it in production, and it is superseded. |
| 10.6 | Sphinx API and `optional-updates` fork | **REMOVE** | DEP-006, DEBT-013 | A stale fork, disabled by default, under a GPL licence. |
| 10.7 | Dead code: unused `lib/` files (e.g. `Encryption.php`, `Profile.php`), dead tables, orphaned templates | **REMOVE** | ARCH-M01, DB-022, DEBT-015 | Unreferenced. |
| 10.8 | Job-board push stub | **REMOVE** | FEAT-017 | A hook call with no caller. |
| 10.9 | Installer web wizard and web-reachable maintenance scripts (`installtest.php`, `rebuild_old_docs.php`, `QueueCLI.php` in the web root) | **REPLACE** | SEC-010, SEC-028, API-008 | Unauthenticated entry points, and the wizard writes request values into PHP source. First-run setup still has to exist. |

Row 10.9 is a REPLACE; it sits in this section because the current entry points must go.

---

## 11. Decision counts by area

| Area | KEEP | REFACTOR | REPLACE | REMOVE | NEW |
|---|---|---|---|---|---|
| 1. Platform and structure | 0 | 6 | 4 | 1 | 2 |
| 2. Data | 0 | 8 | 5 | 0 | 1 |
| 3. Identity, access, security controls | 0 | 5 | 1 | 0 | 3 |
| 4. Integration surfaces | 1 | 5 | 2 | 1 | 1 |
| 5. Recruiting features | 1 | 11 | 2 | 0 | 0 |
| 6. Candidate-facing | 1 | 3 | 0 | 1 | 0 |
| 7. Communication, compliance, reporting | 1 | 3 | 1 | 0 | 0 |
| 8. User interface | 0 | 0 | 5 | 0 | 1 |
| 9. Engineering system | 0 | 4 | 0 | 0 | 1 |
| 10. Remnants | 0 | 0 | 1 | 8 | 0 |
| **Total (90 subsystems)** | **4** | **45** | **21** | **11** | **9** |

## 12. Decisions that depend on open strategy questions

| Question | Rows affected | Why the audit cannot settle it |
|---|---|---|
| Is multi-tenancy (several organisations in one installation) a requirement? | 2.1, 2.3, `site_id` throughout (DB-012, ARCH-013) | Today's `site_id` model is vestigial: no code creates sites, and the public portals serve only the first site. The audit's default is **REMOVE unless required**. |
| Should returning candidates have real accounts? | 6.3 | The current mechanism must go regardless. Whether something NEW replaces it is a product decision. |
| What is the direction for `src/OpenCATS`? | 1.11 | It is about 1% of the code. Growing it or absorbing it depends on the target architecture, which is outside this audit. |
| How far should the public API and webhooks go? | 4.2 | The need is evidenced. The scope is a product decision. |
| Which languages and locales should be supported? | 8.6 | Depends on the target markets. |
| Which features are actually used? | all REMOVE rows, 5.12, 6.5 | There is no usage telemetry, and users were not interviewed. The REMOVE rows rest on code and runtime evidence that the features are dead or broken. |

## 13. Where the area assessments disagreed, and how it was resolved

| Subsystem | Candidates proposed | Decision here | Reason |
|---|---|---|---|
| PHP runtime | REFACTOR (port) · REPLACE (upgrade) | REPLACE the runtime; the code work sits in 1.4 and the other REFACTOR rows | The runtime version is swapped; the code is repaired. |
| Hooks | REMOVE · REPLACE · REMOVE/REPLACE | REMOVE | Only about 10 hooks do anything. Explicit code replaces them; no hook mechanism needs to be preserved. |
| Access control | REPLACE · REFACTOR · KEEP the levels + REFACTOR enforcement | REFACTOR | The level data is coherent and must be preserved (MNR-21). Enforcement is what changes. Richer roles are a strategy question. |
| DataGrid | REFACTOR · REPLACE the rendering, KEEP the behaviours | REPLACE | The defects are structural: SQL shaped by request data, `eval` renderers, a request-driven include, whole-set loading. The behaviours are preserved. |
| Stored-file storage | REPLACE · REFACTOR | REFACTOR | The attachment model and download handler stay. Storage location and access checks change. |
| Careers portal | KEEP + REFACTOR · REFACTOR · REPLACE the front end | REFACTOR the flow (6.1, 6.2); the front end falls under 8.1 | The flow is valuable. The presentation changes with the rest of the UI. |
| Candidate merge | REMOVE until rewritten · REFACTOR | REPLACE | The capability is needed. The current code must not be carried over. |
| XML feed | KEEP · REFACTOR | REFACTOR | It works, but publishes wrong employer and country data. |
| RSS feed | fix or REMOVE | REMOVE | Broken on every request and duplicated by the XML feed. |
| Keyword search | REPLACE · REFACTOR | REPLACE | The semantics are kept, but the full-scan implementation and its MySQL 8 unknown are structural. |
| Backup | REMOVE/REPLACE · REPLACE | REPLACE | Backup has to exist; this one cannot dump data. |
| Configuration | REPLACE · REFACTOR | REPLACE | Tracked PHP source containing secrets. |
| Time zones and localisation | REPLACE · REFACTOR · NEW | Time zones REPLACE (2.10); localisation NEW (8.6) | They are two different problems. |
