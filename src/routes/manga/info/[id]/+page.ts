import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const id = params.id;
  if (!id) {
    return { manga: null };
  }

  const res = await fetch(`/api/manga?type=info&id=${encodeURIComponent(id)}`);
  if (!res.ok) {
    return { manga: null };
  }

  const data = await res.json();
  if (!data.success) {
    return { manga: null };
  }

  // The API returns all info in data.data
  const manga = data.data;

  return {
    manga,
    recommendations: manga.recommendations ?? [],
    relations: manga.relations ?? [],
    characters: manga.characters ?? [],
    chapters: manga.chapters ?? []
  };
};