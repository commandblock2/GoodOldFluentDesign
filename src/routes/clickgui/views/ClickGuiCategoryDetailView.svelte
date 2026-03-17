<script lang="ts">
    import type { Module } from "../../../integration/types";
    import {
        revealBorder,
        revealContainer,
        revealItem,
        type RevealContainerOptions,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import type {
        ClickGuiModuleAccentMode,
        ClickGuiModulePrimaryInteraction,
    } from "../clickGuiThemePreferences";

    export let selectedCategory = "";
    export let selectedCategoryModules: Module[] = [];
    export let subsectionRevealOptions: RevealContainerOptions;
    export let moduleRevealItemOptions: RevealItemOptions;
    export let modulePrimaryInteraction: ClickGuiModulePrimaryInteraction =
        "open-config";
    export let showModuleRowActions = true;
    export let moduleAccentMode: ClickGuiModuleAccentMode = "action-toggle";
    export let togglePendingByName: Record<string, boolean> = {};
    export let onCloseDetailView: () => void = () => {};
    export let onOpenModuleConfig: (module: Module) => void = () => {};
    export let onToggleModule: (module: Module) => void = () => {};

    const configIconPath = "/img/menu/icon-options.svg";
    const moduleActionRevealItemOptions: RevealItemOptions = {
        ...moduleRevealItemOptions,
        border: true,
    };

    function getModuleRowTitle(): string {
        return modulePrimaryInteraction === "open-config"
            ? "Left click opens settings. Right click toggles the module."
            : "Left click toggles the module. Right click opens settings.";
    }

    function getToggleIconPath(module: Module): string {
        return module.enabled
            ? "/img/clickgui/icon-tick-checked.svg"
            : "/img/clickgui/icon-tick.svg";
    }

    function handleModuleRowClick(module: Module): void {
        if (modulePrimaryInteraction === "open-config") {
            onOpenModuleConfig(module);
            return;
        }

        onToggleModule(module);
    }

    function handleModuleRowContextMenu(
        event: MouseEvent,
        module: Module,
    ): void {
        event.preventDefault();

        if (modulePrimaryInteraction === "open-config") {
            onToggleModule(module);
            return;
        }

        onOpenModuleConfig(module);
    }

    function handleCloseDetailViewContextMenu(event: MouseEvent): void {
        event.preventDefault();
        onCloseDetailView();
    }
</script>

<div class="category-page" use:revealContainer={subsectionRevealOptions}>
    <div class="category-back-shell">
        <div class="item btn-border category-back-control" use:revealBorder>
            <button
                class="btn category-back-btn"
                type="button"
                onclick={onCloseDetailView}
                oncontextmenu={handleCloseDetailViewContextMenu}
                use:revealItem={moduleRevealItemOptions}
            >
                <span class="reveal-press-content">
                    &lt; {selectedCategory}
                </span>
            </button>
        </div>
    </div>

    {#if selectedCategoryModules.length === 0}
        <div class="empty">No modules in this category</div>
    {:else}
        <ul class="item-list click-gui-list">
            {#each selectedCategoryModules as module}
                <li
                    class="item module-item btn-border module-row-shell"
                    class:module-row-shell--enabled={module.enabled}
                    class:module-row-shell--accent-tile={moduleAccentMode ===
                        "tile-background"}
                    class:module-row-shell--accent-toggle={moduleAccentMode ===
                        "action-toggle"}
                    class:module-row-shell--accent-text={moduleAccentMode ===
                        "text-only"}
                    class:module-row-shell--actions-hidden={!showModuleRowActions}
                    use:revealBorder
                >
                    <button
                        class="btn module-row-main"
                        type="button"
                        title={getModuleRowTitle()}
                        onclick={() => handleModuleRowClick(module)}
                        oncontextmenu={(event) =>
                            handleModuleRowContextMenu(event, module)}
                        use:revealItem={moduleRevealItemOptions}
                    >
                        <span class="reveal-press-content">
                            {module.name}
                        </span>
                    </button>

                    {#if showModuleRowActions}
                        <div class="module-row-actions">
                            <div class="module-row-action-shell" use:revealBorder>
                                <button
                                    class="module-row-action"
                                    class:module-row-action--toggle-active={module.enabled}
                                    type="button"
                                    title={module.enabled
                                        ? "Disable module"
                                        : "Enable module"}
                                    aria-label={module.enabled
                                        ? `Disable ${module.name}`
                                        : `Enable ${module.name}`}
                                    disabled={togglePendingByName[module.name] === true}
                                    onclick={() => onToggleModule(module)}
                                    use:revealItem={moduleActionRevealItemOptions}
                                >
                                    <span class="reveal-press-content">
                                        <img
                                            class="module-row-action-icon"
                                            src={getToggleIconPath(module)}
                                            alt=""
                                            aria-hidden="true"
                                        />
                                    </span>
                                </button>
                            </div>

                            <div class="module-row-action-shell" use:revealBorder>
                                <button
                                    class="module-row-action"
                                    type="button"
                                    title="Open settings"
                                    aria-label={`Open ${module.name} settings`}
                                    onclick={() => onOpenModuleConfig(module)}
                                    use:revealItem={moduleActionRevealItemOptions}
                                >
                                    <span class="reveal-press-content">
                                        <img
                                            class="module-row-action-icon"
                                            src={configIconPath}
                                            alt=""
                                            aria-hidden="true"
                                        />
                                    </span>
                                </button>
                            </div>
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style lang="scss">
    @use "./shared.scss" as shared;

    @include shared.category-page-block;
    @include shared.interactive-list-block;
    @include shared.category-back-button-block;
    @include shared.module-item-block;
    @include shared.module-row-block;
    @include shared.empty-block;
    @include shared.reveal-hover-overlay-block;

    .category-back-shell {
        position: sticky;
        top: -10px;
        z-index: 2;
        margin: 0 -10px 0;
        padding: 20px 10px 6px;
        background: var(--clickgui-surface-strong-color);
        border-bottom: 1px solid rgb(var(--clickgui-text-rgb, 255 255 255) / 0.24);
        backdrop-filter: blur(8px) saturate(125%);
        box-shadow: 0 10px 16px rgb(var(--clickgui-base-rgb, 0 0 0) / 0.32);
        transition:
            background-color 140ms ease,
            border-color 140ms ease,
            backdrop-filter 140ms ease,
            box-shadow 140ms ease;
    }

    .category-back-control {
        display: flex;
    }
</style>
