import {Link} from '@/i18n/navigation';

export function Footer() {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE || '#';

  const payIcons: Array<{alt: string; src: string}> = [
    {alt: 'Visa', src: '/icons/pay-visa.svg'},
    {alt: 'MasterCard', src: '/icons/pay-mastercard.svg'},
    {alt: 'Amex', src: '/icons/pay-amex.svg'},
    {alt: 'Mada', src: '/icons/pay-mada.svg'},
    {alt: 'ApplePay', src: '/icons/pay-applepay.svg'},
    {alt: 'GooglePay', src: '/icons/pay-googlepay.svg'},
    {alt: 'PayPal', src: '/icons/pay-paypal.svg'},
    {alt: 'Crypto', src: '/icons/pay-crypto.svg'}
  ];

  return (
    <footer className="mt-16 border-t border-white/10 bg-black/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Tale Store" className="h-9 w-9" />
            <div>
              <div className="text-base font-semibold">Tale Store</div>
              <div className="text-xs text-white/60">Bot plans • Dashboard • Billing</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-10">
            <div>
              <div className="text-sm font-semibold">Website</div>
              <div className="mt-3 flex flex-col gap-3 text-sm text-white/70">
                <Link className="hover:text-white" href="/">Home</Link>
                <Link className="hover:text-white" href="/commands">Commands</Link>
                <Link className="hover:text-white" href="/pricing">Pricing</Link>
                <Link className="hover:text-white" href="/dashboard">Dashboard</Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Terms</div>
              <div className="mt-3 flex flex-col gap-3 text-sm text-white/70">
                <Link className="hover:text-white" href="/terms">Terms of Service</Link>
                <Link className="hover:text-white" href="/privacy">Privacy Policy</Link>
                <Link className="hover:text-white" href="/cancelations">Cancelations</Link>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Socials</div>
              <div className="mt-3 flex flex-col gap-3 text-sm text-white/70">
                <a className="hover:text-white" href="https://x.com" target="_blank" rel="noreferrer">X</a>
                <a className="hover:text-white" href={discordUrl} target="_blank" rel="noreferrer">Discord</a>
                <a className="hover:text-white" href="https://www.youtube.com" target="_blank" rel="noreferrer">Youtube</a>
                <a className="hover:text-white" href="mailto:support@example.com">Email</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <a href="https://x.com" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
                <img src="/icons/social-x.svg" alt="X" className="h-4 w-4 opacity-90" />
              </a>
              <a href={discordUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
                <img src="/icons/social-discord.svg" alt="Discord" className="h-4 w-4 opacity-90" />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
                <img src="/icons/social-youtube.svg" alt="Youtube" className="h-4 w-4 opacity-90" />
              </a>
            </div>

            <div className="text-xs text-white/60">All rights reserved © Tale Store</div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
            {payIcons.map((it) => (
              <div key={it.alt} className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <img src={it.src} alt={it.alt} className="h-4 w-auto opacity-95" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
