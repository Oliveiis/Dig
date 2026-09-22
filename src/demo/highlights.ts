import type { DemoPlace, Food } from './data';

export type Highlight = { kind: string; text: string; icon: string };
// Product-demo copy, not verified offers or live reviews. Disclosed in shop details.
const PICKS: Record<string, [string, string][]> = {
  'osm-8424231338': [['上新', '新品牛角包，配咖啡剛剛好'], ['必試', '燕麥拿鐵，順滑不搶咖啡香'], ['人氣', '咖啡控想再來的一杯']],
  'osm-4862057460': [['上新', '牛角包出爐，酥香剛剛好'], ['必吃', '一口鬆軟，街坊的麵包日常'], ['限時', '晚上九點，麵包買一送一']],
  'osm-10743865077': [['必吃', '菠蘿包的酥皮，才是靈魂'], ['上新', '今日小蛋糕，給下午加點甜'], ['人氣', '街坊會順路帶走的那一口']],
  'osm-4416529189': [['必吃', '流心西多士，趁熱切開'], ['必試', '點心配港式奶茶，剛好一餐'], ['人氣', '為這口點心，專程走進水街']],
  'osm-12484286014': [['必吃', '韓式烤肉，和朋友分著吃'], ['必試', '泡菜煎餅，邊緣焦脆才過癮'], ['人氣', '今晚的聚餐，就想吃這一口']],
};
const CATEGORY: Record<Food, [string, string][]> = {
  coffee: [['必試', '一杯拿鐵，讓下午慢下來'], ['上新', '季節特調，換一種咖啡心情'], ['人氣', '咖啡香裡，藏著街角的小驚喜']],
  bakery: [['上新', '牛角包出爐，層層酥香'], ['必吃', '鬆軟麵包，早餐就想吃這口'], ['人氣', '麵包配咖啡，簡單就很滿足']],
  sweet: [['必吃', '下午茶想留給這塊蛋糕'], ['上新', '季節甜點，今天加一點甜'], ['人氣', '甜品控的下一個口袋清單']],
  chinese: [['必試', '熱騰騰的中菜，最有煙火氣'], ['人氣', '街坊口味，留給今天的午餐'], ['必吃', '中式好滋味，和朋友一起分享']],
  japanese: [['必試', '日式料理，認真吃好這一餐'], ['人氣', '日料控的街角口袋清單'], ['必吃', '今天的好心情，從一頓日料開始']],
  western: [['必試', '西式好味，留給週末聚餐'], ['人氣', '想和朋友慢慢吃的一餐'], ['必吃', '用一頓西餐，犒賞忙碌的一天']],
  korean: [['必試', '韓式料理，適合一起分享'], ['人氣', '今晚聚餐，想吃熱辣的韓味'], ['必吃', '韓式好味，越聊越有食慾']],
  asian: [['必試', '東南亞風味，換個口味吃午餐'], ['人氣', '香料的層次，讓人想再吃一口'], ['必吃', '把今天的一餐，變成小旅行']],
  other: [['探索', '路過這裡，發現一家小餐廳'], ['靈感', '下一頓，留給街角的新發現'], ['探索', '先看看店鋪情報，再決定吃什麼']],
};
export function highlightIcon(text: string, kind: string): string {
  if (/買一送一|限時|優惠|折扣/.test(text + kind)) return '🔥';
  if (/牛角包|可頌/.test(text)) return '🥐';
  if (/蛋糕|甜品|甜點/.test(text)) return '🍰';
  if (/烤肉/.test(text)) return '🥩';
  if (/煎餅/.test(text)) return '🥞';
  if (/西多士|麵包|菠蘿包/.test(text)) return '🍞';
  if (/奶茶/.test(text)) return '🧋';
  if (/咖啡|拿鐵/.test(text)) return '☕';
  return kind === '人氣' ? '💬' : kind === '必吃' || kind === '必試' ? '✨' : '💡';
}
export function highlightsFor(place: DemoPlace): Highlight[] {
  return (PICKS[place.id] ?? CATEGORY[place.food]).map(([kind, text]) => ({ kind, text, icon: highlightIcon(text, kind) }));
}
