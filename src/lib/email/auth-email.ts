import type { AuthEmailActionType, AuthEmailOtpType, AuthHookPayload } from '@/lib/auth/email-hook'

export type AuthEmailMessage = {
  to: string
  subject: string
  html: string
  text: string
}

type EmailContent = {
  title: string
  intro: string
  actionLabel?: string
  actionUrl?: string
  code?: string
  note?: string
}

const DEFAULT_APP_URL = 'https://unick-academy.pl'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function appUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL)
  } catch {
    return new URL(DEFAULT_APP_URL)
  }
}

function safeNextPath(redirectTo: string, fallback: string): string {
  try {
    const app = appUrl()
    const redirect = new URL(redirectTo)
    if (redirect.origin === app.origin) return `${redirect.pathname}${redirect.search}`
  } catch {
    // Supabase może przesłać pusty lub historyczny adres. Używamy bezpiecznego fallbacku.
  }
  return fallback
}

function confirmationUrl(tokenHash: string, type: AuthEmailOtpType, next: string): string {
  if (!tokenHash) throw new Error(`Brak token_hash dla wiadomości ${type}.`)
  const url = new URL('/auth/confirm', appUrl())
  url.searchParams.set('token_hash', tokenHash)
  url.searchParams.set('type', type)
  url.searchParams.set('next', next)
  return url.toString()
}

