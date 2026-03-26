import { setItem } from "../../integration/persistent_storage";
import {
    rgbaColorToCssString,
    rgbaColorToRgbChannels,
    validateRgbaColor,
    type RgbaColor,
} from "./clickGuiColorUtils";

const CLICKGUI_THEME_STORAGE_KEY = "clickgui.theme.preferences.v6";
const LEGACY_CLICKGUI_THEME_STORAGE_KEY = "clickgui.theme.preferences.v5";
const OLDER_CLICKGUI_THEME_STORAGE_KEY = "clickgui.theme.preferences.v4";
const OLDEST_CLICKGUI_THEME_STORAGE_KEY = "clickgui.theme.preferences.v3";
const ANCIENT_CLICKGUI_THEME_STORAGE_KEY = "clickgui.theme.preferences.v2";
const PRIMITIVE_CLICKGUI_THEME_STORAGE_KEY = "clickgui.theme.preferences.v1";
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const MAX_SETTINGS_SPLIT_COUNT = 2;
const MODULE_PRIMARY_INTERACTIONS = [
    "open-config",
    "toggle-module",
] as const;
const MODULE_ACCENT_MODES = [
    "tile-background",
    "action-toggle",
    "text-only",
] as const;
const STICKY_SURFACE_INTENSITIES = [
    "soft",
    "balanced",
    "strong",
] as const;

export type ClickGuiModulePrimaryInteraction =
    (typeof MODULE_PRIMARY_INTERACTIONS)[number];
export type ClickGuiModuleAccentMode = (typeof MODULE_ACCENT_MODES)[number];
export type ClickGuiStickySurfaceIntensity =
    (typeof STICKY_SURFACE_INTENSITIES)[number];

export interface ClickGuiThemePreferences {
    accentColor: string;
    baseColor: string;
    backgroundColor: RgbaColor;
    offButtonColor: RgbaColor;
    inputBackgroundColor: RgbaColor;
    panelBackgroundColor: RgbaColor;
    textColor: string;
    dimmedTextColor: string;
    settingsSplitCount: number;
    modulePrimaryInteraction: ClickGuiModulePrimaryInteraction;
    showModuleRowActions: boolean;
    moduleAccentMode: ClickGuiModuleAccentMode;
    stickySurfaceIntensity: ClickGuiStickySurfaceIntensity;
}

export interface ClickGuiThemePreset
    extends Omit<
        ClickGuiThemePreferences,
        | "modulePrimaryInteraction"
        | "showModuleRowActions"
        | "moduleAccentMode"
        | "stickySurfaceIntensity"
    > {
    id: string;
    label: string;
    description: string;
}

export const defaultClickGuiThemePreferences: ClickGuiThemePreferences = {
    accentColor: "#4677ff",
    baseColor: "#000000",
    backgroundColor: {
        red: 0,
        green: 0,
        blue: 0,
        alpha: 0.15,
    },
    offButtonColor: {
        red: 255,
        green: 255,
        blue: 255,
        alpha: 0.14,
    },
    inputBackgroundColor: {
        red: 255,
        green: 255,
        blue: 255,
        alpha: 0.14,
    },
    panelBackgroundColor: {
        red: 0,
        green: 0,
        blue: 0,
        alpha: 0.7,
    },
    textColor: "#ffffff",
    dimmedTextColor: "#d3d3d3",
    settingsSplitCount: 1,
    modulePrimaryInteraction: "open-config",
    showModuleRowActions: true,
    moduleAccentMode: "action-toggle",
    stickySurfaceIntensity: "balanced",
};

