<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Player from '$lib/components/Player.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageData } from './$types.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  export let data: PageData;

  // Type guard for error state
  const isError = (d: PageData): d is Extract<PageData, { error: string }> =>
    typeof d === 'object' && d !== null && 'error' in d;

  // Defensive fallback for all fields
  const safe = <T,>(v: T | undefined | null, fallback: T) => v ?? fallback;

  // Episodes for selector
  let episodes = !isError(data) ? safe(data.episodes, []) : [];

  // Remember last selected episode using localStorage
  let currentEpisodeId: string = safe(data.episodeId, '');

  // Server/category selection
  type ServerWithCategory = { serverId: number; serverName: string; category: 'sub' | 'dub' | 'raw' };
  let servers: ServerWithCategory[] = [];
  let currentServer = '';
  let category: 'sub' | 'dub' | 'raw' = 'sub';

  // Video and subtitle sources
  let videoSrc = '';
  let subtitles: any[] = [];
  let poster = !isError(data) ? safe(data.poster, '') : '';
  let title = !isError(data) ? safe(data.anime?.info?.name, 'Episode') : 'Episode';

  // Track if initial selection is done to avoid double fetch
  let initialSelectionDone = false;

  // Pagination for episodes
  let episodesPerPage = 50;
  let currentPage = 1;
  $: totalPages = Math.ceil(episodes.length / episodesPerPage);
  $: pagedEpisodes = episodes.slice(
    (currentPage - 1) * episodesPerPage,
    currentPage * episodesPerPage
  );

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
    }
  }

  // On mount, set default to episode 1 if not set, else use last selected, and fetch servers
  onMount(async () => {
    const animeKey = data.anime?.info?.id ? `lastEpisodeId:${data.anime.info.id}` : null;
    let saved = null;
    if (animeKey) {
      saved = localStorage.getItem(animeKey);
    }
    // If saved episode exists for this anime, use it
    if (saved && episodes.some((e: any) => e.episodeId === saved)) {
      currentEpisodeId = saved;
      if (currentEpisodeId !== data.episodeId) {
        goto(`/home/watch/${currentEpisodeId}`, { replaceState: true });
      }
    }
    // Otherwise, default to episode 1 if not already on it
    else if ((!currentEpisodeId || !episodes.some((e: any) => e.episodeId === currentEpisodeId)) && episodes.length > 0) {
      currentEpisodeId = episodes[0].episodeId;
      goto(`/home/watch/${currentEpisodeId}`, { replaceState: true });
    }
    initialSelectionDone = true;
  });

  // Fetch servers from /api/episode/servers for the current episode and all categories
  async function fetchServers(episodeId: string) {
    try {
      const resp = await fetch(`/api/episode/servers?animeEpisodeId=${episodeId}`);
      const json = await resp.json();
      // Flatten all categories into one array with category info
      if (json.success && json.data) {
        servers = (['sub', 'dub', 'raw'] as const).flatMap((c) =>
          (json.data[c] ?? []).map((s: { serverId: number; serverName: string }) => ({
            ...s,
            category: c
          }))
        );
      } else {
        servers = [];
        currentServer = '';
        videoSrc = '';
        subtitles = [];
      }
    } catch {
      servers = [];
      currentServer = '';
      videoSrc = '';
      subtitles = [];
    }
  }

  // Fetch sources from /api/episode/sources for the current episode, server, and category
  async function fetchSources(episodeId: string, server: string, category: string) {
    try {
      const params = new URLSearchParams({
        animeEpisodeId: episodeId,
        server,
        category
      });
      const resp = await fetch(`/api/episode/sources?${params.toString()}`);
      const json = await resp.json();
      if (json.success && json.data) {
        videoSrc = json.data.sources?.[0]?.url ?? '';
        subtitles = json.data.subtitles ?? [];
      } else {
        videoSrc = '';
        subtitles = [];
      }
    } catch (err) {
      videoSrc = '';
      subtitles = [];
    }
  }

  // Reactively update servers and sources when episode or category changes (after initial selection)
  $: if (initialSelectionDone && currentEpisodeId) {
    (async () => {
      await fetchServers(currentEpisodeId);
      // After servers are loaded, auto-select the first sub server if available
      const subServers = servers.filter(s => s.category === 'sub');
      if (subServers.length > 0) {
        category = 'sub';
        currentServer = subServers[0].serverName;
        await fetchSources(currentEpisodeId, currentServer, category);
      } else {
        // fallback to dub or raw if sub not available
        const dubServers = servers.filter(s => s.category === 'dub');
        if (dubServers.length > 0) {
          category = 'dub';
          currentServer = dubServers[0].serverName;
          await fetchSources(currentEpisodeId, currentServer, category);
        } else {
          const rawServers = servers.filter(s => s.category === 'raw');
          if (rawServers.length > 0) {
            category = 'raw';
            currentServer = rawServers[0].serverName;
            await fetchSources(currentEpisodeId, currentServer, category);
          }
        }
      }
    })();
  }

  // Handle episode change
  async function goToEpisode(episodeId: string) {
    if (episodeId && episodeId !== currentEpisodeId) {
      currentEpisodeId = episodeId;
      // Save last watched episode for this anime
      const animeKey = data.anime?.info?.id ? `lastEpisodeId:${data.anime.info.id}` : null;
      if (animeKey) {
        localStorage.setItem(animeKey, episodeId);
      }
      // No extra args for fetchServers
      await fetchServers(episodeId);
      goto(`/home/watch/${episodeId}`);
    }
  }
  function changeServerManual(serverName: string) {
    currentServer = serverName;
    fetchSources(currentEpisodeId, currentServer, category);
  }
  function changeCategoryManual(cat: 'sub' | 'dub' | 'raw') {
    category = cat;
    fetchServers(currentEpisodeId);
  }
