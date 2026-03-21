import { useState, useCallback } from 'react';

export interface StockImage {
  id: number;
  url: string;
  thumbnailUrl: string;
  photographer: string;
}

const PEXELS_API_KEY = process.env.EXPO_PUBLIC_PEXELS_API_KEY || '';

export function useStockImages() {
  const [images, setImages] = useState<StockImage[]>([]);
  const [loading, setLoading] = useState(false);
  const apiKeyMissing = !PEXELS_API_KEY;

  const searchImages = useCallback(async (query: string) => {
    if (!query.trim() || !PEXELS_API_KEY) {
      setImages([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' travel')}&per_page=12&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );
      const data = await res.json();

      if (data.photos) {
        setImages(
          data.photos.map((p: any) => ({
            id: p.id,
            url: p.src.large,
            thumbnailUrl: p.src.medium,
            photographer: p.photographer,
          }))
        );
      }
    } catch (e) {
      console.warn('Pexels search failed:', e);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { images, loading, searchImages, apiKeyMissing };
}
