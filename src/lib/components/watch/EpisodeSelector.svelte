<script lang="ts">
  export let episodes: any[] = [];
  export let pagedEpisodes: any[] = [];
  export let episodeRanges: string[] = [];
  export let currentPage: number = 1;
  export let currentEpisodeId: string = '';
  export let handlePageChange: (event: Event) => void;
  export let goToEpisode: (episodeId: string) => void;
</script>

{#if episodes.length > 1}
  <div class="mb-2 flex flex-col gap-1">
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