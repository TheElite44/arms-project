<script lang="ts">
  export let src: string = '';
  export let poster: string = '';
</script>

<div class="media-player">
  <media-player
    src={src}
    poster={poster}
    controls
    class="w-full h-full"
  >
    <video slot="media" class="w-full h-full"></video>
  </media-player>
</div>

<style>
  .media-player {
    background-color: black;
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .media-player video {
    width: 100%;
    height: 100%;
  }
</style>