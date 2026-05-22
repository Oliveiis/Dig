import { useState } from 'react';
import { LayoutGrid, Clock, Image as ImageIcon } from 'lucide-react';
import { CheckinEntry, JournalEntry } from '../../types/poi';

interface JournalHistoryProps {
  checkins: CheckinEntry[];
  journals: JournalEntry[];
}

export function JournalHistory({ checkins, journals }: JournalHistoryProps) {
  const [view, setView] = useState<'timeline' | 'gallery'>('timeline');

  // If we have journals, we prioritize showing them in this component
  // If we only have checkins (legacy), we show them
  const hasJournals = journals.length > 0;
  
  const sortedJournals = [...journals].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const sortedCheckins = [...checkins].sort((a, b) => 
    new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-mono text-app-text3 uppercase tracking-widest">
          {hasJournals ? '日誌歷史 Journal History' : '打卡記錄 Check-in History'}
        </h3>
        <div className="flex bg-app-surface border border-app-border rounded-lg p-0.5">
          <button 
            onClick={() => setView('timeline')}
            className={`p-1.5 rounded-md transition-all ${view === 'timeline' ? 'bg-white shadow-sm text-app-accent' : 'text-app-text3'}`}
          >
            <Clock size={14} />
          </button>
          <button 
            onClick={() => setView('gallery')}
            className={`p-1.5 rounded-md transition-all ${view === 'gallery' ? 'bg-white shadow-sm text-app-accent' : 'text-app-text3'}`}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {view === 'timeline' ? (
        <div className="flex flex-col gap-8 pl-2 relative">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-app-border" />
          
          {hasJournals ? (
            sortedJournals.map((entry) => (
              <div key={entry.id} className="relative pl-8">
                <div className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-app-accent border-2 border-app-bg" />
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-mono text-app-text3 uppercase tracking-widest">
                    {new Date(entry.created_at).toLocaleDateString('zh-HK', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <div className="bg-white border border-app-border rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform">
                    {entry.cover_image && (
                      <img 
                        src={entry.cover_image} 
                        className="w-full h-40 object-cover border-b border-app-border"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="p-4">
                      <h4 className="text-[16px] font-bold text-app-text mb-2 leading-tight">{entry.title}</h4>
                      <p className="text-[13px] text-app-text2 leading-relaxed line-clamp-3">{entry.content}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.tags.map((tag, idx) => (
                          <span key={idx} className="text-[9px] font-mono text-app-text3 uppercase tracking-wider bg-app-surface px-2 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            sortedCheckins.map((entry, idx) => (
              <div key={idx} className="relative pl-8">
                <div className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-app-accent border-2 border-app-bg" />
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-app-text3 uppercase tracking-widest">
                    {new Date(entry.visited_at).toLocaleDateString()} · {new Date(entry.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="bg-white border border-app-border rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {entry.reaction === 'comeback' ? '✨' : entry.reaction === 'as_expected' ? '👌' : entry.reaction === 'nothing_special' ? '😐' : '💣'}
                      </span>
                      <h4 className="text-[15px] font-bold text-app-text">{entry.poi_name}</h4>
                    </div>
                    {entry.text_note && <p className="text-[13px] text-app-text2 leading-relaxed">{entry.text_note}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {hasJournals ? (
            sortedJournals.map((entry) => (
              <div key={entry.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-app-border group bg-app-surface">
                {entry.cover_image ? (
                  <img 
                    src={entry.cover_image} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-app-text3">
                    <ImageIcon size={32} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <h4 className="text-white text-[13px] font-bold leading-tight mb-1">{entry.title}</h4>
                  <p className="text-white/70 text-[9px] font-mono uppercase">{new Date(entry.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            sortedCheckins.filter(c => c.photo_url).map((entry, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-app-border group">
                <img 
                  src={entry.photo_url!} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3">
                  <h4 className="text-white text-[11px] font-bold truncate">{entry.poi_name}</h4>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
