<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type {
        FloatRangeSetting,
        IntRangeSetting,
        Range,
    } from "../../../integration/types";
    import {
        formatNumericValue,
        getBounds,
        getRangeValue,
        getSliderStep,
        isSmallIntegerDomain,
        normalizeRangeValue,
        normalizeSingleValue,
    } from "./numericSettingUtils";
    import { isIntRangeSetting } from "./settingTypeGuards";

    interface Props {
        setting: FloatRangeSetting | IntRangeSetting;
        onChange?: (value: Range) => void;
        textInputRevealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: Range) => {};

    let {
        setting,
        onChange = defaultChangeHandler,
        textInputRevealItemOptions,
    }: Props = $props();

    const integerSetting = $derived(isIntRangeSetting(setting));
    const bounds = $derived(getBounds(setting.range));
    const sliderStep = $derived(getSliderStep(bounds, integerSetting));
    const stepped = $derived(integerSetting && isSmallIntegerDomain(bounds));
    const safeRangeSpan = $derived(Math.max(0.000001, bounds.max - bounds.min));
    const boundsLabel = $derived(
        `${formatNumericValue(bounds.min, integerSetting)} to ${formatNumericValue(bounds.max, integerSetting)}${setting.suffix?.trim() ? setting.suffix.trim() : ""}`,
    );

    let draftRange = $state({ from: 0, to: 0 });
    let draftFromInput = $state("");
    let draftToInput = $state("");

    $effect(() => {
        const nextRange = normalizeRangeValue(setting.value, bounds, integerSetting);
        draftRange = nextRange;
        draftFromInput = formatNumericValue(nextRange.from, integerSetting);
        draftToInput = formatNumericValue(nextRange.to, integerSetting);
    });

    const selectedStartPercent = $derived(
        ((draftRange.from - bounds.min) / safeRangeSpan) * 100,
    );
    const selectedEndPercent = $derived(
        ((draftRange.to - bounds.min) / safeRangeSpan) * 100,
    );

    const selectionStyle = $derived(
        `--range-start:${selectedStartPercent}%; --range-end:${selectedEndPercent}%;`,
    );

    function setDraft(nextRange: Range) {
        const normalized = normalizeRangeValue(nextRange, bounds, integerSetting);
        draftRange = normalized;
        draftFromInput = formatNumericValue(normalized.from, integerSetting);
        draftToInput = formatNumericValue(normalized.to, integerSetting);
    }

    function commit(nextRange: Range) {
        const normalized = normalizeRangeValue(nextRange, bounds, integerSetting);
        setDraft(normalized);

        const current = getRangeValue(setting.value);
        if (
            normalized.from === current.from &&
            normalized.to === current.to
        ) {
            return;
        }

        onChange(normalized);
    }

    function handleLowerSliderInput(event: Event) {
        const nextValue = Number(
            (event.currentTarget as HTMLInputElement).value,
        );

        if (!Number.isFinite(nextValue)) {
            return;
        }

        const normalized = normalizeSingleValue(nextValue, bounds, integerSetting);
        setDraft({
            from: Math.min(normalized, draftRange.to),
            to: draftRange.to,
        });
    }

    function handleUpperSliderInput(event: Event) {
        const nextValue = Number(
            (event.currentTarget as HTMLInputElement).value,
        );

        if (!Number.isFinite(nextValue)) {
            return;
        }

        const normalized = normalizeSingleValue(nextValue, bounds, integerSetting);
        setDraft({
            from: draftRange.from,
            to: Math.max(normalized, draftRange.from),
        });
    }

    function handleLowerSliderChange() {
        commit(draftRange);
    }

    function handleUpperSliderChange() {
        commit(draftRange);
    }

    function handleFromInput(event: Event) {
        const nextRawValue = (event.currentTarget as HTMLInputElement).value;
        draftFromInput = nextRawValue;

        if (
            nextRawValue === "" ||
            nextRawValue === "-" ||
            nextRawValue === "." ||
            nextRawValue === "-."
        ) {
            return;
        }

        const nextValue = Number(nextRawValue);

        if (!Number.isFinite(nextValue)) {
            return;
        }

        const normalized = normalizeSingleValue(nextValue, bounds, integerSetting);
        draftRange = {
            from: Math.min(normalized, draftRange.to),
            to: draftRange.to,
        };
    }

    function handleToInput(event: Event) {
        const nextRawValue = (event.currentTarget as HTMLInputElement).value;
        draftToInput = nextRawValue;

        if (
            nextRawValue === "" ||
            nextRawValue === "-" ||
            nextRawValue === "." ||
            nextRawValue === "-."
        ) {
            return;
        }

        const nextValue = Number(nextRawValue);

        if (!Number.isFinite(nextValue)) {
            return;
        }

        const normalized = normalizeSingleValue(nextValue, bounds, integerSetting);
        draftRange = {
            from: draftRange.from,
            to: Math.max(normalized, draftRange.from),
        };
    }

    function handleFromChange() {
        const parsed = Number(draftFromInput);

        if (!Number.isFinite(parsed)) {
            setDraft(setting.value);
            return;
        }

        commit({
            from: parsed,
            to: draftRange.to,
        });
    }

    function handleToChange() {
        const parsed = Number(draftToInput);

        if (!Number.isFinite(parsed)) {
            setDraft(setting.value);
            return;
        }

        commit({
            from: draftRange.from,
            to: parsed,
        });
    }
</script>

