import React, { useMemo, useState } from 'react';
import { Bookmark, ChevronRight, Clock3, MapPin, Search, Sparkles, X } from 'lucide-react';
import { usePOIStore } from '../store/usePOIStore';
import { useLocationStore } from '../store/useLocationStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { haversineMeters, formatDistance } from '../utils/distance';
import { FactCard } from '../components/cards/FactCard';
import { POI } from '../types/poi';

type SearchFilter = 'open' | 'nearby' | 'takeaway' | 'saved';

const suggestions = [
  '中環附近能帶走的早餐',
  '15 分鐘內吃點甜的',
  '值得排一次的晚餐',
  '收藏過但還沒去',
];

const districtAliases: Record<string, string> = {
  中环: '中環', 上环: '上環', 西营盘: '西營盤', 坚尼地城: '堅尼地城',
  湾仔: '灣仔', 铜锣湾: '銅鑼灣', 鲗鱼涌: '鰂魚涌',
};

function searchableText(poi: POI) {
  return [
    poi.name,
    poi.district,
    poi.subcategory,
    poi.hook_tag,
    poi.decision?.headline,
    poi.decision?.summary,
    poi.decision?.fit,
    ...poi.signature_items,
  ].filter(Boolean).join(' ').toLowerCase();
}

function queryScore(poi: POI, rawQuery: string) {
  if (!rawQuery.trim()) return poi.evidence_level === 'decision' ? 20 : 0;
  let query = rawQuery.trim().toLowerCase();
  for (const [from, to] of Object.entries(districtAliases)) query = query.replaceAll(from, to);
  const haystack = searchableText(poi);
  let score = 0;
  const tokens = query.split(/[\s，。、“”]+/).filter((token) => token.length > 1);
  for (const token of tokens) if (haystack.includes(token)) score += 12;
  if (haystack.includes(query)) score += 28;
  if (/甜|蛋撻|蛋挞|甜品|烘焙/.test(query) && (poi.category === 'bakery' || /甜|蛋撻|麵包/.test(haystack))) score += 24;
  if (/早餐|早上|早晨/.test(query) && /早餐|咖啡|烘焙|07:|08:/.test(haystack)) score += 18;
  if (/帶走|带走|外帶|边走边吃|邊走邊吃/.test(query) && /外帶|買走|邊走邊吃|烘焙/.test(haystack)) score += 20;
  if (/晚餐|晚上/.test(query) && ['restaurant', 'bar'].includes(poi.category)) score += 18;
  if (/排一次|排隊|排队/.test(query) && /排|等位/.test(haystack)) score += 12;
  return score;
}

