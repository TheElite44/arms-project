<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import Artplayer from 'artplayer';
  import { browser } from '$app/environment';

  export let src: string = '';
  export let poster: string = '';
  export let subtitles: Array<{ url: string; label: string; kind: string; default?: boolean }> = [];

  // Subtitle style settings (Netflix-like)
  export let subtitleSettings = {
    color: '#fff',
    fontSize: { desktop: '24px', mobile: '12px' }, // Responsive default
    fontFamily: '"Arial Narrow", "Roboto Condensed", Arial, sans-serif',
    fontWeight: 400, // Regular or 300 for thinner
    // Thinner black outline using smaller shadow offsets
    textShadow: `
      -1px -1px 0 #000,
      1px -1px 0 #000,
      -1px 1px 0 #000,
      1px 1px 0 #000,
      0 1px 2px rgba(0,0,0,0.7)
    `,
    marginBottom: { desktop: '24px', mobile: '60px' }, // <-- set mobile lower
    padding: '0.2em 0.6em',
    borderRadius: '0.5em',
    display: 'inline',
    boxShadow: 'none',
    letterSpacing: '0.02em'
  };

  let art: any = null;
  let container: HTMLDivElement | null = null;
  let previousSrc: string | null = null;
  let isLoading: boolean = false;
  let error: string | null = null;

  async function fetchWatchData(episodeId: string, server: string = 'hd-1', category: string = 'sub') {
    // This function is now a no-op since episode/server/category logic is removed
    return;
  }

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Screen orientation functions
  function isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.matchMedia('(max-width: 768px)').matches;
  }

  async function lockToLandscape() {
    if (!isMobileDevice()) return;
    
    try {
      // Modern Screen Orientation API
      if ((screen.orientation as any)?.lock) {
        await (screen.orientation as any).lock('landscape');
        console.log('Screen locked to landscape');
      }
      // Fallback for older browsers
      else if (screen.lockOrientation) {
        screen.lockOrientation('landscape');
      }
      // Alternative fallback
      else if (screen.mozLockOrientation) {
        screen.mozLockOrientation('landscape');
      }
      else if (screen.msLockOrientation) {
        screen.msLockOrientation('landscape');
      }
    } catch (error) {
      console.warn('Could not lock screen orientation:', error);
    }
  }

  async function unlockOrientation() {
    if (!isMobileDevice()) return;
    
    try {
      // Modern Screen Orientation API
      if ((screen.orientation as any)?.unlock) {
        (screen.orientation as any).unlock();
        console.log('Screen orientation unlocked');
      }
      // Fallback for older browsers
      else if (screen.unlockOrientation) {
        screen.unlockOrientation();
      }
      else if (screen.mozUnlockOrientation) {
        screen.mozUnlockOrientation();
      }
      else if (screen.msUnlockOrientation) {
        screen.msUnlockOrientation();
      }
    } catch (error) {
      console.warn('Could not unlock screen orientation:', error);
    }
  }

  async function createPlayer() {
    if (!container || !src) return;

    if (art && previousSrc === src) return;

    // Destroy existing player
    if (art) {
      try {
        art.destroy();
      } catch (e) {
        console.warn('Error destroying player:', e);
      }
      art = null;
    }

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
      // Add subtitle settings panel
      settings: [
        {
          html: 'Subtitle Style',
          selector: [
            {
              html: 'Font Size',
              selector: [
                { html: 'Small (14px / 12px mobile)', value: { desktop: '14px', mobile: '12px' } },
                { html: 'Medium (24px / 14px mobile)', value: { desktop: '24px', mobile: '14px' } }, // Default
                { html: 'Large (34px / 24px mobile)', value: { desktop: '34px', mobile: '24px' } }
              ],
              onSelect: function (item: any) {
                subtitleSettings.fontSize = item.value;
                updateSubtitleStyle();
                return item.html;
              },
            },
            {
              html: 'Font Color',
              selector: [
                { html: 'White', value: '#ffffff' },
                { html: 'Yellow', value: '#ffff00' },
                { html: 'Green', value: '#00ff00' },
                { html: 'Cyan', value: '#00ffff' },
                { html: 'Red', value: '#ff0000' },
              ],
              onSelect: function (item: any) {
                subtitleSettings.color = item.value;
                updateSubtitleStyle();
                return item.html;
              },
            },
            {
              html: 'Outline',
              selector: [
                { html: 'None', value: 'none' },
                { html: 'Thin', value: `
                  -1px -1px 0 #000,
                  1px -1px 0 #000,
                  -1px 1px 0 #000,
                  1px 1px 0 #000
                ` },
                { html: 'Medium', value: `
                  -2px -2px 0 #000,
                  2px -2px 0 #000,
                  -2px 2px 0 #000,
                  2px 2px 0 #000
                ` },
                { html: 'Thick', value: `
                  -3px -3px 0 #000,
                  3px -3px 0 #000,
                  -3px 3px 0 #000,
                  3px 3px 0 #000
                ` }
              ],
              onSelect: function (item: any) {
                if (item.value === 'none') {
                  subtitleSettings.textShadow = 'none';
                } else {
                  subtitleSettings.textShadow = item.value;
                }
                updateSubtitleStyle();
                return item.html;
              },
            },
            // Removed Background selector
          ],
        },
      ],
    };

    // Add subtitles if available
    if (subtitles?.length > 0) {
      const defaultSubtitle = subtitles.find((sub) => sub.default) || subtitles[0];
      const subType = defaultSubtitle.url.endsWith('.srt') ? 'srt' : 'vtt';

      options.subtitle = {
        url: defaultSubtitle.url,
        type: subType,
        style: {
          color: subtitleSettings.color,
          fontSize: getResponsiveFontSize(subtitleSettings.fontSize),
          fontFamily: subtitleSettings.fontFamily,
          // backgroundColor: subtitleSettings.backgroundColor, // Removed background
          textShadow: subtitleSettings.textShadow,
          marginBottom: getResponsiveMarginBottom(subtitleSettings.marginBottom),
          padding: subtitleSettings.padding,
          borderRadius: subtitleSettings.borderRadius,
          display: subtitleSettings.display,
          boxShadow: subtitleSettings.boxShadow,
          fontWeight: subtitleSettings.fontWeight,
          letterSpacing: subtitleSettings.letterSpacing,
          textAlign: 'center',
          lineHeight: '1.35',
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
        },
        encoding: 'utf-8',
      };
    }

    try {
      art = new Artplayer(options);
      previousSrc = src;

      art.on('ready', () => {
        console.log('Player ready');
      });

      art.on('video:error', (error: any) => {
        console.error('Video error:', error);
      });

      // Add fullscreen event listeners for landscape rotation
      art.on('fullscreen', (isFullscreen: boolean) => {
        console.log('Fullscreen changed:', isFullscreen);
        if (isFullscreen && isMobileDevice()) {
          lockToLandscape();
        } else if (!isFullscreen && isMobileDevice()) {
          unlockOrientation();
        }
      });

      // Alternative fullscreen detection for better compatibility
      art.on('fullscreenWeb', (isFullscreen: boolean) => {
        console.log('Web fullscreen changed:', isFullscreen);
        if (isFullscreen && isMobileDevice()) {
          lockToLandscape();
        } else if (!isFullscreen && isMobileDevice()) {
          unlockOrientation();
        }
      });

    } catch (error) {
      console.error('Failed to create player:', error);
      throw error;
    }
  }

  function getResponsiveFontSize(fontSize: any) {
    if (typeof fontSize === 'string') return fontSize;
    // Use window.matchMedia to detect mobile
    return window.matchMedia('(max-width: 600px)').matches
      ? fontSize.mobile
      : fontSize.desktop;
  }

  // NEW: Get responsive margin-bottom
  function getResponsiveMarginBottom(marginBottom: any) {
    if (typeof marginBottom === 'string') return marginBottom;
    return window.matchMedia('(max-width: 600px)').matches
      ? marginBottom.mobile
      : marginBottom.desktop;
  }

  function isMobile() {
    return window.matchMedia('(max-width: 600px)').matches;
  }

  // Automatically update subtitle style on resize for responsiveness
  if (browser) {
    let lastMobile = isMobile();
    window.addEventListener('resize', () => {
      const nowMobile = isMobile();
      if (nowMobile !== lastMobile) {
        lastMobile = nowMobile;
        updateSubtitleStyle();
      }
    });

    // Add fullscreen change event listener as backup
    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = !!document.fullscreenElement;
      if (isFullscreen && isMobileDevice()) {
        lockToLandscape();
      } else if (!isFullscreen && isMobileDevice()) {
        unlockOrientation();
      }
    });

    // Alternative fullscreen events for better browser compatibility
    document.addEventListener('webkitfullscreenchange', () => {
      const isFullscreen = !!document.webkitFullscreenElement;
      if (isFullscreen && isMobileDevice()) {
        lockToLandscape();
      } else if (!isFullscreen && isMobileDevice()) {
        unlockOrientation();
      }
    });

    document.addEventListener('mozfullscreenchange', () => {
      const isFullscreen = !!document.mozFullScreenElement;
      if (isFullscreen && isMobileDevice()) {
        lockToLandscape();
      } else if (!isFullscreen && isMobileDevice()) {
        unlockOrientation();
      }
    });

    document.addEventListener('msfullscreenchange', () => {
      const isFullscreen = !!document.msFullscreenElement;
      if (isFullscreen && isMobileDevice()) {
        lockToLandscape();
      } else if (!isFullscreen && isMobileDevice()) {
        unlockOrientation();
      }
    });
  }

  function updateSubtitleStyle() {
    if (art && art.subtitle) {
      const subtitleElement = art.template.$subtitle;
      if (subtitleElement) {
        // Detect fullscreen (Artplayer or browser fullscreen)
        const isFullscreen =
          (art.fullscreen || art.fullscreenWeb) ||
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement;

        // Calculate font size
        let fontSize = getResponsiveFontSize(subtitleSettings.fontSize);
        if (isFullscreen) {
          // Increase font size by 25% in fullscreen
          if (typeof fontSize === 'string' && fontSize.endsWith('px')) {
            const num = parseFloat(fontSize);
            fontSize = `${Math.round(num * 1.25)}px`;
          }
        }

        subtitleElement.style.color = subtitleSettings.color;
        subtitleElement.style.fontSize = fontSize;
        subtitleElement.style.fontFamily = subtitleSettings.fontFamily;
        subtitleElement.style.textShadow = subtitleSettings.textShadow;
        // Lower subtitle on mobile
        subtitleElement.style.marginBottom = isMobile() ? '60px' : '20px';
        // Reduce padding on mobile
        subtitleElement.style.padding = isMobile() ? '0.1em 0.3em' : subtitleSettings.padding;
        subtitleElement.style.borderRadius = subtitleSettings.borderRadius;
        subtitleElement.style.display = subtitleSettings.display;
        subtitleElement.style.boxShadow = subtitleSettings.boxShadow;
        subtitleElement.style.fontWeight = subtitleSettings.fontWeight;
        subtitleElement.style.letterSpacing = subtitleSettings.letterSpacing;
        subtitleElement.style.textAlign = 'center';
        subtitleElement.style.lineHeight = '1.35';
        subtitleElement.style.whiteSpace = 'pre-line';
        subtitleElement.style.wordBreak = 'break-word';
      }
    }
  }

  // Keyboard shortcuts
  if (browser) {
    document.addEventListener('keydown', (event) => {
      if (!art) return;

      switch (event.key.toLowerCase()) {
        case 'm':
          art.muted = !art.muted;
          break;
        case 'f':
          art.fullscreen = !art.fullscreen;
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

  onMount(() => {
    if (src) createPlayer();
  });

  afterUpdate(() => {
    if (src && src !== previousSrc) {
      createPlayer();
    }
  });

  onDestroy(() => {
    // Unlock orientation when component is destroyed
    if (isMobileDevice()) {
      unlockOrientation();
    }
    
    if (art) {
      try {
        art.destroy();
      } catch (e) {
        console.warn('Error during cleanup:', e);
      }
      art = null;
    }
  });

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

  /* Artplayer Subtitle Styles */
  :global(.art-subtitle) {
    padding-inline: 0px !important;
    gap: 2px !important;
    margin-bottom: 1rem !important;
  }

  :global(.art-subtitle-line) {
    min-width: fit-content;
    background-color: transparent !important;
    padding-inline: 3px !important;
  }

  :global(.art-subtitle-line),
  :global(.art-subtitle-line *) {
    font-size: inherit !important;
    color: inherit !important;
    line-height: inherit !important;
    font-weight: inherit !important;
    white-space: inherit !important;
  }

  /* Artplayer Controls Styles */
  :global(.art-volume-panel) {
    padding-bottom: 20px !important;
  }

  :global(.art-settings) {
    margin-bottom: 20px !important;
  }

  /* Mobile Responsive Styles */
  @media screen and (max-width: 370px) {
    :global(.art-progress) {
      padding-bottom: 5px !important;
    }

    :global(.art-controls-left .art-control) {
      justify-content: flex-start !important;
    }

    :global(.art-controls-right .art-control) {
      justify-content: flex-end !important;
    }

    :global(.art-controls-right .art-control svg) {
      width: 22px;
      height: 22px;
    }

    :global(.art-controls-left .art-control svg) {
      width: 22px;
      height: 22px;
    }

    :global(.art-state .art-icon svg) {
      width: 50px;
      height: 50px;
    }
  }

  @media screen and (max-width: 350px) {
    :global(.art-controls-right .art-control svg) {
      width: 20px;
      height: 20px;
    }

    :global(.art-controls-left .art-control svg) {
      width: 20px;
      height: 20px;
    }
  }
</style>