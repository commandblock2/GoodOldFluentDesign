<script lang="ts">
    import type { GroupedModules, Module } from "../../integration/types";
    import { onMount } from "svelte";
    import { getModules } from "../../integration/rest";
    import { groupByCategory } from "../../integration/util";

    let categories = $state<GroupedModules>({});
    let modules = $state<Module[]>([]);

    onMount(async () => {
        modules = await getModules();
        categories = groupByCategory(modules);
    });
</script>

<div class="clickgui">
</div>
