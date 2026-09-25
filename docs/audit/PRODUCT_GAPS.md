# OpenCATS — Product Gaps vs. a Modern Enterprise ATS

**Scope.** This document compares what OpenCATS (`CATS_VERSION 0.9.7.4`, `constants.php:45`) actually implements against the capabilities an enterprise buyer expects from an Applicant Tracking System in 2026. It is the product-level complement to `FEATURE_INVENTORY.md` (what exists) and is used by `RECOMMENDED_ROADMAP.md` to prioritise.

**Method.**
- Every capability claim below is backed by (a) a keyword sweep over first-party code (third-party libs and tests excluded) whose raw counts are recorded in §1, and (b) reading the relevant controllers, libs and schema in context. The sweep script is reproducible:
  ```bash
  SCOPE="modules lib careers rss xml js src db/cats_schema.sql index.php ajax ajax.php config.php constants.php QueueCLI.php installwizard.php"
  EXC="--exclude-dir=simpletest --exclude-dir=artichow --exclude-dir=fpdf --exclude-dir=sphinx --exclude=jquery-1.3.2.min.js --exclude-dir=submodal --exclude-dir=Tests --exclude-dir=tests --exclude-dir=testdocs"
  grep -rniE $EXC --include=*.php --include=*.tpl --include=*.js --include=*.sql --include=*.xtpl -- "<term>" $SCOPE | wc -l
  ```
- Non-zero hits were read and false positives discarded (e.g. `lib/mime.types`, the word "designed" matching `e-?sign`).
- "Modern enterprise ATS" expectations are **ASSUMPTIONS** drawn from the current market (Greenhouse, Lever, Ashby, Workday Recruiting, SmartRecruiters class products); they are stated so that they can be challenged, not as facts about this repository.

**Severity meaning in this document** (product lens): CRITICAL = blocks any enterprise sale or creates legal exposure; HIGH = expected table stakes, absence loses most evaluations; MEDIUM = expected by mid-market, workaround exists; LOW = differentiator / nice-to-have.

---

## Summary table

| ID | Gap | Category | Severity |
|---|---|---|---|
| GAP-001 | No SSO (SAML/OIDC), no MFA, broken password recovery, MD5 passwords | Identity | CRITICAL |
| GAP-002 | No privacy/compliance tooling (consent, retention, DSAR export/erasure, anonymisation) | Compliance | CRITICAL |
| GAP-003 | Access control is one global level per user; no roles, teams or record scoping | Security/Admin | CRITICAL |
| GAP-004 | No public API, API keys, webhooks or event model | Platform | HIGH |
| GAP-005 | Pipeline statuses hard-coded; no configurable workflows per job/department | Workflow | HIGH |
| GAP-006 | No interview scheduling, interviewer panels, or calendar sync | Hiring process | HIGH |
| GAP-007 | No structured feedback / scorecards / interview kits | Hiring process | HIGH |
| GAP-008 | No requisition management, headcount or approval chains | Hiring process | HIGH |
| GAP-009 | No offer management (compensation, approvals, letters, e-signature) | Hiring process | HIGH |
| GAP-010 | No hiring-team roles / hiring-manager experience | Collaboration | HIGH |
| GAP-011 | No tamper-evident audit log (views, exports, deletes, admin changes) | Compliance | HIGH |
| GAP-012 | Careers portal: not responsive, single-site, no job search, no consent, unsafe candidate identity | Candidate experience | HIGH |
| GAP-013 | No e-mail/calendar integration (Google/Microsoft), no communication timeline | Collaboration | HIGH |
| GAP-014 | Reporting limited to entity counts; no funnel, time-in-stage, time-to-fill, source-of-hire | Analytics | HIGH |
| GAP-015 | Job distribution limited to pull XML/RSS feeds; no job-board / LinkedIn posting | Sourcing | MEDIUM |
| GAP-016 | Search is `LIKE`/`REGEXP`; no relevance, facets, typo tolerance or semantic matching | Search | MEDIUM |
| GAP-017 | Duplicate detection exact-name only, not site-scoped; merge corrupts data | Data quality | MEDIUM |
| GAP-018 | No sourcing CRM: talent pools, nurture campaigns, referrals | Sourcing | MEDIUM |
| GAP-019 | No mobile/responsive UI; no accessibility (WCAG) support | UX | MEDIUM |
| GAP-020 | No internationalisation (UI strings, locales, time zones, currencies) | UX | MEDIUM |
| GAP-021 | Rejection/disposition reasons absent (EEO/OFCCP disposition reporting) | Compliance | MEDIUM |
| GAP-022 | Background processing unreliable (cron-only queue, PHP 8-incompatible) → reminders/automation fragile | Platform | MEDIUM |
| GAP-023 | Resume parsing depends on a defunct third-party SOAP service | Productivity | MEDIUM |
| GAP-024 | No AI-assisted features (parsing, matching, summarisation, outreach drafting) | Differentiator | LOW |
| GAP-025 | No assessments, background checks, reference checks, onboarding hand-off, candidate surveys | Ecosystem | LOW |

