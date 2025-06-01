<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let images: string[] = [];
  let title = '';
  let chapterNumber = '';
  let loading = true;
  let error = '';
  let mangaId = '';
  let chapterId = '';
  let chapterList: { id: string, chapterNumber: string, title?: string }[] = [];
  let currentIndex = -1;

  // Page navigation
  let currentPage = 0;

  $: params = $page.params;
  $: mangaId = params.id;
  $: chapterId = params.chapterId;

  // Fetch chapter images and info
  async function fetchChapter() {
    loading = true;
    error = '';
    try {
      // Fetch chapter info (including chapter list, title, etc.)
      const infoRes = await fetch(`/api/manga?type=info&id=${encodeURIComponent(mangaId)}`);
      const infoData = await infoRes.json();
      if (!infoData.success) throw new Error('Failed to load manga info');
      chapterList = infoData.data.chapters ?? [];
      currentIndex = chapterList.findIndex(c => c.id === chapterId);
      const chapterMeta = chapterList[currentIndex] ?? {};
      title = chapterMeta.title ?? '';
      chapterNumber = chapterMeta.chapterNumber ?? '';

      // Fetch chapter pages (images)
      const readRes = await fetch(`/api/manga?type=read&chapterId=${encodeURIComponent(chapterId)}&provider=mangadex`);
      const readData = await readRes.json();
      console.log('Read API response:', readData); // Debug log

      // Try to handle both array and object responses
      if (Array.isArray(readData.data)) {
        images = readData.data.map((p: { img: string }) => p.img);
      } else if (readData.data?.img) {
        images = [readData.data.img];
      } else {
        images = [];
      }
      currentPage = 0;
      scrollToTop();
    } catch (e: any) {
      error = e.message || 'Unknown error';
    } finally {
      loading = false;
    }
  }

  function goToChapter(idx: number) {
    if (chapterList[idx]) {
      goto(`/manga/read/${mangaId}/${chapterList[idx].id}`);
    }
  }

  function goToPage(idx: number) {
    if (idx >= 0 && idx < images.length) {
      currentPage = idx;
      scrollToTop();
    }
  }

  function scrollToTop() {
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);
  }

  // Keyboard navigation
  function handleKeydown(e: KeyboardEvent) {
    if (loading) return;
    if (e.key === 'ArrowRight') {
      if (currentPage < images.length - 1) goToPage(currentPage + 1);
      else if (currentIndex < chapterList.length - 1) goToChapter(currentIndex + 1);
    }
    if (e.key === 'ArrowLeft') {
      if (currentPage > 0) goToPage(currentPage - 1);
      else if (currentIndex > 0) goToChapter(currentIndex - 1);
    }
  }

  onMount(() => {
    fetchChapter();
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  $: if (mangaId && chapterId) {
    fetchChapter();
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
</script>

<Navbar />

<div class="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pt-16">
  <div class="flex-1 w-full flex flex-col items-center px-2 sm:px-0">
    {#if loading}
      <div class="flex items-center justify-center flex-1 py-20">
        <img src="/assets/loader.gif" alt="Loading..." class="w-24 h-24 object-contain" />
      </div>
    {:else if error}
      <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl my-4 mt-20">
        <p class="font-bold">ERROR: {error}</p>
      </div>
    {:else}
      <div class="w-full max-w-4xl mx-auto flex flex-col gap-6">
        <!-- Sticky Chapter Navigation -->
        <div class="sticky top-16 z-30 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 bg-opacity-95 rounded-lg px-4 py-3 shadow flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-4 py-1 rounded-lg shadow transition text-sm disabled:opacity-50"
            on:click={() => goToChapter(currentIndex - 1)}
            disabled={currentIndex <= 0}
          >
            Previous Chapter
          </button>
          <div class="flex-1 flex flex-col items-center">
            <div class="font-bold text-lg text-orange-400 truncate">{title || `Chapter ${chapterNumber}`}</div>
            <div class="text-xs text-gray-300">Chapter {chapterNumber}</div>
          </div>
          <button
            class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-4 py-1 rounded-lg shadow transition text-sm disabled:opacity-50"
            on:click={() => goToChapter(currentIndex + 1)}
            disabled={currentIndex === -1 || currentIndex >= chapterList.length - 1}
          >
            Next Chapter
          </button>
        </div>

        <!-- Page Navigation Controls -->
        {#if images.length > 1}
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900 bg-opacity-80 rounded-xl px-4 py-2 shadow">
          <button
            class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-3 py-1 rounded-lg shadow transition text-sm disabled:opacity-50"
            on:click={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 0}
          >
            Prev Page
          </button>
          <div class="flex items-center gap-2">
            <span class="text-orange-300 font-bold">Page</span>
            <select
              class="bg-gray-900 text-orange-400 border border-gray-700 rounded-lg px-2 py-1"
              bind:value={currentPage}
              on:change={(e) => {
                const target = e.target as HTMLSelectElement | null;
                if (target) goToPage(+target.value);
              }}
            >
              {#each images as _, idx}
                <option value={idx}>{idx + 1}</option>
              {/each}
            </select>
            <span class="text-gray-400">/ {images.length}</span>
          </div>
          <button
            class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-3 py-1 rounded-lg shadow transition text-sm disabled:opacity-50"
            on:click={() => goToPage(currentPage + 1)}
            disabled={currentPage >= images.length - 1}
          >
            Next Page
          </button>
        </div>
        {/if}

        <!-- Reader Card -->
        <div class="bg-gray-900 bg-opacity-80 rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col items-center gap-6">
          {#if images.length === 0}
            <div class="text-orange-300 text-center py-10">No pages found for this chapter.</div>
          {:else}
            <div class="w-full flex justify-center">
              <img
                src={images[currentPage]}
                alt={`Page ${currentPage + 1}`}
                class="w-full max-w-2xl rounded-lg shadow-lg bg-gray-900 border-2 border-gray-800 cursor-zoom-in"
                loading="lazy"
                style="background: #18181b"
                on:click={toggleZoom}
                on:error={() => error = 'Failed to load one or more images.'}
              />
            </div>
            {#if zoomed}
              <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" on:click={toggleZoom}>
                <img src={images[currentPage]} alt="Zoomed" class="max-h-[95vh] max-w-[95vw] rounded-lg shadow-2xl border-4 border-orange-400" />
              </div>
            {/if}
          {/if}
        </div>

        <!-- Chapter Select Dropdown -->
        <div class="flex justify-center mt-4">
          <select
            class="bg-gray-900 text-orange-400 border border-gray-700 rounded-lg px-4 py-2"
            bind:value={chapterId}
            on:change={(e) => {
              const target = e.target as HTMLSelectElement | null;
              if (target) goto(`/manga/read/${mangaId}/${target.value}`);
            }}
          >
            {#each chapterList as chapter}
              <option value={chapter.id}>
                Chapter {chapter.chapterNumber}{chapter.title ? ` - ${chapter.title}` : ''}
              </option>
            {/each}
          </select>
        </div>
      </div>
    {/if}
  </div>
  <Footer />
</div>

<style>
  img {
    user-select: none;
    -webkit-user-drag: none;
    background: #18181b;
    transition: box-shadow 0.2s;
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
</style>