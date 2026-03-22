import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Dimensions, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Palette, Glass } from '@/constants/theme';
import type { PublicMapLocation } from '@/hooks/usePublicMapLocations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_GAP = 12;

interface MapDiaryCarouselProps {
  locations: PublicMapLocation[];
  clusterTitle?: string;
  onClose: () => void;
}

/**
 * Bottom-sheet carousel of diary previews that appears
 * when tapping a map hotspot cluster.
 */
export function MapDiaryCarousel({ locations, clusterTitle, onClose }: MapDiaryCarouselProps) {
  const router = useRouter();
  const { t } = useTranslation();

  // Deduplicate by diary_id
  const uniqueLocations = React.useMemo(() => {
    const seen = new Set<string>();
    return locations.filter(l => {
      if (seen.has(l.diary_id)) return false;
      seen.add(l.diary_id);
      return true;
    });
  }, [locations]);

  const renderItem = useCallback(({ item }: { item: PublicMapLocation }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        onClose();
        router.push(`/diary/${item.diary_id}`);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.locationDot} />
        <Text style={styles.cardLocation} numberOfLines={1}>
          {item.name || [item.city, item.country].filter(Boolean).join(', ')}
        </Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.diary_title}</Text>
      {item.author_display_name && (
        <View style={styles.cardAuthor}>
          <Ionicons name="person-circle-outline" size={14} color={Palette.teal} />
          <Text style={styles.cardAuthorText}>
            {item.author_display_name}
          </Text>
        </View>
      )}
      <View style={styles.cardFooter}>
        <Text style={styles.cardCta}>{t('map.view_diary')}</Text>
        <Ionicons name="arrow-forward" size={14} color={Palette.teal} />
      </View>
    </TouchableOpacity>
  ), [router, onClose, t]);

  return (
    <Animated.View
      style={styles.container}
      entering={SlideInDown.springify().damping(18)}
      exiting={SlideOutDown.duration(200)}
    >
      {/* Handle + header */}
      <View style={styles.header}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{clusterTitle || t('map.stories_here')}</Text>
            <Text style={styles.headerCount}>
              {uniqueLocations.length} {uniqueLocations.length === 1 ? t('common.diary') : t('common.diaries')}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal carousel */}
      <FlatList
        data={uniqueLocations}
        keyExtractor={(item) => `${item.diary_id}-${item.id}`}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,10,20,0.92)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerCount: {
    fontSize: 13,
    color: Palette.teal,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  listContent: {
    paddingHorizontal: 20,
    gap: CARD_GAP,
    paddingBottom: 8,
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.teal,
  },
  cardLocation: {
    fontSize: 12,
    color: Palette.teal,
    fontWeight: '600',
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  cardAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardAuthorText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  cardCta: {
    fontSize: 12,
    color: Palette.teal,
    fontWeight: '700',
  },
});
