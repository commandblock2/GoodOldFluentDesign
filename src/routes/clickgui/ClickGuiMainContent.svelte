<script lang="ts">
    import type { Action } from "svelte/action";
    import {
        revealContainer,
        type RevealContainerOptions,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type {
        ConfigurableSetting,
        ModuleSetting,
    } from "../../integration/types";
    import {
        defaultClickGuiThemePreferences,
        type ClickGuiThemePreferences,
        type ClickGuiThemePreset,
    } from "./clickGuiThemePreferences";
    import type { ClickGuiActivePageState } from "./clickGuiSessionState";
    import { scrollbarHoverSurface } from "./clickGuiActions";
    import type { IndexedModuleSetting } from "./setting/clickGuiSettingLayout";
    import type { ClickGuiSettingHandlers } from "./setting/clickGuiSettingHandlers";
    import ClickGuiThemeSettingsContent from "./views/ClickGuiThemeSettingsContent.svelte";
    import SettingEntry from "./setting/SettingEntry.svelte";

    interface Props {
        activeConfigPage: ClickGuiActivePageState;
        activeConfigTitle: string;
        activeConfigDescription: string;
        activeConfigLoading: boolean;
        activeConfigurable: ConfigurableSetting | null;
        activeModuleLoadError: string | null;
        settingsColumns: IndexedModuleSetting[][];
        subsectionRevealOptions: RevealContainerOptions;
        revealItemOptions: RevealItemOptions;
        textInputRevealItemOptions: RevealItemOptions;
        trackSettingHeight: Action<HTMLElement, number>;
        settingHandlers: ClickGuiSettingHandlers;
        clickGuiThemePreferences?: ClickGuiThemePreferences;
        clickGuiThemeLoadError?: string | null;
        onRetryActiveModuleConfigLoad?: () => void | Promise<void>;
        onAccentColorChange?: (accentColor: string) => void | Promise<void>;
        onBaseColorChange?: (baseColor: string) => void | Promise<void>;
        onBackgroundColorChange?: (
            backgroundColor: ClickGuiThemePreferences["backgroundColor"],
        ) => void | Promise<void>;
        onOffButtonColorChange?: (
            offButtonColor: ClickGuiThemePreferences["offButtonColor"],
        ) => void | Promise<void>;
        onInputBackgroundColorChange?: (
            inputBackgroundColor: ClickGuiThemePreferences["inputBackgroundColor"],
        ) => void | Promise<void>;
        onPanelBackgroundColorChange?: (
            panelBackgroundColor: ClickGuiThemePreferences["panelBackgroundColor"],
        ) => void | Promise<void>;
        onTextColorChange?: (textColor: string) => void | Promise<void>;
        onDimmedTextColorChange?: (
            dimmedTextColor: string,
        ) => void | Promise<void>;
        onSettingsSplitCountChange?: (
            settingsSplitCount: number,
        ) => void | Promise<void>;
        settingsSearchQuery?: string;
        onModulePrimaryInteractionChange?: (
            interaction: ClickGuiThemePreferences["modulePrimaryInteraction"],
        ) => void | Promise<void>;
        onShowModuleRowActionsChange?: (
            showModuleRowActions: ClickGuiThemePreferences["showModuleRowActions"],
        ) => void | Promise<void>;
        onModuleAccentModeChange?: (
            accentMode: ClickGuiThemePreferences["moduleAccentMode"],
        ) => void | Promise<void>;
        onApplyThemePreset?: (
            preset: ClickGuiThemePreset,
        ) => void | Promise<void>;
        onResetThemeDefaults?: () => void | Promise<void>;
    }

    const noop = () => {};
    const noopStringChange = (_value: string) => {};
    const noopBackgroundColorChange = (
        _backgroundColor: ClickGuiThemePreferences["backgroundColor"],
    ) => {};
    const noopOffButtonColorChange = (
        _offButtonColor: ClickGuiThemePreferences["offButtonColor"],
    ) => {};
    const noopInputBackgroundColorChange = (
        _inputBackgroundColor: ClickGuiThemePreferences["inputBackgroundColor"],
    ) => {};
    const noopPanelBackgroundColorChange = (
        _panelBackgroundColor: ClickGuiThemePreferences["panelBackgroundColor"],
    ) => {};
    const noopNumberChange = (_value: number) => {};
    const noopModulePrimaryInteractionChange = (
        _interaction: ClickGuiThemePreferences["modulePrimaryInteraction"],
    ) => {};
    const noopModuleRowActionsChange = (
        _showModuleRowActions: ClickGuiThemePreferences["showModuleRowActions"],
    ) => {};
    const noopModuleAccentModeChange = (
        _accentMode: ClickGuiThemePreferences["moduleAccentMode"],
    ) => {};
    const noopPresetChange = (_preset: ClickGuiThemePreset) => {};
    let mainContentScrolled = $state(false);

    let {
        activeConfigPage,
        activeConfigTitle,
        activeConfigDescription,
        activeConfigLoading,
        activeConfigurable,
        activeModuleLoadError,
        settingsColumns,
        subsectionRevealOptions,
        revealItemOptions,
        textInputRevealItemOptions,
        trackSettingHeight,
        settingHandlers,
        clickGuiThemePreferences = defaultClickGuiThemePreferences,
        clickGuiThemeLoadError = null,
        onRetryActiveModuleConfigLoad = noop,
        onAccentColorChange = noopStringChange,
        onBaseColorChange = noopStringChange,
        onBackgroundColorChange = noopBackgroundColorChange,
        onOffButtonColorChange = noopOffButtonColorChange,
        onInputBackgroundColorChange = noopInputBackgroundColorChange,
        onPanelBackgroundColorChange = noopPanelBackgroundColorChange,
        onTextColorChange = noopStringChange,
        onDimmedTextColorChange = noopStringChange,
        onSettingsSplitCountChange = noopNumberChange,
        settingsSearchQuery = $bindable(""),
        onModulePrimaryInteractionChange = noopModulePrimaryInteractionChange,
        onShowModuleRowActionsChange = noopModuleRowActionsChange,
        onModuleAccentModeChange = noopModuleAccentModeChange,
        onApplyThemePreset = noopPresetChange,
        onResetThemeDefaults = noop,
    }: Props = $props();

    const showModuleSettings = $derived(
        activeConfigPage.type === "module" && activeConfigurable !== null,
    );
    const showModuleLoadingState = $derived(
        activeConfigPage.type === "module" &&
            activeConfigurable === null &&
            activeModuleLoadError === null &&
            activeConfigLoading,
    );
    const showClickGuiEmptyState = $derived(
        activeConfigPage.type === "clickgui",
    );
    const showQuickSettingsState = $derived(
        activeConfigPage.type === "quick-settings",
    );
    const hasVisibleModuleSettings = $derived(
        settingsColumns.some((column) => column.length > 0),
    );
    const showVisibleModuleSettings = $derived(
        showModuleSettings && hasVisibleModuleSettings,
    );
    const showModuleSearchEmptyState = $derived(
        showModuleSettings &&
            !hasVisibleModuleSettings &&
            settingsSearchQuery.trim().length > 0,
    );

    function handleMainContentScroll(event: Event) {
        const currentTarget = event.currentTarget;
        if (!(currentTarget instanceof HTMLElement)) {
            return;
        }

        mainContentScrolled = currentTarget.scrollTop > 0;
    }
</script>

<section
    class="main-content scroll-surface"
    class:main-content-scrolled={mainContentScrolled}
    class:main-content--module={activeConfigPage.type === "module"}
    use:scrollbarHoverSurface
    use:revealContainer={subsectionRevealOptions}
    onscroll={handleMainContentScroll}
>
    <div class="main-content-header">
        <h2 class="main-content-title">{activeConfigTitle}</h2>

        {#if activeConfigDescription.trim().length > 0}
            <p class="main-content-description">
                {activeConfigDescription}
            </p>
        {/if}
    </div>

    {#if activeConfigPage.type === "module"}
        <div class="main-content-search">
            <input
                class="settings-search-input"
                type="text"
                placeholder="Search settings..."
                bind:value={settingsSearchQuery}
            />
        </div>
    {/if}

    {#if showVisibleModuleSettings}
        <div class="settings-split-layout">
            {#each settingsColumns as column, columnIndex (columnIndex)}
                <div class="settings-column">
                    {#each column as item (item.settingIndex)}
                        <div
                            class="setting-entry-shell"
                            use:trackSettingHeight={item.settingIndex}
                        >
                            <SettingEntry
                                setting={item.setting}
                                path={[item.settingIndex]}
                                {revealItemOptions}
                                {textInputRevealItemOptions}
                                handlers={settingHandlers}
                            />
                        </div>
                    {/each}
                </div>

                {#if columnIndex < settingsColumns.length - 1}
                    <div class="settings-split" aria-hidden="true"></div>
                {/if}
            {/each}
        </div>
    {:else if showModuleSearchEmptyState}
        <div class="state-card">
            <h3 class="state-card-title">No Matching Settings</h3>
            <p class="state-card-message">
                Try a different search term or clear the filter to see every
                setting for this module.
            </p>
        </div>
    {:else if activeConfigPage.type === "theme-settings"}
        <ClickGuiThemeSettingsContent
            themePreferences={clickGuiThemePreferences}
            themeLoadError={clickGuiThemeLoadError}
            {revealItemOptions}
            {textInputRevealItemOptions}
            onAccentColorChange={onAccentColorChange}
            onBaseColorChange={onBaseColorChange}
            onBackgroundColorChange={onBackgroundColorChange}
            onOffButtonColorChange={onOffButtonColorChange}
            onInputBackgroundColorChange={onInputBackgroundColorChange}
            onPanelBackgroundColorChange={onPanelBackgroundColorChange}
            onTextColorChange={onTextColorChange}
            onDimmedTextColorChange={onDimmedTextColorChange}
            onSettingsSplitCountChange={onSettingsSplitCountChange}
            onModulePrimaryInteractionChange={onModulePrimaryInteractionChange}
            onShowModuleRowActionsChange={onShowModuleRowActionsChange}
            onModuleAccentModeChange={onModuleAccentModeChange}
            onApplyPreset={onApplyThemePreset}
            onResetToDefaults={onResetThemeDefaults}
        />
    {:else if activeModuleLoadError !== null}
        <div class="settings-error-state" role="alert" aria-live="polite">
            <div class="settings-error-card">
                <h3 class="settings-error-title">Failed To Load Module Settings</h3>
                <p class="settings-error-message">{activeModuleLoadError}</p>
                <div class="settings-error-actions">
                    <button
                        class="setting-input-control settings-error-retry"
                        type="button"
                        onclick={onRetryActiveModuleConfigLoad}
                    >
                        <span class="reveal-press-content">Retry</span>
                    </button>
                </div>
            </div>
        </div>
    {:else if showModuleLoadingState}
        <div class="state-card" role="status" aria-live="polite">
            <h3 class="state-card-title">Loading Module Settings</h3>
            <p class="state-card-message">
                Fetching the latest configurable values for this module.
            </p>
        </div>
    {:else if showQuickSettingsState}
        <div class="state-card">
            <h3 class="state-card-title">Quick Settings</h3>
            <p class="state-card-message">
                Quick settings are not wired yet.
            </p>
        </div>
    {:else if showClickGuiEmptyState}
        <div class="state-card">
            <h3 class="state-card-title">Select A Module</h3>
            <p class="state-card-message">
                Choose a category from the sidebar or use search to open module
                settings.
            </p>
        </div>
    {/if}
</section>

<style lang="scss">
    .main-content {
        flex: 1;
        min-width: 0;
        height: 100%;
        min-height: 0;
        padding: 10px;
        overflow-x: hidden;
        overflow-y: auto;
        color: var(--clickgui-text-color);
    }

    .main-content.main-content--module {
        background-color: var(--clickgui-panel-background-color);
    }

    .main-content-header {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 10px;
    }

    .main-content-search {
        position: sticky;
        top: 0;
        z-index: 2;
        background-color: transparent;
        backdrop-filter: blur(0);
        transition:
            background-color 140ms ease,
            backdrop-filter 140ms ease,
            box-shadow 140ms ease;
        padding: 0 0 10px;
        margin-bottom: 10px;
    }

    .main-content-title {
        font-size: 20px;
        font-weight: 600;
        line-height: 1.1;
    }

    .main-content-description {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
        color: var(--clickgui-text-dimmed-color);
    }

    .settings-search-input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.2);
        background-color: var(--clickgui-input-background-color);
        color: var(--clickgui-text-color);
        font-size: 13px;
        outline: none;

        &::placeholder {
            color: var(--clickgui-text-dimmed-color);
        }

        &:focus {
            border-color: var(--clickgui-accent-color);
            box-shadow: 0 0 0 2px var(--clickgui-accent-color);
        }
    }

    .main-content.main-content-scrolled .main-content-search {
        background-color: rgb(var(--clickgui-base-rgb, 0 0 0) / 0.72);
        backdrop-filter: blur(12px) saturate(130%);
        box-shadow: 0 8px 14px rgb(var(--clickgui-base-rgb, 0 0 0) / 0.35);
    }

    .settings-split-layout {
        display: flex;
        align-items: stretch;
        gap: 10px;
    }

    .settings-column {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0;
        background-color: var(--clickgui-panel-background-color);
    }

    .settings-split {
        width: 1px;
        flex-shrink: 0;
        background-color: rgb(var(--clickgui-text-rgb, 255 255 255) / 0.15);
    }

    .setting-entry-shell {
        min-width: 0;
        padding: 7px 0;
    }

    .setting-entry-shell + .setting-entry-shell {
        border-top: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.16);
    }

    .settings-error-state {
        display: flex;
        width: 100%;
    }

    .settings-error-card,
    .state-card {
        display: grid;
        gap: 10px;
        width: min(520px, 100%);
        padding: 12px;
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.28);
        background-color: var(--clickgui-panel-background-color);
    }

    .settings-error-title,
    .state-card-title {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: var(--clickgui-text-color);
    }

    .settings-error-message,
    .state-card-message {
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.96);
        white-space: pre-wrap;
    }

    .settings-error-actions {
        display: flex;
    }

    .main-content :global(.setting-entry) {
        padding: 0;
    }

    .main-content :global(.setting-entry.setting-entry--configurable) {
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.14);
        padding: 10px;
        background-color: var(--clickgui-panel-background-color);
    }

    .main-content :global(.setting-header) {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
        min-width: 0;
    }

    .main-content :global(.setting-entry.inline-control-setting-entry .setting-header) {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: 0;
    }

    .main-content :global(.setting-entry.setting-entry--configurable .setting-children) {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .main-content :global(.setting-entry.setting-entry--configurable .setting-children > .setting-entry:not(.setting-entry--configurable)) {
        padding: 6px 0;
    }

    .main-content :global(.setting-entry.setting-entry--configurable .setting-children > .setting-entry + .setting-entry) {
        border-top: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.16);
    }

    .main-content :global(.setting-selection-summary) {
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.86);
        white-space: nowrap;
        flex-shrink: 0;
    }

    .main-content :global(.setting-input-shell) {
        display: inline-flex;
    }

    .main-content :global(.setting-input-shell--block) {
        display: flex;
        width: 100%;
    }

    .main-content :global(.setting-input-control) {
        display: inline-flex;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        min-width: 0;
    }

    .main-content :global(.setting-input-control > .reveal-press-content) {
        display: inline-flex;
        align-items: center;
        justify-content: var(--setting-control-justify-content, center);
        width: var(--setting-control-content-width, auto);
        min-width: var(--setting-control-min-width, 66px);
        height: var(--setting-control-height, 24px);
        padding: 0 var(--setting-control-padding-inline, 10px);
        border: 1px solid
            var(
                --setting-control-border-color,
                rgb(var(--clickgui-text-rgb, 255 255 255) / 0.32)
            );
        background-color: var(
            --setting-control-background-color,
            var(--clickgui-control-off-color)
        );
        box-shadow: var(
            --setting-control-box-shadow,
            0 0 0 0 var(--clickgui-accent-color)
        );
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            box-shadow 120ms ease;
    }

    .main-content :global(.setting-input-control--block) {
        width: 100%;
        --setting-control-content-width: 100%;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
    }

    .main-content :global(.setting-input-text) {
        width: 100%;
        min-width: 0;
        height: 24px;
        padding: 0 10px;
        border: 0;
        outline: none;
        background: transparent;
        color: var(--clickgui-text-color);
        caret-color: currentColor;
        font-family: inherit;
        font-size: 12px;
        line-height: 1;
    }

    .main-content :global(.setting-input-text::placeholder) {
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.9);
    }

    .settings-error-retry {
        cursor: pointer;
        --setting-control-padding-inline: 14px;
        --setting-control-border-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.34
        );
        --setting-control-background-color: var(--clickgui-control-off-color);
    }

    .settings-error-retry :global(.reveal-press-content) {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.03em;
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.96);
    }

    .settings-error-retry:hover :global(.reveal-press-content) {
        color: var(--clickgui-text-color);
    }
</style>
