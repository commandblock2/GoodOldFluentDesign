<script lang="ts">
    import {afterUpdate} from "svelte";
    import {setModuleEnabled} from "../../../../integration/rest";
    import {convertToSpacedString, spaceSeperatedNames} from "../../../../theme/theme_config";

    export let name: string;
    export let enabled: boolean;
    export let selected: boolean;

    let moduleElement: HTMLElement;

    afterUpdate(() => {
        if (moduleElement && selected) {
            moduleElement.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    });

    async function handleKeyDown(e: KeyboardEvent) {
        if (selected && e.key === "Enter") {
            await setModuleEnabled(name, !enabled);
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="module" class:enabled class:selected bind:this={moduleElement}>
    <div class="name">{$spaceSeperatedNames ? convertToSpacedString(name) : name}</div>
</div>

<style lang="scss">
    @use "../../../../colors.scss" as *;

    .module {
        font-weight: 500;
        color: $tabgui-text-dimmed-color;
        font-size: 12px;
        padding: 6px 15px 6px 10px;
        border: 1px solid rgba($tabgui-text-color, 0.14);
        background-color: rgba($tabgui-base-color, 0.54);
        transition:
            color 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background-color 0.2s ease;

        .name {
            transition:
                transform 0.2s ease,
                text-shadow 0.2s ease;
        }

        &.selected {
            border-color: rgba($accent-color, 0.64);
            background-color: rgba($tabgui-base-color, 0.78);
            box-shadow:
                inset 0 0 0 1px rgba($accent-color, 0.2),
                0 0 10px rgba($accent-color, 0.28);

            .name {
                transform: translateX(4px);
                text-shadow: 0 0 8px rgba($accent-color, 0.3);
            }
        }

        &.enabled {
            color: $tabgui-text-color;
        }
    }
</style>