---

## 1. Evidence base — keyword sweep (FACT)

| Term (regex, case-insensitive) | Real feature present? | Evidence / context |
|---|---|---|
| `interviewer`, `scorecard`, `evaluation` | No (0 hits each) | Interview exists only as pipeline status 500 (`constants.php:126`) and calendar event type 400 (`lib/Calendar.php:37`) |
| `offer letter`, `e-?sign`, `docusign` | No | "Offered" is only status 600 |
| `requisition`, `headcount`, `budget`, `workflow` | No (0 hits) | – |
| `approv` | Only "LDAP user pending approval" | `lib/Users.php:47,850` |
| `gdpr`, `retention`, `erasure`, `purge`, `unsubscribe`, `consent` | No | Only an empty hook `TEMPLATEUTILITY_SHOWPRIVACYPOLICY` (`lib/TemplateUtility.php:834`) |
| `saml`, `openid`, `\bsso\b`, `oauth`, `2fa\|totp\|mfa` | No | LDAP bind is the only external auth (`lib/LDAP.php`, `lib/Users.php:822-851`) |
| `password_hash\|bcrypt\|argon`, `lockout\|throttl` | No | `md5()` at `lib/Users.php:93,701,755,840` |
| `webhook`, `api[_ ]?key`, `rest ?api` | No | `ajax.php` is a UI-only XML/HTML RPC (see `API_AUDIT.md`) |
| `kanban`, `drag` | No board; drag only for grid columns | `lib/DataGrid.php:1598` |
| `linkedin`, `job ?board`, `indeed` | Pull XML template only; push is a stub | `modules/xml/xml_templates/indeed.xtpl`, `lib/XmlJobExport.php:108-111` |
| `caldav\|\.ics\|imap\|outlook` | No | – |
| `analytics`, `time.to.(fill\|hire)`, `cost.per.hire` | No | – |
| `gettext\|i18n`, `viewport`, `aria-` | No / essentially none | – |
| `captcha` | Generator exists, unused on careers apply | `lib/GraphGenerator.php:432`; 0 hits in `modules/careers/CareersUI.php` |
| `openai\|llm\|machine learning` | No | `js/match.js` is a star-rating widget, not matching |

---

## 2. Gap details

### GAP-001 — Enterprise identity is missing (SSO, MFA, secure credential lifecycle)
- **Severity:** CRITICAL
- **Finding:** Authentication is local username/password (unsalted MD5) or LDAP simple bind. There is no SAML/OIDC, no MFA, no lockout, no session hardening, and the forgot-password flow crashes.
- **Evidence:** `lib/Users.php:840` (`$rs['password'] !== md5($password)`); `lib/LDAP.php:40,68` (plaintext LDAP, unescaped filter); `modules/login/LoginUI.php:455-462` calls non-existent `Users::getPassword()`; `index.php:75` `session_start()` without `session_regenerate_id` anywhere. See `SECURITY_AUDIT.md` SEC-001/002/006/007/014.
- **Impact:** Fails every enterprise security questionnaire (SSO + MFA are mandatory for most buyers); account takeover risk; users locked out without admin help.
- **Recommendation:** Build an identity module in the new platform: OIDC + SAML 2.0 (IdP-initiated and SP-initiated), SCIM user provisioning, TOTP/WebAuthn MFA for local accounts, Argon2id/bcrypt with rehash-on-login for migrated MD5 hashes, tokenised password reset. Keep LDAP only as a legacy connector.

