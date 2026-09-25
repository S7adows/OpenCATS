# OpenCATS — Modernization Opportunities

**Scope.** Translates the audit findings into concrete modernization options: what to keep, redesign, replace or retire, and the target architecture direction. Each opportunity is tied to specific code in this repository. Sequencing and phase exit criteria are in `RECOMMENDED_ROADMAP.md`.

**Method.** Derived from the domain audits (`ARCHITECTURE.md`, `DATABASE_AUDIT.md`, `SECURITY_AUDIT.md`, `API_AUDIT.md`, `UX_UI_AUDIT.md`, `PERFORMANCE_AUDIT.md`, `TESTING_AUDIT.md`, `DEPENDENCY_AUDIT.md`, `TECHNICAL_DEBT.md`, `FEATURE_INVENTORY.md`, `PRODUCT_GAPS.md`). Architecture options are evaluated against the facts of this code base; the final choice of backend framework is flagged as an ADR decision because it depends on team skills (UNKNOWN).

---

## Summary table

| ID | Opportunity | Disposition | Value | Severity of problem addressed |
|---|---|---|---|---|
| MOD-001 | Adopt a strangler-fig migration to an API-first modular monolith | Strategy | Very high | CRITICAL |
| MOD-002 | PHP 8.3 "bridge" release of the legacy app (keep it alive during migration) | Stabilise | High | CRITICAL |
| MOD-003 | Explicit domain model: Candidate, Job, Application (pipeline), Stage, Activity, Document, Company, Contact | Redesign | Very high | HIGH |
| MOD-004 | Configurable workflow engine replacing hard-coded pipeline constants | Replace | Very high | HIGH |
| MOD-005 | Identity & access platform (OIDC/SAML/SCIM, MFA, RBAC/ABAC) | Replace | Very high | CRITICAL |
| MOD-006 | Public REST API + webhooks + domain events replacing `ajax.php` XML RPC and `eval` hooks | Replace | Very high | HIGH |
| MOD-007 | Data platform: InnoDB/utf8mb4 (or PostgreSQL), FKs, real migrations, immutable application history | Redesign | Very high | HIGH |
| MOD-008 | Document pipeline: object storage, async text extraction, malware scanning, modern parsing | Replace | High | HIGH |
| MOD-009 | Search service with relevance and facets (later semantic) | Replace | High | MEDIUM |
| MOD-010 | New UI: accessible component system, responsive, SPA/hybrid on top of the API | Replace | Very high | HIGH |
| MOD-011 | Headless, responsive careers site with verified candidate accounts | Replace | High | CRITICAL (security) |
| MOD-012 | Durable job queue & scheduler | Replace | Medium | MEDIUM |
| MOD-013 | Configuration via environment/secret store; 12-factor deployment; container images built from repo | Replace | High | HIGH |
| MOD-014 | Observability: structured logs, metrics, tracing, audit event store | New | High | HIGH |
| MOD-015 | Quality engineering: characterization tests, static analysis, CI gates, SAST/DAST | New | Very high | HIGH |
| MOD-016 | Retire dead/legacy code (license, toolbar, phone-home, SimpleTest runner, unused libs) | Retire | Medium | MEDIUM |
| MOD-017 | Reporting & analytics model built on stage-transition events | Redesign | High | HIGH |
| MOD-018 | AI-assisted features on top of the new platform (parsing, summaries, matching) | New (later) | Medium–High | LOW |

---

## 1. Architecture direction

### 1.1 Options considered

| Option | Description | Fit with facts in this repo | Verdict |
|---|---|---|---|
| A. Incremental refactor in place | Upgrade PHP, gradually refactor `lib/` + `modules/` into a framework | Code is controller-centric with global state (`$_SESSION['CATS']` 386 references, `DatabaseConnection::getInstance()` 110 — `TECHNICAL_DEBT.md`), raw-PHP templates with opt-in escaping (ARCH-008), `eval` everywhere (ARCH-004), MyISAM (DB-003). Refactoring in place touches every file for every cross-cutting fix. The `src/OpenCATS` PSR-4 attempt reached ~1% of code (ARCH-012) — evidence this path stalls. | Not recommended as the end state; used only for the bridge (MOD-002). |
| B. Big-bang rewrite | New product built to parity, then cut over | High implicit behaviour density (status-change side effects `modules/candidates/CandidatesUI.php:2900-3302`, DB-stored careers templates, report semantics); near-zero characterization tests (RISK-011). | Not recommended (RISK-012). |
| **C. Strangler-fig to an API-first modular monolith** | New platform placed in front of legacy via reverse proxy; capabilities migrate slice by slice; legacy retired module by module | Legacy already routes by `m=<module>&a=<action>` (`index.php`), which makes route-level interception straightforward; modules are coarse-grained (23) and map to bounded contexts; shared MySQL-family database allows an initial shared-data period. | **Recommended.** |
| D. Microservices | Separate services per domain | Team size unknown; domain is cohesive (candidates ↔ jobs ↔ applications); operational overhead not justified. | Not recommended now; modular monolith keeps the option open. |

