import React from 'react';
import { POI } from '../../types/poi';
import { CATEGORY_COLOR } from '../../utils/categoryConfig';

interface MinimalDotProps {
  poi: POI;
  onClick: () => void;
}

export const MinimalDot: React.FC<MinimalDotProps> = ({ poi, onClick }) => {
  const isClosed = poi.is_open_now === false;

  return (
    <div
      onClick={onClick}
      className={`w-[6px] h-[6px] rounded-full border border-white cursor-pointer transition-[opacity,scale] duration-150 active:scale-150 ${isClosed ? 'opacity-25' : 'opacity-65'}`}
      style={{
        backgroundColor: CATEGORY_COLOR[poi.category],
        transform: 'translate(-50%, -50%)',
      }}
      title={poi.name}
    />
  );
};
