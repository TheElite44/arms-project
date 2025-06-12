<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  export let isOpen = false;
  export let onClose: () => void;

  let genres: string[] = [];
  let loadingGenres = true;
  let errorGenres: string | null = null;
  let showAllGenres = false;

  function sanitizeGenreName(genre: string): string {
    return genre
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  async function fetchGenres() {
    try {
      // Use the hanime genre API, only hentaitv provider
      const response = await fetch('/api/hanime/genre/');
      const json = await response.json();
      if (Array.isArray(json)) {
        // Find hentaitv/hentai.tv provider
        const hentaitv = json.find((g) =>
          g.provider === 'hentai.tv' || g.provider === 'hentaitv'
        );
        genres = hentaitv?.genres || [];
      } else if (json.data && Array.isArray(json.data.genres)) {
        genres = json.data.genres;
      } else {
        errorGenres = json.error || 'Failed to fetch genres';
      }
    } catch (err) {
      errorGenres = 'Failed to fetch genres';
    } finally {
      loadingGenres = false;
    }
  }

  function navigateTo(path: string) {
    goto(path);
    onClose();
  }

  onMount(() => {
    fetchGenres();
  });
</script>

<style>
  /* Sidebar Overlay */
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    backdrop-filter: blur(10px);
    background: rgba(42, 0, 8, 0.85); /* Dark red overlay */
    z-index: 1000;
    opacity: 0;
    animation: fade-in 0.3s forwards;
  }

  /* Sidebar */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 80%;
    max-width: 300px;
    height: 100%;
    background: #1a0106; /* Solid color, no gradient */
    backdrop-filter: blur(10px) brightness(0.7);
    box-shadow: 0 4px 16px 0 rgba(255, 0, 60, 0.15);
    z-index: 1100;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    overflow-y: auto;
    scrollbar-width: none;
    border-right: 2px solid #7a2233;
  }

  .sidebar.visible {
    transform: translateX(0);
    animation: sidebar-slide-in 0.35s cubic-bezier(0.4,0,0.2,1);
  }

  .sidebar.hidden {
    transform: translateX(-100%);
    animation: sidebar-slide-out 0.3s cubic-bezier(0.4,0,0.2,1);
  }

  .sidebar::-webkit-scrollbar {
    display: none;
  }

  /* Menu Items */
  .menu-item {
    width: 100%;
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 0, 60, 0.15);
    font-weight: 600;
    color: #ff4d79; /* Vibrant pink */
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    animation: menu-slide-in 0.35s cubic-bezier(0.4,0,0.2,1) both;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
  }

  .menu-item:hover {
    color: #fff;
    background: rgba(255, 0, 60, 0.08);
    transform: scale(1.05);
  }

  /* Loading and Error Messages */
  .loading-message,
  .error-message {
    padding: 1rem;
    font-size: 0.875rem;
    color: #ff4d79;
    animation: fade-in 0.3s ease-in-out forwards;
  }

  /* Genre Section */
  .genre-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .genre-link {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
    color: #ffb3c6;
    text-align: left;
    background: transparent;
    border-radius: 0.375rem;
    padding: 0.25rem 0.5rem;
    animation: genre-slide-in 0.45s cubic-bezier(0.4,0,0.2,1) both;
    opacity: 0;
  }

  .genre-link:hover {
    transform: scale(1.05);
    color: #fff;
    background: #ff003c;
  }

  /* Show More Button */
  .show-more-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ff4d79;
    cursor: pointer;
    margin-top: 1rem;
    transition: color 0.2s, transform 0.2s;
    background: transparent;
  }

  .show-more-button:hover {
    color: #fff;
    transform: scale(1.05);
  }

  /* Mobile-specific styles */
  @media (max-width: 768px) {
    .sidebar {
      width: 65%;
      max-width: 300px;
    }

    .menu-item {
      font-size: 0.875rem;
      padding: 0.75rem;
    }

    .genre-section {
      grid-template-columns: repeat(2, 1fr);
    }

    .genre-link {
      font-size: 0.75rem;
    }

    .show-more-button {
      font-size: 0.75rem;
    }
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes sidebar-slide-in {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  @keyframes sidebar-slide-out {
    from { transform: translateX(0); }
    to { transform: translateX(-100%); }
  }
  @keyframes menu-slide-in {
    from { opacity: 0; transform: translateX(-24px);}
    to { opacity: 1; transform: translateX(0);}
  }
  @keyframes genre-slide-in {
    from { opacity: 0; transform: translateX(-24px);}
    to { opacity: 1; transform: translateX(0);}
  }
</style>

{#if isOpen}
  <button class="sidebar-overlay" on:click={onClose} aria-label="Close sidebar"></button>
{/if}

<div class={`sidebar ${isOpen ? 'visible' : 'hidden'}`}>
  <!-- Close Button -->
  <div class="px-4 py-3 border-b border-gray-700">
    <button
      on:click={onClose}
      class="text-white flex items-center gap-2 px-3 py-2 transition"
    >
      <!-- Icon -->
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span>Close Menu</span>
    </button>
  </div>

  <!-- Menu Items -->
  <ul class="text-white">
    <li>
      <button class="menu-item" on:click={() => navigateTo('/hanime')} aria-label="Go to Hanime Home">
        Home
      </button>
    </li>
    <li>
      <button class="menu-item" on:click={() => navigateTo('/home')} aria-label="Go to Home">
        Exit Hanime
      </button>
    </li>
  </ul>

  <!-- Genre Section -->
  <div class="text-white mt-4 px-4" style="margin-bottom: 2rem;">
    <h5 class="text-lg font-bold mb-2">Genres</h5>
    {#if loadingGenres}
      <p class="loading-message">Loading genres...</p>
    {:else if errorGenres}
      <p class="error-message">{errorGenres}</p>
    {:else}
      <div class="genre-section">
        {#each (showAllGenres ? genres : genres.slice(0, 26)) as genre, i}
          <button
            class="genre-link"
            style="animation-delay: {i * 40}ms"
            on:click={() => navigateTo(`/hanime/genre/${sanitizeGenreName(genre)}`)}
            aria-label={`Go to ${sanitizeGenreName(genre)}`}
          >
            {sanitizeGenreName(genre).replace('-', ' ')}
          </button>
        {/each}
      </div>
      {#if genres.length > 10}
        <button class="show-more-button" on:click={() => (showAllGenres = !showAllGenres)}>
          {#if showAllGenres}
            <!-- Icon for "Show Less" -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
            </svg>
            Show Less
          {:else}
            <!-- Icon for "Show More" -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Show More
          {/if}
        </button>
      {/if}
    {/if}
  </div>
</div>