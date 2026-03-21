
'use client';

import * as React from 'react';
import clsx from 'clsx';
import {useTranslations} from 'next-intl';
import {motion, useInView} from 'framer-motion';

function ArrowIcon({className = 'h-4 w-4'}: {className?: string}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/14 text-violet-200">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
        <path d="m5 13 4 4L19 7" />
      </svg>
    </span>
  );
}

function SectionBadge({children}: {children: React.ReactNode}) {
  return (
    <span className="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-500/[0.12] px-3 py-1 text-[10px] font-semibold text-violet-100 shadow-[0_0_0_1px_rgba(139,92,246,0.12)]">
      {children}
    </span>
  );
}

function GridGlow({className = ''}: {className?: string}) {
  return (
    <div
      className={clsx(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className
      )}
      aria-hidden
    >
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
        backgroundSize: '56px 56px'
      }} />
      <div className="absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-violet-500/16 blur-[120px]" />
    </div>
  );
}

function FadeIn({children, from = 'up', delay = 0}: {children: React.ReactNode; from?: 'up'|'left'|'right'; delay?: number}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, {once: true, amount: 0.25});

  const initial =
    from === 'left' ? {opacity: 0, x: -36} :
    from === 'right' ? {opacity: 0, x: 36} :
    {opacity: 0, y: 28};

  const animate = isInView ? {opacity: 1, x: 0, y: 0} : initial;

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      transition={{duration: 0.72, delay, ease: [0.22, 1, 0.36, 1]}}
    >
      {children}
    </motion.div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  bullets
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-black/35 px-7 pb-7 pt-5 shadow-[0_0_0_1px_rgba(255,255,255,0.015),0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-sm">
      <div className="mx-auto mb-7 flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/14 text-violet-200">
        {icon}
      </div>
      <h3 className="text-center text-[18px] font-extrabold tracking-tight text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-[300px] text-center text-[14px] leading-7 text-white/72">{body}</p>
      <ul className="mt-7 space-y-3.5">
        {bullets.map((item) => (
          <li key={item} className="flex items-start gap-3 text-[14px] leading-6 text-white/88">
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShowcaseCard({
  title,
  body,
  cta,
  img,
  accent,
  reverse = false
}: {
  title: string;
  body: string;
  cta: string;
  img: string;
  accent: string;
  reverse?: boolean;
}) {
  return (
    <div className={clsx('grid items-center gap-12 lg:grid-cols-2 lg:gap-16', reverse && 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1')}>
      <FadeIn from={reverse ? 'right' : 'left'}>
        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black/25 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
            backgroundSize: '44px 44px'
          }} />
          <div className="absolute left-[-20px] top-[-22px] h-32 w-32 rounded-full blur-2xl" style={{backgroundColor: accent, opacity: 0.22}} />
          <div className="absolute bottom-[-16px] right-[-14px] h-32 w-32 rounded-full blur-2xl" style={{backgroundColor: accent, opacity: 0.18}} />
          <img src={img} alt="" className="relative z-10 w-full rounded-[20px] border border-white/10" />
        </div>
      </FadeIn>

      <FadeIn from={reverse ? 'left' : 'right'} delay={0.05}>
        <div className="max-w-[480px]">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold" style={{backgroundColor: accent + '22', color: accent}}>
            apps
          </span>
          <h3 className="mt-4 text-[34px] font-extrabold leading-[1.06] tracking-tight text-white md:text-[44px]">
            {title}
          </h3>
          <p className="mt-6 max-w-[480px] text-[19px] leading-9 text-white/72">
            {body}
          </p>
          <a href="#pricing" className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/5 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10">
            <span>{cta}</span>
            <ArrowIcon />
          </a>
        </div>
      </FadeIn>
    </div>
  );
}

export default function HomeClient({locale}: {locale: string}) {
  const t = useTranslations('home');
  const isAr = locale === 'ar';
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE || '#';

  const showcase = [
    {title: t('showcase.overview.title'), img: '/home/overview.svg', accent: '#2ce5c2', reverse: false},
    {title: t('showcase.messages.title'), img: '/home/messages.svg', accent: '#ff4e62', reverse: true},
    {title: t('showcase.shadows.title'), img: '/home/shadow.svg', accent: '#7c5cff', reverse: false},
    {title: t('showcase.roles.title'), img: '/home/reaction-roles.svg', accent: '#f8ae19', reverse: true}
  ];

  return (
    <div className="relative overflow-hidden">
      <GridGlow />
      <section className="relative mx-auto max-w-[1320px] px-6 pb-20 pt-12 md:px-8 md:pb-24 md:pt-14 lg:px-10">
        <FadeIn>
          <div className="mx-auto flex min-h-[620px] max-w-[820px] md:min-h-[680px] flex-col items-center justify-center text-center">
            <SectionBadge>{t('badge')}</SectionBadge>

            <h1 className="mt-8 max-w-[760px] text-[48px] font-extrabold leading-[0.98] tracking-[-0.04em] text-white md:text-[62px] lg:text-[74px]">
              {t('heroTitle')}
            </h1>

            <p className="mt-6 max-w-[720px] text-[17px] leading-8 text-white/72 md:text-[18px]">
              {t('heroSubtitle')}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href={`/${locale}/pricing`}
                className="inline-flex min-w-[154px] items-center justify-center rounded-2xl bg-white px-7 py-3.5 text-[16px] font-bold text-black transition hover:bg-white/90"
              >
                {t('getStarted')}
              </a>
              <a
                href={discordUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-[154px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-7 py-3.5 text-[16px] font-semibold text-white transition hover:bg-white/10"
              >
                {t('support').replace('→', '').replace('←', '')} <span className={clsx('ml-2 inline-flex', isAr && 'mr-2 ml-0 rotate-180')}><ArrowIcon /></span>
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="relative mx-auto max-w-[1320px] px-6 pb-20 md:px-8 md:pb-24 lg:px-10">
        <FadeIn>
          <div className="text-center">
            <SectionBadge>{t('featuresLabel')}</SectionBadge>
            <h2 className="mx-auto mt-5 max-w-[900px] text-[36px] font-extrabold leading-[1.08] tracking-[-0.03em] text-white md:text-[46px]">
              {t('cmsTitle')}
            </h2>
            <p className="mx-auto mt-4 max-w-[780px] text-[17px] leading-8 text-white/68">
              {t('cmsSubtitle')}
            </p>
          </div>
        </FadeIn>

        <div className="mx-auto mt-14 grid max-w-[1240px] gap-6 xl:grid-cols-3">
          <FadeIn delay={0.02}>
            <FeatureCard
              icon={<ArrowIcon className="h-5 w-5" />}
              title={t('cards.adminTitle')}
              body={t('cards.adminDesc')}
              bullets={t.raw('cards.adminBullets') as string[]}
            />
          </FadeIn>
          <FadeIn delay={0.05}>
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M12 3v10" />
                  <path d="M8 7v5a4 4 0 1 0 8 0V7" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                </svg>
              }
              title={t('cards.voiceTitle')}
              body={locale === 'ar'
                ? 'تحكم كامل بغرف الصوت والقنوات النصية مع أدوات إشراف متقدمة.'
                : 'Complete control over voice rooms and text channels with advanced moderation tools.'}
              bullets={t.raw('cards.voiceBullets') as string[]}
            />
          </FadeIn>
          <FadeIn delay={0.08}>
            <FeatureCard
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z" />
                </svg>
              }
              title={t('cards.protectTitle')}
              body={locale === 'ar'
                ? 'ميزات أمنية قوية لحماية مجتمعك من الهجمات والوصول غير المصرح.'
                : 'Robust security features to protect your community from attacks and unauthorized access.'}
              bullets={t.raw('cards.protectBullets') as string[]}
            />
          </FadeIn>
        </div>
      </section>

      <section className="relative mx-auto max-w-[1320px] px-6 pb-16 md:px-8 md:pb-24 lg:px-10">
        <div className="space-y-24 md:space-y-28">
          {showcase.map((item) => (
            <ShowcaseCard
              key={item.title}
              title={item.title}
              body={t('showcase.body')}
              cta={t('showcase.cta')}
              img={item.img}
              accent={item.accent}
              reverse={item.reverse}
            />
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-[1100px] px-6 pb-20 pt-4 text-center md:px-8 md:pb-24">
        <FadeIn>
          <SectionBadge>{t('faq.label')}</SectionBadge>
          <h2 className="mt-5 text-[34px] font-extrabold tracking-[-0.03em] text-white md:text-[42px]">{t('faq.title')}</h2>
          <p className="mx-auto mt-4 max-w-[700px] text-[16px] leading-7 text-white/72">{t('faq.subtitle')}</p>
        </FadeIn>

        <div className="mx-auto mt-10 max-w-[920px] divide-y divide-white/10 rounded-[24px] border border-white/10 bg-black/20 text-left backdrop-blur-sm">
          {[1,2,3,4,5].map((n) => (
            <details key={n} className="group px-6 py-5 md:px-8" dir={isAr ? 'rtl' : 'ltr'}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-semibold text-white">
                <span>{t(`faq.q${n}` as any)}</span>
                <span className="text-white/45 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 max-w-[840px] text-[15px] leading-7 text-white/70">{t(`faq.a${n}` as any)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-[1100px] px-6 pb-20 md:px-8 md:pb-28">
        <FadeIn>
          <div className="rounded-[28px] border border-white/10 bg-black/30 px-8 py-12 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-sm md:px-16 md:py-20">
            <h2 className="mx-auto max-w-[840px] text-[34px] font-extrabold tracking-[-0.03em] text-white md:text-[42px]">
              {t('cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-[760px] text-[16px] leading-7 text-white/72">
              {t('cta.subtitle')}
            </p>
            <a
              href={discordUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-7 py-3.5 text-[16px] font-bold text-black transition hover:bg-white/90"
            >
              {t('cta.button')}
            </a>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
