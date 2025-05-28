<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import Artplayer from 'artplayer';
  import Hls from 'hls.js';
  import { browser } from '$app/environment';

  export let src: string = '';
  export let poster: string = '';
  export let subtitles: Array<{ url: string; label: string; kind: string; default?: boolean }> = [];
  export let autoNext: boolean = false;
  export let currentEpisodeIndex: number = 0;
  export let episodes: Array<{ id: string }> = [];
  export let playNext: (nextEpisodeId: string) => void = () => {};
  export let intro: { start: number; end: number } | null = null;
  export let outro: { start: number; end: number } | null = null;

  let art: any = null;
  let container: HTMLDivElement | null = null;
  let previousSrc: string | null = null;

  async function fetchWatchData(episodeId: string, server: string, category: string) {
    const params = new URLSearchParams({
      action: 'sources',
      animeEpisodeId: episodeId,
      server,
      category,
    });

    const apiUrl = `/api/anime?${params.toString()}`;
    console.log('Fetching watch data from:', apiUrl);

    try {
      const resp = await fetch(apiUrl);
      const json = await resp.json();

      if (json.success && json.data) {
        console.log('Fetched watch data successfully:', json.data);

        const sources = json.data.sources || [];
        const apiSubtitles = json.data.subtitles || [];

        if (sources.length > 0) {
          src = sources[0].url || '';
          console.log('Setting video source to:', src);
        } else {
          console.error('No sources found in API response');
          return;
        }

        subtitles = apiSubtitles.map((sub: any) => ({
          url: sub.url,
          label: sub.label || sub.lang || 'Unknown',
          kind: 'subtitles',
          default: sub.default ?? false,
        }));

        intro = json.data.intro || null;
        outro = json.data.outro || null;

        console.log('Updated subtitles:', subtitles);
        console.log('Intro:', intro);
        console.log('Outro:', outro);

        createPlayer();
      } else {
        console.error('API request failed:', json.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching watch data:', err);
    }
  }

  function createPlayer() {
    if (!container) {
      console.error('Player container is not defined.');
      return;
    }

    if (!src) {
      console.log('No source URL provided, skipping player creation.');
      return;
    }

    // Prevent re-creating the player if the `src` hasn't changed
    if (art && previousSrc === src) {
      console.log('Player already initialized with the same src.');
      return;
    }

    // Destroy existing player instance if it exists
    if (art) {
      console.log('Destroying existing Artplayer instance.');
      try {
        if (art.hls) {
          art.hls.destroy();
        }
        art.destroy();
      } catch (e) {
        console.warn('Error destroying player:', e);
      }
      art = null;
    }

    console.log('Creating new Artplayer instance with src:', src);

    const options: any = {
      container,
      url: src,
      poster,
      volume: 0.5,
      autoplay: false,
      pip: true,
      screenshot: true,
      setting: true,
      fullscreen: true,
      miniProgressBar: true,
      hotkey: true,
      lock: true,
      playbackRate: true,
      aspectRatio: true,
      customType: {
        m3u8: playM3u8,
      },
    };

    // Add subtitles if available
    if (subtitles?.length > 0) {
      const defaultSubtitle = subtitles.find((sub) => sub.default) || subtitles[0];
      options.subtitle = {
        url: defaultSubtitle.url,
        type: 'vtt',
        style: {
          color: '#fff',
          fontSize: '20px',
        },
        encoding: 'utf-8',
      };
      console.log('Setting default subtitle:', defaultSubtitle);
    }

    try {
      art = new Artplayer(options);
      previousSrc = src;

      console.log('Artplayer instance created successfully');
    } catch (error) {
      console.error('Failed to create Artplayer instance:', error);
    }
  }

  const playM3u8 = (video: HTMLVideoElement, url: string | undefined, art: any) => {
    const safeUrl = url ?? '';

    if (!safeUrl) {
      console.error('No URL provided for M3U8 playback');
      return;
    }

    console.log('Playing M3U8 stream:', safeUrl);

    if (Hls.isSupported()) {
      if (art.hls) {
        art.hls.destroy();
      }

      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        fragLoadingTimeOut: 20000, // 20-second timeout for fragment loading
        maxBufferLength: 30, // 30 seconds of buffer
        startLevel: -1, // Auto quality selection
      });

      hls.loadSource(safeUrl);
      hls.attachMedia(video);
      art.hls = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed successfully');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS.js error:", data);
      });

      // Auto-next episode functionality
      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration - 5) {
          if (currentEpisodeIndex < episodes?.length - 1 && autoNext) {
            const nextEpisode = episodes[currentEpisodeIndex + 1];
            if (nextEpisode) {
              playNext(nextEpisode.id.match(/ep=(\d+)/)?.[1] ?? '');
            }
          }
        }
      });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log('Using native HLS support');
      video.src = safeUrl;

      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration - 5) {
          if (currentEpisodeIndex < episodes?.length - 1 && autoNext) {
            const nextEpisode = episodes[currentEpisodeIndex + 1];
            if (nextEpisode) {
              playNext(nextEpisode.id.match(/ep=(\d+)/)?.[1] ?? '');
            }
          }
        }
      });
    } else {
      console.error("Unsupported playback format: m3u8");
    }
  };

  onMount(() => {
    console.log('Player mounted.');
    if (src) {
      createPlayer();
    }
  });

  afterUpdate(() => {
    console.log('Player updated.');
    if (src && src !== previousSrc) {
      createPlayer();
    }
  });

  onDestroy(() => {
    console.log('Destroying player component');

    if (art) {
      try {
        if (art.hls) {
          art.hls.destroy();
        }
        art.destroy();
      } catch (e) {
        console.warn('Error during player cleanup:', e);
      }
      art = null;
    }
  });

  // Build chapters array
  const chapters = [];
  if (intro && intro.start !== 0 && intro.end !== 0) {
    chapters.push({ start: intro.start, end: intro.end, title: 'Intro' });
  }
  if (outro && outro.start !== 0 && outro.end !== 0) {
    chapters.push({ start: outro.start, end: outro.end, title: 'Outro' });
  }
  console.log('Chapters:', chapters);

  // Keyboard shortcuts
  if (browser) {
    document.addEventListener('keydown', (event) => {
      if (!art) return;

      switch (event.key.toLowerCase()) {
        case 'm':
          if (art.muted) {
            art.muted = false;
          } else {
            art.muted = true;
          }
          console.log('Mute toggled');
          break;
        case 'f':
          art.fullscreen = !art.fullscreen;
          console.log('Fullscreen toggled');
          break;
        case ' ':
          event.preventDefault();
          if (art.playing) {
            art.pause();
          } else {
            art.play();
          }
          break;
      }
    });
  }
</script>

<div bind:this={container} class="w-full h-full rounded-xl overflow-hidden bg-black" style="aspect-ratio:16/9"></div>