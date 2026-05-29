// Inspect actual DOM structure of map markers
import { chromium } from 'playwright-core';
import fs from 'fs';

const OUT = '/tmp/dig-verify3';
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

await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(12000);

// Dump the full structure: every element in the y>140 region that has Chinese text
const dump = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('*'));
  const results = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.y < 140 || r.y > 720) continue;
    if (r.width < 20 || r.width > 300) continue;
    if (r.height < 10 || r.height > 80) continue;
    const txt = (el.textContent ?? '').trim();
    if (!txt || txt.length > 60) continue;
    if (!/[一-鿿]/.test(txt)) continue;
    // Skip if it has children with the same text (we want the leaf)
    const childWithSameText = Array.from(el.children).find(c => (c.textContent ?? '').trim() === txt);
    if (childWithSameText) continue;
    const cs = getComputedStyle(el);
    results.push({
      tag: el.tagName,
      cls: (el.className?.toString?.() ?? '').slice(0, 200),
      text: txt.slice(0, 50),
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      br: cs.borderRadius,
      bg: cs.backgroundColor,
      pos: cs.position,
      parentTag: el.parentElement?.tagName,
      parentCls: (el.parentElement?.className?.toString?.() ?? '').slice(0, 100),
    });
    if (results.length >= 40) break;
  }
  return results;
});
console.log('elements with zh text in map region:');
console.log(JSON.stringify(dump, null, 2));

// Also: what's the actual pigeon-maps container structure?
const pigeonStructure = await page.evaluate(() => {
  const pigeon = document.querySelector('[class*="pigeon"]');
  if (!pigeon) return { error: 'no pigeon' };
  const r = pigeon.getBoundingClientRect();
  const directKids = Array.from(pigeon.children).map(c => ({
    tag: c.tagName,
    cls: (c.className?.toString?.() ?? '').slice(0, 100),
    childCount: c.children.length,
  }));
  return {
    bbox: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    cls: (pigeon.className?.toString?.() ?? '').slice(0, 100),
    directKids,
  };
});
console.log('\npigeon structure:');
console.log(JSON.stringify(pigeonStructure, null, 2));

await page.screenshot({ path: `${OUT}/dom-inspect.png` });

await browser.close();
