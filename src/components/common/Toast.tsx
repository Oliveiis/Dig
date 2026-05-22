import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
  message: string | null;
  onClear: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClear }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClear, 2000);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 bg-text text-white px-6 py-3 rounded-full z-[100] shadow-xl whitespace-nowrap"
        >
          <span className="font-mono text-[11px]">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export function useToast() {
  const [message, setMessage] = React.useState<string | null>(null);
  
  const showToast = (msg: string) => setMessage(msg);
  const clearToast = () => setMessage(null);
  
  const ToastComponent = () => (
    <Toast message={message} onClear={clearToast} />
  );
  
  return { showToast, ToastComponent };
}
