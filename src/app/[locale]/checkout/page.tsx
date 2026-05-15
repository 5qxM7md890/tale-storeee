import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {CheckoutClient} from './_components/CheckoutClient';

export default async function CheckoutPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/api/auth/discord/login?next=/${locale}/checkout`);
  }

  const user = {
    name:
      session.user.discordGlobalName ||
      session.user.discordUsername ||
      session.user.discordId,
    avatarUrl: session.user.avatar
      ? `https://cdn.discordapp.com/avatars/${session.user.discordId}/${session.user.avatar}.png`
      : null
  };

  return <CheckoutClient locale={locale} user={user} />;
}
