import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, UsersRound, User } from 'lucide-react'
import { ConsultationProvider } from '@/app/components/ConsultationProvider'
import ConsultationButton from '@/app/components/ConsultationButton'
import { TrustStrip, FeaturedProof } from './SocialProof'

// Rozdroże zapisów. Same formularze prowadzi ActiveNow — tam też idą lekcje
// i płatności — a ta strona tylko kieruje na właściwy z dwóch.
//
// Stare adresy z kreatora (?tryb=grupa, ?tryb=indywidualnie) wciąż krążą w
// reklamach i na starych materiałach, więc przepuszczamy je dalej zamiast
// zostawiać na rozdrożu.
const PATHS = [
  {
    href: '/zapisy/grupowe',
    icon: UsersRound,
    title: 'Zajęcia grupowe',
    text: 'Małe grupy, maksymalnie 8 osób. Stacjonarnie w Rumianku albo online.',
  },
  {
    href: '/zapisy/indywidualne',
    icon: User,
    title: 'Zajęcia indywidualne',
    text: 'Lekcje jeden na jeden, w terminie dopasowanym do Ciebie.',
  },
]

export default async function ZapisyPage({ searchParams }: {
  searchParams: Promise<{ tryb?: string }>
}) {
  const { tryb } = await searchParams
  if (tryb === 'grupa') redirect('/zapisy/grupowe')
  if (tryb === 'indywidualnie') redirect('/zapisy/indywidualne')

  return (
    <ConsultationProvider locale="pl">
      <div className="min-h-screen bg-[#FFF8F0] px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-black text-gray-900">Zapisz się na zajęcia</h1>
            <p className="text-gray-500">Wybierz, czego szukacie. Formularz zajmie chwilę.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PATHS.map((p) => (
              <Link key={p.href} href={p.href}
                className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-xl transition-colors hover:border-[#23479E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#23479E]">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#23479E]">
                  <p.icon size={22} />
                </span>
                <span className="text-lg font-black text-gray-900">{p.title}</span>
                <span className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-500">{p.text}</span>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#23479E]">
                  Przejdź do zapisu
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          <TrustStrip />
          <FeaturedProof />

          <div className="mt-6 text-center">
            <ConsultationButton>Wolę porozmawiać z człowiekiem</ConsultationButton>
          </div>
        </div>
      </div>
    </ConsultationProvider>
  )
}
