import React from 'react';
import { usePOIStore } from '../../store/usePOIStore';
import { ALLOWED_CATEGORIES, CATEGORY_COLOR } from '../../utils/categoryConfig';

export const CategoryFilterChips: React.FC = () => {
  const { activeFilter, setFilter } = usePOIStore();

  const categories = [
    { id: 'all', label: '全部', color: '#1a1a1a' },
    ...ALLOWED_CATEGORIES.map(cat => ({
      id: cat,
      label: cat === 'cafe' ? '咖啡' : cat === 'restaurant' ? '餐廳' : '酒吧',
      color: CATEGORY_COLOR[cat]
    }))
  ] as const;

  return (
    <div className="fixed top-20 left-0 right-0 z-[1000] px-6 overflow-x-auto no-scrollbar flex gap-2 py-2">
      {categories.map((cat) => {
        const isActive = activeFilter === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full border transition-all font-mono text-[11px] font-medium
              ${isActive ? 'bg-text text-white border-text shadow-md' : 'bg-white/90 backdrop-blur-md text-text2 border-border2'}
            `}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};
