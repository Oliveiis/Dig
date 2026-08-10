import { useEffect } from 'react';
import { useLocationStore } from '../store/useLocationStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useAlertStore } from '../store/useAlertStore';
import { usePOIStore } from '../store/usePOIStore';
import { haversineMeters } from '../utils/distance';

export function useProximityAlert() {
  const { coords } = useLocationStore();
  const { bookmarks, markNotified } = useBookmarkStore();
  const { setProximityAlert } = useAlertStore();
  const allPOIs = usePOIStore(s => s.allPOIs);

  useEffect(() => {
    if (!coords) return;
    
    const nearest = bookmarks
      .filter((bookmark) => !bookmark.notified_nearby)
      .map((bookmark) => {
        const poi = allPOIs.find((item) => item.id === bookmark.poi_id);
        return poi ? { bookmark, poi, distance: haversineMeters(coords, poi.coordinates) } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry && entry.distance <= 500))
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearest) {
      setProximityAlert({
        poi_id: nearest.bookmark.poi_id,
        poi_name: nearest.bookmark.poi_name,
        distance_meters: Math.round(nearest.distance),
        message: nearest.poi.decision?.best_time || nearest.poi.decision?.headline,
      });
      markNotified(nearest.bookmark.poi_id);
    }
  }, [coords, bookmarks, allPOIs, setProximityAlert, markNotified]);
}
