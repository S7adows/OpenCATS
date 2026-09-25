# OpenCATS 2.0 — Differentiators (proposed)

**Status:** PROPOSED. Differentiators are positions or capabilities where OpenCATS can be **meaningfully different or better** — not features copied from competitors. Each is tied to market evidence showing the gap (`docs/competitive/`), to what makes it credible for OpenCATS specifically, and to how it could be validated. All are **[RECOMMENDATION]**; evidence rows carry their own grades.

> **Guardrail:** a differentiator only matters once the table stakes (`TABLE_STAKES.md`) are met. None of these compensates for missing SSO, scheduling, scorecards, privacy or accessibility.

---

## D1. Governance included in the open core
- **Gap in market:** SCIM, custom roles, audit log, deep API access and requisition approvals are the most consistently gated features; SSO is gated by some vendors (Recruitee, Recruit CRM) and included by others (Ashby); Greenhouse's audit log is enabled via account management with a 30-day window [SOURCE CLAIM; Greenhouse audit docs FACT] (`PRICING_AND_PACKAGING.md` §6.3; `ENTERPRISE_ATS_REQUIREMENTS.md` key finding 2).
- **What OpenCATS offers:** SSO (OIDC/SAML), MFA, RBAC with job scoping and field masks, append-only audit including reads (≥1 year), privacy lifecycle — free, in the core. Candidate for inclusion too: SCIM (ER Bar 2 notes the market gates it).
- **Why credible for OpenCATS:** open-source distribution makes paywalled safety features self-defeating; verifiable because the code is open.
- **Validate:** security/procurement questionnaire walkthroughs with 3–5 target buyers; time-to-pass a standard SIG Lite/CAIQ with the reference deployment.
- **Risk:** reduces monetisable surface → decide packaging (decision D3/D4).

