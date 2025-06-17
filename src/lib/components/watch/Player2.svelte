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
    default?: boolean;
  }> = [];
  export let poster: string = '';

  let videoRef: HTMLVideoElement | null = null;
  let plyr: Plyr | null = null;
  let hls: Hls | null = null;
  let buffering = false;

  onMount(() => {
    if (videoRef && videoUrl) {
      initializePlayer();
    }
  });

  onDestroy(() => {
    cleanup();
  });

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

  function initializePlayer() {
    if (!videoRef) return;

    // Clean up existing instances first
    cleanup();

    // Set up video source
    if (Hls.isSupported() && videoType === 'application/x-mpegURL') {
      hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        initializePlyr();
      });
    } else {
      videoRef.src = videoUrl;
      videoRef.addEventListener('loadedmetadata', initializePlyr, { once: true });
    }
  }

  function initializePlyr() {
    if (!videoRef || plyr) return;

    // Add subtitle tracks to video element before initializing Plyr
    addSubtitleTracks();

    // Initialize Plyr with subtitle support
    plyr = new Plyr(videoRef, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'captions', // Enable captions control
        'settings',
        'fullscreen',
      ],
      captions: {
        active: true,
        language: 'auto',
        update: true
      }
    });

    // Set up fullscreen orientation handling
    setupOrientationHandling();
  }

  $: console.log('Player2 received subtitles prop:', subtitles);

  function addSubtitleTracks() {
    if (!videoRef) return;

    // Remove existing tracks
    const existingTracks = videoRef.querySelectorAll('track');
    existingTracks.forEach(track => track.remove());

    // Add new subtitle tracks
    subtitles.forEach(subtitle => {
      console.log('Adding subtitle track:', subtitle);
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.src = subtitle.src;
      track.srclang = subtitle.srclang || 'en';
      track.label = subtitle.label;
      if (subtitle.default) {
        track.default = true;
      }
      videoRef!.appendChild(track);
    });

    // Log all tracks after adding
    setTimeout(() => {
      const tracks = videoRef?.querySelectorAll('track');
      console.log('Tracks in video element after adding:', tracks);
    }, 100);
  }

  function setupOrientationHandling() {
    function handleFullscreen() {
      const isFullscreen = !!document.fullscreenElement;
      if (isFullscreen && isMobileDevice()) {
        lockToLandscape();
      } else if (!isFullscreen && isMobileDevice()) {
        unlockOrientation();
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreen);

    // Store cleanup function
    const cleanup = () => {
      document.removeEventListener('fullscreenchange', handleFullscreen);
      unlockOrientation();
    };

    return cleanup;
  }

  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || window.matchMedia('(max-width: 768px)').matches;
  }

  async function lockToLandscape() {
    if (!isMobileDevice()) return;
    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch (e) {
      // Ignore errors (not supported)
    }
  }

  async function unlockOrientation() {
    if (!isMobileDevice()) return;
    try {
      if (screen.orientation && screen.orientation.unlock) {
        await screen.orientation.unlock();
      }
    } catch (e) {
      // Ignore errors (not supported)
    }
  }

  function handleBufferingEvents(): (() => void) | null {
    if (!videoRef) return null; // changed from undefined to null
    const onWaiting = () => buffering = true;
    const onPlaying = () => buffering = false;
    const onCanPlay = () => buffering = false;

    videoRef.addEventListener('waiting', onWaiting);
    videoRef.addEventListener('playing', onPlaying);
    videoRef.addEventListener('canplay', onCanPlay);

    // Cleanup
    return () => {
      videoRef?.removeEventListener('waiting', onWaiting);
      videoRef?.removeEventListener('playing', onPlaying);
      videoRef?.removeEventListener('canplay', onCanPlay);
    };
  }

  let cleanupBufferingEvents: (() => void) | null = null;

  $: if (videoRef) {
    cleanupBufferingEvents?.();
    cleanupBufferingEvents = handleBufferingEvents();
  }

  // Re-initialize when videoUrl or subtitles change
  $: if (videoRef && videoUrl) {
    initializePlayer();
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
    <!-- Tracks will be added dynamically -->
    {#if subtitles.length === 0}
      <track kind="captions" label="No captions" src="" default />
    {/if}
  </video>
  {#if buffering}
    <div class="loading-overlay">
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

  .loading-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.3);
    z-index: 10;
    pointer-events: none;
  }
  .spinner {
    border: 4px solid #fff3;
    border-top: 4px solid #fff;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>