export const clickGuiThemePresets = [
    {
        id: "classic",
        label: "Classic Blue",
        description: "Default dark shell with the existing blue accent.",
        accentColor: "#4677ff",
        baseColor: "#000000",
        backgroundColor: {
            red: 0,
            green: 0,
            blue: 0,
            alpha: 0.38,
        },
        offButtonColor: {
            red: 255,
            green: 255,
            blue: 255,
            alpha: 0.14,
        },
        inputBackgroundColor: {
            red: 255,
            green: 255,
            blue: 255,
            alpha: 0.14,
        },
        panelBackgroundColor: {
            red: 0,
            green: 0,
            blue: 0,
            alpha: 0.7,
        },
        textColor: "#ffffff",
        dimmedTextColor: "#d3d3d3",
        settingsSplitCount: 1,
    },
    {
        id: "ember",
        label: "Ember",
        description: "Warm orange accent with softer text contrast.",
        accentColor: "#ff7a1f",
        baseColor: "#0a0502",
        backgroundColor: {
            red: 10,
            green: 5,
            blue: 2,
            alpha: 0.43,
        },
        offButtonColor: {
            red: 255,
            green: 243,
            blue: 230,
            alpha: 0.14,
        },
        inputBackgroundColor: {
            red: 255,
            green: 243,
            blue: 230,
            alpha: 0.14,
        },
        panelBackgroundColor: {
            red: 10,
            green: 5,
            blue: 2,
            alpha: 0.72,
        },
        textColor: "#fff3e6",
        dimmedTextColor: "#c7ad98",
        settingsSplitCount: 1,
    },
    {
        id: "ice",
        label: "Ice",
        description: "Cool cyan accent with sharper monochrome text.",
        accentColor: "#31d6ff",
        baseColor: "#03070b",
        backgroundColor: {
            red: 3,
            green: 7,
            blue: 11,
            alpha: 0.39,
        },
        offButtonColor: {
            red: 246,
            green: 252,
            blue: 255,
            alpha: 0.15,
        },
        inputBackgroundColor: {
            red: 246,
            green: 252,
            blue: 255,
            alpha: 0.15,
        },
        panelBackgroundColor: {
            red: 3,
            green: 7,
            blue: 11,
            alpha: 0.72,
        },
        textColor: "#f6fcff",
        dimmedTextColor: "#9db2bf",
        settingsSplitCount: 1,
    },
    {
        id: "limewire",
        label: "Limewire",
        description: "Bright green accent with a harder technical feel.",
        accentColor: "#8dd174",
        baseColor: "#040704",
        backgroundColor: {
            red: 4,
            green: 7,
            blue: 4,
            alpha: 0.41,
        },
        offButtonColor: {
            red: 239,
            green: 255,
            blue: 237,
            alpha: 0.14,
        },
        inputBackgroundColor: {
            red: 239,
            green: 255,
            blue: 237,
            alpha: 0.14,
        },
        panelBackgroundColor: {
            red: 4,
            green: 7,
            blue: 4,
            alpha: 0.72,
        },
        textColor: "#efffed",
        dimmedTextColor: "#a7c2a2",
        settingsSplitCount: 2,
    },
    {
        id: "rose",
        label: "Rose Alloy",
        description: "Muted red accent with slightly warmer neutrals.",
        accentColor: "#ff5a78",
        baseColor: "#0d0608",
        backgroundColor: {
            red: 13,
            green: 6,
            blue: 8,
            alpha: 0.40,
        },
        offButtonColor: {
            red: 255,
            green: 242,
            blue: 245,
            alpha: 0.14,
        },
        inputBackgroundColor: {
            red: 255,
            green: 242,
            blue: 245,
            alpha: 0.14,
        },
        panelBackgroundColor: {
            red: 13,
            green: 6,
            blue: 8,
            alpha: 0.72,
        },
        textColor: "#fff2f5",
        dimmedTextColor: "#c4a7ae",
        settingsSplitCount: 1,
    },
] as const satisfies readonly ClickGuiThemePreset[];

function normalizeHexColor(value: string, fieldName: string): string {
    if (!HEX_COLOR_PATTERN.test(value)) {
        throw new Error(
            `ClickGUI theme preference "${fieldName}" must be a #RRGGBB hex color. Received: ${value}`,
        );
    }

    return value.toLowerCase();
}

function normalizeSettingsSplitCount(value: number): number {
    if (!Number.isInteger(value)) {
        throw new Error(
            `ClickGUI theme preference "settingsSplitCount" must be an integer. Received: ${value}`,
        );
    }

    if (value < 0 || value > MAX_SETTINGS_SPLIT_COUNT) {
        throw new Error(
            `ClickGUI theme preference "settingsSplitCount" must be between 0 and ${MAX_SETTINGS_SPLIT_COUNT}. Received: ${value}`,
        );
    }

    return value;
}

function normalizeModulePrimaryInteraction(
    value: string,
): ClickGuiModulePrimaryInteraction {
    if (
        !MODULE_PRIMARY_INTERACTIONS.includes(
            value as ClickGuiModulePrimaryInteraction,
        )
    ) {
        throw new Error(
            `ClickGUI theme preference "modulePrimaryInteraction" must be one of: ${MODULE_PRIMARY_INTERACTIONS.join(", ")}. Received: ${value}`,
        );
    }

    return value as ClickGuiModulePrimaryInteraction;
}

