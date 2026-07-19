# Dig 性能与人设卡数据化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 低风险优化 Dig 的首屏冷启动性能(代码分割)、修正缓存层 timed 过期触发全量富化的浪费、让人设卡 attributes/skills 反映真实行为数据。

**Architecture:** 三条独立改动线,互不依赖:(1) React.lazy 拆分非首屏屏幕与 modal;(2) poiCacheService 在 stable 新鲜仅 timed 过期时跳过全量富化;(3) personaService 内部调用 deriveTasteProfile,用真实聚合数据填充 Persona 的 attributes/skills,Persona 接口与 PersonaPanel 不变。

**Tech Stack:** React 19, Vite 6, TypeScript, Zustand, pigeon-maps。

## Global Constraints

- 移动优先:所有改动须在 430px `.mobile-container` 约束下验证(见 AGENTS.md)。
- 高对比度风格:黑 accent + 粗体排版(Syne/Inter/Space Mono),不改动视觉风格。
- 不触碰:MapContainer、SDK 依赖、server.ts/api 路由、富化链路串行结构、PersonaPanel.tsx、tasteProfile.ts(只读)。
- 提交规范:每个任务结束 commit,中文或英文 message 均可,遵循仓库现有 `type: subject` 风格。
- 仓库通过 GitHub MCP(Oliveiis/Dig, main 分支)操作,本地无 git 工作区;每个任务在分支或 main 上单文件提交。
- 类型检查:`npm run lint`(即 `tsc --noEmit`)须通过。

## File Structure

| 文件 | 职责 | 本轮改动 |
| --- | --- | --- |
| `src/App.tsx` | 顶层 4 Tab 路由 | 改:Search/Journal/Settings 改 lazy |
| `src/screens/WanderScreen.tsx` | 地图+FactCard+modal 编排 | 改:4 个 modal 改 lazy |
| `src/services/poiCacheService.ts` | stable/timed 双层缓存 | 改:timed 过期分支跳过全量富化 |
| `src/services/personaService.ts` | 生成 Persona | 改:内部调 deriveTasteProfile,数据化 attributes/skills |
| `src/screens/JournalScreen.tsx` | 调用 generatePersona | 改:补传 allPOIs |
| `src/utils/tasteProfile.ts` | deriveTasteProfile | 只读复用,不改 |
| `src/components/journal/PersonaPanel.tsx` | 渲染 Persona | 不改 |
| `src/types/poi.ts` | POI/Persona/TasteProfile 类型 | 只读复用,不改 |

---

### Task 1: 屏幕级代码分割(App.tsx 懒加载非首屏屏幕)

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: 无(首屏入口)
- Produces: App 组件不变,仅内部加载方式从静态 import 改为 `React.lazy`

**背景:** 当前 `App.tsx` 顶部静态 import 4 个屏幕,首屏 bundle 含全部。WanderScreen 是首屏,其余 3 个改为懒加载。

- [ ] **Step 1: 读取当前 App.tsx 确认结构**

通过 GitHub MCP 读取 `src/App.tsx`,确认 4 个屏幕的 import 路径与导出名(均为具名导出 `export function XxxScreen`)。

- [ ] **Step 2: 改造 App.tsx 为懒加载**

将 `App.tsx` 顶部 4 个屏幕的静态 import 替换为:

```tsx
import { useState, lazy, Suspense } from 'react';
import { WanderScreen } from './screens/WanderScreen';
import { BottomNav } from './components/common/BottomNav';
import { useGeolocation } from './hooks/useGeolocation';

const SearchScreen = lazy(() => import('./screens/SearchScreen').then(m => ({ default: m.SearchScreen })));
const JournalScreen = lazy(() => import('./screens/JournalScreen').then(m => ({ default: m.JournalScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
```

`renderScreen` 用 `Suspense` 包裹,fallback 用轻量居中 spinner:

```tsx
const renderScreen = () => {
  switch (activeTab) {
    case 'wander':
      return <WanderScreen />;
    case 'search':
      return <SearchScreen />;
    case 'journal':
      return <JournalScreen onOpenSettings={() => setActiveTab('settings')} />;
    case 'settings':
      return <SettingsScreen onBack={() => setActiveTab('journal')} />;
    default:
      return <WanderScreen />;
  }
};
```

