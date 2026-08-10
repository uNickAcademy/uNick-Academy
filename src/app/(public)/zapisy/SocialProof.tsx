import { Quote, Star } from 'lucide-react'
import { TESTIMONIALS, type Testimonial } from '@/lib/social-proof'

// Pojedyncza opinia w kreatorze. Świadomie mała i spokojna — ma dodać powód,
// a nie odciągnąć uwagę od przycisku obok.
export function ProofQuote({ t }: { t: Testimonial | null }) {
  if (!t) return null
  return (
    <figure className="mt-5 rounded-2xl bg-[#FFF8F0] border border-amber-100 p-4">
      <Quote size={16} className="text-amber-400 mb-1.5" aria-hidden="true" />
      <blockquote className="text-xs text-gray-700 leading-relaxed">{t.quote}</blockquote>
      <figcaption className="mt-2 text-[11px] text-gray-400">
        <span className="font-semibold text-gray-500">{t.author}</span>
        {' · '}opinia z Facebooka, {t.date}
      </figcaption>
    </figure>
  )
}

// Pasek zaufania pod kreatorem. Pod, nie nad — nie chcemy spychać formularza
// poniżej pierwszego ekranu na telefonie, ale chcemy, żeby ktoś, kto zawaha się
// przed pierwszym kliknięciem, miał czego się złapać.
const FACTS: { value: string; label: string }[] = [
  { value: 'bez zobowiązań', label: 'przyjdź na pierwsze zajęcia i zdecyduj' },
  { value: 'ponad 10 lat', label: 'uczymy w Rumianku i online' },
  { value: 'maks. 8 osób', label: 'w grupie — każdy zdąży się odezwać' },
  { value: 'bez umów na rok', label: 'rezygnacja w każdej chwili' },
]

export function TrustStrip() {
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {FACTS.map((f) => (
          <div key={f.value} className="rounded-2xl bg-white/70 border border-gray-100 px-4 py-3 text-center">
            <p className="text-sm font-black text-[#23479E]">{f.value}</p>
            <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{f.label}</p>
          </div>
        ))}
      </div>
      <p className="flex items-center justify-center gap-1.5 mt-5 text-xs text-gray-500">
        <span className="flex" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
          ))}
        </span>
        Rekomendacje rodziców i uczniów na naszym Facebooku
      </p>
    </div>
  )
}

// Dowód na pierwszym ekranie. Wcześniej pasek zaufania kończył się zdaniem
// „mamy rekomendacje na Facebooku” — czyli deklaracją bez dowodu, a to jest
// dokładnie ten moment, w którym ktoś z reklamy decyduje, czy w ogóle zacząć.
// Dwie opinie zamiast jednej: rodzic i dorosły, bo na tym etapie nie wiemy,
// kto patrzy.
const FEATURED = ['Joanna Sobierajska', 'Martyna Bochyńska']

export function FeaturedProof() {
  const picked = FEATURED
    .map((a) => TESTIMONIALS.find((t) => t.author === a))
    .filter((t): t is Testimonial => Boolean(t))
  if (picked.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      {picked.map((t) => (
        <figure key={t.author} className="rounded-2xl bg-white/70 border border-gray-100 p-4">
          <Quote size={14} className="text-amber-400 mb-1.5" aria-hidden="true" />
          <blockquote className="text-xs text-gray-700 leading-relaxed">{t.quote}</blockquote>
          <figcaption className="mt-2 text-[11px] text-gray-400">
            <span className="font-semibold text-gray-500">{t.author}</span>
            {' · '}Facebook, {t.date}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
