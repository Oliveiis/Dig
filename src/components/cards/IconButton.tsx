import React from 'react';
import { useJournalStore } from '../../store/useJournalStore';
import { useFavouriteStore } from '../../store/useFavouriteStore';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { POI } from '../../types/poi';

interface IconButtonProps {
  poi: POI;
  onFavourite: () => void;
  onBookmarkToast: (msg: string) => void;
}

export const IconButtons: React.FC<IconButtonProps> = ({ poi, onFavourite, onBookmarkToast }) => {
  const hasCheckedIn = useJournalStore(s => s.hasCheckedIn(poi.id));
  const isFavourited = useFavouriteStore(s => s.isFavourited(poi.id));
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(poi.id);

  const toggleBookmark = () => {
    if (bookmarked) {
      removeBookmark(poi.id);
      onBookmarkToast('已取消收藏');
    } else {
      addBookmark({ poi_id: poi.id, poi_name: poi.name, bookmarked_at: new Date().toISOString(), notified_nearby: false });
      onBookmarkToast('已收藏 · 到達附近時提醒你');
    }
  };

  return (
    <div className="flex items-center gap-[6px]">
      {/* 喜爱 */}
      <button
        onClick={hasCheckedIn ? onFavourite : undefined}
        disabled={!hasCheckedIn}
        title={!hasCheckedIn ? '先打個點再喜愛' : undefined}
        className="w-8 h-8 rounded-full border flex items-center justify-center text-[14px] transition-all"
        style={{
          background: isFavourited ? '#fff0f0' : '#f5f5f5',
          borderColor: isFavourited ? '#ffcccc' : '#e8e8e8',
          opacity: hasCheckedIn ? 1 : 0.3,
          cursor: hasCheckedIn ? 'pointer' : 'default',
        }}
      >
        {isFavourited ? '♥' : '♡'}
      </button>

      {/* 收藏 */}
      <button
        onClick={toggleBookmark}
        className="w-8 h-8 rounded-full border flex items-center justify-center text-[14px] transition-all"
        style={{
          background: bookmarked ? '#f0f0f0' : '#f5f5f5',
          borderColor: bookmarked ? '#ccc' : '#e8e8e8',
        }}
      >
        {bookmarked ? '★' : '☆'}
      </button>
    </div>
  );
};
