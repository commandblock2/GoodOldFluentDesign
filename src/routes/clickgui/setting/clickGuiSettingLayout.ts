import type {
    BooleanSetting,
    ModuleSetting,
} from "../../../integration/types";
import { getActiveChoiceTab } from "./choiceSettingUtils";
import {
    isBindSetting,
    isBooleanSetting,
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

export interface IndexedModuleSetting {
    setting: ModuleSetting;
    settingIndex: number;
}

function getSettingKeySignature(setting: ModuleSetting): string {
    const maybeWithKey = setting as ModuleSetting & {
        key?: string;
    };

    return maybeWithKey.key ?? "";
}

export function isModuleEnabledSetting(
    setting: ModuleSetting,
): setting is BooleanSetting {
    if (!isBooleanSetting(setting)) {
        return false;
    }

    const normalizedName = setting.name.trim().toLowerCase();
    const normalizedKey = getSettingKeySignature(setting).trim().toLowerCase();

    return normalizedName === "enabled" || normalizedKey.endsWith(".enabled");
}

function isKeybindSetting(setting: ModuleSetting): boolean {
    if (isBindSetting(setting) || isKeySetting(setting)) {
        return true;
    }

    const normalizedName = setting.name.trim().toLowerCase();
    const normalizedKey = getSettingKeySignature(setting).trim().toLowerCase();

    return (
        normalizedName === "bind" ||
        normalizedName === "keybind" ||
        normalizedName === "key" ||
        normalizedKey.endsWith(".bind") ||
        normalizedKey.endsWith(".keybind") ||
        normalizedKey.endsWith(".key")
    );
}

function getDisplayPriority(setting: ModuleSetting): number {
    if (isModuleEnabledSetting(setting)) {
        return 0;
    }

    if (isKeybindSetting(setting)) {
        return 1;
    }

    return 2;
}

export function prioritizeModuleSettingsForDisplay(
    settings: ModuleSetting[],
): IndexedModuleSetting[] {
    return settings
        .map((setting, settingIndex) => ({
            setting,
            settingIndex,
        }))
        .sort((left, right) => {
            const priorityDiff =
                getDisplayPriority(left.setting) - getDisplayPriority(right.setting);

            return priorityDiff !== 0
                ? priorityDiff
                : left.settingIndex - right.settingIndex;
        });
}

export function getModuleSettingsShapeSignature(
    settings: ModuleSetting[],
): string {
    return settings
        .map(
            (setting, settingIndex) =>
                `${settingIndex}:${setting.valueType}:${setting.name}:${getSettingKeySignature(setting)}`,
        )
        .join("|");
}

export function estimateSettingHeight(setting: ModuleSetting): number {
    if (isBooleanSetting(setting)) {
        return 64;
    }

    if (isTextSetting(setting)) {
        return 88;
    }

    if (isBindSetting(setting)) {
        return 64;
    }

    if (isKeySetting(setting)) {
        return 64;
    }

    if (isColorSetting(setting)) {
        return 64;
    }

    if (isChoiceSetting(setting)) {
        const activeChoiceTab = getActiveChoiceTab(setting);
        const nestedHeights = activeChoiceTab.setting.value.reduce<number>(
            (height, nestedSetting) => height + estimateSettingHeight(nestedSetting),
            0,
        );

        return (
            110 +
            nestedHeights +
            Math.max(0, activeChoiceTab.setting.value.length - 1) * 10
        );
    }

    if (isChooseSetting(setting)) {
        return 126;
    }

    if (isMultiChooseSetting(setting)) {
        return 136 + Math.ceil(setting.choices.length / 4) * 28;
    }

    if (isMutableListSetting(setting)) {
        return 92 + Math.max(1, setting.value.length) * 36;
    }

    if (isFileSetting(setting)) {
        return 88;
    }

    if (isRegistryListSetting(setting)) {
        return 322;
    }

    if (isCurveSetting(setting)) {
        return 248;
    }

    if (isFloatSetting(setting) || isIntSetting(setting)) {
        return 108;
    }

    if (isFloatRangeSetting(setting) || isIntRangeSetting(setting)) {
        return 136;
    }

    if (isVec2Setting(setting) || isVec3Setting(setting)) {
        return 84;
    }

    if (isNestedSettingContainer(setting)) {
        const nestedHeights = setting.value.reduce<number>(
            (height, nestedSetting) => height + estimateSettingHeight(nestedSetting),
            0,
        );

        return 54 + nestedHeights + Math.max(0, setting.value.length - 1) * 10;
    }

    const valueLength = JSON.stringify(setting.value).length;
    return 90 + Math.min(240, Math.ceil(valueLength / 42) * 18);
}

export function buildSettingsColumns(
    orderedSettings: IndexedModuleSetting[],
    settingsColumnCount: number,
    settingHeights: Record<number, number>,
    useMeasuredHeights: boolean,
): IndexedModuleSetting[][] {
    const nextColumnCount = Math.max(1, settingsColumnCount);
    const columns = Array.from(
        { length: nextColumnCount },
        () => [] as IndexedModuleSetting[],
    );
    const columnHeights = Array.from({ length: nextColumnCount }, () => 0);
    const heightSource = useMeasuredHeights ? settingHeights : {};

    orderedSettings.forEach((entry) => {
        let targetColumn = 0;

        for (let i = 1; i < nextColumnCount; i++) {
            if (columnHeights[i] < columnHeights[targetColumn]) {
                targetColumn = i;
            }
        }

        columns[targetColumn].push(entry);
        columnHeights[targetColumn] +=
            heightSource[entry.settingIndex] ??
            estimateSettingHeight(entry.setting);
    });

    return columns;
}