`main` 区域改为:

```tsx
<main className="flex-1 relative overflow-hidden">
  <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-app-text3 text-xs font-mono">載入中…</div>}>
    {renderScreen()}
  </Suspense>
</main>
```

- [ ] **Step 3: 类型检查**

Run: `npm run lint`
Expected: 通过,无 TS 错误(具名导出转 default 的 `.then(m => ({ default: m.XxxScreen }))` 写法兼容 `React.lazy`)。

- [ ] **Step 4: 本地构建验证 chunk 分裂**

Run: `npm run build`
Expected: 构建成功;`dist/assets/` 下应出现独立的 Search/Journal/Settings chunk(文件名含 hash),不再全部打进主 chunk。

- [ ] **Step 5: 提交**

通过 GitHub MCP 更新 `src/App.tsx`,message: `perf: lazy-load non-first-paint screens in App.tsx`

---

### Task 2: modal 级代码分割(WanderScreen 懒加载弹窗)

**Files:**
- Modify: `src/screens/WanderScreen.tsx`

**Interfaces:**
- Consumes: Task 1 的懒加载模式(独立,无依赖)
- Produces: WanderScreen 不变,内部 modal 按需加载

**背景:** WanderScreen 顶部静态 import `QuickCheckinModal`/`FavouriteReviewModal`/`BookmarkListSheet`/`DistrictSelector` 4 个组件,它们只在 `isOpen=true` 时挂载,不该进首屏 bundle。注意:这 4 个组件当前是**无条件渲染**(组件内部用 `isOpen` prop 控制显隐),改成 lazy 后必须用 `{isOpen && <LazyModal/>}` 包裹,否则 lazy 组件仍会被立即加载。

- [ ] **Step 1: 读取 WanderScreen.tsx 确认 modal 使用方式**

通过 GitHub MCP 读取 `src/screens/WanderScreen.tsx`,确认 4 个 modal 的 import 路径、props、以及当前是否无条件渲染(确认是 `{isOpen && ...}` 还是直接 `<Modal isOpen={...}/>` 渲染)。

- [ ] **Step 2: 改造 WanderScreen 为懒加载**

将 4 个 modal 的静态 import 替换为 lazy(具名导出转 default):

```tsx
import { useState, lazy, Suspense } from 'react';
// ...其余静态 import 保留(MapContainer、FactCard、CategoryFilterChips、ProximityAlertBanner、stores、icons、motion 等)

const QuickCheckinModal = lazy(() => import('../components/journal/QuickCheckinModal').then(m => ({ default: m.QuickCheckinModal })));
const FavouriteReviewModal = lazy(() => import('../components/favourite/FavouriteReviewModal').then(m => ({ default: m.FavouriteReviewModal })));
const BookmarkListSheet = lazy(() => import('../components/bookmark/BookmarkListSheet').then(m => ({ default: m.BookmarkListSheet })));
const DistrictSelector = lazy(() => import('../components/map/DistrictSelector').then(m => ({ default: m.DistrictSelector })));
```

将原本无条件渲染的 modal 块改为 `isOpen` 时才挂载,并用 `Suspense` 包裹(modal 内部 fallback 给空 div 或 null,因 modal 自身有遮罩动画):

```tsx
{isBookmarkSheetOpen && (
  <Suspense fallback={null}>
    <BookmarkListSheet
      isOpen={isBookmarkSheetOpen}
      onClose={() => setIsBookmarkSheetOpen(false)}
    />
  </Suspense>
)}
{isDistrictSelectorOpen && (
  <Suspense fallback={null}>
    <DistrictSelector
      isOpen={isDistrictSelectorOpen}
      onClose={() => setIsDistrictSelectorOpen(false)}
      onSelect={setDistrict}
      currentDistrictId={currentDistrict.id}
    />
  </Suspense>
)}
{selectedPOI && isCheckinOpen && (
  <Suspense fallback={null}>
    <QuickCheckinModal
      poi={selectedPOI}
      isOpen={isCheckinOpen}
      onClose={() => setIsCheckinOpen(false)}
    />
  </Suspense>
)}
{selectedPOI && isFavouriteOpen && (
  <Suspense fallback={null}>
    <FavouriteReviewModal
      poi={selectedPOI}
      isOpen={isFavouriteOpen}
      onClose={() => setIsFavouriteOpen(false)}
    />
  </Suspense>
)}
```

