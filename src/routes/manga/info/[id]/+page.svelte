<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types.js';

  export let data: PageData;

  $: manga = data.manga;
  $: recommendations = data.recommendations ?? [];
  $: relations = data.relations ?? [];
  $: characters = data.characters ?? [];
  $: chapters = data.chapters ?? [];
  let loading = false;

  async function handleMangaClick(id: string) {
    loading = true;
    try {
      await goto(`/manga/info/${id}`);
    } finally {
      loading = false;
    }
  }
</script>

<Navbar />

<div class="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white pt-16">
  {#if loading}
    <div class="flex items-center justify-center flex-1">
      <img
        src="/assets/loader.gif"
        alt="Loading..."
        class="object-contain w-24 h-24"
      />
    </div>
  {:else}
    <div class="flex-1 w-full">
      <div class="max-w-[125rem] mx-auto flex flex-col gap-6 sm:gap-10 px-2 sm:px-6">
        {#if manga}
          <div class="flex flex-col gap-6 sm:gap-10 w-full">
            <!-- Main content -->
            <div class="flex-1 flex flex-col gap-6 sm:gap-10">
              <!-- Main Info Card -->
              <section class="flex-1 flex flex-col gap-8 mb-12">
                <div class="flex flex-col md:flex-row gap-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-2xl p-6 md:p-10">
                  <!-- Poster -->
                  <div class="flex-shrink-0 mx-auto md:mx-0">
                    <img
                      src={manga.image}
                      alt={manga.title?.english || manga.title?.romaji || manga.title?.native}
                      class="rounded-lg shadow-2xl w-64 h-auto object-cover border-4 border-gray-800"
                    />
                  </div>
                  <!-- Details -->
                  <div class="flex-1 flex flex-col gap-4">
                    <h1 class="text-3xl sm:text-4xl font-extrabold text-orange-400 mb-1">
                      {manga.title?.english || manga.title?.romaji || manga.title?.native}
                    </h1>
                    {#if manga.genres}
                      <div class="flex flex-wrap gap-2 mb-2">
                        {#each manga.genres as genre}
                          <span class="bg-gray-800 text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">{genre}</span>
                        {/each}
                      </div>
                    {/if}
                    <p class="text-gray-200 text-base mb-2">{@html manga.description}</p>
                    <div class="flex flex-wrap gap-2 mb-2">
                      <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">{manga.status}</span>
                      {#if manga.releaseDate}
                        <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-xs">Year: {manga.releaseDate}</span>
                      {/if}
                      {#if manga.rating}
                        <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-xs">Rating: {manga.rating}</span>
                      {/if}
                      {#if manga.popularity}
                        <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-xs">Popularity: {manga.popularity}</span>
                      {/if}
                      {#if manga.type}
                        <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-xs">{manga.type}</span>
                      {/if}
                    </div>
                  </div>
                </div>

                <!-- Chapters -->
                {#if chapters.length}
                  <section class="mb-12">
                    <h2 class="text-2xl font-bold text-orange-400 mb-4">Chapters</h2>
                    <ul class="divide-y divide-gray-800 rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                      {#each chapters as chapter}
                        <li class="flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition">
                          <div>
                            <span class="font-semibold text-orange-300">{chapter.title}</span>
                            {#if chapter.releasedDate}
                              <span class="ml-2 text-xs text-gray-400">({chapter.releasedDate})</span>
                            {/if}
                          </div>
                          <a
                            href={`/manga/read/${manga.id}/${chapter.id.split('/')[0]}/${chapter.id.split('/')[1]}`}
                            class="bg-orange-400 hover:bg-orange-500 text-gray-900 font-bold px-4 py-1 rounded-lg shadow transition text-sm"
                          >
                            Read
                          </a>
                        </li>
                      {/each}
                    </ul>
                  </section>
                {:else}
                  <div class="text-gray-400">No chapters found.</div>
                {/if}

                <!-- Recommendations -->
                {#if recommendations.length}
                  <section class="mb-12">
                    <h2 class="text-2xl font-bold text-orange-400 mb-4">Recommended Manga</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {#each recommendations as rec}
                        <a 
                          href={`/manga/info/${rec.id}`} 
                          on:click|preventDefault={() => handleMangaClick(rec.id)}
                          class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden block hover:scale-105 hover:shadow-orange-400/40 transition-transform border-2 border-transparent hover:border-orange-400"
                        >
                          <img src={rec.image} alt={rec.title?.english || rec.title?.romaji || rec.title?.native} class="w-full h-40 object-cover rounded-lg" />
                          <div class="p-3">
                            <h3 class="font-bold text-base mb-1 truncate">{rec.title?.english || rec.title?.romaji || rec.title?.native}</h3>
                            <div class="flex flex-wrap gap-1 mb-1">
                              <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">{rec.type}</span>
                              {#if rec.rating}
                                <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-xs">Rating: {rec.rating}</span>
                              {/if}
                            </div>
                          </div>
                        </a>
                      {/each}
                    </div>
                  </section>
                {/if}

                <!-- Relations -->
                {#if relations.length}
                  <section class="mb-12">
                    <h2 class="text-2xl font-bold text-orange-400 mb-4">Related Works</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {#each relations as rel}
                        <div class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden block border-2 border-transparent hover:border-orange-400">
                          <img src={rel.image} alt={rel.title?.english || rel.title?.romaji || rel.title?.native} class="w-full h-40 object-cover rounded-lg" />
                          <div class="p-3">
                            <h3 class="font-bold text-base mb-1 truncate">{rel.title?.english || rel.title?.romaji || rel.title?.native}</h3>
                            <div class="flex flex-wrap gap-1 mb-1">
                              <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">{rel.type}</span>
                              {#if rel.rating}
                                <span class="bg-gray-900 text-orange-300 px-2 py-0.5 rounded-full text-xs">Rating: {rel.rating}</span>
                              {/if}
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </section>
                {/if}

                <!-- Characters -->
                {#if characters.length}
                  <section>
                    <h2 class="text-2xl font-bold text-orange-400 mb-4">Characters</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {#each characters as char}
                        <div class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden block border-2 border-transparent hover:border-orange-400">
                          <img src={char.image} alt={char.name?.full || char.name?.native} class="w-full h-40 object-cover rounded-lg" />
                          <div class="p-3">
                            <h3 class="font-bold text-base mb-1 truncate">{char.name?.full || char.name?.native}</h3>
                            <div class="flex flex-wrap gap-1 mb-1">
                              <span class="bg-orange-400 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold">{char.role}</span>
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </section>
                {/if}
              </section>
            </div>
          </div>
        {:else}
          <div class="text-center text-red-400">Manga not found or failed to load.</div>
        {/if}
      </div>
    </div>
  {/if}

  <Footer />
</div>

<style>
  @media (max-width: 768px) {
    .flex-shrink-0 {
      margin-left: auto;
      margin-right: auto;
    }
  }
</style>