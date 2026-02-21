<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { ColorSetting } from "../../../integration/types";

    interface Props {
        setting: ColorSetting;
        onChange?: (value: number) => void;
        revealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: number) => {};

    let {
        setting,
        onChange = defaultChangeHandler,
        revealItemOptions,
    }: Props = $props();

    let colorInputElement: HTMLInputElement | null = null;

    const colorHex = $derived(formatColorHex(setting.value));
    const colorLabel = $derived(colorHex.toUpperCase());

    function formatColorHex(rawValue: number): string {
        if (!Number.isFinite(rawValue)) {
            return "#000000";
        }

        const rgbValue = (Math.trunc(rawValue) >>> 0) & 0x00ffffff;
        return `#${rgbValue.toString(16).padStart(6, "0")}`;
    }

    function composeColorValue(previousValue: number, nextHex: string): number {
        const parsedHex = Number.parseInt(nextHex.slice(1), 16);
        if (!Number.isFinite(parsedHex)) {
            return previousValue;
        }

        const previous = Number.isFinite(previousValue)
            ? Math.trunc(previousValue) >>> 0
            : 0;
        const preservedAlphaBits = previous & 0xff000000;
        const nextUnsigned = (preservedAlphaBits | parsedHex) >>> 0;

        // Keep 32-bit integer semantics for backend compatibility.
        return nextUnsigned | 0;
    }

    function openColorPicker() {
        colorInputElement?.click();
    }

    function handleColorInput(event: Event) {
        const nextHex = (event.currentTarget as HTMLInputElement).value;
        if (!/^#[0-9a-fA-F]{6}$/.test(nextHex)) {
            return;
        }

        const nextValue = composeColorValue(setting.value, nextHex);
        if (nextValue === setting.value) {
            return;
        }

        onChange(nextValue);
    }
</script>

<div class="setting-input-shell" use:revealBorder>
    <button
        class="setting-input-control color-setting-control"
        type="button"
        aria-label={`Pick color for ${setting.name}`}
        onclick={openColorPicker}
        use:revealItem={revealItemOptions}
    >
        <span class="reveal-press-content">
            <span
                class="color-setting-swatch"
                style={`--color-setting-value:${colorHex};`}
                aria-hidden="true"
            ></span>
            <span class="color-setting-label">{colorLabel}</span>
            <input
                class="color-setting-native-input"
                type="color"
                bind:this={colorInputElement}
                value={colorHex}
                tabindex="-1"
                aria-hidden="true"
                oninput={handleColorInput}
                onchange={handleColorInput}
            />
        </span>
    </button>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .color-setting-control {
        cursor: pointer;
        --reveal-focus-color: #{$accent-color};
        --setting-control-padding-inline: 10px;
        --setting-control-min-width: 108px;
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.36)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.18)};
    }

    .color-setting-swatch {
        width: 12px;
        height: 12px;
        flex-shrink: 0;
        border: 1px solid #{rgba($clickgui-text-color, 0.62)};
        background-color: var(--color-setting-value, #000000);
        box-shadow: inset 0 0 0 1px #{rgba($clickgui-base-color, 0.2)};
    }

    .color-setting-label {
        margin-left: 8px;
        font-size: 11px;
        line-height: 1;
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
        color: rgba($clickgui-text-dimmed-color, 0.94);
    }

    .color-setting-native-input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
    }
</style>
