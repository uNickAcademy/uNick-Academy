import { CreditCard } from 'lucide-react'
import { getHrEmployees } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function HrPaymentsPage() {
  const employees = await getHrEmployees()
  const totalOwed = employees.reduce((acc, e) => acc + (e.credit_balance < 0 ? -e.credit_balance : 0), 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-2"><CreditCard size={22} />Płatności pracowników</h1>
      <p className="text-gray-500 mb-6">Łączne zaległości: <span className="font-bold text-red-500">{totalOwed.toLocaleString('pl-PL')} zł</span></p>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Pracownik</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Poziom</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Saldo</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{e.profile?.full_name}</td>
                <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EAF3FF] text-[#23479E]">{e.level}</span></td>
                <td className={`px-5 py-3 font-bold ${e.credit_balance < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                  {e.credit_balance < 0 ? `${e.credit_balance} zł` : e.credit_balance === 0 ? '✓' : `+${e.credit_balance} zł`}
                </td>
                <td className="px-5 py-3">
                  {e.credit_balance < 0
                    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Zaległość</span>
                    : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Opłacone</span>}
                </td>
              </tr>
            ))}
            {employees.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 text-sm">Brak pracowników.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
