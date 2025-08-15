<script lang="ts">
  import Player from './Player.svelte';
  export let videoSrc: string = '';
  export let poster: string = '';
  export let subtitles: Array<{ url: string; label: string; lang: string; kind: string; default?: boolean }> = [];
  export let srtUrl: string | null = null;

  // Merge srtUrl into subtitles if provided
  $: mergedSubtitles = [
    ...(subtitles ?? []),
    ...(srtUrl
      ? [{
          url: srtUrl,
          label: 'English',
          lang: 'en',
          kind: 'subtitles',
          default: subtitles.length === 0 // default if no other subs
        }]
      : [])
  ];
</script>

<div class="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
  <Player 
    src={videoSrc} 
    poster={poster} 
    subtitles={mergedSubtitles} 
  />
</div>