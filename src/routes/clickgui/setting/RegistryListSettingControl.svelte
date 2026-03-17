<script lang="ts">
    import { untrack } from "svelte";
    import {
        revealBorder,
        revealItem,
        type RevealItemOptions,
    } from "fluent-reveal-svelte";
    import {
        getRegistryItems,
    } from "../../../integration/rest";
    import type {
        RegistryListSetting,
    } from "../../../integration/types";

    interface Props {
        setting: RegistryListSetting;
        onChange?: (values: string[]) => void;
        revealItemOptions: RevealItemOptions;
        textInputRevealItemOptions: RevealItemOptions;
    }

    interface RegistryOption {
        value: string;
        name: string;
        icon?: string;
        normalizedName: string;
        normalizedSearchText: string;
    }

    const REGISTRY_VIEWPORT_HEIGHT = 220;
    const REGISTRY_ROW_HEIGHT = 56;
    const REGISTRY_OVERSCAN = 6;
    const defaultChangeHandler = (_nextValues: string[]) => {};

    let {
        setting,
        onChange = defaultChangeHandler,
        revealItemOptions,
        textInputRevealItemOptions,
    }: Props = $props();

    let searchQuery = $state("");
    let loading = $state(false);
    let errorMessage = $state<string | null>(null);
    let registryOptions = $state<RegistryOption[]>([]);
    let registryRequestId = 0;
    let loadedRegistryName = $state<string | null>(null);
    let listViewportElement = $state<HTMLDivElement | null>(null);
    let listViewportHeight = $state(REGISTRY_VIEWPORT_HEIGHT);
    let listScrollTop = $state(0);
    let listPointerInside = $state(false);
    let pendingResort = $state(false);

    const registryName = $derived(setting.registry);
    const registrySettingName = $derived(setting.name);
    const normalizedSearchQuery = $derived(searchQuery.trim().toLowerCase());
    const selectedValues = $derived(new Set(setting.value));
    const selectionSignature = $derived(setting.value.join("\u0000"));
    const baseFilteredOptions = $derived(
        normalizedSearchQuery.length === 0
            ? registryOptions
            : registryOptions.filter((option) =>
                  option.normalizedSearchText.includes(
                      normalizedSearchQuery,
                  ),
              ),
    );
    let filteredOptions = $state<RegistryOption[]>([]);
    const visibleStartIndex = $derived(
        filteredOptions.length === 0
            ? 0
            : Math.max(
                  0,
                  Math.floor(listScrollTop / REGISTRY_ROW_HEIGHT) -
                      REGISTRY_OVERSCAN,
              ),
    );
    const visibleEndIndex = $derived(
        Math.min(
            filteredOptions.length,
            visibleStartIndex +
                Math.ceil(listViewportHeight / REGISTRY_ROW_HEIGHT) +
                REGISTRY_OVERSCAN * 2,
        ),
    );
    const visibleOptions = $derived(
        filteredOptions
            .slice(visibleStartIndex, visibleEndIndex)
            .map((option, offset) => ({
                option,
                index: visibleStartIndex + offset,
            })),
    );
    const topSpacerHeight = $derived(visibleStartIndex * REGISTRY_ROW_HEIGHT);
    const bottomSpacerHeight = $derived(
        Math.max(
            0,
            (filteredOptions.length - visibleEndIndex) * REGISTRY_ROW_HEIGHT,
        ),
    );
    const listResetKey = $derived(
        `${registryName}|${normalizedSearchQuery}`,
    );

    $effect(() => {
        listResetKey;
        pendingResort = false;
        listScrollTop = 0;
        listViewportElement?.scrollTo({
            top: 0,
        });
    });

    $effect(() => {
        const currentRegistryName = registryName;
        const requestId = ++registryRequestId;

        if (
            loadedRegistryName === currentRegistryName &&
            registryOptions.length > 0
        ) {
            return;
        }

        loading = true;
        errorMessage = null;
        if (loadedRegistryName !== currentRegistryName) {
            registryOptions = [];
        }

        getRegistryItems(currentRegistryName)
            .then((registryItemsPayload) => {
                if (requestId !== registryRequestId) {
                    return;
                }

                registryOptions = parseRegistryItems(
                    registryItemsPayload,
                    currentRegistryName,
                    registrySettingName,
                );
                loadedRegistryName = currentRegistryName;
                loading = false;
            })
            .catch((error) => {
                if (requestId !== registryRequestId) {
                    return;
                }

                errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to load registry items.";
                loading = false;
            });
    });

    $effect(() => {
        listResetKey;
        baseFilteredOptions;
        pendingResort = false;

        filteredOptions = partitionRegistryOptions(
            baseFilteredOptions,
            new Set(untrack(() => setting.value)),
        );
    });

    $effect(() => {
        selectionSignature;
        if (listPointerInside || pendingResort) {
            return;
        }

        filteredOptions = partitionRegistryOptions(
            baseFilteredOptions,
            selectedValues,
        );
    });

    function parseRegistryItems(
        payload: Record<string, unknown>,
        registryName: string,
        settingName: string,
    ): RegistryOption[] {
        const options: RegistryOption[] = [];

        for (const [identifier, itemValue] of Object.entries(payload)) {
            if (typeof itemValue !== "object" || itemValue === null) {
                throw new Error(
                    `REGISTRY_LIST "${settingName}" (registry: ${registryName}) returned non-object item payload for "${identifier}".`,
                );
            }

            const itemRecord = itemValue as {
                name?: unknown;
                icon?: unknown;
            };

            if (
                typeof itemRecord.name !== "string" ||
                itemRecord.name.trim().length === 0
            ) {
                throw new Error(
                    `REGISTRY_LIST "${settingName}" (registry: ${registryName}) is missing a valid "name" for "${identifier}".`,
                );
            }

            if (
                itemRecord.icon !== undefined &&
                typeof itemRecord.icon !== "string"
            ) {
                throw new Error(
                    `REGISTRY_LIST "${settingName}" (registry: ${registryName}) returned non-string "icon" for "${identifier}".`,
                );
            }

            options.push({
                value: identifier,
                name: itemRecord.name,
                icon: itemRecord.icon,
                normalizedName: itemRecord.name.toLowerCase(),
                normalizedSearchText:
                    `${itemRecord.name} ${identifier}`.toLowerCase(),
            });
        }

        return options.sort((left, right) =>
            left.normalizedName.localeCompare(right.normalizedName) ||
            left.value.localeCompare(right.value),
        );
    }

    function isSelected(value: string): boolean {
        return selectedValues.has(value);
    }

    function partitionRegistryOptions(
        options: RegistryOption[],
        selected: ReadonlySet<string>,
    ): RegistryOption[] {
        const selectedOptions: RegistryOption[] = [];
        const unselectedOptions: RegistryOption[] = [];

        for (const option of options) {
            if (selected.has(option.value)) {
                selectedOptions.push(option);
                continue;
            }

            unselectedOptions.push(option);
        }

        return [...selectedOptions, ...unselectedOptions];
    }

    function trackRegistryViewport(node: HTMLDivElement) {
        let resizeObserver: ResizeObserver | null = null;

        const writeMetrics = () => {
            listViewportHeight = Math.ceil(node.clientHeight);
            listScrollTop = node.scrollTop;
        };

        const onScroll = () => {
            listScrollTop = node.scrollTop;
        };

        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(writeMetrics);
            resizeObserver.observe(node);
        }

        writeMetrics();
        node.addEventListener("scroll", onScroll, {
            passive: true,
        });

        return {
            destroy() {
                resizeObserver?.disconnect();
                node.removeEventListener("scroll", onScroll);
            },
        };
    }

    function flushPendingResort() {
        if (!pendingResort) {
            return;
        }

        pendingResort = false;
        filteredOptions = partitionRegistryOptions(
            baseFilteredOptions,
            new Set(setting.value),
        );
    }

    function onResultsPointerEnter(): void {
        listPointerInside = true;
    }

    function onResultsPointerLeave(): void {
        listPointerInside = false;
        flushPendingResort();
    }

    function toggleValue(value: string): void {

        if (isSelected(value)) {
            onChange(setting.value.filter((entry) => entry !== value));
        } else {
            onChange([...setting.value, value]);
        }

        pendingResort = listPointerInside;
    }
