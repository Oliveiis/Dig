import { Map, Marker, Overlay } from 'pigeon-maps';
import { useLocationStore } from '../../store/useLocationStore';
import { usePOIStore } from '../../store/usePOIStore';
import { POI } from '../../types/poi';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useViewportPOIs } from '../../hooks/useViewportPOIs';
import { getMarkerTier } from '../../hooks/useMarkerTier';
import { PillMarker } from './PillMarker';
import { DotMarker } from './DotMarker';
import { MinimalDot } from './MinimalDot';

const CARTODB_POSITRON = (x: number, y: number, z: number) =>
  `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}.png`;

// zoom 级别对应的经纬度最小间距（度），防止 pill 标签重叠
function minDegreeGap(zoom: number): number {
  // zoom 16 ≈ 每像素 ~1.2m，pill 宽约 80px ≈ 100m ≈ 0.0009°
  return 0.0009 * Math.pow(2, 16 - zoom);
}

function dedupeOverlapping(pois: POI[], zoom: number): POI[] {
  const gap = minDegreeGap(zoom);
  const placed: { lat: number; lng: number }[] = [];
  const result: POI[] = [];
  for (const poi of pois) {
    const { lat, lng } = poi.coordinates;
    const overlaps = placed.some(
      p => Math.abs(p.lat - lat) < gap && Math.abs(p.lng - lng) < gap
    );
    if (!overlaps) {
      placed.push({ lat, lng });
      result.push(poi);
    }
  }
  return result;
}

export function MapContainer() {
  const { coords, gpsReady } = useLocationStore();
  const { allPOIs, setSelectedPOI, setShowFullCard, refreshPOIs, isFetching, selectedPOI } = usePOIStore();
  const [mapCenter, setMapCenter] = useState<[number, number]>([coords.lat, coords.lng]);
  const [zoom, setZoom] = useState(16);

  const { visiblePOIs, viewportCenter, onBoundsChange } = useViewportPOIs(allPOIs);

  useEffect(() => {
    setMapCenter([coords.lat, coords.lng]);
  }, [coords.lat, coords.lng]);

  useEffect(() => {
    if (gpsReady) refreshPOIs(coords.lat, coords.lng);
  }, [gpsReady, coords.lat, coords.lng]);

  const handlePoiClick = useCallback((poi: POI) => {
    console.log('[MapContainer] poi clicked:', poi.name);
    setSelectedPOI(poi);
    setShowFullCard(true);
    usePOIStore.getState().digForPOI(poi);
  }, [setSelectedPOI, setShowFullCard]);

  // 选中的 POI 始终排最前（保证不被去重掉）
  const poisToShow = selectedPOI
    ? [selectedPOI, ...visiblePOIs.filter(p => p.id !== selectedPOI.id)]
    : visiblePOIs;
  const dedupedPOIs = dedupeOverlapping(poisToShow, zoom);

  return (
    <div className="w-full h-full relative bg-[#f5f5f5]">
      {!gpsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-app-bg/80 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full border-2 border-app-accent border-t-transparent animate-spin" />
          <p className="font-mono text-[11px] text-app-text2 uppercase tracking-widest">正在獲取位置...</p>
        </div>
      )}      <Map
        height={undefined}
        center={mapCenter}
        zoom={zoom}
        onClick={() => { setSelectedPOI(null); setShowFullCard(false); }}
        onBoundsChanged={(params) => {
          setMapCenter(params.center);
          setZoom(params.zoom);
          onBoundsChange(params);
        }}
        provider={CARTODB_POSITRON}
      >
        {/* User location dot */}
        <Marker anchor={[coords.lat, coords.lng]}>
          <div className="relative flex items-center justify-center w-6 h-6">
            <div className="absolute w-full h-full bg-app-accent rounded-full opacity-20 animate-ping" />
            <div className="relative w-3 h-3 bg-app-accent border-2 border-white rounded-full shadow-lg" />
          </div>
        </Marker>

        {/* POI Markers */}
        {dedupedPOIs.map(poi => {
          const tier = getMarkerTier(poi, viewportCenter, zoom);
          const isSelected = selectedPOI?.id === poi.id;

          return (
            <Overlay
              // @ts-ignore
              key={poi.id}
              anchor={[poi.coordinates.lat, poi.coordinates.lng]}
            >
              {tier === 'icon_tag' || tier === 'icon_name' || isSelected ? (
                <PillMarker poi={poi} isSelected={isSelected} onClick={() => handlePoiClick(poi)} />
              ) : tier === 'icon_only' ? (
                <DotMarker poi={poi} onClick={() => handlePoiClick(poi)} />
              ) : (
                <MinimalDot poi={poi} onClick={() => handlePoiClick(poi)} />
              )}
            </Overlay>
          );
        })}
      </Map>

      {/* Refresh Button */}
      <div className="absolute top-24 right-4 z-40">
        <button
          onClick={() => refreshPOIs(mapCenter[0], mapCenter[1])}
          disabled={isFetching}
          className="w-10 h-10 rounded-full bg-white border border-app-border shadow-lg flex items-center justify-center text-app-accent active:scale-90 transition-all disabled:opacity-50"
        >
          {isFetching ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
        </button>
      </div>

      <style>{`.pigeon-attribution { display: none; }`}</style>
    </div>
  );
}
