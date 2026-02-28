'use client';

import * as React from 'react';
import {createPortal} from 'react-dom';
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Align fixed sidebar to max-w-6xl container (72rem) + px-4 (1rem) padding.
  const base =
    "fixed top-24 z-[200] w-[240px] max-h-[calc(100vh-120px)] overflow-y-auto self-start rounded-2xl border border-white/10 bg-white/5 p-3";

  const fixedPos = isAr
    ? "right-[max(1rem,calc(50%-36rem+1rem))]"
    : "left-[max(1rem,calc(50%-36rem+1rem))]";

  const desktopAside = (
    <aside className={clsx(base, fixedPos)}>
      <div className="flex flex-col gap-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={clsx(
              'w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition',
              value === c ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            {c}
          </button>
        ))}
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile: sticky horizontal chips */}
      <div className="sm:hidden sticky top-16 z-20 -mx-4 px-4 py-3 bg-black/30 backdrop-blur-xl border-b border-white/10">
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

      {/* Desktop: portal-fixed (never moves) */}
      {mounted ? createPortal(desktopAside, document.body) : null}
    </>
  );
}
