# OpenCATS Transformation — Recommended Roadmap

**Scope.** A phased plan from today's OpenCATS (`CATS_VERSION 0.9.7.4`, PHP 7.2-only, MyISAM, server-rendered PHP templates) to a modern, enterprise-grade ATS. Every Phase 1 item cites the audit finding that justifies it. Later phases are deliberately coarser; they must be re-planned with the architecture decisions (ADRs) taken in Phase 1.

**Method.** Sequenced from `RISKS.md` (what must be contained first), `MODERNIZATION_OPPORTUNITIES.md` (target direction) and `PRODUCT_GAPS.md` (what the market needs). Durations and team sizes are **ASSUMPTIONS** (a team of ~4–6 engineers + product/design support); they are planning placeholders, not commitments.

**Guiding decisions**
1. **Contain before you build.** Several defects are exploitable today (unauthenticated candidate overwrite, default admin credentials, MD5 passwords, data-corrupting merge). They are fixed in the legacy code first, because the legacy app will keep running for the entire migration.
2. **Strangler-fig, not big-bang.** The legacy app stays in service behind a reverse proxy; capabilities move to the new platform one slice at a time (`MODERNIZATION_OPPORTUNITIES.md` §1).
3. **Tests define parity.** Characterisation tests written in Phase 1 are the acceptance baseline for every later migration step.
4. **Decide explicitly.** Stack, database, tenancy model, target segment and licensing are ADRs with owners and dates, not implicit choices.

---

## Phase overview

| Phase | Name | Goal | Indicative duration (ASSUMPTION) |
|---|---|---|---|
| 0 | Forensic audit | Evidence-based understanding (this document set) | Done |
| **1** | **Stabilise, secure & lay foundations** | Legacy is safe to run on a supported PHP; safety net exists; key decisions made | 10–14 weeks |
| 2 | Platform foundation | New platform skeleton in production behind the proxy: identity, access, audit, observability, API conventions, data migration tooling | 3–4 months |
| 3 | Core recruiting domain | Candidates, jobs, applications, configurable workflows, documents, search — API + new recruiter UI; legacy screens retired per slice | 5–7 months |
| 4 | Candidate experience & collaboration | New careers site, communications timeline, e-mail/calendar integration, interview scheduling, scorecards, hiring-team roles | 4–6 months |
| 5 | Enterprise capabilities | Requisitions & approvals, offers, analytics, privacy automation, public API/webhooks GA, HRIS/job-board integrations | 4–6 months |
| 6 | Differentiation & decommission | AI-assisted features, CRM/sourcing, referrals; legacy fully retired | ongoing |

---

## Phase 1 — Stabilise, secure & lay foundations (detailed)

Phase 1 changes production code in the legacy app **only** for security, correctness and runtime support; it does not add features or begin the UI rewrite.

### 1A. Emergency security & integrity containment (weeks 1–3)

