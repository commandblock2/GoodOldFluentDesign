<script lang="ts">
    import { tick } from "svelte";
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import {
        rgbaColorEquals,
        rgbaColorToCssString,
        rgbaColorToDisplayLabel,
        rgbaColorToHexaString,
        validateRgbaColor,
        type RgbaColor,
    } from "../clickGuiColorUtils";

    interface Props {
        value: RgbaColor;
        onChange?: (value: RgbaColor) => void | Promise<void>;
        revealItemOptions: RevealItemOptions;
        ariaLabel: string;
        allowAlpha?: boolean;
        liveUpdate?: boolean;
        block?: boolean;
    }

    interface HsvColor {
        hue: number;
        saturation: number;
        value: number;
    }

    interface HslColor {
        hue: number;
        saturation: number;
        lightness: number;
    }

    interface PopupPosition {
        left: number;
        top: number;
        ready: boolean;
        transformOrigin: string;
    }

    type ColorDisplayMode = "hex" | "rgb" | "hsl";
    type DragTarget = "palette" | "alpha" | "hue";

    const defaultChangeHandler = (_nextValue: RgbaColor) => {};
    const PICKER_HEIGHT = 176;
    const POPUP_GAP = 8;
    const VIEWPORT_PADDING = 12;

    function clampNumber(value: number, minimum: number, maximum: number): number {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function roundTo(value: number, digits: number): number {
        const multiplier = 10 ** digits;
        return Math.round(value * multiplier) / multiplier;
    }

    function trimFraction(value: number): string {
        return value.toFixed(3).replace(/\.?0+$/, "");
    }

    function normalizeInteractiveColor(
        color: RgbaColor,
        allowAlpha: boolean,
    ): RgbaColor {
        const normalizedColor = validateRgbaColor(color);
        if (allowAlpha) {
            return normalizedColor;
        }

        return {
            ...normalizedColor,
            alpha: 1,
        };
    }

    function normalizeHue(value: number): number {
        const wrappedValue = ((value % 360) + 360) % 360;
        return roundTo(wrappedValue, 3);
    }

    function rgbaToHsv(color: RgbaColor): HsvColor {
        const normalizedColor = validateRgbaColor(color);
        const red = normalizedColor.red / 255;
        const green = normalizedColor.green / 255;
        const blue = normalizedColor.blue / 255;
        const maximum = Math.max(red, green, blue);
        const minimum = Math.min(red, green, blue);
        const delta = maximum - minimum;

        let hue = 0;
        if (delta !== 0) {
            if (maximum === red) {
                hue = 60 * (((green - blue) / delta) % 6);
            } else if (maximum === green) {
                hue = 60 * ((blue - red) / delta + 2);
            } else {
                hue = 60 * ((red - green) / delta + 4);
            }
        }

        const saturation = maximum === 0 ? 0 : delta / maximum;

        return {
            hue: normalizeHue(hue),
            saturation: roundTo(saturation, 4),
            value: roundTo(maximum, 4),
        };
    }

    function hsvToRgba(color: HsvColor, alpha: number): RgbaColor {
        const hue = normalizeHue(color.hue);
        const saturation = clampNumber(color.saturation, 0, 1);
        const value = clampNumber(color.value, 0, 1);
        const chroma = value * saturation;
        const huePrime = hue / 60;
        const secondary = chroma * (1 - Math.abs((huePrime % 2) - 1));
        const match = value - chroma;

        let red = 0;
        let green = 0;
        let blue = 0;

        if (huePrime >= 0 && huePrime < 1) {
            red = chroma;
            green = secondary;
        } else if (huePrime < 2) {
            red = secondary;
            green = chroma;
        } else if (huePrime < 3) {
            green = chroma;
            blue = secondary;
        } else if (huePrime < 4) {
            green = secondary;
            blue = chroma;
        } else if (huePrime < 5) {
            red = secondary;
            blue = chroma;
        } else {
            red = chroma;
            blue = secondary;
        }

        return validateRgbaColor({
            red: Math.round((red + match) * 255),
            green: Math.round((green + match) * 255),
            blue: Math.round((blue + match) * 255),
            alpha: clampNumber(roundTo(alpha, 3), 0, 1),
        });
    }

    function rgbaToHsl(color: RgbaColor): HslColor {
        const normalizedColor = validateRgbaColor(color);
        const red = normalizedColor.red / 255;
        const green = normalizedColor.green / 255;
        const blue = normalizedColor.blue / 255;
        const maximum = Math.max(red, green, blue);
        const minimum = Math.min(red, green, blue);
        const delta = maximum - minimum;
        const lightness = (maximum + minimum) / 2;

        let hue = 0;
        if (delta !== 0) {
            if (maximum === red) {
                hue = 60 * (((green - blue) / delta) % 6);
            } else if (maximum === green) {
                hue = 60 * ((blue - red) / delta + 2);
            } else {
                hue = 60 * ((red - green) / delta + 4);
            }
        }

        const saturation =
            delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

        return {
            hue: normalizeHue(hue),
            saturation: roundTo(saturation, 4),
            lightness: roundTo(lightness, 4),
        };
    }

    function hslToRgba(color: HslColor, alpha: number): RgbaColor {
        const hue = normalizeHue(color.hue);
        const saturation = clampNumber(color.saturation, 0, 1);
        const lightness = clampNumber(color.lightness, 0, 1);
        const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
        const huePrime = hue / 60;
        const secondary = chroma * (1 - Math.abs((huePrime % 2) - 1));
        const match = lightness - chroma / 2;

        let red = 0;
        let green = 0;
        let blue = 0;

        if (huePrime >= 0 && huePrime < 1) {
            red = chroma;
            green = secondary;
        } else if (huePrime < 2) {
            red = secondary;
            green = chroma;
        } else if (huePrime < 3) {
            green = chroma;
            blue = secondary;
        } else if (huePrime < 4) {
            green = secondary;
            blue = chroma;
        } else if (huePrime < 5) {
            red = secondary;
            blue = chroma;
        } else {
            red = chroma;
            blue = secondary;
        }

        return validateRgbaColor({
            red: Math.round((red + match) * 255),
            green: Math.round((green + match) * 255),
            blue: Math.round((blue + match) * 255),
            alpha: clampNumber(roundTo(alpha, 3), 0, 1),
        });
    }

    function formatColorForMode(
        color: RgbaColor,
        mode: ColorDisplayMode,
        allowAlpha: boolean,
    ): string {
        const normalizedColor = normalizeInteractiveColor(color, allowAlpha);

        if (mode === "hex") {
            const hexaValue = rgbaColorToHexaString(normalizedColor).toUpperCase();
            return allowAlpha ? hexaValue : hexaValue.slice(0, 7);
        }

        if (mode === "rgb") {
            if (allowAlpha) {
                return `rgba(${normalizedColor.red}, ${normalizedColor.green}, ${normalizedColor.blue}, ${trimFraction(normalizedColor.alpha)})`;
            }

            return `rgb(${normalizedColor.red}, ${normalizedColor.green}, ${normalizedColor.blue})`;
        }

        const hslColor = rgbaToHsl(normalizedColor);
        const hue = Math.round(hslColor.hue);
        const saturation = Math.round(hslColor.saturation * 100);
        const lightness = Math.round(hslColor.lightness * 100);

        if (allowAlpha) {
            return `hsla(${hue}, ${saturation}%, ${lightness}%, ${trimFraction(normalizedColor.alpha)})`;
        }

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function parseHexColor(input: string, allowAlpha: boolean): RgbaColor | null {
        const normalizedInput = input.trim().replace(/^#/, "");
        if (!/^[0-9a-fA-F]+$/.test(normalizedInput)) {
            return null;
        }

        let expandedInput = normalizedInput;
        if (normalizedInput.length === 3 || normalizedInput.length === 4) {
            expandedInput = normalizedInput
                .split("")
                .map((character) => `${character}${character}`)
                .join("");
        }

        if (expandedInput.length !== 6 && expandedInput.length !== 8) {
            return null;
        }

        if (!allowAlpha && expandedInput.length !== 6) {
            return null;
        }

        const red = Number.parseInt(expandedInput.slice(0, 2), 16);
        const green = Number.parseInt(expandedInput.slice(2, 4), 16);
        const blue = Number.parseInt(expandedInput.slice(4, 6), 16);
        const alpha =
            expandedInput.length === 8
                ? roundTo(Number.parseInt(expandedInput.slice(6, 8), 16) / 255, 3)
                : 1;

        return validateRgbaColor({
            red,
            green,
            blue,
            alpha: allowAlpha ? alpha : 1,
        });
    }

    function parseRgbColor(input: string, allowAlpha: boolean): RgbaColor | null {
        const match = input
            .trim()
            .match(/^rgba?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*(-?\d*\.?\d+)\s*)?\)$/i);
        if (match === null) {
            return null;
        }

        const red = Number(match[1]);
        const green = Number(match[2]);
        const blue = Number(match[3]);
        const alpha = match[4] === undefined ? 1 : Number(match[4]);

        if (!Number.isInteger(red) || !Number.isInteger(green) || !Number.isInteger(blue)) {
            return null;
        }

        if (!allowAlpha && match[4] !== undefined) {
            return null;
        }

        return validateRgbaColor({
            red,
            green,
            blue,
            alpha: allowAlpha ? alpha : 1,
        });
    }

    function parseHslColor(input: string, allowAlpha: boolean): RgbaColor | null {
        const match = input
            .trim()
            .match(/^hsla?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*(?:,\s*(-?\d*\.?\d+)\s*)?\)$/i);
        if (match === null) {
            return null;
        }

        if (!allowAlpha && match[4] !== undefined) {
            return null;
        }

        return hslToRgba(
            {
                hue: Number(match[1]),
                saturation: Number(match[2]) / 100,
                lightness: Number(match[3]) / 100,
            },
            allowAlpha ? (match[4] === undefined ? 1 : Number(match[4])) : 1,
        );
    }

    function parseColorForMode(
        input: string,
        mode: ColorDisplayMode,
        allowAlpha: boolean,
    ): RgbaColor | null {
        try {
            if (mode === "hex") {
                return parseHexColor(input, allowAlpha);
            }

            if (mode === "rgb") {
                return parseRgbColor(input, allowAlpha);
            }

            return parseHslColor(input, allowAlpha);
        } catch {
            return null;
        }
    }

    function getDisplayModeOptions(allowAlpha: boolean) {
        return [
            {
                mode: "hex" as const,
                label: allowAlpha ? "HEXA" : "HEX",
            },
            {
                mode: "rgb" as const,
                label: allowAlpha ? "RGBA" : "RGB",
            },
            {
                mode: "hsl" as const,
                label: allowAlpha ? "HSLA" : "HSL",
            },
        ];
    }

    function formatPercent(value: number): string {
        return `${roundTo(clampNumber(value, 0, 1) * 100, 1)}%`;
    }

    function getHueMarkerFraction(hue: number): number {
        return hue >= 359.999 ? 1 : clampNumber(hue / 360, 0, 1);
    }

    function getPopupInlineStyle(
        popupPosition: PopupPosition,
        color: RgbaColor,
        hsvColor: HsvColor,
    ): string {
        const hueColor = hsvToRgba(
            {
                hue: hsvColor.hue,
                saturation: 1,
                value: 1,
            },
            1,
        );

        return [
            `left:${Math.round(popupPosition.left)}px`,
            `top:${Math.round(popupPosition.top)}px`,
            `transform-origin:${popupPosition.transformOrigin}`,
            `visibility:${popupPosition.ready ? "visible" : "hidden"}`,
            `--clickgui-picker-hue-color:rgb(${hueColor.red} ${hueColor.green} ${hueColor.blue})`,
            `--clickgui-picker-alpha-opaque-color:rgba(${color.red}, ${color.green}, ${color.blue}, 1)`,
            `--clickgui-picker-alpha-transparent-color:rgba(${color.red}, ${color.green}, ${color.blue}, 0)`,
        ].join(";");
    }

    let {
        value,
        onChange = defaultChangeHandler,
        revealItemOptions,
        ariaLabel,
        allowAlpha = true,
        liveUpdate = false,
        block = false,
    }: Props = $props();

    let rootElement = $state<HTMLDivElement | null>(null);
    let triggerButtonElement = $state<HTMLButtonElement | null>(null);
    let popupElement = $state<HTMLDivElement | null>(null);

    let isOpen = $state(false);
    let draftColor = $state<RgbaColor>({
        red: 0,
        green: 0,
        blue: 0,
        alpha: 1,
    });
    let displayMode = $state<ColorDisplayMode>("hex");
    let inputValue = $state("");
    let inputError = $state<string | null>(null);
    let isValueInputFocused = $state(false);
    let activeDragTarget = $state<DragTarget | null>(null);
    let activePointerId = $state<number | null>(null);
    let popupPosition = $state<PopupPosition>({
        left: VIEWPORT_PADDING,
        top: VIEWPORT_PADDING,
        ready: false,
        transformOrigin: "top right",
    });

    const normalizedValue = $derived(normalizeInteractiveColor(value, allowAlpha));
    const swatchColor = $derived(rgbaColorToCssString(normalizedValue));
    const displayLabel = $derived(rgbaColorToDisplayLabel(normalizedValue));
    const displayModeOptions = $derived(getDisplayModeOptions(allowAlpha));
    const draftHsv = $derived(rgbaToHsv(draftColor));
    const popupInlineStyle = $derived(
        getPopupInlineStyle(popupPosition, draftColor, draftHsv),
    );
    const paletteCursorStyle = $derived(
        `left:${formatPercent(draftHsv.saturation)};top:${formatPercent(1 - draftHsv.value)};`,
    );
    const hueMarkerStyle = $derived(
        `top:${formatPercent(getHueMarkerFraction(draftHsv.hue))};`,
    );
    const alphaMarkerStyle = $derived(
        `top:${formatPercent(1 - draftColor.alpha)};`,
    );

    function syncInputValueToDraft() {
        inputValue = formatColorForMode(draftColor, displayMode, allowAlpha);
    }

    async function commitColor(nextColor: RgbaColor) {
        const normalizedNextColor = normalizeInteractiveColor(nextColor, allowAlpha);
        if (rgbaColorEquals(normalizedNextColor, normalizedValue)) {
            return;
        }

        await onChange(normalizedNextColor);
    }

    function setDraftColor(nextColor: RgbaColor, commitImmediately: boolean) {
        const normalizedNextColor = normalizeInteractiveColor(nextColor, allowAlpha);
        draftColor = normalizedNextColor;
        inputError = null;

        if (!isValueInputFocused) {
            syncInputValueToDraft();
        }

        if (commitImmediately) {
            void commitColor(normalizedNextColor);
        }
    }

    function applyInputValue(commitAfterParse: boolean): boolean {
        const parsedColor = parseColorForMode(inputValue, displayMode, allowAlpha);
        if (parsedColor === null) {
            inputError = `Invalid ${displayMode.toUpperCase()} color.`;
            return false;
        }

        setDraftColor(parsedColor, commitAfterParse);
        return true;
    }

    function updatePopupPosition() {
        if (
            !isOpen ||
            triggerButtonElement === null ||
            popupElement === null ||
            typeof window === "undefined"
        ) {
            return;
        }

        const triggerRect = triggerButtonElement.getBoundingClientRect();
        const popupRect = popupElement.getBoundingClientRect();
        const maximumLeft = window.innerWidth - VIEWPORT_PADDING - popupRect.width;
        let left = triggerRect.right - popupRect.width;
        left = clampNumber(left, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, maximumLeft));

        let top = triggerRect.bottom + POPUP_GAP;
        let transformOrigin = "top right";
        const fitsBelow = top + popupRect.height <= window.innerHeight - VIEWPORT_PADDING;
        const topAbove = triggerRect.top - POPUP_GAP - popupRect.height;
        if (!fitsBelow && topAbove >= VIEWPORT_PADDING) {
            top = topAbove;
            transformOrigin = "bottom right";
        }

        popupPosition = {
            left,
            top,
            ready: true,
            transformOrigin,
        };
    }

    async function openPicker() {
        draftColor = normalizedValue;
        inputError = null;
        isValueInputFocused = false;
        syncInputValueToDraft();
        popupPosition = {
            ...popupPosition,
            ready: false,
        };
        isOpen = true;
        await tick();
        updatePopupPosition();
    }

    function closePicker() {
        if (isValueInputFocused) {
            const didApplyInput = applyInputValue(true);
            if (!didApplyInput) {
                inputError = null;
                syncInputValueToDraft();
            }
        }

        isValueInputFocused = false;
        isOpen = false;
        activeDragTarget = null;
        activePointerId = null;
    }

    async function togglePicker() {
        if (isOpen) {
            closePicker();
            return;
        }

        await openPicker();
    }

    function stepTargetValue(
        target: DragTarget,
        step: number,
        direction: "increase" | "decrease",
    ) {
        const currentHsv = rgbaToHsv(draftColor);
        const delta = direction === "increase" ? step : -step;

        if (target === "palette") {
            return;
        }

        if (target === "hue") {
            const nextFraction = clampNumber(
                getHueMarkerFraction(currentHsv.hue) + delta,
                0,
                1,
            );
            const nextHue = nextFraction >= 1 ? 359.999 : nextFraction * 360;
            const nextColor = hsvToRgba(
                {
                    hue: nextHue,
                    saturation: currentHsv.saturation,
                    value: currentHsv.value,
                },
                draftColor.alpha,
            );
            setDraftColor(nextColor, liveUpdate);
            if (!liveUpdate) {
                void commitColor(nextColor);
            }
            return;
        }

        const nextColor = {
            ...draftColor,
            alpha: roundTo(clampNumber(draftColor.alpha + delta, 0, 1), 3),
        };
        setDraftColor(nextColor, liveUpdate);
        if (!liveUpdate) {
            void commitColor(nextColor);
        }
    }

    function onPaletteKeydown(event: KeyboardEvent) {
        const step = event.shiftKey ? 0.1 : 0.02;
        const currentHsv = rgbaToHsv(draftColor);

        if (
            event.key !== "ArrowLeft" &&
            event.key !== "ArrowRight" &&
            event.key !== "ArrowUp" &&
            event.key !== "ArrowDown"
        ) {
            return;
        }

        event.preventDefault();

        const nextSaturation =
            event.key === "ArrowLeft"
                ? clampNumber(currentHsv.saturation - step, 0, 1)
                : event.key === "ArrowRight"
                  ? clampNumber(currentHsv.saturation + step, 0, 1)
                  : currentHsv.saturation;
        const nextValue =
            event.key === "ArrowUp"
                ? clampNumber(currentHsv.value + step, 0, 1)
                : event.key === "ArrowDown"
                  ? clampNumber(currentHsv.value - step, 0, 1)
                  : currentHsv.value;
        const nextColor = hsvToRgba(
            {
                hue: currentHsv.hue,
                saturation: nextSaturation,
                value: nextValue,
            },
            draftColor.alpha,
        );

        setDraftColor(nextColor, liveUpdate);
        if (!liveUpdate) {
            void commitColor(nextColor);
        }
    }

    function onRailKeydown(target: Exclude<DragTarget, "palette">, event: KeyboardEvent) {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
            return;
        }

        event.preventDefault();
        const direction =
            target === "alpha"
                ? event.key === "ArrowUp"
                    ? "increase"
                    : "decrease"
                : event.key === "ArrowUp"
                  ? "decrease"
                  : "increase";
        stepTargetValue(
            target,
            event.shiftKey ? 0.1 : 0.02,
            direction,
        );
    }

    function selectDisplayMode(mode: ColorDisplayMode) {
        displayMode = mode;
        inputError = null;
        syncInputValueToDraft();
    }

    function updateFromPointer(target: DragTarget, event: PointerEvent) {
        const currentTarget = event.currentTarget;
        if (!(currentTarget instanceof HTMLElement)) {
            return;
        }

        const rect = currentTarget.getBoundingClientRect();
        const horizontalProgress = clampNumber(
            (event.clientX - rect.left) / rect.width,
            0,
            1,
        );
        const verticalProgress = clampNumber(
            (event.clientY - rect.top) / rect.height,
            0,
            1,
        );
        const currentHsv = rgbaToHsv(draftColor);

        if (target === "palette") {
            setDraftColor(
                hsvToRgba(
                    {
                        hue: currentHsv.hue,
                        saturation: horizontalProgress,
                        value: 1 - verticalProgress,
                    },
                    draftColor.alpha,
                ),
                liveUpdate,
            );
            return;
        }

        if (target === "hue") {
            const hue = verticalProgress >= 1 ? 359.999 : verticalProgress * 360;
            setDraftColor(
                hsvToRgba(
                    {
                        hue,
                        saturation: currentHsv.saturation,
                        value: currentHsv.value,
                    },
                    draftColor.alpha,
                ),
                liveUpdate,
            );
            return;
        }

        setDraftColor(
            {
                ...draftColor,
                alpha: roundTo(1 - verticalProgress, 3),
            },
            liveUpdate,
        );
    }

    function beginDrag(target: DragTarget, event: PointerEvent) {
        const currentTarget = event.currentTarget;
        if (!(currentTarget instanceof HTMLElement)) {
            return;
        }

        event.preventDefault();
        activeDragTarget = target;
        activePointerId = event.pointerId;
        currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(target, event);
    }

    function continueDrag(target: DragTarget, event: PointerEvent) {
        if (activeDragTarget !== target || activePointerId !== event.pointerId) {
            return;
        }

        event.preventDefault();
        updateFromPointer(target, event);
    }

    function endDrag(target: DragTarget, event: PointerEvent) {
        if (activeDragTarget !== target || activePointerId !== event.pointerId) {
            return;
        }

        updateFromPointer(target, event);
        const currentTarget = event.currentTarget;
        if (currentTarget instanceof HTMLElement && currentTarget.hasPointerCapture(event.pointerId)) {
            currentTarget.releasePointerCapture(event.pointerId);
        }

        activeDragTarget = null;
        activePointerId = null;

        if (!liveUpdate) {
            void commitColor(draftColor);
        }
    }

    function onValueInputFocus() {
        isValueInputFocused = true;
    }

    function onValueInputBlur() {
        isValueInputFocused = false;
        const didApplyInput = applyInputValue(true);
        if (!didApplyInput) {
            inputError = null;
            syncInputValueToDraft();
        }
    }

    function onValueInputKeydown(event: KeyboardEvent) {
        if (!(event.currentTarget instanceof HTMLInputElement)) {
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            const didApplyInput = applyInputValue(true);
            if (didApplyInput) {
                event.currentTarget.blur();
            }
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            inputError = null;
            syncInputValueToDraft();
            event.currentTarget.blur();
        }
    }

    $effect(() => {
        if (rgbaColorEquals(draftColor, normalizedValue)) {
            return;
        }

        draftColor = normalizedValue;

        if (!isValueInputFocused) {
            inputValue = formatColorForMode(normalizedValue, displayMode, allowAlpha);
        }
    });

    $effect(() => {
        if (isValueInputFocused) {
            return;
        }

        syncInputValueToDraft();
    });

    $effect(() => {
        if (!isOpen || typeof window === "undefined") {
            return;
        }

        void tick().then(() => {
            updatePopupPosition();
        });

        const onDocumentPointerDown = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }

            if (rootElement?.contains(target) ?? false) {
                return;
            }

            closePicker();
        };

        const onDocumentKeydown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }

            event.preventDefault();
            closePicker();
        };

        const onViewportChange = () => {
            updatePopupPosition();
        };

        document.addEventListener("pointerdown", onDocumentPointerDown, true);
        document.addEventListener("keydown", onDocumentKeydown);
        window.addEventListener("resize", onViewportChange);
        window.addEventListener("scroll", onViewportChange, true);

        return () => {
            document.removeEventListener("pointerdown", onDocumentPointerDown, true);
            document.removeEventListener("keydown", onDocumentKeydown);
            window.removeEventListener("resize", onViewportChange);
            window.removeEventListener("scroll", onViewportChange, true);
        };
    });
