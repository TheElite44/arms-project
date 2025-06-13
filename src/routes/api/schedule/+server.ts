import type { RequestHandler } from '@sveltejs/kit';
import { Redis } from '@upstash/redis';

const API_URL = import.meta.env.VITE_ANIME_API || '';
const REDIS_URL = import.meta.env.VITE_REDIS_URL;
const REDIS_TOKEN = import.meta.env.VITE_REDIS_TOKEN;

const useRedis = !!REDIS_URL && !!REDIS_TOKEN;
const redis = useRedis
  ? new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
  : null;

const CACHE_TTL = 21600; // 6 hours in seconds (6 * 60 * 60)

export const GET: RequestHandler = async ({ url }) => {
  const date = url.searchParams.get('date');
  if (!date) {
    return new Response(JSON.stringify({ success: false, error: 'Date parameter is required' }), { status: 400 });
  }

  const CACHE_KEY = `schedule_${date}`;

  if (!useRedis) {
    console.warn('[SCHEDULE API] Redis not configured, passthrough mode.');
    try {
      const resp = await fetch(`${API_URL}/api/v2/hianime/schedule?date=${date}`);
      if (!resp.ok) {
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch schedule data' }), { status: resp.status });
      }
      const data = await resp.json();
      return new Response(JSON.stringify({ success: true, data: data.data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'NONE' }
      });
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
    }
  }

  // Try cache first
  const cached = await redis!.get(CACHE_KEY);
  if (cached) {
    return new Response(JSON.stringify({ success: true, data: cached }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  // If not cached, fetch and update cache
  try {
    const resp = await fetch(`${API_URL}/api/v2/hianime/schedule?date=${date}`);
    if (!resp.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch schedule data' }), { status: resp.status });
    }
    const data = await resp.json();
    await redis!.set(CACHE_KEY, data.data, { ex: CACHE_TTL });
    return new Response(JSON.stringify({ success: true, data: data.data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
};