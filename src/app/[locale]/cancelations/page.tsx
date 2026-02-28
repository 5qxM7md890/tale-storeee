import {Card} from '@/components/Card';
import {Link} from '@/i18n/navigation';

export default async function CancelationsPage({params}: {params: Promise<{locale: string}>}) {
  await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Cancelations</h1>
      <Card className="p-6">
        <div className="space-y-3 text-sm text-white/70">
          <p>
            Cancelations are managed through the billing portal.
          </p>
          <p>
            Go to Dashboard → Subscriptions → Manage billing.
          </p>
          <p>
            <Link href="/dashboard" className="font-semibold text-emerald-300 hover:underline">Open Dashboard →</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
