<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type { FloatSetting, IntSetting } from "../../../integration/types";
    import {
        formatNumericValue,
        getBounds,
        getSliderStep,
        isSmallIntegerDomain,
        normalizeSingleValue,
    } from "./numericSettingUtils";
    import { isIntSetting } from "./settingTypeGuards";

    interface Props {
        setting: FloatSetting | IntSetting;
        onChange?: (value: number) => void;
        textInputRevealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: number) => {};

    let {
        setting,
        onChange = defaultChangeHandler,
        textInputRevealItemOptions,
    }: Props = $props();

    const integerSetting = $derived(isIntSetting(setting));
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
                      markerValue <= draftValue + Math.max(0.000001, sliderStep / 2);

                  return {
                      position,
                      markerIsActive,
                  };
              }),
    );
    const boundsLabel = $derived(
        `${formatNumericValue(bounds.min, integerSetting)} to ${formatNumericValue(bounds.max, integerSetting)}${setting.suffix?.trim() ? setting.suffix.trim() : ""}`,
    );

    let draftValue = $state(0);
    let draftInput = $state("");

    $effect(() => {
        const nextDraftValue = normalizeSingleValue(
            setting.value,
            bounds,
            integerSetting,
        );
        draftValue = nextDraftValue;
        draftInput = formatNumericValue(nextDraftValue, integerSetting);
    });

    function setDraft(nextValue: number) {
        draftValue = normalizeSingleValue(nextValue, bounds, integerSetting);
        draftInput = formatNumericValue(draftValue, integerSetting);
    }

    function commit(nextValue: number) {
        const normalized = normalizeSingleValue(nextValue, bounds, integerSetting);
        setDraft(normalized);

        if (normalized === setting.value) {
            return;
        }

        onChange(normalized);
    }

    function handleSliderInput(event: Event) {
        const nextValue = Number(
            (event.currentTarget as HTMLInputElement).value,
        );

        if (!Number.isFinite(nextValue)) {
            return;
        }

        setDraft(nextValue);
    }

    function handleSliderChange(event: Event) {
        const nextValue = Number(
            (event.currentTarget as HTMLInputElement).value,
        );

        if (!Number.isFinite(nextValue)) {
            setDraft(setting.value);
            return;
        }

        commit(nextValue);
    }

    function handleNumberInput(event: Event) {
        const nextRawValue = (event.currentTarget as HTMLInputElement).value;
        draftInput = nextRawValue;

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

        draftValue = normalizeSingleValue(nextValue, bounds, integerSetting);
    }

    function handleNumberChange() {
        const parsed = Number(draftInput);

        if (!Number.isFinite(parsed)) {
            setDraft(setting.value);
            return;
        }

        commit(parsed);
    }
</script>

<div class="setting-input-shell setting-input-shell--block numeric-setting-shell">
    <div class="numeric-setting-layout">
        <div class="numeric-slider-shell" use:revealBorder>
            <label
                class="setting-input-control setting-input-control--block numeric-slider-control"
                class:numeric-slider-control--stepped={stepped}
            >
                <span class="numeric-slider-content">
                    <div class="numeric-slider-track-shell">
                        <div class="setting-slider-track"></div>

                        {#if stepped}
                            <div class="setting-slider-markers" aria-hidden="true">
                                {#each stepMarkers as marker}
                                    <span
                                        class="setting-slider-step-marker"
                                        class:setting-slider-step-marker--active={marker.markerIsActive}
                                        style={`left:${marker.position}%;`}
                                    ></span>
                                {/each}
                            </div>
                        {/if}

                        <input
                            class="setting-slider-input"
                            class:setting-slider-input--stepped={stepped}
                            type="range"
                            min={bounds.min}
                            max={bounds.max}
                            step={sliderStep}
                            value={draftValue}
                            oninput={handleSliderInput}
                            onchange={handleSliderChange}
                        />
                    </div>
                </span>
            </label>
        </div>

        <span class="slider-range-hint">{boundsLabel}</span>

        <div class="numeric-value-shell" use:revealBorder>
            <label
                class="setting-input-control numeric-value-control"
                use:revealItem={textInputRevealItemOptions}
            >
                <span class="reveal-press-content">
                    <input
                        class="setting-input-text setting-input-number"
                        type="text"
                        inputmode={numericInputMode}
                        spellcheck={false}
                        value={draftInput}
                        oninput={handleNumberInput}
                        onchange={handleNumberChange}
                    />
                </span>
            </label>
        </div>
    </div>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .numeric-setting-shell {
        width: 100%;
    }

    .numeric-setting-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 8px;
        width: 100%;
    }

    .numeric-slider-shell {
        min-width: 0;
    }

    .numeric-slider-control {
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

    .numeric-slider-control:focus-within {
        border-color: rgba($accent-color, 0.92);
        box-shadow: 0 0 0 1px rgba($accent-color, 0.78);
    }

    .numeric-slider-content {
        width: 100%;
    }

    .numeric-slider-track-shell {
        position: relative;
        width: 100%;
        height: 16px;
        overflow: visible;
    }

    .setting-slider-track {
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 2px;
        transform: translateY(-50%);
        border-radius: 999px;
        background-color: #{rgba($clickgui-text-color, 0.38)};
        z-index: 1;
    }

    .numeric-slider-control.numeric-slider-control--stepped .setting-slider-track {
        border-radius: 0;
    }

    .setting-slider-markers {
        position: absolute;
        top: 0;
        bottom: 0;
        left: var(--slider-thumb-half-size);
        right: var(--slider-thumb-half-size);
        pointer-events: none;
        z-index: 2;
    }

    .setting-slider-step-marker {
        position: absolute;
        top: 50%;
        width: var(--step-marker-size);
        height: var(--step-marker-size);
        border-radius: 0;
        background-color: var(--step-marker-color);
        transform: translate(-50%, -50%);
    }

    .setting-slider-step-marker--active {
        background-color: var(--step-marker-active-color);
    }

    .setting-slider-input {
        appearance: none;
        position: absolute;
        inset: 0;
        width: 100%;
        height: 16px;
        margin: 0;
        background: transparent;
        cursor: pointer;
        z-index: 3;
    }

    .setting-slider-input::-webkit-slider-runnable-track {
        height: 2px;
        border-radius: 0;
        background: transparent;
    }

    .setting-slider-input::-webkit-slider-thumb {
        appearance: none;
        width: var(--slider-thumb-size);
        height: var(--slider-thumb-size);
        border: 0;
        border-radius: 0;
        margin-top: calc((2px - var(--slider-thumb-size)) / 2);
        background-color: $accent-color;
    }

    .setting-slider-input::-moz-range-track {
        height: 2px;
        border: 0;
        border-radius: 0;
        background: transparent;
    }

    .setting-slider-input::-moz-range-thumb {
        width: var(--slider-thumb-size);
        height: var(--slider-thumb-size);
        border: 0;
        border-radius: 0;
        background-color: $accent-color;
    }

    .setting-slider-input.setting-slider-input--stepped::-webkit-slider-runnable-track {
        background-color: transparent;
    }

    .setting-slider-input.setting-slider-input--stepped::-moz-range-track {
        background-color: transparent;
    }

    .numeric-value-shell {
        width: 94px;
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

    .numeric-value-control {
        width: 100%;
        --reveal-focus-color: #{$accent-color};
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.08)};
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.3)};
    }

    .numeric-value-control > .reveal-press-content {
        width: 100%;
    }

    .numeric-value-control .setting-input-number {
        text-align: right;
        padding: 0 8px;
        font-variant-numeric: tabular-nums;
        appearance: textfield;
        -moz-appearance: textfield;
    }
</style>
