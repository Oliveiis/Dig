import { useEffect } from 'react';
import { useLocationStore } from '../store/useLocationStore';

export function useGeolocation() {
  const { setCoords, setGpsReady } = useLocationStore();

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsReady(); // 不支持定位，直接用 fallback
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsReady(), // 拒绝或失败，fallback 到西营盘
      { enableHighAccuracy: true, timeout: 10000 }
    );

    const id = navigator.geolocation.watchPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);
}
