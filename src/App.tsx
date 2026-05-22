import { useState } from 'react';
import { WanderScreen } from './screens/WanderScreen';
import { SearchScreen } from './screens/SearchScreen';
import { JournalScreen } from './screens/JournalScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { BottomNav } from './components/common/BottomNav';
import { useGeolocation } from './hooks/useGeolocation';

export default function App() {
  const [activeTab, setActiveTab] = useState<'wander' | 'search' | 'journal' | 'settings'>('wander');
  
  // Initialize geolocation
  useGeolocation();

  const renderScreen = () => {
    switch (activeTab) {
      case 'wander':
        return <WanderScreen />;
      case 'search':
        return <SearchScreen />;
      case 'journal':
        return <JournalScreen onOpenSettings={() => setActiveTab('settings')} />;
      case 'settings':
        return <SettingsScreen onBack={() => setActiveTab('journal')} />;
      default:
        return <WanderScreen />;
    }
  };

  return (
    <div className="w-full h-screen bg-app-bg relative overflow-hidden flex flex-col">
      <main className="flex-1 relative overflow-hidden">
        {renderScreen()}
      </main>
      
      <BottomNav 
        activeTab={activeTab === 'settings' ? 'journal' : activeTab} 
        onTabChange={(tab) => setActiveTab(tab as any)} 
      />
    </div>
  );
}
