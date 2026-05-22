import { X, Image as ImageIcon, List, Bold, Type, Send } from 'lucide-react';
import { useState } from 'react';
import { useJournalStore } from '../../store/useJournalStore';
import { motion } from 'motion/react';

interface JournalEditorProps {
  onClose: () => void;
}

export function JournalEditor({ onClose }: JournalEditorProps) {
  const { addJournal } = useJournalStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const handlePublish = () => {
    if (!title || !content) return;
    
    addJournal({
      id: Math.random().toString(36).substr(2, 9),
      title,
      content,
      cover_image: coverImage || undefined,
      tags: ['漫遊', '日誌'],
      poi_ids: [],
      created_at: new Date().toISOString()
    });
    
    onClose();
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[5000] flex flex-col"
    >
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-app-border shrink-0">
        <button onClick={onClose} className="text-app-text2">
          <X size={24} />
        </button>
        <h2 className="text-[16px] font-bold text-app-text">編輯日誌</h2>
        <button 
          onClick={handlePublish}
          disabled={!title || !content}
          className="px-4 py-1.5 bg-app-accent text-app-bg rounded-full text-[13px] font-bold disabled:opacity-30"
        >
          發佈
        </button>
      </header>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* Cover Image Placeholder */}
        <div 
          onClick={() => setCoverImage('https://picsum.photos/seed/journal/800/400')}
          className="w-full aspect-[2/1] bg-app-surface border-2 border-dashed border-app-border rounded-2xl flex flex-col items-center justify-center gap-2 text-app-text3 cursor-pointer overflow-hidden"
        >
          {coverImage ? (
            <img src={coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <>
              <ImageIcon size={32} strokeWidth={1} />
              <span className="text-[11px] font-mono uppercase tracking-widest">添加頭圖 Add Cover</span>
            </>
          )}
        </div>

        {/* Title Input */}
        <input 
          type="text" 
          placeholder="輸入標題..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold text-app-text placeholder:text-app-text3 border-none outline-none font-display"
        />

        {/* Content Input */}
        <textarea 
          placeholder="開始你的城市漫遊日誌..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 text-[15px] text-app-text2 leading-relaxed placeholder:text-app-text3 border-none outline-none resize-none min-h-[300px]"
        />
      </div>

      {/* Toolbar */}
      <div className="h-14 px-6 border-t border-app-border flex items-center gap-8 text-app-text2 shrink-0">
        <button><Type size={20} /></button>
        <button><Bold size={20} /></button>
        <button><List size={20} /></button>
        <button><ImageIcon size={20} /></button>
        <div className="flex-1" />
        <button className="text-app-accent"><Send size={20} /></button>
      </div>
    </motion.div>
  );
}
