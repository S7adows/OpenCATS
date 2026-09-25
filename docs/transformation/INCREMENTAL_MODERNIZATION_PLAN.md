# OpenCATS 2.0 — Incremental Modernization Plan

**Status:** PROPOSED (Phase 3C). No slice is approved for implementation until explicitly approved. Date: 2026-09-25.
**Inputs:** Phase 0 audit (`docs/audit/`), Phase 2 research (`docs/competitive/`, `docs/product/`), `UPSTREAM_RECONCILIATION.md` (3A), `LICENSE_AND_DISTRIBUTION_ANALYSIS.md` (3B), design foundation (`docs/design/`).
**Strategy (given):** modernize incrementally · one vertical slice at a time · modernize old components when touched · no big-bang rewrite · no replacement of working functionality without a migration reason.

---

## 1. Planning baseline — what changed since Phase 0

| Fact (verified) | Consequence for the plan |
|---|---|
| Upstream `opencats/OpenCATS` v0.11.1 is 176 commits ahead of our fork; a code merge is **conflict-free** (our fork differs only in `docs/`) (3A §"Migration conflicts") | **Build on upstream, don't redo it.** Phase 0 roadmap items for PHP 8, password hashing, CSRF, InnoDB, utf8mb4, most AJAX authorisation are **done upstream** and must not be re-implemented. |
| Upstream `master` after v0.11.1 (`be93937`, #864) overwrote `config.php` with test settings (`DATABASE_NAME 'cats_test'`, host `opencatsdb`) and removed LDAP constants still used by `lib/LDAP.php` (lead-verified) | Baseline = **v0.11.1 + selected cherry-picks**, not upstream `master` HEAD. |
| Still open upstream (verified in code): **SEC-024** careers `candidateID` overwrite (`CareersUI.php:815`), **DB-001** merge without `data_item_type`, SEC-002 forgot-password, SEC-006 LDAP, SEC-007 session fixation/cookie flags, SEC-025, SEC-027 DataGrid regex, `ajax_tags_*` without ACL, Resfly/phone-home, DB-002 error handling; partial: SEC-005/008/009/010/026, DB-005 (3A) | These form the **containment work** in Slice 1. |
| Upstream migration runner is still `Schema.php` (eval'd PHP, `;`-split SQL), now gated to the maintenance page; no FKs, no transactions; migration 385 deletes orphan rows **and attachment files** (3A) | Upgrade runbook + backups before adopting; introduce a real migration tool at the first schema change we own (Slice 2). |
| ~94% of first-party lines (97.8% of the runtime request path) are CATS-derived and CPL 1.1a-covered; Exhibit B restricts hosted/ASP use without Cognizo's permission; editing files does not remove CPL coverage (3B) | Incremental modernization **does not by itself** unlock SaaS. Plan targets self-hosted distribution; new code is written as **new files** (MPL-2.0 per `LICENSE.md`) so legal options stay open. Hosted offering remains gated on legal review (D3/D4). |
| Frontend: jQuery 1.3.2 still shipped upstream; no build step; raw PHP templates; upstream adds `Template::escape*` helpers and CSRF injection via chained `window.onload` (design docs) | UI model: **server-first + light-DOM custom elements** (`docs/design/COMPONENT_ARCHITECTURE.md` §1.3, ADR-UI-001), no framework runtime until the stack ADR. |

## 2. Architecture guardrails (apply to every slice)

1. **One code base, two layers.** Legacy modules keep running; new code lives in `src/OpenCATS/` (PSR-4, composer autoload already configured) with constructor-injected services, typed PHP 8.4, `declare(strict_types=1)`. No new code in `lib/` except thin adapters.
2. **New routes through one front controller.** Add `/api/v1/*` (JSON) and new page routes through a small router invoked from `index.php` before legacy module dispatch; legacy `index.php?m=&a=` keeps working. Every new route: authenticated session or token, CSRF for state changes, **authorization in the service layer**, output escaping by default.
3. **Data access for new code:** PDO with prepared statements via a repository layer; transactions (InnoDB now available upstream). Never extend `DatabaseConnection` string-SQL for new features.
4. **Schema changes only through the migration tool** (introduced in Slice 2), never implicit at request time. Legacy `Schema.php` migrations are frozen at the upstream version we adopt.
5. **UI:** tokens (`docs/design/DESIGN_TOKENS.md`) → PHP partials for static components → `<oc-*>` light-DOM custom elements for stateful ones; no inline JS; WCAG 2.2 AA; responsive; English strings through a translation function from day one (`t()`), even before localization.
6. **Touch-it-modernize-it (bounded).** When a slice changes a legacy screen, it runs the per-page checklist in `docs/design/UI_MIGRATION_STRATEGY.md` (legacy UI, old JS, obsolete components, a11y, responsive, duplicated logic, API structure, validation, permissions) **for that screen only**, and replaces it where practical. Anything larger is logged as a follow-up, not absorbed.
7. **Parity by tests.** Before changing a legacy behaviour, add a characterization test; after, the test documents the intended new behaviour.
8. **Every slice passes the gate sequence:** Discovery → UX → Components → Database → Backend → API → Frontend → Tests → Security review → Accessibility review → Performance review → Documentation → Commit. A slice is not "done" in part.

## 3. Prioritization and ordering

Scoring: **user value + security + foundation + dependencies + migration risk**. The given 28-stage ordering is kept as the backbone; deviations and why:

| Change vs given order | Reason |
|---|---|
| Foundation stages 1–5 are delivered **inside Slice 1 and 2**, not as five invisible phases | Most runtime/auth/DB work is already upstream (3A); the remaining work is containment + CI + design foundation, which can ship with a visible screen |
| "Candidate experience" split: **recruiter-side candidate list/profile first**, public careers site later (Slice 7) | Careers site depends on consent/privacy (stage 18) and API structure; recruiters use the candidate screens daily |
| **Roles/permissions and audit log (16–17) move ahead of hiring-workflow slices** | Interviewers and hiring managers (stages 12–14) cannot be given access safely without job-scoped RBAC and audit |
| **Privacy/consent (18) moves ahead of careers site and scheduling** | New candidate data capture (apply, scheduling, recordings) must be consent-aware from the start |
| **Public API (19) is built incrementally** (each slice exposes its JSON endpoints under `/api/v1` for its own UI); the *published, token-authenticated* API + webhooks are a later slice | Avoids a big-bang API; the UI dogfoods the API |
| Agency slice (placements, submittals, client portal) placed after pipeline + RBAC; position depends on decision D2 | Needs workflow engine and scoped external access |
| Accessibility, responsive and localization are **acceptance criteria of every slice**, with "completion" slices at the end to sweep remaining legacy screens | Avoids a late big-bang retrofit |

### Slice roadmap (initial; re-evaluated after each slice)

| # | Slice | Stages covered | Depends on |
|---|---|---|---|
| **1** | **Secure baseline + App Shell + modern Candidates list** | 1, 2, 4, 5, (6), 9-partial | — |
| 2 | Candidate profile & activity timeline (+ migration tool, event history) | 3, 11 | 1 |
| 3 | Configurable pipeline: workflow templates, dispositions, board + list | 8, 7-partial | 2 |
| 4 | Job workspace (job list/detail, job states, openings) | 7 | 3 |
| 5 | Search, saved views & bulk actions | 9, 10 | 3 |
| 6 | Roles, hiring teams & permissions + audit log v1 | 16, 17 | 1–5 |
| 7 | Privacy foundation: consent, retention, DSAR, anonymisation | 18 | 2, 6 |
| 8 | Modern careers site & apply (headless careers API, JSON-LD, magic-link candidate status) | 25, 6 | 3, 7 |
| 9 | Interview scheduling (calendar connectors, self-schedule) | 12 | 6, 7 |
| 10 | Structured scorecards & debrief | 13 | 9 |
| 11 | Hiring-manager experience (review queue, feedback, approvals on mobile) | 14 | 6, 10 |
| 12 | Offers & approvals (approval engine; requisitions reuse it) | 15 | 6, 11 |
| 13 | Agency: submittals, placements, client review portal | (agency) | 3, 6, 12 |
| 14 | Public API v1 (tokens, OpenAPI) + webhooks | 19, 20 | 6 |
| 15 | Integrations framework (e-mail/calendar sync, e-sign, job boards, HRIS events) | 21 | 14 |
| 16 | Analytics (metric dictionary, dashboards, export) | 22 | 2–3 event history |
| 17 | Automation (stage actions, reminders, sequences) | 23 | 3, durable queue |
| 18 | AI capabilities (gateway, parsing, drafting, semantic search; governed) | 24 | 6, 7, 14 |
| 19 | Mobile/responsive sweep of remaining legacy screens | 26 | — |
| 20 | Accessibility completion + published ACR | 27 | — |
| 21 | Localization (catalogs, locales, time zones) | 28 | strings via `t()` since Slice 1 |

---

## 4. Slice specifications

Slices 1–3 are specified in full; later slices are specified at planning depth (all 11 fields) and will be re-detailed at their Discovery step.

### Slice 1 — Secure baseline + App Shell + modern Candidates list

1. **User problem.** Recruiters work in a 2007-era UI that is unsafe (open CRITICAL defects), not responsive, not accessible, and whose list views reload the whole page and silently lose bulk selections (UX-002, UX-014). Administrators cannot run the fork on a supported PHP version.
2. **Product outcome.** OpenCATS runs on the reconciled upstream baseline (PHP 8.4) with the remaining critical defects closed and CI enforcing it; recruiters get a new accessible, responsive **app shell** and a fast **Candidates list** (search, filters, sort, pagination, URL-shareable state, clear empty/loading/error states). All other screens keep working inside the new shell.
3. **UX.** App shell: header with product mark, global search entry, user menu; primary navigation (Home, Candidates, Job Orders, Companies, Contacts, Activities, Calendar, Reports, Settings — parity with today's tabs), skip link, landmarks. Candidates list: one table view with columns parity to today's default grid (name, city/state, key skills, owner, modified, attachments, hot flag), keyword search, filters (owner, hot, modified-since, tag), server-side sort + pagination, row click → existing legacy candidate page. No new workflows; no bulk actions yet (the broken legacy bulk bar stays on the legacy page until Slice 5, behind a link "classic view").
4. **Frontend components.** Tokens (`oc-tokens.css`), App Shell, Navigation, Page Header, Button, Form controls (text, select, checkbox), Search input, Filters (basic), Data Table (`<oc-data-table>`, server-rendered, progressive enhancement), Status badge, Empty/Loading/Error states, Toast region. Built per `docs/design/COMPONENT_ARCHITECTURE.md`; each with catalog entry + axe test.
5. **Backend changes.**
   - Merge upstream **v0.11.1** into a reconciliation branch; cherry-pick upstream fixes after v0.11.1 that don't carry the `config.php` regression (#866, #867, #873 per 3A — verify each); resolve nothing by hand in legacy code beyond containment below.
   - Containment fixes (all with regression tests, offered upstream): SEC-024 (never trust posted `candidateID`), DB-001 (merge filters by `data_item_type`, runs in a transaction), SEC-007 (`session_regenerate_id` on login; HttpOnly/Secure/SameSite cookie params; CSRF token rotation), SEC-027 (fix DataGrid identifier regex + allowlist), `ajax_tags_*` ACL, attachment `Content-Disposition: attachment` + no inline HTML/SVG, disable Resfly and phone-home by default (honour `PARSING_ENABLED`), unauthenticated `graphs`/`zipLookup` require login, SEC-002 forgot-password replaced by tokenised reset **or** disabled with admin reset (decision inside slice; default: disable + document).
   - New `src/OpenCATS` kernel: minimal router for `/api/v1` + new pages, DI container, PDO connection, error handling/logging, CSRF/session middleware reuse from upstream.
   - `CandidateListQuery` service (prepared statements, allowlisted sort/filter fields, `LIMIT/OFFSET` with total count via separate `COUNT`), authorization check equal to legacy `candidates.list` access level.
6. **Database changes.** None of our own. Upstream migrations up to v0.11.1 apply (InnoDB 375, utf8mb4 390, multi-tenancy removal 392, orphan cleanup 385). Add indexes only if the list query needs them — deferred to Slice 2's migration tool unless performance review requires (then via upstream-compatible migration).
7. **API changes.** `GET /api/v1/candidates?q=&owner=&hot=&modifiedSince=&tag=&sort=&page=&perPage=` (JSON; session-authenticated; same-origin; returns items + page meta). Internal-first: documented in an OpenAPI stub, not yet a public contract.
8. **Security implications.** Closes remaining CRITICALs; new endpoint enforces authn/authz/rate of page size; output escaping in partials; strict CSP (report-only first) on new-shell pages; no inline script in new code; dependency audit blocking for runtime deps.
9. **Tests.** Upstream PHPUnit suite green on PHP 8.4/8.5; new unit tests for containment fixes (each reproduces the Phase 0 defect first); service tests for `CandidateListQuery` (SQL injection, sort allowlist, permission denial); HTTP characterization tests for login, candidate list, candidate show, careers apply; Playwright + axe for shell and list (keyboard, screen-reader names, 200%/400% zoom, 320 px width); performance smoke with 50k synthetic candidates (p95 list query < 300 ms target on reference hardware — to be confirmed).
10. **Migration strategy.** (a) Upgrade runbook for existing installs: PHP ≥ 8.4.1, full DB dump **and** copy of `attachments/`, pre-flight report (multi-site data, orphan rows that migration 385 would delete). (b) Feature flag `ui.v2.candidatesList` (default on for new installs, toggle for upgrades); legacy list stays reachable as "classic view" for one release. (c) Rollback: restore dump + attachments; flag off.
11. **Definition of done.** Merged baseline builds and passes CI (PHP 8.4/8.5, lint all, tests blocking, `composer audit` blocking for runtime); all listed containment fixes merged with tests and filed upstream; app shell renders every legacy page without regressions in the characterization suite; Candidates list meets parity + a11y (axe clean, keyboard, WCAG 2.2 AA manual pass) + responsive; security review + performance review recorded; docs updated (runbook, component catalog, ADR-UI-001 decision record, CHANGELOG); single coherent commit series on the slice branch.

### Slice 2 — Candidate profile & activity timeline

1. **User problem.** The candidate page is a long legacy page; edits corrupt text by double-escaping (UX-003); history is mutable and separate; any user can edit/delete activities (FEAT-006).
2. **Product outcome.** A modern candidate profile: header with key facts and next actions, tabs (Overview, Applications/Pipelines, Attachments, Activity), unified **timeline** (activities, status changes, e-mails, edits) with visibility; clean text storage.
3. **UX.** Application-centric layout (`MODERN_ATS_UX_PATTERNS.md` #4, #11); edit in a drawer with inline validation and error summary; no data loss on validation errors.
4. **Frontend components.** Tabs, Drawer, Timeline item, Candidate card (header), Form patterns (error summary), Confirmation dialog, Attachment list.
5. **Backend changes.** `CandidateService` (read/update) with validation; decode-on-read shim + data-repair job for double-escaped text; `ActivityService` with author-only edit/delete (admins override); timeline read model.
6. **Database changes.** Introduce the **migration tool** (ADR: Phinx or Doctrine Migrations) with a baseline of the upstream schema; add `application_event` (append-only: entity, type, actor type human/automation/system, payload, created_at) populated going forward + backfilled from `candidate_joborder_status_history` and `history`; add FKs where orphan-free.
7. **API changes.** `GET/PATCH /api/v1/candidates/{id}`, `GET /api/v1/candidates/{id}/timeline`, `POST/PATCH/DELETE /api/v1/candidates/{id}/activities`.
8. **Security implications.** Field-level escaping by output; permission checks per action; event log is groundwork for audit (Slice 6).
9. **Tests.** Characterization of legacy edit/save; repair job idempotency; timeline ordering; authz matrix tests; Playwright + axe.
10. **Migration strategy.** Backfill job with dry-run report; legacy show page behind "classic view" flag for one release; repair job reversible (stores originals).
11. **Definition of done.** Profile parity + timeline; no double-escaping on round-trip; migration tool in CI (up/down on fixture DB); gates passed.

### Slice 3 — Configurable pipeline (workflow templates, dispositions, board + list)

1. **User problem.** 11 hard-coded statuses, rejection as statuses without reasons, one status change takes ~8 page loads (UX J3), reports double-count (FEAT-001, FEAT-008, GAP-021).
2. **Product outcome.** Admin-configurable workflow templates with typed stage categories; default "Agency (legacy)" template mapping statuses 100–800 one-to-one; dispositions with required reasons; job pipeline as **board and list** with an accessible "Move to…" menu; status-change side effects preserved (activity, optional e-mail — not pre-checked — event scheduling, openings on Placed).
3. **UX.** `MODERN_ATS_UX_PATTERNS.md` #5, #8; one-dialog stage change preserved from legacy (proven behaviour), now inline.
4. **Frontend components.** Pipeline board (`<oc-pipeline-board>` with keyboard alternative), Pipeline card, Menu, Dialog, Select, Status badge.
5. **Backend changes.** `WorkflowService` (templates, stages, transitions), `ApplicationService.moveStage/disposition` wrapping the legacy side effects (`CandidatesUI::_addActivityChangeStatus` logic extracted with characterization tests), events emitted to `application_event`.
6. **Database changes.** `workflow_template`, `workflow_stage` (category, order), `disposition_reason`; `candidate_joborder` gets `stage_id`, `disposition_id`; legacy `status` column kept in sync during transition.
7. **API changes.** `GET /api/v1/jobs/{id}/pipeline`, `POST /api/v1/applications/{id}/stage`, `POST /api/v1/applications/{id}/disposition`, admin endpoints for templates.
8. **Security implications.** Stage changes authorized per job; audit via events.
9. **Tests.** Characterization of every legacy status side effect (FEATURE_INVENTORY §3); report numbers unchanged for legacy template; board a11y (SC 2.5.7).
10. **Migration strategy.** Map existing statuses → default template; dual-write legacy `status` until reports migrate (Slice 16); flag per install.
11. **Definition of done.** Legacy reports produce identical numbers on fixture data; board + list parity; gates passed.

### Slices 4–21 (planning depth)

| # | 1 User problem | 2 Outcome | 3 UX | 4 Components | 5 Backend | 6 Database | 7 API | 8 Security | 9 Tests | 10 Migration | 11 DoD |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 Job workspace | Job order requires pre-existing company; free-string statuses; `'OnHold'` bug | Job list/detail with typed states, openings, validation (e.g. salary range) | UXP #3/#4 | Data table, Page header, Tabs, Form | `JobService`, state machine | `job_state`, openings table, structured pay range | `/api/v1/jobs` | Job-level authz | State transition tests; stats parity | Map statuses; keep legacy page flag | Parity + gates |
| 5 Search, views, bulk | LIKE/REGEXP search; lost bulk selection | Faceted search, saved views, audited undoable bulk jobs | UXP #6–8 | Command/Search, Filters, Bulk bar, Confirmation | Search index adapter (DB FTS first), bulk job runner | `saved_view`, `bulk_job`; FULLTEXT/FTS | `/api/v1/search`, `/bulk-jobs` | Scope by permission; rate limits | Relevance fixtures; bulk idempotency | Rebuild index job | Gates |
| 6 Roles, teams, audit | One global access level; no audit of reads | Persona roles + job teams + field masks; append-only audit incl. reads/exports | Settings UX, UXP #16 | Permission matrix UI | Policy service used by all new routes; legacy ACL bridge | `role`, `role_permission`, `job_team_member`, `audit_event` | `/api/v1/roles`, `/audit-events` | Core security slice | Authz matrix tests for all routes | Map legacy levels → roles | Gates |
| 7 Privacy | No consent/retention/erasure | Consent per purpose, retention schedules, DSAR export, field-selective anonymisation, legal hold | Admin + candidate record | Forms, Confirmation | Retention jobs (queue), anonymiser | `consent_record`, `retention_policy`, `legal_hold` | `/api/v1/privacy/*` | Special-category handling | Erasure cascade tests | Default policies off; report-only first | Gates |
| 8 Careers & apply | 940 px portal, no search, unsafe identity, no consent | Headless careers API + SSR site, JSON-LD, configurable apply, magic-link status | UXP #20 | Public page templates | Careers API, queued intake, abuse controls | `apply_form_schema` | public `/careers/v1` | Rate limits, captcha hook, no client identity | No-JS apply E2E, a11y | Legacy portal flag; template import | Gates |
| 9 Scheduling | Single-owner events; private leak | Interviews with panels, calendar sync, self-schedule | UXP #9 | Scheduler dialog, calendar picker | Calendar provider abstraction (Google/Microsoft), queue reminders | `interview`, `interview_participant` | `/api/v1/interviews` | OAuth tokens encrypted | Provider mocks | Legacy events remain | Gates |
| 10 Scorecards | One unattributed rating | Kits + blind scorecards + decision | UXP #10 | Scorecard form, summary | `ScorecardService` | `scorecard_template`, `scorecard` | `/api/v1/scorecards` | Blind visibility rules | Visibility tests | Legacy rating kept read-only | Gates |
| 11 Hiring manager | No HM role | Review queue, feedback, mobile-friendly | UXP #1/#21 | Home queue | Task/queue service | `task` | `/api/v1/tasks` | Scoped access | E2E | — | Gates |
| 12 Offers & approvals | No offers/approvals | Approval engine; versioned offers; e-sign hook | UXP #21 | Approval timeline | `ApprovalService`, `OfferService` | `approval_flow`, `offer` | `/api/v1/offers`, `/approvals` | Comp field masks | Approval policy tests | Status 600 mapped | Gates |
| 13 Agency | Submittal/placement as statuses | Submittal events, Placement aggregate, client portal | Agency UX | Client portal pages | `PlacementService`, share links | `submittal`, `placement` | `/api/v1/placements` | OTP links, scoped | Report parity (FEAT-008 fixed) | Backfill from status history | Gates |
| 14 Public API + webhooks | No API | Token API, OpenAPI, signed webhooks | Developer settings | — | Token auth, webhook dispatcher | `api_token`, `webhook_*` | Publish v1 | Scopes, HMAC | Contract tests | — | Gates |
| 15 Integrations | Outbound e-mail only | Connector framework; e-mail/calendar sync; job boards; HRIS events | Settings | — | Connector SPI | `connection` | — | Secret storage | Sandbox tests | — | Gates |
| 16 Analytics | 54 COUNT queries on mutable rows | Metric dictionary, dashboards, export | UXP #14 | Charts | Read models from events | views | `/api/v1/metrics` | Min cell sizes for EEO | Metric fixtures | Legacy reports retired after parity | Gates |
| 17 Automation | Hard-wired side effects | Stage actions, reminders, sequences | Rules UI | Rule builder | Durable queue + rules engine | `automation_rule` | `/api/v1/automation` | No silent auto-reject | Rule tests | — | Gates |
| 18 AI | Resfly liability | Governed AI gateway, parsing, drafting, semantic search | Inline assist | Assist panel | Provider-agnostic gateway, AI audit | `ai_invocation` | internal | Off by default, no auto-decisions | Eval harness | — | Gates + legal review |
| 19–21 Sweeps | Remaining legacy screens | Responsive, WCAG 2.2 AA + ACR, localization | — | — | — | — | — | — | Full a11y audit | Retire legacy assets | ACR published |

## 5. Decisions required (carried forward)
- **Before Slice 1 starts:** D1 upstream relationship (recommended: adopt v0.11.1 baseline, contribute fixes upstream); ADR-UI-001 rendering model (recommended in `docs/design/COMPONENT_ARCHITECTURE.md` §1.3); D5 evolve-vs-rebuild — this plan assumes **evolve upstream code base incrementally** (consistent with the given strategy).
- **Before Slice 2:** migration tool ADR; D6 stack confirmation for PHP-side libraries (router/DI).
- **Before Slice 8/13:** D2 segment priority; D3/D4 hosting & licensing (legal review of 3B).
- **Before Slice 18:** D8 AI stance.

## 6. Risks
| Risk | Mitigation |
|---|---|
| Upstream baseline introduces regressions / destructive migrations (385 deletes attachment files) | Runbook, pre-flight report, backups, fixture-DB migration tests |
| Divergence from upstream | Contribute containment fixes upstream; keep new code in new files under `src/` |
| Scope creep in "touch it, modernize it" | Per-page checklist with explicit out-of-scope log |
| Two UIs coexisting confuse users | Shared app shell from Slice 1; "classic view" links time-boxed to one release |
| No framework runtime limits complex widgets | Custom-element boundary allows a framework inside later (ADR-UI-001) |
| Licence constraints on hosted use | Self-hosted focus; legal review before any hosted offer |
