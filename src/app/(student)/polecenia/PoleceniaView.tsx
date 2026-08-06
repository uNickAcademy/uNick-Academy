'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Share2, Gift } from 'lucide-react'
import { t, type Lang } from '@/lib/i18n'

type ReferralItem = { id: string; name: string; date: string; credit: number }
type PendingItem = {
  rola: 'polecajacy' | 'polecony'
  kwota: number; prog: number; wplacone: number; brakuje: number; postep: number
  drugaStrona: string
}

export function PoleceniaView({ lang, code, referrals, pending = [] }: {
  lang: Lang
  code: string
  referrals: ReferralItem[]
  pending?: PendingItem[]
}) {
  const pendingTotal = pending.reduce((s, p) => s + p.kwota, 0)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  // origin ustalamy dopiero po zamontowaniu — inaczej SSR renderuje względny
  // link, a klient absolutny, co daje ostrzeżenie o niezgodności hydracji.
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])
  const link = `${origin}/zapisy?ref=${code}`
  const totalEarned = referrals.reduce((s, r) => s + r.credit, 0)
  const locale = lang === 'en' ? 'en-GB' : 'pl-PL'

  const copy = async (text: string, type: 'code' | 'link') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-2">{t(lang, 'referral_program')}</h1>
      <p className="text-gray-500 mb-8">{t(lang, 'referral_sub')}</p>

      {/* Jak działa */}
      <div className="gradient-primary rounded-2xl p-6 text-white mb-6">
        <h2 className="font-bold text-lg mb-4">{t(lang, 'how_it_works')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/15 rounded-xl p-4">
            <Gift size={20} className="mb-2 text-white/80" />
            <p className="text-sm font-semibold">{t(lang, 'your_friend')}</p>
            <p className="text-white/70 text-xs mt-1">{t(lang, 'friend_gets')}</p>
          </div>
          <div className="bg-white/15 rounded-xl p-4">
            <Gift size={20} className="mb-2 text-white/80" />
            <p className="text-sm font-semibold">{t(lang, 'you')}</p>
            <p className="text-white/70 text-xs mt-1">{t(lang, 'you_get')}</p>
          </div>
        </div>
      </div>

      {/* Kredyt oczekujący — widoczny od razu po zapisie znajomego, ale
          świadomie NIE wliczony do salda: pieniądze pojawią się na koncie
          dopiero po opłaceniu zajęć za 250 zł. */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#F0DCC8] mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-[#1E3282]">Kredyt oczekujący</h2>
            <span className="text-sm font-bold text-[#B4321E]">{pendingTotal} zł</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Trafi na Twoje saldo, gdy druga strona opłaci zajęcia za 250 zł.
          </p>
          <div className="space-y-4">
            {pending.map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-700">
                    {p.rola === 'polecajacy' ? p.drugaStrona : `Polecenie od: ${p.drugaStrona}`}
                  </span>
                  <span className="font-semibold text-[#1E3282]">+{p.kwota} zł</span>
                </div>
                <div className="h-2 bg-[#F0DCC8] rounded-full overflow-hidden">
                  <div className="h-full bg-[#B4321E] rounded-full transition-all"
                       style={{ width: `${Math.min(p.postep, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {p.brakuje > 0
                    ? `Wpłacone ${p.wplacone} z ${p.prog} zł, brakuje ${p.brakuje} zł`
                    : 'Próg osiągnięty, kredyt zaraz trafi na saldo'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kod polecenia */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">{t(lang, 'your_unique_code')}</p>
        <div className="flex items-center justify-between bg-[#EAF3FF] rounded-xl px-5 py-4 mb-4">
          <span className="text-3xl font-black font-mono text-[#23479E] tracking-widest">{code}</span>
          <button
            onClick={() => copy(code, 'code')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-100 text-[#23479E] text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            {copied === 'code' ? <Check size={14} /> : <Copy size={14} />}
            {copied === 'code' ? t(lang, 'copied') : t(lang, 'copy')}
          </button>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-2">{t(lang, 'share_link')}</p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-600 flex-1 truncate font-mono">{link}</span>
          <button
            onClick={() => copy(link, 'link')}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-300 transition-colors"
          >
            {copied === 'link' ? <Check size={12} /> : <Share2 size={12} />}
            {copied === 'link' ? 'OK' : t(lang, 'copy')}
          </button>
        </div>
      </div>

      {/* Historia poleceń */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">{t(lang, 'referral_history')}</h2>
          {totalEarned > 0 && (
            <span className="text-sm font-bold text-[#23479E]">+{totalEarned} zł {t(lang, 'total_earned')}</span>
          )}
        </div>
        {referrals.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">{t(lang, 'no_referrals_yet')}</p>
        ) : (
          <div className="space-y-3">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600">+{r.credit} zł</span>
                  <p className="text-xs text-gray-400">{t(lang, 'credit')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