### GAP-002 — No privacy / data-protection tooling
- **Severity:** CRITICAL
- **Finding:** Candidate PII (including US EEO race/gender/veteran/disability) is collected with no consent capture, no retention policy, no data-subject access export, no erasure/anonymisation, and only hard deletes that leave residual data.
- **Evidence:** No consent field on apply (`modules/careers/CareersUI.php:1190-1603`); EEO columns plaintext (`db/cats_schema.sql:188-191`); candidate delete leaves `history`, activities, calendar events, tags, questionnaire answers (`DATABASE_AUDIT.md` DB-011, `lib/Candidates.php:363-449`); full e-mail bodies retained in `email_history` (`lib/Mailer.php:363-392`); resume text sent to a third party over HTTP (`wsdl/parse.wsdl:78`, `lib/License.php:687-706`).
- **Impact:** Legal exposure under GDPR/UK GDPR/CCPA/CPRA and similar laws for any EU/UK/California deployment; blocks enterprise procurement; resume leakage to a defunct third-party endpoint.
- **Recommendation:** Privacy-by-design in the target data model: consent records per candidate and purpose, configurable retention schedules with automated anonymisation jobs, DSAR export (machine-readable), erasure that cascades across all polymorphic tables, field-level encryption for EEO/sensitive attributes, and a processing-activity log. Disable the Resfly call immediately (see Phase 1).

### GAP-003 — Access control model cannot express enterprise org structures
- **Severity:** CRITICAL
- **Finding:** Each user has one global access level (Read / Edit / Delete / SA / Root, `constants.php:74-82`). There are no roles, no teams/departments, no record-level visibility (e.g. "only my requisitions", "confidential jobs"), no field-level permissions (EEO visibility is a single per-user flag). Several modules and most AJAX writes skip even the global check.
- **Evidence:** `lib/ACL.php:54-57` (the finer ACL map exists only as a commented example in `config.php`); no access checks in reports/lists/export/activity/home handlers (`SECURITY_AUDIT.md` §2, `FEATURE_INVENTORY.md` FEAT-006); `lib/AJAXInterface.php:210-216` login-only; `modules/export/ExportUI.php:54-67` any user can export any grid.
- **Impact:** Cannot support hiring managers, agencies, confidential executive searches, or segregation of duties; data exfiltration by low-privilege users.
- **Recommendation:** Policy-based RBAC + ABAC: roles (Admin, Recruiter, Coordinator, Hiring Manager, Interviewer, Agency), permissions per resource/action, scoping by department/location/job team, field-level masks for EEO/compensation, enforced centrally in the API layer (never in templates).

### GAP-004 — No integration platform (API, webhooks, events)
- **Severity:** HIGH
- **Finding:** There is no REST/GraphQL API, no API tokens, no webhooks, and no event model. Extensibility is 232+ `eval(Hooks::get(...))` string hooks, of which only a handful are implemented.
- **Evidence:** `API_AUDIT.md` (API-001: "no REST/JSON or other public API"); `ajax.php:63-127`; `lib/Hooks.php:52-72`; `ARCHITECTURE.md` ARCH-004.
- **Impact:** Cannot integrate with HRIS (Workday, BambooHR, Personio), job boards, assessment vendors, BI tools, or customer automation — a hard blocker for enterprise.
- **Recommendation:** Versioned REST API (OpenAPI 3.1) over the core domain (candidates, applications, jobs, stages, activities, attachments, users), OAuth2 client-credentials + scoped API keys, outbound signed webhooks driven by domain events (`application.stage_changed`, `candidate.created`, `offer.accepted`...), and an idempotent import API. Replace eval hooks with typed event listeners.

