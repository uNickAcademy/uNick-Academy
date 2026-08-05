'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

type LinkState = 'checking' | 'ready' | 'invalid'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabaseRef = useRef<SupabaseClient | null>(null)

  const [linkState, setLinkState] = useState<LinkState>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Po kliknięciu w link z maila lądujemy tutaj z tokenem odzyskiwania w URL.
  // Musimy najpierw zamienić ten token na sesję — dopiero wtedy updateUser()
  // ma prawo ustawić nowe hasło. Bez tego kroku formularz zawsze kończył się
  // błędem "nie udało się ustawić hasła". Obsługujemy oba warianty linków
  // (PKCE `?code=` oraz implicit `#access_token=`) i czytelnie komunikujemy,
  // gdy link jest nieprawidłowy lub wygasł.
  useEffect(() => {
    // Własna instancja z wyłączonym auto-wykrywaniem URL, żeby uniknąć
    // wyścigu (podwójnej wymiany kodu) i mieć pełną kontrolę nad przebiegiem.
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { detectSessionInUrl: false } }
    )
    supabaseRef.current = supabase

    const query = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const code = query.get('code')
    const linkError = query.get('error') || hash.get('error')

    async function establishSession() {
      if (linkError) {
        setLinkState('invalid')
        return
      }

      // Wariant PKCE: w URL jest `?code=...` do wymiany na sesję.
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        setLinkState(exchangeError ? 'invalid' : 'ready')
        return
      }

      // Wariant implicit: tokeny przychodzą we fragmencie (#access_token=...).
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        setLinkState(sessionError ? 'invalid' : 'ready')
        return
      }

      // Brak tokenu w URL — może sesja odzyskiwania już istnieje (np. odświeżenie).
      const { data } = await supabase.auth.getSession()
      setLinkState(data.session ? 'ready' : 'invalid')
    }

    establishSession()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne.')
      return
    }

    const supabase = supabaseRef.current
    if (!supabase) return

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError('Nie udało się ustawić hasła. Link mógł wygasnąć — poproś o nowy.')
      return
    }

    await supabase.auth.signOut()
    setSuccess(true)
    setTimeout(() => router.push('/login'), 1500)
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/unicorn.PNG" alt="uNickorn" width={80} height={80} className="object-contain" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Ustaw nowe hasło</h1>
          <p className="text-gray-500 text-sm mt-1">Wpisz nowe hasło do swojego konta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {linkState === 'checking' && (
            <p className="text-sm text-gray-500 text-center py-4">Weryfikuję link...</p>
          )}

          {linkState === 'invalid' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Ten link do ustawienia hasła jest nieprawidłowy lub wygasł. Poproś o nowy,
                linki są ważne przez ograniczony czas i tylko przy pierwszym kliknięciu.
              </p>
              <Link
                href="/zapomniane-haslo"
                className="inline-block w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Wyślij nowy link
              </Link>
            </div>
          )}

          {linkState === 'ready' && (
            success ? (
              <p className="text-sm text-green-600 text-center">Hasło zostało zmienione. Przekierowuję do logowania...</p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nowe hasło</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Powtórz hasło</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loading ? 'Zapisywanie...' : 'Zapisz hasło'}
                </button>
              </form>
            )
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/login" className="text-[#23479E] font-medium hover:underline">
            Wróć do logowania
          </Link>
        </p>
      </div>
    </div>
  )
}
