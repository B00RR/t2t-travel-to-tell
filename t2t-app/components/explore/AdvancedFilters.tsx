import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius, Typography } from '@/constants/theme';

export type BudgetFilter = 'all' | 'free' | 'budget' | 'moderate' | 'expensive' | 'luxury';
export type TripTypeFilter = 'all' | 'adventure' | 'relaxation' | 'cultural' | 'nature' | 'city' | 'beach' | 'food';
export type SeasonFilter = 'all' | 'spring' | 'summer' | 'fall' | 'winter';

export interface AdvancedFilters {
  budget: BudgetFilter;
  tripType: TripTypeFilter;
  season: SeasonFilter;
}

interface AdvancedFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
}

const BUDGET_OPTIONS: { key: BudgetFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'filter.all' },
  { key: 'free', labelKey: 'filter.budget_free' },
  { key: 'budget', labelKey: 'filter.budget_budget' },
  { key: 'moderate', labelKey: 'filter.budget_moderate' },
  { key: 'expensive', labelKey: 'filter.budget_expensive' },
  { key: 'luxury', labelKey: 'filter.budget_luxury' },
];

const TRIP_TYPE_OPTIONS: { key: TripTypeFilter; labelKey: string; icon: string }[] = [
  { key: 'all', labelKey: 'filter.trip_type_all', icon: 'apps' },
  { key: 'adventure', labelKey: 'filter.trip_type_adventure', icon: 'hiking' },
  { key: 'relaxation', labelKey: 'filter.trip_type_relaxation', icon: 'sunny' },
  { key: 'cultural', labelKey: 'filter.trip_type_cultural', icon: 'library' },
  { key: 'nature', labelKey: 'filter.trip_type_nature', icon: 'leaf' },
  { key: 'city', labelKey: 'filter.trip_type_city', icon: 'business' },
  { key: 'beach', labelKey: 'filter.trip_type_beach', icon: 'water' },
  { key: 'food', labelKey: 'filter.trip_type_food', icon: 'restaurant' },
];

const SEASON_OPTIONS: { key: SeasonFilter; labelKey: string; icon: string }[] = [
  { key: 'all', labelKey: 'filter.season_all', icon: 'calendar' },
  { key: 'spring', labelKey: 'filter.season_spring', icon: 'flower' },
  { key: 'summer', labelKey: 'filter.season_summer', icon: 'sunny' },
  { key: 'fall', labelKey: 'filter.season_fall', icon: 'leaf' },
  { key: 'winter', labelKey: 'filter.season_winter', icon: 'snow' },
];

function getSeasonFromDate(startDate: string | null): SeasonFilter | null {
  if (!startDate) return null;
  const month = new Date(startDate).getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

function matchesBudget(budgetSummary: unknown, filter: BudgetFilter): boolean {
  if (filter === 'all') return true;
  const budget = budgetSummary as { total?: number } | null;
  const total = budget?.total ?? 0;
  switch (filter) {
    case 'free': return total === 0;
    case 'budget': return total > 0 && total <= 50;
    case 'moderate': return total > 50 && total <= 100;
    case 'expensive': return total > 100 && total <= 200;
    case 'luxury': return total > 200;
    default: return true;
  }
}

function matchesTripType(tags: string[] | null, filter: TripTypeFilter): boolean {
  if (filter === 'all') return true;
  if (!tags || tags.length === 0) return false;
  return tags.some(tag => tag.toLowerCase().includes(filter));
}

function matchesSeason(startDate: string | null, filter: SeasonFilter): boolean {
  if (filter === 'all') return true;
  if (!startDate) return false;
  return getSeasonFromDate(startDate) === filter;
}

export function matchesAdvancedFilters(
  diary: { tags?: string[] | null; start_date?: string | null; budget_summary?: unknown },
  filters: AdvancedFilters
): boolean {
  if (!matchesBudget(diary.budget_summary, filters.budget)) return false;
  if (!matchesTripType(diary.tags ?? null, filters.tripType)) return false;
  if (!matchesSeason(diary.start_date ?? null, filters.season)) return false;
  return true;
}

function FilterChip({
  label,
  icon,
  selected,
  onPress,
  theme,
}: {
  label: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: theme.bgElevated, borderColor: theme.border },
        selected && { backgroundColor: theme.tealAlpha15, borderColor: theme.teal },
      ]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={14}
          color={selected ? theme.teal : theme.textSecondary}
        />
      )}
      <Text
        style={[
          styles.chipText,
          { color: theme.textSecondary },
          selected && { color: theme.teal },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FilterSection({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

export function AdvancedFiltersModal({
  visible,
  onClose,
  filters,
  onFiltersChange,
}: AdvancedFiltersModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleReset = useCallback(() => {
    const resetFilters: AdvancedFilters = { budget: 'all', tripType: 'all', season: 'all' };
    setLocalFilters(resetFilters);
  }, []);

  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const activeFiltersCount = [
    localFilters.budget !== 'all',
    localFilters.tripType !== 'all',
    localFilters.season !== 'all',
  ].filter(Boolean).length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={26} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              {t('filter.title')}
            </Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={[styles.resetText, { color: theme.teal }]}>
                {t('filter.reset')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <FilterSection title={t('filter.budget_title')} theme={theme}>
              {BUDGET_OPTIONS.map(opt => (
                <FilterChip
                  key={opt.key}
                  label={t(opt.labelKey)}
                  selected={localFilters.budget === opt.key}
                  onPress={() => setLocalFilters(f => ({ ...f, budget: opt.key }))}
                  theme={theme}
                />
              ))}
            </FilterSection>

            <FilterSection title={t('filter.trip_type_title')} theme={theme}>
              {TRIP_TYPE_OPTIONS.map(opt => (
                <FilterChip
                  key={opt.key}
                  label={t(opt.labelKey)}
                  icon={opt.icon}
                  selected={localFilters.tripType === opt.key}
                  onPress={() => setLocalFilters(f => ({ ...f, tripType: opt.key }))}
                  theme={theme}
                />
              ))}
            </FilterSection>

            <FilterSection title={t('filter.season_title')} theme={theme}>
              {SEASON_OPTIONS.map(opt => (
                <FilterChip
                  key={opt.key}
                  label={t(opt.labelKey)}
                  icon={opt.icon}
                  selected={localFilters.season === opt.key}
                  onPress={() => setLocalFilters(f => ({ ...f, season: opt.key }))}
                  theme={theme}
                />
              ))}
            </FilterSection>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: theme.teal }]}
              onPress={handleApply}
            >
              <Text style={styles.applyBtnText}>
                {t('filter.apply')}
                {activeFiltersCount > 0 ? ` (${activeFiltersCount} ${t('filter.active')})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function FilterBadge({
  count,
  theme,
  onPress,
}: {
  count: number;
  theme: ReturnType<typeof useAppTheme>;
  onPress: () => void;
}) {
  if (count === 0) return null;
  return (
    <TouchableOpacity
      style={[styles.filterBadge, { backgroundColor: theme.teal }]}
      onPress={onPress}
    >
      <Text style={styles.filterBadgeText}>{count}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    ...Typography.label,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyBtn: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
