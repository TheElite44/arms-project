<script lang="ts">
  // Register Vidstack custom elements (side effect import)
  import 'vidstack/elements';

  export let src: string;
  export let poster: string = '';
  export let title: string = '';
  export let subtitles: Array<{ url: string; label: string; lang: string; default?: boolean }> = [];
</script>

<media-player
  src={src}
  poster={poster}
  title={title}
  controls
  aspect-ratio="16/9"
  crossorigin
>
  <media-provider></media-provider>
  {#each subtitles as sub}
    <track
      kind="subtitles"
      src={sub.url}
      label={sub.label}
      srclang={sub.lang}
      default={sub.default}
    />
  {/each}
  <media-poster></media-poster>
</media-player>