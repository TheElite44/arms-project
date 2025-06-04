import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  const m3u8Url = url.searchParams.get('url');
  const headersParam = url.searchParams.get('headers');

  if (!m3u8Url) {
    return new Response('Missing m3u8 url', { status: 400 });
  }

  let headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0'
  };

  if (headersParam) {
    try {
      const parsed = JSON.parse(headersParam);
      headers = { ...headers, ...parsed };
    } catch {
      // ignore parse error, fallback to default headers
    }
  }

  try {
    const resp = await fetch(m3u8Url, { headers });
    const contentType = resp.headers.get('content-type') || 'application/vnd.apple.mpegurl';
    const body = await resp.arrayBuffer();

    return new Response(body, {
      status: resp.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=600'
      }
    });
  } catch (err) {
    return new Response('Failed to fetch m3u8', { status: 500 });
  }
};