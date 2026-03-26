import {notFound, redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {prisma} from '@/lib/db';
import {Link} from '@/i18n/navigation';
import {
  bindBotToSelectedServerAction,
  saveBotAppearanceAction,
  saveBotSetupAction
} from '../actions';

type TabKey = 'overview' | 'customize' | 'general';

type DiscordGuildOption = {
  id: string;
  name: string;
  permissions?: string;
};

function resolveTab(value: string | undefined): TabKey {
  if (value === 'overview' || value === 'customize' || value === 'general') return value;
  return 'overview';
}

function formatStatus(value: string | null | undefined) {
  if (!value) return 'Unknown';
  return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function readMeta(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readMetaString(meta: Record<string, unknown>, key: string) {
  const value = meta[key];
  return typeof value === 'string' ? value : '';
}

function hasManageGuildPermission(permissions?: string | null) {
  try {
    const value = BigInt(permissions ?? '0');
    return (value & 0x8n) === 0x8n || (value & 0x20n) === 0x20n;
  } catch {
    return true;
  }
}

async function getUserGuildOptions(userId: string): Promise<Array<{id: string; name: string}>> {
  const currentSession = await prisma.session.findFirst({
    where: {userId},
    orderBy: {createdAt: 'desc'}
  });

  if (!currentSession?.discordAccessToken || !currentSession.discordTokenType) return [];

  try {
    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `${currentSession.discordTokenType} ${currentSession.discordAccessToken}`
      },
      cache: 'no-store'
    });

    if (!response.ok) return [];

    const guilds = (await response.json()) as DiscordGuildOption[];
    return guilds
      .filter((guild) => hasManageGuildPermission(guild.permissions))
      .map((guild) => ({id: guild.id, name: guild.name}))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function tabHref(botId: string, tab: TabKey) {
  return `/my-bots/${botId}?tab=${tab}`;
}

function statusChip(ok: boolean) {
  return ok
    ? 'border border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-100'
    : 'border border-white/10 bg-white/[0.03] text-white/60';
}

function readinessRow(label: string, ok: boolean, readyText: string, missingText: string) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/88">{label}</p>
        <p className="mt-1 break-words text-xs text-white/45">{ok ? readyText : missingText}</p>
      </div>
      <span className={statusChip(ok) + ' inline-flex min-w-[88px] shrink-0 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold'}>
        {ok ? 'Ready' : 'Missing'}
      </span>
    </div>
  );
}

function renderNotice(
  status: { bind?: string; save?: string; appearance?: string; message?: string },
  t: ReturnType<typeof getText>
) {
  if (status.bind === 'success') return {tone:'border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-100', title:t.noticeBindSuccess, body: status.message || t.noticeBindSuccessBody};
  if (status.bind === 'missing_server') return {tone:'border-amber-400/20 bg-amber-500/[0.06] text-amber-100', title:t.noticeMissingServer, body: status.message || t.noticeMissingServerBody};
  if (status.bind === 'error') return {tone:'border-rose-400/20 bg-rose-500/[0.06] text-rose-100', title:t.noticeBindError, body: status.message || t.noticeBindErrorBody};
  if (status.save === 'saved') return {tone:'border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-100', title:t.noticeSaveSuccess, body: status.message || t.noticeSaveSuccessBody};
  if (status.save === 'error') return {tone:'border-rose-400/20 bg-rose-500/[0.06] text-rose-100', title:t.noticeSaveError, body: status.message || t.noticeSaveErrorBody};
  if (status.appearance === 'saved') return {tone:'border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-100', title:t.noticeAppearanceSuccess, body: status.message || t.noticeAppearanceSuccessBody};
  if (status.appearance === 'error') return {tone:'border-rose-400/20 bg-rose-500/[0.06] text-rose-100', title:t.noticeAppearanceError, body: status.message || t.noticeAppearanceErrorBody};
  return null;
}

