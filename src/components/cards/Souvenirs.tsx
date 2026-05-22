import React from 'react';
import { Gift } from 'lucide-react';

interface SouvenirsProps {
  items: { name: string; price_hkd: number | null }[];
}

export function Souvenirs({ items }: SouvenirsProps) {
  return (
    <section>
      <h4 className="text-[10px] font-mono text-app-text3 uppercase tracking-widest mb-3 flex items-center gap-2">
        ── 值得帶走 ─────────────────────
      </h4>
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-app-surface border border-app-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-app-accent/10 flex items-center justify-center text-app-accent">
                <Gift size={16} />
              </div>
              <span className="text-[13px] font-medium text-app-text">{item.name}</span>
            </div>
            {item.price_hkd && (
              <span className="text-[12px] font-mono font-bold text-app-text2">
                HK${item.price_hkd}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
