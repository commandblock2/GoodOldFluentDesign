<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { BooleanSetting } from "../../../integration/types";

    export let setting: BooleanSetting;
    export let onChange: (checked: boolean) => void = () => {};
    export let revealItemOptions: RevealItemOptions;

    function toggleValue() {
        onChange(!setting.value);
    }

    function handleToggleKeydown(event: KeyboardEvent) {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            onChange(false);
            return;
        }

        if (event.key === "ArrowRight") {
            event.preventDefault();
            onChange(true);
            return;
        }
    }
</script>

<div class="toggle-shell" use:revealBorder>
    <button
        class="toggle-btn"
        class:enabled={setting.value}
        type="button"
        role="switch"
        aria-checked={setting.value}
        aria-label={`Enabled: ${setting.value ? "on" : "off"}`}
        onclick={toggleValue}
        onkeydown={handleToggleKeydown}
        use:revealItem={revealItemOptions}
    >
        <span class="reveal-press-content">
            <span class="toggle-state" aria-hidden="true">
                {setting.value ? "On" : "Off"}
            </span>
        </span>
    </button>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .toggle-shell {
        display: inline-flex;
    }

    .toggle-btn {
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
    }

    .toggle-btn > .reveal-press-content {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 66px;
        height: 24px;
        padding: 0 10px;
        border: 1px solid rgba($clickgui-text-color, 0.32);
        background-color: rgba($clickgui-text-color, 0.14);
        transition:
            background-color 120ms ease,
            border-color 120ms ease;
    }

    .toggle-state {
        color: rgba($clickgui-text-dimmed-color, 0.9);
        font-size: 12px;
        letter-spacing: 0.03em;
        font-weight: 600;
        transition: color 120ms ease;
    }

    .toggle-btn.enabled > .reveal-press-content {
        border-color: rgba($accent-color, 0.95);
        background-color: rgba($accent-color, 0.2);
    }

    .toggle-btn.enabled .toggle-state {
        color: $clickgui-text-color;
    }

    .toggle-btn:focus-visible {
        outline: 2px solid rgba($accent-color, 0.45);
        outline-offset: 2px;
    }
</style>
