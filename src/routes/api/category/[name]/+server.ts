import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

export const GET: RequestHandler = async ({ params, url }) => {
  const category = params.name; // Extract category from path parameters
  const page = url.searchParams.get('page') || '1'; // Extract page from query parameters, default to 1

  if (!category) {
    return new Response(
      JSON.stringify({ success: false, error: 'Category is required' }),
      { status: 400 }
    );
  }

  try {
    const resp = await fetch(`${API_URL}/api/v2/hianime/category/${category}?page=${page}`);
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch category data' }),
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return new Response(JSON.stringify({ success: true, data: data.data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500 }
    );
  }
};