### GAP-005 — Hard-coded pipeline; no configurable hiring workflows
- **Severity:** HIGH
- **Finding:** The 11 pipeline statuses (100 "No Contact" … 800 "Placed") are PHP constants, seeded rows and SQL literals. There are no transition rules, no per-job or per-department pipelines, no stage-level automation, and the only guard is "Placed requires openings".
- **Evidence:** `constants.php:120-130`; literals in `lib/Statistics.php:102,133`, `lib/Dashboard.php:85`, `lib/Pipelines.php:110,324-331`; single status-change path `modules/candidates/CandidatesUI.php:2900-3302`; guard at `:2932-2942` (`FEATURE_INVENTORY.md` FEAT-001).
- **Impact:** Corporate recruiting teams (vs. agencies) need distinct stages per job family (e.g. phone screen → take-home → onsite loop → debrief → offer). Hard-coding blocks adoption and makes reports agency-centric ("Submitted", "Client Declined").
- **Recommendation:** Model `WorkflowTemplate` → `Stage` (ordered, typed: screen/interview/offer/hired/rejected) with transition rules and stage actions (send e-mail, create task, request feedback, notify team). Map the 11 legacy statuses to a default "Agency" template to preserve existing data and reports.

### GAP-006 — No interview scheduling
- **Severity:** HIGH
- **Finding:** "Interview" is only a status and a calendar event type. Calendar events have a single owner, no attendees/interviewers, no location/video link, no candidate invitation or self-scheduling, and no external calendar sync. Private events are sent to every user and only hidden in JavaScript.
- **Evidence:** `db/cats_schema.sql:113-135` (`calendar_event` columns); `lib/Calendar.php:132-145` (month query filters only on `site_id`, no public/private filter); `modules/calendar/Calendar.js:961-963` (client-side hiding) — `FEATURE_INVENTORY.md` FEAT-004; 0 hits for `caldav|ics|imap`.
- **Impact:** Scheduling is the largest time sink for recruiters/coordinators; without it the ATS is a record-keeping tool, not a workflow tool. The private-event leak is also a confidentiality bug.
- **Recommendation:** Interview entity (panel, slots, rooms, video links), Google Workspace / Microsoft 365 calendar integration with free/busy, candidate self-scheduling links, ICS invites, reminders via a reliable job queue.

### GAP-007 — No structured feedback / scorecards
- **Severity:** HIGH
- **Finding:** The only evaluation datum is one integer `candidate_joborder.rating_value` set by any user via AJAX; there is no rater, criteria, comments, or decision.
- **Evidence:** `db/cats_schema.sql:238`; `ajax/setCandidateJobOrderRating.php`; 0 hits for `scorecard|evaluation|interviewer`.
- **Impact:** No structured hiring, no bias mitigation, no audit of hiring decisions — increasingly required for compliance and quality-of-hire.
- **Recommendation:** Scorecard templates per stage (attributes, rating scales, required questions), per-interviewer feedback with submission deadlines, blind-until-submitted visibility, and hire/no-hire recommendations feeding debrief views.

### GAP-008 — No requisition management or approvals
- **Severity:** HIGH
- **Finding:** Any EDIT-level user creates a live job order directly. There is no requisition object, headcount, budget/compensation band, approval chain, or opening lifecycle beyond `openings` / `openings_available` counters.
- **Evidence:** `modules/joborders/JobOrdersUI.php:116-130`; `joborder` columns `db/cats_schema.sql:792-821`; 0 hits for `requisition|headcount|budget`.
- **Impact:** Enterprise HR requires approved headcount before recruiting starts and alignment with HRIS positions.
- **Recommendation:** Requisition → Job (1:n openings) with configurable approval chains, HRIS position sync, and audit of approvals.

### GAP-009 — No offer management
- **Severity:** HIGH
- **Finding:** "Offered" (600) is a status only; no offer record, compensation, approval, letter generation, or e-signature.
- **Evidence:** `constants.php:127`; 0 real hits for `offer letter|e-?sign|docusign`.
- **Impact:** Offers are managed outside the system; no data for offer-acceptance analytics; compensation approvals ungoverned.
- **Recommendation:** Offer entity with versioned terms, approval chain, templated letters, e-signature integration (DocuSign/Dropbox Sign/Adobe), and hand-off to HRIS on acceptance.

