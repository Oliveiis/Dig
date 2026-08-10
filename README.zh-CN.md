# Dig

**面向港岛旅行探索的 AI 店铺决策地图。**

[English](./README.md) · [产品需求文档](./docs/PRD-HK-ISLAND-MVP.md) · [UI 设计语言](./docs/UI-DESIGN-LANGUAGE.md)

**在线 MVP：**[dig-red.vercel.app](https://dig-red.vercel.app)

Dig 解决的不是“附近有哪些店”，而是“附近哪几家现在值得去、为什么、应该买什么、需要注意什么”。产品不会把所有 POI 平铺在地图上，而是先筛选少量当前赢家，再把 Google、内容社区、官方信息和 Dig 用户日志整理成可核验的店铺级判断。

当前版本是为 430px 手机视口设计的香港港岛 MVP。

## 核心体验

### 帮助决策的地图

- **城市尺度：**不显示 Dig POI，优先保证城市方位与底图可读性。
- **街区尺度：**按照可达性、证据强度、新鲜度和风险排序显示 POI；Top 3 优先，其余退化为小点。
- **街道尺度：**只有在碰撞规则允许时才显示店名和步行时间。
- **稳定浏览：**拖动地图不会自动重新请求、重排或把镜头拉回当前位置。
- **紧凑比较卡：**底部展示 3–5 家附近候选，不遮挡大部分地图。

### 单一半屏店铺详情

点击地图标记或横向卡片后，直接进入一个半屏店铺详情，其中包含：

1. 门头和餐品照片；
2. 营业状态、付款方式和步行时间；
3. 基于有效 claim 与近期来源的店铺级 AI 综合判断；
4. 多个代表性招牌，而不是只突出一个 SKU；
5. 排队、预约、售罄、营业与最佳到店时间提醒；
6. 地址、预算和 Google Maps、小红书、官网直达链接。

产品不再设置重复的 SKU 半屏、第二层完整详情或 AI 生成的“证据文章”。每次点击都必须增加新的决策信息。

### 先建立证据，再生成文案

Dig 使用结构化 claim 表达推荐依据：

```text
店铺
├── claim：代表性商品
│   ├── 支持数量
│   ├── 来源 ID
│   ├── 置信度
│   └── 最后核验时间
├── claim：排队、售罄或营业风险
└── 来源快照
```

只有证据达标的店铺才进入主要推荐层。资料不足时明确显示限制，不生成“隐藏神店”“必去”之类没有信息量的营销标签。

## 当前 MVP 范围

- 港岛街区选择、定位和默认位置降级。
- 9 家带结构化判断、claim 与来源的编辑种子店铺。
- Top 推荐、按缩放层级变化的 MapLibre POI 标记。
- 店铺横向比较卡与毛玻璃半屏详情。
- 支持店名、品类、SKU 和自然语言场景的搜索。
- 本地优先的收藏、附近提醒、打卡与日志。
- 通过服务端代理访问 OSM/Overpass，多实例并发降级。
- 可选的 SerpAPI Google 店铺数据与 DeepSeek 富化。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 19、TypeScript、Vite 6、Tailwind CSS 4 |
| 状态 | Zustand + 本地持久化 |
| 地图 | MapLibre GL JS、Geoapify Klokantech Basic、OSM 降级底图 |
| 本地后端 | Express + Vite Middleware |
| Vercel API | `api/` 下的 TypeScript Serverless Functions |
| 本地 MVP 存储 | SQLite / `better-sqlite3` |
| 数据富化 | SerpAPI + DeepSeek，并提供预富化编辑数据降级 |

## 架构

```text
浏览器
├── MapLibre + Geoapify/OSM 底图
├── /api/pre-enriched ── 店铺判断与证据种子
├── /api/osm ─────────── Overpass POI 候选发现
└── /api/dig ─────────── 可选 SerpAPI + DeepSeek 富化

决策管线
原始店铺数据 → 标准化来源 → 结构化 claim
→ 置信度/新鲜度校验 → 店铺级总结 → 地图排序
```

本地服务还提供 SQLite 版本的店铺、收藏和反馈接口。Vercel 上的 MVP 目前以浏览器本地存储保证收藏与日志可用；正式多用户持久化后端属于下一阶段。

## 本地运行

需要 Node.js 20 或以上版本。

```bash
npm install
cp .env.example .env
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### 环境变量

| 变量 | 是否必需 | 用途 |
| --- | --- | --- |
| `VITE_GEOAPIFY_API_KEY` | 推荐 | 加载明亮的 Klokantech Basic 底图；未设置时降级为 OSM。 |
| `SERPAPI_KEY` | 可选 | 通过 `/api/dig` 获取 Google 店铺与评论富化数据。 |
| `DEEPSEEK_API_KEY` | 可选 | 生成富化摘要；缺少时继续使用规则与预富化数据。 |

`VITE_*` 变量会在构建时写入前端。私密服务端密钥不能使用 `VITE_` 前缀。

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地 Express + Vite 应用 |
| `npm run lint` | 使用 `tsc --noEmit` 类型检查 |
| `npm run build` | 在 `dist/` 生成生产构建 |
| `npm run preview` | 预览静态生产构建 |

## 项目结构

```text
Dig/
├── api/                         # Vercel Serverless API
├── docs/
│   ├── PRD-HK-ISLAND-MVP.md     # 产品与实现需求
│   └── UI-DESIGN-LANGUAGE.md    # 统一视觉与交互规范
├── scripts/                     # 本地数据与 SQLite 工具
├── src/
│   ├── components/              # 地图、比较卡、半屏详情和日志组件
│   ├── data/hk-island-mvp.ts    # 港岛 MVP 编辑数据
│   ├── screens/                 # 漫游、搜索、日志和设置
│   ├── services/                # OSM 与预富化数据服务
│   ├── store/                   # Zustand 状态与本地持久化
│   └── utils/poiRanking.ts      # 证据感知推荐排序
├── server.ts                    # 本地 Express + Vite 服务
├── vercel.json                  # Vercel 构建与 SPA 路由
└── vite.config.ts
```

## 部署到 Vercel

仓库已经通过 `vercel.json` 配置 Vercel：

```bash
npx vercel
```

使用 Vite preset、`vite build` 构建命令和 `dist` 输出目录。正式部署前，需要为 Preview 与 Production 添加 `VITE_GEOAPIFY_API_KEY`。只有启用实时富化时才需要 `SERPAPI_KEY` 和 `DEEPSEEK_API_KEY`。

生产发布：

```bash
npx vercel --prod
```

## 数据与原型限制

- 当前照片是带来源标识的授权情境图，不是已经核验的真实店铺上传；数据结构已区分门头、招牌、室内和社区照片。
- 种子数据中的社区内容属于原型/编辑数据；正式数据管线必须使用合规授权，并保留来源可追溯性。
- 营业状态与推荐置信度具有时效性，扩大覆盖范围前必须建立持续刷新机制。
- SQLite 只用于本地开发；正式账号、收藏、反馈与系统级地理围栏需要托管数据库。

## 发布检查

```bash
npm run lint
npm run build
```

同时需要在 430px 手机视口检查城市、街区和街道三个缩放层级的地图表现。
