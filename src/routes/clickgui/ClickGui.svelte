<script lang="ts">
    import type {
        ConfigurableSetting,
        GroupedModules,
        InputBind,
        Module,
        ModuleSetting,
        Range,
    } from "../../integration/types";
    import { onMount } from "svelte";
    import type {
        RevealContainerOptions,
        RevealItemOptions,
    } from "fluent-reveal-svelte";
    import { revealContainer } from "fluent-reveal-svelte";
    import {
        getModuleSettings,
        getModules,
        setModuleSettings,
    } from "../../integration/rest";
    import { groupByCategory } from "../../integration/util";
    import ClickGuiCategoryDetailView from "./views/ClickGuiCategoryDetailView.svelte";
    import ClickGuiHomeView from "./views/ClickGuiHomeView.svelte";
    import ClickGuiSearchView from "./views/ClickGuiSearchView.svelte";
    import ClickGuiThemeDetailView from "./views/ClickGuiThemeDetailView.svelte";
    import SettingEntry from "./setting/SettingEntry.svelte";
    import {
        getBounds,
        normalizeRangeValue,
        normalizeSingleValue,
    } from "./setting/numericSettingUtils";
    import {
        isBooleanSetting,
        isBindSetting,
        isColorSetting,
        isChooseSetting,
        isFloatRangeSetting,
        isFloatSetting,
        isIntRangeSetting,
        isIntSetting,
        isMultiChooseSetting,
        isNestedSettingContainer,
        isTextSetting,
    } from "./setting/settingTypeGuards";

    let categories = $state<GroupedModules>({});
    let modules = $state<Module[]>([]);
    let searchQuery = $state("");
    let selectedCategory = $state<string | null>(null);
    let selectedThemeSettings = $state(false);
    let activeConfigPage = $state<{
        type: "clickgui" | "quick-settings" | "theme-settings" | "module";
        moduleName: string | null;
    }>({
        type: "clickgui",
        moduleName: null,
    });
    let activeConfigurable = $state<ConfigurableSetting | null>(null);
    let activeConfigError = $state<string | null>(null);
    let activeConfigLoading = $state(false);
    let moduleSettingsRequestId = 0;
    // TODO: wire this from theme settings.
    let settingsSplitCount = $state(1);
    let settingHeights = $state<Record<number, number>>({});

    const sortByName = (a: string, b: string) => a.localeCompare(b);

    const subsectionRevealOptions: RevealContainerOptions = {
        border: {
            radius: 48,
            color: "rgba(255,255,255,0.6)",
            fadeStopPct: 100,
            transitionMs: 120,
        },
        hover: {
            color: "rgba(255,255,255,0.3)",
        },
        focus: {
            enabled: true,
            color: "rgba(255,255,255,0.62)",
            widthPx: 1,
            offsetPx: 2,
            glowPx: 10,
        },
        click: {
            color: "rgba(255,255,255,0.3)",
            ripple: {
                enabled: true,
                durationMs: 1000,
                sizePx: 48,
            },
        },
    };

    const moduleRevealItemOptions: RevealItemOptions = {
        border: true,
        hover: true,
        click: true,
    };
    const textInputRevealItemOptions: RevealItemOptions = {
        border: true,
        hover: false,
        click: false,
    };

    const normalizedQuery = $derived(searchQuery.trim().toLowerCase());
    const isSearching = $derived(normalizedQuery.length > 0);
    const categoryNames = $derived(Object.keys(categories).sort(sortByName));
    const filteredModules = $derived(
        isSearching
            ? modules.filter((module) =>
                  moduleMatchesQuery(module, normalizedQuery),
              )
            : [],
    );
    const filteredGrouped = $derived(
        isSearching ? groupByCategory(filteredModules) : {},
    );
    const filteredCategoryNames = $derived(
        Object.keys(filteredGrouped).sort(sortByName),
    );
    const selectedCategoryModules = $derived(
        selectedCategory === null
            ? []
            : [...(categories[selectedCategory] ?? [])].sort((a, b) =>
                  sortByName(a.name, b.name),
              ),
    );
    const isDetailView = $derived(
        selectedCategory !== null || selectedThemeSettings,
    );
    const activeConfigPayloadJson = $derived(
        JSON.stringify(
            activeConfigError !== null
                ? {
                      status: "error",
                      page: activeConfigPage.type,
                      moduleName: activeConfigPage.moduleName,
                      message: activeConfigError,
                  }
                : activeConfigLoading
                  ? {
                        status: "loading",
                        page: activeConfigPage.type,
                        moduleName: activeConfigPage.moduleName,
                    }
                  : activeConfigurable ?? {
                        page: activeConfigPage.type,
                        moduleName: activeConfigPage.moduleName,
                    },
            null,
            2,
        ),
    );
    const activeConfigTitle = $derived(
        activeConfigPage.type === "module" && activeConfigPage.moduleName !== null
            ? activeConfigPage.moduleName
            : activeConfigPage.type === "quick-settings"
              ? "Quick Settings"
              : activeConfigPage.type === "theme-settings"
                ? "Theme Settings"
                : "Click GUI",
    );
    const activeModuleDescription = $derived(
        activeConfigPage.type !== "module" || activeConfigPage.moduleName === null
            ? ""
            : modules.find(
                  (module) => module.name === activeConfigPage.moduleName,
              )?.description ?? "",
    );
    const activeModuleLoadError = $derived(
        activeConfigPage.type === "module" &&
            activeConfigurable === null &&
            activeConfigError !== null
            ? activeConfigError
            : null,
    );
    const activeModuleSettings = $derived(activeConfigurable?.value ?? []);
    const settingsColumnCount = $derived(Math.max(1, settingsSplitCount + 1));
    const settingsColumns = $derived(
        (() => {
            const columns = Array.from(
                { length: settingsColumnCount },
                () => [] as { setting: ModuleSetting; settingIndex: number }[],
            );
            const columnHeights = Array.from(
                { length: settingsColumnCount },
                () => 0,
            );

            activeModuleSettings.forEach((setting, settingIndex) => {
                let targetColumn = 0;

                for (let i = 1; i < settingsColumnCount; i++) {
                    if (columnHeights[i] < columnHeights[targetColumn]) {
                        targetColumn = i;
                    }
                }

                columns[targetColumn].push({ setting, settingIndex });
                columnHeights[targetColumn] +=
                    settingHeights[settingIndex] ?? estimateSettingHeight(setting);
            });

            return columns;
        })(),
    );

    onMount(async () => {
        modules = await getModules();
        categories = groupByCategory(modules);
    });

    function moduleMatchesQuery(module: Module, query: string) {
        const haystack = [
            module.name,
            module.category,
            module.description,
            module.tag ?? "",
            ...module.aliases,
        ]
            .join(" ")
            .toLowerCase();

        return haystack.includes(query);
    }

    function openCategory(categoryName: string) {
        selectedCategory = categoryName;
        selectedThemeSettings = false;
    }

    function openQuickSettings() {
        selectedCategory = null;
        selectedThemeSettings = false;
        activeConfigPage = {
            type: "quick-settings",
            moduleName: null,
        };
        activeConfigurable = null;
        activeConfigError = null;
        activeConfigLoading = false;
    }

    function openThemeSettings() {
        selectedCategory = null;
        selectedThemeSettings = true;
        searchQuery = "";
        activeConfigPage = {
            type: "theme-settings",
            moduleName: null,
        };
        activeConfigurable = null;
        activeConfigError = null;
        activeConfigLoading = false;
    }

    function closeDetailView() {
        selectedCategory = null;
        selectedThemeSettings = false;
    }

    async function openModuleConfig(module: Module) {
        const requestId = ++moduleSettingsRequestId;

        activeConfigPage = {
            type: "module",
            moduleName: module.name,
        };
        activeConfigurable = null;
        activeConfigError = null;
        activeConfigLoading = true;

        try {
            const configurable = await getModuleSettings(module.name);

            if (requestId !== moduleSettingsRequestId) {
                return;
            }

            activeConfigurable = configurable;
            activeConfigLoading = false;
        } catch (error) {
            if (requestId !== moduleSettingsRequestId) {
                return;
            }

            activeConfigError =
                error instanceof Error
                    ? error.message
                    : "Failed to load module settings.";
            activeConfigLoading = false;
        }
    }

    async function retryActiveModuleConfigLoad() {
        if (
            activeConfigPage.type !== "module" ||
            activeConfigPage.moduleName === null
        ) {
            return;
        }

        const module = modules.find(
            (nextModule) => nextModule.name === activeConfigPage.moduleName,
        );

        if (module === undefined) {
            activeConfigError = "Module is no longer available.";
            activeConfigLoading = false;
            return;
        }

        await openModuleConfig(module);
    }

    type SettingMapper = (setting: ModuleSetting) => ModuleSetting;

    function mapSettingTree(
        settings: ModuleSetting[],
        path: number[],
        mapper: SettingMapper,
    ): ModuleSetting[] {
        if (path.length === 0) {
            return settings;
        }

        const [targetIndex, ...restPath] = path;
        const targetSetting = settings[targetIndex];

        if (targetSetting === undefined) {
            return settings;
        }

        if (restPath.length === 0) {
            const nextTargetSetting = mapper(targetSetting);

            if (nextTargetSetting === targetSetting) {
                return settings;
            }

            const nextSettings = [...settings];
            nextSettings[targetIndex] = nextTargetSetting;
            return nextSettings;
        }

        if (!isNestedSettingContainer(targetSetting)) {
            return settings;
        }

        const nextNestedSettings = mapSettingTree(
            targetSetting.value,
            restPath,
            mapper,
        );

        if (nextNestedSettings === targetSetting.value) {
            return settings;
        }

        const nextSettings = [...settings];
        nextSettings[targetIndex] = {
            ...targetSetting,
            value: nextNestedSettings,
        };
        return nextSettings;
    }

    async function updateActiveModuleSettings(
        settingPath: number[],
        mapper: SettingMapper,
        errorMessage: string,
    ) {
        if (
            activeConfigPage.type !== "module" ||
            activeConfigPage.moduleName === null ||
            activeConfigurable === null
        ) {
            return;
        }

        const moduleName = activeConfigPage.moduleName;
        const previousConfigurable = activeConfigurable;
        const nextConfigurable = {
            ...previousConfigurable,
            value: mapSettingTree(
                previousConfigurable.value,
                settingPath,
                mapper,
            ),
        };

        if (nextConfigurable.value === previousConfigurable.value) {
            return;
        }

        activeConfigurable = nextConfigurable;
        activeConfigError = null;

        try {
            await setModuleSettings(moduleName, nextConfigurable);
        } catch (error) {
            if (
                activeConfigPage.type !== "module" ||
                activeConfigPage.moduleName !== moduleName
            ) {
                return;
            }

            activeConfigurable = previousConfigurable;
            activeConfigError =
                error instanceof Error
                    ? error.message
                    : errorMessage;
        }
    }

    async function onBooleanSettingChange(
        settingPath: number[],
        checked: boolean,
    ) {
        await updateActiveModuleSettings(
            settingPath,
            (setting) => {
                if (!isBooleanSetting(setting) || setting.value === checked) {
                    return setting;
                }

                return {
                    ...setting,
                    value: checked,
                };
            },
            "Failed to update boolean setting.",
        );
    }

    async function onTextSettingChange(
        settingPath: number[],
        nextValue: string,
    ) {
        await updateActiveModuleSettings(
            settingPath,
            (setting) => {
                if (!isTextSetting(setting) || setting.value === nextValue) {
                    return setting;
                }

                return {
                    ...setting,
                    value: nextValue,
                };
            },
            "Failed to update text setting.",
        );
    }

    async function onBindSettingChange(
        settingPath: number[],
        nextValue: InputBind,
    ) {
        await updateActiveModuleSettings(
            settingPath,
            (setting) => {
                if (!isBindSetting(setting)) {
                    return setting;
                }

                const current = setting.value;
                const currentModifiers = Array.isArray(current.modifiers)
                    ? current.modifiers
                    : [];
                const unchanged =
                    current.boundKey === nextValue.boundKey &&
                    current.action === nextValue.action &&
                    currentModifiers.length === nextValue.modifiers.length &&
                    currentModifiers.every(
                        (modifier, index) =>
                            modifier === nextValue.modifiers[index],
                    );

                if (unchanged) {
                    return setting;
                }

                return {
                    ...setting,
                    value: nextValue,
                };
            },
            "Failed to update bind setting.",
        );
    }

    async function onColorSettingChange(
        settingPath: number[],
        nextValue: number,
    ) {
        await updateActiveModuleSettings(
            settingPath,
            (setting) => {
                if (!isColorSetting(setting) || setting.value === nextValue) {
                    return setting;
                }

                return {
                    ...setting,
                    value: nextValue,
                };
            },
            "Failed to update color setting.",
        );
    }

    async function onChooseSettingChange(
        settingPath: number[],
        nextChoice: string,
    ) {
        await updateActiveModuleSettings(
            settingPath,
            (setting) => {
                if (!isChooseSetting(setting)) {
                    return setting;
                }

                if (setting.value === nextChoice) {
                    return setting;
                }

                return {
                    ...setting,
                    value: nextChoice,
                };
            },
            "Failed to update choose setting.",
        );
    }

    async function onMultiChooseSettingChange(
        settingPath: number[],
        nextChoices: string[],
    ) {
        await updateActiveModuleSettings(
            settingPath,
            (setting) => {
                if (!isMultiChooseSetting(setting)) {
                    return setting;
                }

                return {
                    ...setting,
                    value: nextChoices,
                };
            },
            "Failed to update multi choose setting.",
        );
    }

    async function onNumberSettingChange(
        settingPath: number[],
        nextValue: number,
    ) {
        await updateActiveModuleSettings(
            settingPath,
            (setting) => {
                if (isFloatSetting(setting)) {
                    const normalized = normalizeSingleValue(
                        nextValue,
                        getBounds(setting.range),
                        false,
                    );

                    if (normalized === setting.value) {
                        return setting;
                    }

                    return {
                        ...setting,
                        value: normalized,
                    };
                }

                if (isIntSetting(setting)) {
                    const normalized = normalizeSingleValue(
                        nextValue,
                        getBounds(setting.range),
                        true,
                    );

                    if (normalized === setting.value) {
                        return setting;
                    }

                    return {
                        ...setting,
                        value: normalized,
                    };
                }

                return setting;
            },
            "Failed to update numeric setting.",
        );
    }

    async function onNumberRangeSettingChange(
        settingPath: number[],
        nextValue: Range,
    ) {
        await updateActiveModuleSettings(
            settingPath,
            (setting) => {
                if (isFloatRangeSetting(setting)) {
                    const normalized = normalizeRangeValue(
                        nextValue,
                        getBounds(setting.range),
                        false,
                    );

                    if (
                        normalized.from === setting.value.from &&
                        normalized.to === setting.value.to
                    ) {
                        return setting;
                    }

                    return {
                        ...setting,
                        value: normalized,
                    };
                }

                if (isIntRangeSetting(setting)) {
                    const normalized = normalizeRangeValue(
                        nextValue,
                        getBounds(setting.range),
                        true,
                    );

                    if (
                        normalized.from === setting.value.from &&
                        normalized.to === setting.value.to
                    ) {
                        return setting;
                    }

                    return {
                        ...setting,
                        value: normalized,
                    };
                }

                return setting;
            },
            "Failed to update numeric range setting.",
        );
    }

    function estimateSettingHeight(setting: ModuleSetting): number {
        if (isBooleanSetting(setting)) {
            return 64;
        }

        if (isTextSetting(setting)) {
            return 88;
        }

        if (isBindSetting(setting)) {
            return 64;
        }

        if (isColorSetting(setting)) {
            return 64;
        }

        if (isChooseSetting(setting)) {
            return 126;
        }

        if (isMultiChooseSetting(setting)) {
            return 136 + Math.ceil(setting.choices.length / 4) * 28;
        }

        if (isFloatSetting(setting) || isIntSetting(setting)) {
            return 108;
        }

        if (isFloatRangeSetting(setting) || isIntRangeSetting(setting)) {
            return 136;
        }

        if (isNestedSettingContainer(setting)) {
            const nestedHeights = setting.value.reduce<number>(
                (height, nestedSetting) =>
                    height + estimateSettingHeight(nestedSetting),
                0,
            );

            return (
                54 +
                nestedHeights +
                Math.max(0, setting.value.length - 1) * 10
            );
        }

        const valueLength = JSON.stringify(setting.value).length;
        return 90 + Math.min(240, Math.ceil(valueLength / 42) * 18);
    }

    function trackSettingHeight(node: HTMLElement, settingIndex: number) {
        let activeIndex = settingIndex;
        let resizeObserver: ResizeObserver | null = null;

        const writeHeight = () => {
            const nextHeight = Math.ceil(node.getBoundingClientRect().height);

            if (settingHeights[activeIndex] === nextHeight) {
                return;
            }

            settingHeights = {
                ...settingHeights,
                [activeIndex]: nextHeight,
            };
        };

        const clearHeight = (index: number) => {
            if (settingHeights[index] === undefined) {
                return;
            }

            const nextHeights = { ...settingHeights };
            delete nextHeights[index];
            settingHeights = nextHeights;
        };

        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(writeHeight);
            resizeObserver.observe(node);
        }

        requestAnimationFrame(writeHeight);

        return {
            update(nextIndex: number) {
                if (nextIndex === activeIndex) {
                    writeHeight();
                    return;
                }

                clearHeight(activeIndex);
                activeIndex = nextIndex;
                writeHeight();
            },
            destroy() {
                resizeObserver?.disconnect();
                clearHeight(activeIndex);
            },
        };
    }

    function scrollbarHoverSurface(node: HTMLElement) {
        const scrollbarAreaWidth = 14;

        let lastPointerX = 0;
        let lastPointerY = 0;
        let rafId = 0;

        const hasVerticalOverflow = () => node.scrollHeight > node.clientHeight + 1;
        const applyScrollState = () => {
            node.classList.toggle("surface-scrolled", node.scrollTop > 0);
        };

        const applyState = () => {
            rafId = 0;
            applyScrollState();

            if (!hasVerticalOverflow()) {
                node.classList.remove("scrollbar-strong");
                return;
            }

            const rect = node.getBoundingClientRect();
            const insideSurface =
                lastPointerX >= rect.left &&
                lastPointerX <= rect.right &&
                lastPointerY >= rect.top &&
                lastPointerY <= rect.bottom;

            if (!insideSurface) {
                node.classList.remove("scrollbar-strong");
                return;
            }

            const isInScrollbarArea =
                lastPointerX >= rect.right - scrollbarAreaWidth &&
                lastPointerX <= rect.right;

            node.classList.toggle("scrollbar-strong", isInScrollbarArea);
        };

        const scheduleApplyState = () => {
            if (rafId !== 0) {
                return;
            }

            rafId = requestAnimationFrame(applyState);
        };

        const onPointerMove = (event: PointerEvent) => {
            lastPointerX = event.clientX;
            lastPointerY = event.clientY;
            scheduleApplyState();
        };

        const onPointerLeave = () => {
            node.classList.remove("scrollbar-strong");
        };

        const onScroll = () => {
            applyScrollState();
            scheduleApplyState();
        };

        const resizeObserver = new ResizeObserver(() => {
            applyScrollState();
            scheduleApplyState();
        });
        resizeObserver.observe(node);

        applyScrollState();
        scheduleApplyState();

        node.addEventListener("pointermove", onPointerMove);
        node.addEventListener("pointerleave", onPointerLeave);
        node.addEventListener("scroll", onScroll);

        return {
            destroy() {
                resizeObserver.disconnect();
                node.removeEventListener("pointermove", onPointerMove);
                node.removeEventListener("pointerleave", onPointerLeave);
                node.removeEventListener("scroll", onScroll);

                if (rafId !== 0) {
                    cancelAnimationFrame(rafId);
                }

                node.classList.remove("scrollbar-strong");
                node.classList.remove("surface-scrolled");
            },
        };
    }
