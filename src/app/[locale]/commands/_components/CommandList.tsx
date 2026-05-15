'use client';

import {CopyIcon} from '@/components/Icons';
import {useToast} from '@/components/Toast';
import type {Command} from '@/data/commands';

const COMMAND_DESC_AR: Record<string, string> = {
  '/ban': 'حظر عضو من السيرفر',
  '/kick': 'طرد عضو من السيرفر',
  '/unban': 'إزالة الحظر عن عضو',
  '/log-channel': 'تحديد قناة للسجلات',
  '/welcome': 'إعداد رسائل الترحيب',
  '/prefix': 'تغيير بادئة البوت إن كانت مدعومة',
  '/role-add': 'إضافة رتبة إلى عضو',
  '/role-remove': 'إزالة رتبة من عضو',
  '/reaction-roles': 'إعداد الرتب التفاعلية',
  '/slowmode': 'ضبط الوضع البطيء لقناة',
  '/lock': 'قفل قناة',
  '/unlock': 'فتح قناة',
  '/anti-raid': 'تفعيل أو تعطيل حماية المداهمات',
  '/anti-spam': 'تفعيل أو تعطيل حماية السبام',
  '/verify': 'تفعيل التحقق',
  '/clear': 'حذف مجموعة رسائل',
  '/announce': 'إرسال إعلان',
  '/embed': 'إرسال رسالة مخصصة',
  '/warn': 'إنذار عضو',
  '/mute': 'كتم عضو',
  '/unmute': 'إزالة كتم عضو',
  '/ping': 'فحص سرعة البوت',
  '/help': 'عرض قائمة المساعدة',
  '/owner-panel': 'فتح لوحة المالك',
  '/backup': 'إنشاء نسخة احتياطية للإعدادات',
  '/group-create': 'إنشاء مجموعة صوتية',
  '/group-delete': 'حذف مجموعة صوتية',
  '/points-add': 'إضافة نقاط إلى عضو',
  '/points-top': 'عرض لوحة المتصدرين',
  '/ticket-open': 'فتح تذكرة دعم',
  '/ticket-close': 'إغلاق تذكرة دعم'
};

export function CommandList({items, locale}: {items: Command[]; locale: string}) {
  const toast = useToast();
  const isAr = locale === 'ar';

  async function handleCopy(commandName: string) {
    try {
      await navigator.clipboard.writeText(commandName);
      toast.push(isAr ? 'تم النسخ' : 'Copied', 'success');
    } catch {
      toast.push(isAr ? 'فشل النسخ' : 'Copy failed', 'error');
    }
  }

  function getDescription(command: Command) {
    if (!isAr) return command.description;
    return COMMAND_DESC_AR[command.name] ?? command.description;
  }

  return (
    <div className="space-y-[10px]">
      {items.map((command) => (
        <article
          key={command.name}
          className="flex items-start justify-between gap-4 rounded-[10px] border border-white/[0.03] bg-[#171922] px-5 py-4"
        >
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold leading-6 text-white">{command.name}</div>
            <div className="mt-1 text-[14px] leading-6 text-white/72">{getDescription(command)}</div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(command.name)}
            className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-white/45 transition hover:bg-white/[0.04] hover:text-white/75"
            aria-label={isAr ? 'نسخ الأمر' : 'Copy command'}
            title={isAr ? 'نسخ' : 'Copy'}
          >
            <CopyIcon className="h-4 w-4" />
          </button>
        </article>
      ))}
    </div>
  );
}
