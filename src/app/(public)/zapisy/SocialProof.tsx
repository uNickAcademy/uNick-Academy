import { Quote, Star } from 'lucide-react'
import type { Testimonial } from '@/lib/social-proof'

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
  { value: 'ponad 10 lat', label: 'uczymy w Rumianku i online' },
  { value: 'maks. 8 osób', label: 'w grupie — każdy zdąży się odezwać' },
  { value: 'nauczyciele', label: 'z Polski i z zagranicy' },
]

export function TrustStrip() {
  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {FACTS.map((f) => (
          <div key={f.value} className="rounded-2xl bg-white/70 border border-gray-100 px-4 py-3 text-center">
            <p className="text-sm font-black text-[#23479E]">{f.value}</p>
            <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{f.label}</p>
          </div>
        ))}
      </div>
      <p className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-500">
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
