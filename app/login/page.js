'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '../components/Nav'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Logowanie nie powiodło się.')
      return
    }
    router.push(data.user.isAdmin ? '/admin/referrals' : '/dashboard')
  }

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' }}>
      <Nav />
      <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 24px' }}>
        <h1 style={{ color: '#1C2B4A', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Zaloguj się</h1>
        <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>
          Wersja demo - logowanie tylko na podstawie adresu e-mail (bez hasła).
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #ddd', marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#C0392B', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            {loading ? 'Logowanie…' : 'Zaloguj się'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>
          Nie masz konta? <a href="/register" style={{ color: '#C0392B' }}>Zarejestruj się</a>
        </p>
      </div>
    </div>
  )
}
