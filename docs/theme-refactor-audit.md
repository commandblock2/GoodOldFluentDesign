# Theme Refactor Audit (Non-ClickGUI)

## Scope

This document covers theme problems outside `src/routes/clickgui`.  
ClickGUI-specific findings are tracked in `docs/clickgui-refactor-audit.md`.

## Current Health Snapshot

1. Build passes: `npm run build`.
2. Typecheck fails: `npm run check` (6 errors in non-ClickGUI files).

## Problems (Prioritized)

### High

1. Runes mode is not consistently followed in non-ClickGUI routes/components.
   - Legacy `$:` appears in many files, including:
     - `src/routes/menu/singleplayer/Singleplayer.svelte:32`
     - `src/routes/menu/proxymanager/ProxyManager.svelte:34`
     - `src/routes/menu/multiplayer/Multiplayer.svelte:51`
     - `src/routes/hud/elements/Text.svelte:54`
     - `src/routes/menu/common/header/account/Account.svelte:34`
   - This conflicts with project runes expectations and increases migration risk.

2. Tooltip component leaks event listeners.
   - Listeners are attached in `afterUpdate` with no teardown:
     - `src/routes/menu/common/ToolTip.svelte:11`
     - `src/routes/menu/common/ToolTip.svelte:12`
     - `src/routes/menu/common/ToolTip.svelte:16`

3. WebSocket integration has lifecycle/protocol issues.
   - Connection starts at module import time: `src/integration/ws.ts:123`.
   - Reconnect timer is unconditional: `src/integration/ws.ts:17`.
   - Ping interval is global and never cleaned up: `src/integration/ws.ts:113`.
   - Host builder forces insecure `ws://`: `src/integration/host.ts:11`.
   - `isStatic` short-circuit in app mount does not prevent WS module side effects: `src/App.svelte:43`.

4. REST layer has inconsistent error handling (mostly unchecked responses).
   - Typical unchecked fetch path: `src/integration/rest.ts:43`.
   - Mutations also do not check `response.ok`: `src/integration/rest.ts:271`.
   - Only selected endpoints validate status (example): `src/integration/rest.ts:723`.

5. Typecheck errors currently block a clean refactor baseline.
   - Null mount target: `src/main.ts:7`.
   - `WrappedSetting` typing mismatch in multiplayer: `src/routes/menu/multiplayer/Multiplayer.svelte:184`.
   - Tab component type mismatch at modal usage:
     - `src/routes/menu/altmanager/addaccount/AddAccountModal.svelte:44`
     - `src/routes/menu/altmanager/directLogin/DirectLoginModal.svelte:32`
   - Missing `dateformat` declarations: `src/routes/menu/singleplayer/Singleplayer.svelte:23`.

### Medium

6. Browser route can mutate `browser` before load completes.
   - `browser` is declared but uninitialized: `src/routes/browser/Browser.svelte:16`.
   - Event handler mutates immediately: `src/routes/browser/Browser.svelte:53`.

7. HUD text effect style appears malformed.
   - `drop-shadow(...)` expression is missing a closing parenthesis in the interpolated value:
     - `src/routes/hud/elements/Text.svelte:70`

8. Long-lived subscriptions/timers are created without explicit teardown in some places.
   - Header notifications subscribe at script scope: `src/routes/menu/common/header/Notifications.svelte:17`.
   - `ArrayList` subscribes to store without unsubscribe: `src/routes/hud/elements/ArrayList.svelte:39`.
   - `Taco` uses global `setInterval` without clear: `src/routes/hud/elements/taco/Taco.svelte:3`.

9. Module-level side effects in theme config couple import order to runtime behavior.
   - WS listener registration at import time: `src/theme/theme_config.ts:21`.
   - Async settings fetch at import time: `src/theme/theme_config.ts:24`.

10. Input normalization in reactive statements can cause edit/caret jitter.
    - `src/routes/menu/multiplayer/AddServerModal.svelte:18`
    - `src/routes/menu/multiplayer/EditServerModal.svelte:18`

11. Proxy manager has rough edges in production behavior.
    - Debug log in reactive block: `src/routes/menu/proxymanager/ProxyManager.svelte:39`.
    - Fallback country flag path resolves to missing `unknown.svg`:
      - reference: `src/routes/menu/proxymanager/ProxyManager.svelte:199`

### Low

12. Responsive strategy relies heavily on CSS `zoom`.
    - Menu: `src/routes/menu/common/Menu.svelte:46`
    - Modal: `src/routes/menu/common/modal/Modal.svelte:109`
    - This is brittle across browsers and accessibility scaling settings.

## Refactor Direction (Non-ClickGUI)

1. Make `npm run check` green first (baseline for safe refactors).
2. Finish runes migration in non-ClickGUI files (`$derived`/`$effect` replacements).
3. Centralize HTTP request handling (status checks + shared error mapping).
4. Refactor WS initialization to explicit start/stop with protocol-safe URL building.
5. Remove script-scope side effects and add teardown for timers/subscriptions.