### 1.2 Recommended target (MOD-001)

```
                        ┌──────────────────────────────────────────────┐
  Browser / Mobile ───► │ Edge: reverse proxy (routing by path),       │
  Careers visitors      │ TLS, WAF, rate limits                        │
  Integrations          └───────┬───────────────────────┬──────────────┘
                                │ new routes            │ not-yet-migrated routes
                                ▼                       ▼
   ┌─────────────────────────────────────────┐   ┌──────────────────────────┐
   │ NEW PLATFORM (modular monolith)         │   │ LEGACY OpenCATS (bridge  │
   │  ├─ identity & access (OIDC/SAML, RBAC) │   │  release on PHP 8.3)     │
   │  ├─ recruiting core (candidate, job,    │   │  index.php?m=…&a=…       │
   │  │   application, workflow, activity)   │   │  shrinking over time     │
   │  ├─ documents (storage, extraction)     │   └────────────┬─────────────┘
   │  ├─ careers (headless API)              │                │
   │  ├─ communications (mail, calendar)     │                │
   │  ├─ reporting (event-sourced history)   │                │
   │  ├─ integration (REST API, webhooks)    │                │
   │  └─ audit log                           │                │
   └───────┬──────────────┬──────────────────┘                │
           │              │ events                            │
           ▼              ▼                                   ▼
     ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌──────────────────────┐
     │ RDBMS    │   │ Queue /  │   │ Object    │   │ Search index         │
     │ (InnoDB  │◄──┤ scheduler│   │ storage   │   │ (OpenSearch / PG FTS)│
     │ utf8mb4) │   └──────────┘   └───────────┘   └──────────────────────┘
     └──────────┘ ◄── shared during transition, legacy tables migrated per slice
```

**Principles (each tied to an observed failure):**
1. *API-first* — every UI action goes through the same authorised API (fixes UI-only enforcement, ARCH-007 / API-005).
2. *Secure by default* — auto-escaping templates or a JS framework, CSRF/session handling by the framework, central policy checks (fixes SEC-004/005/007, ARCH-008).
3. *Explicit schema & migrations* — versioned, CLI-run, reviewed, tested in CI (fixes DB-006/007, ARCH-005).
4. *No code-as-data* — no `eval`; extension via typed events/listeners and webhooks (fixes ARCH-004).
5. *Stateless app tier* — sessions/cache in Redis or signed tokens, files in object storage (fixes PERF-018).
6. *Immutable history* — stage transitions as append-only events (fixes DB-013/FEAT-003 report rewriting; enables MOD-017).

**Stack choice (ADR required in Phase 1).** Two defensible options; decide on team skills and hiring market (UNKNOWN):
- **Modern PHP (8.3+) with Symfony** (or Laravel) — continuity with the current contributor base and PHP hosting; mature security components (password hashers, CSRF, SAML/OIDC bundles), Doctrine Migrations; easiest shared-session bridging during strangler period. *Default recommendation if the team is PHP-based.*
- **TypeScript (Node, e.g. NestJS)** — single language with the new front end; strong ecosystem for API + SPA. *Recommended if the team is TS-first.*
- Front end in either case: TypeScript + React (or Vue) with an accessible component library, served as SPA or server-rendered hybrid; careers site server-rendered for SEO.
- Database: stay on the **MySQL family (MySQL 8.4 LTS / MariaDB 11.4 LTS, InnoDB, utf8mb4)** during the strangler period so legacy and new code can share tables; evaluate **PostgreSQL 16+** (RLS, `jsonb`, `tsvector`, transactional DDL — `DATABASE_AUDIT.md` §18.3) only if a clean data cutover is planned. Avoid two database migrations in a row.

---

## 2. Keep / Redesign / Replace / Retire

### 2.1 KEEP (preserve behaviour and data; re-implement faithfully)

