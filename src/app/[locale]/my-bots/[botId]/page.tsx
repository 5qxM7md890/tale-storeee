
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
        workspaceBody: 'الأيقونة، البانر، اسم وحالة البوت — المعاينة فورية داخل الصفحة والحفظ يطبّق على هذا البوت نفسه.',
        overviewTitle: 'نظرة عامة',
        overviewBody: 'ملخص هادئ للحالة، الربط، والجاهزية بدون ضجيج بصري.',
        generalTitle: 'عام',
        generalBody: 'السيرفر، القنوات، اللغة، وجهوزية هذا البوت ضمن مساحة منظمة وهادئة.',
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
        inviteUnavailable: 'الرابط غير متوفر',
        uploadOrUrl: 'يمكنك استخدام الرابط أو الرفع المباشر',
        streamingEnabled: 'مفعّل',
        streamingDisabled: 'غير مفعّل',
        memberListPreview: 'معاينة قائمة الأعضاء',
        profilePreview: 'معاينة الملف الشخصي',
        panelPreviewLabel: 'معاينة صورة اللوحة',
        saveNow: 'احفظ التخصيص',
        previewAssets: 'الأيقونة',
        previewBanner: 'البانر',
        previewPanel: 'اللوحة',
        shortId: 'المعرّف المختصر',
        boundState: 'الحالة',
        setupSection: 'إعدادات التشغيل',
        setupSectionBody: 'قنوات التشغيل وحد المستخدمين الافتراضي لهذا البوت.',
        serverSection: 'ربط السيرفر',
        serverSectionBody: 'اختر السيرفر من داخل صفحة هذا البوت وحدّث الربط مباشرة.',
        essentials: 'الأساسيات',
        summaryLabel: 'الملخص',
        presenceLabel: 'الحضور',
        availability: 'حالة البوت'
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
        workspaceBody: 'Avatar, banner, bot name, and presence — preview updates inside the page and saves apply to this bot instance only.',
        overviewTitle: 'Overview',
        overviewBody: 'A calm summary of status, binding, and readiness without dashboard noise.',
        generalTitle: 'General',
        generalBody: 'Server selection, channels, language, and readiness in a structured editor workspace.',
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
        runtimeMissing: 'Some core values are missing',
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
        selectServerHint: 'Selection, save, and binding are specific to this bot instance.',
        bindButton: 'Bind to selected server',
        bindRuleTitle: 'Binding rule',
        bindRuleBody: 'Different bot types can share the same server, but the same bot type cannot be duplicated on one server.',
        sameTypeConflict: 'A bot of the same type is already linked to this server.',
        mode: 'Mode',
        language: 'Language',
        createChannel: 'Create channel',
        tempCategory: 'Temp category',
        panelChannel: 'Panel channel',
        logsChannel: 'Logs channel',
        defaultUserLimit: 'Default user limit',
        quickActions: 'Quick actions',
        quickActionsBody: 'The most important actions for this bot, kept compact.',
        readinessTitle: 'Readiness checklist',
        readinessBound: ['Server binding', 'This bot is linked to a valid server.', 'This bot still needs a linked server.'],
        readinessCreate: ['Create channel', 'createChannel is configured.', 'createChannel is missing.'],
        readinessTemp: ['Temp category', 'tempCategory is configured.', 'tempCategory is missing.'],
        readinessPanel: ['Panel channel', 'panelChannel is configured.', 'panelChannel is missing.'],
        readinessLogs: ['Logs channel', 'logsChannel is configured.', 'logsChannel is missing.'],
        readinessImage: ['Panel image', 'The panel image is configured.', 'The panel image is missing.'],
        readyBadge: 'Ready',
        missingBadge: 'Missing',
        currentBoundGuild: 'Currently bound server',
        noPreview: 'No preview yet',
        noticeBindSuccess: 'Binding updated',
        noticeBindSuccessBody: 'The bot was linked to the selected server successfully.',
        noticeMissingServer: 'No server selected',
        noticeMissingServerBody: 'Select a server first, then try again.',
        noticeBindError: 'Binding failed',
        noticeBindErrorBody: 'The binding could not be saved right now. Review the selected server and try again.',
        noticeSaveSuccess: 'Settings saved',
        noticeSaveSuccessBody: 'Runtime settings were updated successfully.',
        noticeSaveError: 'Settings could not be saved',
        noticeSaveErrorBody: 'Review the values and try again.',
        noticeAppearanceSuccess: 'Customization saved',
        noticeAppearanceSuccessBody: 'Bot customization was updated successfully.',
        noticeAppearanceError: 'Customization failed',
        noticeAppearanceErrorBody: 'Review the assets and values, then try again.',
        inviteUnavailable: 'Invite link unavailable',
        uploadOrUrl: 'You can use a direct URL or upload a file',
        streamingEnabled: 'Enabled',
        streamingDisabled: 'Disabled',
        memberListPreview: 'Member List Preview',
        profilePreview: 'Profile Preview',
        panelPreviewLabel: 'Panel Image Preview',
        saveNow: 'Save Customization',
        previewAssets: 'Avatar',
        previewBanner: 'Banner',
        previewPanel: 'Panel',
        shortId: 'Short ID',
        boundState: 'State',
        setupSection: 'Runtime Setup',
        setupSectionBody: 'Runtime channel values and default user limit for this bot.',
        serverSection: 'Server Binding',
        serverSectionBody: 'Choose the server inside this bot page and update binding directly.',
        essentials: 'Essentials',
        summaryLabel: 'Summary',
        presenceLabel: 'Presence',
        availability: 'Bot Status'
      };
}

