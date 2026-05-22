import { useMemo } from 'react';
import { CheckinEntry } from '../../types/poi';
import { startOfDay, subDays, isSameDay } from 'date-fns';

interface HeatmapProps {
  checkins: CheckinEntry[];
}

export function Heatmap({ checkins }: HeatmapProps) {
  const data = useMemo(() => {
    const days = 182; // 26 weeks * 7 days = 182 days (~6 months)
    const heatmapData = [];
    const now = startOfDay(new Date());

    for (let i = days - 1; i >= 0; i--) {
      const targetDate = subDays(now, i);
      const count = checkins.filter(c => isSameDay(new Date(c.visited_at), targetDate)).length;
      
      // Map count to level 0-4
      let level = 0;
      if (count >= 4) level = 4;
      else if (count >= 2) level = 3;
      else if (count === 1) level = 1; // Level 2 skipped for more contrast or use it for 2?
      // Let's do: 1 -> 1, 2 -> 2, 3 -> 3, 4+ -> 4
      if (count === 1) level = 1;
      else if (count === 2) level = 2;
      else if (count === 3) level = 3;
      else if (count >= 4) level = 4;

      heatmapData.push(level);
    }
    return heatmapData;
  }, [checkins]);

  const getColorClass = (level: number) => {
    switch (level) {
      case 1: return 'bg-[#d4e8b0]';
      case 2: return 'bg-[#a8d06a]';
      case 3: return 'bg-[#6aaa1a]';
      case 4: return 'bg-[#1a1a1a]';
      default: return 'bg-app-border/30';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[repeat(26,1fr)] gap-[3px]">
        {data.map((level, i) => (
          <div
            key={i}
            className={`aspect-square rounded-[1px] ${getColorClass(level)}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-1">
        <span className="text-[9px] font-mono text-app-text3">少</span>
        <div className="w-2 h-2 rounded-[1px] bg-app-border/30" />
        <div className="w-2 h-2 rounded-[1px] bg-[#d4e8b0]" />
        <div className="w-2 h-2 rounded-[1px] bg-[#a8d06a]" />
        <div className="w-2 h-2 rounded-[1px] bg-[#6aaa1a]" />
        <div className="w-2 h-2 rounded-[1px] bg-[#1a1a1a]" />
        <span className="text-[9px] font-mono text-app-text3">多</span>
      </div>
    </div>
  );
}
