import { motion, AnimatePresence } from 'motion/react';
import { POI, CheckinReaction } from '../../types/poi';
import { useJournalStore } from '../../store/useJournalStore';
import { X, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface QuickCheckinModalProps {
  poi: POI;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCheckinModal({ poi, isOpen, onClose }: QuickCheckinModalProps) {
  const { addCheckin } = useJournalStore();
  const [selectedReaction, setSelectedReaction] = useState<CheckinReaction | null>(null);

  const reactions: { id: CheckinReaction; label: string; icon: string }[] = [
    { id: 'comeback', label: '名不虛傳', icon: '✅' },
    { id: 'as_expected', label: '值得再來', icon: '😍' },
    { id: 'nothing_special', label: '一般般', icon: '😐' },
    { id: 'regret', label: '踩雷了', icon: '💣' },
  ];

  const handleSave = () => {
    if (!selectedReaction) return;
    addCheckin({
      poi_id: poi.id,
      poi_name: poi.name,
      poi_category: poi.category,
      poi_subcategory: poi.subcategory,
      poi_district: poi.district,
      visited_at: new Date().toISOString(),
      reaction: selectedReaction,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[3000]"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[360px] bg-white rounded-[32px] p-8 z-[3100] shadow-2xl"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-app-accent/10 flex items-center justify-center text-app-accent">
                <CheckCircle size={32} />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold font-display text-app-text">打個點</h3>
                <p className="text-sm text-app-text2 mt-1">{poi.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                {reactions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReaction(r.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                      selectedReaction === r.id 
                        ? 'bg-app-accent/10 border-app-accent text-app-accent scale-105' 
                        : 'bg-app-surface border-app-border text-app-text2'
                    }`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider">{r.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 w-full mt-2">
                <button
                  onClick={handleSave}
                  disabled={!selectedReaction}
                  className="w-full h-14 bg-[#1a1a1a] text-white font-bold rounded-2xl disabled:opacity-30 active:scale-95 transition-transform"
                >
                  儲存記錄
                </button>
                <button
                  onClick={onClose}
                  className="w-full h-10 text-app-text3 font-bold text-sm"
                >
                  取消
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
