/**
 * Amadeus API Service
 * Auth: OAuth2 client_credentials flow
 * Docs: https://developers.amadeus.com/self-service
 */

const BASE_URL = process.env.EXPO_PUBLIC_AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
const API_KEY = process.env.EXPO_PUBLIC_AMADEUS_API_KEY || '';
const API_SECRET = process.env.EXPO_PUBLIC_AMADEUS_API_SECRET || '';

/* ── Auth ─────────────────────────────────────────────────── */

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${API_KEY}&client_secret=${API_SECRET}`,
  });

  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 1min early
  };

  return tokenCache.token;
}

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Amadeus ${path}: ${res.status} ${errBody}`);
  }

  return res.json();
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

export interface Airport {
  iataCode: string;
  name: string;
  cityName: string;
  countryName: string;
}

/* ── Helpers ──────────────────────────────────────────────── */

function parseISODuration(iso: string): string {
  // PT2H30M → "2h 30m"
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : '';
  const m = match[2] ? `${match[2]}m` : '';
  return `${h} ${m}`.trim();
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/* ── Flight Search ────────────────────────────────────────── */

export async function searchFlights(params: {
  origin: string;       // IATA code e.g. "NAP"
  destination: string;  // IATA code e.g. "LHR"
  departDate: string;   // YYYY-MM-DD
  returnDate?: string;  // YYYY-MM-DD
  adults?: number;
  maxResults?: number;
}): Promise<FlightOffer[]> {
  const queryParams: Record<string, string> = {
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departDate,
    adults: String(params.adults || 1),
    max: String(params.maxResults || 10),
    currencyCode: 'EUR',
  };
  if (params.returnDate) {
    queryParams.returnDate = params.returnDate;
  }

  const data = await apiGet<any>('/v2/shopping/flight-offers', queryParams);

  if (!data.data || data.data.length === 0) return [];

  return data.data.map((offer: any): FlightOffer => {
    const outbound = offer.itineraries[0];
    const firstSegment = outbound.segments[0];
    const lastSegment = outbound.segments[outbound.segments.length - 1];

    return {
      id: offer.id,
      airline: firstSegment.carrierCode,
      airlineLogo: `https://pics.avs.io/60/30/${firstSegment.carrierCode}.png`,
      from: firstSegment.departure.iataCode,
      to: lastSegment.arrival.iataCode,
      fromName: firstSegment.departure.iataCode,
      toName: lastSegment.arrival.iataCode,
      departure: formatTime(firstSegment.departure.at),
      arrival: formatTime(lastSegment.arrival.at),
      duration: parseISODuration(outbound.duration),
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      stops: outbound.segments.length - 1,
      seatsRemaining: offer.numberOfBookableSeats,
    };
  });
}

/* ── Hotel Search ─────────────────────────────────────────── */

export async function searchHotels(params: {
  cityCode: string;   // IATA city code e.g. "PAR"
  checkIn: string;    // YYYY-MM-DD
  checkOut: string;   // YYYY-MM-DD
  adults?: number;
  maxResults?: number;
}): Promise<HotelOffer[]> {
  // Step 1: Get hotel IDs by city
  const hotelsData = await apiGet<any>('/v1/reference-data/locations/hotels/by-city', {
    cityCode: params.cityCode,
    hotelSource: 'ALL',
  });

  if (!hotelsData.data || hotelsData.data.length === 0) return [];

  const hotelIds = hotelsData.data
    .slice(0, params.maxResults || 20)
    .map((h: any) => h.hotelId);

  // Step 2: Get offers for those hotels
  const offersData = await apiGet<any>('/v3/shopping/hotel-offers', {
    hotelIds: hotelIds.join(','),
    checkInDate: params.checkIn,
    checkOutDate: params.checkOut,
    adults: String(params.adults || 1),
    currency: 'EUR',
  });

  if (!offersData.data) return [];

  return offersData.data.map((item: any): HotelOffer => {
    const hotel = item.hotel;
    const offer = item.offers?.[0];

    return {
      id: hotel.hotelId,
      name: hotel.name || 'Hotel',
      location: `${hotel.cityCode || params.cityCode}`,
      latitude: hotel.latitude || 0,
      longitude: hotel.longitude || 0,
      rating: hotel.rating ? parseFloat(hotel.rating) : undefined,
      pricePerNight: offer?.price?.total ? parseFloat(offer.price.total) : 0,
      currency: offer?.price?.currency || 'EUR',
      amenities: hotel.amenities || [],
    };
  });
}

/* ── Airport Search ───────────────────────────────────────── */

export async function searchAirports(keyword: string): Promise<Airport[]> {
  const data = await apiGet<any>('/v1/reference-data/locations', {
    subType: 'AIRPORT,CITY',
    keyword,
    'page[limit]': '8',
  });

  if (!data.data) return [];

  return data.data.map((loc: any): Airport => ({
    iataCode: loc.iataCode,
    name: loc.name,
    cityName: loc.address?.cityName || '',
    countryName: loc.address?.countryName || '',
  }));
}

/* ── Exports ──────────────────────────────────────────────── */

export const AmadeusService = {
  searchFlights,
  searchHotels,
  searchAirports,
};
