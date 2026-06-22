'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { REFERRAL_STATUS_LABELS, referralStatusLabel, referralStatusColor } from '@/lib/referral-labels'

const STATUS_OPTIONS = Object.keys(REFERRAL_STATUS_LABELS)

export default function AdminReferralsPage() {
  const [user, setUser] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(false)
  const [referrals, setReferrals] = useState(null)
  const [students, setStudents] = useState(null)
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [creditForm, setCreditForm] = useState({ studentId: '', amount: '', note: '' })
  const [creditMessage, setCreditMessage] = useState(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    if (!u) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', u.id)
      .single()

    if (!profile?.is_admin) return
    setIsAdmin(true)

    const [refRes, studentsRes] = await Promise.all([
      fetch('/api/admin/referrals'),
      fetch('/api/admin/students'),
    ])
    if (refRes.ok) setReferrals((await refRes.json()).referrals)
    else setError('Could not load referrals.')
    if (studentsRes.ok) setStudents((await studentsRes.json()).users)
  }, [])

  useEffect(() => { load() }, [load])

  async function changeStatus(id, status) {
    setSavingId(id)
    const res = await fetch(`/api/admin/referrals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSavingId(null)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      return
    }
    load()
  }

  async function submitCredit(e) {
    e.preventDefault()
    setCreditMessage(null)
    const res = await fetch('/api/admin/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: creditForm.studentId, amount: Number(creditForm.amount), note: creditForm.note }),
    })
    const data = await res.json()
    if (!res.ok) {
      setCreditMessage({ type: 'error', text: data.error })
      return
    }
    setCreditMessage({ type: 'success', text: 'Credit updated.' })
    setCreditForm({ studentId: '', amount: '', note: '' })
    load()
  }

  if (user === undefined) return null
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-navy mb-4 text-[15px]">You must log in as an administrator.</p>
          <a href="/login" className="inline-block bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-8 py-3 font-semibold">Log in</a>
        </div>
      </div>
    )
  }
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <p className="text-navy">Access denied — admin only.</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <span className="inline-flex items-center gap-2 text-[13px] font-bold tracking-[0.18em] uppercase text-brand mb-3">Admin</span>
      <h1 className="font-heading font-bold text-3xl text-navy mb-8 tracking-tight">Referrals</h1>

      {error && <p className="text-brand mb-4">{error}</p>}

      <section className="bg-white border border-ui-border rounded-card p-6 mb-6 shadow-card overflow-x-auto">
        {!referrals && <p className="text-muted">Loading...</p>}
        {referrals && referrals.length === 0 && <p className="text-muted">No referrals yet.</p>}
        {referrals && referrals.length > 0 && (
          <table className="w-full text-xs min-w-[900px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-left text-muted border-b border-ui-border text-[11px] uppercase tracking-wider">
                <th className="p-2">Referrer</th>
                <th className="p-2">Referred</th>
                <th className="p-2">Date</th>
                <th className="p-2">Purchase</th>
                <th className="p-2">Lessons</th>
                <th className="p-2">Status</th>
                <th className="p-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-ui-border/50" style={{ background: r.flagged ? '#FFFBEB' : 'transparent' }}>
                  <td className="p-2">
                    <div className="font-semibold text-navy">{r.referrer.name}</div>
                    <div className="text-muted">{r.referrer.email}</div>
                  </td>
                  <td className="p-2">
                    <div className="font-semibold text-navy">{r.referred.name}</div>
                    <div className="text-muted">{r.referred.email}{r.referred.phone ? ` · ${r.referred.phone}` : ''}</div>
                    {r.flagged && <div className="text-amber-500 mt-1">⚠ {r.flagReason}</div>}
                  </td>
                  <td className="p-2 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 text-muted">
                    {r.qualifyingPurchase
                      ? `${r.qualifyingPurchase.amount} PLN (${r.qualifyingPurchase.status})`
                      : '—'}
                  </td>
                  <td className="p-2 text-muted">{r.lessonsAttended}</td>
                  <td className="p-2">
                    <span style={{ color: referralStatusColor(r.status) }} className="font-semibold">
                      {referralStatusLabel(r.status)}
                    </span>
                  </td>
                  <td className="p-2">
                    <select
                      value={r.status}
                      disabled={savingId === r.id}
                      onChange={(e) => changeStatus(r.id, e.target.value)}
                      className="px-2 py-1 rounded-lg border border-ui-border text-xs focus:outline-none focus:border-brand"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{referralStatusLabel(s)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="bg-white border border-ui-border rounded-card p-6 shadow-card">
        <h2 className="font-heading font-bold text-lg text-navy mb-3">Manual credit adjustment</h2>
        <form onSubmit={submitCredit} className="flex gap-3 flex-wrap items-start">
          <select
            required
            value={creditForm.studentId}
            onChange={(e) => setCreditForm((f) => ({ ...f, studentId: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border-[1.5px] border-ui-border text-sm min-w-[220px] focus:outline-none focus:border-brand"
          >
            <option value="">Select student...</option>
            {students?.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.creditBalance.toFixed(2)} PLN</option>
            ))}
          </select>
          <input
            required
            type="number"
            step="0.01"
            placeholder="Amount (e.g. 50 or -50)"
            value={creditForm.amount}
            onChange={(e) => setCreditForm((f) => ({ ...f, amount: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border-[1.5px] border-ui-border text-sm w-44 focus:outline-none focus:border-brand"
          />
          <input
            placeholder="Note (optional)"
            value={creditForm.note}
            onChange={(e) => setCreditForm((f) => ({ ...f, note: e.target.value }))}
            className="flex-1 min-w-[200px] px-3 py-2.5 rounded-xl border-[1.5px] border-ui-border text-sm focus:outline-none focus:border-brand"
          />
          <button type="submit" className="bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-2.5 font-semibold text-sm">Save</button>
        </form>
        {creditMessage && (
          <p className={`text-xs mt-2 ${creditMessage.type === 'error' ? 'text-brand' : 'text-green-600'}`}>{creditMessage.text}</p>
        )}
      </section>
    </div>
  )
}
