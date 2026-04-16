import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';
import type { Diary } from '@/types/supabase';

interface ProfileTimelineProps {
  diaries: Diary[];
}

interface TimelineItem {
  diary: Diary;
  date: Date;
  year: number;
}

interface TimelineSection {
  year: number;
  items: TimelineItem[];
}

function pickDate(diary: Diary): Date {
  // Prefer trip start_date, fall back to created_at so every diary places somewhere.
  const src = diary.start_date || diary.created_at;
  const d = new Date(src);
  return Number.isNaN(d.getTime()) ? new Date(diary.created_at) : d;
}

function formatDateRange(diary: Diary, locale: string): string {
  const start = diary.start_date ? new Date(diary.start_date) : null;
  const end = diary.end_date ? new Date(diary.end_date) : null;
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  if (start && end) {
    if (start.toDateString() === end.toDateString()) return fmt.format(start);
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }
  if (start) return fmt.format(start);
  // Only created_at available
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(
    new Date(diary.created_at)
  );
}

const ProfileTimelineComponent = ({ diaries }: ProfileTimelineProps) => {
  const router = useRouter();
  const theme = useAppTheme();
  const { t, i18n } = useTranslation();

  const sections = useMemo<TimelineSection[]>(() => {
    const items: TimelineItem[] = diaries.map((d) => {
      const date = pickDate(d);
      return { diary: d, date, year: date.getFullYear() };
    });
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    const byYear = new Map<number, TimelineItem[]>();
    for (const it of items) {
      const arr = byYear.get(it.year) ?? [];
      arr.push(it);
      byYear.set(it.year, arr);
    }

    return Array.from(byYear.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, items]) => ({ year, items }));
  }, [diaries]);

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="time-outline" size={48} color={theme.border} />
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          {t('profile.timeline_empty')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sections.map((section) => (
        <View key={section.year} style={styles.section}>
          <View style={styles.yearHeaderRow}>
            <View style={[styles.yearBubble, { backgroundColor: theme.teal }]}>
              <Text style={[styles.yearText, { color: theme.bg }]}>{section.year}</Text>
            </View>
            <View style={[styles.yearLine, { backgroundColor: theme.border }]} />
          </View>

          {section.items.map((item, idx) => {
            const isLast = idx === section.items.length - 1;
            return (
              <View key={item.diary.id} style={styles.row}>
                <View style={styles.rail}>
                  <View style={[styles.dot, { backgroundColor: theme.teal, borderColor: theme.bg }]} />
                  {!isLast && <View style={[styles.line, { backgroundColor: theme.border }]} />}
                </View>
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: theme.bgElevated }]}
                  onPress={() => router.push(`/diary/${item.diary.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={item.diary.title}
                >
                  <Text style={[styles.date, { color: theme.teal }]}>
                    {formatDateRange(item.diary, i18n.language)}
                  </Text>
                  <Text
                    style={[styles.title, { color: theme.textPrimary }]}
                    numberOfLines={2}
                  >
                    {item.diary.title}
                  </Text>
                  {item.diary.destinations && item.diary.destinations.length > 0 && (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={13} color={theme.textMuted} />
                      <Text
                        style={[styles.meta, { color: theme.textMuted }]}
                        numberOfLines={1}
                      >
                        {item.diary.destinations.join(', ')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export const ProfileTimeline = React.memo(ProfileTimelineComponent);

const RAIL_WIDTH = 32;
const DOT_SIZE = 12;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  section: {
    marginBottom: 8,
  },
  yearHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  yearBubble: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  yearText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  yearLine: {
    flex: 1,
    height: 1,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  rail: {
    width: RAIL_WIDTH,
    alignItems: 'center',
    paddingTop: 18,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
  },
  line: {
    flex: 1,
    width: 2,
    marginTop: 4,
  },
  card: {
    flex: 1,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 12,
  },
  date: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: 12,
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
  },
});
