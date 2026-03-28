import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Typography } from '@/constants/theme';

export type SortMode = 'recent' | 'popular' | 'trending';
export type DurationFilter = 'all' | 'short' | 'medium' | 'long';

interface SortBarProps {
  isSearchMode: boolean;
  sortMode: SortMode;
  durationFilter: DurationFilter;
  onSortChange: (mode: SortMode) => void;
  onDurationChange: (filter: DurationFilter) => void;
}

export const SortBar = React.memo(function SortBar({
  isSearchMode,
  sortMode,
  durationFilter,
  onSortChange,
  onDurationChange,
}: SortBarProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  if (isSearchMode) return null;

  const sorts: { key: SortMode; label: string; icon: string }[] = [
    { key: 'recent', label: t('explore.sort_recent'), icon: 'time-outline' },
    { key: 'popular', label: t('explore.sort_popular'), icon: 'heart-outline' },
    { key: 'trending', label: t('explore.sort_trending'), icon: 'flame-outline' },
  ];

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortBar}
      >
        {sorts.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[
              styles.sortChip,
              { backgroundColor: theme.bgElevated, borderColor: theme.border },
              sortMode === s.key && { backgroundColor: theme.teal, borderColor: theme.teal },
            ]}
            onPress={() => onSortChange(s.key)}
          >
            <Ionicons
              name={s.icon as keyof typeof Ionicons.glyphMap}
              size={15}
              color={sortMode === s.key ? '#fff' : theme.textSecondary}
            />
            <Text style={[
              styles.sortChipText,
              { color: theme.textSecondary },
              sortMode === s.key && { color: '#fff' },
            ]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.durationBar}
      >
        {(['all', 'short', 'medium', 'long'] as DurationFilter[]).map(d => (
          <TouchableOpacity
            key={d}
            style={[
              styles.durationChip,
              { backgroundColor: theme.bgElevated, borderColor: theme.border },
              durationFilter === d && { backgroundColor: theme.tealAlpha15, borderColor: theme.teal },
            ]}
            onPress={() => onDurationChange(d)}
          >
            <Text style={[
              styles.durationChipText,
              { color: theme.textSecondary },
              durationFilter === d && { color: theme.teal },
            ]}>
              {t(`explore.duration_${d}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  sortBar: {
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  sortChipText: {
    ...Typography.label,
  },
  durationBar: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  durationChipText: {
    ...Typography.label,
  },
});
