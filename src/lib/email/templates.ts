// Kanoniczne dane kontaktowe i profile społecznościowe, wspólne ze stroną
// i danymi strukturalnymi SEO.
import { siteConfig } from '@/app/lib/site-config'

// Wspólne style dla wszystkich emaili uNick Academy

const BASE_STYLE = `
  font-family: 'Inter', Arial, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  background: #ffffff;
  color: #0f172a;
`

const HEADER = `
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
    <h1 style="color: white; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">uNick Academy</h1>
  </div>
`

const FOOTER = `
  <div style="background: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px;">uNick Academy · hello@unick-academy.pl</p>
    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">Jeśli nie oczekiwałeś/aś tego emaila, zignoruj go.</p>
  </div>
`

function wrap(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background: #f1f5f9;">
      <div style="${BASE_STYLE}">
        ${HEADER}
        <div style="padding: 32px 40px;">
          ${content}
        </div>
        ${FOOTER}
      </div>
    </body>
    </html>
  `
}

function btn(label: string, url: string): string {
  return `
    <a href="${url}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 50px; margin-top: 8px;">
      ${label}
    </a>
  `
}

// ──────────────────────────────────────────
// 0. Wiadomość masowa (dowolna treść od admina)
// ──────────────────────────────────────────
export function bulkMessageEmail(name: string, subject: string, body: string): { subject: string; html: string } {
  // body: zwykły tekst od admina – zamieniamy nowe linie na <br>
  const safe = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  return {
    subject,
    html: wrap(`
      <p style="font-size: 16px; margin: 0 0 16px;">Cześć ${name}! 👋</p>
      <div style="font-size: 15px; line-height: 1.6; color: #334155;">${safe}</div>
      <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 0;">Zespół uNick Academy</p>
    `),
  }
}

// ──────────────────────────────────────────
// 0a. Powiadomienie wewnętrzne do szkoły (nowy zapis, konsultacja, zapytanie)
// ──────────────────────────────────────────
export function internalNotificationEmail(params: {
  title: string
  lines: string[]
  actionLabel?: string
  actionPath?: string
}): { subject: string; html: string } {
  const { title, lines, actionLabel, actionPath } = params
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const rows = lines.filter(Boolean).map((l) =>
    `<p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 6px;">${esc(l)}</p>`
  ).join('')
  return {
    subject: title,
    html: wrap(`
      <h2 style="font-size: 20px; font-weight: 900; margin: 0 0 16px;">${esc(title)}</h2>
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #7c3aed;">
        ${rows}
      </div>
      ${actionPath ? btn(actionLabel || 'Otwórz w panelu →', `${process.env.NEXT_PUBLIC_APP_URL}${actionPath}`) : ''}
      <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0;">
        Powiadomienie wewnętrzne uNick Academy.
      </p>
    `),
  }
}

