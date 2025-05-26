<script lang="ts">
  export let sidebarTab: 'airing' | 'upcoming' = 'airing';
  export let setSidebarTab: (tab: 'airing' | 'upcoming') => void;
  export let topAiringAnimes: any[] = [];
  export let topUpcomingAnimes: any[] = [];
</script>

<aside class="w-full xl:w-80 flex-shrink-0 flex flex-col gap-8 mt-8 xl:mt-0">
  <div>
    <div class="flex gap-2 mb-3 sm:mb-4">
      <button
        class="flex-1 px-3 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition
          {sidebarTab === 'airing' ? 'bg-orange-400 text-gray-900' : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
        on:click={() => setSidebarTab('airing')}
      >TOP AIRING</button>
      <button
        class="flex-1 px-3 py-2 rounded-xl font-bold text-[11px] sm:text-xs transition
          {sidebarTab === 'upcoming' ? 'bg-orange-400 text-gray-900' : 'bg-gray-800 text-white hover:bg-orange-400 hover:text-gray-900'}"
        on:click={() => setSidebarTab('upcoming')}
      >UPCOMING</button>
    </div>
    <div>
      {#if sidebarTab === 'airing'}
        <div class="flex flex-col gap-1.5 sm:gap-2">
          {#each topAiringAnimes as anime}
            <a href={`/info/${anime.id}`} class="flex items-center gap-2 bg-gray-800 rounded-lg p-1.5 sm:p-2 hover:bg-orange-400 hover:text-gray-900 transition">
              <img src={anime.poster} alt={anime.name} class="w-9 h-12 sm:w-12 sm:h-16 object-cover rounded-md" />
              <div class="flex-1 min-w-0">
                <div
                  class="font-semibold truncate text-[11px] sm:text-xs max-w-full"
                  style="max-width:100%;"
                  title={anime.name}
                >
                  {anime.name}
                </div>
              </div>
            </a>
          {/each}
        </div>
      {:else if sidebarTab === 'upcoming'}
        <div class="flex flex-col gap-1.5 sm:gap-2">
          {#each topUpcomingAnimes as anime}
            <a href={`/info/${anime.id}`} class="flex items-center gap-2 bg-gray-800 rounded-lg p-1.5 sm:p-2 hover:bg-orange-400 hover:text-gray-900 transition">
              <img src={anime.poster} alt={anime.name} class="w-9 h-12 sm:w-12 sm:h-16 object-cover rounded-md" />
              <div class="flex-1 min-w-0">
                <div
                  class="font-semibold truncate text-[11px] sm:text-xs max-w-full"
                  style="max-width:100%;"
                  title={anime.name}
                >
                  {anime.name}
                </div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</aside>