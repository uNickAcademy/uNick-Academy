import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreditCard, ArrowDownCircle, ArrowUpCircle, Gift, AlertCircle } from 'lucide-react'

const BALANCE: number = -120 // ujemne = zaległość, 0 = wyrównane, dodatnie = nadpłata

const TRANSACTIONS = [
  { id: '1', type: 'charge' as const, amount: -200, desc: 'Lekcja – Milly, 9 cze 2025', date: '9 cze 2025' },
  { id: '2', type: 'credit' as const, amount: 50, desc: 'Kredyt z polecenia – Ania K.', date: '8 cze 2025' },
  { id: '3', type: 'payment' as const, amount: 200, desc: 'Wpłata – przelew', date: '5 cze 2025' },
  { id: '4', type: 'charge' as const, amount: -200, desc: 'Lekcja – Milly, 4 cze 2025', date: '4 cze 2025' },
  { id: '5', type: 'payment' as const, amount: 200, desc: 'Wpłata – BLIK', date: '1 cze 2025' },
  { id: '6', type: 'charge' as const, amount: -200, desc: 'Lekcja – Milly, 28 maj 2025', date: '28 maj 2025' },
  { id: '7', type: 'credit' as const, amount: 50, desc: 'Kredyt z polecenia – Marek T.', date: '20 maj 2025' },
  { id: '8', type: 'charge' as const, amount: -120, desc: 'Lekcja próbna – Milly, 5 maj 2025', date: '5 maj 2025' },
]

const TYPE_CONFIG = {
  charge: { icon: ArrowDownCircle, color: 'text-red-500', bg: 'bg-red-50', sign: '' },
  payment: { icon: ArrowUpCircle, color: 'text-green-600', bg: 'bg-green-50', sign: '+' },
  credit: { icon: Gift, color: 'text-[#23479E]', bg: 'bg-[#EAF3FF]', sign: '+' },
}

export default async function RozliczeniaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: student } = await supabase.from('students').select('billing_type').eq('profile_id', user.id).single()
    if (student?.billing_type === 'b2b') redirect('/dashboard')
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Rozliczenia</h1>

      {/* Saldo */}
      <div className={`rounded-2xl p-6 mb-6 ${BALANCE < 0 ? 'bg-red-50 border-2 border-red-200' : BALANCE === 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-[#EAF3FF] border-2 border-violet-200'}`}>
        <p className="text-sm font-medium text-gray-500 mb-1">Saldo konta</p>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-4xl font-black ${BALANCE < 0 ? 'text-red-600' : BALANCE === 0 ? 'text-green-700' : 'text-[#23479E]'}`}>
              {BALANCE < 0 ? '-' : '+'}{Math.abs(BALANCE)} zł
            </p>
            <p className={`text-sm mt-1 font-medium ${BALANCE < 0 ? 'text-red-500' : BALANCE === 0 ? 'text-green-600' : 'text-[#23479E]'}`}>
              {BALANCE < 0 ? 'Zaległość do uregulowania' : BALANCE === 0 ? 'Konto wyrównane' : 'Nadpłata'}
            </p>
          </div>
          {BALANCE < 0 && (
            <button className="flex items-center gap-2 px-5 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-md">
              <CreditCard size={16} />
              Zapłać teraz
            </button>
          )}
        </div>

        {BALANCE < 0 && (
          <div className="mt-4 flex items-start gap-2 bg-red-100 rounded-xl p-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 leading-relaxed">
              Masz zaległość {Math.abs(BALANCE)} zł. Ureguluj płatność, żeby kontynuować lekcje bez przerwy.
            </p>
          </div>
        )}
      </div>

      {/* Historia transakcji */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Historia transakcji</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {TRANSACTIONS.map((tx) => {
            const cfg = TYPE_CONFIG[tx.type]
            const Icon = cfg.icon
            return (
              <div key={tx.id} className="flex items-center gap-4 px-6 py-4">
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={18} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.desc}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tx.date}</p>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${tx.amount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} zł
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
