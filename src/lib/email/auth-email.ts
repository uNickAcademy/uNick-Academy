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
  const logoUrl = new URL('/brand/unick-academy-logo.png', app).toString()
  const safeTitle = escapeHtml(content.title)
  const safeGreeting = escapeHtml(greeting)
  const safeIntro = escapeHtml(content.intro)
  const safeNote = content.note ? escapeHtml(content.note) : ''
  const safeActionUrl = content.actionUrl ? escapeHtml(content.actionUrl) : ''
  const safeActionLabel = content.actionLabel ? escapeHtml(content.actionLabel) : ''
  const safeCode = content.code ? escapeHtml(content.code) : ''

  const html = `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Comfortaa:wght@400;600&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:24px 12px;background:#F0DCC8;color:#1E3282;font-family:'Comfortaa','Trebuchet MS',Verdana,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${safeTitle}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 40px 8px;text-align:center;">
              <img src="${escapeHtml(logoUrl)}" width="180" alt="uNick Academy" style="display:inline-block;width:180px;max-width:75%;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 32px;">
              <h1 style="margin:0 0 14px;font-family:'Poppins','Trebuchet MS',Verdana,sans-serif;font-size:22px;line-height:1.2;color:#1E3282;font-weight:700;">${safeGreeting}</h1>
              <p style="margin:0 0 8px;font-family:'Poppins','Trebuchet MS',Verdana,sans-serif;font-size:17px;line-height:1.4;color:#1E3282;font-weight:600;">${safeTitle}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#1E3282;">${safeIntro}</p>
              ${safeCode ? `<div style="margin:0 0 24px;padding:18px;text-align:center;background:#F0DCC8;border-radius:14px;"><p style="margin:0 0 6px;font-family:'Poppins','Trebuchet MS',Verdana,sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;color:#1E3282;">TWÓJ KOD</p><p style="margin:0;font-size:30px;font-weight:800;letter-spacing:.18em;color:#1E3282;">${safeCode}</p></div>` : ''}
              ${safeActionUrl ? `<div style="text-align:center;margin:0 0 20px;"><a href="${safeActionUrl}" style="display:inline-block;padding:14px 30px;background:#B4321E;color:#FFFFFF;font-family:'Poppins','Trebuchet MS',Verdana,sans-serif;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;letter-spacing:0.5px;">${safeActionLabel}</a></div>` : ''}
              ${safeNote ? `<p style="margin:0;font-size:13px;line-height:1.6;color:#6B7280;">${safeNote}</p>` : ''}
              ${safeActionUrl ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br><a href="${safeActionUrl}" style="color:#1E3282;word-break:break-all;">${safeActionUrl}</a></p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background:#F0DCC8;padding:18px 40px;text-align:center;">
              <p style="color:#1E3282;font-size:12px;margin:0;">uNick Academy, <a href="mailto:hello@unick-academy.pl" style="color:#1E3282;text-decoration:none;">hello@unick-academy.pl</a></p>
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
      subject: 'Twoje hasło zostało zmienione w uNick Academy',
      title: 'Hasło zostało zmienione',
      intro: 'Hasło do Twojego konta w uNick Academy zostało właśnie zmienione.',
    },
    email_changed_notification: {
      subject: 'Adres e-mail został zmieniony w uNick Academy',
      title: 'Adres e-mail został zmieniony',
      intro: 'Adres e-mail przypisany do Twojego konta w uNick Academy został zmieniony.',
    },
    phone_changed_notification: {
      subject: 'Numer telefonu został zmieniony w uNick Academy',
      title: 'Numer telefonu został zmieniony',
      intro: 'Numer telefonu przypisany do Twojego konta został zmieniony.',
    },
    identity_linked_notification: {
      subject: 'Nowa metoda logowania w uNick Academy',
      title: 'Dodano nową metodę logowania',
      intro: `Do Twojego konta dodano nową metodę logowania${payload.email_data.provider ? `: ${payload.email_data.provider}` : ''}.`,
    },
    identity_unlinked_notification: {
      subject: 'Usunięto metodę logowania w uNick Academy',
      title: 'Usunięto metodę logowania',
      intro: `Z Twojego konta usunięto metodę logowania${payload.email_data.provider ? `: ${payload.email_data.provider}` : ''}.`,
    },
    mfa_factor_enrolled_notification: {
      subject: 'Dodano dodatkowe zabezpieczenie w uNick Academy',
      title: 'Konto ma nowe zabezpieczenie',
      intro: 'Do Twojego konta dodano dodatkową metodę weryfikacji logowania.',
    },
    mfa_factor_unenrolled_notification: {
      subject: 'Usunięto dodatkowe zabezpieczenie w uNick Academy',
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
    return [message(user.email, 'Ustaw nowe hasło w uNick Academy', safeFirstName, {
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
        subject: 'Potwierdź swój adres e-mail w uNick Academy',
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
    // token_hash_new potwierdza stary adres, token_hash potwierdza nowy adres.
    if (newEmail && email.token_hash_new && email.token_hash) {
      messages.push(message(user.email, 'Potwierdź zmianę adresu e-mail w uNick Academy', safeFirstName, {
        title: 'Potwierdź zmianę adresu e-mail',
        intro: `Potwierdź, że chcesz zmienić adres logowania na ${newEmail}.`,
        actionLabel: 'Potwierdzam zmianę',
        actionUrl: confirmationUrl(email.token_hash_new, 'email_change', next),
        note: 'Jeśli nie prosisz o tę zmianę, nie klikaj linku i skontaktuj się z nami.',
      }))
      messages.push(message(newEmail, 'Potwierdź nowy adres e-mail w uNick Academy', safeFirstName, {
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
    return [message(recipient, 'Potwierdź zmianę adresu e-mail w uNick Academy', safeFirstName, {
      title: 'Potwierdź nowy adres e-mail',
      intro: 'Potwierdź zmianę adresu używanego do logowania w uNick Academy.',
      actionLabel: 'Potwierdzam zmianę',
      actionUrl: confirmationUrl(tokenHash, 'email_change', next),
      note: 'Jeśli nie prosisz o tę zmianę, zignoruj wiadomość i skontaktuj się z nami.',
    })]
  }

  if (type === 'email' || type === 'reauthentication') {
    if (!email.token) throw new Error(`Brak kodu dla wiadomości ${type}.`)
    return [message(user.email, 'Kod bezpieczeństwa w uNick Academy', safeFirstName, {
      title: 'Twój kod bezpieczeństwa',
      intro: 'Wpisz ten jednorazowy kod w uNick Academy, aby potwierdzić operację.',
      code: email.token,
      note: 'Nikomu nie podawaj tego kodu. Zespół uNick Academy nigdy o niego nie poprosi.',
    })]
  }

  const notification = notificationContent(type, payload)
  return [message(user.email, notification.subject, safeFirstName, notification.content)]
}
