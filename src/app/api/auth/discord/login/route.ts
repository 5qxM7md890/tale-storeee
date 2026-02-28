import {NextResponse} from 'next/server';
import {randomState} from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/en/dashboard';

  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({error: 'Discord OAuth not configured'}, {status: 500});
  }

  const state = randomState();

  // ✅ set cookies via response (Next 16-safe)
  const res = NextResponse.redirect(
    `https://discord.com/api/oauth2/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email guilds',
      state
    }).toString()}`
  );

  res.cookies.set('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10
  });

  res.cookies.set('oauth_next', next, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10
  });

  return res;
}
