import React from 'react';
import { useJournalStore } from '../../store/useJournalStore';
import { useFavouriteStore } from '../../store/useFavouriteStore';
import { MapPin, Heart, MessageSquare } from 'lucide-react';

export const TimelineFeed: React.FC = () => {
  const { checkins } = useJournalStore();
  const { favourites } = useFavouriteStore();

  const events = [
    ...checkins.map(c => ({ ...c, type: 'checkin' as const, date: new Date(c.visited_at) })),
    ...favourites.map(f => ({ ...f, type: 'favourite' as const, date: new Date(f.favourited_at) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (events.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-mono text-[12px] text-text3">這裡還空空如也...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Time Axis */}
      <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-border2 z-0" />

      {events.map((event, i) => {
        const isCheckin = event.type === 'checkin';
        const date = event.date;
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

        return (
          <div key={i} className="relative pl-10 z-10">
            {/* Dot */}
            <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm
              ${isCheckin ? 'bg-text text-white' : 'bg-red-custom text-white'}
            `}>
              {isCheckin ? <MapPin size={12} /> : <Heart size={12} fill="currentColor" />}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-text">{dateStr}</span>
                <span className="font-mono text-[10px] text-text3">{timeStr}</span>
              </div>
              
              <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
                <h4 className="font-sans font-bold text-[15px] mb-2">{event.poi_name}</h4>
                
                {isCheckin ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-surface2 rounded font-mono text-[10px] text-text2 uppercase">
                      {event.reaction === 'comeback' ? '值得再來' : 
                       event.reaction === 'regret' ? '踩雷了' : '打卡'}
                    </span>
                    {event.text_note && (
                      <p className="font-sans text-[13px] text-text2 line-clamp-2">{event.text_note}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {event.review?.vibe_tags.map(tag => (
                        <span key={tag} className="text-red-custom font-sans text-[11px] font-medium">#{tag}</span>
                      ))}
                    </div>
                    {event.review?.text_note && (
                      <div className="flex gap-2 items-start bg-red-custom/5 p-3 rounded-xl">
                        <MessageSquare size={14} className="text-red-custom mt-0.5 flex-shrink-0" />
                        <p className="font-sans text-[13px] text-text2">{event.review.text_note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
