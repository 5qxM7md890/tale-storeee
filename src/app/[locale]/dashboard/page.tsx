import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';

export default async function DashboardPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/api/auth/discord/login?next=/${locale}/dashboard`);
  }

  const cookieStore = await cookies(); // ✅ مهم
  const activeGuild = cookieStore.get('active_guild_id')?.value;

  if (!activeGuild) {
    redirect(`/${locale}/dashboard/select-server`);
  }

  redirect(`/${locale}/dashboard/subscriptions`);
}
