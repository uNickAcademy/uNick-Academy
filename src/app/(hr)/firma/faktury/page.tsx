import { FileText, Download } from 'lucide-react'
import { getHrInvoices } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function HrInvoicesPage() {
  const invoices = await getHrInvoices()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2"><FileText size={22} />Faktury</h1>
      {invoices.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400 text-sm">Brak wystawionych faktur.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Numer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Okres</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Netto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">VAT</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Brutto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-bold text-gray-900">{i.number}</td>
                  <td className="px-5 py-3 text-gray-600">{i.period ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-700">{Number(i.net_amount).toLocaleString('pl-PL')} zł</td>
                  <td className="px-5 py-3 text-gray-500">{Number(i.vat_amount).toLocaleString('pl-PL')} zł</td>
                  <td className="px-5 py-3 font-bold text-gray-900">{Number(i.gross_amount).toLocaleString('pl-PL')} zł</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(i.issued_at).toLocaleDateString('pl-PL')}</td>
                  <td className="px-5 py-3 text-right">
                    {i.pdf_url ? (
                      <a href={i.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-[#23479E] hover:underline inline-flex items-center gap-1"><Download size={13} />PDF</a>
                    ) : <span className="text-xs text-gray-300">PDF wkrótce</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
