# OpenCATS 2.0: UI Migration Strategy (strangler for the UI)

**Status:** PROPOSED strategy (Phase 3). It is a specification only: no code has changed in the repository and nothing has been installed.
**Companions:** `DESIGN_TOKENS.md`, `COMPONENT_ARCHITECTURE.md` (ADR-UI-001 rendering model: server-first, custom-element-bounded).
**Inputs:** `docs/audit/UX_UI_AUDIT.md`, `docs/audit/MODERNIZATION_OPPORTUNITIES.md` (MOD-001/002/010/011), `docs/audit/RECOMMENDED_ROADMAP.md` (Phases 1–6), `docs/competitive/MODERN_ATS_UX_PATTERNS.md`, `docs/competitive/DESIGN_TOOLBOX_RESEARCH.md`, `docs/product/*.md`. Also the upstream clone at `d5cf733` (`v0.11.1-9`, 2026-09-21; 176 commits after fork base `d607279`).
**Tags:** [FACT] / [INFERENCE] / [RECOMMENDATION] / [UNKNOWN] / [DECISION].

---

## 0. Premise and scope

- **[FACT, caller constraint]** The UI is modernised **incrementally inside the running PHP application**. Modern components coexist with legacy `.tpl` pages inside one app shell, and pages migrate as vertical slices touch them. There is no big-bang rewrite. This matches `MODERNIZATION_OPPORTUNITIES.md` §1.1 (option B rejected), and roadmap principle 2, "Strangler-fig, not big-bang" (`RECOMMENDED_ROADMAP.md:9`).
- **[INFERENCE]** The same UI strategy works whether decision D5 lands on "evolve upstream in place" or "strangle to a new platform behind a reverse proxy" (`MODERNIZATION_OPPORTUNITIES.md` §1.2):
  - Components are bounded by custom elements and fed by tokens plus JSON contracts (`COMPONENT_ARCHITECTURE.md` §1.3, §6).
  - A page migrated inside the PHP app can later be served by a new platform route with the same shell and components.
- **Out of scope:** backend framework choice (D6), API design beyond UI contracts, data migration.

---

## 1. Starting point that shapes the migration

### 1.1 Fork vs upstream frontend: what changed and what did not

