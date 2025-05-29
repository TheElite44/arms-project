import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

export const GET: RequestHandler = async ({ url }) => {
  const date = url.searchParams.get('date');
  if (!date) {
    return new Response(JSON.stringify({ success: false, error: 'Date parameter is required' }), { status: 400 });
  }

  try {
    const resp = await fetch(`${API_URL}/api/v2/hianime/schedule?date=${date}`);
    if (!resp.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch schedule data' }), { status: resp.status });
    }

    const data = await resp.json();
    return new Response(JSON.stringify({ success: true, data: data.data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
};