# OpenCATS Phase 0 Forensic Audit — Executive Summary

**Date:** 2026-09-25 · **Repository:** `S7adows/OpenCATS` (fork of `opencats/OpenCATS`), branch `master` at `d607279` · **Application version:** `CATS_VERSION '0.9.7.4'` (`constants.php:45`)
**Nature of this audit:** read-only static inspection of code, schema, configuration, tests and CI, plus targeted execution of the PHP 8.4 CLI (`php -l`, small `php -r` checks) and, in an isolated scratch copy, `composer install`/`phpunit`. No production code was modified. No live database or deployed instance was available, so runtime behaviour is labelled as inference where it could not be executed.

---

## 1. Headline

OpenCATS is a working, feature-rich **agency-style ATS written in 2005–2007-era PHP** that has been kept alive with patches. It has a genuinely useful domain model and workflow, but it **cannot run on any supported PHP version**, has **several exploitable security and data-integrity defects** (including an unauthenticated way to overwrite any candidate record), stores everything in **non-transactional MyISAM tables**, and has **almost no automated safety net**. It is not a foundation to extend in place; it is a **source of domain knowledge and data to migrate from**, while being made safe to operate during the migration.

**Recommended direction:** contain and stabilise the legacy app (Phase 1), then migrate capability-by-capability (**strangler-fig**) to a new **API-first modular monolith** with a modern, accessible front end.

---

## 2. Audit deliverables

| Document | Focus | Findings (C / H / M / L) |
|---|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the system really works; request lifecycle; PHP 8 compatibility | 25 (1 / 9 / 14 / 1) |
| [CODEBASE_MAP.md](CODEBASE_MAP.md) | Navigable map of every directory, module and `lib/` class; dead code | 5 (0 / 2 / 2 / 1) |
| [DATABASE_AUDIT.md](DATABASE_AUDIT.md) | 55-table schema, migrations, integrity, tenancy, privacy, target model | 24 (1 / 10 / 10 / 3) |
| [SECURITY_AUDIT.md](SECURITY_AUDIT.md) | AuthN/AuthZ, injection, XSS, CSRF, files, secrets, OWASP mapping | 28 (3 / 11 / 11 / 3) |
| [API_AUDIT.md](API_AUDIT.md) | All AJAX endpoints, public surfaces, integrations, target API | 22 (1 / 9 / 11 / 1) |
| [UX_UI_AUDIT.md](UX_UI_AUDIT.md) | IA, journeys, accessibility, mobile, i18n, careers UX | 22 (0 / 8 / 11 / 3) |
| [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) | Query patterns, search, per-request overhead, scalability | 20 (0 / 7 / 11 / 2) |
| [TESTING_AUDIT.md](TESTING_AUDIT.md) | Tests, CI gates, coverage, PHP 8 test runs | 14 (0 / 4 / 7 / 3) |
| [DEPENDENCY_AUDIT.md](DEPENDENCY_AUDIT.md) | Composer, vendored PHP/JS, images, licences, CVEs | 14 (1 / 5 / 5 / 3) |
| [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) | Quantified debt register, hotspots | 23 (1 / 9 / 11 / 2) |
| [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) | Every feature with entry point and keep/redesign/replace/retire | 20 (0 / 6 / 10 / 4) |
| [PRODUCT_GAPS.md](PRODUCT_GAPS.md) | Missing enterprise ATS capabilities | 25 gaps (3 / 11 / 9 / 2) |
| [MODERNIZATION_OPPORTUNITIES.md](MODERNIZATION_OPPORTUNITIES.md) | Target architecture, keep/redesign/replace/retire | 18 opportunities |
| [RISKS.md](RISKS.md) | Consolidated risk register + lead-auditor verification log | 20 risks (5 / 9 / 6 / 0) |
| [RECOMMENDED_ROADMAP.md](RECOMMENDED_ROADMAP.md) | Phased plan; detailed Phase 1 | — |

Across the eleven domain documents there are **217 evidence-backed findings (8 CRITICAL, 80 HIGH, 103 MEDIUM, 26 LOW)**. There is deliberate overlap (e.g. the PHP 8 blocker is recorded from architecture, dependency, debt and API angles); `RISKS.md` de-duplicates them into 20 risks.

---

## 3. The five most important facts (each independently verified)

