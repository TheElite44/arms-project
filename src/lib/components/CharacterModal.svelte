<script lang="ts">
  import CharacterVoiceActorRow from './CharacterVoiceActorRow.svelte';
  export let charactersVoiceActors: any[] = [];
  export let onClose: () => void;
  export let handleBackdrop: (event: MouseEvent) => void;
</script>

{#if charactersVoiceActors && charactersVoiceActors.length}
  <div
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    tabindex="0"
    on:click={handleBackdrop}
    on:keydown={(e) => { if (e.key === 'Escape') onClose(); }}
  >
    <div class="relative bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
      <button
        on:click={onClose}
        class="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors p-2"
        aria-label="Close modal"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      <h2 class="text-xl font-bold text-orange-400 mb-4">All Characters & Voice Actors</h2>
      <div class="flex flex-col gap-3">
        {#each charactersVoiceActors as cva}
          <CharacterVoiceActorRow {cva} />
        {/each}
      </div>
    </div>
  </div>
{/if}