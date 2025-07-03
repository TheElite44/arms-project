<script lang="ts">
/// <reference path="../../lib/types/screen-orientation.d.ts" />
  import { onMount, onDestroy } from 'svelte';
  import Plyr from 'plyr';
  import 'plyr/dist/plyr.css';
  import Hls from 'hls.js';

  export let videoUrl: string = '';
  export let videoType: string = 'application/x-mpegURL';
  export let subtitles: Array<{
    src: string;
    label: string;
    srclang?: string;
  }> = [];
  export let poster: string = '';
  export let thumbnailsVtt: string = ''; // <-- add this
  export let onRefreshSource: (videoUrl: string) => void = () => {};

  export let intro: { start: number; end: number } | null = null;
  export let autoSkipIntro: boolean = false;

  let videoRef: HTMLVideoElement | null = null;
  let plyr: Plyr | null = null;
  let hls: Hls | null = null;
  let lastVideoUrl = '';
  let lastSubtitles: string = '';
  let selectedLanguage = 'auto';
  let loading = false;
  let buffering = false;

  function cleanup() {
    if (plyr) {
      plyr.destroy();
      plyr = null;
    }
    if (hls) {
      hls.destroy();
      hls = null;
    }
  }

  // Dynamic language code detection and mapping
  function getLanguageCode(lang: string): string {
    if (!lang) return 'en';
    if (/^[a-z]{2}(-[A-Z]{2})?(-[a-z0-9]+)?$/i.test(lang)) {
      return lang.toLowerCase();
    }
    const langMap: { [key: string]: string } = {
      'english': 'en',
      'spanish': 'es',
      'french': 'fr',
      'german': 'de',
      'italian': 'it',
      'portuguese': 'pt',
      'russian': 'ru',
      'arabic': 'ar',
      'japanese': 'ja',
      'korean': 'ko',
      'chinese': 'zh',
      'dutch': 'nl',
      'turkish': 'tr',
      'hindi': 'hi',
      'bengali': 'bn',
      'urdu': 'ur',
      'thai': 'th',
      'vietnamese': 'vi',
      'polish': 'pl',
      'czech': 'cs',
      'hungarian': 'hu',
      'finnish': 'fi',
      'swedish': 'sv',
      'norwegian': 'no',
      'danish': 'da',
      'greek': 'el',
      'hebrew': 'he',
      'indonesian': 'id',
      'malay': 'ms',
      'filipino': 'tl',
      'tagalog': 'tl',
      'brazilian': 'pt-BR',
      'brazil': 'pt-BR',
      'latin': 'es-419',
      'mexico': 'es-MX',
      'canadian': 'en-CA',
      'british': 'en-GB',
      'american': 'en-US',
      'simplified': 'zh-CN',
      'traditional': 'zh-TW',
      'mandarin': 'zh',
      'cantonese': 'zh-HK'
    };
    const normalized = lang.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (langMap[normalized]) return langMap[normalized];
    for (const [key, code] of Object.entries(langMap)) {
      if (normalized.includes(key) || key.includes(normalized)) return code;
    }
    const firstWord = normalized.split(' ')[0];
    if (langMap[firstWord]) return langMap[firstWord];
    if (firstWord.length >= 2) {
      const potential = firstWord.slice(0, 2);
      const validCodes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'ja', 'ko', 'zh', 'hi', 'th', 'vi'];
      if (validCodes.includes(potential)) return potential;
    }
    return 'en';
  }

  function processSubtitleUrl(url: string): string {
    return url;
  }

  function addSubtitleTracks() {
    if (!videoRef) return;
    // Remove existing tracks
    const existingTracks = videoRef.querySelectorAll('track');
    existingTracks.forEach(track => track.remove());

    // Enhanced logic for handling duplicate English subtitles
    const englishSubs = subtitles.filter(
      (subtitle) => getLanguageCode(subtitle.label) === 'en'
    );

    // Track counter for duplicate language codes
    const languageCounters: { [key: string]: number } = {};
    
    subtitles.forEach((subtitle, index) => {
      const track = document.createElement('track');
      track.kind = 'captions';
      track.src = processSubtitleUrl(subtitle.src);
      
      const langCode = getLanguageCode(subtitle.label);
      
      // Handle duplicate language codes by appending a counter
      if (languageCounters[langCode]) {
        languageCounters[langCode]++;
        track.srclang = `${langCode}-${languageCounters[langCode]}`;
      } else {
        languageCounters[langCode] = 1;
        track.srclang = langCode;
      }
      
      // Use the original label to preserve distinction between duplicates
      track.label = subtitle.label;

      // Enhanced default selection logic
      // Set the first English subtitle as default if multiple exist
      // Or set as default if it's the only English subtitle
      if (langCode === 'en') {
        if (englishSubs.length === 1) {
          // Single English subtitle - set as default
          track.default = true;
        } else if (englishSubs.length > 1 && index === subtitles.findIndex(s => getLanguageCode(s.label) === 'en')) {
          // Multiple English subtitles - set the first one as default
          track.default = true;
        } else {
          track.default = false;
        }
      } else {
        track.default = false;
      }

      if (videoRef) {
        videoRef.appendChild(track);
      }
    });

    // Log subtitle tracks for debugging
    console.log('Added subtitle tracks:', subtitles.map((sub, i) => ({
      index: i,
      label: sub.label,
      langCode: getLanguageCode(sub.label),
      src: sub.src
    })));
  }

  function initializePlayer() {
    if (!videoRef) return;
    cleanup();
    addSubtitleTracks();

    if (Hls.isSupported() && videoType === 'application/x-mpegURL') {
      hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!videoRef) return;

        // Get available quality levels (resolutions)
        const availableQualities = hls
          ? hls.levels
              .map((l) => l.height)
              .filter((v, i, a) => a.indexOf(v) === i)
              .sort((a, b) => b - a)
          : [];

        plyr = new Plyr(videoRef, {
          controls: [
            'play-large', 'play', 'progress', 'current-time', 'mute', 'volume',
            'captions', 'settings', 'quality', 'fullscreen'
          ],
          captions: { 
            active: false, 
            language: 'auto',
            update: true 
          },
          settings: ['captions', 'quality', 'speed'],
          quality: {
            default: availableQualities[0],
            options: availableQualities,
            forced: true,
            onChange: (newQuality) => {
              if (hls) {
                const levelIndex = hls.levels.findIndex((l) => l.height === newQuality);
                hls.currentLevel = levelIndex;
              }
            }
          }
        });

        // Sync Plyr UI with hls.js when user changes quality from Plyr menu
        plyr.on('qualitychange', (event) => {
          if (hls) {
            const newQuality = event.detail.plyr.quality;
            const levelIndex = hls.levels.findIndex((l) => l.height === newQuality);
            hls.currentLevel = levelIndex;
          }
        });

        setupOrientationHandling();
        setupCaptionEvents();
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // Notify parent to delete cache and refetch sources
          onRefreshSource(videoUrl);
        }
      });
    } else {
      if (!videoRef) return;
      videoRef.src = videoUrl;
      videoRef.addEventListener('loadedmetadata', () => {
        if (!videoRef) return;
        plyr = new Plyr(videoRef, {
          controls: [
            'play-large', 'play', 'progress', 'current-time', 'mute', 'volume',
            'captions', 'settings', 'fullscreen'
          ],
          captions: { 
            active: false, 
            language: 'auto',
            update: true 
          },
          settings: ['captions', 'speed']
        });
        setupOrientationHandling();
        setupCaptionEvents();
      }, { once: true });
    }
    setTimeout(() => {
      detachBufferingEvents();
      attachBufferingEvents();
    }, 0);
  }

  // Extracted caption event setup for reusability
  function setupCaptionEvents() {
    if (!plyr) return;
    
    plyr.on('languagechange', () => {
      if (!plyr || !videoRef) return;
      if (plyr.currentTrack !== -1 && videoRef.textTracks[plyr.currentTrack]) {
        const currentTrack = videoRef.textTracks[plyr.currentTrack];
        selectedLanguage = currentTrack.language;
        console.log('Selected caption track:', {
          index: plyr.currentTrack,
          language: currentTrack.language,
          label: currentTrack.label
        });
        for (let i = 0; i < videoRef.textTracks.length; i++) {
          videoRef.textTracks[i].mode = i === plyr.currentTrack ? 'showing' : 'disabled';
        }
      } else {
        selectedLanguage = 'auto';
        for (let i = 0; i < videoRef.textTracks.length; i++) {
          videoRef.textTracks[i].mode = 'disabled';
        }
      }
    });
    
    plyr.on('captionsenabled', () => {
      console.log('Captions enabled');
    });
    
    plyr.on('captionsdisabled', () => {
      selectedLanguage = 'auto';
      console.log('Captions disabled');
    });
  }

  // Add event listeners for buffering/loading
  function attachBufferingEvents() {
    if (!videoRef) return;
    // HTML5 events
    videoRef.addEventListener('waiting', () => { buffering = true; });
    videoRef.addEventListener('playing', () => { buffering = false; });
    videoRef.addEventListener('canplay', () => { buffering = false; });
    videoRef.addEventListener('seeking', () => { buffering = true; });
    videoRef.addEventListener('seeked', () => { buffering = false; });
    videoRef.addEventListener('ended', () => { buffering = false; });
    videoRef.addEventListener('pause', () => { buffering = false; });
    // Plyr events (if needed)
    plyr?.on('waiting', () => { buffering = true; });
    plyr?.on('playing', () => { buffering = false; });
  }

  function detachBufferingEvents() {
    if (!videoRef) return;
    videoRef.removeEventListener('waiting', () => { buffering = true; });
    videoRef.removeEventListener('playing', () => { buffering = false; });
    videoRef.removeEventListener('canplay', () => { buffering = false; });
    videoRef.removeEventListener('seeking', () => { buffering = true; });
    videoRef.removeEventListener('seeked', () => { buffering = false; });
    videoRef.removeEventListener('ended', () => { buffering = false; });
    videoRef.removeEventListener('pause', () => { buffering = false; });
  }

  $: {
    const subsString = JSON.stringify(subtitles);
    if (
      videoRef &&
      (videoUrl !== lastVideoUrl || subsString !== lastSubtitles)
    ) {
      lastVideoUrl = videoUrl;
      lastSubtitles = subsString;
      initializePlayer();
    }
  }

  onMount(() => {
    if (videoRef && videoUrl) {
      initializePlayer();
    }
    // No need for native fullscreenchange events anymore
    onDestroy(() => {
      unlockOrientation();
      cleanup();
      detachBufferingEvents?.();
    });
  });

  onDestroy(() => {
    cleanup();
    detachBufferingEvents();
  });

  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.matchMedia('(max-width: 768px)').matches;
  }

  async function lockToLandscape() {
    if (!isMobileDevice()) return;
    try {
      // Prefer the modern API
      if ((screen.orientation as any)?.lock) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch (e) {
      // fallback: try to rotate using deprecated APIs or do nothing
    }
  }

  async function unlockOrientation() {
    if (!isMobileDevice()) return;
    try {
      if (screen.orientation?.unlock) {
        screen.orientation.unlock();
      }
    } catch (e) {}
  }

  // Store handler references
  let enterFullscreenHandler: (() => void) | null = null;
  let exitFullscreenHandler: (() => void) | null = null;

  function setupOrientationHandling() {
    if (!plyr) return;

    // Remove previous listeners if any
    if (enterFullscreenHandler) {
      plyr.off('enterfullscreen', enterFullscreenHandler);
    }
    if (exitFullscreenHandler) {
      plyr.off('exitfullscreen', exitFullscreenHandler);
    }

    enterFullscreenHandler = async () => {
      if (!isMobileDevice()) return;
      // Standard API
      if (screen.orientation?.lock) {
        try {
          await screen.orientation.lock('landscape');
        } catch {}
      } else if (screen.lockOrientation) {
        screen.lockOrientation('landscape');
      } else if (screen.mozLockOrientation) {
        screen.mozLockOrientation('landscape');
      } else if (screen.msLockOrientation) {
        screen.msLockOrientation('landscape');
      }
    };

    exitFullscreenHandler = async () => {
      if (!isMobileDevice()) return;
      // Standard API
      if (screen.orientation?.unlock) {
        try {
          screen.orientation.unlock();
        } catch {}
      } else if (screen.unlockOrientation) {
        screen.unlockOrientation();
      } else if (screen.mozUnlockOrientation) {
        screen.mozUnlockOrientation();
      } else if (screen.msUnlockOrientation) {
        screen.msUnlockOrientation();
      }
    };

    plyr.on('enterfullscreen', enterFullscreenHandler);
    plyr.on('exitfullscreen', exitFullscreenHandler);
  }

  function initializePlyr() {
    if (!videoRef || plyr) return;

    addSubtitleTracks();

    plyr = new Plyr(videoRef, {
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
      captions: {
        active: true,
        language: 'auto',
        update: true
      }
    });

    // Attach orientation handling after Plyr is ready
    setupOrientationHandling();
  }

  function setupIntroSkipPlyr() {
    if (!plyr || !intro || !autoSkipIntro) return;
    const onTimeUpdate = () => {
      if (
        plyr && // <-- add this check
        plyr.currentTime >= intro.start &&
        plyr.currentTime < intro.end
      ) {
        plyr.currentTime = intro.end;
      }
    };
    plyr.on('timeupdate', onTimeUpdate);
    onDestroy(() => plyr && plyr.off('timeupdate', onTimeUpdate));
  }

  $: if (plyr && intro && autoSkipIntro) {
    setupIntroSkipPlyr();
  }
</script>

<div class="player-container">
  <video
    bind:this={videoRef}
    controls
    crossorigin="anonymous"
    playsinline
    {poster}
    class="responsive-video"
  >
    {#if thumbnailsVtt}
      <track kind="metadata" label="thumbnails" src={thumbnailsVtt} />
    {/if}
    <!-- Always include at least one captions track for accessibility -->
    <track kind="captions" label="No captions" srclang="en" src="" default hidden />
    <!-- Subtitle tracks are added dynamically -->
  </video>
  {#if buffering}
    <div class="buffering-spinner" aria-label="Loading">
      <div class="spinner"></div>
    </div>
  {/if}
</div>

<style>
  .player-container {
    position: relative;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 16 / 9;
    background: black;
    border-radius: 0.75rem;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    box-sizing: border-box;
  }

  :global(.plyr),
  :global(.plyr__video-wrapper),
  :global(.plyr video),
  .responsive-video {
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    background: black;
    border-radius: 0.75rem;
    display: block;
    box-sizing: border-box;
  }

  :global(.plyr__captions) {
    font-size: 1.1em;
    color: #fff;
    text-shadow: 0 2px 4px #000, 0 0 2px #000;
    /* Remove background for subtitles */
    background: none !important;
    padding: 0.2em 0.6em;
    border-radius: 0.3em;
    line-height: 1.4;
  }

  /* Subtitles 14px on mobile when NOT fullscreen */
  @media (max-width: 768px) {
    :global(.plyr__captions) {
      font-size: 12px !important;
    }
  }

  /* Show captions control button */
  :global(.plyr__controls .plyr__control--overlaid) {
    display: block !important;
  }

  /* Ensure captions menu is properly styled */
  :global(.plyr__menu__container .plyr__control[role="menuitemradio"]) {
    color: #fff !important;
  }

  :global(.plyr__menu__container .plyr__control[role="menuitemradio"][aria-checked="true"]) {
    color: #f97316 !important; /* Orange color for selected */
  }

  @media (max-width: 768px) {
    /* Hide the volume range slider, keep the mute button */
    :global(.plyr__controls .plyr__volume input[type="range"]) {
      display: none !important;
    }
    /* Optionally, shrink the volume control area */
    :global(.plyr__controls .plyr__volume) {
      min-width: 0 !important;
      width: auto !important;
    }
  }

  /* Remove custom controller background, use Plyr's default */
  :global(.plyr__controls) {
    background: unset !important;
    border-radius: 0 0 0.75rem 0.75rem;
  }

  /* Restore Plyr's default controller background for video */
  :global(.plyr--video .plyr__controls) {
    background: linear-gradient(#0000, #000000bf) !important;
    background: var(--plyr-video-controls-background, linear-gradient(#0000, #000000bf)) !important;
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
    bottom: 0;
    color: #fff;
    color: var(--plyr-video-control-color, #fff);
    left: 0;
    padding: 5px;
    padding: calc(var(--plyr-control-spacing, 10px)/2);
    padding-top: 20px;
    padding-top: calc(var(--plyr-control-spacing, 10px)*2);
    position: absolute;
    right: 0;
    transition: opacity .4s ease-in-out, transform .4s ease-in-out;
    z-index: 3;
  }

  /* Keep the rest of your dark mode theme */
  :global(.plyr) {
    --plyr-color-main: #f97316; /* orange-400 */
    --plyr-video-background: #18181b; /* gray-900 */
    --plyr-menu-background: #27272a; /* gray-800 */
    --plyr-menu-color: #fff;
    --plyr-control-color: #fff;
    --plyr-control-hover-background: #f97316;
    --plyr-tooltip-background: #27272a;
    --plyr-tooltip-color: #fff;
    --plyr-audio-controls-background: #18181b;
    --plyr-audio-control-color: #fff;
    --plyr-audio-control-hover-background: #f97316;
    background: #18181b !important;
    color: #fff !important;
    border-radius: 0.75rem;
  }

  :global(.plyr__control) {
    color: #fff !important;
  }

  :global(.plyr__control[aria-pressed="true"]),
  :global(.plyr__control:hover),
  :global(.plyr__control:focus) {
    background: unset !important;
    color: #f97316 !important;
  }

  /* Remove always-on background for the settings icon */
  :global(.plyr__control[aria-expanded="true"]) {
    background: #f97316 !important;
    color: #18181b !important;
  }

  /* Optional: normal state (no background) */
  :global(.plyr__control[aria-expanded="false"]) {
    background: unset !important;
    color: #fff !important;
  }

  :global(.plyr__progress input[type="range"]) {
    color: #f97316 !important;
  }

  :global(.plyr__menu__container) {
    /* DO NOT set display: block or display: flex here! */
    background: #27272a !important;
    color: #fff !important;
    border-radius: 0.5rem;
  }

  :global(.plyr__menu__container .plyr__control[role="menuitemradio"][aria-checked="true"]) {
    color: #f97316 !important;
  }

  :global(.plyr__tooltip) {
    background: #27272a !important;
    color: #fff !important;
  }

  :global(.plyr__captions) {
    background: none !important;
    color: #fff !important;
    text-shadow: 0 2px 4px #000, 0 0 2px #000;
  }

  /* Make Plyr settings and captions menu smaller on mobile */
  @media (max-width: 640px) {
    :global(.plyr__menu__container) {
      max-height: 150px !important;
      min-width: 90px !important;
      max-width: 140px !important;
      font-size: 0.75rem !important;
      padding: 0.15rem 0.3rem !important;
      border-radius: 0.3rem !important;
      overflow-y: auto !important;
      overscroll-behavior: contain;
    }
    :global(.plyr__menu__container .plyr__control),
    :global(.plyr__menu__container .plyr__menu__value),
    :global(.plyr__menu__container .plyr__control[role="menuitemradio"]) {
      font-size: 0.75rem !important;
      min-height: 24px !important;
      padding: 0.15rem 0.3rem !important;
    }
  }

  /* Hide the captions/subtitles (CC) icon on mobile */
  @media (max-width: 640px) {
    :global(.plyr__control[data-plyr="captions"]) {
      display: none !important;
    }
  }

  .buffering-spinner {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    pointer-events: none;
    background: rgba(24, 24, 27, 0.18); /* subtle dark overlay */
    transition: background 0.2s;
  }
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #f97316;
    border-top: 4px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    box-shadow: 0 0 8px #f9731688;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .spinner {
      width: 32px;
      height: 32px;
      border-width: 3px;
    }
  }

  /* Always keep the fullscreen icon white, even on hover, focus, or active */
  :global(.plyr__control[data-plyr="fullscreen"]),
  :global(.plyr__control[data-plyr="fullscreen"]:hover),
  :global(.plyr__control[data-plyr="fullscreen"]:focus),
  :global(.plyr__control[data-plyr="fullscreen"][aria-pressed="true"]) {
    color: #fff !important;
    background: unset !important;
  }

  /* Play, pause, and captions (CC/sub) icons: always white */
  :global(.plyr__control[data-plyr="play"] svg),
  :global(.plyr__control[data-plyr="pause"] svg),
  :global(.plyr__control[data-plyr="captions"] svg) {
    fill: #fff !important;
    color: #fff !important;
  }
</style>