import { create } from 'zustand';

interface AlertStore {
  proximityAlert: { poi_name: string; distance_meters: number; poi_id: string } | null;
  setProximityAlert: (alert: { poi_name: string; distance_meters: number; poi_id: string } | null) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  proximityAlert: null,
  setProximityAlert: (proximityAlert) => set({ proximityAlert }),
}));
