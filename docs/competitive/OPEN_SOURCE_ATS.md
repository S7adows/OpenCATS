# Open-Source and Source-Available ATS Landscape (Phase 2)

**Date:** 2026-09-25 · **Phase:** 2, competitive market research · **Status:** research draft, for internal decision-making only
**Baseline:** OpenCATS fork `S7adows/OpenCATS` at audited commit `d607279`, with Phase 0 docs in `docs/audit/`.

> **Verification status.** Every **[FACT]** here comes from something read directly: this repository, a GitHub-hosted repository (a shallow or blob-less `git clone`, `git ls-remote`, raw files, GitHub search-API metadata) or a page actually fetched. Most vendor websites (odoo.com, orangehrm.com, docs.frappe.io, horilla.com, twenty.com, reqcore.com, glozo.com, wikipedia.org and others) were **blocked by the environment's egress proxy**. Nothing was routed around the block. Pricing, cloud-plan contents and enterprise-edition feature lists that are published only on those sites are therefore **[UNKNOWN]** unless a GitHub-hosted file states them. Claims taken from search excerpts are labelled `· search excerpt`. Verify them in a browser before any external publication.

---

## 1. Scope

The research covers:
- **Standalone open-source or source-available ATS projects** that are active or were launched between 2022 and 2026: Reqcore, OpenATS, SpotAxis, CandidATS, Nueno, Plutomi and OSSAdmiral Recruit. It also records why "Canditrack" and "Twenty-based recruiting" are not listed as products.
- **Recruitment modules inside open-source ERP, HRMS and work platforms:** Odoo, Frappe HR (formerly the ERPNext HR module), OrangeHRM, Horilla, Ever Gauzy, Dolibarr, Axelor, AureusERP, MintHCM, IceHrm, Sentrifugo and Huly.
- **Upstream OpenCATS** (`opencats/OpenCATS`), treated as a reference point and a source of divergence risk for our fork.
- **Adjacent open-source building blocks** that an ATS rebuild might use: scheduling, search, e-signature, identity, document and resume parsing, video, and automation.
- **Licensing and business models**, and what they imply for OpenCATS 2.0 (`LICENSE.md`; `docs/audit/RISKS.md` RISK-017).

Out of scope:
- Commercial SaaS ATS vendors, which are covered by other Phase 2 files.
- Job-seeker tools. Resume builders and job trackers appear only where they matter as building blocks.

**No ranking.** This document records facts and differences. It does not name a "best" project.

## 2. Method

1. **Discovery.** The first step was GitHub repository search through the GitHub search API. Queries covered topics `applicant-tracking-system` and `ats`, the text "open source ATS", recruitment repositories pushed after 2025-06-01, and named repositories. A small number of WebSearch queries were also run; the session's WebSearch budget ran out partway through, so no further web searches were possible.
2. **Repository evidence.** For each candidate:
   - A read-only `git clone --depth 1 --filter=blob:none` went into the scratchpad. OpenCATS upstream, IceHrm and Cal.com got a full history without blobs, so that license and activity history could be read.
   - Files were read from the clones: README, LICENSE, CHANGELOG, module trees, manifests and data-model files.
   - `git ls-remote` was used for tags and branches.
   - The GitHub search API supplied stars, forks, `open_issues_count` (issues plus PRs), `pushed_at`, `archived` and the detected SPDX identifier.
   - **No code was executed or installed.** No build, install or setup script was run.
