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
    const numericInputMode = $derived(integerSetting ? "numeric" : "decimal");
    const stepIntervalCount = $derived(
        !stepped || sliderStep <= 0
            ? 1
            : Math.max(
                  1,
                  Math.round((bounds.max - bounds.min) / sliderStep),
              ),
    );
    const stepMarkerPositions = $derived(
        !stepped
            ? []
            : Array.from(
                  { length: stepIntervalCount + 1 },
                  (_, markerIndex) => (markerIndex / stepIntervalCount) * 100,
              ),
    );
    const stepMarkers = $derived(
        !stepped
            ? []
            : stepMarkerPositions.map((position, markerIndex) => {
                  const markerValue = normalizeSingleValue(
                      bounds.min + markerIndex * sliderStep,
                      bounds,
                      integerSetting,
                  );
                  const markerIsActive =
                      markerValue >=
                          draftRange.from -
                              Math.max(0.000001, sliderStep / 2) &&
                      markerValue <=
                          draftRange.to + Math.max(0.000001, sliderStep / 2);

                  return {
                      position,
                      markerIsActive,
                  };
              }),
    );
    const safeRangeSpan = $derived(Math.max(0.000001, bounds.max - bounds.min));
    const boundsLabel = $derived(
        `${formatNumericValue(bounds.min, integerSetting)} to ${formatNumericValue(bounds.max, integerSetting)} ${setting.suffix?.trim() ? setting.suffix.trim() : ""}`,
    );

    let lowerThumbValue = $state(0);
    let upperThumbValue = $state(0);
    let activeThumb = $state<"lower" | "upper" | null>(null);
    let draftFromInput = $state("");
    let draftToInput = $state("");
    let fromInputElement: HTMLInputElement | null = null;
    let toInputElement: HTMLInputElement | null = null;
    let rangeInputsElement: HTMLDivElement | null = null;
    let rangeInputsWidthPx = $state(0);

    $effect(() => {
        const nextRange = normalizeRangeValue(setting.value, bounds, integerSetting);
        lowerThumbValue = nextRange.from;
        upperThumbValue = nextRange.to;
        draftFromInput = formatNumericValue(nextRange.from, integerSetting);
        draftToInput = formatNumericValue(nextRange.to, integerSetting);
    });

    $effect(() => {
        if (!rangeInputsElement || typeof ResizeObserver === "undefined") {
            return;
        }

        rangeInputsWidthPx = rangeInputsElement.clientWidth;
        const observer = new ResizeObserver((entries) => {
            const [entry] = entries;
            if (!entry) {
                return;
            }

            rangeInputsWidthPx = entry.contentRect.width;
        });
        observer.observe(rangeInputsElement);

        return () => {
            observer.disconnect();
        };
    });

    function orderedRangeFor(
        lowerThumb: number,
        upperThumb: number,
    ): Range {
        const normalizedLower = normalizeSingleValue(
            lowerThumb,
            bounds,
            integerSetting,
        );
        const normalizedUpper = normalizeSingleValue(
            upperThumb,
            bounds,
            integerSetting,
        );

        return normalizedLower <= normalizedUpper
            ? { from: normalizedLower, to: normalizedUpper }
            : { from: normalizedUpper, to: normalizedLower };
    }

    const draftRange = $derived(
        orderedRangeFor(lowerThumbValue, upperThumbValue),
    );

    const selectedStartPercent = $derived(
        ((draftRange.from - bounds.min) / safeRangeSpan) * 100,
    );
    const selectedEndPercent = $derived(
        ((draftRange.to - bounds.min) / safeRangeSpan) * 100,
    );

    const selectionStyle = $derived(
        `--range-start:${selectedStartPercent}%; --range-end:${selectedEndPercent}%;`,
    );
    const sliderControlStyle = $derived(selectionStyle);
    const rangeValueWidthPx = 76;
    const rangeValueHalfWidthPx = rangeValueWidthPx / 2;
    const rangeValueCollisionGapPx = 6;
    const rangeValueMinDistancePx =
        rangeValueWidthPx + rangeValueCollisionGapPx;
    const rangeInputsStyle = $derived(
        `--range-value-width:${rangeValueWidthPx}px;`,
    );
    const lowerThumbOnTop = $derived(
        activeThumb === "lower" ||
            (activeThumb === null && lowerThumbValue > upperThumbValue),
    );
    const upperThumbOnTop = $derived(
        activeThumb === "upper" ||
            (activeThumb === null && upperThumbValue >= lowerThumbValue),
    );
    const rawFromInputCenterPx = $derived(
        (selectedStartPercent / 100) * rangeInputsWidthPx,
    );
    const rawToInputCenterPx = $derived(
        (selectedEndPercent / 100) * rangeInputsWidthPx,
    );
    const inputCollisionCentersPx = $derived(
        resolveInputCollisionCenters(
            rawFromInputCenterPx,
            rawToInputCenterPx,
            rangeInputsWidthPx,
        ),
    );
    const fromInputPositionStyle = $derived(
        `left:${inputCollisionCentersPx.from}px;`,
    );
    const toInputPositionStyle = $derived(
        `left:${inputCollisionCentersPx.to}px;`,
    );

    function clampValue(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }

    function resolveInputCollisionCenters(
        rawFromCenterPx: number,
        rawToCenterPx: number,
        trackWidthPx: number,
    ): Range {
        const minCenter = rangeValueHalfWidthPx;
        const maxCenter = Math.max(minCenter, trackWidthPx - rangeValueHalfWidthPx);
        const availableDistance = maxCenter - minCenter;

        if (availableDistance <= 0) {
            return { from: minCenter, to: minCenter };
        }

        if (availableDistance < rangeValueMinDistancePx) {
            return { from: minCenter, to: maxCenter };
        }

        let fromCenter = clampValue(rawFromCenterPx, minCenter, maxCenter);
        let toCenter = clampValue(rawToCenterPx, minCenter, maxCenter);

        if (toCenter - fromCenter >= rangeValueMinDistancePx) {
            return { from: fromCenter, to: toCenter };
        }

        const midpoint = (fromCenter + toCenter) / 2;
        fromCenter = midpoint - rangeValueMinDistancePx / 2;
        toCenter = midpoint + rangeValueMinDistancePx / 2;

        if (fromCenter < minCenter) {
            const offset = minCenter - fromCenter;
            fromCenter += offset;
            toCenter += offset;
        }

        if (toCenter > maxCenter) {
            const offset = toCenter - maxCenter;
            fromCenter -= offset;
            toCenter -= offset;
        }

        return {
            from: clampValue(fromCenter, minCenter, maxCenter),
            to: clampValue(toCenter, minCenter, maxCenter),
        };
    }

    function applyThumbDraft(
        nextLowerThumb: number,
        nextUpperThumb: number,
    ): Range {
        lowerThumbValue = normalizeSingleValue(
            nextLowerThumb,
            bounds,
            integerSetting,
        );
        upperThumbValue = normalizeSingleValue(
            nextUpperThumb,
            bounds,
            integerSetting,
        );

        const ordered = orderedRangeFor(lowerThumbValue, upperThumbValue);
        draftFromInput = formatNumericValue(ordered.from, integerSetting);
        draftToInput = formatNumericValue(ordered.to, integerSetting);
        return ordered;
    }

    function commitThumbDraft(
        nextLowerThumb: number,
        nextUpperThumb: number,
    ) {
        const normalized = applyThumbDraft(nextLowerThumb, nextUpperThumb);
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
        activeThumb = "lower";
        const nextValue = Number(
            (event.currentTarget as HTMLInputElement).value,
        );

        if (!Number.isFinite(nextValue)) {
            return;
        }

        applyThumbDraft(nextValue, upperThumbValue);
    }

    function handleUpperSliderInput(event: Event) {
        activeThumb = "upper";
        const nextValue = Number(
            (event.currentTarget as HTMLInputElement).value,
        );

        if (!Number.isFinite(nextValue)) {
            return;
        }

        applyThumbDraft(lowerThumbValue, nextValue);
    }

    function handleLowerSliderChange() {
        commitThumbDraft(lowerThumbValue, upperThumbValue);
        activeThumb = null;
    }

    function handleUpperSliderChange() {
        commitThumbDraft(lowerThumbValue, upperThumbValue);
        activeThumb = null;
    }

    function handleLowerThumbPointerDown() {
        activeThumb = "lower";
    }

    function handleUpperThumbPointerDown() {
        activeThumb = "upper";
    }

    function handleLowerThumbFocus() {
        activeThumb = "lower";
    }

    function handleUpperThumbFocus() {
        activeThumb = "upper";
    }

    function clearActiveThumb() {
        activeThumb = null;
    }

    function focusSwappedInput(target: "from" | "to") {
        queueMicrotask(() => {
            const input = target === "from" ? fromInputElement : toInputElement;
            if (!input) {
                return;
            }

            input.focus();
            const caretPosition = input.value.length;
            input.setSelectionRange(caretPosition, caretPosition);
        });
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
        const currentOrdered = orderedRangeFor(lowerThumbValue, upperThumbValue);

        if (normalized <= currentOrdered.to) {
            applyThumbDraft(normalized, currentOrdered.to);
            return;
        }

        applyThumbDraft(currentOrdered.to, normalized);
        focusSwappedInput("to");
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
        const currentOrdered = orderedRangeFor(lowerThumbValue, upperThumbValue);

        if (normalized >= currentOrdered.from) {
            applyThumbDraft(currentOrdered.from, normalized);
            return;
        }

        applyThumbDraft(normalized, currentOrdered.from);
        focusSwappedInput("from");
    }

    function handleFromChange() {
        const parsed = Number(draftFromInput);

        if (!Number.isFinite(parsed)) {
            const current = normalizeRangeValue(setting.value, bounds, integerSetting);
            applyThumbDraft(current.from, current.to);
            return;
        }

        const currentOrdered = orderedRangeFor(lowerThumbValue, upperThumbValue);
        if (parsed <= currentOrdered.to) {
            commitThumbDraft(parsed, currentOrdered.to);
            return;
        }

        commitThumbDraft(currentOrdered.to, parsed);
        focusSwappedInput("to");
    }

    function handleToChange() {
        const parsed = Number(draftToInput);

        if (!Number.isFinite(parsed)) {
            const current = normalizeRangeValue(setting.value, bounds, integerSetting);
            applyThumbDraft(current.from, current.to);
            return;
        }

        const currentOrdered = orderedRangeFor(lowerThumbValue, upperThumbValue);
        if (parsed >= currentOrdered.from) {
            commitThumbDraft(currentOrdered.from, parsed);
            return;
        }

        commitThumbDraft(parsed, currentOrdered.from);
        focusSwappedInput("from");
    }
