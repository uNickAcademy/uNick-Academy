'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

/**
 * Link z maila (potwierdzenie rejestracji, zaproszenie, magic link, reset hasła)
 * ląduje tutaj. To był wcześniej zwykły endpoint GET, który zużywał jednorazowy
 * token przy KAŻDYM zapytaniu HTTP, bez względu na to, kto je wysłał.
 *
 * Problem: filtry antyspamowe i skanery bezpieczeństwa (Microsoft Defender,
 * firmowe bramki pocztowe — częste na domenach typu @democo.com.pl) same
 * odwiedzają linki z maila, zanim zrobi to człowiek, żeby sprawdzić, czy nie
 * prowadzą do czegoś złośliwego. Token jest jednorazowy, więc taki skan
 * zużywał go, zanim adresat zdążył kliknąć — i dostawał „link wygasł" przy
 * pierwszej, jedynej próbie.
 *
 * Token zużywa się teraz dopiero po kliknięciu przycisku przez człowieka.
 * Skaner, który tylko pobiera stronę, nic nie konsumuje — nie wykonuje JS
 * i nie klika.
 */

const VALID_TYPES = new Set<EmailOtpType>([
  'signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email',
])

function safeNextPath(value: string | null, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const parsed = new URL(value, 'https://unick-academy.pl')
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return fallback
  }
}

const HEADLINE: Partial<Record<EmailOtpType, string>> = {
  recovery: 'Ustaw nowe hasło',
  signup: 'Potwierdź rejestrację',
  invite: 'Dołącz do uNick Academy',
  email_change: 'Potwierdź nowy adres e-mail',
}

const BUTTON_LABEL: Partial<Record<EmailOtpType, string>> = {
  recovery: 'Potwierdź i ustaw hasło',
  signup: 'Potwierdź i zaloguj',
  invite: 'Potwierdź i dołącz',
  email_change: 'Potwierdź adres',
}

type Status = 'ready' | 'verifying' | 'invalid'

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<Status>('ready')
  const [tokenHash, setTokenHash] = useState<string | null>(null)
  const [type, setType] = useState<EmailOtpType | null>(null)
  const [next, setNext] = useState('/login')

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const rawType = query.get('type')
    const parsedType = rawType && VALID_TYPES.has(rawType as EmailOtpType) ? (rawType as EmailOtpType) : null
    const fallback = parsedType === 'recovery' ? '/reset-haslo' : '/login'
    const parsedNext = safeNextPath(query.get('next'), fallback)
    const hash = query.get('token_hash')

    if (!hash || !parsedType) {
      window.location.replace(`${fallback}?error=invalid_link`)
      return
    }

    setTokenHash(hash)
    setType(parsedType)
    setNext(parsedNext)
  }, [])

  async function confirm() {
    if (!tokenHash || !type) return
    setStatus('verifying')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      const fallback = type === 'recovery' ? '/reset-haslo' : '/login'
      window.location.replace(`${fallback}?error=invalid_link`)
      return
    }
    // Pełne przeładowanie, żeby middleware od razu zobaczył nową sesję w ciasteczkach.
    window.location.href = next
  }

  const headline = (type && HEADLINE[type]) || 'Potwierdź, aby kontynuować'
  const buttonLabel = (type && BUTTON_LABEL[type]) || 'Potwierdź'

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/unicorn.PNG" alt="uNickorn" width={80} height={80} className="object-contain" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">{headline}</h1>
          <p className="text-gray-500 text-sm mt-1">Jeden klik dzieli Cię od dalszego kroku.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {!tokenHash ? (
            <p className="text-sm text-gray-500 text-center py-4">Sprawdzam link...</p>
          ) : (
            <button
              type="button"
              onClick={confirm}
              disabled={status === 'verifying'}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {status === 'verifying' ? 'Potwierdzam...' : buttonLabel}
            </button>
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
