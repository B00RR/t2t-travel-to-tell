import { useState, useCallback } from 'react';
import { AmadeusService, type HotelOffer } from '@/services/amadeus';

interface UseHotelSearchReturn {
  results: HotelOffer[];
  loading: boolean;
  error: string | null;
  search: (params: {
    cityCode: string;
    checkIn: string;
    checkOut: string;
    adults?: number;
  }) => Promise<void>;
  clear: () => void;
}

export function useHotelSearch(): UseHotelSearchReturn {
  const [results, setResults] = useState<HotelOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: {
    cityCode: string;
    checkIn: string;
    checkOut: string;
    adults?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await AmadeusService.searchHotels(params);
      setResults(data);
    } catch (e: any) {
      setError(e.message || 'Errore nella ricerca hotel');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
