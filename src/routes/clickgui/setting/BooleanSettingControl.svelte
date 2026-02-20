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

<div class="setting-input-shell" use:revealBorder>
    <button
        class="setting-input-control toggle-btn"
        class:setting-input-control--enabled={setting.value}
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

    .toggle-btn {
        cursor: pointer;
        --reveal-focus-color: #{$accent-color};
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.36)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.18)};
        --setting-control-border-radius: 0px;
        --setting-control-padding-inline: 12px;
    }

    .toggle-state {
        color: rgba($clickgui-text-dimmed-color, 0.9);
        font-size: 12px;
        letter-spacing: 0.03em;
        font-weight: 600;
        transition: color 120ms ease;
    }

    .toggle-btn.setting-input-control--enabled {
        --setting-control-border-color: #{$accent-color};
        --setting-control-background-color: #{$accent-color};
    }

    .toggle-btn.setting-input-control--enabled .toggle-state {
        color: $clickgui-text-color;
    }

</style>
