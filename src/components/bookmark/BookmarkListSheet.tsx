import React from 'react';
import { Bookmark, X, MapPin, ChevronRight } from 'lucide-react';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { usePOIStore } from '../../store/usePOIStore';
import { BottomSheet } from '../common/BottomSheet';

interface BookmarkListSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarkListSheet({ isOpen, onClose }: BookmarkListSheetProps) {
  const { bookmarks } = useBookmarkStore();
  const { allPOIs, setSelectedPOI, setShowFullCard } = usePOIStore();

  const bookmarkedPOIs = bookmarks.map(b => {
    const poi = allPOIs.find(p => p.id === b.poi_id);
    return { ...b, poi };
  }).filter(b => b.poi);

  const handlePOIClick = (poi: any) => {
    setSelectedPOI(poi);
    setShowFullCard(true);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bookmark size={20} className="text-app-accent" fill="currentColor" />
            <h2 className="text-xl font-bold text-app-text font-display">待去清單</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-app-surface flex items-center justify-center text-app-text2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pb-6">
          {bookmarkedPOIs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-app-text3">
              <Bookmark size={40} strokeWidth={1} />
              <p className="text-sm font-medium">暫無收藏的店舖</p>
            </div>
          ) : (
            bookmarkedPOIs.map(({ poi, bookmarked_at }) => (
              <button
                key={poi.id}
                onClick={() => handlePOIClick(poi)}
                className="flex items-center justify-between p-4 rounded-2xl bg-app-surface border border-app-border active:scale-[0.98] transition-transform text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-app-accent/10 flex items-center justify-center text-app-accent">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-app-text">{poi.name}</h3>
                    <p className="text-[10px] font-mono text-app-text3 uppercase tracking-wider mt-0.5">
                      {poi.district} · {new Date(bookmarked_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-app-text3" />
              </button>
            ))
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