| Aspect | Fork base `d607279` | Upstream `d5cf733` | Migration consequence |
|---|---|---|---|
| jQuery | 1.3.2 in the core `<head>` list (`lib/TemplateUtility.php:1194`) | **Unchanged**: 1.3.2 (`lib/TemplateUtility.php:1304`) | Containment and removal plan applies to both (§3.2) [FACT] |
| Doctype / viewport / `@media` | XHTML 1.0 Transitional; none; 0 | **Unchanged** | The shell must introduce them (§2.3) [FACT] |
| ARIA | 0 `aria-`, 0 `role=` | **0** in `modules/`, `lib/`, `js/` | All a11y comes from new components [FACT] |
| CSRF | None (SEC-004) | Token per session; hidden `csrfToken` injected into POST forms via a `window.onload` chain; global `CATSCsrfToken`; some GET actions converted to POST `button.linkButton` forms (PR #693, `6223ab5`) | New JS must not overwrite `window.onload`; new fetches send the token (`COMPONENT_ARCHITECTURE.md` §1.4, §6) [FACT] |
| Output escaping | Opt-in `$this->_()`; raw MRU, title, quick search (UX-006) | `Template::escapeHtml/Attr/Url/Js/JsAttr` (PRs #697, #761; `lib/Template.php:45-135`); title escaped (`TemplateUtility.php:1290`) | PHP partials use these helpers [FACT] |
| Asset versioning | `?v=<version>` | `TemplateUtility::getVersionedAssetURL()` file-based (PR #749, `d642ff0`) | New CSS and JS assets are versioned through the same helper [FACT] |
| Bulk selection encoding (UX-002) | PHP `serialize` vs `json_decode` mismatch | `serializeArray()` now returns `encodeURIComponent(JSON.stringify(array))` (`js/lib.js:195-208`), and `exportIDs` is JSON-decoded with integer validation (`lib/DataGrid.php:235-258`), in PR #693 | Legacy bulk actions are likely fixed upstream. **[INFERENCE, not runtime-verified]**: confirm with the characterisation tests before relying on it |
| PHP 8 fatal in chrome/lists (UX-008) | Legacy `implode($array, $glue)` | Fixed (upstream requires `php ^8.4.1`, `composer.json:6`; e.g. `lib/DataGrid.php:1308-1340` uses `implode($glue, $array)`) | Prerequisite already satisfied if aligned with upstream (D1) [FACT] |
| AJAX | `ajax.php` XML/HTML | Unchanged (`ajax.php:44,59` `text/xml`) | JSON endpoints are introduced per slice (§6) [FACT] |
| List DataGrids | `ajaxMode = false` | Unchanged (`modules/candidates/dataGrids.php:15`) | No async list behaviour exists to build on [FACT] |
| Removed upstream | n/a | Toolbar and in-app tests modules, licensing, multi-tenant `site` support (#802, #823) | Fewer legacy templates to migrate if aligned [FACT] |

**[RECOMMENDATION]**
- Take decision **D1 (upstream relationship)** before UI slice work starts. If the fork aligns with upstream, the migration base is upstream's `TemplateUtility`, CSRF and escaping, and prerequisites UX-002 and UX-008 are largely resolved.
- If the fork diverges instead, the Phase 1 roadmap items 1A/1C must fix them first.

### 1.2 Legacy UI inventory, which sets the size of the job

- **[FACT]** Counts from `UX_UI_AUDIT.md`:
  - 136 templates; `printTabs` in 82, `printHeaderBlock` in 86;
  - 22 modal templates using `printModalHeader`; 26 `showPopWin(` call sites (grep of `modules/`, `js/`, `lib/`);
  - 340 inline `onclick`, 109 inline `<script>` blocks, 344 global JS functions;
  - 1,065 inline `style=`, 428 `<table>`, 132 `alert()`, 28 `confirm()`;
  - 18 error templates, 13 unreferenced templates.
- **[FACT]** Templates per module in the fork: settings 32, candidates 19, import 15, joborders 10, contacts 9, companies 8, reports 8, careers 6, home 4, login 3, lists 3, calendar 2, activity 2, toolbar 2, wizard 1, tests 1.
- **[FACT]** The chrome has a single choke point. Every full page calls the `TemplateUtility` printers in the same order (`modules/candidates/Add.tpl:5-10`; `UX_UI_AUDIT.md` §1.1). This is what makes a shell-first strangler cheap (§2.2).

---

## 2. Strangler approach for the UI

### 2.1 Shape

```
        ┌──────────────────────────── App Shell (new, oc-) ────────────────────────────┐
        │ skip link · header (logo, global search, help, user menu) · primary nav      │
        │ ┌──────────────────────────── <main id="main"> ────────────────────────────┐ │
        │ │  data-oc-content="modern"            │   data-oc-content="legacy"        │ │
        │ │  page template + oc components       │   unchanged .tpl body (DataGrid,  │ │
        │ │  (migrated slice)                    │   tables, iframe modals, jQuery)  │ │
        │ └──────────────────────────────────────┴───────────────────────────────────┘ │
        │ footer (attribution, version) · toast region · top-layer dialogs             │
        └───────────────────────────────────────────────────────────────────────────────┘
          legacy iframe modals (printModalHeader) stay chrome-less until migrated
```

### 2.2 Mechanism: the shell arrives through the existing printers [RECOMMENDATION]

1. **Adapter, not template edits.** Re-implement `printHeader`, `printHeaderBlock`, `printTabs`, `printQuickSearch` and `printFooter` (and `_printCommonHeader`) as adapters. Behind a feature flag they emit the new shell's opening and closing markup, and the legacy body content lands inside `<main data-oc-content="legacy">`.
   - All ~82–86 full-page templates get the shell **without editing them**.
   - Where templates open `<div id="main">`/`<div id="contents">` themselves between printer calls (`candidates/Add.tpl:5-10`), the adapter must keep those IDs, because legacy CSS and JS reference `#main`/`#contents` (`main.css:97-130`).
2. **Modal templates are left alone.** `printModalHeader` documents render inside the legacy iframe (`lib/TemplateUtility.php:79-89`, `543-560`). They do not get the shell. A modal is migrated together with the page flow that opens it (§4.3).
3. **Flags.**
   - `ui.shell`: global, with per-user opt-in during beta.
   - `ui.page.<module>.<action>`: per migrated page, choosing the modern template instead of the legacy `.tpl`.
   - A kill switch restores legacy printers instantly.
   - Flags are evaluated server-side. Stored as config or DB settings **[DECISION]**; not in `config.php` code rewriting (MOD-013).
4. **Routing stays `index.php?m=&a=`.** A migrated page is the same route with a new template, or a new route when the platform ADR introduces one, with the old route redirecting (301 for GET, preserving query). Deep links, bookmarks and MRU entries keep working.
5. **Careers is a separate shell.** The public careers site gets its own server-rendered shell, "OpenCATS Responsive" (`DESIGN_TOKENS.md` §10). Existing DB-stored templates keep rendering through `modules/careers/Blank.tpl` until each site opts in (`UX_UI_AUDIT.md` Unknown #5).

### 2.3 Document-level changes the shell introduces (with risks)

| Change | Why | Risk in legacy mode | Rule [RECOMMENDATION] |
|---|---|---|---|
| `<!DOCTYPE html>` replaces XHTML 1.0 Transitional (`TemplateUtility.php:1178-1180`) | Standards mode; `<dialog>`, `popover` and custom elements behave per spec | **[INFERENCE]** The full XHTML Transitional doctype with system identifier currently triggers "almost standards" mode. Full standards mode changes line-height handling of images inside table cells, which may add gaps in the 428 layout tables with GIF icons | Switch on the global flag only after coexistence visual snapshots (`COMPONENT_ARCHITECTURE.md` §8). Mitigation lives in the `legacy` layer (`img { vertical-align: middle }` scoped to `[data-oc-content=legacy]`) |
| `<meta name="viewport" content="width=device-width, initial-scale=1">` | Responsive shell (UX-001) | Fixed-width legacy bodies (tab bar `80em`, 650 px blocks, DataGrid pixel widths; `main.css:148,325`; `DataGrid.php:2640`) would overflow on phones | Emit the viewport tag **only** when `data-oc-content="modern"`. Legacy pages keep today's desktop-virtual-viewport behaviour on phones. On desktop, the legacy region gets `overflow-x: auto` inside the shell |
| `lang` and `dir` on `<html>` | 3.1.1; RTL readiness | None | Always |
| CSS via `<link>` in declared cascade layers | Isolation (§3.1) and removal of serial `@import` | Legacy CSS priority changes (§3.1) | Behind `ui.shell` |
| One deferred `<script type="module">` | Components (`COMPONENT_ARCHITECTURE.md` §1.4) | Legacy sync scripts still load first; no interaction if the rules in §3.2 hold | Always on shell pages |

---

## 3. Coexistence rules

### 3.1 CSS isolation [RECOMMENDATION]

1. **Cascade layers, declared once in the shell `<head>`:**
   `@layer legacy, oc.reset, oc.tokens, oc.base, oc.components, oc.patterns, oc.utilities;`
   - `main.css` and module CSS (`modules/*/*.css`, `not-ie.css`) load **into `legacy`**, e.g. `@import url("main.css?v=…") layer(legacy);`. The legacy head already uses `@import` (`TemplateUtility.php:1211`; upstream `:1397`), so this is a one-line change per include in the adapter.
   - Layer order beats specificity. `oc-` rules therefore win over legacy ID selectors such as `#main` and `#header ul#secondary li a` (`main.css:97,215`) wherever both apply, with no specificity wars.
   - **[FACT]** `main.css` has 3 `!important` declarations (`main.css:105,116,945`). Inside a layer, `!important` inverts priority, so legacy important declarations would beat `oc-` normal *and* important declarations for the same property on the same element. These three are IE height hacks and a transparent background for the popup, and they must be reviewed. **[RECOMMENDATION]** Delete the two IE `height: auto !important` hacks when IE CSS is retired (MOD-016).
   - **Browser support:** layered `@import` requires an evergreen browser. Older engines drop the rule, and legacy styling with it. **[DECISION]** Support policy is "current and previous major of evergreen browsers"; IE hacks are retired (`MODERNIZATION_OPPORTUNITIES.md` §2.4).
2. **Legacy → modern leakage.** Legacy has global element selectors: `body` (`main.css:32`), `p, li, blockquote` (`:38`), `form` (`:46`), `h2` (`:52`), `td` (`:69`), `pre` (`:74`) and `a:link/visited/hover` (`:79-91`, including `text-decoration:none` and fixed 12 px fonts). The `oc.reset` layer resets *exactly these properties* inside modern regions: `:where([data-oc-content=modern], .oc-root) :is(p, li, td, a, h2, form, pre) { font: inherit; color: inherit; margin: revert; text-decoration: revert }`. Components then style themselves from tokens.
3. **Modern → legacy leakage.**
   - New CSS never uses bare element or ID selectors.
   - Every rule targets `.oc-*` classes, `oc-*` elements or `[data-oc-*]` attributes.
   - Base typography applies only under `[data-oc-content=modern]` or `.oc-root`.
   - Tokens on `:root` are inert for legacy CSS, which does not reference them.
4. **Inline styles.** The 1,065 legacy inline `style=` attributes still beat all layers. **Rule:** no `oc-` component is rendered *inside* legacy markup that carries inline layout styles. Components replace whole regions, not fragments inside a legacy table cell.
5. **Legacy region theme.** A legacy region is always light theme and uses legacy fonts. The shell sets `data-oc-theme="light"` on pages with any legacy content (`DESIGN_TOKENS.md` §3.4).
6. **Lint.** A stylelint config applies to `oc-` files only: no hex, no px outside tokens, no physical properties, no bare element selectors. Legacy files are excluded and frozen (§4.4).

### 3.2 JavaScript loading and legacy jQuery containment [RECOMMENDATION]

1. **Load order.** Legacy core scripts stay synchronous in `<head>` while legacy content exists. They are `lib.js`, `quickAction.js`, `calendarDateInput.js`, `subModal.js` and jQuery 1.3.2 (`TemplateUtility.php:1189-1195`). New code is **one** `<script type="module" src="…/oc-components.js">`, which is deferred and has its own module scope. It is versioned with `getVersionedAssetURL` (upstream).
2. **No shared globals.**
   - New code defines no globals.
   - A single frozen **bridge** object `window.OCBridge` is the only sanctioned legacy → modern entry point, e.g. `OCBridge.openDialog(id)`, `OCBridge.toast(msg)` and `OCBridge.refreshRegion(id)`. It exists so a legacy inline `onclick` can open a new dialog during partial migration.
   - Every bridge method records its callers in a comment registry and is deleted when the last legacy caller is gone.
   - Modern code never calls legacy globals, with one exception: reading `CATSCsrfToken` until the shell's `<meta name="csrf-token">` replaces it.
3. **No single-slot global handlers.**
   - New code must not assign `window.onload`, `document.onkeypress`, `document.onmouseup` or `document.onmousemove`. Legacy owns them (`js/dataGrid.js:679-681`, `js/submodal/subModal.js:94`), and upstream's CSRF injection is chained on `window.onload` (`TemplateUtility.php:1366-1375` @ `d5cf733`).
   - New code uses `addEventListener` only.
   - **Consequence:** pages that load `js/dataGrid.js` (legacy lists) must not host new drag interactions until the DataGrid is replaced on that page.
4. **Legacy modal interplay.**
   - `subModal.js` rewrites `tabindex` to −1 on parent-page elements while open and restores them after (`subModal.js:275-320`). This will include shell controls. **[INFERENCE]** This is acceptable, because the shell regains focusability on close.
   - Rule: a new `<dialog>` must not be opened while a legacy iframe modal is open, and vice versa. The bridge refuses and logs.
   - Top-layer dialogs sit above legacy `z-index` 200–99999 (`DESIGN_TOKENS.md` §8).
5. **jQuery 1.3.2 containment and removal.**
   - **[FACT]** jQuery is loaded on every page but used at only ~7 call sites: `js/emailHandler.js:183,198`, `modules/settings/tags.tpl:38-68` and `modules/settings/EmailTemplates.tpl:22` (`UX_UI_AUDIT.md` §4). Publicly known advisories affect versions below 3.5 (external knowledge, as stated in the audit).
   - **Step 1 (immediately, independent of slices):** lint ban. `oc-` code and any *touched* legacy file may not add `$(`/`jQuery` usage.
   - **Step 2 (early quick win):** rewrite the ~7 call sites with DOM/`fetch` APIs, then drop jQuery from the core script list. **[RECOMMENDATION]** Do this before any slice. It is small, removes a known-vulnerable library for the whole app, and nothing else depends on it. **[UNKNOWN]** Plugins or deployment hooks (`Hooks::get` eval points; `UX_UI_AUDIT.md` Unknown #8) may use jQuery. Announce the removal in release notes.
   - Until Step 2 lands, never upgrade jQuery in place. A 1.3 → 3.x jump would break legacy behaviour and gains nothing, since new code does not use it.
6. **Other legacy libraries.** `calendarDateInput.js`, `sweetTitles.js`, `sorttable.js`, `suggest.js`, `quickAction.js` and `subModal.js` are removed **per page** as their replacements land (§7). They are removed from the global head list only when no remaining legacy page uses them.
7. **CSP ratchet.**
   - Legacy needs `'unsafe-inline'` and `'unsafe-eval'` (`execJS`, `DateInput`, inline handlers; UX-016).
   - Start with a *report-only* strict policy using nonces for new scripts.
   - Enforce a strict per-route CSP on routes whose rendered page contains no legacy inline script. The metric is in §8.

### 3.3 Server-side coexistence [RECOMMENDATION]

- **Partials location [DECISION].** Proposed: `src/OpenCATS/UI/Components/` (PSR-4, next to the existing `src/OpenCATS/UI/QuickActionMenu.php`) for PHP rendering helpers, plus `templates/oc/` for markup, outside `modules/`.
- **Escaping.** Every partial escapes through `Template::escape*` (upstream). The pages it serves must never pass pre-escaped data. This is the "store raw, escape on output" rule of UX-003, and the migration must include a data fix for double-escaped rows in touched tables.
- **Whitespace filter.** `Template::display()` strips leading whitespace on every line unless the output contains `textarea` or `<!-- NOSPACEFILTER -->` (`lib/Template.php:117-120`). This can alter `<pre>` content and JSON in `<script type="application/json">`. The modern page template emits `<!-- NOSPACEFILTER -->`, or the filter is bypassed for modern pages.
- **Template engine.** If the auto-escaping engine ADR (Twig or Plates; `UX_UI_AUDIT.md` §12.2 item 4) is accepted, `templates/oc/` partials are written in it first. Legacy `.tpl` stays raw PHP until migrated.
- **i18n.** Every new string goes through a translation function and catalog from day one, even when English-only (T42). Legacy strings are untouched until their page migrates.

---

## 4. "Touch it, modernise it" rules and scope limits

### 4.1 Levels of modernisation per touched page [RECOMMENDATION]

| Level | Trigger | Required | Not required |
|---|---|---|---|
| **T0 Touched** | Bug fix or small change in a legacy template or its JS | (a) No new inline `style=`, `onclick=`, `javascript:`, `alert()`, `confirm()`, `document.write`, positive `tabindex` or jQuery. (b) Every line changed escapes output with `Template::escape*`. (c) Fix a11y defects **on the lines changed** (label `for`, `alt`, button semantics). (d) GET → POST for any state change touched (upstream `linkButton` pattern). (e) Characterisation test for the behaviour changed | Visual redesign; shell changes |
| **T1 Region modernised** | A slice changes behaviour of one region (e.g. the pipeline block on a Show page) | T0, plus: the whole region replaced by `oc-` components/partials rendered in a modern sub-region (`<div data-oc-content="modern">`); its modal flow migrated with it (§4.3); JSON contract for the region's data (`COMPONENT_ARCHITECTURE.md` §6); axe clean *for the region* | Rest of page |
| **T2 Page migrated** | A slice owns the page | Full per-page checklist (§5), `ui.page.*` flag, legacy template kept as fallback until removal (§7) | n/a |

### 4.2 Scope limits (to protect slice delivery) [RECOMMENDATION]

- **Budget.** Modernisation triggered by a T0/T1 touch is capped at roughly **one region or ≤ 30% of the slice estimate**, whichever is smaller. Anything larger becomes its own backlog item, linked from the slice.
- **No hidden cross-module refactors.** A candidate slice does not restyle Settings.
- **No modernising pages slated for deletion.** These include the 13 unreferenced templates, the toolbar and the `tests` module (`UX_UI_AUDIT.md` §1.6; upstream already removed toolbar and tests). Delete them instead.
- **No behaviour change without a characterisation test.** This applies in particular to status-change side effects (`CandidatesUI.php:2900-3302`), careers apply, and report counts (`MODERNIZATION_OPPORTUNITIES.md` §2.1).
- **Careers custom templates** in `career_portal_template_site` are never edited by migration. Admins opt into the new template.
- **IA changes** (nav consolidation, agency vs corporate mode) are product decisions (D2), not slice side effects. The nav initially mirrors `$coreModules`.

### 4.3 Coupled units that must migrate together

| Unit | Members | Why |
|---|---|---|
| Pipeline status flow | `joborders/Show.tpl` pipeline block, `candidates/Show.tpl:529-531`, `AddActivityChangeStatusModal.tpl`, `js/activity.js`, `ajax/getPipelineJobOrder.php`, `js/pipeline.js`, `JobOrdersUI.php:1459-1467` duplicate dialog logic | One behaviour with legacy duplicates (DEBT-007); a half-migration would fork the side effects |
| Consider / add-to-pipeline | `candidates/ConsiderSearchModal.tpl`, `joborders/ConsiderSearchModal.tpl`, `addCandidateModal` | Iframe modal closing reloads the parent (`subModal.js:252-258`) |
| List + bulk actions | Module list `.tpl`, `dataGrids.php`, DataGrid action area, `lists/QuickActionAddToListModal.tpl`, export | Selection semantics (UX-002) must be identical across actions |
| Company autocomplete | `js/suggest.js`, `joborders/Add.tpl:53-75`, `ajax` company lookup | Shared combobox engine; the key-48 bug (`suggest.js:472-477`) |
| Error handling for a module | Module `Error.tpl`/`ErrorModal.tpl` + controller `CommonErrors::fatal` paths | Validation must re-render forms instead of fatal pages (UX-013) |

### 4.4 Ratchet (prevent regression while legacy remains) [RECOMMENDATION]

A CI script counts, **per file**, the inline `style=`, `onclick=`/`on*=`, `javascript:`, `alert(`, `confirm(`, positive `tabindex`, `<img` without `alt`, `$(`/`jQuery` and raw `echo $` of variables in templates. Counts may only go down. The baselines come from the audit's grep counts, frozen at the migration start commit.

---

## 5. Per-page migration checklist (definition of "T2 migrated")

Copy this into the slice's PR description. Every item needs evidence: a link to a test, a screenshot or a file:line.

| # | Area | Check |
|---|---|---|
| 1 | **Legacy UI** | Page renders in the shell in `modern` mode; no `printHeaderBlock`/`printTabs` legacy markup; one `<h1>`; Page Header partial; no layout `<table>`; no inline `style=`; no raster text or icons (SVG sprite, `currentColor`); empty states are real text |
| 2 | **Old JS** | No inline handlers or `<script>` blocks in the template; no global functions added; no jQuery, `document.write`, `eval` or `execJS`; legacy libs used by this page listed and, if last user, scheduled for removal (§7) |
| 3 | **Obsolete components** | subModal iframe → `oc-dialog`/`oc-drawer`; `window.open` popups → page, dialog or new tab only for documents; `DateInput` → native date input; `sorttable`/DataGrid → `oc-data-table`; Sweet Titles → tooltip; `alert`/`confirm` → toast, inline error or alert dialog |
| 4 | **Accessibility** | axe: 0 violations (WCAG 2.2 A/AA rules) authenticated with realistic data; keyboard-only walkthrough of every action; SR pass (NVDA or VoiceOver) of the primary task; landmarks and skip link; focus return after dialogs; live-region announcements for async results; 24 px targets; no colour-only meaning; 200%/400% zoom; forced-colours screenshot |
| 5 | **Responsive** | No horizontal page scroll at 320 px (tables scroll within their region); touch targets 44 px under `pointer: coarse`; tested at 320 / 768 / 1280 |
| 6 | **Duplicated logic** | Server logic for the page's actions exists **once** in a service called by both the legacy route (while it exists) and the new contract; duplicated JS validators (per-module `validator.js`) replaced by the shared form-row and validation schema; copy-pasted helpers (e.g. `insertAtCursor`, `CareerPortalTemplateEdit.tpl:19-40` / `EmailTemplates.tpl:40-60`) consolidated |
| 7 | **API structure** | Data for the page comes from a JSON endpoint following `COMPONENT_ARCHITECTURE.md` §6 (versioned, cursor pagination, `can` flags, problem-details errors), documented in OpenAPI (T38). No XML `ajax.php` or HTML-fragment-with-script responses for new behaviour; legacy `ajax/` handlers used by the page listed for retirement |
| 8 | **Validation** | Server-authoritative validation; field-level errors with preserved input; error summary; no `CommonErrors::fatal` for user-correctable input; raw storage with escape-on-output (UX-003), including a data fix for rows touched by the page; client validation mirrors server rules |
| 9 | **Permissions** | Every action checked server-side in the service/API (not only hidden in UI); nav and actions derived from `can` flags; masked fields show "Hidden"; tested with the lowest role that may view the page and a role that may not (403 page, not blank) |
| 10 | **Security** | CSRF on every state change (POST/DELETE + token); no GET mutations; output escaped via helpers; no new inline script (CSP-ready); uploads per MOD-008 when present |
| 11 | **i18n / locale** | All strings via catalog; `Intl`/ICU dates, numbers and currency; ISO dates in API; 12/24-hour per user setting (upstream #812); no US-only field assumptions added (country per upstream #742); logical CSS properties |
| 12 | **Performance** | No unbounded queries (paginate); JS for the page ≤ agreed budget (proposed ≤ 50 KB gzip excluding shared `oc-components.js`); no serial `@import`; skeletons for first load; interaction in place, no full reload after dialog save |
| 13 | **Tests** | Characterisation tests of legacy behaviour passed *before* the switch; E2E journey test on the modern page; component catalog entries updated; visual baselines approved |
| 14 | **Docs and flags** | `ui.page.*` flag, rollback tested; release note; legacy template marked `@deprecated` with removal criteria (§7) |

---

## 6. Migration order aligned with vertical slices

**[RECOMMENDATION]** The order is driven by (1) shared infrastructure first, (2) risk and legal exposure, (3) frequency of recruiter use (journeys J1–J3), and (4) reuse: the first list and detail pages produce the patterns later pages consume. It maps onto `RECOMMENDED_ROADMAP.md` Phases 1–5. Durations are not estimated here; team size is [UNKNOWN].

| Wave | Slice | Pages / surfaces (legacy files) | Components built or proven | Prerequisites |
|---|---|---|---|---|
| **W0 Foundations** (Phase 1, parallel to 1B/1C) | UI platform | Tokens (`DESIGN_TOKENS.md`); cascade-layer head; `oc-components.js` loader; bridge; CSS/JS lint and ratchet (§4.4); catalog skeleton; jQuery call-site removal (§3.2.5); delete dead templates (§4.2) | Primitives, Button, Status badge, Form row, Empty/Error/Loading partials | D1 decided; ADR-UI-001 proposed; characterisation tests for J1–J4 (roadmap 1B-3) |
| **W1 Shell** | App shell for all pages (legacy mode) | `TemplateUtility` printers as adapters (§2.2); `login/Login.tpl` fully migrated (UX-022; accessible auth SC 3.3.8); unified error pages replacing 18 `Error.tpl` for non-validation errors | App Shell, Navigation, Page Header, global Search (combobox), Toast region, Dialog | W0; coexistence visual snapshots |
| **W2 Candidate list** | Candidates list + search results | `candidates/Candidates.tpl`, `candidates/dataGrids.php`, `home/SearchEverything.tpl`, Add-to-list modal | Data Table, Filters, bulk bar with server-side selection model, saved views, column manager | First JSON list endpoint (roadmap 1F-8 conventions) |
| **W3 Candidate detail + status flow** | Candidate profile and pipeline status change | `candidates/Show.tpl`, `AddActivityChangeStatusModal.tpl`, `ConsiderSearchModal.tpl`, attachment delete confirmations | Tabs, Drawer (status flow with default-off e-mail), Confirmations (POST), Candidate card, timeline v0 | Status side effects characterised (`CandidatesUI.php:2900-3302`) |
| **W4 Candidate forms** | Add and edit candidate | `candidates/Add.tpl`, `Edit.tpl`, `js/candidate.js`, `candidates/validator.js`, duplicate check (`ajax/getCandidateIdByEmail.php`) | Form controls (date, combobox, file), error summary, duplicate warning pattern | UX-003 data fix plan; EEO options fixed (UX-004) |
| **W5 Jobs + pipeline board** | Job order list, detail, add/edit, pipeline board | `joborders/JobOrders.tpl`, `Show.tpl`, `Add.tpl`/`Edit.tpl`/`AddModalPopup.tpl`, `ajax/getPipelineJobOrder.php`, `js/pipeline.js` | Pipeline card and board with "Move to…" menu; list/board parity; inline "create company" in combobox | W2–W4 patterns; workflow default template (T15) if available, else legacy statuses |
| **W6 Careers (parallel track after W0)** | Public careers site | `modules/careers/*`, `careers/index.php`, `Blank.tpl`, DB templates, questionnaire (`settings/CareerPortalQuestionnaireShow.tpl`) | Careers shell, brand theming + contrast validator, job search and filters (server-rendered), apply form (no-JS complete, `autocomplete` tokens), questionnaire fieldsets | Security items SEC-024/UX-007 (identity), consent (T8). Runs in parallel because it has its own shell and is CRITICAL for legal and conversion (`MODERN_ATS_UX_PATTERNS.md` #20, #22) |
| **W7 Companies and contacts** | CRM objects | `companies/*`, `contacts/*` (incl. `ColdCallList`, vCard) | Reuse only: list, detail, forms | W2–W4 |
| **W8 Home, activities, lists, calendar** | Daily work surfaces | `home/Home.tpl` → role-aware home (T25); `activity/ActivityDataGrid.tpl`; `lists/*`; `calendar/Calendar.tpl` (+ `CalendarUI.js`) | Action-queue pattern; Command palette (P2) | Notification and task backend; scheduling design (T22) |
| **W9 Reports, settings, import** | Admin and analytics | `reports/*` (needs MOD-017 read model); `settings/*` (32 templates, the largest set, low frequency); `import/*` | Settings page template; chart component (library decision) | MOD-017; decisions on rich text (UX-018) and charts |

**Notes:**
- **[INFERENCE]** W2 before W3 because the list is the entry point to every journey and proves the hardest component (the table) early. W3 before W5 because the status flow is shared, and building it on the candidate side first de-risks the board.
- **[RECOMMENDATION]** If D5 moves recruiting-core slices to a new platform (roadmap Phase 3), W2–W5 are the pages that move. The same shell and components serve both, so the order is unchanged.

---

## 7. Removal criteria for legacy assets

**[RECOMMENDATION]** A legacy asset is deleted only when **all** of the following hold:

1. **No references.** A grep across `modules/`, `lib/`, `js/`, `src/`, `careers/`, `index.php`, `ajax/`, DB-stored templates (`career_portal_template*`, e-mail templates) and `Hooks` eval strings finds 0 references (the audit method, `UX_UI_AUDIT.md` §1.6).
2. **No traffic.** Access logs show 0 hits on the legacy route or asset for ≥ 1 full release cycle after the flag defaulted to modern.
3. **Rollback window closed.** The `ui.page.*` flag has been "modern by default" for ≥ 1 release with no rollback, and the characterisation and E2E suites pass without the legacy path.
4. **Data compatibility.** Any stored format the asset produced has been migrated, e.g. PHP-serialized `user.column_preferences` to JSON (`db/cats_schema.sql:1085`), or double-escaped text (UX-003).
5. **Announced.** Release notes list removed templates and JS globals, for plugin and hook authors.

| Asset | Removable when |
|---|---|
| `js/jquery-1.3.2.min.js` | ~7 call sites rewritten (§3.2.5): **earliest, W0** |
| Dead templates (13), toolbar, `getFirefoxModal.tpl`, `ie.css`/`not-ie.css`, `lib/BrowserDetection.php` UI use | W0 (already removed upstream for toolbar and tests) |
| `js/submodal/*`, `printModalHeader`, `printPopupContainer` | Last `showPopWin(` caller migrated (26 sites; last expected W9 settings) |
| `lib/DataGrid.php`, `js/dataGrid.js`, `js/dataGridFilters.js`, `lib/datagrid/FilterArea.tpl`, `ajax/setColumnWidth.php` | Last list migrated (W9) and column preferences converted |
| `js/sorttable.js` | Last `class="sortable"` table (31) gone |
| `js/calendarDateInput.js` | Last `DateInput(` call (10 template sites + `lib/ExtraFields.php:680,870`) gone |
| `js/suggest.js`, `js/quickAction.js`, `src/OpenCATS/UI/*QuickActionMenu.php` | Combobox and menu adopted on all pages using them |
| `js/sweetTitles.js` | Last `title`-tooltip use migrated |
| `images/tabs/*`, `images/nodata/*`, careers image buttons, `indicator*.gif` | Shell (W1), list empty states (W2/W5/W7), careers (W6) |
| Legacy `TemplateUtility` printers | All full pages in modern mode (end of W9). Until then they are adapters |
| 18 `Error.tpl`/`ErrorModal.tpl` | Error pages (W1) + per-module validation migration |
| `main.css` | All pages migrated. Before that, dead selectors are pruned as their last users go, detected by CSS-coverage runs in E2E |

---

## 8. Metrics

| Metric | Baseline [FACT] | Direction / target [RECOMMENDATION] |
|---|---|---|
| Pages in modern mode / total full-page templates | 0 / ~86 | ↑; report per module |
| axe violations on migrated routes | n/a | 0 (gate) |
| axe violations on legacy routes (report-only) | Not yet measured (no axe run possible in Phase 0; `UX_UI_AUDIT.md` Unknown #6) | ↓ monotonically |
| ARIA / landmark presence | 0 `aria-`, 0 `role=` | Landmarks on 100% of shell pages at W1 |
| Contrast failures in rendered pages | Pairs down to 1.37:1 (`UX_UI_AUDIT.md` §6) | 0 on migrated pages |
| Ratchet counts (§4.4): inline `style=`, `onclick`, `alert`, `confirm`, positive `tabindex`, `<img>` without `alt`, jQuery sites | 1,065 / 340 / 132 JS + 5 tpl / 28 / 101 / 108 / ~7 | ↓ only; jQuery 0 at W0 |
| Page loads per journey | J1: 4–6; J2: 5; J3: ~8 loads, 12+ clicks; J4: 5–8 (`UX_UI_AUDIT.md` §2) | J3 ≤ 2 loads (in-place drawer); J4 mobile-complete with ≤ 3 steps (`OPEN_CATS_2_PRODUCT_DIRECTION.md` §10) |
| Core JS/CSS payload on every page | 165,131 bytes uncompressed (`UX_UI_AUDIT.md` §4) | Shell pages: legacy libs removed as last users go; `oc-components.js` budget (proposed ≤ 60 KB gzip) |
| Routes under enforced strict CSP | 0 | ↑ |
| Legacy-mode fallbacks triggered (flag rollbacks) | n/a | Tracked per release; target 0 after one release per page |
| Careers apply completion on mobile | Unknown (no analytics) | Instrument (privacy-respecting, self-hosted, opt-in) and measure drop-off per step |
| Component catalog coverage | 0 | 100% of components used in production have stable entries |

---

## 9. Risks

| # | Risk | Likelihood / impact [INFERENCE] | Mitigation [RECOMMENDATION] |
|---|---|---|---|
| R1 | **Legacy CSS leaks** into components (global `a`, `td`, `p` rules) or `oc-` CSS breaks legacy pages | High / Medium | Cascade layers + `oc.reset` + scoping (§3.1); coexistence visual snapshots on legacy pages (`COMPONENT_ARCHITECTURE.md` §8) |
| R2 | **Doctype switch** changes legacy rendering (almost-standards → standards) | Medium / Medium | Flagged rollout; snapshots of representative pages; scoped legacy-layer mitigations (§2.3) |
| R3 | **Global JS collisions** (single-slot `window.onload`, `document.on*`) silently break CSRF injection or DataGrid drag | Medium / High (security) | §3.2 rules; lint for `window.onload =` and `document.on\w+ =` in new code; E2E test that legacy POST forms still carry `csrfToken` on shell pages |
| R4 | **Half-migrated flows** (new page opens a legacy iframe modal that reloads the parent) | High / Medium | Coupled units migrate together (§4.3); bridge refuses mixed dialogs |
| R5 | **Two-path behaviour drift** (legacy route and new contract diverge) | Medium / High (data correctness) | One service per action (§5 item 6); characterisation tests; flag windows kept short |
| R6 | **Scope creep** from "touch it, modernise it" slows slices | Medium / Medium | Level definitions and budget cap (§4.1–4.2) |
| R7 | **Stack ADR delay** blocks islands | Medium / Low (by design) | Server-first plus vanilla custom elements need no framework decision (`COMPONENT_ARCHITECTURE.md` §1.3) |
| R8 | **Astryx churn / beta** if trialled | Medium / Medium | Only behind one custom-element boundary; TRIAL exit criteria; not adopted while 0.x (`DESIGN_TOOLBOX_RESEARCH.md` §1.8) |
| R9 | **Upstream divergence**: fork and upstream both edit `TemplateUtility.php` (upstream +436/−? lines since the fork base) | High if D1 undecided / High | Decide D1 first (§1.1); shell adapters contributed upstream if aligned |
| R10 | **Plugins and hooks** (`Hooks::get` eval points) depend on legacy markup, jQuery or globals | Unknown / Medium | Inventory deployments' hooks (`UX_UI_AUDIT.md` Unknown #8); announce removals (§7 item 5) |
| R11 | **Custom careers templates** break under the new shell | Medium / High (applications lost) | Opt-in per site; legacy template mode retained; regression tests against real stored templates (`UX_UI_AUDIT.md` Unknown #5) |
| R12 | **Accessibility regressions hidden by automated passes** | Medium / High (legal: ADA/EAA) | Manual AT passes are a gate for T2 (§5 item 4); an independent audit before publishing the ACR |
| R13 | **Agent-tool supply chain** (design skills with hooks or remote instructions) alters UI code or repo config | Low–Medium / Medium | Governance in `COMPONENT_ARCHITECTURE.md` §10 (pinned, vendored, no hooks, no PII) |
| R14 | **Old browsers** in customer environments drop layered CSS | Low / High for affected users | Published browser support policy; detection banner on unsupported engines |

---

## 10. Facts vs recommendations

- **FACT:** fork and upstream frontend state and diffs (commit SHAs `6223ab5` #693, `d642ff0` #749, #697, #761, #742, #812, #802, #823; upstream `js/lib.js:195-208`, `lib/DataGrid.php:235-258,1308-1340`, `lib/TemplateUtility.php:1290,1304,1366-1375`, `ajax.php:44,59`); legacy counts and file references (from `UX_UI_AUDIT.md`, re-checked where cited); global element selectors and `!important` lines in `main.css`; single-slot handler assignments in `js/dataGrid.js:679-681` and `subModal.js:94`; roadmap phase contents.
- **INFERENCE:** doctype rendering-mode effect; that upstream fixed UX-002 end to end (code read, not run); risk likelihoods; the rationale for wave ordering.
- **RECOMMENDATION:** everything else: shell adapter mechanism, coexistence rules, levels and budgets, checklist, wave order, removal criteria, metrics.

## 11. Unknowns / decisions

- **D1** upstream relationship: decides the migration base (§1.1).
- **ADR-UI-001** rendering model; **D6** stack; **D10** design system and brand.
- Flag storage and rollout tooling; partial locations; template engine ADR.
- Browser support policy (§3.1).
- Team size, which sets wave durations (not estimated).
- Plugin and hook usage in real deployments (R10).
- Real traffic data to prioritise W7–W9 (`MODERNIZATION_OPPORTUNITIES.md` Unknowns: "Which legacy features are actually used").
