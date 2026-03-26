
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
    ? 'border border-emerald-400/22 bg-emerald-500/[0.1] text-emerald-100'
    : 'border border-white/10 bg-white/[0.04] text-white/58';
}

function readinessRow(label: string, ok: boolean, readyText: string, missingText: string) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white/92">{label}</p>
        <p className="mt-1 text-sm leading-6 text-white/44">{ok ? readyText : missingText}</p>
      </div>
      <span
        className={
          statusChip(ok) +
          ' inline-flex min-w-[92px] shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold'
        }
      >
        {ok ? 'Ready' : 'Missing'}
      </span>
    </div>
  );
}

function renderNotice(
  status: {bind?: string; save?: string; appearance?: string; message?: string},
  t: ReturnType<typeof getText>
) {
  if (status.bind === 'success') {
    return {
      tone: 'border-emerald-400/20 bg-emerald-500/[0.07] text-emerald-100',
      title: t.noticeBindSuccess,
      body: status.message || t.noticeBindSuccessBody
    };
  }

  if (status.bind === 'missing_server') {
    return {
      tone: 'border-amber-400/20 bg-amber-500/[0.07] text-amber-100',
      title: t.noticeMissingServer,
      body: status.message || t.noticeMissingServerBody
    };
  }

  if (status.bind === 'error') {
    return {
      tone: 'border-rose-400/20 bg-rose-500/[0.07] text-rose-100',
      title: t.noticeBindError,
      body: status.message || t.noticeBindErrorBody
    };
  }

  if (status.save === 'saved') {
    return {
      tone: 'border-emerald-400/20 bg-emerald-500/[0.07] text-emerald-100',
      title: t.noticeSaveSuccess,
      body: status.message || t.noticeSaveSuccessBody
    };
  }

  if (status.save === 'error') {
    return {
      tone: 'border-rose-400/20 bg-rose-500/[0.07] text-rose-100',
      title: t.noticeSaveError,
      body: status.message || t.noticeSaveErrorBody
    };
  }

  if (status.appearance === 'saved') {
    return {
      tone: 'border-emerald-400/20 bg-emerald-500/[0.07] text-emerald-100',
      title: t.noticeAppearanceSuccess,
      body: status.message || t.noticeAppearanceSuccessBody
    };
  }

  if (status.appearance === 'error') {
    return {
      tone: 'border-rose-400/20 bg-rose-500/[0.07] text-rose-100',
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
        heroBody: 'لوحة إدارة مضغوطة وراقية لهذا البوت، بتوزيع أنظف، معاينة أوضح، وتجربة أقرب إلى لوحات التحكم الممتازة.',
        invite: 'دعوة البوت',
        openSetup: 'فتح الإعدادات',
        saveChanges: 'حفظ التغييرات',
        tabs: {
          overview: {title: 'نظرة عامة', desc: 'ملخص سريع، الحالة، والإجراءات'},
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
        selectServerHint: 'الاختيار والحفظ يتمان لهذا البوت نفسه فقط، بدون أي اعتماد على active server عام.',
        bindButton: 'ربط بالسيرفر المحدد',
        bindRuleTitle: 'قاعدة الربط',
        bindRuleBody: 'يسمح لنفس السيرفر بأن يحتوي أنواعًا مختلفة من البوتات، لكن لا يسمح بتكرار نفس النوع على نفس السيرفر.',
        sameTypeConflict: 'يوجد بالفعل بوت من نفس النوع مربوط على هذا السيرفر.',
        generalSettings: 'الإعدادات العامة',
        generalSettingsBody: 'هذه القيم هي التي يقرأها هذا البوت نفسه وقت التشغيل.',
        mode: 'الوضع',
        language: 'اللغة',
        createChannel: 'معرّف قناة الإنشاء',
        tempCategory: 'معرّف الفئة المؤقتة',
        panelChannel: 'معرّف قناة اللوحة',
        logsChannel: 'معرّف قناة السجلات',
        defaultUserLimit: 'الحد الافتراضي للمستخدمين',
        appearanceTitle: 'تخصيص البوت',
        appearanceBody: 'حدّث الاسم، الصور، ونمط الظهور داخل واجهة أقرب إلى المرجع مع الحفاظ على هوية Tale.',
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
        quickActionsBody: 'الوصول السريع لأهم الخطوات المتعلقة بهذا البوت.',
        serverBinding: 'ربط السيرفر',
        serverBindingBody: 'اختر السيرفر المناسب لهذا البوت ثم نفّذ الربط.',
        mediaAssets: 'الصور والوسائط',
        mediaAssetsBody: 'ارفع صورة لكل جزء أو استخدم رابطًا مباشرًا بصورة واضحة.',
        presenceSection: 'الحالة والنشاط',
        presenceBody: 'اضبط نص الحالة ونوع النشاط كما سيظهران في البروفايل.',
        livePreviewBody: 'معاينة أنيقة لواجهة البوت الحالية داخل Tale.',
        imageUrl: 'رابط مباشر',
        uploadFromDevice: 'رفع من الجهاز',
        overviewBody: 'نظرة مركزة على حالة هذا البوت، الربط، الجاهزية، والخطوات السريعة.',
        selectedServerCardBody: 'السيرفر الذي تم اختياره لهذا الـ bot instance.',
        boundServerCardBody: 'السيرفر المرتبط فعليًا لهذا البوت.',
        runtimeCardBody: 'حالة الجاهزية الحالية مع الإعدادات المطلوبة.',
        inviteCardBody: 'رابط الدعوة الخاص بهذا البوت.',
        channelSection: 'القنوات والإعدادات',
        channelSectionBody: 'قيم القنوات ومعاملات التشغيل الخاصة بهذا البوت.',
        saveAppearance: 'حفظ التخصيص',
        saveGeneral: 'حفظ الإعدادات',
        readyBadge: 'جاهز',
        missingBadge: 'ناقص'
      }
    : {
        back: 'Back to My Bots',
        heroBody: 'A compact premium dashboard for this bot with cleaner structure, higher-fidelity preview, and a more polished Tale feel.',
        invite: 'Invite Bot',
        openSetup: 'Open Setup',
        saveChanges: 'Save Changes',
        tabs: {
          overview: {title: 'Overview', desc: 'Summary, status, and quick actions'},
          customize: {title: 'Customize Bot', desc: 'Name, images, presence, and preview'},
          general: {title: 'General', desc: 'Server, channels, language, and readiness'}
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
        selectServerHint: 'Selection and binding are scoped to this bot instance only, with no active-server fallback.',
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
        appearanceTitle: 'Bot Appearance',
        appearanceBody: 'Update the name, assets, and presence inside a layout inspired by the reference while keeping Tale’s identity.',
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
        quickActionsBody: 'Fast access to the most important actions for this bot.',
        serverBinding: 'Server Binding',
        serverBindingBody: 'Choose the correct server for this bot and then bind it.',
        mediaAssets: 'Media Assets',
        mediaAssetsBody: 'Upload clean image assets for each area or use a direct image URL.',
        presenceSection: 'Presence & Activity',
        presenceBody: 'Adjust the profile status text and activity type.',
        livePreviewBody: 'A polished preview of the current Tale bot identity.',
        imageUrl: 'Direct URL',
        uploadFromDevice: 'Upload from device',
        overviewBody: 'A compact view of this bot’s state, binding, readiness, and key actions.',
        selectedServerCardBody: 'The server currently selected for this bot instance.',
        boundServerCardBody: 'The server currently bound to this bot.',
        runtimeCardBody: 'Current runtime readiness based on the required values.',
        inviteCardBody: 'Invite link for this specific bot.',
        channelSection: 'Channels & Behavior',
        channelSectionBody: 'Runtime channel IDs and behavior settings for this bot.',
        saveAppearance: 'Save Appearance',
        saveGeneral: 'Save Settings',
        readyBadge: 'Ready',
        missingBadge: 'Missing'
      };
}

const shellCard =
  'rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(11,8,22,0.92),rgba(7,5,16,0.96))] shadow-[0_34px_110px_rgba(0,0,0,0.42)] backdrop-blur-xl';
const innerCard =
  'rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,13,36,0.96),rgba(10,8,22,0.96))] shadow-[0_20px_60px_rgba(0,0,0,0.24)]';
const softCard =
  'rounded-[26px] border border-white/8 bg-white/[0.035] shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur';
const glowCard =
  'rounded-[28px] border border-violet-300/12 bg-[linear-gradient(180deg,rgba(33,20,63,0.94),rgba(11,8,22,0.98))] shadow-[0_24px_70px_rgba(59,24,126,0.28)]';
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-white/42';
const sectionTitleClass = 'text-[1.05rem] font-semibold text-white';
const fieldClass =
  'h-14 w-full rounded-[20px] border border-white/0 bg-white/[0.04] px-5 text-sm text-white outline-none transition placeholder:text-white/28 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:bg-white/[0.055] focus:shadow-[inset_0_0_0_1px_rgba(167,139,250,0.45),0_0_0_6px_rgba(109,68,206,0.12)]';
const fileFieldClass =
  'block w-full rounded-[20px] border border-white/0 bg-white/[0.04] px-4 py-3 text-sm text-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] file:mr-3 file:rounded-2xl file:border-0 file:bg-white/[0.1] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-white/[0.14]';
const primaryButton =
  'inline-flex h-12 items-center justify-center rounded-[18px] border border-violet-300/18 bg-violet-500/[0.14] px-5 text-sm font-semibold text-white transition hover:bg-violet-500/[0.2]';
const secondaryButton =
  'inline-flex h-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]';
const mutedButton =
  'inline-flex h-12 items-center justify-center rounded-[18px] border border-white/8 bg-black/10 px-5 text-sm font-semibold text-white/74 transition hover:bg-white/[0.04]';

function MetricCard({
  label,
  value,
  body,
  accent
}: {
  label: string;
  value: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        (accent ? glowCard : softCard) +
        ' min-w-0 p-5 sm:p-5'
      }
    >
      <p className={labelClass}>{label}</p>
      <p className="mt-4 break-words text-lg font-semibold leading-7 text-white">{value}</p>
      <p className="mt-2 break-words text-sm leading-6 text-white/46">{body}</p>
    </div>
  );
}

function InfoRow({label, value, mono}: {label: string; value: string; mono?: boolean}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-white/50">{label}</span>
      <span className={'max-w-[60%] text-right text-sm text-white ' + (mono ? 'break-all font-medium text-white/78' : 'break-words')}>
        {value}
      </span>
    </div>
  );
}

function SectionHeader({eyebrow, title, body}: {eyebrow: string; title: string; body: string}) {
  return (
    <div className="space-y-1.5">
      <p className={labelClass}>{eyebrow}</p>
      <h2 className={sectionTitleClass}>{title}</h2>
      <p className="max-w-3xl text-sm leading-6 text-white/46">{body}</p>
    </div>
  );
}

function UploadAssetCard({
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
    <div className={softCard + ' p-4 sm:p-5'}>
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm leading-6 text-white/44">{hint}</p>
          </div>

          <label className="block space-y-2">
            <span className={labelClass}>{t.imageUrl}</span>
            <input
              name={urlName}
              defaultValue={urlValue}
              className={fieldClass}
              placeholder="https://..."
            />
          </label>

          <label className="block space-y-2">
            <span className={labelClass}>{t.uploadFromDevice}</span>
            <input name={fileName} type="file" accept="image/*" className={fileFieldClass} />
          </label>
        </div>

        <div className="xl:w-[178px]">
          <div className="rounded-[24px] border border-white/8 bg-black/20 p-3">
            <div className="overflow-hidden rounded-[20px] border border-white/8 bg-[#130d25] aspect-[4/3]">
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
        'block rounded-[22px] px-4 py-4 transition ' +
        (active
          ? 'border border-violet-300/16 bg-[linear-gradient(180deg,rgba(93,56,170,0.34),rgba(33,21,61,0.58))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_38px_rgba(65,28,141,0.22)]'
          : 'border border-white/0 bg-white/[0.025] hover:border-white/8 hover:bg-white/[0.05]')
      }
    >
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-white/42">{desc}</p>
    </Link>
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
  const planLabel = bot.Product?.name || t.notSet;
  const periodLabel = bot.PricingOption?.periodMonths
    ? `${bot.PricingOption.periodMonths} month${bot.PricingOption.periodMonths > 1 ? 's' : ''}`
    : t.notSet;
  const previewStatus = statusText || t.notSet;

  const conflictingSameTypeBot = selectedGuildId
    ? await prisma.guildBinding.findFirst({
        where: {
          guildId: selectedGuildId,
          productId: bot.productId,
          NOT: {botInstanceId: bot.id}
        },
        select: {botInstanceId: true}
      })
    : null;

  const notice = renderNotice(
    {
      bind: resolvedSearchParams?.bind,
      save: resolvedSearchParams?.save,
      appearance: resolvedSearchParams?.appearance,
      message: resolvedSearchParams?.message
    },
    t
  );

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
    <button type="button" disabled className={mutedButton + ' cursor-not-allowed opacity-60'}>
      {t.invite}
    </button>
  );

  const sidebar = (
    <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
      <div className={shellCard + ' overflow-hidden p-4'}>
        <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(19,13,36,0.98),rgba(9,7,18,0.98))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[#100b1d]">
            <div className="relative aspect-[16/8] overflow-hidden bg-[linear-gradient(135deg,rgba(88,52,170,0.42),rgba(12,8,23,0.9))]">
              {bannerImageUrl ? (
                <img src={bannerImageUrl} alt={t.bannerPreview} className="h-full w-full object-cover" />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_35%,rgba(6,4,12,0.4)_100%)]" />
            </div>
            <div className="px-4 pb-4 pt-0">
              <div className="-mt-7 flex items-end gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-[22px] border-4 border-[#100b1d] bg-[#171029] shadow-[0_14px_30px_rgba(0,0,0,0.35)]">
                  {avatarImageUrl ? (
                    <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white/82">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="mb-1 inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
              </div>
              <div className="mt-3 min-w-0">
                <p className="truncate text-base font-semibold text-white">{displayName}</p>
                <p className="mt-1 truncate text-sm text-white/46">{planLabel}</p>
                <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="truncate">{previewStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {tabs.map((tab) => (
              <SidebarNavItem
                key={tab.key}
                href={tabHref(bot.id, tab.key)}
                title={tab.title}
                desc={tab.desc}
                active={tab.key === activeTab}
              />
            ))}
          </div>

          <div className="mt-4 space-y-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <InfoRow label={t.selectedServer} value={selectedGuildName} />
            <InfoRow label={t.bindingStatus} value={isBound ? t.boundServer : t.noBinding} />
            <div className="pt-1">
              <span
                className={
                  statusChip(runtimeReady) +
                  ' inline-flex rounded-full px-3 py-1.5 text-xs font-semibold'
                }
              >
                {runtimeReady ? t.runtimeReady : t.runtimeMissing}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  const main = (
    <main className="min-w-0 space-y-6">
      <section className={shellCard + ' relative overflow-hidden px-5 py-5 sm:px-6 sm:py-6 lg:px-7'}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(132,93,255,0.18),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(72,40,146,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_28%)]" />
        <div className="relative space-y-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-3">
              <Link href="/my-bots" className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white/88">
                <span>{isAr ? '→' : '←'}</span>
                <span>{t.back}</span>
              </Link>

              <div className="space-y-2">
                <h1 className="text-[2rem] font-extrabold tracking-tight text-white sm:text-[2.45rem]">
                  {displayName}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-white/54">{t.heroBody}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/74">
                  {formatStatus(bot.status)}
                </span>
                <span
                  className={
                    statusChip(runtimeReady) +
                    ' inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold'
                  }
                >
                  {runtimeReady ? t.readyBadge : t.missingBadge}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {inviteButton}
              <Link href={tabHref(bot.id, 'general')} className={secondaryButton}>
                {t.openSetup}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              label={t.currentPlan}
              value={planLabel}
              body={periodLabel}
              accent
            />
            <MetricCard
              label={t.selectedServer}
              value={selectedGuildName}
              body={t.selectedServerCardBody}
            />
            <MetricCard
              label={t.bindingStatus}
              value={isBound ? currentBoundGuildName : t.noBinding}
              body={t.boundServerCardBody}
            />
            <MetricCard
              label={t.runtimeReadiness}
              value={runtimeReady ? t.runtimeReady : t.runtimeMissing}
              body={t.runtimeCardBody}
            />
          </div>
        </div>
      </section>

      {notice ? (
        <div className={`rounded-[24px] border px-4 py-4 sm:px-5 ${notice.tone}`}>
          <p className="text-sm font-semibold">{notice.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{notice.body}</p>
        </div>
      ) : null}

      {activeTab === 'overview' ? (
        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <div className={innerCard + ' p-5 sm:p-6'}>
              <SectionHeader eyebrow={t.tabs.overview.title} title={t.quickActions} body={t.quickActionsBody} />
              <div className="mt-5 flex flex-wrap gap-3">
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
                <Link href={tabHref(bot.id, 'general')} className={secondaryButton}>
                  {t.tabs.general.title}
                </Link>
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-2">
                {readinessRow(t.readinessBound[0], isBound, t.readinessBound[1], t.readinessBound[2])}
                {readinessRow(t.readinessCreate[0], hasCreateChannel, t.readinessCreate[1], t.readinessCreate[2])}
                {readinessRow(t.readinessTemp[0], hasTempCategory, t.readinessTemp[1], t.readinessTemp[2])}
                {readinessRow(t.readinessPanel[0], hasPanelChannel, t.readinessPanel[1], t.readinessPanel[2])}
                {readinessRow(t.readinessLogs[0], hasLogsChannel, t.readinessLogs[1], t.readinessLogs[2])}
                {readinessRow(t.readinessImage[0], hasPanelImage, t.readinessImage[1], t.readinessImage[2])}
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className={softCard + ' min-w-0 p-5 sm:p-6'}>
                <SectionHeader eyebrow={t.botIdentity} title={displayName} body={t.overviewBody} />
                <div className="mt-6 flex min-w-0 items-center gap-4">
                  <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#171029]">
                    {avatarImageUrl ? (
                      <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/80">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-semibold text-white">{displayName}</p>
                    <p className="mt-1 text-sm text-white/48">{formatStatus(bot.status)}</p>
                    <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/72">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="truncate">{previewStatus}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={softCard + ' p-5 sm:p-6'}>
                <SectionHeader eyebrow={t.inviteStatus} title={inviteReady ? t.inviteReady : t.inviteMissing} body={t.inviteCardBody} />
                <div className="mt-6 space-y-4">
                  <InfoRow label={t.selectedServer} value={selectedGuildName} />
                  <InfoRow label={t.currentBoundGuild} value={currentBoundGuildName} />
                  <InfoRow label={t.activityPreview} value={activityType} />
                  <InfoRow label={t.statusPreview} value={previewStatus} />
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-5">
            <div className={glowCard + ' overflow-hidden p-4'}>
              <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#110b1e]">
                <div className="relative aspect-[16/8] bg-[linear-gradient(135deg,rgba(92,54,176,0.4),rgba(11,8,23,0.9))]">
                  {bannerImageUrl ? (
                    <img src={bannerImageUrl} alt={t.bannerPreview} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="px-5 pb-5 pt-0">
                  <div className="-mt-9 flex items-end gap-3">
                    <div className="relative h-20 w-20 overflow-hidden rounded-[24px] border-[5px] border-[#110b1e] bg-[#171029] shadow-[0_18px_34px_rgba(0,0,0,0.32)]">
                      {avatarImageUrl ? (
                        <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/84">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 min-w-0">
                    <p className="truncate text-xl font-semibold text-white">{displayName}</p>
                    <p className="mt-1 text-sm text-white/48">{planLabel}</p>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <p className={labelClass}>{t.statusPreview}</p>
                      <p className="mt-2 break-words text-sm text-white/82">{previewStatus}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <p className={labelClass}>{t.activityPreview}</p>
                      <p className="mt-2 text-sm text-white/82">{activityType}</p>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <p className={labelClass}>{t.panelPreview}</p>
                      <div className="mt-3 aspect-[16/10] overflow-hidden rounded-[18px] border border-white/8 bg-[#150f27]">
                        {panelImageUrl ? (
                          <img src={panelImageUrl} alt={t.panelPreview} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-white/28">
                            {t.noPreview}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={softCard + ' p-5'}>
              <SectionHeader eyebrow={t.setupReadiness} title={runtimeReady ? t.runtimeReady : t.runtimeMissing} body={setupComplete ? t.setupComplete : t.setupIncomplete} />
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'customize' ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form action={saveBotAppearanceAction} className={innerCard + ' min-w-0 space-y-6 p-5 sm:p-6'}>
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="botId" value={bot.id} />
            <input type="hidden" name="returnTab" value="customize" />

            <SectionHeader eyebrow={t.tabs.customize.title} title={t.appearanceTitle} body={t.appearanceBody} />

            <div className="grid gap-5 lg:grid-cols-2">
              <div className={softCard + ' p-5 lg:col-span-2'}>
                <SectionHeader eyebrow={t.botIdentity} title={t.displayName} body={t.presenceBody} />
                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="block space-y-2">
                    <span className={labelClass}>{t.displayName}</span>
                    <input
                      name="displayName"
                      defaultValue={displayName}
                      className={fieldClass}
                      placeholder={t.displayName}
                    />
                  </label>

                  <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                    <p className={labelClass}>{t.appearanceQuickInfo}</p>
                    <div className="mt-4 space-y-3 text-sm">
                      <InfoRow label={t.activityPreview} value={activityType} />
                      <InfoRow label={t.statusPreview} value={previewStatus} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <SectionHeader eyebrow={t.mediaAssets} title={t.mediaAssets} body={t.mediaAssetsBody} />
              </div>

              <div className="space-y-5 lg:col-span-2">
                <UploadAssetCard
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
                <UploadAssetCard
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
                <UploadAssetCard
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

              <div className={softCard + ' p-5 lg:col-span-2'}>
                <SectionHeader eyebrow={t.presenceSection} title={t.presenceSection} body={t.presenceBody} />
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <label className="block space-y-2 lg:col-span-2">
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
                    <span className="text-sm text-white/38">{t.streamingHint}</span>
                  </label>

                  <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                    <p className={labelClass}>{t.statusPreview}</p>
                    <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="text-sm text-white">{previewStatus}</span>
                    </div>
                    <p className="mt-3 text-sm text-white/46">{activityType}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className={primaryButton}>
                {t.saveAppearance}
              </button>
            </div>
          </form>

          <div className="min-w-0 space-y-5 xl:sticky xl:top-6 xl:self-start">
            <div className={glowCard + ' overflow-hidden p-4'}>
              <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#0f0a1b]">
                <div className="relative aspect-[16/9] overflow-hidden bg-[linear-gradient(135deg,rgba(96,59,182,0.38),rgba(13,9,25,0.96))]">
                  {bannerImageUrl ? (
                    <img src={bannerImageUrl} alt={t.bannerPreview} className="h-full w-full object-cover" />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_40%,rgba(7,5,16,0.46)_100%)]" />
                </div>

                <div className="px-5 pb-5 pt-0">
                  <div className="-mt-9 flex items-end gap-3">
                    <div className="relative h-[84px] w-[84px] overflow-hidden rounded-[26px] border-[5px] border-[#0f0a1b] bg-[#171029] shadow-[0_18px_36px_rgba(0,0,0,0.34)]">
                      {avatarImageUrl ? (
                        <img src={avatarImageUrl} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white/84">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="mb-2 inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.65)]" />
                  </div>

                  <div className="mt-4 min-w-0">
                    <p className="truncate text-xl font-semibold text-white">{displayName}</p>
                    <p className="mt-1 text-sm text-white/46">{planLabel}</p>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <p className={labelClass}>{t.statusText}</p>
                      <p className="mt-2 break-words text-sm text-white/84">{previewStatus}</p>
                    </div>

                    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <p className={labelClass}>{t.activityType}</p>
                      <p className="mt-2 text-sm text-white/84">{activityType}</p>
                    </div>

                    <div className="rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-3">
                      <p className={labelClass}>{t.panelPreview}</p>
                      <div className="mt-3 aspect-[16/11] overflow-hidden rounded-[18px] border border-white/8 bg-[#150f27]">
                        {panelImageUrl ? (
                          <img src={panelImageUrl} alt={t.panelPreview} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-white/28">
                            {t.noPreview}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={softCard + ' p-5'}>
              <SectionHeader eyebrow={t.previewTitle} title={t.previewTitle} body={t.livePreviewBody} />
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'general' ? (
        <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <div className={innerCard + ' p-5 sm:p-6'}>
              <SectionHeader eyebrow={t.serverBinding} title={t.currentSelectedServer} body={t.selectServerHint} />

              <form action={bindBotToSelectedServerAction} className="mt-6 space-y-5">
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
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/62">
                    {selectedGuildId || t.noServer}
                  </div>
                  <button type="submit" className={primaryButton}>
                    {t.bindButton}
                  </button>
                </div>
              </form>
            </div>

            <form action={saveBotSetupAction} className={innerCard + ' space-y-6 p-5 sm:p-6'}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="botId" value={bot.id} />
              <input type="hidden" name="returnTab" value="general" />

              <SectionHeader eyebrow={t.generalSettings} title={t.generalSettings} body={t.generalSettingsBody} />

              <div className={softCard + ' p-5'}>
                <SectionHeader eyebrow={t.channelSection} title={t.channelSection} body={t.channelSectionBody} />
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <label className="block space-y-2">
                    <span className={labelClass}>{t.mode}</span>
                    <select name="mode" defaultValue={bot.BotSetting?.mode || 'VOICE'} className={fieldClass}>
                      <option value="VOICE">VOICE</option>
                    </select>
                    <span className="text-sm text-white/38">{t.modeVoiceHint}</span>
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

                  <label className="block space-y-2 lg:col-span-2">
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
              </div>

              <div className="flex justify-end">
                <button type="submit" className={primaryButton}>
                  {t.saveGeneral}
                </button>
              </div>
            </form>
          </div>

          <div className="min-w-0 space-y-5">
            <div className={softCard + ' p-5 sm:p-6'}>
              <SectionHeader eyebrow={t.bindingStatus} title={isBound ? currentBoundGuildName : t.noBinding} body={t.bindRuleBody} />
              <div className="mt-5 space-y-4">
                <InfoRow label={t.selectedServer} value={selectedGuildName} />
                <InfoRow label={t.currentBoundGuild} value={currentBoundGuildName} />
                <InfoRow label={t.runtimeReadiness} value={runtimeReady ? t.runtimeReady : t.runtimeMissing} />
              </div>

              {conflictingSameTypeBot ? (
                <div className="mt-5 rounded-[20px] border border-amber-400/20 bg-amber-500/[0.08] px-4 py-3 text-sm leading-6 text-amber-100">
                  {t.sameTypeConflict}
                </div>
              ) : null}
            </div>

            <div className={softCard + ' p-5 sm:p-6'}>
              <SectionHeader eyebrow={t.readinessTitle} title={t.readinessTitle} body={setupComplete ? t.setupComplete : t.setupIncomplete} />
              <div className="mt-5 space-y-3">
                {readinessRow(t.readinessBound[0], isBound, t.readinessBound[1], t.readinessBound[2])}
                {readinessRow(t.readinessCreate[0], hasCreateChannel, t.readinessCreate[1], t.readinessCreate[2])}
                {readinessRow(t.readinessTemp[0], hasTempCategory, t.readinessTemp[1], t.readinessTemp[2])}
                {readinessRow(t.readinessPanel[0], hasPanelChannel, t.readinessPanel[1], t.readinessPanel[2])}
                {readinessRow(t.readinessLogs[0], hasLogsChannel, t.readinessLogs[1], t.readinessLogs[2])}
                {readinessRow(t.readinessImage[0], hasPanelImage, t.readinessImage[1], t.readinessImage[2])}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="mx-auto max-w-[1640px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="relative overflow-hidden rounded-[36px] border border-white/6 bg-[#06030f] p-3 shadow-[0_30px_140px_rgba(27,12,69,0.4)] sm:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(145,92,255,0.14),transparent_34%),radial-gradient(circle_at_20%_50%,rgba(80,43,165,0.11),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent_18%)]" />
        <div
          className={
            'relative grid gap-6 ' +
            (isAr ? 'xl:grid-cols-[minmax(0,1fr)_290px]' : 'xl:grid-cols-[290px_minmax(0,1fr)]')
          }
        >
          {isAr ? (
            <>
              {main}
              {sidebar}
            </>
          ) : (
            <>
              {sidebar}
              {main}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
