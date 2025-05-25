import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch, url }) => {
  const episodeId = params.episodeId;

  // 1. Get episode servers
  const serversResp = await fetch(`/api/episode/servers?animeEpisodeId=${episodeId}`);
  const serversJson = await serversResp.json();
  if (!serversJson.success) {
    return { error: 'Episode servers not found', videoSources: [], subtitles: [], episodes: [], episodeId };
  }

  // 2. Pick first available server/category (e.g., sub)
  const subServer = serversJson.data.sub?.[0];
  if (!subServer) {
    return { status: 404, error: 'No sub server found' };
  }

  // 3. Get streaming sources
  const sourcesResp = await fetch(
    `/api/episode/sources?animeEpisodeId=${episodeId}&server=${subServer.serverName}&category=sub`
  );
  const sourcesJson = await sourcesResp.json();
  if (!sourcesJson.success) {
    return { status: 404, error: 'No streaming sources found' };
  }

  // 4. Get all episodes for the anime (need animeId)
  // We'll try to extract animeId from the episodeId (usually before '?ep=')
  const animeId = episodeId.split('?')[0];
  const episodesResp = await fetch(`/api/episodes?animeId=${animeId}`);
  const episodesJson = await episodesResp.json();
  let episodes = [];
  if (episodesJson.success && episodesJson.data.episodes) {
    episodes = episodesJson.data.episodes.map((ep: any) => ({
      number: ep.number,
      title: ep.title,
      episodeId: ep.episodeId
    }));
  }

  // 5. Get poster image (optional)
  const posterResp = await fetch(`/api/episode/poster?animeEpisodeId=${episodeId}`);
  const posterJson = await posterResp.json();
  let poster = '';
  if (posterJson.success) {
    poster = posterJson.data.poster;
  }

  return {
    episodeId,
    videoSources: sourcesJson.data.sources,
    subtitles: sourcesJson.data.subtitles,
    episodes,
    poster,
  };
};