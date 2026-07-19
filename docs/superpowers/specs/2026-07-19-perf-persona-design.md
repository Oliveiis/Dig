# Dig 性能与人设卡数据化优化设计

- 日期: 2026-07-19
- 范围: 首屏与冷启动性能 + 人设卡数据化
- 改动原则: 低风险点改,不触碰架构 / SDK 依赖 / 富化链路串行结构
- 仓库: Oliveiis/Dig

## 背景与现状

Dig 是移动优先的街区探索 web app(React 19 + Vite 6 + pigeon-maps)。核心链路:
geolocation → OSM POI 拉取 → 合并 preEnriched → 前台立即渲染 fallback POI → 后台 `enrichPOIsBatch` 增量富化(hook_tag / why_worth_it 等)。

经代码探查确认的关键现状:

1. **首屏无代码分割**:`src/App.tsx` 静态 import 4 个屏幕;`src/screens/WanderScreen.tsx` 又静态 import 一批 modal(`QuickCheckinModal` / `FavouriteReviewModal` / `BookmarkListSheet` / `DistrictSelector`),首屏把整个应用打进单 bundle。
2. **地图实际为 pigeon-maps**(非 README 所写的 Google Maps),`src/components/map/MapContainer.tsx`(13KB)是首屏必加载的大块,无法延迟。
3. **富化链路有预热**:`usePOIStore.refreshPOIs` 后台预热点距 viewport 中心最近的 12 个 POI,首屏 POI 非空白等待,而是先出 fallback 再增量 patch。因此富化串行问题不在本轮范围。
4. **缓存分层已存在**:`poiCacheService` 分 stable(hook_tag/why_worth_it 等永久)与 timed(is_open_now/hours,24h)双层。
5. **人设卡硬编码**:`personaService.generatePersona` 的 attributes 数值(82/68/60/42 等)全部写死,但 `utils/tasteProfile.ts` 已能从 favourites+checkins+allPOIs 派生真实 `TasteProfile`,`useFavouriteStore.getTasteProfile()` 已可用。真实计算能力已存在,人设卡却没用它。

## 目标

- 降低首屏冷启动的 bundle 体积与初始解析成本
- 修正缓存层 timed 过期触发全量重富化的浪费
- 让人设卡 attributes / skills 反映真实行为数据,而非硬编码

## 非目标(本轮明确不做)

- 富化链路串行多跳(SerpAPI → place_id → reviews → DeepSeek)的并行化 / 合并
- 移除冗余的 Gemini / 地图 SDK 依赖
- 合并 `server.ts` 与 `api/*.ts` 的重复路由实现
- 路由级懒加载 / prefetch 策略 / 引入 SWR 等缓存框架

以上留待后续架构级轮次。

## 设计

### 1. 首屏性能 — 代码分割与懒加载

**问题**:4 屏幕 + 一批 modal 全部静态 import 进首屏 bundle。

**改动**:

- `src/App.tsx`:用 `React.lazy` + `Suspense` 懒加载 `SearchScreen` / `JournalScreen` / `SettingsScreen`。首屏仅加载 `WanderScreen`。Suspense fallback 用轻量 spinner / 骨架。
- `src/screens/WanderScreen.tsx`:将 `QuickCheckinModal` / `FavouriteReviewModal` / `BookmarkListSheet` / `DistrictSelector` 改为 `React.lazy`,在对应 `isOpen` 为 true 时才加载挂载。首次打开可用轻量 fallback 盖住极小延迟。
- **不触碰** `MapContainer`(pigeon-maps 是首屏地图,必须留)、不触碰任何 SDK 依赖。

**风险**:modal 首次打开有极小加载延迟,用 fallback 缓解;屏幕切换有 spinner。回归面小。

### 2. 缓存逻辑修正 — timed 过期不再触发全量富化

**问题**:`poiCacheService.enrichAndCachePOI` 中,当 stable 字段新鲜但 timed 字段(`is_open_now` / `hours`)过期时,注释声明"re-fetch only to refresh timed",但实际下一行 `digForPOIDetails(poi)` 会重跑完整富化(SerpAPI + DeepSeek 全链路),把 stable 也一起重算。用户只想刷新营业状态,却付出一次全量 AI 富化代价。

**改动**:

- 当 `cached.is_enriched && cached.stable.hook_tag` 成立、仅 timed 过期时,**跳过** `digForPOIDetails` 全量调用。
- timed 过期处理:**保留显示 stale 值**(不置空),避免营业状态突然消失让用户困惑;不触发全量富化,等下次用户主动 dig 该 POI 时再补全。
- stable 缓存逻辑不动。

**风险**:营业状态可能短暂显示旧值,但远比触发全量富化划算;不触碰 stable 路径,回归风险低。

### 3. 人设卡数据化 — 复用 tasteProfile

**问题**:persona attributes 数值硬编码,与已存在的真实计算能力脱节。

**改动**:

- `personaService.generatePersona` 改为接收 `TasteProfile` 入参(或在内部调 `deriveTasteProfile`),将 `attributes` 数值替换为 TasteProfile 的真实聚合值,归一化到 0-100。
- 属性映射:TasteProfile 的品类 / 价格 / 地区等偏好维度,映射到 persona 现有 attributes 语义(口味 / 消费 / 店型 / 冒险感 等)。若某 attribute 在 TasteProfile 无对应维度,保留合理默认值而非编造。
- `skills` 数组:从 checkins / favourites 的真实地区分布、品类计数计算(如"西營盤最常出沒""手冲 ×4"),替换写死值。
- 人设四分类(咖啡 / 酒吧 / 美食 / 漫游)判定逻辑保留(基于 topCategory),仅解锁后的数值变真实。
- **不触碰** 人设文案(title / emoji / description),保持现有人工版本。

**风险**:复用已接入 store 的 tasteProfile 属低风险;主要工作是字段语义对齐,缺口属性用默认值兜底。

## 测试策略

- **代码分割**:本地 `npm run build` 后检查 chunk 分裂情况,确认 Search/Journal/Settings 与 modal 独立成 chunk;`npm run dev` 手动切换 tab、打开各 modal,验证 fallback 与功能正常。
- **缓存修正**:构造一个 stable 已富化、timed 过期的 POI,验证再次进入不触发 `/api/dig` 请求(可通过 Network 面板确认);验证 stable 字段仍正确显示。
- **人设数据化**:在不同 checkins/favourites 数据下验证 persona attributes 数值变化、skills 反映真实分布;验证文案部分未变。
- 全程遵守移动优先约束(430px `.mobile-container`)与高对比度风格(见 AGENTS.md)。

## 涉及文件

- `src/App.tsx` — 屏幕懒加载
- `src/screens/WanderScreen.tsx` — modal 懒加载
- `src/services/poiCacheService.ts` — timed 过期分支修正
- `src/services/personaService.ts` — 接入 tasteProfile,数据化 attributes / skills
- 可能涉及:`src/utils/tasteProfile.ts`(只读复用)、`src/components/journal/PersonaPanel.tsx`(确认调用方传参)
