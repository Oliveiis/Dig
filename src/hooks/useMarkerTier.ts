import { POI } from '../types/poi';
import { haversineMeters } from '../utils/distance';

export type MarkerTier = 'icon_tag' | 'icon_name' | 'icon_only' | 'minimal';

const INNER_RADIUS_M = 300;
const MIDDLE_RADIUS_M = 560;

export function getMarkerTier(
  poi: POI,
  viewportCenter: { lat: number; lng: number },
  zoom: number
): MarkerTier {
  // Match familiar navigation-map disclosure: overview = density dots,
  // neighbourhood = category icons, street level = readable labels.
  if (zoom < 15.75) return 'minimal';
  if (zoom < 16.5) return 'icon_only';

  const dist = haversineMeters(poi.coordinates, viewportCenter);
  if (dist <= INNER_RADIUS_M) return 'icon_tag';
  if (zoom >= 17.25 && dist <= MIDDLE_RADIUS_M) return 'icon_name';
  return 'icon_only';
}
