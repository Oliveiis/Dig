<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Dig

[English](./README.md) | [简体中文](./README.zh-CN.md)

**街头探索者的决策工具——获取附近店铺的结构化事实，3 秒决定要不要走进去。**

🌐 **在线体验**: https://ai.studio/apps/da74fa5a-3561-4996-a330-f3f426169bc1

移动优先的 Web 应用，把周围店铺变成一目了然的结构化事实（支付方式、招牌菜、注意事项），让你当场拍板。基于 OpenStreetMap + Google Maps 的实时 POI 发现，配合多源美食爬虫做数据富化。

## 功能

- **街区探索**——基于地理位置的实时 POI 发现
- **结构化事实**——一目了然：支付方式、招牌菜、注意事项
- **书签与日志**——保存和重访去过的店
- **漫游 / 搜索**——专为浏览和查找设计的页面
- **快速打卡与临近提醒**——轻量记录和附近提示
- **CORS 安全的 OSM 代理**——服务端抓取，多实例 fallback、洗牌、504/429 指数退避重试

## 技术栈

- **前端**:React 19、Vite 6、Tailwind CSS 4、Zustand、Framer Motion、React Router
- **后端**:Express + Vite 中间件(`tsx server.ts`)
- **地图**:Google Maps(`@vis.gl/react-google-maps`)、OpenStreetMap(经代理)
- **数据**:Firestore、better-sqlite3
- **AI / 富化**:Google Gemini、Anthropic Claude;POI 富化走 SerpAPI + DeepSeek(冷启动用预富化数据集)
- **爬虫**:Playwright(OpenRice、Reddit、小红书)

## 快速开始

**前置**:Node.js

```bash
npm install
cp .env.example .env   # 填入你的 API key
npm run dev
```

### 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动全栈开发服务器 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 类型检查(`tsc --noEmit`) |
| `npm run clean` | 清除 `dist/` |

## 项目结构

```
Dig/
├── server.ts            # Express + Vite 中间件,OSM 代理
├── src/
│   ├── App.tsx
│   ├── screens/         # Wander, Search, ...
│   ├── components/      # FactCard, BookmarkListSheet, ...
│   ├── services/        # preEnrichedService, ...
│   ├── store/           # Zustand stores
│   ├── hooks/
│   ├── lib/
│   ├── data/            # dig-pois.json(预富化 POI)
│   ├── constants/
│   ├── types/
│   └── utils/
├── scripts/             # 爬虫(openrice, reddit, xiaohongshu), summarize
├── firestore.rules
└── firebase-blueprint.json
```

## 开发须知

- **移动优先**——始终在 `.mobile-container` 内测试(按 430px 宽优化)
- **高对比**——黑色强调 + 粗体排版(`Syne` / `Inter` / `Space Mono`)
- **代理外部请求**——可能触发 CORS 的调用一律走 `server.ts`
