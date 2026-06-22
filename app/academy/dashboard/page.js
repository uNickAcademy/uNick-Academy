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
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-navy mb-4">You must log in to see your dashboard.</p>
          <a href="/login" className="inline-block bg-brand text-white rounded-lg px-8 py-3 font-bold">Log in</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-extrabold text-navy mb-6">Student dashboard</h1>

        {error && <p className="text-brand">{error}</p>}
        {!overview && !error && <p className="text-gray-500">Loading...</p>}

        {overview && (
          <>
            {!overview.programmeAvailable && (
              <section className="bg-white rounded-2xl p-6 mb-5 shadow-sm">
                <h2 className="text-lg font-bold text-navy mb-2">Referral programme</h2>
                <p className="text-gray-500 text-sm">Corporate (B2B) accounts are not part of the referral programme.</p>
              </section>
            )}

            {overview.programmeAvailable && (
              <>
                <section className="bg-white rounded-2xl p-6 mb-5 shadow-sm">
                  <h2 className="text-lg font-bold text-navy mb-3">Referral programme</h2>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                    Share your code with a friend. When they sign up and make their first qualifying
                    purchase (min. 200 PLN or first package/monthly), both of you receive <strong>50 PLN</strong> in
                    account credit. Your reward is granted after the new student attends at least 4 lessons.
                    Credit covers up to 50% of an invoice and excludes trial lessons.
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="bg-navy text-white rounded-lg px-5 py-3 font-extrabold text-lg tracking-wide">
                      {overview.referralCode}
                    </div>
                    <button onClick={copyCode} className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold text-navy">
                      {copied ? 'Copied!' : 'Copy code'}
                    </button>
                  </div>
                </section>

                {overview.canApplyReferralCode && (
                  <section className="bg-white rounded-2xl p-6 mb-5 shadow-sm">
                    <h2 className="text-lg font-bold text-navy mb-2">Have a referral code?</h2>
                    <p className="text-gray-500 text-sm mb-3">Enter it before your first purchase to receive 50 PLN.</p>
                    <form onSubmit={applyCode} className="flex gap-3 flex-wrap">
                      <input
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. UNICK-AB12CD"
                        className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-300 text-sm"
                      />
                      <button type="submit" className="bg-brand text-white rounded-lg px-6 py-2 font-bold text-sm">Apply</button>
                    </form>
                    {applyMessage && (
                      <p className={`text-xs mt-2 ${applyMessage.type === 'error' ? 'text-brand' : 'text-green-600'}`}>{applyMessage.text}</p>
                    )}
                  </section>
                )}

                {!overview.canApplyReferralCode && overview.referralReceived && (
                  <section className="bg-white rounded-2xl p-6 mb-5 shadow-sm">
                    <p className="text-gray-500 text-sm">
                      Your account was registered with a referral code — status: <strong>{referralStatusLabel(overview.referralReceived.status)}</strong>.
                    </p>
                  </section>
                )}
              </>
            )}

            <section className="bg-white rounded-2xl p-6 mb-5 shadow-sm">
              <h2 className="text-lg font-bold text-navy mb-3">Account credit</h2>
              <div className="flex gap-8 flex-wrap">
                <div>
                  <div className="text-3xl font-extrabold text-green-600">{overview.creditBalance.toFixed(2)} PLN</div>
                  <div className="text-xs text-gray-500">available</div>
                </div>
                {overview.pendingCredit > 0 && (
                  <div>
                    <div className="text-3xl font-extrabold text-amber-500">{overview.pendingCredit.toFixed(2)} PLN</div>
                    <div className="text-xs text-gray-500">pending qualifying purchase</div>
                  </div>
                )}
              </div>
            </section>

            {overview.programmeAvailable && (
              <section className="bg-white rounded-2xl p-6 mb-5 shadow-sm">
                <h2 className="text-lg font-bold text-navy mb-3">Your referrals</h2>
                {overview.referrals.length === 0 && (
                  <p className="text-gray-500 text-sm">No referrals yet. Share your code to start earning rewards!</p>
                )}
                {overview.referrals.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2">Person</th>
                        <th className="py-2">Date</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.referrals.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100">
                          <td className="py-2">{r.referredFirstName}</td>
                          <td className="py-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="py-2">
                            <span style={{ color: referralStatusColor(r.status) }} className="font-bold">
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
    </div>
  )
}
