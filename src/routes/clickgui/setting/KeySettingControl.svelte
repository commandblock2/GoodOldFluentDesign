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
    import {
        clearPrintableKeyNameLookup,
        getPrintableKeyName,
    } from "../../../integration/rest";
    import type { KeySetting } from "../../../integration/types";
    import { waitMatches } from "../../../integration/ws";
    import { isClickGuiScreen, UNKNOWN_KEY } from "../../../util/utils";

    interface Props {
        setting: KeySetting;
        onChange?: (value: string) => void;
        revealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: string) => {};

    let {
        setting,
        onChange = defaultChangeHandler,
        revealItemOptions,
    }: Props = $props();

    let isListening = $state(false);
    let isHovered = $state(false);
    let printableKeyName = $state<string | undefined>(undefined);
    let lookupErrorMessage = $state<string | null>(null);
    let lookupRevision = $state(0);
    let lookupRequestId = 0;
    let listenSessionId = 0;

    const hasKey = $derived(
        setting.value !== UNKNOWN_KEY && printableKeyName !== undefined,
    );

    $effect(() => {
        lookupRevision;

        if (isListening) {
            return;
        }

        const key = setting.value;
        if (key === UNKNOWN_KEY) {
            printableKeyName = undefined;
            lookupErrorMessage = null;
            return;
        }

        const requestId = ++lookupRequestId;
        printableKeyName = key;
        lookupErrorMessage = null;

        getPrintableKeyName(key)
            .then((printableKey) => {
                if (requestId !== lookupRequestId) {
                    return;
                }

                printableKeyName = printableKey.localized;
                lookupErrorMessage = null;
            })
            .catch((error) => {
                if (requestId !== lookupRequestId) {
                    return;
                }

                printableKeyName = key;
                lookupErrorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to resolve printable key name.";
            });
    });

    onDestroy(() => {
        listenSessionId += 1;
    });

    const nextKeyEvent = () =>
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
            commitKey(UNKNOWN_KEY);
            stopListening();
            return;
        }

        await startListening();
    }

    async function startListening() {
        isListening = true;
        const sessionId = ++listenSessionId;

        try {
            const event = await nextKeyEvent();
            if (!isListening || sessionId !== listenSessionId) {
                return;
            }

            if ("keyCode" in event && event.keyCode === 256) {
                commitKey(UNKNOWN_KEY);
            } else {
                commitKey(event.key);
            }
        } catch {
            if (sessionId !== listenSessionId) {
                return;
            }
        } finally {
            if (sessionId === listenSessionId) {
                stopListening();
            }
        }
    }

    function stopListening() {
        isListening = false;
        listenSessionId += 1;
    }

    function commitKey(nextValue: string) {
        if (setting.value === nextValue) {
            return;
        }

        onChange(nextValue);
    }

    function retryPrintableKeyLookup() {
        if (isListening) {
            return;
        }

        const key = setting.value;
        if (key === UNKNOWN_KEY) {
            return;
        }

        clearPrintableKeyNameLookup(key);
        lookupErrorMessage = null;
        lookupRevision += 1;
    }
</script>

<div class="setting-input-shell" use:revealBorder>
    <button
        class="setting-input-control key-setting-control"
        class:key-setting-control--listening={isListening}
        type="button"
        onmouseenter={() => (isHovered = true)}
        onmouseleave={() => (isHovered = false)}
        onclick={toggleListening}
        use:revealItem={revealItemOptions}
    >
        <span class="reveal-press-content">
            {#if !isListening}
                {#if hasKey}
                    <span class="key-setting-key">{printableKeyName}</span>
                {:else}
                    <span class="key-setting-none">None</span>
                {/if}
            {:else}
                <span class="key-setting-listening">Press any key...</span>
            {/if}
        </span>
    </button>

    {#if lookupErrorMessage !== null && !isListening}
        <div class="key-setting-lookup-status" role="status" aria-live="polite">
            <span class="key-setting-lookup-error" title={lookupErrorMessage}>
                Key name lookup failed.
            </span>
            <button
                class="key-setting-lookup-retry"
                type="button"
                onclick={retryPrintableKeyLookup}
            >
                Retry
            </button>
        </div>
    {/if}
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .key-setting-control {
        cursor: pointer;
        --reveal-focus-color: var(--clickgui-accent-color, #{$accent-color});
        --setting-control-border-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.36
        );
        --setting-control-background-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.18
        );
        --setting-control-padding-inline: 10px;
        --setting-control-min-width: 108px;
    }

    .key-setting-control.key-setting-control--listening {
        --setting-control-border-color: var(
            --clickgui-accent-color,
            #{$accent-color}
        );
        --setting-control-background-color: rgb(
            var(--clickgui-accent-rgb, 70 119 255) / 0.2
        );
    }

    .key-setting-key {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: rgba($clickgui-text-color, 0.96);
    }

    .key-setting-none {
        color: rgba($clickgui-text-dimmed-color, 0.9);
        font-size: 11px;
        letter-spacing: 0.03em;
    }

    .key-setting-listening {
        color: rgba($clickgui-text-color, 0.96);
        font-size: 11px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .key-setting-lookup-status {
        margin-top: 6px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .key-setting-lookup-error {
        font-size: 10px;
        color: rgba($clickgui-text-color, 0.74);
    }

    .key-setting-lookup-retry {
        appearance: none;
        border: 1px solid rgba($clickgui-text-color, 0.36);
        background-color: rgba($clickgui-text-color, 0.12);
        color: rgba($clickgui-text-color, 0.9);
        font-size: 10px;
        line-height: 1;
        padding: 3px 6px;
        cursor: pointer;

        &:hover {
            border-color: rgba($clickgui-text-color, 0.55);
            background-color: rgba($clickgui-text-color, 0.2);
        }
    }
</style>
