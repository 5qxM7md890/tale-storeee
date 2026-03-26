
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

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function resolveTab(value: string | undefined): TabKey {
  if (value === 'overview' || value === 'customize' || value === 'general') return value;
  return 'customize';
}

function formatStatus(value: string | null | undefined) {
  if (!value) return 'Unknown';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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

function renderNotice(
  status: {bind?: string; save?: string; appearance?: string; message?: string},
  t: ReturnType<typeof getText>
) {
  if (status.bind === 'success') {
    return {
      tone: 'border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-100',
      title: t.noticeBindSuccess,
      body: status.message || t.noticeBindSuccessBody
    };
  }

  if (status.bind === 'missing_server') {
    return {
      tone: 'border-amber-400/20 bg-amber-500/[0.08] text-amber-100',
      title: t.noticeMissingServer,
      body: status.message || t.noticeMissingServerBody
    };
  }

  if (status.bind === 'error') {
    return {
      tone: 'border-rose-400/20 bg-rose-500/[0.08] text-rose-100',
      title: t.noticeBindError,
      body: status.message || t.noticeBindErrorBody
    };
  }

  if (status.save === 'saved') {
    return {
      tone: 'border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-100',
      title: t.noticeSaveSuccess,
      body: status.message || t.noticeSaveSuccessBody
    };
  }

  if (status.save === 'error') {
    return {
      tone: 'border-rose-400/20 bg-rose-500/[0.08] text-rose-100',
      title: t.noticeSaveError,
      body: status.message || t.noticeSaveErrorBody
    };
  }

  if (status.appearance === 'saved') {
    return {
      tone: 'border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-100',
      title: t.noticeAppearanceSuccess,
      body: status.message || t.noticeAppearanceSuccessBody
    };
  }

  if (status.appearance === 'error') {
    return {
      tone: 'border-rose-400/20 bg-rose-500/[0.08] text-rose-100',
      title: t.noticeAppearanceError,
      body: status.message || t.noticeAppearanceErrorBody
    };
  }

  return null;
}

function getText(locale: string) {
  const isAr = locale === 'ar';

  return isAr
    ? {
        back: 'العودة إلى بوتاتي',
        invite: 'دعوة البوت',
        openSetup: 'فتح الإعدادات',
        saveAppearance: 'حفظ التخصيص',
        saveGeneral: 'حفظ الإعدادات',
        saveBinding: 'تطبيق الربط',
        tabs: {
          overview: {title: 'نظرة عامة', desc: 'ملخص الحالة والإجراءات'},
          customize: {title: 'تخصيص البوت', desc: 'الهوية، الصور، الحضور، والمعاينة'},
          general: {title: 'عام', desc: 'السيرفر، القنوات، والجاهزية'}
        },
        workspaceTitle: 'تخصيص البوت',
        workspaceBody: 'مساحة عمل هادئة لتحرير هوية البوت، إعدادات الحضور، وربط السيرفر لهذا الـ Bot Instance.',
        notSet: 'غير مضبوط',
        noServer: 'لم يتم اختيار سيرفر',
        noBinding: 'غير مربوط',
        botIdentity: 'هوية البوت',
        currentPlan: 'الخطة الحالية',
        inviteStatus: 'حالة الدعوة',
        bindingStatus: 'حالة الربط',
        selectedServer: 'السيرفر المحدد',
        boundServer: 'السيرفر المرتبط',
        runtimeReadiness: 'جاهزية التشغيل',
        setupReadiness: 'جاهزية الإعداد',
        inviteReady: 'رابط الدعوة جاهز',
        inviteMissing: 'رابط الدعوة غير متوفر',
        runtimeReady: 'جاهز للتشغيل',
        runtimeMissing: 'هناك قيم أساسية ناقصة',
        setupComplete: 'الإعدادات الأساسية مكتملة',
        setupIncomplete: 'هناك إعدادات أساسية ناقصة',
        displayName: 'اسم البوت',
        avatarImage: 'صورة البوت',
        bannerImage: 'بانر البوت',
        panelImage: 'صورة اللوحة',
        imageUrl: 'رابط مباشر',
        uploadFromDevice: 'رفع من الجهاز',
        statusText: 'نص الحالة',
        activityType: 'نوع النشاط',
        streamingOption: 'خيار البث',
        streamingHint: 'اختر STREAMING إذا كنت تريد إظهار حالة بث.',
        mediaAssets: 'الوسائط',
        mediaAssetsBody: 'أدخل الروابط أو ارفع الصور مباشرة من نفس مساحة التحرير.',
        presenceSection: 'الحضور والنشاط',
        presenceBody: 'اضبط النص والنشاط كما سيظهران في ملف البوت.',
        previewTitle: 'المعاينة الحية',
        previewBody: 'معاينة مباشرة لاسم البوت وصوره وحالته داخل الصفحة.',
        profileCard: 'معاينة الملف الشخصي',
        listCard: 'معاينة قائمة الأعضاء',
        panelPreview: 'معاينة اللوحة',
        appearanceReady: 'مكتمل',
        appearanceMissing: 'ناقص',
        generalSettings: 'الإعدادات العامة',
        generalSettingsBody: 'هذه القيم هي التي يقرأها هذا البوت وقت التشغيل.',
        currentSelectedServer: 'السيرفر المحدد لهذا البوت',
        selectServer: 'اختر السيرفر',
        selectServerHint: 'الاختيار والحفظ والربط كلها تخص هذا البوت فقط.',
        bindButton: 'ربط بالسيرفر المحدد',
        bindRuleTitle: 'قاعدة الربط',
        bindRuleBody: 'يسمح لنفس السيرفر بأن يحتوي أنواعًا مختلفة من البوتات، لكن لا يسمح بتكرار نفس النوع على نفس السيرفر.',
        sameTypeConflict: 'يوجد بالفعل بوت من نفس النوع مربوط على هذا السيرفر.',
        mode: 'الوضع',
        language: 'اللغة',
        createChannel: 'قناة الإنشاء',
        tempCategory: 'الفئة المؤقتة',
        panelChannel: 'قناة اللوحة',
        logsChannel: 'قناة السجلات',
        defaultUserLimit: 'الحد الافتراضي للمستخدمين',
        overviewBody: 'ملخص هادئ للحالة، الربط، والجاهزية بدون ضجيج بصري.',
        quickActions: 'إجراءات سريعة',
        quickActionsBody: 'أهم الإجراءات لهذا البوت بشكل مضغوط.',
        readinessTitle: 'قائمة الجاهزية',
        readinessBound: ['ربط السيرفر', 'تم ربط البوت بسيرفر صالح.', 'البوت يحتاج إلى ربط سيرفر.'],
        readinessCreate: ['قناة الإنشاء', 'تم ضبط createChannel.', 'createChannel غير مضبوط.'],
        readinessTemp: ['الفئة المؤقتة', 'تم ضبط tempCategory.', 'tempCategory غير مضبوطة.'],
        readinessPanel: ['قناة اللوحة', 'تم ضبط panelChannel.', 'panelChannel غير مضبوط.'],
        readinessLogs: ['قناة السجلات', 'تم ضبط logsChannel.', 'logsChannel غير مضبوط.'],
        readinessImage: ['صورة اللوحة', 'تم ضبط صورة اللوحة.', 'صورة اللوحة غير مضبوطة.'],
        readyBadge: 'جاهز',
        missingBadge: 'ناقص',
        currentBoundGuild: 'السيرفر المرتبط حاليًا',
        note: 'هذا التبويب يركز على مساحة التحرير، وليس على لوحات metrics.',
        noPreview: 'لا توجد معاينة بعد',
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
        selectedServerLabel: 'السيرفر المحدد',
        boundServerLabel: 'السيرفر المرتبط',
        runtimeLabel: 'الجاهزية',
        inviteLabel: 'الدعوة',
        setupLabel: 'الإعداد',
        workspaceLabel: 'مساحة العمل',
        boundLabel: 'الحالة',
        inviteUnavailable: 'الرابط غير متوفر'
      }
    : {
        back: 'Back to My Bots',
        invite: 'Invite Bot',
        openSetup: 'Open Setup',
        saveAppearance: 'Save Appearance',
        saveGeneral: 'Save Settings',
        saveBinding: 'Apply Binding',
        tabs: {
          overview: {title: 'Overview', desc: 'Status and actions'},
          customize: {title: 'Customize Bot', desc: 'Identity, assets, presence, and preview'},
          general: {title: 'General', desc: 'Server, channels, and readiness'}
        },
        workspaceTitle: 'Bot Customization',
        workspaceBody: 'A calm workspace for this bot instance: identity, presence, assets, and server setup.',
        notSet: 'Not set',
        noServer: 'No server selected',
        noBinding: 'Not bound',
        botIdentity: 'Bot Identity',
        currentPlan: 'Current Plan',
        inviteStatus: 'Invite Status',
        bindingStatus: 'Binding Status',
        selectedServer: 'Selected Server',
        boundServer: 'Bound Server',
        runtimeReadiness: 'Runtime Readiness',
        setupReadiness: 'Setup Readiness',
        inviteReady: 'Invite link is ready',
        inviteMissing: 'Invite link is missing',
        runtimeReady: 'Ready to run',
        runtimeMissing: 'Some required values are missing',
        setupComplete: 'Core setup is complete',
        setupIncomplete: 'Some core values are still missing',
        displayName: 'Bot Name',
        avatarImage: 'Bot Avatar',
        bannerImage: 'Bot Banner',
        panelImage: 'Panel Image',
        imageUrl: 'Direct URL',
        uploadFromDevice: 'Upload from device',
        statusText: 'Status Text',
        activityType: 'Activity Type',
        streamingOption: 'Streaming Option',
        streamingHint: 'Choose STREAMING if you want a streaming presence.',
        mediaAssets: 'Media Assets',
        mediaAssetsBody: 'Paste direct URLs or upload files from the same editing flow.',
        presenceSection: 'Presence & Activity',
        presenceBody: 'Adjust how this bot appears in its Discord profile.',
        previewTitle: 'Live Preview',
        previewBody: 'A direct preview of the bot name, assets, and presence inside the page.',
        profileCard: 'Profile Preview',
        listCard: 'Member List Preview',
        panelPreview: 'Panel Preview',
        appearanceReady: 'Complete',
        appearanceMissing: 'Missing',
        generalSettings: 'General Settings',
        generalSettingsBody: 'These are the values this bot reads at runtime.',
        currentSelectedServer: 'Selected server for this bot',
        selectServer: 'Choose server',
        selectServerHint: 'Selection, save, and binding remain scoped to this bot only.',
        bindButton: 'Bind to selected server',
        bindRuleTitle: 'Binding Rule',
        bindRuleBody: 'Different bot types can share the same server, but the same bot type cannot be repeated on that server.',
        sameTypeConflict: 'A bot of the same type is already bound to this server.',
        mode: 'Mode',
        language: 'Language',
        createChannel: 'Create Channel',
        tempCategory: 'Temp Category',
        panelChannel: 'Panel Channel',
        logsChannel: 'Logs Channel',
        defaultUserLimit: 'Default User Limit',
        overviewBody: 'A quiet summary of status, binding, and readiness without a busy dashboard feel.',
        quickActions: 'Quick Actions',
        quickActionsBody: 'The essential actions for this bot in a compact strip.',
        readinessTitle: 'Readiness Checklist',
        readinessBound: ['Guild binding', 'This bot is bound to a valid server.', 'This bot still needs a server binding.'],
        readinessCreate: ['Create channel', 'createChannel is configured.', 'createChannel is missing.'],
        readinessTemp: ['Temp category', 'tempCategory is configured.', 'tempCategory is missing.'],
        readinessPanel: ['Panel channel', 'panelChannel is configured.', 'panelChannel is missing.'],
        readinessLogs: ['Logs channel', 'logsChannel is configured.', 'logsChannel is missing.'],
        readinessImage: ['Panel image', 'Panel image is configured.', 'Panel image is missing.'],
        readyBadge: 'Ready',
        missingBadge: 'Missing',
        currentBoundGuild: 'Currently bound server',
        note: 'This page behaves more like an editor workspace than a metrics dashboard.',
        noPreview: 'No preview yet',
        noticeBindSuccess: 'Binding updated',
        noticeBindSuccessBody: 'The bot was bound to the selected server successfully.',
        noticeMissingServer: 'No server selected',
        noticeMissingServerBody: 'Choose a server first, then try again.',
        noticeBindError: 'Binding failed',
        noticeBindErrorBody: 'The binding could not be saved right now. Review the selected server and try again.',
        noticeSaveSuccess: 'Setup saved',
        noticeSaveSuccessBody: 'Runtime settings were updated successfully.',
        noticeSaveError: 'Setup save failed',
        noticeSaveErrorBody: 'Check the values and try again.',
        noticeAppearanceSuccess: 'Appearance saved',
        noticeAppearanceSuccessBody: 'Appearance settings were updated successfully.',
        noticeAppearanceError: 'Appearance save failed',
        noticeAppearanceErrorBody: 'Check the image fields and values, then try again.',
        selectedServerLabel: 'Selected',
        boundServerLabel: 'Bound',
        runtimeLabel: 'Runtime',
        inviteLabel: 'Invite',
        setupLabel: 'Setup',
        workspaceLabel: 'Workspace',
        boundLabel: 'Status',
        inviteUnavailable: 'Invite unavailable'
      };
}

const pageShell =
  'relative overflow-hidden rounded-[34px] border border-white/12 bg-[linear-gradient(180deg,rgba(8,6,14,0.97),rgba(7,5,12,0.98))] shadow-[0_35px_120px_rgba(0,0,0,0.55)]';
const workspaceSurface =
  'relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(11,8,19,0.94),rgba(8,6,15,0.97))]';
const subtleSurface = 'rounded-[24px] border border-white/7 bg-white/[0.025]';
const quietInput =
  'h-11 w-full rounded-[15px] border border-white/[0.08] bg-[#0d0a18] px-4 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-white/16 focus:bg-[#120d21]';
const quietSelect = quietInput + ' appearance-none pr-10';
const quietFile =
  'block w-full rounded-[15px] border border-white/[0.08] bg-[#0d0a18] px-4 py-3 text-sm text-white/75 file:ml-0 file:mr-3 file:rounded-[12px] file:border-0 file:bg-white/[0.08] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white';
const primaryButton =
  'inline-flex h-11 items-center justify-center rounded-[15px] border border-white/10 bg-white/[0.08] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.12]';
const secondaryButton =
  'inline-flex h-11 items-center justify-center rounded-[15px] border border-white/8 bg-transparent px-5 text-sm font-semibold text-white/86 transition hover:bg-white/[0.04]';
const tinyLabel = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36';

function NavTab({
  href,
  title,
  desc,
  active
}: {
  href: string;
  title: string;
  desc: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cx(
        'group flex items-center gap-3 rounded-[16px] border px-3 py-3 transition',
        active
          ? 'border-white/14 bg-white/[0.08] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03)]'
          : 'border-transparent text-white/62 hover:border-white/6 hover:bg-white/[0.03] hover:text-white/86'
      )}
    >
      <span
        className={cx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border text-sm font-semibold',
          active ? 'border-white/14 bg-white/[0.09] text-white' : 'border-white/6 bg-white/[0.02] text-white/54'
        )}
      >
        {title.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="mt-1 block truncate text-xs text-white/34 group-hover:text-white/42">{desc}</span>
      </span>
    </Link>
  );
}

