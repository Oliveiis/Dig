import { useState, useCallback } from 'react';
import { POI } from '../types/poi';
import { usePOIStore } from '../store/usePOIStore';
import { useLocationStore } from '../store/useLocationStore';
import { ALLOWED_CATEGORIES } from '../utils/categoryConfig';
import { haversineMeters } from '../utils/distance';

const RADIUS_METERS = 200;

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
  const { activeFilter } = usePOIStore();
  const { coords } = useLocationStore();

  const onBoundsChange = useCallback((params: BoundsChangeParams) => {
    setViewportCenter({ lat: params.center[0], lng: params.center[1] });
  }, []);

  const filterCenter = viewportCenter ?? coords;

  const visiblePOIs = allPOIs.filter(poi => {
    if (!ALLOWED_CATEGORIES.includes(poi.category)) return false;
    if (activeFilter !== 'all' && poi.category !== activeFilter) return false;
    return haversineMeters(filterCenter, poi.coordinates) <= RADIUS_METERS;
  });

  return { visiblePOIs, viewportCenter: filterCenter, onBoundsChange };
}
