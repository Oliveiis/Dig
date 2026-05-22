import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { POI } from '../../types/poi';
import { FactCardContent } from './FactCardContent';

interface FactCardProps {
  poi: POI;
  onClose: () => void;
  onCheckin?: () => void;
  onFavourite?: () => void;
}

export const FactCard: React.FC<FactCardProps> = ({ poi, onClose, onCheckin, onFavourite }) => {
  const [dragY, setDragY] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const startYRef = useRef<number | null>(null);

  const dismiss = () => {
    setExiting(true);
    setTimeout(onClose, 250);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setDragY(delta);
  };

  const onTouchEnd = () => {
    if (dragY > 80) {
      dismiss();
    } else {
      setDragY(0);
    }
    startYRef.current = null;
  };

  const handleBookmarkToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px]"
        style={{ zIndex: 9998 }}
        onClick={dismiss}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white overflow-hidden flex flex-col"
        style={{
          zIndex: 9999,
          borderRadius: '20px 20px 0 0',
          maxHeight: '85dvh',
          transform: `translateY(${dragY}px)`,
          animation: exiting
            ? 'sheet-down 250ms cubic-bezier(0.4,0,0.2,1) forwards'
            : 'sheet-up 300ms cubic-bezier(0.4,0,0.2,1) forwards',
          transition: dragY === 0 && !exiting ? 'transform 200ms ease' : 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-[14px] cursor-grab">
          <div className="w-9 h-[3px] rounded-full bg-[#e0e0e0]" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <FactCardContent
            poi={poi}
            onClose={dismiss}
            onCheckin={onCheckin ?? (() => {})}
            onFavourite={onFavourite ?? (() => {})}
            onBookmarkToast={handleBookmarkToast}
          />
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white px-5 py-2.5 rounded-full whitespace-nowrap"
          style={{ zIndex: 10000 }}
        >
          <span className="font-mono text-[11px]">{toastMsg}</span>
        </div>
      )}

      <style>{`
        @keyframes sheet-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes sheet-down {
          from { transform: translateY(0); }
          to   { transform: translateY(100%); }
        }
      `}</style>
    </>,
    document.body
  );
};
