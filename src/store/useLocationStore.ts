import { create } from 'zustand';
import { District, findNearestDistrict } from '../constants/districts';

const FALLBACK = { lat: 22.2861, lng: 114.1429 };

export type LocationMode = 'gps' | 'district' | 'fallback';

interface LocationStore {
  coords: { lat: number; lng: number };
  gpsCoords: { lat: number; lng: number } | null;
  gpsReady: boolean;
  isFallback: boolean;
  locationMode: LocationMode;
  locationRevision: number;
  currentDistrict: District;
  setCoords: (c: { lat: number; lng: number }) => void;
  setDistrict: (d: District) => void;
  setGpsFallback: () => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  coords: FALLBACK,
  gpsCoords: null,
  gpsReady: false,
  isFallback: false,
  locationMode: 'fallback',
  locationRevision: 0,
  currentDistrict: findNearestDistrict(FALLBACK.lat, FALLBACK.lng),
  setCoords: (gpsCoords) => set((state) => {
    // Keep a manual district selection stable when watchPosition reports again.
    if (state.locationMode === 'district') {
      return { gpsCoords, gpsReady: true };
    }
    return {
      coords: gpsCoords,
      gpsCoords,
      gpsReady: true,
      isFallback: false,
      locationMode: 'gps',
      currentDistrict: findNearestDistrict(gpsCoords.lat, gpsCoords.lng),
    };
  }),
  setDistrict: (district) => set((state) => ({
    coords: { lat: district.lat, lng: district.lng },
    currentDistrict: district,
    gpsReady: true,
    isFallback: false,
    locationMode: 'district',
    locationRevision: state.locationRevision + 1,
  })),
  setGpsFallback: () => set((state) => state.locationMode === 'district'
    ? { gpsReady: true }
    : { gpsReady: true, isFallback: true, locationMode: 'fallback' }),
}));
