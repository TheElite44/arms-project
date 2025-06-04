<script lang="ts">
  import Navbar from '$lib/components/hanime/Navbar.svelte';
  import Footer from '$lib/components/hanime/Footer.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  export let data: any;

  $: info = data?.info?.results;
  $: related = info?.related ?? [];

  let loading = false;

  async function handleRelatedClick(id: string) {
    loading = true;
    try {
      await goto(`/hanime/info/${id}`);
    } finally {
      loading = false;
    }
  }
</script>

<Navbar />

<div class="flex flex-col min-h-screen bg-gradient-to-b from-[#2a0008] via-[#3a0d16] to-[#1a0106] text-white pt-16">
  {#if loading}
    <div class="flex items-center justify-center flex-1">
      <span class="loader-adult"></span>
    </div>
  {:else}
    <div class="flex-1 w-full">
      <div class="max-w-5xl mx-auto flex flex-col gap-8 px-2 sm:px-6 py-8">
        {#if info}
          <div class="flex flex-col md:flex-row gap-8 bg-gradient-to-br from-[#2a0008] via-[#3a0d16] to-[#1a0106] rounded-lg shadow-2xl p-6 md:p-10">
            <!-- Poster -->
            <div class="flex-shrink-0 mx-auto md:mx-0">
              <img
                src={info.poster}
                alt={info.name}
                class="rounded-lg shadow-2xl w-56 h-auto object-cover border-4 border-[#3a0d16]"
              />
            </div>
            <!-- Details -->
            <div class="flex-1 flex flex-col gap-4">
              <h1 class="text-2xl sm:text-3xl font-extrabold text-[#ff003c] mb-1">{info.name}</h1>
              <div class="flex flex-wrap gap-2 mb-2">
                {#each info.genre as genre}
                  <span class="bg-[#ff003c]/20 text-[#ff003c] px-3 py-1 rounded-full text-xs font-semibold">{genre}</span>
                {/each}
                {#if info.type}
                  <span class="bg-[#ff003c] text-white px-3 py-1 rounded-full text-xs font-bold uppercase">{info.type}</span>
                {/if}
              </div>
              <p class="text-[#ffb3c6] text-base mb-2">{info.description}</p>
              <div class="flex flex-wrap gap-2 text-xs text-[#ffb3c6]">
                {#if info.releaseDate}
                  <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Release: {info.releaseDate}</span>
                {/if}
                {#if info.uploadDate}
                  <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Uploaded: {info.uploadDate}</span>
                {/if}
                {#if info.brandName}
                  <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Brand: {info.brandName}</span>
                {/if}
                {#if info.altTitle}
                  <span class="bg-[#ff003c]/10 px-2 py-1 rounded">Alt: {info.altTitle}</span>
                {/if}
                {#if info.views}
                  <span class="bg-[#ff003c]/10 px-2 py-1 rounded">{info.views}</span>
                {/if}
              </div>

              <!-- Add the Watch button here -->
              <a
                href={`/hanime/watch/${info.id}`}
                class="mt-4 inline-block bg-[#ff003c] hover:bg-[#c2002e] text-white font-bold px-6 py-2 rounded-lg shadow transition-all duration-200 text-center w-full sm:w-auto"
              >
                ▶️ Watch Now
              </a>
            </div>
          </div>

          <!-- Related Section -->
          {#if related.length}
            <section class="mt-8">
              <h2 class="text-xl font-bold text-[#ff003c] mb-4">Related Titles</h2>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {#each related as rel}
                  <a
                    href={`/hanime/info/${rel.id}`}
                    on:click|preventDefault={() => handleRelatedClick(rel.id)}
                    class="bg-gradient-to-br from-[#2a0008] via-[#3a0d16] to-[#1a0106] rounded-lg shadow-lg overflow-hidden block hover:scale-105 hover:shadow-[#ff003c]/40 transition-transform border-2 border-transparent hover:border-[#ff003c]"
                  >
                    <img src={rel.image} alt={rel.title} class="w-full h-32 object-cover rounded-t-lg" />
                    <div class="p-2">
                      <h3 class="font-bold text-xs mb-1 truncate text-[#ff003c]">{rel.title}</h3>
                      <span class="text-[#ffb3c6] text-xs">{rel.views} views</span>
                    </div>
                  </a>
                {/each}
              </div>
            </section>
          {/if}
        {:else}
          <div class="text-center text-[#ff003c]">Info not found or failed to load.</div>
        {/if}
      </div>
    </div>
  {/if}

  <Footer />
</div>

<style>
  .loader-adult {
    border: 6px solid #ff003c33;
    border-top: 6px solid #ff003c;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }
  @keyframes spin {
    0% { transform: rotate(0deg);}
    100% { transform: rotate(360deg);}
  }
</style>