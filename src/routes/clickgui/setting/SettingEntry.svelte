<script lang="ts">
    import type {
        BooleanSetting,
        ModuleSetting,
    } from "../../../integration/types";
    import type { RevealItemOptions } from "fluent-reveal-svelte";
    import BooleanSettingControl from "./BooleanSettingControl.svelte";
    import ChooseSettingControl from "./ChooseSettingControl.svelte";
    import MultiChooseSettingControl from "./MultiChooseSettingControl.svelte";
    import Self from "./SettingEntry.svelte";
    import TextSettingControl from "./TextSettingControl.svelte";
    import {
        isBooleanSetting,
        isChooseSetting,
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
        onChooseChange?: (
            path: number[],
            value: string,
        ) => void | Promise<void>;
        onMultiChooseChange?: (
            path: number[],
            values: string[],
        ) => void | Promise<void>;
    }

    const defaultBooleanChange = (_path: number[], _checked: boolean) => {};
    const defaultTextChange = (_path: number[], _value: string) => {};
    const defaultChooseChange = (_path: number[], _value: string) => {};
    const defaultMultiChooseChange = (_path: number[], _values: string[]) => {};

    let {
        setting,
        path = [],
        revealItemOptions,
        textInputRevealItemOptions,
        onBooleanChange = defaultBooleanChange,
        onTextChange = defaultTextChange,
        onChooseChange = defaultChooseChange,
        onMultiChooseChange = defaultMultiChooseChange,
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
        isBooleanSetting(setting) || isTextSetting(setting),
    );
    const isConfigurableGroupSetting = $derived(
        isNestedSettingContainer(setting),
    );

    function childPath(childIndex: number) {
        return [...path, childIndex];
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
        {:else if isChooseSetting(setting)}
            <span class="setting-selection-summary">
                one of {setting.choices.length}
            </span>
        {:else if isMultiChooseSetting(setting)}
            <span class="setting-selection-summary">
                {setting.value.length} of {setting.choices.length}
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
                    {onChooseChange}
                    {onMultiChooseChange}
                />
            {/each}
        </div>
    {:else if !isBooleanSetting(setting) && !isTextSetting(setting)}
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
