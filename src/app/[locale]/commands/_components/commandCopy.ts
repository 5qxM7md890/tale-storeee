import type {Command} from '@/data/commands';

type Locale = 'en' | 'ar';

const categoryLabels = {
  en: {
    All: 'All',
    Admin: 'Admin',
    Settings: 'Settings',
    Roles: 'Roles',
    Channels: 'Channels',
    Protection: 'Protection',
    Chat: 'Chat',
    Mod: 'Mod',
    Genral: 'Genral',
    Owners: 'Owners',
    Groups: 'Groups',
    Points: 'Points',
    Tickets: 'Tickets'
  },
  ar: {
    All: 'الكل',
    Admin: 'الإدارة',
    Settings: 'الإعدادات',
    Roles: 'الرتب',
    Channels: 'القنوات',
    Protection: 'الحماية',
    Chat: 'الدردشة',
    Mod: 'الإشراف',
    Genral: 'عام',
    Owners: 'المالكون',
    Groups: 'المجموعات',
    Points: 'النقاط',
    Tickets: 'التذاكر'
  }
} as const;

const descriptions = {
  en: {
    '/ban': 'Ban a user from the server.',
    '/kick': 'Kick a user from the server.',
    '/unban': 'Remove a ban for a user.',
    '/log-channel': 'Set a channel for logs.',
    '/welcome': 'Configure welcome messages.',
    '/prefix': 'Change bot prefix (if supported).',
    '/role-add': 'Add a role to a user.',
    '/role-remove': 'Remove a role from a user.',
    '/reaction-roles': 'Setup reaction roles.',
    '/slowmode': 'Set slowmode for a channel.',
    '/lock': 'Lock a channel.',
    '/unlock': 'Unlock a channel.',
    '/anti-raid': 'Toggle anti-raid protection.',
    '/anti-spam': 'Toggle anti-spam protection.',
    '/verify': 'Enable verification checks.',
    '/clear': 'Bulk delete messages.',
    '/announce': 'Send an announcement.',
    '/embed': 'Send a custom embed message.',
    '/warn': 'Warn a user.',
    '/mute': 'Mute a user.',
    '/unmute': 'Unmute a user.',
    '/ping': 'Check bot latency.',
    '/help': 'Show help menu.',
    '/owner-panel': 'Open owner tools panel.',
    '/backup': 'Create a configuration backup.',
    '/group-create': 'Create a voice group.',
    '/group-delete': 'Delete a voice group.',
    '/points-add': 'Add points to a user.',
    '/points-top': 'Show leaderboard.',
    '/ticket-open': 'Open a support ticket.',
    '/ticket-close': 'Close a support ticket.'
  },
  ar: {
    '/ban': 'حظر عضو من السيرفر.',
    '/kick': 'طرد عضو من السيرفر.',
    '/unban': 'إزالة الحظر عن عضو.',
    '/log-channel': 'تحديد قناة للسجلات.',
    '/welcome': 'إعداد رسائل الترحيب.',
    '/prefix': 'تغيير بادئة البوت إذا كانت مدعومة.',
    '/role-add': 'إضافة رتبة إلى مستخدم.',
    '/role-remove': 'إزالة رتبة من مستخدم.',
    '/reaction-roles': 'إعداد رتب الرياكشن.',
    '/slowmode': 'ضبط البطيء للقناة.',
    '/lock': 'قفل القناة.',
    '/unlock': 'فتح القناة.',
    '/anti-raid': 'تفعيل أو تعطيل الحماية من الرايد.',
    '/anti-spam': 'تفعيل أو تعطيل الحماية من السبام.',
    '/verify': 'تفعيل التحقق للأعضاء.',
    '/clear': 'حذف الرسائل بشكل جماعي.',
    '/announce': 'إرسال إعلان.',
    '/embed': 'إرسال رسالة إمبد مخصصة.',
    '/warn': 'تحذير عضو.',
    '/mute': 'إسكات عضو.',
    '/unmute': 'إلغاء إسكات عضو.',
    '/ping': 'فحص سرعة استجابة البوت.',
    '/help': 'عرض قائمة المساعدة.',
    '/owner-panel': 'فتح لوحة أدوات المالك.',
    '/backup': 'إنشاء نسخة احتياطية للإعدادات.',
    '/group-create': 'إنشاء مجموعة صوتية.',
    '/group-delete': 'حذف مجموعة صوتية.',
    '/points-add': 'إضافة نقاط إلى مستخدم.',
    '/points-top': 'عرض لوحة الصدارة.',
    '/ticket-open': 'فتح تذكرة دعم.',
    '/ticket-close': 'إغلاق تذكرة دعم.'
  }
} as const;

const copyText = {
  en: {
    title: 'Tale Commands',
    subtitle: 'Find the command you are looking for and how to use it.',
    searchPlaceholder: 'Search for command',
    noResults: 'No commands found',
    copy: 'Copy command',
    copied: 'Copied',
    copyFailed: 'Copy failed'
  },
  ar: {
    title: 'أوامر Tale',
    subtitle: 'ابحث عن الأمر الذي تريده وتعرّف على طريقة استخدامه.',
    searchPlaceholder: 'ابحث عن أمر',
    noResults: 'لم يتم العثور على أوامر',
    copy: 'نسخ الأمر',
    copied: 'تم النسخ',
    copyFailed: 'فشل النسخ'
  }
} as const;

export function getCategoryLabel(locale: string, category: string) {
  const lang = locale === 'ar' ? 'ar' : 'en';
  return categoryLabels[lang][category as keyof typeof categoryLabels.en] ?? category;
}

export function getCommandDescription(locale: string, command: Command) {
  const lang = locale === 'ar' ? 'ar' : 'en';
  return descriptions[lang][command.name as keyof typeof descriptions.en] ?? command.description;
}

export function getCommandsPageCopy(locale: string) {
  return copyText[locale === 'ar' ? 'ar' : 'en'];
}