<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';

  // Data from SvelteKit load function
  export let data: {
    pages: { page: number, img: string, headerForImage?: Record<string, string> }[],
    chapterList: { id: string; title: string; chapterNumber?: string; releasedDate?: string }[], // <-- add releasedDate here
    currentIndex: number,
    title: string,
    chapterNumber: string,
    mangaId: string,
    chapterId: string,
    anilistId: string
  };

  let pages = data.pages;
  let chapterList = data.chapterList;
  let currentIndex = data.currentIndex;
  let title = data.title;
  let chapterNumber = data.chapterNumber;
  let mangaId = data.mangaId;
  let chapterId = data.chapterId;
  let anilistId = data.anilistId;

  let currentPage = 0;
  let error = '';
  let loading = false;
  let imageLoadingStates: boolean[] = [];
  let imageErrors: boolean[] = [];
  let showSidebar = false;

  // Initialize loading states
  $: {
    imageLoadingStates = new Array(pages.length).fill(true);
    imageErrors = new Array(pages.length).fill(false);
  }

  // Function to get proxied image URL, but avoid double-proxying
  function getProxiedImageUrl(page: { img: string }) {
    // If already proxied, just return as is
    if (page.img.startsWith('/api/manga?type=image&url=')) {
      return page.img;
    }
    // Otherwise, proxy the raw image URL
    console.log('Raw image URL:', page.img);
    const proxyUrl = `/api/manga?type=image&url=${encodeURIComponent(page.img)}`;
    console.log('Proxy image URL:', proxyUrl);
    return proxyUrl;
  }

  // Navigation
  function goToChapter(idx: number) {
    if (chapterList[idx]) {
      goto(`/manga/read/${anilistId}/${mangaId}/${chapterList[idx].id}`);
    }
  }

  // Read ?page= from URL on mount
  onMount(() => {
    const urlPage = Number(new URLSearchParams(get(page).url.search).get('page'));
    if (!isNaN(urlPage) && urlPage > 0 && urlPage <= pages.length) {
      currentPage = urlPage - 1;
    }
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  // For 1-based page selector
  $: displayPage = currentPage + 1;

  function goToPage(idx: number) {
    if (idx >= 0 && idx < pages.length) {
      currentPage = idx;
      // Update the URL with the new page (keeps SPA navigation)
      goto(
        `/manga/read/${anilistId}/${mangaId}/${chapterId}?page=${idx + 1}`,
        { replaceState: true, keepFocus: true, noScroll: true }
      );
      scrollToTop();
    }
  }

  function scrollToTop() {
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);
  }

  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return; // Don't interfere with form inputs
    }

    switch (event.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        goToPage(currentPage - 1);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault();
        goToPage(currentPage + 1);
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        goToChapter(currentIndex - 1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        goToChapter(currentIndex + 1);
        break;
    }
  }

  // Simple zoom toggle
  let zoomed = false;
  function toggleZoom() {
    zoomed = !zoomed;
    if (zoomed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  // Handle image loading
  function handleImageLoad(idx: number) {
    imageLoadingStates[idx] = false;
    imageErrors[idx] = false;
    imageLoadingStates = [...imageLoadingStates]; // Trigger reactivity
  }

  function handleImageError(idx: number) {
    imageLoadingStates[idx] = false;
    imageErrors[idx] = true;
    imageLoadingStates = [...imageLoadingStates]; // Trigger reactivity

    if (idx === currentPage) {
      error = 'Failed to load current page image.';
    }
  }

  // React to chapter change
  $: if (data.chapterId !== chapterId) {
    pages = data.pages;
    chapterList = data.chapterList;
    currentIndex = data.currentIndex;
    title = data.title;
    chapterNumber = data.chapterNumber;
    mangaId = data.mangaId;
    chapterId = data.chapterId;
    anilistId = data.anilistId;
    currentPage = 0;
    error = '';
    loading = false;
    imageLoadingStates = new Array(pages.length).fill(true);
    imageErrors = new Array(pages.length).fill(false);
  }

  // Add helpers for prev/next chapter
  $: prevChapter = currentIndex > 0 ? chapterList[currentIndex - 1] : null;
  $: nextChapter = currentIndex < chapterList.length - 1 ? chapterList[currentIndex + 1] : null;

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<Navbar />

<!-- Change the main wrapper to match home background -->
<div class="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pt-0">
  <!-- Top Bar (MangaDex style) -->
  <div class="sticky top-0 z-40 bg-neutral-950/95 border-b border-neutral-800 flex items-center justify-between px-4 py-2 shadow">
    <div class="flex items-center gap-2">
      <button
        class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-3 py-1 rounded shadow text-sm disabled:opacity-50"
        on:click={() => goToChapter(currentIndex - 1)}
        disabled={!prevChapter}
        title="Previous Chapter"
      >
        ← Prev
      </button>
      <select
        class="bg-neutral-800 text-orange-400 border border-neutral-700 rounded px-2 py-1"
        bind:value={chapterId}
        on:change={(e) => {
          const target = e.target as HTMLSelectElement | null;
          if (target) goto(`/manga/read/${anilistId}/${mangaId}/${target.value}`);
        }}
        title="Select Chapter"
      >
        {#each chapterList as chapter}
          <option value={chapter.id}>
            {chapter.title}{chapter.releasedDate ? ` (${chapter.releasedDate})` : ''}
          </option>
        {/each}
      </select>
      <button
        class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-3 py-1 rounded shadow text-sm disabled:opacity-50"
        on:click={() => goToChapter(currentIndex + 1)}
        disabled={!nextChapter}
        title="Next Chapter"
      >
        Next →
      </button>
      <button
        class="ml-2 bg-neutral-800 hover:bg-neutral-700 text-orange-300 px-2 py-1 rounded shadow text-sm"
        on:click={() => showSidebar = !showSidebar}
        title="Show/Hide Chapter List"
      >
        {showSidebar ? 'Hide Chapters' : 'Show Chapters'}
      </button>
    </div>
  </div>

  <div class="flex flex-1 w-full">
    <!-- Sidebar for chapter list -->
    {#if showSidebar}
      <aside class="hidden md:block w-64 bg-neutral-950 border-r border-neutral-800 p-4 overflow-y-auto sticky top-[56px] h-[calc(100vh-56px)] z-30">
        <div class="flex justify-between items-center mb-2">
          <span class="text-orange-400 font-bold">Chapters</span>
          <button
            class="text-xs text-gray-400 hover:text-orange-400"
            on:click={() => showSidebar = false}
            title="Hide"
          >✕</button>
        </div>
        <ul class="space-y-1">
          {#each chapterList as chapter, idx}
            <li>
              <a
                href={`/manga/read/${anilistId}/${mangaId}/${chapter.id}`}
                class="block px-3 py-2 rounded transition
                  {chapterId === chapter.id
                    ? 'bg-orange-400 text-gray-900 font-bold'
                    : 'hover:bg-neutral-800 text-orange-300'}"
                on:click|preventDefault={() => goToChapter(idx)}
              >
                {chapter.title}{chapter.releasedDate ? ` (${chapter.releasedDate})` : ''}
              </a>
            </li>
          {/each}
        </ul>
      </aside>
    {/if}

    <!-- Reader Area -->
    <div class="flex-1 flex flex-col items-center w-full px-0 sm:px-4 py-4">
      <!-- Bottom Bar (same as Top Bar, for navigation) -->
      <div class="w-full flex items-center justify-between px-4 py-2 mb-4 bg-neutral-950/95 border-b border-neutral-800 shadow sticky top-0 z-30" style="position: sticky; top: 0;">
        <div class="flex items-center gap-2">
          <button
            class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-3 py-1 rounded shadow text-sm disabled:opacity-50"
            on:click={() => goToChapter(currentIndex - 1)}
            disabled={!prevChapter}
            title="Previous Chapter"
          >
            ← Prev
          </button>
          <select
            class="bg-neutral-800 text-orange-400 border border-neutral-700 rounded px-2 py-1"
            bind:value={chapterId}
            on:change={(e) => {
              const target = e.target as HTMLSelectElement | null;
              if (target) goto(`/manga/read/${anilistId}/${mangaId}/${target.value}`);
            }}
            title="Select Chapter"
          >
            {#each chapterList as chapter}
              <option value={chapter.id}>
                {chapter.title}{chapter.releasedDate ? ` (${chapter.releasedDate})` : ''}
              </option>
            {/each}
          </select>
          <button
            class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-3 py-1 rounded shadow text-sm disabled:opacity-50"
            on:click={() => goToChapter(currentIndex + 1)}
            disabled={!nextChapter}
            title="Next Chapter"
          >
            Next →
          </button>
        </div>
      </div>

      {#if loading}
        <div class="flex items-center justify-center flex-1 py-20">
          <img src="/assets/loader.gif" alt="Loading..." class="w-24 h-24 object-contain" />
        </div>
      {:else if error}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl my-4 mt-20">
          <p class="font-bold">ERROR: {error}</p>
          <button 
            class="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm"
            on:click={() => error = ''}
          >
            Dismiss
          </button>
        </div>
      {:else if pages.length === 0}
        <div class="text-orange-300 text-center py-10">No pages found for this chapter.</div>
      {:else}
        <div class="w-full flex flex-col items-center gap-4">
          <div class="flex flex-col items-center w-full gap-2">
            <div class="w-full flex flex-col items-center">
              {#each pages as page, idx}
                <div class="w-full flex flex-col items-center mb-6">
                  {#if imageLoadingStates[idx]}
                    <div class="flex items-center justify-center w-full h-96 bg-neutral-900 rounded-lg z-10">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
                    </div>
                  {/if}
                  {#if imageErrors[idx]}
                    <div class="w-full max-w-2xl h-96 bg-neutral-800 rounded-lg flex flex-col items-center justify-center border-2 border-red-500">
                      <div class="text-red-400 text-center mb-4">
                        <p class="font-bold">Failed to load page {idx + 1}</p>
                        <p class="text-sm">Try refreshing or use a different provider</p>
                      </div>
                      <button 
                        class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-4 py-2 rounded-lg"
                        on:click={() => {
                          imageErrors[idx] = false;
                          imageLoadingStates[idx] = true;
                          imageLoadingStates = [...imageLoadingStates];
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  {:else}
                    <img
                      src={getProxiedImageUrl(page)}
                      alt={`Page ${page.page ?? (idx + 1)}`}
                      class="w-full max-w-3xl rounded shadow-lg bg-neutral-900 border-2 border-neutral-800 cursor-zoom-in transition-opacity duration-200"
                      class:opacity-0={imageLoadingStates[idx]}
                      class:opacity-100={!imageLoadingStates[idx]}
                      loading="lazy"
                      style="background: #18181b"
                      on:click={() => { currentPage = idx; toggleZoom(); }}
                      on:load={() => handleImageLoad(idx)}
                      on:error={() => handleImageError(idx)}
                    />
                  {/if}
                  <div class="mt-2 text-xs text-gray-400">Page {idx + 1}</div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <Footer />

  <!-- Zoom overlay -->
  {#if zoomed}
    <div 
      class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      on:click={toggleZoom}
      on:keydown={(e) => e.key === 'Escape' && toggleZoom()}
    >
      <img
        src={getProxiedImageUrl(pages[currentPage])}
        alt={`Page ${pages[currentPage].page ?? (currentPage + 1)}`}
        class="max-w-full max-h-full object-contain cursor-zoom-out"
        on:click|stopPropagation
      />
    </div>
  {/if}

  <style>
    img {
      user-select: none;
      -webkit-user-drag: none;
      background: #18181b;
      transition: opacity 0.2s;
      margin: 0 auto;
      display: block;
    }
    select {
      min-width: 60px;
    }
    .sticky {
      backdrop-filter: blur(4px);
    }
    .cursor-zoom-in {
      cursor: zoom-in;
    }
    .cursor-zoom-out {
      cursor: zoom-out;
    }
    .max-w-3xl {
      max-width: 900px;
    }
    .bg-neutral-900 {
      background-color: #18181b;
    }
    .bg-neutral-950 {
      background-color: #0f0f12;
    }
    .border-neutral-800 {
      border-color: #27272a;
    }
    .border-neutral-700 {
      border-color: #404040;
    }
    .bg-neutral-800 {
      background-color: #27272a;
    }
    aside {
      min-width: 220px;
      max-width: 320px;
    }
  </style>
</div>