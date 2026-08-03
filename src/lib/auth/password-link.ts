import type { SupabaseClient } from '@supabase/supabase-js'

// Link ustawiający hasło do konta założonego automatycznie przy zapisie.
//
// Do tej pory ekran sukcesu odsyłał świeżo zapisaną osobę na /zapomniane-haslo
// — czyli do odzyskiwania hasła, którego nigdy nie miała. Zamiast tego
// generujemy link jednorazowy i wysyłamy go w mailu potwierdzającym.
//
// Typ `recovery`, nie `invite`: konto już istnieje (tworzy je RPC zapisu),
// a `invite` działa wyłącznie dla adresów jeszcze niezarejestrowanych.
export async function createPasswordSetupLink(
  admin: SupabaseClient,
  email: string
): Promise<string | null> {
  const base = process.env.NEXT_PUBLIC_APP_URL || ''
  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${base}/reset-haslo` },
    })
    if (error) {
      console.error('[PasswordLink] generateLink error:', error)
      return null
    }
    return data?.properties?.action_link ?? null
  } catch (err) {
    // Brak linku nie może wywrócić zapisu — klient dostanie maila bez niego
    // i zawsze może ustawić hasło przez /zapomniane-haslo.
    console.error('[PasswordLink] error:', err)
    return null
  }
}
