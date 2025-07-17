<script lang="ts">
  import AnimeCard from '$lib/components/AnimeCard.svelte';
  export let data: any;
</script>

<section class="max-w-[1800px] mx-auto px-2 mt-8">
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-1">
    <!-- Top Airing -->
    <div>
      <div class="text-xl font-bold text-orange-300 mb-4 text-left md:text-left block w-fit">
        Top Airing
      </div>
      <div class="flex flex-col gap-4 bg-gray-800 rounded-xl p-4">
        {#each data.topAiringAnimes?.slice(0, 5) as anime}
          <a href={`/info/${anime.id}`} class="flex items-center gap-3 border-b border-gray-700 pb-3 last:border-b-0 last:pb-0 hover:bg-gray-700 transition rounded">
            <img src={anime.poster} alt={anime.name} class="w-12 h-16 rounded-md object-cover" /> <!-- slightly smaller poster -->
            <div class="flex-1">
              <div class="font-semibold text-white text-[14px] leading-tight line-clamp-2">{anime.name}</div> <!-- slightly smaller title -->
              <div class="flex items-center gap-2 mt-1">
                {#if anime.episodes?.sub}
                  <span class="flex items-center bg-green-200 text-black text-xs font-bold px-2 py-0.5 rounded">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 576 512"><path d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm80 120c13.3 0 24 10.7 24 24c0 13.3-10.7 24-24 24H112v16c0 22.1 17.9 40 40 40c13.3 0 24 10.7 24 24s-10.7 24-24 24c-48.6 0-88-39.4-88-88v-16c0-13.3 10.7-24 24-24h56zm176 24c0-13.3 10.7-24 24-24h56c13.3 0 24 10.7 24 24v16c0 48.6-39.4 88-88 88c-13.3 0-24-10.7-24-24s10.7-24 24-24c22.1 0 40-17.9 40-40v-16h-16c-13.3 0-24-10.7-24-24z"/></svg>
                    {anime.episodes.sub}
                  </span>
                {/if}
                {#if anime.episodes?.dub}
                  <span class="flex items-center bg-blue-200 text-black text-xs font-bold px-2 py-0.5 rounded">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 352 512"><path d="M176 352c53 0 96-43 96-96V112c0-53-43-96-96-96s-96 43-96 96v144c0 53 43 96 96 96zm128-96c0 70.7-57.3 128-128 128S48 326.7 48 256H0c0 91.9 70.7 167.6 160 175.2V464h-48c-13.3 0-24 10.7-24 24s10.7 24 24 24H240c13.3 0 24-10.7 24-24s-10.7-24-24-24h-48v-32.8C281.3 423.6 352 347.9 352 256h-48z"/></svg>
                    {anime.episodes.dub}
                  </span>
                {/if}
                <span class="text-xs text-gray-300">{anime.type}</span>
              </div>
            </div>
          </a>
        {/each}
        <a href="/top-airing" class="block text-left text-orange-300 hover:text-orange-400 font-semibold mt-2 transition">View more &gt;</a>
      </div>
    </div>

    <!-- Most Popular -->
    <div>
      <div class="text-xl font-bold text-orange-300 mb-4 text-left md:text-left block w-fit">
        Most Popular
      </div>
      <div class="flex flex-col gap-4 bg-gray-800 rounded-xl p-4">
        {#each data.mostPopularAnimes?.slice(0, 5) as anime}
          <a href={`/info/${anime.id}`} class="flex items-center gap-3 border-b border-gray-700 pb-3 last:border-b-0 last:pb-0 hover:bg-gray-700 transition rounded">
            <img src={anime.poster} alt={anime.name} class="w-12 h-16 rounded-md object-cover" /> <!-- slightly smaller poster -->
            <div class="flex-1">
              <div class="font-semibold text-white text-[14px] leading-tight line-clamp-2">{anime.name}</div> <!-- slightly smaller title -->
              <div class="flex items-center gap-2 mt-1">
                {#if anime.episodes?.sub}
                  <span class="flex items-center bg-green-200 text-black text-xs font-bold px-2 py-0.5 rounded">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 576 512"><path d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm80 120c13.3 0 24 10.7 24 24c0 13.3-10.7 24-24 24H112v16c0 22.1 17.9 40 40 40c13.3 0 24 10.7 24 24s-10.7 24-24 24c-48.6 0-88-39.4-88-88v-16c0-13.3 10.7-24 24-24h56zm176 24c0-13.3 10.7-24 24-24h56c13.3 0 24 10.7 24 24v16c0 48.6-39.4 88-88 88c-13.3 0-24-10.7-24-24s10.7-24 24-24c22.1 0 40-17.9 40-40v-16h-16c-13.3 0-24-10.7-24-24z"/></svg>
                    {anime.episodes.sub}
                  </span>
                {/if}
                {#if anime.episodes?.dub}
                  <span class="flex items-center bg-blue-200 text-black text-xs font-bold px-2 py-0.5 rounded">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 352 512"><path d="M176 352c53 0 96-43 96-96V112c0-53-43-96-96-96s-96 43-96 96v144c0 53 43 96 96 96zm128-96c0 70.7-57.3 128-128 128S48 326.7 48 256H0c0 91.9 70.7 167.6 160 175.2V464h-48c-13.3 0-24 10.7-24 24s10.7 24 24 24H240c13.3 0 24-10.7 24-24s-10.7-24-24-24h-48v-32.8C281.3 423.6 352 347.9 352 256h-48z"/></svg>
                    {anime.episodes.dub}
                  </span>
                {/if}
                <span class="text-xs text-gray-300">{anime.type}</span>
              </div>
            </div>
            
          </a>
        {/each}
        <a href="/category/most-popular" class="block text-left text-orange-300 hover:text-orange-400 font-semibold mt-2 transition">View more &gt;</a>
      </div>
    </div>

    <!-- Most Favorite -->
    <div>
      <div class="text-xl font-bold text-orange-300 mb-4 text-left md:text-left block w-fit">
        Most Favorite
      </div>
      <div class="flex flex-col gap-4 bg-gray-800 rounded-xl p-4">
        {#each data.mostFavoriteAnimes?.slice(0, 5) as anime}
          <a href={`/info/${anime.id}`} class="flex items-center gap-3 border-b border-gray-700 pb-3 last:border-b-0 last:pb-0 hover:bg-gray-700 transition rounded">
            <img src={anime.poster} alt={anime.name} class="w-12 h-16 rounded-md object-cover" /> <!-- slightly smaller poster -->
            <div class="flex-1">
              <div class="font-semibold text-white text-[14px] leading-tight line-clamp-2">{anime.name}</div> <!-- slightly smaller title -->
              <div class="flex items-center gap-2 mt-1">
                {#if anime.episodes?.sub}
                  <span class="flex items-center bg-green-200 text-black text-xs font-bold px-2 py-0.5 rounded">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 576 512"><path d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm80 120c13.3 0 24 10.7 24 24c0 13.3-10.7 24-24 24H112v16c0 22.1 17.9 40 40 40c13.3 0 24 10.7 24 24s-10.7 24-24 24c-48.6 0-88-39.4-88-88v-16c0-13.3 10.7-24 24-24h56zm176 24c0-13.3 10.7-24 24-24h56c13.3 0 24 10.7 24 24v16c0 48.6-39.4 88-88 88c-13.3 0-24-10.7-24-24s10.7-24 24-24c22.1 0 40-17.9 40-40v-16h-16c-13.3 0-24-10.7-24-24z"/></svg>
                    {anime.episodes.sub}
                  </span>
                {/if}
                {#if anime.episodes?.dub}
                  <span class="flex items-center bg-blue-200 text-black text-xs font-bold px-2 py-0.5 rounded">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 352 512"><path d="M176 352c53 0 96-43 96-96V112c0-53-43-96-96-96s-96 43-96 96v144c0 53 43 96 96 96zm128-96c0 70.7-57.3 128-128 128S48 326.7 48 256H0c0 91.9 70.7 167.6 160 175.2V464h-48c-13.3 0-24 10.7-24 24s10.7 24 24 24H240c13.3 0 24-10.7 24-24s-10.7-24-24-24h-48v-32.8C281.3 423.6 352 347.9 352 256h-48z"/></svg>
                    {anime.episodes.dub}
                  </span>
                {/if}
                <span class="text-xs text-gray-300">{anime.type}</span>
              </div>
            </div>
          </a>
        {/each}
        <a href="/most-favorite" class="block text-left text-orange-300 hover:text-orange-400 font-semibold mt-2 transition">View more &gt;</a>
      </div>
    </div>

    <!-- Latest Completed -->
    <div>
      <div class="text-xl font-bold text-orange-300 mb-4 text-left md:text-left block w-fit">
        Latest Completed
      </div>
      <div class="flex flex-col gap-4 bg-gray-800 rounded-xl p-4">
        {#each data.latestCompletedAnimes?.slice(0, 5) as anime}
          <a href={`/info/${anime.id}`} class="flex items-center gap-3 border-b border-gray-700 pb-3 last:border-b-0 last:pb-0 hover:bg-gray-700 transition rounded">
            <img src={anime.poster} alt={anime.name} class="w-12 h-16 rounded-md object-cover" /> <!-- slightly smaller poster -->
            <div class="flex-1">
              <div class="font-semibold text-white text-[14px] leading-tight line-clamp-2">{anime.name}</div> <!-- slightly smaller title -->
              <div class="flex items-center gap-2 mt-1">
                {#if anime.episodes?.sub}
                  <span class="flex items-center bg-green-200 text-black text-xs font-bold px-2 py-0.5 rounded">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 576 512"><path d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm80 120c13.3 0 24 10.7 24 24c0 13.3-10.7 24-24 24H112v16c0 22.1 17.9 40 40 40c13.3 0 24 10.7 24 24s-10.7 24-24 24c-48.6 0-88-39.4-88-88v-16c0-13.3 10.7-24 24-24h56zm176 24c0-13.3 10.7-24 24-24h56c13.3 0 24 10.7 24 24v16c0 48.6-39.4 88-88 88c-13.3 0-24-10.7-24-24s10.7-24 24-24c22.1 0 40-17.9 40-40v-16h-16c-13.3 0-24-10.7-24-24z"/></svg>
                    {anime.episodes.sub}
                  </span>
                {/if}
                {#if anime.episodes?.dub}
                  <span class="flex items-center bg-blue-200 text-black text-xs font-bold px-2 py-0.5 rounded">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 352 512"><path d="M176 352c53 0 96-43 96-96V112c0-53-43-96-96-96s-96 43-96 96v144c0 53 43 96 96 96zm128-96c0 70.7-57.3 128-128 128S48 326.7 48 256H0c0 91.9 70.7 167.6 160 175.2V464h-48c-13.3 0-24 10.7-24 24s10.7 24 24 24H240c13.3 0 24-10.7 24-24s-10.7-24-24-24h-48v-32.8C281.3 423.6 352 347.9 352 256h-48z"/></svg>
                    {anime.episodes.dub}
                  </span>
                {/if}
                <span class="text-xs text-gray-300">{anime.type}</span>
              </div>
            </div>
          </a>
        {/each}
        <a href="/recently-completed" class="block text-left text-orange-300 hover:text-orange-400 font-semibold mt-2 transition">View more &gt;</a>
      </div>
    </div>
  </div>
</section>