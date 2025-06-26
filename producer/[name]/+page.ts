import type { PageLoad } from './$types.js';
import { error, redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, url, fetch }) => {
  const producerName = params.name;
  const pageParam = url.searchParams.get('page');
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  if (!producerName) {
    throw error(400, 'Producer name is required');
  }

  // Validate page number and redirect if invalid
  if (isNaN(page) || page < 1) {
    const correctedUrl = new URL(url);
    correctedUrl.searchParams.set('page', '1');
    throw redirect(302, correctedUrl.toString());
  }

  // Always ensure page parameter exists in URL for consistency
  if (!pageParam) {
    const correctedUrl = new URL(url);
    correctedUrl.searchParams.set('page', page.toString());
    throw redirect(302, correctedUrl.toString());
  }

  try {
    // Fetch producer data from your backend API route
    const apiUrl = `/api/producer/${encodeURIComponent(producerName)}?page=${page}`;
    console.log('Loading page with URL:', apiUrl);
    
    const resp = await fetch(apiUrl);
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('API fetch failed:', resp.status, errorText);
      
      if (resp.status === 404) {
        throw error(404, 'Producer not found');
      }
      throw error(resp.status, `Failed to fetch producer data: ${resp.statusText}`);
    }

    const json = await resp.json();

    if (!json.success) {
      console.error('API returned error:', json.error);
      throw error(404, json.error || 'Producer not found');
    }

    // Validate response structure
    if (!json.data) {
      console.error('Invalid response structure:', json);
      throw error(500, 'Invalid API response format');
    }

    const responseData = json.data;
    
    // If the requested page is higher than total pages, redirect to last page
    if (responseData.totalPages && page > responseData.totalPages && responseData.totalPages > 0) {
      const correctedUrl = new URL(url);
      correctedUrl.searchParams.set('page', responseData.totalPages.toString());
      throw redirect(302, correctedUrl.toString());
    }

    return {
      producerName: responseData.producerName || producerName,
      animes: responseData.animes || [],
      currentPage: responseData.currentPage || page,
      totalPages: responseData.totalPages || 1,
      top10Animes: responseData.top10Animes || {},
      topAiringAnimes: responseData.topAiringAnimes || [],
    };
  } catch (err) {
    console.error('Error in page load:', err);
    
    // If it's already a SvelteKit error or redirect, re-throw it
    if (err && typeof err === 'object' && ('status' in err || 'location' in err)) {
      throw err;
    }
    
    // Otherwise, throw a generic server error
    throw error(500, 'Failed to load producer data');
  }
};