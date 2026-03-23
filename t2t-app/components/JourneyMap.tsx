import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMapLocations } from '@/hooks/useMapLocations';
import { Palette } from '@/constants/theme';

interface JourneyMapProps {
  userId: string;
}

// Dark world map style matching the passport aesthetic
const JOURNEY_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3a506b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#061020' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#1B3A5C' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#3a506b' }] },
];

/**
 * Personal journey map — shows all visited locations as connected route lines.
 * Teal glow dots at each location, animated polyline connecting journeys.
 * Part of the Passport profile experience.
 */
export function JourneyMap({ userId }: JourneyMapProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { locations, loading } = useMapLocations(userId);

  // Entrance animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (!loading && locations.length > 0) {
      opacity.value = withDelay(200, withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
      translateY.value = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }));
    }
  }, [loading, locations.length]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Group locations by diary for polyline routes
  const routes = useMemo(() => {
    const diaryGroups = new Map<string, typeof locations>();
    for (const loc of locations) {
      if (!diaryGroups.has(loc.diary_id)) diaryGroups.set(loc.diary_id, []);
      diaryGroups.get(loc.diary_id)!.push(loc);
    }
    return Array.from(diaryGroups.values());
  }, [locations]);

  const coordinates = useMemo(
    () => locations.map(l => ({ latitude: l.lat, longitude: l.lng })),
    [locations],
  );

  if (loading || locations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View style={[styles.emptyContent, animStyle]}>
          <Ionicons name="map-outline" size={36} color={Palette.passGold} />
          <Text style={styles.emptyText}>
            {loading ? t('common.loading') : t('passport.no_journeys')}
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{t('passport.my_journeys')}</Text>
        <Text style={styles.headerCount}>
          {locations.length} {t('passport.locations')}
        </Text>
      </View>

      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          customMapStyle={JOURNEY_MAP_STYLE}
          initialRegion={{
            latitude: locations[0]?.lat || 41.9,
            longitude: locations[0]?.lng || 12.5,
            latitudeDelta: 40,
            longitudeDelta: 40,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
          ref={(ref) => {
            if (ref && coordinates.length > 0) {
              setTimeout(() => {
                ref.fitToCoordinates(coordinates, {
                  edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                  animated: false,
                });
              }, 100);
            }
          }}
        >
          {/* Route polylines per diary */}
          {routes.map((route, idx) => (
            <Polyline
              key={`route-${idx}`}
              coordinates={route.map(l => ({ latitude: l.lat, longitude: l.lng }))}
              strokeColor={Palette.teal}
              strokeWidth={2}
              lineDashPattern={[6, 4]}
            />
          ))}

          {/* Location markers */}
          {locations.map((loc) => (
            <Marker
              key={loc.id}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => router.push(`/diary/${loc.diary_id}`)}
            >
              <View style={styles.markerOuter}>
                <View style={styles.markerInner} />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Fade edges */}
        <View style={styles.fadeTop} pointerEvents="none" />
        <View style={styles.fadeBottom} pointerEvents="none" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Palette.navy,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.12)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.passGold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  headerCount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(232,224,208,0.5)',
  },
  mapWrap: {
    height: 200,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },

  // Markers
  markerOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(212,101,74,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.teal,
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },

  // Edge fades
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: Palette.navy,
    opacity: 0.6,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: Palette.navy,
    opacity: 0.6,
  },

  // Empty state
  emptyContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: Palette.navy,
    borderWidth: 1,
    borderColor: 'rgba(212,168,83,0.12)',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(232,224,208,0.5)',
    fontWeight: '500',
  },
});
