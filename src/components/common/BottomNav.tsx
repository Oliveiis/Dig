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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-app-bg border-t border-app-border flex items-center justify-around px-6 z-50">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id as any)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === id ? 'text-app-accent' : 'text-app-text2'
          }`}
        >
          <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 2} />
          <span className="text-[10px] font-sans font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
