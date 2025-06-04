<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from '$lib/components/hanime/Navbar.svelte';
  import Footer from '$lib/components/hanime/Footer.svelte';

  let trending: any[] = [];
  let recent: any[] = [];
  let loading = true;
  let error: string | null = null;
  let showWarning = true;

  onMount(async () => {
    try {
      const [trendingRes, recentRes] = await Promise.all([
        fetch('/api/hanime/trending'),
        fetch('/api/hanime/recent')
      ]);
      const trendingJson = await trendingRes.json();
      const recentJson = await recentRes.json();

      if (trendingJson.status === 'success') {
        trending = trendingJson.data.results;
      }
      if (recentJson.status === 'success') {
        recent = recentJson.data.results;
      }
    } catch (e) {
      error = 'Failed to load content. Please try again later.';
    } finally {
      loading = false;
    }
  });

  function closeWarning() {
    showWarning = false;
  }
</script>

<Navbar />

<div class="flex flex-col min-h-screen bg-gradient-to-br from-[#2a0008] via-[#3a0d16] to-[#1a0106] text-white">
  {#if loading}
    <div class="flex items-center justify-center flex-1 pt-20">
      <div class="text-center">
        <div class="loader-adult mb-4"></div>
        <p class="text-[#ffb3c6] text-lg font-medium">Loading content...</p>
      </div>
    </div>
  {:else}
    <div class="flex-1 w-full pt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Professional Hero Section -->
        <section class="relative mb-10">
          <div class="relative bg-gradient-to-r from-[#2a0008] via-[#3a0d16] to-[#2a0008] rounded-2xl overflow-hidden shadow-xl border border-[#ff003c]/20 px-4 py-8 sm:px-8 sm:py-10">
            <div class="absolute inset-0 bg-[url('https://i.imgur.com/4M7IWwP.jpg')] bg-cover bg-center opacity-10"></div>
            <div class="relative z-10 flex flex-col items-center text-center gap-3">
              <div class="flex items-center justify-center mb-2">
                <div class="bg-[#ff003c]/10 p-2 rounded-xl border border-[#ff003c]/30">
                  <svg class="w-8 h-8 text-[#ff003c]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
              </div>
              <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center justify-center gap-2">
                ARMS <span class="text-[#ff003c]">Adult</span>
                <span class="inline-block bg-[#ff003c] text-black text-xs sm:text-sm px-2 py-0.5 rounded-full font-bold">18+</span>
              </h1>
              <p class="text-base sm:text-lg text-[#ffb3c6] font-light max-w-xl mx-auto leading-snug">
                Premium adult anime for mature audiences.<br>
                <span class="text-sm">Trending & new series, updated daily.</span>
              </p>
              <div class="flex flex-col gap-2 mt-2 w-full max-w-xs sm:max-w-none sm:flex-row sm:justify-center">
                <a href="#trending"
                   class="bg-black/80 hover:bg-[#ff003c] text-[#ff003c] hover:text-black font-bold px-4 py-2 rounded-lg shadow border border-[#ff003c] text-xs sm:text-base w-full sm:w-auto transition">
                  See Trending
                </a>
                <a href="#recent"
                   class="bg-[#ff003c] hover:bg-[#c2002e] text-black font-bold px-4 py-2 rounded-lg shadow ring-2 ring-[#ff003c]/40 text-xs sm:text-base w-full sm:w-auto transition">
                  Browse Recent
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- Trending Section -->
        <section id="trending" class="mb-16">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-3">
              <div class="w-1 h-8 bg-[#ff003c] rounded-full"></div>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Trending Now</h2>
              <span class="bg-[#ff003c]/20 text-[#ff003c] px-3 py-1 rounded-full text-sm font-medium">
                {trending.length} items
              </span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
            {#each trending as item, index}
              <a
                href={`/hanime/info/${item.id}`}
                class="group relative bg-[#1a0106] rounded-2xl overflow-hidden shadow-lg transition-all duration-200 border-2 border-transparent hover:border-[#ff003c] hover:shadow-[#ff003c]/40"
              >
                <div class="relative aspect-[3/4]">
                  <img
                    src={item.image}
                    alt={item.title}
                    class="w-full h-full object-cover"
                    loading={index < 12 ? 'eager' : 'lazy'}
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div class="absolute top-3 left-3">
                    <span class="bg-[#ff003c] text-white px-2 py-1 rounded-lg text-xs font-semibold shadow-lg">
                      Trending
                    </span>
                  </div>
                  <div class="absolute top-3 right-3">
                    <span class="bg-black/70 backdrop-blur-sm text-[#ffb3c6] px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z"/>
                      </svg>
                      {item.views?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 p-4">
                    <h3 class="font-semibold text-white text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-[#ffb3c6] transition-colors" title={item.title}>
                      {item.title}
                    </h3>
                    <div class="flex items-center justify-between">
                      <span class="bg-[#ff003c] text-white px-2 py-1 rounded-md text-xs font-bold">18+</span>
                      <span class="text-[#ffb3c6] text-xs">{item.duration || '--:--'}</span>
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </section>

        <!-- Recent Section -->
        <section id="recent" class="mb-16">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-3">
              <div class="w-1 h-8 bg-[#ff003c] rounded-full"></div>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Recently Added</h2>
              <span class="bg-[#ff003c]/20 text-[#ff003c] px-3 py-1 rounded-full text-sm font-medium">
                {recent.length} items
              </span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
            {#each recent as item, index}
              <a
                href={`/hanime/watch/${item.id}`}
                class="group relative bg-[#1a0106] rounded-2xl overflow-hidden shadow-lg transition-all duration-200 border-2 border-transparent hover:border-[#ff003c] hover:shadow-[#ff003c]/40"
              >
                <div class="relative aspect-[3/4]">
                  <img
                    src={item.image}
                    alt={item.title}
                    class="w-full h-full object-cover"
                    loading={index < 12 ? 'eager' : 'lazy'}
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div class="absolute top-3 left-3">
                    <span class="bg-[#ff003c] text-white px-2 py-1 rounded-lg text-xs font-semibold shadow-lg">
                      New
                    </span>
                  </div>
                  <div class="absolute top-3 right-3">
                    <span class="bg-black/70 backdrop-blur-sm text-[#ffb3c6] px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.657l-6.828-6.829a4 4 0 010-5.656z"/>
                      </svg>
                      {item.views?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 p-4">
                    <h3 class="font-semibold text-white text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-[#ffb3c6] transition-colors" title={item.title}>
                      {item.title}
                    </h3>
                    <div class="flex items-center justify-between">
                      <span class="bg-[#ff003c] text-white px-2 py-1 rounded-md text-xs font-bold">18+</span>
                      <span class="text-[#ffb3c6] text-xs">{item.duration || '--:--'}</span>
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </section>

        {#if error}
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
        {/if}
      </div>
    </div>
  {/if}

  <Footer />
</div>

{#if showWarning}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2">
    <div class="bg-gradient-to-br from-[#2a0008] via-[#3a0d16] to-[#1a0106] border border-[#ff003c]/40 rounded-2xl shadow-2xl p-4 max-w-xs w-full text-center animate-fade-in">
      <div class="flex flex-col items-center mb-2">
        <div class="bg-[#ff003c]/10 p-1.5 rounded-full border border-[#ff003c]/30 mb-2">
          <svg class="w-7 h-7 text-[#ff003c]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
          </svg>
        </div>
        <h2 class="text-base font-bold text-[#ff003c] mb-1 tracking-tight">18+ Content</h2>
      </div>
      <p class="text-[#ffb3c6] text-xs leading-snug mb-4">
        This section contains explicit material.<br>
        By continuing, you confirm you are <span class="text-[#ff003c] font-bold">18+</span> and legally permitted to view such content.
      </p>
      <div class="flex flex-col gap-2">
        <button
          class="w-full bg-[#ff003c] hover:bg-[#c2002e] text-white font-semibold px-4 py-2 rounded-lg shadow transition-all duration-200"
          on:click={closeWarning}
        >
          Yes, I am 18+
        </button>
        <button
          class="w-full bg-transparent hover:bg-[#ff003c]/10 text-[#ff003c] font-semibold px-4 py-2 rounded-lg border border-[#ff003c]/40 shadow transition-all duration-200"
          on:click={() => window.location.href = '/'}
        >
          No, take me back
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .animate-fade-in {
    animation: fade-in 0.4s ease-out;
  }
  
  @keyframes fade-in {
    from { 
      opacity: 0; 
      transform: scale(0.95) translateY(20px);
    }
    to { 
      opacity: 1; 
      transform: scale(1) translateY(0);
    }
  }
  
  .loader-adult {
    border: 4px solid #ff003c33;
    border-top: 4px solid #ff003c;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Smooth scrolling for anchor links */
  html {
    scroll-behavior: smooth;
  }
  
  /* Enhanced focus styles for accessibility */
  a:focus,
  button:focus {
    outline: 2px solid #ff003c;
    outline-offset: 2px;
  }
  
  /* Professional hover effects */
  .group:hover .group-hover\:scale-110 {
    transform: none;
  }
  
  /* Home-style border animation on hover */
  .group {
    border: 2px solid transparent;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .group:hover {
    border-color: #ff003c;
    box-shadow: 0 0 0 2px #ff003c44, 0 4px 24px #ff003c22;
  }
  
  /* Backdrop blur support */
  @supports (backdrop-filter: blur(10px)) {
    .backdrop-blur-sm {
      backdrop-filter: blur(4px);
    }
  }
</style>