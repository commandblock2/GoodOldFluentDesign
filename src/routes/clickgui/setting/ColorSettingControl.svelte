<script lang="ts">
    import type { RevealItemOptions } from "fluent-reveal-svelte";
    import type { ColorSetting } from "../../../integration/types";
    import { intColorToRgbaColor, rgbaColorToIntColor } from "../clickGuiColorUtils";
    import ClickGuiColorPicker from "./ClickGuiColorPicker.svelte";

    interface Props {
        setting: ColorSetting;
        onChange?: (value: number) => void;
        revealItemOptions: RevealItemOptions;
    }

    const defaultChangeHandler = (_nextValue: number) => {};

    let {
        setting,
        onChange = defaultChangeHandler,
        revealItemOptions,
    }: Props = $props();

    const colorValue = $derived(intColorToRgbaColor(setting.value));

    function handleColorChange(nextColor: ReturnType<typeof intColorToRgbaColor>) {
        const nextValue = rgbaColorToIntColor(nextColor);
        if (nextValue === setting.value) {
            return;
        }

        onChange(nextValue);
    }
</script>

<ClickGuiColorPicker
    value={colorValue}
    onChange={handleColorChange}
    {revealItemOptions}
    ariaLabel={`Pick color for ${setting.name}`}
    allowAlpha={true}
    liveUpdate={false}
/>
