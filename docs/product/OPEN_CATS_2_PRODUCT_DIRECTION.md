# OpenCATS 2.0 — Product Direction (proposed)

**Status:** PROPOSED for decision — not approved. Produced at the end of Phase 2 (competitive market research), 2026-09-25.
**Inputs:** Phase 0 audit (`docs/audit/`), Phase 2 research (`docs/competitive/`). Companion documents: `PRODUCT_PRINCIPLES.md`, `TABLE_STAKES.md`, `DIFFERENTIATORS.md`, `NON_GOALS.md`.
**Tagging:** statements are **[FACT]**, **[SOURCE CLAIM]**, **[INFERENCE]**, **[RECOMMENDATION]** or **[UNKNOWN]**. This whole document is a recommendation unless a statement is tagged otherwise.

---

## 1. The direction in one paragraph

**[RECOMMENDATION]** OpenCATS 2.0 should become **the open, self-hostable, API-first recruiting system with enterprise-grade governance included** — built first for **recruitment agencies and in-house hiring teams that need control of their candidate data**, with a data model that also supports structured corporate hiring. It should win on *trust* (security, privacy, auditability, accessibility — verifiable because the code is open), on *correctness* of recruiting data, on *interoperability* (complete API, reliable webhooks, standard exports, MCP), and on *workflow depth without consultant complexity* — not on a longer AI feature list or a "modern-looking" UI alone.

---

## 2. Why this direction (evidence)

| Evidence | Grade | Source |
|---|---|---|
| The market is consolidating into HCM suites and PE roll-ups that buy AI rather than build it; none evidenced offers self-hosting or source access | SOURCE CLAIM (deals) + INFERENCE | `MARKET_OVERVIEW.md` §3, §6 |
| Open-source recruiting lives mainly in ERP/HRMS modules; ATS-first open projects are fragile (one withdrawn, one archived in 2026) | FACT | `OPEN_SOURCE_ATS.md` §4 |
| Governance features (SCIM, custom roles, audit log, deep API, approvals) are the most consistently paywalled; SSO is contested | SOURCE CLAIM | `PRICING_AND_PACKAGING.md` §6.3 |
| Table stakes are well defined and converging (templates, scheduling, scorecards, dispositions, careers + consent, API/webhooks) | FACT + SOURCE CLAIM | `MODERN_ATS_UX_PATTERNS.md`; `COMPETITIVE_GAP_ANALYSIS.md` |
| OpenCATS's heritage and existing users are agency-oriented (companies, contacts, submissions, placements) | FACT | `docs/audit/FEATURE_INVENTORY.md` |
| Agency products model revenue (placements with pay/bill/fee, sendouts); no open product does | FACT (Bullhorn SDK) + INFERENCE | `COMPETITOR_RESEARCH.md` Part D |
| OpenCATS's historic failures were exactly in trust and correctness (MD5, no CSRF, merge corruption, mutable reports, no accessibility) | FACT | `docs/audit/EXECUTIVE_SUMMARY.md` |
| AI regulation is tightening on a longer runway (EU Annex III from 2 Dec 2027; IL, CO, NYC) and rewards transparency and human oversight | SOURCE CLAIM (multiple independent) | `AI_RECRUITING_LANDSCAPE.md` §5 |
| Upstream OpenCATS was revived in 2026 (176 commits ahead of our fork; PHP 8.4; security fixes) | FACT (lead-verified) | `MARKET_OVERVIEW.md` §6 |
| CATS Public License 1.1a restricts hosted/ASP use of original CATS code without Cognizo's permission | FACT (`LICENSE.md:850-853`) | `MARKET_OVERVIEW.md` §6 |

---

## 3. Who it is for

**[RECOMMENDATION — requires decision D2]**

| Priority | Segment | Why | What they need most |
|---|---|---|---|
| **Primary** | **Recruitment agencies and staffing/search firms (small → mid-size)** | Heritage and existing users; underserved by open source; commercial options are PE roll-ups with dated models | Client CRM, submittals, placements with rates/fees, client review portal, fast candidate search, e-mail/calendar integration, data control |
| **Primary** | **In-house hiring teams in SMB/mid-market organisations that require data control** (e.g. EU/UK data-residency needs, public sector, regulated or privacy-sensitive employers, integrators) | Self-hosting and governance-included position fits; table stakes are well understood | Workflow templates, scheduling, scorecards, approvals, careers site, privacy lifecycle, SSO |
| Secondary | Enterprises needing an auditable, integrable ATS component (headless careers, API-driven) | Possible via API-first design | Requisitions/positions sync, SCIM, audit export, field-level security |
| Not targeted initially | Frontline/high-volume hourly hiring at enterprise scale; HCM-suite replacement | Requires conversational AI/SMS scale and HR-core depth (see `NON_GOALS.md`) | — |

**Users (personas):** recruiter / account manager (agency), recruiting coordinator, hiring manager, interviewer, client contact (agency), candidate, administrator, integrator/developer, compliance/privacy officer.

---