</script>

<div class="setting-input-shell setting-input-shell--block numeric-range-setting-shell">
    <div class="numeric-range-layout">
        <div class="numeric-range-slider-row">
            <div class="numeric-range-slider-shell">
                <div class="numeric-range-slider-track-shell" use:revealBorder>
                    <div
                        class="setting-input-control setting-input-control--block numeric-range-slider-control"
                        class:numeric-range-slider-control--stepped={stepped}
                        style={sliderControlStyle}
                    >
                        <span class="numeric-range-slider-content">
                            <div class="range-slider-wrapper">
                                <div class="range-slider-track"></div>
                                <div class="range-slider-selected"></div>

                                {#if stepped}
                                    <div class="range-step-markers" aria-hidden="true">
                                        {#each stepMarkers as marker}
                                            <span
                                                class="range-step-marker"
                                                class:range-step-marker--active={marker.markerIsActive}
                                                style={`left:${marker.position}%;`}
                                            ></span>
                                        {/each}
                                    </div>
                                {/if}

                                <input
                                    class="range-thumb range-thumb--lower"
                                    class:range-thumb--top={lowerThumbOnTop}
                                    class:range-thumb--active={activeThumb === "lower"}
                                    type="range"
                                    min={bounds.min}
                                    max={bounds.max}
                                    step={sliderStep}
                                    value={lowerThumbValue}
                                    onpointerdown={handleLowerThumbPointerDown}
                                    onfocus={handleLowerThumbFocus}
                                    onblur={clearActiveThumb}
                                    oninput={handleLowerSliderInput}
                                    onchange={handleLowerSliderChange}
                                />
                                <input
                                    class="range-thumb range-thumb--upper"
                                    class:range-thumb--top={upperThumbOnTop}
                                    class:range-thumb--active={activeThumb === "upper"}
                                    type="range"
                                    min={bounds.min}
                                    max={bounds.max}
                                    step={sliderStep}
                                    value={upperThumbValue}
                                    onpointerdown={handleUpperThumbPointerDown}
                                    onfocus={handleUpperThumbFocus}
                                    onblur={clearActiveThumb}
                                    oninput={handleUpperSliderInput}
                                    onchange={handleUpperSliderChange}
                                />
                            </div>
                        </span>
                    </div>
                </div>

                <div
                    class="numeric-range-inputs"
                    style={rangeInputsStyle}
                    bind:this={rangeInputsElement}
                >
                    <div
                        class="numeric-range-value-shell numeric-range-value-shell--from"
                        style={fromInputPositionStyle}
                        use:revealBorder
                    >
                        <label
                            class="setting-input-control numeric-range-value-control"
                            use:revealItem={textInputRevealItemOptions}
                        >
                            <span class="reveal-press-content">
                                <input
                                    class="setting-input-text setting-input-number"
                                    type="text"
                                    inputmode={numericInputMode}
                                    spellcheck={false}
                                    bind:this={fromInputElement}
                                    value={draftFromInput}
                                    oninput={handleFromInput}
                                    onchange={handleFromChange}
                                />
                            </span>
                        </label>
                    </div>

                    <div
                        class="numeric-range-value-shell numeric-range-value-shell--to"
                        style={toInputPositionStyle}
                        use:revealBorder
                    >
                        <label
                            class="setting-input-control numeric-range-value-control"
                            use:revealItem={textInputRevealItemOptions}
                        >
                            <span class="reveal-press-content">
                                <input
                                    class="setting-input-text setting-input-number"
                                    type="text"
                                    inputmode={numericInputMode}
                                    spellcheck={false}
                                    bind:this={toInputElement}
                                    value={draftToInput}
                                    oninput={handleToInput}
                                    onchange={handleToChange}
                                />
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <span class="slider-range-hint">{boundsLabel}</span>
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
        display: grid;
        gap: 8px;
        min-width: 0;
        overflow: visible;
    }

    .numeric-range-slider-track-shell {
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
        --slider-thumb-size: 10px;
        --slider-thumb-half-size: calc(var(--slider-thumb-size) / 2);
        --step-marker-size: 6px;
        --step-marker-color: #{rgba($clickgui-text-color, 0.68)};
        --step-marker-active-color: #{$accent-color};
        transition:
            border-color 120ms ease,
            box-shadow 120ms ease;
    }

    .numeric-range-slider-control:focus-within {
        border-color: rgba($accent-color, 0.92);
        box-shadow: 0 0 0 1px rgba($accent-color, 0.78);
    }

    .numeric-range-slider-content {
        width: 100%;
    }

    .range-slider-wrapper {
        position: relative;
        width: 100%;
        height: 16px;
        overflow: visible;
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
        background-color: #{rgba($clickgui-text-color, 0.38)};
        z-index: 1;
    }

    .numeric-range-slider-control.numeric-range-slider-control--stepped
        .range-slider-track {
        border-radius: 0;
        background-color: #{rgba($clickgui-text-color, 0.38)};
    }

    .range-slider-selected {
        left: var(--range-start);
        right: calc(100% - var(--range-end));
        background-color: #{$accent-color};
        z-index: 2;
    }

    .range-step-markers {
        position: absolute;
        top: 0;
        bottom: 0;
        left: var(--slider-thumb-half-size);
        right: var(--slider-thumb-half-size);
        pointer-events: none;
        z-index: 3;
    }

    .range-step-marker {
        position: absolute;
        top: 50%;
        width: var(--step-marker-size);
        height: var(--step-marker-size);
        border-radius: 0;
        background-color: var(--step-marker-color);
        transform: translate(-50%, -50%);
    }

    .range-step-marker--active {
        background-color: var(--step-marker-active-color);
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
        z-index: 4;
    }

    .range-thumb--top {
        z-index: 5;
    }

    .range-thumb--active {
        z-index: 6;
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
        width: var(--slider-thumb-size);
        height: var(--slider-thumb-size);
        border: 0;
        border-radius: 0;
        margin-top: calc((2px - var(--slider-thumb-size)) / 2);
        background-color: $accent-color;
        pointer-events: auto;
        cursor: pointer;
    }

    .range-thumb::-moz-range-thumb {
        width: var(--slider-thumb-size);
        height: var(--slider-thumb-size);
        border: 0;
        border-radius: 0;
        background-color: $accent-color;
        pointer-events: auto;
        cursor: pointer;
    }

    .numeric-range-inputs {
        --range-value-width: 76px;
        position: relative;
        width: 100%;
        height: 24px;
        box-sizing: border-box;
        padding-inline: 8px;
        overflow: visible;
        isolation: isolate;
    }

    .numeric-range-value-shell {
        position: absolute;
        top: 0;
        width: var(--range-value-width);
        transform: translateX(-50%);
        z-index: 1;
    }

    .numeric-range-value-shell--from {
        z-index: 2;
    }

    .numeric-range-value-shell--to {
        z-index: 3;
    }

    .numeric-range-value-shell:focus-within {
        z-index: 4;
    }

    .numeric-range-value-control {
        width: 100%;
        --reveal-focus-color: #{$accent-color};
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
        text-align: center;
        padding: 0 6px;
        font-variant-numeric: tabular-nums;
        appearance: textfield;
        -moz-appearance: textfield;
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
