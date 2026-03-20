import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useMapLocations } from '@/hooks/useMapLocations';

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
  const { locations, loading } = useMapLocations(user?.id);
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermission(granted);

      if (granted) {
        const pos = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 10,
          longitudeDelta: 10,
        });
      }
    })();
  }, []);

  // Once locations are loaded, fit the map to show all pins
  useEffect(() => {
    if (locations.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        locations.map(l => ({ latitude: l.lat, longitude: l.lng })),
        { edgePadding: { top: 80, right: 40, bottom: 80, left: 40 }, animated: true }
      );
    }
  }, [locations]);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('map.my_map')}</Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={locationPermission === true}
        showsMyLocationButton={false}
      >
        {locations.map(loc => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            pinColor="#007AFF"
          >
            <Callout onPress={() => router.push(`/diary/${loc.diary_id}`)}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle} numberOfLines={1}>{loc.diary_title}</Text>
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

      {!loading && locations.length === 0 && (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <View style={styles.emptyCard}>
            <Ionicons name="map-outline" size={32} color="#007AFF" />
            <Text style={styles.emptyText}>{t('map.no_locations')}</Text>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
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
