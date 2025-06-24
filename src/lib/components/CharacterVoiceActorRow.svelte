<script lang="ts">
  export let cva: {
    character: { poster: string; name: string; cast?: string };
    voiceActor: { poster: string; name: string; cast?: string };
  };
</script>

<div class="flex items-center gap-4 bg-gray-800 rounded-md p-3">
  <div class="flex items-center gap-3 flex-1">
    <img src={cva.character.poster} alt={cva.character.name} class="w-10 h-10 rounded-full object-cover border-2 border-orange-400" />
    <div>
      <div class="text-sm font-bold text-orange-200">{cva.character.name}</div>
      <div class="text-xs text-blue-300">{cva.character.cast}</div>
    </div>
  </div>
  <div class="flex items-center gap-3 flex-1">
    <img src={cva.voiceActor.poster} alt={cva.voiceActor.name} class="w-10 h-10 rounded-full object-cover border border-gray-500" />
    <div>
      <div class="text-sm text-white">{cva.voiceActor.name}</div>
      <div class="text-xs text-gray-400">{cva.voiceActor.cast}</div>
    </div>
  </div>
</div>