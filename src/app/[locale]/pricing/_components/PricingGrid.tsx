'use client';

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

export function PricingGrid({
  products,
  onAddToCart,
  formatPrice,
  isInCart
}: {
  products: Product[];
  onAddToCart: (productId: string) => void;
  formatPrice: (cents: number) => string;
  isInCart: (productId: string) => boolean;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const monthly =
          p.pricing.find((x) => x.periodMonths === 1)?.unitMonthlyCents ??
          p.pricing[0]?.unitMonthlyCents ??
          0;

        const already = isInCart(p.id);

        return (
          <div
            key={p.id}
            className="fate-card rounded-[30px] p-5 transition hover:border-white/20 sm:p-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-lg font-bold"><img src="/icons/apps.svg" alt="app" className="h-5 w-5 opacity-90" />{p.name}</div>
                <div className="mt-1 text-sm text-white/60">{p.description ?? '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold sm:text-right">{formatPrice(monthly)}</div>
                <div className="text-xs text-white/50">per month</div>
              </div>
            </div>

            <button
              onClick={() => onAddToCart(p.id)}
              disabled={already}
              className="mt-7 w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {already ? 'Already in cart' : 'Add to cart'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
