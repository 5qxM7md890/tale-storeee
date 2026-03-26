
'use client';

import * as React from 'react';
import {motion, useMotionValue, useSpring, useTransform} from 'framer-motion';
import {useRouter} from 'next/navigation';
import {Link} from '@/i18n/navigation';

type CartItem = {
  productId: string;
  productSlug: string;
  name: string;
  pricingOptionId: string;
  periodMonths: 1 | 3 | 6 | 12;
  unitMonthlyCents: number;
  qty: number;
};

type Guild = {
  id: string;
  name: string;
  icon?: string | null;
  isAdmin: boolean;
};

type BillingAddress = {
  id: string;
  fullName: string;
  countryCode: string;
  city: string;
  addressLine1: string;
  postalCode: string;
  phone: string;
};

const STORAGE_KEY = 'tale_cart_v1';

const paymentMethods = [
  {id: 'card', label: 'Card', icon: '/icons/pay-visa.svg', note: 'Visa • MasterCard • Amex'}
] as const;

function formatUsdFromCents(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(cents / 100);
}

function lineTotal(item: CartItem) {
  return item.unitMonthlyCents * item.periodMonths * item.qty;
}

function durationLabel(months: number) {
  return `${months} month${months === 1 ? '' : 's'} subscription`;
}

function paymentLabel(id: string) {
  return paymentMethods.find((x) => x.id === id)?.label || id;
}

function ServerGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6 text-white/72">
      <rect x="5" y="4" width="14" height="6" rx="2" />
      <rect x="5" y="14" width="14" height="6" rx="2" />
    </svg>
  );
}

function LeftCheckoutVisual({
  translateX,
  translateY,
  glowX,
  glowY,
  fogX,
  fogY
}: {
  translateX: any;
  translateY: any;
  glowX: any;
  glowY: any;
  fogX: any;
  fogY: any;
}) {
  return (
    <>
      <Link href="/" className="absolute left-8 top-7 z-20 flex items-center gap-3 text-lg font-semibold text-white/92">
        <img src="/logo.svg" alt="Tale" className="h-8 w-8" />
        <span>Tale</span>
      </Link>

      <div className="absolute inset-0 bg-[#020504]" />
      <motion.div
        style={{x: glowX, y: glowY}}
        className="absolute -left-[18%] top-[-8%] h-[78%] w-[88%] rounded-full bg-[radial-gradient(circle,rgba(208,239,186,0.18)_0%,rgba(169,226,156,0.12)_18%,rgba(29,70,51,0.08)_42%,transparent_68%)] blur-[22px]"
      />
      <motion.div
        animate={{x: [0, 14, -10, 0], y: [0, 10, -6, 0]}}
        transition={{duration: 14, repeat: Infinity, ease: 'easeInOut'}}
        className="absolute inset-y-0 left-[-10%] w-[72%] bg-[radial-gradient(55%_100%_at_0%_0%,rgba(208,239,186,0.20),transparent_60%),radial-gradient(45%_80%_at_12%_28%,rgba(196,235,172,0.18),transparent_62%)]"
      />

      <motion.div
        style={{x: translateX, y: translateY}}
        animate={{rotate: [-24, -23, -24.5, -24]}}
        transition={{duration: 18, repeat: Infinity, ease: 'easeInOut'}}
        className="absolute left-[-12%] top-[-8%] h-[145%] w-[58%] origin-top-left rotate-[-24deg] overflow-hidden rounded-[64px] bg-[linear-gradient(180deg,rgba(199,228,177,0.75)_0%,rgba(170,214,153,0.52)_15%,rgba(88,155,112,0.22)_42%,rgba(8,20,15,0.00)_86%)] shadow-[inset_0_0_80px_rgba(255,255,255,0.06)]"
      >
        <motion.div
          animate={{x: [0, 16, -12, 0]}}
          transition={{duration: 9, repeat: Infinity, ease: 'easeInOut'}}
          className="absolute inset-0 opacity-[0.58]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 8px)'
          }}
        />
        <motion.div
          animate={{x: [0, -20, 14, 0], opacity: [0.35, 0.54, 0.3, 0.35]}}
          transition={{duration: 11, repeat: Infinity, ease: 'easeInOut'}}
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.00) 30%, rgba(0,0,0,0.20) 100%)'
          }}
        />
      </motion.div>

      <motion.div
        style={{x: fogX, y: fogY}}
        animate={{rotate: [-14, -11, -14]}}
        transition={{duration: 16, repeat: Infinity, ease: 'easeInOut'}}
        className="absolute left-[-4%] top-[6%] h-[128%] w-[38%] origin-top-left rotate-[-22deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_18%,rgba(0,0,0,0)_74%)] blur-[4px]"
      />

      <motion.div
        animate={{x: [0, 24, 0], y: [0, -18, 0], opacity: [0.2, 0.36, 0.2]}}
        transition={{duration: 10, repeat: Infinity, ease: 'easeInOut'}}
        className="absolute bottom-[-12%] left-[8%] h-[52%] w-[48%] rounded-full bg-[radial-gradient(circle,rgba(26,162,120,0.20)_0%,rgba(26,162,120,0.08)_42%,transparent_72%)] blur-[36px]"
      />
    </>
  );
}

