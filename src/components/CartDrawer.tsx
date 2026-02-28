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
  onCheckout
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
}) {
  const [mounted, setMounted] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // When the cart is open, allow wheel-scroll anywhere on the overlay to scroll the drawer body.
  const onOverlayWheel = (e: React.WheelEvent) => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop += e.deltaY;
  };

  const onOverlayTouchMove = (e: React.TouchEvent) => {
    // iOS: let the drawer scroll naturally; do nothing here.
    // Keeping handler prevents underlying page scroll when open+locked.
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
          {/* Overlay: only below header so header doesn't get blocked */}
          <div
            className="absolute left-0 right-0 bottom-0 top-16 bg-black/60"
            onPointerDown={onClose}
            onWheel={onOverlayWheel}
            onTouchMove={onOverlayTouchMove}
          />

          {/* Drawer */}
          <motion.aside
            className="fixed right-0 top-16 bottom-0 w-full max-w-md border-l border-white/10 bg-[#0b0f14] shadow-2xl"
            initial={{x: 420, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            exit={{x: 420, opacity: 0}}
            transition={{type: 'tween', duration: 0.22}}
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col p-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">Cart items ({items.length})</div>
                <button
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
                  onClick={onClose}
                  type="button"
                >
                  Close
                </button>
              </div>

              {/* Body */}
              <div ref={bodyRef} className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1 overscroll-contain">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
                    Your cart is empty.
                  </div>
                ) : (
                  items.map((it) => {
                    const line = lineTotalCents(it);
                    return (
                      <div key={it.pricingOptionId} className="relative rounded-2xl border border-white/10 bg-white/5 p-4">
                        <button
                          className="absolute right-3 top-3 inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-200 hover:bg-red-500/15"
                          onClick={() => onRemove(it.pricingOptionId)}
                          aria-label="Remove"
                          type="button"
                        >
                          <Trash className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-2 text-sm font-bold">
                          <span className="text-white">{it.name}</span>
                          <span className="text-white/70">{formatPrice(it.unitMonthlyCents)}</span>
                          <span className="text-white/50">Monthly</span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs font-semibold text-white/70">Duration</div>
                            <select
                              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
                              value={it.periodMonths}
                              onChange={(e) =>
                                onMonthsChange(it.pricingOptionId, Number(e.target.value) as 1 | 3 | 6 | 12)
                              }
                            >
                              {DURATIONS.map((d) => (
                                <option key={d} value={d}>
                                  {d} Month
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-white/70">Quantity</div>
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

                            <div className="mt-2 text-right text-xs text-white/60">
                              Line total: <span className="text-white/90 font-semibold">{formatPrice(line)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-white/70">Total</div>
                  <div className="text-lg font-extrabold">{formatPrice(totalCents)}</div>
                </div>

                <button
                  className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-black hover:opacity-95"
                  onClick={onCheckout}
                  type="button"
                >
                  Proceed to Checkout
                </button>

                <button
                  className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                  onClick={onClose}
                  type="button"
                >
                  Continue Shopping
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
