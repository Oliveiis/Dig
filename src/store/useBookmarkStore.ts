import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BookmarkEntry } from '../types/poi';

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
      addBookmark: (entry) => set((state) => ({
        bookmarks: [...state.bookmarks, entry]
      })),
      removeBookmark: (poi_id) => set((state) => ({
        bookmarks: state.bookmarks.filter(b => b.poi_id !== poi_id)
      })),
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
