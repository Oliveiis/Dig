export interface District {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const HONG_KONG_DISTRICTS: District[] = [
  { id: 'sai-ying-pun', name: '西營盤', lat: 22.2861, lng: 114.1429 },
  { id: 'central', name: '中環', lat: 22.2819, lng: 114.1581 },
  { id: 'sheung-wan', name: '上環', lat: 22.2864, lng: 114.1501 },
  { id: 'kennedy-town', name: '堅尼地城', lat: 22.2817, lng: 114.1287 },
  { id: 'wan-chai', name: '灣仔', lat: 22.2760, lng: 114.1751 },
  { id: 'causeway-bay', name: '銅鑼灣', lat: 22.2800, lng: 114.1850 },
  { id: 'tai-hang', name: '大坑', lat: 22.2783, lng: 114.1917 },
  { id: 'north-point', name: '北角', lat: 22.2905, lng: 114.2013 },
  { id: 'quarry-bay', name: '鰂魚涌', lat: 22.2867, lng: 114.2133 },
  { id: 'wong-chuk-hang', name: '黃竹坑', lat: 22.2486, lng: 114.1686 },
  { id: 'aberdeen', name: '香港仔', lat: 22.2480, lng: 114.1552 },
  { id: 'stanley', name: '赤柱', lat: 22.2185, lng: 114.2110 },
];

export function findNearestDistrict(lat: number, lng: number): District {
  let minDistance = Infinity;
  let nearest = HONG_KONG_DISTRICTS[0];

  HONG_KONG_DISTRICTS.forEach(d => {
    const dist = Math.sqrt(Math.pow(d.lat - lat, 2) + Math.pow(d.lng - lng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      nearest = d;
    }
  });

  return nearest;
}
