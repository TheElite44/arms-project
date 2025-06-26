<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'; // SvelteKit navigation
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte'; // <-- import Sidebar component
  import Footer from '$lib/components/Footer.svelte';
  import AnimeSchedule from '$lib/components/AnimeSchedule.svelte'; // <-- Import AnimeSchedule component
  import Carousel from '$lib/components/Carousel.svelte';

  
  let loading = true;
  let error: string | null = null;
  let data: any = null;
  let top10AnimeDetails: Record<string, any> = {}; // Store detailed info for Top 10 Trending Today

  // Carousel state
  let carouselIndex = 0;
  let carouselInterval: any = null;

  let activeTab: 'trending' | 'popular' | 'topRated' | 'latest' = 'trending';
  let sidebarTab: 'airing' | 'upcoming' = 'airing';

  async function fetchAnimeDetails(animeId: string) {
    try {
      const resp = await fetch(`/api/info?animeId=${animeId}`);
      const json = await resp.json();
      if (json.success && json.data?.anime?.info) {
        top10AnimeDetails[animeId] = json.data.anime.info;
      }
    } catch (e) {
      console.error(`Failed to fetch details for animeId: ${animeId}`, e);
    }
  }

  onMount(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/home');
        const json = await resp.json();
        if (!cancelled) {
          if (json.success) {
            data = json.data;

            // Fetch detailed info for Top 10 Trending Today
            if (data.top10Animes?.today?.length > 0) {
              await Promise.all(
                data.top10Animes.today.map((anime: any) =>
                  fetchAnimeDetails(anime.id)
                )
              );
            }
          } else {
            error = json.error || 'Failed to load data';
          }
        }
      } catch (e) {
        if (!cancelled) error = 'Failed to load data';
      } finally {
        if (!cancelled) loading = false;
      }

      // Updated interval duration to 10 seconds
      carouselInterval = setInterval(() => {
        if (data?.spotlightAnimes?.length > 0) {
          carouselIndex = (carouselIndex + 1) % data.spotlightAnimes.length;
        }
      }, 10000); // 10 seconds
    })();

    return () => {
      cancelled = true;
      clearInterval(carouselInterval);
    };
  });

  function prevSlide() {
    if (data?.spotlightAnimes?.length > 0) {
      carouselIndex = (carouselIndex - 1 + data.spotlightAnimes.length) % data.spotlightAnimes.length;
    }
  }
  function nextSlide() {
    if (data?.spotlightAnimes?.length > 0) {
      carouselIndex = (carouselIndex + 1) % data.spotlightAnimes.length;
    }
  }
  function setTab(tab: typeof activeTab) {
    activeTab = tab;
  }
</script>

<svelte:head>
  <title>Home | ARMS Anime Streaming</title>
</svelte:head>

<Navbar />

