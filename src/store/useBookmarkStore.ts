import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BookmarkEntry } from '../types/poi';

function syncSave(placeId: string, saved: boolean) {
  const url = saved ? '/api/saves' : `/api/saves/${encodeURIComponent(placeId)}?user_id=demo-user`;
  fetch(url, saved ? {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 'demo-user', place_id: placeId }),
  } : { method: 'DELETE' }).catch(() => {
    // Local state remains authoritative for the offline-capable MVP.
  });
}

interface BookmarkStore {
  bookmarks: BookmarkEntry[];
  addBookmark: (entry: BookmarkEntry) => void;
  removeBookmark: (poi_id: string) => void;
  isBookmarked: (poi_id: string) => boolean;
  markNotified: (poi_id: string) => void;
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (entry) => {
        set((state) => ({
          bookmarks: state.bookmarks.some((item) => item.poi_id === entry.poi_id)
            ? state.bookmarks
            : [...state.bookmarks, entry]
        }));
        syncSave(entry.poi_id, true);
      },
      removeBookmark: (poi_id) => {
        set((state) => ({ bookmarks: state.bookmarks.filter(b => b.poi_id !== poi_id) }));
        syncSave(poi_id, false);
      },
      isBookmarked: (poi_id) => get().bookmarks.some(b => b.poi_id === poi_id),
      markNotified: (poi_id) => set((state) => ({
        bookmarks: state.bookmarks.map(b => 
          b.poi_id === poi_id ? { ...b, notified_nearby: true } : b
        )
      })),
    }),
    { name: 'dig-bookmarks' }
  )
);
