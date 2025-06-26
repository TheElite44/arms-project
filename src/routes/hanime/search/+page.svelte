<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from '$lib/components/hanime/Navbar.svelte';
  import Footer from '$lib/components/hanime/Footer.svelte';
  import AdultWarning from '$lib/components/hanime/AdultWarning.svelte';

  let loading = true;
  let error: string | null = null;
  let hanimeResults: any[] = [];
  let query = '';
  let page = 1;
  let totalPages = 1;
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

  onMount(async () => {
    // 18+ check
    if (
      (typeof document !== 'undefined' && getCookie('arms18plus') === 'yes') ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('arms18plus') === 'yes')
    ) {
      showWarning = false;
    }
    const urlParams = new URLSearchParams(window.location.search);
    query = urlParams.get('query') || '';
    page = parseInt(urlParams.get('page') || '1', 10);

    if (query) {
      await fetchSearchResults();
    } else {
      loading = false;
    }
  });

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

  async function fetchSearchResults() {
    try {
      loading = true;
      const resp = await fetch(`/api/hanime/search?query=${encodeURIComponent(query)}&page=${page}`);
      const json = await resp.json();
      if (json.status === 'success') {
        hanimeResults = json.data.results || [];
        totalPages = json.data.totalPages || 1;
      } else {
        hanimeResults = [];
        error = json.error || 'Failed to fetch search results';
      }
    } catch (e) {
      error = 'Failed to fetch search results';
    } finally {
      loading = false;
    }
  }

  async function goToPage(newPage: number) {
    if (newPage >= 1 && newPage <= totalPages) {
      page = newPage;
      await fetchSearchResults();
      window.history.pushState({}, '', `/hanime/search?query=${encodeURIComponent(query)}&page=${page}`);
    }
  }
</script>

<svelte:head>
  <title>Hanime Search - {query}</title>
  <meta name="description" content={`Search results for "${query}" on ARMS Hentai`}>
  <meta property="og:title" content={`Hanime Search - ${query}`}>
  <meta property="og:description" content={`Search results for "${query}" on ARMS Hanime`}>
  <meta property="og:url" content={`/hanime/search?query=${encodeURIComponent(query)}&page=${page}`}>
</svelte:head>

<Navbar />

{#if showWarning}
  <AdultWarning onConfirm={closeWarning} onReject={rejectWarning} />
{/if}

<div class="flex flex-col min-h-screen bg-gradient-to-br from-[#2a0008] via-[#3a0d16] to-[#1a0106] text-white pt-16">
  <div class="flex-1 w-full">
    <div class="max-w-[125rem] mx-auto flex flex-col gap-6 sm:gap-10 px-2 sm:px-6">
      {#if loading}
        <div class="flex items-center justify-center min-h-[60vh] w-full">
          <img
            src="/assets/loader.gif"
            alt="Loading..."
            class="object-contain"
            style="max-width: 120px; max-height: 110px; aspect-ratio: 1 / 1;"
          />
        </div>
      {:else if error}
        <div class="bg-[#ff003c]/10 border border-[#ff003c]/30 text-[#ff003c] p-6 rounded-xl mb-8 backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <div>
              <h3 class="font-semibold text-lg">Error</h3>
              <p class="text-[#ffb3c6] mt-1">{error}</p>
            </div>
          </div>
        </div>
      {:else}
        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-xl sm:text-2xl font-bold text-[#ff003c] mb-4 sm:mb-6 flex items-center gap-3">
            <svg class="w-6 h-6 sm:w-7 sm:h-7 text-[#ff003c]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2v20m10-10H2" /></svg>
            Hanime Results for "{query}"
          </h2>
          {#if hanimeResults.length === 0}
            <div class="text-[#ffb3c6]">No results found.</div>
          {:else}
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-2 lg:gap-2">
              {#each hanimeResults as hanime, index}
                <a
                  href={`/hanime/info/${hanime.id}`}
                  class="group relative bg-[#1a0106] rounded-xl overflow-hidden shadow transition-transform duration-200 border border-transparent hover:border-[#ff003c] hover:shadow-[#ff003c]/40 cursor-pointer block hover:scale-[1.03]"
                >
                  <div class="relative aspect-[3/4]">
                    <img
                      src={hanime.image}
                      alt={hanime.title}
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
                        {hanime.views?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 p-2">
                      <h3 class="font-semibold text-white text-xs mb-1 line-clamp-2 group-hover:text-[#ffb3c6] transition-colors" title={hanime.title}>
                        {hanime.title}
                      </h3>
                      <div class="flex items-center justify-between">
                        <span class="bg-[#ff003c] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">18+</span>
                        <span class="text-[#ffb3c6] text-[10px]">{hanime.duration || '--:--'}</span>
                      </div>
                    </div>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
          <!-- Pagination -->
          <div class="flex justify-center mt-8">
            {#if page > 1}
              <button class="px-4 py-2 bg-[#1a0106] text-[#ff003c] rounded-lg hover:bg-[#ff003c] hover:text-black transition" on:click={() => goToPage(page - 1)}>Previous</button>
            {/if}
            <span class="px-4 py-2 text-gray-400">Page {page} of {totalPages}</span>
            {#if page < totalPages}
              <button class="px-4 py-2 bg-[#1a0106] text-[#ff003c] rounded-lg hover:bg-[#ff003c] hover:text-black transition" on:click={() => goToPage(page + 1)}>Next</button>
            {/if}
          </div>
          <!-- Add spacing before footer -->
          <div class="h-8"></div>
        </section>
      {/if}
    </div>
  </div>
  <Footer />
</div>

<style>
  @keyframes spin {
    0% { transform: rotate(0deg);}
    100% { transform: rotate(360deg);}
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
