import {NextResponse} from 'next/server';
import {getSession} from '@/lib/auth';
import {prisma} from '@/lib/db';
import {stripe} from '@/lib/stripe';

export async function POST(req: Request) {
  const session = await getSession();
  const form = await req.formData().catch(() => null);
  const locale = (form?.get('locale') as string) || 'en';

  const base = process.env.APP_URL || new URL(req.url).origin;

  if (!session) {
    return NextResponse.redirect(new URL(`/${locale}/pricing`, base));
  }

  const sub = await prisma.subscription.findFirst({
    where: {userId: session.userId},
    orderBy: {createdAt: 'desc'}
  });

  if (!sub?.stripeCustomerId) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard/subscriptions?err=no_customer`, base));
  }

  const returnUrl = `${base}/${locale}/dashboard/subscriptions`;

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
      configuration: process.env.STRIPE_PORTAL_CONFIG_ID || undefined
    });

    return NextResponse.redirect(portal.url);
  } catch {
    return NextResponse.redirect(new URL(`/${locale}/dashboard/subscriptions?err=portal_failed`, base));
  }
}
