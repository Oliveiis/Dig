import { CheckinEntry } from '../../types/poi';

interface JournalPanelProps {
  checkins: CheckinEntry[];
}

export function JournalPanel({ checkins }: JournalPanelProps) {
  // Mock journal entries based on checkins
  const journals = [
    {
      date: "2026年3月 · 西營盤漫遊",
      title: "那個週六我在西營盤喝了三杯咖啡",
      body: "從 My Little Cup 的燕麥拿鐵開始，到 Cupping Room 的手冲，最後在一家沒有名字的窗口小店結束。這條街的密度讓人上癮……",
      tags: ["精品咖啡", "西營盤", "週末漫遊"],
      stops: ["☕", "☕", "☕"],
      count: 3
    },
    {
      date: "2026年2月 · 中環深夜",
      title: "亞洲最佳酒吧到底值不值得排45分鐘",
      body: "The Old Man 的 Negroni 讓我重新理解了什麼叫做「平衡感」。等位的時間很痛苦，但進去的那一刻完全值得……",
      tags: ["調酒", "中環", "亞洲50最佳"],
      stops: ["🍸"],
      count: 1
    },
    {
      date: "2026年1月 · 上環探店",
      title: "一個人的上環下午，找到了三家從未見過的店",
      body: "沒有計劃，沒有攻略，只帶著 Dig 和一雙腿。上環的密度永遠讓我驚喜，每次轉角都是新的發現……",
      tags: ["上環", "買手店", "漫無目的"],
      stops: ["☕", "🧥", "🍜"],
      count: 3
    }
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {journals.map((j, i) => (
        <div key={i} className="flex flex-col gap-3 pb-8 border-b border-app-border last:border-none">
          <div className="text-[9px] font-mono text-app-text3 uppercase tracking-wider">{j.date}</div>
          <h3 className="text-[17px] font-bold font-display text-app-text leading-tight">{j.title}</h3>
          <div className="w-full aspect-[16/7] bg-app-surface border border-app-border rounded-2xl flex items-center justify-center">
            <span className="text-[10px] font-mono text-app-text3 uppercase tracking-widest">📷 封面照片</span>
          </div>
          <p className="text-[13px] text-app-text2 leading-relaxed">
            {j.body}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {j.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full border border-app-border text-[9px] font-mono text-app-text3">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex gap-1.5">
              {j.stops.map((s, idx) => (
                <div key={idx} className="w-6 h-6 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-[11px]">
                  {s}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-mono text-app-text3 uppercase tracking-wider">
              {j.count} 個打卡 · 閱讀全文 →
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
