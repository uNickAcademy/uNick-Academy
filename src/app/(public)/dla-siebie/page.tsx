import Link from 'next/link'
import { Star, CheckCircle, ChevronDown } from 'lucide-react'
import type { LanguageLevel } from '@/types'

const TEACHERS = [
  {
    id: '1',
    name: 'Milly',
    role: 'Co-founder & Teacher',
    bio: 'Pasjonatka języka angielskiego z 8-letnim doświadczeniem. Specjalizuje się w konwersacjach biznesowych i przygotowaniu do egzaminów.',
    rating: 4.9,
    reviews: 124,
    levels: ['B1', 'B2', 'C1', 'C2'] as LanguageLevel[],
    image: '/teachers/milly.jpg',
    gradient: 'from-[#23479E] to-[#1C387D]',
  },
  {
    id: '2',
    name: 'Nick',
    role: 'Co-founder & Teacher',
    bio: 'Native speaker z Irlandii. Uczy angielskiego z humorem i pasją. Specjalizuje się w wymowie i codziennym angielskim.',
    rating: 4.9,
    reviews: 98,
    levels: ['A1', 'A2', 'B1', 'B2'] as LanguageLevel[],
    image: '/teachers/nick.jpg',
    gradient: 'from-[#4EC9B0] to-[#23479E]',
  },
  {
    id: '3',
    name: 'Anna',
    role: 'Teacher',
    bio: 'Certyfikowana nauczycielka z tytułem Cambridge DELTA. Ekspertka od angielskiego akademickiego i pracy dyplomowej.',
    rating: 4.8,
    reviews: 67,
    levels: ['B2', 'C1', 'C2'] as LanguageLevel[],
    image: '/teachers/anna.jpg',
    gradient: 'from-rose-400 to-pink-600',
  },
]

const STEPS = [
  { n: '01', title: 'Wybierz nauczyciela', desc: 'Przejrzyj profile i wybierz osobę, z którą chcesz się uczyć.' },
  { n: '02', title: 'Zarezerwuj termin', desc: 'Znajdź wolny slot w kalendarzu i zarezerwuj lekcję próbną.' },
  { n: '03', title: 'Zacznij mówić', desc: 'Dołącz do lekcji online lub offline i zacznij swoją przygodę z angielskim.' },
]

const REVIEWS = [
  { name: 'Kasia W.', text: 'Po 3 miesiącach z Milly wreszcie przestałam bać się mówić po angielsku w pracy. Polecam z całego serca!', rating: 5, level: 'B2' },
  { name: 'Marek T.', text: 'Nick to najlepszy nauczyciel jakiego miałem. Lekcje są super fun i naprawdę widać postępy.', rating: 5, level: 'B1' },
  { name: 'Ola K.', text: 'Zdałam IELTS 7.5 dzięki Annie. Niesamowite przygotowanie, bardzo polecam!', rating: 5, level: 'C1' },
]

const LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default function DlaSiebiePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 px-4 bg-[#FFF8F0] text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-[#23479E] text-sm font-semibold mb-6">
            Dla siebie
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
            Angielski, który pasuje{' '}
            <span className="text-[#23479E]">
              do Twojego życia
            </span>
          </h1>
          <p className="text-xl text-gray-500 mb-8 leading-relaxed">
            Lekcje online i offline, indywidualnie lub w grupie. Elastyczny grafik i nauczyciel dobrany do Twoich celów.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/zapisy"
              className="px-8 py-4 text-white font-bold rounded-full gradient-primary hover:opacity-90 transition-opacity text-lg shadow-lg shadow-blue-200"
            >
              Zarezerwuj lekcję próbną
            </Link>
            <Link
              href="#nauczyciele"
              className="px-8 py-4 text-gray-700 font-bold rounded-full bg-white border-2 border-gray-200 hover:border-violet-300 transition-colors text-lg"
            >
              Poznaj nauczycieli
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">Pierwsza lekcja próbna – bez zobowiązań</p>
        </div>
      </section>

      {/* Jak to działa */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-4">Jak to działa?</h2>
          <p className="text-center text-gray-500 mb-12">Trzy kroki do płynnego angielskiego</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-2xl font-black mx-auto mb-4">
                  {step.n}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nauczyciele */}
      <section id="nauczyciele" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-4">Nasi nauczyciele</h2>
          <p className="text-center text-gray-500 mb-6">Wszyscy nauczyciele są certyfikowani i z pasją do nauczania</p>

          {/* Filtr poziomów */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button className="px-4 py-2 rounded-full bg-[#23479E] text-white text-sm font-medium">Wszyscy</button>
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-[#23479E] hover:text-[#23479E] transition-colors"
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEACHERS.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Avatar placeholder */}
                <div className={`h-48 bg-gradient-to-br ${teacher.gradient} flex items-center justify-center`}>
                  <span className="text-6xl font-black text-white/80">{teacher.name[0]}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{teacher.name}</h3>
                      <p className="text-sm text-gray-500">{teacher.role}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-gray-700">{teacher.rating}</span>
                      <span className="text-xs text-gray-400">({teacher.reviews})</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{teacher.bio}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {teacher.levels.map((lvl) => (
                      <span key={lvl} className="px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#23479E] text-xs font-semibold">
                        {lvl}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/zapisy"
                    className="block w-full py-2 rounded-xl gradient-primary text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity"
                  >
                    Zarezerwuj
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opinie */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-12">Co mówią nasi uczniowie</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((review, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex mb-3">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{review.text}"</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">{review.name}</span>
                  <span className="text-xs bg-[#EAF3FF] text-[#23479E] px-2 py-0.5 rounded-full font-semibold">{review.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O Milly i Nicku */}
      <section className="py-20 px-4 bg-[#FFF8F0]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-4">Kim jesteśmy?</h2>
          <p className="text-center text-gray-500 mb-12">Historia uNick Academy</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: 'Milly', role: 'Co-founder', desc: 'Polska dusza szkoły. Tłumaczy angielski tak, żeby miał sens w polskiej głowie. Uwielbia kawy i lingwistykę.', gradient: 'from-[#23479E] to-[#1C387D]' },
              { name: 'Nick', role: 'Co-founder', desc: 'Irlandzki charakter szkoły. Przynosi do klasy prawdziwy angielski ze świata. Fan footbaLlu i dobrej herbaty.', gradient: 'from-[#4EC9B0] to-[#23479E]' },
            ].map((person) => (
              <div key={person.name} className="bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col sm:flex-row">
                <div className={`w-full sm:w-32 h-32 bg-gradient-to-br ${person.gradient} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-5xl font-black text-white/80">{person.name[0]}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900">{person.name}</h3>
                  <p className="text-sm text-[#23479E] font-medium mb-2">{person.role}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{person.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA końcowe */}
      <section className="py-20 px-4 gradient-primary text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-4">Gotowy/a zacząć?</h2>
          <p className="text-white/80 mb-8 text-lg">Pierwsza lekcja próbna gratis. Bez zobowiązań.</p>
          <Link
            href="/zapisy"
            className="inline-block px-8 py-4 bg-white text-[#23479E] font-bold rounded-full text-lg hover:bg-[#EAF3FF] transition-colors shadow-lg"
          >
            Zarezerwuj lekcję próbną
          </Link>
          <p className="mt-4 text-sm text-white/60">Odpowiadamy w ciągu 24h</p>
        </div>
      </section>
    </div>
  )
}
