import type { RequestHandler } from '@sveltejs/kit';
import { Redis } from '@upstash/redis';

const API_URL = import.meta.env.VITE_CONSUMET_API;

const REDIS_URL = import.meta.env.VITE_REDIS_URL;
const REDIS_TOKEN = import.meta.env.VITE_REDIS_TOKEN;
const useRedis = !!REDIS_URL && !!REDIS_TOKEN;
const redis = useRedis
  ? new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
  : null;

const CACHE_TTL = 1800; // 30 minutes
const CACHE_TTL_READ = 432000; // 5 days in seconds

export const GET: RequestHandler = async ({ url }) => {
  const type = url.searchParams.get('type'); // 'search', 'info', or 'read'
  const provider = url.searchParams.get('provider') || 'mangahere';

  try {
    if (type === 'search') {
      const query = url.searchParams.get('q');
      const page = url.searchParams.get('page') || '1';
      if (!query) {
        return new Response(JSON.stringify({ success: false, error: 'Missing search query' }), { status: 400 });
      }
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
      const CACHE_KEY = `manga_info_${provider}_${id}`;
      if (redis) {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          return new Response(JSON.stringify({ success: true, data: cached }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
          });
        }
      }
      const apiUrl = `${API_URL}/meta/anilist-manga/info/${encodeURIComponent(id)}?provider=${provider}`;
      const resp = await fetch(apiUrl);
      const data = await resp.json();
      if (redis) {
        await redis.set(CACHE_KEY, data, { ex: CACHE_TTL });
      }
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Cache': redis ? 'MISS' : 'NONE' }
      });
    }

    if (type === 'read') {
      const chapterId = url.searchParams.get('chapterId');
      if (!chapterId) {
        return new Response(JSON.stringify({ success: false, error: 'Missing chapterId' }), { status: 400 });
      }
      const CACHE_KEY = `manga_read_${provider}_${chapterId}`;
      if (redis) {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          return new Response(JSON.stringify({ success: true, data: cached }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
          });
        }
      }
      const apiUrl = `${API_URL}/meta/anilist-manga/read?chapterId=${encodeURIComponent(chapterId)}&provider=${provider}`;
      const resp = await fetch(apiUrl);
      const data = await resp.json();
      if (redis) {
        await redis.set(CACHE_KEY, data, { ex: CACHE_TTL_READ });
      }
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Cache': redis ? 'MISS' : 'NONE' }
      });
    }

    // New endpoint to proxy manga images with proper headers
    if (type === 'image') {
      const imageUrl = url.searchParams.get('url');
      let referer = url.searchParams.get('referer');

      if (!imageUrl) {
        return new Response(JSON.stringify({ success: false, error: 'Missing image URL' }), { status: 400 });
      }

      // Always use mangahere.cc as referer for images
      referer = 'http://www.mangahere.cc/';

      try {
        const headers: Record<string, string> = {};
        if (referer) headers['Referer'] = referer;
        headers['User-Agent'] = 'Mozilla/5.0'; // Some CDNs require this

        const resp = await fetch(imageUrl, { headers });
        const contentType = resp.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await resp.arrayBuffer();

        return new Response(arrayBuffer, {
          status: resp.status,
          headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*', // <-- CORS header
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } catch (err) {
        return new Response('Failed to fetch image', { status: 500 });
      }
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid type parameter' }), { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
};