**注意:** 若某 modal 原本依赖"始终挂载、内部 transition"的入场动画,懒加载后首次打开会先加载再播动画,可接受(首次极小延迟)。

- [ ] **Step 3: 类型检查**

Run: `npm run lint`
Expected: 通过。

- [ ] **Step 4: 本地构建验证 modal chunk**

Run: `npm run build`
Expected: 构建成功;`dist/assets/` 下应出现 4 个 modal 的独立 chunk。

- [ ] **Step 5: 手动验证功能**

Run: `npm run dev`,在 430px 容器内:
- 打开 Bookmark 按钮 → BookmarkListSheet 正常弹出
- 打开 District 选择器 → DistrictSelector 正常
- 选中 POI → 打开 QuickCheckin / FavouriteReview 各自正常
Expected: 4 个 modal 功能与改前一致。

- [ ] **Step 6: 提交**

通过 GitHub MCP 更新 `src/screens/WanderScreen.tsx`,message: `perf: lazy-load WanderScreen modals on demand`

---

### Task 3: 缓存逻辑修正(timed 过期跳过全量富化)

**Files:**
- Modify: `src/services/poiCacheService.ts`

**Interfaces:**
- Consumes: 无
- Produces: `enrichAndCachePOI` 行为变更(stable 新鲜+timed 过期时不再调 `digForPOIDetails`)

**背景:** `enrichAndCachePOI` 中,当 `cached.is_enriched && cached.stable.hook_tag` 成立、仅 timed 过期时,仍执行 `const details = await digForPOIDetails(poi)` 触发全量富化(SerpAPI+DeepSeek)。应跳过。

当前关键代码(改前):

```ts
export async function enrichAndCachePOI(poi: POI): Promise<POI> {
  loadFromStorage();
  const cached = memoryCache.get(poi.id);
  if (cached?.is_enriched && cached.stable.hook_tag) {
    const result = applyEntry(poi, cached);
    if (cached.timed && Date.now() - cached.timed.updated_at < TIMED_TTL_MS) {
      return result;
    }
    // Stable fields fresh, but timed expired — re-fetch only to refresh timed.
  }

  const details = await digForPOIDetails(poi);
  // ...后续写缓存
```

- [ ] **Step 1: 读取 poiCacheService.ts 确认完整上下文**

通过 GitHub MCP 读取 `src/services/poiCacheService.ts`,确认 `enrichAndCachePOI` 全文与 `applyEntry`/`pickFields` 等辅助函数。

- [ ] **Step 2: 在 timed 过期分支提前 return**

将该分支改为:stable 新鲜且 timed 过期时,直接返回 `applyEntry(poi, cached)`(保留 stale timed 值显示,不置空、不触发富化)。修改后的函数开头:

```ts
export async function enrichAndCachePOI(poi: POI): Promise<POI> {
  loadFromStorage();
  const cached = memoryCache.get(poi.id);
  if (cached?.is_enriched && cached.stable.hook_tag) {
    const result = applyEntry(poi, cached);
    if (cached.timed && Date.now() - cached.timed.updated_at < TIMED_TTL_MS) {
      return result;
    }
    // Stable fields fresh, timed expired: keep showing stale timed value
    // (is_open_now / hours) without triggering a full SerpAPI+DeepSeek re-enrich.
    // The next explicit user dig will refresh.
    return result;
  }

  const details = await digForPOIDetails(poi);
  // ...后续写缓存逻辑保持不变
```

**不改动** 后续 `digForPOIDetails` 调用与 stable 写缓存逻辑(那是 stable 未富化路径)。

- [ ] **Step 3: 类型检查**

Run: `npm run lint`
Expected: 通过。

- [ ] **Step 4: 手动验证不触发全量富化**

