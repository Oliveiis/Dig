import { motion, AnimatePresence } from 'motion/react';
import { District, HONG_KONG_DISTRICTS } from '../../constants/districts';
import { X, MapPin } from 'lucide-react';

interface DistrictSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (district: District) => void;
  currentDistrictId: string;
}

export function DistrictSelector({ isOpen, onClose, onSelect, currentDistrictId }: DistrictSelectorProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[2100] max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-app-border flex items-center justify-between">
              <h3 className="text-xl font-bold font-display text-app-text">選擇探索區域</h3>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-app-bg flex items-center justify-center text-app-text2"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
              {HONG_KONG_DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelect(d);
                    onClose();
                  }}
                  className={`flex flex-col items-start gap-1 p-4 rounded-2xl border transition-all ${
                    currentDistrictId === d.id 
                      ? 'bg-app-accent text-white border-app-accent' 
                      : 'bg-app-surface border-app-border text-app-text hover:border-app-accent/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className={currentDistrictId === d.id ? 'text-white/70' : 'text-app-text3'} />
                    <span className="text-sm font-bold">{d.name}</span>
                  </div>
                  <span className={`text-[9px] font-mono uppercase tracking-wider ${currentDistrictId === d.id ? 'text-white/60' : 'text-app-text3'}`}>
                    HONG KONG
                  </span>
                </button>
              ))}
            </div>
            
            <div className="p-6 bg-app-bg/50">
              <p className="text-[10px] font-mono text-app-text3 text-center uppercase tracking-widest">
                更多城市區域即將解鎖
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
