<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { ListSetting } from "../../../integration/types";
    import ExpandableTextInputControl from "./ExpandableTextInputControl.svelte";

    interface Props {
        setting: ListSetting;
        onChange?: (values: string[]) => void;
        textInputRevealItemOptions: RevealItemOptions;
        actionRevealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValues: string[]) => {};

    let {
        setting,
        onChange = defaultChangeHandler,
        textInputRevealItemOptions,
        actionRevealItemOptions,
    }: Props = $props();

    function updateItemAt(itemIndex: number, nextValue: string) {
        if (itemIndex < 0 || itemIndex >= setting.value.length) {
            throw new Error(
                `MUTABLE_LIST "${setting.name}" received out-of-bounds index ${itemIndex}. Current length: ${setting.value.length}.`,
            );
        }

        if (setting.value[itemIndex] === nextValue) {
            return;
        }

        const nextValues = [...setting.value];
        nextValues[itemIndex] = nextValue;
        onChange(nextValues);
    }

    function removeItemAt(itemIndex: number) {
        if (itemIndex < 0 || itemIndex >= setting.value.length) {
            throw new Error(
                `MUTABLE_LIST "${setting.name}" received out-of-bounds remove index ${itemIndex}. Current length: ${setting.value.length}.`,
            );
        }

        onChange(setting.value.filter((_, index) => index !== itemIndex));
    }

    function addItem() {
        onChange([...setting.value, ""]);
    }
</script>

<div class="setting-input-shell setting-input-shell--block mutable-list-setting-shell">
    <div class="mutable-list-layout">
        {#if setting.value.length === 0}
            <p class="mutable-list-empty">No entries yet.</p>
        {/if}

        <div class="mutable-list-items">
            {#each setting.value as listItem, itemIndex (itemIndex)}
                <div class="mutable-list-item-row">
                    <div class="mutable-list-item-input-shell">
                        <ExpandableTextInputControl
                            value={listItem}
                            onChange={(nextValue) => updateItemAt(itemIndex, nextValue)}
                            placeholder={`Entry ${itemIndex + 1}`}
                            revealItemOptions={textInputRevealItemOptions}
                        />
                    </div>

                    <div class="mutable-list-item-action-shell" use:revealBorder>
                        <button
                            class="setting-input-control mutable-list-action"
                            type="button"
                            aria-label={`Remove entry ${itemIndex + 1}`}
                            onclick={() => removeItemAt(itemIndex)}
                            use:revealItem={actionRevealItemOptions}
                        >
                            <span class="reveal-press-content">Remove</span>
                        </button>
                    </div>
                </div>
            {/each}
        </div>

        <div class="mutable-list-add-shell" use:revealBorder>
            <button
                class="setting-input-control mutable-list-action mutable-list-action--add"
                type="button"
                onclick={addItem}
                use:revealItem={actionRevealItemOptions}
            >
                <span class="reveal-press-content">Add Entry</span>
            </button>
        </div>
    </div>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .mutable-list-setting-shell {
        width: 100%;
    }

    .mutable-list-layout {
        display: grid;
        width: 100%;
        gap: 8px;
    }

    .mutable-list-empty {
        margin: 0;
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: rgba($clickgui-text-dimmed-color, 0.88);
    }

    .mutable-list-items {
        display: grid;
        gap: 6px;
    }

    .mutable-list-item-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 6px;
        align-items: stretch;
        width: 100%;
    }

    .mutable-list-item-input-shell {
        min-width: 0;
        justify-self: start;
    }

    .mutable-list-action {
        --reveal-focus-color: #{$accent-color};
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.34)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.12)};
    }

    .mutable-list-item-action-shell,
    .mutable-list-add-shell {
        display: inline-flex;
        width: max-content;
        overflow: hidden;
    }

    .mutable-list-item-action-shell {
        justify-self: end;
    }

    .mutable-list-action > .reveal-press-content {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba($clickgui-text-dimmed-color, 0.96);
    }

    .mutable-list-action:hover > .reveal-press-content {
        color: $clickgui-text-color;
    }

    .mutable-list-action--add {
        --setting-control-padding-inline: 14px;
    }

    .mutable-list-add-shell {
        justify-self: start;
    }
</style>
