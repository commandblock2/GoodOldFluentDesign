<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { MultiChooseSetting } from "../../../integration/types";

    export let setting: MultiChooseSetting;
    export let onChange: (values: string[]) => void = () => {};
    export let revealItemOptions: RevealItemOptions;

    function isSelected(choice: string) {
        return setting.value.includes(choice);
    }

    function isLocked(choice: string) {
        return (
            isSelected(choice) &&
            !setting.canBeNone &&
            setting.value.length <= 1
        );
    }

    function buildNextValues(choice: string) {
        const selected = isSelected(choice);

        if (selected) {
            return setting.value.filter((value) => value !== choice);
        }

        const next = [...setting.value, choice];
        if (setting.isOrderSensitive) {
            return next;
        }

        const nextSet = new Set(next);
        return setting.choices.filter((value) => nextSet.has(value));
    }

    function onToggleChoice(choice: string) {
        if (isLocked(choice)) {
            return;
        }

        onChange(buildNextValues(choice));
    }
</script>

<div class="setting-input-shell setting-input-shell--block multi-choice-setting-shell">
    <div class="setting-choice-grid setting-choice-grid--multi" role="group" aria-label={setting.name}>
        {#each setting.choices as choice}
            {@const selected = isSelected(choice)}
            {@const locked = isLocked(choice)}

            <div class="setting-choice-entry" use:revealBorder>
                <button
                    class="setting-input-control setting-choice-btn"
                    class:setting-input-control--enabled={selected}
                    class:setting-choice-btn--active={selected}
                    class:setting-choice-btn--locked={locked}
                    type="button"
                    aria-pressed={selected}
                    aria-label={choice}
                    disabled={locked}
                    onclick={() => onToggleChoice(choice)}
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

    .multi-choice-setting-shell {
        width: 100%;
    }

    .setting-choice-grid {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 6px;
    }

    .setting-choice-entry {
        display: inline-flex;
        min-width: 0;
    }

    .setting-choice-btn {
        --reveal-focus-color: #{$accent-color};
        --setting-control-min-width: 0;
        --setting-control-padding-inline: 8px;
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.32)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.14)};
    }

    .setting-choice-label {
        display: inline-block;
        max-width: 180px;
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

    .setting-choice-btn.setting-choice-btn--locked {
        cursor: default;
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.2)};
    }
</style>
