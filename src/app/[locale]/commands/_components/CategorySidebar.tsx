'use client';

import clsx from 'clsx';
import * as React from 'react';

const CATEGORY_ARABIC: Record<string, string> = {
  All: 'الكل',
  Admin: 'الإدارة',
  Settings: 'الإعدادات',
  Roles: 'الرتب',
  Channels: 'القنوات',
  Protection: 'الحماية',
  Chat: 'الدردشة',
  Mod: 'الإشراف',
  Genral: 'عام',
  General: 'عام',
  Owners: 'المالكون',
  Groups: 'المجموعات',
  Points: 'النقاط',
  Tickets: 'التذاكر'
};

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 12h12" />
      <path d="M4 6h16" />
      <path d="M4 18h8" />
    </svg>
  );
}

type Props = {
  locale: string;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  query: string;
  onChangeQuery: (value: string) => void;
};

export function CategorySidebar({
  locale,
  categories,
  selectedCategory,
  onSelectCategory,
  query,
  onChangeQuery
}: Props) {
  const isAr = locale === 'ar';

  const renderLabel = React.useCallback(
    (category: string) => (isAr ? CATEGORY_ARABIC[category] ?? category : category),
    [isAr]
  );

  return (
    <>
      <div className="space-y-3 lg:hidden">
        <div className="flex items-center gap-3 rounded-[10px] border border-white/[0.14] bg-[#0b0d12] px-4 py-3 text-white/50">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => onChangeQuery(event.target.value)}
            placeholder={isAr ? 'ابحث عن أمر' : 'Search for command'}
            className={clsx(
              'w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35',
              isAr && 'text-right'
            )}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              className={clsx(
                'shrink-0 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition',
                selectedCategory === category
                  ? 'bg-[#2a2b38] text-white'
                  : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
              )}
            >
              {renderLabel(category)}
            </button>
          ))}
        </div>
      </div>

      <aside className="hidden lg:block lg:self-start">
        <div className="sticky top-24">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-[6px] border border-white/[0.14] bg-transparent px-4 py-3 text-white/50">
              <SearchIcon className="h-4 w-4 shrink-0" />
              <input
                value={query}
                onChange={(event) => onChangeQuery(event.target.value)}
                placeholder={isAr ? 'ابحث عن أمر' : 'Search for command'}
                className={clsx(
                  'w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/35',
                  isAr && 'text-right'
                )}
              />
            </div>

            <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onSelectCategory(category)}
                    className={clsx(
                      'w-full rounded-[6px] px-4 py-[9px] text-left text-[14px] font-semibold transition',
                      isAr && 'text-right',
                      selectedCategory === category
                        ? 'bg-[#2a2b38] text-white'
                        : 'text-white/82 hover:bg-white/[0.04] hover:text-white'
                    )}
                  >
                    {renderLabel(category)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
