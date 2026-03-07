'use client';

import clsx from 'clsx';

export function CategorySidebar({
  locale,
  categories,
  value,
  onChange
}: {
  locale: string;
  categories: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const isAr = locale === 'ar';

  const desktopPos = isAr
    ? 'sm:right-[max(1rem,calc(50%-36rem+1rem))]'
    : 'sm:left-[max(1rem,calc(50%-36rem+1rem))]';

  return (
    <>
      {/* Mobile only: horizontal sticky chips */}
      <div className="sm:hidden sticky top-16 z-20 -mx-4 px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={clsx(
                'shrink-0 rounded-full px-4 py-2 text-xs font-bold border transition',
                value === c
                  ? 'border-emerald-500/35 bg-emerald-500/15 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop only: fixed sidebar */}
      <aside
        className={clsx(
          'hidden sm:block fixed top-24 z-30 w-[240px] max-h-[calc(100vh-120px)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1116]/90 p-3 backdrop-blur-sm',
          desktopPos
        )}
      >
        <div className="flex flex-col gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={clsx(
                'w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition',
                value === c
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
