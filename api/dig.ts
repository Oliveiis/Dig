import type { VercelRequest, VercelResponse } from "@vercel/node";
import { config } from "dotenv";

config();

const SERPAPI_KEY = process.env.SERPAPI_KEY || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

async function callDeepSeek(prompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) return "";
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = (await res.json()) as any;
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

// 品类中文映射
const TYPE_ZH: Record<string, string> = {
  "japanese restaurant": "日料",
  "sushi restaurant": "寿司",
  "ramen restaurant": "拉面",
  "thai restaurant": "泰菜",
  "vietnamese restaurant": "越南菜",
  "korean restaurant": "韩料",
  "chinese restaurant": "中餐",
  "cantonese restaurant": "粤菜",
  "dim sum restaurant": "点心",
  "french restaurant": "法餐",
  "italian restaurant": "意餐",
  "western restaurant": "西餐",
  "steak house": "牛排",
  "burger restaurant": "汉堡",
  "pizza restaurant": "披萨",
  cafe: "咖啡",
  "coffee shop": "咖啡",
  bakery: "烘焙",
  "dessert shop": "甜品",
  bar: "酒吧",
  "cocktail bar": "调酒",
  "wine bar": "葡萄酒",
  pub: "酒馆",
  "seafood restaurant": "海鲜",
  "hot pot restaurant": "火锅",
  "indian restaurant": "印度菜",
};

function getTypeZh(type: string | null, subcategory: string): string {
  if (!type) return subcategory || "";
  const t = type.toLowerCase();
  for (const [k, v] of Object.entries(TYPE_ZH)) {
    if (t.includes(k)) return v;
  }
  return subcategory || type;
}

interface GmapsData {
  rating?: number | null;
  reviews?: number | null;
  type?: string[];
  description?: string | null;
  price?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  open_state?: string | null;
  is_open_now?: boolean | null;
  hours_today?: string | null;
  hours_all?: string | null;
  service_options?: any;
  time_spent?: string | null;
  highlights?: string[];
  atmosphere?: string[];
  offerings?: string[];
  planning?: string[];
  payments?: string[];
  popular_for?: string[];
  user_reviews?: { rating: number; snippet: string }[];
}

async function fetchGoogleMapsData(
  name: string,
  district: string
): Promise<GmapsData | null> {
  if (!SERPAPI_KEY) return null;
  try {
    const coreName = name.replace(/\s*[-–]\s*\S+.*$/, "").trim();
    const q = encodeURIComponent(`${coreName} Hong Kong`);
    const url = `https://serpapi.com/search?engine=google_maps&q=${q}&api_key=${SERPAPI_KEY}`;
    const res = await fetch(url);
    const data = (await res.json()) as any;

    let match = data.place_results ?? null;
    if (!match) {
      const locals: any[] = data.local_results || [];
      const nameLower = coreName.toLowerCase();
      match =
        locals.find((p: any) => {
          const t = (p.title || "")
            .toLowerCase()
            .replace(/\s*\(.*\)/, "")
            .trim();
          return (
            t.includes(nameLower) ||
            nameLower.includes(t) ||
            t.split(" ")[0] === nameLower.split(" ")[0]
          );
        }) ??
        locals[0] ??
        null;
    }

    if (!match) return null;

    if (!match.extensions && match.place_id) {
      try {
        const detailUrl = `https://serpapi.com/search?engine=google_maps&place_id=${match.place_id}&api_key=${SERPAPI_KEY}`;
        const detailData = await (await fetch(detailUrl)).json();
        if (detailData.place_results)
          match = { ...match, ...detailData.place_results };
      } catch {}
    }

    const ext: Record<string, string[]> = {};
    for (const e of match.extensions || []) {
      for (const [k, v] of Object.entries(e)) {
        if (Array.isArray(v)) ext[k] = v as string[];
      }
    }

    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayKey = days[new Date().getDay()];
    const opHours = match.operating_hours ?? {};
    const hoursArr: any[] = match.hours ?? [];
    const todayHours =
      opHours[todayKey] ??
      hoursArr.find((h: any) => h[todayKey])?.[todayKey] ??
      null;

    const openState: string = match.open_state ?? "";
    const isOpenNow =
      openState.toLowerCase().includes("open now") ||
      openState.toLowerCase().includes("closes");

    const liveHash = match.popular_times?.live_hash;
    const timeSpent =
      (liveHash?.time_spent ?? "")
        .replace(/People typically spend /i, "")
        .trim() || null;

    let userReviews: { rating: number; snippet: string }[] = [];
    const inlineReviews = match.user_reviews?.most_relevant || [];
    userReviews = inlineReviews
      .filter((r: any) => r.rating >= 4 && r.snippet)
      .slice(0, 5)
      .map((r: any) => ({ rating: r.rating, snippet: r.snippet as string }));

    if (userReviews.length === 0 && match.data_id) {
      try {
        const rUrl = `https://serpapi.com/search?engine=google_maps_reviews&data_id=${match.data_id}&api_key=${SERPAPI_KEY}&hl=en&sort_by=ratingHigh`;
        const rData = await (await fetch(rUrl)).json();
        userReviews = (rData.reviews || [])
          .filter((r: any) => r.rating >= 4 && r.snippet)
          .slice(0, 5)
          .map((r: any) => ({ rating: r.rating, snippet: r.snippet as string }));
      } catch {}
    }

    return {
      rating: match.rating ?? null,
      reviews: match.reviews ?? null,
      type: Array.isArray(match.type) ? match.type : [match.type].filter(Boolean),
      description: match.description ?? null,
      price: match.price ?? null,
      address: match.address ?? null,
      phone: match.phone ?? null,
      website: match.website ?? null,
      open_state: openState || null,
      is_open_now: isOpenNow,
      hours_today: todayHours,
      hours_all:
        Object.entries(opHours)
          .map(([d, t]) => `${d.slice(0, 3)}: ${t}`)
          .join("  ") || null,
      service_options: match.service_options ?? null,
      time_spent: timeSpent,
      highlights: ext["highlights"] ?? [],
      atmosphere: ext["atmosphere"] ?? [],
      offerings: ext["offerings"] ?? [],
      planning: ext["planning"] ?? [],
      payments: ext["payments"] ?? [],
      popular_for: ext["popular_for"] ?? [],
      user_reviews: userReviews,
    };
  } catch {
    return null;
  }
}

