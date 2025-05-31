import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';
const REFERERS = [
  'https://hianimez.to/',
  'https://megacloud.blog/',
  'https://megacloud.club/',
  'https://aniwatch.to/'
];

const createErrorResponse = (message: string, status: number) => 
  new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  maxAttempts = REFERERS.length
) => {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const referer = REFERERS[attempt - 1];
    console.log(`Attempt ${attempt}: Using referer ${referer}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Referer': referer,
          'Origin': referer.slice(0, -1),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });

      if (response.ok) return { response, referer };
      
      const errorText = await response.text();
      lastError = new Error(`HTTP ${response.status}: ${errorText}`);
      console.error(`Attempt ${attempt} failed:`, errorText);
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} error:`, error);
    }
    
    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, 500 * attempt));
  }
  
  throw lastError || new Error('All referers failed');
};

export const GET: RequestHandler = async ({ url }) => {
  const params = Object.fromEntries(url.searchParams);
  const { action, animeId, animeEpisodeId, server = 'hd-1', category = 'sub' } = params;

  if (!API_URL) return createErrorResponse('API configuration error', 500);
  if (!action) return createErrorResponse('Action parameter required', 400);

  try {
    switch (action) {
      case 'info':
        if (!animeId) return createErrorResponse('animeId required', 400);
        const infoUrl = `${API_URL}/api/v2/hianime/anime/${encodeURIComponent(animeId)}`;
        const { response: infoRes } = await fetchWithRetry(infoUrl);
        return new Response(JSON.stringify(await infoRes.json()), { status: 200 });
      
      case 'episodes':
        if (!animeId) return createErrorResponse('animeId required', 400);
        const episodesUrl = `${API_URL}/api/v2/hianime/anime/${encodeURIComponent(animeId)}/episodes`;
        const { response: episodesRes } = await fetchWithRetry(episodesUrl);
        return new Response(JSON.stringify(await episodesRes.json()), { status: 200 });
      
      case 'servers':
        if (!animeEpisodeId) return createErrorResponse('animeEpisodeId required', 400);
        const serversUrl = `${API_URL}/api/v2/hianime/episode/servers?animeEpisodeId=${encodeURIComponent(animeEpisodeId)}`;
        const { response: serversRes } = await fetchWithRetry(serversUrl);
        return new Response(JSON.stringify(await serversRes.json()), { status: 200 });
      
      case 'sources':
        if (!animeEpisodeId) return createErrorResponse('animeEpisodeId required', 400);
        const sourcesUrl = `${API_URL}/api/v2/hianime/episode/sources?${new URLSearchParams({
          animeEpisodeId: decodeURIComponent(animeEpisodeId),
          server,
          category
        })}`;
        
        const { response: sourcesRes, referer } = await fetchWithRetry(sourcesUrl);
        const json = await sourcesRes.json();
        
        if (!json.success || !json.data?.sources) {
          return createErrorResponse(json.message || 'Invalid sources response', 400);
        }
        
        // Process sources
        const processedSources = json.data.sources.map((source: any) => {
          if (source.url?.endsWith('.m3u8') && isValidUrl(source.url)) {
            const proxyHeaders = JSON.stringify({
              Referer: referer,
              Origin: referer.slice(0, -1),
            });
            source.url = `https://ani-fire-m3u8-proxy.vercel.app/m3u8-proxy?url=${
              encodeURIComponent(source.url)}&headers=${encodeURIComponent(proxyHeaders)}`;
          }
          return source;
        });
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            ...json.data,
            sources: processedSources,
            usedReferer: referer
          }
        }), { status: 200 });
      
      default:
        return createErrorResponse(`Invalid action: ${action}`, 400);
    }
  } catch (error) {
    console.error('API Error:', error);
    const message = (error instanceof Error) ? error.message : 'Internal server error';
    return createErrorResponse(message, 500);
  }
};