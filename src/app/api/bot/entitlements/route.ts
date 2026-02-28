import {NextResponse} from 'next/server';
import {prisma} from '@/lib/db';
import {redis} from '@/lib/redis';
import {hmacSha256Hex, sha256Hex, timingSafeEqualHex} from '@/lib/hmac';

const TTL_SECONDS = 60;
const NONCE_TTL_SECONDS = 600;
const TS_WINDOW_SECONDS = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const guildId = url.searchParams.get('guild_id');
  const productSlug = url.searchParams.get('product_slug');

  if (!guildId || !productSlug) {
    return NextResponse.json({error: 'guild_id and product_slug required'}, {status: 400});
  }

  const botId = req.headers.get('x-bot-id') || '';
  const ts = req.headers.get('x-timestamp') || '';
  const nonce = req.headers.get('x-nonce') || '';
  const sig = req.headers.get('x-signature') || '';

  if (!botId || !ts || !nonce || !sig) {
    return NextResponse.json({error: 'Missing auth headers'}, {status: 401});
  }

  const secret = process.env.BOT_HMAC_SECRET;
  if (!secret) {
    return NextResponse.json({error: 'Server not configured'}, {status: 500});
  }

  const now = Math.floor(Date.now() / 1000);
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(now - tsNum) > TS_WINDOW_SECONDS) {
    return NextResponse.json({error: 'Invalid timestamp'}, {status: 401});
  }

  if (redis) {
    const nonceKey = `nonce:${botId}:${nonce}`;
    const ok = await redis.set(nonceKey, '1', 'EX', NONCE_TTL_SECONDS, 'NX');
    if (ok !== 'OK') {
      return NextResponse.json({error: 'Replay detected'}, {status: 401});
    }
  }

  const method = 'GET';
  const pathAndQuery = url.pathname + (url.search || '');
  const bodyHash = sha256Hex('');
  const base = `${method}|${pathAndQuery}|${ts}|${nonce}|${bodyHash}`;
  const expected = hmacSha256Hex(secret, base);

  if (!timingSafeEqualHex(expected, sig)) {
    return NextResponse.json({error: 'Bad signature'}, {status: 401});
  }

  const cacheKey = `entl:${guildId}:${productSlug}`;
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: {'X-Entitlements-TTL': String(TTL_SECONDS), 'Cache-Control': 'no-store'}
      });
    }
  }

  const nowDate = new Date();
  const slots = await prisma.subscriptionSlot.findMany({
    where: {
      guildId,
      status: 'ASSIGNED',
      subscriptionItem: {
        product: {slug: productSlug},
        subscription: {
          status: 'ACTIVE',
          currentPeriodEnd: {gt: nowDate}
        }
      }
    },
    include: {
      subscriptionItem: {include: {subscription: true}}
    }
  });

  const activeSlotsCount = slots.length;
  const allowed = activeSlotsCount > 0;
  const periodEnd = allowed
    ? Math.max(...slots.map((s) => s.subscriptionItem.subscription.currentPeriodEnd.getTime()))
    : 0;

  const payload = {
    allowed,
    active_slots_count: activeSlotsCount,
    period_end: allowed ? Math.floor(periodEnd / 1000) : null
  };

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(payload), 'EX', TTL_SECONDS);
  }

  return NextResponse.json(payload, {
    headers: {'X-Entitlements-TTL': String(TTL_SECONDS), 'Cache-Control': 'no-store'}
  });
}
