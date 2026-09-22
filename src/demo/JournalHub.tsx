import { useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, Bookmark, Check, ChevronRight, Stamp } from 'lucide-react';
import { useJournalStore } from '../store/useJournalStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { JournalPanel } from '../components/journal/JournalPanel';
import { PLACES, type DemoPlace } from './data';
import { ShopPhoto } from './ShopPhoto';
import { Modal } from './Modal';

const STAMPS = [
  { name: '咖啡散步', emoji: '☕', ids: ['osm-8424231338', 'osm-10097190620', 'osm-7136811558'] },
  { name: '麵包出爐', emoji: '🥐', ids: ['osm-4862057460', 'osm-10743865077'] },
  { name: '街坊好味', emoji: '🍚', ids: ['osm-4416529189', 'osm-3727065823'] },
  { name: '異國一口', emoji: '🍝', ids: ['osm-4135501550', 'osm-12484286014'] },
];
const STORIES = [
  { id: 'coffee', author: '阿晴', avatar: '🌿', title: '留一個下午，給咖啡和散步。', intro: '把咖啡店收進清單，下次走到街角時，就有一個停下來的理由。', ids: STAMPS[0].ids, tag: '咖啡散步', text: '這份清單把三家咖啡小店放在一起。先看店鋪情報，挑一家適合今天心情的；不用急著跑完所有地方。走過、喝過，再寫下屬於自己的感受。' },
  { id: 'bread', author: '麵包同學', avatar: '🥐', title: '今天的幸福，是一袋熱麵包。', intro: '街坊餅店、蛋糕櫃，把日常的小確幸慢慢收集起來。', ids: STAMPS[1].ids, tag: '麵包出爐', text: '收藏兩家西營盤餅店，做一份自己的烘焙地圖。照片是來源網站的資料實拍，當日品項與營業時間請以門店為準。' },
];
type Story = typeof STORIES[number];

