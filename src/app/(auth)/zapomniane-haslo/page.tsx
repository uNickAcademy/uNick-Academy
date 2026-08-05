'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL
    const appOrigin = configuredAppUrl && window.location.hostname !== 'localhost'
      ? configuredAppUrl.replace(/\/$/, '')
      : window.location.origin
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appOrigin}/reset-haslo`,
    })

    setLoading(false)

    if (resetError) {
      setError('Nie udało się wysłać linku. Spróbuj ponownie.')
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/unicorn.PNG" alt="uNickorn" width={80} height={80} className="object-contain" />
          </div>
          {/* „Nie masz hasła?" zamiast „Zapomniałeś hasła?", bo ta sama strona
              obsługuje dwie sytuacje: reset zapomnianego hasła ORAZ ustawienie
              go po raz pierwszy. Konta uczniów z importu mają losowe hasła,
              których nikt nigdy nie znał, więc „zapomniałeś" było dla nich
              mylące. */}
          <h1 className="text-2xl font-black text-gray-900">Nie masz hasła?</h1>
          <p className="text-gray-500 text-sm mt-1">
            Wyślemy Ci link, żebyś mógł/mogła je ustawić. Działa tak samo, gdy ustawiasz
            hasło pierwszy raz i gdy je zapomniałeś/aś.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {sent ? (
            <p className="text-sm text-gray-600 text-center">
              Jeśli konto z tym adresem istnieje, wysłaliśmy na nie link do ustawienia hasła. Sprawdź skrzynkę.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#23479E] text-sm transition-colors"
                  placeholder="jan@email.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? 'Wysyłanie...' : 'Wyślij link'}
              </button>
            </form>
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