function getText(locale: string) {
  const isAr = locale === 'ar';
  return isAr ? {
    back: 'العودة إلى بوتاتي',
    heroBody: 'لوحة مضغوطة وأنيقة لإدارة السيرفر، الإعدادات، التخصيص، وجهوزية التشغيل لهذا البوت.',
    invite: 'دعوة البوت',
    openSetup: 'فتح الإعدادات',
    saveChanges: 'حفظ التغييرات',
    tabs: {
      overview: {title: 'نظرة عامة', desc: 'ملخص الحالة والإجراءات السريعة'},
      customize: {title: 'تخصيص البوت', desc: 'الاسم، الصور، الحالة، والمعاينة'},
      general: {title: 'عام', desc: 'السيرفر، القنوات، اللغة، والجاهزية'}
    },
    botIdentity: 'هوية البوت',
    currentPlan: 'الخطة الحالية',
    inviteStatus: 'حالة الدعوة',
    bindingStatus: 'حالة الربط',
    selectedServer: 'السيرفر المحدد',
    boundServer: 'السيرفر المرتبط',
    runtimeReadiness: 'جاهزية التشغيل',
    setupReadiness: 'اكتمال الإعداد',
    notSet: 'غير مضبوط',
    noServer: 'لم يتم اختيار سيرفر',
    noBinding: 'غير مربوط',
    inviteReady: 'رابط الدعوة جاهز',
    inviteMissing: 'رابط الدعوة غير متوفر',
    runtimeReady: 'جاهز للتشغيل',
    runtimeMissing: 'توجد إعدادات ناقصة',
    setupComplete: 'الإعدادات الأساسية مكتملة',
    setupIncomplete: 'بعض الحقول الأساسية ناقصة',
    currentSelectedServer: 'السيرفر المحدد لهذا البوت',
    selectServer: 'اختر السيرفر لهذا البوت',
    selectServerHint: 'الاختيار والحفظ يتمان لهذا البوت نفسه، وليس على مستوى active server العام فقط.',
    bindButton: 'ربط بالسيرفر المحدد',
    bindRuleTitle: 'قاعدة الربط',
    bindRuleBody: 'يسمح بسيرفر واحد لكل نوع بوت. الأنواع المختلفة يمكنها التعايش على نفس السيرفر.',
    sameTypeConflict: 'يوجد بالفعل بوت من نفس النوع مربوط على هذا السيرفر.',
    generalSettings: 'الإعدادات العامة',
    generalSettingsBody: 'هذه القيم هي التي يقرأها البوت الحالي وقت التشغيل.',
    mode: 'الوضع',
    language: 'اللغة',
    createChannel: 'معرّف قناة الإنشاء',
    tempCategory: 'معرّف فئة القنوات المؤقتة',
    panelChannel: 'معرّف قناة اللوحة',
    logsChannel: 'معرّف قناة السجلات',
    defaultUserLimit: 'الحد الافتراضي للمستخدمين',
    appearanceTitle: 'تخصيص البوت',
    appearanceBody: 'عدّل الاسم، الصور، الحالة، والمعاينة داخل لوحة قريبة جدًا من Pure لكن بهوية Tale.',
    displayName: 'اسم البوت',
    avatarImage: 'صورة البوت',
    bannerImage: 'بانر البوت',
    panelImage: 'صورة اللوحة',
    statusText: 'نص الحالة',
    activityType: 'نوع النشاط',
    uploadHint: 'يمكنك رفع صورة من جهازك أو إدخال رابط مباشر.',
    previewTitle: 'معاينة الملف الشخصي',
    bannerPreview: 'معاينة البانر',
    panelPreview: 'معاينة اللوحة',
    statusPreview: 'معاينة الحالة',
    activityPreview: 'نوع النشاط',
    appearanceQuickInfo: 'ملخص التخصيص',
    readinessTitle: 'قائمة الجاهزية',
    readinessBound: ['ربط السيرفر', 'تم ربط البوت بسيرفر صالح.', 'البوت يحتاج إلى ربط سيرفر.'],
    readinessCreate: ['قناة الإنشاء', 'تم حفظ createChannel.', 'createChannel غير مضبوط.'],
    readinessTemp: ['الفئة المؤقتة', 'تم حفظ tempCategory.', 'tempCategory غير مضبوط.'],
    readinessPanel: ['قناة اللوحة', 'تم حفظ panelChannel.', 'panelChannel غير مضبوط.'],
    readinessLogs: ['قناة السجلات', 'تم حفظ logsChannel.', 'logsChannel غير مضبوط.'],
    readinessImage: ['صورة اللوحة', 'تم ضبط صورة اللوحة.', 'صورة اللوحة غير مضبوطة.'],
    appearanceReady: 'التخصيص محفوظ',
    appearanceMissing: 'توجد عناصر تخصيص ناقصة',
    modeVoiceHint: 'الوضع المستقر حاليًا هو VOICE فقط.',
    noticeBindSuccess: 'تم تحديث الربط',
    noticeBindSuccessBody: 'تم ربط البوت بالسيرفر المحدد بنجاح.',
    noticeMissingServer: 'لا يوجد سيرفر محدد',
    noticeMissingServerBody: 'اختر سيرفرًا أولًا ثم أعد المحاولة.',
    noticeBindError: 'تعذر تنفيذ الربط',
    noticeBindErrorBody: 'تعذر حفظ الربط الآن. راجع السيرفر المحدد ثم حاول مرة أخرى.',
    noticeSaveSuccess: 'تم حفظ الإعدادات',
    noticeSaveSuccessBody: 'تم تحديث إعدادات التشغيل بنجاح.',
    noticeSaveError: 'تعذر حفظ الإعدادات',
    noticeSaveErrorBody: 'تحقق من القيم ثم أعد المحاولة.',
    noticeAppearanceSuccess: 'تم حفظ التخصيص',
    noticeAppearanceSuccessBody: 'تم تحديث التخصيص بنجاح.',
    noticeAppearanceError: 'تعذر حفظ التخصيص',
    noticeAppearanceErrorBody: 'تحقق من الصور والقيم ثم أعد المحاولة.',
    noPreview: 'لا توجد معاينة بعد',
    streamingHint: 'اختر STREAMING إذا كنت تريد حالة بث.',
    currentBoundGuild: 'السيرفر المرتبط حاليًا'
  } : {
    back: 'Back to My Bots',
    heroBody: 'A compact premium control panel for server selection, setup values, appearance settings, and runtime readiness.',
    invite: 'Invite Bot',
    openSetup: 'Open Setup',
    saveChanges: 'Save Changes',
    tabs: {
      overview: {title: 'نظرة عامة', desc: 'Summary, status, and quick actions'},
      customize: {title: 'تخصيص البوت', desc: 'Name, images, status, and preview'},
      general: {title: 'عام', desc: 'Server, channels, language, and readiness'}
    },
    botIdentity: 'Bot Identity',
    currentPlan: 'Current Plan',
    inviteStatus: 'Invite Status',
    bindingStatus: 'Binding Status',
    selectedServer: 'Selected Server',
    boundServer: 'Bound Server',
    runtimeReadiness: 'Runtime Readiness',
    setupReadiness: 'Setup Readiness',
    notSet: 'Not set',
    noServer: 'No server selected',
    noBinding: 'Not bound',
    inviteReady: 'Invite link is ready',
    inviteMissing: 'Invite link is missing',
    runtimeReady: 'Ready to run',
    runtimeMissing: 'Some required values are missing',
    setupComplete: 'Core setup is complete',
    setupIncomplete: 'Some required setup fields are missing',
    currentSelectedServer: 'Current selected server',
    selectServer: 'Choose the server for this bot',
    selectServerHint: 'Selection and binding belong to this bot instance, not the global active server.',
    bindButton: 'Bind to selected server',
    bindRuleTitle: 'Binding rule',
    bindRuleBody: 'One bot of each type is allowed per server. Different bot types can share the same guild.',
    sameTypeConflict: 'Another bot of the same type is already linked to this server.',
    generalSettings: 'General settings',
    generalSettingsBody: 'These values are read by the current bot runtime.',
    mode: 'Mode',
    language: 'Language',
    createChannel: 'Create channel ID',
    tempCategory: 'Temp category ID',
    panelChannel: 'Panel channel ID',
    logsChannel: 'Logs channel ID',
    defaultUserLimit: 'Default user limit',
    appearanceTitle: 'Bot Customization',
    appearanceBody: 'Edit the bot identity, images, activity, and preview in a Pure-like layout with Tale styling.',
    displayName: 'Bot display name',
    avatarImage: 'Bot avatar',
    bannerImage: 'Bot banner',
    panelImage: 'Panel image',
    statusText: 'Status text',
    activityType: 'Activity type',
    uploadHint: 'Upload from your device or provide a direct image URL.',
    previewTitle: 'Profile preview',
    bannerPreview: 'Banner preview',
    panelPreview: 'Panel preview',
    statusPreview: 'Status preview',
    activityPreview: 'Activity type',
    appearanceQuickInfo: 'Customization summary',
    readinessTitle: 'Readiness checklist',
    readinessBound: ['Guild binding', 'This bot is bound to a valid server.', 'This bot still needs a bound server.'],
    readinessCreate: ['Create channel', 'createChannel is configured.', 'createChannel is missing.'],
    readinessTemp: ['Temp category', 'tempCategory is configured.', 'tempCategory is missing.'],
    readinessPanel: ['Panel channel', 'panelChannel is configured.', 'panelChannel is missing.'],
    readinessLogs: ['Logs channel', 'logsChannel is configured.', 'logsChannel is missing.'],
    readinessImage: ['Panel image', 'The panel image is configured.', 'The panel image is missing.'],
    appearanceReady: 'Appearance saved',
    appearanceMissing: 'Some appearance values are missing',
    modeVoiceHint: 'The stable runtime mode is currently VOICE only.',
    noticeBindSuccess: 'Server binding updated',
    noticeBindSuccessBody: 'The bot is now linked to the selected server.',
    noticeMissingServer: 'No selected server found',
    noticeMissingServerBody: 'Choose a server first, then try again.',
    noticeBindError: 'Binding failed',
    noticeBindErrorBody: 'The selected server could not be linked right now.',
    noticeSaveSuccess: 'Setup saved',
    noticeSaveSuccessBody: 'Runtime settings were saved successfully.',
    noticeSaveError: 'Setup could not be saved',
    noticeSaveErrorBody: 'Please review the values and try again.',
    noticeAppearanceSuccess: 'Customization saved',
    noticeAppearanceSuccessBody: 'The bot appearance was updated successfully.',
    noticeAppearanceError: 'Customization failed',
    noticeAppearanceErrorBody: 'Please review the image fields and try again.',
    noPreview: 'No preview available yet',
    streamingHint: 'Use STREAMING if you want a streaming-style activity.',
    currentBoundGuild: 'Current bound guild'
  };
}

