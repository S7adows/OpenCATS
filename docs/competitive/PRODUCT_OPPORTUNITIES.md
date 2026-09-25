# Product Opportunities for OpenCATS 2.0

**Scope.** Answers the Phase 2 opportunity questions — what is commoditised, what OpenCATS 2.0 must provide, where competitors are overly complex or weak, what OpenCATS could do differently, what not to build, where the product leverage is, and what would make OpenCATS genuinely competitive rather than "modern looking". It turns the evidence in `MARKET_OVERVIEW.md`, `COMPETITOR_RESEARCH.md`, `MODERN_ATS_UX_PATTERNS.md`, `ENTERPRISE_ATS_REQUIREMENTS.md`, `AI_RECRUITING_LANDSCAPE.md`, `OPEN_SOURCE_ATS.md`, `PRICING_AND_PACKAGING.md` and `COMPETITIVE_GAP_ANALYSIS.md` (GA-#) into opportunities. The product decisions derived from it are in `docs/product/`.

**Date:** 2026-09-25. **Tags:** every conclusion is marked **[FACT]**, **[SOURCE CLAIM]**, **[INFERENCE]**, **[RECOMMENDATION]** or **[UNKNOWN]**. Recommendations are never presented as market facts. No vendor is ranked.

---

## 1. What is already commoditised?

"Commoditised" = documented by most products researched, in similar form, so it confers no advantage but its absence disqualifies. [INFERENCE from convergence counts in `MODERN_ATS_UX_PATTERNS.md` summary table and `COMPETITIVE_GAP_ANALYSIS.md`.]

| Capability | Evidence of convergence | Grade |
|---|---|---|
| Configurable pipeline templates + kanban/list | Teamtailor, Recruitee, Pinpoint, Ashby, SmartRecruiters, Oracle (UXP #5, #15) | SOURCE CLAIM (search excerpts) |
| Candidate self-scheduling with calendar sync | 7 products (UXP #9); calendar APIs (Cronofy MIT SDK) make it infrastructure | FACT (SDK) + SOURCE CLAIM |
| Structured scorecards / interview kits | Greenhouse [FACT API docs], Teamtailor, Lever (UXP #10) | FACT + SOURCE CLAIM |
| Reject with reason + template, bulk | Workable, Recruitee, Greenhouse, SmartRecruiters (UXP #8) | SOURCE CLAIM |
| Careers site + hosted apply with consent | Lever [FACT], Greenhouse [FACT], Bullhorn MIT portal [FACT], Teamtailor [FACT] | FACT |
| Job-board posting / multiposting | All SMB/mid-market products (CR) | SOURCE CLAIM |
| Resume parsing | Ubiquitous (AI §7.3) | SOURCE CLAIM |
| Public API + webhooks | Greenhouse, Lever, Ashby, SmartRecruiters, iCIMS, Teamtailor (CR) | FACT (several official repos) |
| SSO | Widespread; Ashby includes on all plans (PRC §6.3) | SOURCE CLAIM |
| Basic AI assist (JD drafting, summaries, notes) | Workable, Greenhouse, Ashby, Metaview (AI §7.3) | SOURCE CLAIM |

**[INFERENCE]** Being "a modern-looking ATS with a kanban board and AI summaries" is not a strategy in 2026; every paid competitor already is one.

---

## 2. What must OpenCATS 2.0 absolutely provide?

**[RECOMMENDATION]** The minimum credible product — derived from TABLE STAKE and critical ENTERPRISE REQUIREMENT rows in `COMPETITIVE_GAP_ANALYSIS.md` and the Phase 0 critical gaps. Full list in `docs/product/TABLE_STAKES.md`.

1. **Safe by default:** modern credential storage, MFA, tokenised reset, SSO (OIDC + SAML), CSRF/XSS-safe UI, session hardening (GA-#44, #46; SEC-001…007). *Upstream v0.11 has begun this (`password_hash` #685, CSRF #693, default-admin change #873) [FACT].*
2. **Authorisation that matches org structure:** roles × job-scoped hiring teams, field-level protection of EEO/compensation (GA-#47, #48).
3. **Privacy lifecycle:** split consent at apply, retention and auto-anonymisation, DSAR export, erasure that cascades (GA-#56).
4. **Configurable workflow:** templates with typed stage categories, dispositions with reasons, stage automation, board + list (GA-#5–8).
5. **Interviews:** scheduling with calendar sync and self-scheduling; structured, blind scorecards (GA-#12, #13).
6. **Candidate experience:** accessible, responsive careers site + short configurable apply + verified candidate status portal; JobPosting JSON-LD (GA-#34–36, #39).
7. **Platform:** one versioned public REST API, signed webhooks with retries, connector framework (GA-#40–42).
8. **Audit:** append-only, default-on, including reads/exports (GA-#49).
9. **Analytics foundation:** immutable stage-transition events + metric dictionary + export (GA-#54).
10. **Accessibility and localisation** as release gates (WCAG 2.2 AA; ICU i18n; IANA time zones) (GA-#51, #52).
11. **Migration:** lossless path from OpenCATS 0.9.x and upstream v0.11 data (GA-#26; `docs/audit/RISKS.md` RISK-013).

---

## 3. Where are competitors overly complex?

| Complexity | Evidence | Grade | Opportunity (RECOMMENDATION) |
|---|---|---|---|
| **Generic business-process engines** that require implementers for every approval/step | Workday BP engine; SAP templates/XML configuration; Oracle configuration packages (CR-C lessons) | SOURCE CLAIM + INFERENCE | Opinionated workflow templates + a small approval-policy model, configurable in the admin UI without consultants |
| **API sprawl** (many APIs, auth styles, parallel versions) | Greenhouse: ~8 APIs incl. Harvest v1/v2 [FACT, API docs repo]; Workday SOAP + REST + Studio; Lever v0 vs v1 | FACT + SOURCE CLAIM | One versioned REST API + one webhook model + MCP on top |
| **SKU sprawl and credit metering** | SmartRecruiters (SmartJobs, SmartDistribute, SmartMessage, SmartCRM, Attrax, SmartSandbox, 5 Winston variants); AI credits (Ashby, Workday, Recruitee) | SOURCE CLAIM | Few, clearly described packages; publish the packaging boundary |
| **Split products with different identifiers** | SAP RCM vs RMK job IDs requiring mapping tools (CR-C SAP) | SOURCE CLAIM | One job identity across ATS, careers and API |
| **Partner onboarding via consultants / config imports** | iCIMS, Oracle, Workday partner setups (CR-C) | SOURCE CLAIM | Self-serve connectors with OAuth consent and scoped credentials |
| **Coordinator-heavy panel scheduling even with tooling** | GitLab handbook: separate scheduling tool on top of Greenhouse, ~12-step coordinator flow (UXP journey (a)) | SOURCE CLAIM · independent · read first-hand | Stage-triggered self-scheduling + interviewer pools; keep loops simple first |
| **Re-approval friction** | GitLab: changing only offer currency forces full re-approval (UXP #21) | SOURCE CLAIM · independent | Approval policies that distinguish material vs non-material changes |

---

## 4. Where are competitors weak?

| Weakness | Evidence | Grade | Opportunity (RECOMMENDATION) |
|---|---|---|---|
| **Governance paywalled** (SCIM, custom roles, audit log, API depth, requisition approvals, application custom fields) | PRC §6.3 (Ashby, Recruitee, Greenhouse); Greenhouse audit log enabled via account management | SOURCE CLAIM + FACT (Greenhouse docs) | Include safety/governance baseline in the open core |
| **Opaque pricing** | 6 of 16 commercial vendors confirmed quote-only; most figures not public (PRC §3) | SOURCE CLAIM | Public, simple packaging |
| **No self-hosting / source access** in the commercial market researched | No evidenced vendor offers it (MKT §6; OSS §4) | INFERENCE | Self-hostable, source-available by default |
| **Agency segment served by PE roll-ups with dated data models** (numbered custom slots, free-text statuses, session tokens in URLs) | Bullhorn SDK `customText1..25`, `BhRestToken` query param [FACT] | FACT | Modern open agency data model (placements, sendouts, client portal) with typed fields |
| **Irreversible bulk actions** | Greenhouse bulk move lacks undo; requires same-job selection (UXP #8) | SOURCE CLAIM | Previewable, undoable, audited bulk jobs |
| **Webhook reliability gaps** | Teamtailor docs: no retry on failed deliveries (CR-D) [FACT partner docs] | FACT | At-least-once delivery with retries, idempotency and delivery log |
| **Single-provider dependencies** (e-sign, CV parsing outages) | Workable e-sign incidents; Recruitee parser outage (CR-B) | SOURCE CLAIM · third-party copy | Provider abstraction with fallback for parsing, e-sign, calendar, AI |
| **Opaque AI training/data policies** | No vendor training-data policy verified (AI §2 #13) | UNKNOWN / INFERENCE | Explicit "no training on customer data", BYO model, open prompts |
| **Accessibility evidence** | No vendor ACR/VPAT verified in this session (UXP #22) | UNKNOWN | Publish an ACR for OpenCATS 2.0 and test publicly |
| **Open-source alternatives are HR/ERP modules or fragile projects** | Odoo/Frappe/OrangeHRM modules; Reqcore withdrawn, Huly archived (OSS §4) | FACT | A dedicated, governed, open ATS |

---

## 5. What could OpenCATS do differently?

**[RECOMMENDATION]** Positions that are credible *because* of what OpenCATS is (open source, self-hostable, agency heritage, MPL-licensed) — detailed in `docs/product/DIFFERENTIATORS.md`:

1. **Governance included, not upsold.** SSO, MFA, RBAC, audit log, privacy lifecycle in the free core. (Counter-positions the most consistent paywall in the market.)
2. **Your data, your infrastructure.** Self-host with no phone-home, no licence keys, full export, documented reporting schema; optional managed hosting.
3. **Transparent, bring-your-own-model AI.** Provider-agnostic gateway including local models; open prompt templates and rubrics; criterion-level explanations; AI audit log; default off; no autonomous rejection.
4. **Agency-grade *and* in-house-grade on one model.** Placements, submittals and a client review portal alongside structured hiring (scorecards, approvals) — using one workflow engine. Bullhorn-class agency modelling is not available in any open product researched. [INFERENCE]
5. **API-first as a promise:** everything the UI does is in the public API; webhooks are reliable; an MCP interface lets customers run their own agents safely.
6. **Migration as a feature:** lossless import from OpenCATS 0.9.x / upstream v0.11 and common competitor shapes; export everything back out.
7. **Accessibility and localisation as release gates**, with published evidence (ACR).

---

## 6. What should NOT be built?

**[RECOMMENDATION]** Full list with rationale in `docs/product/NON_GOALS.md`. Headlines:
- Autonomous AI decisions (auto-reject/advance), emotion/face/voice inference, AI interviewers in core (AI §7.3; COMPETITIVE_GAP_ANALYSIS §3).
- A sourcing/profile database of scraped data.
- HRIS, payroll, pay/bill invoicing, VMS — integrate instead.
- A generic BPM engine; SKU sprawl; credit-metered core features.
- Programmatic job advertising, video interviewing, assessments, background checks — partners.
- Native mobile apps before a responsive, accessible web app.
- Anything that reintroduces licence enforcement, telemetry-by-default or phone-home.

---

## 7. Which capabilities create the strongest product leverage?

**[INFERENCE]** Leverage = one capability that unlocks many others or many segments.

| Rank-free list | Why it is leverage | Unlocks (GA-#) |
|---|---|---|
| **Immutable application event history** (stage transitions, dispositions, actors incl. automation/AI) | Single source for timeline, analytics, audit, EEO/OFCCP, AI governance, webhooks | #9, #49, #54, #55, #63 |
| **Workflow engine with typed stages + stage actions** | Serves agency and corporate models; hosts automation, scheduling triggers, assessments, client portal permissions | #5–8, #12, #28–30 |
| **Policy-based RBAC with job scoping + field masks** | Precondition for hiring managers, interviewers, clients, agencies, API scopes, MCP | #11, #30, #40, #43, #47, #48 |
| **Public API + reliable webhooks + connector contracts** | Lets partners supply scheduling, e-sign, assessments, AI interviewers, HRIS; lets customers build agents | #16, #23, #40–43, #65 |
| **Person/Application/Pool data model with consent** | Unifies ATS and CRM; enables rediscovery and compliant nurture | #1, #17, #18, #56 |
| **Headless careers API** | Careers site, embeds, job boards, JSON-LD, candidate portal all on one surface | #34–36, #39 |
| **Approval engine** | Requisitions, offers, (agency) placements with one mechanism | #2, #3, #15, #29 |
| **Provider abstraction layer** (calendar, e-mail, e-sign, parsing, AI, storage) | Avoids single-provider fragility; enables self-hosting choices | #12, #23, #61, #62 |

---

## 8. What would make OpenCATS genuinely competitive — not just "modern looking"?

**[INFERENCE → RECOMMENDATION]**
1. **Trust as the product**: correct permissions, audit, privacy and accessibility, verifiable because the code is open. The Phase 0 audit shows OpenCATS's historic weakness was exactly here (SEC/DB/UX CRITICALs); the market shows buyers pay premium tiers for it.
2. **Correctness of recruiting data**: reports that cannot be silently rewritten (FEAT-008), merges that cannot corrupt (DB-001), bulk actions that do what they say (UX-002). Competitors rarely advertise this; users feel it daily.
3. **Workflow depth without consultant complexity**: templates, dispositions, scorecards, scheduling and approvals that an admin configures in an afternoon (§3).
4. **Serving the agency segment properly in open source**: placements, submittals, client portal — a segment the open-source world does not serve and the commercial world serves through roll-ups (MKT §6).
5. **Interoperability**: API parity, webhooks, MCP, JSON-LD, standard exports, importers — so OpenCATS composes with CRM, scheduling, AI and HRIS tools rather than competing with all of them.
6. **Community and continuity**: align with the revived upstream project rather than diverging silently (MKT §6; decision required).

---

## 9. Opportunity register

| ID | Opportunity | Evidence | Classification | Grade |
|---|---|---|---|---|
| OPP-01 | Governance-included open core | PRC §6.3, §7.1; OSS §4 | DIFFERENTIATOR | INFERENCE → RECOMMENDATION |
| OPP-02 | Self-host with no phone-home + optional managed hosting | MKT §6; Phase 0 FEAT-012; LICENSE.md Exhibit B constraint | DIFFERENTIATOR (with licence caveat) | FACT + INFERENCE |
| OPP-03 | BYO-model, transparent AI with compliance kit | AI §7.2–7.3; §4 regulation | DIFFERENTIATOR | RECOMMENDATION |
| OPP-04 | Open agency revenue model + client review portal | CR-D Bullhorn/Loxo; MKT §5 | DIFFERENTIATOR | FACT (Bullhorn model) + RECOMMENDATION |
| OPP-05 | Migration & portability toolkit | Phase 0 RISK-013; CR-D Gem import shape | DIFFERENTIATOR | RECOMMENDATION |
| OPP-06 | Correct-by-construction recruiting data (events, soft delete, type-safe merge) | Phase 0 DB-001, FEAT-003/008; CR-D Bullhorn soft delete | TABLE STAKE done unusually well | FACT + RECOMMENDATION |
| OPP-07 | Consultant-free configuration | CR-C lessons | DIFFERENTIATOR (vs suites) | SOURCE CLAIM + INFERENCE |
| OPP-08 | JSON-LD + headless careers quick win | MKT §4.7 (schema.org FACT; OpenCATS 0 hits FACT) | TABLE STAKE (quick win) | FACT |
| OPP-09 | MCP/agent interface over the public API | AI §2 #10 | FUTURE OPPORTUNITY | SOURCE CLAIM |
| OPP-10 | Published packaging and ACR | PRC §6.1; UXP #22 | DIFFERENTIATOR (low cost) | INFERENCE |

---

## 10. Facts vs inferences
- **FACT:** Phase 0 evidence; official-repository evidence (Greenhouse, Lever, Bullhorn, Teamtailor, schema.org, Cronofy); upstream OpenCATS git history; `LICENSE.md` terms.
- **SOURCE CLAIM:** vendor behaviour and positioning seen via search excerpts or third-party copies.
- **INFERENCE:** commoditisation, weakness and leverage judgements.
- **RECOMMENDATION:** all "opportunity" and "what to do" statements.

## 11. Unknowns
1. Customer demand data (no user interviews or usage telemetry): which segment values which differentiator most.
2. Whether upstream OpenCATS maintainers would collaborate on a 2.0 direction.
3. Legal position on CPL 1.1a Exhibit B for hosted offerings and on licensing of new code.
4. Verification of all search-excerpt vendor claims.

## Sources
Evidence is cited through the Phase 2 documents (numbered sources, accessed 2026-09-25) and the Phase 0 audit IDs referenced above.
