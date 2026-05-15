import {NextResponse} from 'next/server';
import {getSession} from '@/lib/auth';
import {prisma} from '@/lib/db';

export async function POST(req: Request, {params}: {params: Promise<{slotId: string}>}) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

  const {slotId} = await params;

  const contentType = req.headers.get('content-type') || '';
  let guildId: string | null = null;

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    guildId = body.guildId;
  } else {
    const form = await req.formData();
    guildId = String(form.get('guildId') || '');
  }

  if (!guildId) return NextResponse.json({error: 'guildId required'}, {status: 400});

  const slot = await prisma.subscriptionSlot.findUnique({
    where: {id: slotId},
    include: {subscriptionItem: {include: {subscription: true}}}
  });

  if (!slot || slot.subscriptionItem.subscription.userId !== session.userId) {
    return NextResponse.json({error: 'Not found'}, {status: 404});
  }

  const updated = await prisma.subscriptionSlot.update({
    where: {id: slotId},
    data: {guildId, status: 'ASSIGNED'}
  });

  if (!contentType.includes('application/json')) {
    return NextResponse.redirect(new URL('/en/dashboard/subscriptions', req.url));
  }

  return NextResponse.json({ok: true, slot: updated});
}
