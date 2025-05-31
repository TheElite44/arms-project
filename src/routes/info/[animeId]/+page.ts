import type { PageLoad } from './$types.js';

// Add dynamic flag to ensure data is refetched when params change
export const load: PageLoad = async ({ params, fetch }) => {
  const animeId = params.animeId;
  if (!animeId) {
    return { status: 400, error: 'Anime ID is required' };
  }

  try {
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
  } catch (error) {
    console.error('Error loading anime:', error);
    return {
      status: 500,
      error: 'Failed to load anime information'
    };
  }
};

// Add this line to ensure the page is treated as dynamic
export const ssr = true;
export const csr = true;