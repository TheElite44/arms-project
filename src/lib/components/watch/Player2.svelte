<script lang="ts">
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
    // Add new subtitle tracks
    subtitles.forEach((subtitle) => {
      const track = document.createElement('track');
      track.kind = 'captions';
      track.src = processSubtitleUrl(subtitle.src);
      track.srclang = getLanguageCode(subtitle.label);
      track.label = subtitle.label;
      // Set English as default if available
      if (getLanguageCode(subtitle.label) === 'en') {
        track.default = true;
      }
      if (videoRef) {
        videoRef.appendChild(track);
      }
    });
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
          settings: ['captions', 'quality', 'speed']
        });
        plyr?.on('languagechange', () => {
          if (!plyr || !videoRef) return;
          if (plyr.currentTrack !== -1 && videoRef.textTracks[plyr.currentTrack]) {
            const currentTrack = videoRef.textTracks[plyr.currentTrack];
            selectedLanguage = currentTrack.language;
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
        plyr?.on('captionsenabled', () => {
          // Optionally handle
        });
        plyr?.on('captionsdisabled', () => {
          selectedLanguage = 'auto';
        });
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
          settings: ['captions', 'quality', 'speed']
        });
        plyr?.on('languagechange', () => {
          if (!plyr || !videoRef) return;
          if (plyr.currentTrack !== -1 && videoRef.textTracks[plyr.currentTrack]) {
            const currentTrack = videoRef.textTracks[plyr.currentTrack];
            selectedLanguage = currentTrack.language;
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
        plyr?.on('captionsenabled', () => {});
        plyr?.on('captionsdisabled', () => {
          selectedLanguage = 'auto';
        });
      }, { once: true });
    }
    // At the end of initializePlayer:
    setTimeout(() => {
      detachBufferingEvents();
      attachBufferingEvents();
    }, 0);
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
  });

  onDestroy(() => {
    cleanup();
    detachBufferingEvents();
  });
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

  /* Make Plyr settings menu smaller on mobile */
  @media (max-width: 640px) {
    :global(.plyr__menu__container) {
      min-width: 140px !important;
      max-width: 180px !important;
      font-size: 0.85rem !important;
      padding: 0.25rem 0.5rem !important;
      border-radius: 0.4rem !important;
    }
    :global(.plyr__menu__container .plyr__control) {
      padding: 0.3rem 0.5rem !important;
      font-size: 0.95em !important;
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