| # | Fact | Evidence |
|---|---|---|
| 1 | **The app cannot boot on PHP ≥ 8.0.** Only EOL PHP 7.x works; CI and Docker use PHP 7.2. | `php -l lib/CATSUtility.php` on PHP 8.4 → parse error line 108 (`$data{0}`), included by `index.php:61`; `index.php:93` calls `get_magic_quotes_runtime()` (removed in 8.0, no polyfill); `lib/DataGrid.php:1292` legacy `implode` → `TypeError`; `.github/workflows/ci.yml:21` matrix `['7.2']` |
| 2 | **Anyone on the internet can overwrite any candidate's data** through the public careers apply form. | `modules/careers/CareersUI.php:725` reads `candidateID` from POST → `:1279-1290` `Candidates::update($candidateID, …)` |
| 3 | **Credentials are weak by construction.** Unsalted MD5; a fresh install's effective default `admin`/`admin` is never forced to change; no MFA/lockout/session regeneration; no CSRF protection anywhere; forgot-password is broken. | `lib/Users.php:840`; `db/cats_schema.sql:1108` + `modules/install/Schema.php:1329` + `modules/login/LoginUI.php:332`; no `csrf|nonce|_token` in first-party code; `Users::getPassword()` undefined |
| 4 | **Data integrity is not guaranteed.** 55/55 tables MyISAM (no transactions/FKs); DB errors are never detected; candidate merge re-parents records of *other* entity types; in-app backup cannot dump data. | `db/cats_schema.sql`; `lib/DatabaseConnection.php:181-198`; `lib/Candidates.php:1314-1359`; `modules/install/backupDB.php:152` |
| 5 | **There is almost no safety net.** Tests touch ~49 of ~1,106 `lib` methods and 0 of 66 controllers; CI does not fail on test failures and lints only `src/` (24 of 355 PHP files); the release job ships without `vendor/`, which the app requires. | `TESTING_AUDIT.md` TEST-001/003/005; `ci.yml` (`fail_on_failure: false`, release job); `lib/Mailer.php:43` |

---

## 4. Answers to the ten questions

### 1. What is OpenCATS today?
A server-rendered PHP monolith (~83k LOC first-party production PHP, 136 `.tpl` templates, ~16k LOC first-party JS, plus ~47k LOC vendored PHP) descended from the 2007 commercial "CATS" product (Cognizo Technologies). Requests enter through `index.php?m=<module>&a=<action>`, which loads one of 23 modules whose `*UI.php` controllers call table-gateway classes in `lib/` that build SQL with `sprintf` against a MySQL/MariaDB database of 55 MyISAM tables, and render raw-PHP templates. It targets **staffing agencies**: candidates, client companies and contacts, job orders, a fixed 11-status pipeline, activities, calendar, attachments with resume text extraction, saved lists, EEO reporting, a public careers portal with questionnaires, RSS/XML job feeds, CSV import/export and LDAP login. Multi-tenancy (`site_id`) and licensing/"Professional" code are remnants of the hosted CATS product and are vestigial. A thin PSR-4 layer (`src/OpenCATS`, ~1% of runtime code) was started and stalled. Maintenance activity is low and concentrated (shallow history since 2022: 57 commits, mostly security patches and version bumps).

### 2. What are its strongest foundations?
- **A proven recruiting domain model and workflow** — candidate ↔ job pipelines with status history, activities, submissions/placements, client CRM (`lib/Pipelines.php`, `lib/Candidates.php`, `lib/JobOrders.php`, `db/cats_schema.sql`). This is the real asset.
- **Real customer data structures** that can be migrated (entities, pipelines, history, attachments with extracted text).
- **Mostly consistent SQL escaping** via `makeQueryString`/`makeQueryInteger` — the security audit found no raw `$_GET/$_POST` concatenated into SQL; residual risk is narrow (ORDER BY/IN lists, second-order in merge).
- **Centralised entry routing** (`index.php` switch; `ajax.php` dispatcher) — makes strangler-fig interception by route practical.
- **Useful feature breadth** for agencies: EEO capture/report, careers questionnaires, import with revert, e-mail templates, duplicate linking, vCard.
- **Open licence** (MPL 2.0 for OpenCATS code; CPL 1.1a for original CATS code) that permits a modernised derivative, subject to attribution obligations.

### 3. What is holding it back from becoming a modern enterprise ATS?
- **Runtime lock-in** to EOL PHP 7.x (Fact 1).
- **Security architecture**: no CSRF, opt-in escaping (1,302 of 1,705 template echoes unescaped), UI-only authorisation (4 of 32 AJAX handlers check access level), MD5 passwords, no SSO/MFA, uploads served from web root, `eval()` on 278 hook points.
- **Data layer**: MyISAM, utf8mb3, no FKs, schema drift between fresh and upgraded installs, migrations executed implicitly from web requests, polymorphic IDs that collide across entity types.
- **Architecture**: global state (`$_SESSION['CATS']` 386 accesses), god classes (`SettingsUI` 3,842 LOC; `CandidatesUI` 3,582; `DataGrid` 2,649), business rules in controllers and duplicated, no API, no DI, no logging.
- **Product**: hard-coded pipeline, one global access level per user, no interview scheduling/scorecards/offers/requisitions, no privacy tooling, count-only reporting, non-responsive and inaccessible UI (jQuery 1.3.2, no viewport, zero ARIA), no i18n.
- **Engineering system**: near-zero tests, soft CI, broken release packaging, no static analysis.

