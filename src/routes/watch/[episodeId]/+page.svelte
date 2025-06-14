<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import PlayerCard from '$lib/components/watch/PlayerCard.svelte';
  import ServerSelector from '$lib/components/watch/ServerSelector.svelte';
  import PlayerSelector from '$lib/components/watch/PlayerSelector.svelte';
  import type { PageData } from './$types.js';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  export let data;

  // --- Type Guards & Helpers ---
  const isError = (d: PageData): d is Extract<PageData, { error: string }> =>
    typeof d === 'object' && d !== null && 'error' in d;
  const safe = <T,>(v: T | undefined | null, fallback: T) => v ?? fallback;

  // --- State ---
  let episodes: any[] = !isError(data) ? safe(data.episodes, []) : [];
  let currentEpisodeId: string = safe(data.episodeId, '');
  let servers: { serverId: number; serverName: string; category: 'sub' | 'dub' | 'raw' }[] = [];
  let currentServer = '';
  let category: 'sub' | 'dub' | 'raw' = 'sub';
  let videoSrc = '';
  let subtitles: Array<{ url: string; label: string; lang: string; kind: string; default?: boolean }> = [];
  let poster = !isError(data) ? safe(data.anime?.info?.poster, 'https://example.com/default-poster.jpg') : 'https://example.com/default-poster.jpg';
  let title = !isError(data) ? safe(data.anime?.info?.name, 'Episode') : 'Episode';
  let intro: { start: number; end: number } | null = null;
  let outro: { start: number; end: number } | null = null;
  let useArtPlayer = true;
  let loading = true;

  // --- Pagination ---
  let episodesPerPage = 50;
  let currentPage = 1;
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

  // --- Proxy Helper ---
  function proxiedM3u8(url: string) {
    if (!url) return url;
    if (url.endsWith('.m3u8')) {
      // Optionally encode headers if needed
      return `/api/proxy/m3u8?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  // --- Fetch Logic ---
  async function fetchWatchData(episodeId: string, server: string, category: string) {
    loading = true;
    try {
      const params = new URLSearchParams({
        action: 'sources',
        animeEpisodeId: episodeId,
        server,
        category,
      });
      const apiUrl = `/api/anime?${params}`;
      const resp = await fetch(apiUrl);
      const json = await resp.json();

      if (!json.success) throw new Error('No sources');

      // Use proxy for m3u8 sources
      const source = json.data.sources?.[0]?.url || '';
      videoSrc = proxiedM3u8(source);

      subtitles = (json.data.tracks ?? []).map((track: any) => ({
        url: track.file,
        label: track.label,
        lang: track.label?.split(' ')[0]?.toLowerCase() || 'en',
        kind: track.kind || 'subtitles',
        default: track.default ?? false,
      }));

      intro = json.data.intro || null;
      outro = json.data.outro || null;
    } catch {
      videoSrc = '';
      subtitles = [];
      intro = null;
      outro = null;
    } finally {
      loading = false;
    }
  }

  async function fetchServers(episodeId: string) {
    try {
      const params = new URLSearchParams({
        action: 'servers',
        animeEpisodeId: episodeId,
      });
      const apiUrl = `/api/anime?${params.toString()}`;
      const resp = await fetch(apiUrl);
      const json = await resp.json();

      if (json.success) {
        servers = Object.entries(json.data)
          .filter(([category]) => ['sub', 'dub', 'raw'].includes(category))
          .flatMap(([category, serverList]: [string, unknown]) =>
            (serverList as any[]).map((server) => ({
              ...server,
              category: category as 'sub' | 'dub' | 'raw',
            }))
          )
          .sort((a, b) => a.serverName.localeCompare(b.serverName));
        servers = servers.filter((server) => server.serverName);

        if (!currentServer) {
          const defaultServer = servers.find((s) => s.category === category);
          if (defaultServer) {
            currentServer = defaultServer.serverName;
          }
        }
      }
    } catch (err) {
      // handle error
    }
  }

  // --- Navigation & Selection ---
  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) currentPage = page;
  }

  async function goToEpisode(episodeId: string) {
    if (episodeId && episodeId !== currentEpisodeId) {
      currentEpisodeId = episodeId;
      const animeKey = data.anime?.info?.id ? `lastEpisodeId:${data.anime.info.id}` : null;
      if (animeKey) localStorage.setItem(animeKey, episodeId);

      await fetchServers(episodeId);
      await fetchWatchData(episodeId, currentServer, category);

      goto(`/watch/${episodeId}`);
    }
  }

  function changeServerManual(serverName: string) {
    if (currentServer !== serverName) {
      currentServer = serverName;
      fetchWatchData(currentEpisodeId, currentServer, category);
    }
  }

  function changeCategoryManual(cat: 'sub' | 'dub' | 'raw') {
    if (category !== cat) {
      category = cat;
      fetchWatchData(currentEpisodeId, currentServer, category);
    }
  }

  function setUseArtPlayer(v: boolean) { useArtPlayer = v; }

  // --- On Mount: Restore Last Watched ---
  onMount(async () => {
    loading = true;
    const animeKey = data.anime?.info?.id ? `lastEpisodeId:${data.anime.info.id}` : null;
    let saved = animeKey ? localStorage.getItem(animeKey) : null;

    if (saved && episodes.some((e: any) => e.episodeId === saved)) {
      currentEpisodeId = saved;
      if (currentEpisodeId !== data.episodeId) goto(`/watch/${currentEpisodeId}`, { replaceState: true });
    } else if ((!currentEpisodeId || !episodes.some((e: any) => e.episodeId === currentEpisodeId)) && episodes.length > 0) {
      currentEpisodeId = episodes[0].episodeId;
      goto(`/watch/${currentEpisodeId}`, { replaceState: true });
    }

    await fetchServers(currentEpisodeId);

    if (currentServer) {
      await fetchWatchData(currentEpisodeId, currentServer, category);
    } else {
      const defaultServer = servers.find((s) => s.category === category);
      if (defaultServer) {
        currentServer = defaultServer.serverName;
        await fetchWatchData(currentEpisodeId, currentServer, category);
      }
    }
    loading = false;
  });

  function handlePageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedPage = parseInt(target.value, 10);
    if (!isNaN(selectedPage)) {
      goToPage(selectedPage);
    }
  }
</script>

<Navbar/>

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
  <div class="flex-1 px-4 py-4 pt-16 flex flex-col">
    {#if loading}
      <div class="flex-1 flex items-center justify-center">
        <img src="/assets/loader.gif" alt="Loading..." style="max-width: 120px; max-height: 110px;" />
      </div>
    {:else if isError(data)}
      <div class="max-w-2xl mx-auto text-center text-red-400 text-xl font-bold py-20">
        {safe(data.error, 'An unknown error occurred.')}
      </div>
    {:else}
      <div class="max-w-7xl mx-auto flex flex-col gap-10">
        <section class="flex-1 flex flex-col gap-8 mb-12">
          <!-- Player Card -->
          <div class="flex flex-col gap-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-2xl p-4 sm:p-8">
            <PlayerCard
              {videoSrc}
              {poster}
              {subtitles}
              {intro}
              {outro}
              {useArtPlayer}
              goToEpisode={goToEpisode}
            />

            <ServerSelector
              {servers}
              {currentServer}
              {category}
              changeServerManual={changeServerManual}
            />

            <PlayerSelector
              {useArtPlayer}
              setUseArtPlayer={setUseArtPlayer}
            />

            {#if episodes.length > 1}
              <div class="mb-2 flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-orange-400 text-xs">Pages:</span>
                  <select
                    class="px-2 py-1 rounded bg-gray-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                    on:change={handlePageChange}
                  >
                    {#each episodeRanges as range, i}
                      <option value={i + 1} selected={currentPage === i + 1}>{range}</option>
                    {/each}
                  </select>
                </div>
                <div class="grid grid-cols-5 sm:grid-cols-10 gap-1">
                  {#each pagedEpisodes as ep}
                    <button
                      class="flex items-center justify-center h-10 w-full rounded bg-gray-800 text-white font-bold text-xs transition
                        {ep.episodeId === currentEpisodeId
                          ? 'bg-orange-400 text-gray-900 shadow'
                          : 'hover:bg-orange-400 hover:text-gray-900'}"
                      on:click={() => goToEpisode(ep.episodeId)}
                      disabled={ep.episodeId === currentEpisodeId}
                    >
                      {ep.number}
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>

          <!-- Anime Info Card -->
          {#if data.anime && data.anime.info && data.anime.moreInfo}
            <div class="flex flex-col md:flex-row gap-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-2xl p-6 md:p-10">
              <div class="flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={data.anime.info.poster}
                  alt={data.anime.info.name}
                  class="rounded-lg shadow-2xl w-64 h-auto object-cover border-4 border-gray-800"
                />
              </div>
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
  </div>
  <Footer/>
</div>

<style>
  @media (max-width: 768px) {
    .flex-shrink-0 {
      margin-left: auto;
      margin-right: auto;
    }
  }
</style>