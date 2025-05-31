<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageData } from './$types.js';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  export let data: PageData;

  $: anime = data.anime?.info;
  $: moreInfo = data.anime?.moreInfo;
  $: recommended = data.recommendedAnimes ?? [];
  $: related = data.relatedAnimes ?? [];

  let firstEpisodeId: string | null = null;
  let sidebarTab: 'airing' | 'upcoming' = 'airing';
  let topAiringAnimes: any[] = [];
  let topUpcomingAnimes: any[] = [];
  let isLoading = false;

  async function handleAnimeClick(animeId: string) {
    isLoading = true;
    try {
      await goto(`/info/${animeId}`);
      await initializeData();
    } finally {
      isLoading = false;
    }
  }

  async function initializeData() {
    const animeId = data.anime?.info?.id || '';
    if (!animeId) return;
    await fetchEpisodes(animeId);
  }

  $: if (data.anime?.info?.id) {
    initializeData();
  }

  async function fetchEpisodes(animeId: string) {
    firstEpisodeId = null; // Reset before fetching
    
    try {
      const resp = await fetch(`/api/anime?action=episodes&animeId=${animeId}`);
      const json = await resp.json();

      if (json.success && json.data.episodes?.length > 0) {
        firstEpisodeId = json.data.episodes[0].episodeId;
      }
    } catch (err) {
      console.error('Error fetching episodes:', err);
    }

    try {
      const resp = await fetch('/api/home');
      const json = await resp.json();
      if (json.success && json.data) {
        topAiringAnimes = json.data.topAiringAnimes ?? [];
        topUpcomingAnimes = json.data.topUpcomingAnimes ?? [];
      }
    } catch (e) {
      topAiringAnimes = [];
      topUpcomingAnimes = [];
    }
  }
</script>

<Navbar />

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white px-4 py-8 pt-16 flex flex-col">
  {#if isLoading}
    <div class="flex-1 flex items-center justify-center">
      <img
        src="/assets/loader.gif"
        alt="Loading..."
        class="w-24 h-24 object-contain"
      />
    </div>
  {:else if anime && moreInfo}
    <div class="max-w-7xl mx-auto flex flex-col xl:flex-row gap-10 flex-1">
      <!-- Main Info Card -->
      <section class="flex-1 flex flex-col gap-8 mb-12">
        <div class="flex flex-col md:flex-row gap-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-2xl p-6 md:p-10">
          <!-- Poster -->
          <div class="flex-shrink-0 mx-auto md:mx-0">
            <img
              src={anime.poster}
              alt={anime.name}
              class="rounded-lg shadow-2xl w-64 h-auto object-cover border-4 border-gray-800"
            />
          </div>
          <!-- Details -->
          <div class="flex-1 flex flex-col gap-4">
            <h1 class="text-3xl sm:text-4xl font-extrabold text-orange-400 mb-1">{anime.name}</h1>
            {#if moreInfo.genres}
              <div class="flex flex-wrap gap-2 mb-2">
                {#each moreInfo.genres as genre}
                  <span class="bg-gray-800 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">{genre}</span>
                {/each}
              </div>
            {/if}
            <p class="text-gray-200 text-base mb-2">{anime.description}</p>
            <div class="flex flex-wrap gap-2 mb-2">
              {#if firstEpisodeId}
                <a
                  href={`/watch/${firstEpisodeId}`}
                  class="inline-flex items-center gap-2 mt-2 bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-4 py-2 rounded-lg shadow transition text-sm"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 4l12 6-12 6V4z"/></svg>
                  Watch
                </a>
              {:else}
                <button
                  class="inline-flex items-center gap-2 mt-2 bg-gray-700 text-gray-400 font-bold px-4 py-2 rounded-lg cursor-not-allowed text-sm"
                  disabled
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 4l12 6-12 6V4z"/></svg>
                  Watch
                </button>
              {/if}
            </div>
          </div>
        </div>

        <!-- Recommended Anime -->
        {#if recommended.length}
          <section class="mb-12">
            <h2 class="text-2xl font-bold text-orange-400 mb-4">Recommended Anime</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              {#each recommended as rec}
                <a 
                  href={`/info/${rec.id}`} 
                  on:click|preventDefault={() => handleAnimeClick(rec.id)}
                  class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden block hover:scale-105 hover:shadow-orange-400/40 transition-transform border-2 border-transparent hover:border-orange-400"
                >
                  <img src={rec.poster} alt={rec.name} class="w-full h-40 object-cover rounded-lg" />
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

        <!-- Related Anime -->
        {#if related.length}
          <section>
            <h2 class="text-2xl font-bold text-orange-400 mb-4">Related Anime</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              {#each related as rel}
                <a 
                  href={`/info/${rel.id}`}
                  on:click|preventDefault={() => handleAnimeClick(rel.id)}
                  class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden block hover:scale-105 hover:shadow-orange-400/40 transition-transform border-2 border-transparent hover:border-orange-400"
                >
                  <img src={rel.poster} alt={rel.name} class="w-full h-40 object-cover rounded-lg" />
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
      </section>

      <!-- Sidebar Component using API data -->
      <Sidebar
        {sidebarTab}
        setSidebarTab={(tab) => sidebarTab = tab}
        {topAiringAnimes}
        {topUpcomingAnimes}
      />
    </div>
  {:else}
    <div class="text-center text-red-400 flex-1">Anime not found or failed to load.</div>
  {/if}
  <Footer />
</div>

<style>
  @media (max-width: 768px) {
    .flex-shrink-0 {
      margin-left: auto;
      margin-right: auto;
    }
  }
</style>