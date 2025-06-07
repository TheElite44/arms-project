<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Plyr from 'plyr';
  import 'plyr/dist/plyr.css';
  import Hls from 'hls.js';

  export let src: string = '';
  export let poster: string = '';
  export let title: string = '';
  export let subtitles: Array<{ url: string; label: string; lang: string; default?: boolean }> = [];
  export let playNext: (nextEpisodeId: string) => void = () => {};

  let videoEl: HTMLVideoElement | null = null;
  let player: Plyr | null = null;
  let hls: Hls | null = null;

  async function fetchWatchData(episodeId: string, server: string, category: string) {
    try {
      const params = new URLSearchParams({
        action: 'sources',
        animeEpisodeId: episodeId,
        server,
        category,
      });

      const apiUrl = `/api/anime?${params.toString()}`;
      console.log('Fetching data from:', apiUrl);

      const resp = await fetch(apiUrl);
      console.log('HTTP Status Code:', resp.status);

      const json = await resp.json();

      if (json.success) {
        console.log('API response successful');

        // Log which referer was used if available
        if (json.data && json.data.usedReferer) {
          console.log('✅ Successful request using referer:', json.data.usedReferer);
        }

        // Handle the correct data structure
        let sources = [];
        let apiSubtitles = [];

        if (json.data && json.data.sources) {
          // New format: { success: true, data: { sources: [...] } }
          sources = json.data.sources;
          apiSubtitles = json.data.subtitles || [];
        } else if (json.sources && json.sources.sources) {
          // Old format: { success: true, sources: { sources: [...] } }
          sources = json.sources.sources;
          apiSubtitles = json.sources.subtitles || [];
        }

        if (sources.length > 0) {
          src = sources[0].url;
          subtitles = apiSubtitles.map((sub: any) => ({
            url: sub.url,
            label: sub.label || sub.lang,
            lang: sub.lang,
            default: sub.default ?? false,
          }));

          console.log('Successfully fetched sources:', src);
        } else {
          console.error('No sources found in response');
          src = '';
          subtitles = [];
        }
      } else {
        console.error('Failed to fetch sources:', json.error);
        src = '';
        subtitles = [];
      }
    } catch (err) {
      console.error('Error fetching watch data:', err);
      src = '';
      subtitles = [];
    }
  }

  function proxiedM3u8(url: string) {
    if (!url) return url;
    if (url.endsWith('.m3u8')) {
      return `/api/proxy/m3u8?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  function setupSource() {
    if (!videoEl) {
      console.error('Video element is not defined.');
      return;
    }

    if (!src) {
      console.log('No source URL provided.');
      return;
    }

    // Always proxy m3u8
    const finalSrc = proxiedM3u8(src);

    console.log('Setting up video source:', finalSrc);

    // Clean up existing HLS instance
    if (hls) {
      console.log('Destroying existing HLS instance.');
      hls.destroy();
      hls = null;
    }

    if (finalSrc.endsWith('.m3u8') && Hls.isSupported()) {
      console.log('Using HLS.js for .m3u8 source.');

      hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        fragLoadingTimeOut: 20000,
        maxBufferLength: 30,
        startLevel: -1,
      });

      hls.loadSource(finalSrc);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS.js error:', data);
      });
    } else if (finalSrc) {
      console.log('Setting video source directly.');
      videoEl.src = finalSrc;

      videoEl.addEventListener('error', (e) => {
        console.error('Video element error:', e);
      });

      videoEl.addEventListener('canplay', () => {
        console.log('Video can play');
      });
    }
  }

  function updatePlyrSource() {
    if (!player || !videoEl || !src) return;

    // Always proxy m3u8
    const finalSrc = proxiedM3u8(src);

    try {
      player.source = {
        type: 'video',
        title,
        sources: [
          {
            src: finalSrc,
            type: finalSrc.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp4',
          },
        ],
        poster,
        tracks: subtitles.map((sub) => ({
          kind: 'subtitles' as const,
          label: sub.label || sub.lang,
          srclang: sub.lang,
          src: sub.url, // Optionally: proxiedM3u8(sub.url)
          default: sub.default ?? false,
        })),
      };

      console.log('Plyr source updated successfully');
    } catch (error) {
      console.error('Error updating Plyr source:', error);
    }
  }

  // Reactive statement to handle source changes
  $: if (src) {
    setupSource();
    updatePlyrSource();
  }

  onMount(() => {
    if (videoEl) {
      try {
        player = new Plyr(videoEl, {
          captions: { active: true, update: true, language: 'auto' },
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'captions',
            'settings',
            'fullscreen',
          ],
        });

        if (src) {
          setupSource();
          updatePlyrSource();
        }

        console.log('Plyr player initialized');
      } catch (error) {
        console.error('Error initializing Plyr:', error);
      }
    }
  });

  onDestroy(() => {
    console.log('Destroying Plyr player');

    if (player) {
      try {
        player.destroy();
      } catch (e) {
        console.warn('Error destroying Plyr:', e);
      }
      player = null;
    }

    if (hls) {
      try {
        hls.destroy();
      } catch (e) {
        console.warn('Error destroying HLS:', e);
      }
      hls = null;
    }
  });

  // Export fetchWatchData for external use
  export { fetchWatchData };
</script>

<div class="player-container">
  <video
    bind:this={videoEl}
    class="responsive-video"
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
</div>

<style>
  .player-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  :global(.plyr--video) {
    height: 100%;
  }

  :global(.plyr__video-wrapper) {
    height: 100%;
  }

  :global(.plyr video) {
    height: 100%;
    object-fit: contain;
  }

  .responsive-video {
    width: 100%;
    max-width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    border-radius: 0.75rem;
    background-color: black;
  }

  @media (max-width: 768px) {
    .responsive-video {
      aspect-ratio: 4 / 3;
    }
  }

  @media (max-width: 480px) {
    .responsive-video {
      aspect-ratio: 1 / 1;
    }
  }
</style>