| Asset | Why it is worth keeping | Evidence |
|---|---|---|
| Core recruiting domain & data (candidates, companies, contacts, job orders, pipelines, activities, events, attachments, lists, tags, extra-field values) | The data *is* the customer value; model is broadly sound for agency recruiting | `db/cats_schema.sql`; `FEATURE_INVENTORY.md` |
| Pipeline status history semantics (submitted/placed counting) | Existing reports and KPIs depend on it | `lib/Pipelines.php`, `lib/Statistics.php` |
| Status-change side-effects (activity log, optional candidate e-mail, event scheduling, openings decrement on Placed) | Users rely on this workflow; must be captured by characterization tests before re-implementation | `modules/candidates/CandidatesUI.php:2900-3302` |
| Agency features: client companies/contacts, cold-call list, vCard | Differentiates OpenCATS for staffing agencies | `modules/contacts`, `lib/VCard.php` |
| EEO capture & report (US) | Compliance requirement for US users | `modules/reports/EEOReport.tpl`, `lib/Statistics.php` |
| CSV import with revert; export | Migration on-ramp for new customers | `modules/import`, `modules/export` |
| Careers questionnaires concept | Useful screening feature | `lib/Questionnaire.php` |
| E-mail templates with placeholders | Familiar to users | `lib/EmailTemplates.php` |
| LDAP authentication (as a legacy connector) | Existing on-prem customers | `lib/LDAP.php` (must be fixed — SEC-006) |
| MPL 2.0 licensing & attribution obligations | Legal continuity | `LICENSE.md`, `lib/TemplateUtility.php:816-831` |

### 2.2 REDESIGN (keep capability, rebuild logic/UX)

| Area | Current state | Target | Evidence |
|---|---|---|---|
| Pipeline → Application + Workflow | 11 constants, no rules (FEAT-001) | Workflow templates, typed stages, transition rules, stage actions (MOD-004) | `constants.php:120-130` |
| Access control | One global level per user; UI-only checks | RBAC + scoping + field masks enforced in API (MOD-005) | `lib/ACL.php`, `lib/AJAXInterface.php:210-216` |
| List views (DataGrid) | 2,649-LOC class; JSON/serialize params in URL; `eval` renderers; full reloads | Server-side paginated API + client grid with saved views; keyset pagination | `lib/DataGrid.php` |
| Duplicate detection & merge | Exact-name, unscoped; merge corrupts | Fuzzy matching on all ingestion paths; transactional, type-safe merge with provenance | `lib/Candidates.php:1136-1210,1314-1359` |
| Calendar | Single-owner events; private leak; cron reminders | Interview scheduling with calendar sync (GAP-006) | `lib/Calendar.php:132-145` |
| Reports | 54 COUNT queries; mutable history | Event-sourced reporting model (MOD-017) | `modules/reports/ReportsUI.php:93-168` |
| Extra fields (EAV) | 6 types, no validation | Typed custom fields with validation and permissions (JSON column or typed EAV) | `lib/ExtraFields.php` |
| Multi-tenancy | Vestigial `site_id`; public portals hard-wired to first site | Decide single-tenant vs real multi-tenant (DB-012); if multi, enforce at data layer | `lib/Site.php:161-181` |
| Email | Synchronous PHPMailer, exceptions uncaught, history never shown | Async sending, templating, timeline, mailbox sync | `lib/Mailer.php` |
| Localization | MM-DD-YY, integer GMT offsets, SQL rewriting | UTC storage, IANA zones, ICU formatting, message catalogs | `lib/DatabaseConnection.php:648-711` |

### 2.3 REPLACE (swap for a modern equivalent)

