'use client';

import * as React from 'react';
import {createPortal} from 'react-dom';
import {AnimatePresence, motion} from 'framer-motion';
import {Trash} from '@/components/Icons';
import type {CartItem} from '@/lib/cart';
import {lineTotalCents} from '@/lib/cart';

const DURATIONS: Array<1 | 3 | 6 | 12> = [1, 3, 6, 12];
const HEADER_H = 64; // px

export function CartDrawer({
  open,
  onClose,
  items,
  onRemove,
  onQtyChange,
  onMonthsChange,
  totalCents,
  formatPrice,
  onCheckout,
  locale
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (pricingOptionId: string) => void;
  onQtyChange: (pricingOptionId: string, qty: number) => void;
  onMonthsChange: (pricingOptionId: string, months: 1 | 3 | 6 | 12) => void;
  totalCents: number;
  formatPrice: (cents: number) => string;
  onCheckout: () => void;
  locale: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const isArabic = locale === 'ar';

  const labels = isArabic
    ? {
        title: 'عناصر السلة',
        close: 'إغلاق',
        empty: 'سلتك فارغة.',
        monthly: 'شهريًا',
        duration: 'المدة',
        quantity: 'الكمية',
        lineTotal: 'إجمالي هذا العنصر',
        total: 'الإجمالي',
        checkout: 'إتمام الشراء',
        continue: 'متابعة التسوق',
        remove: 'حذف',
        month: 'شهر',
        months: 'أشهر'
      }
    : {
        title: 'Cart items',
        close: 'Close',
        empty: 'Your cart is empty.',
        monthly: 'Monthly',
        duration: 'Duration',
        quantity: 'Quantity',
        lineTotal: 'Line total',
        total: 'Total',
        checkout: 'Proceed to Checkout',
        continue: 'Continue Shopping',
        remove: 'Remove',
        month: 'Month',
        months: 'Months'
      };

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onOverlayWheel = (e: React.WheelEvent) => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop += e.deltaY;
  };

  const onOverlayTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  if (!mounted) return null;

  const node = (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[5000]"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute left-0 right-0 bottom-0 top-16 bg-black/55 backdrop-blur-[1px]"
            onPointerDown={onClose}
            onWheel={onOverlayWheel}
            onTouchMove={onOverlayTouchMove}
          />

          <motion.aside
            dir={isArabic ? 'rtl' : 'ltr'}
            className="fixed right-0 top-16 bottom-0 w-full max-w-md rounded-tl-2xl border-l border-t border-white/10 bg-[#0b0f14]/98 shadow-2xl backdrop-blur-xl"
            initial={{x: 420, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            exit={{x: 420, opacity: 0}}
            transition={{type: 'tween', duration: 0.22}}
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-bold">
                  {labels.title} ({items.length})
                </div>
                <button
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                  onClick={onClose}
                  type="button"
                >
                  {labels.close}
                </button>
              </div>

              <div ref={bodyRef} className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1 overscroll-contain">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
                    {labels.empty}
                  </div>
                ) : (
                  items.map((it) => {
                    const line = lineTotalCents(it);
                    return (
                      <div key={it.pricingOptionId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className={`min-w-0 flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold">
                              <span className="truncate text-white">{it.name}</span>
                              <span className="text-white/70">{formatPrice(it.unitMonthlyCents)}</span>
                              <span className="text-white/50">{labels.monthly}</span>
                            </div>
                          </div>

                          <button
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15"
                            onClick={() => onRemove(it.pricingOptionId)}
                            aria-label={labels.remove}
                            title={labels.remove}
                            type="button"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <div className={`text-xs font-semibold text-white/70 ${isArabic ? 'text-right' : 'text-left'}`}>
                              {labels.duration}
                            </div>
                            <select
                              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                              value={it.periodMonths}
                              onChange={(e) =>
                                onMonthsChange(it.pricingOptionId, Number(e.target.value) as 1 | 3 | 6 | 12)
                              }
                            >
                              {DURATIONS.map((d) => (
                                <option key={d} value={d}>
                                  {isArabic ? `${d} ${d === 1 ? labels.month : labels.months}` : `${d} ${d === 1 ? labels.month : labels.months}`}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <div className={`text-xs font-semibold text-white/70 ${isArabic ? 'text-right' : 'text-left'}`}>
                              {labels.quantity}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-lg hover:bg-white/10"
                                onClick={() => onQtyChange(it.pricingOptionId, Math.max(1, it.qty - 1))}
                              >
                                -
                              </button>
                              <div className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold">
                                {it.qty}
                              </div>
                              <button
                                type="button"
                                className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-lg hover:bg-white/10"
                                onClick={() => onQtyChange(it.pricingOptionId, it.qty + 1)}
                              >
                                +
                              </button>
                            </div>

                            <div className={`mt-2 text-xs text-white/60 ${isArabic ? 'text-left' : 'text-right'}`}>
                              {labels.lineTotal}:{' '}
                              <span className="font-semibold text-white/90">{formatPrice(line)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-white/70">{labels.total}</div>
                  <div className="text-lg font-extrabold">{formatPrice(totalCents)}</div>
                </div>

                <button
                  className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-black hover:opacity-95"
                  onClick={onCheckout}
                  type="button"
                >
                  {labels.checkout}
                </button>

                <button
                  className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                  onClick={onClose}
                  type="button"
                >
                  {labels.continue}
                </button>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}