### GAP-010 — No hiring-team roles or hiring-manager experience
- **Severity:** HIGH
- **Finding:** A job order has only `recruiter`, `owner` and a client `contact_id`; client contacts are not users; there is no way to share candidates with a hiring manager, collect their feedback, or give interviewers a limited view.
- **Evidence:** `db/cats_schema.sql:792-821`; `FEATURE_INVENTORY.md` (Contacts/Job Orders sections); 0 hits for `hiring manager|hiring team`.
- **Impact:** Corporate ATS value depends on hiring-manager participation; without it adoption stays within the recruiting team.
- **Recommendation:** Job team membership (recruiter, coordinator, hiring manager, interviewers) tied to RBAC scoping (GAP-003) and a lightweight hiring-manager view (review, feedback, approve).

### GAP-011 — No tamper-evident audit log
- **Severity:** HIGH
- **Finding:** `history` stores field diffs for some updates and `user_login` records logins, but views, exports, e-mails sent, attachment downloads/deletions, activity deletions, permission and settings changes are not logged; history rows are mutable MyISAM rows and are deleted with their parent records.
- **Evidence:** `lib/History.php:64-128`; `lib/Pipelines.php:155-169` (history deletion); comment `lib/Pipelines.php:354` "Add auditing history."; `SECURITY_AUDIT.md` SEC-022; `DATABASE_AUDIT.md` DB-013.
- **Impact:** Cannot answer "who accessed/exported this candidate's data" (GDPR accountability, SOC 2 CC7, ISO 27001 A.8.15); reports can be silently rewritten.
- **Recommendation:** Append-only audit event store (actor, action, resource, before/after, IP, request id) written by the API layer; retention and export to SIEM.

### GAP-012 — Careers portal below modern expectations
- **Severity:** HIGH
- **Finding:** DB-stored raw-HTML templates at fixed 940px width, no viewport/responsive CSS, first-site only, job search pages are empty stubs, no CAPTCHA/consent, questionnaire pre-selects answers, and candidate identity is trusted from the client (critical security defect).
- **Evidence:** `db/cats_schema.sql:434-440`; `modules/careers/CareersUI.php:79` (`getFirstSiteID`), `:180-182,856-858` (search stubs), `:725` (client `candidateID`), `:1635-1735` (cookie identity); `UX_UI_AUDIT.md` UX-001/UX-007/UX-011; `SECURITY_AUDIT.md` SEC-024/SEC-025.
- **Impact:** Majority of applicants use mobile; poor apply conversion; employer-brand damage; data-integrity breach risk.
- **Recommendation:** Headless careers API + responsive, accessible, SEO-friendly (JobPosting schema.org) careers site with themeable branding, multi-brand/multi-site, job search/filter, consent capture, spam protection, and verified candidate accounts (magic link).

### GAP-013 — No e-mail / calendar integration or communication timeline
- **Severity:** HIGH
- **Finding:** Outbound mail only (PHPMailer); sent mail is written to `email_history` but never displayed; no inbound capture, no Gmail/Outlook sync, no templates with tracking, no SMS.
- **Evidence:** `lib/Mailer.php:363-400` (only accessor of `email_history`); 0 hits for `imap|outlook|caldav|sms|twilio` (real).
- **Impact:** Candidate communications live in personal inboxes; no shared context; compliance gap.
- **Recommendation:** Unified candidate timeline (e-mails in/out, SMS, notes, events, stage changes) with Google/Microsoft mailbox integration and scheduled/sequenced outreach.

### GAP-014 — Analytics limited to counts
- **Severity:** HIGH
- **Finding:** Reports are fixed COUNT queries (54 on the reports tab), a submission/placement report, EEO report and artichow graphs. No funnel conversion, time-in-stage, time-to-fill/hire, source-of-hire, pass-through by stage, recruiter productivity, or diversity funnel analytics. Stats count mutable history rows and a status typo drops "On Hold" jobs.
- **Evidence:** `modules/reports/ReportsUI.php:93-168`; `lib/Statistics.php` (no `source` usage); `lib/JobOrderStatuses.php:55` (`'OnHold'` vs `'On Hold'`); `PERFORMANCE_AUDIT.md` PERF-012.
- **Impact:** Talent-acquisition leaders cannot measure or improve the process; weak business case for the product.
- **Recommendation:** Event-sourced application history (immutable stage transitions with timestamps) feeding a reporting model / warehouse export; standard dashboards and a BI connector.

