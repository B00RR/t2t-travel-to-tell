import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Radius, Typography } from '@/constants/theme';
import InteractiveGlobe from '@/components/InteractiveGlobe';
import { PeopleToFollow } from '@/components/PeopleToFollow';
import { SortBar, SortMode, DurationFilter } from './SortBar';

interface ListHeaderProps {
  isSearchMode: boolean;
  sortMode: SortMode;
  durationFilter: DurationFilter;
  userId: string | undefined;
  onSortChange: (mode: SortMode) => void;
  onDurationChange: (filter: DurationFilter) => void;
}

export const ListHeader = React.memo(function ListHeader({
  isSearchMode,
  sortMode,
  durationFilter,
  userId,
  onSortChange,
  onDurationChange,
}: ListHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppTheme();

  if (isSearchMode) return null;

  const isDark = theme.bg === '#1A1A1A' || theme.bg === '#000000';

  return (
    <View>
      {/* WOW ELEMENT: 3D Interactive Moleskine Globe */}
      <View style={{ marginVertical: Spacing.md }}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, paddingHorizontal: 20 }]}>
          Il Tuo Mondo Diari
        </Text>
        <InteractiveGlobe isDarkTheme={isDark} />
      </View>

      {/* Travel search CTA */}
      <TouchableOpacity
        style={[styles.travelSearchCta, { backgroundColor: theme.bgElevated, borderColor: theme.border }]}
        onPress={() => router.push('/(app)/(tabs)/explore/search')}
      >
        <View style={[styles.travelSearchIcon, { backgroundColor: theme.tealAlpha15 }]}>
          <Ionicons name="airplane" size={20} color={theme.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.travelSearchTitle, { color: theme.textPrimary }]}>
            {t('explore.travel_search', 'Cerca viaggio')}
          </Text>
          <Text style={[styles.travelSearchSub, { color: theme.textMuted }]}>
            {t('explore.travel_search_sub', 'Voli, hotel e trasporti')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      </TouchableOpacity>

      <SortBar
        isSearchMode={isSearchMode}
        sortMode={sortMode}
        durationFilter={durationFilter}
        onSortChange={onSortChange}
        onDurationChange={onDurationChange}
      />
      {userId && sortMode === 'recent' && (
        <PeopleToFollow currentUserId={userId} />
      )}
      {sortMode === 'recent' && (
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, paddingHorizontal: 20 }]}>{t('explore.all_diaries')}</Text>
      )}
      {sortMode === 'popular' && (
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('explore.sort_popular')}</Text>
      )}
      {sortMode === 'trending' && (
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('explore.sort_trending')}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  sectionTitle: {
    ...Typography.h2,
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 10,
  },
  travelSearchCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  travelSearchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  travelSearchTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  travelSearchSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
