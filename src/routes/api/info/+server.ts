import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

export const GET: RequestHandler = async ({ params, url }) => {
  const animeId = params.animeId || url.searchParams.get('animeId');
  console.log('Requested animeId:', animeId);

  if (!animeId) {
    console.log('No animeId provided');
    return new Response(JSON.stringify({ success: false, error: 'Anime ID is required' }), { status: 400 });
  }

  const resp = await fetch(`${API_URL}/api/v2/hianime/anime/${animeId}`);
  const json = await resp.json();

  console.log('API response:', JSON.stringify(json));

  let anime = null;
  if (json.success && json.data && json.data.anime) {
    if (Array.isArray(json.data.anime)) {
      anime = json.data.anime.length > 0 ? json.data.anime[0] : null;
    } else if (typeof json.data.anime === 'object') {
      anime = json.data.anime;
    }
  }

  if (!anime) {
    console.log('Anime not found or invalid response');
    return new Response(JSON.stringify({ success: false, error: json.error || 'Anime not found' }), { status: 404 });
  }

  console.log('Returning anime:', JSON.stringify(anime));

  return new Response(JSON.stringify({
    success: true,
    data: {
      anime,
      mostPopularAnimes: json.data.mostPopularAnimes ?? [],
      recommendedAnimes: json.data.recommendedAnimes ?? [],
      relatedAnimes: json.data.relatedAnimes ?? [],
      seasons: json.data.seasons ?? []
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};