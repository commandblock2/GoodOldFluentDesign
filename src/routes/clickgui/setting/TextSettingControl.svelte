<script lang="ts">
    import type { RevealItemOptions } from "fluent-reveal-svelte";
    import type { TextSetting } from "../../../integration/types";
    import ExpandableTextInputControl from "./ExpandableTextInputControl.svelte";

    export let setting: TextSetting;
    export let onChange: (value: string) => void = () => {};
    export let revealItemOptions: RevealItemOptions;
</script>

<ExpandableTextInputControl
    value={setting.value}
    onChange={onChange}
    revealItemOptions={revealItemOptions}
/>
