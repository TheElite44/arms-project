import type { PageLoad } from './$types.js';

export const load: PageLoad = async ({ params, fetch }) => {
  const mangaId = params.id;
  const chapterId = params.chapterId;

  // Fetch chapter list and metadata (from info endpoint)
  const infoRes = await fetch(`/api/manga?type=info&id=${encodeURIComponent(mangaId)}`);
  const infoData = await infoRes.json();

  // Fetch chapter images (from read endpoint)
  const readRes = await fetch(`/api/manga?type=read&chapterId=${encodeURIComponent(chapterId)}&provider=mangadex`);
  const readData = await readRes.json();

  return {
    images: Array.isArray(readData.data) ? readData.data.map((p: { img: string }) => p.img) : [],
    title:
      infoData?.data?.chapters?.find((c: any) => c.id === chapterId)?.title ?? '',
    chapterNumber:
      infoData?.data?.chapters?.find((c: any) => c.id === chapterId)?.chapterNumber ?? '',
    chapterList: infoData?.data?.chapters ?? []
  };
};