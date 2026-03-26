import {Card} from '@/components/Card';

export default async function RefundPolicyPage({params}: {params: Promise<{locale: string}>}) {
  await params;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-14 pt-12 sm:px-6 md:pt-16">
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Refund Policy</h1>
          <p className="max-w-3xl text-sm leading-7 text-white/65">
            Refund requests are reviewed based on delivery status, billing accuracy, and whether
            service access or provisioning has already started.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="space-y-5 text-sm leading-7 text-white/72">
            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Digital service notice</h2>
              <p>
                Tale Store is a digital, subscription-based service. Because access, provisioning,
                and setup may begin shortly after purchase, refunds are not generally guaranteed once
                service delivery has started.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">When refunds may be reviewed</h2>
              <p>
                Refund requests may be reviewed when the service was not delivered, provisioning
                failed due to our side, or billing was processed incorrectly.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Cancellations and prior charges</h2>
              <p>
                Canceling a subscription stops future renewals only. It does not automatically refund
                previous charges that were already processed.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-semibold text-white">Support first</h2>
              <p>
                If you believe there is a billing issue, please contact support first so we can review
                the order and assist you as quickly as possible.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