| # | Action | Addresses | Evidence |
|---|---|---|---|
| 1A-1 | Stop accepting `candidateID` from the client in the public apply flow; always create a new candidate or a duplicate link | SEC-024 / API-002 / RISK-002 | `modules/careers/CareersUI.php:725,750,1279-1290` |
| 1A-2 | Fix or disable candidate merge (add `data_item_type` predicates, `site_id` on delete, wrap in a transaction once InnoDB); run a read-only integrity scan on production copies | DB-001 / FEAT-002 / RISK-004 | `lib/Candidates.php:1314-1359,1579,1627` |
| 1A-3 | Password storage: `password_hash`/`password_verify` with rehash-on-login of MD5 rows; forced change for any default credential (`admin`/`admin`, `admin`/`cats`); remove credential-filling JS from `Login.tpl`; remove demo/tester creds from default config | SEC-001/003, DB-009 | `lib/Users.php:93,701,755,840`; `modules/login/LoginUI.php:332`; `modules/login/Login.tpl:94-103`; `config.php:188-197` |
| 1A-4 | Session hardening: `session_regenerate_id(true)` on login; `session_set_cookie_params` with HttpOnly/Secure/SameSite; idle timeout; stop printing `session_id()` into HTML | SEC-007/021, API-006 | `index.php:75`; `lib/Session.php:893-902`; `js/lib.js:332` |
| 1A-5 | Replace forgot-password with a tokenised reset link (never mail passwords) | SEC-002 | `modules/login/LoginUI.php:448-480` |
| 1A-6 | Attachments: `Content-Disposition: attachment`, neutral MIME, remove `html`/`svg` from upload allowlist; site-scope and authorise downloads; ship nginx deny rules equivalent to the `.htaccess` files | SEC-008/009 | `modules/attachments/AttachmentsUI.php:83-90,127`; `lib/FileUtility.php:192` |
| 1A-7 | Close unauthenticated surfaces: remove `toolbar` `getLicenseKey`, require auth on `graphs`, CLI-guard `QueueCLI.php`/`rebuild_old_docs.php`/`scripts/`, require ROOT for `install:*` AJAX, disable `m=tests` module | SEC-010/028, TEST-009, ARCH-006 | `modules/toolbar/ToolbarUI.php:282`; `modules/install/ajax/maint.php:30-37`; `modules/tests/` |
| 1A-8 | Fix DataGrid identifier sanitiser (`'/[^A-Za-z0-9]/'`) and allowlist grid classes | SEC-027 / API-007 | `lib/DataGrid.php:267-268,275-282` |
| 1A-9 | Make `isParsingEnabled()` honour `PARSING_ENABLED` (or remove Resfly calls); keep version check off | RISK-005, API-010 | `lib/License.php:687-727` |
| 1A-10 | Filter private calendar events server-side | FEAT-004 | `lib/Calendar.php:132-145` |
| 1A-11 | Coordinate responsible disclosure with upstream (`Security.MD`) for 1A-1…1A-8 before publishing details | RISK-018 | `Security.MD` |

### 1B. Safety net & delivery pipeline (weeks 1–6, in parallel)

| # | Action | Addresses | Evidence |
|---|---|---|---|
| 1B-1 | Make CI authoritative: fail on test failures, lint **all** first-party PHP, run `composer audit` blocking for runtime deps, report Behat results | TEST-003/005, DEBT-002 | `.github/workflows/ci.yml:21,44,48`; `fail_on_failure: false` |
| 1B-2 | Fix release packaging: build with `composer install --no-dev`, exclude dev/test/docker files, publish checksums | DEP-004 / ARCH-002 / RISK-010 | `ci.yml` release job; `lib/Mailer.php:43` |
| 1B-3 | Characterisation ("golden master") tests for top journeys: login; candidate add/edit/show; job order add; add to pipeline + each status change (DB-state + e-mail side-effect assertions); careers apply; import/revert; export; reports numbers; merge | TEST-001, RISK-011 | `modules/candidates/CandidatesUI.php:2900-3302`, `modules/reports/ReportsUI.php:93-168` |
| 1B-4 | Security regression suite: CSRF, IDOR (attachments, careers), AJAX authorisation matrix, XSS canaries in header/MRU/title | TEST-004 | `test/features/*Security*.feature`; `SecurityContext.php:171-176` |
| 1B-5 | Static analysis: PHPStan with baseline (level ramp), Rector dry-run for PHP 8.3 set, Semgrep rules (ban `eval`, raw `$_REQUEST` in SQL, unescaped echo in `.tpl`) | TEST-010, DEBT-020 | none configured today |
| 1B-6 | Retire dead CI (`.travis.yml`, `.github/workflow/`); stop uploading Behat screenshots to wsend.net | TEST-008/014, DEBT-018 | `test/features/bootstrap/FeatureContext.php:159-184` |
| 1B-7 | Reproducible dev/test environment built from the repo (Dockerfile + nginx config in-repo, pinned MariaDB/MySQL LTS; no phpMyAdmin auto-login published) | DEP-008, ARCH-025 | `docker/docker-compose*.yml` |

### 1C. PHP 8.3 bridge release (weeks 4–10)