</script>

<Navbar />

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white px-4 py-8 pt-16 flex flex-col">
  {#if isError(data)}
    <div class="max-w-2xl mx-auto text-center text-red-400 text-xl font-bold py-20">
      {safe(data.error, 'An unknown error occurred.')}
    </div>
  {:else}
    <div class="max-w-7xl mx-auto flex flex-col gap-10">
      <!-- Main Info Card -->
      <section class="flex-1 flex flex-col gap-8 mb-12">
        <!-- Player Card -->
        <div class="flex flex-col gap-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-2xl p-4 sm:p-8">
          <div class="w-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
            <Player src={videoSrc} subtitles={subtitles} poster={poster} title={title} />
          </div>
          <!-- Controls -->
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <!-- Sub Servers -->
            {#if servers.some(s => s.category === 'sub')}
              <div class="flex gap-2 items-center mb-2">
                <span class="font-semibold text-orange-400 text-sm flex items-center gap-1">
                  <!-- Optional: Sub icon -->
                  <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2"></path><rect x="7" y="4" width="10" height="4" rx="1" /></svg>
                  Sub:
                </span>
                <div class="flex gap-2">
                  {#each servers.filter(s => s.category === 'sub') as server}
                    <button
                      on:click={() => { category = 'sub'; changeServerManual(server.serverName); }}
                      class="rounded-md bg-white/10 px-4 py-1.5 text-xs font-medium uppercase transition
                        {currentServer === server.serverName && category === 'sub'
                          ? 'bg-orange-400 text-black'
                          : 'text-white hover:bg-orange-400 hover:text-black'}"
                      disabled={currentServer === server.serverName && category === 'sub'}
                    >
                      {server.serverName}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Dub Servers -->
            {#if servers.some(s => s.category === 'dub')}
              <div class="flex gap-2 items-center mb-2">
                <span class="font-semibold text-orange-400 text-sm flex items-center gap-1">
                  <!-- Optional: Dub icon -->
                  <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M8 12h8M8 9h8"/></svg>
                  Dub:
                </span>
                <div class="flex gap-2">
                  {#each servers.filter(s => s.category === 'dub') as server}
                    <button
                      on:click={() => { category = 'dub'; changeServerManual(server.serverName); }}
                      class="rounded-md bg-white/10 px-4 py-1.5 text-xs font-medium uppercase transition
                        {currentServer === server.serverName && category === 'dub'
                          ? 'bg-orange-400 text-black'
                          : 'text-white hover:bg-orange-400 hover:text-black'}"
                      disabled={currentServer === server.serverName && category === 'dub'}
                    >
                      {server.serverName}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Raw Servers (optional) -->
            {#if servers.some(s => s.category === 'raw')}
              <div class="flex gap-2 items-center mb-2">
                <span class="font-semibold text-orange-400 text-sm">Raw:</span>
                <div class="flex gap-2">
                  {#each servers.filter(s => s.category === 'raw') as server}
                    <button
                      on:click={() => { category = 'raw'; changeServerManual(server.serverName); }}
                      class="rounded-md bg-white/10 px-4 py-1.5 text-xs font-medium uppercase transition
                        {currentServer === server.serverName && category === 'raw'
                          ? 'bg-orange-400 text-black'
                          : 'text-white hover:bg-orange-400 hover:text-black'}"
                      disabled={currentServer === server.serverName && category === 'raw'}
                    >
                      {server.serverName}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
          <!-- Redesigned Episode Selector with Pagination -->
          {#if episodes.length > 1}
            <div class="mb-2 flex flex-col gap-2">
              <div class="flex flex-wrap gap-2 items-center">
                <span class="font-semibold text-orange-400 text-sm">Episodes:</span>
                <div class="flex flex-wrap gap-2">
                  {#each pagedEpisodes as ep}
                    <button
                      class="px-3 py-1 rounded-lg text-xs font-bold transition
                        {ep.episodeId === currentEpisodeId
                          ? 'bg-orange-400 text-gray-900 shadow'
                          : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                      on:click={() => goToEpisode(ep.episodeId)}
                      disabled={ep.episodeId === currentEpisodeId}
                    >
                      {ep.number}
                    </button>
                  {/each}
                </div>
              </div>
              <!-- Pagination Controls -->
              {#if totalPages > 1}
                <div class="flex gap-2 items-center mt-2">
                  <button
                    class="px-2 py-1 rounded bg-gray-700 text-xs text-white disabled:opacity-50"
                    on:click={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  {#each Array(totalPages) as _, i}
                    <button
                      class="px-2 py-1 rounded text-xs font-bold
                        {currentPage === i + 1
                          ? 'bg-orange-400 text-gray-900'
                          : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                      on:click={() => goToPage(i + 1)}
                    >
                      {i * episodesPerPage + 1}-{Math.min((i + 1) * episodesPerPage, episodes.length)}
                    </button>
                  {/each}
                  <button
                    class="px-2 py-1 rounded bg-gray-700 text-xs text-white disabled:opacity-50"
                    on:click={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Anime Info Card -->
        {#if data.anime && data.anime.info && data.anime.moreInfo}
          <div class="flex flex-col md:flex-row gap-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-2xl p-6 md:p-10">
            <!-- Poster -->
            <div class="flex-shrink-0">
              <img
                src={data.anime.info.poster}
                alt={data.anime.info.name}
                class="rounded-lg shadow-2xl w-64 h-auto object-cover border-4 border-gray-800"
              />
            </div>
            <!-- Details -->
            <div class="flex-1 flex flex-col gap-4">
              <h1 class="text-3xl sm:text-4xl font-extrabold text-orange-400 mb-1">{data.anime.info.name}</h1>
              {#if data.anime.moreInfo.genres}
                <div class="flex flex-wrap gap-2 mb-2">
                  {#each data.anime.moreInfo.genres as genre}
                    <span class="bg-gray-800 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">{genre}</span>
                  {/each}
                </div>
              {/if}
              <p class="text-gray-200 text-base mb-2">{data.anime.info.description}</p>
              <div class="flex flex-wrap gap-2 mb-2">
                <span class="bg-orange-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow">Type: {data.anime.info.stats.type}</span>
                <span class="bg-gray-900 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">Episodes: {data.anime.info.stats.episodes.sub} Sub / {data.anime.info.stats.episodes.dub} Dub</span>
                <span class="bg-gray-900 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">Rating: {data.anime.info.stats.rating}</span>
                <span class="bg-gray-900 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">Quality: {data.anime.info.stats.quality}</span>
                <span class="bg-gray-900 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">Status: {data.anime.moreInfo.status}</span>
                <span class="bg-gray-900 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">Studios: {data.anime.moreInfo.studios}</span>
              </div>
              <div class="text-gray-400 text-sm mb-2">Aired: {data.anime.moreInfo.aired}</div>
            </div>
          </div>
        {/if}

        <!-- Next Episode Button -->
        {#if episodes.length > 0}
          {#each episodes as ep, i}
            {#if ep.episodeId === currentEpisodeId && episodes[i + 1]}
              <button
                class="mt-4 px-6 py-2 bg-orange-400 text-gray-900 font-bold rounded-lg shadow hover:bg-orange-500 transition"
                on:click={() => goToEpisode(episodes[i + 1].episodeId)}
              >
                ▶ Next Episode: Ep {episodes[i + 1].number}{episodes[i + 1].title ? `: ${episodes[i + 1].title}` : ''}
              </button>
            {/if}
          {/each}
        {/if}
      </section>
    </div>

    <!-- Recommended and Related Animes Sections -->
    {#if data.recommendedAnimes && data.recommendedAnimes.length}
      <section class="max-w-7xl mx-auto mt-12">
        <h2 class="text-xl font-bold text-orange-400 mb-4">Recommended Anime</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {#each data.recommendedAnimes as rec}
            <a href={`/info/${rec.id}`} class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden block hover:scale-105 hover:shadow-orange-400/40 transition-transform border-2 border-transparent hover:border-orange-400">
              <img src={rec.poster} alt={rec.name} class="w-full h-36 object-cover rounded-lg" />
              <div class="p-3">
                <h3 class="font-bold text-base mb-1 truncate">{rec.name}</h3>
                <div class="flex flex-wrap gap-1 mb-1">
                  <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">{rec.type}</span>
                  <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-xs">{rec.episodes.sub} Sub / {rec.episodes.dub} Dub</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if data.relatedAnimes && data.relatedAnimes.length}
      <section class="max-w-7xl mx-auto mt-10">
        <h2 class="text-xl font-bold text-orange-400 mb-4">Related Anime</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {#each data.relatedAnimes as rel}
            <a href={`/info/${rel.id}`} class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden block hover:scale-105 hover:shadow-orange-400/40 transition-transform border-2 border-transparent hover:border-orange-400">
              <img src={rel.poster} alt={rel.name} class="w-full h-36 object-cover rounded-lg" />
              <div class="p-3">
                <h3 class="font-bold text-base mb-1 truncate">{rel.name}</h3>
                <div class="flex flex-wrap gap-1 mb-1">
                  <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">{rel.type}</span>
                  <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-xs">{rel.episodes.sub} Sub / {rel.episodes.dub} Dub</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
  <Footer />
</div>

<!-- Remove Vidstack CSS imports from here! -->
<!-- Instead, add them to your src/app.css or src/global.css: -->
<!--
@import '@vidstack/player/styles/default/theme.css';
@import '@vidstack/player/styles/default/layouts/video.css';
-->
