import React from 'react';
import { Zap } from 'lucide-react';

interface FlashEventBannerProps {
  event: { label: string; expires_at: string | null };
}

export function FlashEventBanner({ event }: FlashEventBannerProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-app-accent flex items-center justify-center text-app-bg">
          <Zap size={14} fill="currentColor" />
        </div>
        <span className="text-[13px] font-bold text-app-text">{event.label}</span>
      </div>
      {event.expires_at && (
        <span className="text-[10px] font-mono text-app-accent uppercase tracking-widest">
          限時優惠
        </span>
      )}
    </div>
  );
}
