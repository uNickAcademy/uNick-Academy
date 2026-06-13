'use client'
import { useEffect, useState, useCallback } from 'react'
import Nav from '../../components/Nav'

const DAY_ORDER = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela']

function dayOrder(day) {
  const i = DAY_ORDER.indexOf(day)
  return i === -1 ? DAY_ORDER.length : i
}

export default function AdminStudentsPage() {
  const [user, setUser] = useState(undefined)
  const [companies, setCompanies] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const meRes = await fetch('/api/auth/me')
    const me = await meRes.json()
    setUser(me.user)
    if (!me.user?.isAdmin) return

    const res = await fetch('/api/admin/students')
    if (res.ok) setCompanies((await res.json()).companies)
    else setError('Nie udało się wczytać listy uczniów.')
  }, [])

  useEffect(() => { load() }, [load])

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
        <h1 style={{ color: '#1C2B4A', fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Panel administratora - uczniowie firmowi</h1>

        {error && <p style={{ color: '#C0392B' }}>{error}</p>}
        {!companies && !error && <p style={{ color: '#6b7280' }}>Wczytywanie…</p>}
        {companies && companies.length === 0 && <p style={{ color: '#6b7280' }}>Brak firm.</p>}

        {companies?.map((c) => {
          const students = [...c.students].sort((a, b) => {
            const da = dayOrder(a.dayOfWeek), db = dayOrder(b.dayOfWeek)
            if (da !== db) return da - db
            return (a.startTime || '').localeCompare(b.startTime || '')
          })
          return (
            <section key={c.id} style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
              <h2 style={{ color: '#1C2B4A', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{c.name} ({students.length} uczniów)</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '1px solid #eee' }}>
                    <th style={th}>Uczeń</th>
                    <th style={th}>Kontakt</th>
                    <th style={th}>Nauczyciel</th>
                    <th style={th}>Dzień</th>
                    <th style={th}>Godzina</th>
                    <th style={th}>Forma</th>
                    <th style={th}>Poziom / notatki</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ color: '#9CA3AF' }}>{s.referralCode}</div>
                      </td>
                      <td style={td}>
                        <div>{s.email}</div>
                        <div style={{ color: '#9CA3AF' }}>{s.phone}</div>
                      </td>
                      <td style={td}>{s.teacher ?? '—'}</td>
                      <td style={td}>{s.dayOfWeek ?? '—'}</td>
                      <td style={td}>{s.startTime ?? '—'}</td>
                      <td style={td}>{s.mode ?? '—'}</td>
                      <td style={td}>{[s.level, s.notes].filter(Boolean).join(' · ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })}
      </div>
    </div>
  )
}

const th = { padding: '8px 6px', whiteSpace: 'nowrap' }
const td = { padding: '8px 6px', verticalAlign: 'top' }
