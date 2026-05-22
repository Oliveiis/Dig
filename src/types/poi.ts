export type POICategory = 'cafe' | 'restaurant' | 'bar';

export type POISubcategory =
  | '精品咖啡' | '咖啡烘焙'
  | '麵包' | '甜品'
  | '越南菜' | '日料' | '西餐' | '粵式創意' | '港式西餐'
  | '港式茶餐廳' | '火鍋'
  | '調酒' | '清酒吧' | '啤酒'
  | string;

export type CheckinReaction =
  | 'comeback'
  | 'regret'
  | 'as_expected'
  | 'nothing_special';

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  subcategory: POISubcategory;
  hook_tag: string;
  district: string;
  city_code: 'HKG';
  coordinates: { lat: number; lng: number };
  distance_meters?: number;
  is_open_now: boolean | null;
  hours: string | null;
  payment: {
    visa: boolean | null;
    cash: boolean;
    note: string | null;
  };
  signature_items: string[];
  souvenirs: { name: string; price_hkd: number | null }[];
  why_worth_it: string | null;
  caveats: string[];
  flash_event: { label: string; expires_at: string | null } | null;
  is_chain: boolean;
  source_links: { xiaohongshu?: string; google_maps?: string };
  recommendation_count?: number;
  mention_count?: number;
  price_range?: string;
}

export interface CheckinEntry {
  poi_id: string;
  poi_name: string;
  poi_category: POICategory;
  poi_subcategory: string;
  poi_district: string;
  visited_at: string;
  reaction: CheckinReaction;
  photo_url?: string;
  text_note?: string;
}

export interface BookmarkEntry {
  poi_id: string;
  poi_name: string;
  bookmarked_at: string;
  notified_nearby: boolean;
}

export interface FavouriteEntry {
  poi_id: string;
  poi_name: string;
  poi_category: POICategory;
  poi_subcategory: string;
  favourited_at: string;
  review: {
    vibe_tags: string[];
    what_to_order: string;
    price_feel: 'worth_it' | 'reasonable' | 'expensive' | string;
    text_note: string | null;
  } | null;
}

export interface TasteProfile {
  persona_label: string;
  persona_type: string;
  one_liner: string;
  top_categories: { label: string; count: number }[];
  top_vibes: string[];
  top_skus: { name: string; count: number }[];
  top_district: string;
  dimensions: { label: string; value: number; left_label: string; right_label: string }[];
  price_tendency: 'worth_it' | 'expensive' | 'bargain' | null;
  favourite_count: number;
  checkin_count: number;
  regret_rate: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  poi_ids: string[];
  created_at: string;
  cover_image?: string;
}
