'use client';

import * as React from 'react';
import clsx from 'clsx';
import {Link, usePathname} from '@/i18n/navigation';
import {usePathname as useRawPathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {useCart} from '@/app/[locale]/pricing/_components/CartContext';
import {CartIcon} from '@/components/Icons';
import {LanguageMenu} from './LanguageMenu';
import {UserMenu} from './UserMenu';

function MenuIcon({open}: {open: boolean}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
      {open ? (
        <>
          <path d="M6 6 18 18" />
          <path d="M18 6 6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

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
  const cartVisible = pathname.includes('/pricing') || cartCount > 0;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isCheckoutPage =
    rawPathname === '/checkout' ||
    rawPathname.endsWith('/checkout') ||
    rawPathname.includes('/checkout/') ||
    pathname === '/checkout' ||
    pathname.endsWith('/checkout') ||
    pathname.includes('/checkout/');

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isCheckoutPage) return null;

  const navLinks = [
    {href: '/', label: t('nav.home'), active: pathname === '/'},
    {href: '/commands', label: t('nav.commands'), active: pathname.includes('/commands')},
    {href: '/pricing', label: t('nav.pricing'), active: pathname.includes('/pricing')}
  ];

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1220px]">
        <div className="relative flex h-[66px] items-center justify-between rounded-[999px] border border-white/[0.035] bg-[linear-gradient(180deg,rgba(9,11,18,0.96),rgba(7,8,14,0.94))] px-3 shadow-[0_14px_36px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-xl sm:px-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.035] text-white/86 transition hover:bg-white/[0.06] md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <MenuIcon open={mobileOpen} />
            </button>

            <Link href="/" className="flex min-w-0 items-center gap-3 rounded-full ps-1 pe-3 py-1.5 text-white/95 transition hover:bg-white/[0.025]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <img src="/logo.svg" alt="Tale Store" className="h-7 w-7 shrink-0 logo-glow" />
              </span>
              <span className="truncate text-[15px] font-extrabold tracking-tight sm:text-[16px]">Tale Store</span>
            </Link>
          </div>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center rounded-full bg-white/[0.03] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.035)] md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className={clsx(
                  'rounded-full px-6 py-2 text-[14px] font-semibold text-white/74 transition hover:text-white',
                  link.active && 'bg-white/[0.055] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]'
                )}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
            <a
              className="rounded-full px-6 py-2 text-[14px] font-semibold text-white/74 transition hover:text-white"
              href={supportDiscord}
              target="_blank"
              rel="noreferrer"
            >
              {t('nav.support')}
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block">
              <LanguageMenu locale={locale} pathname={pathname} />
            </div>

            <div className="flex h-10 w-10 items-center justify-center">
              <button
                onClick={() => cart.openCart()}
                className={clsx(
                  'relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.035] text-white/82 transition hover:bg-white/[0.06] hover:text-white',
                  !cartVisible && 'pointer-events-none opacity-0'
                )}
                aria-label="Cart"
                type="button"
              >
                <CartIcon className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 px-1 text-[11px] font-bold text-white shadow-[0_0_18px_rgba(168,85,247,0.35)]">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            </div>

            <UserMenu locale={locale} user={user} loginLabel={t('auth.login')} />
          </div>
        </div>

        {mobileOpen ? (
          <div className="mt-3 rounded-[26px] border border-white/[0.04] bg-[#090b12]/96 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl md:hidden">
            <div className="mb-2 flex items-center justify-between gap-2 sm:hidden">
              <LanguageMenu locale={locale} pathname={pathname} />
            </div>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'rounded-2xl px-4 py-3 text-sm font-semibold text-white/74 transition hover:bg-white/[0.04] hover:text-white',
                    link.active && 'bg-white/[0.055] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={supportDiscord}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-white/74 transition hover:bg-white/[0.04] hover:text-white"
              >
                {t('nav.support')}
              </a>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