| # | Action | Addresses | Evidence |
|---|---|---|---|
| 1C-1 | Fix parse errors and removed functions (curly offsets, `get_magic_quotes_*`, `strftime`, `each`, `mysql_*` in migrations) | ARCH-001, DEBT-001, DEP-001 | `lib/CATSUtility.php:108,122`; `index.php:93,99`; `ajax.php:50,56`; `QueueCLI.php:59`; `lib/DateUtility.php:148` |
| 1C-2 | Fix legacy `implode` order and other TypeErrors | ARCH-001 | `lib/DataGrid.php:1292,1299,1328-1329`; `lib/MRU.php:159` |
| 1C-3 | Dynamic properties: declare properties; `#[AllowDynamicProperties]` stop-gap on `Template` | DEBT-003 | `lib/Template.php:64-67` |
| 1C-4 | Explicit `mysqli_report` mode + make `DatabaseConnection::query()` error handling real (log + fail) | ARCH-009, DB-002 | `lib/DatabaseConnection.php:181-198` |
| 1C-5 | Replace/patch PHP-8-fatal vendored libs (artichow graphs, fpdf 1.53) or gate the features; upgrade jQuery in place only if characterisation tests allow, otherwise defer to new UI | DEP-006, DEP-003 | `lib/artichow/AntiSpam.class.php:63`; `lib/fpdf/fpdf.php:434` |
| 1C-6 | Declare `"php": ">=8.1"` (bridge floor TBD) in `composer.json`; update installer checks; CI matrix 7.4 + 8.3 during transition, then 8.3 only | DEBT-002, DEP-001 | `lib/InstallationTests.php:164` |
| 1C-7 | Resolve CKEditor licensing (4.25.1-lts commercial build without key) — pin open-source 4.22.1 with CSP as stop-gap or procure LTS; plan replacement | DEP-002 | `composer.lock`; `composer.json:19` |

### 1D. Data foundation (weeks 3–12)

| # | Action | Addresses | Evidence |
|---|---|---|---|
| 1D-1 | Introduce an explicit, CLI-run migration tool; freeze `Schema.php` implicit migrations (no migrations from web requests) | DB-006, ARCH-005 | `lib/ModuleUtility.php:443-573`; `modules/install/Schema.php` |
| 1D-2 | Baseline + reconciliation: detect schema variant (fresh vs upgraded), create missing `tag`/`candidate_tag`, align column widths/defaults; CI schema-diff check | DB-007, RISK-009 | `modules/install/Schema.php:1039`; `db/upgrade-*.sql` |
| 1D-3 | Convert to InnoDB + utf8mb4 + pinned `sql_mode` + UTC connection time zone | DB-003/008/020 | `db/cats_schema.sql` (55 × MyISAM); `config.php:136` |
| 1D-4 | Backup/restore: document and test `mysqldump --single-transaction` + attachments; retire broken in-app backup | DB-005 | `modules/install/backupDB.php:152` |
| 1D-5 | Data-profiling scripts (orphans, sentinel dates, double-escaped text, polymorphic ID collisions, collation conflicts) — input to Phase 2 migration design | RISK-013 | `DATABASE_AUDIT.md` §18 |
| 1D-6 | Stop history deletion that rewrites KPIs (pipeline removal/job delete) — soft-delete or archive | DB-013 / FEAT-003 | `lib/Pipelines.php:155-169` |

### 1E. Cross-cutting web hardening (weeks 6–12)

| # | Action | Addresses | Evidence |
|---|---|---|---|
| 1E-1 | CSRF tokens for all state-changing requests in `index.php` and `ajax.php`; POST-only mutations (convert GET delete links) | SEC-004, API-006 | `modules/candidates/Show.tpl:432`; `ajax.php:63,77` |
| 1E-2 | Per-handler authorisation for AJAX (`requireAccess()` in `SecureAJAXInterface`) and for reports/lists/export/activity modules | SEC-026, API-005, FEAT-006 | `lib/AJAXInterface.php:210-216`; `modules/export/ExportUI.php:54-67` |
| 1E-3 | Output escaping: shared header/MRU/title/quick-search first, then highest-risk templates (saved-list names, extra fields, careers reflected params); stop HTML-escaping on input (UX-003 double-encoding) with a data-repair migration | SEC-005, UX-003/006, ARCH-008 | `lib/TemplateUtility.php:295-296,1182`; `lib/MRU.php:150-156`; `lib/UserInterface.php:388-395` |
| 1E-4 | Security headers: CSP (report-only first), X-Frame-Options/frame-ancestors, nosniff, HSTS when TLS; hide SQL errors from users | SEC-012/015 | no `header()` security headers today |
| 1E-5 | LDAP: `ldap_escape`, LDAPS/StartTLS, remove public default host | SEC-006 | `lib/LDAP.php:40,68,96,130` |
| 1E-6 | Login throttling / lockout | SEC-014 | none today |
| 1E-7 | Fix high-impact correctness bugs found in the audit: bulk-selection `serialize`/`json_decode` mismatch; careers `update()` argument misalignment (EEO corruption); EEO form value bugs; tag filter `site_id = 1`; statistics `'OnHold'` typo | UX-002, API-003, UX-004, DB-012, FEAT (stats) | `lib/DataGrid.php:257-259,1988-1993`; `modules/careers/CareersUI.php:1284-1290`; `modules/candidates/Add.tpl:365`; `lib/Candidates.php:2250`; `lib/JobOrderStatuses.php:55` |

