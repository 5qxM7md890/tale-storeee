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

function statusChip(ok: boolean) {
  return ok
    ? 'border border-emerald-400/18 bg-emerald-500/[0.08] text-emerald-100'
    : 'border border-white/8 bg-white/[0.03] text-white/60';
}

function renderNotice(
  status: {bind?: string; save?: string; appearance?: string; message?: string},
  t: ReturnType<typeof getText>
) {
  if (status.bind === 'success') {
    return {
      tone: 'border-emerald-400/18 bg-emerald-500/[0.07] text-emerald-100',
      title: t.noticeBindSuccess,
      body: status.message || t.noticeBindSuccessBody
    };
  }

  if (status.bind === 'missing_server') {
    return {
      tone: 'border-amber-400/18 bg-amber-500/[0.07] text-amber-100',
      title: t.noticeMissingServer,
      body: status.message || t.noticeMissingServerBody
    };
  }

  if (status.bind === 'error') {
    return {
      tone: 'border-rose-400/18 bg-rose-500/[0.07] text-rose-100',
      title: t.noticeBindError,
      body: status.message || t.noticeBindErrorBody
    };
  }

  if (status.save === 'saved') {
    return {
      tone: 'border-emerald-400/18 bg-emerald-500/[0.07] text-emerald-100',
      title: t.noticeSaveSuccess,
      body: status.message || t.noticeSaveSuccessBody
    };
  }

  if (status.save === 'error') {
    return {
      tone: 'border-rose-400/18 bg-rose-500/[0.07] text-rose-100',
      title: t.noticeSaveError,
      body: status.message || t.noticeSaveErrorBody
    };
  }

  if (status.appearance === 'saved') {
    return {
      tone: 'border-emerald-400/18 bg-emerald-500/[0.07] text-emerald-100',
      title: t.noticeAppearanceSuccess,
      body: status.message || t.noticeAppearanceSuccessBody
    };
  }

  if (status.appearance === 'error') {
    return {
      tone: 'border-rose-400/18 bg-rose-500/[0.07] text-rose-100',
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
        heroBody: 'مساحة عمل هادئة لهذا البوت، متمحورة حول التخصيص، المعاينة، والإعدادات الأساسية.',
        invite: 'دعوة البوت',
        openSetup: 'فتح الإعدادات',
        saveChanges: 'حفظ التغييرات',
        tabs: {
          overview: {title: 'نظرة عامة', desc: 'ملخص هادئ للحالة والإجراءات'},
          customize: {title: 'تخصيص البوت', desc: 'الاسم، الصور، الظهور، والمعاينة'},
          general: {title: 'عام', desc: 'السيرفر، القنوات، والجاهزية'}
        },
        botIdentity: 'هوية البوت',
        currentPlan: 'الخطة الحالية',
        inviteStatus: 'حالة الدعوة',
        bindingStatus: 'حالة الربط',
        selectedServer: 'السيرفر المحدد',
        boundServer: 'السيرفر المرتبط',
        runtimeReadiness: 'جاهزية التشغيل',
        setupReadiness: 'جاهزية الإعداد',
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
        selectServerHint: 'الاختيار والربط يبقيان خاصين بهذا البوت نفسه فقط.',
        bindButton: 'ربط بالسيرفر المحدد',
        bindRuleTitle: 'قاعدة الربط',
        bindRuleBody: 'يسمح لنفس السيرفر بأن يحتوي أنواعًا مختلفة من البوتات، لكن لا يسمح بتكرار نفس النوع على نفس السيرفر.',
        sameTypeConflict: 'يوجد بالفعل بوت من نفس النوع مربوط على هذا السيرفر.',
        generalSettings: 'الإعدادات العامة',
        generalSettingsBody: 'هذه القيم هي التي يقرأها هذا البوت وقت التشغيل.',
        mode: 'الوضع',
        language: 'اللغة',
        createChannel: 'معرّف قناة الإنشاء',
        tempCategory: 'معرّف الفئة المؤقتة',
        panelChannel: 'معرّف قناة اللوحة',
        logsChannel: 'معرّف قناة السجلات',
        defaultUserLimit: 'الحد الافتراضي للمستخدمين',
        appearanceTitle: 'تخصيص البوت',
        appearanceBody: 'عدّل الاسم، الصور، والحضور داخل مساحة تخصيص أقرب إلى المرجع وأكثر هدوءًا.',
        displayName: 'اسم البوت',
        avatarImage: 'صورة البوت',
        bannerImage: 'بانر البوت',
        panelImage: 'صورة اللوحة',
        statusText: 'نص الحالة',
        activityType: 'نوع النشاط',
        uploadHint: 'يمكنك الرفع من الجهاز أو إدخال رابط مباشر.',
        previewTitle: 'المعاينة الحية',
        bannerPreview: 'معاينة البانر',
        panelPreview: 'معاينة صورة اللوحة',
        statusPreview: 'معاينة الحالة',
        activityPreview: 'معاينة النشاط',
        appearanceQuickInfo: 'ملخص التخصيص',
        readinessTitle: 'قائمة الجاهزية',
        readinessBound: ['ربط السيرفر', 'تم ربط البوت بسيرفر صالح.', 'البوت يحتاج إلى ربط سيرفر.'],
        readinessCreate: ['قناة الإنشاء', 'تم حفظ createChannel.', 'createChannel غير مضبوط.'],
        readinessTemp: ['الفئة المؤقتة', 'تم حفظ tempCategory.', 'tempCategory غير مضبوطة.'],
        readinessPanel: ['قناة اللوحة', 'تم حفظ panelChannel.', 'panelChannel غير مضبوط.'],
        readinessLogs: ['قناة السجلات', 'تم حفظ logsChannel.', 'logsChannel غير مضبوط.'],
        readinessImage: ['صورة اللوحة', 'تم ضبط صورة اللوحة.', 'صورة اللوحة غير مضبوطة.'],
        appearanceReady: 'مكتمل',
        appearanceMissing: 'ناقص',
        modeVoiceHint: 'الوضع المستقر الحالي هو VOICE فقط.',
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
        currentBoundGuild: 'السيرفر المرتبط حاليًا',
        quickActions: 'إجراءات سريعة',
        quickActionsBody: 'أهم الإجراءات لهذا البوت بشكل مختصر وهادئ.',
        serverBinding: 'ربط السيرفر',
        serverBindingBody: 'اختر السيرفر المناسب لهذا البوت ثم نفّذ الربط.',
        mediaAssets: 'الصور والوسائط',
        mediaAssetsBody: 'أضف صور الهوية والبانر والبانل بنفس الأسلوب الهادئ داخل المساحة نفسها.',
        presenceSection: 'الحالة والنشاط',
        presenceBody: 'اضبط نص الحالة ونوع النشاط كما سيظهران في ملف البوت.',
        livePreviewBody: 'معاينة أقوى لهوية هذا البوت داخل Tale.',
        imageUrl: 'رابط مباشر',
        uploadFromDevice: 'رفع من الجهاز',
        overviewBody: 'ملخص مركّز لهذا البوت يشمل الحالة، الربط، الجاهزية، والخطوات السريعة.',
        selectedServerCardBody: 'السيرفر الذي تم اختياره لهذا البوت.',
        boundServerCardBody: 'السيرفر المرتبط فعليًا لهذا البوت.',
        runtimeCardBody: 'حالة الجاهزية الحالية مع الإعدادات المطلوبة.',
        inviteCardBody: 'رابط الدعوة الخاص بهذا البوت.',
        channelSection: 'القنوات والإعدادات',
        channelSectionBody: 'قيم القنوات ومعاملات التشغيل الخاصة بهذا البوت.',
        saveAppearance: 'حفظ التخصيص',
        saveGeneral: 'حفظ الإعدادات',
        readyBadge: 'جاهز',
        missingBadge: 'ناقص',
        liveWorkspace: 'مساحة التخصيص',
        previewPane: 'لوحة المعاينة',
        previewPaneBody: 'تجسيد بصري مباشر لاسم البوت وصوره وحالته داخل الصفحة.',
        assetRowsBody: 'أسطر وسائط مترابطة بدل بطاقات منفصلة ثقيلة.',
        supportNote: 'إعدادات الربط والحفظ تبقى كما هي بدون تغيير منطقي.'
      }
    : {
        back: 'Back to My Bots',
        heroBody: 'A calmer workspace for this bot, centered around customization, preview, and core setup.',
        invite: 'Invite Bot',
        openSetup: 'Open Setup',
        saveChanges: 'Save Changes',
        tabs: {
          overview: {title: 'Overview', desc: 'Calm summary and actions'},
          customize: {title: 'Customize Bot', desc: 'Name, assets, presence, and preview'},
          general: {title: 'General', desc: 'Server, channels, and readiness'}
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
        setupIncomplete: 'Some core fields are still missing',
        currentSelectedServer: 'Selected server for this bot',
        selectServer: 'Choose a server for this bot',
        selectServerHint: 'Selection and binding remain scoped to this specific bot only.',
        bindButton: 'Bind to selected server',
        bindRuleTitle: 'Binding Rule',
        bindRuleBody: 'Different bot types can share the same server, but the same bot type cannot be repeated on that server.',
        sameTypeConflict: 'A bot of the same type is already bound to this server.',
        generalSettings: 'General Settings',
        generalSettingsBody: 'These values are what this bot reads at runtime.',
        mode: 'Mode',
        language: 'Language',
        createChannel: 'Create Channel ID',
        tempCategory: 'Temp Category ID',
        panelChannel: 'Panel Channel ID',
        logsChannel: 'Logs Channel ID',
        defaultUserLimit: 'Default User Limit',
        appearanceTitle: 'Bot Customization',
        appearanceBody: 'Adjust the name, assets, and presence inside a quieter customization workspace closer to the reference.',
        displayName: 'Bot Name',
        avatarImage: 'Bot Avatar',
        bannerImage: 'Bot Banner',
        panelImage: 'Panel Image',
        statusText: 'Status Text',
        activityType: 'Activity Type',
        uploadHint: 'Upload from your device or enter a direct image URL.',
        previewTitle: 'Live Preview',
        bannerPreview: 'Banner Preview',
        panelPreview: 'Panel Image Preview',
        statusPreview: 'Status Preview',
        activityPreview: 'Activity Preview',
        appearanceQuickInfo: 'Appearance Summary',
        readinessTitle: 'Readiness Checklist',
        readinessBound: ['Guild binding', 'This bot is bound to a valid server.', 'This bot still needs a server binding.'],
        readinessCreate: ['Create channel', 'createChannel is configured.', 'createChannel is not configured.'],
        readinessTemp: ['Temp category', 'tempCategory is configured.', 'tempCategory is not configured.'],
        readinessPanel: ['Panel channel', 'panelChannel is configured.', 'panelChannel is not configured.'],
        readinessLogs: ['Logs channel', 'logsChannel is configured.', 'logsChannel is not configured.'],
        readinessImage: ['Panel image', 'Panel image is configured.', 'Panel image is missing.'],
        appearanceReady: 'Complete',
        appearanceMissing: 'Missing',
        modeVoiceHint: 'VOICE is the only stable mode for the current runtime.',
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
        noPreview: 'No preview yet',
        streamingHint: 'Choose STREAMING if you want a streaming presence.',
        currentBoundGuild: 'Currently bound server',
        quickActions: 'Quick Actions',
        quickActionsBody: 'The key actions for this bot, kept compact and quiet.',
        serverBinding: 'Server Binding',
        serverBindingBody: 'Choose the correct server for this bot and then bind it.',
        mediaAssets: 'Media Assets',
        mediaAssetsBody: 'Add the identity, banner, and panel assets inside one connected flow.',
        presenceSection: 'Presence & Activity',
        presenceBody: 'Adjust the profile status text and activity type.',
        livePreviewBody: 'A stronger visual preview of this Tale bot identity.',
        imageUrl: 'Direct URL',
        uploadFromDevice: 'Upload from device',
        overviewBody: 'A compact view of this bot’s state, binding, readiness, and key actions.',
        selectedServerCardBody: 'The server currently selected for this bot.',
        boundServerCardBody: 'The server currently bound to this bot.',
        runtimeCardBody: 'Current runtime readiness based on the required values.',
        inviteCardBody: 'Invite link for this specific bot.',
        channelSection: 'Channels & Behavior',
        channelSectionBody: 'Runtime channel IDs and behavior settings for this bot.',
        saveAppearance: 'Save Appearance',
        saveGeneral: 'Save Settings',
        readyBadge: 'Ready',
        missingBadge: 'Missing',
        liveWorkspace: 'Customization Workspace',
        previewPane: 'Preview Pane',
        previewPaneBody: 'A direct visual reflection of the bot name, assets, and presence inside the page.',
        assetRowsBody: 'Connected asset rows instead of heavy isolated cards.',
        supportNote: 'Binding and save logic stay intact with no behavior changes.'
      };
}

const shellCard =
  'rounded-[30px] border border-white/7 bg-[linear-gradient(180deg,rgba(10,7,20,0.94),rgba(7,5,14,0.98))] shadow-[0_36px_120px_rgba(0,0,0,0.44)] backdrop-blur-xl';
const workCard =
  'rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(15,10,28,0.9),rgba(11,8,21,0.94))]';
const panelCard =
  'rounded-[22px] border border-white/6 bg-white/[0.03] shadow-[0_14px_36px_rgba(0,0,0,0.16)]';
const fieldClass =
  'h-12 w-full rounded-[16px] border border-white/[0.06] bg-[#110c20]/90 px-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-violet-300/22 focus:bg-[#161026]';
const fileFieldClass =
  'block w-full rounded-[16px] border border-white/[0.06] bg-[#110c20]/90 px-4 py-3 text-sm text-white/75 file:mr-3 file:rounded-[14px] file:border-0 file:bg-white/[0.08] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/[0.12]';
const primaryButton =
  'inline-flex h-11 items-center justify-center rounded-[16px] border border-violet-300/14 bg-violet-500/[0.12] px-5 text-sm font-semibold text-white transition hover:bg-violet-500/[0.18]';
const secondaryButton =
  'inline-flex h-11 items-center justify-center rounded-[16px] border border-white/8 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.07]';
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40';

function SectionHeader({
  eyebrow,
  title,
  body,
  compact
}: {
  eyebrow: string;
  title: string;
  body?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <p className={labelClass}>{eyebrow}</p>
      <h2 className={compact ? 'text-base font-semibold text-white' : 'text-[1.05rem] font-semibold text-white'}>
        {title}
      </h2>
      {body ? <p className="max-w-3xl text-sm leading-6 text-white/46">{body}</p> : null}
    </div>
  );
}

function SidebarNavItem({
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
      className={
        'block rounded-[18px] px-3.5 py-3 transition ' +
        (active
          ? 'border border-violet-300/14 bg-violet-500/[0.10]'
          : 'border border-transparent bg-transparent hover:border-white/7 hover:bg-white/[0.03]')
      }
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-white/42">{desc}</p>
    </Link>
  );
}

function CompactStat({
  label,
  value,
  body
}: {
  label: string;
  value: string;
  body: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-3.5">
      <p className={labelClass}>{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-white/46">{body}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-white/48">{label}</span>
      <span
        className={
          'max-w-[58%] text-right text-sm text-white ' +
          (mono ? 'break-all font-medium text-white/78' : 'break-words text-white/86')
        }
      >
        {value}
      </span>
    </div>
  );
}

function ReadinessItem({
  label,
  ok,
  readyText,
  missingText,
  t
}: {
  label: string;
  ok: boolean;
  readyText: string;
  missingText: string;
  t: ReturnType<typeof getText>;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[18px] border border-white/6 bg-black/10 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/90">{label}</p>
        <p className="mt-1 text-xs leading-5 text-white/44">{ok ? readyText : missingText}</p>
      </div>
      <span
        className={
          statusChip(ok) +
          ' inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold'
        }
      >
        {ok ? t.readyBadge : t.missingBadge}
      </span>
    </div>
  );
}

function UploadAssetRow({
  title,
  hint,
  urlName,
  urlValue,
  fileName,
  previewUrl,
  previewAlt,
  noPreviewLabel,
  t
}: {
  title: string;
  hint: string;
  urlName: string;
  urlValue: string;
  fileName: string;
  previewUrl: string;
  previewAlt: string;
  noPreviewLabel: string;
  t: ReturnType<typeof getText>;
}) {
  return (
    <div className="rounded-[20px] border border-white/6 bg-black/10 px-4 py-4 sm:px-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_176px]">
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm leading-6 text-white/42">{hint}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2 sm:col-span-2">
              <span className={labelClass}>{t.imageUrl}</span>
              <input name={urlName} defaultValue={urlValue} className={fieldClass} placeholder="https://..." />
            </label>

            <label className="block space-y-2 sm:col-span-2">
              <span className={labelClass}>{t.uploadFromDevice}</span>
              <input name={fileName} type="file" accept="image/*" className={fileFieldClass} />
            </label>
          </div>
        </div>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-[18px] border border-white/6 bg-[#120c22] aspect-[4/3]">
            {previewUrl ? (
              <img src={previewUrl} alt={previewAlt} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-white/30">
                {noPreviewLabel}
              </div>
            )}
          </div>
        </div>
      </div>
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
  const previewStatus = statusText || t.notSet;
  const planLabel = bot.Product?.name || t.notSet;
  const periodLabel = bot.PricingOption?.periodMonths
    ? `${bot.PricingOption.periodMonths} month${bot.PricingOption.periodMonths > 1 ? 's' : ''}`
    : t.notSet;
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
    {key: 'overview', title: t.tabs.overview.title, desc: t.tabs.overview.desc},
    {key: 'customize', title: t.tabs.customize.title, desc: t.tabs.customize.desc},
    {key: 'general', title: t.tabs.general.title, desc: t.tabs.general.desc}
  ];

  const inviteButton = bot.inviteUrl ? (
    <a href={bot.inviteUrl} target="_blank" rel="noreferrer" className={secondaryButton}>
      {t.invite}
    </a>
  ) : (
    <button type="button" disabled className={secondaryButton + ' cursor-not-allowed opacity-45'}>
      {t.invite}
    </button>
  );

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className={shellCard + ' relative overflow-hidden px-3 py-3 sm:px-4 sm:py-4'}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(117,69,218,0.16),transparent_28%),radial-gradient(circle_at_left,rgba(55,31,108,0.2),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_24%)]" />
        <div className="relative grid gap-4 xl:grid-cols-[236px_minmax(0,1fr)]">
          <aside className="min-w-0">
            <div className="rounded-[24px] border border-white/6 bg-white/[0.02] px-3 py-3">
              <div className="rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(25,17,48,0.9),rgba(13,10,26,0.96))] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[18px] border border-white/8 bg-[#161027]">
                    {avatarImageUrl ? (
                      <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/78">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#161027]" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                    <p className="mt-0.5 truncate text-xs text-white/45">{planLabel}</p>
                    <p className="mt-2 inline-flex rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/62">
                      {formatStatus(bot.status)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-[18px] border border-white/6 bg-[#120c22]">
                  <div className="aspect-[16/8] bg-[#17102d]">
                    {bannerImageUrl ? (
                      <img src={bannerImageUrl} alt={t.bannerPreview} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/28">
                        {t.bannerPreview}
                      </div>
                    )}
                  </div>
                  <div className="px-3 pb-3 pt-0">
                    <div className="-mt-5 flex items-end gap-3">
                      <div className="relative h-11 w-11 overflow-hidden rounded-[15px] border-[3px] border-[#120c22] bg-[#17102d]">
                        {avatarImageUrl ? (
                          <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/78">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-white">{displayName}</p>
                    <p className="mt-1 truncate text-xs text-white/46">{previewStatus}</p>
                  </div>
                </div>
              </div>

              <nav className="mt-3 space-y-1.5">
                {tabs.map((tab) => (
                  <SidebarNavItem
                    key={tab.key}
                    href={tabHref(bot.id, tab.key)}
                    title={tab.title}
                    desc={tab.desc}
                    active={tab.key === activeTab}
                  />
                ))}
              </nav>

              <div className="mt-3 rounded-[18px] border border-white/6 bg-white/[0.02] px-3.5 py-3">
                <p className={labelClass}>{t.liveWorkspace}</p>
                <p className="mt-2 text-xs leading-5 text-white/44">{t.supportNote}</p>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <div className={workCard + ' overflow-hidden'}>
              <div className="flex flex-col gap-4 border-b border-white/6 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <Link href="/my-bots" className="inline-flex items-center gap-2 text-sm text-white/52 transition hover:text-white/82">
                    <span>←</span>
                    <span>{t.back}</span>
                  </Link>
                  <div>
                    <h1 className="text-[1.85rem] font-bold tracking-tight text-white sm:text-[2.2rem]">{displayName}</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/46">{t.heroBody}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {inviteButton}
                  <Link href={tabHref(bot.id, 'general')} className={secondaryButton}>
                    {t.openSetup}
                  </Link>
                </div>
              </div>

              {notice ? (
                <div className="px-5 pt-5 sm:px-6">
                  <div className={`rounded-[18px] border px-4 py-3 ${notice.tone}`}>
                    <p className="text-sm font-semibold">{notice.title}</p>
                    <p className="mt-1 text-sm opacity-90">{notice.body}</p>
                  </div>
                </div>
              ) : null}

              <div className="px-5 py-5 sm:px-6 sm:py-6">
                {activeTab === 'overview' ? (
                  <section className="space-y-5">
                    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
                      <div className={panelCard + ' p-5 sm:p-6'}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                          <SectionHeader
                            eyebrow={t.tabs.overview.title}
                            title={t.quickActions}
                            body={t.overviewBody}
                          />

                          <div className="flex flex-wrap gap-2.5">
                            {inviteButton}
                            <form action={bindBotToSelectedServerAction}>
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="botId" value={bot.id} />
                              <input type="hidden" name="returnTab" value="overview" />
                              <input type="hidden" name="selectedGuildId" value={selectedGuildId} />
                              <button type="submit" className={primaryButton}>
                                {t.bindButton}
                              </button>
                            </form>
                            <Link href={tabHref(bot.id, 'customize')} className={secondaryButton}>
                              {t.tabs.customize.title}
                            </Link>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <CompactStat label={t.currentPlan} value={planLabel} body={periodLabel} />
                          <CompactStat
                            label={t.inviteStatus}
                            value={inviteReady ? t.inviteReady : t.inviteMissing}
                            body={t.inviteCardBody}
                          />
                          <CompactStat
                            label={t.bindingStatus}
                            value={isBound ? t.boundServer : t.noBinding}
                            body={isBound ? currentBoundGuildName : t.boundServerCardBody}
                          />
                          <CompactStat
                            label={t.runtimeReadiness}
                            value={runtimeReady ? t.runtimeReady : t.runtimeMissing}
                            body={t.runtimeCardBody}
                          />
                        </div>

                        <div className="mt-5 grid gap-3 xl:grid-cols-2">
                          <ReadinessItem
                            label={t.readinessBound[0]}
                            ok={isBound}
                            readyText={t.readinessBound[1]}
                            missingText={t.readinessBound[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessCreate[0]}
                            ok={hasCreateChannel}
                            readyText={t.readinessCreate[1]}
                            missingText={t.readinessCreate[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessTemp[0]}
                            ok={hasTempCategory}
                            readyText={t.readinessTemp[1]}
                            missingText={t.readinessTemp[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessPanel[0]}
                            ok={hasPanelChannel}
                            readyText={t.readinessPanel[1]}
                            missingText={t.readinessPanel[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessLogs[0]}
                            ok={hasLogsChannel}
                            readyText={t.readinessLogs[1]}
                            missingText={t.readinessLogs[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessImage[0]}
                            ok={hasPanelImage}
                            readyText={t.readinessImage[1]}
                            missingText={t.readinessImage[2]}
                            t={t}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className={panelCard + ' p-5'}>
                          <SectionHeader eyebrow={t.botIdentity} title={displayName} body={t.appearanceQuickInfo} compact />
                          <div className="mt-4 space-y-3">
                            <InfoRow label={t.statusPreview} value={previewStatus} />
                            <InfoRow label={t.activityPreview} value={activityType} />
                            <InfoRow label={t.selectedServer} value={selectedGuildName} />
                            <InfoRow label={t.boundServer} value={isBound ? currentBoundGuildName : t.noBinding} />
                          </div>
                        </div>

                        <div className={panelCard + ' p-5'}>
                          <SectionHeader eyebrow={t.currentSelectedServer} title={selectedGuildName} body={t.selectedServerCardBody} compact />
                          <div className="mt-4 rounded-[16px] border border-white/6 bg-black/10 px-4 py-3 text-sm text-white/68">
                            {selectedGuildId || t.noServer}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                ) : null}

                {activeTab === 'customize' ? (
                  <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <form action={saveBotAppearanceAction} className={panelCard + ' overflow-hidden'}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="botId" value={bot.id} />
                      <input type="hidden" name="returnTab" value="customize" />

                      <div className="px-5 py-5 sm:px-6 sm:py-6">
                        <SectionHeader
                          eyebrow={t.tabs.customize.title}
                          title={t.appearanceTitle}
                          body={t.appearanceBody}
                        />
                      </div>

                      <div className="border-t border-white/6 px-5 py-5 sm:px-6">
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                          <div className="space-y-2">
                            <span className={labelClass}>{t.displayName}</span>
                            <input
                              name="displayName"
                              defaultValue={displayName}
                              className={fieldClass}
                              placeholder={t.displayName}
                            />
                          </div>

                          <div className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-3.5">
                            <p className={labelClass}>{t.appearanceQuickInfo}</p>
                            <div className="mt-3 space-y-2.5">
                              <InfoRow label={t.activityPreview} value={activityType} />
                              <InfoRow label={t.statusPreview} value={previewStatus} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/6 px-5 py-5 sm:px-6">
                        <SectionHeader eyebrow={t.mediaAssets} title={t.mediaAssets} body={t.assetRowsBody} />
                        <div className="mt-4 space-y-3">
                          <UploadAssetRow
                            title={t.avatarImage}
                            hint={t.uploadHint}
                            urlName="avatarImageUrl"
                            urlValue={avatarImageUrl}
                            fileName="avatarImageFile"
                            previewUrl={avatarImageUrl}
                            previewAlt={t.avatarImage}
                            noPreviewLabel={t.noPreview}
                            t={t}
                          />
                          <UploadAssetRow
                            title={t.bannerImage}
                            hint={t.uploadHint}
                            urlName="bannerImageUrl"
                            urlValue={bannerImageUrl}
                            fileName="bannerImageFile"
                            previewUrl={bannerImageUrl}
                            previewAlt={t.bannerImage}
                            noPreviewLabel={t.noPreview}
                            t={t}
                          />
                          <UploadAssetRow
                            title={t.panelImage}
                            hint={t.uploadHint}
                            urlName="panelImageUrl"
                            urlValue={panelImageUrl}
                            fileName="panelImageFile"
                            previewUrl={panelImageUrl}
                            previewAlt={t.panelImage}
                            noPreviewLabel={t.noPreview}
                            t={t}
                          />
                        </div>
                      </div>

                      <div className="border-t border-white/6 px-5 py-5 sm:px-6">
                        <SectionHeader eyebrow={t.presenceSection} title={t.presenceSection} body={t.presenceBody} />
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="block space-y-2 md:col-span-2">
                            <span className={labelClass}>{t.statusText}</span>
                            <input
                              name="statusText"
                              defaultValue={statusText}
                              className={fieldClass}
                              placeholder={t.statusText}
                            />
                          </label>

                          <label className="block space-y-2">
                            <span className={labelClass}>{t.activityType}</span>
                            <select name="activityType" defaultValue={activityType} className={fieldClass}>
                              <option value="PLAYING">PLAYING</option>
                              <option value="LISTENING">LISTENING</option>
                              <option value="WATCHING">WATCHING</option>
                              <option value="COMPETING">COMPETING</option>
                              <option value="STREAMING">STREAMING</option>
                            </select>
                          </label>

                          <div className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-3.5">
                            <p className={labelClass}>{t.statusPreview}</p>
                            <div className="mt-3 flex items-center gap-2.5">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                              <span className="truncate text-sm text-white">{previewStatus}</span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-white/45">{t.streamingHint}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end border-t border-white/6 px-5 py-4 sm:px-6">
                        <button type="submit" className={primaryButton}>
                          {t.saveAppearance}
                        </button>
                      </div>
                    </form>

                    <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
                      <div className={panelCard + ' overflow-hidden'}>
                        <div className="px-5 py-5 sm:px-6">
                          <SectionHeader eyebrow={t.previewPane} title={t.previewTitle} body={t.previewPaneBody} />
                        </div>

                        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                          <div className="overflow-hidden rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(17,12,31,0.96),rgba(11,8,20,0.98))]">
                            <div className="aspect-[16/7] bg-[#17102d]">
                              {bannerImageUrl ? (
                                <img src={bannerImageUrl} alt={t.bannerPreview} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-white/28">
                                  {t.bannerPreview}
                                </div>
                              )}
                            </div>

                            <div className="px-4 pb-4 pt-0">
                              <div className="-mt-7 flex items-end justify-between gap-3">
                                <div className="flex items-end gap-3">
                                  <div className="relative h-16 w-16 overflow-hidden rounded-[18px] border-[4px] border-[#110c21] bg-[#1a1230]">
                                    {avatarImageUrl ? (
                                      <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white/78">
                                        {displayName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <span className="mb-2 inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                                </div>

                                <span className="mb-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] text-white/64">
                                  {activityType}
                                </span>
                              </div>

                              <div className="mt-3">
                                <p className="text-lg font-semibold text-white">{displayName}</p>
                                <p className="mt-1 text-sm text-white/52">{previewStatus}</p>
                              </div>

                              <div className="mt-4 overflow-hidden rounded-[18px] border border-white/6 bg-[#151026]">
                                <div className="aspect-[16/9]">
                                  {panelImageUrl ? (
                                    <img src={panelImageUrl} alt={t.panelPreview} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm text-white/28">
                                      {t.noPreview}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 space-y-2.5 rounded-[18px] border border-white/6 bg-black/10 px-4 py-3.5">
                                <InfoRow label={t.displayName} value={displayName} />
                                <InfoRow label={t.statusPreview} value={previewStatus} />
                                <InfoRow label={t.activityPreview} value={activityType} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </section>
                ) : null}

                {activeTab === 'general' ? (
                  <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className={panelCard + ' overflow-hidden'}>
                      <div className="px-5 py-5 sm:px-6">
                        <SectionHeader
                          eyebrow={t.tabs.general.title}
                          title={t.serverBinding}
                          body={t.serverBindingBody}
                        />

                        <form action={bindBotToSelectedServerAction} className="mt-5 space-y-4">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="botId" value={bot.id} />
                          <input type="hidden" name="returnTab" value="general" />

                          <label className="block space-y-2">
                            <span className={labelClass}>{t.selectServer}</span>
                            <select name="selectedGuildId" defaultValue={selectedGuildId} className={fieldClass}>
                              <option value="">{t.noServer}</option>
                              {guildOptions.map((guild) => (
                                <option key={guild.id} value={guild.id}>
                                  {guild.name} — {guild.id}
                                </option>
                              ))}
                            </select>
                          </label>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="rounded-[16px] border border-white/6 bg-black/10 px-4 py-3 text-sm text-white/66">
                              {selectedGuildId || t.noServer}
                            </div>
                            <button type="submit" className={primaryButton}>
                              {t.bindButton}
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="border-t border-white/6 px-5 py-5 sm:px-6">
                        <form action={saveBotSetupAction} className="space-y-5">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="botId" value={bot.id} />
                          <input type="hidden" name="returnTab" value="general" />

                          <SectionHeader
                            eyebrow={t.channelSection}
                            title={t.generalSettings}
                            body={t.channelSectionBody}
                          />

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="block space-y-2">
                              <span className={labelClass}>{t.mode}</span>
                              <select name="mode" defaultValue={bot.BotSetting?.mode || 'VOICE'} className={fieldClass}>
                                <option value="VOICE">VOICE</option>
                              </select>
                              <span className="text-xs text-white/38">{t.modeVoiceHint}</span>
                            </label>

                            <label className="block space-y-2">
                              <span className={labelClass}>{t.language}</span>
                              <select name="language" defaultValue={bot.BotSetting?.language || 'en'} className={fieldClass}>
                                <option value="en">English</option>
                                <option value="ar">العربية</option>
                              </select>
                            </label>

                            <label className="block space-y-2">
                              <span className={labelClass}>{t.createChannel}</span>
                              <input
                                name="createChannel"
                                defaultValue={bot.BotSetting?.createChannel || ''}
                                className={fieldClass}
                                placeholder="123456789012345678"
                                inputMode="numeric"
                              />
                            </label>

                            <label className="block space-y-2">
                              <span className={labelClass}>{t.tempCategory}</span>
                              <input
                                name="tempCategory"
                                defaultValue={bot.BotSetting?.tempCategory || ''}
                                className={fieldClass}
                                placeholder="123456789012345678"
                                inputMode="numeric"
                              />
                            </label>

                            <label className="block space-y-2">
                              <span className={labelClass}>{t.panelChannel}</span>
                              <input
                                name="panelChannel"
                                defaultValue={bot.BotSetting?.panelChannel || ''}
                                className={fieldClass}
                                placeholder="123456789012345678"
                                inputMode="numeric"
                              />
                            </label>

                            <label className="block space-y-2">
                              <span className={labelClass}>{t.logsChannel}</span>
                              <input
                                name="logsChannel"
                                defaultValue={bot.BotSetting?.logsChannel || ''}
                                className={fieldClass}
                                placeholder="123456789012345678"
                                inputMode="numeric"
                              />
                            </label>

                            <label className="block space-y-2 md:col-span-2">
                              <span className={labelClass}>{t.defaultUserLimit}</span>
                              <input
                                name="defaultUserLimit"
                                type="number"
                                min="0"
                                defaultValue={bot.BotSetting?.defaultUserLimit ?? 0}
                                className={fieldClass}
                              />
                            </label>
                          </div>

                          <div className="flex justify-end">
                            <button type="submit" className={primaryButton}>
                              {t.saveGeneral}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className={panelCard + ' p-5'}>
                        <SectionHeader eyebrow={t.bindingStatus} title={isBound ? t.boundServer : t.noBinding} body={t.bindRuleBody} compact />
                        <div className="mt-4 space-y-3">
                          <InfoRow label={t.selectedServer} value={selectedGuildName} />
                          <InfoRow label={t.currentBoundGuild} value={isBound ? currentBoundGuildName : t.noBinding} />
                        </div>
                        {conflictingSameTypeBot ? (
                          <div className="mt-4 rounded-[16px] border border-amber-400/18 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-100">
                            {t.sameTypeConflict}
                          </div>
                        ) : null}
                      </div>

                      <div className={panelCard + ' p-5'}>
                        <SectionHeader eyebrow={t.readinessTitle} title={t.runtimeReadiness} body={t.runtimeCardBody} compact />
                        <div className="mt-4 space-y-3">
                          <ReadinessItem
                            label={t.readinessBound[0]}
                            ok={isBound}
                            readyText={t.readinessBound[1]}
                            missingText={t.readinessBound[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessCreate[0]}
                            ok={hasCreateChannel}
                            readyText={t.readinessCreate[1]}
                            missingText={t.readinessCreate[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessTemp[0]}
                            ok={hasTempCategory}
                            readyText={t.readinessTemp[1]}
                            missingText={t.readinessTemp[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessPanel[0]}
                            ok={hasPanelChannel}
                            readyText={t.readinessPanel[1]}
                            missingText={t.readinessPanel[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessLogs[0]}
                            ok={hasLogsChannel}
                            readyText={t.readinessLogs[1]}
                            missingText={t.readinessLogs[2]}
                            t={t}
                          />
                          <ReadinessItem
                            label={t.readinessImage[0]}
                            ok={hasPanelImage}
                            readyText={t.readinessImage[1]}
                            missingText={t.readinessImage[2]}
                            t={t}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
