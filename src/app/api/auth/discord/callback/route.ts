import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {exchangeCodeForToken, fetchDiscordUser} from '@/lib/discord';
import {prisma} from '@/lib/db';
import {createSessionCookie} from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieStore = await cookies(); // ✅ Next 16
  const cookieState = cookieStore.get('oauth_state')?.value;
  const next = cookieStore.get('oauth_next')?.value || '/en';

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.json({error: 'Invalid state'}, {status: 400});
  }

  const token = await exchangeCodeForToken(code);
  const user = await fetchDiscordUser(token.access_token);

  const dbUser = await prisma.user.upsert({
    where: {discordId: user.id},
    update: {email: user.email ?? null, avatar: user.avatar ?? null, discordUsername: user.username ?? null, discordGlobalName: user.global_name ?? null},
    create: {discordId: user.id, email: user.email ?? null, avatar: user.avatar ?? null, discordUsername: user.username ?? null, discordGlobalName: user.global_name ?? null}
  });

  const expiresAt = new Date(Date.now() + token.expires_in * 1000);

  const session = await prisma.session.create({
    data: {
      userId: dbUser.id,
      discordAccessToken: token.access_token,
      discordTokenType: token.token_type,
      discordExpiresAt: expiresAt,
      discordRefreshToken: token.refresh_token ?? null
    }
  });

  await createSessionCookie(session.id);

  // clear temp oauth cookies
  cookieStore.set('oauth_state', '', {path: '/', maxAge: 0});
  cookieStore.set('oauth_next', '', {path: '/', maxAge: 0});

  const appUrl = process.env.APP_URL || url.origin;
  return NextResponse.redirect(new URL(next, appUrl));
}
