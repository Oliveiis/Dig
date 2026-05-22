import { POI } from '../types/poi';
import { haversineMeters } from '../utils/distance';

export type MarkerTier = 'icon_tag' | 'icon_name' | 'icon_only' | 'minimal';

const INNER_RADIUS_M = 300;
const MIDDLE_RADIUS_M = 600;

export function getMarkerTier(
  poi: POI,
  viewportCenter: { lat: number; lng: number },
  zoom: number
): MarkerTier {
  if (zoom < 14) return 'minimal';
  if (zoom < 16) return 'icon_only';

  const dist = haversineMeters(poi.coordinates, viewportCenter);
  if (dist <= INNER_RADIUS_M) return 'icon_tag';
  if (dist <= MIDDLE_RADIUS_M) return 'icon_name';
  return 'icon_only';
}
