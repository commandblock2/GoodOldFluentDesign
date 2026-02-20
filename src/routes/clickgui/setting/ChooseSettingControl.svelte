<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { ChooseSetting } from "../../../integration/types";

    export let setting: ChooseSetting;
    export let onChange: (value: string) => void = () => {};
    export let revealItemOptions: RevealItemOptions;

    function onSelectChoice(choice: string) {
        if (choice === setting.value) {
            return;
        }

        onChange(choice);
    }
</script>

<div class="setting-input-shell setting-input-shell--block choice-setting-shell">
    <div
        class="setting-choice-grid setting-choice-grid--single"
        role="radiogroup"
        aria-label={setting.name}
    >
        {#each setting.choices as choice}
            {@const isActive = setting.value === choice}

            <div class="setting-choice-entry" use:revealBorder>
                <button
                    class="setting-input-control setting-choice-btn"
                    class:setting-input-control--enabled={isActive}
                    class:setting-choice-btn--active={isActive}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    aria-label={choice}
                    onclick={() => onSelectChoice(choice)}
                    use:revealItem={revealItemOptions}
                >
                    <span class="reveal-press-content">
                        <span class="setting-choice-label">{choice}</span>
                    </span>
                </button>
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .choice-setting-shell {
        width: 100%;
    }

    .setting-choice-grid {
        display: grid;
        width: 100%;
        gap: 6px;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }

    .setting-choice-entry {
        display: flex;
        min-width: 0;
    }

    .setting-choice-btn {
        width: 100%;
        --reveal-focus-color: #{$accent-color};
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.32)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.14)};
    }

    .setting-choice-label {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 600;
        color: rgba($clickgui-text-dimmed-color, 0.94);
        transition: color 120ms ease;
    }

    .setting-choice-btn.setting-choice-btn--active {
        --setting-control-border-color: #{$accent-color};
        --setting-control-background-color: #{$accent-color};
    }

    .setting-choice-btn.setting-choice-btn--active .setting-choice-label {
        color: $clickgui-text-color;
    }
</style>
