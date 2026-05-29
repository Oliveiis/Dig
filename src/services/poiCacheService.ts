import { POI } from '../types/poi';
import { fetchPOIsNear as fetchFromOSM } from './osmService';
import { digForPOIDetails } from './geminiService';

const STORAGE_KEY = 'dig:poi-enrich:v1';
const TIMED_TTL_MS = 24 * 60 * 60 * 1000; // 24h for is_open_now / hours

const STABLE_FIELDS = [
  'hook_tag', 'why_worth_it', 'signature_items', 'caveats',
  'recommendation_count', 'price_range', 'souvenirs', 'flash_event',
  'payment',
] as const;
const TIMED_FIELDS = ['is_open_now', 'hours'] as const;

interface CachedEntry {
  stable: Partial<POI>;
  timed?: { value: Partial<POI>; updated_at: number };
  is_enriched: boolean;
}

const memoryCache = new Map<string, CachedEntry>();
let activeBatchAbort: AbortController | null = null;
let storageLoaded = false;

function loadFromStorage() {
  if (storageLoaded) return;
  storageLoaded = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, CachedEntry>;
    for (const [id, entry] of Object.entries(parsed)) memoryCache.set(id, entry);
  } catch {}
}

function saveToStorage() {
  try {
    const obj: Record<string, CachedEntry> = {};
    for (const [id, entry] of memoryCache) obj[id] = entry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {}
}

function pickFields<K extends readonly (keyof POI)[]>(src: Partial<POI>, keys: K): Partial<POI> {
  const out: Partial<POI> = {};
  for (const k of keys) {
    if (src[k] !== undefined && src[k] !== null) (out as any)[k] = src[k];
  }
  return out;
}

function applyEntry(poi: POI, entry: CachedEntry | undefined): POI {
  if (!entry) return poi;
  const merged: POI = { ...poi, ...entry.stable };
  if (entry.timed && Date.now() - entry.timed.updated_at < TIMED_TTL_MS) {
    Object.assign(merged, entry.timed.value);
  }
  return merged;
}

export function clearCache() {
  memoryCache.clear();
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export async function getPOIsNear(lat: number, lng: number, radiusMeters: number = 1000): Promise<POI[]> {
  loadFromStorage();
  const osmPois = await fetchFromOSM(lat, lng, radiusMeters);
  return osmPois.map(poi => applyEntry(poi, memoryCache.get(poi.id)));
}

export async function enrichAndCachePOI(poi: POI): Promise<POI> {
  loadFromStorage();
  const cached = memoryCache.get(poi.id);
  if (cached?.is_enriched && cached.stable.hook_tag) {
    const result = applyEntry(poi, cached);
    if (cached.timed && Date.now() - cached.timed.updated_at < TIMED_TTL_MS) {
      return result;
    }
    // Stable fields fresh, but timed expired — re-fetch only to refresh timed.
  }

  const details = await digForPOIDetails(poi);
  const stable = pickFields(details, STABLE_FIELDS as any);
  const timedValue = pickFields(details, TIMED_FIELDS as any);
  const hasContent = !!(details.why_worth_it || details.hook_tag);

  const entry: CachedEntry = {
    stable: { ...(cached?.stable ?? {}), ...stable },
    timed: Object.keys(timedValue).length > 0
      ? { value: timedValue, updated_at: Date.now() }
      : cached?.timed,
    is_enriched: hasContent || (cached?.is_enriched ?? false),
  };
  memoryCache.set(poi.id, entry);
  saveToStorage();

  return applyEntry(poi, entry);
}

export function abortActiveBatch() {
  activeBatchAbort?.abort();
  activeBatchAbort = null;
}

function looksUnenriched(p: POI): boolean {
  loadFromStorage();
  const cached = memoryCache.get(p.id);
  if (cached?.is_enriched && cached.stable.hook_tag) return false;
  const tag = p.hook_tag ?? '';
  const why = p.why_worth_it ?? '';
  const tagIsFallback = !tag || tag === (p.subcategory ?? '').toUpperCase();
  const whyIsFallback = !why || /^位於.+的(cafe|restaurant|bar)$/.test(why);
  return tagIsFallback || whyIsFallback;
}

export async function enrichPOIsBatch(
  pois: POI[],
  onPatch: (enriched: POI) => void,
  concurrency = 3,
): Promise<void> {
  abortActiveBatch();
  const ctrl = new AbortController();
  activeBatchAbort = ctrl;

  const queue = pois.filter(looksUnenriched);

  let idx = 0;
  const worker = async () => {
    while (idx < queue.length && !ctrl.signal.aborted) {
      const poi = queue[idx++];
      const enriched = await enrichAndCachePOI(poi).catch(() => null);
      if (ctrl.signal.aborted || !enriched) continue;
      if (enriched.hook_tag || enriched.why_worth_it) onPatch(enriched);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  if (activeBatchAbort === ctrl) activeBatchAbort = null;
}
