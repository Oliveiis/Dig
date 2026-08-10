import { Compass, Search, BookOpen } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'wander' | 'search' | 'journal';
  onTabChange: (tab: 'wander' | 'search' | 'journal') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'wander', label: '漫遊', icon: Compass },
    { id: 'search', label: '搜索', icon: Search },
    { id: 'journal', label: '日誌', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex h-[68px] w-full max-w-[430px] -translate-x-1/2 items-center justify-around bg-white px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_8px_rgba(24,50,58,0.08)]">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id as any)}
          aria-label={label}
          aria-current={activeTab === id ? 'page' : undefined}
          className={`flex-1 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-[color,background-color,transform] active:scale-95 ${
            activeTab === id ? 'text-app-accent bg-accent-soft' : 'text-app-text3'
          }`}
        >
          <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
          <span className="text-[10px] font-sans font-semibold">{label}</span>
        </button>
      ))}
    </nav>
  );
}
