'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/**
 * Wypisanie z wysyłek marketingowych.
 *
 * Rezygnacja zapisuje się dopiero po kliknięciu przycisku, nigdy przy samym
 * wejściu na stronę. Filtry antyspamowe i firmowe bramki pocztowe odwiedzają
 * linki z maila zanim zrobi to człowiek, żeby sprawdzić, dokąd prowadzą.
 * Gdyby wypisywał sam adres, taki skan wypisałby odbiorcę, który nawet nie
 * otworzył wiadomości.
 */

type Status = 'ready' | 'wysylam' | 'gotowe' | 'blad'

export default function WypiszSiePage() {
  const [token, setToken] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('ready')
  const [adres, setAdres] = useState<string | null>(null)
  const [blad, setBlad] = useState<string | null>(null)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('t')
    setToken(t && /^[0-9a-f-]{36}$/i.test(t) ? t : null)
  }, [])

  async function wypisz() {
    if (!token) return
    setStatus('wysylam')
    setBlad(null)
    try {
      const res = await fetch('/api/wypisz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) {
        setBlad(data.error ?? 'Nie udało się zapisać rezygnacji.')
        setStatus('blad')
        return
      }
      setAdres(data.adres ?? null)
      setStatus('gotowe')
    } catch {
      setBlad('Nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.')
      setStatus('blad')
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/unicorn.PNG" alt="uNickorn" width={80} height={80} className="object-contain" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            {status === 'gotowe' ? 'Już nie piszemy' : 'Wypisanie z wiadomości'}
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          {status === 'gotowe' ? (
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                Gotowe. {adres ? <>Adres <strong className="text-[#1E3282]">{adres}</strong> nie</> : <>Ten adres nie</>} dostanie
                już od nas wiadomości o nowościach ani kodów polecających.
              </p>
              <p className="text-gray-400">
                Wiadomości dotyczące zajęć, terminów i rozliczeń wysyłamy dalej, bo bez nich nie
                dowiesz się o zmianie godziny lekcji. Jeśli i tych nie chcesz, napisz do nas.
              </p>
            </div>
          ) : token ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Potwierdź, a przestaniemy wysyłać Ci wiadomości marketingowe.
              </p>
              {blad && (
                <div className="bg-red-50 text-[#B4321E] text-sm rounded-xl px-4 py-2.5">{blad}</div>
              )}
              <button
                type="button"
                onClick={wypisz}
                disabled={status === 'wysylam'}
                className="w-full py-3 rounded-xl bg-[#1E3282] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {status === 'wysylam' ? 'Zapisuję...' : 'Wypisz mnie'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-2">
              Ten link jest niekompletny. Odpisz na naszą wiadomość słowem „rezygnuję”, a wypiszemy Cię ręcznie.
            </p>
          )}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/" className="text-[#23479E] font-medium hover:underline">
            Strona główna
          </Link>
        </p>
      </div>
    </div>
  )
}
