import '../globals.css';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {Header} from '@/components/Header';
import {Footer} from '@/components/Footer';
import {getSession} from '@/lib/auth';
import {CartProvider} from './pricing/_components/CartContext';
import {ToastProvider} from '@/components/Toast';
import {GlobalCartDrawer} from '@/components/GlobalCartDrawer';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const messages = await getMessages();
  const session = await getSession();

  const user = session
    ? {
        name:
          session.user.discordGlobalName ||
          session.user.discordUsername ||
          session.user.discordId,
        avatarUrl: session.user.avatar
          ? `https://cdn.discordapp.com/avatars/${session.user.discordId}/${session.user.avatar}.png`
          : null
      }
    : null;

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen flex flex-col fate-bg fate-grid fate-noise text-white">
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <CartProvider>
              <Header locale={locale} user={user} />
              <GlobalCartDrawer locale={locale} />
              <main className="w-full flex-1">{children}</main>
              <Footer />
            </CartProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
