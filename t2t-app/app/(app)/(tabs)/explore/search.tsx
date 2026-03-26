import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SearchBar } from '@/components/SearchBar';
import { Spacing, Typography, Radius } from '@/constants/theme';

/* ── Types ────────────────────────────────────────────────── */

type SearchCategory = 'flights' | 'hotels' | 'transport';

interface FlightResult {
  id: string;
  airline: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
}

interface HotelResult {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  imageUrl?: string;
}

interface TransportResult {
  id: string;
  type: 'train' | 'bus' | 'ferry';
  operator: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: string;
}

/* ── Mock Data ────────────────────────────────────────────── */

const MOCK_FLIGHTS: FlightResult[] = [
  { id: 'f1', airline: 'Ryanair', from: 'Napoli (NAP)', to: 'Londra (STN)', departure: '07:15', arrival: '09:00', duration: '2h 45m', price: 45, currency: 'EUR', stops: 0 },
  { id: 'f2', airline: 'EasyJet', from: 'Napoli (NAP)', to: 'Parigi (ORY)', departure: '10:30', arrival: '13:00', duration: '2h 30m', price: 62, currency: 'EUR', stops: 0 },
  { id: 'f3', airline: 'Wizz Air', from: 'Roma (FCO)', to: 'Barcellona (BCN)', departure: '14:20', arrival: '16:45', duration: '2h 25m', price: 38, currency: 'EUR', stops: 0 },
  { id: 'f4', airline: 'ITA Airways', from: 'Milano (MXP)', to: 'New York (JFK)', departure: '09:00', arrival: '13:30', duration: '9h 30m', price: 320, currency: 'EUR', stops: 0 },
  { id: 'f5', airline: 'Vueling', from: 'Napoli (NAP)', to: 'Madrid (MAD)', departure: '16:00', arrival: '18:45', duration: '2h 45m', price: 55, currency: 'EUR', stops: 0 },
];

const MOCK_HOTELS: HotelResult[] = [
  { id: 'h1', name: 'Hotel Vesuvio', location: 'Napoli, Italia', rating: 4.5, reviews: 1280, pricePerNight: 95, currency: 'EUR', amenities: ['WiFi', 'Colazione', 'Vista mare'] },
  { id: 'h2', name: 'Le Petit Marais', location: 'Parigi, Francia', rating: 4.7, reviews: 890, pricePerNight: 142, currency: 'EUR', amenities: ['WiFi', 'Bar', 'Centro'] },
  { id: 'h3', name: 'Hostal Barcelona', location: 'Barcellona, Spagna', rating: 4.2, reviews: 2100, pricePerNight: 68, currency: 'EUR', amenities: ['WiFi', 'Terrazza'] },
  { id: 'h4', name: 'The Manhattan', location: 'New York, USA', rating: 4.8, reviews: 3400, pricePerNight: 285, currency: 'USD', amenities: ['WiFi', 'Gym', 'Rooftop'] },
  { id: 'h5', name: 'Casa Madrid', location: 'Madrid, Spagna', rating: 4.3, reviews: 670, pricePerNight: 78, currency: 'EUR', amenities: ['WiFi', 'Colazione', 'Parcheggio'] },
];

const MOCK_TRANSPORT: TransportResult[] = [
  { id: 't1', type: 'train', operator: 'Trenitalia', from: 'Roma Termini', to: 'Firenze SMN', departure: '08:00', arrival: '10:05', duration: '2h 05m', price: 35, currency: 'EUR' },
  { id: 't2', type: 'train', operator: 'Italo', from: 'Napoli Centrale', to: 'Roma Termini', departure: '07:30', arrival: '08:50', duration: '1h 20m', price: 25, currency: 'EUR' },
  { id: 't3', type: 'bus', operator: 'FlixBus', from: 'Napoli', to: 'Roma', departure: '09:00', arrival: '12:30', duration: '3h 30m', price: 12, currency: 'EUR' },
  { id: 't4', type: 'ferry', operator: 'Caremar', from: 'Napoli', to: 'Capri', departure: '08:45', arrival: '09:40', duration: '55m', price: 22, currency: 'EUR' },
  { id: 't5', type: 'train', operator: 'SNCF', from: 'Paris Gare de Lyon', to: 'Lyon Part-Dieu', departure: '10:00', arrival: '12:00', duration: '2h 00m', price: 48, currency: 'EUR' },
];

/* ── Result Cards ─────────────────────────────────────────── */

