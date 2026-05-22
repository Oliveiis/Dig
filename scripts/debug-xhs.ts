import { chromium } from 'playwright-core';

async function main() {
  const cookies = [
    { name: 'web_session', value: '040069b111a6425787cbb48a3b384b9a317f07', domain: '.xiaohongshu.com', path: '/' },
    { name: 'webId', value: '31c62ade8d79878629764d7a28694a45', domain: '.xiaohongshu.com', path: '/' },
    { name: 'xsecappid', value: 'xhs-pc-web', domain: '.xiaohongshu.com', path: '/' },
    { name: 'gid', value: 'yjF0fSS8D6qyjSiJ4JYSUy6i0Wd4W8qh6DqM7KvVMVfvTq8Ah0JdS888yY2jyq8Ky2fq2j0', domain: '.xiaohongshu.com', path: '/' },
  ];

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();

  await page.goto('https://www.xiaohongshu.com/search_result?keyword=Yardbird+%E9%A6%99%E6%B8%AF', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  // 截图看实际渲染
  await page.screenshot({ path: '/tmp/xhs-debug.png', fullPage: false });

  // 打印所有笔记卡片的文字内容
  const data = await page.evaluate(() => {
    const results: any[] = [];
    // 尝试多种选择器
    const selectors = [
      'section.note-item',
      '[class*="note-item"]',
      '[class*="NoteItem"]',
      '.feeds-container > div',
      '[data-v-note]',
    ];
    for (const sel of selectors) {
      const cards = document.querySelectorAll(sel);
      if (cards.length > 0) {
        cards.forEach(c => results.push({ sel, text: c.textContent?.slice(0, 100) }));
        break;
      }
    }
    if (results.length === 0) {
      // 输出 body 的前 1000 字符帮助诊断
      results.push({ sel: 'body', text: document.body.innerText.slice(0, 1000) });
    }
    return results;
  });

  console.log(JSON.stringify(data.slice(0, 5), null, 2));
  console.log('截图已保存到 /tmp/xhs-debug.png');

  await browser.close();
}

main();
