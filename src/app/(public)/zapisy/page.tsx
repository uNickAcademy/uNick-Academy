import { getCurrentTerms, getConsentTypes, getPublicGroups } from '@/lib/supabase/queries'
import { BookingWizard } from './BookingWizard'
import { ConsultationProvider } from '@/app/components/ConsultationProvider'
import ConsultationButton from '@/app/components/ConsultationButton'
import { TrustStrip } from './SocialProof'

export const dynamic = 'force-dynamic'

// Kreator nie wybiera już nauczyciela ani slotu — zajęcia indywidualne idą do
// rozmowy diagnostycznej — więc grafiki nauczycieli nie są tu potrzebne.
export default async function ZapisyPage() {
  const [terms, consents, groups] = await Promise.all([
    getCurrentTerms(), getConsentTypes(), getPublicGroups(),
  ])

  return (
    <ConsultationProvider locale="pl">
    <div className="min-h-screen bg-[#FFF8F0] py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Zapisz się na zajęcia</h1>
          <p className="text-gray-500">Pięć krótkich kroków — albo jeden, jeśli wolisz, żebyśmy doradzili</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <BookingWizard
            groups={groups}
            terms={terms ? { version: terms.version, title: terms.title, content: terms.content } : null}
            consents={consents.map((c) => ({ id: c.id, label: c.label, description: c.description ?? '', required: c.required }))}
          />
        </div>
        <TrustStrip />

        <div className="text-center mt-6">
          <ConsultationButton>Wolę porozmawiać z człowiekiem</ConsultationButton>
        </div>
      </div>
    </div>
    </ConsultationProvider>
  )
}
