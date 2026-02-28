'use client';

import clsx from 'clsx';
import {Link, usePathname} from '@/i18n/navigation';
import {UserMenu} from './UserMenu';
import {useCart} from '@/app/[locale]/pricing/_components/CartContext';
import {CartIcon} from '@/components/Icons';
import {useTranslations} from 'next-intl';

export function Header({
  locale,
  user
}: {
  locale: string;
  user: {name: string; avatarUrl?: string | null} | null;
}) {
  const t = useTranslations();
  const pathname = usePathname() || '/';
  const otherLocale = locale === 'en' ? 'ar' : 'en';
  const cart = useCart();

  const supportDiscord = process.env.NEXT_PUBLIC_DISCORD_INVITE || '#';
  const cartCount = cart.items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const showCartIcon = pathname.includes('/pricing') || cartCount > 0;

  const nav = (
    <nav
      className={clsx('hidden w-full items-center justify-center gap-8 text-sm font-semibold md:flex')}
    >
      <Link
        className={clsx('text-white/70 hover:text-white', pathname === '/' && 'text-white')}
        href="/"
      >
        {t('nav.home')}
      </Link>
      <Link
        className={clsx('text-white/70 hover:text-white', pathname?.includes('/commands') && 'text-white')}
        href="/commands"
      >
        {t('nav.commands')}
      </Link>
      <Link
        className={clsx('text-white/70 hover:text-white', pathname?.includes('/pricing') && 'text-white')}
        href="/pricing"
      >
        {t('nav.pricing')}
      </Link>
      <a className="text-white/70 hover:text-white" href={supportDiscord} target="_blank" rel="noreferrer">
        {t('nav.support')}
      </a>
    </nav>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-2">
      <img src="/logo.svg" alt="Tale Store" className="h-9 w-9 logo-glow-strong" />
      <span className="text-base font-extrabold tracking-tight">Tale Store</span>
    </Link>
  );

  const actions = (
    <div className="flex items-center gap-2">
      {/* Locale toggle */}
      <Link
        href={pathname}
        locale={otherLocale as any}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
        title={otherLocale.toUpperCase()}
      >
        <img
          src={otherLocale === 'en' ? '/icons/flag-en.svg' : '/icons/flag-ar.svg'}
          alt={otherLocale.toUpperCase()}
          className="h-4 w-4 opacity-90"
        />
        {otherLocale.toUpperCase()}
      </Link>

      {/* Cart icon (minimal) */}
      {showCartIcon ? (
        <button
          onClick={() => cart.openCart()}
          className="relative inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
          aria-label="Cart"
        >
          <CartIcon className="h-5 w-5" />
          {cartCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[11px] font-extrabold text-black">
              {cartCount}
            </span>
          ) : null}
        </button>
      ) : null}

      <UserMenu locale={locale} user={user} loginLabel={t('auth.login')} />
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-500/15 bg-black/40 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        {/* Fate-like 3-zone bar: left / center / right (centered nav) */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className={clsx('flex items-center', 'justify-start')}>
            {brand}
          </div>

          {nav}

          <div className={clsx('flex items-center', 'justify-end')}>
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}
