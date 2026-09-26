# AI in Recruiting: Landscape 2025–2026 and Implications for OpenCATS 2.0

**Date:** 2026-09-25 · **Phase:** 2 (competitive market research) · **Status:** research draft for the lead. This is not legal advice. Every regulatory statement below needs review by qualified counsel before anyone relies on it.
**Baseline documents:** `docs/audit/PRODUCT_GAPS.md` (GAP-002, GAP-011, GAP-016, GAP-021, GAP-023, GAP-024), `docs/audit/RISKS.md` (RISK-005), `docs/audit/SECURITY_AUDIT.md` (SEC-017, SEC-022), `docs/audit/FEATURE_INVENTORY.md` (FEAT-012).

---

## 0. Scope

This document covers five things:

1. **Where AI is used in recruiting in 2025–2026**, arranged by workflow stage.
2. **Vendors and products.** For each one: what the AI is documented to do, how humans stay in the loop, transparency, opt-out, bias-audit statements, and data use.
3. **Regulation and litigation.** The EU AI Act and the 2026 "Digital Omnibus", GDPR Art. 22, NYC Local Law 144, Illinois, Colorado, California, the US federal position, the UK, and *Mobley v. Workday*. Obligations are split between an ATS vendor and an employer.
4. **Evidence on outcomes**: effectiveness, bias and candidate perception.
5. **Implications for OpenCATS 2.0**: principles, which capabilities are table stakes, which are differentiators, and which to avoid, all tied to the Phase 0 baseline.

This document does not rank vendors or recommend a "best" product. It gives no pricing beyond what vendors publish.

---

## 1. Method, evidence grades and verification status

### 1.1 How the evidence was gathered (and the constraints)
- **Web access was heavily restricted.** WebFetch was egress-blocked for almost every non-GitHub host, including all vendor sites, EUR-Lex, nyc.gov, ilga.gov, leg.colorado.gov, courtlistener.com, pewresearch.org, arxiv.org and ico.org.uk. Only GitHub-hosted content could be read first-hand. I did not use archive or reader-proxy services.
- **WebSearch** returned result summaries and excerpts. Roughly 20 queries were answered before the shared search budget ran out (the tool reported "200 of 200 WebSearch calls" used session-wide). Several planned topics got **no searches at all**: EEOC status, the UK ICO, US federal preemption, other lawsuits, Pew/SHRM/Gartner, and most vendor help centres. They are listed as UNKNOWN in §9.
- **First-hand GitHub sources** (read with `git clone --depth 1` into the session scratchpad; no code was executed):
  - Greenhouse's official API documentation repo, `grnhse/greenhouse-api-docs` (commit `271cd88`, 2026-09-10).
  - The ACLU/NYCLU crowd-sourced LL 144 bias-audit tracker, `aclu-national/tracking-ll144-bias-audits` (commit `5fca36b`, 2026-09-23).
  - Bloomberg's published data for its 2024 GPT resume-ranking investigation, `BloombergGraphics/2024-openai-gpt-hiring-racial-discrimination`. I recomputed impact ratios from its aggregated output file.
  - The authors' repo for the "Silicon Ceiling" EAAMO 2024 paper, `lenaarmstrong/silicon-ceiling`.
- **Third-party GitHub catalog copies (lead-grade only).** Before the lead's addendum arrived, I read the *API Evangelist* GitHub catalog repos (`github.com/api-evangelist/<vendor>`, commits dated 2026-09-18 to 2026-09-24). They contain copies of vendor blog/RSS excerpts and vendor `llms.txt` files, plus API Evangelist's own generated descriptions. They are **not official sources**. They may count as "mirrors" under the addendum, so they are labelled separately below, and the lead may strip them. No further mirror content was retrieved after the addendum.
- **Parallel Phase 2 notes.** A few vendor facts come from sibling agents' scratch notes, which record search excerpts of official pages (Greenhouse, SmartRecruiters). They are labelled as such and need re-verification.

### 1.2 Evidence grades used in this document
| Tag | Meaning |
|---|---|
| **[FACT]** | Read directly by me: this repo (file:line), GitHub-hosted official or author repos, or datasets I analysed myself. |
| **[SOURCE CLAIM · official · search excerpt]** | Text seen only as a WebSearch excerpt from a government, court or legislature domain. The URL shown in the results is cited. |
| **[SOURCE CLAIM · vendor · search excerpt]** | The same, from an official vendor domain. |
| **[SOURCE CLAIM · independent · search excerpt]** | The same, from law firms, press or researchers. |
| **[SOURCE CLAIM · vendor · third-party copy]** | Vendor-authored text (blog/RSS excerpt or `llms.txt`) read only as a copy in the API Evangelist GitHub catalog. **Lead-grade.** |
| **[SOURCE CLAIM · independent · third-party catalog]** | API Evangelist's own generated description of a vendor. **Lead-grade.** |
| **[INFERENCE]** | My reasoning from the above. |
| **[RECOMMENDATION]** | What OpenCATS 2.0 should do. Never a market fact. |
| **[UNKNOWN]** | Could not verify. "Reference knowledge" marks statements from my background knowledge of a statute or event that I could not re-check in this session. |

### 1.3 Verification status
> **Every claim graded "search excerpt" or "third-party copy/catalog" needs a browser check against the primary source before external publication.** This applies especially to regulatory dates and obligations (§5) and to vendor capability claims (§4). Search excerpts are machine summaries and can be wrong.

---

## 2. Summary table

| # | Finding | Grade |
|---|---|---|
| 1 | **The EU AI Act's high-risk rules for employment AI (Annex III) now apply from 2 December 2027, not 2 August 2026.** Regulation (EU) 2026/1744 (the "Digital Omnibus on AI") made the change. It was adopted by the Council on 29 June 2026 and entered into force on 27 July 2026. Recruitment and selection AI stays high-risk. | SOURCE CLAIM · official · search excerpt ([S1], [S2], [S3]) |
| 2 | **Colorado repealed and replaced its 2024 AI Act.** SB 26-189 was signed on 14 May 2026 and takes effect on **1 January 2027**. It drops the duty of care, impact assessments and risk-management programmes in favour of pre-use notice, adverse-outcome disclosure and limited consumer rights. Job applicants are covered. | SOURCE CLAIM · independent · search excerpt ([S29]–[S33]) |
| 3 | **Illinois HB 3773 (P.A. 103-0804) took effect on 1 January 2026.** It covers discriminatory AI effects, ZIP-code proxies and notice. IDHR's notice rules were *temporarily withdrawn*, and the June 2026 hearing was cancelled. The statutory duties still apply. | SOURCE CLAIM · independent · search excerpt ([S23], [S24]) |
| 4 | **NYC LL 144 enforcement was judged "ineffective"** by the NY State Comptroller (audit dated 2 December 2025). DCWP agreed to adopt 10 of the 13 recommendations in full and one in part, so stricter enforcement is expected. | SOURCE CLAIM · official · search excerpt ([S16], [S17]) |
| 5 | ***Mobley v. Workday* is escalating, not ending.** A nationwide ADEA collective was preliminarily certified in May 2025. On 6 March 2026 the court held that applicants can bring ADEA disparate-impact claims. A 22 June 2026 order let the FEHA and one ADA claim proceed. The case now spans race, sex, age and disability. | SOURCE CLAIM · independent · search excerpt ([S41]–[S45]) |
| 6 | **Vendor-published bias audits are multiplying.** The ACLU/NYCLU tracker lists 98 audit entries. 13 are dated 2026, and 11 of those were done by Warden AI. "AI interviewer" tools make up a large share of the 2026 entries: Eightfold, Ashby, ModernLoop, Hireology and others. 13 entries are marked as later *removed* from the posting website. | FACT ([S19]) |
| 7 | **Greenhouse's official API docs expose AI transparency and opt-out plumbing.** The Job Board API has `include_ai_disclaimer`, `ai_disclaimer` (example: "We use Greenhouse's AI-powered Talent Matching tool…") and `ai_opt_out_request_url`. `match_score_reasoning` became an anonymisable field on 24 September 2025. A `country_short_name` field "enables fraud detection location checks". | FACT ([S47]) |
| 8 | **"AI interviewer" agents are the defining 2025–2026 product category.** Examples include Eightfold AI Interviewer (embedded in Oracle Recruiting Cloud), HireVue AI Interviewer, BrightHire Screen, SmartRecruiters Winston Interview, Employ AI Interview Companion, Greenhouse's acquisition of voice-AI company Ezra AI Labs, and Ashby AI Interviewer (bias-audit entry). | Mix: FACT ([S19]) plus SOURCE CLAIM · vendor · third-party copy ([S54]–[S59]) |
| 9 | **Candidate fraud and deepfake detection went mainstream in 2026.** Examples: Greenhouse (Real Talent/CLEAR identity verification, fraud location checks), Ashby (`candidate.listFraudChecks` / `setFraudStatus`), BrightHire (fraud detection GA in August 2026), Metaview (fraud detection in Application Review), SmartRecruiters (applicant fraud detection, April 2026), and Employ (fraud webinar series). | FACT for the Greenhouse field ([S47]); the rest are SOURCE CLAIM · vendor · third-party copy / parallel notes |
| 10 | **Vendors are adopting MCP servers so general assistants can operate the ATS.** Examples: Greenhouse (`mcp.greenhouse.io`, auth-gated), SeekOut MCP (14 workflows), Workable MCP (94 tools), Findem. | SOURCE CLAIM · vendor · third-party copy / independent · third-party catalog ([S48], [S53], [S57], [S64]) |
| 11 | **Humans in the loop is the dominant *stated* design,** for example "a person makes every hiring decision, and the tool never rejects a candidate on its own" (BrightHire) and "humans make the final call" (Eightfold/Oracle). Counterexamples exist: a Workable customer story says its agent plus screening questions "eliminated 20% of unqualified applicants automatically". | SOURCE CLAIM · vendor · third-party copy ([S55], [S54], [S57]) |
| 12 | **LLM resume ranking showed name-based disparities in Bloomberg's published 2024 data.** For GPT-3.5-turbo, at least one race×gender group fell below the four-fifths (0.8) impact ratio in all 4 jobs tested. For GPT-4 this happened in 3 of 4 jobs. Which group was disadvantaged varied by job. | FACT (my recomputation of [S66]) |
| 13 | **Whether vendors train on customer data is rarely stated** in the materials I could reach. No vendor training-data policy could be verified in this session. | UNKNOWN / INFERENCE |
| 14 | **OpenCATS has no AI today (GAP-024), and its only "smart" feature is a liability.** It sends resume text to a defunct third-party SOAP endpoint over plain HTTP, and does so even when `PARSING_ENABLED=false`. | FACT (`wsdl/parse.wsdl:78`, `config.php:51`, `lib/License.php:687-706`; RISK-005, GAP-023) |
| 15 | **Recommended stance for OpenCATS 2.0:** assistive AI first (parsing, drafting, summaries, semantic search); evaluative AI (scores and rankings) only behind a separately governed, default-off module with explanations, audit logs, adverse-impact reporting and candidate notice/opt-out; never autonomous rejection. | RECOMMENDATION |

