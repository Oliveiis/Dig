import type { ExploreIntent } from '../store/usePOIStore';
import type { POI, POICategory } from '../types/poi';
import { haversineMeters } from './distance';

export function walkMinutesFor(poi: POI) {
  if (poi.walk_minutes) return poi.walk_minutes;
  if (!poi.distance_meters) return null;
  return Math.max(1, Math.round(poi.distance_meters / 78));
}

export function hasVisitRisk(poi: POI) {
  return poi.is_open_now === false || poi.caveats.length > 0;
}

export function evidenceCountFor(poi: POI) {
  const claimSupport = (poi.claims ?? []).reduce((sum, claim) => sum + claim.support_count, 0);
  const sourceSupport = (poi.sources ?? []).reduce((sum, source) => sum + (source.count ?? 0), 0);
  return Math.max(claimSupport, sourceSupport, poi.recommendation_count ?? 0, poi.mention_count ?? 0);
}

export function matchesExploreIntent(poi: POI, intent: ExploreIntent, bookmarked: Set<string>) {
  if (intent === 'saved') return bookmarked.has(poi.id);
  if (intent === 'nearby') return (poi.distance_meters ?? Number.POSITIVE_INFINITY) <= 1_200;
  if (intent === 'sweet') {
    return poi.category === 'bakery' || /甜|蛋撻|麵包|dessert|bakery|cake/i.test(`${poi.subcategory} ${poi.signature_items.join(' ')}`);
  }
  if (intent === 'takeaway') {
    return ['bakery', 'shop', 'cafe'].includes(poi.category) || /外帶|買走|邊走邊吃/.test(`${poi.decision?.fit ?? ''} ${poi.why_worth_it ?? ''}`);
  }
  return true;
}

export function filterExplorePOIs(
  pois: POI[],
  intent: ExploreIntent,
  activeFilter: 'all' | POICategory,
  bookmarked: Set<string>,
) {
  return pois.filter((poi) => {
    if (activeFilter !== 'all' && poi.category !== activeFilter) return false;
    return matchesExploreIntent(poi, intent, bookmarked);
  });
}

function freshnessScore(poi: POI) {
  const latest = Math.max(
    ...[
      poi.open_status_checked_at,
      ...(poi.sources ?? []).map((source) => source.updated_at),
      ...(poi.claims ?? []).map((claim) => claim.last_verified_at),
    ]
      .filter(Boolean)
      .map((date) => Date.parse(date as string))
      .filter(Number.isFinite),
    0,
  );
  if (!latest) return 0;
  const ageDays = Math.max(0, (Date.now() - latest) / 86_400_000);
  return Math.max(0, 12 - ageDays * 0.45);
}

export function rankExploreWinners(
  pois: POI[],
  origin: { lat: number; lng: number },
  bookmarked: Set<string>,
  limit = 5,
) {
  return [...pois]
    .filter((poi) => poi.evidence_level === 'decision' || bookmarked.has(poi.id))
    .map((poi) => {
      const distance = poi.distance_meters ?? haversineMeters(origin, poi.coordinates);
      const evidence = Math.min(24, evidenceCountFor(poi) * 0.55);
      const reachability = Math.max(-8, 32 - distance / 55);
      const status = poi.is_open_now === true ? 12 : poi.is_open_now === false ? -24 : 0;
      const saved = bookmarked.has(poi.id) ? 34 : 0;
      const uncertainty = poi.evidence_level === 'decision' ? 0 : -30;
      return { poi: { ...poi, distance_meters: distance }, score: evidence + reachability + status + saved + freshnessScore(poi) + uncertainty };
    })
    .sort((a, b) => b.score - a.score || (a.poi.distance_meters ?? 0) - (b.poi.distance_meters ?? 0))
    .slice(0, limit)
    .map(({ poi }) => poi);
}
