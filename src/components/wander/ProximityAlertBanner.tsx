import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, X } from 'lucide-react';
import { useAlertStore } from '../../store/useAlertStore';
import { usePOIStore } from '../../store/usePOIStore';

export const ProximityAlertBanner: React.FC = () => {
  const { proximityAlert, setProximityAlert } = useAlertStore();
  const { allPOIs, setSelectedPOI, setShowFullCard } = usePOIStore();

  const handleView = () => {
    if (!proximityAlert) return;
    const poi = allPOIs.find(p => p.id === proximityAlert.poi_id);
    if (poi) {
      setSelectedPOI(poi);
      setShowFullCard(true);
    }
    setProximityAlert(null);
  };

  useEffect(() => {
    if (!proximityAlert) return;
    const tid = window.setTimeout(() => setProximityAlert(null), 6500);
    return () => window.clearTimeout(tid);
  }, [proximityAlert, setProximityAlert]);

  return (
    <AnimatePresence>
      {proximityAlert && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed left-4 right-4 top-5 z-[100] mx-auto flex max-w-[398px] items-center gap-3 rounded-xl bg-white p-3.5 text-app-text shadow-[0_4px_16px_rgba(24,50,58,0.18)]"
        >
          <div className="w-10 h-10 bg-app-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin size={20} />
          </div>
          <div className="flex-1 min-w-0" onClick={handleView}>
            <p className="truncate text-[13px] font-bold leading-tight">
              {proximityAlert.poi_name} 就在附近
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-app-text2">
              {proximityAlert.message || `距離約 ${proximityAlert.distance_meters} 公尺，現在可以順路去。`}
            </p>
          </div>
          <button 
            onClick={() => setProximityAlert(null)}
            className="p-2 hover:bg-app-surface/80 rounded-full transition-colors"
            aria-label="关闭附近提醒"
          >
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
