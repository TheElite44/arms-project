import type { RequestHandler } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_ANIME_API || '';

// Dynamic referer list - will try these in order
const REFERERS = [
  'https://hianimez.to/',
  'https://megacloud.blog/',
  'https://megacloud.club/',
  'https://aniwatch.to/'
];

// Helper function to create error responses
function createErrorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { 
      status, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

// Helper function to validate URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Function to try different referers for sources
async function fetchSourcesWithDynamicReferer(
  animeEpisodeId: string,
  server: string,
  category: string
) {
  let lastError: any = null;
  let failedReferers: Set<string> = new Set(); // Track failed referers
  let processedEpisodeId = animeEpisodeId;

  // Decode the episode ID if necessary
  try {
    const decoded = decodeURIComponent(animeEpisodeId);
    processedEpisodeId = decoded;
    console.log('Original animeEpisodeId:', animeEpisodeId);
    console.log('Decoded animeEpisodeId:', decoded);
  } catch (decodeError) {
    console.log('Using original animeEpisodeId as-is:', animeEpisodeId);
  }

  // Helper function for exponential backoff
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Try each referer dynamically
  for (let attempt = 1; attempt <= REFERERS.length; attempt++) {
    const referer = REFERERS.find((r) => !failedReferers.has(r)); // Select the next available referer

    if (!referer) {
      console.error('❌ All referers have failed.');
      break;
    }

    console.log(`Attempt ${attempt}/${REFERERS.length}: Trying referer: ${referer}`);

    try {
      // Build the upstream URL
      const baseUrl = `${API_URL}/api/v2/hianime/episode/sources`;
      const params = new URLSearchParams();
      params.append('animeEpisodeId', processedEpisodeId);
      params.append('server', server);
      params.append('category', category);

      const upstreamUrl = `${baseUrl}?${params.toString()}`;
      console.log(`Upstream URL (attempt ${attempt}):`, upstreamUrl);

      const response = await fetch(upstreamUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': referer,
          'Origin': referer.slice(0, -1), // Remove trailing slash for origin
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      console.log(`Response status (attempt ${attempt}):`, response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Attempt ${attempt} failed (${response.status}):`, errorText);
        lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        failedReferers.add(referer); // Mark referer as failed
        await delay(500 * attempt); // Exponential backoff
        continue;
      }

      const json = await response.json();
      console.log(`Attempt ${attempt} response:`, JSON.stringify(json, null, 2));

      if (!json.success || !json.data) {
        console.error(`Attempt ${attempt} - API returned unsuccessful response:`, json);
        lastError = new Error(json.message || 'API request was not successful');
        failedReferers.add(referer); // Mark referer as failed
        await delay(500 * attempt); // Exponential backoff
        continue;
      }

      const responseData = json.data;
      let sourcesToProcess = [];

      if (responseData.sources && Array.isArray(responseData.sources)) {
        sourcesToProcess = responseData.sources;
      } else {
        console.error(`Attempt ${attempt} - Invalid sources response structure:`, JSON.stringify(responseData, null, 2));
        lastError = new Error('No sources found in API response');
        failedReferers.add(referer); // Mark referer as failed
        await delay(500 * attempt); // Exponential backoff
        continue;
      }

      if (sourcesToProcess.length === 0) {
        console.warn(`Attempt ${attempt} - No sources found for episode:`, processedEpisodeId);
        lastError = new Error('No sources found for this episode');
        failedReferers.add(referer); // Mark referer as failed
        await delay(500 * attempt); // Exponential backoff
        continue;
      }

      // Success! Process the sources with the current referer
      console.log(`✅ Success with referer: ${referer}`);

      const processedSources = sourcesToProcess.map((source: any) => {
        if (source.url && typeof source.url === 'string' && source.url.endsWith('.m3u8')) {
          if (isValidUrl(source.url)) {
            const proxyHeaders = JSON.stringify({
              'Referer': referer,
              'Origin': referer.slice(0, -1),
            });
            source.url = `https://ani-fire-m3u8-proxy.vercel.app/m3u8-proxy?url=${encodeURIComponent(source.url)}&headers=${encodeURIComponent(proxyHeaders)}`;
          } else {
            console.warn('Invalid source URL detected:', source.url);
          }
        }
        return source;
      });

      // Return successful response
      const finalResponse = {
        success: true,
        data: {
          ...responseData,
          sources: processedSources,
          usedReferer: referer, // Include which referer worked
        },
      };

      console.log(`Sources processed successfully with referer: ${referer}`);
      return new Response(JSON.stringify(finalResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      });
    } catch (fetchError: any) {
      console.error(`Attempt ${attempt} fetch error:`, fetchError);
      lastError = fetchError;
      failedReferers.add(referer); // Mark referer as failed
      await delay(500 * attempt); // Exponential backoff
      continue;
    }
  }

  // If we get here, all referers failed
  console.error('❌ All referers failed. Last error:', lastError);

  if (lastError instanceof TypeError && lastError.message?.includes('Failed to fetch')) {
    return createErrorResponse('Network error: Unable to reach upstream API with any referer', 502);
  }

  return createErrorResponse(`All referers failed. Last error: ${lastError?.message || 'Unknown error'}`, 502);
}