### 4. What should be kept?
The **domain knowledge and data**: entities and relationships, pipeline status semantics and history (for report continuity), status-change side-effects, agency CRM features (companies, contacts, cold-call list, vCard), EEO capture/reporting, careers questionnaires, CSV import with revert, e-mail templates, LDAP as a legacy connector, and the licence/attribution obligations. Keep them as **behaviour specified by characterisation tests**, not as code. (Full list: `MODERNIZATION_OPPORTUNITIES.md` §2.1; per-feature dispositions: `FEATURE_INVENTORY.md`.)

### 5. What should be redesigned?
Capabilities that stay but need new logic/UX: pipeline → **Application + configurable Workflow** (seeded with an "Agency (legacy)" template mapping statuses 100–800); **access control** (RBAC + scoping + field masks, enforced in the API); **list views** (replace `DataGrid`); **duplicate detection & merge**; **calendar → interview scheduling**; **reporting** on immutable stage-transition events; **custom fields**; **e-mail** (async, timeline); **localisation** (UTC/IANA/ICU); **multi-tenancy** (decide single vs real multi-tenant).

### 6. What should be replaced?
The **platform plumbing**: `index.php`/`ModuleUtility` routing and controllers; raw-PHP templates; the `ajax.php` XML RPC and `js/lib.js` `eval`-based client; `eval` hooks (→ domain events/webhooks); `DatabaseConnection` (→ parameterised queries, exceptions, transactions); `Schema.php` migrations (→ a migration tool); MD5 hashing; jQuery 1.3.2/submodal/etc. (→ component system); CKEditor 4; artichow/fpdf; the Resfly SOAP parser; REGEXP/Sphinx search (→ search service); `QueueCLI.php` + cron (→ durable queue); `config.php` constants (→ env/secrets); the installer (→ container + migrations + bootstrap). Also **retire**: licence/"Professional" code, phone-home, Firefox toolbar, in-app SimpleTest runner, ~4.2k LOC of unused libs, dead CI files, IE-specific code.

### 7. What capabilities are missing?
Critical/high gaps (`PRODUCT_GAPS.md`): **SSO/MFA and secure credential lifecycle**; **privacy tooling** (consent, retention, DSAR, erasure); **RBAC with teams/record scoping**; **public API/webhooks/events**; **configurable workflows**; **interview scheduling & calendar sync**; **structured feedback/scorecards**; **requisitions & approvals**; **offer management**; **hiring-team/hiring-manager experience**; **tamper-evident audit log**; **modern careers site**; **e-mail/calendar integration & communication timeline**; **funnel/time-based analytics**. Medium: job distribution, search relevance, dedupe, sourcing CRM, mobile/accessibility, i18n, disposition reasons, reliable background jobs, maintained resume parsing. Low/differentiators: AI assistance, assessments/background checks/onboarding integrations.

### 8. What are the biggest technical risks?
1. **Operating on an EOL runtime** with no path to PHP 8 until code is fixed (RISK-001).
2. **Exploitable defects in production today**: unauthenticated candidate overwrite, default credentials, MD5, XSS+CSRF chains, attachment IDOR/inline HTML (RISK-002/003/006/007).
3. **Silent data corruption/loss**: merge bug, MyISAM partial writes, undetected DB errors, non-working backups (RISK-004/008).
4. **Migration risk**: schema variants across installs, polymorphic ID collisions, double-escaped text, orphans, charset issues — and possibly pre-existing corruption (RISK-009/013).
5. **Changing behaviour blind**: no characterisation tests, soft CI (RISK-011).
6. **Big-bang rewrite stall** if the programme tries to reach parity before shipping (RISK-012).
7. **Privacy/regulatory exposure**, including resume text sent over HTTP to a defunct third party whenever parsing is triggered, despite `PARSING_ENABLED=false` (RISK-005).
8. **Licensing** of bundled components (GPL Sphinx API, commercial CKEditor 4 LTS build without a key) (RISK-017).