function renderEmail(firstName: string | null, content: EmailContent): { html: string; text: string } {
  const greeting = firstName ? `Cześć ${firstName},` : 'Cześć,'
  const app = appUrl()
  const logoUrl = new URL('/brand/logo-horizontal.jpeg', app).toString()
  const safeTitle = escapeHtml(content.title)
  const safeGreeting = escapeHtml(greeting)
  const safeIntro = escapeHtml(content.intro)
  const safeNote = content.note ? escapeHtml(content.note) : ''
  const safeActionUrl = content.actionUrl ? escapeHtml(content.actionUrl) : ''
  const safeActionLabel = content.actionLabel ? escapeHtml(content.actionLabel) : ''
  const safeCode = content.code ? escapeHtml(content.code) : ''

  const html = `<!doctype html>
<html lang="pl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:24px 12px;background:#FFF8F0;color:#172554;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${safeTitle}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #E8E1D8;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(35,71,158,.08);">
          <tr>
            <td style="padding:26px 36px 22px;border-top:6px solid #23479E;text-align:center;">
              <img src="${escapeHtml(logoUrl)}" width="220" alt="uNick Academy" style="display:inline-block;width:220px;max-width:75%;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td style="padding:10px 36px 36px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">${safeGreeting}</p>
              <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;color:#172554;font-weight:800;">${safeTitle}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#475569;">${safeIntro}</p>
              ${safeCode ? `<div style="margin:0 0 24px;padding:18px;text-align:center;background:#F2F6FF;border:1px solid #D9E4FF;border-radius:14px;"><p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;color:#23479E;">TWÓJ KOD</p><p style="margin:0;font-size:30px;font-weight:800;letter-spacing:.18em;color:#172554;">${safeCode}</p></div>` : ''}
              ${safeActionUrl ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;"><tr><td style="border-radius:999px;background:#23479E;"><a href="${safeActionUrl}" style="display:inline-block;padding:14px 26px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">${safeActionLabel}</a></td></tr></table>` : ''}
              ${safeNote ? `<p style="margin:0;padding:16px 18px;background:#FFF8F0;border-left:4px solid #D62B1F;border-radius:8px;font-size:13px;line-height:1.6;color:#64748b;">${safeNote}</p>` : ''}
              ${safeActionUrl ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br><a href="${safeActionUrl}" style="color:#23479E;word-break:break-all;">${safeActionUrl}</a></p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 36px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#64748b;">uNick Academy · angielski, który pomaga mówić odważniej</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;"><a href="mailto:hello@unick-academy.pl" style="color:#23479E;text-decoration:none;">hello@unick-academy.pl</a></p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`

  const text = [
    greeting,
    '',
    content.title,
    content.intro,
    content.code ? `Kod: ${content.code}` : '',
    content.actionUrl ? `${content.actionLabel}: ${content.actionUrl}` : '',
    content.note || '',
    '',
    'uNick Academy',
    'hello@unick-academy.pl',
  ].filter(Boolean).join('\n')

  return { html, text }
}

function message(to: string, subject: string, firstName: string | null, content: EmailContent): AuthEmailMessage {
  const rendered = renderEmail(firstName, content)
  return { to, subject, ...rendered }
}

function notificationContent(type: AuthEmailActionType, payload: AuthHookPayload): { subject: string; content: EmailContent } {
  const details: Partial<Record<AuthEmailActionType, { subject: string; title: string; intro: string }>> = {
    password_changed_notification: {
      subject: 'Twoje hasło zostało zmienione — uNick Academy',
      title: 'Hasło zostało zmienione',
      intro: 'Hasło do Twojego konta w uNick Academy zostało właśnie zmienione.',
    },
    email_changed_notification: {
      subject: 'Adres e-mail został zmieniony — uNick Academy',
      title: 'Adres e-mail został zmieniony',
      intro: 'Adres e-mail przypisany do Twojego konta w uNick Academy został zmieniony.',
    },
    phone_changed_notification: {
      subject: 'Numer telefonu został zmieniony — uNick Academy',
      title: 'Numer telefonu został zmieniony',
      intro: 'Numer telefonu przypisany do Twojego konta został zmieniony.',
    },
    identity_linked_notification: {
      subject: 'Nowa metoda logowania — uNick Academy',
      title: 'Dodano nową metodę logowania',
      intro: `Do Twojego konta dodano nową metodę logowania${payload.email_data.provider ? `: ${payload.email_data.provider}` : ''}.`,
    },
    identity_unlinked_notification: {
      subject: 'Usunięto metodę logowania — uNick Academy',
      title: 'Usunięto metodę logowania',
      intro: `Z Twojego konta usunięto metodę logowania${payload.email_data.provider ? `: ${payload.email_data.provider}` : ''}.`,
    },
    mfa_factor_enrolled_notification: {
      subject: 'Dodano dodatkowe zabezpieczenie — uNick Academy',
      title: 'Konto ma nowe zabezpieczenie',
      intro: 'Do Twojego konta dodano dodatkową metodę weryfikacji logowania.',
    },
    mfa_factor_unenrolled_notification: {
      subject: 'Usunięto dodatkowe zabezpieczenie — uNick Academy',
      title: 'Usunięto zabezpieczenie konta',
      intro: 'Z Twojego konta usunięto dodatkową metodę weryfikacji logowania.',
    },
  }
  const selected = details[type]
  if (!selected) throw new Error(`Nieobsługiwany typ powiadomienia: ${type}`)
  return {
    subject: selected.subject,
    content: {
      title: selected.title,
      intro: selected.intro,
      note: 'Jeśli to nie Ty, od razu ustaw nowe hasło i napisz do nas na hello@unick-academy.pl.',
    },
  }
}

export function buildAuthEmailMessages(payload: AuthHookPayload, firstName: string | null): AuthEmailMessage[] {
  const { user, email_data: email } = payload
  const type = email.email_action_type
  const safeFirstName = firstName?.trim().split(/\s+/)[0] || null

  if (type === 'recovery') {
    return [message(user.email, 'Ustaw nowe hasło — uNick Academy', safeFirstName, {
      title: 'Ustaw nowe hasło',
      intro: 'Otrzymaliśmy prośbę o ustawienie nowego hasła do Twojego konta.',
      actionLabel: 'Ustawiam nowe hasło',
      actionUrl: confirmationUrl(email.token_hash, 'recovery', '/reset-haslo'),
      note: 'Link jest jednorazowy i ma ograniczony czas ważności. Jeśli nie prosisz o zmianę hasła, po prostu zignoruj tę wiadomość.',
    })]
  }

  if (type === 'signup' || type === 'invite' || type === 'magiclink') {
    const copy = {
      signup: {
        subject: 'Potwierdź swój adres e-mail — uNick Academy',
        title: 'Potwierdź adres e-mail',
        intro: 'Potwierdź adres e-mail, aby bezpiecznie korzystać ze swojego konta.',
        label: 'Potwierdzam adres e-mail',
      },
      invite: {
        subject: 'Twoje konto w uNick Academy jest gotowe',
        title: 'Twoje konto jest gotowe',
        intro: 'Kliknij poniżej, aby aktywować konto i przejść do uNick Academy.',
        label: 'Aktywuję konto',
      },
      magiclink: {
        subject: 'Twój bezpieczny link do uNick Academy',
        title: 'Zaloguj się jednym kliknięciem',
        intro: 'Oto Twój jednorazowy, bezpieczny link do konta.',
        label: 'Loguję się',
      },
    }[type]
    const next = safeNextPath(email.redirect_to, '/dashboard')
    return [message(user.email, copy.subject, safeFirstName, {
      title: copy.title,
      intro: copy.intro,
      actionLabel: copy.label,
      actionUrl: confirmationUrl(email.token_hash, type, next),
      note: 'Jeśli nie oczekujesz tej wiadomości, możesz ją bezpiecznie zignorować.',
    })]
  }

  if (type === 'email_change') {
    const newEmail = user.new_email
    const next = safeNextPath(email.redirect_to, '/profil')
    const messages: AuthEmailMessage[] = []

    // Nazwy pól są odwrócone przez Supabase dla zgodności wstecznej:
    // token_hash_new potwierdza stary adres, token_hash — nowy adres.
    if (newEmail && email.token_hash_new && email.token_hash) {
      messages.push(message(user.email, 'Potwierdź zmianę adresu e-mail — uNick Academy', safeFirstName, {
        title: 'Potwierdź zmianę adresu e-mail',
        intro: `Potwierdź, że chcesz zmienić adres logowania na ${newEmail}.`,
        actionLabel: 'Potwierdzam zmianę',
        actionUrl: confirmationUrl(email.token_hash_new, 'email_change', next),
        note: 'Jeśli nie prosisz o tę zmianę, nie klikaj linku i skontaktuj się z nami.',
      }))
      messages.push(message(newEmail, 'Potwierdź nowy adres e-mail — uNick Academy', safeFirstName, {
        title: 'Potwierdź nowy adres e-mail',
        intro: 'Potwierdź, że ten adres ma być nowym adresem logowania do uNick Academy.',
        actionLabel: 'Potwierdzam nowy adres',
        actionUrl: confirmationUrl(email.token_hash, 'email_change', next),
        note: 'Jeśli nie oczekujesz tej wiadomości, możesz ją bezpiecznie zignorować.',
      }))
      return messages
    }

    const recipient = newEmail || user.email
    const tokenHash = email.token_hash || email.token_hash_new
    return [message(recipient, 'Potwierdź zmianę adresu e-mail — uNick Academy', safeFirstName, {
      title: 'Potwierdź nowy adres e-mail',
      intro: 'Potwierdź zmianę adresu używanego do logowania w uNick Academy.',
      actionLabel: 'Potwierdzam zmianę',
      actionUrl: confirmationUrl(tokenHash, 'email_change', next),
      note: 'Jeśli nie prosisz o tę zmianę, zignoruj wiadomość i skontaktuj się z nami.',
    })]
  }

  if (type === 'email' || type === 'reauthentication') {
    if (!email.token) throw new Error(`Brak kodu dla wiadomości ${type}.`)
    return [message(user.email, 'Kod bezpieczeństwa — uNick Academy', safeFirstName, {
      title: 'Twój kod bezpieczeństwa',
      intro: 'Wpisz ten jednorazowy kod w uNick Academy, aby potwierdzić operację.',
      code: email.token,
      note: 'Nikomu nie podawaj tego kodu. Zespół uNick Academy nigdy o niego nie poprosi.',
    })]
  }

  const notification = notificationContent(type, payload)
  return [message(user.email, notification.subject, safeFirstName, notification.content)]
}
