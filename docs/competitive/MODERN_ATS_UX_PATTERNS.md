# Modern ATS UX Patterns: Cross-Market Benchmark for OpenCATS 2.0

**Phase:** 2, competitive market research (UX benchmark) · **Date:** 2026-09-25 · **Baseline:** OpenCATS 0.9.7.4 as audited in `docs/audit/`

This document compares UX patterns, not feature lists. For 22 pattern areas it asks the same questions: how the work gets done, how many steps it takes, what each actor decides, and what reduces effort or adds friction. It then states the repeated pattern and compares it with OpenCATS today. It does not rank vendors and does not design screens.

---

## Scope

- **Products benchmarked:** Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee (Tellent), Teamtailor, iCIMS, Workday Recruiting, SAP SuccessFactors Recruiting, Oracle Recruiting Cloud, Pinpoint, Gem and Bullhorn.
- **Additional independent evidence:** one large employer's public, step-by-step documentation of its Greenhouse process. This is GitLab's handbook, which also documents the ModernLoop scheduling layer.
- **Pattern areas (22):** dashboards/home · navigation and IA · candidate lists · candidate profiles · kanban/pipeline · advanced search · saved filters/views · bulk actions · interview scheduling · scorecards/interview kits · activity timelines · collaboration · notifications · analytics/reporting · settings/admin · permissions · empty states · loading states · error states · candidate-facing application and career sites · mobile and hiring-manager approvals · accessibility.
- **Journey benchmarks (3):**
  - (a) A recruiter moves a candidate through stages and schedules an interview.
  - (b) An interviewer submits a scorecard.
  - (c) A hiring manager reviews candidates and approves an offer.
- **Out of scope:** pricing (see `PRICING_AND_PACKAGING.md`), pixel-level design, vendor ranking and any "best ATS" verdict.

---

## Method

### Baseline
OpenCATS is described from `docs/audit/UX_UI_AUDIT.md` (findings UX-001…UX-022, journeys J1–J5, §12 "preserve vs redesign"), `docs/audit/FEATURE_INVENTORY.md` (FEAT-001…FEAT-020, module tables §2, pipeline state machine §3) and `docs/audit/PRODUCT_GAPS.md` (GAP-001…GAP-025).

### Evidence collection and its limits
These limits affect how far the findings can be trusted. They apply to the whole document.

1. **Vendor help-center pages could not be fetched.** The egress proxy blocked `WebFetch` for every vendor and publisher domain tried: support.greenhouse.io, help.lever.co, docs.ashbyhq.com, www.ashbyhq.com, help.workable.com, help.sap.com, docs.oracle.com and www.nngroup.com.
2. **Vendor help-center content therefore comes from search-engine excerpts** of the official pages, returned by `WebSearch`.
   - These claims are tagged **[SOURCE CLAIM · vendor · search excerpt]**.
   - Excerpts may be paraphrased by the search tool, may be out of date, and could not be read in context.
   - **Screenshots could not be viewed.** Descriptions of UI placement ("the toolbar runs along the top of the list") appear only where the excerpt text described it. All other visual claims are UNKNOWN.
3. **The web-search budget ran out.** Phase 2 agents shared a budget of 200 searches, and it was exhausted after this agent's 26th query. As a result, the following could not be researched and are reported as UNKNOWN:
   - iCIMS in general;
   - vendor detail on notifications, analytics, admin, permissions, mobile and accessibility conformance reports (VPAT/ACR);
   - **independent review aggregates** (G2, Capterra, TrustRadius). Sibling agents also recorded g2.com as blocked.
4. **First-hand reading of repositories.** Repositories were cloned with `git clone --depth 1` (sparse where large) into the scratchpad and read only; nothing was executed.

   | Repository | Commit | Type |
   |---|---|---|
   | `grnhse/greenhouse-api-docs` | @271cd88, 2026-09-10 | Official Greenhouse developer documentation |
   | `lever/postings-api` | @f61aac5, 2026-04-23 | Official Lever postings/apply API |
   | `bullhorn/career-portal` | @c450bae, 2026-05-22 | Bullhorn's official open-source career portal |
   | `teamtailor/tt-partner-docs` | @cba212f, 2026-09-09 | Official Teamtailor partner API documentation |
   | `gitlab-com/content-sites/handbook` | @f243917, 2026-09-25, `content/handbook/hiring` | Independent customer documentation |
   | `alphagov/govuk-design-system` | @52b7062 | General guidance |
   | `carbon-design-system/carbon-website` | @d8783ad | General guidance |
   | `Shopify/polaris` | @3f7954a | General guidance |
   | `w3c/wcag` | @71c891a | General guidance |
   | `w3c/aria-practices` | @3f094fd | General guidance |

   Sibling agents had already cloned the four official vendor repositories, and they were reused.
5. **Empty, loading and error states.** Vendor behaviour for these is almost never documented and is marked UNKNOWN. Recommendations in those areas rest on general guidance from GOV.UK Design System, IBM Carbon, Shopify Polaris and W3C WAI. Nielsen Norman Group is cited only where Carbon cites it, because nngroup.com could not be fetched.
6. **Untrusted content.** None of the material read contained instructions addressed to AI agents.

### Tag legend (evidence grades per the PREAMBLE addendum)
| Tag | Meaning |
|---|---|
| **[FACT]** | Directly read: the OpenCATS repo/audit (with ID), official vendor docs hosted on GitHub (`grnhse/greenhouse-api-docs`, `lever/postings-api`, `bullhorn/career-portal`, `teamtailor/tt-partner-docs`), or official design-system/W3C sources read from their repositories |
| **[SOURCE CLAIM · vendor · search excerpt]** | Text seen only as a WebSearch result or excerpt from an official vendor domain (vendor URL cited) |
| **[SOURCE CLAIM · vendor]** | Marketing or product assertion, e.g. AI results or percentages, whether seen in an excerpt or first-hand |
| **[SOURCE CLAIM · independent · read first-hand]** | Third-party statement read directly in its repository. Used here only for the GitLab handbook, a customer's own process documentation describing how it uses Greenhouse and ModernLoop |
| **[SOURCE CLAIM · independent · search excerpt]** | Independent publisher text (e.g. SAP Press, SAPinsider) seen only as a search excerpt |
| **[GENERAL GUIDANCE]** | Design-system or W3C guidance, not vendor behaviour. The guidance text was read first-hand, so the fact that the guidance says X is a FACT |
| **[INFERENCE]** | This author's reasoning |
| **[RECOMMENDATION]** | What OpenCATS 2.0 should do (principles, not screens) |
| **[UNKNOWN]** | Could not verify |

**Verification status.** Every claim tagged "search excerpt" requires browser verification of the cited page before this document or any derivative is published externally. It is especially important to check wording, current UI names and whether a feature is gated to a plan or tier. Search excerpts can be stale: for example, Greenhouse has one older article saying candidate searches cannot be saved and a newer article describing "Save filters" (see §7).

**Citations** use `[Sn](url)` plus "accessed 2026-09-25". The numbered Sources section at the end lists every entry with its publisher/type and access date.

---

## Summary table

"Market convergence" means how consistently the pattern appears across the products for which evidence was obtained: **High** (4 or more products), **Medium** (2–3), **Low/Unknown** (1 or unverified). Gap severity is for OpenCATS against that pattern.

| # | Pattern | Market convergence | OpenCATS today (audit IDs) | Gap severity |
|---|---|---|---|---|
| 1 | Home = role-aware action queue (tasks, reviews due, feedback due, interviews) | High (Greenhouse, Workable, Teamtailor, ModernLoop) | Six fixed widgets, one mislabelled, "Important Candidates" not user-scoped, no tasks (FEATURE_INVENTORY §2.1) | HIGH |
| 2 | Object-centric nav (Jobs / Candidates / Tasks / Reports / Settings), role-filtered, global search | Medium | 10 tabs with sub-tabs; visibility rules are cosmetic; no landmarks or skip link (UX_UI_AUDIT §1.2, §6; FEATURE_INVENTORY §2.23) | MEDIUM |
| 3 | One configurable list component with filters in URL, columns, board/list toggle | High (Greenhouse, Bullhorn, Teamtailor, Ashby, Workable) | DataGrid with full reloads; broken selection; mouse-only column tools; fatal on PHP 8 (UX-014, UX-002, UX-005, UX-008) | HIGH |
| 4 | Application-centric profile: stage/next action in main panel, tabbed reference panel, filterable feed | Medium–High (Greenhouse, Teamtailor) | Long Show page; modal actions reload the page; text corrupted on edit (FEATURE_INVENTORY §2.2; UX-003, UX-014) | HIGH |
| 5 | Kanban board with list parity; rejection as an attribute with reasons; stage automation | High (Teamtailor, Recruitee, Pinpoint, Ashby; Workable and Recruitee on disqualification) | No board; 11 hard-coded statuses; rejections are statuses (FEAT-001; UX_UI_AUDIT §12.2) | HIGH |
| 6 | Boolean search with chips/facets and explicit scope; semantic/AI search emerging | High for boolean (Greenhouse, Lever, Workable); emerging for semantic (Gem, Greenhouse) | `LIKE`/`REGEXP` modes; unpaginated quick search; encoding gaps (FEATURE_INVENTORY §2.2; GAP-016; UX-006) | HIGH |
| 7 | Saved views (private/shared, named, URL-addressable) | Medium (Bullhorn, Greenhouse) | 5 recent/saved searches; static lists only; dynamic lists unimplemented (UX_UI_AUDIT §1.5; FEAT-017) | MEDIUM |
| 8 | Contextual bulk bar: stage, email, reject with reason and template, tag, share | High (Lever, Greenhouse, Recruitee, Pinpoint, Ashby) | Bulk selection silently dropped; bulk e-mail SA-only and synchronous; no bulk status (UX-002, FEAT-013, FEAT-020, UX-021) | HIGH (correctness) |
| 9 | Calendar-connected scheduling: self-schedule, availability collection, panels, candidate reschedule | High (Greenhouse, Workable, Teamtailor, Ashby, Oracle, SAP SF, Workday) | Single-owner calendar event with no attendees or invites; reminders depend on a broken cron (FEATURE_INVENTORY §2.6; FEAT-004, FEAT-010; GAP-006) | HIGH |
| 10 | Interview kit + structured scorecard, independent submission, overall recommendation | High (Greenhouse, Teamtailor, Lever) | One 0–5 star per pipeline row; no rater or criteria; inaccessible (FEATURE_INVENTORY §2.4; UX-005; GAP-007) | HIGH |
| 11 | Unified, filterable activity timeline with visibility | Medium (Greenhouse, Teamtailor) | Manual activities editable by any user; history on a separate page (FEATURE_INVENTORY §2.5, §2.16; FEAT-006; GAP-011, GAP-013) | HIGH |
| 12 | Hiring team per job; private/visibility-scoped notes; comments/to-dos | Medium (Greenhouse, Teamtailor); @mentions UNKNOWN | No hiring-team roles, private notes or to-dos (GAP-010) | HIGH |
| 13 | Multi-channel notifications (in-app, e-mail, chat, mobile) with preferences | Low evidence (Workday, SmartRecruiters claims) | E-mail only; candidate e-mail pre-checked; cron-dependent (UX-021, FEAT-018, FEAT-010) | HIGH |
| 14 | Role dashboards (hiring manager, interviews) with drill-down | Medium (Lever, Greenhouse, Workable) | 9 fixed periods; no filters or export; fragile counts (UX_UI_AUDIT J5; FEAT-008; GAP-014) | HIGH |
| 15 | UI-configurable workflows, interview plans and triggers | Medium (Workable, Pinpoint, Ashby, Teamtailor, Greenhouse) | Statuses, job types and ACL only via PHP/config; raw-HTML career templates (FEAT-001; FEATURE_INVENTORY §2.16, §4) | HIGH |
| 16 | Role × scope permissions (job/office/department), visible in the UI | Medium (Greenhouse, Teamtailor) | One global level; unchecked entry points (FEAT-006; GAP-003) | CRITICAL |
| 17 | Contextual empty states with a next action | Vendors UNKNOWN; strong general guidance | Text baked into JPGs; CTAs contain only `&nbsp;` (UX_UI_AUDIT §8; UX-005) | MEDIUM |
| 18 | Skeleton/inline loading, optimistic updates, announced to screen readers | Vendors UNKNOWN; strong general guidance | Full-page reload model; modals reload the parent (UX-014) | MEDIUM |
| 19 | Validation that keeps input, error summary, distinct system-error pages | Vendors UNKNOWN; strong general guidance | "Fatal error" page loses the form; `alert()`; GET deletes; blank careers pages (UX-013, UX-012) | HIGH |
| 20 | Hosted, mobile-first apply: minimal required fields, configurable questions, explicit consent, optional EEO | High (Lever, Greenhouse, Bullhorn, Workday) | 5–8 loads; no search; 940 px layout; wrong EEO options; no consent; weak candidate identity (J4; UX-001, UX-004, UX-007, UX-011, UX-012; GAP-012) | CRITICAL |
| 21 | Approval chains (groups, sequential/parallel, quorum) actionable on mobile/chat | Medium (Greenhouse approvals; Workable/SmartRecruiters apps; Workday claim) | No requisition/offer approvals; no hiring-manager role; not responsive (GAP-008, GAP-009, GAP-010; UX-001) | HIGH |
| 22 | WCAG 2.2 AA including drag alternatives, status messages, accessible auth | Vendors UNKNOWN (ACRs not checked) | 0 ARIA; 108 images without `alt`; contrast down to 1.37:1; inaccessible modals (UX_UI_AUDIT §6; UX-005, UX-009, UX-010; GAP-019) | CRITICAL (legal) |

---

## Pattern areas

Every area uses the same sub-headings:
1. Why it exists
2. How it works in products
3. Bulk actions
4. Effort reducers (recruiter / hiring manager)
5. Friction
6. Repeated pattern
7. OpenCATS today and gap
8. Recommendation

---

### 1. Dashboards / home

**Why it exists.** Recruiters run many requisitions at once, and hiring managers and interviewers visit only occasionally. The home page answers "what needs me now?" so that nobody has to search job by job. [INFERENCE]

**How it works**

- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]
  - **My Tasks.** A user's tasks appear in a "My Tasks" panel on "My Dashboard". Tasks are assigned *automatically* from the user's hiring-team role on a job ([S1](https://support.greenhouse.io/hc/en-us/articles/4402108629787-Task-management-overview), accessed 2026-09-25).
  - **Role-based content.** What a user sees, including "applications to review", depends on their hiring-team role. When a job has candidates in the Hiring Manager Review stage, the assigned hiring manager sees an **"Applications to Review"** panel ([S2](https://support.greenhouse.io/hc/en-us/articles/115003243886-Personalize-your-Greenhouse-Recruiting-dashboard), [S3](https://support.greenhouse.io/hc/en-us/articles/360016572311-Hiring-team-role-Hiring-manager), [S4](https://support.greenhouse.io/hc/en-us/articles/4402694472347-Hiring-Manager-Review-stage), accessed 2026-09-25).
  - **Personalisation.** Users can personalise which dashboard modules they see ([S2](https://support.greenhouse.io/hc/en-us/articles/115003243886-Personalize-your-Greenhouse-Recruiting-dashboard), accessed 2026-09-25).
  - **Independent confirmation** [SOURCE CLAIM · independent · read first-hand]: GitLab's handbook tells interviewers they "can find a scorecard link on their Greenhouse dashboard for any upcoming or past interviews" ([S78](https://handbook.gitlab.com/handbook/hiring/interviewing/), `interviewing/_index.md:66`, accessed 2026-09-25). It also says referrers follow referrals in a **"My Referrals"** dashboard section ([S80](https://handbook.gitlab.com/handbook/hiring/referral-operations/), `referral-operations.md:54`, accessed 2026-09-25).
- **Workable** [SOURCE CLAIM · vendor · search excerpt]
  - The home page is "tailored to each user's role": daily agenda, to-dos, company events, time off, jobs and admin duties. Its layout adapts to role, account content and whether the user has an employee profile ([S32](https://help.workable.com/hc/en-us/articles/22233308582423-Exploring-Workable-home-page), accessed 2026-09-25).
  - The **mobile** dashboard gives upcoming events, candidates to evaluate and hiring progress. The user taps a job, or "View all" for jobs where they are on the hiring team ([S33](https://help.workable.com/hc/en-us/articles/360039694933-Mobile-dashboard-overview), accessed 2026-09-25).
- **Lever** [SOURCE CLAIM · vendor · search excerpt]
  - A Visual Insights "Hiring Manager dashboard" shows posting progress and key metrics ([S25](https://help.lever.co/hc/en-us/articles/6618029187981-Visual-Insights-Hiring-Manager-dashboard), accessed 2026-09-25).
  - Interviewers use an "Interviews" section with a **"Complete Feedback"** action beside each interview ([S24](https://help.lever.co/hc/en-us/articles/20087358474397-Getting-started-with-Lever-as-an-Interviewer), accessed 2026-09-25).
- **Teamtailor** [SOURCE CLAIM · vendor · search excerpt]: hiring managers land on a Jobs tab listing only jobs they were invited to. Inside a job they "focus on the candidates that need their attention" ([S45](https://support.teamtailor.com/en/articles/11161661-hiring-manager-guide-to-teamtailor), accessed 2026-09-25).
- **ModernLoop** (scheduling layer used by GitLab on top of Greenhouse) [SOURCE CLAIM · independent · read first-hand]: work starts from "My Tasks", which has an "Action required" bucket (candidates labelled "ready to Schedule") and a "Pending" section ([S76](https://handbook.gitlab.com/handbook/hiring/talent-acquisition-framework/coordinator/), `coordinator.md:170-184`, accessed 2026-09-25).
- **Decisions made from home** [INFERENCE]
  - Recruiter: which requisition or task to handle first.
  - Hiring manager: advance or reject applications in the review queue.
  - Interviewer: open the kit, then submit feedback.

**Bulk actions.** No product documents bulk actions from the home page itself [UNKNOWN]. Queues deep-link into lists where bulk actions exist (§8) [INFERENCE].

**Effort reducers**
- *Recruiter:* tasks are generated from role assignment rather than created by hand (Greenhouse S1).
- *Hiring manager and interviewer:* a single "to review" or "feedback due" entry point (Greenhouse S2–S4, Lever S24, GitLab S78).

**Friction.**
- Independent review evidence could not be gathered [UNKNOWN].
- [INFERENCE] Personalisable dashboards (Greenhouse S2) move configuration work to users. A dashboard that depends on configuration is not useful on first login.

**Repeated pattern** [INFERENCE]. Home is a **role-derived action queue**: tasks, reviews due, feedback due and upcoming interviews, each deep-linking to the action. Metrics are secondary and live in reporting (§14). Hiring managers and interviewers see only jobs where they are on the hiring team.

**OpenCATS today and gap** [FACT]
- Home shows six widgets: "My Recent Calls" (misnamed: it is any recent activity), upcoming events and calls, "Recent Hires", a server-rendered "Hiring Overview" JPEG, and "Important Candidates" (not user-scoped) (`FEATURE_INVENTORY.md` §2.1).
- There is no task or to-do object (§2 of the inventory lists none).
- Empty states are text-in-image (`UX_UI_AUDIT.md` §8).
- **Gap: HIGH.** Nothing tells a user what they must act on.

**Recommendation** [RECOMMENDATION]
- Make home an action queue derived from hiring-team role and pipeline state: reviews due, feedback due, interviews today, approvals waiting, stalled candidates.
- Make it useful with zero configuration.
- Make every item actionable in one step, with a deep link to the exact action.
- Put metrics behind a link.

---

### 2. Navigation & information architecture

**Why it exists.** An ATS has many objects: jobs/requisitions, candidates, applications, interviews, offers, reports and settings. Different roles need different subsets. IA decides how quickly a user reaches the job, the candidate or the task. [INFERENCE]

**How it works**
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]
  - The navigation bar exposes **Candidates** (All Candidates), **Jobs** and **Reports** ([S7](https://support.greenhouse.io/hc/en-us/articles/360028064592-Move-candidates-to-another-stage-in-bulk), [S9](https://support.greenhouse.io/hc/en-us/articles/202360199-Search-candidates-using-Boolean-queries), accessed 2026-09-25).
  - The candidate profile is organised by interview stage, with a tabbed right-hand panel ([S5](https://support.greenhouse.io/hc/en-us/articles/11957068130971-Using-the-new-candidate-profile), accessed 2026-09-25).
- **Teamtailor** [SOURCE CLAIM · vendor · search excerpt]
  - Hiring managers navigate via the Jobs tab ([S45](https://support.teamtailor.com/en/articles/11161661-hiring-manager-guide-to-teamtailor), accessed 2026-09-25).
  - One excerpt states that users see an additional **Candidates** tab only if added to a Group ([S55](https://support.teamtailor.com/en/articles/8182137-default-user-guide-to-teamtailor), accessed 2026-09-25). *Attribution to this exact article is uncertain; verify.*
  - Candidate-card tabs have keyboard shortcuts (Ctrl+1…5) ([S46](https://support.teamtailor.com/en/articles/9153972-our-candidate-card), accessed 2026-09-25).
- **Recruitee** [SOURCE CLAIM · vendor · search excerpt]: the user clicks "Talent Pools in the menu on the left" ([S44](https://support.recruitee.com/en/articles/1066269-search-candidates-in-a-talent-pool), accessed 2026-09-25).
- **Ashby** [SOURCE CLAIM · vendor · search excerpt]: the pipeline view groups work by **stage category**: leads, application review, active, pending offer ([S30](https://docs.ashbyhq.com/candidate-pipeline), accessed 2026-09-25).
- **ModernLoop** [SOURCE CLAIM · independent · read first-hand]: a left "task bar" holds My Tasks, Modules and Jobs. Organisation settings are in the left menu and changeable by admins only ([S76](https://handbook.gitlab.com/handbook/hiring/talent-acquisition-framework/coordinator/), `coordinator.md:170-237`, accessed 2026-09-25).

**Bulk actions.** Not applicable.

**Effort reducers**
- *Recruiter:* job-first navigation, stage categories and keyboard shortcuts (Teamtailor S46).
- *Hiring manager:* sees only invited jobs (Teamtailor S45) and only the tabs they can use (S55, unverified).

**Friction.** [UNKNOWN] No independent evidence gathered.

**Repeated pattern** [INFERENCE]
- A small number of object-centric top-level destinations: Jobs, Candidates, a task/inbox surface, Reports and Settings.
- Destinations are **filtered by role**.
- A persistent global search.
- The unit of workflow is the **application** (candidate × job), reached from either side.

**OpenCATS today and gap** [FACT]
- 10 top-level tabs (Dashboard, Activities, Job Orders, Candidates, Companies, Contacts, Lists, Calendar, Reports, Settings) with sub-tabs. Visibility rules are encoded in strings (`*al=`, `*hrmode=`) and only hide links (`UX_UI_AUDIT.md` §1.2; `FEATURE_INVENTORY.md` §2.23).
- The MRU "Recent:" bar and quick search are worth keeping (`UX_UI_AUDIT.md` §12.1).
- There is no skip link and no landmarks (§6, WCAG 2.4.1), and the active sub-tab is shown by colour only (§1.2).
- [INFERENCE] The IA is agency-first: Companies and Contacts sit at the same level as Jobs and Candidates. Corporate talent-acquisition users have no hiring-manager or interviewer surface.
- **Gap: MEDIUM.**

**Recommendation** [RECOMMENDATION]
- Keep a small, role-filtered set of object destinations. Configure agency (clients/contacts) and corporate (requisitions/hiring teams) modes rather than showing both.
- Keep MRU and global quick search, and add type-ahead with recent-search suggestions and a scope filter, per Carbon's search pattern ([S85](https://carbondesignsystem.com/patterns/search-pattern/), [GENERAL GUIDANCE], accessed 2026-09-25).
- Add landmarks, a skip link and consistent placement of help. WCAG 2.2 SC 3.2.6: "Put help in the same place when it is on multiple pages" ([S109](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html), accessed 2026-09-25).
- Enforce role visibility on the server, not only in navigation.

---

### 3. Candidate lists

**Why it exists.** Triage at volume: find, sort and act on many candidates or applications without opening each one. [INFERENCE]

**How it works**
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]
  - All Candidates has **left-panel filters** that can widen scope to prospects, rejected applications or closed jobs ([S11](https://support.greenhouse.io/hc/en-us/articles/27104809835291-Talent-Filtering), accessed 2026-09-25).
  - The page URL "reflects all filters applied" ([S10](https://support.greenhouse.io/hc/en-us/articles/200775575-Save-candidate-search), accessed 2026-09-25).
  - Talent Filtering can filter by location, referrals, scorecard status, education or custom criteria ([S9](https://support.greenhouse.io/hc/en-us/articles/202360199-Search-candidates-using-Boolean-queries), [S11](https://support.greenhouse.io/hc/en-us/articles/27104809835291-Talent-Filtering), accessed 2026-09-25).
- **Bullhorn "New Candidate List"** [SOURCE CLAIM · vendor · search excerpt]
  - **List view or Grid view**, with layouts that are **user-specific**.
  - Quick Filters and Column Filters "act as shortcuts to the Add Filter tool in Advanced Search".
  - Some fields, such as Custom Object fields, cannot be columns ([S59](https://kb.bullhorn.com/ats/Content/BHATS/Topics/newCandidateListFAQ.htm), accessed 2026-09-25).
- **Teamtailor Applications view** [SOURCE CLAIM · vendor · search excerpt]: one view across all jobs, with **Board** (pipeline) and **List** ("a structured table… for scanning, sorting, and working through large volumes") ([S49](https://support.teamtailor.com/en/articles/15443685-manage-candidates-across-multiple-recruitment-processes-in-the-applications-view), [S50](https://updates.teamtailor.com/manage-candidates-across-all-your-jobs-in-one-place-341111), accessed 2026-09-25).
- **Ashby** [SOURCE CLAIM · vendor · search excerpt]: "a drag-and-drop kanban board or a list view" ([S30](https://docs.ashbyhq.com/candidate-pipeline), accessed 2026-09-25).
- **Workable** [SOURCE CLAIM · vendor · search excerpt]: a per-job pipeline view shows candidates per stage with counts "at a glance" ([S34](https://help.workable.com/hc/en-us/articles/8495289154839-Moving-candidates-through-the-pipeline), accessed 2026-09-25).
- **Decisions** [INFERENCE]: which candidates to open, which to advance or reject in bulk, and which filters define "my work".

**Bulk actions.** Selection from lists drives bulk actions in every product documented (§8).

**Effort reducers**
- *Recruiter:* URL-encoded filters (Greenhouse S10), per-user layouts (Bullhorn S59), cross-job views (Teamtailor S49).
- *Hiring manager:* a board or list limited to invited jobs (Teamtailor S45).

**Friction.**
- [FACT, vendor-documented limitation] Bullhorn cannot show some custom-object fields as columns (S59).
- Independent evidence: [UNKNOWN].

**Repeated pattern** [INFERENCE]. One list component everywhere, with:
- filters and sort persisted in the URL;
- per-user column layouts;
- list/board parity;
- selection feeding a bulk bar.

**General guidance** [GENERAL GUIDANCE]
- Carbon's data table puts search, filtering and batch actions in a table toolbar ([S86](https://carbondesignsystem.com/components/data-table/usage/), accessed 2026-09-25).
- Shopify Polaris' IndexTable combines saved views, search, filtering, sorting, bulk actions, "selection across pages", an empty state and a loading state ([S97](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/index-table.mdx), accessed 2026-09-25).

**OpenCATS today and gap** [FACT]
- The DataGrid has server paging (15 rows by default), sorting and a per-user column chooser with persisted widths and order. The column chooser is worth keeping (`UX_UI_AUDIT.md` §10, §12.1).
- Filters are "Only My", "Only Hot" and tag (`FEATURE_INVENTORY.md` §2.2).
- Every sort, page, filter or column change reloads the full page (UX-014).
- Column reorder and resize are mouse-only (UX-005).
- The selection passed to bulk actions is lost (UX-002).
- All lists fatal on PHP ≥ 8 (UX-008).
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- Build one accessible data-grid component.
- Keep list state in the URL and update rows asynchronously.
- Provide a keyboard-operable column manager, preserving the existing per-user preference concept.
- Give pipeline data both a list and a board rendering.
- Make selection able to span pages, as Polaris does.

---

### 4. Candidate profiles

**Why it exists.** It is the single place to judge a person and act on their application(s) without switching screens. [INFERENCE]

**How it works**
- **Greenhouse (redesigned profile)** [SOURCE CLAIM · vendor · search excerpt] ([S5](https://support.greenhouse.io/hc/en-us/articles/11957068130971-Using-the-new-candidate-profile), [S6](https://support.greenhouse.io/hc/en-us/articles/30352015432987-Candidate-profile-redesign-overview), accessed 2026-09-25)
  - The **main panel** gives an overview of each interview stage. Expanding a stage shows interviewer decisions and **in-context actions**: schedule interviews, send confirmations, assign scorecards.
  - The **activity feed** is a complete record "from stage changes to notes", with **filters and search**.
  - The **right panel** has tabs:
    - *Candidate details*: contact details, current role, **time zone**, custom question answers.
    - *Application details*: hiring team, documents, application responses, background check.
    - *Notes*: notes can be **private to specific team members** or added to the interview kit.
  - Scorecards use tabs that separate submitted scorecards from an attribute summary.
- **Teamtailor candidate card** [SOURCE CLAIM · vendor · search excerpt]
  - Sidebar tabs: **Activity, Comments, To-dos, Evaluation, Messages**, reachable with **Ctrl+1…5** ([S46](https://support.teamtailor.com/en/articles/9153972-our-candidate-card), accessed 2026-09-25).
  - Evaluations from the user and colleagues are shown together for comparison ([S47](https://support.teamtailor.com/en/articles/2564412-job-scorecards), accessed 2026-09-25).
  - Hiring managers "manage everything related to the specific candidate, such as comments, to-dos, interviews, and messages" from the card ([S45](https://support.teamtailor.com/en/articles/11161661-hiring-manager-guide-to-teamtailor), accessed 2026-09-25).
- **Gem (rediscovery)** [SOURCE CLAIM · vendor]: shows prior context when resurfacing a past candidate: when they last applied, why they were rejected, interview feedback and who last contacted them ([S61](https://www.gem.com/product/ai-sourcing), accessed 2026-09-25).
- **Decisions** [INFERENCE]
  - Recruiter: advance, reject (with reason), schedule, message.
  - Hiring manager: yes/no on the application, and feedback.

**Bulk actions.** Not applicable on a single profile. Multi-application actions (e.g. add to another job) are documented as list bulk actions (Greenhouse [S18](https://support.greenhouse.io/hc/en-us/articles/360028035692-Add-candidates-to-another-job-in-bulk), title only, accessed 2026-09-25).

**Effort reducers**
- *Recruiter:* stage-scoped actions in place (Greenhouse S5); keyboard tab switching (Teamtailor S46).
- *Hiring manager:* one card holding everything needed for the decision (Teamtailor S45).

**Friction.** [UNKNOWN] Independent evidence not gathered.

**Repeated pattern** [INFERENCE]. The profile has two zones:
1. **What is happening and what is next** for this application: stage, next action, interviews, scorecards.
2. **Reference material**: details, documents, notes, timeline, split into tabs.

Actions sit where the information is. Visibility is set per note.

**OpenCATS today and gap** [FACT]
- The Show page stacks data, the EEO block, attachments, pipelines with star rating, activities, upcoming events, extra fields, lists, tags, questionnaires and a duplicate banner (`FEATURE_INVENTORY.md` §2.2).
- Actions open iframe modals that reload the page (`UX_UI_AUDIT.md` J3, UX-014).
- Names are double-escaped on edit (UX-003).
- There is no "next action" and no scorecards (GAP-007).
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- Build an application-centric profile with a clear next action per application and in-place updates.
- Keep OpenCATS' strongest pattern, the **one-dialog status workflow**: a status change auto-writes the activity, offers an e-mail and an event, and "Placed" decrements openings (`UX_UI_AUDIT.md` §12.1). Present it as a side panel instead of a page-reloading modal.
- Give notes visibility levels.

---

### 5. Kanban / pipeline views

**Why it exists.** It shows flow and bottlenecks per job and lets a recruiter move candidates with minimal effort. [INFERENCE]

**How it works**
- **Teamtailor** [SOURCE CLAIM · vendor · search excerpt] ([S49](https://support.teamtailor.com/en/articles/15443685-manage-candidates-across-multiple-recruitment-processes-in-the-applications-view), [S50](https://updates.teamtailor.com/manage-candidates-across-all-your-jobs-in-one-place-341111), accessed 2026-09-25)
  - The Board view supports drag-and-drop between stages, **across multiple jobs without opening each job**.
  - Empty stages can be **hidden**.
  - A List view is available as an alternative.
- **Teamtailor stage automation** [FACT] ([S54](https://github.com/teamtailor/tt-partner-docs), `source/includes/partners/_webhooks.md.erb`, `moving_criteria/_index.md.erb:3-5,165-198`, accessed 2026-09-25)
  - Stages carry **triggers**, for example calling an assessment partner.
  - "Moving criteria" let recruiters "build an ordered list of rules" that **move the candidate to a different stage** based on partner results.
  - The rules apply only while the candidate is still in the stage where the trigger fired.
- **Recruitee** [SOURCE CLAIM · vendor · search excerpt]
  - Drag-and-drop pipeline ([S43](https://recruitee.com/candidate-pipeline-management), accessed 2026-09-25).
  - Checkboxes can select individuals **or entire stages** ([S41](https://support.recruitee.com/en/articles/1066290-performing-bulk-actions), accessed 2026-09-25).
  - It recommends **disqualify reasons instead of a "rejected" stage** ([S42](https://support.recruitee.com/en/articles/4142043-pipelines), accessed 2026-09-25).
- **Pinpoint** [SOURCE CLAIM · vendor · search excerpt]: click the "Board View" icon on a job, then "click and drag to move candidates to new stages or use the checkbox next to their name to perform actions in bulk" ([S56](https://help.pinpoint.support/en/articles/10505682-board-view), accessed 2026-09-25).
- **Ashby** [SOURCE CLAIM · vendor · search excerpt]: stage categories are leads, application review (with a **bulk application review tool**), active up to offer, and pending offer. Kanban or list ([S30](https://docs.ashbyhq.com/candidate-pipeline), [S31](https://docs.ashbyhq.com/application-review), accessed 2026-09-25).
- **Lever** [SOURCE CLAIM · vendor · search excerpt]: stages "are listed horizontally above the opportunities list, to mirror the forward progression". A bulk toolbar sits "below the stage/archive reason tiles" ([S21](https://help.lever.co/hc/en-us/articles/20087316973981-Using-the-bulk-action-toolbar), [S22](https://help.lever.co/hc/en-us/articles/20087378017949-Understanding-the-structure-of-your-pipeline), accessed 2026-09-25). [INFERENCE] This is a stage-tile + list layout rather than card columns.
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]: the "Visual Candidate Pipeline" summarises active candidates per stage and "what actions need to be taken" ([S8](https://support.greenhouse.io/hc/en-us/articles/4874727408795-Visual-Candidate-Pipeline), accessed 2026-09-25).
- **Workable** [SOURCE CLAIM · vendor · search excerpt] ([S34](https://help.workable.com/hc/en-us/articles/8495289154839-Moving-candidates-through-the-pipeline), [S35](https://help.workable.com/hc/en-us/articles/4413312707991-Recruiting-pipeline-best-practices), accessed 2026-09-25)
  - Candidates can move forward **or backward**.
  - The "red hand" button disqualifies a candidate. Disqualified candidates **stay at the last stage reached**, under a "Disqualified" tab.
  - Workable advises against a custom "Disqualified" stage.
- **Decisions** [INFERENCE]: advance, move back or reject (with reason); for hiring managers, advance or reject in a review stage.

**Bulk actions.** Checkbox selection on the board (Pinpoint, Recruitee) and whole-stage selection (Recruitee). See §8.

**Effort reducers**
- *Recruiter:* moving is one gesture; cross-job boards; stage automation that auto-advances on assessment outcome (Teamtailor S54); hidden empty stages.
- *Hiring manager:* a review stage feeding their queue (Greenhouse S4, Ashby S31).

**Friction**
- [SOURCE CLAIM · vendor · search excerpt] Workable: a disqualified candidate cannot be moved to another stage until reverted to Qualified (S34). This is a vendor-documented limitation.
- [GENERAL GUIDANCE] Drag-only boards fail WCAG 2.2 SC 2.5.7 Dragging Movements: "For any action that involves dragging, provide a simple pointer alternative". Keyboard support alone does not satisfy it ([S101](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), accessed 2026-09-25).

**Repeated pattern** [INFERENCE]
- Columns per configurable stage, with counts.
- **Rejection is an attribute** (disqualified/archived plus a reason), not a column. Two vendors say so explicitly (Workable S35, Recruitee S42).
- Board/list parity.
- Stage-entry automation.

**OpenCATS today and gap** [FACT]
- There is no board. The pipeline is an AJAX table on the job order.
- There are **11 hard-coded statuses** with no transition rules and no admin UI (FEAT-001, GAP-005).
- Rejections are statuses: 650 "Not in Consideration" and 700 "Client Declined" (`FEATURE_INVENTORY.md` §3.1).
- There are no disposition reasons (GAP-021).
- The audit already proposes a board that keeps the status side-panel side effects (`UX_UI_AUDIT.md` §12.2 item 1).
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- Per-job stage templates.
- Reject or disqualify as an attribute with required reason and optional templated message.
- A board with a non-drag "Move to…" control on each card (WCAG 2.5.7) and full list parity.
- Stage-entry automations (e-mail, scheduling link, assessment) that are visible and overridable.
- Keep all existing status side effects on every move path.

---

### 6. Advanced search (boolean, semantic)

**Why it exists.** Rediscovering past applicants and sourcing from one's own database is cheaper than external sourcing. Agencies search their database constantly. [INFERENCE]

**How it works**
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]
  - On All Candidates, **toggle "Full Text Search"** in the left panel to enable Boolean queries. The search then covers resumes and notes.
  - Supported syntax: AND, OR, NOT, quoted phrases, parentheses and wildcards ([S9](https://support.greenhouse.io/hc/en-us/articles/202360199-Search-candidates-using-Boolean-queries), accessed 2026-09-25).
  - Talent Rediscovery supports "save and reuse searches or grouped filters" ([S17](https://support.greenhouse.io/hc/en-us/articles/30184390692379-Talent-Rediscovery), accessed 2026-09-25).
- **Lever** [SOURCE CLAIM · vendor · search excerpt] ([S23](https://help.lever.co/hc/en-us/articles/20087317030685-Searching-the-database-for-candidates), accessed 2026-09-25)
  - AND, OR and NOT combine **field-specific terms**, with parentheses and quotes.
  - **Filter chips** sit below the search field.
  - A **"Resume" chip** limits matches to parsed resume text, excluding notes and feedback.
- **Workable** [SOURCE CLAIM · vendor · search excerpt] ([S36](https://help.workable.com/hc/en-us/articles/6058530293015-How-do-I-run-an-advanced-boolean-search-for-candidates), accessed 2026-09-25)
  - Operators: AND is the default; OR; NOT as a prefix; parentheses for precedence.
  - Scope: resume, experience, skills, application answers. It does **not** search comments or custom fields.
  - **Fuzzy matching by default**: "Tom" can match "Tim", plus prefix matches such as "Tomas".
- **Bullhorn** [SOURCE CLAIM · vendor · search excerpt]: Quick Search plus Advanced Search "Add Filter". Recent searches appear on the left of the Candidate List ([S58](https://kb.bullhorn.com/ats/Content/BHATS/Topics/savedAndRecentSearches.htm), accessed 2026-09-25).
- **Semantic / AI** [SOURCE CLAIM · vendor]
  - Gem: describe the ideal candidate "in plain language"; results come from its profile database, the customer's ATS pipeline and CRM.
  - Gem's rediscovery agent surfaces past candidates with context ([S61](https://www.gem.com/product/ai-sourcing), [S62](https://help.gem.com/external/getting-started-with-ai-sourcing), accessed 2026-09-25).
  - Greenhouse documents Talent Rediscovery and "Past candidates in Talent Matching" (S17; details not verified).

**Bulk actions.** Search results feed the same list or bulk actions: add to job, add to pool, e-mail (see §8). Whether each vendor's search-results page supports bulk actions: [UNKNOWN].

**Effort reducers**
- *Recruiter:* chips and facets avoid hand-written boolean (Lever S23); scope toggles (Greenhouse full text, Lever resume chip); natural-language queries (Gem).
- *Hiring manager:* none documented [UNKNOWN].

**Friction** [INFERENCE from vendor-documented behaviour]
- **Search scope differs between products and is often implicit.**
  - Greenhouse full text includes notes.
  - Lever needs a chip to exclude notes and feedback.
  - Workable excludes comments and custom fields.
- Users cannot easily predict what "no results" means.
- Default fuzzy matching (Workable) trades recall for precision.

**Repeated pattern** [INFERENCE]
- One search entry point with progressive power: keywords → chips/facets → boolean.
- An **explicit, visible scope** (resume, notes, feedback, custom fields).
- Results appear in the standard list component.
- Semantic/AI search is emerging as a separate mode that explains why each match was returned.

**OpenCATS today and gap** [FACT]
- Candidate search has separate modes: full name, key skills, resume full text (boolean REGEXP, or Sphinx if enabled), city, phone (`FEATURE_INVENTORY.md` §2.2).
- Quick search runs four unpaginated `%LIKE%` queries (`UX_UI_AUDIT.md` §1.5, §10).
- Some search output is not encoded (UX-006).
- Covered by GAP-016.
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- Use an index-backed search with facets, boolean syntax, typo tolerance that is **visible and switchable**, and explicit scope toggles that respect permissions (private notes and EEO data must not leak into results).
- Show "no results" guidance.
- If semantic search is added later, it should be opt-in, show match explanations and keep a human in the loop.

---

### 7. Saved filters / views

**Why it exists.** Recurring slices ("my open reqs, stage = onsite, no feedback") should take one click to reach, and should be shareable within a team. [INFERENCE]

**How it works**
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]. The two articles differ:
  - An older article states there is **no in-app way to save a candidate search**. It recommends bookmarking the URL because the URL reflects all filters ([S10](https://support.greenhouse.io/hc/en-us/articles/200775575-Save-candidate-search), accessed 2026-09-25).
  - The newer Talent Filtering article describes **"Save filters"**, with saved sets listed under "Your filters" *for a job* ([S11](https://support.greenhouse.io/hc/en-us/articles/27104809835291-Talent-Filtering), accessed 2026-09-25).
  - Current state: **UNKNOWN; verify**.
- **Bullhorn** [SOURCE CLAIM · vendor · search excerpt] ([S58](https://kb.bullhorn.com/ats/Content/BHATS/Topics/savedAndRecentSearches.htm), accessed 2026-09-25)
  - Saved searches appear on the right of the Candidate List and recent searches on the left, plus a "Saved" button for the full list.
  - Saved searches are **Public** (whole corporation) or **Private**.
  - Quick Search filters saved searches by title.
- **Teamtailor** [SOURCE CLAIM · vendor · search excerpt]: Board and List views across jobs (S49). Named saved views: [UNKNOWN].
- **General guidance** [GENERAL GUIDANCE]
  - Polaris IndexFilters: tabs are "a list of saved views". Users can create, rename, duplicate and delete views. The primary action is **"Save" or "Save as" depending on whether the view is mutable** ([S96](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/selection-and-input/index-filters.mdx), accessed 2026-09-25).
  - Carbon distinguishes **batch-apply** filters (for slow data) from **instant** filters and requires "a way to clear all applied filters at once" ([S84](https://carbondesignsystem.com/patterns/filtering/), accessed 2026-09-25).

**Bulk actions.** Views are the usual source for bulk selection [INFERENCE].

**Effort reducers**
- *Recruiter:* one-click recurring slices; public views shared across a team (Bullhorn S58).
- *Hiring manager:* a pre-built shared view could stand in for configuring filters [INFERENCE].

**Friction.** [SOURCE CLAIM · vendor · search excerpt] Greenhouse's documented bookmark workaround (S10) is a vendor-acknowledged gap, possibly superseded.

**Repeated pattern** [INFERENCE]. A view is a named combination of filter, sort and columns. It is private or shared, URL-addressable, and saved with a "Save as" branch.

**OpenCATS today and gap** [FACT]
- Up to 5 recent/saved searches ("+" to promote) (`UX_UI_AUDIT.md` §1.5).
- Saved lists are **static only**. Dynamic lists exist in the schema but are never created (`FEATURE_INVENTORY.md` §4 item 5; FEAT-017).
- Grid state is carried as JSON in the URL or session (`UX_UI_AUDIT.md` §4).
- **Gap: MEDIUM.**

**Recommendation** [RECOMMENDATION]
- Make saved views first-class across all lists and the board: private or shared, owner, "Save as".
- Implement "dynamic lists" as saved views rather than a separate concept.
- Keep static lists for hand-picked shortlists.

---

### 8. Bulk actions

**Why it exists.** High-volume steps such as rejecting 80 applicants, advancing a batch or messaging a cohort must not be repeated one by one. [INFERENCE]

**How it works**
- **Lever** [SOURCE CLAIM · vendor · search excerpt] ([S21](https://help.lever.co/hc/en-us/articles/20087316973981-Using-the-bulk-action-toolbar), accessed 2026-09-25)
  - The toolbar appears once at least one opportunity is checked. It runs along the top of the list, below the stage tiles.
  - Actions: **Stage** (move) and **Email**.
  - **Nurture** campaign appears only when leads are selected. [INFERENCE] Available actions depend on the section of the pipeline.
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]: bulk move to another stage, documented in **9 steps** ([S7](https://support.greenhouse.io/hc/en-us/articles/360028064592-Move-candidates-to-another-stage-in-bulk), accessed 2026-09-25):
  1. Candidates.
  2. Bulk Actions.
  3. Expand the Jobs filter, then Filter by Job.
  4. Select one job.
  5. Save.
  6. Tick candidates.
  7. Edit Selected.
  8. Move to Another Stage.
  9. Choose the stage in the dialog.

  Constraint: "All candidates included in this bulk action must be on the same job." Also documented (titles only): add candidates to another job in bulk ([S18](https://support.greenhouse.io/hc/en-us/articles/360028035692-Add-candidates-to-another-job-in-bulk)) and an admin bulk action adding a Hiring Manager Review stage to interview plans ([S19](https://support.greenhouse.io/hc/en-us/articles/360018647671-Add-hiring-manager-review-stage-to-interview-plans-in-bulk), accessed 2026-09-25).
- **Recruitee** [SOURCE CLAIM · vendor · search excerpt] ([S41](https://support.recruitee.com/en/articles/1066290-performing-bulk-actions), accessed 2026-09-25)
  - Select individual checkboxes **or entire stages**. A bar appears above the list.
  - Actions: **disqualify, requalify, email, tag, share, assign to jobs/talent pools, move**.
  - Disqualify applies **a disqualification reason and a templated rejection e-mail in one bulk action**.
- **Pinpoint** [SOURCE CLAIM · vendor · search excerpt]: checkboxes on board cards (S56).
- **Ashby** [SOURCE CLAIM · vendor · search excerpt]: a dedicated **bulk application review** tool for the application-review stage (S30, S31).
- **Decisions** [INFERENCE]: which set, which action, whether candidates are notified, and which reason is recorded.

**Bulk actions available (union across products):** move stage · reject/disqualify with reason and template · requalify · e-mail · tag · share · add to job · add to pool or nurture · bulk application review.

**Effort reducers**
- *Recruiter:* combined reject + reason + e-mail (Recruitee); whole-stage selection; a contextual toolbar.
- *Hiring manager:* a bulk review tool (Ashby).

**Friction.** [SOURCE CLAIM · vendor · search excerpt, vendor-documented limitation]
- Greenhouse bulk stage moves require all selections to be on the same job, and the flow has 9 steps (S7).
- Lever shows nurture only for leads (S21).

**Repeated pattern** [INFERENCE]
1. Select, including whole-stage or all-matching.
2. A contextual bar appears.
3. Choose an action.
4. Confirm, with a summary of side effects (who will be e-mailed).
5. Get the result.

Progress and undo behaviour of the vendors is [UNKNOWN].

**General guidance** [GENERAL GUIDANCE]
- Carbon: the batch-action bar appears at the top of the table once an item is selected. "When batch mode is active, single action icons and overflow menus on the row should be disabled". Exit via cancel or deselect ([S86](https://carbondesignsystem.com/components/data-table/usage/), accessed 2026-09-25).
- Polaris supports selection across pages (S97).

**OpenCATS today and gap** [FACT]
- The action area offers Add To List, Add To Job Order, Send E-Mail (SA only) and Export.
- The encoding mismatch between `serialize` and `json_decode` **drops the selection**. Actions may run on the default first page or on every row in the view (UX-002; FEAT-020).
- Bulk e-mail is SA-only, synchronous and has no unsubscribe (FEAT-013).
- There is no bulk status change (UX-021).
- Export has no access check (FEATURE_INVENTORY §2.12).
- **Gap: HIGH.** Correctness comes before capability.

**Recommendation** [RECOMMENDATION]
- A server-side selection model: explicit IDs or "all matching this query", with the count shown.
- A pre-flight summary of side effects: e-mails, openings, automations.
- Asynchronous execution with progress and a result report.
- Per-item permission checks.
- Audit entries.
- Undo where reversible.
- Add bulk status/stage change and reject-with-reason plus template.

---

### 9. Interview scheduling (self-scheduling, panels, availability, rescheduling)

**Why it exists.** Scheduling is the most coordination-heavy step. Matching the availability of the candidate, several interviewers and rooms by e-mail adds days to time-to-hire. [INFERENCE]

**How it works: three modes recur**

1. **Candidate self-scheduling (single event, often 1:1 or early stage).**
   - **Greenhouse** [SOURCE CLAIM · vendor · search excerpt] ([S12](https://support.greenhouse.io/hc/en-us/articles/4409534663579-Candidate-self-scheduling-overview), [S13](https://support.greenhouse.io/hc/en-us/articles/4409534692507-Complete-a-self-schedule-request), [S14](https://support.greenhouse.io/hc/en-us/articles/4409526364443-Candidate-self-scheduling-setup), accessed 2026-09-25)
     - Candidates "schedule or re-schedule their own interview based on the interviewer's calendar availability".
     - A self-schedule request lets the candidate pick **a single date and time**. An *availability request* instead collects multiple times for a coordinator.
     - Candidate steps (**4–5**): open the e-mail → click the link → pick a date → pick a time → Submit. If DE&I features are enabled there is a "Next" step to an additional-details page.
     - Only a Site Admin, or a Job Admin with e-mail permission, can send requests. Interviewers must connect their calendar.
   - **Workable** [SOURCE CLAIM · vendor · search excerpt] ([S37](https://help.workable.com/hc/en-us/articles/360007483594-Self-scheduled-events), accessed 2026-09-25)
     - Requires a Google or Microsoft 365 calendar integration.
     - The candidate sees available slots in **their own or the interviewer's time zone**, and the event is created automatically.
     - With multiple interviewers, the candidate picks one time that suits all of them. Recommended for early stages.
   - **Teamtailor** [SOURCE CLAIM · vendor · search excerpt] ([S51](https://support.teamtailor.com/en/articles/6302247-let-your-candidates-self-schedule-your-meetings), [S52](https://updates.teamtailor.com/candidate-self-scheduled-meetings-rescheduling-332518), [S53](https://support.teamtailor.com/en/articles/8355597-book-a-meeting), accessed 2026-09-25)
     - The recruiter offers several slots. Teamtailor "automatically checks the availability of all participants".
     - The recruiter picks an organiser and **how many team members are required**.
     - An option **auto-moves the candidate to another stage once a time is selected**.
     - Candidates can **reschedule** self-scheduled meetings themselves.
   - **Ashby** [SOURCE CLAIM · vendor · search excerpt]: "direct booking links… completely self-serve" ([S28](https://docs.ashbyhq.com/scheduling-and-interviews-an-introduction), [S29](https://ashbyhq.com/platform/recruiting/scheduling), accessed 2026-09-25).
   - **Oracle Recruiting** [SOURCE CLAIM · vendor · search excerpt] ([S70](https://docs.oracle.com/en/cloud/saas/talent-management/faarb/candidate-schedule-based-on-interviewers-availability.html), [S71](https://docs.oracle.com/en/cloud/saas/talent-management/21c/faimh/candidate-interviews.html), accessed 2026-09-25)
     - Two schedule types: "hiring team managed" and "**candidate managed**" (the candidate picks from slots).
     - A setting, "Candidates schedule based on interviewers' availability", uses **Microsoft 365** calendars to find times when all interviewers are free.
     - **Interview schedule templates** hold a room, location, URL and dial-in.
   - **SAP SuccessFactors Recruiting** [SOURCE CLAIM · vendor · search excerpt] and [SOURCE CLAIM · independent · search excerpt] ([S66](https://help.sap.com/docs/successfactors-recruiting/setting-up-and-maintaining-sap-successfactors-recruiting/interview-scheduling-candidate-view), [S67](https://help.sap.com/docs/successfactors-recruiting/setting-up-and-maintaining-sap-successfactors-recruiting/configuring-interview-scheduling), [S68](https://blog.sap-press.com/scheduling-interviews-in-sap-successfactors-recruiting), [S69](https://sapinsider.org/articles/an-overview-of-sap-successfactors-interview-scheduling-functionality/), accessed 2026-09-25)
     - The candidate "clicks the URL provided in the email, views the slots remaining, and can choose".
     - Interviewer availability comes from the **Outlook integration** or the SuccessFactors calendar. A "My Calendar" tab for manual availability exists only without Outlook.
     - SAP Learning also lists "Implementing Individual and Group Interview Self-Scheduling" in a SmartRecruiters-for-SAP-SuccessFactors course ([S65](https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/implementing-individual-and-group-interview-self-scheduling_ee0f7a65-66e5-481a-ba28-ce2ca1799818), title only, accessed 2026-09-25).
   - **Workday** [SOURCE CLAIM · vendor · search excerpt]
     - An admin guide page, "Setup Considerations: Candidate Self-Scheduling", exists ([S72](https://doc.workday.com/admin-guide/en-us/human-capital-management/recruiting/candidates/candidate-self-scheduling/thu1588675418534.html), title only, accessed 2026-09-25).
     - A customer HR guide describes a recruiter-created "Self-Schedule Calendar" ([S75](https://hr.wisc.edu/hr-guides/for-hr-professionals/create-and-manage-recruiting-self-schedule-calendar/), title/excerpt, accessed 2026-09-25).
     - Workday also claims an AI agent that lets candidates "self-schedule interviews via SMS, WhatsApp, or chat" [SOURCE CLAIM · vendor] ([S74](https://www.workday.com/en-us/products/conversational-ai/candidate-experience.html), accessed 2026-09-25).
2. **Availability collection, then the coordinator books (panels and multi-event onsites).**
   - **Greenhouse** "Request candidate availability" ([S15](https://support.greenhouse.io/hc/en-us/articles/13301025470875-Request-candidate-availability), accessed 2026-09-25).
   - **Ashby** "candidate availability links" are used "for multi-event interviews (like an onsite)". They can require a **minimum number of days** and are **sent automatically when candidates enter a specific interview stage** (S28, S29) [SOURCE CLAIM · vendor · search excerpt].
   - **Workable** documents multi-part interview scheduling ([S39](https://help.workable.com/hc/en-us/articles/360002392334-How-do-I-schedule-a-multi-part-interview), title only, accessed 2026-09-25).
3. **Dedicated coordinator tooling (independent evidence).** [SOURCE CLAIM · independent · read first-hand] GitLab schedules Greenhouse interviews with **ModernLoop**, "integrated with Greenhouse, Google Workspace, Zoom and Slack" ([S78](https://handbook.gitlab.com/handbook/hiring/interviewing/), `interviewing/_index.md:42`; [S76](https://handbook.gitlab.com/handbook/hiring/talent-acquisition-framework/coordinator/), `coordinator.md:40-47,166-237`, accessed 2026-09-25).
   - The recruiter requests availability, which **creates a task for the coordinator**.
   - The coordinator's documented flow has **about 12 steps**:
     1. My Tasks.
     2. Action required → the candidate labelled "ready to Schedule".
     3. Schedule now (opens the candidate's availability).
     4. Next: Setup Interviews.
     5. Check the interview, interviewers and scorecard → Next: Find Schedules.
     6. Review the generated options and interviewer calendars.
     7. "use schedule".
     8. Check the Zoom room (auto-selected).
     9. Select the candidate e-mail template.
     10. Add an attachment (optional).
     11. Select the interviewer invite template.
     12. Confirm and send. "Send internal only" is also available.
   - **Interviewer pools** ("Modules") include shadow and reverse-shadow **training plans**. Modules attach to Greenhouse interview-plan stages.

**Rescheduling**
- Greenhouse self-schedule links can re-schedule (S12). Teamtailor candidates reschedule themselves (S52) [SOURCE CLAIM · vendor · search excerpt].
- At GitLab, coordinators "will not reschedule the interview until they have received direction from the recruiter". Candidate reschedules go via a Slack channel (S76, `coordinator.md:82,107`) [SOURCE CLAIM · independent · read first-hand].

**Bulk actions.** Teamtailor documents "Book meetings for multiple candidates" (title in search results; details [UNKNOWN]). Group self-scheduling appears in SAP/SmartRecruiters course titles (S65). Other bulk scheduling: [UNKNOWN].

**Effort reducers**
- *Recruiter/coordinator:* calendar free/busy lookup; self-serve links; **auto-send at stage entry** (Ashby); **auto-advance after booking** (Teamtailor); templates (Oracle); interviewer pools (ModernLoop).
- *Hiring manager/interviewer:* invites land in their calendar. With free/busy lookup they are not asked for availability each time [INFERENCE].

**Friction**
- [SOURCE CLAIM · independent · read first-hand] GitLab needs a **separate scheduling product** on top of its ATS. Candidates who do not answer availability requests get a follow-up after 24 hours. After a second unanswered e-mail, the recruiter is told and requests stop (S76, `coordinator.md:43-44`).
- [SOURCE CLAIM · vendor · search excerpt] Greenhouse self-scheduling only works for interviewers who have connected calendars, and only certain roles can send requests (S12, S14).

**Repeated pattern** [INFERENCE]. Calendar-connected availability (Google/M365) is the norm.
- **Self-schedule** handles simple interviews.
- **Availability collection plus a coordinator builder** handles panels.
- Links are sent automatically when a candidate enters a stage.
- Candidates can reschedule themselves.
- Slots are shown in the candidate's time zone.
- Schedule templates and interviewer pools support repeatable panels.

**OpenCATS today and gap** [FACT]
- "Schedule Event" lives inside the status modal. The fields are type, date (MM-DD-YY), 12-hour time, duration, title and reminder (`UX_UI_AUDIT.md` J3 step 7).
- Calendar events have a **single owner, no attendees, invites or ICS** (`FEATURE_INVENTORY.md` §2.6).
- "Private" events are sent to every user (FEAT-004).
- Reminders depend on a cron that fatals on PHP 8 (FEAT-010).
- Time zones are integer GMT offsets without DST (FEAT-016).
- Covered by GAP-006.
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]. Stage the work:
1. Real invitations: attendees, ICS, IANA time zones, reliable reminders.
2. Calendar free/busy integration and candidate self-schedule links, optionally auto-sent on stage entry, with candidate-side reschedule.
3. Availability collection, a panel builder, interviewer pools and schedule templates.

Throughout, keep the status change and the scheduling in one flow, as OpenCATS does today.

---

### 10. Scorecards / interview kits

**Why it exists.** Structured, comparable evidence per competency reduces bias and speeds up the hiring decision. The interview kit gives the interviewer everything needed in one place. [INFERENCE]

**How it works**
- **Greenhouse (official API docs)** [FACT] ([S20](https://github.com/grnhse/greenhouse-api-docs), `source/includes/harvest/_scorecards.md:120-131`, `_job_stages.md:77-85`, `_scheduled_interviews.md:55-58`, accessed 2026-09-25)
  - A scorecard holds **attributes**, each with a rating (which can be `no_decision`) and an optional note.
  - It also holds **custom questions** and answers.
  - It has an **overall recommendation**, one of `definitely_not`, `no`, `yes`, `strong_yes` or `no_decision`.
  - `submitted_by` may differ from `interviewer`, because scorecards "can be submitted on behalf of other users".
  - Job stages contain interview steps with a `schedulable` flag and an `interview_kit` (prep content and questions).
  - A scheduled interview has status `scheduled`, `awaiting_feedback` or `complete`, and each interviewer has a `response_status`.
- **Greenhouse in use** [SOURCE CLAIM · independent · read first-hand] (GitLab [S77](https://handbook.gitlab.com/handbook/hiring/conducting-a-gitlab-interview/), `conducting-a-gitlab-interview.md:38,180-186`, accessed 2026-09-25)
  - The kit shows "the candidate's resume, the description of the interview…, the scorecard…, and the suggested questions".
  - GitLab policy is that scorecards are due **within 24 hours**.
  - "Interviewers (unlike Hiring Managers) are **not** able to see another Interviewer's scorecard."
  - Shared flags go in a "Note for Other Interviewers" field **under "Key Take-Aways"**.
- **Greenhouse profile** [SOURCE CLAIM · vendor · search excerpt]: tabs separate submitted scorecards from an attribute summary ([S5](https://support.greenhouse.io/hc/en-us/articles/11957068130971-Using-the-new-candidate-profile), accessed 2026-09-25).
- **Teamtailor** [SOURCE CLAIM · vendor · search excerpt] ([S47](https://support.teamtailor.com/en/articles/2564412-job-scorecards), [S48](https://support.teamtailor.com/en/articles/7891886-job-match-score), accessed 2026-09-25)
  - A "Job scorecard" defines the skills and traits for a job. Each is rated **1–5 with comments**.
  - The interviewer fills it in from the candidate card's **Evaluation** tab and can compare with colleagues' evaluations.
  - A **"Job match score"** percentage bar is computed from the ratings.
  - A separate "Quality of Hire" evaluation is sent after a defined period.
- **Lever** [SOURCE CLAIM · vendor · search excerpt]: Interviews section → **Complete Feedback** ([S24](https://help.lever.co/hc/en-us/articles/20087358474397-Getting-started-with-Lever-as-an-Interviewer), accessed 2026-09-25).
- **Workday, SAP SF, Oracle, iCIMS, SmartRecruiters:** [UNKNOWN]. Not researched because of the search-budget limit.
  - Workday claims hiring managers "exchange interview feedback via Microsoft Teams and Slack" [SOURCE CLAIM · vendor] ([S73](https://www.workday.com/en-us/products/talent-management/talent-acquisition.html), accessed 2026-09-25; the exact page carrying this excerpt is uncertain).
- **Decisions** [INFERENCE]
  - Interviewer: a rating per competency plus an overall recommendation.
  - Hiring manager: advance or reject, based on the aggregate.

**Bulk actions.** [UNKNOWN] None documented. Scorecards are per interviewer.

**Effort reducers**
- *Interviewer:* one kit with CV, guide, questions and rubric (Greenhouse); a dashboard link to pending scorecards (GitLab S78).
- *Hiring manager:* an attribute summary or match score instead of reading every note (Greenhouse S5, Teamtailor S48).

**Friction** [INFERENCE]
- The 24-hour completion policy (S77) and "awaiting feedback" status (S20) show that chasing late feedback is an operational burden. Reminders need a first-class design.

**Repeated pattern** [INFERENCE]
- A kit (context, questions, rubric) per interview step.
- Ratings per attribute and an overall 4-point recommendation plus "no decision".
- **Independent submission**: interviewers cannot see peers' feedback until they have submitted.
- An "awaiting feedback" state that drives reminders.
- A roll-up summary for the decision-maker.

**OpenCATS today and gap** [FACT]
- There is **one 0–5 star rating per pipeline row**, with no rater and no criteria (`FEATURE_INVENTORY.md` §2.4).
- The rating is an image map that keyboards cannot operate (UX-005).
- Feedback can only be a free-text activity.
- Covered by GAP-007.
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- Per-stage interview kits and structured scorecards (attributes plus overall recommendation, "no decision" allowed).
- Hide peer feedback until the interviewer submits.
- Support submission on behalf of another user, recorded as such.
- An "awaiting feedback" state with reminders.
- A hiring-manager summary.
- Ratings as accessible radio groups (`UX_UI_AUDIT.md` UX-005 recommendation).

---

### 11. Activity timelines

**Why it exists.** It answers "what happened, and who did it?" for handovers, candidate questions and compliance. [INFERENCE]

**How it works**
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]: the activity feed is "a complete record of updates… from stage changes to notes, with **filters and search**" ([S5](https://support.greenhouse.io/hc/en-us/articles/11957068130971-Using-the-new-candidate-profile), accessed 2026-09-25).
- **Greenhouse API** [FACT]: the activity feed exposes **notes, e-mails and activities**. Each note has `visibility` set to `admin_only`, `public` or `private` ([S20](https://github.com/grnhse/greenhouse-api-docs), `harvest/_activity_feed.md:82`, accessed 2026-09-25).
- **Teamtailor** [SOURCE CLAIM · vendor · search excerpt]: an Activity tab. Submitted reviews are logged under Activity (S46).
- **Workable**: an "Activity log report" exists ([S38](https://help.workable.com/hc/en-us/articles/8808063238935-Workable-Report-center-overview) search listing; details [UNKNOWN]).
- **Decisions.** None; this is reference material. The timeline informs decisions elsewhere.

**Bulk actions.** Not applicable.

**Effort reducers**
- *Recruiter:* no manual logging when e-mail, stage and interview events are captured automatically [INFERENCE from S20 activity types].
- *Hiring manager:* a filterable feed.

**Friction.** [UNKNOWN]

**Repeated pattern** [INFERENCE]
- One chronological, filterable and searchable timeline that merges system events (stage changes, interviews, e-mails) and human notes.
- Visibility is enforced per entry.
- The audit log is a separate, immutable record (see GAP-011).

**OpenCATS today and gap** [FACT]
- Activities are manual entries (Call, Email, Meeting, …) (`FEATURE_INVENTORY.md` §2.5).
- **Any logged-in user can edit or delete activities** (FEAT-006).
- Status history and item history live in separate places (`viewItemHistory`, §2.16).
- There is no e-mail or calendar capture (GAP-013) and no tamper-evident audit (GAP-011).
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- An append-only event stream that feeds the candidate/application timeline: stage changes, messages, interviews, scorecards, notes and documents.
- Filters, search and per-entry visibility.
- Corrections recorded as new events.
- A separate immutable audit log.

---

### 12. Collaboration (@mentions, private notes, sharing with hiring managers)

**Why it exists.** Hiring is a team decision. Recruiters, hiring managers and interviewers must share context without exposing sensitive notes to everyone. [INFERENCE]

**How it works**
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]: the Notes tab lets users "leave messages for your team, with notes that can be marked as **private for specific team members** or added to a candidate's interview kit" (S5).
  - [FACT] API note visibility is `admin_only`, `public` or `private` (S20).
  - [SOURCE CLAIM · independent · read first-hand] GitLab records sensitive relationship information in Greenhouse "Private Notes" (S76, `coordinator.md:492`).
  - Visibility is also role-dependent: hiring managers can see all scorecards but interviewers cannot see each other's (S77, line 186).
- **Teamtailor** [SOURCE CLAIM · vendor · search excerpt]: comments, **to-dos**, interviews and messages on the candidate card. Hiring managers are **invited per job** (S45, S46).
- **Recruitee** [SOURCE CLAIM · vendor · search excerpt]: "share" is a bulk action (S41). What sharing grants: [UNKNOWN].
- **Workday** [SOURCE CLAIM · vendor]: feedback exchanged in Teams and Slack (S73).
- **@mentions:** [UNKNOWN] for all vendors. This could not be verified within the search budget.
- **Decisions** [INFERENCE]: who sees what, and whom to involve.

**Bulk actions.** Share (Recruitee S41).

**Effort reducers**
- *Recruiter:* a hiring team per job defines the audience automatically [INFERENCE].
- *Hiring manager:* sees only their jobs; comments and to-dos stay attached to the candidate.

**Friction.** [UNKNOWN]

**Repeated pattern** [INFERENCE]. A **hiring team per job** with roles, **visibility set per note**, lightweight to-dos, and discussion kept on the candidate record rather than in e-mail.

**OpenCATS today and gap** [FACT]
- No hiring-team roles or hiring-manager experience (GAP-010).
- No private notes, mentions or to-dos in the inventory (`FEATURE_INVENTORY.md` §2; inference from their absence).
- Owner-change e-mails exist (§2.2).
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- Hiring teams with roles per job.
- Notes with visibility (team / private to named users / admin-only).
- @mentions that create in-app notifications and respect visibility.
- To-dos with due dates.
- Scoped, expiring share links for external hiring managers, with every view logged.

---

### 13. Notifications (in-app, e-mail, Slack/Teams digests, mobile push)

**Why it exists.** It moves work to the right person at the right time: feedback due, a candidate booked, an approval waiting. [INFERENCE]

**How it works** (the evidence is thin)
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]: tasks are assigned automatically by role and surface on the dashboard (S1). E-mail and in-app notification settings: [UNKNOWN].
- **SmartRecruiters "Hiring" app** (iOS/Android) [SOURCE CLAIM · vendor · search excerpt]: recruiters and hiring managers "communicate with their candidates and hiring teams on the go". An update added **adding and assigning tasks** from the app ([S63](https://apps.apple.com/us/app/hiring/id797577300), [S64](https://play.google.com/store/apps/details?id=com.smartrecruiters.backoffice&hl=en_US), accessed 2026-09-25). Push behaviour: [UNKNOWN].
- **Workable** mobile dashboard (S33) [SOURCE CLAIM · vendor · search excerpt].
- **Workday** [SOURCE CLAIM · vendor]: interview feedback via Microsoft Teams and Slack (S73).
- **ModernLoop at GitLab** [SOURCE CLAIM · independent · read first-hand]: integrated with Slack. Coordination with executive assistants happens in Slack channels (S76, S78).
- **Digests:** [UNKNOWN] for all vendors.

**Bulk actions.** [UNKNOWN]

**Effort reducers** [INFERENCE]: role-based auto-assignment, and actions taken from inside the notification (chat or app).

**Friction** [UNKNOWN]. [GENERAL GUIDANCE] Carbon warns that "notifications that are too frequent or disruptive create negative experiences". Notifications should be **relevant, timely and informative**, and task-generated notifications should appear where the user is working ([S83](https://carbondesignsystem.com/patterns/notification-pattern/), accessed 2026-09-25).

**Repeated pattern** [INFERENCE, low confidence]. Events route to people by role. Channels include e-mail, mobile apps and chat tools. A single in-app task list is the "source of truth".

**OpenCATS today and gap** [FACT]
- E-mail only: ownership-assigned e-mails; new careers application e-mails to owner and recruiter (`FEATURE_INVENTORY.md` §2.2, §2.14).
- The status-change **candidate** e-mail checkbox is **pre-checked** (UX-021), and its defaults differ by entry point (FEAT-018).
- Reminders need a cron that fatals on PHP 8 (FEAT-010).
- No in-app notification centre (inference from the inventory).
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- An event-driven notification service with per-user, per-event channel preferences (in-app inbox, e-mail, digest), plus chat/webhook adapters.
- In-app notifications announced accessibly (WCAG 4.1.3, [S102](https://www.w3.org/TR/WCAG22/#status-messages), accessed 2026-09-25).
- Candidate-facing messages never pre-selected by default; always preview the recipient and content.

---

### 14. Analytics / reporting UX

**Why it exists.** Managing pipeline health (bottlenecks, source quality, interviewer load) and meeting compliance duties. [INFERENCE]

**How it works** [SOURCE CLAIM · vendor · search excerpt]. Details are mostly [UNKNOWN].
- **Greenhouse:** "Report dashboards" ([S16](https://support.greenhouse.io/hc/en-us/articles/4408761575963-Report-dashboards-overview), accessed 2026-09-25). Named reports seen in search listings include "Interviewer engagement report", "New candidates by source" and "Applications over time".
- **Lever:** Visual Insights dashboards for **hiring managers** (posting progress) and **interviews** ([S25](https://help.lever.co/hc/en-us/articles/6618029187981-Visual-Insights-Hiring-Manager-dashboard), [S26](https://help.lever.co/hc/en-us/articles/20087333592093-Visual-Insights-Interviews-dashboard), accessed 2026-09-25).
- **Workable:** a "Report center" and an "Activity log" report ([S38](https://help.workable.com/hc/en-us/articles/8808063238935-Workable-Report-center-overview), accessed 2026-09-25).
- **Teamtailor:** a Jobs report and "Quality of hire" evaluations (S45 listing).

**Bulk actions.** Not applicable. Export: [UNKNOWN].

**Effort reducers** [INFERENCE]: pre-built, role-specific dashboards (a hiring-manager view, an interviews view) that need no report building.

**Friction.** [UNKNOWN]

**Repeated pattern** [INFERENCE]
- Pre-built dashboards per role and process area (pipeline, interviews/interviewer engagement, sources).
- Drill-down to the underlying candidates.
- Metrics derived from event history.

**OpenCATS today and gap** [FACT]
- Reports are fixed to **9 periods**, with no recruiter, client or job filters and no CSV export (`UX_UI_AUDIT.md` J5, UX-021).
- The overview page runs 54 COUNT queries.
- EEO charts are images without alternative text (§6).
- Counts come from mutable history rows and a status typo (FEAT-008).
- Covered by GAP-014.
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- An immutable event model as the basis for funnel, time-in-stage, source and interviewer-load metrics.
- Role dashboards with filters (date range, job, recruiter, department), drill-down and export.
- Every chart paired with an accessible table. The audit notes the EEO report already lists its numbers as text, which is worth keeping.

---

### 15. Settings / admin UX

**Why it exists.** Admins configure workflows, templates, integrations and compliance without code, safely and at scale. [INFERENCE]

**How it works**
- **Workable** [SOURCE CLAIM · vendor · search excerpt]: articles "Customizing the recruiting pipeline" and "Choosing and updating a pipeline for a job" imply reusable pipelines assigned per job ([S40](https://help.workable.com/hc/en-us/articles/115011967408-Customizing-the-recruiting-pipeline), titles, accessed 2026-09-25). Also "Setting up automated actions" (title).
- **Pinpoint** [SOURCE CLAIM · vendor · search excerpt]: "How do I create a Hiring Workflow?" ([S57](https://help.pinpoint.support/en/articles/2610690-how-do-i-create-a-hiring-workflow), title, accessed 2026-09-25).
- **Ashby** [SOURCE CLAIM · vendor · search excerpt]: "Interview Plans" (docs title).
- **Greenhouse** [SOURCE CLAIM · vendor · search excerpt]: **bulk admin changes**, e.g. adding a Hiring Manager Review stage to many interview plans at once (S19, title).
- **Teamtailor** [FACT]: recruiters attach **triggers** to stages and build **ordered moving rules** in the UI (S54).
- **ModernLoop** [SOURCE CLAIM · independent · read first-hand]: organisation settings are admin-only; interviewer "Modules" are created in about 4 steps (S76, `coordinator.md:213-224`).

**Bulk actions.** Bulk configuration changes across interview plans (Greenhouse S19).

**Effort reducers** [INFERENCE]
- *Admin:* reusable templates (pipelines, interview plans, schedule templates such as Oracle's, S71) and bulk configuration changes.
- *Recruiter:* choosing a template per job instead of building from scratch.

**Friction.** [UNKNOWN] Independent.

**Repeated pattern** [INFERENCE]
- Template-driven configuration: pipeline/workflow templates, interview plans and message templates.
- Templates are applied per job and can be changed in bulk.
- Automation rules are attached to stages.

**General guidance** [GENERAL GUIDANCE]
- Polaris' "App settings layout" is meant to let users "scan and find groups of settings" ([S100](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/patterns/app-settings-layout/index.mdx), accessed 2026-09-25).
- GOV.UK's "Complete multiple tasks" pattern helps users see "the tasks involved…, the order…, and when they've completed tasks" ([S95](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/), accessed 2026-09-25). It is a useful model for onboarding checklists.

**OpenCATS today and gap** [FACT]
- The Administration hub has 51 actions (`FEATURE_INVENTORY.md` §2.16).
- **Pipeline statuses cannot be administered** (FEAT-001).
- Job statuses, job types and the ACL map are changed by uncommenting PHP in `config.php` (§2.3, §4 item 24).
- Career templates are raw HTML textareas (`UX_UI_AUDIT.md` §9).
- The first-run wizard is worth keeping (§12.1), although "Setup Users" is broken (FEAT-019).
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- Everything configurable from the UI: stages, disposition reasons, scorecards, e-mail templates, approval chains, career-site branding.
- Configuration built from **templates with safe defaults**, with previews and a change history.
- A setup checklist for first run.

---

### 16. Permissions UX

**Why it exists.** Candidate data is sensitive. Hiring managers and interviewers need narrow, job-scoped access, and admins need to understand who can see what. [INFERENCE]

**How it works**
- **Greenhouse (official API docs)** [FACT] ([S20](https://github.com/grnhse/greenhouse-api-docs), `harvest/_user_roles.md:17-21`, `_user_permissions.md:1-202`, accessed 2026-09-25)
  - User roles are typed **`interviewer` or `job_admin`**.
  - **Job permissions** grant a role on a specific job.
  - **Future job permissions** auto-grant a role on future jobs **by office and department**.
- **Greenhouse help center** [SOURCE CLAIM · vendor · search excerpt]
  - Each article carries a "Permissions:" line, e.g. "Permissions: Job Admin or above".
  - Some actions are gated to "Site Admin, and Job Admin who can email candidates" (S12 listing).
- **Greenhouse in use** [SOURCE CLAIM · independent · read first-hand]: interviewers cannot see peers' scorecards, but hiring managers can (S77).
- **Teamtailor** [SOURCE CLAIM · vendor · search excerpt]: hiring managers see only invited jobs (S45). The Candidates tab appears only for Group members (S55, unverified attribution).
- **Pinpoint:** a help article titled "Understanding Roles" exists ([S114](https://help.pinpoint.support/en/articles/6113124-understanding-roles), title only, accessed 2026-09-25; details [UNKNOWN]).

**Bulk actions.** Granting permissions on future jobs by office or department (Greenhouse) acts as a bulk grant [INFERENCE].

**Effort reducers** [INFERENCE]
- *Admin:* rule-based grants for future jobs.
- *Hiring manager:* sees only what applies to them, with less noise.

**Friction.** [UNKNOWN]

**Repeated pattern** [INFERENCE]
- **Role × scope** (job / office / department) rather than one global level.
- Visibility rules for sensitive artefacts (scorecards, private notes, EEO).
- Required permission levels are documented and exposed.

**OpenCATS today and gap** [FACT]
- One global level per user: READ 100, EDIT 200, DELETE 300, SA 400, and so on (`FEATURE_INVENTORY.md` §1).
- Several entry points have **no check at all**: export-all, activity edit/delete, lists, reports, import revert, tag admin (FEAT-006).
- Tab gating is cosmetic (§2.23).
- EEO visibility is a per-user flag (§2.2).
- Covered by GAP-003.
- **Gap: CRITICAL.**

**Recommendation** [RECOMMENDATION]
- Scoped roles (job/department/office/client) enforced on the server.
- Field-level protection for EEO, compensation and private notes.
- Explain denials in the UI ("You need Job Admin on this job"). Do not rely on validation-style errors for permission problems (GOV.UK guidance, §19).
- Admin views of "who can see this candidate", and an audit of permission changes.

---

### 17. Empty states

**Why it exists.** First use, "no results" and "nothing to do" moments should teach the user and move them forward, not look broken. [GENERAL GUIDANCE]

**Vendor behaviour:** [UNKNOWN] for all 14 products. Help centers do not document empty states, and screenshots could not be viewed.

**General guidance** [GENERAL GUIDANCE]
- **IBM Carbon** ([S81](https://carbondesignsystem.com/patterns/empty-states-pattern/), accessed 2026-09-25) defines three types:
  - **no data** (first use);
  - **user action** (no search results, or confirmation that a process is complete);
  - **error management** (a permissions issue, a systems issue, or configuration required).

  Its anatomy:
  - an optional image;
  - a **positive title** ("Start by adding data assets");
  - a body that explains the next action and why the space is empty;
  - an optional primary action and a secondary link.

  Carbon also warns that "more content doesn't necessarily mean it's a better solution".
- **Carbon search** ([S85](https://carbondesignsystem.com/patterns/search-pattern/), accessed 2026-09-25): on "No results", "suggest a follow-up action".
- **Shopify Polaris** ([S98](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/layout-and-structure/empty-state.mdx), [S97](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/index-table.mdx), accessed 2026-09-25):
  - Empty states are "an opportunity to provide explanation or guidance".
  - The index table's empty state allows "a smooth transition from a list in a loading state to a list where zero, one, or many resources exist".

**ATS-specific cases** [INFERENCE]
- A new job with no applicants: show links to publish or share it.
- A hiring manager with nothing to review: confirm this explicitly ("You're all caught up").
- An interviewer with no pending feedback.
- A filtered list with zero matches: offer "Clear filters".
- A permission-restricted list: explain why it is empty and whom to ask.

**Bulk actions.** Not applicable.

**Effort reducers** [INFERENCE]
- *Recruiter:* the next action is one click away.
- *Hiring manager:* an explicit "nothing to do" avoids anxiety about missed work.

**Friction.** [UNKNOWN]

**Repeated pattern.** Only general guidance is available (see above).

**OpenCATS today and gap** [FACT]
- Empty-state messages and CTAs are **text baked into JPG images** (`images/nodata/*`, used in `Candidates.tpl`, `JobOrders.tpl`, `Companies.tpl`, `ActivityDataGrid.tpl`, `Home.tpl`) (`UX_UI_AUDIT.md` §8).
- Their clickable areas contain only `&nbsp;`, so screen readers and translation cannot reach them (§6, UX-005).
- **Gap: MEDIUM.**

**Recommendation** [RECOMMENDATION]
- A shared empty-state partial in real text, with three variants (first use, no results, blocked by permission or configuration).
- Each variant names one next action.
- Localisable and accessible.

---

### 18. Loading states

**Why it exists.** Perceived speed and confidence that the system has not frozen, especially for large lists, dashboards and bulk jobs. [GENERAL GUIDANCE]

**Vendor behaviour:** [UNKNOWN] for all products except one first-hand observation.
- [FACT] In Bullhorn's open-source career portal, the **Apply button is disabled until the form is valid** and shows a loading state while submitting (`[disabled]="!form.valid"`, `[loading]="applying"`) ([S60](https://github.com/bullhorn/career-portal), `src/app/apply-modal/apply-modal.component.html`, accessed 2026-09-25).

**General guidance** [GENERAL GUIDANCE]
- **Carbon** ([S82](https://carbondesignsystem.com/patterns/loading-pattern/), accessed 2026-09-25):
  - **Skeleton states** are for container and data components (tables, tiles, cards) and "should only appear for only a few seconds". Never use them for toasts, menus or modals.
  - **Loading indicators** do not show progress. "If a process will take more than a moment or two to complete, use a progress indicator instead."
  - **Inline loading** is for a single component.
  - **Progressive loading** suits slow dashboards and filter changes.
  - "A screen reader should notify a user if an application is loading, busy, gets stuck, or if a process fails."
  - Carbon cites Nielsen Norman Group's "Progress Indicators Make a Slow System Less Insufferable". That article itself was not fetched.
- **Polaris (legacy loading guidance)** ([S99](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/patterns-legacy/loading.mdx), accessed 2026-09-25):
  - Cache commonly needed data; prefetch on intent; prioritise viewport content.
  - "Switch to the next view quickly", even if that sometimes means reverting on error.
  - Use accurate loading layouts.
- **W3C WCAG 2.2 SC 4.1.3 Status Messages** ([S102](https://www.w3.org/TR/WCAG22/#status-messages), accessed 2026-09-25): status messages must be programmatically determinable "such that they can be presented to the user by assistive technologies without receiving focus".

**Bulk actions.** [INFERENCE] Bulk operations and imports need progress, not a spinner.

**Effort reducers** [INFERENCE]: optimistic stage moves let recruiters keep working, and background jobs free the screen.

**Friction.** [UNKNOWN]

**Repeated pattern.** Only general guidance is available.

**OpenCATS today and gap** [FACT]
- A **full-page reload** follows every list interaction. Only the two dashboard grids use AJAX (`UX_UI_AUDIT.md` §10).
- Closing a modal reloads the parent (17 call sites).
- Resume upload and parse are full POST round trips, described in the code as "giving the illusion of AJAX".
- Every footer shows "Server Response Time".
- Covered by UX-014.
- **Gap: MEDIUM.**

**Recommendation** [RECOMMENDATION]
- Set a perceived-performance budget.
- Skeletons for lists and profiles on first load; inline indicators for single actions; optimistic updates with rollback for stage moves.
- Progress plus a result summary for bulk, import and export jobs.
- Announce busy and completed states with `aria-live`/status roles.
- Remove the server-timing footer outside debug mode (UX-022).

---

### 19. Error states

**Why it exists.** Users should never lose work, and should know whether *they* can fix a problem (validation) or *the system* must (outage, permission, conflict). [GENERAL GUIDANCE]

**Vendor behaviour:** [UNKNOWN] in help centers, except two first-hand observations.
- [FACT] Bullhorn's career portal shows a single translated "error while applying" message inside the apply modal and keeps the form open (S60, `apply-modal.component.html`).
- [FACT] Lever's postings API warns that custom apply forms must handle HTTP **429** (rate limit: more than 2 POSTs per second). Lever recommends its hosted form because it "maintains very high availability including queuing and retries at peak times" ([S27](https://github.com/lever/postings-api), `README.md:193,244-246`, accessed 2026-09-25).

**General guidance** [GENERAL GUIDANCE]
- **GOV.UK "Recover from validation errors"** ([S89](https://design-system.service.gov.uk/patterns/validation/), accessed 2026-09-25):
  - Show the page again "with the form fields as the user filled them in".
  - Prefix the page `<title>` with "Error: ".
  - Show an **error summary** at the top and **move focus to it**.
  - Show messages next to the fields.
  - "Do not validate when the user moves away from a field"; validate on submit.
  - **Do not use validation to tell people they lack permission or eligibility**. Take them to a page that explains the problem instead.
- **GOV.UK error summary and error message** ([S87](https://design-system.service.gov.uk/components/error-summary/), [S88](https://design-system.service.gov.uk/components/error-message/), accessed 2026-09-25):
  - Heading "There is a problem", with links to each field.
  - Messages worded identically in the summary and at the field.
  - "Do not clear any form fields."
- **GOV.UK "There is a problem with the service" (500) pages** ([S90](https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/), accessed 2026-09-25):
  - Use one page for all unexpected problems.
  - Say what happened to the user's answers.
  - No jargon such as "500".
  - "Store previously entered information… so users can resume a journey".
- **Carbon** "error management" empty states cover permissions, system and configuration errors (S81).
- **W3C APG modal dialog** ([S110](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), accessed 2026-09-25): for irreversible actions "it may be advisable to set focus on the least destructive action".

**Bulk actions.** [INFERENCE] Partial failures in bulk operations need a per-item result list.

**Effort reducers** [INFERENCE]: preserved input and inline errors avoid re-typing, which matters most for candidates on mobile.

**Friction.** [UNKNOWN]

**Repeated pattern.** Only general guidance is available.

**OpenCATS today and gap** [FACT]
- Server validation failures render "A fatal error has occurred." and **the input is lost** (UX-013).
- 132 `alert()` validations.
- Deletes are **GET links guarded by `confirm()`**. E-mail template delete has no confirmation at all (UX-013).
- The careers portal returns blank `die()` pages and 1.5-second JS redirects (UX-012).
- There are 18 near-duplicate error templates (UX-019).
- The login error is rendered below the fold (UX-022).
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- One error system:
  - field-level validation on submit, with an error summary and preserved input;
  - separate pages for permission, not-found and system errors, each with a reference ID;
  - destructive actions as POST with a least-destructive default focus;
  - soft delete and undo where feasible.
- Careers forms keep candidate input on any failure and retry or queue submissions.

---

### 20. Candidate-facing application flow & career sites

**Why it exists.** Applicant conversion and legal compliance (consent, EEO, accessibility) both depend on it, and most candidates apply on phones [INFERENCE; the share of mobile applicants was not verified].

**How it works**
- **Lever** [FACT] ([S27](https://github.com/lever/postings-api), `README.md:25,44-45,174-175,201-246`, accessed 2026-09-25)
  - Every account has a **hosted job site** and hosted application form, with a global instance and an **EU instance**.
  - The system requires only **name and e-mail**. Admins can make other fields required.
  - Candidate records **merge when e-mails match**. The candidate is e-mailed after applying unless `silent`.
  - Consent is captured as **`consent.marketing`** and **`consent.store`**, optionally tied to a `compliancePolicyId`.
  - Custom success and error URLs are supported.
  - Lever calls directing candidates to its hosted form "best practice", with List.js-based search and filter examples for custom sites.
- **Greenhouse job board API** [FACT] ([S20](https://github.com/grnhse/greenhouse-api-docs), `source/includes/job-board/_jobs.md:128-333`, accessed 2026-09-25). Job posts carry:
  - custom `questions` with `required` flags;
  - `location_questions` (optional or required);
  - `compliance` EEOC questions "used by government contractors";
  - optional `demographic_questions`, where "free_form" answers are allowed and a question is required only if configured;
  - `data_compliance` (GDPR) with `requires_processing_consent`, `requires_retention_consent` and a `retention_period` in days.
  - The "Resume" field accepts **either a file or pasted text**.
- **Bullhorn career portal** (official, open source) [FACT] ([S60](https://github.com/bullhorn/career-portal), `src/app/apply-modal/*`, `src/app/sidebar/*`, `src/static/i18n/`, accessed 2026-09-25)
  - A job list with a **keyword search and sidebar filters**.
  - Apply happens **in one modal**. Core fields: first name, last name, e-mail (required), phone (optional), resume (required, with accepted file types stated).
  - An **EEOC fieldset** that can be switched on per category.
  - A **privacy-consent checkbox** linking to the policy, required when configured.
  - Apply stays disabled until the form is valid.
  - Ships **11 translation files**.
  - Flow length: **job → Apply → one form → submit**, so about 3 steps. [INFERENCE from code]
- **Workday** [SOURCE CLAIM · vendor]: candidates "can search for jobs, chat, apply, and more directly from their phones" via a conversational agent ([S74](https://www.workday.com/en-us/products/conversational-ai/candidate-experience.html), accessed 2026-09-25).
- **Candidate status after applying** [SOURCE CLAIM · independent · read first-hand]: GitLab's candidate FAQ says "send an email to your Recruiter to get a status update" ([S79](https://handbook.gitlab.com/handbook/hiring/candidate-faq/), `candidate-faq/_index.md:111`, accessed 2026-09-25). [INFERENCE] That configuration offers no self-service status.
- **Decisions.** The candidate decides whether to apply and what to disclose. The recruiter or admin decides which fields and questions to require.

**Bulk actions.** Not applicable to candidates.

**Effort reducers**
- *Candidate:* a minimal required set (Lever: name and e-mail); resume as file or text (Greenhouse); a one-modal apply (Bullhorn); self-scheduling after applying (§9).
- *Recruiter:* e-mail dedupe on apply (Lever); configurable questions.

**Friction**
- [FACT] Lever rate-limits custom forms to 2 POSTs per second and warns that applicants can be lost unless submissions are queued (S27).
- [INFERENCE] Parsing a resume and then asking candidates to retype the same details remains a common complaint pattern, but no independent review was verifiable here.
- [GENERAL GUIDANCE] WCAG 2.2 SC 3.3.7 Redundant Entry explicitly "does not apply if data is provided… such as uploading a resume in a document format" ([S103](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html), accessed 2026-09-25). Conformance therefore does not remove this friction; design must.

**General guidance** [GENERAL GUIDANCE]
- **GOV.UK question pages** ([S91](https://design-system.service.gov.uk/patterns/question-pages/), accessed 2026-09-25):
  - "Only ask for information you really need".
  - Mark optional fields "(optional)" and "**never mark mandatory fields with asterisks**".
  - Always provide a back link.
  - Never ask for the same information twice.
- **GOV.UK check answers** ([S92](https://design-system.service.gov.uk/patterns/check-answers/), accessed 2026-09-25).
- **GOV.UK equality information** ([S93](https://design-system.service.gov.uk/patterns/equality-information/), accessed 2026-09-25):
  - Explain why equality questions are asked and that they are **optional**.
  - For one-off services, ask them **after "Check your answers"**.
  - Let people update their answers later.
- **GOV.UK names** ([S94](https://design-system.service.gov.uk/patterns/names/), accessed 2026-09-25): support all characters; consider "Given names / Family name" for international users.
- **WCAG** reflow and target size ([S104](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [S105](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), accessed 2026-09-25).

**Repeated pattern** [INFERENCE]
- A hosted, brandable careers site with search and filters.
- A short apply form: identity, contact and resume (file or text) required; everything else configurable.
- Explicit, separately recorded **consent** (processing/retention, marketing).
- **Optional** EEO/demographic questions, separated from the application.
- Dedupe by e-mail, and a confirmation e-mail.
- Resilient submission (queue/retry).
- Localisation.

**OpenCATS today and gap** [FACT]
- Apply takes **5–8 page loads** (`UX_UI_AUDIT.md` J4).
- No job search: the branches are empty (FEAT-011).
- A fixed 940 px layout with no viewport (UX-001).
- Image submit buttons and `alert()` validation.
- Asterisked fields that are not enforced (UX-012).
- The questionnaire **pre-selects the first answer** (UX-011).
- **Wrong EEO options** (UX-004).
- **No consent capture** (`FEATURE_INVENTORY.md` §2.14).
- The "registered candidate" login uses e-mail + last name + ZIP, stored in a cookie (UX-007, FEAT-005).
- Covered by GAP-012.
- **Gap: CRITICAL** for conversion and compliance.

**Recommendation** [RECOMMENDATION]
- A mobile-first, WCAG 2.2 AA careers site with search and filters.
- A one-page apply with a minimal required set; resume as file or text.
- Explicit consent records.
- Optional EEO/demographics collected after the core submission, jurisdiction-configurable.
- No pre-selected answers.
- Server-side validation that keeps input.
- Queued, retryable submissions.
- Magic-link candidate access to status and self-scheduling.
- A localised UI.

---

### 21. Mobile & hiring-manager approvals

**Why it exists.** Hiring managers and approvers are occasional users who are often away from a desk. Slow approvals for requisitions and offers delay hires. [INFERENCE]

**How it works**
- **Greenhouse approvals (official API docs)** [FACT] ([S20](https://github.com/grnhse/greenhouse-api-docs), `harvest/_approvals.md:11-64`, accessed 2026-09-25)
  - Approval flows exist for three purposes: `open_job` (start recruiting), `offer_job` (make offers on a job) and `offer_candidate` (a candidate's offer).
  - Each flow has **approver groups**, each with **`approvals_required`** (a quorum) and a **`priority`**. The flow is either **`sequential`** or not.
  - Flows are versioned.
- **Greenhouse in use** [SOURCE CLAIM · independent · read first-hand] (S76, `coordinator.md:299,429`)
  - The offer salary range is visible in an "Approvals" tab of the candidate profile.
  - "Any changes to the currency will require **complete reapproval** in Greenhouse, regardless if it is the same amount just in a different currency."
- **Mobile apps** [SOURCE CLAIM · vendor · search excerpt]
  - SmartRecruiters "Hiring" app for recruiters and hiring managers, with task assignment (S63, S64).
  - Workable mobile dashboard: events, candidates to evaluate, jobs (S33).
  - Workday: hiring managers "easily create requisitions on mobile" [SOURCE CLAIM · vendor] (S73).
  - Offer and requisition approval **from mobile or chat**: [UNKNOWN] for all vendors.
- **Teamtailor:** "Send Job offers to candidates" (help article title seen). Approval details: [UNKNOWN].
- **Decisions** [INFERENCE]
  - Approver: approve or reject a requisition or offer.
  - Hiring manager: advance or reject reviewed applicants; sign off an offer.

**Bulk actions.** [UNKNOWN] (e.g. approving several requisitions at once).

**Effort reducers**
- *Hiring manager:* a review queue on the dashboard (Greenhouse S4); mobile apps (SmartRecruiters, Workable).
- *Admin/recruiter:* reusable approval chains with quorum and parallel groups (Greenhouse S20).

**Friction** [SOURCE CLAIM · independent · read first-hand]: **re-approval triggered by a non-material change**. A currency switch at the same amount restarts the whole chain (S76).

**Repeated pattern** [INFERENCE]
- Approvals are configurable chains: groups, sequential or parallel, quorum.
- Chains attach to requisition and offer objects.
- Approvers act from a notification with the full context.
- Hiring-manager tasks are few and reachable on mobile.

**OpenCATS today and gap** [FACT]
- No requisitions or approval chains (GAP-008).
- No offer object: "Offered" is status 600 only (GAP-009; `FEATURE_INVENTORY.md` §3.1).
- No hiring-manager role (GAP-010).
- No responsive UI (UX-001).
- **Gap: HIGH.**

**Recommendation** [RECOMMENDATION]
- An approval engine for requisitions and offers: groups, sequential or parallel, quorum.
- Approvers can act from e-mail, in-app or mobile with a diff of what changed.
- **Re-approval rules that trigger only on material changes**, configurable per field (this addresses the documented Greenhouse friction).
- Responsive hiring-manager and approver views limited to their tasks.

---

### 22. Accessibility

**Why it exists.** It is a legal duty (ADA; the EU Accessibility Act has applied since June 2025, per `UX_UI_AUDIT.md` UX-005). It also covers candidates and staff with disabilities. [FACT for the audit statement]

**Vendor behaviour.** Published accessibility conformance reports (VPAT/ACR) and WCAG claims: **[UNKNOWN]** for all 14 vendors. They could not be researched within the budget.
- Teamtailor documents **keyboard shortcuts** on the candidate card (S46) [SOURCE CLAIM · vendor · search excerpt]. This is a productivity aid, not a conformance claim.
- Bullhorn's career portal ships 11 locales (S60) [FACT]. This is localisation, not accessibility.

**General guidance: WCAG 2.2 success criteria most relevant to ATS UX** [GENERAL GUIDANCE]
- **2.5.7 Dragging Movements (AA):** provide a single-pointer alternative for kanban drag-and-drop. Keyboard support alone is not enough (S101).
- **2.5.8 Target Size (Minimum):** dense tables and cards need adequately sized or spaced controls (S105).
- **2.4.11 Focus Not Obscured (Minimum):** sticky bulk bars and headers must not hide the focused row ([S108](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), accessed 2026-09-25).
- **4.1.3 Status Messages:** toasts, bulk results and "saved" confirmations must be announced (S102).
- **3.3.7 Redundant Entry:** do not re-ask for information within an application (resume upload is exempt) (S103).
- **3.3.8 Accessible Authentication (Minimum):** candidate and staff login must not require recalling or transcribing ([S107](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html), accessed 2026-09-25). This supports magic-link or passkey options.
- **2.2.1 Timing Adjustable:** timed assessments and session time-outs ([S106](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), accessed 2026-09-25).
- **3.2.6 Consistent Help** (S109).
- **APG modal dialog** (S110): focus moves into the dialog, Tab is trapped, Esc closes, and focus returns to the invoking control.

**Bulk actions.** Selection checkboxes need accessible names. OpenCATS row checkboxes have none (UX-005).

**Effort reducers** [INFERENCE]: accessible keyboard flows speed up power users too (Teamtailor shortcuts).

**Friction.** [UNKNOWN] for vendors.

**Repeated pattern.** [UNKNOWN] for vendors; general guidance above.

**OpenCATS today and gap** [FACT] (`UX_UI_AUDIT.md` §6)
- **0 ARIA attributes.**
- 108 of 327 template images without `alt`.
- Contrast down to **1.37:1**.
- Colour-only status.
- Mouse-only column tools and rating.
- Iframe modals without a dialog role, Esc handling or focus management.
- Image submit buttons on the careers site.
- No skip link.
- Findings UX-005, UX-009 and UX-010; GAP-019.
- **Gap: CRITICAL (legal).**

**Recommendation** [RECOMMENDATION]
- Make WCAG 2.2 AA a **release gate**.
- Build an accessible component library (grid, board with a "Move to…" menu, dialog, forms, toasts).
- Run automated checks (axe) in CI plus manual screen-reader passes on journeys (a)–(c) and the apply flow.
- Publish an ACR/VPAT for OpenCATS 2.0.

---

## End-to-end journey benchmarks

Step counts are given only where a source documents them. "Steps" means distinct user actions; "loads" (OpenCATS) means document loads as counted in `UX_UI_AUDIT.md` §2. Where no count is documented the cell says UNKNOWN. Counts assembled from several sources are marked INFERENCE.

### (a) Recruiter moves a candidate through stages and schedules an interview

| Product | Stage move | Scheduling initiation (recruiter/coordinator) | Candidate side | Automation that removes steps | Evidence |
|---|---|---|---|---|---|
| **OpenCATS today** | Per candidate: open candidate → edit icon on pipeline row (modal) → tick Change Status and pick status → Save → Close (parent reloads). Part of J3: **9 steps, about 8 loads, 12+ clicks per candidate**. No bulk or board move | Same modal: tick Schedule Event → type, MM-DD-YY date, 12-hour time, duration, title, reminder. Creates a **single-owner calendar entry with no attendees, invite or ICS** | None. The candidate receives only an optional status e-mail, which is pre-checked | None. Reminders depend on a cron that fatals on PHP 8 | [FACT] `UX_UI_AUDIT.md` J3; `FEATURE_INVENTORY.md` §2.6; FEAT-010; UX-021 |
| **Greenhouse** | Bulk: **9 documented steps** for N candidates on the *same job* (Candidates → Bulk Actions → Filter by Job → select job → Save → tick → Edit Selected → Move to Another Stage → choose stage). Single-candidate count UNKNOWN; the stage actions sit in the profile | Send a self-schedule request or an availability request (recruiter step count UNKNOWN). Restricted to Site Admin, or Job Admin with e-mail permission | Self-schedule in **4–5 steps**: e-mail → link → date → time → Submit (plus "Next" when DE&I features are on) | Interviewer calendars are consulted for available slots | [SOURCE CLAIM · vendor · search excerpt] S7, S12, S13, S14, S15 |
| **Greenhouse + ModernLoop (GitLab)** | Recruiter moves the candidate to Team Interview and requests availability. That creates a coordinator task | Coordinator: **about 12 documented steps** (My Tasks → Action required → Schedule now → Next: Setup Interviews → Next: Find Schedules → use schedule → e-mail template → attachment → interviewer template → Confirm and send) | Candidate submits availability. Follow-up after 24 h; after the 2nd unanswered e-mail the recruiter is informed and requests stop | Generated schedule options, auto-selected Zoom room, interviewer pools | [SOURCE CLAIM · independent · read first-hand] S76 `coordinator.md:40-47,170-184`; S78 |
| **Teamtailor** | **1 drag gesture** per candidate on the board, across jobs | Book a meeting with several candidate-selectable slots; availability of all participants checked (step count UNKNOWN) | Picks a slot and can reschedule themselves | **Auto-move to another stage once the candidate selects a time**; stage triggers and moving rules | [SOURCE CLAIM · vendor · search excerpt] S49–S53; [FACT] S54 |
| **Ashby** | Kanban drag or list (count UNKNOWN) | **0 recruiter steps after setup**: availability or direct-booking links are sent automatically on stage entry [INFERENCE from "sent automatically"] | Books directly, or submits availability (with a minimum-days rule) | Stage-entry auto-send | [SOURCE CLAIM · vendor · search excerpt] S28, S29, S30 |
| **Workable** | Move to next or any stage, forward or back (count UNKNOWN) | Send a self-scheduling link. Needs Google or M365 integration | Picks a slot in their own or the interviewer's time zone; the event is created automatically | Auto-created event | [SOURCE CLAIM · vendor · search excerpt] S34, S37 |
| **Oracle / SAP SF / Workday** | UNKNOWN | Candidate-managed schedules with slots (Oracle, with M365 availability); Outlook or SF calendar (SAP); self-schedule calendar (Workday) | Opens link → views remaining slots → chooses (SAP) | Oracle schedule templates; Workday claims AI scheduling via SMS, WhatsApp or chat | [SOURCE CLAIM · vendor · search excerpt] S66, S67, S70, S71, S72; [SOURCE CLAIM · vendor] S74 |

**Comparison** [INFERENCE]
- In OpenCATS, **effort scales linearly with candidates**, at about 8 loads each. The scheduled "interview" also reaches nobody but its owner.
- The market has converged on three things:
  1. Moves take one gesture or a bulk action.
  2. Scheduling is triggered or automated at stage entry.
  3. The candidate books, and reschedules, their own slot.
- Coordination-heavy panels are still labour-intensive even for mature customers: about 12 coordinator steps at GitLab, and a separate tool.

### (b) Interviewer submits a scorecard

| Product | Steps | What the interviewer sees | Decision recorded | Evidence |
|---|---|---|---|---|
| **OpenCATS today** | No scorecard exists. The nearest options are (1) clicking a star on the pipeline row (1 click, no rater, image map, mouse-only), or (2) the Log Activity modal (J3 steps 6–9, about 3 loads) to write free text | Candidate Show page | A 0–5 star rating per pipeline, or free text | [FACT] `FEATURE_INVENTORY.md` §2.4; UX-005; `UX_UI_AUDIT.md` J3 |
| **Greenhouse** | About 4–5 steps: dashboard scorecard link → interview kit → rate attributes + Key Take-Aways (+ "Note for Other Interviewers") → overall recommendation → submit [INFERENCE; exact count UNKNOWN] | Resume, interview description, scorecard, suggested questions. Peers' scorecards stay **hidden** from interviewers | Per-attribute rating (or no decision) + overall recommendation: definitely not / no / yes / strong yes / no decision | [FACT] S20; [SOURCE CLAIM · independent · read first-hand] S77, S78 |
| **Lever** | Interviews section → "Complete Feedback" next to the interview (**2 documented steps** to reach the form; form steps UNKNOWN) | Feedback form (content UNKNOWN) | UNKNOWN | [SOURCE CLAIM · vendor · search excerpt] S24 |
| **Teamtailor** | Open candidate card in the job → Evaluation tab → rate each skill/trait 1–5 + comments → submit (about 4 steps; submit wording UNKNOWN) | Job scorecard criteria; colleagues' evaluations for comparison (whether before or after own submission is UNKNOWN) | 1–5 per criterion. A job match score (%) is derived | [SOURCE CLAIM · vendor · search excerpt] S46, S47, S48 |

**Comparison** [INFERENCE]
- Leaders give interviewers a **pending-feedback entry point**, a **kit** in one place and a **fixed rubric plus overall recommendation**, and keep submissions independent.
- OpenCATS captures neither structure nor who rated. Feedback therefore cannot be compared or aggregated.

### (c) Hiring manager reviews candidates and approves an offer

| Product | Review candidates | Offer approval | Mobile / chat | Evidence |
|---|---|---|---|---|
| **OpenCATS today** | No hiring-manager role. A manager needs a full user account and then follows the recruiter path: Job Orders tab → job → pipeline table → candidate Show (about 3 loads before acting), and records a decision via the J3 status modal | **None.** "Offered" (600) is only a status; there is no offer object or approval chain | Not responsive | [FACT] GAP-008, GAP-009, GAP-010; `FEATURE_INVENTORY.md` §3.1; `UX_UI_AUDIT.md` J3, UX-001 |
| **Greenhouse** | An "Applications to Review" dashboard panel appears when candidates are in the Hiring Manager Review stage. Review happens in the profile (step count UNKNOWN) | Configurable `offer_candidate` flows: approver groups, `approvals_required` (quorum), `priority`, sequential or not. Approver UI steps UNKNOWN. **Changing only the currency forces complete re-approval** (GitLab) | UNKNOWN | [SOURCE CLAIM · vendor · search excerpt] S2–S4; [FACT] S20; [SOURCE CLAIM · independent · read first-hand] S76 |
| **Teamtailor** | **4 documented steps**: Jobs tab (invited jobs) → job → candidates by stage ("focus on the candidates that need their attention") → candidate card, then comments, to-dos, scorecard | "Send Job offers to candidates" exists (title). Approvals UNKNOWN | UNKNOWN | [SOURCE CLAIM · vendor · search excerpt] S45 |
| **Ashby** | Bulk application review tool for the application-review stage | UNKNOWN | UNKNOWN | [SOURCE CLAIM · vendor · search excerpt] S30, S31 |
| **Workday / SmartRecruiters / Workable** | UNKNOWN | UNKNOWN | Workday: feedback via Teams/Slack and requisitions on mobile [SOURCE CLAIM · vendor]. SmartRecruiters and Workable: native mobile apps/dashboards with tasks and candidates to evaluate | S73; S63, S64; S33 |

**Comparison** [INFERENCE]
- Leaders **push** a small, role-scoped queue to the hiring manager and model approvals as **configurable chains with quorum**.
- The documented weak spot is **over-triggered re-approval**.
- OpenCATS has neither the hiring-manager surface nor the approval model, so its journey (c) cannot be completed inside the product.

---

## Cross-cutting principles

These are [INFERENCE] from the pattern areas above, phrased as [RECOMMENDATION]s for OpenCATS 2.0. They are not market facts.

1. **The application (candidate × job) is the unit of work.** Lists, boards, profiles, scorecards and timelines are organised around it (§3–§5, §10, §11).
2. **Push work to people by role.** Home is an action queue derived from hiring-team roles; nobody should have to search for what they owe (§1, §12, §13, journeys b and c).
3. **Configure, don't code.** Stages, dispositions, kits, approval chains, templates and career branding are edited in the UI from templates, with safe defaults, previews and history (§5, §15). This directly reverses FEAT-001 and the config.php customisation.
4. **Automate at stage entry, visibly.** Send scheduling links, assessments and messages when a candidate enters a stage, and auto-advance on outcomes, always showing what will happen and allowing override (§5, §9). Never send candidate e-mail by default without an explicit choice (UX-021).
5. **Structured, independent evidence before decisions.** Kits, rubrics, an overall recommendation, blind-until-submitted feedback and a summary for the decider (§10).
6. **One list component everywhere.** URL state, per-user columns, saved views (private/shared, "Save as"), board/list parity and a contextual bulk bar (§3, §7, §8).
7. **Bulk actions must be correct, previewable and auditable.** Use a server-side selection model, a side-effect summary, asynchronous progress, per-item permission checks, a result report and undo where possible (§8). Fix UX-002 before anything else.
8. **Calendar-native scheduling.** Real invites and time zones first, then free/busy lookup, self-scheduling and candidate reschedule, then panels (§9).
9. **Candidate flows are mobile-first, short, forgiving and explicit about consent.** A minimal required set; EEO optional and separated; input preserved on error; resilient submission (§19, §20).
10. **Visibility is per role and per artefact.** Scoped roles, private notes, hidden peer scorecards and protected EEO/compensation data, enforced on the server (§12, §16).
11. **State communication is designed, not incidental.** Empty, loading and error states follow the Carbon, Polaris and GOV.UK guidance and are announced to assistive technology (§17–§19).
12. **Accessibility and i18n are foundations, not phases.** WCAG 2.2 AA (including 2.5.7 drag alternatives and 4.1.3 status messages) and localisation are built into the component library from day one (§22).
13. **Approvals are re-triggered only by material changes.** This is a lesson from documented customer friction (§21).
14. **Preserve what OpenCATS already does well.** Keep the one-dialog status workflow with its side effects, MRU and quick search, duplicate detection at entry, the per-user column chooser and "add new candidate from the job" auto-pipelining (`UX_UI_AUDIT.md` §12.1), re-expressed in the new patterns.

---

## Facts vs Inferences

**Facts (verified first-hand)**
- **OpenCATS baseline:** every statement cited to `UX_UI_AUDIT.md`, `FEATURE_INVENTORY.md` or `PRODUCT_GAPS.md` IDs. These rest on the Phase 0 code audit.
- **Greenhouse** (official API docs, `grnhse/greenhouse-api-docs` @271cd88):
  - scorecard fields and the five overall-recommendation values;
  - note visibility `admin_only` / `public` / `private`;
  - approval flows (types, groups, quorum, sequential);
  - scheduled-interview statuses and interviewer response statuses;
  - interview kits on job stages;
  - roles `interviewer` / `job_admin`, and job plus future-job permissions by office and department;
  - job-board questions, EEOC compliance, demographic questions and GDPR `data_compliance`.
- **Lever** (`lever/postings-api` @f61aac5): hosted job site and form (global and EU); name and e-mail as the only system-required fields; e-mail dedupe; consent fields; 2 POSTs per second rate limit and 429 handling; hosted form recommended.
- **Bullhorn** (`bullhorn/career-portal` @c450bae): keyword and sidebar filters; one-modal apply with 5 core fields; configurable EEOC and consent; Apply disabled until valid, with a loading state; generic error message; 11 locale files.
- **Teamtailor** (`teamtailor/tt-partner-docs` @cba212f): stage triggers and ordered "moving criteria" rules that move candidates between stages based on partner results.
- **General guidance texts** (GOV.UK, Carbon, Polaris, WCAG 2.2, APG) as quoted.
- **GitLab handbook** (@f243917): the *statements* quoted are verbatim from the repository. Their truth about Greenhouse and ModernLoop behaviour is an independent customer claim.

**Source claims (not independently verified)**
- All help-center content from Greenhouse, Lever, Ashby, Workable, Recruitee, Teamtailor, Pinpoint, Bullhorn KB, SAP, Oracle and Workday was seen only as search excerpts.
- Marketing claims (Gem AI sourcing, Workday agent, SmartRecruiters app) were not verified.

**Inferences (this author's reasoning)**
- Every "Repeated pattern" paragraph.
- The convergence ratings in the summary table.
- The gap severities.
- Step counts marked INFERENCE.
- The ATS-specific empty-state cases.
- The statement that search scope is "implicit" across vendors.
- The cross-cutting principles.

---

## Unknowns

1. **Vendor help-center pages in full.** None could be fetched because of egress blocking. All "search excerpt" claims need browser verification: wording, current UI names, plan or tier gating, and whether they are still current (e.g., Greenhouse saved searches, S10 vs S11).
2. **Screenshots / visual layouts** of every vendor. Not viewable.
3. **iCIMS:** no evidence gathered on any pattern area.
4. **Independent review aggregates** (G2, Capterra, TrustRadius) and analyst reports. Not reachable, and the search budget was exhausted. Friction evidence is therefore limited to vendor-documented limitations and the GitLab handbook.
5. **Notifications:** in-app, e-mail digest, Slack/Teams and mobile push behaviour for all vendors (only claims and app existence were found).
6. **@mentions** in any vendor, and what "share" grants (Recruitee).
7. **Analytics UX detail:** filters, drill-down and export for all vendors.
8. **Settings/admin and permissions UX detail** beyond Greenhouse's API model.
9. **Accessibility conformance** (VPAT/ACR, WCAG level) for all 14 vendors.
10. **Empty, loading and error state behaviour** in vendor products. General guidance was used instead.
11. **Offer-approval UI steps** and mobile or chat approvals, for all vendors.
12. **Scorecard behaviour** in Workday, SAP SuccessFactors, Oracle, iCIMS, SmartRecruiters, Ashby and Workable.
13. **Single-candidate stage-move step counts** in Greenhouse, Workable and Ashby.
14. **Ownership/M&A context.** Only an SAP Learning course title linking SmartRecruiters with SAP SuccessFactors was seen (S65). Ownership facts should be taken from the competitor profile documents, not from this file.
15. **Teamtailor Candidates tab visible only to Group members.** The excerpt's attribution to S55 is uncertain.

---

## Sources

All accessed 2026-09-25. Evidence grade in brackets: **[F]** = read first-hand (FACT-grade source); **[V-x]** = vendor, search excerpt only; **[V]** = vendor marketing claim; **[I-f]** = independent, read first-hand; **[I-x]** = independent, search excerpt; **[G]** = general guidance read first-hand; **[T]** = title seen in search results only.

**Greenhouse**
1. S1 — https://support.greenhouse.io/hc/en-us/articles/4402108629787-Task-management-overview — Greenhouse Support, "Task management overview" — [V-x] — accessed 2026-09-25
2. S2 — https://support.greenhouse.io/hc/en-us/articles/115003243886-Personalize-your-Greenhouse-Recruiting-dashboard — Greenhouse Support — [V-x] — accessed 2026-09-25
3. S3 — https://support.greenhouse.io/hc/en-us/articles/360016572311-Hiring-team-role-Hiring-manager — Greenhouse Support — [V-x] — accessed 2026-09-25
4. S4 — https://support.greenhouse.io/hc/en-us/articles/4402694472347-Hiring-Manager-Review-stage — Greenhouse Support — [V-x] — accessed 2026-09-25
5. S5 — https://support.greenhouse.io/hc/en-us/articles/11957068130971-Using-the-new-candidate-profile — Greenhouse Support — [V-x] — accessed 2026-09-25
6. S6 — https://support.greenhouse.io/hc/en-us/articles/30352015432987-Candidate-profile-redesign-overview — Greenhouse Support — [V-x] — accessed 2026-09-25
7. S7 — https://support.greenhouse.io/hc/en-us/articles/360028064592-Move-candidates-to-another-stage-in-bulk — Greenhouse Support — [V-x] — accessed 2026-09-25
8. S8 — https://support.greenhouse.io/hc/en-us/articles/4874727408795-Visual-Candidate-Pipeline — Greenhouse Support — [V-x] — accessed 2026-09-25
9. S9 — https://support.greenhouse.io/hc/en-us/articles/202360199-Search-candidates-using-Boolean-queries — Greenhouse Support — [V-x] — accessed 2026-09-25
10. S10 — https://support.greenhouse.io/hc/en-us/articles/200775575-Save-candidate-search — Greenhouse Support (older article) — [V-x] — accessed 2026-09-25
11. S11 — https://support.greenhouse.io/hc/en-us/articles/27104809835291-Talent-Filtering — Greenhouse Support — [V-x] — accessed 2026-09-25
12. S12 — https://support.greenhouse.io/hc/en-us/articles/4409534663579-Candidate-self-scheduling-overview — Greenhouse Support — [V-x] — accessed 2026-09-25
13. S13 — https://support.greenhouse.io/hc/en-us/articles/4409534692507-Complete-a-self-schedule-request — Greenhouse Support — [V-x] — accessed 2026-09-25
14. S14 — https://support.greenhouse.io/hc/en-us/articles/4409526364443-Candidate-self-scheduling-setup — Greenhouse Support — [V-x] — accessed 2026-09-25
15. S15 — https://support.greenhouse.io/hc/en-us/articles/13301025470875-Request-candidate-availability — Greenhouse Support — [V-x] — accessed 2026-09-25
16. S16 — https://support.greenhouse.io/hc/en-us/articles/4408761575963-Report-dashboards-overview — Greenhouse Support — [T] — accessed 2026-09-25
17. S17 — https://support.greenhouse.io/hc/en-us/articles/30184390692379-Talent-Rediscovery — Greenhouse Support — [V-x] — accessed 2026-09-25
18. S18 — https://support.greenhouse.io/hc/en-us/articles/360028035692-Add-candidates-to-another-job-in-bulk — Greenhouse Support — [T] — accessed 2026-09-25
19. S19 — https://support.greenhouse.io/hc/en-us/articles/360018647671-Add-hiring-manager-review-stage-to-interview-plans-in-bulk — Greenhouse Support — [T] — accessed 2026-09-25
20. S20 — https://github.com/grnhse/greenhouse-api-docs (commit 271cd88, 2026-09-10; files `source/includes/harvest/_scorecards.md`, `_activity_feed.md`, `_approvals.md`, `_scheduled_interviews.md`, `_user_roles.md`, `_user_permissions.md`, `_job_stages.md`, `source/includes/job-board/_jobs.md`) — official Greenhouse developer docs on GitHub — [F] — accessed 2026-09-25

**Lever**

21. S21 — https://help.lever.co/hc/en-us/articles/20087316973981-Using-the-bulk-action-toolbar — Lever Help Center — [V-x] — accessed 2026-09-25
22. S22 — https://help.lever.co/hc/en-us/articles/20087378017949-Understanding-the-structure-of-your-pipeline — Lever Help Center — [V-x] — accessed 2026-09-25
23. S23 — https://help.lever.co/hc/en-us/articles/20087317030685-Searching-the-database-for-candidates — Lever Help Center — [V-x] — accessed 2026-09-25
24. S24 — https://help.lever.co/hc/en-us/articles/20087358474397-Getting-started-with-Lever-as-an-Interviewer — Lever Help Center — [V-x] — accessed 2026-09-25
25. S25 — https://help.lever.co/hc/en-us/articles/6618029187981-Visual-Insights-Hiring-Manager-dashboard — Lever Help Center — [V-x] — accessed 2026-09-25
26. S26 — https://help.lever.co/hc/en-us/articles/20087333592093-Visual-Insights-Interviews-dashboard — Lever Help Center — [T] — accessed 2026-09-25
27. S27 — https://github.com/lever/postings-api (commit f61aac5, 2026-04-23; `README.md`) — official Lever API docs on GitHub — [F] — accessed 2026-09-25

**Ashby**

28. S28 — https://docs.ashbyhq.com/scheduling-and-interviews-an-introduction — Ashby Knowledge Base — [V-x] — accessed 2026-09-25
29. S29 — https://ashbyhq.com/platform/recruiting/scheduling — Ashby product page — [V-x] — accessed 2026-09-25
30. S30 — https://docs.ashbyhq.com/candidate-pipeline — Ashby Knowledge Base — [V-x] — accessed 2026-09-25
31. S31 — https://docs.ashbyhq.com/application-review — Ashby Knowledge Base — [V-x] — accessed 2026-09-25

**Workable**

32. S32 — https://help.workable.com/hc/en-us/articles/22233308582423-Exploring-Workable-home-page — Workable Help — [V-x] — accessed 2026-09-25
33. S33 — https://help.workable.com/hc/en-us/articles/360039694933-Mobile-dashboard-overview — Workable Help — [V-x] — accessed 2026-09-25
34. S34 — https://help.workable.com/hc/en-us/articles/8495289154839-Moving-candidates-through-the-pipeline — Workable Help — [V-x] — accessed 2026-09-25
35. S35 — https://help.workable.com/hc/en-us/articles/4413312707991-Recruiting-pipeline-best-practices — Workable Help — [V-x] — accessed 2026-09-25
36. S36 — https://help.workable.com/hc/en-us/articles/6058530293015-How-do-I-run-an-advanced-boolean-search-for-candidates — Workable Help — [V-x] — accessed 2026-09-25
37. S37 — https://help.workable.com/hc/en-us/articles/360007483594-Self-scheduled-events — Workable Help — [V-x] — accessed 2026-09-25
38. S38 — https://help.workable.com/hc/en-us/articles/8808063238935-Workable-Report-center-overview — Workable Help (Activity log report seen in the same result list: https://help.workable.com/hc/en-us/articles/115012921548-Using-the-Activity-log-report) — [T] — accessed 2026-09-25
39. S39 — https://help.workable.com/hc/en-us/articles/360002392334-How-do-I-schedule-a-multi-part-interview — Workable Help — [T] — accessed 2026-09-25
40. S40 — https://help.workable.com/hc/en-us/articles/115011967408-Customizing-the-recruiting-pipeline — Workable Help (also "Choosing and updating a pipeline for a job", https://help.workable.com/hc/en-us/articles/115012371248, and "Setting up automated actions", https://help.workable.com/hc/en-us/articles/1500007691921) — [T] — accessed 2026-09-25

**Recruitee (Tellent)**

41. S41 — https://support.recruitee.com/en/articles/1066290-performing-bulk-actions — Recruitee Help Center — [V-x] — accessed 2026-09-25
42. S42 — https://support.recruitee.com/en/articles/4142043-pipelines — Recruitee Help Center — [V-x] — accessed 2026-09-25
43. S43 — https://recruitee.com/candidate-pipeline-management — Recruitee product page — [V-x] — accessed 2026-09-25
44. S44 — https://support.recruitee.com/en/articles/1066269-search-candidates-in-a-talent-pool — Recruitee Help Center — [V-x] — accessed 2026-09-25

**Teamtailor**

45. S45 — https://support.teamtailor.com/en/articles/11161661-hiring-manager-guide-to-teamtailor — Teamtailor Support — [V-x] — accessed 2026-09-25
46. S46 — https://support.teamtailor.com/en/articles/9153972-our-candidate-card — Teamtailor Support — [V-x] — accessed 2026-09-25
47. S47 — https://support.teamtailor.com/en/articles/2564412-job-scorecards — Teamtailor Support — [V-x] — accessed 2026-09-25
48. S48 — https://support.teamtailor.com/en/articles/7891886-job-match-score — Teamtailor Support — [V-x] — accessed 2026-09-25
49. S49 — https://support.teamtailor.com/en/articles/15443685-manage-candidates-across-multiple-recruitment-processes-in-the-applications-view — Teamtailor Support — [V-x] — accessed 2026-09-25
50. S50 — https://updates.teamtailor.com/manage-candidates-across-all-your-jobs-in-one-place-341111 — Teamtailor product updates — [V-x] — accessed 2026-09-25
51. S51 — https://support.teamtailor.com/en/articles/6302247-let-your-candidates-self-schedule-your-meetings — Teamtailor Support — [V-x] — accessed 2026-09-25
52. S52 — https://updates.teamtailor.com/candidate-self-scheduled-meetings-rescheduling-332518 — Teamtailor product updates — [V-x] — accessed 2026-09-25
53. S53 — https://support.teamtailor.com/en/articles/8355597-book-a-meeting — Teamtailor Support — [V-x] — accessed 2026-09-25
54. S54 — https://github.com/teamtailor/tt-partner-docs (commit cba212f, 2026-09-09; `source/includes/partners/_webhooks.md.erb`, `moving_criteria/_index.md.erb`, `_changelog.md.erb`) — official Teamtailor partner API docs on GitHub — [F] — accessed 2026-09-25
55. S55 — https://support.teamtailor.com/en/articles/8182137-default-user-guide-to-teamtailor — Teamtailor Support (attribution of the "Candidates tab for Group members" excerpt is uncertain) — [V-x] — accessed 2026-09-25

**Pinpoint**

56. S56 — https://help.pinpoint.support/en/articles/10505682-board-view — Pinpoint Help Center — [V-x] — accessed 2026-09-25
57. S57 — https://help.pinpoint.support/en/articles/2610690-how-do-i-create-a-hiring-workflow — Pinpoint Help Center — [T] — accessed 2026-09-25

**Bullhorn**

58. S58 — https://kb.bullhorn.com/ats/Content/BHATS/Topics/savedAndRecentSearches.htm — Bullhorn ATS knowledge base — [V-x] — accessed 2026-09-25
59. S59 — https://kb.bullhorn.com/ats/Content/BHATS/Topics/newCandidateListFAQ.htm — Bullhorn ATS knowledge base — [V-x] — accessed 2026-09-25
60. S60 — https://github.com/bullhorn/career-portal (commit c450bae, 2026-05-22; `src/app/apply-modal/*`, `src/app/sidebar/*`, `src/static/i18n/*`) — Bullhorn official open-source career portal — [F] — accessed 2026-09-25

**Gem**

61. S61 — https://www.gem.com/product/ai-sourcing — Gem product page — [V] — accessed 2026-09-25
62. S62 — https://help.gem.com/external/getting-started-with-ai-sourcing — Gem Help Center — [V-x] — accessed 2026-09-25

**SmartRecruiters / SAP SuccessFactors**

63. S63 — https://apps.apple.com/us/app/hiring/id797577300 — SmartRecruiters "Hiring" app, Apple App Store listing — [V-x] — accessed 2026-09-25
64. S64 — https://play.google.com/store/apps/details?id=com.smartrecruiters.backoffice&hl=en_US — SmartRecruiters "Hiring" app, Google Play listing — [V-x] — accessed 2026-09-25
65. S65 — https://learning.sap.com/courses/smartrecruiters-for-sap-successfactors-academy/implementing-individual-and-group-interview-self-scheduling_ee0f7a65-66e5-481a-ba28-ce2ca1799818 — SAP Learning course unit — [T] — accessed 2026-09-25
66. S66 — https://help.sap.com/docs/successfactors-recruiting/setting-up-and-maintaining-sap-successfactors-recruiting/interview-scheduling-candidate-view — SAP Help Portal — [V-x] — accessed 2026-09-25
67. S67 — https://help.sap.com/docs/successfactors-recruiting/setting-up-and-maintaining-sap-successfactors-recruiting/configuring-interview-scheduling — SAP Help Portal — [V-x] — accessed 2026-09-25
68. S68 — https://blog.sap-press.com/scheduling-interviews-in-sap-successfactors-recruiting — SAP PRESS blog (independent publisher) — [I-x] — accessed 2026-09-25
69. S69 — https://sapinsider.org/articles/an-overview-of-sap-successfactors-interview-scheduling-functionality/ — SAPinsider (independent publisher) — [I-x] — accessed 2026-09-25

**Oracle**

70. S70 — https://docs.oracle.com/en/cloud/saas/talent-management/faarb/candidate-schedule-based-on-interviewers-availability.html — Oracle Cloud documentation — [V-x] — accessed 2026-09-25
71. S71 — https://docs.oracle.com/en/cloud/saas/talent-management/21c/faimh/candidate-interviews.html — Oracle Cloud documentation (Candidate Interviews, 21C) — [V-x] — accessed 2026-09-25

**Workday**

72. S72 — https://doc.workday.com/admin-guide/en-us/human-capital-management/recruiting/candidates/candidate-self-scheduling/thu1588675418534.html — Workday Administrator Guide, "Setup Considerations: Candidate Self-Scheduling" — [T] — accessed 2026-09-25
73. S73 — https://www.workday.com/en-us/products/talent-management/talent-acquisition.html — Workday product page (attribution of the Teams/Slack/mobile excerpt to this exact page is uncertain) — [V] — accessed 2026-09-25
74. S74 — https://www.workday.com/en-us/products/conversational-ai/candidate-experience.html — Workday product page — [V] — accessed 2026-09-25
75. S75 — https://hr.wisc.edu/hr-guides/for-hr-professionals/create-and-manage-recruiting-self-schedule-calendar/ — University of Wisconsin–Madison HR guide (Workday customer) — [I-x] — accessed 2026-09-25

**GitLab handbook (independent customer documentation; repository https://gitlab.com/gitlab-com/content-sites/handbook, commit f243917, 2026-09-25)**

76. S76 — https://handbook.gitlab.com/handbook/hiring/talent-acquisition-framework/coordinator/ (`content/handbook/hiring/talent-acquisition-framework/coordinator.md`) — [I-f] — accessed 2026-09-25
77. S77 — https://handbook.gitlab.com/handbook/hiring/conducting-a-gitlab-interview/ (`conducting-a-gitlab-interview.md`) — [I-f] — accessed 2026-09-25
78. S78 — https://handbook.gitlab.com/handbook/hiring/interviewing/ (`interviewing/_index.md`) — [I-f] — accessed 2026-09-25
79. S79 — https://handbook.gitlab.com/handbook/hiring/candidate-faq/ (`candidate-faq/_index.md`) — [I-f] — accessed 2026-09-25
80. S80 — https://handbook.gitlab.com/handbook/hiring/referral-operations/ (`referral-operations.md`) — [I-f] — accessed 2026-09-25

**IBM Carbon Design System (read from https://github.com/carbon-design-system/carbon-website, commit d8783ad)**

81. S81 — https://carbondesignsystem.com/patterns/empty-states-pattern/ — [G] — accessed 2026-09-25
82. S82 — https://carbondesignsystem.com/patterns/loading-pattern/ — [G] — accessed 2026-09-25
83. S83 — https://carbondesignsystem.com/patterns/notification-pattern/ — [G] — accessed 2026-09-25
84. S84 — https://carbondesignsystem.com/patterns/filtering/ — [G] — accessed 2026-09-25
85. S85 — https://carbondesignsystem.com/patterns/search-pattern/ — [G] — accessed 2026-09-25
86. S86 — https://carbondesignsystem.com/components/data-table/usage/ — [G] — accessed 2026-09-25

**GOV.UK Design System (read from https://github.com/alphagov/govuk-design-system, commit 52b7062)**

87. S87 — https://design-system.service.gov.uk/components/error-summary/ — [G] — accessed 2026-09-25
88. S88 — https://design-system.service.gov.uk/components/error-message/ — [G] — accessed 2026-09-25
89. S89 — https://design-system.service.gov.uk/patterns/validation/ — [G] — accessed 2026-09-25
90. S90 — https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/ — [G] — accessed 2026-09-25
91. S91 — https://design-system.service.gov.uk/patterns/question-pages/ — [G] — accessed 2026-09-25
92. S92 — https://design-system.service.gov.uk/patterns/check-answers/ — [G] — accessed 2026-09-25
93. S93 — https://design-system.service.gov.uk/patterns/equality-information/ — [G] — accessed 2026-09-25
94. S94 — https://design-system.service.gov.uk/patterns/names/ — [G] — accessed 2026-09-25
95. S95 — https://design-system.service.gov.uk/patterns/complete-multiple-tasks/ — [G] — accessed 2026-09-25

**Shopify Polaris (read from https://github.com/Shopify/polaris, commit 3f7954a)**

96. S96 — https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/selection-and-input/index-filters.mdx — [G] — accessed 2026-09-25
97. S97 — https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/index-table.mdx — [G] — accessed 2026-09-25
98. S98 — https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/layout-and-structure/empty-state.mdx — [G] — accessed 2026-09-25
99. S99 — https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/patterns-legacy/loading.mdx — [G] — accessed 2026-09-25
100. S100 — https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/patterns/app-settings-layout/index.mdx — [G] — accessed 2026-09-25

**W3C WAI (read from https://github.com/w3c/wcag, commit 71c891a, and https://github.com/w3c/aria-practices, commit 3f094fd)**

101. S101 — https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html — Understanding SC 2.5.7 Dragging Movements — [G] — accessed 2026-09-25
102. S102 — https://www.w3.org/TR/WCAG22/#status-messages — WCAG 2.2 SC 4.1.3 Status Messages (normative text) — [G] — accessed 2026-09-25
103. S103 — https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html — Understanding SC 3.3.7 Redundant Entry — [G] — accessed 2026-09-25
104. S104 — https://www.w3.org/WAI/WCAG22/Understanding/reflow.html — Understanding SC 1.4.10 Reflow — [G] — accessed 2026-09-25
105. S105 — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — Understanding SC 2.5.8 Target Size (Minimum) — [G] — accessed 2026-09-25
106. S106 — https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html — Understanding SC 2.2.1 Timing Adjustable — [G] — accessed 2026-09-25
107. S107 — https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html — Understanding SC 3.3.8 Accessible Authentication (Minimum) — [G] — accessed 2026-09-25
108. S108 — https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html — Understanding SC 2.4.11 Focus Not Obscured (Minimum) — [G] — accessed 2026-09-25
109. S109 — https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html — Understanding SC 3.2.6 Consistent Help — [G] — accessed 2026-09-25
110. S110 — https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ — WAI-ARIA Authoring Practices, Dialog (Modal) Pattern — [G] — accessed 2026-09-25

**OpenCATS baseline (this repository)**

111. S111 — `docs/audit/UX_UI_AUDIT.md` — Phase 0 UX/UI audit (UX-001…UX-022, journeys J1–J5) — [F] — accessed 2026-09-25
112. S112 — `docs/audit/FEATURE_INVENTORY.md` — Phase 0 feature inventory (FEAT-001…FEAT-020) — [F] — accessed 2026-09-25
113. S113 — `docs/audit/PRODUCT_GAPS.md` — Phase 0 product gaps (GAP-001…GAP-025) — [F] — accessed 2026-09-25

**Additional**

114. S114 — https://help.pinpoint.support/en/articles/6113124-understanding-roles — Pinpoint Help Center, "Understanding Roles" — [T] — accessed 2026-09-25
