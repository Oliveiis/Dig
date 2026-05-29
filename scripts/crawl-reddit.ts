/**
 * Reddit POI 爬虫
 * 公共 JSON API（无需登录），覆盖 r/HongKong / r/HKfood / r/asianeats / r/askhongkong。
 *
 * 用法：
 *   npx tsx scripts/crawl-reddit.ts                              # 跑 mock-pois.json
 *   npx tsx scripts/crawl-reddit.ts "Yardbird" "Cupping Room"    # 指定店名
 */

import { upsertRawNotes, slugForPOI } from './db.ts';
import fs from 'fs';
import path from 'path';

const SUBREDDITS = ['HongKong', 'HKfood', 'asianeats', 'askhongkong'];
const PER_SUB_LIMIT = 5;
const DELAY_MS = 1100;
const UA = 'dig-crawler/0.1 (Hong Kong POI research; contact via project README)';

interface RedditPost {
  subreddit: string;
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  url: string;
  created_utc: number;
}

async function searchSubreddit(sub: string, query: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&limit=${PER_SUB_LIMIT}&sort=relevance`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.status === 403 || res.status === 429) {
    throw new Error(`reddit_blocked_${res.status}`);
  }
  if (!res.ok) {
    console.warn(`     reddit r/${sub} → HTTP ${res.status}`);
    return [];
  }
  const json: any = await res.json();
  const children = json?.data?.children ?? [];
  return children
    .map((c: any) => c.data)
    .filter((d: any) => d && (d.score >= 2) && ((d.selftext?.length ?? 0) > 30 || (d.title?.length ?? 0) > 30))
    .map((d: any): RedditPost => ({
      subreddit: sub,
      title: d.title ?? '',
      selftext: (d.selftext ?? '').slice(0, 2000),
      score: d.score ?? 0,
      num_comments: d.num_comments ?? 0,
      url: `https://reddit.com${d.permalink}`,
      created_utc: d.created_utc ?? 0,
    }));
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const args = process.argv.slice(2);
  let targets: { id: string; name: string; district: string }[] = [];

  if (args.length > 0) {
    targets = args.map((name, i) => ({ id: `manual-${i}`, name, district: '' }));
  } else {
    const mockPath = path.join(process.cwd(), 'src/data/mock-pois.json');
    if (fs.existsSync(mockPath)) {
      const raw = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
      targets = raw.map((p: any) => ({ id: p.id, name: p.name, district: p.district ?? '' }));
    } else {
      console.error('找不到 POI 列表，请传入店名参数');
      process.exit(1);
    }
  }

  console.log(`\n🔍 Reddit 爬取 ${targets.length} 个 POI（${SUBREDDITS.length} 个 subreddit）...\n`);

  let blockedSeen = false;
  for (const poi of targets) {
    if (blockedSeen) break;
    const id = poi.id?.startsWith('manual-') || poi.id?.startsWith('osm-') || poi.id?.startsWith('dig-')
      ? poi.id
      : slugForPOI(poi.name, poi.district);

    const query = poi.district ? `"${poi.name}" ${poi.district}` : `"${poi.name}" Hong Kong`;
    console.log(`  🔎 ${query}`);

    const collected: RedditPost[] = [];
    for (const sub of SUBREDDITS) {
      try {
        const posts = await searchSubreddit(sub, query);
        if (posts.length > 0) console.log(`     r/${sub}: ${posts.length} 条`);
        collected.push(...posts);
      } catch (err: any) {
        if (String(err.message ?? err).startsWith('reddit_blocked')) {
          console.warn(`     ❌ Reddit 拒绝访问（${err.message}）。Reddit 2024 起 .json API 需要 OAuth。`);
          console.warn(`     ➡  方案：1) 注册 Reddit OAuth app 然后改用 snoowrap/PRAW；2) 跳过 Reddit，只用 xhs + OpenRice`);
          blockedSeen = true;
          break;
        }
        console.warn(`     r/${sub} 失败: ${err}`);
      }
      await sleep(DELAY_MS);
    }

    if (!blockedSeen) {
      upsertRawNotes(id, { name: poi.name, district: poi.district }, 'reddit', collected);
      console.log(`     ${collected.length > 0 ? '✅' : '⚠️ '} 总计 ${collected.length} 条 reddit 内容`);
    }
  }

  if (blockedSeen) {
    console.log('\n⚠️  Reddit 整体被封，本次未写入数据。');
    process.exit(2);
  }

  console.log('\n✅ 完成。raw notes 已写入 data/dig.db。运行 `npx tsx scripts/summarize.ts` 让 DeepSeek 生成 hook。');
}

main().catch(e => { console.error(e); process.exit(1); });
