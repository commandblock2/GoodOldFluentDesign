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
    export let onOpenModuleConfig: (module: Module) => void = () => {};
</script>

<div class="category-page" use:revealContainer={subsectionRevealOptions}>
    <div class="item btn-border category-back-shell" use:revealBorder>
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

    .category-back-shell {
        position: sticky;
        top: -10px;
        z-index: 2;
        margin: 0 -10px 0;
        padding: 20px 10px 6px;
        background:
            linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.12) 0%,
                rgba(255, 255, 255, 0.05) 58%,
                rgba(255, 255, 255, 0.02) 100%
            ),
            var(--clickgui-surface-strong-color);
        border-bottom: 1px solid rgba(255, 255, 255, 0.24);
        backdrop-filter: blur(8px) saturate(125%);
        -webkit-backdrop-filter: blur(8px) saturate(125%);
        box-shadow: 0 10px 16px rgba(0, 0, 0, 0.32);
        transition:
            background 140ms ease,
            border-color 140ms ease,
            backdrop-filter 140ms ease,
            box-shadow 140ms ease;
    }
</style>
