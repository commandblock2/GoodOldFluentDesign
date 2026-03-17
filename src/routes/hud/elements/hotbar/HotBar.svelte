<script lang="ts">
    import Status from "./Status.svelte";
    import {listen} from "../../../../integration/ws";
    import type {PlayerData, TextComponent as TTExtComponent} from "../../../../integration/types";
    import {onMount} from "svelte";
    import {getPlayerData} from "../../../../integration/rest";
    import {fade} from "svelte/transition";
    import TextComponent from "../../../menu/common/TextComponent.svelte";
    import type {ClientPlayerDataEvent, OverlayMessageEvent} from "../../../../integration/events";

    let lastSlot = 0;
    let currentSlot = 0;
    let playerData: PlayerData | null = null;
    let maxAbsorption = 0;
    let slotsElement: HTMLElement | undefined;

    let showItemStackName = false;
    let showItemStackNameTimeout: number | null = null;
    let itemStackName: TTExtComponent | string | null = null;
    let overlayMessage: OverlayMessageEvent | null = null;
    let overlayMessageTimeout: number | null = null;

    function updatePlayerData(s: PlayerData) {
        playerData = s;
        if (playerData.absorption <= 0) {
            maxAbsorption = 0;
        }
        if (playerData.absorption > maxAbsorption) {
            maxAbsorption = playerData.absorption;
        }
        currentSlot = playerData.selectedSlot;
        if (currentSlot !== lastSlot) {
            lastSlot = currentSlot;
            if (playerData.mainHandStack.identifier !== "minecraft:air") {
                itemStackName = playerData.mainHandStack.displayName;
                if (showItemStackNameTimeout !== null) {
                    clearTimeout(showItemStackNameTimeout);
                }
                showItemStackName = true;
                showItemStackNameTimeout = setTimeout(() => {
                    showItemStackName = false;
                }, 2000);
            }
        }
    }

    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
        updatePlayerData(event.playerData);
    });

    listen("overlayMessage", (event: OverlayMessageEvent) => {
        overlayMessage = event;
        if (overlayMessageTimeout !== null) {
            clearTimeout(overlayMessageTimeout);
        }
        overlayMessageTimeout = setTimeout(() => {
            overlayMessage = null;
        }, 3000)
    });

    onMount(async () => {
        updatePlayerData(await getPlayerData());
    });
</script>

{#if playerData && playerData.gameMode !== "spectator"}
    <div class="hotbar">
        {#if overlayMessage !== null}
            <div class="overlay-message" out:fade={{duration: 200}}
                 style="max-width: {slotsElement?.offsetWidth ?? 0}px">
                <TextComponent fontSize={14} textComponent={overlayMessage.text} allowPreformatting={true} />
            </div>
        {/if}
        {#if showItemStackName && itemStackName !== null}
            <div class="item-name" out:fade={{duration: 200}}>
                <TextComponent fontSize={14} textComponent={itemStackName}/>
            </div>
        {/if}
        <div class="status">

            <div class="pair">
                {#if playerData.armor > 0}
                    <Status
                            max={20}
                            value={playerData.armor}
                            color="#49EAD6"
                            alignRight={false}
                            icon="shield"
                    />
                {:else}
                    <div></div>
                {/if}

                {#if playerData.air < playerData.maxAir}
                    <Status
                            max={playerData.maxAir}
                            value={playerData.air}
                            color="#AAC1E3"
                            alignRight={true}
                    />
                {:else}
                    <div></div>
                {/if}
            </div>

            {#if playerData.gameMode !== "creative"}
                {#if playerData.absorption > 0}
                    <div class="pair">
                        <Status
                                max={maxAbsorption}
                                value={playerData.absorption}
                                color="#D4AF37"
                                alignRight={false}
                        />

                        <div></div>
                    </div>
                {/if}
                <div class="pair">
                    <Status
                            max={playerData.maxHealth}
                            value={playerData.health}
                            color="#FC4130"
                            alignRight={false}
                            icon="heart"
                            glow={true}
                    />
                    <Status
                            max={20}
                            value={playerData.food}
                            color="#B88458"
                            alignRight={true}
                            icon="food"
                            glow={true}
                    />
                </div>
            {/if}
            {#if playerData.experienceLevel > 0}
                <Status
                        max={100} value={playerData.experienceProgress * 100}
                        color="#88C657"
                        alignRight={false}
                        label={playerData.experienceLevel.toString()}
                        glow={true}
                />
            {/if}

        </div>

        <div class="hotbar-elements">
            <div class="slider" style="left: {currentSlot * 45}px"></div>
            <div class="slots" bind:this={slotsElement}>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
                <div class="slot"></div>
            </div>
        </div>

        {#if playerData?.offHandStack.identifier !== "minecraft:air"}
            <div class="offhand-slot"></div>
        {/if}
    </div>
{/if}

<style lang="scss">
  @use "../../../../colors.scss" as *;

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 25px;
  }

  .status {
    display: flex;
    flex-direction: column;
    margin-bottom: 5px;
    row-gap: 5px;
    column-gap: 20px;
  }

  .hotbar-elements {
    background-color: rgba($hotbar-base-color, 0.68);
    position: relative;
    overflow: visible;

    .slider {
      border: 1px solid rgba($accent-color, 0.82);
      background-color: rgba($accent-color, 0.1);
      box-shadow:
          0 0 0 1px rgba($accent-color, 0.24),
          0 0 12px rgba($accent-color, 0.4),
          0 0 20px rgba($accent-color, 0.24);
      height: 45px;
      width: 45px;
      position: absolute;
      pointer-events: none;
      transition: left 70ms linear;
      overflow: hidden;
      isolation: isolate;

      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
            112deg,
            transparent 15%,
            rgba($accent-color, 0.36) 50%,
            transparent 85%
        );
        opacity: 0.88;
        transform: translateX(-135%);
        animation: hotbar-reveal-focus 1.65s ease-in-out infinite;
      }

      &::after {
        content: "";
        position: absolute;
        inset: -2px;
        border: 1px solid rgba($accent-color, 0.42);
        box-shadow: 0 0 14px rgba($accent-color, 0.28);
      }
    }

    .slots {
      display: flex;
    }

    .slot {
      height: 45px;
      width: 45px;
    }
  }

  @keyframes hotbar-reveal-focus {
    from {
      transform: translateX(-135%);
    }

    to {
      transform: translateX(135%);
    }
  }

  .offhand-slot {
    height: 45px;
    width: 45px;
    background-color: rgba($hotbar-base-color, 0.68);
    position: absolute;
    bottom: 0;
    left: -65px;
  }

  .item-name {
    color: $hotbar-text-color;
    font-size: 14px;
    margin: 0 auto 15px;
    font-weight: 500;
    background-color: rgba($hotbar-base-color, .68);
    padding: 5px 8px;
    width: max-content;
  }

  .overlay-message {
    text-align: center;
    color: $hotbar-text-color;
    margin-bottom: 15px;
    overflow: hidden;
  }
</style>
