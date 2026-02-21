<script lang="ts">
    import type {
        BooleanSetting,
        FloatRangeSetting,
        FloatSetting,
        IntRangeSetting,
        IntSetting,
        Range,
        ModuleSetting,
    } from "../../../integration/types";
    import type { RevealItemOptions } from "fluent-reveal-svelte";
    import BooleanSettingControl from "./BooleanSettingControl.svelte";
    import ColorSettingControl from "./ColorSettingControl.svelte";
    import ChooseSettingControl from "./ChooseSettingControl.svelte";
    import MultiChooseSettingControl from "./MultiChooseSettingControl.svelte";
    import NumberRangeSettingControl from "./NumberRangeSettingControl.svelte";
    import NumberSettingControl from "./NumberSettingControl.svelte";
    import Self from "./SettingEntry.svelte";
    import TextSettingControl from "./TextSettingControl.svelte";
    import { formatNumericValue } from "./numericSettingUtils";
    import {
        isBooleanSetting,
        isColorSetting,
        isChooseSetting,
        isFloatRangeSetting,
        isFloatSetting,
        isIntRangeSetting,
        isIntSetting,
        isMultiChooseSetting,
        isNestedSettingContainer,
        isTextSetting,
    } from "./settingTypeGuards";

    interface Props {
        setting: ModuleSetting;
        path?: number[];
        revealItemOptions: RevealItemOptions;
        textInputRevealItemOptions: RevealItemOptions;
        onBooleanChange?: (
            path: number[],
            checked: boolean,
        ) => void | Promise<void>;
        onTextChange?: (
            path: number[],
            value: string,
        ) => void | Promise<void>;
        onColorChange?: (
            path: number[],
            value: number,
        ) => void | Promise<void>;
        onChooseChange?: (
            path: number[],
            value: string,
        ) => void | Promise<void>;
        onMultiChooseChange?: (
            path: number[],
            values: string[],
        ) => void | Promise<void>;
        onNumberChange?: (
            path: number[],
            value: number,
        ) => void | Promise<void>;
        onNumberRangeChange?: (
            path: number[],
            value: Range,
        ) => void | Promise<void>;
    }

    const defaultBooleanChange = (_path: number[], _checked: boolean) => {};
    const defaultTextChange = (_path: number[], _value: string) => {};
    const defaultColorChange = (_path: number[], _value: number) => {};
    const defaultChooseChange = (_path: number[], _value: string) => {};
    const defaultMultiChooseChange = (_path: number[], _values: string[]) => {};
    const defaultNumberChange = (_path: number[], _value: number) => {};
    const defaultNumberRangeChange = (_path: number[], _value: Range) => {};

    let {
        setting,
        path = [],
        revealItemOptions,
        textInputRevealItemOptions,
        onBooleanChange = defaultBooleanChange,
        onTextChange = defaultTextChange,
        onColorChange = defaultColorChange,
        onChooseChange = defaultChooseChange,
        onMultiChooseChange = defaultMultiChooseChange,
        onNumberChange = defaultNumberChange,
        onNumberRangeChange = defaultNumberRangeChange,
    }: Props = $props();

    const childSettings = $derived(
        isNestedSettingContainer(setting) ? setting.value : [],
    );
    const indexedChildSettings = $derived(
        childSettings.map((childSetting, childIndex) => ({
            setting: childSetting,
            childIndex,
        })),
    );
    const enabledChildSetting = $derived(
        indexedChildSettings.find(
            (
                childSetting,
            ): childSetting is {
                setting: BooleanSetting;
                childIndex: number;
            } =>
                isBooleanSetting(childSetting.setting) &&
                childSetting.setting.name.trim().toLowerCase() === "enabled",
        ) ?? null,
    );
    const visibleChildSettings = $derived(
        enabledChildSetting === null
            ? indexedChildSettings
            : indexedChildSettings.filter(
                  (childSetting) =>
                      childSetting.childIndex !== enabledChildSetting.childIndex,
              ),
    );
    const visibleChildSettingsCount = $derived(visibleChildSettings.length);
    const childSettingsCountLabel = $derived(
        `${visibleChildSettingsCount} Setting${visibleChildSettingsCount === 1 ? "" : "s"}`,
    );
    const isInlineControlSetting = $derived(
        isBooleanSetting(setting) ||
            isTextSetting(setting) ||
            isColorSetting(setting),
    );
    const isConfigurableGroupSetting = $derived(
        isNestedSettingContainer(setting),
    );

    function childPath(childIndex: number) {
        return [...path, childIndex];
    }

    function formatSingleNumericSummary(
        setting: FloatSetting | IntSetting,
        integer: boolean,
    ): string {
        const suffix = setting.suffix?.trim() ?? "";
        const value = formatNumericValue(setting.value, integer);
        return suffix.length > 0 ? `${value} ${suffix}` : value;
    }

    function formatRangeNumericSummary(
        setting: FloatRangeSetting | IntRangeSetting,
        integer: boolean,
    ): string {
        const suffix = setting.suffix?.trim() ?? "";
        const lower = formatNumericValue(setting.value.from, integer);
        const upper = formatNumericValue(setting.value.to, integer);
        const joined = `${lower} to ${upper}`;
        return suffix.length > 0 ? `${joined} ${suffix}` : joined;
    }