export function JournalHub({ onPlace, onSaved, onExplore }: { onPlace: (p: DemoPlace) => void; onSaved: () => void; onExplore: () => void }) {
  const [section, setSection] = useState<'community' | 'mine'>('community');
  const [story, setStory] = useState<Story | null>(null);
  const [stamp, setStamp] = useState<typeof STAMPS[number] | null>(null);
  const handleTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'community' : event.key === 'End' ? 'mine' : section === 'community' ? 'mine' : 'community';
    setSection(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`#${next}-tab`)?.focus();
  };
  const checkins = useJournalStore(s => s.checkins);
  const bookmarks = useBookmarkStore(s => s.bookmarks);
  const visited = new Set(checkins.map(c => c.poi_id));
  const earned = STAMPS.filter(s => s.ids.some(id => visited.has(id))).length;
  const collected = (s: Story) => s.ids.every(id => bookmarks.some(b => b.poi_id === id));
  const collect = (s: Story) => {
    const store = useBookmarkStore.getState();
    for (const id of s.ids) {
      const place = PLACES.find(p => p.id === id);
      if (place && !store.isBookmarked(id)) store.addBookmark({ poi_id: id, poi_name: place.name, bookmarked_at: new Date().toISOString(), notified_nearby: false });
    }
  };
  const placeButtons = (ids: string[]) => ids.map(id => {
    const place = PLACES.find(p => p.id === id);
    return place && <button className="collection-place" key={id} onClick={() => { setStory(null); setStamp(null); onPlace(place); }}><ShopPhoto place={place}/><span><b>{place.name}</b><small>{visited.has(id) ? '已打卡 · 印章已點亮' : place.subcategory + ' · 查看街角情報'}</small></span><ArrowUpRight size={17}/></button>;
  });
  return <section className="journal-hub">
    <header className="hub-heading"><span className="eyebrow">LITTLE FINDS, BIG MEMORIES</span><h1>把喜歡，<br/><em>收集成日常。</em></h1><span className="hub-postmark" aria-hidden="true">dig.<br/><small>GOOD DAYS<br/>CLUB</small></span><p>一間小店，一枚印章，一個故事。</p></header>
    <section className="stamp-passport" aria-label="我的街角集章冊">
      <div className="passport-title"><span><Stamp size={17}/>街角集章冊</span><b>{earned}<small> / 4 枚</small></b></div>
      <div className="passport-stamps">{STAMPS.map(s => {
        const unlocked = s.ids.some(id => visited.has(id));
        return <button key={s.name} className={unlocked ? 'earned' : ''} aria-label={`${s.name}，${unlocked ? '已點亮' : '待收集'}`} onClick={() => setStamp(s)}><span>{s.emoji}{unlocked && <Check size={12}/>}</span><b>{s.name}</b><small>{unlocked ? '已點亮' : '待收集'}</small></button>;
      })}</div>
      <p>打卡任一主題小店，就能點亮一枚印章。</p>
    </section>
    <button className="saved-collection" onClick={onSaved}><span className="collection-stack" aria-hidden="true">♡</span><span><b>想去的小店</b><small>把下一次出發，先收藏起來</small></span><strong>{bookmarks.filter(b => PLACES.some(p => p.id === b.poi_id)).length}</strong><ChevronRight size={17}/></button>
    <div className="hub-tabs" role="tablist" aria-label="日誌內容" onKeyDown={handleTabKey}><button id="community-tab" role="tab" tabIndex={section === 'community' ? 0 : -1} aria-selected={section === 'community'} aria-controls="community-panel" onClick={() => setSection('community')}>街角社區<span>FOR YOU</span></button><button id="mine-tab" role="tab" tabIndex={section === 'mine' ? 0 : -1} aria-selected={section === 'mine'} aria-controls="mine-panel" onClick={() => setSection('mine')}>我的手記</button></div>
    {section === 'community' ? <div id="community-panel" role="tabpanel" aria-labelledby="community-tab" className="community-feed"><p className="community-note">社區示例 · 作者與故事為演示內容</p>{STORIES.map((s, i) => <article className="community-card" key={s.id}>
      <div className="community-author"><span>{s.avatar}</span><div><b>{s.author}</b><small>西營盤漫遊者 · 示例</small></div><span className="story-label">#{s.tag}</span></div>
      <button className={`story-collage story-${i}`} aria-label={`閱讀：${s.title}`} onClick={() => setStory(s)}>{s.ids.slice(0, 2).map(id => <ShopPhoto key={id} place={PLACES.find(p => p.id === id)!}/>)}<span className="collage-seal">{i ? 'BAKED WITH' : 'SLOW'}<b>{i ? 'LOVE ♡' : 'DAYS ☕'}</b></span></button>
      <button className="story-copy" onClick={() => setStory(s)}><h2>{s.title}</h2><p>{s.intro}</p></button>
      <footer><span>{s.ids.length} 家小店的收藏集</span><button aria-label={`${collected(s) ? '已收藏' : '收藏'}${s.tag}清單`} disabled={collected(s)} onClick={() => collect(s)}>{collected(s) ? <Check size={15}/> : <Bookmark size={15}/>}<span aria-live="polite">{collected(s) ? '已加入收藏' : '收藏這一集'}</span></button></footer>
    </article>)}<button className="back-to-roam" onClick={onExplore}>去地圖，找自己的下一個故事 <ArrowUpRight size={16}/></button></div> : <div id="mine-panel" role="tabpanel" aria-labelledby="mine-tab"><JournalPanel checkins={checkins}/></div>}
    {story && <Modal title="街角收藏集" onClose={() => setStory(null)}><article className="full-entry"><span className="eyebrow">社區示例 · {story.author}</span><h2>{story.title}</h2><p>{story.text}</p></article><div className="collection-places">{placeButtons(story.ids)}</div></Modal>}
    {stamp && <Modal title={stamp.name + ' · 主題印章'} onClose={() => setStamp(null)}><p className="stamp-instructions">在下方任一家小店完成打卡，即可點亮「{stamp.name}」。同一主題不重複發章；紀錄保存在本機。</p><div className="collection-places">{placeButtons(stamp.ids)}</div></Modal>}
  </section>;
}
