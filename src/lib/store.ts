import {prisma} from '@/lib/db';
import {seedProducts} from '@/data/seed-products';

let seededOnce = false;
let seeding: Promise<void> | null = null;

/**
 * Production-safe auto seed.
 * - Idempotent upserts by slug (and by composite key for pricing options)
 * - Runs at most once per process (seededOnce) and serializes concurrent calls (seeding)
 */
async function ensureSeededProducts(): Promise<void> {
  if (seededOnce) return;
  if (seeding) return seeding;

  seeding = (async () => {
    try {
      // Seed if DB is empty OR missing any of the required Fate-style slugs.
      const existing = await prisma.product.findMany({select: {slug: true}});
      const existingSet = new Set(existing.map((x) => x.slug));
      const seedSlugs = seedProducts.map((p) => p.slug);
      const missing = seedSlugs.filter((s) => !existingSet.has(s));

      // Already seeded (all required slugs present)
      if (existing.length > 0 && missing.length === 0) {
        seededOnce = true;
        return;
      }

      // Idempotent seed (upsert by slug + (productId, periodMonths))
      for (const p of seedProducts) {
        const product = await prisma.product.upsert({
          where: {slug: p.slug},
          update: {name: p.name, description: p.description ?? null},
          create: {slug: p.slug, name: p.name, description: p.description ?? null}
        });

        for (const opt of p.pricing) {
          await prisma.pricingOption.upsert({
            where: {
              productId_periodMonths: {
                productId: product.id,
                periodMonths: opt.periodMonths
              }
            },
            update: {unitMonthlyCents: opt.unitMonthlyCents},
            create: {
              productId: product.id,
              periodMonths: opt.periodMonths,
              unitMonthlyCents: opt.unitMonthlyCents
            }
          });
        }
      }

      seededOnce = true;
    } finally {
      // Allow retries if seeding failed, but don't block future calls.
      seeding = null;
    }
  })();

  return seeding;
}

type Pricing = {
  id: string;
  periodMonths: 1 | 3 | 6 | 12;
  unitMonthlyCents: number;
  stripePriceId?: string | null;
};

type ProductForPricing = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  pricing: Pricing[];
};

function normalizeProductKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\bbot\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function dedupeProducts(products: ProductForPricing[]) {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = normalizeProductKey(product.name || product.slug);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function getProductsForPricing(): Promise<{products: ProductForPricing[]}> {
  const useSeedFallback =
    process.env.USE_SEED_FALLBACK === 'true' && process.env.NODE_ENV !== 'production';

  // Dev-only fallback (Feature flag) — never used in production
  if (useSeedFallback) {
    return {products: seedProducts};
  }

  // Production-safe auto-seed: ensure required products exist.
  await ensureSeededProducts();

  const products = await prisma.product.findMany({
    include: {pricingOptions: true},
    orderBy: {createdAt: 'asc'}
  });

  // Keep seeded products first, then include any extra/custom products after them.
  const order = new Map(seedProducts.map((p, i) => [p.slug, i]));
  const sorted = products.slice().sort((a, b) => {
    const aOrder = order.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = order.get(b.slug) ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });

  const mapped = sorted.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    pricing: p.pricingOptions
      .slice()
      .sort((a, b) => a.periodMonths - b.periodMonths)
      .map((o) => ({
        id: o.id,
        periodMonths: o.periodMonths as 1 | 3 | 6 | 12,
        unitMonthlyCents: o.unitMonthlyCents,
        stripePriceId: o.stripePriceId
      }))
  }));

  return {
    products: dedupeProducts(mapped)
  };
}
