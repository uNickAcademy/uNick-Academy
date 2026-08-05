'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

// Odpowiedzi na obawy, z którymi ludzie przychodzą — te same, które od lat
// padają w rozmowach i żyją na stronach /pl/children i /pl/adults. Problem
// w tym, że ktoś, kto trafia z reklamy prosto na /zapisy, nigdy ich nie widzi.
//
// Pokazujemy je w kroku 3, czyli dokładnie tam, gdzie rodzic wpisuje wiek
// dziecka i zastanawia się „czy to w ogóle dla nas".
type Worry = { q: string; a: string }

const CHILD_WORRIES: Worry[] = [
  {
    q: 'Moje dziecko nie umie usiedzieć w miejscu',
    a: 'Świetnie. Nasze lekcje nie są oparte na siedzeniu w miejscu — są oparte na rozmowie, ruchu, zabawie i odkrywaniu. Energia jest tu mile widziana.',
  },
  {
    q: 'Moje dziecko ma ADHD albo lęki',
    a: 'Wielu naszych uczniów też. Małe grupy, cierpliwi nauczyciele i zero oceniania oznaczają, że dziecko jest przyjmowane tam, gdzie jest — a nie tam, gdzie mówi podręcznik.',
  },
  {
    q: 'Moje dziecko jest nieśmiałe w grupie',
    a: 'Zaczynamy delikatnie — słuchanie, zabawa, włączanie się we własnym tempie. Pewność siebie rośnie z poczucia bezpieczeństwa, nie z presji.',
  },
]

const ADULT_WORRIES: Worry[] = [
  {
    q: 'Uczyłem się latami i nadal się blokuję',
    a: 'Rzadko chodzi o wiedzę. Chodzi o moment ciszy przed wypowiedzeniem słowa. Dlatego zaczynamy od mówienia, nie od kolejnego rozdziału gramatyki.',
  },
  {
    q: 'Wstyd mi mówić przy innych',
    a: 'Grupy są małe — do ośmiu osób, wszyscy na podobnym poziomie i wszyscy z tym samym oporem. Nikt nikogo nie ocenia, bo każdy jest w tym samym miejscu.',
  },
  {
    q: 'Nie mam czasu na regularne zajęcia',
    a: 'Zajęcia dla dorosłych są wieczorami, a jeśli grafik grupy nie pasuje — umówimy pojedyncze zajęcia indywidualne, dowolnej długości, w porze, którą wskażesz.',
  },
]

export function Worries({ audience }: { audience: 'child' | 'self' | null }) {
  const [open, setOpen] = useState<number | null>(null)
  const worries = audience === 'self' ? ADULT_WORRIES : CHILD_WORRIES

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
        {audience === 'self' ? 'Słyszymy to najczęściej' : 'Pytania, które zadaje nam każdy rodzic'}
      </p>
      <div className="space-y-1.5">
        {worries.map((w, i) => (
          <div key={w.q} className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs font-semibold text-gray-700">&bdquo;{w.q}&rdquo;</span>
              <ChevronDown
                size={15}
                className={`text-gray-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
            {open === i && (
              <p className="px-3.5 pb-3 text-xs text-gray-600 leading-relaxed">{w.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
