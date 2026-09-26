# OpenCATS 2.0: Component Architecture Specification

**Status:** PROPOSED specification (Phase 3). It contains no code: no component, library or tool has been added to the repository or installed.
**Companions:** `DESIGN_TOKENS.md` (the visual contract), `UI_MIGRATION_STRATEGY.md` (how components enter legacy pages).
**Inputs:** `docs/audit/UX_UI_AUDIT.md`, `docs/audit/MODERNIZATION_OPPORTUNITIES.md` (MOD-010/011, §1.2 stack ADR), `docs/competitive/MODERN_ATS_UX_PATTERNS.md`, `docs/competitive/DESIGN_TOOLBOX_RESEARCH.md`, `docs/product/*.md`. It also draws on the upstream OpenCATS clone at `d5cf733` (`v0.11.1-9`, 2026-09-21), which is 176 commits ahead of fork base `d607279`.
**Tags:** [FACT] / [INFERENCE] / [RECOMMENDATION] / [UNKNOWN] / [DECISION].

---

## 0. Constraint this architecture is designed for

**[FACT, caller constraint for Phase 3]** Modernisation is **incremental inside the existing PHP application**, not a big-bang rewrite. New components must coexist with legacy `.tpl` pages inside the same app shell, page by page, as vertical slices touch areas.

This is consistent with the strangler direction in `MODERNIZATION_OPPORTUNITIES.md` §1.1–1.2 (option C; option B "big-bang rewrite" is explicitly not recommended). Decision D5 "evolve vs rebuild" (`OPEN_CATS_2_PRODUCT_DIRECTION.md` §9) remains open. **[INFERENCE]** A component system that works inside legacy PHP pages *and* can be lifted into a new platform later serves both outcomes of D5.

**What the legacy runtime looks like (why the choice matters) [FACT]:**
- Templates are raw PHP includes. `Template::display()` buffers the output, strips leading whitespace from every line unless the page contains a `textarea` or a `<!-- NOSPACEFILTER -->` marker, then `eval`s filters (`lib/Template.php:98-127`).
- The chrome is string-built by `TemplateUtility` static printers (`lib/TemplateUtility.php:64-852`). The `<head>` loads 5 synchronous scripts including **jQuery 1.3.2** and uses `@import` CSS (`:1178-1216`).
- There are 344 global JS functions, 340 inline `onclick` handlers and 109 inline `<script>` blocks. `eval` of AJAX HTML happens via `execJS` (`UX_UI_AUDIT.md` §4).
- `js/dataGrid.js:679-681` assigns `document.onmouseup` and `document.onmousemove`, and `js/submodal/subModal.js:94` assigns `document.onkeypress`. These are global single-slot handlers.
- **Upstream has not changed the stack** (verified at `d5cf733`):
  - still `js/jquery-1.3.2.min.js` in the core list (`lib/TemplateUtility.php:1304`);
  - still XHTML 1.0 Transitional, no viewport, no `@media`, 0 `aria-`/`role=` in `modules`, `lib`, `js`;
  - `ajax.php` still returns `text/xml` (`ajax.php:44,59`);
  - list DataGrids are still `ajaxMode = false` (`modules/candidates/dataGrids.php:15`);
  - no `package.json`.
