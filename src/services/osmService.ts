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

export async function fetchPOIsNear(lat: number, lng: number, radiusMeters: number = 1000): Promise<POI[]> {
  // Overpass query for cafes, restaurants, and bars
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`OSM fetch failed: ${response.statusText}`);
    }

    const data: OSMResponse = await response.json();
    return mapOSMToPOI(data.elements);
  } catch (error) {
    console.error('Error fetching POIs from OSM:', error);
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

    // Map subcategory from cuisine or amenity
    const subcategory = tags.cuisine || tags.amenity || '未知';

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