function IconChevron() {
  return (
    <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18l6-6-6-6"></path>
    </svg>
  );
}

function IconOverview() {
  return (
    <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.5 12 4l9 6.5"></path>
      <path d="M5 9.5V20h14V9.5"></path>
    </svg>
  );
}

function IconCustomize() {
  return (
    <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 7H8"></path>
      <path d="M20 12H8"></path>
      <path d="M20 17H8"></path>
      <path d="M4 7h.01"></path>
      <path d="M4 12h.01"></path>
      <path d="M4 17h.01"></path>
    </svg>
  );
}

function IconGeneral() {
  return (
    <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19h16"></path>
      <path d="M8 19V9"></path>
      <path d="M16 19V5"></path>
      <path d="M12 19v-4"></path>
    </svg>
  );
}

function TitleIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="6" width="16" height="10" rx="2"></rect>
      <path d="M8 16v2"></path>
      <path d="M16 16v2"></path>
      <path d="M9 10h.01"></path>
      <path d="M15 10h.01"></path>
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V7.5A1.5 1.5 0 0 1 4.5 6H8l2-3h4l2 3h3.5A1.5 1.5 0 0 1 21 7.5V19a2 2 0 0 1-2 2z"></path>
      <path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
    </svg>
  );
}

function formatShortId(id: string) {
  return `#${id.slice(-6)}`;
}

function ReadyBadge({ok, readyText, missingText}: {ok: boolean; readyText: string; missingText: string}) {
  return <span className={cx('status-badge', ok ? 'is-ready' : 'is-missing')}>{ok ? readyText : missingText}</span>;
}

function ReadinessList({
  items,
  t
}: {
  items: Array<{label: string; ok: boolean; readyBody: string; missingBody: string}>;
  t: ReturnType<typeof getText>;
}) {
  return (
    <div className="readiness-list">
      {items.map((item) => (
        <div key={item.label} className="ready-row">
          <div className="ready-copy">
            <p>{item.label}</p>
            <span>{item.ok ? item.readyBody : item.missingBody}</span>
          </div>
          <ReadyBadge ok={item.ok} readyText={t.readyBadge} missingText={t.missingBadge} />
        </div>
      ))}
    </div>
  );
}


