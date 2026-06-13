'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Nav from '../components/Nav'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    referralCode: searchParams.get('ref') || '',
  })
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setWarning(null)
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Rejestracja nie powiodła się.')
      return
    }
    if (data.referralWarning) {
      setWarning(data.referralWarning)
      setTimeout(() => router.push('/dashboard'), 2500)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div style={{ maxWidth: 440, margin: '64px auto', padding: '0 24px' }}>
      <h1 style={{ color: '#1C2B4A', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Załóż konto ucznia</h1>
      <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>
        Masz kod polecający od znajomego? Wpisz go poniżej, aby otrzymać 50 PLN na koncie.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          required
          placeholder="Imię i nazwisko"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          style={inputStyle}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Telefon"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Kod polecający (opcjonalnie)"
          value={form.referralCode}
          onChange={(e) => update('referralCode', e.target.value.toUpperCase())}
          style={{ ...inputStyle, marginBottom: 20 }}
        />
        {error && <p style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        {warning && <p style={{ color: '#D97706', fontSize: 13, marginBottom: 12 }}>{warning}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', background: '#C0392B', color: '#fff', border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
        >
          {loading ? 'Tworzenie konta…' : 'Zarejestruj się'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>
        Masz już konto? <a href="/login" style={{ color: '#C0392B' }}>Zaloguj się</a>
      </p>
    </div>
  )
}

const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #ddd', marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }

export default function RegisterPage() {
  return (
    <div style={{ fontFamily: 'sans-serif', background: '#FAF7F2', minHeight: '100vh' }}>
      <Nav />
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
