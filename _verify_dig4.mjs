// Final probe — click pills correctly using the actual DOM pattern
import { chromium } from 'playwright-core';
import fs from 'fs';

const OUT = '/tmp/dig-verify4';
fs.mkdirSync(OUT, { recursive: true });

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
  geolocation: { latitude: 22.2819, longitude: 114.1577 },
  permissions: ['geolocation'],
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(12000);

// Take baseline before any interaction (close FactCard if pre-opened)
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/01-home-baseline.png` });

// Find pills via the correct selector: divs with rounded-full + cursor-pointer in map area
const pills = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('div'));
  return all.filter(el => {
    const cls = (el.className?.toString?.() ?? '');
    if (!/rounded-full/.test(cls) || !/cursor-pointer/.test(cls)) return false;
    const r = el.getBoundingClientRect();
    if (r.y < 140 || r.y > 720) return false;
    if (r.width < 30 || r.width > 250) return false;
    if (r.height < 14 || r.height > 50) return false;
    const txt = (el.textContent ?? '').trim();
    if (!txt || txt.length > 30) return false;
    if (!/[一-鿿A-Za-z]/.test(txt)) return false;
    return true;
  }).slice(0, 25).map(el => {
    const r = el.getBoundingClientRect();
    return { text: el.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  });
});
console.log(`Found ${pills.length} pills:`);
pills.slice(0, 10).forEach(p => console.log(`  "${p.text}" at (${p.x+Math.round(p.w/2)},${p.y+Math.round(p.h/2)}) ${p.w}x${p.h}`));

// Click first pill
let factCardOpened = false;
let factCardSnapshot = null;
let factCardScreenshot = null;
if (pills.length > 0) {
  const target = pills[0];
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  console.log(`\nClicking pill "${target.text}" at (${cx},${cy})`);
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/02-after-pill-click.png` });
  factCardScreenshot = `${OUT}/02-after-pill-click.png`;

  factCardSnapshot = await page.evaluate(() => {
    // Look for the panel that contains 招牌品 OR 為什麼值得去 OR hook tags pattern
    const all = Array.from(document.querySelectorAll('div, section, article, aside'));
    const candidates = all.filter(el => {
      const txt = el.textContent ?? '';
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 200 && r.height > 100 &&
             (txt.includes('招牌品') || txt.includes('為什麼值得去') || txt.includes('營業時間')) &&
             cs.visibility !== 'hidden' && cs.display !== 'none';
    });
    if (candidates.length === 0) return null;
    // Take the smallest one (most specific container)
    candidates.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return (ra.width * ra.height) - (rb.width * rb.height);
    });
    const el = candidates[0];
    const r = el.getBoundingClientRect();
    return {
      cls: (el.className?.toString?.() ?? '').slice(0, 120),
      text: el.textContent.trim().slice(0, 250),
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
    };
  });
  factCardOpened = !!factCardSnapshot;
  console.log(`FactCard opened: ${factCardOpened}`);
  if (factCardSnapshot) {
    console.log('FactCard snapshot:', JSON.stringify(factCardSnapshot, null, 2));
  }
}

// Close card and zoom out test
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(800);
await page.mouse.click(20, 200);
await page.waitForTimeout(800);

const beforeZoom = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('div'));
  let pillCount = 0;
  for (const el of all) {
    const cls = (el.className?.toString?.() ?? '');
    if (!/rounded-full/.test(cls) || !/cursor-pointer/.test(cls)) continue;
    const r = el.getBoundingClientRect();
    if (r.y < 140 || r.y > 720) continue;
    if (r.width < 30 || r.width > 250) continue;
    if (r.height < 14 || r.height > 50) continue;
    const txt = (el.textContent ?? '').trim();
    if (txt && txt.length <= 30 && /[一-鿿A-Za-z]/.test(txt)) pillCount++;
  }
  return pillCount;
});
console.log(`\nBefore zoom-out: ${beforeZoom} pills`);

// Zoom out 6x via wheel
const mapBox = await page.evaluate(() => {
  const el = document.querySelector('[class*="pigeon"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (mapBox) {
  const cx = mapBox.x + mapBox.w / 2;
  const cy = mapBox.y + mapBox.h / 2;
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 600, { x: cx, y: cy }).catch(() => {});
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/03-zoomed-out.png` });

  const afterZoom = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div'));
    let pillCount = 0, dotCount = 0;
    for (const el of all) {
      const cls = (el.className?.toString?.() ?? '');
      if (!/rounded-full/.test(cls)) continue;
      const r = el.getBoundingClientRect();
      if (r.y < 140 || r.y > 720) continue;
      const txt = (el.textContent ?? '').trim();
      // pill: has zh text, height 14-50, width > height*1.2
      if (/cursor-pointer/.test(cls) && txt && txt.length <= 30 && /[一-鿿A-Za-z]/.test(txt) &&
          r.height >= 14 && r.height <= 50 && r.width > r.height * 1.2) {
        pillCount++;
      }
      // dot: tiny circular, no/short text
      if (r.height >= 4 && r.height <= 18 && Math.abs(r.width - r.height) < 6 && txt.length <= 2) {
        dotCount++;
      }
    }
    return { pills: pillCount, dots: dotCount };
  });
  console.log(`After zoom-out: pills=${afterZoom.pills}, dots=${afterZoom.dots}`);
}

// Tab switching test
console.log('\n--- Tab switch tests ---');
await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => /搜索|搜尋/.test(b.textContent ?? ''));
  if (btn) btn.click();
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/04-search-tab.png` });
const searchInfo = await page.evaluate(() => ({
  text: document.body.innerText.slice(0, 150),
  hasInput: !!document.querySelector('input'),
  placeholder: document.querySelector('input')?.getAttribute('placeholder') ?? null,
}));
console.log('搜索 tab:', JSON.stringify(searchInfo));

await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('button')).find(b => /日誌|日志/.test(b.textContent ?? ''));
  if (btn) btn.click();
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/05-journal-tab.png` });
const journalInfo = await page.evaluate(() => ({
  text: document.body.innerText.slice(0, 150),
}));
console.log('日誌 tab:', JSON.stringify(journalInfo));

// Theme info
const theme = await page.evaluate(() => {
  const body = getComputedStyle(document.body);
  return {
    bodyBg: body.backgroundColor,
    bodyColor: body.color,
    bodyFont: body.fontFamily,
  };
});
console.log('\nTheme:', JSON.stringify(theme));

console.log(`\nConsole errors total: ${consoleErrors.length}`);
console.log(`Page errors: ${errors.length}`);

fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({
  pills: pills.length,
  pillSamples: pills.slice(0, 5),
  factCardOpened,
  factCardSnapshot,
  beforeZoom,
  consoleErrors: consoleErrors.slice(0, 10),
  pageErrors: errors,
  theme,
}, null, 2));

await browser.close();
console.log('done');
