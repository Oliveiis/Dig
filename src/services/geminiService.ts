import { POI } from '../types/poi';

export async function digForPOIDetails(poi: POI): Promise<Partial<POI>> {
  console.log('[dig] requesting for:', poi.name, poi.id);
  try {
    const response = await fetch('/api/dig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ poi }),
    });
    if (!response.ok) {
      console.error('[dig] HTTP error:', response.status);
      return {};
    }
    const data = await response.json();
    console.log('[dig] response for:', poi.name, data);
    return data;
  } catch (e) {
    console.error('[dig] fetch error:', e);
    return {};
  }
}
