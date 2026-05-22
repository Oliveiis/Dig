import React from 'react';
import { POI } from '../../types/poi';
import { SectionHeader } from './SectionHeader';
import { StatusPills } from './StatusPills';
import { FlashEventBanner } from './FlashEventBanner';
import { SignatureItems } from './SignatureItems';
import { Souvenirs } from './Souvenirs';
import { WhyWorthIt } from './WhyWorthIt';
import { Caveats } from './Caveats';
import { IconButtons } from './IconButton';
import { ActionButtons } from './ActionButtons';
import { usePOIStore } from '../../store/usePOIStore';
import { Loader2 } from 'lucide-react';

interface FactCardContentProps {
  poi: POI;
  onClose: () => void;
  onCheckin: () => void;
  onFavourite: () => void;
  onBookmarkToast: (msg: string) => void;
}

export const FactCardContent: React.FC<FactCardContentProps> = ({
  poi, onClose, onCheckin, onFavourite, onBookmarkToast,
}) => {
  const { isDigging } = usePOIStore();

  return (
    <div className="flex flex-col gap-4 px-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[18px] font-bold text-[#1a1a1a] leading-[1.25]">{poi.name}</h2>
          <p className="font-mono text-[10px] text-[#555] mt-[3px]">{poi.subcategory} · {poi.district}</p>
        </div>
        <div className="flex items-center gap-[6px] flex-shrink-0">
          <IconButtons poi={poi} onFavourite={onFavourite} onBookmarkToast={onBookmarkToast} />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#e8e8e8] bg-[#f5f5f5] flex items-center justify-center text-[14px] text-[#555]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Status pills */}
      <StatusPills poi={poi} />

      {/* Flash event */}
      {poi.flash_event && <FlashEventBanner event={poi.flash_event} />}

      {/* Loading */}
      {isDigging && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 size={14} className="text-[#aaa] animate-spin" />
          <span className="font-mono text-[10px] text-[#aaa] animate-pulse">正在挖掘情報...</span>
        </div>
      )}

      {/* Sections */}
      {poi.signature_items?.length > 0 && (
        <div>
          <SectionHeader label="招牌品" />
          <SignatureItems items={poi.signature_items} />
        </div>
      )}

      {poi.souvenirs?.length > 0 && (
        <div>
          <SectionHeader label="伴手禮 / 帶走" />
          <Souvenirs items={poi.souvenirs} />
        </div>
      )}

      {poi.why_worth_it && (
        <div>
          <SectionHeader label="為什麼值得去" />
          <WhyWorthIt text={poi.why_worth_it} />
        </div>
      )}

      {poi.caveats?.length > 0 && (
        <div>
          <SectionHeader label="注意" />
          <Caveats caveats={poi.caveats} />
        </div>
      )}

      {poi.hours && (
        <div>
          <SectionHeader label="營業時間" />
          <p className="font-mono text-[11px] text-[#555]">{poi.hours}</p>
        </div>
      )}

      {/* Actions */}
      <ActionButtons poi={poi} onCheckin={onCheckin} />
    </div>
  );
};
