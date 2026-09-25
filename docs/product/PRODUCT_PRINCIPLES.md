# OpenCATS 2.0 — Product Principles (proposed)

**Status:** PROPOSED. Derived from Phase 0 findings (`docs/audit/`) and Phase 2 market evidence (`docs/competitive/`). Each principle states the evidence behind it, what it means in practice, and the anti-patterns it rules out. Principles are **[RECOMMENDATION]**s; the evidence rows carry their own grades.

---

### 1. Trust is a feature, and it is free
- **Evidence:** OpenCATS's critical Phase 0 findings were security, privacy and data integrity (`EXECUTIVE_SUMMARY.md` §3) [FACT]; the market's most consistent paywall is governance (SCIM, custom roles, audit, approvals) and SSO is contested (`PRICING_AND_PACKAGING.md` §6.3) [SOURCE CLAIM].
- **In practice:** SSO, MFA, RBAC, audit log, privacy lifecycle and accessibility ship in the open core; security defaults are on; no feature is "safe only on the paid tier".
- **Rules out:** SSO tax; audit log "on request"; security features as upsell.

### 2. Humans decide; software proposes and explains
- **Evidence:** regulatory direction (EU Annex III from 2 Dec 2027; NYC LL 144; IL HB 3773; *Mobley v. Workday*) [SOURCE CLAIM]; vendors' stated human-in-the-loop designs and reasoning fields (Greenhouse `match_score_reasoning`) [FACT] (`AI_RECRUITING_LANDSCAPE.md`).
- **In practice:** automation and AI are advisory; stage changes and dispositions are human actions with reasons; every AI output stores its rationale and inputs (redacted) in the audit trail; AI is off by default and per-feature.
- **Rules out:** auto-reject by score; opaque single fit scores; emotion/face inference.

### 3. History is immutable
- **Evidence:** OpenCATS reports are computed from mutable, deletable status-history rows (FEAT-008, DB-013) and merges corrupt other entities (DB-001) [FACT]; enterprise suites keep application snapshots and field-level audit (SAP) [SOURCE CLAIM].
- **In practice:** application stage transitions, dispositions and key edits are append-only events; deletes are soft with retention rules; merges are transactional, typed and reviewable; reports are reproducible from events.
- **Rules out:** hard deletes that rewrite KPIs; history tables anyone can edit.

### 4. Configuration, not customisation-by-consultant
- **Evidence:** suites' business-process engines and configuration packages require implementers (`COMPETITOR_RESEARCH.md` Part C lessons) [SOURCE CLAIM + INFERENCE]; OpenCATS configures statuses and ACLs only by editing PHP (`FEATURE_INVENTORY.md` FEAT-001) [FACT].
- **In practice:** opinionated workflow templates with typed stage categories, stage actions, approval policies and apply-form schemas — all editable in the admin UI, versioned and exportable.
- **Rules out:** a generic BPM engine as the only way to express a process; XML/template files as admin UX.

### 5. The API is the product boundary
- **Evidence:** OpenCATS has no API (API-001) [FACT]; market APIs are central to integrations and now to agents (MCP) [FACT/SOURCE CLAIM]; API sprawl is a documented complexity (Greenhouse ~8 APIs) [FACT].
- **In practice:** one versioned REST API (OpenAPI) with scoped credentials; the UI uses the same API; every state change emits a signed webhook with retries; MCP is a thin, scope-gated layer on top.
- **Rules out:** UI-only features; API keys gated by account managers; all-access keys; eval-string plug-ins.

### 6. One person, many applications
- **Evidence:** Person ≠ application in Lever, Gem, Greenhouse prospects [FACT/SOURCE CLAIM]; OpenCATS lacks CRM semantics (GAP-018) [FACT].
- **In practice:** a single person record with contact points, consent state and pool memberships; applications (and agency submittals/placements) hang off it.
- **Rules out:** separate CRM and ATS silos; duplicate records per job.

### 7. Rejection is a decision with a reason, delivered humanely
- **Evidence:** disqualify-with-reason patterns (Workable, Recruitee), delayed rejection visibility (Teamtailor) [SOURCE CLAIM/FACT]; OpenCATS rejections are statuses with no reasons (GAP-021) [FACT].
- **In practice:** disposition separate from stage; required reason codes; templates; scheduled send; undo; reasons feed EEO and analytics.

### 8. Accessible and localised from the first screen
- **Evidence:** OpenCATS has 0 ARIA, contrast down to 1.37:1, English-only, integer GMT offsets (UX-005, UX-009, UX-015) [FACT]; WCAG 2.2 criteria for drag alternatives, target size, accessible authentication [FACT, W3C source].
- **In practice:** WCAG 2.2 AA is a release gate; every drag interaction has a menu alternative; ICU messages; UTC storage with IANA zones; locale on content objects.

### 9. Your data leaves when you say so
- **Evidence:** OpenCATS silently sent resumes to a defunct third party and phoned home with the licence key (RISK-005, FEAT-012) [FACT]; vendors rarely state AI training policies (AI §2 #13) [UNKNOWN/INFERENCE].
- **In practice:** no telemetry or outbound calls by default; every external processor is explicit, configurable and logged; bring-your-own AI provider incl. local models; no training on customer data; complete export at any time.
- **Rules out:** phone-home, licence keys, silent third-party processing.

### 10. Correctness over cleverness in bulk
- **Evidence:** OpenCATS bulk selection silently drops (UX-002) [FACT]; market bulk actions sometimes lack undo (Greenhouse) [SOURCE CLAIM].
- **In practice:** bulk operations run as audited jobs with preview, progress, partial-failure reporting and undo where semantically possible.

### 11. Serve the agency and the in-house team with one model
- **Evidence:** OpenCATS's agency heritage [FACT]; Bullhorn's revenue model (placements, sendouts) [FACT]; corporate structured-hiring patterns (scorecards, approvals) [FACT/SOURCE CLAIM].
- **In practice:** one workflow engine and approval engine; agency objects (client, submittal, placement, client portal) are a layer on the shared core, not a fork.

### 12. Integrate before you build
- **Evidence:** categories being absorbed or commoditised (scheduling infrastructure, interview intelligence, assessments, background checks, programmatic ads) (`MARKET_OVERVIEW.md` §5) [INFERENCE].
- **In practice:** typed connector contracts (calendar, e-sign, assessment, background check, HRIS, job boards, AI providers) with provider abstraction and fallback; build natively only where it is core to the workflow.

### 13. Show the next action
- **Evidence:** role-aware home queues and stage-triggered actions across Greenhouse, Workable, Teamtailor, Ashby (`MODERN_ATS_UX_PATTERNS.md` #1, #5) [SOURCE CLAIM]; OpenCATS home is six fixed widgets (FEATURE_INVENTORY §2.1) [FACT].
- **In practice:** each role lands on what needs their action (reviews, feedback, approvals, interviews, overdue candidates); empty, loading and error states always offer a next step.

### 14. Openness is verifiable, not rhetorical
- **In practice:** public packaging boundary; published ACR; security documentation; reproducible builds and signed releases; changelog and ADRs in the repo; community-visible roadmap.
- **Rules out:** undocumented paid gates; "open" repos that lag the product.
