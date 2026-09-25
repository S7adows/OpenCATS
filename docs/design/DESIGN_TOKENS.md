# OpenCATS 2.0: Design Tokens Specification

**Status:** PROPOSED specification (Phase 3). It is not an implementation. Nothing in this document has been added to the application, and no tooling has been installed.
**Companion documents:** `COMPONENT_ARCHITECTURE.md` (the components that consume these tokens) and `UI_MIGRATION_STRATEGY.md` (how tokens and components enter the legacy PHP app).
**Inputs:** `docs/audit/UX_UI_AUDIT.md` (UX-001, UX-005, UX-009, UX-015, UX-019), `docs/competitive/DESIGN_TOOLBOX_RESEARCH.md` (decision prerequisites 3–5, 7), `docs/competitive/MODERN_ATS_UX_PATTERNS.md` §22, `docs/product/PRODUCT_PRINCIPLES.md` #8, `docs/product/TABLE_STAKES.md` T13/T34/T42/T43, and the legacy stylesheet `main.css` at fork base `d607279`.
**Tags:** **[FACT]** means verified in code, by a command, or in a cited source. **[INFERENCE]** is reasoning. **[RECOMMENDATION]** is a proposal. **[UNKNOWN]** needs a decision or more investigation. **[DECISION]** marks an open decision with a named owner document.

---

## 0. Why tokens first

- **[FACT]** The legacy UI has no design system. It uses 44 distinct hex colours in `main.css` and 50 more in inline template styles, 3 font families, 17 inline font sizes and 1,065 inline `style=` attributes (`UX_UI_AUDIT.md` UX-019, §8).
- **[FACT]** Key text pairs fail WCAG 1.4.3 contrast, some as low as 1.37:1. Status is conveyed by colour alone (UX-009; `main.css:225,297,875,891,902`).
- **[FACT]** Upstream OpenCATS has not changed this picture. At `v0.11.1-9-gd5cf733` (2026-09-21) upstream `main.css` still has 0 `@media` rules. Its only colour additions since the fork base are `button.linkButton` (`#00008b`, `#ff0000` hot variant) and `span.statusChangeHighlight` (`#ff6c00`), added with the CSRF work in upstream PR #693 (commit `6223ab5`).
- **[RECOMMENDATION]** Tokens are the one design asset that stays valid whatever the stack ADR (decision D6, `OPEN_CATS_2_PRODUCT_DIRECTION.md` §9) decides. CSS custom properties work in server-rendered `.tpl` pages, in vanilla custom elements and in any framework island. They are therefore the first deliverable of the UI track and the contract every later component is built on. `DESIGN_TOOLBOX_RESEARCH.md` Synthesis #2 states the principle: "Tokens decide taste, not prompts."

---

## 1. Architecture: primitive → semantic → component

```
 ┌─────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────────┐
 │ 1. PRIMITIVE        │──►│ 2. SEMANTIC (themeable)  │──►│ 3. COMPONENT (optional)      │
 │ raw values, no      │   │ intent: text, surface,   │   │ per-component hooks, alias   │
 │ meaning             │   │ action, status, border,  │   │ semantic tokens only         │
 │ --oc-blue-700       │   │ focus, density           │   │ --oc-button-primary-bg       │
 │ --oc-space-4        │   │ --oc-color-action-primary│   │ --oc-table-row-height        │
 └─────────────────────┘   └──────────────────────────┘   └──────────────────────────────┘
        never used              the ONLY layer that            used only inside the
        directly in             themes (dark, high-            component's own CSS
        component CSS           contrast, careers brand,
                                density) override
```

**Rules [RECOMMENDATION]:**
1. Component and page CSS may reference **semantic** or **component** tokens, never primitives. A lint rule enforces this: no `--oc-<hue>-<step>` references outside the token files.
2. Themes (dark, high contrast, a careers brand) override **semantic** tokens only. Primitives never change between themes; the mapping changes.
3. Component tokens exist only when a component needs a tunable hook, such as table row height or dialog width. Each one defaults to a semantic token. Most components need none.
4. Every semantic colour token is defined as a **pair** (foreground and background, or foreground and the surface it sits on), and the pair's contrast is checked at build time (§3.6).
5. No raw hex, px spacing or z-index literal appears in new component CSS. Stylelint rules such as `color-no-hex` and `declaration-property-value-disallowed-list` enforce this. This does not apply to legacy files.

---

## 2. Naming convention

**[RECOMMENDATION]** The pattern is `--oc-{category}-{role}[-{variant}][-{state}]`.

| Segment | Values (closed lists; extending them needs a design-system PR) |
|---|---|
| Prefix | `oc-`, used everywhere: custom properties, class names (`.oc-button`), custom elements (`<oc-dialog>`) and data attributes (`data-oc-theme`). This keeps new code from colliding with 344 legacy global JS functions and legacy CSS ids and classes (`UX_UI_AUDIT.md` §4; `main.css` uses bare names such as `#main`, `.button` and `.note`) |
| category | `color`, `font`, `text` (composite type styles), `space`, `size`, `radius`, `border`, `shadow`, `motion`, `z`, `focus`, `bp` (breakpoints, JSON and JS only) |
| role | For colour: `text`, `bg`, `surface`, `border`, `action`, `status`, `focus`, `link`, `overlay`, `brand`. For space: `inset`, `stack`, `inline`, `gap`, `control` |
| variant | `default`, `muted`, `subtle`, `strong`, `inverse`, `primary`, `secondary`, `danger`, `success`, `warning`, `info`, `neutral`, `accent` |
| state | `hover`, `active`, `selected`, `disabled`, `visited` |

Examples: `--oc-color-text-muted`, `--oc-color-action-primary-bg-hover`, `--oc-color-status-danger-fg`, `--oc-space-inset-md`, `--oc-z-overlay`.

