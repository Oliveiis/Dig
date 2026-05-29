import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "dotenv";
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERPAPI_KEY = process.env.SERPAPI_KEY || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

async function callDeepSeek(prompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) return "";
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

// 品类中文映射
const TYPE_ZH: Record<string, string> = {
  'japanese restaurant': '日料', 'sushi restaurant': '寿司', 'ramen restaurant': '拉面',
  'thai restaurant': '泰菜', 'vietnamese restaurant': '越南菜', 'korean restaurant': '韩料',
  'chinese restaurant': '中餐', 'cantonese restaurant': '粤菜', 'dim sum restaurant': '点心',
  'french restaurant': '法餐', 'italian restaurant': '意餐', 'western restaurant': '西餐',
  'steak house': '牛排', 'burger restaurant': '汉堡', 'pizza restaurant': '披萨',
  'cafe': '咖啡', 'coffee shop': '咖啡', 'bakery': '烘焙', 'dessert shop': '甜品',
  'bar': '酒吧', 'cocktail bar': '调酒', 'wine bar': '葡萄酒', 'pub': '酒馆',
  'seafood restaurant': '海鲜', 'hot pot restaurant': '火锅', 'indian restaurant': '印度菜',
};

function getTypeZh(type: string | null, subcategory: string): string {
  if (!type) return subcategory || "";
  const t = type.toLowerCase();
  for (const [k, v] of Object.entries(TYPE_ZH)) {
    if (t.includes(k)) return v;
  }
  return subcategory || type;
}

