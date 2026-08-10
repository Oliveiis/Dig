import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CheckinEntry, JournalEntry } from '../types/poi';

function syncCheckin(entry: CheckinEntry) {
  fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 'demo-user',
      place_id: entry.poi_id,
      feedback_type: entry.reaction,
      note: entry.text_note ?? null,
    }),
  }).catch(() => {
    // A traveller can still journal offline; sync can retry in a later release.
  });
}

interface JournalStore {
  checkins: CheckinEntry[];
  journals: JournalEntry[];
  addCheckin: (entry: CheckinEntry) => void;
  addJournal: (entry: JournalEntry) => void;
  hasCheckedIn: (poi_id: string) => boolean;
}

export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
      checkins: [],
      journals: [
        {
          id: 'j1',
          title: '那個週六我在西營盤喝了三杯咖啡',
          content: '從 My Little Cup 的燕麥拿鐵開始，到 Cupping Room 的手冲，最後在一家沒有名字的窗口小店結束。這條街的密度讓人上癮……',
          tags: ['精品咖啡', '西營盤', '週末漫遊'],
          poi_ids: ['hkg-001', 'hkg-002'],
          created_at: '2026-03-20T10:00:00Z'
        },
        {
          id: 'j2',
          title: '亞洲最佳酒吧到底值不值得排45分鐘',
          content: 'The Old Man 的 Negroni 讓我重新理解了什麼叫做「平衡感」。等位的時間很痛苦，但進去的那一刻完全值得……',
          tags: ['調酒', '中環', '亞洲50最佳'],
          poi_ids: ['hkg-006'],
          created_at: '2026-02-15T22:30:00Z'
        }
      ],
      addCheckin: (entry) => {
        set((state) => ({ checkins: [...state.checkins, entry] }));
        syncCheckin(entry);
      },
      addJournal: (entry) => set((state) => ({
        journals: [entry, ...state.journals]
      })),
      hasCheckedIn: (poi_id) => get().checkins.some(c => c.poi_id === poi_id),
    }),
    { name: 'dig-journal' }
  )
);