</script>

<div
    bind:this={rootElement}
    class="clickgui-color-picker"
    class:clickgui-color-picker--block={block}
>
    <div
        class="setting-input-shell clickgui-color-picker-shell"
        class:setting-input-shell--block={block}
        use:revealBorder
    >
        <button
            bind:this={triggerButtonElement}
            class="setting-input-control clickgui-color-picker-trigger"
            class:setting-input-control--block={block}
            type="button"
            aria-label={ariaLabel}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            onclick={togglePicker}
            use:revealItem={revealItemOptions}
        >
            <span class="reveal-press-content">
                <span
                    class="clickgui-color-picker-swatch"
                    style={`--clickgui-picker-color:${swatchColor};`}
                    aria-hidden="true"
                ></span>
                <span class="clickgui-color-picker-label">{displayLabel}</span>
            </span>
        </button>
    </div>

    {#if isOpen}
        <div
            bind:this={popupElement}
            class="clickgui-color-picker-popup"
            class:clickgui-color-picker-popup--opaque={!allowAlpha}
            style={popupInlineStyle}
            role="dialog"
            aria-label={`${ariaLabel} picker`}
        >
            <div
                class="clickgui-color-picker-selection"
                class:clickgui-color-picker-selection--opaque={!allowAlpha}
            >
                <button
                    class="clickgui-color-picker-palette"
                    style={`height:${PICKER_HEIGHT}px;`}
                    type="button"
                    aria-label={`${ariaLabel} saturation and brightness`}
                    onpointerdown={(event) => beginDrag("palette", event)}
                    onpointermove={(event) => continueDrag("palette", event)}
                    onpointerup={(event) => endDrag("palette", event)}
                    onpointercancel={(event) => endDrag("palette", event)}
                    onkeydown={onPaletteKeydown}
                >
                    <div
                        class="clickgui-color-picker-palette-cursor"
                        style={paletteCursorStyle}
                        aria-hidden="true"
                    ></div>
                </button>

                {#if allowAlpha}
                    <div
                        class="clickgui-color-picker-rail clickgui-color-picker-rail--alpha"
                        style={`height:${PICKER_HEIGHT}px;`}
                        role="slider"
                        aria-label={`${ariaLabel} alpha`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(draftColor.alpha * 100)}
                        tabindex="0"
                        onpointerdown={(event) => beginDrag("alpha", event)}
                        onpointermove={(event) => continueDrag("alpha", event)}
                        onpointerup={(event) => endDrag("alpha", event)}
                        onpointercancel={(event) => endDrag("alpha", event)}
                        onkeydown={(event) => onRailKeydown("alpha", event)}
                    >
                        <div class="clickgui-color-picker-rail-track"></div>
                        <div
                            class="clickgui-color-picker-rail-thumb"
                            style={alphaMarkerStyle}
                            aria-hidden="true"
                        ></div>
                    </div>
                {/if}

                <div
                    class="clickgui-color-picker-rail clickgui-color-picker-rail--hue"
                    style={`height:${PICKER_HEIGHT}px;`}
                    role="slider"
                    aria-label={`${ariaLabel} hue`}
                    aria-valuemin={0}
                    aria-valuemax={360}
                    aria-valuenow={Math.round(draftHsv.hue)}
                    tabindex="0"
                    onpointerdown={(event) => beginDrag("hue", event)}
                    onpointermove={(event) => continueDrag("hue", event)}
                    onpointerup={(event) => endDrag("hue", event)}
                    onpointercancel={(event) => endDrag("hue", event)}
                    onkeydown={(event) => onRailKeydown("hue", event)}
                >
                    <div class="clickgui-color-picker-rail-track"></div>
                    <div
                        class="clickgui-color-picker-rail-thumb"
                        style={hueMarkerStyle}
                        aria-hidden="true"
                    ></div>
                </div>
            </div>

            <div class="clickgui-color-picker-controls">
                <div
                    class="setting-input-shell clickgui-color-picker-value-shell"
                    class:clickgui-color-picker-value-shell--invalid={inputError !== null}
                    use:revealBorder
                >
                    <input
                        class="setting-input-text clickgui-color-picker-value-input"
                        type="text"
                        aria-label={`${ariaLabel} value`}
                        aria-invalid={inputError !== null}
                        spellcheck="false"
                        bind:value={inputValue}
                        title={inputError ?? undefined}
                        onfocus={onValueInputFocus}
                        onblur={onValueInputBlur}
                        onkeydown={onValueInputKeydown}
                    />
                </div>

                {#each displayModeOptions as option}
                    {@const isActive = option.mode === displayMode}

                    <div class="setting-input-shell clickgui-color-picker-mode-shell" use:revealBorder>
                        <button
                            class="setting-input-control clickgui-color-picker-mode-button"
                            class:clickgui-color-picker-mode-button--active={isActive}
                            type="button"
                            aria-pressed={isActive}
                            onclick={() => selectDisplayMode(option.mode)}
                            use:revealItem={revealItemOptions}
                        >
                            <span class="reveal-press-content">
                                <span class="clickgui-color-picker-mode-label">{option.label}</span>
                            </span>
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .clickgui-color-picker {
        position: relative;
        display: inline-flex;
        max-width: 100%;
    }

    .clickgui-color-picker--block {
        display: flex;
        width: 100%;
    }

    .clickgui-color-picker-shell {
        max-width: 100%;
    }

    .clickgui-color-picker-trigger {
        position: relative;
        overflow: hidden;
        cursor: pointer;
        --reveal-focus-color: var(--clickgui-accent-color, #{$accent-color});
        --setting-control-padding-inline: 10px;
        --setting-control-min-width: 108px;
        --setting-control-border-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.36
        );
        --setting-control-background-color: var(--clickgui-control-off-color);
    }

    .clickgui-color-picker-trigger > .reveal-press-content {
        gap: 8px;
        max-width: 100%;
    }

    .clickgui-color-picker-swatch {
        position: relative;
        width: 12px;
        height: 12px;
        flex-shrink: 0;
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.62);
        box-shadow: inset 0 0 0 1px rgb(var(--clickgui-base-rgb, 0 0 0) / 0.2);
        background:
            linear-gradient(var(--clickgui-picker-color), var(--clickgui-picker-color)),
            linear-gradient(
                45deg,
                rgb(var(--clickgui-text-rgb, 255 255 255) / 0.14) 25%,
                transparent 25%,
                transparent 75%,
                rgb(var(--clickgui-text-rgb, 255 255 255) / 0.14) 75%
            ),
            linear-gradient(
                45deg,
                rgb(var(--clickgui-base-rgb, 0 0 0) / 0.18) 25%,
                transparent 25%,
                transparent 75%,
                rgb(var(--clickgui-base-rgb, 0 0 0) / 0.18) 75%
            );
        background-position:
            0 0,
            0 0,
            4px 4px;
        background-size:
            100% 100%,
            8px 8px,
            8px 8px;
    }

    .clickgui-color-picker-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11px;
        line-height: 1;
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.94);
    }

    .clickgui-color-picker-popup {
        width: min(292px, calc(100vw - 24px));
        position: fixed;
        z-index: 36;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px;
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.16);
        border-radius: 0;
        background: rgb(var(--clickgui-base-rgb, 0 0 0) / 0.98);
        color: var(--clickgui-text-color, #{$clickgui-text-color});
        box-shadow:
            0 10px 26px rgb(var(--clickgui-base-rgb, 0 0 0) / 0.5),
            inset 0 0 0 1px rgb(var(--clickgui-text-rgb, 255 255 255) / 0.03);
    }

    .clickgui-color-picker-selection {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 22px 22px;
        gap: 8px;
        align-items: stretch;
    }

    .clickgui-color-picker-selection--opaque {
        grid-template-columns: minmax(0, 1fr) 22px;
    }

    .clickgui-color-picker-palette {
        position: relative;
        display: block;
        min-width: 0;
        width: 100%;
        padding: 0;
        cursor: crosshair;
        appearance: none;
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.12);
        border-radius: 0;
        background:
            linear-gradient(to top, #000000, transparent),
            linear-gradient(to right, #ffffff, transparent),
            var(--clickgui-picker-hue-color);
        overflow: visible;
        user-select: none;
    }

    .clickgui-color-picker-palette-cursor {
        position: absolute;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-radius: 0;
        background: transparent;
        box-shadow:
            0 0 0 1px rgb(var(--clickgui-base-rgb, 0 0 0) / 0.72),
            0 0 0 2px rgb(var(--clickgui-text-rgb, 255 255 255) / 0.24);
        transform: translate(-50%, -50%);
        pointer-events: none;
    }

    .clickgui-color-picker-rail {
        position: relative;
        width: 22px;
        min-height: 0;
        cursor: ns-resize;
        user-select: none;
        overflow: visible;
    }

    .clickgui-color-picker-rail-track {
        position: absolute;
        inset: 0;
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.12);
        border-radius: 0;
        overflow: hidden;
        isolation: isolate;
    }

    .clickgui-color-picker-rail-track::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .clickgui-color-picker-rail-track::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .clickgui-color-picker-rail--hue .clickgui-color-picker-rail-track {
        background: linear-gradient(
            to bottom,
            hsl(0deg 100% 50%),
            hsl(60deg 100% 50%),
            hsl(120deg 100% 50%),
            hsl(180deg 100% 50%),
            hsl(240deg 100% 50%),
            hsl(300deg 100% 50%),
            hsl(360deg 100% 50%)
        );
    }

    .clickgui-color-picker-rail--alpha .clickgui-color-picker-rail-track {
        background-color: rgb(var(--clickgui-base-rgb, 0 0 0) / 0.08);
    }

    .clickgui-color-picker-rail--alpha .clickgui-color-picker-rail-track::before {
        background:
            conic-gradient(
                from 0deg,
                rgb(var(--clickgui-text-rgb, 255 255 255) / 0.15) 0deg 90deg,
                rgb(var(--clickgui-base-rgb, 0 0 0) / 0.18) 90deg 180deg,
                rgb(var(--clickgui-text-rgb, 255 255 255) / 0.15) 180deg 270deg,
                rgb(var(--clickgui-base-rgb, 0 0 0) / 0.18) 270deg 360deg
            )
            0 0 / 8px 8px repeat;
    }

    .clickgui-color-picker-rail--alpha .clickgui-color-picker-rail-track::after {
        background: linear-gradient(
            to bottom,
            var(--clickgui-picker-alpha-opaque-color),
            var(--clickgui-picker-alpha-transparent-color)
        );
    }

    .clickgui-color-picker-rail-thumb {
        position: absolute;
        left: 0;
        right: 0;
        height: 4px;
        border-radius: 0;
        background: rgb(var(--clickgui-text-rgb, 255 255 255) / 0.98);
        box-shadow:
            0 0 0 1px rgb(var(--clickgui-base-rgb, 0 0 0) / 0.94),
            0 0 0 2px rgb(var(--clickgui-base-rgb, 0 0 0) / 0.4);
        transform: translateY(-50%);
        pointer-events: none;
    }

    .clickgui-color-picker-controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .clickgui-color-picker-value-shell {
        display: flex;
        flex: 1 1 116px;
        min-width: 0;
        min-height: 28px;
        padding-inline: 9px;
        align-items: center;
        border: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.14);
        background: rgb(var(--clickgui-text-rgb, 255 255 255) / 0.08);
        transition:
            border-color 120ms ease,
            box-shadow 120ms ease,
            background-color 120ms ease;
        --reveal-focus-color: var(--clickgui-accent-color, #{$accent-color});
        --setting-control-border-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.14
        );
        --setting-control-background-color: var(--clickgui-input-background-color);
    }

    .clickgui-color-picker-value-shell:focus-within {
        border-color: rgb(var(--clickgui-accent-rgb, 70 119 255) / 0.92);
        box-shadow: 0 0 0 1px rgb(var(--clickgui-accent-rgb, 70 119 255) / 0.78);
    }

    .clickgui-color-picker-value-shell--invalid {
        border-color: rgb(255 116 116 / 0.84);
        background-color: rgb(255 116 116 / 0.08);
        --setting-control-border-color: rgb(255 116 116 / 0.84);
        --setting-control-background-color: rgb(255 116 116 / 0.08);
    }

    .clickgui-color-picker-value-shell--invalid:focus-within {
        border-color: rgb(255 116 116 / 0.96);
        box-shadow: 0 0 0 1px rgb(255 116 116 / 0.6);
    }

    .clickgui-color-picker-value-input {
        width: 100%;
        min-width: 0;
        padding: 0;
        box-shadow: none !important;
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
        color: rgb(var(--clickgui-text-rgb, 255 255 255) / 0.96);
    }

    .clickgui-color-picker-mode-shell {
        display: flex;
    }

    .clickgui-color-picker-mode-button {
        --reveal-focus-color: var(--clickgui-accent-color, #{$accent-color});
        --setting-control-min-width: 44px;
        --setting-control-height: 28px;
        --setting-control-padding-inline: 8px;
        --setting-control-border-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.14
        );
        --setting-control-background-color: var(--clickgui-control-off-color);
    }

    .clickgui-color-picker-mode-button.clickgui-color-picker-mode-button--active {
        --setting-control-border-color: rgb(
            var(--clickgui-accent-rgb, 70 119 255) / 0.7
        );
        --setting-control-background-color: rgb(
            var(--clickgui-accent-rgb, 70 119 255) / 0.34
        );
    }

    .clickgui-color-picker-mode-label {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.92);
        transition: color 120ms ease;
    }

    .clickgui-color-picker-mode-button.clickgui-color-picker-mode-button--active
        .clickgui-color-picker-mode-label {
        color: var(--clickgui-text-color, #{$clickgui-text-color});
    }
</style>
