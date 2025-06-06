<script lang="ts">
  type Server = {
    serverId: number;
    serverName: string;
    category: 'sub' | 'dub' | 'raw';
  };
  export let servers: Server[] = [];
  export let currentServer: string = '';
  export let category: 'sub' | 'dub' | 'raw' = 'sub';
  export let changeServerManual: (name: string) => void;
  const categories: Array<'sub' | 'dub'> = ['sub', 'dub'];
</script>

<div class="flex flex-col md:flex-row md:items-center gap-4">
  {#each categories as cat}
    {#if servers.some(s => s.category === cat)}
      <div class="flex gap-2 items-center mb-2">
        <span class="font-semibold text-orange-400 text-sm flex items-center gap-1">
          {cat === 'sub' ? 'Sub:' : 'Dub:'}
        </span>
        <div class="flex gap-2">
          {#each servers.filter(s => s.category === cat) as server}
            <button
              on:click={() => { category = cat; changeServerManual(server.serverName); }}
              class={`rounded-md bg-white/10 px-4 py-1.5 text-xs font-medium uppercase transition
                ${currentServer === server.serverName && category === cat
                  ? 'bg-orange-400 text-black'
                  : 'text-white hover:bg-orange-400 hover:text-black'}`}
              disabled={currentServer === server.serverName && category === cat}
            >
              {server.serverName}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  {/each}
</div>