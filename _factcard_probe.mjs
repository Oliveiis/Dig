import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'fs';

mkdirSync('/tmp/dig-factcard', { recursive: true });

const cache = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1223/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;
const exec = existsSync(cache) ? cache : undefined;

const browser = await chromium.launch({ executablePath: exec, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  geolocation: { latitude: 22.2841, longitude: 114.1292 },
  permissions: ['geolocation'],
  locale: 'zh-HK',
});
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('[browser-err]', m.text()); });

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3500);

// Find a pill on the map and click it
const pills = page.locator('.pigeon-overlays > div');
const n = await pills.count();
console.log('pills on map:', n);
if (n === 0) {
  console.log('no pills, screenshotting then bail');
  await page.screenshot({ path: '/tmp/dig-factcard/00-no-pills.png' });
  process.exit(0);
}

// Click on the first one with text
let clicked = false;
for (let i = 0; i < n; i++) {
  const el = pills.nth(i);
  const txt = (await el.innerText().catch(() => '')).trim();
  if (txt.length > 0) {
    const box = await el.boundingBox();
    console.log('clicking pill #', i, 'text=', txt.slice(0, 30), 'box=', box);
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      clicked = true;
      break;
    }
  }
}
if (!clicked) {
  console.log('no clickable pill, bail');
  process.exit(0);
}
await page.waitForTimeout(1200);

// Screenshot 1: FactCard open
await page.screenshot({ path: '/tmp/dig-factcard/01-factcard-open.png' });

// Measure 打個點 button position vs bottom nav
const btn = page.locator('text=/打個點/').first();
const btnVisible = await btn.isVisible().catch(() => false);
console.log('打個點 button visible:', btnVisible);
if (btnVisible) {
  const box = await btn.boundingBox();
  console.log('打個點 box:', box);
}

const nav = page.locator('nav').first();
const navVisible = await nav.isVisible().catch(() => false);
const navBox = navVisible ? await nav.boundingBox() : null;
console.log('bottom nav visible:', navVisible, 'box:', navBox);

// Compute overlap
if (btnVisible && navBox) {
  const btnBox = await btn.boundingBox();
  const overlap = btnBox.y + btnBox.height > navBox.y;
  console.log('OVERLAP detected:', overlap, '(btn ends at', btnBox.y + btnBox.height, ', nav starts at', navBox.y, ')');
}

// Now click 打個點
if (btnVisible) {
  await btn.click({ force: true });
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/dig-factcard/02-checkin-opened.png' });

  // Is the QuickCheckin modal visible?
  const modal = page.locator('text=/名不虛傳|值得再來|一般般|踩雷了/').first();
  const modalVisible = await modal.isVisible().catch(() => false);
  console.log('checkin modal visible after click 打個點:', modalVisible);
  if (modalVisible) {
    const mBox = await modal.boundingBox();
    console.log('checkin modal first option box:', mBox);
  }

  // Is the FactCard still visible underneath?
  const factCard = page.locator('text=/為什麼值得去|招牌品|營業時間/').first();
  console.log('factCard signal still in DOM:', await factCard.count());
}

await browser.close();
console.log('done');
