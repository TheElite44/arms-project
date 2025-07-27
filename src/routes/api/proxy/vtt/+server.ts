import type { RequestHandler } from '@sveltejs/kit';

const REFERER = 'https://megaplay.buzz/';

export const GET: RequestHandler = async ({ url }) => {
  const vttUrl = url.searchParams.get('url');
  if (!vttUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(vttUrl, {
      headers: {
        'Referer': REFERER
        // 'Origin' header removed
      }
    });
    if (!res.ok) {
      return new Response('Failed to fetch VTT', { status: 502 });
    }
    const contentType = res.headers.get('content-type') || 'text/vtt';
    return new Response(await res.text(), {
      status: 200,
      headers: { 'content-type': contentType }
    });
  } catch (e) {
    return new Response('Error fetching VTT', { status: 500 });
  }
};