<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import Artplayer from 'artplayer';
  import Hls from 'hls.js';

  export let src: string = '';
  export let poster: string = '';
  export let subtitles: Array<{ url: string; label: string; lang: string; default?: boolean }> = [];
  export let autoNext: boolean = false;
  export let currentEpisodeIndex: number = 0;
  export let episodes: Array<{ id: string }> = [];
  export let title: string = '';
  export let playNext: (nextEpisodeId: string) => void = () => {};

  let art: any = null;
  let container: HTMLDivElement | null = null;

  // Always use the proxy for m3u8
  $: proxiedSrc = src && src.startsWith('http')
    ? `https://ani-fire-m3u8-proxy.vercel.app/m3u8-proxy?url=${encodeURIComponent(src)}&headers=${encodeURIComponent('{"Referer":"https://hianimez.to/"}')}`
    : src;

  function createPlayer() {
    if (!container) return;

    // Destroy existing player instance
    if (art) {
      art.destroy();
      art = null;
    }

    const options: any = {
      container,
      url: proxiedSrc,
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
      options.subtitle = {
        url: subtitles[0].url,
        type: 'vtt',
        style: {
          color: '#fff',
          fontSize: '20px',
        },
        encoding: 'utf-8',
      };
    }

    art = new Artplayer(options);
  }

  const playM3u8 = (video: HTMLVideoElement, url: string, art: any) => {
    if (Hls.isSupported()) {
      if (art.hls) art.hls.destroy();
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      art.hls = hls;

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS.js error:", data);
      });

      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration) {
          art.pause();
          if (currentEpisodeIndex < episodes?.length - 1 && autoNext) {
            playNext(
              episodes[currentEpisodeIndex + 1].id.match(/ep=(\d+)/)?.[1]
            );
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration) {
          art.pause();
          if (currentEpisodeIndex < episodes?.length - 1 && autoNext) {
            playNext(
              episodes[currentEpisodeIndex + 1].id.match(/ep=(\d+)/)?.[1]
            );
          }
        }
      });
    } else {
      console.log("Unsupported playback format: m3u8");
    }
  };

  onMount(() => {
    createPlayer();
  });

  // Re-create player when src or subtitles change
  afterUpdate(() => {
    createPlayer();
  });

  onDestroy(() => {
    if (art) {
      art.destroy();
      art = null;
    }
  });

  let videoSrc: string = '';
  let currentServer: string = '';
  let servers: Array<{ serverName: string; category: 'sub' | 'dub' | 'raw' }> = [];

  async function fetchWatchData(episodeId: string, server: string, category: string) {
    try {
      const params = new URLSearchParams({
        animeEpisodeId: episodeId,
        server,
        category,
      });
      const resp = await fetch(`/api/episode/watch?${params.toString()}`);
      const json = await resp.json();

      if (json.success) {
        if (json.sources?.sources?.length > 0) {
          videoSrc = json.sources.sources[0].url;
          subtitles = (json.sources.subtitles ?? []).map((sub: any) => ({
            url: sub.url,
            label: sub.label || sub.lang,
            lang: sub.lang,
            default: sub.default ?? false,
          }));
        } else {
          videoSrc = '';
          subtitles = [];
        }

        if (json.servers) {
          servers = Object.entries(json.servers as Record<string, any[]>)
            .filter(([category]) => ['sub', 'dub', 'raw'].includes(category))
            .flatMap(([category, serverList]) =>
              serverList.map(server => ({
                ...server,
                category: category as 'sub' | 'dub' | 'raw',
              }))
            );

          // Set default server if none selected
          if (!currentServer) {
            const defaultServer = servers.find(s => s.category === category);
            if (defaultServer) {
              currentServer = defaultServer.serverName;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching watch data:', err);
      videoSrc = '';
      subtitles = [];
    }
  }
</script>

<div bind:this={container} class="w-full h-full rounded-xl overflow-hidden bg-black" style="aspect-ratio:16/9"></div>