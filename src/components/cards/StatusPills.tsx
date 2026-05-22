import React from 'react';
import { POI } from '../../types/poi';
import { haversineMeters, formatDistance } from '../../utils/distance';
import { useLocationStore } from '../../store/useLocationStore';

interface StatusPillsProps {
  poi: POI;
}

export const StatusPills: React.FC<StatusPillsProps> = ({ poi }) => {
  const { coords } = useLocationStore();
  const dist = formatDistance(haversineMeters(coords, poi.coordinates));

  return (
    <div className="flex flex-wrap gap-[6px]">
      {poi.is_open_now === true && (
        <span className="flex items-center gap-1 font-mono text-[9px] px-[9px] py-1 rounded-full bg-[#f0fce8] border border-[#b6e87a] text-[#4a7c10]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4a7c10]" /> 營業中
        </span>
      )}
      {poi.is_open_now === false && (
        <span className="flex items-center gap-1 font-mono text-[9px] px-[9px] py-1 rounded-full bg-[#fff5f5] border border-[#ffc0c0] text-[#c03030]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c03030]" /> 已關閉
        </span>
      )}
      {poi.payment.visa === true && (
        <span className="font-mono text-[9px] px-[9px] py-1 rounded-full bg-[#e8f2ff] border border-[#99c4f5] text-[#1a5caa]">
          💳 Visa 可用
        </span>
      )}
      {poi.payment.visa === false && (
        <span className="font-mono text-[9px] px-[9px] py-1 rounded-full bg-[#f5f5f5] border border-[#e8e8e8] text-[#555]">
          💵 {poi.payment.note || '僅限現金'}
        </span>
      )}
      {poi.payment.visa === null && (
        <span className="font-mono text-[9px] text-[#aaa]">支付方式未知</span>
      )}
      <span className="font-mono text-[9px] px-[9px] py-1 rounded-full bg-[#f5f5f5] border border-[#e8e8e8] text-[#555]">
        📍 {dist}
      </span>
    </div>
  );
};
