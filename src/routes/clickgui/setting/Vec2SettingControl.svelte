<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { Vec2, Vec2Setting } from "../../../integration/types";
    import { formatNumericValue } from "./numericSettingUtils";

    interface Props {
        setting: Vec2Setting;
        onChange?: (value: Vec2) => void;
        textInputRevealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: Vec2) => {};
    const vectorAxisEntries = [
        { axis: "x", label: "X" },
        { axis: "y", label: "Y" },
    ] as const;

    type VectorAxis = (typeof vectorAxisEntries)[number]["axis"];
    type DraftVectorValues = Record<VectorAxis, string>;

    let {
        setting,
        onChange = defaultChangeHandler,
        textInputRevealItemOptions,
    }: Props = $props();

    const numericInputMode = "decimal";
    let draftInputs = $state<DraftVectorValues>({
        x: "",
        y: "",
    });

    $effect(() => {
        draftInputs = {
            x: formatNumericValue(setting.value.x, false),
            y: formatNumericValue(setting.value.y, false),
        };
    });

    function getDraftAxisValue(axis: VectorAxis): string {
        if (axis === "x") {
            return draftInputs.x;
        }

        return draftInputs.y;
    }

    function setDraftAxisValue(axis: VectorAxis, value: string): void {
        if (axis === "x") {
            draftInputs = { ...draftInputs, x: value };
            return;
        }

        draftInputs = { ...draftInputs, y: value };
    }

    function getAxisValue(vector: Vec2, axis: VectorAxis): number {
        if (axis === "x") {
            return vector.x;
        }

        return vector.y;
    }

    function setAxisValue(vector: Vec2, axis: VectorAxis, value: number): Vec2 {
        if (axis === "x") {
            return {
                ...vector,
                x: value,
            };
        }

        return {
            ...vector,
            y: value,
        };
    }

    function resetAxisDraft(axis: VectorAxis): void {
        setDraftAxisValue(
            axis,
            formatNumericValue(getAxisValue(setting.value, axis), false),
        );
    }

    function handleAxisInput(axis: VectorAxis, event: Event): void {
        setDraftAxisValue(axis, (event.currentTarget as HTMLInputElement).value);
    }

    function commitAxis(axis: VectorAxis): void {
        const parsed = Number(getDraftAxisValue(axis));
        if (!Number.isFinite(parsed)) {
            resetAxisDraft(axis);
            return;
        }

        const currentValue = getAxisValue(setting.value, axis);
        if (parsed === currentValue) {
            resetAxisDraft(axis);
            return;
        }

        onChange(setAxisValue(setting.value, axis, parsed));
    }
</script>

<div class="setting-input-shell setting-input-shell--block vec2-setting-shell">
    <div class="vec2-grid">
        {#each vectorAxisEntries as axisEntry (axisEntry.axis)}
            <div class="vec2-axis-shell" use:revealBorder>
                <label
                    class="setting-input-control vec2-axis-control"
                    use:revealItem={textInputRevealItemOptions}
                >
                    <span class="reveal-press-content">
                        <span class="vec2-axis-label">{axisEntry.label}</span>
                        <input
                            class="setting-input-text setting-input-number vec2-axis-input"
                            type="text"
                            inputmode={numericInputMode}
                            spellcheck={false}
                            value={getDraftAxisValue(axisEntry.axis)}
                            aria-label={`${setting.name} ${axisEntry.label} axis`}
                            oninput={(event) => handleAxisInput(axisEntry.axis, event)}
                            onchange={() => commitAxis(axisEntry.axis)}
                        />
                    </span>
                </label>
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .vec2-setting-shell {
        width: 100%;
    }

    .vec2-grid {
        display: grid;
        width: 100%;
        gap: 6px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .vec2-axis-shell {
        display: flex;
        width: 100%;
        min-width: 0;
    }

    .vec2-axis-control {
        width: 100%;
        --reveal-focus-color: #{$accent-color};
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.08)};
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.3)};
    }

    .vec2-axis-control > .reveal-press-content {
        display: grid;
        align-items: center;
        width: 100%;
        min-width: 0;
        gap: 6px;
        grid-template-columns: auto minmax(0, 1fr);
    }

    .vec2-axis-label {
        padding-left: 8px;
        font-size: 10px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: rgba($clickgui-text-dimmed-color, 0.92);
        font-variant-numeric: tabular-nums;
    }

    .vec2-axis-input {
        text-align: right;
        padding: 0 8px 0 0;
        font-variant-numeric: tabular-nums;
        appearance: textfield;
        -moz-appearance: textfield;
    }
</style>