### 9. What architecture direction do you recommend?
A **strangler-fig migration to an API-first modular monolith**:
- A reverse proxy fronts both systems; routes move from the legacy app to the new platform one capability slice at a time; the legacy app runs as a **PHP 8.3 "bridge" release** until retired.
- Bounded contexts: identity & access, recruiting core (candidate, job/requisition, application, workflow, activity), documents, careers, communications, interviews/feedback, offers, reporting, integrations, audit.
- Secure-by-default framework (central authz policies, CSRF/session handling, auto-escaping or SPA), versioned REST API with OpenAPI + webhooks + domain events (no `eval`), explicit migrations, immutable stage-transition history, stateless app tier with object storage, durable queue, search service, and first-class observability/audit.
- **Stack is an ADR in Phase 1**: modern PHP 8.3+/Symfony (default if the team is PHP-based — continuity and easier session bridging) or TypeScript/NestJS; TypeScript + React (or Vue) front end with an accessible component library; MySQL 8.4/MariaDB LTS on InnoDB/utf8mb4 during the strangler period (PostgreSQL only if a clean cutover is chosen).
- Not recommended: in-place refactor as the end state (the `src/OpenCATS` attempt stalled at ~1%), big-bang rewrite, or microservices at this stage.

### 10. What should Phase 1 of the transformation be?
**"Stabilise, secure & lay foundations" (≈10–14 weeks, ASSUMPTION)** — change legacy code only for security, correctness and runtime support (`RECOMMENDED_ROADMAP.md` §Phase 1):
- **1A Containment (weeks 1–3):** fix the careers `candidateID` overwrite; fix/disable candidate merge and scan data; `password_hash` with rehash-on-login and forced change of default credentials; session hardening; tokenised password reset; safe attachment serving and site-scoped downloads; close unauthenticated surfaces (`getLicenseKey`, graphs, CLI scripts, install AJAX, `m=tests`); fix the DataGrid sanitiser; honour `PARSING_ENABLED`; server-side private-event filtering; coordinated disclosure upstream.
- **1B Safety net:** authoritative CI (blocking tests, lint all PHP, dependency audit), fixed release packaging, characterisation tests for top journeys and reports, security regression suite, PHPStan/Rector/Semgrep, reproducible containers.
- **1C PHP 8.3 bridge:** parse/removed-function/`implode`/dynamic-property fixes, real DB error handling, vendored-lib breakages, declared PHP constraint, CKEditor licensing resolution.
- **1D Data foundation:** CLI migration tool, schema baseline & reconciliation, InnoDB + utf8mb4 + UTC, tested backups, data profiling for migration, stop KPI-rewriting history deletes.
- **1E Hardening:** CSRF + POST-only mutations, per-handler AJAX authorisation, escaping of shared header/MRU/title and highest-risk templates, security headers, LDAP fixes, login throttling, high-impact correctness bugs (bulk selection, EEO misalignment, tag `site_id = 1`, `'OnHold'` typo).
- **1F Decisions:** ADRs for target segment, stack, database, tenancy/hosting, licensing/fork strategy, strangler routing/session bridging; target domain model, API conventions, privacy design, non-functional targets.
- **Exit criteria:** no open CRITICAL security/data findings; legacy runs on PHP 8.3 with a working release artefact; blocking CI with characterisation + security tests; InnoDB/utf8mb4 via migrations with tested restore; ADRs accepted.

---

## 5. Facts vs Assumptions (programme level)

- **FACT:** Current-state descriptions and all `path:line` evidence across the document set. Highest-stakes claims were re-verified by the lead auditor (see the verification log in `RISKS.md`). Two sub-audit claims were **corrected** during verification and the corrections are recorded in the documents: forgot-password does not e-mail passwords (it crashes on an undefined method — `SECURITY_AUDIT.md` SEC-002), and the effective fresh-install default credential is `admin`/`admin` (not `admin`/`cats`).
- **ASSUMPTION:** Market expectations for an "enterprise ATS"; likelihood ratings; durations/team size; status of external services (Resfly, SimplyHired, catsone.com); licensing interpretations; applicability of specific regulations.

## 6. Unknowns requiring further investigation

1. **Production deployment reality**: web server (Apache vs nginx), PHP build/extensions, whether careers portal/LDAP/demo mode/registration are enabled, cron presence.
2. **Data**: volumes, growth, and whether the merge bug has already corrupted production data (requires a data scan).
3. **Runtime behaviour not executed here**: integration/Behat suites (no DB/Docker daemon used), PHP 8 runtime breakages beyond parse/TypeError blockers, MySQL 8 behaviour of `REGEXP '[[:<:]]'` and `ONLY_FULL_GROUP_BY`.
4. **Git history before 2022** (this clone is shallow) — churn, prior incidents, credential history.
5. **Business context**: target segment (agency vs corporate TA), hosting model (self-hosted vs SaaS), team skills and budget, upstream relationship.
6. **Legal**: licence obligations for a commercial distribution; CKEditor LTS terms; regulatory scope for EEO/AI features.
