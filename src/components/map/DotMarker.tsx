import React from 'react';
import { POI } from '../../types/poi';
import { getSubcategoryIcon } from '../../utils/categoryConfig';

interface DotMarkerProps {
  poi: POI;
  onClick: () => void;
}

export const DotMarker: React.FC<DotMarkerProps> = ({ poi, onClick }) => {
  const Icon = getSubcategoryIcon(poi.subcategory);
  const isClosed = poi.is_open_now === false;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center justify-center w-7 h-7 rounded-full
        bg-app-text shadow-md cursor-pointer active:scale-95
        transition-all duration-150
        ${isClosed ? 'opacity-40' : 'opacity-100'}
      `}
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <div className="text-white">
        <Icon size={14} strokeWidth={2.5} />
      </div>
    </div>
  );
};
