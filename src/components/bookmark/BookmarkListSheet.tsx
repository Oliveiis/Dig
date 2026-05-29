import React, { useState } from 'react';
import { Bookmark, X, MapPin, ChevronRight } from 'lucide-react';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { usePOIStore } from '../../store/usePOIStore';
import { motion, AnimatePresence, PanInfo } from 'motion/react';

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

  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
            style={{ zIndex: 9998 }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '85vh', zIndex: 9999 }}
          >
            <div className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-border2 rounded-full" />
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-12">
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
