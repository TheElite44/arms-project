<script lang="ts">
  import Player from './Player.svelte';
  import Player2 from './Player2.svelte';
  export let videoSrc: string = '';
  export let poster: string = '';
  // subtitles: Array<{ url, label, lang, kind, default? }>
  export let subtitles: Array<{ url: string; label: string; lang: string; kind: string; default?: boolean }> = [];
  export let intro: { start: number; end: number } | null = null;
  export let outro: { start: number; end: number } | null = null;
  export let useArtPlayer: boolean = true;
  export let goToEpisode: (id: string) => void;
</script>

<div class="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
  {#key videoSrc}
    {#if useArtPlayer}
      <Player 
        src={videoSrc}
        poster={poster}
        subtitles={subtitles}
        intro={intro}
        outro={outro}
        playNext={goToEpisode}
      />
    {:else}
      <Player2 
        src={videoSrc}
        poster={poster}
        subtitles={subtitles}
        playNext={goToEpisode}
      />
    {/if}
  {/key}
</div>