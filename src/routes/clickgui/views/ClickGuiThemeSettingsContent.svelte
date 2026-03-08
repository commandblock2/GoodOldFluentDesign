<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type {
        BooleanSetting,
        FloatSetting,
        TextSetting,
    } from "../../../integration/types";
    import {
        clickGuiThemePresets,
        matchesClickGuiThemePreset,
        type ClickGuiThemePreferences,
        type ClickGuiThemePreset,
    } from "../clickGuiThemePreferences";
    import type { RgbaColor } from "../clickGuiColorUtils";
    import BooleanSettingControl from "../setting/BooleanSettingControl.svelte";
    import ClickGuiColorPicker from "../setting/ClickGuiColorPicker.svelte";
    import NumberSettingControl from "../setting/NumberSettingControl.svelte";
    import TextSettingControl from "../setting/TextSettingControl.svelte";

    interface Props {
        themePreferences: ClickGuiThemePreferences;
        themeLoadError?: string | null;
        revealItemOptions: RevealItemOptions;
        textInputRevealItemOptions: RevealItemOptions;
        onAccentColorChange?: (color: string) => void;
        onBaseColorChange?: (color: string) => void;
        onBackgroundColorChange?: (color: RgbaColor) => void;
        onTextColorChange?: (color: string) => void;
        onDimmedTextColorChange?: (color: string) => void;
        onSettingsSplitCountChange?: (count: number) => void;
        onApplyPreset?: (preset: ClickGuiThemePreset) => void;
        onResetToDefaults?: () => void;
    }

    const defaultColorChangeHandler = (_color: string) => {};
    const defaultBackgroundColorChangeHandler = (_color: RgbaColor) => {};
    const defaultSplitCountHandler = (_count: number) => {};
    const defaultPresetHandler = (_preset: ClickGuiThemePreset) => {};
    const defaultResetHandler = () => {};
    const settingsSplitOptions = [0, 1, 2] as const;

    let {
        themePreferences,
        themeLoadError = null,
        revealItemOptions,
        textInputRevealItemOptions,
        onAccentColorChange = defaultColorChangeHandler,
        onBaseColorChange = defaultColorChangeHandler,
        onBackgroundColorChange = defaultBackgroundColorChangeHandler,
        onTextColorChange = defaultColorChangeHandler,
        onDimmedTextColorChange = defaultColorChangeHandler,
        onSettingsSplitCountChange = defaultSplitCountHandler,
        onApplyPreset = defaultPresetHandler,
        onResetToDefaults = defaultResetHandler,
    }: Props = $props();

    const settingsColumnCount = $derived(themePreferences.settingsSplitCount + 1);
    let previewToggleValue = $state(true);
    let previewSliderValue = $state(1.5);
    let previewTextValue = $state("Combat profile");

    const previewToggleSetting = $derived({
        valueType: "boolean",
        name: "Preview Toggle",
        value: previewToggleValue,
        description: undefined,
        key: "theme.preview.toggle",
    } satisfies BooleanSetting);
    const previewSliderSetting = $derived({
        valueType: "float",
        name: "Preview Slider",
        value: previewSliderValue,
        description: undefined,
        key: "theme.preview.slider",
        range: {
            from: 0.5,
            to: 5,
        },
        suffix: " s",
    } satisfies FloatSetting);
    const previewTextSetting = $derived({
        valueType: "text",
        name: "Preview Text",
        value: previewTextValue,
        description: undefined,
        key: "theme.preview.text",
    } satisfies TextSetting);

    function hexToOpaqueRgbaColor(hexColor: string): RgbaColor {
        return {
            red: Number.parseInt(hexColor.slice(1, 3), 16),
            green: Number.parseInt(hexColor.slice(3, 5), 16),
            blue: Number.parseInt(hexColor.slice(5, 7), 16),
            alpha: 1,
        };
    }

    function rgbaColorToOpaqueHex(color: RgbaColor): string {
        return `#${color.red.toString(16).padStart(2, "0")}${color.green
            .toString(16)
            .padStart(2, "0")}${color.blue.toString(16).padStart(2, "0")}`;
    }
