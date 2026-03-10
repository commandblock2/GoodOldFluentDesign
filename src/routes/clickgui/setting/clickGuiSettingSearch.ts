import type {
    ChoiceSetting,
    ModuleSetting,
} from "../../../integration/types";
import {
    isChoiceSetting,
    isChooseSetting,
    isMultiChooseSetting,
    isNestedSettingContainer,
} from "./settingTypeGuards";

function getSettingSearchText(
    setting: ModuleSetting,
    extraTerms: string[] = [],
): string {
    return [
        setting.name,
        typeof setting.description === "string" ? setting.description : "",
        typeof setting.key === "string" ? setting.key : "",
        typeof setting.valueType === "string" ? setting.valueType : "",
        ...extraTerms,
    ]
        .join(" ")
        .toLowerCase();
}

function describeChoiceSetting(setting: ChoiceSetting): string {
    const key =
        typeof setting.key === "string" && setting.key.trim().length > 0
            ? setting.key
            : "<missing key>";

    return `CHOICE setting "${setting.name}" (key: ${key})`;
}

function findMatchingChoiceName(
    setting: ChoiceSetting,
    query: string,
): string | null {
    for (const [choiceName, choiceValue] of Object.entries(setting.choices)) {
        if (!isNestedSettingContainer(choiceValue)) {
            const actualType =
                typeof choiceValue?.valueType === "string"
                    ? choiceValue.valueType
                    : "<missing valueType>";

            throw new Error(
                `${describeChoiceSetting(setting)} tab "${choiceName}" has valueType "${actualType}". Expected CONFIGURABLE, TOGGLABLE, or TOGGLEABLE.`,
            );
        }

        if (
            getSettingSearchText(choiceValue, [choiceName]).includes(query) ||
            choiceValue.value.some((childSetting) =>
                settingMatchesSearchQuery(childSetting, query),
            )
        ) {
            return choiceName;
        }
    }

    return null;
}

function settingMatchesSearchQuery(
    setting: ModuleSetting,
    query: string,
): boolean {
    const extraTerms = [
        ...(isChooseSetting(setting) || isMultiChooseSetting(setting)
            ? setting.choices
            : []),
    ];

    if (getSettingSearchText(setting, extraTerms).includes(query)) {
        return true;
    }

    if (isChoiceSetting(setting)) {
        return findMatchingChoiceName(setting, query) !== null;
    }

    if (isNestedSettingContainer(setting)) {
        return setting.value.some((childSetting) =>
            settingMatchesSearchQuery(childSetting, query),
        );
    }

    return false;
}

function normalizeChoiceSettingForSearch(
    setting: ChoiceSetting,
    query: string,
): ChoiceSetting {
    const matchingChoiceName = findMatchingChoiceName(setting, query);

    if (matchingChoiceName === null || matchingChoiceName === setting.active) {
        return setting;
    }

    return {
        ...setting,
        active: matchingChoiceName,
    };
}

export function filterModuleSettingsForSearch(
    settings: ModuleSetting[],
    query: string,
): ModuleSetting[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
        return settings;
    }

    return settings
        .filter((setting) => settingMatchesSearchQuery(setting, normalizedQuery))
        .map((setting) =>
            isChoiceSetting(setting)
                ? normalizeChoiceSettingForSearch(setting, normalizedQuery)
                : setting,
        );
}
