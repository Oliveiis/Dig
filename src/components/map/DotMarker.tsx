import React from 'react';
import { POI } from '../../types/poi';
import { CATEGORY_COLOR } from '../../utils/categoryConfig';

interface DotMarkerProps {
  poi: POI;
  onClick: () => void;
}

export const DotMarker: React.FC<DotMarkerProps> = ({ poi, onClick }) => {
  const isClosed = poi.is_open_now === false;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center justify-center w-[14px] h-[14px] rounded-full bg-white
        shadow-[0_1px_3px_rgba(24,50,58,0.2)] cursor-pointer active:scale-125
        transition-[transform,opacity] duration-150
        ${isClosed ? 'opacity-40' : 'opacity-100'}
      `}
      style={{ transform: 'translate(-50%, -50%)' }}
      title={poi.name}
    >
      <div
        className="w-[8px] h-[8px] rounded-full"
        style={{ backgroundColor: CATEGORY_COLOR[poi.category] }}
      />
    </div>
  );
};
