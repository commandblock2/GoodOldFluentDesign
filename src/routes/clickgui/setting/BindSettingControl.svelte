<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import { onDestroy } from "svelte";
    import type {
        KeyboardKeyEvent,
        MouseButtonEvent,
    } from "../../../integration/events";
    import { getPrintableKeyName } from "../../../integration/rest";
    import type {
        BindModifier,
        BindSetting,
        InputBind,
    } from "../../../integration/types";
    import { waitMatches } from "../../../integration/ws";
    import { isClickGuiScreen, UNKNOWN_KEY } from "../../../util/utils";

    interface Props {
        setting: BindSetting;
        onChange?: (value: InputBind) => void;
        revealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: InputBind) => {};

    // GLFW key tokens used by backend keyboard events.
    const keyTokenToModifier: Record<number, BindModifier> = {
        340: "Shift",
        344: "Shift",
        341: "Control",
        345: "Control",
        342: "Alt",
        346: "Alt",
        343: "Super",
        347: "Super",
    };

    // Prevent duplicates like Shift + Right Shift.
    const keyCodeToModifier: Record<string, BindModifier> = {
        "key.keyboard.left.shift": "Shift",
        "key.keyboard.right.shift": "Shift",
        "key.keyboard.left.control": "Control",
        "key.keyboard.right.control": "Control",
        "key.keyboard.left.alt": "Alt",
        "key.keyboard.right.alt": "Alt",
        "key.keyboard.left.win": "Super",
        "key.keyboard.right.win": "Super",
    };
    let {
        setting,
        onChange = defaultChangeHandler,
        revealItemOptions,
    }: Props = $props();

    let isListening = $state(false);
    let isHovered = $state(false);
    let printableKeyName = $state<string | undefined>(undefined);
    let addedModifiers = $state<BindModifier[]>([]);
    let lookupRequestId = 0;
    let listenSessionId = 0;
    let finalizeTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

    const platform = detectPlatform();
    const hasBoundKey = $derived(
        setting.value.boundKey !== UNKNOWN_KEY && printableKeyName !== undefined,
    );
    const displayedModifiers = $derived(getModifiers(setting.value));

    $effect(() => {
        if (isListening) {
            return;
        }

        const boundKey = setting.value.boundKey;
        if (boundKey === UNKNOWN_KEY) {
            printableKeyName = undefined;
            return;
        }

        const requestId = ++lookupRequestId;
        printableKeyName = boundKey;

        getPrintableKeyName(boundKey)
            .then((printableKey) => {
                if (requestId !== lookupRequestId) {
                    return;
                }

                printableKeyName = printableKey.localized;
            })
            .catch(() => {
                if (requestId !== lookupRequestId) {
                    return;
                }

                printableKeyName = boundKey;
            });
    });

    onDestroy(() => {
        clearFinalizeTimeout();
        listenSessionId += 1;
    });

    function detectPlatform(): "windows" | "mac" | "other" {
        if (typeof navigator === "undefined") {
            return "other";
        }

        const navigatorWithUAData = navigator as Navigator & {
            userAgentData?: { platform?: string };
        };
        const platformValue = (
            navigatorWithUAData.userAgentData?.platform ??
            navigator.platform ??
            ""
        ).toLowerCase();

        if (platformValue.includes("mac")) {
            return "mac";
        }

        if (platformValue.includes("win")) {
            return "windows";
        }

        return "other";
    }

    function getModifierLabel(modifier: BindModifier): string {
        if (platform === "mac") {
            if (modifier === "Shift") {
                return "\u21e7";
            }

            if (modifier === "Control") {
                return "^";
            }

            if (modifier === "Alt") {
                return "\u2325";
            }

            if (modifier === "Super") {
                return "\u2318";
            }

            return modifier;
        }

        if (platform === "windows") {
            if (modifier === "Control") {
                return "Ctrl";
            }

            if (modifier === "Super") {
                return "\u229e";
            }

            return modifier;
        }

        return modifier;
    }

    const nextBindEvent = () =>
        Promise.any([
            waitMatches(
                "mouseButton",
                (event: MouseButtonEvent) =>
                    isClickGuiScreen(event.screen) &&
                    !(event.button === 0 && isHovered),
            ),
            waitMatches(
                "keyboardKey",
                (event: KeyboardKeyEvent) => isClickGuiScreen(event.screen),
            ),
        ]);

    async function toggleListening() {
        if (isListening) {
            commitBind({
                ...setting.value,
                boundKey: UNKNOWN_KEY,
                modifiers: [],
            });
            stopListening();
            return;
        }

        await startListening();
    }

    async function startListening() {
        clearFinalizeTimeout();
        addedModifiers = [];
        isListening = true;
        const sessionId = ++listenSessionId;

        try {
            let event = await nextBindEvent();

            while (isListening && sessionId === listenSessionId) {
                const modifierResult = handleBindEventIfNotModifier(event);
                if (!modifierResult) {
                    return;
                }

                if (!addedModifiers.includes(modifierResult.modifier)) {
                    addedModifiers = [...addedModifiers, modifierResult.modifier];
                }

                clearFinalizeTimeout();
                finalizeTimeout = setTimeout(() => {
                    if (!isListening || sessionId !== listenSessionId) {
                        return;
                    }

                    commitBindWithModifiers(modifierResult.key);
                }, 1000);

                event = await nextBindEvent();
            }
        } catch {
            if (sessionId === listenSessionId) {
                stopListening();
            }
        }
    }

    function handleBindEventIfNotModifier(
        event: KeyboardKeyEvent | MouseButtonEvent,
    ): { key: string; modifier: BindModifier } | undefined {
        if ("keyCode" in event) {
            if (event.keyCode === 256) {
                commitBindWithModifiers(UNKNOWN_KEY);
                return undefined;
            }

            const modifier = keyTokenToModifier[event.keyCode];
            if (!modifier) {
                commitBindWithModifiers(event.key);
                return undefined;
            }

            return {
                key: event.key,
                modifier,
            };
        }

        if ("button" in event) {
            commitBindWithModifiers(event.key);
            return undefined;
        }

        throw new Error("Unexpected bind event payload.");
    }

    function commitBindWithModifiers(boundKey: string) {
        const duplicateModifier = keyCodeToModifier[boundKey];
        const nextModifiers =
            duplicateModifier === undefined
                ? [...addedModifiers]
                : addedModifiers.filter(
                      (modifier) => modifier !== duplicateModifier,
                  );

        commitBind({
            ...setting.value,
            boundKey,
            modifiers: nextModifiers,
        });
        stopListening();
    }

    function stopListening() {
        clearFinalizeTimeout();
        addedModifiers = [];
        isListening = false;
        listenSessionId += 1;
    }

    function clearFinalizeTimeout() {
        if (finalizeTimeout === undefined) {
            return;
        }

        clearTimeout(finalizeTimeout);
        finalizeTimeout = undefined;
    }

    function commitBind(nextBind: InputBind) {
        const currentModifiers = getModifiers(setting.value);
        if (
            setting.value.boundKey === nextBind.boundKey &&
            setting.value.action === nextBind.action &&
            arraysEqual(currentModifiers, nextBind.modifiers)
        ) {
            return;
        }

        onChange(nextBind);
    }

    function getModifiers(bind: Partial<InputBind>): BindModifier[] {
        return Array.isArray(bind.modifiers) ? bind.modifiers : [];
    }

    function arraysEqual(left: string[], right: string[]): boolean {
        if (left.length !== right.length) {
            return false;
        }

        for (let index = 0; index < left.length; index++) {
            if (left[index] !== right[index]) {
                return false;
            }
        }

        return true;
    }
