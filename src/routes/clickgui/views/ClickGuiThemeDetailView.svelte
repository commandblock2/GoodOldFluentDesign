<script lang="ts">
    import {
        revealBorder,
        revealContainer,
        revealItem,
        type RevealContainerOptions,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";

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

<style lang="scss">
    @use "./shared.scss" as shared;

    @include shared.category-page-block;
    @include shared.interactive-list-block;
    @include shared.category-back-button-block;
    @include shared.reveal-hover-overlay-block;
</style>