### 1F. Decisions & target design (weeks 1–10)

| # | Decision / artefact | Inputs |
|---|---|---|
| 1F-1 | ADR: target segment (staffing agency, corporate TA, or both) and product principles | `PRODUCT_GAPS.md` Unknowns |
| 1F-2 | ADR: backend stack (modern PHP/Symfony vs TypeScript/NestJS) and front-end stack | `MODERNIZATION_OPPORTUNITIES.md` §1.2; team skills (UNKNOWN) |
| 1F-3 | ADR: database (MySQL 8.4/MariaDB LTS InnoDB during strangler vs PostgreSQL with clean cutover) | `DATABASE_AUDIT.md` §18.3 |
| 1F-4 | ADR: tenancy model (single-tenant vs real multi-tenant) and hosting model (self-hosted OSS, SaaS, both) | DB-012, ARCH-013 |
| 1F-5 | ADR: licensing & fork strategy (MPL 2.0/CPL obligations, GPL Sphinx API, CKEditor, upstream relationship) | RISK-017/018, DEP-011 |
| 1F-6 | ADR: strangler routing & session bridging (reverse proxy rules by `m=`/path; how legacy trusts identity issued by the new platform) | ARCH-006, `index.php` routing |
| 1F-7 | Target domain model & context map (Candidate, Job/Requisition, Application, Workflow/Stage, Activity, Document, Company/Contact, Interview, Offer, AuditEvent) with legacy table mapping | MOD-003/004, `DATABASE_AUDIT.md` §18.2 |
| 1F-8 | API conventions + OpenAPI skeleton for the first slices; event catalogue (`application.stage_changed`, …) | MOD-006, `API_AUDIT.md` target design |
| 1F-9 | Privacy design: data inventory & flows, consent model, retention schedule, DSAR/erasure design, EEO field protection | GAP-002, DB-011 |
| 1F-10 | Non-functional targets: SLOs, data volumes, security baseline (OWASP ASVS L2), accessibility (WCAG 2.2 AA) | PERF, UX-005 |

### Phase 1 exit criteria

- All CRITICAL findings in `SECURITY_AUDIT.md`, `DATABASE_AUDIT.md` and `API_AUDIT.md` closed or explicitly risk-accepted by an owner; HIGH security findings closed or scheduled with compensating controls.
- Legacy app runs on PHP 8.3 in CI and in the reference container; release artefacts install and log in successfully (automated smoke test).
- CI is blocking on: tests (unit, characterisation, security), lint of all first-party PHP, PHPStan baseline not regressing, runtime dependency audit.
- Database runs on InnoDB/utf8mb4 via the new migration tool; backups restore in a rehearsal.
- ADRs 1F-1…1F-6 accepted; domain model and API conventions reviewed.

### Explicitly **not** in Phase 1
- No new product features, no UI redesign, no framework migration of legacy modules, no new database engine switch beyond InnoDB/utf8mb4, no multi-tenancy work beyond fixing the three `site_id` bugs.

---

## Phase 2 — Platform foundation (outline)

