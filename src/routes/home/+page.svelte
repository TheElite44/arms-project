<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'; // SvelteKit navigation
  import Navbar from '$lib/components/Navbar.svelte';
  import AnimeInfoPopover from '$lib/components/AnimeInfoPopover.svelte';

  let loading = true;
  let error: string | null = null;
  let data: any = null;

  // Carousel state
  let carouselIndex = 0;
  let carouselInterval: any = null;

  let activeTab: 'trending' | 'popular' | 'topRated' | 'latest' = 'trending';
  let sidebarTab: 'airing' | 'upcoming' = 'airing';

  // Info popover state
  let infoBoxId: string | null = null;

  onMount(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/home');
        const json = await resp.json();
        if (!cancelled) {
          if (json.success) {
            data = json.data;
          } else {
            error = json.error || 'Failed to load data';
          }
        }
      } catch (e) {
        if (!cancelled) error = 'Failed to load data';
      } finally {
        if (!cancelled) loading = false;
      }

      carouselInterval = setInterval(() => {
        if (data?.top10Animes?.today?.length > 0) {
          carouselIndex = (carouselIndex + 1) % data.top10Animes.today.length;
        }
      }, 5000);
    })();

    return () => {
      cancelled = true;
      clearInterval(carouselInterval);
    };
  });

  function prevSlide() {
    if (data?.top10Animes?.today?.length > 0) {
      carouselIndex = (carouselIndex - 1 + data.top10Animes.today.length) % data.top10Animes.today.length;
    }
  }
  function nextSlide() {
    if (data?.top10Animes?.today?.length > 0) {
      carouselIndex = (carouselIndex + 1) % data.top10Animes.today.length;
    }
  }
  function setTab(tab: typeof activeTab) {
    activeTab = tab;
  }
  function showInfo(id: string) {
    infoBoxId = id;
  }
  function hideInfo(id: string) {
    if (infoBoxId === id) infoBoxId = null;
  }

  // Helper for fetching info
  async function fetchAnimeInfo(animeId: string) {
    const resp = await fetch(`/api/info?animeId=${animeId}`);
    return await resp.json();
  }
</script>

<Navbar />

