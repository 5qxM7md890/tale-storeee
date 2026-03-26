import {Card} from '@/components/Card';

export default async function PrivacyPage({params}: {params: Promise<{locale: string}>}) {
  await params;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-14 pt-12 sm:px-6 md:pt-16">
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Privacy Policy</h1>
          <p className="max-w-3xl text-sm leading-7 text-white/65">
            This page explains the information we keep to operate accounts, billing, support, and
            service activation for Tale Store.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="space-y-5 text-sm leading-7 text-white/72">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Account and service data</h2>
              <p>
                We store only the information required to operate accounts, subscriptions, support,
                and server activation for Tale Store.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Payments</h2>
              <p>
                Payments are processed by our billing and payment providers. We do not store full
                card details on our servers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Support requests</h2>
              <p>
                You can request account or data-related support by contacting us through the support
                channels listed on the site.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
