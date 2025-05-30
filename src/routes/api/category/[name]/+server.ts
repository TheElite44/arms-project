import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

export const GET: RequestHandler = async ({ params, url }) => {
  const category = params.name; // Extract category from path parameters
  const page = url.searchParams.get('page') || '1'; // Extract page from query parameters, default to 1

  if (!category) {
    return new Response(
      JSON.stringify({ success: false, error: 'Category is required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (!API_URL) {
    console.error('VITE_ANIME_API environment variable is not set');
    return new Response(
      JSON.stringify({ success: false, error: 'API configuration error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const apiUrl = `${API_URL}/api/v2/hianime/category/${encodeURIComponent(category)}?page=${page}`;
    console.log('Fetching from:', apiUrl); // Debug log
    
    const resp = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('API Error:', resp.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch category data: ${resp.status} ${resp.statusText}` 
        }),
        { 
          status: resp.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await resp.json();
    
    // Validate the response structure
    if (!data || !data.data) {
      console.error('Invalid API response structure:', data);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid API response format' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: data.data }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching category data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};