### GAP-015 — Job distribution
- **Severity:** MEDIUM
- **Finding:** Only pull feeds (RSS; Indeed/SimplyHired XML templates hard-coded to "CATS (www.catsone.com)", country "US") for the first site; the push function is a hook-only stub. SimplyHired's publisher program is, by external knowledge (ASSUMPTION), discontinued.
- **Evidence:** `modules/xml/XmlUI.php`, `modules/xml/xml_templates/*.xtpl`, `lib/XmlJobExport.php:108-111`; `API_AUDIT.md`.
- **Recommendation:** Google for Jobs structured data on the careers site, maintained Indeed/LinkedIn feeds, and optional multiposting aggregator integration.

### GAP-016 — Search quality
- **Severity:** MEDIUM
- **Finding:** Candidate search is `%LIKE%` and resume search compiles boolean syntax to `REGEXP '[[:<:]]…'` over `attachment.text` with no FULLTEXT index; Sphinx is optional and uses an ancient API.
- **Evidence:** `lib/DatabaseSearch.php:362`, `lib/Search.php:462-464,1356-1377,1939-2024`; `PERFORMANCE_AUDIT.md` PERF-001/002.
- **Recommendation:** Dedicated search engine (OpenSearch/Elasticsearch, Meilisearch or PostgreSQL FTS + pgvector) with facets, relevance, synonyms and later semantic retrieval.

### GAP-017 — Duplicate management and data quality
- **Severity:** MEDIUM
- **Finding:** Duplicate check requires exact first+last name, is not site-scoped, runs only on manual add (not import or careers apply); merge re-points rows of the wrong entity types.
- **Evidence:** `lib/Candidates.php:1136-1210,1314-1359`; `modules/candidates/CandidatesUI.php:2663`; `DATABASE_AUDIT.md` DB-001 (CRITICAL data-integrity bug).
- **Recommendation:** Fuzzy + deterministic matching (e-mail, phone E.164, name similarity, LinkedIn URL) across all ingestion paths, reviewable merge with full provenance.

### GAP-018 — No sourcing CRM
- **Severity:** MEDIUM
- **Finding:** Static saved lists only (dynamic lists unimplemented); bulk e-mail is SA-only with no unsubscribe; no referrals, talent pools, or campaigns.
- **Evidence:** `lib/SavedLists.php:212`; `modules/lists/ListsUI.php:159-180`; `modules/candidates/CandidatesUI.php:297-307,3305-3417`.
- **Recommendation:** Talent pools/smart lists, sequences with unsubscribe/consent enforcement, referral portal.

### GAP-019 — No mobile or accessible UI
- **Severity:** MEDIUM (HIGH for public-sector buyers where WCAG 2.1 AA / Section 508 / EN 301 549 is mandated)
- **Finding:** No viewport meta, no `@media` queries, 359 inline pixel widths, zero ARIA, image-only controls, mouse-only grid operations.
- **Evidence:** `UX_UI_AUDIT.md` UX-001, UX-005; `lib/TemplateUtility.php:548,918-932`; `lib/DataGrid.php:1719,1840`.
- **Recommendation:** New UI built on an accessible component system, WCAG 2.2 AA as an acceptance criterion, responsive by default.

### GAP-020 — No internationalisation
- **Severity:** MEDIUM
- **Finding:** English literals throughout templates; no gettext/ICU; dates hard-coded MM-DD-YY with DMY handled by rewriting SQL text; integer GMT offsets; no country field on core entities.
- **Evidence:** `lib/DatabaseConnection.php:648-711`; `constants.php:196`; `UX_UI_AUDIT.md` (dates/locale).
- **Recommendation:** ICU message catalogs, IANA time zones stored per user/site, UTC storage, locale-aware formatting, country/region on addresses.

