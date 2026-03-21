import {ServerPicker} from './_components/ServerPicker';

export default async function SelectServerPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return (
    <div className="mx-auto max-w-2xl">
      <ServerPicker locale={locale} />
    </div>
  );
}
