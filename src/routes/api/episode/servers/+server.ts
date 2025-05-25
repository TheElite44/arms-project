import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

export const GET: RequestHandler = async ({ url }) => {
  const animeEpisodeId = url.searchParams.get('animeEpisodeId');
  if (!animeEpisodeId) {
    return new Response(JSON.stringify({ success: false, error: 'animeEpisodeId is required' }), { status: 400 });
  }
  const resp = await fetch(`${API_URL}/api/v2/hianime/episode/servers?animeEpisodeId=${animeEpisodeId}`);
  const json = await resp.json();
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};