'use client'

import { useState } from 'react'
import { Copy, Check, Share2, Gift } from 'lucide-react'

const REFERRAL_CODE = 'KASIA8F2A'
const REFERRAL_LINK = `https://unick.academy/zapisy?ref=${REFERRAL_CODE}`

const REFERRALS = [
  { name: 'Ania K.', date: '5 cze 2025', status: 'active', credit: 50 },
  { name: 'Marek T.', date: '15 maj 2025', status: 'active', credit: 50 },
]

export default function PoleceniaPage() {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const copy = async (text: string, type: 'code' | 'link') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-2">Program polecenia</h1>
      <p className="text-gray-500 mb-8">Zarabiaj kredyty, polecając uNick Academy znajomym</p>

      {/* Jak działa */}
      <div className="gradient-primary rounded-2xl p-6 text-white mb-6">
        <h2 className="font-bold text-lg mb-4">Jak to działa?</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/15 rounded-xl p-4">
            <Gift size={20} className="mb-2 text-white/80" />
            <p className="text-sm font-semibold">Twój znajomy</p>
            <p className="text-white/70 text-xs mt-1">dostaje <strong className="text-white">50 zł zniżki</strong> na pierwszą lekcję</p>
          </div>
          <div className="bg-white/15 rounded-xl p-4">
            <Gift size={20} className="mb-2 text-white/80" />
            <p className="text-sm font-semibold">Ty</p>
            <p className="text-white/70 text-xs mt-1">dostajesz <strong className="text-white">50 zł kredytu</strong> na kolejną lekcję</p>
          </div>
        </div>
      </div>

      {/* Kod polecenia */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Twój unikalny kod</p>
        <div className="flex items-center justify-between bg-[#EAF3FF] rounded-xl px-5 py-4 mb-4">
          <span className="text-3xl font-black font-mono text-[#23479E] tracking-widest">{REFERRAL_CODE}</span>
          <button
            onClick={() => copy(REFERRAL_CODE, 'code')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-100 text-[#23479E] text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            {copied === 'code' ? <Check size={14} /> : <Copy size={14} />}
            {copied === 'code' ? 'Skopiowano!' : 'Kopiuj'}
          </button>
        </div>

        <p className="text-sm font-semibold text-gray-700 mb-2">Link do udostępnienia</p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-600 flex-1 truncate font-mono">{REFERRAL_LINK}</span>
          <button
            onClick={() => copy(REFERRAL_LINK, 'link')}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-300 transition-colors"
          >
            {copied === 'link' ? <Check size={12} /> : <Share2 size={12} />}
            {copied === 'link' ? 'OK' : 'Kopiuj'}
          </button>
        </div>
      </div>

      {/* Historia poleceń */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Historia poleceń</h2>
          <span className="text-sm font-bold text-[#23479E]">+100 zł łącznie</span>
        </div>
        {REFERRALS.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Jeszcze nikt nie skorzystał z Twojego kodu</p>
        ) : (
          <div className="space-y-3">
            {REFERRALS.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600">+{r.credit} zł</span>
                  <p className="text-xs text-gray-400">kredyt</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
