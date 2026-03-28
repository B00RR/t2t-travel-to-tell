import { useState, useCallback } from 'react';
import { TravelAPI, type FlightOffer } from '@/services/rapidapi';

interface UseFlightSearchReturn {
  results: FlightOffer[];
  loading: boolean;
  error: string | null;
  search: (params: {
    origin: string;
    destination: string;
    departDate: string;
    returnDate?: string;
    adults?: number;
  }) => Promise<void>;
  clear: () => void;
}

export function useFlightSearch(): UseFlightSearchReturn {
  const [results, setResults] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: {
    origin: string;
    destination: string;
    departDate: string;
    returnDate?: string;
    adults?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await TravelAPI.searchFlights({
        fromCode: `${params.origin}.AIRPORT`,
        toCode: `${params.destination}.AIRPORT`,
        departDate: params.departDate,
        returnDate: params.returnDate,
        adults: params.adults,
      });
      setResults(data);
    } catch (e: any) {
      setError(e.message || 'Errore nella ricerca voli');
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
