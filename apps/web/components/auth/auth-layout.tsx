import { type ReactNode } from 'react';
import Image from 'next/image';
import { HeroIllustration } from '@/components/auth/hero-illustration';

type AuthLayoutProps = {
  children: ReactNode;
  /** Show hero illustration panel (desktop only). Defaults to true. */
  showHero?: boolean;
};

function AuthLayout({ children, showHero = true }: AuthLayoutProps) {
  return (
    <main className="auth-page min-h-screen flex items-center justify-center p-4 md:p-8 overflow-x-hidden">
      {/* Outer glassmorphism container */}
      <div className="relative w-full max-w-6xl bg-white/10 backdrop-blur-sm p-4 md:p-6 rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(15,23,42,0.3)] border border-white/20 transition-all duration-500">

        {/* Inner two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#e2e8f0] rounded-[2.5rem] p-3 md:p-4 min-h-[660px]">

          {/* Left: Form Panel */}
          <div className="lg:col-span-5 form-gradient rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden shadow-inner transition-all duration-500">
            {/* Logo pill */}
            <div className="flex justify-between items-center mb-10">
              <div className="border border-blue-200/60 px-4 py-2 rounded-full bg-white/45 backdrop-blur-sm flex items-center justify-center shadow-sm gap-2">
                <Image
                  src="/logo.jpg"
                  alt="SCC Logo"
                  width={44}
                  height={44}
                  className="rounded-md object-contain"
                  priority
                />
                <span className="text-neutral-800 font-bold tracking-tight text-sm">
                  SCC
                </span>
              </div>
            </div>

            {/* Form content */}
            <div className="my-auto">{children}</div>
          </div>

          {/* Right: Hero Illustration — hidden on mobile */}
          {showHero && (
            <div className="hidden lg:block lg:col-span-7 rounded-[2.5rem] overflow-hidden relative min-h-[500px] lg:min-h-0 group">
              <HeroIllustration />
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

export { AuthLayout };
export type { AuthLayoutProps };
