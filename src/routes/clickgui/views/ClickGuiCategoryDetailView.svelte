<script lang="ts">
    import type { Module } from "../../../integration/types";
    import {
        revealBorder,
        revealContainer,
        revealItem,
        type RevealContainerOptions,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";

    export let selectedCategory = "";
    export let selectedCategoryModules: Module[] = [];
    export let subsectionRevealOptions: RevealContainerOptions;
    export let moduleRevealItemOptions: RevealItemOptions;
    export let onCloseDetailView: () => void = () => {};
</script>

<div class="category-page" use:revealContainer={subsectionRevealOptions}>
    <div class="item btn-border" use:revealBorder>
        <button
            class="btn category-back-btn"
            type="button"
            onclick={onCloseDetailView}
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

<style lang="scss">
    @use "./shared.scss" as shared;

    @include shared.category-page-block;
    @include shared.interactive-list-block;
    @include shared.category-back-button-block;
    @include shared.module-item-block;
    @include shared.empty-block;
    @include shared.reveal-hover-overlay-block;
</style>
