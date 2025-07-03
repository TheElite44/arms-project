<script lang="ts">
  import Player from './Player.svelte';
  import Player2 from './Player2.svelte';
  export let videoSrc: string = '';
  export let poster: string = '';
  export let subtitles: Array<any> = [];
  export let useArtPlayer: boolean = true;
  export let goToEpisode: (id: string) => void;
  export let onRefreshSource: (videoUrl: string) => void = () => {};
  export let intro: { start: number; end: number } | null = null;
  export let outro: { start: number; end: number } | null = null;
  export let autoSkipIntro: boolean = false;
</script>

<div class="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black flex items-center justify-center">
  {#key videoSrc}
    {#if useArtPlayer}
      <Player 
        src={videoSrc}
        poster={poster}
        subtitles={subtitles}
        playNext={goToEpisode}
        {intro}
        {outro}
        {autoSkipIntro}
      />
    {:else}
      <Player2 
        videoUrl={videoSrc}
        poster={poster}
        subtitles={subtitles}
        onRefreshSource={onRefreshSource}
        {intro}
        {outro}
        {autoSkipIntro}
      />
    {/if}
  {/key}
</div>