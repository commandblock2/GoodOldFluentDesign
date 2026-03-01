<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";

    interface FloatingRect {
        top: number;
        left: number;
        width: number;
        maxHeight: number;
    }

    interface Props {
        value: string;
        onChange?: (value: string) => void;
        placeholder?: string;
        revealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: string) => {};

    let {
        value,
        onChange = defaultChangeHandler,
        placeholder = "",
        revealItemOptions,
    }: Props = $props();

    let collapsedInputElement = $state<HTMLInputElement | null>(null);
    let floatingTextareaElement = $state<HTMLTextAreaElement | null>(null);
    let expanded = $state(false);
    let draftValue = $state("");
    let measurementElement: HTMLSpanElement | null = null;
    let floatingRect = $state<FloatingRect>({
        top: 0,
        left: 0,
        width: 0,
        maxHeight: 180,
    });

    $effect(() => {
        if (expanded) {
            return;
        }

        draftValue = value;
    });

    function recalculateFloatingRect() {
        if (collapsedInputElement === null || typeof window === "undefined") {
            return;
        }

        const viewportPadding = 12;
        const anchorRect = collapsedInputElement.getBoundingClientRect();
        const previewText = draftValue.length > 0 ? draftValue : value;
        const measuredTextWidth = getRenderedTextWidth(previewText);
        const availableViewportWidth = Math.max(
            160,
            window.innerWidth - viewportPadding * 2,
        );
        const desiredWidth = Math.max(
            320,
            anchorRect.width * 1.65,
            Math.min(760, measuredTextWidth + 52),
        );
        const width = Math.min(
            760,
            Math.min(availableViewportWidth, desiredWidth),
        );
        const left = Math.min(
            Math.max(viewportPadding, anchorRect.left),
            window.innerWidth - width - viewportPadding,
        );
        const top = Math.min(
            Math.max(viewportPadding, anchorRect.top - 8),
            Math.max(viewportPadding, window.innerHeight - 140),
        );
        const maxHeight = Math.max(
            140,
            window.innerHeight - top - viewportPadding,
        );

        floatingRect = {
            top,
            left,
            width,
            maxHeight,
        };
    }

    function openExpandedEditor() {
        if (expanded) {
            return;
        }

        draftValue = value;
        recalculateFloatingRect();
        expanded = true;
    }

    function getMeasurementElement() {
        if (measurementElement !== null) {
            return measurementElement;
        }

        const nextElement = document.createElement("span");
        nextElement.style.position = "fixed";
        nextElement.style.left = "-99999px";
        nextElement.style.top = "-99999px";
        nextElement.style.visibility = "hidden";
        nextElement.style.whiteSpace = "pre";
        nextElement.style.pointerEvents = "none";
        nextElement.style.zIndex = "-1";
        document.body.appendChild(nextElement);
        measurementElement = nextElement;
        return nextElement;
    }

    function getRenderedTextWidth(text: string): number {
        if (collapsedInputElement === null || typeof window === "undefined") {
            return 0;
        }

        const styles = window.getComputedStyle(collapsedInputElement);
        const measurement = getMeasurementElement();
        measurement.style.fontFamily = styles.fontFamily;
        measurement.style.fontSize = styles.fontSize;
        measurement.style.fontWeight = styles.fontWeight;
        measurement.style.fontStyle = styles.fontStyle;
        measurement.style.letterSpacing = styles.letterSpacing;
        measurement.style.textTransform = styles.textTransform;
        measurement.textContent = text.length > 0 ? text : " ";
        return measurement.getBoundingClientRect().width;
    }

    function isCollapsedOverflowing(): boolean {
        if (collapsedInputElement === null || typeof window === "undefined") {
            return false;
        }

        const directOverflow =
            collapsedInputElement.scrollWidth >
            collapsedInputElement.clientWidth + 1;

        if (directOverflow) {
            return true;
        }

        const styles = window.getComputedStyle(collapsedInputElement);
        const paddingLeftPx = Number.parseFloat(styles.paddingLeft) || 0;
        const paddingRightPx = Number.parseFloat(styles.paddingRight) || 0;
        const availableTextWidth = Math.max(
            0,
            collapsedInputElement.clientWidth - paddingLeftPx - paddingRightPx,
        );
        const displayedValue = collapsedInputElement.value ?? value;
        const measuredTextWidth = getRenderedTextWidth(displayedValue);

        return measuredTextWidth > availableTextWidth + 1;
    }

    function shouldExpandForCurrentValue(): boolean {
        return (
            value.includes("\n") ||
            draftValue.includes("\n") ||
            isCollapsedOverflowing()
        );
    }

    function closeExpandedEditor(commit: boolean) {
        if (!expanded) {
            return;
        }

        expanded = false;

        if (commit && draftValue !== value) {
            onChange(draftValue);
        }
    }

    function handleCollapsedFocus() {
        if (!shouldExpandForCurrentValue()) {
            return;
        }

        openExpandedEditor();
    }

    function handleCollapsedMouseDown(event: MouseEvent) {
        if (!shouldExpandForCurrentValue()) {
            return;
        }

        event.preventDefault();
        openExpandedEditor();
    }

    function handleCollapsedChange(event: Event) {
        const nextValue = (event.currentTarget as HTMLInputElement).value;
        if (nextValue === value) {
            return;
        }

        onChange(nextValue);
    }

    function handleFloatingInput(event: Event) {
        draftValue = (event.currentTarget as HTMLTextAreaElement).value;
    }

    function handleFloatingBlur() {
        closeExpandedEditor(true);
    }

    function handleFloatingKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            event.preventDefault();
            draftValue = value;
            closeExpandedEditor(false);
            return;
        }

        if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
        ) {
            event.preventDefault();
            closeExpandedEditor(true);
        }
    }

    $effect(() => {
        if (!expanded) {
            return;
        }

        const focusAnimationFrame = requestAnimationFrame(() => {
            if (floatingTextareaElement === null) {
                return;
            }

            floatingTextareaElement.focus();
            const caretPosition = floatingTextareaElement.value.length;
            floatingTextareaElement.setSelectionRange(caretPosition, caretPosition);
        });

        return () => {
            cancelAnimationFrame(focusAnimationFrame);
        };
    });

    $effect(() => {
        if (!expanded || typeof window === "undefined") {
            return;
        }

        const handleViewportMutation = () => {
            recalculateFloatingRect();
        };

        window.addEventListener("resize", handleViewportMutation);
        window.addEventListener("scroll", handleViewportMutation, true);

        return () => {
            window.removeEventListener("resize", handleViewportMutation);
            window.removeEventListener("scroll", handleViewportMutation, true);
        };
    });

    $effect(() => {
        return () => {
            if (measurementElement === null) {
                return;
            }

            measurementElement.remove();
            measurementElement = null;
        };
    });

    const floatingStyle = $derived(
        `top:${floatingRect.top}px;left:${floatingRect.left}px;width:${floatingRect.width}px;--floating-max-height:${floatingRect.maxHeight}px;`,
    );
