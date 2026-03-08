import type {
    ConfigurableSetting,
    CurveSetting,
    InputBind,
    ModuleSetting,
    Range,
    Vec2,
    Vec3,
} from "../../../integration/types";
import { assertChoiceExists, getActiveChoiceTab } from "./choiceSettingUtils";
import {
    getBounds,
    normalizeRangeValue,
    normalizeSingleValue,
} from "./numericSettingUtils";
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

export type SettingMapper = (setting: ModuleSetting) => ModuleSetting;

const CURVE_ENDPOINT_EPSILON = 1e-9;

function hasSameStringValues(left: string[], right: string[]): boolean {
    return (
        left.length === right.length &&
        left.every((value, index) => value === right[index])
    );
}

function hasSameBind(left: InputBind, right: InputBind): boolean {
    const leftModifiers = Array.isArray(left.modifiers) ? left.modifiers : [];
    const rightModifiers = Array.isArray(right.modifiers)
        ? right.modifiers
        : [];

    return (
        left.boundKey === right.boundKey &&
        left.action === right.action &&
        leftModifiers.length === rightModifiers.length &&
        leftModifiers.every((modifier, index) => modifier === rightModifiers[index])
    );
}

function normalizeVectorComponent(
    value: number,
    integer: boolean,
    axis: "x" | "y" | "z",
): number {
    if (!Number.isFinite(value)) {
        throw new Error(
            `VECTOR3 setting update received a non-finite "${axis}" component: ${value}.`,
        );
    }

    return integer ? Math.round(value) : value;
}

function normalizeVectorValue(value: Vec3, integer: boolean): Vec3 {
    return {
        x: normalizeVectorComponent(value.x, integer, "x"),
        y: normalizeVectorComponent(value.y, integer, "y"),
        z: normalizeVectorComponent(value.z, integer, "z"),
    };
}

function normalizeVec2Value(value: Vec2): Vec2 {
    return {
        x: normalizeVectorComponent(value.x, false, "x"),
        y: normalizeVectorComponent(value.y, false, "y"),
    };
}

function normalizeCurvePoints(
    value: Vec2[],
    setting: CurveSetting,
): Vec2[] {
    const xBounds = getBounds(setting.xAxis.range);
    const yBounds = getBounds(setting.yAxis.range);
    const midpointY = yBounds.min + (yBounds.max - yBounds.min) / 2;
    const normalized = value.map((point, pointIndex) => {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
            throw new Error(
                `CURVE setting "${setting.name}" update has non-finite point at index ${pointIndex}: (${point.x}, ${point.y}).`,
            );
        }

        return {
            x: normalizeSingleValue(point.x, xBounds, false),
            y: normalizeSingleValue(point.y, yBounds, false),
        };
    });

    let hasMinEndpoint = false;
    let hasMaxEndpoint = false;

    for (const point of normalized) {
        if (Math.abs(point.x - xBounds.min) <= CURVE_ENDPOINT_EPSILON) {
            point.x = xBounds.min;
            hasMinEndpoint = true;
        }

        if (Math.abs(point.x - xBounds.max) <= CURVE_ENDPOINT_EPSILON) {
            point.x = xBounds.max;
            hasMaxEndpoint = true;
        }
    }

    if (!hasMinEndpoint) {
        normalized.push({
            x: xBounds.min,
            y: midpointY,
        });
    }

    if (!hasMaxEndpoint) {
        normalized.push({
            x: xBounds.max,
            y: midpointY,
        });
    }

    return normalized.sort((left, right) => left.x - right.x);
}

function hasSameCurvePoints(left: Vec2[], right: Vec2[]): boolean {
    return (
        left.length === right.length &&
        left.every(
            (point, index) =>
                point.x === right[index]?.x && point.y === right[index]?.y,
        )
    );
}

