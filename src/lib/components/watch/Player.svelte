<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import Artplayer from 'artplayer';
  import Hls from 'hls.js';
  import { browser } from '$app/environment';

  export let src: string = '';
  export let poster: string = '';
  export let subtitles: Array<{ url: string; label: string; lang: string; kind: string; default?: boolean }> = [];
  export let autoNext: boolean = false;
  export let currentEpisodeIndex: number = 0;
  export let episodes: Array<{ id: string }> = [];
  export let playNext: (nextEpisodeId: string) => void = () => {};
  export let intro: { start: number; end: number } | null = null;
  export let outro: { start: number; end: number } | null = null;

  let art: any = null;
  let container: HTMLDivElement | null = null;
  let previousSrc: string | null = null;
  let isLoading: boolean = false;
  let error: string | null = null;

  async function fetchWatchData(episodeId: string, server: string = 'hd-1', category: string = 'sub') {
    console.log('🔄 Fetching watch data for episode:', episodeId);
    isLoading = true;
    error = null;

    const params = new URLSearchParams({
      action: 'sources',
      animeEpisodeId: episodeId,
      server,
      category,
    });

    const apiUrl = `/api/anime?${params.toString()}`;
    console.log('📡 API URL:', apiUrl);

    try {
      const resp = await fetch(apiUrl);
      console.log('📥 Response status:', resp.status);
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const json = await resp.json();
      console.log('📄 API Response:', json);

      if (json.success && json.data) {
        const sources = json.data.sources || [];
        const apiSubtitles = json.data.subtitles || [];

        console.log('📺 Found sources:', sources.length);
        console.log('📝 Found subtitles:', apiSubtitles.length);

        if (sources.length > 0) {
          const selectedSource = sources[0];
          src = selectedSource.url || '';
          
          console.log('✅ Selected source URL:', src);
          console.log('🎬 Source quality:', selectedSource.quality || 'unknown');

          // Validate URL
          if (!src || !isValidUrl(src)) {
            throw new Error('Invalid or empty source URL');
          }

          subtitles = (json.data.tracks ?? []).map((track: any) => ({
            url: track.file,
            label: track.label,
            lang: track.label?.split(' ')[0]?.toLowerCase() || 'en',
            kind: track.kind || 'subtitles',
            default: track.default ?? false,
          }));

          intro = json.data.intro || null;
          outro = json.data.outro || null;

          console.log('🎯 Updated subtitles:', subtitles);
          console.log('🎵 Intro/Outro info:', { intro, outro });

          // Create player after successful data fetch
          await createPlayer();
        } else {
          throw new Error('No video sources found in API response');
        }
      } else {
        throw new Error(json.error || json.message || 'API request failed');
      }
    } catch (err: any) {
      console.error('❌ Error fetching watch data:', err);
      error = err.message || 'Failed to load video data';
    } finally {
      isLoading = false;
    }
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async function createPlayer() {
    if (!container) {
      console.error('❌ Player container is not defined.');
      return;
    }

    if (!src) {
      console.log('⚠️ No source URL provided, skipping player creation.');
      return;
    }

    // Prevent re-creating the player if the src hasn't changed
    if (art && previousSrc === src) {
      console.log('✅ Player already initialized with the same src.');
      return;
    }

    // Destroy existing player instance
    if (art) {
      console.log('🗑️ Destroying existing Artplayer instance.');
      try {
        if (art.hls) {
          art.hls.destroy();
        }
        art.destroy();
      } catch (e) {
        console.warn('⚠️ Error destroying player:', e);
      }
      art = null;
    }

    console.log('🎬 Creating new Artplayer instance with src:', src);

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
      console.log('📝 Setting default subtitle:', defaultSubtitle);
    }

    try {
      art = new Artplayer(options);
      previousSrc = src;

      // Add event listeners for debugging
      art.on('ready', () => {
        console.log('✅ Artplayer ready');
      });

      art.on('video:loadstart', () => {
        console.log('🔄 Video loading started');
      });

      art.on('video:canplay', () => {
        console.log('✅ Video can play');
      });

      art.on('video:error', (error: any) => {
        console.error('❌ Video error:', error);
      });

      art.on('video:loadeddata', () => {
        console.log('📊 Video data loaded');
      });

      console.log('✅ Artplayer instance created successfully');
    } catch (error) {
      console.error('❌ Failed to create Artplayer instance:', error);
      throw error;
    }
  }

  const playM3u8 = (video: HTMLVideoElement, url: string | undefined, art: any) => {
    const safeUrl = url ?? '';

    if (!safeUrl) {
      console.error('❌ No URL provided for M3U8 playback');
      return;
    }

    console.log('🎵 Playing M3U8 stream:', safeUrl);

    if (Hls.isSupported()) {
      console.log('✅ HLS.js is supported');
      
      if (art.hls) {
        console.log('🗑️ Destroying existing HLS instance');
        art.hls.destroy();
      }

      const hls = new Hls({
        debug: false, // Set to true for more verbose logging
        enableWorker: true,
        lowLatencyMode: true,
        fragLoadingTimeOut: 20000,
        maxBufferLength: 30,
        startLevel: -1,
        capLevelToPlayerSize: true,
        // Add CORS settings
        xhrSetup: function (xhr: XMLHttpRequest, url: string) {
          console.log('🌐 XHR setup for URL:', url);
          // Add any custom headers if needed
        },
      });

      hls.loadSource(safeUrl);
      hls.attachMedia(video);
      art.hls = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log('✅ HLS manifest parsed successfully');
        console.log('📊 Available levels:', data.levels?.length || 0);
      });

      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
        console.log('📊 HLS level loaded:', data.level);
      });

      hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        console.log('🧩 Fragment loaded:', data.frag.url);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS.js error:', data);
        console.error('Error type:', data.type);
        console.error('Error details:', data.details);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 Trying to recover from network error');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Trying to recover from media error');
              hls.recoverMediaError();
              break;
            default:
              console.log('💥 Fatal error, destroying HLS');
              hls.destroy();
              break;
          }
        }
      });

      // Auto-next episode functionality
      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration - 5) {
          if (currentEpisodeIndex < episodes?.length - 1 && autoNext) {
            const nextEpisode = episodes[currentEpisodeIndex + 1];
            if (nextEpisode) {
              const episodeMatch = nextEpisode.id.match(/ep=(\d+)/);
              const nextEpisodeId = episodeMatch?.[1] ?? '';
              if (nextEpisodeId) {
                playNext(nextEpisodeId);
              }
            }
          }
        }
      });

    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log('✅ Using native HLS support');
      video.src = safeUrl;

      video.addEventListener('error', (e) => {
        console.error('❌ Native video error:', e);
      });

      video.addEventListener("timeupdate", () => {
        const currentTime = Math.round(video.currentTime);
        const duration = Math.round(video.duration);
        if (duration > 0 && currentTime >= duration - 5) {
          if (currentEpisodeIndex < episodes?.length - 1 && autoNext) {
            const nextEpisode = episodes[currentEpisodeIndex + 1];
            if (nextEpisode) {
              const episodeMatch = nextEpisode.id.match(/ep=(\d+)/);
              const nextEpisodeId = episodeMatch?.[1] ?? '';
              if (nextEpisodeId) {
                playNext(nextEpisodeId);
              }
            }
          }
        }
      });
    } else {
      console.error("❌ Unsupported playback format: m3u8");
      error = "Your browser doesn't support HLS playback";
    }
  };

  onMount(() => {
    console.log('🚀 Player component mounted');
    if (src) {
      createPlayer();
    }
  });

  afterUpdate(() => {
    console.log('🔄 Player component updated');
    if (src && src !== previousSrc) {
      createPlayer();
    }
  });

  onDestroy(() => {
    console.log('🗑️ Destroying player component');

    if (art) {
      try {
        if (art.hls) {
          art.hls.destroy();
        }
        art.destroy();
      } catch (e) {
        console.warn('⚠️ Error during player cleanup:', e);
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

  // Keyboard shortcuts
  if (browser) {
    document.addEventListener('keydown', (event) => {
      if (!art) return;

      switch (event.key.toLowerCase()) {
        case 'm':
          art.muted = !art.muted;
          console.log('🔇 Mute toggled:', art.muted);
          break;
        case 'f':
          art.fullscreen = !art.fullscreen;
          console.log('🖥️ Fullscreen toggled:', art.fullscreen);
          break;
        case ' ':
          event.preventDefault();
          if (art.playing) {
            art.pause();
            console.log('⏸️ Video paused');
          } else {
            art.play();
            console.log('▶️ Video playing');
          }
          break;
      }
    });
  }

  // Export fetchWatchData for external use
  export { fetchWatchData };
</script>

<div class="player-wrapper">
  {#if isLoading}
    <div class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading video...</p>
    </div>
  {/if}
  
  {#if error}
    <div class="error-overlay">
      <p class="error-message">❌ {error}</p>
      <button 
        class="retry-button" 
        on:click={() => {
          error = null;
          if (src) createPlayer();
        }}
      >
        🔄 Retry
      </button>
    </div>
  {/if}
  
  <div 
    bind:this={container} 
    class="w-full h-full rounded-xl overflow-hidden bg-black" 
    style="aspect-ratio:16/9"
  ></div>
</div>

<style>
  .player-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .loading-overlay,
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    z-index: 10;
    border-radius: 0.75rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #333;
    border-top: 4px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-message {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .retry-button {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  }

  .retry-button:hover {
    background: #4338ca;
  }
</style>