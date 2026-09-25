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
10. **[RECOMMENDATION]** OpenCATS 2.0 needs an explicit **"enterprise-evaluable" bar**: SSO+MFA, a scoped RBAC with field masks, an append-only audit log, privacy lifecycle tooling, an EEO/OFCCP module, structured pay ranges, WCAG 2.2 AA plus an ACR, a versioned API with signed webhooks, and a security evidence pack. This must be in place **before** feature parity work. Any hosted offering additionally needs SOC 2 Type II, a DPA and EU/US regions (§7).

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
| ER-18 | Encryption in transit (TLS 1.2+) and at rest; field-level encryption of special-category data; key management | Security | GDPR Art. 32 security of processing [[54]][s54] (UV); ASVS V11/V12 [[28]][s28] (F) | GH and LV APIs are HTTPS-only (GH returns 401/403 over HTTP) [[4]][s4][[6]][s6] (F). At-rest details: U | TABLE STAKE | No at-rest or column encryption; no DB TLS; no HSTS (DB-011; SEC-015; SEC-018) | HIGH |
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
