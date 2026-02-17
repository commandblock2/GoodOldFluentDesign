<script lang="ts">
    import type { GroupedModules, Module } from "../../integration/types";
    import { onMount } from "svelte";
    import type {
        RevealContainerOptions,
        RevealItemOptions,
    } from "fluent-reveal-svelte";
    import { getModules } from "../../integration/rest";
    import { groupByCategory } from "../../integration/util";
    import ClickGuiCategoryDetailView from "./views/ClickGuiCategoryDetailView.svelte";
    import ClickGuiHomeView from "./views/ClickGuiHomeView.svelte";
    import ClickGuiSearchView from "./views/ClickGuiSearchView.svelte";
    import ClickGuiThemeDetailView from "./views/ClickGuiThemeDetailView.svelte";

    let categories = $state<GroupedModules>({});
    let modules = $state<Module[]>([]);
    let searchQuery = $state("");
    let selectedCategory = $state<string | null>(null);
    let selectedThemeSettings = $state(false);

    const sortByName = (a: string, b: string) => a.localeCompare(b);

    const subsectionRevealOptions: RevealContainerOptions = {
        border: {
            radius: 48,
            color: "rgba(255,255,255,0.6)",
            fadeStopPct: 100,
            transitionMs: 120,
        },
        hover: {
            color: "rgba(255,255,255,0.3)",
        },
        focus: {
            enabled: true,
            color: "rgba(255,255,255,0.62)",
            widthPx: 1,
            offsetPx: 2,
            glowPx: 10,
        },
        click: {
            color: "rgba(255,255,255,0.3)",
            ripple: {
                enabled: true,
                durationMs: 1000,
                sizePx: 48,
            },
        },
    };

    const moduleRevealItemOptions: RevealItemOptions = {
        border: true,
        hover: true,
        click: true,
    };

    const normalizedQuery = $derived(searchQuery.trim().toLowerCase());
    const isSearching = $derived(normalizedQuery.length > 0);
    const categoryNames = $derived(Object.keys(categories).sort(sortByName));
    const filteredModules = $derived(
        isSearching
            ? modules.filter((module) =>
                  moduleMatchesQuery(module, normalizedQuery),
              )
            : [],
    );
    const filteredGrouped = $derived(
        isSearching ? groupByCategory(filteredModules) : {},
    );
    const filteredCategoryNames = $derived(
        Object.keys(filteredGrouped).sort(sortByName),
    );
    const selectedCategoryModules = $derived(
        selectedCategory === null
            ? []
            : [...(categories[selectedCategory] ?? [])].sort((a, b) =>
                  sortByName(a.name, b.name),
              ),
    );
    const isDetailView = $derived(
        selectedCategory !== null || selectedThemeSettings,
    );

    onMount(async () => {
        modules = await getModules();
        categories = groupByCategory(modules);
    });

    function moduleMatchesQuery(module: Module, query: string) {
        const haystack = [
            module.name,
            module.category,
            module.description,
            module.tag ?? "",
            ...module.aliases,
        ]
            .join(" ")
            .toLowerCase();

        return haystack.includes(query);
    }

    function openCategory(categoryName: string) {
        selectedCategory = categoryName;
        selectedThemeSettings = false;
    }

    function openThemeSettings() {
        selectedCategory = null;
        selectedThemeSettings = true;
        searchQuery = "";
    }

    function closeDetailView() {
        selectedCategory = null;
        selectedThemeSettings = false;
    }
</script>

<div class="clickgui">
    <aside class="sidebar">
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
                {subsectionRevealOptions}
                {moduleRevealItemOptions}
                onCloseDetailView={closeDetailView}
            />
        {:else if selectedThemeSettings}
            <ClickGuiThemeDetailView
                {subsectionRevealOptions}
                {moduleRevealItemOptions}
                onCloseDetailView={closeDetailView}
            />
        {:else if isSearching}
            <ClickGuiSearchView
                {filteredCategoryNames}
                {filteredGrouped}
                {subsectionRevealOptions}
                {moduleRevealItemOptions}
                onOpenThemeSettings={openThemeSettings}
            />
        {:else}
            <ClickGuiHomeView
                {categoryNames}
                {subsectionRevealOptions}
                {moduleRevealItemOptions}
                onOpenCategory={openCategory}
                onOpenThemeSettings={openThemeSettings}
            />
        {/if}
    </aside>
</div>

<style lang="scss">
    @use "../../colors.scss" as *;

    :global(.clickgui) {
        --clickgui-backdrop-color: #{rgba($clickgui-base-color, 0.15)};
        --clickgui-surface-color: #{rgba($clickgui-base-color, 0.7)};
        --clickgui-surface-strong-color: #{rgba($clickgui-base-color, 0.85)};
        --clickgui-shadow-color: #{rgba($clickgui-base-color, 0.5)};

        display: flex;
        height: 100%;
        width: 100%;
        background-color: var(--clickgui-backdrop-color);
    }

    :global(.clickgui > .sidebar) {
        display: flex;
        flex-direction: column;
        width: 280px;
        background-color: var(--clickgui-surface-color) !important;
        color: $clickgui-text-color;
        border-radius: 0;
        padding: 10px;
        gap: 12px;
        box-shadow: 0 0 12px var(--clickgui-shadow-color);
    }

    :global(.clickgui > .sidebar > .search) {
        position: sticky;
        top: 0;
        z-index: 2;
        background-color: var(--clickgui-surface-color) !important;
        padding-bottom: 8px;
    }

    :global(.clickgui > .sidebar > .search > .search-input) {
        width: 100%;
        padding: 8px 10px;
        border-radius: 0;
        border: 1px solid rgba($clickgui-text-color, 0.2);
        background-color: var(--clickgui-surface-strong-color) !important;
        color: $clickgui-text-color;
        font-size: 13px;
        outline: none;

        &::placeholder {
            color: $clickgui-text-dimmed-color;
        }

        &:focus {
            border-color: $accent-color;
            box-shadow: 0 0 0 2px rgba($accent-color, 0.25);
        }
    }
</style>
