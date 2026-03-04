<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { Vec3, Vec3Setting } from "../../../integration/types";
    import { formatNumericValue } from "./numericSettingUtils";

    interface Props {
        setting: Vec3Setting;
        onChange?: (value: Vec3) => void;
        textInputRevealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: Vec3) => {};
    const vectorAxisEntries = [
        { axis: "x", label: "X" },
        { axis: "y", label: "Y" },
        { axis: "z", label: "Z" },
    ] as const;

    type VectorAxis = (typeof vectorAxisEntries)[number]["axis"];
    type DraftVectorValues = Record<VectorAxis, string>;

    let {
        setting,
        onChange = defaultChangeHandler,
        textInputRevealItemOptions,
    }: Props = $props();

    const integerSetting = $derived(setting.valueType === "VECTOR3_I");
    const numericInputMode = $derived(integerSetting ? "numeric" : "decimal");
    let draftInputs = $state<DraftVectorValues>({
        x: "",
        y: "",
        z: "",
    });

    $effect(() => {
        draftInputs = {
            x: formatNumericValue(setting.value.x, integerSetting),
            y: formatNumericValue(setting.value.y, integerSetting),
            z: formatNumericValue(setting.value.z, integerSetting),
        };
    });

    function getDraftAxisValue(axis: VectorAxis): string {
        if (axis === "x") {
            return draftInputs.x;
        }

        if (axis === "y") {
            return draftInputs.y;
        }

        return draftInputs.z;
    }

    function setDraftAxisValue(axis: VectorAxis, value: string): void {
        if (axis === "x") {
            draftInputs = { ...draftInputs, x: value };
            return;
        }

        if (axis === "y") {
            draftInputs = { ...draftInputs, y: value };
            return;
        }

        draftInputs = { ...draftInputs, z: value };
    }

    function getAxisValue(vector: Vec3, axis: VectorAxis): number {
        if (axis === "x") {
            return vector.x;
        }

        if (axis === "y") {
            return vector.y;
        }

        return vector.z;
    }

    function setAxisValue(vector: Vec3, axis: VectorAxis, value: number): Vec3 {
        if (axis === "x") {
            return {
                ...vector,
                x: value,
            };
        }

        if (axis === "y") {
            return {
                ...vector,
                y: value,
            };
        }

        return {
            ...vector,
            z: value,
        };
    }

    function normalizeInputValue(value: number): number {
        return integerSetting ? Math.round(value) : value;
    }

    function resetAxisDraft(axis: VectorAxis): void {
        setDraftAxisValue(
            axis,
            formatNumericValue(getAxisValue(setting.value, axis), integerSetting),
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

        const normalized = normalizeInputValue(parsed);
        const currentValue = getAxisValue(setting.value, axis);

        if (normalized === currentValue) {
            resetAxisDraft(axis);
            return;
        }

        onChange(setAxisValue(setting.value, axis, normalized));
    }
</script>

<div class="setting-input-shell setting-input-shell--block vector3-setting-shell">
    <div class="vector3-grid">
        {#each vectorAxisEntries as axisEntry (axisEntry.axis)}
            <div class="vector3-axis-shell" use:revealBorder>
                <label
                    class="setting-input-control vector3-axis-control"
                    use:revealItem={textInputRevealItemOptions}
                >
                    <span class="reveal-press-content">
                        <span class="vector3-axis-label">{axisEntry.label}</span>
                        <input
                            class="setting-input-text setting-input-number vector3-axis-input"
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

    .vector3-setting-shell {
        width: 100%;
    }

    .vector3-grid {
        display: grid;
        width: 100%;
        gap: 6px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .vector3-axis-shell {
        display: flex;
        width: 100%;
        min-width: 0;
    }

    .vector3-axis-control {
        width: 100%;
        --reveal-focus-color: #{$accent-color};
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.08)};
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.3)};
    }

    .vector3-axis-control > .reveal-press-content {
        display: grid;
        align-items: center;
        width: 100%;
        min-width: 0;
        gap: 6px;
        grid-template-columns: auto minmax(0, 1fr);
    }

    .vector3-axis-label {
        padding-left: 8px;
        font-size: 10px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: rgba($clickgui-text-dimmed-color, 0.92);
        font-variant-numeric: tabular-nums;
    }

    .vector3-axis-input {
        text-align: right;
        padding: 0 8px 0 0;
        font-variant-numeric: tabular-nums;
        appearance: textfield;
        -moz-appearance: textfield;
    }
</style>
