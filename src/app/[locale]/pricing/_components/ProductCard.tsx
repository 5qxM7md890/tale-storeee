'use client';

import {Card} from '@/components/Card';
import {useCart} from './CartContext';
import {formatUsdFromCents} from '@/lib/money';
import {useToast} from '@/components/Toast';

export function ProductCard({
  product
}: {
  product: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    pricing: {
      id: string;
      periodMonths: 1 | 3 | 6 | 12;
      unitMonthlyCents: number;
    }[];
  };
}) {
  const cart = useCart();
  const toast = useToast();
  const defaultOpt =
    product.pricing.find((p) => p.periodMonths === 1) || product.pricing[0];

  const inCart = cart.items.some((it) => it.productId === product.id);

  function add() {
    if (inCart) return;
    cart.addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      pricingOptionId: defaultOpt.id,
      periodMonths: 1,
      unitMonthlyCents: defaultOpt.unitMonthlyCents,
      qty: 1
    });
    toast.push(`Added ${product.name} to cart – 1 Month plan`, 'success');
  }

  return (
    <Card className="p-5">
      <div className="text-sm font-semibold">{product.name}</div>
      <div className="mt-2 text-xs text-white/60">
        {product.description || '—'}
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold">
            {formatUsdFromCents(defaultOpt.unitMonthlyCents)}
          </div>
          <div className="text-xs text-white/60">per month</div>
        </div>

        <button
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
          disabled={inCart}
          onClick={add}
        >
          {inCart ? 'Already in cart' : 'Add to cart'}
        </button>
      </div>
    </Card>
  );
}
