// Verification probe — drives a real browser at http://localhost:3000
// Captures screenshots and observations for SUCCESS CRITERIA 1-8.
import { chromium } from 'playwright-core';
import fs from 'fs';

const OUT = '/tmp/dig-verify';
fs.mkdirSync(OUT, { recursive: true });

const consoleMessages = [];
const pageErrors = [];
const networkFails = [];

function log(...a) { console.log('[probe]', ...a); }

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: false,
  args: ['--no-first-run', '--no-default-browser-check'],
});

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'zh-HK',
  geolocation: { latitude: 22.2819, longitude: 114.1577 }, // Central HK
  permissions: ['geolocation'],
});
const page = await context.newPage();

page.on('console', (m) => consoleMessages.push({ type: m.type(), text: m.text() }));
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('requestfailed', (r) => networkFails.push(`${r.method()} ${r.url()} -> ${r.failure()?.errorText}`));

log('navigating…');
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(8000); // let map tiles + POIs settle

await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: false });
log('saved 01-home.png');

// Probe 1+2: map rendered? pills present?
const mapInfo = await page.evaluate(() => {
  const root = document.getElementById('root');
  const tiles = document.querySelectorAll('img[src*="tile"], img[src*="basemap"], canvas');
  // Pigeon Maps wraps the map in a div with class containing 'pigeon'
  const pigeon = document.querySelector('[class*="pigeon"]');
  return {
    rootChildren: root?.children.length ?? 0,
    bodyText: document.body.innerText.slice(0, 300),
    mapPresent: !!pigeon,
    mapBox: pigeon ? (() => { const r = pigeon.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })() : null,
    tileCount: tiles.length,
  };
});
log('map info:', JSON.stringify(mapInfo, null, 2));

// Look for pill-shaped markers — they should have rounded-full / pill class and contain text
const pillInfo = await page.evaluate(() => {
  // Pills are usually buttons or divs with text inside the map container
  const all = Array.from(document.querySelectorAll('button, div'));
  const pills = all.filter(el => {
    const txt = el.textContent?.trim() ?? '';
    if (!txt || txt.length > 30) return false;
    const cls = el.className?.toString?.() ?? '';
    const r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 14 || r.height > 60) return false;
    // pill-like: rounded class, AND contains zh chars, AND inside map bbox-ish
    const hasRounded = /rounded-full|rounded-\[/.test(cls) || getComputedStyle(el).borderRadius.includes('px');
    const hasZh = /[一-鿿]/.test(txt);
    return hasRounded && hasZh && r.y < 700 && r.y > 50;
  }).slice(0, 20).map(el => {
    const r = el.getBoundingClientRect();
    return { text: el.textContent.trim().slice(0, 40), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
  return { count: pills.length, samples: pills };
});
log('pills found:', JSON.stringify(pillInfo, null, 2));

// Probe 4: bottom nav + category chips
const chromeInfo = await page.evaluate(() => {
  const allText = document.body.innerText;
  const buttons = Array.from(document.querySelectorAll('button'));
  const chipCandidates = buttons.filter(b => {
    const t = b.textContent?.trim() ?? '';
    return /^(全部|咖啡|餐廳|Bar|酒吧|餐厅)$/.test(t);
  }).map(b => b.textContent.trim());
  const navCandidates = buttons.filter(b => {
    const t = b.textContent?.trim() ?? '';
    return /(漫遊|搜索|日誌|漫游|日志|搜尋)/.test(t);
  }).map(b => b.textContent.trim());
  return {
    chips: chipCandidates,
    navTabs: navCandidates,
    hasZh: /[一-鿿]/.test(allText),
  };
});
log('chrome:', JSON.stringify(chromeInfo, null, 2));

// Probe 3: click a pill and look for FactCard / PreviewBubble
let clickedPill = null;
if (pillInfo.samples.length > 0) {
  const target = pillInfo.samples[0];
  log(`clicking pill "${target.text}" at (${target.x + target.w/2}, ${target.y + target.h/2})`);
  await page.mouse.click(target.x + target.w / 2, target.y + target.h / 2);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/02-pill-clicked.png` });
  log('saved 02-pill-clicked.png');
  clickedPill = target.text;

  const bubbleInfo = await page.evaluate(() => {
    // Look for any newly-visible card / bubble / sheet
    const candidates = Array.from(document.querySelectorAll('[class*="bubble"], [class*="card"], [class*="sheet"], [role="dialog"]'));
    return candidates.map(el => {
      const r = el.getBoundingClientRect();
      const visible = r.width > 50 && r.height > 30 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none';
      return visible ? {
        cls: el.className?.toString?.().slice(0, 80) ?? '',
        text: (el.textContent ?? '').trim().slice(0, 120),
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      } : null;
    }).filter(Boolean).slice(0, 8);
  });
  log('bubble/card on screen:', JSON.stringify(bubbleInfo, null, 2));
}

// Close any open card before zoom test (escape, click backdrop, or click elsewhere)
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(500);
await page.mouse.click(20, 200); // click empty map area
await page.waitForTimeout(1000);

// Probe 5: zoom out — pills should become dots
log('zooming out to test pill→dot transition');
const mapBox = mapInfo.mapBox;
if (mapBox) {
  const cx = mapBox.x + mapBox.w / 2;
  const cy = mapBox.y + mapBox.h / 2;
  // Pinch-out is hard; try keyboard "-" which pigeon-maps may not support, or click a zoom button
  // Most reliable: dispatch wheel event
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 400, { x: cx, y: cy }).catch(() => {});
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/03-zoomed-out.png` });
  log('saved 03-zoomed-out.png');

  const afterZoom = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('button, div'));
    let pills = 0, dots = 0;
    all.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 5 || r.height < 5) return;
      const txt = el.textContent?.trim() ?? '';
      const cls = el.className?.toString?.() ?? '';
      if (r.height >= 14 && r.height <= 50 && r.width > r.height * 1.5 && /[一-鿿]/.test(txt) && /rounded-full|rounded-\[/.test(cls)) pills++;
      if (r.height >= 6 && r.height <= 18 && Math.abs(r.width - r.height) < 4 && /rounded-full/.test(cls)) dots++;
    });
    return { pills, dots };
  });
  log('after zoom-out — pills:', afterZoom.pills, 'dots:', afterZoom.dots);
}

