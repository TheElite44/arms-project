import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const id = params.id;
  if (!id) {
    return { info: null, watch: null, videoSrc: null };
  }

  // Fetch info for description/poster
  const infoRes = await fetch(`/api/hanime/info?id=${encodeURIComponent(id)}`);
  const infoData = infoRes.ok ? await infoRes.json() : null;

  // Fetch watch sources
  const watchRes = await fetch(`/api/hanime/watch?id=${encodeURIComponent(id)}`);
  const watchData = watchRes.ok ? await watchRes.json() : null;

  // Prioritize -sub.mp4, then fallback to raw .mp4
  let videoSrc: string | null = null;
  const sources = watchData?.data?.results?.sources ?? [];
  const subSource = sources.find((s: any) => s.format === 'mp4' && s.src.endsWith('-sub.mp4'));
  const rawSource = sources.find((s: any) => s.format === 'mp4' && s.src.endsWith('.mp4') && !s.src.endsWith('-sub.mp4'));

  if (subSource) {
    videoSrc = subSource.src;
  } else if (rawSource) {
    videoSrc = rawSource.src;
  }

  return {
    info: infoData?.data ?? null,
    watch: watchData?.data ?? null,
    videoSrc
  };
};