</script>

<div class="theme-settings-page">
    {#if themeLoadError !== null}
        <div
            class="theme-settings-alert"
            role="alert"
            aria-live="polite"
        >
            <div class="theme-settings-alert-copy">
                <h3 class="theme-settings-alert-title">
                    Stored Theme Preferences Are Invalid
                </h3>
                <p class="theme-settings-alert-message">{themeLoadError}</p>
            </div>

            <div class="theme-settings-alert-actions">
                <div class="theme-settings-action-shell" use:revealBorder>
                    <button
                        class="setting-input-control theme-settings-action-btn theme-settings-action-btn--strong"
                        type="button"
                        onclick={onResetToDefaults}
                        use:revealItem={revealItemOptions}
                    >
                        <span class="reveal-press-content">
                            Reset To Defaults
                        </span>
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <section class="theme-section">
        <div class="theme-section-header">
            <div>
                <h3 class="theme-section-title">Live Preview</h3>
                <p class="theme-section-description">
                    Changes apply to the current Click GUI immediately. Use presets
                    for a quick base, then refine the individual colors below.
                </p>
            </div>
        </div>

        <div class="theme-preview-stage">
            <div class="theme-preview-panel">
                <div class="theme-preview-control">
                    <div class="theme-preview-control-label">Button</div>
                    <div class="theme-preview-demo">
                        <BooleanSettingControl
                            setting={previewToggleSetting}
                            onChange={(nextValue) => (previewToggleValue = nextValue)}
                            {revealItemOptions}
                        />
                    </div>
                </div>

                <div class="theme-preview-control">
                    <div class="theme-preview-control-label">Slider</div>
                    <div class="theme-preview-demo theme-preview-demo--block">
                        <NumberSettingControl
                            setting={previewSliderSetting}
                            onChange={(nextValue) => (previewSliderValue = nextValue)}
                            {textInputRevealItemOptions}
                        />
                    </div>
                </div>

                <div class="theme-preview-control">
                    <div class="theme-preview-control-label">Text Input</div>
                    <div class="theme-preview-demo">
                        <TextSettingControl
                            setting={previewTextSetting}
                            onChange={(nextValue) => (previewTextValue = nextValue)}
                            revealItemOptions={textInputRevealItemOptions}
                        />
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="theme-section">
        <div class="theme-section-header">
            <div>
                <h3 class="theme-section-title">Presets</h3>
                <p class="theme-section-description">
                    Apply a full palette and layout baseline in one click.
                </p>
            </div>
        </div>

        <div class="theme-preset-grid">
            {#each clickGuiThemePresets as preset (preset.id)}
                {@const isActive = matchesClickGuiThemePreset(themePreferences, preset)}

                <div class="theme-preset-shell" use:revealBorder>
                    <button
                        class="setting-input-control theme-preset-btn"
                        class:theme-preset-btn--active={isActive}
                        type="button"
                        onclick={() => onApplyPreset(preset)}
                        use:revealItem={revealItemOptions}
                    >
                        <span class="reveal-press-content">
                            <span class="theme-preset-copy">
                                <span class="theme-preset-label">
                                    {preset.label}
                                </span>
                                <span class="theme-preset-description">
                                    {preset.description}
                                </span>
                            </span>

                            <span class="theme-preset-swatches" aria-hidden="true">
                                <span
                                    class="theme-preset-swatch"
                                    style={`--theme-preset-swatch-color:${preset.accentColor};`}
                                ></span>
                                <span
                                    class="theme-preset-swatch"
                                    style={`--theme-preset-swatch-color:${preset.baseColor};`}
                                ></span>
                                <span
                                    class="theme-preset-swatch"
                                    style={`--theme-preset-swatch-color:${preset.textColor};`}
                                ></span>
                                <span
                                    class="theme-preset-swatch"
                                    style={`--theme-preset-swatch-color:${preset.dimmedTextColor};`}
                                ></span>
                            </span>
                        </span>
                    </button>
                </div>
            {/each}
        </div>
    </section>

    <section class="theme-section">
        <div class="theme-section-header">
            <div>
                <h3 class="theme-section-title">Colors</h3>
                <p class="theme-section-description">
                    Accent affects selected controls and focus states. Base, text,
                    and dimmed text shape the overall Click GUI contrast.
                </p>
            </div>
        </div>

        <div class="theme-color-grid">
            <div class="theme-color-card">
                <span class="theme-color-copy">
                    <span class="theme-color-title">Accent</span>
                    <span class="theme-color-description">
                        Active toggles, selection, slider fill, and focus rings.
                    </span>
                </span>

                <span class="theme-color-control">
                    <ClickGuiColorPicker
                        value={hexToOpaqueRgbaColor(themePreferences.accentColor)}
                        onChange={(color) =>
                            onAccentColorChange(rgbaColorToOpaqueHex(color))}
                        {revealItemOptions}
                        ariaLabel="Pick Click GUI accent color"
                        allowAlpha={false}
                        liveUpdate={true}
                    />
                </span>
            </div>

            <div class="theme-color-card">
                <span class="theme-color-copy">
                    <span class="theme-color-title">Base</span>
                    <span class="theme-color-description">
                        Panel background, sticky surface tint, and shadow base.
                    </span>
                </span>

                <span class="theme-color-control">
                    <ClickGuiColorPicker
                        value={hexToOpaqueRgbaColor(themePreferences.baseColor)}
                        onChange={(color) =>
                            onBaseColorChange(rgbaColorToOpaqueHex(color))}
                        {revealItemOptions}
                        ariaLabel="Pick Click GUI base color"
                        allowAlpha={false}
                        liveUpdate={true}
                    />
                </span>
            </div>

            <div class="theme-color-card">
                <span class="theme-color-copy">
                    <span class="theme-color-title">Background</span>
                    <span class="theme-color-description">
                        Outer Click GUI backdrop tint and scene transparency behind
                        the panels.
                    </span>
                </span>

                <span class="theme-color-control">
                    <ClickGuiColorPicker
                        value={themePreferences.backgroundColor}
                        onChange={onBackgroundColorChange}
                        {revealItemOptions}
                        ariaLabel="Pick Click GUI background color"
                        allowAlpha={true}
                        liveUpdate={true}
                    />
                </span>
            </div>

            <div class="theme-color-card">
                <span class="theme-color-copy">
                    <span class="theme-color-title">Text</span>
                    <span class="theme-color-description">
                        Main labels, headings, and enabled control text.
                    </span>
                </span>

                <span class="theme-color-control">
                    <ClickGuiColorPicker
                        value={hexToOpaqueRgbaColor(themePreferences.textColor)}
                        onChange={(color) =>
                            onTextColorChange(rgbaColorToOpaqueHex(color))}
                        {revealItemOptions}
                        ariaLabel="Pick Click GUI text color"
                        allowAlpha={false}
                        liveUpdate={true}
                    />
                </span>
            </div>

            <div class="theme-color-card">
                <span class="theme-color-copy">
                    <span class="theme-color-title">Dimmed Text</span>
                    <span class="theme-color-description">
                        Secondary copy, descriptions, and neutral control labels.
                    </span>
                </span>

                <span class="theme-color-control">
                    <ClickGuiColorPicker
                        value={hexToOpaqueRgbaColor(themePreferences.dimmedTextColor)}
                        onChange={(color) =>
                            onDimmedTextColorChange(rgbaColorToOpaqueHex(color))}
                        {revealItemOptions}
                        ariaLabel="Pick Click GUI dimmed text color"
                        allowAlpha={false}
                        liveUpdate={true}
                    />
                </span>
            </div>
        </div>
    </section>

    <section class="theme-section">
        <div class="theme-section-header">
            <div>
                <h3 class="theme-section-title">Layout</h3>
                <p class="theme-section-description">
                    Settings columns change how module settings are split in the
                    main content area.
                </p>
            </div>
            <div class="theme-layout-summary">
                {settingsColumnCount} Column{settingsColumnCount === 1 ? "" : "s"}
            </div>
        </div>

        <div class="theme-layout-grid">
            {#each settingsSplitOptions as splitCount}
                {@const columnCount = splitCount + 1}
                {@const previewColumns = Array.from(
                    { length: columnCount },
                    (_unused, index) => index,
                )}
                {@const isActive = themePreferences.settingsSplitCount === splitCount}

                <div class="theme-layout-shell" use:revealBorder>
                    <button
                        class="setting-input-control theme-layout-btn"
                        class:theme-layout-btn--active={isActive}
                        type="button"
                        onclick={() => onSettingsSplitCountChange(splitCount)}
                        use:revealItem={revealItemOptions}
                    >
                        <span class="reveal-press-content">
                            <span
                                class="theme-layout-preview"
                                style={`--theme-layout-preview-columns:${columnCount};`}
                                aria-hidden="true"
                            >
                                {#each previewColumns as previewColumn (previewColumn)}
                                    <span class="theme-layout-preview-column"></span>
                                {/each}
                            </span>
                            <span class="theme-layout-copy">
                                <span class="theme-layout-title">
                                    {columnCount} Column{columnCount === 1 ? "" : "s"}
                                </span>
                                <span class="theme-layout-description">
                                    {columnCount === 1
                                        ? "Maximum focus, larger setting cards."
                                        : columnCount === 2
                                          ? "Balanced default split."
                                          : "Denser layout for large modules."}
                                </span>
                            </span>
                        </span>
                    </button>
                </div>
            {/each}
        </div>
    </section>

    <div class="theme-actions">
        <div class="theme-settings-action-shell" use:revealBorder>
            <button
                class="setting-input-control theme-settings-action-btn"
                type="button"
                onclick={onResetToDefaults}
                use:revealItem={revealItemOptions}
            >
                <span class="reveal-press-content">Reset Theme</span>
            </button>
        </div>
    </div>
</div>

<style lang="scss">
    .theme-settings-page {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .theme-settings-alert,
    .theme-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 14px;
        border: 1px solid rgb(var(--clickgui-text-rgb) / 0.16);
        background:
            linear-gradient(
                180deg,
                rgb(var(--clickgui-text-rgb) / 0.06) 0%,
                rgb(var(--clickgui-text-rgb) / 0.03) 100%
            ),
            rgb(var(--clickgui-base-rgb) / 0.36);
        box-shadow: 0 16px 30px rgb(var(--clickgui-base-rgb) / 0.2);
    }

    .theme-settings-alert-actions,
    .theme-actions {
        display: flex;
        justify-content: flex-start;
    }

    .theme-section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
    }

    .theme-settings-alert-copy,
    .theme-section-header > div:first-child {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .theme-settings-alert-title,
    .theme-section-title {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--clickgui-text-color);
    }

    .theme-settings-alert-message,
    .theme-section-description {
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
        color: rgb(var(--clickgui-text-dimmed-rgb) / 0.96);
    }

    .theme-layout-summary {
        flex-shrink: 0;
        padding: 6px 10px;
        border: 1px solid rgb(var(--clickgui-text-rgb) / 0.18);
        background-color: rgb(var(--clickgui-text-rgb) / 0.08);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgb(var(--clickgui-text-dimmed-rgb) / 0.96);
    }

    .theme-preview-stage {
        display: flex;
    }

    .theme-preview-panel {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
        width: 100%;
        padding: 12px;
        border: 1px solid rgb(var(--clickgui-text-rgb) / 0.16);
        background:
            linear-gradient(
                180deg,
                rgb(var(--clickgui-text-rgb) / 0.08) 0%,
                transparent 100%
            ),
            rgb(var(--clickgui-base-rgb) / 0.62);
    }

    .theme-preview-control {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    .theme-preview-demo {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        max-width: 100%;
    }

    .theme-preview-demo--block {
        display: flex;
        width: 100%;
    }

    .theme-preview-control-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgb(var(--clickgui-text-dimmed-rgb) / 0.9);
    }

    .theme-preset-grid,
    .theme-layout-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    }

    .theme-preset-shell,
    .theme-layout-shell,
    .theme-settings-action-shell {
        display: flex;
    }

    .theme-preset-btn,
    .theme-layout-btn,
    .theme-settings-action-btn {
        width: 100%;
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-height: auto;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
    }

    .theme-preset-btn > .reveal-press-content,
    .theme-layout-btn > .reveal-press-content,
    .theme-settings-action-btn > .reveal-press-content {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 12px;
    }

    .theme-settings-action-btn > .reveal-press-content {
        flex-direction: row;
        justify-content: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: rgb(var(--clickgui-text-dimmed-rgb) / 0.96);
    }

    .theme-settings-action-btn--strong {
        --setting-control-border-color: rgb(var(--clickgui-accent-rgb) / 0.54);
        --setting-control-background-color: rgb(var(--clickgui-accent-rgb) / 0.18);
    }

    .theme-settings-action-btn--strong > .reveal-press-content,
    .theme-preset-btn--active .theme-preset-label,
    .theme-layout-btn--active .theme-layout-title {
        color: var(--clickgui-text-color);
    }

    .theme-preset-copy,
    .theme-layout-copy {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .theme-preset-label,
    .theme-layout-title,
    .theme-color-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: rgb(var(--clickgui-text-dimmed-rgb) / 0.96);
    }

    .theme-preset-description,
    .theme-layout-description,
    .theme-color-description {
        font-size: 11px;
        line-height: 1.5;
        color: rgb(var(--clickgui-text-dimmed-rgb) / 0.84);
    }

    .theme-preset-swatches {
        display: flex;
        gap: 6px;
    }

    .theme-preset-swatch {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        border: 1px solid rgb(var(--clickgui-text-rgb) / 0.28);
        background-color: var(--theme-preset-swatch-color);
        box-shadow: inset 0 0 0 1px rgb(var(--clickgui-base-rgb) / 0.2);
    }

    .theme-preset-btn--active,
    .theme-layout-btn--active {
        --setting-control-border-color: rgb(var(--clickgui-accent-rgb) / 0.62);
        --setting-control-background-color: rgb(var(--clickgui-accent-rgb) / 0.18);
        --setting-control-box-shadow: 0 0 0 1px rgb(var(--clickgui-accent-rgb) / 0.22);
    }

    .theme-color-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .theme-color-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 0;
        padding: 12px;
        border: 1px solid rgb(var(--clickgui-text-rgb) / 0.16);
        background-color: rgb(var(--clickgui-text-rgb) / 0.05);
    }

    .theme-color-copy {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .theme-color-control {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
    }

    .theme-layout-preview {
        display: grid;
        grid-template-columns: repeat(var(--theme-layout-preview-columns), 1fr);
        gap: 6px;
    }

    .theme-layout-preview-column {
        min-height: 42px;
        border: 1px solid rgb(var(--clickgui-text-rgb) / 0.18);
        background:
            linear-gradient(
                180deg,
                rgb(var(--clickgui-text-rgb) / 0.12) 0 6px,
                transparent 6px
            ),
            rgb(var(--clickgui-text-rgb) / 0.06);
    }

    @media (max-width: 820px) {
        .theme-section-header {
            flex-direction: column;
        }

        .theme-color-card {
            align-items: flex-start;
            flex-direction: column;
        }

        .theme-color-control {
            width: 100%;
            justify-content: space-between;
        }
    }
</style>
