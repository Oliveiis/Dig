import { POI } from '../types/poi';
import { fetchPOIsNear as fetchFromOSM } from './osmService';
import { digForPOIDetails } from './geminiService';

const memoryCache = new Map<string, Partial<POI> & { is_enriched?: boolean }>();

export function clearCache() {
  memoryCache.clear();
}

export async function getPOIsNear(lat: number, lng: number, radiusMeters: number = 1000): Promise<POI[]> {
  const osmPois = await fetchFromOSM(lat, lng, radiusMeters);
  return osmPois.map(poi => {
    const cached = memoryCache.get(poi.id);
    return cached ? { ...poi, ...cached } : poi;
  });
}

export async function enrichAndCachePOI(poi: POI): Promise<POI> {
  const cached = memoryCache.get(poi.id);
  if (cached?.is_enriched && (cached.why_worth_it || cached.hook_tag)) {
    return { ...poi, ...cached } as POI;
  }

  const details = await digForPOIDetails(poi);
  const hasContent = !!(details.why_worth_it || details.hook_tag);
  memoryCache.set(poi.id, { ...details, is_enriched: hasContent });

  return { ...poi, ...details };
}
