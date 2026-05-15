import {getProductsForPricing} from '@/lib/store';
import PricingClient from './_components/PricingClient';

export default async function PricingPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const {products} = await getProductsForPricing();

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-10 pt-16 sm:px-6 md:pb-14 md:pt-24">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
          Choose a plan that is right for you
        </h1>
        <p className="mt-3 max-w-2xl text-base text-white/65">
          Explore Tale Store bot plans built for a smooth, reliable subscription experience.
        </p>
      </div>

      <div className="pt-6 md:pt-10">
        <PricingClient locale={locale} products={products} />
      </div>
    </div>
  );
}
