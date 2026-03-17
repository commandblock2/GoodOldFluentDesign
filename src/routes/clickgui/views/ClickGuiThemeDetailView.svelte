<script lang="ts">
    import {
        revealBorder,
        revealContainer,
        revealItem,
        type RevealContainerOptions,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import { rgbaColorToCssString, type RgbaColor } from "../clickGuiColorUtils";
    import type {
        ClickGuiModuleAccentMode,
        ClickGuiModulePrimaryInteraction,
    } from "../clickGuiThemePreferences";

    export let accentColor = "#4677ff";
    export let baseColor = "#000000";
    export let backgroundColor: RgbaColor = {
        red: 0,
        green: 0,
        blue: 0,
        alpha: 0.15,
    };
    export let textColor = "#ffffff";
    export let dimmedTextColor = "#d3d3d3";
    export let settingsColumnCount = 2;
    export let modulePrimaryInteraction: ClickGuiModulePrimaryInteraction =
        "open-config";
    export let showModuleRowActions = true;
    export let moduleAccentMode: ClickGuiModuleAccentMode = "action-toggle";
    export let subsectionRevealOptions: RevealContainerOptions;
    export let moduleRevealItemOptions: RevealItemOptions;
    export let onCloseDetailView: () => void = () => {};

    function getModuleAccentModeLabel(mode: ClickGuiModuleAccentMode): string {
        if (mode === "tile-background") {
            return "Enabled rows tint the full tile.";
        }

        if (mode === "text-only") {
            return "Enabled rows use accent-colored text.";
        }

        return "Only enabled toggle actions use accent fill.";
    }

    function handleCloseDetailViewContextMenu(event: MouseEvent): void {
        event.preventDefault();
        onCloseDetailView();
    }
</script>

<div class="category-page" use:revealContainer={subsectionRevealOptions}>
    <div class="category-back-shell">
        <div class="item btn-border category-back-control" use:revealBorder>
            <button
                class="btn category-back-btn"
                type="button"
                onclick={onCloseDetailView}
                oncontextmenu={handleCloseDetailViewContextMenu}
                use:revealItem={moduleRevealItemOptions}
            >
                <span class="reveal-press-content">
                    &lt; Theme Settings
                </span>
            </button>
        </div>
    </div>

    <div class="theme-summary-card">
        <div class="theme-summary-section">
            <div class="theme-summary-title">Palette</div>
            <div class="theme-summary-swatches">
                <span
                    class="theme-summary-swatch"
                    style={`--theme-summary-color:${accentColor};`}
                    aria-label={`Accent ${accentColor.toUpperCase()}`}
                    title={`Accent ${accentColor.toUpperCase()}`}
                ></span>
                <span
                    class="theme-summary-swatch"
                    style={`--theme-summary-color:${baseColor};`}
                    aria-label={`Base ${baseColor.toUpperCase()}`}
                    title={`Base ${baseColor.toUpperCase()}`}
                ></span>
                <span
                    class="theme-summary-swatch"
                    style={`--theme-summary-color:${rgbaColorToCssString(backgroundColor)};`}
                    aria-label="Background color"
                    title="Background color"
                ></span>
                <span
                    class="theme-summary-swatch"
                    style={`--theme-summary-color:${textColor};`}
                    aria-label={`Text ${textColor.toUpperCase()}`}
                    title={`Text ${textColor.toUpperCase()}`}
                ></span>
                <span
                    class="theme-summary-swatch"
                    style={`--theme-summary-color:${dimmedTextColor};`}
                    aria-label={`Dimmed text ${dimmedTextColor.toUpperCase()}`}
                    title={`Dimmed text ${dimmedTextColor.toUpperCase()}`}
                ></span>
            </div>
        </div>

        <div class="theme-summary-section">
            <div class="theme-summary-title">Layout</div>
            <div class="theme-summary-copy">
                {settingsColumnCount} column{settingsColumnCount === 1 ? "" : "s"}
            </div>
        </div>

        <div class="theme-summary-section">
            <div class="theme-summary-title">Behavior</div>
            <div class="theme-summary-note">
                Row click defaults to
                {modulePrimaryInteraction === "open-config"
                    ? " opening settings"
                    : " toggling the module"}.
            </div>
        </div>

        <div class="theme-summary-section">
            <div class="theme-summary-title">Row Actions</div>
            <div class="theme-summary-note">
                {showModuleRowActions
                    ? "Inline Toggle and Config buttons are visible."
                    : "Inline Toggle and Config buttons are hidden."}
            </div>
        </div>

        <div class="theme-summary-section">
            <div class="theme-summary-title">Row Accent</div>
            <div class="theme-summary-note">
                {getModuleAccentModeLabel(moduleAccentMode)}
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    @use "./shared.scss" as shared;

    @include shared.category-page-block;
    @include shared.category-back-button-block;

    .category-back-shell {
        position: sticky;
        top: -10px;
        z-index: 2;
        margin: 0 -10px 0;
        padding: 20px 10px 6px;
        background: var(--clickgui-surface-strong-color);
        border-bottom: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.24);
        backdrop-filter: blur(8px) saturate(125%);
        box-shadow: 0 10px 16px rgb(var(--clickgui-base-rgb, 0 0 0) / 0.32);
        transition:
            background-color 140ms ease,
            border-color 140ms ease,
            backdrop-filter 140ms ease,
            box-shadow 140ms ease;
    }

    .category-back-control {
        display: flex;
        padding: 0;
        overflow: hidden;
    }

    .category-back-control > .btn {
        position: relative;
        overflow: hidden;
        display: block;
        width: 100%;
        padding: 6px 8px;
        border: 0;
        background: transparent;
        color: var(--clickgui-text-color);
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    .theme-summary-card {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.16);
        background:
            linear-gradient(
                180deg,
                rgb(var(--clickgui-text-rgb, 255 255 255) / 0.06) 0%,
                rgb(var(--clickgui-text-rgb, 255 255 255) / 0.03) 100%
            ),
            var(--clickgui-panel-background-color);
    }

    .theme-summary-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .theme-summary-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--clickgui-text-dimmed-color);
    }

    .theme-summary-swatches {
        display: flex;
        gap: 8px;
    }

    .theme-summary-swatch {
        width: 18px;
        height: 18px;
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.28);
        background-color: var(--theme-summary-color, transparent);
        box-shadow: inset 0 0 0 1px rgb(var(--clickgui-base-rgb, 0 0 0) / 0.2);
    }

    .theme-summary-copy,
    .theme-summary-note {
        font-size: 12px;
        line-height: 1.5;
        color: var(--clickgui-text-color);
    }

    .theme-summary-note {
        color: var(--clickgui-text-dimmed-color);
    }
</style>
