import { getAllTeachers, getCurrentTerms, getConsentTypes, getPublicGroups, getPublicAvailability } from '@/lib/supabase/queries'
import { BookingWizard } from './BookingWizard'
import { ConsultationProvider } from '@/app/components/ConsultationProvider'
import ConsultationButton from '@/app/components/ConsultationButton'

export const dynamic = 'force-dynamic'

export default async function ZapisyPage() {
  const [teachers, terms, consents, groups, availability] = await Promise.all([
    getAllTeachers(), getCurrentTerms(), getConsentTypes(), getPublicGroups(), getPublicAvailability(),
  ])

  return (
    <ConsultationProvider locale="pl">
    <div className="min-h-screen bg-[#FFF8F0] py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Zapisz się na zajęcia</h1>
          <p className="text-gray-500 mb-6">Wybierz formę nauki, która Ci pasuje</p>
          <ConsultationButton fullWidth>Bezpłatna konsultacja</ConsultationButton>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <BookingWizard
            teachers={teachers.map((t) => ({
              id: t.id, name: t.profile?.full_name ?? '—', levels: (t.levels ?? []) as string[],
              rating: Number(t.rating), color: t.color, availability: availability[t.id] ?? [],
            }))}
            groups={groups}
            terms={terms ? { version: terms.version, title: terms.title, content: terms.content } : null}
            consents={consents.map((c) => ({ id: c.id, label: c.label, description: c.description ?? '', required: c.required }))}
          />
        </div>
      </div>
    </div>
    </ConsultationProvider>
  )
}
