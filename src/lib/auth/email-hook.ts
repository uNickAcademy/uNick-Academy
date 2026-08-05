import { Webhook } from 'standardwebhooks'

export const AUTH_EMAIL_ACTION_TYPES = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
  'reauthentication',
  'password_changed_notification',
  'email_changed_notification',
  'phone_changed_notification',
  'identity_linked_notification',
  'identity_unlinked_notification',
  'mfa_factor_enrolled_notification',
  'mfa_factor_unenrolled_notification',
] as const

export type AuthEmailActionType = (typeof AUTH_EMAIL_ACTION_TYPES)[number]
export type AuthEmailOtpType = Extract<
  AuthEmailActionType,
  'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'
>

export type AuthHookUser = {
  id: string
  email: string
  new_email?: string
  user_metadata?: Record<string, unknown>
}

export type AuthHookPayload = {
  user: AuthHookUser
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: AuthEmailActionType
    site_url: string
    token_new: string
    token_hash_new: string
    old_email?: string
    old_phone?: string
    provider?: string
    factor_type?: string
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isActionType(value: unknown): value is AuthEmailActionType {
  return typeof value === 'string' && AUTH_EMAIL_ACTION_TYPES.includes(value as AuthEmailActionType)
}

export function parseAuthHookPayload(value: unknown): AuthHookPayload {
  if (!isRecord(value) || !isRecord(value.user) || !isRecord(value.email_data)) {
    throw new Error('Nieprawidłowy format danych webhooka.')
  }

  const user = value.user
  const emailData = value.email_data
  if (
    typeof user.id !== 'string' ||
    typeof user.email !== 'string' ||
    !user.email.includes('@') ||
    !isActionType(emailData.email_action_type)
  ) {
    throw new Error('Webhook nie zawiera wymaganych danych użytkownika.')
  }

  const stringValue = (key: string) => typeof emailData[key] === 'string' ? emailData[key] as string : ''

  return {
    user: {
      id: user.id,
      email: user.email,
      new_email: typeof user.new_email === 'string' ? user.new_email : undefined,
      user_metadata: isRecord(user.user_metadata) ? user.user_metadata : undefined,
    },
    email_data: {
      token: stringValue('token'),
      token_hash: stringValue('token_hash'),
      redirect_to: stringValue('redirect_to'),
      email_action_type: emailData.email_action_type,
      site_url: stringValue('site_url'),
      token_new: stringValue('token_new'),
      token_hash_new: stringValue('token_hash_new'),
      old_email: stringValue('old_email'),
      old_phone: stringValue('old_phone'),
      provider: stringValue('provider'),
      factor_type: stringValue('factor_type'),
    },
  }
}

function normalizedSecrets(value: string): string[] {
  return value
    .split('|')
    .map((secret) => secret.trim().replace(/^v1,whsec_/, ''))
    .filter(Boolean)
}

export function verifyAuthEmailHook(
  rawBody: string,
  headers: Record<string, string>,
  configuredSecrets: string,
): AuthHookPayload {
  const secrets = normalizedSecrets(configuredSecrets)
  if (secrets.length === 0) throw new Error('Brak sekretu webhooka.')

  let lastError: unknown
  for (const secret of secrets) {
    try {
      const payload = new Webhook(secret).verify(rawBody, headers)
      return parseAuthHookPayload(payload)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Nieprawidłowy podpis webhooka.')
}

export function metadataFirstName(user: AuthHookUser): string | null {
  const metadata = user.user_metadata
  if (!metadata) return null

  // Tylko pola, które jednoznacznie oznaczają imię. `full_name` bywa w bazie
  // zapisane jako „Nazwisko Imię” i wymaga osobnego rozpoznania.
  for (const key of ['first_name', 'given_name']) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) return value.trim().split(/\s+/)[0]
  }
  return null
}

export function metadataFullName(user: AuthHookUser): string | null {
  const metadata = user.user_metadata
  if (!metadata) return null

  for (const key of ['full_name', 'name']) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim() && !value.includes('@')) return value.trim()
  }
  return null
}
