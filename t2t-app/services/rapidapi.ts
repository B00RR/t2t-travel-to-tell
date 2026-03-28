/**
 * RapidAPI Travel Services for T2T
 * Replaces Amadeus with RapidAPI: Booking COM + Tripadvisor + AeroDataBox
 *
 * API Key: EXPO_PUBLIC_RAPIDAPI_KEY
 * Hosts:
 *   - booking-com.p.rapidapi.com  (Hotels, Flights, Car Rental, Attractions)
 *   - tripadvisor16.p.rapidapi.com (Restaurants, Attractions, Hotels)
 *   - aerodatabox.p.rapidapi.com (Airport flights, flight status)
 */

const RAPIDAPI_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '';

/* ── Shared fetch helper ──────────────────────────────────── */

interface RapidAPIOptions {
  host: string;
  path: string;
  params?: Record<string, string>;
}

async function rapidFetch<T>(opts: RapidAPIOptions): Promise<T> {
  const url = new URL(`https://${opts.host}${opts.path}`);
  if (opts.params) {
    Object.entries(opts.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': opts.host,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RapidAPI ${opts.host}${opts.path}: ${res.status} ${body}`);
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

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating?: number;
  priceLevel?: string;
  address: string;
  imageUrl?: string;
}

export interface Attraction {
  id: string;
  name: string;
  category: string;
  rating?: number;
  priceLevel?: string;
  address: string;
  imageUrl?: string;
}

export interface AirportFlight {
  flightNumber: string;
  airline: string;
  airport: string;
  airportIata: string;
  scheduledTime: string;
  revisedTime?: string;
  terminal?: string;
  gate?: string;
  status: string;
  direction: 'departure' | 'arrival';
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

    const priceTotal = f.price_total?.units + (f.price_total?.nanos || 0) / 1e9 || 0;

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

/* ══════════════════════════════════════════════════════════
   TRIPADVISOR — Restaurants, Attractions, Hotels
   Host: tripadvisor16.p.rapidapi.com
   ══════════════════════════════════════════════════════════ */

export async function searchRestaurants(params: {
  locationId: string;   // Tripadvisor geoId
  page?: number;
}): Promise<Restaurant[]> {
  const data = await rapidFetch<any>({
    host: 'tripadvisor16.p.rapidapi.com',
    path: '/api/v1/restaurant/searchRestaurants',
    params: {
      locationId: params.locationId,
      page: String(params.page || 1),
    },
  });

  if (!data.data?.data) return [];

  return data.data.data.map((r: any): Restaurant => ({
    id: String(r.locationId || r.restaurantsId || ''),
    name: r.title || r.name || 'Restaurant',
    cuisine: r.establishmentTypeAndCuisineTags || [],
    rating: r.averageRating || undefined,
    priceLevel: r.priceTagV2 || undefined,
    address: r.address?.addressLine1 || r.address?.city || '',
    imageUrl: r.heroImgUrl || r.thumbnail?.url || undefined,
  }));
}

export async function searchTripadvisorHotels(params: {
  geoId: string;       // Tripadvisor geoId
  checkIn?: string;    // YYYY-MM-DD
  checkOut?: string;   // YYYY-MM-DD
  page?: number;
}): Promise<HotelOffer[]> {
  const queryParams: Record<string, string> = {
    geoId: params.geoId,
    page: String(params.page || 1),
    currencyCode: 'EUR',
  };
  if (params.checkIn) queryParams.checkIn = params.checkIn;
  if (params.checkOut) queryParams.checkOut = params.checkOut;

  const data = await rapidFetch<any>({
    host: 'tripadvisor16.p.rapidapi.com',
    path: '/api/v1/hotels/searchHotels',
    params: queryParams,
  });

  if (!data.data?.data) return [];

  return data.data.data.map((h: any): HotelOffer => ({
    id: String(h.id || ''),
    name: h.title || h.name || 'Hotel',
    location: h.primaryInfo || '',
    latitude: h.latitude || 0,
    longitude: h.longitude || 0,
    rating: h.bubbleRating?.rating || undefined,
    pricePerNight: h.priceForDisplay ? parseFloat(h.priceForDisplay.replace(/[^0-9.]/g, '')) : 0,
    currency: 'EUR',
    amenities: [],
    imageUrl: h.cardPhotos?.[0]?.sizes?.urlTemplate || undefined,
  }));
}

/* ══════════════════════════════════════════════════════════
   AERODATABOX — Airport flights, flight status
   Host: aerodatabox.p.rapidapi.com
   ══════════════════════════════════════════════════════════ */

export async function getAirportFlights(params: {
  iata: string;           // Airport IATA code, e.g. "NAP"
  direction?: 'departures' | 'arrivals';
  hoursBefore?: number;   // default 2
  hoursAfter?: number;    // default 12
}): Promise<AirportFlight[]> {
  const now = new Date();
  const offsetMin = -(params.hoursBefore || 2) * 60;
  const offsetMax = (params.hoursAfter || 12) * 60;

  const data = await rapidFetch<any>({
    host: 'aerodatabox.p.rapidapi.com',
    path: `/flights/airports/iata/${params.iata}`,
    params: {
      offsetMinutes: String(offsetMin),
      offsetMinutes2: String(offsetMax),
      withLeg: 'false',
      withCancelled: 'true',
      withCodeshared: 'true',
      withCargo: 'false',
      withPrivate: 'false',
      withLocation: 'false',
    },
  });

  const direction = params.direction || 'departures';
  const flights = direction === 'departures' ? (data.departures || []) : (data.arrivals || []);

  return flights.map((f: any): AirportFlight => {
    const mov = f.movement || {};
    const airport = mov.airport || {};
    const scheduled = mov.scheduledTime || {};
    const revised = mov.revisedTime || {};

    return {
      flightNumber: f.number || f.callSign || '?',
      airline: f.airline?.name || '?',
      airport: airport.name || '',
      airportIata: airport.iata || '',
      scheduledTime: scheduled.local || scheduled.utc || '',
      revisedTime: revised.local || revised.utc || undefined,
      terminal: mov.terminal,
      gate: mov.gate,
      status: f.status || mov.quality?.[0] || 'Unknown',
      direction: direction === 'departures' ? 'departure' : 'arrival',
    };
  });
}

export interface Airport {
  iataCode: string;
  name: string;
  cityName: string;
  countryName: string;
}

// Common airports for quick local search (no API call needed)
const COMMON_AIRPORTS: Airport[] = [
  { iataCode: 'NAP', name: 'Naples International Airport', cityName: 'Naples', countryName: 'Italy' },
  { iataCode: 'FCO', name: 'Leonardo da Vinci–Fiumicino', cityName: 'Rome', countryName: 'Italy' },
  { iataCode: 'CIA', name: 'Rome Ciampino', cityName: 'Rome', countryName: 'Italy' },
  { iataCode: 'MXP', name: 'Milan Malpensa Airport', cityName: 'Milan', countryName: 'Italy' },
  { iataCode: 'LIN', name: 'Milan Linate Airport', cityName: 'Milan', countryName: 'Italy' },
  { iataCode: 'BLQ', name: 'Bologna Airport', cityName: 'Bologna', countryName: 'Italy' },
  { iataCode: 'VCE', name: 'Venice Marco Polo Airport', cityName: 'Venice', countryName: 'Italy' },
  { iataCode: 'FLR', name: 'Florence Airport', cityName: 'Florence', countryName: 'Italy' },
  { iataCode: 'PMO', name: 'Palermo Airport', cityName: 'Palermo', countryName: 'Italy' },
  { iataCode: 'CTA', name: 'Catania Airport', cityName: 'Catania', countryName: 'Italy' },
  { iataCode: 'BRI', name: 'Bari Airport', cityName: 'Bari', countryName: 'Italy' },
  { iataCode: 'LHR', name: 'London Heathrow', cityName: 'London', countryName: 'United Kingdom' },
  { iataCode: 'LGW', name: 'London Gatwick', cityName: 'London', countryName: 'United Kingdom' },
  { iataCode: 'CDG', name: 'Paris Charles de Gaulle', cityName: 'Paris', countryName: 'France' },
  { iataCode: 'ORY', name: 'Paris Orly', cityName: 'Paris', countryName: 'France' },
  { iataCode: 'BCN', name: 'Barcelona El Prat', cityName: 'Barcelona', countryName: 'Spain' },
  { iataCode: 'MAD', name: 'Madrid Barajas', cityName: 'Madrid', countryName: 'Spain' },
  { iataCode: 'AMS', name: 'Amsterdam Schiphol', cityName: 'Amsterdam', countryName: 'Netherlands' },
  { iataCode: 'FRA', name: 'Frankfurt Airport', cityName: 'Frankfurt', countryName: 'Germany' },
  { iataCode: 'MUC', name: 'Munich Airport', cityName: 'Munich', countryName: 'Germany' },
  { iataCode: 'BER', name: 'Berlin Brandenburg', cityName: 'Berlin', countryName: 'Germany' },
  { iataCode: 'JFK', name: 'John F. Kennedy International', cityName: 'New York', countryName: 'United States' },
  { iataCode: 'LAX', name: 'Los Angeles International', cityName: 'Los Angeles', countryName: 'United States' },
  { iataCode: 'DXB', name: 'Dubai International', cityName: 'Dubai', countryName: 'UAE' },
  { iataCode: 'IST', name: 'Istanbul Airport', cityName: 'Istanbul', countryName: 'Turkey' },
  { iataCode: 'ATH', name: 'Athens International', cityName: 'Athens', countryName: 'Greece' },
  { iataCode: 'LIS', name: 'Lisbon Humberto Delgado', cityName: 'Lisbon', countryName: 'Portugal' },
  { iataCode: 'BKK', name: 'Bangkok Suvarnabhumi', cityName: 'Bangkok', countryName: 'Thailand' },
  { iataCode: 'HND', name: 'Tokyo Haneda', cityName: 'Tokyo', countryName: 'Japan' },
  { iataCode: 'NRT', name: 'Tokyo Narita', cityName: 'Tokyo', countryName: 'Japan' },
  { iataCode: 'SIN', name: 'Singapore Changi', cityName: 'Singapore', countryName: 'Singapore' },
];

export async function searchAirports(keyword: string): Promise<Airport[]> {
  if (keyword.length < 2) return [];
  const q = keyword.toUpperCase();
  return COMMON_AIRPORTS.filter(a =>
    a.iataCode.includes(q) ||
    a.name.toUpperCase().includes(q) ||
    a.cityName.toUpperCase().includes(q) ||
    a.countryName.toUpperCase().includes(q)
  ).slice(0, 8);
}

export const TravelAPI = {
  // Booking COM
  searchHotels,
  searchFlights,
  // Tripadvisor
  searchRestaurants,
  searchTripadvisorHotels,
  // AeroDataBox
  getAirportFlights,
  // Airport search
  searchAirports,
};