<div class="w-full min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pt-16">
  <div class="max-w-[125rem] mx-auto flex flex-col gap-6 sm:gap-10 px-2 sm:px-6">
    {#if loading}
      <div class="text-center text-xl text-orange-400 py-16">Loading...</div>
    {:else if error}
      <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl my-4">
        <p class="font-bold">ERROR: {error}</p>
      </div>
    {:else}
      <!-- Carousel -->
      {#if data.top10Animes?.today && data.top10Animes.today.length > 0}
        <section class="mb-4 sm:mb-8">
          <div class="relative w-full max-w-[1800px] mx-auto rounded-3xl overflow-hidden shadow-2xl min-h-[220px] sm:min-h-[420px] flex items-center bg-black">
            {#if data.top10Animes.today[carouselIndex]}
              <a href={`/info/${data.top10Animes.today[carouselIndex].id}`} class="block group relative w-full h-[220px] sm:h-[420px]">
                <div class="absolute inset-0 w-full h-full">
                  <img
                    src={data.top10Animes.today[carouselIndex].poster}
                    alt={data.top10Animes.today[carouselIndex].name}
                    class="w-full h-full object-cover rounded-3xl"
                    style="object-position:center;"
                    draggable="false"
                  />
                  <div class="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/60 to-transparent rounded-3xl pointer-events-none"></div>
                </div>
                <div class="absolute left-3 sm:left-6 bottom-3 sm:bottom-10 z-10 max-w-[95vw] sm:max-w-[60%] flex flex-col gap-2 sm:gap-4">
                  <h2 class="text-white text-lg sm:text-3xl md:text-4xl font-bold truncate drop-shadow">{data.top10Animes.today[carouselIndex].name}</h2>
                  <div class="flex gap-2 sm:gap-3 text-white text-xs sm:text-base font-medium">
                    <span class="flex items-center gap-1 bg-orange-400 text-gray-900 px-2 sm:px-3 py-1 rounded-full text-xs font-bold shadow">
                      Rank #{data.top10Animes.today[carouselIndex].rank}
                    </span>
                    <span class="flex items-center gap-1 bg-gray-900 text-orange-300 px-2 sm:px-3 py-1 rounded text-xs">
                      {data.top10Animes.today[carouselIndex].episodes.sub} Sub / {data.top10Animes.today[carouselIndex].episodes.dub} Dub
                    </span>
                  </div>
                  <p class="text-gray-200 text-xs sm:text-base line-clamp-2 sm:line-clamp-3 max-w-xs sm:max-w-xl drop-shadow">
                    {data.top10Animes.today[carouselIndex].description ?? ''}
                  </p>
                </div>
                <button
                  class="absolute right-3 sm:right-10 bottom-3 sm:bottom-10 z-10 flex items-center gap-2 sm:gap-3 bg-orange-400 text-gray-900 font-bold rounded-lg px-4 sm:px-8 py-2 sm:py-4 text-xs sm:text-lg shadow-lg hover:bg-orange-500 transition"
                  title="Watch now"
                  on:click|preventDefault={() => goto(`/watch/${data.top10Animes.today[carouselIndex].id}`)}
                >
                  <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6 4l12 6-12 6V4z"/></svg>
                  <span class="hidden sm:inline">WATCH NOW</span>
                </button>
              </a>
            {/if}
            <!-- Carousel Controls -->
            <button on:click={prevSlide} class="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-orange-400 text-white hover:text-gray-900 rounded-full w-8 sm:w-14 h-8 sm:h-14 flex items-center justify-center shadow-lg transition z-10 border-2 border-white/10 hover:border-orange-400">
              <svg class="w-5 h-5 sm:w-8 sm:h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button on:click={nextSlide} class="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-orange-400 text-white hover:text-gray-900 rounded-full w-8 sm:w-14 h-8 sm:h-14 flex items-center justify-center shadow-lg transition z-10 border-2 border-white/10 hover:border-orange-400">
              <svg class="w-5 h-5 sm:w-8 sm:h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
            </button>
            <!-- Dots -->
            <div class="absolute bottom-2 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-3 z-10">
              {#each data.top10Animes.today as _, i}
                <span class="w-2 h-2 sm:w-4 sm:h-4 rounded-full border-2 {i === carouselIndex ? 'bg-orange-400 border-orange-400' : 'bg-gray-800 border-gray-400'} inline-block transition"></span>
              {/each}
            </div>
          </div>
        </section>
      {/if}

      <!-- Main content and sidebar layout -->
      <div class="flex flex-col xl:flex-row gap-6 sm:gap-10 w-full">
        <!-- Main content -->
        <div class="flex-1 flex flex-col gap-6 sm:gap-10">
          <!-- Spotlight Anime -->
          <section class="max-w-[1800px] mx-auto px-2">
            <h2 class="text-xl sm:text-2xl font-bold text-orange-400 mb-4 sm:mb-6 flex items-center gap-3">
              <svg class="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20m10-10H2" /></svg>
              Spotlight Anime
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
              {#each data.spotlightAnimes as anime}
                <a href={`/info/${anime.id}`} class="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col hover:scale-[1.03] hover:shadow-orange-400/40 transition-transform duration-200 border-2 border-transparent hover:border-orange-400">
                  <div class="relative">
                    <img src={anime.poster} alt={anime.name} class="w-full h-48 sm:h-64 object-cover group-hover:brightness-90 transition" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
                    <span class="absolute top-3 left-3 bg-orange-400 text-gray-900 px-3 py-0.5 rounded-full text-[10px] font-bold shadow-lg">Rank #{anime.rank}</span>
                    <span class="absolute bottom-3 right-3 bg-gray-900/80 text-orange-300 px-2 py-0.5 rounded text-[10px] shadow">{anime.episodes.sub} Sub / {anime.episodes.dub} Dub</span>
                  </div>
                  <div class="p-4 flex-1 flex flex-col">
                    <h3
                      class="font-bold truncate text-base sm:text-lg mb-1 group-hover:text-orange-400 transition"
                      style="max-width:100%"
                      title={anime.name}
                    >
                      {anime.name}
                    </h3>
                    <p class="text-gray-300 text-xs mb-2 line-clamp-3">{anime.description}</p>
                    <div class="flex flex-wrap gap-1 mt-auto">
                      {#each anime.genres?.slice(0, 3) as genre}
                        <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-[10px]">{genre}</span>
                      {/each}
                    </div>
                  </div>
                  <div class="flex justify-between items-center px-4 pb-4 pt-1">
                    <span class="text-[10px] text-gray-400">{anime.year}</span>
                    <span class="text-[10px] bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full font-bold">{anime.type}</span>
                  </div>
                </a>
              {/each}
            </div>
          </section>

          <!-- Tabs for Trending/Popular/Top Rated/Latest Episodes -->
          <section class="max-w-[1800px] mx-auto px-2">
            <div class="flex flex-wrap gap-2 justify-center mb-4 sm:mb-6">
              <button
                class="px-3 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition
                  {activeTab === 'trending' ? 'bg-orange-400 text-gray-900' : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                on:click={() => setTab('trending')}
              >TRENDING</button>
              <button
                class="px-3 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition
                  {activeTab === 'popular' ? 'bg-orange-400 text-gray-900' : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                on:click={() => setTab('popular')}
              >POPULAR</button>
              <button
                class="px-3 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition
                  {activeTab === 'topRated' ? 'bg-orange-400 text-gray-900' : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                on:click={() => setTab('topRated')}
              >TOP RATED</button>
              <button
                class="px-3 sm:px-6 py-2 rounded-xl font-bold text-xs sm:text-sm transition
                  {activeTab === 'latest' ? 'bg-orange-400 text-gray-900' : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                on:click={() => setTab('latest')}
              >LATEST EPISODES</button>
            </div>
            <div>
              {#if activeTab === 'trending'}
                <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-8">
                  <!-- Example for TRENDING, repeat for POPULAR, TOP RATED, LATEST EPISODES -->
                  {#each data.trendingAnimes as anime (anime.id)}
                    <div
                      class="relative group"
                      on:mouseenter={() => showInfo(anime.id)}
                      on:focus={() => showInfo(anime.id)}
                      on:mouseleave={() => hideInfo(anime.id)}
                      on:touchstart={() => showInfo(anime.id)}
                      tabindex="0"
                    >
                      <a href={`/info/${anime.id}`} class="group bg-gray-800 rounded-2xl shadow-lg overflow-hidden block hover:scale-[1.03] hover:shadow-2xl transition-transform duration-200 border-2 border-transparent hover:border-orange-400">
                        <div class="relative">
                          <img src={anime.poster} alt={anime.name} class="w-full h-40 sm:h-52 object-cover group-hover:brightness-90 transition" />
                          <span class="absolute top-2 left-2 bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold shadow">#{anime.rank}</span>
                        </div>
                        <div class="p-2 sm:p-4">
                          <h3
                            class="font-bold truncate text-xs sm:text-base mb-1 group-hover:text-orange-400 transition"
                            style="max-width:100%"
                            title={anime.name}
                          >
                            {anime.name}
                          </h3>
                          <div class="flex flex-wrap gap-1">
                            {#each anime.genres?.slice(0, 2) as genre}
                              <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded text-xs">{genre}</span>
                            {/each}
                          </div>
                        </div>
                      </a>
                      <!-- Floating Info Box -->
                      {#if infoBoxId === anime.id}
                        <AnimeInfoPopover animeId={anime.id} on:close={() => hideInfo(anime.id)} />
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else if activeTab === 'popular'}
                <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-8">
                  {#each data.mostPopularAnimes as anime}
                    <div class="relative group">
                      <a href={`/info/${anime.id}`} class="group bg-gray-800 rounded-2xl shadow-lg overflow-hidden block hover:scale-[1.03] hover:shadow-2xl transition-transform duration-200 border-2 border-transparent hover:border-orange-400">
                        <div class="relative">
                          <img src={anime.poster} alt={anime.name} class="w-full h-40 sm:h-52 object-cover group-hover:brightness-90 transition" />
                        </div>
                        <div class="p-2 sm:p-4">
                          <h3
                            class="font-bold truncate text-xs sm:text-base mb-1 group-hover:text-orange-400 transition"
                            style="max-width:100%"
                            title={anime.name}
                          >
                            {anime.name}
                          </h3>
                          <div class="flex flex-wrap gap-1">
                            {#each anime.genres?.slice(0, 2) as genre}
                              <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded text-xs">{genre}</span>
                            {/each}
                          </div>
                        </div>
                      </a>
                      <!-- Floating Info Box -->
                      <div
                        class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 sm:w-80 bg-black/90 rounded-xl shadow-xl z-30 p-3 sm:p-4 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 transition-all duration-200"
                        style="min-width:12rem; max-width:90vw;"
                      >
                        <div class="font-bold text-xs sm:text-base text-orange-400 mb-1 truncate" title={anime.name}>{anime.name}</div>
                        <div class="text-xs sm:text-sm text-gray-200 line-clamp-4">{anime.description}</div>
                        <div class="flex flex-wrap gap-1 mt-2">
                          {#each anime.genres?.slice(0, 3) as genre}
                            <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded text-[10px]">{genre}</span>
                          {/each}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else if activeTab === 'topRated'}
                <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-8">
                  {#each data.mostFavoriteAnimes as anime}
                    <div class="relative group">
                      <a href={`/info/${anime.id}`} class="group bg-gray-800 rounded-2xl shadow-lg overflow-hidden block hover:scale-[1.03] hover:shadow-2xl transition-transform duration-200 border-2 border-transparent hover:border-orange-400">
                        <div class="relative">
                          <img src={anime.poster} alt={anime.name} class="w-full h-40 sm:h-52 object-cover group-hover:brightness-90 transition" />
                        </div>
                        <div class="p-2 sm:p-4">
                          <h3
                            class="font-bold truncate text-xs sm:text-base mb-1 group-hover:text-orange-400 transition"
                            style="max-width:100%"
                            title={anime.name}
                          >
                            {anime.name}
                          </h3>
                          <div class="flex flex-wrap gap-1">
                            {#each anime.genres?.slice(0, 2) as genre}
                              <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded text-xs">{genre}</span>
                            {/each}
                          </div>
                        </div>
                      </a>
                      <!-- Floating Info Box -->
                      <div
                        class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 sm:w-80 bg-black/90 rounded-xl shadow-xl z-30 p-3 sm:p-4 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 transition-all duration-200"
                        style="min-width:12rem; max-width:90vw;"
                      >
                        <div class="font-bold text-xs sm:text-base text-orange-400 mb-1 truncate" title={anime.name}>{anime.name}</div>
                        <div class="text-xs sm:text-sm text-gray-200 line-clamp-4">{anime.description}</div>
                        <div class="flex flex-wrap gap-1 mt-2">
                          {#each anime.genres?.slice(0, 3) as genre}
                            <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded text-[10px]">{genre}</span>
                          {/each}
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else if activeTab === 'latest'}
                <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-8">
                  {#each data?.latestEpisodeAnimes ?? [] as ep}
                    <div class="relative group">
                      <a
                        href={`/info/${ep.id}`}
                        class="group bg-gray-800 rounded-2xl shadow-lg overflow-hidden block hover:scale-[1.03] hover:shadow-2xl transition-transform duration-200 border-2 border-transparent hover:border-orange-400"
                      >
                        <div class="relative">
                          <img
                            src={ep.poster}
                            alt={ep.name}
                            class="w-full h-40 sm:h-52 object-cover group-hover:brightness-90 transition"
                            loading="lazy"
                          />
                          <span class="absolute top-2 left-2 bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold shadow">
                            EP {ep.episodes.sub}
                          </span>
                        </div>
                        <div class="p-2 sm:p-4">
                          <h3
                            class="font-bold truncate text-xs sm:text-base mb-1 group-hover:text-orange-400 transition"
                            style="max-width:100%"
                            title={ep.name}
                          >
                            {ep.name}
                          </h3>
                          <div class="flex flex-wrap gap-1">
                            <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded text-xs">
                              {ep.episodes.sub} Sub / {ep.episodes.dub} Dub
                            </span>
                          </div>
                        </div>
                      </a>
                      <!-- Floating Info Box -->
                      <div
                        class="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 sm:w-80 bg-black/90 rounded-xl shadow-xl z-30 p-3 sm:p-4 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 transition-all duration-200"
                        style="min-width:12rem; max-width:90vw;"
                      >
                        <div class="font-bold text-xs sm:text-base text-orange-400 mb-1 truncate" title={ep.name}>{ep.name}</div>
                        <div class="text-xs sm:text-sm text-gray-200 line-clamp-4">{ep.description}</div>
                        <div class="flex flex-wrap gap-1 mt-2">
                          <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded text-[10px]">
                            {ep.episodes.sub} Sub / {ep.episodes.dub} Dub
                          </span>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </section>
        </div>
        <!-- Sidebar -->
        <aside class="w-full xl:w-80 flex-shrink-0 flex flex-col gap-8 mt-8 xl:mt-0">
          <div>
            <div class="flex gap-2 mb-3 sm:mb-4">
              <button
                class="flex-1 px-3 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition
                  {sidebarTab === 'airing' ? 'bg-orange-400 text-gray-900' : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                on:click={() => sidebarTab = 'airing'}
              >TOP AIRING</button>
              <button
                class="flex-1 px-3 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition
                  {sidebarTab === 'upcoming' ? 'bg-orange-400 text-gray-900' : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                on:click={() => sidebarTab = 'upcoming'}
              >UPCOMING</button>
            </div>
            <div>
              {#if sidebarTab === 'airing'}
                <div class="flex flex-col gap-1.5 sm:gap-2">
                  {#each data?.topAiringAnimes ?? [] as anime}
                    <a href={`/info/${anime.id}`} class="flex items-center gap-2 bg-gray-800 rounded-lg p-1.5 sm:p-2 hover:bg-orange-400 hover:text-gray-900 transition">
                      <img src={anime.poster} alt={anime.name} class="w-9 h-12 sm:w-12 sm:h-16 object-cover rounded-md" />
                      <div class="flex-1 min-w-0">
                        <div
                          class="font-semibold truncate text-[11px] sm:text-xs max-w-full"
                          style="max-width:100%;"
                          title={anime.name}
                        >
                          {anime.name}
                        </div>
                      </div>
                    </a>
                  {/each}
                </div>
              {:else if sidebarTab === 'upcoming'}
                <div class="flex flex-col gap-1.5 sm:gap-2">
                  {#each data?.topUpcomingAnimes ?? [] as anime}
                    <a href={`/info/${anime.id}`} class="flex items-center gap-2 bg-gray-800 rounded-lg p-1.5 sm:p-2 hover:bg-orange-400 hover:text-gray-900 transition">
                      <img src={anime.poster} alt={anime.name} class="w-9 h-12 sm:w-12 sm:h-16 object-cover rounded-md" />
                      <div class="flex-1 min-w-0">
                        <div
                          class="font-semibold truncate text-[11px] sm:text-xs max-w-full"
                          style="max-width:100%;"
                          title={anime.name}
                        >
                          {anime.name}
                        </div>
                      </div>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </aside>
      </div>
    {/if}
  </div>
</div>