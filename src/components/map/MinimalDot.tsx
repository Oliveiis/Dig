import React from 'react';
import { POI } from '../../types/poi';

interface MinimalDotProps {
  poi: POI;
  onClick: () => void;
}

export const MinimalDot: React.FC<MinimalDotProps> = ({ poi, onClick }) => {
  const isClosed = poi.is_open_now === false;

  return (
    <div
      onClick={onClick}
      className={`w-2 h-2 rounded-full bg-app-text border border-white shadow-sm cursor-pointer transition-transform active:scale-150 ${isClosed ? 'opacity-30' : 'opacity-70'}`}
      style={{ transform: 'translate(-50%, -50%)' }}
    />
  );
};
