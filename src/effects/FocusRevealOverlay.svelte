<script lang="ts">
    import { focusOverlay } from "./focusOverlay";

    $: overlay = $focusOverlay;
</script>

{#if overlay.visible}
    <div
        class="focus-reveal-overlay"
        style="
            left: {overlay.x}px;
            top: {overlay.y}px;
            width: {overlay.width}px;
            height: {overlay.height}px;
            border-radius: {overlay.radius}px;
        "
        aria-hidden="true"
    ></div>
{/if}

<style lang="scss">
    @use "../colors" as *;

    .focus-reveal-overlay {
        position: fixed;
        pointer-events: none;
        box-sizing: border-box;
        z-index: 100000;
        transition:
            opacity 120ms ease,
            transform 120ms ease;
        opacity: 1;

        box-shadow:
            0 0 0 1px $reveal-border-color,
            0 0 0 3px $focus-reveal-primary,
            0 0 15px $focus-reveal-glow;
    }
</style>
