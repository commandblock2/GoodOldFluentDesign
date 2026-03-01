# ClickGUI Reveal Border Alignment

This document captures a recurring ClickGUI issue and the exact fix pattern.

## Problem

The reveal border (`use:revealBorder`) can render larger than the visible control
(`button`, `label`, `input`) when the border host wrapper stretches beyond the
inner element.

Common symptom:

1. The reveal border appears offset or wider/taller than the control.
2. This often happens on the first implementation attempt for new controls.

## Root Cause

`fluent-reveal-svelte` draws the border on the **border host element**, not on
the inner control node. If the host and inner control do not share the same
box, the reveal border cannot match.

## Fix Pattern

Always make the `revealBorder` host and the visible control use the same layout
box.

### Pattern A: Fit-to-content controls (buttons / compact inputs)

```svelte
<div class="reveal-host reveal-host--fit" use:revealBorder>
  <button
    class="setting-input-control"
    use:revealItem={revealItemOptions}
  >
    <span class="reveal-press-content">Label</span>
  </button>
</div>
```

```scss
.reveal-host--fit {
  display: inline-flex;
  width: max-content;
  max-width: 100%;
  overflow: hidden;
}
```

### Pattern B: Fill-width controls (sliders / full-row fields)

```svelte
<div class="reveal-host reveal-host--fill" use:revealBorder>
  <label
    class="setting-input-control setting-input-control--block"
    use:revealItem={revealItemOptions}
  >
    <span class="reveal-press-content">
      <input class="setting-input-text" />
    </span>
  </label>
</div>
```

```scss
.reveal-host--fill {
  display: flex;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}
```

## Rules (Do / Do Not)

Do:

1. Keep `use:revealBorder` on a direct wrapper of the control.
2. Ensure wrapper width behavior explicitly matches control intent (`fit` vs `fill`).
3. Keep wrapper free of extra padding/margins that the inner control does not share.
4. Keep `revealBorder`/`revealItem` host-item structure stable after mount.

Do not:

1. Attach `use:revealBorder` to a wrapper that stretches by grid/flex while inner
   control remains compact.
2. Rely on implicit width defaults for border host sizing.
3. Add decorative outer layers between host and inner control unless those layers
   share the exact same box.

## Quick Checklist For New Controls

1. Is the border host explicitly `fit` or `fill`?
2. Does the inner control occupy the same width/height box as the host?
3. Is there no extra host-only padding/margin?
4. Does reveal border still match after first render and after resize?

If any answer is "no", fix host sizing first before adjusting reveal colors/effects.