---

## 3. Where AI is used in recruiting today (taxonomy by workflow stage)

**How to read this table:** "Documented examples" lists only items with at least a search excerpt or a GitHub-hosted source. The "Risk tier" column is my **[INFERENCE]** about regulatory sensitivity. It is based on EU AI Act Annex III 4(a) ("to place targeted job advertisements, to analyse and filter job applications, and to evaluate candidates") and NYC LL 144's "substantially assist or replace discretionary decision making" standard (§5).

| Stage | What AI does | Documented examples (grade) | Human-in-the-loop / transparency pattern | Risk tier (INFERENCE) |
|---|---|---|---|---|
| **Job description / intake** | Drafts JDs from intake notes, checks wording, turns intake calls into job briefs | Metaview "AI Job Posts" and "Intake & Debrief Notes" ([S52], vendor · third-party copy); Workable "Job Brief" agent and JD writing ([S57], vendor · third-party copy); Greenhouse "Job Kickoff Agent" planned for Q3 2026 (parallel notes, vendor · search excerpt) | Recruiter edits and publishes | Low (drafting). Watch targeted ad placement, which is listed in Annex III 4(a). |
| **Sourcing and search** | Semantic or skills search over large profile databases; autonomous sourcing agents; rediscovery of past applicants | SeekOut "1B+ candidate profiles", SeekOut Recruit and "Rediscover Applicants" ([S53]); Metaview AI Sourcing Agent "finds candidates 24/7… learns from your feedback" ([S52]); Workable sourcing "from 400+ million profiles" ([S57]); Juicebox "Autopilot" and hireEZ "Candidate Sourcing" have LL 144 audit entries ([S19], FACT that the entries exist) | Agents propose; recruiter approves outreach | Medium. Profile scraping and data-provenance issues fall under GDPR (INFERENCE). |
| **Resume parsing / normalisation** | Extracts structured fields and skills | Ashby "Structured resume parsing" (status incident dated 2026-07-08, [S51], vendor · third-party copy); Phenom resume/JD parsing APIs ([S64], independent · third-party catalog); Greenhouse `match_score_reasoning` field ([S47], FACT) | Usually invisible to candidates | Low to medium (it feeds downstream ranking) |
| **Matching / ranking / fit scoring** | Scores or grades applicants against job criteria, often with "reasoning" | Greenhouse "AI-powered Talent Matching" with candidate-facing disclaimer and opt-out URL ([S47], FACT); Ashby "AI Application Review" returns AI criteria evaluations with "outcome, reasoning" ([S50], vendor · third-party copy); Metaview Application Review "surfaces the strongest matches with reasoning, and self-calibrates as you make decisions" ([S52]); SeekOut Sam "explainable decisions" ([S53]); SmartRecruiters Winston Match (parallel notes); Eightfold Matching Model, Phenom Fit Score, Beamery AI Talent Match and others in the LL 144 tracker ([S19], FACT) | Criterion-level reasoning is the emerging norm. Opt-out links exist (Greenhouse). | **High** (Annex III 4(a); likely an LL 144 AEDT) |
| **Screening (knockouts, chat, conversational)** | Chatbots answer FAQs, ask screening questions and pre-qualify | Paradox "Olivia" conversational assistant for high-volume hiring ([S64]/[S61]); SmartRecruiters Winston Chat (parallel notes); Workable "custom screening questions" plus agent ([S57]); Eightfold "Candidate Agent" (July 2026, [S54]) | Varies. Auto-disqualification is documented in at least one customer story ([S57]). | **High** when it filters; EU Art. 50 disclosure applies to chatbots |
| **AI interviewers** (new category) | Voice, chat or video agents run first-round structured interviews and score answers | Eightfold AI Interviewer / "360 Interview" (May–August 2026, [S54]); Oracle and Eightfold AI Interviewer "embedded in Oracle Recruiting Cloud" (7 May 2026, [S54]); HireVue AI Interviewer ([S56]); BrightHire Screen "24/7 AI interviews" ([S55]); SmartRecruiters "agentic interviewing" (7 April 2026, [S58]); Employ "AI Interview Companion" (January 2026, [S59]); Greenhouse acquired Ezra AI Labs (voice AI) ([S49], parallel notes); Ashby, ModernLoop, Hireology, Classet and others have 2026 "AI interviewer" bias-audit entries ([S19], FACT) | Stated as "AI surfaces signal, human decides" ([S55], [S54]) | **High**. Emotion inference in the workplace is prohibited in the EU (Art. 5). Illinois AIVIA applies to AI analysis of video. |
| **Scheduling** | Self-scheduling, loop orchestration, reschedules over SMS or chat | Paradox (scheduling product, [S64]); ModernLoop scheduling plus "Taylor AI" agent ([S64]) | Low risk; mostly automation | Low |
| **Interview intelligence** | Records and transcribes; structured notes; highlights; interviewer coaching | Metaview "AI Interview Notes" ([S52]); BrightHire notes and coaching ([S55]); Ashby "AI Notetaker add-on" with transcript retention limits on the free tier ([S50]); Greenhouse "Notetaker" (mid-July 2026, parallel notes) | Consent to recording is required in many jurisdictions (INFERENCE) | Medium (sensitive data; can feed evaluation) |
| **Assessments** | Skills or psychometric tests, some AI-scored | HireVue (assessments plus "validated psychology", [S56]); Ashby Assessments framework (partners, [S50]); Greenhouse Assessment API ([S47]) | Validation studies claimed by vendors | High if AI-scored |
| **Outreach** | Personalised multi-step email sequences | Metaview "AI-personalized multi-step email sequences" ([S52]); SeekOut "personalized outreach" ([S53]); Workable "Engagement" agent ([S57]) | Recruiter review before sending is not always documented | Low to medium |
| **Candidate-facing assistants** | Job matching, FAQs, application help on career sites | Paradox Olivia ([S64]); Eightfold Candidate Agent ([S54]); SmartRecruiters Winston Chat (parallel notes) | Must disclose AI (EU Art. 50) | Medium |
| **Recruiter copilots / agents / MCP** | Multi-step agents inside the ATS; MCP servers exposing ATS actions to Claude, ChatGPT or Copilot | Workable's four "Recruiting Agents" (Job Brief, Sourcing, Screening, Engagement), "generally available globally… more than 120,000 candidates" ([S57]); Workable MCP server with 94 tools ([S57]); Greenhouse MCP endpoint (auth-gated, [S48]); SeekOut MCP (14 workflows, [S53]); Workday agent-building paths incl. "Sana" and "Workday Flowise Agent Builder" ([S62]); Findem "agentic AI workers" plus MCP ([S64]) | Permission and audit models for agents are rarely documented publicly (INFERENCE) | Depends on the actions allowed |
| **Analytics / insights** | Natural-language reporting and chart agents | Metaview "Recruiting Reports" ([S52]); Greenhouse "Analytics Chart Agent" (parallel notes); Workable AI-credit consumption report ([S57]) | Low | Low |
| **Fraud / deepfake / identity** | Identity verification, location consistency, AI-assisted-answer and deepfake signals, manual fraud-review status | Greenhouse `country_short_name` "enables fraud detection location checks" ([S47], FACT); Greenhouse "Real Talent" (fraud detection, identity verification, matching) ([S49]) and CLEAR partnership (June 2025, parallel notes); Ashby `candidate.listFraudChecks` and `candidate.setFraudStatus` ("manual fraud-review status") ([S50]); BrightHire fraud detection launched June 2026, "now available" 24 August 2026 ([S55]); Metaview Application Review "Includes fraud detection" ([S52]); SmartRecruiters "applicant fraud detection" (April 2026, [S58]) | Stated as signals for human review (Ashby's "manual fraud-review status") | Medium. Biometric and identity data carry GDPR special-category and BIPA-type exposure (INFERENCE). |

**Cross-stage observation [INFERENCE]:** candidates now use AI too, which is driving an "arms race". Workable says "around 10% of the job applications flowing through our platform are now submitted via AI mass-apply tools" (5 January 2026, [S57], vendor · third-party copy). Rising volume is the most common justification vendors give for automated screening and AI interviewers (Eightfold [S54], BrightHire [S55], HireVue [S56]).

---

## 4. Vendors and products

**Legend:** "HITL" means human-in-the-loop design as stated. Opt-out means a candidate-facing opt-out or alternative process. "—" means not found in reachable sources, which makes it **UNKNOWN**, not absent.

### 4.1 Per-vendor table

| Vendor (ownership as verified) | AI capabilities documented | HITL / autonomy statement | Transparency / explainability | Candidate notice / opt-out | Bias-audit statement | Data use / training on customer data |
|---|---|---|---|---|---|---|
| **Greenhouse** (TPG majority since 2021 per parallel notes; acquired Ezra AI Labs in 2026 [S49]) | Talent Matching (FACT, [S47]); match-score reasoning (FACT, [S47]); Real Talent fraud and identity verification ([S49], third-party catalog); MCP endpoint ([S48]); 2026 announcements of an AI Principles Framework (April), MCP (May), Notetaker, Job Kickoff Agent, Candidate Insights Agent and Analytics Chart Agent (June) (parallel notes, vendor · search excerpt) | — | `match_score_reasoning` stored per candidate and anonymisable (FACT, [S47]) | **Yes:** Job Board API `ai_disclaimer` and `ai_opt_out_request_url` (FACT, [S47]) | "Talent Matching" audited by Warden AI, dated 14 August 2026 (FACT that the tracker entry exists, [S19]) | UNKNOWN |
| **Ashby** | AI Application Review (criteria evaluations with outcome and reasoning); AI Notetaker add-on; fraud checks; audit-log API in beta ([S50], vendor · third-party copy); AI Interviewer (LL 144 entry, [S19]) | Fraud status is set *manually* ([S50]) | Per-criterion "reasoning" ([S50]) | — | "AI Interviewer" audited by Warden AI, dated 1 September 2026 ([S19], FACT) | UNKNOWN. Status page shows the AI Notetaker depends on an "upstream provider" ([S51]). |
| **Lever / Employ Inc.** (Employ is the parent of JazzHR, Lever and Jobvite: [S59], third-party catalog; parallel notes) | "AI Interview, Screening and Sourcing Companions" across brands ([S59]); AI Interview Companion (January 2026, [S59], vendor · third-party copy) | — | — | — | Employ publishes an NYC LL 144 bias audit hosted by Holistic AI and a responsible-AI page ([S59], third-party catalog) | Responsible-AI page reportedly states the AI is "built on IBM watsonx" ([S59], third-party paraphrase; UNKNOWN until verified) |
| **SmartRecruiters (SAP)**: SAP agreement announced 1 August 2025, completed 11 September 2025 ([S58], vendor press release · third-party copy; also in parallel notes) | Winston Screen, Match ("4-star with explainability"), Chat and Companion (parallel notes, vendor · search excerpt); April 2026: agentic interviewing, agentic CRM, applicant fraud detection, SuccessFactors integration ([S58]); Joule plus Winston convergence on the roadmap (parallel notes) | — | Match explanations claimed (parallel notes) | — | SmartAssistant audits (Conductor AI, 2023 and 2024) in the tracker ([S19], FACT) | UNKNOWN |
| **Workable** | Six AI functions ("job description writing, candidate sourcing from 400+ million profiles, resume screening and matching, a conversational recruiter assistant, interview question generation, and candidate rediscovery"); four Recruiting Agents; ICP re-evaluation; MCP server (94 tools); AI credits report ([S57], vendor · third-party copy) | Customer story says screening "eliminated 20% of unqualified applicants automatically" ([S57]). A counter-signal is the post "AI as a Recruiting Assistant, Not a Replacement" ([S57]). | ICP-based evaluation; the recruiter can edit the ICP and re-run ([S57]) | — | — | UNKNOWN. Packaging note: "no add-on cost" ([S57]) alongside a purchasable, expiring "AI credits" model ([S57]). |
| **iCIMS** | Blog post "Illinois and California AI hiring laws: How iCIMS supports compliance" (20 February 2026, [S63], title only) | — | — | — | — | UNKNOWN. **iCIMS Copilot could not be verified this session.** |
| **Workday** (HiredScore and Paradox ownership: UNKNOWN in this session; see §4.2) | Agent-building paths: "Agent-Ready Tools", running agents on Workday, "Sana, Workday's full AI workspace"; Workday Build with the "Workday Flowise Agent Builder" ([S62], vendor · third-party copy) | "building agents on Workday's guardrails" ([S62]) | — | — | HiredScore audits posted in 2023 and 2024 ([S19], FACT) | UNKNOWN. **Recruiting-specific Workday agents not verified.** |
| **Paradox** (Olivia) | Conversational ATS, CRM, career sites, apply, scheduling and events for high-volume hiring ([S64], third-party catalog) | — | — | — | Holistic AI audits of Olivia chatbot, Conversational AI Platform and Traitify (2023–2024) ([S19], FACT) | UNKNOWN. A post titled "Responsible Security Update" exists (title only, [S61]); its content was not verified. |
| **Eightfold AI** | Talent Intelligence Platform; AI Interviewer; 360 Interview; Candidate Agent; TalentForge; Oracle Recruiting Cloud embedding ([S54], vendor · third-party copy) | "humans make the final call" (Oracle AI Interviewer post, [S54]) | "candidate masking, diversity dashboards" (Responsible AI series, 20 May 2026, [S54]) | — | Matching Model audits (BABL AI 2023; Morgan Stanley's audit by BLDS 2024); AI Interviewer audit (BABL AI, 29 June 2026) ([S19], FACT) | "controls what goes into the model before training ever starts" ([S54]). Whether customer data is used for training is UNKNOWN. |
| **SeekOut** | SeekOut Recruit (sourcing, screening, outreach over "1B+" profiles); Spot (agentic AI plus human recruiters); Sam ("explainable decisions"); MCP ([S53], vendor · third-party copy) | Spot pairs AI with "expert recruiters" ([S53]) | "explainable decisions" (Sam) ([S53]) | — | Links to a "Responsible AI" page ([S53]); contents not verified | UNKNOWN |
| **Metaview** | Sourcing agent; Application Review with fraud detection; AI interview notes; outreach; reports; AI job posts; published plans "Free ($0), Pro ($100/mo), and Max ($300/mo)" ([S52], vendor · third-party copy) | Application Review "self-calibrates as you make decisions" ([S52]) | "with reasoning" ([S52]) | — | Application Review audit listed, date "TKTK" ([S19], FACT) | Self-calibration from customer decisions implies learning from customer feedback (INFERENCE); scope UNKNOWN |
| **BrightHire** | Interview intelligence; BrightHire Screen (AI interviewer); fraud detection ([S55], vendor · third-party copy) | "a person makes every hiring decision, and the tool never rejects a candidate on its own" ([S55]) | — | — | Frames an "independent bias audit" as the legal safeguard ([S55]) | UNKNOWN. **Ownership (reference knowledge suggests Zoom) is UNKNOWN.** Zoom's CEO spoke at BrightHire's Shine 2026 event, and a post covers "Interview notes for Zoom" ([S55]). |
| **HireVue** | AI Interviewer; assessments; "AI Hiring Agent" ([S56], [S64]) | — | Blog: hiring AI needs "explainable decision-making" and "validated psychology" ([S56], catalog summary of vendor post) | — | HireVue assessments audited by DCI for several employers (2023–2024) ([S19], FACT) | UNKNOWN |
| **Juicebox (PeopleGPT)** | "Juicebox Autopilot" (audits 2025–2026) ([S19], FACT) | — | — | — | Warden AI audits dated 12 June 2025, 3 February 2026 and 6 August 2026 ([S19]) | UNKNOWN. **PeopleGPT capabilities not verified.** |
| **hireEZ** | "Candidate Sourcing" audit entry (date TKTK) ([S19], FACT) | — | — | — | Warden AI (listed) | UNKNOWN |
| **Gem** | Described as "an AI-first recruiting platform that bundles a next-generation ATS, recruiting CRM, AI outbound sourcing, scheduling, talent marketing, application review, and talent rediscovery into a single agentic AI hiring system" ([S64], third-party catalog) | — | — | — | — | UNKNOWN |
| **SAP SuccessFactors (Joule)** | Joule and Winston convergence on the SmartRecruiters roadmap (parallel notes) | — | — | — | — | UNKNOWN |
| **Oracle Recruiting** | Embeds Eightfold's AI Interviewer ([S54], vendor · third-party copy) | "humans make the final call" ([S54]) | — | — | — | UNKNOWN. **Oracle's own AI agents not verified.** |
| **LinkedIn Hiring Assistant** | **Not verified in this session** | — | — | — | — | UNKNOWN |
| Others seen: **ModernLoop** (scheduling plus "Taylor AI" agent; AI Interviewer audit dated 16 September 2026), **Findem**, **Phenom**, **Beamery** | [S64] (third-party catalog); [S19] (FACT) | — | — | — | Audits listed for ModernLoop, Phenom and Beamery ([S19]) | UNKNOWN |

### 4.2 Market events (M&A and partnerships) and their verification status
| Event | Status in this session |
|---|---|
| SAP acquired SmartRecruiters (announced 1 August 2025, closed 11 September 2025) | SOURCE CLAIM · vendor (press-release excerpt; third-party copy [S58] plus parallel notes) |
| Greenhouse acquired Ezra AI Labs (voice AI interviewer), 2026 | SOURCE CLAIM · independent · third-party catalog ([S49]) plus parallel notes (announced 5 May 2026, completed 27 May 2026) |
| Greenhouse–CLEAR identity-verification partnership (June 2025) | Parallel notes (vendor · search excerpt) |
| Oracle Recruiting Cloud embeds Eightfold's AI Interviewer (May 2026) | SOURCE CLAIM · vendor · third-party copy ([S54]) |
| Employ owns Lever, Jobvite and JazzHR | SOURCE CLAIM · independent · third-party catalog ([S59]) plus parallel notes |
| Workday's agent platform references "Sana" and "Flowise" | SOURCE CLAIM · vendor · third-party copy ([S62]). *Ownership of Sana and Flowise by Workday is INFERENCE.* |
| **Workday acquisition of Paradox** | **UNKNOWN.** Reference knowledge says it was announced in August 2025 and closed in autumn 2025. Not verified. |
| **Workday acquisition of HiredScore (2024)** | **UNKNOWN.** Reference knowledge; not verified. |
| **Zoom acquisition of BrightHire** | **UNKNOWN.** Reference knowledge; only indirect signals ([S55]). |

### 4.3 Cross-vendor patterns
- **[INFERENCE]** *Reasoning-attached scores* are becoming standard: Greenhouse `match_score_reasoning` [S47], Ashby criteria evaluations with "reasoning" [S50], Metaview "with reasoning" [S52], SeekOut "explainable decisions" [S53], Winston Match "explainability" (parallel notes). The market has moved from opaque fit scores to criterion-level rationales.
- **[INFERENCE]** *Vendor-level LL 144 audits have become a sales artifact.* Warden AI accounts for 44 of 98 tracker entries, and vendors themselves post many of the 2026 entries [S19]. Note that LL 144 places the audit duty on the **employer**. Vendor audits are inputs to that, not a substitute (§5.3).
- **[INFERENCE]** *AI is priced as a consumable.* Examples: Workable "AI credits" [S57], Ashby "AI Notetaker add-on" [S50], and Metaview tiered plans [S52].
- **[INFERENCE]** *Model-provider dependency is an operational risk.* Ashby's status page reports "AI Notetaker Unavailable Due to Upstream Provider" (24 March 2026) and "AI features are enabled again" after an outage (1 June 2026) [S51].
- **[UNKNOWN]** *Training-data policies* (whether customer data trains shared models) were not visible in any source I could reach.

---

## 5. Regulation, risk and litigation (not legal advice)

### 5.1 EU AI Act (Regulation (EU) 2024/1689) as amended by the Digital Omnibus (Regulation (EU) 2026/1744)
- **Employment AI is high-risk.** Annex III point 4(a) covers "AI systems intended to be used for the recruitment or selection of natural persons, in particular to place targeted job advertisements, to analyse and filter job applications, and to evaluate candidates". [SOURCE CLAIM · official · search excerpt] ([AI Act Service Desk, Annex III](https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3) (accessed 2026-09-25) [S4])
- **Profiling means always high-risk.** Under the Art. 6(3) filter, an Annex III system can escape high-risk status if it does not "materially influenc[e] the outcome of decision making". This exemption is not available where the system "performs profiling of natural persons". [SOURCE CLAIM · official · search excerpt] ([Article 6](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6) (accessed 2026-09-25) [S5]). **[INFERENCE]** Candidate scoring and ranking almost always involves profiling, so it cannot use the Art. 6(3) exemption.
- **New dates from the Omnibus:** Annex III obligations apply from **2 December 2027**; Annex I (AI embedded in products) from **2 August 2028**. The regulation entered into force on **27 July 2026**. Political agreement came on 7 May 2026, Parliament voted on 16 June 2026, and the Council adopted it on 29 June 2026. [SOURCE CLAIM · official · search excerpt] ([Commission: "AI Omnibus enters into force"](https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force) (accessed 2026-09-25) [S1]; [Council press release, 29 June 2026](https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/) (accessed 2026-09-25) [S2]; [EUR-Lex 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng) (accessed 2026-09-25) [S3]). Independent corroboration: [Hunton](https://www.hunton.com/privacy-and-cybersecurity-law-blog/eu-digital-omnibus-on-ai-enters-into-force) and [Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/) (accessed 2026-09-25) [S9], [S10].
- **Other Omnibus changes relevant here:**
  - Art. 4 (AI literacy) is reportedly softened to "a duty to take measures to support" literacy, applying from 27 July 2026.
  - A **new Art. 4a** lets providers of high-risk systems exceptionally process special-category data "strictly necessary for bias detection and correction", with safeguards and deletion.
  - [SOURCE CLAIM · independent · search excerpt] ([CypherOn summary](https://cypheron.cz/en/resources/ai-act/omnibus-2026) (accessed 2026-09-25) [S11]; weaker source; verify against [S3]).
  - **[INFERENCE]** Art. 4a matters for any OpenCATS use of stored EEO data (`db/cats_schema.sql:188-191`) for adverse-impact monitoring.
- **Deployer (employer) duties, Art. 26:**
  - Before using a high-risk system at the workplace, "deployers who are employers shall inform workers' representatives and the affected workers".
  - The article also covers human oversight by competent people, input-data quality where the deployer controls inputs, monitoring and incident reporting, log retention of **at least six months**, and informing natural persons affected by Annex III decisions.
  - [SOURCE CLAIM · official/independent · search excerpt] ([Article 26](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26) and [euaiact.com Art. 26](https://www.euaiact.com/article/26) (accessed 2026-09-25) [S6])
- **Right to explanation, Art. 86.** Affected persons can obtain "clear and meaningful explanations of the role of the AI system in the decision-making procedure and the main elements of the decision taken". [SOURCE CLAIM · official · search excerpt] ([Article 86](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-86) (accessed 2026-09-25) [S7])
- **Prohibited since February 2025, Art. 5:** AI "to infer emotions of a natural person in the areas of workplace and education institutions", except for medical or safety reasons. [SOURCE CLAIM · official · search excerpt] ([Article 5](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5), [Commission guidelines on prohibited practices](https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-prohibited-artificial-intelligence-ai-practices-defined-ai-act) (accessed 2026-09-25) [S8]). **[UNKNOWN]** Whether the guidelines explicitly extend "workplace" to *candidates* in recruitment. Verify.
- **Provider obligations for high-risk systems** (reference knowledge; **[UNKNOWN · reference knowledge, verify]**): risk management (Art. 9), data governance (Art. 10), technical documentation (Art. 11), automatic logging (Art. 12), transparency and instructions for use (Art. 13), human-oversight design (Art. 14), accuracy, robustness and cybersecurity (Art. 15), a quality-management system (Art. 17), conformity assessment (Art. 43), EU database registration (Art. 49), post-market monitoring and serious-incident reporting (Arts. 72–73). Two further points matter for OpenCATS:
  - The free and open-source exemption (Art. 2(12)) **does not apply** to systems placed on the market or put into service **as high-risk**.
  - A deployer that puts its name on a system, substantially modifies it, or changes its intended purpose can **become a provider** (Art. 25).
- **Chatbot transparency (Art. 50):** people must be told they are interacting with AI. One source says Art. 50 still applies from August 2026 with a watermarking grace period to December 2026 [SOURCE CLAIM · independent · search excerpt; weak; verify against [S3]].
- The EDPB-EDPS issued a Joint Opinion (1/2026) on the Omnibus proposal ([PDF](https://www.edpb.europa.eu/system/files/2026-01/edpb_edps_jointopinion_202601_proposal_ai-omnibus_en.pdf), accessed 2026-09-25 [S12]); only its existence is known here.

### 5.2 GDPR Art. 22 and the UK
- **[UNKNOWN · reference knowledge, verify]** GDPR Art. 22(1) gives data subjects "the right not to be subject to a decision based solely on automated processing, including profiling, which produces legal effects… or similarly significantly affects" them. Exceptions and safeguards are in Art. 22(2)–(4): human intervention, the right to contest, and restrictions on special-category data. Arts. 13–15 require "meaningful information about the logic involved". CJEU case law (reference knowledge: *SCHUFA*, C-634/21, 2023; *Dun & Bradstreet Austria*, C-203/22, 2025) has read these rights broadly. Not verified this session.
- **[UNKNOWN]** UK ICO guidance and audit outcomes on AI recruitment tools (reference knowledge: an ICO audit-outcomes report on AI recruitment tools in November 2024), and the UK Data (Use and Access) Act 2025 changes to automated decision-making rules. **Not verified.** Both hosts were blocked and the search budget was exhausted.

### 5.3 NYC Local Law 144 (Automated Employment Decision Tools)
- Employers and employment agencies may not use an AEDT unless all of the following hold: it had a **bias audit within one year** of use; a summary of the audit is **publicly available**; and candidates or employees received **notice at least 10 business days before use**, with the ability to request an alternative selection process or accommodation. [SOURCE CLAIM · official · search excerpt] ([DCWP AEDT page](https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page); [DCWP FAQ](https://www.nyc.gov/assets/dca/downloads/pdf/about/DCWP-AEDT-FAQ.pdf); [final rules](https://rules.cityofnewyork.us/rule/automated-employment-decision-tools-updated/) (accessed 2026-09-25) [S14], [S15])
- The audit computes selection rates (or scoring rates) by the EEO-1 Component 1 race/ethnicity and sex categories, plus intersectional categories, and compares them to the most-selected category to get **impact ratios**. Enforcement began on **5 July 2023**. Penalties run from $500 to $1,500 per violation; search excerpts give slightly different figures. [SOURCE CLAIM · official · search excerpt] ([S14], [S15])
- **Enforcement critique:** the NY State Comptroller's audit, dated 2 December 2025 and covering July 2023 to June 2025, called DCWP enforcement "ineffective". DCWP agreed to fully adopt 10 of 13 recommendations and one in part. [SOURCE CLAIM · official · search excerpt] ([OSC audit](https://www.osc.ny.gov/state-agencies/audits/2025/12/02/enforcement-local-law-144-automated-employment-decision-tools); [OSC press release](https://www.osc.ny.gov/press/releases/2025/12/dinapoli-new-yorkers-deserve-transparent-hiring-process-when-artificial-intelligence-used-vet-their) (accessed 2026-09-25) [S16], [S17]); commentary: [DLA Piper](https://www.dlapiper.com/en-us/insights/publications/2026/01/critical-audit-of-nyc-ai-hiring-law-signals-increased-risk-for-employers) [S18].
- **Transparency in practice:**
  - The ACLU/NYCLU tracker lists 98 audits. 13 are recorded as later removed from the posting site. The README notes audits "can be very difficult to find, and some employers have posted and later removed this information". [FACT] ([tracker](https://github.com/aclu-national/tracking-ll144-bias-audits), accessed 2026-09-25 [S19])
  - An academic analysis of audits published between July 2023 and November 2024 is linked from the tracker ([ACM FAccT 2025](https://dl.acm.org/doi/10.1145/3715275.3732004) [S20]). Its findings were not read (UNKNOWN).

### 5.4 Illinois
- **Artificial Intelligence Video Interview Act (820 ILCS 42).** The act applies when an employer uses AI to analyse video interviews. The employer must notify the applicant, explain how the AI works and which characteristics it evaluates, and obtain consent. It must limit sharing and delete videos **within 30 days** of a request, including by recipients. Employers that rely *solely* on AI analysis to choose who gets an in-person interview must report race and ethnicity data annually to DCEO. [SOURCE CLAIM · official/independent · search excerpt] ([ILCS text](https://www.ilga.gov/Legislation/ILCS/Articles?ActID=4015&ChapterID=68&Print=True) (accessed 2026-09-25) [S21])
- **HB 3773 / Public Act 103-0804** (amends the Illinois Human Rights Act; effective **1 January 2026**):
  - It is a civil-rights violation to use AI that "has the effect" of discriminating on protected classes across recruitment, hiring, promotion, discharge and related decisions.
  - Using **ZIP codes as a proxy** for protected classes is prohibited.
  - Employers must give **notice** of AI use, with IDHR to set the rules.
  - [SOURCE CLAIM · official/independent · search excerpt] ([ILGA bill status](https://www.ilga.gov/ftp/legislation/103/BillStatus/HTML/10300HB3773.html); [Seyfarth](https://www.seyfarth.com/news-insights/legal-update-new-illinois-ai-law-requires-employee-notice-affirms-existing-employer-nondiscrimination-duties.html) (accessed 2026-09-25) [S22], [S23])
- **IDHR rules status is unsettled.** Draft "Subpart J" notice rules were released (December 2025 commentary). IDHR then **temporarily withdrew** them and cancelled the 10 June 2026 hearing, although the statute remains in effect. [SOURCE CLAIM · independent · search excerpt] ([Seyfarth](https://www.seyfarth.com/news-insights/illinois-department-of-human-rights-temporarily-withdraws-proposed-rules-on-use-of-artificial-intelligence-in-employment.html); [Ogletree](https://ogletree.com/insights-resources/blog-posts/illinois-unveils-draft-notice-rules-on-ai-use-in-employment-ahead-of-discrimination-ban/) (accessed 2026-09-25) [S24], [S26]). One law-firm headline says Illinois "Adopts New AI-in-Employment Regulations" ([Hinshaw](https://www.hinshawlaw.com/en/insights/blogs/employment-law-observer/illinois-adopts-new-ai-in-employment-regulations-what-employers-need-to-know-for-2026) [S25]). **[UNKNOWN]** Current rule status needs checking.

### 5.5 Colorado
- **Timeline:**
  - SB 24-205 (2024) was delayed from 1 February 2026 to 30 June 2026 by SB 25B-004, signed on 28 August 2025.
  - It was then **repealed and replaced by SB 26-189**, signed on **14 May 2026** and effective **1 January 2027**.
  - [SOURCE CLAIM · independent · search excerpt] ([Akin](https://www.akingump.com/en/insights/ai-law-and-regulation-tracker/colorado-postpones-implementation-of-colorado-ai-act-sb-24-205); [Seyfarth](https://www.seyfarth.com/news-insights/colorado-enacts-artificial-intelligence-replacement-law.html); [Baker Botts](https://ourtake.bakerbotts.com/post/102msga/colorado-repeals-and-replaces-ai-act); official bill page [leg.colorado.gov SB26-189](https://leg.colorado.gov/bills/sb26-189), not fetchable (accessed 2026-09-25) [S27]–[S29], [S32])
- **What SB 26-189 changes:**
  - It removes the duty of care, deployer risk-management programmes, impact assessments and certain reporting.
  - It keeps a **pre-use notice**, a **post-adverse-outcome disclosure**, and "a limited set of consumer rights tied to 'covered ADMT'".
  - ADMT is defined as technology that "processes personal data and uses computation to generate output, including predictions, recommendations, classifications, rankings, scores… used to make, guide, or assist a decision".
  - "Consumer" expressly includes employees and Colorado-resident job applicants. Low-stakes routine processes that do not materially influence employment decisions are excluded.
  - [SOURCE CLAIM · independent · search excerpt] ([Ogletree](https://ogletree.com/insights-resources/blog-posts/colorados-new-ai-act-targets-automated-decision-making-for-consequential-decisions/); [Venable](https://www.venable.com/insights/publications/2026/07/colorados-new-ai-law-what-employers-need-to) (accessed 2026-09-25) [S30], [S31])
- **[UNKNOWN]** The exact consumer rights (correction? human review or appeal?) and the split between developer and deployer duties need checking against the enrolled text. One commentary refers to "a White House callout" during the rewrite ([Carpe Datum](https://www.carpedatumlaw.com/2026/05/colorados-ai-reset-two-weeks-a-white-house-callout-and-a-pivot-away-from-the-eu-model/) [S33]). The federal context is UNKNOWN (§5.7).

### 5.6 California
- **Civil Rights Council FEHA regulations on automated-decision systems.** Approved on 27 June 2025 and **effective 1 October 2025**. They make clear that ADS use can violate FEHA. They define "automated-decision system", "agent" and "proxy". They require employment records, including automated-decision data, to be kept **at least four years**. Evidence of anti-bias testing is relevant to defences. They can reach **vendors and agents** acting for employers. [SOURCE CLAIM · official/independent · search excerpt] ([CRD text](https://calcivilrights.ca.gov/wp-content/uploads/sites/32/2025/03/Attachment-B-Final-Unmodified-Text-of-Proposed-Employment-Regulations-Regarding-Automated-Decision-Systems.pdf); [Mayer Brown](https://www.mayerbrown.com/en/insights/publications/2025/08/california-adopts-new-employment-ai-regulations-effective-october-1-2025); [Jackson Lewis](https://www.jacksonlewis.com/insights/californias-new-ai-regulations-take-effect-oct-1-heres-your-compliance-checklist) (accessed 2026-09-25) [S34]–[S36])
- **CPPA regulations on automated decision-making technology (ADMT) under the CCPA.** OAL approved them on 23 September 2025.
  - They cover ADMT that "replace[s] or substantially replace[s] human decision-making" for "significant decisions", which include employment opportunities.
  - Businesses must provide a **pre-use notice**, an **opt-out** (not required if there is an **appeal to a human reviewer with authority to overturn**), access rights and **risk assessments**.
  - ADMT compliance is required by **1 January 2027** according to most summaries. One excerpt says 1 April 2027, so the date needs checking.
  - [SOURCE CLAIM · independent · search excerpt] ([Skadden](https://www.skadden.com/insights/publications/2025/10/california-finalizes-cppa-regulations); [Littler](https://www.littler.com/news-analysis/asap/californias-long-awaited-final-regulations-automated-decisionmaking-create-new); [White & Case](https://www.whitecase.com/insight-alert/cppa-finalizes-rules-admt-risk-assessments-and-cybersecurity-audits-requirements) (accessed 2026-09-25) [S37]–[S39])

### 5.7 US federal
- **[UNKNOWN · reference knowledge, verify]**
  - In January 2025 the EEOC reportedly removed its AI technical-assistance documents (Title VII adverse impact and ADA) after executive-branch changes.
  - A December 2025 presidential executive order reportedly targets "onerous" state AI laws, including through a DOJ litigation task force.
  - Neither could be verified here. Title VII, ADEA and ADA disparate-impact liability itself is statutory and case-law based and continues regardless (see *Mobley*).

### 5.8 Litigation signals
- ***Mobley v. Workday*, N.D. Cal. No. 3:23-cv-00770:**
  - **May 2025:** preliminary certification of a nationwide ADEA collective of applicants aged 40 and over who were denied employment recommendations through Workday's platform since September 2020. The opt-in deadline was **7 March 2026**.
  - **6 March 2026:** the court rejected Workday's argument that ADEA disparate-impact protection excludes applicants.
  - **22 June 2026:** the court granted in part and denied in part the motion to dismiss the Third Amended Complaint. FEHA claims survive on a California nexus, because Workday allegedly designs and operates the screening tools from its California headquarters. One plaintiff's ADA proxy-discrimination claim survives. With the sex claims added, the case spans race, sex, age and disability. A Fourth Amended Complaint was ordered, with Workday's answer due on 15 July 2026.
  - Earlier rulings accepted the theory that an AI screening vendor can be liable as the employer's **agent**.
  - [SOURCE CLAIM · independent · search excerpt] ([CourtListener docket](https://www.courtlistener.com/docket/66831340/mobley-v-workday-inc/) (not fetchable); [Duane Morris](https://blogs.duanemorris.com/classactiondefense/2026/06/24/california-federal-court-grants-in-part-and-denies-in-part-workdays-motion-to-dismiss-in-mobley-v-workday/); [HR Executive](https://hrexecutive.com/judge-refuses-to-dismiss-most-workday-hiring-bias-allegations/); [Fennemore](https://www.fennemorelaw.com/a-new-storm-for-employers-may-be-forming-in-the-california-sunshine-preliminary-certification-of-collective-action-against-human-resource-ai-software-provider/); [RM](https://compare.rm.com/blog/2026/03/mobley-vs-workday-an-update-on-the-case-that-is-challenging-ai-assessment/); [FindLaw 2026](https://caselaw.findlaw.com/court/us-dis-crt-n-d-cal/239454.html) (accessed 2026-09-25) [S40]–[S45])
- Commentary on protecting **bias-testing data** under privilege in light of AI-employment litigation: [Norton Rose Fulbright](https://www.insidetechlaw.com/blog/2026/06/behind-the-privilege-shield-safeguarding-ai-bias-testing-data-in-employment-decisions) [S46] (existence only).
- **[UNKNOWN · reference knowledge, verify]** Other cases reported in 2025–2026 could not be checked: an FCRA-based class action against a talent-intelligence vendor, a 2025 administrative complaint about an AI video-interview platform and accessibility, and a 2025 suit against a large employer over AI screening in its ATS.

### 5.9 Obligations as they would fall on an ATS vendor vs an employer (INFERENCE; not legal advice)

| Regime | ATS vendor / provider (for example, OpenCATS project or a hosted OpenCATS service) | Employer / deployer (OpenCATS user) |
|---|---|---|
| **EU AI Act** (Annex III from 2 December 2027) | If it ships a feature that filters or evaluates candidates, it becomes a **high-risk provider**, with risk management, data governance, logging, human-oversight design, documentation, conformity assessment and registration. The open-source exemption does not cover high-risk (reference knowledge). Assistive drafting features are probably outside Annex III unless they profile or evaluate. | Art. 26 duties: use per the instructions, human oversight, input quality, **log retention at least 6 months**, inform workers and affected persons, and Art. 86 explanations. It **becomes the provider** if it substantially modifies a system or changes its purpose (Art. 25, reference knowledge). Self-hosters who customise scoring are at risk here. |
| **GDPR Art. 22** | Processor duties (DPA, security, sub-processors). The design must make human review possible, and logic must be explainable. | Controller: lawful basis, **no solely-automated significant decisions** without an exception and safeguards, transparency about logic, DPIA. |
| **NYC LL 144** | No direct duty. In practice, customers need the vendor to supply audit data and methodology (vendor-level audits are common, [S19]). | **Annual independent bias audit**, public summary, 10-business-day notice, alternative-process requests. |
| **Illinois** (P.A. 103-0804, AIVIA) | Should not use ZIP or other proxies in models. For video AI: support consent, explanation and deletion flows. | Notice of AI use; liability for discriminatory effect; AIVIA consent, deletion and reporting. |
| **Colorado SB 26-189** (from 1 January 2027) | Developer duties exist but their details are UNKNOWN (§5.5). | Pre-use notice; adverse-outcome disclosure; consumer rights for covered ADMT. |
| **California** | **Agent liability** under the CRD regulations. Vendors administering ADS "on an employer's behalf" can be reached. | FEHA liability; 4-year retention of ADS data; anti-bias testing as a defence; CPPA ADMT notice, opt-out or human appeal, and risk assessment (from 2027). |
| **US disparate impact** (Title VII, ADEA, ADA) | *Mobley* agent theory: vendors can face direct claims. | Classic employer liability; four-fifths rule monitoring. |

---

## 6. Evidence on outcomes

| Evidence | What it shows | Grade and caveats |
|---|---|---|
| **Bloomberg 2024 GPT resume-ranking experiment** ([repo](https://github.com/BloombergGraphics/2024-openai-gpt-hiring-racial-discrimination) and [article](https://www.bloomberg.com/graphics/2024-openai-gpt-hiring-racial-discrimination), accessed 2026-09-25 [S66]) | Design: eight "near-identical" resumes differing only by demographically distinct names, ranked "thousands of times" for four jobs (HR specialist, software engineer, retail, financial analyst), with GPT-3.5-turbo and GPT-4. My recomputation from `data/output/performance_ranking.csv`: for **GPT-3.5-turbo**, at least one of eight race×gender groups had an impact ratio **below 0.8 in all 4 jobs**. The lowest was 0.44 (Black men, financial analyst), and in HR specialist six groups were below 0.8. For **GPT-4**, a group fell below 0.8 in **3 of 4 jobs**; retail had none, and the lowest was 0.70 (Black men, HR specialist). The disadvantaged group **varied by job**. | **FACT** (my computation on published data). These are 2024-era models; current models may differ (**INFERENCE**). It is an audit-style experiment, not a field outcome. |
| **"Silicon Ceiling: Auditing GPT's Race and Gender Biases in Hiring"** (EAAMO 2024; [repo](https://github.com/lenaarmstrong/silicon-ceiling), [DOI](https://dl.acm.org/doi/abs/10.1145/3689904.3694699) [S67]) | Audits GPT-3.5 on resume *assessment* and resume *generation*; data and code are public | FACT that the study and data exist. **Findings UNKNOWN** (the paper was not readable here). |
| **2026 preprints** (arXiv titles seen in search results [S68]): "Algorithmic Monocultures in Hiring"; "From Matching Models to Recruiting Agents: A Systematized Narrative Review of AI Recruitment Systems, Evaluation, and Governance"; "Linguistic Triggers of Gender and Racial Bias in Open-Weight LLMs Applied to Recruitment"; "How Supply Chain Dependencies Complicate Bias Measurement and Accountability Attribution in AI Hiring Applications" | Active research on monoculture effects (the same model screening across many employers), agentic recruiting evaluation, open-weight model bias, and vendor-chain accountability | Titles are FACT (seen in results). **Findings UNKNOWN.** These are preprints, not peer reviewed. |
| **LL 144 transparency** (ACLU tracker [S19]; NY OSC audit [S16]) | Audits are hard to find or get removed (13 of 98 entries), and enforcement was judged ineffective | FACT (tracker) / SOURCE CLAIM · official · search excerpt (OSC) |
| **Candidate attitudes (vendor-reported)** | Lever: "Only 28% of candidates actively use AI for job searching (47% for resume writing, 37% for real-time interview prep)… 63% of candidates accept AI in hiring but don't want it fully automated" ([S60]). BrightHire: "only 8% believe that AI makes hiring fairer" ([S55]). | SOURCE CLAIM · vendor · third-party copy. The underlying surveys and methodology are UNKNOWN. |
| **Application volume and AI mass-apply (vendor-reported)** | Workable: "Around 10% of the job applications… are now submitted via AI mass-apply tools" ([S57]) | SOURCE CLAIM · vendor · third-party copy |
| **Candidate fraud prevalence (vendor citing third parties)** | BrightHire cites "Gartner projecting that 1 in 4 candidate profiles will be fake by 2028" and "one recent survey" in which "41% of IT and security leaders said their company had already hired a fraudulent candidate" ([S55]) | SOURCE CLAIM · vendor · third-party copy. **The Gartner primary source was not verified** (UNKNOWN). |
| **Efficiency claims (vendor case studies)** | Oracle/Eightfold "cutting time-to-hire from 42 days to under a week" ([S54]); Paradox case titles "7-Eleven… 10 days… now it takes 3" and "Chipotle… reduce time to hire by up to 75%" ([S61]); Workable "processed more than 120,000 candidates" ([S57]); Bullhorn: firms using AI are "3.5 to 4.5 times more likely to grow revenue than lose it" ([S65]) | SOURCE CLAIM · vendor. These are uncontrolled case studies; the Bullhorn figure is correlational (**INFERENCE**). |
| **Pew, SHRM, OECD, government and peer-reviewed field studies** of AI hiring effectiveness and perception | Not retrievable this session | **UNKNOWN** (§9) |

**Net assessment [INFERENCE]:**
1. Rigorous, independent **effectiveness** evidence for 2025–2026 AI recruiting tools (quality of hire, validity) was **not found** in reachable sources. Most outcome numbers are vendor case studies.
2. **Bias risk** in LLM-based screening is demonstrated by reproducible audits (Bloomberg data), and the direction is inconsistent across jobs. Per-deployment testing is therefore needed; a one-time vendor audit is not enough.
3. **Candidate trust** appears conditional on human involvement, based on vendor-reported surveys.
4. The **transparency regime** (LL 144) is weak in practice, while **litigation risk** (*Mobley*) is rising.

---

## 7. Implications for OpenCATS 2.0

### 7.1 Baseline (Phase 0) that shapes the AI strategy
- **No AI features exist** (`docs/audit/PRODUCT_GAPS.md` GAP-024). GAP-024 already recommends parsing, summaries, JD drafting, outreach drafting and semantic search "with human-in-the-loop, explainability, audit logging and opt-out". [FACT]
- **The legacy parser is a privacy liability.** Resume text goes via SOAP to `http://soap.resfly.com/parse.php` (`wsdl/parse.wsdl:78`). `config.php:51` sets `PARSING_ENABLED` to `false`, but `LicenseUtility::isParsingEnabled()` returns `true` on every path (`lib/License.php:687-706`). The call uses `SoapClient` (`lib/ParseUtility.php:60`). This is GAP-023, RISK-005 (CRITICAL), SEC-017 and FEAT-012. [FACT, lines re-read on 2026-09-25]
- **Sensitive attributes sit next to resume data.** EEO ethnicity, veteran, disability and gender columns are in the `candidate` table (`db/cats_schema.sql:188-191`). `zip` is stored (`db/cats_schema.sql:172`) and the default careers apply template marks "*Zip/Postal Code" as required (`db/cats_schema.sql:439`). EEO data is ungated in reports and exports (SEC-022). [FACT]
- **Prerequisites are missing:**
  - no audit log (GAP-011)
  - no consent, retention or erasure (GAP-002)
  - no disposition or rejection reasons, which adverse-impact analysis needs (GAP-021)
  - no API or event model (GAP-004)
  - no roles or scoping (GAP-003)
  - search is `LIKE`/`REGEXP` only (GAP-016)
  - [FACT, from Phase 0 docs]
- **Security posture:** 1,302 of 1,705 template echoes are unescaped (SEC-005 via RISK-006). Resumes are attacker-controlled input, and LLM features would add a **prompt-injection** channel on top of XSS (**INFERENCE**).

### 7.2 Design principles (RECOMMENDATION)
1. **Humans decide; no autonomous rejection or advancement.**
   - AI outputs are advisory.
   - Every stage change or disposition needs a human action with a reason code (this depends on GAP-021).
   - No "auto-reject below threshold" setting, not even as an option in core.
   - Rationale: GDPR Art. 22, the CPPA human-appeal route, the *Mobley* agent theory, and vendors' own HITL framing ([S55], [S54]).
2. **Explain every evaluative output at criterion level.** Store the rationale with the output, as the market does (Greenhouse `match_score_reasoning` [S47]; Ashby criteria evaluations [S50]). No single opaque score without criteria.
3. **Keep an AI audit trail (build on GAP-011).**
   - Record who invoked what, on which record, and with which inputs (redacted), model/provider/version, prompt-template version, output, and the subsequent human action.
   - Make it tamper-evident, with retention configurable to at least **6 months** (EU Art. 26) and up to **4 years** (California CRD).
4. **Per-tenant, per-feature, per-job opt-in, off by default,** with an admin kill switch and a "no AI" mode for jurisdictions or customers that require it. (The multi-tenancy model is itself open: see `EXECUTIVE_SUMMARY.md` Q5.)
5. **Candidate transparency and choice.**
   - Careers-site AI notice text plus an alternative-process or opt-out request link per job, following the Greenhouse `ai_disclaimer` / `ai_opt_out_request_url` pattern [S47].
   - A notice-timing helper for the LL 144 10-business-day rule.
   - Consent capture wired into GAP-002.
6. **Data minimisation before inference.**
   - Never send EEO fields (`db/cats_schema.sql:188-191`), photos, age proxies (dates of birth, graduation years), or **ZIP/address** (Illinois proxy ban) to evaluative models. Redact PII not needed for the task.
   - Keep EEO data in a separate, access-controlled store used only for aggregate fairness monitoring. This mirrors the purpose of EU Art. 4a. **[INFERENCE: legal review needed]**
7. **Provider-agnostic model layer (an "AI gateway").**
   - One internal interface for completions, embeddings and extraction, with pluggable providers: hosted APIs *and* self-hosted or local open-weight models.
   - Per-tenant choice of provider and region; contractual zero-retention / no-training settings where available.
   - Timeouts and fallbacks: Ashby's upstream-provider outages [S51] show why.
   - An offline evaluation harness (golden sets, fairness checks) run on every model or prompt change.
8. **No training on customer data by default.** If fine-tuning is offered, make it per-tenant, opt-in and documented. Vendors rarely state their policy (§4.3), so a clear statement is cheap to make.
9. **Fairness measurement as a product feature.**
   - Stage-by-stage selection rates and four-fifths impact ratios by EEO category (using GAP-021 dispositions).
   - Exportable in the LL 144 format for independent auditors.
   - Monitors for drift after model changes. The Bloomberg data shows why: disparities flip by job and model ([S66]).
10. **Treat resumes as untrusted input.** Isolate prompts, forbid tool execution triggered by candidate content, escape all model output (RISK-006), and rate-limit AI endpoints.
11. **Classify features by risk tier and gate the high-risk ones.** Tier A: assistive and drafting. Tier B: evaluative or ranking, meaning EU high-risk or an LL 144 AEDT. Tier B ships only in a separately enabled "compliance-governed" module, with documentation that customers need for their own obligations. That documentation includes instructions for use, logging, human-oversight guidance and bias-test reports.

### 7.3 Table stakes, differentiators and things to avoid

| Category | Capability | Why (evidence) | Tag |
|---|---|---|---|
| **Table stakes** (documented by ≥3 vendors) | Resume parsing and normalisation (self-hostable option) | Ashby, Phenom, Workable, Greenhouse fields; replaces the Resfly liability (GAP-023, RISK-005) | INFERENCE + RECOMMENDATION |
| Table stakes | JD and job-brief drafting | Metaview, Workable, Greenhouse (planned) | INFERENCE |
| Table stakes | Candidate and interview summaries / notetaking (with consent) | Metaview, BrightHire, Ashby, Greenhouse (planned) | INFERENCE |
| Table stakes | Semantic search and talent rediscovery | SeekOut, Workable, Metaview; closes GAP-016 | INFERENCE + RECOMMENDATION |
| Table stakes | Outreach and email drafting (human sends) | Metaview, SeekOut, Workable | INFERENCE |
| Table stakes (2026) | Fraud and identity **signals** for human review | Greenhouse, Ashby, BrightHire, Metaview, SmartRecruiters | INFERENCE |
| Emerging table stakes | Public API plus an **MCP server** with scoped, audited permissions | Greenhouse, Workable, SeekOut, Findem; depends on GAP-004 | INFERENCE + RECOMMENDATION |
| **Differentiators for OpenCATS** | Open-source, self-hostable, **bring-your-own-model** (including local models) with no data leaving the tenant | Few vendors document provider choice; this fits a privacy-sensitive, agency and self-hosting audience | INFERENCE + RECOMMENDATION |
| Differentiator | Transparent-by-design: open prompt templates and rubrics, criterion-level explanations, a candidate-facing notice and opt-out kit | Market is moving to reasoning-attached scores; regulation demands explanations (Art. 86) | RECOMMENDATION |
| Differentiator | "Audit-ready" compliance kit: AI audit log, adverse-impact dashboards, LL 144 export, retention settings | Vendor audits abound but employers carry the duty ([S19], §5.9) | RECOMMENDATION |
| Differentiator | **Agency-specific AI:** submittal write-ups for clients, anonymised candidate profiles for client sharing, job-order intake → structured requirements, duplicate-candidate detection (GAP-017) | OpenCATS's base is agency workflows (EXECUTIVE_SUMMARY Q1) | RECOMMENDATION |
| **Avoid / do not build in core** | Autonomous rejection or auto-advance by score | Legal exposure (§5); contradicts HITL norms | RECOMMENDATION |
| Avoid | Emotion, facial, voice-tone or "personality from video" inference | EU Art. 5 prohibition (workplace); Illinois AIVIA burdens | RECOMMENDATION |
| Avoid / defer to partners | Autonomous AI interviewers and AI-scored video in core; integrate partner tools via API and assessments framework instead | High-risk, heavy provider obligations, fast-moving market (§3) | RECOMMENDATION |
| Avoid | Opaque single "fit score" without criteria; using ZIP, address, names or photos as model features | Illinois ZIP-proxy ban; Bloomberg evidence of name effects | RECOMMENDATION |
| Avoid | Scraped external profile databases in core | Data provenance and GDPR risk (**INFERENCE**; not researched here) | RECOMMENDATION |
| Avoid | Sending candidate data to any AI provider without a DPA, region control and a no-training term; any HTTP (non-TLS) egress | The exact failure mode of the Resfly integration (RISK-005, SEC-017) | RECOMMENDATION |

### 7.4 Suggested sequencing (RECOMMENDATION)
1. **Now (Phase 1 hardening):** disable or remove Resfly egress. Make `isParsingEnabled()` honour config or delete the integration (RISK-005, GAP-023).
2. **Foundation first:** API and events (GAP-004), audit log (GAP-011), RBAC (GAP-003), consent and retention (GAP-002), disposition reasons (GAP-021). Tier-B AI must not ship before these exist.
3. **AI Tier A:** AI gateway plus parsing (self-hosted default), JD and email drafting, summaries, semantic search. Off by default, with audit logging from day one.
4. **AI Tier B (optional module):** criteria-based match explanations, with no auto-decisions, candidate notice and opt-out, fairness dashboards, and customer-facing documentation. Get legal review against the EU Annex III date (2 December 2027), Colorado (1 January 2027), CPPA ADMT (2027) and LL 144.
5. **Ecosystem:** partner integrations for AI interviewers, assessments and identity/fraud verification (GAP-025), plus an MCP server scoped by RBAC.

---

## 8. Facts vs inferences

**Facts (directly read by me):**
- Greenhouse Job Board API documents `include_ai_disclaimer`, `ai_disclaimer` and `ai_opt_out_request_url`. The Harvest changelog entry of 24 September 2025 adds `match_score_reasoning` and `identity_verification` as anonymisable fields. The applications docs say `country_short_name` "enables fraud detection location checks". Source: `grnhse/greenhouse-api-docs` at `271cd88`: `source/includes/job-board/_jobs.md:125-127`, `source/includes/harvest/_introduction.md:179`, `source/includes/harvest/_candidates.md:2300`, `source/includes/job-board/_applications.md:300`.
- ACLU/NYCLU LL 144 tracker (commit `5fca36b`): 98 entries; 13 marked removed from the posting site; 44 with Warden AI as auditor; 13 dated 2026, including Greenhouse Talent Matching (14 August 2026), Ashby AI Interviewer (1 September 2026), Eightfold AI Interviewer (BABL AI, 29 June 2026) and Juicebox Autopilot (February and August 2026).
- Bloomberg published data: impact ratios below 0.8 for at least one group in 4 of 4 jobs (GPT-3.5-turbo) and 3 of 4 jobs (GPT-4), from my computation.
- OpenCATS repo lines cited in §7.1.

**Search-excerpt claims (not fetched; verify):** all regulatory dates and obligations in §5; *Mobley* rulings; Colorado SB 26-189 contents; the NY OSC audit.

**Third-party-copy claims (lead-grade; verify):** vendor capability statements attributed to [S50]–[S65].

**Inferences:** the risk-tier column in §3; cross-vendor patterns in §4.3; the obligation split in §5.9; the net assessment in §6; all of §7.2–7.4 (which are recommendations).

---

## 9. Unknowns (verification queue)

1. **Vendor items not verified this session** (search budget exhausted; vendor hosts blocked): LinkedIn Hiring Assistant (availability, HITL, regions); iCIMS Copilot and agents; SAP Joule recruiting skills; Oracle's own recruiting AI agents; Workday recruiting agents; hireEZ and Juicebox/PeopleGPT capabilities; Gem AI details; HireVue explainability statement and science claims; Paradox "Responsible Security Update" contents.
2. **Ownership:** Workday–Paradox, Workday–HiredScore and Zoom–BrightHire (reference knowledge only).
3. **Training on customer data and model providers:** no vendor policy verified. Employ's "IBM watsonx" statement comes from a third-party paraphrase.
4. **EU:** verbatim Omnibus text for Art. 4, Art. 4a, Art. 50 timing and any change to registration or SME rules; whether "workplace" in Art. 5(1)(f) covers candidates; Commission high-risk guidelines (a page exists at [S1]-adjacent `digital-strategy.ec.europa.eu/en/policies/guidelines-ai-high-risk-systems`, content not read); Art. 2(12) and Art. 25 wording (reference knowledge).
5. **GDPR Art. 22 and CJEU case law; UK ICO recruitment guidance; UK Data (Use and Access) Act 2025 ADM changes:** none verified.
6. **US federal:** EEOC AI guidance status; December 2025 executive order on state AI laws and any action against Colorado or California.
7. **Colorado SB 26-189:** exact consumer rights (correction, appeal, human review), developer duties, AG rulemaking.
8. **Illinois:** whether the IDHR Subpart J rules were re-proposed or adopted after June 2026.
9. **California CPPA:** exact ADMT compliance date (1 January 2027 vs 1 April 2027 in one excerpt) and the employment-specific opt-out exceptions.
10. **Litigation beyond *Mobley*:** FCRA theories against talent-intelligence vendors; AI video-interview accessibility complaints; ATS-screening suits (reference knowledge only).
11. **Independent evidence:** Pew (US adults' views on AI in hiring), SHRM AI-in-HR adoption surveys, the Gartner candidate-fraud prediction (primary), peer-reviewed field experiments on AI interviews and algorithmic screening, the FAccT 2025 LL 144 audit analysis [S20], and the findings of [S67] and [S68].
12. **Scope question for the lead:** whether the API Evangelist GitHub copies (lead-grade) should stay in this document under the addendum's "no mirrors" rule.

---

## 10. Sources (all accessed 2026-09-25)

**Regulators, legislatures, courts** (official; search excerpt unless noted)
- [S1] European Commission, "AI Omnibus enters into force": https://digital-strategy.ec.europa.eu/en/news/ai-omnibus-enters-force (official; excerpt; fetch blocked)
- [S2] Council of the EU press release, 29 June 2026: https://www.consilium.europa.eu/en/press/press-releases/2026/06/29/artificial-intelligence-council-gives-final-green-light-to-simplify-and-streamline-rules/ (official; excerpt; fetch blocked)
- [S3] EUR-Lex, Regulation (EU) 2026/1744: https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng (official; title and date via excerpt; fetch blocked)
- [S4] AI Act Service Desk, Annex III: https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3 ; Employment page: https://ai-act-service-desk.ec.europa.eu/en/employment-0 (official; excerpt)
- [S5] AI Act Service Desk, Article 6: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6 (official; excerpt)
- [S6] AI Act Service Desk, Article 26: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-26 ; plus https://www.euaiact.com/article/26 (independent) (excerpt)
- [S7] AI Act Service Desk, Article 86: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-86 (official; excerpt)
- [S8] AI Act Service Desk, Article 5: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-5 ; Commission guidelines on prohibited practices: https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-prohibited-artificial-intelligence-ai-practices-defined-ai-act (official; excerpt)
- [S12] EDPB-EDPS Joint Opinion 1/2026 on the AI Omnibus proposal: https://www.edpb.europa.eu/system/files/2026-01/edpb_edps_jointopinion_202601_proposal_ai-omnibus_en.pdf (official; existence only)
- [S14] NYC DCWP, AEDT: https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page (official; excerpt)
- [S15] DCWP AEDT FAQ: https://www.nyc.gov/assets/dca/downloads/pdf/about/DCWP-AEDT-FAQ.pdf ; NYC Rules, AEDT (updated): https://rules.cityofnewyork.us/rule/automated-employment-decision-tools-updated/ (official; excerpt)
- [S16] NY State Comptroller audit, "Enforcement of Local Law 144", 2 December 2025: https://www.osc.ny.gov/state-agencies/audits/2025/12/02/enforcement-local-law-144-automated-employment-decision-tools (official; excerpt)
- [S17] NY State Comptroller press release, December 2025: https://www.osc.ny.gov/press/releases/2025/12/dinapoli-new-yorkers-deserve-transparent-hiring-process-when-artificial-intelligence-used-vet-their (official; excerpt)
- [S21] Illinois, 820 ILCS 42 (AI Video Interview Act): https://www.ilga.gov/Legislation/ILCS/Articles?ActID=4015&ChapterID=68&Print=True (official; excerpt)
- [S22] Illinois General Assembly, HB 3773 bill status: https://www.ilga.gov/ftp/legislation/103/BillStatus/HTML/10300HB3773.html (official; excerpt)
- [S27] Colorado General Assembly, SB26-189: https://leg.colorado.gov/bills/sb26-189 (official; fetch blocked; content via independent excerpts)
- [S28] Colorado General Assembly, SB25B-004: https://leg.colorado.gov/bills/sb25b-004 ; Akin tracker: https://www.akingump.com/en/insights/ai-law-and-regulation-tracker/colorado-postpones-implementation-of-colorado-ai-act-sb-24-205 (official / independent; excerpt)
- [S34] California Civil Rights Council, ADS regulations text (Attachment B): https://calcivilrights.ca.gov/wp-content/uploads/sites/32/2025/03/Attachment-B-Final-Unmodified-Text-of-Proposed-Employment-Regulations-Regarding-Automated-Decision-Systems.pdf (official; excerpt)
- [S40] CourtListener, *Mobley v. Workday*, 3:23-cv-00770: https://www.courtlistener.com/docket/66831340/mobley-v-workday-inc/ (court docket aggregator; fetch blocked)

**Independent analysis** (law firms, press; search excerpt)
- [S9] Hunton, "EU Digital Omnibus on AI Enters Into Force": https://www.hunton.com/privacy-and-cybersecurity-law-blog/eu-digital-omnibus-on-ai-enters-into-force
- [S10] Gibson Dunn, "EU AI Act Omnibus Agreement": https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/
- [S11] CypherOn, "What Regulation 2026/1744 changed in the AI Act": https://cypheron.cz/en/resources/ai-act/omnibus-2026 (weaker source)
- [S18] DLA Piper, "Critical audit of NYC's AI hiring law…" (January 2026): https://www.dlapiper.com/en-us/insights/publications/2026/01/critical-audit-of-nyc-ai-hiring-law-signals-increased-risk-for-employers
- [S23] Seyfarth, "New Illinois AI Law Requires Employee Notice…": https://www.seyfarth.com/news-insights/legal-update-new-illinois-ai-law-requires-employee-notice-affirms-existing-employer-nondiscrimination-duties.html
- [S24] Seyfarth, "IDHR Temporarily Withdraws Proposed Rules…": https://www.seyfarth.com/news-insights/illinois-department-of-human-rights-temporarily-withdraws-proposed-rules-on-use-of-artificial-intelligence-in-employment.html
- [S25] Hinshaw, "Illinois Adopts New AI-in-Employment Regulations…": https://www.hinshawlaw.com/en/insights/blogs/employment-law-observer/illinois-adopts-new-ai-in-employment-regulations-what-employers-need-to-know-for-2026
- [S26] Ogletree, "Illinois Unveils Draft Notice Rules…": https://ogletree.com/insights-resources/blog-posts/illinois-unveils-draft-notice-rules-on-ai-use-in-employment-ahead-of-discrimination-ban/
- [S29] Seyfarth, "Colorado Enacts Artificial Intelligence Replacement Law": https://www.seyfarth.com/news-insights/colorado-enacts-artificial-intelligence-replacement-law.html
- [S30] Ogletree, "Colorado's New AI Act Targets Automated Decision-Making…": https://ogletree.com/insights-resources/blog-posts/colorados-new-ai-act-targets-automated-decision-making-for-consequential-decisions/
- [S31] Venable, "Colorado's New AI Law: What Employers Need to Know" (July 2026): https://www.venable.com/insights/publications/2026/07/colorados-new-ai-law-what-employers-need-to
- [S32] Baker Botts, "Colorado Repeals and Replaces AI Act": https://ourtake.bakerbotts.com/post/102msga/colorado-repeals-and-replaces-ai-act (also Hunton on the 2025 delay: https://www.hunton.com/privacy-and-cybersecurity-law-blog/colorado-ai-act-amended-and-effective-date-delayed)
- [S33] Carpe Datum Law, "Colorado's AI Reset…" (May 2026): https://www.carpedatumlaw.com/2026/05/colorados-ai-reset-two-weeks-a-white-house-callout-and-a-pivot-away-from-the-eu-model/
- [S35] Mayer Brown, "California Adopts New Employment AI Regulations Effective October 1, 2025": https://www.mayerbrown.com/en/insights/publications/2025/08/california-adopts-new-employment-ai-regulations-effective-october-1-2025
- [S36] Jackson Lewis, "California's New AI Regulations Take Effect Oct. 1": https://www.jacksonlewis.com/insights/californias-new-ai-regulations-take-effect-oct-1-heres-your-compliance-checklist
- [S37] Skadden, "California Finalizes CPPA Regulations" (October 2025): https://www.skadden.com/insights/publications/2025/10/california-finalizes-cppa-regulations
- [S38] Littler, "California's Long-Awaited Final Regulations on Automated Decisionmaking…": https://www.littler.com/news-analysis/asap/californias-long-awaited-final-regulations-automated-decisionmaking-create-new
- [S39] White & Case, "CPPA finalizes rules on ADMT…": https://www.whitecase.com/insight-alert/cppa-finalizes-rules-admt-risk-assessments-and-cybersecurity-audits-requirements
- [S41] Duane Morris Class Action Defense Blog, 24 June 2026: https://blogs.duanemorris.com/classactiondefense/2026/06/24/california-federal-court-grants-in-part-and-denies-in-part-workdays-motion-to-dismiss-in-mobley-v-workday/
- [S42] HR Executive, "Judge refuses to dismiss most Workday hiring bias allegations": https://hrexecutive.com/judge-refuses-to-dismiss-most-workday-hiring-bias-allegations/
- [S43] Fennemore, on the 2025 preliminary collective certification: https://www.fennemorelaw.com/a-new-storm-for-employers-may-be-forming-in-the-california-sunshine-preliminary-certification-of-collective-action-against-human-resource-ai-software-provider/
- [S44] RM Compare blog (March 2026), *Mobley* update: https://compare.rm.com/blog/2026/03/mobley-vs-workday-an-update-on-the-case-that-is-challenging-ai-assessment/
- [S45] FindLaw, *Mobley v. Workday* (2026): https://caselaw.findlaw.com/court/us-dis-crt-n-d-cal/239454.html
- [S46] Norton Rose Fulbright (Inside Tech Law), June 2026, bias-testing privilege: https://www.insidetechlaw.com/blog/2026/06/behind-the-privilege-shield-safeguarding-ai-bias-testing-data-in-employment-decisions

**First-hand GitHub sources** (FACT)
- [S19] ACLU / NYCLU, "Tracking Automated Employment Decision Tool Bias Audits", https://github.com/aclu-national/tracking-ll144-bias-audits (commit 5fca36b, 2026-09-23)
- [S20] ACM FAccT 2025 paper linked from [S19]: https://dl.acm.org/doi/10.1145/3715275.3732004 (existence only)
- [S47] Greenhouse Software, official API docs, https://github.com/grnhse/greenhouse-api-docs (commit 271cd88, 2026-09-10)
- [S66] Bloomberg Graphics, https://github.com/BloombergGraphics/2024-openai-gpt-hiring-racial-discrimination ; article: https://www.bloomberg.com/graphics/2024-openai-gpt-hiring-racial-discrimination (article not fetched)
- [S67] Armstrong et al., "Silicon Ceiling" (EAAMO 2024), https://github.com/lenaarmstrong/silicon-ceiling ; https://dl.acm.org/doi/abs/10.1145/3689904.3694699

**Third-party GitHub catalog copies (API Evangelist): lead-grade; the original vendor URLs are given; the vendor pages were not fetched**
- [S48] Greenhouse MCP endpoint record (`mcp/greenhouse-mcp.yml`, probed 2026-09-11; endpoint https://mcp.greenhouse.io/mcp): https://github.com/api-evangelist/greenhouse
- [S49] Greenhouse catalog profile (Ezra AI Labs, Real Talent): https://github.com/api-evangelist/greenhouse-io
- [S50] Ashby developer docs index (vendor `llms.txt`, https://developers.ashbyhq.com/llms.txt), copy in https://github.com/api-evangelist/ashby (commit fe0d709). Endpoints cited: `application.listCriteriaEvaluations`, `candidate.listFraudChecks`, `candidate.setFraudStatus`, `notetakerTranscript.info`, `auditLog.list`
- [S51] Ashby status incidents: https://status.ashbyhq.com/incidents/y1mjwlfbwzjz (24 March 2026), https://status.ashbyhq.com/incidents/cmqhn7vxbn8d (1 June 2026), https://status.ashbyhq.com/incidents/4q6x5h4t9jz8 (8 July 2026), via https://github.com/api-evangelist/ashby
- [S52] Metaview vendor `llms.txt` (https://www.metaview.ai), copy in https://github.com/api-evangelist/metaview
- [S53] SeekOut vendor `llms.txt` (https://www.seekout.com), copy in https://github.com/api-evangelist/seekout
- [S54] Eightfold AI blog (RSS excerpts), for example https://eightfold.ai/blog/oracle-eightfold-enterprise-hiring-agent/ (7 May 2026), https://eightfold.ai/blog/hiring-delays-business-risk-oracle-ai-interviewer/ (27 July 2026), https://eightfold.ai/blog/meet-candidate-agent/ (15 July 2026), https://eightfold.ai/blog/meet-360-interview-ai-agent/ (12 August 2026), https://eightfold.ai/blog/responsible-ai-what-fair-looks-like/ (20 May 2026), https://eightfold.ai/blog/responsible-ai-data-underneath-decision/ (6 May 2026); copy in https://github.com/api-evangelist/eightfold-ai
- [S55] BrightHire blog (RSS excerpts), for example https://brighthire.com/blog/ai-interview-compliance/ (29 July 2026), https://brighthire.com/blog/candidate-fraud-detection-now-available-in-brighthire-interviews/ (24 August 2026), https://brighthire.com/blog/5-ways-hiring-teams-can-defend-against-candidate-fraud/ (8 July 2026), https://brighthire.com/blog/how-ta-and-security-teams-can-defend-against-candidate-fraud/ (11 September 2026), https://brighthire.com/blog/ai-interview-candidate-experience/ (24 July 2026), https://brighthire.com/blog/ai-interviews-part-of-recruitment-software/ (26 May 2026), https://brighthire.com/blog/shine-2026-zooms-ceos-3-rules-for-hiring-in-the-ai-era/ (29 May 2026), https://brighthire.com/blog/interview-notes-for-zoom/ (6 August 2026); copy in https://github.com/api-evangelist/brighthire
- [S56] HireVue blog, for example https://www.hirevue.com/blog/hiring/speed-without-science-is-a-liability-trusted-ai-isnt-optional-anymore (17 June 2026) and https://www.hirevue.com/blog/hiring/inside-ai-interviewer-how-hirevue-is-redefining-hiring-in-the-age-of-ai (catalog-generated summaries of vendor posts); copy in https://github.com/api-evangelist/hirevue
- [S57] Workable Resources (RSS excerpts), for example https://resources.workable.com/inside-hr/stories-and-insights/ai-mass-apply-tools-hiring-signal-vs-noise/ (5 January 2026), https://resources.workable.com/inside-hr/workable-ai-features-the-complete-guide-for-recruiters/ (25 August 2026), https://resources.workable.com/inside-hr/candidate-sourcing-automation-hiring-speed (31 August 2026), https://resources.workable.com/inside-hr/how-workables-mcp-server-grew-to-94-tools-and-why-that-matters-for-recruiting-and-hr-teams/ (25 August 2026), https://resources.workable.com/inside-hr/hiring-with-workable/how-a-30-person-cdn-company-built-a-smarter-faster-hiring-process-with-ai/ (19 August 2026), https://resources.workable.com/backstage-at-workable/see-where-every-ai-credit-goes-from-purchase-to-consumption/ (10 September 2026), https://resources.workable.com/inside-hr/stories-and-insights/ai-human-recruiting-future-michael-brown-interview/ (17 November 2025); copy in https://github.com/api-evangelist/workable
- [S58] SmartRecruiters news: https://www.smartrecruiters.com/news/sap-to-acquire-smartrecruiters/ (1 August 2025), https://www.smartrecruiters.com/news/sap-completes-acquisition-of-smartrecruiters/ (11 September 2025), GlobeNewswire 7 April 2026: https://www.globenewswire.com/news-release/2026/04/07/3269187/0/en/SmartRecruiters-Introduces-the-Future-of-Hiring-From-AI-Agents-to-Autonomous-Talent-Acquisition.html ; copy in https://github.com/api-evangelist/smartrecruiters
- [S59] Employ Inc.: https://www.employinc.com/ai-interview-companion/ (14 January 2026), https://www.employinc.com/responsible-ai/ (paraphrased by the catalog), https://www.employinc.com/legal/ ; catalog in https://github.com/api-evangelist/employ-inc
- [S60] Lever blog, https://www.lever.co/blog/balancing-ai-and-authenticity-keeping-hiring-human-as-ai-reshapes-both-sides-of-the-interview-table (15 June 2026; catalog summary); copy in https://github.com/api-evangelist/lever-co
- [S61] Paradox blog (titles), for example https://www.paradox.ai/blog/responsible-security-update , https://www.paradox.ai/blog/it-used-to-take-7-eleven-10-days-to-hire-an-employee-now-it-takes-3-heres-how , https://www.paradox.ai/blog/chipotles-fresh-new-way-to-reduce-time-to-hire-by-up-to-75 ; copy in https://github.com/api-evangelist/paradox-ai
- [S62] Workday blog: https://blog.workday.com/en-us/workday-agentic-era-paths-build.html , https://blog.workday.com/en-us/introducing-workday-build-developer-platform-build-future-work-ai.html (catalog summaries); copy in https://github.com/api-evangelist/workday
- [S63] iCIMS blog, "Illinois and California AI hiring laws: How iCIMS supports compliance" (20 February 2026): https://www.icims.com/blog/illinois-and-california-ai-hiring-laws-how-icims-supports-compliance/ (title only); copy in https://github.com/api-evangelist/icims
- [S64] API Evangelist catalog descriptions: Gem https://github.com/api-evangelist/gem-com ; ModernLoop https://github.com/api-evangelist/modernloop ; Findem https://github.com/api-evangelist/findem ; Phenom https://github.com/api-evangelist/phenom ; Beamery https://github.com/api-evangelist/beamery ; HireVue https://github.com/api-evangelist/hirevue ; Paradox https://github.com/api-evangelist/paradox-ai
- [S65] Bullhorn blog (GRID 2026 claim), https://s40198.pcdn.co/blog/ai-recruiting-software-vs-generic-llms/ as listed; copy in https://github.com/api-evangelist/bullhorn

**Search-result titles only**
- [S68] arXiv preprints (titles seen in results; not fetched): https://arxiv.org/pdf/2609.04286 , https://arxiv.org/pdf/2605.27371 , https://arxiv.org/pdf/2609.18106 , https://arxiv.org/pdf/2604.22679

**Internal**
- [S69] OpenCATS Phase 0 audit: `docs/audit/PRODUCT_GAPS.md`, `RISKS.md`, `SECURITY_AUDIT.md`, `FEATURE_INVENTORY.md`, `EXECUTIVE_SUMMARY.md`; repo files cited with file:line in §7.1.
- Parallel Phase 2 research notes (session scratchpad, not committed): Greenhouse 2026 AI announcements, the CLEAR partnership, Ezra AI Labs dates, SmartRecruiters Winston details, the SAP roadmap. **Re-verify before use.**
