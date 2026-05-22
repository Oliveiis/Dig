import { useMemo } from 'react';

interface CheckinHeatmapProps {
  checkinDates: string[];
}

export function CheckinHeatmap({ checkinDates }: CheckinHeatmapProps) {
  const days = 7;
  const weeks = 18; // Roughly 4 months
  
  const data = useMemo(() => {
    const today = new Date();
    const result = [];
    
    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let d = 0; d < days; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - ((weeks - 1 - w) * 7 + (days - 1 - d)));
        
        const dateStr = date.toISOString().split('T')[0];
        const count = checkinDates.filter(d => d.startsWith(dateStr)).length;
        
        week.push({
          date: dateStr,
          count
        });
      }
      result.push(week);
    }
    return result;
  }, [checkinDates]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] font-mono text-app-text3 uppercase tracking-widest">打卡熱力圖 Check-in Heatmap</h3>
      <div className="bg-white border border-app-border rounded-2xl p-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {data.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                <div 
                  key={dIdx}
                  title={`${day.date}: ${day.count} check-ins`}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    day.count === 0 ? 'bg-app-surface' :
                    day.count === 1 ? 'bg-app-accent/30' :
                    day.count === 2 ? 'bg-app-accent/60' :
                    'bg-app-accent'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[9px] font-mono text-app-text3 uppercase tracking-tighter">
          <span>4 Months Ago</span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
