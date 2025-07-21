// +page.ts - CORRECTED VERSION
import type { PageLoad } from './$types.js';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
  const animeId = params.animeId;
  
  if (!animeId) {
    // Use SvelteKit's error function instead of returning error objects
    throw error(400, 'Anime ID is required');
  }

  try {
    // Fetch from your own API route
    const resp = await fetch(`/api/info?animeId=${animeId}`);
    
    if (!resp.ok) {
      // Handle HTTP errors properly
      if (resp.status === 404) {
        throw error(404, 'Anime not found');
      }
      throw error(resp.status, `Failed to fetch anime: ${resp.statusText}`);
    }

    const json = await resp.json();

    let top10Animes = json.data.top10Animes;
    // Fallback: fetch from /api/home if not present or missing 'month'
    if (!top10Animes || !Array.isArray(top10Animes.month)) {
      const homeResp = await fetch('/api/home');
      const homeJson = await homeResp.json();
      top10Animes = {
        today: homeJson?.data?.top10Animes?.today ?? [],
        week: homeJson?.data?.top10Animes?.week ?? [],
        month: homeJson?.data?.top10Animes?.month ?? []
      };
    }

    return {
      anime: json.data.anime,
      moreInfo: json.data.moreInfo,
      mostPopularAnimes: json.data.mostPopularAnimes || [],
      recommendedAnimes: json.data.recommendedAnimes || [],
      relatedAnimes: json.data.relatedAnimes || [],
      seasons: json.data.seasons || [],
      top10Animes
    };
    
  } catch (err) {
    console.error('Error loading anime:', err);
    
    // If it's already a SvelteKit error, re-throw it
    if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
      throw err;
    }
    
    // Otherwise, throw a generic error
    throw error(500, 'Failed to load anime information');
  }
};

// These settings are correct
export const ssr = true;
export const csr = true;