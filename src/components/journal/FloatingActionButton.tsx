import { useState } from 'react';
import { Plus, PenLine, Share2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingActionButtonProps {
  onEdit: () => void;
  onShare: () => void;
}

export function FloatingActionButton({ onEdit, onShare }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  const actions = [
    { icon: Share2, label: '分享日誌', onClick: () => { onShare(); setIsOpen(false); }, color: 'bg-app-surface border-app-border text-app-text' },
    { icon: PenLine, label: '編輯日誌', onClick: () => { onEdit(); setIsOpen(false); }, color: 'bg-app-accent text-app-bg' },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-[2000] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-end gap-3 mb-2"
          >
            {actions.map((action, idx) => (
              <motion.button
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={action.onClick}
                className="flex items-center gap-3 group"
              >
                <span className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-app-border text-[12px] font-bold text-app-text shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg active:scale-90 transition-transform ${action.color}`}>
                  <action.icon size={20} />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={toggle}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 ${
          isOpen ? 'bg-app-surface2 text-app-text rotate-45' : 'bg-[#1a1a1a] text-white'
        }`}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