function normalizeModuleAccentMode(value: string): ClickGuiModuleAccentMode {
    if (!MODULE_ACCENT_MODES.includes(value as ClickGuiModuleAccentMode)) {
        throw new Error(
            `ClickGUI theme preference "moduleAccentMode" must be one of: ${MODULE_ACCENT_MODES.join(", ")}. Received: ${value}`,
        );
    }

    return value as ClickGuiModuleAccentMode;
}

function normalizeStickySurfaceIntensity(
    value: string,
): ClickGuiStickySurfaceIntensity {
    if (
        !STICKY_SURFACE_INTENSITIES.includes(
            value as ClickGuiStickySurfaceIntensity,
        )
    ) {
        throw new Error(
            `ClickGUI theme preference "stickySurfaceIntensity" must be one of: ${STICKY_SURFACE_INTENSITIES.join(", ")}. Received: ${value}`,
        );
    }

    return value as ClickGuiStickySurfaceIntensity;
}

function isPlainObject(
    value: unknown,
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateClickGuiThemePreferences(
    value: unknown,
): ClickGuiThemePreferences {
    if (!isPlainObject(value)) {
        throw new Error(
            "ClickGUI theme preferences must be a plain object payload.",
        );
    }

    const accentColor = value.accentColor;
    const baseColor = value.baseColor;
    const backgroundColor = value.backgroundColor;
    const offButtonColor = value.offButtonColor;
    const inputBackgroundColor = value.inputBackgroundColor;
    const panelBackgroundColor = value.panelBackgroundColor;
    const textColor = value.textColor;
    const dimmedTextColor = value.dimmedTextColor;
    const settingsSplitCount = value.settingsSplitCount;
    const modulePrimaryInteraction = value.modulePrimaryInteraction;
    const showModuleRowActions = value.showModuleRowActions;
    const moduleAccentMode = value.moduleAccentMode;
    const stickySurfaceIntensity = value.stickySurfaceIntensity;

    if (typeof accentColor !== "string") {
        throw new Error(
            `ClickGUI theme preference "accentColor" must be a string. Received: ${typeof accentColor}`,
        );
    }

    if (typeof baseColor !== "string") {
        throw new Error(
            `ClickGUI theme preference "baseColor" must be a string. Received: ${typeof baseColor}`,
        );
    }

    const normalizedBackgroundColor = validateRgbaColor(
        backgroundColor,
        "backgroundColor",
    );
    const normalizedOffButtonColor = validateRgbaColor(
        offButtonColor,
        "offButtonColor",
    );
    const normalizedInputBackgroundColor = validateRgbaColor(
        inputBackgroundColor,
        "inputBackgroundColor",
    );
    const normalizedPanelBackgroundColor = validateRgbaColor(
        panelBackgroundColor,
        "panelBackgroundColor",
    );

    if (typeof textColor !== "string") {
        throw new Error(
            `ClickGUI theme preference "textColor" must be a string. Received: ${typeof textColor}`,
        );
    }

    if (typeof dimmedTextColor !== "string") {
        throw new Error(
            `ClickGUI theme preference "dimmedTextColor" must be a string. Received: ${typeof dimmedTextColor}`,
        );
    }

    if (typeof settingsSplitCount !== "number") {
        throw new Error(
            `ClickGUI theme preference "settingsSplitCount" must be a number. Received: ${typeof settingsSplitCount}`,
        );
    }

    if (typeof modulePrimaryInteraction !== "string") {
        throw new Error(
            `ClickGUI theme preference "modulePrimaryInteraction" must be a string. Received: ${typeof modulePrimaryInteraction}`,
        );
    }

    if (typeof showModuleRowActions !== "boolean") {
        throw new Error(
            `ClickGUI theme preference "showModuleRowActions" must be a boolean. Received: ${typeof showModuleRowActions}`,
        );
    }

    if (typeof moduleAccentMode !== "string") {
        throw new Error(
            `ClickGUI theme preference "moduleAccentMode" must be a string. Received: ${typeof moduleAccentMode}`,
        );
    }

    if (typeof stickySurfaceIntensity !== "string") {
        throw new Error(
            `ClickGUI theme preference "stickySurfaceIntensity" must be a string. Received: ${typeof stickySurfaceIntensity}`,
        );
    }

    return {
        accentColor: normalizeHexColor(accentColor, "accentColor"),
        baseColor: normalizeHexColor(baseColor, "baseColor"),
        backgroundColor: normalizedBackgroundColor,
        offButtonColor: normalizedOffButtonColor,
        inputBackgroundColor: normalizedInputBackgroundColor,
        panelBackgroundColor: normalizedPanelBackgroundColor,
        textColor: normalizeHexColor(textColor, "textColor"),
        dimmedTextColor: normalizeHexColor(
            dimmedTextColor,
            "dimmedTextColor",
        ),
        settingsSplitCount: normalizeSettingsSplitCount(settingsSplitCount),
        modulePrimaryInteraction: normalizeModulePrimaryInteraction(
            modulePrimaryInteraction,
        ),
        showModuleRowActions,
        moduleAccentMode: normalizeModuleAccentMode(moduleAccentMode),
        stickySurfaceIntensity: normalizeStickySurfaceIntensity(
            stickySurfaceIntensity,
        ),
    };
}

function tryParseStoredThemePreferences(
    storageKey: string,
): ClickGuiThemePreferences | null {
    const rawValue = localStorage.getItem(storageKey);
    if (rawValue === null) {
        return null;
    }

    let parsedValue: unknown;

    try {
        parsedValue = JSON.parse(rawValue);
    } catch (error) {
        throw new Error(
            `ClickGUI theme preference payload is not valid JSON. Storage key: ${storageKey}. ${error instanceof Error ? error.message : String(error)}`,
        );
    }

    if (storageKey === LEGACY_CLICKGUI_THEME_STORAGE_KEY) {
        if (!isPlainObject(parsedValue)) {
            throw new Error(
                `ClickGUI legacy theme preferences must be a plain object payload. Storage key: ${storageKey}.`,
            );
        }

        const legacyPreferences = validateClickGuiThemePreferences({
            ...parsedValue,
            stickySurfaceIntensity:
                defaultClickGuiThemePreferences.stickySurfaceIntensity,
        });

        return legacyPreferences;
    }

    if (storageKey === OLDER_CLICKGUI_THEME_STORAGE_KEY) {
        if (!isPlainObject(parsedValue)) {
            throw new Error(
                `ClickGUI legacy theme preferences must be a plain object payload. Storage key: ${storageKey}.`,
            );
        }

        const legacyPreferences = validateClickGuiThemePreferences({
            ...parsedValue,
            offButtonColor: defaultClickGuiThemePreferences.offButtonColor,
            inputBackgroundColor:
                defaultClickGuiThemePreferences.inputBackgroundColor,
            panelBackgroundColor:
                defaultClickGuiThemePreferences.panelBackgroundColor,
            modulePrimaryInteraction:
                defaultClickGuiThemePreferences.modulePrimaryInteraction,
            showModuleRowActions:
                defaultClickGuiThemePreferences.showModuleRowActions,
            moduleAccentMode: defaultClickGuiThemePreferences.moduleAccentMode,
            stickySurfaceIntensity:
                defaultClickGuiThemePreferences.stickySurfaceIntensity,
        });

        return legacyPreferences;
    }

    if (storageKey === OLDEST_CLICKGUI_THEME_STORAGE_KEY) {
        if (!isPlainObject(parsedValue)) {
            throw new Error(
                `ClickGUI legacy theme preferences must be a plain object payload. Storage key: ${storageKey}.`,
            );
        }

        const legacyPreferences = validateClickGuiThemePreferences({
            ...parsedValue,
            backgroundColor: defaultClickGuiThemePreferences.backgroundColor,
            offButtonColor: defaultClickGuiThemePreferences.offButtonColor,
            inputBackgroundColor:
                defaultClickGuiThemePreferences.inputBackgroundColor,
            panelBackgroundColor:
                defaultClickGuiThemePreferences.panelBackgroundColor,
            modulePrimaryInteraction:
                defaultClickGuiThemePreferences.modulePrimaryInteraction,
            showModuleRowActions:
                defaultClickGuiThemePreferences.showModuleRowActions,
            moduleAccentMode: defaultClickGuiThemePreferences.moduleAccentMode,
            stickySurfaceIntensity:
                defaultClickGuiThemePreferences.stickySurfaceIntensity,
        });

        return legacyPreferences;
    }

    if (storageKey === ANCIENT_CLICKGUI_THEME_STORAGE_KEY) {
        if (!isPlainObject(parsedValue)) {
            throw new Error(
                `ClickGUI legacy theme preferences must be a plain object payload. Storage key: ${storageKey}.`,
            );
        }

        const legacyPreferences = validateClickGuiThemePreferences({
            ...parsedValue,
            backgroundColor: defaultClickGuiThemePreferences.backgroundColor,
            offButtonColor: defaultClickGuiThemePreferences.offButtonColor,
            inputBackgroundColor:
                defaultClickGuiThemePreferences.inputBackgroundColor,
            panelBackgroundColor:
                defaultClickGuiThemePreferences.panelBackgroundColor,
            modulePrimaryInteraction:
                defaultClickGuiThemePreferences.modulePrimaryInteraction,
            showModuleRowActions:
                defaultClickGuiThemePreferences.showModuleRowActions,
            moduleAccentMode: defaultClickGuiThemePreferences.moduleAccentMode,
            stickySurfaceIntensity:
                defaultClickGuiThemePreferences.stickySurfaceIntensity,
        });

        return legacyPreferences;
    }

    if (storageKey === PRIMITIVE_CLICKGUI_THEME_STORAGE_KEY) {
        if (!isPlainObject(parsedValue)) {
            throw new Error(
                `ClickGUI legacy theme preferences must be a plain object payload. Storage key: ${storageKey}.`,
            );
        }

        const legacyPreferences = validateClickGuiThemePreferences({
            ...parsedValue,
            backgroundColor: defaultClickGuiThemePreferences.backgroundColor,
            offButtonColor: defaultClickGuiThemePreferences.offButtonColor,
            inputBackgroundColor:
                defaultClickGuiThemePreferences.inputBackgroundColor,
            panelBackgroundColor:
                defaultClickGuiThemePreferences.panelBackgroundColor,
            modulePrimaryInteraction:
                defaultClickGuiThemePreferences.modulePrimaryInteraction,
            showModuleRowActions:
                defaultClickGuiThemePreferences.showModuleRowActions,
            moduleAccentMode: defaultClickGuiThemePreferences.moduleAccentMode,
            stickySurfaceIntensity:
                defaultClickGuiThemePreferences.stickySurfaceIntensity,
        });

        return legacyPreferences;
    }

    return validateClickGuiThemePreferences(parsedValue);
}

export function readStoredClickGuiThemePreferences(): ClickGuiThemePreferences {
    const storedPreferences = tryParseStoredThemePreferences(
        CLICKGUI_THEME_STORAGE_KEY,
    );
    if (storedPreferences !== null) {
        return storedPreferences;
    }

    const legacyPreferences = tryParseStoredThemePreferences(
        LEGACY_CLICKGUI_THEME_STORAGE_KEY,
    );
    if (legacyPreferences !== null) {
        return legacyPreferences;
    }

    const olderPreferences = tryParseStoredThemePreferences(
        OLDER_CLICKGUI_THEME_STORAGE_KEY,
    );
    if (olderPreferences !== null) {
        return olderPreferences;
    }

    const oldestPreferences = tryParseStoredThemePreferences(
        OLDEST_CLICKGUI_THEME_STORAGE_KEY,
    );
    if (oldestPreferences !== null) {
        return oldestPreferences;
    }

    const ancientPreferences = tryParseStoredThemePreferences(
        ANCIENT_CLICKGUI_THEME_STORAGE_KEY,
    );
    if (ancientPreferences !== null) {
        return ancientPreferences;
    }

    const primitivePreferences = tryParseStoredThemePreferences(
        PRIMITIVE_CLICKGUI_THEME_STORAGE_KEY,
    );
    if (primitivePreferences !== null) {
        return primitivePreferences;
    }

    return {
        ...defaultClickGuiThemePreferences,
        backgroundColor: {
            ...defaultClickGuiThemePreferences.backgroundColor,
        },
        offButtonColor: {
            ...defaultClickGuiThemePreferences.offButtonColor,
        },
        inputBackgroundColor: {
            ...defaultClickGuiThemePreferences.inputBackgroundColor,
        },
        panelBackgroundColor: {
            ...defaultClickGuiThemePreferences.panelBackgroundColor,
        },
    };
}

export async function persistClickGuiThemePreferences(
    preferences: ClickGuiThemePreferences,
): Promise<void> {
    const serializedPreferences = JSON.stringify(
        validateClickGuiThemePreferences(preferences),
    );
    await setItem(CLICKGUI_THEME_STORAGE_KEY, serializedPreferences);
}

export function hexColorToRgbChannels(hexColor: string): string {
    const normalized = normalizeHexColor(hexColor, "hexColor");
    const red = Number.parseInt(normalized.slice(1, 3), 16);
    const green = Number.parseInt(normalized.slice(3, 5), 16);
    const blue = Number.parseInt(normalized.slice(5, 7), 16);

    return `${red} ${green} ${blue}`;
}

function stickySurfaceIntensityToFactor(
    value: ClickGuiStickySurfaceIntensity,
): number {
    if (value === "soft") {
        return 0;
    }

    if (value === "strong") {
        return 1;
    }

    return 0.5;
}

export function buildClickGuiThemeInlineStyle(
    preferences: ClickGuiThemePreferences,
): string {
    const validatedPreferences = validateClickGuiThemePreferences(preferences);

    return [
        `--clickgui-accent-color:${validatedPreferences.accentColor}`,
        `--clickgui-accent-rgb:${hexColorToRgbChannels(validatedPreferences.accentColor)}`,
        `--clickgui-base-color:${validatedPreferences.baseColor}`,
        `--clickgui-base-rgb:${hexColorToRgbChannels(validatedPreferences.baseColor)}`,
        `--clickgui-backdrop-color:${rgbaColorToCssString(validatedPreferences.backgroundColor)}`,
        `--clickgui-backdrop-rgb:${rgbaColorToRgbChannels(validatedPreferences.backgroundColor)}`,
        `--clickgui-control-off-color:${rgbaColorToCssString(validatedPreferences.offButtonColor)}`,
        `--clickgui-control-off-rgb:${rgbaColorToRgbChannels(validatedPreferences.offButtonColor)}`,
        `--clickgui-input-background-color:${rgbaColorToCssString(validatedPreferences.inputBackgroundColor)}`,
        `--clickgui-input-background-rgb:${rgbaColorToRgbChannels(validatedPreferences.inputBackgroundColor)}`,
        `--clickgui-panel-background-color:${rgbaColorToCssString(validatedPreferences.panelBackgroundColor)}`,
        `--clickgui-panel-background-rgb:${rgbaColorToRgbChannels(validatedPreferences.panelBackgroundColor)}`,
        `--clickgui-text-color:${validatedPreferences.textColor}`,
        `--clickgui-text-rgb:${hexColorToRgbChannels(validatedPreferences.textColor)}`,
        `--clickgui-text-dimmed-color:${validatedPreferences.dimmedTextColor}`,
        `--clickgui-text-dimmed-rgb:${hexColorToRgbChannels(validatedPreferences.dimmedTextColor)}`,
        `--clickgui-sticky-intensity:${stickySurfaceIntensityToFactor(validatedPreferences.stickySurfaceIntensity)}`,
    ].join(";");
}

export function matchesClickGuiThemePreset(
    preferences: ClickGuiThemePreferences,
    preset: ClickGuiThemePreset,
): boolean {
    return (
        preferences.accentColor === preset.accentColor &&
        preferences.baseColor === preset.baseColor &&
        preferences.backgroundColor.red === preset.backgroundColor.red &&
        preferences.backgroundColor.green === preset.backgroundColor.green &&
        preferences.backgroundColor.blue === preset.backgroundColor.blue &&
        preferences.backgroundColor.alpha === preset.backgroundColor.alpha &&
        preferences.offButtonColor.red === preset.offButtonColor.red &&
        preferences.offButtonColor.green === preset.offButtonColor.green &&
        preferences.offButtonColor.blue === preset.offButtonColor.blue &&
        preferences.offButtonColor.alpha === preset.offButtonColor.alpha &&
        preferences.inputBackgroundColor.red === preset.inputBackgroundColor.red &&
        preferences.inputBackgroundColor.green === preset.inputBackgroundColor.green &&
        preferences.inputBackgroundColor.blue === preset.inputBackgroundColor.blue &&
        preferences.inputBackgroundColor.alpha === preset.inputBackgroundColor.alpha &&
        preferences.panelBackgroundColor.red === preset.panelBackgroundColor.red &&
        preferences.panelBackgroundColor.green === preset.panelBackgroundColor.green &&
        preferences.panelBackgroundColor.blue === preset.panelBackgroundColor.blue &&
        preferences.panelBackgroundColor.alpha === preset.panelBackgroundColor.alpha &&
        preferences.textColor === preset.textColor &&
        preferences.dimmedTextColor === preset.dimmedTextColor &&
        preferences.settingsSplitCount === preset.settingsSplitCount
    );
}
