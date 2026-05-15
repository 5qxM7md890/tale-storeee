import {Card} from '@/components/Card';
import {Link} from '@/i18n/navigation';

export default async function CancelationsPage({params}: {params: Promise<{locale: string}>}) {
  await params;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-14 pt-12 sm:px-6 md:pt-16">
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Cancelations</h1>
          <p className="max-w-3xl text-sm leading-7 text-white/65">
            Future renewals can be stopped from the billing area without changing the current design
            or subscription access already delivered for the active period.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="space-y-5 text-sm leading-7 text-white/72">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Manage future renewals</h2>
              <p>
                Cancelations are managed through the billing area. A cancellation stops future
                charges, but it does not automatically refund charges that were already processed.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Where to manage billing</h2>
              <p>
                Open the billing page from your account area to review subscriptions, invoices, and
                available billing actions.
              </p>
            </section>

            <p>
              <Link href="/billing" className="font-semibold text-violet-300 hover:underline">
                Open Billing →
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
