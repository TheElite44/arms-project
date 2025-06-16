import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_HANIME_API || '';

export const GET: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ status: 'error', error: 'Missing id parameter' }), { status: 400 });
  }

  try {
    // Proxy to your backend API
    const resp = await fetch(`${API_URL}/api/hen/tv/watch/${encodeURIComponent(id)}`);
    if (!resp.ok) {
      return new Response(JSON.stringify({ status: 'error', error: 'Failed to fetch watch data' }), { status: resp.status });
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