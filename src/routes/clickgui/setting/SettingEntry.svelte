<script lang="ts">
    import type {
        CurveSetting,
        FileSetting,
        BooleanSetting,
        FloatRangeSetting,
        FloatSetting,
        IntRangeSetting,
        IntSetting,
        ModuleSetting,
        Vec2Setting,
        Vec3Setting,
    } from "../../../integration/types";
    import type { RevealItemOptions } from "fluent-reveal-svelte";
    import BindSettingControl from "./BindSettingControl.svelte";
    import BooleanSettingControl from "./BooleanSettingControl.svelte";
    import ChoiceSettingControl from "./ChoiceSettingControl.svelte";
    import ColorSettingControl from "./ColorSettingControl.svelte";
    import CurveSettingControl from "./CurveSettingControl.svelte";
    import ChooseSettingControl from "./ChooseSettingControl.svelte";
    import FileSettingControl from "./FileSettingControl.svelte";
    import KeySettingControl from "./KeySettingControl.svelte";
    import MultiChooseSettingControl from "./MultiChooseSettingControl.svelte";
    import MutableListSettingControl from "./MutableListSettingControl.svelte";
    import NumberRangeSettingControl from "./NumberRangeSettingControl.svelte";
    import NumberSettingControl from "./NumberSettingControl.svelte";
    import RegistryListSettingControl from "./RegistryListSettingControl.svelte";
    import Self from "./SettingEntry.svelte";
    import TextSettingControl from "./TextSettingControl.svelte";
    import Vec2SettingControl from "./Vec2SettingControl.svelte";
    import Vector3SettingControl from "./Vector3SettingControl.svelte";
    import {
        resolveClickGuiSettingHandlers,
        type ClickGuiSettingHandlers,
    } from "./clickGuiSettingHandlers";
    import {
        getActiveChoiceTab,
        getChoiceContentKey,
        getChoiceNames,
    } from "./choiceSettingUtils";
    import { formatNumericValue } from "./numericSettingUtils";
    import { getSettingEntryRowKey } from "./settingEntryKey.js";
    import {
        isBooleanSetting,
        isBindSetting,
        isChoiceSetting,
        isColorSetting,
        isCurveSetting,
        isChooseSetting,
        isFileSetting,
        isFloatRangeSetting,
        isFloatSetting,
        isIntRangeSetting,
        isIntSetting,
        isKeySetting,
        isMultiChooseSetting,
        isMutableListSetting,
        isNestedSettingContainer,
        isRegistryListSetting,
        isTextSetting,
        isVec2Setting,
        isVec3Setting,
    } from "./settingTypeGuards";

    interface Props {
        setting: ModuleSetting;
        path?: number[];
        revealItemOptions: RevealItemOptions;
        textInputRevealItemOptions: RevealItemOptions;
        handlers?: ClickGuiSettingHandlers;
    }

    let {
        setting,
        path = [],
        revealItemOptions,
        textInputRevealItemOptions,
        handlers,
    }: Props = $props();
    const resolvedHandlers = $derived(resolveClickGuiSettingHandlers(handlers));

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
    const showChildSettingsCount = $derived(visibleChildSettingsCount > 0);
    const isInlineControlSetting = $derived(
        isBooleanSetting(setting) ||
            isTextSetting(setting) ||
            isBindSetting(setting) ||
            isKeySetting(setting) ||
            isColorSetting(setting),
    );
    const isConfigurableGroupSetting = $derived(
        isNestedSettingContainer(setting),
    );
    const hasConfigurableChildContent = $derived(
        isConfigurableGroupSetting && visibleChildSettings.length > 0,
    );
    const settingDescription = $derived(
        typeof setting.description === "string" ? setting.description.trim() : "",
    );
    const choiceSetting = $derived(
        isChoiceSetting(setting) ? setting : null,
    );
    const choiceNames = $derived(
        choiceSetting === null ? [] : getChoiceNames(choiceSetting),
    );
    const activeChoiceTab = $derived(
        choiceSetting === null ? null : getActiveChoiceTab(choiceSetting),
    );
    const choiceIndexedChildSettings = $derived(
        activeChoiceTab === null
            ? []
            : activeChoiceTab.setting.value.map((childSetting, childIndex) => ({
                  setting: childSetting,
                  childIndex,
              })),
    );
    const choiceEnabledChildSetting = $derived(
        choiceIndexedChildSettings.find(
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
    const choiceVisibleChildSettings = $derived(
        choiceEnabledChildSetting === null
            ? choiceIndexedChildSettings
            : choiceIndexedChildSettings.filter(
                  (childSetting) =>
                      childSetting.childIndex !== choiceEnabledChildSetting.childIndex,
              ),
    );
    const choiceVisibleChildSettingsCount = $derived(
        choiceVisibleChildSettings.length,
    );
    const choiceSettingsCountLabel = $derived(
        `${choiceVisibleChildSettingsCount} Setting${choiceVisibleChildSettingsCount === 1 ? "" : "s"}`,
    );
    const showChoiceSettingsCount = $derived(
        choiceVisibleChildSettingsCount > 0,
    );
    const choiceSelectionSummary = $derived(
        choiceSetting === null
            ? ""
            : `${choiceSetting.active} | ${choiceNames.length} Tab${choiceNames.length === 1 ? "" : "s"}`,
    );
    const choiceContentKey = $derived(
        choiceSetting === null ? "" : getChoiceContentKey(choiceSetting),
    );
    const isKnownSetting = $derived(
        isBooleanSetting(setting) ||
            isTextSetting(setting) ||
            isBindSetting(setting) ||
            isKeySetting(setting) ||
            isColorSetting(setting) ||
            isChoiceSetting(setting) ||
            isChooseSetting(setting) ||
            isMultiChooseSetting(setting) ||
            isMutableListSetting(setting) ||
            isFileSetting(setting) ||
            isRegistryListSetting(setting) ||
            isCurveSetting(setting) ||
            isFloatSetting(setting) ||
            isIntSetting(setting) ||
            isFloatRangeSetting(setting) ||
            isIntRangeSetting(setting) ||
            isVec2Setting(setting) ||
            isVec3Setting(setting) ||
            isConfigurableGroupSetting
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

    function formatVec2Summary(setting: Vec2Setting): string {
        return `X ${formatNumericValue(setting.value.x, false)} | Y ${formatNumericValue(setting.value.y, false)}`;
    }

    function formatVectorSummary(setting: Vec3Setting): string {
        const integer = setting.valueType === "VECTOR3_I";
        return `X ${formatNumericValue(setting.value.x, integer)} | Y ${formatNumericValue(setting.value.y, integer)} | Z ${formatNumericValue(setting.value.z, integer)}`;
    }

    function formatFileSummary(setting: FileSetting): string {
        return setting.value.trim().length === 0 ? "empty" : "selected";
    }

    function formatCurveSummary(setting: CurveSetting): string {
        return `${setting.value.length} Point${setting.value.length === 1 ? "" : "s"}`;
    }
</script>

<div
    class="setting-entry"
    class:inline-control-setting-entry={isInlineControlSetting}
    class:setting-entry--configurable={hasConfigurableChildContent}
>
    <div class="setting-header">
        <div class="setting-title-block">
            <strong class="setting-title">{setting.name}</strong>

            {#if settingDescription.length > 0}
                <span class="setting-description">{settingDescription}</span>
            {/if}
        </div>

        {#if isBooleanSetting(setting)}
            <BooleanSettingControl
                {setting}
                revealItemOptions={revealItemOptions}
                onChange={(checked) =>
                    resolvedHandlers.onBooleanChange(path, checked)}
            />
        {:else if isTextSetting(setting)}
            <TextSettingControl
                {setting}
                revealItemOptions={textInputRevealItemOptions}
                onChange={(nextValue) =>
                    resolvedHandlers.onTextChange(path, nextValue)}
            />
        {:else if isBindSetting(setting)}
            <BindSettingControl
                {setting}
                revealItemOptions={revealItemOptions}
                onChange={(nextValue) =>
                    resolvedHandlers.onBindChange(path, nextValue)}
            />
        {:else if isKeySetting(setting)}
            <KeySettingControl
                {setting}
                revealItemOptions={revealItemOptions}
                onChange={(nextValue) =>
                    resolvedHandlers.onKeyChange(path, nextValue)}
            />
        {:else if isColorSetting(setting)}
            <ColorSettingControl
                {setting}
                revealItemOptions={revealItemOptions}
                onChange={(nextValue) =>
                    resolvedHandlers.onColorChange(path, nextValue)}
            />
        {:else if isChoiceSetting(setting)}
            <span class="setting-selection-summary">
                {choiceSelectionSummary}
            </span>
        {:else if isChooseSetting(setting)}
            <span class="setting-selection-summary">
                one of {setting.choices.length}
            </span>
        {:else if isMultiChooseSetting(setting)}
            <span class="setting-selection-summary">
                {setting.value.length} of {setting.choices.length}
            </span>
        {:else if isMutableListSetting(setting)}
            <span class="setting-selection-summary">
                {setting.value.length} Entr{setting.value.length === 1 ? "y" : "ies"}
            </span>
        {:else if isFileSetting(setting)}
            <span class="setting-selection-summary">
                {formatFileSummary(setting)}
            </span>
        {:else if isRegistryListSetting(setting)}
            <span class="setting-selection-summary">
                {setting.value.length} Selected
            </span>
        {:else if isCurveSetting(setting)}
            <span class="setting-selection-summary">
                {formatCurveSummary(setting)}
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
        {:else if isVec2Setting(setting)}
            <span class="setting-selection-summary">
                {formatVec2Summary(setting)}
            </span>
        {:else if isVec3Setting(setting)}
            <span class="setting-selection-summary">
                {formatVectorSummary(setting)}
            </span>
        {:else if isConfigurableGroupSetting}
            <div class="setting-group-meta">
                {#if showChildSettingsCount}
                    <span class="setting-selection-summary">
                        {childSettingsCountLabel}
                    </span>
                {/if}

                {#if enabledChildSetting !== null}
                    {#if showChildSettingsCount}
                        <span class="setting-group-divider" aria-hidden="true">|</span>
                    {/if}
                    <BooleanSettingControl
                        setting={enabledChildSetting.setting}
                        revealItemOptions={revealItemOptions}
                        onChange={(checked) =>
                            resolvedHandlers.onBooleanChange(
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

    {#if isChoiceSetting(setting)}
        <ChoiceSettingControl
            setting={setting}
            revealItemOptions={revealItemOptions}
            onChange={(nextChoice: string) =>
                resolvedHandlers.onChoiceChange(path, nextChoice)}
        />

        {#if activeChoiceTab !== null}
            {#key choiceContentKey}
                <div class="setting-entry setting-entry--configurable choice-setting-content">
                    <div class="setting-header">
                        <div class="setting-title-block">
                            <strong class="setting-title">{activeChoiceTab.name}</strong>

                            {#if typeof activeChoiceTab.setting.description === "string" && activeChoiceTab.setting.description.trim().length > 0}
                                <span class="setting-description">
                                    {activeChoiceTab.setting.description.trim()}
                                </span>
                            {/if}
                        </div>

                        <div class="setting-group-meta">
                            {#if showChoiceSettingsCount}
                                <span class="setting-selection-summary">
                                    {choiceSettingsCountLabel}
                                </span>
                            {/if}

                            {#if choiceEnabledChildSetting !== null}
                                {#if showChoiceSettingsCount}
                                    <span class="setting-group-divider" aria-hidden="true">|</span>
                                {/if}
                                <BooleanSettingControl
                                    setting={choiceEnabledChildSetting.setting}
                                    revealItemOptions={revealItemOptions}
                                    onChange={(checked) =>
                                        resolvedHandlers.onBooleanChange(
                                            childPath(choiceEnabledChildSetting.childIndex),
                                            checked,
                                        )}
                                />
                            {/if}
                        </div>
                    </div>

                    {#if choiceVisibleChildSettings.length === 0}
                        <div class="choice-setting-empty">
                            No settings in this tab.
                        </div>
                    {:else}
                        <div class="setting-children">
                            {#each choiceVisibleChildSettings as childSetting (getSettingEntryRowKey(childSetting.setting, childSetting.childIndex))}
                                <Self
                                    setting={childSetting.setting}
                                    path={childPath(childSetting.childIndex)}
                                    {revealItemOptions}
                                    {textInputRevealItemOptions}
                                    handlers={resolvedHandlers}
                                />
                            {/each}
                        </div>
                    {/if}
                </div>
            {/key}
        {/if}
    {:else if isChooseSetting(setting)}
        <ChooseSettingControl
            {setting}
            revealItemOptions={revealItemOptions}
            onChange={(nextChoice) =>
                resolvedHandlers.onChooseChange(path, nextChoice)}
        />
    {:else if isMultiChooseSetting(setting)}
        <MultiChooseSettingControl
            {setting}
            revealItemOptions={revealItemOptions}
            onChange={(nextChoices) =>
                resolvedHandlers.onMultiChooseChange(path, nextChoices)}
        />
    {:else if isMutableListSetting(setting)}
        <MutableListSettingControl
            {setting}
            textInputRevealItemOptions={textInputRevealItemOptions}
            actionRevealItemOptions={revealItemOptions}
            onChange={(nextValues) =>
                resolvedHandlers.onMutableListChange(path, nextValues)}
        />
    {:else if isFileSetting(setting)}
        <FileSettingControl
            {setting}
            revealItemOptions={revealItemOptions}
            onChange={(nextValue) =>
                resolvedHandlers.onFileChange(path, nextValue)}
        />
    {:else if isRegistryListSetting(setting)}
        <RegistryListSettingControl
            {setting}
            revealItemOptions={revealItemOptions}
            textInputRevealItemOptions={textInputRevealItemOptions}
            onChange={(nextValues) =>
                resolvedHandlers.onRegistryListChange(path, nextValues)}
        />
    {:else if isCurveSetting(setting)}
        <CurveSettingControl
            {setting}
            revealItemOptions={revealItemOptions}
            onChange={(nextValues) =>
                resolvedHandlers.onCurveChange(path, nextValues)}
        />
    {:else if isFloatSetting(setting) || isIntSetting(setting)}
        <NumberSettingControl
            setting={setting}
            textInputRevealItemOptions={textInputRevealItemOptions}
            onChange={(nextValue) =>
                resolvedHandlers.onNumberChange(path, nextValue)}
        />
    {:else if isFloatRangeSetting(setting) || isIntRangeSetting(setting)}
        <NumberRangeSettingControl
            setting={setting}
            textInputRevealItemOptions={textInputRevealItemOptions}
            onChange={(nextValue) =>
                resolvedHandlers.onNumberRangeChange(path, nextValue)}
        />
    {:else if isVec2Setting(setting)}
        <Vec2SettingControl
            {setting}
            textInputRevealItemOptions={textInputRevealItemOptions}
            onChange={(nextValue) =>
                resolvedHandlers.onVector2Change(path, nextValue)}
        />
    {:else if isVec3Setting(setting)}
        <Vector3SettingControl
            {setting}
            textInputRevealItemOptions={textInputRevealItemOptions}
            onChange={(nextValue) =>
                resolvedHandlers.onVector3Change(path, nextValue)}
        />
    {:else if hasConfigurableChildContent}
        <div class="setting-children">
            {#each visibleChildSettings as childSetting (getSettingEntryRowKey(childSetting.setting, childSetting.childIndex))}
                <Self
                    setting={childSetting.setting}
                    path={childPath(childSetting.childIndex)}
                    {revealItemOptions}
                    {textInputRevealItemOptions}
                    handlers={resolvedHandlers}
                />
            {/each}
        </div>
    {:else if !isKnownSetting}
        <pre>{JSON.stringify(setting.value, null, 2)}</pre>
    {/if}
</div>

<style lang="scss">
    .setting-title-block {
        display: flex;
        flex: 1 1 auto;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 4px 8px;
        min-width: 0;
    }

    .setting-title {
        flex-shrink: 0;
    }

    .setting-description {
        min-width: 0;
        font-size: 11px;
        line-height: 1.45;
        letter-spacing: 0.02em;
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.9);
        overflow-wrap: anywhere;
    }

    .setting-group-meta {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
    }

    .setting-group-divider {
        opacity: 0.62;
        font-size: 11px;
        line-height: 1;
    }

    .choice-setting-content {
        margin-top: 8px;
    }

    .choice-setting-empty {
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        opacity: 0.76;
    }
</style>
