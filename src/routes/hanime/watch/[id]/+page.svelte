<script lang="ts">
  import Navbar from '$lib/components/hanime/Navbar.svelte';
  import Footer from '$lib/components/hanime/Footer.svelte';
  import PlayerCard from '$lib/components/hanime/watch/PlayerCard.svelte';
  import AdultWarning from '$lib/components/hanime/AdultWarning.svelte';

  export let data;

  $: info = data?.info?.results;
  $: watch = data?.watch?.results;

  $: poster = info?.poster ?? '';
  $: description = info?.description ?? '';
  $: title = info?.name ?? '';
  $: genres = info?.genre ?? [];
  $: type = info?.type ?? '';
  $: brand = info?.brandName ?? '';
  $: views = info?.views ?? '';
  $: releaseDate = info?.releaseDate ?? '';
  $: altTitle = info?.altTitle ?? '';

  $: sources = watch?.sources ?? [];
  $: subSource = sources.find((s: any) => s.format === 'mp4' && s.src.endsWith('-sub.mp4'));
  $: rawSource = sources.find((s: any) => s.format === 'mp4' && s.src.endsWith('.mp4') && !s.src.endsWith('-sub.mp4'));
  $: srtSource = sources.find((s: any) => s.format === 'srt');
  $: videoSrc = subSource?.src || rawSource?.src || sources[0]?.src || '';
  $: videoFormat = subSource ? 'mp4' : (rawSource ? 'mp4' : (sources[0]?.format || ''));
  $: srtUrl = srtSource?.src || null;

  let showWarning = true;

  // Loading state
  let loading = true;

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

  import { onMount } from 'svelte';
  let searchResults: any[] = [];
  let searchLoading = true;

  // Fetch search results for episodes
  onMount(async () => {
    if (data?.search) {
      searchLoading = true;
      const res = await fetch(`/api/hanime/search?query=${encodeURIComponent(data.search)}`);
      const json = await res.json();
      searchResults = json?.data?.results ?? [];
      searchLoading = false;
    }
    // Data is ready, stop loading
    loading = false;
  });

  function goToEpisode(id: string) {
    window.location.href = `/hanime/watch/${id}`;
  }
</script>

<Navbar />

