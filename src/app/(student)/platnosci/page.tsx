import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentByProfileId } from '@/lib/supabase/queries'
import { FileText, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { getLang } from '@/lib/lang'
import { t } from '@/lib/i18n'
import { PayOnlineButton } from '../PayOnlineButton'
import type { Invoice } from '@/types'

export const dynamic = 'force-dynamic'

const WEEKS_PER_MONTH = 4.33

export default async function PlatnosciPage({ searchParams }: {
  searchParams: Promise<{ success?: string; cancelled?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const student = await getStudentByProfileId(user.id)
  if (!student) redirect('/dashboard')
  if (student.billing_type === 'b2b') redirect('/dashboard')

  const params = await searchParams

  // Miesięczna stawka: indywidualna cena albo najtańszy aktywny plan
  let monthly = student.custom_monthly_price != null ? Number(student.custom_monthly_price) : 0
  if (!monthly) {
    const { data: plans } = await supabase
      .from('pricing_plans')
      .select('lessons_per_week, price_per_lesson')
      .eq('is_active', true)
      .order('lessons_per_week')
    const base = plans?.[0]
    monthly = base ? Math.round(Number(base.price_per_lesson) * base.lessons_per_week * WEEKS_PER_MONTH) : 0
  }

  const balance = Number(student.credit_balance ?? 0)
  const creditApplied = Math.max(balance, 0)
  const arrears = Math.abs(Math.min(balance, 0))
  const toPay = Math.max(Math.round(monthly - creditApplied + arrears), 0)
  const stripeReady = !!process.env.STRIPE_SECRET_KEY

  const { data: invoicesData } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', student.id)
    .order('issued_at', { ascending: false })
  const invoices = (invoicesData as Invoice[]) ?? []

  const locale = lang === 'en' ? 'en-GB' : 'pl-PL'
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">{t(lang, 'payments')}</h1>

      {params.success && (
        <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{t(lang, 'payment_success')}</p>
        </div>
      )}
      {params.cancelled && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <XCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">{t(lang, 'payment_cancelled')}</p>
        </div>
      )}

      {/* Następna płatność */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">{t(lang, 'next_payment')}</h2>
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{t(lang, 'monthly_rate')}</span>
            <span className="font-medium text-gray-900">{Math.round(monthly)} zł</span>
          </div>
          {creditApplied > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t(lang, 'credits_applied')}</span>
              <span className="font-medium text-green-600">-{Math.round(creditApplied)} zł</span>
            </div>
          )}
          {arrears > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t(lang, 'arrears')}</span>
              <span className="font-medium text-red-500">+{Math.round(arrears)} zł</span>
            </div>
          )}
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-bold text-gray-900">{t(lang, 'to_pay')}</span>
            <span className="text-xl font-black text-[#23479E]">{toPay} zł</span>
          </div>
        </div>
        {toPay > 0 && (
          <PayOnlineButton
            amount={toPay}
            studentId={student.id}
            description={`Abonament – ${student.full_name ?? ''}`.trim()}
            label={t(lang, 'pay_blik')}
            unavailableLabel={t(lang, 'payments_unavailable')}
            stripeReady={stripeReady}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          />
        )}
      </div>

      {/* Historia faktur */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{t(lang, 'invoice_history')}</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10 px-6">{t(lang, 'no_invoices')}</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{inv.period || fmtDate(inv.issued_at)}</p>
                  <p className="text-xs text-gray-400">{inv.number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{Math.round(Number(inv.gross_amount))} zł</p>
                  {inv.status === 'paid' && <span className="text-xs text-green-600 font-medium">{t(lang, 'invoice_paid')}</span>}
                </div>
                {inv.pdf_url && (
                  <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
