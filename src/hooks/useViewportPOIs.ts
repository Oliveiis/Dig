import { useState, useCallback } from 'react';
import { POI } from '../types/poi';
import { usePOIStore } from '../store/usePOIStore';
import { useLocationStore } from '../store/useLocationStore';
import { ALLOWED_CATEGORIES } from '../utils/categoryConfig';
import { haversineMeters } from '../utils/distance';

const FALLBACK_RADIUS_METERS = 600;

interface PigeonBounds {
  ne: [number, number];
  sw: [number, number];
}

interface BoundsChangeParams {
  center: [number, number];
  zoom: number;
  bounds: PigeonBounds;
}

export function useViewportPOIs(allPOIs: POI[]) {
  const [viewportCenter, setViewportCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [bounds, setBounds] = useState<PigeonBounds | null>(null);
  const { activeFilter } = usePOIStore();
  const { coords } = useLocationStore();

  const onBoundsChange = useCallback((params: BoundsChangeParams) => {
    setViewportCenter({ lat: params.center[0], lng: params.center[1] });
    setBounds(params.bounds);
  }, []);

  const filterCenter = viewportCenter ?? coords;

  const visiblePOIs = allPOIs.filter(poi => {
    if (!ALLOWED_CATEGORIES.includes(poi.category)) return false;
    if (activeFilter !== 'all' && poi.category !== activeFilter) return false;

    const { lat, lng } = poi.coordinates;
    if (bounds) {
      // pigeon-maps: ne=[north_lat, east_lng], sw=[south_lat, west_lng]
      const inLat = lat >= bounds.sw[0] && lat <= bounds.ne[0];
      const inLng = lng >= bounds.sw[1] && lng <= bounds.ne[1];
      return inLat && inLng;
    }
    return haversineMeters(filterCenter, poi.coordinates) <= FALLBACK_RADIUS_METERS;
  });

  return { visiblePOIs, viewportCenter: filterCenter, onBoundsChange };
}

