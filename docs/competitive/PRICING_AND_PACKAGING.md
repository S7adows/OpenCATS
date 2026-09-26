# ATS Pricing & Packaging — Market Scan (Phase 2)

**Date:** 2026-09-25 · **Phase:** 2 (Competitive Market Research) · **Author role:** research agent · **Status:** partial coverage — see §2.3 and §9 before relying on any figure.

---

## 1. Scope

Pricing models and packaging of applicant tracking systems (ATS) that OpenCATS 2.0 will be compared against:

- **Corporate talent-acquisition ATS:** Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Jobvite, Recruitee, Teamtailor, Pinpoint.
- **Enterprise HCM suites and enterprise ATS:** iCIMS, Workday Recruiting, SAP SuccessFactors Recruiting, Oracle Recruiting.
- **Agency (staffing/recruitment-firm) ATS/CRM:** Bullhorn, Loxo, Recruit CRM.
- **Open-source / self-hostable reference points:** OrangeHRM, Odoo (recruitment app), legacy OpenCATS.
- **In scope but not verified in this session** (see §4.5): Manatal, Breezy HR, JazzHR, Zoho Recruit, BambooHR, Rippling, Gem, Dover, Homerun, Personio, the hosted/paid editions of Odoo and OrangeHRM, and CATS (catsone.com, the commercial descendant of the original CATS code).

For each vendor this document records, where an official source shows it: tier names, price, currency, billing unit, billing period, what is included and what is an add-on, limits, trial or free tier, and access date. It then analyses packaging patterns and draws implications for OpenCATS 2.0. It does not rank vendors and does not recommend price points.

---

## 2. Method

### 2.1 Source rules
- Official pricing is taken **only** from the vendor's own domain (pricing page, help centre, knowledge base, legal pages, price lists, official GitHub docs). Where a vendor says "contact sales" or only offers a quote, this document records **"not public"**.
- Third-party estimates (Vendr, G2, Capterra, vendor-competitor blogs, SEO comparison sites) are kept **only** in §5, "Third-party estimates (unverified)", and never mixed into the official columns.
- All access dates are **2026-09-25**.

