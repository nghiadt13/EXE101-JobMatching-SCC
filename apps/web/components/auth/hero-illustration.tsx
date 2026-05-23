'use client';

function HeroIllustration() {
  return (
    <div className="absolute inset-0 min-h-[500px] lg:min-h-0">
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200"
        alt="Team Collaboration"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

      {/* Close button */}
      <button
        type="button"
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-neutral-800 flex items-center justify-center shadow-lg transition-all duration-300 z-10 hover:rotate-90 active:scale-95"
        aria-label="Close panel"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Floating card 1: Meeting schedule (top-left) */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-1.5 max-w-[240px]">
        <div className="bg-sky-100/95 text-sky-950 p-4 rounded-2xl shadow-xl border border-white/80 backdrop-blur-sm animate-bounce-slow">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-[13px] leading-tight text-sky-900">Task Review With Team</h4>
              <p className="text-[10px] text-sky-700/80 mt-1 font-semibold">09:30am-10:00am</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1 ml-2" />
          </div>
        </div>
        <div className="bg-neutral-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl shadow-lg border border-white/10 ml-3 -mt-1 flex items-center justify-between text-[10px] font-medium opacity-90">
          <span className="opacity-70">09:30am-10:00am</span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
        </div>
      </div>

      {/* Floating card 2: Avatar stack (right side) */}
      <div className="absolute right-8 top-1/3 z-10 flex flex-col gap-2">
        <div className="relative flex flex-col items-center gap-1.5 bg-black/10 p-2 rounded-full backdrop-blur-md border border-white/10">
          <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" alt="Avatar" loading="lazy" />
          <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md -mt-2" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" alt="Avatar" loading="lazy" />
          <img className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md -mt-2" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" alt="Avatar" loading="lazy" />
        </div>
      </div>

      {/* Floating card 3: Daily Meeting (bottom-left) */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white max-w-[240px] w-full transition-all duration-300 hover:translate-y-[-2px]">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-bold text-neutral-800 text-[13px]">Daily Meeting</h4>
            <p className="text-neutral-500 text-[10px] font-medium mt-0.5">12:00pm-01:00pm</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1" />
        </div>
        <div className="flex -space-x-1.5 overflow-hidden">
          <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="User" loading="lazy" />
          <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="User" loading="lazy" />
          <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="User" loading="lazy" />
          <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100" alt="User" loading="lazy" />
        </div>
      </div>

      {/* Floating card 4: Weekly calendar (bottom-right) */}
      <div className="absolute bottom-6 right-6 z-10 bg-blue-500/20 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl flex flex-col justify-between max-w-[320px] overflow-hidden">
        <div className="grid grid-cols-7 gap-2.5 text-center text-white relative">
          {[
            { day: 'Sun', num: 22 },
            { day: 'Mon', num: 23 },
            { day: 'Tue', num: 24 },
            { day: 'Wed', num: 25, active: true },
            { day: 'Thu', num: 26 },
            { day: 'Fri', num: 27 },
            { day: 'Sat', num: 28 },
          ].map((d) => (
            <div
              key={d.num}
              className={`p-1.5 rounded-lg transition-all duration-300 ${
                d.active
                  ? 'stripe-pattern border border-white/40 bg-blue-600/30'
                  : 'cursor-pointer hover:bg-white/10'
              }`}
            >
              <span className={`block text-[9px] font-semibold tracking-wider uppercase mb-1 ${d.active ? 'opacity-95 font-bold' : 'opacity-75'}`}>
                {d.day}
              </span>
              <span className={`text-[12px] ${d.active ? 'font-extrabold text-white' : 'font-bold'}`}>
                {d.num}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { HeroIllustration };
