<script lang="ts">
  import Navbar from '$lib/components/hanime/Navbar.svelte';
  import Footer from '$lib/components/hanime/Footer.svelte';
  import Player from '$lib/components/hanime/watch/Player.svelte';

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
  $: videoSrc = sources.find(s => s.format === 'mp4')?.src || sources[0]?.src || '';
  $: videoFormat = sources.find(s => s.format === 'mp4') ? 'mp4' : sources[0]?.format || '';
</script>

<Navbar />

<div class="flex flex-col min-h-screen bg-gradient-to-b from-[#2a0008] via-[#3a0d16] to-[#1a0106] text-white pt-16">
  <div class="flex-1 w-full">
    <div class="max-w-3xl mx-auto flex flex-col gap-6 px-2 sm:px-6 py-8">
      {#if info && watch}
        <!-- Player Section -->
        <div class="w-full bg-[#1a0106]/80 rounded-xl shadow-xl border border-[#ff003c]/20 p-2 sm:p-4 flex flex-col gap-4">
          <h1 class="text-xl sm:text-2xl font-extrabold text-[#ff003c] mb-2 text-center">{title}</h1>
          {#if videoSrc && videoFormat === 'mp4'}
            <Player src={videoSrc} poster={poster} />
          {:else if sources.find(s => s.format === 'iframe')}
            <div class="w-full aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
              <iframe
                src={sources.find(s => s.format === 'iframe')?.src}
                allowfullscreen
                allow="autoplay; fullscreen"
                class="w-full h-full border-0"
                style="min-height:300px"
                title="Video Player"
              ></iframe>
            </div>
          {:else}
            <div class="text-[#ff003c] font-bold text-center py-8">No video source available.</div>
          {/if}
        </div>

        <!-- Info Section -->
        <div class="flex flex-col sm:flex-row gap-6 bg-[#1a0106]/70 rounded-xl shadow border border-[#ff003c]/10 p-4">
          <img
            src={poster}
            alt={title}
            class="rounded-lg shadow w-full sm:w-40 h-auto object-cover border-2 border-[#3a0d16] mb-4 sm:mb-0"
            loading="lazy"
          />
          <div class="flex-1 flex flex-col gap-2">
            <div class="flex flex-wrap gap-2 text-xs text-[#ffb3c6]">
              {#if releaseDate}
                <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Release: {releaseDate}</span>
              {/if}
              {#if brand}
                <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Brand: {brand}</span>
              {/if}
              {#if type}
                <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Type: {type}</span>
              {/if}
              {#if altTitle}
                <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Alt: {altTitle}</span>
              {/if}
              {#if views}
                <span class="bg-[#ff003c]/10 px-2 py-1 rounded">{views}</span>
              {/if}
            </div>
            {#if genres.length}
              <div class="flex flex-wrap gap-2 mt-2">
                {#each genres as genre}
                  <span class="bg-[#ff003c]/20 text-[#ff003c] px-3 py-1 rounded-full text-xs font-semibold">{genre}</span>
                {/each}
              </div>
            {/if}
            <div class="mt-2">
              <h2 class="text-base font-bold text-[#ff003c] mb-1">Description</h2>
              <p class="text-[#ffb3c6] text-sm">{description}</p>
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center text-[#ff003c] py-16">Video not found or failed to load.</div>
      {/if}
    </div>
  </div>
  <Footer />
</div>