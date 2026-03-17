<script lang="ts">
    import {fade} from "svelte/transition";

    export let name: string;
    export let selected: boolean;
</script>

<div class="category" class:selected>
    <div class="icon">
        {#if selected}
            <img
                transition:fade={{ duration: 200 }}
                src="img/hud/tabgui/{name.toLowerCase()}-active.svg"
                alt="icon"
            />
        {:else}
            <img
                transition:fade={{ duration: 200 }}
                src="img/hud/tabgui/{name.toLowerCase()}.svg"
                alt="icon"
            />
        {/if}
    </div>
    <div class="name">
        {name}
    </div>
</div>

<style lang="scss">
    @use "../../../../colors.scss" as *;

    .name {
        font-weight: 500;
        color: rgba($tabgui-text-dimmed-color, 0.96);
        font-size: 14px;
        width: 100%;
        padding: 7px 12px 7px 12px;
        background: transparent;
        transition:
            color 140ms ease,
            text-shadow 140ms ease;
        overflow: hidden;
    }

    .category {
        display: flex;
        border: 1px solid rgba($tabgui-text-color, 0.16);
        background-color: rgba($tabgui-base-color, 0.62);
        transition:
            border-color 140ms ease,
            box-shadow 140ms ease,
            background-color 140ms ease;

        &.selected {
            border-color: rgba($accent-color, 0.66);
            background-color: rgba($tabgui-base-color, 0.76);
            box-shadow:
                inset 0 0 0 1px rgba($accent-color, 0.22),
                0 0 10px rgba($accent-color, 0.3);
        }

        &.selected .name {
            color: $tabgui-text-color;
            text-shadow: 0 0 8px rgba($accent-color, 0.34);
        }
    }

    .icon {
        background-color: rgba($tabgui-base-color, 0.72);
        border-right: 1px solid rgba($tabgui-text-color, 0.14);
        width: 62px;
        position: relative;

        img {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            margin: auto;
        }
    }

    .category.selected .icon {
        border-right-color: rgba($accent-color, 0.38);
    }
</style>
