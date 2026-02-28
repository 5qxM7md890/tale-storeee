'use client';

import * as React from 'react';
import {useCart} from '@/app/[locale]/pricing/_components/CartContext';
import {CartDrawer} from '@/components/CartDrawer';
import {cartTotalCents} from '@/lib/cart';
import {formatUsdFromCents} from '@/lib/money';
import {useToast} from '@/components/Toast';

type PricingOpt = {
  id: string;
  periodMonths: 1 | 3 | 6 | 12;
  unitMonthlyCents: number;
  stripePriceId?: string | null;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  pricing: PricingOpt[];
};

export function GlobalCartDrawer({locale}: {locale: string}) {
  const cart = useCart();
  const toast = useToast();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  // Fetch products lazily (first open) to support duration switching
  React.useEffect(() => {
    if (loaded) return;
    if (!cart.open) return;

    (async () => {
      try {
        const res = await fetch('/api/store/products');
        const data = await res.json();
        setProducts(data.products || []);
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    })();
  }, [cart.open, loaded]);

  const productsById = React.useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const total = cartTotalCents(cart.items);

  async function checkout() {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          locale,
          items: cart.items.map((it) => ({pricingOptionId: it.pricingOptionId, qty: it.qty}))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        toast.push(data?.error || 'Checkout failed', 'error');
        return;
      }

      if (data.loginUrl) {
        window.location.href = data.loginUrl;
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.push('Checkout session not returned.', 'error');
    } catch {
      toast.push('Network error during checkout.', 'error');
    }
  }

  function onMonthsChange(pricingOptionId: string, months: 1 | 3 | 6 | 12) {
    const item = cart.items.find((x) => x.pricingOptionId === pricingOptionId);
    if (!item) return;

    const product = productsById.get(item.productId);
    const opt = product?.pricing.find((p) => p.periodMonths === months);

    if (!opt) {
      toast.push('Duration not available for this product.', 'error');
      return;
    }

    cart.setPeriod(pricingOptionId, months, opt.id, opt.unitMonthlyCents);
  }

  return (
    <CartDrawer
      open={cart.open}
      onClose={cart.closeCart}
      items={cart.items}
      onRemove={(id) => {
        cart.removeItem(id);
        toast.push('Removed from cart.', 'info');
      }}
      onQtyChange={(id, qty) => {
        cart.setQty(id, qty);
      }}
      onMonthsChange={onMonthsChange}
      totalCents={total}
      formatPrice={formatUsdFromCents}
      onCheckout={checkout}
    />
  );
}
