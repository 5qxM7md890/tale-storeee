import {Card} from '@/components/Card';

function statusClasses(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-green-500/15 text-green-300 border-green-500/30';
    case 'OPEN':
      return 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30';
    default:
      return 'bg-white/10 text-white/70 border-white/10';
  }
}

export function InvoiceTable({invoices}: {invoices: any[]}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="text-sm font-semibold">Invoices</div>
        <form>
          <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10">
            Refresh
          </button>
        </form>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs text-white/60">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-white/10">
                <td className="px-4 py-3 text-white/80">{inv.stripeInvoiceId}</td>
                <td className="px-4 py-3 text-white/80">${(inv.amountPaid / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${statusClasses(inv.status)}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/70">{new Date(inv.invoiceCreated).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {inv.hostedInvoiceUrl ? (
                    <a
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                      href={inv.hostedInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View invoice
                    </a>
                  ) : (
                    <span className="text-xs text-white/40">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
