'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

function AuthModal({ isOpen, onClose, title, children, className }: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        'backdrop:bg-neutral-900/60 backdrop:backdrop-blur-sm rounded-3xl p-0 border-0 shadow-2xl max-w-md w-full',
        className
      )}
    >
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-neutral-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-neutral-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-neutral-600 space-y-4">{children}</div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-full transition-all text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

export { AuthModal };
export type { AuthModalProps };
