<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type {
        ModuleSetting,
        BooleanSetting,
    } from "../../../integration/types";
    import Switch from "./common/Switch.svelte";
    import {convertToSpacedString, spaceSeparatedNames} from "../../../theme/theme_config";

    export let setting: ModuleSetting;

    const cSetting = setting as BooleanSetting;

    const dispatch = createEventDispatcher();

    function handleChange() {
        setting = { ...cSetting };

        dispatch("change");
    }
</script>

<div class="setting">
    <Switch
        name={$spaceSeparatedNames ? convertToSpacedString(cSetting.name) : cSetting.name}
        bind:value={cSetting.value}
        on:change={handleChange}
    />
</div>

<style lang="scss">
    .setting {
        padding: 7px 0px;
    }
</style>