<div class="setting-input-shell setting-input-shell--block numeric-range-setting-shell">
    <div class="numeric-range-layout">
        <div class="numeric-range-slider-row">
            <div class="numeric-range-slider-shell" use:revealBorder>
                <div
                    class="setting-input-control setting-input-control--block numeric-range-slider-control"
                    class:numeric-range-slider-control--stepped={stepped}
                    style={selectionStyle}
                >
                    <span class="numeric-range-slider-content">
                        <div class="range-slider-wrapper">
                            <div class="range-slider-track"></div>
                            <div class="range-slider-selected"></div>
                            <input
                                class="range-thumb range-thumb--lower"
                                type="range"
                                min={bounds.min}
                                max={bounds.max}
                                step={sliderStep}
                                value={draftRange.from}
                                oninput={handleLowerSliderInput}
                                onchange={handleLowerSliderChange}
                            />
                            <input
                                class="range-thumb range-thumb--upper"
                                type="range"
                                min={bounds.min}
                                max={bounds.max}
                                step={sliderStep}
                                value={draftRange.to}
                                oninput={handleUpperSliderInput}
                                onchange={handleUpperSliderChange}
                            />
                        </div>
                    </span>
                </div>
            </div>

            <span class="slider-range-hint">{boundsLabel}</span>
        </div>

        <div class="numeric-range-inputs">
            <div class="numeric-range-value-shell" use:revealBorder>
                <label
                    class="setting-input-control numeric-range-value-control"
                    use:revealItem={textInputRevealItemOptions}
                >
                    <span class="reveal-press-content">
                        <input
                            class="setting-input-text setting-input-number"
                            type="number"
                            min={bounds.min}
                            max={bounds.max}
                            step={sliderStep}
                            value={draftFromInput}
                            oninput={handleFromInput}
                            onchange={handleFromChange}
                        />
                    </span>
                </label>
            </div>

            <span class="range-divider" aria-hidden="true">to</span>

            <div class="numeric-range-value-shell" use:revealBorder>
                <label
                    class="setting-input-control numeric-range-value-control"
                    use:revealItem={textInputRevealItemOptions}
                >
                    <span class="reveal-press-content">
                        <input
                            class="setting-input-text setting-input-number"
                            type="number"
                            min={bounds.min}
                            max={bounds.max}
                            step={sliderStep}
                            value={draftToInput}
                            oninput={handleToInput}
                            onchange={handleToChange}
                        />
                    </span>
                </label>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .numeric-range-setting-shell {
        width: 100%;
    }

    .numeric-range-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 8px;
        width: 100%;
    }

    .numeric-range-slider-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
    }

    .numeric-range-slider-shell {
        min-width: 0;
    }

    .numeric-range-slider-control {
        display: inline-flex;
        align-items: center;
        width: 100%;
        min-width: 0;
        height: 24px;
        padding: 0 8px;
        border: 1px solid #{rgba($clickgui-text-color, 0.28)};
        background-color: #{rgba($clickgui-text-color, 0.08)};
    }

    .numeric-range-slider-content {
        width: 100%;
    }

    .range-slider-wrapper {
        position: relative;
        width: 100%;
        height: 16px;
    }

    .range-slider-track,
    .range-slider-selected {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 2px;
        transform: translateY(-50%);
        border-radius: 999px;
    }

    .range-slider-track {
        background-color: #{rgba($clickgui-text-color, 0.3)};
    }

    .numeric-range-slider-control.numeric-range-slider-control--stepped
        .range-slider-track {
        background-image: repeating-linear-gradient(
            to right,
            #{rgba($clickgui-text-color, 0.3)} 0,
            #{rgba($clickgui-text-color, 0.3)} 1px,
            transparent 1px,
            transparent 20%
        );
        background-color: transparent;
    }

    .range-slider-selected {
        left: var(--range-start);
        right: calc(100% - var(--range-end));
        background-color: #{$accent-color};
    }

    .range-thumb {
        appearance: none;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 16px;
        margin: 0;
        background: transparent;
        pointer-events: none;
    }

    .range-thumb::-webkit-slider-runnable-track {
        height: 2px;
        background: transparent;
    }

    .range-thumb::-moz-range-track {
        height: 2px;
        border: 0;
        background: transparent;
    }

    .range-thumb::-webkit-slider-thumb {
        appearance: none;
        width: 10px;
        height: 10px;
        border: 0;
        border-radius: 0;
        margin-top: -4px;
        background-color: $accent-color;
        pointer-events: auto;
        cursor: pointer;
    }

    .range-thumb::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border: 0;
        border-radius: 0;
        background-color: $accent-color;
        pointer-events: auto;
        cursor: pointer;
    }

    .numeric-range-inputs {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 8px;
    }

    .numeric-range-value-control {
        width: 100%;
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.08)};
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.3)};
    }

    .numeric-range-value-control > .reveal-press-content {
        width: 100%;
    }

    .numeric-range-value-control .setting-input-number {
        text-align: right;
        padding: 0 8px;
        font-variant-numeric: tabular-nums;
        appearance: textfield;
        -moz-appearance: textfield;
    }

    .numeric-range-value-control .setting-input-number::-webkit-outer-spin-button,
    .numeric-range-value-control .setting-input-number::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .range-divider {
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba($clickgui-text-dimmed-color, 0.9);
    }

    .slider-range-hint {
        display: inline-flex;
        align-items: center;
        font-size: 10px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: rgba($clickgui-text-dimmed-color, 0.92);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
    }
</style>
