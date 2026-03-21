'use client';

import * as Dropdown from '@radix-ui/react-dropdown-menu';
import {Link} from '@/i18n/navigation';

function ChevronDown() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="m5 7 5 5 5-5" />
    </svg>
  );
}

export function LanguageMenu({
  locale,
  pathname
}: {
  locale: string;
  pathname: string;
}) {
  const current = locale === 'ar' ? 'AR' : 'EN';

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button className="inline-flex h-10 items-center gap-2 text-[14px] font-semibold text-white/90 transition hover:text-white">
          <img src={locale === 'ar' ? '/icons/flag-ar.svg' : '/icons/flag-en.svg'} alt={current} className="h-[18px] w-[18px]" />
          <span>{current}</span>
          <span className="text-white/50"><ChevronDown /></span>
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={10}
          align="end"
          className="z-[80] min-w-[170px] rounded-2xl border border-white/10 bg-[#0a0d10]/95 p-2 text-sm text-white shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <Dropdown.Item asChild>
            <Link href={pathname} locale="en" className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-white/85 outline-none transition hover:bg-white/5 hover:text-white">
              <img src="/icons/flag-en.svg" alt="EN" className="h-[18px] w-[18px]" />
              <span>English</span>
            </Link>
          </Dropdown.Item>

          <Dropdown.Item asChild>
            <Link href={pathname} locale="ar" className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-white/85 outline-none transition hover:bg-white/5 hover:text-white">
              <img src="/icons/flag-ar.svg" alt="AR" className="h-[18px] w-[18px]" />
              <span>العربية</span>
            </Link>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
