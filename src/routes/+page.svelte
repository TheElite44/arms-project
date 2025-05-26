<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import AnimeInfoPopover from '$lib/components/AnimeInfoPopover.svelte';

  // Example anime data, replace with your real data or load from API
  export let animes: Array<{
    id: string;
    title: string;
    image: string;
    description: string;
  }> = [];

  let infoBoxId: string | null = null;
  function showInfo(id: string) { infoBoxId = id; }
  function hideInfo(id: string) { if (infoBoxId === id) infoBoxId = null; }
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
  <div>
    <Navbar />
  </div>

  <!-- Hero Section -->
  <section class="flex flex-col md:flex-row items-center justify-between px-4 sm:px-8 py-10 sm:py-16">
    <div class="max-w-xl">
      <h1 class="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-orange-400 drop-shadow-lg">
        Stream Your Favorite Anime <span class="text-white">on ARMS</span>
      </h1>
      <p class="text-base sm:text-lg md:text-xl mb-8 text-gray-300">
        Discover, watch, and enjoy the latest and greatest anime series, all in one place. Join ARMS and start your anime adventure today!
      </p>
      <a href="/home" class="inline-block px-8 py-3 bg-orange-400 text-gray-900 font-bold rounded shadow hover:bg-orange-300 transition">
        Start Watching
      </a>
    </div>
    <div class="mt-10 md:mt-0 md:ml-12 w-full max-w-md">
      <img src="https://static.crunchyroll.com/fms/landscape_large/65/png/7e9e7e3e-2e6a-4b2b-8e8b-7e9e7e3e2e6a.png" alt="Featured Anime" class="rounded-lg shadow-2xl w-full" />
    </div>
  </section>

  <!-- Anime Cards Section -->
  <section class="px-4 sm:px-8 py-10 sm:py-16">
    <div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {#each animes as anime (anime.id)}
        <div class="relative group"
          on:mouseenter={() => showInfo(anime.id)}
          on:focus={() => showInfo(anime.id)}
          on:mouseleave={() => hideInfo(anime.id)}
          on:touchstart={() => showInfo(anime.id)}
          tabindex="0"
        >
          <a href={`/info/${anime.id}`} class="block p-4 bg-gray-800 rounded-lg shadow hover:shadow-lg transition">
            <img src={anime.image} alt={anime.title} class="w-full h-40 object-cover rounded-lg mb-4" />
            <h3 class="text-lg sm:text-xl font-semibold mb-2 truncate" style="max-width:100%" title={anime.title}>{anime.title}</h3>
            <p class="text-gray-400 text-sm line-clamp-2">{anime.description}</p>
          </a>
          {#if infoBoxId === anime.id}
            <AnimeInfoPopover animeId={anime.id} on:close={() => hideInfo(anime.id)} />
          {/if}
        </div>
      {/each}
    </div>
  </section>
</div>
