import {Card} from '@/components/Card';

export default async function TermsPage({params}: {params: Promise<{locale: string}>}) {
  await params;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-14 pt-12 sm:px-6 md:pt-16">
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Terms of Service</h1>
          <p className="max-w-3xl text-sm leading-7 text-white/65">
            These terms explain how subscriptions, access, and use of Tale Store are handled.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="space-y-5 text-sm leading-7 text-white/72">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Subscriptions and access</h2>
              <p>
                Purchasing a plan gives you access to the subscribed service for the active billing
                period. Access, setup, and provisioning may vary depending on the selected plan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Acceptable use</h2>
              <p>
                You agree not to abuse the service, bypass plan limits, or use Tale Store in a way
                that violates Discord rules, platform rules, or applicable laws.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Billing and changes</h2>
              <p>
                Subscription changes, renewals, and cancellations are managed through the billing
                area provided on the site. Availability of specific billing features may depend on
                the active payment setup.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