| Legacy component | Replace with | Evidence |
|---|---|---|
| `index.php` switch + `ModuleUtility` discovery + `UserInterface` controllers | Framework router/controllers (API) | `index.php`, `lib/ModuleUtility.php` |
| `lib/Template.php` raw PHP includes (opt-in escaping) | Auto-escaping templates / SPA components | ARCH-008 |
| `ajax.php` XML/HTML RPC + `js/lib.js` XHR wrapper that `eval`s responses | REST/JSON API + typed client | `ajax.php`, `js/lib.js:852-880` |
| `lib/Hooks.php` `eval` string hooks | Domain events + listeners + webhooks | `lib/Hooks.php:52-72` |
| `DatabaseConnection` (sprintf SQL, dead error handling) | Query builder/ORM with bound parameters, exceptions, transactions | `lib/DatabaseConnection.php:181-198` |
| `modules/install/Schema.php` inline/eval migrations | Migration tool (Doctrine Migrations / Flyway / Liquibase / framework-native) | DB-006 |
| MD5 password storage | Argon2id/bcrypt via framework hasher, rehash-on-login | `lib/Users.php` |
| jQuery 1.3.2, submodal, sweetTitles, sorttable, calendarDateInput | Modern component library | `js/` |
| CKEditor 4 | Maintained rich-text editor with sanitisation (e.g. TipTap/ProseMirror-based or CKEditor 5 under suitable licence) | `composer.json` |
| Artichow graphs, fpdf 1.53 PDFs | Client-side charts; maintained PDF library or HTML-to-PDF service | `lib/artichow`, `lib/fpdf` |
| Resfly SOAP parser | Maintained parser / LLM extraction (privacy-reviewed) | `wsdl/parse.wsdl:78`, `lib/ParseUtility.php` |
| Sphinx 2.x API / REGEXP search | Search service (MOD-009) | `lib/sphinx`, `lib/DatabaseSearch.php:362` |
| `QueueCLI.php` + cron | Durable queue/scheduler (MOD-012) | `QueueCLI.php` |
| `config.php` PHP constants rewritten at runtime | Env vars + secret manager + typed config | `lib/CATSUtility.php:142-181` |
| Installer wizard writing `config.php` | Container image + migrations + first-run admin bootstrap (CLI or one-time token) | `installwizard.php`, `modules/install/ajax/ui.php` |
| Behat 3.0 + Selenium 2.53 image, PHPUnit 7.5 | Current PHPUnit/Pest, Playwright E2E | `composer.json`, `docker/docker-compose-test.yml` |

### 2.4 RETIRE (remove; no user value or unsafe)

| Item | Why | Evidence |
|---|---|---|
| License/"Professional" gating and upsell pages | Neutered (always true) and misleading | `lib/License.php:687-706`; `modules/settings/Professional.tpl` |
| Phone-home new-version check to catsone.com | Sends license key/site name; dead vendor | `lib/NewVersionCheck.php:98-133` |
| Firefox toolbar module | Browser platform gone; unauthenticated `getLicenseKey` | `modules/toolbar/ToolbarUI.php:282` |
| In-app SimpleTest runner (`m=tests`) + `lib/simpletest` (31k LOC) | Runs against live data; superseded | `modules/tests/testcases/WebTests.php:29-35` |
| Unused libs: ControlPanel, Profile, Display, CBFUtility, DefaultQuestionnaires, JavaScriptCompressor, Encryption (mcrypt) | ~4.2k LOC dead code | `TECHNICAL_DEBT.md`, `CODEBASE_MAP.md` |
| `wsdl/` clients, SimplyHired feed, catsone.com branding in feeds | Dead services | `modules/xml/xml_templates/*.xtpl` |
| `.travis.yml`, `.github/workflow/` (singular — never executed), `scripts/svnkeywords.sh`, `rebuild_old_docs.php` | Dead tooling | `TECHNICAL_DEBT.md` DEBT-018 |
| Demo mode & tester credentials in config | Security risk | `config.php:188-197` |
| IE-specific CSS/JS, BrowserDetection, getFirefoxModal | Obsolete browsers | `ie.css`, `lib/BrowserDetection.php` |

---

## 3. Opportunity details

### MOD-002 — PHP 8.3 bridge release
- **Finding:** The legacy app is unrunnable on supported PHP (ARCH-001/DEBT-001) and will need to keep running for the whole strangler period.
- **Evidence:** `lib/CATSUtility.php:108`; `index.php:93`; `lib/DataGrid.php:1292-1329`; `lib/MRU.php:159`; 6 files fail `php -l` on 8.4 (`TECHNICAL_DEBT.md`); 178 dynamic properties in 28 classes (DEBT-003).
- **Opportunity:** A narrowly-scoped, test-backed compatibility release lets every later phase run on a patched runtime and provides the environment for characterization tests.
- **Recommendation:** Mechanical fixes only (Rector PHP-8 rule sets where safe, manual fixes for parse errors/removed functions/`implode`), `#[AllowDynamicProperties]` as a stop-gap on `Template` and affected classes, `mysqli_report(MYSQLI_REPORT_OFF)` explicitly to preserve legacy semantics until error handling is fixed; replace/remove artichow & fpdf breakages or gate those features. CI matrix: 7.4 + 8.3.

### MOD-003 / MOD-004 — Domain model and workflow engine
- **Finding:** Recruiting logic is scattered in controllers (status-change rule only in `CandidatesUI.php:3088-3100`; duplicated dialog logic with drift in `JobOrdersUI.php:1459-1467` — DEBT-007); pipeline states are constants.
- **Recommendation:** Define bounded contexts and aggregates: `Candidate` (person, contact points, consent), `Job`/`Requisition`, `Application` (candidate × job, current stage, history), `WorkflowTemplate`/`Stage`, `Activity`, `Document`, `Company`/`Contact` (agency CRM), `Interview`/`Scorecard`, `Offer`. Seed a default "Agency (legacy)" workflow mapping statuses 100–800 one-to-one so migrated data and reports stay meaningful.

