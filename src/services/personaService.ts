import { CheckinEntry, FavouriteEntry } from '../types/poi';

export interface Persona {
  title: string;
  emoji: string;
  description: string;
  unlock_info: string;
  attributes: {
    label: string;
    value: number; // 0 to 100
    min_label: string;
    max_label: string;
  }[];
  skills: string[];
}

export function generatePersona(checkins: CheckinEntry[], favourites: FavouriteEntry[]): Persona {
  const totalCount = checkins.length + favourites.length;
  
  if (totalCount < 3) {
    return {
      title: "城市探索初學者",
      emoji: "🚶",
      description: "剛開始在城市中留下足跡，對一切都充滿好奇。",
      unlock_info: `再打卡 ${3 - totalCount} 次解鎖專屬人設`,
      attributes: [
        { label: "探索度", value: 30, min_label: "隨性", max_label: "硬核" },
        { label: "品味", value: 50, min_label: "大眾", max_label: "小眾" }
      ],
      skills: ["新手上路"]
    };
  }

  // Analyze categories
  const categoryCounts: Record<string, number> = {};
  [...checkins, ...favourites].forEach(item => {
    const sub = 'poi_subcategory' in item ? item.poi_subcategory : (item as any).subcategory || '未知';
    categoryCounts[sub] = (categoryCounts[sub] || 0) + 1;
  });

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategory[0];
  const topCategoryCount = topCategory[1];

  const isCoffeeLover = topCategoryName.toLowerCase().includes('咖啡') || topCategoryName.toLowerCase().includes('cafe');
  const isBarLover = topCategoryName.toLowerCase().includes('酒吧') || topCategoryName.toLowerCase().includes('bar');
  const isFoodie = topCategoryName.toLowerCase().includes('菜') || topCategoryName.toLowerCase().includes('餐') || topCategoryName.toLowerCase().includes('料理');

  if (isCoffeeLover) {
    return {
      title: "咖啡鑑賞者",
      emoji: "☕",
      description: `對燕麥拿鐵有執念、只信社區小店、踩雷率極低的咖啡鑑賞者。`,
      unlock_info: `根據你喜愛的 ${favourites.length} 家店解鎖`,
      attributes: [
        { label: "店型", value: 82, min_label: "社區小店", max_label: "連鎖品牌" },
        { label: "口味", value: 68, min_label: "酸感", max_label: "醇厚" },
        { label: "萃取", value: 60, min_label: "手冲", max_label: "意式" },
        { label: "消費", value: 42, min_label: "超值優先", max_label: "不計成本" }
      ],
      skills: [
        `${topCategoryName} ×${topCategoryCount}`,
        "手冲 ×4",
        "冷萃 ×2",
        "西營盤最常出沒"
      ]
    };
  }

  if (isBarLover) {
    return {
      title: "微醺探險家",
      emoji: "🍸",
      description: "深夜城市的守望者，對調酒層次有著近乎苛刻的要求。",
      unlock_info: `根據你打卡的 ${checkins.length} 個地點解鎖`,
      attributes: [
        { label: "氛圍", value: 75, min_label: "安靜", max_label: "熱鬧" },
        { label: "基酒", value: 40, min_label: "琴酒", max_label: "威士忌" },
        { label: "創意", value: 85, min_label: "經典", max_label: "先鋒" },
        { label: "消費", value: 70, min_label: "超值優先", max_label: "不計成本" }
      ],
      skills: [
        `${topCategoryName} ×${topCategoryCount}`,
        "Negroni 專家",
        "隱藏菜單獵人",
        "中環深夜常客"
      ]
    };
  }

  if (isFoodie) {
    return {
      title: "美食獵人",
      emoji: "🍱",
      description: "味蕾極其發達，擅長在巷弄中挖掘那些被大眾忽略的絕世美味。",
      unlock_info: `根據你豐富的 ${totalCount} 次探店解鎖`,
      attributes: [
        { label: "口味", value: 90, min_label: "清淡", max_label: "重口" },
        { label: "環境", value: 30, min_label: "路邊攤", max_label: "精緻餐飲" },
        { label: "性價比", value: 80, min_label: "不計成本", max_label: "極致超值" },
        { label: "冒險感", value: 70, min_label: "穩健", max_label: "獵奇" }
      ],
      skills: [
        `${topCategoryName} ×${topCategoryCount}`,
        "老字號收割機",
        "排隊耐性 0",
        "隱藏菜單發現者"
      ]
    };
  }

  return {
    title: "城市漫遊者",
    emoji: "🧭",
    description: "不設限的探索者，喜歡在城市的毛細血管中尋找驚喜。",
    unlock_info: `根據你豐富的 ${totalCount} 次足跡解鎖`,
    attributes: [
      { label: "目的性", value: 20, min_label: "漫無目的", max_label: "精確導航" },
      { label: "社交性", value: 45, min_label: "獨行", max_label: "聚會" },
      { label: "冒險感", value: 90, min_label: "穩健", max_label: "踩雷預警" },
      { label: "消費", value: 55, min_label: "超值優先", max_label: "不計成本" }
    ],
    skills: [
      "隨心所欲",
      "巷弄專家",
      "多樣化品味"
    ]
  };
}
