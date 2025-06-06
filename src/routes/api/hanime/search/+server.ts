import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_HANIME_API || '';

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('query');
  const page = url.searchParams.get('page') || '1';

  if (!query) {
    return new Response(JSON.stringify({ status: 'error', error: 'Missing query parameter' }), { status: 400 });
  }

  try {
    const apiUrl = `${API_URL}/api/hen/hentaitv/search/${encodeURIComponent(query)}/${encodeURIComponent(page)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ status: 'error', error: 'Failed to fetch search data' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Unexpected error in hanime search API:', error);
    return new Response(
      JSON.stringify({ status: 'error', error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};