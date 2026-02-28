import {Accordion} from '@/components/Accordion';
import {Card} from '@/components/Card';

export default async function SupportPage({params}: {params: Promise<{locale: string}>}) {
  await params;

  const discordUrl =
    process.env.NEXT_PUBLIC_DISCORD_INVITE ||
    process.env.DISCORD_SUPPORT_URL ||
    '';

  const faq = [
    {q: 'I paid — how do I activate?', a: 'Open Dashboard, pick your server, then assign slots from Subscriptions.'},
    {q: 'Where can I change billing?', a: 'Dashboard → Subscriptions → Manage billing (Stripe portal).'},
    {q: 'Need help right now?', a: 'Join Discord support and open a ticket.'}
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Support</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Fastest support is through Discord.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-bold">Discord Support</div>
            <div className="mt-1 text-sm text-white/70">
              Join the server to get help, report issues, and request features.
            </div>
          </div>
          {discordUrl ? (
            <a
              href={discordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              Join Discord
            </a>
          ) : (
            <div className="text-sm text-white/60">
              Discord link not set. Add <span className="font-mono">DISCORD_SUPPORT_URL</span>.
            </div>
          )}
        </div>
      </Card>

      <section>
        <div className="mb-3 text-lg font-bold">FAQ</div>
        <Accordion items={faq} />
      </section>
    </div>
  );
}
