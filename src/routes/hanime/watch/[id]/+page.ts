import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const id = params.id;
  if (!id) {
    return { info: null, watch: null };
  }

  // Fetch info for description/poster
  const infoRes = await fetch(`/api/hanime/info?id=${encodeURIComponent(id)}`);
  const infoData = infoRes.ok ? await infoRes.json() : null;

  // Fetch watch sources
  const watchRes = await fetch(`/api/hanime/watch?id=${encodeURIComponent(id)}`);
  const watchData = watchRes.ok ? await watchRes.json() : null;

  return {
    info: infoData?.data ?? null,
    watch: watchData?.data ?? null
  };
};