<div class="button-container">
    <slot />
</div>

<style lang="scss">
    @use "../../../../colors.scss" as *;

    .button-container {
      background-color: rgba($menu-base-color, 0.68);
      padding: 15px 30px;
      width: max-content;
      border-radius: 0px;
      display: flex;
      column-gap: 20px;
    }
</style>