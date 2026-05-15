import {PrismaClient} from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia' as any
});

const periods = [1, 3, 6, 12] as const;

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY missing');

  const products = await prisma.product.findMany({include: {pricingOptions: true}});

  for (const p of products) {
    let stripeProductId = p.stripeProductId;

    if (!stripeProductId) {
      const sp = await stripe.products.create({
        name: p.name,
        description: p.description || undefined
      });
      stripeProductId = sp.id;
      await prisma.product.update({where: {id: p.id}, data: {stripeProductId}});
    }

    for (const months of periods) {
      const opt = p.pricingOptions.find((o) => o.periodMonths === months);
      if (!opt) continue;
      if (opt.stripePriceId) continue;

      const unitAmount = opt.unitMonthlyCents * months;

      const price = await stripe.prices.create({
        product: stripeProductId,
        currency: 'usd',
        unit_amount: unitAmount,
        recurring: {
          interval: 'month',
          interval_count: months
        }
      });

      await prisma.pricingOption.update({where: {id: opt.id}, data: {stripePriceId: price.id}});
    }
  }

  console.log('Stripe sync complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
