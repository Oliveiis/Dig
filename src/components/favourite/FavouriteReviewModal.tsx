import React, { useState } from 'react';
import { X, Heart, Star, MessageSquare, Check } from 'lucide-react';
import { POI } from '../../types/poi';
import { useFavouriteStore } from '../../store/useFavouriteStore';
import { useToast } from '../common/Toast';

interface FavouriteReviewModalProps {
  poi: POI;
  isOpen: boolean;
  onClose: () => void;
}

export function FavouriteReviewModal({ poi, isOpen, onClose }: FavouriteReviewModalProps) {
  const { addFavourite } = useFavouriteStore();
  const { showToast } = useToast();
  
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [whatToOrder, setWhatToOrder] = useState('');
  const [priceFeel, setPriceFeel] = useState('reasonable');
  const [note, setNote] = useState('');

  const tags = ['氛圍感', '適合工作', '約會首選', '性價比高', '服務好', '裝修精緻', '安靜', '熱鬧'];

  const toggleTag = (tag: string) => {
    if (vibeTags.includes(tag)) {
      setVibeTags(vibeTags.filter(t => t !== tag));
    } else {
      setVibeTags([...vibeTags, tag]);
    }
  };

  const handleSubmit = () => {
    addFavourite({
      poi_id: poi.id,
      poi_name: poi.name,
      poi_category: poi.category,
      poi_subcategory: poi.subcategory,
      favourited_at: new Date().toISOString(),
      review: {
        vibe_tags: vibeTags,
        what_to_order: whatToOrder,
        price_feel: priceFeel,
        text_note: note || null,
      }
    });
    showToast('已加入收藏');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-app-surface border border-app-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-app-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-app-red" fill="currentColor" />
            <h2 className="text-lg font-bold text-app-text">收藏這家店</h2>
          </div>
          <button onClick={onClose} className="text-app-text3 hover:text-app-text">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Shop Info */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-app-bg border border-app-border">
            <div className="w-12 h-12 rounded-xl bg-app-accent/10 flex items-center justify-center text-app-accent">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="font-bold text-app-text">{poi.name}</h3>
              <p className="text-xs text-app-text3 uppercase tracking-wider">{poi.subcategory}</p>
            </div>
          </div>

          {/* Vibe Tags */}
          <section>
            <label className="text-[10px] font-mono text-app-text3 uppercase tracking-widest mb-3 block">
              氛圍標籤
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    vibeTags.includes(tag) 
                      ? 'bg-app-accent border-app-accent text-app-bg' 
                      : 'bg-app-surface border-app-border text-app-text2 hover:border-app-text3'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          {/* What to order */}
          <section>
            <label className="text-[10px] font-mono text-app-text3 uppercase tracking-widest mb-3 block">
              推薦點什麼？
            </label>
            <div className="relative">
              <MessageSquare size={16} className="absolute left-4 top-4 text-app-text3" />
              <input 
                type="text"
                value={whatToOrder}
                onChange={(e) => setWhatToOrder(e.target.value)}
                placeholder="必點的招牌菜或飲品..."
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-app-bg border border-app-border text-sm text-app-text focus:border-app-accent outline-none transition-colors"
              />
            </div>
          </section>

          {/* Price Feel */}
          <section>
            <label className="text-[10px] font-mono text-app-text3 uppercase tracking-widest mb-3 block">
              價格感受
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['worth_it', 'reasonable', 'expensive'].map(level => (
                <button
                  key={level}
                  onClick={() => setPriceFeel(level)}
                  className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                    priceFeel === level 
                      ? 'bg-app-accent border-app-accent text-app-bg' 
                      : 'bg-app-bg border-app-border text-app-text3'
                  }`}
                >
                  {level === 'worth_it' ? '物超所值' : level === 'reasonable' ? '價格合理' : '略貴'}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-app-border bg-app-bg/50">
          <button 
            onClick={handleSubmit}
            disabled={!whatToOrder}
            className="w-full h-14 bg-app-accent text-app-bg font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
          >
            <Check size={20} />
            <span>確認收藏</span>
          </button>
        </div>
      </div>
    </div>
  );
}
