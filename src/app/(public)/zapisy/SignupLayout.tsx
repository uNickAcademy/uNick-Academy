import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ConsultationProvider } from '@/app/components/ConsultationProvider'
import ConsultationButton from '@/app/components/ConsultationButton'
import { ActiveNowForm, type ActiveNowFormKey } from '@/app/components/ActiveNowForm'
import { TrustStrip, FeaturedProof } from './SocialProof'

// Wspólna oprawa obu stron zapisu. Formularz przychodzi z ActiveNow, więc rola
// tej strony kończy się na tym, żeby dać mu kontekst: po co tu jesteś, czemu
// warto nam zaufać i co zrobić, jeśli wolisz porozmawiać z człowiekiem.
export function SignupLayout({ form, title, lead }: {
  form: ActiveNowFormKey
  title: string
  lead: string
}) {
  return (
    <ConsultationProvider locale="pl">
      <div className="min-h-screen bg-[#FFF8F0] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/zapisy"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-[#23479E]">
            <ArrowLeft size={15} />Wszystkie zapisy
          </Link>

          <div className="mb-8 mt-4 text-center">
            <h1 className="mb-2 text-3xl font-black text-gray-900">{title}</h1>
            <p className="text-gray-500">{lead}</p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8">
            <ActiveNowForm form={form} />
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
