import { POI, POICategory } from '../types/poi';

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OSMResponse {
  elements: OSMElement[];
}

const OSM_CACHE_KEY = 'dig:osm-grid:v1';
const OSM_TTL_MS = 24 * 60 * 60 * 1000;
const GRID_DEG = 0.0025; // ~280m at HK latitude

interface OSMCacheEntry {
  pois: POI[];
  fetched_at: number;
}

function gridKey(lat: number, lng: number, radiusMeters: number): string {
  const gLat = Math.round(lat / GRID_DEG) * GRID_DEG;
  const gLng = Math.round(lng / GRID_DEG) * GRID_DEG;
  const rBucket = Math.round(radiusMeters / 200) * 200;
  return `${gLat.toFixed(4)},${gLng.toFixed(4)},r${rBucket}`;
}

function readOSMCache(): Record<string, OSMCacheEntry> {
  try {
    const raw = localStorage.getItem(OSM_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeOSMCache(cache: Record<string, OSMCacheEntry>) {
  try { localStorage.setItem(OSM_CACHE_KEY, JSON.stringify(cache)); } catch {}
}

function getCached(lat: number, lng: number, radiusMeters: number, allowStale = false): POI[] | null {
  const cache = readOSMCache();
  const key = gridKey(lat, lng, radiusMeters);
  const entry = cache[key];
  if (!entry) return null;
  if (!allowStale && Date.now() - entry.fetched_at > OSM_TTL_MS) return null;
  return entry.pois;
}

function setCached(lat: number, lng: number, radiusMeters: number, pois: POI[]) {
  const cache = readOSMCache();
  cache[gridKey(lat, lng, radiusMeters)] = { pois, fetched_at: Date.now() };
  writeOSMCache(cache);
}

export async function fetchPOIsNear(lat: number, lng: number, radiusMeters: number = 1000): Promise<POI[]> {
  // Fresh cache hit — return immediately, no network.
  const fresh = getCached(lat, lng, radiusMeters, false);
  if (fresh && fresh.length > 0) {
    console.log(`[osm] cache hit (fresh): ${fresh.length} POIs`);
    return fresh;
  }

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"cafe|restaurant|bar"](around:${radiusMeters},${lat},${lng});
      way["amenity"~"cafe|restaurant|bar"](around:${radiusMeters},${lat},${lng});
      relation["amenity"~"cafe|restaurant|bar"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;

  try {
    const response = await fetch('/api/osm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error(`OSM fetch failed: ${response.statusText}`);

    const data: OSMResponse = await response.json();
    const pois = mapOSMToPOI(data.elements);
    if (pois.length > 0) setCached(lat, lng, radiusMeters, pois);
    return pois;
  } catch (error) {
    console.warn('[osm] live fetch failed, falling back to stale cache:', error);
    const stale = getCached(lat, lng, radiusMeters, true);
    if (stale && stale.length > 0) {
      console.log(`[osm] cache hit (stale): ${stale.length} POIs`);
      return stale;
    }
    return [];
  }
}

function mapOSMToPOI(elements: OSMElement[]): POI[] {
  return elements.map(el => {
    const lat = el.lat ?? el.center?.lat ?? 0;
    const lng = el.lon ?? el.center?.lon ?? 0;
    const tags = el.tags || {};
    
    let category: POICategory = 'restaurant';
    if (tags.amenity === 'cafe') category = 'cafe';
    else if (tags.amenity === 'bar') category = 'bar';

    // OSM cuisine can be semicolon-joined ("coffee_shop;pizza;burger") — take first token only.
    const rawSub = tags.cuisine || tags.amenity || '未知';
    const subcategory = rawSub.split(';')[0].trim() || '未知';

    return {
      id: `osm-${el.id}`,
      name: tags.name || '未命名地點',
      category,
      subcategory,
      hook_tag: subcategory.toUpperCase(),
      district: tags['addr:district'] || tags['addr:suburb'] || '附近',
      city_code: 'HKG',
      coordinates: { lat, lng },
      is_open_now: null, // OSM doesn't easily provide "now" status without complex parsing
      hours: tags.opening_hours || null,
      payment: {
        visa: tags['payment:visa'] === 'yes' ? true : (tags['payment:visa'] === 'no' ? false : null),
        cash: tags['payment:cash'] !== 'no', // Default to true if not explicitly no
        note: null
      },
      signature_items: [],
      souvenirs: [],
      why_worth_it: tags.description || `位於${tags['addr:street'] || '這條街'}的${category}`,
      caveats: [],
      flash_event: null,
      is_chain: tags.brand !== undefined,
      source_links: {
        google_maps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      }
    };
  });
}
