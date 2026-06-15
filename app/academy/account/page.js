import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CURRENCY_SYMBOLS } from '@/lib/constants'

const STATUS_LABELS = {
  active: 'Active',
  past_due: 'Past due',
  cancelled: 'Cancelled',
  none: 'No membership yet',
}

export default async function AccountPage({ searchParams }) {
  const params = await searchParams
  const checkoutSuccess = params?.checkout === 'success'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, subscription_status, subscription_plan, subscription_currency, stripe_customer_id')
    .eq('id', user.id)
    .single()

  const status = profile?.subscription_status ?? 'none'
  const currencySymbol = profile?.subscription_currency
    ? CURRENCY_SYMBOLS[profile.subscription_currency]
    : null

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-heading font-bold text-3xl text-navy mb-6">Your account</h1>

      {checkoutSuccess && (
        <p className="bg-sky/10 text-navy text-sm rounded-lg px-4 py-3 mb-6">
          Thanks for subscribing! It may take a few seconds for your membership to activate.
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Email</p>
          <p className="text-navy">{profile?.email ?? user.email}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Membership status</p>
          <p className="text-navy font-semibold">{STATUS_LABELS[status] ?? status}</p>
        </div>

        {profile?.subscription_plan && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Plan</p>
            <p className="text-navy capitalize">
              {profile.subscription_plan}
              {currencySymbol ? ` (${currencySymbol})` : ''}
            </p>
          </div>
        )}

        <div className="pt-2">
          {profile?.stripe_customer_id ? (
            <form action="/academy/api/portal" method="POST">
              <button
                type="submit"
                className="w-full bg-navy hover:bg-navy/90 transition-colors text-white rounded-full px-6 py-3 font-semibold"
              >
                Manage billing
              </button>
            </form>
          ) : (
            <Link
              href="/academy/pricing"
              className="block w-full text-center bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold"
            >
              Choose a membership plan
            </Link>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-600 text-center mt-6">
        <Link href="/academy/library" className="text-navy font-semibold hover:text-sky">
          Browse the lesson plan library &rarr;
        </Link>
      </p>
    </div>
  )
}
