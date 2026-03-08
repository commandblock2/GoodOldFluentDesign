import type { InputBind, Range, Vec2, Vec3 } from "../../../integration/types";

export interface ClickGuiSettingHandlers {
    onBooleanChange?: (
        path: number[],
        checked: boolean,
    ) => void | Promise<void>;
    onTextChange?: (
        path: number[],
        value: string,
    ) => void | Promise<void>;
    onBindChange?: (
        path: number[],
        value: InputBind,
    ) => void | Promise<void>;
    onKeyChange?: (
        path: number[],
        value: string,
    ) => void | Promise<void>;
    onColorChange?: (
        path: number[],
        value: number,
    ) => void | Promise<void>;
    onChooseChange?: (
        path: number[],
        value: string,
    ) => void | Promise<void>;
    onChoiceChange?: (
        path: number[],
        value: string,
    ) => void | Promise<void>;
    onMultiChooseChange?: (
        path: number[],
        values: string[],
    ) => void | Promise<void>;
    onMutableListChange?: (
        path: number[],
        values: string[],
    ) => void | Promise<void>;
    onFileChange?: (
        path: number[],
        value: string,
    ) => void | Promise<void>;
    onRegistryListChange?: (
        path: number[],
        values: string[],
    ) => void | Promise<void>;
    onCurveChange?: (
        path: number[],
        values: Vec2[],
    ) => void | Promise<void>;
    onNumberChange?: (
        path: number[],
        value: number,
    ) => void | Promise<void>;
    onNumberRangeChange?: (
        path: number[],
        value: Range,
    ) => void | Promise<void>;
    onVector2Change?: (
        path: number[],
        value: Vec2,
    ) => void | Promise<void>;
    onVector3Change?: (
        path: number[],
        value: Vec3,
    ) => void | Promise<void>;
}

export type ResolvedClickGuiSettingHandlers =
    Required<ClickGuiSettingHandlers>;

const noopBooleanChange = (_path: number[], _checked: boolean) => {};
const noopTextChange = (_path: number[], _value: string) => {};
const noopBindChange = (_path: number[], _value: InputBind) => {};
const noopKeyChange = (_path: number[], _value: string) => {};
const noopColorChange = (_path: number[], _value: number) => {};
const noopChooseChange = (_path: number[], _value: string) => {};
const noopChoiceChange = (_path: number[], _value: string) => {};
const noopMultiChooseChange = (_path: number[], _values: string[]) => {};
const noopMutableListChange = (_path: number[], _values: string[]) => {};
const noopFileChange = (_path: number[], _value: string) => {};
const noopRegistryListChange = (_path: number[], _values: string[]) => {};
const noopCurveChange = (_path: number[], _values: Vec2[]) => {};
const noopNumberChange = (_path: number[], _value: number) => {};
const noopNumberRangeChange = (_path: number[], _value: Range) => {};
const noopVector2Change = (_path: number[], _value: Vec2) => {};
const noopVector3Change = (_path: number[], _value: Vec3) => {};

export const defaultClickGuiSettingHandlers: ResolvedClickGuiSettingHandlers =
    {
        onBooleanChange: noopBooleanChange,
        onTextChange: noopTextChange,
        onBindChange: noopBindChange,
        onKeyChange: noopKeyChange,
        onColorChange: noopColorChange,
        onChooseChange: noopChooseChange,
        onChoiceChange: noopChoiceChange,
        onMultiChooseChange: noopMultiChooseChange,
        onMutableListChange: noopMutableListChange,
        onFileChange: noopFileChange,
        onRegistryListChange: noopRegistryListChange,
        onCurveChange: noopCurveChange,
        onNumberChange: noopNumberChange,
        onNumberRangeChange: noopNumberRangeChange,
        onVector2Change: noopVector2Change,
        onVector3Change: noopVector3Change,
    };

export function resolveClickGuiSettingHandlers(
    handlers: ClickGuiSettingHandlers | undefined,
): ResolvedClickGuiSettingHandlers {
    return {
        ...defaultClickGuiSettingHandlers,
        ...handlers,
    };
}
