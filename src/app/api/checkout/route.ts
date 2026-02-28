import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getSession} from '@/lib/auth';
import {prisma} from '@/lib/db';
import {stripe} from '@/lib/stripe';

const BodySchema = z.object({
  locale: z.string().default('en'),
  items: z.array(
    z.object({
      pricingOptionId: z.string(),
      qty: z.number().int().min(1).max(100)
    })
  )
});

export async function POST(req: Request) {
  const session = await getSession();
  const body = BodySchema.parse(await req.json());

  const appUrl = process.env.APP_URL || new URL(req.url).origin;
  const nextLocale = body.locale === 'ar' ? 'ar' : 'en';

  if (!session) {
    return NextResponse.json(
      {loginUrl: `/api/auth/discord/login?next=/${nextLocale}/pricing`},
      {status: 401}
    );
  }

  const options = await prisma.pricingOption.findMany({
    where: {id: {in: body.items.map((i) => i.pricingOptionId)}}
  });
  const map = new Map(options.map((o) => [o.id, o] as const));

  const missing = body.items.find((i) => !map.get(i.pricingOptionId)?.stripePriceId);
  if (missing) {
    return NextResponse.json(
      {error: 'Stripe prices not configured. Run stripe:sync and ensure stripePriceId is set.'},
      {status: 400}
    );
  }

  const line_items = body.items.map((i) => {
    const opt = map.get(i.pricingOptionId)!;
    return {price: opt.stripePriceId!, quantity: i.qty};
  });

  const success_url = `${appUrl}/${nextLocale}/dashboard?checkout=success`;
  const cancel_url = `${appUrl}/${nextLocale}/pricing?checkout=cancel`;

  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items,
    success_url,
    cancel_url,
    customer_email: session.user.email || undefined,
    client_reference_id: session.userId,
    metadata: {userId: session.userId}
  });

  return NextResponse.json({checkoutUrl: checkout.url});
}
