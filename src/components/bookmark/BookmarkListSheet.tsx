import React, { useState } from 'react';
import { Bookmark, X, MapPin, ChevronRight, BellRing } from 'lucide-react';
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

  const [, setIsDragging] = useState(false);

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
            className="fixed inset-0 z-[70] bg-[#18323A]/18"
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
            className="fixed bottom-0 left-1/2 z-[80] flex max-h-[78dvh] w-full max-w-[430px] -translate-x-1/2 flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_-6px_18px_rgba(24,50,58,0.16)]"
          >
            <div className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="h-1 w-10 rounded-full bg-border2" />
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-12">
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bookmark size={20} className="text-app-accent" fill="currentColor" />
                    <div>
                      <h2 className="text-[19px] font-bold text-app-text">想去的地方</h2>
                      <p className="mt-0.5 text-[11px] text-app-text3">接近 500 公尺時提醒你</p>
                    </div>
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
                        className="flex min-h-[82px] items-center justify-between gap-3 rounded-xl bg-app-surface2 p-3 text-left transition-transform active:scale-[0.98]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {poi.photos?.[0] ? <img src={poi.photos[0].url} alt={poi.photos[0].alt} className="h-14 w-14 shrink-0 rounded-lg object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-app-accent"><MapPin size={20} /></div>}
                          <div>
                            <h3 className="truncate text-[13px] font-bold text-app-text">{poi.name}</h3>
                            <p className="mt-1 line-clamp-1 text-[11px] text-app-text2">{poi.decision?.headline || poi.subcategory}</p>
                            <p className="mt-1 flex items-center gap-1 text-[9px] font-medium text-app-accent"><BellRing size={10} /> 到店提醒已開啟 · {new Date(bookmarked_at).toLocaleDateString()}</p>
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
