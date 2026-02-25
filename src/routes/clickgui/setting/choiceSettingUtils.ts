import type { ChoiceSetting } from "../../../integration/types";
import {
    isNestedSettingContainer,
    type NestedSettingContainer,
} from "./settingTypeGuards";

export interface ActiveChoiceTab {
    name: string;
    setting: NestedSettingContainer;
}

function describeChoiceSetting(setting: ChoiceSetting): string {
    const key =
        typeof setting.key === "string" && setting.key.trim().length > 0
            ? setting.key
            : "<missing key>";

    return `CHOICE setting "${setting.name}" (key: ${key})`;
}

export function getChoiceNames(setting: ChoiceSetting): string[] {
    const choiceNames = Object.keys(setting.choices);

    if (choiceNames.length === 0) {
        throw new Error(
            `${describeChoiceSetting(setting)} has an empty "choices" map. Expected at least one tab entry.`,
        );
    }

    return choiceNames;
}

export function assertChoiceExists(
    setting: ChoiceSetting,
    choiceName: string,
): void {
    const choiceNames = getChoiceNames(setting);

    if (!Object.prototype.hasOwnProperty.call(setting.choices, choiceName)) {
        throw new Error(
            `${describeChoiceSetting(setting)} cannot select tab "${choiceName}". Available tabs: ${choiceNames.join(", ")}.`,
        );
    }
}

export function getActiveChoiceTab(setting: ChoiceSetting): ActiveChoiceTab {
    const choiceNames = getChoiceNames(setting);

    if (setting.active.trim().length === 0) {
        throw new Error(
            `${describeChoiceSetting(setting)} has an empty "active" tab value. Expected one of: ${choiceNames.join(", ")}.`,
        );
    }

    assertChoiceExists(setting, setting.active);

    const activeChoiceSetting = setting.choices[setting.active];
    if (!isNestedSettingContainer(activeChoiceSetting)) {
        const actualType =
            typeof activeChoiceSetting?.valueType === "string"
                ? activeChoiceSetting.valueType
                : "<missing valueType>";

        throw new Error(
            `${describeChoiceSetting(setting)} tab "${setting.active}" has valueType "${actualType}". Expected CONFIGURABLE, TOGGLABLE, or TOGGLEABLE.`,
        );
    }

    return {
        name: setting.active,
        setting: activeChoiceSetting,
    };
}

export function getChoiceContentKey(setting: ChoiceSetting): string {
    const keyPart =
        typeof setting.key === "string" && setting.key.trim().length > 0
            ? setting.key
            : setting.name;

    return `${keyPart}:${setting.active}`;
}
