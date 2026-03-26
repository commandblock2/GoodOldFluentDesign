<script lang="ts">
    import type {
        RevealContainerOptions,
        RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type {
        GroupedModules,
        Module,
    } from "../../integration/types";
    import type { RgbaColor } from "./clickGuiColorUtils";
    import type {
        ClickGuiModuleAccentMode,
        ClickGuiModulePrimaryInteraction,
        ClickGuiStickySurfaceIntensity,
    } from "./clickGuiThemePreferences";
    import { scrollbarHoverSurface } from "./clickGuiActions";
    import ClickGuiCategoryDetailView from "./views/ClickGuiCategoryDetailView.svelte";
    import ClickGuiHomeView from "./views/ClickGuiHomeView.svelte";
    import ClickGuiSearchView from "./views/ClickGuiSearchView.svelte";
    import ClickGuiThemeDetailView from "./views/ClickGuiThemeDetailView.svelte";

    interface Props {
        isDetailView: boolean;
        searchQuery?: string;
        selectedCategory: string | null;
        selectedCategoryModules: Module[];
        selectedThemeSettings: boolean;
        isSearching: boolean;
        filteredCategoryNames: string[];
        filteredGrouped: GroupedModules;
        categoryNames: string[];
        themeAccentColor: string;
        themeBaseColor: string;
        themeBackgroundColor: RgbaColor;
        themeTextColor: string;
        themeDimmedTextColor: string;
        themeSettingsColumnCount: number;
        themeStickySurfaceIntensity: ClickGuiStickySurfaceIntensity;
        modulePrimaryInteraction: ClickGuiModulePrimaryInteraction;
        showModuleRowActions: boolean;
        moduleAccentMode: ClickGuiModuleAccentMode;
        togglePendingByName?: Record<string, boolean>;
        subsectionRevealOptions: RevealContainerOptions;
        moduleRevealItemOptions: RevealItemOptions;
        onOpenCategory?: (categoryName: string) => void;
        onOpenQuickSettings?: () => void;
        onOpenThemeSettings?: () => void;
        onCloseDetailView?: () => void;
        onOpenModuleConfig?: (module: Module) => void | Promise<void>;
        onToggleModule?: (module: Module) => void | Promise<void>;
    }

    const noopOpenCategory = (_categoryName: string) => {};
    const noop = () => {};
    const noopOpenModuleConfig = (_module: Module) => {};
    const noopToggleModule = (_module: Module) => {};
    let sidebarScrolled = $state(false);

    let {
        isDetailView,
        searchQuery = $bindable(""),
        selectedCategory,
        selectedCategoryModules,
        selectedThemeSettings,
        isSearching,
        filteredCategoryNames,
        filteredGrouped,
        categoryNames,
        themeAccentColor,
        themeBaseColor,
        themeBackgroundColor,
        themeTextColor,
        themeDimmedTextColor,
        themeSettingsColumnCount,
        themeStickySurfaceIntensity,
        modulePrimaryInteraction,
        showModuleRowActions,
        moduleAccentMode,
        togglePendingByName = {},
        subsectionRevealOptions,
        moduleRevealItemOptions,
        onOpenCategory = noopOpenCategory,
        onOpenQuickSettings = noop,
        onOpenThemeSettings = noop,
        onCloseDetailView = noop,
        onOpenModuleConfig = noopOpenModuleConfig,
        onToggleModule = noopToggleModule,
    }: Props = $props();

    function handleSidebarScroll(event: Event) {
        const currentTarget = event.currentTarget;
        if (!(currentTarget instanceof HTMLElement)) {
            return;
        }

        sidebarScrolled = currentTarget.scrollTop > 0;
    }
</script>

<aside
    class="sidebar scroll-surface"
    class:sidebar-scrolled={sidebarScrolled}
    use:scrollbarHoverSurface
    onscroll={handleSidebarScroll}
>
    {#if !isDetailView}
        <div class="search">
            <input
                class="search-input"
                type="text"
                placeholder="Search"
                bind:value={searchQuery}
            />
        </div>
    {/if}

    {#if selectedCategory !== null}
        <ClickGuiCategoryDetailView
            {selectedCategory}
            {selectedCategoryModules}
            {modulePrimaryInteraction}
            {showModuleRowActions}
            {moduleAccentMode}
            {togglePendingByName}
            {subsectionRevealOptions}
            {moduleRevealItemOptions}
            onCloseDetailView={onCloseDetailView}
            onOpenModuleConfig={onOpenModuleConfig}
            onToggleModule={onToggleModule}
        />
    {:else if selectedThemeSettings}
        <ClickGuiThemeDetailView
            accentColor={themeAccentColor}
            baseColor={themeBaseColor}
            backgroundColor={themeBackgroundColor}
            textColor={themeTextColor}
            dimmedTextColor={themeDimmedTextColor}
            settingsColumnCount={themeSettingsColumnCount}
            stickySurfaceIntensity={themeStickySurfaceIntensity}
            {modulePrimaryInteraction}
            {showModuleRowActions}
            {moduleAccentMode}
            {subsectionRevealOptions}
            {moduleRevealItemOptions}
            onCloseDetailView={onCloseDetailView}
        />
    {:else if isSearching}
        <ClickGuiSearchView
            {filteredCategoryNames}
            {filteredGrouped}
            {modulePrimaryInteraction}
            {showModuleRowActions}
            {moduleAccentMode}
            {togglePendingByName}
            {subsectionRevealOptions}
            {moduleRevealItemOptions}
            onOpenThemeSettings={onOpenThemeSettings}
            onOpenModuleConfig={onOpenModuleConfig}
            onToggleModule={onToggleModule}
        />
    {:else}
        <ClickGuiHomeView
            {categoryNames}
            {subsectionRevealOptions}
            {moduleRevealItemOptions}
            onOpenCategory={onOpenCategory}
            onOpenThemeSettings={onOpenThemeSettings}
            onOpenQuickSettings={onOpenQuickSettings}
        />
    {/if}
</aside>

<style lang="scss">
    .sidebar {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        height: 100%;
        min-height: 0;
        width: 210px;
        background-color: var(--clickgui-surface-color);
        color: var(--clickgui-text-color);
        padding: 10px;
        gap: 12px;
        box-shadow: 0 0 12px var(--clickgui-shadow-color);
        overflow-x: hidden;
        overflow-y: auto;
    }

    .search {
        position: sticky;
        top: 0;
        z-index: 2;
        background-color: transparent;
        backdrop-filter: blur(0);
        transition:
            background-color 140ms ease,
            backdrop-filter 140ms ease,
            box-shadow 140ms ease;
        padding-bottom: 8px;
    }

    .search-input {
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

    .sidebar.sidebar-scrolled > .search {
        background-color: rgb(
            var(--clickgui-base-rgb, 0 0 0) /
                calc(0.6 + (var(--clickgui-sticky-intensity, 0.5) * 0.24))
        );
        backdrop-filter: blur(
                calc(8px + (var(--clickgui-sticky-intensity, 0.5) * 8px))
            )
            saturate(
                calc(110% + (var(--clickgui-sticky-intensity, 0.5) * 40%))
            );
        box-shadow: 0 8px 14px
            rgb(
                var(--clickgui-base-rgb, 0 0 0) /
                    calc(0.22 + (var(--clickgui-sticky-intensity, 0.5) * 0.26))
            );
    }

    .sidebar.sidebar-scrolled :global(.category-back-shell) {
        background: rgb(
            var(--clickgui-base-rgb, 0 0 0) /
                calc(0.88 + (var(--clickgui-sticky-intensity, 0.5) * 0.12))
        );
        border-bottom-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) /
                calc(0.24 + (var(--clickgui-sticky-intensity, 0.5) * 0.2))
        );
        backdrop-filter: blur(
                calc(10px + (var(--clickgui-sticky-intensity, 0.5) * 8px))
            )
            saturate(
                calc(120% + (var(--clickgui-sticky-intensity, 0.5) * 30%))
            );
        box-shadow: 0 12px 18px
            rgb(
                var(--clickgui-base-rgb, 0 0 0) /
                    calc(0.34 + (var(--clickgui-sticky-intensity, 0.5) * 0.36))
            );
    }
</style>
