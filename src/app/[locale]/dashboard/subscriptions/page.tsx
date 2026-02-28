import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {prisma} from '@/lib/db';
import {getSession} from '@/lib/auth';

export default async function SubscriptionsPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams?: {err?: string};
}) {
  const {locale} = await params;

  const session = await getSession();
  if (!session) redirect(`/api/auth/discord/login?next=/${locale}/dashboard/subscriptions`);

  const cookieStore = await cookies(); // ✅ لازم await في Next 16
  const activeGuildId = cookieStore.get('active_guild_id')?.value || null;

  const items = await prisma.subscriptionItem.findMany({
    where: {subscription: {userId: session.userId}},
    include: {
      product: true,
      pricingOption: true,
      subscription: true,
      slots: {orderBy: {slotNo: 'asc'}}
    },
    orderBy: {createdAt: 'desc'}
  });

  // لو تبغى تشدد gating هنا:
  // if (!activeGuildId) redirect(`/${locale}/dashboard/select-server`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Your Subscriptions</h1>
        {searchParams?.err === 'no_customer' ? (
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
            No Stripe customer found yet. Please subscribe first, then use Manage billing.
          </div>
        ) : null}

        <p className="mt-2 text-sm text-white/60">
          Manage your subscriptions, assign slots to your selected server, and open the billing portal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Subscriptions</div>
          <div className="mt-1 text-2xl font-bold">{items.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Active server</div>
          <div className="mt-1 truncate text-2xl font-bold">{activeGuildId ? activeGuildId : 'Not selected'}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Total slots</div>
          <div className="mt-1 text-2xl font-bold">
            {items.reduce((sum, it) => sum + (it.qtySlots || 0), 0)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          href={`/${locale}/pricing`}
        >
          New Subscription
        </a>
        <form action="/api/billing/portal" method="post">
          <input type="hidden" name="locale" value={locale} />
          <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
            Manage billing
          </button>
        </form>
        <a
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          href={`/${locale}/dashboard/invoices`}
        >
          Your Invoices
        </a>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            No subscriptions found.
          </div>
        ) : (
          items.map((it) => {
            const assigned = it.slots.filter((s) => s.status === 'ASSIGNED').length;
            const unassigned = it.slots.filter((s) => s.status === 'UNASSIGNED').length;
            const months = it.pricingOption.periodMonths;

            return (
              <div key={it.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold">{it.product.name}</div>
                    <div className="mt-1 text-sm text-white/60">
                      Duration: {months} month(s) · Slots: {it.qtySlots}
                    </div>
                  </div>
                  <div className="text-sm text-white/70">
                    Assigned: <span className="font-semibold text-white">{assigned}</span> · Unassigned:{' '}
                    <span className="font-semibold text-white">{unassigned}</span>
                  </div>
                </div>

                {activeGuildId && unassigned > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {it.slots
                      .filter((s) => s.status === 'UNASSIGNED')
                      .slice(0, 6)
                      .map((slot) => (
                        <form
                          key={slot.id}
                          action={`/api/slots/${slot.id}/assign`}
                          method="post"
                          className="inline-flex"
                        >
                          <input type="hidden" name="guildId" value={activeGuildId} />
                          <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">
                            Assign slot #{slot.slotNo}
                          </button>
                        </form>
                      ))}
                  </div>
                )}

                {!activeGuildId && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                    Select a server to assign slots.
                    <a className="ml-2 underline" href={`/${locale}/dashboard/select-server`}>
                      Select server
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
