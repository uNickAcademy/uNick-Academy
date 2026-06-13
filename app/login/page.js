'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function afterAuth() {
    await fetch('/api/unickorn/provision', { method: 'POST' })
    router.push('/talk-to-unickorn')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
    }

    await afterAuth()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-unick-cream flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-extrabold text-unick-navy text-center mb-2">uNick Academy</h1>
        <p className="text-center text-gray-500 mb-8">
          {mode === 'signin' ? 'Zaloguj się, aby porozmawiać z uNickornem' : 'Załóż konto, aby zacząć'}
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Imię i nazwisko"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-unick-navy/30"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-unick-navy/30"
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-unick-navy/30"
          />

          {error && <p className="text-sm text-unick-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-unick-red text-white rounded-lg py-3 font-bold text-sm disabled:opacity-60"
          >
            {loading ? 'Chwileczkę...' : mode === 'signin' ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full text-center text-sm text-unick-navy mt-4 underline"
        >
          {mode === 'signin' ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
        </button>
      </div>
    </div>
  )
}