async function fetchGoogleMapsData(name: string, district: string) {
  if (!SERPAPI_KEY) return null;
  try {
    // 清理 OSM 店名里常见的 " - District" 后缀，提取核心店名
    const coreName = name.replace(/\s*[-–]\s*\S+.*$/, "").trim();
    const q = encodeURIComponent(`${coreName} Hong Kong`);
    const url = `https://serpapi.com/search?engine=google_maps&q=${q}&api_key=${SERPAPI_KEY}`;
    const res = await fetch(url);
    const data = await res.json() as any;

    // 优先 place_results，其次 local_results 模糊匹配
    let match = data.place_results ?? null;
    if (!match) {
      const locals: any[] = data.local_results || [];
      const nameLower = coreName.toLowerCase();
      // 宽松匹配：只要任一方包含另一方的核心词
      match = locals.find((p: any) => {
        const t = (p.title || "").toLowerCase().replace(/\s*\(.*\)/, "").trim();
        return t.includes(nameLower) || nameLower.includes(t) || t.split(" ")[0] === nameLower.split(" ")[0];
      }) ?? locals[0] ?? null;
    }

    if (!match) return null;

    // 如果是 local_result（没有 extensions），用 place_id 拉完整详情
    if (!match.extensions && match.place_id) {
      try {
        const detailUrl = `https://serpapi.com/search?engine=google_maps&place_id=${match.place_id}&api_key=${SERPAPI_KEY}`;
        const detailData = await (await fetch(detailUrl)).json() as any;
        if (detailData.place_results) match = { ...match, ...detailData.place_results };
      } catch {}
    }

    // extensions 解析成 map
    const ext: Record<string, string[]> = {};
    for (const e of (match.extensions || [])) {
      for (const [k, v] of Object.entries(e)) {
        if (Array.isArray(v)) ext[k] = v as string[];
      }
    }

    // 营业时间：兼容 operating_hours（local_result）和 hours（place_result）
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const todayKey = days[new Date().getDay()];
    const opHours = match.operating_hours ?? {};
    const hoursArr: any[] = match.hours ?? [];
    const todayHours = opHours[todayKey]
      ?? hoursArr.find((h: any) => h[todayKey])?.[todayKey]
      ?? null;

    // open_state 解析
    const openState: string = match.open_state ?? "";
    const isOpenNow = openState.toLowerCase().includes("open now") || openState.toLowerCase().includes("closes");

    // 繁忙时段
    const liveHash = match.popular_times?.live_hash;
    const timeSpent = (liveHash?.time_spent ?? "").replace(/People typically spend /i, "").trim() || null;

    // 取评论
    let userReviews: { rating: number; snippet: string }[] = [];
    const inlineReviews = match.user_reviews?.most_relevant || [];
    userReviews = inlineReviews
      .filter((r: any) => r.rating >= 4 && r.snippet)
      .slice(0, 5)
      .map((r: any) => ({ rating: r.rating, snippet: r.snippet as string }));

    // 如果 inline 没有，单独请求 reviews API
    if (userReviews.length === 0 && match.data_id) {
      try {
        const rUrl = `https://serpapi.com/search?engine=google_maps_reviews&data_id=${match.data_id}&api_key=${SERPAPI_KEY}&hl=en&sort_by=ratingHigh`;
        const rData = await (await fetch(rUrl)).json() as any;
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
      hours_all: Object.entries(opHours).map(([d,t]) => `${d.slice(0,3)}: ${t}`).join('  ') || null,
      service_options: match.service_options ?? null,
      time_spent: timeSpent,
      highlights: ext['highlights'] ?? [],
      atmosphere: ext['atmosphere'] ?? [],
      offerings: ext['offerings'] ?? [],
      planning: ext['planning'] ?? [],
      payments: ext['payments'] ?? [],
      popular_for: ext['popular_for'] ?? [],
      user_reviews: userReviews,
    };
  } catch {
    return null;
  }
}

function buildHookTag(
  gmaps: ReturnType<typeof fetchGoogleMapsData> extends Promise<infer T> ? T : never,
  typeZh: string
): string {
  if (!gmaps) return "";
  const r = gmaps.rating ?? 0;
  const n = gmaps.reviews ?? 0;

  if (r >= 4.8 && n >= 1000) return `${typeZh}界排队王`;
  if (r >= 4.8 && n >= 500)  return `${typeZh}隐藏神店`;
  if (r >= 4.8 && n >= 100)  return `高分${typeZh}`;
  if (r >= 4.7 && n >= 2000) return `${typeZh}地标`;
  if (r >= 4.6 && n >= 1000) return `千人推荐${typeZh}`;
  if (r >= 4.6 && n >= 500)  return `${typeZh}口碑之选`;
  if (r >= 4.6 && n >= 200)  return `实力${typeZh}`;
  if (r >= 4.6 && n < 100)   return `新晋${typeZh}黑马`;
  if (r >= 4.5 && n < 50)    return `小众${typeZh}精选`;
  if (n >= 3000)              return `${typeZh}打卡地标`;
  if (n >= 1000)              return `${typeZh}热门之选`;
  if (r >= 4.4)               return `${typeZh}值得一试`;
  return typeZh;
}

function buildCaveats(gmaps: any): string[] {
  const caveats: string[] = [];
  // 仅堂食
  if (gmaps?.service_options?.takeout === false && gmaps?.service_options?.dine_in === true)
    caveats.push("僅限堂食");
  // 需预约
  const planning: string[] = gmaps?.planning ?? [];
  if (planning.some((p: string) => p.toLowerCase().includes("reservation")))
    caveats.push("建議提前訂座");
  // 停车
  const parking: string[] = gmaps?.parking ?? [];
  if (parking.some((p: string) => p.toLowerCase().includes("difficult")))
    caveats.push("附近泊車困難");
  // 平均逗留时间
  if (gmaps?.time_spent)
    caveats.push(`平均逗留 ${gmaps.time_spent}`);
  return caveats.slice(0, 3);
}

function buildSignatureItems(gmaps: any): string[] {
  const items: string[] = [];

  // highlights → 去掉 "Great " 前缀，翻译成中文
  const highlightZh: Record<string, string> = {
    'cocktails': '特色調酒', 'dessert': '招牌甜品', 'wine list': '精選酒單',
    'coffee': '精品咖啡', 'beer': '精釀啤酒', 'tea selection': '茶品精選',
    'food': '特色料理', 'atmosphere': '氛圍出色', 'service': '服務細緻',
  };
  for (const h of (gmaps?.highlights ?? [])) {
    const key = h.replace(/^Great /i, "").toLowerCase().trim();
    const zh = highlightZh[key] || h.replace(/^Great /i, "");
    if (!items.includes(zh)) items.push(zh);
    if (items.length >= 3) break;
  }

  // offerings 补充
  if (items.length < 3) {
    const offeringZh: Record<string, string> = {
      'Omakase': 'Omakase 套餐', 'Tasting menu': '廚師發辦', 'Small plates': '小食拼盤',
      'Private dining room': '私人包廂', 'Vegetarian options': '素食可選',
      'Natural wine': '天然葡萄酒', 'Craft beer': '精釀啤酒',
    };
    for (const o of (gmaps?.offerings ?? [])) {
      const zh = offeringZh[o];
      if (zh && !items.includes(zh)) {
        items.push(zh);
        if (items.length >= 3) break;
      }
    }
  }

  // 评论中提取菜名
  if (items.length < 3) {
    const allText = (gmaps?.user_reviews ?? []).map((r: any) => r.snippet || "").join(" ");
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

function buildWhyWorthIt(gmaps: any, typeZh: string): string {
  const parts: string[] = [];
  // Google 描述
  if (gmaps?.description) parts.push(gmaps.description);
  // 评分 + 评价数
  if (gmaps?.rating && gmaps?.reviews) {
    parts.push(`Google Maps ${gmaps.rating}分，${gmaps.reviews}條真實評價`);
  }
  // 氛围
  const atm: string[] = gmaps?.atmosphere ?? [];
  if (atm.length > 0) parts.push(`氛圍：${atm.join('、')}`);
  // popular_for
  const pf: string[] = gmaps?.popular_for ?? [];
  if (pf.length > 0) parts.push(`適合${pf.join('/')}`);
  return parts.join('。') || "";
}

function buildHours(gmaps: any): string | null {
  if (!gmaps) return null;
  const today = gmaps.hours_today;
  const state = gmaps.open_state;
  // open_state 格式如 "Closes soon · 10 PM · Opens 12 PM Fri" 或 "Closed · Opens 12 PM Fri"
  // 只取第一段（营业/关门状态），去掉后面重复的开门时间
  const stateShort = state ? state.split('·')[0].trim() : null;
  if (today && stateShort) return `今日 ${today}（${stateShort}）`;
  if (today) return `今日 ${today}`;
  if (stateShort) return stateShort;
  if (gmaps.hours_all) return gmaps.hours_all;
  return null;
}

function buildPaymentInfo(gmaps: any): { visa: boolean | null; cash: boolean; note: string | null } {
  const payments: string[] = gmaps?.payments ?? [];
  const hasCard = payments.some((p: string) => /credit|debit|visa/i.test(p));
  const hasNfc = payments.some((p: string) => /nfc|mobile/i.test(p));
  const note = hasNfc ? "支援 NFC 支付" : null;
  return {
    visa: hasCard ? true : null,
    cash: true, // 默认假设接受现金
    note,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google Maps + DeepSeek enrichment
  app.post("/api/dig", async (req, res) => {
    const { poi } = req.body;
    if (!poi) return res.status(400).json({ error: "poi is required" });

    const gmaps = await fetchGoogleMapsData(poi.name, poi.district ?? "");
    const typeZh = getTypeZh((gmaps?.type?.[0]) ?? null, poi.subcategory ?? "");

    // 用 DeepSeek 生成 hook_tag 和 why_worth_it
    let hook_tag = buildHookTag(gmaps, typeZh) || null;
    let why_worth_it = buildWhyWorthIt(gmaps, typeZh) || null;

    if (gmaps && DEEPSEEK_API_KEY) {
      const reviewText = (gmaps.user_reviews ?? []).map((r: any) => r.snippet).filter(Boolean).join("\n");
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
      signature_items:      buildSignatureItems(gmaps),
      caveats:              buildCaveats(gmaps),
      hours:                buildHours(gmaps),
      is_open_now:          gmaps?.is_open_now ?? null,
      payment:              buildPaymentInfo(gmaps),
      recommendation_count: gmaps?.reviews ?? null,
      price_range:          gmaps?.price ?? null,
      source_links: {
        google_maps: gmaps ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Hong Kong')}` : undefined,
      },
    });
  });

  // Pre-enriched POIs endpoint — serves Food Crawler output
  // This bypasses the slow real-time SerpApi + DeepSeek pipeline
  app.get("/api/pre-enriched", async (_req, res) => {
    try {
      const dataPath = path.join(__dirname, "src", "data", "dig-pois.json");
      if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, "utf-8");
        res.json(JSON.parse(raw));
      } else {
        res.json([]);
      }
    } catch {
      res.json([]);
    }
  });

  // API routes
  app.post("/api/osm", async (req, res) => {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const OVERPASS_INSTANCES = [
      "https://overpass-api.de/api/interpreter",
      "https://lz4.overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.osm.ch/api/interpreter",
      "https://overpass.nchc.org.tw/api/interpreter",
      "https://overpass.private.coffee/api/interpreter",
      "https://overpass.openstreetmap.fr/api/interpreter",
      "https://overpass.kappatheta.me/api/interpreter",
      "https://overpass.paws.fi/api/interpreter"
    ];

    // Shuffle instances to distribute load
    const shuffledInstances = [...OVERPASS_INSTANCES].sort(() => Math.random() - 0.5);

    for (const instanceUrl of shuffledInstances) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

          const response = await fetch(instanceUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Accept": "application/json",
              "User-Agent": "DigStreetExplorer/1.0"
            },
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn(`Overpass instance ${instanceUrl} failed with status ${response.status} (Attempt ${attempts}/${maxAttempts})`);
            if (response.status === 504 || response.status === 429 || response.status === 502 || response.status === 503) {
              // Wait a bit before retry for transient errors
              await new Promise(resolve => setTimeout(resolve, 1500 * attempts));
              continue;
            }
            break; // Don't retry for other errors (like 400)
          }

          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.warn(`Overpass instance ${instanceUrl} returned non-JSON content: ${contentType}`);
            break;
          }

          const text = await response.text();
          try {
            const data = JSON.parse(text);
            return res.json(data);
          } catch (parseError) {
            console.error(`Failed to parse JSON from ${instanceUrl}:`, text.substring(0, 100));
            break;
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.warn(`Overpass instance ${instanceUrl} timed out (Attempt ${attempts}/${maxAttempts})`);
            // Retry once for timeout
            continue;
          } else {
            console.error(`Error fetching from OSM instance ${instanceUrl}:`, error.message || error);
            // Retry once for connection errors too, as they might be transient
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
      }
    }

    res.status(502).json({ error: "All Overpass instances failed or timed out" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
