import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const animeId = params.animeId;
  if (!animeId) {
    return { status: 400, error: 'Anime ID is required' };
  }

  // Fetch from your own API route, not directly from the external API
  const resp = await fetch(`/api/info?animeId=${animeId}`);
  const json = await resp.json();

  if (!json.success) {
    return { status: 404, error: json.error || 'Anime not found' };
  }

  return {
    anime: json.data.anime,
    moreInfo: json.data.moreInfo,
    mostPopularAnimes: json.data.mostPopularAnimes,
    recommendedAnimes: json.data.recommendedAnimes,
    relatedAnimes: json.data.relatedAnimes,
    seasons: json.data.seasons
  };
};