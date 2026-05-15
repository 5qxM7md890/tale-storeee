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
        <button className="inline-flex h-10 min-w-0 items-center gap-2 rounded-full bg-white/[0.035] px-3 text-[13px] font-semibold text-white/86 transition hover:bg-white/[0.06] hover:text-white sm:text-[14px]">
          <img src={locale === 'ar' ? '/icons/flag-ar.svg' : '/icons/flag-en.svg'} alt={current} className="h-[16px] w-[16px] shrink-0 rounded-full" />
          <span>{current}</span>
          <span className="text-white/40"><ChevronDown /></span>
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={10}
          align="end"
          className="z-[80] min-w-[150px] rounded-2xl border border-white/[0.05] bg-[#090b12]/96 p-2 text-sm text-white shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:min-w-[170px]"
        >
          <Dropdown.Item asChild>
            <Link href={pathname} locale="en" className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-white/85 outline-none transition hover:bg-white/[0.045] hover:text-white">
              <img src="/icons/flag-en.svg" alt="EN" className="h-4 w-4 rounded-full" />
              <span>English</span>
            </Link>
          </Dropdown.Item>
          <Dropdown.Item asChild>
            <Link href={pathname} locale="ar" className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-white/85 outline-none transition hover:bg-white/[0.045] hover:text-white">
              <img src="/icons/flag-ar.svg" alt="AR" className="h-4 w-4 rounded-full" />
              <span>العربية</span>
            </Link>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
