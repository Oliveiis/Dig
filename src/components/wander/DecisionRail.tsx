import { useMemo } from 'react';
import { ChevronRight, Clock3, Sparkles } from 'lucide-react';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { useLocationStore } from '../../store/useLocationStore';
import { usePOIStore } from '../../store/usePOIStore';
import { evidenceCountFor, filterExplorePOIs, rankExploreWinners, walkMinutesFor } from '../../utils/poiRanking';

export function DecisionRail() {
  const { coords } = useLocationStore();
  const {
    allPOIs,
    activeFilter,
    activeIntent,
    setSelectedPOI,
    setShowFullCard,
  } = usePOIStore();
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((entry) => entry.poi_id)), [bookmarks]);
  const winners = useMemo(() => {
    const filtered = filterExplorePOIs(allPOIs, activeIntent, activeFilter, bookmarkedIds);
    return rankExploreWinners(filtered, coords, bookmarkedIds, 5);
  }, [activeFilter, activeIntent, allPOIs, bookmarkedIds, coords]);

  if (winners.length === 0) return null;

  const openDecision = (id: string) => {
    const poi = winners.find((item) => item.id === id);
    if (!poi) return;
    setSelectedPOI(poi);
    setShowFullCard(true);
  };

  return (
    <section aria-label="附近優先推薦" className="absolute bottom-[calc(68px+env(safe-area-inset-bottom)+12px)] left-0 right-0 z-30">
      <div className="mb-1.5 flex items-center justify-between gap-4 px-4">
        <p className="text-[12px] font-bold text-app-text">附近先看</p>
        <span className="shrink-0 text-[10px] text-app-text3">綜合判斷排序 · 左右看</span>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
        {winners.map((poi) => {
          const walkMinutes = walkMinutesFor(poi);
          const evidenceCount = evidenceCountFor(poi);
          const skuClaim = poi.claims?.find((claim) => claim.kind === 'sku');
          const primarySku = poi.signature_items[0] || skuClaim?.headline || poi.hook_tag;
          const decisionHeadline = poi.decision?.headline || poi.why_worth_it || '近期內容仍在整理';
          const photo = poi.photos?.find((item) => item.kind === 'storefront')
            ?? poi.photos?.find((item) => item.kind === 'signature')
            ?? poi.photos?.[0];

          return (
            <button
              key={poi.id}
              type="button"
              onClick={() => openDecision(poi.id)}
              className="h-[98px] w-[292px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white/90 text-left shadow-[0_3px_8px_rgba(24,50,58,0.14)] backdrop-blur-xl transition-transform active:scale-[0.985]"
            >
              <div className="flex h-full">
                {photo ? (
                  <img src={photo.url} alt={photo.alt} className="w-[90px] shrink-0 object-cover" />
                ) : (
                  <span className="flex w-[90px] shrink-0 items-center justify-center bg-accent-soft text-app-accent">
                    <Sparkles size={20} />
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col p-2.5">
                  <span className="flex items-center gap-1 text-[10px] font-medium text-app-text3">
                    <strong className="min-w-0 truncate text-[12px] text-app-text">{poi.name}</strong>
                    {walkMinutes && <><span aria-hidden="true">·</span><Clock3 size={11} /><span>{walkMinutes} 分鐘</span></>}
                  </span>
                  <strong className="mt-1 line-clamp-1 text-[13px] leading-[1.35] tracking-[-0.01em] text-app-text">{decisionHeadline}</strong>
                  <span className="mt-auto flex min-w-0 items-center gap-1.5 text-[10px] text-app-text3">
                    <span className="min-w-0 flex-1 truncate">{poi.subcategory}{primarySku ? ` · ${primarySku}` : ''}</span>
                    {evidenceCount > 0 && <span className="shrink-0">{evidenceCount} 條</span>}
                    <ChevronRight size={12} className="shrink-0 text-app-accent" />
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
