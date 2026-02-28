import {commands, categories} from '@/data/commands';
import {CommandsClient} from './_components/CommandsClient';

export default async function CommandsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 space-y-6 sm:pl-[264px]">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Tale Commands</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Find the command you are looking for and how to use it.
        </p>
      </div>

      <CommandsClient locale={locale} categories={[...categories]} commands={commands} />
    </div>
  );
}