function buildHookTag(gmaps: GmapsData | null, typeZh: string): string {
  if (!gmaps) return "";
  const r = gmaps.rating ?? 0;
  const n = gmaps.reviews ?? 0;

  if (r >= 4.8 && n >= 1000) return `${typeZh}界排队王`;
  if (r >= 4.8 && n >= 500) return `${typeZh}隐藏神店`;
  if (r >= 4.8 && n >= 100) return `高分${typeZh}`;
  if (r >= 4.7 && n >= 2000) return `${typeZh}地标`;
  if (r >= 4.6 && n >= 1000) return `千人推荐${typeZh}`;
  if (r >= 4.6 && n >= 500) return `${typeZh}口碑之选`;
  if (r >= 4.6 && n >= 200) return `实力${typeZh}`;
  if (r >= 4.6 && n < 100) return `新晋${typeZh}黑马`;
  if (r >= 4.5 && n < 50) return `小众${typeZh}精选`;
  if (n >= 3000) return `${typeZh}打卡地标`;
  if (n >= 1000) return `${typeZh}热门之选`;
  if (r >= 4.4) return `${typeZh}值得一试`;
  return typeZh;
}

function buildCaveats(gmaps: GmapsData | null): string[] {
  const caveats: string[] = [];
  if (
    gmaps?.service_options?.takeout === false &&
    gmaps?.service_options?.dine_in === true
  )
    caveats.push("僅限堂食");
  const planning: string[] = gmaps?.planning ?? [];
  if (planning.some((p: string) => p.toLowerCase().includes("reservation")))
    caveats.push("建議提前訂座");
  const parking: string[] = (gmaps as any)?.parking ?? [];
  if (parking.some((p: string) => p.toLowerCase().includes("difficult")))
    caveats.push("附近泊車困難");
  if (gmaps?.time_spent) caveats.push(`平均逗留 ${gmaps.time_spent}`);
  return caveats.slice(0, 3);
}

function buildSignatureItems(gmaps: GmapsData | null): string[] {
  const items: string[] = [];
  const highlightZh: Record<string, string> = {
    cocktails: "特色調酒",
    dessert: "招牌甜品",
    "wine list": "精選酒單",
    coffee: "精品咖啡",
    beer: "精釀啤酒",
    "tea selection": "茶品精選",
    food: "特色料理",
    atmosphere: "氛圍出色",
    service: "服務細緻",
  };
  for (const h of gmaps?.highlights ?? []) {
    const key = h.replace(/^Great /i, "").toLowerCase().trim();
    const zh = highlightZh[key] || h.replace(/^Great /i, "");
    if (!items.includes(zh)) items.push(zh);
    if (items.length >= 3) break;
  }

  if (items.length < 3) {
    const offeringZh: Record<string, string> = {
      Omakase: "Omakase 套餐",
      "Tasting menu": "廚師發辦",
      "Small plates": "小食拼盤",
      "Private dining room": "私人包廂",
      "Vegetarian options": "素食可選",
      "Natural wine": "天然葡萄酒",
      "Craft beer": "精釀啤酒",
    };
    for (const o of gmaps?.offerings ?? []) {
      const zh = offeringZh[o];
      if (zh && !items.includes(zh)) {
        items.push(zh);
        if (items.length >= 3) break;
      }
    }
  }

  if (items.length < 3) {
    const allText = (gmaps?.user_reviews ?? [])
      .map((r) => r.snippet || "")
      .join(" ");
    const patterns = [
      /(?:try|order|get|had|have) (?:the |their )?([A-Z][a-zA-Z\s]{2,20}?)(?=[,.\s!]|$)/g,
      /([A-Z][a-zA-Z\s]{2,20}?) (?:was|were|is) (?:amazing|excellent|great|delicious|fantastic|incredible)/g,
    ];
    for (const p of patterns) {
      for (const m of allText.matchAll(p)) {
        const item = m[1].trim();
        if (item.length >= 3 && item.length <= 25 && !items.includes(item)) {
          items.push(item);
          if (items.length >= 3) break;
        }
      }
      if (items.length >= 3) break;
    }
  }

  return items;
}

