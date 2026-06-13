'use client'
import { useEffect, useState, useCallback } from 'react'
import Nav from '../../components/Nav'
import { REFERRAL_STATUS_LABELS, referralStatusLabel, referralStatusColor } from '@/lib/referral-labels'

const STATUS_OPTIONS = Object.keys(REFERRAL_STATUS_LABELS)

export default function AdminReferralsPage() {
  const [user, setUser] = useState(undefined)
  const [referrals, setReferrals] = useState(null)
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [creditForm, setCreditForm] = useState({ userId: '', amount: '', note: '' })
  const [creditMessage, setCreditMessage] = useState(null)

  const load = useCallback(async () => {
    const meRes = await fetch('/api/auth/me')
    const me = await meRes.json()
    setUser(me.user)
    if (!me.user?.isAdmin) return

    const [refRes, usersRes] = await Promise.all([fetch('/api/admin/referrals'), fetch('/api/admin/users')])
    if (refRes.ok) setReferrals((await refRes.json()).referrals)
    else setError('Nie udało się wczytać poleceń.')
    if (usersRes.ok) setUsers((await usersRes.json()).users)
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
      body: JSON.stringify({ ...creditForm, amount: Number(creditForm.amount) }),
    })
    const data = await res.json()
    if (!res.ok) {
      setCreditMessage({ type: 'error', text: data.error })
      return
    }
    setCreditMessage({ type: 'success', text: 'Zaktualizowano saldo.' })
    setCreditForm({ userId: '', amount: '', note: '' })
    load()
  }

  if (user === undefined) return null
  if (!user) {
    return (
      <div style={{ fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' }}>
        <Nav />
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <p style={{ color: '#1C2B4A', marginBottom: 16 }}>Musisz się zalogować jako administrator.</p>
          <a href="/login" style={{ background: '#C0392B', color: '#fff', borderRadius: 10, padding: '14px 32px', fontWeight: 700, textDecoration: 'none' }}>Zaloguj się</a>
        </div>
      </div>
    )
  }
  if (!user.isAdmin) {
    return (
      <div style={{ fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' }}>
        <Nav />
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <p style={{ color: '#1C2B4A' }}>Brak dostępu - ta sekcja jest tylko dla administratorów.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' }}>
      <Nav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ color: '#1C2B4A', fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Panel administratora - polecenia</h1>

        {error && <p style={{ color: '#C0392B' }}>{error}</p>}

        <section style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          {!referrals && <p style={{ color: '#6b7280' }}>Wczytywanie…</p>}
          {referrals && referrals.length === 0 && <p style={{ color: '#6b7280' }}>Brak poleceń.</p>}
          {referrals && referrals.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '1px solid #eee' }}>
                  <th style={th}>Polecający</th>
                  <th style={th}>Polecony</th>
                  <th style={th}>Data</th>
                  <th style={th}>Płatność</th>
                  <th style={th}>Lekcje</th>
                  <th style={th}>Status</th>
                  <th style={th}>Zmień status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3', background: r.flagged ? '#FFFBEB' : 'transparent' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{r.referrer.name}</div>
                      <div style={{ color: '#9CA3AF' }}>{r.referrer.email}</div>
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{r.referred.name}</div>
                      <div style={{ color: '#9CA3AF' }}>{r.referred.email}{r.referred.phone ? ` · ${r.referred.phone}` : ''}</div>
                      {r.flagged && <div style={{ color: '#D97706', marginTop: 4 }}>⚠ {r.flagReason}</div>}
                    </td>
                    <td style={td}>{new Date(r.createdAt).toLocaleDateString('pl-PL')}</td>
                    <td style={td}>
                      {r.qualifyingPurchase
                        ? `${r.qualifyingPurchase.amount} PLN (${r.qualifyingPurchase.status})`
                        : '—'}
                    </td>
                    <td style={td}>{r.lessonsAttended}</td>
                    <td style={td}>
                      <span style={{ color: referralStatusColor(r.status), fontWeight: 700 }}>{referralStatusLabel(r.status)}</span>
                    </td>
                    <td style={td}>
                      <select
                        value={r.status}
                        disabled={savingId === r.id}
                        onChange={(e) => changeStatus(r.id, e.target.value)}
                        style={{ padding: 6, borderRadius: 6, border: '1.5px solid #ddd', fontSize: 12 }}
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

        <section style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ color: '#1C2B4A', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Ręczna korekta salda</h2>
          <form onSubmit={submitCredit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <select
              required
              value={creditForm.userId}
              onChange={(e) => setCreditForm((f) => ({ ...f, userId: e.target.value }))}
              style={{ padding: 12, borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14, minWidth: 220 }}
            >
              <option value="">Wybierz ucznia…</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) - saldo {u.creditBalance.toFixed(2)} PLN</option>
              ))}
            </select>
            <input
              required
              type="number"
              step="0.01"
              placeholder="Kwota (np. 50 lub -50)"
              value={creditForm.amount}
              onChange={(e) => setCreditForm((f) => ({ ...f, amount: e.target.value }))}
              style={{ padding: 12, borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14, width: 180 }}
            />
            <input
              placeholder="Notatka (opcjonalnie)"
              value={creditForm.note}
              onChange={(e) => setCreditForm((f) => ({ ...f, note: e.target.value }))}
              style={{ padding: 12, borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14, flex: 1, minWidth: 200 }}
            />
            <button type="submit" style={{ background: '#C0392B', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Zapisz
            </button>
          </form>
          {creditMessage && (
            <p style={{ color: creditMessage.type === 'error' ? '#C0392B' : '#16A34A', fontSize: 13, marginTop: 10 }}>{creditMessage.text}</p>
          )}
        </section>
      </div>
    </div>
  )
}

const th = { padding: '8px 6px', whiteSpace: 'nowrap' }
const td = { padding: '8px 6px', verticalAlign: 'top' }
