import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

export const GET: RequestHandler = async ({ url }) => {
  const animeEpisodeId = url.searchParams.get('animeEpisodeId');
  const server = url.searchParams.get('server') || 'hd-1';
  const category = url.searchParams.get('category') || 'sub';

  if (!animeEpisodeId) {
    return new Response(JSON.stringify({ success: false, error: 'animeEpisodeId is required' }), { status: 400 });
  }

  // Fetch servers
  const serversResp = await fetch(`${API_URL}/api/v2/hianime/episode/servers?animeEpisodeId=${animeEpisodeId}`);
  const serversJson = await serversResp.json();

  // Fetch sources
  const sourcesResp = await fetch(
    `${API_URL}/api/v2/hianime/episode/sources?animeEpisodeId=${encodeURIComponent(animeEpisodeId)}&server=${encodeURIComponent(server)}&category=${encodeURIComponent(category)}`
  );
  const sourcesJson = await sourcesResp.json();

  return new Response(
    JSON.stringify({
      success: true,
      servers: serversJson.data,
      sources: sourcesJson.data,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};