import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { usePublicMapLocations } from '@/hooks/usePublicMapLocations';
import { useClusteredLocations, type LocationCluster } from '@/hooks/useClusteredLocations';
import { MapDiaryCarousel } from '@/components/MapDiaryCarousel';
import { CompassRandomizer } from '@/components/CompassRandomizer';
import { Palette } from '@/constants/theme';

const DEFAULT_REGION: Region = {
  latitude: 30,
  longitude: 10,
  latitudeDelta: 80,
  longitudeDelta: 80,
};

// Dark map style for immersive look
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#555570' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#252540' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#50506A' }] },
];

/**
 * Wanderlust Map — full-screen stylized map with glowing hotspot clusters.
 * Tap a hotspot → carousel of diaries from that area.
 * Compass button → fly to random destination.
 */
export function WanderlustMap() {
  const { t } = useTranslation();
  const { locations, loading } = usePublicMapLocations(true);
  const clusters = useClusteredLocations(locations);
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);
  const mapRef = useRef<MapView>(null);

  const handleClusterPress = useCallback((cluster: LocationCluster) => {
    setSelectedCluster(cluster);

    // Fly to cluster location
    mapRef.current?.animateToRegion({
      latitude: cluster.lat,
      longitude: cluster.lng,
      latitudeDelta: 8,
      longitudeDelta: 8,
    }, 800);
  }, []);

  const handleRandomize = useCallback(() => {
    if (clusters.length === 0) return;
    const random = clusters[Math.floor(Math.random() * clusters.length)];
    setSelectedCluster(random);
    mapRef.current?.animateToRegion({
      latitude: random.lat,
      longitude: random.lng,
      latitudeDelta: 8,
      longitudeDelta: 8,
    }, 1000);
  }, [clusters]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {clusters.map((cluster) => (
          <HotspotMarker
            key={cluster.id}
            cluster={cluster}
            onPress={handleClusterPress}
          />
        ))}
      </MapView>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Palette.teal} />
          <Text style={styles.loadingText}>{t('map.loading_stories')}</Text>
        </View>
      )}

      {/* Empty state */}
      {!loading && clusters.length === 0 && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <View style={styles.emptyCard}>
            <Ionicons name="globe-outline" size={36} color={Palette.teal} />
            <Text style={styles.emptyText}>{t('map.no_public_locations')}</Text>
          </View>
        </View>
      )}

      {/* Compass randomizer FAB */}
      <CompassRandomizer
        onRandomize={handleRandomize}
        disabled={clusters.length === 0}
      />

      {/* Diary carousel when cluster selected */}
      {selectedCluster && (
        <MapDiaryCarousel
          locations={selectedCluster.locations}
          clusterTitle={selectedCluster.primaryDiaryTitle}
          onClose={() => setSelectedCluster(null)}
        />
      )}
    </View>
  );
}

/**
 * Glowing hotspot marker — pulsing orb sized by diary count.
 */
const HotspotMarker = React.memo(function HotspotMarker({
  cluster,
  onPress,
}: {
  cluster: LocationCluster;
  onPress: (c: LocationCluster) => void;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Size based on count: min 32, max 64
  const size = Math.min(64, Math.max(32, 28 + cluster.count * 4));

  return (
    <Marker
      coordinate={{ latitude: cluster.lat, longitude: cluster.lng }}
      onPress={() => onPress(cluster)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[styles.markerOuter, { width: size + 16, height: size + 16 }]}>
        <Animated.View style={[styles.markerPulse, { width: size + 16, height: size + 16, borderRadius: (size + 16) / 2 }, animatedStyle]} />
        <View style={[styles.markerInner, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.markerCount, { fontSize: cluster.count > 99 ? 10 : 13 }]}>
            {cluster.count}
          </Text>
        </View>
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  map: {
    flex: 1,
  },

  // Hotspot markers
  markerOuter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerPulse: {
    position: 'absolute',
    backgroundColor: 'rgba(0,201,167,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,201,167,0.2)',
  },
  markerInner: {
    backgroundColor: 'rgba(0,201,167,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    // Inner glow
    shadowColor: Palette.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  markerCount: {
    color: '#fff',
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  // Overlays
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13,17,23,0.7)',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: 'rgba(20,20,35,0.9)',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    maxWidth: 240,
  },
});
