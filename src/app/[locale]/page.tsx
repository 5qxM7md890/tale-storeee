import HomeClient from './home-client';

export default async function HomePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return <HomeClient locale={locale} />;
}
