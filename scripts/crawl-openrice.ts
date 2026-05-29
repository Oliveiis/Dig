/**
 * OpenRice POI 爬虫（Playwright，无需登录）
 * OpenRice HK 是繁体中文 / 粤语本地视角，刚好补足 xhs 的大陆游客视角。
 *
 * 用法：
 *   npx tsx scripts/crawl-openrice.ts                              # 跑 mock-pois.json
 *   npx tsx scripts/crawl-openrice.ts "Yardbird" "Cupping Room"    # 指定店名
 */

import { chromium } from 'playwright-core';
import { upsertRawNotes, slugForPOI } from './db.ts';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DELAY_MS = 2500;
const MAX_REVIEWS_PER_POI = 8;

interface OpenRiceReview {
  title: string;
  body: string;
  rating: string;
  author: string;
  date: string;
}

async function searchAndExtract(keyword: string, page: any): Promise<{ poiUrl: string | null; reviews: OpenRiceReview[] }> {
  const searchUrl = `https://www.openrice.com/zh/hongkong/restaurants?what=${encodeURIComponent(keyword)}`;
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  const poiUrl = await page.evaluate(() => {
    const card = document.querySelector('a[href*="/zh/hongkong/r-"]') as HTMLAnchorElement | null;
    return card?.href ?? null;
  });

  if (!poiUrl) return { poiUrl: null, reviews: [] };

  await page.goto(poiUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const reviews = await page.evaluate((max: number) => {
    const out: { title: string; body: string; rating: string; author: string; date: string }[] = [];
    const blocks = document.querySelectorAll('section.sr2-review-container, [class*="review-content"], [class*="ReviewItem"]');
    const list = blocks.length > 0 ? blocks : document.querySelectorAll('[class*="review"]');
    list.forEach((el) => {
      if (out.length >= max) return;
      const titleEl = el.querySelector('[class*="review-title"], [class*="title"]');
      const bodyEl = el.querySelector('[class*="review-body"], [class*="body"], [class*="content"]');
      const ratingEl = el.querySelector('[class*="rating"], [class*="score"]');
      const authorEl = el.querySelector('[class*="author"], [class*="user-name"]');
      const dateEl = el.querySelector('[class*="date"], time');
      const title = (titleEl?.textContent ?? '').trim();
      const body = (bodyEl?.textContent ?? '').trim().slice(0, 1500);
      if (!title && body.length < 30) return;
      out.push({
        title,
        body,
        rating: (ratingEl?.textContent ?? '').trim(),
        author: (authorEl?.textContent ?? '').trim(),
        date: (dateEl?.textContent ?? '').trim(),
      });
    });
    return out;
  }, MAX_REVIEWS_PER_POI);

  return { poiUrl, reviews };
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

  console.log(`\n🔍 OpenRice 爬取 ${targets.length} 个 POI...\n`);

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--no-first-run', '--no-default-browser-check'],
  });
  const context = await browser.newContext({
    locale: 'zh-HK',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let captchaSeen = false;
  for (const poi of targets) {
    if (captchaSeen) break;
    const id = poi.id?.startsWith('manual-') || poi.id?.startsWith('osm-') || poi.id?.startsWith('dig-')
      ? poi.id
      : slugForPOI(poi.name, poi.district);

    const keyword = poi.district ? `${poi.name} ${poi.district}` : poi.name;
    console.log(`  🔎 ${keyword}`);

    try {
      const { poiUrl, reviews } = await searchAndExtract(keyword, page);

      const blocked = await page.evaluate(() => /captcha|verify you are human|cf-challenge/i.test(document.body.innerText)).catch(() => false);
      if (blocked) {
        console.warn(`     ❌ OpenRice 触发 CAPTCHA，停止本次爬取（人工解决后重跑）`);
        captchaSeen = true;
        break;
      }

      if (!poiUrl) {
        console.log(`     ⚠️  未找到匹配店铺`);
        upsertRawNotes(id, { name: poi.name, district: poi.district }, 'openrice', []);
      } else {
        upsertRawNotes(id, { name: poi.name, district: poi.district }, 'openrice', reviews);
        console.log(`     ${reviews.length > 0 ? '✅' : '⚠️ '} ${reviews.length} 条评论 (${poiUrl})`);
      }
    } catch (err) {
      console.warn(`     ❌ 失败: ${err}`);
    }

    await sleep(DELAY_MS);
  }

  await browser.close();

  if (captchaSeen) {
    console.log('\n⚠️  OpenRice 中途被 CAPTCHA 拦截，已停止。');
    process.exit(2);
  }

  console.log('\n✅ 完成。raw notes 已写入 data/dig.db。运行 `npx tsx scripts/summarize.ts` 让 DeepSeek 生成 hook。');
}

main().catch(e => { console.error(e); process.exit(1); });