## 4. Jobs to be done (user-level, not features)

1. *As a recruiter,* I want to see what needs my action today and move many candidates forward correctly in a few steps, without losing context.
2. *As a coordinator,* I want interviews scheduled without e-mail ping-pong, and feedback collected on time.
3. *As a hiring manager / client,* I want to review a short list and give structured feedback or approval from wherever I am, without learning the whole system.
4. *As an interviewer,* I want to know what to assess and submit a structured scorecard quickly.
5. *As a candidate,* I want to find a job, apply on my phone in minutes, know what happens with my data, and see where I stand.
6. *As an agency owner,* I want to know submittals, placements, fees and margins by client and recruiter — accurately.
7. *As an admin / privacy officer,* I want to prove who accessed what, honour consent and deletion requests, and configure the process without a consultant.
8. *As an integrator,* I want every UI capability in a stable API with reliable events, so I can connect HRIS, job boards, assessments and our own agents.

---

## 5. Product pillars

| Pillar | What it means | Key capabilities (see `TABLE_STAKES.md`, `DIFFERENTIATORS.md`) |
|---|---|---|
| **P1 Trust by default** | Security, privacy, audit and accessibility are core, free and verifiable | SSO/MFA, RBAC + scoping + field masks, append-only audit incl. reads, consent/retention/erasure, WCAG 2.2 AA, no phone-home |
| **P2 Correct recruiting data** | Nothing silently rewrites history or corrupts records | Immutable application events, soft delete, type-safe merge with review, dispositions with reasons, idempotent bulk jobs |
| **P3 Workflow depth without complexity** | Configurable templates, not a BPM engine | Typed stages + stage actions, scheduling, scorecards, approvals (jobs/offers/placements), role-aware home |
| **P4 Open and interoperable** | Everything is reachable programmatically and portable | Public REST API (OpenAPI), signed webhooks, connectors, headless careers, MCP, importers/exporters |
| **P5 Agency-grade and in-house-grade on one model** | One engine serving both recruiting models | Placements, submittals, client portal, BD pipeline (optional) alongside requisitions, offers, scorecards |
| **P6 Responsible, optional AI** | Assistive first; transparent; bring your own model; humans decide | AI gateway, parsing, drafting, summaries, semantic search; evaluative AI only in a governed module |

---

## 6. Scope boundaries (summary; details in `NON_GOALS.md`)
- **In:** ATS + light CRM (pools, nurture with consent), scheduling, scorecards, approvals, offers (with e-sign integration), careers site, analytics foundation, agency placements and client portal, API/webhooks/MCP, privacy and audit.
- **Out (integrate):** HRIS/payroll/pay-bill, VMS, background checks, assessments, video interviewing and AI interviewers, programmatic job advertising, sourcing databases.
- **Never:** autonomous AI rejection, emotion/face inference, licence enforcement or phone-home in the core.

---

## 7. Strategic options considered

| Option | Description | For | Against | Assessment |
|---|---|---|---|---|
| A. Enterprise suite competitor | Compete with Workday/SAP/Oracle/iCIMS | Largest budgets | Requires HR core, global compliance ops, sales force; suites win on bundling | Not recommended [INFERENCE] |
| B. "Modern-looking" SMB clone | Copy Workable/Recruitee/Teamtailor UX | Clear feature targets | Commoditised; no advantage for an open project; pricing pressure | Not recommended alone [INFERENCE] |
| C. Open agency ATS only | Bullhorn-class modelling, open | Heritage; underserved | Narrower market; misses in-house demand for data control | Partial |
| **D. Open, governed ATS for agencies + data-sensitive in-house teams (recommended)** | One model serving both; trust + interoperability as edge | Fits heritage, open-source gap and governance paywall; reuses one workflow engine | Broader scope; needs disciplined sequencing | **Recommended** [RECOMMENDATION] |
| E. Headless recruiting platform for integrators only | API product, no full UI | Strong interoperability story | Hard to adopt without UI; small audience | Fold into D as pillar P4 |

---

## 8. Implications for the Phase 0 roadmap (`docs/audit/RECOMMENDED_ROADMAP.md`)

1. **[FACT → RECOMMENDATION] Re-baseline against upstream first.** Upstream OpenCATS v0.11.x already addresses several Phase 1 containment/bridge items (password hashing, CSRF, InnoDB, utf8mb4, AJAX authorisation, default-admin change, PHP 8.4, removal of licensing and multi-tenancy). Before any Phase 1 implementation, decide the upstream relationship (D1) and, if aligning, merge upstream into the fork and re-run the Phase 0 checks as a delta audit. Several roadmap items (1A-3, 1C, 1D-3, 1E-1, 1E-2) may already be satisfied — or may need verification of upstream's implementation.
2. **[FACT → RECOMMENDATION] Hosted offering requires a licence decision.** `LICENSE.md` Exhibit B (CPL 1.1a) restricts ASP/managed-service use of original CATS code without Cognizo's written permission, and requires "Powered by CATS" attribution. A hosted OpenCATS 2.0 therefore needs either permission or a new code base free of original CATS code. This strengthens the case for the strangler/new-platform approach and must be settled before a business model is chosen (D3, D4). *Not legal advice.*
3. **[RECOMMENDATION]** The Phase 0 target architecture (API-first modular monolith via strangler-fig) remains consistent with this direction; pillar P4 makes the public API a product, not just an internal layer.

