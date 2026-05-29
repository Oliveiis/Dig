import { chromium } from 'playwright-core';
import { existsSync } from 'fs';

const cache = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1223/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;
const exec = existsSync(cache) ? cache : undefined;

const browser = await chromium.launch({ executablePath: exec, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },           // iPhone-ish (mobile-first)
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  geolocation: { latitude: 22.2841, longitude: 114.1292 },   // 西營盤 (per spec fallback)
  permissions: ['geolocation'],
  locale: 'zh-HK',
});
const page = await ctx.newPage();

const consoleLogs = [];
const pageErrors = [];
page.on('console', m => consoleLogs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => pageErrors.push(`${e.message}`));
page.on('requestfailed', r => consoleLogs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));

console.log('--- Step 1: load home ---');
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/dig-verify/01-home.png', fullPage: false });

const title = await page.title();
console.log('title:', title);

// Check rendered DOM
const bodyText = (await page.locator('body').innerText()).slice(0, 400);
console.log('body text preview:', bodyText.replace(/\n/g,' | '));

// Check for major elements
const headerVisible = await page.locator('text=/dig/i').first().isVisible().catch(() => false);
console.log('header dig visible:', headerVisible);

// Check for category chips (全部/咖啡/餐廳/Bar)
const chipsAll = await page.locator('text=/全部/').count();
const chipsCafe = await page.locator('text=/咖啡/').count();
const chipsRest = await page.locator('text=/餐廳|餐厅/').count();
const chipsBar = await page.locator('text=/Bar|酒吧/i').count();
console.log('chips counts: 全部=', chipsAll, '咖啡=', chipsCafe, '餐廳=', chipsRest, 'Bar=', chipsBar);

// Bottom nav (漫遊 / 搜索 / 日誌)
const navWander = await page.locator('text=/漫遊|漫游/').count();
const navSearch = await page.locator('text=/搜索/').count();
const navJournal = await page.locator('text=/日誌|日志/').count();
console.log('bottom nav: 漫遊=', navWander, '搜索=', navSearch, '日誌=', navJournal);

// Map tiles
const mapTiles = await page.locator('img[src*="cartodb"], img[src*="basemaps"], canvas').count();
console.log('map tile/canvas elements:', mapTiles);

// Hook tags exist?
const hookTags = ['亞洲50最佳', '米其林', '叉燒', '燕麥拿鐵', '咖啡圈', '站立切肉', '1860'];
for (const t of hookTags) {
  const c = await page.locator(`text=/${t}/`).count();
  console.log(`hook_tag "${t}":`, c);
}

console.log('\n--- Step 2: count pill markers in viewport ---');
const pillSelector = '[class*="pill"], div:has(> span)';   // best effort
// More robust: PillMarker uses inline styles; look for elements with hook_tag text and rounded-full
const allPills = await page.locator('div[style*="border-radius: 999"], div[style*="borderRadius: 999"], div[class*="rounded-full"]').count();
console.log('rounded-full / pill-shape elements (rough):', allPills);

await page.screenshot({ path: '/tmp/dig-verify/02-after-wait.png', fullPage: false });

console.log('\n--- Step 3: tap a pill marker if visible ---');
// Try known POI names
const poiNames = ['My Little Cup', 'Cupping Room', 'Lawry', 'Ho Lee Fook', '太平館', 'Old Man'];
let tapped = null;
for (const n of poiNames) {
  const loc = page.locator(`text=/${n}/`).first();
  if (await loc.count() > 0 && await loc.isVisible().catch(()=>false)) {
    console.log('found POI text on screen:', n);
    tapped = n;
    await loc.click({ force: true }).catch(e => console.log('click fail:', e.message));
    break;
  }
}
// Fallback: click any pill-ish element
if (!tapped) {
  const candidates = page.locator('div[style*="border-radius: 999"]');
  const c = await candidates.count();
  console.log('fallback: found', c, 'pill candidates');
  if (c > 0) {
    await candidates.first().click({ force: true }).catch(e => console.log('fallback click fail:', e.message));
    tapped = '(fallback first pill)';
  }
}
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/dig-verify/03-after-tap.png', fullPage: false });
console.log('tapped:', tapped);

// FactCard / BottomSheet present?
const sheetText = await page.locator('text=/查看詳情|查看详情|招牌品|為什麼值得|为什么值得|伴手禮|伴手礼|營業時間|营业时间/').count();
console.log('FactCard signal text count:', sheetText);

console.log('\n--- Step 4: switch to 搜索 tab ---');
const searchTab = page.locator('text=/搜索/').first();
if (await searchTab.count() > 0) {
  await searchTab.click({ force: true }).catch(()=>{});
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/dig-verify/04-search.png', fullPage: false });
  const t = (await page.locator('body').innerText()).slice(0,300);
  console.log('search tab body:', t.replace(/\n/g,' | '));
}

console.log('\n--- Step 5: switch to 日誌 tab ---');
const journalTab = page.locator('text=/日誌|日志/').first();
if (await journalTab.count() > 0) {
  await journalTab.click({ force: true }).catch(()=>{});
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/dig-verify/05-journal.png', fullPage: false });
  const t = (await page.locator('body').innerText()).slice(0,300);
  console.log('journal tab body:', t.replace(/\n/g,' | '));
}

console.log('\n--- Step 6: back to 漫遊 and zoom out ---');
const wanderTab = page.locator('text=/漫遊|漫游/').first();
if (await wanderTab.count() > 0) {
  await wanderTab.click({ force: true }).catch(()=>{});
  await page.waitForTimeout(800);
}
// Pigeon-maps zoom: scroll wheel on map
await page.mouse.move(195, 400);
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(120);
}
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/dig-verify/06-zoomed-out.png', fullPage: false });

console.log('\n=== console logs (tail 40) ===');
console.log(consoleLogs.slice(-40).join('\n'));
console.log('\n=== page errors ===');
console.log(pageErrors.join('\n') || '(none)');

await browser.close();