export function mapSettingTree(
    settings: ModuleSetting[],
    path: number[],
    mapper: SettingMapper,
): ModuleSetting[] {
    if (path.length === 0) {
        return settings;
    }

    const [targetIndex, ...restPath] = path;
    const targetSetting = settings[targetIndex];

    if (targetSetting === undefined) {
        return settings;
    }

    if (restPath.length === 0) {
        const nextTargetSetting = mapper(targetSetting);

        if (nextTargetSetting === targetSetting) {
            return settings;
        }

        const nextSettings = [...settings];
        nextSettings[targetIndex] = nextTargetSetting;
        return nextSettings;
    }

    if (isChoiceSetting(targetSetting)) {
        const activeChoiceTab = getActiveChoiceTab(targetSetting);
        const nextChoiceSettings = mapSettingTree(
            activeChoiceTab.setting.value,
            restPath,
            mapper,
        );

        if (nextChoiceSettings === activeChoiceTab.setting.value) {
            return settings;
        }

        const nextSettings = [...settings];
        nextSettings[targetIndex] = {
            ...targetSetting,
            choices: {
                ...targetSetting.choices,
                [activeChoiceTab.name]: {
                    ...activeChoiceTab.setting,
                    value: nextChoiceSettings,
                },
            },
        };
        return nextSettings;
    }

    if (!isNestedSettingContainer(targetSetting)) {
        return settings;
    }

    const nextNestedSettings = mapSettingTree(
        targetSetting.value,
        restPath,
        mapper,
    );

    if (nextNestedSettings === targetSetting.value) {
        return settings;
    }

    const nextSettings = [...settings];
    nextSettings[targetIndex] = {
        ...targetSetting,
        value: nextNestedSettings,
    };
    return nextSettings;
}

export function applySettingMapperToConfigurable(
    configurable: ConfigurableSetting,
    path: number[],
    mapper: SettingMapper,
): ConfigurableSetting {
    const nextValue = mapSettingTree(configurable.value, path, mapper);

    if (nextValue === configurable.value) {
        return configurable;
    }

    return {
        ...configurable,
        value: nextValue,
    };
}

export function createBooleanSettingMapper(checked: boolean): SettingMapper {
    return (setting) => {
        if (!isBooleanSetting(setting) || setting.value === checked) {
            return setting;
        }

        return {
            ...setting,
            value: checked,
        };
    };
}

export function createTextSettingMapper(nextValue: string): SettingMapper {
    return (setting) => {
        if (!isTextSetting(setting) || setting.value === nextValue) {
            return setting;
        }

        return {
            ...setting,
            value: nextValue,
        };
    };
}

export function createBindSettingMapper(nextValue: InputBind): SettingMapper {
    return (setting) => {
        if (!isBindSetting(setting) || hasSameBind(setting.value, nextValue)) {
            return setting;
        }

        return {
            ...setting,
            value: nextValue,
        };
    };
}

export function createKeySettingMapper(nextValue: string): SettingMapper {
    return (setting) => {
        if (!isKeySetting(setting) || setting.value === nextValue) {
            return setting;
        }

        return {
            ...setting,
            value: nextValue,
        };
    };
}

export function createColorSettingMapper(nextValue: number): SettingMapper {
    return (setting) => {
        if (!isColorSetting(setting) || setting.value === nextValue) {
            return setting;
        }

        return {
            ...setting,
            value: nextValue,
        };
    };
}

export function createChooseSettingMapper(nextChoice: string): SettingMapper {
    return (setting) => {
        if (!isChooseSetting(setting) || setting.value === nextChoice) {
            return setting;
        }

        return {
            ...setting,
            value: nextChoice,
        };
    };
}

export function createChoiceSettingMapper(nextChoice: string): SettingMapper {
    return (setting) => {
        if (!isChoiceSetting(setting) || setting.active === nextChoice) {
            return setting;
        }

        assertChoiceExists(setting, nextChoice);

        return {
            ...setting,
            active: nextChoice,
        };
    };
}

