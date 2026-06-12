import { getAdminStats, getOverdueReport, getRecentTransactions, getBillingSummary } from '@/lib/supabase/queries'
import { PaymentsView } from './PaymentsView'

export const dynamic = 'force-dynamic'

export default async function PlatnosciAdminPage() {
  const [stats, overdue, transactions, billing] = await Promise.all([
    getAdminStats(),
    getOverdueReport(),
    getRecentTransactions(50),
    getBillingSummary(),
  ])

  const debtors = overdue.students.filter((s) => s.balance < 0).map((s) => ({ id: s.id, name: s.name, owes: Math.abs(s.balance) }))
  const stripeReady = !!process.env.STRIPE_SECRET_KEY

  return (
    <PaymentsView
      monthlyRevenue={stats.monthlyRevenue}
      totalOwed={overdue.total}
      debtors={debtors}
      transactions={transactions}
      billing={billing}
      stripeReady={stripeReady}
    />
  )
}
