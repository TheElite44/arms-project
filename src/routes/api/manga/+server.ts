import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_CONSUMET_API || '';

export const GET: RequestHandler = async ({ url }) => {
  const type = url.searchParams.get('type'); // 'search', 'info', or 'read'
  // Force provider to 'mangadex'
  const provider = 'mangadex';

  try {
    if (type === 'search') {
      const query = url.searchParams.get('q');
      const page = url.searchParams.get('page') || '1';
      if (!query) {
        return new Response(JSON.stringify({ success: false, error: 'Missing search query' }), { status: 400 });
      }
      // Always include provider and page in the search
      const apiUrl = `${API_URL}/meta/anilist-manga/${encodeURIComponent(query)}?page=${page}&provider=${provider}`;
      const resp = await fetch(apiUrl);
      const data = await resp.json();
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    if (type === 'info') {
      const id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ success: false, error: 'Missing manga id' }), { status: 400 });
      }
      const apiUrl = `${API_URL}/meta/anilist-manga/info/${encodeURIComponent(id)}?provider=${provider}`;
      const resp = await fetch(apiUrl);
      const data = await resp.json();
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    if (type === 'read') {
      const chapterId = url.searchParams.get('chapterId');
      if (!chapterId) {
        return new Response(JSON.stringify({ success: false, error: 'Missing chapterId' }), { status: 400 });
      }
      const apiUrl = `${API_URL}/meta/anilist-manga/read?chapterId=${encodeURIComponent(chapterId)}&provider=${provider}`;
      const resp = await fetch(apiUrl);
      const data = await resp.json();
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid type parameter' }), { status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
};