<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import Artplayer from 'artplayer';
  import Hls from 'hls.js';
  import { browser } from '$app/environment';

  // === TYPES ===
  interface Subtitle {
    url: string;
    label: string;
    lang: string;
    kind: string;
    default?: boolean;
  }

  interface Episode {
    id: string;
    [key: string]: any;
  }

  interface VideoSource {
    url: string;
    quality?: string;
    type?: string;
    [key: string]: any;
  }

  interface ApiResponse {
    success: boolean;
    data?: {
      sources?: VideoSource[];
      tracks?: any[];
      subtitles?: any[];
      [key: string]: any;
    };
    error?: string;
    message?: string;
  }

  // === PROPS ===
  export let src: string = '';
  export let poster: string = '';
  export let subtitles: Subtitle[] = [];
  export let autoNext: boolean = false;
  export let currentEpisodeIndex: number = 0;
  export let episodes: Episode[] = [];
  export let playNext: (nextEpisodeId: string) => void = () => {};

  export let videoUrl: string = '';
  export let videoType: string = 'application/x-mpegURL';

  // === STATE ===
  let art: any = null;
  let container: HTMLDivElement | null = null;
  let previousSrc: string | null = null;
  let isLoading: boolean = false;
  let error: string | null = null;
  let keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  let retryCount: number = 0;
  let currentSourceIndex: number = 0;
  let availableSources: VideoSource[] = [];

  // === CONSTANTS ===
  const HLS_CONFIG = {
    debug: false,
    enableWorker: true,
    lowLatencyMode: false, // Disable for better compatibility
    fragLoadingTimeOut: 30000, // Increased timeout
    maxBufferLength: 60, // Increased buffer
    startLevel: -1,
    capLevelToPlayerSize: true,
    maxLoadingDelay: 4,
    maxFragLookUpTolerance: 0.25,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: Infinity,
  } as const;

  const AUTO_NEXT_THRESHOLD = 5;
  const DEFAULT_VOLUME = 0.5;
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000;

  // === UTILITY FUNCTIONS ===
  const isValidUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const extractEpisodeId = (episodeId: string): string => {
    const match = episodeId.match(/ep=(\d+)/);
    return match?.[1] ?? '';
  };

  const filterValidSubtitles = (subs: Subtitle[]): Subtitle[] => {
    return (subs ?? []).filter(
      (sub) => sub && typeof sub.url === 'string' && sub.url.trim() !== ''
    );
  };

  const logPlayerEvent = (event: string, data?: any): void => {
    console.log(`🎬 Player: ${event}`, data || '');
  };

  const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // === API FUNCTIONS ===
  const fetchWatchData = async (
    episodeId: string, 
    server: string = 'hd-1', 
    category: string = 'sub'
  ): Promise<void> => {
    logPlayerEvent('Fetching watch data', { episodeId, server, category });
    
    isLoading = true;
    error = null;
    retryCount = 0;
    currentSourceIndex = 0;

    try {
      const params = new URLSearchParams({
        action: 'sources',
        animeEpisodeId: episodeId,
        server,
        category,
      });

      const apiUrl = `/api/anime?${params}`;
      logPlayerEvent('API Request', apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: ApiResponse = await response.json();
      logPlayerEvent('API Response', { success: json.success, hasData: !!json.data });

      if (!json.success || !json.data) {
        throw new Error(json.error || json.message || 'API request failed');
      }

      const sources = json.data.sources || [];
      if (sources.length === 0) {
        throw new Error('No video sources found');
      }

      // Store all available sources for fallback
      availableSources = sources.filter(source => source.url && isValidUrl(source.url));
      
      if (availableSources.length === 0) {
        throw new Error('No valid video sources found');
      }

      // Update subtitles
      subtitles = (json.data.tracks ?? []).map((track: any): Subtitle => ({
        url: track.file || '',
        label: track.label || 'Unknown',
        lang: track.label?.split(' ')[0]?.toLowerCase() || 'en',
        kind: track.kind || 'subtitles',
        default: track.default ?? false,
      }));

      logPlayerEvent('Data updated', { 
        sourceCount: availableSources.length,
        subtitleCount: subtitles.length 
      });

      // Try to create player with first source
      await tryNextSource();

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load video data';
      console.error('❌ Error fetching watch data:', err);
      error = errorMessage;
    } finally {
      isLoading = false;
    }
  };

  // === SOURCE MANAGEMENT ===
  const tryNextSource = async (): Promise<void> => {
    if (currentSourceIndex >= availableSources.length) {
      error = 'All video sources failed to load';
      return;
    }

    const source = availableSources[currentSourceIndex];
    src = source.url;
    
    logPlayerEvent('Trying source', { 
      index: currentSourceIndex + 1, 
      total: availableSources.length,
      quality: source.quality,
      url: source.url.substring(0, 100) + '...'
    });

    try {
      await createPlayer();
    } catch (err) {
      console.warn(`⚠️ Source ${currentSourceIndex + 1} failed:`, err);
      currentSourceIndex++;
      
      if (currentSourceIndex < availableSources.length) {
        logPlayerEvent('Trying next source');
        await sleep(1000); // Brief delay before trying next source
        await tryNextSource();
      } else {
        error = 'All video sources failed to load';
      }
    }
  };

  // === PLAYER MANAGEMENT ===
  const destroyPlayer = (): void => {
    if (!art) return;

    logPlayerEvent('Destroying player');
    
    try {
      // Remove event listeners
      if (art.video) {
        art.video.removeEventListener('error', handleVideoError);
      }
      
      // Destroy HLS instance
      if (art.hls) {
        art.hls.destroy();
        art.hls = null;
      }
      
      art.destroy();
    } catch (e) {
      console.warn('⚠️ Error destroying player:', e);
    } finally {
      art = null;
      previousSrc = null;
    }
  };

  const createPlayer = async (): Promise<void> => {
    if (!container || !src) {
      logPlayerEvent('Skipping player creation', { hasContainer: !!container, hasSrc: !!src });
      return;
    }

    // Prevent re-creating if source hasn't changed
    if (art && previousSrc === src) {
      logPlayerEvent('Player already exists with same source');
      return;
    }

    // Clean up existing player
    destroyPlayer();

    logPlayerEvent('Creating player', src.substring(0, 100) + '...');

    try {
      const validSubtitles = filterValidSubtitles(subtitles);
      const defaultSubtitle = validSubtitles.find(sub => sub.default) || validSubtitles[0];

      const options: any = {
        container,
        url: src,
        poster,
        volume: DEFAULT_VOLUME,
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
        muted: false,
        loop: false,
        customType: {
          m3u8: playM3u8,
        },
      };

      // Add subtitle if available
      if (defaultSubtitle && defaultSubtitle.url) {
        options.subtitle = {
          url: defaultSubtitle.url,
          type: 'vtt',
          style: {
            color: '#fff',
            fontSize: '20px',
          },
          encoding: 'utf-8',
        };
        logPlayerEvent('Setting default subtitle', defaultSubtitle.label);
      }

      art = new Artplayer(options);
      previousSrc = src;

      setupPlayerEventListeners();
      
      // Add video error handler
      if (art.video) {
        art.video.addEventListener('error', handleVideoError);
      }

      logPlayerEvent('Player created successfully');

    } catch (err) {
      console.error('❌ Failed to create player:', err);
      throw err;
    }
  };

  const handleVideoError = async (event: Event): Promise<void> => {
    const videoElement = event.target as HTMLVideoElement;
    const videoError = videoElement.error;
    
    if (!videoError) return;

    logPlayerEvent('Video error detected', { 
      code: videoError.code, 
      message: videoError.message,
      retryCount,
      currentSourceIndex 
    });

    // If we haven't exhausted retries for current source, try again
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      retryCount++;
      logPlayerEvent(`Retrying current source (attempt ${retryCount})`);
      await sleep(RETRY_DELAY);
      
      if (art) {
        art.url = src; // Reload same source
      }
      return;
    }

    // Try next source if available
    if (currentSourceIndex + 1 < availableSources.length) {
      currentSourceIndex++;
      retryCount = 0;
      logPlayerEvent('Switching to next source');
      await tryNextSource();
    } else {
      error = 'Video playback failed - all sources exhausted';
    }
  };

  const setupPlayerEventListeners = (): void => {
    if (!art) return;

    art.on('ready', () => {
      logPlayerEvent('Ready');
      error = null; // Clear any previous errors
    });
    
    art.on('video:loadstart', () => logPlayerEvent('Load started'));
    art.on('video:canplay', () => logPlayerEvent('Can play'));
    art.on('video:loadeddata', () => logPlayerEvent('Data loaded'));
    
    art.on('video:error', (errorEvent: any) => {
      console.error('❌ Video error event:', errorEvent);
      // handleVideoError will be called by the video element's error event
    });
  };

  // === HLS PLAYBACK ===
  const playM3u8 = (video: HTMLVideoElement, url: string | undefined, art: any): void => {
    const safeUrl = url ?? '';

    if (!safeUrl) {
      console.error('❌ No URL provided for M3U8 playback');
      return;
    }

    logPlayerEvent('Playing M3U8 stream', safeUrl.substring(0, 100) + '...');

    if (Hls.isSupported()) {
      setupHlsPlayback(video, safeUrl, art);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      setupNativeHlsPlayback(video, safeUrl);
    } else {
      console.error('❌ HLS playback not supported');
      throw new Error("Your browser doesn't support HLS playback");
    }
  };

  const setupHlsPlayback = (video: HTMLVideoElement, url: string, art: any): void => {
    logPlayerEvent('Using HLS.js');

    // Clean up existing HLS instance
    if (art.hls) {
      art.hls.destroy();
    }

    const hls = new Hls({
      ...HLS_CONFIG,
      xhrSetup: (xhr: XMLHttpRequest, requestUrl: string) => {
        // Add timeout to prevent hanging requests
        xhr.timeout = 30000;
        logPlayerEvent('XHR setup', requestUrl.substring(0, 100) + '...');
      },
    });

    hls.loadSource(url);
    hls.attachMedia(video);
    art.hls = hls;

    setupHlsEventListeners(hls);
    setupAutoNextListener(video);
  };

  const setupNativeHlsPlayback = (video: HTMLVideoElement, url: string): void => {
    logPlayerEvent('Using native HLS support');
    
    video.src = url;
    setupAutoNextListener(video);
  };

  const setupHlsEventListeners = (hls: any): void => {
    hls.on(Hls.Events.MANIFEST_PARSED, (event: any, data: any) => {
      logPlayerEvent('HLS manifest parsed', { levels: data.levels?.length || 0 });
    });

    hls.on(Hls.Events.LEVEL_LOADED, (event: any, data: any) => {
      logPlayerEvent('HLS level loaded', data.level);
    });

    hls.on(Hls.Events.ERROR, (event: any, data: any) => {
      console.error('❌ HLS error:', data);
      handleHlsError(hls, data);
    });
  };

  const handleHlsError = async (hls: any, data: any): Promise<void> => {
    if (!data.fatal) {
      logPlayerEvent('Non-fatal HLS error', data.type);
      return;
    }

    logPlayerEvent('Fatal HLS error', { type: data.type, details: data.details });

    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR:
        logPlayerEvent('Recovering from network error');
        try {
          hls.startLoad();
        } catch (e) {
          console.warn('Failed to recover from network error:', e);
          await handleSourceFailure();
        }
        break;
        
      case Hls.ErrorTypes.MEDIA_ERROR:
        logPlayerEvent('Recovering from media error');
        try {
          hls.recoverMediaError();
        } catch (e) {
          console.warn('Failed to recover from media error:', e);
          await handleSourceFailure();
        }
        break;
        
      default:
        logPlayerEvent('Unrecoverable HLS error');
        await handleSourceFailure();
        break;
    }
  };

  const handleSourceFailure = async (): Promise<void> => {
    if (currentSourceIndex + 1 < availableSources.length) {
      currentSourceIndex++;
      retryCount = 0;
      logPlayerEvent('Switching to next source due to HLS error');
      await tryNextSource();
    } else {
      error = 'Video streaming failed - all sources exhausted';
    }
  };

  const setupAutoNextListener = (video: HTMLVideoElement): void => {
    const handleTimeUpdate = () => {
      if (!autoNext || !episodes.length) return;

      const currentTime = Math.round(video.currentTime);
      const duration = Math.round(video.duration);
      
      if (duration > 0 && currentTime >= duration - AUTO_NEXT_THRESHOLD) {
        const nextEpisodeIndex = currentEpisodeIndex + 1;
        
        if (nextEpisodeIndex < episodes.length) {
          const nextEpisode = episodes[nextEpisodeIndex];
          const nextEpisodeId = extractEpisodeId(nextEpisode.id);
          
          if (nextEpisodeId) {
            logPlayerEvent('Auto-playing next episode', nextEpisodeId);
            playNext(nextEpisodeId);
          }
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
  };

  // === KEYBOARD SHORTCUTS ===
  const setupKeyboardShortcuts = (): void => {
    if (!browser) return;

    keydownHandler = (event: KeyboardEvent) => {
      if (!art) return;

      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'm':
          event.preventDefault();
          art.muted = !art.muted;
          logPlayerEvent('Mute toggled', art.muted);
          break;
        case 'f':
          event.preventDefault();
          art.fullscreen = !art.fullscreen;
          logPlayerEvent('Fullscreen toggled', art.fullscreen);
          break;
        case ' ':
          event.preventDefault();
          if (art.playing) {
            art.pause();
            logPlayerEvent('Paused');
          } else {
            art.play();
            logPlayerEvent('Playing');
          }
          break;
        case 'arrowleft':
          event.preventDefault();
          art.currentTime = Math.max(0, art.currentTime - 10);
          logPlayerEvent('Seek backward 10s');
          break;
        case 'arrowright':
          event.preventDefault();
          art.currentTime = Math.min(art.duration, art.currentTime + 10);
          logPlayerEvent('Seek forward 10s');
          break;
      }
    };

    document.addEventListener('keydown', keydownHandler);
  };

  const removeKeyboardShortcuts = (): void => {
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
  };

  // === EVENT HANDLERS ===
  const handleRetry = async (): Promise<void> => {
    error = null;
    retryCount = 0;
    currentSourceIndex = 0;
    
    if (availableSources.length > 0) {
      await tryNextSource();
    } else if (src) {
      await createPlayer();
    }
  };

  // === LIFECYCLE ===
  onMount(() => {
    logPlayerEvent('Component mounted');
    setupKeyboardShortcuts();
    
    if (src) {
      createPlayer();
    }
  });

  afterUpdate(() => {
    if (src && src !== previousSrc) {
      logPlayerEvent('Source changed, recreating player');
      createPlayer();
    }
  });

  onDestroy(() => {
    logPlayerEvent('Component destroying');
    destroyPlayer();
    removeKeyboardShortcuts();
  });

  // === EXPORTS ===
  export { fetchWatchData };
</script>

<div class="player-wrapper">
  {#if isLoading}
    <div class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading video...</p>
      {#if availableSources.length > 0}
        <p class="text-sm opacity-75">
          Trying source {currentSourceIndex + 1} of {availableSources.length}
        </p>
      {/if}
    </div>
  {/if}
  
  {#if error}
    <div class="error-overlay">
      <p class="error-message">❌ {error}</p>
      <div class="error-actions">
        <button class="retry-button" on:click={handleRetry}>
          🔄 Retry
        </button>
        {#if availableSources.length > 1 && currentSourceIndex + 1 < availableSources.length}
          <button class="retry-button secondary" on:click={() => {currentSourceIndex++; handleRetry();}}>
            ⏭️ Try Next Source
          </button>
        {/if}
      </div>
      {#if availableSources.length > 0}
        <p class="text-xs opacity-60 mt-2">
          {availableSources.length} source(s) available
        </p>
      {/if}
    </div>
  {/if}
  
  <div
    bind:this={container}
    class="w-full h-full rounded-xl overflow-hidden bg-black"
    style="width: 100%; height: 100%; aspect-ratio: 16/9;"
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
    background: rgba(0, 0, 0, 0.9);
    color: white;
    z-index: 10;
    border-radius: 0.75rem;
    padding: 2rem;
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
    margin-bottom: 1.5rem;
    text-align: center;
    max-width: 400px;
    line-height: 1.4;
  }

  .error-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .retry-button {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    min-width: 120px;
  }

  .retry-button:hover {
    background: #4338ca;
    transform: translateY(-1px);
  }

  .retry-button:active {
    transform: translateY(0);
  }

  .retry-button.secondary {
    background: #6b7280;
  }

  .retry-button.secondary:hover {
    background: #4b5563;
  }

  .text-sm {
    font-size: 0.875rem;
  }

  .text-xs {
    font-size: 0.75rem;
  }

  .opacity-75 {
    opacity: 0.75;
  }

  .opacity-60 {
    opacity: 0.6;
  }

  .mt-2 {
    margin-top: 0.5rem;
  }
</style>