// Probe 6: switch to 搜索 tab
log('clicking 搜索 nav');
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => /搜索|搜尋/.test(b.textContent ?? ''));
  if (btn) btn.click();
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/04-search-tab.png` });
log('saved 04-search-tab.png');

const searchInfo = await page.evaluate(() => ({
  text: document.body.innerText.slice(0, 200),
  hasInput: !!document.querySelector('input[type="text"], input[type="search"], input[placeholder]'),
  inputPlaceholder: document.querySelector('input')?.getAttribute('placeholder') ?? null,
}));
log('search screen:', JSON.stringify(searchInfo));

// Probe 6 cont: switch to 日誌 tab
log('clicking 日誌 nav');
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => /日誌|日志/.test(b.textContent ?? ''));
  if (btn) btn.click();
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/05-journal-tab.png` });
log('saved 05-journal-tab.png');

const journalInfo = await page.evaluate(() => ({
  text: document.body.innerText.slice(0, 200),
}));
log('journal screen:', JSON.stringify(journalInfo));

// Back to 漫遊
log('returning to 漫遊');
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => /漫遊|漫游/.test(b.textContent ?? ''));
  if (btn) btn.click();
});
await page.waitForTimeout(1500);

// Probe 8: visual / theme info
const theme = await page.evaluate(() => {
  const body = getComputedStyle(document.body);
  const root = getComputedStyle(document.documentElement);
  return {
    bodyBg: body.backgroundColor,
    bodyColor: body.color,
    bodyFont: body.fontFamily,
    htmlFont: root.fontFamily,
  };
});
log('theme:', JSON.stringify(theme));

await page.screenshot({ path: `${OUT}/06-final-home.png` });

// Persist console errors
fs.writeFileSync(`${OUT}/console.json`, JSON.stringify({
  consoleMessages: consoleMessages.filter(m => m.type === 'error' || m.type === 'warning').slice(0, 30),
  pageErrors,
  networkFails: networkFails.slice(0, 30),
  totalConsole: consoleMessages.length,
}, null, 2));

log('TOTAL console:', consoleMessages.length, 'errors:', consoleMessages.filter(m => m.type === 'error').length, 'pageErrors:', pageErrors.length);
log('clicked pill text was:', clickedPill);

await browser.close();
log('done — output dir', OUT);
