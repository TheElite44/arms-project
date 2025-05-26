import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const episodeId = params.episodeId;

  // 1. Fetch combined servers and sources
  const watchResp = await fetch(`/api/episode/watch?animeEpisodeId=${episodeId}`);
  const watchJson = await watchResp.json();

  if (!watchJson.success) {
    return { error: 'Episode data not found', videoSources: [], subtitles: [], episodes: [], episodeId, anime: null, relatedAnimes: [], recommendedAnimes: [] };
  }

  // 2. Get all episodes for the anime (need animeId)
  const animeId = episodeId.split('?')[0];
  const episodesResp = await fetch(`/api/episodes?animeId=${animeId}`);
  const episodesJson = await episodesResp.json();
  let episodes = [];
  if (episodesJson.success && episodesJson.data.episodes) {
    episodes = episodesJson.data.episodes.map((ep: any) => ({
      number: ep.number,
      title: ep.title,
      episodeId: ep.episodeId
    }));
  }

  // 3. Fetch anime info using your /api/info endpoint
  const animeInfoResp = await fetch(`/api/info?animeId=${animeId}`);
  const animeInfoJson = await animeInfoResp.json();

  return {
    episodeId,
    servers: watchJson.servers,
    sources: watchJson.sources,
    subtitles: watchJson.sources?.subtitles ?? [],
    episodes,
    poster: animeInfoJson?.data?.anime?.poster ?? '',
    anime: animeInfoJson?.data?.anime ?? null,
    relatedAnimes: animeInfoJson?.data?.relatedAnimes ?? [],
    recommendedAnimes: animeInfoJson?.data?.recommendedAnimes ?? [],
    category: 'sub'
  };
};