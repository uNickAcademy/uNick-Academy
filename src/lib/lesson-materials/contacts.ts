import { createClient } from '@/lib/supabase/server'

export type MaterialContact = {
  id: string
  email: string
  locale: 'pl' | 'en'
  first_verified_at: string
  last_verified_at: string
  newsletter_opted_in_at: string | null
  newsletter_consent_version: string | null
  newsletter_unsubscribed_at: string | null
}

export async function canManageMaterialContacts() {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return false
  const { data } = await auth.from('profiles').select('role').eq('id', user.id).single()
  return ['admin', 'reception'].includes(data?.role ?? '')
}

export function hasMaterialNewsletterConsent(contact: MaterialContact) {
  return contact.newsletter_opted_in_at !== null
    && (contact.newsletter_unsubscribed_at === null
      || contact.newsletter_opted_in_at > contact.newsletter_unsubscribed_at)
}
