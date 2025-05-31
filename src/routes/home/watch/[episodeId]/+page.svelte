<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Player from '$lib/components/Player.svelte';
  import Player2 from '$lib/components/Player2.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { PageData } from './$types.js';

  // Props and type guards
  export let data: PageData;
  const isError = (d: PageData): d is (
    { error: string; anime: null; episodes: never[]; episodeId?: undefined; relatedAnimes?: undefined; recommendedAnimes?: undefined; }
    | { error: string; anime: null; episodes: never[]; relatedAnimes: never[]; recommendedAnimes: never[]; episodeId?: undefined; }
  ) => 
    d && 'error' in d && typeof d.error === 'string';

  // State management
  let episodes = isError(data) ? [] : data.episodes || [];
  let currentEpisodeId = isError(data) ? '' : data.episodeId || '';
  let servers: { serverId: number; serverName: string; category: 'sub' | 'dub' | 'raw' }[] = [];
  let currentServer = '';
  let category: 'sub' | 'dub' | 'raw' = 'sub';
  let videoSrc = '';
  let subtitles: Array<{ url: string; label: string; lang: string; kind: string; default?: boolean }> = [];
  let poster = isError(data) ? '' : (data.anime?.info?.poster || '');
  let title = isError(data) ? 'Episode' : (data.anime?.info?.name || 'Episode');
  let intro: { start: number; end: number } | null = null;
  let outro: { start: number; end: number } | null = null;
  let useArtPlayer = true;
  let currentPage = 1;
  const episodesPerPage = 50;

  // Computed values
  $: totalPages = Math.ceil(episodes.length / episodesPerPage);
  $: pagedEpisodes = episodes.slice(
    (currentPage - 1) * episodesPerPage,
    currentPage * episodesPerPage
  );
  $: episodeRanges = Array.from({ length: totalPages }, (_, i) => {
    const start = i * episodesPerPage + 1;
    const end = Math.min((i + 1) * episodesPerPage, episodes.length);
    return `${start}-${end}`;
  });

  // Data fetching functions
  const fetchWatchData = async () => {
    if (!currentEpisodeId || !currentServer) return;
    
    try {
      const params = new URLSearchParams({
        action: 'sources',
        animeEpisodeId: currentEpisodeId,
        server: currentServer,
        category
      });
      
      const res = await fetch(`/api/anime?${params}`);
      const json = await res.json();
      
      if (json.success) {
        videoSrc = json.data.sources?.[0]?.url || '';
        subtitles = (json.data.subtitles || []).map((sub: any) => ({
          url: sub.url,
          label: sub.label || sub.lang,
          lang: sub.lang,
          kind: 'subtitles',
          default: sub.default || false
        }));
        intro = json.data.intro || null;
        outro = json.data.outro || null;
      } else {
        console.error('Watch data error:', json.error);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const fetchServers = async () => {
    if (!currentEpisodeId) return;
    
    try {
      const params = new URLSearchParams({
        action: 'servers',
        animeEpisodeId: currentEpisodeId
      });
      
      const res = await fetch(`/api/anime?${params}`);
      const json = await res.json();
      
      if (json.success) {
        servers = Object.entries(json.data)
          .filter(([cat]) => ['sub', 'dub', 'raw'].includes(cat))
          .flatMap(([cat, serverList]: [string, any]) => 
            serverList.map((server: any) => ({
              ...server,
              category: cat as 'sub' | 'dub' | 'raw'
            }))
          )
          .filter((s: any) => s.serverName);
        
        // Set initial server if none selected
        if (servers.length && !currentServer) {
          const defaultServer = servers.find(s => s.category === category) || servers[0];
          if (defaultServer) {
            currentServer = defaultServer.serverName;
          }
        }
      }
    } catch (err) {
      console.error('Server fetch error:', err);
    }
  };

  // Navigation and event handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) currentPage = page;
  };

  const goToEpisode = async (episodeId: string) => {
    if (episodeId === currentEpisodeId) return;
    
    currentEpisodeId = episodeId;
    const animeKey = data.anime?.info?.id ? `lastEpisodeId:${data.anime.info.id}` : null;
    if (animeKey) localStorage.setItem(animeKey, episodeId);
    
    await fetchServers();
    await fetchWatchData();
    goto(`/watch/${episodeId}`, { replaceState: true });
  };

  const changeServer = (serverName: string, cat: 'sub' | 'dub' | 'raw') => {
    currentServer = serverName;
    category = cat;
    fetchWatchData();
  };

  // Initialize component
  onMount(async () => {
    const animeKey = !isError(data) && data.anime?.info?.id 
      ? `lastEpisodeId:${data.anime.info.id}` 
      : null;
    
    // Restore last watched episode
    if (animeKey) {
      const savedId = localStorage.getItem(animeKey);
      if (savedId && episodes.some((e: { episodeId: string }) => e.episodeId === savedId)) {
        currentEpisodeId = savedId;
      }
    }
    
    // Set first episode if none selected
    if (!currentEpisodeId && episodes.length) {
      currentEpisodeId = episodes[0].episodeId;
    }
    
    // Fetch initial data
    await fetchServers();
    if (currentServer) await fetchWatchData();
  });

  // Handle page change in dropdown
  const handlePageChange = (e: Event) => {
    const page = parseInt((e.target as HTMLSelectElement).value);
    if (!isNaN(page)) goToPage(page);
  };
</script>

<Navbar />

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white px-4 py-8 pt-16">
  {#if isError(data)}
    <div class="max-w-2xl mx-auto text-center text-red-400 text-xl font-bold py-20">
      {data.error || 'An unknown error occurred'}
    </div>
  {:else}
    <div class="max-w-7xl mx-auto flex flex-col gap-10">
      <!-- Player Section -->
      <section class="flex-1 flex flex-col gap-8 mb-12">
        <div class="flex flex-col gap-6 bg-gray-900/80 rounded-xl shadow-2xl p-4 sm:p-8">
          <!-- Player -->
          <div class="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
            {#key videoSrc}
              {#if useArtPlayer}
                <Player 
                  src={videoSrc} 
                  poster={poster} 
                  {subtitles} 
                  {intro} 
                  {outro} 
                  on:nextEpisode={(e) => goToEpisode(e.detail)}
                />
              {:else}
                <Player2 
                  src={videoSrc} 
                  {subtitles} 
                  poster={poster} 
                  on:nextEpisode={(e) => goToEpisode(e.detail)} 
                />
              {/if}
            {/key}
          </div>

          <!-- Server Selector -->
          <div class="flex flex-wrap gap-4">
            <!-- Sub Servers -->
            {#if servers.some(s => s.category === 'sub')}
              <div class="flex items-center gap-2">
                <span class="font-semibold text-orange-400 text-sm">
                  SUB:
                </span>
                <div class="flex flex-wrap gap-2">
                  {#each servers.filter(s => s.category === 'sub') as server}
                    <button
                      on:click={() => changeServer(server.serverName, 'sub')}
                      class="px-4 py-1.5 rounded-md text-xs font-medium uppercase transition
                        {currentServer === server.serverName && category === 'sub'
                          ? 'bg-orange-400 text-black'
                          : 'bg-white/10 text-white hover:bg-orange-400 hover:text-black'}"
                    >
                      {server.serverName}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Dub Servers -->
            {#if servers.some(s => s.category === 'dub')}
              <div class="flex items-center gap-2">
                <span class="font-semibold text-orange-400 text-sm">
                  DUB:
                </span>
                <div class="flex flex-wrap gap-2">
                  {#each servers.filter(s => s.category === 'dub') as server}
                    <button
                      on:click={() => changeServer(server.serverName, 'dub')}
                      class="px-4 py-1.5 rounded-md text-xs font-medium uppercase transition
                        {currentServer === server.serverName && category === 'dub'
                          ? 'bg-orange-400 text-black'
                          : 'bg-white/10 text-white hover:bg-orange-400 hover:text-black'}"
                    >
                      {server.serverName}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- Player Toggle -->
          <div class="flex items-center gap-4">
            <span class="font-semibold text-orange-400 text-sm">
              Player:
            </span>
            <button
              class="flex items-center gap-1 px-3 py-1 rounded font-bold text-xs transition
                {useArtPlayer ? 'bg-orange-400 text-black' : 'bg-gray-700 text-white'}"
              on:click={() => useArtPlayer = true}
              disabled={useArtPlayer}
            >
              ArtPlayer
            </button>
            <button
              class="flex items-center gap-1 px-3 py-1 rounded font-bold text-xs transition
                {!useArtPlayer ? 'bg-orange-400 text-black' : 'bg-gray-700 text-white'}"
              on:click={() => useArtPlayer = false}
              disabled={!useArtPlayer}
            >
              Plyr
            </button>
          </div>

          <!-- Episode Navigation -->
          {#if episodes.length > 1}
            <div class="flex flex-col gap-3">
              <!-- Pagination -->
              <div class="flex items-center gap-2">
                <span class="font-semibold text-orange-400 text-xs">Episodes:</span>
                <select
                  class="px-2 py-1 rounded bg-gray-800 text-white text-xs"
                  on:change={handlePageChange}
                >
                  {#each episodeRanges as range, i}
                    <option value={i + 1} selected={currentPage === i + 1}>
                      {range}
                    </option>
                  {/each}
                </select>
              </div>

              <!-- Episode Grid -->
              <div class="grid grid-cols-5 sm:grid-cols-10 gap-1">
                {#each pagedEpisodes as ep}
                  <button
                    class="flex items-center justify-center h-10 w-full rounded text-xs font-bold transition
                      {ep.episodeId === currentEpisodeId
                        ? 'bg-orange-400 text-gray-900 shadow'
                        : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                    on:click={() => goToEpisode(ep.episodeId)}
                  >
                    {ep.number}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Anime Info -->
        {#if data.anime && data.anime.info && data.anime.moreInfo}
          <div class="flex flex-col md:flex-row gap-8 bg-gray-900/80 rounded-xl shadow-2xl p-6 md:p-10">
            <div class="flex-shrink-0 mx-auto md:mx-0">
              <img
                src={data.anime.info.poster}
                alt={data.anime.info.name}
                class="rounded-xl shadow-2xl w-64 h-auto object-cover border-4 border-gray-800"
              />
            </div>
            
            <div class="flex-1 flex flex-col gap-4">
              <h1 class="text-3xl sm:text-4xl font-extrabold text-orange-400 mb-1">
                {data.anime.info.name}
              </h1>
              
              {#if data.anime.moreInfo.genres}
                <div class="flex flex-wrap gap-2 mb-2">
                  {#each data.anime.moreInfo.genres as genre}
                    <span class="bg-gray-800 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">
                      {genre}
                    </span>
                  {/each}
                </div>
              {/if}
              
              <p class="text-gray-200 text-base mb-2">
                {data.anime.info.description}
              </p>
              
              <div class="flex flex-wrap gap-2 mb-2">
                <span class="bg-orange-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold">
                  Type: {data.anime.info.stats.type}
                </span>
                <span class="bg-gray-800 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">
                  Episodes: {data.anime.info.stats.episodes.sub} Sub / {data.anime.info.stats.episodes.dub} Dub
                </span>
                <span class="bg-gray-800 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">
                  Rating: {data.anime.info.stats.rating}
                </span>
                <span class="bg-gray-800 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">
                  Status: {data.anime.moreInfo.status}
                </span>
              </div>
            </div>
          </div>
        {/if}

        <!-- Next Episode Button -->
        {#each episodes as ep, i}
          {#if ep.episodeId === currentEpisodeId && episodes[i + 1]}
            <button
              class="w-full mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-gray-900 font-bold rounded-xl shadow-lg transition"
              on:click={() => goToEpisode(episodes[i + 1].episodeId)}
            >
              ▶ Next Episode: Episode {episodes[i + 1].number}
            </button>
          {/if}
        {/each}
      </section>

      <!-- Recommendations -->
      {#if data.recommendedAnimes && data.recommendedAnimes.length}
        <section class="mt-8">
          <h2 class="text-2xl font-bold text-orange-400 mb-6">Recommended Anime</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {#each data.recommendedAnimes as rec}
              <a 
                href={`/info/${rec.id}`} 
                class="bg-gray-900/80 hover:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition transform hover:-translate-y-1 hover:shadow-orange-500/30"
              >
                <img 
                  src={rec.poster} 
                  alt={rec.name} 
                  class="w-full h-48 object-cover"
                />
                <div class="p-3">
                  <h3 class="font-bold text-sm mb-1 line-clamp-1">{rec.name}</h3>
                  <div class="flex flex-wrap gap-1">
                    <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">
                      {rec.type}
                    </span>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Related Anime -->
      {#if data.relatedAnimes && data.relatedAnimes.length}
        <section class="mt-10">
          <h2 class="text-2xl font-bold text-orange-400 mb-6">Related Anime</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {#each data.relatedAnimes as rel}
              <a 
                href={`/info/${rel.id}`} 
                class="bg-gray-900/80 hover:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition transform hover:-translate-y-1 hover:shadow-orange-500/30"
              >
                <img 
                  src={rel.poster} 
                  alt={rel.name} 
                  class="w-full h-48 object-cover"
                />
                <div class="p-3">
                  <h3 class="font-bold text-sm mb-1 line-clamp-1">{rel.name}</h3>
                  <div class="flex flex-wrap gap-1">
                    <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">
                      {rel.type}
                    </span>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  {/if}
  
  <Footer />
</div>

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  @media (max-width: 768px) {
    .flex-shrink-0 {
      margin-left: auto;
      margin-right: auto;
    }
  }
</style>