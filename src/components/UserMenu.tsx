'use client';

import * as Dropdown from '@radix-ui/react-dropdown-menu';
import {useRouter} from 'next/navigation';
import {Link} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';

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
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
      >
        {loginLabel || t('auth.login')}
      </a>
    );
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 hover:bg-white/10">
          <img
            src={user.avatarUrl || '/icons/avatar.svg'}
            alt={user.name}
            className="h-7 w-7 rounded-lg object-cover"
          />
          <span className="max-w-[220px] truncate text-sm font-semibold text-white/90">
            {user.name}
          </span>
        </button>
      </Dropdown.Trigger>

      <Dropdown.Content
        sideOffset={10}
        className="z-50 w-56 rounded-2xl border border-white/10 bg-black/90 p-2 text-sm text-white shadow-xl backdrop-blur"
      >
        <Dropdown.Item asChild>
          <Link href="/dashboard" className="block rounded-xl px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">
            {t('user.dashboard')}
          </Link>
        </Dropdown.Item>
        <Dropdown.Item asChild>
          <Link href="/dashboard/subscriptions" className="block rounded-xl px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">
            {t('user.subscriptions')}
          </Link>
        </Dropdown.Item>
        <Dropdown.Item asChild>
          <Link href="/dashboard/invoices" className="block rounded-xl px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">
            {t('user.invoices')}
          </Link>
        </Dropdown.Item>

        <Dropdown.Separator className="my-2 h-px bg-white/10" />

        <Dropdown.Item
          className="cursor-pointer rounded-xl px-3 py-2 text-red-300 hover:bg-red-500/10"
          onSelect={(e) => {
            e.preventDefault();
            fetch('/api/auth/logout', {method: 'POST'}).finally(() => router.refresh());
          }}
        >
          {t('user.logout')}
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}
