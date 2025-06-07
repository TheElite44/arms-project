import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const episodeId = params.episodeId;
  const animeId = episodeId.split('?')[0];

  if (!animeId) {
    console.error('Invalid animeId:', animeId);
    return {
      error: 'Invalid animeId',
      videoSources: [],
      subtitles: [],
      episodes: [],
      episodeId,
      anime: null,
      relatedAnimes: [],
      recommendedAnimes: []
    };
  }

  try {
    const animeInfoResp = await fetch(`/api/anime?action=info&animeId=${animeId}`);
    console.log('animeInfoResp status:', animeInfoResp.status);
    const animeInfoJson = await animeInfoResp.json();
    console.log('animeInfoJson:', animeInfoJson);

    if (!animeInfoJson.success) {
      console.error('Failed to fetch anime info:', animeInfoJson.error);
      throw new Error(animeInfoJson.error || 'Anime data not found');
    }

    // Extract subtitles from animeInfoJson or another API if available
    const subtitles = animeInfoJson.data?.subtitles || [];

    const episodesResp = await fetch(`/api/anime?action=episodes&animeId=${animeId}`);
    console.log('episodesResp status:', episodesResp.status);
    const episodesJson = await episodesResp.json();
    console.log('episodesJson:', episodesJson);

    if (!episodesJson.success) {
      console.error('Failed to fetch episodes:', episodesJson.error);
      throw new Error(episodesJson.error || 'Episodes data not found');
    }

    return {
      episodeId,
      anime: animeInfoJson.data.anime,
      episodes: episodesJson.data.episodes || [],
      relatedAnimes: animeInfoJson.data.relatedAnimes || [],
      recommendedAnimes: animeInfoJson.data.recommendedAnimes || [],
      videoSources: [], // fill this if you have sources
      subtitles // <-- pass subtitles to the page
    };
  } catch (error) {
    console.error('Error loading page data:', error);
    return {
      error: 'Failed to load page data',
      videoSources: [],
      subtitles: [],
      episodes: [],
      episodeId,
      anime: null,
      relatedAnimes: [],
      recommendedAnimes: []
    };
  }
};