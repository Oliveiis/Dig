import { create } from 'zustand';
import { POI, POICategory } from '../types/poi';
import { getPOIsNear, enrichAndCachePOI, abortActiveBatch } from '../services/poiCacheService';
import { loadPreEnrichedPOIs, mergeWithOSM } from '../services/preEnrichedService';
import { useLocationStore } from './useLocationStore';
import { haversineMeters } from '../utils/distance';

let refreshSequence = 0;

export type ExploreIntent = 'for_you' | 'nearby' | 'sweet' | 'takeaway' | 'saved';

interface POIStore {
  allPOIs: POI[];
  activeFilter: 'all' | POICategory;
  activeIntent: ExploreIntent;
  selectedPOI: POI | null;
  showFullCard: boolean;
  isDigging: boolean;
  isFetching: boolean;
  setFilter: (f: 'all' | POICategory) => void;
  setIntent: (intent: ExploreIntent) => void;
  setSelectedPOI: (poi: POI | null) => void;
  setShowFullCard: (show: boolean) => void;
  digForPOI: (poi: POI) => Promise<void>;
  refreshPOIs: (lat: number, lng: number) => Promise<void>;
}

export const usePOIStore = create<POIStore>((set, get) => ({
  allPOIs: [],
  activeFilter: 'all',
  activeIntent: 'for_you',
  selectedPOI: null,
  showFullCard: false,
  isDigging: false,
  isFetching: false,
  setFilter: (activeFilter) => set({ activeFilter }),
  setIntent: (activeIntent) => set({ activeIntent }),
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
    const refreshId = ++refreshSequence;
    set({ isFetching: true });
    abortActiveBatch();

    try {
      // Show the bundled POIs immediately. OSM is an enhancement, not a gate.
      const preEnriched = await loadPreEnrichedPOIs();
      if (refreshId !== refreshSequence) return;
      console.log(`[store] Pre-enriched POIs loaded: ${preEnriched.length}`);

      const addDistance = (pois: POI[]) => {
        const { coords } = useLocationStore.getState();
        return pois.map(poi => ({
          ...poi,
          distance_meters: haversineMeters(coords, poi.coordinates),
        }));
      };

      set({ allPOIs: addDistance(preEnriched) });

      // Cached enrichment is auto-applied inside getPOIsNear. The request has a
      // short timeout, so unavailable Overpass mirrors cannot freeze the UI.
      const osmPOIs = await getPOIsNear(lat, lng, 1000);
      if (refreshId !== refreshSequence) return;

      const merged = mergeWithOSM(preEnriched, osmPOIs);
      console.log(`[store] Total POIs after merge: ${merged.length} (${preEnriched.length} pre-enriched, ${osmPOIs.length} OSM)`);
      const withDistance = addDistance(merged);
      set({ allPOIs: withDistance });

      // MVP rule: basic OSM points remain neutral. We only publish a Dig
      // recommendation after an editorial/evidence record exists, so viewport
      // movement can never manufacture "worth going" copy in the background.
    } catch (error) {
      console.warn('[store] POI refresh failed:', error);
    } finally {
      if (refreshId === refreshSequence) set({ isFetching: false });
    }
  },
}));
