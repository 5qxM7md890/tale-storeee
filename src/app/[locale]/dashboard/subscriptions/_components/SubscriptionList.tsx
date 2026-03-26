import {Card} from '@/components/Card';

export function SubscriptionList({
  items,
  locale,
  activeGuildId
}: {
  items: any[];
  locale: string;
  activeGuildId: string | null;
}) {
  return (
    <div className="space-y-3">
      {items.map((s) => (
        <Card key={s.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{s.product?.name}</div>
              <div className="mt-1 text-xs text-white/60">
                {s.pricingOption?.periodMonths} months • {s.qtySlots} slots
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
              {s.subscription?.status}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-white/60">Slots</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {s.slots.map((slot: any) => (
                <div key={slot.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-xs text-white/70">Slot #{slot.slotNo}</div>
                  {slot.status === 'ASSIGNED' ? (
                    <div className="text-xs text-green-300">Assigned</div>
                  ) : (
                    <form
                      action={`/api/slots/${slot.id}/assign`}
                      method="post"
                      onSubmit={(e) => {
                        if (!activeGuildId) {
                          e.preventDefault();
                          window.location.href = `/${locale}/dashboard/select-server`;
                        }
                      }}
                    >
                      <input type="hidden" name="guildId" value={activeGuildId || ''} />
                      <button
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                        type="submit"
                      >
                        Assign
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