### GAP-021 — No disposition (rejection) reasons
- **Severity:** MEDIUM
- **Finding:** Rejection is two statuses (650 "Not in Consideration", 700 "Client Declined") with no reason codes; EEO report "rejected" is derived from them.
- **Evidence:** `constants.php:127-128`; `lib/Statistics.php:722`.
- **Recommendation:** Configurable disposition reasons (required on reject), candidate-facing rejection templates, reporting by reason.

### GAP-022 — Unreliable background processing
- **Severity:** MEDIUM
- **Finding:** Event reminders depend on an undocumented cron job running `QueueCLI.php`, which fatals on PHP 8; only two tasks registered; no visibility or retries.
- **Evidence:** `QueueCLI.php:59`; `modules/calendar/tasks/tasks.php:39`; `modules/queue/QueueUI.php:49-56`.
- **Recommendation:** Durable job queue (e.g. Redis/SQS-backed) with retries, scheduling, dead-lettering and an admin view; all e-mail and document processing moved off the request path.

### GAP-023 — Resume parsing
- **Severity:** MEDIUM
- **Finding:** Parsing calls Resfly SOAP over plain HTTP (`wsdl/parse.wsdl:78`); the license gate is neutered so it is always "enabled" (`lib/License.php:687-706`); the host no longer resolves (observed by the API audit on 2026-09-25 via the sandbox proxy — treat as UNVERIFIED from other networks).
- **Recommendation:** Disable now; replace with a maintained parser (self-hosted or vendor) or an LLM-based extraction service behind a privacy review.

### GAP-024 — No AI-assisted recruiting features
- **Severity:** LOW (differentiator; must be designed with EU AI Act "high-risk" employment rules and NYC LL 144 bias-audit obligations in mind — ASSUMPTION about applicable law, requires legal review)
- **Finding:** No matching, ranking, summarisation, or drafting assistance.
- **Recommendation:** After the platform foundation exists: resume parsing/normalisation, candidate summaries, job-description drafting, outreach drafting, semantic search — with human-in-the-loop, explainability, audit logging and opt-out.

### GAP-025 — Ecosystem integrations
- **Severity:** LOW
- **Finding:** No assessments, background checks, reference checks, onboarding hand-off, or candidate surveys (0 hits each).
- **Recommendation:** Deliver via the integration platform (GAP-004) as partner connectors rather than in-core features.

---

## 3. What already exists and should seed the new product (FACT)

These capabilities are present and valued by current users; they define the migration baseline (details in `FEATURE_INVENTORY.md`):

- Core recruiting entities: candidates, companies, contacts, job orders, pipelines (candidate ↔ job with status history), activities, calendar events, attachments with text extraction, saved lists, tags, extra fields.
- Agency-style workflow: submissions/placements tracking, client companies and contacts, cold-call list, vCard export.
- Careers portal with questionnaires and EEO capture; RSS/XML job feeds.
- CSV import (with revert) / export; mass resume import.
- EEO reporting (US), submission and placement reports.
- E-mail templates for status changes; LDAP authentication.

---

## Facts vs Assumptions

- **FACT:** All "absent" statements are backed by zero (or false-positive-only) hits in the sweep in §1 plus reading the relevant code paths cited per gap.
- **ASSUMPTION:** The definition of "modern enterprise ATS" (market comparison), the severity weighting from a product/sales perspective, the status of external services (SimplyHired, Resfly) and applicable regulation (GDPR, CCPA, EU AI Act, NYC LL 144) — these require product-management and legal validation.

## Unknowns / Needs Further Investigation

- Target customer segment (staffing agencies vs. corporate TA vs. both) — this changes the priority of GAP-005/008/009/010 vs. agency features (client portal, placements, billing).
- Whether existing OpenCATS users rely on features absent from the code but provided by forks or hook plug-ins (no hook implementations are in-repo beyond `SettingsUI::defineHooks()`).
- Real usage data (which modules/reports are used) — needs analytics or user interviews.
- Regulatory footprint of target customers (EU/UK/US federal contractors → OFCCP).
