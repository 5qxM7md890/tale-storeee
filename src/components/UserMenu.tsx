'use client';

import * as Dropdown from '@radix-ui/react-dropdown-menu';
import {useRouter} from 'next/navigation';
import {Link} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';

function ChevronDown() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="m5 7 5 5 5-5" />
    </svg>
  );
}

export function UserMenu({
  locale,
  user,
  loginLabel
}: {
  locale: string;
  user: {name: string; avatarUrl?: string | null} | null;
  loginLabel?: string;
}) {
  const router = useRouter();
  const t = useTranslations();

  if (!user) {
    return (
      <a
        href={`/api/auth/discord/login?next=/${locale}/dashboard`}
        className="inline-flex h-10 items-center rounded-full border border-white/10 px-4 text-[14px] font-semibold text-white/90 transition hover:bg-white/5"
      >
        {loginLabel || t('auth.login')}
      </a>
    );
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button className="inline-flex h-10 items-center gap-2 text-[14px] font-semibold text-white/90 transition hover:text-white">
          <img
            src={user.avatarUrl || '/icons/avatar.svg'}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
          />
          <span className="max-w-[110px] truncate">{user.name}</span>
          <span className="text-white/50"><ChevronDown /></span>
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={10}
          align="end"
          className="z-[80] min-w-[220px] rounded-2xl border border-white/10 bg-[#0a0d10]/95 p-2 text-sm text-white shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <Dropdown.Item asChild>
            <Link href="/dashboard" className="block rounded-xl px-3 py-2.5 text-white/80 outline-none transition hover:bg-white/5 hover:text-white">
              {t('user.dashboard')}
            </Link>
          </Dropdown.Item>
          <Dropdown.Item asChild>
            <Link href="/dashboard/subscriptions" className="block rounded-xl px-3 py-2.5 text-white/80 outline-none transition hover:bg-white/5 hover:text-white">
              {t('user.subscriptions')}
            </Link>
          </Dropdown.Item>
          <Dropdown.Item asChild>
            <Link href="/dashboard/invoices" className="block rounded-xl px-3 py-2.5 text-white/80 outline-none transition hover:bg-white/5 hover:text-white">
              {t('user.invoices')}
            </Link>
          </Dropdown.Item>
          <Dropdown.Separator className="my-2 h-px bg-white/10" />
          <Dropdown.Item
            className="cursor-pointer rounded-xl px-3 py-2.5 text-red-300 outline-none transition hover:bg-red-500/10"
            onSelect={(e) => {
              e.preventDefault();
              fetch('/api/auth/logout', {method: 'POST'}).finally(() => router.refresh());
            }}
          >
            {t('user.logout')}
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
