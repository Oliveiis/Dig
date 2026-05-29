import React from 'react';
import { POI } from '../../types/poi';

interface ActionButtonsProps {
  poi: POI;
  onCheckin: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ poi, onCheckin }) => {
  const mapsUrl = poi.source_links?.google_maps
    || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Hong Kong')}`;
  const xhsUrl = poi.source_links?.xiaohongshu;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold py-[11px] rounded-[8px] bg-[#1a1a1a] text-white transition-opacity active:opacity-80 ${xhsUrl ? 'flex-1' : 'w-full'}`}
        >
          🚀 導航前往
        </a>
        {xhsUrl && (
          <a
            href={xhsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold py-[11px] rounded-[8px] bg-white text-[#1a1a1a] border border-[#e0e0e0] transition-opacity active:opacity-80"
          >
            📖 查看原帖
          </a>
        )}
      </div>
      <button
        onClick={onCheckin}
        className="w-full font-mono text-[10px] font-bold py-[11px] rounded-[8px] bg-[#f5f5f5] text-[#1a1a1a] border border-[#e0e0e0] transition-opacity active:opacity-80"
      >
        ◎ 打個卡
      </button>
    </div>
  );
};
