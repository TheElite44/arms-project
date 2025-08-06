// +page.ts - UPDATED VERSION
import type { PageLoad } from './$types.js';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
  const animeId = params.animeId;

  if (!animeId) {
    throw error(400, 'Anime ID is required');
  }

  try {
    const resp = await fetch(`/api/info?animeId=${animeId}`);

    if (!resp.ok) {
      if (resp.status === 404) {
        throw error(404, 'Anime not found');
      }
      throw error(resp.status, `Failed to fetch anime: ${resp.statusText}`);
    }

    const json = await resp.json();

    // Check if we have the new API structure
    let animeData, moreInfoData;
    
    if (json?.data?.anime?.info) {
      // New API structure
      animeData = json.data.anime.info;
      moreInfoData = json.data.anime.moreInfo;
    } else if (json?.data?.anime) {
      // Legacy API structure (fallback)
      animeData = json.data.anime;
      moreInfoData = json.data.moreInfo;
    } else {
      throw error(500, 'Invalid API response structure');
    }

    // Defensive: ensure rating is always present
    if (animeData?.stats) {
      // Fix rating if missing or not a string
      if (!animeData.stats.rating || typeof animeData.stats.rating !== 'string') {
        animeData.stats.rating = 'N/A';
      }
      // Keep episodes data - don't remove it!
    }

    // Handle top10Animes - check if it exists in the new structure, otherwise fallback to home API
    let top10Animes = json.data.top10Animes;
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
      anime: animeData,
      moreInfo: moreInfoData,
      mostPopularAnimes: json.data.mostPopularAnimes || [],
      recommendedAnimes: json.data.recommendedAnimes || [],
      relatedAnimes: json.data.relatedAnimes || [],
      seasons: json.data.seasons || [],
      top10Animes
    };

  } catch (err) {
    console.error('Error loading anime:', err);

    if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
      throw err;
    }

    throw error(500, 'Failed to load anime information');
  }
};

export const ssr = true;
export const csr = true;