// ──────────────────────────────────────────
// 1. Email powitalny
// ──────────────────────────────────────────
export function welcomeEmail(name: string, referralCode: string): { subject: string; html: string } {
  return {
    subject: `Witaj w uNick Academy, ${name.split(' ')[0]}! 🦄`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Witaj, ${name.split(' ')[0]}! 👋</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
        Cieszymy się, że dołączasz do uNick Academy! Twoja przygoda z angielskim właśnie się zaczyna.
      </p>

      <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #7c3aed; font-size: 13px; font-weight: 600; margin: 0 0 8px;">TWÓJ KOD POLECENIA</p>
        <p style="font-size: 28px; font-weight: 900; font-family: monospace; letter-spacing: 4px; color: #5b21b6; margin: 0;">${referralCode}</p>
        <p style="color: #6d28d9; font-size: 12px; margin: 8px 0 0;">Poleć znajomym i zarabiaj 50 zł kredytu za każdą osobę!</p>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
        Zaloguj się do portalu, żeby zobaczyć swoje lekcje, postępy i rozliczenia.
      </p>

      ${btn('Przejdź do portalu →', `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        Pytania? Napisz do nas: <a href="mailto:hello@unick-academy.pl" style="color: #7c3aed;">hello@unick-academy.pl</a>
      </p>
    `),
  }
}

// ──────────────────────────────────────────
// 2. Potwierdzenie lekcji
// ──────────────────────────────────────────
export function lessonConfirmationEmail(params: {
  studentName: string
  teacherName: string
  date: string
  time: string
  topic: string
  type: 'online' | 'offline'
  meetLink?: string
}): { subject: string; html: string } {
  const { studentName, teacherName, date, time, topic, type, meetLink } = params
  return {
    subject: `Lekcja potwierdzona: ${date} o ${time} 📅`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Lekcja zarezerwowana! ✅</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! Twoja lekcja jest potwierdzona.
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #7c3aed;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Nauczyciel</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${teacherName}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Data</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${date}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Godzina</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${time}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Temat</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${topic || 'Do ustalenia'}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Format</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${type === 'online' ? '🖥️ Online' : '📍 Stacjonarnie'}</td></tr>
        </table>
      </div>

      ${type === 'online' && meetLink ? `
        <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">Link do lekcji:</p>
        ${btn('Dołącz do lekcji →', meetLink)}
      ` : `
        <p style="color: #475569; font-size: 14px; margin: 0 0 16px;">Lekcja odbywa się stacjonarnie. Adres wyślemy osobno.</p>
      `}

      <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
        Dostaniesz przypomnienie 24h przed lekcją.
      </p>
    `),
  }
}

// ──────────────────────────────────────────
// 2a. Zapis przyjęty — czeka na potwierdzenie terminu przez szkołę
// ──────────────────────────────────────────
export function bookingReceivedEmail(params: {
  studentName: string
  teacherName: string
  date: string
  time: string
}): { subject: string; html: string } {
  const { studentName, teacherName, date, time } = params
  return {
    subject: 'Dziękujemy za zapis! Potwierdzimy termin wkrótce ⏳',
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Mamy Twój zapis! 🎉</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! Dziękujemy za zapis na lekcje w uNick Academy.
        Sprawdzamy jeszcze dostępność nauczyciela — gdy tylko potwierdzimy termin,
        wyślemy Ci maila z linkiem do zajęć i płatnością za pierwszą lekcję.
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #7c3aed;">
        <p style="color: #94a3b8; font-size: 12px; font-weight: 600; margin: 0 0 12px;">WSTĘPNIE WYBRANY TERMIN</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Nauczyciel</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${teacherName}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Data</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${date}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Godzina</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${time}</td></tr>
        </table>
      </div>

      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        To jeszcze nie jest potwierdzenie — nic nie musisz teraz robić. Odezwiemy się najszybciej, jak to możliwe.
      </p>
    `),
  }
}

