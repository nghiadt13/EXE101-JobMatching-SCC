'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type PillInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  showToggle?: boolean;
};

const PillInput = forwardRef<HTMLInputElement, PillInputProps>(
  ({ label, error, showToggle, type, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showToggle ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-[11px] font-semibold text-slate-500 tracking-wider uppercase mb-1.5 ml-4"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              'w-full bg-white/80 focus:bg-white border border-slate-200/60 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 px-6 py-3.5 rounded-full text-[14px] text-neutral-800 font-medium placeholder-neutral-400 outline-none transition-all duration-300 shadow-sm',
              showToggle && 'pr-14',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
              className
            )}
            {...props}
          />
          {showToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-neutral-800 transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600 mt-1 ml-4">{error}</p>}
      </div>
    );
  }
);

PillInput.displayName = 'PillInput';

export { PillInput };
export type { PillInputProps };
