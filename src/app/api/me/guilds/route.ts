import {NextResponse} from 'next/server';
import {getSession} from '@/lib/auth';
import {fetchUserGuilds} from '@/lib/discord';
import {hasAdminPerm} from '@/lib/permissions';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

  const guilds = await fetchUserGuilds(session.discordAccessToken);

  const filtered = guilds
    .map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon ?? null,
      isAdmin: Boolean(g.owner) || (g.permissions ? hasAdminPerm(g.permissions) : false)
    }))
    .filter((g) => g.isAdmin);

  return NextResponse.json({guilds: filtered});
}
