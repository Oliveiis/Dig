import { Map as PigeonMap, Marker, Overlay } from 'pigeon-maps';
import { useLocationStore } from '../../store/useLocationStore';
import { usePOIStore } from '../../store/usePOIStore';
import { POI } from '../../types/poi';
import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useViewportPOIs } from '../../hooks/useViewportPOIs';
import { getMarkerTier, MarkerTier } from '../../hooks/useMarkerTier';
import { PillMarker } from './PillMarker';
import { DotMarker } from './DotMarker';
import { MinimalDot } from './MinimalDot';
import { getSubcategoryIcon } from '../../utils/categoryConfig';
import { haversineMeters } from '../../utils/distance';

const CARTODB_POSITRON = (x: number, y: number, z: number) =>
  `https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}.png`;

const VIEWPORT_REFETCH_THRESHOLD_METERS = 600;
const PILL_PX = { w: 120, h: 36 };
const DOT_PX = { w: 28, h: 28 };
const MINIMAL_PX = { w: 10, h: 10 };
const PILL_SPACING = 8;

function latLngToPixel(lat: number, lng: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function estimatePillWidth(poi: POI) {
  const label = poi.hook_tag && poi.hook_tag !== poi.subcategory.toUpperCase()
    ? poi.hook_tag
    : poi.subcategory || poi.name;
  const length = label.length;
  const width = 58 + length * 8;
  return Math.min(220, Math.max(PILL_PX.w, width));
}

function tierSize(tier: MarkerTier, poi?: POI) {
  if (tier === 'icon_tag' || tier === 'icon_name') {
    return poi ? { w: estimatePillWidth(poi), h: PILL_PX.h } : PILL_PX;
  }
  if (tier === 'icon_only') return DOT_PX;
  return MINIMAL_PX;
}

function isPillTier(t: MarkerTier) {
  return t === 'icon_tag' || t === 'icon_name';
}

// zoom 越高视野越小，可容纳的 pill 越多。zoom < 16 时 getMarkerTier 不会给 pill。
function pillBudget(zoom: number): number {
  if (zoom >= 18) return Infinity;
  if (zoom >= 17) return 12;
  return 8;
}

// 两层降级：
// 1. 按"选中 > 距视野中心近"排序，超出 zoom 预算的 pill 直接降级为 dot
// 2. 剩下的 pill 再做像素重叠检测，重叠的降级为 dot
// 选中的 POI 始终保留为 pill 且不计入预算。
function computeEffectiveTiers(
  pois: POI[],
  viewportCenter: { lat: number; lng: number },
  zoom: number,
  selectedId: string | null,
): Map<string, MarkerTier> {
  const tiers = new Map<string, MarkerTier>();
  for (const p of pois) tiers.set(p.id, getMarkerTier(p, viewportCenter, zoom));
  if (selectedId) tiers.set(selectedId, 'icon_tag');

  const pillCandidates = pois.filter(p => isPillTier(tiers.get(p.id)!));
  const prioritized = [...pillCandidates].sort((a, b) => {
    if (a.id === selectedId) return -1;
    if (b.id === selectedId) return 1;
    return haversineMeters(a.coordinates, viewportCenter)
      - haversineMeters(b.coordinates, viewportCenter);
  });

  const budget = pillBudget(zoom);
  const placed: Array<{ left: number; right: number; top: number; bottom: number }> = [];
  let kept = 0;
  for (const p of prioritized) {
    const isSelected = p.id === selectedId;
    if (!isSelected && kept >= budget) {
      tiers.set(p.id, 'icon_only');
      continue;
    }
    const px = latLngToPixel(p.coordinates.lat, p.coordinates.lng, zoom);
    const pillWidth = estimatePillWidth(p);
    const rect = {
      left: px.x - pillWidth / 2 - PILL_SPACING,
      right: px.x + pillWidth / 2 + PILL_SPACING,
      top: px.y - PILL_PX.h / 2 - PILL_SPACING,
      bottom: px.y + PILL_PX.h / 2 + PILL_SPACING,
    };
    const collide = placed.some(r =>
      !(rect.right < r.left || rect.left > r.right || rect.bottom < r.top || rect.top > r.bottom),
    );
    if (collide) {
      tiers.set(p.id, 'icon_only');
    } else {
      placed.push(rect);
      if (!isSelected) kept++;
    }
  }
  return tiers;
}

// Cluster 只聚合非 pill 项；pill 一律穿透为 singleton，避免赢家被附近的 dot 吃掉。
function clusterPOIs(
  pois: POI[],
  zoom: number,
  tiers: Map<string, MarkerTier>,
) {
  const clusters: Array<{ lat: number; lng: number; pois: POI[] } | POI> = [];

  type Rect = { poi: POI; left: number; right: number; top: number; bottom: number };
  const rects: Rect[] = [];
  for (const p of pois) {
    const tier = tiers.get(p.id) ?? 'icon_only';
    if (isPillTier(tier)) {
      clusters.push(p);
      continue;
    }
    const { w, h } = tierSize(tier, p);
    const px = latLngToPixel(p.coordinates.lat, p.coordinates.lng, zoom);
    rects.push({
      poi: p,
      left: px.x - w / 2,
      right: px.x + w / 2,
      top: px.y - h / 2,
      bottom: px.y + h / 2,
    });
  }

  const used = new Set<number>();
  for (let i = 0; i < rects.length; i++) {
    if (used.has(i)) continue;
    const base = rects[i];
    const group: POI[] = [base.poi];
    used.add(i);
    for (let j = i + 1; j < rects.length; j++) {
      if (used.has(j)) continue;
      const r = rects[j];
      const overlap = !(base.right < r.left || base.left > r.right || base.bottom < r.top || base.top > r.bottom);
      if (overlap) {
        group.push(r.poi);
        used.add(j);
        base.left = Math.min(base.left, r.left);
        base.right = Math.max(base.right, r.right);
        base.top = Math.min(base.top, r.top);
        base.bottom = Math.max(base.bottom, r.bottom);
      }
    }

    if (group.length === 1) clusters.push(base.poi);
    else {
      const avgLat = group.reduce((s, p) => s + p.coordinates.lat, 0) / group.length;
      const avgLng = group.reduce((s, p) => s + p.coordinates.lng, 0) / group.length;
      clusters.push({ lat: avgLat, lng: avgLng, pois: group });
    }
  }

  return clusters;
}

export function MapContainer() {
  const { coords, gpsReady, isFallback } = useLocationStore();
  const { allPOIs, setSelectedPOI, setShowFullCard, refreshPOIs, isFetching, selectedPOI } = usePOIStore();
  const [mapCenter, setMapCenter] = useState<[number, number]>([coords.lat, coords.lng]);
  const [zoom, setZoom] = useState(16);
  const lastFetchCenter = useRef<{ lat: number; lng: number } | null>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  const { visiblePOIs, viewportCenter, onBoundsChange } = useViewportPOIs(allPOIs);

  // GPS first lock: snap map to user location and fetch POIs once.
  // Subsequent watchPosition updates only move the user dot — they must NOT
  // recenter the map or re-fetch, otherwise dragging is overridden every few seconds.
  useEffect(() => {
    if (!gpsReady || initializedRef.current) return;
    initializedRef.current = true;
    setMapCenter([coords.lat, coords.lng]);
    refreshPOIs(coords.lat, coords.lng);
    lastFetchCenter.current = { lat: coords.lat, lng: coords.lng };
  }, [gpsReady, coords.lat, coords.lng, refreshPOIs]);

  const triggerViewportRefetch = useCallback((lat: number, lng: number) => {
    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(() => {
      const last = lastFetchCenter.current;
      if (!last || haversineMeters(last, { lat, lng }) >= VIEWPORT_REFETCH_THRESHOLD_METERS) {
        lastFetchCenter.current = { lat, lng };
        refreshPOIs(lat, lng);
      }
    }, 500);
  }, [refreshPOIs]);

  const recenterToGPS = useCallback(() => {
    setMapCenter([coords.lat, coords.lng]);
    triggerViewportRefetch(coords.lat, coords.lng);
  }, [coords.lat, coords.lng, triggerViewportRefetch]);

  const handlePoiClick = useCallback((poi: POI) => {
    console.log('[MapContainer] poi clicked:', poi.name);
    setSelectedPOI(poi);
    setShowFullCard(true);
    usePOIStore.getState().digForPOI(poi);
  }, [setSelectedPOI, setShowFullCard]);

  // 只渲染已有真正中文总结 hook 的 POI；未 enrich 的（hook 为空或等于 subcategory 大写 fallback）静默隐藏，
  // 等后台 pre-heat 写回后自动出现。选中的 POI 强制保留并置顶。
  const hasRealHook = (p: POI) => {
    const tag = p.hook_tag ?? '';
    return !!tag && tag !== (p.subcategory ?? '').toUpperCase();
  };
  const enrichedVisible = visiblePOIs.filter(hasRealHook);
  const poisToShow = selectedPOI
    ? [selectedPOI, ...enrichedVisible.filter(p => p.id !== selectedPOI.id)]
    : enrichedVisible;
  const MAX_ZOOM = 18;
  const effectiveTiers = computeEffectiveTiers(poisToShow, viewportCenter, zoom, selectedPOI?.id ?? null);
  const clustered = zoom >= MAX_ZOOM ? poisToShow : clusterPOIs(poisToShow, zoom, effectiveTiers);

  return (
    <div className="w-full h-full relative bg-[#f5f5f5]">
      {!gpsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-app-bg/80 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full border-2 border-app-accent border-t-transparent animate-spin" />
          <p className="font-mono text-[11px] text-app-text2 uppercase tracking-widest">正在獲取位置...</p>
        </div>
      )}
      {gpsReady && isFallback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full bg-app-text/90 text-white text-[11px] font-mono shadow-lg">
          使用預設位置（西營盤）· 請開啟定位權限
        </div>
      )}
      <PigeonMap
        height={undefined}
        center={mapCenter}
        zoom={zoom}
        onClick={() => { setSelectedPOI(null); setShowFullCard(false); }}
        onBoundsChanged={(params) => {
          setMapCenter(params.center);
          setZoom(params.zoom);
          onBoundsChange(params);
          triggerViewportRefetch(params.center[0], params.center[1]);
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

        {/* POI Markers (clustered) */}
        {clustered.map((item, idx) => {
          if ('pois' in item) {
            // cluster marker
            const categoryCounts = item.pois.reduce((acc, poi) => {
              acc[poi.subcategory] = (acc[poi.subcategory] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? item.pois[0].subcategory;
            const Icon = getSubcategoryIcon(topCategory);
            const handleClusterClick = () => {
              // zoom in and center on cluster
              setMapCenter([item.lat, item.lng]);
              setZoom((z) => Math.min(MAX_ZOOM, z + 2));
              triggerViewportRefetch(item.lat, item.lng);
            };

            return (
              <Overlay key={`cluster-${idx}`} // @ts-ignore
                anchor={[item.lat, item.lng]}
              >
                <div
                  onClick={handleClusterClick}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-app-accent text-white shadow-lg cursor-pointer"
                  title={`${item.pois.length} 個地點`}
                >
                  <Icon size={18} strokeWidth={2.5} />
                </div>
              </Overlay>
            );
          }

          const poi = item as POI;
          const tier = effectiveTiers.get(poi.id) ?? getMarkerTier(poi, viewportCenter, zoom);
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
      </PigeonMap>

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
