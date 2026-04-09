/**
 * RapidAPI Travel Services for T2T
 * Proxied via Supabase Edge Function — API keys stay server-side.
 *
 * Hosts:
 *   - booking-com.p.rapidapi.com  (Hotels, Flights)
 */

import { supabase } from '@/lib/supabase';

/* ── Shared fetch helper (via Edge Function proxy) ───────── */

// Map host → API name for the proxy
const HOST_TO_API: Record<string, string> = {
  'booking-com.p.rapidapi.com': 'booking',
};

interface RapidAPIOptions {
  host: string;
  path: string;
  params?: Record<string, string>;
}

async function rapidFetch<T>(opts: RapidAPIOptions): Promise<T> {
  const api = HOST_TO_API[opts.host];
  if (!api) throw new Error(`Unknown API host: ${opts.host}`);

  const { data, error } = await supabase.functions.invoke('api-proxy', {
    body: {
      api,
      path: opts.path,
      params: opts.params,
    },
  });

  if (error) {
    throw new Error(`API proxy error (${api}): ${error.message}`);
  }

  return data as T;
}

/* ── Types ────────────────────────────────────────────────── */

export interface FlightOffer {
  id: string;
  airline: string;
  airlineLogo: string;
  from: string;
  to: string;
  fromName: string;
  toName: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  seatsRemaining?: number;
}

export interface HotelOffer {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  rating?: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  imageUrl?: string;
}

/* ══════════════════════════════════════════════════════════
   BOOKING COM — Hotels, Flights, Car Rental, Attractions
   Host: booking-com.p.rapidapi.com
   ══════════════════════════════════════════════════════════ */

export async function searchHotels(params: {
  destId: string;       // Booking.com dest_id (e.g. "-126693" for Rome)
  destType?: string;    // "city" | "district" | "landmark" | "airport"
  checkIn: string;      // YYYY-MM-DD
  checkOut: string;     // YYYY-MM-DD
  adults?: number;
  rooms?: number;
  maxResults?: number;
}): Promise<HotelOffer[]> {
  const data = await rapidFetch<any>({
    host: 'booking-com.p.rapidapi.com',
    path: '/v1/hotels/search',
    params: {
      dest_id: params.destId,
      dest_type: params.destType || 'city',
      checkin_date: params.checkIn,
      checkout_date: params.checkOut,
      adults_number: String(params.adults || 2),
      room_number: String(params.rooms || 1),
      units: 'metric',
      order_by: 'popularity',
      locale: 'en-gb',
      filter_by_currency: 'EUR',
    },
  });

  if (!data.result) return [];

  return data.result.slice(0, params.maxResults || 20).map((h: any): HotelOffer => ({
    id: String(h.hotel_id || h.hotel_id_trans || ''),
    name: h.hotel_name || 'Hotel',
    location: h.city || h.address || '',
    latitude: h.latitude || 0,
    longitude: h.longitude || 0,
    rating: h.review_score ? h.review_score / 2 : undefined, // Booking uses 1-10, normalize to 1-5
    pricePerNight: h.min_total_price || h.composite_price_breakdown?.gross_amount?.value || 0,
    currency: 'EUR',
    amenities: [],
    imageUrl: h.max_photo_url || h.main_photo_url || undefined,
  }));
}

export async function searchFlights(params: {
  fromCode: string;     // Airport IATA code, e.g. "NAP.AIRPORT"
  toCode: string;       // Airport IATA code, e.g. "FCO.AIRPORT"
  departDate: string;   // YYYY-MM-DD
  returnDate?: string;  // YYYY-MM-DD
  adults?: number;
  maxResults?: number;
}): Promise<FlightOffer[]> {
  const queryParams: Record<string, string> = {
    from_code: params.fromCode,
    to_code: params.toCode,
    depart_date: params.departDate,
    adults: String(params.adults || 1),
    locale: 'en-gb',
    order_by: 'BEST',
    flight_type: params.returnDate ? 'ROUNDTRIP' : 'ONEWAY',
    cabin_class: 'ECONOMY',
    currency: 'EUR',
  };
  if (params.returnDate) {
    queryParams.return_date = params.returnDate;
  }

  const data = await rapidFetch<any>({
    host: 'booking-com.p.rapidapi.com',
    path: '/v1/flights/search',
    params: queryParams,
  });

  if (!data.flights) return [];

  return data.flights.slice(0, params.maxResults || 10).map((f: any): FlightOffer => {
    const segments = f.segments || [];
    const first = segments[0] || {};
    const last = segments[segments.length - 1] || first;

    // Calculate stops from layovers
    const stops = Math.max(0, segments.length - 1);

    // Duration from first segment
    const durationMin = f.total_duration || first.duration_minutes || 0;
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    const priceTotal = (f.price_total?.units ?? 0) + ((f.price_total?.nanos ?? 0) / 1e9);

    return {
      id: String(f.flight_id || `${first.carrier_code}${first.flight_number}`),
      airline: first.carrier_name || first.carrier_code || '?',
      airlineLogo: first.carrier_logo || `https://pics.avs.io/60/30/${first.carrier_code}.png`,
      from: first.departure_airport || params.fromCode.split('.')[0],
      to: last.arrival_airport || params.toCode.split('.')[0],
      fromName: first.departure_airport || '',
      toName: last.arrival_airport || '',
      departure: first.departure_time?.split('T')[1]?.slice(0, 5) || '',
      arrival: last.arrival_time?.split('T')[1]?.slice(0, 5) || '',
      duration,
      price: priceTotal,
      currency: f.price_total?.currencyCode || 'EUR',
      stops,
      seatsRemaining: f.seats_remaining,
    };
  });
}

export const TravelAPI = {
  searchHotels,
  searchFlights,
};
