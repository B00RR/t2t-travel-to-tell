import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useMapLocations } from '@/hooks/useMapLocations';
import { usePublicMapLocations, type PublicMapLocation } from '@/hooks/usePublicMapLocations';

type MapMode = 'mine' | 'discover';

const DEFAULT_REGION: Region = {
  latitude: 41.9028,
  longitude: 12.4964,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

export default function MapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<MapMode>('mine');

  const { locations: myLocations, loading: myLoading, refresh: myRefresh } = useMapLocations(user?.id);
  const { locations: publicLocations, loading: publicLoading, error: publicError, refresh: publicRefresh } = usePublicMapLocations(mode === 'discover');

  const mapRef = useRef<MapView>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const fittedModesRef = useRef<Set<MapMode>>(new Set());

  useFocusEffect(
    useCallback(() => {
      if (mode === 'mine') myRefresh();
      else publicRefresh();
    }, [mode, myRefresh, publicRefresh])
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermission(granted);

      if (granted) {
        const pos = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }, 800);
      }
    })();
  }, []);

  const locations = mode === 'mine' ? myLocations : publicLocations;
  const loading = mode === 'mine' ? myLoading : publicLoading;

  useEffect(() => {
    if (locations.length > 0 && mapRef.current && !fittedModesRef.current.has(mode)) {
      fittedModesRef.current.add(mode);
      mapRef.current.fitToCoordinates(
        locations.map(l => ({ latitude: l.lat, longitude: l.lng })),
        { edgePadding: { top: 80, right: 40, bottom: 80, left: 40 }, animated: true }
      );
    }
  }, [locations, mode]);

  const centerOnMe = useCallback(async () => {
    if (!locationPermission) {
      Alert.alert(t('common.error'), t('map.location_permission_denied'));
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    }, 500);
  }, [locationPermission, t]);

  const emptyText = mode === 'mine' ? t('map.no_locations') : t('map.no_public_locations');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{mode === 'mine' ? t('map.my_map') : t('map.discover')}</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'mine' && styles.toggleBtnActive]}
            onPress={() => setMode('mine')}
          >
            <Ionicons name="person" size={14} color={mode === 'mine' ? '#fff' : '#555'} />
            <Text style={[styles.toggleText, mode === 'mine' && styles.toggleTextActive]}>
              {t('map.my_map')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'discover' && styles.toggleBtnActive]}
            onPress={() => setMode('discover')}
          >
            <Ionicons name="globe-outline" size={14} color={mode === 'discover' ? '#fff' : '#555'} />
            <Text style={[styles.toggleText, mode === 'discover' && styles.toggleTextActive]}>
              {t('map.discover')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={locationPermission === true}
        showsMyLocationButton={false}
      >
        {locations.map(loc => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            pinColor={mode === 'mine' ? '#007AFF' : '#FF6B35'}
          >
            <Callout onPress={() => router.push(`/diary/${loc.diary_id}`)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle} numberOfLines={1}>{loc.diary_title}</Text>
                {mode === 'discover' && (loc as PublicMapLocation).author_display_name && (
                  <Text style={styles.calloutAuthor} numberOfLines={1}>
                    @{(loc as PublicMapLocation).author_username || (loc as PublicMapLocation).author_display_name}
                  </Text>
                )}
                <Text style={styles.calloutSubtitle} numberOfLines={1}>{loc.name}</Text>
                {(loc.city || loc.country) && (
                  <Text style={styles.calloutMeta} numberOfLines={1}>
                    {[loc.city, loc.country].filter(Boolean).join(', ')}
                  </Text>
                )}
                <Text style={styles.calloutTap}>{t('map.tap_to_open')}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {!loading && publicError && mode === 'discover' && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <View style={styles.emptyCard}>
            <Ionicons name="cloud-offline-outline" size={32} color="#FF3B30" />
            <Text style={[styles.emptyText, { color: '#FF3B30' }]}>{t('common.error_generic')}</Text>
          </View>
        </View>
      )}

      {!loading && !publicError && locations.length === 0 && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <View style={styles.emptyCard}>
            <Ionicons name={mode === 'mine' ? 'map-outline' : 'globe-outline'} size={32} color="#007AFF" />
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={centerOnMe}
        accessibilityLabel={t('map.center_on_me')}
      >
        <Ionicons name="locate" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    zIndex: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  toggleTextActive: {
    color: '#fff',
  },
  map: {
    flex: 1,
  },
  callout: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  calloutAuthor: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  calloutMeta: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  calloutTap: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 240,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
