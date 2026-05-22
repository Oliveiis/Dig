import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FavouriteEntry, TasteProfile } from '../types/poi';
import { deriveTasteProfile } from '../utils/tasteProfile';

import { useJournalStore } from './useJournalStore';
import { usePOIStore } from './usePOIStore';

interface FavouriteStore {
  favourites: FavouriteEntry[];
  addFavourite: (entry: FavouriteEntry) => void;
  removeFavourite: (poi_id: string) => void;
  isFavourited: (poi_id: string) => boolean;
  getTasteProfile: () => TasteProfile;
}

export const useFavouriteStore = create<FavouriteStore>()(
  persist(
    (set, get) => ({
      favourites: [],
      addFavourite: (entry) => set((state) => ({
        favourites: [...state.favourites.filter(f => f.poi_id !== entry.poi_id), entry]
      })),
      removeFavourite: (poi_id) => set((state) => ({
        favourites: state.favourites.filter(f => f.poi_id !== poi_id)
      })),
      isFavourited: (poi_id) => get().favourites.some(f => f.poi_id === poi_id),
      getTasteProfile: () => {
        const checkins = useJournalStore.getState().checkins;
        const allPOIs = usePOIStore.getState().allPOIs;
        return deriveTasteProfile(get().favourites, checkins, allPOIs);
      },
    }),
    { name: 'dig-favourites' }
  )
);
