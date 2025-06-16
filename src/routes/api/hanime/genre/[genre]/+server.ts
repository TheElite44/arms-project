import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_HANIME_API || '';

export const GET: RequestHandler = async ({ params, url }) => {
  const genre = params.genre;
  const page = url.searchParams.get('page') || '1';

  if (!genre) {
    return new Response(JSON.stringify({ status: 'error', error: 'Missing genre parameter' }), { status: 400 });
  }

  try {
    const resp = await fetch(`${API_URL}/api/hen/tv/genre/${encodeURIComponent(genre)}/${encodeURIComponent(page)}`);
    if (!resp.ok) {
      return new Response(JSON.stringify({ status: 'error', error: 'Failed to fetch genre data' }), { status: resp.status });
    }
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: 'error', error: 'Internal server error' }), { status: 500 });
  }
};