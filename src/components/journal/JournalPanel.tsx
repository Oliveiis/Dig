import { useState } from 'react';
import { Plus, ArrowUpRight } from 'lucide-react';
import { useJournalStore } from '../../store/useJournalStore';
import type { CheckinEntry, JournalEntry } from '../../types/poi';
import { Modal } from '../../demo/Modal';

export function JournalPanel({ checkins }: {checkins: CheckinEntry[]}) {
 const {journals,addJournal}=useJournalStore();
 const [editor,setEditor]=useState(false),[entry,setEntry]=useState<JournalEntry|null>(null);
 const [title,setTitle]=useState(''),[content,setContent]=useState('');
 return <div className="journal-cards">
  <div className="journal-card-toolbar"><span>把喜歡的日常，留下來。</span><button aria-label="寫一篇日誌" onClick={()=>setEditor(true)}><Plus size={16}/>寫日誌</button></div>
  {journals.map((j,i)=><button key={j.id} className="journal-card" onClick={()=>setEntry(j)}>
   <div className={`journal-card-art art-${i%3}`}>
    {j.cover_image?<img src={j.cover_image} alt="日誌封面"/>:<><span className="diary-sticker sticker-a">{i%2?'NIGHT<br/>WALK'.split('<br/>').map((t,k)=><span key={k}>{t}</span>):<><span>COFFEE</span><b>CLUB</b><span>西營盤</span></>}</span><span className="diary-sticker sticker-b">{i%2?'🌙':'☕'}</span><span className="diary-sticker sticker-c">{i%2?'GOOD<br/>NIGHTS'.split('<br/>').map((t,k)=><span key={k}>{t}</span>):<><span>SLOW</span><span>MORNINGS</span><b>🥐</b></>}</span></>}
   </div>
   <div className="journal-card-copy"><span className="eyebrow">{new Date(j.created_at).toLocaleDateString('zh-HK')}{['j1','j2'].includes(j.id)?' · 示例日誌':''}</span><h3>{j.title}</h3><p>{j.content}</p><div className="journal-card-footer"><span>{j.tags.slice(0,2).map(t=><span key={t}>#{t} </span>)}</span><ArrowUpRight size={17}/></div></div>
  </button>)}
  {journals.length===0&&<p className="empty-state">從一杯咖啡開始，寫下第一篇街角日誌。</p>}
  {editor&&<Modal title="今天，想記住什麼？" onClose={()=>setEditor(false)}><form className="journal-form" onSubmit={e=>{e.preventDefault();if(!title.trim()||!content.trim())return;addJournal({id:crypto.randomUUID(),title:title.trim(),content:content.trim(),tags:['西營盤','城市漫遊'],poi_ids:[],created_at:new Date().toISOString()});setEditor(false);setTitle('');setContent('');}}><label>標題<input value={title} maxLength={80} onChange={e=>setTitle(e.target.value)} placeholder="在哪個街角停下來？" required/></label><label>今天的故事<textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="一杯咖啡、一份點心，或是一個想記住的瞬間。" required/></label><small>只保存在這台裝置，不會公開發佈。</small><button className="primary-button" disabled={!title.trim()||!content.trim()}>保存日誌</button></form></Modal>}
  {entry&&<Modal title="街角日誌" onClose={()=>setEntry(null)}><article className="full-entry"><span className="eyebrow">{new Date(entry.created_at).toLocaleDateString('zh-HK')}</span><h2>{entry.title}</h2><p>{entry.content}</p><div>{entry.tags.map(t=><span key={t} className="journal-tag">#{t}</span>)}</div>{entry.poi_ids.length>0&&<small>{checkins.filter(c=>entry.poi_ids.includes(c.poi_id)).length} 個已打卡地點</small>}</article></Modal>}
 </div>;
}
