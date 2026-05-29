import React, { useState } from 'react';
import { Search, ChevronRight, X } from 'lucide-react';
import { usePOIStore } from '../store/usePOIStore';
import { useLocationStore } from '../store/useLocationStore';
import { haversineMeters, formatDistance } from '../utils/distance';
import { CATEGORY_COLOR, getSubcategoryIcon } from '../utils/categoryConfig';
import { FactCard } from '../components/cards/FactCard';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { POICategory } from '../types/poi';

export const SearchScreen: React.FC = () => {
  const { allPOIs } = usePOIStore();
  const { coords } = useLocationStore();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | POICategory>('all');
  const [selectedPOI, setSelectedPOI] = useState<any>(null);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const handleSheetDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) setSelectedPOI(null);
  };

  const categories: { id: 'all' | POICategory; label: string }[] = [
    { id: 'all', label: '全部' },
    { id: 'cafe', label: '咖啡' },
    { id: 'restaurant', label: '餐廳' },
    { id: 'bar', label: '酒吧' },
  ];

  const filteredPOIs = allPOIs
    .map(poi => ({
      ...poi,
      distance: haversineMeters(coords, poi.coordinates)
    }))
    .filter(poi => {
      const matchesQuery = poi.name.toLowerCase().includes(query.toLowerCase()) ||
                          poi.subcategory.includes(query) ||
                          poi.district.includes(query);
      const matchesCategory = activeCategory === 'all' || poi.category === activeCategory;
      return matchesQuery && matchesCategory;
    })
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="w-full h-full bg-app-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex flex-col gap-6 bg-app-surface border-b border-app-border">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold font-display text-app-text tracking-tight">搜索</h1>
          <p className="text-[10px] font-mono text-app-text3 uppercase tracking-[0.2em]">Find your next destination</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text3 group-focus-within:text-app-accent transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="搜店名、品類、地點..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-14 bg-surface2 border-none rounded-2xl pl-12 pr-12 font-sans text-[15px] focus:outline-none focus:ring-2 focus:ring-app-accent/5 transition-all"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-app-text3/20 flex items-center justify-center text-app-text2 active:scale-90 transition-transform"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2.5 rounded-full font-sans text-[14px] font-bold transition-all whitespace-nowrap border ${
                  activeCategory === cat.id 
                    ? 'bg-app-accent text-white border-app-accent' 
                    : 'bg-white text-app-text border-app-border hover:border-app-text2'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 no-scrollbar bg-app-bg">
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPOIs.map((poi, index) => {
              const Icon = getSubcategoryIcon(poi.subcategory);
              const color = CATEGORY_COLOR[poi.category];
              
              return (
                <motion.div
                  key={poi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    setSelectedPOI(poi);
                    usePOIStore.getState().digForPOI(poi);
                  }}
                  className="bg-app-surface rounded-2xl p-4 border border-app-border flex items-center gap-4 active:scale-[0.98] transition-all ios-shadow cursor-pointer"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" 
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    <Icon size={22} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans font-bold text-[15px] text-app-text truncate">{poi.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="claude-tag !px-1.5 !py-0.5 !text-[8px]">{poi.subcategory}</span>
                      <span className="font-mono text-[10px] text-app-text3 uppercase tracking-wider">{poi.district}</span>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-mono text-[11px] font-bold text-app-text2">{formatDistance(poi.distance)}</span>
                    <ChevronRight size={16} className="text-app-text3" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredPOIs.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 text-app-text3/30 mb-6">
                <Search size={64} strokeWidth={1} />
              </div>
              <h3 className="text-xl font-bold text-app-text mb-2">找不到結果</h3>
              <p className="font-sans text-[13px] text-app-text3">試試其他關鍵詞或切換分類</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <AnimatePresence>
        {!!selectedPOI && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPOI(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
              style={{ zIndex: 9998 }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsSheetDragging(true)}
              onDragEnd={handleSheetDragEnd}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: '85vh', zIndex: 9999 }}
            >
              <div className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-border2 rounded-full" />
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-12">
                <div className="px-6 pb-10">
                  {selectedPOI && <FactCard poi={selectedPOI} onClose={() => setSelectedPOI(null)} />}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
