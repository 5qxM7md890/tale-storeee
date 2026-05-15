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
        className="inline-flex h-10 items-center rounded-full bg-white/[0.035] px-4 text-[13px] font-semibold text-white/88 transition hover:bg-white/[0.06] hover:text-white sm:text-[14px]"
      >
        {loginLabel || t('auth.login')}
      </a>
    );
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button className="inline-flex max-w-[170px] items-center gap-2 rounded-full bg-white/[0.035] py-1.5 ps-1.5 pe-3 text-[13px] font-semibold text-white/90 transition hover:bg-white/[0.06] sm:max-w-[210px] sm:text-[14px]">
          <img
            src={user.avatarUrl || '/icons/avatar.svg'}
            alt={user.name}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
          <span className="max-w-[72px] truncate sm:max-w-[100px]">{user.name}</span>
          <span className="text-white/40"><ChevronDown /></span>
        </button>
      </Dropdown.Trigger>

      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={10}
          align="end"
          className="z-[80] min-w-[210px] rounded-2xl border border-white/[0.05] bg-[#090b12]/96 p-2 text-sm text-white shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <Dropdown.Item asChild>
            <Link href="/dashboard" className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-white/85 outline-none transition hover:bg-white/[0.045] hover:text-white">
              {t('nav.dashboard')}
            </Link>
          </Dropdown.Item>
          <Dropdown.Item asChild>
            <Link href="/my-bots" className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-white/85 outline-none transition hover:bg-white/[0.045] hover:text-white">
              {t('nav.myBots')}
            </Link>
          </Dropdown.Item>
          <Dropdown.Item asChild>
            <Link href="/dashboard/invoices" className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-white/85 outline-none transition hover:bg-white/[0.045] hover:text-white">
              {t('nav.billing')}
            </Link>
          </Dropdown.Item>
          <Dropdown.Separator className="my-2 h-px bg-white/[0.06]" />
          <Dropdown.Item
            onSelect={async () => {
              await fetch('/api/auth/logout', {method: 'POST'});
              router.push(`/${locale}`);
              router.refresh();
            }}
            className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-rose-200 outline-none transition hover:bg-rose-500/10 hover:text-rose-100"
          >
            {t('auth.logout')}
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
