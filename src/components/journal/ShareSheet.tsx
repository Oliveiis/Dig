import { X, MessageCircle, Instagram, Send, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareSheet({ isOpen, onClose }: ShareSheetProps) {
  const platforms = [
    { name: '小紅書', icon: '📕', color: 'bg-red-50' },
    { name: '微博', icon: '👁️', color: 'bg-orange-50' },
    { name: '朋友圈', icon: '🟢', color: 'bg-green-50' },
    { name: 'QQ空間', icon: '⭐', color: 'bg-blue-50' },
    { name: 'Instagram', icon: '📸', color: 'bg-purple-50' },
    { name: 'WhatsApp', icon: '💬', color: 'bg-emerald-50' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[6000]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 pb-12 z-[6100] shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-app-text font-display">分享日誌</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-app-surface flex items-center justify-center text-app-text2">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {platforms.map((p, idx) => (
                <button 
                  key={idx}
                  className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
                >
                  <div className={`w-16 h-16 rounded-2xl ${p.color} flex items-center justify-center text-3xl shadow-sm border border-black/5 group-hover:shadow-md transition-shadow`}>
                    {p.icon}
                  </div>
                  <span className="text-[11px] font-medium text-app-text2">{p.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
