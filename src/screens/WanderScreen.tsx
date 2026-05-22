import { MapContainer } from '../components/map/MapContainer';
import { CategoryFilterChips } from '../components/wander/CategoryFilterChips';
import { BottomSheet } from '../components/common/BottomSheet';
import { FactCard } from '../components/cards/FactCard';
import { usePOIStore } from '../store/usePOIStore';
import { useLocationStore } from '../store/useLocationStore';
import { ChevronDown, Bookmark } from 'lucide-react';
import { ProximityAlertBanner } from '../components/wander/ProximityAlertBanner';
import { useProximityAlert } from '../hooks/useProximityAlert';
import { useState } from 'react';
import { BookmarkListSheet } from '../components/bookmark/BookmarkListSheet';
import { DistrictSelector } from '../components/map/DistrictSelector';
import { QuickCheckinModal } from '../components/journal/QuickCheckinModal';
import { FavouriteReviewModal } from '../components/favourite/FavouriteReviewModal';

export function WanderScreen() {
  const { selectedPOI, showFullCard, setShowFullCard } = usePOIStore();
  const { currentDistrict, setDistrict } = useLocationStore();
  const [isBookmarkSheetOpen, setIsBookmarkSheetOpen] = useState(false);
  const [isDistrictSelectorOpen, setIsDistrictSelectorOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isFavouriteOpen, setIsFavouriteOpen] = useState(false);

  useProximityAlert();

  return (
    <div className="relative w-full h-full bg-app-bg overflow-hidden">
      <ProximityAlertBanner />
      <BookmarkListSheet
        isOpen={isBookmarkSheetOpen}
        onClose={() => setIsBookmarkSheetOpen(false)}
      />
      <DistrictSelector
        isOpen={isDistrictSelectorOpen}
        onClose={() => setIsDistrictSelectorOpen(false)}
        onSelect={setDistrict}
        currentDistrictId={currentDistrict.id}
      />
      {selectedPOI && (
        <QuickCheckinModal
          poi={selectedPOI}
          isOpen={isCheckinOpen}
          onClose={() => setIsCheckinOpen(false)}
        />
      )}
      {selectedPOI && (
        <FavouriteReviewModal
          poi={selectedPOI}
          isOpen={isFavouriteOpen}
          onClose={() => setIsFavouriteOpen(false)}
        />
      )}

      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 h-20 px-6 pt-10 pb-4 flex justify-between items-end z-50 pointer-events-none">
        <div className="flex flex-col gap-0.5 pointer-events-auto">
          <h1 className="text-2xl font-bold tracking-tighter text-app-text font-display flex items-center gap-2">
            dig <span className="text-[10px] font-mono text-app-accent uppercase tracking-widest bg-app-accent/10 px-1.5 py-0.5 rounded border border-app-accent/20">beta</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsBookmarkSheetOpen(true)}
            className="w-9 h-9 rounded-full bg-app-surface/80 backdrop-blur-md border border-app-border flex items-center justify-center text-app-text active:scale-95 transition-transform"
          >
            <Bookmark size={18} />
          </button>
          <button
            onClick={() => setIsDistrictSelectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-app-surface/80 backdrop-blur-md border border-app-border text-app-text font-bold text-xs active:scale-95 transition-transform"
          >
            {currentDistrict.name} <ChevronDown size={14} className="text-app-text2" />
          </button>
        </div>
      </header>

      {/* Map */}
      <MapContainer />

      {/* Filter Chips */}
      <CategoryFilterChips />

      {/* Fact Card Bottom Sheet */}
      <BottomSheet isOpen={showFullCard} onClose={() => setShowFullCard(false)}>
        {selectedPOI && (
          <FactCard
            poi={selectedPOI}
            onClose={() => setShowFullCard(false)}
            onCheckin={() => { setIsCheckinOpen(true); }}
            onFavourite={() => { setIsFavouriteOpen(true); }}
          />
        )}
      </BottomSheet>
    </div>
  );
}
