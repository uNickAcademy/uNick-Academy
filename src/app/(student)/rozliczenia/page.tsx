import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentByProfileId, getStudentTransactions } from '@/lib/supabase/queries'
import { ArrowDownCircle, ArrowUpCircle, Gift, AlertCircle } from 'lucide-react'
import { getLang } from '@/lib/lang'
import { t } from '@/lib/i18n'
import { PayOnlineButton } from '../PayOnlineButton'

export const dynamic = 'force-dynamic'

const TYPE_CONFIG = {
  charge: { icon: ArrowDownCircle, color: 'text-red-500', bg: 'bg-red-50' },
  payment: { icon: ArrowUpCircle, color: 'text-green-600', bg: 'bg-green-50' },
  credit: { icon: Gift, color: 'text-[#23479E]', bg: 'bg-[#EAF3FF]' },
}

export default async function RozliczeniaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const student = await getStudentByProfileId(user.id)
  if (!student) redirect('/dashboard')
  if (student.billing_type === 'b2b') redirect('/dashboard')

  const transactions = await getStudentTransactions(student.id)
  const balance = transactions.reduce((acc, tx) => tx.type === 'charge' ? acc - Number(tx.amount) : acc + Number(tx.amount), 0)
  const due = Math.round(Math.abs(Math.min(balance, 0)))
  const stripeReady = !!process.env.STRIPE_SECRET_KEY

  const locale = lang === 'en' ? 'en-GB' : 'pl-PL'
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">{t(lang, 'billing')}</h1>

      {/* Saldo */}
      <div className={`rounded-2xl p-6 mb-6 ${balance < 0 ? 'bg-red-50 border-2 border-red-200' : balance === 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-[#EAF3FF] border-2 border-blue-200'}`}>
        <p className="text-sm font-medium text-gray-500 mb-1">{t(lang, 'account_balance')}</p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className={`text-4xl font-black ${balance < 0 ? 'text-red-600' : balance === 0 ? 'text-green-700' : 'text-[#23479E]'}`}>
              {balance < 0 ? '-' : balance > 0 ? '+' : ''}{Math.abs(Math.round(balance))} zł
            </p>
            <p className={`text-sm mt-1 font-medium ${balance < 0 ? 'text-red-500' : balance === 0 ? 'text-green-600' : 'text-[#23479E]'}`}>
              {balance < 0 ? t(lang, 'balance_due') : balance === 0 ? t(lang, 'balance_ok') : t(lang, 'balance_credit')}
            </p>
          </div>
          {balance < 0 && (
            <PayOnlineButton
              amount={due}
              studentId={student.id}
              description={`Uregulowanie salda – ${student.full_name ?? ''}`.trim()}
              label={t(lang, 'pay_now')}
              unavailableLabel={t(lang, 'payments_unavailable')}
              stripeReady={stripeReady}
            />
          )}
        </div>

        {balance < 0 && (
          <div className="mt-4 flex items-start gap-2 bg-red-100 rounded-xl p-3">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 leading-relaxed">
              {t(lang, 'overdue_note').replace('{amount}', String(due))}
            </p>
          </div>
        )}
      </div>

      {/* Historia transakcji */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{t(lang, 'tx_history')}</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10 px-6">{t(lang, 'no_transactions')}</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => {
              const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.charge
              const Icon = cfg.icon
              const signed = tx.type === 'charge' ? -Number(tx.amount) : Number(tx.amount)
              return (
                <div key={tx.id} className="flex items-center gap-4 px-6 py-4">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(tx.created_at)}</p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${signed < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {signed > 0 ? '+' : ''}{Math.round(signed)} zł
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
