<script lang="ts">
    import type { GroupedModules, Module } from "../../../integration/types";
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

    export let filteredCategoryNames: string[] = [];
    export let filteredGrouped: GroupedModules = {};
    export let subsectionRevealOptions: RevealContainerOptions;
    export let moduleRevealItemOptions: RevealItemOptions;
    export let modulePrimaryInteraction: ClickGuiModulePrimaryInteraction =
        "open-config";
    export let showModuleRowActions = true;
    export let moduleAccentMode: ClickGuiModuleAccentMode = "action-toggle";
    export let togglePendingByName: Record<string, boolean> = {};
    export let onOpenModuleConfig: (module: Module) => void = () => {};
    export let onToggleModule: (module: Module) => void = () => {};
    export let onOpenThemeSettings: () => void = () => {};

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

    function handleThemeSettingsContextMenu(event: MouseEvent): void {
        event.preventDefault();
        onOpenThemeSettings();
    }
</script>

<div class="section">
    <div class="section-title">Click GUI</div>

    {#if filteredCategoryNames.length === 0}
        <div class="empty">No matching modules</div>
    {:else}
        {#each filteredCategoryNames as categoryName}
            <div class="subsection">
                <div class="subsection-title">{categoryName}</div>
                <ul
                    class="item-list click-gui-list"
                    use:revealContainer={subsectionRevealOptions}
                >
                    {#each filteredGrouped[categoryName] ?? [] as module (`${categoryName}:${module.name}`)}
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
            </div>
        {/each}
    {/if}
</div>

<div class="section">
    <div class="section-title">Theme Settings</div>
    <ul class="item-list" use:revealContainer={subsectionRevealOptions}>
        <li class="item btn-border" use:revealBorder>
            <button
                class="btn"
                type="button"
                onclick={onOpenThemeSettings}
                oncontextmenu={handleThemeSettingsContextMenu}
                use:revealItem={moduleRevealItemOptions}
            >
                <span class="reveal-press-content">
                    Theme Settings
                </span>
            </button>
        </li>
    </ul>
</div>

<style lang="scss">
    @use "./shared.scss" as shared;

    @include shared.section-block;
    @include shared.subsection-block;
    @include shared.interactive-list-block;
    @include shared.module-item-block;
    @include shared.module-row-block;
    @include shared.empty-block;
    @include shared.reveal-hover-overlay-block;
</style>
