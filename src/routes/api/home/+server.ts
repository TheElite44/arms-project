import type { RequestHandler } from '@sveltejs/kit';
import { Redis } from '@upstash/redis';

const API_URL = import.meta.env.VITE_ANIME_API || '';
const REDIS_URL = import.meta.env.VITE_REDIS_URL;
const REDIS_TOKEN = import.meta.env.VITE_REDIS_TOKEN;

const useRedis = !!REDIS_URL && !!REDIS_TOKEN;
const redis = useRedis
  ? new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
  : null;

const CACHE_KEY_HOME = 'home_data_v1';
const CACHE_TTL_HOME = 3600; // 1 hour in seconds

export const GET: RequestHandler = async () => {
  // If Redis is not configured, passthrough mode (no caching)
  if (!redis) {
    console.warn('[HOME API] Redis not configured, passthrough mode.');
    try {
      const resp = await fetch(`${API_URL}/api/v2/hianime/home`);
      if (!resp.ok) {
        return new Response(JSON.stringify({ success: false, error: 'Failed to fetch anime home data' }), { status: resp.status });
      }
      const data = await resp.json();
      return new Response(JSON.stringify({ success: true, data: data.data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'NONE' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
    }
  }

  // Try cache first: only fetch from API if cache is missing
  const cached = await redis.get(CACHE_KEY_HOME);
  if (cached) {
    return new Response(JSON.stringify({ success: true, data: cached }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  // Cache miss: fetch from API and cache the result
  try {
    const resp = await fetch(`${API_URL}/api/v2/hianime/home`);
    if (!resp.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to fetch anime home data' }), { status: resp.status });
    }
    const data = await resp.json();

    // Validate data before saving to Redis
    if (
      !data ||
      !data.data ||
      (Array.isArray(data.data) && data.data.length === 0) ||
      (typeof data.data === 'object' && Object.keys(data.data).length === 0)
    ) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or empty home data' }),
        { status: 500 }
      );
    }

    await redis.set(CACHE_KEY_HOME, data.data, { ex: CACHE_TTL_HOME });
    return new Response(JSON.stringify({ success: true, data: data.data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500 });
  }
};