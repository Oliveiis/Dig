import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Bookmark,
  Clock3,
  CreditCard,
  ExternalLink,
  Footprints,
  Globe2,
  MapPin,
  Navigation,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
import type { POI } from '../../types/poi';
import { useBookmarkStore } from '../../store/useBookmarkStore';

type SheetStage = 'preview' | 'place';

interface FactCardProps {
  poi: POI;
  onClose: () => void;
  onCheckin?: () => void;
  onFavourite?: () => void;
  initialStage?: 'preview' | 'decision';
}

function minutesFor(poi: POI) {
  if (poi.walk_minutes) return poi.walk_minutes;
  if (!poi.distance_meters) return null;
  return Math.max(1, Math.round(poi.distance_meters / 78));
}

export const FactCard: React.FC<FactCardProps> = ({
  poi,
  onClose,
  onCheckin,
  initialStage = 'preview',
}) => {
  const [stage, setStage] = useState<SheetStage>(initialStage === 'preview' ? 'preview' : 'place');
  const startY = useRef<number | null>(null);
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(poi.id);

  const walkMinutes = minutesFor(poi);
  const openStatus = poi.is_open_now === true
    ? { label: '營業中', chip: 'bg-[#F0FAED]/88 text-[#397322]', dot: 'bg-[#63A933]' }
    : poi.is_open_now === false
      ? { label: '現在休息', chip: 'bg-[#FFF0EF]/88 text-[#A9433B]', dot: 'bg-[#D65D52]' }
      : { label: '狀態待核驗', chip: 'bg-white/58 text-app-text3', dot: 'bg-app-text3/55' };
  const decision = poi.decision ?? {
    headline: poi.evidence_level === 'decision' ? (poi.hook_tag || '順路看看這家店') : '附近有一家店',
    summary: poi.why_worth_it || '目前只有位置與店鋪基礎資料，暫不建議為它改變行程。',
  };
  const evidenceCount = Math.max(
    poi.recommendation_count ?? 0,
    poi.mention_count ?? 0,
    (poi.sources ?? []).reduce((sum, source) => sum + (source.count ?? 0), 0),
  );
  const galleryPhotos = [
    ...(poi.photos?.filter((photo) => photo.kind === 'storefront') ?? []),
    ...(poi.photos?.filter((photo) => photo.kind === 'signature') ?? []),
    ...(poi.photos?.filter((photo) => photo.kind === 'interior') ?? []),
    ...(poi.photos?.filter((photo) => photo.kind === 'community') ?? []),
  ].slice(0, 4);

  const mapsUrl = poi.source_links?.google_maps
    || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${poi.name} Hong Kong`)}`;
  const officialUrl = poi.sources?.find((source) => source.type === 'official' && source.url)?.url;
  const externalLinks = [
    { label: 'Google Maps', url: mapsUrl, icon: MapPin },
    ...(poi.source_links?.xiaohongshu ? [{ label: '小紅書', url: poi.source_links.xiaohongshu, icon: Sparkles }] : []),
    ...(officialUrl ? [{ label: '官方網站', url: officialUrl, icon: Globe2 }] : []),
  ];

  const onHandleTouchStart = (event: React.TouchEvent) => {
    startY.current = event.touches[0].clientY;
  };
  const onHandleTouchEnd = (event: React.TouchEvent) => {
    if (startY.current == null) return;
    const delta = event.changedTouches[0].clientY - startY.current;
    if (stage === 'preview' && delta < -42) setStage('place');
    if (delta > 42) onClose();
    startY.current = null;
  };

  const toggleBookmark = () => {
    if (bookmarked) removeBookmark(poi.id);
    else addBookmark({ poi_id: poi.id, poi_name: poi.name, bookmarked_at: new Date().toISOString(), notified_nearby: false });
  };

  if (stage === 'preview') {
    return createPortal(
      <section aria-label={`${poi.name} 預覽`} className="dig-glass-sheet fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 z-40 max-h-[156px] w-[calc(100%-24px)] max-w-[406px] -translate-x-1/2 overflow-hidden rounded-2xl">
        <button type="button" onClick={() => setStage('place')} className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-white/45">
          {poi.photos?.[0] ? (
            <img src={poi.photos[0].url} alt={poi.photos[0].alt} className="size-[74px] shrink-0 rounded-xl object-cover" />
          ) : (
            <span className="flex size-[74px] shrink-0 items-center justify-center rounded-xl bg-accent-soft text-app-accent"><Sparkles size={22} /></span>
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-[15px] font-bold text-app-text">{poi.name}</span>
              {walkMinutes && <span className="shrink-0 text-[11px] font-medium text-app-text3">{walkMinutes} 分鐘</span>}
            </span>
            <span className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-[1.35] text-app-text">{decision.headline}</span>
            <span className="mt-1 text-[11px] font-medium text-app-accent">查看店鋪詳情</span>
          </span>
        </button>
      </section>,
      document.body,
    );
  }

  return createPortal(
    <section aria-label={`${poi.name} 店鋪詳情`} className="dig-glass-sheet fixed bottom-0 left-1/2 z-[80] flex h-[56dvh] w-full max-w-[430px] -translate-x-1/2 flex-col overflow-hidden rounded-t-[20px]">
      <div className="shrink-0 touch-none cursor-grab pb-1.5 pt-2.5" onTouchStart={onHandleTouchStart} onTouchEnd={onHandleTouchEnd}>
        <div className="mx-auto h-1 w-9 rounded-full bg-app-text3/28" />
      </div>

      <div className="flex shrink-0 items-start gap-2 px-4 pb-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-app-text3"><span>{poi.subcategory}</span><span aria-hidden="true">·</span><span>{poi.district}</span></p>
          <h2 className="mt-0.5 truncate text-[19px] font-bold tracking-[-0.025em] text-app-text">{poi.name}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="關閉店鋪詳情" className="dig-glass-control flex size-10 shrink-0 items-center justify-center text-app-text2 active:scale-95"><X size={17} /></button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-24">
        {galleryPhotos.length > 0 && (
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-4 no-scrollbar">
            {galleryPhotos.map((photo, index) => (
              <figure key={photo.id} className={`relative h-[112px] shrink-0 snap-start overflow-hidden rounded-xl ${index === 0 ? 'w-[62%]' : 'w-[34%]'}`}>
                <img src={photo.url} alt={photo.alt} loading={index === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
                {photo.source_label && <figcaption className="absolute bottom-1.5 right-1.5 rounded-md bg-[#17353D]/72 px-1.5 py-0.5 text-[8px] text-white">{photo.source_label}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pb-4">
          <span className={`flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold ${openStatus.chip}`}>
            <span className={`size-2 rounded-full ${openStatus.dot}`} />
            {openStatus.label}
          </span>
          {poi.payment.visa && <span className="dig-glass-control flex min-h-8 items-center gap-1.5 px-3 text-[11px] font-semibold text-app-accent"><CreditCard size={13} /> Visa 可用</span>}
          {walkMinutes && <span className="dig-glass-control flex min-h-8 items-center gap-1.5 px-3 text-[11px] font-medium text-app-text2"><MapPin size={13} /> 步行 {walkMinutes} 分鐘</span>}
        </div>

        {poi.flash_event && (
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#172F36] px-3.5 py-3 text-white">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#172F36]"><Zap size={16} fill="currentColor" /></span>
            <p className="text-[13px] font-bold leading-5">{poi.flash_event.label}</p>
          </div>
        )}

        <section className="border-t border-app-border/80 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-app-text"><Sparkles size={15} className="text-app-accent" /> AI 綜合判斷</h3>
            {evidenceCount > 0 && <span className="text-[10px] font-medium text-app-text3">綜合 {evidenceCount} 條近期內容</span>}
          </div>
          <p className="mt-2 text-[15px] font-medium leading-6 text-app-text">{decision.summary}</p>
          {decision.fit && <p className="mt-2 text-[12px] leading-5 text-app-text2">更適合：{decision.fit}</p>}
        </section>

        {poi.signature_items.length > 0 && (
          <section className="border-t border-app-border/80 py-4">
            <h3 className="text-[11px] font-semibold text-app-text3">招牌</h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {poi.signature_items.slice(0, 4).map((item) => (
                <span key={item} className="flex min-h-10 items-center gap-2 rounded-xl bg-white/56 px-3 text-[12px] font-semibold text-app-text shadow-[inset_0_0_0_1px_rgba(196,211,214,0.58)]"><Star size={14} fill="currentColor" /> {item}</span>
              ))}
            </div>
          </section>
        )}

        {(decision.best_time || poi.caveats.length > 0) && (
          <section className="border-t border-app-border/80 py-4">
            <h3 className="text-[11px] font-semibold text-app-text3">到店前留意</h3>
            <div className="mt-2.5 flex flex-col gap-2">
              {decision.best_time && <div className="flex min-h-11 items-center gap-3 rounded-xl bg-accent-soft/78 px-3.5 text-[12px] font-semibold text-app-text"><Clock3 size={16} className="shrink-0 text-app-accent" /> {decision.best_time}</div>}
              {poi.caveats.map((caveat) => (
                <div key={caveat} className="flex min-h-11 items-center gap-3 rounded-xl bg-[#FFF3F1]/84 px-3.5 text-[12px] font-semibold text-[#B24B42] shadow-[inset_0_0_0_1px_rgba(229,99,87,0.18)]"><AlertCircle size={16} className="shrink-0" /> {caveat}</div>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-app-border/80 py-4">
          <h3 className="text-[11px] font-semibold text-app-text3">到店資訊</h3>
          <dl className="mt-2 divide-y divide-app-border/70 text-[12px]">
            {poi.hours && <div className="flex gap-4 py-2.5"><dt className="w-16 shrink-0 text-app-text3">營業時間</dt><dd className="font-medium text-app-text">{poi.hours}</dd></div>}
            {poi.address && <div className="flex gap-4 py-2.5"><dt className="w-16 shrink-0 text-app-text3">地址</dt><dd className="font-medium text-app-text">{poi.address}</dd></div>}
            {poi.price_range && <div className="flex gap-4 py-2.5"><dt className="w-16 shrink-0 text-app-text3">預算</dt><dd className="font-medium text-app-text">{poi.price_range}</dd></div>}
            <div className="flex gap-4 py-2.5"><dt className="w-16 shrink-0 text-app-text3">付款</dt><dd className="font-medium text-app-text">{poi.payment.note || (poi.payment.visa ? '可使用信用卡' : poi.payment.cash ? '建議準備現金' : '待核驗')}</dd></div>
          </dl>
        </section>

        <div className="flex gap-2 overflow-x-auto border-t border-app-border/80 py-4 no-scrollbar">
          {externalLinks.map(({ label, url, icon: Icon }) => (
            <a key={label} href={url} target="_blank" rel="noreferrer" className="dig-glass-control flex min-h-10 shrink-0 items-center gap-2 px-3 text-[11px] font-semibold text-app-text"><Icon size={14} className="text-app-accent" /> {label} <ExternalLink size={12} className="text-app-text3" /></a>
          ))}
        </div>
      </div>

      <div className="dig-glass-bar absolute bottom-0 left-0 right-0 flex gap-2 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-app-accent px-4 text-[13px] font-bold text-white active:opacity-85"><Navigation size={16} /> 開始步行</a>
        <button type="button" onClick={toggleBookmark} aria-label={bookmarked ? '取消收藏' : '收藏並到店提醒'} className={`dig-glass-control flex size-11 shrink-0 items-center justify-center ${bookmarked ? 'text-[#8A5A00]' : 'text-app-text2'}`}><Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} /></button>
        {onCheckin && <button type="button" onClick={onCheckin} aria-label="打卡並寫日誌" className="dig-glass-control flex size-11 shrink-0 items-center justify-center text-app-accent"><Footprints size={17} /></button>}
      </div>
    </section>,
    document.body,
  );
};
