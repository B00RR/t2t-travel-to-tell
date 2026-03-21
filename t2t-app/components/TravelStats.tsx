import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { Diary } from '@/types/supabase';

interface TravelStatsProps {
  diaries: Diary[];
}

function computeStats(diaries: Diary[]) {
  const published = diaries.filter(d => d.status === 'published');

  const allDestinations = diaries.flatMap(d => d.destinations || []);
  const countries = new Set(allDestinations.map(d => d.trim().toLowerCase())).size;

  let totalDays = 0;
  for (const d of diaries) {
    if (d.start_date && d.end_date) {
      const start = new Date(d.start_date);
      const end = new Date(d.end_date);
      const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0) totalDays += diff + 1;
    }
  }

  const totalLikes = diaries.reduce((sum, d) => sum + (d.like_count || 0), 0);

  return {
    published: published.length,
    countries,
    totalDays,
    totalLikes,
  };
}

export function TravelStats({ diaries }: TravelStatsProps) {
  const { t } = useTranslation();
  const stats = useMemo(() => computeStats(diaries), [diaries]);

  if (diaries.length === 0) return null;

  const items = [
    { icon: 'journal-outline', value: stats.published, label: t('stats.published'), color: '#007AFF' },
    { icon: 'flag-outline', value: stats.countries, label: t('stats.countries'), color: '#FF6B35' },
    { icon: 'sunny-outline', value: stats.totalDays, label: t('stats.days'), color: '#34C759' },
    { icon: 'heart-outline', value: stats.totalLikes, label: t('stats.likes'), color: '#FF3B30' },
  ] as const;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('stats.title')}</Text>
      <View style={styles.grid}>
        {items.map(item => (
          <View key={item.label} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fafafa',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textAlign: 'center',
  },
});
