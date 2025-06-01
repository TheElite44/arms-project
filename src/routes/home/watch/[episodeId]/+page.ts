import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const episodeId = params.episodeId;
  const animeId = episodeId.split('?')[0];
  
  if (!animeId) {
    return { error: 'Invalid anime ID', anime: null, episodes: [] };
  }

  try {
    const [animeInfoRes, episodesRes] = await Promise.all([
      fetch(`/api/anime?action=info&animeId=${animeId}`),
      fetch(`/api/anime?action=episodes&animeId=${animeId}`)
    ]);

    const [animeInfo, episodesData] = await Promise.all([
      animeInfoRes.json(),
      episodesRes.json()
    ]);

    return {
      episodeId,
      anime: animeInfo.success ? animeInfo.data.anime : null,
      episodes: episodesData.success ? episodesData.data.episodes : [],
      relatedAnimes: animeInfo.data?.relatedAnimes || [],
      recommendedAnimes: animeInfo.data?.recommendedAnimes || []
    };
  } catch (error) {
    return {
      error: 'Failed to load data',
      anime: null,
      episodes: [],
      relatedAnimes: [],
      recommendedAnimes: []
    };
  }
};