- **What upstream did change** in the frontend:
  - CSRF tokens (PR #693, `6223ab5`): a global `CATSCsrfToken`, plus an inline `catsInjectCSRFToken()` chained through `window.onload` (`lib/TemplateUtility.php:1311-1376`), and `button.linkButton` POST buttons replacing some GET links (`modules/joborders/Show.tpl:344-365`);
  - escaping helpers `Template::escapeHtml/escapeAttr/escapeUrl/escapeJs/escapeJsAttr` (PRs #697, #761; `lib/Template.php:45-135`);
  - file-based asset versioning `TemplateUtility::getVersionedAssetURL()` (PR #749, `d642ff0`);
  - 12/24-hour time formats (#812) and country fields (#742);
  - removal of the toolbar and in-app tests modules.
- **[INFERENCE]** If the fork aligns with upstream (decision D1), new components must integrate with upstream's CSRF and escaping helpers rather than re-invent them. That is assumed below.

---

## 1. Rendering model: options evaluated

### 1.1 Options

| | **A. Server-rendered PHP partials + small progressive-enhancement JS** | **B. Web components (custom elements, light DOM) as enhancement and island boundary** | **C. React (or Vue) islands mounted into legacy pages** | **D. Astryx (React 19 + StyleX) islands** |
|---|---|---|---|---|
| What renders HTML | PHP partial functions/templates (escaped) | PHP renders semantic HTML *inside* `<oc-*>` tags; the element upgrades behaviour | Client-side, in a `div` mount point; SSR needs a Node server | Same as C |
| Works with no build step (today's reality: none) | Yes | Yes for vanilla ES modules; a bundler is optional (TS → JS) | No: JSX/TS build required | No: build plus the StyleX compiler/runtime |
| Works without JS / before JS loads | Fully | Yes: content is server HTML, behaviour enhances | No (blank until hydrated) unless SSR | No, same as C |
| Coexists with jQuery 1.3.2 and 344 globals | Yes (module scope) | Yes (module scope; custom-element registry is namespaced by the `oc-` prefix) | Yes (module scope), but two DOM owners on one page need strict mount boundaries | Same as C |
| Accessibility effort | Must hand-build APG behaviour (dialog, combobox, grid, tabs) | Same as A, encapsulated once per element | Can reuse a mature accessible library (e.g. React Aria; see `DESIGN_TOOLBOX_RESEARCH.md` §1.9, INFERENCE) | Library provides it; beta with 171 tolerated axe violations (`DESIGN_TOOLBOX_RESEARCH.md` §1.4) |
| Complex widgets (data table 5–10k rows, kanban, command palette) | Hard; ad-hoc JS drifts back to the legacy pattern | Feasible; each widget is one element with a defined contract | Strongest ecosystem | Table with 12 plugins; kanban template **not** keyboard-accessible (`DESIGN_TOOLBOX_RESEARCH.md` §1.5) |
| Careers site (SEO, SSR, no-JS apply) | Ideal | Ideal | Needs a Node SSR tier (MOD-011) | Same as C |
| Independence from the stack ADR (D6) | Tied to PHP templating (moves with D5) | **High**: custom elements work under any backend and can wrap a framework later | Commits to a framework now | Commits to React ≥19 + pre-1.0 StyleX + beta 0.x |
| Strict CSP (no inline script/eval), UX-016 goal | Yes if handlers are delegated, not inline | Yes | Yes | StyleX runtime/CSS injection must be checked [UNKNOWN] |
| Lock-in | Low | Low (web platform standard) | Medium | Medium–high (`DESIGN_TOOLBOX_RESEARCH.md` §1.8 risk 7) |
| Team skills | PHP team: high | PHP plus modern DOM: medium | Needs TS/React skill [UNKNOWN] | Same as C, plus StyleX |

### 1.2 Honest trade-offs

- **A alone is not enough [INFERENCE].** The legacy failure mode is exactly "server HTML plus ad-hoc page JS" (344 globals, inline handlers). Without an encapsulation boundary, A regresses into the same pattern. It is the right model for *static* structure (page header, form rows, badges, empty states) and the wrong one for stateful widgets.
- **B's weaknesses [INFERENCE]:**
  - Accessible behaviour for combobox, grid and dialog must be written and tested by OpenCATS, unless an existing accessible web-component library is adopted. None was researched in Phase 2 [UNKNOWN].
  - Shadow DOM breaks `aria-labelledby` across the boundary and form participation unless `ElementInternals` is used. This specification therefore mandates **light DOM** (§1.4).
- **C's weaknesses [INFERENCE]:**
  - React islands in a PHP page produce two rendering models and two data paths.
  - Each island needs a JSON endpoint, which does not exist yet (`ajax.php` is XML).
  - Without SSR, islands flash empty and fail without JS. That is acceptable for the recruiter workspace, which requires login and JS anyway, and **not acceptable for careers apply** (T34/T35).
- **D (Astryx) fit statement [FACT → INFERENCE].** Astryx's `@astryxdesign/core@0.6.3` peers are `react >=19`, `react-dom >=19` and `@stylexjs/stylex ^0.19` (`DESIGN_TOOLBOX_RESEARCH.md` §1.3). Its recommendation is **TRIAL gated on the stack ADR**.
  - **It would fit** only if D6 selects React 19+ with TypeScript, a build pipeline is introduced, a pre-1.0 StyleX peer is accepted, and Astryx is used **inside island boundaries** (the §1.3 hybrid) for the recruiter workspace. Its theme model ("a set of CSS custom property overrides", §1.6) can be fed from `--oc-*` semantic tokens.
  - **It would not fit:**
    - for PHP-rendered partials, because React components cannot render from PHP;
    - for a PHP-rendered careers site;
    - for the pipeline board as shipped, because its kanban template lacks keyboard handling (SC 2.5.7);
    - under a non-React ADR (PHP-only or Vue);
    - before the TRIAL exit criteria in `DESIGN_TOOLBOX_RESEARCH.md` §1.8 are met: axe clean on OpenCATS themes, keyboard walkthrough, virtualisation, and upgrade cost across two minors.
  - **Do not ADOPT while it is 0.x/Beta**, where breaking changes land in minors.

### 1.3 Recommendation [RECOMMENDATION] with decision flag

**Adopt "server-first, custom-element-bounded" (B, with A for static structure):**

1. **Static, stateless components** (Page Header, Status Badge, Button, Form Row, Empty/Error state, Candidate Card markup) are **PHP partials** that output semantic HTML with `oc-` classes and use upstream's `Template::escape*` helpers. They move to an auto-escaping engine (Twig/Plates, `UX_UI_AUDIT.md` §12.2 item 4) if and when that ADR lands.
2. **Stateful components** (Dialog, Drawer, Tabs, Menu, Combobox/Search, Toast region, Data Table, Filters, Command palette, Pipeline board) are **custom elements `<oc-*>` in light DOM**:
   - The server renders the full accessible markup inside the tag; for the table this means rows, pagination links and sort links that work without JS.
   - The element upgrades it with behaviour: keyboard handling, async fetch, in-place updates.
   - This is progressive enhancement with an encapsulated, testable boundary.
3. **Framework islands are allowed only behind a custom-element boundary.** If D6 selects React, a heavy widget such as `<oc-data-table>` or `<oc-pipeline-board>` may use React (or Astryx) *internally*, but the page contract stays the custom element: its attributes, events and server-rendered fallback. Legacy pages and PHP code never know which framework is inside. This keeps the ADR reversible and lets Astryx be trialled on exactly one element.
4. The **careers site** is always server-rendered (A+B), no-JS-complete for search and apply.

> **[DECISION, ADR-UI-001, open]** "Front-end rendering model for incremental modernisation". Proposed: the recommendation above. It depends on D6 (stack), D5 (evolve vs rebuild) and D10 (design system). Until it is accepted, only **tokens**, **PHP partials** and **vanilla custom elements** may be built. No framework runtime is introduced.

### 1.4 Custom-element rules [RECOMMENDATION]

- **Light DOM only.** No shadow DOM for app components. Token CSS custom properties would pierce shadow DOM anyway, but cross-boundary ARIA IDREFs, form submission and legacy CSS containment are simpler in light DOM. Isolation from legacy CSS uses cascade layers and `oc-` scoping (`UI_MIGRATION_STRATEGY.md` §3.1).
- **Elements enhance, never replace, server markup.** The element reads its initial state from DOM and `data-*`/attributes. JSON bootstrapping, where needed, goes in `<script type="application/json" data-oc-state>`, never in inline executable script.
- **Public API = attributes + properties + DOM events.** Events are named `oc-<component>-<verb>` (e.g. `oc-dialog-close`), `bubbles: true`, with `detail` payloads documented in the catalog. There are no global functions.
- **Loading.** Use a single `<script type="module" src="oc-components.js">`, deferred by nature. Define elements with `customElements.define` guarded by `customElements.get`.
- **Server partial names match element names:** `oc/dialog.php` renders the fallback markup for `<oc-dialog>`.
- **No `window.onload =`, `document.on* =` or other global single-slot handler assignment.** Use `addEventListener` only. **[FACT]** Upstream chains `window.onload` for CSRF injection (`lib/TemplateUtility.php:1366-1375` at `d5cf733`). Overwriting it would silently drop CSRF tokens from legacy forms.

---

## 2. Layering

```
 L0 TOKENS            DESIGN_TOKENS.md — CSS custom properties (oc-tokens.css) + JSON
        │
 L1 PRIMITIVES        visually-hidden, focus-ring, stack/inline/grid layout utilities,
        │             icon (SVG sprite, currentColor), surface, text styles, live-region helper,
        │             roving-tabindex & focus-trap behaviours (JS mixins), portal to top layer
        │
 L2 COMPONENTS        Button, Form controls, Status badge, Tabs, Dialog, Drawer, Menu, Toast,
        │             Data table, Search/Combobox, Empty/Loading/Error, Candidate card, Pipeline card
        │
 L3 PATTERNS          List view (table + filters + bulk bar + saved view), Record detail (header +
        │             tabs + timeline + side panel), Form page (error summary + sections),
        │             Confirmation flow, Command palette, Pipeline board (cards + "Move to…")
        │
 L4 PAGE TEMPLATES    App shell (header, nav, main, skip link) → List page, Detail page,
                      Settings page, Careers job list / job detail / apply
```

**Rules [RECOMMENDATION]:**
- A layer may depend only on the layers below it.
- Patterns own composition and data flow, such as how a filter change reaches the table. Components own interaction and a11y.
- Page templates own routing, permissions and data loading. They are the only layer that knows URLs of `index.php?m=&a=` routes or new API routes.

---

## 3. Component spec template (used for every entry in §5)

Each component in the catalog must document: **Purpose · Anatomy · Variants · States · Accessibility (APG pattern / ARIA) · Keyboard · Responsive · Data/API contract · Replaces (legacy, file refs) · Priority · Status (alpha/beta/stable)**.

**Global state vocabulary.** Every interactive component defines: default, hover, focus-visible, active/pressed, selected (if applicable), disabled, read-only (forms), loading/busy, error/invalid, empty. This follows the Impeccable "Operate" rule quoted in `DESIGN_TOOLBOX_RESEARCH.md` §3.3, used as reference only.

**Priority key.**
- **P0:** needed by the app shell or the first vertical slice.
- **P1:** needed by the list and detail slices.
- **P2:** needed by the pipeline, careers and command slices.
- **P3:** later.

---

## 4. Inventory summary

| # | Component | Layer | Kind (§1.3) | APG pattern | Replaces (primary legacy) | Priority |
|---|---|---|---|---|---|---|
| 1 | App Shell | L4 | partial + `<oc-shell>` | Landmarks; skip link | `TemplateUtility::printHeader/printHeaderBlock/printTabs/printQuickSearch/printFooter` (`lib/TemplateUtility.php:64-852`) | P0 |
| 2 | Navigation | L3 | partial + `<oc-nav>` | Disclosure navigation | `printTabs` tab/sub-tab strings (`:570-800`), JPG tabs (`main.css:163-192`) | P0 |
| 3 | Page Header | L2 | partial | Heading structure | 85 copy-pasted icon+`<h2>` header tables (e.g. `candidates/Add.tpl:14-21`) | P0 |
| 4 | Tabs | L2 | `<oc-tabs>` | Tabs | Sub-tabs; long Show pages (`candidates/Show.tpl`, 635 lines) | P1 |
| 5 | Data Table | L2/L3 | `<oc-data-table>` (island-eligible) | Table (sortable); grid only if cell nav is required | `lib/DataGrid.php` (2,649 lines), `js/dataGrid.js`, `js/sorttable.js`, pipeline AJAX table (`ajax/getPipelineJobOrder.php`) | P1 |
| 6 | Filters | L3 | `<oc-filter-panel>` | Disclosure, checkbox groups, listbox | `lib/datagrid/FilterArea.tpl`, `js/dataGridFilters.js`, "Only My/Only Hot" checkboxes (`candidates/Candidates.tpl:34-35`) | P1 |
| 7 | Search (global and in-list) | L2 | `<oc-search>` | Combobox (list autocomplete) | `printQuickSearch` (`:255-301`), `js/suggest.js`, `home/SearchEverything.tpl` | P0 (global) / P1 |
| 8 | Command / search interface | L3 | `<oc-command-palette>` (island-eligible) | Dialog + combobox + listbox | MRU "Recent:" bar (`lib/MRU.php:115-162`), quick-action menus (`js/quickAction.js`) | P2 |
| 9 | Modal (dialog) | L2 | `<oc-dialog>` on native `<dialog>` | Dialog (modal), Alert dialog | `js/submodal/subModal.js` iframe modals (27 `showPopWin`), `printPopupContainer` (`:543-560`) | P0 |
| 10 | Drawer | L2 | `<oc-drawer>` on `<dialog>` | Dialog (modal or non-modal) | Status-change modal `candidates/AddActivityChangeStatusModal.tpl`; popup windows (19 `window.open`) | P1 |
| 11 | Form controls | L2 | partials + light enhancement | Native controls; Checkbox, Radio group, Combobox, Spinbutton avoided | 509 controls with 257 labels; `calendarDateInput.js`; duplicate tabindex (UX-010) | P0 |
| 12 | Buttons | L2 | partial | Button, Menu button | `.button` images, `<img onclick>` submits (`db/cats_schema.sql:437,439`), `javascript:` links (108), upstream `button.linkButton` | P0 |
| 13 | Status badges | L2 | partial | n/a (text); `role=status` not used | Colour-only `jobLink{Hot,Submitted,Placed,Dead}` (`main.css:837-907`) | P0 |
| 14 | Empty / Loading / Error states | L2 | partials + `<oc-live-region>` | Status messages (4.1.3) | JPG empty states (`images/nodata/*`), `indicator*.gif`, 18 `Error.tpl`/`ErrorModal.tpl` | P0 |
| 15 | Notifications / toasts | L2 | `<oc-toast-region>` | Status/alert live regions | 132 `alert()` in JS; success text inside modals (`AddActivityChangeStatusModal.tpl:257-291`) | P1 |
| 16 | Confirmations | L3 | `<oc-confirm>` (Alert dialog) + POST form | Alert dialog | 28 `confirm()` on GET deletes (`candidates/Show.tpl:228,432`, `companies/Show.tpl:227`) | P1 |
| 17 | Candidate card | L2 | partial | Article/list item; no nested interactives | MRU items, SearchEverything rows, dashboard "Important Candidates" grid (`home/Home.tpl`) | P2 |
| 18 | Pipeline card (+ board) | L2/L3 | partial + `<oc-pipeline-board>` (island-eligible) | Listbox/grid of cards + menu button "Move to…" (no drag-only) | Job order pipeline table (`joborders/Show.tpl:371-420`, `js/pipeline.js`), candidate pipeline rows (`candidates/Show.tpl:529-531`) | P2 |
| n/a | Supporting: Menu, Tooltip, Popover | L2 | `<oc-menu>`, native `popover` | Menu button, Tooltip | `quickAction.js`, Sweet Titles (`js/sweetTitles.js`) | P1 |

---

## 5. Component specifications

### 5.1 App Shell (P0)
- **Purpose.** A responsive, accessible frame that wraps *both* migrated and legacy page content. It is the strangler's front door for the UI (`UI_MIGRATION_STRATEGY.md` §2).
- **Anatomy.**
  - Skip link: "Skip to main content", the first focusable element.
  - `<header role=banner>`: product logo (SVG, `alt` "OpenCATS home"), global search (§5.7), a help link placed consistently (SC 3.2.6), and a user menu (profile, density, theme, logout).
  - `<nav aria-label="Primary">` (§5.2).
  - `<main id="main" tabindex="-1">` holding the page template or the legacy content region.
  - `<footer role=contentinfo>` with the licence-required "Powered by OpenCATS" attribution (`lib/TemplateUtility.php:816-831`; engineering note, not legal advice) and version, without "Server Response Time" outside debug mode (UX-022).
  - A top-layer container for toasts.
- **States.**
  - Nav expanded or collapsed (on narrow viewports).
  - Legacy mode vs modern mode for the `<main>` content (`data-oc-content="legacy|modern"`). Legacy mode forces the light theme and comfortable density (`DESIGN_TOKENS.md` §3.4).
  - Impersonation or maintenance banner slot.
- **A11y.**
  - Exactly one each of `banner`, `main` and `contentinfo`; `<html lang dir>` set.
  - Page `<title>` pattern "Page – Section – OpenCATS", escaped. **[FACT]** The fork echoes raw titles (UX-006); upstream escapes them (`lib/TemplateUtility.php:1290` at `d5cf733`).
  - On in-app navigation without a full reload (islands only), focus moves to `<h1>` and the title is announced.
- **Keyboard.** Skip link on first Tab. The user menu is a menu button (Enter/Space/↓ opens; Esc closes and returns focus). No positive `tabindex`. **[FACT]** Legacy has 101 positive `tabindex` values (UX_UI_AUDIT §6).
- **Responsive.**
  - Below `bp-md`: nav becomes a disclosure button with a panel; search collapses to an icon button that opens it.
  - At or above `bp-lg`: persistent side nav, collapsible to an icon rail with a visible tooltip and an accessible name.
  - No horizontal page scroll at 320 px.
- **Data contract.** Server-provided `ShellContext`: `{ user: {id, displayName, roles[]}, nav: NavItem[], activeNavId, mru: MruItem[], flags: {eeoEnabled, calendarEnabled, …}, locale, dir, theme, density, csrfToken }`. **Nav items are computed server-side from permissions.** **[FACT]** Legacy encodes visibility in tab strings (`*al=`, `*hrmode=`, `*js=`; `lib/TemplateUtility.php:574-790`) and only hides links.
- **Replaces.** `printHeader`, `printHeaderBlock` (layout table at `:106`), `printTabs`, `printQuickSearch`, `printFooter`, `_printCommonHeader` (`:1159-1216`), and the logo inside a layout table.

### 5.2 Navigation (P0)
- **Purpose.** Object-centric, role-filtered destinations (`MODERN_ATS_UX_PATTERNS.md` §2). Initial items mirror `$coreModules` (`constants.php:30-41`), so users are not disoriented. IA consolidation, such as agency vs corporate mode, is a later product decision (D2).
- **Anatomy.** A list of links with icon and text label, optional count badge, and optional children (the former sub-tabs) as a nested disclosure list. Section actions such as "Add Candidate" move out of nav into the Page Header primary action (§5.3).
- **States.** Current page (`aria-current="page"` **plus** an indicator bar and bold weight, never colour alone; legacy used `#cccccc` only, `lib/TemplateUtility.php:685`), expanded group, hover, focus.
- **A11y.** `<nav aria-label="Primary">` containing `<ul>` of links. Groups use the APG **Disclosure (Show/Hide) navigation** pattern (button `aria-expanded` + `aria-controls`), **not** `role=menu`. A site nav is not an application menu.
- **Keyboard.** Tab through links; Enter/Space toggles group buttons. No arrow-key roving is required, since native Tab order suffices. Optional arrow navigation within the rail is permitted if implemented per APG.
- **Responsive.** Side rail at `bp-lg`+; off-canvas panel below it, which is a non-modal disclosure panel that returns focus to the toggle on close.
- **Data contract.** `NavItem { id, label (i18n key), href, icon, count?, children?: NavItem[], requiredPermission (server-only, not sent) }`.
- **Replaces.** `printTabs` markup (`#header ul#primary/#secondary`, `main.css:140-240`) and `images/tabs/*.jpg`.

### 5.3 Page Header (P0)
- **Purpose.** A consistent top of every page: title, context, primary action. It replaces 85 duplicated icon+`<h2>` tables.
- **Anatomy.** Optional breadcrumbs (`<nav aria-label="Breadcrumb">`, last item `aria-current="page"`), `<h1>` title, optional subtitle or meta line (e.g. "Job order · Open · 3 openings"), a status badge slot, a primary action (one), secondary actions (≤ 2 visible, the rest in an overflow menu button), and an optional Tabs slot (§5.4).
- **States.** Default, loading (skeleton title), read-only (no actions when the user lacks permission; actions are omitted server-side, not disabled).
- **A11y.** Exactly one `<h1>` per page. **[FACT]** Legacy has 0 `<h1>` and 88 `<h2>` page titles. Decorative icons are `aria-hidden="true"`.
- **Keyboard.** Native button and link behaviour; the overflow menu follows the APG Menu Button pattern.
- **Responsive.** Actions wrap below the title below `bp-md`; the primary action may become full-width. Breadcrumbs collapse to "Back to {parent}".
- **Data contract.** `{ title, subtitle?, breadcrumbs?: {label, href}[], status?: StatusBadge, actions: Action[] }`, where `Action = { id, label, href | formAction(POST), variant, icon? }`.
- **Replaces.** The header table in 85 templates (e.g. `modules/candidates/Add.tpl:14-21`).

### 5.4 Tabs (P1)
- **Purpose.** Split long record pages into reference panels (profile, pipelines, activities, attachments) while the action area stays visible (`MODERN_ATS_UX_PATTERNS.md` #4).
- **Anatomy.** `tablist` → `tab` × n (label + optional count) → `tabpanel` × n.
- **Variants.**
  - **In-page tabs:** panels on the same page, JS-switched. The server renders all panels, with the non-selected ones `hidden`.
  - **Link tabs:** each tab is a URL, so use `<nav>` with `aria-current`, not the ARIA tabs pattern.
  - **Rule:** if switching changes the URL and reloads, it is navigation, not tabs.
- **States.** Selected, focus, disabled (avoid; hide instead), with a badge count.
- **A11y.** APG **Tabs** pattern: `role=tablist/tab/tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby`, and a focusable panel (`tabindex=0`) if it holds no focusable content.
- **Keyboard.** ←/→ move between tabs (automatic activation when panels are pre-rendered); Home/End; Tab moves into the panel. RTL reverses arrow semantics.
- **Responsive.** Horizontal scroll with visible scroll affordance below `bp-md`. Never truncate labels to icons without accessible names.
- **Data contract.** Pre-rendered panels, or lazy panels with a `src` attribute fetching an HTML fragment (same-origin, escaped server-side; **never `eval`**, unlike `execJS` in `js/lib.js:852-880`). The selected tab is reflected in the URL hash or query for deep links.
- **Replaces.** Long single-page Show templates (`candidates/Show.tpl`, `joborders/Show.tpl`); `toggleNotes()` "[More]/[Less]" links (`candidates/Show.tpl:300-304`).

### 5.5 Data Table (P1; island-eligible)
- **Purpose.** The single list component everywhere: candidates, job orders, companies, contacts, activities, lists, pipeline list view (`MODERN_ATS_UX_PATTERNS.md` #3, principle 6).
- **Anatomy.**
  - Toolbar: in-list search (§5.7), filter toggle (§5.6), saved-view selector, column manager, density toggle, export.
  - Bulk-action bar, which appears when there is a selection: "N selected", "Select all M matching", actions, clear.
  - `<table>` with `<caption>` (visually hidden if redundant), `<thead>` sortable headers, a row-selection checkbox column, a sticky first data column, and row actions (menu button).
  - Footer pagination with a rows-per-page select, plus a result count announced politely.
- **States.**
  - Loading: skeleton rows on first load; an inline busy indicator on refresh with `aria-busy="true"` on the table.
  - Empty (first use / no results / no permission, per §5.14).
  - Error with retry.
  - Row states: selected, focused, stale (optimistic update pending), disabled (no permission for bulk).
  - Column states: sorted ascending/descending/none, resized, hidden.
- **A11y.**
  - Semantic `<table>` with `<th scope="col">` and a row header `<th scope="row">` (the name column). **[FACT]** Legacy has 0 `scope` and 0 `caption`.
  - Sort buttons *inside* `<th>`, with `aria-sort` on the `<th>`.
  - Row checkbox accessible name "Select {candidate name}". **[FACT]** Legacy row checkboxes are unlabelled (`lib/DataGrid.php:1880`).
  - The select-all checkbox uses `aria-checked="mixed"` semantics via `indeterminate`.
  - **The APG Grid pattern is used only if cell-level keyboard navigation or inline editing is required** (toolbox prerequisite 6 [DECISION]). Default: a semantic table with Tab order limited to one control per row (row link + row actions), to avoid hundreds of tab stops.
  - Column manager: a dialog listing columns with checkboxes and "Move up/Move down" buttons, the keyboard alternative to drag reorder and resize (UX-005; `DataGrid.php:1719,1840` are `onmousedown`-only). Width uses a numeric input or "Wider/Narrower" buttons.
  - Status messages ("Sorted by Name, ascending", "25 of 1,240 results", "3 candidates added to list") go to a polite live region (4.1.3).
- **Keyboard.** Tab to toolbar → table (row link, row checkbox, row menu) → pagination. Space toggles a checkbox; Shift+Space or Shift+click extends the range (optional, documented). Esc clears selection when the bulk bar is focused. No keyboard traps.
- **Responsive.**
  - At `bp-lg`+: full table.
  - At `bp-md`: priority columns only, with a column manager to add more; the table scrolls horizontally inside its own region with a sticky first column.
  - Below `bp-md`: rows render as stacked cards (Candidate Card §5.17) *from the same data*, with selection preserved.
  - The sticky header and bulk bar respect 2.4.11 via `scroll-padding` (`DESIGN_TOKENS.md` §8).
- **Data/API contract [RECOMMENDATION].**
  - Request: `GET /api/v1/{resource}?q=&filter[...]=&sort=field,-field&page[size]=25&page[cursor]=…&fields=…`.
  - Response: `{ data: Row[], meta: { total?: number, totalIsEstimate: bool, nextCursor?, prevCursor? }, columns: ColumnDef[] }`.
  - `ColumnDef { id, labelKey, type: text|number|date|status|person|tags, sortable, filterable, defaultVisible, priority }`.
  - Keyset pagination (`MODERNIZATION_OPPORTUNITIES.md` §2.2).
  - **URL reflects state:** q, filters, sort, page and view id are in the query string (WIG rule; T27).
  - **Selection model is server-side:** `{ mode: "ids", ids: [] }` or `{ mode: "query", query, excludeIds: [] }` for "all M matching". It is sent as **JSON**. **[FACT]** Legacy mixes PHP `serialize()` and `json_decode`, which drops the selection (UX-002; `DataGrid.php:259,301,1988,1993`).
  - Bulk actions go through `POST /api/v1/bulk-jobs` returning `{ jobId }`, then progress, result report and undo where possible (T26; principle 10).
  - Per-user column preferences are persisted server-side as JSON. **[FACT]** Legacy uses PHP-serialized `user.column_preferences`, `db/cats_schema.sql:1085`; the feature is kept, the storage format changes.
  - **No-JS fallback:** sort and pagination are plain links; filters are a GET form.
- **Replaces.** `lib/DataGrid.php` HTML/JS generation, `js/dataGrid.js`, `js/sorttable.js` (31 tables), DataGrid action area, the column chooser (`DataGrid.php:1616-1660`, keeping the concept), and `ajax/setColumnWidth.php`.
- **Island note.** Virtualisation for 5–10k rows is a TRIAL criterion (`DESIGN_TOOLBOX_RESEARCH.md` §1.8). Server pagination at 25–100 rows is the default. **[INFERENCE]** Virtualisation is needed only for the board and very large "select all" previews.

### 5.6 Filters (P1)
- **Purpose.** Faceted narrowing with explicit scope; saved as views (`MODERN_ATS_UX_PATTERNS.md` #6–#7).
- **Anatomy.**
  - A filter panel (side panel at `bp-lg`+, drawer below), made of facet groups. Each group is a `<fieldset>` + `<legend>`: checkbox list, date range (two native `<input type=date>`), owner (combobox), status (checkbox list with badges), tags.
  - Active-filter chips row above the table; each chip is "{Facet}: {value}" with a remove button labelled "Remove filter {Facet}: {value}".
  - "Clear all".
  - "Save view" (name, private/shared).
- **States.** Collapsed/expanded groups, applied vs pending (when "Apply" is used on mobile), count per facet value (optional, may be estimated), no-options.
- **A11y.** Fieldsets and legends. Chips are buttons, not `role=option`. Applying filters announces the result count politely. Disclosure pattern for groups.
- **Keyboard.** Native. Removing a chip moves focus to the next chip, or to the "Filters" button if none remain.
- **Responsive.** Drawer below `bp-lg` with "Apply" and "Cancel" (pending state); inline live-apply at `bp-lg`+.
- **Data contract.** `FacetDef { id, labelKey, type: enum|date-range|person|tag|boolean, options?: {value, labelKey, count?}[] }` from `GET /api/v1/{resource}/facets`. Applied filters are serialised to the URL as `filter[status]=400,500&filter[owner]=me`. `SavedView { id, name, visibility: private|shared, query }`.
- **Replaces.** `lib/datagrid/FilterArea.tpl`, `js/dataGridFilters.js`, PHP-generated filter JS strings, "Only My / Only Hot" checkboxes (the label inconsistency at `candidates/Candidates.tpl:34-35` vs `joborders/JobOrders.tpl:47`), the recent/saved searches printer (`TemplateUtility.php:366-507`, keeping the concept), and `js/searchSaved.js`.

### 5.7 Search (P0 global / P1 in-list)
- **Purpose.** Fast re-finding across candidates, companies, contacts and job orders (a preserved strength, `UX_UI_AUDIT.md` §12.1), with type-ahead and scope.
- **Anatomy.**
  - A labelled search input (`<label>`, visually hidden if needed) with a scope selector (All / Candidates / Jobs / Companies / Contacts).
  - A suggestion listbox grouped by entity type (group labels), plus recent searches when the input is empty.
  - "See all results for …" as the last option.
  - Submitting goes to the full results page, which is paginated per entity.
- **States.** Empty (shows recent), typing (debounced 200 ms), loading (spinner with `aria-busy`), results, no results ("No matches for 'x'. Search all records"), error.
- **A11y.**
  - APG **Combobox** with listbox popup (`role=combobox`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; options `role=option` with an accessible name including the type, e.g. "Jane Doe, candidate, Boston").
  - The result count is announced politely ("5 suggestions").
  - **[FACT]** Legacy quick search has no label (`TemplateUtility.php:292-296`), echoes input raw in the fork (UX-006), and `suggest.js` is a plain-div list treating key code 48 as Enter/Tab (`js/suggest.js:472-477`).
- **Keyboard.** ↓/↑ move the active option; Enter selects (navigates to the record); Esc closes, and a second Esc clears; Tab leaves without selecting; Alt+↓ opens. The global shortcut `/` focuses search, only when focus is not in a text field (WIG and shortcut-conflict rule; shortcuts listed in help).
- **Responsive.** At `bp-md`+ it is inline in the header. Below that it is an icon button that opens a full-width search sheet (non-modal dialog).
- **Data contract.** `GET /api/v1/search/suggest?q=&scope=&limit=8` returns `{ groups: [{ type, items: [{ id, type, title, subtitle, href }] }] }`. It is **limited and paginated**; **[FACT]** legacy Quick Search runs 4 unbounded queries (`lib/Search.php:1329-1620`). Phone normalisation stays server-side. The full results page uses the Data Table per entity.
- **Replaces.** `printQuickSearch`, `js/suggest.js` (company autocomplete also becomes this combobox), `home/SearchEverything.tpl:19-182`, and `printAdvancedSearch` (`TemplateUtility.php:308-365`; moves to Filters).

### 5.8 Command / search interface (P2; island-eligible)
- **Purpose.** Keyboard-first access to navigation, records and actions ("Add candidate", "Go to job …", "Log activity for …") for power users (`MODERN_ATS_UX_PATTERNS.md` §2 effort reducers). It is an accelerator, **never the only path** to anything.
- **Anatomy.** A modal dialog containing a combobox input and a grouped listbox: Recent (from MRU), Records, Actions (permission-filtered), Navigation. Each option shows a shortcut hint.
- **States.** Idle (recent + suggested actions), searching, results, no results, error, action confirmation handoff (opens the relevant dialog or drawer).
- **A11y.** APG **Dialog (Modal)** containing an APG **Combobox**. On open, focus goes to the input; on close, focus returns to the invoker. Group labels use `role=group` + `aria-labelledby` inside the listbox.
- **Keyboard.** Ctrl/⌘+K opens it, with configurable remapping and an off switch (SC 2.1.4 Character Key Shortcuts applies to single-key shortcuts; `/` is handled per §5.7). ↑/↓, Enter, Esc. Shortcuts are not active inside text inputs.
- **Responsive.** Full-screen sheet below `bp-md`.
- **Data contract.** `GET /api/v1/commands?q=` returns `{ items: [{ id, kind: record|action|nav, title, subtitle?, href? , actionId?, shortcut? }] }`. Actions resolve to routes; there is no client-side privilege.
- **Replaces.** Augments the MRU bar (`lib/MRU.php`, which is kept as "Recent") and quick-action menus (`src/OpenCATS/UI/QuickActionMenu.php`, `js/quickAction.js`).
- **Library note.** Astryx ships `CommandPalette` (`DESIGN_TOOLBOX_RESEARCH.md` §1.5) and is a TRIAL candidate for this island only if ADR-UI-001/D6 allow React.

### 5.9 Modal dialog (P0)
- **Purpose.** Focused tasks that must complete or cancel before returning (short forms, confirmations). **Prefer a page or drawer for long forms.**
- **Anatomy.** Native `<dialog>` opened with `showModal()` (top layer), inside `<oc-dialog>`. It has a header (`<h2>` title, close button with an accessible name "Close"), a body (scrolls internally), and a footer (primary action last in DOM order, then secondary; the visual order follows platform convention and is consistent across the app).
- **Variants.** Standard; Alert dialog (§5.16); Form dialog (`<form method="dialog">` for cancel, a real `method=post` for submit).
- **States.** Open, submitting (primary button busy, other controls disabled, Esc still works unless the request is non-cancellable), error (error summary at the top of the body, focus moved to it), success (close and toast, or show inline success).
- **A11y.**
  - APG **Dialog (Modal)**: `aria-labelledby` pointing to the title, `aria-describedby` optional.
  - Focus moves to the first focusable element, or to the title when the content is long.
  - Tab is contained (native `<dialog>` inertness).
  - Esc closes.
  - **Focus returns to the invoking control.**
  - **[FACT]** Legacy dialogs meet none of this: an `<img onclick>` close (`TemplateUtility.php:548-549`), no role, no Esc, and a `keypress` Tab trap that rewrites parent `tabindex` to −1 (`subModal.js:94,262-320`).
- **Keyboard.** Esc; Tab/Shift+Tab cycle; Enter submits the form when focus is in a single-line input.
- **Responsive.**
  - Width token `--oc-dialog-width` (sm 400 / md 560 / lg 720 px); height ≤ 90 vh with body scroll.
  - Below `bp-sm` it becomes a full-screen sheet.
  - Never fixed pixel sizes at the call site. **[FACT]** Legacy uses `showPopWin(url, 600, 480)` etc.
- **Data contract.**
  - Content is server-rendered in the same document: either an inline partial, or an HTML fragment fetched from a same-origin route with a `fragment=1` flag, escaped and inserted with no script execution.
  - **No iframes.**
  - After a successful POST, the server returns either a redirect (no JS) or JSON `{ ok, message, updated: {resource, id} }` (JS). The opener patches the affected region in place, instead of `parentGoToURL`/`parentHidePopWinRefresh` full reloads (17 call sites; UX-014).
- **Replaces.** `js/submodal/subModal.js`, `printPopupContainer`, `printModalHeader` (22 modal templates), `*Modal.tpl` iframe documents, and `window.open` popups where a dialog suffices.

### 5.10 Drawer (P1)
- **Purpose.** A side panel for context-preserving work on a record from a list or board: the status change, log activity and schedule flow, a quick candidate preview, and filters on mobile. It preserves the valued "one-dialog status workflow" (`UX_UI_AUDIT.md` §12.1).
- **Anatomy.** A `<dialog>` anchored to the inline-end edge (it mirrors in RTL), with a header (title, record context, close), a scrollable body, and a sticky footer (actions).
- **Variants.** **Modal drawer** (default: task flows such as status change); **non-modal drawer** (preview beside the list; `show()` rather than `showModal()`, with focus management documented).
- **States.** Open/closed, submitting, error, dirty (closing with unsaved changes opens a confirm alert dialog).
- **A11y.** Modal drawers follow the APG **Dialog (Modal)** pattern exactly as §5.9. Non-modal drawers are a labelled `role=dialog` without `aria-modal`, with F6 or a visible "Return to list" control to move focus between regions.
- **Keyboard.** As in the dialog. The non-modal drawer does not trap focus.
- **Responsive.** 400–560 px wide at `bp-md`+; full-screen below.
- **Data contract.** Example (status change): `GET /api/v1/applications/{id}/transition-options` returns `{ stages: [{id, label, category}], requiresReason, emailTemplateSuggestion?, canScheduleEvent }`, then `POST /api/v1/applications/{id}/transitions` with `{ toStage, reasonId?, note, notifyCandidate: false (default OFF), event? }` and returns `{ transition, activity, event?, emailQueued }`.
  - **The candidate e-mail default is OFF.** **[FACT]** Legacy auto-checks it (`js/activity.js:697-701`; UX-021).
  - The side effects must match the characterised legacy behaviour (`MODERNIZATION_OPPORTUNITIES.md` §2.1; `CandidatesUI.php:2900-3302`), including "Placed decrements openings".
- **Replaces.** `candidates/AddActivityChangeStatusModal.tpl`, `js/activity.js` (status part), `joborders` duplicate dialog logic (DEBT-007), and candidate preview popups.

### 5.11 Form controls (P0)
- **Purpose.** Labelled, validated, localisable inputs that keep user input on error.
- **Anatomy (form row partial).** `<label for>` (auto-generated unique `id`), an optional hint (`id` referenced by `aria-describedby`), the control, an inline error message (`id` in `aria-describedby`, prefixed with an icon and the text "Error:"), and a required marker ("required" in text or `(required)`, not only an asterisk; `aria-required` via the native `required`).
- **Controls.**
  - Text, email (`type=email`), tel, url, number (only for true numbers; phone and ZIP are text).
  - Textarea.
  - Native `<select>`.
  - Checkbox, radio group (`<fieldset><legend>`), switch (checkbox with `role=switch` only when it applies immediately).
  - Date (`<input type=date>`, replacing `DateInput()` hard-coded to `'MM-DD-YY'`, 10 call sites; `candidates/Add.tpl:419`; UX-015).
  - Time (native, following upstream's 12/24-hour setting from #812).
  - File (native input + drop zone enhancement).
  - Combobox (§5.7 engine) for company, contact and owner pickers, with "+ Add '{typed}'" (UX-021).
  - Rich-text editor slot (decision pending, UX-018).
- **States.** Default, focus, filled, disabled, read-only, invalid (after submit or blur-after-edit, never on first keystroke), busy (async validation such as the duplicate check).
- **A11y.**
  - Every control has a programmatic label. **[FACT]** Legacy has 509 controls, 257 `label for`, 32 pointing at missing IDs, and wrong-target labels (`candidates/Add.tpl:327-407`; UX-010).
  - No positive `tabindex`.
  - `autocomplete` tokens **on careers/applicant forms** (SC 1.3.5); recruiter forms entering *someone else's* data may use `autocomplete="off"`. This is the WIG rule split adopted from `DESIGN_TOOLBOX_RESEARCH.md` §7.3 risk 4.
  - Error summary pattern on submit: a list of links to fields at the top, focus moved to it, plus inline messages (3.3.1, 3.3.3).
  - No `alert()` validation. **[FACT]** Legacy uses `alert("Form Error:…")` (`candidates/validator.js:20`).
  - Redundant entry is avoided within a flow (3.3.7).
- **Keyboard.** Native. The date picker is native; any custom calendar must follow the APG Date Picker Dialog pattern.
- **Responsive.** Single column below `bp-md`; up to two columns at `bp-md`+ for short related fields (first/last name). Inputs are 16 px text on touch devices to prevent iOS zoom (`DESIGN_TOKENS.md` §4).
- **Data contract.**
  - Server validation returns RFC 9457-style problem details: `{ type, title, status: 422, errors: [{ field, code, messageKey, params }] }`. The server re-renders the form **with input preserved** (no-JS path), replacing `CommonErrors::fatal` pages (UX-013).
  - Client validation mirrors server rules from a shared schema where feasible; the server stays authoritative.
  - **Store raw, escape on output.** Forms must not persist `htmlspecialchars` output. **[FACT]** Legacy `getSanitisedInput()` double-escapes (UX-003).
- **Replaces.** `calendarDateInput.js` (`document.write`, `eval`), per-module `validator.js` alert validation, Reset buttons next to submit (UX-021), the 18 error templates for validation cases, and the `.inputbox` style.

### 5.12 Buttons (P0)
- **Purpose.** Actions. Links navigate; buttons act.
- **Variants.** Primary (one per view region), secondary, tertiary/ghost, danger (destructive, used only inside confirmation or with undo), icon-only (requires `aria-label` and a tooltip), link-styled button (keeps upstream's `button.linkButton` POST-for-state-change intent with the token style), menu button (APG Menu Button), split button (avoid unless needed).
- **Sizes.** `sm`/`md` follow density, with a hit area ≥ 24×24 always (`DESIGN_TOKENS.md` §5.2).
- **States.** Default, hover, focus-visible, active, disabled (prefer an explanation over disabling: `aria-disabled="true"` + reason via `aria-describedby` when the reason matters), busy (spinner + `aria-busy` + preserved width; a double submit is prevented).
- **A11y.**
  - Native `<button type>`. **Never** `<img onclick>`, `<a href="javascript:">` (108 in legacy) or `<div onclick>`.
  - State-changing actions use `<form method=post>` + a CSRF token. Upstream moved some GET actions to POST `linkButton` forms (#693); the pattern generalises.
  - Toggle buttons use `aria-pressed`.
- **Keyboard.** Enter/Space (native).
- **Responsive.** Primary actions may go full-width below `bp-sm`; icon-only buttons keep visible labels at `bp-lg`+ where space allows.
- **Data contract.** n/a (partial parameters: `label, variant, size, icon?, type, name/value?, formaction?, disabledReason?`).
- **Replaces.** `.button` background images (`main.css:755-800`), `careers_submit.gif`/`careers_apply.gif` image buttons (`db/cats_schema.sql:437,439`), `javascript:` links, and icon links with `alt=""` (`candidates/Show.tpl:530`).

### 5.13 Status badges (P0)
- **Purpose.** Communicate record state (pipeline stage, hot, active/inactive, job status, AI-assisted marker) **without relying on colour**.
- **Anatomy.** An icon (SVG, `aria-hidden`) + a text label + an optional count. The token triplet fg/bg/border (`DESIGN_TOKENS.md` §3.3). A solid variant exists for high emphasis.
- **States.** Static. Interactive badges become buttons (e.g. a filter chip) with the Button spec.
- **A11y.**
  - The text label is always present. It may be visually hidden only in a dense table column whose header already names it, e.g. a column "Hot" with an icon; in that case the visually hidden text remains.
  - Not a live region.
  - **[FACT]** It replaces colour-only link classes at 1.37–4.00:1 contrast (`main.css:857-907`; UX-009).
- **Keyboard.** None (non-interactive).
- **Responsive.** It truncates never; it wraps or moves to a new line.
- **Data contract.** `{ kind: pipelineStage|hot|recordStatus|disposition|ai, value, labelKey }`. The mapping from pipeline code to token is defined in `DESIGN_TOKENS.md` §3.3.
- **Replaces.** `jobLinkHot/Submitted/Placed/Dead/Cold` classes, "(INACTIVE)" orange text (`candidates/Show.tpl:71`), and upstream `span.statusChangeHighlight`.

### 5.14 Empty, Loading and Error states (P0)
- **Purpose.** Always tell the user what happened and offer a next step (principle #13; `MODERN_ATS_UX_PATTERNS.md` #17–#19).
- **Empty (partial).** An illustration or icon (decorative, `aria-hidden`), a heading, one sentence, and **one** primary action. Variants:
  - **first use** ("No candidates yet" → "Add candidate" / "Import CSV");
  - **no results** ("No matches" → "Clear filters");
  - **blocked** ("You don't have access to …" → "Request access" / contact admin).
  - All text is real, translatable text. **[FACT]** Legacy empty states are text in JPGs with `&nbsp;` CTAs (`candidates/Candidates.tpl:7-10,151-158`).
- **Loading.**
  - A skeleton for first page load of lists and profiles (decorative, `aria-hidden`, with the container `aria-busy="true"`).
  - An inline spinner in buttons.
  - A progress bar for bulk jobs, imports and exports (`<progress>` with a label and a text percentage).
  - Announce "Loading results" / "Results loaded" via the polite live region only when the wait is longer than about 1 s.
  - **[FACT]** It replaces `images/indicator*.gif` with `alt="AJAX"` or `alt=""` (`companies/Add.tpl:68,106`) and `js/submodal/loading.html`.
- **Error.**
  - Inline region error (a card with an icon, message and "Retry") for a failed widget.
  - Page-level errors: 403, 404, 409 conflict, 500 with a reference ID and next step.
  - **The validation error summary is in the forms spec (§5.11).**
  - Errors use `role="alert"` only when they appear in response to a user action; page-load errors are headings in normal flow.
- **Data contract.** Errors use RFC 9457 problem-details: `{ type, title, detail, status, instance (reference ID) }`. There are no stack traces or server timing in the UI (UX-022).
- **Replaces.** 18 `Error.tpl`/`ErrorModal.tpl` (e.g. `candidates/Error.tpl:17-21` "A fatal error has occurred."), careers `die()` blank pages (`CareersUI.php:103`), JPG no-data images, and `indicator*.gif`.

### 5.15 Notifications / toasts (P1)
- **Purpose.** Transient confirmation of completed actions ("Status changed to Interviewing. Undo"). Persistent in-app notifications (T32) are a separate Notification Center pattern, P3.
- **Anatomy.** A toast region (top layer, inline-end bottom; it mirrors in RTL) holding toasts: an icon, a message, an optional action ("Undo", "View"), and a dismiss button.
- **States.** Info/success (polite), warning, error. **Errors that need action are not toasts**; they are inline or a dialog.
- **A11y.**
  - One persistent live region per page, present at load (`role="status"`, `aria-live="polite"`), so messages announce reliably (4.1.3).
  - `role="alert"` only for urgent failures.
  - **Toasts with actions do not auto-dismiss**, or last ≥ 10 s and pause on hover/focus (SC 2.2.1 timing).
  - The action is also reachable elsewhere, e.g. "Undo" in the activity timeline.
  - Focus is not moved to toasts.
- **Keyboard.** A documented shortcut (F6 region cycling or Alt+T) moves focus to the latest toast. Esc dismisses the focused toast.
- **Responsive.** Full-width at the bottom below `bp-sm`, above the sticky mobile action bar.
- **Data contract.** Client event `oc-toast` with `{ level, messageKey|message, action?: {label, href|event}, timeout? }`. The server can enqueue a toast for the next page via a flash message in the session (no-JS path).
- **Replaces.** 132 `alert()` calls used for feedback, and success text rendered inside iframe modals then followed by a parent reload (`AddActivityChangeStatusModal.tpl:257-291`).

### 5.16 Confirmations (P1)
- **Purpose.** Protect destructive or irreversible actions, and prefer **undo** where the domain allows it (soft delete, T29; principle 3).
- **Anatomy.** An APG **Alert Dialog**: a title stating the action and the object ("Delete candidate Jane Doe?"), consequences (what else is affected: "3 pipeline entries and 2 attachments will be removed"), an optional typed confirmation for bulk or irreversible actions, a **Cancel** button (default focus: least destructive) and a danger button labelled with the verb ("Delete candidate"), not "OK".
- **States.** Idle, submitting, error.
- **A11y.** `role="alertdialog"`, `aria-labelledby`, `aria-describedby` pointing at the consequence text. Focus starts on Cancel. Esc = Cancel.
- **Keyboard.** As in the dialog.
- **Responsive.** As in the dialog (full-screen sheet below `bp-sm`).
- **Data contract.** The action is a **POST/DELETE with a CSRF token**, never a GET link. `GET /api/v1/{resource}/{id}/delete-impact` supplies the consequence text. The server returns `{ ok, undoToken?, undoExpiresAt? }`, which enables an "Undo" toast.
- **Replaces.** 28 `confirm()` calls guarding GET deletes (`candidates/Show.tpl:228,383,432`, `companies/Show.tpl:227`, `contacts/Show.tpl:209`, `joborders/Show.tpl:330`), and the unguarded e-mail template delete (`settings/EmailTemplates.tpl:135`) (UX-013).

### 5.17 Candidate card (P2)
- **Purpose.** A compact person summary for board, mobile list rows, search results, duplicates review and hiring-manager review (T43).
- **Anatomy.** An `<article>` containing:
  - a name heading (a link to the profile; the **only** primary link, which forms the card's accessible name);
  - an optional avatar or initials (decorative);
  - current title/company, location;
  - status badge(s) (stage, hot);
  - key facts (last activity date via `<time datetime>`, source, owner);
  - a tags list;
  - a row-actions menu button ("Actions for Jane Doe").
- **Variants.** List row (below `bp-md`), search suggestion (condensed), duplicate comparison (side by side with differences highlighted by text markers, not colour only), review card (hiring manager: summary + "Advance / Decline with reason" actions).
- **States.** Default, hover, focus-within, selected (checkbox + `selected-bg` + border), stale/updating, restricted (fields masked per permission; shows "Hidden" text, not blank).
- **A11y.** No whole-card click handlers wrapping other interactives; use the stretched-link technique with a single link. The checkbox has a label "Select Jane Doe". Masked fields read "Salary hidden".
- **Keyboard.** Tab → name link → selection checkbox → actions menu.
- **Responsive.** It stacks key facts below `bp-sm` and hides secondary facts behind "More", which is a disclosure.
- **Data contract.** `CandidateSummary { id, displayName, headline?, location?, isHot, owner?: {id, name}, lastActivityAt?, tags?: string[], applications?: {jobId, jobTitle, stage}[], masked: string[] }`. Names are **raw text**, escaped once on output (UX-003).
- **Replaces.** Candidate rows in `home/SearchEverything.tpl`, the dashboard "Important Candidates" grid (`home/Home.tpl`, `home/dataGrids.php`), duplicate lists (`candidates/LinkDuplicity.tpl`), and MRU entries (`lib/MRU.php:150-156`, raw-echo XSS in the fork, UX-006).

### 5.18 Pipeline card and board (P2; board island-eligible)
- **Purpose.** Show applications (candidate × job) by stage with **list parity** and **no drag-only interaction** (T18; WCAG 2.2 SC 2.5.7; `NON_GOALS.md` §4 "Drag-only kanban").
- **Anatomy.**
  - The board is a horizontal set of stage columns. Each column is a `<section>` with a heading ("Interviewing, 12") and a list of pipeline cards.
  - The pipeline card is a Candidate Card variant with: stage age ("in stage 4 days"), next step or scheduled interview, rating summary, and a **"Move to…" menu button** listing the permitted stages, with an optional drag handle.
  - A board/list toggle (the same filters and URL).
  - The bulk bar is shared with the Data Table.
- **States.**
  - Card: default, focused, selected, moving (optimistic, `aria-busy`), failed move (reverted, with an error toast and a "Retry" action), restricted (the user cannot move it; the menu shows the reason).
  - Column: empty ("No candidates in Offered"), collapsed, over WIP limit (optional, text warning).
- **A11y.**
  - **Structure:** columns are labelled lists (`<ul aria-labelledby=column-heading>`).
  - **Primary interaction is the menu button "Move Jane Doe to…"** (APG Menu Button), which also satisfies single-pointer operation (2.5.7).
  - Drag-and-drop is an optional enhancement. When present, the keyboard alternative is the same menu, **not** a custom keyboard-drag mode.
  - The move result is announced via the live region: "Jane Doe moved from Submitted to Interviewing".
  - Moving to a stage that requires a reason or a side effect opens the Drawer (§5.10) status flow, preserving legacy side effects.
  - **[FACT]** The Astryx `kanban-board` template has no `onKeyDown` or `aria-*` usage (`DESIGN_TOOLBOX_RESEARCH.md` §1.5), so it must not be copied as-is.
- **Keyboard.** Tab between cards within a column (or roving tabindex within the column list with ↑/↓, documented); the column heading is reachable by heading navigation; Enter on the name opens the drawer preview; the menu button moves the card.
- **Responsive.**
  - Below `bp-md` the board becomes a **stage-selector (tabs or select) + one column list**, or switches to list view by default. Horizontal scrolling of many columns on phones is not acceptable as the only mode.
  - At `bp-lg`+ columns are side by side with horizontal scroll inside the board region.
- **Data contract.**
  - `GET /api/v1/jobs/{id}/applications?view=board&filter…` returns `{ stages: [{ id, label, category, count, items: ApplicationCard[], nextCursor? }] }`, with per-column pagination (no loading 1,000 cards).
  - `ApplicationCard { applicationId, candidate: CandidateSummary, stageId, enteredStageAt, nextEvent?, rating?, can: { move: bool, allowedStages: string[] } }`.
  - A move uses the §5.10 transition endpoint (idempotency key header). An optimistic update rolls back on 409 conflict ("Moved by Alex 1 min ago. Refresh").
  - Stages come from the workflow template (T15). The default template maps legacy statuses 100–800 (`constants.php:119-129`).
- **Replaces.**
  - "Candidate in Job Order" pipeline table (`modules/joborders/Show.tpl:371-420`), `ajax/getPipelineJobOrder.php` (334 lines, HTML-in-AJAX with a third sorting mechanism, `:208-243`), and `js/pipeline.js` (`execJS` `eval`, `:99-101`).
  - Candidate-side pipeline rows (`candidates/Show.tpl:529-531`).
  - The image-map star rating (`TemplateUtility.php:891-950`), which becomes a radio-group rating inside the card and drawer.

### 5.19 Supporting: Menu, Tooltip, Popover (P1)
- **Menu.** APG **Menu Button** + `role=menu`/`menuitem`, for *actions* only; navigation lists are not menus. Keys: ↑/↓, Home/End, type-ahead, Esc returns focus. Replaces `js/quickAction.js` and `QuickActionMenu::getHtml()` generated JS (`src/OpenCATS/UI/QuickActionMenu.php`).
- **Tooltip.** APG **Tooltip**: shown on hover *and* focus, dismissible with Esc (SC 1.4.13), and never holding essential or interactive content. Replaces Sweet Titles (`js/sweetTitles.js`) and `title`-only icon meaning.
- **Popover.** Native `popover` attribute (top layer) for non-modal rich content, such as a quick preview.

---

## 6. Cross-cutting API conventions for components [RECOMMENDATION]

**[FACT]** No JSON API exists in the fork or upstream today. `ajax.php` returns XML or HTML fragments (`ajax.php:44,59` upstream; `API_AUDIT.md` API-001). Components are therefore specified with two paths:

1. **No-JS / legacy path.** A plain HTML form or link to an `index.php?m=&a=` action, or a new server route, returning a full page. This is required for careers, and for every component whose fallback is listed above.
2. **Enhanced path.** JSON endpoints under a versioned prefix (proposed `/api/v1/…`). They are introduced *per vertical slice* and later become the public API (T38; MOD-006).

**Rules:**
- Both paths call the same server-side service with the same authorisation check. There is no UI-only enforcement (ARCH-007/API-005).
- Every response describing an object includes `can: { … }` capability flags computed server-side. Components render or hide actions from them. Hiding is cosmetic; the server enforces.
- CSRF: state-changing `fetch` requests send the token header `X-CSRF-Token`, taken from `<meta name="csrf-token">` emitted by the shell. **[FACT]** Upstream currently exposes it as a JS global `CATSCsrfToken` and a hidden `csrfToken` field (`lib/TemplateUtility.php:1311-1316`; `js/lib.js:317-322`). The shell should expose both during coexistence.
- Errors use RFC 9457 problem details; validation errors are field-keyed (§5.11).
- Lists use cursor pagination and field selection; bulk operations are jobs (§5.5).
- Dates are ISO-8601 UTC in the API and formatted client- or server-side with the user locale and IANA zone (T42). Upstream #812 adds 12/24-hour preference; components read it from `ShellContext`.
- Concurrency: `ETag`/`If-Match`, or a version field on mutable resources; 409 is surfaced as a conflict state.

---

## 7. Accessibility testing

**Target: WCAG 2.2 AA as a release gate** (T13; principle #8). Evidence goes into a published ACR (`MODERN_ATS_UX_PATTERNS.md` §22). Tooling is to be chosen by the stack ADR; **nothing is installed by this specification.**

| Layer | Automated | Manual | Gate |
|---|---|---|---|
| Tokens | Contrast gate on every pair (`DESIGN_TOKENS.md` §3.6) | Forced-colours and high-contrast screenshots reviewed | Build fails |
| Component (catalog story × state × theme × density × dir) | axe-core rules for WCAG 2.0/2.1/2.2 A+AA run in a real browser (e.g. Playwright + `@axe-core/playwright`, as Astryx does, `DESIGN_TOOLBOX_RESEARCH.md` §1.3); keyboard scripts asserting focus order, Esc and focus return; reduced-motion computed-style check | Per new component: keyboard-only walkthrough; screen-reader pass with NVDA + Firefox/Chrome and VoiceOver + Safari (macOS), plus VoiceOver iOS for careers components; 200% and 400% zoom; text-spacing bookmarklet (1.4.12) | **Zero** axe violations. Unlike Astryx's tolerated baseline of 171 (`DESIGN_TOOLBOX_RESEARCH.md` §1.4), new `oc-` components start with no debt; any exception requires a documented, dated waiver |
| Page (migrated) | axe on each migrated route in E2E, authenticated, with realistic data; landmark, heading and title checks; HTML validation of rendered output (duplicate IDs, label `for` targets; UX-010) | Journey passes: J1–J4 (`UX_UI_AUDIT.md` §2) and `MODERN_ATS_UX_PATTERNS.md` journeys (a)–(c) with keyboard only and one screen reader | Blocking for "migrated" status (`UI_MIGRATION_STRATEGY.md` §5) |
| Legacy (not migrated) | axe in *report-only* mode on legacy routes, tracked as a burn-down metric | n/a | Non-blocking; must not regress |
| Release | Full suite | An external or independent audit before the ACR is published (who performs it is a decision, toolbox prerequisite 2) | ACR published |

- **[FACT]** The repo already configures Behat with Selenium2 Chrome (`test/behat.yml:19-21`). Upstream removed the in-app SimpleTest runner and moved to PHPUnit 13 (`composer.json`, `d5cf733`). **[RECOMMENDATION]** Browser E2E and a11y checks target Playwright (MOD-015), but the Behat/Selenium harness may host axe temporarily if the ADR delays Playwright.
- **Known automated limits [INFERENCE].** axe catches only part of WCAG. Focus order, meaningful names, reading order, live-region timing and drag alternatives need the manual passes above.

---

## 8. Visual regression

- **Scope.** Every catalog story in: light and dark (when shipped), comfortable and compact, LTR and RTL, forced colours (Chromium emulation), and widths 320 / 768 / 1280.
- **Pages.** Each migrated page at the same widths, plus **coexistence snapshots**: the new shell wrapping 3–5 representative *legacy* pages (a DataGrid list, a Show page, a legacy iframe modal open, the settings hub). This detects legacy CSS leakage and shell regressions (`UI_MIGRATION_STRATEGY.md` §3).
- **Tooling [DECISION].** Playwright `toHaveScreenshot` in CI with pinned browser versions and fonts. The system font stack varies by OS, so screenshots run in one pinned container image. Hosted services are optional and subject to the data policy (§9): **no production candidate data in screenshots**, only synthetic fixtures.
- **Threshold.** A small per-pixel tolerance for anti-aliasing. Snapshot updates require reviewer approval in the PR and are never auto-accepted by an agent.

---

## 9. Documentation: component catalog

- **What.** A living catalog of every `oc-` component and pattern, containing: purpose; anatomy diagram; live examples of all states; do/don't; a11y notes (APG pattern link, keyboard table, SR expectations); API (partial parameters, element attributes, properties, events, JSON contract); tokens used; legacy code replaced; status (alpha/beta/stable); changelog.
- **Where [DECISION].**
  - **Option 1:** a static catalog rendered by the app itself (dev-only route, disabled in production), so PHP partials render with the real engine. **[RECOMMENDATION]** Default, because it needs no Node and shows partials and elements exactly as shipped.
  - **Option 2:** Storybook or similar, if the stack ADR adds a Node toolchain. It handles islands well but renders PHP partials only as static HTML snapshots.
- **Status gates.**
  - alpha: API may change, not for production pages.
  - beta: used on ≥ 1 migrated page; a11y manual pass done.
  - stable: used on ≥ 3 pages, zero open a11y defects, visual baselines stable for 2 releases.
- **Design files.** Figma-first vs code-first is an open decision (toolbox prerequisite 9). **[RECOMMENDATION]** Code is the source of truth, and design files mirror the catalog.

---

## 10. Governance for agent design skills and review aids

Postures come from `DESIGN_TOOLBOX_RESEARCH.md` (Summary table, TBX-R01…R11, Synthesis). **[RECOMMENDATION]** Operational rules:

| Resource | Posture | How it is used in OpenCATS | Explicitly not allowed |
|---|---|---|---|
| **Vercel Web Interface Guidelines** (rule content, `vercel-labs/web-interface-guidelines` `command.md` @ `e3d624b`) | **ADOPT as vendored, pinned, adapted checklist** | (1) Vendored copy at a pinned commit inside the repo (proposed `docs/design/review/web-interface-guidelines.md` with a header recording source URL, commit SHA, MIT licence notice and the adaptation log). (2) Adapted: `autocomplete` rule split by context (careers vs recruiter data entry, SC 1.3.5); Title Case rule removed (i18n); "keyboard handlers on all interactive elements" narrowed to custom widgets; zoom guidance fixed (no `maximum-scale`); framework-specific wording (Tailwind/React/Next) made neutral. (3) Each rule mapped to a WCAG 2.2 SC where applicable. (4) Used as a **PR review checklist**: a "UI review" section in the PR template lists the categories, and human and agent reviewers cite findings as `file:line` against the vendored copy. (5) Updated only by a PR that diffs upstream changes. | Installing the `web-design-guidelines` skill as distributed (it fetches instructions from a mutable `main` URL at run time, TBX-R01); running `install.sh` (`curl` from `main`); treating it as a WCAG conformance method |
| **Impeccable** (`pbakaus/impeccable`, skill v4.3.1 / engine v0.1.6) | **TRIAL, sandboxed critique only** | Optional, **manual** design critique of *mock-ups, prototypes and catalog screenshots*, mainly for the careers site, where brand expression matters (`DESIGN_TOOLBOX_RESEARCH.md` Synthesis #4). Its `audit`/`harden`/`clarify` outputs are **advisory input** to human review. Run only after tokens and a `DESIGN.md`-equivalent exist, configured by a human to read OpenCATS tokens, with aesthetic rules disabled (e.g. the "overused fonts / system defaults" rule conflicts with `DESIGN_TOKENS.md` §4). Run in a sandbox or throwaway checkout without write access to repo agent config and with synthetic data only | Installing hooks (TBX-R04); `allowed-tools: Bash(npx impeccable *)` auto-approval (TBX-R05); agent self-persisted suppressions (TBX-R06); the browser extension on sessions with real candidate data (TBX-R07); live mode against the app, since it injects scripts and relaxes CSP (§3.4 risk 6); **any CI gate** based on it |
| **Astryx** (`@astryxdesign/*` 0.6.x) | **TRIAL gated on ADR-UI-001 and D6** | A time-boxed spike on *one* island, `<oc-data-table>` or `<oc-command-palette>`, fed by `--oc-*` tokens, benchmarked against 1–2 established alternatives, with the exit criteria in `DESIGN_TOOLBOX_RESEARCH.md` §1.8 | `astryx init` writing into `AGENTS.md`/`CLAUDE.md` without review (TBX-R10); copying the `kanban-board` template; adoption while 0.x |
| **UI UX Pro Max**, **Emil Kowalski skills** | **REFERENCE-ONLY** | Human reading material (general UX rules; motion craft). Relevant ideas are restated in these specs, not imported | Installing either as an active skill; copying `stack/.claude/settings.json` (`enableAllProjectMcpServers`, `Read(//home/**)`, TBX-R08); Emil's `pick-ui-library` "don't substitute" rule (conflicts with §1.3) |
| **Taste Skill**, **aitmpl.com / claude-code-templates** | **AVOID** | Not used | Any install; sourcing any skill via aggregators (stale or unattributed copies, telemetry on by default; TBX-R02/R03/R11) |

**General rules [RECOMMENDATION], restating `DESIGN_TOOLBOX_RESEARCH.md` Synthesis #3:**
1. **Pinned and vendored.** Any agent-facing instruction file lives in the repo at a recorded upstream commit and is reviewed like code. Nothing fetches instructions at run time.
2. **No hooks.** No auto-running agent hooks (per-edit, stop, pre-tool) are installed from third-party design tools. Agent config directories (`.claude/`, `.cursor/`, `.codex/`, `.github/hooks/`, `AGENTS.md`, `CLAUDE.md`) have a named owner, and changes to them need that owner's review.
3. **Tokens decide taste.** Agent output that conflicts with `DESIGN_TOKENS.md` or this catalog is a defect in the output, not a reason to change tokens.
4. **One checklist, one critique aid, at most one foundation.** No stacking of competing taste skills (`NON_GOALS.md` §4).
5. **Data handling.** No production candidate PII in any agent, design-tool, screenshot or visual-regression context.
6. **Telemetry off** for any tool that has it. No `@latest`/`-y` installs.
7. **Human sign-off.** Agents may propose UI changes and review findings. Merging UI changes requires a human reviewer who has run the §7 manual checks for new components.

---

## 11. Facts vs recommendations

- **FACT:** legacy file and line references, counts and behaviours (from `UX_UI_AUDIT.md`, re-checked where cited: `lib/TemplateUtility.php` printer lines, `lib/Template.php:98-127`, `main.css` selectors, `js/dataGrid.js:679-681`, `subModal.js:94`, `constants.php:119-129`); upstream state at `d5cf733` (jQuery 1.3.2 still in the core list at `lib/TemplateUtility.php:1304`; CSRF `6223ab5`/#693; escaping #697/#761; asset versioning `d642ff0`/#749; XML `ajax.php`; `ajaxMode = false`; 0 ARIA; no `package.json`); Astryx peer dependencies and the kanban-template finding (from `DESIGN_TOOLBOX_RESEARCH.md`).
- **RECOMMENDATION:** the rendering model, layering, all component specs, API conventions, the testing matrix, catalog and governance rules.
- **INFERENCE:** trade-off judgements in §1.2; virtualisation need; limits of automated testing.

## 12. Unknowns / decisions

- **ADR-UI-001** rendering model (depends on D5, D6, D10).
- Whether an existing accessible **web-component** library (vs hand-built) should be evaluated: not researched in Phase 2 [UNKNOWN].
- Data-grid requirements: cell navigation or inline edit, expected row counts (toolbox prerequisite 6).
- Rich-text editor (UX-018) and chart library (MOD-017).
- Catalog tooling and visual-regression hosting.
- Who performs manual AT audits and publishes the ACR (prerequisite 2).
- Upstream alignment (D1): the component CSRF and escaping integration assumes upstream helpers.