<div class="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pt-16">
  {#if loading}
    <!-- Show loading screen -->
    <div class="flex items-center justify-center flex-1">
      <img
        src="/assets/loader.gif"
        alt="Loading..."
        class="object-contain"
        style="max-width: 120px; max-height: 110px; aspect-ratio: 1 / 1;"
      />
    </div>
  {:else}
    <!-- Main content -->
    <div class="flex-1 w-full">
      <div class="max-w-[125rem] mx-auto flex flex-col gap-6 sm:gap-10 px-2 sm:px-6">
        {#if error}
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl my-4">
            <p class="font-bold">ERROR: {error}</p>
          </div>
        {:else}
          <!-- Carousel -->
          {#if data.spotlightAnimes?.length > 0}
            <section class="mb-4 sm:mb-8">
              <Carousel
                animes={data.spotlightAnimes}
                intervalMs={10000}
                onWatch={(id) => goto(`/watch/${id}`)}
              />
            </section>
          {/if}

          <!-- Main content and sidebar layout -->
          <div class="flex flex-col xl:flex-row gap-6 sm:gap-10 w-full">
            <!-- Main content -->
            <div class="flex-1 flex flex-col gap-6 sm:gap-10">
              <!-- Spotlight Anime -->
              <!-- Spotlight Section renamed to Top 10 Trending Today -->
              <section class="max-w-[1800px] mx-auto px-2">
                <h2 class="text-xl sm:text-2xl font-bold text-orange-400 mb-4 sm:mb-6 flex items-center gap-3">
                  <svg class="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M12 2v20m10-10H2" />
                  </svg>
                  Top 10 Trending Today
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-2">
                  {#each data.top10Animes.today as anime}
                    <a href={`/info/${anime.id}`} class="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col hover:scale-[1.03] hover:shadow-orange-400/40 transition-transform duration-200 border-2 border-transparent hover:border-orange-400">
                      <div class="relative">
                        <img src={anime.poster} alt={anime.name} class="w-full h-48 sm:h-64 object-cover group-hover:brightness-90 transition" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none rounded-lg"></div>
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
                        <p class="text-gray-300 text-xs mb-2 line-clamp-3">
                          {top10AnimeDetails[anime.id]?.description ?? 'Loading description...'}
                        </p>
                        <div class="flex flex-wrap gap-1 mt-auto">
                          {#each top10AnimeDetails[anime.id]?.genres?.slice(0, 3) as genre}
                            <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-[10px]">{genre}</span>
                          {/each}
                        </div>
                      </div>
                      <div class="flex justify-between items-center px-4 pb-4 pt-1">
                        <span class="text-[10px] text-gray-400">{top10AnimeDetails[anime.id]?.stats?.duration}</span>
                        <span class="text-[10px] bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full font-bold">{top10AnimeDetails[anime.id]?.stats?.type}</span>
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
                    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2">
                      <!-- Example for TRENDING, repeat for POPULAR, TOP RATED, LATEST EPISODES -->
                      {#each data.trendingAnimes as anime (anime.id)}
                        <a
                          href={`/info/${anime.id}`}
                          class="group relative bg-gray-800 rounded-xl overflow-hidden shadow transition-all duration-150 border border-transparent hover:border-orange-400 hover:shadow-orange-400/40 cursor-pointer block hover:scale-[1.03]"
                        >
                          <div class="relative aspect-[3/4]">
                            <img
                              src={anime.poster}
                              alt={anime.name}
                              class="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div class="absolute top-2 left-2">
                              <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded text-[10px] font-semibold shadow">
                                #{anime.rank}
                              </span>
                            </div>
                            <!-- No views badge -->
                          </div>
                          <div class="absolute bottom-0 left-0 right-0 p-2">
                            <h3 class="font-semibold text-white text-xs mb-1 line-clamp-2 group-hover:text-orange-200 transition-colors" title={anime.name}>
                              {anime.name}
                            </h3>
                          </div>
                        </a>
                      {/each}
                    </div>
                  {:else if activeTab === 'popular'}
                    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2">
                      {#each data.mostPopularAnimes as anime (anime.id)}
                        <a
                          href={`/info/${anime.id}`}
                          class="group relative bg-gray-800 rounded-xl overflow-hidden shadow transition-all duration-150 border border-transparent hover:border-orange-400 hover:shadow-orange-400/40 cursor-pointer block hover:scale-[1.03]"
                        >
                          <div class="relative aspect-[3/4]">
                            <img
                              src={anime.poster}
                              alt={anime.name}
                              class="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                          </div>
                          <div class="absolute bottom-0 left-0 right-0 p-2">
                            <h3 class="font-semibold text-white text-xs mb-1 line-clamp-2 group-hover:text-orange-200 transition-colors" title={anime.name}>
                              {anime.name}
                            </h3>
                            <div class="flex flex-wrap gap-1">
                              {#each anime.genres?.slice(0, 2) as genre}
                                <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded text-[10px]">{genre}</span>
                              {/each}
                            </div>
                          </div>
                        </a>
                      {/each}
                    </div>
                  {:else if activeTab === 'topRated'}
                    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2">
                      {#each data.mostFavoriteAnimes as anime (anime.id)}
                        <a
                          href={`/info/${anime.id}`}
                          class="group relative bg-gray-800 rounded-xl overflow-hidden shadow transition-all duration-150 border border-transparent hover:border-orange-400 hover:shadow-orange-400/40 cursor-pointer block hover:scale-[1.03]"
                        >
                          <div class="relative aspect-[3/4]">
                            <img
                              src={anime.poster}
                              alt={anime.name}
                              class="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                          </div>
                          <div class="absolute bottom-0 left-0 right-0 p-2">
                            <h3 class="font-semibold text-white text-xs mb-1 line-clamp-2 group-hover:text-orange-200 transition-colors" title={anime.name}>
                              {anime.name}
                            </h3>
                            <div class="flex flex-wrap gap-1">
                              {#each anime.genres?.slice(0, 2) as genre}
                                <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded text-[10px]">{genre}</span>
                              {/each}
                            </div>
                          </div>
                        </a>
                      {/each}
                    </div>
                  {:else if activeTab === 'latest'}
                    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2">
                      {#each data?.latestEpisodeAnimes ?? [] as ep (ep.id)}
                        <a
                          href={`/info/${ep.id}`}
                          class="group relative bg-gray-800 rounded-xl overflow-hidden shadow transition-all duration-150 border border-transparent hover:border-orange-400 hover:shadow-orange-400/40 cursor-pointer block hover:scale-[1.03]"
                        >
                          <div class="relative aspect-[3/4]">
                            <img
                              src={ep.poster}
                              alt={ep.name}
                              class="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <span class="absolute top-2 left-2 bg-gray-900/80 text-orange-300 px-2 py-0.5 rounded text-[10px] shadow">
                              {ep.episodes?.sub ?? 0} Sub / {ep.episodes?.dub ?? 0} Dub
                            </span>
                          </div>
                          <div class="absolute bottom-0 left-0 right-0 p-2">
                            <h3 class="font-semibold text-white text-xs mb-1 line-clamp-2 group-hover:text-orange-200 transition-colors" title={ep.name}>
                              {ep.name}
                            </h3>
                          </div>
                        </a>
                      {/each}
                    </div>
                  {/if}
                </div>
              </section>
            </div>
            <!-- Sidebar as a component -->
            <Sidebar
              {sidebarTab}
              setSidebarTab={(tab) => sidebarTab = tab}
              topAiringAnimes={data?.topAiringAnimes ?? []}
              topUpcomingAnimes={data?.topUpcomingAnimes ?? []}
            />
          </div>
        {/if}
      </div>
    </div>
    <!-- Add AnimeSchedule Component at the Bottom -->
    <section class="wrapper-container my-8 px-4">
      <div class="schedule-wrapper bg-gray-800 rounded-lg shadow-lg p-4">
        <AnimeSchedule />
      </div>
    </section>
  {/if}

  <!-- Footer always visible -->
  <Footer />
</div>

<!-- Carousel Dots & Slide Animation Update -->
<style>
  .carousel-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 9999px;
    border: 2px solid #fbbf24; /* orange-400 */
    background: #1f2937; /* gray-800 */
    margin: 0 0.15rem;
    transition: background 0.3s, transform 0.3s;
    opacity: 0.6;
    transform: scale(1);
    display: inline-block;
  }
  .carousel-dot.active {
    background: #fbbf24;
    opacity: 1;
    transform: scale(1.25);
    box-shadow: 0 0 0 2px #fff2;
  }
  .carousel-slide {
    transition: transform 0.5s cubic-bezier(.4,0,.2,1), opacity 0.5s;
    will-change: transform, opacity;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0; left: 0;
    opacity: 0;
    z-index: 0;
    pointer-events: none;
  }
  .carousel-slide.active {
    opacity: 1;
    z-index: 1;
    pointer-events: auto;
    transform: translateX(0);
  }
  .carousel-slide.prev {
    opacity: 0;
    z-index: 0;
    transform: translateX(-30px);
  }
  .carousel-slide.next {
    opacity: 0;
    z-index: 0;
    transform: translateX(30px);
  }
</style>