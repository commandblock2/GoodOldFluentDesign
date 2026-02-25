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
   - `BindSettingControl`
   - `ColorSettingControl`
   - `TextSettingControl`
   - `ChooseSettingControl`
   - `ChoiceSettingControl`
   - `MultiChooseSettingControl`
   - `NumberSettingControl`
   - `NumberRangeSettingControl`

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

1. Add remaining setting editors for non-covered types (`BLOCKS`, list variants, vectors, `KEY`, `FILE`, `CURVE`).
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

## Recent Progress Update (2026-02-25)

1. Added `CHOICE` setting support in ClickGUI:
   - tab-style selector control
   - nested active-tab content rendering, aligned with configurable group layout
   - keyed tab-content remount on active tab change
2. Added fail-early `CHOICE` payload validation:
   - empty `choices` map
   - missing/invalid `active` key
   - non-container active tab payload (`valueType` mismatch)
3. Fixed `MULTI_CHOOSE` visual reactivity issue:
   - active/locked/pressed state bindings now resolve from live expressions each render
   - avoids stale visual state that previously only refreshed after remount/reopen

## Current Debt Notes After This Pass

1. ClickGUI now has less vendor-specific style surface in core layout files.
2. Main remaining debt is still selector breadth in `ClickGui.svelte` (global descendant style ownership).
3. Behavior for settings search is still visual-only; filtering is not yet wired.

## Setting Coverage Snapshot (2026-02-25)

1. Total `ModuleSetting` variants in `src/integration/types.ts`: `22`.
2. Implemented in the current ClickGUI settings flow (`SettingEntry` + guards + controls): `13`.
3. Not implemented in the current ClickGUI settings flow: `9`.

### Implemented (`13`)

1. `BOOLEAN`
2. `TEXT`
3. `BIND`
4. `COLOR`
5. `CHOOSE`
6. `CHOICE`
7. `MULTI_CHOOSE` (and legacy typo `MUTLI_CHOOSE`)
8. `FLOAT`
9. `INT`
10. `FLOAT_RANGE`
11. `INT_RANGE`
12. `CONFIGURABLE`
13. `TOGGLABLE` / `TOGGLEABLE`

### Not Implemented (`9`)

1. `BLOCKS`
2. `LIST`
3. `REGISTRY_LIST`
4. `ITEM_LIST`
5. `VEC2`
6. `VEC3`
7. `KEY`
8. `FILE`
9. `CURVE`

### Current Unsupported Behavior

1. Unsupported setting types fall back to JSON rendering in `src/routes/clickgui/setting/SettingEntry.svelte`.

## Full Test Suite Plan (Including Playwright Regression Coverage)

### Objective

1. Prevent UI lockups caused by reactive layout feedback loops.
2. Detect repeated unintended API calls (for example bind label lookups) early.
3. Keep deterministic layout behavior verifiable as settings evolve.

### Test Layers

#### Layer 1: Unit Tests (Node test runner)

1. Keep existing key-generation coverage (`tests/settingEntryKey.test.mjs`).
2. Add pure-layout tests for deterministic column assignment:
   - same input settings + same measured heights => identical column output
   - estimate-only phase produces stable initial output
   - measured phase converges and stays stable when heights stop changing
3. Add bind lookup policy tests (small utility-level tests):
   - one in-flight request per key
   - cached failure is surfaced (no silent retry loop)
   - explicit retry path clears failure cache

#### Layer 2: Component/Integration Tests (Svelte runtime harness)

1. Mount `ClickGui` with fixture module settings that include deep nested groups (Scaffold/HUD-like payloads).
2. Mock `ResizeObserver` + `requestAnimationFrame` and assert:
   - finite convergence of layout updates
   - no unbounded remount/update cycle
   - stable column assignment after convergence
3. Mount `BindSettingControl` with failing key lookup and assert:
   - visible inline error state appears
   - no repeated hidden retries
   - retry button triggers exactly one new request attempt

#### Layer 3: End-to-End + Regression (Playwright)

1. Add Playwright suite under `tests/e2e/clickgui/`.
2. Introduce deterministic network stubs/fixtures for:
   - `/api/v1/client/modules`
   - `/api/v1/client/modules/settings?name=...`
   - `/api/v1/client/input?key=...`
3. High-priority regression scenarios:
   - Open Scaffold settings and keep page idle for N seconds; app remains interactive.
   - Assert bind label endpoint request count is bounded (`<= 1` per key unless user clicks retry).
   - Scroll + click controls repeatedly; clicks still produce state changes (no frozen input path).
   - Toggle `MULTI_CHOOSE` options and assert button visual state updates without reopening module settings.
   - Open/close module settings repeatedly; no growth in in-flight bind lookup requests.
4. Add a stress case with mixed setting types and large nested payload to simulate real-world heavy screens.

#### Layer 4: Performance Guardrails (Playwright + browser metrics)

1. Capture long-task style proxies during key flows:
   - repeated layout frames
   - interaction latency between click and visible state update
2. Fail CI on clear regressions:
   - request-count threshold exceeded
   - interaction timeout exceeded
   - convergence timeout exceeded

### CI Plan

1. `npm run test` remains required (unit).
2. Add `npm run test:e2e` for Playwright regression suite.
3. Add staged gating:
   - PR gate: core Playwright smoke + request-count checks.
   - Nightly gate: full stress/perf scenarios.

### Implementation Milestones

1. Milestone A:
   - extract deterministic column balancing into a testable utility
   - add unit tests for estimate/measured convergence
2. Milestone B:
   - add bind lookup policy tests + component harness tests
3. Milestone C:
   - add Playwright smoke suite with fixture-backed network interception
4. Milestone D:
   - add stress/perf thresholds and make them part of nightly CI

### Exit Criteria

1. No reproduction of "scroll works but UI input is stuck" in automated Playwright regression runs.
2. No repeated silent bind lookup request loops.
3. Deterministic settings layout remains stable after measurement convergence.
