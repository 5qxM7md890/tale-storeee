import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {prisma} from '@/lib/db';
import {Link} from '@/i18n/navigation';
import {Card} from '@/components/Card';
import {Button} from '@/components/Button';
import {addTestBotAction} from './actions';

function formatPricingPeriod(periodMonths?: number | null) {
  if (!periodMonths) return '—';
  if (periodMonths === 1) return 'Monthly';
  return `Every ${periodMonths} months`;
}

function formatStatus(value: string | null | undefined) {
  if (!value) return 'Unknown';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function MyBotsPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string}>;
  searchParams?: Promise<{status?: string}>;
}) {
  const {locale} = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const statusNotice = resolvedSearchParams?.status || '';
  const session = await getSession();

  if (!session) {
    redirect(`/api/auth/discord/login?next=/${locale}/my-bots`);
  }

  const bots = await prisma.botInstance.findMany({
    where: {userId: session.userId},
    include: {
      BotSetting: true,
      GuildBinding: true,
      Product: true,
      PricingOption: true
    },
    orderBy: {createdAt: 'desc'}
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 md:py-14">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Bots</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
            Review your assigned bot instances, invitation links, and current guild binding status.
          </p>
        </div>

        <form action={addTestBotAction} className="shrink-0">
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit">Create Test Bot</Button>
        </form>
      </div>

      {statusNotice === 'no_inventory' ? (
        <Card className="border border-amber-400/20 bg-amber-500/[0.05] p-4 sm:p-5">
          <div className="text-sm font-semibold text-amber-200">No bot inventory is available right now.</div>
          <p className="mt-1 text-sm leading-6 text-amber-100/75">
            All available bots are currently reserved or assigned. Add more inventory rows, then try again.
          </p>
        </Card>
      ) : null}

      {bots.length === 0 ? (
        <Card className="p-6 sm:p-7">
          <div className="text-lg font-semibold text-white">No bots yet</div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
            Once a bot instance is assigned to your account, it will appear here with its status, plan, invite link,
            and guild binding details.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Browse plans
            </Link>
            <form action={addTestBotAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="ghost">Create Test Bot</Button>
            </form>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {bots.map((bot) => {
            const displayName = bot.displayName || bot.Product?.name || 'Untitled Bot';
            const guildId = bot.GuildBinding?.guildId || bot.guildId;
            const isBound = Boolean(bot.GuildBinding?.guildId || bot.guildId);

            return (
              <Card key={bot.id} className="p-5 sm:p-6" id={`bot-${bot.id}`}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-lg font-bold tracking-tight text-white">{displayName}</div>
                      <div className="mt-1 text-sm text-white/55">
                        {bot.Product?.name || 'Bot plan'}
                        {bot.PricingOption ? ` • ${formatPricingPeriod(bot.PricingOption.periodMonths)}` : ''}
                      </div>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                      {formatStatus(bot.status)}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Guild</div>
                      <div className="mt-2 break-all text-sm font-medium text-white/90">
                        {guildId || 'Not bound yet'}
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        {isBound ? 'Guild binding active' : 'Waiting for guild binding'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Mode</div>
                      <div className="mt-2 text-sm font-medium text-white/90">
                        {bot.BotSetting?.mode || 'VOICE'}
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        Default limit: {bot.BotSetting?.defaultUserLimit ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Invite URL</div>
                    <div className="mt-2 break-all text-sm text-white/75">
                      {bot.inviteUrl || 'No invite URL yet'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/my-bots/${bot.id}`}
                      className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                    >
                      Open
                    </Link>

                    {bot.inviteUrl ? (
                      <a
                        href={bot.inviteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-violet-300/14 bg-violet-500/[0.08] px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500/[0.14]"
                      >
                        Invite Bot
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/45"
                      >
                        Invite Bot
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
