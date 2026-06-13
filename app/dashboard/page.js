'use client'
import { useEffect, useState, useCallback } from 'react'
import Nav from '../components/Nav'
import { referralStatusLabel, referralStatusColor } from '@/lib/referral-labels'

export default function DashboardPage() {
  const [user, setUser] = useState(undefined)
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [applyMessage, setApplyMessage] = useState(null)
  const [copied, setCopied] = useState(false)
  const [demoMessage, setDemoMessage] = useState(null)

  const load = useCallback(async () => {
    const meRes = await fetch('/api/auth/me')
    const me = await meRes.json()
    setUser(me.user)
    if (!me.user) return

    const res = await fetch('/api/referrals/me')
    if (res.ok) setOverview(await res.json())
    else setError('Nie udało się wczytać danych programu polecającego.')
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
    setApplyMessage({ type: 'success', text: 'Kod polecający został przyjęty! Twój bonus 50 PLN będzie dostępny po pierwszej kwalifikującej się płatności.' })
    setCodeInput('')
    load()
  }

  async function copyCode() {
    await navigator.clipboard.writeText(overview.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function simulate(path, body) {
    setDemoMessage(null)
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setDemoMessage({ type: 'error', text: data.error })
      return
    }
    setDemoMessage({ type: 'success', text: 'Zarejestrowano. Odświeżono dane.' })
    load()
  }

  if (user === undefined) return null
  if (user === null) {
    return (
      <div style={{ fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' }}>
        <Nav />
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
          <p style={{ color: '#1C2B4A', marginBottom: 16 }}>Musisz się zalogować, aby zobaczyć panel ucznia.</p>
          <a href="/login" style={{ background: '#C0392B', color: '#fff', borderRadius: 10, padding: '14px 32px', fontWeight: 700, textDecoration: 'none' }}>Zaloguj się</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' }}>
      <Nav />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ color: '#1C2B4A', fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Panel ucznia</h1>

        {error && <p style={{ color: '#C0392B' }}>{error}</p>}
        {!overview && !error && <p style={{ color: '#6b7280' }}>Wczytywanie…</p>}

        {overview && (
          <>
            {!overview.programmeAvailable && (
              <section style={cardStyle}>
                <h2 style={cardTitle}>Program polecający</h2>
                <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
                  Konta firmowe (B2B) nie biorą udziału w programie polecającym.
                </p>
              </section>
            )}

            {overview.programmeAvailable && (
              <>
                {/* Referral code + explanation */}
                <section style={cardStyle}>
                  <h2 style={cardTitle}>Program polecający</h2>
                  <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                    Podaj swój kod znajomemu. Gdy zarejestruje się z Twoim kodem i dokona pierwszej
                    kwalifikującej się płatności (min. 200 PLN lub pierwszy pakiet/miesiąc lekcji),
                    obie strony otrzymują <strong>50 PLN</strong> na koncie. Twoja nagroda zostanie
                    przyznana, gdy nowy uczeń odbędzie co najmniej 4 lekcje i nie zwróci płatności.
                    Środki można wykorzystać na przyszłe lekcje (do 50% wartości faktury) - nie da
                    się ich wypłacić ani przekazać innej osobie, i nie obejmują lekcji próbnych.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ background: '#1C2B4A', color: '#fff', borderRadius: 8, padding: '12px 20px', fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>
                      {overview.referralCode}
                    </div>
                    <button onClick={copyCode} style={secondaryButton}>{copied ? 'Skopiowano!' : 'Kopiuj kod'}</button>
                  </div>
                </section>

                {/* Apply a referral code */}
                {overview.canApplyReferralCode && (
                  <section style={cardStyle}>
                    <h2 style={cardTitle}>Masz kod polecający od znajomego?</h2>
                    <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>
                      Wpisz go poniżej przed pierwszą płatnością, aby otrzymać 50 PLN na koncie.
                    </p>
                    <form onSubmit={applyCode} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <input
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                        placeholder="np. UNICK-AB12CD"
                        style={{ flex: 1, minWidth: 200, padding: 12, borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}
                      />
                      <button type="submit" style={primaryButton}>Zastosuj kod</button>
                    </form>
                    {applyMessage && (
                      <p style={{ color: applyMessage.type === 'error' ? '#C0392B' : '#16A34A', fontSize: 13, marginTop: 10 }}>{applyMessage.text}</p>
                    )}
                  </section>
                )}
                {!overview.canApplyReferralCode && overview.referralReceived && (
                  <section style={cardStyle}>
                    <p style={{ color: '#6b7280', fontSize: 14 }}>
                      Twoje konto zostało zarejestrowane z kodem polecającym - status: <strong>{referralStatusLabel(overview.referralReceived.status)}</strong>.
                    </p>
                  </section>
                )}
              </>
            )}

            {/* Credits */}
            <section style={cardStyle}>
              <h2 style={cardTitle}>Twoje środki na koncie</h2>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#16A34A' }}>{overview.creditBalance.toFixed(2)} PLN</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>dostępne do wykorzystania</div>
                </div>
                {overview.pendingCredit > 0 && (
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#D97706' }}>{overview.pendingCredit.toFixed(2)} PLN</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>oczekuje na kwalifikującą się płatność</div>
                  </div>
                )}
              </div>
              <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 12 }}>
                Środki pokrywają maks. {Math.round(overview.rules.maxCreditRedemptionRatio * 100)}% wartości faktury i nie obejmują lekcji próbnych.
              </p>
            </section>

            {/* Referrals made */}
            {overview.programmeAvailable && (
              <section style={cardStyle}>
                <h2 style={cardTitle}>Twoje polecenia</h2>
                {overview.referrals.length === 0 && (
                  <p style={{ color: '#6b7280', fontSize: 14 }}>Jeszcze nikogo nie poleciłeś. Udostępnij swój kod, aby zacząć zbierać nagrody!</p>
                )}
                {overview.referrals.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '8px 4px' }}>Osoba</th>
                        <th style={{ padding: '8px 4px' }}>Data zaproszenia</th>
                        <th style={{ padding: '8px 4px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.referrals.map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                          <td style={{ padding: '8px 4px' }}>{r.referredFirstName}</td>
                          <td style={{ padding: '8px 4px' }}>{new Date(r.createdAt).toLocaleDateString('pl-PL')}</td>
                          <td style={{ padding: '8px 4px' }}>
                            <span style={{ color: referralStatusColor(r.status), fontWeight: 700 }}>{referralStatusLabel(r.status)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}

            {/* Demo tools */}
            <section style={{ ...cardStyle, border: '1.5px dashed #ddd' }}>
              <h2 style={cardTitle}>Narzędzia demo</h2>
              <p style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 12 }}>
                Tymczasowe przyciski do testowania logiki programu polecającego, do podłączenia
                z prawdziwym systemem płatności i rezerwacji lekcji.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => simulate('/api/purchases', { amount: 250, type: 'single_lesson' })} style={secondaryButton}>Zapłać 250 PLN (kwalifikujące)</button>
                <button onClick={() => simulate('/api/purchases', { amount: 100, type: 'single_lesson' })} style={secondaryButton}>Zapłać 100 PLN (niekwalifikujące)</button>
                <button onClick={() => simulate('/api/purchases', { amount: 400, type: 'package', useCredit: true })} style={secondaryButton}>Kup pakiet (400 PLN, użyj kredytu)</button>
                <button onClick={() => simulate('/api/lessons', { attended: true })} style={secondaryButton}>Zarejestruj odbytą lekcję</button>
              </div>
              {demoMessage && (
                <p style={{ color: demoMessage.type === 'error' ? '#C0392B' : '#16A34A', fontSize: 13, marginTop: 10 }}>{demoMessage.text}</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

const cardTitle = { color: '#1C2B4A', fontSize: 18, fontWeight: 700, marginBottom: 12 }

const primaryButton = { background: '#C0392B', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }

const secondaryButton = { background: '#F3F4F6', color: '#1C2B4A', border: '1.5px solid #ddd', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