Run: `npm run dev`,在 430px 容器内:
1. 打开 app,选中一个新 POI 触发首次富化(Network 面板可见一次 `/api/dig`)。
2. 在 DevTools Application → localStorage 找到 `dig:poi-enrich:v1`,手动把该 POI 的 `timed.updated_at` 改成 24 小时前的时间戳(模拟 timed 过期),stable 字段保留。
3. 重新选中同一 POI,观察 Network 面板。
Expected: **不再**出现 `/api/dig` 请求;FactCard 的 hook_tag/why_worth_it(stable)仍正确显示;is_open_now/hours 显示为 stale 值(不消失)。

- [ ] **Step 5: 提交**

通过 GitHub MCP 更新 `src/services/poiCacheService.ts`,message: `fix: skip full re-enrich when only timed cache expired`

---

### Task 4: 人设卡数据化(personaService 接入 tasteProfile)

**Files:**
- Modify: `src/services/personaService.ts`
- Modify: `src/screens/JournalScreen.tsx`

**Interfaces:**
- Consumes: `deriveTasteProfile(favourites, checkins, allPOIs)` from `src/utils/tasteProfile.ts`;`TasteProfile`/`Persona`/`POI`/`CheckinEntry`/`FavouriteEntry` from `src/types/poi.ts`
- Produces: `generatePersona(checkins, favourites, allPOIs)` — 新增第三参 `allPOIs: POI[]`;返回的 `Persona.attributes` 数值与 `Persona.skills` 由真实数据派生;`Persona` 接口形状不变

**背景:** `personaService.generatePersona` 当前签名 `(checkins, favourites)`,attributes 全硬编码(82/68/60/42 等),skills 写死。`deriveTasteProfile` 已能算出 `regret_rate`/`top_district`/`top_categories`/`top_skus`/`price_tendency` 等真实字段。唯一调用点是 `JournalScreen.tsx:30`:`const persona = useMemo(() => generatePersona(checkins, favourites), [checkins, favourites])`,该文件未 import `usePOIStore`。

**映射规则(锁定):**
- "踩雷率"相关 attribute 的 value → `Math.max(0, 100 - tasteProfile.regret_rate * 3)`(与 tasteProfile 现有公式一致)
- "消費" attribute → 基于 `tasteProfile.price_tendency`:`bargain`→30、`worth_it`→50、`expensive`→80,缺省→55
- "店型"/"非連鎖佔比" → 需基于 `is_chain` 聚合,但 tasteProfile 未直接暴露该比例;**本轮**对咖啡人设的"店型"保留默认值 80(不编造),仅替换能真实算出的字段(踩雷率、消費、skills)
- skills 数组 → 从 `tasteProfile.top_categories`/`top_skus`/`top_district` 派生:
  - 首项:`${top_categories[0].label} ×${top_categories[0].count}`(若存在)
  - 次项:`${top_district}最常出沒`(若 top_district 非"未知")
  - 第三项:`${top_skus[0].name} ×${top_skus[0].count}`(若 top_skus 非空)
  - 不足 3 项时保留该人设原有写死 skills 补位,不强行编造

- [ ] **Step 1: 读取 personaService.ts 与 tasteProfile.ts 确认字段**

通过 GitHub MCP 读取 `src/services/personaService.ts` 与 `src/utils/tasteProfile.ts`,确认 `Persona` 接口字段(attributes/skills 形状)与 `TasteProfile` 字段名。

- [ ] **Step 2: 改造 personaService.generatePersona**

在 `personaService.ts` 顶部新增 import:

```ts
import { CheckinEntry, FavouriteEntry, POI } from '../types/poi';
import { deriveTasteProfile } from '../utils/tasteProfile';
```

修改 `generatePersona` 签名与实现:

