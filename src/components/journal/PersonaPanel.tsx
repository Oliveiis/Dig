import { useMemo } from 'react';
import { Persona } from '../../services/personaService';
import { Heatmap } from './Heatmap';
import { CheckinEntry } from '../../types/poi';

interface PersonaPanelProps {
  persona: Persona;
  checkins: CheckinEntry[];
}

export function PersonaPanel({ persona, checkins }: PersonaPanelProps) {
  const stats = useMemo(() => {
    if (checkins.length === 0) return { regretRate: 0, topDistrict: '尚未打卡' };

    const regrets = checkins.filter(c => c.reaction === 'regret').length;
    const regretRate = Math.round((regrets / checkins.length) * 100);

    const districtCounts: Record<string, number> = {};
    checkins.forEach(c => {
      districtCounts[c.poi_district] = (districtCounts[c.poi_district] || 0) + 1;
    });

    const topDistrict = Object.entries(districtCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '未知';

    return { regretRate, topDistrict };
  }, [checkins]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Persona Card */}
      <div className="bg-app-surface border border-app-border rounded-3xl p-5 ios-shadow">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{persona.emoji}</span>
          <span className="text-[17px] font-bold font-display text-app-text">{persona.title}</span>
        </div>
        <div className="text-[10px] font-mono text-app-text3 mb-3 uppercase tracking-wider">
          {persona.unlock_info}
        </div>
        
        <div className="border-l-2 border-app-accent pl-4 mb-6">
          <p className="text-[11px] font-mono leading-relaxed text-app-text2">
            {persona.description}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {persona.attributes.map((attr, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="w-12 shrink-0 text-[10px] font-mono text-app-text3">{attr.label}</span>
              <div className="flex-1">
                <div className="h-[3px] bg-app-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-app-accent rounded-full" 
                    style={{ width: `${attr.value}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] font-mono text-app-text3 uppercase">{attr.min_label}</span>
                  <span className="text-[8px] font-mono text-app-text3 uppercase">{attr.max_label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-6">
          {persona.skills.map((skill, i) => (
            <span 
              key={i} 
              className={`px-3 py-1 rounded-full text-[10px] font-mono border ${
                i === 0 ? 'bg-app-accent text-white border-app-accent' : 'bg-transparent text-app-text2 border-app-border'
              }`}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Mini Stats */}
      <div className="flex gap-2">
        <div className="flex-1 bg-app-surface border border-app-border rounded-2xl p-4 text-center">
          <span className="block text-lg font-bold font-display text-app-text">{checkins.length}</span>
          <span className="block text-[9px] font-mono text-app-text3 uppercase mt-1">打卡總數</span>
        </div>
        <div className="flex-1 bg-app-surface border border-app-border rounded-2xl p-4 text-center">
          <span className="block text-lg font-bold font-display text-app-text">{stats.regretRate}%</span>
          <span className="block text-[9px] font-mono text-app-text3 uppercase mt-1">踩雷率</span>
        </div>
        <div className="flex-1 bg-app-surface border border-app-border rounded-2xl p-4 text-center flex flex-col justify-center">
          <span className="block text-[11px] font-bold font-display text-app-text truncate">{stats.topDistrict}</span>
          <span className="block text-[9px] font-mono text-app-text3 uppercase mt-1">最常出沒</span>
        </div>
      </div>

      {/* Heatmap Section */}
      <section>
        <h3 className="text-[10px] font-mono text-app-text3 uppercase tracking-widest mb-3">過去六個月打卡熱力圖</h3>
        <Heatmap checkins={checkins} />
      </section>

      {/* Recent Checkins */}
      <section>
        <h3 className="text-[10px] font-mono text-app-text3 uppercase tracking-widest mb-3">最近打卡</h3>
        <div className="flex flex-col">
          {checkins.slice(-4).reverse().map((ci, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-app-border last:border-none">
              <div className="w-8 h-8 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-sm shrink-0">
                {ci.poi_category === 'cafe' ? '☕' : ci.poi_category === 'bar' ? '🍸' : '🍜'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-app-text truncate">{ci.poi_name}</div>
                <div className="text-[10px] font-mono text-app-text3 truncate">
                  {ci.poi_subcategory} · {new Date(ci.visited_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-[10px] font-mono text-app-text3 shrink-0">
                {ci.reaction === 'comeback' ? '✅ 名不虛傳' : ci.reaction === 'as_expected' ? '👌 正常發揮' : '😐 一般般'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
