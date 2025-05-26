import type { RequestHandler } from '@sveltejs/kit';

// Import your controller functions here
// import { fetchAnimeByCategories, fetchAnimeEpisodesById, ... } from '$lib/server/controller/anime';

export const GET: RequestHandler = async ({ url }) => {
  const pathname = url.pathname.replace(/^\/api\/test/, '');
  const searchParams = url.searchParams;

  switch (pathname) {
    case '/home': {
      // const data = await getAnimeHomePage();
      // return new Response(JSON.stringify(data), { status: 200 });
      break;
    }
    case '/anime': {
      const animeId = searchParams.get('id');
      if (!animeId) {
        return new Response(JSON.stringify({ message: 'Invalid Id!' }), { status: 500 });
      }
      // const animeInfo = await fetchAnimeInfoByAnimeId(animeId);
      // return new Response(JSON.stringify(animeInfo), { status: 200 });
      break;
    }
    case '/episodes': {
      const animeId = searchParams.get('id');
      if (!animeId) {
        return new Response(JSON.stringify({ message: 'Invalid Id!' }), { status: 500 });
      }
      // const animeEpisodes = await fetchAnimeEpisodesById(animeId);
      // return new Response(JSON.stringify(animeEpisodes), { status: 200 });
      break;
    }
    // Add more cases as needed, following your Next.js logic
    default:
      return new Response(JSON.stringify({ message: 'Unknown route' }), { status: 404 });
  }

  // Placeholder response for now
  return new Response(JSON.stringify({ message: 'Not implemented' }), { status: 501 });
};