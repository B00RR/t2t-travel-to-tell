import { useMemo } from 'react';
import type { PublicMapLocation } from './usePublicMapLocations';

export interface LocationCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  locations: PublicMapLocation[];
  /** Representative diary for the cluster */
  primaryDiaryId: string;
  primaryDiaryTitle: string;
}

const GRID_SIZE = 5; // degrees per grid cell — adjustable for zoom

/**
 * Groups nearby locations into clusters using a simple grid-based algorithm.
 * Each cluster contains all locations within the same grid cell.
 */
export function useClusteredLocations(
  locations: PublicMapLocation[],
  gridSize: number = GRID_SIZE,
): LocationCluster[] {
  return useMemo(() => {
    if (!locations || locations.length === 0) return [];

    const grid = new Map<string, PublicMapLocation[]>();

    for (const loc of locations) {
      const cellX = Math.floor(loc.lng / gridSize);
      const cellY = Math.floor(loc.lat / gridSize);
      const key = `${cellX}:${cellY}`;

      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(loc);
    }

    const clusters: LocationCluster[] = [];

    for (const [key, locs] of grid) {
      // Compute centroid
      let sumLat = 0, sumLng = 0;
      for (const l of locs) {
        sumLat += l.lat;
        sumLng += l.lng;
      }

      const centroid = {
        lat: sumLat / locs.length,
        lng: sumLng / locs.length,
      };

      // Deduplicate diaries within cluster
      const uniqueDiaries = new Map<string, PublicMapLocation>();
      for (const l of locs) {
        if (!uniqueDiaries.has(l.diary_id)) {
          uniqueDiaries.set(l.diary_id, l);
        }
      }

      const primary = locs[0];

      clusters.push({
        id: key,
        lat: centroid.lat,
        lng: centroid.lng,
        count: uniqueDiaries.size,
        locations: Array.from(uniqueDiaries.values()),
        primaryDiaryId: primary.diary_id,
        primaryDiaryTitle: primary.diary_title,
      });
    }

    // Sort by count descending (biggest clusters first)
    clusters.sort((a, b) => b.count - a.count);

    return clusters;
  }, [locations, gridSize]);
}
