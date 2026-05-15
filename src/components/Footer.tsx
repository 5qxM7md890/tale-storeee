'use client';

import {Link} from '@/i18n/navigation';
import {usePathname as useLocalePathname} from '@/i18n/navigation';
import {usePathname as useRawPathname} from 'next/navigation';

export function Footer() {
  const pathname = useLocalePathname() || '/';
  const rawPathname = useRawPathname() || '';
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE || '#';

  const isCheckoutPage =
    rawPathname === '/checkout' ||
    rawPathname.endsWith('/checkout') ||
    rawPathname.includes('/checkout/') ||
    pathname === '/checkout' ||
    pathname.endsWith('/checkout') ||
    pathname.includes('/checkout/');

  if (isCheckoutPage) return null;

  const payIcons: Array<{alt: string; src: string}> = [
    {alt: 'Visa', src: '/icons/pay-visa.svg'},
    {alt: 'MasterCard', src: '/icons/pay-mastercard.svg'},
    {alt: 'Amex', src: '/icons/pay-amex.svg'}
  ];

  return (
    <footer className="mt-16 border-t border-violet-300/10 bg-[#05030c]/48">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Tale Store" className="h-9 w-9 shrink-0 logo-glow" />
            <div className="min-w-0">
              <div className="text-base font-semibold">Tale Store</div>
              <div className="text-xs text-white/60">Bot plans • Dashboard • Billing</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <div className="text-sm font-semibold">Website</div>
              <div className="mt-3 flex flex-col gap-3 text-sm text-white/70">
                <Link className="transition hover:text-violet-200" href="/">Home</Link>
                <Link className="transition hover:text-violet-200" href="/commands">Commands</Link>
                <Link className="transition hover:text-violet-200" href="/pricing">Pricing</Link>
                <Link className="transition hover:text-violet-200" href="/dashboard">Dashboard</Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Legal</div>
              <div className="mt-3 flex flex-col gap-3 text-sm text-white/70">
                <Link className="transition hover:text-violet-200" href="/terms">Terms of Service</Link>
                <Link className="transition hover:text-violet-200" href="/privacy">Privacy Policy</Link>
                <Link className="transition hover:text-violet-200" href="/refund-policy">Refund Policy</Link>
                <Link className="transition hover:text-violet-200" href="/cancelations">Cancelations</Link>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="text-sm font-semibold">Socials</div>
              <div className="mt-3 flex flex-col gap-3 text-sm text-white/70">
                <a className="transition hover:text-violet-200" href="https://x.com" target="_blank" rel="noreferrer">X</a>
                <a className="transition hover:text-violet-200" href={discordUrl} target="_blank" rel="noreferrer">Discord</a>
                <a className="transition hover:text-violet-200" href="https://www.youtube.com" target="_blank" rel="noreferrer">Youtube</a>
                <a className="hover:text-white break-all" href="mailto:support@example.com">Email</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-violet-300/10 pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <a href="https://x.com" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/10 bg-white/5 hover:bg-white/10">
                <img src="/icons/social-x.svg" alt="X" className="h-4 w-4 opacity-90" />
              </a>
              <a href={discordUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/10 bg-white/5 hover:bg-white/10">
                <img src="/icons/social-discord.svg" alt="Discord" className="h-4 w-4 opacity-90" />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/10 bg-white/5 hover:bg-white/10">
                <img src="/icons/social-youtube.svg" alt="Youtube" className="h-4 w-4 opacity-90" />
              </a>
            </div>

            <div className="text-xs text-white/60">All rights reserved © Tale Store</div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-white/50">Secure card payments</div>
            <div className="flex flex-wrap items-center gap-3">
              {payIcons.map((it) => (
                <div key={it.alt} className="inline-flex items-center justify-center rounded-xl border border-violet-300/10 bg-white/5 px-3 py-2">
                  <img src={it.src} alt={it.alt} className="h-4 w-auto opacity-95" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