**Direction-neutral names [RECOMMENDATION].** Names use `start`/`end`, never `left`/`right`, for example `--oc-space-inline-start-md`, so the same tokens serve RTL (§11).

---

## 3. Colour

### 3.1 Primitive palette (candidate values)

**[RECOMMENDATION]** These are *starting* values chosen to pass the contrast targets below. Brand decision D10 (`OPEN_CATS_2_PRODUCT_DIRECTION.md` §9) may change hues. Any change must be re-run through the contrast gate in §3.6. The values are generic sRGB hex steps, not a vendor's brand.

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| `neutral` | #f9fafb | #f3f4f6 | #e5e7eb | #d1d5db | #9ca3af | #6b7280 | #4b5563 | #374151 | #1f2937 | #111827 |
| `blue` (brand/action) | #eff6ff | #dbeafe | #bfdbfe | #93c5fd | #60a5fa | #3b82f6 | #2563eb | #1d4ed8 | #1e40af | #1e3a8a |
| `green` (success) | #f0fdf4 | #dcfce7 | #bbf7d0 | #86efac | #4ade80 | #22c55e | #16a34a | #15803d | #166534 | #14532d |
| `amber` (warning) | #fffbeb | #fef3c7 | #fde68a | #fcd34d | #fbbf24 | #f59e0b | #d97706 | #b45309 | #92400e | #78350f |
| `red` (danger) | #fef2f2 | #fee2e2 | #fecaca | #fca5a5 | #f87171 | #ef4444 | #dc2626 | #b91c1c | #991b1b | #7f1d1d |
| `orange` (hot flag) | #fff7ed | #ffedd5 | #fed7aa | #fdba74 | #fb923c | #f97316 | #ea580c | #c2410c | #9a3412 | #7c2d12 |
| `violet` (accent / AI-assist marker) | #f5f3ff | #ede9fe | #ddd6fe | #c4b5fd | #a78bfa | #8b5cf6 | #7c3aed | #6d28d9 | #5b21b6 | #4c1d95 |

Plus `white #ffffff`, `black #000000`, and `transparent`.

**[INFERENCE]** The brand blue sits close in hue to the legacy primary `#6c94eb` (`main.css:100`), so the product stays recognisable. It moves darker so that white-on-blue and blue-on-white both pass AA. The legacy `#6c94eb` on white is **2.97:1**, which fails for text.

### 3.2 Semantic colour tokens (light theme)

Contrast figures are **[FACT]**: WCAG 2.x relative-luminance ratios computed with a script kept in the scratchpad (`phase3/design/contrast.py`) for the exact hex pairs shown.

| Token | Light value | Paired with | Ratio | Target |
|---|---|---|---|---|
| `--oc-color-bg-canvas` | neutral-50 | n/a | n/a | n/a |
| `--oc-color-surface-default` | white | n/a | n/a | n/a |
| `--oc-color-surface-subtle` | neutral-100 | n/a | n/a | n/a |
| `--oc-color-text-default` | neutral-900 | surface-default | 17.74:1 | ≥ 4.5 (1.4.3) |
| `--oc-color-text-muted` | neutral-600 | surface-default / surface-subtle / canvas | 7.56 / 6.87 / 7.23 | ≥ 4.5 |
| `--oc-color-text-subtle` (placeholder, meta; never essential info) | neutral-500 | surface-default / canvas | 4.83 / 4.63 | ≥ 4.5 (**fails 4.39 on surface-subtle; do not use there**) |
| `--oc-color-text-inverse` | white | neutral-700 | 10.31:1 | ≥ 4.5 |
| `--oc-color-link-default` | blue-700 | surface-default / canvas / surface-subtle | 6.70 / 6.41 / 6.09 | ≥ 4.5, **plus underline** (1.4.1) |
| `--oc-color-link-visited` | violet-700 | surface-default | 7.10:1 | ≥ 4.5 |
| `--oc-color-action-primary-bg` | blue-700 | text white | 6.70:1 | ≥ 4.5 |
| `--oc-color-action-primary-bg-hover` | blue-800 | text white | ≥ 8.7:1 | ≥ 4.5 |
| `--oc-color-action-primary-fg` | white | n/a | n/a | n/a |
| `--oc-color-action-danger-bg` | red-700 | text white | 6.47:1 | ≥ 4.5 |
| `--oc-color-border-default` (dividers, decorative) | neutral-200 | n/a | 1.24:1 | decorative only: **not** for control boundaries |
| `--oc-color-border-control` (inputs, checkboxes, toggles) | neutral-500 | surface-default | 4.83:1 | ≥ 3 (1.4.11 non-text) |
| `--oc-color-border-strong` | neutral-600 | surface-default | 7.56:1 | ≥ 3 |
| `--oc-color-focus-ring` | blue-600 | surface-default / subtle / blue-50 | 5.17 / 4.70 / 4.75 | ≥ 3 (1.4.11, 2.4.13 guidance) |
| `--oc-color-overlay-scrim` | neutral-900 at 50% alpha | n/a | n/a | n/a |
| `--oc-color-selected-bg` (selected rows) | blue-50 | text-default on it | 16.30:1 | ≥ 4.5 |

### 3.3 Status colours: never colour alone

**[FACT]** Legacy status is colour-only. Hot is `#ff0000` (4.00:1), submitted is `#ff6c00` (2.84:1) and placed is `#00ff00` (1.37:1) (`main.css:859,875,891`; UX-009). The active sub-tab is shown only by `#cccccc` (`lib/TemplateUtility.php:685`).