// ──────────────────────────────────────────
// 2b. Zapis zatwierdzony przez szkołę + płatność za pierwszą lekcję
// ──────────────────────────────────────────
export function bookingApprovedEmail(params: {
  studentName: string
  teacherName: string
  date: string
  time: string
  meetLink?: string
  amount?: number | null
  paymentUrl?: string | null
  recurring?: boolean
}): { subject: string; html: string } {
  const { studentName, teacherName, date, time, meetLink, amount, paymentUrl, recurring } = params
  return {
    subject: `Termin potwierdzony: ${date} o ${time} ✅`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Termin potwierdzony! ✅</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! Wszystko gotowe — poniżej szczegóły Twoich zajęć.
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #7c3aed;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Nauczyciel</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${teacherName}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Pierwsza lekcja</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${date}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Godzina</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${time}</td></tr>
          ${recurring ? `<tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Cykl</td><td style="font-weight: 700; font-size: 14px; text-align: right;">co tydzień o tej porze</td></tr>` : ''}
        </table>
      </div>

      ${meetLink ? `
        <p style="color: #475569; font-size: 14px; margin: 0 0 8px;">Link do zajęć (ten sam na każdą lekcję):</p>
        <p style="margin: 0 0 24px;"><a href="${meetLink}" style="color: #7c3aed; font-size: 14px;">${meetLink}</a></p>
      ` : ''}

      ${paymentUrl && amount ? `
        <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin-bottom: 8px; text-align: center;">
          <p style="color: #6d28d9; font-size: 13px; font-weight: 600; margin: 0 0 4px;">DO ZAPŁATY ZA PIERWSZĄ LEKCJĘ</p>
          <p style="font-size: 28px; font-weight: 900; color: #5b21b6; margin: 0 0 12px;">${amount} zł</p>
          ${btn('Zapłać teraz →', paymentUrl)}
          <p style="color: #8b5cf6; font-size: 12px; margin: 12px 0 0;">BLIK, Przelewy24 lub karta</p>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0;">
          Kolejne płatności będziemy przypominać e-mailem 1. dnia każdego miesiąca, z góry za dany miesiąc.
        </p>
      ` : `
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Szczegóły płatności prześlemy osobno.</p>
      `}
    `),
  }
}

// ──────────────────────────────────────────
// 2c. Miesięczna płatność z góry (1. dnia miesiąca)
// ──────────────────────────────────────────
export function monthlyPaymentEmail(params: {
  studentName: string
  monthLabel: string
  amount: number
  paymentUrl?: string | null
  /** Rozbicie na uczestników — rodzina dostaje jeden rachunek za wszystkich. */
  items?: { name: string; amount: number }[]
}): { subject: string; html: string } {
  const { studentName, monthLabel, amount, paymentUrl, items } = params
  const family = (items?.length ?? 0) > 1

  const breakdown = family
    ? `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        ${items!.map((i) => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px;">${i.name}</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; text-align: right; font-weight: 600;">${i.amount} zł</td>
          </tr>`).join('')}
      </table>`
    : ''

  return {
    subject: `Płatność za ${monthLabel} — ${amount} zł`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Płatność za ${monthLabel}</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! ${family
          ? `To rachunek za zajęcia w miesiącu ${monthLabel} — jedna płatność za wszystkich uczestników, z góry.`
          : `To przypomnienie o opłacie za zajęcia w miesiącu ${monthLabel} — płatnej z góry.`}
      </p>

      ${breakdown}

      <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #6d28d9; font-size: 13px; font-weight: 600; margin: 0 0 4px;">${family ? 'RAZEM DO ZAPŁATY' : 'DO ZAPŁATY'}</p>
        <p style="font-size: 28px; font-weight: 900; color: #5b21b6; margin: 0 0 12px;">${amount} zł</p>
        ${paymentUrl ? btn('Zapłać teraz →', paymentUrl) : ''}
        ${paymentUrl ? `<p style="color: #8b5cf6; font-size: 12px; margin: 12px 0 0;">BLIK, Przelewy24 lub karta</p>` : ''}
      </div>

      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        Saldo i historię płatności zobaczysz w
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/platnosci" style="color: #7c3aed;">panelu ucznia</a>.
      </p>
    `),
  }
}

// ──────────────────────────────────────────
// 3. Przypomnienie 24h przed lekcją
// ──────────────────────────────────────────
export function lessonReminderEmail(params: {
  studentName: string
  teacherName: string
  date: string
  time: string
  type: 'online' | 'offline'
  meetLink?: string
}): { subject: string; html: string } {
  const { studentName, teacherName, date, time, type, meetLink } = params
  return {
    subject: `Przypomnienie: lekcja jutro o ${time} ⏰`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Lekcja jutro! ⏰</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! Przypominamy o jutrzejszej lekcji.
      </p>

      <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; font-size: 18px; font-weight: 900; color: #92400e;">${date} · ${time}</p>
        <p style="margin: 4px 0 0; color: #78350f; font-size: 14px;">z ${teacherName} · ${type === 'online' ? 'Online' : 'Stacjonarnie'}</p>
      </div>

      ${type === 'online' && meetLink ? btn('Dołącz do lekcji →', meetLink) : ''}

      <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
        Powodzenia! 🦄
      </p>
    `),
  }
}

// ──────────────────────────────────────────
// 4. Powiadomienie o zaległości
// ──────────────────────────────────────────
export function overdueEmail(params: {
  studentName: string
  amount: number
  dueDate: string
}): { subject: string; html: string } {
  const { studentName, amount, dueDate } = params
  return {
    subject: `Przypomnienie o płatności – ${amount} zł`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Masz zaległość do uregulowania</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! Zauważyliśmy niezapłaconą należność.
      </p>

      <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #ef4444;">
        <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: 600;">DO ZAPŁATY</p>
        <p style="margin: 4px 0 8px; font-size: 32px; font-weight: 900; color: #dc2626;">${amount} zł</p>
        <p style="margin: 0; font-size: 13px; color: #b91c1c;">Termin: ${dueDate}</p>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
        Ureguluj płatność, żeby kontynuować lekcje bez przerwy. Akceptujemy BLIK i Przelewy24.
      </p>

      ${btn('Zapłać teraz →', `${process.env.NEXT_PUBLIC_APP_URL}/platnosci`)}

      <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
        Masz pytania? Napisz na <a href="mailto:hello@unick-academy.pl" style="color: #7c3aed;">hello@unick-academy.pl</a>
      </p>
    `),
  }
}

// ──────────────────────────────────────────
// 7. Potwierdzenie wpłaty (paragon)
// ──────────────────────────────────────────
export function paymentReceiptEmail(params: {
  studentName: string
  amount: number
  method: string
  balanceAfter?: number
}): { subject: string; html: string } {
  const { studentName, amount, method, balanceAfter } = params
  const balanceLine = typeof balanceAfter === 'number'
    ? `<tr><td style="color:#94a3b8;font-size:13px;padding:6px 0;">Saldo po wpłacie</td><td style="font-weight:700;font-size:14px;text-align:right;">${balanceAfter >= 0 ? '+' : ''}${Math.round(balanceAfter)} zł</td></tr>`
    : ''
  return {
    subject: `Potwierdzenie wpłaty ${amount} zł ✅`,
    html: wrap(`
      <h2 style="font-size:22px;font-weight:900;margin:0 0 8px;">Dziękujemy za wpłatę! ✅</h2>
      <p style="color:#64748b;font-size:15px;margin:0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! Zaksięgowaliśmy Twoją płatność.
      </p>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #22c55e;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#94a3b8;font-size:13px;padding:6px 0;">Kwota</td><td style="font-weight:900;font-size:20px;text-align:right;color:#15803d;">${amount} zł</td></tr>
          <tr><td style="color:#94a3b8;font-size:13px;padding:6px 0;">Metoda</td><td style="font-weight:700;font-size:14px;text-align:right;">${method}</td></tr>
          ${balanceLine}
        </table>
      </div>

      ${btn('Zobacz rozliczenia →', `${process.env.NEXT_PUBLIC_APP_URL}/rozliczenia`)}

      <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
        Potrzebujesz faktury? Napisz na <a href="mailto:hello@unick-academy.pl" style="color:#7c3aed;">hello@unick-academy.pl</a>
      </p>
    `),
  }
}

// ──────────────────────────────────────────
// 6. Tygodniowe podsumowanie postępów (retencja)
// ──────────────────────────────────────────
export function progressDigestEmail(params: {
  studentName: string
  weekLabel: string
  lessonsCount: number
  hours: number
  topics: string[]
  homework: string[]
  nextLesson?: { date: string; time: string } | null
}): { subject: string; html: string } {
  const { studentName, weekLabel, lessonsCount, hours, topics, homework, nextLesson } = params
  const topicsHtml = topics.length
    ? topics.map((t) => `<li style="margin-bottom:4px;">${t}</li>`).join('')
    : '<li style="color:#94a3b8;">—</li>'
  const hwHtml = homework.length
    ? `<div style="background:#fffbeb;border-radius:12px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #f59e0b;">
         <p style="margin:0 0 8px;font-size:13px;color:#92400e;font-weight:700;">PRACA DOMOWA</p>
         <ul style="margin:0;padding-left:18px;font-size:14px;color:#78350f;">${homework.map((h) => `<li style="margin-bottom:4px;">${h}</li>`).join('')}</ul>
       </div>`
    : ''
  return {
    subject: `Twoje postępy w tym tygodniu 🦄 (${lessonsCount} ${lessonsCount === 1 ? 'lekcja' : 'lekcje'})`,
    html: wrap(`
      <h2 style="font-size:22px;font-weight:900;margin:0 0 8px;">Cześć ${studentName.split(' ')[0]}! 👋</h2>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Oto podsumowanie Twojej nauki (${weekLabel}). Świetna robota — tak trzymaj!
      </p>

      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#f5f3ff;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:900;color:#5b21b6;">${lessonsCount}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#6d28d9;">${lessonsCount === 1 ? 'lekcja' : 'lekcje'}</p>
        </div>
        <div style="flex:1;background:#eff6ff;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0;font-size:28px;font-weight:900;color:#1d4ed8;">${hours}h</p>
          <p style="margin:4px 0 0;font-size:12px;color:#2563eb;">nauki</p>
        </div>
      </div>

      <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#475569;font-weight:700;">CO PRZEROBILIŚCIE</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#334155;">${topicsHtml}</ul>
      </div>

      ${hwHtml}

      ${nextLesson ? `<p style="color:#475569;font-size:14px;margin:0 0 20px;">📅 Następna lekcja: <strong>${nextLesson.date} o ${nextLesson.time}</strong></p>` : ''}

      ${btn('Zobacz swoje postępy →', `${process.env.NEXT_PUBLIC_APP_URL}/postepy`)}

      <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">Do zobaczenia na kolejnej lekcji! 🦄</p>
    `),
  }
}

// ──────────────────────────────────────────
// 5. Powiadomienie o poleceniu
// ──────────────────────────────────────────
export function referralEmail(params: {
  referrerName: string
  referredName: string
  creditAmount: number
}): { subject: string; html: string } {
  const { referrerName, referredName, creditAmount } = params
  return {
    subject: `${referredName.split(' ')[0]} dołączył/a z Twoim kodem! +${creditAmount} zł 🎉`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Masz nowe polecenie! 🎉</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
        Cześć ${referrerName.split(' ')[0]}! Twój znajomy właśnie dołączył do uNick Academy z Twoim kodem.
      </p>

      <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 13px; color: #7c3aed; font-weight: 600;">NOWE POLECENIE</p>
        <p style="margin: 4px 0 8px; font-size: 18px; font-weight: 900; color: #5b21b6;">${referredName}</p>
        <p style="margin: 0; font-size: 14px; color: #6d28d9;">
          Zarobiłeś/aś: <strong>+${creditAmount} zł kredytu</strong> na kolejną lekcję!
        </p>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
        Kredyt zostanie automatycznie zastosowany do Twojej następnej płatności. Polecaj dalej i zarabiaj więcej!
      </p>

      ${btn('Zobacz swoje polecenia →', `${process.env.NEXT_PUBLIC_APP_URL}/polecenia`)}
    `),
  }
}

// ══════════════════════════════════════════════════════════════════════════
// SZABLONY BRANDOWE (unick-brand)
//
// Osobny wrapper, bo starsze maile używają gradientu fiolet→cyan i fontu
// Inter, czego brand zabrania wprost. Nie przepisuję ich hurtem przy okazji
// kampanii; nowe treści powstają już zgodnie z tokenami.
//
// Tokeny: brand-red #B4321E, brand-navy #1E3282, cream #F0DCC8,
// sky #6090B0 (tylko akcent). Bez fioletu, bez cyanu, bez gradientów.
// Nagłówki Poppins, treść Comfortaa. Klienty pocztowe rzadko ładują webfonty,
// więc font-stack ma zwykły sans-serif jako fallback.
// W treści nie używamy myślnika „—”.
// ══════════════════════════════════════════════════════════════════════════

const BRAND = {
  red: '#B4321E',
  navy: '#1E3282',
  cream: '#F0DCC8',
  ink: '#1E3282',
  muted: '#6B7280',
} as const

const FONT_HEAD = "'Poppins', 'Trebuchet MS', Verdana, sans-serif"
const FONT_BODY = "'Comfortaa', 'Trebuchet MS', Verdana, sans-serif"

// Logo ma białe tło, więc siedzi na białym pasku, nigdy na kolorze.
function brandWrap(content: string, appUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Comfortaa:wght@400;600&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 24px 12px; background: ${BRAND.cream};">
      <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden;">

        <div style="background: #FFFFFF; padding: 28px 40px 8px; text-align: center;">
          <img src="${appUrl}/brand/unick-academy-logo.png" alt="uNick Academy"
               width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto;" />
        </div>

        <div style="padding: 16px 40px 32px; font-family: ${FONT_BODY}; color: ${BRAND.ink};">
          ${content}
        </div>

        <div style="background: ${BRAND.cream}; padding: 20px 40px; text-align: center; font-family: ${FONT_BODY};">
          <p style="color: ${BRAND.navy}; font-size: 12px; margin: 0 0 6px;">uNick Academy, hello@unick-academy.pl</p>
          <p style="color: ${BRAND.muted}; font-size: 11px; margin: 0;">Nie chcesz takich wiadomości? Odpisz „rezygnuję”, usuniemy Cię z listy.</p>
        </div>

      </div>
    </body>
    </html>
  `
}

// Przycisk pełnym kolorem marki, bez gradientu.
function brandBtn(label: string, url: string, color: string = BRAND.red): string {
  return `
    <a href="${url}" style="display: inline-block; padding: 14px 30px; background: ${color}; color: #FFFFFF; font-family: ${FONT_HEAD}; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px;">
      ${label}
    </a>
  `
}

// ──────────────────────────────────────────
// Kampania „powrót": treść zatwierdzona przez Milenę + śledzenie otwarć i kliknięć
// ──────────────────────────────────────────
//
// Śledzenie działa tylko, gdy podany jest `trackToken`. Bez niego szablon
// renderuje się czysto (podgląd, testy) i nie zawiera ani piksela, ani
// przekierowań.
//
// Ikony społecznościowe (40x40 PNG) odzyskane z pliku preview przekazanego
// przez Milenę i zapisane w public/brand/icons/. Wersja finalna odwoływała się
// do tych ścieżek, ale plików nie było w repo, więc bez tego kroku 90 osób
// zobaczyłoby cztery połamane obrazki.
export function comebackEmail(params: {
  firstName: string
  referralCode: string
  appUrl: string
  trackToken?: string
}): { subject: string; html: string } {
  const { firstName, referralCode, appUrl, trackToken } = params

  // Link opakowany w przekierowanie zliczające. Bez tokenu zwraca oryginał.
  const t = (url: string) =>
    trackToken
      ? `${appUrl}/api/track/c/${trackToken}?u=${encodeURIComponent(url)}`
      : url

  const pixel = trackToken
    ? `<img src="${appUrl}/api/track/o/${trackToken}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`
    : ''

  // Adresy bierzemy z site-config.js, tego samego pliku, który zasila stopkę
  // strony i dane strukturalne SEO. Dzięki temu zmiana profilu w jednym miejscu
  // przechodzi też na maile i linki nie mogą się rozjechać.
  const soc = siteConfig.social as Record<string, string>
  const social = [
    ['Facebook', soc.facebook, 'icon-facebook.png'],
    ['Instagram', soc.instagram, 'icon-instagram.png'],
    ['YouTube', soc.youtube, 'icon-youtube.png'],
    ['LinkedIn', soc.linkedin, 'icon-linkedin.png'],
  ]
    .map(([label, url, file]) =>
      `<a href="${t(url)}" style="display: inline-block; margin: 0 4px;">` +
      `<img src="${appUrl}/brand/icons/${file}" width="32" height="32" alt="${label}" style="display: block; border-radius: 50%;" />` +
      `</a>`)
    .join('')

  return {
    subject: `${firstName}, mamy dla Ciebie nową platformę i kod na kolejne lekcje`,
    html: `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Comfortaa:wght@400;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 24px 12px; background: #F0DCC8;">
  <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden;">

    <div style="background: #FFFFFF; padding: 28px 40px 8px; text-align: center;">
      <img src="${appUrl}/brand/unick-academy-logo.png" alt="uNick Academy"
           width="180" style="display: block; margin: 0 auto; max-width: 180px; height: auto;" />
    </div>

    <div style="padding: 16px 40px 32px; font-family: 'Comfortaa', 'Trebuchet MS', Verdana, sans-serif; color: #1E3282;">

      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 8px;">
        <tr>
          <td style="vertical-align: middle;">
            <h2 style="font-family: 'Poppins', 'Trebuchet MS', Verdana, sans-serif; font-size: 24px; font-weight: 700; color: #1E3282; margin: 0;">
              Cześć ${firstName},
            </h2>
          </td>
          <td style="width: 96px; text-align: right; vertical-align: middle;">
            <img src="${appUrl}/brand/unickorn-mascot-wave.png" alt="" width="88"
                 style="display: block; width: 88px; height: auto; margin-left: auto;" />
          </td>
        </tr>
      </table>

      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
        mamy nadzieję, że wakacje są dokładnie takie, jak powinny być. U nas trochę cicho bez uczniów,
        więc chętnie się przypomnimy, zanim wrócicie do zajęć.
      </p>

      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
        Zaczniemy od czegoś praktycznego. Przygotowaliśmy jedno miejsce na wszystko: lekcje, terminy,
        postępy, rozliczenia. Konto już na Ciebie czeka, wystarczy ustawić hasło.
      </p>

      <div style="text-align: center; margin: 0 0 8px;">
        <a href="${t(`${appUrl}/zapomniane-haslo`)}" style="display: inline-block; padding: 14px 30px; background: #1E3282; color: #FFFFFF; font-family: 'Poppins', 'Trebuchet MS', Verdana, sans-serif; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; letter-spacing: 0.5px;">
          USTAW HASŁO I SPRAWDŹ
        </a>
      </div>

      <h3 style="font-family: 'Poppins', 'Trebuchet MS', Verdana, sans-serif; font-size: 17px; font-weight: 600; color: #B4321E; margin: 32px 0 8px;">
        A teraz coś, co należy się Wam od dawna
      </h3>
      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
        Polecacie nas znajomym, wiemy o tym, bo właśnie stąd bierze się większość naszych nowych
        uczniów. Teraz chcemy się za to odwdzięczyć. Dajemy Ci Twój kod do poleceń:
      </p>

      <div style="background: #F0DCC8; border-radius: 12px; padding: 18px; margin: 0 0 14px; text-align: center;">
        <p style="font-family: 'Poppins', 'Trebuchet MS', Verdana, sans-serif; color: #1E3282; font-size: 12px; font-weight: 600; letter-spacing: 1px; margin: 0 0 6px;">TWÓJ KOD</p>
        <p style="font-family: 'Poppins', 'Trebuchet MS', Verdana, sans-serif; font-size: 22px; font-weight: 700; color: #B4321E; margin: 0; word-break: break-all;">${referralCode}</p>
      </div>

      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 24px;">
        Podaj go komuś, kto myśli o nauce języka. Gdy ta osoba zapisze się z Twoim kodem
        i opłaci pierwsze zajęcia (za minimum 250 zł), <strong style="color: #1E3282;">oboje dostajecie po 50 zł</strong>
        na kolejne lekcje. Nic więcej nie musisz robić, kwota automatycznie pojawi się w systemie.
      </p>

      <div style="border-top: 1px solid #F0DCC8; padding-top: 20px;">
        <p style="font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
          Platforma jest nowiutka i chcemy ją ulepszać jak się da, więc jeśli coś Ci zgrzytnie
          albo zobaczysz coś, co można poprawić, po prostu daj znać, zajmiemy się tym.
        </p>
        <p style="font-size: 15px; line-height: 1.8; margin: 0;">
          Do zobaczenia wkrótce,<br />
          <span style="color: #6B7280;">Zespół uNick Academy</span>
        </p>
      </div>

    </div>

    <div style="background: #F0DCC8; padding: 20px 40px; text-align: center; font-family: 'Comfortaa', 'Trebuchet MS', Verdana, sans-serif;">
      <p style="color: #1E3282; font-size: 12px; margin: 0 0 6px;">
        uNick Academy, <a href="mailto:${siteConfig.email}" style="color: #1E3282; text-decoration: none;">${siteConfig.email}</a> ·
        <a href="tel:${siteConfig.phone.e164}" style="color: #1E3282; text-decoration: none;">${siteConfig.phone.display}</a>
      </p>
      <div style="margin: 12px 0;">${social}</div>
      <p style="color: #6B7280; font-size: 11px; margin: 0 0 4px;">Nie chcesz takich wiadomości? Odpisz „rezygnuję”, usuniemy Cię z listy.</p>
      ${trackToken ? `<p style="color: #9CA3AF; font-size: 10px; margin: 0;">Sprawdzamy, czy nasze wiadomości docierają i czy linki działają. Szczegóły w <a href="${t(`${appUrl}/polityka-prywatnosci`)}" style="color: #9CA3AF;">polityce prywatności</a>.</p>` : ''}
    </div>

  </div>
  ${pixel}
</body>
</html>`,
  }
}

// ──────────────────────────────────────────
// Zapisy przez kreator /zapisy
// ──────────────────────────────────────────

// Potwierdzenie rezerwacji miejsca w grupie — wysyłane natychmiast po zapisie.
// Zawiera konkret (nazwa, dzień, godzina, data startu), a nie ogólnik.
export function groupReservationEmail(params: {
  studentName: string
  groupName: string
  schedule: string
  firstLessonDate: string | null
  format: 'online' | 'offline' | null
  pricePerMonth: number | null
  passwordLink?: string | null
}): { subject: string; html: string } {
  const { studentName, groupName, schedule, firstLessonDate, format, pricePerMonth, passwordLink } = params
  return {
    subject: `Miejsce zarezerwowane: ${groupName} 🎉`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Miejsce zarezerwowane! 🎉</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! Trzymamy dla Ciebie miejsce. Poniżej szczegóły.
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #7c3aed;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Grupa</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${groupName}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Termin</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${schedule}</td></tr>
          ${firstLessonDate ? `<tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Pierwsze zajęcia</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${firstLessonDate}</td></tr>` : ''}
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Forma</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${format === 'online' ? 'Online' : 'Stacjonarnie, Rumianek'}</td></tr>
          ${pricePerMonth != null ? `<tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Cena</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${pricePerMonth} zł / mies.</td></tr>` : ''}
        </table>
      </div>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px;">
        <p style="font-size: 14px; font-weight: 700; color: #15803d; margin: 0 0 6px;">Nic nie ryzykujesz</p>
        <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;">
          Przyjdź na pierwsze zajęcia i dopiero wtedy zdecyduj. Jeśli nie podejdą,
          rezygnujesz bez żadnej opłaty — wystarczy, że dasz nam znać.
        </p>
      </div>

      <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;"><strong>Co dalej?</strong></p>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
        Nie musisz teraz nic płacić. Jeśli zostajesz, rachunek za pierwszy miesiąc wyślemy
        osobnym mailem — płatność jest z góry, do 5. dnia miesiąca. Nie wiążemy nikogo umową
        na rok: zrezygnować można w każdej chwili, z miesięcznym wypowiedzeniem.
        Dzień przed startem dostaniesz od nas wszystkie praktyczne szczegóły.
      </p>

      ${passwordLink ? `
      <div style="background: #EAF3FF; border-radius: 12px; padding: 20px; margin-bottom: 8px;">
        <p style="font-size: 14px; font-weight: 700; color: #23479E; margin: 0 0 6px;">Twoje konto jest gotowe</p>
        <p style="color: #64748b; font-size: 13px; margin: 0 0 12px;">
          Założyliśmy je automatycznie — znajdziesz tam terminy, obecności i rozliczenia.
          Ustaw hasło jednym kliknięciem:
        </p>
        ${btn('Ustawiam hasło', passwordLink)}
      </div>` : ''}
    `),
  }
}

// Potwierdzenie zgłoszenia bez konkretnego terminu — ścieżka „jeszcze nie wiem"
// i zajęcia indywidualne. Obiecuje konkretny czas odpowiedzi, nie ogólnik.
export function adviceReceivedEmail(params: {
  name: string
  individual?: boolean
  passwordLink?: string | null
}): { subject: string; html: string } {
  const { name, individual, passwordLink } = params
  return {
    subject: individual ? 'Mamy Twoje zgłoszenie — odezwiemy się 📨' : 'Dziękujemy — pomożemy wybrać 📨',
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Mamy Twoje zgłoszenie 📨</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px; line-height: 1.6;">
        Cześć ${name.split(' ')[0]}! ${individual
          ? 'Zajęcia indywidualne dobieramy w rozmowie — chcemy poznać cel i poziom, zanim zaproponujemy nauczyciela i porę.'
          : 'Nie musisz wiedzieć z góry, co wybrać. Od tego jesteśmy my.'}
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #7c3aed;">
        <p style="font-size: 14px; font-weight: 700; margin: 0 0 6px;">Odezwiemy się w ciągu 2 dni roboczych</p>
        <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;">
          Zadzwonimy albo napiszemy — jak Ci wygodniej. Rozmowa trwa kilkanaście minut
          i do niczego nie zobowiązuje.
        </p>
      </div>

      ${individual ? `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="font-size: 14px; font-weight: 700; color: #15803d; margin: 0 0 6px;">Nie musisz od razu brać kursu</p>
        <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;">
          Możesz umówić się na pojedyncze zajęcia, dowolnej długości. Nie wiążemy nikogo umową
          na rok: z regularnych zajęć zrezygnujesz w każdej chwili, z miesięcznym wypowiedzeniem.
        </p>
      </div>` : ''}

      ${passwordLink ? `
      <div style="background: #EAF3FF; border-radius: 12px; padding: 20px; margin-bottom: 8px;">
        <p style="font-size: 14px; font-weight: 700; color: #23479E; margin: 0 0 6px;">Twoje konto jest gotowe</p>
        <p style="color: #64748b; font-size: 13px; margin: 0 0 12px;">Ustaw hasło, żeby mieć wszystko w jednym miejscu:</p>
        ${btn('Ustawiam hasło', passwordLink)}
      </div>` : ''}
    `),
  }
}