const shellCard = 'rounded-[28px] border border-white/8 bg-[#0b0717]/90 shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl';
const softCard = 'rounded-[24px] border border-white/8 bg-white/[0.03] shadow-[0_12px_42px_rgba(0,0,0,0.18)]';
const fieldClass = 'w-full rounded-2xl border border-white/10 bg-[#120c24] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-violet-400/35 focus:bg-[#16102b]';
const labelClass = 'text-xs font-semibold tracking-[0.18em] text-white/45';

export default async function BotDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string; botId: string}>;
  searchParams?: Promise<{ tab?: string; bind?: string; save?: string; appearance?: string; message?: string }>;
}) {
  const {locale, botId} = await params;
  const isAr = locale === 'ar';
  const t = getText(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeTab = resolveTab(resolvedSearchParams?.tab);
  const session = await getSession();

  if (!session) {
    redirect(`/api/auth/discord/login?next=/${locale}/my-bots/${botId}`);
  }

  const bot = await prisma.botInstance.findFirst({
    where: {id: botId, userId: session.userId},
    include: {BotSetting: true, GuildBinding: true, Product: true, PricingOption: true}
  });

  if (!bot) notFound();

  const guildOptions = await getUserGuildOptions(session.userId);
  const meta = readMeta(bot.BotSetting?.permissions);
  const boundGuildId = bot.GuildBinding?.guildId || '';
  const selectedGuildId = bot.guildId || boundGuildId || '';
  const currentSelectedGuildName = guildOptions.find((guild) => guild.id === selectedGuildId)?.name || t.noServer;
  const currentBoundGuildName = guildOptions.find((guild) => guild.id === boundGuildId)?.name || '';
  const displayName = bot.displayName || bot.Product?.name || 'Untitled Bot';
  const avatarImageUrl = readMetaString(meta, 'avatarImageUrl');
  const bannerImageUrl = readMetaString(meta, 'bannerImageUrl');
  const panelImageUrl = readMetaString(meta, 'panelImageUrl');
  const statusText = readMetaString(meta, 'statusText');
  const activityType = readMetaString(meta, 'activityType') || 'PLAYING';
  const hasCreateChannel = Boolean(bot.BotSetting?.createChannel);
  const hasTempCategory = Boolean(bot.BotSetting?.tempCategory);
  const hasPanelChannel = Boolean(bot.BotSetting?.panelChannel);
  const hasLogsChannel = Boolean(bot.BotSetting?.logsChannel);
  const hasPanelImage = Boolean(panelImageUrl);
  const isBound = Boolean(boundGuildId);
  const setupComplete = hasCreateChannel && hasTempCategory && hasPanelChannel && hasLogsChannel;
  const runtimeReady = isBound && setupComplete && hasPanelImage;
  const inviteReady = Boolean(bot.inviteUrl);
  const planLabel = bot.Product?.name || t.notSet;
  const periodLabel = bot.PricingOption?.periodMonths ? `${bot.PricingOption.periodMonths} month${bot.PricingOption.periodMonths > 1 ? 's' : ''}` : t.notSet;

  const conflictingSameTypeBot = selectedGuildId ? await prisma.guildBinding.findFirst({
    where: {
      guildId: selectedGuildId,
      productId: bot.productId,
      NOT: {botInstanceId: bot.id}
    },
    select: {
      botInstanceId: true
    }
  }) : null;

  const notice = renderNotice({bind: resolvedSearchParams?.bind, save: resolvedSearchParams?.save, appearance: resolvedSearchParams?.appearance, message: resolvedSearchParams?.message}, t);
  const previewStatus = statusText || t.notSet;

  const tabs: Array<{key: TabKey; title: string; desc: string}> = [
    {key: 'overview', title: t.tabs.overview.title, desc: t.tabs.overview.desc},
    {key: 'customize', title: t.tabs.customize.title, desc: t.tabs.customize.desc},
    {key: 'general', title: t.tabs.general.title, desc: t.tabs.general.desc}
  ];

  const inviteButton = bot.inviteUrl ? (
    <a href={bot.inviteUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
      {t.invite}
    </a>
  ) : (
    <button type="button" disabled className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-white/38">
      {t.invite}
    </button>
  );

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="relative overflow-hidden rounded-[34px] border border-white/6 bg-[#070411] px-5 py-6 shadow-[0_30px_120px_rgba(38,11,74,0.34)] sm:px-7 lg:px-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(145,92,255,0.16),transparent_35%),radial-gradient(circle_at_left,rgba(99,54,189,0.14),transparent_42%)]" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Link href="/my-bots" className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white/85">
                <span>←</span>
                <span>{t.back}</span>
              </Link>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-[2.7rem]">{displayName}</h1>
                <p className="max-w-3xl text-sm leading-7 text-white/56">{t.heroBody}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {inviteButton}
              <Link href={tabHref(bot.id, 'general')} className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.07]">
                {t.openSetup}
              </Link>
            </div>
          </div>

          {notice ? (
            <div className={`rounded-2xl border px-4 py-3 ${notice.tone}`}>
              <p className="text-sm font-semibold">{notice.title}</p>
              <p className="mt-1 text-sm opacity-90">{notice.body}</p>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
            <aside className={`${shellCard} overflow-hidden p-4`}>
              <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(31,19,58,0.92),rgba(10,8,21,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-[#140d27]">
                    {avatarImageUrl ? <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white/80">{displayName.charAt(0).toUpperCase()}</div>}
                    <span className="absolute bottom-1 left-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#140d27]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-white">{displayName}</p>
                    <p className="truncate text-xs text-white/48">{planLabel}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {tabs.map((tab) => {
                    const active = tab.key === activeTab;
                    return (
                      <Link key={tab.key} href={tabHref(bot.id, tab.key)} className={`block rounded-[22px] px-4 py-4 transition ${active ? 'border border-violet-300/18 bg-[linear-gradient(180deg,rgba(88,45,166,0.32),rgba(39,24,75,0.46))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_30px_rgba(70,34,129,0.18)]' : 'border border-white/0 bg-white/[0.02] hover:border-white/8 hover:bg-white/[0.04]'}`}>
                        <p className="text-sm font-semibold text-white">{tab.title}</p>
                        <p className="mt-1 text-xs leading-5 text-white/42">{tab.desc}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </aside>

            <section className={`${shellCard} overflow-hidden`}>
              {activeTab === 'overview' ? (
                <div className="grid gap-6 p-5 lg:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className={`${softCard} min-w-0 p-5`}><p className={labelClass}>{t.currentPlan}</p><p className="mt-3 break-words text-lg font-semibold text-white">{planLabel}</p><p className="mt-1 break-words text-sm text-white/48">{periodLabel}</p></div>
                      <div className={`${softCard} min-w-0 p-5`}><p className={labelClass}>{t.inviteStatus}</p><p className="mt-3 break-words text-lg font-semibold text-white">{inviteReady ? t.inviteReady : t.inviteMissing}</p><p className="mt-1 break-all text-sm text-white/48">{bot.inviteUrl || t.notSet}</p></div>
                      <div className={`${softCard} min-w-0 p-5`}><p className={labelClass}>{t.bindingStatus}</p><p className="mt-3 break-words text-lg font-semibold text-white">{isBound ? t.boundServer : t.noBinding}</p><p className="mt-1 break-all text-sm text-white/48">{isBound ? `${currentBoundGuildName || boundGuildId} (${boundGuildId})` : t.noBinding}</p></div>
                      <div className={`${softCard} min-w-0 p-5`}><p className={labelClass}>{t.runtimeReadiness}</p><p className="mt-3 break-words text-lg font-semibold text-white">{runtimeReady ? t.runtimeReady : t.runtimeMissing}</p><p className="mt-1 break-words text-sm text-white/48">{setupComplete ? t.setupComplete : t.setupIncomplete}</p></div>
                    </div>

                    <div className={`${softCard} p-5 lg:p-6`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0"><p className="text-lg font-semibold text-white">{t.readinessTitle}</p><p className="mt-1 break-words text-sm text-white/45">{t.heroBody}</p></div>
                        <div className="flex flex-wrap gap-3">
                          {inviteButton}
                          <form action={bindBotToSelectedServerAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="botId" value={bot.id} />
                            <input type="hidden" name="returnTab" value="overview" />
                            <input type="hidden" name="selectedGuildId" value={selectedGuildId} />
                            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-2xl border border-violet-300/16 bg-violet-500/[0.10] px-5 text-sm font-semibold text-white transition hover:bg-violet-500/[0.16]">{t.bindButton}</button>
                          </form>
                          <Link href={tabHref(bot.id, 'general')} className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">{t.openSetup}</Link>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {readinessRow(t.readinessBound[0], isBound, t.readinessBound[1], t.readinessBound[2])}
                        {readinessRow(t.readinessCreate[0], hasCreateChannel, t.readinessCreate[1], t.readinessCreate[2])}
                        {readinessRow(t.readinessTemp[0], hasTempCategory, t.readinessTemp[1], t.readinessTemp[2])}
                        {readinessRow(t.readinessPanel[0], hasPanelChannel, t.readinessPanel[1], t.readinessPanel[2])}
                        {readinessRow(t.readinessLogs[0], hasLogsChannel, t.readinessLogs[1], t.readinessLogs[2])}
                        {readinessRow(t.readinessImage[0], hasPanelImage, t.readinessImage[1], t.readinessImage[2])}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`${softCard} p-5`}>
                      <p className={labelClass}>{t.botIdentity}</p>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-[#140d27]">
                          {avatarImageUrl ? <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white/80">{displayName.charAt(0).toUpperCase()}</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-white">{displayName}</p>
                          <p className="mt-1 text-sm text-white/48">{formatStatus(bot.status)}</p>
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span>{previewStatus}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className={`${softCard} min-w-0 p-5`}><p className={labelClass}>{t.selectedServer}</p><p className="mt-3 break-words text-base font-semibold text-white">{currentSelectedGuildName}</p><p className="mt-1 break-all text-sm text-white/48">{selectedGuildId || t.noServer}</p></div>
                    <div className={`${softCard} min-w-0 p-5`}><p className={labelClass}>{t.currentBoundGuild}</p><p className="mt-3 break-words text-base font-semibold text-white">{isBound ? currentBoundGuildName || boundGuildId : t.noBinding}</p><p className="mt-1 break-all text-sm text-white/48">{boundGuildId || t.noBinding}</p></div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'customize' ? (
                <div className="grid gap-6 p-5 lg:p-6 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
                  <div className="space-y-4">
                    <div className={`${softCard} p-3`}>
                      <p className={labelClass}>{t.previewTitle}</p>
                      <div className="mt-3 overflow-hidden rounded-[22px] border border-white/8 bg-[#120c22]">
                        <div className="aspect-[16/8] bg-[#18112e]">
                          {bannerImageUrl ? <img src={bannerImageUrl} alt={t.bannerPreview} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-white/30">{t.bannerPreview}</div>}
                        </div>
                        <div className="px-4 pb-4 pt-0">
                          <div className="-mt-7 flex items-end gap-3">
                            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-4 border-[#120c22] bg-[#19122f]">
                              {avatarImageUrl ? <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white/80">{displayName.charAt(0).toUpperCase()}</div>}
                            </div>
                            <span className="mb-1 inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                          </div>
                          <p className="mt-3 text-base font-semibold text-white">{displayName}</p>
                          <p className="mt-1 text-xs text-white/50">{previewStatus}</p>
                          <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-center text-xs text-white/60">{activityType}</div>
                        </div>
                      </div>
                    </div>
                    <div className={`${softCard} p-3`}>
                      <p className={labelClass}>{t.panelPreview}</p>
                      <div className="mt-3 aspect-square overflow-hidden rounded-[22px] border border-white/8 bg-[#151026]">
                        {panelImageUrl ? <img src={panelImageUrl} alt={t.panelPreview} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm text-white/28">{t.noPreview}</div>}
                      </div>
                    </div>
                  </div>

                  <form action={saveBotAppearanceAction} className={`${softCard} space-y-5 p-5 lg:p-6`}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="botId" value={bot.id} />
                    <input type="hidden" name="returnTab" value="customize" />
                    <div><p className="text-lg font-semibold text-white">{t.appearanceTitle}</p><p className="mt-1 text-sm text-white/45">{t.appearanceBody}</p></div>
                    <div className="grid gap-5 lg:grid-cols-2">
                      <label className="space-y-2 lg:col-span-2"><span className={labelClass}>{t.displayName}</span><input name="displayName" defaultValue={displayName} className={fieldClass} placeholder={t.displayName} /></label>

                      <label className="space-y-2"><span className={labelClass}>{t.avatarImage} URL</span><input name="avatarImageUrl" defaultValue={avatarImageUrl} className={fieldClass} placeholder="https://..." /><span className="text-xs text-white/38">{t.uploadHint}</span></label>
                      <label className="space-y-2"><span className={labelClass}>{t.avatarImage} Upload</span><input name="avatarImageFile" type="file" accept="image/*" className={fieldClass + ' file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white'} /></label>

                      <label className="space-y-2"><span className={labelClass}>{t.bannerImage} URL</span><input name="bannerImageUrl" defaultValue={bannerImageUrl} className={fieldClass} placeholder="https://..." /></label>
                      <label className="space-y-2"><span className={labelClass}>{t.bannerImage} Upload</span><input name="bannerImageFile" type="file" accept="image/*" className={fieldClass + ' file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white'} /></label>

                      <label className="space-y-2"><span className={labelClass}>{t.panelImage} URL</span><input name="panelImageUrl" defaultValue={panelImageUrl} className={fieldClass} placeholder="https://..." /></label>
                      <label className="space-y-2"><span className={labelClass}>{t.panelImage} Upload</span><input name="panelImageFile" type="file" accept="image/*" className={fieldClass + ' file:mr-3 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white'} /></label>

                      <label className="space-y-2 lg:col-span-2"><span className={labelClass}>{t.statusText}</span><input name="statusText" defaultValue={statusText} className={fieldClass} placeholder={t.statusText} /></label>
                      <label className="space-y-2"><span className={labelClass}>{t.activityType}</span><select name="activityType" defaultValue={activityType} className={fieldClass}><option value="PLAYING">PLAYING</option><option value="LISTENING">LISTENING</option><option value="WATCHING">WATCHING</option><option value="COMPETING">COMPETING</option><option value="STREAMING">STREAMING</option></select><span className="text-xs text-white/38">{t.streamingHint}</span></label>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="inline-flex h-11 items-center justify-center rounded-2xl border border-violet-300/18 bg-violet-500/[0.12] px-6 text-sm font-semibold text-white transition hover:bg-violet-500/[0.18]">{t.saveChanges}</button></div>
                  </form>

                  <div className="space-y-4">
                    <div className={`${softCard} p-5`}>
                      <p className={labelClass}>{t.appearanceQuickInfo}</p>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-3"><span className="text-white/55">{t.displayName}</span><span className="text-white">{displayName}</span></div>
                        <div className="flex items-center justify-between gap-3"><span className="text-white/55">{t.activityPreview}</span><span className="text-white">{activityType}</span></div>
                        <div className="flex items-center justify-between gap-3"><span className="text-white/55">{t.statusPreview}</span><span className="truncate text-white">{previewStatus}</span></div>
                        <div className="flex items-center justify-between gap-3"><span className="text-white/55">{t.panelImage}</span><span className={statusChip(hasPanelImage) + ' rounded-full px-3 py-1 text-xs font-semibold'}>{hasPanelImage ? t.appearanceReady : t.appearanceMissing}</span></div>
                      </div>
                    </div>
                    <div className={`${softCard} p-5`}>
                      <p className={labelClass}>{t.statusPreview}</p>
                      <div className="mt-4 rounded-[22px] border border-white/8 bg-[#120c22] p-4">
                        <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="text-sm text-white">{previewStatus}</span></div>
                        <p className="mt-3 text-sm text-white/45">{activityType}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'general' ? (
                <div className="grid gap-6 p-5 lg:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
                    <div className={`${softCard} p-5 lg:p-6`}>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-white">{t.currentSelectedServer}</p>
                        <p className="text-sm text-white/45">{t.selectServerHint}</p>
                      </div>
                      <form action={bindBotToSelectedServerAction} className="mt-5 space-y-4">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="botId" value={bot.id} />
                        <input type="hidden" name="returnTab" value="general" />
                        <label className="space-y-2"><span className={labelClass}>{t.selectServer}</span><select name="selectedGuildId" defaultValue={selectedGuildId} className={fieldClass}><option value="">{t.noServer}</option>{guildOptions.map((guild) => <option key={guild.id} value={guild.id}>{guild.name} — {guild.id}</option>)}</select></label>
                        <div className="flex justify-end"><button type="submit" className="inline-flex h-11 items-center justify-center rounded-2xl border border-violet-300/18 bg-violet-500/[0.12] px-6 text-sm font-semibold text-white transition hover:bg-violet-500/[0.18]">{t.bindButton}</button></div>
                      </form>
                    </div>

                    <form action={saveBotSetupAction} className={`${softCard} space-y-5 p-5 lg:p-6`}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="botId" value={bot.id} />
                      <input type="hidden" name="returnTab" value="general" />
                      <div><p className="text-lg font-semibold text-white">{t.generalSettings}</p><p className="mt-1 text-sm text-white/45">{t.generalSettingsBody}</p></div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="space-y-2"><span className={labelClass}>{t.mode}</span><select name="mode" defaultValue={bot.BotSetting?.mode || 'VOICE'} className={fieldClass}><option value="VOICE">VOICE</option></select><span className="text-xs text-white/38">{t.modeVoiceHint}</span></label>
                        <label className="space-y-2"><span className={labelClass}>{t.language}</span><select name="language" defaultValue={bot.BotSetting?.language || 'en'} className={fieldClass}><option value="en">English</option><option value="ar">العربية</option></select></label>
                        <label className="space-y-2"><span className={labelClass}>{t.createChannel}</span><input name="createChannel" defaultValue={bot.BotSetting?.createChannel || ''} className={fieldClass} placeholder="123456789012345678" inputMode="numeric" /></label>
                        <label className="space-y-2"><span className={labelClass}>{t.tempCategory}</span><input name="tempCategory" defaultValue={bot.BotSetting?.tempCategory || ''} className={fieldClass} placeholder="123456789012345678" inputMode="numeric" /></label>
                        <label className="space-y-2"><span className={labelClass}>{t.panelChannel}</span><input name="panelChannel" defaultValue={bot.BotSetting?.panelChannel || ''} className={fieldClass} placeholder="123456789012345678" inputMode="numeric" /></label>
                        <label className="space-y-2"><span className={labelClass}>{t.logsChannel}</span><input name="logsChannel" defaultValue={bot.BotSetting?.logsChannel || ''} className={fieldClass} placeholder="123456789012345678" inputMode="numeric" /></label>
                        <label className="space-y-2 md:col-span-2"><span className={labelClass}>{t.defaultUserLimit}</span><input name="defaultUserLimit" type="number" min="0" defaultValue={bot.BotSetting?.defaultUserLimit ?? 0} className={fieldClass} /></label>
                      </div>
                      <div className="flex justify-end"><button type="submit" className="inline-flex h-11 items-center justify-center rounded-2xl border border-violet-300/18 bg-violet-500/[0.12] px-6 text-sm font-semibold text-white transition hover:bg-violet-500/[0.18]">{t.saveChanges}</button></div>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <div className={`${softCard} min-w-0 p-5`}><p className={labelClass}>{t.bindingStatus}</p><p className="mt-3 break-words text-lg font-semibold text-white">{isBound ? t.boundServer : t.noBinding}</p><p className="mt-1 break-all text-sm text-white/48">{isBound ? `${currentBoundGuildName || boundGuildId} (${boundGuildId})` : t.noBinding}</p></div>
                    <div className={`${softCard} min-w-0 p-5`}><p className={labelClass}>{t.bindRuleTitle}</p><p className="mt-3 break-words text-sm leading-7 text-white/65">{t.bindRuleBody}</p>{conflictingSameTypeBot ? <div className="mt-4 break-words rounded-2xl border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100">{t.sameTypeConflict}</div> : null}</div>
                    <div className={`${softCard} p-5`}>
                      <p className={labelClass}>{t.readinessTitle}</p>
                      <div className="mt-4 space-y-3">
                        {readinessRow(t.readinessBound[0], isBound, t.readinessBound[1], t.readinessBound[2])}
                        {readinessRow(t.readinessCreate[0], hasCreateChannel, t.readinessCreate[1], t.readinessCreate[2])}
                        {readinessRow(t.readinessTemp[0], hasTempCategory, t.readinessTemp[1], t.readinessTemp[2])}
                        {readinessRow(t.readinessPanel[0], hasPanelChannel, t.readinessPanel[1], t.readinessPanel[2])}
                        {readinessRow(t.readinessLogs[0], hasLogsChannel, t.readinessLogs[1], t.readinessLogs[2])}
                        {readinessRow(t.readinessImage[0], hasPanelImage, t.readinessImage[1], t.readinessImage[2])}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
