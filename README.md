# Fate Store MVP (Next.js 16 + App Router)

This is an MVP that matches the requested UX flow:
Home / Commands / Pricing + Cart Drawer + Discord OAuth + Dashboard gating (Select a server) + Subscriptions + Invoices + Billing Portal + Bot Entitlements API.

## Stack
- Next.js 16 (App Router)
- Tailwind CSS + Framer Motion
- next-intl v4 (EN default + AR RTL)
- Prisma + PostgreSQL
- Redis (nonce replay protection + optional entitlements cache)
- Stripe (Checkout subscriptions + Webhooks + Customer Portal)
- Discord OAuth2 (identify, email, guilds)

## Local dev
```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open: `http://localhost:3000` (redirects to `/en`).

## Railway deployment (production)
1) Create a **PostgreSQL** service and set `DATABASE_URL`.
2) Create a **Redis** service and set `REDIS_URL`.
3) Set:
   - `APP_URL` (your Railway public URL)
   - `SESSION_SECRET`
   - Discord OAuth vars (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`)
   - Stripe vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
   - `BOT_HMAC_SECRET`
4) Build command: `npm run build`
5) Start command: `npm start`

### Production DB migrations
`scripts/start.mjs` runs:
- `prisma migrate deploy`
- `next start`

> Ensure `prisma/migrations` exists in the repo (it is included).

### Seed fallback
`USE_SEED_FALLBACK=true` is **dev-only**. In production, leave it unset or set it to `false`.

## Stripe setup
- Each product has 4 prices: 1/3/6/12 month (interval_count)
- Quantity = slots
- Checkout creates a subscription.
- Webhooks persist subscriptions & invoices.

To create Stripe products/prices and store `stripePriceId` in DB:
```bash
npm run stripe:sync
```

## Bot Entitlements API
`GET /api/bot/entitlements?guild_id=...&product_slug=...`

Headers:
- `X-Bot-Id`
- `X-Timestamp` (unix seconds)
- `X-Nonce`
- `X-Signature` (HMAC SHA256)

Security:
- timestamp window ±300s
- nonce is single-use (Redis TTL 600s)
- response cached 60s (Redis) to reduce DB load

Response:
```json
{ "allowed": true, "active_slots_count": 3, "period_end": 1700000000 }
```


## Home images
This repo uses original SVG placeholders in `public/home/` to preserve layout without copying third-party assets.
