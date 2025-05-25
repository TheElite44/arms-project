import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

export const GET: RequestHandler = async ({ url }) => {
  const animeEpisodeId = url.searchParams.get('animeEpisodeId');
  const server = url.searchParams.get('server') || 'hd-1';
  const category = url.searchParams.get('category') || 'sub';

  if (!animeEpisodeId) {
    return new Response(JSON.stringify({ success: false, error: 'animeEpisodeId is required' }), { status: 400 });
  }

  const apiUrl = `${API_URL}/api/v2/hianime/episode/sources?animeEpisodeId=${encodeURIComponent(animeEpisodeId)}&server=${encodeURIComponent(server)}&category=${encodeURIComponent(category)}`;
  const resp = await fetch(apiUrl);
  const json = await resp.json();

  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};