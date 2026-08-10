import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { LocateFixed } from 'lucide-react';
import { useLocationStore } from '../../store/useLocationStore';
import { usePOIStore } from '../../store/usePOIStore';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import type { POI } from '../../types/poi';
import { filterExplorePOIs, hasVisitRisk, rankExploreWinners, walkMinutesFor } from '../../utils/poiRanking';

const GEOAPIFY_API_KEY = (import.meta.env.VITE_GEOAPIFY_API_KEY ?? '').trim();

const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const BASEMAP_STYLE: maplibregl.StyleSpecification = GEOAPIFY_API_KEY
  ? {
      version: 8,
      sources: {
        geoapify: {
          type: 'raster',
          tiles: [
            `https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(GEOAPIFY_API_KEY)}`,
          ],
          tileSize: 256,
          attribution: 'Powered by Geoapify | © OpenMapTiles © OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'geoapify-base', type: 'raster', source: 'geoapify' }],
    }
  : FALLBACK_STYLE;

const NEIGHBOURHOOD_ZOOM = 13.8;
const STREET_ZOOM = 15.4;
const DETAIL_ZOOM = 16.3;
const NEIGHBOURHOOD_LIMIT = 8;
const STREET_LIMIT = 10;

type POIMarkerEntry = {
  marker: Marker;
  element: HTMLButtonElement;
  label: HTMLSpanElement | null;
  rank: number;
  selected: boolean;
};

function shortText(text: string, limit: number) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function boxesOverlap(a: DOMRect, b: DOMRect, padding = 6) {
  return !(
    a.right + padding < b.left
    || a.left - padding > b.right
    || a.bottom + padding < b.top
    || a.top - padding > b.bottom
  );
}

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const poiMarkersRef = useRef<POIMarkerEntry[]>([]);
  const updateMarkerDisplayRef = useRef<() => void>(() => undefined);
  const lastLoadedCenter = useRef<{ lat: number; lng: number } | null>(null);
  const lastFittedWinners = useRef('');
  const [mapReady, setMapReady] = useState(false);

  const { coords, gpsCoords, gpsReady, isFallback, locationMode, locationRevision } = useLocationStore();
  const {
    allPOIs,
    activeFilter,
    activeIntent,
    selectedPOI,
    setSelectedPOI,
    setShowFullCard,
    refreshPOIs,
  } = usePOIStore();
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((entry) => entry.poi_id)), [bookmarks]);
  const filteredPOIs = useMemo(
    () => filterExplorePOIs(allPOIs, activeIntent, activeFilter, bookmarkedIds),
    [allPOIs, activeFilter, activeIntent, bookmarkedIds],
  );
  const rankedPOIs = useMemo(
    () => rankExploreWinners(filteredPOIs, coords, bookmarkedIds, STREET_LIMIT),
    [bookmarkedIds, coords, filteredPOIs],
  );
  const winnerPOIs = useMemo(() => rankedPOIs.slice(0, 5), [rankedPOIs]);

  const selectPOI = useCallback((poi: POI) => {
    setSelectedPOI(poi);
    setShowFullCard(true);
  }, [setSelectedPOI, setShowFullCard]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [coords.lng, coords.lat],
      zoom: 15.2,
      minZoom: 11,
      maxZoom: 19,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
      fadeDuration: 80,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: GEOAPIFY_API_KEY ? 'Geoapify' : undefined }), 'bottom-left');
    window.requestAnimationFrame(() => {
      containerRef.current?.querySelector<HTMLDetailsElement>('.maplibregl-ctrl-attrib')?.removeAttribute('open');
    });

    let readyTimer: number | undefined;
    const markReady = () => {
      if (!map.isStyleLoaded()) return;
      if (readyTimer) window.clearInterval(readyTimer);
      setMapReady(true);
    };
    map.on('style.load', markReady);
    map.on('load', markReady);
    readyTimer = window.setInterval(markReady, 80);
    markReady();

    map.on('zoom', () => updateMarkerDisplayRef.current());
    map.on('moveend', () => updateMarkerDisplayRef.current());
    map.on('click', () => {
      setSelectedPOI(null);
      setShowFullCard(false);
    });

    const onResize = () => map.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (readyTimer) window.clearInterval(readyTimer);
      poiMarkersRef.current.forEach(({ marker }) => marker.remove());
      userMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []); // The map instance lives for the mounted Wander screen.

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    poiMarkersRef.current.forEach(({ marker }) => marker.remove());
    poiMarkersRef.current = [];

    const addWinnerMarker = (poi: POI, index: number) => {
      const rank = index + 1;
      const selected = selectedPOI?.id === poi.id;
      const minutes = walkMinutesFor(poi);
      const reason = poi.decision?.headline || poi.hook_tag || '資料仍在整理';
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'dig-map-winner';
      element.classList.toggle('is-selected', selected);
      element.classList.toggle('is-secondary', rank > 3);
      element.classList.toggle('is-bookmarked', bookmarkedIds.has(poi.id));
      element.classList.toggle('has-risk', hasVisitRisk(poi));
      element.setAttribute('aria-label', `${poi.name}${minutes ? `，步行 ${minutes} 分鐘` : ''}，${reason}`);
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        selectPOI(poi);
      });

      const label = document.createElement('span');
      label.className = 'dig-map-winner-label';
      const title = document.createElement('strong');
      title.textContent = `${shortText(poi.name, 18)}${minutes ? ` · ${minutes} 分鐘` : ''}`;
      const detail = document.createElement('small');
      detail.textContent = shortText(reason, 17);
      label.append(title, detail);

      const pin = document.createElement('span');
      pin.className = 'dig-map-winner-pin';
      pin.textContent = rank <= 3 ? '✦' : '';
      if (hasVisitRisk(poi)) {
        const risk = document.createElement('span');
        risk.className = 'dig-map-risk-badge';
        risk.setAttribute('aria-hidden', 'true');
        pin.append(risk);
      }
      element.append(label, pin);

      const marker = new maplibregl.Marker({ element, anchor: 'bottom', offset: [0, -2] })
        .setLngLat([poi.coordinates.lng, poi.coordinates.lat])
        .addTo(map);
      poiMarkersRef.current.push({ marker, element, label, rank, selected });
    };

    rankedPOIs.forEach(addWinnerMarker);

    let collisionFrame: number | null = null;
    const updateMarkerDisplay = () => {
      const zoom = map.getZoom();
      for (const entry of poiMarkersRef.current) {
        const limit = zoom >= STREET_ZOOM ? STREET_LIMIT : NEIGHBOURHOOD_LIMIT;
        const eligible = zoom >= NEIGHBOURHOOD_ZOOM && (entry.selected || entry.rank <= limit);
        entry.element.style.display = eligible ? 'flex' : 'none';
        entry.element.classList.toggle('is-secondary', zoom < STREET_ZOOM && entry.rank > 3);
        entry.element.classList.toggle('is-detail', zoom >= DETAIL_ZOOM);
        if (entry.label) {
          const labelEligible = entry.selected
            || (zoom >= STREET_ZOOM && entry.rank <= 5)
            || (zoom >= DETAIL_ZOOM && entry.rank <= STREET_LIMIT);
          entry.label.style.display = labelEligible ? 'block' : 'none';
        }
      }

      if (collisionFrame) window.cancelAnimationFrame(collisionFrame);
      collisionFrame = window.requestAnimationFrame(() => {
        if (zoom < STREET_ZOOM) return;
        const placed: DOMRect[] = [];
        const winners = poiMarkersRef.current
          .filter((entry) => entry.element.style.display !== 'none' && entry.label?.style.display !== 'none')
          .sort((a, b) => Number(b.selected) - Number(a.selected) || a.rank - b.rank);
        for (const entry of winners) {
          const label = entry.label!;
          label.style.display = 'block';
          const rect = label.getBoundingClientRect();
          if (!entry.selected && placed.some((other) => boxesOverlap(rect, other))) {
            label.style.display = 'none';
          } else {
            placed.push(rect);
          }
        }
      });
    };
    updateMarkerDisplayRef.current = updateMarkerDisplay;
    updateMarkerDisplay();

    return () => {
      if (collisionFrame) window.cancelAnimationFrame(collisionFrame);
      updateMarkerDisplayRef.current = () => undefined;
      poiMarkersRef.current.forEach(({ marker }) => marker.remove());
      poiMarkersRef.current = [];
    };
  }, [bookmarkedIds, mapReady, rankedPOIs, selectPOI, selectedPOI?.id]);

  useEffect(() => {
    if (!gpsReady) return;
    const map = mapRef.current;
    if (!map) return;
    if (locationMode === 'district' || !lastLoadedCenter.current) {
      map.easeTo({ center: [coords.lng, coords.lat], zoom: locationMode === 'district' ? 15.2 : map.getZoom(), duration: 500 });
      refreshPOIs(coords.lat, coords.lng);
      lastLoadedCenter.current = { lat: coords.lat, lng: coords.lng };
    }
  }, [gpsReady, locationMode, locationRevision, coords.lat, coords.lng, refreshPOIs]);

  useEffect(() => {
    if (!mapRef.current || !gpsCoords) return;
    const element = document.createElement('div');
    element.className = 'dig-user-location';
    userMarkerRef.current?.remove();
    userMarkerRef.current = new maplibregl.Marker({ element })
      .setLngLat([gpsCoords.lng, gpsCoords.lat])
      .addTo(mapRef.current);
  }, [gpsCoords]);

  useEffect(() => {
    if (!mapReady || winnerPOIs.length === 0) return;
    const fitKey = `${activeIntent}:${activeFilter}:${locationRevision}:${winnerPOIs.slice(0, 3).map((poi) => poi.id).join(',')}`;
    if (lastFittedWinners.current === fitKey) return;
    lastFittedWinners.current = fitKey;
    const map = mapRef.current;
    if (!map) return;
    const bounds = new maplibregl.LngLatBounds([coords.lng, coords.lat], [coords.lng, coords.lat]);
    winnerPOIs.slice(0, 3).forEach((poi) => bounds.extend([poi.coordinates.lng, poi.coordinates.lat]));
    const camera = map.cameraForBounds(bounds, { padding: { top: 164, right: 38, bottom: 284, left: 38 }, maxZoom: 15.2 });
    if (!camera) return;
    map.easeTo({ center: camera.center, zoom: camera.zoom, duration: 420 });
  }, [activeFilter, activeIntent, coords, locationRevision, mapReady, winnerPOIs]);

  const locateMe = () => {
    const target = gpsCoords ?? coords;
    mapRef.current?.easeTo({ center: [target.lng, target.lat], zoom: 16, duration: 480 });
  };

  return (
    <div className="absolute inset-0 bg-[#EAF2F3]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ position: 'absolute', inset: 0 }}
        aria-label="港島店鋪探索地圖"
      />

      {!gpsReady && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-app-bg">
          <div className="h-48 w-[82%] animate-pulse rounded-2xl bg-white/70" />
          <span className="text-sm font-medium text-app-text2">正在準備港島地圖…</span>
        </div>
      )}

      {gpsReady && isFallback && (
        <div className="absolute left-1/2 top-[132px] z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-app-text2 shadow-[0_2px_8px_rgba(24,50,58,0.12)]">
          先從西營盤開始 · 可切換港島街區
        </div>
      )}

      <button
        type="button"
        onClick={locateMe}
        aria-label="回到我的位置"
        className="absolute right-4 top-[132px] z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-app-accent shadow-[0_2px_8px_rgba(24,50,58,0.14)] active:scale-95"
      >
        <LocateFixed size={18} />
      </button>
    </div>
  );
}
