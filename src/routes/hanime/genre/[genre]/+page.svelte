<script lang="ts">
  import Navbar from '$lib/components/hanime/Navbar.svelte';
  import Footer from '$lib/components/hanime/Footer.svelte';
  import AdultWarning from '$lib/components/hanime/AdultWarning.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';

  export let data: {
    genre: string;
    animes: Array<{
      duration: string;
      id: string;
      title: string;
      image: string;
      views: number;
    }>;
    currentPage: number;
    totalPages: number;
  };

  let loading = false;
  let error: string | null = null;
  let showWarning = true;

  // Cookie helpers
  function getCookie(name: string) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  function setCookie(name: string, value: string, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  }

  // Check for 18+ on mount
  if (
    typeof document !== 'undefined' && getCookie('arms18plus') === 'yes' ||
    typeof localStorage !== 'undefined' && localStorage.getItem('arms18plus') === 'yes'
  ) {
    showWarning = false;
  }

  function closeWarning() {
    showWarning = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('arms18plus', 'yes');
    }
    if (typeof document !== 'undefined') {
      setCookie('arms18plus', 'yes', 365);
    }
  }
  function rejectWarning() {
    window.location.href = '/';
  }

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
      const currentPageStore = get(page);
      const newUrl = new URL(currentPageStore.url.href);
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

{#if showWarning}
  <AdultWarning onConfirm={closeWarning} onReject={rejectWarning} />
{/if}

<div class="flex flex-col min-h-screen bg-gradient-to-br from-[#2a0008] via-[#3a0d16] to-[#1a0106] text-white pt-16">
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
          <div class="bg-[#ff003c]/10 border-l-4 border-[#ff003c] text-[#ff003c] p-4 rounded-xl my-4">
            <p class="font-bold">ERROR: {error}</p>
            <button
              class="mt-2 px-4 py-1 bg-[#ff003c] text-white rounded hover:bg-[#c2002e] transition"
              on:click={() => loadPage(data.currentPage || 1)}
            >
              Try Again
            </button>
          </div>
        {:else}
          <section class="mb-4 sm:mb-8">
            <h1 class="text-3xl sm:text-4xl font-bold text-[#ff003c] mb-4 capitalize">
              {data?.genre || 'Genre'}
            </h1>
            <p class="text-[#ffb3c6] text-sm sm:text-base">
              Explore the best hanime in the <span class="font-bold text-[#ff003c] capitalize">{data.genre}</span> genre.
            </p>
            <p class="text-[#ffb3c6]/80 text-xs mt-2">
              Page {data.currentPage} of {data.totalPages} • {data.animes?.length || 0} titles
            </p>
          </section>

          <section class="max-w-[1800px] mx-auto px-2">
            {#if data.animes && data.animes.length > 0}
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-2 lg:gap-2">
                {#each data.animes as anime, index (anime.id)}
                  <a
                    href={`/hanime/info/${anime.id}`}
                    class="group relative bg-[#1a0106] rounded-xl overflow-hidden shadow transition-transform duration-200 border border-transparent hover:border-[#ff003c] hover:shadow-[#ff003c]/40 cursor-pointer block hover:scale-[1.03]"
                  >
                    <div class="relative aspect-[3/4]">
                      <img
                        src={anime.image}
                        alt={anime.title}
                        class="w-full h-full object-cover"
                        loading={index < 12 ? 'eager' : 'lazy'}
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div class="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                        <span class="bg-[#ff003c] text-white px-2 py-0.5 rounded text-[10px] font-semibold shadow">
                          Hanime
                        </span>
                        <span class="bg-black/70 backdrop-blur-sm text-[#ffb3c6] px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z"/>
                          </svg>
                          {anime.views?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div class="absolute bottom-0 left-0 right-0 p-2">
                        <h3 class="font-semibold text-white text-xs mb-1 line-clamp-2 group-hover:text-[#ffb3c6] transition-colors" title={anime.title}>
                          {anime.title}
                        </h3>
                        <div class="flex items-center justify-between">
                          <span class="bg-[#ff003c] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">18+</span>
                          <span class="text-[#ffb3c6] text-[10px]">{anime.duration || '--:--'}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                {/each}
              </div>
            {:else}
              <div class="text-center py-12">
                <p class="text-[#ffb3c6] text-lg">No hanime found in this genre.</p>
              </div>
            {/if}
          </section>

          {#if data.totalPages > 1}
            <section class="flex justify-center items-center mt-6 gap-2 flex-wrap mb-8">
              {#if data.currentPage > 1}
                <button
                  class="px-3 py-2 rounded-lg font-bold text-sm bg-[#2a0008] text-white hover:bg-[#ff003c] hover:text-black transition disabled:opacity-50"
                  on:click={() => loadPage(1)}
                  disabled={loading}
                >
                  ««
                </button>
                <button
                  class="px-3 py-2 rounded-lg font-bold text-sm bg-[#2a0008] text-white hover:bg-[#ff003c] hover:text-black transition disabled:opacity-50"
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
                      ? 'bg-[#ff003c] text-black'
                      : 'bg-[#2a0008] text-white hover:bg-[#ff003c] hover:text-black'}"
                  on:click={() => loadPage(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </button>
              {/each}

              {#if data.currentPage < data.totalPages}
                <button
                  class="px-3 py-2 rounded-lg font-bold text-sm bg-[#2a0008] text-white hover:bg-[#ff003c] hover:text-black transition disabled:opacity-50"
                  on:click={() => loadPage(data.currentPage + 1)}
                  disabled={loading}
                >
                  »
                </button>
                <button
                  class="px-3 py-2 rounded-lg font-bold text-sm bg-[#2a0008] text-white hover:bg-[#ff003c] hover:text-black transition disabled:opacity-50"
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