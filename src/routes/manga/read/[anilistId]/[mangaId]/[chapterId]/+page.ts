import type { PageLoad } from './$types.js';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
  const anilistId = params.anilistId;
  const mangaId = params.mangaId;
  const chapterId = params.chapterId;

  if (!anilistId || !mangaId || !chapterId) {
    throw error(400, 'Missing required parameters');
  }

  try {
    // Info API now uses AniList ID for fetching chapters
    const infoUrl = `/api/manga?type=info&id=${encodeURIComponent(anilistId)}`;
    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json();

    // Read API still uses provider mangaId/chapterId
    const readUrl = `/api/manga?type=read&chapterId=${encodeURIComponent(`${mangaId}/${chapterId}`)}`;
    const readRes = await fetch(readUrl);
    const readData = await readRes.json();

    if (!infoRes.ok) {
      throw error(infoRes.status, `Failed to fetch manga info: ${infoRes.statusText}`);
    }
    if (!readRes.ok) {
      throw error(readRes.status, `Failed to fetch chapter pages: ${readRes.statusText}`);
    }
    if (!infoData.success) {
      throw error(500, `Manga info error: ${infoData.error || 'Unknown error'}`);
    }
    if (!readData.success) {
      throw error(500, `Chapter read error: ${readData.error || 'Unknown error'}`);
    }

    // --- FILTER CHAPTERS BY ANILIST ID OR MANGA ID ---
    let allChapters = infoData?.data?.chapters ?? [];
    if (!Array.isArray(allChapters)) allChapters = [];

    // Always use string for id and ensure id is in the format "mangaId/chapterId"
    const chapterList = allChapters
      .filter(
        (ch: any) =>
          typeof ch.id === 'string' &&
          (ch.id.startsWith(mangaId + '/') || ch.id.startsWith(anilistId + '/'))
      )
      .map((ch: any) => ({
        ...ch,
        id: String(ch.id),
        shortId: String(ch.id).split('/')[1] // Add shortId for easier navigation
      }));

    // Find current chapter index by matching the chapterId part after the slash
    const currentIndex = chapterList.findIndex((c: any) => c.shortId === chapterId);
    const chapterMeta = chapterList[currentIndex] ?? {};

    // Handle different possible response formats for pages
    let pages: { page: number, img: string, headerForImage?: Record<string, string> }[] = [];
    if (readData.data) {
      if (Array.isArray(readData.data)) {
        pages = readData.data.filter((page: any) => page && page.img);
      } else if (readData.data.img) {
        pages = [readData.data];
      } else if (readData.data.pages && Array.isArray(readData.data.pages)) {
        pages = readData.data.pages.filter((page: any) => page && page.img);
      }
    }

    pages = pages
      .map((page: any, index: number) => {
        const referer = page.headerForImage?.Referer || '';
        const proxiedImg = `/api/manga?type=image&url=${encodeURIComponent(page.img)}&referer=${encodeURIComponent(referer)}`;
        return {
          page: page.page ?? index,
          img: proxiedImg,
          headerForImage: page.headerForImage || undefined
        };
      })
      .sort((a, b) => a.page - b.page);

    const mangaTitle =
      infoData.data?.title?.english ||
      infoData.data?.title?.romaji ||
      infoData.data?.title?.native ||
      'Unknown Manga';

    const title =
      chapterMeta.title ||
      chapterMeta.name ||
      `Chapter ${chapterMeta.chapterNumber || chapterMeta.chapter || chapterMeta.number || extractChapterNumber(chapterId) || ''}` ||
      mangaTitle;

    const chapterNumber = chapterMeta.chapterNumber ||
      chapterMeta.chapter ||
      chapterMeta.number ||
      extractChapterNumber(chapterId) ||
      'Unknown';

    // Fix: prev/next chapter and selector use the correct id
    const prevChapter = currentIndex > 0 ? chapterList[currentIndex - 1] : null;
    const nextChapter = currentIndex >= 0 && currentIndex < chapterList.length - 1 ? chapterList[currentIndex + 1] : null;

    return {
      pages,
      chapterList: chapterList.map((chapter: any) => ({
        id: chapter.id,
        // Always show the chapter id part after the slash for navigation
        shortId: chapter.id.split('/')[1],
        title: chapter.title || chapter.name || '',
        chapterNumber: chapter.chapterNumber || chapter.chapter || chapter.number || '',
        releasedDate: chapter.releasedDate || chapter.date || null
      })),
      currentIndex,
      title,
      chapterNumber: String(chapterNumber),
      anilistId,
      mangaId,
      chapterId,
      mangaTitle,
      mangaImage: infoData.data?.image || '',
      totalPages: pages.length,
      prevChapter: prevChapter
        ? {
            id: prevChapter.id,
            shortId: prevChapter.id.split('/')[1],
            title: prevChapter.title || prevChapter.name || '',
            chapterNumber: prevChapter.chapterNumber || prevChapter.chapter || prevChapter.number || ''
          }
        : null,
      nextChapter: nextChapter
        ? {
            id: nextChapter.id,
            shortId: nextChapter.id.split('/')[1],
            title: nextChapter.title || nextChapter.name || '',
            chapterNumber: nextChapter.chapterNumber || nextChapter.chapter || nextChapter.number || ''
          }
        : null,
      provider: readData.provider || 'unknown',
      loadedAt: new Date().toISOString()
    };

  } catch (err) {
    console.error('Error loading manga chapter:', err);

    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    if (err instanceof Error) {
      throw error(500, `Failed to load chapter: ${err.message}`);
    }

    throw error(500, 'Failed to load chapter: Unknown error');
  }
};

// Helper function to extract chapter number from chapter ID
function extractChapterNumber(chapterId: string): string | null {
  const patterns = [
    /c(\d+(?:\.\d+)?)/i,
    /chapter[_-]?(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)$/,
  ];

  for (const pattern of patterns) {
    const match = chapterId.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}