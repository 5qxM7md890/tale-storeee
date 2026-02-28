'use client';

import {useEffect} from 'react';

type CartItem = {
  productId: string;
  name: string;
  monthlyCents: number;
  months: 1 | 3 | 6 | 12;
  pricingOptionId: string;
  qty: number;
};

const DURATIONS: Array<1 | 3 | 6 | 12> = [1, 3, 6, 12];

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
  onRemove: (index: number) => void;
  onQtyChange: (index: number, qty: number) => void;
  onMonthsChange: (index: number, months: 1 | 3 | 6 | 12) => void;
  totalCents: number;
  formatPrice: (cents: number) => string;
  onCheckout: () => void;
}) {
  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-[#0b0f14] p-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">Cart items ({items.length})</div>
              <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10" onClick={onClose}>
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4 overflow-auto pb-40" style={{maxHeight: 'calc(100vh - 220px)'}}>
              {items.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/70">
                  Your cart is empty.
                </div>
              ) : (
                items.map((it, idx) => {
                  const line = it.monthlyCents * it.months * it.qty;

                  return (
                    <div key={`${it.productId}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{it.name}</div>
                          <div className="text-sm text-white/60">{formatPrice(it.monthlyCents)} / month</div>
                        </div>
                        <button
                          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                          onClick={() => onRemove(idx)}
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-white/60">Duration</div>
                          <select
                            className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm"
                            value={it.months}
                            onChange={(e) => onMonthsChange(idx, Number(e.target.value) as 1 | 3 | 6 | 12)}
                          >
                            {DURATIONS.map((m) => (
                              <option key={m} value={m}>
                                {m} Month{m === 1 ? '' : 's'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs text-white/60">Quantity (slots)</div>
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              className="h-10 w-10 rounded-lg border border-white/15 bg-white/5 text-sm hover:bg-white/10"
                              onClick={() => onQtyChange(idx, it.qty - 1)}
                            >
                              -
                            </button>
                            <div className="flex h-10 flex-1 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-sm font-semibold">
                              {it.qty}
                            </div>
                            <button
                              className="h-10 w-10 rounded-lg border border-white/15 bg-white/5 text-sm hover:bg-white/10"
                              onClick={() => onQtyChange(idx, it.qty + 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-right text-sm text-white/70">
                        Line total: <span className="font-semibold text-white">{formatPrice(line)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0b0f14] p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/60">Total</div>
                <div className="text-lg font-extrabold">{formatPrice(totalCents)}</div>
              </div>

              <button
                disabled={items.length === 0}
                onClick={onCheckout}
                className="mt-3 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-40"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={onClose}
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              >
                Continue Shopping
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
