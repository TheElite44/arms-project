<script lang="ts">
  export let useArtPlayer = true;
  export let setUseArtPlayer: (v: boolean) => void;
</script>

<div class="flex items-center gap-4 mb-4">
  <span class="font-semibold text-orange-400 text-sm flex items-center gap-1">
    <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M5 3v18l15-9L5 3z"></path>
    </svg>
    Player:
  </span>
  <button
    class="flex items-center gap-1 px-3 py-1 rounded font-bold text-xs transition
      {useArtPlayer ? 'bg-orange-400 text-black' : 'bg-gray-700 text-white'}"
    on:click={() => setUseArtPlayer(true)}
    disabled={useArtPlayer}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M5 3v18l15-9L5 3z"></path>
    </svg>
    Artplayer
  </button>
  <button
    class="flex items-center gap-1 px-3 py-1 rounded font-bold text-xs transition
      {!useArtPlayer ? 'bg-orange-400 text-black' : 'bg-gray-700 text-white'}"
    on:click={() => setUseArtPlayer(false)}
    disabled={!useArtPlayer}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 15h8M8 12h8M8 9h8"></path>
    </svg>
    Plyr
  </button>
</div>