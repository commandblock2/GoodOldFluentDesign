import { intToRgba, rgbaToInt } from "../../integration/util";

const MAX_COLOR_CHANNEL = 255;

export interface RgbaColor {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

function normalizeColorChannel(value: number, fieldName: string): number {
    if (!Number.isInteger(value)) {
        throw new Error(
            `RGBA color field "${fieldName}" must be an integer. Received: ${value}`,
        );
    }

    if (value < 0 || value > MAX_COLOR_CHANNEL) {
        throw new Error(
            `RGBA color field "${fieldName}" must be between 0 and ${MAX_COLOR_CHANNEL}. Received: ${value}`,
        );
    }

    return value;
}

function normalizeAlpha(value: number, fieldName: string): number {
    if (!Number.isFinite(value)) {
        throw new Error(
            `RGBA color field "${fieldName}" must be a finite number. Received: ${value}`,
        );
    }

    if (value < 0 || value > 1) {
        throw new Error(
            `RGBA color field "${fieldName}" must be between 0 and 1. Received: ${value}`,
        );
    }

    return Math.round(value * 1000) / 1000;
}

function trimFraction(value: number): string {
    return value.toFixed(3).replace(/\.?0+$/, "");
}

function isPlainObject(
    value: unknown,
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateRgbaColor(
    value: unknown,
    fieldName = "color",
): RgbaColor {
    if (!isPlainObject(value)) {
        throw new Error(
            `RGBA color "${fieldName}" must be a plain object payload.`,
        );
    }

    const red = value.red;
    const green = value.green;
    const blue = value.blue;
    const alpha = value.alpha;

    if (typeof red !== "number") {
        throw new Error(
            `RGBA color field "${fieldName}.red" must be a number. Received: ${typeof red}`,
        );
    }

    if (typeof green !== "number") {
        throw new Error(
            `RGBA color field "${fieldName}.green" must be a number. Received: ${typeof green}`,
        );
    }

    if (typeof blue !== "number") {
        throw new Error(
            `RGBA color field "${fieldName}.blue" must be a number. Received: ${typeof blue}`,
        );
    }

    if (typeof alpha !== "number") {
        throw new Error(
            `RGBA color field "${fieldName}.alpha" must be a number. Received: ${typeof alpha}`,
        );
    }

    return {
        red: normalizeColorChannel(red, `${fieldName}.red`),
        green: normalizeColorChannel(green, `${fieldName}.green`),
        blue: normalizeColorChannel(blue, `${fieldName}.blue`),
        alpha: normalizeAlpha(alpha, `${fieldName}.alpha`),
    };
}

export function rgbaColorToCssString(color: RgbaColor): string {
    const validatedColor = validateRgbaColor(color);
    return `rgb(${validatedColor.red} ${validatedColor.green} ${validatedColor.blue} / ${trimFraction(validatedColor.alpha)})`;
}

export function rgbaColorToRgbChannels(color: RgbaColor): string {
    const validatedColor = validateRgbaColor(color);
    return `${validatedColor.red} ${validatedColor.green} ${validatedColor.blue}`;
}

export function rgbaColorToHexaString(color: RgbaColor): string {
    const validatedColor = validateRgbaColor(color);
    const alphaChannel = Math.round(validatedColor.alpha * MAX_COLOR_CHANNEL);

    return `#${validatedColor.red
        .toString(16)
        .padStart(2, "0")}${validatedColor.green
        .toString(16)
        .padStart(2, "0")}${validatedColor.blue
        .toString(16)
        .padStart(2, "0")}${alphaChannel.toString(16).padStart(2, "0")}`;
}

export function rgbaColorToDisplayLabel(color: RgbaColor): string {
    const validatedColor = validateRgbaColor(color);
    const hexa = rgbaColorToHexaString(validatedColor);

    if (validatedColor.alpha === 1) {
        return hexa.slice(0, 7).toUpperCase();
    }

    return hexa.toUpperCase();
}

export function rgbaColorEquals(
    left: RgbaColor,
    right: RgbaColor,
): boolean {
    const normalizedLeft = validateRgbaColor(left, "left");
    const normalizedRight = validateRgbaColor(right, "right");

    return (
        normalizedLeft.red === normalizedRight.red &&
        normalizedLeft.green === normalizedRight.green &&
        normalizedLeft.blue === normalizedRight.blue &&
        normalizedLeft.alpha === normalizedRight.alpha
    );
}

export function intColorToRgbaColor(rawValue: number): RgbaColor {
    if (!Number.isFinite(rawValue)) {
        throw new Error(
            `Expected a finite 32-bit color integer. Received: ${rawValue}`,
        );
    }

    const [red, green, blue, alpha] = intToRgba(Math.trunc(rawValue));

    return {
        red,
        green,
        blue,
        alpha: normalizeAlpha(alpha / MAX_COLOR_CHANNEL, "alpha"),
    };
}

export function rgbaColorToIntColor(color: RgbaColor): number {
    const validatedColor = validateRgbaColor(color);
    const alphaChannel = Math.round(validatedColor.alpha * MAX_COLOR_CHANNEL);

    return rgbaToInt([
        validatedColor.red,
        validatedColor.green,
        validatedColor.blue,
        alphaChannel,
    ]);
}
