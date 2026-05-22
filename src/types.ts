export type POICategory = 'dine_in' | 'grab_go' | 'other';

export interface SignatureItem {
  name: string;
  recommendations: string; // e.g. "1.2k+ 推荐"
}

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  lat: number;
  lng: number;
  status: 'open' | 'closed';
  openingHours: string;
  payment: {
    visa: boolean;
    cash: boolean;
    applePay: boolean;
  };
  signatureItems: SignatureItem[];
  mustTry: string[];
  whyWorth: string;
  tips: string[];
  scarcity: string;
  rating: number;
  hookTag: string;
  mapsUrl?: string;
  mentionCount?: number;
  socialProof?: string;
}

export interface LocationInfo {
  city: string;
  district: string;
}

export interface DiaryEntry {
  id: string;
  poiId: string;
  poiName: string;
  date: string; // ISO string
  image: string;
  note: string;
  tags: string[];
  rating: 'worth' | 'meh' | 'avoid';
}

export const MOCK_DIARY: DiaryEntry[] = [
  {
    id: 'd1',
    poiId: '1',
    poiName: 'Halfway Coffee 半路咖啡',
    date: '2026-04-05T10:30:00Z',
    image: 'https://picsum.photos/seed/coffee1/600/800',
    note: '瓷杯比照片上还要美。燕麦拿铁口感丝滑。',
    tags: ['复古', '安静'],
    rating: 'worth'
  },
  {
    id: 'd2',
    poiId: '2',
    poiName: 'Yardbird',
    date: '2026-04-04T19:00:00Z',
    image: 'https://picsum.photos/seed/yakitori/600/800',
    note: '玉米天妇罗是必点。气氛非常火爆。',
    tags: ['活力', '米其林'],
    rating: 'worth'
  }
];

export const MOCK_POIS: POI[] = [
  {
    id: '1',
    name: 'Halfway Coffee 半路咖啡',
    category: 'grab_go',
    lat: 22.2849,
    lng: 114.1501,
    status: 'open',
    openingHours: '08:00 - 18:00',
    payment: { visa: true, cash: true, applePay: true },
    signatureItems: [
      { name: '燕麦拿铁', recommendations: '2.5k+ 推荐' },
      { name: '港式奶茶咖啡', recommendations: '800+ 推荐' }
    ],
    mustTry: ['复古瓷杯'],
    whyWorth: '香港复古美学与精品咖啡的独特融合。',
    tips: ['座位有限，建议外带', '瓷杯仅限堂食使用'],
    scarcity: '高',
    rating: 4.8,
    hookTag: '复古情怀'
  },
  {
    id: '2',
    name: 'Yardbird',
    category: 'dine_in',
    lat: 22.2855,
    lng: 114.1515,
    status: 'open',
    openingHours: '18:00 - 00:00',
    payment: { visa: true, cash: false, applePay: true },
    signatureItems: [
      { name: '鸡皮', recommendations: '1.8k+ 推荐' },
      { name: '肉丸', recommendations: '1.2k+ 推荐' }
    ],
    mustTry: ['原创辣酱'],
    whyWorth: '米其林星级烧鸟，充满活力的氛围。',
    tips: ['不设预约，建议早点去排队', '玉米天妇罗也是隐藏必点'],
    scarcity: '极高',
    rating: 4.9,
    hookTag: '米其林烧鸟'
  }
];

// Distance helper (meters)
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
