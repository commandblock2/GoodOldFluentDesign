<script lang="ts">
    import {
        revealBorder,
        revealContainer,
        revealItem,
        type RevealContainerOptions,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";

    export let categoryNames: string[] = [];
    export let subsectionRevealOptions: RevealContainerOptions;
    export let moduleRevealItemOptions: RevealItemOptions;
    export let onOpenCategory: (categoryName: string) => void = () => {};
    export let onOpenQuickSettings: () => void = () => {};
    export let onOpenThemeSettings: () => void = () => {};
</script>

<div class="non-search-group" use:revealContainer={subsectionRevealOptions}>
    <div class="quick-settings">
        <ul class="item-list">
            <li class="item btn-border" use:revealBorder>
                <button
                    class="btn"
                    type="button"
                    onclick={onOpenQuickSettings}
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
                            onclick={() => onOpenCategory(categoryName)}
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
    </div>
</div>

<style lang="scss">
    @use "./shared.scss" as shared;

    @include shared.section-block;
    @include shared.interactive-list-block;
    @include shared.reveal-hover-overlay-block;
</style>
