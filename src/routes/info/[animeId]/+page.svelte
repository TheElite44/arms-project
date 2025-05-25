<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import type { PageData } from './$types.js';
  export let data: PageData;
  const anime = data.anime?.info;
  const moreInfo = data.anime?.moreInfo;
  const recommended = data.recommendedAnimes ?? [];
  const related = data.relatedAnimes ?? [];

  // Add state for first episodeId
  let firstEpisodeId: string | null = null;

  // Fetch episodes on mount
  import { onMount } from 'svelte';
  onMount(async () => {
    if (anime?.id) {
      const resp = await fetch(`/api/episodes?animeId=${anime.id}`);
      const json = await resp.json();
      if (json.success && json.data.episodes?.length > 0) {
        firstEpisodeId = json.data.episodes[0].episodeId;
      }
    }
  });
</script>

<Navbar />

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white px-4 py-8 pt-16">
  {#if anime && moreInfo}
    <!-- Anime Info Section -->
    <section class="flex flex-col md:flex-row gap-8 mb-12">
      <!-- Poster -->
      <div class="flex-shrink-0">
        <img
          src={anime.poster}
          alt={anime.name}
          class="rounded-lg shadow-2xl w-64 h-auto object-cover"
        />
      </div>
      <!-- Details -->
      <div class="flex-1">
        <h1 class="text-4xl font-extrabold text-orange-400 mb-2">{anime.name}</h1>
        {#if moreInfo.genres}
          <div class="flex flex-wrap gap-2 mb-4">
            {#each moreInfo.genres as genre}
              <span class="bg-gray-800 text-orange-300 px-3 py-1 rounded-full text-xs">{genre}</span>
            {/each}
          </div>
        {/if}
        <p class="text-gray-200 mb-4">{anime.description}</p>
        <div class="flex flex-wrap gap-4 mb-4">
          <span class="bg-gray-800 px-3 py-1 rounded text-sm">Type: {anime.stats.type}</span>
          <span class="bg-gray-800 px-3 py-1 rounded text-sm">Episodes: {anime.stats.episodes.sub} Sub / {anime.stats.episodes.dub} Dub</span>
          <span class="bg-gray-800 px-3 py-1 rounded text-sm">Rating: {anime.stats.rating}</span>
          <span class="bg-gray-800 px-3 py-1 rounded text-sm">Quality: {anime.stats.quality}</span>
          <span class="bg-gray-800 px-3 py-1 rounded text-sm">Duration: {anime.stats.duration}</span>
          <span class="bg-gray-800 px-3 py-1 rounded text-sm">Status: {moreInfo.status}</span>
          <span class="bg-gray-800 px-3 py-1 rounded text-sm">Studios: {moreInfo.studios}</span>
        </div>
        <div class="text-gray-400 text-sm mb-2">Aired: {moreInfo.aired}</div>
        <!-- Watch Button -->
        {#if firstEpisodeId}
          <a href={`/home/watch/${firstEpisodeId}`} class="inline-block mt-4 bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-6 py-2 rounded transition">
            Watch Now
          </a>
        {:else}
          <button class="inline-block mt-4 bg-gray-700 text-gray-400 font-bold px-6 py-2 rounded cursor-not-allowed" disabled>
            Watch Now
          </button>
        {/if}
      </div>
    </section>

    <!-- Recommended Anime -->
    {#if recommended.length}
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-orange-400 mb-4">Recommended Anime</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {#each recommended as rec}
            <a href="/info/{rec.id}" class="bg-gray-800 rounded-lg shadow-lg overflow-hidden block hover:scale-105 transition-transform">
              <img src={rec.poster} alt={rec.name} class="w-full h-40 object-cover" />
              <div class="p-3">
                <h3 class="font-bold text-base mb-1">{rec.name}</h3>
                <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded text-xs">{rec.type}</span>
                <span class="ml-2 text-xs text-gray-300">{rec.episodes.sub} Sub / {rec.episodes.dub} Dub</span>
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
            <a href="/info/{rel.id}" class="bg-gray-800 rounded-lg shadow-lg overflow-hidden block hover:scale-105 transition-transform">
              <img src={rel.poster} alt={rel.name} class="w-full h-40 object-cover" />
              <div class="p-3">
                <h3 class="font-bold text-base mb-1">{rel.name}</h3>
                <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded text-xs">{rel.type}</span>
                <span class="ml-2 text-xs text-gray-300">{rel.episodes.sub} Sub / {rel.episodes.dub} Dub</span>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {:else}
    <div class="text-center text-red-400">Anime not found or failed to load.</div>
  {/if}
</div>