</script>

<div class="setting-input-shell setting-input-shell--block registry-list-setting-shell">
    <div class="registry-list-layout">
        <div class="registry-search-shell" use:revealBorder>
            <label
                class="setting-input-control setting-input-control--block registry-search-control"
                use:revealItem={textInputRevealItemOptions}
            >
                <span class="reveal-press-content">
                    <input
                        class="setting-input-text registry-search-input"
                        type="text"
                        spellcheck={false}
                        placeholder="Search registry items..."
                        bind:value={searchQuery}
                    />
                </span>
            </label>
        </div>

        <div
            class="registry-list-results"
            role="list"
            bind:this={listViewportElement}
            use:trackRegistryViewport
            onpointerenter={onResultsPointerEnter}
            onpointerleave={onResultsPointerLeave}
        >
            {#if loading}
                <p class="registry-list-state">Loading items...</p>
            {:else if errorMessage !== null}
                <p class="registry-list-state registry-list-state--error" role="alert">
                    {errorMessage}
                </p>
            {:else if filteredOptions.length === 0}
                <p class="registry-list-state">No matching items.</p>
            {:else}
                <div
                    class="registry-list-virtual-content"
                    style:padding-top={`${topSpacerHeight}px`}
                    style:padding-bottom={`${bottomSpacerHeight}px`}
                >
                    {#each visibleOptions as entry (entry.option.value)}
                        {@const option = entry.option}
                        {@const selected = isSelected(option.value)}

                        <div class="registry-item-shell" use:revealBorder>
                            <button
                                class="setting-input-control setting-input-control--block registry-item-btn"
                                class:registry-item-btn--selected={selected}
                                type="button"
                                onclick={() => toggleValue(option.value)}
                                use:revealItem={revealItemOptions}
                            >
                                <span class="reveal-press-content">
                                    {#if option.icon !== undefined && option.icon.length > 0}
                                        <img
                                            class="registry-item-icon"
                                            src={option.icon}
                                            alt={option.name}
                                            loading="lazy"
                                        />
                                    {/if}

                                    <span class="registry-item-main">
                                        <span class="registry-item-name">{option.name}</span>
                                        <span class="registry-item-value">{option.value}</span>
                                    </span>

                                    <span class="registry-item-state">
                                        {selected ? "On" : "Off"}
                                    </span>
                                </span>
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .registry-list-setting-shell {
        width: 100%;
    }

    .registry-list-layout {
        display: grid;
        width: 100%;
        gap: 8px;
    }

    .registry-search-control {
        --reveal-focus-color: var(--clickgui-accent-color, #{$accent-color});
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-border-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.3
        );
        --setting-control-background-color: var(--clickgui-input-background-color);
    }

    .registry-search-control > .reveal-press-content {
        width: 100%;
    }

    .registry-search-input {
        padding: 0 10px;
    }

    .registry-list-results {
        height: 220px;
        overflow-y: auto;
        display: grid;
        gap: 0;
        padding-right: 2px;
        align-content: start;
        contain: layout paint;
    }

    .registry-list-virtual-content {
        display: flex;
        flex-direction: column;
    }

    .registry-list-state {
        margin: 0;
        font-size: 10px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.9);
    }

    .registry-list-state--error {
        color: rgb(var(--clickgui-text-rgb, 255 255 255) / 0.92);
    }

    .registry-item-btn {
        width: 100%;
        cursor: pointer;
        --registry-item-row-height: 56px;
        --setting-control-height: var(--registry-item-row-height);
        --reveal-focus-color: var(--clickgui-accent-color, #{$accent-color});
        --setting-control-content-width: 100%;
        --setting-control-min-width: 0;
        --setting-control-justify-content: flex-start;
        --setting-control-padding-inline: 0;
        --setting-control-border-color: rgb(
            var(--clickgui-text-rgb, 255 255 255) / 0.28
        );
        --setting-control-background-color: var(--clickgui-control-off-color);
    }

    .registry-item-btn.registry-item-btn--selected {
        --setting-control-border-color: var(
            --clickgui-accent-color,
            #{$accent-color}
        );
        --setting-control-background-color: rgb(
            var(--clickgui-accent-rgb, 70 119 255) / 0.26
        );
    }

    .registry-item-btn > .reveal-press-content {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
    }

    .registry-item-icon {
        width: 20px;
        height: 20px;
        object-fit: contain;
    }

    .registry-item-main {
        min-width: 0;
        display: grid;
        gap: 2px;
    }

    .registry-item-name {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: rgb(var(--clickgui-text-rgb, 255 255 255) / 0.96);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .registry-item-value {
        display: block;
        font-size: 10px;
        color: rgb(var(--clickgui-text-dimmed-rgb, 211 211 211) / 0.86);
        font-family: monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        direction: rtl;
    }

    .registry-item-state {
        font-size: 10px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: rgba($clickgui-text-dimmed-color, 0.92);
    }

    .registry-item-btn.registry-item-btn--selected .registry-item-state {
        color: rgba($clickgui-text-color, 0.96);
    }
</style>