export function createMultiChooseSettingMapper(
    nextChoices: string[],
): SettingMapper {
    return (setting) => {
        if (!isMultiChooseSetting(setting)) {
            return setting;
        }

        return {
            ...setting,
            value: nextChoices,
        };
    };
}

export function createMutableListSettingMapper(
    nextValues: string[],
): SettingMapper {
    return (setting) => {
        if (
            !isMutableListSetting(setting) ||
            hasSameStringValues(setting.value, nextValues)
        ) {
            return setting;
        }

        return {
            ...setting,
            value: [...nextValues],
        };
    };
}

export function createFileSettingMapper(nextValue: string): SettingMapper {
    return (setting) => {
        if (!isFileSetting(setting) || setting.value === nextValue) {
            return setting;
        }

        return {
            ...setting,
            value: nextValue,
        };
    };
}

export function createRegistryListSettingMapper(
    nextValues: string[],
): SettingMapper {
    return (setting) => {
        if (
            !isRegistryListSetting(setting) ||
            hasSameStringValues(setting.value, nextValues)
        ) {
            return setting;
        }

        return {
            ...setting,
            value: [...nextValues],
        };
    };
}

export function createNumberSettingMapper(nextValue: number): SettingMapper {
    return (setting) => {
        if (isFloatSetting(setting)) {
            const normalized = normalizeSingleValue(
                nextValue,
                getBounds(setting.range),
                false,
            );

            if (normalized === setting.value) {
                return setting;
            }

            return {
                ...setting,
                value: normalized,
            };
        }

        if (isIntSetting(setting)) {
            const normalized = normalizeSingleValue(
                nextValue,
                getBounds(setting.range),
                true,
            );

            if (normalized === setting.value) {
                return setting;
            }

            return {
                ...setting,
                value: normalized,
            };
        }

        return setting;
    };
}

export function createNumberRangeSettingMapper(
    nextValue: Range,
): SettingMapper {
    return (setting) => {
        if (isFloatRangeSetting(setting)) {
            const normalized = normalizeRangeValue(
                nextValue,
                getBounds(setting.range),
                false,
            );

            if (
                normalized.from === setting.value.from &&
                normalized.to === setting.value.to
            ) {
                return setting;
            }

            return {
                ...setting,
                value: normalized,
            };
        }

        if (isIntRangeSetting(setting)) {
            const normalized = normalizeRangeValue(
                nextValue,
                getBounds(setting.range),
                true,
            );

            if (
                normalized.from === setting.value.from &&
                normalized.to === setting.value.to
            ) {
                return setting;
            }

            return {
                ...setting,
                value: normalized,
            };
        }

        return setting;
    };
}

export function createVector2SettingMapper(nextValue: Vec2): SettingMapper {
    return (setting) => {
        if (!isVec2Setting(setting)) {
            return setting;
        }

        const normalized = normalizeVec2Value(nextValue);
        if (
            setting.value.x === normalized.x &&
            setting.value.y === normalized.y
        ) {
            return setting;
        }

        return {
            ...setting,
            value: normalized,
        };
    };
}

export function createVector3SettingMapper(nextValue: Vec3): SettingMapper {
    return (setting) => {
        if (!isVec3Setting(setting)) {
            return setting;
        }

        const normalized = normalizeVectorValue(
            nextValue,
            setting.valueType === "VECTOR3_I",
        );
        if (
            setting.value.x === normalized.x &&
            setting.value.y === normalized.y &&
            setting.value.z === normalized.z
        ) {
            return setting;
        }

        return {
            ...setting,
            value: normalized,
        };
    };
}

export function createCurveSettingMapper(nextValue: Vec2[]): SettingMapper {
    return (setting) => {
        if (!isCurveSetting(setting)) {
            return setting;
        }

        const normalized = normalizeCurvePoints(nextValue, setting);
        if (hasSameCurvePoints(setting.value, normalized)) {
            return setting;
        }

        return {
            ...setting,
            value: normalized,
        };
    };
}
