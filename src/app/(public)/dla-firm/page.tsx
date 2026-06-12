import Link from 'next/link'
import { BarChart3, GraduationCap, Calendar, FileText, Users, Globe, CheckCircle } from 'lucide-react'
import { B2bInquiryForm } from './B2bInquiryForm'

const VALUE_PROPS = [
  { icon: BarChart3, title: 'Raporty HR', desc: 'Szczegółowe raporty postępów dla działu HR i zarządu. Pełna transparentność.' },
  { icon: GraduationCap, title: 'Program na miarę', desc: 'Curriculum dopasowane do branży i potrzeb Twojego zespołu.' },
  { icon: Calendar, title: 'Elastyczny grafik', desc: 'Lekcje przed pracą, w przerwie lub po. Bez zakłócania normalnego rytmu firmy.' },
  { icon: FileText, title: 'Faktura VAT', desc: 'Pełna dokumentacja i faktury VAT do rozliczenia jako koszt firmowy.' },
  { icon: Users, title: 'Grupy i indywidualnie', desc: 'Szkolenia grupowe lub indywidualne, zależnie od potrzeb i poziomu pracownika.' },
  { icon: Globe, title: 'Online i stacjonarnie', desc: 'Dojeżdżamy do biura lub prowadzimy lekcje online. Twój wybór.' },
]

const PROCESS = [
  { n: '01', title: 'Bezpłatna konsultacja', desc: 'Rozmawiamy o celach, liczbie pracowników i budżecie.' },
  { n: '02', title: 'Propozycja programu', desc: 'Przygotowujemy spersonalizowany program i wycenę w 48h.' },
  { n: '03', title: 'Testy poziomu', desc: 'Sprawdzamy poziom każdego pracownika i przypisujemy do odpowiedniej grupy.' },
  { n: '04', title: 'Start lekcji', desc: 'Zaczynamy szkolenia. Raporty miesięczne trafiają automatycznie do HR.' },
]

const STATS = [
  { value: '200+', label: 'przeszkolonych pracowników' },
  { value: '4.9★', label: 'średnia ocena szkoleń' },
  { value: '35+', label: 'firm zaufało nam' },
  { value: '98%', label: 'firm przedłuża umowę' },
]

export default function DlaFirmPage() {
  return (
    <div className="flex flex-col">
      {/* Hero – ciemny granatowy */}
      <section className="py-24 px-4 gradient-navy text-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-[#4EC9B0]/20 text-[#4EC9B0] text-sm font-semibold mb-6 border border-cyan-400/30">
            Dla firm i korporacji
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Angielski, który podnosi{' '}
            <span className="text-[#4EC9B0]">wyniki Twojego zespołu</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Profesjonalne szkolenia językowe dla firm. Program dostosowany do branży, raportowanie dla HR, faktura VAT.
          </p>

          {/* Statystyki */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-black text-[#4EC9B0]">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/kontakt"
              className="px-8 py-4 bg-[#4EC9B0] text-gray-900 font-bold rounded-full text-lg hover:bg-[#3DB89C] transition-colors shadow-lg"
            >
              Umów bezpłatną konsultację
            </Link>
            <a
              href="mailto:hello@unick-academy.pl"
              className="px-8 py-4 text-white font-bold rounded-full border-2 border-white/20 hover:border-white/40 transition-colors text-lg"
            >
              hello@unick-academy.pl
            </a>
          </div>
        </div>
      </section>

      {/* Propozycje wartości */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-4">Co dostaje Twoja firma?</h2>
          <p className="text-center text-gray-500 mb-12">Kompleksowa obsługa od pierwszej konsultacji do raportu rocznego</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUE_PROPS.map((vp) => {
              const Icon = vp.icon
              return (
                <div key={vp.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-[#EAF3FF] flex items-center justify-center mb-4">
                    <Icon className="text-[#23479E]" size={22} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{vp.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{vp.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Proces współpracy */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-4">Jak wygląda współpraca?</h2>
          <p className="text-center text-gray-500 mb-12">Od pierwszego kontaktu do regularnych szkoleń w 5 dni</p>
          <div className="space-y-6">
            {PROCESS.map((step, i) => (
              <div key={step.n} className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-[#4EC9B0] text-lg font-black flex-shrink-0">
                  {step.n}
                </div>
                <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formularz kontaktowy B2B */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-4">Porozmawiajmy</h2>
          <p className="text-center text-gray-500 mb-10">Wypełnij formularz, oddzwonimy w ciągu 24h</p>
          <B2bInquiryForm />
        </div>
      </section>
    </div>
  )
}
