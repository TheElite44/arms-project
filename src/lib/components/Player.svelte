<script lang="ts">
  import { onMount } from 'svelte';
  import Plyr from 'plyr';
  import 'plyr/dist/plyr.css';

  export let src: string;
  export let poster: string = '';
  export let title: string = '';
  export let subtitles: Array<{ url: string; label: string; lang: string; default?: boolean }> = [];

  let videoEl: HTMLVideoElement | null = null;
  let player: Plyr | null = null;

  function setSource() {
    if (player && videoEl && src) {
      player.source = {
        type: 'video',
        title,
        sources: [
          {
            src,
            type: src.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4'
          }
        ],
        poster,
        tracks: subtitles.map(sub => ({
          kind: 'subtitles',
          label: sub.label || sub.lang,
          srclang: sub.lang,
          src: sub.url,
          default: sub.default ?? false
        }))
      };
    }
  }

  onMount(() => {
    if (videoEl) {
      player = new Plyr(videoEl, {
        captions: { active: true, update: true, language: 'auto' }
      });
      setSource();
    }
    return () => {
      player?.destroy();
    };
  });

  $: setSource();
</script>

<video
  bind:this={videoEl}
  class="w-full rounded-xl bg-black"
  controls
  playsinline
  poster={poster}
  crossorigin="anonymous"
>
  {#each subtitles as sub}
    <track
      kind="subtitles"
      label={sub.label || sub.lang}
      srclang={sub.lang}
      src={sub.url}
      default={sub.default ?? false}
    />
  {/each}
</video>