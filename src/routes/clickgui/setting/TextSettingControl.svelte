<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { TextSetting } from "../../../integration/types";

    export let setting: TextSetting;
    export let onChange: (value: string) => void = () => {};
    export let revealItemOptions: RevealItemOptions;
</script>

<div class="setting-input-shell text-setting-shell" use:revealBorder>
    <label class="setting-input-control text-setting-control" use:revealItem={revealItemOptions}>
        <span class="reveal-press-content">
            <input
                class="setting-input-text"
                type="text"
                value={setting.value}
                onchange={(event) =>
                    onChange((event.currentTarget as HTMLInputElement).value)}
                spellcheck="false"
            />
        </span>
    </label>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .text-setting-control {
        --reveal-focus-color: #{rgba($accent-color, 0.9)};
    }

    .text-setting-shell .text-setting-control > .reveal-press-content {
        width: clamp(150px, 34vw, 260px);
        justify-content: flex-start;
        padding: 0;
    }
</style>