// Mail „co zabrać / jak dojechać" (stacjonarnie) albo „link i test połączenia"
// (online). Wysyłany dobę po rezerwacji przez cron.
export function groupPrepEmail(params: {
  studentName: string
  groupName: string
  schedule: string
  format: 'online' | 'offline' | null
}): { subject: string; html: string } {
  const { studentName, groupName, schedule, format } = params
  const online = format === 'online'
  return {
    subject: online ? `Jak dołączyć do zajęć: ${groupName}` : `Jak trafić na zajęcia: ${groupName}`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">${online ? 'Jak dołączyć' : 'Jak do nas trafić'}</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! Kilka praktycznych rzeczy przed startem — ${groupName}, ${schedule}.
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #06b6d4;">
        ${online ? `
        <p style="font-size: 14px; font-weight: 700; margin: 0 0 10px;">Przed pierwszymi zajęciami</p>
        <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.7;">
          • Link do spotkania wyślemy dzień wcześniej — działa w przeglądarce, nic nie instalujesz.<br>
          • Sprawdź wcześniej mikrofon i kamerę, najlepiej na tym sprzęcie, na którym będziesz się uczyć.<br>
          • Słuchawki pomagają bardziej, niż się wydaje — mniej echa, lepsze skupienie.<br>
          • Dołącz 2–3 minuty wcześniej, żeby spokojnie zacząć.
        </p>` : `
        <p style="font-size: 14px; font-weight: 700; margin: 0 0 10px;">Adres i praktyczne szczegóły</p>
        <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.7;">
          • ul. Nowa 23, 62-080 Rumianek (gmina Tarnowo Podgórne).<br>
          • Przed budynkiem jest gdzie zaparkować.<br>
          • Wystarczy zeszyt i coś do pisania — resztę materiałów dajemy my.<br>
          • Przyjdź 5 minut wcześniej na pierwsze zajęcia, żeby się rozejrzeć.
        </p>`}
      </div>

      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        Coś się zmieniło albo masz pytanie? Odpisz na tego maila — czytamy wszystkie.
      </p>
    `),
  }
}

// Przypomnienie na trzy dni przed pierwszymi zajęciami grupy.
export function groupStartReminderEmail(params: {
  studentName: string
  groupName: string
  schedule: string
  firstLessonDate: string
  format: 'online' | 'offline' | null
}): { subject: string; html: string } {
  const { studentName, groupName, schedule, firstLessonDate, format } = params
  return {
    subject: `Za trzy dni startujemy: ${groupName} 🚀`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Za trzy dni startujemy 🚀</h2>
      <p style="color: #64748b; font-size: 15px; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! Przypominamy o pierwszych zajęciach.
      </p>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #7c3aed;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Grupa</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${groupName}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Start</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${firstLessonDate}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Termin</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${schedule}</td></tr>
          <tr><td style="color: #94a3b8; font-size: 13px; padding: 6px 0;">Forma</td><td style="font-weight: 700; font-size: 14px; text-align: right;">${format === 'online' ? 'Online' : 'Rumianek, ul. Nowa 23'}</td></tr>
        </table>
      </div>

      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        Nie możesz być? Odpisz — przesuniemy albo znajdziemy inny termin.
      </p>
    `),
  }
}

