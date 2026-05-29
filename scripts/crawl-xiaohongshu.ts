/**
 * 小红书 POI 爬虫（真实 Chrome 浏览器版）
 * 会弹出真实 Chrome 窗口，使用你本地已登录的账号
 *
 * 用法：
 *   npx tsx scripts/crawl-xiaohongshu.ts                        # 爬 mock-pois.json 里的 POI
 *   npx tsx scripts/crawl-xiaohongshu.ts "店名1" "店名2" ...    # 指定店名
 */

import { chromium } from 'playwright-core';
import { upsertRawNotes, slugForPOI } from './db.ts';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME_PROFILE = `${process.env.HOME}/Library/Application Support/Google/Chrome`;
const DELAY_MS = 3000;

interface NoteResult {
  title: string;
  desc: string;
  likes: number;
}

async function searchNotes(keyword: string, page: any): Promise<NoteResult[]> {
  const url = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}&source=web_explore_feed`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 等待内容加载
  await page.waitForSelector('section.note-item, [class*="NoteItem"], .feeds-page-container', {
    timeout: 8000,
  }).catch(() => {});

  const notes = await page.evaluate(() => {
    const results: { title: string; desc: string; likes: number }[] = [];

    // 小红书笔记卡片选择器（多备一些防止改版）
    const selectors = [
      'section.note-item',
      '[class*="note-item"]',
      '[class*="NoteItem"]',
      '.feeds-page-container [class*="item"]',
    ];

    let cards: NodeListOf<Element> | null = null;
    for (const sel of selectors) {
      const found = document.querySelectorAll(sel);
      if (found.length > 0) { cards = found; break; }
    }

    if (!cards) return results;

    cards.forEach(card => {
      const titleEl = card.querySelector('[class*="title"], a[class*="title"]');
      const descEl = card.querySelector('[class*="desc"], a[class*="desc"]');
      const likeEl = card.querySelector('[class*="like"] span, [class*="likes"] span, [class*="count"]');
      const title = titleEl?.textContent?.trim() ?? '';
      const desc = descEl?.textContent?.trim() ?? '';
      const likes = parseInt((likeEl?.textContent ?? '0').replace(/[^\d]/g, '')) || 0;
      if (title || desc) results.push({ title, desc, likes });
    });

    return results;
  });

  return notes;
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

  console.log(`\n🔍 开始爬取 ${targets.length} 个 POI（真实 Chrome 模式）...`);
  console.log('⚠️  Chrome 窗口将弹出，请不要手动关闭它\n');

  const browser = await chromium.launchPersistentContext(CHROME_PROFILE, {
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--no-first-run', '--no-default-browser-check'],
    channel: undefined,
  });

  const page = await browser.newPage();

  // 先访问主页确认登录态
  await page.goto('https://www.xiaohongshu.com', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const isLoggedIn = await page.evaluate(() => {
    return !document.body.innerText.includes('登录') || document.body.innerText.includes('通知');
  });

  if (!isLoggedIn) {
    console.log('⚠️  检测到未登录，请在弹出的 Chrome 窗口中手动登录小红书，登录后按回车继续...');
    await new Promise(r => process.stdin.once('data', r));
  } else {
    console.log('✅ 已登录小红书\n');
  }

  for (const poi of targets) {
    const id = poi.id?.startsWith('manual-') || poi.id?.startsWith('osm-') || poi.id?.startsWith('dig-')
      ? poi.id
      : slugForPOI(poi.name, poi.district);

    const keyword = poi.district ? `${poi.name} ${poi.district} 香港` : `${poi.name} 香港`;
    console.log(`  🔎 ${keyword}`);

    try {
      const notes = await searchNotes(keyword, page);
      upsertRawNotes(id, { name: poi.name, district: poi.district }, 'xhs', notes);

      const status = notes.length > 0 ? `✅ ${notes.length} 篇` : '⚠️  无结果';
      console.log(`     ${status}`);
    } catch (err) {
      console.warn(`     ❌ 失败: ${err}`);
    }

    await sleep(DELAY_MS);
  }

  await browser.close();
  console.log('\n✅ 完成。raw notes 已写入 data/dig.db。运行 `npx tsx scripts/summarize.ts` 让 DeepSeek 生成 hook。');
}

main();
