import {commands, categories} from '@/data/commands';
import {CommandsClient} from './_components/CommandsClient';

export default async function CommandsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;

  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 pb-16 pt-12 md:px-6 md:pt-16 lg:px-8">
      <div className="mb-8 md:mb-10">
        <h1 className="text-[2.4rem] font-extrabold leading-none tracking-tight text-white md:text-[3.1rem]">
          {locale === 'ar' ? 'أوامر تيل' : 'Tale Commands'}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-6 text-white/65">
          {locale === 'ar'
            ? 'اعثر على الأمر الذي تبحث عنه وكيفية استخدامه.'
            : 'Find the command you are looking for and how to use it.'}
        </p>
      </div>

      <CommandsClient locale={locale} categories={[...categories]} commands={commands} />
    </div>
  );
}
