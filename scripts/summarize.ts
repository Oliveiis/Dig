/**
 * DeepSeek 离线总结脚本
 * 把已爬取的 raw notes（xhs / openrice / reddit）喂给 DeepSeek，生成繁体中文 hook + 详情。
 *
 * 用法：
 *   npx tsx scripts/summarize.ts                 # 总结所有 pending 行
 *   npx tsx scripts/summarize.ts --force         # 重新总结所有有 raw 数据的行（忽略 status）
 */

import { config } from 'dotenv';
config();

import { listPendingForSummary, updateSummary, markNoData, getDB } from './db.ts';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const CONCURRENCY = 4;
const MODEL = 'deepseek-chat';

async function callDeepSeek(prompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY missing');
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`deepseek ${res.status}`);
  const data: any = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

interface ParsedSummary {
  hook_tag: string;
  why_worth_it: string;
  signature_items: string[];
  caveats: string[];
}

function safeParseRaw(s: string | null): any[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

function buildPrompt(name: string, district: string, xhs: any[], reddit: any[], openrice: any[]): string {
  const xhsText = xhs.slice(0, 12).map((n: any) =>
    `· ${n.title ?? ''} | ${(n.desc ?? '').slice(0, 200)}`).join('\n').slice(0, 1500) || '（无）';
  const redditText = reddit.slice(0, 8).map((p: any) =>
    `· [r/${p.subreddit}] ${p.title} (${p.score}↑) | ${(p.selftext ?? '').slice(0, 200)}`).join('\n').slice(0, 1500) || '（无）';
  const openriceText = openrice.slice(0, 8).map((r: any) =>
    `· ${r.rating ?? ''} | ${r.title ?? ''} | ${(r.body ?? '').slice(0, 250)}`).join('\n').slice(0, 1500) || '（无）';

  return `你是香港街头探索指南"dig"的文案编辑，要根据真实社区评论给一家店写吸引人的发现卡片。

店名：${name}
地区：${district || '香港'}

【小红书笔记】
${xhsText}

【Reddit 讨论】
${redditText}

【OpenRice 评论】
${openriceText}

请基于以上真实评论提炼，输出 JSON（**只输出 JSON，不要任何解释或 markdown 围栏**）：
{
  "hook_tag": "4-8个繁体中文字的吸引标签，要有具体亮点，例如'亞洲50最佳調酒'、'米其林推介叉燒'、'排隊兩小時的港式茶餐廳'。禁止'好评如潮'、'值得一試'這種空洞词。如评论资料明显不足以提炼具体亮点，输出'資料不足'",
  "why_worth_it": "2-3句繁体中文，说明为什么值得专程来，要有具体细节（评分/特色/氛围/明星菜），让人看完就想去。资料不足时输出空字符串",
  "signature_items": ["招牌菜 1", "招牌菜 2", "招牌菜 3"],
  "caveats": ["要注意的點 1（例如要排隊／訂位／價格高）", "要注意的點 2"]
}

约束：
- signature_items 最多 3 个，必须是评论里反复出现的具体菜名/饮品名，不是空话
- caveats 最多 2 个，是要预先知道的实际问题（不是缺点列表）
- 全部用繁体中文`;
}

function parseLLMOutput(raw: string): ParsedSummary | null {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    const j = JSON.parse(cleaned);
    if (typeof j.hook_tag !== 'string') return null;
    return {
      hook_tag: j.hook_tag,
      why_worth_it: typeof j.why_worth_it === 'string' ? j.why_worth_it : '',
      signature_items: Array.isArray(j.signature_items) ? j.signature_items.slice(0, 3).map(String) : [],
      caveats: Array.isArray(j.caveats) ? j.caveats.slice(0, 2).map(String) : [],
    };
  } catch { return null; }
}

async function processOne(row: any): Promise<{ ok: boolean; msg: string }> {
  const xhs = safeParseRaw(row.raw_xhs_notes);
  const reddit = safeParseRaw(row.raw_reddit_posts);
  const openrice = safeParseRaw(row.raw_openrice);

  if (xhs.length === 0 && reddit.length === 0 && openrice.length === 0) {
    markNoData(row.poi_id);
    return { ok: false, msg: 'no raw data' };
  }

  const prompt = buildPrompt(row.name, row.district ?? '', xhs, reddit, openrice);
  let aiText = '';
  try {
    aiText = await callDeepSeek(prompt);
  } catch (e: any) {
    return { ok: false, msg: `deepseek error: ${e.message ?? e}` };
  }

  const parsed = parseLLMOutput(aiText);
  if (!parsed || !parsed.hook_tag || parsed.hook_tag === '資料不足') {
    markNoData(row.poi_id);
    return { ok: false, msg: 'insufficient signal' };
  }

  const mentionCount = xhs.length + reddit.length + openrice.length;

  updateSummary(row.poi_id, {
    hook_tag: parsed.hook_tag,
    why_worth_it: parsed.why_worth_it,
    signature_items: parsed.signature_items,
    caveats: parsed.caveats,
    mention_count: mentionCount,
    recommendation_count: null,
    model: MODEL,
  });

  return { ok: true, msg: parsed.hook_tag };
}

async function runPool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let idx = 0;
  const workers = Array.from({ length: n }, async () => {
    while (idx < items.length) {
      const my = idx++;
      out[my] = await fn(items[my]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  if (!DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY 未设置');
    process.exit(1);
  }

  const force = process.argv.includes('--force');
  let rows: any[];
  if (force) {
    const db = getDB();
    rows = db.prepare(`
      SELECT poi_id, name, district, raw_xhs_notes, raw_reddit_posts, raw_openrice
      FROM poi_enrichments
      WHERE (raw_xhs_notes IS NOT NULL AND raw_xhs_notes != '[]')
         OR (raw_reddit_posts IS NOT NULL AND raw_reddit_posts != '[]')
         OR (raw_openrice IS NOT NULL AND raw_openrice != '[]')
    `).all() as any[];
  } else {
    rows = listPendingForSummary();
  }

  if (rows.length === 0) {
    console.log('✅ 无待总结的行');
    return;
  }

  console.log(`\n🤖 DeepSeek 总结 ${rows.length} 个 POI（concurrency=${CONCURRENCY}）...\n`);

  let done = 0;
  const results = await runPool(rows, CONCURRENCY, async (row) => {
    const r = await processOne(row);
    done++;
    const tag = r.ok ? `✅ ${r.msg}` : `⚠️  ${r.msg}`;
    console.log(`  [${done}/${rows.length}] ${row.name}${row.district ? '（' + row.district + '）' : ''} → ${tag}`);
    return r;
  });

  const okCount = results.filter(r => r.ok).length;
  console.log(`\n✅ 完成：${okCount}/${rows.length} 成功`);
}

main().catch(e => { console.error(e); process.exit(1); });
