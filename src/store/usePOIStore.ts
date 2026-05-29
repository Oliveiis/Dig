import { create } from 'zustand';
import { POI, POICategory } from '../types/poi';
import { getPOIsNear, enrichAndCachePOI, enrichPOIsBatch, abortActiveBatch } from '../services/poiCacheService';
import { loadPreEnrichedPOIs, mergeWithOSM } from '../services/preEnrichedService';
import { useLocationStore } from './useLocationStore';
import { haversineMeters } from '../utils/distance';

const PREHEAT_LIMIT = 12;
const PREHEAT_CONCURRENCY = 3;

interface POIStore {
  allPOIs: POI[];
  activeFilter: 'all' | POICategory;
  selectedPOI: POI | null;
  showFullCard: boolean;
  isDigging: boolean;
  isFetching: boolean;
  setFilter: (f: 'all' | POICategory) => void;
  setSelectedPOI: (poi: POI | null) => void;
  setShowFullCard: (show: boolean) => void;
  digForPOI: (poi: POI) => Promise<void>;
  refreshPOIs: (lat: number, lng: number) => Promise<void>;
}

export const usePOIStore = create<POIStore>((set, get) => ({
  allPOIs: [],
  activeFilter: 'all',
  selectedPOI: null,
  showFullCard: false,
  isDigging: false,
  isFetching: false,
  setFilter: (activeFilter) => set({ activeFilter }),
  setSelectedPOI: (selectedPOI) => set({ selectedPOI }),
  setShowFullCard: (showFullCard) => set({ showFullCard }),

  digForPOI: async (poi) => {
// If the POI is already fully enriched (from pre-enriched data), skip the API call
    if (poi.why_worth_it && poi.hook_tag) {
      console.log('[store] POI already enriched, skipping API dig:', poi.name);
      // Still calculate distance
      const { coords } = useLocationStore.getState();
      const distance_meters = haversineMeters(coords, poi.coordinates);
      if (poi.distance_meters !== distance_meters) {
        set((state) => ({
          allPOIs: state.allPOIs.map(p =>
            p.id === poi.id ? { ...p, distance_meters } : p
          ),
          selectedPOI: state.selectedPOI?.id === poi.id
            ? { ...state.selectedPOI, distance_meters }
            : state.selectedPOI,
        }));
      }
      return;
    }

    console.log('[store] digForPOI called for:', poi.name);
    set({ isDigging: true });
    const enrichedPoi = await enrichAndCachePOI(poi);
    const { coords } = useLocationStore.getState();
    const distance_meters = haversineMeters(coords, poi.coordinates);
    const final = { ...enrichedPoi, distance_meters };
    set((state) => ({
      isDigging: false,
      allPOIs: state.allPOIs.map(p => p.id === poi.id ? final : p),
      selectedPOI: state.selectedPOI?.id === poi.id ? final : state.selectedPOI,
    }));
  },

  refreshPOIs: async (lat, lng) => {
    set({ isFetching: true });
    abortActiveBatch();

    // 1. Fetch raw OSM POIs (cached enrich data is auto-applied inside getPOIsNear)
    const osmPOIs = await getPOIsNear(lat, lng, 1000);

    // 2. Load pre-enriched POIs (from Food Crawler pipeline)
    const preEnriched = await loadPreEnrichedPOIs();
    console.log(`[store] Pre-enriched POIs loaded: ${preEnriched.length}`);

    // 3. Merge: pre-enriched takes priority over OSM
    const merged = mergeWithOSM(preEnriched, osmPOIs);
    console.log(`[store] Total POIs after merge: ${merged.length} (${preEnriched.length} pre-enriched, ${osmPOIs.length} OSM)`);

    // 4. Calculate distance for each POI based on user location
    const { coords } = useLocationStore.getState();
    const withDistance = merged.map(poi => ({
      ...poi,
      distance_meters: haversineMeters(coords, poi.coordinates),
    }));

    set({ allPOIs: withDistance, isFetching: false });

    // 5. Background pre-heat: enrich the POIs nearest to the *viewport center* (lat/lng arg),
    //    not GPS — so dragging the map causes a fresh batch around the user's new focal point.
    const viewportCenter = { lat, lng };
    const candidates = [...withDistance]
      .filter(p => {
        const tag = p.hook_tag ?? '';
        const tagIsFallback = !tag || tag === (p.subcategory ?? '').toUpperCase();
        return tagIsFallback;
      })
      .map(p => ({ poi: p, dv: haversineMeters(viewportCenter, p.coordinates) }))
      .sort((a, b) => a.dv - b.dv)
      .slice(0, PREHEAT_LIMIT)
      .map(x => x.poi);

    if (candidates.length > 0) {
      console.log(`[store] Pre-heating ${candidates.length} nearest POIs (concurrency=${PREHEAT_CONCURRENCY})`);
      enrichPOIsBatch(
        candidates,
        (enriched) => {
          set((state) => ({
            allPOIs: state.allPOIs.map(p =>
              p.id === enriched.id
                ? { ...p, ...enriched, distance_meters: p.distance_meters }
                : p
            ),
            selectedPOI: state.selectedPOI?.id === enriched.id
              ? { ...state.selectedPOI, ...enriched, distance_meters: state.selectedPOI.distance_meters }
              : state.selectedPOI,
          }));
        },
        PREHEAT_CONCURRENCY,
      ).catch(e => console.warn('[store] pre-heat batch error:', e));
    }
  },
}));
