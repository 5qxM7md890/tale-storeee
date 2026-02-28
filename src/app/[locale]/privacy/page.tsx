import {Card} from '@/components/Card';

export default async function PrivacyPage({params}: {params: Promise<{locale: string}>}) {
  await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <Card className="p-6">
        <div className="space-y-3 text-sm text-white/70">
          <p>
            We only store the minimum data required to operate accounts, subscriptions, and server activation.
          </p>
          <p>
            Payment information is handled by Stripe. We do not store full card details.
          </p>
          <p>
            You can request data deletion by contacting support.
          </p>
        </div>
      </Card>
    </div>
  );
}
