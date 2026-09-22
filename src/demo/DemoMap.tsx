import { useEffect, useMemo, useRef, useState } from 'react';
import { Map as PigeonMap, Overlay } from 'pigeon-maps';
import { ArrowUpRight, Bookmark, LocateFixed, Minus, Plus, Search, Pause, Play } from 'lucide-react';
import { CENTER, FOODS, PLACES, groupPlaces, screenPoint, type DemoPlace } from './data';
import { localTiles } from './mapTiles';
import { highlightsFor } from './highlights';
import { Wordmark } from './Wordmark';
export function DemoMap({onPlace,onGroup,onSearch,onSaved}:{onPlace:(p:DemoPlace)=>void;onGroup:(p:DemoPlace[],title:string)=>void;onSearch:()=>void;onSaved:()=>void}) {
 const [center,setCenter]=useState<[number,number]>(CENTER), [zoom,setZoom]=useState(17);
 const [size,setSize]=useState({width:430,height:800}); const ref=useRef<HTMLDivElement>(null);
 const [tick,setTick]=useState(0),[paused,setPaused]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const observer=new ResizeObserver(([e])=>setSize({width:e.contentRect.width,height:e.contentRect.height}));if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{if(paused)return;const id=setInterval(()=>setTick(t=>t+1),5200);return()=>clearInterval(id);},[paused]);
 const visible=useMemo(()=>PLACES.filter(p=>{const pt=screenPoint(p,center,zoom,size.width,size.height);return pt.x>24&&pt.x<size.width-24&&pt.y>132&&pt.y<size.height-180;}),[center,zoom,size]);
 const groups=useMemo(()=>groupPlaces(visible,zoom),[visible,zoom]);
 const commentCandidates=groups.map(g=>g[0]).filter(p=>{const pt=screenPoint(p,center,zoom,size.width,size.height);return pt.x>122&&pt.x<size.width-122&&pt.y>220&&pt.y<size.height-205;});
 const active=commentCandidates.length?commentCandidates[tick%commentCandidates.length]:null;
 const highlights=active?highlightsFor(active):[];
 const highlight=highlights[Math.floor(tick/Math.max(commentCandidates.length,1))%Math.max(highlights.length,1)];
 return <section ref={ref} className="demo-map" aria-label="西營盤美食地圖">
 <PigeonMap center={center} zoom={zoom} minZoom={15} maxZoom={19} provider={localTiles} attributionPrefix={false}
  attribution={<span>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · 西營盤離線底圖</span>}
  onBoundsChanged={({center:c,zoom:z})=>{setCenter([Math.max(22.282,Math.min(22.289,c[0])),Math.max(114.133,Math.min(114.143,c[1]))]);setZoom(z);}}>
  <Overlay anchor={[22.2861,114.1411]}><div className="neighborhood-label">西營盤<span>SAI YING PUN</span></div></Overlay>
  {groups.map(g=><Overlay key={g.map(p=>p.id).join('-')} anchor={[g[0].coordinates.lat,g[0].coordinates.lng]}>
    <button className={`food-marker ${active?.id===g[0].id?'speaking':''}`} aria-label={g.length>1?`${g[0].name} 附近 ${g.length} 家店`:g[0].name} onClick={e=>{e.stopPropagation();g.length>1?onGroup(g,'這個街角的小店'):onPlace(g[0]);}}>
     <span className="food-emoji" aria-hidden="true">{g[0].emoji}</span>{g.length>1&&<b className="marker-count">{g.length}</b>}
     {zoom>=18&&g.length===1&&g[0].priority<99&&<span className="marker-name">{g[0].name}</span>}
    </button>
  </Overlay>)}
  {active&&highlight&&<Overlay anchor={[active.coordinates.lat,active.coordinates.lng]}><button key={active.id+'-'+tick} className="comment-pill" aria-label={`查看 ${active.name} 的賣點與詳情`} onClick={e=>{e.stopPropagation();onPlace(active);}}><span className="highlight-icon" aria-hidden="true">{highlight.icon}</span><span><small><b>{highlight.kind}</b> · {active.name}</small><strong>{highlight.text}</strong></span><ArrowUpRight size={15}/></button></Overlay>}
 </PigeonMap>
 <header className="map-header"><div className="brand"><Wordmark/><small>走進街角的小日常</small></div><button className="header-saved" onClick={onSaved}><Bookmark size={15}/>我的收藏</button><button className="round-button" aria-label="搜尋店鋪" onClick={onSearch}><Search size={20}/></button></header>
 <div className="location-chip"><span className="location-dot"/>香港 · 西營盤</div>
 <div className="map-tools"><button className="round-button" aria-label="放大地圖" onClick={()=>setZoom(z=>Math.min(19,z+1))}><Plus size={20}/></button><button className="round-button" aria-label="縮小地圖" onClick={()=>setZoom(z=>Math.max(15,z-1))}><Minus size={20}/></button><button className="round-button" aria-label="回到西營盤" onClick={()=>{setCenter(CENTER);setZoom(17);}}><LocateFixed size={19}/></button><button className="round-button" aria-label={paused?'播放店鋪情報':'暫停店鋪情報'} title={paused?'播放店鋪情報':'暫停店鋪情報'} onClick={()=>setPaused(p=>!p)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></div>
 <div className="map-bottom">
 <div className="food-dock" aria-label="可見區域美食分類">{FOODS.map(f=>{const ps=visible.filter(p=>p.food===f.id);return <button key={f.id} aria-label={`${f.label}，${ps.length} 家，查看榜單`} onClick={()=>onGroup(ps,`${f.label}靈感榜`)}><span className="dock-icon">{f.icon}<b>{ps.length}</b></span><span>{f.label}</span></button>;})}</div>
 </div>
 </section>;
}
