import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

export const GET: RequestHandler = async () => {
  try {
    const resp = await fetch(`${API_URL}/api/v2/hianime/home`);
    if (!resp.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch anime home data' }), { status: resp.status });
    }
    const data = await resp.json();
    return new Response(JSON.stringify({ success: true, data: data.data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
};