import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const episodeId = params.episodeId;
  // Remove any query params from episodeId (if present)
  const animeId = episodeId?.split('?')[0];

  if (!animeId) {
    console.error('Invalid animeId:', animeId);
    return {
      error: 'Invalid animeId',
      episodes: [],
      episodeId,
      anime: null,
      relatedAnimes: [],
      recommendedAnimes: []
    };
  }

  try {
    // Fetch anime info
    const animeInfoResp = await fetch(`/api/anime?action=info&animeId=${animeId}`);
    const animeInfoJson = await animeInfoResp.json();

    if (!animeInfoJson.success) {
      console.error('Failed to fetch anime info:', animeInfoJson.error);
      return {
        error: animeInfoJson.error || 'Anime data not found',
        episodes: [],
        episodeId,
        anime: null,
        relatedAnimes: [],
        recommendedAnimes: []
      };
    }

    // Fetch episodes
    const episodesResp = await fetch(`/api/anime?action=episodes&animeId=${animeId}`);
    const episodesJson = await episodesResp.json();

    if (!episodesJson.success) {
      console.error('Failed to fetch episodes:', episodesJson.error);
      return {
        error: episodesJson.error || 'Episodes data not found',
        episodes: [],
        episodeId,
        anime: animeInfoJson.data.anime,
        relatedAnimes: animeInfoJson.data.relatedAnimes || [],
        recommendedAnimes: animeInfoJson.data.recommendedAnimes || []
      };
    }

    return {
      episodeId,
      anime: animeInfoJson.data.anime,
      episodes: episodesJson.data.episodes || [],
      relatedAnimes: animeInfoJson.data.relatedAnimes || [],
      recommendedAnimes: animeInfoJson.data.recommendedAnimes || []
    };
  } catch (error) {
    console.error('Error loading page data:', error);
    return {
      error: 'Failed to load page data',
      episodes: [],
      episodeId,
      anime: null,
      relatedAnimes: [],
      recommendedAnimes: []
    };
  }
};