export function CheckoutClient({
  locale,
  user
}: {
  locale: string;
  user: {name: string; avatarUrl?: string | null};
}) {
  const router = useRouter();
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [guilds, setGuilds] = React.useState<Guild[]>([]);
  const [guildsLoading, setGuildsLoading] = React.useState(true);
  const [guildOpen, setGuildOpen] = React.useState(false);
  const [guildFilter, setGuildFilter] = React.useState('');
  const [selectedGuildId, setSelectedGuildId] = React.useState<string>('');
  const [selectedPayment, setSelectedPayment] = React.useState<string>('card');
  const [coupon, setCoupon] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<string>('');
  const [couponNotice, setCouponNotice] = React.useState('');
  const [addresses, setAddresses] = React.useState<BillingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string>('');
  const [addressOpen, setAddressOpen] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [addressForm, setAddressForm] = React.useState({
    fullName: user.name || '',
    countryCode: 'SA',
    city: '',
    addressLine1: '',
    postalCode: '',
    phone: ''
  });

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const guildBoxRef = React.useRef<HTMLDivElement | null>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smoothX = useSpring(mx, {stiffness: 85, damping: 20});
  const smoothY = useSpring(my, {stiffness: 85, damping: 20});
  const translateX = useTransform(smoothX, [-220, 220], [-18, 18]);
  const translateY = useTransform(smoothY, [-220, 220], [-14, 14]);
  const glowX = useTransform(translateX, (v) => v * 0.8);
  const glowY = useTransform(translateY, (v) => v * 0.65);
  const fogX = useTransform(translateX, (v) => v * -0.6);
  const fogY = useTransform(translateY, (v) => v * -0.45);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(Array.isArray(parsed) ? parsed : []);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('tale_checkout_addresses_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as BillingAddress[];
        setAddresses(parsed);
        if (parsed[0]) setSelectedAddressId(parsed[0].id);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (guildBoxRef.current && !guildBoxRef.current.contains(target)) {
        setGuildOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        setGuildsLoading(true);
        const res = await fetch('/api/me/guilds');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!active) return;
        setGuilds(data.guilds || []);
      } catch {
        if (!active) return;
        setGuilds([]);
      } finally {
        if (active) setGuildsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const selectedGuild = React.useMemo(
    () => guilds.find((g) => g.id === selectedGuildId) || null,
    [guilds, selectedGuildId]
  );

  const filteredGuilds = React.useMemo(() => {
    const q = guildFilter.trim().toLowerCase();
    if (!q) return guilds;
    return guilds.filter((guild) => guild.name.toLowerCase().includes(q));
  }, [guildFilter, guilds]);

  const subtotal = React.useMemo(
    () => items.reduce((sum, item) => sum + lineTotal(item), 0),
    [items]
  );

  const discount = React.useMemo(() => {
    if (!appliedCoupon) return 0;
    const code = appliedCoupon.toUpperCase();
    if (code === 'TALE10' || code === 'FATE10') return Math.round(subtotal * 0.1);
    if (code === 'WELCOME50') return Math.min(subtotal, 50);
    return 0;
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, subtotal - discount);
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;
  const firstItem = items[0] || null;

  function handleMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(event.clientX - rect.left - rect.width / 2);
    my.set(event.clientY - rect.top - rect.height / 2);
  }

  function resetMove() {
    mx.set(0);
    my.set(0);
  }

  function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon('');
      setCouponNotice('');
      return;
    }

    if (code === 'TALE10' || code === 'FATE10' || code === 'WELCOME50') {
      setAppliedCoupon(code);
      setCouponNotice(code === 'WELCOME50' ? '$0.50 discount applied.' : '10% discount applied.');
    } else {
      setAppliedCoupon('');
      setCouponNotice('Coupon is not valid in this preview.');
    }
  }

  function saveAddress() {
    const next: BillingAddress = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...addressForm
    };

    const updated = [next, ...addresses];
    setAddresses(updated);
    setSelectedAddressId(next.id);
    localStorage.setItem('tale_checkout_addresses_v1', JSON.stringify(updated));
    setAddressOpen(false);
    setAddressForm((prev) => ({...prev, city: '', addressLine1: '', postalCode: '', phone: ''}));
  }

  async function submitCheckout() {
    setError('');

    if (!items.length) {
      setError('Your cart is empty.');
      return;
    }
    if (!selectedGuildId) {
      setError('Please choose a server.');
      return;
    }
    if (!selectedAddressId) {
      setError('Please add a billing address.');
      return;
    }
    if (!termsAccepted) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          locale,
          items: items.map((it) => ({pricingOptionId: it.pricingOptionId, qty: it.qty}))
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || 'Checkout failed.');
        return;
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setError('Checkout session was not returned.');
    } catch {
      setError('Network error during checkout.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_18%_10%,rgba(36,86,63,0.18),transparent_58%),linear-gradient(180deg,#040505_0%,#020303_100%)]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(380px,42vw)_minmax(0,1fr)]">
        <div
          ref={containerRef}
          onMouseMove={handleMove}
          onMouseLeave={resetMove}
          className="relative hidden min-h-screen overflow-hidden lg:block"
        >
          <LeftCheckoutVisual
            translateX={translateX}
            translateY={translateY}
            glowX={glowX}
            glowY={glowY}
            fogX={fogX}
            fogY={fogY}
          />
        </div>

        <div className="relative flex min-h-screen justify-center px-4 py-6 sm:px-6 lg:px-10">
          <div className="w-full max-w-[760px] min-w-0 pb-20 pt-4 lg:pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white/90 transition hover:text-white"
              >
                <span className="text-xl leading-none">←</span>
                <span>Go Back</span>
              </button>
              <div className="text-left text-[15px] font-medium text-white/80 sm:text-right">Secure Checkout</div>
            </div>

            <div className="mt-10">
              <h1 className="text-[28px] font-medium leading-tight tracking-[-0.03em] text-white sm:text-[42px]">
                Subscribe and manage your Tale Store plan
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">Get access to your plan, billing details, and server setup.</p>
            </div>

            <div className="mt-8 rounded-[24px] bg-[linear-gradient(180deg,rgba(14,16,19,0.94),rgba(10,11,14,0.92))] p-4 shadow-[0_35px_90px_rgba(0,0,0,0.42)] sm:p-5">
              {firstItem ? (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                        <img src="/icons/apps.svg" alt="product" className="h-7 w-7 opacity-90" />
                      </div>
                      <div>
                        <div className="break-words text-[24px] font-medium tracking-[-0.02em] text-white sm:text-[26px]">{firstItem.name}</div>
                        <div className="mt-1 text-base text-white/58">{durationLabel(firstItem.periodMonths)}</div>
                      </div>
                    </div>
                    <div className="text-left text-[26px] font-semibold text-white sm:text-right sm:text-[28px]">{formatUsdFromCents(lineTotal(firstItem))}</div>
                  </div>

                  <div className="mt-7 space-y-3 border-t border-dashed border-violet-300/10 pt-5">
                    <div className="flex items-center justify-between text-[16px] text-white/70">
                      <span>Subtotal:</span>
                      <span>{formatUsdFromCents(subtotal)}</span>
                    </div>
                    {discount > 0 ? (
                      <div className="flex items-center justify-between text-[16px] text-violet-200">
                        <span>Discount:</span>
                        <span>-{formatUsdFromCents(discount)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-4 text-[22px] font-semibold text-white sm:text-[24px]">
                      <span>Total:</span>
                      <span>{formatUsdFromCents(total)}</span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_88px]">
                    <input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Coupon code"
                      className="h-14 rounded-2xl bg-white/[0.04] px-5 text-[17px] text-white outline-none transition placeholder:text-white/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[inset_0_0_0_1px_rgba(167,139,250,0.45)]"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="h-14 rounded-2xl bg-gradient-to-b from-fuchsia-500 via-violet-500 to-violet-600 px-4 text-[17px] font-medium text-white transition hover:brightness-110"
                    >
                      Apply
                    </button>
                  </div>
                  {couponNotice ? (
                    <div className="mt-3 text-sm text-white/58">{couponNotice}</div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-2xl bg-white/[0.03] p-5 text-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                  Your cart is empty. Go back to pricing and add a plan first.
                </div>
              )}
            </div>

            <section className="mt-7 rounded-[24px] bg-[rgba(14,16,19,0.92)] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:p-5">
              <label className="mb-4 block text-[18px] font-medium text-white">
                Select Server:<span className="text-red-400">*</span>
              </label>

              <div ref={guildBoxRef} className="relative">
                <button
                  type="button"
                  onClick={() => setGuildOpen((v) => !v)}
                  className="flex min-h-[74px] w-full items-center justify-between rounded-[20px] bg-[#11141a] px-4 text-left transition shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                      <ServerGlyph />
                    </div>
                    <div className="min-w-0">
                      {selectedGuild ? (
                        <>
                          <div className="truncate text-[18px] font-medium text-white">{selectedGuild.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-200">Owner</span>
                            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-200">Admin</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[16px] leading-6 text-white/58 sm:text-[18px]">
                          {guildsLoading ? 'Loading servers...' : 'Select a server for new bots (required)'}
                        </div>
                      )}
                    </div>
                  </div>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-5 w-5 text-white/50 transition ${guildOpen ? 'rotate-180' : ''}`}>
                    <path d="m5 7 5 5 5-5" />
                  </svg>
                </button>

                {guildOpen ? (
                  <div className="absolute z-40 mt-3 w-full overflow-hidden rounded-[22px] bg-[#0a0d12]/98 shadow-[0_25px_90px_rgba(0,0,0,0.58),inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-2xl">
                    <div className="p-3">
                      <input
                        value={guildFilter}
                        onChange={(e) => setGuildFilter(e.target.value)}
                        placeholder="Search your servers"
                        className="h-12 w-full rounded-2xl bg-white/[0.04] px-4 text-[15px] text-white outline-none placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[inset_0_0_0_1px_rgba(167,139,250,0.45)]"
                      />
                    </div>

                    <div className="max-h-[320px] overflow-y-auto px-2 pb-2">
                      {filteredGuilds.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-white/55">No servers found.</div>
                      ) : (
                        filteredGuilds.map((guild) => {
                          const iconUrl = guild.icon
                            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                            : '/logo.svg';

                          return (
                            <button
                              key={guild.id}
                              type="button"
                              onClick={() => {
                                setSelectedGuildId(guild.id);
                                setGuildOpen(false);
                              }}
                              className={`flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition ${
                                selectedGuildId === guild.id
                                  ? 'bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                                  : 'hover:bg-white/[0.04]'
                              }`}
                            >
                              <img src={iconUrl} alt={guild.name} className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[17px] font-medium text-white">{guild.name}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-200">Owner</span>
                                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-200">Admin</span>
                                </div>
                              </div>
                              {selectedGuildId === guild.id ? (
                                <div className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,0.8)]" />
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="mt-7 rounded-[24px] bg-[rgba(14,16,19,0.92)] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="block text-[18px] font-medium text-white">
                  Billing Address:<span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAddressOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/[0.03] px-4 py-3 text-[15px] font-medium text-white/88 transition hover:bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] sm:w-auto sm:justify-start sm:text-[16px]"
                >
                  <span className="text-xl leading-none">+</span>
                  <span>Add New Address</span>
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {selectedAddress ? (
                  <button
                    type="button"
                    onClick={() => setAddressOpen(true)}
                    className="w-full rounded-[20px] bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] sm:p-5"
                  >
                    <div className="break-words text-[18px] font-medium text-white">{selectedAddress.fullName}</div>
                    <div className="mt-2 break-words text-[15px] leading-7 text-white/62">
                      {selectedAddress.addressLine1}<br />
                      {selectedAddress.city}, {selectedAddress.postalCode}<br />
                      {selectedAddress.countryCode} · {selectedAddress.phone}
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddressOpen(true)}
                    className="w-full rounded-[20px] bg-white/[0.02] p-5 text-left text-white/55 transition hover:bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                  >
                    No billing address selected.
                  </button>
                )}
              </div>
            </section>

            <section className="mt-7 rounded-[24px] bg-[rgba(14,16,19,0.92)] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:p-5">
              <label className="mb-4 block text-[18px] font-medium text-white">Payment Method</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPayment(method.id)}
                    className={`rounded-[20px] p-4 text-left transition ${
                      selectedPayment === method.id
                        ? 'bg-violet-500/[0.10] shadow-[inset_0_0_0_1px_rgba(167,139,250,0.46)]'
                        : 'bg-white/[0.03] hover:bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                        <img src={method.icon} alt={method.label} className="max-h-5 opacity-95" />
                      </div>
                      <div>
                        <div className="break-words text-[18px] font-medium text-white">{method.label}</div>
                        <div className="text-sm text-white/48">{method.note}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-7 rounded-[24px] bg-[rgba(14,16,19,0.92)] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:p-5">
              <label className="flex items-start gap-3 text-[14px] leading-6 text-white/68 sm:text-[15px]">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-white/20 bg-transparent text-violet-400 accent-violet-500"
                />
                <span>
                  I agree to the <a href={`/${locale}/terms`} className="text-white underline underline-offset-4">Terms of Service</a> and <a href={`/${locale}/privacy`} className="text-white underline underline-offset-4">Privacy Policy</a>
                </span>
              </label>

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={submitCheckout}
                disabled={submitting || !items.length}
                className="mt-5 min-h-14 w-full rounded-[18px] bg-[linear-gradient(180deg,#a855f7_0%,#7c3aed_50%,#6d28d9_100%)] px-4 text-[17px] font-medium text-white shadow-[0_18px_40px_rgba(139,92,246,0.34)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:text-[18px]"
              >
                {submitting ? 'Preparing Checkout...' : 'Checkout'}
              </button>
            </section>
          </div>
        </div>
      </div>

      {addressOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-[480px] overflow-y-auto rounded-[28px] bg-[#13161b]/95 p-5 shadow-[0_40px_120px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[24px] font-semibold text-white">Your details</div>
                <div className="mt-1 text-sm leading-6 text-white/55">We collect this information to help combat fraud, and to keep your payment secure.</div>
              </div>
              <button type="button" onClick={() => setAddressOpen(false)} className="text-2xl text-white/40 transition hover:text-white">×</button>
            </div>

            <div className="mt-6 space-y-4">
              <Field label="Account email" required>
                <input value="" readOnly className="h-12 w-full rounded-2xl bg-white/[0.03] px-4 text-white outline-none shadow-[inset_0_0_0_1px_rgba(96,188,255,0.78)]" />
              </Field>

              <Field label="Full name" required>
                <input
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm((prev) => ({...prev, fullName: e.target.value}))}
                  className="h-12 w-full rounded-2xl bg-white/[0.03] px-4 text-white outline-none transition shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Country" required>
                  <select
                    value={addressForm.countryCode}
                    onChange={(e) => setAddressForm((prev) => ({...prev, countryCode: e.target.value}))}
                    className="h-12 w-full rounded-2xl bg-white/[0.03] px-4 text-white outline-none transition shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                  >
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="KW">Kuwait</option>
                  </select>
                </Field>

                <Field label="City" required>
                  <input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((prev) => ({...prev, city: e.target.value}))}
                    className="h-12 w-full rounded-2xl bg-white/[0.03] px-4 text-white outline-none transition shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                  />
                </Field>
              </div>

              <Field label="Address line" required>
                <input
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm((prev) => ({...prev, addressLine1: e.target.value}))}
                  className="h-12 w-full rounded-2xl bg-white/[0.03] px-4 text-white outline-none transition shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Postal code" required>
                  <input
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm((prev) => ({...prev, postalCode: e.target.value}))}
                    className="h-12 w-full rounded-2xl bg-white/[0.03] px-4 text-white outline-none transition shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                  />
                </Field>

                <Field label="Phone" required>
                  <input
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm((prev) => ({...prev, phone: e.target.value}))}
                    className="h-12 w-full rounded-2xl bg-white/[0.03] px-4 text-white outline-none transition shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                  />
                </Field>
              </div>
            </div>

            <button
              type="button"
              onClick={saveAddress}
              className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-b from-fuchsia-500 via-violet-500 to-violet-600 px-4 text-[16px] font-medium text-white transition hover:brightness-110 sm:text-[17px]"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm text-white/85">
        {label}
        {required ? <span className="text-red-400">*</span> : null}
      </div>
      {children}
    </label>
  );
}
