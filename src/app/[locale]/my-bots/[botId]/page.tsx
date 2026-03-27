
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
  subtitle,
  activeTab,
  tabs,
  selectedGuildName
}: {
  botId: string;
  displayName: string;
  avatarImageUrl: string;
  bannerImageUrl: string;
  productName: string;
  subtitle: string;
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
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="cover">
          {bannerImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerImageUrl} alt={displayName} className="cover-image" />
          ) : null}
        </div>

        <div className="profile">
          <div className="avatar">
            {avatarImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarImageUrl} alt={displayName} className="avatar-image" />
            ) : (
              <span>{displayName.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="brand">{displayName}</div>
          <div className="subtitle">{productName}</div>
          <div className="mini-note">{selectedGuildName}</div>
          <div className="mini-note">{formatShortId(botId)}</div>
        </div>

        <nav className="nav">
          {tabs.map((tab, index) => (
            <div key={tab.key}>
              {tab.key === 'general' ? <div className="nav-section">{subtitle}</div> : null}
              <Link href={tabHref(botId, tab.key)} className={cx('item', activeTab === tab.key && 'active')}>
                <span className="item-main">
                  {iconFor(tab.key)}
                  <span>{tab.title}</span>
                </span>
                {tab.key === 'customize' || activeTab === tab.key ? <IconChevron /> : null}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <Link href="/my-bots" className="circle-btn" aria-label="back">
          <svg className="mini-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </Link>
        <div className="circle-btn" aria-hidden="true">
          <svg className="mini-icon" viewBox="0 0 24 24">
            <path d="M21 12A9 9 0 1 1 8 3.5"></path>
            <path d="M22 3 12 13"></path>
            <path d="M16 3h6v6"></path>
          </svg>
        </div>
      </div>
    </aside>
  );
}

function PortStyles() {
  return (
    <style>{`
      .bm-port-shell {
        --bg: #06060d;
        --bg-2: #090812;
        --panel: rgba(13, 10, 24, 0.84);
        --panel-2: rgba(19, 14, 31, 0.92);
        --stroke: rgba(115, 97, 172, 0.2);
        --stroke-2: rgba(164, 149, 221, 0.26);
        --soft: rgba(180, 166, 236, 0.16);
        --muted: #8a829f;
        --text: #ece7ff;
        --text-dim: #b7aecf;
        --highlight: #d7d0ef;
        --green: #45d38a;
        --shadow: 0 0 0 1px rgba(130, 114, 187, 0.12), 0 26px 60px rgba(0, 0, 0, 0.35);
        position: relative;
        overflow: hidden;
        border-radius: 30px;
        border: 1px solid rgba(119, 101, 173, 0.12);
        background:
          radial-gradient(ellipse at top center, rgba(62, 43, 124, 0.18), transparent 42%),
          radial-gradient(ellipse at 32% 105%, rgba(63, 40, 111, 0.18), transparent 30%),
          linear-gradient(180deg, rgba(12, 9, 20, 0.97), rgba(5, 5, 10, 1));
        color: var(--text);
        box-shadow: 0 30px 110px rgba(0, 0, 0, 0.45);
      }

      .bm-port-shell::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            90deg,
            rgba(48, 34, 88, 0) 0%,
            rgba(48, 34, 88, 0.12) 8%,
            rgba(48, 34, 88, 0) 15%,
            rgba(34, 27, 76, 0.07) 28%,
            rgba(48, 34, 88, 0) 34%,
            rgba(48, 34, 88, 0.12) 47%,
            rgba(48, 34, 88, 0) 54%,
            rgba(48, 34, 88, 0.08) 67%,
            rgba(48, 34, 88, 0) 74%,
            rgba(48, 34, 88, 0.11) 87%,
            rgba(48, 34, 88, 0) 100%
          );
        opacity: 0.9;
        pointer-events: none;
        mix-blend-mode: screen;
      }

      .bm-port-shell::after {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 18% 12%, rgba(140, 120, 220, 0.08), transparent 20%),
          radial-gradient(circle at 74% 18%, rgba(140, 120, 220, 0.07), transparent 18%),
          radial-gradient(circle at 30% 75%, rgba(140, 120, 220, 0.05), transparent 20%);
        pointer-events: none;
      }

      .bm-port-shell .app {
        position: relative;
        min-height: 860px;
        display: grid;
        grid-template-columns: 220px 1fr;
        background: linear-gradient(180deg, rgba(5, 5, 10, 0.28), rgba(3, 3, 7, 0.12));
      }

      .bm-port-shell .sidebar {
        position: relative;
        border-left: 1px solid rgba(119, 101, 173, 0.16);
        background: linear-gradient(180deg, rgba(18, 13, 28, 0.88), rgba(12, 9, 22, 0.93));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-width: 0;
        z-index: 1;
      }

      .bm-port-shell .sidebar::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(ellipse at top center, rgba(145, 128, 203, 0.09), transparent 28%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.015), transparent 12%, transparent 88%, rgba(255, 255, 255, 0.015));
        pointer-events: none;
      }

      .bm-port-shell .sidebar-top {
        padding-top: 6px;
      }

      .bm-port-shell .cover {
        height: 112px;
        position: relative;
        overflow: hidden;
        border-bottom: 1px solid rgba(119, 101, 173, 0.14);
        background:
          radial-gradient(circle at 65% 38%, rgba(215, 206, 239, 0.32), rgba(215, 206, 239, 0.07) 12%, transparent 32%),
          radial-gradient(circle at 28% 20%, rgba(183, 173, 214, 0.88), rgba(152, 136, 198, 0.45) 22%, transparent 42%),
          radial-gradient(circle at 78% -10%, rgba(236, 231, 255, 0.7), rgba(145, 124, 194, 0.22) 36%, transparent 58%),
          radial-gradient(circle at 88% 95%, rgba(177, 166, 217, 0.44), transparent 20%),
          linear-gradient(115deg, rgba(18, 14, 28, 1) 0%, rgba(51, 43, 79, 0.94) 34%, rgba(15, 12, 25, 1) 74%);
      }

      .bm-port-shell .cover-image {
        position: absolute;
        inset: 0;
        height: 100%;
        width: 100%;
        object-fit: cover;
        opacity: 0.95;
      }

      .bm-port-shell .profile {
        position: relative;
        margin-top: -18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 0 18px 14px;
        text-align: center;
      }

      .bm-port-shell .avatar,
      .bm-port-shell .mini-avatar {
        position: relative;
        display: grid;
        place-items: center;
        color: white;
        font-weight: 700;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      }

      .bm-port-shell .avatar {
        width: 68px;
        height: 68px;
        border-radius: 22px;
        border: 1px solid rgba(215, 208, 239, 0.16);
        background:
          radial-gradient(circle at 32% 26%, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.25) 22%, transparent 24%),
          radial-gradient(circle at 56% 45%, rgba(210, 204, 231, 0.9), rgba(120, 99, 169, 0.65) 44%, rgba(22, 18, 32, 0.95) 78%),
          linear-gradient(180deg, #30274c 0%, #171221 100%);
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        font-size: 18px;
        overflow: hidden;
      }

      .bm-port-shell .avatar-image {
        height: 100%;
        width: 100%;
        object-fit: cover;
      }

      .bm-port-shell .avatar::after,
      .bm-port-shell .mini-avatar::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--green);
        border: 3px solid #171221;
        bottom: 2px;
        left: 3px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04);
      }

      .bm-port-shell .brand {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.03em;
        line-height: 1;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bm-port-shell .subtitle {
        color: rgba(235, 229, 255, 0.84);
        font-weight: 700;
        font-size: 14px;
        line-height: 1.15;
      }

      .bm-port-shell .mini-note {
        color: var(--muted);
        font-size: 11px;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bm-port-shell .nav {
        padding: 22px 12px 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .bm-port-shell .nav-section {
        font-size: 12px;
        color: #7b738f;
        padding: 10px 14px 6px;
      }

      .bm-port-shell .item {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: space-between;
        padding: 11px 14px;
        min-height: 44px;
        border-radius: 12px;
        color: #a39bb7;
        text-decoration: none;
        border: 1px solid transparent;
        background: transparent;
        transition: 0.2s ease;
        font-size: 14px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.01);
      }

      .bm-port-shell .item:hover {
        background: rgba(255, 255, 255, 0.03);
        color: #d8d1eb;
        border-color: rgba(154, 137, 204, 0.08);
      }

      .bm-port-shell .item.active {
        background: linear-gradient(180deg, rgba(160, 149, 198, 0.32), rgba(136, 124, 176, 0.24));
        border-color: rgba(202, 193, 233, 0.18);
        color: white;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 6px 24px rgba(0, 0, 0, 0.18);
      }

      .bm-port-shell .item-main {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .bm-port-shell .sidebar-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 14px 14px;
        border-top: 1px solid rgba(119, 101, 173, 0.12);
      }

      .bm-port-shell .circle-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 1px solid rgba(165, 151, 212, 0.18);
        background: rgba(255, 255, 255, 0.035);
        display: grid;
        place-items: center;
        color: #a79ebf;
        text-decoration: none;
      }

      .bm-port-shell .main {
        position: relative;
        padding: 42px 54px 34px;
        overflow: hidden;
        z-index: 1;
      }

      .bm-port-shell .main::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 20%);
        pointer-events: none;
      }

      .bm-port-shell .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
        margin: 8px 8px 10px;
      }

      .bm-port-shell .header-copy {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }

      .bm-port-shell .header-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-start;
      }

      .bm-port-shell .title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--highlight);
      }

      .bm-port-shell .title {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: -0.03em;
        margin: 0;
      }

      .bm-port-shell .path {
        color: #8e86a5;
        font-size: 12px;
        font-weight: 500;
        max-width: 760px;
        line-height: 1.6;
      }

      .bm-port-shell .divider {
        height: 1px;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(130, 113, 188, 0.28), rgba(255, 255, 255, 0));
        margin: 14px 0 22px;
        opacity: 0.8;
      }

      .bm-port-shell .top-btn {
        width: auto;
        min-width: 128px;
        height: 42px;
        border-radius: 14px;
        border: 1px solid rgba(197, 189, 225, 0.2);
        background: rgba(255, 255, 255, 0.035);
        color: #f0e9ff;
        font-size: 13px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 18px;
        text-decoration: none;
        transition: 0.2s ease;
      }

      .bm-port-shell .top-btn:hover {
        background: rgba(255, 255, 255, 0.07);
      }

      .bm-port-shell .card {
        background: linear-gradient(180deg, rgba(8, 7, 16, 0.62), rgba(8, 7, 16, 0.55));
        border: 1px solid rgba(128, 111, 182, 0.18);
        border-radius: 26px;
        box-shadow: var(--shadow), inset 0 1px 0 rgba(255, 255, 255, 0.02);
        min-height: 390px;
        padding: 18px 18px 22px;
      }

      .bm-port-shell .editor {
        display: grid;
        grid-template-columns: 174px minmax(0, 1fr) 192px;
        gap: 20px;
        align-items: start;
      }

      .bm-port-shell .display-col,
      .bm-port-shell .preview-stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .bm-port-shell .preview-card,
      .bm-port-shell .profile-card {
        border-radius: 16px;
        background: linear-gradient(180deg, rgba(17, 12, 29, 0.95), rgba(12, 9, 22, 0.98));
        border: 1px solid rgba(132, 114, 188, 0.15);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
        padding: 10px;
      }

      .bm-port-shell .preview-label {
        font-size: 11px;
        color: #9a90b2;
        margin-bottom: 9px;
        font-weight: 600;
        text-align: right;
      }

      .bm-port-shell .small-app {
        height: 52px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.015);
        border: 1px solid rgba(132, 114, 188, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        gap: 10px;
      }

      .bm-port-shell .id {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ebe5ff;
        font-size: 13px;
        font-weight: 700;
        min-width: 0;
      }

      .bm-port-shell .mini-avatar {
        width: 34px;
        height: 34px;
        border-radius: 12px;
        background:
          radial-gradient(circle at 32% 26%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.15) 24%, transparent 25%),
          radial-gradient(circle at 58% 42%, rgba(210, 204, 231, 0.9), rgba(120, 99, 169, 0.55) 44%, rgba(22, 18, 32, 0.95) 78%),
          linear-gradient(180deg, #2d2644 0%, #16111f 100%);
        border: 1px solid rgba(215, 208, 239, 0.14);
        font-size: 12px;
        overflow: hidden;
        flex: none;
      }

      .bm-port-shell .mini-avatar img {
        height: 100%;
        width: 100%;
        object-fit: cover;
      }

      .bm-port-shell .app-chip {
        font-size: 9px;
        color: #d9d2ec;
        padding: 2px 6px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.06);
        margin-left: 2px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .bm-port-shell .profile-frame {
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid rgba(140, 120, 196, 0.14);
        background: rgba(255, 255, 255, 0.015);
      }

      .bm-port-shell .mini-cover {
        height: 62px;
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 64% 36%, rgba(215, 206, 239, 0.34), rgba(215, 206, 239, 0.08) 12%, transparent 34%),
          radial-gradient(circle at 28% 18%, rgba(183, 173, 214, 0.9), rgba(152, 136, 198, 0.45) 20%, transparent 40%),
          radial-gradient(circle at 82% -14%, rgba(236, 231, 255, 0.7), rgba(145, 124, 194, 0.22) 32%, transparent 55%),
          linear-gradient(115deg, rgba(18, 14, 28, 1) 0%, rgba(51, 43, 79, 0.94) 34%, rgba(15, 12, 25, 1) 74%);
      }

      .bm-port-shell .mini-cover img {
        position: absolute;
        inset: 0;
        height: 100%;
        width: 100%;
        object-fit: cover;
      }

      .bm-port-shell .mini-profile-body {
        padding: 0 12px 12px;
        text-align: center;
        position: relative;
      }

      .bm-port-shell .mini-profile-body .mini-avatar {
        margin: -22px auto 8px;
        width: 52px;
        height: 52px;
        border-radius: 16px;
        font-size: 14px;
      }

      .bm-port-shell .mini-profile-name {
        font-size: 13px;
        font-weight: 700;
      }

      .bm-port-shell .mini-profile-handle {
        font-size: 10px;
        color: #8f86a7;
        margin-bottom: 10px;
      }

      .bm-port-shell .status-pill {
        min-height: 40px;
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(59, 48, 96, 0.42), rgba(34, 27, 57, 0.42));
        color: #c9bfdc;
        display: grid;
        place-items: center;
        font-size: 11px;
        border: 1px solid rgba(145, 128, 202, 0.08);
        padding: 8px 10px;
        text-align: center;
      }

      .bm-port-shell .fields {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding-top: 10px;
      }

      .bm-port-shell .field {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .bm-port-shell .field.dual {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .bm-port-shell .label {
        font-size: 12px;
        color: #958cae;
        font-weight: 600;
        text-align: right;
      }

      .bm-port-shell .input,
      .bm-port-shell .select,
      .bm-port-shell .button,
      .bm-port-shell .display-box {
        width: 100%;
        min-height: 44px;
        border-radius: 14px;
        border: 1px solid rgba(126, 108, 181, 0.14);
        background: linear-gradient(180deg, rgba(23, 16, 40, 0.7), rgba(15, 11, 26, 0.78));
        color: #cfc7e5;
        padding: 0 16px;
        font-size: 14px;
        outline: none;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
      }

      .bm-port-shell .input::placeholder {
        color: rgba(207, 199, 229, 0.38);
      }

      .bm-port-shell .select {
        appearance: none;
        background-image:
          linear-gradient(45deg, transparent 50%, #8f86aa 50%),
          linear-gradient(135deg, #8f86aa 50%, transparent 50%);
        background-position: calc(16px) calc(50% - 2px), calc(10px) calc(50% - 2px);
        background-size: 6px 6px, 6px 6px;
        background-repeat: no-repeat;
        padding-left: 32px;
      }

      .bm-port-shell .display-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: stretch;
      }

      .bm-port-shell .display-box {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 10px 8px 16px;
        min-height: 62px;
      }

      .bm-port-shell .display-text {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 3px;
        min-width: 0;
      }

      .bm-port-shell .display-text strong {
        font-size: 13px;
        color: #e8e2fb;
      }

      .bm-port-shell .display-text span {
        font-size: 11px;
        color: #8e86a6;
      }

      .bm-port-shell .banner-box,
      .bm-port-shell .panel-box {
        border-radius: 12px;
        border: 1px solid rgba(147, 132, 197, 0.12);
        overflow: hidden;
        flex: none;
        position: relative;
        background:
          radial-gradient(circle at 64% 36%, rgba(215, 206, 239, 0.34), rgba(215, 206, 239, 0.08) 12%, transparent 34%),
          radial-gradient(circle at 28% 18%, rgba(183, 173, 214, 0.9), rgba(152, 136, 198, 0.45) 20%, transparent 40%),
          radial-gradient(circle at 82% -14%, rgba(236, 231, 255, 0.7), rgba(145, 124, 194, 0.22) 32%, transparent 55%),
          linear-gradient(115deg, rgba(18, 14, 28, 1) 0%, rgba(51, 43, 79, 0.94) 34%, rgba(15, 12, 25, 1) 74%);
      }

      .bm-port-shell .banner-box {
        height: 64px;
        width: 96px;
      }

      .bm-port-shell .panel-box {
        height: 64px;
        width: 96px;
      }

      .bm-port-shell .banner-box img,
      .bm-port-shell .panel-box img {
        height: 100%;
        width: 100%;
        object-fit: cover;
      }

      .bm-port-shell .asset-group {
        border-top: 1px solid rgba(119, 101, 173, 0.14);
        margin-top: 4px;
        padding-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .bm-port-shell .asset-row {
        border-radius: 14px;
        border: 1px solid rgba(126, 108, 181, 0.1);
        background: rgba(255, 255, 255, 0.02);
        padding: 12px;
      }

      .bm-port-shell .asset-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      .bm-port-shell .asset-head div {
        min-width: 0;
      }

      .bm-port-shell .asset-head strong {
        display: block;
        font-size: 13px;
        color: #e8e2fb;
      }

      .bm-port-shell .asset-head span {
        display: block;
        margin-top: 3px;
        font-size: 11px;
        color: #8e86a6;
      }

      .bm-port-shell .asset-inputs {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 190px;
        gap: 10px;
      }

      .bm-port-shell .file-input {
        position: relative;
      }

      .bm-port-shell .file-input input[type='file'] {
        padding: 10px 12px;
        color: #cfc7e5;
      }

      .bm-port-shell .file-input input[type='file']::file-selector-button {
        margin-left: 10px;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.08);
        color: white;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 700;
      }

      .bm-port-shell .presence-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 44px;
        border-radius: 14px;
        border: 1px solid rgba(126, 108, 181, 0.14);
        background: linear-gradient(180deg, rgba(23, 16, 40, 0.7), rgba(15, 11, 26, 0.78));
        padding: 0 14px;
      }

      .bm-port-shell .presence-line strong {
        font-size: 12px;
        color: #e8e2fb;
      }

      .bm-port-shell .presence-line span {
        font-size: 12px;
        color: #9f96b8;
      }

      .bm-port-shell .button-wrap {
        display: flex;
        justify-content: flex-start;
        padding-top: 6px;
      }

      .bm-port-shell .button {
        width: auto;
        padding: 0 22px;
        background: linear-gradient(180deg, rgba(90, 79, 130, 0.55), rgba(62, 52, 93, 0.52));
        border-color: rgba(197, 189, 225, 0.28);
        color: #f0e9ff;
        font-weight: 700;
        letter-spacing: -0.01em;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 26px rgba(0, 0, 0, 0.22);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .bm-port-shell .mini-icon,
      .bm-port-shell .icon {
        width: 18px;
        height: 18px;
        display: inline-block;
        flex: none;
        opacity: 0.95;
      }

      .bm-port-shell .icon {
        width: 24px;
        height: 24px;
      }

      .bm-port-shell svg {
        stroke: currentColor;
        fill: none;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .bm-port-shell .overview-grid,
      .bm-port-shell .general-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 290px;
        gap: 20px;
        align-items: start;
      }

      .bm-port-shell .flow-stack {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .bm-port-shell .flow-section,
      .bm-port-shell .side-pane {
        border-radius: 18px;
        border: 1px solid rgba(126, 108, 181, 0.12);
        background: rgba(255, 255, 255, 0.02);
        padding: 16px;
      }

      .bm-port-shell .section-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 14px;
      }

      .bm-port-shell .section-copy h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        color: #f1edff;
      }

      .bm-port-shell .section-copy p {
        margin: 6px 0 0;
        font-size: 12px;
        line-height: 1.65;
        color: #8f86a6;
      }

      .bm-port-shell .summary-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .bm-port-shell .metric-pill {
        min-width: 140px;
        border-radius: 999px;
        border: 1px solid rgba(126, 108, 181, 0.14);
        background: rgba(255, 255, 255, 0.025);
        padding: 8px 12px;
      }

      .bm-port-shell .metric-pill strong {
        display: block;
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #8f86a6;
      }

      .bm-port-shell .metric-pill span {
        display: block;
        margin-top: 4px;
        font-size: 13px;
        font-weight: 700;
        color: #ece7ff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bm-port-shell .essentials-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .bm-port-shell .line-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        padding: 12px 0;
        border-bottom: 1px solid rgba(119, 101, 173, 0.12);
      }

      .bm-port-shell .line-item:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      .bm-port-shell .line-item:first-child {
        padding-top: 0;
      }

      .bm-port-shell .line-copy {
        min-width: 0;
      }

      .bm-port-shell .line-copy strong {
        display: block;
        font-size: 13px;
        color: #ece7ff;
      }

      .bm-port-shell .line-copy span {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: #8f86a6;
        line-height: 1.65;
        word-break: break-word;
      }

      .bm-port-shell .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 74px;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(126, 108, 181, 0.14);
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }

      .bm-port-shell .status-badge.is-ready {
        border-color: rgba(69, 211, 138, 0.26);
        background: rgba(69, 211, 138, 0.08);
        color: #d7f8e8;
      }

      .bm-port-shell .status-badge.is-missing {
        background: rgba(255, 255, 255, 0.03);
        color: #b7aecf;
      }

      .bm-port-shell .actions-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .bm-port-shell .ghost-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        border-radius: 14px;
        border: 1px solid rgba(197, 189, 225, 0.18);
        background: rgba(255, 255, 255, 0.03);
        color: #f0e9ff;
        font-size: 13px;
        font-weight: 700;
        padding: 0 16px;
        text-decoration: none;
      }

      .bm-port-shell .ghost-btn:hover {
        background: rgba(255, 255, 255, 0.06);
      }

      .bm-port-shell .ghost-btn.primary {
        background: linear-gradient(180deg, rgba(90, 79, 130, 0.55), rgba(62, 52, 93, 0.52));
      }

      .bm-port-shell .side-rail {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .bm-port-shell .rail-block {
        border-radius: 16px;
        border: 1px solid rgba(126, 108, 181, 0.12);
        background: rgba(255, 255, 255, 0.02);
        padding: 14px;
      }

      .bm-port-shell .rail-block h4 {
        margin: 0;
        font-size: 12px;
        color: #9a90b2;
      }

      .bm-port-shell .rail-block p {
        margin: 8px 0 0;
        font-size: 13px;
        color: #ece7ff;
        line-height: 1.6;
        word-break: break-word;
      }

      .bm-port-shell .readiness-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .bm-port-shell .ready-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid rgba(119, 101, 173, 0.12);
      }

      .bm-port-shell .ready-row:first-child {
        padding-top: 0;
      }

      .bm-port-shell .ready-row:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      .bm-port-shell .ready-copy p {
        margin: 0;
        font-size: 13px;
        color: #ece7ff;
      }

      .bm-port-shell .ready-copy span {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        line-height: 1.6;
        color: #8f86a6;
      }

      .bm-port-shell .rule-note {
        border-radius: 14px;
        border: 1px solid rgba(245, 158, 11, 0.22);
        background: rgba(245, 158, 11, 0.08);
        padding: 12px;
        font-size: 12px;
        line-height: 1.65;
        color: #fcdba7;
      }

      .bm-port-shell .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .bm-port-shell .bind-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 180px;
        gap: 10px;
        align-items: end;
      }

      .bm-port-shell .notice {
        margin-bottom: 16px;
        border-radius: 16px;
        border: 1px solid;
        padding: 12px 14px;
      }

      .bm-port-shell .notice strong {
        display: block;
        font-size: 14px;
      }

      .bm-port-shell .notice span {
        display: block;
        margin-top: 4px;
        font-size: 13px;
        opacity: 0.92;
      }

      @media (max-width: 1450px) {
        .bm-port-shell .app {
          grid-template-columns: 210px 1fr;
        }

        .bm-port-shell .editor {
          grid-template-columns: 160px minmax(0, 1fr) 176px;
        }

        .bm-port-shell .main {
          padding: 34px 34px 24px;
        }
      }

      @media (max-width: 1200px) {
        .bm-port-shell .app {
          grid-template-columns: 1fr;
        }

        .bm-port-shell .sidebar {
          order: 2;
          border-left: none;
          border-top: 1px solid rgba(119, 101, 173, 0.16);
        }

        .bm-port-shell .main {
          order: 1;
        }

        .bm-port-shell .editor,
        .bm-port-shell .overview-grid,
        .bm-port-shell .general-grid {
          grid-template-columns: 1fr;
        }

        .bm-port-shell .fields {
          order: 1;
        }

        .bm-port-shell .display-col {
          order: 2;
        }

        .bm-port-shell .preview-stack {
          order: 3;
        }
      }

      @media (max-width: 760px) {
        .bm-port-shell {
          border-radius: 22px;
        }

        .bm-port-shell .main {
          padding: 24px 18px 18px;
        }

        .bm-port-shell .header {
          flex-direction: column;
          align-items: stretch;
        }

        .bm-port-shell .header-copy {
          align-items: flex-start;
        }

        .bm-port-shell .field.dual,
        .bm-port-shell .form-grid,
        .bm-port-shell .asset-inputs,
        .bm-port-shell .bind-row {
          grid-template-columns: 1fr;
        }

        .bm-port-shell .title {
          font-size: 26px;
        }

        .bm-port-shell .card {
          padding: 14px;
          border-radius: 22px;
        }
      }
    `}</style>
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
    <div dir={isAr ? 'rtl' : 'ltr'} className="mx-auto max-w-[1620px] px-2 py-4 sm:px-4 lg:px-6 lg:py-6">
      <PortStyles />
      <div className="bm-port-shell">
        <div className="app">
          <SidebarShell
            botId={bot.id}
            displayName={displayName}
            avatarImageUrl={avatarImageUrl}
            bannerImageUrl={bannerImageUrl}
            productName={planLabel}
            subtitle={t.tabs.general.title}
            activeTab={activeTab}
            tabs={tabs}
            selectedGuildName={selectedGuildName}
          />

          <main className="main">
            <div className="header">
              <div className="header-copy">
                <Link href="/my-bots" className="path">
                  {t.back}
                </Link>
                <div className="title-row">
                  <TitleIcon />
                  <h1 className="title">{titleByTab.title}</h1>
                </div>
                <div className="path">{titleByTab.body}</div>
              </div>

              <div className="header-actions">
                {bot.inviteUrl ? (
                  <a href={bot.inviteUrl} target="_blank" rel="noreferrer" className="top-btn">
                    {t.invite}
                  </a>
                ) : (
                  <span className="top-btn opacity-55">{t.inviteUnavailable}</span>
                )}
                <Link href={tabHref(bot.id, 'general')} className="top-btn">
                  {t.openSetup}
                </Link>
              </div>
            </div>

            <div className="divider"></div>

            {notice ? (
              <div className={cx('notice', notice.tone)}>
                <strong>{notice.title}</strong>
                <span>{notice.body}</span>
              </div>
            ) : null}

            {activeTab === 'customize' ? (
              <section className="card">
                <form action={saveBotAppearanceAction} encType="multipart/form-data" className="editor">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="botId" value={bot.id} />
                  <input type="hidden" name="returnTab" value="customize" />

                  <div className="display-col">
                    <div className="display-item">
                      <div className="label">{t.previewAssets}</div>
                      <div className="display-box">
                        <div className="mini-avatar">
                          {avatarImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarImageUrl} alt={displayName} />
                          ) : (
                            <span>{displayName.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="display-text">
                          <strong>{t.avatarImage}</strong>
                          <span>{t.uploadOrUrl}</span>
                        </div>
                      </div>
                    </div>

                    <div className="display-item">
                      <div className="label">{t.previewBanner}</div>
                      <div className="display-box">
                        <div className="banner-box">
                          {bannerImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={bannerImageUrl} alt={t.bannerImage} />
                          ) : null}
                        </div>
                        <div className="display-text">
                          <strong>{t.bannerImage}</strong>
                          <span>{t.uploadOrUrl}</span>
                        </div>
                      </div>
                    </div>

                    <div className="display-item">
                      <div className="label">{t.previewPanel}</div>
                      <div className="display-box">
                        <div className="panel-box">
                          {panelImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={panelImageUrl} alt={t.panelImage} />
                          ) : null}
                        </div>
                        <div className="display-text">
                          <strong>{t.panelImage}</strong>
                          <span>{t.uploadOrUrl}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="fields">
                    <div className="field">
                      <div className="label">{t.displayName}</div>
                      <input className="input" name="displayName" defaultValue={displayName} placeholder={t.displayName} />
                    </div>

                    <div className="field">
                      <div className="label">{t.activityType}</div>
                      <select className="select" name="activityType" defaultValue={activityType}>
                        <option value="PLAYING">PLAYING</option>
                        <option value="STREAMING">STREAMING</option>
                        <option value="LISTENING">LISTENING</option>
                        <option value="WATCHING">WATCHING</option>
                        <option value="COMPETING">COMPETING</option>
                      </select>
                    </div>

                    <div className="field dual">
                      <div>
                        <div className="label">{t.statusText}</div>
                        <input className="input" name="statusText" defaultValue={statusText} placeholder={t.statusText} />
                      </div>
                      <div>
                        <div className="label">{t.streamingOption}</div>
                        <div className="presence-line">
                          <strong>{activityType === 'STREAMING' ? t.streamingEnabled : t.streamingDisabled}</strong>
                          <span>{t.streamingHint}</span>
                        </div>
                      </div>
                    </div>

                    <div className="asset-group">
                      <div className="asset-row">
                        <div className="asset-head">
                          <div>
                            <strong>{t.avatarImage}</strong>
                            <span>{t.mediaAssetsBody}</span>
                          </div>
                        </div>
                        <div className="asset-inputs">
                          <input
                            type="url"
                            className="input"
                            name="avatarImageUrl"
                            defaultValue={avatarImageUrl}
                            placeholder="https://..."
                          />
                          <div className="file-input">
                            <input className="input" type="file" name="avatarImageFile" accept="image/*" />
                          </div>
                        </div>
                      </div>

                      <div className="asset-row">
                        <div className="asset-head">
                          <div>
                            <strong>{t.bannerImage}</strong>
                            <span>{t.mediaAssetsBody}</span>
                          </div>
                        </div>
                        <div className="asset-inputs">
                          <input
                            type="url"
                            className="input"
                            name="bannerImageUrl"
                            defaultValue={bannerImageUrl}
                            placeholder="https://..."
                          />
                          <div className="file-input">
                            <input className="input" type="file" name="bannerImageFile" accept="image/*" />
                          </div>
                        </div>
                      </div>

                      <div className="asset-row">
                        <div className="asset-head">
                          <div>
                            <strong>{t.panelImage}</strong>
                            <span>{t.mediaAssetsBody}</span>
                          </div>
                        </div>
                        <div className="asset-inputs">
                          <input
                            type="url"
                            className="input"
                            name="panelImageUrl"
                            defaultValue={panelImageUrl}
                            placeholder="https://..."
                          />
                          <div className="file-input">
                            <input className="input" type="file" name="panelImageFile" accept="image/*" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="button-wrap">
                      <button className="button" type="submit">
                        <CameraIcon />
                        <span>{t.saveNow}</span>
                      </button>
                    </div>
                  </div>

                  <div className="preview-stack">
                    <div className="preview-card">
                      <div className="preview-label">{t.memberListPreview}</div>
                      <div className="small-app">
                        <div className="mini-avatar">
                          {avatarImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarImageUrl} alt={displayName} />
                          ) : (
                            <span>{displayName.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="id">
                          <span className="truncate">{displayName}</span>
                          <span className="app-chip">app</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-card">
                      <div className="preview-label">{t.profilePreview}</div>
                      <div className="profile-frame">
                        <div className="mini-cover">
                          {bannerImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={bannerImageUrl} alt={displayName} />
                          ) : null}
                        </div>
                        <div className="mini-profile-body">
                          <div className="mini-avatar">
                            {avatarImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatarImageUrl} alt={displayName} />
                            ) : (
                              <span>{displayName.slice(0, 1).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="mini-profile-name">{displayName}</div>
                          <div className="mini-profile-handle">{formatShortId(bot.id)}</div>
                          <div className="status-pill">
                            <div>{formatStatus(activityType)}</div>
                            <div className="mt-1 text-[10px] text-white/58">{statusText || t.notSet}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="preview-card">
                      <div className="preview-label">{t.panelPreviewLabel}</div>
                      <div className="profile-frame">
                        <div className="mini-cover" style={{height: '116px'}}>
                          {panelImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={panelImageUrl} alt={t.panelPreview} />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </section>
            ) : null}

            {activeTab === 'overview' ? (
              <section className="card">
                <div className="overview-grid">
                  <div className="flow-stack">
                    <div className="flow-section">
                      <div className="section-header">
                        <div className="section-copy">
                          <h3>{t.summaryLabel}</h3>
                          <p>{t.overviewBody}</p>
                        </div>
                      </div>
                      <div className="summary-pills">
                        <div className="metric-pill">
                          <strong>{t.botIdentity}</strong>
                          <span>{displayName}</span>
                        </div>
                        <div className="metric-pill">
                          <strong>{t.inviteStatus}</strong>
                          <span>{inviteReady ? t.inviteReady : t.inviteMissing}</span>
                        </div>
                        <div className="metric-pill">
                          <strong>{t.bindingStatus}</strong>
                          <span>{isBound ? currentBoundGuildName : t.noBinding}</span>
                        </div>
                        <div className="metric-pill">
                          <strong>{t.runtimeReadiness}</strong>
                          <span>{runtimeReady ? t.runtimeReady : t.runtimeMissing}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flow-section">
                      <div className="section-header">
                        <div className="section-copy">
                          <h3>{t.essentials}</h3>
                          <p>{t.quickActionsBody}</p>
                        </div>
                      </div>
                      <div className="essentials-list">
                        <div className="line-item">
                          <div className="line-copy">
                            <strong>{t.availability}</strong>
                            <span>{statusLabel}</span>
                          </div>
                          <ReadyBadge ok={bot.status === 'ACTIVE'} readyText={t.readyBadge} missingText={t.missingBadge} />
                        </div>
                        <div className="line-item">
                          <div className="line-copy">
                            <strong>{t.selectedServer}</strong>
                            <span>{selectedGuildName}</span>
                          </div>
                          <span className="status-badge is-missing">{selectedGuildId || t.noServer}</span>
                        </div>
                        <div className="line-item">
                          <div className="line-copy">
                            <strong>{t.currentBoundGuild}</strong>
                            <span>{currentBoundGuildName}</span>
                          </div>
                          <ReadyBadge ok={isBound} readyText={t.readyBadge} missingText={t.missingBadge} />
                        </div>
                        <div className="line-item">
                          <div className="line-copy">
                            <strong>{t.presenceLabel}</strong>
                            <span>{statusText || t.notSet} — {formatStatus(activityType)}</span>
                          </div>
                          <span className="status-badge is-missing">{formatShortId(bot.id)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flow-section">
                      <div className="section-header">
                        <div className="section-copy">
                          <h3>{t.readinessTitle}</h3>
                          <p>{t.setupComplete}</p>
                        </div>
                      </div>
                      <ReadinessList items={readinessItems} t={t} />
                    </div>
                  </div>

                  <div className="side-rail">
                    <div className="rail-block">
                      <h4>{t.quickActions}</h4>
                      <div className="actions-row mt-3">
                        {bot.inviteUrl ? (
                          <a href={bot.inviteUrl} target="_blank" rel="noreferrer" className="ghost-btn">
                            {t.invite}
                          </a>
                        ) : null}
                        <Link href={tabHref(bot.id, 'customize')} className="ghost-btn">
                          {t.tabs.customize.title}
                        </Link>
                        <Link href={tabHref(bot.id, 'general')} className="ghost-btn primary">
                          {t.openSetup}
                        </Link>
                      </div>
                    </div>

                    <div className="rail-block">
                      <h4>{t.currentPlan}</h4>
                      <p>{planLabel}</p>
                      <p className="text-white/52">{planPeriod}</p>
                    </div>

                    <div className="rail-block">
                      <h4>{t.previewTitle}</h4>
                      <div className="small-app mt-3">
                        <div className="mini-avatar">
                          {avatarImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarImageUrl} alt={displayName} />
                          ) : (
                            <span>{displayName.slice(0, 1).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="id">
                          <span className="truncate">{displayName}</span>
                          <span className="app-chip">{formatStatus(activityType)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === 'general' ? (
              <section className="card">
                <div className="general-grid">
                  <div className="flow-stack">
                    <div className="flow-section">
                      <div className="section-header">
                        <div className="section-copy">
                          <h3>{t.serverSection}</h3>
                          <p>{t.serverSectionBody}</p>
                        </div>
                      </div>

                      <form action={bindBotToSelectedServerAction} className="space-y-3">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="botId" value={bot.id} />
                        <input type="hidden" name="returnTab" value="general" />
                        <div className="bind-row">
                          <label className="field">
                            <div className="label">{t.selectServer}</div>
                            <select name="selectedGuildId" defaultValue={selectedGuildId} className="select">
                              {!selectedGuildId ? <option value="">{t.noServer}</option> : null}
                              {guildOptions.map((guild) => (
                                <option key={guild.id} value={guild.id}>
                                  {guild.name} — {guild.id}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button type="submit" className="button">
                            {t.saveBinding}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="flow-section">
                      <div className="section-header">
                        <div className="section-copy">
                          <h3>{t.setupSection}</h3>
                          <p>{t.setupSectionBody}</p>
                        </div>
                      </div>

                      <form action={saveBotSetupAction} className="space-y-3">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="botId" value={bot.id} />
                        <input type="hidden" name="returnTab" value="general" />

                        <div className="form-grid">
                          <label className="field">
                            <div className="label">{t.mode}</div>
                            <select name="mode" defaultValue={bot.BotSetting?.mode || 'VOICE'} className="select">
                              <option value="VOICE">VOICE</option>
                            </select>
                          </label>

                          <label className="field">
                            <div className="label">{t.language}</div>
                            <select name="language" defaultValue={bot.BotSetting?.language || 'en'} className="select">
                              <option value="en">English</option>
                              <option value="ar">العربية</option>
                            </select>
                          </label>

                          <label className="field">
                            <div className="label">{t.createChannel}</div>
                            <input
                              name="createChannel"
                              defaultValue={bot.BotSetting?.createChannel || ''}
                              className="input"
                              placeholder="123456789012345678"
                              inputMode="numeric"
                            />
                          </label>

                          <label className="field">
                            <div className="label">{t.tempCategory}</div>
                            <input
                              name="tempCategory"
                              defaultValue={bot.BotSetting?.tempCategory || ''}
                              className="input"
                              placeholder="123456789012345678"
                              inputMode="numeric"
                            />
                          </label>

                          <label className="field">
                            <div className="label">{t.panelChannel}</div>
                            <input
                              name="panelChannel"
                              defaultValue={bot.BotSetting?.panelChannel || ''}
                              className="input"
                              placeholder="123456789012345678"
                              inputMode="numeric"
                            />
                          </label>

                          <label className="field">
                            <div className="label">{t.logsChannel}</div>
                            <input
                              name="logsChannel"
                              defaultValue={bot.BotSetting?.logsChannel || ''}
                              className="input"
                              placeholder="123456789012345678"
                              inputMode="numeric"
                            />
                          </label>

                          <label className="field">
                            <div className="label">{t.defaultUserLimit}</div>
                            <input
                              type="number"
                              min="0"
                              name="defaultUserLimit"
                              defaultValue={bot.BotSetting?.defaultUserLimit ?? 0}
                              className="input"
                            />
                          </label>
                        </div>

                        <div className="button-wrap">
                          <button type="submit" className="button">
                            {t.saveGeneral}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="side-rail">
                    <div className="rail-block">
                      <h4>{t.bindingStatus}</h4>
                      <p>{isBound ? currentBoundGuildName : t.noBinding}</p>
                    </div>

                    <div className="rail-block">
                      <h4>{t.currentSelectedServer}</h4>
                      <p>{selectedGuildName}</p>
                    </div>

                    <div className="rail-block">
                      <h4>{t.bindRuleTitle}</h4>
                      <p>{t.bindRuleBody}</p>
                      {conflictingSameTypeBot ? <div className="rule-note mt-3">{t.sameTypeConflict}</div> : null}
                    </div>

                    <div className="rail-block">
                      <h4>{t.readinessTitle}</h4>
                      <div className="mt-3">
                        <ReadinessList items={readinessItems} t={t} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
