<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  export let params: { name: string }; // Category name from route parameters

  let loading = true;
  let error: string | null = null;
  let data: {
    category: string;
    animes: Array<any>;
    genres: Array<string>;
    top10Animes: { today: Array<any> };
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
  } | null = null;
  let showAllGenres = false; // Toggle for showing all genres

  async function fetchCategoryData(page = 1) {
    if (!params?.name) {
      error = 'Category name is missing';
      loading = false;
      return;
    }

    try {
      console.log(`Fetching data for category: ${params.name}, page: ${page}`);
      const resp = await fetch(`/api/category/${params.name}?page=${page}`);
      const json = await resp.json();
      console.log('API Response:', json);

      if (json.success && json.data) {
        data = {
          category: params.name,
          animes: json.data.animes || [],
          genres: json.data.genres || [],
          top10Animes: json.data.top10Animes || { today: [] },
          currentPage: json.data.currentPage || 1,
          totalPages: json.data.totalPages || 1,
          hasNextPage: json.data.hasNextPage || false,
        };
      } else {
        error = json.error || 'Failed to load category data';
        data = { category: params.name, animes: [], genres: [], top10Animes: { today: [] }, currentPage: 1, totalPages: 1, hasNextPage: false };
      }
    } catch (e) {
      console.error('Fetch Error:', e);
      error = 'Failed to load category data';
      data = { category: params.name, animes: [], genres: [], top10Animes: { today: [] }, currentPage: 1, totalPages: 1, hasNextPage: false };
    } finally {
      loading = false;
    }
  }

  function loadNextPage() {
    if (data?.hasNextPage) {
      fetchCategoryData(data.currentPage + 1);
    }
  }

  onMount(() => {
    fetchCategoryData();
  });
</script>

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
          <!-- Render content -->
        {/if}
      </div>
    </div>
  {/if}

  <Footer />
</div>