3. **License identification.** GitHub's detected SPDX identifier was cross-checked against the LICENSE text. When GitHub reports `NOASSERTION`, the LICENSE file was read and the result is described in words (for example "LGPL-3.0 (Community) + proprietary Enterprise").
4. **Feature coverage.** Features were judged from **code and data-model evidence** (module and doctype directories, entity classes) and official docs hosted on GitHub. For small projects, README feature lists are recorded as **[SOURCE CLAIM · project README]**.
5. **OpenCATS baseline.** OpenCATS is compared through Phase 0 IDs (`PRODUCT_GAPS.md` GAP-xxx, `FEATURE_INVENTORY.md` FEAT-xxx, `RISKS.md` RISK-xxx).
6. **Evidence grades.** The grades are [FACT], [SOURCE CLAIM · vendor/project · (search excerpt)], [SOURCE CLAIM · independent · search excerpt], [INFERENCE], [RECOMMENDATION] and [UNKNOWN], as defined in the Phase 2 PREAMBLE and its addendum.
7. **Untrusted content.** Some READMEs contain instructions aimed at AI agents or operators. None were followed; they are noted here as findings:
   - The OrangeHRM README has a section "Using AI coding agents … Open the repo in your coding agent and just say Hi" ([source 25](https://github.com/orangehrm/orangehrm) (accessed 2026-09-25)).
   - The Reqcore README contains `curl … setup.sh` install steps ([source 10](https://github.com/symut/reqcore) (accessed 2026-09-25)).

---

## 3. Summary table

**Legend:**
- **OSI?** asks whether all code in the public repository is under an OSI-style open-source license.
  - "Open core" means an OSS core plus source-available or proprietary paid parts.
  - "Source-available" means the source can be read but use is restricted.
- **Activity** is the date of the last commit on the default branch, taken from a clone. Stars, forks and open counts come from the GitHub search API. All values are as of 2026-09-25.

| # | Project | Category | License (from LICENSE file) | OSI? / model | Organisation behind it | Stack | Last commit · latest tag | Stars / forks / open (issues+PRs) | Deployment | Business model |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **OpenCATS upstream** (`opencats/OpenCATS`) | Standalone ATS (agency) | MPL-2.0 (OpenCATS code) + CATS Public License 1.1a (original 2005–07 code) | Mixed: CPL 1.1a has field-of-use terms (see §6.5) | Community; 2 people made 169 of 172 non-bot commits in the last 12 months | PHP (now ^8.4.1), MySQL/MariaDB, server-rendered | 2026-09-21 · `v0.11.1` (2026-09-03) | 753 / 322 / 96 (90 issues + 6 PRs) | Self-host; Docker files in repo | None found (no company, no paid tier) |
| 2 | **Reqcore** (`reqcore-inc/reqcore`) | Standalone ATS (AI shortlisting) | AGPL-3.0 core + `ee/` "Reqcore Enterprise Edition License" (source-available) | Open core. Main repo is **no longer publicly reachable** (404) | Reqcore Inc. | Nuxt 4 / Vue 3, Nitro, PostgreSQL 16, Drizzle | Last public code seen: fork `symut/reqcore` 2026-08-09; `v1.6.0` (2026-07-18) in CHANGELOG | Archive repo: 3 / 3 / 0 | Hosted SaaS; self-host was "best-effort, DIY" | Per-active-role SaaS plans in README ($0 / $79 / $239 / $599 per month, Agency by quote) |
| 3 | **OpenATS** (`chamals3n4/OpenATS`) | Standalone ATS | Apache-2.0 | Yes | Individual maintainer | Next.js, Express 5, Postgres/Drizzle, BullMQ | 2026-09-14 · `v0.5.0` | 32 / 15 / 0 | Self-host (needs external SaaS services) | None stated |
| 4 | **SpotAxis** (`Assystant/SpotAxis`) | Standalone ATS | MIT | Yes | Assystant (company) | Python 2.7, Django 1.9.5 | 2025-10-06 · no tags | 31 / 32 / 12 | Self-host | Implementation support by e-mail |
| 5 | **CandidATS** (SourceForge) | Standalone ATS (OpenCATS descendant, per a user review) | SourceForge lists GPLv3, MPL 1.1, MPL 2.0 | Probably yes; not verified | candidats.net | PHP | Last update 2022-08-10 · 3.0.0 | n/a (3 downloads that week) | Self-host | Free installation offered (search excerpt) |
| 6 | **Nueno** (`nueno-co/nueno`) | Standalone ATS | AGPL-3.0 | Yes | Nueno | TypeScript | 2022-05-07 | 268 / 44 / 17 | Self-host | Not known |
| 7 | **Plutomi** (`plutomi/plutomi`) | Standalone "applicant management" | Apache-2.0 | Yes | Individual | Rust (Axum), Remix, MySQL | 2024-12-12; README says "WIP" | 72 / 16 / 43 | Not known | Not known |
| 8 | **OSSAdmiral Recruit** | Standalone ATS | AGPL-3.0 | Yes | Individual | Laravel 10, Filament 3 | Archived; pushed 2025-02-03 | 54 / 38 / 21 | Self-host | — |
| 9 | **Odoo Recruitment** (`odoo/odoo` `addons/hr_recruitment`) | ERP module | Community: LGPL-3.0. Enterprise: "Odoo Enterprise Edition License v1.0" (proprietary) | Open core | Odoo S.A. | Python, PostgreSQL, OWL JS | 2026-09-25 · default branch `20.0` (version 20.0 FINAL) | 54,596 / 33,832 / 10,532 | Self-host; Odoo-hosted (not verified) | Enterprise subscription plus in-app-purchase credits (for example résumé digitisation) |
| 10 | **Frappe HR** (`frappe/hrms`) | HRMS module | GPL-3.0 (framework `frappe/frappe` is MIT) | Yes | Frappe Technologies | Python, Frappe framework, Vue (Frappe UI), MariaDB | 2026-09-25 · `v16.20.0` | 8,824 / 2,739 / 467 | Self-host, Docker; Frappe Cloud (managed) | Managed hosting (Frappe Cloud); support |
| 11 | **ERPNext** (`frappe/erpnext`) | ERP (recruitment moved to Frappe HR from v14) | GPL-3.0 | Yes | Frappe Technologies | as above | 2026-09-25 · `v16.36.0` | 39,543 / 12,941 / 1,767 | as above | as above |
| 12 | **OrangeHRM Starter** (`orangehrm/orangehrm`) | HRMS module | GPL-3.0-or-later | Yes (the "Starter" edition) | OrangeHRM Inc. | PHP (Symfony 5.4 components), Vue 3 | 2026-06-29 · `v5.9` | 1,144 / 753 / 110 | Self-host, Docker | Paid editions implied by the "Starter" name; details not verified |
| 13 | **Horilla HRMS** (`horilla/horilla-hr`) | HRMS module | LGPL-2.1 | Yes | Horilla (company) | Python, Django 5, HTMX | 2026-09-25 · `2.1.7` (2026-09-16) | 1,435 / 926 / 126 | Self-host, official Docker image | "Professional Support" (enterprise support, custom development) |
| 14 | **Ever Gauzy** (`ever-co/ever-gauzy`) | Business platform (ERP/CRM/HRM/ATS) | AGPL-3.0 Community, or commercial "Small Business" / "Enterprise" licenses | Dual licensing | Ever Co. LTD | TypeScript, NestJS, Angular | 2026-09-25 | 7,953 / 1,182 / 457 | Self-host, Docker, Kubernetes; SaaS (README: "Alpha") | Commercial licenses (sold by revenue band) plus SaaS |
| 15 | **Dolibarr** (`Dolibarr/dolibarr`) | ERP/CRM module | GPL-3.0-or-later | Yes | Dolibarr association and community | PHP | 2026-09-25 · `24.0.1` | 7,657 / 3,537 / 1,011 | Self-host; third-party SaaS | Partner ecosystem, third-party SaaS offers |
| 16 | **Axelor Open Suite** (`axelor-talent`) | ERP module | AGPL-3.0 | Yes | Axelor (company) | Java | 2026-09-17 · `v9.1.8` | 977 / 741 / 199 | Self-host | Not verified |
| 17 | **AureusERP** (`plugins/webkul/recruitments`) | ERP module (launched 2025) | MIT | Yes | Webkul Software | PHP 8.3+, Laravel 13, Filament 5 | 2026-09-22 · `v1.6.0` | 11,986 / 572 / 35 | Self-host; "AureusERP Cloud Hosting" | Managed hosting, support |
| 18 | **MintHCM** (`minthcm/minthcm`) | HCM (built on SuiteCRM) | AGPL-3.0 | Yes; README says "no gated features" | Not verified | PHP | 2026-09-22 · `4.3.3` | 440 / 92 / 1 | Self-host, Docker | Not verified |
| 19 | **IceHrm** (`gamonoid/icehrm`) | HRMS | **Elastic License 2.0 since 2026-08-26** (GPL-3.0 before) | **No, now source-available** | Ice Hrm Pty Ltd | PHP, JS | 2026-09-14 · `v36.0.0` | 728 / 428 / 178 | Self-host, Docker; managed service | Managed SaaS (icehrm.com) |
| 20 | **Sentrifugo** (`sapplica/sentrifugo`) | HRMS | GPL-3.0 | Yes | Sapplica | PHP | Last commit 2017-04-17 (v3.2); pushed 2021-07-02 | 542 / 430 / 321 | Self-host | Inactive |
| 21 | **Huly** (`hcengineering/platform`) | Work platform with ATS | EPL-2.0 | Yes | Huly Labs / hcengineering, now "Platform-Collective" | TypeScript | **Archived on 2026-09-25**; tag `v0.7.432` | 27,774 / 2,174 / 850 | `huly-selfhost` (Docker) | **Hosted Huly has shut down** (README) |

Sources: repositories [1]–[40] (§ Sources); metadata from the GitHub search API [57]; SourceForge pages [16], [34].

### 3.1 Feature coverage (repository evidence)

**Legend:**
- **Y**: code or data model exists in the public repo, or official GitHub-hosted docs describe the feature.
- **P**: partial or basic.
- **E**: requires a paid edition or credits.
- **N**: not found.
- **?**: not verified.
- **(R)**: README claim only; the code was not inspected.

Cells describe the feature as implemented in the **public** repository. They are not a quality assessment.

| Capability → | Pipeline / kanban | Scorecards / structured feedback | Interview scheduling | Careers site | API | SSO | i18n | GDPR tooling | AI |
|---|---|---|---|---|---|---|---|---|---|
| **OpenCATS upstream v0.11.x** | P: fixed statuses, list UI (FEAT-001); "Candidate Declined" added | N (GAP-007) | P: calendar events only (GAP-006) | Y: portal with questionnaires; CAPTCHA added | N (GAP-004); "API development" is a roadmap area | P: LDAP only (GAP-001) | P: date and time formats, countries (FEAT-016, GAP-020) | N (GAP-002) | N (GAP-024); "semantic search and AI-assisted matching" is a roadmap area |
| **Reqcore** (last public code, Aug 2026) | Y: kanban | ? | Y: interview scheduling with ICS (CHANGELOG) | Y: public job board | ? (internal REST routes) | E: `ee/` SSO/SAML, "cloud-only" | Y: Nuxt i18n with Crowdin/Weblate | Y: retention, export, erasure | Y: AI shortlisting, resume parsing, bring-your-own-key |
| **OpenATS** | Y (R) | P (R): feedback | Y (R) | Y (R): career page builder | ? | P: requires the external WSO2 Asgardeo identity provider | ? | ? | Y (R): Gemini parsing and scoring |
| **Odoo 20 Community** `hr_recruitment` | Y: kanban stages, per-job stages | P: "Evaluation" priority, interview surveys (`hr_recruitment_survey`) | P: meetings through Calendar. The self-service scheduling template is not in the Community repo | Y: `website_hr_recruitment` | Y: external JSON-RPC/XML-RPC API docs | P: `auth_oauth`, `auth_ldap`, TOTP, passkeys; SAML not in Community | Y: 64 locale files in the module | P: `privacy_lookup`, `data_recycle` | E: résumé digitisation (OCR) through paid IAP credits |
| **Frappe HR v16** | P: applicant status; kanban not verified | Y: Interview Feedback with skill assessment | P: Interview doctype with date, time and interviewers | Y: `/jobs` page, published openings, salary range | Y: framework REST, webhooks, OAuth clients | Y: framework Social Login (OAuth) and LDAP | Y: 37 locale files | P: framework "Personal Data Deletion/Download Request" | N: not found |
| **OrangeHRM 5.9 Starter** | P: fixed workflow (shortlist → interview → offer → hire) | P: interview pass/fail | P: interview scheduling with interviewers | Y: public apply page and RSS vacancy feed | P: REST API used by the single-page app | Y: OpenID Connect and LDAP plugins | Y: I18N plugin | Y: purge candidate and purge employee | N: not found |
| **Horilla 2.1** | Y: stage pipeline | Y: candidate rating, surveys | Y: `InterviewSchedule` | Y: `open_recruitments`, LinkedIn publishing | Y: `horilla_api` | P: LDAP | Y: 12 locales | ? | P: resume matching (spaCy dependency) |
| **Ever Gauzy** | ? | Y: candidate feedback, criteria ratings | Y: candidate interviews and interviewers | ? | Y: headless platform APIs (R) | ? | ? | ? | P: generic AI provider plugins |
| **Dolibarr 24** | P: candidature statuses | N | P: agenda linking | Y: recruitment public interface | Y: `api_recruitments` REST | ? | Y: 119 language directories | P: `datapolicy` module (scope not verified) | ? |
| **Huly** (archived) | Y: applicant as a task on a board | P: reviews and opinions | P: review as calendar event | ? | Y: API client | ? | ? | ? | P: `ApplicantMatch` entity |

Evidence: file paths are listed per project in §5. Phase 0 IDs: `docs/audit/PRODUCT_GAPS.md`, `docs/audit/FEATURE_INVENTORY.md`.

---

## 4. Headline findings

1. **[FACT] Upstream OpenCATS was revived in 2026, and our fork is 176 commits behind it.**
   - Upstream shows 179 commits in 2026, against 9 in 2025 and 18 in 2024.
   - It shipped `v0.10.0` (2026-06-23), `v0.11.0` (2026-08-27) and `v0.11.1` (2026-09-03).
   - It now requires PHP `^8.4.1`, with a CI matrix of `['8.4.1', '8.5']`.
   - Many Phase 0 findings are addressed upstream: MD5 → `password_hash` (#685), CSRF (#693), MyISAM → InnoDB (#705), utf8mb4 (#805), AJAX authorisation (#724, #828), a mandatory default-admin password change (#873), and removal of legacy multi-tenancy and licensing code (#823, #802).
   - `git diff --shortstat d607279 origin/master` in the upstream clone: 650 files changed, +28,375 / −89,270 lines.
   - This changes the Phase 0 baseline (RISK-001, RISK-003, RISK-018). See §5.1.
2. **[FACT] The CATS Public License 1.1a in our `LICENSE.md` restricts hosted use.**
   - Exhibit B (I) forbids operating the Licensed Software "in or as a time-sharing, outsourcing, service bureau, application service provider or managed service provider environment" without Cognizo's written permission (`LICENSE.md:850-853`).
   - Exhibit B (II)–(III) require a Cognizo copyright notice and a "Powered by CATS" link on every rendered HTML page (`LICENSE.md:855-864`).
   - `RISKS.md` RISK-017 records the attribution duty but not the hosted-use restriction. See §6.5.
3. **[FACT] Several open-source and open-core projects changed licence or distribution in 2026.**
   - **Cal.com:** its public repo became **Cal.diy** (MIT) on 2026-04-15, with all enterprise-edition code (Teams, Organizations, Workflows, SSO/SAML) removed.
   - **IceHrm:** relicensed from GPL-3.0 to **Elastic License 2.0** on 2026-08-26.
   - **Reqcore:** published an "archived open-source release" (June–July 2026), re-opened as AGPL open core (CHANGELOG, Aug 2026), and its main repo now returns 404.
   - **Huly:** archived on 2026-09-25 after "Hosted Huly has shut down … because its hosting is no longer funded".
4. **[INFERENCE] No examined open-source project is a credible, all-open, modern enterprise ATS.**
   - The most complete open recruitment functionality sits in **ERP/HRMS modules** (Odoo, Frappe HR, Horilla, OrangeHRM). These are oriented to in-house HR, and several key features sit in paid editions (Odoo).
   - The one modern ATS-first project (Reqcore) kept SSO and audit log in a proprietary `ee/` directory and has withdrawn its public repository.

---

## 5. Project profiles

### 5.1 OpenCATS upstream (`opencats/OpenCATS`), the reference point

- **What it is.** [FACT] "Open-source applicant tracking system (ATS) and recruitment CRM for staffing agencies and hiring teams" (repo description; [1](https://github.com/opencats/OpenCATS), accessed 2026-09-25). It descends from CATS (Cognizo, 2005–07) (`LICENSE.md:1-5`).
- **License.** [FACT] `LICENSE.md` is identical in upstream and the fork: MPL-2.0 for OpenCATS code and CPL 1.1a for the original CATS code. GitHub reports `NOASSERTION` because the file is dual.
  - Upstream commit #864 ("modernise legacy licence headers") cut the per-file CPL notices down to "Portions Copyright (C) 2005-2007 Cognizo Technologies … CATS Public License 1.1a. See LICENSE.md." (`index.php` header on upstream HEAD, compared with our `index.php:1-30`).
  - [INFERENCE] CPL §3.5 requires the Exhibit A notice "in each file of the Source Code" (`LICENSE.md:597-604`). Whether the shortened header meets this is a question for legal review under RISK-017.
- **Activity.** [FACT] From a full history clone without blobs:
  - 957 commits in total. Commits per year: 2024: 18, 2025: 9, 2026: 179.
  - Non-bot authors in the last 12 months: `anonymoususer72041` 124, `RussH` 45, two others with 1–2 commits each. Dependabot added 14.
  - The GitHub search API shows 753 stars and 322 forks. Open items are 96, of which 6 are open PRs ([57], accessed 2026-09-25), so there are 90 open issues.
  - Tags: `v0.10.0` 2026-06-23, `v0.11.0` 2026-08-27, `v0.11.1` 2026-09-03 ([2](https://github.com/opencats/OpenCATS/releases), accessed 2026-09-25). `constants.php` on HEAD still declares `CATS_VERSION '0.10.0'`.
- **Direction.** [FACT] The README and `CONTRIBUTING.md` point to an "OpenCATS Modernisation & Contributor Roadmap" (GitHub Project, [7]). Its listed areas are PHP 8.4/8.5 cleanup, UI modernisation, Boolean and proximity search, candidate/job matching, email, "API development" and "semantic search and AI-assisted matching" ([4](https://github.com/opencats/OpenCATS/blob/master/CONTRIBUTING.md), accessed 2026-09-25). The board content itself did not render when fetched [UNKNOWN].
  - `FEATURE_REQUESTS.md` lists as "not currently planned": Google Calendar integration (#442), Google SSO (#632), customisable pipelines (#241) and hierarchical permissions (#487) ([5], accessed 2026-09-25).
- **What changed since our fork base (`d607279`, 2026-01-26).** [FACT] From upstream commit subjects:
  - **Security:** password hashing with MD5 migration (#685), CSRF protection (#693, #763), XSS hardening (#697, #761), attachment access and upload whitelist (#681, #828), AJAX authorisation (#724), security headers (#692), mandatory admin password change (#873).
  - **Data:** MyISAM → InnoDB (#705), utf8mb4 (#805), IANA timezone column (#806), removal of the legacy upgrade path (#767), removal of multi-tenant `site_id` support (#823).
  - **Product:** "Candidate Declined" status (#783), CAPTCHA on the careers portal (#785), country support (#742), manual activity dates (#758), 12- and 24-hour time formats (#812).
  - **Dependencies:** "pin CKEditor to open-source release" (#856). This is relevant to the CKEditor question in RISK-017.
- **Still absent upstream.** [FACT] None of these appear in upstream commit subjects since the fork base: public API, SSO/SAML, configurable workflows, scorecards, interview scheduling, i18n of UI strings, or GDPR tooling. `FEATURE_REQUESTS.md` defers several of them.
- **Careers-portal identity.** [FACT] Upstream HEAD still reads `candidateID` from `$_POST` (`modules/careers/CareersUI.php:815`) and updates that candidate (`:1695-1705`). No ownership proof is visible in that path, although a CAPTCHA now precedes it (`:808-811`). This matches the Phase 0 pattern (RISK-002, SEC-024). [UNKNOWN] Runtime behaviour was not tested. [RECOMMENDATION] Report through upstream's private security channel, not a public issue.
- **How competitors describe OpenCATS.** [SOURCE CLAIM · vendor (Reqcore README)] Reqcore's comparison table lists OpenCATS as "PHP 5", "❌ Stale", with no "Pipeline / Kanban" and no "Public job board" ([10], accessed 2026-09-25). [FACT] This is partly contradicted:
  - OpenCATS has a careers portal (FEAT-005, FEAT-011) and a pipeline (FEAT-001), though not a kanban.
  - Upstream targets PHP 8.4/8.5 and was active in 2026.
  - [INFERENCE] OpenCATS is used as the "legacy" foil in open-source ATS marketing.

### 5.2 Standalone open-source ATS projects

**Reqcore**
- [FACT] The last publicly visible full codebase is the fork `symut/reqcore` (HEAD 2026-08-09, "Merge pull request #266 from reqcore-inc/feat/viewed-applicants") ([10], accessed 2026-09-25).
- **Stack:** Nuxt 4, PostgreSQL 16, Drizzle, Better Auth (with organization, SSO and Stripe plugins), MinIO, Vercel AI SDK through OpenRouter or bring-your-own-key, PostHog analytics.
- **Features:**
  - [FACT] CHANGELOG entries include interview scheduling with iCalendar invitations, GDPR retention and erasure, and OIDC SSO.
  - [SOURCE CLAIM · project README] AI shortlisting with a "visible breakdown", resume parsing, kanban pipeline, public job board, custom forms, multi-tenant organisations.
- **License:** [FACT] AGPL-3.0 at the root. `ee/LICENSE` ("Reqcore Enterprise Edition License") is source-available and forbids production use without a commercial agreement. The README says `ee/` holds "SSO/SAML, audit log, source analytics", described as "paid, cloud-only features".
- **Business model:** [FACT] The README lists plans priced per active role, not per seat: Free $0 (1 role), Solo $79/mo, Team $239/mo, Scale $599/mo (SSO/SAML/SCIM, audit log, DPA/SLA), Agency "Contact us". Self-hosting is "best-effort, DIY … without support or an SLA".
- **Distribution history.** [FACT]
  - `reqcore-inc/reqcore-old-snapshot` (created 2026-06-24, last commit 2026-07-03) states: "This repository is an archive of the open-source, self-hosted version of Reqcore" ([9]).
  - The Unreleased CHANGELOG section in the fork says "**licensing:** re-open Reqcore as open-core — AGPLv3 for the core app, with a new `ee/` directory".
  - `https://github.com/reqcore-inc/reqcore` returned **HTTP 404**, and `git ls-remote` asked for credentials ([11], accessed 2026-09-25).
  - [SOURCE CLAIM · third party (Glozo; commercial recruiting-software publisher) · search excerpt] "the company has archived that positioning and now sells hosted software from $79 a month, with self-hosting absent from its site" ([13]). The page could not be fetched.
  - [INFERENCE] Within about three months Reqcore went from AGPL, to archived, to AGPL open core, to no public repository. Whether any AGPL release is still maintained is **UNKNOWN**.

**OpenATS** (`chamals3n4/OpenATS`)
- [FACT] Created 2026-02-08; Apache-2.0; 32 stars; latest tag `v0.5.0` ([14], accessed 2026-09-25).
- **Stack:** Next.js with shadcn/ui, Express 5, Socket.IO, Drizzle/Postgres, BullMQ/Redis.
- **External dependencies:** it requires **WSO2 Asgardeo** (identity), **Gemini** (AI), **Resend** (e-mail) and **Cloudflare R2**.
- [SOURCE CLAIM · project README] Job management, a customisable pipeline, interview management, AI resume parsing and a career page builder.
- [INFERENCE] It is an early, single-maintainer project. Its default dependencies on proprietary SaaS limit a pure self-hosted or offline deployment.

**SpotAxis** (`Assystant/SpotAxis`)
- [FACT] MIT; last commit 2025-10-06; README dependencies are **Python 2.7** and **Django 1.9.5**, both end-of-life ([15], accessed 2026-09-25).
- [SOURCE CLAIM · project README] Branded careers sites, resume parsing, custom pipelines per job, ratings per round, and a multi-organisation SaaS mode with subscription management.

**CandidATS**
- [FACT] SourceForge lists it as "Recruitment Management Software", PHP, last updated 2022-08-10, release "CandidATS 3.0.0 - Stable", "3 This Week" downloads. It lists the licences GPLv3, MPL 1.1 and MPL 2.0 ([16], accessed 2026-09-25).
- [SOURCE CLAIM · user review on SourceForge] It was created "as a continuation for OpenCATS".
- [INFERENCE] It is an inactive OpenCATS descendant.

**Nueno, Plutomi, OSSAdmiral Recruit**
- [FACT] Nueno: AGPL-3.0, last commit 2022-05-07 [17].
- [FACT] Plutomi: Apache-2.0, README says "Currently WIP", last commit 2024-12-12 [18].
- [FACT] OSSAdmiral Recruit: AGPL-3.0, archived [19].
- [INFERENCE] None of the three is a maintained product.

**Not found or not products**
- [UNKNOWN] No project named "Canditrack" was found. The only search hits were CandidATS and generic listicles, and no GitHub repository appeared.
- [FACT] Twenty CRM (`twentyhq/twenty`, AGPL-3.0 with some files under a commercial license) has no recruiting, applicant or candidate module in its tree [37]. GitHub search for Twenty-based recruiting or ATS projects found only CRM integrations such as MCP servers and n8n nodes.
- [INFERENCE] "Twenty-based recruiting" means configuring a generic CRM, not an existing product.

### 5.3 Recruitment modules in open-source ERP, HRMS and platforms

**Odoo Recruitment** (Odoo S.A.)
- **License and edition model:**
  - [FACT] `odoo/odoo` LICENSE: "Odoo is published under the GNU LESSER GENERAL PUBLIC LICENSE, Version 3". The `hr_recruitment` manifest declares `'license': 'LGPL-3'` ([20](https://github.com/odoo/odoo), accessed 2026-09-25).
  - [FACT] Official docs source (`odoo/documentation`, `content/legal/licenses.rst`): "Odoo 19 Community Edition is licensed under LGPL version 3". "Odoo 19 Enterprise Edition is licensed under the Odoo Enterprise Edition License v1.0". Odoo Apps default to the "Odoo Proprietary License v1.0" ([21], accessed 2026-09-25).
  - [FACT] The default branch of `odoo/odoo` is `20.0`, and its `release.py` declares `version_info = (20, 0, 0, FINAL, 0, '')`. The release date is UNKNOWN (odoo.com is blocked).
- **Community-edition recruitment code** [FACT]: `hr_recruitment`, `hr_recruitment_skills`, `hr_recruitment_survey`, `hr_recruitment_sms`, `website_hr_recruitment`, `website_hr_recruitment_livechat`.
  - The applicant model has kanban stages, an "Evaluation" priority, `interviewer_ids`, refuse reasons and talent pools (`addons/hr_recruitment/models/hr_applicant.py`).
  - The Community repo does **not** contain `sign`, `hr_referral`, `appointment` or job-board integration modules.
  - The Community recruitment mail templates do not include the "Recruitment: Schedule Interview" template that the docs use for applicant self-scheduling.
- **Docs** [FACT] (`content/applications/hr/recruitment*.rst`):
  - Résumé digitisation (OCR) and SMS "require credits", bought as in-app purchases.
  - Job-board posting: "Currently, Odoo only supports directly posting to Monster.com".
  - Offer contracts need the **Sign** app. Referral points need the **Referrals** app.
  - [INFERENCE] Sign, Referrals, appointment-based self-scheduling and job-board posting come from Enterprise or paid modules, since they are absent from the LGPL repository.
- **Pricing:** [UNKNOWN] odoo.com is blocked.

**Frappe HR** (Frappe Technologies)
- [FACT] GPL-3.0. The Frappe framework itself is MIT ([24]).
- [FACT] README: "Initially, it was a set of modules within ERPNext but version 14 onwards … Frappe HR was created as a separate product". Managed hosting is on **Frappe Cloud**, whose platform `frappe/press` the README calls open source ([22], accessed 2026-09-25).
- [FACT] Recruitment doctypes (`hrms/hr/doctype/`): `job_requisition`, `staffing_plan`, `job_opening`, `job_applicant`, `job_applicant_source`, `interview`, `interview_feedback`, `skill_assessment`, `interviewer`, `job_offer`, `appointment_letter`, `employee_referral`. The public jobs page is at `hrms/www/jobs/`, and `job_opening` has `publish`, `route` and `publish_salary_range` fields.
- [FACT] Framework features: `ldap_settings`, `social_login_key`, `oauth_client`, `webhook`, `personal_data_deletion_request`, `personal_data_download_request` (`frappe/frappe`, [24]).
- [INFERENCE] This is the broadest set of **enterprise-process** objects (requisition → staffing plan → opening → interview feedback → offer) among fully open projects, but it is aimed at corporate HR, not agencies.

**OrangeHRM Starter** (OrangeHRM Inc.)
- [FACT] README title "OrangeHRM Starter Application"; GPL-3.0-or-later. Stack is PHP with Symfony 5.4 components and Vue 3. Tag `v5.9`, whose CHANGELOG lists PHP 7.4–8.5 support and Slack/Google Chat notifications ([25], accessed 2026-09-25).
- [FACT] The recruitment plugin exposes APIs for vacancy, candidate, shortlist, interview scheduling, interview pass/fail, job offer, offer decline, hire and rejection, plus a public apply controller and an RSS vacancy list.
- [FACT] Other plugins: `orangehrmMaintenancePlugin` provides `PurgeCandidateAPI`, and there are OpenID and LDAP authentication plugins.
- **Paid editions:** [UNKNOWN] orangehrm.com is blocked. [INFERENCE] The "Starter" name implies other paid editions.

**Horilla HRMS**
- [FACT] LGPL-2.1; Django 5 and HTMX; official Docker image; tag `2.1.7` (2026-09-16), described as "the first to carry a **security fix**" ([26], accessed 2026-09-25).
- [FACT] Recruitment models: `Recruitment` (`is_published`, `publish_in_linkedin`), `Stage`, `Candidate`, `RejectReason`, `RecruitmentSurvey`, `SkillZone`, `CandidateRating`, `InterviewSchedule`, `Resume`, `CandidateDocumentRequest`, `LinkedInAccount`. Other modules include `horilla_api`, `horilla_ldap` and `outlook_auth`.
- [FACT] The README offers "Professional Support … enterprise support, custom development, and consulting".

**Ever Gauzy** (Ever Co. LTD)
- [FACT] "Open Business Management Platform (ERP/CRM/HRM/ATS/PM)" ([27], accessed 2026-09-25).
- [FACT] Candidate modules in `packages/core/src/lib/`: `candidate`, `candidate-interview`, `candidate-interviewers`, `candidate-feedbacks`, `candidate-criterions-rating`, `candidate-skill`, `candidate-source` and others.
- **Licensing** [FACT] (`LICENSES.md`):
  - The Community Edition is AGPL-3.0.
  - A commercial "Small Business" license is for companies with revenue up to $1M, and an "Enterprise" license for companies above $1M.
  - Ever Co. "holds copyright and/or sufficient licenses to all components" and can permit proprietary modules.
- **SaaS:** [FACT] app.gauzy.co is labelled "Alpha".

**Dolibarr, Axelor, AureusERP, MintHCM**
- [FACT] Dolibarr has a GPL-3.0-or-later recruitment module (`htdocs/recruitment`) with job positions, candidatures, an agenda, a public interface and a REST API class (`api_recruitments.class.php`). It also has a `datapolicy` module. For hosting, the README points to third-party SaaS offers and "preferred partners" [28].
- [FACT] Axelor's `axelor-talent` module (AGPL-3.0) has the domain models `JobPosition`, `JobApplication`, `HiringStage`, `TalentSource` and `AppRecruitment`. There is also a separate `axelor-gdpr` module [29].
- [FACT] AureusERP (MIT, Webkul, created 2025-01-23; 11,986 stars) has a `recruitments` plugin. Its models are `Applicant`, `Candidate`, `Stage`, `RefuseReason`, `JobPosition`, `ApplicantInterviewer`, `UTMSource` and similar. The README advertises managed "AureusERP Cloud Hosting" [30].
  - [INFERENCE] The data model closely mirrors Odoo's recruitment objects.
- [FACT] MintHCM (AGPL-3.0, "based on SuiteCRM") has the modules `Candidates`, `Candidatures`, `Recruitments`, `Applications` and `Onboardings` [31].
  - [SOURCE CLAIM · project README] It is "AI-native" with "MCP / WebMCP", "A2A", and "no gated features, no enterprise-only fork, no phone-home telemetry".

**IceHrm**
- [FACT] `LICENSE` changed to "Elastic License 2.0 (ELv2)" in commit "Remove legacy UI and update license." on **2026-08-26**. It had been GPL-3.0 since 2020-10-31 ([32](https://github.com/gamonoid/icehrm), accessed 2026-09-25).
- [FACT] The public repo has a job-apply page (`core/apply/job.php`) that posts to `/jobs/apply`. `core/src/` has no recruitment or candidate module.
- [FACT] The README promotes a "fully managed service".
- [INFERENCE] Recruitment is a commercial or cloud capability. IceHrm is no longer OSI open source for new versions.

**Sentrifugo**
- [FACT] The last commit on the default branch is 2017-04-17 ("Sentrifugo 3.2"). SourceForge also shows last update April 17, 2017 and v3.2. There are 321 open issues and PRs ([33], [34], accessed 2026-09-25).
- [INFERENCE] The project is inactive. Search listicles still name it among "best open source ATS" ([SOURCE CLAIM · vendor (Reqcore) · search excerpt], [12]), which shows how stale listicle data is.

**Huly**
- [FACT] The README says: "**This repository is frozen and is no longer actively maintained.** Development continues in Platform-Collective/platform". It also says: "The hosted Huly service has been discontinued because its hosting is no longer funded". GitHub shows the repo "archived by the owner on Sep 25, 2026" ([35](https://github.com/hcengineering/platform), accessed 2026-09-25).
- [FACT] The platform includes an ATS: `plugins/recruit` with `Vacancy`, `Candidate`, `Applicant` (a task), `ApplicantMatch`, `Review` (an event) and `Opinion`. License is EPL-2.0.
- [FACT] The successor repo `Platform-Collective/platform` was created 2026-06-26 and has 36 stars [36].

### 5.4 Adjacent recruiting projects (not ATS)

[FACT]:
- `MicroPyramid/opensource-job-portal` (PeelJobs; MIT; 489 stars) is a job portal [38].
- `srbhr/Resume-Matcher` (Apache-2.0; 28,517 stars) is a job-seeker resume tool.
- `interviewstreet/hiring-agent` (MIT; 7,235 stars; created 2025-07-29) is an "AI agent to evaluate and score resumes" [56].

[INFERENCE] The high star counts on candidate-side and AI-screening tools, compared with recruiter-side ATS projects, suggest open-source energy is going to AI resume tooling, not full ATS platforms.

---

## 6. Analysis

### 6.1 What the open-source segment does well
- **[FACT] The data models are rich enough.** Odoo, Frappe HR, Horilla and AureusERP all model stages, refuse or reject reasons, sources, interviewers, and ratings or feedback (§5.3). Frappe HR also covers requisitions and staffing plans (GAP-008), job offers (part of GAP-009) and referrals (part of GAP-018).
- **[FACT] Careers pages and public job posting are standard** (Odoo `website_hr_recruitment`, Frappe `/jobs`, Horilla `open_recruitments`, OrangeHRM apply page with RSS, Dolibarr public interface).
- **[FACT] Several projects ship modern deployment:** official Docker images (Horilla, OrangeHRM, MintHCM), Kubernetes or Pulumi guidance (Ever Gauzy) and managed hosting (Frappe Cloud, AureusERP Cloud, IceHrm managed).
- **[FACT] Privacy tooling exists in several places:** OrangeHRM purge, Frappe personal-data requests, Odoo `privacy_lookup`, Dolibarr `datapolicy`, Axelor `axelor-gdpr`, and Reqcore retention and erasure.
- **[INFERENCE] Being part of a suite is an adoption advantage.** Recruitment flows into employee records and onboarding in the same database (Odoo, Frappe, Horilla). A standalone ATS has to build that through integrations.

### 6.2 What it lacks
- **[INFERENCE, from the §3.1 matrix]** No fully open project combines all of these:
  - configurable per-job workflows with structured scorecards
  - calendar-synchronised interview scheduling
  - a documented public API with webhooks
  - SAML SSO with SCIM
  - fine-grained RBAC and a tamper-evident audit log (GAP-011)
  - DSAR tooling
  - AI features that are auditable

  Where some of these exist, they are often **paid** (Odoo Sign, Referrals, IAP digitisation; Reqcore `ee/` SSO and audit log).
- **[FACT] Agency and staffing features are rare.** Among the examined projects, only OpenCATS models client companies, contacts and submissions for agencies (FEAT-001, `EXECUTIVE_SUMMARY.md` §4 Q1). [INFERENCE] The ERP/HRMS modules are built for in-house recruiting.
- **[FACT] Maintainer depth is thin in standalone projects:**
  - OpenCATS: two principal committers in the last 12 months.
  - OpenATS: one maintainer.
  - Nueno, Plutomi, SpotAxis and OSSAdmiral: stale, WIP or archived.
  - Reqcore: public repository withdrawn.
- **[INFERENCE] AI features are either absent** (OpenCATS, OrangeHRM, Frappe HR, where none was found) **or tied to proprietary model APIs** (OpenATS on Gemini; Reqcore on OpenRouter or bring-your-own-key). No examined project documents bias auditing or EU AI Act (high-risk) controls for hiring.

### 6.3 Is there a credible modern open-source enterprise ATS? (INFERENCE)
- **[INFERENCE] Not as of 2026-09-25, among the projects examined.**
  - The ERP/HRMS recruitment modules are credible for **in-house** hiring inside those suites. They are not standalone enterprise ATS products and lack agency/CRM depth.
  - Among ATS-first projects, the one with a modern stack and enterprise ambitions (Reqcore) kept enterprise identity and audit features proprietary and has withdrawn its public repo.
  - The others are early (OpenATS), stale or archived.
- **[INFERENCE] This is both an opening and a warning for OpenCATS 2.0.** There is a gap for an agency-capable, API-first, fully open ATS. But the retreats of Reqcore, Cal.com, IceHrm and Huly show that monetising such a project is hard.
- **[RECOMMENDATION] Decide the sustainability model before choosing the license** (see §6.5 and §6.6).

### 6.4 Licensing models observed

| Model | Examples (from LICENSE files) | Observed consequences |
|---|---|---|
| Permissive (MIT / Apache-2.0) | AureusERP (MIT), OpenATS (Apache-2.0), SpotAxis (MIT), Plutomi (Apache-2.0), Frappe framework (MIT), Cal.diy (MIT) | [INFERENCE] Easiest to adopt and embed. No protection against a hosted fork. Revenue comes from hosting or services (AureusERP Cloud). |
| Weak / file-level copyleft (LGPL, MPL, EPL) | Odoo CE (LGPL-3.0), Horilla (LGPL-2.1), **OpenCATS (MPL-2.0)**, Huly (EPL-2.0) | [FACT] MPL-2.0 §3.3 lets a "Larger Work" be distributed "under terms of Your choice" if the MPL files keep their obligations (`LICENSE.md:191-200`). [INFERENCE] That makes open core with separate proprietary files possible. |
| Strong copyleft (GPL-3.0) | Frappe HR, ERPNext, OrangeHRM, Dolibarr, Sentrifugo | [INFERENCE] Distributed derivatives must stay GPL. No network clause, so SaaS forks need not publish changes. |
| Network copyleft (AGPL-3.0) | Axelor, MintHCM, Ever Gauzy CE, Nueno, Twenty (with commercial files), Documenso, DocuSeal, Zitadel | [INFERENCE] Discourages proprietary SaaS forks. Some enterprises restrict AGPL use internally. Often paired with dual or commercial licensing (Ever Gauzy). |
| Open core (OSS core + source-available `ee/`) | Reqcore (AGPL + `ee/`), Documenso (`packages/ee`), Meilisearch (MIT + BUSL-1.1 EE), n8n (`.ee.` files), Cal.com (until 2026-04-15) | [FACT] Paid features (SSO/SAML, audit log, teams) sit behind source-available licenses that forbid production use without a subscription (Reqcore `ee/LICENSE`, Documenso `packages/ee/LICENSE`, Meilisearch `LICENSE-EE`). |
| Dual licensing (copyleft or commercial) | Ever Gauzy | [FACT] Needs the vendor to hold "copyright and/or sufficient licenses to all components" (`LICENSES.md`). |
| Source-available (not OSI) | IceHrm (ELv2 since 2026-08-26), n8n ("Sustainable Use License"), Elasticsearch option (ELv2/SSPL alongside AGPL) | [INFERENCE] Removes "open source" as a selling point. Vendors appear to accept that in exchange for protection against hosted competitors. |
| Attribution terms in AGPL §7(b) | DocuSeal ("must retain the original DocuSeal attribution in interactive user interfaces") | [INFERENCE] Similar in effect to the CPL "Powered by CATS" requirement. |

### 6.5 Implications for OpenCATS 2.0 licensing
- **[FACT] Today's obligations** (`LICENSE.md`):
  - OpenCATS code is MPL-2.0.
  - Original CATS code is under **CPL 1.1a** = MPL 1.1 plus Exhibit B (`LICENSE.md:382-387`, `846-864`). Exhibit B:
    - **(I)** forbids use "in or as a time-sharing, outsourcing, service bureau, application service provider or managed service provider environment" without Cognizo's written permission;
    - **(II)** requires a Cognizo copyright notice on every rendered HTML page;
    - **(III)** requires a "Powered by CATS" hyperlink to catsone.com on every rendered HTML page.
  - CPL §3.5 requires the Exhibit A notice in each source file (`LICENSE.md:597-604`).
- **[INFERENCE] Consequences:**
  1. **A hosted or SaaS OpenCATS 2.0 cannot legally ship CPL-covered code** without Cognizo's written permission. The current owner of Cognizo's rights is UNKNOWN. This affects any "cloud edition" business model. `RISKS.md` RISK-017 should be expanded: it records attribution, not the hosted-use restriction.
  2. A **clean rebuild**, in which legacy code is used only as a behavioural spec and data source (as `EXECUTIVE_SUMMARY.md` §4 Q4 already suggests), is the licensing path that most cleanly removes CPL obligations. Copying legacy PHP into the new code base would carry them over.
  3. Code that is new in OpenCATS 2.0 and not derived from MPL files can take any license. Modifications of existing MPL-2.0 files stay MPL-2.0 (MPL-2.0 §3.1 and §3.3).
  4. A future open-core or dual-licensing model is only possible if the project controls rights in contributions. [RECOMMENDATION] Adopt a CLA, or a DCO combined with a clear inbound=outbound policy, **before** accepting outside contributions to the new code base.
- **[RECOMMENDATION] Options to put to the licensing decision.** These are not a decision.
  - **(a) MPL-2.0 for the new code.** Continuity with today's license; file-level copyleft; allows proprietary add-on files. Weak protection against hosted forks.
  - **(b) AGPL-3.0 core, with or without commercial add-ons.** Market precedent: Reqcore, Twenty, Documenso, Ever Gauzy. Stronger protection against hosted forks; some adoption friction.
  - **(c) Apache-2.0.** Maximum adoption; relies on hosting or services revenue.

  Whichever is chosen, avoid **license oscillation**. The 2026 retreats (Reqcore, Cal.com, IceHrm) are exactly what an OpenCATS 2.0 community would weigh.
- **[RECOMMENDATION] Obtain a legal review of CPL 1.1a Exhibit B** before any hosted offering, alongside the other RISK-017 items (GPL Sphinx API, CKEditor, notices).

### 6.6 Business models that sustain open-source recruiting projects

| Model | Seen in | Evidence |
|---|---|---|
| Paid edition for the enterprise features (open core) | Odoo (Enterprise license), Reqcore (`ee/`), Documenso, Meilisearch, n8n | LICENSE files cited above [FACT] |
| Commercial licenses priced by revenue band (dual licensing) | Ever Gauzy | `LICENSES.md` [FACT] |
| Managed hosting of the OSS product | Frappe Cloud, AureusERP Cloud, IceHrm managed, Ever Gauzy SaaS, Reqcore cloud | READMEs [FACT] |
| Usage credits / in-app purchases | Odoo (résumé OCR, SMS credits) | Odoo docs [FACT] |
| Support, custom development, partner networks | Horilla "Professional Support", Dolibarr "preferred partners", SpotAxis e-mail support | READMEs [FACT] |
| None (volunteer) | OpenCATS upstream | No company or paid tier found [FACT, limited to repository evidence] |

[INFERENCE] Suite vendors can fund recruitment from ERP revenue. Standalone ATS projects have had to lean on hosted SaaS, and several of them retreated from open distribution in 2026 (Reqcore; Huly's hosting shutdown). A standalone open-source ATS probably needs a clear hosted or enterprise revenue line from the start.

### 6.7 Upstream relationship (for the lead)
- [FACT] Upstream now fixes many Phase 0 issues (§5.1). This affects the Phase 1 "stabilise legacy" plan (`RECOMMENDED_ROADMAP.md`): part of the PHP 8 and security bridge work may already exist upstream.
- [RECOMMENDATION] Before starting Phase 1 work, compare `d607279..opencats/master` against each Phase 0 finding. Decide between rebasing onto upstream `v0.11.1` and a hard fork. Coordinate the careers-portal identity issue (§5.1) with upstream through private disclosure.

---

## 7. Adjacent open-source building blocks

[RECOMMENDATION] These are options to evaluate, not adoption decisions. Each needs a licence-compatibility and security review against the chosen OpenCATS 2.0 licence.

| Need (Phase 0 gap) | Component | License (from repo) | Activity / stars | Notes |
|---|---|---|---|---|
| Interview scheduling (GAP-006) | **Cal.diy** (formerly the Cal.com public repo; `calcom/cal.diy`) | MIT (since 2026-04-15; AGPL-3.0 + commercial `ee/` before) | Last commit 2026-09-20 | [FACT] README: "strictly recommended for personal, non-production use". EE features (Teams, Organizations, Workflows, SSO/SAML) were removed. The commercial Cal.com is no longer in this repo. [INFERENCE] Treat it as a reference or embedded booking component, not as team-scheduling infrastructure. |
| Search (GAP-016) | **OpenSearch** | Apache-2.0 | 13,775 stars; OpenSearch Foundation (LF) badges | [FACT] Includes Apache-licensed Elasticsearch-derived code. |
|  | **Meilisearch** | MIT core; EE parts under BUSL-1.1 (non-production only without a commercial agreement) | 59,407 stars | [FACT] `LICENSE`, `LICENSE-EE`. Check which features are EE before relying on them. |
|  | **Typesense** | GPL-3.0 | 26,594 stars | [INFERENCE] Run as a separate service; GPL applies to distribution of Typesense itself. |
|  | Elasticsearch | AGPL-3.0 / SSPL-1.0 / ELv2 (choice) | 77,987 stars | [FACT] `LICENSE.txt`. |
| E-signature for offers (GAP-009) | **Documenso** | AGPL-3.0 + `packages/ee` commercial license | 15,185 stars | [FACT] EE code needs an Enterprise subscription for production. |
|  | **DocuSeal** | AGPL-3.0 with §7(b) attribution terms | 18,618 stars | [FACT] UI attribution must be retained. |
|  | **OpenSign** | AGPL-3.0 except a `customRoute` directory under its own license | 7,029 stars; last push 2026-08-21 | [FACT] `LICENSE`. |
| SSO / MFA / SCIM (GAP-001) | **Keycloak** | Apache-2.0 | 36,986 stars; CNCF (README badges) | |
|  | **Zitadel** | AGPL-3.0 | 15,103 stars | |
| Document text extraction and resume parsing (GAP-023, GAP-024) | **Apache Tika** | Apache-2.0 | 4,079 stars | Text and metadata from "over a thousand" file types (repo description). |
|  | **Docling** | MIT | 67,938 stars; LF AI & Data project (README) | Layout-aware document conversion; optional vision-language models. |
|  | **Unstructured** | Apache-2.0 | 15,487 stars | Document-to-structured-data ETL. |
|  | OpenResume parser | AGPL-3.0 | Last push 2024-10-29 | Resume builder and parser; inactive. |
|  | pyresparser | GPL-3.0 | Last push 2023-09-13 | Inactive. |
| Video interviews (GAP-006) | **Jitsi Meet** | Apache-2.0 | 29,990 stars | |
| Workflow automation (GAP-004, GAP-022) | n8n | "Sustainable Use License", with `.ee.` files licensed separately | 205,928 stars | [FACT] Not OSI open source ("fair-code" per repo description). [INFERENCE] Unsuitable to bundle in a hosted offering without a commercial agreement. |

[INFERENCE] The three that fit a permissive or MPL core with the least friction are Apache/MIT components: OpenSearch, Keycloak, Tika, Docling, Unstructured and Jitsi. AGPL services (Documenso, DocuSeal, Zitadel, and Typesense under GPL) are usually run as separate network services, but that pattern still needs legal confirmation. BUSL, ELv2 and SUL components (Meilisearch EE, Elasticsearch ELv2, n8n) restrict hosted or production use.

---

## 8. Facts vs Inferences

**Facts** (verified directly in repositories or fetched pages):
- Upstream OpenCATS activity: 179 commits in 2026; releases v0.10.0, v0.11.0, v0.11.1; PHP ^8.4.1; 90 open issues and 6 open PRs.
- The fork base `d607279` is 176 commits behind upstream master.
- Upstream security and data fixes are identified by PR number (§5.1).
- Upstream HEAD still takes `candidateID` from POST in the careers apply path (static read).
- `LICENSE.md` CPL 1.1a Exhibit B hosted-use, notice and attribution terms (`LICENSE.md:846-864`).
- The SPDX or license text of every listed project (§3) and component (§7).
- License changes: IceHrm to ELv2 on 2026-08-26; the Cal.com repo became MIT Cal.diy on 2026-04-15.
- Reqcore: archive README, `ee/LICENSE` terms, README pricing table, main repo 404.
- Huly archived with the hosted service shut down.
- Module and entity evidence for Odoo, Frappe HR, OrangeHRM, Horilla, Ever Gauzy, Dolibarr, Axelor, AureusERP, MintHCM and Huly.
- Sentrifugo has had no commits since 2017.

**Source claims:**
- README feature lists for OpenATS, SpotAxis and MintHCM.
- Reqcore's comparison table about OpenCATS.
- Glozo's statement about Reqcore's current site (search excerpt).
- Reqcore's listicle naming "OpenCATS, OrangeHRM, Odoo Recruitment, ERPNext HRMS, CandidATS, and Sentrifugo" (search excerpt).
- CandidATS being an OpenCATS continuation (SourceForge user review).

**Inferences:**
- No credible fully open, modern enterprise ATS exists among the projects examined.
- ERP/HRMS modules are in-house oriented.
- Odoo's Sign, Referrals, appointment scheduling and job boards are Enterprise or paid, inferred from their absence in the LGPL repository.
- The CPL hosted-use restriction blocks a SaaS edition built on legacy code.
- Monetising a standalone open-source ATS is hard (from the 2026 retreats).
- The licence-compatibility notes for building blocks.

**Recommendations:**
- Legal review of CPL Exhibit B.
- A clean rebuild for any hosted edition.
- A CLA/DCO before external contributions.
- Choose the business model before the license, and avoid oscillation.
- Diff upstream against Phase 0 findings before Phase 1 work.
- Report the careers issue privately.
- Evaluate the Apache/MIT building blocks first.

## 9. Unknowns
- Pricing and edition contents for Odoo Enterprise, OrangeHRM paid editions, Frappe Cloud, Horilla support, AureusERP Cloud, Ever Gauzy licenses and IceHrm SaaS. The vendor sites were blocked and the session's WebSearch budget was exhausted.
- Reqcore's current state: whether an AGPL codebase is still published anywhere official, and whether self-hosting is still offered. The site is blocked, and the only evidence is a search excerpt.
- Who currently holds Cognizo Technologies' CPL 1.1a rights, and whether permission for hosted use has ever been granted to OpenCATS.
- Whether the shortened CPL headers upstream (#864) satisfy CPL §3.5.
- The contents of the OpenCATS "Modernisation & Contributor Roadmap" board (it did not render).
- Whether the upstream careers-portal update path is exploitable at runtime (static read only). The Odoo 20 release date.
- Exact contributor counts for large repositories. Only upstream OpenCATS authorship was counted.
- Whether "Canditrack" exists under another name.
- SAML support in Frappe, Horilla, Ever Gauzy and Dolibarr (not verified).

---

## Sources

All accessed 2026-09-25. "Clone" means a read-only shallow or blob-less `git clone` into the scratchpad.

1. opencats/OpenCATS repository page (fetched) and clone. https://github.com/opencats/OpenCATS. Project repository.
2. OpenCATS releases (fetched). https://github.com/opencats/OpenCATS/releases. Project. Tag dates taken from git tags.
3. OpenCATS commit history (clone). https://github.com/opencats/OpenCATS/commits/master. Project.
4. OpenCATS CONTRIBUTING.md. https://github.com/opencats/OpenCATS/blob/master/CONTRIBUTING.md. Project.
5. OpenCATS FEATURE_REQUESTS.md. https://github.com/opencats/OpenCATS/blob/master/FEATURE_REQUESTS.md. Project.
6. OpenCATS careers controller (upstream HEAD). https://github.com/opencats/OpenCATS/blob/master/modules/careers/CareersUI.php. Project.
7. OpenCATS Modernisation & Contributor Roadmap (fetched; content not rendered). https://github.com/orgs/opencats/projects/2. Project.
8. This repository's `LICENSE.md` (MPL-2.0 and CPL 1.1a). Local file.
9. Reqcore archived open-source snapshot. https://github.com/reqcore-inc/reqcore-old-snapshot. Vendor repository.
10. Reqcore fork snapshot (README, CHANGELOG, `ee/LICENSE`, INTERVIEW-SCHEDULING.md). https://github.com/symut/reqcore. Third-party fork of the vendor repository.
11. Reqcore main repository (HTTP 404). https://github.com/reqcore-inc/reqcore. Vendor.
12. "Best Open Source Applicant Tracking Systems [2026]". https://reqcore.com/blog/best-open-source-applicant-tracking-systems. Vendor blog; search excerpt only (fetch blocked).
13. "Open-Source ATS: 8 Applicant Tracking Systems, 2026". https://www.glozo.com/blog/open-source-ats-tools-2025. Third-party commercial publisher; search excerpt only (fetch blocked).
14. OpenATS. https://github.com/chamals3n4/OpenATS. Project repository.
15. SpotAxis. https://github.com/Assystant/SpotAxis. Project repository.
16. CandidATS on SourceForge (fetched). https://sourceforge.net/projects/candidats/. Project listing and user review.
17. Nueno. https://github.com/nueno-co/nueno. Project repository.
18. Plutomi. https://github.com/plutomi/plutomi. Project repository.
19. OSSAdmiral Recruit. https://github.com/OSSAdmiral/Recruit. Project repository.
20. Odoo source (LICENSE, `addons/hr_recruitment`, `odoo/release.py` on 20.0). https://github.com/odoo/odoo. Vendor repository.
21. Odoo documentation source (`content/applications/hr/recruitment*.rst`, `content/legal/licenses.rst`, `content/developer/reference/external_api.rst`). https://github.com/odoo/documentation. Vendor docs.
22. Frappe HR. https://github.com/frappe/hrms. Vendor repository.
23. ERPNext. https://github.com/frappe/erpnext. Vendor repository.
24. Frappe framework (LICENSE, integration and website doctypes). https://github.com/frappe/frappe. Vendor repository.
25. OrangeHRM Starter (README, CHANGELOG.TXT, plugins). https://github.com/orangehrm/orangehrm. Vendor repository.
26. Horilla HRMS (README, CHANGELOG, `recruitment/models.py`). https://github.com/horilla/horilla-hr. Vendor repository.
27. Ever Gauzy (README, LICENSES.md). https://github.com/ever-co/ever-gauzy. Vendor repository.
28. Dolibarr (README, `htdocs/recruitment`). https://github.com/Dolibarr/dolibarr. Project repository.
29. Axelor Open Suite (LICENSE, `axelor-talent`). https://github.com/axelor/axelor-open-suite. Vendor repository.
30. AureusERP (README, LICENSE, `plugins/webkul/recruitments`). https://github.com/aureuserp/aureuserp. Vendor repository.
31. MintHCM (README, legacy modules). https://github.com/minthcm/minthcm. Project repository.
32. IceHrm (LICENSE history, readme.md). https://github.com/gamonoid/icehrm. Vendor repository.
33. Sentrifugo. https://github.com/sapplica/sentrifugo. Vendor repository.
34. Sentrifugo on SourceForge (fetched). https://sourceforge.net/projects/sentrifugo/. Project listing.
35. Huly platform (fetched; archived banner, README, `plugins/recruit`). https://github.com/hcengineering/platform. Vendor repository.
36. Platform-Collective/platform and huly-selfhost. https://github.com/Platform-Collective/platform, https://github.com/hcengineering/huly-selfhost. Community and vendor.
37. Twenty CRM (LICENSE, tree search). https://github.com/twentyhq/twenty. Vendor repository.
38. PeelJobs open-source job portal. https://github.com/MicroPyramid/opensource-job-portal. Project repository.
39. Cal.diy, formerly the Cal.com public repository (README, LICENSE, commit `ab21c7f805`). https://github.com/calcom/cal.diy. Vendor repository.
40. Meilisearch (LICENSE, LICENSE-EE, README). https://github.com/meilisearch/meilisearch. Vendor repository.
41. OpenSearch (README, LICENSE.txt). https://github.com/opensearch-project/OpenSearch. Foundation project.
42. Typesense. https://github.com/typesense/typesense. Vendor repository.
43. Elasticsearch (LICENSE.txt). https://github.com/elastic/elasticsearch. Vendor repository.
44. Documenso (LICENSE, `packages/ee/LICENSE`). https://github.com/documenso/documenso. Vendor repository.
45. DocuSeal (LICENSE, LICENSE_ADDITIONAL_TERMS). https://github.com/docusealco/docuseal. Vendor repository.
46. OpenSign (LICENSE). https://github.com/OpenSignLabs/OpenSign. Vendor repository.
47. Keycloak. https://github.com/keycloak/keycloak. CNCF project.
48. Zitadel. https://github.com/zitadel/zitadel. Vendor repository.
49. Apache Tika. https://github.com/apache/tika. ASF project.
50. Docling. https://github.com/docling-project/docling. LF AI & Data project.
51. Unstructured. https://github.com/Unstructured-IO/unstructured. Vendor repository.
52. OpenResume. https://github.com/xitanggg/open-resume. Project repository.
53. pyresparser. https://github.com/OmkarPathak/pyresparser. Project repository.
54. Jitsi Meet. https://github.com/jitsi/jitsi-meet. Project repository.
55. n8n (LICENSE.md). https://github.com/n8n-io/n8n. Vendor repository.
56. Resume-Matcher and hiring-agent. https://github.com/srbhr/Resume-Matcher, https://github.com/interviewstreet/hiring-agent. Project repositories.
57. GitHub search API repository metadata (stars, forks, `open_issues_count`, `pushed_at`, `archived`, license), queried through the GitHub MCP `search_repositories` and `search_pull_requests` tools. GitHub.
58. Phase 0 audit: `docs/audit/EXECUTIVE_SUMMARY.md`, `PRODUCT_GAPS.md`, `FEATURE_INVENTORY.md`, `RISKS.md`, `RECOMMENDED_ROADMAP.md`. Local.
59. CandidATS site. https://candidats.net/. Project; search excerpt only (not fetched).
60. GitHub topic "applicant-tracking-system". https://github.com/topics/applicant-tracking-system. GitHub; seen as a search result, used for discovery through the API.
