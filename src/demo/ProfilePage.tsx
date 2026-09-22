import { useMemo } from 'react';
import { Settings, ArrowUpRight } from 'lucide-react';
import { useJournalStore } from '../store/useJournalStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useFavouriteStore } from '../store/useFavouriteStore';
import { useUserStore } from '../store/useUserStore';
import { generatePersona } from '../services/personaService';
import { PersonaPanel } from '../components/journal/PersonaPanel';

export function ProfilePage({ onSettings, onSaved, onJournal }: { onSettings: () => void; onSaved: () => void; onJournal: () => void }) {
  const profile = useUserStore(s => s.profile);
  const checkins = useJournalStore(s => s.checkins);
  const journals = useJournalStore(s => s.journals);
  const bookmarks = useBookmarkStore(s => s.bookmarks);
  const favourites = useFavouriteStore(s => s.favourites);
  const persona = useMemo(() => generatePersona(checkins, favourites), [checkins, favourites]);
  return <section className="demo-profile">
    <header className="profile-heading"><span className="eyebrow">MY LITTLE CORNER</span><button className="round-button" aria-label="設定" onClick={onSettings}><Settings size={19}/></button><h1>每次出發，<br/><em>都更像自己。</em></h1></header>
    <div className="profile-identity"><span className="profile-avatar">{profile.avatar}</span><div><h2>{profile.name}</h2><p>{profile.id}</p><span className="persona-chip">{persona.emoji} {persona.title}</span></div><span className="profile-sticker" aria-hidden="true">little<br/>joys ✧</span></div>
    <div className="profile-stats"><div><b>{checkins.length}</b><span>打卡</span></div><div><b>{favourites.length}</b><span>喜愛</span></div><button onClick={onSaved}><b>{bookmarks.length}</b><span>收藏 ↗</span></button><button onClick={onJournal}><b>{journals.length}</b><span>手記 ↗</span></button></div>
    <div className="profile-links"><button aria-label="開啟我的收藏" onClick={onSaved}><span aria-hidden="true">🔖</span><div><b>我的收藏</b><small>那些想去的小店</small></div><ArrowUpRight size={16}/></button><button aria-label="開啟集章與手記" onClick={onJournal}><span aria-hidden="true">📒</span><div><b>我的集章與手記</b><small>把喜歡收集起來</small></div><ArrowUpRight size={16}/></button></div>
    <h2 className="profile-section-title">人設 & 足跡 <span>A TASTE OF YOU</span></h2>
    <div className="profile-persona"><PersonaPanel persona={persona} checkins={checkins}/></div>
  </section>;
}