export const GET: RequestHandler = async ({ url }) => {
  const animeId = url.searchParams.get('animeId');
  const animeEpisodeId = url.searchParams.get('animeEpisodeId');
  const server = url.searchParams.get('server') || 'hd-1';
  const category = url.searchParams.get('category') || 'sub';
  const action = url.searchParams.get('action');
  const referer = url.searchParams.get('referer') || REFERERS[0]; // Default to first referer

  // Validate required parameters
  if (!action) {
    return createErrorResponse('action parameter is required', 400);
  }

  if (!API_URL) {
    console.error('VITE_ANIME_API environment variable is not set');
    return createErrorResponse('API configuration error', 500);
  }

  try {
    let response: Response | null = null; // Initialize response variable

    switch (action) {
      case 'info': {
        if (!animeId) {
          return createErrorResponse('animeId is required for info action', 400);
        }

        console.log('Fetching anime info for animeId:', animeId);
        const infoUrl = `${API_URL}/api/v2/hianime/anime/${encodeURIComponent(animeId)}`;

        let lastError: any = null;
        for (const currentReferer of REFERERS) {
          try {
            response = await fetch(infoUrl, {
              headers: {
                'Referer': currentReferer,
                'Origin': currentReferer.slice(0, -1),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });

            if (response.ok) {
              console.log(`Info request successful with referer: ${currentReferer}`);
              break;
            } else {
              lastError = new Error(`HTTP ${response.status}`);
              console.log(`Info request failed with ${currentReferer}, trying next...`);
            }
          } catch (error) {
            lastError = error;
            console.log(`Info request error with ${currentReferer}:`, error);
          }
        }

        if (!response || !response.ok) {
          throw lastError || new Error('All referers failed for info');
        }
        break;
      }

      case 'episodes': {
        if (!animeId) {
          return createErrorResponse('animeId is required for episodes action', 400);
        }

        console.log('Fetching episodes for animeId:', animeId);
        const episodesUrl = `${API_URL}/api/v2/hianime/anime/${encodeURIComponent(animeId)}/episodes`;

        let lastError: any = null;
        for (const currentReferer of REFERERS) {
          try {
            response = await fetch(episodesUrl, {
              headers: {
                'Referer': currentReferer,
                'Origin': currentReferer.slice(0, -1),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });

            if (response.ok) {
              console.log(`Episodes request successful with referer: ${currentReferer}`);
              break;
            } else {
              lastError = new Error(`HTTP ${response.status}`);
              console.log(`Episodes request failed with ${currentReferer}, trying next...`);
            }
          } catch (error) {
            lastError = error;
            console.log(`Episodes request error with ${currentReferer}:`, error);
          }
        }

        if (!response || !response.ok) {
          throw lastError || new Error('All referers failed for episodes');
        }
        break;
      }

      case 'servers': {
        if (!animeEpisodeId) {
          return createErrorResponse('animeEpisodeId is required for servers action', 400);
        }

        console.log('Fetching servers for animeEpisodeId:', animeEpisodeId);
        const serversUrl = `${API_URL}/api/v2/hianime/episode/servers?animeEpisodeId=${encodeURIComponent(animeEpisodeId)}`;

        let lastError: any = null;
        for (const currentReferer of REFERERS) {
          try {
            response = await fetch(serversUrl, {
              headers: {
                'Referer': currentReferer,
                'Origin': currentReferer.slice(0, -1),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });

            if (response.ok) {
              console.log(`Servers request successful with referer: ${currentReferer}`);
              break;
            } else {
              lastError = new Error(`HTTP ${response.status}`);
              console.log(`Servers request failed with ${currentReferer}, trying next...`);
            }
          } catch (error) {
            lastError = error;
            console.log(`Servers request error with ${currentReferer}:`, error);
          }
        }

        if (!response || !response.ok) {
          throw lastError || new Error('All referers failed for servers');
        }
        break;
      }

      case 'sources': {
        if (!animeEpisodeId) {
          return createErrorResponse('animeEpisodeId is required for sources action', 400);
        }

        console.log('Fetching sources with dynamic referer switching...');
        return await fetchSourcesWithDynamicReferer(animeEpisodeId, server, category);
      }

      default:
        return createErrorResponse(`Invalid action: ${action}. Supported actions: info, episodes, servers, sources`, 400);
    }

    // Handle responses for info, episodes, and servers actions
    if (!response || !response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      return createErrorResponse('Upstream API request failed', response.status);
    }

    const json = await response.json();

    // Validate that the API returned a successful response
    if (json.success === false) {
      console.error(`API returned error:`, json);
      return createErrorResponse(json.message || 'API request failed', 400);
    }

    console.log(`API response for action '${action}' received successfully`);

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error: any) {
    console.error('Unexpected error in API handler:', error);
    return createErrorResponse('Internal server error', 500);
  }
};