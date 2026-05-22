import React from 'react';
import { POI } from '../../types/poi';
import { getSubcategoryIcon } from '../../utils/categoryConfig';

interface PillMarkerProps {
  poi: POI;
  isSelected: boolean;
  onClick: () => void;
}

export const PillMarker: React.FC<PillMarkerProps> = ({ poi, isSelected, onClick }) => {
  const Icon = getSubcategoryIcon(poi.subcategory);
  const isClosed = poi.is_open_now === false;
  const label = poi.hook_tag && poi.hook_tag !== poi.subcategory.toUpperCase()
    ? poi.hook_tag
    : poi.subcategory || poi.name;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-1.5 h-7 px-2.5 rounded-full whitespace-nowrap
        cursor-pointer select-none transition-all duration-150 active:scale-95
        ${isSelected
          ? 'bg-white border-2 border-app-text shadow-xl'
          : 'bg-app-text border border-transparent shadow-md hover:shadow-lg'
        }
        ${isClosed ? 'opacity-40' : 'opacity-100'}
      `}
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <div className={isSelected ? 'text-app-text' : 'text-white'}>
        <Icon size={13} strokeWidth={2.5} />
      </div>
      <span className={`font-sans text-[11px] font-bold tracking-tight ${isSelected ? 'text-app-text' : 'text-white'}`}>
        {label}
      </span>
    </div>
  );
};
