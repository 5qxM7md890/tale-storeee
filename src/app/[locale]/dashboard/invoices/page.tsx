import {redirect} from 'next/navigation';
import {getSession} from '@/lib/auth';
import {prisma} from '@/lib/db';
import {InvoiceTable} from './_components/InvoiceTable';

export default async function InvoicesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const session = await getSession();
  if (!session) redirect(`/api/auth/discord/login?next=/${locale}/dashboard/invoices`);

  const invoices = await prisma.invoice.findMany({
    where: {subscription: {userId: session.userId}},
    orderBy: {invoiceCreated: 'desc'},
    take: 50
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 space-y-6">
      <h1 className="text-2xl font-bold">Your Invoices</h1>
      <InvoiceTable invoices={invoices} />
    </div>
  );
}
