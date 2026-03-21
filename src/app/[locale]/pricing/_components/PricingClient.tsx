'use client';

import {useMemo} from 'react';
import {PricingGrid} from './PricingGrid';
import {useCart} from './CartContext';
import {useToast} from '@/components/Toast';

type PricingOpt = {
  id: string;
  periodMonths: 1 | 3 | 6 | 12;
  unitMonthlyCents: number;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  pricing: PricingOpt[];
};

function centsToUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PricingClient({
  products,
  locale
}: {
  locale: string;
  products: Product[];
}) {
  const cart = useCart();
  const toast = useToast();

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const inCart = useMemo(() => new Set(cart.items.map((i) => i.productId)), [cart.items]);

  function addToCart(productId: string) {
    const p = byId.get(productId);
    if (!p) return;
    if (inCart.has(productId)) return;

    const opt = p.pricing.find((x) => x.periodMonths === 1) ?? p.pricing[0];
    if (!opt) return;

    cart.addItem({
      productId,
      productSlug: p.slug,
      name: p.name,
      pricingOptionId: opt.id,
      periodMonths: opt.periodMonths,
      unitMonthlyCents: opt.unitMonthlyCents,
      qty: 1
    });

    toast.push(`Added ${p.name} to cart – 1 Month plan`, 'success');
  }

  return (
    <PricingGrid
      products={products}
      onAddToCart={addToCart}
      formatPrice={centsToUsd}
      isInCart={(id) => inCart.has(id)}
    />
  );
}
