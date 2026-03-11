# ClickGUI Refactor Audit (CSS-First)

## Scope and Current Decision

1. Scope is `src/routes/clickgui` and direct style dependencies.
2. Current goal is a clean, debt-free style baseline before adding more controls.
3. `Theme Settings` is implemented, and the row-action/settings-search UX from `docs/clickgui-ux.md` is now wired into the current ClickGUI flow.

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
   - `CurveSettingControl`
   - `FileSettingControl`
   - `KeySettingControl`
   - `RegistryListSettingControl`
   - `TextSettingControl`
   - `MutableListSettingControl`
   - `ChooseSettingControl`
   - `ChoiceSettingControl`
   - `MultiChooseSettingControl`
   - `NumberSettingControl`
   - `NumberRangeSettingControl`
   - `Vec2SettingControl`
   - `Vector3SettingControl`

## How CSS Is Applied

1. Global app reset and base font are from `src/app.scss`.
2. `src/routes/clickgui/ClickGui.svelte` now owns only the root shell, theme variables, and shared scrollbar styling.
3. Layout/state styles are split between:
   - `src/routes/clickgui/ClickGuiSidebar.svelte`
   - `src/routes/clickgui/ClickGuiMainContent.svelte`
4. View-level styles (`src/routes/clickgui/views/*.svelte`) are mostly scoped via Svelte style hashing.
5. Shared mixins in `src/routes/clickgui/views/shared.scss` are scoped when included, except one deliberate global reveal overlay rule:
   - `:global(.clickgui .item-list.reveal-container .reveal-item)::before`

## CSS Debt and Bleed Risk (Rechecked)

### Confirmed

1. The main selector-breadth issue was the parent route owning generic child internals.
2. That debt is now reduced:
   - root shell styles stay in `ClickGui.svelte`
   - setting-control base styles live under the main-content boundary in `ClickGuiMainContent.svelte`
   - sidebar scroll/sticky styling lives in `ClickGuiSidebar.svelte`
3. Dead `.settings-list` style surface has been removed.

### Current bleed assessment

1. I do not see confirmed leakage to non-ClickGUI routes right now.
2. Remaining risk is now mostly within ClickGUI itself:
   - shared descendant styling in the main-content subtree still needs discipline
   - the deliberate reveal overlay global in `views/shared.scss` should stay documented

## Re-Prioritized Backlog

### P1 (Next)

1. Decide whether the current lightweight empty/loading state cards are sufficient or should be expanded further.
2. Manual-QA the new row-action behavior against dense categories and search-heavy flows.
3. Implement Firefox-style module search ordering/visibility behavior:
   - keep non-matching rows visible
   - highlight matched text
   - promote matching rows toward the top/front

### P2 (Feature completion after clean baseline)

1. Add deferred explanations for separated setting modules in documentation/UX copy (not implemented in this pass).
2. Review whether unsupported `BLOCKS` / `ITEM_LIST` settings should stay on JSON fallback or get native controls.

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

## Recent Progress Update (2026-03-01)

1. Added `MUTABLE_LIST` setting support in ClickGUI:
   - list-of-inputs editor with add/remove row actions
   - guard-based payload validation via `isMutableListSetting`
   - integrated update/persist flow in `ClickGui.svelte` (`onMutableListSettingChange`)
2. Added shared expandable text editor behavior for long content:
   - applied to `TEXT` and `MUTABLE_LIST` item inputs
   - collapsed single-line input in normal state
   - expanded floating multiline editor on overflow/newline
3. Updated setting rendering/plumbing:
   - `SettingEntry` routes mutable-list settings to `MutableListSettingControl`
   - mutable-list callback is threaded through recursive child rendering

## Recent Progress Update (2026-03-04)

1. Added vector setting support in ClickGUI:
   - `VECTOR2_F` via `Vec2SettingControl` (`X`, `Y` inputs)
   - `VECTOR3_D` / `VECTOR3_I` via `Vector3SettingControl` (`X`, `Y`, `Z` inputs)
   - value guard coverage via `isVec2Setting` / `isVec3Setting`
   - integrated update/persist flow in `ClickGui.svelte` (`onVector2SettingChange` / `onVector3SettingChange`)
2. Vector editors keep reveal host/control box alignment:
   - each axis input uses a fill-width reveal host wrapper
   - matches documented `revealBorder` alignment pattern (`docs/clickgui-reveal-border-alignment.md`)
3. Vec3 axis inputs keep default reveal focus behavior:
   - no custom `:focus-within` border/ring override
   - preserves default out-of-border focus rendering
4. Added `KEY` setting support in ClickGUI:
   - dedicated `KeySettingControl` with click-to-listen key capture
   - lookup-backed printable label display + retry path
   - integrated update/persist flow in `ClickGui.svelte` (`onKeySettingChange`)
5. Added remaining runtime-observed setting support in ClickGUI:
   - `FILE` via `FileSettingControl` (`openFileDialog` + reset/open actions)
   - `REGISTRY_LIST` via `RegistryListSettingControl` (registry fetch + searchable toggle list)
   - `CURVE` via `CurveSettingControl` (chart editing: add/drag/remove points, endpoint locks)
   - integrated update/persist flow in `ClickGui.svelte`:
     - `onFileSettingChange`
     - `onRegistryListSettingChange`
     - `onCurveSettingChange`

## Recent Progress Update (2026-03-08)

1. Split the old monolithic `ClickGui.svelte` route shell into focused boundaries:
   - `ClickGuiSidebar.svelte`
   - `ClickGuiMainContent.svelte`
   - pure setting helpers under `src/routes/clickgui/setting/`
