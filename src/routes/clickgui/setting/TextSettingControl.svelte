<script lang="ts">
    import type { TextSetting } from "../../../integration/types";

    export let setting: TextSetting;
    export let onChange: (value: string) => void = () => {};
</script>

<input
    type="text"
    value={setting.value}
    onchange={(event) =>
        onChange((event.currentTarget as HTMLInputElement).value)}
    spellcheck="false"
/>
