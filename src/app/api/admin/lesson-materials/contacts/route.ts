import { createAdminClient } from '@/lib/supabase/server'
import { PRIVATE_RESPONSE_HEADERS, materialsUnsubscribeUrl } from '@/lib/lesson-materials/access'
import { canManageMaterialContacts, hasMaterialNewsletterConsent, type MaterialContact } from '@/lib/lesson-materials/contacts'

function csvCell(value: string) {
  const safe = /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

export async function GET() {
  if (!await canManageMaterialContacts()) return new Response(null, { status: 403, headers: PRIVATE_RESPONSE_HEADERS })
  const admin = createAdminClient()
  let cursor: string | undefined
  const lines = [['email', 'language', 'verified_at', 'newsletter_active', 'consent_version', 'unsubscribed_at', 'unsubscribe_url'].map(csvCell).join(',')]
  // Keyset pagination keeps the export complete beyond Supabase's row limit.
  for (;;) {
    let query = admin.from('lesson_material_contacts').select('*').order('id').limit(1000)
    if (cursor) query = query.gt('id', cursor)
    const { data, error } = await query
    if (error) return new Response('Eksport jest chwilowo niedostępny.', { status: 503, headers: PRIVATE_RESPONSE_HEADERS })
    const contacts = data as MaterialContact[]
    for (const contact of contacts) {
      const subscribed = hasMaterialNewsletterConsent(contact)
      lines.push([
        contact.email, contact.locale, contact.first_verified_at,
        String(subscribed), contact.newsletter_consent_version ?? '',
        contact.newsletter_unsubscribed_at ?? '',
        subscribed ? materialsUnsubscribeUrl(contact.id, contact.locale) : '',
      ].map(csvCell).join(','))
    }
    if (contacts.length < 1000) break
    cursor = contacts.at(-1)!.id
  }
  return new Response(`\ufeff${lines.join('\r\n')}`, {
    headers: {
      ...PRIVATE_RESPONSE_HEADERS, 'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="unick-materialy-kontakty.csv"',
    },
  })
}
