<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  let loading = true;
  let error: string | null = null;
  let data: any = null;

  onMount(async () => {
    try {
      const resp = await fetch('/api/home');
      const json = await resp.json();
      if (json.success) {
        data = json.data;
      } else {
        error = json.error || 'Failed to load data';
      }
    } catch (e) {
      error = 'Failed to load data';
    } finally {
      loading = false;
    }
  });
</script>

<Navbar />

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white px-4 py-8 pt-16">
  {#if loading}
    <div class="text-center text-xl text-orange-400">Loading...</div>
  {:else if error}
    <div class="text-center text-red-400">{error}</div>
  {:else}
    <!-- Spotlight Anime -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-orange-400 mb-4">Spotlight Anime</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each data.spotlightAnimes as anime}
          <a href={`/info/${anime.id}`} class="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col hover:scale-105 transition-transform">
            <img src={anime.poster} alt={anime.name} class="w-full h-56 object-cover" />
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-lg mb-2">{anime.name}</h3>
              <p class="text-gray-400 text-sm mb-2 line-clamp-3">{anime.description}</p>
              <div class="mt-auto flex flex-wrap gap-2">
                <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded text-xs">Rank #{anime.rank}</span>
                <span class="bg-gray-700 px-2 py-0.5 rounded text-xs">{anime.episodes.sub} Sub / {anime.episodes.dub} Dub</span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </section>

    <!-- Trending Anime -->
    <section>
      <h2 class="text-2xl font-bold text-orange-400 mb-4">Trending Anime</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {#each data.trendingAnimes as anime}
          <a href={`/info/${anime.id}`} class="bg-gray-800 rounded-lg shadow-lg overflow-hidden block hover:scale-105 transition-transform">
            <img src={anime.poster} alt={anime.name} class="w-full h-40 object-cover" />
            <div class="p-3">
              <h3 class="font-bold text-base mb-1">{anime.name}</h3>
              <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded text-xs">Rank #{anime.rank}</span>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}
</div>