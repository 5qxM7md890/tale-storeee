import {NextResponse} from 'next/server';
import type Stripe from 'stripe';
import {InvoiceStatus, SlotStatus, SubscriptionStatus} from '@prisma/client';
import {stripe} from '@/lib/stripe';
import {prisma} from '@/lib/db';

export const runtime = 'nodejs';

function mapSubStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'canceled':
      return SubscriptionStatus.CANCELED;
    case 'incomplete':
      return SubscriptionStatus.INCOMPLETE;
    case 'incomplete_expired':
      return SubscriptionStatus.INCOMPLETE_EXPIRED;
    case 'trialing':
      return SubscriptionStatus.TRIALING;
    case 'unpaid':
      return SubscriptionStatus.UNPAID;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

function mapInvoiceStatus(status: Stripe.Invoice.Status | null): InvoiceStatus {
  switch (status) {
    case 'draft':
      return InvoiceStatus.DRAFT;
    case 'open':
      return InvoiceStatus.OPEN;
    case 'paid':
      return InvoiceStatus.PAID;
    case 'void':
      return InvoiceStatus.VOID;
    case 'uncollectible':
      return InvoiceStatus.UNCOLLECTIBLE;
    default:
      return InvoiceStatus.OPEN;
  }
}

async function ensureProduct(stripeProductId: string, stripeProductName?: string | null) {
  const existing = await prisma.product.findFirst({where: {stripeProductId}});
  if (existing) return existing;

  // fallback minimal create (should rarely happen if you seed + stripe-sync)
  const slug = `stripe-${stripeProductId}`.slice(0, 64);
  return prisma.product.create({
    data: {
      slug,
      name: stripeProductName || `Stripe Product ${stripeProductId}`,
      description: null,
      stripeProductId
    }
  });
}

async function ensurePricingOption(params: {
  productId: string;
  periodMonths: number;
  unitMonthlyCents: number;
  stripePriceId: string;
}) {
  const {productId, periodMonths, unitMonthlyCents, stripePriceId} = params;

  // composite unique: @@unique([productId, periodMonths])
  return prisma.pricingOption.upsert({
    where: {productId_periodMonths: {productId, periodMonths}},
    update: {
      unitMonthlyCents,
      stripePriceId
    },
    create: {
      productId,
      periodMonths,
      unitMonthlyCents,
      stripePriceId
    }
  });
}

async function syncSlotsToQty(subscriptionItemId: string, qty: number) {
  const currentSlots = await prisma.subscriptionSlot.count({
    where: {subscriptionItemId}
  });

  if (currentSlots < qty) {
    await prisma.subscriptionSlot.createMany({
      data: Array.from({length: qty - currentSlots}).map((_, i) => ({
        subscriptionItemId,
        slotNo: currentSlots + i + 1,
        status: SlotStatus.UNASSIGNED
      }))
    });
    return;
  }

  if (currentSlots > qty) {
    // Disable extras rather than deleting (safer)
    const extra = await prisma.subscriptionSlot.findMany({
      where: {subscriptionItemId},
      orderBy: {slotNo: 'desc'},
      take: currentSlots - qty
    });

    if (extra.length) {
      await prisma.subscriptionSlot.updateMany({
        where: {id: {in: extra.map((s) => s.id)}},
        data: {status: SlotStatus.DISABLED, guildId: null}
      });
    }
  }
}

async function upsertSubscriptionItemByStripeItemId(args: {
  stripeSubscriptionItemId: string;
  subscriptionId: string;
  productId: string;
  pricingOptionId: string;
  qtySlots: number;
}) {
  const {stripeSubscriptionItemId, subscriptionId, productId, pricingOptionId, qtySlots} = args;

  const existing = await prisma.subscriptionItem.findFirst({
    where: {stripeSubscriptionItemId}
  });

  const item = existing
    ? await prisma.subscriptionItem.update({
        where: {id: existing.id},
        data: {
          subscriptionId,
          productId,
          pricingOptionId,
          qtySlots
        }
      })
    : await prisma.subscriptionItem.create({
        data: {
          subscriptionId,
          productId,
          pricingOptionId,
          qtySlots,
          stripeSubscriptionItemId
        }
      });

  await syncSlotsToQty(item.id, qtySlots);
  return item;
}

