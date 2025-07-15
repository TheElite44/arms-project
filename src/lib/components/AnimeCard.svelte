<!-- AnimeCard.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';

  export let anime: any;
  export let showRank: boolean = false;
  export let showEpisodes: boolean = false;
  export let showDescription: boolean = false;
  export let description: string = '';
  export let genres: string[] = [];
  export let duration: string = '';
  export let type: string = '';

  let showTooltip = false;
  let tooltipTimeout: any;

  // Tooltip data stores
  const qtip = writable<any>(null);
  const qtipLoading = writable(false);
  const qtipError = writable<string | null>(null);

  async function fetchQtip(id: string) {
    qtipLoading.set(true);
    qtipError.set(null);
    try {
      const res = await fetch(`/api/qtip?id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      // The anime info is now in data.data.anime
      if (data.success && data.data && data.data.anime) {
        qtip.set(data.data.anime);
      } else {
        throw new Error('No anime info');
      }
    } catch (e) {
      qtipError.set('Failed to load info.');
      qtip.set(null);
    } finally {
      qtipLoading.set(false);
    }
  }

  function handleMouseEnter() {
    if (showDescription && anime.id) {
      tooltipTimeout = setTimeout(() => {
        showTooltip = true;
        fetchQtip(anime.id);
      }, 300);
    }
  }

  function handleMouseLeave() {
    clearTimeout(tooltipTimeout);
    showTooltip = false;
  }
</script>

<div class="relative">
  <a
    href={`/info/${anime.id}`}
    class="group relative bg-gray-800 rounded-xl overflow-hidden shadow transition-all duration-150 border border-transparent hover:border-orange-400 hover:shadow-orange-400/40 cursor-pointer block hover:scale-[1.03]"
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
  >
    <div class="relative aspect-[3/4]">
      <img
        src={anime.poster}
        alt={anime.name}
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      
      <!-- Rank badge -->
      {#if showRank}
        <div class="absolute top-2 left-2">
          <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded text-[10px] font-semibold shadow">
            #{anime.rank}
          </span>
        </div>
      {/if}
      
      <!-- Episodes info -->
      {#if showEpisodes}
        <span class="absolute top-2 left-2 bg-gray-900/80 text-orange-300 px-2 py-0.5 rounded text-[10px] shadow">
          {anime.episodes?.sub ?? 0} Sub / {anime.episodes?.dub ?? 0} Dub
        </span>
      {/if}
    </div>
    
    <div class="absolute bottom-0 left-0 right-0 p-2">
      <h3 class="font-semibold text-white text-xs mb-1 line-clamp-2 group-hover:text-orange-200 transition-colors" title={anime.name}>
        {anime.name}
      </h3>
    </div>
  </a>
  
  <!-- Tooltip for description -->
  {#if showDescription && showTooltip && anime.id}
    <div class="absolute z-50 bg-gray-800/90 backdrop-blur-[10px] border border-gray-700 rounded-xl p-4 shadow-2xl max-w-xs top-0 left-full ml-2 pointer-events-auto w-[320px] flex flex-col gap-y-2">
      {#if $qtipLoading}
        <div class="flex justify-center items-center h-20">
          <span class="loader"></span>
        </div>
      {:else if $qtipError}
        <div class="text-orange-400 text-xs">{$qtipError}</div>
      {:else if $qtip}
        <h1 class="text-lg font-bold text-orange-400 leading-6 mb-1">{$qtip.name}</h1>
        <div class="w-full flex items-center relative mt-1 mb-2 gap-2">
          {#if $qtip.malscore}
            <div class="flex items-center gap-1 bg-gray-900 px-2 py-0.5 rounded text-orange-300 text-xs font-semibold">
              <span>★</span>
              <span>{$qtip.malscore}</span>
            </div>
          {/if}
          {#if $qtip.quality}
            <div class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">{$qtip.quality}</div>
          {/if}
          {#if $qtip.type}
            <div class="bg-gray-700 text-orange-200 px-2 py-0.5 rounded text-xs font-semibold">{$qtip.type}</div>
          {/if}
          {#if $qtip.episodes?.sub || $qtip.episodes?.dub}
            <div class="flex gap-1 ml-auto">
              {#if $qtip.episodes?.sub}
                <span class="bg-orange-300 text-gray-900 px-2 py-0.5 rounded text-xs font-semibold">Sub: {$qtip.episodes.sub}</span>
              {/if}
              {#if $qtip.episodes?.dub}
                <span class="bg-orange-200 text-gray-900 px-2 py-0.5 rounded text-xs font-semibold">Dub: {$qtip.episodes.dub}</span>
              {/if}
            </div>
          {/if}
        </div>
        {#if $qtip.description}
          <p class="text-gray-200 text-xs leading-5 font-light line-clamp-3 mb-2">{$qtip.description}</p>
        {/if}
        <div class="flex flex-col gap-1 text-xs">
          {#if $qtip.jname}
            <div><span class="text-gray-400">Japanese:</span> <span class="text-gray-200">{$qtip.jname}</span></div>
          {/if}
          {#if $qtip.synonyms}
            <div><span class="text-gray-400">Synonyms:</span> <span class="text-gray-200">{$qtip.synonyms}</span></div>
          {/if}
          {#if $qtip.aired}
            <div><span class="text-gray-400">Aired:</span> <span class="text-gray-200">{$qtip.aired}</span></div>
          {/if}
          {#if $qtip.status}
            <div><span class="text-gray-400">Status:</span> <span class="text-gray-200">{$qtip.status}</span></div>
          {/if}
          {#if $qtip.genres}
            <div class="flex flex-wrap">
              <span class="text-gray-400 mr-1">Genres:</span>
              {#each $qtip.genres as genre, i}
                <a href={`/genre/${genre}`} class="text-orange-300 hover:text-orange-400">
                  {genre}{i < $qtip.genres.length - 1 ? ',' : ''}
                </a>&nbsp;
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-4 {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>