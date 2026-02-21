# AGENTS

## Svelte Runes Mode
- This project uses **Svelte runes mode**.
- Do **not** use legacy reactive statements (`$:`).
- Use `$derived(...)` and `$effect(...)` instead.
- Prefer **expression form** for `$derived`, e.g.:
  - ✅ `$derived(searchQuery.trim().toLowerCase())`
  - ❌ `$derived(() => searchQuery.trim().toLowerCase())`

## TypeScript Expectations
- Treat derived values as **values**, not functions.
- Avoid passing derived values as callbacks or indexing with unknown types.

## Fail Early Strategy
- Prefer **fail-early** behavior over silent fallback when requirements are unclear or runtime data is inconsistent.
- If payloads contradict declared types/contracts, stop the flow, surface an explicit error, and include actionable diagnostics.
- Do not silently remap/guess values unless there is a documented compatibility rule.
- If critical context/spec is missing, ask for clarification before adding broad heuristics.

## Tooling / Execution Notes
- Be prepared for runs where tool usage is disabled.
- When tools are unavailable, respond with direct file content only, following the required code block format.

## UI Notes
- Search UI is expected to stay in the top-left.
- Search results should group modules by category.
- Default view lists “Quick Settings”, “Click GUI” (all module categories), and “Theme Settings” (single entry).