export const SearchScreen: React.FC = () => {
  const allPOIs = usePOIStore((state) => state.allPOIs);
  const coords = useLocationStore((state) => state.coords);
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Set<SearchFilter>>(new Set());
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const bookmarked = useMemo(() => new Set(bookmarks.map((item) => item.poi_id)), [bookmarks]);

  const results = useMemo(() => allPOIs
    .map((poi) => {
      const distance = haversineMeters(coords, poi.coordinates);
      const score = queryScore(poi, query)
        + (poi.evidence_level === 'decision' ? 18 : 0)
        + Math.max(0, 10 - Math.round(distance / 250));
      return { ...poi, distance_meters: distance, searchScore: score };
    })
    .filter((poi) => {
      if (query.trim() && poi.searchScore <= 0) return false;
      if (!query.trim() && poi.evidence_level !== 'decision') return false;
      if (filters.has('open') && poi.is_open_now !== true) return false;
      if (filters.has('nearby') && (poi.distance_meters ?? Infinity) > 1200) return false;
      if (filters.has('saved') && !bookmarked.has(poi.id)) return false;
      if (filters.has('takeaway') && !['bakery', 'cafe', 'shop'].includes(poi.category)) return false;
      return true;
    })
    .sort((a, b) => b.searchScore - a.searchScore || (a.distance_meters ?? Infinity) - (b.distance_meters ?? Infinity)),
  [allPOIs, coords, query, filters, bookmarked]);

  const primary = results.slice(0, 3);
  const alternatives = results.slice(3);

  const toggleFilter = (filter: SearchFilter) => {
    setFilters((current) => {
      const next = new Set(current);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const resultRow = (poi: typeof results[number], featured = false) => {
    const walk = Math.max(1, Math.round((poi.distance_meters ?? 0) / 78));
    return (
      <button
        key={poi.id}
        type="button"
        onClick={() => setSelectedPOI(poi)}
        className={`group flex w-full gap-3 text-left active:bg-app-surface2 ${featured ? 'py-4' : 'border-t border-app-border py-3.5'}`}
      >
        {poi.photos?.[0] ? (
          <img src={poi.photos[0].url} alt={poi.photos[0].alt} loading="lazy" className={`${featured ? 'h-[86px] w-[86px]' : 'h-[68px] w-[68px]'} shrink-0 rounded-xl object-cover`} />
        ) : (
          <span className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-xl bg-app-surface2 text-app-text3"><MapPin size={19} /></span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[14px] font-bold text-app-text">{poi.name}</span>
            {bookmarked.has(poi.id) && <Bookmark size={13} className="shrink-0 fill-[#F2B84B] text-[#B67712]" />}
          </span>
          <span className="mt-1 line-clamp-2 text-[13px] font-semibold leading-[1.45] text-app-text2">{poi.decision?.headline || poi.subcategory}</span>
          <span className="mt-2 flex items-center gap-2 text-[10px] font-medium text-app-text3">
            <span className="inline-flex items-center gap-1"><MapPin size={11} />{poi.district}</span>
            <span>步行 {walk} 分鐘</span>
            {poi.is_open_now === true && <span className="text-[#237261]">營業中</span>}
          </span>
        </span>
        <ChevronRight size={17} className="mt-1 shrink-0 text-app-text3 transition-transform group-active:translate-x-0.5" />
      </button>
    );
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-app-bg">
      <header className="shrink-0 px-5 pb-3 pt-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.03em] text-app-text">今天想找什麼？</h1>
            <p className="mt-1.5 text-[12px] text-app-text2">可以直接說品項、時間和你不想遇到的事</p>
          </div>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold text-app-accent">港島 MVP</span>
        </div>

        <label className="mt-4 block">
          <span className="sr-only">搜尋店鋪、品項或場景</span>
          <span className="relative block">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text2" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如：中環能帶走的早餐"
              className="h-12 w-full rounded-xl bg-white pl-11 pr-11 text-[14px] text-app-text shadow-[0_2px_7px_rgba(24,50,58,0.09)] placeholder:text-app-text2"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="清除搜尋" className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-app-surface2 text-app-text2"><X size={14} /></button>}
          </span>
        </label>

        {!query && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setQuery(suggestion)} className="min-h-9 shrink-0 rounded-full bg-white px-3 text-[11px] font-medium text-app-text2 shadow-[0_1px_4px_rgba(24,50,58,0.08)]">{suggestion}</button>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {([
            ['open', '現在營業', Clock3],
            ['nearby', '15 分鐘內', MapPin],
            ['takeaway', '能帶走', Sparkles],
            ['saved', '已收藏', Bookmark],
          ] as Array<[SearchFilter, string, React.ElementType]>).map(([id, label, Icon]) => (
            <button key={id} type="button" onClick={() => toggleFilter(id)} aria-pressed={filters.has(id)} className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold ${filters.has(id) ? 'bg-app-accent text-white' : 'bg-app-surface2 text-app-text2'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-28 no-scrollbar">
        {results.length > 0 ? (
          <>
            <section>
              <div className="flex items-center justify-between pt-3">
                <h2 className="text-[15px] font-bold text-app-text">最適合現在</h2>
                <span className="text-[10px] text-app-text3">按需求與步行時間排序</span>
              </div>
              <div className="mt-1 divide-y divide-app-border">
                {primary.map((poi) => resultRow(poi, true))}
              </div>
            </section>

            {alternatives.length > 0 && (
              <section className="mt-4">
                <h2 className="pb-1 text-[13px] font-bold text-app-text2">順路備選</h2>
                <div>{alternatives.map((poi) => resultRow(poi))}</div>
              </section>
            )}
          </>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-app-accent"><Search size={21} /></span>
            <h2 className="mt-4 text-[15px] font-bold text-app-text">這組條件暫時沒有合適結果</h2>
            <p className="mt-1 max-w-[250px] text-[12px] leading-5 text-app-text2">移除一個限制，或換成品項、街區和時間來搜尋。</p>
            <button type="button" onClick={() => { setQuery(''); setFilters(new Set()); }} className="mt-4 min-h-11 rounded-xl bg-white px-4 text-[12px] font-semibold text-app-accent shadow-[0_2px_7px_rgba(24,50,58,0.09)]">清除條件</button>
          </div>
        )}
      </div>

      {selectedPOI && <FactCard key={selectedPOI.id} poi={selectedPOI} initialStage="decision" onClose={() => setSelectedPOI(null)} />}
    </div>
  );
};
