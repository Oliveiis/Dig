import { create } from 'zustand';
import { POI, POICategory } from '../types/poi';
import { getPOIsNear, enrichAndCachePOI, clearCache } from '../services/poiCacheService';
import { useLocationStore } from './useLocationStore';
import { haversineMeters } from '../utils/distance';

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
    console.log('[store] digForPOI called for:', poi.name, '| why_worth_it:', poi.why_worth_it, '| hook_tag:', poi.hook_tag);
    if (poi.why_worth_it && poi.hook_tag) {
      console.log('[store] skipping, already enriched');
      return;
    }
    set({ isDigging: true });
    const enrichedPoi = await enrichAndCachePOI(poi);
    // 计算用户真实距离
    const { coords } = useLocationStore.getState();
    const distance_meters = haversineMeters(coords, poi.coordinates);
    const final = { ...enrichedPoi, distance_meters };
    set((state) => ({
      isDigging: false,
      allPOIs: state.allPOIs.map(p => p.id === poi.id ? final : p),
      selectedPOI: state.selectedPOI?.id === poi.id ? final : state.selectedPOI
    }));
  },
  refreshPOIs: async (lat, lng) => {
    set({ isFetching: true });
    clearCache();
    const pois = await getPOIsNear(lat, lng, 200);
    set({ allPOIs: pois, isFetching: false });
  }
}));
