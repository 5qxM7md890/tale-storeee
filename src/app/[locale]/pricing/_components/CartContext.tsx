'use client';

import * as React from 'react';
import type {CartItem} from '@/lib/cart';

type CartState = {
  open: boolean;
  items: CartItem[];
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (pricingOptionId: string) => void;
  setQty: (pricingOptionId: string, qty: number) => void;
  setPeriod: (pricingOptionId: string, months: 1|3|6|12, newPricingOptionId: string, newUnitMonthlyCents: number) => void;
  clear: () => void;
};

const CartCtx = React.createContext<CartState | null>(null);

const STORAGE_KEY = 'tale_cart_v1';

export function CartProvider({children}: {children: React.ReactNode}) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);


  const api: CartState = {
    open,
    items,
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
    addItem: (item) => {
      setItems((prev) => {
        const found = prev.find((p) => p.pricingOptionId === item.pricingOptionId);
        if (found) {
          return prev.map((p) =>
            p.pricingOptionId === item.pricingOptionId ? {...p, qty: p.qty + item.qty} : p
          );
        }
        return [...prev, item];
      });
      setOpen(true);
    },
    removeItem: (pricingOptionId) => setItems((prev) => prev.filter((p) => p.pricingOptionId !== pricingOptionId)),
    setQty: (pricingOptionId, qty) => setItems((prev) => prev.map((p) => p.pricingOptionId === pricingOptionId ? {...p, qty: Math.max(1, qty)} : p)),
    setPeriod: (pricingOptionId, months, newPricingOptionId, newUnitMonthlyCents) => setItems((prev) => prev.map((p) => {
      if (p.pricingOptionId !== pricingOptionId) return p;
      return {
        ...p,
        periodMonths: months,
        pricingOptionId: newPricingOptionId,
        unitMonthlyCents: newUnitMonthlyCents
      };
    })),
    clear: () => setItems([])
  };

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
