import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

export const GET: RequestHandler = async ({ url }) => {
  const animeEpisodeId = url.searchParams.get('animeEpisodeId');
  const server = url.searchParams.get('server');
  const category = url.searchParams.get('category');

  if (!animeEpisodeId) {
    return new Response(JSON.stringify({ success: false, error: 'animeEpisodeId is required' }), { status: 400 });
  }

  // Build query string safely
  const params = new URLSearchParams();
  params.append('animeEpisodeId', animeEpisodeId);
  if (server) params.append('server', server);
  if (category) params.append('category', category);

  let resp: Response;
  let json: any;

  try {
    resp = await fetch(`${API_URL}/api/v2/hianime/episode/sources?${params.toString()}`);
    json = await resp.json();
  } catch (err: any) {
    // Log CORS or network errors
    console.error('Proxy fetch failed:', err);
    if (err instanceof TypeError && err.message?.includes('Failed to fetch')) {
      console.error('Possible CORS/network error when fetching:', `${API_URL}/api/v2/hianime/episode/sources?${params.toString()}`);
    }
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch from upstream API', details: err?.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // No proxy rewrite here, just return the original API response
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};