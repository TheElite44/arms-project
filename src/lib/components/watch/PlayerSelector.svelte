<script lang="ts">
  import { onMount } from 'svelte';

  export let useArtPlayer = true;
  export let setUseArtPlayer: (v: boolean) => void;
  export let useIframePlayer: boolean = false;
  export let setUseIframePlayer: (v: boolean) => void;

  // Load last used player from localStorage, default to Plyr
  onMount(() => {
    const lastPlayer = localStorage.getItem('lastPlayer');
    if (lastPlayer === 'artplayer') {
      setUseArtPlayer(true);
      setUseIframePlayer(false);
    } else if (lastPlayer === 'iframe') {
      setUseArtPlayer(false);
      setUseIframePlayer(true);
    } else {
      // Default to Plyr
      setUseArtPlayer(false);
      setUseIframePlayer(false);
    }
  });

  function selectArtPlayer() {
    setUseArtPlayer(true);
    setUseIframePlayer(false);
    localStorage.setItem('lastPlayer', 'artplayer');
  }

  function selectPlyr() {
    setUseArtPlayer(false);
    setUseIframePlayer(false);
    localStorage.setItem('lastPlayer', 'plyr');
  }

  function selectIframePlayer() {
    setUseArtPlayer(false);
    setUseIframePlayer(true);
    localStorage.setItem('lastPlayer', 'iframe');
  }
</script>

<div class="flex items-center gap-2 mb-4 flex-nowrap overflow-x-auto whitespace-nowrap">
  <span class="font-semibold text-orange-400 text-sm flex items-center gap-1">
    <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M5 3v18l15-9L5 3z"></path>
    </svg>
    <span class="player-label">Player:</span>
  </span>
  <button
    class={`flex items-center gap-1 px-2 py-1 rounded font-bold text-xs transition min-w-[56px] border border-transparent ${useArtPlayer && !useIframePlayer ? 'bg-orange-400 text-black' : 'bg-gray-700 text-white hover:bg-orange-400 hover:text-black hover:border-orange-400'}`}
    on:click={selectArtPlayer}
    disabled={useArtPlayer && !useIframePlayer}
    style="justify-content:center; width: auto;"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M5 3v18l15-9L5 3z"></path>
    </svg>
    Artplayer
  </button>
  <button
    class={`flex items-center gap-1 px-2 py-1 rounded font-bold text-xs transition min-w-[56px] border border-transparent ${!useArtPlayer && !useIframePlayer ? 'bg-orange-400 text-black' : 'bg-gray-700 text-white hover:bg-orange-400 hover:text-black hover:border-orange-400'}`}
    on:click={selectPlyr}
    disabled={!useArtPlayer && !useIframePlayer}
    style="justify-content:center; width: auto;"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 15h8M8 12h8M8 9h8"></path>
    </svg>
    Plyr
  </button>
  <button
    on:click={selectIframePlayer}
    class={`flex items-center gap-1 px-2 py-1 rounded font-bold text-xs transition min-w-[56px] border border-transparent ${useIframePlayer ? 'bg-orange-400 text-black' : 'bg-gray-700 text-white hover:bg-orange-400 hover:text-black hover:border-orange-400'}`}
    disabled={useIframePlayer}
    style="justify-content:center; width: auto;"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M8 12h8"></path>
    </svg>
    Iframe
  </button>
</div>

<style>
  @media (max-width: 640px) {
    .player-label {
      display: none !important;
    }
  }
</style>