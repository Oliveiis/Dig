import { create } from 'zustand';
import { District, findNearestDistrict } from '../constants/districts';

const FALLBACK = { lat: 22.2861, lng: 114.1429 };

interface LocationStore {
  coords: { lat: number; lng: number };
  gpsReady: boolean;
  isFallback: boolean;
  currentDistrict: District;
  setCoords: (c: { lat: number; lng: number }) => void;
  setDistrict: (d: District) => void;
  setGpsFallback: () => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  coords: FALLBACK,
  gpsReady: false,
  isFallback: false,
  currentDistrict: findNearestDistrict(FALLBACK.lat, FALLBACK.lng),
  setCoords: (coords) => set({
    coords,
    gpsReady: true,
    isFallback: false,
    currentDistrict: findNearestDistrict(coords.lat, coords.lng),
  }),
  setDistrict: (district) => set({
    coords: { lat: district.lat, lng: district.lng },
    currentDistrict: district,
  }),
  setGpsFallback: () => set({ gpsReady: true, isFallback: true }),
}));
