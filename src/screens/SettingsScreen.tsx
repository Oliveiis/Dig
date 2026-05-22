import { useState } from 'react';
import { useUserStore } from '../store/useUserStore';
import { ChevronLeft, Camera, User, Hash, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { profile, updateProfile } = useUserStore();
  const [name, setName] = useState(profile.name);

  const handleSave = () => {
    updateProfile({ name });
    onBack();
  };

  return (
    <div className="w-full h-full bg-app-bg flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between border-b border-app-border bg-app-bg">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-[17px] font-bold font-display text-app-text">賬戶設置</h2>
        <button 
          onClick={handleSave}
          className="text-[13px] font-bold font-mono text-app-text uppercase tracking-wider"
        >
          儲存
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-app-accent flex items-center justify-center text-white text-3xl font-bold font-display">
              {profile.avatar}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text shadow-sm">
              <Camera size={14} />
            </button>
          </div>
          <p className="text-[10px] font-mono text-app-text3 uppercase tracking-widest">點擊更換頭像</p>
        </div>

        {/* Form Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-app-text3 uppercase tracking-widest ml-1">用戶暱稱</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text3" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 bg-app-surface border border-app-border rounded-2xl pl-12 pr-4 text-[15px] font-bold text-app-text focus:border-app-accent transition-colors outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono text-app-text3 uppercase tracking-widest ml-1">Dig ID</label>
            <div className="relative opacity-50">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text3" />
              <input 
                type="text" 
                value={profile.id}
                readOnly
                className="w-full h-14 bg-app-surface border border-app-border rounded-2xl pl-12 pr-4 text-[15px] font-mono text-app-text outline-none cursor-not-allowed"
              />
            </div>
            <p className="text-[9px] font-mono text-app-text3 ml-1">ID 目前不可修改</p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-auto pt-8">
          <button className="w-full h-14 border border-app-red/20 text-app-red font-bold rounded-2xl flex items-center justify-center gap-2 active:bg-app-red/5 transition-colors">
            <LogOut size={18} />
            退出登錄
          </button>
        </div>
      </div>
    </div>
  );
}
