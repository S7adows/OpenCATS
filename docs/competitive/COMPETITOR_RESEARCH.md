# Competitor Research — ATS Market 2026 (Phase 2)

**Scope.** Product-level research on 15 recruiting products: the 11 requested (Greenhouse, Lever, Ashby, SmartRecruiters, Workable, iCIMS, Workday Recruiting, SAP SuccessFactors Recruiting, Oracle Recruiting, Jobvite, Recruitee) plus 4 additional products chosen on evidence (Bullhorn, Loxo, Teamtailor, Gem — see Part D "Selection rationale"). Each product is documented with the same template: snapshot, workflows, UX, platform, business, independent perspective, lessons for OpenCATS 2.0, sources. **No product is ranked; this is a factual comparison of documented differences.** Cross-market synthesis lives in `MARKET_OVERVIEW.md`, `MODERN_ATS_UX_PATTERNS.md`, `COMPETITIVE_GAP_ANALYSIS.md` and `PRODUCT_OPPORTUNITIES.md`.

**Date / access date for all citations:** 2026-09-25.

---

## Method and evidence grades (applies to all parts)

**How the research was done.** Four parallel research passes (Parts A–D) using web search, reading of official vendor repositories on GitHub (e.g. `grnhse/greenhouse-api-docs`, `lever/postings-api`, `bullhorn/sdk-rest`, `bullhorn/career-portal`, Teamtailor partner docs), and the OpenCATS Phase 0 audit (`docs/audit/`) as baseline.

**Environment constraints that shape the evidence (FACT, observed in this session):**
1. The cloud environment's egress policy **blocked direct access to vendor websites, help centers, review aggregators and most press sites** (e.g. `www.greenhouse.com` → `EGRESS_BLOCKED`). No archive, reader or proxy service was used to route around the block.
2. **github.com was reachable**, so official vendor repositories were read first-hand.
3. A **shared web-search budget (200 calls) was exhausted** part-way through the research; coverage is therefore uneven (see coverage table).

**Evidence grades (used throughout):**

| Grade | Meaning | Strength |
|---|---|---|
| **[FACT]** | Read directly: the OpenCATS repo (file:line), an official vendor/standards repository on github.com at a pinned commit, or a page actually fetched | Strongest |
| **[SOURCE CLAIM · vendor/independent · search excerpt]** | Text seen only as a web-search result excerpt from the cited domain; the page itself was not opened | Needs browser verification |
| **[SOURCE CLAIM · vendor text · third-party GitHub copy]** | Vendor-authored text (blog/status/docs index/OpenAPI) read in full but from a *third-party* dataset on GitHub (API Evangelist, Konfig, Jentic) — not from the vendor | Below vendor excerpt; lead-grade; needs verification. Part B relied on these heavily for Workable/Recruitee/Jobvite (≈160 claims), Part A for Ashby/Lever (≈60); they are individually labelled and can be isolated with `grep "third-party GitHub copy"` |
| **[INFERENCE] / [RECOMMENDATION] / [UNKNOWN]** | Reasoning / proposal for OpenCATS / not verifiable in this session | — |

> **Verification status.** Every claim graded "search excerpt" or "third-party GitHub copy" must be verified in a browser against the live vendor page before this document is published externally. Search summaries produced two verifiable errors that were caught (a mis-dated Greenhouse acquisition; an unrelated company's funding round attributed to Ashby). **Pricing is reported only where a source showed a figure.**

### Coverage depth by product

| Product | Part | Depth | Main evidence base | Largest gaps |
|---|---|---|---|---|
| Greenhouse | A | **Deep** | Official API docs repo (FACT) + vendor excerpts | Help-center UI details, independent reviews |
| Lever | A | Medium | Official Postings API repo (FACT) + excerpts + third-party copies | UX detail, reviews |
| Ashby | A | Medium | Third-party copies of official docs index/OpenAPI + excerpts | UX detail, reviews, pricing figures |
| SmartRecruiters | B | **Deep** | Vendor/SAP excerpts + third-party copies of API specs | Pricing, accessibility |
| Workable | B | Thin–medium | Third-party copies + official GitHub (candidate MCP) | Workflows, pricing figures |
| Recruitee | B | Thin | Third-party copies + excerpts | Workflows, pricing figures |
| Jobvite | B | Thin | Excerpts + third-party copies + official sample code | Workflows, platform detail |
| iCIMS | C | Medium–deep | Vendor excerpts + developer-portal excerpts | Approval config, VPAT, SSO/SCIM |
| Workday Recruiting | C | Medium–deep | SEC-filing/newsroom excerpts + public docs excerpts | Implementation specifics |
| SAP SuccessFactors Recruiting | C | Medium–deep | SAP Help/News excerpts | Data-retention specifics, end-of-maintenance date |
| Oracle Recruiting | C | Medium–deep | Oracle Help Center excerpts | Pricing figure, ACR |
| Bullhorn | D | **Deep (data model)** | Official SDK + MIT career portal repos (FACT) | Ownership, AI product, client portal |
| Loxo | D | Thin | Vendor excerpts + third-party code | Placements/billing, pricing |
| Teamtailor | D | Medium | Official partner docs repo (FACT) | Pricing, scheduling, offers |
| Gem | D | Thin–medium | Vendor excerpts + third-party integration code | Offers, requisitions, webhooks |

---

## At a glance (no ranking)

| Product | Ownership (2026) | Segment / buyer | Recruiting model | Distinctive documented emphasis | Public pricing? |
|---|---|---|---|---|---|
| **Greenhouse** | Greenhouse Software; TPG majority since 2021 [SOURCE CLAIM · independent · search excerpt] | Mid-market → enterprise corporate TA | Structured hiring | Interview plans → kits → scorecards; typed approval flows (job/offer); signed webhooks; audit-log API; AI "to strengthen structured hiring" incl. `match_score_reasoning`, AI disclaimer/opt-out fields; Ezra voice-AI acquisition (2026) | No (quote; Core/Plus/Pro) |
| **Lever** | Employ Inc. (with Jobvite, JazzHR) | Mid-market corporate TA | ATS + CRM ("LeverTRM") | Person ("contact") separate from Opportunity; requisitions with comp bands; EU instance; nurture campaigns | No |
| **Ashby** | Independent, venture-backed | Growth → enterprise | All-in-one (ATS, CRM, scheduling, analytics) | Openings separate from jobs; job state machine; interviewer pools/load limits; surveys incl. EEOC walled off from webhooks; AI with reasoning; fraud checks | Partial (tier structure; figures not captured) |
| **SmartRecruiters** | SAP (closed 2025-09-11) | Enterprise, high-volume | Corporate TA + hourly | Fixed stage categories + configurable steps with step rules; two-plane RBAC (global + hiring team); generic Approval object; audit incl. reads; Winston AI family | Free tier documented historically; paid not public |
| **Workable** | Unverified (appears independent) | SMB → mid-market | Corporate TA incl. multi-location hourly | "Agentic" positioning; AI agents acting in the ATS timeline; metered AI credits; recruiter + candidate MCP; bundled HR suite | By company size (figures not captured) |
| **Recruitee** | Tellent group | SMB → mid-market | In-house TA | Pipeline templates; public careers API with per-job fields; talent pools reuse pipeline machinery; soft-delete "retrieve deleted" | Tiers + add-ons (figures not captured) |
| **Jobvite** | Employ Inc. | Mid-market → enterprise | Corporate TA, recruitment marketing | Trust/fraud positioning; "Explore" analytics; onboarding hand-off API | No |
| **iCIMS** | Private (Vista Equity + TA Associates) | Enterprise | Corporate TA + frontline | Standalone TA platform positioned against HCM modules; Frontline AI (from Apli acquisition); CXM CRM; agents in Teams; US/EU API endpoints | No |
| **Workday Recruiting** | Workday (public) | Large enterprise on Workday HCM | Position/headcount-driven | Requisitions tied to positions; business-process engine; HiredScore (matching) + Paradox (conversational frontline) acquisitions | No |
| **SAP SuccessFactors Recruiting** | SAP | Large enterprise on SAP HCM | Position-driven | Being replaced by "SmartRecruiters for SAP SuccessFactors"; strong privacy/audit fields (consent, anonymisation, field-level audit) | Price list exists (figures not captured) |
| **Oracle Recruiting** | Oracle | Large enterprise on Oracle HCM | Configurable per requisition | Per-requisition selection process and apply flow; phase → state model; typed partner (assessment/background) contracts | List price per hosted employee (figure not captured) |
| **Bullhorn** | Bullhorn, Inc. (ownership not re-verified) | Staffing / recruitment agencies | Agency (front → back office) | Revenue data model: placements with pay/bill/fee, sendouts, tearsheets, Lead→Opportunity BD pipeline, soft delete + edit history; MIT career portal with JobPosting JSON-LD | Yes (Starter US$99, Core US$165 /user/month; Pro/Max custom) [SOURCE CLAIM · vendor · search excerpt] |
| **Loxo** | Loxo, Inc. | Agencies | Agency ATS + CRM + sourcing | Scoped, password-less client review portal; bundled sourcing data + AI | Free tier; paid figures not captured |
| **Teamtailor** | Teamtailor AB | SMB → mid-market (strong in Europe) | Employer-brand-led in-house TA | Per-job apply configuration; two-level consent; delayed rejection visibility; stage-bound integrations; regional data stacks | Undetermined |
| **Gem** | Gem (venture-backed) | Mid-market → enterprise | CRM/sourcing-first, now all-in-one | One person record across CRM projects and ATS applications; narrow named AI agents (sourcing, review with reasoning, fraud) | No |

---

## Cross-competitor observations (summary)

1. **[INFERENCE] The data model converges.** Across Greenhouse, Lever, Ashby, SmartRecruiters, Workday, SAP and Oracle the recurring shape is: *Person/Candidate* ≠ *Application*; *Requisition/Job* with separate *Openings/headcount*; *Workflow template → stages (with categories) → steps/sub-states with actions*; *Interview* linked to *Scorecard*; *Offer* with versioned terms; one generic *Approval* object; *Disposition (reason)* separate from stage; *Consent/anonymisation* fields; *audit events*. OpenCATS 0.9.x has only Candidate, JobOrder, pipeline row with 11 fixed statuses, and a mutable history table (`docs/audit/FEATURE_INVENTORY.md` FEAT-001/008).
2. **[INFERENCE] Enterprise governance is exposed as API objects** (approvals, audit incl. reads, consent, signed webhooks, scoped keys, on-behalf-of attribution) — Greenhouse, SmartRecruiters, Ashby, Workday, iCIMS.
3. **[SOURCE CLAIM · vendor · search excerpt/sibling] AI is sold as narrow, explainable agents** (screen, match with reasoning, schedule, interview, fraud) with stated human-in-the-loop; AI outputs appear as governed, anonymisable fields (Greenhouse `match_score_reasoning` [FACT]).
4. **[INFERENCE] Suites won enterprise on governance but carry implementation friction** (business-process engines, consultants, configuration packages); SAP replaced its own recruiting module with an acquisition.
5. **[FACT] Agency products model money, not just status** (Bullhorn Placement: pay/bill/fee/commission; Sendout with read tracking).

---

# Part A — Greenhouse, Lever, Ashby


### Method (batch A: Greenhouse, Lever, Ashby)

- **Network constraint.** The environment's egress policy blocked every vendor and review site tried with `WebFetch`: greenhouse.com, support.greenhouse.io, developers.greenhouse.io, help.lever.co, ashbyhq.com, developers.ashbyhq.com, g2.com, wikipedia.org and prnewswire.com. One attempt at web.archive.org, made before the lead's addendum, was also blocked; it was not retried and no reader/proxy services were used. The shared `WebSearch` budget (200 calls) ran out part-way through this assignment: about 20 successful searches were used for this batch, mostly on Greenhouse.
- **Evidence grades used in this file** (per PREAMBLE addendum):
  - **[FACT]**: read directly. Here that means official vendor repositories on github.com: `grnhse/greenhouse-api-docs` (the source of developers.greenhouse.io; commit `271cd88`, 2026-09-10), `lever/postings-api` (`f61aac5`, 2026-04-23) and `lever/integrator-resources` (`c74d96e`, 2025-02-27). Also our own repo.
  - **[SOURCE CLAIM · vendor · search excerpt]**: official vendor pages (help center, newsroom, blog) seen only as WebSearch result excerpts. The vendor URL is cited.
  - **[SOURCE CLAIM · independent · search excerpt]**: independent press, analysts or aggregators seen only as WebSearch excerpts. "(weak/lead)" marks SEO, "vs" and competitor blogs, which are used only as leads.
  - **[SOURCE CLAIM · vendor text · third-party GitHub copy]**: vendor-authored text read in full, but from a **third-party dataset hosted on github.com**, not from the vendor. These are the API Evangelist catalogue (`api-evangelist/ashby`, `/lever`, `/greenhouse`), whose harvest of Ashby's developer-docs `llms.txt` index and of Ashby/Lever status-page and blog feeds was used, and Konfig's copy of Ashby's OpenAPI spec (`konfig-sdks/openapi-examples`). These were read via `git clone` of github.com, which is allowed; no blocked host was contacted. Because they are copies, they are graded below FACT.
  - **[SOURCE CLAIM · third-party GitHub dataset (probe/generated)]**: third-party artefacts that are machine-probed or machine-generated rather than transcribed. These are weak.
  - Also used: **[INFERENCE]**, **[RECOMMENDATION]**, **[UNKNOWN]**.
- **Verification status.** Every claim graded "search excerpt" or "third-party GitHub copy" **needs browser verification against the live vendor page before external publication.** Search summaries made verifiable errors twice in this batch. One dated Greenhouse's 2021 Interseller acquisition to "February 2026". Another attributed an unrelated company's "Series A, January 2026" to Ashby. Both were caught and corrected or excluded.
- **Coverage.** The Greenhouse section is deep. **Lever and Ashby have large, explicitly marked [UNKNOWN] areas** for help-center-level UX (dialogs, dashboards, bulk actions) and for independent review data (G2, Capterra, TrustRadius), because those pages could not be reached and the search budget was exhausted. A follow-up pass with page access or search budget is recommended.

---

## Greenhouse (Greenhouse Software, Inc.; majority-owned by TPG since 2021)

### 1. Snapshot

- **Vendor and ownership.** Greenhouse Software, Inc. was founded in 2012 by Daniel Chait and Jon Stross and is headquartered in New York City ([G40](https://en.wikipedia.org/wiki/Greenhouse_Software), accessed 2026-09-25). **[SOURCE CLAIM · independent · search excerpt]**
  - In January 2021, TPG Growth and The Rise Fund made a "major investment" that gave TPG a majority stake ([G37](https://www.tpg.com/news-and-insights/tpg-growth-and-rise-fund-make-major-investment-greenhouse), [G38](https://www.businesswire.com/news/home/20210114005773/en/TPG-Growth-and-The-Rise-Fund-Make-Major-Investment-in-Greenhouse-Software), [G39](https://www.alleywatch.com/2021/01/greenhouse-job-recruitment-platform-acquired-tpg-growth/), accessed 2026-09-25). **[SOURCE CLAIM · vendor/investor + independent · search excerpt]**
  - Reported deal size: about $500M in total, including a secondary purchase of existing shares ([G40](https://en.wikipedia.org/wiki/Greenhouse_Software), accessed 2026-09-25). **[SOURCE CLAIM · independent · search excerpt]**
  - No 2025–2026 change of control was found. **[INFERENCE]** (Absence of evidence within a limited search, not proof.)
- **2025–2026 corporate events.**
  - Greenhouse announced a definitive agreement to acquire **Ezra AI Labs**, a voice-AI interviewer, on 2026-05-05 and completed the deal on 2026-05-27. Ezra's founder became Head of Voice AI ([G29](https://www.greenhouse.com/newsroom/greenhouse-has-entered-into-a-definitive-agreement-to-acquire-ezra-ai-labs), [G30](https://www.greenhouse.com/newsroom/greenhouse-completes-acquisition-of-ezra-ai-labs-bringing-conversational-ai-to-the-hiring-process), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** The deal is corroborated by counsel's deal note ([G31](https://www.wsgr.com/en/insights/firm-advises-greenhouse-on-acquisition-of-ezra-ai-labs.html)) and HR Brew ([G32](https://www.hr-brew.com/stories/2026/05/05/greenhouse-sets-sights-on-ai-interviewing-as-next-ta-game-changer), accessed 2026-09-25). **[SOURCE CLAIM · independent · search excerpt]**
  - The earlier **Interseller** acquisition, which added sourcing automation to the CRM, dates from **October 2021**, not 2026 ([G41](https://www.prnewswire.com/news-releases/greenhouse-buys-interseller-to-add-sourcing-to-the-greenhouse-crm-301411248.html), [G42](https://www.interseller.io/interseller-joins-greenhouse), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]**
  - A **CLEAR** partnership (2025-06-12) brought biometric and government-ID identity verification into "Greenhouse Real Talent". Candidates verify with a selfie in their MyGreenhouse profile, with rollout to select customers from Q3 2025 ([G33](https://www.greenhouse.com/newsroom/greenhouse-and-clear-announce-partnership-to-enable-candidate-verification), [G34](https://ir.clearme.com/news-events/press-releases/detail/151/clear-and-greenhouse-announce-partnership-to-enable), [G35](https://www.greenhouse.com/blog/introducing-greenhouse-real-talent), accessed 2026-09-25). **[SOURCE CLAIM · vendor + partner · search excerpt]**
- **Scale.** "7,500+ companies" appeared in a search summary whose underlying page could not be identified. **[SOURCE CLAIM · unattributed · search excerpt; unverified]** Employee count: **[UNKNOWN]**.
- **Positioning.** Greenhouse frames its AI as "built to strengthen structured hiring, not shortcut it" ([G15](https://www.greenhouse.com/newsroom/greenhouse-launches-new-ai-capabilities-built-to-strengthen-structured-hiring-not-shortcut-it), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Its 2026 AI Principles make "structured hiring" the governing system for AI ([G22](https://www.greenhouse.com/newsroom/greenhouse-launches-ai-principles-framework-setting-the-standard-for-responsible-hiring-in-the-ai-era), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]**
- **Target customer and model.** Greenhouse targets corporate talent-acquisition teams: its data model centres on jobs, hiring teams (hiring managers, recruiters, coordinators, sourcers), interview plans, scorecards, approvals and offers ([G14](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_jobs.md), accessed 2026-09-25). **[FACT]** Plan names published in 2026 describe adding "teams, locations, or brands", which suggests mid-market to enterprise ([G78](https://github.com/api-evangelist/greenhouse/blob/main/plans/greenhouse-plans-pricing.yml), accessed 2026-09-25). **[INFERENCE]** No agency-specific objects (clients, placements, billing) appear in the Harvest API object list ([G1](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/harvest.html.md), accessed 2026-09-25). **[FACT]**
- **Suite composition.** Greenhouse Recruiting (ATS with a built-in CRM for prospects, pools and campaigns), scheduling, Greenhouse Onboarding (with its own API and webhooks), an Assessment partner framework, an Audit Log API, the Real Talent identity and fraud layer, AI features, and an MCP server ([G13](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/index.html.md) **[FACT]**; [G18](https://www.greenhouse.com/newsroom/greenhouse-launches-mcp-giving-hiring-teams-a-governed-way-to-connect-ai-tools-to-greenhouse) **[SOURCE CLAIM · vendor · search excerpt]**; accessed 2026-09-25).

### 2. Workflows

| Workflow | What exists and how it works | Who acts | Effort-reducers | Documented friction / limits |
|---|---|---|---|---|
| **Requisition and job creation** | 1) "+" in the navigation bar, then **Create a Job**. 2) Choose **copy an existing job, a sample job, or a blank job**; orgs can restrict users to templates only. 3) Walk the **job setup flow**, whose steps admins configure; it can include an **Interview Plan** step ([G47](https://support.greenhouse.io/hc/en-us/articles/200668380-Create-a-new-job), [G48](https://support.greenhouse.io/hc/en-us/articles/360038222812-Creating-and-using-template-jobs), [G49](https://support.greenhouse.io/hc/en-us/articles/204923599-Configure-the-new-job-setup-flow), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Jobs carry **openings** (open/closed, with close reasons), a `confidential` flag and a hiring team ([G14](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_jobs.md); `_job_openings.md`; accessed 2026-09-25). **[FACT]** A **job kickoff form** aligns recruiter and hiring manager on scorecard and interview plan ([G50](https://support.greenhouse.io/hc/en-us/articles/4416516361499-Job-kickoff-form-setup), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** | Recruiter / job admin; site admin configures | Template jobs; a "Job Kickoff Agent" (AI) announced for Q3 2026 to structure setup materials ([G15](https://www.greenhouse.com/newsroom/greenhouse-launches-new-ai-capabilities-built-to-strengthen-structured-hiring-not-shortcut-it), accessed 2026-09-25) **[SOURCE CLAIM · vendor · search excerpt]** | Dependent custom fields may give "inconsistent results" through the older Harvest API; the docs point to **Harvest V3** ([G14](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_jobs.md), accessed 2026-09-25) **[FACT]** |
| **Job approval** | 1) Configure (gear icon), then **Approvals**. 2) **Add Approval Step**. 3) Add approvers; only users with specific "approve jobs/offers" permissions are eligible. 4) Set a quorum such as "1 of 2" ([G45](https://support.greenhouse.io/hc/en-us/articles/360062257351-Configure-approvals), [G43](https://support.greenhouse.io/hc/en-us/articles/360025776391-Configure-two-stage-job-approvals), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Decision point: a **one-stage** flow (approve to open for recruiting) or a **two-stage** flow that adds approval to make offers ([G44](https://support.greenhouse.io/hc/en-us/articles/360025756071-One-stage-versus-two-stage-job-approvals), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** The API models approval flows with `approval_type` ∈ {`open_job`, `offer_job`, `offer_candidate`}, a `sequential` flag, versioned flows and ordered **approver groups** with `approvals_required` ([G2](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_approvals.md), accessed 2026-09-25). **[FACT]** Approvals can be combined with an HRIS ([G46](https://support.greenhouse.io/hc/en-us/articles/4405333836955-Use-approvals-in-Greenhouse-Recruiting-with-an-HRIS), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** | Requester (recruiter); approvers (finance/HR/executives); site admin configures | Default flows with per-job override; API to replace an approver in a group or re-create flows ([G2](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_approvals.md)) **[FACT]** | Approver eligibility depends on fine-grained permission strips, which is admin complexity ([G43](https://support.greenhouse.io/hc/en-us/articles/360025776391-Configure-two-stage-job-approvals), accessed 2026-09-25) **[INFERENCE]** |
| **Publishing and distribution** | Hosted job board plus the **Job Board API**. Public GETs need no authentication and support JSONP; the application POST needs a Base64 Basic-auth key ([G11](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/job-board/_introduction.md), accessed 2026-09-25). **[FACT]** Free distribution: **Indeed** is enabled per job post and appears within 48 hours; **LinkedIn Limited Listings** is enabled at org level. **LinkedIn Apply Connect** lets candidates apply without leaving LinkedIn ([G52](https://support.greenhouse.io/hc/en-us/articles/206285655-LinkedIn-Limited-Listings), [G53](https://support.greenhouse.io/hc/en-us/articles/360043197972-Remote-job-posts-on-Indeed-and-LinkedIn-Limited-Listings), [G54](https://support.greenhouse.io/hc/en-us/articles/17073067102747-LinkedIn-Apply-Connect-integration), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** | Recruiter | Automatic free-board syndication; tracking links per source ([G1](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/harvest.html.md), `tracking_links`) **[FACT]** | Paid LinkedIn ads need manually created unique URLs for source tracking ([G55](https://support.greenhouse.io/hc/en-us/articles/115003795152-Use-LinkedIn-with-Greenhouse-Recruiting), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Paid multiposting catalogue: **[UNKNOWN]** |
| **Sourcing** | CRM prospects (candidates who have not applied) organised in **prospect pools and pool stages**; **engage** campaigns (short, for current openings) and **nurture** campaigns (ongoing, lower cadence); **Sourcing Automation**, which needs a per-seat licence ([G73](https://support.greenhouse.io/hc/en-us/articles/360022793612-CRM-overview), [G74](https://support.greenhouse.io/hc/en-us/articles/360024904051-Prospect-pools-and-stages), [G75](https://support.greenhouse.io/hc/en-us/articles/5045604930843-Create-and-manage-campaign-pools), [G76](https://support.greenhouse.io/hc/en-us/articles/5224485120411-Sourcing-Automation-FAQ), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Sourcing partners push prospects through the **Ingestion API** using OAuth 2.0 or Basic auth plus `On-Behalf-Of` ([G10](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/candidate-ingestion/_introduction.md), accessed 2026-09-25). **[FACT]** | Sourcer / recruiter | Partner ingestion; pools with stages | Sourcing Automation is a separately seated add-on **[SOURCE CLAIM · vendor · search excerpt]** |
| **Intake / application** | Hosted board or a custom form through the Job Board API. The apply payload supports GDPR consent split into **processing**, **retention** and **demographic-data** consent; job posts can expose a `retention_period`, **pay ranges** (`pay_input_ranges`) and **demographic questions** ([G11](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/job-board/_jobs.md), `job-board/_applications.md` L37-45, accessed 2026-09-25). **[FACT]** | Candidate | LinkedIn Apply Connect **[SOURCE CLAIM · vendor · search excerpt]** | Apply-flow length and field count: **[UNKNOWN]** |
| **Screening** | **Talent Matching** (AI): recruiters define calibration criteria. AI compares each resume against them and sorts candidates into **Strong / Good / Partial / Limited / Needs manual review**, with resume highlights and matched criteria. Candidates whose resumes cannot be read, or **who opted out of AI-assisted review**, go to "Needs manual review". The feature "does not automatically disposition any candidates" ([G25](https://support.greenhouse.io/hc/en-us/articles/41131886674075-Talent-Matching-FAQ), [G26](https://support.greenhouse.io/hc/en-us/articles/41131616864283-Talent-Matching-Data-Processing-FAQ), [G27](https://support.greenhouse.io/hc/en-us/articles/44682413339675-Operational-readiness-guide-Talent-Matching-policy), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Viewing scores and managing calibrations is a separate permission ([G28](https://support.greenhouse.io/hc/en-us/articles/41396009937307-Talent-Matching), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Other screening: the Assessment Partner API for test vendors ([G12](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/assessment/_introduction.md)) **[FACT]**; **auto-reject** ([G72](https://support.greenhouse.io/hc/en-us/articles/360000653472-Auto-reject), accessed 2026-09-25) **[SOURCE CLAIM · vendor · search excerpt]**; identity verification through CLEAR ([G33](https://www.greenhouse.com/newsroom/greenhouse-and-clear-announce-partnership-to-enable-candidate-verification)) **[SOURCE CLAIM · vendor · search excerpt]**; the Ezra voice-AI first-round interviewer (post-acquisition integration status **[UNKNOWN]**). | Recruiter; admin sets policy | Categorical AI buckets instead of a composite rank | Knockout-question configuration details: **[UNKNOWN]** (the auto-reject article exists but its content was not verified) |
| **Pipeline progression** | Applications move through job stages. The API exposes **advance** (next stage), **move** (same job, any stage), **move to a different job**, **hire**, **reject/unreject**, and **convert prospect to candidate** ([G7](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_applications.md), accessed 2026-09-25). **[FACT]** A "Candidate stage change" webhook exists ([G8](https://github.com/grnhse/greenhouse-api-docs/tree/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/webhooks)). **[FACT]** | Recruiter / coordinator / job admin | — | Options in the "Move stage" dialog and stage-triggered automations: **[UNKNOWN]** (not verified this pass) |
| **Interview scheduling** | Three modes. **Manual scheduling**. **Availability request**: the candidate offers several times and the team then coordinates. **Candidate self-scheduling**: the candidate picks a **single** slot from interviewer free/busy, **at least 24 hours ahead**; the interview is then scheduled and sent to everyone automatically ([G56](https://support.greenhouse.io/hc/en-us/articles/36307427046555-Scheduling-overview), [G57](https://support.greenhouse.io/hc/en-us/articles/4409534663579-Candidate-self-scheduling-overview), [G58](https://support.greenhouse.io/hc/en-us/articles/13301025470875-Request-candidate-availability), accessed 2026-09-25). Google Calendar / Outlook 365, with automatic Meet/Zoom/Teams links. **Automated scheduling** proposes times from candidate and interviewer availability and the plan's default interviewers. 2025–2026 additions: automatic pre/post **buffers**, **auto-replacement** of an interviewer who declines (from the same interviewer group), and **load balancing**, "for Core, Plus and Pro" ([G59](https://www.greenhouse.com/blog/all-your-interview-scheduling-needs-covered-see-whats-new-in-greenhouse), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** | Coordinator; candidate; interviewers | Self-schedule, buffers, auto-swap, load balance | Self-scheduling offers only a single slot per request (a design constraint) **[SOURCE CLAIM · vendor · search excerpt]**. Third parties (GoodTime, ModernLoop) sell Greenhouse scheduling add-ons, which suggests historic gaps **[SOURCE CLAIM · independent (weak/lead) · search excerpt]** |
| **Scorecards / interview kits** | Each job has a **scorecard** of attributes, and each interview has a **kit** with focus attributes and questions. **Focus attributes** appear at the top of each interviewer's scorecard (path: Job Dashboard > Job Setup > Scorecard) ([G51](https://support.greenhouse.io/hc/en-us/articles/115002226746-VIDEO-Creating-Interview-Kits), [G61](https://support.greenhouse.io/hc/en-us/articles/360018399451-Assign-or-edit-focus-attributes-on-a-scorecard), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Scorecards record per-attribute ratings and an `overall_recommendation` ∈ {`definitely_not`, `no`, `yes`, `strong_yes`, `no_decision`}. `submitted_by` can differ from `interviewer` (submission on someone's behalf) ([G4](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_scorecards.md) L129, accessed 2026-09-25). **[FACT]** Reminders go out automatically **1 hour after** an interview and can also be sent manually ([G62](https://support.greenhouse.io/hc/en-us/articles/360027281232-Send-scorecard-reminder-notification-manually), [G63](https://www.greenhouse.com/guidance/tips-for-improving-interview-scorecard-submission-rate), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** **Greenhouse Notetaker** (announced for mid-July 2026) records, transcribes and maps notes to scorecard questions ([G15](https://www.greenhouse.com/newsroom/greenhouse-launches-new-ai-capabilities-built-to-strengthen-structured-hiring-not-shortcut-it), [G17](https://hrtechedge.com/ai-in-hr/greenhouse-unveils-ai-hiring-agents-and-interview-intelligence-as-candidate-volume-surges-412/), accessed 2026-09-25). **[SOURCE CLAIM · vendor + independent · search excerpt]** | Interviewers; hiring manager | Focus attributes cut interviewer load; AI notes mapped to the scorecard | Whether feedback is blind until submitted: **[UNKNOWN]** |
| **Debrief / decision** | Candidate Insights Agent (Q3 2026) will compile source-linked candidate information ([G15](https://www.greenhouse.com/newsroom/greenhouse-launches-new-ai-capabilities-built-to-strengthen-structured-hiring-not-shortcut-it), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** | Hiring team | — | Debrief/decision UI: **[UNKNOWN]** |
| **Offers** | 1) **Create Offer**. 2) Enter details. 3) **Request offer approval** if required. 4) Save. 5) Generate the offer document from a **.docx template with tokens** (only .docx is accepted). 6) **Send with Greenhouse** or **Send with DocuSign**; DocuSign status appears on the Offer Details tab ([G65](https://support.greenhouse.io/hc/en-us/articles/200485589-Generate-and-send-offer-document), [G66](https://support.greenhouse.io/hc/en-us/articles/6459061824155-Create-offer-document-template), [G67](https://support.greenhouse.io/hc/en-us/articles/205633569-Docusign-integration), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Offers are **versioned** (status `unresolved/accepted/rejected/deprecated`), linked to an opening, and carry custom fields; an "Offer approved" webhook exists ([G3](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_offers.md) L89, [G8](https://github.com/grnhse/greenhouse-api-docs/tree/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/webhooks), accessed 2026-09-25). **[FACT]** | Recruiter; approvers; candidate | Tokenised templates; e-signature | Native e-signature beyond "Send with Greenhouse": **[UNKNOWN]** |
| **Hire / hand-off** | The Hire endpoint takes `start_date`, `opening_id` and `close_reason_id`; a hired application "no longer has a current stage" ([G7](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_applications.md) L1303-1436, accessed 2026-09-25). **[FACT]** "Candidate hired" webhook; Onboarding webhooks and API exist ([G8](https://github.com/grnhse/greenhouse-api-docs/tree/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/webhooks), [G13](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/index.html.md)). **[FACT]** HRIS Link for Workday is referenced in the help center ([G48](https://support.greenhouse.io/hc/en-us/articles/360038222812-Creating-and-using-template-jobs), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** | Recruiter; HR ops | Openings closed automatically on hire | — |
| **Rejection** | From the Job Dashboard or the profile: 1) choose a **rejection reason**; 2) optionally **schedule** a rejection email; 3) optionally tick **"Start new prospect process after rejection"**, which moves the candidate into a CRM pool. **Bulk reject** asks for confirmation above **30** selections ([G68](https://support.greenhouse.io/hc/en-us/articles/360025225732-Reject-a-candidate), [G69](https://support.greenhouse.io/hc/en-us/articles/360025552011-Reject-candidates-or-prospects-in-bulk), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** The API reject call accepts `rejection_reason_id`, notes, and an email with an organisation-wide template and `send_email_at`, scheduled in the acting user's time zone ([G7](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_applications.md) L1586-1594). **[FACT]** A rejection-reasons report exists ([G71](https://support.greenhouse.io/hc/en-us/articles/203941409-Rejection-reasons-report), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** | Recruiter / job admin | Delayed "kind" rejections; pool hand-off | **You cannot un-reject in bulk.** Fixing a wrong bulk reason means un-rejecting one by one and rejecting again, or using the API ([G70](https://support.greenhouse.io/hc/en-us/articles/115003086026-Changing-the-rejection-reason-for-bulk-rejected-candidates), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** |
| **CRM / nurture** | Prospect pools, pool stages, engage/nurture campaign pools and prospect statuses; an Events app is mentioned ([G73](https://support.greenhouse.io/hc/en-us/articles/360022793612-CRM-overview), [G75](https://support.greenhouse.io/hc/en-us/articles/5045604930843-Create-and-manage-campaign-pools), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** | Sourcer / recruiter | Campaigns | Detailed campaign builder UX: **[UNKNOWN]** |
| **Rediscovery** | **Talent Finder** surfaced past candidates who reached the Offer or Face-to-face milestones on other jobs. For "most customers" it "has been replaced by **Talent Rediscovery**" ([G77](https://support.greenhouse.io/hc/en-us/articles/360022964432-Talent-Finder), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** | Recruiter | Milestone-based rediscovery | How Talent Rediscovery works (AI or not): **[UNKNOWN]** |

### 3. User experience

- **Recruiter home and dashboard.** Talent Matching results show on the recruiter's dashboard ([G25](https://support.greenhouse.io/hc/en-us/articles/41131886674075-Talent-Matching-FAQ), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Per-job "Job Dashboard" and "Job Setup" areas exist, per navigation paths in the help text ([G61](https://support.greenhouse.io/hc/en-us/articles/360018399451-Assign-or-edit-focus-attributes-on-a-scorecard), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Home-page widgets: **[UNKNOWN]**.
- **Hiring manager.** Hiring managers are first-class hiring-team members ([G14](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_jobs.md)). **[FACT]** They take part in the kickoff and the scorecard definition ([G50](https://support.greenhouse.io/hc/en-us/articles/4416516361499-Job-kickoff-form-setup), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Dedicated hiring-manager dashboard: **[UNKNOWN]**.
- **Interviewer.** Interviewers work from interview kits, get a scorecard reminder one hour after the interview, and can submit through the **mobile app** ([G63](https://www.greenhouse.com/guidance/tips-for-improving-interview-scorecard-submission-rate), [G64](https://support.greenhouse.io/hc/en-us/articles/115002226826-Interviewer-guide-How-to-use-interview-kits), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]**
- **Candidate.** Candidates see a hosted board or a custom careers page built on the Job Board API **[FACT]**. They have a **MyGreenhouse** candidate profile, used for CLEAR verification ([G33](https://www.greenhouse.com/newsroom/greenhouse-and-clear-announce-partnership-to-enable-candidate-verification), accessed 2026-09-25) **[SOURCE CLAIM · vendor · search excerpt]**. They can self-schedule, apply via LinkedIn, and opt out of AI-assisted review ([G25](https://support.greenhouse.io/hc/en-us/articles/41131886674075-Talent-Matching-FAQ)). **[SOURCE CLAIM · vendor · search excerpt]** Apply-flow length and a status portal beyond MyGreenhouse: **[UNKNOWN]**.
- **Navigation and information architecture.** Top-level objects are Jobs (with openings, posts, stages, hiring team), Candidates/Prospects (with applications), Offers, Scorecards, Scheduled interviews, Prospect pools, Users, Departments and Offices ([G1](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/harvest.html.md), accessed 2026-09-25). **[FACT]** (This describes the data model, not the menu layout, which is **[UNKNOWN]**.)
- **Search, filters, saved views, bulk actions.** Bulk reject exists, with a confirmation above 30 selections ([G69](https://support.greenhouse.io/hc/en-us/articles/360025552011-Reject-candidates-or-prospects-in-bulk)). **[SOURCE CLAIM · vendor · search excerpt]** The full bulk-action list and saved filters: **[UNKNOWN]**.
- **Profile, timeline, collaboration.** An activity feed, notes, e-mail notes, private notes, and **merge candidates** exist ([G1](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/harvest.html.md) `_activity_feed.md`, `_candidates.md` L1526-1659, L2303, accessed 2026-09-25). **[FACT]** @mentions and notification settings: **[UNKNOWN]**.

### 4. Platform

- **API: eight public APIs.** Harvest, Job Board, Ingestion, Assessment, Audit Log, Onboarding, and two webhook families ([G13](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/index.html.md), accessed 2026-09-25). **[FACT]**
  - **Harvest (v1/v2):** REST/JSON with **Basic auth using an API token**. Permissions can be set **per endpoint for each key** in the Dev Center. Rate limit is the value of the `X-RateLimit-Limit` header per **10 seconds** (the documented example is 50). Writes need an `On-Behalf-Of` user "for auditing purposes". Pagination uses RFC 5988 `Link` headers ([G1](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_introduction.md) L27-L160, accessed 2026-09-25). **[FACT]**
  - **Harvest V3:** separately documented at harvestdocs.greenhouse.io and recommended for dependent custom fields ([G14](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_jobs.md), accessed 2026-09-25). **[FACT]** Its OAuth scopes follow `harvest:<resource>:<action>` via auth.greenhouse.io, which supports PKCE (S256) and dynamic client registration ([G78](https://github.com/api-evangelist/greenhouse/tree/main/scopes), accessed 2026-09-25). **[SOURCE CLAIM · third-party GitHub dataset (probe)]**
- **Webhooks.** HTTPS POST with a `Greenhouse-Event-ID` header and an **HMAC-SHA256 `Signature`** header. Greenhouse pings the URL on save and creates the webhook disabled if the ping fails. Failed deliveries are retried **up to 7 times over 15 hours** ([G8](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/webhooks/_introduction.md) L3-L200, accessed 2026-09-25). **[FACT]** Events:
  - applications: created, updated, deleted
  - offers: created, approved, updated, deleted
  - prospect created
  - candidates: hired, unhired, merged, stage change, rejected, unrejected, updated, deleted, anonymized
  - interviews and scorecards: deleted
  - jobs: created, updated, approved, deleted
  - job posts: created, updated, deleted
  - job stage deleted; department and office deleted **[FACT]**
- **Integrations and marketplace.** Named partner APIs cover sourcing, assessment and HRIS. The marketplace size is **[UNKNOWN]** (not verified).
- **SSO / SCIM / MFA.** **[UNKNOWN]** (not verified this pass; do not assume).
- **RBAC.** Four user types: **Site Admin, Job Admin, Interviewer, Basic**. Permissions are job-based ([G10](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/candidate-ingestion/_introduction.md) L69, accessed 2026-09-25). **[FACT]** Job-level roles `interviewer` and `job_admin` exist, with **"future job permissions"** that grant access to jobs matching criteria ([G5](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_user_roles.md), `_user_permissions.md`, accessed 2026-09-25). **[FACT]** User-specific permission "strips" include approving jobs and offers and seeing salary and private notes ([G43](https://support.greenhouse.io/hc/en-us/articles/360025776391-Configure-two-stage-job-approvals), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** Confidential jobs are supported **[FACT]**.
- **Audit logs.** The Audit Log API covers events from the **prior 30 days**. It uses a 24-hour JWT bearer token minted through Harvest, allows 50 requests per 10 s and 3 paginated requests per 30 s, and must be **enabled by contacting account management** ([G9](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/audit-log/_introduction.md) L2-L71, accessed 2026-09-25). **[FACT]**
- **Customisation.**
  - Custom-field types: short/long text, boolean, single/multi select, **currency, currency_range**, number, number_range, date, url, user ([G8](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/webhooks/_introduction.md), accessed 2026-09-25). **[FACT]**
  - "Custom Fields on the application object are only available to customers with **Enterprise-level** accounts" ([G1](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_introduction.md) L159, accessed 2026-09-25). **[FACT]** (An older tier name in the docs; 2026 tiers are Core/Plus/Pro.)
  - Configurable job setup flow and templates ([G49](https://support.greenhouse.io/hc/en-us/articles/204923599-Configure-the-new-job-setup-flow), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]**
- **Localisation.** Offices and departments hierarchies and currency fields **[FACT]**. UI languages and multi-entity support: **[UNKNOWN]**.
- **Reporting and analytics.** A rejection-reasons report ([G71](https://support.greenhouse.io/hc/en-us/articles/203941409-Rejection-reasons-report)) **[SOURCE CLAIM · vendor · search excerpt]**; the **Analytics Chart Agent** turns plain-text questions into charts ([G15](https://www.greenhouse.com/newsroom/greenhouse-launches-new-ai-capabilities-built-to-strengthen-structured-hiring-not-shortcut-it), accessed 2026-09-25) **[SOURCE CLAIM · vendor · search excerpt]**. Full report catalogue: **[UNKNOWN]**.
- **AI capabilities.**
  - (a) **Talent Matching**: categorical buckets with explanations, never auto-disposition, candidate opt-out routes to manual review; see §2.
  - (b) **Notetaker**; (c) **Job Kickoff Agent**; (d) **Candidate Insights Agent**; (e) **Analytics Chart Agent**. These are the "six features" of June 2026, together with MCP ([G15](https://www.greenhouse.com/newsroom/greenhouse-launches-new-ai-capabilities-built-to-strengthen-structured-hiring-not-shortcut-it), [G16](https://www.prnewswire.com/news-releases/greenhouse-launches-new-ai-capabilities-built-to-strengthen-structured-hiring-not-shortcut-it-302796893.html), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]**
  - (f) **Greenhouse MCP**, announced 2026-05-07 with rollout from June. It offers "permissioned access" for AI tools, with design partners StubHub and Komodo Health ([G18](https://www.greenhouse.com/newsroom/greenhouse-launches-mcp-giving-hiring-teams-a-governed-way-to-connect-ai-tools-to-greenhouse), [G19](https://www.greenhouse.com/product-features/greenhouse-mcp), [G20](https://support.greenhouse.io/hc/en-us/articles/53944054829083-Greenhouse-MCP-security-FAQ), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** A third-party article says it has **36 tools behind scopes that Site Admins enable in the Dev Center**, supports Claude, ChatGPT, Copilot Studio, Glean, Amazon Q and Grok, and was in open beta on Core/Plus/Pro in August 2026 ([G21](https://hirevire.com/articles/greenhouse-mcp), accessed 2026-09-25). **[SOURCE CLAIM · independent (weak/lead) · search excerpt]** The endpoint `mcp.greenhouse.io/mcp` is OAuth-gated (RFC 9728 challenge) per a third-party probe ([G78](https://github.com/api-evangelist/greenhouse/blob/main/mcp/greenhouse-mcp.yml), accessed 2026-09-25). **[SOURCE CLAIM · third-party GitHub dataset (probe)]**
  - (g) **Voice AI interviewing** through Ezra (acquired May 2026).
  - **Governance.** The 2026-04-17 **AI Principles** have five pillars. Greenhouse "does not assign composite scores to rank candidates". Talent Matching gets **independent monthly bias audits by Warden AI across ten protected classes**, with results public. Customer personal data is not used to train models ([G22](https://www.greenhouse.com/newsroom/greenhouse-launches-ai-principles-framework-setting-the-standard-for-responsible-hiring-in-the-ai-era), [G24](https://hrtechedge.com/greenhouse-draws-a-line-on-ai-in-hiring-with-new-principles-framework/), accessed 2026-09-25). **[SOURCE CLAIM · vendor + independent · search excerpt]** Match-score reasoning and identity-verification data are anonymisable fields (Harvest changelog, 2025-09-24) ([G1](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_introduction.md) L179). **[FACT]**
- **Privacy tooling.** Field-level **Anonymize Candidate** takes an enumerated list of about 45 field groups: PII, attachments, scorecards, offers, notes, e-mails, match_score_reasoning, identity_verification and more ([G6](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_candidates.md) L2133-L2300, accessed 2026-09-25). **[FACT]** Granular GDPR consent and retention period on apply **[FACT]** (see §2).
- **Mobile.** Mobile app referenced for scorecards ([G63](https://www.greenhouse.com/guidance/tips-for-improving-interview-scorecard-submission-rate)). **[SOURCE CLAIM · vendor · search excerpt]** Platforms and feature scope: **[UNKNOWN]**.
- **Accessibility (VPAT/ACR, WCAG).** **[UNKNOWN]** (not verified).
- **Security and compliance.** ISO 27001, ISO 27701 and **ISO 42001** (AI management system) are claimed in the AI-principles release ([G22](https://www.greenhouse.com/newsroom/greenhouse-launches-ai-principles-framework-setting-the-standard-for-responsible-hiring-in-the-ai-era), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]** SOC 2 and data residency: **[UNKNOWN]**. Attachments are hosted on AWS S3 behind 7-day signed URLs ([G1](https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_introduction.md) L150-160). **[FACT]**

### 5. Business

- **Pricing.** Quote-based; no public prices were found. **[SOURCE CLAIM · third-party GitHub dataset (generated)]** ([G78](https://github.com/api-evangelist/greenhouse/blob/main/plans/greenhouse-plans-pricing.yml), accessed 2026-09-25). "Pricing not public; quote-based." **[INFERENCE]**
- **Packaging.** Three recruiting tiers, **Core, Plus and Pro**. The same names appear independently in vendor excerpts: scheduling features "for Core, Plus and Pro" ([G59](https://www.greenhouse.com/blog/all-your-interview-scheduling-needs-covered-see-whats-new-in-greenhouse)) and MCP beta on "Core, Plus, and Pro" ([G21](https://hirevire.com/articles/greenhouse-mcp), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt + independent (weak/lead) · search excerpt]**
  - Seat-based add-ons: **Sourcing Automation** ([G76](https://support.greenhouse.io/hc/en-us/articles/5224485120411-Sourcing-Automation-FAQ)) **[SOURCE CLAIM · vendor · search excerpt]**. Audit log requires an account-management request **[FACT]**.
  - Separately sold modules or add-ons: Real Talent/CLEAR and Onboarding (whether each is a separate SKU is **[UNKNOWN]**).
- **Enterprise positioning.** "Structured hiring" plus governed AI (ISO 42001, third-party bias audits, MCP with admin scopes) is pitched at compliance-sensitive buyers. **[INFERENCE]**

### 6. Independent perspective

- **Trade press.**
  - HR Tech Edge covered the June 2026 AI launch under the headline "AI hiring agents and interview intelligence as candidate volume surges 412%". It also covered the AI principles as Greenhouse "draw[ing] a line on AI in hiring" ([G17](https://hrtechedge.com/ai-in-hr/greenhouse-unveils-ai-hiring-agents-and-interview-intelligence-as-candidate-volume-surges-412/), [G24](https://hrtechedge.com/greenhouse-draws-a-line-on-ai-in-hiring-with-new-principles-framework/), accessed 2026-09-25). **[SOURCE CLAIM · independent · search excerpt]**
  - HR Brew framed the Ezra deal as Greenhouse betting on AI interviewing as the "next TA game changer" ([G32](https://www.hr-brew.com/stories/2026/05/05/greenhouse-sets-sights-on-ai-interviewing-as-next-ta-game-changer), accessed 2026-09-25). **[SOURCE CLAIM · independent · search excerpt]**
- **Documented complexity and friction** (from vendor docs, not from reviews):
  - bulk rejections cannot be undone in bulk ([G70](https://support.greenhouse.io/hc/en-us/articles/115003086026-Changing-the-rejection-reason-for-bulk-rejected-candidates)) **[SOURCE CLAIM · vendor · search excerpt]**;
  - approver eligibility is tied to permission strips **[SOURCE CLAIM · vendor · search excerpt]**;
  - an integrator must handle several API generations (Harvest v1/v2 deprecations and V3) and four auth schemes (Basic, OAuth 2.0, JWT bearer for the audit log, V3 OAuth) **[FACT]**;
  - some capabilities are tier- or request-gated (application custom fields, audit log) **[FACT]**.
  - A third-party ecosystem of scheduling add-ons (GoodTime, ModernLoop) markets itself specifically against Greenhouse's native scheduling ([lead](https://goodtime.io/blog/talent-operations/best-interview-scheduling-for-greenhouse/), accessed 2026-09-25). **[SOURCE CLAIM · independent (weak/lead) · search excerpt]**
- **Review aggregates (G2, Capterra, TrustRadius):** **[UNKNOWN]**. The pages could not be fetched and the search budget ran out before they could be queried. A follow-up is needed to meet the two-independent-review-source bar.

### 7. Lessons for OpenCATS 2.0

**Product principles evidenced** **[INFERENCE]**
- *Structure first, AI second.* Interview plan, then kit, then scorecard attributes, then a five-value recommendation. AI features attach to that structure (notes mapped to scorecard questions; matching against calibrated criteria) rather than replacing it.
- *Typed approvals.* One approval model (`open_job`, `offer_job`, `offer_candidate`) with sequential or parallel groups and N-of-M quorum covers both requisitions and offers.
- *Auditable automation.* `On-Behalf-Of` on every API write, per-endpoint key scopes, signed webhooks with retries, and an opt-in audit-log API.
- *Human in the loop, by design.* AI buckets candidates without auto-rejecting. Candidates can opt out, and everyone who cannot be scored is routed to manual review.

**Patterns worth learning from** **[RECOMMENDATION]**
- Adopt the **approval-flow object shape** (typed flow, ordered approver groups, `approvals_required`, versioning) for both requisitions and offers. This closes `docs/audit/PRODUCT_GAPS.md` GAP-008 and GAP-009 with one engine.
- Make **rejection a structured action**: required reason, optional scheduled template e-mail, optional "move to talent pool". OpenCATS today has only statuses 650/700 with no reasons (`PRODUCT_GAPS.md` GAP-021) and no CRM (GAP-018). **Also support bulk undo**, which Greenhouse lacks.
- Model **scorecards** with per-attribute ratings, focus attributes per interview, an explicit `no_decision`, and "submitted on behalf of". OpenCATS has one unattributed integer rating (`PRODUCT_GAPS.md` GAP-007; `db/cats_schema.sql:238`).
- Offer both **self-scheduling (single slot, minimum lead time)** and **availability requests**, plus buffers and auto-replacement from interviewer pools (GAP-006; `FEATURE_INVENTORY.md` FEAT-004 private-event leak).
- Copy the **webhook contract**: HMAC signature, ping-on-create, retry schedule, auto-disable. Replace the 278 `eval` hooks with it (`FEATURE_INVENTORY.md` FEAT-015; GAP-004).
- Use **field-group anonymisation with an explicit enumerated list**, plus **split consent** (processing, retention, demographic) at apply time. OpenCATS has no consent capture and hard deletes that leave residue (GAP-002; `FEATURE_INVENTORY.md` FEAT-003).
- Make **job-based permissions with "future job" rules** the scoping primitive of RBAC (GAP-003, GAP-010).
- For AI (GAP-024), take four concrete, testable governance patterns: categorical outputs with explanations, no composite ranking, a candidate opt-out path, and third-party bias-audit hooks. Also provide an **MCP/agent surface gated by admin-enabled scopes**.

**Things NOT to copy** **[RECOMMENDATION]**
- **API sprawl.** Eight APIs, several auth styles and parallel versions. OpenCATS should ship **one versioned REST API (OpenAPI 3.1) with OAuth 2.0 scopes and a single webhook model** (`docs/audit/API_AUDIT.md` API-001).
- **A 30-day audit window that requires a sales request.** OpenCATS should make the append-only audit log a default with configurable retention and export (GAP-011).
- **Irreversible bulk actions.** Every bulk mutation needs a preview and an undo, recorded in the audit log. This matters doubly because OpenCATS's bulk selection is already buggy (`docs/audit/UX_UI_AUDIT.md` UX-002).
- **Paywalling data-model basics.** Application-level custom fields are Enterprise-only in Greenhouse; they should be core in OpenCATS.

### Sources

Greenhouse official GitHub docs (read first-hand; commit `271cd888061d3428575eba2f626fe3e1996485c3`, 2026-09-10):

1. [G1] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_introduction.md (and `source/harvest.html.md`) — Greenhouse official API docs source (GitHub) — accessed 2026-09-25
2. [G2] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_approvals.md — Greenhouse official API docs — accessed 2026-09-25
3. [G3] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_offers.md — Greenhouse official API docs — accessed 2026-09-25
4. [G4] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_scorecards.md — Greenhouse official API docs — accessed 2026-09-25
5. [G5] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_user_roles.md (and `_user_permissions.md`) — Greenhouse official API docs — accessed 2026-09-25
6. [G6] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_candidates.md — Greenhouse official API docs — accessed 2026-09-25
7. [G7] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_applications.md — Greenhouse official API docs — accessed 2026-09-25
8. [G8] https://github.com/grnhse/greenhouse-api-docs/tree/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/webhooks — Greenhouse official webhook docs — accessed 2026-09-25
9. [G9] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/audit-log/_introduction.md — Greenhouse official Audit Log API docs — accessed 2026-09-25
10. [G10] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/candidate-ingestion/_introduction.md — Greenhouse official Ingestion API docs — accessed 2026-09-25
11. [G11] https://github.com/grnhse/greenhouse-api-docs/tree/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/job-board — Greenhouse official Job Board API docs — accessed 2026-09-25
12. [G12] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/assessment/_introduction.md — Greenhouse official Assessment API docs — accessed 2026-09-25
13. [G13] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/index.html.md — Greenhouse developer resources index — accessed 2026-09-25
14. [G14] https://github.com/grnhse/greenhouse-api-docs/blob/271cd888061d3428575eba2f626fe3e1996485c3/source/includes/harvest/_jobs.md (and `_job_openings.md`) — Greenhouse official API docs — accessed 2026-09-25

Greenhouse web sources (seen as search-result excerpts; pages not fetched):

15. [G15] https://www.greenhouse.com/newsroom/greenhouse-launches-new-ai-capabilities-built-to-strengthen-structured-hiring-not-shortcut-it — Greenhouse newsroom (vendor) — accessed 2026-09-25
16. [G16] https://www.prnewswire.com/news-releases/greenhouse-launches-new-ai-capabilities-built-to-strengthen-structured-hiring-not-shortcut-it-302796893.html — PR Newswire (vendor release) — accessed 2026-09-25
17. [G17] https://hrtechedge.com/ai-in-hr/greenhouse-unveils-ai-hiring-agents-and-interview-intelligence-as-candidate-volume-surges-412/ — HR Tech Edge (independent trade press) — accessed 2026-09-25
18. [G18] https://www.greenhouse.com/newsroom/greenhouse-launches-mcp-giving-hiring-teams-a-governed-way-to-connect-ai-tools-to-greenhouse — Greenhouse newsroom (vendor) — accessed 2026-09-25
19. [G19] https://www.greenhouse.com/product-features/greenhouse-mcp — Greenhouse product page (vendor) — accessed 2026-09-25
20. [G20] https://support.greenhouse.io/hc/en-us/articles/53944054829083-Greenhouse-MCP-security-FAQ — Greenhouse Support (vendor) — accessed 2026-09-25
21. [G21] https://hirevire.com/articles/greenhouse-mcp — third-party vendor blog (weak/lead) — accessed 2026-09-25
22. [G22] https://www.greenhouse.com/newsroom/greenhouse-launches-ai-principles-framework-setting-the-standard-for-responsible-hiring-in-the-ai-era — Greenhouse newsroom (vendor) — accessed 2026-09-25
23. [G23] https://www.morningstar.com/news/pr-newswire/20260417ny35127/greenhouse-launches-ai-principles-framework-setting-the-standard-for-responsible-hiring-in-the-ai-era — Morningstar syndication of PR Newswire (vendor release) — accessed 2026-09-25
24. [G24] https://hrtechedge.com/greenhouse-draws-a-line-on-ai-in-hiring-with-new-principles-framework/ — HR Tech Edge (independent trade press) — accessed 2026-09-25
25. [G25] https://support.greenhouse.io/hc/en-us/articles/41131886674075-Talent-Matching-FAQ — Greenhouse Support (vendor) — accessed 2026-09-25
26. [G26] https://support.greenhouse.io/hc/en-us/articles/41131616864283-Talent-Matching-Data-Processing-FAQ — Greenhouse Support (vendor) — accessed 2026-09-25
27. [G27] https://support.greenhouse.io/hc/en-us/articles/44682413339675-Operational-readiness-guide-Talent-Matching-policy — Greenhouse Support (vendor) — accessed 2026-09-25
28. [G28] https://support.greenhouse.io/hc/en-us/articles/41396009937307-Talent-Matching — Greenhouse Support (vendor) — accessed 2026-09-25
29. [G29] https://www.greenhouse.com/newsroom/greenhouse-has-entered-into-a-definitive-agreement-to-acquire-ezra-ai-labs — Greenhouse newsroom (vendor) — accessed 2026-09-25
30. [G30] https://www.greenhouse.com/newsroom/greenhouse-completes-acquisition-of-ezra-ai-labs-bringing-conversational-ai-to-the-hiring-process — Greenhouse newsroom (vendor) — accessed 2026-09-25
31. [G31] https://www.wsgr.com/en/insights/firm-advises-greenhouse-on-acquisition-of-ezra-ai-labs.html — Wilson Sonsini (counsel deal note; independent of Greenhouse marketing) — accessed 2026-09-25
32. [G32] https://www.hr-brew.com/stories/2026/05/05/greenhouse-sets-sights-on-ai-interviewing-as-next-ta-game-changer — HR Brew (independent press) — accessed 2026-09-25
33. [G33] https://www.greenhouse.com/newsroom/greenhouse-and-clear-announce-partnership-to-enable-candidate-verification — Greenhouse newsroom (vendor) — accessed 2026-09-25
34. [G34] https://ir.clearme.com/news-events/press-releases/detail/151/clear-and-greenhouse-announce-partnership-to-enable — CLEAR investor relations (partner) — accessed 2026-09-25
35. [G35] https://www.greenhouse.com/blog/introducing-greenhouse-real-talent — Greenhouse blog (vendor) — accessed 2026-09-25
36. [G36] https://www.globenewswire.com/news-release/2025/06/12/3098257/0/en/CLEAR-and-Greenhouse-Announce-Partnership-to-Enable-Candidate-Verification.html — GlobeNewswire (partner release) — accessed 2026-09-25
37. [G37] https://www.tpg.com/news-and-insights/tpg-growth-and-rise-fund-make-major-investment-greenhouse — TPG (investor) — accessed 2026-09-25
38. [G38] https://www.businesswire.com/news/home/20210114005773/en/TPG-Growth-and-The-Rise-Fund-Make-Major-Investment-in-Greenhouse-Software — Business Wire (release) — accessed 2026-09-25
39. [G39] https://www.alleywatch.com/2021/01/greenhouse-job-recruitment-platform-acquired-tpg-growth/ — AlleyWatch (independent press) — accessed 2026-09-25
40. [G40] https://en.wikipedia.org/wiki/Greenhouse_Software — Wikipedia (independent, excerpt) — accessed 2026-09-25
41. [G41] https://www.prnewswire.com/news-releases/greenhouse-buys-interseller-to-add-sourcing-to-the-greenhouse-crm-301411248.html — PR Newswire (vendor release) — accessed 2026-09-25
42. [G42] https://www.interseller.io/interseller-joins-greenhouse — Interseller (acquired company) — accessed 2026-09-25
43. [G43] https://support.greenhouse.io/hc/en-us/articles/360025776391-Configure-two-stage-job-approvals — Greenhouse Support (vendor) — accessed 2026-09-25
44. [G44] https://support.greenhouse.io/hc/en-us/articles/360025756071-One-stage-versus-two-stage-job-approvals — Greenhouse Support (vendor) — accessed 2026-09-25
45. [G45] https://support.greenhouse.io/hc/en-us/articles/360062257351-Configure-approvals — Greenhouse Support (vendor) — accessed 2026-09-25
46. [G46] https://support.greenhouse.io/hc/en-us/articles/4405333836955-Use-approvals-in-Greenhouse-Recruiting-with-an-HRIS — Greenhouse Support (vendor) — accessed 2026-09-25
47. [G47] https://support.greenhouse.io/hc/en-us/articles/200668380-Create-a-new-job — Greenhouse Support (vendor) — accessed 2026-09-25
48. [G48] https://support.greenhouse.io/hc/en-us/articles/360038222812-Creating-and-using-template-jobs — Greenhouse Support (vendor) — accessed 2026-09-25
49. [G49] https://support.greenhouse.io/hc/en-us/articles/204923599-Configure-the-new-job-setup-flow — Greenhouse Support (vendor) — accessed 2026-09-25
50. [G50] https://support.greenhouse.io/hc/en-us/articles/4416516361499-Job-kickoff-form-setup — Greenhouse Support (vendor) — accessed 2026-09-25
51. [G51] https://support.greenhouse.io/hc/en-us/articles/115002226746-VIDEO-Creating-Interview-Kits — Greenhouse Support (vendor) — accessed 2026-09-25
52. [G52] https://support.greenhouse.io/hc/en-us/articles/206285655-LinkedIn-Limited-Listings — Greenhouse Support (vendor) — accessed 2026-09-25
53. [G53] https://support.greenhouse.io/hc/en-us/articles/360043197972-Remote-job-posts-on-Indeed-and-LinkedIn-Limited-Listings — Greenhouse Support (vendor) — accessed 2026-09-25
54. [G54] https://support.greenhouse.io/hc/en-us/articles/17073067102747-LinkedIn-Apply-Connect-integration — Greenhouse Support (vendor) — accessed 2026-09-25
55. [G55] https://support.greenhouse.io/hc/en-us/articles/115003795152-Use-LinkedIn-with-Greenhouse-Recruiting — Greenhouse Support (vendor) — accessed 2026-09-25
56. [G56] https://support.greenhouse.io/hc/en-us/articles/36307427046555-Scheduling-overview — Greenhouse Support (vendor) — accessed 2026-09-25
57. [G57] https://support.greenhouse.io/hc/en-us/articles/4409534663579-Candidate-self-scheduling-overview — Greenhouse Support (vendor) — accessed 2026-09-25
58. [G58] https://support.greenhouse.io/hc/en-us/articles/13301025470875-Request-candidate-availability — Greenhouse Support (vendor) — accessed 2026-09-25
59. [G59] https://www.greenhouse.com/blog/all-your-interview-scheduling-needs-covered-see-whats-new-in-greenhouse — Greenhouse blog (vendor) — accessed 2026-09-25
60. [G60] https://support.greenhouse.io/hc/en-us/articles/360039539772-Structured-hiring-guide — Greenhouse Support (vendor) — accessed 2026-09-25
61. [G61] https://support.greenhouse.io/hc/en-us/articles/360018399451-Assign-or-edit-focus-attributes-on-a-scorecard — Greenhouse Support (vendor) — accessed 2026-09-25
62. [G62] https://support.greenhouse.io/hc/en-us/articles/360027281232-Send-scorecard-reminder-notification-manually — Greenhouse Support (vendor) — accessed 2026-09-25
63. [G63] https://www.greenhouse.com/guidance/tips-for-improving-interview-scorecard-submission-rate — Greenhouse guidance (vendor) — accessed 2026-09-25
64. [G64] https://support.greenhouse.io/hc/en-us/articles/115002226826-Interviewer-guide-How-to-use-interview-kits — Greenhouse Support (vendor) — accessed 2026-09-25
65. [G65] https://support.greenhouse.io/hc/en-us/articles/200485589-Generate-and-send-offer-document — Greenhouse Support (vendor) — accessed 2026-09-25
66. [G66] https://support.greenhouse.io/hc/en-us/articles/6459061824155-Create-offer-document-template — Greenhouse Support (vendor) — accessed 2026-09-25
67. [G67] https://support.greenhouse.io/hc/en-us/articles/205633569-Docusign-integration — Greenhouse Support (vendor) — accessed 2026-09-25
68. [G68] https://support.greenhouse.io/hc/en-us/articles/360025225732-Reject-a-candidate — Greenhouse Support (vendor) — accessed 2026-09-25
69. [G69] https://support.greenhouse.io/hc/en-us/articles/360025552011-Reject-candidates-or-prospects-in-bulk — Greenhouse Support (vendor) — accessed 2026-09-25
70. [G70] https://support.greenhouse.io/hc/en-us/articles/115003086026-Changing-the-rejection-reason-for-bulk-rejected-candidates — Greenhouse Support (vendor) — accessed 2026-09-25
71. [G71] https://support.greenhouse.io/hc/en-us/articles/203941409-Rejection-reasons-report — Greenhouse Support (vendor) — accessed 2026-09-25
72. [G72] https://support.greenhouse.io/hc/en-us/articles/360000653472-Auto-reject — Greenhouse Support (vendor) — accessed 2026-09-25
73. [G73] https://support.greenhouse.io/hc/en-us/articles/360022793612-CRM-overview — Greenhouse Support (vendor) — accessed 2026-09-25
74. [G74] https://support.greenhouse.io/hc/en-us/articles/360024904051-Prospect-pools-and-stages — Greenhouse Support (vendor) — accessed 2026-09-25
75. [G75] https://support.greenhouse.io/hc/en-us/articles/5045604930843-Create-and-manage-campaign-pools — Greenhouse Support (vendor) — accessed 2026-09-25
76. [G76] https://support.greenhouse.io/hc/en-us/articles/5224485120411-Sourcing-Automation-FAQ — Greenhouse Support (vendor) — accessed 2026-09-25
77. [G77] https://support.greenhouse.io/hc/en-us/articles/360022964432-Talent-Finder — Greenhouse Support (vendor) — accessed 2026-09-25
78. [G78] https://github.com/api-evangelist/greenhouse (commit `64615d9`, 2026-09-22; files `plans/`, `scopes/`, `mcp/`, `well-known/`) — API Evangelist catalogue (third-party; mix of probed, searched and generated artefacts) — accessed 2026-09-25
79. [lead] https://goodtime.io/blog/talent-operations/best-interview-scheduling-for-greenhouse/ — GoodTime blog (third-party vendor; weak/lead) — accessed 2026-09-25

---

## Lever (Lever; part of Employ Inc.)

### 1. Snapshot

- **Vendor and ownership.** Lever is part of **Employ Inc.**, whose portfolio also includes Jobvite and JazzHR. Secondary sources date the acquisition to August 2022 ([L6a](https://en.wikipedia.org/wiki/Lever_(company)), [L6b](https://www.pin.com/blog/lever-pricing/), accessed 2026-09-25). **[SOURCE CLAIM · independent · search excerpt]** Corroborating vendor evidence:
  - Lever's and Jobvite's 2026 blogs carry the same "People Actually" podcast series ([L4b](https://www.lever.co/blog/people-actually-recap-what-we-learned-from-episodes-4-and-5), [L5b](https://www.jobvite.com/blog/job-seeker-nation-2026-why-hiring-has-a-trust-problem/), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
  - Jobvite's blog names **Jerry Jao as Employ CEO** (2026-07-17) ([L5](https://www.jobvite.com/blog/from-credentials-to-capabilities-how-employ-ceo-jerry-jao-hires-beyond-the-resume/), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
  - A secondary source says Jao and CTO Patrick Jean were appointed in February 2026 "to accelerate AI innovation across the portfolio" ([L6c](https://www.knowlee.ai/blog/tools/lever-hire-2026), accessed 2026-09-25). **[SOURCE CLAIM · independent (weak/lead) · search excerpt]**
- **2025–2026 M&A.** Employ reportedly **acquired Pillar** (interview intelligence) on 2025-03-05. Pillar is reportedly the engine behind Lever's **AI Interview Companion** ([L6d](https://www.treegarden.io/blog/lever-review-2026/), accessed 2026-09-25). **[SOURCE CLAIM · independent (weak/lead) · search excerpt; not verified against an Employ press release]**
- **Scale.** "Roughly 5,000 customers" for Lever and "26,000+" across Employ ([L6d](https://www.treegarden.io/blog/lever-review-2026/)). **[SOURCE CLAIM · independent (weak/lead) · search excerpt]** HQ, employees, founding: **[UNKNOWN]** (Wikipedia and LinkedIn pages were surfaced by search but not read).
- **Positioning.** "LeverTRM" (talent relationship management) combines ATS and CRM in one product ([L6d](https://www.treegarden.io/blog/lever-review-2026/)). **[SOURCE CLAIM · independent (weak/lead) · search excerpt]** The data model supports this. The API is built around a candidate-centric **Opportunity** (one contact, many opportunities, each with applications), with postings, requisitions, feedback, panels and interviews as related objects ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json), accessed 2026-09-25). **[FACT]**
- **Target customer.** Corporate talent-acquisition teams; named logos in secondary sources (Netflix, Spotify, KPMG, Atlassian, Canva) are **[SOURCE CLAIM · independent (weak/lead) · search excerpt]**. Regions: a **global (US) and an EU instance** (`api.eu.lever.co`, `jobs.eu.lever.co`) ([L1](https://github.com/lever/postings-api/blob/f61aac5831a193bc66e1183c3ad102739dfd9f56/README.md), accessed 2026-09-25). **[FACT]**
- **Modules** named on Lever's own status page in 2026 **[SOURCE CLAIM · vendor text · third-party GitHub copy]**:
  - AI Interview Companion and the **Talent Fit** module;
  - **Visual Insights** reporting (backed by Snowflake);
  - Microsoft 365 scheduling and e-mail/calendar sync;
  - offer-letter generation;
  - a LinkedIn job-board integration;
  - a sandbox environment.
  Sources: status incidents ([L3a](https://status.lever.co/incidents/9st2n3wtn0zp), [L3b](https://status.lever.co/incidents/nfhcrst0s1zg), [L3c](https://status.lever.co/incidents/yrbc0mxpbt4j), [L3d](https://status.lever.co/incidents/rljfn3syt5hh), [L3e](https://status.lever.co/incidents/m1c132jddy5k), [L3f](https://status.lever.co/incidents/9xg1ct9kqszq), [L3g](https://status.lever.co/incidents/0l26nxzqcw80), accessed 2026-09-25).

### 2. Workflows

Help-center pages (help.lever.co) could not be reached, so step counts and dialog options are **[UNKNOWN]** throughout. What follows comes from the official API artefacts and status pages.

| Workflow | Evidence | Tag |
|---|---|---|
| **Requisition** | A requisition object carries `requisitionCode`, `name`, `headcountTotal`, `status`, `hiringManager`, `owner`, `compensationBand` (currency, interval, min, max), `employmentStatus`, `location`, `team`, `internalNotes` and typed **requisition custom fields**: dropdown, text, date, number, and **object "field groups"** such as a cost centre with sub-fields ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json), accessed 2026-09-25). | **[FACT]** |
| **Job approval** | Approval chains for requisitions or postings: **[UNKNOWN]**. They are not visible in the API artefacts reviewed. | — |
| **Publishing / distribution** | Postings have `state`, `distributionChannels`, `owner`, `hiringManager`, categories (team, department, location, commitment, level), `workplaceType` (on-site/remote/hybrid) and an optional `salaryRange` and description. They appear automatically on a Lever-hosted job site. The public Postings API offers JSON, HTML and iframe modes, and **internal postings are not exposed** ([L1](https://github.com/lever/postings-api/blob/f61aac5831a193bc66e1183c3ad102739dfd9f56/README.md), accessed 2026-09-25). A LinkedIn job-board integration is referenced on the status page ([L3f](https://status.lever.co/incidents/9xg1ct9kqszq)). | **[FACT]** / **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Sourcing / CRM** | The candidate-centric opportunity model with contacts, sources, tags, referrals and notes ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json)) is evidenced. "Nurture" campaigns are claimed only in third-party catalogues ([L7](https://github.com/api-evangelist/lever/blob/main/plans/lever-plans-pricing.yml), accessed 2026-09-25). | **[FACT]** model / **[SOURCE CLAIM · third-party GitHub dataset (generated; weak)]** nurture |
| **Intake / application** | Applicants use the hosted form or a custom form through `POST /v0/postings/SITE/POSTING-ID?key=…`, with an API key generated by a **Super Admin**. **Name and e-mail are required. Candidates are de-duplicated and merged by e-mail.** Optional fields: `source`, `ip` (for compliance country detection), IANA `timezone`, `acceptLanguage`, `consent.marketing` and `consent.store`, each with a `compliancePolicyId`. A confirmation e-mail is sent unless `silent` ([L1](https://github.com/lever/postings-api/blob/f61aac5831a193bc66e1183c3ad102739dfd9f56/README.md), accessed 2026-09-25). | **[FACT]** |
| **Screening** | **Talent Fit**: candidate ranking with skills-gap identification per a secondary source ([L6d](https://www.treegarden.io/blog/lever-review-2026/)) **[SOURCE CLAIM · independent (weak/lead) · search excerpt]**. The module was "temporarily disabled" for maintenance on 2026-04-20 and again on 2026-05-20 ([L3b](https://status.lever.co/incidents/nfhcrst0s1zg), [L3h](https://status.lever.co/incidents/jct4yw29kznk), accessed 2026-09-25) **[SOURCE CLAIM · vendor text · third-party GitHub copy]**. Knockout questions and assessments: **[UNKNOWN]**. | mixed |
| **Pipeline** | Stages and archive reasons (disposition) are API objects. Opportunities move by stage update or archive; webhooks fire on `candidateStageChange` and `candidateHired` and can be **filtered by conditions** such as `origins: ["applied"]` or `["referred"]` ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json), accessed 2026-09-25). | **[FACT]** |
| **Interviews / scheduling** | **Panels** containing **interviews** (create, update, delete through the API). Microsoft Office 365 availability retrieval and scheduling exist ([L3d](https://status.lever.co/incidents/rljfn3syt5hh), accessed 2026-09-25). Self-scheduling: **[UNKNOWN]**. | **[FACT]** / **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Feedback / scorecards** | **Feedback templates** with instructions and typed fields (multiple-select, **`score-system`** rating and others), attached to an interview within a panel ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json)). **AI Interview Companion** has an "Enable for all Jobs" setting ([L3a](https://status.lever.co/incidents/9st2n3wtn0zp), accessed 2026-09-25). | **[FACT]** / **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Debrief / decision** | **[UNKNOWN]** | — |
| **Offers** | Offers can be listed and their files downloaded through the API. **Form templates** (e.g. "Offer Information") support **`secretByDefault`**, meaning private-by-default fields ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json)). Offer-letter generation and document conversion had platform-wide outages on 2026-07-14 and 2026-08-07 ([L3e](https://status.lever.co/incidents/m1c132jddy5k), [L3i](https://status.lever.co/incidents/88p9dsklfddq), accessed 2026-09-25). Offer approvals and e-signature provider: **[UNKNOWN]**. | **[FACT]** / **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Hire / hand-off** | `candidateHired` webhook ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json)). HRIS connectors: **[UNKNOWN]**. | **[FACT]** |
| **Rejection** | **Archive reasons** are the disposition model ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json)). Bulk archive and rejection templates: **[UNKNOWN]**. | **[FACT]** |
| **Rediscovery** | **[UNKNOWN]** | — |

### 3. User experience

- **Recruiter, hiring manager, interviewer, navigation, saved views, bulk actions, notifications:** **[UNKNOWN]**. The help center could not be reached, and no verified description of Lever's UI was obtained in this pass.
- **Candidate experience.**
  - Lever-hosted job site per company (`jobs.lever.co/<site>`; EU: `jobs.eu.lever.co`). The job list can be filtered by location, commitment, team, department and level. Custom careers pages must allow CORS from the company's own domains.
  - Lever **recommends its hosted application form** because it "handles all custom form configurations … including queuing and retries at peak times" ([L1](https://github.com/lever/postings-api/blob/f61aac5831a193bc66e1183c3ad102739dfd9f56/README.md), accessed 2026-09-25). **[FACT]**
- **Collaboration.** Notes, files, resumes and referrals are opportunity sub-resources ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json)). **[FACT]** @mentions: **[UNKNOWN]**.

### 4. Platform

- **API.**
  - The REST **Data API** at `api.lever.co/v1` authenticates with an **API key (Basic)** or **OAuth 2.0** (authorisation-code flow hosted on Auth0 for the sandbox; `offline_access` scope; a sandbox account for partners). A `perform_as` parameter attributes writes to a user ([L2](https://github.com/lever/integrator-resources/tree/c74d96e3973d4bf39783deb1c3bc6383f2003a49), accessed 2026-09-25). **[FACT]**
  - Resources: opportunities, applications, archive reasons, **audit events**, contacts, feedback, feedback templates, files, form templates, interviews, notes, offers, panels, postings, referrals, **requisitions** and requisition fields, resumes, sources, stages, tags, uploads, users, webhooks **[FACT]**.
  - The public **Postings API** is `v0`. Application POSTs are rate-limited to **2 per second**; beyond that it returns 429 and "you will … lose candidate applications" unless you queue and retry ([L1](https://github.com/lever/postings-api/blob/f61aac5831a193bc66e1183c3ad102739dfd9f56/README.md), accessed 2026-09-25). **[FACT]**
  - The Data API's general rate limit ("10 req/s, burst 20") comes only from a generated third-party catalogue ([L7](https://github.com/api-evangelist/lever/blob/main/rate-limits/lever-rate-limits.yml)). **[SOURCE CLAIM · third-party GitHub dataset (generated; weak)]**
- **Webhooks.** Created and updated by API, with per-webhook `configuration` (`verifyConnection`, `conditions.origins`). Events seen in official examples: `candidateStageChange`, `candidateHired` ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json)). **[FACT]** Full event list and signing scheme: **[UNKNOWN]**.
- **EEO.** EEO response endpoints, including a PII variant, appear only in a third-party minimal spec ([L7](https://github.com/api-evangelist/lever/tree/main/openapi)). **[SOURCE CLAIM · third-party GitHub dataset (generated; weak)]**
- **SSO / SCIM / MFA:** **[UNKNOWN]**.
- **RBAC.** A "Super Admin" role exists ([L1](https://github.com/lever/postings-api/blob/f61aac5831a193bc66e1183c3ad102739dfd9f56/README.md)) **[FACT]**. The full role model is **[UNKNOWN]**.
- **Audit logs.** An `audit_events` API exists ([L2](https://github.com/lever/integrator-resources/blob/c74d96e3973d4bf39783deb1c3bc6383f2003a49/DataAPIPostman/Lever-DataAPI-Collection.json)). **[FACT]** Retention: **[UNKNOWN]**.
- **Customisation.** Typed requisition custom fields including object groups; form and feedback templates **[FACT]**.
- **Localisation and data residency.** Separate **EU data centre** ("EUDC", `hire.eulever.co`) ([L1](https://github.com/lever/postings-api/blob/f61aac5831a193bc66e1183c3ad102739dfd9f56/README.md) **[FACT]**; [L3j](https://status.lever.co/incidents/lpzjl8wrclm2), [L3k](https://status.lever.co/incidents/4fl5gkvf2830) **[SOURCE CLAIM · vendor text · third-party GitHub copy]**; accessed 2026-09-25). Postings expose an ISO country code and salary currency **[FACT]**. UI languages: **[UNKNOWN]**.
- **Reporting.** **Visual Insights**, backed by a Snowflake data pipeline ([L3c](https://status.lever.co/incidents/yrbc0mxpbt4j), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **AI.**
  - **AI Interview Companion**, org-level "enable for all jobs" ([L3a](https://status.lever.co/incidents/9st2n3wtn0zp)) **[SOURCE CLAIM · vendor text · third-party GitHub copy]**.
  - **Talent Fit** ranking ([L3b](https://status.lever.co/incidents/nfhcrst0s1zg)) **[SOURCE CLAIM · vendor text · third-party GitHub copy]**.
  - Human-in-the-loop, opt-out and bias-audit statements: **[UNKNOWN]**.
  - Lever's June 2026 blog discusses "keeping hiring human as AI reshapes both sides of the interview table" ([L4a](https://www.lever.co/blog/balancing-ai-and-authenticity-keeping-hiring-human-as-ai-reshapes-both-sides-of-the-interview-table), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **Mobile and accessibility (VPAT):** **[UNKNOWN]**.
- **Security and compliance.** A third-party keyword probe of lever.co/security found "SOC 2", "ISO 27001", "PCI DSS" and "GDPR" ([L7](https://github.com/api-evangelist/lever/blob/main/security/lever-trust-center.yml), accessed 2026-09-25). **[SOURCE CLAIM · third-party GitHub dataset (keyword probe); wording and scope not verified]**

### 5. Business

- **Pricing.** Not public; quote-based ([L7](https://github.com/api-evangelist/lever/blob/main/plans/lever-plans-pricing.yml), accessed 2026-09-25). **[SOURCE CLAIM · third-party GitHub dataset (generated)]**
  - SEO sources give ranges ("$3,500–$15,000+ per year" for base ATS) and report "double-digit list-price increases at renewal in 2024 and 2025" ([L6b](https://www.pin.com/blog/lever-pricing/), [L6e](https://vendorbenchmark.com/vendors/lever-ats-pricing), accessed 2026-09-25). **[SOURCE CLAIM · independent (weak/lead) · search excerpt; unverified; do not quote as fact]**
- **Packaging.** Tier names such as "Essential/Professional" appear only in a generated third-party file and are **[UNKNOWN]**.
- **Positioning.** A mid-market to enterprise ATS+CRM inside a multi-brand portfolio (Employ: Jobvite, JazzHR, Lever). **[INFERENCE]**

### 6. Independent perspective

- **[UNKNOWN] for credible independent sources in this pass.** Review aggregates, analysts and reputable press could not be fetched and the search budget was exhausted. Leads surfaced by search that should be checked:
  - Wikipedia "Lever (company)";
  - the Lever LinkedIn page;
  - SEO reviews and pricing posts (pin.com, treegarden.io, knowlee.ai, vendorbenchmark.com, performancereviewssoftware.com, ismartrecruit.com).
  All are **weak** except Wikipedia.
- **Operational signal (vendor-published, not independent).** The 2026 status history shows:
  - a platform outage caused by a support-triggered data job (2026-03-26);
  - Microsoft 365 scheduling and e-mail auth failures (April and July);
  - offer-letter send failures (July and August);
  - stale reporting data;
  - two maintenance disablements of the AI **Talent Fit** module;
  - EU-region errors.
  ([L3](https://github.com/api-evangelist/lever/tree/main/blogs), accessed 2026-09-25) **[SOURCE CLAIM · vendor text · third-party GitHub copy]** This is evidence of transparency (a public status page with root-cause analyses), not of relative reliability. **[INFERENCE]**

### 7. Lessons for OpenCATS 2.0

**Product principles evidenced** **[INFERENCE]**
- *A person is not an application.* The Opportunity model separates the contact (person) from each hiring opportunity, which lets ATS and CRM share one record. OpenCATS already separates candidate from pipeline (`candidate_joborder`) but lacks CRM semantics (`PRODUCT_GAPS.md` GAP-018).
- *Consent captured at the point of entry*, tied to a named compliance policy (`compliancePolicyId`).
- *Regional instances* for data residency (global and EU).

**Patterns worth learning from** **[RECOMMENDATION]**
- **Requisition as its own object**, with headcount, compensation band and typed custom-field groups such as a cost centre, separate from postings. This covers GAP-008 without overloading the job order (`db/cats_schema.sql:792-821`).
- **Private-by-default form sections** (`secretByDefault`) for offer and compensation data. This is field-level confidentiality, which OpenCATS lacks (GAP-003 field masks).
- **Webhook subscriptions with filter conditions** (e.g. only referred candidates) to cut integration noise (GAP-004).
- **An AI kill switch per module.** Lever could disable Talent Fit platform-wide for maintenance. OpenCATS AI features (GAP-024) should be individually disableable, with graceful degradation.
- **Capture client context on apply** (IP, IANA time zone, Accept-Language). These support compliance-region logic and UTC/IANA-correct scheduling, which OpenCATS lacks (`FEATURE_INVENTORY.md` FEAT-016; GAP-020).

**Things NOT to copy** **[RECOMMENDATION]**
- **Pushing the burden of apply-queueing onto customers.** At 2 POSTs/s with 429s, applications can be lost. OpenCATS's public apply endpoint should **accept and queue server-side** (durable queue per GAP-022) and never drop an application. It should also fix the unauthenticated overwrite path in the current careers form (`docs/audit/EXECUTIVE_SUMMARY.md` Fact 2).
- **E-mail-only de-duplication with auto-merge** ("Candidate records will be merged when email addresses match"; placeholder e-mails are advised for record creation). OpenCATS needs deterministic plus fuzzy matching and a *reviewable* merge, given its current merge corruption (`FEATURE_INVENTORY.md` FEAT-002, FEAT-007; GAP-017).
- **Two API generations with different conventions** (v0 postings with a key in the query string; v1 Data API). Use one versioned API with header-based credentials.

### Sources

1. [L1] https://github.com/lever/postings-api/blob/f61aac5831a193bc66e1183c3ad102739dfd9f56/README.md — Lever official Postings API documentation (GitHub; read first-hand) — accessed 2026-09-25
2. [L2] https://github.com/lever/integrator-resources/tree/c74d96e3973d4bf39783deb1c3bc6383f2003a49 (`DataAPIPostman/Lever-DataAPI-Collection.json`, `ExampleOAuthApp/`) — Lever official Data API Postman collection and OAuth example (GitHub; read first-hand) — accessed 2026-09-25
3. [L3] https://github.com/api-evangelist/lever/tree/main/blogs (commit `d144d74`, 2026-09-24) — third-party GitHub copy (API Evangelist) of Lever status page and blog feed; individual incidents: [L3a] https://status.lever.co/incidents/9st2n3wtn0zp · [L3b] https://status.lever.co/incidents/nfhcrst0s1zg · [L3c] https://status.lever.co/incidents/yrbc0mxpbt4j · [L3d] https://status.lever.co/incidents/rljfn3syt5hh · [L3e] https://status.lever.co/incidents/m1c132jddy5k · [L3f] https://status.lever.co/incidents/9xg1ct9kqszq · [L3g] https://status.lever.co/incidents/0l26nxzqcw80 · [L3h] https://status.lever.co/incidents/jct4yw29kznk · [L3i] https://status.lever.co/incidents/88p9dsklfddq · [L3j] https://status.lever.co/incidents/lpzjl8wrclm2 · [L3k] https://status.lever.co/incidents/4fl5gkvf2830 — Lever status page (vendor, via third-party GitHub copy) — accessed 2026-09-25
4. [L4a] https://www.lever.co/blog/balancing-ai-and-authenticity-keeping-hiring-human-as-ai-reshapes-both-sides-of-the-interview-table · [L4b] https://www.lever.co/blog/people-actually-recap-what-we-learned-from-episodes-4-and-5 — Lever blog (vendor, via third-party GitHub copy) — accessed 2026-09-25
5. [L5] https://www.jobvite.com/blog/from-credentials-to-capabilities-how-employ-ceo-jerry-jao-hires-beyond-the-resume/ · [L5b] https://www.jobvite.com/blog/job-seeker-nation-2026-why-hiring-has-a-trust-problem/ — Jobvite blog (Employ sister brand; vendor, via API Evangelist mirror) — accessed 2026-09-25
6. [L6a] https://en.wikipedia.org/wiki/Lever_(company) — Wikipedia (independent; search excerpt only) · [L6b] https://www.pin.com/blog/lever-pricing/ — SEO/vendor blog (weak/lead) · [L6c] https://www.knowlee.ai/blog/tools/lever-hire-2026 — SEO blog (weak/lead) · [L6d] https://treegarden.io/blog/lever-review-2026/ — SEO review (weak/lead) · [L6e] https://vendorbenchmark.com/vendors/lever-ats-pricing — pricing aggregator (weak/lead) — accessed 2026-09-25
7. [L7] https://github.com/api-evangelist/lever (commit `d144d74`; `plans/`, `rate-limits/`, `security/`, `openapi/`) — API Evangelist catalogue (third-party; partly generated, not harvested) — accessed 2026-09-25

---

## Ashby (Ashby, Inc.; independent, venture-backed)

### 1. Snapshot

- **Vendor and ownership.** Ashby, Inc. is an independent, venture-backed company. Ashby's blog announces a **"$50 Million Series D"** ([A8](https://www.ashbyhq.com/blog/culture/series-d), title observed in search results, accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt (title only)]** Data aggregators date it to July 2025, with returning investors including F-Prime Capital and Gaingels ([A9a](https://tracxn.com/d/companies/ashby/__hzSC-b0F7MQYYHj8ElwlD-CZAzAkkXzZNTco38f78JM), [A9b](https://www.preqin.com/data/profile/asset/ashby-inc-/508677), accessed 2026-09-25). **[SOURCE CLAIM · independent (data aggregator) · search excerpt]**
  - **Caution:** a search summary attributed a "Series A, January 2026 (Notable Capital, Khosla)" to "Ashby, Inc.". Its description ("AI alignment layer connecting brands and consumers") does not match the ATS vendor. It is treated as a **different company** and excluded. **[INFERENCE]**
  - No acquisition of Ashby was found. **[INFERENCE]** (Limited search.)
- **HQ, founding, headcount, customers.** **[UNKNOWN]**. A third-party GitHub copy (Konfig) describes Ashby as "California-based" ([A2](https://github.com/konfig-sdks/openapi-examples/tree/main/ashby), accessed 2026-09-25). **[SOURCE CLAIM · third-party GitHub copy]** Revenue estimates on getlatka.com are **[SOURCE CLAIM · independent (weak/lead) · search excerpt]** and are not reproduced.
- **Positioning.** An "all-in-one" platform. The pricing page names **"All-In-One" plans** and a standalone **"Ashby Analytics — for your existing ATS"** ([A5](https://github.com/api-evangelist/ashby/blob/fe0d709/plans/ashby-plans-pricing.yml), transcription of https://www.ashbyhq.com/pricing dated 2026-09-20, accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **Target customer.**
  - Plan sizing: **Foundations** up to 100 employees, **Plus** 101–1,000, **Enterprise** 1,000+ ([A5](https://github.com/api-evangelist/ashby/blob/fe0d709/plans/ashby-plans-pricing.yml)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
  - An **external/agency recruiter** user type exists ("External Recruiter" global role; an incident about "external/agency recruiters" adding notes) ([A2](https://github.com/konfig-sdks/openapi-examples/tree/main/ashby) **[SOURCE CLAIM · vendor text · third-party GitHub copy]**; [A3a](https://status.ashbyhq.com/incidents/ptyhw200t4q3) **[SOURCE CLAIM · vendor text · third-party GitHub copy]**; accessed 2026-09-25). This means agencies are *guests* in a corporate ATS rather than the primary user. **[INFERENCE]**
- **Suite composition, per official API docs** ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
  - ATS: jobs, **openings**, postings, applications, interview plans, feedback, offers, approvals;
  - sourcing CRM: **projects**, **sourcing sequences**, referrals;
  - scheduling: interview schedules, **interviewer pools**, pauses and limits;
  - **surveys**: candidate experience, EEOC, diversity, consent;
  - analytics and reports;
  - e-signature;
  - HRIS push;
  - AI: Application Review criteria evaluations and the **AI Notetaker add-on**;
  - **fraud checks**.

### 2. Workflows

Ashby's help center could not be reached. The evidence below is Ashby's **official developer documentation** (llms.txt index with endpoint descriptions, read via a third-party GitHub copy) and its **status page**, so UI step counts are **[UNKNOWN]** unless stated.

| Workflow | Evidence | Tag |
|---|---|---|
| **Requisition / openings** | **Openings** are first-class objects, separate from jobs. They support add/remove jobs and locations, opening state, archive and custom fields. Jobs have **close reasons**, **job templates**, compensation tiers, and a custom **requisition ID** that is searchable ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt), accessed 2026-09-25). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Job lifecycle and approval** | Job status is a state machine: new jobs are **Draft**; Draft → Open or Archived; Open → Closed; Closed → Draft or Archived; Archived → Draft ([A2](https://github.com/konfig-sdks/openapi-examples/blob/main/ashby/openapi.yaml), accessed 2026-09-25). `job.startApprovalProcess` "submits it to the configured approvers" and errors if an approval is already pending, **no approval definition matches**, or the job "failed approval validation". `approvalDefinition.update` lets an external system (e.g. an HRIS) **own** approval definitions marked "managed by the API" ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Publishing / distribution** | Publishing a posting requires a **title, description and an open job**. "If the organization requires compensation to be displayed, the posting must also have a valid compensation tier", which enforces pay transparency at publish time. Postings can be **listed or unlisted**; the public **Job Postings API** (unauthenticated, `jobs.ashbyhq.com/<board>`) and **Dedicated Partner Job Feeds** exist; multiple **brands** are supported ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Sourcing / CRM** | **Projects** (candidate collections, confidential-capable) and **sourcing sequences**: multi-stage e-mail campaigns with templates, drafts, per-stage editing and sender aliases, where **no-reply senders are rejected**; many are beta ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). The Foundations plan includes "200 sourcing email lookups" and an outbound-message quota ([A5](https://github.com/api-evangelist/ashby/blob/fe0d709/plans/ashby-plans-pricing.yml)). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Intake / application** | Applicants use the hosted job board or `applicationForm.submit` (multipart) for custom careers pages. `candidate.listClientInfo` stores **IP and user agent** per candidate. `applicationSubmit` fires for applications and manual adds **but not for bulk imports** ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Screening** | **AI Application Review** produces "AI-generated **criteria evaluations** that assess how well a candidate meets specific job requirements. Each evaluation contains the **outcome, reasoning**, and other assessment details." **Fraud checks** come with a **manual fraud-review status** a human sets. An **Assessments framework** exists for partners, and **take-home assignments** are in beta ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Pipeline** | Interview plans contain ordered **interview stages** and **stage groups**. Applications change stage or source, **transfer between jobs**, and keep a **history**; editing history requires a special API-key setting. An **"Application Review"** screen exists ([A3b](https://status.ashbyhq.com/incidents/j37fvr23yk99), accessed 2026-09-25). Stage-rule automation specifics: **[UNKNOWN]**. | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Scheduling** | Interview schedules made of events; **interviewer pools** (create, archive, add or remove users); **interviewer pauses** ("while paused, the user will not be scheduled"); **interviewer settings limits** (load caps). **Calendar sync** runs through "All-in-One Scheduling". An incident notes candidates "may have scheduled with unavailable interviewers", which implies candidate self-scheduling ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt); [A3c](https://status.ashbyhq.com/incidents/ns6917dzn3wx), [A3d](https://status.ashbyhq.com/incidents/s0b9nqqlsbyj), accessed 2026-09-25). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]**; self-scheduling **[INFERENCE]** |
| **Feedback / interview kits** | Feedback forms with typed fields, including `CompensationRange`. An **interview briefing** gives the interviewer-facing view (application, interview, per-interviewer status, form). Feedback can be requested **without scheduling an interview**. The **AI Notetaker** (meeting bot plus transcript) is an **add-on**, and "on the free tier, transcripts expire after a retention period" ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt); [A3e](https://status.ashbyhq.com/incidents/y1mjwlfbwzjz)). Slack and e-mail interview reminders exist ([A3f](https://status.ashbyhq.com/incidents/b7brn6b513lv), accessed 2026-09-25). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Debrief / decision** | **[UNKNOWN]** | — |
| **Offers** | An **offer process** is started, then offer **versions** are created from offer forms. Approval runs through `offer.startApprovalProcess`. Admin **"Force Approve"** can override the whole process or a single step, but only for the current step and only for an assigned approver. Offer status and decided-at are tracked; **conditional offer fields** exist ([A3g](https://status.ashbyhq.com/incidents/kjc9gy80z0lv)). **E-signature** for "offers and documents" runs on **Dropbox Sign**, with a `signatureRequestUpdate` webhook ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt); [A3h](https://status.ashbyhq.com/incidents/svyjmsmtfw4y), [A3i](https://status.ashbyhq.com/incidents/2xv8fnj5xqn0), accessed 2026-09-25). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Hire / HRIS hand-off** | `candidate.pushToHris` (beta) triggers the "Add Candidate Data" flow to HRIS systems "e.g. **Workday, BambooHR, ADP**". It can be blocked when the offer is not accepted and retries automatically. A `pushToHRIS` webhook exists, and `candidateHire` includes the latest accepted offer ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **Certn** (background checks) integration appears on the status page ([A3j](https://status.ashbyhq.com/incidents/j9spr38mq0vs), accessed 2026-09-25). | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Rejection** | **Archive reasons** are the disposition model ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). Bulk archive and templates UX: **[UNKNOWN]**. | **[SOURCE CLAIM · vendor text · third-party GitHub copy]** |
| **Rediscovery** | **[UNKNOWN]** beyond projects and sequences. | — |

### 3. User experience

- **Recruiter home, hiring-manager views, navigation, saved views, bulk actions:** **[UNKNOWN]**. Components named on the status page are **[SOURCE CLAIM · vendor text · third-party GitHub copy]**:
  - an **Application Review** screen with configurable columns;
  - **saved dashboards** in analytics;
  - **candidate PDF export**;
  - **bulk candidate import**.
  Sources: [A3b](https://status.ashbyhq.com/incidents/j37fvr23yk99), [A3k](https://status.ashbyhq.com/incidents/hylb70lfxpsc), [A3l](https://status.ashbyhq.com/incidents/d5yyysn0rzlw), [A3m](https://status.ashbyhq.com/incidents/cjp5py7sqckd), accessed 2026-09-25.
- **Interviewer.** Interview briefings, feedback forms, reminders via Slack and e-mail, and an AI Notetaker meeting bot (§2). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **Candidate.**
  - Hosted **job pages** (a Safari-specific incident in June 2026 shows they are a web app) ([A3n](https://status.ashbyhq.com/incidents/mnjy854tn032), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
  - Candidate surveys, including **candidate-experience** surveys (optionally anonymous) and **data-consent** surveys ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
  - SMS "Candidate Texting" is a metered feature ($90 per 1,000 extra messages) ([A5](https://github.com/api-evangelist/ashby/blob/fe0d709/plans/ashby-plans-pricing.yml)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
  - Candidate portal and status tracking: **[UNKNOWN]**.
- **Collaboration.** Notes (HTML subset), tags, hiring-team roles at the **application, job and opening** levels, and recent e-mail messages on the candidate (beta) ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**

### 4. Platform

- **API.**
  - **RPC-style** `noun.verb` endpoints, all `POST`, on `api.ashbyhq.com`. Authentication is **HTTP Basic with an API key** (key as username), and each key carries **granular permissions**: candidatesRead/Write/Delete, jobsRead/Write, interviewsRead/Write, offersRead/Write, approvalsRead/Write, hiringProcessMetadataRead/Write, organizationRead/Write, apiKeysRead/Write, sourcingWrite.
  - Supports cursor pagination, **incremental sync tokens** and expansions. An `x-on-behalf-of` header attributes actions to a user.
  - About 200 documented operations, several marked **beta / "may not be available for all organizations"** ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt), [A2](https://github.com/konfig-sdks/openapi-examples/blob/main/ashby/openapi.yaml), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
  - Report API limits: **15 requests per minute per organisation**, maximum 3 concurrent report operations ([A7](https://github.com/api-evangelist/ashby/blob/fe0d709/rate-limits/ashby-rate-limits.yml), transcribed from developers.ashbyhq.com/reference/reportsynchronous, accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **Webhooks.** Optional secret with an **`Ashby-Signature: sha256=…`** HMAC header; docs cover retries and "related webhooks" ([A2](https://github.com/konfig-sdks/openapi-examples/blob/main/ashby/openapi.yaml), [A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]** Events:
  - applicationSubmit, applicationUpdate
  - candidateHire, candidateStageChange, candidateDelete, candidateMerge
  - interviewPlanTransition, interviewScheduleCreate, interviewScheduleUpdate
  - jobCreate, jobUpdate
  - jobPostingPublish, jobPostingUnpublish, jobPostingUpdate, jobPostingDelete
  - offerCreate, offerUpdate, offerDelete
  - openingCreate
  - pushToHRIS
  - surveySubmit, where EEOC and diversity answers are **never included** in payloads
  - signatureRequestUpdate
  - takeHomeAssignment\* (beta)
  - ping
- **Integrations.** Assessment partner framework; HRIS push (Workday, BambooHR, ADP); Google Workspace; Slack; Dropbox Sign; Certn; "ATS syncs" (Analytics for other ATSs) ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt), [A3o](https://status.ashbyhq.com/incidents/432p1t42kfz5), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]** Marketplace size: **[UNKNOWN]**.
- **SSO.** **SAML or OIDC SSO** is a **$100/month add-on on Foundations** ([A5](https://github.com/api-evangelist/ashby/blob/fe0d709/plans/ashby-plans-pricing.yml)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]** Whether it is included on higher tiers: **[UNKNOWN]**. SCIM and MFA: **[UNKNOWN]**.
- **RBAC.** Global roles (as of the Nov-2024 spec): **Organization Admin, Elevated Access, Limited Access, External Recruiter**. Hiring-team roles apply at the application, job and opening levels. **Confidential jobs and projects** exist ([A2](https://github.com/konfig-sdks/openapi-examples/blob/main/ashby/openapi.yaml), [A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **Audit logs.** An `auditLog.list` API is in **closed beta with early design partners**. It returns events for all objects, including confidential ones, with a fixed vocabulary of target types and categories ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]** Whether a UI audit log exists and its retention: **[UNKNOWN]**.
- **Customisation.** Custom fields on candidates, applications, openings, jobs and **employees** (users), with selectable-value merges; job templates; interview plans; feedback, offer, referral and survey form definitions ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **Localisation and multi-entity.** A **location hierarchy** with workplace type and candidate-facing external names; departments hierarchy; **multiple brands**; currency types in offer forms ([A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]** Regions: incidents reference **Sydney**, Portland and San Francisco ([A3p](https://status.ashbyhq.com/incidents/l2j8znv3vwgx), [A3q](https://status.ashbyhq.com/incidents/5c5bvpj9rh20), accessed 2026-09-25). This suggests an Australian hosting region. **[INFERENCE]** EU residency and UI languages: **[UNKNOWN]**.
- **Reporting.** Analytics with saved dashboards, sold standalone as "Ashby Analytics" for other ATSs; report API (beta) ([A5](https://github.com/api-evangelist/ashby/blob/fe0d709/plans/ashby-plans-pricing.yml), [A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **AI.**
  - (a) **AI Application Review**: criteria evaluations with outcome plus reasoning.
  - (b) **AI Notetaker** add-on, with tier-dependent transcript retention.
  - (c) **Fraud checks** with a human-set review status.
  - Plans include monthly "credits" whose use is **[UNKNOWN]**.
  - When Ashby was down on 2026-06-01, "AI features are enabled again" appeared as a separate recovery step ([A3r](https://status.ashbyhq.com/incidents/cmqhn7vxbn8d), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
  - Candidate opt-out and bias-audit statements: **[UNKNOWN]**.
  - Engineering: "more than half of Ashby's new production code has been AI-generated" since August 2025 ([A4](https://www.ashbyhq.com/blog/engineering/ai-ashby-engineering-and-the-future), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **Privacy.** `candidate.anonymize` (the Nov-2024 docs say it is irreversible and needs all applications archived or hired); **Candidate Data Consent** surveys ([A2](https://github.com/konfig-sdks/openapi-examples/blob/main/ashby/openapi.yaml), [A1](https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt)). **[SOURCE CLAIM · vendor text · third-party GitHub copy]**
- **Mobile and accessibility (VPAT):** **[UNKNOWN]**.
- **Security and compliance.** A trust centre at trust.ashbyhq.com mentions **SOC 2** ([A6](https://github.com/api-evangelist/ashby/blob/fe0d709/security/ashby-trust-center.yml), third-party keyword probe, accessed 2026-09-25). **[SOURCE CLAIM · third-party GitHub dataset (probe)]** Other certifications: **[UNKNOWN]**.

### 5. Business

Ashby publishes a partial price list. Prices below were transcribed from https://www.ashbyhq.com/pricing on 2026-09-20 by a third party with a stated "verbatim" grounding check ([A5](https://github.com/api-evangelist/ashby/blob/fe0d709/plans/ashby-plans-pricing.yml), accessed 2026-09-25). **[SOURCE CLAIM · vendor text · third-party GitHub copy; re-verify on the live page before quoting]**

| Plan | Published price | Stated sizing and quotas |
|---|---|---|
| All-In-One **Foundations** | **$400/month** (varies with a company-size selector) | Up to 100 employees; 1,000 outbound messages/month; 1,500 credits/month; 200 sourcing e-mail lookups |
| All-In-One **Plus** | Get in touch | 101–1,000 employees; 2,000 outbound messages and 2,500 credits per seat per year |
| All-In-One **Enterprise** | Get in touch | 1,000+ employees; 3,000 outbound messages and 12,500 credits per seat per year |
| **Ashby Analytics** (for your existing ATS) | Get in touch; usage-based | 100+ employees |
| Add-ons | **SSO $100/month** (Foundations); **SMS $90 per 1,000** messages; **AI Notetaker** add-on (price **[UNKNOWN]**) | — |

- **Enterprise positioning.** Per-seat quotas on higher tiers; approval definitions that an HRIS can own through the API; confidential jobs and projects; openings and headcount. **[INFERENCE]**

### 6. Independent perspective

- **[UNKNOWN] for credible independent sources in this pass.** Leads surfaced by search but not read:
  - data aggregators: Tracxn, Preqin, Crunchbase;
  - weak/lead: competitor and SEO pricing reviews (dover.com, pin.com) and a revenue estimate (getlatka.com).
  None are cited as evidence of strengths or complaints.
- **Operational signal (vendor-published).** The 2026 status history includes:
  - full unavailability on 2026-06-01;
  - Cloudflare-related interruptions in three regions;
  - AI Notetaker outages caused by an upstream provider;
  - Dropbox Sign e-signature degradations;
  - a scheduling defect that let candidates book unavailable interviewers (2026-03-24/27);
  - resume-parsing and bulk-import degradations.
  ([A3](https://github.com/api-evangelist/ashby/tree/fe0d709/blogs), accessed 2026-09-25) **[SOURCE CLAIM · vendor text · third-party GitHub copy]** The dependency on third parties for AI transcription and e-signature is visible. **[INFERENCE]**

### 7. Lessons for OpenCATS 2.0

**Product principles evidenced** **[INFERENCE]**
- *Headcount is not a job.* **Openings** are separate objects linked to jobs and locations, and jobs follow an explicit **state machine**. Validation happens at transitions: publishing requires compensation where the org mandates it, and opening a job requires approval validation.
- *Interviewer capacity is modelled.* Pools, pauses and load limits are data, not tribal knowledge.
- *Every AI output carries its reasoning,* and a human owns the final fraud and review state.
- *Sensitive survey data is walled off.* EEOC and diversity answers are never sent in webhooks.

**Patterns worth learning from** **[RECOMMENDATION]**
- A **job/opening state machine with transition validators** (Draft → Open → Closed → Archived) replaces OpenCATS's free-string job-order statuses and the `'OnHold'` typo class of bugs (`FEATURE_INVENTORY.md` FEAT-008; `lib/JobOrderStatuses.php:55`). It pairs with requisitions and approvals (GAP-008).
- **Interviewer pools, pauses and weekly/daily limits** in the scheduling domain (GAP-006).
- **Survey types as a product primitive** (candidate experience, consent, EEOC/diversity), with a hard rule that protected-class data never leaves via integrations. OpenCATS's EEO capture is currently wrong and unprotected (`UX_UI_AUDIT.md` UX-004; GAP-002).
- **Fraud and identity checks with a human-set status**, plus stored apply-time client info. This matters because OpenCATS's careers identity is currently unsafe (`FEATURE_INVENTORY.md` FEAT-005; GAP-012).
- **API keys with granular, named permission scopes** and `on-behalf-of` attribution (GAP-004, GAP-011); **incremental sync tokens** for integrators.
- **Pay-transparency enforcement at publish** (a posting cannot go live without a compensation tier if policy requires it); relevant to GAP-012 and GAP-015.

**Things NOT to copy** **[RECOMMENDATION]**
- **SSO as a paid add-on** on the entry tier. For OpenCATS, SSO and MFA should be baseline security (`PRODUCT_GAPS.md` GAP-001, CRITICAL), not an upsell.
- **An RPC-style, all-POST API.** It is readable, but it forgoes HTTP semantics (GET caching, idempotent PUT/DELETE) that OpenCATS's planned OpenAPI 3.1 REST design assumes (`EXECUTIVE_SUMMARY.md` §9). **[INFERENCE]**
- **Credit and quota packaging** (messages, credits, lookups), which makes cost hard to predict. **[INFERENCE]**
- **Many capabilities in beta for only some organisations** (audit log, HRIS push, sequences). The audit log in particular should be GA and default in OpenCATS (GAP-011).

### Sources

1. [A1] https://github.com/api-evangelist/ashby/blob/fe0d709/llms/ashby-llms.txt — harvested copy of Ashby's official developer-docs index (llms.txt; links and descriptions point to https://developers.ashbyhq.com/…) — vendor docs via third-party GitHub copy (API Evangelist, commit `fe0d709`, 2026-09-24) — accessed 2026-09-25
2. [A2] https://github.com/konfig-sdks/openapi-examples/blob/main/ashby/openapi.yaml — Konfig's third-party GitHub copy of Ashby's public OpenAPI spec (commit `161ab49`, 2024-11-24; descriptions and permission links match Ashby docs) — vendor docs via third-party GitHub copy — accessed 2026-09-25
3. [A3] https://github.com/api-evangelist/ashby/tree/fe0d709/blogs — third-party GitHub copy (API Evangelist) of Ashby status page (https://status.ashbyhq.com/history.atom) and blog; individual incidents: [A3a] https://status.ashbyhq.com/incidents/ptyhw200t4q3 · [A3b] https://status.ashbyhq.com/incidents/j37fvr23yk99 · [A3c] https://status.ashbyhq.com/incidents/ns6917dzn3wx · [A3d] https://status.ashbyhq.com/incidents/s0b9nqqlsbyj · [A3e] https://status.ashbyhq.com/incidents/y1mjwlfbwzjz · [A3f] https://status.ashbyhq.com/incidents/b7brn6b513lv · [A3g] https://status.ashbyhq.com/incidents/kjc9gy80z0lv · [A3h] https://status.ashbyhq.com/incidents/svyjmsmtfw4y · [A3i] https://status.ashbyhq.com/incidents/2xv8fnj5xqn0 · [A3j] https://status.ashbyhq.com/incidents/j9spr38mq0vs · [A3k] https://status.ashbyhq.com/incidents/hylb70lfxpsc · [A3l] https://status.ashbyhq.com/incidents/d5yyysn0rzlw · [A3m] https://status.ashbyhq.com/incidents/cjp5py7sqckd · [A3n] https://status.ashbyhq.com/incidents/mnjy854tn032 · [A3o] https://status.ashbyhq.com/incidents/432p1t42kfz5 · [A3p] https://status.ashbyhq.com/incidents/l2j8znv3vwgx · [A3q] https://status.ashbyhq.com/incidents/5c5bvpj9rh20 · [A3r] https://status.ashbyhq.com/incidents/cmqhn7vxbn8d — vendor status page via third-party GitHub copy — accessed 2026-09-25
4. [A4] https://www.ashbyhq.com/blog/engineering/ai-ashby-engineering-and-the-future — Ashby engineering blog (vendor, via third-party GitHub copy; summary only) — accessed 2026-09-25
5. [A5] https://github.com/api-evangelist/ashby/blob/fe0d709/plans/ashby-plans-pricing.yml — third-party transcription of https://www.ashbyhq.com/pricing (dated 2026-09-20, "every price_text found verbatim") — accessed 2026-09-25
6. [A6] https://github.com/api-evangelist/ashby/blob/fe0d709/security/ashby-trust-center.yml — third-party keyword probe of https://trust.ashbyhq.com/ — accessed 2026-09-25
7. [A7] https://github.com/api-evangelist/ashby/blob/fe0d709/rate-limits/ashby-rate-limits.yml — third-party transcription of https://developers.ashbyhq.com/reference/reportsynchronous — accessed 2026-09-25
8. [A8] https://www.ashbyhq.com/blog/culture/series-d — Ashby blog "Announcing Ashby's $50 Million Series D" (vendor; title seen in search results only) — accessed 2026-09-25
9. [A9a] https://tracxn.com/d/companies/ashby/__hzSC-b0F7MQYYHj8ElwlD-CZAzAkkXzZNTco38f78JM · [A9b] https://www.preqin.com/data/profile/asset/ashby-inc-/508677 · [A9c] https://www.crunchbase.com/organization/ashby — data aggregators (search excerpts only) — accessed 2026-09-25
10. [A10] https://www.dover.com/blog/ashby-ats-review-pricing-alternatives · https://www.pin.com/blog/ashby-pricing/ · https://getlatka.com/companies/ashbyhq.com — competitor/SEO/estimate pages (weak/lead; not relied on) — accessed 2026-09-25


# Part B — SmartRecruiters, Workable, Recruitee, Jobvite


*Prepared 2026-09-25 for OpenCATS 2.0 Phase 2. All citations: accessed 2026-09-25.*

## Method, evidence grades and verification status (read first)

**Access constraints on this research run.**
- Direct fetching of vendor, press, review-aggregator and analyst websites was blocked by the environment's egress policy. The blocked hosts included www.smartrecruiters.com, developers.smartrecruiters.com, help.workable.com, www.workable.com, workable.readme.io, recruitee.com, support.recruitee.com, docs.recruitee.com, www.jobvite.com, news.sap.com, community.sap.com, learning.sap.com, g2.com, capterra.com, trustradius.com, gartner.com, businesswire.com and globenewswire.com. No archive, reader or proxy service was used to get around the block.
- The shared WebSearch budget ran out partway through this assignment, after 27 searches by this agent. As a result:
  - SmartRecruiters is covered in depth.
  - Workable, Recruitee and Jobvite are covered from a much thinner evidence base.
  - Many items in those three sections are **[UNKNOWN]** and are listed in the Appendix (verification backlog).
- `github.com` was reachable. It was used for official vendor GitHub organisations and for two public third-party GitHub datasets, cloned read-only into the scratchpad:
  - `api-evangelist/<vendor>` contains third-party API profiles. These hold copies of vendor RSS/blog/status-page items (each with its original URL), homepage screenshots captured 2026-06-20, and harvested `llms.txt` indexes of vendor developer docs.
  - `jentic/jentic-public-apis` contains third-party-hosted copies of vendor OpenAPI definitions.

  These datasets were not fetched through any proxy. However, they are *copies* of vendor content, so every claim that depends on them carries the label **third-party GitHub copy**, and the lead can strip them with a single grep if they are judged to fall under the "no mirrors" rule.
- API Evangelist's `plans/*.yml` (pricing) and `rate-limits/*.yml` files state that they are *"generated … not harvested from the provider"*. They were **not used**.

**Evidence grades** (per PREAMBLE addendum):
- **[FACT]**: read directly (our repo; official vendor GitHub repositories; pages actually fetched).
- **[SOURCE CLAIM · vendor · search excerpt]**: text seen only in a WebSearch result excerpt from an official vendor domain. The same applies to `learning.sap.com` / `news.sap.com` for SmartRecruiters, since SAP is the parent.
- **[SOURCE CLAIM · independent · search excerpt]**: the same, for independent sources.
- **[SOURCE CLAIM · vendor · third-party GitHub copy]**: vendor-authored text or specs preserved in a third-party GitHub dataset, with the original vendor URL cited.
- **[SOURCE CLAIM · independent · GitHub]**: an independent third party's own assessment hosted on GitHub.
- **[INFERENCE]**, **[RECOMMENDATION]**, **[UNKNOWN]** are used as in the PREAMBLE. *"Title only"* means only a result title was seen and the content was not read.

**Verification status.** Every claim sourced from a search excerpt or a third-party GitHub copy **must be verified in a browser before external publication**. That applies to almost every vendor claim in this file. Prices are reported only where a source showed them, and each price is labelled accordingly.

---

## SmartRecruiters (SmartRecruiters Inc., an SAP company; parent SAP SE)

### 1. Snapshot
- **Ownership (verified via current sources).**
  - SAP and SmartRecruiters announced on **1 Aug 2025** that SAP had agreed to acquire SmartRecruiters, with close expected in Q4 2025 subject to regulatory approvals. **[SOURCE CLAIM · vendor · search excerpt]** ([SAP News, Aug 2025](https://news.sap.com/2025/08/sap-to-acquire-smartrecruiters/); [SmartRecruiters news](https://www.smartrecruiters.com/news/sap-to-acquire-smartrecruiters/), accessed 2026-09-25)
  - SAP **completed the acquisition on 11 Sep 2025**. The price was not disclosed. **[SOURCE CLAIM · vendor · search excerpt]** ([SAP News Center](https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/); [SmartRecruiters press release](https://www.smartrecruiters.com/news/sap-completes-acquisition-of-smartrecruiters/), accessed 2026-09-25). The same release text, datelined "SAN FRANCISCO, USA — September 11, 2025", is preserved in a third-party GitHub copy of SmartRecruiters' news feed. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Several SEO pricing blogs cite a "$1.8 billion" price. This contradicts the official non-disclosure. **[UNKNOWN]**: treat as unverified.
  - The brand is now "SmartRecruiters, an SAP company" (seen in the homepage logo and in press releases from Nov 2025 and Feb 2026). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Standalone continuity.** "SmartRecruiters customers will maintain the flexibility to continue using SmartRecruiters solutions with SAP or other HCM solutions." **[SOURCE CLAIM · vendor · search excerpt]** ([SAP News Center](https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/), accessed 2026-09-25)
- **HQ / founding / employees.** Press releases carry a San Francisco dateline. **[SOURCE CLAIM · vendor · third-party GitHub copy]** Founding year and headcount were **[UNKNOWN]** (not verified this session).
- **Scale.** "More than 4,000 organizations, including Amazon, Visa, and McDonald's." **[SOURCE CLAIM · vendor · search excerpt]** ([SAP News Center](https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/), accessed 2026-09-25)
- **Positioning.**
  - Homepage (June 2026 capture): "AI-Powered Hiring Platform That Delivers Results — Intelligent recruiting software for enterprise organizations—whether you're hiring at scale or managing complex talent acquisition needs." **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([api-evangelist/smartrecruiters screenshot of smartrecruiters.com](https://github.com/api-evangelist/smartrecruiters), accessed 2026-09-25)
  - Press releases style the company "The Recruiting AI Company".
  - The June 2025 launch claimed its new platform "marks the end of the traditional Applicant Tracking System". **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([SmartRecruiters news, 10 Jun 2025](https://www.smartrecruiters.com/news/smartrecruiters-unveils-ai-powered-platform-that-ends-the-ats-era/), accessed 2026-09-25)
- **Target customer.**
  - Enterprise, global, and explicitly high-volume. SAP cited "deep expertise in high-volume recruiting, recruitment automation and AI-enabled candidate experience". **[SOURCE CLAIM · vendor · search excerpt]** ([SAP News, Aug 2025](https://news.sap.com/2025/08/sap-to-acquire-smartrecruiters/), accessed 2026-09-25)
  - Retail and hospitality peak-season hiring is a recurring theme. **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([news, 9 Jun 2025](https://www.smartrecruiters.com/news/high-volume-hiring-where-speed-meets-stickiness/), accessed 2026-09-25)
  - The recruiting model is corporate TA plus high-volume/hourly. Agency-specific features are **[UNKNOWN]**.
- **Suite composition.** All of the following are **[SOURCE CLAIM · vendor · search excerpt]** unless noted:
  - SmartRecruit (ATS)
  - SmartCRM ([CRM page](https://www.smartrecruiters.com/recruiting-software/recruitment-crm/))
  - SmartMessage for SMS and WhatsApp ([text recruiting](https://www.smartrecruiters.com/recruiting-software/text/))
  - SmartAttrax career sites
  - SmartDistribute job multiposting and SmartJobs programmatic advertising ([job posting](https://www.smartrecruiters.com/recruiting-software/job-posting/); [SmartJobs sheet](https://www.smartrecruiters.com/resources/landing/smartjobs-product-sheet/))
  - SmartOnboard (it has a public API; see §4)
  - SmartSandbox (title only: [Mar 2026 release notes](https://www.smartrecruiters.com/resources/article/march-2026-product-release-highlights-big-things-just-landed-in-winston-match-and-smartsandbox/))
  - The Winston AI family (Screen, Match, Chat, Companion, Interview; see §4)
  - The Marketplace
  - A separate SAP edition, **"SmartRecruiters for SAP SuccessFactors"**, is shipped in SAP's 1H 2026 release (title only: [SAP asset](https://www.sap.com/assetdetail/2026/05/4a5594c9-507f-0010-bca6-c68f7e60039b.html)). All accessed 2026-09-25.
- **SAP integration roadmap.** **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Community roadmap](https://community.sap.com/t5/human-capital-management-blog-posts-by-sap/the-smartrecruiters-and-sap-successfactors-integration-roadmap/ba-p/14345532); [SAP News, Mar 2026](https://news.sap.com/2026/03/smartrecruiters-for-sap-successfactors-ai-driven-hiring-connected-hcm/), accessed 2026-09-25)
  - **Phase 1 "Foundations" (H1 2026; delivered March 2026):** SSO via SAP IAS, a unified UI, User Sync, Configuration/Foundation Data Sync and initial Job Sync.
  - **Phase 2 (H2 2026):** Hire Sync into Employee Central and Onboarding.
  - **Phase 3:** coordinated AI assistants (SAP Joule + Winston).

### 2. Workflows
*Primary documentation seen: SAP Learning "SmartRecruiters for SAP SuccessFactors Academy" (official SAP training), SmartRecruiters developer docs, and SmartRecruiters product pages. All were seen via search excerpts, except where the API definitions were read from a third-party GitHub copy.*

- **Requisition creation.**
  - Jobs carry **positions/headcount**. There are endpoints for `/jobs/{id}/positions` and `/jobs/{id}/headcount`, audit events `POSITION_CREATED`, `POSITION_ASSIGNED` and `CANCEL_NOT_FILLED_POSITION`, and a changelog entry "Jobs API – Expose hiringManagerId on position endpoints". **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([jentic copy of SmartRecruiters OpenAPI](https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/smartrecruiters.com/smartrecruiters/201911.1); [developer-docs llms.txt index copy](https://github.com/api-evangelist/smartrecruiters), accessed 2026-09-25)
  - Job fields are admin-defined "job properties" with **dependent values**. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Job templates exist (course title "Creating Job Templates"). **[SOURCE CLAIM · vendor · search excerpt]**
  - In the SAP edition, jobs sync from SuccessFactors. **[SOURCE CLAIM · vendor · search excerpt]**
  - *Who acts:* recruiter or hiring manager, per role permissions.
  - *Friction:* the steps for creating a requisition are **[UNKNOWN]**.
- **Job approval.**
  - Approvals are a first-class API object:
    - create a request, list pending requests where the caller is an approver, approve or reject by ID, and comment
    - fetch the latest approval for a job
    - webhook events `job.approval.created/approved/rejected/abandoned` and `job.approval.step.approved/rejected`, plus `job.approver.skipped` and `job.approver.delegated`
    - audit events for approval delegation from and to users
  - **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([jentic copy](https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/smartrecruiters.com/smartrecruiters/201911.1); reference page titles "Approve the approval request by id", "Get latest approval request for given job" on [developers.smartrecruiters.com](https://developers.smartrecruiters.com/reference/jobsapprovalslatest-1), accessed 2026-09-25)
  - *Decision points:*
    - the chain type (ordered steps vs. all approvers at once)
    - approve or reject at each step
    - skip or delegate
  - A practitioner guide exists (title only: [SAP Community member blog "Job Approval in SmartRecruiters"](https://community.sap.com/t5/human-capital-management-blog-posts-by-members/job-approval-in-smartrecruiters-overview-features-and-configuration-guide/ba-p/14349246)).
- **Job publishing / distribution.**
  - Jobs have one or more **job ads**, published to boards as "publications"/"postings". The API can publish the default job ad, publish a specific ad, and list an ad's publications. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - SmartDistribute: "post to 300+ boards, track performance, and centralize all job board contracts". **[SOURCE CLAIM · vendor · search excerpt]** ([job posting page](https://www.smartrecruiters.com/recruiting-software/job-posting/), accessed 2026-09-25)
  - SmartJobs is managed programmatic advertising that "takes a percentage management fee of existing job advertising budget". **[SOURCE CLAIM · vendor · search excerpt]** ([SmartJobs product sheet](https://www.smartrecruiters.com/resources/landing/smartjobs-product-sheet/), accessed 2026-09-25)
  - A partner **Job Board API** and a public **Posting API** for career sites are documented. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Sourcing / CRM.**
  - SmartCRM builds talent pools "organized around specific hiring needs, skills sets, or shared characteristics". It runs "rule-based drip campaigns" and HTML e-mail campaigns, and is described as "100% native CRM + ATS built on one system" with a single candidate record. **[SOURCE CLAIM · vendor · search excerpt]** ([SmartCRM](https://www.smartrecruiters.com/recruiting-software/recruitment-crm/), accessed 2026-09-25)
  - The "agentic CRM" was announced in April 2026. **[SOURCE CLAIM · vendor · search excerpt]** ([GlobeNewswire, 7 Apr 2026](https://www.globenewswire.com/news-release/2026/04/07/3269187/0/en/SmartRecruiters-Introduces-the-Future-of-Hiring-From-AI-Agents-to-Autonomous-Talent-Acquisition.html), accessed 2026-09-25)
  - Source values are configurable (`/configuration/sources`). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - An employee-referral workflow is **[UNKNOWN]**.
- **Candidate intake / application.**
  - The Application API supports:
    - "Get Application Screening Questions and Privacy Policies"
    - "Post an Application"
    - "Get Candidate Application Status"
    - a changelog item "Application API – AI settings and AI disclosure"

    **[SOURCE CLAIM · vendor · third-party GitHub copy]** (developer-docs index)
  - Winston Chat "answers questions but also recommends jobs, screens candidates, and schedules interviews — all without leaving the chat". The vendor claims "two-times increase in candidate conversion" and "35 percent increase in mobile application completions". **[SOURCE CLAIM · vendor · search excerpt]** ([Winston](https://www.smartrecruiters.com/winston/); [AI chatbot](https://www.smartrecruiters.com/recruiting-software/ai-chatbot/), accessed 2026-09-25)
  - Candidate consent requests are handled through the API (see §4).
  - *Apply-flow length (number of fields/steps):* **[UNKNOWN]**.
- **Screening.**
  - **Knockout questions:**
    - any yes/no or dropdown question except diversity questions can be a knockout
    - the knockout setting is configured per question set, and questions can also branch
    - candidates who choose a knockout answer are **auto-rejected**, with the default reason "Did not meet screening requirements"
    - as an alternative, recruiters can **filter by screening answers and bulk-reject**

    **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Learning: Creating Rejection Screening Questions](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-rejection-screening-questions_ed2425b9-fd44-4e3d-ab8b-e96adca1c225), accessed 2026-09-25)
  - **Winston Screen** "uses AI to generate screening questions, evaluate candidates' responses to job related criteria, and automatically ranks them into a shortlist". It offers graded control, from "one-click question automation and rank weighting" to "full control with editing". The vendor claims "~48% faster time to interview". **[SOURCE CLAIM · vendor · search excerpt]** ([Winston](https://www.smartrecruiters.com/winston/), accessed 2026-09-25)
  - **Winston Interview**, an "on-demand agentic interviewer for first-round screening", was announced along with assessments embedded in chat and "applicant fraud detection" (April 2026). **[SOURCE CLAIM · vendor · search excerpt]**
  - The third-party assessment order/results APIs exist. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Pipeline progression.**
  - A **hiring process** consists of stages plus steps. The default stages are **New, In-Review, Interview, Offer**. Admins add standard or custom **steps** within In-Review, Interview and Offer. **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Learning: Managing Hiring Processes](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/managing-hiring-processes), accessed 2026-09-25)
  - **Workflow rules are attached to a step** and apply to all jobs using that step. Automated actions are:
    - move a candidate forward
    - send messages
    - auto self-schedule
    - auto-reject
    - invite to hiring events

    Task-creating rules are:
    - "Coordinate interview"
    - "Send self-schedule"
    - "Candidate interview reminder" (follow up after N days)
    - "Collect interview feedback"

    **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Learning: Creating Workflows for Hiring](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-workflows-for-hiring), accessed 2026-09-25)
  - Multiple hiring processes can be configured (`/configuration/hiring-processes`), and status history is exposed per application. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Interviews / scheduling.**
  - "Scheduling Automation" and candidate **self-scheduling** cover individual and group interviews.
  - **Slot management** allows "up to 100 participants per interview event"; a slot stays open until capacity is reached.
  - Calendar integrations cover **Google Calendar and Microsoft 365**. Interviewers set availability windows and out-of-office periods.

  **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Learning: Scheduling Automation](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/automating-interview-scheduling-with-scheduling-automation); [help: Slot Management with calendar integration](https://help.smartrecruiters.com/Interviewing_and_Hiring/Reviewing_and_interviewing_candidates/Schedule_an_interview/Slot_Management_with_calendar_integration), accessed 2026-09-25)
  - The API covers interview types, interview templates with **interviewer pools**, automated self-schedule, re-schedule requests, and interviewer and candidate timeslot statuses. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Scorecards / interview kits.**
  - An admin **Scorecard Criteria Library** holds the criteria.
  - **Org-field filters auto-attach criteria at job creation.** For example, "Programming Skills" is added to every job where Department = Engineering.
  - Interviewers rate each criterion on 1–5 stars. Scorecards "guide interviewers with specific criteria and questions".

  **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Learning: Creating Interview Scorecards](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-interview-scorecards), accessed 2026-09-25)
  - A Reviews API exposes `review.created/updated/deleted` webhooks. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Feedback & debrief / decision.**
  - "Collect interview feedback" tasks are assigned to interviewers.
  - Hiring-team roles can be granted or denied "read access to reviews".

  **[SOURCE CLAIM · vendor · search excerpt]**
  - Winston Companion "prompts feedback, suggests next steps, summarizes candidates". **[SOURCE CLAIM · vendor · search excerpt]** ([hiring assistant](https://www.smartrecruiters.com/recruiting-software/hiring-assistant/), accessed 2026-09-25)
  - A dedicated debrief/decision screen and whether feedback is hidden until submitted are both **[UNKNOWN]**.
- **Offers.**
  - Offer approvals can be company-wide or vary by job, brand and so on. Approvers are notified by e-mail and can approve from the e-mail or in-app. Offers that need approval "cannot be sent to the candidate until approved". Approvers must be on the hiring team. **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Learning: Creating Offer Approvals](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-offer-approvals), accessed 2026-09-25)
  - The offer approval flow has three phases: request, approve, then extend. **[SOURCE CLAIM · vendor · search excerpt]**
  - Offer templates support **DocuSign** signature and date fields, and candidates can sign on any device. DocuSign became an ISV reseller partner in Sept 2024. **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Learning: DocuSign](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/integrating-offer-templates-with-docusign); [press release](https://www.smartrecruiters.com/news/smartrecruiters-partners-with-docusign-to-streamline-recruitment-process-for-businesses/), accessed 2026-09-25)
  - The API has offer properties (custom offer fields), offer documents, and submit/withdraw. Audit events include `OFFER_ACCEPTED` and `OFFER_DECLINED`. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Hire / hand-off.**
  - The SmartOnboard public API covers onboarding processes, assignments and onboarding status, plus a `new-hires` resource. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - SuccessFactors Hire Sync is planned for H2 2026. **[SOURCE CLAIM · vendor · search excerpt]**
  - An Enboarder partnership on AI onboarding was announced in Sept 2025 (title/lede only). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Rejection.**
  - A **reason is required**, chosen from standard or custom reasons. A rejection e-mail template is optional and can be sent **now or scheduled for later**.

  **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Learning: Managing Candidate Applications](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/managing-candidate-applications), accessed 2026-09-25)
  - **Withdrawal reasons** are a separate configurable list. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Bulk rejection is available through filters (see Screening).
- **Talent pools / rediscovery.**
  - SmartCRM pools (see Sourcing).
  - Winston Match "identifies the best candidates for your roles and offers up proactive suggestions". It scores applicants on a four-star scale "with explainability included", and since April 2026 gives detailed scoring across education, skills and experience. **[SOURCE CLAIM · vendor · search excerpt]** ([talent matching](https://www.smartrecruiters.com/recruiting-software/talent-matching/), accessed 2026-09-25)
- **High-volume specifics.** **[SOURCE CLAIM · vendor · search excerpt]**
  - hiring-event invitations as a workflow action
  - group slots of up to 100 participants
  - SMS/WhatsApp via SmartMessage ("reach 10X potential candidates instantly … automate self-scheduling and confirmations")
  - chat-based screening with auto-reject or auto-advance

### 3. User experience
- **Recruiter home/dashboard:** **[UNKNOWN]**. The homepage marketing mock-up shows a candidate card with "Highlights" (years of experience, matched skills, distance, availability) and one-click **Pass / Interview** buttons. **[SOURCE CLAIM · vendor · third-party GitHub copy]** (screenshot; marketing art, not verified product UI)
- **Hiring manager:**
  - Job-scoped **hiring-team roles** (see §4) and approval directly from e-mail. **[SOURCE CLAIM · vendor · search excerpt]**
  - Winston Companion is "available within Slack, Microsoft Teams, SMS, WhatsApp, desktop, and mobile". **[SOURCE CLAIM · vendor · search excerpt]**
  - A native mobile app is **[UNKNOWN]** (not verified this session).
- **Interviewer:**
  - Feedback tasks, scorecards with criteria and questions, and calendar-integrated scheduling. **[SOURCE CLAIM · vendor · search excerpt]**
  - Reminder cadence for interviewers is **[UNKNOWN]**.
- **Candidate:**
  - Conversational apply and screening via Winston Chat on the career site, SMS or WhatsApp, in multiple languages. **[SOURCE CLAIM · vendor · search excerpt]**
  - Self-scheduling links. **[SOURCE CLAIM · vendor · search excerpt]**
  - Localized SmartAttrax career sites (title only: [Jan 2026 release notes](https://www.smartrecruiters.com/resources/article/january-2026-product-release-highlights-faster-hiring-with-winston-companion-and-localized-smartattrax-experiences/)).
  - Application status is available to partner apply flows via the API. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - A candidate portal is **[UNKNOWN]**.
- **Navigation / IA:**
  - API top-level objects are Jobs (with job ads, positions, hiring team, notes), Candidates/Applications, Offers, Interviews, Reviews, Approvals, Messages, Reports, Users/Access groups/System roles, and Configuration. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - The UI menu structure is **[UNKNOWN]**.
- **Search / filter / bulk:**
  - Filtering by screening answers plus bulk reject. **[SOURCE CLAIM · vendor · search excerpt]**
  - Searches are audited (`SEARCH` audit event). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Saved views are **[UNKNOWN]**.
- **Profile / timeline / collaboration:**
  - Tags, attachments, status history, and messages "shared" with users. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Automated e-mail notifications are configurable (course title "Configuring Automated Email Notifications"). **[SOURCE CLAIM · vendor · search excerpt]**
  - @mention syntax is **[UNKNOWN]**.

### 4. Platform
- **API.** REST, documented at [developers.smartrecruiters.com](https://developers.smartrecruiters.com/docs/authentication) (blocked; seen via excerpts).
  - Auth options:
    - **API key** (`x-smarttoken`): a 32-character key generated by an Administrator that grants access to *all* APIs and is recommended for testing
    - **OAuth 2.0 client credentials**, scoped and recommended for live apps
    - an authorization-code flow for partners

    **[SOURCE CLAIM · vendor · search excerpt]** ([API Key](https://developers.smartrecruiters.com/docs/authentication-api-key); [OAuth 2.0](https://developers.smartrecruiters.com/docs/oauth-20), accessed 2026-09-25)
  - About 35 OAuth scopes exist, for example `approvals_decide`, `audit_events_read`, `candidates_offers_read`, `reporting_write` and `webhooks_manage`.
  - The developer docs also cover rate-limiting, throttling, deprecation/sunset policy, breaking changes and public IP addresses.

  **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Webhooks.**
  - A subscription API delivers about 47 event types, including `job.*`, `position.*`, `application.status.updated`, `application.screening-answers.*`, `candidate.deleted`, `offer.approval.step.*`, `review.*` and `onboarding.*`.
  - Callbacks are **signed**: a `smartrecruiters-signature` header plus a `smartrecruiters-timestamp` header.
  - **Secret rotation:** a new key deprecates the old one, which stays valid for 24 hours, and up to 16 non-expired keys are allowed.

  **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - An official demo client exists: `smartrecruiters/sr-webhooks-client`, now archived. **[FACT]** ([github.com/smartrecruiters](https://github.com/smartrecruiters), accessed 2026-09-25)
- **Marketplace.** Counts are inconsistent across vendor pages ("350+", "575+", "600+"). **[SOURCE CLAIM · vendor · search excerpt]** ([marketplace](https://www.smartrecruiters.com/recruiting-software/marketplace/), accessed 2026-09-25)
- **SSO.**
  - SAML Web SSO, including Single Logout when the IdP sends a SessionIndex. SSO users are created and activated through the Users API, and the `ssoIdentifier` must match exactly (case-sensitive). **[SOURCE CLAIM · vendor · search excerpt]** ([Web SSO overview](https://developers.smartrecruiters.com/docs/websso-overview), accessed 2026-09-25)
  - SAP IAS is used for the SuccessFactors edition. **[SOURCE CLAIM · vendor · search excerpt]**
  - Audit events for SSO configuration changes exist (changelog). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **SCIM.** **[UNKNOWN]**. No SCIM endpoint appeared in the developer-docs index. Provisioning uses the Users API, and third-party IdP connectors (for example, OneLogin) advertise provisioning. **[SOURCE CLAIM · independent · search excerpt]**
- **MFA.** **[UNKNOWN]**. **[INFERENCE]** MFA is typically delegated to the IdP under SSO.
- **RBAC.**
  - **System roles** (global): Admin, Extended, Standard, Basic and Employee, plus custom system roles.
    - Extended equals Admin minus system and company settings, and cannot build reports in Report Builder.
    - Synced users default to Employee, which limits them to the Employee Portal.
  - **Hiring-team roles** (job-scoped): Executive, Hiring Manager, Recruiter, Coordinator and Interviewer, **plus up to 5 custom roles**. Permissions are configurable per role, for example read candidate, write offers and compensation, read reviews, or no stage advancement.
  - Delegated administrators and **access groups** also exist.

  **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Learning: system roles](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/assigning-default-system-roles-and-creating-custom-system-roles_fcc18ab2-7751-493c-bc12-0525f36cb800); [hiring team roles](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-hiring-team-roles), accessed 2026-09-25)
- **Audit logs.** The **Audit API** is Administrator-only. Data is "retained at least 26 months", and the default query window is 7 days. There are about 75 event types, including:
  - authentication success/failure, password reset, role change, API-key renewal, credential creation/revocation, and OAuth app access granted
  - **`SEARCH`** and **`CANDIDATE_PROFILE_OPENED`** (read access is audited)
  - `CANDIDATE_EEO_FILLED` and merge events
  - approval steps and delegations
  - job-property changes
  - **`CUSTOMER_REPORT_DOWNLOADED`**
  - logout events

  **[SOURCE CLAIM · vendor · third-party GitHub copy]** (developer-docs index and API definition)
- **Customization.** Job, candidate and offer properties (with dependent values), application fields, multiple hiring processes, custom steps, custom roles, and e-mail/communication templates. **[SOURCE CLAIM · vendor · search excerpt / third-party GitHub copy]**
- **Localization.**
  - Localized career sites and multilingual Winston agents. **[SOURCE CLAIM · vendor · search excerpt]**
  - **Country-specific custom data scopes** are available via the API. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - The number of UI languages and multi-currency handling are **[UNKNOWN]**. A partner "Money" object exists, suggesting currency-aware amounts. **[INFERENCE]**
  - Multi-brand is referenced for offer approvals. **[SOURCE CLAIM · vendor · search excerpt]**
- **Reporting.** Report Builder. **[SOURCE CLAIM · vendor · search excerpt]** Reporting API: list reports, generate ad-hoc reports, download report files. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Automation.** Step-bound workflow rules, scheduling automation, and knockout auto-reject (see §2).
- **AI.** The Winston family (Screen, Match, Chat, Companion, Interview), agentic CRM and fraud detection. **[SOURCE CLAIM · vendor · search excerpt]**
  - *Human-in-the-loop:* graded automation in Screen, and "explainability included" in Match. **[SOURCE CLAIM · vendor · search excerpt]**
  - An API field for **"AI settings and AI disclosure"** exists in the Application API. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Bias-audit statements (for example, NYC LL 144) and AI opt-out are **[UNKNOWN]**.
  - The homepage sales assistant ("Wynne") shows a "This is a GenAI powered system" disclosure. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Mobile.** **[UNKNOWN]** (see §3).
- **Accessibility.** SmartRecruiters says it "aims to be compliant with … WCAG 2.1 Level AA … periodically runs accessibility audits". **[SOURCE CLAIM · vendor · search excerpt]** ([article](https://www.smartrecruiters.com/resources/article/how-applicant-tracking-system-usability-improves-hiring-outcomes/), accessed 2026-09-25) No VPAT/ACR was located. **[UNKNOWN]**
- **Security / compliance.**
  - ISO 27001 and SOC 2 Type II (SOC 2 Type II announced in 2023). **[SOURCE CLAIM · vendor · search excerpt]** ([news](https://www.smartrecruiters.com/news/soc-2-type-ii-2023/), accessed 2026-09-25)
  - A trust center exists at [trust.smartrecruiters.com](https://trust.smartrecruiters.com/) (SecurityPal; title only).
  - **GDPR tooling** via the API:
    - bulk consent requests
    - consent status
    - consent decisions as **"single consent" or "separated consent" per data scope (SmartRecruit vs SmartCRM)**
    - candidate delete

    **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Data residency is **[UNKNOWN]**.
  - A third-party security-profile site lists PCI/HIPAA/FedRAMP. **[SOURCE CLAIM · independent · search excerpt]**, unverified and not corroborated by any vendor source seen.

### 5. Business
- **Pricing model.** The official [pricing page](https://www.smartrecruiters.com/pricing/) exists, but the search excerpt showed **no public prices**. **[SOURCE CLAIM · vendor · search excerpt]** Attrax career-site pricing is quote-based, "based on business size, the number of users, and the number of websites". **[SOURCE CLAIM · vendor · search excerpt]**
- SEO/competitor blogs (avahr.com, pin.com, leonstaff.com, glozo.com, pricingnow.com) claim an "Essential" tier "from $14,995/year" and higher tiers of "$30,000–$120,000+". **[SOURCE CLAIM · independent · search excerpt]** These are weak sources. The figures are not on any official page seen and **must not be used**.
- **Packaging.** A modular SKU family plus Winston add-ons ("add on Winston AI-powered products to supercharge SmartOS"). SmartJobs is billed as a % management fee. **[SOURCE CLAIM · vendor · search excerpt]**
- **Enterprise positioning.** Enterprise and high-volume. Also sold as the SAP SuccessFactors recruiting option. **[INFERENCE]**

### 6. Independent perspective
- Independent HR press covered the March 2026 launch of the SuccessFactors integration (title only: [HR Brew, 6 Mar 2026](https://www.hr-brew.com/stories/2026/03/06/sap-launches-smartrecruiters-hiring-platform-integration-into-successfactors)). **[SOURCE CLAIM · independent · search excerpt]** Content not read.
- A Gartner Peer Insights page exists for "SmartRecruiters for SAP SuccessFactors" (title only: [Gartner](https://www.gartner.com/reviews/product/smartrecruiters-for-sap-successfactors)). Ratings and themes were **[UNKNOWN]**.
- SAP implementation partners publish migration and "what changes" guides: [Zalaris](https://zalaris.com/consulting/sap-hcm-solutions/sap-successfactors-hcm-suite/smartrecruiters), [HR Path](https://hr-path.com/en/blog/hr-solutions/sap-en/sap-smartrecruiters-what-the-new-recruiting-experience-means-for-successfactors-customers/2026/03/26/) and [TT-S](https://insights.tt-s.com/en-us/smartrecruiters-becomes-part-of-sap-changes-and-next-steps) (titles only). **[INFERENCE]** A systems-integrator ecosystem is forming around SmartRecruiters inside SAP. These guides are not neutral sources.
- API Evangelist's independent, rubric-based **Kin Score** (2026-09-21) gives SmartRecruiters' public API artifacts **34.5/100 ("thin")**: discoverability 81.5, contract quality 62.9, governance 13.6. **[SOURCE CLAIM · independent · GitHub]** ([api-evangelist/smartrecruiters](https://github.com/api-evangelist/smartrecruiters), accessed 2026-09-25) It measures documentation artifacts, not product quality.
- **Recurring user complaints: [UNKNOWN]**. G2, Capterra, TrustRadius and Gartner content could not be retrieved. *The template's requirement of ≥2 substantive independent sources is **not met**.*

### 7. Lessons for OpenCATS 2.0
- **Product principles evidenced (INFERENCE).**
  - "Structured flexibility": fixed stage categories with configurable steps, where automation hangs off steps rather than off jobs.
  - Two distinct permission planes, global and job-scoped.
  - Approvals, consent and audit are first-class, API-visible objects.
  - AI is sold as graded automation with explanations, not as a black box.
  - The ecosystem, not the core, covers assessments, e-signature and onboarding partners.
- **Patterns worth learning from (RECOMMENDATION).**
  1. **Stage-category + configurable-step pipeline.** Map the 11 hard-coded statuses (`FEATURE_INVENTORY.md` FEAT-001; `PRODUCT_GAPS.md` GAP-005) to a default template. Keep fixed categories (New/Review/Interview/Offer/Hired/Rejected) so that funnel reporting stays comparable (GAP-014).
  2. **Step-bound rules** (auto-advance, auto-reject, send self-schedule link, create "collect feedback" task, reminder after N days), executed by a durable job queue (GAP-022).
  3. **Dual RBAC**: global system roles plus job-scoped hiring-team roles with per-capability toggles, including compensation/offer visibility and review visibility (GAP-003, GAP-010).
  4. **One generic Approval object** for requisitions and offers:
     - sequential or parallel chains, delegation, skip, comments
     - approve-from-e-mail
     - an event emitted for every step

     (GAP-008, GAP-009). Also model **positions/headcount under a job** (GAP-008).
  5. **Audit that includes reads**: profile opened, search, report downloaded, EEO filled, with a documented minimum retention (SmartRecruiters states ≥26 months). This closes GAP-011 and `SECURITY_AUDIT.md` SEC-022.
  6. **Signed webhooks with timestamp and overlapping key rotation** as the design baseline for GAP-004.
  7. **Consent per data scope** (ATS vs CRM/talent pool) plus country-specific data scopes (GAP-002, GAP-018).
  8. **Required disposition reasons**, a separate withdrawal-reason list, and bulk reject by filter (GAP-021). This also fixes the selection-loss bug class in `UX_UI_AUDIT.md` UX-002 by design.
  9. **Scorecard criteria library auto-attached via org fields** such as department (GAP-007).
  10. **Self-scheduling with group slots** for high-volume use (GAP-006).
- **Things NOT to copy (INFERENCE/RECOMMENDATION).**
  - SKU sprawl (SmartJobs, SmartDistribute, SmartMessage, SmartCRM, Attrax, SmartSandbox and five Winston variants) and quote-only pricing. These make evaluation and adoption hard.
  - An admin-generated **all-access API key**. OpenCATS 2.0 should issue only scoped tokens.
  - AI auto-reject or agentic interviewing without an explicit human-review default, disclosure and a bias-audit trail. These are risky for an open-source product used in regulated jurisdictions (GAP-024).
  - Roadmap dependence on a parent suite. Keep HRIS hand-off vendor-neutral (GAP-025).

### Sources
1. https://news.sap.com/2025/08/sap-to-acquire-smartrecruiters/ — SAP News (vendor-parent; search excerpt) — accessed 2026-09-25
2. https://www.smartrecruiters.com/news/sap-to-acquire-smartrecruiters/ — SmartRecruiters press release (vendor; search excerpt and third-party GitHub copy) — accessed 2026-09-25
3. https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/ — SAP News Center (vendor-parent; search excerpt) — accessed 2026-09-25
4. https://www.smartrecruiters.com/news/sap-completes-acquisition-of-smartrecruiters/ — SmartRecruiters press release (vendor; search excerpt and third-party GitHub copy) — accessed 2026-09-25
5. https://news.sap.com/2026/03/smartrecruiters-for-sap-successfactors-ai-driven-hiring-connected-hcm/ — SAP News (vendor-parent; search excerpt) — accessed 2026-09-25
6. https://community.sap.com/t5/human-capital-management-blog-posts-by-sap/the-smartrecruiters-and-sap-successfactors-integration-roadmap/ba-p/14345532 — SAP Community, SAP-authored (search excerpt) — accessed 2026-09-25
7. https://community.sap.com/t5/human-capital-management-blog-posts-by-sap/1h-2026-smartrecruiters-for-sap-successfactors-connected-solutions-and-new/ba-p/14381751 — SAP Community (search excerpt) — accessed 2026-09-25
8. https://www.sap.com/assetdetail/2026/05/4a5594c9-507f-0010-bca6-c68f7e60039b.html — SAP 1H 2026 release asset (title only) — accessed 2026-09-25
9. https://github.com/api-evangelist/smartrecruiters — third-party GitHub dataset: homepage screenshot of smartrecruiters.com captured 2026-06-20; news-feed copies; developer-docs `llms.txt` index; Kin Score — accessed 2026-09-25
10. https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/smartrecruiters.com/smartrecruiters/201911.1 — third-party copy of SmartRecruiters OpenAPI (imported from konfig-sdks/openapi-examples) — accessed 2026-09-25
11. https://www.smartrecruiters.com/news/smartrecruiters-unveils-ai-powered-platform-that-ends-the-ats-era/ — vendor news (third-party GitHub copy) — accessed 2026-09-25
12. https://www.smartrecruiters.com/news/high-volume-hiring-where-speed-meets-stickiness/ — vendor news (third-party GitHub copy) — accessed 2026-09-25
13. https://www.globenewswire.com/news-release/2026/04/07/3269187/0/en/SmartRecruiters-Introduces-the-Future-of-Hiring-From-AI-Agents-to-Autonomous-Talent-Acquisition.html — vendor press release (search excerpt; third-party GitHub copy) — accessed 2026-09-25
14. https://www.smartrecruiters.com/winston/ — vendor product page (search excerpt) — accessed 2026-09-25
15. https://www.smartrecruiters.com/recruiting-software/hiring-assistant/ — vendor (search excerpt) — accessed 2026-09-25
16. https://www.smartrecruiters.com/recruiting-software/talent-matching/ — vendor (search excerpt) — accessed 2026-09-25
17. https://www.smartrecruiters.com/recruiting-software/ai-chatbot/ — vendor (search excerpt) — accessed 2026-09-25
18. https://www.smartrecruiters.com/resources/article/january-2026-product-release-highlights-faster-hiring-with-winston-companion-and-localized-smartattrax-experiences/ — vendor release notes (title only) — accessed 2026-09-25
19. https://www.smartrecruiters.com/resources/article/march-2026-product-release-highlights-big-things-just-landed-in-winston-match-and-smartsandbox/ — vendor release notes (title only) — accessed 2026-09-25
20. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/managing-hiring-processes — SAP Learning (official training; search excerpt) — accessed 2026-09-25
21. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-workflows-for-hiring — SAP Learning (search excerpt) — accessed 2026-09-25
22. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-hiring-team-roles — SAP Learning (search excerpt) — accessed 2026-09-25
23. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/assigning-default-system-roles-and-creating-custom-system-roles_fcc18ab2-7751-493c-bc12-0525f36cb800 — SAP Learning (search excerpt) — accessed 2026-09-25
24. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-interview-scorecards — SAP Learning (search excerpt) — accessed 2026-09-25
25. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-offer-approvals — SAP Learning (search excerpt) — accessed 2026-09-25
26. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/integrating-offer-templates-with-docusign — SAP Learning (search excerpt) — accessed 2026-09-25
27. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/creating-rejection-screening-questions_ed2425b9-fd44-4e3d-ab8b-e96adca1c225 — SAP Learning (search excerpt) — accessed 2026-09-25
28. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/managing-candidate-applications — SAP Learning (search excerpt) — accessed 2026-09-25
29. https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/automating-interview-scheduling-with-scheduling-automation — SAP Learning (search excerpt) — accessed 2026-09-25
30. https://help.smartrecruiters.com/Interviewing_and_Hiring/Reviewing_and_interviewing_candidates/Schedule_an_interview/Slot_Management_with_calendar_integration — vendor help center (search excerpt) — accessed 2026-09-25
31. https://www.smartrecruiters.com/news/smartrecruiters-partners-with-docusign-to-streamline-recruitment-process-for-businesses/ — vendor press release (search excerpt) — accessed 2026-09-25
32. https://www.smartrecruiters.com/recruiting-software/job-posting/ — vendor (search excerpt) — accessed 2026-09-25
33. https://www.smartrecruiters.com/resources/landing/smartjobs-product-sheet/ — vendor (search excerpt) — accessed 2026-09-25
34. https://www.smartrecruiters.com/recruiting-software/recruitment-crm/ — vendor (search excerpt) — accessed 2026-09-25
35. https://www.smartrecruiters.com/recruiting-software/text/ — vendor (search excerpt) — accessed 2026-09-25
36. https://developers.smartrecruiters.com/docs/authentication-api-key — vendor developer docs (search excerpt) — accessed 2026-09-25
37. https://developers.smartrecruiters.com/docs/oauth-20 — vendor developer docs (search excerpt) — accessed 2026-09-25
38. https://developers.smartrecruiters.com/docs/webhooks — vendor developer docs (search excerpt) — accessed 2026-09-25
39. https://developers.smartrecruiters.com/docs/websso-overview — vendor developer docs (search excerpt) — accessed 2026-09-25
40. https://developers.smartrecruiters.com/reference/users-api — vendor developer docs (search excerpt) — accessed 2026-09-25
41. https://github.com/smartrecruiters — official vendor GitHub organisation (fetched; [FACT]) — accessed 2026-09-25
42. https://www.smartrecruiters.com/recruiting-software/marketplace/ — vendor (search excerpt) — accessed 2026-09-25
43. https://www.smartrecruiters.com/news/soc-2-type-ii-2023/ — vendor news (search excerpt) — accessed 2026-09-25
44. https://trust.smartrecruiters.com/ — vendor trust center (title only) — accessed 2026-09-25
45. https://www.smartrecruiters.com/resources/article/how-applicant-tracking-system-usability-improves-hiring-outcomes/ — vendor (search excerpt; accessibility statement) — accessed 2026-09-25
46. https://www.smartrecruiters.com/pricing/ — vendor pricing page (search excerpt; no prices shown) — accessed 2026-09-25
47. https://www.hr-brew.com/stories/2026/03/06/sap-launches-smartrecruiters-hiring-platform-integration-into-successfactors — HR Brew (independent press; title only) — accessed 2026-09-25
48. https://www.gartner.com/reviews/product/smartrecruiters-for-sap-successfactors — Gartner Peer Insights (independent; title only) — accessed 2026-09-25
49. https://community.sap.com/t5/human-capital-management-blog-posts-by-members/job-approval-in-smartrecruiters-overview-features-and-configuration-guide/ba-p/14349246 — SAP Community member blog (practitioner; title only) — accessed 2026-09-25
50. https://zalaris.com/consulting/sap-hcm-solutions/sap-successfactors-hcm-suite/smartrecruiters ; https://hr-path.com/en/blog/hr-solutions/sap-en/sap-smartrecruiters-what-the-new-recruiting-experience-means-for-successfactors-customers/2026/03/26/ ; https://insights.tt-s.com/en-us/smartrecruiters-becomes-part-of-sap-changes-and-next-steps — SAP partners (not neutral; titles only) — accessed 2026-09-25
51. https://avahr.com/smartrecruiters-pricing/ ; https://www.pin.com/blog/smartrecruiters-pricing/ ; https://leonstaff.com/blogs/smartrecruiters-pricing/ ; https://www.glozo.com/blog/smartrecruiters-pricing-guide-2025 — SEO/competitor blogs (weak; search excerpt; leads only) — accessed 2026-09-25
52. https://security-profiles.nudgesecurity.com/app/smartrecruiters-com — third-party security profile (weak; search excerpt) — accessed 2026-09-25
53. https://www.onelogin.com/connector/smartrecruiters — IdP connector listing (independent; search excerpt) — accessed 2026-09-25

---

## Workable (Workable Software; ownership not verified this session)

### 1. Snapshot
- **Vendor / ownership.** A Jan 2026 Workable post names "Workable CEO Nikos Moraitakis". **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([Workable Resources](https://resources.workable.com/inside-hr/stories-and-insights/ai-mass-apply-tools-hiring-signal-vs-noise/), accessed 2026-09-25)
  - Parent/ownership, HQ, founding year, headcount and customer count are **[UNKNOWN]**. No acquisition appeared in the evidence reviewed. The vendor feed shows independent branding through Sep 2026. **[INFERENCE]**: likely independent, but this must be verified.
- **Positioning** (homepage, June 2026 capture): "A TALENT MANAGEMENT PLATFORM FOR AN AGENTIC WORLD — The agent recruits. You manage talent. Workable is agentic software for recruiting and HR. An AI agent sources, screens and engages candidates inside the Workable ATS. You set the operating model and the guidelines, your data stays yours, and the platform works with whatever AI you bring." **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([screenshot in api-evangelist/workable](https://github.com/api-evangelist/workable), accessed 2026-09-25)
- **Target customer.** "Strongest for growing companies and recruiting teams managing high volume without dedicated sourcing tools or enterprise infrastructure." **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([AI features guide, 25 Aug 2026](https://resources.workable.com/inside-hr/workable-ai-features-the-complete-guide-for-recruiters/), accessed 2026-09-25)
  - Case studies span healthcare, construction, professional services, hospitality (for example "8,000 annual hires" at Belmond) and tech. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - The recruiting model is SMB/mid-market corporate TA, including multi-location hourly-type hiring. **[INFERENCE]**
- **Suite composition.**
  - ATS
  - four **AI Recruiting Agents**: Job Brief, Sourcing, Screening, Engagement
  - Workable Assistant (conversational)
  - texting
  - offer-letter e-signature
  - BI Data Link
  - an **HR suite**: employees, org chart, documents, time off, time tracking, review cycles/performance reviews
  - an MCP server
  - the candidate-facing **Jobs by Workable** marketplace

  **[SOURCE CLAIM · vendor · third-party GitHub copy]** / **[FACT]** for Jobs by Workable (see §4). Sources: [agents GA post](https://resources.workable.com/inside-hr/candidate-sourcing-automation-hiring-speed); [Workable Assistant](https://resources.workable.com/backstage-at-workable/workable-assistant); [HRIS case](https://resources.workable.com/inside-hr/healthcare-central-london-workable-hris-ats-case-study/); API definition copies (§4), all accessed 2026-09-25.
  - Video interviews and assessments appear in a third-party profile description. **[SOURCE CLAIM · independent · GitHub]**

### 2. Workflows
*The Workable help center (help.workable.com) and API docs (workable.readme.io) were blocked, and no search budget remained. Workflow steps and decision points are therefore mostly **[UNKNOWN]**. The evidence below comes from vendor blog/status copies and two third-party copies of the v3 API definition (see §4).*

- **Requisition creation & approval.** A **requisition** object exists with list/create/update/get and **approve/reject**. **[SOURCE CLAIM · vendor · third-party GitHub copy]** Both independent copies of the API definition agree. Approval-chain configuration is **[UNKNOWN]**.
- **Job approval (job-level, distinct from requisition):** **[UNKNOWN]**.
- **Publishing / distribution.**
  - "Post once, track all applicants in one place" across **multiple locations with a single job posting** (Oct 2025). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([post](https://resources.workable.com/backstage-at-workable/multi-location-job-posting/), accessed 2026-09-25)
  - Indeed **Platinum** partner, "awarded to just 23 applicant tracking systems" (Jul 2025). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([post](https://resources.workable.com/workable-blog/workable-earns-platinum-partner-status-for-indeed-ats-integration/), accessed 2026-09-25)
  - LinkedIn **Platinum Partner** (Apr 2026) and LinkedIn **Apply Connect** (Nov 2024). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([post](https://resources.workable.com/backstage-at-workable/linkedin-platinum-partnership-workable/); [post](https://resources.workable.com/backstage-at-workable/new-linkedin-integration-features-are-available/), accessed 2026-09-25)
  - The number of boards is **[UNKNOWN]**.
- **Sourcing.** "Candidate sourcing from 400+ million profiles". The **Sourcing Agent** provides round-the-clock sourcing (H2 Health case). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([AI guide](https://resources.workable.com/inside-hr/workable-ai-features-the-complete-guide-for-recruiters/); [case](https://resources.workable.com/h2-health-ai-recruiting-agent-case-study), accessed 2026-09-25)
- **Candidate intake.**
  - Each job has an application form and questions exposed by the API. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Workable reports that "around 10% of the job applications flowing through our platform are now submitted via AI mass-apply tools". **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([post](https://resources.workable.com/inside-hr/stories-and-insights/ai-mass-apply-tools-hiring-signal-vs-noise/), accessed 2026-09-25)
  - Candidates on Jobs by Workable can manage a profile, see their applications and **withdraw** an application ("cannot be undone"). **[FACT]** ([github.com/workable/workable-jobs-grok-plugin](https://github.com/workable/workable-jobs-grok-plugin), accessed 2026-09-25)
- **Screening.**
  - Custom screening questions plus the AI Recruiting Agent "eliminated 20% of unqualified applicants automatically" (CacheFly case). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([case](https://resources.workable.com/inside-hr/hiring-with-workable/how-a-30-person-cdn-company-built-a-smarter-faster-hiring-process-with-ai/), accessed 2026-09-25)
  - The **Screening Agent's ideal candidate profile (ICP) is editable at any point** and "can re-evaluate every candidate against it" (Aug 2026). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([post](https://resources.workable.com/backstage-at-workable/news-and-updates/fine-tune-your-agents-ideal-candidate-profile-and-keep-your-whole-pipeline-in-sync/), accessed 2026-09-25)
  - The AI Screening Assistant was used by Hugging Face. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Pipeline progression.**
  - Account- and job-level stages. Candidates can be moved, **copied** to another job, and **relocated**. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - The homepage mock-up timeline shows "Moved to Assessment by AI Agent", meaning agent actions are logged on the candidate timeline. **[SOURCE CLAIM · vendor · third-party GitHub copy]** (marketing art)
  - Stage automation rules are **[UNKNOWN]**.
- **Interviews / scheduling.**
  - Calendar sync and meeting links exist (a status incident on 16 Oct 2025 mentions "delayed events"). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([status](https://workable.statuspage.io/incidents/l56z5qnny1fn), accessed 2026-09-25)
  - Events are listed by the API. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Self-scheduling and panels are **[UNKNOWN]**.
  - "Interview question generation" is an AI feature. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Scorecards / evaluation.** Add/update candidate **ratings** via the API; the mock-up shows an "Evaluation" tab next to Profile and Timeline. **[SOURCE CLAIM · vendor · third-party GitHub copy]** Scorecard structure is **[UNKNOWN]**.
- **Feedback & collaboration.** Candidate comments via the API. The mock-up shows an **@mention** and **per-comment visibility** ("Visible to Hiring Managers, Standard Members"). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Offers.**
  - Offer **approve/reject** via the API. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Offer-letter **e-signature** with "e-signature templates". Status incidents mention errors "when sending, approving, signing, or updating e-signature templates" (Jan and Feb 2026). A Jul 2025 incident attributes an outage to **Dropbox Sign**, the underlying provider. **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([status](https://workable.statuspage.io/incidents/ghbszqdwh2bx); [status](https://workable.statuspage.io/incidents/zhypx41cylkl), accessed 2026-09-25)
- **Hire / hand-off.**
  - A native HRIS: a customer "replac[ed] its less advanced HRIS with Workable's all-in-one HRIS" (Dec 2025). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Onboarding and background checks were automated, "eliminating 238 manual touch points" (Pharmacy2U). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([case](https://resources.workable.com/inside-hr/hiring-with-workable/pharmacy2u-workable-ats-case-study/), accessed 2026-09-25)
  - Integrations with Slack, Okta and Rippling are mentioned. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Rejection.**
  - **Disqualify** with configurable **disqualification reasons**, and **revert**. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Bulk actions exist in general (a Jul 2025 incident refers to "CV/Resume upload and bulk actions"). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Rejection templates are **[UNKNOWN]**.
- **Talent pools / rediscovery.** An "Add to talent pool" API exists. **[SOURCE CLAIM · vendor · third-party GitHub copy]** The Engagement Agent and "candidate rediscovery" are listed as built-in AI features. **[SOURCE CLAIM · vendor · third-party GitHub copy]** Nurture campaigns are **[UNKNOWN]**.

### 3. User experience
- **Recruiter:**
  - "Setup measured in hours" and a **15-day free trial**. **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([post](https://resources.workable.com/inside-hr/stories-and-insights/better-hiring/easiest-ats-platforms-2026/), accessed 2026-09-25)
  - Dashboard specifics are **[UNKNOWN]**. A "free recruiter dashboard" product surface is referenced in a maintenance notice. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Hiring manager:** a "Hiring Managers" member type is visible in comment-visibility labels. **[SOURCE CLAIM · vendor · third-party GitHub copy]** A mobile app is **[UNKNOWN]**. Workable publishes a guide arguing that hiring managers approve candidates on mobile, but it is generic content. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Interviewer:** **[UNKNOWN]**.
- **Candidate:**
  - Texting (SMS; a Jul 2025 incident mentions "texting provider"). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - The homepage mock-up shows a candidate "replied via text message". **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Jobs by Workable offers job search, a profile and recommendations. **[FACT]**
  - Apply-flow length is **[UNKNOWN]**.
- **Navigation / IA:** API objects are Accounts, Members, Recruiters, Departments, Jobs, Candidates, Stages, Events, Offers, Requisitions, Employees, Time-off, Time-tracking, Review cycles, Custom attributes and Subscriptions. **[SOURCE CLAIM · vendor · third-party GitHub copy]** UI menus are **[UNKNOWN]**.
- **Search / bulk:**
  - "Advanced candidate and employee search" via MCP requires the **Premier+ or Enterprise** plan. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Saved views are **[UNKNOWN]**.
- **Timeline / collaboration:** a timeline with comments, text replies and agent actions (mock-up). **[SOURCE CLAIM · vendor · third-party GitHub copy]**

### 4. Platform
- **API.**
  - REST **v3** at `https://{subdomain}.workable.com/spi/v3` with **Bearer** tokens ("account tokens, user tokens, and API access tokens").
  - Resources: jobs (application form, questions, stages, members, activities), candidates (move, copy, relocate, disqualify/revert, ratings, tags, comments, files, offer, custom-attribute values), talent pool, requisitions (approve/reject), offers (approve/reject), members/permission sets/collaboration permissions, legal entities, departments, employees (org chart, documents), time off, time tracking, review-cycle templates, disqualification reasons, custom attributes, and events.
  - Two copies agree: one version 3.21.0 and one imported from `workable.readme.io/v3/docs`.

  **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([api-evangelist/workable](https://github.com/api-evangelist/workable); [jentic copy](https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/workable.com/main/3.0), accessed 2026-09-25)
- **Webhooks.** `/subscriptions` create/list/delete with a target and an event. **[SOURCE CLAIM · vendor · third-party GitHub copy]** The event catalogue and signing are **[UNKNOWN]**.
- **MCP / agent access.**
  - Workable's **MCP server grew to 94 tools**, 37 of them new: candidate and employee search, a 15-tool performance-review suite, and member administration. It is usable "through AI assistants like Claude and ChatGPT". Most tools come "at no added cost on every plan". **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([post, 25 Aug 2026](https://resources.workable.com/inside-hr/how-workables-mcp-server-grew-to-94-tools-and-why-that-matters-for-recruiting-and-hr-teams/), accessed 2026-09-25)
  - The official plugin repo connects to **`https://jobs.workable.com/mcp`**. Public tools (`search_jobs`, `get_job`, `get_company`, `get_job_locations`) need no sign-in. Candidate tools (`get_my_profile`, `update_my_profile`, `get_my_applications`, `withdraw_application`, `get_recommendations`) use browser sign-in and "There is no API key to paste". **[FACT]** ([workable/workable-jobs-grok-plugin](https://github.com/workable/workable-jobs-grok-plugin), accessed 2026-09-25)
- **Integrations / marketplace.** Named integrations include LinkedIn, Indeed, Slack, Okta, Rippling and Dropbox Sign. The marketplace size is **[UNKNOWN]**.
- **SSO / SCIM / MFA:** **[UNKNOWN]**. A third-party dataset lists "enterprise SSO" for an Enterprise plan, but it is self-declared as generated. **Not used.**
- **RBAC:**
  - Permission sets, collaboration permissions and member types (Hiring Managers, Standard Members). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Custom roles and record scoping are **[UNKNOWN]**.
- **Audit logs:** **[UNKNOWN]**. Activities endpoints exist for jobs and candidates. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Customization:** custom attributes, departments, legal entities (multi-entity). **[SOURCE CLAIM · vendor · third-party GitHub copy]** Localization and UI languages are **[UNKNOWN]**.
- **Reporting:**
  - "Pre-built reports … custom reports … automated delivery … BI integrations" and AI-activity data. **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([post](https://resources.workable.com/inside-hr/stories-and-insights/better-hiring/workable-reporting-and-customization-what-hr-teams-actually-need-to-know/), accessed 2026-09-25)
  - **BI Data Link** and professional-services custom reports. **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([status](https://workable.statuspage.io/incidents/pjbn79z18w0s), accessed 2026-09-25)
  - A new **AI-credit consumption report** shows what was purchased, used and expired, by job/activity, on every plan (Sep 2026). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([post](https://resources.workable.com/backstage-at-workable/see-where-every-ai-credit-goes-from-purchase-to-consumption/), accessed 2026-09-25)
- **AI:**
  - Six functions: JD writing, sourcing, resume screening/matching, a conversational assistant, interview questions, and rediscovery.
  - "Each feature is built into the core platform at no add-on cost".
  - Separately, the four **Recruiting Agents** are "generally available globally" and "have processed more than 120,000 candidates".
  - Agents consume **AI credits**.

  **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - *Human-in-the-loop:* "You set the operating model and the guidelines", and the ICP can be edited mid-search. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Bias audits and opt-out are **[UNKNOWN]**.
  - Workable claims to invest "35%" of revenue in R&D. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Mobile / accessibility:** **[UNKNOWN]**. No VPAT/ACR was located.
- **Security:**
  - Per a third-party keyword scan of workable.com/security, it cites SOC 2, ISO 27001, ISO 27017 and GDPR. **[SOURCE CLAIM · independent · GitHub]** (the scan reports keywords, not certificates)
  - A public status page exists (`workable.statuspage.io`). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Data residency is **[UNKNOWN]**.

### 5. Business
- **Pricing.** The official [pricing page](https://www.workable.com/pricing) could not be fetched and was not seen in search. **Exact tiers, prices, currency and billing basis are [UNKNOWN]** for this session.
  - Plan names **"Premier"** and **"Enterprise"** appear in an Aug 2026 vendor post. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - AI usage is metered in **purchasable AI credits**. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - There is a 15-day free trial. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - A third-party dataset lists specific USD prices but declares itself "generated … not harvested from the provider". **Excluded.**
- **Target market.** Growing companies and SMB to mid-market, with some large multi-site customers. **[SOURCE CLAIM · vendor · third-party GitHub copy]**

### 6. Independent perspective
- API Evangelist Kin Score (2026-09-21): **37.0/100 ("thin")**. **[SOURCE CLAIM · independent · GitHub]** Caveat: it records `mcp_server: false`, which contradicts Workable's own MCP announcement and official GitHub repo. This illustrates the limits of automated ratings.
- **Review aggregates, analysts and press: [UNKNOWN]** (not retrievable). *The requirement of ≥2 independent sources is **not met**.*

### 7. Lessons for OpenCATS 2.0
- **Principles evidenced (INFERENCE).**
  - Agents operate *inside* the ATS record. Their actions appear on the same candidate timeline as human actions, with visibility scoping.
  - AI is metered with transparent credit reporting.
  - The API and MCP surface are treated as product features, including a candidate-side MCP.
  - ATS and lightweight HRIS in one product for SMBs.
- **Patterns worth learning from (RECOMMENDATION).**
  1. **Log automated/AI actions as first-class timeline events with an actor type of "agent"**, and apply per-comment visibility. This supports GAP-011 (audit) and GAP-013 (unified timeline).
  2. **Editable screening criteria with an explicit "re-evaluate all" action**, so AI ranking stays aligned with human-set requirements (GAP-024, human-in-the-loop).
  3. **Requisition and offer approvals exposed as API verbs** (`approve`/`reject`) (GAP-008, GAP-009, GAP-004).
  4. **Disqualify with reason + revert**. Make rejection reversible and reasoned (GAP-021).
  5. **A multi-location single posting** to avoid duplicate jobs and pipelines (GAP-015).
  6. **An MCP server and scoped tokens** as an adoption channel for an open-source product. Candidate-side self-service (view/withdraw applications) also addresses the unsafe careers identity (GAP-012; `SECURITY_AUDIT.md` SEC-025; `FEATURE_INVENTORY.md` FEAT-005).
  7. **A usage/consumption report for any metered capability.** This is relevant if OpenCATS 2.0 offers hosted AI.
- **Things NOT to copy.**
  - Hard dependence on a single e-signature provider without a fallback (several e-signature incidents in 2025–2026). **[INFERENCE]**
  - Gating search quality behind higher tiers. OpenCATS' search is already a gap (GAP-016).
  - Opaque "AI credits" without per-action explanations.

### Sources
1. https://github.com/api-evangelist/workable — third-party GitHub dataset: homepage screenshot of workable.com (2026-06-20); copies of resources.workable.com and workable.statuspage.io feed items; API definition copy; Kin Score; trust-center keyword scan — accessed 2026-09-25
2. https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/workable.com/main/3.0 — third-party copy of Workable API v3 (imported from workable.readme.io/v3/docs) — accessed 2026-09-25
3. https://github.com/workable/workable-jobs-grok-plugin — official Workable GitHub repo (fetched; [FACT]) — accessed 2026-09-25
4. https://resources.workable.com/inside-hr/candidate-sourcing-automation-hiring-speed — vendor blog (third-party GitHub copy) — accessed 2026-09-25
5. https://resources.workable.com/inside-hr/workable-ai-features-the-complete-guide-for-recruiters/ — vendor blog (third-party GitHub copy) — accessed 2026-09-25
6. https://resources.workable.com/backstage-at-workable/news-and-updates/fine-tune-your-agents-ideal-candidate-profile-and-keep-your-whole-pipeline-in-sync/ — vendor product update (third-party GitHub copy) — accessed 2026-09-25
7. https://resources.workable.com/inside-hr/how-workables-mcp-server-grew-to-94-tools-and-why-that-matters-for-recruiting-and-hr-teams/ — vendor blog (third-party GitHub copy) — accessed 2026-09-25
8. https://resources.workable.com/backstage-at-workable/see-where-every-ai-credit-goes-from-purchase-to-consumption/ — vendor product update (third-party GitHub copy) — accessed 2026-09-25
9. https://resources.workable.com/backstage-at-workable/multi-location-job-posting/ — vendor product update (third-party GitHub copy) — accessed 2026-09-25
10. https://resources.workable.com/workable-blog/workable-earns-platinum-partner-status-for-indeed-ats-integration/ — vendor (third-party GitHub copy) — accessed 2026-09-25
11. https://resources.workable.com/backstage-at-workable/linkedin-platinum-partnership-workable/ — vendor (third-party GitHub copy) — accessed 2026-09-25
12. https://resources.workable.com/backstage-at-workable/new-linkedin-integration-features-are-available/ — vendor (third-party GitHub copy) — accessed 2026-09-25
13. https://resources.workable.com/backstage-at-workable/workable-assistant — vendor (third-party GitHub copy) — accessed 2026-09-25
14. https://resources.workable.com/inside-hr/stories-and-insights/ai-mass-apply-tools-hiring-signal-vs-noise/ — vendor (third-party GitHub copy) — accessed 2026-09-25
15. https://resources.workable.com/inside-hr/stories-and-insights/workable-rd-investment-ai-innovation-hr-tech/ — vendor (third-party GitHub copy) — accessed 2026-09-25
16. https://resources.workable.com/inside-hr/stories-and-insights/better-hiring/workable-reporting-and-customization-what-hr-teams-actually-need-to-know/ — vendor (third-party GitHub copy) — accessed 2026-09-25
17. https://resources.workable.com/inside-hr/stories-and-insights/better-hiring/easiest-ats-platforms-2026/ — vendor (third-party GitHub copy) — accessed 2026-09-25
18. https://resources.workable.com/inside-hr/hiring-with-workable/how-a-30-person-cdn-company-built-a-smarter-faster-hiring-process-with-ai/ — vendor case study (third-party GitHub copy) — accessed 2026-09-25
19. https://resources.workable.com/inside-hr/healthcare-central-london-workable-hris-ats-case-study/ — vendor case study (third-party GitHub copy) — accessed 2026-09-25
20. https://resources.workable.com/inside-hr/hiring-with-workable/pharmacy2u-workable-ats-case-study/ — vendor case study (third-party GitHub copy) — accessed 2026-09-25
21. https://resources.workable.com/h2-health-ai-recruiting-agent-case-study — vendor case study (third-party GitHub copy) — accessed 2026-09-25
22. https://workable.statuspage.io/incidents/zhypx41cylkl ; https://workable.statuspage.io/incidents/ghbszqdwh2bx ; https://workable.statuspage.io/incidents/l56z5qnny1fn ; https://workable.statuspage.io/incidents/zd9269574n1y ; https://workable.statuspage.io/incidents/pjbn79z18w0s ; https://workable.statuspage.io/incidents/1rmpmd83r7r4 — vendor status page (third-party GitHub copy) — accessed 2026-09-25
23. https://www.workable.com/pricing — vendor pricing page (blocked; not verified) — accessed 2026-09-25

---

## Recruitee (Tellent Recruitee; parent: Tellent group)

### 1. Snapshot
- **Ownership / brand.**
  - "The parent company was subsequently renamed as Tellent while Recruitee renamed as Tellent Recruitee and continues to operate as a product unit within the Tellent group." **[SOURCE CLAIM · independent · search excerpt]** ([Wikipedia: Recruitee](https://en.wikipedia.org/wiki/Recruitee), accessed 2026-09-25)
  - Corroborated by the "tellent recruitee" logo on the homepage (June 2026 capture). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Also corroborated by a shared **status.tellent.com** status page covering Recruitee, **Tellent HR**, **Javelo** and **Grow**. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - Tellent's own ownership/investors, HQ, founding year and scale are **[UNKNOWN]**.
- **Positioning** (homepage, June 2026): "A better way to hire — The customizable hiring software that helps you hire smarter and faster. Streamline and automate your hiring, build your employer brand, and win top talent with AI-driven features." The site offers "Try for free — No credit card required" and a "Personalized 30 min software demo". **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([api-evangelist/recruitee](https://github.com/api-evangelist/recruitee), accessed 2026-09-25)
- **Target customer.** "Designed for growing companies". Also "a no-code career site builder and access to 1,450+ job boards". **[SOURCE CLAIM · vendor · search excerpt]** ([recruitee.com](https://recruitee.com/), accessed 2026-09-25)
  - A review-directory excerpt describes tools to "manage recruitment agencies". **[SOURCE CLAIM · independent · search excerpt]**
  - Recruiting model: in-house TA at SMB/mid-market. **[INFERENCE]**
- **Suite composition.**
  - ATS, careers-site builder, job distribution, **WhatsApp Hiring**, a built-in **mailbox** (send/receive e-mail), and CV parsing via a **third-party parsing provider**. **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([status: Careers API & WhatsApp Hiring](https://status.tellent.com/incidents/xzzf4pjj6yr1); [status: CV parsing](https://status.tellent.com/incidents/y223dq1tnnd5); [status: mailbox](https://status.tellent.com/incidents/scpt63jmdfbc), accessed 2026-09-25)
  - Sister products in the Tellent group: Tellent HR, Javelo, Grow. **[SOURCE CLAIM · vendor · third-party GitHub copy]** What each does is **[UNKNOWN]**.

### 2. Workflows
*Help center (support.recruitee.com) and docs were blocked and no search budget remained. Most steps are **[UNKNOWN]**. Evidence comes from Recruitee's developer-docs index (`llms.txt`, copied in a third-party GitHub dataset) and a third-party OpenAPI rendering of the Recruitee API. The provenance of that rendering is unclear, so it is used only where the docs index corroborates it.*

- **Requisition / job approval:** **[UNKNOWN]**. No requisition object was seen. Jobs are called **"offers"**, and an offer can be "job or talent pool". **[SOURCE CLAIM · vendor · third-party GitHub copy]** (docs index)
- **Job lifecycle:** draft, publish, unpublish, close, archive and duplicate states/actions. **[SOURCE CLAIM · vendor · third-party GitHub copy]** (third-party OpenAPI rendering; provenance unclear)
- **Publishing / distribution:**
  - An **XML feed** "describes how Recruitee structures data for publishing job offers on job boards". **[SOURCE CLAIM · vendor · third-party GitHub copy]** (docs index)
  - A "1,450+ job boards" claim. **[SOURCE CLAIM · vendor · search excerpt]**
  - A **Careers Site API** returns published jobs, filterable by department or tag. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Candidate intake:**
  - The Careers Site API "apply" endpoint creates a candidate. By default `name`, `phone`, `email` and `cv` are required, and all except name and email can be made optional per job. Answers to job questions can be attached. **[SOURCE CLAIM · vendor · third-party GitHub copy]** (docs index)
  - WhatsApp Hiring. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Screening:** job questions (above). "AI-driven features" is homepage copy only. **[SOURCE CLAIM · vendor · third-party GitHub copy]** Knockouts and AI screening specifics are **[UNKNOWN]**.
- **Pipeline:** **pipeline templates** (default template, stage ordering, per-job stages). Candidates on a job ("placements") can change stage, be disqualified or be requalified, and carry "hiring details". **[SOURCE CLAIM · vendor · third-party GitHub copy]** (OpenAPI rendering; provenance unclear) Automation rules are **[UNKNOWN]**.
- **Interviews / scheduling:** "schedule interviews" per a third-party profile description. **[SOURCE CLAIM · independent · GitHub]** Details are **[UNKNOWN]**.
- **Scorecards / feedback:** **[UNKNOWN]**. Notes (pin, checklist), tasks and followers exist. **[SOURCE CLAIM · vendor · third-party GitHub copy]** (OpenAPI rendering)
- **Offers to candidates (compensation/letters/e-sign):** **[UNKNOWN]**. Note the naming collision: "offer" means *job* in Recruitee's API.
- **Hire / hand-off:** "hiring details" on the placement. Hand-off to Tellent HR is **[UNKNOWN]**.
- **Rejection:** disqualify/requalify on the placement. **[SOURCE CLAIM · vendor · third-party GitHub copy]** Reasons and templates are **[UNKNOWN]**.
- **Talent pools / rediscovery:** talent pools are modelled as a kind of "offer". **[SOURCE CLAIM · vendor · third-party GitHub copy]** (docs index) "Similar candidates", "duplicates", "merge" and "retrieve a deleted candidate" operations appear. **[SOURCE CLAIM · vendor · third-party GitHub copy]** (OpenAPI rendering)

### 3. User experience
- **Recruiter, hiring-manager and interviewer dashboards:** **[UNKNOWN]**.
- **Candidate:** a no-code careers site; WhatsApp Hiring; a configurable set of required apply fields. **[SOURCE CLAIM · vendor · search excerpt / third-party GitHub copy]** Mobile experience and candidate portal are **[UNKNOWN]**.
- **Navigation / IA:** API objects are candidates, offers (jobs/talent pools), departments, locations, custom fields, pipeline templates, tags, notes, tasks, placements and search. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Search:** a "search/new/candidates" endpoint and a quick search. **[SOURCE CLAIM · vendor · third-party GitHub copy]** Saved views and bulk actions are **[UNKNOWN]**.
- **Collaboration:** notes (pin/checklist), tasks, followers and a mailbox. **[SOURCE CLAIM · vendor · third-party GitHub copy]**

### 4. Platform
- **API:**
  - A company-scoped REST API at `https://api.recruitee.com/c/{company_id}` using **Bearer personal API tokens** ("Apps & Plugins > Personal API Tokens"). **[SOURCE CLAIM · vendor · third-party GitHub copy]** (OpenAPI rendering)
  - A public **Careers Site API**, documented at docs.recruitee.com. **[SOURCE CLAIM · vendor · third-party GitHub copy]** (docs index)
- **Webhooks:** a "Webhooks" guide exists. **[SOURCE CLAIM · vendor · third-party GitHub copy]** (docs index) The event list and signing are **[UNKNOWN]**.
- **Audit logs:** an "Audit logs" guide exists. **[SOURCE CLAIM · vendor · third-party GitHub copy]** (docs index) Scope and retention are **[UNKNOWN]**.
- **SSO / SCIM:** **[UNKNOWN]**. Recruitee's official GitHub organisation hosts forks of `samly` and `esaml` (SAML 2.0 SP libraries for Elixir) and `scim_rails`. **[FACT]** ([github.com/Recruitee](https://github.com/Recruitee), accessed 2026-09-25) **[INFERENCE]** This suggests SAML/SCIM engineering but does not prove shipped features.
- **RBAC, customization, localization:** custom candidate fields. **[SOURCE CLAIM · vendor · third-party GitHub copy]** Everything else is **[UNKNOWN]**. The homepage has an "EN" language selector. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Reporting / analytics / AI:** **[UNKNOWN]** beyond "AI-driven features" marketing.
- **Security / compliance:**
  - A help-center article titled "Recruitee's ISO 27001 certificate, data centers, and GDPR compliance" (title only). **[SOURCE CLAIM · vendor · search excerpt]** ([support.recruitee.com](https://support.recruitee.com/en/articles/1066285-recruitee-s-iso-27001-certificate-data-centers-and-gdpr-compliance), accessed 2026-09-25)
  - A third-party keyword scan of recruitee.com/compliance lists SOC 2, ISO 27001 and GDPR. **[SOURCE CLAIM · independent · GitHub]**
  - Data-center locations are **[UNKNOWN]**.
- **Accessibility (VPAT/WCAG):** **[UNKNOWN]**.
- **Operations transparency:** a public Tellent status page. 2026 incidents include delayed Gmail delivery caused by "temporary rate limiting by Gmail" after an e-mail configuration change (May 2026). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([status](https://status.tellent.com/incidents/hw723t18zg9n), accessed 2026-09-25)

### 5. Business
- **Pricing.** The official [pricing page](https://recruitee.com/pricing) exists (title seen in search) but its **content was not retrieved. Exact official tiers, prices and currency are [UNKNOWN]**.
  - A review aggregator states "3 pricing plans, starting at $109" with "a free trial". The unit and billing period were not visible. **[SOURCE CLAIM · independent · search excerpt]** ([TrustRadius](https://www.trustradius.com/products/recruitee/pricing), accessed 2026-09-25)
  - The homepage offers a no-credit-card trial. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- **Target market:** growing SMB/mid-market. **[SOURCE CLAIM · vendor · search excerpt]**

### 6. Independent perspective
- TrustRadius pricing summary (above). **[SOURCE CLAIM · independent · search excerpt]**
- Listings exist on G2 ("Tellent Recruitee Reviews 2026"), Capterra, Software Advice and SelectSoftware Reviews (titles only). Ratings and themes are **[UNKNOWN]**.
- API Evangelist Kin Score: **21.9/100 ("emerging")**, with agent readiness rated "human-only". **[SOURCE CLAIM · independent · GitHub]**
- *The requirement of ≥2 substantive independent sources is **not met**.*

### 7. Lessons for OpenCATS 2.0
- **Principles evidenced (INFERENCE).** A customizable pipeline via templates. A simple, public careers API with per-job configurable required fields. Jobs and talent pools share one object model.
- **Patterns worth learning from (RECOMMENDATION).**
  1. **Pipeline templates with a default and per-job copy**. This is the minimum viable replacement for the hard-coded statuses (FEAT-001, GAP-005).
  2. **A headless careers API** with per-job required-field configuration and question answers. This is exactly what the careers-portal redesign needs (GAP-012). The apply endpoint must never trust a client-supplied candidate ID (SEC-024).
  3. **Model talent pools as a typed pipeline container** that reuses the job/pipeline machinery (GAP-018).
  4. **First-class duplicate detection + merge + "retrieve deleted"** (soft delete). This directly counters FEAT-002, FEAT-003, FEAT-007 and GAP-017.
  5. **A published XML feed spec for job boards** as a low-cost baseline, before paid multiposting (GAP-015).
- **Things NOT to copy.**
  - Overloading the word "offer" for jobs. It collides with offer management (GAP-009) and confuses API consumers. **[INFERENCE]**
  - Relying on a single third-party CV parser without a fallback (a parsing outage occurred in Feb 2026). This echoes OpenCATS' own dead-parser problem (GAP-023).

### Sources
1. https://github.com/api-evangelist/recruitee — third-party GitHub dataset: homepage screenshot of recruitee.com (2026-06-20); copy of docs.recruitee.com `llms.txt` index; copies of status.tellent.com and recruitee.com/blog feed items; Kin Score; trust-center keyword scan — accessed 2026-09-25
2. https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/recruitee.com/main/1.0.0 — third-party OpenAPI rendering of the Recruitee API (provenance unclear) — accessed 2026-09-25
3. https://github.com/Recruitee — official Recruitee GitHub organisation (fetched; [FACT]) — accessed 2026-09-25
4. https://recruitee.com/ — vendor homepage (search excerpt) — accessed 2026-09-25
5. https://recruitee.com/pricing — vendor pricing page (title only) — accessed 2026-09-25
6. https://en.wikipedia.org/wiki/Recruitee — Wikipedia (independent; search excerpt) — accessed 2026-09-25
7. https://status.tellent.com/incidents/xzzf4pjj6yr1 ; https://status.tellent.com/incidents/y223dq1tnnd5 ; https://status.tellent.com/incidents/scpt63jmdfbc ; https://status.tellent.com/incidents/hw723t18zg9n ; https://status.tellent.com/incidents/fdj5377cb6gg — vendor status page (third-party GitHub copy) — accessed 2026-09-25
8. https://support.recruitee.com/en/articles/1066285-recruitee-s-iso-27001-certificate-data-centers-and-gdpr-compliance — vendor help center (title only) — accessed 2026-09-25
9. https://www.trustradius.com/products/recruitee/pricing — TrustRadius (review aggregator; search excerpt) — accessed 2026-09-25
10. https://www.g2.com/products/tellent-recruitee/reviews ; https://www.capterra.com/p/140650/Recruitee/ ; https://www.softwareadvice.com/hr/recruitee-profile/ ; https://www.selectsoftwarereviews.com/reviews/recruitee — review directories (titles only) — accessed 2026-09-25

---

## Jobvite (Jobvite, part of Employ Inc.)

### 1. Snapshot
- **Ownership.**
  - Jobvite is part of **Employ Inc.** Jobvite's own blog refers to "Employ's recent Customer Advisory Board" (Apr 2026) and to "Employ CEO Jerry Jao" (Jul 2026). **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([Jobvite blog](https://www.jobvite.com/blog/from-credentials-to-capabilities-how-employ-ceo-jerry-jao-hires-beyond-the-resume/), accessed 2026-09-25)
  - A 2022 release is titled "Jobvite, JazzHR and NXTThing RPO Unite Under Employ Brand" (title only). **[SOURCE CLAIM · vendor · search excerpt]** ([BusinessWire, 24 Feb 2022](https://www.businesswire.com/news/home/20220224005670/en/Jobvite-JazzHR-and-NXTThing-RPO-Unite-Under-Employ-Brand), accessed 2026-09-25)
  - Employ's ultimate owner/investors and any other brands under Employ are **[UNKNOWN]** (not verified this session).
- **2026 leadership changes.** **[SOURCE CLAIM · vendor · search excerpt]** ([Yahoo Finance syndicated release](https://finance.yahoo.com/news/employ-inc-appoints-jerry-jao-130000421.html); [employinc.com](https://www.employinc.com/news_item/employ-inc-welcomes-patrick-jean-as-chief-technology-officer/), accessed 2026-09-25)
  - Jerry Jao appointed Employ CEO (Feb 2026).
  - Patrick Jean appointed CTO (25 Feb 2026).
  - Matthew Piercy (CFO) and Eric Waldinger (CRO) are also named; dates are **[UNKNOWN]**.
- **Positioning** (homepage, June 2026 capture): "CUSTOMIZABLE HIRING SOFTWARE — Hire With Confidence, Not Compromise. Jobvite gets you in front of the right talent and helps you land them—while keeping your process intact and your risk in check." **[SOURCE CLAIM · vendor · third-party GitHub copy]** ([api-evangelist/jobvite](https://github.com/api-evangelist/jobvite), accessed 2026-09-25)
- **Target customer.**
  - "Helps enterprises source, hire, and onboard talent". **[SOURCE CLAIM · independent · GitHub]** (third-party profile)
  - Vendor content targets travel and hospitality peak-season hiring via "recruitment marketing software". **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - HQ, founding year and customer counts are **[UNKNOWN]**.
- **Suite composition.**
  - ATS, CRM/recruitment marketing, branded career sites and **Onboard**. The API includes an "Onboard New Hire" endpoint. **[SOURCE CLAIM · independent · GitHub]** (third-party profile)
  - An "EVOLVE Talent Acquisition Suite" was introduced in 2022 (title only). **[SOURCE CLAIM · vendor · search excerpt]**
  - The homepage hero shows an **"Explore" analytics workspace** (a Requisition field picker, visualization toolbar, "Forecast", and a viewer time-zone setting). **[SOURCE CLAIM · vendor · third-party GitHub copy]** **[INFERENCE]** This is ad-hoc BI-style analytics.

### 2. Workflows
*Jobvite's help center and website were blocked and no search budget remained. **All workflow steps are [UNKNOWN]** except the items below.*
- **Requisitions / applications / candidates:** exchanged via the REST API. **[SOURCE CLAIM · independent · GitHub]** (third-party profile citing the help-center "Integrations-API" section)
- **Hire / onboarding hand-off:** the "Onboard New Hire" API pushes employee data into Jobvite Onboard. **[SOURCE CLAIM · independent · GitHub]**
- **Screening / fraud:**
  - In 2026 Jobvite publishes repeatedly on **AI-driven candidate fraud** and early screening, for example "The New Hiring Equation: Speed, Signal, and Safeguards" (Mar 2026) and "What the Rise in AI-Powered Candidate Fraud Really Means for TA Teams" (May 2026). **[SOURCE CLAIM · vendor · third-party GitHub copy]**
  - A search-engine summary stated that Employ announced a **candidate identity-verification partnership (July 2026)** and that Jobvite includes **bias monitoring via IBM watsonx.governance (May 2026)**. The underlying sources were not identified. **[UNKNOWN]**: treat as unverified leads.
- **Referrals:** thought-leadership content only ("The Referral Advantage", Mar 2026). A referral product was not verified. **[UNKNOWN]**
- Requisition approval, publishing, sourcing, scheduling, scorecards, offers, rejection and talent pools: **[UNKNOWN]**.

### 3. User experience
- Top navigation (homepage): Products, Solutions, Resources, Company, Request Demo, **Pricing**; utility bar: Status, Support, Login. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- The analytics "Explore" UI appears in marketing imagery. **[SOURCE CLAIM · vendor · third-party GitHub copy]**
- All recruiter, hiring-manager, interviewer and candidate UX is **[UNKNOWN]**.

### 4. Platform
- **API:** REST/JSON at `https://api.jobvite.com`, with "API keys issued to integration partners". **[SOURCE CLAIM · independent · GitHub]** ([api-evangelist/jobvite apis.yml](https://github.com/api-evangelist/jobvite), which cites help.jobvite.com "Integrations-API", accessed 2026-09-25)
- The official **APIConnectorSamples** repo provides "sample in C# and java to connect to jobvite apis", using **PEM or DER** key files via BouncyCastle. **[FACT]** ([github.com/jobvite/APIConnectorSamples](https://github.com/jobvite/APIConnectorSamples), accessed 2026-09-25) **[INFERENCE]** At least some Jobvite API flows use key-pair cryptography (signing or encryption) in addition to keys.
- Webhooks, SSO/SCIM/MFA, RBAC, audit logs, localization, AI specifics, mobile, accessibility and certifications: **[UNKNOWN]**.

### 5. Business
- The homepage links a "Pricing" page. **[SOURCE CLAIM · vendor · third-party GitHub copy]** Its content and any public prices are **[UNKNOWN]**.
- An SEO blog titled "Jobvite Pricing 2026: What Recruiters Need to Know" exists (title only; weak). **[SOURCE CLAIM · independent · search excerpt]**
- Employ publishes research reports: **Job Seeker Nation 2026** (coining "The Great Pause") and the 2026 hiring benchmarks. **[SOURCE CLAIM · vendor · third-party GitHub copy]** These are marketing assets.

### 6. Independent perspective
- API Evangelist Kin Score: **15.3/100 ("emerging")**, agent readiness 0 ("human-only"). **[SOURCE CLAIM · independent · GitHub]**
- Tracxn and ZoomInfo company profiles exist (titles only). **[UNKNOWN]** content.
- *The requirement of ≥2 substantive independent sources is **not met**.*

### 7. Lessons for OpenCATS 2.0
- **Principles evidenced (INFERENCE).**
  - Trust and risk are becoming a positioning axis ("keeping … your risk in check"; the fraud content series).
  - Analytics is presented as a hero capability.
  - A multi-brand parent (Employ) spreads one set of research and brand assets across several ATS products.
- **Patterns worth learning from (RECOMMENDATION).**
  1. Treat **candidate authenticity/fraud signals** as an emerging requirement. Design identity verification as a pluggable integration point (GAP-025), not a core feature.
  2. **An ad-hoc analytics "explore" surface** over an event-sourced application history is the aspirational end state for GAP-014.
  3. A dedicated **new-hire hand-off API** (GAP-025, HRIS/onboarding).
- **Things NOT to copy.**
  - Partner-only API keys and non-standard key-file handshakes raise integration cost. Prefer OAuth2 client credentials and self-serve scoped tokens (GAP-004). **[INFERENCE]**
  - Opaque pricing.

### Sources
1. https://github.com/api-evangelist/jobvite — third-party GitHub dataset: homepage screenshot of jobvite.com (2026-06-20); copies of jobvite.com/blog feed items; API profile (`apis.yml`); Kin Score — accessed 2026-09-25
2. https://github.com/jobvite/APIConnectorSamples — official Jobvite GitHub repo (fetched; [FACT]) — accessed 2026-09-25
3. https://www.jobvite.com/blog/from-credentials-to-capabilities-how-employ-ceo-jerry-jao-hires-beyond-the-resume/ — vendor blog (third-party GitHub copy) — accessed 2026-09-25
4. https://www.jobvite.com/blog/cab-conversations-what-ta-pros-told-us-and-what-were-doing-next/ — vendor blog (third-party GitHub copy) — accessed 2026-09-25
5. https://www.jobvite.com/blog/the-new-hiring-equation-speed-signal-and-safeguards/ ; https://www.jobvite.com/blog/what-the-rise-in-ai-powered-candidate-fraud-really-means-for-ta-teams/ — vendor blog (third-party GitHub copy) — accessed 2026-09-25
6. https://www.jobvite.com/blog/job-seeker-nation-2026-why-hiring-has-a-trust-problem/ — vendor research blog (third-party GitHub copy) — accessed 2026-09-25
7. https://finance.yahoo.com/news/employ-inc-appoints-jerry-jao-130000421.html — syndicated vendor press release (search excerpt) — accessed 2026-09-25
8. https://www.employinc.com/news_item/employ-inc-welcomes-patrick-jean-as-chief-technology-officer/ — vendor-parent news (search excerpt) — accessed 2026-09-25
9. https://www.businesswire.com/news/home/20220224005670/en/Jobvite-JazzHR-and-NXTThing-RPO-Unite-Under-Employ-Brand — vendor press release (title only) — accessed 2026-09-25
10. https://www.businesswire.com/news/home/20220301006029/en/Jobvite-Introduces-EVOLVE-Talent-Acquisition-Suite — vendor press release (title only) — accessed 2026-09-25
11. https://www.pin.com/blog/jobvite-pricing/ — SEO blog (weak; title only) — accessed 2026-09-25
12. https://tracxn.com/d/companies/jobvite/__VI9-Pl0hwZgP8GTpquZUTooNlqR2Hl-2Qaayhl5Na5s ; https://www.zoominfo.com/c/employ-inc/354828041 — company-data profiles (titles only) — accessed 2026-09-25

---

## Appendix: verification backlog (for the lead; needs a browser or restored search budget)
Priority order. Each item names the official page to check.
1. **Workable pricing.** https://www.workable.com/pricing: tiers, USD prices, monthly vs annual, employee-band basis, add-ons, AI-credit pricing.
2. **Recruitee pricing.** https://recruitee.com/pricing: tier names, EUR/USD, per-job or per-user basis, trial.
3. **Ownership and profile.** Workable (independence, HQ, founding year, customer count). Tellent (investors, HQ). Employ Inc. (investors; which ATS brands it owns in 2026). SmartRecruiters founding year and headcount.
4. **Workflows (help centers):**
   - Workable (help.workable.com): requisition approvals, interview scheduling/self-schedule, scorecards ("evaluation"), offer approvals, e-signature steps, disqualification templates and bulk actions, SSO/SCIM, audit log, roles.
   - Recruitee (support.recruitee.com): same list, plus the knockout/automation "Actions", evaluations and interview scheduling.
   - Jobvite (help.jobvite.com): the full workflow set.
5. **Accessibility.** VPAT/ACR or accessibility statements for all four products.
6. **AI governance.** Bias-audit statements (NYC LL 144), AI opt-out and candidate AI disclosure for Winston, Workable Agents, Recruitee AI and Jobvite (including the unverified IBM watsonx.governance claim).
7. **Independent views.** G2/Capterra/TrustRadius/Gartner Peer Insights ratings and recurring complaints for all four (≥2 per product).
8. **Mobile apps.** App Store / Google Play listings for SmartRecruiters, Workable, Recruitee and Jobvite hiring-manager apps.
9. **Workable API v3 details** (workable.readme.io): webhook event list and signing; token scopes; rate limits.


# Part C — iCIMS, Workday Recruiting, SAP SuccessFactors Recruiting, Oracle Recruiting


*Phase 2: Competitive Market Research for OpenCATS 2.0. Prepared 2026-09-25. All citations accessed 2026-09-25.*

---

## Method, evidence grades and verification status

**Access constraints (FACT, observed in this session).**
- The environment's egress policy blocked `WebFetch` for every vendor, documentation, press and review domain I tried. Returned `EGRESS_BLOCKED` for: newsroom.workday.com, investor.workday.com, news.sap.com, community.sap.com, help.sap.com, api.sap.com, learning.sap.com, docs.oracle.com, www.icims.com, developer-community.icims.com, www.smartrecruiters.com, www.prnewswire.com, www.sec.gov, www.cio.com, www.staffingindustry.com, www.trustradius.com, en.wikipedia.org, joshbersin.com, apps.apple.com and example.com. Only `github.com` and `raw.githubusercontent.com` could be read.
- WebSearch worked for about 25 queries. After that, the session's shared WebSearch budget (200 calls) ran out. **No Oracle-specific searches could be run**, and no review-aggregate (G2, Gartner Peer Insights, Capterra, TrustRadius) searches either.
- To compensate, I read these first-hand on GitHub:
  - **HackerRank's official support-centre integration guides** for Oracle Recruiting Cloud, Workday, SAP SuccessFactors and iCIMS. They are mirrored, with their original `support.hackerrank.com` URLs and last-updated dates, in the public dataset `interviewstreet/hackerrank-orchestrate-may26` at commit `b5a301c`. These are partner documentation that describes each ATS's workflow and admin screens.
  - **Databricks Labs' SAP SuccessFactors connector API docs** (`databrickslabs/lakeflow-community-connectors` at commit `6b68519`, 2026-09-02). They describe the SuccessFactors Recruiting OData v2 entities and fields.
  - A **client generated from Workday's Recruiting WSDL** (`AnmolPanchal/Workday.WebServices`, 2018).
  - **Open-source code** that calls the public career-site APIs of Workday and Oracle, and the iCIMS REST API.
  - **Official vendor GitHub repositories**: `Workday/canvas-kit` and `oracle/cloud-asset-oda-recruitmentbot`.

**Evidence grades used in this file.** These follow the lead's addendum to the PREAMBLE.

| Grade | Meaning |
|---|---|
| **[FACT]** | I read it directly: our repo, a GitHub-hosted official repo, or a GitHub file whose content I opened. For third-party code, the FACT is *that the code does X*. Any capability conclusion drawn from it is tagged INFERENCE. |
| **[SOURCE CLAIM · vendor · search excerpt]** | Seen only as a WebSearch result or excerpt from an official vendor domain, including vendor-filed SEC documents. The vendor URL is cited. |
| **[SOURCE CLAIM · independent · search excerpt]** | Same, for independent press, analysts and directories. |
| **[SOURCE CLAIM · partner doc · first-hand]** | Read in full from a third-party vendor's official documentation (HackerRank support centre, via its GitHub mirror). The partner describes the ATS; the ATS vendor did not write it. |
| **[SOURCE CLAIM · independent spec/code · first-hand]** | Read in full from third-party connector specs or code, such as Databricks Labs or open-source clients. |
| **[INFERENCE]**, **[RECOMMENDATION]**, **[UNKNOWN]** | As defined in the PREAMBLE. |

> **Verification status:** Every claim tagged *search excerpt* comes from a search engine's summary of the page, not from the page itself. Each one must be verified in a browser before external publication. This applies especially to dates, deal values and quotes. Workflow detail from help centres (help.sap.com, docs.oracle.com, Workday Community, care.icims.com) could not be read. Where no partner doc or spec covered a workflow, it is marked **[UNKNOWN]**. I did not fill it from memory.

**Baseline references.** OpenCATS comparisons cite the Phase 0 audit in `docs/audit/`: `PRODUCT_GAPS.md` (GAP-xxx), `FEATURE_INVENTORY.md` (FEAT-xxx), `DATABASE_AUDIT.md` (DB-xxx), `API_AUDIT.md` (API-xxx), `UX_UI_AUDIT.md` (UX-xxx) and `SECURITY_AUDIT.md` (SEC-xxx).

---

## iCIMS Talent Cloud / "Intelligent Hiring Platform" (ICIMS, Inc.; owned by Vista Equity Partners and TA Associates)

### 1. Snapshot

- **Vendor and ownership.**
  - ICIMS, Inc. is a private company. Vista Equity Partners acquired it in 2018. TA Associates invested in 2022, and the two now hold **equal economic ownership**. Susquehanna Growth Equity remains a shareholder. **[SOURCE CLAIM · vendor · search excerpt]** ([Vista press release](https://www.vistaequitypartners.com/news/icims-vista-equity-partners-and-ta-associates-complete-transaction/); [TA Associates release](https://www.prnewswire.com/news-releases/ta-associates-joins-vista-equity-partners-to-accelerate-value-creation-at-icims-301541410.html), accessed 2026-09-25)
  - A TA Associates managing director is quoted as an ICIMS board member in May 2026. **[SOURCE CLAIM · vendor · search excerpt]** ([ICIMS newsroom](https://www.icims.com/company/newsroom/ceoannouncement2026/), accessed 2026-09-25)
  - No 2025–2026 change of ownership surfaced in my searches. **[UNKNOWN]** whether anything has not yet been announced.
- **Leadership change (2026).**
  - On **4 May 2026**, ICIMS named **Marc Thompson** CEO, effective **17 May 2026**. He succeeded **Jason Edelboim**, who had been CEO since January 2024. Thompson joined as CFO in September 2024. **[SOURCE CLAIM · vendor · search excerpt]** ([ICIMS newsroom](https://www.icims.com/company/newsroom/ceoannouncement2026/); [PR Newswire](https://www.prnewswire.com/news-releases/icims-names-marc-thompson-chief-executive-officer-302761460.html); [Edelboim appointment](https://www.prnewswire.com/news-releases/icims-appoints-jason-edelboim-as-chief-executive-officer-302014917.html), accessed 2026-09-25)
  - The brand is styled "ICIMS" in 2026 releases. **[SOURCE CLAIM · vendor · search excerpt]**
- **HQ and founding.** Bell Works, Holmdel, New Jersey. Founded in 2000 by Colin Day. **[SOURCE CLAIM · independent · search excerpt]** ([Dun & Bradstreet profile](https://www.dnb.com/business-directory/company-profiles.icims_inc.a54c269726946ed45ca6cf8b0c47ae8c.html); [Wikipedia](https://en.wikipedia.org/wiki/ICIMS), accessed 2026-09-25)
- **Scale.**
  - The vendor says "thousands of companies across 200 countries and territories — including a quarter of the Fortune 500". **[SOURCE CLAIM · vendor · search excerpt]** ([ICIMS newsroom boilerplate](https://www.icims.com/company/newsroom/ceoannouncement2026/), accessed 2026-09-25)
  - Directory figures conflict: about 4,000 to about 6,000 customers, and about 1,300 to 3,000+ employees. **[SOURCE CLAIM · independent · search excerpt]**, unreconciled.
- **Positioning.**
  - "the talent acquisition platform built to help organizations hire at enterprise scale, powered by billions of hiring interactions and more than 25 years of expertise". **[SOURCE CLAIM · vendor · search excerpt]** ([icims.com](https://www.icims.com/), accessed 2026-09-25)
  - On 1 Sep 2026 ICIMS announced an "Intelligent Hiring Platform" intended to "become the world's most trusted infrastructure for the future of hiring". **[SOURCE CLAIM · vendor · search excerpt]** ([ICIMS newsroom](https://www.icims.com/company/newsroom/intelligenthiringplatform/), accessed 2026-09-25)
- **Target customers and recruiting model.**
  - Enterprise corporate talent acquisition, with a strong 2025–2026 push into high-volume and frontline hiring (Frontline AI, conversational apply). **[SOURCE CLAIM · vendor · search excerpt]**
  - ICIMS is a standalone TA platform that sits beside an HCM. Its July 2026 blog is titled "The Hiring Blind Spot In Your HCM". **[FACT]** Title and URL read from a feed copy ([blog URL](https://www.icims.com/blog/the-hiring-blind-spot-in-your-hcm/), accessed 2026-09-25)
  - **[INFERENCE]** ICIMS explicitly positions itself against HCM-suite recruiting modules.
- **Suite composition.**
  - The Talent Cloud lists **Career Sites, Applicant Tracking, Offer Management, Onboarding, Text Engagement and Connect (Legacy CRM)**. **[SOURCE CLAIM · vendor · search excerpt]** ([Talent Cloud page](https://www.icims.com/icims-talent-cloud-3/), accessed 2026-09-25)
  - Other products: **CXM** (Candidate Experience Management, a recruitment CRM with behaviour-based marketing automation and AI insights), **Digital Assistant** (a candidate FAQ chatbot), video testimonials, **Frontline AI** (March 2026) and **ICIMS Agents** (2025–2026). **[SOURCE CLAIM · vendor · search excerpt]** ([CXM release](https://www.icims.com/company/newsroom/icimscxm/); [CRM page](https://www.icims.com/products/candidate-engagement-platform/candidate-relationship-management-system/), accessed 2026-09-25)
  - Coverage of the spring 2026 release calls the core product "iCIMS Hire". **[SOURCE CLAIM · independent · search excerpt]** ([HR Tech Feed](https://hrtechfeed.com/icims-unveils-ai-powered-spring-release-to-tackle-frontline-hiring-crisis/), accessed 2026-09-25)

### 2. Workflows

| Workflow | What is documented | Who acts / effort-reducers / friction | Grade |
|---|---|---|---|
| Requisition creation | The job record is edited from its **Detail** tab (Job → Detail → Edit). Linkage to HRIS positions is not documented here. | Recruiter. The "Open Job Management Agent" automates "the creation, approval and posting of an open job, with human review at the appropriate stages". | Partner doc · first-hand ([HackerRank iCIMS Prime guide](https://support.hackerrank.com/articles/1495212030-icims-prime-assessment---hackerrank-integration-user-guide)); agent: vendor · search excerpt ([ICIMS Agents](https://www.icims.com/company/newsroom/icimsagents/)) |
| Job approval | The agent description implies an approval step exists. The number of approvers, routing rules and conditions are not documented here. | [UNKNOWN] | [UNKNOWN] (care.icims.com not reachable) |
| Publishing and distribution | Job → **Postings** tab: select the career portal, set start and end dates, then **Post**. | Recruiter. Posting windows are built in. Job-board or aggregator distribution is [UNKNOWN]. | Partner doc · first-hand ([same guide](https://support.hackerrank.com/articles/1495212030-icims-prime-assessment---hackerrank-integration-user-guide)) |
| Sourcing | **Sourcing Agent** (Fall 2025, early access, inside CXM) automates discovery, matching and email outreach. **Sourcing Pipeline Agent** searches the existing database before a job is posted. Spring 2026 added **automatic source attribution** across inbound, outbound and CRM-driven sourcing. | Recruiter and sourcer. | Vendor · search excerpt ([Fall 2025 release](https://www.icims.com/company/newsroom/fallrelease2025/); [Spring 2026 release](https://www.icims.com/company/newsroom/springrelease2026/)) |
| Candidate intake | **Conversational Application Agent** lets candidates apply over web, SMS or WhatsApp. **Frontline AI** is a "mobile-first experience layer" that covers job discovery and interview scheduling "in one fluid session". Through the API, third-party apply tools create a Person profile and then an **applicant workflow** record. | Candidate, with the agent handling the conversation. | Vendor · search excerpt ([ICIMS Agents](https://www.icims.com/company/newsroom/icimsagents/); [HR Tech Feed](https://hrtechfeed.com/icims-unveils-ai-powered-spring-release-to-tackle-frontline-hiring-crisis/)); API: independent code · first-hand ([HeadStart adapter](https://github.com/davidcristian/HeadStart/blob/main/backend/app/appliers/adapters/icims.py)) |
| Screening | The assessment connector framework ("Prime Assessment") has two triggers: **(a) status change**, where the recruiter uses **Advance** then **Send Prime Assessment** and picks a connector and package; **(b) inline**, where an assessment package attached to the job is presented during the online application. Results appear on the candidate's **Screen** tab. **Bulk invites** are sent automatically when candidates are moved to a "Bulk Invite" status ("hundreds of candidates"). AI: **Candidate Summary Agent**, Copilot, AI Talent Explorer. Knockout questions are [UNKNOWN]. | Recruiter. Status-driven automation reduces clicks. Partner integrations need an iCIMS implementation consultant (see §6). | Partner doc · first-hand ([Prime guide](https://support.hackerrank.com/articles/1495212030-icims-prime-assessment---hackerrank-integration-user-guide); [integration guide](https://support.hackerrank.com/articles/9631673147-icims---hackerrank-integration-guide)); AI: vendor · search excerpt |
| Pipeline progression | The Job page's **Candidates** tab lists applicants. **Advance** moves a candidate to the next stage, and statuses can trigger integrations. The API object for an application is the "applicantworkflow" (Submittal profile). Stage-configuration UI is [UNKNOWN]. | Recruiter. | Partner doc · first-hand; independent code · first-hand ([Ph.Ats.Icims AGENTS.md](https://github.com/HappydanceDev/TestClient3_v17/blob/main/apps/umbraco/Ph.Ats.Icims/AGENTS.md)) |
| Interviews | An **Interview Scheduling Agent** was announced in Sep 2026 for delivery "by the end of 2026". Frontline AI schedules frontline interviews conversationally. Native panel scheduling and self-scheduling are [UNKNOWN]. | Coordinator, candidate, agent. | Vendor · search excerpt ([Intelligent Hiring Platform](https://www.icims.com/company/newsroom/intelligenthiringplatform/)) |
| Scorecards / interview kits | The "ICIMS Talent Bot" lets recruiters and hiring managers "provide interview feedback during or after live video meetings, directly within Microsoft Teams". Kits and structured rating scales are [UNKNOWN]. | Interviewers, in Teams. | Vendor · search excerpt |
| Feedback and decision | The **Hiring Agent for Microsoft Teams** (announced for October 2026) lets managers "review candidates, provide feedback, complete approvals and collaborate with recruiters without leaving Teams". | Hiring manager. | Vendor · search excerpt ([Intelligent Hiring Platform](https://www.icims.com/company/newsroom/intelligenthiringplatform/)) |
| Offers | **Offer Management** provides "automated offer templates" and "digitized offer letters". The **Frontline Manager Hiring Agent** generates offer letters on the manager's behalf. Offer approval chains and e-signature vendors are [UNKNOWN]. | Recruiter, hiring manager, agent. | Vendor · search excerpt ([Talent Cloud](https://www.icims.com/icims-talent-cloud-3/); [ICIMS Agents](https://www.icims.com/company/newsroom/icimsagents/)) |
| Hire and hand-off | **Onboarding** tracks new-hire progress and automates form signing. HRIS hand-off runs through marketplace integrations; specific connectors are [UNKNOWN]. | HR and onboarding team. | Vendor · search excerpt |
| Rejection | [UNKNOWN]: disposition reasons, templates and bulk reject not verified. | — | [UNKNOWN] |
| Talent pools / CRM / nurture | **CXM** is a recruitment CRM with behaviour-based marketing automation. The legacy "Connect" CRM remains listed. | Recruitment marketing team. | Vendor · search excerpt |
| Rediscovery | The Sourcing Pipeline Agent can "tap into [the] existing candidate database to identify top profiles before posting a job and automatically engage great-fit candidates". | Recruiter and agent. | Vendor · search excerpt ([ICIMS Agents](https://www.icims.com/company/newsroom/icimsagents/)) |

### 3. User experience

- **Recruiter workflow.** Global **Search → Jobs** leads to a Job page with tabs (**Detail**, **Candidates**, **Postings**). The candidate window has tabs (**Additional Info**, **Screen**) and an **Advance** action. **[SOURCE CLAIM · partner doc · first-hand]** ([HackerRank iCIMS Prime guide, Dec 2024](https://support.hackerrank.com/articles/1495212030-icims-prime-assessment---hackerrank-integration-user-guide), accessed 2026-09-25) The daily home or dashboard is **[UNKNOWN]**.
- **Hiring manager.** ICIMS is pushing hiring-manager work into **Microsoft Teams**: the Hiring Agent covers review, feedback and approvals. The Frontline Manager Hiring Agent is meant to cut "the number of manual steps" in candidate communication and offer letters. **[SOURCE CLAIM · vendor · search excerpt]** An "iCIMS for Microsoft Teams" listing exists on Microsoft's marketplace. **[SOURCE CLAIM · vendor · search excerpt]** ([Microsoft marketplace listing](https://marketplace.microsoft.com/en-us/product/saas/icims1588259311596.icims-teams?tab=overview), accessed 2026-09-25)
- **Interviewer.** Feedback can be captured in Teams via the Talent Bot. **[SOURCE CLAIM · vendor · search excerpt]** Reminders and kits are **[UNKNOWN]**.
- **Candidate.**
  - Career sites; conversational apply over web, SMS and WhatsApp; mobile-first Frontline AI. **[SOURCE CLAIM · vendor · search excerpt]**
  - When an inline assessment is configured, candidates get the test link as part of the application, not by email. **[SOURCE CLAIM · partner doc · first-hand]**
  - Candidate portal and status visibility are **[UNKNOWN]**.
- **Information architecture.** The API data model uses profile types **person, job, source, submittal**, discoverable via `GET /profiledefinitions/v1/{type}/schema`. **[SOURCE CLAIM · independent spec/code · first-hand]** ([Ph.Ats.Icims AGENTS.md](https://github.com/HappydanceDev/TestClient3_v17/blob/main/apps/umbraco/Ph.Ats.Icims/AGENTS.md), accessed 2026-09-25)
- **Search, filters and bulk actions.** Bulk assessment invites are status-driven. **[SOURCE CLAIM · partner doc · first-hand]** Saved views and other bulk actions are **[UNKNOWN]**.
- **Profile, timeline, collaboration and notifications.** **[UNKNOWN]**

### 4. Platform

- **API.**
  - REST APIs. Partners must use **OAuth 2.0 client-credentials**, and the default rate limit is **10,000 API calls per day per customer**. **[SOURCE CLAIM · vendor · search excerpt]** ([Integrating with ICIMS](https://developer-community.icims.com/getting-started/integrating-icims); [developer FAQ](https://developer-community.icims.com/faq); [developer.icims.com](https://developer.icims.com/REST-API), accessed 2026-09-25)
  - There are two regional endpoints: `api.icims.com` and `api-eu.icims.com`, the latter for customers hosted in the EU database. **[SOURCE CLAIM · vendor · search excerpt]**
  - Resources seen in third-party code: `POST /customers/{id}/people`, `POST /customers/{id}/applicantworkflows`, `GET /people/by-email`, and a multipart `PATCH /people/{id}/fields/resume/binary`. **[SOURCE CLAIM · independent spec/code · first-hand]** ([HeadStart](https://github.com/davidcristian/HeadStart/blob/main/docs/modules/appliers.md); [Ph.Ats.Icims](https://github.com/HappydanceDev/TestClient3_v17/blob/main/apps/umbraco/Ph.Ats.Icims/AGENTS.md), accessed 2026-09-25)
- **Webhooks.** Outbound **event notifications** authenticate with OAuth 2.0, HMAC or Basic. The guidance notes that some events are triggered by recruiters and others by candidates or new hires. **[SOURCE CLAIM · vendor · search excerpt]** ([Event Notification Best Practices](https://developer-community.icims.com/applications/icims-applicant-tracking/event-notification-best-practices), accessed 2026-09-25)
- **Integrations.** An ecosystem of "nearly 700 partner solutions" in the ICIMS Marketplace. **[SOURCE CLAIM · vendor · search excerpt]** ([Integrations page](https://www.icims.com/products/integrations/); [Marketplace](https://marketplace.icims.com/en-US/home), accessed 2026-09-25)
- **SSO, SCIM, MFA, RBAC and audit logs.** **[UNKNOWN]**: not verifiable in this session.
- **Customisation.** Marketed as a "highly configurable" ATS. The Spring 2026 release adds "configurability". **[SOURCE CLAIM · vendor · search excerpt]** Custom fields are implied by the per-customer profile schemas. **[INFERENCE]**
- **Localisation.** EU data hosting is available (the `api-eu` endpoint). **[SOURCE CLAIM · vendor · search excerpt]** UI languages and multi-currency support are **[UNKNOWN]**.
- **Reporting and analytics.** A Conversational Analytics Agent (for TA and HR leaders) and CXM source attribution. **[SOURCE CLAIM · vendor · search excerpt]** Standard reporting is **[UNKNOWN]**.
- **AI capabilities.** All **[SOURCE CLAIM · vendor · search excerpt]**:
  - Pre-2025: iCIMS Copilot, Digital Assistant and AI Talent Explorer. The AI brand is "ICIMS Coalesce AI" ([AI page](https://www.icims.com/products/ai-recruiting-software/), accessed 2026-09-25).
  - **9 Jun 2025, "ICIMS Agents":** Sourcing Pipeline, Frontline Manager Hiring, Conversational Application, Candidate Summary, Open Job Management (with human review) and Conversational Analytics agents. The first agents shipped in Q3 2025 ([release](https://www.icims.com/company/newsroom/icimsagents/)).
  - **20 Oct 2025:** AI Sourcing Agent in early access ([release](https://www.icims.com/company/newsroom/fallrelease2025/)). HR Executive named it a Top HR Product of 2026, per the vendor's release ([release](https://www.icims.com/company/newsroom/tophrproduct2026/)).
  - **16 Mar 2026:** Frontline AI ([release](https://www.icims.com/company/newsroom/springrelease2026/)).
  - **1 Sep 2026:** Hiring Agent (Teams) and Interview Scheduling Agent ([release](https://www.icims.com/company/newsroom/intelligenthiringplatform/)).
- **Responsible AI.**
  - ICIMS received **TrustArc's TRUSTe Responsible AI Certification** on 5 Mar 2025 ([release](https://www.icims.com/company/newsroom/trustarccertification/)). It describes bias audits, transparency reporting and human oversight aligned with the OECD AI Principles, the NIST AI RMF and ISO 42001 ([blog](https://www.icims.com/blog/how-icims-built-its-responsible-ai-program/), accessed 2026-09-25). **[SOURCE CLAIM · vendor · search excerpt]**
  - Independent NYC Local Law 144 bias audits by BABL AI (2022, 2023) are reported only by a third-party aggregator ([hireaiscore](https://www.hireaiscore.com/vendors/icims)). **[SOURCE CLAIM · independent · search excerpt]**, weak source and unverified.
  - A Feb 2026 blog covers "Illinois and California AI hiring laws: How iCIMS supports compliance". **[FACT]** Title and URL only ([blog](https://www.icims.com/blog/illinois-and-california-ai-hiring-laws-how-icims-supports-compliance/)).
  - AI opt-out mechanics are **[UNKNOWN]**.
- **Mobile.** Frontline AI and conversational apply are mobile-first. **[SOURCE CLAIM · vendor · search excerpt]** Native recruiter or manager mobile apps are **[UNKNOWN]**.
- **Accessibility.** ICIMS says a third-party auditor authors VPATs for in-scope applications, available via the Trust Center. It tests new products with JAWS and NVDA on Chrome and Firefox. The candidate experience "is capable of being configured by customers" to help them meet Section 508 and ADA Title III needs. **[SOURCE CLAIM · vendor · search excerpt]** ([Accessibility statement](https://www.icims.com/products/talent-cloud-applications/accessibility-statement/), accessed 2026-09-25) The WCAG conformance level is **[UNKNOWN]**.
- **Security and compliance.** ISO/IEC 27001 and ISO/IEC 27701 (2025 certificates on the Trust Center) and a SOC 2 Type II audit. **[SOURCE CLAIM · vendor · search excerpt]** ([trust.icims.com](https://trust.icims.com/); [certifications release](https://www.icims.com/company/newsroom/icims-achieves-leading-international-privacy-and-information-security-certifications/), accessed 2026-09-25) FedRAMP and ISO 42001 certification are **[UNKNOWN]**: neither was confirmed.

### 5. Business

- **Pricing.** No public price list surfaced. **[UNKNOWN]**: treat as quote-based until verified.
- **Packaging.** Modular: ATS, CXM, Offer Management, Onboarding, Text Engagement, Digital Assistant, Frontline AI and Agents. **[SOURCE CLAIM · vendor · search excerpt]** Which modules are add-ons is **[UNKNOWN]**.
- **Enterprise positioning.** Says it serves "a quarter of the Fortune 500". It announced being named a Leader in the **2025 IDC MarketScape for Worldwide Talent Acquisition Vendors**. **[SOURCE CLAIM · vendor · search excerpt]** ([release](https://www.icims.com/company/newsroom/idcmarketscape2025/), accessed 2026-09-25)

### 6. Independent perspective

- **Implementation dependency.** HackerRank's guide says: "The iCIMS team will assign an implementation consultant to help you set up your iCIMS environment. Once this is done, HackerRank can configure the integration." **[SOURCE CLAIM · partner doc · first-hand]** ([HackerRank iCIMS guide, Jun 2025](https://support.hackerrank.com/articles/9631673147-icims---hackerrank-integration-guide), accessed 2026-09-25) **[INFERENCE]** Even marketplace integrations are gated by vendor professional services.
- **Awards.** The HR Executive "Top HR Product" and the IDC MarketScape placement are both reported through ICIMS's own releases. **[SOURCE CLAIM · vendor · search excerpt]**
- **Review aggregates.** G2, Gartner Peer Insights and TrustRadius could not be reached, and the search budget ran out before they could be queried. **[UNKNOWN]**: listed in the follow-up list at the end of this file.

### 7. Lessons for OpenCATS 2.0

- **Product principles evidenced.**
  - **[INFERENCE]** A standalone ATS can compete with HCM suites by specialising in TA depth: CRM, frontline apply, agents. It then hands off to the HCM rather than duplicating HR core.
  - **[INFERENCE]** Hiring-manager work is moving into the tools managers already live in (Teams), with approvals and feedback done there.
  - **[INFERENCE]** Data residency is a first-class API concept (separate US and EU endpoints).
- **Patterns worth learning from.**
  - **[RECOMMENDATION]** Adopt an **OAuth 2.0 client-credentials API with per-tenant quotas** and **signed (HMAC) event notifications**. OpenCATS has no API, keys or webhooks today (`PRODUCT_GAPS.md` GAP-004; `API_AUDIT.md` API-001, API-016, API-017).
  - **[RECOMMENDATION]** Model **stage actions**: assessment on stage entry, bulk invite, inline assessment in the apply flow. This replaces the hard-coded status list and the single status-change side-effect path (`FEATURE_INVENTORY.md` FEAT-001, FEAT-018; GAP-005).
  - **[RECOMMENDATION]** Build **posting windows per channel** (start and end dates) into job publishing. OpenCATS has only pull RSS/XML feeds today (GAP-015; API-012).
  - **[RECOMMENDATION]** Design **regional data placement** (EU vs US) into tenancy and the API from day one. OpenCATS's `site_id` tenancy is vestigial (`DATABASE_AUDIT.md` DB-012; GAP-002).
  - **[RECOMMENDATION]** Any AI feature (GAP-024) should ship with **documented human review points** (as in "human review at the appropriate stages"), bias-audit readiness and jurisdiction-specific notices.
- **Things not to copy.**
  - **[INFERENCE/RECOMMENDATION]** Integrations that need a vendor implementation consultant before a partner can connect. OpenCATS should offer self-serve connector setup with scoped credentials.
  - Pipeline statuses that double as integration triggers (e.g. a "Bulk Invite" status). This mixes candidate progress with automation plumbing. Keep **stage** separate from **action**.
  - Product sprawl, with a legacy CRM ("Connect") alongside a new CRM (CXM).

### Sources

1. https://www.vistaequitypartners.com/news/icims-vista-equity-partners-and-ta-associates-complete-transaction/ — Vista Equity Partners (owner) press release; search excerpt — accessed 2026-09-25
2. https://www.prnewswire.com/news-releases/ta-associates-joins-vista-equity-partners-to-accelerate-value-creation-at-icims-301541410.html — PR Newswire (vendor/owner release); search excerpt — accessed 2026-09-25
3. https://www.icims.com/company/newsroom/ceoannouncement2026/ — ICIMS newsroom (vendor); search excerpt — accessed 2026-09-25
4. https://www.prnewswire.com/news-releases/icims-names-marc-thompson-chief-executive-officer-302761460.html — PR Newswire (vendor release); search excerpt — accessed 2026-09-25
5. https://www.prnewswire.com/news-releases/icims-appoints-jason-edelboim-as-chief-executive-officer-302014917.html — PR Newswire (vendor release); search result title — accessed 2026-09-25
6. https://www.dnb.com/business-directory/company-profiles.icims_inc.a54c269726946ed45ca6cf8b0c47ae8c.html — Dun & Bradstreet (independent directory); search excerpt — accessed 2026-09-25
7. https://en.wikipedia.org/wiki/ICIMS — Wikipedia (independent); search excerpt — accessed 2026-09-25
8. https://www.icims.com/ — ICIMS home (vendor); search excerpt — accessed 2026-09-25
9. https://www.icims.com/company/newsroom/intelligenthiringplatform/ — ICIMS newsroom (vendor), 1 Sep 2026; search excerpt — accessed 2026-09-25
10. https://www.icims.com/blog/the-hiring-blind-spot-in-your-hcm/ — ICIMS blog (vendor), 6 Jul 2026; title read from feed copy in `api-evangelist/icims` on GitHub — accessed 2026-09-25
11. https://www.icims.com/icims-talent-cloud-3/ — ICIMS Talent Cloud page (vendor); search excerpt — accessed 2026-09-25
12. https://www.icims.com/company/newsroom/icimscxm/ — ICIMS CXM release (vendor); search excerpt — accessed 2026-09-25
13. https://www.icims.com/products/candidate-engagement-platform/candidate-relationship-management-system/ — ICIMS CRM page (vendor); search excerpt — accessed 2026-09-25
14. https://hrtechfeed.com/icims-unveils-ai-powered-spring-release-to-tackle-frontline-hiring-crisis/ — HR Tech Feed (independent trade press); search excerpt — accessed 2026-09-25
15. https://www.icims.com/company/newsroom/icimsagents/ — ICIMS Agents release, 9 Jun 2025 (vendor); search excerpt — accessed 2026-09-25
16. https://www.icims.com/company/newsroom/fallrelease2025/ — ICIMS Fall 2025 release (vendor); search excerpt — accessed 2026-09-25
17. https://www.icims.com/company/newsroom/springrelease2026/ — ICIMS Spring 2026 release (vendor); search excerpt — accessed 2026-09-25
18. https://www.icims.com/company/newsroom/tophrproduct2026/ — ICIMS release on HR Executive award (vendor); search excerpt — accessed 2026-09-25
19. https://www.icims.com/products/ai-recruiting-software/ — ICIMS Coalesce AI page (vendor); search result title — accessed 2026-09-25
20. https://www.icims.com/company/newsroom/trustarccertification/ — TrustArc certification release (vendor); search excerpt — accessed 2026-09-25
21. https://www.icims.com/blog/how-icims-built-its-responsible-ai-program/ — ICIMS blog (vendor); search excerpt — accessed 2026-09-25
22. https://www.hireaiscore.com/vendors/icims — HireAIScore (third-party aggregator; weak); search excerpt — accessed 2026-09-25
23. https://www.icims.com/blog/illinois-and-california-ai-hiring-laws-how-icims-supports-compliance/ — ICIMS blog (vendor), 20 Feb 2026; title read from feed copy on GitHub — accessed 2026-09-25
24. https://trust.icims.com/ — ICIMS Trust Center (vendor); search excerpt — accessed 2026-09-25
25. https://www.icims.com/company/newsroom/icims-achieves-leading-international-privacy-and-information-security-certifications/ — ICIMS release (vendor); search excerpt — accessed 2026-09-25
26. https://www.icims.com/products/talent-cloud-applications/accessibility-statement/ — ICIMS Accessibility Statement (vendor); search excerpt — accessed 2026-09-25
27. https://developer-community.icims.com/getting-started/integrating-icims — ICIMS developer community (vendor docs); search excerpt — accessed 2026-09-25
28. https://developer-community.icims.com/faq — ICIMS developer FAQ (vendor docs); search excerpt — accessed 2026-09-25
29. https://developer-community.icims.com/applications/icims-applicant-tracking/event-notification-best-practices — ICIMS developer docs (vendor); search excerpt — accessed 2026-09-25
30. https://developer.icims.com/REST-API — ICIMS developer resources (vendor); search result — accessed 2026-09-25
31. https://www.icims.com/products/integrations/ — ICIMS integrations page (vendor); search excerpt — accessed 2026-09-25
32. https://marketplace.icims.com/en-US/home — ICIMS Marketplace (vendor); search result — accessed 2026-09-25
33. https://marketplace.microsoft.com/en-us/product/saas/icims1588259311596.icims-teams?tab=overview — Microsoft Marketplace listing; search result — accessed 2026-09-25
34. https://www.icims.com/company/newsroom/idcmarketscape2025/ — ICIMS release on IDC MarketScape (vendor); search result — accessed 2026-09-25
35. https://support.hackerrank.com/articles/1495212030-icims-prime-assessment---hackerrank-integration-user-guide — HackerRank support (partner doc, updated 27 Dec 2024); read first-hand via GitHub mirror https://github.com/interviewstreet/hackerrank-orchestrate-may26 (commit b5a301c) — accessed 2026-09-25
36. https://support.hackerrank.com/articles/9631673147-icims---hackerrank-integration-guide — HackerRank support (partner doc, updated 24 Jun 2025); read first-hand via the same mirror — accessed 2026-09-25
37. https://github.com/davidcristian/HeadStart — open-source iCIMS apply adapter (independent code); read first-hand — accessed 2026-09-25
38. https://github.com/HappydanceDev/TestClient3_v17/blob/main/apps/umbraco/Ph.Ats.Icims/AGENTS.md — independent iCIMS integration notes; read first-hand (code search excerpt) — accessed 2026-09-25

---

## Workday Recruiting (Workday, Inc.), including HiredScore and Paradox

### 1. Snapshot

- **Vendor.** Workday, Inc., a public company that files with the US SEC. **[SOURCE CLAIM · vendor (SEC filing) · search excerpt]** HQ, founding year and customer counts were **not re-verified in this session**. **[UNKNOWN]**
- **Leadership change (2026).** On **9 Feb 2026**, co-founder **Aneel Bhusri** returned as CEO. **Carl Eschenbach** stepped down as CEO and director; he had been co-CEO from Dec 2022 and sole CEO from Feb 2024. Workday tied the change to its AI "next chapter". **[SOURCE CLAIM · vendor · search excerpt]** ([Workday newsroom](https://newsroom.workday.com/2026-02-09-Workday-Announces-CEO-Transition-as-Co-Founder-Aneel-Bhusri-Returns-to-Lead-the-Companys-Next-Chapter), accessed 2026-09-25) Independent coverage: **[SOURCE CLAIM · independent · search excerpt]** ([TechCrunch](https://techcrunch.com/2026/02/09/workday-ceo-eschenbach-departs-with-co-founder-aneel-bhusri-returning-as-ceo/); [diginomica](https://diginomica.com/workday-co-founder-aneel-bhusri-returns-ceo-ending-carl-eschenbach-2-year-tenure), accessed 2026-09-25)
- **M&A in recruiting (verified dates).**
  - **HiredScore:**
    - Intent announced **26 Feb 2024**; acquisition completed **29 Mar 2024** for about **$530M cash** (acquisition-date fair value, per Workday's SEC filings). **[SOURCE CLAIM · vendor (SEC filing) · search excerpt]** ([announcement](https://newsroom.workday.com/2024-02-26-Workday-Announces-Intent-to-Acquire-HiredScore); [8-K exhibit, 30 Apr 2024](https://www.sec.gov/Archives/edgar/data/1327811/000132781124000089/wday-04302024x991.htm), accessed 2026-09-25)
    - Workday describes HiredScore as "responsible AI-powered talent orchestration" that uses "explainable AI-driven insights to match, rediscover, and coordinate talent and hiring stakeholders". **[SOURCE CLAIM · vendor · search excerpt]**
  - **Paradox:**
    - Definitive agreement **21 Aug 2025**, about **$1.0B cash**. **[SOURCE CLAIM · vendor (SEC filing) · search excerpt]** ([announcement](https://newsroom.workday.com/2025-08-21-Workday-Signs-Definitive-Agreement-to-Acquire-Paradox,-the-AI-Company-Redefining-the-Frontline-Candidate-Experience); [8-K exhibit](https://www.sec.gov/Archives/edgar/data/1327811/000132781125000182/wday-082125x991.htm), accessed 2026-09-25)
    - Completion announced **1 Oct 2025**. The 10-Q for the quarter ending 31 Oct 2025 records the acquisition in September 2025 at a total fair value of about **$1.1B**: $1.0B cash plus about $20M of previously held equity. **[SOURCE CLAIM · vendor (SEC filing) · search excerpt]** ([completion release](https://newsroom.workday.com/2025-10-01-Workday-Completes-Acquisition-of-Paradox); [10-Q](https://www.sec.gov/Archives/edgar/data/1327811/000132781125000198/wday-20251031.htm), accessed 2026-09-25)
    - The "Workday Paradox Candidate Experience Agent" is "available for purchase now for both existing and new customers through Workday or Paradox". Workday says Paradox "will schedule 32 million job interviews this year — accounting for roughly one out of every 10 interviews in the US". **[SOURCE CLAIM · vendor · search excerpt]**
    - Independent confirmation of completion: **[SOURCE CLAIM · independent · search excerpt]** ([Staffing Industry Analysts](https://www.staffingindustry.com/editorial/it-staffing-report/workday-completes-acquisition-of-conversational-ai-firm-paradox), accessed 2026-09-25)
- **Positioning.** With Paradox, Workday claims "an AI-powered talent acquisition suite to help customers … find, hire, and onboard every type of worker – from the frontline to the back office – for every type of work, from full-time to contingent". **[SOURCE CLAIM · vendor · search excerpt]** ([signing release](https://newsroom.workday.com/2025-08-21-Workday-Signs-Definitive-Agreement-to-Acquire-Paradox,-the-AI-Company-Redefining-the-Frontline-Candidate-Experience))
- **Target customers and model.**
  - **[INFERENCE]** Large enterprises that run Workday HCM. Recruiting operates on the same tenant and data model as positions and staffing (see §2).
  - Frontline and high-volume hiring is now addressed through Paradox; knowledge-worker matching through HiredScore.
- **Suite composition (evidenced).** Workday Recruiting (requisitions, candidates, applicants, postings, interviews, assessments, background checks, agencies, referrals), HiredScore AI, Paradox conversational agent, and developer and integration tooling (Workday Studio, web services, REST APIs, "Workday Build"). **[SOURCE CLAIM]**, with the grades given in §§2–4.

### 2. Workflows

Workday's own administrator documentation could not be reached. The evidence here is (a) operation names in a client generated from Workday's **Recruiting WSDL** (namespace `urn:com.workday/bsvc`, 2018 snapshot), and (b) HackerRank's Workday configuration and user guides (2024–2025).

| Workflow | What is documented | Who acts / effort-reducers / friction | Grade |
|---|---|---|---|
| Requisition creation | Recruiting service operations: `Create_Job_Requisition`, `Edit_Job_Requisition`, `Close_Job_Requisition`, `Move_Job_Requisition`, **`Manage_Job_Requisition_Freeze`**, plus **`Create_Position`** and `Edit_Position_Restrictions`. **Evergreen requisitions**: `Create_/Edit_/Close_Evergreen_Requisition`, `Move_Candidate_to_Linked_Evergreen_Requisition`, `Move_Candidate_to_Linked_Job_Requisition`. The Staffing REST API (v6) lists `jobRequisitions`, `headcountOptions` and `proposedPosition` among job-change values. | Recruiter or HR partner. **[INFERENCE]** Requisitions sit on positions and headcount in core HCM, which gives a single source of truth. "Evergreen" requisitions pool continuous high-volume hiring and link to specific requisitions. "Freeze" supports hiring freezes. | Independent code · first-hand ([RecruitingPort.cs](https://github.com/AnmolPanchal/Workday.WebServices/blob/a7fbcd3f484e6887dbf578b0e54f86bb70c5feb0/Workday.Recruiting/RecruitingPort.cs)); independent spec · first-hand ([jentic staffing v6](https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/workday.com/workday-staffing)) |
| Job approval | Processes are configured as **business processes (BPs)**. The partner guide requires an "Interview (Default Definition)" BP, created via **Create Business Process Definition** if absent. The **Job Application BP** must include an assessment step, and the **Assess Candidate BP** drives assessments. The requisition approval chain itself is not documented here. | Admin configures; approvers act via inbox tasks. **[INFERENCE]** Requisition approvals are also BP-driven. | Partner doc · first-hand ([HackerRank Workday tests config](https://support.hackerrank.com/articles/1782819445-workday---hackerrank-tests-configuration-guide); [interviews config](https://support.hackerrank.com/articles/4722432610-workday---hackerrank-interviews-configuration-guide)) |
| Publishing and distribution | `Post_Job`, `Unpost_Job`, `Update_Job_Posting`, `Get_Job_Posting_Sites`, `Put_Job_Posting_Site`, `Put_Primary_Posting`. Public career sites on `*.myworkdayjobs.com` are backed by a JSON endpoint, `POST /wday/cxs/{tenant}/{site}/jobs`, with `appliedFacets`, `limit`, `offset` and `searchText`. | Recruiter. **[INFERENCE]** Several posting sites per tenant (e.g. internal and external), a primary posting, and a headless faceted job-search API. | Independent code · first-hand (WSDL client); **[FACT]** endpoint used in open-source code ([career-ops workday.mjs](https://github.com/career-ops-hq/career-ops/blob/main/providers/workday.mjs); [ADR-088](https://github.com/Francis1998/agentic-career-search/blob/main/docs/adr/ADR-088-workday-source-adapter.md)) |
| Sourcing | `Refer_a_Candidate` (referrals); `Submit_Recruiting_Agency_Candidate` and `Get_Recruiting_Agency_Additional_Data` (agency submissions). HiredScore handles matching and rediscovery. | Recruiter, referrer, agency. Prospect/CRM features are [UNKNOWN]. | Independent code · first-hand; HiredScore: vendor · search excerpt |
| Candidate intake | `Put_Candidate`, `Put_Applicant`/`Get_Applicants` (pre-hire records), `Put_Candidate_Attachment`, `Get_Job_Application_Additional_Data`. Paradox provides conversational apply for frontline roles. | Candidate; Paradox agent. | Independent code · first-hand; Paradox: vendor · search excerpt |
| Screening | Moving a candidate "Forward" to **Assessment** creates an inbox task, **"Assess Candidate"**. Admins maintain **assessment statuses** ("Overall" vs "Test" status) via *Maintain Assessment Statuses* and a test catalogue via *Maintain Recruiting Assessment Tests*. Default tests can be set on the requisition (*Edit Job Requisition* → Assessments). Results appear on the candidate's **Screening** tab. `Assess_Candidate` and `Put_Background_Check` exist in the API. Knockout questionnaires are [UNKNOWN]. | Recruiter. Friction: the partner says test IDs "must be added to Workday on a per-customer basis … not something that can be automated, so it requires an implementer". Invites are picked up by a partner job that polls **every 10 minutes**. | Partner doc · first-hand ([tests config](https://support.hackerrank.com/articles/1782819445-workday---hackerrank-tests-configuration-guide); [tests user guide](https://support.hackerrank.com/articles/1999755553-workday---hackerrank-tests-user-guide)) |
| Pipeline progression | The requisition's **Candidates** section shows a **"Step/Disposition"** column (e.g. "Review"). The recruiter uses **Move Forward** to Assessment or Interview. `Move_Candidate` is in the API. | Recruiter. **[INFERENCE]** Steps are defined by the Job Application BP, and disposition is a first-class state beside the step. | Partner doc · first-hand; WSDL client |
| Interviews | Candidate page → **Actions** → **Move Candidate** → **Move Forward** → "Interview/Additional Interview" → **Schedule**. The *Schedule Interview* page shows interviewer information and times, then a **Proposed Interview Schedule** confirmation, with an optional **web conference link**. Security domains named "Candidate Data: Interview Schedule" and "Interview Integrations" exist. Paradox provides conversational scheduling. | Recruiter or coordinator. Native candidate self-scheduling is [UNKNOWN]; Paradox is Workday's scheduling agent. | Partner doc · first-hand ([interviews user guide, updated 30 Dec 2025](https://support.hackerrank.com/articles/7842363172-workday---hackerrank-interviews-user-guide)) |
| Scorecards / interview kits | The candidate profile has an **Interview** tab that shows interview details and **scorecard**. The domain "Candidate Data: Interview Feedback Results" exists. Kit structure is [UNKNOWN]. | Interviewers, hiring team. | Partner doc · first-hand |
| Feedback and decision | Reviewers use the Interview tab "to decide whether to move the candidate forward". A formal debrief object is [UNKNOWN]. | Hiring team. | Partner doc · first-hand |
| Offers | Offer approvals, templates and e-signature are [UNKNOWN]: not documented in accessible sources. | — | [UNKNOWN] |
| Hire and hand-off | **[INFERENCE]** Hire happens in the same tenant, since position and requisition are linked (see first row), so there is no external HRIS hand-off for Workday HCM customers. Background checks exist (`Put_/Get_Background_Check`). Onboarding is [UNKNOWN]. | HR. | Inference from WSDL evidence |
| Rejection | The "Disposition" column exists. Reasons, templates and bulk actions are [UNKNOWN]. | Recruiter. | Partner doc · first-hand |
| Talent pools / CRM | [UNKNOWN] | — | [UNKNOWN] |
| Rediscovery | HiredScore "rediscover[s]" talent. **[SOURCE CLAIM · vendor · search excerpt]** | Recruiter, AI. | Vendor · search excerpt |

### 3. User experience

- **Recruiter workflow.** **[SOURCE CLAIM · partner doc · first-hand]**
  - Task- and inbox-driven. Moving a candidate generates inbox entries such as "Assess Candidate".
  - The candidate page lists all of a candidate's job applications, with an **Actions** menu and **Screening** and **Interview** tabs.
  - Requisition pages list candidates with Step/Disposition.
- **Hiring manager.** **[UNKNOWN]**: no accessible documentation.
- **Interviewer.** Scorecard feedback is visible on the Interview tab. **[SOURCE CLAIM · partner doc · first-hand]** Native submission UX and reminders are **[UNKNOWN]**.
- **Candidate.**
  - Career sites on `myworkdayjobs.com` with faceted job search. **[FACT]** The API shape was observed in open-source code.
  - Paradox adds a conversational experience. **[SOURCE CLAIM · vendor · search excerpt]**
  - Apply-flow length, candidate accounts and status portal are **[UNKNOWN]**. See the §6 lead on candidate-account complaints, which is unverified.
- **Navigation and information architecture.**
  - Workday is operated through **tasks and reports** found via global search. The partner guide uses search prefixes such as `bp:` (business processes) and `intsys:` (integration systems), and reports such as *View Domain* and *View Security for Securable Item*. **[SOURCE CLAIM · partner doc · first-hand]**
  - **[INFERENCE]** The IA is "object + related actions" rather than recruiting-specific menus.
- **Design system.** Workday publishes **Canvas Kit**, "a set of components for the Workday Canvas Design System", under Apache 2.0. **[FACT]** ([Workday/canvas-kit README](https://github.com/Workday/canvas-kit), accessed 2026-09-25)
- **Search, saved views, bulk actions, timeline, @mentions and notifications.** **[UNKNOWN]**

### 4. Platform

- **API.**
  - **SOAP web services** (`urn:com.workday/bsvc`). The Recruiting service exposes about 45 operations, listed in §2. **[SOURCE CLAIM · independent spec/code · first-hand]** ([WSDL-generated client, 2018](https://github.com/AnmolPanchal/Workday.WebServices/blob/a7fbcd3f484e6887dbf578b0e54f86bb70c5feb0/Workday.Recruiting/RecruitingPort.cs))
  - **REST APIs** per functional area (e.g. `staffing/v6`, `absenceManagement/v2`) with **OAuth 2.0** and tenant-specific hostnames. **[SOURCE CLAIM · independent spec/code · first-hand]** ([jentic mirror](https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/workday.com), commit 97cef6b, accessed 2026-09-25)
  - The partner guide refers to registering an **OAuth 2.0 API client** and deploying **Workday Studio** CLAR integration packages to a tenant. **[SOURCE CLAIM · partner doc · first-hand]**
- **Webhooks and events.** **[UNKNOWN]** The documented partner flow is poll-based (every 10 minutes). **[SOURCE CLAIM · partner doc · first-hand]**
- **Integration security model.** **[SOURCE CLAIM · partner doc · first-hand]**
  - Dedicated **Integration System Users (ISUs)** with "**Do Not Allow UI Sessions**".
  - **Integration System Security Groups** that grant **domain security policy** permissions (Get, Put, View, Modify) per domain, e.g. "Candidate Data: Interview Schedule".
  - Security changes are **staged and then activated** with a comment ("Activate Pending Security Policy Changes").
  - Optional IP allowlisting.
  - **[INFERENCE]** This is a mature least-privilege and change-control model for machine access.
- **Integrations and marketplace.** A Workday blog (via a third-party summary) describes "Workday Build", a developer platform with a developer copilot and a "Workday Flowise Agent Builder", and a "Built on Workday" marketplace of "over 100 partners". **[SOURCE CLAIM · vendor · search excerpt]** (weak: seen only as a summary; [blog URL](https://blog.workday.com/en-us/introducing-workday-build-developer-platform-build-future-work-ai.html), accessed 2026-09-25) How Workday acquired Flowise is **[UNKNOWN]**.
- **SSO, SCIM and MFA.** **[UNKNOWN]**: not verifiable in this session.
- **RBAC.** Domain-based security policies and security groups, per the partner docs. **[SOURCE CLAIM · partner doc · first-hand]** User-facing role design for recruiters and hiring managers is **[UNKNOWN]**.
- **Audit logs.** **[UNKNOWN]**. Security-policy activation requires a comment. **[SOURCE CLAIM · partner doc · first-hand]**
- **Customisation.** BP definitions, reference IDs, assessment statuses and test catalogues are configurable by admins. **[SOURCE CLAIM · partner doc · first-hand]**
- **Localisation.** **[UNKNOWN]**
- **Reporting.** **[UNKNOWN]**. Third-party notes mention custom-report web services; weak, not used.
- **AI.**
  - HiredScore: explainable matching, rediscovery and orchestration. Paradox: a conversational candidate-experience agent. **[SOURCE CLAIM · vendor · search excerpt]**
  - Bias-audit statements, opt-out and human-in-the-loop design are **[UNKNOWN]**.
- **Mobile, accessibility conformance report and security certifications.** **[UNKNOWN]**: not verifiable in this session.

### 5. Business

- **Pricing.** Not public, as far as I could find. **[UNKNOWN]**: quote-based assumed.
- **Packaging.** Paradox's agent can be bought "through Workday or Paradox", by existing and new customers. **[SOURCE CLAIM · vendor · search excerpt]** **[INFERENCE]** AI capabilities are sold as separately priced SKUs on top of Recruiting.
- **Enterprise positioning.** **[INFERENCE]** Recruiting is part of a unified HCM suite. The acquisitions add depth in frontline hiring (Paradox) and AI matching (HiredScore).

### 6. Independent perspective

- **Press and analysts.**
  - Independent outlets covered the 2026 CEO transition (TechCrunch, diginomica). **[SOURCE CLAIM · independent · search excerpt]**
  - Analyst Josh Bersin called the HiredScore deal "A Potential Shakeup In HR Technology" (Mar 2024). Commentator Matt Charney called Paradox "An Inevitable Acquisition That's Long Overdue" (Aug 2025). **[SOURCE CLAIM · independent · search excerpt]**, titles only; content not read ([Bersin](https://joshbersin.com/2024/03/workday-to-acquire-hiredscore-a-potential-shakeup-in-hr-technology/); [Charney](https://mattcharney.com/2025/08/22/workday-buys-paradox-an-inevitable-acquisition-thats-long-overdue/), accessed 2026-09-25)
- **Configuration burden (partner doc).**
  - Per-customer manual setup "requires an implementer". Creating an integration takes several security-configuration steps: ISU, security group, domain policies, activation, password-rule exemptions. **[SOURCE CLAIM · partner doc · first-hand]**
  - A public job advert on GitHub asks for Workday Recruiting consultants with "4+ years Workday experience" and skills in "Recruiting, Security, integrations, data loads, reporting, and BP configuration". **[SOURCE CLAIM · independent · first-hand]**, weak signal ([repo description](https://github.com/Devender9177/Hiring-for-Workday-Recruiting), accessed 2026-09-25)
  - **[INFERENCE]** Recruiting configuration is a specialist consulting skill.
- **Review aggregates and litigation.** **[UNKNOWN]**. Not queried because the search budget ran out. Leads for verification: G2 and Gartner Peer Insights summaries for Workday Recruiting; candidate-experience complaints about per-employer Workday candidate accounts; and the widely reported *Mobley v. Workday* AI-screening discrimination litigation. **Not verified in this session; do not publish without checking.**

### 7. Lessons for OpenCATS 2.0

- **Product principles evidenced.**
  - **[INFERENCE]** Enterprise buyers value requisitions tied to **positions and headcount**: approved headcount before recruiting, and a freeze capability.
  - **[INFERENCE]** A generic **business-process engine** drives every approval and step through inbox tasks. It is powerful but pushes design work onto implementers.
  - **[INFERENCE]** Machine access follows least privilege, with non-interactive integration users.
- **Patterns worth learning from.**
  - **[RECOMMENDATION]** Introduce **Requisition → Job (1:n openings)** with an optional **Position/Headcount reference** synchronised from an HRIS, plus **freeze/hold** states. Do not build HR core. OpenCATS creates live jobs directly with no approval (GAP-008; `FEATURE_INVENTORY.md` §2.3).
  - **[RECOMMENDATION]** Consider an **evergreen (pooled) requisition** concept for high-volume hiring, linked to specific openings. This is relevant if OpenCATS targets frontline or agency volume.
  - **[RECOMMENDATION]** Keep **Step and Disposition as separate fields** on the application. OpenCATS conflates rejection into two statuses with no reasons (GAP-021; `constants.php:127-128`).
  - **[RECOMMENDATION]** Adopt the **integration-principal model**:
    - service accounts that cannot log into the UI;
    - scopes per resource domain;
    - staged, commented activation of permission changes, written to an append-only audit log.
    - This addresses GAP-003, GAP-011 and SEC-013 (privilege escalation), and OpenCATS's UI-only authorisation (API-005).
  - **[RECOMMENDATION]** Offer a **headless, faceted public job API** for career sites. This addresses GAP-012, FEAT-011 (careers search stubs) and UX-012.
- **Things not to copy.**
  - **[RECOMMENDATION]** A fully generic BP engine as the only way to express hiring workflow. OpenCATS should ship opinionated **workflow templates with typed stages** and a small **approval-policy** model (GAP-005), configurable without consultants.
  - **[RECOMMENDATION]** Polling-based partner integrations and manual entry of partner catalogues. Provide **webhooks plus catalogue sync endpoints** (GAP-004, GAP-025).
  - **[INFERENCE]** Several API generations side by side (SOAP, REST per area, Studio packages). OpenCATS should keep **one versioned REST API with OpenAPI**, plus events.

### Sources

1. https://newsroom.workday.com/2026-02-09-Workday-Announces-CEO-Transition-as-Co-Founder-Aneel-Bhusri-Returns-to-Lead-the-Companys-Next-Chapter — Workday newsroom (vendor); search excerpt — accessed 2026-09-25
2. https://techcrunch.com/2026/02/09/workday-ceo-eschenbach-departs-with-co-founder-aneel-bhusri-returning-as-ceo/ — TechCrunch (independent press); search result — accessed 2026-09-25
3. https://diginomica.com/workday-co-founder-aneel-bhusri-returns-ceo-ending-carl-eschenbach-2-year-tenure — diginomica (independent press); search result — accessed 2026-09-25
4. https://newsroom.workday.com/2024-02-26-Workday-Announces-Intent-to-Acquire-HiredScore — Workday newsroom (vendor); search excerpt — accessed 2026-09-25
5. https://www.sec.gov/Archives/edgar/data/1327811/000132781124000089/wday-04302024x991.htm — Workday 8-K exhibit (SEC filing); search excerpt — accessed 2026-09-25
6. https://blog.workday.com/en-us/workday-acquisition-hiredscore-conversation-athena-karp.html — Workday blog (vendor); search result — accessed 2026-09-25
7. https://newsroom.workday.com/2025-08-21-Workday-Signs-Definitive-Agreement-to-Acquire-Paradox,-the-AI-Company-Redefining-the-Frontline-Candidate-Experience — Workday newsroom (vendor); search excerpt — accessed 2026-09-25
8. https://www.sec.gov/Archives/edgar/data/1327811/000132781125000182/wday-082125x991.htm — Workday 8-K exhibit (SEC filing); search excerpt — accessed 2026-09-25
9. https://newsroom.workday.com/2025-10-01-Workday-Completes-Acquisition-of-Paradox — Workday newsroom (vendor); search excerpt — accessed 2026-09-25
10. https://www.sec.gov/Archives/edgar/data/1327811/000132781125000198/wday-20251031.htm — Workday 10-Q (SEC filing); search excerpt — accessed 2026-09-25
11. https://www.staffingindustry.com/editorial/it-staffing-report/workday-completes-acquisition-of-conversational-ai-firm-paradox — Staffing Industry Analysts (independent trade press); search result — accessed 2026-09-25
12. https://github.com/AnmolPanchal/Workday.WebServices/blob/a7fbcd3f484e6887dbf578b0e54f86bb70c5feb0/Workday.Recruiting/RecruitingPort.cs — client generated from the Workday Recruiting WSDL (independent code, 2018); read first-hand — accessed 2026-09-25
13. https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/workday.com — third-party mirror of Workday REST OpenAPI specs (staffing v6, absenceManagement v2), commit 97cef6b; read first-hand — accessed 2026-09-25
14. https://github.com/career-ops-hq/career-ops/blob/main/providers/workday.mjs — open-source code using the Workday CXS job endpoint (independent code); read first-hand (code search) — accessed 2026-09-25
15. https://github.com/Francis1998/agentic-career-search/blob/main/docs/adr/ADR-088-workday-source-adapter.md — independent ADR documenting the CXS endpoint; read first-hand (code search) — accessed 2026-09-25
16. https://support.hackerrank.com/articles/3252953266-workday---hackerrank-integration — HackerRank support (partner doc, updated 28 Dec 2024); via GitHub mirror https://github.com/interviewstreet/hackerrank-orchestrate-may26 (b5a301c) — accessed 2026-09-25
17. https://support.hackerrank.com/articles/1782819445-workday---hackerrank-tests-configuration-guide — HackerRank support (partner doc, updated 26 Mar 2025); via the same mirror — accessed 2026-09-25
18. https://support.hackerrank.com/articles/1999755553-workday---hackerrank-tests-user-guide — HackerRank support (partner doc, updated 28 Dec 2024); via the same mirror — accessed 2026-09-25
19. https://support.hackerrank.com/articles/4722432610-workday---hackerrank-interviews-configuration-guide — HackerRank support (partner doc, updated 23 Jan 2025); via the same mirror — accessed 2026-09-25
20. https://support.hackerrank.com/articles/7842363172-workday---hackerrank-interviews-user-guide — HackerRank support (partner doc, updated 30 Dec 2025); via the same mirror — accessed 2026-09-25
21. https://github.com/Workday/canvas-kit — Workday official GitHub (Canvas Kit, Apache 2.0); README read first-hand — accessed 2026-09-25
22. https://blog.workday.com/en-us/introducing-workday-build-developer-platform-build-future-work-ai.html — Workday blog (vendor); summary seen only via third-party feed copy in `api-evangelist/workday` — accessed 2026-09-25
23. https://joshbersin.com/2024/03/workday-to-acquire-hiredscore-a-potential-shakeup-in-hr-technology/ — Josh Bersin (independent analyst); search result title — accessed 2026-09-25
24. https://mattcharney.com/2025/08/22/workday-buys-paradox-an-inevitable-acquisition-thats-long-overdue/ — Matt Charney (independent commentator); search result title — accessed 2026-09-25
25. https://github.com/Devender9177/Hiring-for-Workday-Recruiting — public job advert (independent, weak signal); repository description read first-hand — accessed 2026-09-25

---

## SAP SuccessFactors Recruiting (SAP SE), in transition to "SmartRecruiters for SAP SuccessFactors"

### 1. Snapshot

- **Vendor.** SAP SE. SuccessFactors Recruiting is the recruiting module of the SAP SuccessFactors HCM suite. SAP's HQ, founding year and scale were not re-verified in this session. **[UNKNOWN]**
- **Defining 2025–2026 event: SAP acquired SmartRecruiters and is replacing SF Recruiting with it.**
  - **Agreement and close.** Agreement announced **1 Aug 2025**; acquisition completed **11 Sep 2025**; price not disclosed. SmartRecruiters is used by "more than 4,000 organizations". SmartRecruiters customers "maintain the flexibility to continue using SmartRecruiters solutions with SAP or other HCM solutions". **[SOURCE CLAIM · vendor · search excerpt]** ([SAP News, agreement](https://news.sap.com/2025/08/sap-to-acquire-smartrecruiters/); [SAP News, completion](https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/); [SmartRecruiters release](https://www.smartrecruiters.com/news/sap-completes-acquisition-of-smartrecruiters/), accessed 2026-09-25)
  - **Replacement timeline (CIO, Oct 2025).**
    - "SmartRecruiters will entirely replace the recruiting component of SuccessFactors, with customers having **3 to 5 years** to complete their migration".
    - SAP is investing in **migration tooling** for configuration and data.
    - SuccessFactors recruiting users "will be forced to adopt SmartRecruiters", while SmartRecruiters keeps working with other vendors' HR products.
    - **[SOURCE CLAIM · independent · search excerpt]** ([CIO](https://www.cio.com/article/4068172/sap-sets-timeline-to-replace-successfactors-recruiting-module-with-smartrecruiters.html), accessed 2026-09-25)
  - **SAP integration roadmap.** **[SOURCE CLAIM · vendor · search excerpt]** ([SAP Community roadmap](https://community.sap.com/t5/human-capital-management-blog-posts-by-sap/the-smartrecruiters-and-sap-successfactors-integration-roadmap/ba-p/14345532), accessed 2026-09-25)
    - **H1 2026 "Foundations":** SSO via **SAP IAS** and a unified UI.
    - **Next, "Full Integration and Automation":** automatic conversion of candidates into new hires in **Employee Central and Onboarding**. SmartRecruiters and SF Recruiting can run **side by side** for phased migration.
    - **H2 2026 "Elevate and Harmonise":** connect **Winston Chat and Joule**.
  - **Releases.**
    - The 1H 2026 release went live **15 May 2026**. A **15 Jun 2026** connectivity update added a "SuccessFactors Connectivity Hub" in SmartRecruiters settings. **[SOURCE CLAIM · vendor · search excerpt]** ([1H 2026 blog](https://community.sap.com/t5/human-capital-management-blog-posts-by-sap/1h-2026-smartrecruiters-for-sap-successfactors-connected-solutions-and-new/ba-p/14381751); [connectivity blog](https://community.sap.com/t5/human-capital-management-blog-posts-by-sap/smartrecruiters-and-sap-successfactors-connectivity/ba-p/14441523))
    - SAP News headlines in 2026: "SAP Deepens SmartRecruiters Integration…" (Mar) and "The Future of Hiring: SAP Runs SmartRecruiters" (Jun). **[SOURCE CLAIM · vendor · search excerpt]**, titles only.
  - **Conflicting message.** Some SAP-partner blogs say there is "no forced migration" and that SF Recruiting "will continue to operate until a smooth transition path is in place". **[SOURCE CLAIM · independent (SAP partners) · search excerpt]**, which conflicts with CIO's "forced to adopt". Both statements can be true: no immediate cutover, but an end state set by SAP. **[INFERENCE]**
  - **[INFERENCE]** Native SF Recruiting (RCM/RMK) is on a replacement track. It still matters because of its installed base, and because its data model shows what enterprise buyers have required.
- **Positioning of the successor.** SAP cites SmartRecruiters' "deep expertise in high-volume recruiting, recruitment automation and AI-enabled candidate experience", and says its "user-friendly interfaces and seamless workflows will complement SAP's robust HR tools". **[SOURCE CLAIM · vendor · search excerpt]** ([SAP News, agreement](https://news.sap.com/2025/08/sap-to-acquire-smartrecruiters/))
- **Target customers.** **[INFERENCE]** Global enterprises on SAP SuccessFactors HCM.
- **Suite composition.**
  - **Recruiting Management (RCM)** and **Recruiting Marketing (RMK)**, a career-site and posting layer. RMK postings carry their own job IDs, which open-source tools map back to requisition IDs. **[SOURCE CLAIM · independent spec/code · first-hand]**, weak ([RMK lookup tool](https://github.com/cetteup/successfactors-req-id-lookup); [consultant portfolio](https://github.com/karthicksf1996-lgtm/karthicksf.github.io), accessed 2026-09-25)
  - Also **Onboarding** and **Employee Central** (position objects linked to requisitions; see §2). SmartRecruiters' **Winston** AI is the future recruiting layer.

### 2. Workflows

The SAP Help Portal could not be reached. The evidence below comes from the **SuccessFactors Recruiting OData v2 entity model** as documented in Databricks Labs' connector (`sources/sap_successfactors/api_docs/RCM*.md`), read first-hand. All rows are **[SOURCE CLAIM · independent spec/code · first-hand]** unless marked otherwise.

| Workflow | What the data model and docs show | Who acts / effort-reducers / friction | Grade |
|---|---|---|---|
| Requisition creation | `JobRequisition` is template-based (`templateId`, `appTemplateId`) with `isDraft`, `internalStatus`, **`positionNumber`**, `numberOpenings`/`openingsFilled`, legal entity, cost centre, currency and compensation fields. **`JobReqGOPosition`** links requisitions to position objects. `JobRequisitionLocale` holds localised titles and descriptions. | Recruiter or hiring manager. **[INFERENCE]** Requisitions are routed forms (`formDataId`, `formDueDate`) tied to Employee Central positions. | Spec ([RCMJobRequisition doc](https://github.com/databrickslabs/lakeflow-community-connectors/blob/main/src/databricks/labs/community_connector/sources/sap_successfactors/api_docs/RCMJobRequisition_api_doc.md)) |
| Job approval | `JobRequisitionOperator` and `JobRequisitionGroupOperator` assign **operator roles** per user or user group to each requisition. Route-map approval detail is [UNKNOWN] because help.sap.com could not be reached. | Operators by role (e.g. recruiter, hiring manager). | Spec; route maps [UNKNOWN] |
| Publishing and distribution | `JobRequisitionPosting` has `boardId`/`boardName`, `channelId`, `extPartnerAccountId`, **`postStartDate`/`postEndDate` with offsets**, `postingStatus`, `postedBy` and `agencyComments`. `JobRequisition` has `intranetPosting` and `corporatePosting` flags. Real tenant data shows career-site URLs of the form `careerN.successfactors.eu/sfcareer/jobreqcareer?jobId=…&company=…`. | Recruiter. Multi-channel posting (intranet, corporate site, job boards, agencies) with posting windows. **[INFERENCE]** Data-centre-specific hosts (.eu) reflect regional hosting. | Spec; **[FACT]** URL observed in third-party repo data ([ENTITIES.md](https://github.com/HappydanceDev/TestClient3_v17/blob/main/apps/umbraco/Ph.Ats.SuccessFactors/ENTITIES.md)) |
| Sourcing | `TalentPool` (names localised in 15 locales) and `CandidateBackground_TalentPool`. `JobReqFwdCandidates` records candidates forwarded to requisitions. RMK handles the career site. | Recruiter. | Spec |
| Candidate intake | The `Candidate` object carries **`agreeToPrivacyStatement`, `privacyAcceptDateTime`, `dataPrivacyId`**, `visibilityOption`/`shareProfile`, `externalCandidate` and `candidateLocale`. `JobApplication` carries `appLocale`, `source`/`sourceLabel`, `referredBy` and `duplicateProfile`. **`JobApplicationSnapshot_*`** entities store education, experience, languages and certificates *as at application time*. | Candidate. Consent is captured on the profile; the snapshot preserves what was submitted. | Spec ([RCMCandidate doc](https://github.com/databrickslabs/lakeflow-community-connectors/blob/main/src/databricks/labs/community_connector/sources/sap_successfactors/api_docs/RCMCandidate_api_doc.md)) |
| Screening | `JobReqScreeningQuestion` has `required`, **`disqualifier`**, `expectedAnswerValue`/`expectedDir`, **`questionWeight`**, `score`, `ratingScale` and `locale`, i.e. **knockout plus weighted scoring**, localised. Candidate answers are stored in `JobApplicationQuestionResponse`. Vendor integrations appear as `JobApplicationAssessmentOrder`/`Report`/`ReportDetail` and `JobApplicationBackgroundCheckRequest`/`Result`. | Recruiter. Automated disqualification. HackerRank confirms test results "show up directly inside the candidate's SAP profile". | Spec; partner doc · first-hand ([HackerRank SF guide](https://support.hackerrank.com/articles/6922485557-sap-success-factors---hackerrank-integration-guide)) |
| Pipeline progression | `JobApplicationStatus` belongs to a **status set** (`appStatusSetId`). Applications point to a status-set item. `JobApplicationStatusAuditTrail` records `revNumber`, **`skippedStatus`** and `statusComments`. `JobApplication.timeToHire` is stored. | Recruiter. **[INFERENCE]** Each requisition template has its own configurable pipeline; skipped stages are tracked explicitly. | Spec ([RCMJobApplication doc](https://github.com/databrickslabs/lakeflow-community-connectors/blob/main/src/databricks/labs/community_connector/sources/sap_successfactors/api_docs/RCMJobApplication_api_doc.md)) |
| Interviews | `JobApplicationInterview` has start and end, `status`, **`candSlotMapId`**, `recruitEventStaffId` and `templateType`. | Coordinator, candidate. **[INFERENCE]** Slot-based scheduling in which candidates are mapped to interviewer slots. Interview Central UI is [UNKNOWN]. | Spec ([RecruitingRCM doc](https://github.com/databrickslabs/lakeflow-community-connectors/blob/main/src/databricks/labs/community_connector/sources/sap_successfactors/api_docs/RecruitingRCM_api_doc.md)) |
| Scorecards / interview kits | `InterviewOverallAssessment` (`overallRating`, `averageRating`, comments) and `InterviewIndividualAssessment` (per-competency `rating`, comments), linked to `RcmCompetency`. | Interviewers rate competencies. | Spec |
| Feedback and decision | Aggregated `averageRating` on the overall assessment and application. A debrief workflow is [UNKNOWN]. | Hiring team. | Spec |
| Offers | `JobOffer` is **versioned** (`version`), template-based, and holds compensation (salary, bonus, commission, stock), `candJust` (justification), `redefineTemplateApprovers` and `internalStatus`. **`JobOfferApprover`** has `approverOrder`, `approvalStepId`, `approverAction`, action date and comment. **`RCMAdminReassignOfferApprover`** lets an admin reassign approvers. `OfferLetter` has template, **locale**, `sendMode`, subject and body, `offerExpirationDate` and candidate response date and comments; a `sendMailOfferLetter` function exists. | Recruiter drafts; ordered approvers; admin can reassign stuck approvals; letters are localised. E-signature vendors are [UNKNOWN]. | Spec ([RCMOffer doc](https://github.com/databrickslabs/lakeflow-community-connectors/blob/main/src/databricks/labs/community_connector/sources/sap_successfactors/api_docs/RCMOffer_api_doc.md)) |
| Hire and hand-off | `JobApplicationOnboardingData` and `Status` hand over to the SuccessFactors Onboarding process entities. Under SmartRecruiters, "Hire Sync" goes to Employee Central and Onboarding. | HR and onboarding team. | Spec; roadmap: vendor · search excerpt |
| Rejection | Disposition reasons and templates are [UNKNOWN]: not found in the entity excerpts read. | — | [UNKNOWN] |
| Talent pools / CRM | Talent pools exist (see above). RMK CRM and nurture capabilities are [UNKNOWN]. | — | Spec / [UNKNOWN] |
| Rediscovery | Forwarding existing candidates to requisitions (`JobReqFwdCandidates`) and talent pools. | Recruiter. | Spec |
| Audit and anonymisation (cross-cutting) | **`JobApplicationAudit`** stores field-level `oldValue`/`newValue`, `changedBy`, `revNumber`/`revType` and `mergedFrom`. **Anonymisation flags and dates** exist on `Candidate` (`anonymized`, `anonymizedDateTime`), `JobApplication` and `JobOffer` (`anonymizedFlag`, `anonymizedDate`). | Admin, DPO. **[INFERENCE]** GDPR-style retention and anonymisation is designed into every core object, not bolted on. Purge-job configuration is [UNKNOWN]. | Spec |

### 3. User experience

- **Recruiter, hiring manager and interviewer UI.** **[UNKNOWN]**: help.sap.com and learning.sap.com were blocked.
  - An SAP Learning course, "SAP SuccessFactors Recruiting: Recruiter Experience Academy", now includes a lesson "Introducing SmartRecruiters for SAP SuccessFactors". **[SOURCE CLAIM · vendor · search excerpt]** ([learning.sap.com](https://learning.sap.com/courses/sap-successfactors-recruiting-recruiter-experience-academy/introducing-smartrecruiters-for-sap-successfactors_a4bad0ff-b82d-4bf6-8d24-eb112cff2fa3), accessed 2026-09-25)
  - **[INFERENCE]** SAP's recruiter-experience investment is shifting to the SmartRecruiters UI.
- **Candidate.** Career sites are hosted per data centre (see §2). Application locale and localised screening questions and offer letters are stored per record. **[SOURCE CLAIM · independent spec/code · first-hand]**
- **Collaboration.** `CandidateComments` and `JobApplicationComments` exist, as do `CandidateTags`. **[SOURCE CLAIM · independent spec/code · first-hand]**
- **Navigation, search, saved views, bulk actions and notifications.** **[UNKNOWN]**

### 4. Platform

- **API.**
  - **OData v2** at `/odata/v2/{Entity}`, covering Candidate, JobRequisition, JobApplication, JobOffer, interview, assessment and onboarding entities (see §2). **[SOURCE CLAIM · independent spec/code · first-hand]**
  - The Databricks connector uses **HTTP Basic auth with `username@companyId`**. **[SOURCE CLAIM · independent spec/code · first-hand]** Third-party notes mention OAuth 2.0 SAML bearer. **[UNKNOWN]**: not verified.
  - The official reference is the "SAP SuccessFactors API Reference Guide (OData V2)" on help.sap.com; its URL is cited in third-party code. **[FACT]** URL only; content not read ([README](https://github.com/HappydanceDev/TestClient3_v17/blob/main/apps/umbraco/Ph.Ats.SuccessFactors/README.md)).
- **Events.** `EMEvent`, `EMEventAttribute` and `EMEventPayload` entities exist in the API catalogue. **[SOURCE CLAIM · independent spec/code · first-hand]** **[INFERENCE]** An event and monitoring framework exists. Recruiting-specific event types are **[UNKNOWN]**.
- **SSO.** SAP IAS provides SSO between SmartRecruiters and SuccessFactors (roadmap). **[SOURCE CLAIM · vendor · search excerpt]** SAML, SCIM and MFA specifics are **[UNKNOWN]**.
- **RBAC.** Requisition-level operator roles for users and groups. **[SOURCE CLAIM · independent spec/code · first-hand]** Role-based permissions beyond this are **[UNKNOWN]**.
- **Audit.** Field-level application audit and a status audit trail (see §2). **[SOURCE CLAIM · independent spec/code · first-hand]**
- **Customisation.** Requisition, application and offer templates. Customer-defined fields appear in tenant data (e.g. `cust_instr_operators`, `Avg_wk_wage`). **[FACT]** Observed in third-party repo sample data. A consultant's public demo describes RCM configuration via **XML templates**. **[SOURCE CLAIM · independent · first-hand]**, weak ([demo repo](https://github.com/latinochka/sap-successfactors-configuration-demo), accessed 2026-09-25)
- **Localisation.**
  - Localised requisitions (`JobRequisitionLocale`), talent-pool names in 15 locales (de_DE, en_GB, en_US, es_ES, fr_FR, ja_JP, ko_KR, nl_NL, pt_BR, pt_PT, ru_RU, zh_CN, zh_TW and others), and localised offer letters.
  - Country-specific job-classification entities: `FOJobClassLocalAUS`, `BRA`, `CAN`, `FRA`, `GBR`, `ITA` and `USA`.
  - **[SOURCE CLAIM · independent spec/code · first-hand]**. UI language count is **[UNKNOWN]**.
- **Reporting.** A stored `timeToHire`; everything else is **[UNKNOWN]**.
- **AI.**
  - From 2026, SAP's **Joule** and SmartRecruiters' **Winston** "work together as connected agents". **[SOURCE CLAIM · vendor · search excerpt]**
  - CIO reports "four more Joule HR agents" planned. **[SOURCE CLAIM · independent · search excerpt]**
  - Native SF Recruiting AI features are **[UNKNOWN]**.
- **Mobile, accessibility conformance report, security certifications and OFCCP features.** **[UNKNOWN]**: not verifiable in this session.

### 5. Business

- **Pricing.** Not public, as far as I could find. **[UNKNOWN]**
- **Packaging.** SmartRecruiters for SAP SuccessFactors is sold under SAP contracts. Partners report implementation availability "from March 2026", and CIO reported SAP would signal a migration contract by the end of Q1 2026. **[SOURCE CLAIM · independent · search excerpt]**
- **Enterprise positioning.** The SuccessFactors HCM suite with an acquired best-of-breed ATS. **[INFERENCE]**

### 6. Independent perspective

- **Market event (reputable press).** CIO.com published three articles: the acquisition (Aug 2025), the replacement timeline (Oct 2025) and "SAP integrates SmartRecruiters with SuccessFactors" (2026). **[SOURCE CLAIM · independent · search excerpt]** ([Aug 2025](https://www.cio.com/article/4032993/sap-to-acquire-smartrecruiters-to-enhance-its-successfactors-hcm-suite.html); [Oct 2025](https://www.cio.com/article/4068172/sap-sets-timeline-to-replace-successfactors-recruiting-module-with-smartrecruiters.html); [2026](https://www.cio.com/article/4140710/sap-integrates-smartrecruiters-with-successfactors.html), accessed 2026-09-25)
- **Analyst and trade commentary.** Titles only; content not read. **[SOURCE CLAIM · independent · search excerpt]**
  - Josh Bersin: "SAP Acquires SmartRecruiters. Many Implications, Here They Are." ([podcast](https://joshbersin.com/podcast/sap-acquires-smartrecruiters-many-implications-here-they-are/))
  - UNLEASH interview with SmartRecruiters CEO Rebecca Carr ([UNLEASH](https://www.unleash.ai/talent-acquisition/inside-saps-acquisition-of-smartrecruiters-with-ceo-rebecca-carr/))
- **Partner ecosystem signal.** At least six SAP partners published migration guides or webinars: AMS, Effective People, Zalaris, Arago, HR Path and tt-s. **[SOURCE CLAIM · independent · search excerpt]** **[INFERENCE]** The migration is partner-delivered and material in effort. It is also evidence of how much configuration (templates, status sets, screening questions, offer settings) customers built into SF Recruiting.
- **Reviews.** Gartner Peer Insights has a product page for "SmartRecruiters for SAP SuccessFactors". **[SOURCE CLAIM · independent · search excerpt]** Review content is **[UNKNOWN]**, as are G2 and Gartner content for native SF Recruiting.

### 7. Lessons for OpenCATS 2.0

- **Product principles evidenced.**
  - **[INFERENCE]** Enterprise buyers require governance data on every hiring object: consent capture, anonymisation state, field-level audit, ordered approvals and localisation.
  - **[INFERENCE]** A market signal: even SAP concluded that its suite-native recruiting module could not match specialist ATS user experience and innovation speed. It replaced the module with an acquisition and imposed a multi-year migration on customers.
- **Patterns worth learning from.** All **[RECOMMENDATION]**:
  - **Application snapshots.** Store what the candidate submitted at apply time, separate from the evolving profile. OpenCATS overwrites candidate records in place, and the careers apply path can overwrite *any* candidate (`SECURITY_AUDIT.md` SEC-024; `API_AUDIT.md` API-002/003).
  - **Privacy fields on the candidate:** consent statement id, accepted-at timestamp, anonymised flag and date. Cascade anonymisation to applications and offers. OpenCATS has none of this (GAP-002; DB-011, DB-013), and its deletes are destructive and erase reporting history (FEAT-003).
  - **Field-level and stage audit trails:** old and new values, actor, revision, "skipped stage" flag. Keep them append-only. OpenCATS's `history` is incomplete and mutable (DB-016; GAP-011).
  - **Screening questions** with *required / disqualifier / expected answer / weight / score*, localised. OpenCATS's careers questionnaire pre-selects answers and has no knockout logic (UX-011; `FEATURE_INVENTORY.md` §2.14).
  - **Offer model:** version, template, localised letter, ordered approvers with actions and comments, and admin reassignment of approvers (GAP-009).
  - **Posting windows per channel** (internal and external, boards, agencies) with status (GAP-015).
  - **Locale on content objects** (requisition text, offer letter, screening question). OpenCATS has no i18n (GAP-020; UX-015).
- **Things not to copy.**
  - **[INFERENCE/RECOMMENDATION]** Separate products for back office (RCM) and career site/CRM (RMK), with different job identifiers that need mapping tools. OpenCATS 2.0 should have **one job identity** across ATS and careers.
  - **[INFERENCE]** Configuration through templates that need consultants (e.g. XML). Prefer admin UI with safe defaults and versioned config.
  - **[RECOMMENDATION]** Avoid forcing customers through a platform replacement. OpenCATS's own strangler migration should **map legacy statuses 100–800 onto a default workflow template** and preserve history (`MODERNIZATION_OPPORTUNITIES.md`; FEAT-001), with migration tooling as a first-class deliverable.

### Sources

1. https://news.sap.com/2025/08/sap-to-acquire-smartrecruiters/ — SAP News Center (vendor); search excerpt — accessed 2026-09-25
2. https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/ — SAP News Center (vendor); search excerpt — accessed 2026-09-25
3. https://www.smartrecruiters.com/news/sap-completes-acquisition-of-smartrecruiters/ — SmartRecruiters (vendor); search excerpt — accessed 2026-09-25
4. https://www.cio.com/article/4068172/sap-sets-timeline-to-replace-successfactors-recruiting-module-with-smartrecruiters.html — CIO (independent press), Oct 2025; search excerpt — accessed 2026-09-25
5. https://www.cio.com/article/4032993/sap-to-acquire-smartrecruiters-to-enhance-its-successfactors-hcm-suite.html — CIO (independent press); search result — accessed 2026-09-25
6. https://www.cio.com/article/4140710/sap-integrates-smartrecruiters-with-successfactors.html — CIO (independent press); search result — accessed 2026-09-25
7. https://community.sap.com/t5/human-capital-management-blog-posts-by-sap/the-smartrecruiters-and-sap-successfactors-integration-roadmap/ba-p/14345532 — SAP Community (vendor blog); search excerpt — accessed 2026-09-25
8. https://community.sap.com/t5/human-capital-management-blog-posts-by-sap/1h-2026-smartrecruiters-for-sap-successfactors-connected-solutions-and-new/ba-p/14381751 — SAP Community (vendor blog); search excerpt — accessed 2026-09-25
9. https://community.sap.com/t5/human-capital-management-blog-posts-by-sap/smartrecruiters-and-sap-successfactors-connectivity/ba-p/14441523 — SAP Community (vendor blog); search excerpt — accessed 2026-09-25
10. https://news.sap.com/2026/03/smartrecruiters-for-sap-successfactors-ai-driven-hiring-connected-hcm/ — SAP News (vendor); search result title — accessed 2026-09-25
11. https://news.sap.com/2026/06/future-of-hiring-sap-runs-smartrecruiters/ — SAP News (vendor); search result title — accessed 2026-09-25
12. https://learning.sap.com/courses/sap-successfactors-recruiting-recruiter-experience-academy/introducing-smartrecruiters-for-sap-successfactors_a4bad0ff-b82d-4bf6-8d24-eb112cff2fa3 — SAP Learning (vendor); search result — accessed 2026-09-25
13. https://www.weareams.com/resources/events/from-sap-successfactors-recruiting-to-smartrecruiters/ — AMS (partner/independent); search excerpt — accessed 2026-09-25
14. https://www.effectivepeople.com/blog/hr-strategy/smartrecruiters-for-successfactors — Effective People (SAP partner); search result — accessed 2026-09-25
15. https://insights.tt-s.com/en-us/smartrecruiters-becomes-part-of-sap-changes-and-next-steps — tt-s (partner); search excerpt — accessed 2026-09-25
16. https://www.aragoconsulting.com/en/news/insights/smartrecruiters-sap-migration-successfactors — Arago Consulting (partner); search result — accessed 2026-09-25
17. https://hr-path.com/en/blog/hr-solutions/sap-en/sap-smartrecruiters-what-the-new-recruiting-experience-means-for-successfactors-customers/2026/03/26/ — HR Path (partner); search result — accessed 2026-09-25
18. https://zalaris.com/consulting/sap-hcm-solutions/sap-successfactors-hcm-suite/smartrecruiters — Zalaris (partner); search excerpt — accessed 2026-09-25
19. https://joshbersin.com/podcast/sap-acquires-smartrecruiters-many-implications-here-they-are/ — Josh Bersin (independent analyst); search result title — accessed 2026-09-25
20. https://www.unleash.ai/talent-acquisition/inside-saps-acquisition-of-smartrecruiters-with-ceo-rebecca-carr/ — UNLEASH (independent trade press); search result title — accessed 2026-09-25
21. https://www.gartner.com/reviews/product/smartrecruiters-for-sap-successfactors — Gartner Peer Insights (review aggregate); search result (existence only) — accessed 2026-09-25
22. https://github.com/databrickslabs/lakeflow-community-connectors/tree/main/src/databricks/labs/community_connector/sources/sap_successfactors/api_docs — Databricks Labs SAP SuccessFactors connector API docs (independent spec), commit 6b68519 (2026-09-02); RCMJobRequisition, RCMJobApplication, RCMCandidate, RCMOffer and RecruitingRCM docs read first-hand — accessed 2026-09-25
23. https://github.com/HappydanceDev/TestClient3_v17/tree/main/apps/umbraco/Ph.Ats.SuccessFactors — independent SuccessFactors integration code and sample tenant data; read first-hand (code search) — accessed 2026-09-25
24. https://github.com/cetteup/successfactors-req-id-lookup — independent RMK job-ID → requisition-ID lookup tool; description read first-hand — accessed 2026-09-25
25. https://github.com/karthicksf1996-lgtm/karthicksf.github.io — consultant portfolio (RCM/RMK/Onboarding 2.0), weak; description read first-hand — accessed 2026-09-25
26. https://github.com/latinochka/sap-successfactors-configuration-demo — consultant demo of RCM XML-template configuration, weak; description read first-hand — accessed 2026-09-25
27. https://support.hackerrank.com/articles/6922485557-sap-success-factors---hackerrank-integration-guide — HackerRank support (partner doc, updated 22 Jan 2025); via GitHub mirror https://github.com/interviewstreet/hackerrank-orchestrate-may26 — accessed 2026-09-25

---

## Oracle Recruiting (Oracle Fusion Cloud HCM, incl. Oracle Recruiting Booster) (Oracle Corporation)

> **Coverage warning.** This section is **materially incomplete**. docs.oracle.com and Oracle's newsroom were egress-blocked, and the shared WebSearch budget ran out before any Oracle-specific query could run. The evidence below comes only from (a) HackerRank's Oracle Recruiting Cloud integration guides (partner documentation, Dec 2024 – Jan 2026), (b) open-source code that calls Oracle's public Candidate Experience API, and (c) Oracle's own GitHub. Everything else is **[UNKNOWN]** and is listed for follow-up.

### 1. Snapshot

- **Vendor.** Oracle Corporation. Oracle Recruiting (also called Oracle Recruiting Cloud, "ORC") is part of Oracle Fusion Cloud HCM. **[SOURCE CLAIM · partner doc · first-hand]** HackerRank's guides refer to "Oracle Recruiting Cloud (ORC)" and to the Oracle HCM Cloud setup tasks it uses. 2025–2026 leadership, ownership and M&A facts are **[UNKNOWN]**: not verified in this session.
- **Oracle Recruiting Booster.** A public news dataset on GitHub contains the headline of an Oracle press release: "Oracle Recruiting Booster Helps Organizations Find Top Talent and Fast-Track Hiring" (PR Newswire, 19 Oct 2022). **[SOURCE CLAIM · vendor · first-hand]**, headline only, via a third-party dataset ([news_orcl.csv](https://github.com/EmreYuceSF/spy/blob/main/data/raw/news_orcl.csv), accessed 2026-09-25) Its current scope, packaging and AI features are **[UNKNOWN]**.
- **Legacy product.** HackerRank lists **Taleo** as a separate ATS integration from ORC. **[FACT]** Separate catalogue folder in the mirror. **[INFERENCE]** Oracle runs Taleo and Oracle Recruiting side by side.
- **Positioning statement, target customers and scale.** **[UNKNOWN]**
  - Open-source job scrapers target Oracle-hosted career sites of large employers. Code comments name JPMorgan Chase, BNY Mellon, American Express and Honeywell; scrapers also hit Dell and Oracle itself. **[SOURCE CLAIM · independent spec/code · first-hand]** ([career-ops oraclecloud.mjs](https://github.com/career-ops-hq/career-ops/blob/main/providers/oraclecloud.mjs), accessed 2026-09-25)
  - **[INFERENCE]** Adopted by large, regulated enterprises.
- **Suite composition (evidenced).**
  - Recruiting (requisitions, the Candidate Selection Process), **Candidate Experience** (career sites and apply flows), and **Screening Services** partner categories: *Background Checks, Assessments, Tax Credit*. **[SOURCE CLAIM · partner doc · first-hand]**
  - Oracle Digital Assistant has been used for recruiting chatbots: Oracle's official GitHub sample "Sample Recruitment Bot for Oracle Digital Assistant" was archived on 22 Sep 2023. **[FACT]** ([oracle/cloud-asset-oda-recruitmentbot](https://github.com/oracle/cloud-asset-oda-recruitmentbot), accessed 2026-09-25)

### 2. Workflows

| Workflow | What is documented | Who acts / effort-reducers / friction | Grade |
|---|---|---|---|
| Requisition creation | **Job Requisitions** page under *Administer Workforce → Hiring* → **+Add**. The requisition's **Configuration** section lets the user choose the **Candidate Selection Process (CSP)** and the **External Application Flow**. A **Screening Services** section adds Background Checks, Assessments or Tax Credit services. | Recruiter. **[INFERENCE]** Workflow and apply form are chosen *per requisition*. | Partner doc · first-hand ([HackerRank ORC user guide, 28 Dec 2024](https://support.hackerrank.com/articles/3350882088-oracle-recruiting-cloud-and-hackerrank-integration-user-guide)) |
| Job approval | [UNKNOWN] | — | [UNKNOWN] |
| Publishing and distribution | "Proceed with the requisition completion. Once it is posted, the requisition will be available for candidates." Career sites use Oracle's public **Candidate Experience REST API**: `recruitingCESites` lists sites (e.g. `CX_1`, `CX_45001`); `recruitingCEJobRequisitions` uses `finder=findReqs;siteNumber=…` with `facetsList` = LOCATIONS, WORK_LOCATIONS, WORKPLACE_TYPES, TITLES, CATEGORIES, ORGANIZATIONS, POSTING_DATES, FLEX_FIELDS, and `limit` up to 200; `recruitingCEJobRequisitionDetails` uses `finder=ById`. The careers UI path is `/hcmUI/CandidateExperience/{lang}/sites/{site}/job`. Job-board distribution is [UNKNOWN]. | Recruiter posts; candidates browse. **[INFERENCE]** Multi-site, faceted, headless careers architecture (e.g. separate internal and external sites). | Partner doc · first-hand; **[FACT]** endpoints used in open-source code ([career-ops](https://github.com/career-ops-hq/career-ops/blob/main/providers/oraclecloud.mjs); [open-jobs oraclecloud.ts](https://github.com/elliottdehn/open-jobs/blob/main/backend/src/ats/oraclecloud.ts)) |
| Sourcing | [UNKNOWN] (Recruiting Booster scope unknown) | — | [UNKNOWN] |
| Candidate intake | Configurable **External Application Flow**. Assessments can be **inline**, in which case the candidate must finish before submitting, or **post-apply**, shown on the confirmation screen with an email fallback. | Candidate. | Partner doc · first-hand |
| Screening | Assessment triggers: **(a) CSP trigger**, where an assessment is tied to a **Phase and State** and sent automatically when the candidate is moved there; **(b) manual initiation** for any phase and state without moving the candidate; **(c) apply-flow triggers**. One assessment per phase/state; single-phase and multi-phase setups. Results appear in six standard fields: **Status, Score, Assessment Percentile, Band, Comments, View Results**. "ORC only supports updating the Status once." | Recruiter. Automation on stage entry. Friction: a status can be written only once. | Partner doc · first-hand |
| Pipeline progression | The **Candidate Selection Process** is made of **phases and states**. The recruiter chooses **Move** on the candidate profile and selects the target phase and state; "a popup confirm[s] that an assessment will be triggered". The guide then refers to deciding "whether to disposition the candidates or move them forward". | Recruiter. **[INFERENCE]** A two-level pipeline (coarse phase, fine state) with automated actions attached to states. | Partner doc · first-hand |
| Interviews | A partner can generate interview links for up to five interview stages per requisition. Native interview scheduling (self-scheduling, calendar integration) is [UNKNOWN]. | — | Partner doc · first-hand; rest [UNKNOWN] |
| Scorecards / interview kits | A partner scorecard summary can be written into the Comments field. The native interview feedback model is [UNKNOWN]. | — | Partner doc / [UNKNOWN] |
| Feedback and decision | [UNKNOWN] | — | [UNKNOWN] |
| Offers | [UNKNOWN] | — | [UNKNOWN] |
| Hire and hand-off | [UNKNOWN]. **[INFERENCE]** Hire occurs within Fusion HCM for suite customers. | — | [UNKNOWN] |
| Rejection | "Disposition" is referenced; reasons and templates are [UNKNOWN]. | — | Partner doc / [UNKNOWN] |
| Talent pools / CRM | [UNKNOWN] | — | [UNKNOWN] |
| Rediscovery | [UNKNOWN] | — | [UNKNOWN] |

### 3. User experience

- **Recruiter.** Candidate profile with a **Move** action. Requisitions are managed under *Administer Workforce → Hiring*. **[SOURCE CLAIM · partner doc · first-hand]** Home, dashboards, search, saved views and bulk actions are **[UNKNOWN]**.
- **Administrator.** Setup under *Setup and Maintenance → Recruiting and Candidate Experience*. **[SOURCE CLAIM · partner doc · first-hand]** ([HackerRank ORC setup guide, 29 Jan 2026](https://support.hackerrank.com/articles/8672148210-oracle-recruiting-cloud---hackerrank-integration-setup-guide), accessed 2026-09-25)
- **Hiring manager and interviewer.** **[UNKNOWN]**
- **Candidate.**
  - Career sites under `/hcmUI/CandidateExperience/…`, with faceted search including **workplace type** (remote, hybrid, onsite). **[FACT]** Observed in open-source code.
  - Assessment blocks inside the apply flow, and an application profile the candidate returns to. **[SOURCE CLAIM · partner doc · first-hand]**
  - Candidate status portal and communications are **[UNKNOWN]**.

### 4. Platform

- **API.**
  - REST under `/hcmRestApi/resources/{version|latest}/…`.
  - **Unauthenticated** Candidate Experience resources for career sites (see §2). **[FACT]** Used without credentials in open-source code.
  - Authenticated HCM resources include `recruitingJobRequisitions` and `recruitingCandidates` (e.g. version `11.13.18.05`). One code comment states the authenticated requisitions API "needs OAuth". **[SOURCE CLAIM · independent spec/code · first-hand]** ([job-applier oracle.py](https://github.com/hhagely/job-applier/blob/main/src/job_applier/sources/oracle.py); [api-evangelist/oracle-fusion collections](https://github.com/api-evangelist/oracle-fusion), accessed 2026-09-25)
  - A third-party spec cites Oracle's REST docs at `docs.oracle.com/en/cloud/saas/human-resources/26a/farws/`. **[FACT]** URL only. **[INFERENCE]** Release naming such as "26A".
- **Partner integration framework.** All **[SOURCE CLAIM · partner doc · first-hand]**:
  - The partner supplies a **configuration package ZIP**. The admin uploads it via *Setup and Maintenance → Manage Configuration Packages → Upload → Import Setup Data*.
  - The partner then shows as **"Provisioned"** in the *Recruiting Category Enablement* and *Recruiting Category Provisioning and Configuration* tasks.
  - The partner gets an **API user** with privilege "**Use REST Service–Candidate Assessments**", with separate accounts for test and production and optional IP allowlisting.
  - ORC calls the partner using partner-issued OAuth credentials: reference key, client ID and client secret.
  - HackerRank recommends setting up "in a sandbox ORC … before implementing it in your production environment".
- **RBAC.** Predefined **job and abstract roles**: `ORA_PER_RECRUITING_ADMINISTRATOR_JOB` (Recruiting Administrator) and `ORA_ASM_APPLICATION_IMPLEMENTATION_ADMIN_ABSTRACT` (Application Implementation Administrator), plus function privileges. **[SOURCE CLAIM · partner doc · first-hand]** Recruiter and hiring-manager data scoping is **[UNKNOWN]**.
- **Webhooks, SSO, SCIM, MFA, audit logs, localisation, reporting, AI agents, mobile, accessibility conformance report and certifications.** **[UNKNOWN]**: not verifiable in this session.

### 5. Business

- **Pricing.** **[UNKNOWN]**
- **Packaging.** Oracle Recruiting plus the separately named **Recruiting Booster**, as evidenced by the 2022 headline. **[SOURCE CLAIM · vendor · first-hand]**, headline only. Current packaging is **[UNKNOWN]**.
- **Enterprise positioning.** **[INFERENCE]** Recruiting within the Fusion Cloud HCM suite.

### 6. Independent perspective

- **[UNKNOWN]**: no independent reviews, analyst reports or press could be retrieved.
- A friction signal from partner docs: setup requires several admin roles, configuration-package import, dedicated API users, and a sandbox-first rollout. **[SOURCE CLAIM · partner doc · first-hand]** **[INFERENCE]** Implementation is administrator- and partner-intensive.

### 7. Lessons for OpenCATS 2.0

- **Product principles evidenced.**
  - **[INFERENCE]** A per-requisition choice of **selection process** and **apply flow** lets one tenant run very different hiring processes (campus, executive, hourly) without forking configuration.
  - **[INFERENCE]** Screening vendors plug into **typed partner categories** (assessment, background check, tax credit) with a common result schema.
- **Patterns worth learning from.** All **[RECOMMENDATION]**:
  - Model the pipeline as **Stage (phase) → Sub-state** with **actions bound to the sub-state**, triggered automatically on entry or manually. This replaces OpenCATS's flat, hard-coded 11-status list and single side-effect path (FEAT-001; GAP-005; `FEATURE_INVENTORY.md` §3.3).
  - Define a **standard partner result contract** (status, score, percentile, band, comments, report link) for assessment and background-check connectors (GAP-025; GAP-004).
  - Offer **public, unauthenticated, rate-limited careers endpoints** with facets (location, workplace type, category, posting date, custom fields) and **multiple careers sites per tenant**. OpenCATS's careers portal is single-site with stubbed search (FEAT-011; GAP-012; UX-012; API-014 for rate limiting).
  - **Configurable apply flows** that can include inline steps (assessment, questionnaire) per job (GAP-012).
- **Things not to copy.**
  - **[RECOMMENDATION]** Partner enablement by importing configuration packages through admin setup tasks. Use a self-service connector catalogue with OAuth consent and scoped tokens.
  - **[INFERENCE]** Partner status that "can only be updated once". Integration results should be versioned events, not a single mutable field.
  - **[RECOMMENDATION]** Basic-auth API users for partner write-back. Prefer OAuth client credentials with scopes (API-016).

### Sources

1. https://support.hackerrank.com/articles/3350882088-oracle-recruiting-cloud-and-hackerrank-integration-user-guide — HackerRank support (partner doc, updated 28 Dec 2024); via GitHub mirror https://github.com/interviewstreet/hackerrank-orchestrate-may26 (commit b5a301c) — accessed 2026-09-25
2. https://support.hackerrank.com/articles/8672148210-oracle-recruiting-cloud---hackerrank-integration-setup-guide — HackerRank support (partner doc, updated 29 Jan 2026); via the same mirror — accessed 2026-09-25
3. https://support.hackerrank.com/articles/8503244016-oracle-recruiting-cloud---hackerrank-integration- — HackerRank support (partner doc, updated 20 Mar 2025); via the same mirror — accessed 2026-09-25
4. https://github.com/career-ops-hq/career-ops/blob/main/providers/oraclecloud.mjs — open-source ORC Candidate Experience client (independent code); read first-hand (code search) — accessed 2026-09-25
5. https://github.com/elliottdehn/open-jobs/blob/main/backend/src/ats/oraclecloud.ts — open-source ORC client (independent code); read first-hand (code search) — accessed 2026-09-25
6. https://github.com/hhagely/job-applier/blob/main/src/job_applier/sources/oracle.py — open-source ORC client with a note on the authenticated API (independent code); read first-hand (code search) — accessed 2026-09-25
7. https://github.com/api-evangelist/oracle-fusion — third-party Oracle Fusion API profile (recruitingJobRequisitions and recruitingCandidates collections; docs URL); read first-hand — accessed 2026-09-25
8. https://github.com/oracle/cloud-asset-oda-recruitmentbot — Oracle official GitHub sample (archived 22 Sep 2023, UPL 1.0); README read first-hand — accessed 2026-09-25
9. https://github.com/EmreYuceSF/spy/blob/main/data/raw/news_orcl.csv — third-party news-headline dataset containing the 2022 Oracle Recruiting Booster PR headline (weak); read first-hand (code search) — accessed 2026-09-25

---

## Cross-product notes (for the lead; outside the per-competitor template)

1. **Consolidation around acquired AI and candidate-experience layers (2024–2025).**
   - Workday bought **HiredScore** (AI matching, closed 29 Mar 2024) and **Paradox** (conversational frontline candidate agent, completion announced 1 Oct 2025).
   - SAP bought **SmartRecruiters** (closed 11 Sep 2025) and is **replacing its own SF Recruiting module** with it over a reported 3–5-year migration window.
   - ICIMS, the independent ATS, answered with its own **agents** (2025–2026) and **Frontline AI**.
   - All three are **[SOURCE CLAIM · search excerpt]**.
   - **[INFERENCE]** Suite-native recruiting modules lost ground on recruiter and candidate UX. Buyers now expect conversational apply and scheduling, plus AI matching, on top of core ATS records.
2. **Frontline and high-volume hiring is the battleground.** Paradox, ICIMS Frontline AI (SMS and WhatsApp) and SmartRecruiters (per SAP's rationale) all target it. **[SOURCE CLAIM · vendor · search excerpt]**
3. **Hiring-manager work is moving into collaboration tools.** ICIMS's Hiring Agent (Teams) and SAP's Joule + Winston connected agents are examples. **[SOURCE CLAIM · vendor · search excerpt]**
4. **The enterprise data model shares a common shape across the suites.** **[SOURCE CLAIM · first-hand spec/partner docs]**
   - Requisition linked to position and headcount, with freeze and evergreen variants (Workday, SAP).
   - Per-requisition choice of workflow and apply flow (Oracle, SAP templates).
   - Two-level stage model (Oracle phase/state; Workday step/disposition).
   - Knockout and weighted screening questions, versioned offers with ordered approvers, application snapshots, field-level audit, and anonymisation flags (SAP).
   - Multi-site, faceted, headless public job APIs (Workday CXS, Oracle CE).
5. **Machine-access patterns enterprise buyers now expect.** Dedicated non-interactive integration users, scoped domain permissions, staged permission activation (Workday), OAuth client credentials with daily quotas, HMAC-signed events and regional (EU/US) endpoints (ICIMS), and IP allowlisting (Oracle and Workday partner setups). **[SOURCE CLAIM]**
6. **Implementation friction is structural.** Every suite's partner integration needed an implementer, security-group setup or configuration-package import. SAP's migration is partner-delivered. **[INFERENCE]** This is the gap an API-first, self-serve OpenCATS 2.0 can exploit, but only if it matches the governance model (audit, approvals, consent) without the consultant dependency.

## Follow-up verification list (blocked in this session)

- **Oracle (highest priority):**
  - requisition approvals, CSP phases and states, and interview scheduling (docs.oracle.com *Using Recruiting*);
  - offers and e-signature, candidate data purge and retention, OFCCP features;
  - Oracle Recruiting Booster's current scope, 2025–2026 AI agents in Fusion HCM, and Oracle corporate leadership changes in 2025–2026.
- **Workday:**
  - HQ, founding year and customer counts;
  - Recruiting admin guide (offers, requisition approval BPs, candidate home), security certifications, VPAT;
  - *Mobley v. Workday* status; candidate-account complaints.
- **SAP (help.sap.com):**
  - route maps, Interview Central and the Outlook integration, offer approval, e-signature;
  - Data Retention Management and purge, DPCS consent, OFCCP, language count, and the formal end-of-maintenance date for SF Recruiting.
- **ICIMS (care.icims.com and Trust Center):**
  - requisition and offer approval configuration, disposition reasons, SSO and SCIM, role model, VPAT and WCAG level, UI languages.
- **All four:** G2, Gartner Peer Insights and Capterra review summaries (strengths and complaints), mobile apps, and accessibility conformance reports.


# Part D — Additional products: Bullhorn, Loxo, Teamtailor, Gem


Prepared 2026-09-25 by research agent D for the OpenCATS 2.0 Phase 2 market study. This set covers products **beyond** the 11 handled by other agents (Greenhouse, Lever, Ashby, SmartRecruiters, Workable, iCIMS, Workday Recruiting, SAP SuccessFactors Recruiting, Oracle Recruiting, Jobvite, Recruitee).

Profiled here: **Bullhorn** (staffing-agency ATS+CRM, enterprise), **Loxo** (agency ATS+CRM with bundled sourcing data and AI), **Teamtailor** (employer branding and candidate experience, SMB and mid-market), **Gem** (sourcing CRM that added an ATS, marketed as "AI-first all-in-one").

---

## 0. Method, access limits and tagging (read this first)

**Access limits (FACT, observed during this session):**
- **WebFetch was blocked by the egress proxy for every vendor, review and press domain tried.** Blocked domains: `www.bullhorn.com`, `bullhorn.github.io`, `loxo.co`, `www.teamtailor.com`, `docs.teamtailor.com`, `www.gem.com`, `help.gem.com`, `www.g2.com`, `www.capterra.com`, `en.wikipedia.org`, `techcrunch.com`, `www.staffingindustry.com`, `huntscanlon.com`, `thenextweb.com` and `www.enterprisetimes.co.uk`. **Only `github.com` and `raw.githubusercontent.com` could be reached.** Following the proxy rules, I did not try to get around the blocks.
- **The WebSearch budget ran out** after this agent's 12th query. The error was "this session has used its web search budget (200 of 200 WebSearch calls)". The budget is shared with the parallel agents, so any further search was refused. Raising `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` would allow a deeper re-run.

**Evidence grades, per the lead's PREAMBLE addendum:**

| Code | Evidence type | Tag used |
|---|---|---|
| E1 | Official vendor open-source repositories and docs on GitHub, cloned read-only (`git clone --depth 1`), with the commit recorded. Covers Bullhorn `sdk-rest`, `career-portal`, `dataloader` and `novo-elements`, and Teamtailor `tt-partner-docs` (the source of partner.teamtailor.com) and `teamtailor-rb`. Also covers the OpenCATS repository. | **[FACT]** |
| E2 | WebSearch results/excerpts from an official **vendor** domain. The page itself was not opened, so the wording may be paraphrased by the search engine. The vendor URL shown in the results is cited. | **[SOURCE CLAIM · vendor · search excerpt]**. Where the excerpt showed only a page title, the tag adds "(title)". |
| E3 | WebSearch results/excerpts from **independent** pages (press, company databases, review sites, listicles) | **[SOURCE CLAIM · independent · search excerpt]**. Listicles, competitor blogs and competitor-run review pages add "· weak". |
| E4 | Third-party integration code and docs **read directly on GitHub** (Nango integration templates and docs; open-source connectors) that call a vendor API | **[SOURCE CLAIM · independent · third-party code on GitHub]**. This shows how a third party calls the API; it is not official documentation. |
| OC | OpenCATS Phase 0 audit documents | cited as `docs/audit/<file>` plus an ID |

- **Search attribution caveat:** WebSearch returns one synthesized summary over several result pages. Where a claim could come from more than one listed page, every candidate URL is cited.
- **Excluded to comply with the addendum's "no mirrors" rule:**
  - An earlier draft cited Bullhorn blog RSS excerpts found in a third-party GitHub mirror (`api-evangelist/bullhorn`). **Those claims have been removed**, and the affected items are marked UNKNOWN.
  - The api-evangelist "plans/pricing" and "rate-limit" YAML files were never used. They describe themselves as "scaffold defaults".
  - SEO listicles and competitor "vs" posts are used only as leads.
- **Prompt-injection check:** I grepped all cloned repositories for instructions aimed at AI agents. None were found.
- **What UNKNOWN means here:** most UNKNOWN entries in this file mark a gap in evidence access, not a finding that the product lacks the capability.

> **Verification status:** every **[SOURCE CLAIM · … · search excerpt]** in this file was seen only as a WebSearch excerpt and **requires browser verification before external publication**. This applies especially to prices, customer counts, funding figures and quotes. **[FACT]** items can be re-checked at the pinned GitHub commits listed in each Sources section.

---

## 1. Selection rationale

### 1.1 Landscape scan: candidates considered

The G2 and Capterra category pages could not be fetched, so the candidate list below comes from the 12 searches that were possible. The listicles in it are leads only.

| Segment | Candidate | Evidence gathered in this session | Decision |
|---|---|---|---|
| Agency ATS+CRM | **Bullhorn** | Named in every staffing-software list surfaced ([Truffle list, weak](https://www.hiretruffle.com/blog/best-staffing-crms) (accessed 2026-09-25); [Tenzo, weak](https://www.tenzo.ai/blog/best-staffing-agency-software-for-2026) (accessed 2026-09-25)). Acquisitions covered by trade press ([SIA](https://www.staffingindustry.com/news/global-daily-news/bullhorn-acquires-targetrecruit) (accessed 2026-09-25)). 4 official GitHub repositories readable. | **Chosen** |
| Agency ATS+CRM | **Loxo** | $115M growth round, Feb 2025 ([DHRMap](https://www.dhrmap.com/news/talent-intelligence-leader-loxo-raises-115m-to-revolutionize-ai-recruiting-with-tritium-partners-investment) (accessed 2026-09-25)). Public tier structure and help-center articles on its client portal surfaced. | **Chosen** |
| Agency ATS+CRM | Recruit CRM | Public per-user pricing and a documented client-sharing link surfaced (see §1.3) | Considered; partial evidence recorded in §1.3 |
| Agency ATS+CRM | JobAdder, Vincere, Crelate, Avionté Bold, PCRecruiter, Zoho Recruit, TargetRecruit, Manatal, Recruiterflow, Firefish, Tracker RMS, Pin | Only named in a listicle ([Truffle, weak](https://www.hiretruffle.com/blog/best-staffing-crms) (accessed 2026-09-25)). TargetRecruit is now part of Bullhorn (see Bullhorn §1). | Not researched (search budget ran out) |
| Agency, AI-native | Spott (founded 2024) | €18.3M ($21M) Series A led by Balderton (Sept 2026), "500-plus agencies" ([EU-Startups](https://www.eu-startups.com/2026/09/leuven-based-spott-raises-e18-3-million-to-build-the-ai-native-operating-system-for-recruitment-agencies/); [TNW](https://thenextweb.com/news/spott-raises-21m-series-a-balderton-recruitment) (accessed 2026-09-25)) | Recorded as a market signal (§1.3); too new for documentation depth |
| Candidate experience / employer brand | **Teamtailor** | Vendor positioning surfaced ([teamtailor.com](https://www.teamtailor.com/en/) (accessed 2026-09-25)); official partner docs and API client readable on GitHub | **Chosen** |
| Candidate experience | Pinpoint, Homerun | No evidence gathered (search budget ran out) | Not researched |
| CRM/sourcing + ATS, AI-first | **Gem** | Vendor announcements of Gem ATS and "AI-first all-in-one" repositioning ([Gem blog](https://www.gem.com/blog/announcing-gem-ats) (accessed 2026-09-25)); API shape visible in third-party integration code | **Chosen** |
| AI-native / startup ATS | Dover | Free ATS plus $199/month Premium and a fractional-recruiter marketplace ([Dover blog](https://www.dover.com/blog/applicant-tracking-system) (accessed 2026-09-25); [noon.ai review, weak](https://www.noon.ai/blog/articles/280-dover-review) (accessed 2026-09-25)) | Recorded as a signal (§1.3) |
| AI point tools | Alex (AI interviewer, $17M raise, Sept 2025), Dex (AI recruiting, $5.3M seed, Apr 2026) | [TechCrunch](https://techcrunch.com/2025/09/29/ai-recruiter-alex-raises-17m-to-automate-initial-job-interviews/); [Fortune](https://fortune.com/2026/04/28/exclusive-dex-ai-powered-recruiting-startup-raises-seed-round-notion-capital/) (accessed 2026-09-25) | Not an ATS; signal only |
| HRIS-native recruiting | Rippling Recruiting (also BambooHR, Personio) | Launched Aug 2023 ([Enterprise Times](https://www.enterprisetimes.co.uk/2023/08/04/rippling-launches-new-ats-rippling-recruitment/) (accessed 2026-09-25)) | Pattern note in §1.3; not profiled in full |

### 1.2 Why these four

**Bullhorn: staffing-agency incumbent, and the closest model of OpenCATS's own domain.**
OpenCATS is an agency ATS: client companies, contacts, job orders, submissions and placements (`docs/audit/FEATURE_INVENTORY.md` §2.3, §2.7, §2.8, §3.1). Bullhorn's official Java SDK models the same objects under nearly the same names: `ClientCorporation`, `ClientContact`, `JobOrder`, `JobSubmission` and `Placement`. It then extends them into business development (`Lead`, `Opportunity`), commissions (`PlacementCommission`), effective-dated placement changes (`PlacementChangeRequest`) and back-office billing (`BillingProfile`, `InvoiceTerm`) ([sdk-rest entities](https://github.com/bullhorn/sdk-rest/tree/9a9b711c28880eab63173d86422618d52e1e6fa4/src/main/java/com/bullhornsdk/data/model/entity/core/standard); [dataloader examples](https://github.com/bullhorn/dataloader/tree/135f88b417aaaf31e57f94d8a0b94a73506ce09e/examples/load) (accessed 2026-09-25)) **[FACT]**.
It is also consolidating the agency market. Acquisitions: TargetRecruit (closed July 31, 2025), KonaSearch (Sept 2024) and Mployee (Jan 2024) ([Bullhorn press release](https://www.bullhorn.com/news-and-press/press-releases/bullhorn-acquires-targetrecruit/); [SIA](https://www.staffingindustry.com/news/global-daily-news/bullhorn-acquires-targetrecruit) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor + independent · search excerpt]**.
That makes Bullhorn the reference for the agency features that `docs/audit/PRODUCT_GAPS.md` (Unknowns) names as open: "client portal, placements, billing".

**Loxo: a modern agency platform that bundles ATS, CRM, sourcing data and AI.**
It is a second agency data point, positioned mid-market and "AI-native" rather than enterprise-incumbent. It also meets the "CRM/sourcing + ATS" criterion.
- Tiers run Free, Basic, Professional and Enterprise. The Professional tier bundles a client portal, AI agents, the Loxo Source talent data and omni-channel outreach ([loxo.co/pricing](https://www.loxo.co/pricing) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**.
- The help center documents a client/hiring-manager portal in some detail ([Share Candidates](https://help.loxo.co/en/articles/8149140-share-candidates) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**.
- It received a $115M growth investment led by Tritium Partners in Feb 2025 ([DHRMap](https://www.dhrmap.com/news/talent-intelligence-leader-loxo-raises-115m-to-revolutionize-ai-recruiting-with-tritium-partners-investment) (accessed 2026-09-25)) **[SOURCE CLAIM · independent · search excerpt]**.

**Teamtailor: employer branding and candidate experience in SMB and mid-market.**
Its positioning is "Next Generation ATS & Employer Branding" ([teamtailor.com](https://www.teamtailor.com/en/) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**.
Its official partner documentation on GitHub describes concrete candidate-experience and compliance mechanisms that map to OpenCATS gaps GAP-012 (careers portal), GAP-002 (privacy/consent) and GAP-021 (rejection reasons) ([tt-partner-docs](https://github.com/teamtailor/tt-partner-docs/tree/cba212f6143dcff59e44a4330a9a4988f189476a) (accessed 2026-09-25)) **[FACT]**:
- a consent model;
- conditional screening questions;
- a "transparent recruiting" delay before rejections are communicated;
- regional data stacks (EU/NA/AP).

**Gem: the "sourcing CRM becomes ATS" convergence, AI-first.**
Gem announced its own ATS and now calls itself "the only AI-first all-in-one recruiting platform". It says it combines "ATS, CRM, sourcing, scheduling, and analytics", and it names three AI agents: sourcing, application review and fraud detection ([Gem blog](https://www.gem.com/blog/allow-us-to-re-introduce-ourselves-say-hello-to-the-only-ai-first-all-in-one); [Gem ATS announcement](https://www.gem.com/blog/announcing-gem-ats) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**.
This bears directly on GAP-018 (sourcing CRM) and GAP-024 (AI), and on whether OpenCATS 2.0 should treat CRM and ATS as one system.

### 1.3 Considered but not profiled: pattern notes

- **Recruit CRM (agency, SMB)**
  - Pricing: "starting at $99 per user per month (billed annually)", with three plans (Pro, Business, Enterprise). Enterprise adds white-labelling and a dedicated account manager ([recruitcrm.io/pricing](https://recruitcrm.io/pricing/); [FAQ](https://recruitcrm.io/frequently-asked-questions/) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**.
  - Client portal: an "Online Candidate List Link" lets a client review shortlisted candidates in List or Kanban view. The client can move candidates between hiring stages that the agency has flagged "Let Client Use" on the master hiring pipeline, and can leave remarks that sync back. The agency chooses which fields are shared ([help: receiving feedback from clients](http://help.recruitcrm.io/en/articles/1466788-receiving-feedback-from-clients); [help: submit candidates to contacts](https://help.recruitcrm.io/en/articles/1801407-submit-candidates-to-contacts) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**.
  - This corroborates the Loxo pattern: a **scoped, link-based client review surface with per-stage client permissions**.
- **Spott (AI-native agency ATS+CRM, founded 2024)**
  - Raised a €2.8M seed in March 2025, then a €18.3M ($21M) Series A in Sept 2026 (Balderton; Base10, Y Combinator and Fortino also participated).
  - Claims 500+ agencies and says revenue is up more than tenfold this year.
  - Product scope: record management, search, messaging, outreach and workflow automation "in a single product" ([EU-Startups](https://www.eu-startups.com/2026/09/leuven-based-spott-raises-e18-3-million-to-build-the-ai-native-operating-system-for-recruitment-agencies/); [TNW](https://thenextweb.com/news/spott-raises-21m-series-a-balderton-recruitment) (accessed 2026-09-25)) **[SOURCE CLAIM · independent · search excerpt]**.
  - **[INFERENCE]** Investors are funding new *agency-specific* ATS+CRM platforms in 2025–2026, so the agency segment is not stagnant.
- **Dover (startup ATS)**
  - Offers a free ATS with unlimited users and jobs, a $199/month Premium tier (AI applicant scoring, AI note-taking) and a marketplace of fractional recruiters at about $75–$125/hour ([Dover blog](https://www.dover.com/blog/applicant-tracking-system); [Dover help center](https://help.dover.com/en/articles/6480741-getting-started-with-ats-features) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**.
  - A third-party review says it has 4.4/5 on G2 across about 27 reviews ([noon.ai, weak](https://www.noon.ai/blog/articles/280-dover-review) (accessed 2026-09-25)).
  - **[INFERENCE]** The free-ATS-plus-services model (Dover) and the free-tier ATS+CRM (Loxo, §Loxo 5) both use the ATS as an acquisition funnel.
- **HRIS-native recruiting (Rippling Recruiting)**
  - Launched in August 2023 ([Enterprise Times](https://www.enterprisetimes.co.uk/2023/08/04/rippling-launches-new-ats-rippling-recruitment/); [Rippling blog](https://www.rippling.com/blog/introducing-rippling-recruiting) (accessed 2026-09-25)).
  - Claimed differentiators: candidate data "becomes employee data the moment an offer is signed", because the ATS shares a database with payroll and HR; approved headcount and compensation bands flow into the ATS; and hiring approvals, onboarding and referral-bonus payouts are automated ([rippling.com/products/hr/recruiting](https://www.rippling.com/products/hr/recruiting); [ERP Research](https://www.erpresearch.com/erp-add-ons/talent/rippling-ats) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor + independent · search excerpt]**.
  - **[INFERENCE]** This is a real pattern: suite vendors bundle recruiting and compete on "no hand-off". For OpenCATS 2.0 the lesson is a clean, event-driven hire → HRIS hand-off (GAP-025), not building an HRIS.
  - Not profiled in full because evidence access was limited.

---

## Bullhorn (Bullhorn, Inc.)

### 1. Snapshot
- **Vendor and ownership:** Bullhorn, Inc.
  - Current owners and financing: **[UNKNOWN]**. Could not be verified, because Wikipedia, PitchBook and press pages were unreachable and the search budget was spent.
  - **[FACT]** Bullhorn's GitHub organization lists locations "Boston MA, St. Louis MO, Vancouver BC, San Francisco CA, Richmond VA" and has 57 repositories ([github.com/bullhorn](https://github.com/bullhorn) (accessed 2026-09-25)).
  - Founding year and headcount: **[UNKNOWN]**.
- **Recent M&A** **[SOURCE CLAIM · vendor + independent · search excerpt]** ([Bullhorn press release](https://www.bullhorn.com/news-and-press/press-releases/bullhorn-acquires-targetrecruit/); [SIA](https://www.staffingindustry.com/news/global-daily-news/bullhorn-acquires-targetrecruit); [Hunt Scanlon](https://huntscanlon.com/bullhorn-acquires-targetrecruit/); [Salesforce Ben](https://www.salesforceben.com/bullhorn-bolsters-salesforce-offering-with-targetrecruit-buyout/); [Tracxn](https://tracxn.com/d/acquisitions/acquisitions-by-bullhorn/__v2SBoBqwQ1yS34RKOgfuzA3WAaFGaNC6-Wk3yALGuVQ) (all accessed 2026-09-25)):
  - **TargetRecruit.** Houston-based provider of Salesforce-built front- and middle-office software for staffing. Announced Aug 2025; closed July 31, 2025. Bullhorn says the deal grows its Salesforce-ecosystem user base to "nearly 150,000" and strengthens healthcare staffing (locum tenens, per diem).
  - **KonaSearch** (announced Sept 2024): search and candidate matching for staffing and executive search.
  - **Mployee** (Jan 2024): Netherlands-based, Salesforce-built front- and mid-office product.
  - Tracxn lists 16 Bullhorn acquisitions as of Jul 2026.
- **Product lines:**
  - A Salesforce-built line exists and is being expanded through acquisitions (TargetRecruit, Mployee) **[SOURCE CLAIM · vendor · search excerpt]** (press release above).
  - Official product names, the AI product line and packaging: **[UNKNOWN]**, because the vendor site was blocked and the search budget was spent.
- **Positioning quote:** **[UNKNOWN]**, because official pages could not be fetched. Listicles describe Bullhorn as "a serious ATS and CRM foundation with a strong system of record for candidates, clients, jobs, and activity" ([Truffle](https://www.hiretruffle.com/blog/best-staffing-crms) (accessed 2026-09-25)) **[SOURCE CLAIM · independent · search excerpt · weak]**.
- **Target customer:** staffing and recruitment agencies. The TargetRecruit deal is described as strengthening healthcare staffing (locum tenens, per diem) **[SOURCE CLAIM · vendor · search excerpt]**. Listicles recommend it for established or enterprise agencies (50+ recruiters) **[SOURCE CLAIM · independent · search excerpt · weak]**. The data model (below) covers perm, contract/temp, shifts and travel staffing **[FACT]**.
- **Suite composition, as evidenced by the data model** **[FACT]** ([sdk-rest entities](https://github.com/bullhorn/sdk-rest/tree/9a9b711c28880eab63173d86422618d52e1e6fa4/src/main/java/com/bullhornsdk/data/model/entity/core/standard); [dataloader examples](https://github.com/bullhorn/dataloader/tree/135f88b417aaaf31e57f94d8a0b94a73506ce09e/examples/load) (accessed 2026-09-25)):
  - **Front office:** Candidate, ClientCorporation, ClientContact, Lead, Opportunity, JobOrder, JobSubmission, Sendout, Placement, Tearsheet, Appointment, Task, Note, DistributionList, JobBoardPost.
  - **Middle office:**
    - PlacementChangeRequest;
    - placement rate cards;
    - onboarding status fields (`onboardingStatus`, `onboardingPercentComplete`);
    - certifications and credentialing (CandidateCertification, PlacementCertification, CertificationGroup);
    - shifts (Shift, JobShift, JobShiftAssignment, PlacementShiftSet);
    - housing (HousingComplex and related entities, e.g. for travel staffing).
  - **Back office:** BillingProfile, InvoiceTerm, InvoiceStatementMessageTemplate, GeneralLedgerAccount and segments, Federal/State/LocalTaxForm, PlacementTimeAndExpense, CandidateTaxInfo, DirectDepositAccount.
  - Whether these modules are sold separately: **[UNKNOWN]**.

### 2. Workflows
Agency workflows come first because they map onto OpenCATS's existing objects. Unless stated otherwise, the evidence is the entity and field model in the official SDK and Data Loader templates **[FACT]**. UI steps and click counts are **[UNKNOWN]**, because help-center pages were not reachable.

- **Business-development (BD) pipeline: Lead → Opportunity → JobOrder** **[FACT]**
  - `Lead` is a person or company prospect with `leadSource`, `status`, `conversionSource`, `priority`, `owner`, `assignedTo`, `massMailOptOut`, `smsOptIn` and `campaignSource`.
  - `Opportunity` is a deal with `dealValue`, `winProbabilityPercent`, `weightedDealValue`, `expectedCloseDate`, `expectedFee`, `expectedBillRate`, `expectedPayRate`, `reasonClosed`, `actualCloseDate`, `numOpenings` and `lead`, and a `jobOrders` collection. `JobData` (the parent of JobOrder) has an `opportunity` link.
  - **[INFERENCE]** Deals convert into job orders with traceability. This is a weighted sales pipeline inside the ATS.
  - OpenCATS has no equivalent. Its closest artefacts are the job-order "Lead"/"Upcoming" statuses and the contacts cold-call list (`FEATURE_INVENTORY.md` §2.3 Statuses; §2.8 Cold call list).
- **Client company records (CRM)** **[FACT]**
  - `ClientCorporation` has a parent/child hierarchy (`parentClientCorporation`, `childClientCorporations`), `feeArrangement`, `billingContact`, `billingFrequency`, `invoiceFormat`, `status`, `competitors`, multiple `owners`/`userOwners`, `requirements` and `certificationGroups` (credential requirements the client imposes), `locations` and `leads`.
  - OpenCATS companies have a billing contact and departments but no hierarchy, fee terms or status (`FEATURE_INVENTORY.md` §2.7).
- **Client contacts** **[FACT]**
  - `ClientContact` has `reportToPerson`, `isDefaultContact`, `preferredContact`, `status`, `secondaryOwners`, `massMailOptOut`, `smsOptIn` and `isAnonymized`.
  - It also has `username`, `password` and `isLockedOut`. **[INFERENCE]** Client contacts can have login credentials, which points to some client-facing access. The client portal itself is **[UNKNOWN]**.
  - OpenCATS contacts have reports-to and a "left company" flag (`FEATURE_INVENTORY.md` §2.8).
- **Job intake (job orders)** **[FACT]**
  - Commercial fields: `clientBillRate`, `payRate`, `markUpPercentage`, `feeArrangement`, `billingProfile`, `employmentType`, `durationWeeks`, `hoursPerWeek`, `numOpenings`, `approvedPlacements`.
  - Publishing fields: `isPublic`, `publicDescription`, `publishedCategory`, `publishedZip`, `jobBoardList`, `isJobcastPublished`, `dateLastPublished`.
  - Other fields: `isInterviewRequired`, `isClientEditable`, `assignedUsers`, `reportToClientContact`, `reasonClosed`, `willSponsor`, `travelRequirements`.
  - OpenCATS job orders track openings and openings available, rate, salary and job type C/C2H/FL/H (`FEATURE_INVENTORY.md` §2.3). **[INFERENCE]** `isClientEditable` suggests clients can edit some job data.
- **Candidate intake (career site)** **[FACT]** ([career-portal app.json](https://github.com/bullhorn/career-portal/blob/c450bae71461bf667ebb480456d8ef920689a9d1/src/app.json); [apply-modal](https://github.com/bullhorn/career-portal/blob/c450bae71461bf667ebb480456d8ef920689a9d1/src/app/apply-modal/apply-modal.component.ts); [apply.service](https://github.com/bullhorn/career-portal/blob/c450bae71461bf667ebb480456d8ef920689a9d1/src/app/services/apply/apply.service.ts) (accessed 2026-09-25))
  - Bullhorn publishes an MIT-licensed, forkable Angular career portal.
  - Apply form fields: first name, last name, e-mail, phone and a resume upload (html, text, txt, pdf, doc, docx, rtf, odt; 4 KB–5 MB).
  - Optional EEOC fields (gender, race/ethnicity, veteran, disability) are toggled in configuration, and there is a privacy-consent checkbox with a privacy-policy link.
  - Jobs come from a public REST search on `JobOrder` / `JobBoardPost`, and applications are POSTed to a public `apply` endpoint.
  - The portal ships with 11 locales, and has a structured-SEO component and "related jobs" (max 5).
  - Compare OpenCATS: its careers apply has an optional questionnaire and EEO, but job search is a stub and there is an unauthenticated overwrite defect (`FEATURE_INVENTORY.md` §2.14, FEAT-011; `EXECUTIVE_SUMMARY.md` Fact 2).
- **Job distribution** **[FACT]**
  - Fields `jobBoardList` and `isJobcastPublished` and entity `JobBoardPost` exist. The number of boards and the multiposting UX are **[UNKNOWN]**.
- **Sourcing and matching**
  - REST resume parsing (`resume/parseToCandidate`) and Lucene-scored search (`search/` endpoints; `luceneScore` field) **[FACT]** ([RestUrlFactory](https://github.com/bullhorn/sdk-rest/blob/9a9b711c28880eab63173d86422618d52e1e6fa4/src/main/java/com/bullhornsdk/data/api/helper/RestUrlFactory.java) (accessed 2026-09-25)).
  - The event type `JOBMATCHSEARCH` exists **[FACT]**.
  - Bullhorn acquired KonaSearch for search and matching **[SOURCE CLAIM · independent · search excerpt]**.
  - Candidates carry `clientCorporationBlackList` and `clientCorporationWhiteList`, which express which clients a candidate may or may not be submitted to **[FACT]**. This is an agency-specific control that OpenCATS lacks.
- **Pipeline: submissions (JobSubmission)** **[FACT]**
  - `JobSubmission` links candidate and job order. It carries `status` (free text: the vendor's example CSV uses "Submitted", "Accepted", "Complete"), `billRate`, `payRate`, `salary`, `source`, `sendingUser`, `dateWebResponse`, `isHidden` and `owners`, plus `JobSubmissionHistory`.
  - **[INFERENCE]** Web applicants and recruiter submissions share one entity, told apart by status and `dateWebResponse`. This mirrors OpenCATS's `candidate_joborder` with status history (`FEATURE_INVENTORY.md` §2.4, §3.1).
  - Status configurability and transition rules: **[UNKNOWN]**.
- **Submission to client (Sendout)** **[FACT]**
  - `Sendout` records a candidate being sent to a specific `clientContact` and `clientCorporation` for a `jobOrder`/`jobSubmission`, by a `user`, with `email`, `isRead` and `numTimesRead`.
  - **[INFERENCE]** Client submittals are e-mails with open tracking, stored as their own entity, separate from the pipeline status.
  - OpenCATS models a submission only as a status-history row with status 400, and counts every such row (FEAT-008).
- **Interviews** **[FACT]**: `Appointment` and `AppointmentAttendee`; Candidate, ClientContact and JobOrder have `interviews` collections. Scheduling mechanics (self-scheduling, calendar sync) are **[UNKNOWN]**.
- **Placements (hire)** **[FACT]**
  - `Placement` is a first-class record with `dateBegin`, `dateEnd`, `employmentType`, `salary`, `fee`, `flatFee`, `payRate`, `clientBillRate`, `markUpPercentage`, overtime rates and `daysGuaranteed` / `daysProRated` (perm guarantee and pro-rata refund terms). It also carries `referralFee`, `billingClientContact`, `approvingClientContact` (plus backup), `billingProfile`, `invoiceGroupName`, `costCenter`, `timesheetCycle`, `payGroup`, `legalBusinessEntity`, `status`, `terminationReason` and `quitJob`.
  - Margin splits: `recruitingManagerPercentGrossMargin` and `salesManagerPercentGrossMargin`.
  - Placement and Sendout are *hard-delete* entities in the SDK typing.
  - OpenCATS reduces a placement to status 800 plus an openings decrement (`FEATURE_INVENTORY.md` §2.3 Openings; §3.1).
- **Commissions** **[FACT]**
  - `PlacementCommission` has `user`, `role`, `commissionPercentage`, `flatPayout`, `hourlyPayout`, `grossMarginPercentage`, `externalRecipient` and `status`, with edit history.
- **Changes after placement** **[FACT]**
  - `PlacementChangeRequest` has `requestType`, `requestStatus`, `requestingUser`, `approvingUser`, `dateApproved` and `dateEffective`, and holds proposed values for rates, dates and billing contacts. Placements also expose approved, pending and rejected rate-card change requests.
  - **[INFERENCE]** Changes to a live contract are proposed, approved and effective-dated rather than edited in place.
- **Billing and back-office hand-off** **[FACT]**
  - `BillingProfile` holds the billing corporation, contact and location, `invoiceTerm`, `deliveryMethodLookup`, and to/cc/bcc recipients.
  - `InvoiceTerm` holds `invoiceOn`, `invoiceGroupBy`, `invoiceSplitBy`, `invoiceSummarizeBy`, `approvalRequired`, `purchaseOrderRequired`, `waitForTimecards`, `invoiceApprovedTimecardsRequired`, `paymentTerms`, `currencyUnit` and a general-ledger receivables account.
  - Placements carry `timeAndExpense` and payroll sync fields (`payrollSyncStatus`, `bteSyncStatus`).
  - **[INFERENCE]** Pay/bill is native to the platform, or tightly integrated with it, and fed from the Placement record.
- **Talent pools and lists** **[FACT]**
  - A `Tearsheet` is a named list that can hold candidates, client contacts, job orders, leads and opportunities, with `isPrivate` and `recipients`. `DistributionList` also exists.
  - This matches OpenCATS saved lists (`FEATURE_INVENTORY.md` §2.9).
- **Automation and AI:** **[UNKNOWN]**. Bullhorn's current AI product (names, agents, human-in-the-loop controls, opt-out) could not be verified with the access available. This is a priority item for a re-run with search budget. The only related evidence is the `JOBMATCHSEARCH` event type and the resume-parse endpoints **[FACT]**.
- **Requisition approval, scorecards, offer approvals/e-sign, rejection reasons:** **[UNKNOWN]**. These are corporate-TA workflows that could not be verified for Bullhorn. `JobSubmission.status` and `reasonClosed` on jobs and opportunities exist **[FACT]**.
- **Rediscovery:** Lucene search, match events and the KonaSearch acquisition point to database-first sourcing **[INFERENCE]**.

### 3. User experience
- **[UNKNOWN]:** recruiter home, hiring-manager and interviewer UX, navigation screenshots, saved views and bulk actions. Help-center and product pages were unreachable.
- **[FACT]** Bullhorn maintains **Novo Elements**, its Angular UI component library ("UI Repository for Bullhorn's Novo Theme"), last committed 2026-09-24. It also publishes design tokens and an icon font ([novo-elements](https://github.com/bullhorn/novo-elements/tree/c10abc5213efaa39cfd4e074952f7a73a199a504); [org page](https://github.com/bullhorn) (accessed 2026-09-25)).
  - **[INFERENCE]** Bullhorn runs a shared design system across its UI and partner extensions.
- **Candidate experience** **[FACT]**: a short apply form (name, e-mail, phone, resume, optional EEO and consent) in a modal on the job page; language dropdown; related jobs. There is no candidate account or status portal in the open-source app.
- **Client experience:** Sendout e-mails with read tracking **[FACT]**. A client portal is **[UNKNOWN]**.
- **Information architecture** **[INFERENCE from the data model]:** top-level objects are likely Candidates, Contacts, Companies, Leads, Opportunities, Jobs, Placements and Tearsheets. That is close to OpenCATS's tabs (Candidates, Companies, Contacts, Job Orders, Lists), plus the BD and placement objects.

### 4. Platform
- **API** **[FACT]** ([sdk-rest](https://github.com/bullhorn/sdk-rest/tree/9a9b711c28880eab63173d86422618d52e1e6fa4); [RestApiSession](https://github.com/bullhorn/sdk-rest/blob/9a9b711c28880eab63173d86422618d52e1e6fa4/src/main/java/com/bullhornsdk/data/api/helper/RestApiSession.java) (accessed 2026-09-25))
  - JSON REST with these route families: `entity/` (CRUD and associations), `query/` (where-clause queries), `search/` (Lucene), `meta/`, `options/`, `file/`, `settings/`, `resume/parseToCandidate`, `event/subscription/`.
  - Authentication:
    1. OAuth 2.0 authorization-code grant (`authorize` → `token`).
    2. `/login?version=…&access_token=…` returns a `BhRestToken` session token.
    3. Hosts are data-center-specific, discovered through `rest.bullhornstaffing.com/rest-services/loginInfo`.
  - The SDK passes `BhRestToken` as a URL query parameter.
  - Official docs live at `bullhorn.github.io/rest-api-docs`, which could not be fetched.
- **Events** **[FACT]** ([EventType](https://github.com/bullhorn/sdk-rest/blob/9a9b711c28880eab63173d86422618d52e1e6fa4/src/main/java/com/bullhornsdk/data/model/enums/EventType.java) (accessed 2026-09-25))
  - *Pull-based* event subscriptions. Event types are `ENTITY` (INSERTED, UPDATED, DELETED), `FIELDMAPCHANGE` and `JOBMATCHSEARCH`. Consumers fetch batches with `maxEvents` and can replay by `requestId`.
  - Push webhooks: **[UNKNOWN]**.
- **Developer tooling** **[FACT]**: Java SDK (Java 17; JDK 8 classifier), `bullhornjs`, `passport-bullhorn`, Python OAuth and REST examples, and the **Data Loader** CLI plus desktop app.
  - Data Loader: CSV import, update and delete per entity, with a `template` command, and success/failure result CSVs per run ([dataloader README](https://github.com/bullhorn/dataloader/tree/135f88b417aaaf31e57f94d8a0b94a73506ce09e) (accessed 2026-09-25)).
  - Compare OpenCATS import-with-revert (`FEATURE_INVENTORY.md` §2.11).
- **Customization** **[FACT]**
  - Custom fields are **numbered slots** per entity (e.g. `customText1..25`, `customTextBlock1..5`, `customDate1..5`, `customFloat1..5`, `customInt1..5` on JobSubmission; `correlatedCustom*` on Opportunity).
  - Custom objects are **numbered instances**: `ClientCorporationCustomObjectInstance1..35`, `PersonCustomObjectInstance1..35`, and `JobOrder`/`Placement`/`Opportunity` `CustomObjectInstance1..10`.
- **Audit and deletion semantics** **[FACT]** (SDK interface typing)
  - `EditHistoryEntity` (field-level edit history) is implemented by 20 entity types, including Candidate, ClientContact, ClientCorporation, JobOrder, JobSubmission, Lead, Opportunity, Placement, PlacementCommission and PlacementChangeRequest.
  - Candidate, ClientContact, JobOrder, JobSubmission, Lead, Opportunity, Note, Task and Tearsheet are **soft-delete**. Placement, Sendout, PlacementCommission and JobSubmissionHistory are hard-delete.
  - Contrast OpenCATS: hard deletes cascade and erase reporting history (FEAT-003), and there is no tamper-evident audit log (GAP-011).
- **Privacy** **[FACT]**: `isAnonymized` on Candidate and ClientContact; `massMailOptOut` and `smsOptIn` on people; career-portal consent checkbox. DSAR tooling and retention policies: **[UNKNOWN]**.
- **Localization and multi-entity** **[FACT]**: career portal in 11 locales; `currencyUnit` on invoice terms; `Branch`, `PrivateLabel` (multi-brand) and `legalBusinessEntity` on placements. Product UI languages: **[UNKNOWN]**.
- **Salesforce-native line:** Bullhorn Recruitment Cloud, extended by the TargetRecruit and Mployee acquisitions **[SOURCE CLAIM · vendor · search excerpt]**.
- **[UNKNOWN]:** SSO (SAML/OIDC), SCIM, MFA, RBAC model detail, reporting and analytics product, mobile apps, VPAT/WCAG, SOC 2 and ISO 27001, data residency. Trust and security pages were not reachable.

### 5. Business
- **Pricing:** **[UNKNOWN]**. The pricing page (`bullhorn.com/pricing/`) could not be fetched, and no public price was surfaced.
- **Packaging:** the data model spans front, middle and back office **[FACT]**, and there is a Salesforce-built line **[SOURCE CLAIM · vendor · search excerpt]**. Module and tier packaging: **[UNKNOWN]**.
- **Market:** staffing agencies, with a healthcare-staffing push via TargetRecruit **[SOURCE CLAIM · vendor · search excerpt]**.

### 6. Independent perspective
- Trade press (SIA, Hunt Scanlon, Salesforce Ben) covered the TargetRecruit deal as expanding Bullhorn's Salesforce footprint and healthcare-staffing reach **[SOURCE CLAIM · independent · search excerpt]** (sources as §1).
- Listicles describe Bullhorn as "best for established staffing firms that need a serious ATS and CRM foundation with a strong system of record for candidates, clients, jobs, and activity". They recommend it for "enterprise agencies (50+ recruiters)" with "deep integration with back-office billing" ([Truffle](https://www.hiretruffle.com/blog/best-staffing-crms); [Tenzo](https://www.tenzo.ai/blog/best-staffing-agency-software-for-2026) (accessed 2026-09-25)) **[SOURCE CLAIM · independent · search excerpt · weak (listicles by adjacent-tool vendors)]**.
- Several competitors publish "Bullhorn alternatives" pages ([Spott](https://spott.io/resources/bullhorn-alternatives); [Happlicant](https://www.happlicant.com/blog/top-9-bullhorn-alternatives-for-recruitment-agencies) (accessed 2026-09-25)). Loxo publishes a customer story about migrating off Bullhorn ([Loxo](https://www.loxo.co/customer-stories/ac-lion-easily-migrates-their-data-and-their-favorite-partners-to-loxo) (accessed 2026-09-25)). **[INFERENCE]** Bullhorn is the incumbent that challengers position against. The content of these pages was not verified.
- Recurring review complaints: **[UNKNOWN]**. G2 and Capterra were blocked.

### 7. Lessons for OpenCATS 2.0
- **Principles evidenced** **[INFERENCE]**
  - In agency recruiting, the data model is a **revenue model**. Jobs carry bill and pay rates and fee arrangements. Placements carry fees, guarantees, margins and commission splits. Deals carry win probability. Reporting and billing flow from placements, not from pipeline status counts.
  - Contract changes are **effective-dated and approved** (PlacementChangeRequest), not overwritten.
  - Core records are **soft-deleted with edit history**.
- **Patterns worth learning from** **[RECOMMENDATION]**
  1. Promote OpenCATS "status 800 Placed" to a first-class **Placement** aggregate: dates, fee or rates, guarantee period, billing contact, commission splits and status. Derive placement metrics from it. This fixes the FEAT-008 double-counting by design.
  2. Separate the **Submission** (pipeline membership and state) from the **Sendout** (an auditable "sent candidate X to contact Y" event, with open tracking). OpenCATS today infers submissions from status-history rows.
  3. Add a lightweight **BD pipeline** (Lead → Opportunity → Job Order) with weighted deal value. Keep the OpenCATS contacts, companies and cold-call assets, and fold them into this CRM (`FEATURE_INVENTORY.md` §2.8).
  4. Add candidate **client allow/deny lists** and a client company **hierarchy** with fee terms. These are cheap to model and matter to agencies.
  5. Offer an **event feed with replay** (request IDs) *and* push webhooks. Ship a **reference open-source career portal** against a public API, as Bullhorn does (MIT, forkable).
  6. Adopt a Data-Loader-style bulk import (templates, success/failure CSVs), keeping OpenCATS's per-import revert.
- **Things not to copy** **[RECOMMENDATION]**
  - Numbered custom-field and custom-object slots (`customText1..25`, `…CustomObjectInstance1..35`). Use typed, named custom fields and objects.
  - Free-text pipeline statuses. Use configurable, typed workflow stages (GAP-005).
  - Session tokens in URL query strings, as the SDK does with `BhRestToken`. Use `Authorization` headers.
  - Breadth that only large staffing firms need (housing, tax forms, payroll): leave it to integrations unless the target segment demands it.

### Sources
1. https://github.com/bullhorn — GitHub org page (official) — accessed 2026-09-25
2. https://github.com/bullhorn/sdk-rest/tree/9a9b711c28880eab63173d86422618d52e1e6fa4 — official Java SDK (entities, RestUrlFactory, RestApiSession, EventType) — accessed 2026-09-25
3. https://github.com/bullhorn/career-portal/tree/c450bae71461bf667ebb480456d8ef920689a9d1 — official open-source career portal — accessed 2026-09-25
4. https://github.com/bullhorn/dataloader/tree/135f88b417aaaf31e57f94d8a0b94a73506ce09e — official Data Loader (README, examples/load) — accessed 2026-09-25
5. https://github.com/bullhorn/novo-elements/tree/c10abc5213efaa39cfd4e074952f7a73a199a504 — official UI component library — accessed 2026-09-25
6. https://www.bullhorn.com/news-and-press/press-releases/bullhorn-acquires-targetrecruit/ — vendor press release (search excerpt only) — accessed 2026-09-25
7. https://www.staffingindustry.com/news/global-daily-news/bullhorn-acquires-targetrecruit — Staffing Industry Analysts, trade press (search excerpt) — accessed 2026-09-25
8. https://huntscanlon.com/bullhorn-acquires-targetrecruit/ — Hunt Scanlon Media, trade press (search excerpt) — accessed 2026-09-25
9. https://www.salesforceben.com/bullhorn-bolsters-salesforce-offering-with-targetrecruit-buyout/ — Salesforce Ben, independent (search excerpt) — accessed 2026-09-25
10. https://tracxn.com/d/acquisitions/acquisitions-by-bullhorn/__v2SBoBqwQ1yS34RKOgfuzA3WAaFGaNC6-Wk3yALGuVQ — Tracxn, company database (search excerpt) — accessed 2026-09-25
11. https://www.hiretruffle.com/blog/best-staffing-crms — listicle (weak) — accessed 2026-09-25
12. https://www.tenzo.ai/blog/best-staffing-agency-software-for-2026 — listicle (weak) — accessed 2026-09-25
13. https://spott.io/resources/bullhorn-alternatives — competitor blog (weak) — accessed 2026-09-25
14. https://www.happlicant.com/blog/top-9-bullhorn-alternatives-for-recruitment-agencies — competitor blog (weak) — accessed 2026-09-25
15. https://www.loxo.co/customer-stories/ac-lion-easily-migrates-their-data-and-their-favorite-partners-to-loxo — competitor customer story (weak; title only) — accessed 2026-09-25

---

## Loxo (Loxo, Inc.)

### 1. Snapshot
- **Vendor and ownership** **[SOURCE CLAIM · independent · search excerpt]**
  - Loxo received a **$115 million growth investment led by Tritium Partners**, closed Feb 20, 2025 ([DHRMap](https://www.dhrmap.com/news/talent-intelligence-leader-loxo-raises-115m-to-revolutionize-ai-recruiting-with-tritium-partners-investment) (accessed 2026-09-25)).
  - Headcount: "154 employees" as of May 31, 2026, per a company database ([Tracxn](https://tracxn.com/d/companies/loxo/__Ggm_YyoNJxu_SSfNBxDxT8wZSw0etQrLBbABx7ahySQ) (accessed 2026-09-25)).
  - HQ and founding year: **[UNKNOWN]**.
- **Scale** **[SOURCE CLAIM · vendor · search excerpt (attribution uncertain)]**: "13,200+ teams, 125,000+ users" and an "800M+ talent graph" ([loxo.co](https://loxo.co/); [TipRanks](https://www.tipranks.com/news/private-companies/loxo-deepens-ai-driven-recruiting-platform-with-new-data-query-tool-and-expanded-agent-capabilities) (accessed 2026-09-25)).
  - The same TipRanks item cites "more than 850 million professionals" for Loxo Source.
  - A listicle cites "1.2 billion candidate profiles" ([Truffle, weak](https://www.hiretruffle.com/blog/best-staffing-crms) (accessed 2026-09-25)).
  - **[INFERENCE]** The figures do not agree. Treat talent-graph size as unverified.
- **Positioning** **[SOURCE CLAIM · vendor · search excerpt (title)]**:
  - "Loxo: The AI Recruiting Platform For Scaling Firms" ([loxo.co](https://loxo.co/)).
  - "Recruitment CRM & AI-Native ATS in One Platform" ([loxo.co/products/recruiting-crm](https://loxo.co/products/recruiting-crm) (accessed 2026-09-25)).
- **Target and recruiting model:** direct-hire recruiters, executive search firms, agency teams, staffing agencies, and in-house TA or in-house executive search ([staffing agency software](https://www.loxo.co/solutions/staffing-agency-software); [recruiting firms](https://www.loxo.co/solutions/recruiting-firms); [in-house executive search](https://www.loxo.co/solutions/in-house-executive-search) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**.
- **Modules** **[SOURCE CLAIM · vendor · search excerpt]** ([pricing](https://www.loxo.co/pricing) (accessed 2026-09-25)):
  - ATS;
  - recruiting CRM;
  - **Sales CRM** and Account-Based Prospecting (business development);
  - **Loxo Source** (talent data);
  - **Loxo Outreach** (omni-channel campaign automation);
  - **Hiring Manager Portal** and client report generator;
  - **Loxo Arrange** (scheduling);
  - AI Notetaker, AI agents and **Loxo AI Chat** (natural-language querying across the internal database and Loxo Source);
  - MPC/Spec CV;
  - parent/child instance setup.

### 2. Workflows
Agency-specific workflows first. UI step counts are **[UNKNOWN]**.

- **BD and client CRM**
  - A "Sales CRM" is in Basic, and "Account-Based Prospecting" is in Professional **[SOURCE CLAIM · vendor · search excerpt]**.
  - Third-party connector code pages through Loxo API resources named `candidates`, `companies`, **`deals`** and `activities` ([Paradox-Machines dlt-sources](https://github.com/Paradox-Machines/dlt-sources) (accessed 2026-09-25)) **[SOURCE CLAIM · independent · third-party code on GitHub]**. **[INFERENCE]** Business development is modelled as deals, beside jobs.
  - Vendor blog on tracking client and candidate relationships ([blog](https://www.loxo.co/blog/crm-for-recruiting-tracking-client-and-candidate-relationships) (accessed 2026-09-25)); content not verified.
- **Job intake**
  - Per third-party integration notes, creating a job through the API requires `title`, `raw_company_name` and `job_type_id` ([TrustIn notes](https://github.com/TrustIn-Technology-Platforms/WORKFLOW_ARCHITECTURE) (accessed 2026-09-25)) **[SOURCE CLAIM · independent · third-party code on GitHub]**.
  - Job approval: **[UNKNOWN]**.
- **Publishing:** "Organic job board posting" is in Basic **[SOURCE CLAIM · vendor · search excerpt]**. Board count: **[UNKNOWN]**.
- **Sourcing** **[SOURCE CLAIM · vendor · search excerpt]**
  - Loxo Source ("unlimited access" in Professional), "Natural Language Search", and **Loxo AI Chat**, which "lets recruiters search their internal databases alongside Loxo Source's graph" ([TipRanks](https://www.tipranks.com/news/private-companies/loxo-deepens-ai-driven-recruiting-platform-with-new-data-query-tool-and-expanded-agent-capabilities) (accessed 2026-09-25)).
  - A listicle calls Loxo "best for search firms and proactive sourcing" **[SOURCE CLAIM · independent · search excerpt · weak]**.
- **Outreach and nurture**
  - "Loxo Outreach omni-channel campaign automation" **[SOURCE CLAIM · vendor · search excerpt]**.
  - Third-party notes say campaign API endpoints are read-only (list, show, recipients, pause), so campaigns are created in the UI **[SOURCE CLAIM · independent · third-party code on GitHub]**.
- **Candidate intake and resume parsing:** "Resume parsing" is listed in Basic **[SOURCE CLAIM · vendor · search excerpt]**. Career-site apply flow: **[UNKNOWN]**.
- **Submissions to clients** ([Share Candidates](https://help.loxo.co/en/articles/8149140-share-candidates) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**
  - A **"Submit Candidate"** button on a profile creates a link to a digital version of the profile, with highlights, resume/CV and attachments.
  - Through that link the client can **comment or complete a scorecard** for that candidate and job.
  - A separate "Portal" shares several candidates at once with a job overview, for people without Loxo access (hiring managers, HR, executives at the client).
  - "MPC/Spec CV" (an unsolicited "most placeable candidate" pitch to prospective clients) is marketed as a way to "pitch top candidates, drive revenue" ([product update](https://loxo.co/product-updates/introducing-loxos-mpc-spec-cv-pitch-top-candidates-drive-revenue) (accessed 2026-09-25)). Title only; details **[UNKNOWN]**.
- **Client portal (Hiring Manager Portal)** ([product page](https://loxo.co/products/hiring-manager-portal) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt]**
  - Candidates are shared "in real-time", and the recruiter controls which candidates, stages and fields are visible, and to whom.
  - Hiring managers can **comment, score and approve** candidates.
  - Access is by **e-mail invitation plus a one-time security code**, with no full recruiter login.
  - The recruiter can send a **PDF status report**, the live portal link, or both.
- **Interview scheduling:** "Loxo Arrange eliminates the middleman" ([product update](https://www.loxo.co/product-updates/bye-bye-back-and-forth-loxo-arrange-eliminates-the-middleman) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt (title)]**. Mechanics (self-schedule, panels, calendar sync): **[UNKNOWN]**.
- **Feedback:** an AI Notetaker (Professional) and client scorecards through the portal **[SOURCE CLAIM · vendor · search excerpt]**. Internal interviewer scorecards: **[UNKNOWN]**.
- **Placements, fees, commissions, invoicing hand-off:** **[UNKNOWN]**. A vendor blog on "the 4 most important metrics for staffing recruiters" exists ([blog](https://loxo.co/blog/the-4-most-important-recruiting-metrics-for-staffing-agencies) (accessed 2026-09-25)); content not verified.
- **Offers, requisition approvals, rejection reasons, HRIS hand-off:** **[UNKNOWN]**.
- **Rediscovery:** AI Chat across the internal database **[SOURCE CLAIM · vendor · search excerpt]**.

### 3. User experience
- **Client and hiring-manager UX** **[SOURCE CLAIM · vendor · search excerpt]**: magic-link-style access (invite plus one-time code); the recruiter scopes what is visible (candidates, stages, fields); comment, score and approve actions; PDF or live status reports.
- **Recruiter home, navigation, search and filters, bulk actions, timeline, mobile:** **[UNKNOWN]**.
- **Candidate experience:** **[UNKNOWN]**.

### 4. Platform
- **API** **[SOURCE CLAIM · independent · third-party code on GitHub]**
  - REST/JSON at `https://app.loxo.co/api/{agency_slug}/…`, with bearer-token API keys that an admin generates in Settings.
  - Resources seen: candidates/people, companies, deals, activities, jobs (create, update, show, apply), and campaigns plus recipients (read-only).
  - Pagination uses `scroll_id`.
  - Sources: [Paradox-Machines dlt-sources](https://github.com/Paradox-Machines/dlt-sources); [TrustIn notes](https://github.com/TrustIn-Technology-Platforms/WORKFLOW_ARCHITECTURE); [ever-jobs Loxo plugin](https://github.com/ever-jobs/ever-jobs) (accessed 2026-09-25).
  - Official API docs: **[UNKNOWN]** (not reachable).
- **Webhooks:** **[UNKNOWN]**.
- **Multi-entity:** "parent/child instance setup" (Professional) **[SOURCE CLAIM · vendor · search excerpt]**.
- **Reporting:** "Custom dashboards, Analytics, Reporting" (Basic) and a "Client report generator" (Professional) **[SOURCE CLAIM · vendor · search excerpt]**.
- **AI:** AI agents, AI Notetaker, natural-language search and AI Chat **[SOURCE CLAIM · vendor · search excerpt]**. Human-in-the-loop controls, opt-out and bias-audit statements: **[UNKNOWN]**.
- **[UNKNOWN]:** SSO, SCIM, MFA, RBAC, audit logs, custom fields, localization, accessibility, SOC 2 and ISO, data residency.

### 5. Business
- **Pricing model** **[SOURCE CLAIM · vendor · search excerpt]** ([loxo.co/pricing](https://www.loxo.co/pricing); [pricing blog](https://www.loxo.co/blog/loxo-pricing-plans) (accessed 2026-09-25))
  - Four tiers: **Free**, **Basic**, **Professional** and **Enterprise**, priced "per user/month" on an annual basis for new customers.
  - **The dollar amounts were not visible in the search excerpts and are not public in any source I could reach.** Price points: **[UNKNOWN]**.
  - **Basic** (as listed): Sales CRM, organic job board posting, multiple users, custom dashboards, analytics, resume parsing, technical support, reporting.
  - **Professional:** everything in Basic plus Loxo Source (unlimited), natural-language search, AI Notetaker, AI agents, Loxo Outreach, Account-Based Prospecting, **client portal**, **client report generator**, parent/child instances.
  - **Enterprise:** custom.
- **Free tier:** a March 2023 CEO note is titled "Loxo Now Offers Enterprise-Grade ATS + Recruiting CRM Free, Forever" ([blog](https://www.loxo.co/blog/note-from-the-ceo-march-2023); [blog](https://www.loxo.co/blog/loxo-introduces-web-3-0-ai-recruiting-platform-with-free-version) (accessed 2026-09-25)) **[SOURCE CLAIM · vendor · search excerpt (title)]**.
- **[INFERENCE]** Packaging puts client collaboration, sourcing data and AI in the paid Professional tier and uses the free ATS+CRM as the entry point.

### 6. Independent perspective
- The $115M Tritium-led growth round is reported by HR-tech press (DHRMap) and company databases (Crunchbase, Tracxn) **[SOURCE CLAIM · independent · search excerpt]** ([Crunchbase](https://www.crunchbase.com/organization/loxo) (accessed 2026-09-25)).
- Listicles place Loxo with small agencies ("focus on Loxo or Crelate to minimize overhead", for 1–5 recruiters) and sourcing-heavy search firms ([Truffle](https://www.hiretruffle.com/blog/best-staffing-crms); [Tenzo](https://www.tenzo.ai/blog/best-staffing-agency-software-for-2026) (accessed 2026-09-25)) **[SOURCE CLAIM · independent · search excerpt · weak]**.
- Competitor comparison pages exist, e.g. [Spott vs Loxo](https://spott.io/resources/spott-vs-loxo-which-recruitment-platform-is-right-for-your-agency-in-2026) (accessed 2026-09-25) **[SOURCE CLAIM · independent · search excerpt · weak; content not verified]**.
- Review-site strengths and complaints: **[UNKNOWN]**. G2 and Capterra were blocked.

### 7. Lessons for OpenCATS 2.0
- **Principles evidenced** **[INFERENCE]**
  - The agency's client is a *collaborator*. Candidate presentation, client scoring and approval happen in a scoped, no-password surface controlled by the recruiter.
  - Sourcing data, outreach and the ATS sit in one system, so "rediscovery" and "new sourcing" are the same search.
- **Patterns worth learning from** **[RECOMMENDATION]**
  1. Build a **client review portal**, scoped per job and per link. The recruiter selects the candidates, stages and fields to show. Access is by e-mail invite plus a one-time code. Clients can comment, score and approve, and each action writes back to the pipeline and timeline. Recruit CRM documents the same pattern, with per-stage "Let Client Use" permissions (§1.3). This is the most direct modern successor to OpenCATS's agency workflow, which has no client-facing surface today (PRODUCT_GAPS Unknowns: "client portal").
  2. Offer a one-click **"Submit candidate" artefact**: a branded profile with highlights and attachments that is sent, tracked and recorded as a submission event.
  3. Keep **BD deals** in the same system as jobs (see Bullhorn Lead/Opportunity).
- **Things not to copy** **[RECOMMENDATION]**
  - Read-only campaign APIs (per third-party notes). API parity with the UI matters for an API-first OpenCATS (GAP-004).
  - Unclear or inconsistent data-size claims. OpenCATS should not market bundled data it cannot license and audit. Resume data also carries privacy obligations (GAP-002).

### Sources
1. https://loxo.co/ — vendor homepage (search excerpt) — accessed 2026-09-25
2. https://www.loxo.co/pricing — vendor pricing page (search excerpt; amounts not visible) — accessed 2026-09-25
3. https://www.loxo.co/blog/loxo-pricing-plans — vendor blog (search excerpt) — accessed 2026-09-25
4. https://www.loxo.co/blog/note-from-the-ceo-march-2023 — vendor blog (title) — accessed 2026-09-25
5. https://www.loxo.co/blog/loxo-introduces-web-3-0-ai-recruiting-platform-with-free-version — vendor blog (title) — accessed 2026-09-25
6. https://help.loxo.co/en/articles/8149140-share-candidates — vendor help center (search excerpt) — accessed 2026-09-25
7. https://loxo.co/products/hiring-manager-portal — vendor product page (search excerpt) — accessed 2026-09-25
8. https://loxo.co/products/recruiting-crm — vendor product page (title) — accessed 2026-09-25
9. https://loxo.co/product-updates/introducing-loxos-mpc-spec-cv-pitch-top-candidates-drive-revenue — vendor product update (title) — accessed 2026-09-25
10. https://www.loxo.co/product-updates/bye-bye-back-and-forth-loxo-arrange-eliminates-the-middleman — vendor product update (title) — accessed 2026-09-25
11. https://www.loxo.co/solutions/staffing-agency-software — vendor page (title) — accessed 2026-09-25
12. https://www.loxo.co/solutions/recruiting-firms — vendor page (title) — accessed 2026-09-25
13. https://www.loxo.co/solutions/in-house-executive-search — vendor page (title) — accessed 2026-09-25
14. https://www.loxo.co/blog/crm-for-recruiting-tracking-client-and-candidate-relationships — vendor blog (title) — accessed 2026-09-25
15. https://loxo.co/blog/the-4-most-important-recruiting-metrics-for-staffing-agencies — vendor blog (title) — accessed 2026-09-25
16. https://www.dhrmap.com/news/talent-intelligence-leader-loxo-raises-115m-to-revolutionize-ai-recruiting-with-tritium-partners-investment — HR-tech news (search excerpt) — accessed 2026-09-25
17. https://www.tipranks.com/news/private-companies/loxo-deepens-ai-driven-recruiting-platform-with-new-data-query-tool-and-expanded-agent-capabilities — financial news (search excerpt) — accessed 2026-09-25
18. https://tracxn.com/d/companies/loxo/__Ggm_YyoNJxu_SSfNBxDxT8wZSw0etQrLBbABx7ahySQ — company database (search excerpt) — accessed 2026-09-25
19. https://www.crunchbase.com/organization/loxo — company database (search listing) — accessed 2026-09-25
20. https://github.com/Paradox-Machines/dlt-sources — third-party connector code (Loxo source) — accessed 2026-09-25
21. https://github.com/TrustIn-Technology-Platforms/WORKFLOW_ARCHITECTURE — third-party integration notes (docs/platforms/loxo.md) — accessed 2026-09-25
22. https://github.com/ever-jobs/ever-jobs — third-party Loxo plugin constants — accessed 2026-09-25
23. https://www.hiretruffle.com/blog/best-staffing-crms — listicle (weak) — accessed 2026-09-25
24. https://www.tenzo.ai/blog/best-staffing-agency-software-for-2026 — listicle (weak) — accessed 2026-09-25
25. https://spott.io/resources/spott-vs-loxo-which-recruitment-platform-is-right-for-your-agency-in-2026 — competitor comparison (weak) — accessed 2026-09-25

---

## Teamtailor (Teamtailor AB)

### 1. Snapshot
- **Vendor and HQ**
  - Founded 2013, headquartered in Stockholm **[SOURCE CLAIM · independent · search excerpt]** ([research.com](https://research.com/software/reviews/teamtailor) (accessed 2026-09-25)).
  - The GitHub org gives Stockholm, Sweden and has 77 repositories **[FACT]** ([github.com/teamtailor](https://github.com/teamtailor) (accessed 2026-09-25)).
  - Total funding raised: "$15.71M" **[SOURCE CLAIM · independent · search excerpt]** ([CB Insights](https://www.cbinsights.com/investor/teamtailor) (accessed 2026-09-25)).
  - Parent or majority ownership: **[UNKNOWN]**.
- **Scale** **[SOURCE CLAIM · vendor · search excerpt]**: "loved by 200,000+ recruiters", and "over 4 million candidates connect with their customers every month" ([teamtailor.com](https://www.teamtailor.com/en/) (accessed 2026-09-25)).
- **Positioning:** "Next Generation ATS & Employer Branding" (page title) **[SOURCE CLAIM · vendor · search excerpt]** ([teamtailor.com](https://www.teamtailor.com/en/); [employer-branding page](https://www.teamtailor.com/en-us/employer-branding/) (accessed 2026-09-25)).
- **Target:** SMB and mid-market corporate TA, with a strong European footprint. **[INFERENCE]** from the Stockholm HQ and the default EU stack; customer mix by region is **[UNKNOWN]**.
- **Modules** **[SOURCE CLAIM · independent · search excerpt]** ([research.com](https://research.com/software/reviews/teamtailor); [ismartrecruit, weak](https://www.ismartrecruit.com/tools/teamtailor) (accessed 2026-09-25)):
  - ATS, career site builder, candidate relationship management, employer branding tools, automation, interview kits, reporting, onboarding and integrations;
  - an "AI Co-pilot" (see §4).
- **Data residency** **[FACT]** ([partners intro](https://github.com/teamtailor/tt-partner-docs/blob/cba212f6143dcff59e44a4330a9a4988f189476a/source/includes/partners/_intro.md.erb) (accessed 2026-09-25)): separate regional stacks with their own API hosts, namely EU (`api.teamtailor.com`), NA (`api.na.teamtailor.com`) and AP (`api.au.teamtailor.com`).

### 2. Workflows
Evidence: the official public-API client and partner docs **[FACT]** ([teamtailor-rb](https://github.com/teamtailor/teamtailor-rb/tree/a91c467e01f450022632ca257f82ac5f579cb406); [tt-partner-docs](https://github.com/teamtailor/tt-partner-docs/tree/cba212f6143dcff59e44a4330a9a4988f189476a) (accessed 2026-09-25)). UI steps are **[UNKNOWN]**.

- **Requisition and approval** **[FACT]**
  - The public API exposes `Requisition` and `RequisitionStepVerdict` resources, i.e. multi-step approval verdicts on requisitions. Approval-chain configuration: **[UNKNOWN]**.
  - Relevant to OpenCATS GAP-008.
- **Job setup** **[FACT]** (fields that trigger `job.update` webhooks)
  - `status`, `internal`, `employment_type`, `employment_level`, `remote_status`, `language_code`, `currency`, `min_salary`, `max_salary`, `salary_time_unit`, `resume_requirement`, `additional_files_requirement`, `recruiter_email`, `department_id`, `role_id`, `tags`, `custom_fields`, `locations`, `team_memberships`.
  - **[INFERENCE]** Salary ranges and per-job resume requirement (including resume-optional jobs) are first-class.
- **Publishing and distribution** **[FACT]** ([job board integration types](https://github.com/teamtailor/tt-partner-docs/blob/cba212f6143dcff59e44a4330a9a4988f189476a/source/includes/job_boards/_integration_types.md.erb) (accessed 2026-09-25)). Job boards can integrate four ways:
  1. HTTP webhooks when a job ad is created, updated or removed.
  2. An "always included" XML feed per job board, **regenerated three times a day** and reflecting the current state (unlisted jobs drop out).
  3. A **premium XML feed** containing only the ads a customer chose to promote. A `promotions` resource exists.
  4. E-mail with the job data.
- **Candidate intake (Direct Apply for job boards)** **[FACT]** ([direct apply](https://github.com/teamtailor/tt-partner-docs/blob/cba212f6143dcff59e44a4330a9a4988f189476a/source/includes/job_boards/direct_apply/_index.md.erb) (accessed 2026-09-25))
  - Boards can host the application. They call `GET /inquiry` for the job's configuration, then `POST /apply`, and requests are HMAC-SHA256 signed or IP-allow-listed.
  - The inquiry returns:
    - **application fields**, each set to `optional`, `required` or `off`;
    - **screening questions**, including **conditional questions** (`parent_question_id`, `conditional_value`);
    - **consents**: `privacy_policy` (required, with URL) and `future_jobs` (optional: "can also contact me about future job opportunities").
  - Teamtailor says it "strongly recommend[s] redirecting candidates to our customer's career sites" rather than using direct apply.
- **Screening, assessments and automation** **[FACT]** ([partner webhooks](https://github.com/teamtailor/tt-partner-docs/blob/cba212f6143dcff59e44a4330a9a4988f189476a/source/includes/partners/_webhooks.md.erb); [moving criteria](https://github.com/teamtailor/tt-partner-docs/blob/cba212f6143dcff59e44a4330a9a4988f189476a/source/includes/partners/moving_criteria/_index.md.erb); [partner results](https://github.com/teamtailor/tt-partner-docs/blob/cba212f6143dcff59e44a4330a9a4988f189476a/source/includes/partners/partner_results/_index.md.erb) (accessed 2026-09-25))
  - Recruiters add partner integrations as **triggers on pipeline stages**. When a trigger fires, the partner (assessment, background check, etc.) receives candidate data by webhook.
  - The partner then posts a **partner result** (score, grade, status, summary, attachments, action buttons), which is shown on the candidate profile.
  - **Moving criteria** are an ordered rule list, for example "If Report decision is Clear → Interview; Otherwise if … Consider → Manual review". The list is re-evaluated whenever the result updates, and the first matching rule moves the candidate. Recruiters can always build rules on score and status; partners can declare their own vocabulary.
  - Relevant to OpenCATS GAP-005, GAP-025 and FEAT-001.
- **Pipeline:** a `Stage` resource plus "triggers" (support-center link in the docs) **[FACT existence]**. The full trigger catalogue (e-mails, SMS, tags, etc.) is **[UNKNOWN]**.
- **Interviews and scorecards:** "interview kits" **[SOURCE CLAIM · independent · search excerpt]**. Scheduling mechanics: **[UNKNOWN]**.
- **Rejection** **[FACT]**
  - `RejectReason` resource; `job_application.update` fires on `rejected_at`.
  - **"Transparent recruiting":** payloads carry `transparent_recruiting_visible_at`, "the earliest date when rejection can be communicated to candidate". Integrations "must" not notify earlier ([event types](https://github.com/teamtailor/tt-partner-docs/blob/cba212f6143dcff59e44a4330a9a4988f189476a/source/includes/company_webhooks/_event_types.md.erb) (accessed 2026-09-25)). It has been documented since 2025-07-02 (changelog: "Added transparent recruiting info").
  - **[INFERENCE]** Rejection communication is deliberately delayed, which avoids instant-feeling automated rejections.
  - Relevant to GAP-021.
- **Referrals** **[FACT]**: `Referral` resource.
- **Talent pool, CRM and nurture:** "candidate relationship management" **[SOURCE CLAIM · independent · search excerpt]**. The optional `future_jobs` consent collected at apply time **[FACT]** is the legal basis for re-contact. Nurture campaigns: **[UNKNOWN]**.
- **Offers:** **[UNKNOWN]**. Onboarding **[SOURCE CLAIM · independent · search excerpt]**.
- **HRIS hand-off** **[FACT]**: Company Webhooks docs list the use case "Updating your HRIS when job applications change status" ([intro](https://github.com/teamtailor/tt-partner-docs/blob/cba212f6143dcff59e44a4330a9a4988f189476a/source/includes/company_webhooks/_intro.md.erb) (accessed 2026-09-25)).
- **AI** **[SOURCE CLAIM · independent · search excerpt]**: the "AI Co-pilot" is described as covering candidate matching from existing talent pools, evaluation against hiring criteria, suggested interview questions, resume summaries, and AI-assisted job ads and posts ([ismartrecruit, weak](https://www.ismartrecruit.com/tools/teamtailor); [research.com](https://research.com/software/reviews/teamtailor) (accessed 2026-09-25)). Human-in-the-loop and opt-out: **[UNKNOWN]**.

### 3. User experience
- **Candidate experience and employer brand** **[SOURCE CLAIM · independent · search excerpt · weak (competitor blog)]**: Teamtailor "go[es] further in employer branding with options for adding rich media such as videos and team stories" ([Recruitee blog](https://recruitee.com/blog/teamtailor-alternatives) (accessed 2026-09-25)).
- **Apply flow** **[FACT]**: per-job configuration of application fields (optional, required, off), conditional questions, and a two-level consent split (required privacy versus optional future jobs). **[INFERENCE]** This supports short apply forms. The exact field count on a default career site is **[UNKNOWN]**.
- **Mobile** **[FACT]**: a repository `ttmobile-notification-service` (Swift) exists in the org **[INFERENCE: native mobile app with push notifications]**. Platform coverage: **[UNKNOWN]**.
- **Design system** **[FACT]**: `design-tokens` (Style Dictionary) repository.
- **[UNKNOWN]:** recruiter dashboard, hiring-manager UX, navigation, search, bulk actions, timeline.

### 4. Platform
- **Public API** **[FACT]** ([teamtailor-rb README](https://github.com/teamtailor/teamtailor-rb/blob/a91c467e01f450022632ca257f82ac5f579cb406/README.md); [request.rb](https://github.com/teamtailor/teamtailor-rb/blob/a91c467e01f450022632ca257f82ac5f579cb406/lib/teamtailor/request.rb) (accessed 2026-09-25))
  - Base URL `https://api.teamtailor.com`, `Authorization: Token token=<key>`, and a **date-based version header** (`X-Api-Version`, e.g. `20161108`).
  - `Content-Type: application/vnd.api+json` (**JSON:API**), with `include=` for relationships and page-based pagination.
  - Admins create keys under Settings.
  - Resources in the client: company, candidates, jobs, job applications, uploads, users, stages, reject reasons, departments, locations, custom fields and values, referrals, partner results, requisitions.
  - Official reference: `docs.teamtailor.com` (not reachable).
- **Company Webhooks** **[FACT]** ([webhook docs](https://github.com/teamtailor/tt-partner-docs/tree/cba212f6143dcff59e44a4330a9a4988f189476a/source/includes/company_webhooks) (accessed 2026-09-25))
  - First released 2025-04-16. Events follow `resource.action` for candidate, job and job_application (create, update, destroy), with documented triggering fields.
  - Signatures: v1 is deprecated; v2 is a base64 of `t=<timestamp>,v2=<HMAC>`.
  - **"There is no retry mechanism at the moment, any non 2xx responses will be logged as a failed delivery"** (changelog 2026-03-19). The "best practices" page on the same site still tells integrators to "handle retries". **[FACT: internal inconsistency in the docs]**
- **Partner platform** **[FACT]**: a Partner API (activations, config, webhook, partner results), a Job Board API, and partner-specific webhook setups with their own signatures.
  - Relevant to GAP-004 and GAP-025.
- **Custom fields** **[FACT]**: `custom_fields` / `custom_field_values` resources.
- **Localization** **[FACT]**: jobs have `language_code` and `currency`. UI language count: **[UNKNOWN]**.
- **Data residency** **[FACT]**: EU, NA and AP stacks (see Snapshot).
- **[UNKNOWN]:** SSO, SCIM, MFA, RBAC detail, audit logs, reporting depth, VPAT/WCAG, SOC 2 and ISO 27001.

### 5. Business
- **Pricing:** **[UNKNOWN]**. The official pricing page could not be fetched.
  - A third-party blog publishes estimates ([noon.ai](https://www.noon.ai/blog/articles/113-teamtailor-pricing-2026) (accessed 2026-09-25)). **[SOURCE CLAIM · independent · search excerpt · weak; not an official price, not relied on]**
  - **[INFERENCE, unverified]** The search excerpt describes pricing as scaling "based on company size".
- **Packaging and add-ons:** **[UNKNOWN]**.

### 6. Independent perspective
- **Strengths** **[SOURCE CLAIM · independent · search excerpt · weak]**
  - A competitor's blog summarising G2 comparisons says "users rate Teamtailor higher for candidate management, CRM capabilities, employer branding, and job posting" ([Recruitee blog](https://recruitee.com/blog/teamtailor-alternatives) (accessed 2026-09-25)). The source is a competitor, so treat it with caution.
  - A review summary exists ([research.com](https://research.com/software/reviews/teamtailor) (accessed 2026-09-25)); its pros and cons were not retrievable.
- **Complaints:** **[UNKNOWN]**. G2 and Capterra were blocked.
- **Funding:** $15.71M total **[SOURCE CLAIM · independent · search excerpt]**. **[INFERENCE]** That is modest for its claimed scale, which suggests capital-efficient growth. Unverified.

### 7. Lessons for OpenCATS 2.0
- **Principles evidenced** **[INFERENCE]**
  - The candidate is treated as a *consenting* data subject from the first touch (required privacy consent, optional future-jobs consent).
  - Rejections are humane by design (delayed visibility).
  - Integrations plug into **stages** instead of being bolted on.
- **Patterns worth learning from** **[RECOMMENDATION]**
  1. **Per-job apply configuration** (fields optional, required or off; conditional questions). This replaces OpenCATS's raw-HTML template tags and questionnaire "actions" (`FEATURE_INVENTORY.md` §2.14).
  2. A **two-level consent model** (processing versus future-contact) stored on the candidate and exposed via API. This fixes the FEAT-013 / GAP-002 gaps (bulk e-mail without consent).
  3. **Stage-bound integrations with rule-based auto-advance** ("moving criteria"). This is a simple, explainable automation model for GAP-005.
  4. **Delayed rejection visibility** and reject-reason objects (GAP-021).
  5. **Push XML feeds with defined refresh cadence plus webhooks** for job boards. This evolves OpenCATS's pull-only XML/RSS feeds (`FEATURE_INVENTORY.md` §2.15; GAP-015).
  6. **Regional stacks** as a data-residency answer, if OpenCATS 2.0 offers SaaS.
  7. **JSON:API with date-based versioning** and HMAC-signed, timestamped webhooks.
- **Things not to copy** **[RECOMMENDATION]**
  - Webhooks **without retries**, and docs that contradict each other on the point. OpenCATS should specify at-least-once delivery with retries, idempotency keys and a delivery log.
  - Direct-apply via a raw AWS API Gateway URL, which the docs expose as the production base URL. Use a stable, branded API hostname.

### Sources
1. https://github.com/teamtailor/tt-partner-docs/tree/cba212f6143dcff59e44a4330a9a4988f189476a — official source of partner.teamtailor.com (Partner API, Job Board API, Company Webhooks) — accessed 2026-09-25
2. https://github.com/teamtailor/teamtailor-rb/tree/a91c467e01f450022632ca257f82ac5f579cb406 — official Ruby client for the public API — accessed 2026-09-25
3. https://github.com/teamtailor — GitHub org page (official) — accessed 2026-09-25
4. https://www.teamtailor.com/en/ — vendor homepage (search excerpt) — accessed 2026-09-25
5. https://www.teamtailor.com/en-us/employer-branding/ — vendor page (search excerpt) — accessed 2026-09-25
6. https://www.cbinsights.com/investor/teamtailor — company database (search excerpt) — accessed 2026-09-25
7. https://research.com/software/reviews/teamtailor — independent review site (search excerpt) — accessed 2026-09-25
8. https://www.ismartrecruit.com/tools/teamtailor — competitor-run review page (weak; search excerpt) — accessed 2026-09-25
9. https://recruitee.com/blog/teamtailor-alternatives — competitor blog (weak; search excerpt) — accessed 2026-09-25
10. https://www.noon.ai/blog/articles/113-teamtailor-pricing-2026 — third-party pricing blog (weak; not relied on) — accessed 2026-09-25
11. https://github.com/NangoHQ/integration-templates/tree/3e8305e2383842cfc95ca2390e9859686911f790/integrations/teamtailor — third-party integration code (candidates sync via `/v1/candidates`) — accessed 2026-09-25

---

## Gem (Gem)

### 1. Snapshot
- **Vendor:** Gem (gem.com). Parent, HQ, founding year and funding: **[UNKNOWN]** (not verifiable with the access available).
- **Scale** **[SOURCE CLAIM · vendor · search excerpt]**: "Over 1,200 companies", naming Airbnb, Wayfair, Cintas, CarMax, DoorDash and Zillow ([gem.com](https://www.gem.com/?i=1); [Gem blog](https://www.gem.com/blog/allow-us-to-re-introduce-ourselves-say-hello-to-the-only-ai-first-all-in-one) (accessed 2026-09-25)).
- **Positioning** **[SOURCE CLAIM · vendor · search excerpt]**
  - "The only AI-first all-in-one recruiting platform, bringing together ATS, CRM, sourcing, scheduling, and analytics with AI built into every workflow."
  - Customers can use Gem "as their all-in-one recruiting platform or enhance their existing ATS" with its CRM, sourcing, scheduling, analytics, career sites, events and more ([Gem blog](https://www.gem.com/blog/allow-us-to-re-introduce-ourselves-say-hello-to-the-only-ai-first-all-in-one); [ATS ecosystem](https://www.gem.com/blog/introducing-gems-ats-ecosystem) (accessed 2026-09-25)).
- **History** **[SOURCE CLAIM · vendor · search excerpt]**: Gem "announced the release of its ATS", which has "since been released from Early Access" ([Announcing Gem ATS](https://www.gem.com/blog/announcing-gem-ats) (accessed 2026-09-25)). Exact dates: **[UNKNOWN]**.
  - **[INFERENCE]** Gem began as a sourcing/CRM layer on top of other ATSs and has moved down into the ATS.
- **Target:** corporate TA teams at mid-market and enterprise tech and consumer brands (per the named logos) **[INFERENCE]**. Agency use: **[UNKNOWN]**.
- **Modules** **[SOURCE CLAIM · vendor · search excerpt]**: ATS, CRM, sourcing, scheduling, analytics, career sites, events and talent marketing, plus three AI agents (see §4).
- **Claims** **[SOURCE CLAIM · vendor · search excerpt]**: "up to 5x gains in recruiter productivity" and "saving 30-50% on technology costs through consolidation".

### 2. Workflows
Evidence is limited to vendor search excerpts and third-party integration code against Gem's API. UI steps are **[UNKNOWN]**.

- **ATS objects** **[SOURCE CLAIM · independent · third-party code on GitHub]** ([Nango Gem templates](https://github.com/NangoHQ/integration-templates/tree/3e8305e2383842cfc95ca2390e9859686911f790/integrations/gem) (accessed 2026-09-25))
  - The ATS API (`/ats/v0/…`, reference at `api.gem.com/ats/v0/reference`) exposes `jobs`, `jobs/{id}/stages`, `job_stages`, `job_posts`, `applications`, `candidates`, `offices` and `scheduled_interviews`.
  - Candidate notes go to `candidates/{id}/activity_feed/notes`.
  - An application carries `status` (`active` / `rejected` / `hired`), `current_stage`, `source`, `credited_to`, `rejection_reason` (with a reason *type*), `jobs[]`, `job_post_id`, `applied_at`, `rejected_at` and `last_activity_at`.
  - **[INFERENCE]** This shape (applications linked to jobs and job posts, `credited_to`, typed rejection reasons, offices) closely resembles Greenhouse Harvest API conventions, which would ease migration from Greenhouse. This needs verification against official Gem docs.
- **CRM and sourcing objects** **[SOURCE CLAIM · independent · third-party code on GitHub]**
  - The CRM API (`/v0/…`) exposes `candidates`, `users`, **`projects`** (talent pools or lists) and `candidates/{id}/uploaded_resumes/{user_id}`.
  - Sequences and nurture campaigns: **[UNKNOWN]**.
- **Sourcing** **[SOURCE CLAIM · vendor · search excerpt]**: an "AI Sourcing Agent" that "searches 800M+ profiles and surfaces past candidates", which is also the **rediscovery** mechanism.
- **Screening** **[SOURCE CLAIM · vendor · search excerpt]**: an "AI App Review Agent" that "ranks and reviews applicants 5x faster with clear reasoning". Whether a human must confirm, the opt-out and bias audits: **[UNKNOWN]**.
- **Fraud screening** **[SOURCE CLAIM · vendor · search excerpt]**: an "AI Fraud Detection Agent" that "catches fraudulent candidates".
- **Interviews:** scheduling is a named module **[SOURCE CLAIM · vendor · search excerpt]**, and `scheduled_interviews` is an ATS API resource **[SOURCE CLAIM · independent · third-party code on GitHub]**. Self-scheduling, panels and scorecards: **[UNKNOWN]**.
- **Requisitions, approvals, offers, e-sign, HRIS hand-off, rejection templates:** **[UNKNOWN]**.
- **Agentic ecosystem (signal)** **[FACT]**: an open-source recruiting sourcing agent published by Warp "finds candidates via Exa, calibrates with your team's feedback in Slack and Notion, and files them into GEM. Never does outreach" ([warpdotdev/recruiting-sourcing-agent-oss](https://github.com/warpdotdev/recruiting-sourcing-agent-oss) (accessed 2026-09-25); repository description).
  - **[INFERENCE]** Customers are building their own AI agents on the ATS/CRM API. API completeness is becoming an AI-era requirement.

### 3. User experience
- **[UNKNOWN]** for recruiter, hiring-manager, interviewer and candidate UX. Help-center and product pages were unreachable.
- Career sites and events are named modules **[SOURCE CLAIM · vendor · search excerpt]**.

### 4. Platform
- **API** **[SOURCE CLAIM · independent · third-party docs on GitHub (Nango, citing Gem docs)]** ([Nango Gem docs](https://github.com/NangoHQ/nango/blob/master/docs/integrations/all/gem.mdx) (accessed 2026-09-25))
  - Auth uses an API key plus application secret, sent as `x-api-key` and `x-application-secret` headers.
  - "Each API key is subject to a rate limit of 20 requests per second".
  - Access is requested through the Gem CSM or AE. Nango's docs state that no partnership or security audit is needed.
  - There are two surfaces, `/v0` (CRM) and `/ats/v0` (ATS), with offset pagination (`page`, `per_page`) and an `updated_after` filter **[third-party code]**.
- **Webhooks:** **[UNKNOWN]**.
- **AI** **[SOURCE CLAIM · vendor · search excerpt]**: the three agents above, with "AI built into every workflow". Human-in-the-loop, opt-out and bias-audit statements: **[UNKNOWN]**.
- **[UNKNOWN]:** SSO, SCIM, MFA, RBAC, audit logs, customization, localization, reporting detail, mobile, VPAT, SOC 2 and ISO, data residency.

### 5. Business
- **Pricing:** **[UNKNOWN]**. `gem.com/pricing` could not be fetched, and no public price was surfaced.
- **Packaging** **[SOURCE CLAIM · vendor · search excerpt]**: all-in-one, or modular add-ons to an existing ATS ("ATS ecosystem"). Consolidation savings are the stated economic pitch.

### 6. Independent perspective
- A Capterra listing exists ([Capterra](https://www.capterra.com/p/204052/Gem/) (accessed 2026-09-25)); its content could not be read, since Capterra was blocked.
- Other third-party summaries surfaced are competitor-run ([ismartrecruit](https://www.ismartrecruit.com/tools/gem) (accessed 2026-09-25)) **[SOURCE CLAIM · independent · search excerpt · weak]**.
- Documented strengths and complaints: **[UNKNOWN]**.

### 7. Lessons for OpenCATS 2.0
- **Principles evidenced** **[INFERENCE]**
  - Sourcing CRM and ATS are converging on **one candidate record**. Rediscovery (past candidates) and new sourcing (external profiles) run through the same AI search.
  - AI is packaged as **named agents with a narrow job** (source, review, fraud), not as a generic chatbot.
- **Patterns worth learning from** **[RECOMMENDATION]**
  1. Design OpenCATS 2.0's candidate as a single person record that spans CRM "projects" or pools and ATS "applications", rather than separate CRM and ATS silos (GAP-018).
  2. Make AI features **narrow, named and explainable**. For example, "review applicants with clear reasoning", with the reasoning stored and shown to the human decision-maker. Log every AI suggestion for audit (GAP-024, GAP-011).
  3. Add **candidate-fraud signals** (identity and duplicate anomalies) to the roadmap. This is a 2025–26 market theme, and it builds on the dedupe redesign (GAP-017).
  4. Keep the API complete enough for customers to run their **own agents**: CRUD on candidates, applications, notes and resumes, plus change feeds.
  5. Consider a **Greenhouse-compatible import shape** (applications, jobs, job posts, offices, rejection reasons) to reduce migration friction. *(INFERENCE; verify first.)*
- **Things not to copy** **[RECOMMENDATION]**
  - API access gated by contacting an account manager. OpenCATS, being open source, should offer self-serve, scoped API keys.
  - Unverifiable productivity multipliers ("5x") in product claims.

### Sources
1. https://www.gem.com/?i=1 — vendor homepage (search excerpt) — accessed 2026-09-25
2. https://www.gem.com/blog/allow-us-to-re-introduce-ourselves-say-hello-to-the-only-ai-first-all-in-one — vendor blog (search excerpt) — accessed 2026-09-25
3. https://www.gem.com/blog/announcing-gem-ats — vendor blog (search excerpt) — accessed 2026-09-25
4. https://www.gem.com/blog/introducing-gems-ats-ecosystem — vendor blog (search excerpt) — accessed 2026-09-25
5. https://help.gem.com/whats-new — vendor changelog (search excerpt; page not fetchable) — accessed 2026-09-25
6. https://github.com/NangoHQ/nango/blob/master/docs/integrations/all/gem.mdx — Nango integration docs (independent; cites Gem API reference `api.gem.com/v0/reference`) — accessed 2026-09-25
7. https://github.com/NangoHQ/integration-templates/tree/3e8305e2383842cfc95ca2390e9859686911f790/integrations/gem — third-party integration code (endpoints, types) — accessed 2026-09-25
8. https://github.com/warpdotdev/recruiting-sourcing-agent-oss — third-party open-source agent (repository description) — accessed 2026-09-25
9. https://www.capterra.com/p/204052/Gem/ — review aggregate (listing only; blocked) — accessed 2026-09-25
10. https://www.ismartrecruit.com/tools/gem — competitor-run review page (weak) — accessed 2026-09-25

---

## Cross-product crosswalk: OpenCATS agency objects vs. set D

| OpenCATS today (`docs/audit/FEATURE_INVENTORY.md`) | Bullhorn **[FACT]** | Loxo **[SOURCE CLAIM · vendor · search excerpt; third-party code]** | Teamtailor **[FACT]** | Gem **[SOURCE CLAIM · independent · third-party code on GitHub]** |
|---|---|---|---|---|
| Company (§2.7) | ClientCorporation (+ hierarchy, fee terms, billing profile) | companies | company (employer itself) | offices |
| Contact (§2.8) | ClientContact (+ opt-outs, anonymization, login fields) | hiring-manager portal users (invite + OTP) | users / team memberships | users |
| Job order (§2.3) | JobOrder (+ bill/pay rates, markup, fee, job-board list) | jobs | jobs (+ requisitions, salary range) | jobs, job_posts |
| Pipeline row + status history (§2.4, §3) | JobSubmission (+ history) | pipeline stages (portal-visible) | job_applications + stages | applications + job_stages |
| "Submitted" = status 400 (FEAT-008) | **Sendout** (e-mail + read tracking) | "Submit Candidate" link / portal | — | — |
| "Placed" = status 800 | **Placement** (+ commissions, change requests, billing) | UNKNOWN | hired (status) | `hired` status |
| Saved lists (§2.9) | Tearsheet (multi-entity) | UNKNOWN | UNKNOWN | projects |
| — (no BD) | Lead → Opportunity (weighted deals) | Sales CRM / deals | — | — |
| Careers portal (§2.14) | open-source career portal (MIT) | UNKNOWN | career site + direct-apply API with consents | career sites (named) |
| XML/RSS pull feeds (§2.15) | job-board posts | organic posting | webhooks + XML feeds (3×/day) + premium feed | UNKNOWN |
| Import with revert (§2.11) | Data Loader (templates, success/failure CSVs) | UNKNOWN | UNKNOWN | UNKNOWN |

---

## Sources: method and selection rationale
1. https://www.hiretruffle.com/blog/best-staffing-crms — listicle (weak; lead list) — accessed 2026-09-25
2. https://www.tenzo.ai/blog/best-staffing-agency-software-for-2026 — listicle (weak) — accessed 2026-09-25
3. https://peoplemanagingpeople.com/tools/best-bullhorn-alternatives/ — listicle (weak) — accessed 2026-09-25
4. https://recruitcrm.io/pricing/ — vendor pricing page, Recruit CRM (search excerpt) — accessed 2026-09-25
5. https://recruitcrm.io/frequently-asked-questions/ — vendor FAQ, Recruit CRM (search excerpt) — accessed 2026-09-25
6. https://help.recruitcrm.io/en/articles/4033085-managing-your-recruit-crm-subscription — vendor help (search excerpt) — accessed 2026-09-25
7. http://help.recruitcrm.io/en/articles/1466788-receiving-feedback-from-clients — vendor help (search excerpt) — accessed 2026-09-25
8. https://help.recruitcrm.io/en/articles/1801407-submit-candidates-to-contacts — vendor help (search excerpt) — accessed 2026-09-25
9. https://www.eu-startups.com/2026/09/leuven-based-spott-raises-e18-3-million-to-build-the-ai-native-operating-system-for-recruitment-agencies/ — independent press (search excerpt) — accessed 2026-09-25
10. https://thenextweb.com/news/spott-raises-21m-series-a-balderton-recruitment — independent press (search excerpt) — accessed 2026-09-25
11. https://spott.io/ — vendor homepage, Spott (search listing) — accessed 2026-09-25
12. https://www.dover.com/blog/applicant-tracking-system — vendor blog, Dover (search excerpt) — accessed 2026-09-25
13. https://help.dover.com/en/articles/6480741-getting-started-with-ats-features — vendor help, Dover (search listing) — accessed 2026-09-25
14. https://www.noon.ai/blog/articles/280-dover-review — third-party review blog (weak) — accessed 2026-09-25
15. https://techcrunch.com/2025/09/29/ai-recruiter-alex-raises-17m-to-automate-initial-job-interviews/ — independent press (search listing) — accessed 2026-09-25
16. https://fortune.com/2026/04/28/exclusive-dex-ai-powered-recruiting-startup-raises-seed-round-notion-capital/ — independent press (search listing) — accessed 2026-09-25
17. https://www.enterprisetimes.co.uk/2023/08/04/rippling-launches-new-ats-rippling-recruitment/ — independent press (search excerpt) — accessed 2026-09-25
18. https://www.rippling.com/products/hr/recruiting — vendor product page, Rippling (search excerpt) — accessed 2026-09-25
19. https://www.rippling.com/blog/introducing-rippling-recruiting — vendor blog, Rippling (search excerpt) — accessed 2026-09-25
20. https://www.erpresearch.com/erp-add-ons/talent/rippling-ats — independent review (search excerpt) — accessed 2026-09-25
21. OpenCATS baseline: `docs/audit/FEATURE_INVENTORY.md` (§2.3, §2.4, §2.7–2.9, §2.11, §2.14–2.15, §3; FEAT-001/003/008/011/013), `docs/audit/PRODUCT_GAPS.md` (GAP-002/004/005/008/011/012/015/017/018/021/024/025; Unknowns), `docs/audit/EXECUTIVE_SUMMARY.md` (Fact 2) — repository documents, accessed 2026-09-25
