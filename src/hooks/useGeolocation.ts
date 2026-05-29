import { useEffect } from 'react';
import { useLocationStore } from '../store/useLocationStore';

export function useGeolocation() {
  const { setCoords, setGpsFallback } = useLocationStore();

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGpsFallback(),
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
