import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
        return new Response('Missing url', { status: 400 });
    }

    // Set headers as needed for the upstream
    const headers = {
        'Referer': 'https://hianimez.to/',
        'Origin': 'https://hianimez.to',
        // ...add more if needed
    };

    const resp = await fetch(targetUrl, { headers });
    const body = await resp.arrayBuffer();

    // Pass through content-type and enable CORS
    return new Response(body, {
        status: resp.status,
        headers: {
            'Content-Type': resp.headers.get('content-type') || 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*'
        }
    });
};