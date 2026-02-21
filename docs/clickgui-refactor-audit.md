# ClickGUI Refactor Audit (CSS-First)

## Scope and Current Decision

1. Scope is `src/routes/clickgui` and direct style dependencies.
2. Current goal is a clean, debt-free style baseline before adding more controls.
3. `Theme Settings` implementation is intentionally deferred.

## Why Priority Changed

1. Recent commits showed style conflicts and specificity fights:
   - `0c334f5` introduced `!important` to make active button states win.
   - `7f66d7f` removed `!important` and raised selector specificity instead.
2. This indicates structural CSS debt, not just incomplete feature work.
3. Therefore, style isolation now takes priority over adding additional setting controls.

## ClickGUI HTML Structure

1. Root container: `.clickgui` in `src/routes/clickgui/ClickGui.svelte`.
2. Left column:
   - `aside.sidebar`
   - top search area (non-detail views)
   - one of 4 sidebar subviews:
     - `ClickGuiHomeView`
     - `ClickGuiCategoryDetailView`
     - `ClickGuiSearchView`
     - `ClickGuiThemeDetailView`
3. Right column:
   - `section.main-content`
   - header (`main-content-title` + settings search input)
   - module settings split layout:
     - `.settings-split-layout`
     - `.settings-column`
     - `.setting-entry`
4. Setting controls mount inside each setting row:
   - `BooleanSettingControl`
   - `TextSettingControl`
   - `ChooseSettingControl`
   - `MultiChooseSettingControl`

## How CSS Is Applied

1. Global app reset and base font are from `src/app.scss`.
2. ClickGUI layout/state styles are written via many `:global(.clickgui ...)` selectors in `src/routes/clickgui/ClickGui.svelte`.
3. View-level styles (`src/routes/clickgui/views/*.svelte`) are mostly scoped via Svelte style hashing.
4. Shared mixins in `src/routes/clickgui/views/shared.scss` are scoped when included, except one deliberate global reveal overlay rule:
   - `:global(.clickgui .item-list.reveal-container .reveal-item)::before`

## CSS Debt and Bleed Risk (Rechecked)

### Confirmed

1. Parent-level global selector controls generic child internals:
   - `.setting-input-control > .reveal-press-content` base styling in `ClickGui.svelte`.
   - Child setting components must fight this with higher specificity.
2. This is the exact pattern that caused the `!important` incident and follow-up specificity workaround.
3. There is dead style surface that increases ambiguity:
   - `.settings-list` selector exists but no active markup uses it.

### Current bleed assessment

1. I do not see confirmed leakage to non-ClickGUI routes right now.
2. The real issue is broad global selectors inside ClickGUI applying to more descendants than intended.

## Re-Prioritized Backlog

### P0 (Do first, debt-free baseline)

1. CSS boundary cleanup:
   - reduce broad `:global(.clickgui ... descendant ...)` usage
   - move shared control base styles into explicit utility classes, not generic descendant selectors
2. Remove parent-overrides-child styling pattern for setting controls.
3. Delete dead selectors and unused style hooks.
4. Keep current visuals, but make cascade predictable without `!important`.

### P1 (After P0)

1. Wire settings search input (currently visual only).
2. Add explicit loading/error view state for initial module fetch.
3. Split style-heavy concerns from `ClickGui.svelte` into clearer modules/files.

### P2 (Feature completion after clean baseline)

1. Add remaining setting editors (`BIND`, ranges, color, etc.).
2. Align module row actions fully with `docs/clickgui-ux.md`.

### P3 (Intentionally deferred)

1. `Theme Settings` implementation.

## Definition of "Debt-Free Enough" Before New Controls

1. No `!important` needed for control states.
2. No selector in ClickGUI styles should target child internals through broad generic descendant chains unless intentionally documented.
3. All active selectors map to real markup (no dead selectors).
4. Visual regression from current baseline is zero or intentional.

## Recent Progress Update (2026-02-21)

1. Implemented sticky UX adjustments:
   - Sidebar search remains pinned in non-detail views.
   - Category detail has a sticky top back-surface band.
   - Main content keeps title/description static, with only settings search sticky.
2. Added module description placement in module config view:
   - Between main title and settings search.
3. Introduced scroll-state styling hook:
   - `surface-scrolled` class from `scrollbarHoverSurface`.
   - Used to apply stronger sticky-region emphasis when scrolled.
4. Browser-specific cleanup:
   - Removed non-slider WebKit-specific CSS from ClickGUI styles.
   - Retained WebKit selectors only for slider thumb/track rules in numeric controls.

## Current Debt Notes After This Pass

1. ClickGUI now has less vendor-specific style surface in core layout files.
2. Main remaining debt is still selector breadth in `ClickGui.svelte` (global descendant style ownership).
3. Behavior for settings search is still visual-only; filtering is not yet wired.
