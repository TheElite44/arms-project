<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Player from '$lib/components/Player.svelte';
  import type { PageData } from './$types.js';
  export let data: PageData;

  // Current video and subtitle sources
  let videoSrc = data.videoSources?.[0]?.url;
  let subtitles = data.subtitles ?? [];
  let poster = data.poster ?? '';
  let title = 'Episode';

  // All episodes for selector (array of { number, title, episodeId })
  let episodes = data.episodes ?? [];
  let currentEpisodeId = data.episodeId;

  // When user selects a different episode, navigate to its page
  function goToEpisode(episodeId: string) {
    window.location.href = `/home/watch/${episodeId}`;
  }
</script>

<Navbar />

<div class="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white px-4 py-8 pt-16">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Watch Episode</h1>
    {#if videoSrc}
      <Player src={videoSrc} subtitles={subtitles} poster={poster} title={title} />
    {:else}
      <div class="text-center text-red-400">No video source found for this episode.</div>
    {/if}

    <!-- Episode Selector -->
    {#if episodes.length > 1}
      <div class="flex flex-wrap gap-2 mt-6">
        {#each episodes as ep}
          <button
            class="px-3 py-1 rounded bg-gray-800 hover:bg-orange-400 hover:text-gray-900 transition font-semibold
              {ep.episodeId === currentEpisodeId ? 'bg-orange-400 text-gray-900' : 'text-white'}"
            on:click={() => goToEpisode(ep.episodeId)}
            disabled={ep.episodeId === currentEpisodeId}
          >
            Ep {ep.number}{ep.title ? `: ${ep.title}` : ''}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>