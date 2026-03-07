<script lang="ts">
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import {
        browsePath,
        openFileDialog,
    } from "../../../integration/rest";
    import type { FileSetting } from "../../../integration/types";

    interface Props {
        setting: FileSetting;
        onChange?: (value: string) => void;
        revealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: string) => {};

    let {
        setting,
        onChange = defaultChangeHandler,
        revealItemOptions,
    }: Props = $props();

    let selecting = $state(false);
    let errorMessage = $state<string | null>(null);

    const hasSelectedFile = $derived(setting.value.trim().length > 0);
    const displayValue = $derived(
        hasSelectedFile ? setting.value : "<empty>",
    );

    function setFileValue(nextValue: string) {
        if (setting.value === nextValue) {
            return;
        }

        onChange(nextValue);
    }

    async function selectFile() {
        if (selecting) {
            return;
        }

        selecting = true;
        errorMessage = null;

        try {
            const fileSelection = await openFileDialog({
                mode: setting.dialogMode,
                supportedExtensions: setting.supportedExtensions,
            });

            if (fileSelection.file === undefined) {
                return;
            }

            if (typeof fileSelection.file !== "string") {
                throw new Error(
                    `FILE setting "${setting.name}" returned a non-string file selection (${typeof fileSelection.file}).`,
                );
            }

            setFileValue(fileSelection.file);
        } catch (error) {
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to select file.";
        } finally {
            selecting = false;
        }
    }

    function resetFile() {
        setFileValue("");
    }

    async function openInFileBrowser() {
        if (!hasSelectedFile) {
            return;
        }

        errorMessage = null;

        try {
            await browsePath(setting.value);
        } catch (error) {
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to open selected path.";
        }
    }
</script>

<div class="setting-input-shell setting-input-shell--block file-setting-shell">
    <div class="file-setting-layout">
        <div class="file-select-shell" use:revealBorder>
            <button
                class="setting-input-control setting-input-control--block file-select-btn"
                type="button"
                title={displayValue}
                onclick={selectFile}
                use:revealItem={revealItemOptions}
            >
                <span class="reveal-press-content">
                    <span class="file-select-value">{displayValue}</span>
                </span>
            </button>
        </div>

        {#if hasSelectedFile}
            <div class="file-action-shell" use:revealBorder>
                <button
                    class="setting-input-control file-action-btn"
                    type="button"
                    aria-label="Reset selected file"
                    onclick={resetFile}
                    use:revealItem={revealItemOptions}
                >
                    <span class="reveal-press-content">Reset</span>
                </button>
            </div>

            <div class="file-action-shell" use:revealBorder>
                <button
                    class="setting-input-control file-action-btn"
                    type="button"
                    aria-label="Open selected file path"
                    onclick={openInFileBrowser}
                    use:revealItem={revealItemOptions}
                >
                    <span class="reveal-press-content">Open</span>
                </button>
            </div>
        {/if}
    </div>

    {#if selecting}
        <p class="file-status-hint">Opening file dialog...</p>
    {:else if errorMessage !== null}
        <p class="file-status-hint file-status-hint--error" role="alert">
            {errorMessage}
        </p>
    {/if}
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .file-setting-shell {
        width: 100%;
    }

    .file-setting-layout {
        display: grid;
        width: 100%;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 6px;
        align-items: stretch;
    }

    .file-select-shell {
        min-width: 0;
    }

    .file-select-btn {
        width: 100%;
        --reveal-focus-color: #{$accent-color};
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.3)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.08)};
    }

    .file-select-btn > .reveal-press-content {
        width: 100%;
        min-width: 0;
    }

    .file-select-value {
        display: inline-block;
        width: 100%;
        min-width: 0;
        text-align: left;
        padding: 0 10px;
        font-size: 11px;
        font-family: monospace;
        color: rgba($clickgui-text-dimmed-color, 0.94);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        direction: rtl;
    }

    .file-action-btn {
        --reveal-focus-color: #{$accent-color};
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.32)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.12)};
        --setting-control-padding-inline: 10px;
        cursor: pointer;
    }

    .file-action-btn > .reveal-press-content {
        font-size: 10px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba($clickgui-text-dimmed-color, 0.95);
    }

    .file-status-hint {
        margin: 6px 0 0;
        font-size: 10px;
        letter-spacing: 0.03em;
        color: rgba($clickgui-text-dimmed-color, 0.88);
    }

    .file-status-hint--error {
        color: rgba($clickgui-text-color, 0.9);
    }
</style>