</script>

<div class="setting-input-shell expandable-text-input-shell" use:revealBorder>
    <label
        class="setting-input-control expandable-text-input-control"
        use:revealItem={revealItemOptions}
    >
        <span class="reveal-press-content">
            <input
                bind:this={collapsedInputElement}
                class="setting-input-text expandable-text-collapsed-input"
                type="text"
                spellcheck={false}
                value={value}
                {placeholder}
                onfocus={handleCollapsedFocus}
                onmousedown={handleCollapsedMouseDown}
                onchange={handleCollapsedChange}
            />
        </span>
    </label>
</div>

{#if expanded}
    <div
        class="expandable-text-floating"
        style={floatingStyle}
        role="dialog"
        aria-label="Expanded text editor"
    >
        <div class="expandable-text-floating-shell" use:revealBorder>
            <label
                class="setting-input-control setting-input-control--block expandable-text-floating-control"
                use:revealItem={revealItemOptions}
            >
                <span class="reveal-press-content">
                    <textarea
                        bind:this={floatingTextareaElement}
                        class="setting-input-text expandable-textarea"
                        spellcheck={false}
                        value={draftValue}
                        {placeholder}
                        oninput={handleFloatingInput}
                        onblur={handleFloatingBlur}
                        onkeydown={handleFloatingKeyDown}
                    ></textarea>
                </span>
            </label>
        </div>
    </div>
{/if}

<style lang="scss">
    @use "../../../colors.scss" as *;

    .expandable-text-input-shell {
        display: inline-flex;
        max-width: 100%;
    }

    .expandable-text-input-control {
        --reveal-focus-color: #{$accent-color};
        --setting-control-content-width: clamp(150px, 34vw, 260px);
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.4)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.08)};
        --setting-control-border-radius: 0px;
        --setting-control-box-shadow:
            inset 0 0 0 1px #{rgba($clickgui-text-color, 0.08)};
    }

    .expandable-text-input-control > .reveal-press-content {
        width: 100%;
    }

    .expandable-text-collapsed-input {
        padding: 0 10px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        cursor: text;
    }

    .expandable-text-floating {
        position: fixed;
        z-index: 2000;
        pointer-events: auto;
    }

    .expandable-text-floating-shell {
        position: relative;
        width: 100%;
        overflow: hidden;
        background-color: rgba($clickgui-base-color, 0.24);
    }

    .expandable-text-floating-control {
        position: relative;
        z-index: 1;
        --reveal-focus-color: #{$accent-color};
        --setting-control-height: auto;
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-border-color: #{rgba($accent-color, 0.88)};
        --setting-control-background-color: #{rgba($clickgui-base-color, 0.18)};
        --setting-control-border-radius: 0px;
        --setting-control-box-shadow:
            0 0 0 1px #{rgba($accent-color, 0.36)},
            inset 0 0 0 1px #{rgba($clickgui-text-color, 0.2)};
    }

    .expandable-text-floating-control > .reveal-press-content {
        width: 100%;
        height: auto;
        min-height: 120px;
        align-items: stretch;
        background: rgba($clickgui-base-color, 0.08);
    }

    .expandable-textarea {
        min-height: 120px !important;
        max-height: min(58vh, var(--floating-max-height)) !important;
        height: 120px !important;
        width: 100%;
        display: block;
        box-sizing: border-box;
        padding: 10px 12px !important;
        resize: vertical;
        line-height: 1.42 !important;
        overflow: auto;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        background: transparent !important;
    }
</style>