```ts
export function generatePersona(
  checkins: CheckinEntry[],
  favourites: FavouriteEntry[],
  allPOIs: POI[] = []
): Persona {
  const taste = deriveTasteProfile(favourites, checkins, allPOIs);
  const totalCount = checkins.length + favourites.length;

  // 真实数值派生
  const regretValue = Math.max(0, 100 - taste.regret_rate * 3);
  const consumeValue =
    taste.price_tendency === 'bargain' ? 30 :
    taste.price_tendency === 'worth_it' ? 50 :
    taste.price_tendency === 'expensive' ? 80 : 55;

  // skills 派生(不足则用占位)
  const skills: string[] = [];
  if (taste.top_categories[0]) {
    skills.push(`${taste.top_categories[0].label} ×${taste.top_categories[0].count}`);
  }
  if (taste.top_district && taste.top_district !== '未知') {
    skills.push(`${taste.top_district}最常出沒`);
  }
  if (taste.top_skus[0]) {
    skills.push(`${taste.top_skus[0].name} ×${taste.top_skus[0].count}`);
  }

  if (totalCount < 3) {
    return {
      title: "城市探索初學者",
      emoji: "🚶",
      description: "剛開始在城市中留下足跡，對一切都充滿好奇。",
      unlock_info: `再打卡 ${3 - totalCount} 次解鎖專屬人設`,
      attributes: [
        { label: "探索度", value: 30, min_label: "隨性", max_label: "硬核" },
        { label: "品味", value: 50, min_label: "大眾", max_label: "小眾" }
      ],
      skills: skills.length > 0 ? skills : ["新手上路"]
    };
  }

  // topCategory 判定保留(原逻辑)
  const categoryCounts: Record<string, number> = {};
  [...checkins, ...favourites].forEach(item => {
    const sub = 'poi_subcategory' in item ? item.poi_subcategory : (item as any).subcategory || '未知';
    categoryCounts[sub] = (categoryCounts[sub] || 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategory[0];
  const topCategoryCount = topCategory[1];

  const isCoffeeLover = topCategoryName.toLowerCase().includes('咖啡') || topCategoryName.toLowerCase().includes('cafe');
  const isBarLover = topCategoryName.toLowerCase().includes('酒吧') || topCategoryName.toLowerCase().includes('bar');
  const isFoodie = topCategoryName.toLowerCase().includes('菜') || topCategoryName.toLowerCase().includes('餐') || topCategoryName.toLowerCase().includes('料理');

  // skills 不足 3 项时补位
  const fallbackSkills = ['隨心所欲', '巷弄專家', '多樣化品味'];
  while (skills.length < 3) {
    const next = fallbackSkills[skills.length];
    if (next && !skills.includes(next)) skills.push(next);
    else break;
  }

  if (isCoffeeLover) {
    return {
      title: "咖啡鑑賞者",
      emoji: "☕",
      description: `對燕麥拿鐵有執念、只信社區小店、踩雷率極低的咖啡鑑賞者。`,
      unlock_info: `根據你喜愛的 ${favourites.length} 家店解鎖`,
      attributes: [
        { label: "店型", value: 82, min_label: "社區小店", max_label: "連鎖品牌" },
        { label: "口味", value: 68, min_label: "酸感", max_label: "醇厚" },
        { label: "萃取", value: 60, min_label: "手冲", max_label: "意式" },
        { label: "消費", value: consumeValue, min_label: "超值優先", max_label: "不計成本" }
      ],
      skills: [
        `${topCategoryName} ×${topCategoryCount}`,
        ...skills.filter(s => !s.startsWith(topCategoryName))
      ].slice(0, 4)
    };
  }

  if (isBarLover) {
    return {
      title: "微醺探險家",
      emoji: "🍸",
      description: "深夜城市的守望者，對調酒層次有著近乎苛刻的要求。",
      unlock_info: `根據你打卡的 ${checkins.length} 個地點解鎖`,
      attributes: [
        { label: "氛圍", value: 75, min_label: "安靜", max_label: "熱鬧" },
        { label: "基酒", value: 40, min_label: "琴酒", max_label: "威士忌" },
        { label: "創意", value: 85, min_label: "經典", max_label: "先鋒" },
        { label: "消費", value: consumeValue, min_label: "超值優先", max_label: "不計成本" }
      ],
      skills: [
        `${topCategoryName} ×${topCategoryCount}`,
        ...skills.filter(s => !s.startsWith(topCategoryName))
      ].slice(0, 4)
    };
  }

  if (isFoodie) {
    return {
      title: "美食獵人",
      emoji: "🍱",
      description: "味蕾極其發達，擅長在巷弄中挖掘那些被大眾忽略的絕世美味。",
      unlock_info: `根據你豐富的 ${totalCount} 次探店解鎖`,
      attributes: [
        { label: "口味", value: 90, min_label: "清淡", max_label: "重口" },
        { label: "環境", value: 30, min_label: "路邊攤", max_label: "精緻餐飲" },
        { label: "性價比", value: regretValue, min_label: "不計成本", max_label: "極致超值" },
        { label: "冒險感", value: 70, min_label: "穩健", max_label: "獵奇" }
      ],
      skills: [
        `${topCategoryName} ×${topCategoryCount}`,
        ...skills.filter(s => !s.startsWith(topCategoryName))
      ].slice(0, 4)
    };
  }

  return {
    title: "城市漫遊者",
    emoji: "🧭",
    description: "不設限的探索者，喜歡在城市的毛細血管中尋找驚喜。",
    unlock_info: `根據你豐富的 ${totalCount} 次足跡解鎖`,
    attributes: [
      { label: "目的性", value: 20, min_label: "漫無目的", max_label: "精確導航" },
      { label: "社交性", value: 45, min_label: "獨行", max_label: "聚會" },
      { label: "冒險感", value: regretValue, min_label: "穩健", max_label: "踩雷預警" },
      { label: "消費", value: consumeValue, min_label: "超值優先", max_label: "不計成本" }
    ],
    skills: skills.length > 0 ? skills : ["隨心所欲", "巷弄專家", "多樣化品味"]
  };
}
```