function MicroStat({
  label,
  value,
  tone = 'default'
}: {
  label: string;
  value: string;
  tone?: 'default' | 'good' | 'warn';
}) {
  const toneClass =
    tone === 'good'
      ? 'border-emerald-400/22 bg-emerald-500/[0.08] text-emerald-100'
      : tone === 'warn'
        ? 'border-amber-400/18 bg-amber-500/[0.08] text-amber-100'
        : 'border-white/8 bg-white/[0.03] text-white/84';

  return (
    <div className={cx('rounded-[18px] border px-4 py-3', toneClass)}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function ReadyRow({
  label,
  ok,
  body,
  readyText,
  missingText
}: {
  label: string;
  ok: boolean;
  body: string;
  readyText: string;
  missingText: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/6 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/88">{label}</p>
        <p className="mt-1 text-xs leading-5 text-white/40">{body}</p>
      </div>
      <span
        className={cx(
          'inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
          ok
            ? 'border-emerald-400/22 bg-emerald-500/[0.08] text-emerald-100'
            : 'border-white/8 bg-white/[0.03] text-white/56'
        )}
      >
        {ok ? readyText : missingText}
      </span>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className={tinyLabel}>{eyebrow}</p>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {body ? <p className="max-w-3xl text-sm leading-6 text-white/44">{body}</p> : null}
    </div>
  );
}

function ImageFrame({src, label, ratio = 'square'}: {src?: string; label: string; ratio?: 'square' | 'banner' | 'panel'}) {
  const ratioClass =
    ratio === 'banner' ? 'aspect-[16/6]' : ratio === 'panel' ? 'aspect-[16/7]' : 'aspect-square';

  return (
    <div className="space-y-2">
      <p className={tinyLabel}>{label}</p>
      <div
        className={cx(
          'overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,14,32,0.98),rgba(10,8,20,0.98))]',
          ratioClass
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/28">{label}</div>
        )}
      </div>
    </div>
  );
}

function AssetRow({
  label,
  urlName,
  fileName,
  defaultValue,
  placeholder,
  uploadLabel,
  urlLabel
}: {
  label: string;
  urlName: string;
  fileName: string;
  defaultValue: string;
  placeholder: string;
  uploadLabel: string;
  urlLabel: string;
}) {
  return (
    <div className="border-b border-white/6 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/88">{label}</p>
          <p className="mt-1 text-xs text-white/34">{uploadLabel}</p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
        <input type="url" name={urlName} defaultValue={defaultValue} placeholder={placeholder} className={quietInput} />
        <input type="file" name={fileName} accept="image/*" className={quietFile} />
      </div>
      <p className="mt-2 text-[11px] text-white/28">{urlLabel}</p>
    </div>
  );
}

export default async function BotDetailsPage({
  params,
  searchParams
}: {
  params: Promise<{locale: string; botId: string}>;
  searchParams?: Promise<{tab?: string; bind?: string; save?: string; appearance?: string; message?: string}>;
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
  const selectedGuildName =
    guildOptions.find((guild) => guild.id === selectedGuildId)?.name || (selectedGuildId ? selectedGuildId : t.noServer);
  const currentBoundGuildName =
    guildOptions.find((guild) => guild.id === boundGuildId)?.name || (boundGuildId ? boundGuildId : t.noBinding);
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
  const notice = renderNotice(
    {
      bind: resolvedSearchParams?.bind,
      save: resolvedSearchParams?.save,
      appearance: resolvedSearchParams?.appearance,
      message: resolvedSearchParams?.message
    },
    t
  );

  const conflictingSameTypeBot = selectedGuildId
    ? await prisma.botInstance.findFirst({
        where: {guildId: selectedGuildId, productId: bot.productId, NOT: {id: bot.id}},
        include: {Product: true}
      })
    : null;

  const tabs: Array<{key: TabKey; title: string; desc: string}> = [
    {key: 'customize', title: t.tabs.customize.title, desc: t.tabs.customize.desc},
    {key: 'overview', title: t.tabs.overview.title, desc: t.tabs.overview.desc},
    {key: 'general', title: t.tabs.general.title, desc: t.tabs.general.desc}
  ];

  const planLabel = bot.Product?.name || t.notSet;
  const planPeriod = bot.PricingOption?.periodMonths
    ? `${bot.PricingOption.periodMonths} month${bot.PricingOption.periodMonths > 1 ? 's' : ''}`
    : t.notSet;

  const topButtons = (
    <div className="flex flex-wrap items-center gap-2.5">
      {bot.inviteUrl ? (
        <a href={bot.inviteUrl} target="_blank" rel="noreferrer" className={secondaryButton}>
          {t.invite}
        </a>
      ) : (
        <button type="button" disabled className={cx(secondaryButton, 'cursor-not-allowed opacity-45')}>
          {t.invite}
        </button>
      )}
      <Link href={tabHref(botId, 'general')} className={primaryButton}>
        {t.openSetup}
      </Link>
    </div>
  );

  const customizeTab = (
    <div className={workspaceSurface + ' p-4 sm:p-5 lg:p-6'}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(134,92,255,0.16),transparent_30%),radial-gradient(circle_at_left_center,rgba(84,48,164,0.12),transparent_36%)]" />
      <div className="relative">
        <div className="mb-5 flex flex-col gap-4 border-b border-white/7 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle eyebrow={t.workspaceLabel} title={t.workspaceTitle} body={t.workspaceBody} />
          <div className="max-w-md rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/48">
            {t.note}
          </div>
        </div>

        <form action={saveBotAppearanceAction} encType="multipart/form-data" className="grid gap-5 xl:grid-cols-[214px_minmax(0,1fr)_244px]">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="botId" value={botId} />
          <input type="hidden" name="returnTab" value="customize" />

          <aside className="space-y-4">
            <div className={subtleSurface + ' overflow-hidden p-3'}>
              <p className={tinyLabel}>{t.listCard}</p>
              <div className="mt-3 rounded-[18px] border border-white/8 bg-[#0d0a18] p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[15px] border border-white/10 bg-white/[0.04]">
                    {avatarImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/60">
                        {displayName.charAt(0)}
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0d0a18]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                    <p className="mt-0.5 truncate text-xs text-white/40">#{bot.id.slice(-6)}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-[15px] border border-white/7 bg-white/[0.03] px-3 py-2">
                  <p className="truncate text-xs text-white/74">{formatStatus(activityType)}</p>
                </div>
              </div>
            </div>

            <div className={subtleSurface + ' overflow-hidden'}>
              <p className={cx(tinyLabel, 'px-4 pt-4')}>{t.profileCard}</p>
              <div className="mt-3 overflow-hidden border-t border-white/6">
                <div className="relative aspect-[1/1.45] bg-[#0d0a18]">
                  {bannerImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bannerImageUrl} alt={t.bannerImage} className="absolute inset-0 h-full w-full object-cover opacity-95" />
                  ) : (
                    <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(163,138,255,0.3),rgba(72,48,150,0.18),rgba(8,6,15,0))]" />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,6,16,0.1),rgba(8,6,16,0.68)_56%,rgba(8,6,16,0.98))]" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="mx-auto w-full max-w-[172px] rounded-[20px] border border-white/8 bg-[#0e0b19]/88 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                      <div className="mx-auto relative h-16 w-16 overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04]">
                        {avatarImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white/60">
                            {displayName.charAt(0)}
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#0e0b19]" />
                      </div>
                      <p className="mt-3 truncate text-center text-sm font-semibold text-white">{displayName}</p>
                      <p className="mt-1 truncate text-center text-xs text-white/36">PureBot0000</p>
                      <div className="mt-4 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2 text-center text-xs text-white/68">
                        {formatStatus(activityType)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className={subtleSurface + ' p-4 sm:p-5'}>
            <div className="space-y-5">
              <div className="border-b border-white/6 pb-4">
                <p className={tinyLabel}>{t.botIdentity}</p>
                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <input
                    type="text"
                    name="displayName"
                    defaultValue={displayName}
                    placeholder={t.displayName}
                    className={quietInput}
                  />
                  <div className="rounded-[15px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/72">
                    <p className="truncate font-medium text-white">{displayName}</p>
                    <p className="mt-1 truncate text-xs text-white/36">{planLabel}</p>
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle eyebrow={t.mediaAssets} title={t.mediaAssets} body={t.mediaAssetsBody} />
                <div className="mt-4">
                  <AssetRow
                    label={t.avatarImage}
                    urlName="avatarImageUrl"
                    fileName="avatarImageFile"
                    defaultValue={avatarImageUrl}
                    placeholder="https://"
                    uploadLabel={t.uploadFromDevice}
                    urlLabel={t.imageUrl}
                  />
                  <AssetRow
                    label={t.bannerImage}
                    urlName="bannerImageUrl"
                    fileName="bannerImageFile"
                    defaultValue={bannerImageUrl}
                    placeholder="https://"
                    uploadLabel={t.uploadFromDevice}
                    urlLabel={t.imageUrl}
                  />
                  <AssetRow
                    label={t.panelImage}
                    urlName="panelImageUrl"
                    fileName="panelImageFile"
                    defaultValue={panelImageUrl}
                    placeholder="https://"
                    uploadLabel={t.uploadFromDevice}
                    urlLabel={t.imageUrl}
                  />
                </div>
              </div>

              <div className="border-t border-white/6 pt-5">
                <SectionTitle eyebrow={t.presenceSection} title={t.presenceSection} body={t.presenceBody} />
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <input
                    type="text"
                    name="statusText"
                    defaultValue={statusText}
                    placeholder={t.statusText}
                    className={quietInput}
                  />
                  <select name="activityType" defaultValue={activityType} className={quietSelect}>
                    <option value="PLAYING">PLAYING</option>
                    <option value="WATCHING">WATCHING</option>
                    <option value="LISTENING">LISTENING</option>
                    <option value="COMPETING">COMPETING</option>
                    <option value="STREAMING">STREAMING</option>
                  </select>
                </div>
                <div className="mt-3 rounded-[16px] border border-white/7 bg-white/[0.03] px-4 py-3 text-sm text-white/54">
                  <span className="font-medium text-white/74">{t.streamingOption}:</span> {t.streamingHint}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-5">
                <div className="flex items-center gap-2 text-sm text-white/44">
                  <span
                    className={cx(
                      'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                      avatarImageUrl && bannerImageUrl && panelImageUrl && statusText
                        ? 'border-emerald-400/22 bg-emerald-500/[0.08] text-emerald-100'
                        : 'border-white/8 bg-white/[0.03] text-white/56'
                    )}
                  >
                    {avatarImageUrl && bannerImageUrl && panelImageUrl && statusText ? t.appearanceReady : t.appearanceMissing}
                  </span>
                </div>
                <button type="submit" className={primaryButton}>
                  {t.saveAppearance}
                </button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className={subtleSurface + ' p-4'}>
              <SectionTitle eyebrow={t.previewTitle} title={t.previewTitle} body={t.previewBody} />
              <div className="mt-4 space-y-4">
                <ImageFrame src={avatarImageUrl} label={t.avatarImage} ratio="square" />
                <ImageFrame src={bannerImageUrl} label={t.bannerImage} ratio="banner" />
                <ImageFrame src={panelImageUrl} label={t.panelPreview} ratio="panel" />
              </div>
            </div>

            <div className={subtleSurface + ' p-4'}>
              <p className={tinyLabel}>{t.presenceSection}</p>
              <div className="mt-3 space-y-3">
                <div className="rounded-[17px] border border-white/8 bg-[#0d0a18] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{t.statusText}</p>
                  <p className="mt-2 truncate text-sm font-medium text-white">{statusText || t.notSet}</p>
                </div>
                <div className="rounded-[17px] border border-white/8 bg-[#0d0a18] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{t.activityType}</p>
                  <p className="mt-2 truncate text-sm font-medium text-white">{formatStatus(activityType)}</p>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );

  const overviewTab = (
    <div className="space-y-5">
      <div className={workspaceSurface + ' p-4 sm:p-5 lg:p-6'}>
        <div className="grid gap-4 border-b border-white/7 pb-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <SectionTitle eyebrow={t.tabs.overview.title} title={t.tabs.overview.title} body={t.overviewBody} />
          <div className="grid gap-3 sm:grid-cols-2">
            <MicroStat label={t.inviteLabel} value={inviteReady ? t.inviteReady : t.inviteMissing} tone={inviteReady ? 'good' : 'warn'} />
            <MicroStat label={t.runtimeLabel} value={runtimeReady ? t.runtimeReady : t.runtimeMissing} tone={runtimeReady ? 'good' : 'warn'} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className={subtleSurface + ' p-4 sm:p-5'}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <MicroStat label={t.botIdentity} value={displayName} />
              <MicroStat label={t.selectedServerLabel} value={selectedGuildName} />
              <MicroStat label={t.boundServerLabel} value={currentBoundGuildName} />
              <MicroStat label={t.setupLabel} value={setupComplete ? t.setupComplete : t.setupIncomplete} tone={setupComplete ? 'good' : 'warn'} />
              <MicroStat label={t.boundLabel} value={isBound ? formatStatus(bot.status) : t.noBinding} tone={isBound ? 'good' : 'warn'} />
              <MicroStat label={t.currentPlan} value={planLabel} />
            </div>

            <div className="mt-4 rounded-[20px] border border-white/8 bg-[#0d0a18]/90 p-4">
              <p className={tinyLabel}>{t.quickActions}</p>
              <p className="mt-2 text-sm leading-6 text-white/44">{t.quickActionsBody}</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {topButtons}
                <Link href={tabHref(botId, 'customize')} className={secondaryButton}>
                  {t.tabs.customize.title}
                </Link>
              </div>
            </div>
          </div>

          <div className={subtleSurface + ' p-4 sm:p-5'}>
            <p className={tinyLabel}>{t.previewTitle}</p>
            <div className="mt-4 overflow-hidden rounded-[22px] border border-white/8 bg-[#0d0a18]">
              <div className="relative h-36">
                {bannerImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerImageUrl} alt={t.bannerImage} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(135deg,rgba(169,139,255,0.3),rgba(86,50,164,0.18),rgba(8,6,16,0.92))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,6,16,0.06),rgba(8,6,16,0.86))]" />
                <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04]">
                    {avatarImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white/60">
                        {displayName.charAt(0)}
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#0d0a18]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-white">{displayName}</p>
                    <p className="mt-1 truncate text-sm text-white/48">{statusText || t.notSet}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={workspaceSurface + ' p-4 sm:p-5'}>
        <SectionTitle eyebrow={t.readinessTitle} title={t.readinessTitle} />
        <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-3 sm:px-5 sm:py-4">
          <ReadyRow
            label={t.readinessBound[0]}
            ok={isBound}
            body={isBound ? t.readinessBound[1] : t.readinessBound[2]}
            readyText={t.readyBadge}
            missingText={t.missingBadge}
          />
          <ReadyRow
            label={t.readinessCreate[0]}
            ok={hasCreateChannel}
            body={hasCreateChannel ? t.readinessCreate[1] : t.readinessCreate[2]}
            readyText={t.readyBadge}
            missingText={t.missingBadge}
          />
          <ReadyRow
            label={t.readinessTemp[0]}
            ok={hasTempCategory}
            body={hasTempCategory ? t.readinessTemp[1] : t.readinessTemp[2]}
            readyText={t.readyBadge}
            missingText={t.missingBadge}
          />
          <ReadyRow
            label={t.readinessPanel[0]}
            ok={hasPanelChannel}
            body={hasPanelChannel ? t.readinessPanel[1] : t.readinessPanel[2]}
            readyText={t.readyBadge}
            missingText={t.missingBadge}
          />
          <ReadyRow
            label={t.readinessLogs[0]}
            ok={hasLogsChannel}
            body={hasLogsChannel ? t.readinessLogs[1] : t.readinessLogs[2]}
            readyText={t.readyBadge}
            missingText={t.missingBadge}
          />
          <ReadyRow
            label={t.readinessImage[0]}
            ok={hasPanelImage}
            body={hasPanelImage ? t.readinessImage[1] : t.readinessImage[2]}
            readyText={t.readyBadge}
            missingText={t.missingBadge}
          />
        </div>
      </div>
    </div>
  );

  const generalTab = (
    <div className="space-y-5">
      <div className={workspaceSurface + ' p-4 sm:p-5 lg:p-6'}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_340px]">
          <div className={subtleSurface + ' p-4 sm:p-5'}>
            <SectionTitle eyebrow={t.generalSettings} title={t.generalSettings} body={t.generalSettingsBody} />

            <form action={saveBotSetupAction} className="mt-5 space-y-5">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="botId" value={botId} />
              <input type="hidden" name="returnTab" value="general" />
              <input type="hidden" name="selectedGuildId" value={selectedGuildId} />

              <div className="grid gap-4 border-b border-white/6 pb-5 lg:grid-cols-2">
                <div>
                  <p className={tinyLabel}>{t.mode}</p>
                  <select name="mode" defaultValue={bot.BotSetting?.mode || 'VOICE'} className={cx(quietSelect, 'mt-2')}>
                    <option value="VOICE">VOICE</option>
                  </select>
                </div>
                <div>
                  <p className={tinyLabel}>{t.language}</p>
                  <select name="language" defaultValue={bot.BotSetting?.language || locale || 'en'} className={cx(quietSelect, 'mt-2')}>
                    <option value="ar">Arabic</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className={tinyLabel}>{t.createChannel}</p>
                  <input type="text" name="createChannel" defaultValue={bot.BotSetting?.createChannel || ''} className={cx(quietInput, 'mt-2')} />
                </div>
                <div>
                  <p className={tinyLabel}>{t.tempCategory}</p>
                  <input type="text" name="tempCategory" defaultValue={bot.BotSetting?.tempCategory || ''} className={cx(quietInput, 'mt-2')} />
                </div>
                <div>
                  <p className={tinyLabel}>{t.panelChannel}</p>
                  <input type="text" name="panelChannel" defaultValue={bot.BotSetting?.panelChannel || ''} className={cx(quietInput, 'mt-2')} />
                </div>
                <div>
                  <p className={tinyLabel}>{t.logsChannel}</p>
                  <input type="text" name="logsChannel" defaultValue={bot.BotSetting?.logsChannel || ''} className={cx(quietInput, 'mt-2')} />
                </div>
                <div className="sm:max-w-[220px]">
                  <p className={tinyLabel}>{t.defaultUserLimit}</p>
                  <input
                    type="number"
                    min={0}
                    name="defaultUserLimit"
                    defaultValue={bot.BotSetting?.defaultUserLimit ?? 0}
                    className={cx(quietInput, 'mt-2')}
                  />
                </div>
              </div>

              <div className="border-t border-white/6 pt-5">
                <button type="submit" className={primaryButton}>
                  {t.saveGeneral}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className={subtleSurface + ' p-4 sm:p-5'}>
              <SectionTitle eyebrow={t.currentSelectedServer} title={t.currentSelectedServer} body={t.selectServerHint} />
              <form action={bindBotToSelectedServerAction} className="mt-5 space-y-4">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="botId" value={botId} />
                <input type="hidden" name="returnTab" value="general" />
                <select name="selectedGuildId" defaultValue={selectedGuildId} className={quietSelect}>
                  <option value="">{t.selectServer}</option>
                  {guildOptions.map((guild) => (
                    <option key={guild.id} value={guild.id}>
                      {guild.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className={primaryButton}>
                  {t.bindButton}
                </button>
              </form>

              <div className="mt-4 space-y-3">
                <MicroStat label={t.selectedServer} value={selectedGuildName} />
                <MicroStat label={t.currentBoundGuild} value={currentBoundGuildName} tone={isBound ? 'good' : 'warn'} />
              </div>

              <div className="mt-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/44">
                <p className="font-medium text-white/76">{t.bindRuleTitle}</p>
                <p className="mt-1">{t.bindRuleBody}</p>
                {conflictingSameTypeBot ? (
                  <p className="mt-2 text-amber-200/90">{t.sameTypeConflict}</p>
                ) : null}
              </div>
            </div>

            <div className={subtleSurface + ' p-4 sm:p-5'}>
              <SectionTitle eyebrow={t.readinessTitle} title={t.readinessTitle} />
              <div className="mt-4">
                <ReadyRow
                  label={t.readinessBound[0]}
                  ok={isBound}
                  body={isBound ? t.readinessBound[1] : t.readinessBound[2]}
                  readyText={t.readyBadge}
                  missingText={t.missingBadge}
                />
                <ReadyRow
                  label={t.readinessCreate[0]}
                  ok={hasCreateChannel}
                  body={hasCreateChannel ? t.readinessCreate[1] : t.readinessCreate[2]}
                  readyText={t.readyBadge}
                  missingText={t.missingBadge}
                />
                <ReadyRow
                  label={t.readinessTemp[0]}
                  ok={hasTempCategory}
                  body={hasTempCategory ? t.readinessTemp[1] : t.readinessTemp[2]}
                  readyText={t.readyBadge}
                  missingText={t.missingBadge}
                />
                <ReadyRow
                  label={t.readinessPanel[0]}
                  ok={hasPanelChannel}
                  body={hasPanelChannel ? t.readinessPanel[1] : t.readinessPanel[2]}
                  readyText={t.readyBadge}
                  missingText={t.missingBadge}
                />
                <ReadyRow
                  label={t.readinessLogs[0]}
                  ok={hasLogsChannel}
                  body={hasLogsChannel ? t.readinessLogs[1] : t.readinessLogs[2]}
                  readyText={t.readyBadge}
                  missingText={t.missingBadge}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const shellContent = activeTab === 'overview' ? overviewTab : activeTab === 'general' ? generalTab : customizeTab;

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="min-h-screen bg-[#030108] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(69,44,140,0.2),transparent_28%),radial-gradient(circle_at_top_left,rgba(146,92,255,0.12),transparent_24%),linear-gradient(90deg,rgba(255,255,255,0.025)_0,rgba(255,255,255,0.01)_10%,transparent_24%,transparent_76%,rgba(255,255,255,0.01)_90%,rgba(255,255,255,0.025)_100%)] opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(7,5,15,0),rgba(3,1,8,0.88)_74%)]" />
      </div>

      <div className="relative mx-auto max-w-[1460px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        <div
          className={cx(
            'grid gap-3 xl:gap-4',
            isAr ? 'xl:grid-cols-[minmax(0,1fr)_228px]' : 'xl:grid-cols-[228px_minmax(0,1fr)]'
          )}
        >
          {isAr ? (
            <>
              <main className={pageShell + ' px-4 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6'}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(144,96,255,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_18%)]" />
                <div className="relative">
                  <div className="mb-5 flex flex-col gap-4 border-b border-white/7 pb-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3">
                      <Link href="/my-bots" className="inline-flex items-center gap-2 text-sm text-white/52 transition hover:text-white/82">
                        <span aria-hidden="true">←</span>
                        {t.back}
                      </Link>
                      <div>
                        <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-white sm:text-[2.35rem]">
                          {activeTab === 'customize'
                            ? t.tabs.customize.title
                            : activeTab === 'overview'
                              ? t.tabs.overview.title
                              : t.tabs.general.title}
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">{t.workspaceBody}</p>
                      </div>
                    </div>
                    {topButtons}
                  </div>

                  {notice ? (
                    <div className={cx('mb-4 rounded-[16px] border px-4 py-3', notice.tone)}>
                      <p className="text-sm font-semibold">{notice.title}</p>
                      <p className="mt-1 text-sm opacity-90">{notice.body}</p>
                    </div>
                  ) : null}

                  {shellContent}
                </div>
              </main>

              <SidebarShell
                botId={botId}
                tabs={tabs}
                activeTab={activeTab}
                displayName={displayName}
                avatarImageUrl={avatarImageUrl}
                bannerImageUrl={bannerImageUrl}
                activityType={activityType}
                planLabel={planLabel}
                planPeriod={planPeriod}
                selectedGuildName={selectedGuildName}
                currentBoundGuildName={currentBoundGuildName}
                isBound={isBound}
                t={t}
              />
            </>
          ) : (
            <>
              <SidebarShell
                botId={botId}
                tabs={tabs}
                activeTab={activeTab}
                displayName={displayName}
                avatarImageUrl={avatarImageUrl}
                bannerImageUrl={bannerImageUrl}
                activityType={activityType}
                planLabel={planLabel}
                planPeriod={planPeriod}
                selectedGuildName={selectedGuildName}
                currentBoundGuildName={currentBoundGuildName}
                isBound={isBound}
                t={t}
              />

              <main className={pageShell + ' px-4 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6'}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(144,96,255,0.12),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.018),transparent_18%)]" />
                <div className="relative">
                  <div className="mb-5 flex flex-col gap-4 border-b border-white/7 pb-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-3">
                      <Link href="/my-bots" className="inline-flex items-center gap-2 text-sm text-white/52 transition hover:text-white/82">
                        <span aria-hidden="true">←</span>
                        {t.back}
                      </Link>
                      <div>
                        <h1 className="text-[2rem] font-semibold tracking-[-0.03em] text-white sm:text-[2.35rem]">
                          {activeTab === 'customize'
                            ? t.tabs.customize.title
                            : activeTab === 'overview'
                              ? t.tabs.overview.title
                              : t.tabs.general.title}
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">{t.workspaceBody}</p>
                      </div>
                    </div>
                    {topButtons}
                  </div>

                  {notice ? (
                    <div className={cx('mb-4 rounded-[16px] border px-4 py-3', notice.tone)}>
                      <p className="text-sm font-semibold">{notice.title}</p>
                      <p className="mt-1 text-sm opacity-90">{notice.body}</p>
                    </div>
                  ) : null}

                  {shellContent}
                </div>
              </main>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
