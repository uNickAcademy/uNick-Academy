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
    <div className="max-w-lg mx-auto px-6 py-12">
      <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.18em] uppercase text-brand mb-3">Account</span>
      <h1 className="font-heading font-bold text-3xl text-navy mb-6 tracking-tight">Your account</h1>

      {checkoutSuccess && (
        <div className="bg-cream border border-ui-border text-navy text-sm rounded-card px-5 py-4 mb-6">
          Thanks for subscribing! It may take a few seconds for your membership to activate.
        </div>
      )}

      <div className="bg-white border border-ui-border rounded-card p-7 space-y-5 shadow-card">
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Email</p>
          <p className="text-navy">{profile?.email ?? user.email}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Membership status</p>
          <p className="text-navy font-semibold">{STATUS_LABELS[status] ?? status}</p>
        </div>

        {profile?.subscription_plan && (
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Plan</p>
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
                className="w-full bg-navy hover:bg-navy-bright transition-colors text-white rounded-full px-6 py-3 font-semibold text-[15px]"
              >
                Manage billing
              </button>
            </form>
          ) : (
            <Link
              href="/academy/pricing"
              className="block w-full text-center bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-3 font-semibold text-[15px]"
            >
              Choose a membership plan
            </Link>
          )}
        </div>
      </div>

      <p className="text-sm text-muted text-center mt-6">
        <Link href="/academy/library" className="text-navy font-semibold hover:text-brand transition-colors">
          Browse the lesson plan library &rarr;
        </Link>
      </p>
    </div>
  )
}
