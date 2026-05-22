import { FavouriteEntry, TasteProfile, POI, CheckinEntry } from '../types/poi';

export function deriveTasteProfile(
  favourites: FavouriteEntry[], 
  checkins: CheckinEntry[],
  allPOIs: POI[]
): TasteProfile {
  const favouriteCount = favourites.length;
  const checkinCount = checkins.length;
  
  if (favouriteCount === 0 && checkinCount === 0) {
    return {
      persona_type: 'explorer',
      persona_label: '城市探索者',
      one_liner: '你正在開啟一段未知的城市冒險。',
      dimensions: [],
      top_skus: [],
      top_categories: [],
      top_vibes: [],
      price_tendency: null,
      favourite_count: 0,
      checkin_count: 0,
      regret_rate: 0,
      top_district: '未知'
    };
  }

  // Helper to get POI by ID
  const getPOI = (id: string) => allPOIs.find(p => p.id === id);

  // 1. Calculate Regret Rate
  const regretCount = checkins.filter(c => c.reaction === 'regret').length;
  const regret_rate = checkinCount > 0 ? Math.round((regretCount / checkinCount) * 100) : 0;

  // 2. Aggregate Districts
  const districtCounts: Record<string, number> = {};
  checkins.forEach(c => {
    const poi = getPOI(c.poi_id);
    if (poi) {
      districtCounts[poi.district] = (districtCounts[poi.district] || 0) + 1;
    }
  });
  const top_district = Object.entries(districtCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '未知';

  // 3. Aggregate Categories & SKUs
  const subcatCounts: Record<string, number> = {};
  const skuCounts: Record<string, number> = {};
  favourites.forEach(f => {
    subcatCounts[f.poi_subcategory] = (subcatCounts[f.poi_subcategory] || 0) + 1;
    if (f.review?.what_to_order) {
      skuCounts[f.review.what_to_order] = (skuCounts[f.review.what_to_order] || 0) + 1;
    }
  });
  
  const top_categories = Object.entries(subcatCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const top_skus = Object.entries(skuCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // 4. Determine Persona Type
  let persona_type: TasteProfile['persona_type'] = 'explorer';
  let persona_label = '城市探索者';
  let one_liner = '你是一個對城市充滿好奇的探索者。';

  const coffeeCount = favourites.filter(f => f.poi_category === 'cafe').length;
  const nonChainRatio = favourites.length > 0 
    ? favourites.filter(f => !getPOI(f.poi_id)?.is_chain).length / favourites.length 
    : 0;
  const restaurantCount = favourites.filter(f => f.poi_category === 'restaurant').length;
  const districtCount = Object.keys(districtCounts).length;

  if (coffeeCount >= 5) {
    persona_type = 'coffee_connoisseur';
    persona_label = '咖啡鑑賞者';
    one_liner = `對${top_skus[0]?.name || '燕麥拿鐵'}有執念、只信社區小店、踩雷率全平台最低 ${regret_rate}% 的咖啡鑑賞者。`;
  } else if (nonChainRatio > 0.8 && favouriteCount >= 3) {
    persona_type = 'hidden_gem';
    persona_label = '隱世挖掘機';
    one_liner = `擅長在巷弄中尋找驚喜，非連鎖店佔比高達 ${Math.round(nonChainRatio * 100)}%，是真正的隱世挖掘機。`;
  } else if (restaurantCount >= 8) {
    persona_type = 'food_adventurer';
    persona_label = '美食冒險家';
    one_liner = `品類跨度極廣，從不給胃留遺憾，是一位資深的美食冒險家。`;
  } else if (districtCounts[top_district] >= 10) {
    persona_type = 'local_expert';
    persona_label = '本地通';
    one_liner = `對${top_district}的每一條街道都瞭如指掌，是當之無愧的本地通。`;
  }

  // 5. Generate Dimensions based on Persona
  const dimensions: TasteProfile['dimensions'] = [];
  
  // Common dimensions
  dimensions.push({
    label: '踩雷率',
    value: Math.max(0, 100 - regret_rate * 3), // Higher value is better (lower regret)
    left_label: '低',
    right_label: '高'
  });

  if (persona_type === 'coffee_connoisseur') {
    dimensions.push({
      label: '店型',
      value: 80,
      left_label: '社區小店',
      right_label: '連鎖品牌'
    });
    dimensions.push({
      label: '口味',
      value: 70,
      left_label: '酸感',
      right_label: '醇厚'
    });
  } else if (persona_type === 'hidden_gem') {
    dimensions.push({
      label: '非連鎖佔比',
      value: nonChainRatio * 100,
      left_label: '低',
      right_label: '100%'
    });
  }

  // Aggregate vibes
  const vibeCounts: Record<string, number> = {};
  favourites.forEach(f => {
    if (f.review?.vibe_tags) {
      f.review.vibe_tags.forEach(tag => {
        vibeCounts[tag] = (vibeCounts[tag] || 0) + 1;
      });
    }
  });
  const top_vibes = Object.entries(vibeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);

  // Price tendency
  const priceCounts: Record<string, number> = { worth_it: 0, expensive: 0, bargain: 0 };
  favourites.forEach(f => {
    if (f.review?.price_feel) {
      priceCounts[f.review.price_feel]++;
    }
  });
  const price_tendency = Object.entries(priceCounts)
    .sort((a, b) => b[1] - a[1])[0][0] as any;

  return {
    persona_type,
    persona_label,
    one_liner,
    dimensions,
    top_skus,
    top_categories: top_categories.slice(0, 3),
    top_vibes,
    price_tendency,
    favourite_count: favouriteCount,
    checkin_count: checkinCount,
    regret_rate,
    top_district
  };
}

export const VIBE_TAGS = [
  '安靜工作', '適合約會', '人多熱鬧',
  '隱世小店', '打卡必去', '性價比高',
  '獨特體驗', '外國人友好', '適合獨行',
];