</script>

<div
    class="setting-entry"
    class:inline-control-setting-entry={isInlineControlSetting}
    class:setting-entry--configurable={isConfigurableGroupSetting}
>
    <div class="setting-header">
        <strong>{setting.name}</strong>

        {#if isBooleanSetting(setting)}
            <BooleanSettingControl
                {setting}
                revealItemOptions={revealItemOptions}
                onChange={(checked) => onBooleanChange(path, checked)}
            />
        {:else if isTextSetting(setting)}
            <TextSettingControl
                {setting}
                revealItemOptions={textInputRevealItemOptions}
                onChange={(nextValue) => onTextChange(path, nextValue)}
            />
        {:else if isColorSetting(setting)}
            <ColorSettingControl
                {setting}
                revealItemOptions={revealItemOptions}
                onChange={(nextValue) => onColorChange(path, nextValue)}
            />
        {:else if isChooseSetting(setting)}
            <span class="setting-selection-summary">
                one of {setting.choices.length}
            </span>
        {:else if isMultiChooseSetting(setting)}
            <span class="setting-selection-summary">
                {setting.value.length} of {setting.choices.length}
            </span>
        {:else if isFloatSetting(setting)}
            <span class="setting-selection-summary">
                {formatSingleNumericSummary(setting, false)}
            </span>
        {:else if isIntSetting(setting)}
            <span class="setting-selection-summary">
                {formatSingleNumericSummary(setting, true)}
            </span>
        {:else if isFloatRangeSetting(setting)}
            <span class="setting-selection-summary">
                {formatRangeNumericSummary(setting, false)}
            </span>
        {:else if isIntRangeSetting(setting)}
            <span class="setting-selection-summary">
                {formatRangeNumericSummary(setting, true)}
            </span>
        {:else if isConfigurableGroupSetting}
            <div class="setting-group-meta">
                <span class="setting-selection-summary">
                    {childSettingsCountLabel}
                </span>

                {#if enabledChildSetting !== null}
                    <span class="setting-group-divider" aria-hidden="true">|</span>
                    <BooleanSettingControl
                        setting={enabledChildSetting.setting}
                        revealItemOptions={revealItemOptions}
                        onChange={(checked) =>
                            onBooleanChange(
                                childPath(enabledChildSetting.childIndex),
                                checked,
                            )}
                    />
                {/if}
            </div>
        {:else}
            <span>{setting.valueType}</span>
        {/if}
    </div>

    {#if isChooseSetting(setting)}
        <ChooseSettingControl
            {setting}
            revealItemOptions={revealItemOptions}
            onChange={(nextChoice) => onChooseChange(path, nextChoice)}
        />
    {:else if isMultiChooseSetting(setting)}
        <MultiChooseSettingControl
            {setting}
            revealItemOptions={revealItemOptions}
            onChange={(nextChoices) => onMultiChooseChange(path, nextChoices)}
        />
    {:else if isFloatSetting(setting) || isIntSetting(setting)}
        <NumberSettingControl
            setting={setting}
            textInputRevealItemOptions={textInputRevealItemOptions}
            onChange={(nextValue) => onNumberChange(path, nextValue)}
        />
    {:else if isFloatRangeSetting(setting) || isIntRangeSetting(setting)}
        <NumberRangeSettingControl
            setting={setting}
            textInputRevealItemOptions={textInputRevealItemOptions}
            onChange={(nextValue) => onNumberRangeChange(path, nextValue)}
        />
    {:else if isConfigurableGroupSetting && visibleChildSettings.length > 0}
        <div class="setting-children">
            {#each visibleChildSettings as childSetting (childSetting.setting.key ?? `${childSetting.setting.name}-${childSetting.childIndex}`)}
                <Self
                    setting={childSetting.setting}
                    path={childPath(childSetting.childIndex)}
                    {revealItemOptions}
                    {textInputRevealItemOptions}
                    {onBooleanChange}
                    {onTextChange}
                    {onColorChange}
                    {onChooseChange}
                    {onMultiChooseChange}
                    {onNumberChange}
                    {onNumberRangeChange}
                />
            {/each}
        </div>
    {:else if !isBooleanSetting(setting) && !isTextSetting(setting) && !isColorSetting(setting)}
        <pre>{JSON.stringify(setting.value, null, 2)}</pre>
    {/if}
</div>

<style lang="scss">
    .setting-group-meta {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .setting-group-divider {
        opacity: 0.62;
        font-size: 11px;
        line-height: 1;
    }
</style>
