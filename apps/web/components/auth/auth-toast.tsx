'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

type AuthToastProps = {
  message: string;
  icon?: string;
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
};

function AuthToast({ message, icon = '⚡', isVisible, onDismiss, duration = 3000 }: AuthToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDismiss, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-xl z-50 text-xs font-semibold flex items-center gap-2 transition-all duration-300',
        show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      )}
    >
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}

export { AuthToast };
export type { AuthToastProps };
