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

  let videoSrc: string | null = null;
  const sources = watchData?.data?.results?.sources ?? [];

  // Try to extract episode number from id (e.g., hatsukoi-jikan-episode-6 -> 6)
  const epMatch = id.match(/(?:episode-)?(\d+)$/i);
  const epNum = epMatch ? epMatch[1] : null;

  // Prefer mp4 with episode number in filename, then -sub.mp4, then any mp4
  const epMp4 = epNum
    ? sources.find(
        (s: any) =>
          s.format === 'mp4' &&
          s.src.match(new RegExp(`[\\.-]${epNum}\\.mp4$`, 'i'))
      )
    : null;

  const subSource = sources.find((s: any) => s.format === 'mp4' && s.src.endsWith('-sub.mp4'));
  const rawSource = sources.find((s: any) => s.format === 'mp4' && s.src.endsWith('.mp4') && !s.src.endsWith('-sub.mp4'));

  const srtSource = sources.find((s: any) => s.format === 'srt');
  const srtUrl = srtSource ? srtSource.src : null;

  if (epMp4) {
    videoSrc = epMp4.src;
  } else if (subSource) {
    videoSrc = subSource.src;
  } else if (rawSource) {
    videoSrc = rawSource.src;
  }

  return {
    info: infoData?.data ?? null,
    watch: watchData?.data ?? null,
    videoSrc,
    srtUrl
  };
};