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
    
    bookmarks.forEach(bookmark => {
      if (bookmark.notified_nearby) return;
      
      const poi = allPOIs.find(p => p.id === bookmark.poi_id);
      if (!poi) return;
      
      const dist = haversineMeters(coords, poi.coordinates);
      if (dist <= 500) {
        setProximityAlert({
          poi_id: bookmark.poi_id,
          poi_name: bookmark.poi_name,
          distance_meters: Math.round(dist),
        });
        markNotified(bookmark.poi_id);
      }
    });
  }, [coords, bookmarks, allPOIs, setProximityAlert, markNotified]);
}
