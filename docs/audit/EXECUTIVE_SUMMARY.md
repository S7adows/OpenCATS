# OpenCATS Forensic Audit — Executive Summary

Complete edition · 2026-09-26 · repository `S7adows/OpenCATS`, application code at `d607279` (OpenCATS 0.9.7.4, `constants.php:45`)

This summary covers **findings only**. It proposes no modernization, stack, roadmap or product strategy. Competitor research and the OpenCATS 2.0 strategy follow as separate work. The method, finding template, confirmation levels and severity scale are in [README.md](README.md).

---

## 1. Bottom line

1. **OpenCATS runs today, but only on an end-of-life runtime.** The unmodified application installs and works on PHP 7.2.16 with nginx 1.17.3 and MariaDB 10.7.8. It cannot parse on any supported PHP version (ARCH-001, DEP-001, DEBT-001).
2. **Most everyday recruiting work functions.** In the 15-area smoke test of the running app, 8 areas worked without runtime errors and 2 worked with errors. 4 were partly broken, and e-mail was broken or could not be verified (`docs/baseline/SMOKE_TEST.md`).
3. **The domain model and daily workflows are the valuable part.** Candidates, clients, jobs, pipelines with status history, activities, resume search and the careers application flow all work. [MUST_NOT_REBUILD.md](MUST_NOT_REBUILD.md) lists 24 capabilities that must be preserved.
4. **There are five distinct critical issues** (§4):
   - an unauthenticated overwrite of any candidate;
   - an unforced `admin`/`admin` default;
   - SQL injection reachable by any logged-in user;
   - a candidate merge that corrupts unrelated records;
   - the PHP 8 blocker.
5. **Failures are silent or raw.**
   - Database errors are never detected.
   - PHP fatal errors are served as HTTP 200 with stack traces, including to job applicants.
   - Several flows lose data without telling anyone.
   - The project's own CI is green on this code.

## 2. How the audit was done, and its limits