2. Extracted pure setting mutation/layout logic:
   - recursive setting tree updates
   - numeric/vector/curve normalization
   - balanced settings-column layout
3. Simplified recursive setting rendering API:
   - `SettingEntry.svelte` now receives one typed `handlers` object instead of threading many separate callbacks
4. Added explicit main-content states in place of raw debug payload output:
   - loading state for module fetch
   - empty/select-a-module state
   - quick-settings placeholder card
5. Top-level module settings display now explicitly prioritizes `Enabled` and keybind-related controls near the top, instead of depending on backend order.
6. Wired real settings search behavior in main content:
   - filters top-level setting sections by name/description/key and nested matches
   - auto-selects the first matching `CHOICE` tab when needed
7. Implemented documented module row actions while preserving the older slim list aesthetic:
   - optional inline `Toggle` and `Config` controls inside the row
   - persistent row-click preference (`Open Config` vs `Toggle Module`)
   - right click on the main row area performs the opposite action
8. Kept module enabled state synchronized between:
   - sidebar/search row toggles
   - the top-level `Enabled` setting in module config
9. Added row-style preferences in theme settings:
   - show/hide inline action buttons
   - enabled-row accent mode (`All Tiles`, `Action Toggle`, `Accent Text`)

## Confirmed Doc/Code Mismatches (2026-03-08)

1. No confirmed doc/code mismatches remain in the implemented ClickGUI scope after this pass.

## Current Debt Notes After This Pass

1. ClickGUI now has a cleaner separation between shell, sidebar, main content, and pure setting logic.
2. Reveal host/item sizing pitfalls are now documented in:
   - `docs/clickgui-reveal-border-alignment.md`

## Setting Coverage Snapshot (2026-03-04)

1. Total `ModuleSetting` variants in `src/integration/types.ts`: `22`.
2. Implemented in the current ClickGUI settings flow (`SettingEntry` + guards + controls): `20`.
3. Not implemented in the current ClickGUI settings flow:
   - runtime-observed payload names: `0`
4. Excluded from current implementation range:
   - `BLOCKS`
   - `ITEM_LIST`

### Implemented (`20`)

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
14. `MUTABLE_LIST` (integration mapping: `LIST`)
15. `VECTOR2_F` (integration mapping: `VEC2`)
16. `VECTOR3_D` / `VECTOR3_I` (integration mapping: `VEC3`)
17. `KEY`
18. `FILE`
19. `REGISTRY_LIST`
20. `CURVE`

### Not Implemented (Runtime-Observed Payload Names) (`0`)

1. None.

### Current Unsupported Behavior

1. Excluded setting types (`BLOCKS`, `ITEM_LIST`) still fall back to JSON rendering in `src/routes/clickgui/setting/SettingEntry.svelte`.

## Runtime ValueType Inventory (2026-02-26)

1. Runtime inventory is collected by `docs/scripts/scan-runtime-setting-types.mjs`.
2. The scanner requires user-provided API base input (CLI argument, environment variable, or interactive prompt). No fixed port is documented.
3. Usage:

```bash
node docs/scripts/scan-runtime-setting-types.mjs --api-base "<api-base-url>"
```

4. Environment variable alternative:

```bash
CLICKGUI_SETTINGS_API_BASE="<api-base-url>" node docs/scripts/scan-runtime-setting-types.mjs
```

5. Snapshot from local scan:
   - modules scanned: `226`
   - successful settings fetches: `226`
   - failed settings fetches: `0`
   - unique runtime `valueType` count: `21`
6. Runtime `valueType` values observed:
   - `BIND`
   - `BOOLEAN`
   - `CHOICE`
   - `CHOOSE`
   - `COLOR`
   - `CONFIGURABLE`
   - `CURVE`
   - `FILE`
   - `FLOAT`
   - `FLOAT_RANGE`
   - `INT`
   - `INT_RANGE`
   - `KEY`
   - `MULTI_CHOOSE`
   - `MUTABLE_LIST`
   - `REGISTRY_LIST`
   - `TEXT`
   - `TOGGLEABLE`
   - `VECTOR2_F`
   - `VECTOR3_D`
   - `VECTOR3_I`
7. Mapping note: this audit's coverage section uses integration-level categories from `src/integration/types.ts`, while runtime payloads can use narrower names.
8. Mapping highlights:
   - runtime `MUTABLE_LIST` maps to integration `ListSetting` abstraction.
   - runtime `VECTOR2_F`, `VECTOR3_D`, and `VECTOR3_I` map to integration vector abstractions (`Vec2Setting`/`Vec3Setting`) with numeric-specialized payload types.
   - runtime currently uses `TOGGLEABLE`; integration also accepts legacy `TOGGLABLE`.
9. Not observed in this runtime snapshot:
   - `MUTLI_CHOOSE`
   - `TOGGLABLE`
10. Excluded from current implementation range:
   - `BLOCKS`
   - `ITEM_LIST`

## Scanner Snippet

```js
function walkSettingTree(setting, moduleName, byType) {
    const valueType =
        typeof setting.valueType === "string" ? setting.valueType : "<undefined>";

    if (!byType.has(valueType)) {
        byType.set(valueType, { settingCount: 0, modules: new Set() });
    }
    const row = byType.get(valueType);
    row.settingCount += 1;
    row.modules.add(moduleName);

    if (["CONFIGURABLE", "TOGGLEABLE", "TOGGLABLE"].includes(valueType)) {
        for (const childSetting of setting.value ?? []) {
            walkSettingTree(childSetting, moduleName, byType);
        }
    }

    if (valueType === "CHOICE") {
        for (const choiceSetting of Object.values(setting.choices ?? {})) {
            walkSettingTree(choiceSetting, moduleName, byType);
        }
    }
}
```

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
