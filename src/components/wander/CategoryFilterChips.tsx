import React from 'react';
import { Clock3, Coffee, Sparkles, ShoppingBag } from 'lucide-react';
import { ExploreIntent, usePOIStore } from '../../store/usePOIStore';

const intents: Array<{ id: ExploreIntent; label: string; icon: React.ElementType }> = [
  { id: 'for_you', label: '為你挑', icon: Sparkles },
  { id: 'nearby', label: '15 分鐘內', icon: Clock3 },
  { id: 'sweet', label: '想吃甜的', icon: Coffee },
  { id: 'takeaway', label: '能帶走', icon: ShoppingBag },
];

export const CategoryFilterChips: React.FC = () => {
  const { activeIntent, setIntent } = usePOIStore();

  return (
    <div className="absolute left-0 right-0 top-20 z-40 flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
      {intents.map(({ id, label, icon: Icon }) => {
        const active = activeIntent === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setIntent(id)}
            aria-pressed={active}
            className={`flex min-h-10 flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold shadow-[0_2px_7px_rgba(24,50,58,0.1)] transition-[transform,background-color,color] active:scale-95 ${
              active ? 'bg-app-accent text-white' : 'bg-white text-app-text2'
            }`}
          >
            <Icon size={14} strokeWidth={2.2} />
            {label}
          </button>
        );
      })}
    </div>
  );
};
