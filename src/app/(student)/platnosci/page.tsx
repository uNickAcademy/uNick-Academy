import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreditCard, FileText, ExternalLink } from 'lucide-react'

const NEXT_PAYMENT = {
  amount: 200,
  credits: 100,
  final: 100,
  dueDate: '15 lipca 2025',
}

const INVOICES = [
  { id: 'INV-2025-06', date: 'Czerwiec 2025', amount: 200, status: 'paid', url: '#' },
  { id: 'INV-2025-05', date: 'Maj 2025', amount: 200, status: 'paid', url: '#' },
  { id: 'INV-2025-04', date: 'Kwiecień 2025', amount: 200, status: 'paid', url: '#' },
]

export default async function PlatnosciPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: student } = await supabase.from('students').select('billing_type').eq('profile_id', user.id).single()
    if (student?.billing_type === 'b2b') redirect('/dashboard')
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Płatności</h1>

      {/* Następna płatność */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Następna płatność</h2>
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Miesięczna stawka</span>
            <span className="font-medium text-gray-900">{NEXT_PAYMENT.amount} zł</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Kredyty z poleceń</span>
            <span className="font-medium text-green-600">-{NEXT_PAYMENT.credits} zł</span>
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-bold text-gray-900">Do zapłaty</span>
            <span className="text-xl font-black text-[#23479E]">{NEXT_PAYMENT.final} zł</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">Termin płatności: {NEXT_PAYMENT.dueDate}</p>
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity">
          <CreditCard size={16} />
          Zapłać teraz (BLIK / Przelew)
        </button>
      </div>

      {/* Historia faktur */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Historia faktur</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {INVOICES.map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{inv.date}</p>
                <p className="text-xs text-gray-400">{inv.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{inv.amount} zł</p>
                <span className="text-xs text-green-600 font-medium">Opłacona</span>
              </div>
              <a href={inv.url} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
