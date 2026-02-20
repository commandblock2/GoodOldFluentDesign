import type {
    BooleanSetting,
    ChooseSetting,
    ConfigurableSetting,
    ModuleSetting,
    MultiChooseSetting,
    TextSetting,
    TogglableSetting,
} from "../../../integration/types";

export type NestedSettingContainer = ConfigurableSetting | TogglableSetting;

export function isBooleanSetting(
    setting: ModuleSetting,
): setting is BooleanSetting {
    return (
        setting.valueType === "BOOLEAN" &&
        typeof (setting as BooleanSetting).value === "boolean"
    );
}

export function isTextSetting(setting: ModuleSetting): setting is TextSetting {
    return (
        setting.valueType === "TEXT" &&
        typeof (setting as TextSetting).value === "string"
    );
}

export function isChooseSetting(
    setting: ModuleSetting,
): setting is ChooseSetting {
    return (
        setting.valueType === "CHOOSE" &&
        typeof (setting as ChooseSetting).value === "string" &&
        Array.isArray((setting as ChooseSetting).choices)
    );
}

export function isMultiChooseSetting(
    setting: ModuleSetting,
): setting is MultiChooseSetting {
    return (
        (setting.valueType === "MULTI_CHOOSE" ||
            setting.valueType === "MUTLI_CHOOSE") &&
        Array.isArray((setting as MultiChooseSetting).value) &&
        Array.isArray((setting as MultiChooseSetting).choices)
    );
}

export function isNestedSettingContainer(
    setting: ModuleSetting,
): setting is NestedSettingContainer {
    return (
        (setting.valueType === "CONFIGURABLE" ||
            setting.valueType === "TOGGLABLE" ||
            setting.valueType === "TOGGLEABLE") &&
        Array.isArray((setting as NestedSettingContainer).value)
    );
}
