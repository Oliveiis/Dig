import { Settings } from 'lucide-react';
import { TasteProfile } from '../../types/poi';

interface UserProfileProps {
  profile: TasteProfile;
  onSettingsClick: () => void;
}

export function UserProfile({ profile, onSettingsClick }: UserProfileProps) {
  return (
    <div className="relative flex flex-col gap-6">
      <button 
        onClick={onSettingsClick}
        className="absolute top-0 right-0 w-10 h-10 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-text2 active:scale-95 transition-transform"
      >
        <Settings size={20} />
      </button>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full border-2 border-app-accent p-1">
          <img 
            src="https://picsum.photos/seed/user123/200/200" 
            alt="Avatar" 
            className="w-full h-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-app-text font-display">Jiayi</h2>
          <p className="text-xs font-mono text-app-text3 uppercase tracking-widest mt-0.5">ID: DIG_725_HKG</p>
          <div className="mt-2 flex">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] text-white text-[10px] font-mono uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-app-accent" />
              {profile.persona_label}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-app-accent/5 border border-app-accent/20 rounded-2xl p-4">
        <h3 className="text-[10px] font-mono text-app-accent uppercase tracking-widest mb-2">人設分析 Persona Analysis</h3>
        <p className="text-[13px] text-app-text leading-relaxed italic">
          「{profile.one_liner}」
        </p>
        
        {profile.dimensions.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {profile.dimensions.map((dim, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-app-text3 uppercase tracking-wider">{dim.label}</span>
                </div>
                <div className="h-1 bg-app-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-app-accent transition-all duration-1000" 
                    style={{ width: `${dim.value}%` }} 
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-[8px] font-mono text-app-text3 uppercase tracking-tighter">{dim.left_label}</span>
                  <span className="text-[8px] font-mono text-app-text3 uppercase tracking-tighter">{dim.right_label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {profile.top_skus.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.top_skus.map((sku, idx) => (
              <span key={idx} className={`px-2 py-1 rounded-md text-[9px] font-mono uppercase tracking-wider border ${idx === 0 ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-white text-app-text3 border-app-border'}`}>
                {sku.name} ×{sku.count}
              </span>
            ))}
            <span className="px-2 py-1 rounded-md text-[9px] font-mono uppercase tracking-wider bg-white text-app-text3 border border-app-border">
              {profile.top_district}最常出沒
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
