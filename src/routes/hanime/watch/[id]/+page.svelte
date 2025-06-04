<script lang="ts">
  import Navbar from '$lib/components/hanime/Navbar.svelte';
  import Footer from '$lib/components/hanime/Footer.svelte';
  import PlayerCard from '$lib/components/hanime/watch/PlayerCard.svelte';

  export let data;

  $: info = data?.info?.results;
  $: watch = data?.watch?.results;

  $: poster = info?.poster ?? '';
  $: description = info?.description ?? '';
  $: title = info?.name ?? '';
  $: genres = info?.genre ?? [];
  $: type = info?.type ?? '';
  $: brand = info?.brandName ?? '';
  $: views = info?.views ?? '';
  $: releaseDate = info?.releaseDate ?? '';
  $: altTitle = info?.altTitle ?? '';

  $: sources = watch?.sources ?? [];
  $: videoSrc = sources.find((s: any) => s.format === 'mp4')?.src || sources[0]?.src || '';
  $: videoFormat = sources.find((s: any) => s.format === 'mp4') ? 'mp4' : sources[0]?.format || '';

  function goToEpisode(id: string) {
    // your navigation logic here
  }
</script>

<Navbar />

<div class="min-h-screen bg-gradient-to-br from-[#1a0106] via-[#2a0008] to-[#3a0d16] text-white flex flex-col relative overflow-x-hidden">
  <!-- Decorative Background -->
  <div class="pointer-events-none fixed inset-0 z-0">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(255,0,60,0.08),transparent_70%)]"></div>
    <div class="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,0,60,0.04)_25%,transparent_25%,transparent_75%,rgba(255,0,60,0.04)_75%)] bg-[length:32px_32px]"></div>
  </div>

  <main class="relative z-10 flex-1 w-full pt-20 pb-12">
    <div class="max-w-5xl mx-auto px-4 sm:px-8 flex flex-col gap-10">
      {#if info && watch}
        <!-- Video Player Card -->
        <section class="bg-[#1a0106]/90 rounded-2xl shadow-2xl border border-[#ff003c]/20 p-0 sm:p-6 mb-8">
          <div class="relative overflow-hidden rounded-xl border border-[#ff003c]/30 shadow-lg">
            <PlayerCard videoSrc={videoSrc} poster={poster} goToEpisode={goToEpisode} />
            <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
          </div>
        </section>

        <!-- Poster, Title, and Description (copied and adapted layout) -->
        <section class="flex flex-col md:flex-row gap-8 bg-gradient-to-br from-[#1a0106] via-[#2a0008] to-[#3a0d16] rounded-lg shadow-2xl p-6 md:p-10">
          <div class="flex-shrink-0 mx-auto md:mx-0">
            <img
              src={poster}
              alt={title}
              class="rounded-2xl shadow-2xl w-52 sm:w-64 h-auto object-cover border-4 border-[#ff003c]/30 mx-auto md:mx-0"
            />
          </div>
          <div class="flex-1 flex flex-col gap-4">
            <h1 class="text-3xl sm:text-4xl font-extrabold text-[#ff003c] mb-1">{title}</h1>
            {#if altTitle}
              <div class="text-[#ffb3c6]/80 text-lg font-medium mb-2 italic">{altTitle}</div>
            {/if}
            {#if genres.length}
              <div class="flex flex-wrap gap-2 mb-2">
                {#each genres as genre}
                  <span class="bg-[#ff003c]/20 text-[#ff003c] px-3 py-1 rounded-full text-xs font-semibold">{genre}</span>
                {/each}
              </div>
            {/if}
            <p class="text-[#ffb3c6] text-base mb-2">{description}</p>
            <div class="flex flex-wrap gap-2 mb-2">
              {#if releaseDate}
                <span class="bg-[#ff003c]/10 px-2 py-1 rounded text-xs">Release: {releaseDate}</span>
              {/if}
              {#if brand}
                <span class="bg-[#ff003c]/10 px-2 py-1 rounded text-xs">Brand: {brand}</span>
              {/if}
              {#if type}
                <span class="bg-[#ff003c]/10 px-2 py-1 rounded text-xs">Type: {type}</span>
              {/if}
              {#if views}
                <span class="bg-[#ff003c]/10 px-2 py-1 rounded text-xs">{views}</span>
              {/if}
            </div>
          </div>
        </section>

      {:else}
        <!-- Error State -->
        <section class="flex flex-col items-center justify-center py-24">
          <div class="relative mb-6">
            <div class="absolute -inset-1 bg-gradient-to-r from-[#ff003c] to-[#ff4d79] rounded-full blur opacity-20"></div>
            <div class="relative bg-[#2a0008]/80 backdrop-blur-sm rounded-full p-8 border border-[#ff003c]/30 inline-block">
              <svg class="w-16 h-16 text-[#ff003c] mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
          <h2 class="text-2xl font-bold text-[#ff003c] mt-6 mb-2">Video Not Found</h2>
          <p class="text-[#ffb3c6]/80">The requested video could not be loaded or does not exist.</p>
        </section>
      {/if}
    </div>
  </main>
  <Footer />
</div>