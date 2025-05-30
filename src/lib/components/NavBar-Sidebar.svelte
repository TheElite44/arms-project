<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'; // Import goto for navigation

  export let isOpen = false; // Sidebar open state
  export let onClose: () => void; // Function to close the sidebar

  let genres: string[] = []; // Genres fetched from the API
  let loadingGenres = true; // Loading state for genres
  let errorGenres: string | null = null; // Error state for genres
  let showAllGenres = false; // Toggle to show all genres

  async function fetchGenres() {
    try {
      const response = await fetch('/api/genre/action?page=1'); // Example genre API call
      const json = await response.json();
      if (json.success) {
        genres = json.data.genres || [];
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
    goto(path); // Use goto for navigation
    onClose(); // Close the sidebar after navigation
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
    background: rgba(32, 31, 49, 0.8);
    z-index: 1000;
    opacity: 0;
    animation: fade-in 0.3s forwards;
  }

  /* Sidebar */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 80%; /* Adjust width for mobile screens */
    max-width: 300px; /* Limit max width */
    height: 100%;
    background: rgba(32, 31, 49, 0.9); /* Original color */
    backdrop-filter: blur(10px) brightness(0.8); /* Frosted glass effect */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1100;
    transform: translateX(-100%); /* Initially hidden */
    transition: transform 0.3s ease-in-out; /* Smooth sliding animation */
    overflow-y: auto; /* Enable scrolling */
    scrollbar-width: none; /* Hide scrollbar in Firefox */
  }

  .sidebar.visible {
    transform: translateX(0); /* Slide in */
  }

  .sidebar.hidden {
    transform: translateX(-100%); /* Slide out */
  }

  .sidebar::-webkit-scrollbar {
    display: none; /* Hide scrollbar in WebKit browsers */
  }

  /* Menu Items */
  .menu-item {
    width: 100%; /* Make the menu item span the full width of the sidebar */
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Extend the line across the sidebar */
    font-weight: 600;
    color: #fbbf24; /* orange-400 */
    cursor: pointer;
    transition: color 0.2s ease-in-out, transform 0.2s ease-in-out;
    animation: slide-in 0.3s ease-in-out forwards;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .menu-item:hover {
    color: #ffffff; /* white */
    transform: scale(1.05);
  }

  /* Loading and Error Messages */
  .loading-message,
  .error-message {
    padding: 1rem;
    font-size: 0.875rem;
    color: #fbbf24; /* orange-400 */
    animation: fade-in 0.3s ease-in-out forwards;
  }

  /* Genre Section */
  .genre-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); /* Responsive grid */
    gap: 0.5rem; /* Space between items */
    margin-top: 1rem;
  }

  .genre-link {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
    cursor: pointer;
    transition: color 0.2s ease-in-out, transform 0.2s ease-in-out;
    color: #fbbf24; /* Default color */
    text-align: left; /* Align text to the left */
  }

  .genre-link:hover {
    transform: scale(1.05);
    color: #ffffff; /* Hover color */
  }

  /* Show More Button */
  .show-more-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #fbbf24; /* Default color */
    cursor: pointer;
    margin-top: 1rem;
    transition: color 0.2s ease-in-out, transform 0.2s ease-in-out;
  }

  .show-more-button:hover {
    color: #ffffff; /* Hover color */
    transform: scale(1.05);
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-in {
    from {
      transform: translateX(-20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
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
      <button class="menu-item" on:click={() => navigateTo('/home')} aria-label="Go to Home">
        Home
      </button>
    </li>
    <li>
      <button class="menu-item" on:click={() => navigateTo('/category/subbed-anime')} aria-label="Go to Subbed Anime">
        Subbed Anime
      </button>
    </li>
    <li>
      <button class="menu-item" on:click={() => navigateTo('/category/dubbed-anime')} aria-label="Go to Dubbed Anime">
        Dubbed Anime
      </button>
    </li>
    <li>
      <button class="menu-item" on:click={() => navigateTo('/category/most-popular')} aria-label="Go to Most Popular">
        Most Popular
      </button>
    </li>
    <li>
      <button class="menu-item" on:click={() => navigateTo('/category/movie')} aria-label="Go to Movies">
        Movies
      </button>
    </li>
    <li>
      <button class="menu-item" on:click={() => navigateTo('/category/tv')} aria-label="Go to TV Series">
        TV Series
      </button>
    </li>
    <li>
      <button class="menu-item" on:click={() => navigateTo('/category/ova')} aria-label="Go to OVAs">
        OVAs
      </button>
    </li>
    <li>
      <button class="menu-item" on:click={() => navigateTo('/category/ona')} aria-label="Go to ONAs">
        ONAs
      </button>
    </li>
    <li>
      <button class="menu-item" on:click={() => navigateTo('/category/special')} aria-label="Go to Specials">
        Specials
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
        {#each (showAllGenres ? genres : genres.slice(0, 10)) as genre}
          <button class="genre-link" on:click={() => navigateTo(`/genre/${genre}`)} aria-label={`Go to ${genre}`}>
            {genre.replace('-', ' ')}
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