</script>

<div class="setting-input-shell" use:revealBorder>
    <button
        class="setting-input-control bind-setting-control"
        class:bind-setting-control--listening={isListening}
        type="button"
        onmouseenter={() => (isHovered = true)}
        onmouseleave={() => (isHovered = false)}
        onclick={toggleListening}
        use:revealItem={revealItemOptions}
    >
        <span class="reveal-press-content">
            {#if !isListening}
                {#if hasBoundKey}
                    <span class="bind-setting-display">
                        {#each displayedModifiers as modifier (modifier)}
                            <span class="bind-setting-modifier">
                                {getModifierLabel(modifier)}
                            </span>
                        {/each}
                        <span class="bind-setting-key">{printableKeyName}</span>
                    </span>
                {:else}
                    <span class="bind-setting-none">None</span>
                {/if}
            {:else if addedModifiers.length > 0}
                <span class="bind-setting-display">
                    {#each addedModifiers as modifier (modifier)}
                        <span class="bind-setting-modifier">
                            {getModifierLabel(modifier)}
                        </span>
                    {/each}
                    <span class="bind-setting-key">...</span>
                </span>
            {:else}
                <span class="bind-setting-listening">Press any key...</span>
            {/if}
        </span>
    </button>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .bind-setting-control {
        cursor: pointer;
        --reveal-focus-color: #{$accent-color};
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.36)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.18)};
        --setting-control-padding-inline: 10px;
        --setting-control-min-width: 108px;
    }

    .bind-setting-control.bind-setting-control--listening {
        --setting-control-border-color: #{$accent-color};
        --setting-control-background-color: #{rgba($accent-color, 0.2)};
    }

    .bind-setting-display {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        font-size: 11px;
    }

    .bind-setting-modifier::after {
        content: "+";
        margin-left: 4px;
        color: rgba($clickgui-text-dimmed-color, 0.76);
    }

    .bind-setting-key {
        font-weight: 700;
        letter-spacing: 0.02em;
        color: rgba($clickgui-text-color, 0.96);
    }

    .bind-setting-none {
        color: rgba($clickgui-text-dimmed-color, 0.9);
        font-size: 11px;
        letter-spacing: 0.03em;
    }

    .bind-setting-listening {
        color: rgba($clickgui-text-color, 0.96);
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }
</style>
