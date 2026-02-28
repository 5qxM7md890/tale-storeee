import {NextResponse} from 'next/server';
import {getSession} from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

  const {guildId} = await req.json().catch(() => ({guildId: null}));
  if (!guildId || typeof guildId !== 'string') {
    return NextResponse.json({error: 'guildId required'}, {status: 400});
  }

  const res = NextResponse.json({ok: true});

  // ✅ set cookie via response (safe with Next 16 cookies types)
  res.cookies.set('active_guild_id', guildId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });

  return res;
}
