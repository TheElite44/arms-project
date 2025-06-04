<script lang="ts">
  import Player from './Player.svelte';
  export let videoSrc: string = '';
  export let poster: string = '';
  export let subtitles: Array<{ url: string; label: string; lang: string; kind: string; default?: boolean }> = [];
  export let intro: { start: number; end: number } | null = null;
  export let outro: { start: number; end: number } | null = null;
  export let useArtPlayer: boolean = true;
  export let goToEpisode: (id: string) => void;
</script>

<div class="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
  {#key videoSrc}
    <Player 
      src={videoSrc} 
      poster={poster} 
      subtitles={subtitles} 
      intro={intro} 
      outro={outro} 
      playNext={goToEpisode} 
    />
  {/key}
</div>