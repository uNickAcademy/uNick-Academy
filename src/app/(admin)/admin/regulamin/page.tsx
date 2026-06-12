import { getCurrentTerms, getConsentTypes, getConsentAcceptances } from '@/lib/supabase/queries'
import { TermsView } from './TermsView'

export const dynamic = 'force-dynamic'

export default async function RegulaminPage() {
  const [terms, consents, acceptances] = await Promise.all([
    getCurrentTerms(), getConsentTypes(), getConsentAcceptances(),
  ])
  return (
    <TermsView
      terms={terms ? { id: terms.id, version: terms.version, title: terms.title, content: terms.content } : null}
      consents={consents.map((c) => ({ id: c.id, label: c.label, description: c.description ?? '', required: c.required }))}
      acceptances={acceptances.map((a) => ({
        id: a.id, name: a.full_name ?? '—', email: a.email ?? '—',
        termsVersion: a.terms_version, consents: a.consents ?? {}, acceptedAt: a.accepted_at,
      }))}
    />
  )
}