## D2. Your data, your infrastructure — with no phone-home
- **Gap in market:** no evidenced commercial vendor offers self-hosting or source access (`MARKET_OVERVIEW.md` §6); open alternatives are ERP/HRMS modules or fragile projects (`OPEN_SOURCE_ATS.md` §4) [FACT/INFERENCE].
- **What OpenCATS offers:** container-based self-hosting, no telemetry or licence enforcement, full export, documented reporting schema; optional managed single-tenant hosting (subject to licence decision below).
- **Why credible:** OpenCATS has historically been self-hosted; its legacy phone-home and licence code are being removed (Phase 0 FEAT-012; upstream #802 [FACT]).
- **Constraint [FACT]:** CATS Public License 1.1a Exhibit B (`LICENSE.md:850-853`) restricts hosted/ASP use of original CATS code without Cognizo's permission — a hosted offer needs permission or a code base without original CATS code. *Not legal advice.*
- **Validate:** install-to-first-job time; data-residency requirements from EU/public-sector prospects.

## D3. Transparent, bring-your-own-model AI with a compliance kit
- **Gap in market:** vendors rarely state training-data policies [UNKNOWN/INFERENCE]; AI is metered and opaque (credits) [SOURCE CLAIM]; regulation demands notice, human oversight, logging and bias analysis (EU Annex III from 2 Dec 2027; LL 144; IL; CO) [SOURCE CLAIM] (`AI_RECRUITING_LANDSCAPE.md` §5, §7).
- **What OpenCATS offers:** provider-agnostic AI gateway (hosted APIs or local/open-weight models), per-feature opt-in (off by default), open prompt templates and rubrics, criterion-level explanations stored with outputs, AI audit trail, adverse-impact reporting, candidate notice/opt-out kit, "no training on customer data" by default. Assistive features first; evaluative features only in a governed module; never autonomous rejection.
- **Why credible:** open prompts and self-hosted models are verifiable only in an open product; OpenCATS's own Resfly failure (RISK-005) is a documented lesson.
- **Validate:** legal/compliance review with a design partner; red-team the prompt-injection surface (resumes are untrusted input).

## D4. An open, modern agency model: placements, submittals and a client review portal
- **Gap in market:** agency platforms model revenue (Bullhorn Placement with pay/bill/fee/commission; Sendout with read tracking [FACT, official SDK]) and client collaboration (Loxo, Recruit CRM scoped client links [SOURCE CLAIM]); none researched is open or self-hostable; Bullhorn's model carries dated patterns (numbered custom slots, session tokens in URLs [FACT]).
- **What OpenCATS offers:** Placement aggregate (dates, rates, fee, guarantee, commission splits, effective-dated changes), Submittal/Sendout events, password-less scoped client portal with feedback flowing into the timeline, optional BD pipeline — on the same workflow and approval engines as in-house hiring.
- **Why credible:** OpenCATS's existing users and data model are agency-oriented (companies, contacts, submissions, placements) [FACT, `FEATURE_INVENTORY.md`].
- **Validate:** interviews with 5–10 agencies currently on OpenCATS 0.9.x/upstream; measure report accuracy vs today (FEAT-008).

## D5. Correct-by-construction recruiting data
- **Gap in market:** rarely marketed; users feel it. Evidence of the problem in OpenCATS itself: mutable status history rewriting KPIs, cross-entity merge corruption, silently dropped bulk selections [FACT, Phase 0]. Market reference points: Bullhorn soft delete + edit history [FACT]; SAP application snapshots and field-level audit [SOURCE CLAIM].
- **What OpenCATS offers:** immutable application events, soft delete, typed and reviewable merges, idempotent/undoable bulk jobs, reports reproducible from events.
- **Validate:** property-based and characterisation tests; published "report reproducibility" guarantee.

## D6. Workflow depth without consultants
- **Gap in market:** suites rely on business-process engines, configuration packages and implementers (Workday, SAP, Oracle, iCIMS partner setups) [SOURCE CLAIM + INFERENCE] (`COMPETITOR_RESEARCH.md` Part C lessons).
- **What OpenCATS offers:** opinionated templates with typed stages, stage actions, one approval engine and apply-form schemas — editable in the admin UI, versioned, exportable; sensible defaults per segment (agency, in-house).
- **Validate:** time for an admin to configure a new hiring process end-to-end.

## D7. Interoperability as a promise
- **Gap in market:** API sprawl (Greenhouse ~8 APIs [FACT]; Workday SOAP/REST/Studio), partner-only keys (Jobvite, Gem via account team) [SOURCE CLAIM], webhook reliability gaps (Teamtailor no retries [FACT]).
- **What OpenCATS offers:** one versioned REST API with UI parity, self-serve scoped keys, reliable signed webhooks, MCP interface gated by RBAC, JSON-LD, standard exports; typed connector contracts.
- **Validate:** "API parity" test suite (every UI mutation has an API equivalent); integrator onboarding time.

## D8. Migration and portability toolkit
- **Gap in market:** switching costs are high; some vendors document import shapes (Bullhorn Data Loader [FACT]); OpenCATS installs face schema drift and data-quality issues (RISK-009, RISK-013) [FACT].
- **What OpenCATS offers:** lossless migrator from OpenCATS 0.9.x and upstream v0.11 (with data-quality reports), importers for common competitor export shapes, full export back out.
- **Validate:** rehearsal migrations on anonymised real databases; fidelity metrics.

## D9. Accessibility and openness you can verify
- **Gap in market:** no vendor ACR was verified in this session [UNKNOWN]; pricing mostly opaque [SOURCE CLAIM].
- **What OpenCATS offers:** WCAG 2.2 AA release gate with a published ACR; public packaging boundary; public roadmap, ADRs, security advisories and signed releases.
- **Validate:** third-party accessibility audit; buyer feedback on transparency.

---

## Differentiators we considered and rejected
| Candidate | Why not a differentiator |
|---|---|
| "Modern UI" / kanban / AI summaries | Commoditised (`PRODUCT_OPPORTUNITIES.md` §1) |
| AI interviewers / autonomous agents | High regulatory risk; being acquired by suites; partner integration instead |
| Sourcing database of external profiles | Provenance/GDPR risk; licensing |
| Frontline conversational apply | Requires scale and channels (SMS/WhatsApp) outside the core segments; optional via partners |
| Full HR suite bundling (Workable, Tellent pattern) | Scope explosion; integrate with HRIS |

## Facts vs inferences
Market gaps cite graded evidence; "what OpenCATS offers" and validation plans are RECOMMENDATION; credibility arguments are INFERENCE grounded in Phase 0 FACTs.
