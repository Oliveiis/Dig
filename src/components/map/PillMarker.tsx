import React from 'react';
import { POI } from '../../types/poi';
import { CATEGORY_COLOR, getSubcategoryIcon, getSubcategoryLabel } from '../../utils/categoryConfig';

interface PillMarkerProps {
  poi: POI;
  isSelected: boolean;
  onClick: () => void;
}

function compactCount(count?: number) {
  if (!count) return null;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

export const PillMarker: React.FC<PillMarkerProps> = ({ poi, isSelected, onClick }) => {
  const Icon = getSubcategoryIcon(poi.subcategory);
  const isClosed = poi.is_open_now === false;
  const hook = poi.hook_tag && poi.hook_tag !== poi.subcategory.toUpperCase()
    ? poi.hook_tag
    : null;
  const hasRecommendation = Boolean(hook || poi.signature_items?.length || poi.recommendation_count || poi.mention_count);
  const localizedCategory = getSubcategoryLabel(poi.subcategory, poi.category);
  const reason = hook || poi.signature_items?.[0] || localizedCategory;
  const proof = compactCount(poi.recommendation_count);

  return (
    <button
      onClick={onClick}
      aria-label={`${poi.name}，${reason}`}
      className={`
        map-note flex items-center gap-2 min-w-[148px] max-w-[180px] min-h-[44px] p-1.5 pr-2.5 bg-white text-left
        cursor-pointer select-none transition-[transform,opacity] duration-150 active:scale-95
        ${isSelected
          ? 'ring-2 ring-app-accent'
          : ''
        }
        ${isClosed ? 'opacity-40' : 'opacity-100'}
      `}
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${CATEGORY_COLOR[poi.category]}28`, color: CATEGORY_COLOR[poi.category] }}
      >
        <Icon
          size={15}
          strokeWidth={2.2}
        />
      </div>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-sans text-[11px] leading-tight font-semibold text-app-text">{poi.name}</span>
        <span className="mt-1 flex items-center gap-1 truncate font-sans text-[9px] leading-tight font-medium text-app-accent">
          <span className="truncate">{hasRecommendation ? `值得去 · ${reason}` : localizedCategory}</span>
          {proof && <span className="shrink-0 text-[8px] font-sans font-medium text-app-text3">{proof}</span>}
        </span>
      </span>
    </button>
  );
};