---

## 9. Decisions required before design begins

| ID | Decision | Options | Why it blocks design | Inputs |
|---|---|---|---|---|
| **D1** | Relationship with upstream OpenCATS | Merge upstream and contribute / coordinate a 2.0 with maintainers / hard fork | Determines baseline code, community, licensing and Phase 1 scope | `MARKET_OVERVIEW.md` §6; `OPEN_SOURCE_ATS.md` §5.1 |
| **D2** | Target segments and priority | Agency-first / in-house-first / both (recommended) | Drives IA, default workflow templates, object model emphasis | §3 |
| **D3** | Hosting & business model | Self-host only / + paid support / + managed single-tenant / multi-tenant SaaS | Tenancy architecture, attestations, packaging; constrained by CPL Exhibit B | `PRICING_AND_PACKAGING.md` §7.2 |
| **D4** | Licence for new code; open-core boundary | MPL-2.0 continuation / AGPL / Apache; what (if anything) is paid | Contribution model, packaging, legal review | `OPEN_SOURCE_ATS.md` §6.5; `RISKS.md` RISK-017 |
| **D5** | Evolve vs rebuild (given upstream progress) | Continue strangler to new platform / modernise upstream code base in place | Stack, migration plan, design system choice | `docs/audit/MODERNIZATION_OPPORTUNITIES.md` §1 |
| **D6** | Technology stack (backend, frontend, DB, search) | e.g. PHP 8.x/Symfony vs TypeScript; React; MySQL 8/MariaDB vs PostgreSQL | Design-system eligibility (Astryx requires React ≥19) | `DESIGN_TOOLBOX_RESEARCH.md` §Decision prerequisites |
| **D7** | Tenancy model | Single-tenant (default) vs real multi-tenant | Data model, RBAC, hosting | `docs/audit/DATABASE_AUDIT.md` DB-012 |
| **D8** | AI stance | Assistive-only at launch; evaluative module later; BYO model; default off | Data flows, consent, audit design | `AI_RECRUITING_LANDSCAPE.md` §7 |
| **D9** | Accessibility & localisation targets | WCAG 2.2 AA + published ACR; launch locales; RTL in/out | Component and content design | `MODERN_ATS_UX_PATTERNS.md` #22 |
| **D10** | Design system & brand | Astryx trial vs established library; brand, density, theming | Front-end foundation | `DESIGN_TOOLBOX_RESEARCH.md` |
| **D11** | Integration priorities | Calendar (Google/Microsoft), e-mail, e-sign, job boards/JSON-LD, HRIS, assessments | API contracts and first connectors | `COMPETITIVE_GAP_ANALYSIS.md` #23, #34, #42 |
| **D12** | Migration commitment | Which sources (0.9.x fork, upstream v0.11, CSV, competitor shapes) are supported at launch | Data model compatibility; test fixtures | `docs/audit/RISKS.md` RISK-013 |

---

## 10. Proposed success measures (to validate, not targets)
**[RECOMMENDATION]** Measurable against Phase 0 baselines:
- **Recruiter effort:** move a candidate to an interview stage and schedule it — baseline ~8 page loads / 12+ clicks per candidate (`UX_UI_AUDIT.md` J3); target: comparable to documented market journeys (`MODERN_ATS_UX_PATTERNS.md` journey (a)).
- **Candidate apply:** baseline 5–8 page loads, not mobile-capable (J4); target: mobile-complete apply with minimal required fields, measured drop-off.
- **Trust:** zero open CRITICAL security findings; WCAG 2.2 AA conformance evidenced by a published ACR; audit coverage of reads/exports.
- **Correctness:** report figures reproducible from immutable events; zero cross-entity merge defects in tests.
- **Interoperability:** 100% of UI actions available via API; webhook delivery success and retry metrics.
- **Adoption:** successful migrations from 0.9.x/upstream installs (count, data fidelity).

---

## 11. Risks to this direction
| Risk | Mitigation |
|---|---|
| Scope too broad (agency + in-house) | One workflow engine; agency modules as a layer; sequence by D2 |
| Competing on "free" without a sustainable model | Decide D3/D4 early; public packaging; partner ecosystem |
| Divergence from upstream fragments the community | D1 first; contribute fixes upstream |
| Licence constraints on hosting | Legal review; new code base for hosted offer |
| Evidence gaps (search-excerpt grade vendor claims) | Browser verification pass before external use; customer interviews |

## 12. Unknowns
Customer demand and willingness to pay (no interviews yet); upstream maintainers' plans; legal interpretation of CPL 1.1a for hosted use; team size and skills; data volumes of target customers.
