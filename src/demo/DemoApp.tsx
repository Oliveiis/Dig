import { useEffect, useState } from 'react';
import { Coffee, Compass, Search, NotebookPen, ArrowUpRight, ChevronLeft, Bookmark, UserRound } from 'lucide-react';
import { DemoMap } from './DemoMap';
import { JournalHub } from './JournalHub';
import { Wordmark } from './Wordmark';
import { CENTER, FOODS, PLACES, type DemoPlace } from './data';
import { Modal } from './Modal';
import { ShopPhoto, SHOP_PHOTOS } from './ShopPhoto';
import { usePOIStore } from '../store/usePOIStore';
import { useLocationStore } from '../store/useLocationStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { FactCardContent } from '../components/cards/FactCardContent';
import { QuickCheckinModal } from '../components/journal/QuickCheckinModal';
import { FavouriteReviewModal } from '../components/favourite/FavouriteReviewModal';
import { ProfilePage } from './ProfilePage';
import { highlightsFor } from './highlights';
import { SettingsScreen } from '../screens/SettingsScreen';
import './demo.css';

function Splash({onDone}:{onDone:()=>void}) {
 const [progress,setProgress]=useState(0);
 useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches){onDone();return;}const start=performance.now();const id=setInterval(()=>{const p=Math.min(100,Math.round((performance.now()-start)/19));setProgress(p);if(p===100){clearInterval(id);onDone();}},40);return()=>clearInterval(id);},[onDone]);
 return <div className="coffee-splash"><div className="splash-brand"><Wordmark/></div><button className="splash-skip" onClick={onDone}>跳過 ↗</button><div className="brew"><Coffee size={110} strokeWidth={1}/><span className="brew-dot"/></div><p>一杯咖啡的時間，出發。</p><progress aria-label="開場動畫進度" value={progress} max={100}/><span className="brew-percent">{progress}%</span><small>A FRESH LITTLE START.</small></div>;
}
function finishSplash(){sessionStorage.setItem('dig-demo-intro-v2','seen');window.dispatchEvent(new Event('dig-intro-done'));}
export default function DemoApp() {
 const [tab,setTab]=useState<'map'|'search'|'journal'|'profile'|'settings'>(()=>new URLSearchParams(window.location.search).get('view')==='search'?'search':'map');
 const [splash,setSplash]=useState(()=>!sessionStorage.getItem('dig-demo-intro-v2'));
 const [selected,setSelected]=useState<DemoPlace|null>(null),[action,setAction]=useState<{place:DemoPlace;kind:'checkin'|'favourite'}|null>(null);
 const [list,setList]=useState<{places:DemoPlace[];title:string;saved?:boolean}|null>(null);
 const [query,setQuery]=useState(''),[food,setFood]=useState('all'),[toast,setToast]=useState('');
 const bookmarks=useBookmarkStore(s=>s.bookmarks);
 useEffect(()=>{document.body.dataset.digDemo='true';useLocationStore.setState({coords:{lat:CENTER[0],lng:CENTER[1]},gpsReady:true,isFallback:true});usePOIStore.setState({allPOIs:PLACES,isFetching:false,isDigging:false});const done=()=>setSplash(false);window.addEventListener('dig-intro-done',done);return()=>{delete document.body.dataset.digDemo;window.removeEventListener('dig-intro-done',done);};},[]);
 useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(id);},[toast]);
 const open=(p:DemoPlace)=>{setSelected(p);setList(null);};
 const saved=()=>setList({places:PLACES.filter(p=>bookmarks.some(b=>b.poi_id===p.id)),title:'想去的小店',saved:true});
 const results=PLACES.filter(p=>(food==='all'||p.food===food)&&`${p.name} ${p.subcategory} ${p.district}`.toLowerCase().includes(query.toLowerCase()));
 const rows=(places:DemoPlace[],rank=false)=>places.map((p,i)=><button key={p.id} className="rank-row" onClick={()=>open(p)}>{rank&&<span className={`rank-no ${i<3?'top-rank':''}`}>{String(i+1).padStart(2,'0')}</span>}<ShopPhoto place={p}/><span className="rank-text"><b>{p.name}</b><span>{p.hook_tag}</span><small>{p.subcategory} · 西營盤</small></span><ArrowUpRight size={17}/></button>);
 return <div className="demo-desktop"><div className="desktop-note"><Wordmark/><p>A little discovery,<br/>every day.</p><small>香港 · 西營盤<br/>INTERACTIVE PRODUCT DEMO</small></div><div className="demo-shell">
 {splash&&<Splash onDone={finishSplash}/>}
 <main>
 {tab==='map'&&<DemoMap onPlace={open} onGroup={(places,title)=>setList({places,title})} onSearch={()=>setTab('search')} onSaved={saved}/>}
 {tab==='search'&&<section className="demo-search"><header><button className="search-back" onClick={()=>setTab('map')}><ChevronLeft size={17}/>返回漫遊</button><div className="discovery-heading"><div><span className="eyebrow">A LITTLE TASTE OF THE CITY</span><h1>下一站，<br/><em>吃點喜歡的。</em></h1></div><span className="appetite-sticker" aria-hidden="true">🥐<small>BON APPÉTIT</small></span></div><p className="search-subtitle">沿著香氣，發現西營盤的小店。</p><div className="search-field"><Search size={19}/><input aria-label="搜尋店名或品類" placeholder="搜店名、咖啡、點心…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="search-filters"><button aria-pressed={food==='all'} onClick={()=>setFood('all')}>全部</button>{FOODS.map(f=><button key={f.id} aria-pressed={food===f.id} onClick={()=>setFood(f.id)}>{f.icon} {f.label}</button>)}</div></header><div className="search-count"><span>西營盤 <b>{results.length} 家小店</b></span><span>YOUR NEXT BITE ↘</span></div>{rows(results)}{results.length===0&&<p className="empty-state">還沒找到這家店，試試其他名稱。</p>}</section>}
 {tab==='journal'&&<JournalHub onPlace={open} onSaved={saved} onExplore={()=>setTab('map')}/>}
 {tab==='profile'&&<ProfilePage onSettings={()=>setTab('settings')} onSaved={saved} onJournal={()=>setTab('journal')}/>}
 {tab==='settings'&&<SettingsScreen onBack={()=>setTab('profile')}/>}
 </main>
 <nav className="demo-nav" aria-label="主導航">{([{id:'map',label:'漫遊',Icon:Compass},{id:'journal',label:'日誌',Icon:NotebookPen},{id:'profile',label:'我的',Icon:UserRound}] as const).map(({id,label,Icon})=><button key={id} aria-current={(tab===id||(id==='profile'&&tab==='settings')||(id==='map'&&tab==='search'))?'page':undefined} onClick={()=>setTab(id)}><Icon size={21} strokeWidth={1.7}/><span>{label}</span></button>)}</nav>
 {list&&<Modal half title={list.title} onClose={()=>setList(null)}>{!list.saved&&<div className="ranking-intro"><span className="xhs-label">小紅書靈感榜</span><span>演示排序 · 非平台真實排名</span></div>}<div className="rank-scroll">{rows(list.places,!list.saved)}{!list.places.length&&<div className="empty-state"><Bookmark size={30}/><p>{list.saved?'遇見喜歡的小店，點星星收進清單。':'這片視野還沒有這類店鋪，移動地圖再找找。'}</p></div>}</div></Modal>}
 {selected&&<Modal title="街角情報" onClose={()=>setSelected(null)}><div className="detail-photo"><ShopPhoto key={selected.id} place={selected} hero/>{SHOP_PHOTOS[selected.id]&&<a className="photo-credit" href={SHOP_PHOTOS[selected.id].source} target="_blank" rel="noreferrer">攝影 / {SHOP_PHOTOS[selected.id].credit} · {SHOP_PHOTOS[selected.id].license} ↗</a>}</div><div className={`detail-hero food-${selected.food}`}><span>{selected.emoji}</span><div><small>SAI YING PUN</small><b>{selected.hook_tag}</b><span>店鋪位置來自 OpenStreetMap</span></div></div><div className="detail-comments"><span className="eyebrow">街角情報 · 演示賣點</span><p className="highlight-disclosure">以下上新、推薦與優惠為產品演示文案，並非門店已確認的菜單或活動。</p>{highlightsFor(selected).map(h=><div key={h.text}><span>{h.icon}</span><p><b>{h.kind}</b> · {h.text}</p></div>)}</div><FactCardContent poi={selected} onClose={()=>setSelected(null)} onCheckin={()=>{setAction({place:selected,kind:'checkin'});setSelected(null);}} onFavourite={()=>{setAction({place:selected,kind:'favourite'});setSelected(null);}} onBookmarkToast={msg=>setToast(msg.includes('取消')?'已取消收藏':'已收藏到「想去的小店」')}/><p className="data-note">演示內容，不代表實際店評或營業狀態。菜系依據：{selected.cuisineSource}。<a href={selected.osmUrl} target="_blank" rel="noreferrer">查看地点資料 ↗</a></p>{toast&&<div className="inline-toast" role="status">{toast}</div>}</Modal>}
 {action?.kind==='checkin'&&<QuickCheckinModal poi={action.place} isOpen onClose={()=>{setSelected(action.place);setAction(null);}}/>}
 {action?.kind==='favourite'&&<FavouriteReviewModal poi={action.place} isOpen onClose={()=>{setSelected(action.place);setAction(null);}}/>}
 </div><div className="desktop-caption"><span>01 / SAI YING PUN</span><p>咖啡香、老街，<br/>和你的下一個小發現。</p><small>拖動地圖探索 · 點食物圖標看店鋪<br/>榜單及評論為演示內容</small></div></div>;
}
