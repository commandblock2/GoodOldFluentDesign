<script lang="ts">
    import type { BooleanSetting } from "../../../integration/types";

    export let setting: BooleanSetting;
    export let onChange: (checked: boolean) => void = () => {};
</script>

<label>
    <input
        type="checkbox"
        checked={setting.value}
        onchange={(event) =>
            onChange((event.currentTarget as HTMLInputElement).checked)}
    />
    Enabled
</label>
