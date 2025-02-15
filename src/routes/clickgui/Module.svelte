<script lang="ts">
  import { onMount } from "svelte";
  import {
    getModuleSettings,
    setModuleSettings,
    setModuleEnabled,
  } from "../../integration/rest";
  import type { ConfigurableSetting } from "../../integration/types";
  import GenericSetting from "./setting/common/GenericSetting.svelte";
  import { slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import {
    description as descriptionStore,
    highlightModuleName,
  } from "./clickgui_store";
  import { setItem } from "../../integration/persistent_storage";
  import {
    convertToSpacedString,
    spaceSeparatedNames,
  } from "../../theme/theme_config";
  import { scaleFactor } from "./clickgui_store";
  import { applyEffect } from "fluent-reveal-effect";

  export let name: string;
  export let enabled: boolean;
  export let description: string;
  export let aliases: string[];

  let moduleElement: HTMLElement;
  let moduleNameElement: HTMLElement;
  let configurable: ConfigurableSetting;
  const path = `clickgui.${name}`;
  let expanded = false;

  onMount(async () => {
    configurable = await getModuleSettings(name);

    setTimeout(() => {
      expanded = localStorage.getItem(path) === "true";

      applyEffect(".name", {
        lightColor: "rgba(255,255,255,0.5)",
        gradientSize: 150,
        clickEffect: true,
      });
    }, 500);
  });

  highlightModuleName.subscribe((m) => {
    if (name !== m) {
      return;
    }

    setTimeout(() => {
      if (!moduleNameElement) {
        return;
      }
      moduleNameElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 1000);
  });

  async function updateModuleSettings() {
    await setModuleSettings(name, configurable);
    configurable = await getModuleSettings(name);
  }

  async function toggleModule() {
    await setModuleEnabled(name, !enabled);
  }

  function setDescription() {
    if (!moduleNameElement) return;

    const boundingRect = moduleNameElement.getBoundingClientRect();
    const y =
      (boundingRect.top + moduleNameElement.clientHeight / 2) *
      (2 / $scaleFactor);

    let moduleDescription = description;
    if (aliases.length > 0) {
      moduleDescription += ` (aka ${aliases.map((name) => ($spaceSeparatedNames ? convertToSpacedString(name) : name)).join(", ")})`;
    }

    if (window.innerWidth - boundingRect.right > 300) {
      const x = boundingRect.right * (2 / $scaleFactor);
      descriptionStore.set({
        x,
        y,
        anchor: "right",
        description: moduleDescription,
      });
    } else {
      const x = boundingRect.left * (2 / $scaleFactor);

      descriptionStore.set({
        x,
        y,
        anchor: "left",
        description: moduleDescription,
      });
    }
  }

  async function toggleExpanded() {
    expanded = !expanded;
    await setItem(path, expanded.toString());
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      toggleModule();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      toggleExpanded();
    }
  }
</script>

<div
  class="module"
  class:expanded
  class:has-settings={configurable?.value.length > 2}
  in:slide={{ duration: 500, easing: quintOut }}
  out:slide={{ duration: 500, easing: quintOut }}
  bind:this={moduleElement}
>
  <button
    type="button"
    class="name"
    on:contextmenu|preventDefault={toggleExpanded}
    on:click={toggleModule}
    on:keydown={handleKeyDown}
    on:mouseenter={setDescription}
    on:mouseleave={() => descriptionStore.set(null)}
    bind:this={moduleNameElement}
    class:enabled
    class:highlight={name === $highlightModuleName}
    aria-expanded={expanded}
    aria-pressed={enabled}
  >
    {$spaceSeparatedNames ? convertToSpacedString(name) : name}
  </button>

  {#if expanded && configurable?.value.length > 0}
    <div class="settings" transition:slide>
      {#each configurable.value as setting}
        <GenericSetting {setting} {path} on:change={updateModuleSettings} />
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  @use "../../colors.scss" as *;

  .module {
    position: relative;
    overflow: hidden;
    background-color: rgba($clickgui-base-color, 0.5);

    .name {
      cursor: pointer;
      transition:
        ease background-color 0.2s,
        ease color 0.2s;
      color: $clickgui-text-dimmed-color;
      text-align: center;
      font-size: 12px;
      padding: 8px;
      width: 100%;
      background: inherit;
      border: solid 1px rgba($clickgui-base-color, 0.5);
      display: block;
      position: relative;

      font-weight: 500;
      font-family: inherit;

      &:hover {
        background-color: rgba($clickgui-base-color, 0.85);
        color: $clickgui-text-color;
      }

      &.enabled {
        background-color: $accent-color;
      }


    }

    &.has-settings {
        .name::after {
          content: "";
          display: block;
          position: absolute;
          height: 10px;
          width: 10px;
          right: 15px;
          top: 50%;
          background-image: url("/img/clickgui/icon-settings-expand.svg");
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0.5;
          transform-origin: 50% 50%;
          transform: translateY(-50%) rotate(-90deg);
          transition:
            ease opacity 0.2s,
            ease transform 0.4s;
        }

        &.expanded .name::after {
          transform: translateY(-50%) rotate(0);
          opacity: 1;
        }
      }

    .settings {
      background-color: rgba($clickgui-base-color, 0.5);
      border-left: solid 4px $accent-color;
      padding: 0 11px 0 7px;
    }
  }
</style>
