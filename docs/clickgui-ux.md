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

