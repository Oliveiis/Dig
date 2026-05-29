// Refined verification probe — narrow pill detection to map area only
import { chromium } from 'playwright-core';
import fs from 'fs';

const OUT = '/tmp/dig-verify2';
fs.mkdirSync(OUT, { recursive: true });

const consoleMessages = [];
const pageErrors = [];

function log(...a) { console.log('[probe2]', ...a); }

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

page.on('console', (m) => consoleMessages.push({ type: m.type(), text: m.text() }));
page.on('pageerror', (e) => pageErrors.push(e.message));

log('navigating…');
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(10000); // longer wait for POI enrichment

// Find pills INSIDE the pigeon-maps marker layer specifically (y > 140 = below chips)
const pillInfo = await page.evaluate(() => {
  // Pigeon Maps puts overlays inside a wrapper. Markers are usually positioned absolutely.
  const pigeon = document.querySelector('[class*="pigeon"]');
  if (!pigeon) return { error: 'no map' };
  const all = Array.from(pigeon.querySelectorAll('button, div, [class*="marker"], [class*="pill"]'));
  const pills = all.filter(el => {
    const txt = el.textContent?.trim() ?? '';
    if (!txt || txt.length > 40) return false;
    const r = el.getBoundingClientRect();
    // Must be in map body (below chips row at y~127)
    if (r.y < 140 || r.y > 720) return false;
    if (r.width < 30 || r.height < 12 || r.height > 60) return false;
    if (r.width > 250) return false;
    // Must contain Chinese text or look pill-shaped
    const cs = getComputedStyle(el);
    const br = cs.borderRadius;
    const hasRounded = /999|100|9999/.test(br) || parseInt(br) > 12;
    const hasZh = /[一-鿿]/.test(txt);
    return hasRounded && (hasZh || /^[A-Za-z]/.test(txt));
  }).slice(0, 30).map(el => {
    const r = el.getBoundingClientRect();
    return {
      text: el.textContent.trim().slice(0, 50),
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      borderRadius: getComputedStyle(el).borderRadius,
    };
  });
  return { count: pills.length, samples: pills };
});
log('pills inside map:', JSON.stringify(pillInfo, null, 2));

await page.screenshot({ path: `${OUT}/01-pills-found.png`, fullPage: false });

// Try clicking the first pill we found
let clickedPill = null;
let cardAfterClick = null;
if (pillInfo.samples && pillInfo.samples.length > 0) {
  const target = pillInfo.samples[0];
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  log(`clicking pill "${target.text}" at (${cx}, ${cy})`);
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/02-after-pill-click.png` });
  clickedPill = target.text;

  cardAfterClick = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('[class*="bubble"], [class*="card"], [class*="sheet"], [class*="modal"], [role="dialog"], [class*="FactCard"], [class*="Preview"]'));
    return candidates.map(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const visible = r.width > 50 && r.height > 30 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
      return visible ? {
        cls: (el.className?.toString?.() ?? '').slice(0, 100),
        text: (el.textContent ?? '').trim().slice(0, 200),
        x: Math.round(r.x), y: Math.round(r.y),
        w: Math.round(r.width), h: Math.round(r.height),
      } : null;
    }).filter(Boolean).slice(0, 6);
  });
  log('card/bubble after click:', JSON.stringify(cardAfterClick, null, 2));

  // Also look for any new visible elements with hook-text-like content
  const newVisibleAfter = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('div, section, article'));
    return all.filter(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const txt = el.textContent?.trim() ?? '';
      return r.width > 200 && r.height > 100 && r.y > 200 && r.y < 800 &&
             cs.visibility !== 'hidden' && cs.display !== 'none' &&
             txt.length > 30 && txt.length < 500 &&
             /[一-鿿]/.test(txt);
    }).slice(0, 5).map(el => ({
      tag: el.tagName,
      cls: (el.className?.toString?.() ?? '').slice(0, 100),
      text: el.textContent.trim().slice(0, 150),
      y: Math.round(el.getBoundingClientRect().y),
      h: Math.round(el.getBoundingClientRect().height),
    }));
  });
  log('any new card-shaped visible content:', JSON.stringify(newVisibleAfter, null, 2));
}

// close any open card
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(500);
await page.mouse.click(20, 200);
await page.waitForTimeout(1000);

// Probe pill→dot via zoom out
log('zooming out');
const mapBox = await page.evaluate(() => {
  const el = document.querySelector('[class*="pigeon"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
if (mapBox) {
  const cx = mapBox.x + mapBox.w / 2;
  const cy = mapBox.y + mapBox.h / 2;
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 500, { x: cx, y: cy }).catch(() => {});
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/03-zoomed-out.png` });

  const afterZoom = await page.evaluate(() => {
    const pigeon = document.querySelector('[class*="pigeon"]');
    if (!pigeon) return { pills: 0, dots: 0 };
    const all = Array.from(pigeon.querySelectorAll('button, div'));
    let pills = 0, dots = 0;
    all.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.y < 140 || r.y > 720) return;
      const txt = el.textContent?.trim() ?? '';
      const cs = getComputedStyle(el);
      const br = cs.borderRadius;
      const isRounded = /999|9999/.test(br) || parseInt(br) > 12;
      // pill: has text, longer than tall
      if (isRounded && txt.length > 0 && r.height >= 14 && r.height <= 50 && r.width > r.height * 1.2) pills++;
      // dot: tiny circular, no text or single-char
      if (isRounded && r.height >= 6 && r.height <= 18 && Math.abs(r.width - r.height) < 6 && txt.length <= 2) dots++;
    });
    return { pills, dots };
  });
  log(`after zoom-out — pills: ${afterZoom.pills}, dots: ${afterZoom.dots}`);
}

fs.writeFileSync(`${OUT}/result.json`, JSON.stringify({
  pillInfo, clickedPill, cardAfterClick,
  consoleErrors: consoleMessages.filter(m => m.type === 'error'),
  pageErrors,
}, null, 2));

await browser.close();
log('done');
