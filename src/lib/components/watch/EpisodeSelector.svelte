<script lang="ts">
  export let episodes: any[] = [];
  export let pagedEpisodes: any[] = [];
  export let episodeRanges: string[] = [];
  export let currentPage: number = 1;
  export let currentEpisodeId: string = '';
  export let handlePageChange: (event: Event) => void;
  export let goToEpisode: (episodeId: string) => void;

  let open = false;

  function selectPage(i: number) {
    open = false;
    // Create a fake event to keep your API unchanged
    handlePageChange({ target: { value: i + 1 } } as any);
  }

  // Helper to format ranges as "EP 1-50"
  function formatRange(range: string, i: number) {
    const [start, end] = range.split('-');
    return `EPS: ${start}-${end}`;
  }
</script>

{#if episodes.length > 1}
  <div class="mb-2 flex flex-col gap-1">
    <div class="flex items-center gap-2 relative pb-1">
      <span class="font-semibold text-orange-400 text-xs">Pages:</span>
      <div class="relative w-32
      ">
        <button
          class="w-full px-2 py-1 rounded bg-gray-800 text-white text-xs flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-orange-400"
          on:click={() => open = !open}
          type="button"
        >
          {formatRange(episodeRanges[currentPage - 1], currentPage - 1)}
          <svg class="w-3 h-3 ml-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        {#if open}
          <ul
            class="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded shadow max-h-48 overflow-y-auto"
            on:mouseleave={() => open = false}
          >
            {#each episodeRanges as range, i}
              <li
                class="px-3 py-2 cursor-pointer flex items-center hover:bg-orange-400 hover:text-gray-900 text-xs
                  {currentPage === i + 1 ? 'bg-gray-800 font-bold' : ''}"
                on:click={() => selectPage(i)}
              >
                {formatRange(range, i)}
                {#if currentPage === i + 1}
                  <svg class="w-4 h-4 ml-auto text-orange-400" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
    <div class="grid grid-cols-5 sm:grid-cols-10 gap-1">
      {#each pagedEpisodes as ep}
        <button
          class="flex items-center justify-center h-10 w-full rounded bg-gray-800 text-white font-bold text-xs transition
            {ep.episodeId === currentEpisodeId
              ? 'bg-orange-400 text-gray-900 shadow'
              : 'hover:bg-orange-400 hover:text-gray-900'}"
          on:click={() => goToEpisode(ep.episodeId)}
          disabled={ep.episodeId === currentEpisodeId}
        >
          {ep.number}
        </button>
      {/each}
    </div>
  </div>
{/if}