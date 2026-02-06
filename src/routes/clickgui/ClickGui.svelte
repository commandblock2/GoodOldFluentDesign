<script lang="ts">
    import type { GroupedModules, Module } from "../../integration/types";
    import { onMount } from "svelte";
    import { getModules } from "../../integration/rest";
    import { groupByCategory } from "../../integration/util";

    let categories = $state<GroupedModules>({});
    let modules = $state<Module[]>([]);
    let searchQuery = $state("");

    const sortByName = (a: string, b: string) => a.localeCompare(b);

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
</script>

<div class="clickgui">
    <aside class="sidebar">
        <div class="search">
            <input
                class="search-input"
                type="text"
                placeholder="Search"
                bind:value={searchQuery}
            />
        </div>

        {#if isSearching}
            <div class="section">
                <div class="section-title">Click GUI</div>

                {#if filteredCategoryNames.length === 0}
                    <div class="empty">No matching modules</div>
                {:else}
                    {#each filteredCategoryNames as categoryName}
                        <div class="subsection">
                            <div class="subsection-title">{categoryName}</div>
                            <ul class="item-list">
                                {#each filteredGrouped[categoryName] as module}
                                    <li class="item module-item">
                                        {module.name}
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/each}
                {/if}
            </div>

            <div class="section">
                <div class="section-title">Theme Settings</div>
                <ul class="item-list">
                    <li class="item">Theme Settings</li>
                </ul>
            </div>
        {:else}
            <div class="quick-settings">
                <div class="item">Quick Settings</div>
            </div>

            <div class="section">
                <div class="section-title">Click GUI</div>
                <ul class="item-list">
                    {#each categoryNames as categoryName}
                        <li class="item">{categoryName}</li>
                    {/each}
                </ul>
            </div>

            <div class="section">
                <div class="section-title">Theme Settings</div>
                <ul class="item-list">
                    <li class="item">Theme Settings</li>
                </ul>
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
        border-radius: 6px;
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
        border-radius: 6px;
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

    .item-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .item {
        font-size: 13px;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        color: $clickgui-text-color;

        &:hover {
            background-color: rgba($clickgui-base-color, 0.85);
        }
    }

    .module-item {
        padding-left: 14px;
        font-size: 12px;
        color: $clickgui-text-dimmed-color;
    }

    .empty {
        font-size: 12px;
        color: $clickgui-text-dimmed-color;
        padding: 6px 4px;
    }
</style>
