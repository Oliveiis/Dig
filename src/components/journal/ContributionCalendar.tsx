import React from 'react';
import { useJournalStore } from '../../store/useJournalStore';

export const ContributionCalendar: React.FC = () => {
  const { checkins } = useJournalStore();
  
  // Simplified heatmap for MVP: last 12 weeks
  const weeks = 12;
  const days = 7;
  const totalCells = weeks * days;
  
  const today = new Date();
  const cells = Array.from({ length: totalCells }).map((_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - (totalCells - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = checkins.filter(c => c.visited_at.startsWith(dateStr)).length;
    return { dateStr, count };
  });

  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-sans font-bold text-[14px]">打卡日誌</h3>
        <span className="font-mono text-[10px] text-text3">{checkins.length} TOTAL</span>
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1.5">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`w-full aspect-square rounded-[2px] transition-colors ${
              cell.count === 0 ? 'bg-surface2' :
              cell.count === 1 ? 'bg-accent/40' :
              cell.count === 2 ? 'bg-accent/70' : 'bg-accent'
            }`}
            title={`${cell.dateStr}: ${cell.count} check-ins`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-3 font-mono text-[9px] text-text3 uppercase">
        <span>{weeks} weeks ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};
