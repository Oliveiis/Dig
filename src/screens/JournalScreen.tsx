import { useState, useRef, useEffect, useMemo } from 'react';
import { useJournalStore } from '../store/useJournalStore';
import { useFavouriteStore } from '../store/useFavouriteStore';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { useUserStore } from '../store/useUserStore';
import { generatePersona } from '../services/personaService';
import { PersonaPanel } from '../components/journal/PersonaPanel';
import { JournalPanel } from '../components/journal/JournalPanel';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';

export function JournalScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { checkins } = useJournalStore();
  const { favourites } = useFavouriteStore();
  const { bookmarks } = useBookmarkStore();
  const { profile } = useUserStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'journal'>('profile');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const persona = useMemo(() => generatePersona(checkins, favourites), [checkins, favourites]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const y = scrollRef.current.scrollTop;
      if (y > 60 && !isCollapsed) {
        setIsCollapsed(true);
      } else if (y <= 20 && isCollapsed) {
        setIsCollapsed(false);
      }
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [isCollapsed]);

  return (
    <div className="w-full h-full bg-app-bg flex flex-col overflow-hidden">
      {/* Expanded Header */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.header 
            initial={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pt-12 pb-4 flex flex-col gap-6 relative"
          >
            <button 
              onClick={onOpenSettings}
              className="absolute top-12 right-6 w-10 h-10 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text active:scale-95 transition-transform"
            >
              <Settings size={20} />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-app-accent flex items-center justify-center text-white text-xl font-bold font-display">
                {profile.avatar}
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-app-text">{profile.name}</h2>
                <p className="text-[10px] font-mono text-app-text2 mt-0.5">{profile.id}</p>
                <div className="inline-flex items-center gap-1.5 bg-app-accent text-white px-2.5 py-1 rounded-full mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-app-cafe" />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{persona.title}</span>
                </div>
              </div>
            </div>

            <div className="flex border-t border-app-border pt-4">
              <div className="flex-1 text-center border-r border-app-border">
                <span className="block text-[17px] font-bold font-display text-app-text">{checkins.length}</span>
                <span className="block text-[9px] font-mono text-app-text3 uppercase mt-0.5">打卡</span>
              </div>
              <div className="flex-1 text-center border-r border-app-border">
                <span className="block text-[17px] font-bold font-display text-app-text">{favourites.length}</span>
                <span className="block text-[9px] font-mono text-app-text3 uppercase mt-0.5">喜愛</span>
              </div>
              <div className="flex-1 text-center border-r border-app-border">
                <span className="block text-[17px] font-bold font-display text-app-text">{bookmarks.length}</span>
                <span className="block text-[9px] font-mono text-app-text3 uppercase mt-0.5">收藏</span>
              </div>
              <div className="flex-1 text-center">
                <span className="block text-[17px] font-bold font-display text-app-text">5</span>
                <span className="block text-[9px] font-mono text-app-text3 uppercase mt-0.5">日誌</span>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Collapsed Header */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.header 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-6 py-3 border-b border-app-border flex items-center gap-3 bg-app-bg z-10"
          >
            <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center text-white text-xs font-bold font-display">
              {profile.avatar}
            </div>
            <h2 className="text-[14px] font-bold text-app-text">{profile.name}</h2>
            <div className="ml-auto inline-flex items-center gap-1.5 bg-app-accent text-white px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-app-cafe" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{persona.title}</span>
            </div>
            <button 
              onClick={onOpenSettings}
              className="w-8 h-8 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text active:scale-95 transition-transform ml-1"
            >
              <Settings size={16} />
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex border-b border-app-border bg-app-bg sticky top-0 z-10">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 text-[11px] font-mono transition-all relative ${
            activeTab === 'profile' ? 'text-app-text font-bold' : 'text-app-text3'
          }`}
        >
          人設 & 足跡
          {activeTab === 'profile' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-app-accent rounded-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('journal')}
          className={`flex-1 py-3 text-[11px] font-mono transition-all relative ${
            activeTab === 'journal' ? 'text-app-text font-bold' : 'text-app-text3'
          }`}
        >
          日誌
          {activeTab === 'journal' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-app-accent rounded-full" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 pt-6 pb-32 no-scrollbar"
      >
        {activeTab === 'profile' ? (
          <PersonaPanel persona={persona} checkins={checkins} />
        ) : (
          <JournalPanel checkins={checkins} />
        )}
      </div>
    </div>
  );
}

