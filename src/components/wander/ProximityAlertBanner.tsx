import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, X } from 'lucide-react';
import { useAlertStore } from '../../store/useAlertStore';
import { usePOIStore } from '../../store/usePOIStore';

export const ProximityAlertBanner: React.FC = () => {
  const { proximityAlert, setProximityAlert } = useAlertStore();
  const { allPOIs, setSelectedPOI } = usePOIStore();

  const handleView = () => {
    if (!proximityAlert) return;
    const poi = allPOIs.find(p => p.id === proximityAlert.poi_id);
    if (poi) setSelectedPOI(poi);
    setProximityAlert(null);
  };

  useEffect(() => {
    if (!proximityAlert) return;
    const tid = window.setTimeout(() => setProximityAlert(null), 3000);
    return () => window.clearTimeout(tid);
  }, [proximityAlert, setProximityAlert]);

  return (
    <AnimatePresence>
      {proximityAlert && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-6 left-6 right-6 z-[1100] bg-white text-app-text p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-app-border"
        >
          <div className="w-10 h-10 bg-app-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin size={20} />
          </div>
          <div className="flex-1 min-w-0" onClick={handleView}>
            <p className="font-sans font-bold text-[13px] leading-tight truncate">
              附近有你收藏的地點！
            </p>
            <p className="font-mono text-[11px] opacity-70">
              {proximityAlert.poi_name} · 距離 {proximityAlert.distance_meters}m
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
