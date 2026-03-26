import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;

  // لا ترمي خطأ وقت import / build — ارمي فقط عند الاستخدام الحقيقي
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is missing at runtime');
  }

  if (!_stripe) {
    _stripe = new Stripe(key, {
      // apiVersion اختياري — خله كذا أو احذفه إذا تبي
      apiVersion: '2024-06-20'
    } as any);
  }

  return _stripe;
}

/**
 * ✅ مهم:
 * نصدّر stripe كـ Proxy عشان أي كود عندك يستورد `stripe` ويستخدمه
 * يشتغل بدون ما ننشئ Stripe Client وقت الـbuild.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const s: any = getStripe();
    const value = s[prop];
    return typeof value === 'function' ? value.bind(s) : value;
  }
});
