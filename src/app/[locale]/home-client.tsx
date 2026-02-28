'use client';

import {useTranslations} from 'next-intl';
import clsx from 'clsx';
import {Card} from '@/components/Card';
import {Accordion} from '@/components/Accordion';
import {Reveal} from '@/components/Reveal';

export default function HomeClient({locale}: {locale: string}) {
  const t = useTranslations('home');
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE || '#';
  const isAr = locale === 'ar';

  const faq = [
    {q: t('faq.q1'), a: t('faq.a1')},
    {q: t('faq.q2'), a: t('faq.a2')},
    {q: t('faq.q3'), a: t('faq.a3')},
    {q: t('faq.q4'), a: t('faq.a4')},
    {q: t('faq.q5'), a: t('faq.a5')}
  ];

  const showcase = [
    {k: 'overview', title: t('showcase.overview.title'), img: '/home/overview.svg'},
    {k: 'messages', title: t('showcase.messages.title'), img: '/home/messages.svg'},
    {k: 'shadows', title: t('showcase.shadows.title'), img: '/home/shadow.svg'},
    {k: 'roles', title: t('showcase.roles.title'), img: '/home/reaction-roles.svg'}
  ];

  return (
    <div className="w-full">
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Reveal>
          <div className={clsx('mx-auto max-w-3xl -mt-10 md:-mt-14', isAr ? 'text-center' : 'text-center')}>
            <div className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold fate-pill">
              {t('badge')}
            </div>

            <h1 className="mt-7 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
              {t('heroTitle')}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm text-white/65 md:text-base">
              {t('heroSubtitle')}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <a
                href={`/${locale}/pricing`}
                className="inline-flex items-center justify-center rounded-xl px-7 py-3 text-sm font-extrabold fate-btn"
              >
                {t('getStarted')}
              </a>

              <a
                href={discordUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                {t('support')}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* HERO SPACER */}
      <div className="h-14 md:h-24" />

      {/* FEATURES LABEL + CMS */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
        <Reveal>
          <div className={clsx('text-sm font-semibold text-emerald-200/90', isAr ? 'text-right' : 'text-left')}>
            {t('featuresLabel')}
          </div>
          <h2 className={clsx('mt-3 text-2xl font-extrabold text-white md:text-4xl', isAr ? 'text-right' : 'text-left')}>
            {t('cmsTitle')}
          </h2>
          <p className={clsx('mt-2 text-white/70', isAr ? 'text-right' : 'text-left')}>{t('cmsSubtitle')}</p>
        </Reveal>

        <div className="mt-12 grid gap-7 md:grid-cols-3 md:gap-8">
          <Reveal delay={0.02}>
            <Card className="p-6 fate-card h-full min-h-[280px]">
              <div className="text-sm font-extrabold text-white">{t('cards.adminTitle')}</div>
              <p className="mt-2 text-sm text-white/65">{t('cards.adminDesc')}</p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {(t.raw('cards.adminBullets') as string[]).map((x, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="p-6 fate-card h-full min-h-[280px]">
              <div className="text-sm font-extrabold text-white">{t('cards.voiceTitle')}</div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {(t.raw('cards.voiceBullets') as string[]).map((x, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <Card className="p-6 fate-card h-full min-h-[280px]">
              <div className="text-sm font-extrabold text-white">{t('cards.protectTitle')}</div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {(t.raw('cards.protectBullets') as string[]).map((x, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:pb-32">
        <div className="mt-10 space-y-14 md:mt-14 md:space-y-20">
          {showcase.map((it, idx) => (
            <Reveal key={it.k} delay={0.02 * idx}>
              <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-10">
                <div className={clsx('space-y-4', idx % 2 === 1 && 'md:order-2')}>
                  <div className="inline-flex items-center rounded-full border border-emerald-500/15 bg-emerald-500/6 px-4 py-2 text-xs font-semibold text-white/85">
                    {t('showcase.badge')}
                  </div>
                  <h3 className={clsx('text-2xl font-extrabold text-white md:text-3xl', isAr ? 'text-right' : 'text-left')}>
                    {it.title}
                  </h3>
                  <p className={clsx('text-white/70', isAr ? 'text-right' : 'text-left')}>{t('showcase.body')}</p>
                  <a
                    href="#"
                    className={clsx('inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white', isAr ? 'justify-end' : 'justify-start')}
                  >
                    {t('showcase.cta')}
                    <span aria-hidden>→</span>
                  </a>
                </div>

                <div className={clsx('relative', idx % 2 === 1 && 'md:order-1')}>
                  <div className="fate-card fate-frame overflow-hidden">
                    <img src={it.img} alt={it.k} className="h-full w-full object-cover" />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
        <Reveal>
          <div className={clsx('text-sm font-semibold text-emerald-200', isAr ? 'text-right' : 'text-left')}>{t('faq.label')}</div>
          <h2 className={clsx('mt-3 text-2xl font-extrabold text-white md:text-4xl', isAr ? 'text-right' : 'text-left')}>{t('faq.title')}</h2>
          <p className={clsx('mt-2 text-white/70', isAr ? 'text-right' : 'text-left')}>{t('faq.subtitle')}</p>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-10">
            <Accordion items={faq} />
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 md:pb-32">
        <Reveal>
          <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/6 p-8 text-center md:p-12">
            <h3 className="text-2xl font-extrabold text-white md:text-3xl">{t('cta.title')}</h3>
            <p className="mx-auto mt-3 max-w-2xl text-white/70">{t('cta.subtitle')}</p>
            <a
              href={discordUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black hover:bg-emerald-400"
            >
              {t('cta.button')}
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