- New modular monolith skeleton per ADRs; reverse proxy in front of legacy (strangler routing).
- **Identity & access:** OIDC + SAML SSO, SCIM, MFA, RBAC/ABAC policy engine; legacy trusts the new identity via the 1F-6 bridge (GAP-001/003).
- **Audit event store**, structured logging, metrics, tracing, error tracking (GAP-011, MOD-014).
- **Durable queue/scheduler**, object storage, secrets management, CI/CD with preview environments (MOD-012/013).
- **Data migration tooling**: idempotent ETL from legacy tables into the new model, reconciliation reports, rehearsal pipeline on anonymised copies (RISK-013).
- **First slice:** authentication and user administration move to the new platform.
- Exit: SSO/MFA in production for legacy + new; audit log captures all new-platform actions; migration rehearsal passes reconciliation.

## Phase 3 — Core recruiting domain (outline)

- Candidate, Job, Application, Workflow engine (default "Agency (legacy)" template mapping statuses 100–800), Activity, Document pipeline (async extraction, malware scan), Search service.
- API v1 for these resources + webhooks beta.
- New recruiter UI: application board (kanban) + list views, candidate profile with timeline, job view; accessible component system.
- Duplicate detection/merge redesigned; immutable stage-transition history; reporting read model v1 (parity with current reports, validated by Phase 1 characterisation fixtures).
- Retire legacy candidates/joborders/pipelines/lists/activity screens slice by slice once parity tests pass.

## Phase 4 — Candidate experience & collaboration (outline)

- Headless careers API + responsive, SEO-ready careers site with consent capture, spam protection, verified candidate accounts; multi-brand.
- Communications: unified timeline, Google/Microsoft mail + calendar integration, templates, sequences with unsubscribe.
- Interview scheduling (panels, self-scheduling), scorecards/interview kits, hiring-team roles and hiring-manager view.
- Retire legacy careers, calendar, e-mail modules.

## Phase 5 — Enterprise capabilities (outline)

- Requisitions & approval chains, offers with approvals and e-signature, disposition reasons.
- Analytics: funnel, time-in-stage, time-to-fill, source-of-hire, EEO/diversity funnel; warehouse export.
- Privacy automation: retention jobs, DSAR export/erasure, consent management UI.
- Public API GA, webhooks GA, integrations (HRIS, job boards / Google for Jobs, assessments, background checks).
- Retire legacy reports, settings, import/export.

## Phase 6 — Differentiation & decommission (outline)

- AI-assisted parsing, summaries, semantic search/matching, drafting — with human-in-the-loop, audit and bias testing.
- Sourcing CRM, talent pools, referrals.
- Legacy code base archived; final data migration and shutdown.

---

## Dependencies & critical path

```
1A containment ─┐
1B safety net ──┼──► 1C PHP 8.3 bridge ──► 1D InnoDB/utf8mb4 ──► Phase 2 migration tooling ──► Phase 3 slices
1F ADRs ────────┴──────────────────────────────────────────────► Phase 2 platform skeleton ──┘
1E hardening (after 1B tests exist)
```

Critical path: characterisation tests (1B-3) → PHP 8.3 bridge (1C) → data foundation (1D) → Phase 2 migration tooling → Phase 3.

## Key metrics to track

| Metric | Baseline (FACT from audit) | Phase 1 target |
|---|---|---|
| Supported PHP runtime | 7.2 only (EOL) | 8.3 |
| CRITICAL security/data findings open | SEC 3 + API 1 + DB 1 (overlapping) | 0 |
| Tables on transactional engine | 0 / 55 | 55 / 55 |
| First-party PHP files linted in CI | 24 of 355 (`src/` only) | 100% |
| Controllers covered by any automated test | 0 of 66 | top journeys covered by characterisation tests |
| CSRF-protected mutations | 0 | 100% |
| AJAX handlers with access-level checks | 4 of 32 | 32 of 32 |

## Facts vs Assumptions
- **FACT:** All cited evidence and baseline numbers come from the domain audits and lead-auditor verification (`RISKS.md` verification log).
- **ASSUMPTION:** Durations, team size, sequencing of Phases 2–6, and the choice of strangler-fig (based on the audit's evidence but ultimately a business decision).

## Unknowns / Needs Further Investigation
- Team composition/skills and budget → durations and stack ADR.
- Target customers and hosting model → Phase 4/5 ordering (agency vs. corporate features).
- Production deployment specifics (web server, PHP build, data volumes) → Phase 1 packaging and migration sizing.
- Upstream (opencats/OpenCATS) willingness to accept Phase 1 fixes → fork strategy.