async function syncSubscriptionFromStripe(opts: {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  userId?: string | null;
}) {
  const {stripeSubscriptionId, stripeCustomerId, userId} = opts;

  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['items.data.price.product']
  });

  const status = mapSubStatus(sub.status);
  const currentPeriodEnd = new Date(sub.current_period_end * 1000);

  // Find existing subscription by stripe id
  const existing = await prisma.subscription.findUnique({
    where: {stripeSubscriptionId}
  });

  // If we don't have a userId and there's no existing row, we can't create (schema requires userId).
  if (!existing && !userId) {
    console.warn('Webhook: missing userId for subscription create', stripeSubscriptionId);
    return null;
  }

  const subscriptionRow = existing
    ? await prisma.subscription.update({
        where: {stripeSubscriptionId},
        data: {
          status,
          currentPeriodEnd,
          stripeCustomerId
        }
      })
    : await prisma.subscription.create({
        data: {
          userId: userId!,
          stripeSubscriptionId,
          stripeCustomerId,
          status,
          currentPeriodEnd
        }
      });

  // Sync items -> DB
  for (const it of sub.items.data) {
    const stripeItemId = String(it.id);
    const qty = Math.max(1, it.quantity ?? 1);

    const price = it.price;
    const stripePriceId = String(price.id);

    // Determine months from recurring
    const months =
      price.recurring?.interval === 'month'
        ? Math.max(1, price.recurring?.interval_count ?? 1)
        : 1;

    const unitAmount = price.unit_amount ?? 0;
    const unitMonthlyCents = months > 0 ? Math.round(unitAmount / months) : unitAmount;

    // product id from expanded product
    const prod = price.product as Stripe.Product | string;
    const stripeProductId = typeof prod === 'string' ? prod : prod.id;
    const stripeProductName = typeof prod === 'string' ? null : prod.name;

    const productRow = await ensureProduct(stripeProductId, stripeProductName);

    // pricing option: match on stripePriceId if exists; otherwise ensure composite (productId, months)
    let pricingRow = await prisma.pricingOption.findFirst({
      where: {stripePriceId}
    });

    if (!pricingRow) {
      pricingRow = await ensurePricingOption({
        productId: productRow.id,
        periodMonths: months,
        unitMonthlyCents,
        stripePriceId
      });
    }

    await upsertSubscriptionItemByStripeItemId({
      stripeSubscriptionItemId: stripeItemId,
      subscriptionId: subscriptionRow.id,
      productId: productRow.id,
      pricingOptionId: pricingRow.id,
      qtySlots: qty
    });
  }

  return subscriptionRow;
}

async function upsertInvoiceFromStripe(invoice: Stripe.Invoice) {
  const stripeInvoiceId = String(invoice.id);
  const stripeSubId = invoice.subscription ? String(invoice.subscription) : null;

  if (!stripeSubId) return;

  const subRow = await prisma.subscription.findUnique({
    where: {stripeSubscriptionId: stripeSubId}
  });
  if (!subRow) return;

  const status = mapInvoiceStatus(invoice.status);
  const amountPaid = invoice.amount_paid ?? 0;
  const hostedInvoiceUrl = invoice.hosted_invoice_url ?? null;
  const pdfUrl = invoice.invoice_pdf ?? null;
  const invoiceCreated = new Date((invoice.created ?? Math.floor(Date.now() / 1000)) * 1000);

  await prisma.invoice.upsert({
    where: {stripeInvoiceId},
    update: {
      status,
      amountPaid,
      hostedInvoiceUrl,
      pdfUrl,
      invoiceCreated
    },
    create: {
      subscriptionId: subRow.id,
      stripeInvoiceId,
      status,
      amountPaid,
      hostedInvoiceUrl,
      pdfUrl,
      invoiceCreated
    }
  });
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({error: 'Webhook not configured'}, {status: 500});
  }

  // ✅ RAW BODY (required for Stripe signature verification)
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret) as Stripe.Event;
  } catch (err: any) {
    return NextResponse.json({error: `Invalid signature: ${err.message}`}, {status: 400});
  }

  // ✅ Idempotency
  const existing = await prisma.webhookEvent.findUnique({where: {id: event.id}});
  if (existing?.processed) {
    return NextResponse.json({received: true, deduped: true});
  }

  await prisma.webhookEvent.upsert({
    where: {id: event.id},
    update: {},
    create: {id: event.id, processed: false}
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const stripeSubscriptionId = session.subscription ? String(session.subscription) : null;
        const stripeCustomerId = session.customer ? String(session.customer) : null;

        const userId =
          (session.metadata?.userId as string | undefined) ||
          (session.client_reference_id as string | null) ||
          null;

        if (stripeSubscriptionId && stripeCustomerId) {
          await syncSubscriptionFromStripe({
            stripeSubscriptionId,
            stripeCustomerId,
            userId
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;

        // Upsert invoice row
        await upsertInvoiceFromStripe(invoice);

        // Also refresh subscription status + period end
        if (invoice.subscription && invoice.customer) {
          await syncSubscriptionFromStripe({
            stripeSubscriptionId: String(invoice.subscription),
            stripeCustomerId: String(invoice.customer),
            userId: null
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        await upsertInvoiceFromStripe(invoice);

        // Mark subscription past_due (if exists)
        if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: {stripeSubscriptionId: String(invoice.subscription)},
            data: {status: SubscriptionStatus.PAST_DUE}
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        const stripeSubscriptionId = String(sub.id);
        const stripeCustomerId = String(sub.customer);

        // sync subscription + items
        await syncSubscriptionFromStripe({
          stripeSubscriptionId,
          stripeCustomerId,
          userId: null
        });

        // for deleted: force canceled in DB
        if (event.type === 'customer.subscription.deleted') {
          await prisma.subscription.updateMany({
            where: {stripeSubscriptionId},
            data: {status: SubscriptionStatus.CANCELED}
          });
        }
        break;
      }

      default:
        // ignore
        break;
    }

    await prisma.webhookEvent.update({
      where: {id: event.id},
      data: {processed: true}
    });

    return NextResponse.json({received: true});
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    // do NOT mark processed to allow retry
    return NextResponse.json({error: 'Webhook handling failed'}, {status: 500});
  }
}
