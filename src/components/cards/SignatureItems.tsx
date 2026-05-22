import React from 'react';
import { Star } from 'lucide-react';

interface SignatureItemsProps {
  items: string[];
}

export function SignatureItems({ items }: SignatureItemsProps) {
  return (
    <section>
      <h4 className="text-[10px] font-mono text-app-text3 uppercase tracking-widest mb-3 flex items-center gap-2">
        ── 招牌必點 ─────────────────────
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <div key={item} className="px-3 py-1.5 rounded-lg bg-app-surface border border-app-border flex items-center gap-2">
            <Star size={12} className="text-app-accent" fill="currentColor" />
            <span className="text-[12px] font-medium text-app-text">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