**[RECOMMENDATION]** Each status is a *triplet* of tokens, `fg`, `bg` and `border`, plus a **mandatory icon and text label** in the component (`COMPONENT_ARCHITECTURE.md` "Status badge"). WCAG 1.4.1 is met by the text and icon, not by the colour.

| Status token set | fg (text) | bg | border | fg-on-bg ratio | Solid variant (white on) |
|---|---|---|---|---|---|
| `status-neutral` | neutral-700 | neutral-100 | neutral-500 | 9.37 | neutral-700: 10.31 |
| `status-info` | blue-800 | blue-100 | blue-600 | 7.15 | blue-700: 6.70 |
| `status-success` | green-800 | green-50 | green-700 | 6.81 | green-700: 5.02 |
| `status-warning` | amber-800 | amber-50 | amber-700 | 6.84 | amber-700: 5.02 |
| `status-danger` | red-800 | red-50 | red-700 | 7.60 | red-700: 6.47 |
| `status-hot` (OpenCATS "hot" flag) | orange-800 | orange-50 | orange-700 | 6.88 | orange-700: 5.18 |
| `status-accent` (AI-assisted content marker, principle #2) | violet-800 | violet-50 | violet-700 | 8.19 | violet-700: 7.10 |

**Pipeline status → status token (default mapping) [RECOMMENDATION].** Statuses are from `constants.php:119-129`. The workflow engine (MOD-004 / T15) will later allow per-template overrides.

| Legacy status (code) | Stage category (T15) | Token | Icon (semantic name) |
|---|---|---|---|
| No Contact (100), Contacted (200), Candidate Responded (250) | lead / contacted | `status-neutral` | `circle-dashed` |
| Qualifying (300) | screen | `status-info` | `search` |
| Submitted (400) | submitted | `status-info` | `send` |
| Interviewing (500) | interview | `status-info` | `calendar` |
| Offered (600) | offer | `status-warning` | `file-signature` |
| Placed (800) | hired | `status-success` | `check-circle` |
| Not in Consideration (650), Client Declined (700) | dispositioned (T17) | `status-neutral` with strike icon | `x-circle` |

**[INFERENCE]** "Rejected" deliberately does not use `danger` red. A disposition is not an error, and a red rejection state primes negative bias in review lists. `danger` is reserved for destructive actions and errors.

### 3.4 Dark theme (semantic remap)

**[DECISION D10 / toolbox prerequisite 4]** Whether dark mode is a requirement for the recruiter workspace is open. **[RECOMMENDATION]** Build the semantic layer so that dark mode is a remap, not a rewrite. Ship light first, and ship dark once the shell and the data table exist.

| Token | Dark value | Paired with | Ratio |
|---|---|---|---|
| `bg-canvas` | neutral-900 | n/a | n/a |
| `surface-default` | neutral-800 | n/a | n/a |
| `text-default` | neutral-200 | neutral-800 / neutral-900 | 11.86 / 14.33 |
| `text-muted` | neutral-400 | neutral-800 / neutral-900 | 5.78 / 6.99 |
| `link-default` | blue-300 | neutral-800 / neutral-900 | 8.14 / 9.84 |
| `action-primary-bg` | blue-300, with text neutral-900 | n/a | 9.84 |
| `border-control` | neutral-500 | neutral-800 / neutral-900 | 3.04 / 3.67 (≥ 3, marginal on 800: prefer neutral-400 for inputs on raised surfaces) |
| `focus-ring` | blue-400 | neutral-800 / neutral-900 | 5.77 / 6.98 |
| `status-danger-fg` | red-300 | neutral-800 / neutral-900 | 7.73 / 9.35 |
| `status-success-fg` | green-300 | neutral-900 | 12.63 |
| `status-warning-fg` | amber-300 | neutral-900 | 12.30 |
| `status-hot-fg` | orange-300 | neutral-900 | 10.52 |
| `status-accent-fg` | violet-300 | neutral-900 | 9.61 |

- **[RECOMMENDATION]** Set `color-scheme: light dark` on `:root`, so native controls, scrollbars and `<select>` popups follow the theme. This is a Vercel WIG rule adopted in `DESIGN_TOOLBOX_RESEARCH.md` §7.
- **[RECOMMENDATION]** The theme is selected by `data-oc-theme="light|dark|system"` on `<html>`. `system` follows `prefers-color-scheme`. The user preference is stored server-side on the user profile, not in `localStorage` only, so the server can render the correct theme without a flash of the wrong one.
- **[FACT/INFERENCE]** Legacy pages cannot be dark-themed: they carry 1,065 inline styles and raster images with baked backgrounds (`images/tabs/*.jpg`, `images/nodata/*`). **Dark mode applies only to fully migrated pages.** The shell forces `light` on any page that still renders legacy content (`UI_MIGRATION_STRATEGY.md` §2.3, document-level changes the shell introduces).

### 3.5 High contrast and forced colours

- **`prefers-contrast: more` [RECOMMENDATION].** This remaps `text-muted` to `text-default`, `border-control` to `neutral-700` (dark: `neutral-300`), and status `bg` to `surface-default` with a 2 px `border`. The focus ring width goes from 2 px to 3 px.
- **`forced-colors: active` (Windows High Contrast) [RECOMMENDATION].**
  - Do not fight the user's palette. Components must not rely on `background-color` or `box-shadow` alone, since both are removed or overridden.
  - Every control and status badge keeps a real `border` (1 px, `currentColor` or `ButtonText`/`CanvasText`), so boundaries survive.
  - Focus uses `outline`, never `box-shadow` only. Box-shadows are dropped in forced colours.
  - Selected rows use the system colours `Highlight`/`HighlightText`.
  - `forced-color-adjust: none` is permitted **only** on colour swatches in the careers-theme editor.
  - SVG icons use `fill: currentColor`, so they follow `CanvasText`/`LinkText`.
- **[FACT]** The toolbox research found `forced-colors` handling in 21 Astryx source files (`DESIGN_TOOLBOX_RESEARCH.md` §1.4). Forced-colours support is expected of a modern system, so OpenCATS should match it whichever library is used.

### 3.6 Contrast gate (build-time) [RECOMMENDATION]

- The token build computes every declared pair in §3.2–§3.5 for each theme (light, dark, high-contrast) and fails on:
  - text below 4.5:1 (or 3:1 for text ≥ 24 px regular or ≥ 18.66 px bold);
  - non-text UI boundaries and focus indicators below 3:1.
- The careers brand editor runs the same check at save time (§10).
- APCA (the WCAG 3 draft method) may be reported for information, but **WCAG 2.2 AA ratios are the pass/fail gate**. **[INFERENCE]** WCAG 2.2 is the stated target (T13; `DESIGN_TOOLBOX_RESEARCH.md` prerequisite 2), and WCAG 3 is not a Recommendation.

---

## 4. Typography

**[RECOMMENDATION]**
- **Family.** Use the system UI stack: `--oc-font-family-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"` and `--oc-font-family-mono: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`.
  - This needs no web-font download, which matters for self-hosted and offline installs and supports principle #9 (no third-party calls by default).
  - `"Noto Sans"` gives broad script coverage for i18n (T42).
  - **[INFERENCE]** Impeccable's anti-pattern rule against "system defaults" fonts (`DESIGN_TOOLBOX_RESEARCH.md` §3.4 risk 7) is an aesthetic rule. It is overridden here by the privacy and performance principle, and must be disabled if Impeccable is used (`COMPONENT_ARCHITECTURE.md` §9).
  - Careers sites may set a brand font (§10). Self-hosting is preferred; if a brand font loads from a third-party CDN, a consent or privacy notice is needed, and that is a matter for legal review.
- **Units.** Use `rem` for font sizes, so 1.4.4 (resize text) holds. The legacy code uses px and pt, 4 px–36 px (`UX_UI_AUDIT.md` §8).
- **Scale.** Ratio ≈ 1.125–1.2 for a data-dense app. This matches the Impeccable "Operate" register guidance in `DESIGN_TOOLBOX_RESEARCH.md` §3.3, used as reference only.

| Token | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `--oc-text-caption` | 0.75rem (12 px) | 1rem | 400 | Meta and timestamps only; never the sole carrier of essential info; minimum permitted size |
| `--oc-text-body-sm` | 0.8125rem (13 px) | 1.25rem | 400 | Compact table cells |
| `--oc-text-body` | 0.875rem (14 px) | 1.25rem | 400 | Default app text (recruiter workspace) |
| `--oc-text-body-lg` | 1rem (16 px) | 1.5rem | 400 | Careers site body; long-form reading; form inputs on touch (avoids iOS zoom-on-focus) |
| `--oc-text-label` | 0.875rem | 1.25rem | 500 | Form labels, column headers |
| `--oc-text-heading-sm` (h3) | 1rem | 1.5rem | 600 | Section headings |
| `--oc-text-heading-md` (h2) | 1.25rem | 1.75rem | 600 | Panel titles |
| `--oc-text-heading-lg` (h1) | 1.5rem | 2rem | 600 | Page title (exactly one `<h1>` per page; legacy has 0 `<h1>`, `UX_UI_AUDIT.md` §6) |
| `--oc-text-display` | 2rem | 2.5rem | 700 | Careers hero only |

- **Numeric data.** `--oc-font-numeric: tabular-nums` is applied to numeric table columns, counts and dates (WIG rule, `DESIGN_TOOLBOX_RESEARCH.md` §7.3).
- **Line length.** Long text is capped at `--oc-size-measure: 70ch`.
- **Letter-case.** No `text-transform: uppercase` on translatable strings, and no Title-Case rule, because case rules are locale-specific (the WIG conflict noted in `DESIGN_TOOLBOX_RESEARCH.md` §7.3 risk 4).
- **Text spacing (1.4.12).** Components must survive a user stylesheet setting line-height 1.5, paragraph spacing 2×, letter spacing 0.12em and word spacing 0.16em. This rules out fixed-height text containers.

---

## 5. Spacing, sizing and density

### 5.1 Spacing scale (primitive, 4 px base)

`--oc-space-0: 0` · `-1: 0.125rem (2px)` · `-2: 0.25rem (4px)` · `-3: 0.5rem (8px)` · `-4: 0.75rem (12px)` · `-5: 1rem (16px)` · `-6: 1.25rem (20px)` · `-7: 1.5rem (24px)` · `-8: 2rem (32px)` · `-9: 2.5rem (40px)` · `-10: 3rem (48px)` · `-11: 4rem (64px)`.

Semantic spacing aliases are `inset-{xs,sm,md,lg}`, `stack-{xs..xl}`, `inline-{xs..lg}` and `gap-{sm,md,lg}`, and these switch with density.

### 5.2 Density modes

**[DECISION, toolbox prerequisite 5]** The default density must be decided. **[RECOMMENDATION]** Default the recruiter workspace to `comfortable`, offer `compact` as a per-user preference, and make the careers site always `comfortable`. Density is set by `data-oc-density="compact|comfortable"` on `<html>` or on a container, since a single table can be compact inside a comfortable page.

| Semantic token | compact | comfortable | Notes |
|---|---|---|---|
| `--oc-size-control-height` (button, input, select) | 2rem (32 px) | 2.5rem (40 px) | Both ≥ 24 px (SC 2.5.8) |
| `--oc-size-control-height-sm` | 1.5rem (24 px) | 2rem (32 px) | 24 px is the **floor**; never smaller |
| `--oc-size-table-row` | 2rem (32 px) | 2.75rem (44 px) | Row checkbox hit area stays ≥ 24×24 |
| `--oc-size-icon` | 1rem | 1.25rem | Decorative icon glyph; hit area set separately |
| `--oc-size-target-min` | 1.5rem (24 px) | 1.5rem (24 px) | **Constant.** SC 2.5.8 minimum for every pointer target, or the spacing exception (24 px circle does not intersect another target) |
| `--oc-size-target-touch` | 2.75rem (44 px) | 2.75rem (44 px) | Applied under `@media (pointer: coarse)` regardless of density; careers site always |
| `--oc-space-inset-md` | 0.5rem | 0.75rem | Card and panel padding |
| `--oc-space-stack-md` | 0.5rem | 1rem | Vertical rhythm between fields |

**[FACT]** WCAG 2.2 SC 2.5.8 Target Size (Minimum) is 24×24 CSS px, with exceptions (`DESIGN_TOOLBOX_RESEARCH.md` prerequisite 5, citing the w3c/wcag source). **[RECOMMENDATION]** Icon-only buttons in dense tables, such as the legacy pipeline action icons `candidates/Show.tpl:530`, get a 24×24 minimum *hit area* via padding, even when the glyph is 16 px.

---

## 6. Radius, borders, elevation

| Token | Value | Use |
|---|---|---|
| `--oc-radius-none` | 0 | Tables, full-bleed |
| `--oc-radius-sm` | 0.125rem | Badges, checkboxes |
| `--oc-radius-md` | 0.25rem | Buttons, inputs (default) |
| `--oc-radius-lg` | 0.5rem | Cards, dialogs, drawers |
| `--oc-radius-full` | 9999px | Pills, avatars |
| `--oc-border-width-default` | 1px | Controls, dividers |
| `--oc-border-width-strong` | 2px | Selected card, high-contrast mode |

**Elevation.** Shadows are paired with borders, because forced-colours mode drops shadows (§3.5).

| Token | Light | Use |
|---|---|---|
| `--oc-shadow-0` | none | Flat (default for tables and cards in lists) |
| `--oc-shadow-1` | `0 1px 2px rgb(17 24 39 / .08)` | Cards, raised buttons |
| `--oc-shadow-2` | `0 4px 8px rgb(17 24 39 / .12)` | Popovers, menus, toasts |
| `--oc-shadow-3` | `0 12px 24px rgb(17 24 39 / .18)` | Dialogs, drawers |

In dark mode, elevation is expressed mainly by a lighter surface (`surface-default` → `neutral-700` for raised surfaces) rather than by shadow **[RECOMMENDATION]**.

---

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `--oc-motion-duration-instant` | 0ms | n/a |
| `--oc-motion-duration-fast` | 100ms | Hover, press |
| `--oc-motion-duration-base` | 150ms | Menus, popovers, tooltips |
| `--oc-motion-duration-slow` | 250ms | Drawer and dialog enter |
| `--oc-motion-easing-standard` | `cubic-bezier(.2, 0, 0, 1)` | Most transitions |
| `--oc-motion-easing-exit` | `cubic-bezier(.4, 0, 1, 1)` | Exits |

**Rules [RECOMMENDATION]:**
- Under `@media (prefers-reduced-motion: reduce)`, every duration token resolves to `0ms`, except opacity cross-fades, which may keep `--oc-motion-duration-fast`. No parallax, auto-scrolling or card-flying animations appear in the pipeline board.
- Never use `transition: all`; list the properties (WIG rule).
- Animate only `transform` and `opacity`.
- No motion carries meaning on its own. A card that moves stage is also announced (4.1.3, `COMPONENT_ARCHITECTURE.md` Pipeline).
- Nothing flashes more than 3 times per second (2.3.1).
- Emil Kowalski's animation skills are **REFERENCE-ONLY** reading for motion craft (`DESIGN_TOOLBOX_RESEARCH.md` summary #6). The values above are the contract.

---

## 8. Z-index and layering

**[FACT]** Legacy stacking uses ad-hoc literals:

| Value | Selector | Location |
|---|---|---|
| 99 | quick-action and saved-search menus | `main.css:1073,1091,1103` |
| 200–203 | submodal mask, container and title bar | `main.css:933,956,975,990` |
| 1000 | Sweet Titles tooltip | `main.css:1032` |
| 99999 | `suggest.js` autocomplete results | `main.css:1152` |

**[RECOMMENDATION]**
1. Dialogs, drawers, menus, popovers, toasts and tooltips use the browser **top layer**: native `<dialog>.showModal()` and the `popover` attribute. Legacy `z-index` values then cannot cover them, and no z-index arms race with `99999` is needed.
2. For content that cannot use the top layer, such as sticky headers or a sticky bulk-action bar, use this scale:

| Token | Value | Use |
|---|---|---|
| `--oc-z-base` | 0 | n/a |
| `--oc-z-raised` | 10 | Selected card while dragging |
| `--oc-z-sticky` | 100 | Sticky table header, sticky bulk bar, app header. This is above legacy menus (99) and below the legacy submodal (200) on purpose, so a legacy iframe modal opened from a migrated page still covers the shell |
| `--oc-z-legacy-ceiling` | 100000 | Documented only; never used by new code. Marks the level above which legacy (99999) cannot reach |

3. SC 2.4.11 (Focus Not Obscured): sticky elements set `scroll-padding-block-start`/`-end` on the scroll container to their height (token `--oc-size-header-height`), so a focused row is never hidden behind them (`MODERN_ATS_UX_PATTERNS.md` §22).

---

## 9. Breakpoints, layout and focus

### 9.1 Breakpoints

| Token (JSON / JS constant) | Min width | Typical layout |
|---|---|---|
| `bp-sm` | 30em (480 px) | Single column; bottom-anchored primary action on forms |
| `bp-md` | 48em (768 px) | Nav collapses to a menu button below this width; two-column forms |
| `bp-lg` | 64em (1024 px) | Persistent side navigation; list plus detail panel |
| `bp-xl` | 80em (1280 px) | Three regions (nav, list, detail/drawer) |
| `bp-2xl` | 96em (1536 px) | Wider max content width |

- **[FACT/INFERENCE]** CSS custom properties cannot be used inside `@media` conditions. Breakpoints are therefore emitted as a JSON and JS constant module, and as a documented list of literal `em` values that the CSS lint allow-lists. The values are in `em` so they respond to browser zoom.
- **[RECOMMENDATION]** Prefer **container queries** (`@container`) for components such as cards, table toolbars and the filter panel, because the same component renders in full-page and drawer widths. Page-level layout uses viewport breakpoints.
- **Reflow (1.4.10).** Every migrated page must work at 320 CSS px wide (equivalent to 400% zoom at 1280 px) without two-dimensional scrolling. The exception is data tables, which may scroll horizontally inside their own region with a sticky first column.
- **Viewport.** `<meta name="viewport" content="width=device-width, initial-scale=1">` with **no** `maximum-scale` or `user-scalable=no`. This resolves the WIG README inconsistency noted in `DESIGN_TOOLBOX_RESEARCH.md` §7.3 risk 4. **[FACT]** Neither the fork (`lib/TemplateUtility.php:1178-1216`) nor upstream (`lib/TemplateUtility.php:1286-1403` at `d5cf733`) emits a viewport meta tag.

### 9.2 Focus rings

**[FACT]** Legacy passes 2.4.7 only through browser defaults. No `outline:none` exists, and only `.inputbox:focus` restyles, via a background (`main.css:490-493`; `UX_UI_AUDIT.md` §6).

**[RECOMMENDATION]**
- `--oc-focus-ring-width: 2px` (3 px in high-contrast mode), `--oc-focus-ring-offset: 2px`, `--oc-focus-ring-color: var(--oc-color-focus-ring)`.
- Apply the ring with `:focus-visible { outline: var(--oc-focus-ring-width) solid var(--oc-focus-ring-color); outline-offset: var(--oc-focus-ring-offset); }`. Use `outline`, not `box-shadow`, so it survives forced colours.
- On coloured fills, such as the primary button, use a two-tone ring: a 2 px `surface-default` inner gap (the offset) plus the blue outer ring. This keeps ≥ 3:1 against both the control and the page.
- **Aim:** meet SC 2.4.13 Focus Appearance (AAA) sizing where practical. The *gate* is 2.4.7 plus 1.4.11 (AA).
- Never remove focus styles on mouse click (`:focus` vs `:focus-visible`) for text inputs, which always show focus.

---

## 10. Theming for careers-site branding

**[FACT]** Careers templates are raw HTML and CSS fragments stored in the database (`career_portal_template`, `career_portal_template_site`; `db/cats_schema.sql:408-447`; `lib/CareerPortal.php:146-330`). They are rendered raw by `modules/careers/Blank.tpl:18-32` with a fixed 940 px layout (`db/cats_schema.sql:434`). There is no colour picker, logo upload or font setting (`UX_UI_AUDIT.md` §9). Upstream has changed only asset versioning in `Blank.tpl` (commit `d642ff0`, PR #749) and still has no viewport.

**[RECOMMENDATION]** Brand theming is a **constrained subset** of semantic tokens, not arbitrary CSS:

| Brand token (admin-editable) | Maps to | Validation at save time |
|---|---|---|
| `brand.primary` | `--oc-color-action-primary-bg`, `--oc-color-link-default` | White text on it ≥ 4.5:1 **and** it on `surface-default` ≥ 4.5:1. If it fails, the editor proposes the nearest passing shade (darken in OKLCH lightness) and does not save a failing value |
| `brand.onPrimary` | `--oc-color-action-primary-fg` | Derived automatically (white or neutral-900, whichever passes) |
| `brand.surface` | `--oc-color-bg-canvas` | Body text ≥ 4.5:1 on it |
| `brand.fontFamily` | `--oc-font-family-sans` (careers only) | From an allow-list of self-hosted families plus the system stack |
| `brand.radius` | `--oc-radius-md`/`-lg` | Enum: `none`, `sm`, `md`, `lg` |
| `brand.logo` | Header image | Upload with a required `alt` text field; SVG sanitised or rasterised |

- **Delivery.** The server emits the brand as a small generated stylesheet, `careers-theme-<siteId>-<hash>.css`, which is cacheable and CSP-friendly (no inline `<style>`). It is served **after** the token base file, so it only overrides semantic tokens.
- **Backward compatibility.** Existing custom templates in `career_portal_template_site` keep working unchanged in "legacy template" mode. The new default template ("OpenCATS Responsive", replacing "CATS 2.0") is built only from tokens and components. Admins opt in per site. `UX_UI_AUDIT.md` Unknown #5 warns that production sites may carry customised templates.
- **Attribution.** The "Powered by OpenCATS" footer is licence-required (`lib/TemplateUtility.php:816-831`; `careers/Blank.tpl:38-41`). It is rendered by the careers shell outside brand control, with a minimum contrast enforced by the same gate. *This is an engineering note, not legal advice. Exact attribution wording is for legal review (see `OPEN_CATS_2_PRODUCT_DIRECTION.md` §8.2).*
- **Multi-brand (T34, Bar 2).** Each careers site holds its own brand record. The recruiter app is **not** re-branded per careers site. Only the product logo in the app header is configurable.

---

## 11. RTL and internationalisation hooks

**[FACT]** The legacy UI has no i18n framework, uses 1,324 `align=` attributes and physical left/right CSS, and all copy is English (`UX_UI_AUDIT.md` §3, §7). RTL scope is an open decision (`DESIGN_TOOLBOX_RESEARCH.md` prerequisite 7; D9).

**[RECOMMENDATION] (RTL-ready even if no RTL locale ships at launch):**
- New CSS uses **logical properties only**: `margin-inline-start`, `padding-block`, `inset-inline-end`, `text-align: start` and `border-start-start-radius`. Lint bans `left`/`right` in `margin`, `padding`, `text-align`, `float` and `inset` for `oc-` files.
- `dir` and `lang` are set on `<html>` from the user locale (app) or the posting locale (careers). The legacy login and careers pages lack `lang` (`UX_UI_AUDIT.md` §6, 3.1.1).
- Icons carry a `mirror` flag in the icon manifest. Directional icons (arrows, "next", breadcrumb separators) flip under `[dir=rtl]`; others, such as check marks and a clock, never flip.
- Numbers, dates and currency use `Intl.*` on the client and ICU on the server. Tokens contain no locale-specific strings.
- Allow roughly 35% text expansion in fixed-width components (buttons, tabs, badges). No fixed widths on text containers.

---

## 12. Delivery format

**[RECOMMENDATION]**

```
design-tokens/                      (proposed location; created only when implementation starts)
  src/
    primitives/color.json           DTCG-format source ($value/$type)
    primitives/space.json, font.json, radius.json, shadow.json, motion.json, z.json, bp.json
    semantic/light.json             semantic → primitive aliases ("{color.blue.700}")
    semantic/dark.json, high-contrast.json
    semantic/density-compact.json, density-comfortable.json
    component/*.json                (only where §1 rule 3 applies)
  dist/                             GENERATED, committed (the legacy PHP app has no Node build at runtime)
    oc-tokens.css                   :root { --oc-… } + [data-oc-theme=dark] { … } + @media blocks
    oc-tokens.json                  flat, for JS/islands, docs and the careers-theme validator (PHP)
    oc-tokens.d.ts                  types for TS islands (if the stack ADR chooses TS)
    contrast-report.md              generated by the contrast gate (§3.6)
  CHANGELOG.md
```

- **Source format.** JSON following the W3C Design Tokens Community Group format (`$value`, `$type`, `$description`, aliases with `{…}`). **[UNKNOWN]** Confirm the current stable version of the DTCG format at implementation time; it was not fetched in this pass because of egress limits.
- **Build tool [DECISION].** Candidates are Style Dictionary or a small in-repo script. **[INFERENCE]** Either works because the output is plain CSS and JSON. The choice depends on whether the stack ADR introduces Node tooling. If it does not, a PHP CLI script can generate `dist/`. **Nothing is installed by this specification.**
- **Runtime.** One CSS file (`oc-tokens.css`) is loaded by the app shell *before* component CSS. It is inside the cascade layer `oc.tokens` (`UI_MIGRATION_STRATEGY.md` §3.1). It is loaded with `<link rel="stylesheet">`, not `@import`, to avoid the serialised download pattern the legacy head uses (`lib/TemplateUtility.php:1211`).
- **PHP access.** `oc-tokens.json` is readable by PHP for server-side needs: the careers brand validator, e-mail templates that need inline colours, and PDF reports.
- **Size budget.** `oc-tokens.css` ≤ 8 KB gzip for all themes.

---

## 13. Versioning and governance

- **SemVer on the token set [RECOMMENDATION].**
  - **MAJOR:** removing or renaming a semantic or component token, or changing the meaning of a token.
  - **MINOR:** a new token or theme.
  - **PATCH:** value tweaks that keep every contrast pair passing.
- **Deprecation.** A renamed token keeps an alias (`--oc-old: var(--oc-new)`) for at least one MINOR release. The build emits a deprecation list, and the lint warns on use of deprecated tokens.
- **Ownership.** Token changes need a PR reviewed by a design-system owner and pass the contrast gate. Visual regression snapshots are updated in the same PR (`COMPONENT_ARCHITECTURE.md` §8).
- **Agents.** AI agents may *propose* token changes in PRs. No agent skill may write token files automatically, for example through Impeccable hooks or `astryx init` writes (`DESIGN_TOOLBOX_RESEARCH.md` TBX-R04, TBX-R10). See `COMPONENT_ARCHITECTURE.md` §9.
- **Version marker.** `oc-tokens.css` starts with a comment `/* oc-tokens vX.Y.Z */`, and `oc-tokens.json` has `$meta.version`, so bug reports can name the version.

---

## 14. Mapping legacy `main.css` colours to tokens

**[FACT]** The legacy values below come from `main.css` at the fork base. Line numbers are those of `/home/user/OpenCATS/main.css`; upstream line numbers differ by −18 lines above line ~420 because of the header trim in commit `be93937`. Ratios are computed. **[RECOMMENDATION]** The "Token" column is the replacement used when a surface migrates. Legacy CSS is *not* edited in place, except for the containment steps in `UI_MIGRATION_STRATEGY.md`.

| Legacy value | Where (selector, line) | Legacy issue | Token replacement |
|---|---|---|---|
| `#6c94eb` | `#main` background, the tab panel (`:100`) | White text on it 2.97:1; sub-tab `#f4f4f4` on it 2.70:1 (`:225`) | Shell nav uses `surface-default`/`bg-canvas`; brand accent `action-primary-bg` (blue-700, 6.70:1) |
| `#f4f4f4`, `#ccc` | Sub-tab link and hover (`:225,232`); active sub-tab `#cccccc` inline (`TemplateUtility.php:685`) | 2.70:1 / 1.85:1; colour-only active state | `text-default` + `aria-current="page"` + underline/indicator bar |
| `#00008b` | `a:link` (`:82`), `jobLinkCold` (`:848`); upstream `button.linkButton` | Passes (15.3:1), but `text-decoration:none` (`:83`) fails 1.4.1 | `link-default` + underline in body text |
| `#333`, `#666`, `#666666` | Body `p, li` (`:41`), `h2` (`:54`), notes (`:398`, `:411`) | Pass (12.63 / 5.74) | `text-default`, `text-muted` |
| `#ff0000` | Hot job/candidate links (`:859,865,907`), validation error (`:924`), "more" link (`:1014`) | 4.00:1; colour-only hot and error | Hot → `status-hot` badge with icon and text "Hot"; error → `status-danger-fg` + icon + inline message text |
| `#ff6c00`, `#ff6600`, `#f60` | Submitted (`:875,881`), MRU title (`:297`), tooltip em (`:1054`); upstream `span.statusChangeHighlight` | 2.84 / 2.94:1 | Submitted → `status-info` badge "Submitted"; MRU label → `text-muted` heading |
| `#00ff00` | Placed (`:891,902`) | **1.37:1** | `status-success` badge "Placed" |
| `#323232` | Dead job link (`:837`) | Passes; meaning by colour only | `status-neutral` badge "Closed" |
| `#ec3737` | `p.fatalError` background (`:456`) | White text 4.06:1 | Error summary pattern: `status-danger` bg/fg/border + icon |
| `#f9f9d9` | `.inputbox:focus` background (`:493`) | Only focus cue, background only | `:focus-visible` outline ring (§9.2) |
| `#aeaeff` | Row hover (`:613`) | Hover-only emphasis | `selected-bg` for selection; hover uses `surface-subtle` |
| `#486cae`, `#78a3f2`, `#204095` | Submodal title bar (`:980-988`) | White on `#486cae` 5.21 passes; the component itself is inaccessible (UX-005) | Dialog header uses `surface-default` + `text-default`; the component is replaced |
| `#3366cc` | Sweet Titles tooltip (`:1034`) | Tooltip library is 2005-era | Tooltip: `neutral-900` bg + `text-inverse` |
| `#e0e0e0`, `#e2e2e2`, `#eee`, `#f0f0f0`, `#e5eaf0`, `#f4f4f4` | Inactive tab (`:161`), modal body (`:128`), button bg (`:759`), odd rows (`:1363`), details cells (`:690`) | Near-duplicate greys | `surface-subtle` (neutral-100) or `bg-canvas` (neutral-50) |
| `#ccc`, `#bbb`, `#aaa`, `#a4a4a4`, `#999`, `#c0c0c0` | Borders across tables, buttons, forms (`:246,278,409,469,503,760,1213`) | Six near-duplicate borders; control borders below 3:1 | Dividers → `border-default`; control boundaries → `border-control` (4.83:1) |
| `#000080`, `#009900`, `#9999cc`, `#000099` | Table headers (`:517`), stats headers (`:578`), note border (`:396`), career-portal info header (`:1288`) | Arbitrary accent colours | `text-default` headers; `border-default` |
| `#3e4754`, `#2f4f88`, `#6084c8` | Header block text and logo text (`:318,341,350`) | Logo text in CSS colours | Shell header uses `text-default`; the logo becomes an SVG asset |
| `#cccc88` | Recent-search highlight (`:1128`) | Arbitrary | `status-warning` bg (amber-50) for match highlight, with `<mark>` |
| `#000`, `#fff`, `#ffffff`, `#000000` | Many | Pure black text | `text-default` (neutral-900), `surface-default` |

**[FACT]** Inline template colours (50 distinct values, `UX_UI_AUDIT.md` §8) are not mapped one by one here. The per-page migration checklist (`UI_MIGRATION_STRATEGY.md` §5) requires each migrated template to have zero inline `style=` colour.

---

## 15. Acceptance criteria for the token deliverable

- [ ] Every semantic colour pair passes §3.6 in light theme; the dark and high-contrast themes also pass if they ship.
- [ ] No component CSS references a primitive (lint).
- [ ] `forced-colors` screenshots of shell, button, input, badge, table and dialog show every boundary and the focus ring.
- [ ] `prefers-reduced-motion` sets all durations to 0 (a computed-style unit test).
- [ ] The careers brand validator rejects a failing `brand.primary` and proposes a passing one.
- [ ] RTL snapshot of the shell and a form shows mirrored layout with no physical-direction CSS in `oc-` files.
- [ ] `oc-tokens.css` is within the size budget, and a generated `contrast-report.md` is committed.

---

## Facts vs recommendations

- **FACT:** legacy colour counts, selectors and line numbers; computed contrast ratios; legacy z-index literals; absence of a viewport meta tag and `@media` rules in fork and upstream; upstream CSS additions (`6223ab5`/#693) and asset versioning (`d642ff0`/#749); careers DB template structure; WCAG 2.2 SC 2.5.8 24 px minimum (as cited in `DESIGN_TOOLBOX_RESEARCH.md`).
- **RECOMMENDATION:** all token names and values, the three-tier architecture, density defaults, the status mapping, theming rules, the delivery layout and the versioning policy.
- **INFERENCE:** hue continuity with the legacy brand; the reasons "rejected" is not red; that a PHP script could replace Node tooling.

## Unknowns / decisions

- **D10 brand:** final hues and product logo. Any change re-runs §3.6.
- **Dark mode** as a requirement for the recruiter workspace (toolbox prerequisite 4).
- **Default density** (prerequisite 5).
- **RTL launch scope and locales** (prerequisite 7; D9).
- **DTCG format version and build tool**, which depend on the stack ADR (D6).
- **Careers attribution wording** (for legal review; not legal advice).
