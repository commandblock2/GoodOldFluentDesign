<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { ChoiceSetting } from "../../../integration/types";
    import { getChoiceNames } from "./choiceSettingUtils";

    interface Props {
        setting: ChoiceSetting;
        onChange?: (value: string) => void;
        revealItemOptions: RevealItemOptions;
    }

    const defaultChange = (_value: string) => {};
    let {
        setting,
        onChange = defaultChange,
        revealItemOptions,
    }: Props = $props();

    const choiceNames = $derived(getChoiceNames(setting));

    function onSelectChoice(choice: string) {
        if (choice === setting.active) {
            return;
        }

        onChange(choice);
    }
</script>

<div class="setting-input-shell setting-input-shell--block choice-tabs-shell">
    <div class="choice-tab-grid" role="tablist" aria-label={setting.name}>
        {#each choiceNames as choice}
            {@const isActive = setting.active === choice}

            <div class="choice-tab-entry" use:revealBorder>
                <button
                    class="setting-input-control choice-tab-btn"
                    class:setting-input-control--enabled={isActive}
                    class:choice-tab-btn--active={isActive}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={choice}
                    onclick={() => onSelectChoice(choice)}
                    use:revealItem={revealItemOptions}
                >
                    <span class="reveal-press-content">
                        <span class="choice-tab-label">{choice}</span>
                    </span>
                </button>
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .choice-tabs-shell {
        width: 100%;
    }

    .choice-tab-grid {
        display: grid;
        width: 100%;
        gap: 2px;
        grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
    }

    .choice-tab-entry {
        display: flex;
        min-width: 0;
    }

    .choice-tab-btn {
        width: 100%;
        --reveal-focus-color: var(--clickgui-accent-color, #{$accent-color});
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-border-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.32
        );
        --setting-control-background-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.14
        );
    }

    .choice-tab-label {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 600;
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.94);
        transition: color 120ms ease;
    }

    .choice-tab-btn.choice-tab-btn--active {
        --setting-control-border-color: var(
            --clickgui-accent-color,
            #{$accent-color}
        );
        --setting-control-background-color: var(
            --clickgui-accent-color,
            #{$accent-color}
        );
    }

    .choice-tab-btn.choice-tab-btn--active .choice-tab-label {
        color: var(--clickgui-text-color, #{$clickgui-text-color});
    }
</style>
