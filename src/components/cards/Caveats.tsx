import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CaveatsProps {
  caveats: string[];
}

export function Caveats({ caveats }: CaveatsProps) {
  return (
    <section>
      <h4 className="text-[10px] font-mono text-app-text3 uppercase tracking-widest mb-3 flex items-center gap-2">
        ── 注意事項 ─────────────────────
      </h4>
      <div className="flex flex-col gap-2">
        {caveats.map(caveat => (
          <div key={caveat} className="flex items-start gap-3 p-3 rounded-xl bg-app-red/5 border border-app-red/10">
            <AlertCircle size={16} className="text-app-red mt-0.5 flex-shrink-0" />
            <span className="text-[12px] text-app-red/80 leading-relaxed">{caveat}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
