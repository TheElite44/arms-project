<script lang="ts">
  import Navbar from '$lib/components/hanime/Navbar.svelte';
  import Footer from '$lib/components/hanime/Footer.svelte';
  import AdultWarning from '$lib/components/hanime/AdultWarning.svelte';
  import { goto } from '$app/navigation';

  export let data: any;

  $: info = data?.info?.results;
  $: related = info?.related ?? [];

  let loading = false;
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

  async function handleRelatedClick(id: string) {
    loading = true;
    try {
      await goto(`/hanime/info/${id}`);
    } finally {
      loading = false;
    }
  }
</script>

<Navbar />

{#if showWarning}
  <AdultWarning onConfirm={closeWarning} onReject={rejectWarning} />
{/if}

<div class="flex flex-col min-h-screen bg-gradient-to-b from-[#2a0008] via-[#3a0d16] to-[#1a0106] text-white pt-16">
  {#if loading}
    <div class="flex items-center justify-center flex-1">
      <span class="loader-adult"></span>
    </div>
  {:else}
    <div class="flex-1 w-full">
      <div class="max-w-7xl mx-auto flex flex-col gap-8 px-2 sm:px-6">
        {#if info}
          <!-- Main Content -->
          <div class="flex-1 flex flex-col gap-8 mb-12">
            <section class="flex-1 flex flex-col gap-8">
              <div class="flex flex-col md:flex-row gap-8 bg-gradient-to-br from-[#2a0008] via-[#3a0d16] to-[#1a0106] rounded-lg shadow-2xl p-6 md:p-10">
                <!-- Poster -->
                <div class="flex-shrink-0 mx-auto md:mx-0">
                  <img
                    src={info.poster}
                    alt={info.name}
                    class="rounded-lg shadow-2xl w-56 h-auto object-cover border-4 border-[#3a0d16]"
                  />
                </div>
                <!-- Details -->
                <div class="flex-1 flex flex-col gap-4">
                  <h1 class="text-3xl sm:text-4xl font-extrabold text-[#ff003c] mb-1">{info.name}</h1>
                  <div class="flex flex-wrap gap-2 mb-2">
                    {#each info.genre as genre}
                      <span class="bg-[#ff003c]/20 text-[#ff003c] px-3 py-1 rounded-full text-xs font-semibold">{genre}</span>
                    {/each}
                    {#if info.type}
                      <span class="bg-[#ff003c] text-white px-3 py-1 rounded-full text-xs font-bold uppercase">{info.type}</span>
                    {/if}
                  </div>
                  <p class="text-[#ffb3c6] text-base mb-2">{info.description}</p>
                  <div class="flex flex-wrap gap-2 text-xs text-[#ffb3c6]">
                    {#if info.releaseDate}
                      <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Release: {info.releaseDate}</span>
                    {/if}
                    {#if info.uploadDate}
                      <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Uploaded: {info.uploadDate}</span>
                    {/if}
                    {#if info.brandName}
                      <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Brand: {info.brandName}</span>
                    {/if}
                    {#if info.altTitle}
                      <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Alt: {info.altTitle}</span>
                    {/if}
                    {#if info.views}
                      <span class="bg-[#ff003c]/10 px-2 py-1 rounded">{info.views} views</span>
                    {/if}
                  </div>
                  <a
                    href={`/hanime/watch/${info.id}`}
                    class="inline-flex items-center gap-2 mt-4 bg-[#ff003c] hover:bg-[#c2002e] text-white font-bold px-6 py-2 rounded-md shadow-lg transition-all duration-200 text-center w-full sm:w-auto border-2 border-transparent hover:border-[#fff] focus:outline-none focus:ring-2 focus:ring-[#ff003c] focus:ring-offset-2"
                  >
                    <!-- New short play icon SVG -->
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 20 20">
                      <rect x="1" y="1" width="18" height="18" rx="4" stroke="currentColor" fill="none"/>
                      <polygon points="8,6 14,10 8,14" fill="currentColor"/>
                    </svg>
                    <span class="tracking-wide text-base font-semibold">Watch</span>
                  </a>
                </div>
              </div>

              <!-- Related Hanime -->
              {#if related.length}
                <section>
                  <h2 class="text-2xl font-bold text-[#ff003c] mb-4">Related Titles</h2>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {#each related as rel}
                      <a
                        href={`/hanime/info/${rel.id}`}
                        on:click|preventDefault={() => handleRelatedClick(rel.id)}
                        class="bg-gradient-to-br from-[#2a0008] via-[#3a0d16] to-[#1a0106] rounded-lg shadow-lg overflow-hidden block hover:scale-105 hover:shadow-[#ff003c]/40 transition-transform border-2 border-transparent hover:border-[#ff003c]"
                      >
                        <img src={rel.image} alt={rel.title} class="w-full h-40 object-cover rounded-t-lg" />
                        <div class="p-3">
                          <h3 class="font-bold text-base mb-1 truncate text-[#ff003c]">{rel.title}</h3>
                          <span class="text-[#ffb3c6] text-xs">{rel.views} views</span>
                        </div>
                      </a>
                    {/each}
                  </div>
                </section>
              {/if}
            </section>
          </div>
        {:else}
          <div class="text-center text-[#ff003c]">Info not found or failed to load.</div>
        {/if}
      </div>
    </div>
  {/if}

  <Footer />
</div>

<style>
  .loader-adult {
    border: 6px solid #ff003c33;
    border-top: 6px solid #ff003c;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }
  @keyframes spin {
    0% { transform: rotate(0deg);}
    100% { transform: rotate(360deg);}
  }
  @media (max-width: 768px) {
    .flex-shrink-0 {
      margin-left: auto;
      margin-right: auto;
    }
  }
</style>