### 2.2 Evidence tags
| Tag | Meaning in this document |
|---|---|
| **[FACT]** | Verified first-hand: in this repo (`path:line`) or in a file fetched and read directly (the vendor's official GitHub repos). |
| **[SOURCE CLAIM · vendor · excerpt]** | Text from the vendor's **own domain**, seen through a domain-restricted web search result excerpt. The page itself could **not** be fetched (see §2.3), so this is not tagged FACT. |
| **[SOURCE CLAIM · vendor · title]** | Only the page's existence, URL and title were seen. Its contents were not. |
| **[SOURCE CLAIM · third-party estimate]** | Independent or competitor-published estimate, unverified. Only in §5. |
| **[INFERENCE]** / **[RECOMMENDATION]** / **[UNKNOWN]** | As defined in the Phase 2 preamble. |

### 2.3 Environment limitations (material to reliability)
- **Direct page fetching was blocked** by the environment's network egress proxy for every vendor domain tried: greenhouse.com, ashbyhq.com, workable.com, lever.co, teamtailor.com, zoho.com, odoo.com, help.workable.com and support.greenhouse.io. Sibling Phase 2 agents recorded the same block for further vendor, press and review domains. **github.com and raw.githubusercontent.com were reachable.** [FACT]
- Evidence from vendor sites therefore comes from **search-engine result excerpts restricted to the vendor's domain**. These excerpts are machine-summarised, so paraphrasing errors are possible, and pricing tables rendered by JavaScript were usually **not** captured. Treat every "excerpt" item as needing re-verification in a browser before it is used externally. [INFERENCE]
- The session's **shared web-search budget (200 calls) ran out** partway through this assignment. As a result, 11 in-scope products and the paid or hosted editions of the two open-source products were **not researched** (§4.5). No figures are given for them. [FACT]
- Third-party GitHub "plans/pricing" files found in sibling scratch clones (API Evangelist repos for Gem and Rippling) state that they are **scaffold defaults** ("Tier limits and prices are scaffold defaults; replace with provider-published values") or were "written by … bulk sweep … not harvested from the provider". They were **not used**. [FACT]

---

## 3. Summary table

"Entry price" is filled in only when an official source showed a figure. "Not captured" means the official page may show a figure, but this session could not see it. "Not public" means the official source says to request a quote.

| Vendor | Public pricing? | Value metric (as stated by vendor) | Entry price if public | Enterprise gating / packaging notes | Evidence grade |
|---|---|---|---|---|---|
| **Greenhouse** | **No.** Quote-based across 3 tiers: Core, Plus, Pro | Plan, "hiring volume and organizational complexity", features required | Not public | AI, Notetaker, MCP (beta) and smarter scheduling are on **all three** tiers. API docs gate some fields to legacy "Advanced/Expert" packages or "Enterprise-level" accounts. Audit log is enabled through account management. | excerpt + first-hand API docs |
| **Lever** (Employ) | **No.** Custom quote | "team size and hiring needs" | Not public | "Every plan" includes ATS, CRM, advanced reporting/analytics and key integrations. "Advanced Nurture" is an add-on. | excerpt |
| **Ashby** | **Partial.** Foundations tier structure described; figures not captured | Foundations: total workforce size (<100 employees, 5 bands). Seat-based pricing (paid seats; limited-access and agency users free). AI credits. | Not captured | SSO on all plans incl. Foundations. SCIM on Plus and above. Custom roles: none on Foundations, up to 3 on Plus, unlimited on Enterprise. AI credits per seat. | excerpt |
| **SmartRecruiters** (SAP since 2025-09-11) | Free tier documented (SmartStart); paid tiers not captured | SmartStart: limited by active jobs (10) | SmartStart **free** (availability in 2026 **UNKNOWN**) | Paid tiers **UNKNOWN** | excerpt |
| **Workable** | Self-serve purchase by company size; figures not captured | "number of your employees" (company size selected) | Not captured | Standard is monthly. Premier and Enterprise are annual-only. Premier includes "all premium tools" (video interviews, texting, assessments). HR package optional. | excerpt |
| **Jobvite** (Employ) | **No.** Custom quote | Organisation size **and estimated annual hires** | Not public | Modular: core ATS plus add-ons (Onboarding, AI Companion, recruitment marketing) | excerpt |
| **Recruitee** (Tellent) | Figures not captured | Plan × organisation size × billing period | Not captured | Top tier (Optimize) adds SSO, fuller API, requisition approvals, unlimited custom fields, BI integrations and higher AI quotas. SSO, Texting and Onboarding are also add-ons. | excerpt |
| **Teamtailor** | **Undetermined.** Official page content not captured | **UNKNOWN** (third parties contradict each other; §5) | Not captured | **UNKNOWN**. Partner docs distinguish "Always included" vs "Premium" job-board feeds. | page title + first-hand partner docs |
| **Pinpoint** | **No.** Quote on request | Organisation size and hiring volume. "No per-hiring-manager seat charge and no cap on the number of users." | Not public | **UNKNOWN** | excerpt |
| **iCIMS** | **No** pricing page found; demo/quote route | Not stated | Not public | **UNKNOWN** | excerpt |
| **Workday Recruiting** | **No** | Not stated for Recruiting. Workday says it "historically" priced by employees. AI is sold via usage-based "Flex Credits". | Not public | AI metered separately from headcount | excerpt |
| **SAP SuccessFactors Recruiting** | Official pricing page and SAP Store listing exist; figures not captured | Users (excerpt: "minimum order quantity is 250 users") | Not captured | Excerpt: contract "1 to 3 years with auto-renewal". SAP now markets recruiting as "SmartRecruiters for SAP SuccessFactors". | excerpt |
| **Oracle Recruiting** | **Yes, list price published** in Oracle's Fusion Cloud Global Price List; figure not retrieved | **Hosted Employee per month** (counts every person record incl. contractors) | Not retrieved | Sold as a Fusion HCM cloud service (part B87675) | excerpt (price-list PDF not readable here) |
| **Bullhorn** | **Yes** (small-agency tiers) | **Per user per month** | **Starter US$99/user/month**; Core US$165/user/month; Pro and Max custom | Core adds app marketplace, LinkedIn integration and custom workflows. Pro adds CRM and "Amplify" AI. Max adds agentic screening and automated AI matching. Free implementation on Starter/Core/Pro. | excerpt |
| **Loxo** | **Likely.** Page says "pricing shown is on an annual basis"; figures not captured | **UNKNOWN** | Free plan exists | Professional adds AI agents, Outreach, client portal and parent/child instances. Enterprise is custom. | excerpt |
| **Recruit CRM** | **Yes** | **Per user (provisioned seat)**, monthly or annual | **From US$99/user/month billed annually** | Business adds SSO and email sequencing. Enterprise adds workflow automation, advanced analytics, job multiposting and white-labelling. | excerpt |
| **OrangeHRM** (Starter, open source) | Licence cost $0 for self-hosting; paid editions **UNKNOWN** | n/a (self-hosted) | $0 licence | GPL "Starter" repo ships Recruitment, LDAP and OpenID authentication plugins | first-hand (GitHub) |
| **Odoo** (Community recruitment app) | Licence cost $0 (LGPL-3); hosted and Enterprise pricing **UNKNOWN** | UNKNOWN | $0 licence | UNKNOWN | first-hand (GitHub) |
| **OpenCATS (legacy baseline)** | Free (MPL-2.0 / CPL-1.1a) | Vestigial seat licence counting only users **above READ access** | $0 | n/a | first-hand (this repo) |

---

## 4. Per-vendor detail

Each block lists **Official** items first and then **Evidence**. Third-party numbers are only in §5.

### 4.1 Corporate talent-acquisition ATS

#### Greenhouse
- **Tiers and price:** three tiers, **Core, Plus and Pro**. Pricing is "quote-based pricing depending on company size and needs". Cost "is influenced by the plan you choose (Core, Plus or Pro), your hiring volume and organizational complexity, and the features and capabilities required" [[1]](https://www.greenhouse.com/pricing) (accessed 2026-09-25). **Not public.** [SOURCE CLAIM · vendor · excerpt]
- **Tier positioning:** a search result described Core as "essential hiring tools", Plus as adding "automation, advanced configuration and deeper reporting", and Pro as "enterprise-grade governance, security, analytics and extensibility". That result mixed official and third-party pages, so the wording is **not attributed to Greenhouse with certainty**. [SOURCE CLAIM · unattributed excerpt]
- **Included on all tiers:** Greenhouse AI, Greenhouse Notetaker and smarter interview scheduling are available on Core, Plus and Pro. The Greenhouse MCP server is in open beta "available to all Site Admins on Greenhouse's new tiers (Core, Plus, and Pro)" [[2]](https://www.greenhouse.com/greenhouse-latest-features) [[3]](https://www.greenhouse.com/product-features/greenhouse-mcp) [[4]](https://www.greenhouse.com/product-features/smarter-interview-scheduling) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Historic gating visible in official API docs.** The official `grnhse/greenhouse-api-docs` repo (commit `271cd88`, 2026-09-10) shows the following [[5]](https://github.com/grnhse/greenhouse-api-docs) (accessed 2026-09-25). [FACT]
  - Tiered offices and tiered departments are "available only for customers with the Advanced or Expert Greenhouse Recruiting package" (`source/includes/harvest/_offices.md:438`, `_departments.md:383`).
  - `external_id` on offices and departments is "Expert" only (`_offices.md:440`, `_departments.md:385`).
  - `employee_id` on users is "Advanced and Expert" (`_users.md:856`).
  - "Custom Fields on the application object are only available to customers with Enterprise-level accounts" (`harvest/_introduction.md:159`).
  - On 2023-10-30, language restricting "Anonymize Candidate" to the Expert tier was removed (`harvest/_introduction.md:200`).
  - The **Audit Log API** (prior 30 days) is enabled by "reach[ing] out" to account management (`audit-log/_introduction.md:2,7`).
- **Interpretation:** the phrase "new tiers" together with the legacy "Advanced/Expert" names in the API docs suggests Greenhouse re-tiered recently, from an older ladder to Core/Plus/Pro. How legacy tiers map to the new ones is **UNKNOWN**. [INFERENCE]
- **Trial and free tier:** none observed. [UNKNOWN]

#### Lever (Employ)
- **Price:** "Lever pricing requires contacting Lever directly for a custom quote. Pricing scales with your team size and hiring needs." **Not public.** No tier names were observed [[6]](https://www.lever.co/pricing) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Included:** "Every plan includes core applicant tracking system, candidate relationship management, advanced reporting and analytics, and key integrations" [[6]](https://www.lever.co/pricing). The product is branded LeverTRM (ATS + CRM) [[7]](https://www.lever.co/lever-trm) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Add-on:** "Advanced Nurture add-on" (shared templates; email campaigns to up to 50 candidates at once) [[6]](https://www.lever.co/pricing). [SOURCE CLAIM · vendor · excerpt]
- **Ownership:** Employ, Inc. describes itself as parent of JazzHR, Lever and Jobvite [[39]](https://www.employinc.com/demo/) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]

#### Ashby
- **Tiers:** **Foundations**, **Plus** and **Enterprise**. Legacy Plus also appears in the knowledge base [[8]](https://www.ashbyhq.com/pricing) [[11]](https://docs.ashbyhq.com/sso-and-scim) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Value metric, Foundations:** "for companies with fewer than 100 employees, priced based on their total workforce size with 5 simple pricing tiers" [[8]](https://www.ashbyhq.com/pricing). Figures were **not captured**. [SOURCE CLAIM · vendor · excerpt]
- **Value metric, seat-based pricing:** "Customers are billed for users who have been provisioned a paid seat … other user types such as limited access users and agency users are free." Ashby positions this as aligning "to your team's hiring needs rather than just the scale of your company" and eliminating "black-box pricing surprises at renewal" [[9]](https://docs.ashbyhq.com/seat-based-pricing) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
  - Which plans are seat-based versus employee-banded is **not stated** in the excerpt. [UNKNOWN] The Enterprise AI allotment is expressed "per seat" (below), which suggests seat-based billing at least for Enterprise. [INFERENCE]
- **AI monetisation:** "AI credits are included across all Ashby all-in-one plans". Most AI features are unlimited, but data-intensive ones (AI-assisted application review, candidate fraud detection, AI talent rediscovery) consume credits. "As of September 25th, 2025, enterprise customers have a new, higher baseline of **12,500 AI credits per seat per year**." There is also an "AI Notetaker bundle" [[10]](https://docs.ashbyhq.com/ai-credits) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Gating** [[11]](https://docs.ashbyhq.com/sso-and-scim) [[12]](https://docs.ashbyhq.com/manage-access-roles) (accessed 2026-09-25) [SOURCE CLAIM · vendor · excerpt]:
  - **SSO** can be configured on Foundations, Legacy Plus, Plus and Enterprise, i.e. **not gated**.
  - **SCIM:** Legacy Plus, Plus and Enterprise only, **not Foundations**.
  - **Custom access roles:** Foundations can only edit the external-recruiter role; Plus and Legacy Plus can modify roles and create **up to three** custom roles; Enterprise can create **unlimited** roles.
- A feature-by-plan page exists [[13]](https://docs.ashbyhq.com/which-features-are-available-on-each-ashby-all-in-one-plan). Its contents beyond the items above were not captured. [SOURCE CLAIM · vendor · title]

#### SmartRecruiters (SAP)
- **Ownership:** SAP completed its acquisition of SmartRecruiters on **2025-09-11**. SmartRecruiters customers "maintain the flexibility to continue using SmartRecruiters solutions with SAP or other HCM solutions" [[22]](https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/) [[23]](https://www.smartrecruiters.com/news/sap-completes-acquisition-of-smartrecruiters/) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt] SAP's recruiting product page is now titled "AI Recruiting Software & ATS │ SmartRecruiters for SAP SuccessFactors" [[24]](https://www.sap.com/products/hcm/recruiting-software.html). [SOURCE CLAIM · vendor · title]
- **Free tier:** "SmartStart is entirely free with an unlimited number of users and candidates, with the only limit being **10 active jobs** at any point in time … recommended for businesses with up to 250 employees" [[20]](https://www.smartrecruiters.com/news/smartrecruiters-releases-smartstart/). Separate SmartStart terms exist [[21]](https://www.smartrecruiters.com/legal/terms-and-conditions-smartstart/) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt] **Whether SmartStart is still offered after the SAP acquisition is UNKNOWN.** The excerpts came partly from `prod-*` mirror hostnames and a launch news post.
- **Paid tiers:** a "Talent Acquisition Suite Pricing" page exists [[19]](https://www.smartrecruiters.com/pricing/). Tier names, prices and metric were **not captured**. [UNKNOWN]

#### Workable
- **Tiers:** **Standard**, **Premier** and **Enterprise**. **Starter** is "a legacy plan … no longer available to new customers" [[15]](https://help.workable.com/hc/en-us/articles/115011955988-Workable-plans-packages-and-pricing) [[16]](https://help.workable.com/hc/en-us/articles/7566723534487-Starter-plan-FAQs) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Value metric:** "The pricing is calculated based on the number of your employees … Company size helps estimate expected usage, such as the number of active jobs, candidates, and overall activity" [[15]](https://help.workable.com/hc/en-us/articles/115011955988-Workable-plans-packages-and-pricing) [[18]](https://help.workable.com/hc/en-us/articles/4418591102743-Purchasing-a-Workable-plan). [SOURCE CLAIM · vendor · excerpt]
- **Billing period and packaging** [SOURCE CLAIM · vendor · excerpt]:
  - Standard is "a monthly plan that offers unlimited active jobs (sized for your company) and the option to purchase the HR package".
  - Premier is "available only for an annual subscription, and includes all premium tools at no extra cost".
  - Enterprise is annual-only.
- **Add-ons:** a help article is titled "Recruiting premium tools pricing (Video interviews, Texting, and Assessments)" [[17]](https://help.workable.com/hc/en-us/articles/11615114447127-Recruiting-premium-tools-pricing-Video-interviews-Texting-and-Assessments) [SOURCE CLAIM · vendor · title]. Premier's inclusion of "all premium tools" implies these are **paid add-ons below Premier**. [INFERENCE]
- **AI:** the pricing page title is "Workable Pricing | Recruiting, HR & AI Agent Plans" [[14]](https://www.workable.com/pricing) [SOURCE CLAIM · vendor · title]. The contents of any "AI agent" plans are **UNKNOWN**.
- **Figures:** not captured. A self-serve purchase flow exists [[18]](https://help.workable.com/hc/en-us/articles/4418591102743-Purchasing-a-Workable-plan), which implies prices are shown at purchase time. [INFERENCE] Trial terms: **UNKNOWN**.

#### Jobvite (Employ)
- **Price:** "flexible, scalable pricing tailored to your hiring needs … pricing varies based on your organization's size and the **estimated number of annual hires**". Custom quote; **not public** [[38]](https://www.jobvite.com/pricing/) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Packaging:** "modular approach where you can start with the core Jobvite applicant tracking system (ATS) and add modules like Onboarding, AI Companion, and recruitment marketing software" [[38]](https://www.jobvite.com/pricing/). [SOURCE CLAIM · vendor · excerpt]
- **Portfolio positioning by Employ:** "JazzHR for speed with budget-friendly pricing …; Lever for growth …; Jobvite for complexity with enterprise-grade compliance, advanced analytics, and recruitment marketing" [[39]](https://www.employinc.com/demo/). [SOURCE CLAIM · vendor · excerpt]

#### Recruitee (Tellent)
- **Tiers:** **Start**, **Advance** and **Optimize**. These replaced the Launch/Scale/Lead plans in a 2024 pricing migration [[40]](https://recruitee.com/pricing) [[44]](https://support.recruitee.com/en/articles/8494460-faq-pricing-migration-2024) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Value metric and terms:** "Pricing is based on the plan you choose …, your organization's size, and your billing period. Paying annually gives you a 20% discount. All plans require a **minimum one-year commitment**, with the option to pay monthly" [[40]](https://recruitee.com/pricing) [[43]](https://support.recruitee.com/en/articles/8194963-faq-billing-subscription). A help article is titled "**5% price increase upon contract renewal**" [[42]](https://support.recruitee.com/en/articles/8549123-5-price-increase-upon-contract-renewal). [SOURCE CLAIM · vendor · excerpt/title]
- **Packaging** [[41]](https://support.recruitee.com/en/articles/9263941-feature-comparison-for-subscription-changes) (accessed 2026-09-25) [SOURCE CLAIM · vendor · excerpt]:
  - **Advance:** unlimited job posts; multi-page careers site; multi-location/multi-language; referrals; candidate self-scheduling; structured evaluation forms; offer-letter generation; AI screening (**100 credits/month**); AI matching (**3 searches/month**); advanced reporting.
  - **Optimize:** SSO, API, requisition approval workflows, unlimited custom fields, full AI screening, AI matching (**65 searches/month**), BI integrations.
  - "Optional add-ons are available for SSO, Texting, and Onboarding." "More comprehensive API support is only available to our Optimize plans."
- **Figures:** not captured (EUR or other currency). [UNKNOWN]

#### Teamtailor
- An official pricing page exists [[45]](https://www.teamtailor.com/en/pricing/), but **its content was not captured** in any excerpt. Tiers, metric and figures are **UNKNOWN**. [SOURCE CLAIM · vendor · title]
- **Job distribution packaging:** Teamtailor's official partner docs (`teamtailor/tt-partner-docs`, commit `cba212f`, 2026-09-09) describe an "**Always included XML feed**" (all job ads from customers who activated the integration) and a "**Premium XML feed**" containing "all job ads selected by the user to promote" (`source/includes/job_boards/_integration_types.md.erb`) [[46]](https://github.com/teamtailor/tt-partner-docs) (accessed 2026-09-25). [FACT] Who charges for "Premium" promotion, and how, is not stated. [UNKNOWN]

#### Pinpoint
- **Price:** "Pinpoint pricing is tailored to your organization's size and hiring needs, so we quote on request rather than publishing a fixed price. There's **no per-hiring-manager seat charge and no cap on the number of users**" [[47]](https://www.pinpointhq.com/pricing/) [[48]](https://www.pinpointhq.com/request-pricing) (accessed 2026-09-25). **Not public.** [SOURCE CLAIM · vendor · excerpt]
- A Pinpoint-domain page cites "procurement-tracker data" of roughly $6–8 per employee per month. This is a **vendor page quoting a third party**, so it is listed in §5 and not treated as an official price.

### 4.2 Enterprise ATS and HCM suites

#### iCIMS
- No pricing page was returned for icims.com. The purchase route is a demo or quote [[31]](https://www.icims.com/see-it-in-action/), plus a "value calculator" [[32]](https://www.icims.com/resources/value-calculator/) (accessed 2026-09-25). **Not public.** [SOURCE CLAIM · vendor · excerpt]
- An iCIMS blog gives a **generic market range** for cloud recruiting CRMs ("$15 to $100 or more for each user per month") and notes that "some vendors charge extra fees for data migration, implementation, priority support, or additional data storage" [[33]](https://www.icims.com/blog/best-recruitment-crm-platforms/). This is **not** an iCIMS price. [SOURCE CLAIM · vendor · excerpt]
- Packaging, gating and value metric: **UNKNOWN**.

#### Workday Recruiting
- **Price:** no Recruiting price published. The talent-acquisition product page has no pricing [[34]](https://www.workday.com/en-us/products/talent-management/talent-acquisition.html). **Not public.** [SOURCE CLAIM · vendor · excerpt]
- **Value metric:** a Workday blog says Workday "has historically operated on an employee-based model, which ties pricing to the total number of employees" [[36]](https://blog.workday.com/en-us/usage-based-ai-pricing.html) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **AI monetisation:** "Workday **AI Flex Credits** … charge for the work AI completes on your behalf, not the number of employees … investment tied to usage, not headcount" [[35]](https://www.workday.com/en-us/artificial-intelligence/ai-flex-credits.html) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- A Workday SMB explainer gives generic HRIS guidance of "$5 to $20 per employee each month on essentials and $30 to $50" with more modules [[37]](https://www.workday.com/en-us/topics/smb/hris-for-small-business.html). This is **market guidance, not a Workday price list**. [SOURCE CLAIM · vendor · excerpt]

#### SAP SuccessFactors Recruiting
- An official "Plans and Pricing" page [[25]](https://www.sap.com/products/hcm/recruiting-software/pricing.html) and an SAP Store listing [[26]](https://store.sap.com/dcp/en/product/000000000008900037/sap-successfactors-recruiting) exist. The excerpt reported "**minimum order quantity is 250 users**, and contract duration is **1 to 3 years with auto-renewal**" (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt] The price figure and currency were **not captured**. The billing unit appears to be users, but the excerpt did not state it verbatim. [UNKNOWN]
- Packaging now includes SmartRecruiters (see above). How SuccessFactors Recruiting and SmartRecruiters SKUs relate commercially is **UNKNOWN**.

#### Oracle Recruiting (Fusion Cloud Recruiting)
- **Public list price exists.** Oracle publishes a "Fusion Cloud Service Global Price List" (a version dated September 10, 2026 was indexed) [[27]](https://www.oracle.com/a/ocom/docs/corporate/pricing/oracle-fusion-cloud-global-price-list.pdf). Oracle Fusion Recruiting Cloud Service (part **B87675**) uses the **Hosted Employee** metric (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt] **The figure itself was not retrieved** because the PDF was not readable in this environment. [UNKNOWN]
- **Metric definition:** Hosted Employee "counts every Person regardless of Person Type tracked in your Fusion cloud service during the month reported, including Employees, Agents, Contractors, and Consultants", each counted once, excluding single-type "Retiree"/"Not Managed by HR" [[28]](https://docs.oracle.com/en/cloud/saas/j4s/famet/metric-descriptions-fusion-offerings.pdf) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt] A reseller listing sells the unit as "subscription license – 1 hosted employee" [[30]](https://www.cdw.com/product/oracle-fusion-recruiting-cloud-service-subscription-license-1-hosted-em/9133548). [SOURCE CLAIM · reseller · title]

### 4.3 Agency (staffing / recruitment-firm) ATS/CRM

#### Bullhorn
- **Tiers and price** [[49]](https://www.bullhorn.com/small-agency-software/pricing/) [[50]](https://bullhorn.com/pricing/) (accessed 2026-09-25) [SOURCE CLAIM · vendor · excerpt]:
  - **Starter: $99 per user per month.** "A complete ATS with resume parsing, candidate management, job posting with a career portal, email sync, mass mailing, and performance reports".
  - **Core: $165 per user per month.** Adds "the app marketplace, LinkedIn integration, and custom workflows" and custom fields.
  - **Pro: custom.** Adds "a full recruitment CRM" plus Amplify AI (AI search and match, Amplify Chat, AI data enrichment, process automation, AI resume formatting, AI call transcription), real-time analytics and a dedicated account manager.
  - **Max: custom.** "Highest tier": omni-channel candidate engagement, agentic screening and automated AI matching.
- **Currency** is shown as "$" on the US-oriented page (USD presumed). **Billing period and commitment:** **UNKNOWN**.
- **Fees:** "No setup fees. No hidden costs." "Free implementation with Bullhorn Starter, Core, and Pro" [[49]](https://www.bullhorn.com/small-agency-software/pricing/). [SOURCE CLAIM · vendor · excerpt]
- **Metric:** "per user, per month, and you only pay for the users you need". [SOURCE CLAIM · vendor · excerpt]

#### Loxo
- **Tiers:** Free, a mid tier and Professional, plus a custom Enterprise tier. Excerpts disagree on the mid-tier name: "Basic" in one, "Starter" in another [[51]](https://www.loxo.co/pricing) [[52]](https://www.loxo.co/blog/loxo-pricing-plans) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Packaging** [SOURCE CLAIM · vendor · excerpt]:
  - **Mid tier:** adds Sales CRM, organic job-board posting, multiple users, custom dashboards, analytics, resume parsing, support and reporting.
  - **Professional:** adds Loxo Source (unlimited), natural-language search, AI Notetaker, AI agents, Loxo Outreach (omni-channel campaigns), account-based prospecting, client portal, client report generator and parent/child instances.
  - **Enterprise:** custom.
- **Free tier:** a freemium help article [[53]](https://help.loxo.co/en/articles/2822187-freemium-plan) and a 2023 CEO note titled "Loxo Now Offers Enterprise-Grade ATS + Recruiting CRM Free, Forever" [[54]](https://www.loxo.co/blog/note-from-the-ceo-march-2023). [SOURCE CLAIM · vendor · title]
- **Figures:** the page states "Pricing shown is on an annual basis for new Loxo customers", which implies figures are displayed [INFERENCE]. They were **not captured**, and the billing unit is **UNKNOWN**.

#### Recruit CRM
- **Tiers:** **Pro**, **Business** and **Enterprise** [[55]](https://recruitcrm.io/pricing/) (accessed 2026-09-25). [SOURCE CLAIM · vendor · excerpt]
- **Price:** "starting at **$99 per user per month (billed annually)**". Business and Enterprise figures were not captured. [SOURCE CLAIM · vendor · excerpt]
- **Billing:** "You can either pay monthly or annually. With monthly billing, you're charged for your **provisioned seats** at the beginning of each billing cycle. The Annual billing option charges you a discounted per-month rate upfront for the whole year" [[56]](https://help.recruitcrm.io/en/articles/4033085-managing-your-recruit-crm-subscription). [SOURCE CLAIM · vendor · excerpt]
- **Packaging** [SOURCE CLAIM · vendor · excerpt]:
  - **Pro:** Chrome sourcing extension, AI resume parsing, GPT integration, AI sourcing, **unlimited open jobs**.
  - **Business:** adds automated email sequencing, executive-search report generator and **single sign-on (SSO)**.
  - **Enterprise:** adds workflow automation, advanced analytics, LinkedIn messaging integration, data enrichment, "Recruit Craft", job multiposting, **white-labelling**, a dedicated account manager and advanced customisation.

### 4.4 Open-source / self-hostable reference points

#### OrangeHRM (open-source "Starter")
- The official `orangehrm/orangehrm` repo README describes "**OrangeHRM Starter**" under the **GNU General Public License** (GPLv3 or later) [[58]](https://github.com/orangehrm/orangehrm) (accessed 2026-09-25). [FACT]
- `src/plugins/` includes `orangehrmRecruitmentPlugin`, `orangehrmLDAPAuthenticationPlugin`, `orangehrmOpenidAuthenticationPlugin` and `orangehrmCoreOAuthPlugin` [[58]](https://github.com/orangehrm/orangehrm/tree/main/src/plugins). [FACT] The presence of an OpenID authentication plugin in the GPL edition suggests the free edition offers federated login. This was **not functionally verified**. [INFERENCE]
- Paid editions, hosted offer and prices: **not verified** (vendor site not reachable; search budget exhausted). [UNKNOWN]

#### Odoo (Community recruitment app)
- The official `odoo/odoo` repo is published under **LGPLv3** [[59]](https://raw.githubusercontent.com/odoo/odoo/master/LICENSE). `addons/hr_recruitment/__manifest__.py` declares `'name': "Recruitment"`, `'summary': "Track your recruitment pipeline"`, `'license': "LGPL-3"`, depending on `hr, calendar, utm, attachment_indexation, web_tour, digest` [[59]](https://raw.githubusercontent.com/odoo/odoo/master/addons/hr_recruitment/__manifest__.py) (accessed 2026-09-25). [FACT]
- Odoo Online / Odoo.sh hosting and Enterprise pricing: **not verified** (odoo.com blocked). [UNKNOWN]

#### OpenCATS legacy (baseline)
- **Licence:** "OpenCATS code is under Mozilla Public License 2.0; original code from the 'CATS Project' circa 2007 is under CATS Public License Version 1.1a" (`LICENSE.md:1-5`). [FACT]
- **Vestigial commercial packaging:**
  - Seat licensing: `Users::getLicenseData()` counts users with `access_level > ACCESS_LEVEL_READ` against `site.user_licenses`, and 0 means unlimited (`lib/Users.php:873-915`; `db/cats_schema.sql:990`). **Read-only users were not counted as seats.** [FACT]
  - The "Professional" upsell and licence-key checks are neutered and marked RETIRE (`docs/audit/FEATURE_INVENTORY.md` §4 row 22, "Professional / upgrade" row). The licence key is sent in a phone-home and exposed unauthenticated (FEAT-012). The seat-licence wizard has a bug (FEAT-019). [FACT, per Phase 0 audit]

### 4.5 In scope but NOT verified in this session
Manatal, Breezy HR, JazzHR, Zoho Recruit, BambooHR, Rippling, Gem, Dover, Homerun, Personio and CATS (catsone.com), plus the paid and hosted editions of Odoo and OrangeHRM. Direct fetches were blocked and the shared search budget ran out before these could be checked. **No pricing is asserted for them.** [UNKNOWN] The only related statement observed is Employ's positioning of JazzHR as "budget-friendly" [[39]](https://www.employinc.com/demo/). [SOURCE CLAIM · vendor · excerpt]

---

## 5. Third-party estimates (unverified)

Everything in this section is **[SOURCE CLAIM · third-party estimate]**. It comes from search-result syntheses of third-party pages; the specific page behind each number could not always be isolated. Several sources are competitor blogs (Pin, Dover, Compono, Noon, Truffle), which are **weak sources**. Figures are shown only to indicate order of magnitude and must not be quoted as vendor prices.

| Vendor | Claim | Where it appeared (independent / competitor) | Notes |
|---|---|---|---|
| Greenhouse | Core (<50 employees) ~$6k–10k/yr; Plus (200-person company) ~$12k–18k/yr; Pro from ~$24.5k/yr; "median contract $12,250/yr"; pricing "based on headcount rather than seat count" | Synthesis of [61] pin.com, [62] compono.com, [63] Capterra, [64] roles.at | Contradicts nothing official, but the official page names hiring volume and complexity as drivers, not headcount alone |
| Greenhouse | "$5.1K–$75.9K/yr" | [64] roles.at (page title) | Range only |
| Ashby | Foundations "starts at $400/month … covers up to 100 employees"; ~10% annual discount; annual contracts, "no free trial"; email lookup capped at 200/month on Foundations; AI Notetaker and Advanced Scheduling as paid add-ons | Synthesis of [65] pin.com, [66] costbench, [67] leonstaff, [68] dover.com (competitor), [69] G2 | The "<100 employees" band matches the official excerpt; the $ figure does not appear in any official excerpt |
| Ashby | "$4,800 to $250K" per year | [67] leonstaff (page title) | Range only |
| Teamtailor | "$2,750–$72,000+/yr based on job slots"; "price steps up as you cross headcount bands (1–25, 26–100, 101–250, 250+)"; Vendr average contract ~$16.5k–17k/yr; "3–8% annual renewal escalators" | Synthesis of [70] Vendr, [71] pin.com, [72] roles.at, [73] compono.com | **Internally contradictory** on value metric (job slots vs headcount). Also claims Teamtailor "doesn't publish any pricing", which is unverified. |
| Pinpoint | ~$6–8 per employee per month | Cited as "procurement-tracker data" on a pinpointhq.com page [47] | Vendor citing a third party |
| Oracle Recruiting | $0.44 or $0.51 per Hosted Employee per month in one public-sector contract document; "most buyers negotiate 25–55% off list" | [74] school-district board document (not read); [75] advisory sites (UpperEdge, ERP Research) | A negotiated customer price, **not** the list price. The document was not opened. |
| iCIMS (generic) | Cloud recruiting CRMs cost "$15 to $100 or more per user per month" | iCIMS blog [33] | Generic market range written by a vendor |

---

## 6. Pattern analysis

All statements in this section are **[INFERENCE]** drawn from §4 and §5 unless otherwise tagged.

### 6.1 Price transparency splits by segment
- **Agency tools publish per-seat prices.** Bullhorn (Starter/Core) and Recruit CRM (from $99/user/month) show figures. Loxo states that its page shows annual pricing and has a free tier. Agency buyers are small firms that buy per recruiter.
- **Corporate TA ATS are mostly quote-based or self-serve by company size.** Greenhouse, Lever, Jobvite and Pinpoint are explicitly quote-only. Workable, Ashby (Foundations) and Recruitee price by company-size band, with self-serve or annual terms.
- **Enterprise suites use formal price books with volume minimums and multi-year terms.** Oracle publishes list prices per Hosted Employee. SAP shows a pricing page with a 250-user minimum and 1–3-year auto-renewing contracts (per the excerpt). Workday Recruiting is not public. In this segment, list price is a starting point for negotiation (§5 Oracle row).
- **Official figures were captured for only 2 of 16 commercial vendors** in this session (Bullhorn, Recruit CRM). Six were confirmed quote-only. For the other eight, figures exist or may exist but were not captured. Market-wide conclusions about price levels are therefore **not** drawn here.

### 6.2 Value metrics in use
| Metric | Where observed (official unless noted) | Who it favours |
|---|---|---|
| **Employee headcount / company-size band** | Workable ("number of your employees"); Ashby Foundations (workforce size, 5 bands); Recruitee (organisation size); Pinpoint and Lever ("size"/"team size"); Workday (historically); Greenhouse (third-party claim) | Predictable for the vendor; grows with the customer's headcount even if hiring does not |
| **Hosted employee (all person records)** | Oracle (includes contractors, agents, consultants) | Suite vendors whose HCM already counts people |
| **Recruiter seat / paid user** | Bullhorn, Recruit CRM (provisioned seats), Ashby seat-based pricing (limited-access and agency users free), SAP (users, 250 minimum) | Agencies and small TA teams. It aligns cost with who does the work. |
| **Hiring volume / hires** | Jobvite ("estimated number of annual hires"); Greenhouse ("hiring volume") | High-volume employers pay more; better alignment with value delivered |
| **Active jobs (as a limit, not a price)** | SmartRecruiters SmartStart (10 active jobs free); Workable Standard ("unlimited active jobs, sized for your company"); Recruitee Advance ("unlimited job posts"); Recruit CRM Pro ("unlimited open jobs") | Job caps mostly survive as **free-tier limits**. Paid tiers advertise "unlimited jobs". |
| **Usage credits (AI)** | Ashby AI credits (per seat per year on Enterprise); Workday AI Flex Credits; Recruitee monthly AI screening credits and matching searches | Metered AI layered **on top of** the base metric |

**Observed shift:** two vendors explicitly moved away from pure headcount pricing:
- Ashby's seat-based pricing claims it avoids "black-box pricing surprises at renewal".
- Workday prices AI by usage "not headcount".

At least some vendors are therefore treating headcount-only pricing as a sales objection to overcome. The "free non-recruiter users" pattern appears at Ashby (limited-access and agency users free) and Pinpoint (no per-hiring-manager charge). The legacy CATS seat licence also counted only users above READ access (`lib/Users.php:873-915`).

### 6.3 What is gated to higher tiers
| Capability | Evidence of gating | Counter-evidence |
|---|---|---|
| **SSO** | Recruitee: Optimize or paid add-on. Recruit CRM: Business and above. | **Ashby: SSO on all plans incl. Foundations.** OrangeHRM GPL edition ships an OpenID auth plugin. |
| **SCIM / user provisioning** | Ashby: Plus and above | — |
| **Custom roles / permissions** | Ashby: none on Foundations, 3 on Plus, unlimited on Enterprise | — |
| **API depth** | Recruitee: "more comprehensive API support only … Optimize". Greenhouse: some Harvest fields restricted to Advanced/Expert/Enterprise packages. | Lever says every plan includes "key integrations" |
| **Audit log** | Greenhouse: enabled on request through account management (tier not stated) | — |
| **Custom fields / workflows** | Bullhorn Core+ (custom workflows/fields). Recruitee Optimize (unlimited custom fields). Greenhouse application custom fields: Enterprise-level. | — |
| **Requisition approvals** | Recruitee Optimize | — |
| **Advanced analytics / BI** | Recruitee Optimize (BI integrations). Recruit CRM Enterprise (advanced analytics). Bullhorn Pro (real-time analytics). | Lever: "advanced reporting and analytics" in every plan |
| **AI** | Bullhorn Pro/Max (Amplify, agentic screening). Loxo Professional (AI agents). Recruitee quotas by tier. | **Greenhouse: AI on all tiers.** Ashby: most AI unlimited on all plans, credits only for data-heavy features. |
| **White-label / client portal (agency)** | Recruit CRM Enterprise (white-label). Loxo Professional (client portal, parent/child instances). | — |
| **Sandbox** | Not observed in any captured excerpt | **UNKNOWN** |

**Pattern:** governance features (SCIM, custom roles, audit, approvals, BI, deep API) are the most consistent gates. SSO is **contested**: some vendors gate it, while Ashby includes it at entry level. AI is split. Some vendors use it as a top-tier upsell (Bullhorn, Loxo). Others include it everywhere and meter only heavy usage (Greenhouse, Ashby).

### 6.4 Add-on modules
- **Candidate communications:** Workable premium tools (video interviews, texting, assessments); Recruitee Texting; Lever Advanced Nurture.
- **Onboarding:** Jobvite module; Recruitee add-on; Workable HR package.
- **AI:** Jobvite AI Companion; Ashby AI Notetaker bundle and AI credits; Workday Flex Credits.
- **Recruitment marketing / CRM:** Jobvite recruitment-marketing module. For Bullhorn, CRM is only included from Pro. Lever and Ashby bundle CRM in every plan.
- **Job distribution:** Teamtailor partner docs separate "Always included" and "Premium" (promoted) feeds. Promotion is a distinct, likely paid, channel. Pricing per job slot or credit was **not verified** for any vendor.

### 6.5 Implementation fees and contract terms
- **Implementation:** Bullhorn advertises free implementation and "no setup fees" for its small-agency tiers. No other vendor's implementation fee was captured [UNKNOWN]. iCIMS' blog says some vendors charge for migration, implementation, priority support and storage (generic).
- **Commitment:**
  - Recruitee: one-year minimum, 20% annual discount, and a 5% renewal-increase help article.
  - Workable: Premier and Enterprise annual-only; Standard monthly.
  - SAP: 1–3 years with auto-renewal, 250-user minimum (excerpt).
  - Recruit CRM: monthly or annual.
  - Third parties report annual-only contracts for Ashby and 3–8% renewal escalators at Teamtailor (unverified).
- **Pattern:** annual commitment with built-in renewal uplifts is common in the SMB/mid-market ATS segment. Monthly billing survives mainly at the lowest tier.

### 6.6 Free tiers and open source
- The free tiers observed are **SmartRecruiters SmartStart** (10 active jobs; availability after the SAP acquisition UNKNOWN) and **Loxo Free**.
- Among open-source HR suites, **OrangeHRM Starter (GPL)** and **Odoo Community (LGPL)** both ship a recruitment module that can be self-hosted at zero licence cost. Their commercial offers (hosting and paid editions) were not verified.
- The fetched GitHub sources show these projects monetise *around* an open core. The shape of that monetisation (hosting, support, proprietary modules) is **UNKNOWN** in this session.

---

## 7. Implications for OpenCATS 2.0

All items are **[RECOMMENDATION]** unless tagged otherwise. No price points are proposed.

### 7.1 Open core vs paid features (the "SSO tax" question)
1. **Keep identity and security baseline in the open core.** SSO (OIDC and SAML), MFA, secure credential lifecycle, basic RBAC and a tamper-evident audit log should be free. These close Phase 0's CRITICAL/HIGH gaps (`PRODUCT_GAPS.md` GAP-001, GAP-003, GAP-011) and are a precondition for deploying safely at all.
   - Market evidence that this is viable: Ashby includes SSO even on Foundations, and OrangeHRM's GPL edition ships LDAP and OpenID plugins (§6.3).
   - Legacy OpenCATS already gives LDAP away for free (`FEATURE_INVENTORY.md` "LDAP / AD auth").
   - Gating SSO would put the free product *below* its own legacy baseline and below open-source peers.
2. **If there is a paid tier, draw the line at scale and governance, not safety.** The market's most consistent gates are candidates:
   - SCIM provisioning;
   - unlimited custom roles and field-level policies;
   - audit-log export or streaming to a SIEM;
   - sandbox or staging environments;
   - requisition approval chains;
   - BI connectors and data-warehouse sync;
   - agency white-labelling and multi-client portals;
   - high-availability or managed operations tooling.

   Each needs a documented rationale in an ADR (`RECOMMENDED_ROADMAP.md` 1F-5).
3. **Licensing mechanics must fit MPL-2.0 / CPL-1.1a.** MPL-2.0 is file-level copyleft, so separately licensed modules are structurally possible [INFERENCE; requires legal review, not legal advice]. Whatever is chosen, **do not revive licence-key enforcement or phone-home in the core**. The legacy mechanism is neutered, leaks the key and is marked RETIRE (FEAT-012, `FEATURE_INVENTORY.md` §4 row 22).
4. **Publish the packaging boundary.** In this market, prices are mostly opaque (§6.1). A clear, public statement of what is free, what is paid and why is a low-cost differentiator for an open-source product. It also matches buyer frustration with "black-box pricing" that Ashby itself uses in its positioning.

### 7.2 Hosting model options
Present these as options for ADR 1F-4 (`RECOMMENDED_ROADMAP.md`); do not pick one here.

| Option | Description | Fit | Notes |
|---|---|---|---|
| A. Self-hosted OSS only | Container images and migrations; community support | Existing OpenCATS users; privacy-sensitive agencies | No revenue; relies on community |
| B. Self-hosted + paid support/LTS | Same code, with an optional support subscription, security LTS or migration help | Agencies migrating legacy data (`DATABASE_AUDIT.md`) | Value metric must be verifiable without telemetry (see 7.3) |
| C. Managed single-tenant cloud | Operated instance per customer | Mid-market and agencies needing data isolation or residency | Aligns with the single-vs-multi-tenant decision (DB-012) |
| D. Multi-tenant SaaS | Shared platform | SMB self-serve | Requires real tenancy (`site_id` is vestigial per the audit), metering and billing |
| E. Partner-hosted | Certified hosting partners | Regional or agency markets | Needs a trademark and certification policy |

### 7.3 Which value metric fits
- **For self-hosting:** any metric must be **honour-system or contract-based**, because the core must not phone home (7.1.3).
  - *Paid user seats with free limited users* (interviewers, hiring managers, read-only, client contacts) is the simplest to state and audit. It mirrors both the legacy CATS rule (only users above READ counted, `lib/Users.php:873-915`) and the market pattern (Ashby, Pinpoint).
  - Per-employee pricing is hard to verify on-premises and is meaningless for agencies. [INFERENCE]
- **For agency use:** **recruiter seats** are the market norm (Bullhorn, Recruit CRM). Headcount or "hires" metrics do not map to an agency's economics: an agency's placements are not its employees. [INFERENCE] White-labelling and client portals are the main agency upsells observed (Recruit CRM, Loxo).
- **For corporate TA (if targeted per ADR 1F-1):** buyers are used to company-size bands (Workable, Ashby, Recruitee). A hosted offer may need to support bands as an alternative metric without changing the open core.
- **For AI:** treat AI as **metered usage on top of** the base metric (Ashby credits, Workday Flex Credits, Recruitee quotas). For self-hosters, support **bring-your-own model or API key** so that AI cost is not a licensing question (`PRODUCT_GAPS.md` GAP-024).
- **For job distribution:** if multiposting is built (GAP-015), keep job-board promotion costs as pass-through or partner-billed. Do not use them as a core licence metric (§6.4).

### 7.4 What not to copy
- Tier-gating **scorecards, structured feedback or basic reporting**. These are core hiring hygiene in OpenCATS' gap list (GAP-007, GAP-014), and some vendors include them broadly (Lever: advanced reporting in every plan).
- **Opaque renewal escalators** as a revenue lever. If a hosted offer exists, state renewal terms publicly.

---

## 8. Facts vs Inferences

- **FACT (first-hand):**
  - Egress block and search-budget exhaustion (§2.3).
  - Greenhouse API-doc gating lines and audit-log enablement (`grnhse/greenhouse-api-docs@271cd88`).
  - Teamtailor "Always included" vs "Premium" feed types (`teamtailor/tt-partner-docs@cba212f`).
  - OrangeHRM GPL "Starter" and its plugin list.
  - Odoo LGPL-3 licence and `hr_recruitment` manifest.
  - OpenCATS licences and legacy seat-licence logic (`LICENSE.md`, `lib/Users.php:873-915`, `db/cats_schema.sql:990`).
  - API Evangelist plan files are scaffolds.
- **SOURCE CLAIM · vendor · excerpt (official-domain text, not fetched):**
  - Every tier name, price, metric, contract term and gating statement for Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Jobvite, Recruitee, Pinpoint, iCIMS, Workday, SAP, Oracle, Bullhorn, Loxo and Recruit CRM.
  - The two captured official figures (Bullhorn US$99/US$165 per user per month; Recruit CRM from US$99 per user per month billed annually) fall in this category.
  - SAP completed its SmartRecruiters acquisition on 2025-09-11 (SAP and SmartRecruiters press, excerpt).
- **SOURCE CLAIM · third-party estimate:** everything in §5.
- **INFERENCE:**
  - Greenhouse re-tiering.
  - Workable add-ons sit below Premier.
  - Ashby Enterprise is seat-billed.
  - Segment transparency split, metric shift and gating patterns (§6).
  - Suitability of metrics for self-hosting and agencies (§7.3).
  - MPL-2.0 enabling separately licensed modules (needs legal review).
- **RECOMMENDATION:** §7 only.

---

## 9. Unknowns

1. **All figures not captured:**
   - Ashby Foundations bands;
   - Workable Standard/Premier;
   - Recruitee Start/Advance/Optimize;
   - Loxo tiers;
   - Recruit CRM Business/Enterprise;
   - SAP SuccessFactors Recruiting per-user price;
   - Oracle Recruiting list price per Hosted Employee (in the public Global Price List PDF);
   - SmartRecruiters paid tiers;
   - Teamtailor (everything).

   Re-verify in a normal browser.
2. **Vendors not researched (§4.5):** Manatal, Breezy HR, JazzHR, Zoho Recruit, BambooHR, Rippling, Gem, Dover, Homerun, Personio, CATS One, and Odoo/OrangeHRM hosted and paid editions. SMB and agency vendors in this list are the most likely to publish self-serve prices [INFERENCE], so they should be checked first.
3. Whether **SmartRecruiters SmartStart** is still offered after the SAP acquisition.
4. How **Greenhouse legacy tiers** (Advanced/Expert/Enterprise) map to Core/Plus/Pro, and which tier includes the audit log, SCIM and custom roles.
5. Billing period and commitment for **Bullhorn** small-agency tiers; the Bullhorn Max price and scope.
6. **Sandbox gating** and **implementation fees** for all vendors except Bullhorn.
7. Currency and regional price variation. Only "$" figures on US-oriented pages were seen.
8. Whether search excerpts accurately paraphrase the underlying pages. Machine-summarised excerpts carry a risk of error, and every excerpt-based item needs a browser check before external use.
9. Legal interpretation of MPL-2.0 / CPL-1.1a for any open-core split (ADR 1F-5).

---

## 10. Sources

All accessed **2026-09-25**. "Excerpt" means only a domain-restricted search-result excerpt was seen, because the page could not be fetched. "Title" means only the URL and title were seen. "First-hand" means fetched or read directly.

**Official / vendor**
1. Greenhouse, "Plans & Pricing | Core, Plus & Pro", https://www.greenhouse.com/pricing (vendor; excerpt)
2. Greenhouse, "New AI Recruiting Features", https://www.greenhouse.com/greenhouse-latest-features (vendor; excerpt)
3. Greenhouse, "Greenhouse MCP", https://www.greenhouse.com/product-features/greenhouse-mcp (vendor; excerpt)
4. Greenhouse, "Smarter Interview Scheduling", https://www.greenhouse.com/product-features/smarter-interview-scheduling (vendor; excerpt)
5. Greenhouse, `grnhse/greenhouse-api-docs` @271cd88 (2026-09-10), https://github.com/grnhse/greenhouse-api-docs (official developer docs source; first-hand clone in Phase 2 scratchpad)
6. Lever, "Pricing Plans & Custom Quotes", https://www.lever.co/pricing (vendor; excerpt)
7. Lever, "LeverTRM", https://www.lever.co/lever-trm (vendor; excerpt)
8. Ashby, "Pricing", https://www.ashbyhq.com/pricing (vendor; excerpt)
9. Ashby Knowledge Base, "Seat-based Pricing", https://docs.ashbyhq.com/seat-based-pricing (vendor docs; excerpt)
10. Ashby Knowledge Base, "AI Credits", https://docs.ashbyhq.com/ai-credits (vendor docs; excerpt)
11. Ashby Knowledge Base, "SSO and SCIM", https://docs.ashbyhq.com/sso-and-scim (vendor docs; excerpt)
12. Ashby Knowledge Base, "Manage Access Roles", https://docs.ashbyhq.com/manage-access-roles (vendor docs; excerpt)
13. Ashby Knowledge Base, "Which features are available on each Ashby All-In-One Plan?", https://docs.ashbyhq.com/which-features-are-available-on-each-ashby-all-in-one-plan (vendor docs; title)
14. Workable, "Workable Pricing | Recruiting, HR & AI Agent Plans", https://www.workable.com/pricing (vendor; title/excerpt)
15. Workable Help, "Workable plans, packages and pricing", https://help.workable.com/hc/en-us/articles/115011955988-Workable-plans-packages-and-pricing (vendor docs; excerpt)
16. Workable Help, "Starter plan FAQs", https://help.workable.com/hc/en-us/articles/7566723534487-Starter-plan-FAQs (vendor docs; excerpt)
17. Workable Help, "Recruiting premium tools pricing (Video interviews, Texting, and Assessments)", https://help.workable.com/hc/en-us/articles/11615114447127-Recruiting-premium-tools-pricing-Video-interviews-Texting-and-Assessments (vendor docs; title)
18. Workable Help, "Purchasing a Workable plan", https://help.workable.com/hc/en-us/articles/4418591102743-Purchasing-a-Workable-plan (vendor docs; excerpt)
19. SmartRecruiters, "Talent Acquisition Suite Pricing", https://www.smartrecruiters.com/pricing/ (vendor; title)
20. SmartRecruiters, "SmartRecruiters Releases SmartStart" (news), https://www.smartrecruiters.com/news/smartrecruiters-releases-smartstart/ (vendor press; excerpt; also served on prod-ohio/prod-syd mirrors)
21. SmartRecruiters, "SmartStart Customer Terms and Conditions", https://www.smartrecruiters.com/legal/terms-and-conditions-smartstart/ (vendor legal; title)
22. SAP News Center, "SAP Completes Acquisition of SmartRecruiters", https://news.sap.com/2025/09/sap-completes-smartrecruiters-acquisition/ (vendor press; excerpt)
23. SmartRecruiters, "SAP Completes Acquisition of SmartRecruiters…", https://www.smartrecruiters.com/news/sap-completes-acquisition-of-smartrecruiters/ (vendor press; excerpt)
24. SAP, "AI Recruiting Software & ATS │ SmartRecruiters for SAP SuccessFactors", https://www.sap.com/products/hcm/recruiting-software.html (vendor; title)
25. SAP, "Plans and Pricing | SAP SuccessFactors Pricing" (Recruiting), https://www.sap.com/products/hcm/recruiting-software/pricing.html (vendor; excerpt)
26. SAP Store, "SAP SuccessFactors Recruiting", https://store.sap.com/dcp/en/product/000000000008900037/sap-successfactors-recruiting (vendor store; excerpt)
27. Oracle, "Oracle Fusion Cloud Service Global Price List" (September 10, 2026 edition indexed), https://www.oracle.com/a/ocom/docs/corporate/pricing/oracle-fusion-cloud-global-price-list.pdf (vendor price list; title/excerpt, figures not retrieved)
28. Oracle, "Metric Descriptions for Oracle Fusion Offerings" (August 26, 2026), https://docs.oracle.com/en/cloud/saas/j4s/famet/metric-descriptions-fusion-offerings.pdf (vendor docs; excerpt)
29. Oracle, "Fusion Cloud Service Descriptions", https://www.oracle.com/contracts/docs/oracle-fusion-cloud-service-desc-1843611.pdf (vendor contract docs; title)
30. CDW, "Oracle Fusion Recruiting Cloud Service – subscription license – 1 hosted employee – B87675", https://www.cdw.com/product/oracle-fusion-recruiting-cloud-service-subscription-license-1-hosted-em/9133548 (reseller; title)
31. iCIMS, "Get a Free Demo", https://www.icims.com/see-it-in-action/ (vendor; excerpt)
32. iCIMS, "Value Calculator", https://www.icims.com/resources/value-calculator/ (vendor; excerpt)
33. iCIMS blog, "Best recruitment CRM: Top 7 platforms…", https://www.icims.com/blog/best-recruitment-crm-platforms/ (vendor blog; excerpt; generic market range)
34. Workday, "Talent Acquisition and Recruiting Software", https://www.workday.com/en-us/products/talent-management/talent-acquisition.html (vendor; title)
35. Workday, "Workday AI Flex Credits | Transparent AI Pricing", https://www.workday.com/en-us/artificial-intelligence/ai-flex-credits.html (vendor; excerpt)
36. Workday blog, "Workday's Journey to Usage-Based AI Pricing", https://blog.workday.com/en-us/usage-based-ai-pricing.html (vendor blog; excerpt)
37. Workday, "Understanding HRIS for small and midsize businesses", https://www.workday.com/en-us/topics/smb/hris-for-small-business.html (vendor explainer; excerpt; generic market guidance)
38. Jobvite, "Jobvite Pricing", https://www.jobvite.com/pricing/ (vendor; excerpt)
39. Employ, "Request a Demo", https://www.employinc.com/demo/ (vendor; excerpt)
40. Tellent Recruitee, "Pricing", https://recruitee.com/pricing (vendor; excerpt)
41. Recruitee Help Center, "Feature comparison for subscription changes", https://support.recruitee.com/en/articles/9263941-feature-comparison-for-subscription-changes (vendor docs; excerpt)
42. Recruitee Help Center, "5% price increase upon contract renewal", https://support.recruitee.com/en/articles/8549123-5-price-increase-upon-contract-renewal (vendor docs; title)
43. Recruitee Help Center, "FAQ – Billing & Subscription", https://support.recruitee.com/en/articles/8194963-faq-billing-subscription (vendor docs; excerpt)
44. Recruitee Help Center, "FAQ – Pricing Migration 2024", https://support.recruitee.com/en/articles/8494460-faq-pricing-migration-2024 (vendor docs; excerpt)
45. Teamtailor, "Pricing", https://www.teamtailor.com/en/pricing/ (vendor; title only)
46. Teamtailor, `teamtailor/tt-partner-docs` @cba212f (2026-09-09), `source/includes/job_boards/_integration_types.md.erb`, https://github.com/teamtailor/tt-partner-docs (official partner docs; first-hand clone in Phase 2 scratchpad)
47. Pinpoint, "Request Pricing", https://www.pinpointhq.com/pricing/ (vendor; excerpt)
48. Pinpoint, "Pinpoint ATS Pricing: Request a Custom Quote", https://www.pinpointhq.com/request-pricing (vendor; excerpt)
49. Bullhorn, "Staffing Software Pricing for Small Agencies", https://www.bullhorn.com/small-agency-software/pricing/ (vendor; excerpt)
50. Bullhorn, "Bullhorn Pricing: Recruitment Software Plans for Staffing Agencies", https://bullhorn.com/pricing/ (vendor; excerpt)
51. Loxo, "Pricing Overview", https://www.loxo.co/pricing (vendor; excerpt)
52. Loxo blog, "Loxo Pricing: Choosing the Right Plan For You", https://www.loxo.co/blog/loxo-pricing-plans (vendor blog; excerpt)
53. Loxo Help Center, "Loxo's Freemium Plan", https://help.loxo.co/en/articles/2822187-freemium-plan (vendor docs; title)
54. Loxo blog, "Note from the CEO: Loxo Now Offers Enterprise-Grade ATS + Recruiting CRM Free, Forever", https://www.loxo.co/blog/note-from-the-ceo-march-2023 (vendor blog; title)
55. Recruit CRM, "Pricing", https://recruitcrm.io/pricing/ (vendor; excerpt)
56. Recruit CRM Help Center, "Managing Your Recruit CRM Subscription", https://help.recruitcrm.io/en/articles/4033085-managing-your-recruit-crm-subscription (vendor docs; excerpt)
57. Recruit CRM Help Center, "Business Plan", https://help.recruitcrm.io/en/articles/4827097-business-plan (vendor docs; title)
58. OrangeHRM, `orangehrm/orangehrm` README and `src/plugins/` listing, https://github.com/orangehrm/orangehrm (official repo; first-hand)
59. Odoo, `odoo/odoo` LICENSE and `addons/hr_recruitment/__manifest__.py`, https://raw.githubusercontent.com/odoo/odoo/master/LICENSE and https://raw.githubusercontent.com/odoo/odoo/master/addons/hr_recruitment/__manifest__.py (official repo; first-hand)
60. OpenCATS (this repo): `LICENSE.md:1-5`; `lib/Users.php:873-915`; `db/cats_schema.sql:990`; `docs/audit/FEATURE_INVENTORY.md` (FEAT-012, FEAT-019, "Professional / upgrade", §4 row 22); `docs/audit/PRODUCT_GAPS.md` (GAP-001/003/007/011/014/015/024); `docs/audit/RECOMMENDED_ROADMAP.md` (1F-1, 1F-4, 1F-5) (first-hand)

**Third-party (used only in §5; unverified)**

61. Pin (competitor blog), "Greenhouse Pricing 2026", https://www.pin.com/blog/greenhouse-pricing/ (lead only)
62. Compono (competitor guide), "Greenhouse pricing 2026", https://www.compono.com/articles/greenhouse-pricing-buyers-guide-2026 (lead only)
63. Capterra, "Greenhouse Pricing 2026", https://www.capterra.com/p/133100/Greenhouse/pricing/ (review aggregate)
64. RolesAt, "Greenhouse ATS Pricing: $5.1K–$75.9K/yr (2026)", https://roles.at/compare/greenhouse-pricing (comparison site; lead only)
65. Pin (competitor blog), "Ashby ATS Pricing 2026", https://www.pin.com/blog/ashby-pricing/ (lead only)
66. Costbench, "Ashby Pricing 2026: Plans from $400/month", https://costbench.com/software/ai-recruiting/ashby/ (comparison site; lead only)
67. Leon Consulting, "Ashby ATS Pricing 2026: $4,800 to $250K", https://leonstaff.com/blogs/ashby-ats-pricing/ (consultancy blog; lead only)
68. Dover (competitor blog), "Ashby ATS: Pricing & Alternatives", https://www.dover.com/blog/ashby-ats-review-pricing-alternatives (lead only)
69. G2, "Ashby Pricing 2026", https://www.g2.com/products/ashby-ashby/pricing (review aggregate)
70. Vendr, "Teamtailor Software Pricing & Plans", https://www.vendr.com/marketplace/teamtailor (procurement marketplace; buyer-reported data)
71. Pin (competitor blog), "Teamtailor Pricing 2026", https://www.pin.com/blog/teamtailor-pricing/ (lead only)
72. RolesAt, "Teamtailor Pricing 2026", https://roles.at/compare/teamtailor-pricing (comparison site; lead only)
73. Compono (competitor guide), "Teamtailor Pricing 2026", https://www.compono.com/articles/teamtailor-pricing-2026-buyers-guide (lead only)
74. Washoe County School District board document (Oracle SaaS pricing attachment), https://washoeschools.community.diligentoneplatform.com/document/b83a6b28-e4ab-4dc0-bec1-62ff5eb43bd6/ (public-sector document; not opened; excerpt only)
75. UpperEdge, "Key Subscription Provisions for an Oracle Fusion HCM Negotiation", https://upperedge.com/oracle/key-subscription-provisions-for-an-oracle-fusion-hcm-negotiation/ and ERP Research, https://www.erpresearch.com/en-us/oracle-erp-fusion-cloud-pricing (advisory; excerpt; discount-range claim)
