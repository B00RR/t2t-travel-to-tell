import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, NativeSyntheticEvent, NativeScrollEvent,
  Platform, StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, interpolate,
  useAnimatedScrollHandler, FadeInUp,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '@/hooks/useAppTheme';
import { InteractiveGlobe } from '@/components/InteractiveGlobe';
import { Spacing, Typography, Fonts, Shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

interface SlideData {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  accentKey: string;
  fallbackTitle: string;
  fallbackDesc: string;
  fallbackAccent: string;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    icon: 'globe',
    titleKey: 'onboarding.slide1_title',
    descKey: 'onboarding.slide1_desc',
    accentKey: 'onboarding.slide1_accent',
    fallbackTitle: 'Discover the World',
    fallbackDesc: 'Explore travel diaries from every corner of the planet. Get inspired by authentic stories.',
    fallbackAccent: 'Every journey starts with curiosity',
  },
  {
    id: '2',
    icon: 'journal',
    titleKey: 'onboarding.slide2_title',
    descKey: 'onboarding.slide2_desc',
    accentKey: 'onboarding.slide2_accent',
    fallbackTitle: 'Tell Your Story',
    fallbackDesc: 'Create your diary with photos, notes, and stops. Every trip deserves to be remembered.',
    fallbackAccent: 'Your personal travel moleskine',
  },
  {
    id: '3',
    icon: 'people',
    titleKey: 'onboarding.slide3_title',
    descKey: 'onboarding.slide3_desc',
    accentKey: 'onboarding.slide3_accent',
    fallbackTitle: 'Connect',
    fallbackDesc: 'Follow other travelers, comment on their stories, and plan adventures together.',
    fallbackAccent: 'Travel is better shared',
  },
  {
    id: '4',
    icon: 'map',
    titleKey: 'onboarding.slide4_title',
    descKey: 'onboarding.slide4_desc',
    accentKey: 'onboarding.slide4_accent',
    fallbackTitle: 'Your Map',
    fallbackDesc: 'Each diary adds a pin to your personal map. Build your digital passport.',
    fallbackAccent: 'Pin your memories to the world',
  },
];

export default function OnboardingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  }, []);

  const finishOnboarding = useCallback(async () => {
    await SecureStore.setItemAsync('onboarding_seen', 'true');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(app)/(tabs)/home' as never);
  }, [router]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finishOnboarding();
    }
  }, [currentIndex, finishOnboarding]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    finishOnboarding();
  }, [finishOnboarding]);

  const renderSlide = useCallback(({ item, index }: { item: any; index: number }) => {
    const slide = item as SlideData;
    const isGlobeSlide = index === 0;

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {isGlobeSlide ? (
          <InteractiveGlobe height={280} />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: theme.tealAlpha15 }, Shadows.elevated]}>
            <Ionicons name={slide.icon as any} size={56} color={theme.teal} />
          </View>
        )}

        <Animated.Text
          entering={FadeInUp.delay(200).duration(500)}
          style={[styles.slideAccent, { color: theme.teal, fontFamily: Fonts.handwritten }]}
        >
          {t(slide.accentKey, slide.fallbackAccent)}
        </Animated.Text>

        <Text style={[styles.slideTitle, { color: theme.textPrimary }]}>
          {t(slide.titleKey, slide.fallbackTitle)}
        </Text>
        <Text style={[styles.slideDesc, { color: theme.textSecondary }]}>
          {t(slide.descKey, slide.fallbackDesc)}
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
          {t('onboarding.skip', 'Skip')}
        </Text>
      </TouchableOpacity>

      {/* Slides with parallax scroll tracking */}
      <AnimatedFlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide as any}
        keyExtractor={(item: any) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Footer — animated dots + next button */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            return <AnimatedDot key={i} index={i} scrollX={scrollX} theme={theme} />;
          })}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: theme.teal }, Shadows.glow(theme.teal)]}
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

/** Animated dot that smoothly scales and changes width based on scroll position */
function AnimatedDot({ index, scrollX, theme }: { index: number; scrollX: SharedValue<number>; theme: any }) {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    const width = interpolate(scrollX.value, inputRange, [8, 28, 8], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
    return { width, opacity };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: theme.teal },
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  slideAccent: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  slideTitle: {
    ...Typography.h1,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  slideDesc: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
