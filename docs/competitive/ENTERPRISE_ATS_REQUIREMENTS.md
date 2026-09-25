# Enterprise ATS Requirements (2026): what enterprise buyers require, with evidence

**Phase 2: Competitive Market Research.** Date: 2026-09-25. Companion documents: `PRICING_AND_PACKAGING.md` (tier gating), `AI_RECRUITING_LANDSCAPE.md` (AI regulation and features, in detail), `MODERN_ATS_UX_PATTERNS.md`. Baseline: Phase 0 audit in `docs/audit/`.

> **Not legal advice.** This document summarises regulations to derive *product* requirements. Where it describes a law, it cites the primary source (the regulation text or the regulator's page). Several of those sources could **not** be fetched in this session (see §2.4), so those statements are marked **[UNVERIFIED]**. Counsel must confirm applicability, current status and dates before anyone relies on them.

---

## 1. Scope

This document sets out, with evidence, what enterprise buyers (roughly 1,000+ employees, regulated industries, multinationals and public sector) require from an Applicant Tracking System in 2026. It covers seven areas:

1. **Identity and access:** SSO (SAML 2.0/OIDC), SCIM, MFA, session policies, RBAC granularity, approval chains and delegated administration.
2. **Security and compliance attestations:** SOC 2, the ISO 27000 family, penetration testing and bug bounties, encryption, data residency, subprocessors and DPAs, FedRAMP, and trust centers.
3. **Privacy and regulation:** GDPR/UK GDPR, CCPA/CPRA, US EEO/OFCCP, VEVRAA/Section 503, record retention, pay transparency and accessibility. AI regulation is referenced only.
4. **Audit and governance:** audit logs, export, sandboxes and change management.
5. **Integration and extensibility:** API, webhooks, HRIS, job boards, the partner ecosystem, calendar/email and BI.
6. **Scale and operations:** multi-entity setups, languages, currencies, high volume, SLAs, support and implementation.
7. **Procurement signals:** security questionnaires, VPAT/ACR, DPAs and SLAs.

Vendors examined: Greenhouse, Lever, Ashby, SmartRecruiters, Workable, iCIMS, Workday Recruiting, SAP SuccessFactors Recruiting and Oracle Recruiting. Some public-sector-relevant vendors appear only through FedRAMP data. **Vendors are not ranked** (PREAMBLE, "NO RANKING").

**Out of scope:** detailed AI capabilities and AI law (see `AI_RECRUITING_LANDSCAPE.md`), pricing figures (see `PRICING_AND_PACKAGING.md`) and UX patterns.

---

## 2. Method

### 2.1 Approach
1. **OpenCATS baseline.** I read the Phase 0 audit documents: `EXECUTIVE_SUMMARY.md`, `PRODUCT_GAPS.md`, `SECURITY_AUDIT.md`, `DATABASE_AUDIT.md` §§8–9 and 12–13 (privacy, history, tenancy, retention), `API_AUDIT.md` §§4–5 and 7, and the ID tables in `FEATURE_INVENTORY.md`, `UX_UI_AUDIT.md` and `RISKS.md`. I also spot-checked the repo itself (`Security.MD`, `db/cats_schema.sql`).
2. **Market evidence, first-hand.** I read these official GitHub repositories directly (shallow clones into the scratchpad):
   - Greenhouse developer docs (`grnhse/greenhouse-api-docs`)
   - Lever Postings API and integrator resources (`lever/postings-api`, `lever/integrator-resources`)
   - FedRAMP Marketplace data (`FedRAMP/marketplace-fedramp-gov-data`, updated 2026-09-25)
   - W3C WCAG source (`w3c/wcag`)
   - NIST SP 800-63-4 (`usnistgov/800-63-4`)
   - GSA Section508.gov content (`GSA/Section508.gov`)
   - OWASP ASVS 5.0 (`OWASP/ASVS`)

   I also fetched four Oracle pages and Oracle's hosting-policy PDF directly from `www.oracle.com`, which was reachable.
3. **Market evidence from search excerpts.** I used two WebSearch results of my own and the vendor-domain excerpts that the sibling `PRICING_AND_PACKAGING.md` had already recorded. Anything reused from that document is attributed to it.
4. **Third-party aggregators.** These were used only as leads, and every use is labelled:
   - API Evangelist provider repos: automated keyword probes of vendor trust pages, security.txt and rate limits.
   - The `jentic/jentic-public-apis` mirror of vendor OpenAPI specs.
5. **Law and standards.** Primary-source links are given throughout. Only NIST, W3C, GSA Section 508 and OWASP ASVS text was actually read; the rest is marked [UNVERIFIED].

### 2.2 Evidence grades (PREAMBLE + lead ADDENDUM)
| Tag | Meaning here |
|---|---|
| **[FACT]** | Read directly: this repo (`path:line`), an official GitHub-hosted repo (commit given in Sources), or a page fetched from an allowed official domain (www.oracle.com). |
| **[SOURCE CLAIM · vendor · search excerpt]** | Text from an official vendor domain, seen only as a WebSearch result excerpt, either by me or as recorded in `PRICING_AND_PACKAGING.md`. The page was **not** fetched. |
| **[SOURCE CLAIM · independent · search excerpt]** | The same, for independent or third-party sites. Used as leads only. |
| **[SOURCE CLAIM · aggregator]** | A third-party machine-generated artefact (API Evangelist probe, jentic spec mirror). Low reliability: one such probe is **contradicted** by FedRAMP data (§5.2). |
| **[UNVERIFIED]** | A sub-type of **[UNKNOWN]**: the analyst's background knowledge (training data to mid-2026), which could **not** be re-verified this session because the source was unreachable. A primary-source link is provided so it can be verified. **Do not rely on these statements before verification.** |
| **[INFERENCE]** / **[RECOMMENDATION]** / **[UNKNOWN]** | As defined in the PREAMBLE. |

### 2.3 Classification and severity scales
- **TABLE STAKE:** expected by essentially every mid-market or enterprise buyer. If it is missing, the product is typically disqualified at shortlist or first security review.
- **ENTERPRISE REQUIREMENT:** required by large or regulated buyers, and commonly placed in vendors' top tiers or enterprise contracts.
- **DIFFERENTIATOR:** documented by few vendors; it can win deals but is rarely a hard gate.
- **OPTIONAL:** relevant only to a segment, such as US federal buyers or healthcare.
- **Gap severity** uses the `PRODUCT_GAPS.md` definitions:
  - CRITICAL: blocks any enterprise sale or creates legal exposure.
  - HIGH: table stakes whose absence loses most evaluations.
  - MEDIUM: expected by the mid-market, but a workaround exists.
  - LOW: a differentiator.
  - "n/a (OSS)" marks attestations that attach to a *hosting operator*, not to downloadable software.

### 2.4 Verification status and environment limitations (material)
- **[FACT]** The environment's egress proxy blocked direct fetching of almost every vendor, regulator and standards domain tried. Blocked: ecfr.gov, eur-lex.europa.eu, law.cornell.edu, federalregister.gov, w3.org, gdpr-info.eu, greenhouse.com, support.greenhouse.io, developers.greenhouse.io and docs.ashbyhq.com. The Oracle accessibility page returned proxy 403. Reachable: github.com and www.oracle.com (via curl).
- **[FACT]** The session's shared WebSearch budget (200 calls) was exhausted after only two of this agent's queries. No regulator page could therefore be checked, even by search excerpt.
- **[INFERENCE]** Consequences:
  - Every **legal** statement in this document is [UNVERIFIED].
  - Most vendor identity, permission and attestation claims rest on:
    - first-hand official API docs (Greenhouse, Lever), which are strong;
    - FedRAMP Marketplace data, which is strong;
    - Oracle pages, which are strong;
    - vendor search excerpts, which are medium;
    - aggregator probes, which are weak.
- **Verification status:** anything tagged search excerpt, aggregator or [UNVERIFIED] needs browser verification before it is used in external material, sales collateral or legal decisions. §9 lists what to verify first.

---

## 3. Executive summary

1. **[INFERENCE]** Enterprise ATS buying in 2026 is gated first by **identity, access control, privacy tooling and auditability**, and only then by recruiting features. Every vendor whose official docs could be read first-hand exposes the following:
   - fine-grained permissions (per-job roles, office/department-scoped "future job permissions", confidential jobs, per-endpoint API key permissions);
   - approval chains;
   - an audit API;
   - GDPR consent and anonymisation primitives.

   Evidence: Greenhouse and Lever docs [FACT]; SmartRecruiters' mirrored spec [SOURCE CLAIM · aggregator].

   OpenCATS has none of these (`PRODUCT_GAPS.md` GAP-001/002/003/011).
2. **[FACT]** Greenhouse's official docs show an **Audit Log API with a 30-day window**. It records data create/update/destroy, Harvest API access, generic actions and, notably, **MCP (AI-agent) access and tool calls**, and it is enabled via account management. The SmartRecruiters audit API spec (third-party mirror) lists **76 event types**, including *candidate profile opened*, *search*, *report downloaded* and *EEO filled*, with retention of "at least 26 months" [SOURCE CLAIM · aggregator]. Auditing of *reads* of sensitive records, and of AI-agent access, is therefore part of the market bar.
3. **[FACT]** Greenhouse's job-board API carries **GDPR consent flags per purpose**: processing, retention and demographic data, plus a configured **retention period in days**. It also carries structured **`pay_input_ranges` with currency** for pay transparency. Its **anonymize endpoint** covers 40+ field groups, including attachments, scorecards, offers, e-mails, activity and identity verification. Lever's Postings API carries `consent.store` / `consent.marketing` with a `compliancePolicyId`, plus a structured `salaryRange` [FACT].
4. **[FACT]** US public-sector demand is served by **FedRAMP-authorised** HCM/recruiting offerings:
   - Workday Government Cloud (Moderate, 2022-07-11, includes Recruiting)
   - Oracle Fusion Cloud (Moderate, 2020-01-13, includes recruiting)
   - SAP NS2 Cloud Intelligent Enterprise (Moderate, JAB 2017-11-13, includes SuccessFactors Recruiting)
   - Avature, Eightfold, HireVue, NEOGOV, Yello and Monster MHME

   **None of Greenhouse, Lever, Ashby, SmartRecruiters, Workable or iCIMS is listed** in the Marketplace data (2026-09-25). FedRAMP is therefore a segment gate (OPTIONAL), not a general table stake.
5. **[SOURCE CLAIM · vendor · search excerpt]** SSO is **contested as a paid gate**:
   - Greenhouse documents SAML 2.0 SSO on its new Core/Plus/Pro tiers, and SCIM on "Advanced and Expert" tiers.
   - Ashby offers SSO on all plans, SCIM on Plus and above, and custom roles only on paid tiers (0 / 3 / unlimited).

   The most consistent tier gates are **SCIM, custom roles, audit log, sandbox and API depth** (see also `PRICING_AND_PACKAGING.md` §6.3).
6. **[FACT]** NIST SP 800-63B-4 (final) requires AAL2 verifiers to **offer a phishing-resistant authenticator option**. It recommends reauthentication within 24 h and an inactivity timeout of 1 h or less at AAL2 (12 h and 15 min at AAL3). OWASP ASVS 5.0 (May 2025) requires **function-, data- and field-level** authorisation (8.2.1–8.2.3). Both give defensible "why" sources for the RBAC and session requirements.
7. **[FACT]** Oracle's contractual Cloud Hosting and Delivery Policies (v3.12, May 2026) state:
   - a **99.9% target service uptime**;
   - security logs retained online for **at least 1 year**;
   - backups retained for **at least 60 days**;
   - SOC 1 and/or SOC 2 reports provided under NDA;
   - regular penetration testing.

   This is the only uptime figure verified first-hand. For all other vendors it is [UNKNOWN].
8. **[FACT]** WCAG 2.2 adds 9 success criteria over 2.1. They include *Accessible Authentication (Minimum)*, which is relevant to login/MFA design. The W3C encourages using 2.2 for new policies. GSA's Section508.gov asks vendors selling to the federal government to publish an **Accessibility Conformance Report (ACR)**, for example one built from a VPAT, and notes that Section 508 is harmonised with WCAG 2.0.
9. **[UNVERIFIED]** The **regulatory baseline is moving**:
   - The EU Pay Transparency Directive's transposition deadline (7 June 2026) has passed; per-member-state status is [UNKNOWN].
   - EO 11246 was revoked in January 2025. OFCCP's EO 11246 recordkeeping rules (41 CFR 60-1) are therefore in flux, while Section 503 and VEVRAA obligations remain.
   - California's CPPA automated-decision-making rules and the EU AI Act high-risk timeline (see the AI landscape document) are also changing.

   **[INFERENCE]** Compliance features should therefore be **configurable policy** (jurisdiction packs), not hard-coded rules.
10. **[RECOMMENDATION]** OpenCATS 2.0 needs an explicit **"enterprise-evaluable" bar**: SSO+MFA, a scoped RBAC with field masks, an append-only audit log, privacy lifecycle tooling, an EEO/OFCCP module, structured pay ranges, WCAG 2.2 AA plus an ACR, a versioned API with signed webhooks, and a security evidence pack. This must be in place **before** feature parity work. Any hosted offering additionally needs SOC 2 Type II, a DPA and EU/US regions (§6).

---
## 4. Requirements matrix

Source numbers such as `[6]` link to §10. "GH" = Greenhouse, "LV" = Lever, "SR" = SmartRecruiters, "WD" = Workday, "SF" = SAP SuccessFactors, "OR" = Oracle. Grades: F = [FACT], VX = [SOURCE CLAIM · vendor · search excerpt], IX = independent excerpt, AG = aggregator, UV = [UNVERIFIED], U = [UNKNOWN]. Phase 0 IDs refer to documents in `docs/audit/`.

### 4.1 Identity & access

| ID | Requirement | Category | Why enterprises require it (source) | Market evidence (grade) | Classification | OpenCATS today (Phase 0) | Gap severity |
|---|---|---|---|---|---|---|---|
| ER-01 | SAML 2.0 SSO (SP- and IdP-initiated; any SAML IdP) | Identity | Central joiner/leaver control; password elimination. Federation is covered in NIST SP 800-63-4 (the 63C volume, [[25]][s25], F). Standard: OASIS SAML 2.0 [[73]][s73] (UV) | GH: SAML 2.0 on Core/Plus/Pro; Okta, OneLogin, Google, Entra preconfigured [[29]][s29] (VX). IdP-side guides exist (JumpCloud, Ping) [[32]][s32][[33]][s33] (IX). Ashby: SSO on all plans incl. Foundations [[37]][s37] (VX). SR: "SSO via SAP IAS" on the 2026 roadmap [[43]][s43] (VX, sibling notes). LV, WD, SF, OR, iCIMS, Workable: U this session | TABLE STAKE | None. Local MD5 or LDAP only (GAP-001; SEC-001, SEC-006; API-016) | CRITICAL |
| ER-02 | OIDC SSO (Google Workspace, Microsoft Entra ID) | Identity | Same as ER-01. Many mid-market IdPs default to OIDC [[73]][s73] (UV) | GH lists Google and Entra as preconfigured IdPs (protocol not stated) [[29]][s29] (VX). Others U | TABLE STAKE | None (GAP-001, API-016) | CRITICAL |
| ER-03 | SCIM 2.0 provisioning and deprovisioning (users; groups → roles) | Identity | Automated deprovisioning closes orphan-account risk; a staple of security questionnaires. SCIM = RFC 7643/7644 [[72]][s72] (UV) | GH: SCIM "available for Advanced and Expert subscription tiers" (Okta, Entra guides) [[30]][s30][[31]][s31] (VX). Independent claim that GH SCIM provisions users, not groups [[34]][s34] (IX). Ashby: SCIM on Plus/Legacy Plus/Enterprise, not Foundations [[37]][s37] (VX). GH Harvest also lets integrations create, disable and enable users [[8]][s8] (F) | ENTERPRISE REQUIREMENT (tier-gated) | None. LDAP auto-creates *disabled* users only (`API_AUDIT.md` §5.2; GAP-001) | HIGH |
| ER-04 | MFA for non-SSO accounts, incl. a phishing-resistant option (WebAuthn/passkeys); enforceable by admins | Identity | NIST 800-63B-4: AAL2 verifiers "SHALL offer at least one phishing-resistant authentication option" [[25]][s25] (F). CISA Secure-by-Design pledge goal on MFA [[74]][s74] (UV) | Vendors mostly delegate MFA to the IdP via SSO. Native-MFA details per vendor: U | TABLE STAKE | None; no lockout (GAP-001; SEC-014) | CRITICAL |
| ER-05 | SSO enforcement (disable passwords), break-glass admin, just-in-time provisioning | Identity | Prevents bypass of IdP policies [INFERENCE] | U for all vendors this session | ENTERPRISE REQUIREMENT | N/A (no SSO) | HIGH |
| ER-06 | Session policy: admin-configurable idle and absolute timeouts; session revocation; session-ID rotation | Identity | NIST 800-63B-4 AAL2: reauthenticate ≤24 h, inactivity ≤1 h (SHOULD); AAL3: ≤12 h and ≤15 min [[25]][s25] (F). ASVS 5.0 V7 [[28]][s28] (F, chapter exists) | GH Pro tier: "configurable session timeouts" per independent pricing guides [[35]][s35] (IX). Others U | ENTERPRISE REQUIREMENT | No idle timeout; no `session_regenerate_id`; fixation risk (SEC-007, SEC-021) | HIGH |
| ER-07 | Credential hygiene: modern password hashing, tokenised reset, throttling/lockout, no default credentials | Security | ASVS 5.0 V6 Authentication [[28]][s28] (F). CISA pledge on default passwords [[74]][s74] (UV) | Assumed by all vendors; not documented in the sources read (U) | TABLE STAKE | Unsalted MD5, crashing reset, `admin`/`admin` default (SEC-001/002/003; DB-009; RISK-003) | CRITICAL |
| ER-08 | Predefined roles for hiring personas: admin, recruiter, coordinator, hiring manager, interviewer, external/agency | Access | ASVS 8.2.1 function-level access "restricted to consumers with explicit permissions" [[28]][s28] (F) | GH: user role types `interviewer` and `job_admin` (named roles such as "Standard"); `site_admin` flag = "full permissions on all non-private jobs" [[8]][s8] (F). SR: `/system-roles` [[40]][s40] (AG). Ashby: "external recruiter" role [[38]][s38] (VX) | TABLE STAKE | One global level per user, READ…ROOT (GAP-003; FEAT-006; `constants.php:74-82`) | CRITICAL |
| ER-09 | Custom roles and granular permission sets | Access | Segregation of duties; least privilege (ASVS 8.2) [[28]][s28] (F) | Ashby: 0 custom roles on Foundations, up to 3 on Plus, unlimited on Enterprise [[38]][s38] (VX). GH: granular developer permission "Can manage ALL organization's API Credentials" [[6]][s6] (F) | ENTERPRISE REQUIREMENT (tier-gated) | None (GAP-003) | HIGH |
| ER-10 | Record-level scoping: per-job hiring team, department/office rules, confidential/private jobs, agency sees only own submissions | Access | ASVS 8.2.2 "data-specific access … to mitigate IDOR/BOLA" [[28]][s28] (F). Confidential executive searches [INFERENCE] | GH: **job permissions** (a role per user per job) and **future job permissions** auto-granted by office/department; `confidential` flag on jobs; site admins see only "non-private" jobs [[8]][s8][[11]][s11] (F). SR: access groups [[40]][s40] (AG). SF: API authorisation governed by role-based permissions (RBP) [[42]][s42] (AG) | ENTERPRISE REQUIREMENT | None. Several modules lack even the global check (GAP-003; SEC-026; SEC-008 attachment IDOR; FEAT-004 private events leak) | CRITICAL |
| ER-11 | Field-level permissions: EEO/demographics, compensation/offer terms, private notes | Access / Privacy | ASVS 8.2.3 field-level access ("BOPLA") [[28]][s28] (F). GDPR Art. 9 special-category data [[54]][s54] (UV) | GH: EEOC and demographic data live in separate objects and endpoints, and API keys are permissioned per endpoint [[6]][s6][[9]][s9] (F). UI-level field permissions: U | ENTERPRISE REQUIREMENT | A single `can_see_eeo_info` flag, not enforced in reports or export (SEC-022; DB-011) | HIGH |
| ER-12 | Approval chains: job/requisition open, offer; sequential groups, quorum, delegation, audit | Governance | Headcount and compensation control (`PRODUCT_GAPS.md` GAP-008/009 rationale) | GH: approval flows `open_job`, `offer_job`, `offer_candidate`; `sequential`; approver groups with `approvals_required` and `priority`; versioned [[7]][s7] (F). SR audit events for job/offer approval steps and **approval delegation** [[40]][s40] (AG). Recruitee: approvals only on top tier [[36]][s36] (VX) | ENTERPRISE REQUIREMENT | None (GAP-008, GAP-009) | HIGH |
| ER-13 | Delegated/scoped administration; no privilege escalation beyond one's own rights | Access | ASVS 8.3 (server-side enforcement) [[28]][s28] (F) | GH granular admin permissions (see ER-09) (F). Scoped sub-admins per business unit: U | ENTERPRISE REQUIREMENT | A Standard Admin can create ROOT users (SEC-013) | HIGH |
| ER-14 | Scoped machine credentials: per-endpoint/scope API keys, OAuth apps, on-behalf-of attribution | Access / Integration | Least privilege for integrations; attribution in audit | GH: per-endpoint key permissions, but "Access to data in Harvest is binary: everything or nothing" per endpoint; `On-Behalf-Of` user header [[6]][s6] (F). LV: OAuth Data API with scopes and sandbox [[18]][s18] (F). SR: API key and OAuth scopes (e.g., `approvals_decide`, audit events) [[40]][s40] (AG) | TABLE STAKE (for API buyers) | No API or tokens (API-001, API-016) | HIGH |

### 4.2 Security & compliance attestations

| ID | Requirement | Category | Why enterprises require it (source) | Market evidence (grade) | Classification | OpenCATS today (Phase 0) | Gap severity |
|---|---|---|---|---|---|---|---|
| ER-15 | SOC 2 Type II report (shared under NDA) | Attestation | Vendor-risk programmes ask for SOC 2 as the default evidence. AICPA programme (described on [[20]][s20], F) | OR: SOC 1 and/or SOC 2 reports provided as Confidential Information [[21]][s21] (F). GH, iCIMS, SR, Workable, Ashby, LV, WD pages mention "SOC 2" per automated probes [[42]][s42] (AG) | TABLE STAKE (hosted SaaS) | n/a (OSS). No hosted offering exists | n/a (OSS); CRITICAL for any hosted offer |
| ER-16 | ISO/IEC 27001:2022, plus 27701 (privacy), 27017/27018 (cloud/PII) | Attestation | EU and global buyers favour ISO certificates; 27701 maps to GDPR accountability [[75]][s75] (UV) | OR compliance catalogue covers ISO 27001/27017/27018/27701 and ISO 42001 (per-service applicability not verified) [[20]][s20] (F). Probes: GH (27001/27017/27018), Workable (27001/27017), iCIMS, SR, WD, LV (27001) [[42]][s42] (AG) | ENTERPRISE REQUIREMENT | n/a (OSS) | n/a; HIGH for hosted |
| ER-17 | Independent penetration test (annual; summary letter); vulnerability disclosure policy; bug bounty | Security | Evidence of testing is a questionnaire staple. Public VDP per CISA pledge [[74]][s74] (UV) | OR: "regularly performs penetration and vulnerability testing" [[21]][s21] (F). LV/Employ: VDP via security@employinc.com, "we do not offer a bug bounty program" [[17]][s17] (F). GH: security.txt points to HackerOne [[42]][s42] (AG) | TABLE STAKE (pentest, VDP); DIFFERENTIATOR (paid bounty) | Private e-mail VDP only (`Security.MD:7`); no pentest record; `Security.MD:11` admits MD5 | HIGH |
| ER-18 | Encryption in transit (TLS 1.2+) and at rest; field-level encryption of special-category data; key management | Security | GDPR Art. 32 security of processing [[54]][s54] (UV); ASVS V11/V12 [[28]][s28] (F) | GH APIs are HTTPS-only (Harvest returns 403 and Audit Log 401 over HTTP) [[4]][s4][[6]][s6] (F). At-rest details: U | TABLE STAKE | No at-rest or column encryption; no DB TLS; no HSTS (DB-011; SEC-015; SEC-018) | HIGH |
| ER-19 | Data residency: at least EU and US, customer-selectable; sovereign/government regions for regulated buyers | Privacy / Hosting | GDPR Ch. V transfer rules [[54]][s54] (UV); public-sector sovereignty | LV: separate **EU instance** (`hire.eu.lever.co`, `api.eu.lever.co`) [[16]][s16] (F). OR: 50+ regions in 28 countries running Fusion HCM; EU Sovereign, UK Sovereign, US Government and Australian Government clouds [[23]][s23] (F). SAP NS2: US-soil, US-citizen operation [[19]][s19] (F). GH, Ashby, SR, Workable, iCIMS, WD: U | ENTERPRISE REQUIREMENT | Self-hosting gives residency by default [INFERENCE]; no hosted regions | MEDIUM (LOW if self-host-only) |
| ER-20 | DPA (GDPR Art. 28) with SCCs/UK addendum/DPF; published subprocessor list with change notice | Privacy / Contract | GDPR Art. 28 processor terms [[54]][s54] (UV); EU–US DPF [[71]][s71] (UV) | OR: contract checklists for DORA, EBA outsourcing, UK regs and NIS2 advisory published on the compliance page [[20]][s20] (F). LV probe: "subprocessor_list_published: null" [[42]][s42] (AG). Others U | TABLE STAKE (hosted) | n/a (OSS). Legacy sends resume text to a defunct third party (RISK-005; API-010) | n/a; CRITICAL if hosted |
| ER-21 | Trust center: self-serve security docs, subprocessors, status page, security.txt | Procurement | Reduces questionnaire cycle time [INFERENCE] | Trust portals probed at trust.greenhouse.com, trust.ashbyhq.com, trust.smartrecruiters.com, trust.icims.com, security.workday.com; LV "does not run a self-serve trust portal … reports … under NDA" [[42]][s42] (AG) | ENTERPRISE REQUIREMENT | None | MEDIUM |
| ER-22 | FedRAMP (Moderate) / state programmes (TX-RAMP, GovRAMP) / DoD IL | Attestation | US federal cloud procurement | FedRAMP Authorized: WD Government Cloud (incl. Recruiting, 2022-07-11); OR Fusion Cloud (incl. recruiting, 2020-01-13); SAP NS2 CIE (incl. SF Recruiting, JAB 2017-11-13; DoD IL4 variant); Avature (2025-03-28); Eightfold (2025-04-10); HireVue (2019-05-10); NEOGOV (2025-08-25); Yello (2022-04-11); Monster MHME (2022-04-07). Phenom: FedRAMP Ready. UKG: Agency In Process [[19]][s19] (F). **Not listed: GH, LV, Ashby, SR, Workable, iCIMS** [[19]][s19] (F). OR also lists TX-RAMP [[20]][s20] (F) | OPTIONAL (public-sector segment) | None | LOW (HIGH only if targeting US public sector) |
| ER-23 | Backup, DR, RPO/RTO, tested restores | Operations | Business continuity (ISO 27001 Annex A; SOC 2 availability) [INFERENCE] | OR: backups retained "at least 60 days"; HA strategy [[21]][s21] (F). Others U | TABLE STAKE | Built-in backup cannot dump data (DB-005; RISK-008) | HIGH |
| ER-24 | Secure SDLC and supply chain: SBOM, signed releases, advisories/CVEs, patch SLAs | Security | EU Cyber Resilience Act obligations for products with digital elements, with vulnerability reporting from 11 Sep 2026 [[70]][s70] (UV). CISA pledge [[74]][s74] (UV) | OR Software Security Assurance described in hosting policy [[21]][s21] (F). Others U | ENTERPRISE REQUIREMENT (for software sold or distributed) | Broken release artefact; soft CI (RISK-010; RISK-014; `TESTING_AUDIT.md`) | HIGH |
| — | HIPAA | Attestation | Generally **not applicable** to an ATS. Relevant only if a healthcare employer processes PHI in it [INFERENCE] | OR catalogue lists HIPAA [[20]][s20] (F) | OPTIONAL | n/a | LOW |

### 4.3 Privacy & regulatory (not legal advice)

| ID | Requirement | Category | Why enterprises require it (source) | Market evidence (grade) | Classification | OpenCATS today (Phase 0) | Gap severity |
|---|---|---|---|---|---|---|---|
| ER-25 | Purpose-specific consent capture and records (processing, retention/talent pool, marketing, demographic data), with policy version and jurisdiction | Privacy | GDPR Art. 6/7/9 lawful basis and consent [[54]][s54] (UV) | GH job board: `gdpr_processing_consent_given`, `gdpr_retention_consent_given`, `gdpr_demographic_data_consent_given` [[13]][s13] (F). LV: `consent.store`, `consent.marketing`, `compliancePolicyId`; applicant IP used "for detecting country for compliance reasons" [[16]][s16] (F). SR: consent-request and consent APIs, "single" vs "separated" consent [[40]][s40] (AG) | TABLE STAKE (EU/UK) | None; only an empty privacy hook (GAP-002; `PRODUCT_GAPS.md` §1) | CRITICAL |
| ER-26 | Configurable retention schedules and automated anonymisation/deletion | Privacy | GDPR Art. 5(1)(e) storage limitation [[54]][s54] (UV) | GH: GDPR rules expose a configured `retention_period` (days); anonymisation can be "configured in the GDPR page" [[12]][s12][[14]][s14] (F) | TABLE STAKE (EU/UK) | No retention policy or purge jobs (DB-013; GAP-002) | CRITICAL |
| ER-27 | Data-subject access/export (machine-readable, incl. attachments, communications, notes) | Privacy | GDPR Art. 15 and 20 [[54]][s54]; CCPA access right [[56]][s56] (UV) | GH Harvest designed "to allow our customers to export their data" [[6]][s6] (F). Candidate-facing DSAR self-service: U | TABLE STAKE | None; PII spread over ≥9 tables (DB-011) | HIGH |
| ER-28 | Erasure/anonymisation cascading to all related records, files, logs and integrations; emits an event | Privacy | GDPR Art. 17 [[54]][s54]; CCPA deletion [[56]][s56] (UV) | GH anonymize endpoint covers 40+ field groups (attachments, notes, e-mails, activity_items, scorecards_and_interviews, offers, all_offer_versions, identity_verification, third_party_integrations …); `candidate anonymized` webhook [[10]][s10][[14]][s14] (F) | TABLE STAKE | Hard delete leaves history, activities, e-mails, events and questionnaire answers (DB-011; DB-004) | CRITICAL |
| ER-29 | Jurisdiction-aware privacy notice at collection (careers and apply) | Privacy | GDPR Art. 13 [[54]][s54]; CCPA notice at collection (applicants in scope since the employment exemption lapsed 1 Jan 2023) [[56]][s56] (UV) | GH job board `data_compliance` objects per job [[12]][s12] (F). Others U | TABLE STAKE | None (GAP-002; GAP-012) | HIGH |
| ER-30 | US voluntary EEO self-ID (race/ethnicity, sex) kept separate from the application and hidden from decision-makers; aggregate reporting | Compliance (US) | EEO-1 (employees) [[53]][s53]; UGESP adverse-impact records [[50]][s50]; OFCCP applicant data for contractors [[45]][s45] (all UV) | GH: per-application EEOC object (race, gender, veteran_status, disability_status); job-board `compliance` questions "used by government contractors … to comply with EEOC regulations" [[9]][s9][[12]][s12] (F). SR: `CANDIDATE_EEO_FILLED` audit event [[40]][s40] (AG) | ENTERPRISE REQUIREMENT (US) | EEO captured, but option lists are wrong (UX-004), data is plaintext (DB-011), and reports/export are ungated (SEC-022) | HIGH |
| ER-31 | VEVRAA and Section 503 self-ID: pre-offer and post-offer invitations (Section 503 via OFCCP form CC-305); data-collection analysis | Compliance (US federal contractors) | 41 CFR 60-300.42/.44(k); 60-741.42/.44(k) [[51]][s51][[52]][s52] (UV) | GH EEOC object includes veteran and disability status [[9]][s9] (F). Post-offer and CC-305 handling per vendor: U | ENTERPRISE REQUIREMENT (contractors) | Veteran field only, with a broken option value (UX-004). No disability form versioning | HIGH |
| ER-32 | Disposition (rejection) reasons required and typed; Internet Applicant tracking; applicant flow / adverse-impact reporting | Compliance / Analytics | 41 CFR 60-1.3 and 60-1.12 (status in flux after EO 14173) [[45]][s45][[46]][s46][[47]][s47]; UGESP 1607.4 [[50]][s50] (UV) | GH rejection reasons typed "We rejected them" / "They rejected us" / "None Specified" [[11]][s11] (F). LV `archive_reasons` resource [[18]][s18] (F) | ENTERPRISE REQUIREMENT (US) | None; only two reject statuses (GAP-021) | HIGH |
| ER-33 | Record-retention floors and legal hold (keep application records even after rejection or erasure requests where law requires) | Compliance | 29 CFR 1602.14: 1 year [[49]][s49]; 41 CFR 60-1.12: 2 years, or 1 year if <150 employees or contract <$150k [[45]][s45]; Cal. Gov. Code 12946: 4 years [[57]][s57] (all UV) | Legal-hold features per vendor: U. GH anonymisation is field-selective, which allows partial retention [[10]][s10] (F) | ENTERPRISE REQUIREMENT | Hard deletes; history rewrites KPIs (DB-013; FEAT-003) | HIGH |
| ER-34 | Configurable demographic questions beyond US EEO (country packs, free-form, consent) | Privacy / DEI | Global employers; GDPR Art. 9 consent [[54]][s54] (UV) | GH "Greenhouse Inclusion" demographic question sets and answer options [[9]][s9][[12]][s12] (F) | DIFFERENTIATOR | US-only EEO model (UX-015) | MEDIUM |
| ER-35 | Pay transparency: structured pay range (min/max, currency, interval) per job and per location; output to career site and feeds; multiple ranges per job | Compliance | NYC Admin Code §8-107(32) [[59]][s59]; Cal. Labor Code §432.3 [[58]][s58]; Colorado §8-5-201 [[60]][s60]; RCW 49.58.110 [[61]][s61]; EU Directive 2023/970 Art. 5 [[62]][s62] (all UV) | GH job board `pay_input_ranges` (min/max cents, currency, title such as "NYC Salary Range", blurb) behind `pay_transparency=true` [[12]][s12] (F). LV `salaryRange` (currency, interval, min, max) [[16]][s16] (F) | TABLE STAKE (US multi-state; EU from 2026) | `joborder.salary varchar(64)` free text (`db/cats_schema.sql:807`; DB-014) | HIGH |
| ER-36 | Screening-question governance: block salary-history questions by jurisdiction; knockout-question review | Compliance | EU Directive 2023/970 Art. 5(2) pay-history ban [[62]][s62]; US state salary-history bans (UV) | U for all vendors | ENTERPRISE REQUIREMENT | Questionnaires allow anything and pre-select answers (UX-011) | MEDIUM |
| ER-37 | Candidate-facing accessibility: career site and apply flow at WCAG 2.1 AA (2.2 AA target); accommodation request path | Accessibility | ADA (US) [[67]][s67] (UV); EN 301 549 [[65]][s65] (UV); W3C "advises the use of WCAG 2.2" [[24]][s24] (F) | OR: mobile-responsive career sites, SMS [[22]][s22] (F). Vendor WCAG claims: U (vendor accessibility pages unreachable) | TABLE STAKE | Fixed 940 px, no viewport, zero ARIA (GAP-019; UX-001; UX-005; UX-012) | HIGH |
| ER-38 | Recruiter/admin UI accessibility (Section 508 / EN 301 549) and a published ACR (VPAT) | Accessibility / Procurement | Section508.gov recommends an ACR for any ICT marketed to the federal government [[26]][s26] (F); Section 508 harmonised with WCAG 2.0 [[27]][s27] (F); ITI VPAT template [[77]][s77] (UV) | Vendor ACRs: U (Oracle ACR index returned 403) | ENTERPRISE REQUIREMENT (public sector; many large corporates) | None (GAP-019; UX-005; UX-009; UX-010) | HIGH (public sector) / MEDIUM |
| ER-39 | AI governance hooks: notice, alternative process/opt-out, human review, decision logging, bias-audit data export | Compliance (AI) | NYC Local Law 144 [[69]][s69]; EU AI Act Annex III(4) employment = high-risk [[68]][s68] (UV). Detail in `AI_RECRUITING_LANDSCAPE.md` [[44]][s44] | GH audit log records MCP access and tool calls; anonymize covers `match_score_reasoning` [[5]][s5][[10]][s10] (F) | ENTERPRISE REQUIREMENT (if AI used) | No AI features (GAP-024) | LOW now; design-time requirement |

### 4.4 Audit & governance

| ID | Requirement | Category | Why enterprises require it (source) | Market evidence (grade) | Classification | OpenCATS today (Phase 0) | Gap severity |
|---|---|---|---|---|---|---|---|
| ER-40 | Customer-visible audit log covering authentication, admin/permission changes, data create/update/delete, exports and report downloads, **views of sensitive records**, API and agent access | Governance | ASVS 16.3.1 (log all authentication operations) and 16.2.1 (who/what/when/where) [[28]][s28] (F). GDPR Art. 5(2) accountability [[54]][s54] (UV) | GH Audit Log API: event types `data_change_update/create/destroy`, `harvest_access`, `mcp_access`, `mcp_tool_call`, `action`; performer `user`/`api_key`/`oauth` [[5]][s5] (F). SR: 76 event types incl. `CANDIDATE_PROFILE_OPENED`, `SEARCH`, `CUSTOMER_REPORT_DOWNLOADED`, `USER_ROLE_CHANGED`, `USER_AUTHENTICATION_INVALID_CREDENTIALS`, approval delegation [[40]][s40] (AG). LV `audit_events` endpoint [[18]][s18] (F) | ENTERPRISE REQUIREMENT | Partial, mutable `history`; no view, export or admin logging (GAP-011; DB-016; SEC-022) | HIGH |
| ER-41 | Audit retention ≥1 year, API export or SIEM streaming, tamper-evidence | Governance | ASVS 16.1.1 log inventory incl. retention [[28]][s28] (F) | GH API window: "prior thirty days"; enabled via account management [[4]][s4] (F). SR: "retained at least 26 months" [[40]][s40] (AG). OR keeps *its own* security logs ≥1 year [[21]][s21] (F) | ENTERPRISE REQUIREMENT / DIFFERENTIATOR (streaming) | None (DB-016) | HIGH |
| ER-42 | Full data export and portability (bulk API, scheduled exports, attachments) | Governance | Exit and lock-in risk; GDPR Art. 20 [[54]][s54] (UV) | GH Harvest (export-oriented) [[6]][s6] (F). LV Data API resources incl. files and resumes [[18]][s18] (F) | TABLE STAKE | CSV export with no ACL and no formula-injection guard (API-020); broken backup (DB-005) | HIGH |
| ER-43 | Sandbox / non-production environment with configuration sync | Governance | Safe change testing; integration development | LV: "Lever Sandbox account" for OAuth integrators [[18]][s18] (F). GH Pro: "developer sandbox with sandbox sync" [[35]][s35] (IX). SR "SmartSandbox" (March 2026 release) [[43]][s43] (VX, sibling notes) | ENTERPRISE REQUIREMENT (tier-gated) | Self-host can clone an instance [INFERENCE]; no seeded sandbox tooling | MEDIUM |
| ER-44 | Change management: release notes, API changelog, versioning, deprecation notice periods, maintenance windows | Governance | Integration stability; change-control policies | GH: dated API changelogs; banner: "Harvest v1/v2 API is deprecated and will be removed on August 31, 2026" (move to v3) [[6]][s6][[15]][s15] (F). OR: maintenance periods, ~24 h notice for emergency maintenance [[21]][s21] (F) | TABLE STAKE | `CHANGELOG.MD` exists; no API to version (API-001) | MEDIUM |

### 4.5 Integration & extensibility

| ID | Requirement | Category | Why enterprises require it (source) | Market evidence (grade) | Classification | OpenCATS today (Phase 0) | Gap severity |
|---|---|---|---|---|---|---|---|
| ER-45 | Documented, versioned REST API (OpenAPI), pagination, published rate limits with headers | Integration | Enterprise stacks integrate the ATS with HRIS, BI and IAM [INFERENCE]. ASVS V4 [[28]][s28] (F) | GH Harvest: Basic auth; limit in `X-RateLimit-Limit` per 10 s; 429 with `Retry-After` [[6]][s6] (F). LV Postings: application POST limited to 2/s [[16]][s16] (F); LV Data API: 10 rps, burst 20, no rate-limit headers [[42]][s42] (AG). Ashby: report endpoint 15/min [[42]][s42] (AG). SR, Workable: OpenAPI specs exist [[40]][s40][[41]][s41] (AG) | TABLE STAKE | None; session-bound XML RPC only (API-001; API-015) | HIGH |
| ER-46 | Signed webhooks with retries and an event catalogue | Integration | Event-driven HRIS and onboarding hand-off | GH: HMAC-SHA256 `Signature` header; up to 7 attempts over 15 h; events incl. candidate hired/rejected/anonymized, offer approved, job approved [[14]][s14] (F). LV webhooks CRUD [[18]][s18] (F). Workable `/subscriptions` [[41]][s41] (AG). Ashby webhook signature scheme [[42]][s42] (AG) | TABLE STAKE | None; `eval` hooks only (API-017; FEAT-015) | HIGH |
| ER-47 | HRIS hand-off and org sync (Workday, SAP SuccessFactors, Oracle HCM, BambooHR, Personio, ADP…) | Integration | Hire-to-onboard continuity; position/requisition sync | SR → SAP roadmap: user sync, job sync, then hire sync to Employee Central (H2 2026) [[43]][s43] (VX, sibling notes). GH: Onboarding webhooks and API docs exist [[3]][s3] (F). OR Recruiting "natively part of Oracle Cloud HCM" [[22]][s22] (F) | TABLE STAKE (corporate TA) | None (GAP-004) | HIGH |
| ER-48 | Job distribution: Indeed/LinkedIn/Google for Jobs; public job-board API; embeddable apply | Integration | Sourcing reach | GH Job Board API [[12]][s12] (F). LV Postings API (global + EU) [[16]][s16] (F). OR: LinkedIn integrations and "Direct Apply" on partner sites [[22]][s22] (F) | TABLE STAKE | Pull XML/RSS feeds, partly broken (GAP-015; API-012) | MEDIUM |
| ER-49 | Calendar and e-mail (Google Workspace, Microsoft 365) | Integration | Scheduling is the main coordinator workload (`PRODUCT_GAPS.md` GAP-006) | GH "smarter interview scheduling" on all tiers [[36]][s36] (VX). OR "automatically generate the best time slots" [[22]][s22] (F) | TABLE STAKE | None (GAP-006; GAP-013) | HIGH |
| ER-50 | Partner categories: assessments, background checks, e-signature, video interviewing, sourcing | Integration | Hiring-process completeness | GH has a dedicated Assessment API and Candidate Ingestion API [[3]][s3] (F). Marketplace sizes: U | TABLE STAKE (via ecosystem) | None (GAP-025; GAP-009) | MEDIUM |
| ER-51 | Slack / Microsoft Teams collaboration | Integration | Hiring-manager engagement | SR Winston Companion (Slack, Teams, SMS…) [[43]][s43] (VX, sibling notes). Others U | DIFFERENTIATOR | None | LOW |
| ER-52 | BI / warehouse connector | Integration / Analytics | Enterprise reporting in its own BI | GH "Business Intelligence Connector" on Plus, per independent guides [[35]][s35] (IX). Recruitee BI on top tier [[36]][s36] (VX) | ENTERPRISE REQUIREMENT | None (GAP-014) | MEDIUM |
| ER-53 | Integration marketplace / partner programme | Integration | Time-to-integrate | OR: "certified ecosystem of tools" [[22]][s22] (F). Counts claimed by vendors: **U** (not verified) | DIFFERENTIATOR | None | LOW |
| ER-54 | Governed AI-agent access (MCP or similar) with scopes and audit | Integration / AI | Emerging: agents act on ATS data [INFERENCE] | GH MCP server; MCP events in the audit log, incl. client name and granted scopes [[5]][s5] (F); beta on all new tiers [[36]][s36] (VX) | DIFFERENTIATOR (emerging) | None | LOW |

### 4.6 Scale & operations

| ID | Requirement | Category | Why enterprises require it (source) | Market evidence (grade) | Classification | OpenCATS today (Phase 0) | Gap severity |
|---|---|---|---|---|---|---|---|
| ER-55 | Multi-entity org model (offices, departments, legal entities, tiers) and multi-brand career sites | Scale | Multinationals and holding groups | GH: tiered offices/departments limited to "Advanced or Expert" packages; `external_id` (for HRIS mapping) "Expert" only (`harvest/_offices.md:438-440`) [[3]][s3] (F). OR: "personalized career sites" with built-in design tools [[22]][s22] (F) | ENTERPRISE REQUIREMENT | Single-site careers (`getFirstSiteID`); vestigial `site_id` (FEAT-011; DB-012) | HIGH |
| ER-56 | Multi-language UI and candidate content | Scale | EU/global hiring | OR: résumé extraction "in more than 20 languages" [[22]][s22] (F). UI language counts: U | ENTERPRISE REQUIREMENT | English only (GAP-020; FEAT-016; UX-015) | MEDIUM (HIGH for EU) |
| ER-57 | Multi-currency, locale formats, time zones | Scale | Global compensation data | GH `currency_type` on pay ranges [[12]][s12]; LV `salaryRange.currency` [[16]][s16] (F) | ENTERPRISE REQUIREMENT | No currency; integer GMT offsets (UX-015; DB-020) | MEDIUM |
| ER-58 | High-volume hiring: bulk actions, hiring events, group interview scheduling, SMS, knockout screening | Scale | Hourly and campus hiring | OR: hiring events, "high-volume interview coordination", SMS, account-less apply [[22]][s22] (F) | DIFFERENTIATOR / segment | Bulk selection broken (UX-002); no SMS | MEDIUM |
| ER-59 | Contracted uptime SLA, status page, maintenance windows, service credits | Operations | Business-critical hiring flows | OR: "Target Service Uptime of 99.9%", monthly measurement [[21]][s21] (F). LV status page `status.lever.co` [[42]][s42] (AG). Others U | ENTERPRISE REQUIREMENT (hosted) | n/a (OSS) | n/a; HIGH if hosted |
| ER-60 | Support tiers, implementation services, customer success | Operations | Rollout risk | WD "Success Plans, a subscription-based success package" [[19]][s19] (F, FedRAMP listing text). Others U | ENTERPRISE REQUIREMENT | Community support only [INFERENCE] | MEDIUM |
| ER-61 | Performance at scale: large candidate databases, résumé search, concurrency | Scale | Enterprise data volumes | U (no vendor figures verified) | TABLE STAKE | MyISAM table locks; REGEXP full scans (RISK-015; GAP-016) | MEDIUM |

### 4.7 Procurement signals

| ID | Requirement | Category | Why enterprises require it (source) | Market evidence (grade) | Classification | OpenCATS today (Phase 0) | Gap severity |
|---|---|---|---|---|---|---|---|
| ER-62 | Security questionnaire readiness (SIG, CSA CAIQ/STAR, HECVAT for higher education) with an evidence pack | Procurement | Standard vendor-risk intake [[76]][s76][[78]][s78] (UV) | OR page describes CSA STAR, based on CCM plus SOC 2 and ISO 27001 controls, and an AI-CAIQ [[20]][s20] (F). iCIMS probe lists CSA STAR [[42]][s42] (AG) | ENTERPRISE REQUIREMENT | None; answers today would fail on MD5, CSRF and XSS (SEC-001/004/005) | HIGH |
| ER-63 | Contract package: DPA, SLA, security addendum, sector addenda (DORA, NIS2, EBA outsourcing) | Procurement | Regulated customers push obligations to ICT providers [INFERENCE] | OR publishes DORA, EBA, UK and other contract checklists and a NIS2 advisory [[20]][s20] (F) | ENTERPRISE REQUIREMENT (regulated buyers) | n/a (OSS) | n/a; MEDIUM if hosted |

---
## 5. Detailed findings

### 5.1 Identity & access

**What the market documents (first-hand).** Greenhouse's official Harvest documentation shows the permission model an enterprise ATS exposes [FACT, [[8]][s8] [[6]][s6] [[7]][s7] [[11]][s11], accessed 2026-09-25]:

- **Global vs job-scoped rights.** A `site_admin` has "full permissions on all non-private jobs" (`harvest/_users.md:59`). Other users hold **job permissions**: a user role, of type `interviewer` or `job_admin` (e.g. "Standard"), granted per job (`harvest/_user_roles.md`, `harvest/_user_permissions.md:1-24`).
- **Rule-based scoping.** **Future job permissions** grant a role automatically when a job is created in a given **office or department**, keyed by internal or external IDs (`_user_permissions.md:178-200`). This is attribute-based record scoping driven by org structure.
- **Confidential jobs.** A `confidential` flag exists on jobs (`harvest/_jobs.md:189`). Combined with "non-private" in the site-admin definition, even top admins can be excluded from private searches.
- **Granular admin and developer permissions.** Example: "Can manage ALL organization's API Credentials". API keys are permissioned **per endpoint**. Greenhouse also warns that inside an endpoint "Access to data in Harvest is binary: everything or nothing" (`harvest/_introduction.md:56-58`). Per-record API scoping is therefore **not** offered even by a mature vendor [INFERENCE].
- **Approval chains.** Three approval types (`open_job`, `offer_job`, `offer_candidate`), with sequential or parallel approver groups, `approvals_required` quorum, `priority` and `version` (`harvest/_approvals.md:1-64`).

Other vendors:

- **SmartRecruiters.** Its API spec, via a third-party mirror, adds **access groups**, **system roles**, OAuth scopes down to `approvals_decide`, and audit events for **approval delegation** [SOURCE CLAIM · aggregator, [[40]][s40]].
- **SAP SuccessFactors.** An aggregator paraphrase of SAP docs states that API authorisation is governed by the calling user's **role-based permissions (RBP)**, not by OAuth scopes [SOURCE CLAIM · aggregator, [[42]][s42]].
- **Ashby.** SSO is available on all plans. SCIM is on Plus and above. Custom roles: none on Foundations, up to 3 on Plus, unlimited on Enterprise [SOURCE CLAIM · vendor · search excerpt, [[37]][s37] [[38]][s38] via [[36]][s36]].
- **Greenhouse (support centre).** SAML 2.0 SSO on the new Core/Plus/Pro tiers, with Okta, OneLogin, Google and Entra ID preconfigured. SCIM on "Advanced and Expert" tiers, the legacy tier names [SOURCE CLAIM · vendor · search excerpt, [[29]][s29] [[30]][s30] [[31]][s31]]. An independent source claims Greenhouse SCIM provisions users but not groups [SOURCE CLAIM · independent · search excerpt, [[34]][s34]]; treat as a lead.

**Why buyers need it.**

- **Authorisation depth.** OWASP ASVS 5.0.0 (May 2025) requires authorisation at three levels [FACT, [[28]][s28]]:
  - function level (8.2.1);
  - data-item level, to prevent IDOR/BOLA (8.2.2);
  - field level, to prevent BOPLA (8.2.3).

  It also requires enforcement "at a trusted service layer" (8.3.1). These map one-to-one to ER-08, ER-10 and ER-11.
- **Session and authenticator strength.** NIST SP 800-63B-4 (final) says [FACT, [[25]][s25]]:
  - AAL2 verifiers "SHALL offer at least one phishing-resistant authentication option";
  - AAL2 reauthentication SHOULD be ≤24 h, with inactivity ≤1 h;
  - AAL3 limits are ≤12 h and ≤15 min.

  These numbers give OpenCATS 2.0 defensible defaults (ER-04, ER-06).

**OpenCATS gap.** One global access level per user, READ to ROOT (`PRODUCT_GAPS.md` GAP-003). No SSO, MFA, lockout or session rotation (GAP-001; SEC-001/007/014/021). A Standard Admin can mint ROOT users (SEC-013). AJAX handlers enforce login only (SEC-026). [FACT per Phase 0]

**[INFERENCE]** The market's permission models (Greenhouse, SmartRecruiters, SAP RBP) converge on four elements:
1. a small set of **global roles**;
2. **per-job team roles**;
3. **rule-based record scoping** by org attributes (office, department, business unit);
4. **field-class restrictions** (EEO/demographics, compensation, private notes).

OpenCATS 2.0's authorisation model should be designed around these four from day one. Retrofitting them later is costly.

### 5.2 Security & compliance attestations

**Vendor attestation evidence (as found this session).** None of the trust pages could be fetched. The "certifications" column comes from automated third-party keyword probes, which are unreliable: the Greenhouse probe lists "FedRAMP", but the official FedRAMP Marketplace data has no Greenhouse offering.

| Vendor | Trust page (probe URL) | Certifications named (grade) | FedRAMP Marketplace, 2026-09-25 [FACT, [[19]][s19]] | Residency evidence | VDP / bug bounty |
|---|---|---|---|---|---|
| Greenhouse | trust.greenhouse.com | SOC 2, ISO 27001/27017/27018 (probe also shows PCI, HIPAA, FedRAMP keywords: unreliable) (AG) | Not listed | U | security.txt → HackerOne (AG) |
| Lever (Employ) | lever.co/security | SOC 2, ISO 27001, PCI DSS (AG); reports under NDA, no self-serve portal (AG) | Not listed | **EU instance** (`hire.eu.lever.co`, `api.eu.lever.co`) (F, [[16]][s16]) | VDP at security@employinc.com; "we do not offer a bug bounty program" (F, [[17]][s17]) |
| Ashby | trust.ashbyhq.com | SOC 2 (AG) | Not listed | U | U |
| SmartRecruiters (SAP) | trust.smartrecruiters.com | SOC 2, ISO 27001 (AG) | Not listed | U | U |
| Workable | workable.com/security | SOC 2, ISO 27001, ISO 27017 (AG) | Not listed | U | U |
| iCIMS | trust.icims.com | SOC 2, ISO 27001, CSA STAR (AG) | Not listed | U | U |
| Workday | security.workday.com | SOC 2, ISO 27001, FedRAMP (AG) | **Workday Government Cloud, Moderate, authorised 2022-07-11; scope includes Recruiting**; 5 agency ATOs | U | U |
| SAP SuccessFactors | not probed | — | **SAP NS2 Cloud Intelligent Enterprise, Moderate (JAB), 2017-11-13; includes SuccessFactors Recruiting; "operated exclusively by U.S. citizens … data restricted to U.S. soil"**; DoD IL4 variant (DD-CIE) | US-only NS2 environments (F) | security.txt present (AG) |
| Oracle | oracle.com/corporate/cloud-compliance (**fetched**) | Catalogue incl. SOC 1/2, ISO 27001/27017/27018/27701, CSA STAR, C5, ENS, IRAP, TX-RAMP, HIPAA, ISO 42001 (F: catalogue; per-service scope not verified) | **Oracle Fusion Cloud, Moderate, 2020-01-13; scope includes recruiting**; 9 agency ATOs | 50+ regions in 28 countries; EU/UK sovereign, US/AU government clouds (F, [[23]][s23]) | U |
| Others (public-sector signal) | — | — | Avature Federal Platform (2025-03-28), Eightfold TIP (2025-04-10), HireVue (2019-05-10), NEOGOV (2025-08-25), Yello (2022-04-11), Monster MHME (2022-04-07, 19 agencies): all Moderate, Authorized. Phenom for Government: *FedRAMP Ready*. UKG Government Cloud: *Agency In Process* | — | Eightfold bug-bounty mailbox (AG) |

**Oracle's contractual baseline (first-hand).** The *Oracle Cloud Hosting and Delivery Policies*, v3.12 (May 2026), state [FACT, [[21]][s21]]:
- a "Target Service Uptime of 99.9%", measured monthly and excluding defined downtime;
- security logs in a SIEM "retained online for a minimum of 1 year";
- backups "typically retained … for a period of at least 60 days";
- SOC 1 and/or SOC 2 reports provided under confidentiality;
- regular penetration and vulnerability testing;
- advance notice for maintenance.

**[INFERENCE]** This is the shape of contractual commitment enterprise buyers expect in writing, whatever the vendor.

**Standards context.**
- SOC 2 is the AICPA's Trust Services Criteria report. Oracle's compliance page describes it and links the AICPA [FACT, [[20]][s20]].
- ISO/IEC 27001:2022 certificates are commonly requested by EU buyers [UNVERIFIED, [[75]][s75]].
- The EU **Cyber Resilience Act** (Regulation (EU) 2024/2847) introduces vulnerability-handling and reporting obligations for products with digital elements. Reporting duties apply from 11 September 2026 and most obligations from 11 December 2027. There is a lighter regime for open-source "stewards" [UNVERIFIED, [[70]][s70]].

  **[INFERENCE]** The CRA is directly relevant to how OpenCATS 2.0 is *distributed* and *commercialised* in the EU: SBOM, vulnerability handling and security updates. Legal review is required; this is not legal advice.

**Public sector.** FedRAMP is a genuine gate for US federal buyers, and the recruiting incumbents there are HCM suites and specialist public-sector vendors [FACT, [[19]][s19]]. **[INFERENCE]** For an open-source product, the realistic public-sector routes are:
- self-hosting inside an agency's own authorised environment; or
- a partner's FedRAMP-authorised hosting.

FedRAMP should not be an early product goal.

**OpenCATS.** As downloadable software it cannot hold SOC 2 or ISO certificates; a *hosting operator* can. The software must still *enable* the operator's and customer's controls:
- encryption and key handling;
- logging;
- access control;
- backups;
- a secure SDLC.

Today it fails basic hygiene: MD5, no CSRF, XSS, unauthenticated candidate overwrite (SEC-001/004/005/024), broken backups (DB-005) and a broken release artefact (RISK-010). The only disclosure channel is a private e-mail in `Security.MD:7`, which also states "OpenCATS uses MD5 hashing" (`Security.MD:11`) [FACT].

### 5.3 Privacy & regulatory requirements (not legal advice)

Every legal statement in this subsection is **[UNVERIFIED]**: the primary sources were unreachable this session (§2.4). Primary-source links are given for verification. Counsel must confirm scope, thresholds and current status.

#### 5.3.1 GDPR / UK GDPR
- **Obligations that translate into product requirements** (Regulation (EU) 2016/679 [[54]][s54]):
  - lawful basis and consent (Art. 6–7);
  - special-category data such as ethnicity, health/disability and, in some contexts, gender identity (Art. 9);
  - transparency at collection (Art. 13–14);
  - access and portability (Art. 15, 20);
  - erasure (Art. 17);
  - automated decision-making (Art. 22);
  - data protection by design (Art. 25);
  - processor contracts (Art. 28);
  - records of processing (Art. 30);
  - security (Art. 32);
  - breach notification (Art. 33);
  - DPIAs (Art. 35);
  - international transfers (Ch. V). The EU–US Data Privacy Framework is one transfer route [[71]][s71].

  The UK GDPR mirrors these (ICO guidance [[55]][s55]). The **Data (Use and Access) Act 2025** amended parts of UK data law, including subject-access searches and automated decision-making rules; its commencement dates must be checked [[81]][s81].
- **How the market implements it** [FACT]:
  - Greenhouse separates consent for **processing**, **retention** and **demographic data**; configures a **retention period in days** per GDPR rule; anonymises by field group; and emits an **anonymized** webhook [[12]][s12] [[13]][s13] [[10]][s10] [[14]][s14].
  - Lever records `consent.store` and `consent.marketing` against a `compliancePolicyId`, and uses applicant IP "for detecting country for compliance reasons" [[16]][s16].
  - SmartRecruiters exposes consent-request APIs with "single" or "separated" consent per product scope [SOURCE CLAIM · aggregator, [[40]][s40]].
- **[INFERENCE]** The market pattern is a **policy engine**:
  - jurisdiction → legal basis → consent purposes → retention clock (from application or last activity) → reminder/re-consent → anonymise.

  Anonymisation is **field-selective**, so aggregate reporting and legally required records (§5.3.3) survive erasure.

#### 5.3.2 CCPA / CPRA (California)
- The employee/applicant partial exemption expired on **1 January 2023**. Job applicants who are California residents therefore hold CCPA rights (notice at collection, access, deletion, correction, limiting use of sensitive personal information) against covered businesses (Cal. Civ. Code §1798.100 et seq.; CPPA regulations [[56]][s56]).
- The CPPA's regulations on automated decision-making technology, risk assessments and cybersecurity audits were finalised in 2025, with phased compliance dates. The ADMT provisions reach "significant decisions", including employment [[56]][s56].
- **[INFERENCE]** Most other US state comprehensive privacy laws exclude data processed in an employment/applicant context. California is the main US driver for applicant privacy tooling. Verify per state.

#### 5.3.3 US EEO / OFCCP recordkeeping and self-identification
- **Title VII employers generally.** 29 CFR 1602.14 requires employers to preserve personnel or employment records, *including application forms*, for **one year** from the making of the record or the personnel action, whichever is later. When a charge is filed, records must be kept until final disposition [[49]][s49].
- **UGESP.** 29 CFR part 1607 (Uniform Guidelines) expects users of selection procedures to keep data on adverse impact by race, sex and ethnic group [[50]][s50].
- **EEO-1.** Filed for **employees**, not applicants, by private employers above the EEOC's size thresholds [[53]][s53].
- **Federal contractors (EO 11246): verification requested for 41 CFR 60-1.12.**
  - Per 41 CFR 60-1.12(a), contractors must preserve personnel and employment records for **not less than two years** from the making of the record or the personnel action, whichever is later. The period is **one year** if the contractor has **fewer than 150 employees** or does not have a Government contract of at least **$150,000** [[45]][s45].
  - The records include those on **Internet Applicants**, defined in 41 CFR 60-1.3 [[46]][s46], and the contractor must identify, where possible, the gender, race and ethnicity of each applicant (60-1.12(c)).
  - **Status caveat:** Executive Order 14173 (21 January 2025) **revoked EO 11246** [[47]][s47]. The Department of Labor subsequently moved to rescind the EO 11246 implementing regulations [[48]][s48]. Whether 41 CFR 60-1 still binds any contractor as of 2026-09-25 is **[UNKNOWN]**.
- **Section 503 and VEVRAA (statutory; not affected by EO 14173).**
  - Contractors must invite applicants to self-identify:
    - as protected veterans, pre-offer and post-offer (41 CFR 60-300.42 [[51]][s51]);
    - as individuals with a disability, pre-offer and post-offer, using OFCCP's form **CC-305** (41 CFR 60-741.42 [[52]][s52]).
  - Contractors must also keep **data-collection analysis** records (applicants, openings, hires; 60-300.44(k), 60-741.44(k)), commonly for **three years**.
  - Any 2025–2026 amendments to these parts: **[UNKNOWN]**.
- **California.** FEHA requires employment records, including applications, to be kept for **four years** (Cal. Gov. Code §12946 [[57]][s57]).
- **Product implications.** [INFERENCE from the above, plus market evidence]
  - Self-ID data must be (a) **voluntary**, (b) **stored separately from the application** and **hidden from decision-makers** (field-level permissions, ER-11), and (c) reportable in aggregate. Greenhouse models EEOC data as its own per-application object and offers job-board "compliance" questions "used by government contractors" [FACT, [[9]][s9] [[12]][s12]].
  - **Disposition reasons** are required to produce applicant-flow and adverse-impact analysis. Greenhouse types them as "We rejected them" / "They rejected us" [FACT, [[11]][s11]].
  - Retention must be policy-driven, with **legal hold**. Erasure must respect minimum retention floors.
  - OpenCATS today:
    - captures EEO, but with **wrong option values** (UX-004);
    - stores it in plaintext and copies it into `history` (DB-011);
    - lets any user view EEO reports and exports (SEC-022);
    - has **no disposition reasons** (GAP-021).

#### 5.3.4 Pay transparency
| Jurisdiction (primary source) | Core product-relevant obligation (UNVERIFIED) | Effective (UNVERIFIED) |
|---|---|---|
| New York City: Admin Code §8-107(32) [[59]][s59] | Good-faith minimum and maximum salary in advertisements for jobs, promotions and transfers (employers with 4+ employees) | 1 Nov 2022 |
| California: Labor Code §432.3 [[58]][s58] | Pay scale in job postings (employers with 15+ employees); pay-data record keeping. A 2025 amendment clarified "good faith estimate" | 1 Jan 2023 (amendment 1 Jan 2026) |
| Colorado: C.R.S. §8-5-201 et seq. (EPEWA) [[60]][s60] | Compensation range and benefits description in postings; notice of promotional/career-progression opportunities | 1 Jan 2021 (expanded 2024) |
| Washington: RCW 49.58.110 [[61]][s61] | Wage scale or salary range plus a general benefits description in postings (15+ employees); a 2025 amendment added a cure period | 1 Jan 2023 |
| Other US states and cities (Illinois, Maryland, Minnesota, Hawaii, DC, Vermont, Massachusetts, New Jersey, Cleveland and others) | Similar posting-range laws with differing thresholds and details | 2024–2027, per jurisdiction: **[UNKNOWN] detail** |
| EU: Directive (EU) 2023/970, Art. 5 [[62]][s62] | Applicants are entitled to information on initial pay or its range *before* the interview (e.g. in the vacancy notice); employers may **not ask about pay history**; gender-neutral vacancy notices and job titles | Transposition deadline **7 June 2026**. National transposition status per member state: **[UNKNOWN]** |
| Canada: Ontario ESA amendments; British Columbia Pay Transparency Act [[79]][s79] | Ontario: salary range in publicly advertised postings (above a size threshold), disclosure of AI use in screening, vacancy-status disclosure. BC: pay range in postings | Ontario 1 Jan 2026; BC 1 Nov 2023 |

**Market implementation** [FACT]: Greenhouse `pay_input_ranges` supports **multiple ranges per job post**, each with min/max, currency, a title such as "NYC Salary Range" and an explanatory blurb [[12]][s12]. Lever's `salaryRange` has currency, interval, min and max [[16]][s16].

**OpenCATS:** `joborder.salary` is `varchar(64)` free text (`db/cats_schema.sql:807`) [FACT].

**[RECOMMENDATION]** Model **pay ranges per job and per location**, with currency, interval and pay-type, rendered on the career site, in schema.org JobPosting `baseSalary` and in feeds. Add a policy check that blocks publishing a job in a covered jurisdiction without a range. Add a configurable ban on pay-history questions (ER-36).

#### 5.3.5 Accessibility
- **WCAG 2.2** [FACT, [[24]][s24]]:
  - The W3C source says WCAG 2.2 "extends" 2.1.
  - Content conforming to 2.2 also conforms to 2.0 and 2.1.
  - The W3C "advises the use of WCAG 2.2 to maximize future applicability".
  - The repo holds **9 new 2.2 success criteria**: focus not obscured (minimum and enhanced), focus appearance, dragging movements, target size (minimum), consistent help, redundant entry, and accessible authentication (minimum and enhanced).
  - **[INFERENCE]** *Accessible Authentication* affects login and MFA design (no cognitive-function tests; allow password managers and paste). *Redundant Entry* affects multi-step apply flows (do not re-ask for résumé data).
- **Section 508 (US federal)** [FACT, [[26]][s26] [[27]][s27]]:
  - The 2017 refresh harmonised the standards "with the World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG 2.0)".
  - Section508.gov recommends that vendors "generate an ACR for any ICT that's intended to be marketed to the Federal government", e.g. using a VPAT, and make it easy to find.
  - The standards themselves are at the US Access Board [[66]][s66].
- **EU** [UNVERIFIED]:
  - **EN 301 549** V3.2.1 references WCAG 2.1 AA and is used in public procurement [[65]][s65].
  - The **European Accessibility Act** (Directive (EU) 2019/882) applies from **28 June 2025** to specified consumer products and services (e.g. e-commerce, banking, e-books, transport, electronic communications) [[63]][s63].
  - **[INFERENCE, not legal advice]** An employer's career site or ATS is **not** among the listed consumer services, and B2B software sold to employers is generally outside the EAA's consumer scope. The EAA is therefore unlikely to apply *directly* to an ATS vendor or an employer's career site. Counsel should confirm per member-state transposition.
  - **Public-sector employers** are covered by the **Web Accessibility Directive** (EU) 2016/2102 for their websites, including job portals [[64]][s64].
- **US employment law** [UNVERIFIED]:
  - The ADA requires reasonable accommodation in the application process.
  - The DOJ's 2024 ADA Title II rule sets WCAG 2.1 AA for state and local government web content, with 2026/2027 compliance dates by entity size [[67]][s67]. Any later changes: [UNKNOWN].
- **[INFERENCE]** Candidate-facing flows at WCAG 2.1 AA are a **table stake**. WCAG 2.2 AA plus a published ACR for both candidate and recruiter UIs is an **enterprise requirement** for public-sector and many large corporate buyers.
- **OpenCATS:** fixed-width, non-responsive UI with zero ARIA and keyboard traps (GAP-019; UX-001, UX-005, UX-009, UX-010, UX-012).

#### 5.3.6 Canada and Australia (brief) [UNVERIFIED]
- **Canada** [[79]][s79]:
  - **PIPEDA** covers private-sector personal information in provinces without substantially similar laws, and federally regulated employers.
  - **Québec Law 25** (amending the private-sector act P-39.1) adds privacy-by-default, privacy impact assessments for transfers outside Québec, and notice of decisions based exclusively on automated processing.
  - **Ontario** added job-posting disclosure rules effective 2026 (see §5.3.4).
- **Australia** [[80]][s80]:
  - The Privacy Act's employee-records exemption covers existing employment relationships. **Job applicants are generally not covered by it**, so the Australian Privacy Principles apply to candidate data held by APP entities.
  - 2024 amendments add automated-decision transparency requirements with a later commencement date.

#### 5.3.7 AI regulation (reference only)
See `AI_RECRUITING_LANDSCAPE.md` [[44]][s44]. Items with requirement-level impact [UNVERIFIED]:
- **NYC Local Law 144:** bias audit and candidate notice for automated employment decision tools [[69]][s69].
- **EU AI Act:** employment uses in Annex III(4) are high-risk. The application timeline was subject to 2025–2026 "digital omnibus" changes. *Lead-auditor note (2026-09-25):* multiple independent legal sources (Gibson Dunn, DLA Piper, Cloud Security Alliance; search excerpts) report that the Digital Omnibus on AI entered into force on 27 July 2026 and moved Annex III high-risk obligations (incl. recruitment) from 2 Aug 2026 to **2 Dec 2027** — see `MARKET_OVERVIEW.md` §4.4 and `AI_RECRUITING_LANDSCAPE.md` §2 [SOURCE CLAIM · independent · search excerpt] [[68]][s68].
- **Colorado SB24-205:** delayed [[82]][s82].
- California CPPA ADMT rules, and Ontario's AI-in-screening disclosure.

**[FACT]** Greenhouse already logs **MCP access and tool calls** in its audit log and lets customers anonymise `match_score_reasoning` [[5]][s5] [[10]][s10]. **[INFERENCE]** AI auditability and erasure are entering the baseline product surface.

### 5.4 Audit & governance

| Aspect | Greenhouse [FACT, [[4]][s4] [[5]][s5]] | SmartRecruiters [SOURCE CLAIM · aggregator, [[40]][s40]] | Lever [FACT, [[18]][s18]] | Oracle (own ops) [FACT, [[21]][s21]] |
|---|---|---|---|---|
| Access | Audit Log API: bearer JWT valid 24 h, obtained with a Harvest key; enabled by contacting account management | `GET /audit-events` | `GET /audit_events` (Data API) | n/a (internal SIEM) |
| Window / retention | "Prior thirty days" | "Retained at least 26 months"; default query window 7 days | U | Security logs ≥1 year online |
| Event classes | Data create/update/destroy; Harvest API access; MCP access and tool calls; actions (e.g. "Global Email Added"). Performer: user, api_key, oauth, greenhouse_internal | 76 types: account lifecycle, authentication success and failure, password, role change, API credentials, **search**, **candidate profile opened**, personal data modified, EEO filled, merge/delete, approvals and delegation, offers, job/position changes, **report downloaded**, OAuth app access granted | U | Security events |
| Rate limit | 50 req / 10 s; paginated 3 / 30 s | U | U | — |
| Tier | Pro "full audit log" per independent guides [[35]][s35] (IX) | U | U | — |

- **[INFERENCE]** The enterprise bar has three parts:
  1. A customer-visible log that includes **reads of sensitive data** (profile opened, search, export or report download), admin and permission changes, authentication events, and API/agent access.
  2. **Retention of at least one year** (SmartRecruiters' 26 months exceeds this; Greenhouse's 30-day API window implies customers must stream to a SIEM).
  3. **Export/streaming.**

  ASVS 16.1.1–16.3.1 supplies the engineering requirements: a log inventory with retention, who/what/when/where metadata, and all authentication operations logged [FACT, [[28]][s28]].
- **Sandbox** [ER-43]:
  - Lever documents sandbox accounts for OAuth integrators [FACT, [[18]][s18]].
  - Greenhouse's Pro tier reportedly includes a "developer sandbox with sandbox sync" [SOURCE CLAIM · independent · search excerpt, [[35]][s35]].
  - SmartRecruiters "SmartSandbox" was reported in a March 2026 release [SOURCE CLAIM · vendor · search excerpt (sibling notes), [[43]][s43]].
- **Change management** [ER-44]: Greenhouse keeps dated changelogs in its API docs. Its Harvest pages carry the banner "The Harvest v1/v2 API is deprecated and will be removed on August 31, 2026. Please migrate to Harvest v3" [FACT, [[15]][s15]]. **[INFERENCE]** Even established vendors force API migrations. OpenCATS 2.0 should publish a versioning and deprecation policy from v1 (API-001 recommendation: `/api/v1`, `Deprecation`/`Sunset` headers).
- **OpenCATS:** `history` is partial, mutable and deleted with parent records; there is no view, export or admin audit (GAP-011; DB-016; SEC-022).

### 5.5 Integration & extensibility
- **APIs and webhooks** [FACT, [[6]][s6] [[14]][s14] [[16]][s16] [[18]][s18]]:
  - **Greenhouse** ships separate APIs: Harvest (general data, export-oriented), Job Board, Candidate Ingestion, Assessment, Onboarding, Audit Log and webhooks.
    - Webhooks are HMAC-SHA256 signed, retried up to 7 times over 15 hours, and cover candidate, application, offer, job, job-post, interview and organisation events.
    - Harvest rate limits are signalled through `X-RateLimit-*` headers per 10-second window, with `Retry-After` on 429.
  - **Lever** has a public Postings API with global and EU hosts, an application-POST limit of 2 requests per second, and dedupe by e-mail.
    - The OAuth Data API covers opportunities, applications, archive reasons, audit events, feedback, interviews, offers, panels, postings, referrals, requisitions (with custom fields), users and webhooks.
- **Lever rate-limit headers.** Per an aggregator's transcription of Lever docs and a live probe, the Data API is 10 requests per second with a burst of 20 and returns **no rate-limit headers** [SOURCE CLAIM · aggregator, [[42]][s42]]. **[INFERENCE]** Publishing standard `RateLimit` headers is a cheap differentiator.
- **HRIS hand-off:**
  - Oracle positions Recruiting as "natively part of Oracle Cloud HCM" [FACT, [[22]][s22]].
  - SAP's post-acquisition plan for SmartRecruiters phases user sync, job sync and then hire sync to Employee Central [SOURCE CLAIM · vendor · search excerpt (sibling notes), [[43]][s43]].
  - **[INFERENCE]** For a standalone ATS, standard connectors or events to HRIS (a hired event plus position/requisition sync) are table stakes for corporate talent acquisition.
- **Marketplace sizes** claimed by vendors could not be verified this session [UNKNOWN].
- **OpenCATS:** no REST API, tokens, webhooks or events. Extensibility is `eval` hooks, and job feeds are partly broken (API-001, API-012, API-016, API-017; GAP-004; FEAT-015).

### 5.6 Scale & operations
- **Oracle Recruiting** [FACT, [[22]][s22]]:
  - personalised career sites;
  - account-less apply ("just an email or phone number");
  - mobile and SMS;
  - hiring events and "high-volume interview coordination";
  - résumé extraction "in more than 20 languages";
  - LinkedIn integrations and "Direct Apply" on partner sites.
- **Greenhouse** restricts **tiered offices/departments** to Advanced/Expert packages, and `external_id` (used for HRIS mapping) to Expert [FACT, [[3]][s3]]. **[INFERENCE]** Org-hierarchy depth is itself an enterprise gate.
- **Uptime:** only Oracle's 99.9% target was verified [FACT, [[21]][s21]]. Other vendors' SLAs are typically contractual and not public [UNKNOWN].
- **Success services:** Workday's FedRAMP listing mentions "Workday Success Plans, a subscription-based success package" [FACT, [[19]][s19]].
- **OpenCATS:** single-site careers portal; vestigial multi-tenancy; English-only; no currency; MyISAM scaling limits (FEAT-011; DB-012; GAP-020; UX-015; RISK-015).

### 5.7 Procurement signals
- **Security questionnaires.** Vendor-risk teams typically send SIG (Shared Assessments) or CSA CAIQ questionnaires; higher education uses HECVAT [UNVERIFIED, [[76]][s76] [[78]][s78]]. Oracle's compliance page describes CSA STAR as based on the Cloud Controls Matrix plus SOC 2 and ISO/IEC 27001 controls, and an AI-CAIQ aligned to ISO/IEC 42001 [FACT, [[20]][s20]].
- **Accessibility evidence:** an ACR/VPAT [FACT: Section508.gov guidance, [[26]][s26]]. GSA also offers an ACR editor and the machine-readable OpenACR format [FACT, [[26]][s26]].
- **Contractual documents:** DPA, SLA, security addendum, subprocessor list, and sector addenda. Oracle publishes **contract checklists** for DORA, EBA outsourcing guidelines, UK regulations and others, plus a NIS2 advisory [FACT, [[20]][s20]]. **[INFERENCE]** Regulated buyers, especially financial services, push operational-resilience terms down to HR SaaS providers.
- **[INFERENCE]** Being open source helps some procurement items (code transparency, no lock-in, self-hosted residency). It does **not** replace a security evidence pack. That pack comprises an architecture and data-flow description, a pentest summary, a vulnerability disclosure policy, an SBOM, signed releases, a hardening guide, a list of logging events and an ACR. Enterprises will expect it from OpenCATS 2.0 or from its commercial steward.

---
## 6. Minimum enterprise-ready bar for OpenCATS 2.0 [RECOMMENDATION]

Everything in this section is **[RECOMMENDATION]**. The bar is split into three levels:
- **Bar 0** is the precondition for operating at all.
- **Bar 1** is the minimum for an enterprise to *evaluate* OpenCATS 2.0 without being disqualified at security or privacy review.
- **Bar 2** is required to *compete* in enterprise deals.

The product-capability items apply to the **software** whether self-hosted or hosted. The hosted-service column applies only if the project or a steward offers SaaS.

### 6.1 Bar 0: safe to operate (legacy containment, `RECOMMENDED_ROADMAP.md` Phase 1)
Close the Phase 0 CRITICAL findings:
- the unauthenticated candidate overwrite (SEC-024);
- MD5 passwords and the `admin`/`admin` default (SEC-001/003);
- CSRF and session fixation (SEC-004/007);
- attachment IDOR and inline HTML serving (SEC-008/009);
- the merge corruption bug (DB-001);
- the Resfly data egress (RISK-005);
- the broken backups (DB-005).

Until Bar 0 is met, no enterprise requirement below is meaningful.

### 6.2 Bar 1: enterprise-evaluable (target for the first OpenCATS 2.0 GA)
| # | Capability (minimum) | ER refs | Closes (Phase 0) |
|---|---|---|---|
| 1 | **OIDC and SAML 2.0 SSO**, including SP- and IdP-initiated flows, SSO enforcement and a break-glass admin. **Not paywalled** (consistent with `PRICING_AND_PACKAGING.md` §7.1) | ER-01, ER-02, ER-05 | GAP-001, API-016 |
| 2 | **MFA** for local accounts: TOTP plus **WebAuthn/passkeys**, admin-enforceable. Argon2id/bcrypt with rehash-on-login. Tokenised reset. Throttling and lockout | ER-04, ER-07 | SEC-001/002/014 |
| 3 | **Session policy** defaults aligned to NIST 800-63B-4 AAL2 (≤24 h absolute, ≤1 h idle), admin-configurable. Session revocation and ID rotation | ER-06 | SEC-007, SEC-021 |
| 4 | **RBAC v1**: predefined persona roles (admin, recruiter, coordinator, hiring manager, interviewer, external/agency); **per-job team roles**; **confidential jobs**; **field classes** masked by permission (EEO/demographic, compensation/offer, private notes). All enforced in the API/service layer (ASVS 8.2.1–8.3.1) | ER-08, ER-10, ER-11 | GAP-003, GAP-010, SEC-013, SEC-022, SEC-026 |
| 5 | **Append-only audit log**: authentication, admin/permission changes, data create/update/delete, **sensitive reads** (profile, EEO, attachment download), searches/exports/report downloads, API-token and agent access. Retention ≥1 year by default. API export and a syslog/JSON stream for SIEM | ER-40, ER-41 | GAP-011, DB-016 |
| 6 | **Privacy lifecycle**: consent per purpose (processing, retention/talent pool, marketing, demographics) with policy version and jurisdiction; retention schedules with automated **field-selective anonymisation**; DSAR export (JSON plus files); erasure that cascades to history, e-mail, attachments, search index and webhooks; legal hold | ER-25–ER-29, ER-33 | GAP-002, DB-011, DB-013 |
| 7 | **US compliance module**: voluntary EEO self-ID stored separately and hidden from reviewers; VEVRAA/Section 503 invitation support (pre- and post-offer, form versioning); **required, typed disposition reasons**; applicant-flow and adverse-impact exports. Rules held as **configurable jurisdiction packs**, because the regulations are in flux | ER-30–ER-32 | GAP-021, UX-004, SEC-022 |
| 8 | **Structured pay ranges** per job and location (min, max, currency, interval) on the career site, in JSON-LD and in feeds. Pay-history question guard | ER-35, ER-36 | DB-014 (salary as text) |
| 9 | **Accessible, responsive careers site and apply flow at WCAG 2.2 AA**, and recruiter UI built on an accessible component system. Publish an **ACR (VPAT 2.x / OpenACR)** at GA | ER-37, ER-38 | GAP-019, UX-001/005 |
| 10 | **Versioned REST API** (OpenAPI 3.1) with scoped tokens and OAuth2, published rate limits with standard headers, and a deprecation policy. **HMAC-signed webhooks** with retries and a documented event catalogue (incl. `candidate.anonymized`, `application.hired`) | ER-14, ER-44–ER-46 | GAP-004, API-001/015/017 |
| 11 | **Data protection**: TLS everywhere, HSTS and security headers; encrypted storage guidance; application-level encryption for special-category fields; secrets outside config | ER-18 | SEC-015, SEC-018, DB-011 |
| 12 | **Operability**: tested backup/restore, a documented RPO/RTO for reference deployments, health and metrics endpoints | ER-23 | DB-005, RISK-008, RISK-020 |
| 13 | **Security evidence pack**: public VDP with safe harbour and a security.txt; independent pentest before GA with a published summary; SBOM and **signed releases**; security advisories/CVE process; hardening guide; logging inventory; data-flow diagram; pre-filled SIG Lite/CAIQ answers for the reference deployment. Plan CRA readiness (legal review) | ER-17, ER-24, ER-62 | RISK-010, RISK-014, `Security.MD` |
| 14 | **Data export**: full, ACL-checked export via API, and bulk export of attachments | ER-42 | API-020, DB-005 |

**Hosted offering (only if one is launched).** It needs, in addition:
- SOC 2 Type II (a Type I at launch is a common bridge; [INFERENCE]);
- a DPA with SCCs/UK addendum;
- a public subprocessor list with change notice;
- at least **EU and US regions**;
- a status page;
- a contractual uptime target (Oracle's published 99.9% target is one market reference point);
- incident and breach notification terms.

(ER-15, ER-19, ER-20, ER-21, ER-59)

### 6.3 Bar 2: enterprise-competitive (post-GA roadmap)
- **SCIM 2.0**, including group-to-role mapping. The market gates SCIM in paid tiers; OpenCATS could differentiate by including it. (ER-03)
- **Custom roles**, **rule-based record scoping** by office/department/business unit (the equivalent of Greenhouse's "future job permissions"), and **delegated admin** with an escalation guard. (ER-09, ER-10, ER-13)
- **Approval chains** for requisitions and offers: sequential groups, quorum, delegation, full audit trail. (ER-12)
- Sandbox tooling: seeded non-production instances and configuration export/import. (ER-43)
- **SIEM connectors**. (ER-41)
- A **BI/warehouse connector**. (ER-52)
- **HRIS connectors**, prioritised by the target segment (ADR 1F-1). (ER-47)
- Calendar and e-mail sync. (ER-49)
- Job-board and multiposting adapters. (ER-48)
- Partner APIs for assessments, background checks and e-signature. (ER-50)
- **Multi-entity / multi-brand** career sites, **i18n** (UI and candidate content), multi-currency. (ER-55–ER-57)
- **Global demographic question packs** (ER-34) and **AI governance hooks**: notice, alternative process, human review, decision logs, bias-audit exports, audited agent/MCP access. (ER-39, ER-54)
- ISO/IEC 27001 (plus 27701) for any hosted operation; the full ACR, including the admin UI; and a public-sector strategy via self-hosting or partners. **FedRAMP is not recommended as a product goal** before clear demand. (ER-16, ER-22, ER-38)

### 6.4 Design principles implied by the evidence
1. **Security and compliance baselines are not upsells.** Market gating is mixed: Ashby includes SSO everywhere, while Greenhouse gates SCIM and audit depth. OpenCATS' open-source position argues for free safety features, with paid value (if any) in scale and governance automation (`PRICING_AND_PACKAGING.md` §7.1).
2. **Compliance as configurable policy.** Jurisdiction packs should be data, not code. The legal baseline has moved within 18 months: EO 11246 revoked, EU pay-transparency deadline passed, AI-law timelines shifting (§5.3).
3. **Authorisation and audit in the service layer**, never in templates. This is the direct lesson of SEC-026 and SEC-022.
4. **Field-selective anonymisation plus legal hold**, so that privacy erasure and EEO/OFCCP retention can coexist.

---

## 7. Facts vs Inferences

**Facts (read first-hand this session; see Sources for commits and URLs)**
- Greenhouse official docs (`grnhse/greenhouse-api-docs` @271cd88) contain:
  - user roles and job/future job permissions;
  - a confidential-job flag;
  - approval flows (`open_job`, `offer_job`, `offer_candidate`);
  - per-endpoint API key permissions, and the "binary" data-access warning;
  - rate-limit headers per 10 s;
  - Audit Log API: 30 days, event types incl. MCP, enabled via account management;
  - anonymize endpoint field list, incl. `match_score_reasoning` and `identity_verification` (added 2025-09-24);
  - `candidate anonymized` webhook;
  - GDPR consent flags and retention period in the job-board API;
  - `pay_input_ranges`;
  - EEOC and demographic-data objects;
  - typed rejection reasons;
  - HMAC webhooks with 7 retries over 15 h;
  - tiered offices restricted to Advanced/Expert;
  - the Harvest v1/v2 removal banner for 2026-08-31.
- Lever official repos contain:
  - EU instance hosts;
  - `consent.store` / `consent.marketing` / `compliancePolicyId`;
  - `salaryRange`;
  - a limit of 2 application POSTs per second;
  - a Data API resource list incl. audit events, requisitions, offers and webhooks;
  - sandbox accounts;
  - an Employ VDP with **no bug bounty**.
- FedRAMP Marketplace data (2026-09-25) records authorisations for:
  - Workday Government Cloud (incl. Recruiting);
  - Oracle Fusion Cloud (incl. recruiting);
  - SAP NS2 (incl. SuccessFactors Recruiting);
  - Avature, Eightfold, HireVue, NEOGOV, Yello and Monster MHME.

  It shows no listing for Greenhouse, Lever, Ashby, SmartRecruiters, Workable or iCIMS.
- Oracle Hosting and Delivery Policies v3.12 (May 2026): 99.9% target uptime, security logs ≥1 year, backups ≥60 days, SOC 1/2 under NDA, pentesting. Oracle's region page: 50+ regions in 28 countries, plus sovereign and government clouds. Oracle Recruiting page: the features cited.
- NIST SP 800-63B-4 (final): the AAL reauthentication and phishing-resistance text quoted in §5.1.
- WCAG 2.2: its relation to 2.1/2.0 and its 9 new success criteria.
- Section508.gov: ACR guidance and WCAG 2.0 harmonisation.
- OWASP ASVS 5.0.0 (May 2025): requirements 8.2.1–8.3.1 and 16.x.
- OpenCATS state: per Phase 0 IDs, plus `Security.MD:7,11` and `db/cats_schema.sql:807`.

**Source claims (vendor or independent search excerpts; aggregators)**
- Greenhouse SSO and SCIM tiering; Greenhouse Pro features (audit log, sandbox, session timeouts).
- Ashby SSO, SCIM and custom-role gating.
- SAP's completion of the SmartRecruiters acquisition, and its roadmap.
- The SmartRecruiters audit, consent and role APIs (spec mirror).
- Trust-page certification keywords and security.txt probes.
- Lever and Ashby rate-limit transcriptions.

**Inferences**
- The requirement classifications (TABLE STAKE, ENTERPRISE REQUIREMENT, and so on).
- The convergent permission-model pattern.
- The audit-log bar (reads, ≥1 year, streaming).
- The EAA's likely non-applicability to career sites (not legal advice).
- The realistic public-sector route for open source.
- The "security evidence pack" expectation.
- The Bar 0/1/2 structure (these are recommendations).

**Unverified (background knowledge; primary links given)**
- All statements about US federal, state and city law, EU/UK law, Canada and Australia.
- The status of EO 11246 regulations; the thresholds and dates in §5.3.
- ISO transition dates, CRA dates, and SIG/CAIQ/HECVAT and VPAT descriptions.

## 8. Unknowns
1. **Legal status as of 2026-09-25.** Unknown items:
   - whether 41 CFR part 60-1 (including 60-1.12 retention) has been formally rescinded, and whether any contractor obligations under it survive;
   - any 2025–2026 changes to the Section 503 and VEVRAA regulations (60-741, 60-300), including CC-305;
   - the current EEO-1 filing thresholds and contractor prong.
2. **EU Pay Transparency Directive** national transposition status per member state after the 7 June 2026 deadline.
3. **EU AI Act** high-risk applicability date after the digital-omnibus process — partially resolved: 2 Dec 2027 per multiple independent legal sources (search excerpts; see `MARKET_OVERVIEW.md` §4.4); confirm against the Official Journal text.
4. Whether the **ADA Title II web rule** compliance dates were changed after 2024.
5. Vendor facts that could not be seen:
   - Lever, Workable, iCIMS, Workday, SAP and Oracle SSO/SCIM/MFA specifics and their tier gating;
   - the permission models of Workday, iCIMS, Workable and Lever;
   - audit-log retention for Lever, Ashby, Workable, iCIMS and Workday;
   - vendor data-residency options other than Lever's EU instance and Oracle's regions;
   - published SLAs other than Oracle's;
   - VPAT/ACR availability (the Oracle ACR index returned 403);
   - marketplace sizes;
   - support-tier structures.
6. **Accuracy of trust-page certifications.** Automated probes are unreliable (the Greenhouse probe shows FedRAMP, contradicted by Marketplace data). Every certification in §5.2 needs direct confirmation.
7. How Greenhouse's legacy tiers (Essential/Advanced/Expert) map to Core/Plus/Pro for SCIM, audit log and org-hierarchy features.
8. Whether SmartRecruiters' mirrored spec (v201911.1 label, mirrored 2026-04-01) reflects the current API, e.g. the 26-month audit retention.
9. **OpenCATS target segment** (agency vs corporate talent acquisition) and **hosting model** (self-hosted vs SaaS). These change which Bar 1 items are CRITICAL, e.g. EEO/OFCCP for US corporate users, or hosted attestations (`EXECUTIVE_SUMMARY.md` Unknown 5; ADR 1F).

## 9. Verification priorities (before external use)
1. Primary legal texts:
   - 41 CFR 60-1.12 / 60-1.3 and the OFCCP rescission status [[45]][s45][[46]][s46][[48]][s48];
   - 29 CFR 1602.14 [[49]][s49];
   - 41 CFR 60-300.42 / 60-741.42 and CC-305 [[51]][s51][[52]][s52];
   - Cal. Gov. Code §12946 [[57]][s57];
   - Directive 2023/970 Art. 5 and Art. 34 [[62]][s62];
   - EAA scope [[63]][s63].
2. Vendor identity and permission pages: Greenhouse support articles [[29]][s29]–[[31]][s31]; Ashby KB [[37]][s37][[38]][s38]; Lever, Workable and iCIMS SSO/SCIM help pages.
3. Trust centres: certifications, subprocessor lists and DPA terms for each vendor in §5.2.
4. Vendor ACRs/VPATs (Oracle's accessibility templates index, the Workday and SAP accessibility pages, etc.).

---
## 10. Sources

All accessed **2026-09-25**. Grades: **first-hand** = read directly (repo, official GitHub repo at the stated commit, or fetched official page); **excerpt** = seen only as a search-result excerpt; **aggregator** = third-party machine-generated; **not fetched** = cited primary source that could not be reached this session (statements relying on it are [UNVERIFIED]).

**OpenCATS baseline**
1. OpenCATS Phase 0 audit, `docs/audit/`: `EXECUTIVE_SUMMARY.md`, `PRODUCT_GAPS.md`, `SECURITY_AUDIT.md`, `DATABASE_AUDIT.md`, `API_AUDIT.md`, `FEATURE_INVENTORY.md`, `UX_UI_AUDIT.md`, `RISKS.md`, `RECOMMENDED_ROADMAP.md` (this repo; first-hand)
2. OpenCATS repo files: `Security.MD:7,11`; `db/cats_schema.sql:188-191,806-807` (this repo; first-hand)

**Official vendor sources, first-hand**
3. Greenhouse, `grnhse/greenhouse-api-docs` @271cd88 (2026-09-10), https://github.com/grnhse/greenhouse-api-docs (official developer docs; first-hand), including `source/includes/harvest/_offices.md:438-440`
4. Greenhouse, Audit Log API introduction, https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/audit-log/_introduction.md (first-hand)
5. Greenhouse, Audit Log API events, https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/audit-log/_events.md (first-hand)
6. Greenhouse, Harvest API introduction (auth, key permissions, rate limiting, changelog), https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_introduction.md (first-hand)
7. Greenhouse, Harvest Approvals, https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_approvals.md (first-hand)
8. Greenhouse, Harvest User Permissions / User Roles / Users, https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_user_permissions.md (and `_user_roles.md`, `_users.md`) (first-hand)
9. Greenhouse, Harvest EEOC and Demographic Data, https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_eeoc.md (and `_demographic_data.md`) (first-hand)
10. Greenhouse, Harvest Candidates (PUT Anonymize Candidate), https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_candidates.md (first-hand)
11. Greenhouse, Harvest Rejection Reasons and Jobs (`confidential`), https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_rejection_reasons.md (and `_jobs.md`) (first-hand)
12. Greenhouse, Job Board API: Jobs (`data_compliance`, `pay_input_ranges`, `compliance`, demographic questions), https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/job-board/_jobs.md (first-hand)
13. Greenhouse, Job Board API: Applications (GDPR consent fields), https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/job-board/_applications.md (first-hand)
14. Greenhouse, Webhooks introduction (signature, retry) and candidate events (anonymized), https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/webhooks/_introduction.md (and `_candidate_events.md`) (first-hand)
15. Greenhouse, docs layout banner ("Harvest v1/v2 … removed on August 31, 2026"), https://github.com/grnhse/greenhouse-api-docs/blob/master/source/layouts/layout.erb (first-hand)
16. Lever, `lever/postings-api` @f61aac5 (2026-04-23), README, https://github.com/lever/postings-api/blob/master/README.md (official; first-hand)
17. Lever / Employ Inc., Vulnerability Disclosure Policy, https://github.com/lever/postings-api/blob/master/SECURITY.md (official; first-hand)
18. Lever, `lever/integrator-resources` @c74d96e (2025-02-27), Data API Postman collection and README, https://github.com/lever/integrator-resources (official; first-hand)
19. FedRAMP PMO, `FedRAMP/marketplace-fedramp-gov-data` @bfcd5f4 (data `last_change` 2026-09-25, "produced_by: General Services Administration"), `data.json`, https://github.com/FedRAMP/marketplace-fedramp-gov-data (official government data; first-hand). The predecessor `GSA/marketplace-fedramp-gov-data` was deprecated on 2026-05-19.
20. Oracle, "Cloud Compliance", https://www.oracle.com/corporate/cloud-compliance/ (vendor; fetched first-hand)
21. Oracle, "Oracle Cloud Hosting and Delivery Policies", v3.12, effective May 2026, https://www.oracle.com/contracts/docs/ocloud_hosting_delivery_policies_3089853.pdf (vendor contract document; fetched first-hand, text extracted locally)
22. Oracle, "Oracle Recruiting and Recruiting Booster", https://www.oracle.com/human-capital-management/recruiting/ (vendor; fetched first-hand)
23. Oracle, "Public Cloud Regions", https://www.oracle.com/cloud/public-cloud-regions/ (vendor; fetched first-hand)

**Standards and government guidance, first-hand**
24. W3C, `w3c/wcag` @71c891a (2026-09-20), `guidelines/index.html` and `guidelines/sc/22/`, https://github.com/w3c/wcag (official W3C source; first-hand). Published spec: https://www.w3.org/TR/WCAG22/ (not fetched)
25. NIST, SP 800-63B-4 *Digital Identity Guidelines: Authentication and Authenticator Management* (final), https://doi.org/10.6028/NIST.SP.800-63b-4; HTML at https://pages.nist.gov/800-63-4/sp800-63b.html; read via the official repo `usnistgov/800-63-4` @4f2487b, `sp800-63b/aal/index.html` (first-hand)
26. GSA Section508.gov, "Accessibility Conformance Report (ACR)" (permalink `/sell/acr/`), source https://github.com/GSA/Section508.gov/blob/main/_pages/acquisition/2018-05-29-sell-acr.md @ee172f7 (official; first-hand)
27. GSA Section508.gov, "Laws and Policies" (Section 508 refresh harmonised with WCAG 2.0), https://github.com/GSA/Section508.gov/blob/main/_pages/manage/2023-09-23-laws-and-policies.md (official; first-hand)
28. OWASP, Application Security Verification Standard 5.0.0 (May 2025), `OWASP/ASVS` @2b30071, https://github.com/OWASP/ASVS/tree/master/5.0/en (V8 Authorization, V16 Security Logging read first-hand; V6/V7/V11/V12 chapter titles only)

**Vendor search excerpts**
29. Greenhouse Support, "Single sign-on (SSO) overview", https://support.greenhouse.io/hc/en-us/articles/210259723-Single-sign-on-SSO-overview (vendor; excerpt)
30. Greenhouse Support, "Configure SCIM for Okta", https://support.greenhouse.io/hc/en-us/articles/9825388563483-Configure-SCIM-for-Okta (vendor; excerpt)
31. Greenhouse Support, "Configure SCIM for Microsoft Entra ID", https://support.greenhouse.io/hc/en-us/articles/35654588835867-Configure-SCIM-for-Microsoft-Entra-ID (vendor; excerpt)

**Independent search excerpts (leads)**
32. JumpCloud, "Integrate with Greenhouse", https://jumpcloud.com/support/integrate-with-greenhouse (independent IdP doc; title/excerpt)
33. Ping Identity, "Configuring SAML SSO with Greenhouse and PingOne", https://docs.pingidentity.com/configuration_guides/greenhouse/config_saml_greenhouse_p1.html (independent IdP doc; title)
34. Stitchflow, "Greenhouse SCIM Provisioning: Pricing & Limitations", https://www.stitchflow.com/scim/greenhouse (independent vendor blog; excerpt; lead only)
35. Independent Greenhouse pricing guides (Pin, https://www.pin.com/blog/greenhouse-pricing/; Compono, https://www.compono.com/articles/greenhouse-pricing-buyers-guide-2026) (independent/competitor; excerpt; lead only)

**Phase 2 sibling material**
36. `docs/competitive/PRICING_AND_PACKAGING.md` (Phase 2 sibling; its vendor excerpts are reused with its grades)
37. Ashby Knowledge Base, "SSO and SCIM", https://docs.ashbyhq.com/sso-and-scim (vendor; excerpt via [36])
38. Ashby Knowledge Base, "Manage Access Roles", https://docs.ashbyhq.com/manage-access-roles (vendor; excerpt via [36])
39. SAP News Center, "SAP Completes Acquisition of SmartRecruiters", https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/ (vendor press; excerpt via [36])

**Aggregators and mirrors**
40. SmartRecruiters OpenAPI (v201911.1), third-party mirror `jentic/jentic-public-apis`, https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/smartrecruiters.com/smartrecruiters/201911.1 (aggregator mirror of vendor spec; read first-hand from sibling scratch copy)
41. Workable API v3 OpenAPI, third-party mirror `jentic/jentic-public-apis`, https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/workable.com/main/3.0 (aggregator mirror)
42. API Evangelist provider repositories (greenhouse-io, greenhouse, lever-co, ashby, smartrecruiters, workable, icims, workday, sap-successfactors, successfactors, eightfold), https://github.com/api-evangelist (third-party automated probes; low reliability; read from sibling scratch clones)

**Sibling notes and documents**
43. Phase 2 sibling agent working notes (scratchpad `notes_B`), recording vendor search excerpts from news.sap.com and community.sap.com about the SmartRecruiters roadmap and releases (not public; lead only)
44. `docs/competitive/AI_RECRUITING_LANDSCAPE.md` (Phase 2 sibling; AI features and regulation detail)

**Primary legal and standards sources (not fetched; statements are [UNVERIFIED])**
45. 41 CFR 60-1.12, Record retention, https://www.ecfr.gov/current/title-41/section-60-1.12
46. 41 CFR 60-1.3, Definitions (Internet Applicant), https://www.ecfr.gov/current/title-41/section-60-1.3
47. Executive Order 14173, "Ending Illegal Discrimination and Restoring Merit-Based Opportunity" (21 Jan 2025), Federal Register, https://www.federalregister.gov/d/2025-02097
48. US DOL OFCCP, https://www.dol.gov/agencies/ofccp
49. 29 CFR 1602.14, Preservation of records made or kept, https://www.ecfr.gov/current/title-29/section-1602.14
50. 29 CFR part 1607, Uniform Guidelines on Employee Selection Procedures, https://www.ecfr.gov/current/title-29/part-1607
51. 41 CFR 60-300.42 (VEVRAA invitation to self-identify) and 60-300.44(k), https://www.ecfr.gov/current/title-41/section-60-300.42
52. 41 CFR 60-741.42 (Section 503 invitation to self-identify) and 60-741.44(k); OFCCP self-ID form CC-305, https://www.ecfr.gov/current/title-41/section-60-741.42 and https://www.dol.gov/agencies/ofccp/self-id-forms
53. EEOC, EEO data collections (EEO-1), https://www.eeoc.gov/data/eeo-data-collections
54. Regulation (EU) 2016/679 (GDPR), https://eur-lex.europa.eu/eli/reg/2016/679/oj
55. UK ICO, UK GDPR guidance and resources, https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/
56. California Privacy Protection Agency, regulations (CCPA/CPRA incl. ADMT), https://cppa.ca.gov/regulations/ ; Cal. Civ. Code §1798.100 et seq.
57. Cal. Gov. Code §12946 (FEHA record retention), https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=GOV&sectionNum=12946
58. Cal. Labor Code §432.3 (pay scale disclosure), https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=LAB&sectionNum=432.3
59. NYC Commission on Human Rights (NYC Admin Code §8-107(32), salary transparency), https://www.nyc.gov/site/cchr/index.page
60. Colorado CDLE, Equal Pay for Equal Work Act (C.R.S. §8-5-201 et seq.), https://cdle.colorado.gov/dlss/equal-pay-for-equal-work-act
61. RCW 49.58.110 (Washington job posting pay disclosure), https://app.leg.wa.gov/RCW/default.aspx?cite=49.58.110
62. Directive (EU) 2023/970 (Pay Transparency), https://eur-lex.europa.eu/eli/dir/2023/970/oj
63. Directive (EU) 2019/882 (European Accessibility Act), https://eur-lex.europa.eu/eli/dir/2019/882/oj
64. Directive (EU) 2016/2102 (Web Accessibility Directive), https://eur-lex.europa.eu/eli/dir/2016/2102/oj
65. ETSI EN 301 549 V3.2.1, https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf
66. US Access Board, ICT (Section 508) standards, https://www.access-board.gov/ict/ (link as referenced by Section508.gov)
67. US DOJ, ADA Title II web and mobile accessibility rule, https://www.ada.gov/resources/2024-03-08-web-rule/
68. Regulation (EU) 2024/1689 (AI Act), https://eur-lex.europa.eu/eli/reg/2024/1689/oj
69. NYC DCWP, Automated Employment Decision Tools (Local Law 144 of 2021), https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page
70. Regulation (EU) 2024/2847 (Cyber Resilience Act), https://eur-lex.europa.eu/eli/reg/2024/2847/oj
71. EU–US Data Privacy Framework, https://www.dataprivacyframework.gov/
72. IETF RFC 7643 / RFC 7644 (SCIM 2.0), https://www.rfc-editor.org/rfc/rfc7643 and https://www.rfc-editor.org/rfc/rfc7644
73. OASIS SAML 2.0, https://docs.oasis-open.org/security/saml/v2.0/ ; OpenID Connect Core 1.0, https://openid.net/specs/openid-connect-core-1_0.html
74. CISA, Secure by Design Pledge, https://www.cisa.gov/securebydesign/pledge
75. ISO/IEC 27001, https://www.iso.org/standard/27001
76. Shared Assessments SIG, https://sharedassessments.org/sig/ ; CSA STAR, https://cloudsecurityalliance.org/star/ (the CSA link is also referenced on [20])
77. ITI, VPAT, https://www.itic.org/policy/accessibility/vpat
78. EDUCAUSE, HECVAT, https://www.educause.edu/hecvat
79. Canada: PIPEDA, https://laws-lois.justice.gc.ca/eng/acts/P-8.6/ ; Québec private-sector privacy act P-39.1 (Law 25 amendments), https://www.legisquebec.gouv.qc.ca/en/document/cs/P-39.1 ; Ontario Employment Standards Act, 2000, https://www.ontario.ca/laws/statute/00e41 ; British Columbia Pay Transparency Act (not linked)
80. OAIC, Australian Privacy Principles, https://www.oaic.gov.au/privacy/australian-privacy-principles
81. UK Data (Use and Access) Act 2025, https://www.legislation.gov.uk/ukpga/2025/18/contents (chapter number unverified)
82. Colorado SB24-205 (Consumer Protections for Artificial Intelligence), https://leg.colorado.gov/bills/sb24-205

[s1]: ../audit/PRODUCT_GAPS.md
[s2]: ../../Security.MD
[s3]: https://github.com/grnhse/greenhouse-api-docs
[s4]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/audit-log/_introduction.md
[s5]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/audit-log/_events.md
[s6]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_introduction.md
[s7]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_approvals.md
[s8]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_user_permissions.md
[s9]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_eeoc.md
[s10]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_candidates.md
[s11]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/harvest/_rejection_reasons.md
[s12]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/job-board/_jobs.md
[s13]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/job-board/_applications.md
[s14]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/webhooks/_introduction.md
[s15]: https://github.com/grnhse/greenhouse-api-docs/blob/master/source/layouts/layout.erb
[s16]: https://github.com/lever/postings-api/blob/master/README.md
[s17]: https://github.com/lever/postings-api/blob/master/SECURITY.md
[s18]: https://github.com/lever/integrator-resources
[s19]: https://github.com/FedRAMP/marketplace-fedramp-gov-data
[s20]: https://www.oracle.com/corporate/cloud-compliance/
[s21]: https://www.oracle.com/contracts/docs/ocloud_hosting_delivery_policies_3089853.pdf
[s22]: https://www.oracle.com/human-capital-management/recruiting/
[s23]: https://www.oracle.com/cloud/public-cloud-regions/
[s24]: https://github.com/w3c/wcag
[s25]: https://pages.nist.gov/800-63-4/sp800-63b.html
[s26]: https://github.com/GSA/Section508.gov/blob/main/_pages/acquisition/2018-05-29-sell-acr.md
[s27]: https://github.com/GSA/Section508.gov/blob/main/_pages/manage/2023-09-23-laws-and-policies.md
[s28]: https://github.com/OWASP/ASVS/tree/master/5.0/en
[s29]: https://support.greenhouse.io/hc/en-us/articles/210259723-Single-sign-on-SSO-overview
[s30]: https://support.greenhouse.io/hc/en-us/articles/9825388563483-Configure-SCIM-for-Okta
[s31]: https://support.greenhouse.io/hc/en-us/articles/35654588835867-Configure-SCIM-for-Microsoft-Entra-ID
[s32]: https://jumpcloud.com/support/integrate-with-greenhouse
[s33]: https://docs.pingidentity.com/configuration_guides/greenhouse/config_saml_greenhouse_p1.html
[s34]: https://www.stitchflow.com/scim/greenhouse
[s35]: https://www.pin.com/blog/greenhouse-pricing/
[s36]: PRICING_AND_PACKAGING.md
[s37]: https://docs.ashbyhq.com/sso-and-scim
[s38]: https://docs.ashbyhq.com/manage-access-roles
[s39]: https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/
[s40]: https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/smartrecruiters.com/smartrecruiters/201911.1
[s41]: https://github.com/jentic/jentic-public-apis/tree/main/apis/openapi/workable.com/main/3.0
[s42]: https://github.com/api-evangelist
[s43]: #10-sources
[s44]: AI_RECRUITING_LANDSCAPE.md
[s45]: https://www.ecfr.gov/current/title-41/section-60-1.12
[s46]: https://www.ecfr.gov/current/title-41/section-60-1.3
[s47]: https://www.federalregister.gov/d/2025-02097
[s48]: https://www.dol.gov/agencies/ofccp
[s49]: https://www.ecfr.gov/current/title-29/section-1602.14
[s50]: https://www.ecfr.gov/current/title-29/part-1607
[s51]: https://www.ecfr.gov/current/title-41/section-60-300.42
[s52]: https://www.ecfr.gov/current/title-41/section-60-741.42
[s53]: https://www.eeoc.gov/data/eeo-data-collections
[s54]: https://eur-lex.europa.eu/eli/reg/2016/679/oj
[s55]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/
[s56]: https://cppa.ca.gov/regulations/
[s57]: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=GOV&sectionNum=12946
[s58]: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=LAB&sectionNum=432.3
[s59]: https://www.nyc.gov/site/cchr/index.page
[s60]: https://cdle.colorado.gov/dlss/equal-pay-for-equal-work-act
[s61]: https://app.leg.wa.gov/RCW/default.aspx?cite=49.58.110
[s62]: https://eur-lex.europa.eu/eli/dir/2023/970/oj
[s63]: https://eur-lex.europa.eu/eli/dir/2019/882/oj
[s64]: https://eur-lex.europa.eu/eli/dir/2016/2102/oj
[s65]: https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf
[s66]: https://www.access-board.gov/ict/
[s67]: https://www.ada.gov/resources/2024-03-08-web-rule/
[s68]: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
[s69]: https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page
[s70]: https://eur-lex.europa.eu/eli/reg/2024/2847/oj
[s71]: https://www.dataprivacyframework.gov/
[s72]: https://www.rfc-editor.org/rfc/rfc7644
[s73]: https://docs.oasis-open.org/security/saml/v2.0/
[s74]: https://www.cisa.gov/securebydesign/pledge
[s75]: https://www.iso.org/standard/27001
[s76]: https://sharedassessments.org/sig/
[s77]: https://www.itic.org/policy/accessibility/vpat
[s78]: https://www.educause.edu/hecvat
[s79]: https://laws-lois.justice.gc.ca/eng/acts/P-8.6/
[s80]: https://www.oaic.gov.au/privacy/australian-privacy-principles
[s81]: https://www.legislation.gov.uk/ukpga/2025/18/contents
[s82]: https://leg.colorado.gov/bills/sb24-205
