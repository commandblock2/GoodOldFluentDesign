<script lang="ts">
    import type { GroupedModules, Module } from "../../../integration/types";
    import {
        revealBorder,
        revealContainer,
        revealItem,
        type RevealContainerOptions,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";

    export let filteredCategoryNames: string[] = [];
    export let filteredGrouped: GroupedModules = {};
    export let subsectionRevealOptions: RevealContainerOptions;
    export let moduleRevealItemOptions: RevealItemOptions;
    export let onOpenModuleConfig: (module: Module) => void = () => {};
    export let onOpenThemeSettings: () => void = () => {};

    function modulesForCategory(categoryName: string): Module[] {
        return filteredGrouped[categoryName] ?? [];
    }
</script>

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
                    {#each modulesForCategory(categoryName) as module}
                        <li class="item module-item btn-border" use:revealBorder>
                            <button
                                class="btn"
                                type="button"
                                onclick={() => onOpenModuleConfig(module)}
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
                onclick={onOpenThemeSettings}
                use:revealItem={moduleRevealItemOptions}
            >
                <span class="reveal-press-content">
                    Theme Settings
                </span>
            </button>
        </li>
    </ul>
</div>

<style lang="scss">
    @use "./shared.scss" as shared;

    @include shared.section-block;
    @include shared.subsection-block;
    @include shared.interactive-list-block;
    @include shared.module-item-block;
    @include shared.empty-block;
    @include shared.reveal-hover-overlay-block;
</style>
