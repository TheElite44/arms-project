<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Plyr from 'plyr';
  import 'plyr/dist/plyr.css';
  import Hls from 'hls.js';

  export let src: string = '';
  export let poster: string = '';
  export let title: string = '';
  export let subtitles: Array<{ url: string; label: string; lang: string; default?: boolean }> = [];

  let videoEl: HTMLVideoElement | null = null;
  let player: Plyr | null = null;
  let hls: Hls | null = null;

  function setupSource() {
    if (!videoEl) return;

    // Clean up previous HLS instance
    if (hls) {
      hls.destroy();
      hls = null;
    }

    // HLS for non-Safari browsers
    if (src && src.endsWith('.m3u8') && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoEl);
    } else if (src) {
      videoEl.src = src;
    }
  }

  // Update Plyr source (for poster, tracks, etc)
  function updatePlyrSource() {
    if (!player || !videoEl) return;
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
        kind: 'subtitles' as const,
        label: sub.label || sub.lang,
        srclang: sub.lang,
        src: sub.url,
        default: sub.default ?? false
      }))
    };
  }

  // React to src/subtitles changes
  $: {
    setupSource();
    updatePlyrSource();
  }

  onMount(() => {
    if (videoEl) {
      player = new Plyr(videoEl, {
        captions: { active: true, update: true, language: 'auto' }
      });
      setupSource();
      updatePlyrSource();
    }
  });

  onDestroy(() => {
    player?.destroy();
    hls?.destroy();
  });
</script>

<video
  bind:this={videoEl}
  class="w-full rounded-xl bg-black"
  controls
  playsinline
  poster={poster}
  crossorigin="anonymous"
  on:canplay={() => console.log('Video is ready to play!')}
  on:error={() => console.error('Video failed to load or play!', videoEl?.error)}
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