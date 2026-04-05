import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TravelAPI, type HotelOffer } from '@/services/rapidapi';

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

/**
 * Common city codes → Booking.com dest_id mapping.
 * To find more: search on booking.com, check the URL for dest_id param.
 */
const CITY_TO_DEST_ID: Record<string, { id: string; type: string }> = {
  ROM: { id: '-126693', type: 'city' },    // Rome
  PAR: { id: '-1456928', type: 'city' },   // Paris
  LON: { id: '-2601889', type: 'city' },   // London
  NYC: { id: '20088325', type: 'city' },   // New York
  NAP: { id: '-121760', type: 'city' },    // Naples
  MIL: { id: '-121235', type: 'city' },    // Milan
  BCN: { id: '-372490', type: 'city' },    // Barcelona
  MAD: { id: '-390626', type: 'city' },    // Madrid
  BER: { id: '-1746443', type: 'city' },   // Berlin
  AMS: { id: '-2140463', type: 'city' },   // Amsterdam
  FLR: { id: '-117965', type: 'city' },    // Florence
  VCE: { id: '-132007', type: 'city' },    // Venice
  LIS: { id: '-2168021', type: 'city' },   // Lisbon
  ATH: { id: '-814876', type: 'city' },    // Athens
  IST: { id: '-2597484', type: 'city' },   // Istanbul
  DXB: { id: '-782813', type: 'city' },    // Dubai
  BKK: { id: '-3413978', type: 'city' },   // Bangkok
  TYO: { id: '-246227', type: 'city' },    // Tokyo
  CAP: { id: '-120880', type: 'city' },    // Capri
};

export function useHotelSearch(): UseHotelSearchReturn {
  const { t } = useTranslation();
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

    const mapping = CITY_TO_DEST_ID[params.cityCode.toUpperCase()];
    if (!mapping) {
      setError(t('search.city_not_found', { code: params.cityCode }));
      setLoading(false);
      return;
    }

    try {
      const data = await TravelAPI.searchHotels({
        destId: mapping.id,
        destType: mapping.type,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: params.adults,
      });
      setResults(data);
    } catch (e: any) {
      setError(e.message || t('search.err_hotels'));
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