{#if showWarning}
  <AdultWarning onConfirm={closeWarning} onReject={rejectWarning} />
{/if}

<div class="min-h-screen bg-gradient-to-br from-[#1a0106] via-[#2a0008] to-[#3a0d16] text-white flex flex-col relative overflow-x-hidden">
  <!-- Decorative Background -->
  <div class="pointer-events-none fixed inset-0 z-0">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(255,0,60,0.08),transparent_70%)]"></div>
  </div>

  <main class="relative z-10 flex-1 w-full pt-20 pb-2">
    <div class="max-w-7xl mx-auto flex flex-col gap-6 px-2 sm:px-0">
      {#if loading}
        <div class="flex items-center justify-center min-h-[300px]">
          <img src="/assets/loader.gif" alt="Loading..." style="max-width: 120px; max-height: 110px;" />
        </div>
      {:else if info && watch}
        <section class="flex-1 flex flex-col gap-8 mb-6">
          <!-- Player Card -->
          <div class="flex flex-col gap-6 bg-gradient-to-br from-[#1a0106] via-[#2a0008] to-[#3a0d16] rounded-lg shadow-2xl border border-[#ff003c]/20 p-4 sm:p-8">
            <PlayerCard videoSrc={videoSrc} poster={poster} {srtUrl} />

            {#if subSource || rawSource}
              <div class="mt-4 flex items-center gap-3 justify-start">
                <span class="font-semibold text-[#ff003c] text-sm">Source:</span>
                {#if subSource}
                  <button
                    class="px-3 py-1 rounded text-sm font-semibold transition-colors
                           {videoSrc === subSource.src ? 'bg-[#ff003c] text-black' : 'bg-[#2a0008] text-[#ffb3c6] hover:bg-[#ff003c]/80 hover:text-black'}"
                    on:click={() => videoSrc = subSource.src}
                    disabled={videoSrc === subSource.src}
                  >
                    Sub
                  </button>
                {/if}
                {#if rawSource}
                  <button
                    class="px-3 py-1 rounded text-sm font-semibold transition-colors
                           {videoSrc === rawSource.src ? 'bg-[#ff003c] text-black' : 'bg-[#2a0008] text-[#ffb3c6] hover:bg-[#ff003c]/80 hover:text-black'}"
                    on:click={() => videoSrc = rawSource.src}
                    disabled={videoSrc === rawSource.src}
                  >
                    Raw
                  </button>
                {/if}
              </div>
            {/if}
          </div>

          <!-- Info Card -->
          <div class="flex flex-col md:flex-row gap-8 bg-gradient-to-br from-[#1a0106] via-[#2a0008] to-[#3a0d16] rounded-lg shadow-2xl p-6 md:p-10">
            <div class="flex-shrink-0 mx-auto md:mx-0">
              <img
                src={poster}
                alt={title}
                class="rounded-lg shadow-2xl w-64 h-auto object-cover border-4 border-[#2a0008]"
              />
            </div>
            <div class="flex-1 flex flex-col gap-4">
              <h1 class="text-3xl sm:text-4xl font-extrabold text-[#ff003c] mb-1">{title}</h1>
              {#if altTitle}
                <div class="text-[#ffb3c6]/80 text-lg font-medium mb-2 italic">{altTitle}</div>
              {/if}
              {#if genres.length}
                <div class="flex flex-wrap gap-1 mb-2">
                  {#each genres as genre}
                    <a
                      href={`/hanime/genre/${genre.replace(/\s+/g, '-').toLowerCase()}`}
                      class="bg-[#3a0d16] text-[#ffb3c6] px-2 py-0.5 rounded-full text-xs font-semibold hover:bg-[#ff003c] hover:text-black transition-colors max-w-full truncate"
                      style="max-width: 100px;"
                      >{genre}</a
                    >
                  {/each}
                </div>
              {/if}
              <p class="text-[#ffb3c6] text-base mb-2">{description}</p>
              <div class="flex flex-wrap gap-2 mb-2">
                {#if releaseDate}
                  <span class="bg-[#ff003c] text-black px-3 py-1 rounded-full text-xs font-bold shadow">Release: {releaseDate}</span>
                {/if}
                {#if brand}
                  <span class="bg-[#2a0008] text-[#ffb3c6] px-3 py-1 rounded-full text-xs font-semibold">Brand: {brand}</span>
                {/if}
                {#if type}
                  <span class="bg-[#2a0008] text-[#ffb3c6] px-3 py-1 rounded-full text-xs font-semibold">Type: {type}</span>
                {/if}
                {#if views}
                  <span class="bg-[#2a0008] text-[#ffb3c6] px-3 py-1 rounded-full text-xs font-semibold">{views}</span>
                {/if}
              </div>
            </div>
          </div>
        </section>
      {:else}
        <!-- Error State -->
        <section class="flex flex-col items-center justify-center py-24">
          <div class="relative mb-6">
            <div class="absolute -inset-1 bg-gradient-to-r from-[#ff003c] to-[#ff4d79] rounded-full blur opacity-20"></div>
            <div class="relative bg-[#2a0008]/80 backdrop-blur-sm rounded-full p-8 border border-[#ff003c]/30 inline-block">
              <svg class="w-16 h-16 text-[#ff003c] mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
          <h2 class="text-2xl font-bold text-[#ff003c] mt-6 mb-2">Video Not Found</h2>
          <p class="text-[#ffb3c6]/80">The requested video could not be loaded or does not exist.</p>
        </section>
      {/if}

      <!-- Related List -->
      <section class="flex flex-col gap-4 mt-2">
        <h2 class="text-xl font-bold text-[#ff003c] mb-2">Related</h2>
        {#if searchLoading}
          <div class="text-[#ffb3c6]">Loading related...</div>
        {:else if searchResults.length}
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {#each searchResults as ep, idx}
              <a
                on:click|preventDefault={() => goToEpisode(ep.id)}
                class="group relative bg-[#1a0106] rounded-xl overflow-hidden shadow transition-all duration-150 border border-transparent hover:border-[#ff003c] hover:shadow-[#ff003c]/40 cursor-pointer"
                style="display: block;"
                tabindex="0"
              >
                <div class="relative aspect-[3/4]">
                  <img
                    src={ep.image}
                    alt={ep.title}
                    class="w-full h-full object-cover"
                    loading={idx < 12 ? 'eager' : 'lazy'}
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div class="absolute top-2 left-2">
                    <span class="bg-[#ff003c] text-white px-2 py-0.5 rounded text-[10px] font-semibold shadow">
                      Related
                    </span>
                  </div>
                  <div class="absolute top-2 right-2">
                    <span class="bg-black/70 backdrop-blur-sm text-[#ffb3c6] px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z"/>
                      </svg>
                      {ep.views?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 p-2">
                    <h3 class="font-semibold text-white text-xs mb-1 line-clamp-2 group-hover:text-[#ffb3c6] transition-colors" title={ep.title}>
                      {ep.title}
                    </h3>
                    <div class="flex items-center justify-between">
                      <span class="bg-[#ff003c] text-white px-1.5 py-0.5 rounded text-[10px] font-bold">18+</span>
                      <span class="text-[#ffb3c6] text-[10px]">{ep.duration || '--:--'}</span>
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        {:else}
          <div class="text-[#ffb3c6]">No related found.</div>
        {/if}
      </section>
    </div>
  </main>
  <div class="h-4 sm:h-6"></div>
  <Footer />
</div>

<style>
  @media (max-width: 768px) {
    .flex-shrink-0 {
      margin-left: auto;
      margin-right: auto;
    }
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>