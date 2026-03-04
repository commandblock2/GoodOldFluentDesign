import type {
    BindSetting,
    InputBind,
    BooleanSetting,
    ChoiceSetting,
    ColorSetting,
    ChooseSetting,
    ConfigurableSetting,
    FloatRangeSetting,
    FloatSetting,
    IntRangeSetting,
    IntSetting,
    ModuleSetting,
    MultiChooseSetting,
    ListSetting,
    KeySetting,
    TextSetting,
    TogglableSetting,
    Vec2Setting,
    Vec3Setting,
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

export function isBindSetting(setting: ModuleSetting): setting is BindSetting {
    const bindValue = (setting as { value?: Partial<InputBind> }).value;
    return (
        setting.valueType === "BIND" &&
        typeof bindValue === "object" &&
        bindValue !== null &&
        typeof bindValue.boundKey === "string" &&
        typeof bindValue.action === "string" &&
        (bindValue.modifiers === undefined ||
            Array.isArray(bindValue.modifiers))
    );
}

export function isKeySetting(setting: ModuleSetting): setting is KeySetting {
    return (
        setting.valueType === "KEY" &&
        typeof (setting as KeySetting).value === "string"
    );
}

export function isChoiceSetting(
    setting: ModuleSetting,
): setting is ChoiceSetting {
    const choiceSetting = setting as Partial<ChoiceSetting>;

    return (
        setting.valueType === "CHOICE" &&
        typeof choiceSetting.active === "string" &&
        Array.isArray(choiceSetting.value) &&
        choiceSetting.choices !== null &&
        choiceSetting.choices !== undefined &&
        typeof choiceSetting.choices === "object" &&
        !Array.isArray(choiceSetting.choices)
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

export function isMutableListSetting(
    setting: ModuleSetting,
): setting is ListSetting {
    const listSetting = setting as Partial<ListSetting>;

    return (
        (setting.valueType === "MUTABLE_LIST" || setting.valueType === "LIST") &&
        Array.isArray(listSetting.value) &&
        listSetting.value.every((entry) => typeof entry === "string") &&
        typeof listSetting.innerValueType === "string"
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

export function isVec2Setting(setting: ModuleSetting): setting is Vec2Setting {
    const value = (setting as { value?: Partial<Vec2Setting["value"]> }).value;

    return (
        setting.valueType === "VECTOR2_F" &&
        typeof value === "object" &&
        value !== null &&
        typeof value.x === "number" &&
        Number.isFinite(value.x) &&
        typeof value.y === "number" &&
        Number.isFinite(value.y)
    );
}

export function isVec3Setting(setting: ModuleSetting): setting is Vec3Setting {
    const value = (setting as { value?: Partial<Vec3Setting["value"]> }).value;

    return (
        (setting.valueType === "VECTOR3_D" ||
            setting.valueType === "VECTOR3_I") &&
        typeof value === "object" &&
        value !== null &&
        typeof value.x === "number" &&
        Number.isFinite(value.x) &&
        typeof value.y === "number" &&
        Number.isFinite(value.y) &&
        typeof value.z === "number" &&
        Number.isFinite(value.z)
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