- **Static review** of all code, schema, configuration, tests and CI, with read-only commands (`grep`, `wc`, `git`, `php -l` on PHP 8.4). Every Phase 0 citation was re-checked.
- **Runtime baseline (Phase 0.5).** The unmodified app was installed and exercised in 94 browser steps across 15 feature areas, with fictional data, logs and screenshots (`docs/baseline/`). The problems it exposed are RT-01…RT-17.
- **CI evidence.** The public "Tests (PHP 7.2)" run on this branch ([run 36237531847](https://github.com/S7adows/OpenCATS/actions/runs/36237531847)).
- **Not done** (each gap appears in the affected findings as "Unknown / needs further validation"):
  - No runtime security testing.
  - No measurement at realistic data volume.
  - No real SMTP, LDAP or parsing service.
  - Only the administrator account was used.
  - No production data or user interviews.
  - Only Chromium was used.

---

## 3. Findings at a glance

| Area | Document | Findings | CRIT | HIGH | MED | LOW | Runtime | Static | Partial |
|---|---|---|---|---|---|---|---|---|---|
| 1. Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) + [CODEBASE_MAP.md](CODEBASE_MAP.md) | 33 | 1 | 12 | 19 | 1 | 12 | 16 | 5 |
| 2. Database and schema | [DATABASE_AUDIT.md](DATABASE_AUDIT.md) | 28 | 1 | 11 | 12 | 4 | 8 | 19 | 1 |
| 3. Security | [SECURITY_AUDIT.md](SECURITY_AUDIT.md) | 31 | 3 | 10 | 17 | 1 | 7 | 21 | 3 |
| 4. API | [API_AUDIT.md](API_AUDIT.md) | 21 | 1 | 8 | 12 | 0 | 4 | 15 | 2 |
| 5. UX/UI | [UX_UI_AUDIT.md](UX_UI_AUDIT.md) | 26 | 0 | 9 | 12 | 5 | 10 | 14 | 2 |
| 6. Performance | [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) | 23 | 0 | 6 | 13 | 4 | 7 | 10 | 6 |
| 7a. Testing | [TESTING_AUDIT.md](TESTING_AUDIT.md) | 15 | 0 | 5 | 8 | 2 | 3 | 12 | 0 |
| 7b. Dependencies | [DEPENDENCY_AUDIT.md](DEPENDENCY_AUDIT.md) | 18 | 1 | 6 | 8 | 3 | 6 | 11 | 1 |
| 8. Feature inventory | [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) | 25 | 1 | 8 | 13 | 3 | 8 | 17 | 0 |
| 9. Technical debt | [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) | 27 | 1 | 10 | 13 | 3 | 8 | 19 | 0 |
| 10. Current workflows | [WORKFLOW_ANALYSIS.md](WORKFLOW_ANALYSIS.md) | 15 | 0 | 3 | 11 | 1 | 6 | 7 | 2 |
| **Total** | | **262** | **9** | **88** | **138** | **27** | **79** | **161** | **22** |

No finding is left Unverified. Six Phase 0 IDs survive only as merged stubs and are not counted.

Some overlap is deliberate: one defect can be recorded from several angles. For example, the PHP 8 blocker appears as ARCH-001, DEP-001 and DEBT-001, and the careers overwrite as SEC-024 and API-002. The 9 CRITICAL IDs describe 5 distinct issues.

---

## 4. The critical issues

| # | Issue | IDs | Confirmation | Who can trigger it | Consequence |
|---|---|---|---|---|---|
| 1 | The public careers apply form trusts a candidate ID sent by the browser and updates that existing candidate | SEC-024, API-002 | Static | Anyone on the internet, once the careers site is enabled | Any candidate's record can be overwritten |
| 2 | A fresh install accepts `admin`/`admin` with ROOT rights and never forces a change. The change prompt fires only for the password `cats`, and the login page script defines credential-filling helpers | SEC-003 (also WF-001, DB-009) | **Runtime** (#05) | Anyone who can reach the login page of an unchanged install | Full takeover |
| 3 | The data-grid sort direction is taken from request data and concatenated into `ORDER BY`, and the tag filter builds an unchecked `IN (…)` list | SEC-016 | Static | Any logged-in user, including READ-only | Reading any table the application can read, including password hashes, which leads to account takeover (not tested) |
| 4 | Candidate merge moves activities, attachments, events and list entries by record number without their type. It silently re-links other companies', contacts' and jobs' records, and builds SQL from raw input | DB-001, FEAT-002 | Static | Any administrator who uses merge | Silent corruption of unrelated records |
| 5 | The application cannot parse on any supported PHP version (8.x). Everything in the repository targets PHP 7.2, which is end of life | ARCH-001, DEP-001, DEBT-001 | Static (`php -l` on 8.4; baseline ran on 7.2) | — | No supported runtime, and no security patches for the runtime |

Phase 0 rated MD5 password storage (SEC-001) CRITICAL. It is HIGH in this edition, because exploiting it first requires a copy of the user table or database logs.

---

## 5. What running the application confirmed

These were **observed** on the unmodified app. The RT numbers refer to `docs/baseline/KNOWN_RUNTIME_ERRORS.md`.

- **Broken features.**
  - Forgot-password is a PHP fatal error (RT-03; SEC-002).
  - The RSS feed is a fatal error, and every careers page links to it (RT-05).
  - The rich-text editor never starts: CKEditor 4.25.1 is a commercial LTS build with no licence key (RT-07; DEP-002).
  - PDF resumes are not searchable, because the committed tool paths are placeholders (RT-08).
  - The job-order PDF report fails when PHP cannot reach its own public URL (RT-09; ARCH-026).
- **Data lost without notice.**
  - A careers applicant's resume is discarded unless they click "Upload" before submitting (RT-12; UX-024).
  - After a saved application, a mail failure stops the recruiter notifications (WF-012).
  - Data-grid "Selected" actions ignore the selection: one candidate was ticked and two became e-mail recipients (#78; UX-002, FEAT-020).
- **Failure handling.**
  - Every e-mail failure is an uncaught exception and becomes a fatal page (RT-04; DEP-016).
  - Fatal errors are served as **HTTP 200**, with stack traces, server paths and, on the careers site, part of the applicant's e-mail address (RT-15; SEC-012, ARCH-020).
  - PHP warnings are printed into pages (RT-02, RT-06, RT-11).
- **Security, as seen during normal use.**
  - `admin`/`admin` works after install (#05).
  - Stored resumes download by direct URL without a session under the repository's nginx image, and the app writes those raw paths into activity notes (RT-17; SEC-008).
  - Downloads are served inline (#29).
- **Schema management.**
  - Migrations run inside page requests. On the demo-data path, migration 225 fails on PHP 7.2 and every request fails after it (RT-01; ARCH-005, DB-006).
  - Starting against an empty database builds a partial schema (RT-02; DB-027).
- **The safety net does not catch any of this.** The project's CI check "Tests (PHP 7.2)" passes: 88 unit tests, 9 integration tests and 1,323 Behat scenarios. No step checks HTTP status or PHP error text (TEST-015).
- **Performance on a near-empty database is fine.** Server time was 24–46 ms per page, with a maximum of 73 ms. Nothing was measured at realistic volume (PERF-023).

---

## 6. Key findings by area

**1. Architecture** — [ARCHITECTURE.md](ARCHITECTURE.md)
- A module-per-directory PHP monolith. Routing uses `index.php?m=&a=`, the internal RPC uses XML over `ajax.php`, and templates are raw PHP.
- Executable code stored as strings is run with `eval()`: hooks, grid renderers and migrations (ARCH-004).
- Migrations run in web requests (ARCH-005).
- No error model (ARCH-020), and no transactions across multi-step workflows (ARCH-027).
- Stored files live in the web root, protected only by Apache files (ARCH-018).
- The modern `src/OpenCATS` layer stalled at about 1% of the code (ARCH-012).

**2. Database and schema** — [DATABASE_AUDIT.md](DATABASE_AUDIT.md)
- 55 MyISAM tables in utf8mb3, with no foreign keys and no transactions (DB-003, DB-008).
- SQL errors are never detected (DB-002).
- Deletes erase status history, so past reports change silently (DB-013).
- Fresh and upgraded installs end with different schemas (DB-007).
- The built-in backup cannot dump data (DB-005).
- Personal and EEO data have no erasure path (DB-011).
- Stored text is a mix of raw and HTML-encoded values (DB-026).

**3. Security** — [SECURITY_AUDIT.md](SECURITY_AUDIT.md)
- The three critical issues in §4.
- Unsalted MD5 passwords (SEC-001).
- No CSRF protection anywhere (SEC-004).
- Stored and reflected XSS from opt-in escaping (SEC-005).
- AJAX handlers check login but not access level (SEC-026).
- Attachments reachable without authorization (SEC-008).
- The session ID is copied into pages and a second cookie (SEC-029).
- Absolute URLs are built from the client's `Host` header (SEC-030).
- No security headers (SEC-015).

**4. API** — [API_AUDIT.md](API_AUDIT.md)
- No public, documented or versioned API (API-001). There are no webhooks, and the only extension point is `eval` hooks (API-017).
- The internal RPC's response contract is inconsistent (API-015).
- The XML feed works but names "CATS (www.catsone.com)" as the employer (API-012).
- Mail integration fails hard (API-011).
- Maintenance endpoints are reachable without authentication (API-008).

**5. UX/UI** — [UX_UI_AUDIT.md](UX_UI_AUDIT.md)
- Not responsive: pages are 978 px wide at a 390 px viewport (UX-001).
- Bulk actions act on the wrong records (UX-002).
- Not operable by keyboard or screen reader, with no ARIA (UX-005). No accessibility scan results are recorded.
- English only, with US-style dates (UX-015).
- Applicants see raw fatal errors (UX-023).
- The editor never starts (UX-018).

**6. Performance** — [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md)
- Resume search is a REGEXP full scan with no index (PERF-001).
- List queries materialise the whole filtered set, and the client chooses the page size (PERF-003).
- The Reports tab runs 54 COUNT queries per view (PERF-012).
- Scaling out is blocked by local files, file sessions and self-requests (PERF-018).
- There is no instrumentation (PERF-023).
- All volume-dependent costs are unmeasured.

**7. Testing and dependencies** — [TESTING_AUDIT.md](TESTING_AUDIT.md), [DEPENDENCY_AUDIT.md](DEPENDENCY_AUDIT.md)
- Tests barely touch domain logic (TEST-001).
- CI lints 24 of 355 PHP files and runs only PHP 7.2 (TEST-003).
- A green CI does not show the app works (TEST-015).
- The release archive omits `vendor/` (DEP-004).
- CKEditor is on a commercial LTS line (DEP-002). jQuery 1.3.2 loads on every back-office page (DEP-003).
- Bundled PHP libraries are frozen copies that fail on PHP 8 (DEP-006).
- The container images are from 2019 and not built from the repository (DEP-008).

**8. Feature inventory** — [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md)
- Every module action and entry point is listed with its enforced access level, runtime status and value.
- The pipeline is a fixed list of statuses with no rules (FEAT-001).
- Private calendar events are visible to every user (FEAT-004).
- Questionnaires overwrite candidate data and EEO answers (FEAT-021).
- The openings counter drifts and then blocks placements (FEAT-025).
- The in-app test runner ships in production (FEAT-014).

**9. Technical debt** — [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md)
- Business rules live in controllers and are duplicated with drift (DEBT-007).
- 13.7% of first-party PHP and 20.8% of templates are exact clones (DEBT-013).
- No error boundary (DEBT-029).
- Loose typing prints warnings today and will become fatal errors on PHP 8 (DEBT-030).
- Configuration is tracked PHP source containing secrets (DEBT-011).
- The bootstrap copies have drifted, which is what breaks RSS (DEBT-031).

**10. Current workflows** — [WORKFLOW_ANALYSIS.md](WORKFLOW_ANALYSIS.md)
- Twelve end-to-end workflows were traced, with actors, step counts, data written, side effects and runtime status.
- A status change with e-mail stops half-way when mail fails, leaving openings and events unwritten (WF-006).
- Bulk e-mail exposes every recipient to the others (WF-010).
- Placement does not close the job (WF-008).
- There is no offboarding path (WF-014), and account recovery depends on an administrator (WF-015).

---

## 7. What works and must be preserved

[MUST_NOT_REBUILD.md](MUST_NOT_REBUILD.md) lists 24 items, each with evidence and the defects not to carry over. In short:

- **Data and its meaning:** the recruiting data model; the status codes 100–800; the status-history rules that the submission and placement reports depend on; the openings rule; the automatic activity trail.
- **Recruiter workflows:**
  - the single status-change action;
  - resume text pre-fill;
  - the duplicate warning;
  - boolean resume keyword search;
  - quick search and the Recent bar;
  - the one-page candidate record;
  - client and job intake conveniences;
  - lists and flags;
  - the calendar linked to records.
- **Candidate-facing:** the careers application flow; the Public + Active rule for publishing jobs; screening questionnaires, with their intended "add, not overwrite" behaviour.
- **Communication, compliance, administration:** e-mail templates and placeholders; EEO capture and report; submission and placement reports; the access levels as stored; CSV import with revert; LDAP; the licence attribution.

---

## 8. Modernization decision per area

[MODERNIZATION_DECISIONS.md](MODERNIZATION_DECISIONS.md) classifies 90 subsystems from the evidence alone, with no plan and no stack choice:

| Decision | Count | Examples |
|---|---|---|
| KEEP | 4 | e-mail templates, client and job intake, careers page templates, the PHPMailer library |
| REFACTOR | 45 | pipeline and status model, status-change action, careers application flow, data-access layer, access-control enforcement, LDAP, CSV import |
| REPLACE | 21 | PHP runtime, migration runner, configuration, password authentication, MyISAM/utf8mb3 storage, DataGrid, resume search, candidate merge, CKEditor, recruiter page shell, backup |
| REMOVE | 11 | `eval` hooks, careers pseudo-login, RSS feed, licence and "Professional" gating, Resfly parsing, phone-home, Firefox toolbar, in-app test runner, Sphinx fork, dead code, job-board push stub |
| NEW | 9 | error handling and logging, transactions across workflows, CSRF protection, security headers, privacy tooling, data retention and erasure, public API and webhooks, localisation, observability |

Six decisions depend on open strategy questions, for example whether multi-tenancy is a requirement. These are listed in its §12.

---

## 9. What is still unknown

These are the most consequential open questions. Each area document lists its own, with how to validate them.

1. **Security findings not observed at runtime** (all Static and Partial SEC and API items) need authorized testing on an isolated instance.
2. **Behaviour per access level.** Only the administrator account was used, so the enforcement gaps are known from code only.
3. **Production reality.** Web server (Apache or nginx), PHP settings, whether the careers site, registration, questionnaires and LDAP are enabled, and whether any cron runs `QueueCLI.php`.
4. **Existing damage in production data**: merge corruption, orphans, duplicate pipelines, openings drift, and the mix of encoded and raw text.
5. **Performance at realistic volume and under concurrency**: search, list queries, reports and first-request migrations.
6. **Mail-dependent paths with a working SMTP relay**: status-change mail, notifications, bulk mail, reminders.
7. **Database compatibility beyond MariaDB 10.7**: MySQL 8 `REGEXP '[[:<:]]'`, `ONLY_FULL_GROUP_BY`, current MariaDB LTS.
8. **PHP 8 behaviour beyond the parse blockers**, which cannot be observed until the code parses.
9. **Upgrade population**: installations whose schema predates migration 225 and would hit RT-01.
10. **Real feature usage and business context**: no telemetry, no user interviews, and git history before 2022 is not in this clone.

---

## 10. Changes from the Phase 0 edition

- **Finding count.** 217 → **262**. That is 47 new findings (15 of them in the new workflow analysis), with 2 API findings merged into architecture (API-018 → ARCH-016, API-019 → ARCH-001). Separately, four DEBT rows that Phase 0 listed only in its summary table (DEBT-025…028) are kept as merged stubs.
- **Critical findings.** 8 → **9**:
  - SEC-016 raised from MEDIUM ("Potential") to CRITICAL.
  - FEAT-002 raised from HIGH to CRITICAL, aligned with DB-001.
  - SEC-001 lowered from CRITICAL to HIGH.
- **Other notable re-ratings.**
  - Up: DB-013, ARCH-018, ARCH-020 and FEAT-020 to HIGH; SEC-022, SEC-023, ARCH-024 and TEST-012 to MEDIUM.
  - Down: SEC-006, SEC-010, API-001, ARCH-006, PERF-006, UX-001, DEP-003 and ARCH-M04 to MEDIUM; UX-014 to LOW.
  - Reasons are in each document's change log.
- **79 findings are now Runtime-confirmed.** Phase 0 was static only.
- **Corrections.** Examples:
  - The phone-home check is disabled in the seeded schema.
  - SVG uploads are stored as `.svg.txt`.
  - ODT text extraction always fails.
  - There are 251 hook names with 10 implemented.
  - CI does fail on Behat and PHPUnit failures, because the steps run under `bash -e`.
- **New documents:** [WORKFLOW_ANALYSIS.md](WORKFLOW_ANALYSIS.md), [MUST_NOT_REBUILD.md](MUST_NOT_REBUILD.md), [MODERNIZATION_DECISIONS.md](MODERNIZATION_DECISIONS.md), [README.md](README.md).
- **Removed from the audit documents:** target designs, remediation plans and phasing, as findings-only scope requires. The Phase 0 forward-looking documents (RISKS, PRODUCT_GAPS, MODERNIZATION_OPPORTUNITIES, RECOMMENDED_ROADMAP) are unchanged apart from a status note, and will be revisited during strategy work.