function SidebarShell({
  botId,
  displayName,
  avatarImageUrl,
  bannerImageUrl,
  productName,
  activeTab,
  tabs,
  selectedGuildName
}: {
  botId: string;
  displayName: string;
  avatarImageUrl: string;
  bannerImageUrl: string;
  productName: string;
  activeTab: TabKey;
  tabs: Array<{key: TabKey; title: string; desc: string}>;
  selectedGuildName: string;
}) {
  const iconFor = (key: TabKey) => {
    if (key === 'overview') return <IconOverview />;
    if (key === 'general') return <IconGeneral />;
    return <IconCustomize />;
  };

  return (
    <aside className="bm-sidebar">
      <div className="bm-sidebar-cover">
        {bannerImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerImageUrl} alt={displayName} className="bm-sidebar-cover-image" />
        ) : (
          <div className="bm-sidebar-cover-glow" />
        )}
      </div>

      <div className="bm-sidebar-profile">
        <div className="bm-avatar bm-avatar-lg">
          {avatarImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarImageUrl} alt={displayName} className="bm-avatar-image" />
          ) : (
            <span>{displayName.slice(0, 1).toUpperCase()}</span>
          )}
        </div>

        <div className="bm-sidebar-name">{displayName}</div>
        <p className="bm-sidebar-meta">{productName}</p>
        <p className="bm-sidebar-meta bm-sidebar-server">{selectedGuildName}</p>
        <p className="bm-sidebar-id">#{botId.slice(-6)}</p>
      </div>

      <nav className="bm-sidebar-nav">
        {tabs.map((tab) => (
          <Link key={tab.key} href={tabHref(botId, tab.key)} className={cx('bm-tab', activeTab === tab.key && 'is-active')}>
            <span className="bm-tab-main">
              {iconFor(tab.key)}
              <span>{tab.title}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="bm-sidebar-foot">
        <span>{productName}</span>
        <span>{formatShortId(botId)}</span>
      </div>
    </aside>
  );
}

function PreviewPane({
  botId,
  displayName,
  avatarImageUrl,
  bannerImageUrl,
  panelImageUrl,
  statusText,
  activityType,
  selectedGuildName,
  currentBoundGuildName,
  inviteReady,
  isBound,
  t
}: {
  botId: string;
  displayName: string;
  avatarImageUrl: string;
  bannerImageUrl: string;
  panelImageUrl: string;
  statusText: string;
  activityType: string;
  selectedGuildName: string;
  currentBoundGuildName: string;
  inviteReady: boolean;
  isBound: boolean;
  t: ReturnType<typeof getText>;
}) {
  return (
    <aside className="bm-preview">
      <div className="bm-preview-pane">
        <div className="bm-preview-eyebrow">{t.previewTitle}</div>

        <div className="bm-preview-surface">
          <div className="bm-preview-banner">
            {bannerImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerImageUrl} alt={displayName} className="bm-preview-banner-image" />
            ) : null}
          </div>

          <div className="bm-preview-profile">
            <div className="bm-avatar bm-avatar-md">
              {avatarImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarImageUrl} alt={displayName} className="bm-avatar-image" />
              ) : (
                <span>{displayName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>

            <div className="bm-preview-copy">
              <h3>{displayName}</h3>
              <p>{formatShortId(botId)}</p>
            </div>
          </div>

          <div className="bm-preview-presence">
            <div className="bm-preview-presence-title">{formatStatus(activityType)}</div>
            <p>{statusText || t.notSet}</p>
          </div>

          <div className="bm-preview-list">
            <div className="bm-preview-row">
              <span>{t.selectedServer}</span>
              <strong>{selectedGuildName}</strong>
            </div>
            <div className="bm-preview-row">
              <span>{t.bindingStatus}</span>
              <strong>{isBound ? currentBoundGuildName : t.noBinding}</strong>
            </div>
            <div className="bm-preview-row">
              <span>{t.inviteStatus}</span>
              <strong>{inviteReady ? t.inviteReady : t.inviteMissing}</strong>
            </div>
          </div>

          <div className="bm-preview-panel">
            <div className="bm-preview-panel-label">{t.panelPreview}</div>
            <div className="bm-preview-panel-frame">
              {panelImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={panelImageUrl} alt={t.panelPreview} className="bm-preview-panel-image" />
              ) : (
                <div className="bm-preview-panel-empty">{t.panelImage}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
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
  const statusLabel = formatStatus(bot.status);
  const planLabel = bot.Product?.name || t.notSet;
  const planPeriod = bot.PricingOption?.periodMonths
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

  const titleByTab = {
    overview: {title: t.overviewTitle, body: t.overviewBody},
    customize: {title: t.workspaceTitle, body: t.workspaceBody},
    general: {title: t.generalTitle, body: t.generalBody}
  }[activeTab];

  const readinessItems = [
    {label: t.readinessBound[0], ok: isBound, readyBody: t.readinessBound[1], missingBody: t.readinessBound[2]},
    {label: t.readinessCreate[0], ok: hasCreateChannel, readyBody: t.readinessCreate[1], missingBody: t.readinessCreate[2]},
    {label: t.readinessTemp[0], ok: hasTempCategory, readyBody: t.readinessTemp[1], missingBody: t.readinessTemp[2]},
    {label: t.readinessPanel[0], ok: hasPanelChannel, readyBody: t.readinessPanel[1], missingBody: t.readinessPanel[2]},
    {label: t.readinessLogs[0], ok: hasLogsChannel, readyBody: t.readinessLogs[1], missingBody: t.readinessLogs[2]},
    {label: t.readinessImage[0], ok: hasPanelImage, readyBody: t.readinessImage[1], missingBody: t.readinessImage[2]}
  ];

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="bm-fullscreen-root">
      <div className="bm-shell">
        <SidebarShell
          botId={bot.id}
          displayName={displayName}
          avatarImageUrl={avatarImageUrl}
          bannerImageUrl={bannerImageUrl}
          productName={planLabel}
          activeTab={activeTab}
          tabs={tabs}
          selectedGuildName={selectedGuildName}
        />

        <main className="bm-editor">
          <div className="bm-editor-frame">
            <div className="bm-editor-header">
              <div className="bm-editor-header-main">
                <div className="bm-editor-eyebrow">{tabs.find((tab) => tab.key === activeTab)?.title}</div>
                <h1>{titleByTab.title}</h1>
                <p>{titleByTab.body}</p>
              </div>

              <div className="bm-header-actions">
                {bot.inviteUrl ? (
                  <a href={bot.inviteUrl} target="_blank" rel="noreferrer" className="bm-action-btn">
                    {t.invite}
                  </a>
                ) : null}
                {activeTab === 'customize' ? (
                  <Link href={tabHref(bot.id, 'general')} className="bm-action-btn">
                    {t.openSetup}
                  </Link>
                ) : (
                  <Link href={tabHref(bot.id, 'customize')} className="bm-action-btn">
                    {t.tabs.customize.title}
                  </Link>
                )}
              </div>
            </div>

            {notice ? (
              <div className={cx('bm-notice', notice.tone)}>
                <strong>{notice.title}</strong>
                <span>{notice.body}</span>
              </div>
            ) : null}

            {activeTab === 'customize' ? (
              <form action={saveBotAppearanceAction} encType="multipart/form-data" className="bm-form-sheet">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="botId" value={bot.id} />
                <input type="hidden" name="returnTab" value="customize" />

                <section className="bm-section">
                  <div className="bm-section-head">
                    <h3>{t.botIdentity}</h3>
                    <p>{t.workspaceBody}</p>
                  </div>

                  <div className="bm-field-grid">
                    <div className="bm-field">
                      <label htmlFor="displayName">{t.displayName}</label>
                      <input id="displayName" className="bm-input" name="displayName" defaultValue={displayName} />
                    </div>

                    <div className="bm-field">
                      <label htmlFor="activityType">{t.activityType}</label>
                      <select id="activityType" className="bm-select" name="activityType" defaultValue={activityType}>
                        <option value="PLAYING">PLAYING</option>
                        <option value="STREAMING">STREAMING</option>
                        <option value="LISTENING">LISTENING</option>
                        <option value="WATCHING">WATCHING</option>
                        <option value="COMPETING">COMPETING</option>
                      </select>
                    </div>

                    <div className="bm-field bm-field-full">
                      <label htmlFor="statusText">{t.statusText}</label>
                      <input id="statusText" className="bm-input" name="statusText" defaultValue={statusText} placeholder={t.statusText} />
                    </div>
                  </div>

                  <div className="bm-presence-strip" style={{marginTop: '14px'}}>
                    <div className="bm-presence-box">
                      <strong>{t.streamingOption}</strong>
                      <p>{activityType === 'STREAMING' ? t.streamingEnabled : t.streamingDisabled}</p>
                    </div>
                    <div className="bm-presence-box">
                      <strong>{t.activityType}</strong>
                      <p>{t.streamingHint}</p>
                    </div>
                  </div>
                </section>

                <section className="bm-section">
                  <div className="bm-section-head">
                    <h3>{t.mediaAssets}</h3>
                    <p>{t.mediaAssetsBody}</p>
                  </div>

                  <div className="bm-asset-list">
                    <div className="bm-asset-row">
                      <div className="bm-asset-copy">
                        <strong>{t.avatarImage}</strong>
                        <span>{t.uploadOrUrl}</span>
                      </div>
                      <div className="bm-asset-controls">
                        <input
                          type="url"
                          className="bm-input"
                          name="avatarImageUrl"
                          defaultValue={avatarImageUrl}
                          placeholder="https://..."
                        />
                        <input className="bm-file" type="file" name="avatarImageFile" accept="image/*" />
                      </div>
                    </div>

                    <div className="bm-asset-row">
                      <div className="bm-asset-copy">
                        <strong>{t.bannerImage}</strong>
                        <span>{t.uploadOrUrl}</span>
                      </div>
                      <div className="bm-asset-controls">
                        <input
                          type="url"
                          className="bm-input"
                          name="bannerImageUrl"
                          defaultValue={bannerImageUrl}
                          placeholder="https://..."
                        />
                        <input className="bm-file" type="file" name="bannerImageFile" accept="image/*" />
                      </div>
                    </div>

                    <div className="bm-asset-row">
                      <div className="bm-asset-copy">
                        <strong>{t.panelImage}</strong>
                        <span>{t.uploadOrUrl}</span>
                      </div>
                      <div className="bm-asset-controls">
                        <input
                          type="url"
                          className="bm-input"
                          name="panelImageUrl"
                          defaultValue={panelImageUrl}
                          placeholder="https://..."
                        />
                        <input className="bm-file" type="file" name="panelImageFile" accept="image/*" />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="bm-sheet-actions">
                  <span className="bm-sheet-actions-note">{t.previewBody}</span>
                  <button className="bm-primary-btn" type="submit">
                    <CameraIcon />
                    <span>{t.saveAppearance}</span>
                  </button>
                </div>
              </form>
            ) : null}

            {activeTab === 'overview' ? (
              <div className="bm-sheet">
                <section className="bm-section">
                  <div className="bm-section-head">
                    <h3>{t.summaryLabel}</h3>
                    <p>{t.overviewBody}</p>
                  </div>

                  <div className="bm-overview-lines">
                    <div className="bm-overview-line">
                      <div>
                        <strong>{t.botIdentity}</strong>
                        <span>{displayName}</span>
                      </div>
                      <span className="status-badge is-missing">{formatShortId(bot.id)}</span>
                    </div>

                    <div className="bm-overview-line">
                      <div>
                        <strong>{t.inviteStatus}</strong>
                        <span>{inviteReady ? t.inviteReady : t.inviteMissing}</span>
                      </div>
                      <ReadyBadge ok={inviteReady} readyText={t.readyBadge} missingText={t.missingBadge} />
                    </div>

                    <div className="bm-overview-line">
                      <div>
                        <strong>{t.bindingStatus}</strong>
                        <span>{isBound ? currentBoundGuildName : t.noBinding}</span>
                      </div>
                      <ReadyBadge ok={isBound} readyText={t.readyBadge} missingText={t.missingBadge} />
                    </div>

                    <div className="bm-overview-line">
                      <div>
                        <strong>{t.selectedServer}</strong>
                        <span>{selectedGuildName}</span>
                      </div>
                      <span className="status-badge is-missing">{selectedGuildId || t.noServer}</span>
                    </div>

                    <div className="bm-overview-line">
                      <div>
                        <strong>{t.runtimeReadiness}</strong>
                        <span>{runtimeReady ? t.runtimeReady : t.runtimeMissing}</span>
                      </div>
                      <ReadyBadge ok={runtimeReady} readyText={t.readyBadge} missingText={t.missingBadge} />
                    </div>

                    <div className="bm-overview-line">
                      <div>
                        <strong>{t.currentPlan}</strong>
                        <span>{planLabel} — {planPeriod}</span>
                      </div>
                      <span className="status-badge is-missing">{statusLabel}</span>
                    </div>
                  </div>

                  <div className="bm-overview-actions">
                    <Link href={tabHref(bot.id, 'customize')} className="bm-secondary-btn">
                      {t.tabs.customize.title}
                    </Link>
                    <Link href={tabHref(bot.id, 'general')} className="bm-secondary-btn">
                      {t.tabs.general.title}
                    </Link>
                    {bot.inviteUrl ? (
                      <a href={bot.inviteUrl} target="_blank" rel="noreferrer" className="bm-primary-btn">
                        {t.invite}
                      </a>
                    ) : null}
                  </div>
                </section>

                <section className="bm-section">
                  <div className="bm-section-head">
                    <h3>{t.readinessTitle}</h3>
                    <p>{setupComplete ? t.setupComplete : t.setupIncomplete}</p>
                  </div>
                  <ReadinessList items={readinessItems} t={t} />
                </section>
              </div>
            ) : null}

            {activeTab === 'general' ? (
              <div className="bm-sheet">
                <section className="bm-section">
                  <div className="bm-section-head">
                    <h3>{t.serverSection}</h3>
                    <p>{t.serverSectionBody}</p>
                  </div>

                  <form action={bindBotToSelectedServerAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="botId" value={bot.id} />
                    <input type="hidden" name="returnTab" value="general" />

                    <div className="bm-bind-grid">
                      <div className="bm-field">
                        <label htmlFor="selectedGuildId">{t.selectServer}</label>
                        <select id="selectedGuildId" name="selectedGuildId" defaultValue={selectedGuildId} className="bm-select">
                          {!selectedGuildId ? <option value="">{t.noServer}</option> : null}
                          {guildOptions.map((guild) => (
                            <option key={guild.id} value={guild.id}>
                              {guild.name} — {guild.id}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button type="submit" className="bm-primary-btn">
                        {t.saveBinding}
                      </button>
                    </div>

                    <div className="bm-rule-note">
                      {t.bindRuleBody}
                      {conflictingSameTypeBot ? ` ${t.sameTypeConflict}` : ''}
                    </div>
                  </form>
                </section>

                <section className="bm-section">
                  <div className="bm-section-head">
                    <h3>{t.setupSection}</h3>
                    <p>{t.setupSectionBody}</p>
                  </div>

                  <form action={saveBotSetupAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="botId" value={bot.id} />
                    <input type="hidden" name="returnTab" value="general" />

                    <div className="bm-form-grid">
                      <div className="bm-field">
                        <label htmlFor="mode">{t.mode}</label>
                        <select id="mode" name="mode" defaultValue={bot.BotSetting?.mode || 'VOICE'} className="bm-select">
                          <option value="VOICE">VOICE</option>
                        </select>
                      </div>

                      <div className="bm-field">
                        <label htmlFor="language">{t.language}</label>
                        <select id="language" name="language" defaultValue={bot.BotSetting?.language || 'en'} className="bm-select">
                          <option value="en">English</option>
                          <option value="ar">العربية</option>
                        </select>
                      </div>

                      <div className="bm-field">
                        <label htmlFor="createChannel">{t.createChannel}</label>
                        <input
                          id="createChannel"
                          name="createChannel"
                          defaultValue={bot.BotSetting?.createChannel || ''}
                          className="bm-input"
                          placeholder="123456789012345678"
                          inputMode="numeric"
                        />
                      </div>

                      <div className="bm-field">
                        <label htmlFor="tempCategory">{t.tempCategory}</label>
                        <input
                          id="tempCategory"
                          name="tempCategory"
                          defaultValue={bot.BotSetting?.tempCategory || ''}
                          className="bm-input"
                          placeholder="123456789012345678"
                          inputMode="numeric"
                        />
                      </div>

                      <div className="bm-field">
                        <label htmlFor="panelChannel">{t.panelChannel}</label>
                        <input
                          id="panelChannel"
                          name="panelChannel"
                          defaultValue={bot.BotSetting?.panelChannel || ''}
                          className="bm-input"
                          placeholder="123456789012345678"
                          inputMode="numeric"
                        />
                      </div>

                      <div className="bm-field">
                        <label htmlFor="logsChannel">{t.logsChannel}</label>
                        <input
                          id="logsChannel"
                          name="logsChannel"
                          defaultValue={bot.BotSetting?.logsChannel || ''}
                          className="bm-input"
                          placeholder="123456789012345678"
                          inputMode="numeric"
                        />
                      </div>

                      <div className="bm-field bm-field-full">
                        <label htmlFor="defaultUserLimit">{t.defaultUserLimit}</label>
                        <input
                          id="defaultUserLimit"
                          type="number"
                          min="0"
                          name="defaultUserLimit"
                          defaultValue={bot.BotSetting?.defaultUserLimit ?? 0}
                          className="bm-input"
                        />
                      </div>
                    </div>

                    <div className="bm-sheet-actions">
                      <span className="bm-sheet-actions-note">{t.generalSettingsBody}</span>
                      <button type="submit" className="bm-primary-btn">
                        {t.saveGeneral}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="bm-section">
                  <div className="bm-section-head">
                    <h3>{t.readinessTitle}</h3>
                    <p>{setupComplete ? t.setupComplete : t.setupIncomplete}</p>
                  </div>
                  <ReadinessList items={readinessItems} t={t} />
                </section>
              </div>
            ) : null}
          </div>
        </main>

        <PreviewPane
          botId={bot.id}
          displayName={displayName}
          avatarImageUrl={avatarImageUrl}
          bannerImageUrl={bannerImageUrl}
          panelImageUrl={panelImageUrl}
          statusText={statusText}
          activityType={activityType}
          selectedGuildName={selectedGuildName}
          currentBoundGuildName={currentBoundGuildName}
          inviteReady={inviteReady}
          isBound={isBound}
          t={t}
        />

        <Link href="/my-bots" className="bm-floating-back">
          <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
          <span>{t.back}</span>
        </Link>
      </div>
    </div>
  );
}
