# Competitive Gap Analysis — OpenCATS vs the 2026 ATS Market

**Scope.** A capability-by-capability comparison of OpenCATS (baseline: Phase 0 audit of our fork at `d607279`, `CATS_VERSION 0.9.7.4`) against the patterns documented across the market in Phase 2. For each capability: what OpenCATS does today, the modern market pattern, evidence, the gap, importance, complexity, a recommendation, and a classification. **This is not a feature-copy list**: capabilities are classified by the *product principle* they serve, and several market features are deliberately classified as OPTIONAL, FUTURE or not recommended.

**Date:** 2026-09-25.

## Method
- **Baseline (FACT):** `docs/audit/` IDs (FEAT-, GAP-, UX-, SEC-, DB-, API-, PERF-, ARCH-). Where **upstream OpenCATS v0.11.x** (176 commits ahead of our fork; lead-verified, see `MARKET_OVERVIEW.md` §6) has addressed a baseline item, the "OpenCATS today" cell notes it as *"upstream v0.11: …"* — only for items verified by upstream commit subject lines (`git log d607279..HEAD` in a read-only clone). Upstream fixes were not code-reviewed in this phase.
- **Market pattern evidence:** Phase 2 documents — `COMPETITOR_RESEARCH.md` (CR, with part letter), `MODERN_ATS_UX_PATTERNS.md` (UXP #1–22), `ENTERPRISE_ATS_REQUIREMENTS.md` (ENT), `AI_RECRUITING_LANDSCAPE.md` (AI), `OPEN_SOURCE_ATS.md` (OSS), `PRICING_AND_PACKAGING.md` (PRC), `MARKET_OVERVIEW.md` (MKT). Evidence grades follow `COMPETITOR_RESEARCH.md`; most vendor behaviour is **[SOURCE CLAIM · search excerpt]** pending browser verification, while items from official GitHub repositories (Greenhouse API docs, Lever Postings API, Bullhorn SDK/portal, Teamtailor partner docs) are **[FACT]**.
- **Importance** (product lens, RECOMMENDATION): **Critical** (blocks adoption or creates legal/security exposure) · **High** · **Medium** · **Low**.
- **Complexity** (engineering estimate for OpenCATS 2.0, INFERENCE): **S** (weeks) · **M** (1–2 months) · **L** (quarter) · **XL** (multi-quarter). Estimates assume the Phase 1 foundation (API, RBAC, audit, event history) exists.
- **Classification** (per brief):
  - **TABLE STAKE** — expected by essentially every buyer in OpenCATS's plausible segments; absence disqualifies.
  - **ENTERPRISE REQUIREMENT** — required by enterprise procurement/regulated buyers; may be absent in SMB tools.
  - **DIFFERENTIATOR** — a place OpenCATS can be meaningfully better or different (often tied to openness, self-hosting, agency focus, transparency).
  - **OPTIONAL** — valuable to some segments; build later or via partners.
  - **FUTURE OPPORTUNITY** — emerging; revisit after foundations.
  - **LEGACY / REMOVE** — existing OpenCATS capability to retire.

---

## 1. Summary

Counts are of the 74 matrix rows below (rows with a split classification, e.g. "TABLE STAKE (fields) / OPTIONAL (objects)", are counted under their first class).

| Classification | Rows | Examples |
|---|---|---|
| TABLE STAKE | 43 (incl. 3 agency-specific) | configurable workflows, scheduling, scorecards, dispositions, API/webhooks, SSO/MFA, RBAC, careers site + apply, accessibility, privacy lifecycle, analytics |
| ENTERPRISE REQUIREMENT | 10 (incl. 2 only for a hosted offer) | requisitions, approval chains, offers, SCIM, audit incl. reads, field-level security, EEO/OFCCP, sandbox, data residency, attestations |
| DIFFERENTIATOR | 4 | migration tooling, agency placement model, client review portal, BYO-model transparent AI |
| OPTIONAL | 4 | BD pipeline, VMS/back-office hand-off, SMS/WhatsApp, conversational frontline apply |
| FUTURE OPPORTUNITY | 4 | MCP server, evaluative AI module, fraud/identity hooks, AI-interviewer integrations |
| LEGACY / REMOVE | 9 | licence/"Professional" gating, phone-home, Firefox toolbar, Resfly, SimpleTest runner, `eval` hooks, catsone-wired feeds, IE/jQuery 1.3.2/artichow/fpdf, vestigial multi-tenancy |

Strategic differentiators that are *positions* rather than single capabilities (e.g. "governance included in the open core", "self-hostable with no phone-home", "public packaging") are developed in `docs/product/DIFFERENTIATORS.md`.

**Biggest gaps by importance (Critical):** secure identity (SSO/MFA/reset), RBAC with scoping, privacy lifecycle (consent/retention/erasure), careers site + safe apply identity, accessibility, public API/webhooks, configurable workflow, audit log.

---

## 2. Capability matrix

### 2.1 Core recruiting records and workflow

| # | Capability | OpenCATS today | Modern market pattern | Evidence | Gap | Importance | Complexity | Recommendation | Classification |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Person record separate from applications (ATS + CRM on one person) | Candidate + `candidate_joborder` rows; no CRM semantics (GAP-018) | Person/contact ≠ opportunity/application; one record spans pools and applications (Lever Opportunity, Gem, Greenhouse prospects) | CR-A Lever; CR-D Gem; MKT §5 | Partial model; no pools/prospects | High | M | Model Person, Application, Pool from day one | TABLE STAKE |
| 2 | Requisition + openings/headcount | Job order only; `openings`/`openings_available` counters (GAP-008) | Requisition (comp band, cost centre) with 1:n openings; job state machine (Ashby, Lever, Workday, SmartRecruiters) | CR-A Ashby/Lever; CR-C Workday | Missing | High (corporate) / Medium (agency) | M | Requisition → Job → Openings; optional HRIS position reference | ENTERPRISE REQUIREMENT |
| 3 | Approval chains (requisition, offer) | None | One generic approval object: groups, sequential/parallel, quorum, delegate, approve-from-email (Greenhouse, SmartRecruiters) | CR-A Greenhouse [FACT API docs]; CR-B SmartRecruiters; UXP #21 | Missing | High | M | One approval engine reused for jobs and offers | ENTERPRISE REQUIREMENT |
| 4 | Job lifecycle validation (e.g. salary required at publish) | Free-string statuses; `'OnHold'` typo (FEAT-008) | Job state machine with transition validators; pay-transparency enforcement at publish (Ashby) | CR-A Ashby; ENT pay transparency | Missing | High | S | Typed job states + validators; per-jurisdiction publish rules | TABLE STAKE |
| 5 | Configurable workflow templates (stages with categories) | 11 hard-coded statuses, no admin UI (FEAT-001, GAP-005) | Templates per job/department; fixed stage categories + configurable steps (SmartRecruiters, Oracle phase→state, Recruitee templates) | CR-B, CR-C Oracle; UXP #15 | Missing | Critical | L | Typed stages (screen/interview/offer/hired/rejected) + templates; default "Agency (legacy)" template maps 100–800 | TABLE STAKE |
| 6 | Stage automation (on-entry actions) | One hard-wired side-effect path; e-mail pre-checked (FEAT-018, UX J3) | Rules bound to stage/step: send schedule link, request feedback, auto-advance on assessment result, reminders (Ashby, Teamtailor, SmartRecruiters) | UXP #5; CR-D Teamtailor [FACT partner docs] | Missing | High | M | Explainable, auditable stage rules executed by durable queue; no silent auto-reject | TABLE STAKE |
| 7 | Rejection/disposition as an attribute with reasons; bulk reject with template; delayed visibility | Rejection = statuses 650/700, no reasons (GAP-021) | Disqualify with required reason, template e-mail, undo; separate withdrawal reasons; scheduled rejection send (Workable, Recruitee, Greenhouse, Teamtailor) | UXP #5, #8; CR-A/B/D | Missing | High | S | Disposition separate from stage; reason codes feed EEO/analytics | TABLE STAKE |
| 8 | Kanban board with list parity (and keyboard alternative) | No board; full-page reloads (UX-014) | Board + list toggle on the same filters (Teamtailor, Recruitee, Pinpoint, Ashby); WCAG 2.5.7 needs non-drag alternative | UXP #5, #22 | Missing | High | M | Board and list over one query model; "Move to…" menu for accessibility | TABLE STAKE |
| 9 | Application-centric candidate profile + unified timeline | Long Show page; history separate; text double-escaped (UX-003) | Stage/next action prominent; filterable feed of emails, notes, stage changes, AI/agent actions (Greenhouse, Teamtailor, Workable agents on timeline) | UXP #4, #11 | Missing | High | M | Timeline built on immutable events incl. actor type (human/automation/AI) | TABLE STAKE |
| 10 | Notes with visibility, @mentions, to-dos | Activities editable/deletable by any user (FEAT-006) | Per-note visibility (private/public/admin), mentions, tasks (Greenhouse [FACT API], Teamtailor) | UXP #12 | Missing | Medium | S | Visibility-scoped notes; tasks feed the home queue | TABLE STAKE |
| 11 | Hiring team roles per job | `recruiter`, `owner`, client `contact_id` only (GAP-010) | Job-scoped roles: recruiter, coordinator, hiring manager, interviewer (Greenhouse, SmartRecruiters) | CR-A/B; UXP #12, #16 | Missing | High | M | Job team membership drives permissions and notifications | TABLE STAKE |
| 12 | Interview scheduling (self-schedule, availability requests, panels, calendar sync, reschedule) | Single-owner calendar event; private events leak (FEAT-004); cron reminders broken (FEAT-010) | Calendar-connected; candidate self-schedule links sent on stage entry; availability collection; panels/loops; interviewer pools and load limits (Greenhouse, Ashby, Workable, Teamtailor, Oracle, SAP, Workday) | UXP #9; CR-A Ashby; MKT §5 (Cronofy FACT) | Missing | Critical | L | Interview entity + Google/Microsoft calendar abstraction; self-schedule first, loops next; partner adapter optional | TABLE STAKE |
| 13 | Interview kits and structured scorecards (blind until submitted) | One unattributed 0–5 rating (GAP-007) | Attribute ratings, focus attributes per interview, 5-value recommendation incl. "no decision", peers hidden until submission (Greenhouse) | CR-A Greenhouse [FACT]; UXP #10 | Missing | Critical | M | Scorecard templates per stage; blind submission; reminders | TABLE STAKE |
| 14 | Debrief / hiring decision record | None | Aggregated scorecard view + recorded decision | UXP journey (c) | Missing | Medium | S | Decision object with rationale on the application | TABLE STAKE |
| 15 | Offer management (versions, approvals, letters, e-sign) | Status 600 only (GAP-009) | Versioned offer with template/letter, ordered approvers, e-sign integration; changes re-trigger approval (Greenhouse, SAP, SmartRecruiters) | CR-A/B/C; UXP #21 | Missing | High | M | Offer entity + approval engine (#3) + e-sign connector abstraction | ENTERPRISE REQUIREMENT |
| 16 | Hire hand-off to HRIS/onboarding | None | Hire events/APIs to HRIS (Jobvite "Onboard New Hire", SmartRecruiters Hire Sync, Ashby HRIS push) | CR-B/C | Missing | Medium | S (events) | Emit `application.hired` webhook + export; do not build HRIS | TABLE STAKE (as integration) |
| 17 | Talent pools, nurture sequences with consent/unsubscribe | Static saved lists; dynamic lists unimplemented (FEAT-017); bulk e-mail without consent (FEAT-013) | Pools/projects + sequences with consent enforcement (Lever, Gem, Greenhouse, SmartRecruiters) | CR-A/D; MKT §5 | Missing | High | M | Pools (static/smart) + basic sequences in core; advanced marketing via partners | TABLE STAKE |
| 18 | Rediscovery of past candidates | `LIKE`/`REGEXP` search (GAP-016) | Search over past applicants incl. silver medallists; AI-assisted rediscovery (Gem, HiredScore) | CR-D Gem; AI §7.3 | Weak | Medium | M | Search service + pool suggestions; AI assist later | TABLE STAKE |
| 19 | Duplicate detection + reviewable merge + soft delete | Exact-name match, unscoped; merge corrupts other entities (DB-001, FEAT-002/007); hard deletes (FEAT-003) | Deterministic + fuzzy matching on all ingestion paths; merge with review; "retrieve deleted" (Recruitee), soft delete + edit history (Bullhorn [FACT SDK]) | CR-B Recruitee; CR-D Bullhorn | Broken | High | M | Transactional, type-safe merge with provenance; soft delete everywhere | TABLE STAKE |
| 20 | Bulk actions (stage, email, reject+reason+template, tag, share) with preview/undo | Selection silently dropped (UX-002); bulk e-mail SA-only | Contextual bulk bar; some vendors lack undo (Greenhouse) | UXP #8 | Broken | High | S | Bulk operations as audited jobs with preview and undo | TABLE STAKE |
| 21 | Saved views (private/shared, URL-addressable) | 5 recent searches (UXP #7) | Named, shareable views; filters in URL (Bullhorn, Greenhouse) | UXP #7 | Weak | Medium | S | Views persisted server-side; URL state | TABLE STAKE |
| 22 | Search: boolean + facets with visible scope | `LIKE`/`REGEXP [[:<:]]` (breaks on MySQL 8) (PERF-001, GAP-016) | Boolean with chips/facets; scope explicit; fuzzy default (Workable) | UXP #6 | Weak | High | M | Search index (OpenSearch/Meilisearch/PG FTS) with facets and scope toggles | TABLE STAKE |
| 23 | Email/calendar integration and communication timeline | Outbound PHPMailer only; `email_history` never shown (GAP-013) | Google/Microsoft mailbox + calendar sync; templates; tracking (Lever M365, Recruitee mailbox) | CR-A/B | Missing | High | L | Provider abstraction; start with send-as + logging + calendar; inbound sync later | TABLE STAKE |
| 24 | Notifications (in-app, email digests, Slack/Teams) with preferences | E-mail only, cron-dependent (FEAT-010) | Multi-channel with preferences; HM approvals in Teams (iCIMS Hiring Agent) | UXP #13; CR-C iCIMS | Missing | Medium | M | Notification service with per-user preferences; chat connectors | TABLE STAKE |
| 25 | Role-aware home / action queue | Six fixed widgets, one mislabelled | Tasks due, reviews due, feedback due, interviews today (Greenhouse, Workable, Teamtailor) | UXP #1 | Missing | High | M | Home = queue of actions per role | TABLE STAKE |
| 26 | Import/export and migration tooling | CSV import with revert (keep); export has no ACL (FEAT-006) | Bulk loaders with templates + error CSVs (Bullhorn Data Loader [FACT]); competitor import shapes | CR-D Bullhorn, Gem | Partial | High | M | Import framework + **OpenCATS 0.9.x/upstream migrator** + competitor importers | DIFFERENTIATOR (migration) |

### 2.2 Agency / staffing capabilities

| # | Capability | OpenCATS today | Modern market pattern | Evidence | Gap | Importance | Complexity | Recommendation | Classification |
|---|---|---|---|---|---|---|---|---|---|
| 27 | Client companies & contacts CRM | Exists (companies, contacts, cold-call list, vCard) | Client hierarchy, fee terms, billing profiles (Bullhorn [FACT SDK]) | CR-D Bullhorn crosswalk | Partial | High (agency) | S | Keep; add hierarchy + fee terms | TABLE STAKE (agency) |
| 28 | Submittal/sendout tracked as an event | Inferred from status-400 rows → double counting (FEAT-008) | Sendout: what was sent to which client contact, read tracking (Bullhorn) | CR-D Bullhorn [FACT] | Missing | High (agency) | S | Submittal event with artefact + tracking | TABLE STAKE (agency) |
| 29 | Placement with pay/bill rates, fee, guarantee, commission splits | Status 800 only; free-text `rate_max`/`salary` (`db/cats_schema.sql:806-807`) | Placement aggregate with pay/bill/fee/margin, effective-dated changes, commissions (Bullhorn) | CR-D Bullhorn [FACT]; MKT §6 | Missing | High (agency) | M | Placement entity; metrics derived from it; payroll/billing via integrations | DIFFERENTIATOR (for an open agency ATS) |
| 30 | Client review portal (scoped, password-less) | None | Recruiter chooses candidates/stages/fields; client comments/scores/approves (Loxo, Recruit CRM) | CR-D Loxo | Missing | High (agency) | M | Scoped share links with OTP; client feedback writes to timeline | DIFFERENTIATOR |
| 31 | BD pipeline (lead → opportunity → job) | None | Weighted deal pipeline in ATS (Bullhorn, Loxo) | CR-D | Missing | Medium | M | Lightweight BD pipeline reusing workflow engine | OPTIONAL |
| 32 | Hot lists / tearsheets | Saved lists (static) | Multi-entity, shareable lists (Bullhorn Tearsheet) | CR-D | Partial | Medium | S | Pools/lists (#17) cover it | TABLE STAKE (agency) |
| 33 | VMS/MSP & back-office hand-off | None | Placement webhooks, external requisition IDs (Bullhorn pay/bill) | MKT §5; CR-D | Missing | Low–Medium | M | Events + `client_job_id` mapping; connectors by partners | OPTIONAL |

### 2.3 Candidate experience

| # | Capability | OpenCATS today | Modern market pattern | Evidence | Gap | Importance | Complexity | Recommendation | Classification |
|---|---|---|---|---|---|---|---|---|---|
| 34 | Careers site: responsive, accessible, SEO (JobPosting JSON-LD + sitemap), search/filters, multi-brand | Fixed 940px, no viewport, search stubs, single site, no JSON-LD (UX-001, UX-012, FEAT-011) | Headless careers API + themeable SSR site; JSON-LD (Bullhorn MIT portal [FACT]); multi-site faceted APIs (Workday CXS, Oracle CE) | UXP #20; CR-C/D; MKT §4.7 | Missing | Critical | L | Headless careers API + reference SSR careers site; JSON-LD quick win | TABLE STAKE |
| 35 | Apply flow: short, per-job fields, knockout questions, split consent, optional EEO | 5–8 page loads; questionnaire pre-selects; wrong EEO values; no consent (UX-004, UX-011) | Name+email minimum (Lever [FACT]); per-job optional/required/off fields (Teamtailor [FACT]); knockout/weighted questions (SAP); consent split processing vs future contact | UXP #20; CR-A/C/D | Missing | Critical | M | Configurable apply schema; server-side queued intake; never trust client identity (SEC-024) | TABLE STAKE |
| 36 | Candidate status portal with verified identity | Cookie "login" by email+last name+ZIP (FEAT-005, SEC-025) | Magic-link/MyGreenhouse-style profiles; candidate withdraw/manage (Workable candidate MCP) | CR-A/B; UXP #20 | Unsafe | High | M | Magic-link candidate accounts; status transparency | TABLE STAKE |
| 37 | SMS / WhatsApp communications | None | SmartMessage, Recruitee WhatsApp, iCIMS text | CR-B/C | Missing | Medium (frontline) | M | Channel abstraction; partner providers | OPTIONAL |
| 38 | Conversational / chat apply for frontline | None | Paradox, iCIMS Frontline AI, Winston Chat | MKT §4.5 | Missing | Low (unless frontline chosen) | XL | Not in core; integrate | OPTIONAL |
| 39 | Apply abuse controls (rate limit, captcha hook, velocity/duplicate checks) | CAPTCHA generator unused on apply; careers overwrite defect (SEC-024) — *upstream v0.11 added CAPTCHA (OSS §3.1)* | Rate limits + captcha + queueing (Lever [FACT]); fraud checks (Ashby, Greenhouse) | MKT §4.6 | Weak | High | S | Built into careers API from day one | TABLE STAKE |

### 2.4 Platform, security and governance

| # | Capability | OpenCATS today | Modern market pattern | Evidence | Gap | Importance | Complexity | Recommendation | Classification |
|---|---|---|---|---|---|---|---|---|---|
| 40 | Public REST API (OpenAPI), scoped tokens, on-behalf-of attribution | None; UI-only XML RPC (API-001) | Versioned API with scoped keys/OAuth; incremental sync (Greenhouse, Ashby, iCIMS) | CR-A/C; ENT | Missing | Critical | L | One versioned REST API (OpenAPI 3.1), OAuth2 + scoped keys; API parity with UI | TABLE STAKE |
| 41 | Webhooks (HMAC-signed, retries, delivery log) | None; `eval` hooks (FEAT-015) | Signed webhooks, retries, auto-disable, key rotation (Greenhouse [FACT], SmartRecruiters, Teamtailor lacks retries) | CR-A/B/D | Missing | Critical | M | At-least-once delivery, idempotency keys, delivery log | TABLE STAKE |
| 42 | Integration connectors (job boards, assessments, background checks, e-sign, HRIS, calendar) | None beyond LDAP | Typed partner categories with common result schema (Oracle, Greenhouse Assessment API [FACT]) | CR-C Oracle; MKT §4.1 | Missing | High | L (framework) | Connector framework with typed partner contracts; self-serve credentials | TABLE STAKE |
| 43 | MCP / agent interface | None | Greenhouse MCP (beta), Workable recruiter + candidate MCP, SeekOut MCP | AI §2 #10 | Missing | Medium | S (on top of API) | Expose API via MCP gated by RBAC scopes | FUTURE OPPORTUNITY |
| 44 | SSO (OIDC + SAML) | LDAP only (GAP-001) | SSO widespread; Ashby includes on all plans; some gate to top tier | PRC §6.3; ENT | Missing | Critical | M | SSO in open core | TABLE STAKE |
| 45 | SCIM provisioning | None | Gated to higher tiers (Ashby Plus+) | PRC §6.3 | Missing | Medium | M | Provide; may be paid tier if packaging requires | ENTERPRISE REQUIREMENT |
| 46 | MFA, secure password storage & reset, lockout, session hardening | MD5, `admin`/`admin`, no reset, no lockout (SEC-001–003, 007, 014) — *upstream v0.11: `password_hash` + MD5 migration (#685), mandatory default-admin change (#873), CSRF (#693)* | Baseline security everywhere | ENT; Phase 0 | Missing (fork) / partly fixed (upstream) | Critical | M | MFA (TOTP/WebAuthn), tokenised reset, throttling — in core | TABLE STAKE |
| 47 | RBAC with job/department/office scoping, custom roles | One global level; unchecked entry points (FEAT-006, GAP-003) — *upstream v0.11: AJAX/module authorisation checks (#724)* | Global roles × job-scoped hiring-team roles (SmartRecruiters, Greenhouse); custom roles gated in some tiers | CR-A/B; UXP #16 | Missing | Critical | L | Policy-based RBAC + scoping in API layer; custom roles | TABLE STAKE |
| 48 | Field-level security (EEO, compensation, private sections) | Single per-user EEO flag; EEO ungated in reports/export (SEC-022) | Private-by-default form sections (Lever `secretByDefault`); EEOC data never in webhooks (Ashby) | CR-A Lever/Ashby | Missing | High | M | Field masks by role; sensitive data store separated | ENTERPRISE REQUIREMENT |
| 49 | Audit log (append-only, incl. reads/exports), export to SIEM | Partial mutable `history`; no read logging (GAP-011) | Audit API incl. profile opened, search, report downloaded, ≥26 months (SmartRecruiters); Greenhouse audit log on request | CR-A/B; ENT | Missing | Critical | M | Default-on append-only audit with retention & export | ENTERPRISE REQUIREMENT (core) |
| 50 | Custom fields (typed), custom objects | EAV extra fields, 6 types, no validation | Typed custom fields; numbered slots are an anti-pattern (Bullhorn `customText1..25`); some gate app-level fields (Greenhouse Enterprise) | CR-A/D | Weak | High | M | Named, typed fields with validation & permissions in core; custom objects later | TABLE STAKE (fields) / OPTIONAL (objects) |
| 51 | Localisation: UI languages, IANA time zones, currencies, date formats, locale on content | English only; integer GMT offsets; MM-DD-YY (FEAT-016, UX-015) — *upstream: date/time formats and countries (OSS §3.1)* | Multi-language UI and content (SAP locale on requisitions/offers/questions); Bullhorn portal 11 locales [FACT] | CR-C SAP; UXP #22 | Missing | High | L | ICU catalogs; UTC + IANA; locale on content objects | TABLE STAKE |
| 52 | Accessibility WCAG 2.2 AA + published ACR/VPAT | 0 ARIA; contrast 1.37:1; inaccessible modals (UX-005, UX-009) | Vendors' ACRs not verified; legal requirement for public-sector buyers; EAA applicability to careers sites under review | UXP #22; ENT | Missing | Critical | L (built-in) | Release gate WCAG 2.2 AA; accessible component system; publish ACR | TABLE STAKE |
| 53 | Responsive UI & mobile approvals for hiring managers | Not responsive (UX-001) | Mobile apps/responsive; approvals and feedback on mobile or in Teams/Slack | UXP #21; CR-C iCIMS | Missing | High | M | Responsive web first; native apps not required | TABLE STAKE (responsive) / OPTIONAL (native apps) |
| 54 | Analytics: funnel, time-in-stage, source, offers, dispositions; metric dictionary; export/BI | 54 fixed COUNT queries; mutable history (GAP-014, FEAT-008) | Event-based analytics; standalone analytics products (Ashby Analytics); BI connectors (Visier ingests Greenhouse/Lever/iCIMS… [FACT]) | MKT §5; CR-A Ashby | Missing | High | L | Immutable transition events + metric dictionary + dashboards + reporting schema/export | TABLE STAKE |
| 55 | EEO/OFCCP reporting; diversity funnel with protections | US EEO capture with wrong options (UX-004); report ungated | Self-ID stored separately; disposition-based applicant flow; min cell sizes | ENT; CR-C | Weak/incorrect | High (US) | M | Separate protected store; disposition-based reports; access controls | ENTERPRISE REQUIREMENT |
| 56 | Privacy lifecycle: consent (split), retention/auto-delete, DSAR export, erasure/anonymisation incl. AI fields | None; hard deletes leave residue (GAP-002, DB-011) | Consent at apply tied to policy (Lever), anonymise by field group incl. AI reasoning/identity (Greenhouse [FACT]); consent split ATS vs CRM (SmartRecruiters) | CR-A/B; MKT §4.2 | Missing | Critical | L | Privacy-by-design data model; retention jobs; DSAR tooling | TABLE STAKE |
| 57 | Data residency / regional hosting | N/A (self-hosted) | EU/US instances (Lever, iCIMS, Teamtailor) | CR-A/C/D | N/A | Medium (hosted offer) | M | Self-hosting satisfies residency; hosted offer needs regions | ENTERPRISE REQUIREMENT (hosted) |
| 58 | Sandbox / staging environments | None | SmartRecruiters SmartSandbox, Lever sandbox | CR-B | Missing | Medium | S (self-host) / M (hosted) | Seeded demo/sandbox tenants; config export/import | ENTERPRISE REQUIREMENT |
| 59 | Security attestations (SOC 2 Type II / ISO 27001) | N/A | Standard for hosted vendors | ENT | N/A | High (hosted only) | L | Required only if a hosted offer exists | ENTERPRISE REQUIREMENT (hosted) |
| 60 | Reliable background processing | Cron-dependent `QueueCLI.php`, PHP-8-fatal (FEAT-010) | Durable queues behind reminders, automation, e-mail | Phase 0 | Missing | High | M | Durable queue with retries and admin visibility | TABLE STAKE |

### 2.5 AI capabilities

| # | Capability | OpenCATS today | Modern market pattern | Evidence | Gap | Importance | Complexity | Recommendation | Classification |
|---|---|---|---|---|---|---|---|---|---|
| 61 | Resume parsing/normalisation (self-hostable) | Resfly SOAP over HTTP, ignores `PARSING_ENABLED` (RISK-005) | Parsing ubiquitous; vendor outages from single-provider dependency (Recruitee) | AI §7.3; CR-B | Liability | High | M | Pluggable parser with self-hosted default; remove Resfly | TABLE STAKE |
| 62 | Assistive AI: JD/email drafting, summaries, semantic search | None | Widespread (Workable, Greenhouse, Metaview, SeekOut) | AI §7.3 | Missing | Medium | M | Provider-agnostic AI gateway; BYO model incl. local; off by default; audited | DIFFERENTIATOR (BYO/transparent) |
| 63 | Evaluative AI (match/ranking) with criterion-level reasoning | None | Greenhouse `match_score_reasoning`; Ashby criteria evaluations; SmartRecruiters Match 4-star; bias audits proliferating | AI §2; CR-A/B | Missing | Medium | L | Separate, default-off, compliance-governed module; no auto-reject | FUTURE OPPORTUNITY |
| 64 | Fraud / identity signals | None | Greenhouse–CLEAR, Ashby fraud checks, Gem fraud agent | MKT §4.6 | Missing | Medium | S (hooks) | Provider hook storing results only, with consent and retention | FUTURE OPPORTUNITY |
| 65 | AI interviewers / interview intelligence | None | Ezra (Greenhouse), BrightHire (Zoom), Pillar (Employ), Winston Interview | AI §2 #8 | Missing | Low | — | Integrate via partner API; do not build | FUTURE OPPORTUNITY (partner) |

### 2.6 Legacy capabilities to remove

| # | Capability | OpenCATS today | Market pattern | Evidence | Recommendation | Classification |
|---|---|---|---|---|---|---|
| 66 | Licence key / "Professional" upsell gating | Neutered (always true) (FEAT-012) — *upstream: removed (#802)* | n/a | Phase 0 | Remove | LEGACY / REMOVE |
| 67 | Phone-home version check to catsone.com | Sends site name + licence key | n/a | FEAT-012 | Remove | LEGACY / REMOVE |
| 68 | Firefox XUL toolbar module | Unauthenticated `getLicenseKey` | n/a | FEAT-012 | Remove | LEGACY / REMOVE |
| 69 | Resfly SOAP parser | Defunct third party over HTTP | n/a | RISK-005 | Remove (replace per #61) | LEGACY / REMOVE |
| 70 | In-app SimpleTest runner (`m=tests`) | Reachable by any user | n/a | FEAT-014 | Remove | LEGACY / REMOVE |
| 71 | `eval()` string hooks as extension model | 278 hook points, ~10 implemented | Events + webhooks | FEAT-015 | Replace with events | LEGACY / REMOVE |
| 72 | XML feeds hard-wired to catsone.com / SimplyHired | `simplyhired.xtpl:14` | JSON-LD + partner APIs | MKT §4.7 | Replace with distribution abstraction | LEGACY / REMOVE |
| 73 | IE-specific code, jQuery 1.3.2, artichow/fpdf | Phase 0 DEP findings | Modern front-end stack | DEP-003/006 | Remove with new UI | LEGACY / REMOVE |
| 74 | Vestigial multi-tenancy (`site_id`) | Public portals pinned to first site (DB-012) — *upstream: removed (#823)* | Real tenancy or single-tenant | MKT §6 | Decide explicitly (single-tenant by default) | LEGACY / REMOVE (as-is) |

---

## 3. Capabilities deliberately NOT recommended for core (with rationale)

| Market capability | Why not in core | Evidence |
|---|---|---|
| Autonomous AI rejection / auto-advance by score | Legal exposure (EU Annex III from 2 Dec 2027, NYC LL 144, IL HB 3773, *Mobley*), contradicts HITL norms | AI §5, §7.3 |
| Emotion/voice/face inference from video | EU Art. 5 prohibition in workplace contexts; high risk | AI §7.3 |
| Scraped external profile databases (800M-profile style) | Provenance/GDPR risk; licensing | CR-D Gem/Loxo; AI §7.3 |
| Generic business-process engine as the only workflow tool | Implementation friction observed in suites | CR-C Workday/SAP lessons |
| Full HRIS / payroll / pay-bill back office | Out of scope; integrate | CR-D Bullhorn lessons |
| SKU sprawl and metered-credit packaging for core features | Evaluation friction; unpredictable cost | CR-B SmartRecruiters; PRC §7.4 |
| Programmatic job advertising engine | Specialist market; partner-based | MKT §5 |

---

## 4. Facts vs inferences
- **FACT:** "OpenCATS today" cells (Phase 0 audit, file:line), upstream commit subjects (lead-verified), items marked [FACT] in the evidence column (official GitHub repositories).
- **SOURCE CLAIM:** most "modern market pattern" statements (vendor help centers / docs seen as search excerpts; third-party copies) — see each source document for grade.
- **INFERENCE:** importance and complexity ratings; classification.
- **RECOMMENDATION:** recommendation column.

## 5. Unknowns
1. Whether upstream OpenCATS fixes are complete and correct (not code-reviewed in this phase) — affects the "OpenCATS today" column for #39, #46, #47, #51, #66, #74.
2. Target segment (agency vs corporate TA vs both) changes the importance of #2, #3, #15 (corporate) vs #27–#33 (agency).
3. Hosting model (self-hosted only vs hosted) changes #57–#59.
4. Vendor behaviour graded as search excerpts requires browser verification.

## Sources
All evidence is cited in the Phase 2 documents referenced in the Evidence column (each with numbered sources and access date 2026-09-25) and the Phase 0 audit in `docs/audit/`.