**说明:** `regretValue` 用于"性价比/冒险感"等可对应踩雷率的维度;`consumeValue` 替换所有"消費"属性;skills 由真实 top_categories/top_district/top_skus 派生并去重;文案(title/emoji/description/unlock_info)完全保留原值。`Persona` 接口未变。

- [ ] **Step 3: 类型检查**

Run: `npm run lint`
Expected: 通过。注意 `generatePersona` 第三参 `allPOIs` 默认值 `[]` 保证未传参时不报错,但 JournalScreen 须传真实数据。

- [ ] **Step 4: 改造 JournalScreen 补传 allPOIs**

在 `src/screens/JournalScreen.tsx`:
- 新增 import:`import { usePOIStore } from '../store/usePOIStore';`
- 在组件内取:`const { allPOIs } = usePOIStore();`
- 修改第 30 行:
```ts
const persona = useMemo(() => generatePersona(checkins, favourites, allPOIs), [checkins, favourites, allPOIs]);
```

**确认:** 读取 `src/store/usePOIStore.ts` 确认导出字段名为 `allPOIs`(Explore 子代理报告显示该 store 有 `allPOIs` 字段)。

- [ ] **Step 5: 类型检查**

Run: `npm run lint`
Expected: 通过。

- [ ] **Step 6: 手动验证人设数据化**

Run: `npm run dev`,在 430px 容器内进入 Journal → 人設 tab:
1. 用默认 seed checkins/favourites(2 条 seed)→ 人设显示"城市探索初學者",skills 反映真实品类/地区。
2. 在 DevTools 手动往 `dig-journal`/`dig-favourites` localStorage 增加几条同品类打卡(如 5+ 条 cafe)→ 重新打开,人设切到"咖啡鑑賞者","消費"数值随 price_tendency 变化,skills 出现真实 `${品类} ×N` 与 `${地区}最常出沒`。
Expected: attributes/skills 随数据变化;文案部分(title/emoji/description)与改前一致;PersonaPanel 渲染无报错。

- [ ] **Step 7: 提交**

通过 GitHub MCP 更新 `src/services/personaService.ts` 与 `src/screens/JournalScreen.tsx`,message: `feat: data-drive persona attributes/skills via tasteProfile`

---

## 自审记录

(实现者执行前由计划作者已完成以下检查)

- **Spec 覆盖**:Spec 第 1 节 → Task 1+2;第 2 节 → Task 3;第 3 节 → Task 4。无遗漏。
- **占位符**:无 TBD/TODO,所有代码块完整。
- **类型一致性**:`generatePersona(checkins, favourites, allPOIs)` 签名在 Task 4 Step 2 定义、Step 4 调用一致;`Persona` 接口未变;`TasteProfile` 字段名(`regret_rate`/`top_categories`/`top_skus`/`top_district`/`price_tendency`)与 `src/types/poi.ts` 定义一致。