function buildWhyWorthIt(gmaps: GmapsData | null, typeZh: string): string {
  const parts: string[] = [];
  if (gmaps?.description) parts.push(gmaps.description);
  if (gmaps?.rating && gmaps?.reviews) {
    parts.push(`Google Maps ${gmaps.rating}分，${gmaps.reviews}條真實評價`);
  }
  const atm: string[] = gmaps?.atmosphere ?? [];
  if (atm.length > 0) parts.push(`氛圍：${atm.join("、")}`);
  const pf: string[] = gmaps?.popular_for ?? [];
  if (pf.length > 0) parts.push(`適合${pf.join("/")}`);
  return parts.join("。") || "";
}

function buildHours(gmaps: GmapsData | null): string | null {
  if (!gmaps) return null;
  const today = gmaps.hours_today;
  const state = gmaps.open_state;
  const stateShort = state ? state.split("·")[0].trim() : null;
  if (today && stateShort) return `今日 ${today}（${stateShort}）`;
  if (today) return `今日 ${today}`;
  if (stateShort) return stateShort;
  if (gmaps.hours_all) return gmaps.hours_all;
  return null;
}

function buildPaymentInfo(gmaps: GmapsData | null): {
  visa: boolean | null;
  cash: boolean;
  note: string | null;
} {
  const payments: string[] = gmaps?.payments ?? [];
  const hasCard = payments.some((p) => /credit|debit|visa/i.test(p));
  const hasNfc = payments.some((p) => /nfc|mobile/i.test(p));
  const note = hasNfc ? "支援 NFC 支付" : null;
  return {
    visa: hasCard ? true : null,
    cash: true,
    note,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { poi } = req.body || {};
  if (!poi) return res.status(400).json({ error: "poi is required" });

  const gmaps = await fetchGoogleMapsData(poi.name, poi.district ?? "");
  const typeZh = getTypeZh(gmaps?.type?.[0] ?? null, poi.subcategory ?? "");

  let hook_tag = buildHookTag(gmaps, typeZh) || null;
  let why_worth_it = buildWhyWorthIt(gmaps, typeZh) || null;

  if (gmaps && DEEPSEEK_API_KEY) {
    const reviewText = (gmaps.user_reviews ?? [])
      .map((r) => r.snippet)
      .filter(Boolean)
      .join("\n");
    const prompt = `你是香港街头探索指南的文案专家，负责给一个发现附近好店的 App 写店铺标签和推荐文案。

店铺信息：
- 名称：${poi.name}
- 类型：${gmaps.type?.join(", ") || poi.subcategory}
- 地区：${poi.district || gmaps.address || "香港"}
- Google Maps 评分：${gmaps.rating ?? "未知"}（${gmaps.reviews ?? 0} 条评价）
- 价格区间：${gmaps.price ?? "未知"}
- Google 描述：${gmaps.description ?? "无"}
- 氛围标签：${gmaps.atmosphere?.join("、") || "无"}
- 亮点：${gmaps.highlights?.join("、") || "无"}
- 适合场景：${gmaps.popular_for?.join("、") || "无"}
- 供应：${gmaps.offerings?.slice(0, 5).join("、") || "无"}
${reviewText ? `- 用户评论摘录：\n${reviewText}` : ""}

请输出 JSON（只输出 JSON，不要任何解释）：
{
  "hook_tag": "4-8个字的吸引人标签，要有具体亮点，例如'亞洲50最佳調酒'、'米其林推介叉燒'、'排隊兩小時的港式茶餐廳'，禁止用'好评如潮'这种空洞词",
  "why_worth_it": "2-3句话，用繁体中文，说明为什么值得专程来，要有具体细节，例如评分、特色、氛围，让人看完就想去"
}`;

    const aiText = await callDeepSeek(prompt);
    try {
      const aiJson = JSON.parse(aiText.replace(/```json|```/g, "").trim());
      if (aiJson.hook_tag) hook_tag = aiJson.hook_tag;
      if (aiJson.why_worth_it) why_worth_it = aiJson.why_worth_it;
    } catch {}
  }

  return res.json({
    hook_tag,
    why_worth_it,
    signature_items: buildSignatureItems(gmaps),
    caveats: buildCaveats(gmaps),
    hours: buildHours(gmaps),
    is_open_now: gmaps?.is_open_now ?? null,
    payment: buildPaymentInfo(gmaps),
    recommendation_count: gmaps?.reviews ?? null,
    price_range: gmaps?.price ?? null,
    source_links: {
      google_maps: gmaps
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            poi.name + " Hong Kong"
          )}`
        : undefined,
    },
  });
}
