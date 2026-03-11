<script lang="ts">
    import type {
        ConfigurableSetting,
        Module,
    } from "../../integration/types";
    import { onDestroy, onMount } from "svelte";
    import type {
        RevealContainerOptions,
        RevealItemOptions,
    } from "fluent-reveal-svelte";
    import {
        getModuleSettings,
        getModules,
        setModuleEnabled,
        setModuleSettings,
    } from "../../integration/rest";
    import { groupByCategory } from "../../integration/util";
    import ClickGuiMainContent from "./ClickGuiMainContent.svelte";
    import ClickGuiSidebar from "./ClickGuiSidebar.svelte";
    import { createSettingHeightTracker } from "./clickGuiActions";
    import {
        getPersistedClickGuiState,
        setPersistedClickGuiState,
        type ClickGuiActivePageState,
    } from "./clickGuiSessionState";
    import {
        buildClickGuiThemeInlineStyle,
        defaultClickGuiThemePreferences,
        hexColorToRgbChannels,
        persistClickGuiThemePreferences,
        readStoredClickGuiThemePreferences,
        validateClickGuiThemePreferences,
        type ClickGuiThemePreferences,
        type ClickGuiThemePreset,
    } from "./clickGuiThemePreferences";
    import type { ClickGuiSettingHandlers } from "./setting/clickGuiSettingHandlers";
    import {
        applySettingMapperToConfigurable,
        createBindSettingMapper,
        createBooleanSettingMapper,
        createChoiceSettingMapper,
        createChooseSettingMapper,
        createColorSettingMapper,
        createCurveSettingMapper,
        createFileSettingMapper,
        createKeySettingMapper,
        createMultiChooseSettingMapper,
        createMutableListSettingMapper,
        createNumberRangeSettingMapper,
        createNumberSettingMapper,
        createRegistryListSettingMapper,
        createTextSettingMapper,
        createVector2SettingMapper,
        createVector3SettingMapper,
        type SettingMapper,
    } from "./setting/clickGuiSettingMutations";
    import {
        buildSettingsColumns,
        getModuleSettingsShapeSignature,
        isModuleEnabledSetting,
        prioritizeModuleSettingsForDisplay,
    } from "./setting/clickGuiSettingLayout";
    import { filterModuleSettingsForSearch } from "./setting/clickGuiSettingSearch";

    let modules = $state<Module[]>([]);
    let searchQuery = $state("");
    let settingsSearchQuery = $state("");
    let selectedCategory = $state<string | null>(null);
    let selectedThemeSettings = $state(false);
    let activeConfigPage = $state<ClickGuiActivePageState>({
        type: "clickgui",
        moduleName: null,
    });
    let activeConfigurable = $state<ConfigurableSetting | null>(null);
    let activeConfigError = $state<string | null>(null);
    let activeConfigLoading = $state(false);
    let moduleSettingsRequestId = 0;
    let settingsSplitCount = $state(1);
    let clickGuiThemePreferences = $state<ClickGuiThemePreferences>({
        ...defaultClickGuiThemePreferences,
    });
    let clickGuiThemeLoadError = $state<string | null>(null);
    let settingHeights = $state<Record<number, number>>({});
    let settingHeightsSignature = "";
    let moduleTogglePendingByName = $state<Record<string, boolean>>({});

    const sortByName = (a: string, b: string) => a.localeCompare(b);

    const clickGuiTextRgbChannels = $derived(
        hexColorToRgbChannels(clickGuiThemePreferences.textColor),
    );
    const clickGuiAccentRgbChannels = $derived(
        hexColorToRgbChannels(clickGuiThemePreferences.accentColor),
    );
    const clickGuiInlineStyle = $derived(
        buildClickGuiThemeInlineStyle(clickGuiThemePreferences),
    );
    const subsectionRevealOptions = $derived({
        border: {
            radius: 48,
            color: `rgb(${clickGuiTextRgbChannels} / 0.6)`,
            fadeStopPct: 100,
            transitionMs: 120,
        },
        hover: {
            color: `rgb(${clickGuiTextRgbChannels} / 0.3)`,
        },
        focus: {
            enabled: true,
            color: `rgb(${clickGuiAccentRgbChannels} / 0.76)`,
            widthPx: 2,
            offsetPx: 1,
            glowPx: 10,
        },
        click: {
            color: `rgb(${clickGuiTextRgbChannels} / 0.24)`,
            ripple: {
                enabled: true,
                durationMs: 1000,
                sizePx: 48,
            },
        },
    } satisfies RevealContainerOptions);

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
    const normalizedSettingsSearchQuery = $derived(
        settingsSearchQuery.trim().toLowerCase(),
    );
    const isSearching = $derived(normalizedQuery.length > 0);
    const categories = $derived(groupByCategory(modules));
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
    const activeConfigTitle = $derived(
        activeConfigPage.type === "module" && activeConfigPage.moduleName !== null
            ? activeConfigPage.moduleName
            : activeConfigPage.type === "quick-settings"
              ? "Quick Settings"
              : activeConfigPage.type === "theme-settings"
                ? "Theme Settings"
                : "Click GUI",
    );
    const activeConfigDescription = $derived(
        activeConfigPage.type === "theme-settings"
            ? "Adjust Click GUI accent, contrast, module settings layout, and module row behavior."
            : activeConfigPage.type === "quick-settings"
              ? "Quick settings are not wired yet."
              : activeConfigPage.type !== "module" ||
                  activeConfigPage.moduleName === null
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
    const visibleActiveModuleSettings = $derived(
        filterModuleSettingsForSearch(
            activeModuleSettings,
            normalizedSettingsSearchQuery,
        ),
    );
    const orderedActiveModuleSettings = $derived(
        prioritizeModuleSettingsForDisplay(visibleActiveModuleSettings),
    );
    const activeModuleSettingsShapeSignature = $derived(
        getModuleSettingsShapeSignature(activeModuleSettings),
    );
    const allActiveSettingsMeasured = $derived(
        activeModuleSettings.length > 0 &&
            activeModuleSettings.every(
                (_setting, settingIndex) =>
                    settingHeights[settingIndex] !== undefined,
            ),
    );
    const settingsColumnCount = $derived(Math.max(1, settingsSplitCount + 1));
    const settingsColumns = $derived(
        buildSettingsColumns(
            orderedActiveModuleSettings,
            settingsColumnCount,
            settingHeights,
            allActiveSettingsMeasured,
        ),
    );

    const trackSettingHeight = createSettingHeightTracker(
        () => settingHeights,
        (nextHeights) => {
            settingHeights = nextHeights;
        },
    );

    $effect(() => {
        const moduleName =
            activeConfigPage.type === "module"
                ? activeConfigPage.moduleName ?? ""
                : "";
        const nextSignature = `${moduleName}|${activeModuleSettingsShapeSignature}`;

        if (nextSignature === settingHeightsSignature) {
            return;
        }

        settingHeightsSignature = nextSignature;
        settingHeights = {};
    });

    onMount(async () => {
        restoreClickGuiThemePreferences();
        modules = await getModules();

        await restorePersistedState();
    });

    onDestroy(() => {
        setPersistedClickGuiState({
            searchQuery,
            selectedCategory,
            selectedThemeSettings,
            activeConfigPage: { ...activeConfigPage },
            activeConfigurable,
            settingsSplitCount,
        });
    });

    async function restorePersistedState() {
        const persistedState = getPersistedClickGuiState();
        if (persistedState === null) {
            return;
        }

        searchQuery = persistedState.searchQuery;
        selectedCategory = persistedState.selectedCategory;
        selectedThemeSettings = persistedState.selectedThemeSettings;
        activeConfigPage = { ...persistedState.activeConfigPage };
        activeConfigurable = persistedState.activeConfigurable;
        activeConfigError = null;
        activeConfigLoading = false;
        settingsSplitCount = persistedState.settingsSplitCount;

        if (selectedThemeSettings) {
            selectedCategory = null;
        } else if (
            selectedCategory !== null &&
            categories[selectedCategory] === undefined
        ) {
            selectedCategory = null;
        }

        if (
            activeConfigPage.type !== "module" ||
            activeConfigPage.moduleName === null ||
            activeConfigurable !== null
        ) {
            return;
        }

        const module = modules.find(
            (nextModule) => nextModule.name === activeConfigPage.moduleName,
        );

        if (module === undefined) {
            activeConfigPage = {
                type: "clickgui",
                moduleName: null,
            };
            return;
        }

        await openModuleConfig(module);
    }

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
        settingsSearchQuery = "";
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
        settingsSearchQuery = "";
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

    function restoreClickGuiThemePreferences() {
        try {
            const restoredPreferences = readStoredClickGuiThemePreferences();
            clickGuiThemePreferences = restoredPreferences;
            settingsSplitCount = restoredPreferences.settingsSplitCount;
            clickGuiThemeLoadError = null;
        } catch (error) {
            clickGuiThemePreferences = { ...defaultClickGuiThemePreferences };
            settingsSplitCount = defaultClickGuiThemePreferences.settingsSplitCount;
            clickGuiThemeLoadError =
                error instanceof Error
                    ? error.message
                    : "Failed to restore ClickGUI theme preferences.";
        }
    }

    async function applyClickGuiThemePreferences(
        nextPreferences: ClickGuiThemePreferences,
    ) {
        const validatedPreferences =
            validateClickGuiThemePreferences(nextPreferences);
        const previousPreferences = clickGuiThemePreferences;
        const previousSplitCount = settingsSplitCount;

        clickGuiThemePreferences = validatedPreferences;
        settingsSplitCount = validatedPreferences.settingsSplitCount;
        clickGuiThemeLoadError = null;

        try {
            await persistClickGuiThemePreferences(validatedPreferences);
        } catch (error) {
            clickGuiThemePreferences = previousPreferences;
            settingsSplitCount = previousSplitCount;
            clickGuiThemeLoadError =
                error instanceof Error
                    ? error.message
                    : "Failed to persist ClickGUI theme preferences.";
        }
    }

    async function updateClickGuiThemePreference(
        patch: Partial<ClickGuiThemePreferences>,
    ) {
        await applyClickGuiThemePreferences({
            ...clickGuiThemePreferences,
            ...patch,
        });
    }

    async function applyClickGuiThemePreset(preset: ClickGuiThemePreset) {
        await applyClickGuiThemePreferences({
            ...preset,
            modulePrimaryInteraction:
                clickGuiThemePreferences.modulePrimaryInteraction,
            showModuleRowActions:
                clickGuiThemePreferences.showModuleRowActions,
            moduleAccentMode: clickGuiThemePreferences.moduleAccentMode,
        });
    }

    async function resetClickGuiThemePreferences() {
        await applyClickGuiThemePreferences({
            ...defaultClickGuiThemePreferences,
        });
    }

    async function openModuleConfig(module: Module) {
        const requestId = ++moduleSettingsRequestId;
        const currentModuleName =
            activeConfigPage.type === "module"
                ? activeConfigPage.moduleName
                : null;

        if (currentModuleName !== module.name) {
            settingsSearchQuery = "";
        }

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

    function applyModuleEnabledStateLocally(
        moduleName: string,
        enabled: boolean,
    ) {
        modules = modules.map((module) =>
            module.name === moduleName ? { ...module, enabled } : module,
        );

        if (
            activeConfigPage.type !== "module" ||
            activeConfigPage.moduleName !== moduleName ||
            activeConfigurable === null
        ) {
            return;
        }

        const enabledSettingIndex = activeConfigurable.value.findIndex(
            isModuleEnabledSetting,
        );

        if (enabledSettingIndex === -1) {
            return;
        }

        activeConfigurable = applySettingMapperToConfigurable(
            activeConfigurable,
            [enabledSettingIndex],
            createBooleanSettingMapper(enabled),
        );
    }

    async function toggleModule(module: Module) {
        if (moduleTogglePendingByName[module.name] === true) {
            return;
        }

        const currentModule = modules.find(
            (candidateModule) => candidateModule.name === module.name,
        );
        if (currentModule === undefined) {
            throw new Error(
                `Cannot toggle unknown module "${module.name}" from sidebar interaction.`,
            );
        }

        const previousEnabled = currentModule.enabled;
        const nextEnabled = !previousEnabled;
        const isActiveModule =
            activeConfigPage.type === "module" &&
            activeConfigPage.moduleName === module.name;
        const previousConfigurable = isActiveModule ? activeConfigurable : null;

        moduleTogglePendingByName = {
            ...moduleTogglePendingByName,
            [module.name]: true,
        };
        applyModuleEnabledStateLocally(module.name, nextEnabled);

        if (isActiveModule) {
            activeConfigError = null;
        }

        try {
            await setModuleEnabled(module.name, nextEnabled);
        } catch (error) {
            applyModuleEnabledStateLocally(module.name, previousEnabled);

            if (isActiveModule) {
                activeConfigurable = previousConfigurable;
                activeConfigError =
                    error instanceof Error
                        ? error.message
                        : "Failed to update module enabled state.";
            }
        } finally {
            moduleTogglePendingByName = {
                ...moduleTogglePendingByName,
                [module.name]: false,
            };
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

    function getTopLevelModuleEnabledValue(
        configurable: ConfigurableSetting,
        settingPath: number[],
    ): boolean | null {
        if (settingPath.length !== 1) {
            return null;
        }

        const targetSetting = configurable.value[settingPath[0]];

        if (targetSetting === undefined || !isModuleEnabledSetting(targetSetting)) {
            return null;
        }

        return targetSetting.value;
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
        const nextConfigurable = applySettingMapperToConfigurable(
            previousConfigurable,
            settingPath,
            mapper,
        );
        const previousModuleEnabled = getTopLevelModuleEnabledValue(
            previousConfigurable,
            settingPath,
        );
        const nextModuleEnabled = getTopLevelModuleEnabledValue(
            nextConfigurable,
            settingPath,
        );

        if (nextConfigurable === previousConfigurable) {
            return;
        }

        activeConfigurable = nextConfigurable;
        activeConfigError = null;

        if (nextModuleEnabled !== null) {
            applyModuleEnabledStateLocally(moduleName, nextModuleEnabled);
        }

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

            if (previousModuleEnabled !== null) {
                applyModuleEnabledStateLocally(moduleName, previousModuleEnabled);
            }

            activeConfigError =
                error instanceof Error
                    ? error.message
                    : errorMessage;
        }
    }

    function createSettingChangeHandler<Value>(
        createMapper: (value: Value) => SettingMapper,
        errorMessage: string,
    ) {
        return async (path: number[], value: Value) =>
            updateActiveModuleSettings(
                path,
                createMapper(value),
                errorMessage,
            );
    }

    const settingHandlers: ClickGuiSettingHandlers = {
        onBooleanChange: createSettingChangeHandler(
            createBooleanSettingMapper,
            "Failed to update boolean setting.",
        ),
        onTextChange: createSettingChangeHandler(
            createTextSettingMapper,
            "Failed to update text setting.",
        ),
        onBindChange: createSettingChangeHandler(
            createBindSettingMapper,
            "Failed to update bind setting.",
        ),
        onKeyChange: createSettingChangeHandler(
            createKeySettingMapper,
            "Failed to update key setting.",
        ),
        onColorChange: createSettingChangeHandler(
            createColorSettingMapper,
            "Failed to update color setting.",
        ),
        onChooseChange: createSettingChangeHandler(
            createChooseSettingMapper,
            "Failed to update choose setting.",
        ),
        onChoiceChange: createSettingChangeHandler(
            createChoiceSettingMapper,
            "Failed to update choice setting.",
        ),
        onMultiChooseChange: createSettingChangeHandler(
            createMultiChooseSettingMapper,
            "Failed to update multi choose setting.",
        ),
        onMutableListChange: createSettingChangeHandler(
            createMutableListSettingMapper,
            "Failed to update mutable list setting.",
        ),
        onFileChange: createSettingChangeHandler(
            createFileSettingMapper,
            "Failed to update file setting.",
        ),
        onRegistryListChange: createSettingChangeHandler(
            createRegistryListSettingMapper,
            "Failed to update registry list setting.",
        ),
        onCurveChange: createSettingChangeHandler(
            createCurveSettingMapper,
            "Failed to update curve setting.",
        ),
        onNumberChange: createSettingChangeHandler(
            createNumberSettingMapper,
            "Failed to update numeric setting.",
        ),
        onNumberRangeChange: createSettingChangeHandler(
            createNumberRangeSettingMapper,
            "Failed to update numeric range setting.",
        ),
        onVector2Change: createSettingChangeHandler(
            createVector2SettingMapper,
            "Failed to update vector setting.",
        ),
        onVector3Change: createSettingChangeHandler(
            createVector3SettingMapper,
            "Failed to update vector setting.",
        ),
    };
</script>

<div class="clickgui" style={clickGuiInlineStyle}>
    <ClickGuiSidebar
        {isDetailView}
        bind:searchQuery
        {selectedCategory}
        {selectedCategoryModules}
        {selectedThemeSettings}
        {isSearching}
        {filteredCategoryNames}
        {filteredGrouped}
        {categoryNames}
        themeAccentColor={clickGuiThemePreferences.accentColor}
        themeBaseColor={clickGuiThemePreferences.baseColor}
        themeBackgroundColor={clickGuiThemePreferences.backgroundColor}
        themeTextColor={clickGuiThemePreferences.textColor}
        themeDimmedTextColor={clickGuiThemePreferences.dimmedTextColor}
        themeSettingsColumnCount={settingsColumnCount}
        modulePrimaryInteraction={clickGuiThemePreferences.modulePrimaryInteraction}
        showModuleRowActions={clickGuiThemePreferences.showModuleRowActions}
        moduleAccentMode={clickGuiThemePreferences.moduleAccentMode}
        togglePendingByName={moduleTogglePendingByName}
        {subsectionRevealOptions}
        {moduleRevealItemOptions}
        onOpenCategory={openCategory}
        onOpenQuickSettings={openQuickSettings}
        onOpenThemeSettings={openThemeSettings}
        onCloseDetailView={closeDetailView}
        onOpenModuleConfig={openModuleConfig}
        onToggleModule={toggleModule}
    />

    <ClickGuiMainContent
        {activeConfigPage}
        {activeConfigTitle}
        {activeConfigDescription}
        {activeConfigLoading}
        {activeConfigurable}
        {activeModuleLoadError}
        {settingsColumns}
        bind:settingsSearchQuery
        {subsectionRevealOptions}
        revealItemOptions={moduleRevealItemOptions}
        {textInputRevealItemOptions}
        {trackSettingHeight}
        {settingHandlers}
        {clickGuiThemePreferences}
        clickGuiThemeLoadError={clickGuiThemeLoadError}
        onRetryActiveModuleConfigLoad={retryActiveModuleConfigLoad}
        onAccentColorChange={(accentColor) =>
            updateClickGuiThemePreference({ accentColor })}
        onBaseColorChange={(baseColor) =>
            updateClickGuiThemePreference({ baseColor })}
        onBackgroundColorChange={(backgroundColor) =>
            updateClickGuiThemePreference({ backgroundColor })}
        onTextColorChange={(textColor) =>
            updateClickGuiThemePreference({ textColor })}
        onDimmedTextColorChange={(dimmedTextColor) =>
            updateClickGuiThemePreference({ dimmedTextColor })}
        onSettingsSplitCountChange={(nextSplitCount) =>
            updateClickGuiThemePreference({
                settingsSplitCount: nextSplitCount,
            })}
        onModulePrimaryInteractionChange={(modulePrimaryInteraction) =>
            updateClickGuiThemePreference({
                modulePrimaryInteraction,
            })}
        onShowModuleRowActionsChange={(showModuleRowActions) =>
            updateClickGuiThemePreference({
                showModuleRowActions,
            })}
        onModuleAccentModeChange={(moduleAccentMode) =>
            updateClickGuiThemePreference({
                moduleAccentMode,
            })}
        onApplyThemePreset={applyClickGuiThemePreset}
        onResetThemeDefaults={resetClickGuiThemePreferences}
    />
</div>

<style lang="scss">
    .clickgui {
        --clickgui-accent-color: #4677ff;
        --clickgui-accent-rgb: 70 119 255;
        --clickgui-base-color: #000000;
        --clickgui-base-rgb: 0 0 0;
        --clickgui-text-color: #ffffff;
        --clickgui-text-rgb: 255 255 255;
        --clickgui-text-dimmed-color: #d3d3d3;
        --clickgui-text-dimmed-rgb: 211 211 211;
        --clickgui-backdrop-color: rgb(var(--clickgui-base-rgb, 0 0 0) / 0.15);
        --clickgui-surface-color: rgb(var(--clickgui-base-rgb, 0 0 0) / 0.7);
        --clickgui-surface-strong-color: rgb(
            var(--clickgui-base-rgb, 0 0 0) / 0.85
        );
        --clickgui-shadow-color: rgb(var(--clickgui-base-rgb, 0 0 0) / 0.5);

        display: flex;
        height: 100vh;
        width: 100%;
        max-height: 100vh;
        overflow: hidden;
        background-color: var(--clickgui-backdrop-color);
    }

    .clickgui :global(.scroll-surface) {
        scrollbar-gutter: stable;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
    }

    .clickgui :global(.scroll-surface:hover) {
        scrollbar-color: rgb(var(--clickgui-text-rgb, 255 255 255) / 0.36) transparent;
    }

    .clickgui :global(.scroll-surface.scrollbar-strong:hover) {
        scrollbar-color: rgb(var(--clickgui-text-rgb, 255 255 255) / 0.56) transparent;
    }
</style>
