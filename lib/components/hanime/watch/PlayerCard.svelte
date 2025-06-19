<script lang="ts">
  import Player from './Player.svelte';
  export let videoSrc: string = '';
  export let poster: string = '';
  export let subtitles: Array<{ url: string; label: string; lang: string; kind: string; default?: boolean }> = [];
  export const useArtPlayer: boolean = true;
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

  // Prevent spacebar from pausing video when an input is focused (client only)
  import { onMount, onDestroy } from 'svelte';
  function preventSpaceOnInput(e: KeyboardEvent) {
    if (
      (e.key === ' ' || e.code === 'Space') &&
      (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA')
    ) {
      e.stopPropagation();
    }
  }
  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', preventSpaceOnInput, true);
    }
  });
  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', preventSpaceOnInput, true);
    }
  });
</script>

<div class="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
  {#key videoSrc}
    <Player 
      src={videoSrc} 
      poster={poster} 
      subtitles={mergedSubtitles} 
    />
  {/key}
</div>