function FlightCard({ item, theme }: { item: FlightResult; theme: any }) {
  return (
    <TouchableOpacity style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.airlineRow}>
          <Ionicons name="airplane" size={16} color={theme.teal} />
          <Text style={[styles.operatorName, { color: theme.textPrimary }]}>{item.airline}</Text>
        </View>
        <Text style={[styles.price, { color: theme.teal }]}>
          {item.price}€
        </Text>
      </View>
      <View style={styles.routeRow}>
        <View style={styles.routePoint}>
          <Text style={[styles.time, { color: theme.textPrimary }]}>{item.departure}</Text>
          <Text style={[styles.location, { color: theme.textMuted }]}>{item.from}</Text>
        </View>
        <View style={styles.routeLine}>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <Text style={[styles.duration, { color: theme.textMuted }]}>{item.duration}</Text>
          <Text style={[styles.stops, { color: theme.textMuted }]}>
            {item.stops === 0 ? 'Diretto' : `${item.stops} scalo`}
          </Text>
        </View>
        <View style={styles.routePoint}>
          <Text style={[styles.time, { color: theme.textPrimary }]}>{item.arrival}</Text>
          <Text style={[styles.location, { color: theme.textMuted }]}>{item.to}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function HotelCard({ item, theme }: { item: HotelResult; theme: any }) {
  return (
    <TouchableOpacity style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.airlineRow}>
          <Ionicons name="bed" size={16} color={theme.orange} />
          <Text style={[styles.operatorName, { color: theme.textPrimary }]}>{item.name}</Text>
        </View>
        <Text style={[styles.price, { color: theme.orange }]}>
          {item.pricePerNight}€<Text style={{ fontSize: 11 }}>/notte</Text>
        </Text>
      </View>
      <View style={styles.hotelDetails}>
        <Text style={[styles.location, { color: theme.textMuted }]}>{item.location}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color="#FFD700" />
          <Text style={[styles.ratingText, { color: theme.textPrimary }]}>{item.rating}</Text>
          <Text style={[styles.location, { color: theme.textMuted }]}>({item.reviews})</Text>
        </View>
        <View style={styles.amenityRow}>
          {item.amenities.slice(0, 3).map((a, i) => (
            <View key={i} style={[styles.amenityBadge, { backgroundColor: theme.bgSubtle }]}>
              <Text style={[styles.amenityText, { color: theme.textMuted }]}>{a}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TransportCard({ item, theme }: { item: TransportResult; theme: any }) {
  const icons: Record<string, string> = { train: 'train', bus: 'bus', ferry: 'boat' };
  return (
    <TouchableOpacity style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.airlineRow}>
          <Ionicons name={icons[item.type] as any} size={16} color={theme.sage} />
          <Text style={[styles.operatorName, { color: theme.textPrimary }]}>{item.operator}</Text>
        </View>
        <Text style={[styles.price, { color: theme.sage }]}>
          {item.price}€
        </Text>
      </View>
      <View style={styles.routeRow}>
        <View style={styles.routePoint}>
          <Text style={[styles.time, { color: theme.textPrimary }]}>{item.departure}</Text>
          <Text style={[styles.location, { color: theme.textMuted }]}>{item.from}</Text>
        </View>
        <View style={styles.routeLine}>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <Text style={[styles.duration, { color: theme.textMuted }]}>{item.duration}</Text>
        </View>
        <View style={styles.routePoint}>
          <Text style={[styles.time, { color: theme.textPrimary }]}>{item.arrival}</Text>
          <Text style={[styles.location, { color: theme.textMuted }]}>{item.to}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ── Main Screen ──────────────────────────────────────────── */

export default function TravelSearchScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [category, setCategory] = useState<SearchCategory>('flights');
  const [results, setResults] = useState<any[]>(MOCK_FLIGHTS);

  const categories: { key: SearchCategory; label: string; icon: string }[] = [
    { key: 'flights', label: t('search.flights', 'Voli'), icon: 'airplane' },
    { key: 'hotels', label: t('search.hotels', 'Hotel'), icon: 'bed' },
    { key: 'transport', label: t('search.transport', 'Trasporti'), icon: 'train' },
  ];

  const handleCategoryChange = useCallback((cat: SearchCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(cat);
    switch (cat) {
      case 'flights': setResults(MOCK_FLIGHTS); break;
      case 'hotels': setResults(MOCK_HOTELS); break;
      case 'transport': setResults(MOCK_TRANSPORT); break;
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    // Mock search — filter by query
    const q = query.toLowerCase();
    switch (category) {
      case 'flights':
        setResults(MOCK_FLIGHTS.filter(f =>
          f.from.toLowerCase().includes(q) || f.to.toLowerCase().includes(q)
        ));
        break;
      case 'hotels':
        setResults(MOCK_HOTELS.filter(h =>
          h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q)
        ));
        break;
      case 'transport':
        setResults(MOCK_TRANSPORT.filter(t =>
          t.from.toLowerCase().includes(q) || t.to.toLowerCase().includes(q)
        ));
        break;
    }
  }, [category]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    switch (category) {
      case 'flights': return <FlightCard item={item} theme={theme} />;
      case 'hotels': return <HotelCard item={item} theme={theme} />;
      case 'transport': return <TransportCard item={item} theme={theme} />;
    }
  }, [category, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {t('search.title', 'Cerca viaggio')}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <SearchBar
          placeholder={category === 'flights' ? 'Da dove parti?' : category === 'hotels' ? 'Dove vai?' : 'Rotta...'}
          onSearch={handleSearch}
        />
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {categories.map((cat) => {
          const isActive = category === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryTab,
                {
                  backgroundColor: isActive ? theme.teal : theme.bgElevated,
                  borderColor: isActive ? theme.teal : theme.border,
                },
              ]}
              onPress={() => handleCategoryChange(cat.key)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={isActive ? '#fff' : theme.textMuted}
              />
              <Text style={[
                styles.categoryLabel,
                { color: isActive ? '#fff' : theme.textMuted },
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {t('search.empty', 'Nessun risultato')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  searchWrap: { padding: 16 },
  tabsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryLabel: { fontSize: 14, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  resultCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  airlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  operatorName: { fontSize: 15, fontWeight: '700' },
  price: { fontSize: 18, fontWeight: '800' },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routePoint: { alignItems: 'center', width: 80 },
  time: { fontSize: 16, fontWeight: '700' },
  location: { fontSize: 11, marginTop: 2 },
  routeLine: { flex: 1, alignItems: 'center', gap: 4 },
  line: { height: 1, width: '100%' },
  duration: { fontSize: 12 },
  stops: { fontSize: 11 },
  hotelDetails: { gap: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600' },
  amenityRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  amenityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  amenityText: { fontSize: 11 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
