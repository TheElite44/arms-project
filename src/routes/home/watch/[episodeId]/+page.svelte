<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Player from '$lib/components/Player.svelte';
  import type { PageData } from './$types.js';
  import { goto } from '$app/navigation';
  export let data: PageData;

  // Type guard for error state
  const isError = (d: PageData): d is Extract<PageData, { error: string }> =>
    typeof d === 'object' && d !== null && 'error' in d;

  // Defensive fallback for all fields
  const safe = <T,>(v: T | undefined | null, fallback: T) => v ?? fallback;

  // Video and subtitle sources
  let videoSrc = !isError(data) ? safe(data.sources?.sources?.[0]?.url, '') : '';
  let subtitles = !isError(data) ? safe(data.sources?.subtitles, []) : [];
  let poster = !isError(data) ? safe(data.poster, '') : '';
  let title = !isError(data) ? safe(data.anime?.info?.name, 'Episode') : 'Episode';

  // Episodes for selector
  let episodes = !isError(data) ? safe(data.episodes, []) : [];
  let currentEpisodeId = safe(data.episodeId, '');

  // Server/category selection (if available)
  let servers = !isError(data) ? safe(data.servers, safe(data.sources?.servers, [])) : [];
  let currentServer = servers?.[0]?.serverName ?? '';
  let category = !isError(data) ? safe(data.category, 'sub') : 'sub';

  // Handle episode change
  function goToEpisode(episodeId: string) {
    if (episodeId) goto(`/home/watch/${episodeId}`);
  }

  function changeServer(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (target) currentServer = target.value;
  }
  function changeCategory(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    if (target) category = target.value;
  }
</script>

<Navbar />

<!-- Main container with home color scheme -->
<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pt-16">
  {#if isError(data)}
    <div class="max-w-2xl mx-auto text-center text-red-400 text-xl font-bold py-20">
      {safe(data.error, 'An unknown error occurred.')}
    </div>
  {:else}
    <div class="max-w-7xl mx-auto px-2 sm:px-4 flex flex-col lg:flex-row gap-8 mt-6">
      <!-- Main content (player, info, description) -->
      <div class="flex-1 flex flex-col gap-6">
        <!-- Player -->
        <div class="w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg bg-black aspect-video">
          {#if videoSrc}
            <Player src={videoSrc} subtitles={subtitles} poster={poster} title={title} />
          {:else}
            <div class="flex items-center justify-center h-full text-red-400 text-lg">No video source found for this episode.</div>
          {/if}
        </div>

        <!-- Title and controls -->
        <div class="mt-4 flex flex-col gap-2">
          <h1 class="text-2xl font-bold text-white">{title}</h1>
          <div class="flex flex-wrap gap-4 text-sm text-gray-400">
            <span>{data.anime?.info?.stats?.type}</span>
            <span>{data.anime?.info?.stats?.quality}</span>
            <span>{data.anime?.info?.stats?.rating}</span>
          </div>
          <div class="flex gap-4 items-center mt-2">
            {#if servers && servers.length > 1}
              <select bind:value={currentServer} on:change={changeServer} class="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm">
                {#each servers as server}
                  <option value={server.serverName}>{server.serverName}</option>
                {/each}
              </select>
            {/if}
            <select bind:value={category} on:change={changeCategory} class="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm">
              <option value="sub">Sub</option>
              <option value="raw">Raw</option>
            </select>
          </div>
        </div>

        <!-- Anime info/description -->
        {#if data.anime && data.anime.info && data.anime.moreInfo}
          <div class="bg-gray-800 rounded-xl p-6 shadow-lg mt-4 flex flex-col md:flex-row gap-8 items-start">
            <!-- Anime Poster -->
            <img
              src={data.anime.info.poster}
              alt={data.anime.info.name}
              class="w-40 h-auto rounded-lg shadow-lg mb-4 md:mb-0"
              style="object-fit:cover;"
            />

            <!-- Anime Details -->
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-orange-400 mb-2">{data.anime.info.name}</h2>
              <div class="flex flex-wrap gap-2 mb-3">
                {#each data.anime.moreInfo.genres as genre}
                  <span class="bg-gray-900 text-orange-300 px-3 py-1 rounded-full text-xs">{genre}</span>
                {/each}
              </div>
              <div class="flex flex-wrap gap-4 mb-2 text-sm text-gray-400">
                <span>Type: {data.anime.info.stats.type}</span>
                <span>Episodes: {data.anime.info.stats.episodes.sub} Sub / {data.anime.info.stats.episodes.dub} Dub</span>
                <span>Status: {data.anime.moreInfo.status}</span>
                <span>Studios: {data.anime.moreInfo.studios}</span>
                <span>Aired: {data.anime.moreInfo.aired}</span>
                <span>Rating: {data.anime.info.stats.rating}</span>
                <span>Quality: {data.anime.info.stats.quality}</span>
              </div>
              <div class="flex gap-2 mt-2">
                <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">HD</span>
                {#if data.anime?.moreInfo?.status === 'Ongoing'}
                  <span class="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">Ongoing</span>
                {/if}
              </div>
              <p class="text-gray-200 mt-2">{data.anime.info.description}</p>
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
      </div>

      <!-- Sidebar (episodes and recommended) -->
      <aside class="w-full lg:w-96 flex-shrink-0 flex flex-col gap-8 mt-8 lg:mt-0">
        <!-- Episode List -->
        <div class="bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 class="text-lg font-semibold mb-3">Episodes</h3>
          <div class="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
            {#each episodes as ep}
              <button
                class="w-full text-left px-3 py-2 rounded-lg font-semibold transition
                  {ep.episodeId === currentEpisodeId
                    ? 'bg-orange-400 text-gray-900'
                    : 'bg-gray-900 text-white hover:bg-orange-400 hover:text-gray-900'}"
                on:click={() => goToEpisode(ep.episodeId)}
                disabled={ep.episodeId === currentEpisodeId}
              >
                Ep {ep.number}{ep.title ? `: ${ep.title}` : ''}
              </button>
            {/each}
          </div>
        </div>

        <!-- Recommended Section -->
        {#if data.recommendedAnimes && data.recommendedAnimes.length}
          <div class="bg-gray-800 rounded-xl p-4 shadow-lg">
            <h3 class="text-lg font-semibold mb-3">Recommended for You</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {#each data.recommendedAnimes as anime}
                <a href={`/info/${anime.id}`} class="group block rounded-lg overflow-hidden bg-gray-900 hover:bg-orange-400 transition shadow hover:shadow-xl">
                  <div class="relative">
                    <img src={anime.poster} alt={anime.name} class="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-200" />
                    <span class="absolute top-2 left-2 bg-black/70 text-xs text-white px-2 py-0.5 rounded">{anime.type}</span>
                  </div>
                  <div class="p-2">
                    <div class="font-semibold text-white group-hover:text-gray-900 truncate">{anime.name}</div>
                    {#if anime.genres}
                      <div class="flex flex-wrap gap-1 mt-1">
                        {#each anime.genres.slice(0, 2) as genre}
                          <span class="bg-gray-700 text-xs text-orange-300 px-2 py-0.5 rounded">{genre}</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      </aside>
    </div>
  {/if}
</div>

<!-- Remove Vidstack CSS imports from here! -->
<!-- Instead, add them to your src/app.css or src/global.css: -->
<!--
@import '@vidstack/player/styles/default/theme.css';
@import '@vidstack/player/styles/default/layouts/video.css';
-->
