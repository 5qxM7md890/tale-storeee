import {z} from 'zod';

const DiscordTokenResponse = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string()
});

export async function exchangeCodeForToken(code: string) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    client_secret: process.env.DISCORD_CLIENT_SECRET || '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI || ''
  });

  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord token exchange failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return DiscordTokenResponse.parse(json);
}

export type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
};

export async function fetchDiscordUser(accessToken: string) {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: {Authorization: `Bearer ${accessToken}`}
  });
  if (!res.ok) throw new Error('Failed to fetch Discord user');
  return (await res.json()) as DiscordUser;
}

export type DiscordGuild = {
  id: string;
  name: string;
  icon?: string | null;
  owner?: boolean;
  permissions?: string;
};

export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: {Authorization: `Bearer ${accessToken}`}
  });
  if (!res.ok) throw new Error('Failed to fetch Discord guilds');
  return (await res.json()) as DiscordGuild[];
}
