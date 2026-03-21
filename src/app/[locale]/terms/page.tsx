import {Card} from '@/components/Card';

export default async function TermsPage({params}: {params: Promise<{locale: string}>}) {
  await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <Card className="p-6">
        <div className="space-y-3 text-sm text-white/70">
          <p>
            These terms describe how subscriptions, access, and usage work for this service.
          </p>
          <p>
            By purchasing a plan, you agree to follow platform rules and not abuse the service.
          </p>
          <p>
            For billing changes and cancellations, use the billing portal from the Dashboard.
          </p>
        </div>
      </Card>
    </div>
  );
}
