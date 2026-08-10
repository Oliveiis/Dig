import { MapContainer } from '../components/map/MapContainer';
import { CategoryFilterChips } from '../components/wander/CategoryFilterChips';
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
import { DecisionRail } from '../components/wander/DecisionRail';

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
      <header className="absolute top-0 left-0 right-0 h-20 px-5 pt-9 pb-3 flex justify-between items-end z-50 pointer-events-none">
        <div className="flex flex-col gap-0.5 pointer-events-auto">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-[-0.03em] text-app-accent">
            dig <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[9px] font-semibold tracking-wide text-app-accent">港島 MVP</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsBookmarkSheetOpen(true)}
            aria-label="打開收藏"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-app-accent shadow-[0_3px_8px_rgba(24,50,58,0.15)] active:scale-95 transition-transform"
          >
            <Bookmark size={18} />
          </button>
          <button
            onClick={() => setIsDistrictSelectorOpen(true)}
            aria-label="選擇探索區域"
            className="h-10 flex items-center gap-1.5 px-3.5 rounded-full bg-white text-app-text font-semibold text-xs shadow-[0_3px_8px_rgba(24,50,58,0.15)] active:scale-95 transition-transform"
          >
            {currentDistrict.name} <ChevronDown size={14} className="text-app-text2" />
          </button>
        </div>
      </header>

      {/* Map */}
      <MapContainer />

      {/* Filter Chips */}
      <CategoryFilterChips />

      {/* Compact store comparison cards keep content browsing independent from the map camera. */}
      {!showFullCard && <DecisionRail />}

      {/* A single half-sheet holds the complete store decision; there is no duplicate SKU stage. */}
      {showFullCard && selectedPOI && (
        <FactCard
          key={selectedPOI.id}
          poi={selectedPOI}
          initialStage="decision"
          onClose={() => setShowFullCard(false)}
          onCheckin={() => { setIsCheckinOpen(true); }}
          onFavourite={() => { setIsFavouriteOpen(true); }}
        />
      )}
    </div>
  );
}
