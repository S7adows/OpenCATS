# OpenCATS 2.0 — Table Stakes (proposed)

**Status:** PROPOSED. A capability is a *table stake* when the Phase 2 evidence shows it is expected across OpenCATS's plausible segments and its absence disqualifies the product (`docs/competitive/COMPETITIVE_GAP_ANALYSIS.md`, classification TABLE STAKE; `docs/competitive/ENTERPRISE_ATS_REQUIREMENTS.md` Bar 0/Bar 1). These are **requirements statements, not designs**. Each row states the minimum bar (**[RECOMMENDATION]**), the market evidence (grade in the source document), and the Phase 0 baseline.

**Legend:** GA-# = row in `COMPETITIVE_GAP_ANALYSIS.md`; ER-# = `ENTERPRISE_ATS_REQUIREMENTS.md`; UXP-# = `MODERN_ATS_UX_PATTERNS.md`. *Upstream note* = addressed in upstream OpenCATS v0.11.x per commit subjects (not code-reviewed).

---

## 0. Precondition — safe to operate (Bar 0)
Close Phase 0 CRITICALs before anything else: unauthenticated candidate overwrite (SEC-024), MD5 + default admin (SEC-001/003 — *upstream note: #685, #873*), CSRF and session fixation (SEC-004/007 — *upstream note: CSRF #693*), attachment IDOR/inline HTML (SEC-008/009), merge corruption (DB-001), Resfly egress (RISK-005), broken backups (DB-005). Source: ER §6.1; `docs/audit/RISKS.md`.

## 1. Identity, access and security

| # | Table stake (minimum bar) | Evidence | Baseline |
|---|---|---|---|
| T1 | SSO via **OIDC and SAML 2.0**, SSO enforcement, break-glass admin — in the open core | GA-44; ER Bar 1 #1; PRC §6.3 (Ashby includes on all plans) | LDAP only (GAP-001) |
| T2 | **MFA** (TOTP + WebAuthn/passkeys), modern password hashing with rehash, tokenised reset, throttling/lockout | GA-46; ER Bar 1 #2; NIST 800-63B-4 [FACT] | MD5, broken reset (SEC-001/002/014) — *upstream note: #685* |
| T3 | Session policy (≤24 h absolute, ≤1 h idle default), revocation, ID rotation, secure cookies | ER Bar 1 #3 | SEC-007/021 |
| T4 | **RBAC**: persona roles + **job-scoped hiring-team roles** + confidential jobs + masked field classes (EEO, compensation, private notes); enforced in the service/API layer | GA-47/48; ER Bar 1 #4; UXP-16 | One global level (FEAT-006) — *upstream note: #724 adds checks* |
| T5 | **Append-only audit log** incl. sensitive reads, exports, API/agent access; ≥1 year default; export/stream | GA-49; ER Bar 1 #5 | Mutable partial history (GAP-011) |
| T6 | Data protection: TLS/HSTS/security headers, secrets outside config, encryption guidance for special-category fields | ER Bar 1 #11 | SEC-015/018 |
| T7 | Security evidence: disclosure policy + security.txt, pentest before GA, SBOM, signed releases, advisories | ER Bar 1 #13 | Private e-mail only (`Security.MD`) |

## 2. Privacy and compliance

| # | Table stake | Evidence | Baseline |
|---|---|---|---|
| T8 | **Consent per purpose** at apply (processing, retention/talent pool, marketing, demographics) with policy version | GA-56; Greenhouse/Lever consent fields [FACT]; Teamtailor two-level consent [FACT] | None (GAP-002) |
| T9 | **Retention schedules** with automated **field-selective anonymisation**, legal hold | GA-56; ER Bar 1 #6; Greenhouse anonymise field groups [FACT] | Hard deletes with residue (DB-011) |
| T10 | **DSAR export** and **erasure** cascading to history, e-mail, attachments, search index, webhooks | ER Bar 1 #6 | None |
| T11 | US **EEO/OFCCP** support as configurable jurisdiction pack: separate self-ID store, VEVRAA/503 forms, required disposition reasons, applicant-flow exports | GA-55; ER Bar 1 #7 | Wrong EEO options, ungated (UX-004, SEC-022) |
| T12 | **Structured pay ranges** (min/max/currency/interval) on jobs, careers, JSON-LD, feeds | ER Bar 1 #8 | `salary varchar(64)` (`db/cats_schema.sql:807`) |
| T13 | **Accessibility WCAG 2.2 AA** (recruiter app + careers + apply) with a published ACR | GA-52; ER Bar 1 #9; UXP-22 | 0 ARIA, contrast 1.37:1 (UX-005/009) |

## 3. Core recruiting workflow

| # | Table stake | Evidence | Baseline |
|---|---|---|---|
| T14 | **Person ≠ Application** model with pools/tags | GA-1; Lever/Gem/Greenhouse | Candidate + pipeline rows only |
| T15 | **Workflow templates** with typed stage categories (e.g. applied/screen/interview/offer/hired) and per-job copies; default template maps legacy statuses 100–800 | GA-5; UXP-5/15 | 11 hard-coded statuses (FEAT-001) |
| T16 | **Stage actions/automation** (send schedule link, request feedback, reminders, move on result) — explainable, audited, no silent auto-reject | GA-6; UXP-5 | Single hard-wired path |
| T17 | **Disposition** separate from stage: required reason codes, withdrawal reasons, templates, scheduled send, undo, bulk | GA-7; UXP-5/8 | Statuses 650/700 (GAP-021) |
| T18 | **Board + list** views over the same filters, with keyboard/menu alternative to drag | GA-8; UXP-5, WCAG 2.5.7 | No board |
| T19 | **Application-centric profile** with unified, filterable **timeline** (human, automation and AI actors) | GA-9; UXP-4/11 | Long Show page; double-escaped text (UX-003) |
| T20 | **Notes with visibility**, @mentions, tasks | GA-10; UXP-12 | Anyone edits/deletes activities |
| T21 | **Hiring team per job** (recruiter, coordinator, hiring manager, interviewers) | GA-11 | None (GAP-010) |
| T22 | **Interview scheduling**: calendar-connected (Google/Microsoft), candidate self-scheduling and availability requests, panels, reschedule, invites, reminders | GA-12; UXP-9 | Single-owner events; broken reminders (FEAT-004/010) |
| T23 | **Structured scorecards / interview kits**: attribute ratings, overall recommendation incl. "no decision", blind until submitted, reminders | GA-13; UXP-10; Greenhouse [FACT] | One unattributed rating (GAP-007) |
| T24 | **Decision record / debrief** | GA-14 | None |
| T25 | **Role-aware home** (action queue) | GA-25; UXP-1 | Six fixed widgets |
| T26 | **Bulk actions** that are correct, previewable, audited and undoable where possible | GA-20; UXP-8 | Selection dropped (UX-002) |
| T27 | **Saved views** (private/shared, URL state) | GA-21; UXP-7 | Recent searches only |
| T28 | **Search**: boolean + facets with explicit scope; fast on resume text | GA-22; UXP-6 | `LIKE`/`REGEXP` (PERF-001) |
| T29 | **Duplicate detection** on all ingestion paths + reviewable, transactional merge; **soft delete** | GA-19 | Corrupting merge (DB-001) |
| T30 | **Talent pools and basic nurture** with consent and unsubscribe | GA-17 | Static lists; no consent (FEAT-013) |
| T31 | **E-mail templates, send-as and logging; calendar integration**; mailbox sync may follow | GA-23 | Outbound only (GAP-013) |
| T32 | **Notifications** with per-user preferences (in-app, e-mail; chat connectors) | GA-24 | E-mail only |
| T33 | **Hire hand-off events** to HRIS/onboarding (webhook + export) | GA-16 | None |

## 4. Candidate experience

| # | Table stake | Evidence | Baseline |
|---|---|---|---|
| T34 | **Responsive, accessible careers site** with search/filters, multiple sites/brands, **schema.org JobPosting JSON-LD + jobs sitemap** | GA-34; Bullhorn MIT portal [FACT]; schema.org [FACT] | 940 px, search stubs, no JSON-LD (UX-012, FEAT-011) |
| T35 | **Configurable apply**: per-job field requirements (required/optional/off), knockout questions, resume optional, consent, optional EEO; queued server-side intake | GA-35; Lever/Teamtailor [FACT] | 5–8 loads; pre-selected answers (UX-011) |
| T36 | **Candidate status portal** with verified identity (magic link); withdraw/update | GA-36 | Cookie "login" (FEAT-005) |
| T37 | **Apply abuse controls**: rate limits, captcha hook, duplicate/velocity checks; never trust client-supplied identity | GA-39; Lever Postings API [FACT] | SEC-024 — *upstream note: CAPTCHA added* |

## 5. Platform

| # | Table stake | Evidence | Baseline |
|---|---|---|---|
| T38 | **Public versioned REST API** (OpenAPI 3.1), scoped tokens/OAuth2, rate-limit headers, deprecation policy; UI uses the same API | GA-40; ER Bar 1 #10 | None (API-001) |
| T39 | **Signed webhooks** with retries, idempotency, delivery log, event catalogue | GA-41; Greenhouse [FACT] | `eval` hooks (FEAT-015) |
| T40 | **Connector framework** with typed partner contracts (calendar, e-mail, e-sign, job boards, assessments, background checks, HRIS) and provider fallback | GA-42 | None |
| T41 | **Typed custom fields** with validation and permissions | GA-50 | EAV, 6 types |
| T42 | **Localisation**: ICU messages, UTC + IANA time zones, locale-aware formats, locale on content | GA-51 | English only, GMT offsets (FEAT-016) — *upstream note: date/time formats* |
| T43 | **Responsive web app** incl. hiring-manager review and approvals on mobile | GA-53 | Not responsive (UX-001) |
| T44 | **Analytics foundation**: immutable stage-transition events, metric dictionary (time-to-fill, time-in-stage, pass-through, source, offers, dispositions), standard dashboards, export/reporting schema | GA-54 | 54 COUNT queries on mutable rows (FEAT-008) |
| T45 | **Reliable background jobs** (queue with retries, scheduling, admin visibility) | GA-60 | Cron `QueueCLI.php` (FEAT-010) |
| T46 | **Resume parsing** with pluggable provider and self-hosted default | GA-61 | Resfly liability (RISK-005) |
| T47 | **Import/export**: CSV with templates and error reports, per-import revert, full data export; migration from OpenCATS 0.9.x/upstream | GA-26; ER Bar 1 #14 | Import with revert (keep) |
| T48 | **Operability**: tested backup/restore, health/metrics endpoints, documented reference deployment | ER Bar 1 #12 | Broken backups (DB-005) |

## 6. Agency table stakes (if agencies are a primary segment — decision D2)

| # | Table stake | Evidence | Baseline |
|---|---|---|---|
| T49 | Client companies/contacts with hierarchy and fee terms | GA-27; Bullhorn [FACT] | Exists (keep, extend) |
| T50 | **Submittal/sendout** as a tracked event (what, to whom, when, read/response) | GA-28 | Inferred from status rows (FEAT-008) |
| T51 | Shareable hot lists | GA-32 | Saved lists |

## 7. Enterprise requirements that follow table stakes (Bar 2)
Requisitions with openings, approval chains (jobs/offers), offer management with e-sign, SCIM, custom roles + rule-based scoping, sandbox, SIEM/BI connectors, multi-brand/multi-currency, HRIS connectors — see `ENTERPRISE_ATS_REQUIREMENTS.md` §6.3 and `COMPETITIVE_GAP_ANALYSIS.md` (ENTERPRISE REQUIREMENT rows). **[RECOMMENDATION]** For in-house segments, requisitions/approvals/offers move up to table-stake priority.

## Facts vs inferences
Baselines are FACT (Phase 0). Market evidence grades are in the cited documents (mostly SOURCE CLAIM · search excerpt; FACT where from official repositories). Classification as "table stake" is INFERENCE; minimum bars are RECOMMENDATION.
