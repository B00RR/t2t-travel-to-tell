import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, StatusBar, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { useHotelSearch } from '@/hooks/useHotelSearch';
import { SearchBar } from '@/components/SearchBar';
import { Spacing, Typography, Radius } from '@/constants/theme';
import type { FlightOffer, HotelOffer } from '@/services/rapidapi';

/* ── Types ────────────────────────────────────────────────── */

type SearchCategory = 'flights' | 'hotels' | 'transport';

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

/* ── Mock Transport (no API yet) ──────────────────────────── */

const MOCK_TRANSPORT: TransportResult[] = [
  { id: 't1', type: 'train', operator: 'Trenitalia', from: 'Roma Termini', to: 'Firenze SMN', departure: '08:00', arrival: '10:05', duration: '2h 05m', price: 35, currency: 'EUR' },
  { id: 't2', type: 'train', operator: 'Italo', from: 'Napoli Centrale', to: 'Roma Termini', departure: '07:30', arrival: '08:50', duration: '1h 20m', price: 25, currency: 'EUR' },
  { id: 't3', type: 'bus', operator: 'FlixBus', from: 'Napoli', to: 'Roma', departure: '09:00', arrival: '12:30', duration: '3h 30m', price: 12, currency: 'EUR' },
  { id: 't4', type: 'ferry', operator: 'Caremar', from: 'Napoli', to: 'Capri', departure: '08:45', arrival: '09:40', duration: '55m', price: 22, currency: 'EUR' },
  { id: 't5', type: 'train', operator: 'SNCF', from: 'Paris Gare de Lyon', to: 'Lyon Part-Dieu', departure: '10:00', arrival: '12:00', duration: '2h 00m', price: 48, currency: 'EUR' },
];

/* ── Result Cards ─────────────────────────────────────────── */

function FlightCard({ item, theme }: { item: FlightOffer; theme: any }) {
  return (
    <TouchableOpacity style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.airlineRow}>
          <Ionicons name="airplane" size={16} color={theme.teal} />
          <Text style={[styles.operatorName, { color: theme.textPrimary }]}>{item.airline}</Text>
        </View>
        <Text style={[styles.price, { color: theme.teal }]}>
          {item.price.toFixed(0)}€
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
      {item.seatsRemaining && item.seatsRemaining <= 5 && (
        <Text style={[styles.seatsWarning, { color: theme.red }]}>
          Solo {item.seatsRemaining} posti rimasti
        </Text>
      )}
    </TouchableOpacity>
  );
}

function HotelCard({ item, theme }: { item: HotelOffer; theme: any }) {
  return (
    <TouchableOpacity style={[styles.resultCard, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.airlineRow}>
          <Ionicons name="bed" size={16} color={theme.orange} />
          <Text style={[styles.operatorName, { color: theme.textPrimary }]} numberOfLines={1}>{item.name}</Text>
        </View>
        <Text style={[styles.price, { color: theme.orange }]}>
          {item.pricePerNight > 0 ? `${item.pricePerNight.toFixed(0)}€` : 'N/A'}
          <Text style={{ fontSize: 11 }}>/notte</Text>
        </Text>
      </View>
      <View style={styles.hotelDetails}>
        <Text style={[styles.location, { color: theme.textMuted }]}>{item.location}</Text>
        {item.rating !== undefined && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#FFD700" />
            <Text style={[styles.ratingText, { color: theme.textPrimary }]}>{item.rating}</Text>
          </View>
        )}
        {item.amenities.length > 0 && (
          <View style={styles.amenityRow}>
            {item.amenities.slice(0, 3).map((a, i) => (
              <View key={i} style={[styles.amenityBadge, { backgroundColor: theme.bgSubtle }]}>
                <Text style={[styles.amenityText, { color: theme.textMuted }]}>{a}</Text>
              </View>
            ))}
          </View>
        )}
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

  const flightSearch = useFlightSearch();
  const hotelSearch = useHotelSearch();

  const categories: { key: SearchCategory; label: string; icon: string }[] = [
    { key: 'flights', label: t('search.flights', 'Voli'), icon: 'airplane' },
    { key: 'hotels', label: t('search.hotels', 'Hotel'), icon: 'bed' },
    { key: 'transport', label: t('search.transport', 'Trasporti'), icon: 'train' },
  ];

  const handleCategoryChange = useCallback((cat: SearchCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(cat);
    flightSearch.clear();
    hotelSearch.clear();
  }, []);

  const handleSearch = useCallback((query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = query.trim();

    switch (category) {
      case 'flights':
        // Expect format: "NAP LHR 2026-04-15"
        const flightParts = q.split(/\s+/);
        if (flightParts.length >= 2) {
          flightSearch.search({
            origin: flightParts[0].toUpperCase(),
            destination: flightParts[1].toUpperCase(),
            departDate: flightParts[2] || new Date().toISOString().split('T')[0],
          });
        }
        break;
      case 'hotels':
        // Expect format: "PAR 2026-04-15 2026-04-18"
        const hotelParts = q.split(/\s+/);
        if (hotelParts.length >= 1) {
          hotelSearch.search({
            cityCode: hotelParts[0].toUpperCase(),
            checkIn: hotelParts[1] || new Date().toISOString().split('T')[0],
            checkOut: hotelParts[2] || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          });
        }
        break;
    }
  }, [category]);

  const isLoading = category === 'flights' ? flightSearch.loading
    : category === 'hotels' ? hotelSearch.loading
    : false;

  const currentError = category === 'flights' ? flightSearch.error
    : category === 'hotels' ? hotelSearch.error
    : null;

  const getResults = () => {
    switch (category) {
      case 'flights': return flightSearch.results;
      case 'hotels': return hotelSearch.results;
      case 'transport': return MOCK_TRANSPORT;
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    switch (category) {
      case 'flights': return <FlightCard item={item} theme={theme} />;
      case 'hotels': return <HotelCard item={item} theme={theme} />;
      case 'transport': return <TransportCard item={item} theme={theme} />;
    }
  }, [category, theme]);

  const searchPlaceholder = category === 'flights'
    ? 'NAP LHR 2026-04-15'
    : category === 'hotels'
    ? 'PAR 2026-04-15 2026-04-18'
    : 'Rotta...';

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
          placeholder={searchPlaceholder}
          onSearch={handleSearch}
        />
        <Text style={[styles.hintText, { color: theme.textMuted }]}>
          {category === 'flights'
            ? 'Formato: ORIGINE DESTINAZIONE DATA (es. NAP LHR 2026-04-15)'
            : category === 'hotels'
            ? 'Formato: CITTA CHECK-IN CHECK-OUT (es. PAR 2026-04-15 2026-04-18)'
            : 'Trasporti mock — API in arrivo'
          }
        </Text>
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

      {/* Error */}
      {currentError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color={theme.red} />
          <Text style={[styles.errorText, { color: theme.red }]}>{currentError}</Text>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.teal} />
        </View>
      )}

      {/* Results */}
      {!isLoading && (
        <FlatList
          data={getResults()}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                {t('search.empty', 'Cerca voli, hotel o trasporti')}
              </Text>
            </View>
          }
        />
      )}
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
  hintText: { fontSize: 11, marginTop: 6, marginLeft: 4 },
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
  airlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
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
  seatsWarning: { fontSize: 12, fontWeight: '600', marginTop: 8 },
  hotelDetails: { gap: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600' },
  amenityRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  amenityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  amenityText: { fontSize: 11 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  errorText: { fontSize: 13 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
