import {
  callDeepSeek,
  fetchGoogleMapsData,
  getTypeZh,
  buildHookTag,
  buildWhyWorthIt,
  buildSignatureItems,
  buildCaveats,
  buildHours,
  buildPaymentInfo,
} from "./_lib/enrich";

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { poi } = req.body;
  if (!poi) return res.status(400).json({ error: "poi is required" });

  const gmaps = await fetchGoogleMapsData(poi.name, poi.district ?? "");
  const typeZh = getTypeZh((gmaps?.type?.[0]) ?? null, poi.subcategory ?? "");

  let hook_tag = buildHookTag(gmaps, typeZh) || null;
  let why_worth_it = buildWhyWorthIt(gmaps, typeZh) || null;

  if (gmaps && process.env.DEEPSEEK_API_KEY) {
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
    signature_items: buildSignatureItems(gmaps),
    caveats: buildCaveats(gmaps),
    hours: buildHours(gmaps),
    is_open_now: gmaps?.is_open_now ?? null,
    payment: buildPaymentInfo(gmaps),
    recommendation_count: gmaps?.reviews ?? null,
    price_range: gmaps?.price ?? null,
    source_links: {
      google_maps: gmaps ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.name + ' Hong Kong')}` : undefined,
    },
  });
}
