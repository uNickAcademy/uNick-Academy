'use client'

import { useState } from 'react'
import { Plus, Minus, Gift } from 'lucide-react'

const REFERRAL_CODES = [
  { code: 'KASIA8F2A', owner: 'Kasia Wiśniewska', uses: 2, credit: 100, referred: ['Ania Lewandowska – 5 cze 2025', 'Marek Tomaszewski – 15 maj 2025'] },
  { code: 'MAREK9B3C', owner: 'Marek Tomaszewski', uses: 0, credit: 0, referred: [] },
  { code: 'OLAKM7D1E', owner: 'Ola Kamińska', uses: 1, credit: 50, referred: ['Piotr Nowak – 10 cze 2025'] },
]

export default function PoleceniaAdminPage() {
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Polecenia</h1>

      <div className="space-y-4">
        {REFERRAL_CODES.map((ref) => (
          <div key={ref.code} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xl font-black font-mono text-[#23479E] tracking-widest">{ref.code}</span>
                  <span className="text-sm bg-[#EAF3FF] text-[#23479E] px-2.5 py-0.5 rounded-full font-semibold">
                    {ref.uses} {ref.uses === 1 ? 'użycie' : 'użycia'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Właściciel: <strong className="text-gray-700">{ref.owner}</strong></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Zarobiony kredyt</p>
                <p className="text-2xl font-black text-[#23479E]">{ref.credit} zł</p>
              </div>
            </div>

            {ref.referred.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Polecone osoby</p>
                <div className="space-y-1.5">
                  {ref.referred.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <Gift size={12} className="text-violet-400" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ręczna korekta kredytu */}
            {adjustId === ref.code ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Kwota (np. 50 lub -50)"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]"
                />
                <button
                  className="px-4 py-2 rounded-xl bg-[#23479E] text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
                  onClick={() => { setAdjustId(null); setAdjustAmount('') }}
                >
                  Zastosuj
                </button>
                <button
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setAdjustId(null)}
                >
                  Anuluj
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAdjustId(ref.code)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#23479E] transition-colors font-medium"
              >
                <Plus size={12} />
                Korekta kredytu ręcznie
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
