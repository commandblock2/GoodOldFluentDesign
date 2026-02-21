import type {
    BooleanSetting,
    ColorSetting,
    ChooseSetting,
    ConfigurableSetting,
    FloatRangeSetting,
    FloatSetting,
    IntRangeSetting,
    IntSetting,
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

export function isColorSetting(setting: ModuleSetting): setting is ColorSetting {
    return (
        setting.valueType === "COLOR" &&
        typeof (setting as ColorSetting).value === "number"
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

export function isFloatSetting(setting: ModuleSetting): setting is FloatSetting {
    return (
        setting.valueType === "FLOAT" &&
        typeof (setting as FloatSetting).value === "number" &&
        (setting as FloatSetting).range !== undefined
    );
}

export function isIntSetting(setting: ModuleSetting): setting is IntSetting {
    return (
        setting.valueType === "INT" &&
        typeof (setting as IntSetting).value === "number" &&
        (setting as IntSetting).range !== undefined
    );
}

export function isFloatRangeSetting(
    setting: ModuleSetting,
): setting is FloatRangeSetting {
    return (
        setting.valueType === "FLOAT_RANGE" &&
        typeof (setting as FloatRangeSetting).value === "object" &&
        (setting as FloatRangeSetting).value !== null &&
        (setting as FloatRangeSetting).range !== undefined
    );
}

export function isIntRangeSetting(
    setting: ModuleSetting,
): setting is IntRangeSetting {
    return (
        setting.valueType === "INT_RANGE" &&
        typeof (setting as IntRangeSetting).value === "object" &&
        (setting as IntRangeSetting).value !== null &&
        (setting as IntRangeSetting).range !== undefined
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
