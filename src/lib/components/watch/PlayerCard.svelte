<script lang="ts">
  import Player from './Player.svelte';
  import Player2 from './Player2.svelte';
  export let videoSrc: string = '';
  export let poster: string = '';
  export let subtitles: Array<{
    url: string;
    label: string;
    lang: string;
    kind: 'subtitles' | 'metadata' | 'captions' | 'chapters' | 'descriptions';
    default?: boolean;
  }> = [];
  export let useArtPlayer: boolean = true;
  export let goToEpisode: (id: string) => void;

  $: console.log('Original subtitles:', subtitles);
</script>

<div class="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black flex items-center justify-center">
  {#key videoSrc}
    {#if useArtPlayer}
      <Player 
        src={videoSrc}
        poster={poster}
        subtitles={subtitles}
        playNext={goToEpisode}
      />
    {:else}
      <Player2 
        videoUrl={videoSrc}
        poster={poster}
        subtitles={subtitles}
      />
    {/if}
  {/key}
</div>