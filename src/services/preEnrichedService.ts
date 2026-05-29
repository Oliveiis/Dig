/**
 * 预充实 POI 数据服务
 * 
 * 加载由 Food Crawler + AI 总结管道离线生成的已充实 POI 数据。
 * 优先级高于 OSM + 实时 API 挖掘。
 * 
 * 数据来源: hk-food-crawler/output/ → convert_to_dig.py → dig-pois.json
 */
import { POI } from '../types/poi';

let preEnrichedPOIs: POI[] | null = null;
let isLoading = false;
let loadPromise: Promise<POI[]> | null = null;

/**
 * 懒加载预充实 POI 数据
 * 数据文件较大（可能几百 KB），按需加载
 */
export async function loadPreEnrichedPOIs(): Promise<POI[]> {
  if (preEnrichedPOIs) return preEnrichedPOIs;
  if (loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = (async () => {
    try {
      // 优先从 API 端点加载（支持动态更新）
      const apiUrl = '/api/pre-enriched';
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        preEnrichedPOIs = validatePOIs(data);
        console.log(`[preEnriched] Loaded ${preEnrichedPOIs.length} POIs from API`);
        return preEnrichedPOIs;
      }
    } catch (e) {
      console.warn('[preEnriched] API load failed, falling back to static import');
    }

    // 兜底：从静态 JSON 文件导入
    try {
      const module = await import('../data/dig-pois.json');
      preEnrichedPOIs = validatePOIs(module.default || module);
      console.log(`[preEnriched] Loaded ${preEnrichedPOIs.length} POIs from static file`);
    } catch (e) {
      console.warn('[preEnriched] Static import failed, pre-enriched data unavailable');
      preEnrichedPOIs = [];
    }

    isLoading = false;
    return preEnrichedPOIs!;
  })();

  return loadPromise;
}

/**
 * 按区域查询预充实的 POI
 * 用于 WanderScreen 中根据用户所在区域加载对应数据
 */
export function getPreEnrichedPOIsByDistrict(
  pois: POI[],
  district?: string
): POI[] {
  if (!district) return pois;
  return pois.filter(poi => poi.district === district);
}

/**
 * 按坐标范围查询预充实的 POI
 */
export function getPreEnrichedPOIsNear(
  pois: POI[],
  lat: number,
  lng: number,
  radiusKm: number = 5
): POI[] {
  return pois.filter(poi => {
    const d = haversineKm(
      lat, lng,
      poi.coordinates.lat, poi.coordinates.lng
    );
    return d <= radiusKm;
  });
}

/**
 * 合并预充实 POI 和 OSM POI
 * 预充实 POI 优先（同 id 时覆盖）
 */
export function mergeWithOSM(
  preEnriched: POI[],
  osmPOIs: POI[]
): POI[] {
  const preMap = new Map(preEnriched.map(p => [p.id, p]));
  const result: POI[] = [];

  for (const osmPOI of osmPOIs) {
    const pre = preMap.get(osmPOI.id);
    if (pre) {
      // 预充实数据覆盖，但保留 OSM 的坐标（更精确）
      const merged = {
        ...pre,
        coordinates: osmPOI.coordinates,
        source_links: {
          ...pre.source_links,
          ...osmPOI.source_links,
        },
      };
      preMap.delete(osmPOI.id);
      result.push(merged);
    } else {
      result.push(osmPOI);
    }
  }

  // 添加 OSM 中没有的纯预充实 POI
  for (const pre of preMap.values()) {
    result.push(pre);
  }

  return result;
}

// ============================================================
// 工具函数
// ============================================================

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validatePOIs(data: any): POI[] {
  if (!Array.isArray(data)) {
    console.warn('[preEnriched] Expected array, got', typeof data);
    return [];
  }
  return data.filter((item: any) => {
    return item.id && item.name && item.coordinates;
  });
}

/**
 * 重置缓存（用于刷新数据）
 */
export function clearPreEnrichedCache(): void {
  preEnrichedPOIs = null;
  loadPromise = null;
  isLoading = false;
}
