<script lang="ts">
    import type { GroupedModules, Module } from "../../integration/types";
    import { onMount } from "svelte";
    import {
        revealBorder,
        revealContainer,
        revealItem,
        type RevealContainerOptions,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import { getModules } from "../../integration/rest";
    import { groupByCategory } from "../../integration/util";

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
            <div class="category-page" use:revealContainer={subsectionRevealOptions}>
                <div class="item btn-border" use:revealBorder>
                    <button
                        class="btn category-back-btn"
                        type="button"
                        onclick={closeDetailView}
                        use:revealItem={moduleRevealItemOptions}
                    >
                        <span class="reveal-press-content">
                            &lt; {selectedCategory}
                        </span>
                    </button>
                </div>

                {#if selectedCategoryModules.length === 0}
                    <div class="empty">No modules in this category</div>
                {:else}
                    <ul class="item-list click-gui-list">
                        {#each selectedCategoryModules as module}
                            <li class="item module-item btn-border" use:revealBorder>
                                <button
                                    class="btn"
                                    type="button"
                                    use:revealItem={moduleRevealItemOptions}
                                >
                                    <span class="reveal-press-content">
                                        {module.name}
                                    </span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {:else if selectedThemeSettings}
            <div class="category-page" use:revealContainer={subsectionRevealOptions}>
                <div class="item btn-border" use:revealBorder>
                    <button
                        class="btn category-back-btn"
                        type="button"
                        onclick={closeDetailView}
                        use:revealItem={moduleRevealItemOptions}
                    >
                        <span class="reveal-press-content">
                            &lt; Theme Settings
                        </span>
                    </button>
                </div>

                <ul class="item-list click-gui-list">
                    <li class="item btn-border" use:revealBorder>
                        <button
                            class="btn"
                            type="button"
                            use:revealItem={moduleRevealItemOptions}
                        >
                            <span class="reveal-press-content">
                                Theme Settings
                            </span>
                        </button>
                    </li>
                </ul>
            </div>
        {:else if isSearching}
            <div class="section">
                <div class="section-title">Click GUI</div>

                {#if filteredCategoryNames.length === 0}
                    <div class="empty">No matching modules</div>
                {:else}
                    {#each filteredCategoryNames as categoryName}
                        <div class="subsection">
                            <div class="subsection-title">{categoryName}</div>
                            <ul
                                class="item-list click-gui-list"
                                use:revealContainer={subsectionRevealOptions}
                            >
                                {#each filteredGrouped[categoryName] as module}
                                    <li
                                        class="item module-item btn-border"
                                        use:revealBorder
                                    >
                                        <button
                                            class="btn"
                                            type="button"
                                            use:revealItem={moduleRevealItemOptions}
                                        >
                                            <span class="reveal-press-content">
                                                {module.name}
                                            </span>
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/each}
                {/if}
            </div>

            <div class="section">
                <div class="section-title">Theme Settings</div>
                <ul class="item-list" use:revealContainer={subsectionRevealOptions}>
                    <li class="item btn-border" use:revealBorder>
                        <button
                            class="btn"
                            type="button"
                            onclick={openThemeSettings}
                            use:revealItem={moduleRevealItemOptions}
                        >
                            <span class="reveal-press-content">
                                Theme Settings
                            </span>
                        </button>
                    </li>
                </ul>
            </div>
        {:else}
            <div class="non-search-group" use:revealContainer={subsectionRevealOptions}>
                <div class="quick-settings">
                    <ul class="item-list">
                        <li class="item btn-border" use:revealBorder>
                            <button
                                class="btn"
                                type="button"
                                use:revealItem={moduleRevealItemOptions}
                            >
                                <span class="reveal-press-content">
                                    Quick Settings
                                </span>
                            </button>
                        </li>
                    </ul>
                </div>

                <div class="click-theme-group">
                    <div class="section">
                        <div class="section-title">Click GUI</div>
                        <ul class="item-list click-gui-list">
                            {#each categoryNames as categoryName}
                                <li class="item btn-border" use:revealBorder>
                                    <button
                                        class="btn"
                                        type="button"
                                        onclick={() => openCategory(categoryName)}
                                        use:revealItem={moduleRevealItemOptions}
                                    >
                                        <span class="reveal-press-content">
                                            {categoryName}
                                        </span>
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    </div>

                    <div class="section">
                        <div class="section-title">Theme Settings</div>
                        <ul class="item-list">
                            <li class="item btn-border" use:revealBorder>
                                <button
                                    class="btn"
                                    type="button"
                                    onclick={openThemeSettings}
                                    use:revealItem={moduleRevealItemOptions}
                                >
                                    <span class="reveal-press-content">
                                        Theme Settings
                                    </span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        {/if}
    </aside>
</div>

<style lang="scss">
    @use "../../colors.scss" as *;

    .clickgui {
        display: flex;
        height: 100%;
        width: 100%;
        background-color: rgba($clickgui-base-color, 0.15);
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        width: 280px;
        background-color: rgba($clickgui-base-color, 0.7);
        color: $clickgui-text-color;
        border-radius: 0;
        padding: 10px;
        gap: 12px;
        box-shadow: 0 0 12px rgba($clickgui-base-color, 0.5);
    }

    .search {
        position: sticky;
        top: 0;
        z-index: 2;
        background-color: rgba($clickgui-base-color, 0.7);
        padding-bottom: 8px;
    }

    .search-input {
        width: 100%;
        padding: 8px 10px;
        border-radius: 0;
        border: 1px solid rgba($clickgui-text-color, 0.2);
        background-color: rgba($clickgui-base-color, 0.85);
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

    .section {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .section-title {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: $clickgui-text-dimmed-color;
    }

    .subsection {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-left: 4px;
    }

    .subsection-title {
        font-size: 12px;
        color: $clickgui-text-color;
        opacity: 0.85;
    }

    .item-list.click-gui-list {
        gap: 0;
    }

    .category-page {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .click-gui-list > .item {
        margin: 0;
        border-radius: 0;
    }

    .click-gui-list > .item > .btn {
        border-radius: 0;
    }

    .item-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .item {
        position: relative;
        overflow: hidden;

        font-size: 13px;
        padding: 6px 8px;
        border-radius: 0;
        cursor: pointer;
        color: $clickgui-text-color;

        &:hover {
            background-color: rgba($clickgui-base-color, 0.85);
        }
    }

    .item.btn-border {
        padding: 0;

        &:hover {
            background-color: transparent;
        }
    }

    .item.btn-border .btn {
        position: relative;
        overflow: hidden;
        display: block;
        width: 100%;
        padding: 6px 8px;
        border-radius: 0;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    .category-back-btn {
        font-size: 20px;
        font-weight: 500;
        line-height: 1.2;
    }

    :global(.clickgui .item-list.reveal-container .reveal-item)::before {
        background: radial-gradient(
            circle 150px at var(--item-fx-x, -9999px) var(--item-fx-y, -9999px),
            var(--reveal-hover-color),
            transparent 100%
        );
    }

    .module-item {
        font-size: 12px;
        color: $clickgui-text-dimmed-color;
    }

    .module-item .btn {
        padding-left: 14px;
    }

    .empty {
        font-size: 12px;
        color: $clickgui-text-dimmed-color;
        padding: 6px 4px;
    }
</style>