</script>

<div class="clickgui">
    <aside class="sidebar scroll-surface" use:scrollbarHoverSurface>
        {#if !isDetailView}
            <div class="search">
                <input
                    class="search-input"
                    type="text"
                    placeholder="Search"
                    bind:value={searchQuery}
                />
            </div>
        {/if}

        {#if selectedCategory !== null}
            <ClickGuiCategoryDetailView
                {selectedCategory}
                {selectedCategoryModules}
                {subsectionRevealOptions}
                {moduleRevealItemOptions}
                onCloseDetailView={closeDetailView}
                onOpenModuleConfig={openModuleConfig}
            />
        {:else if selectedThemeSettings}
            <ClickGuiThemeDetailView
                {subsectionRevealOptions}
                {moduleRevealItemOptions}
                onCloseDetailView={closeDetailView}
            />
        {:else if isSearching}
            <ClickGuiSearchView
                {filteredCategoryNames}
                {filteredGrouped}
                {subsectionRevealOptions}
                {moduleRevealItemOptions}
                onOpenThemeSettings={openThemeSettings}
                onOpenModuleConfig={openModuleConfig}
            />
        {:else}
            <ClickGuiHomeView
                {categoryNames}
                {subsectionRevealOptions}
                {moduleRevealItemOptions}
                onOpenCategory={openCategory}
                onOpenThemeSettings={openThemeSettings}
                onOpenQuickSettings={openQuickSettings}
            />
        {/if}
    </aside>

    <section
        class="main-content scroll-surface"
        use:scrollbarHoverSurface
        use:revealContainer={subsectionRevealOptions}
    >
        <div class="main-content-header">
            <h2 class="main-content-title">{activeConfigTitle}</h2>

            {#if activeModuleDescription.trim().length > 0}
                <p class="main-content-description">
                    {activeModuleDescription}
                </p>
            {/if}
        </div>

        <div class="main-content-search">
            <input
                class="settings-search-input"
                type="text"
                placeholder="Search settings..."
            />
        </div>

        {#if activeConfigPage.type === "module" && activeConfigurable !== null}
            <div class="settings-split-layout">
                {#each settingsColumns as column, columnIndex (columnIndex)}
                    <div class="settings-column">
                        {#each column as item (item.settingIndex)}
                            <div
                                class="setting-entry-shell"
                                use:trackSettingHeight={item.settingIndex}
                            >
                                <SettingEntry
                                    setting={item.setting}
                                    path={[item.settingIndex]}
                                    revealItemOptions={moduleRevealItemOptions}
                                    textInputRevealItemOptions={textInputRevealItemOptions}
                                    onBooleanChange={onBooleanSettingChange}
                                    onTextChange={onTextSettingChange}
                                    onBindChange={onBindSettingChange}
                                    onColorChange={onColorSettingChange}
                                    onChooseChange={onChooseSettingChange}
                                    onMultiChooseChange={onMultiChooseSettingChange}
                                    onNumberChange={onNumberSettingChange}
                                    onNumberRangeChange={onNumberRangeSettingChange}
                                />
                            </div>
                        {/each}
                    </div>

                    {#if columnIndex < settingsColumns.length - 1}
                        <div class="settings-split" aria-hidden="true"></div>
                    {/if}
                {/each}
            </div>
        {:else if activeModuleLoadError !== null}
            <div class="settings-error-state" role="alert" aria-live="polite">
                <div class="settings-error-card">
                    <h3 class="settings-error-title">Failed To Load Module Settings</h3>
                    <p class="settings-error-message">{activeModuleLoadError}</p>
                    <div class="settings-error-actions">
                        <button
                            class="setting-input-control settings-error-retry"
                            type="button"
                            onclick={retryActiveModuleConfigLoad}
                        >
                            <span class="reveal-press-content">Retry</span>
                        </button>
                    </div>
                </div>
            </div>
        {:else}
            <pre>{activeConfigPayloadJson}</pre>
        {/if}
    </section>
</div>

<style lang="scss">
    @use "../../colors.scss" as *;

    :global(.clickgui) {
        --clickgui-backdrop-color: #{rgba($clickgui-base-color, 0.15)};
        --clickgui-surface-color: #{rgba($clickgui-base-color, 0.7)};
        --clickgui-surface-strong-color: #{rgba($clickgui-base-color, 0.85)};
        --clickgui-shadow-color: #{rgba($clickgui-base-color, 0.5)};

        display: flex;
        height: 100vh;
        width: 100%;
        max-height: 100vh;
        overflow: hidden;
        background-color: var(--clickgui-backdrop-color);
    }

    :global(.clickgui > .sidebar) {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        height: 100%;
        min-height: 0;
        width: 210px;
        background-color: var(--clickgui-surface-color);
        color: $clickgui-text-color;
        border-radius: 0;
        padding: 10px;
        gap: 12px;
        box-shadow: 0 0 12px var(--clickgui-shadow-color);
        overflow-x: hidden;
        overflow-y: auto;
    }

    :global(.clickgui > .sidebar > .search) {
        position: sticky;
        top: 0;
        z-index: 2;
        background-color: transparent;
        backdrop-filter: blur(0);
        transition:
            background-color 140ms ease,
            backdrop-filter 140ms ease,
            box-shadow 140ms ease;
        padding-bottom: 8px;
    }

    :global(.clickgui > .sidebar > .search > .search-input) {
        width: 100%;
        padding: 8px 10px;
        border-radius: 0;
        border: 1px solid rgba($clickgui-text-color, 0.2);
        background-color: var(--clickgui-surface-strong-color);
        color: $clickgui-text-color;
        font-size: 13px;
        outline: none;

        &::placeholder {
            color: $clickgui-text-dimmed-color;
        }

        &:focus {
            border-color: $accent-color;
            box-shadow: 0 0 0 2px $accent-color;
        }
    }

    :global(.clickgui > .main-content) {
        flex: 1;
        min-width: 0;
        height: 100%;
        min-height: 0;
        padding: 10px;
        overflow-x: hidden;
        overflow-y: auto;
        color: $clickgui-text-color;
    }

    :global(.clickgui > .main-content .main-content-header) {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 10px;
    }

    :global(.clickgui > .main-content .main-content-search) {
        position: sticky;
        top: 0;
        z-index: 2;
        background-color: transparent;
        backdrop-filter: blur(0);
        transition:
            background-color 140ms ease,
            backdrop-filter 140ms ease,
            box-shadow 140ms ease;
        padding: 0 0 10px;
        margin-bottom: 10px;
    }

    :global(.clickgui > .main-content .main-content-title) {
        font-size: 20px;
        font-weight: 600;
        line-height: 1.1;
    }

    :global(.clickgui > .main-content .main-content-description) {
        margin: 0;
        font-size: 12px;
        line-height: 1.4;
        color: $clickgui-text-dimmed-color;
    }

    :global(.clickgui > .main-content .settings-search-input) {
        width: 100%;
        padding: 8px 10px;
        border-radius: 0;
        border: 1px solid rgba($clickgui-text-color, 0.2);
        background-color: var(--clickgui-surface-strong-color);
        color: $clickgui-text-color;
        font-size: 13px;
        outline: none;

        &::placeholder {
            color: $clickgui-text-dimmed-color;
        }

        &:focus {
            border-color: $accent-color;
            box-shadow: 0 0 0 2px $accent-color;
        }
    }

    :global(.clickgui > .sidebar.surface-scrolled > .search),
    :global(.clickgui > .main-content.surface-scrolled .main-content-search) {
        background-color: rgba($clickgui-base-color, 0.72);
        backdrop-filter: blur(12px) saturate(130%);
        box-shadow: 0 8px 14px rgba($clickgui-base-color, 0.35);
    }

    :global(.clickgui > .sidebar.surface-scrolled .category-back-shell) {
        background:
            linear-gradient(
                180deg,
                rgba($clickgui-text-color, 0.18) 0%,
                rgba($clickgui-text-color, 0.07) 58%,
            rgba($clickgui-text-color, 0.03) 100%
            ),
            rgba($clickgui-base-color, 0.94);
        border-bottom-color: rgba($clickgui-text-color, 0.34);
        backdrop-filter: blur(14px) saturate(135%);
        box-shadow: 0 12px 18px rgba($clickgui-base-color, 0.52);
    }

    :global(.clickgui > .main-content .settings-split-layout) {
        display: flex;
        align-items: stretch;
        gap: 10px;
    }

    :global(.clickgui > .main-content .settings-error-state) {
        display: flex;
        width: 100%;
    }

    :global(.clickgui > .main-content .settings-error-card) {
        display: grid;
        gap: 10px;
        width: min(520px, 100%);
        padding: 12px;
        border: 1px solid rgba($clickgui-text-color, 0.28);
        background-color: rgba($clickgui-base-color, 0.42);
    }

    :global(.clickgui > .main-content .settings-error-title) {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: $clickgui-text-color;
    }

    :global(.clickgui > .main-content .settings-error-message) {
        margin: 0;
        font-size: 12px;
        line-height: 1.5;
        color: rgba($clickgui-text-dimmed-color, 0.96);
        white-space: pre-wrap;
    }

    :global(.clickgui > .main-content .settings-error-actions) {
        display: flex;
    }

    :global(.clickgui > .main-content .settings-error-retry) {
        cursor: pointer;
        --setting-control-padding-inline: 14px;
        --setting-control-border-color: #{rgba($clickgui-text-color, 0.34)};
        --setting-control-background-color: #{rgba($clickgui-text-color, 0.12)};
    }

    :global(.clickgui > .main-content .settings-error-retry > .reveal-press-content) {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.03em;
        color: rgba($clickgui-text-dimmed-color, 0.96);
    }

    :global(.clickgui > .main-content .settings-error-retry:hover > .reveal-press-content) {
        color: $clickgui-text-color;
    }

    :global(.clickgui > .main-content .settings-error-retry:focus-visible > .reveal-press-content) {
        border-color: $accent-color;
        box-shadow: 0 0 0 1px $accent-color;
    }

    :global(.clickgui > .main-content .settings-column) {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    :global(.clickgui > .main-content .settings-split) {
        width: 1px;
        flex-shrink: 0;
        background-color: rgba($clickgui-text-color, 0.15);
    }

    :global(.clickgui > .main-content .settings-list) {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    :global(.clickgui > .main-content .setting-entry-shell) {
        min-width: 0;
        padding: 7px 0;
    }

    :global(.clickgui > .main-content .setting-entry-shell + .setting-entry-shell) {
        border-top: 1px solid rgba($clickgui-text-color, 0.16);
    }

    :global(.clickgui > .main-content .setting-entry) {
        padding: 0;
    }

    :global(.clickgui > .main-content .setting-entry.setting-entry--configurable) {
        border: 1px solid rgba($clickgui-text-color, 0.14);
        padding: 10px;
        background-color: rgba($clickgui-text-color, 0.05);
    }

    :global(.clickgui > .main-content .setting-header) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 8px;
    }

    :global(.clickgui > .main-content .setting-entry.inline-control-setting-entry .setting-header) {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: 0;
    }

    :global(.clickgui > .main-content .setting-entry.setting-entry--configurable .setting-children) {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    :global(
        .clickgui > .main-content .setting-entry.setting-entry--configurable .setting-children > .setting-entry:not(.setting-entry--configurable)
    ) {
        padding: 6px 0;
    }

    :global(
        .clickgui > .main-content .setting-entry.setting-entry--configurable .setting-children > .setting-entry + .setting-entry
    ) {
        border-top: 1px solid rgba($clickgui-text-color, 0.16);
    }

    :global(.clickgui > .main-content .setting-selection-summary) {
        font-size: 11px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: rgba($clickgui-text-dimmed-color, 0.86);
        white-space: nowrap;
        flex-shrink: 0;
    }

    :global(.clickgui > .main-content .setting-input-shell) {
        display: inline-flex;
    }

    :global(.clickgui > .main-content .setting-input-shell--block) {
        display: flex;
        width: 100%;
    }

    :global(.clickgui > .main-content :where(.setting-input-control)) {
        display: inline-flex;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        min-width: 0;
    }

    :global(
        .clickgui > .main-content :where(.setting-input-control) > :where(.reveal-press-content)
    ) {
        display: inline-flex;
        align-items: center;
        justify-content: var(--setting-control-justify-content, center);
        width: var(--setting-control-content-width, auto);
        min-width: var(--setting-control-min-width, 66px);
        height: var(--setting-control-height, 24px);
        padding: 0 var(--setting-control-padding-inline, 10px);
        border: 1px solid
            var(
                --setting-control-border-color,
                #{rgba($clickgui-text-color, 0.32)}
            );
        border-radius: var(--setting-control-border-radius, 0);
        background-color: var(
            --setting-control-background-color,
            #{rgba($clickgui-text-color, 0.14)}
        );
        box-shadow: var(--setting-control-box-shadow, 0 0 0 0 #{$accent-color});
        transition:
            background-color 120ms ease,
            border-color 120ms ease,
            box-shadow 120ms ease;
    }

    :global(.clickgui > .main-content :where(.setting-input-control--block)) {
        width: 100%;
        --setting-control-content-width: 100%;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
    }

    :global(.clickgui > .main-content .setting-input-text) {
        width: 100%;
        min-width: 0;
        height: 24px;
        padding: 0 10px;
        border: 0;
        outline: none;
        background: transparent;
        color: $clickgui-text-color;
        caret-color: currentColor;
        font-family: inherit;
        font-size: 12px;
        line-height: 1;
    }

    :global(.clickgui > .main-content .setting-input-text::placeholder) {
        color: rgba($clickgui-text-dimmed-color, 0.9);
    }

    :global(.clickgui .scroll-surface) {
        scrollbar-gutter: stable;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
    }

    :global(.clickgui .scroll-surface:hover) {
        scrollbar-color: rgba($clickgui-text-color, 0.36) transparent;
    }

    :global(.clickgui .scroll-surface.scrollbar-strong:hover) {
        scrollbar-color: rgba($clickgui-text-color, 0.56) transparent;
    }

</style>
