'use client';

import clsx from 'clsx';
import {Link, usePathname} from '@/i18n/navigation';
import {usePathname as useRawPathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {useCart} from '@/app/[locale]/pricing/_components/CartContext';
import {CartIcon} from '@/components/Icons';
import {LanguageMenu} from './LanguageMenu';
import {UserMenu} from './UserMenu';

export function Header({
  locale,
  user
}: {
  locale: string;
  user: {name: string; avatarUrl?: string | null} | null;
}) {
  const t = useTranslations();
  const pathname = usePathname() || '/';
  const rawPathname = useRawPathname() || '';
  const cart = useCart();
  const supportDiscord = process.env.NEXT_PUBLIC_DISCORD_INVITE || '#';
  const cartCount = cart.items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const showCart = pathname.includes('/pricing') || cartCount > 0;

  const isCheckoutPage =
    rawPathname === '/checkout' ||
    rawPathname.endsWith('/checkout') ||
    rawPathname.includes('/checkout/') ||
    pathname === '/checkout' ||
    pathname.endsWith('/checkout') ||
    pathname.includes('/checkout/');

  if (isCheckoutPage) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-violet-300/10 bg-[#05030c]/82 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-6 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Tale Store" className="h-9 w-9" />
          <span className="text-[16px] font-extrabold tracking-tight text-white md:text-[17px]">Tale Store</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          <Link className={clsx('text-[15px] font-semibold text-white/78 transition hover:text-violet-100', pathname === '/' && 'text-white')} href="/">
            {t('nav.home')}
          </Link>
          <Link className={clsx('text-[15px] font-semibold text-white/78 transition hover:text-white', pathname.includes('/commands') && 'text-white')} href="/commands">
            {t('nav.commands')}
          </Link>
          <Link className={clsx('text-[15px] font-semibold text-white/78 transition hover:text-white', pathname.includes('/pricing') && 'text-white')} href="/pricing">
            {t('nav.pricing')}
          </Link>
          <a className="text-[15px] font-semibold text-white/78 transition hover:text-white" href={supportDiscord} target="_blank" rel="noreferrer">
            {t('nav.support')}
          </a>
        </nav>

        <div className="flex items-center gap-5">
          <LanguageMenu locale={locale} pathname={pathname} />
          {showCart ? (
            <button
              onClick={() => cart.openCart()}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:text-white"
              aria-label="Cart"
            >
              <CartIcon className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 px-1 text-[11px] font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.42)]">
                  {cartCount}
                </span>
              ) : null}
            </button>
          ) : null}
          <UserMenu locale={locale} user={user} loginLabel={t('auth.login')} />
        </div>
      </div>
    </header>
  );
}
