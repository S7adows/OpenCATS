# OpenCATS 2.0 — Non-Goals (proposed)

**Status:** PROPOSED. Explicit statements of what OpenCATS 2.0 will **not** build, so scope stays focused (Phase 0 `RISKS.md` RISK-019 scope creep). Each non-goal has a rationale grounded in Phase 2 evidence and a horizon: **Never** (conflicts with principles), **Not in core** (integrate/partner), or **Not now** (revisit after foundations). All are **[RECOMMENDATION]**.

---

## 1. Never

| Non-goal | Rationale | Evidence |
|---|---|---|
| **Autonomous AI decisions** — auto-reject, auto-advance or auto-hire based on scores | Legal exposure (EU AI Act Annex III from 2 Dec 2027; NYC LL 144; Illinois HB 3773; *Mobley v. Workday*); contradicts principle "humans decide" | `AI_RECRUITING_LANDSCAPE.md` §5, §7.2 [SOURCE CLAIM] |
| **Emotion, face, voice-tone or personality inference** from video/audio | EU AI Act Art. 5 prohibition in workplace contexts; Illinois AIVIA burdens | `AI_RECRUITING_LANDSCAPE.md` §7.3 |
| **Opaque single "fit scores"** without criteria; using names, photos, ZIP/address or age proxies as model features | Illinois ZIP-proxy rule; evidence of name-based disparities in LLM ranking | `AI_RECRUITING_LANDSCAPE.md` §2 #12 [FACT, recomputed data] |
| **Licence-key enforcement, telemetry-by-default or phone-home** | Legacy leaked licence key and site data (FEAT-012); contradicts "your data leaves when you say so" | Phase 0 [FACT] |
| **Silent third-party processing of candidate data** (e.g. HTTP egress to a parser) | RISK-005 (Resfly over HTTP despite config) | Phase 0 [FACT] |
| **Security/governance baseline behind a paywall** (SSO, MFA, RBAC, audit, privacy tooling, accessibility) | Principle 1; market paywall is the opportunity | `PRICING_AND_PACKAGING.md` §7.1 |
| **`eval()`-based extension mechanisms** or code stored as data | Phase 0 ARCH-004, FEAT-015 | Phase 0 [FACT] |

## 2. Not in core — integrate or partner

| Non-goal | Instead | Evidence |
|---|---|---|
| HRIS, payroll, onboarding suite | Hire events + export; HRIS connectors | `COMPETITOR_RESEARCH.md` Part C/D lessons; `MARKET_OVERVIEW.md` §5 |
| Pay/bill invoicing, timesheets, VMS/MSP | Placement lifecycle webhooks; `client_job_id` mapping | Bullhorn pay/bill scope [FACT] |
| Background checks, assessments, skills tests | Typed partner contracts with common result schema | Oracle/Greenhouse partner patterns |
| Video interviewing, interview intelligence, AI interviewers | Partner APIs; consent + retention settings in core | `MARKET_OVERVIEW.md` §5 (Zoom–BrightHire, Employ–Pillar, Greenhouse–Ezra) |
| E-signature engine | Connector abstraction with fallback | Workable single-provider incidents [SOURCE CLAIM · third-party copy] |
| Programmatic job advertising / sponsored campaigns | Distribution abstraction; partner connectors | `MARKET_OVERVIEW.md` §4.7 |
| Scraped external candidate/profile databases | Ingestion API for compliant sourcing tools | `AI_RECRUITING_LANDSCAPE.md` §7.3 |
| Advanced talent marketing (events, campaign analytics, personalisation) | Basic pools + consent-aware sequences in core; CRM partners | `MARKET_OVERVIEW.md` §5 |
| Full BI tooling | Metric dictionary, standard dashboards, reporting schema + export (Visier-style ingestion) | Visier OpenAPI connectors [FACT] |
| Identity verification / deepfake detection engines | Provider hooks storing results with consent | `MARKET_OVERVIEW.md` §4.6 |

## 3. Not now — revisit after foundations

| Non-goal (for now) | Revisit when | Evidence |
|---|---|---|
| **Evaluative AI** (ranking/match scores) | Audit log, RBAC, consent, dispositions and fairness reporting exist; legal review done | `AI_RECRUITING_LANDSCAPE.md` §7.4 |
| **Native mobile apps** | Responsive, accessible web app is proven; demand from hiring managers | `MODERN_ATS_UX_PATTERNS.md` #21 |
| **Conversational/SMS/WhatsApp frontline apply** | A frontline segment is chosen (decision D2) | `MARKET_OVERVIEW.md` §4.5 |
| **Custom objects** (beyond typed custom fields) | Clear customer demand | `COMPETITIVE_GAP_ANALYSIS.md` #50 |
| **Multi-tenant SaaS** | Hosting/business model and licence decisions (D3, D4, D7) | `MARKET_OVERVIEW.md` §6 |
| **Complex interview loop optimisation** (load balancing, training/shadowing) | Core self-scheduling and panels are in use | `MARKET_OVERVIEW.md` §5 |
| **FedRAMP authorisation** | Clear public-sector demand; partner-hosted route first | `ENTERPRISE_ATS_REQUIREMENTS.md` §6.3 |
| **Generic business-process/BPM engine** | Probably never needed; templates + approval policies first | `COMPETITOR_RESEARCH.md` Part C lessons |
| **SKU-style module sprawl / credit-metered core features** | Packaging decision (D4) | `PRICING_AND_PACKAGING.md` §7.4 |
| **Enterprise HCM-suite replacement** | Out of strategy | `OPEN_CATS_2_PRODUCT_DIRECTION.md` §7 |

## 4. UX patterns deliberately not copied
| Pattern seen in market | Why not | Evidence |
|---|---|---|
| Irreversible bulk actions; same-job-only bulk moves | Correctness principle | `MODERN_ATS_UX_PATTERNS.md` #8 (Greenhouse) |
| Pipeline statuses doubling as integration triggers ("Bulk Invite" status) | Keep stage separate from action | `COMPETITOR_RESEARCH.md` Part C iCIMS lessons |
| Numbered custom-field slots (`customText1..25`) | Typed, named fields | Bullhorn SDK [FACT] |
| Session tokens in URLs; admin-generated all-access API keys | Security | Bullhorn SDK [FACT]; SmartRecruiters lessons |
| Webhooks without retries | Reliability | Teamtailor partner docs [FACT] |
| Offer re-approval for non-material changes | Approval policy should distinguish change types | GitLab handbook on Greenhouse [SOURCE CLAIM · independent] |
| Drag-only kanban | WCAG 2.2 SC 2.5.7 | W3C source [FACT]; Astryx template lacks keyboard handling [FACT] |
| Stacking multiple competing "taste" agent skills in the design process | Conflicting rules; supply-chain risk | `DESIGN_TOOLBOX_RESEARCH.md` synthesis |

## Facts vs inferences
Rationale rows cite graded evidence; the non-goals themselves are RECOMMENDATION and should be revisited when decisions D1–D12 (`OPEN_CATS_2_PRODUCT_DIRECTION.md` §9) are taken.
