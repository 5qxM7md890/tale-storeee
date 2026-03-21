import {Card} from '@/components/Card';

export function SubscriptionCards({
  totalSubs,
  totalSlots
}: {
  totalSubs: number;
  totalSlots: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-4">
        <div className="text-xs text-white/60">Subscriptions</div>
        <div className="mt-1 text-2xl font-bold">{totalSubs}</div>
      </Card>
      <Card className="p-4">
        <div className="text-xs text-white/60">Total slots</div>
        <div className="mt-1 text-2xl font-bold">{totalSlots}</div>
      </Card>
      <Card className="p-4">
        <div className="text-xs text-white/60">Status</div>
        <div className="mt-1 text-2xl font-bold">Live</div>
      </Card>
    </div>
  );
}
