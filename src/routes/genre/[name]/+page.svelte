<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let data: {
    genre: string;
    animes: Array<{
      id: string;
      name: string;
      poster: string;
      duration: string;
      type: string;
      rating: string | null;
      episodes: {
        sub: number;
        dub: number | null;
      };
    }>;
    currentPage: number;
    totalPages: number;
  };

  let loading = false;
  let error: string | null = null;

  const pagesPerGroup = 3;
  $: startPage = Math.max(1, data.currentPage - Math.floor(pagesPerGroup / 2));
  $: endPage = Math.min(data.totalPages, startPage + pagesPerGroup - 1);

  async function loadPage(newPage: number) {
    if (newPage === data.currentPage || newPage < 1 || newPage > data.totalPages) {
      return;
    }

    loading = true;
    error = null;

    try {
      const newUrl = new URL($page.url);
      if (newPage === 1) {
        newUrl.searchParams.delete('page');
      } else {
        newUrl.searchParams.set('page', newPage.toString());
      }

      await goto(newUrl.toString(), { replaceState: true, noScroll: true });
    } catch (e) {
      console.error('Error loading page:', e);
      error = e instanceof Error ? e.message : 'Failed to load page';
    } finally {
      loading = false;
    }
  }

  $: pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );
</script>

<Navbar />

<div class="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pt-16">
  {#if loading}
    <div class="flex items-center justify-center flex-1">
      <img
        src="/assets/loader.gif"
        alt="Loading..."
        class="object-contain"
        style="max-width: 120px; max-height: 110px; aspect-ratio: 1 / 1;"
      />
    </div>
  {:else}
    <div class="flex-1 w-full">
      <div class="max-w-[125rem] mx-auto flex flex-col gap-6 sm:gap-10 px-2 sm:px-6">
        {#if error}
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl my-4">
            <p class="font-bold">ERROR: {error}</p>
            <button
              class="mt-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
              on:click={() => loadPage(data.currentPage || 1)}
            >
              Try Again
            </button>
          </div>
        {:else}
          <section class="mb-4 sm:mb-8">
            <h1 class="text-3xl sm:text-4xl font-bold text-orange-400 mb-4 capitalize">
              {data?.genre || 'Genre'}
            </h1>
            <p class="text-gray-300 text-sm sm:text-base">
              Explore the best animes in the <span class="font-bold text-orange-400 capitalize">{data.genre}</span> genre.
            </p>
            <p class="text-gray-400 text-xs mt-2">
              Page {data.currentPage} of {data.totalPages} • {data.animes?.length || 0} animes
            </p>
          </section>

          <section class="max-w-[1800px] mx-auto px-2">
            {#if data.animes && data.animes.length > 0}
              <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
                {#each data.animes as anime (anime.id)}
                  <a
                    href={`/info/${anime.id}`}
                    class="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col hover:scale-[1.03] hover:shadow-orange-400/40 transition-transform duration-200 border-2 border-transparent hover:border-orange-400"
                  >
                    <div class="relative">
                      <img
                        src={anime.poster}
                        alt={anime.name}
                        class="w-full h-48 sm:h-64 object-cover group-hover:brightness-90 transition"
                        loading="lazy"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none rounded-lg"></div>
                      <span class="absolute top-3 left-3 bg-orange-400 text-gray-900 px-3 py-0.5 rounded-full text-[10px] font-bold shadow-lg">
                        {anime.type}
                      </span>
                      <span class="absolute bottom-3 right-3 bg-gray-900/80 text-orange-300 px-2 py-0.5 rounded text-[10px] shadow">
                        {anime.episodes.sub} Sub{anime.episodes.dub ? ` / ${anime.episodes.dub} Dub` : ' / No Dub'}
                      </span>
                    </div>
                    <div class="p-4 flex-1 flex flex-col">
                      <h3
                        class="font-bold truncate text-base sm:text-lg mb-1 group-hover:text-orange-400 transition"
                        title={anime.name}
                      >
                        {anime.name}
                      </h3>
                      <p class="text-gray-300 text-xs mb-2 line-clamp-3">
                        {anime.duration} | Rating: {anime.rating || 'N/A'}
                      </p>
                    </div>
                  </a>
                {/each}
              </div>
            {:else}
              <div class="text-center py-12">
                <p class="text-gray-400 text-lg">No animes found in this genre.</p>
              </div>
            {/if}
          </section>

          {#if data.totalPages > 1}
            <section class="flex justify-center items-center mt-6 gap-2 flex-wrap">
              {#if data.currentPage > 1}
                <button
                  class="px-3 py-2 rounded-lg font-bold text-sm bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900 transition disabled:opacity-50"
                  on:click={() => loadPage(1)}
                  disabled={loading}
                >
                  ««
                </button>
                <button
                  class="px-3 py-2 rounded-lg font-bold text-sm bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900 transition disabled:opacity-50"
                  on:click={() => loadPage(data.currentPage - 1)}
                  disabled={loading}
                >
                  «
                </button>
              {/if}

              {#each pageNumbers as pageNum}
                <button
                  class="px-3 py-2 rounded-lg font-bold text-sm transition disabled:opacity-50
                    {data.currentPage === pageNum
                      ? 'bg-orange-400 text-gray-900'
                      : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
                  on:click={() => loadPage(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </button>
              {/each}

              {#if data.currentPage < data.totalPages}
                <button
                  class="px-3 py-2 rounded-lg font-bold text-sm bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900 transition disabled:opacity-50"
                  on:click={() => loadPage(data.currentPage + 1)}
                  disabled={loading}
                >
                  »
                </button>
                <button
                  class="px-3 py-2 rounded-lg font-bold text-sm bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900 transition disabled:opacity-50"
                  on:click={() => loadPage(data.totalPages)}
                  disabled={loading}
                >
                  »»
                </button>
              {/if}
            </section>
          {/if}
        {/if}
      </div>
    </div>
  {/if}

  <Footer />
</div>