### MOD-006 — API, events and webhooks
- **Finding:** No API (API-001); 32 AJAX handlers with inconsistent auth; `eval` hooks (232+ points, ~10 implemented).
- **Recommendation:** OpenAPI 3.1-first design; resource list derived from the 32 existing AJAX handlers + module actions (`API_AUDIT.md` target design); OAuth2 + scoped API keys; outbound webhooks with HMAC signatures and retries; domain events as the only extension mechanism.

### MOD-007 — Data platform
- **Finding:** MyISAM, utf8mb3, no FKs, sentinel dates, polymorphic IDs, schema drift (DB-003/007/008).
- **Recommendation:** Follow `DATABASE_AUDIT.md` §18.1 order: baseline & reconcile schema variants → InnoDB + utf8mb4 → pinned `sql_mode`/UTC → orphan cleanup → FKs → split polymorphic tables (or add typed FK columns) in the new model. Immutable `application_stage_transition` table replaces deletable `candidate_joborder_status_history`.

### MOD-008 — Document pipeline
- **Finding:** Uploads in web root, served inline, 0777 dirs, synchronous `exec()` extraction without timeouts, ODT extraction broken, resumes sent to a defunct vendor (SEC-009, PERF-004, ARCH-018).
- **Recommendation:** S3-compatible object storage with signed URLs, async extraction workers (Apache Tika or equivalent in a sandbox), malware scanning, content-type enforcement, per-tenant encryption keys if multi-tenant.

### MOD-010 / MOD-011 — New UI and careers site
- **Finding:** No responsive design, no accessibility, jQuery 1.3.2, 344 global functions, 340 inline handlers (UX-001/005, `UX_UI_AUDIT.md`); careers portal insecure and not responsive (UX-007, SEC-024/025).
- **Recommendation:** Design system with WCAG 2.2 AA acceptance criteria; recruiter workspace with kanban and list views of applications; candidate profile with unified timeline; careers site SSR + schema.org `JobPosting`, theming per brand, verified candidate accounts.

### MOD-013 / MOD-014 — Operations
- **Finding:** Config is PHP source rewritten from requests; secrets committed (`config.php`, `lib/sphinx/conf/sphinx.conf:14-18`); Docker is dev-only with phpMyAdmin exposed; no logging (ARCH-014/020/025).
- **Recommendation:** 12-factor config, secrets manager, images built in CI from the repo, health/readiness endpoints, structured JSON logs, OpenTelemetry traces, error tracking, audit event store (GAP-011).

### MOD-015 — Quality engineering
- **Finding:** Minimal tests, CI does not fail on red tests, no static analysis (`TESTING_AUDIT.md`, DEBT-002/018).
- **Recommendation:** Characterization/golden-master suite for legacy journeys; PHPStan (level ramp) + Rector on the bridge; strict type checking in the new platform; contract tests for the API; Playwright E2E; SAST (Semgrep), dependency scanning, DAST (ZAP baseline) in CI; migration rehearsal jobs.

### MOD-017 — Reporting & analytics
- **Recommendation:** Build time-in-stage, funnel conversion, time-to-fill, source-of-hire and EEO funnel from immutable transition events; expose a read model and a warehouse export (CSV/Parquet) for BI tools.

### MOD-018 — AI-assisted features (after foundations)
- **Recommendation:** Only after MOD-005/006/007/014 exist: parsing/normalisation, summaries, job-description drafting, semantic search, outreach drafting — with human review, audit logging, bias-testing and opt-out; legal review for employment-AI regulation (ASSUMPTION about applicability).

---

## Facts vs Assumptions
- **FACT:** All current-state descriptions and evidence citations (see linked audits).
- **ASSUMPTION:** Relative value ratings; team skills (drives stack ADR); that customers want both agency and corporate TA capabilities; that a shared-database strangler period is acceptable operationally.

## Unknowns / Needs Further Investigation
- Team composition and skills (PHP vs TypeScript) → stack ADR.
- Hosting model (self-hosted OSS distribution vs SaaS vs both) → multi-tenancy decision, packaging, licensing.
- Customer data volumes → search and DB sizing.
- Which legacy features are actually used (telemetry/user interviews) → cut-over order and retirement list.
