import React from 'react';
import {
  Coffee,
  Croissant,
  CakeSlice,
  Soup,
  Fish,
  Beef,
  Utensils,
  Flame,
  Wine,
  Beer,
  MapPin,
  CupSoda,
  UtensilsCrossed,
  Pizza,
  ChefHat,
  Sandwich,
  Salad,
  IceCream,
  GlassWater,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { POICategory } from '../types/poi';

export const CATEGORY_COLOR: Record<POICategory, string> = {
  cafe:       '#E7B24C',
  restaurant: '#5D8EC7',
  bar:        '#DD7770',
  bakery:     '#D8926B',
  shop:       '#7B9C8D',
  experience: '#8B83B8',
};

// 中文 subcategory
const ZH_ICON: Record<string, React.ElementType> = {
  '精品咖啡':   Coffee,
  '咖啡烘焙':   Coffee,
  '咖啡店':     Coffee,
  '麵包':       Croissant,
  '甜品':       CakeSlice,
  '越南菜':     Soup,
  '日料':       Fish,
  '寿司':       Fish,
  '拉面':       Soup,
  '西餐':       Beef,
  '牛排':       Beef,
  '粵式創意':   Utensils,
  '港式西餐':   UtensilsCrossed,
  '港式茶餐廳': Utensils,
  '火鍋':       Flame,
  '調酒':       Wine,
  '清酒吧':     Wine,
  '啤酒':       Beer,
  '奶茶':       CupSoda,
  '饮品':       CupSoda,
  '披萨':       Pizza,
  '创意菜':     ChefHat,
};

// OSM cuisine tag（英文）
const EN_ICON: Record<string, React.ElementType> = {
  // 咖啡
  'cafe':             Coffee,
  'coffee':           Coffee,
  'coffee_shop':      Coffee,
  // 面包甜品
  'bakery':           Croissant,
  'pastry':           Croissant,
  'dessert':          CakeSlice,
  'ice_cream':        IceCream,
  'bubble_tea':       CupSoda,
  'milk_tea':         CupSoda,
  // 日式
  'japanese':         Fish,
  'sushi':            Fish,
  'ramen':            Soup,
  'udon':             Soup,
  'tonkatsu':         Beef,
  'yakitori':         Beef,
  'izakaya':          Wine,
  // 中式
  'chinese':          Utensils,
  'cantonese':        Utensils,
  'dim_sum':          Utensils,
  'hotpot':           Flame,
  'hong_kong':        Utensils,
  // 西式
  'western':          Beef,
  'steak':            Beef,
  'burger':           Sandwich,
  'sandwich':         Sandwich,
  'pizza':            Pizza,
  'italian':          Pizza,
  'french':           ChefHat,
  'american':         Sandwich,
  // 亚洲其他
  'vietnamese':       Soup,
  'thai':             Soup,
  'korean':           Flame,
  'indian':           ChefHat,
  'asian':            Utensils,
  'seafood':          Fish,
  // 酒吧
  'bar':              Wine,
  'cocktail':         Wine,
  'sake':             Wine,
  'wine_bar':         Wine,
  'pub':              Beer,
  'brewery':          Beer,
  // 其他
  'salad':            Salad,
  'vegetarian':       Salad,
  'vegan':            Salad,
  'juice':            GlassWater,
  'drinks':           GlassWater,
  'restaurant':       Utensils,
  'food':             Utensils,
};

export function getSubcategoryIcon(sub: string): React.ElementType {
  if (!sub) return Utensils;
  // 先查中文表
  if (ZH_ICON[sub]) return ZH_ICON[sub];
  // 再查英文表（支持 "japanese;sushi" 这种多值格式）
  const parts = sub.toLowerCase().split(/[;,_\s]+/);
  for (const part of parts) {
    if (EN_ICON[part]) return EN_ICON[part];
  }
  // category-level fallback
  if (sub === 'cafe') return Coffee;
  if (sub === 'bar') return Wine;
  return Utensils;
}

export const ALLOWED_CATEGORIES: POICategory[] = ['cafe', 'restaurant', 'bar', 'bakery', 'shop', 'experience'];

export const CATEGORY_LABEL: Record<POICategory, string> = {
  cafe: '咖啡',
  restaurant: '餐廳',
  bar: '酒吧',
  bakery: '烘焙',
  shop: '逛店',
  experience: '體驗',
};

export function getCategoryIcon(category: POICategory): React.ElementType {
  if (category === 'cafe') return Coffee;
  if (category === 'bar') return Wine;
  if (category === 'bakery') return Croissant;
  if (category === 'shop') return ShoppingBag;
  if (category === 'experience') return Sparkles;
  return Utensils;
}

const SUBCATEGORY_LABEL: Record<string, string> = {
  cafe: '咖啡',
  coffee: '咖啡',
  coffee_shop: '咖啡',
  bakery: '烘焙',
  cake: '甜點',
  dessert: '甜點',
  restaurant: '餐廳',
  chinese: '中式料理',
  cantonese: '粵菜',
  dim_sum: '點心',
  noodle: '麵食',
  vietnamese: '越南菜',
  thai: '泰國菜',
  korean: '韓式料理',
  japanese: '日式料理',
  sushi: '壽司',
  ramen: '拉麵',
  steak: '牛排',
  steak_house: '牛排館',
  mexican: '墨西哥菜',
  indian: '印度菜',
  italian: '意大利菜',
  french: '法國菜',
  western: '西餐',
  burger: '漢堡',
  pizza: '披薩',
  seafood: '海鮮',
  vegetarian: '素食',
  vegan: '純素料理',
  hotpot: '火鍋',
  bar: '酒吧',
  pub: '酒館',
  cocktail: '調酒',
  wine_bar: '葡萄酒吧',
};

export function getSubcategoryLabel(subcategory: string, category: POICategory): string {
  const normalized = (subcategory || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (SUBCATEGORY_LABEL[normalized]) return SUBCATEGORY_LABEL[normalized];
  if (/\p{Script=Han}/u.test(subcategory)) return subcategory;
  return CATEGORY_LABEL[category];
}
