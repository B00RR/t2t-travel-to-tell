import { useState, useCallback, useRef } from 'react';
import { AmadeusService, type Airport } from '@/services/amadeus';

const DEBOUNCE_MS = 400;

interface UseAirportSearchReturn {
  results: Airport[];
  loading: boolean;
  search: (keyword: string) => void;
  clear: () => void;
}

export function useAirportSearch(): UseAirportSearchReturn {
  const [results, setResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((keyword: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (keyword.length < 2) {
      setResults([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await AmadeusService.searchAirports(keyword);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResults([]);
  }, []);

  return { results, loading, search, clear };
}
