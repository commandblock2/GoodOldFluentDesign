# ClickGUI UX Goals

This document defines interaction goals for the ClickGUI module browser and settings flow.

## Product goals

1. Let users find the module they need quickly.
2. Let users configure module options efficiently.
3. Keep quick enable/disable actions available without making accidental toggles common.
4. Support experienced users with low-friction shortcuts.

## Observed user flows

1. Trial flow:
   - User searches for a module.
   - User toggles module to test behavior.
   - User often closes ClickGUI and evaluates results in-game.
2. Tuning flow:
   - User opens a specific module repeatedly.
   - User adjusts settings, then tests.
   - This loop is usually more frequent than pure on/off toggling.
3. Power-user flow:
   - User expects very fast access with minimal clicks.
   - User usually relies on keybinds for recurring on-demand toggles.

## Interaction model

1. Module row has two clear actions:
   - Primary action: row click.
   - Secondary action: explicit quick toggle control.
2. Primary action is configurable by preference:
   - `Open Config` (recommended default).
   - `Toggle Module` (legacy compatibility).
3. Secondary controls stay consistent in both modes:
   - Toggle control always toggles.
   - Config control (gear/chevron) always opens module settings.
4. Module settings page should always expose:
   - `Enabled` state.
   - `Keybind` control near the top.

## Design decision

Defaulting row click to `Open Config` aligns with current high-frequency tuning behavior and reduces accidental toggles while browsing.

To preserve user inertia and existing expectations, provide a persistent preference that switches row-click behavior to `Toggle Module`.

## Anti-pattern to avoid

Do not optimize for repeatedly opening ClickGUI just to toggle modules on demand.

For repeated on/off behavior, promote keybind assignment as the intended path.

## UX constraints

1. Search remains in the top-left in non-detail views.
2. Search results group modules by category.
3. Default non-search structure remains:
   - `Quick Settings`
   - `Click GUI` (module categories)
   - `Theme Settings`

## Implementation Snapshot (2026-02-21)

### Completed behavior

1. Sidebar search remains pinned at the top-left in non-detail views.
2. Category detail back area (`< Category`) is sticky and now rendered as a stronger surface band.
3. Main content keeps title/description in normal flow, while only the settings search bar is sticky.
4. Module description is shown between module title and settings search bar when available.
5. Sticky surfaces now gain stronger visual treatment when scrolled (`surface-scrolled` state class).

### Visual system currently applied

1. Base surfaces:
   - `--clickgui-surface-color` for panel background.
   - `--clickgui-surface-strong-color` for controls and sticky bands.
2. Sticky search/back regions:
   - Transparent/soft at rest.
   - Stronger tint + blur + shadow once the panel is scrolled.
3. Category back band:
   - Full-width band extends to top corner.
   - Gradient overlay + divider + shadow for stronger separation.
   - Button size itself remains unchanged.
4. Settings input controls:
   - Shared rectangular control language.
   - Accent focus ring for keyboard/mouse focus.

### Interaction details

1. Sidebar states:
   - Home/search/theme views use the standard sticky search zone.
   - Category detail view uses the sticky back band.
2. Main content states:
   - Header text is static.
   - Settings search remains sticky for long setting lists.
3. Scroll responsiveness:
   - `scrollbarHoverSurface` toggles `surface-scrolled` when `scrollTop > 0`.
   - Scrolled class drives stronger sticky-surface appearance.

## Cross-Browser Policy (current)

1. Non-slider WebKit-specific CSS support has been removed from ClickGUI styles.
2. WebKit support is intentionally retained only for slider/thumb styling in numeric slider controls.
3. Standard properties (for example `backdrop-filter`, `scrollbar-width`) remain in use where applicable.

## Known Technical Constraints

1. Backdrop blur visibility depends on runtime/browser compositing support and scene contrast.
2. Current project-wide typecheck still fails from pre-existing, unrelated files outside ClickGUI.
3. ClickGUI style scope still relies heavily on global descendant selectors in `ClickGui.svelte`.

## Open UX Follow-Ups

1. Wire settings search input to real filtering behavior.
2. Add explicit loading/empty/error states in main content panel for non-module pages.
3. Decide whether sticky surface intensity should be user-theme-configurable.

## Design Principles Used During Refactor

1. Keep primary navigation anchors persistent while scrolling.
2. Favor stronger section separation over larger button hitboxes.
3. Preserve existing muscle memory:
   - Keep button dimensions and layout rhythm stable.
   - Change surrounding surface treatment first.
4. Apply stateful emphasis only when needed (on scroll/focus), not permanently everywhere.
