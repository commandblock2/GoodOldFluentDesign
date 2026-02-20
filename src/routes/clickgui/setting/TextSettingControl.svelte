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
        --reveal-focus-color: #{$accent-color};
        --setting-control-content-width: clamp(150px, 34vw, 260px);
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.4)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.08)};
        --setting-control-border-radius: 2px;
        --setting-control-box-shadow:
            inset 0 0 0 1px #{rgba($clickgui-text-color, 0.08)};
    }

    .text-setting-control > .reveal-press-content {
        position: relative;
    }

    .text-setting-control > .reveal-press-content::before {
        content: "";
        position: absolute;
        left: 9px;
        top: 50%;
        width: 1px;
        height: 12px;
        transform: translateY(-50%);
        background-color: #{rgba($clickgui-text-color, 0.28)};
        pointer-events: none;
    }

    .text-setting-control .setting-input-text {
        padding-left: 14px;
    }
</style>
