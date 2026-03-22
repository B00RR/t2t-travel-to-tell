import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { supabase } from '@/lib/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_HEIGHT = 220;

interface DiaryLocation {
  id: string;
  dayNumber: number;
  name: string;
  lat: number;
  lng: number;
}

interface DiaryMapCoverProps {
  diaryId: string;
  dayIds: string[];
}

export function DiaryMapCover({ diaryId, dayIds }: DiaryMapCoverProps) {
  const [locations, setLocations] = useState<DiaryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (dayIds.length === 0) {
      setLoading(false);
      return;
    }
    fetchLocations();
  }, [dayIds.join(',')]);

  async function fetchLocations() {
    setLoading(true);
    try {
      // Fetch days with their day_number for ordering
      const { data: days } = await supabase
        .from('diary_days')
        .select('id, day_number, sort_order')
        .eq('diary_id', diaryId)
        .order('sort_order', { ascending: true });

      if (!days || days.length === 0) {
        setLocations([]);
        return;
      }

      const dayNumberMap = new Map(days.map(d => [d.id, d.day_number]));
      const sortOrderMap = new Map(days.map((d, i) => [d.id, i]));

      // Fetch location entries for these days
      const { data: entries } = await supabase
        .from('day_entries')
        .select('id, day_id, metadata')
        .eq('type', 'location')
        .in('day_id', days.map(d => d.id));

      if (!entries || entries.length === 0) {
        setLocations([]);
        return;
      }

      const locs: DiaryLocation[] = [];
      for (const entry of entries) {
        const meta = entry.metadata as any;
        const coords = meta?.coordinates;
        if (!coords?.lat || !coords?.lng) continue;

        locs.push({
          id: entry.id,
          dayNumber: dayNumberMap.get(entry.day_id) ?? 1,
          name: meta.place_name || meta.name || '',
          lat: coords.lat,
          lng: coords.lng,
        });
      }

      // Sort by day sort_order, then by entry order within day
      locs.sort((a, b) => {
        const dayA = entries.find(e => e.id === a.id);
        const dayB = entries.find(e => e.id === b.id);
        const orderA = sortOrderMap.get(dayA?.day_id ?? '') ?? 0;
        const orderB = sortOrderMap.get(dayB?.day_id ?? '') ?? 0;
        return orderA - orderB;
      });

      setLocations(locs);
    } catch (err) {
      console.error('DiaryMapCover fetch error:', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (locations.length > 0 && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          locations.map(l => ({ latitude: l.lat, longitude: l.lng })),
          { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: false }
        );
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [locations]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (locations.length === 0) return null;

  const initialRegion: Region = {
    latitude: locations[0].lat,
    longitude: locations[0].lng,
    latitudeDelta: 5,
    longitudeDelta: 5,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        customMapStyle={mapStyle}
      >
        {/* Itinerary polyline */}
        <Polyline
          coordinates={locations.map(l => ({ latitude: l.lat, longitude: l.lng }))}
          strokeColor="#007AFF"
          strokeWidth={2.5}
          lineDashPattern={[8, 4]}
        />

        {/* Day markers */}
        {locations.map((loc, idx) => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerOuter}>
              <View style={styles.marker}>
                <Text style={styles.markerText}>{loc.dayNumber}</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Subtle gradient overlay at bottom for text readability */}
      <View style={styles.bottomFade} pointerEvents="none" />
    </View>
  );
}

// Minimal map style: de-emphasize labels, lighten terrain, make itinerary pop
const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#999999' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#cccccc' }, { weight: 1.5 }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#dddddd' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d4e9f7' }] },
  { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.man_made', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: MAP_HEIGHT,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerOuter: {
    alignItems: 'center',
  },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'transparent',
  },
});
