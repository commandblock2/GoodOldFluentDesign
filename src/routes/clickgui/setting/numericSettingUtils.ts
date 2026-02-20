import type {
    FloatRangeSetting,
    FloatSetting,
    IntRangeSetting,
    IntSetting,
    Range,
} from "../../../integration/types";

export type NumericSetting = FloatSetting | IntSetting;
export type NumericRangeSetting = FloatRangeSetting | IntRangeSetting;

interface RangeLike {
    from?: number;
    to?: number;
    min?: number;
    max?: number;
}

export interface NumericBounds {
    min: number;
    max: number;
}

function normalizeEndpoints(first: number, second: number): NumericBounds {
    const min = Number.isFinite(first) ? first : 0;
    const max = Number.isFinite(second) ? second : min;

    return min <= max ? { min, max } : { min: max, max: min };
}

export function getBounds(range: Range | RangeLike): NumericBounds {
    const rangeLike = range as RangeLike;
    const first =
        typeof rangeLike.from === "number"
            ? rangeLike.from
            : typeof rangeLike.min === "number"
              ? rangeLike.min
              : 0;
    const second =
        typeof rangeLike.to === "number"
            ? rangeLike.to
            : typeof rangeLike.max === "number"
              ? rangeLike.max
              : first;

    return normalizeEndpoints(first, second);
}

export function getRangeValue(value: Range | RangeLike): Range {
    const rangeLike = value as RangeLike;
    const first =
        typeof rangeLike.from === "number"
            ? rangeLike.from
            : typeof rangeLike.min === "number"
              ? rangeLike.min
              : 0;
    const second =
        typeof rangeLike.to === "number"
            ? rangeLike.to
            : typeof rangeLike.max === "number"
              ? rangeLike.max
              : first;
    const normalized = normalizeEndpoints(first, second);

    return {
        from: normalized.min,
        to: normalized.max,
    };
}

export function clamp(value: number, bounds: NumericBounds): number {
    return Math.min(bounds.max, Math.max(bounds.min, value));
}

export function normalizeSingleValue(
    value: number,
    bounds: NumericBounds,
    integer: boolean,
): number {
    const normalizedBase = Number.isFinite(value) ? value : bounds.min;
    const clamped = clamp(normalizedBase, bounds);
    return integer ? Math.round(clamped) : clamped;
}

export function normalizeRangeValue(
    value: Range | RangeLike,
    bounds: NumericBounds,
    integer: boolean,
): Range {
    const normalized = getRangeValue(value);
    const first = normalizeSingleValue(normalized.from, bounds, integer);
    const second = normalizeSingleValue(normalized.to, bounds, integer);

    return first <= second
        ? { from: first, to: second }
        : { from: second, to: first };
}

export function isSmallIntegerDomain(bounds: NumericBounds): boolean {
    return bounds.max - bounds.min <= 5;
}

export function getSliderStep(bounds: NumericBounds, integer: boolean): number {
    if (integer) {
        return 1;
    }

    const span = Math.abs(bounds.max - bounds.min);

    if (span === 0) {
        return 0.001;
    }

    if (span <= 1) {
        return 0.001;
    }

    if (span <= 10) {
        return 0.01;
    }

    return 0.1;
}

export function formatNumericValue(value: number, integer: boolean): string {
    if (integer) {
        return `${Math.round(value)}`;
    }

    if (Math.abs(value) >= 100) {
        return value.toFixed(1);
    }

    if (Math.abs(value) >= 10) {
        return value.toFixed(2);
    }

    return value.toFixed(3).replace(/\.?0+$/, "");
}
