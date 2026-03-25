import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { KenBurnsImage } from '@/components/KenBurnsImage';
import { EntryCard } from '@/components/EntryCard';
import { Ionicons } from '@expo/vector-icons';
import { useDayEntries } from '@/hooks/useDayEntries';
import { Palette } from '@/constants/theme';
import type { DayEntry } from '@/types/dayEntry';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DayChapterProps {
  dayId: string;
  dayNumber: number;
  dayTitle: string | null;
  dayDate: string | null;
  diaryId: string;
  isActive: boolean;
}

/**
 * A single "chapter" in the Journey Player.
 * Full-screen hero image with Ken Burns, then scrollable entries.
 * Mood entries shift the ambient background color.
 */
export function DayChapter({
  dayId, dayNumber, dayTitle, dayDate, diaryId, isActive,
}: DayChapterProps) {
  const { t } = useTranslation();
  const { entries, loading } = useDayEntries(dayId);

  // Find first photo for hero
  const heroPhoto = entries.find((e: DayEntry) => e.type === 'photo');
  const heroUri = heroPhoto?.content;

  // Find mood for ambient color
  const moodEntry = entries.find((e: DayEntry) => e.type === 'mood');
  const moodEmoji = moodEntry?.content;

  // Entrance animation
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);

  useEffect(() => {
    if (isActive) {
      titleOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) });
      titleTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      titleOpacity.value = 0;
      titleTranslateY.value = 30;
    }
  }, [isActive]);

  const titleAnimStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  // Ambient mood bg color
  const ambientColor = moodEmoji
    ? getMoodAmbientColor(moodEmoji)
    : 'transparent';

  return (
    <View style={[styles.container, { width: SCREEN_WIDTH }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image with Ken Burns */}
        <View style={styles.heroContainer}>
          {heroUri ? (
            <KenBurnsImage
              uri={heroUri}
              style={styles.heroImage}
              paused={!isActive}
              duration={20000}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="image-outline" size={48} color={Palette.textMuted} />
            </View>
          )}

          {/* Scrim gradient */}
          <View style={styles.heroScrim} pointerEvents="none" />

          {/* Ambient mood tint */}
          {ambientColor !== 'transparent' && (
            <View style={[styles.ambientOverlay, { backgroundColor: ambientColor }]} pointerEvents="none" />
          )}

          {/* Day chapter title overlay */}
          <Animated.View style={[styles.heroTitleWrap, titleAnimStyle]}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{t('diary.day_label', { number: dayNumber })}</Text>
            </View>
            {dayTitle && (
              <Text style={styles.heroTitle} numberOfLines={2}>{dayTitle}</Text>
            )}
            {dayDate && (
              <Text style={styles.heroDate}>{dayDate}</Text>
            )}
            {moodEmoji && (
              <View style={styles.moodPill}>
                <Text style={styles.moodEmoji}>{moodEmoji}</Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Entry cards */}
        <View style={styles.entriesSection}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>{t('common.loading')}</Text>
            </View>
          ) : entries.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{t('diary.no_entries')}</Text>
            </View>
          ) : (
            entries
              .filter((e: DayEntry) => e.type !== 'photo' || e.id !== heroPhoto?.id)
              .map((entry: DayEntry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** Map mood emoji to a subtle ambient overlay color */
function getMoodAmbientColor(emoji: string): string {
  const moodColors: Record<string, string> = {
    '\u{1F929}': 'rgba(255,215,0,0.08)',    // Fantastico — gold
    '\u{1F60A}': 'rgba(0,201,167,0.06)',     // Felice — teal
    '\u{1F60C}': 'rgba(100,149,237,0.06)',   // Rilassato — cornflower
    '\u{1F92A}': 'rgba(249,115,22,0.06)',    // Entusiasta — orange
    '\u{1F924}': 'rgba(249,115,22,0.08)',    // Goloso — orange
    '\u{1F634}': 'rgba(100,100,180,0.06)',   // Stanco — lavender
    '\u{1F624}': 'rgba(255,64,96,0.06)',     // Frustrato — red
    '\u{1F976}': 'rgba(100,200,255,0.06)',   // Congelato — ice blue
    '\u{1F975}': 'rgba(255,100,50,0.06)',    // Sudato — warm
    '\u{1F912}': 'rgba(150,200,100,0.06)',   // Malato — sickly green
  };
  return moodColors[emoji] || 'transparent';
}

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Hero section
  heroContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
    overflow: 'hidden',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
  },
  heroPlaceholder: {
    flex: 1,
    backgroundColor: Palette.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  ambientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  heroTitleWrap: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    gap: 8,
  },
  dayBadge: {
    backgroundColor: Palette.teal,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dayBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.8,
    lineHeight: 32,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  moodPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  moodEmoji: {
    fontSize: 24,
  },

  // Entries
  entriesSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingWrap: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: Palette.textMuted,
    fontSize: 14,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
