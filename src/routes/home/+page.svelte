<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import AnimeSchedule from '$lib/components/AnimeSchedule.svelte';
  import Carousel from '$lib/components/Carousel.svelte';
  import AnimeCard from '$lib/components/AnimeCard.svelte';
  import HomeAnimeColumns from '$lib/components/HomeAnimeColumns.svelte'; // <-- Add this import

  let loading = true;
  let error: string | null = null;
  let data: any = null;
  let trendingAnimeDetails: Record<string, any> = {}; // Store detailed info for trending anime

  // Carousel state
  let carouselIndex = 0;
  let carouselInterval: any = null;

  // Tab states
  let activeTab: 'popular' | 'topRated' | 'topAiring' | 'completed' = 'popular';
  let sidebarTab: 'today' | 'week' | 'month' = 'today';
  let showAllGenres = false;

  async function fetchAnimeDetails(animeId: string) {
    try {
      const resp = await fetch(`/api/info?animeId=${animeId}`);
      const json = await resp.json();
      if (json.success && json.data?.anime?.info) {
        trendingAnimeDetails[animeId] = json.data.anime.info;
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

            // Fetch detailed info for trending anime
            const trendingAnime = data.trendingAnimes || [];
            
            if (trendingAnime.length > 0) {
              await Promise.all(
                trendingAnime.map((anime: any) => fetchAnimeDetails(anime.id))
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

      // Carousel interval
      carouselInterval = setInterval(() => {
        if (data?.spotlightAnimes?.length > 0) {
          carouselIndex = (carouselIndex + 1) % data.spotlightAnimes.length;
        }
      }, 10000);
    })();

    return () => {
      cancelled = true;
      clearInterval(carouselInterval);
    };
  });

  function setTab(tab: typeof activeTab) {
    activeTab = tab;
  }

  // View More functionality
  function handleViewMore() {
    const routes = {
      popular: '/most-popular', 
      topRated: '/top-rated',
      latest: '/latest-episodes'
    };
  }

  // Get visible genres (first 12 or all if showAllGenres is true)
  $: visibleGenres = data?.genres ? (showAllGenres ? data.genres : data.genres.slice(0, 12)) : [];

  // Tab mapping
  const tabMap = {
    popular: 'mostPopularAnimes',
    topRated: 'mostFavoriteAnimes',
    topAiring: 'topAiringAnimes',
    completed: 'latestCompletedAnimes'
  };
</script>

<svelte:head>
  <title>Home | ARMS Anime Streaming</title>
</svelte:head>

<Navbar />

<div class="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pt-16">
  {#if loading}
    <!-- Loading screen -->
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
      <div class="max-w-[125rem] mx-auto flex flex-col px-2 sm:px-6">
        {#if error}
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl my-4">
            <p class="font-bold">ERROR: {error}</p>
          </div>
        {:else}
          <!-- Carousel -->
          {#if data.spotlightAnimes?.length > 0}
            <section class="mb-0">
              <Carousel
                animes={data.spotlightAnimes}
                intervalMs={10000}
                onWatch={(id) => goto(`/watch/${id}`)}
              />
            </section>
          {/if}

          <!-- Mobile Order: Trending First, then Home Columns -->
          <div class="block md:hidden">
            <!-- Trending Anime Section - Mobile First -->
            {#if data?.trendingAnimes}
              <section class="max-w-[1800px] mx-auto px-2 mt-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                  <h2 class="text-xl sm:text-2xl font-bold text-orange-400 flex items-center gap-3">
                    <svg class="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    Trending Anime
                  </h2>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2">
                  {#each data.trendingAnimes.slice(0, 10) as anime (anime.id)}
                    <AnimeCard 
                      {anime}
                      showRank={true}
                      showDescription={true}
                      description={trendingAnimeDetails[anime.id]?.description ?? ''}
                      genres={trendingAnimeDetails[anime.id]?.genres ?? []}
                      duration={trendingAnimeDetails[anime.id]?.stats?.duration ?? ''}
                      type={trendingAnimeDetails[anime.id]?.stats?.type ?? ''}
                    />
                  {/each}
                </div>
              </section>
            {/if}

            <!-- Home Anime Columns - Mobile Second -->
            <div class="mt-6">
              <HomeAnimeColumns {data} />
            </div>
          </div>

          <!-- Desktop Order: Home Columns First, then Trending -->
          <div class="hidden md:block">
            <!-- Home Anime Columns - Desktop First -->
            <div class="mt-0">
              <HomeAnimeColumns {data} />
            </div>
          </div>

          <!-- Main content and sidebar layout -->
          <div class="flex flex-col xl:flex-row gap-6 sm:gap-10 w-full mt-6 sm:mt-10">
            <!-- Main content -->
            <div class="flex-1 flex flex-col gap-6 sm:gap-10">

              <!-- Trending Anime Section - Desktop Only -->
              <div class="hidden md:block">
                {#if data?.trendingAnimes}
                  <section class="max-w-[1800px] mx-auto px-2">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                      <h2 class="text-xl sm:text-2xl font-bold text-orange-400 flex items-center gap-3">
                        <svg class="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                        </svg>
                        Trending Anime
                      </h2>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2">
                      {#each data.trendingAnimes.slice(0, 10) as anime (anime.id)}
                        <AnimeCard 
                          {anime}
                          showRank={true}
                          showDescription={true}
                          description={trendingAnimeDetails[anime.id]?.description ?? ''}
                          genres={trendingAnimeDetails[anime.id]?.genres ?? []}
                          duration={trendingAnimeDetails[anime.id]?.stats?.duration ?? ''}
                          type={trendingAnimeDetails[anime.id]?.stats?.type ?? ''}
                        />
                      {/each}
                    </div>
                  </section>
                {/if}
              </div>

              <!-- Latest Episodes Section (outside tabs) -->
              <section class="max-w-[1800px] mx-auto px-2 mt-8">
                <h2 class="text-xl sm:text-2xl font-bold text-orange-400 flex items-center gap-3 mb-4">
                  <svg class="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  Latest Episodes
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2">
                  {#each data?.latestEpisodeAnimes.slice (0, 10) as ep (ep.id)}
                    <AnimeCard 
                      anime={ep}
                      showEpisodes={true}
                      showDescription={true}
                      description={ep.description ?? ''}
                      genres={ep.genres ?? []}
                      duration={ep.duration ?? ''}
                      type={ep.type ?? ''}
                    />
                  {/each}
                </div>
              </section>
            </div>
            
            <!-- Sidebar as a component -->
            <Sidebar
              sidebarTab={sidebarTab}
              setSidebarTab={(tab) => sidebarTab = tab}
              top10Today={data?.top10Animes?.today ?? []}
              top10Week={data?.top10Animes?.week ?? []}
              top10Month={data?.top10Animes?.month ?? []}
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

<!-- Existing styles -->
<style>

</style>