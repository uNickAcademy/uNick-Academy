'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { referralStatusLabel, referralStatusColor } from '@/lib/referral-labels'

export default function DashboardPage() {
  const [user, setUser] = useState(undefined)
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [applyMessage, setApplyMessage] = useState(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (!u) return

    const res = await fetch('/api/referrals/me')
    if (res.ok) setOverview(await res.json())
    else setError('Could not load referral data.')
  }, [])

  useEffect(() => { load() }, [load])

  async function applyCode(e) {
    e.preventDefault()
    setApplyMessage(null)
    const res = await fetch('/api/referrals/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeInput }),
    })
    const data = await res.json()
    if (!res.ok) {
      setApplyMessage({ type: 'error', text: data.error })
      return
    }
    setApplyMessage({ type: 'success', text: 'Referral code accepted! Your 50 PLN bonus will be available after your first qualifying purchase.' })
    setCodeInput('')
    load()
  }

  async function copyCode() {
    await navigator.clipboard.writeText(overview.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (user === undefined) return null
  if (user === null) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-navy mb-4 text-[15px]">You must log in to see your dashboard.</p>
          <a href="/login" className="inline-block bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-8 py-3 font-semibold">Log in</a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.18em] uppercase text-brand mb-3">Dashboard</span>
      <h1 className="font-heading font-bold text-3xl text-navy mb-8 tracking-tight">Student dashboard</h1>

      {error && <p className="text-brand mb-4">{error}</p>}
      {!overview && !error && <p className="text-muted">Loading...</p>}

      {overview && (
        <>
          {!overview.programmeAvailable && (
            <section className="bg-white border border-ui-border rounded-card p-7 mb-5 shadow-card">
              <h2 className="font-heading font-bold text-lg text-navy mb-2">Referral programme</h2>
              <p className="text-muted text-sm">Corporate (B2B) accounts are not part of the referral programme.</p>
            </section>
          )}

          {overview.programmeAvailable && (
            <>
              <section className="bg-white border border-ui-border rounded-card p-7 mb-5 shadow-card">
                <h2 className="font-heading font-bold text-lg text-navy mb-3">Referral programme</h2>
                <p className="text-muted text-sm mb-4 leading-relaxed">
                  Share your code with a friend. When they sign up and make their first qualifying
                  purchase (min. 200 PLN or first package/monthly), both of you receive <strong className="text-navy">50 PLN</strong> in
                  account credit. Your reward is granted after the new student attends at least 4 lessons.
                  Credit covers up to 50% of an invoice and excludes trial lessons.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="bg-navy text-white rounded-xl px-5 py-3 font-bold text-lg tracking-wide">
                    {overview.referralCode}
                  </div>
                  <button onClick={copyCode} className="px-5 py-2.5 bg-cream border border-ui-border rounded-xl text-sm font-semibold text-navy hover:bg-sand transition-colors">
                    {copied ? 'Copied!' : 'Copy code'}
                  </button>
                </div>
              </section>

              {overview.canApplyReferralCode && (
                <section className="bg-white border border-ui-border rounded-card p-7 mb-5 shadow-card">
                  <h2 className="font-heading font-bold text-lg text-navy mb-2">Have a referral code?</h2>
                  <p className="text-muted text-sm mb-3">Enter it before your first purchase to receive 50 PLN.</p>
                  <form onSubmit={applyCode} className="flex gap-3 flex-wrap">
                    <input
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. UNICK-AB12CD"
                      className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border-[1.5px] border-ui-border text-sm focus:outline-none focus:border-brand"
                    />
                    <button type="submit" className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-2.5 font-semibold text-sm">Apply</button>
                  </form>
                  {applyMessage && (
                    <p className={`text-xs mt-2 ${applyMessage.type === 'error' ? 'text-brand' : 'text-green-600'}`}>{applyMessage.text}</p>
                  )}
                </section>
              )}

              {!overview.canApplyReferralCode && overview.referralReceived && (
                <section className="bg-white border border-ui-border rounded-card p-7 mb-5 shadow-card">
                  <p className="text-muted text-sm">
                    Your account was registered with a referral code — status: <strong className="text-navy">{referralStatusLabel(overview.referralReceived.status)}</strong>.
                  </p>
                </section>
              )}
            </>
          )}

          <section className="bg-white border border-ui-border rounded-card p-7 mb-5 shadow-card">
            <h2 className="font-heading font-bold text-lg text-navy mb-3">Account credit</h2>
            <div className="flex gap-8 flex-wrap">
              <div>
                <div className="text-3xl font-bold text-green-600">{overview.creditBalance.toFixed(2)} PLN</div>
                <div className="text-xs text-muted mt-1">available</div>
              </div>
              {overview.pendingCredit > 0 && (
                <div>
                  <div className="text-3xl font-bold text-amber-500">{overview.pendingCredit.toFixed(2)} PLN</div>
                  <div className="text-xs text-muted mt-1">pending qualifying purchase</div>
                </div>
              )}
            </div>
          </section>

          {overview.programmeAvailable && (
            <section className="bg-white border border-ui-border rounded-card p-7 mb-5 shadow-card">
              <h2 className="font-heading font-bold text-lg text-navy mb-3">Your referrals</h2>
              {overview.referrals.length === 0 && (
                <p className="text-muted text-sm">No referrals yet. Share your code to start earning rewards!</p>
              )}
              {overview.referrals.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-ui-border">
                      <th className="py-2">Person</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.referrals.map((r) => (
                      <tr key={r.id} className="border-b border-ui-border/50">
                        <td className="py-2.5 text-navy">{r.referredFirstName}</td>
                        <td className="py-2.5 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td className="py-2.5">
                          <span style={{ color: referralStatusColor(r.status) }} className="font-semibold">
                            {referralStatusLabel(r.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
