import {redirect} from 'next/navigation';

export default async function BotSetupPage({
  params
}: {
  params: Promise<{locale: string; botId: string}>;
}) {
  const {locale, botId} = await params;
  redirect(`/${locale}/my-bots/${botId}?tab=general`);
}
