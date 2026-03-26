import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent,
  Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { InteractiveGlobe } from '@/components/InteractiveGlobe';
import { Spacing, Typography, Radius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideData {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  fallbackTitle: string;
  fallbackDesc: string;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    icon: 'globe',
    titleKey: 'onboarding.slide1_title',
    descKey: 'onboarding.slide1_desc',
    fallbackTitle: 'Scopri il mondo',
    fallbackDesc: 'Esplora diari di viaggio da ogni angolo del pianeta. Lasciati ispirare da storie autentiche.',
  },
  {
    id: '2',
    icon: 'journal',
    titleKey: 'onboarding.slide2_title',
    descKey: 'onboarding.slide2_desc',
    fallbackTitle: 'Racconta la tua storia',
    fallbackDesc: 'Crea il tuo diario con foto, note e tappe. Ogni viaggio merita di essere ricordato.',
  },
  {
    id: '3',
    icon: 'people',
    titleKey: 'onboarding.slide3_title',
    descKey: 'onboarding.slide3_desc',
    fallbackTitle: 'Connettiti',
    fallbackDesc: 'Segui altri viaggiatori, commenta le loro storie e pianifica insieme avventure.',
  },
  {
    id: '4',
    icon: 'map',
    titleKey: 'onboarding.slide4_title',
    descKey: 'onboarding.slide4_desc',
    fallbackTitle: 'La tua mappa',
    fallbackDesc: 'Ogni diario aggiunge un pin alla tua mappa personale. Costruisci il tuo passaporto digitale.',
  },
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  }, []);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace('/(app)/(tabs)/home');
    }
  }, [currentIndex, router]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(app)/(tabs)/home');
  }, [router]);

  const renderSlide = useCallback(({ item, index }: { item: SlideData; index: number }) => {
    const isGlobeSlide = index === 0;

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {isGlobeSlide ? (
          <InteractiveGlobe height={320} />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: theme.tealAlpha15 }]}>
            <Ionicons name={item.icon as any} size={64} color={theme.teal} />
          </View>
        )}

        <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>
          {t(item.titleKey, item.fallbackTitle)}
        </Text>
        <Text style={[styles.slideDesc, { color: theme.textSecondary }]}>
          {t(item.descKey, item.fallbackDesc)}
        </Text>
      </View>
    );
  }, [theme, t]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: theme.textMuted }]}>
          {t('onboarding.skip', 'Salta')}
        </Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Dots + Next */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? theme.teal : theme.border,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: theme.teal }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Ionicons
            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl * 1.5,
  },
  slideTitle: {
    ...Typography.h1,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideDesc: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
