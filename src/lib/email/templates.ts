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
}): { subject: string; html: string } {
  const { studentName, monthLabel, amount, paymentUrl } = params
  return {
    subject: `Płatność za ${monthLabel} — ${amount} zł`,
    html: wrap(`
      <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 8px;">Płatność za ${monthLabel}</h2>
      <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
        Cześć ${studentName.split(' ')[0]}! To przypomnienie o opłacie za zajęcia w miesiącu ${monthLabel} — płatnej z góry.
      </p>

      <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #6d28d9; font-size: 13px; font-weight: 600; margin: 0 0 4px;">DO ZAPŁATY</p>
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
// Kampania: powrót nieaktywnych + nowa platforma + kod polecenia
// ──────────────────────────────────────────
export function comebackEmail(params: {
  firstName: string
  referralCode: string
  appUrl: string
}): { subject: string; html: string } {
  const { firstName, referralCode, appUrl } = params
  return {
    subject: `${firstName}, dawno się nie widzieliśmy. Mamy dwie nowości`,
    html: brandWrap(`
      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 8px;">
        <tr>
          <td style="vertical-align: middle;">
            <h2 style="font-family: ${FONT_HEAD}; font-size: 24px; font-weight: 700; color: ${BRAND.navy}; margin: 0;">
              Cześć ${firstName}!
            </h2>
          </td>
          <td style="width: 96px; text-align: right; vertical-align: middle;">
            <img src="${appUrl}/brand/unickorn-mascot-wave.png" alt="" width="88"
                 style="display: block; width: 88px; height: auto; margin-left: auto;" />
          </td>
        </tr>
      </table>

      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 18px;">
        Dawno nie mieliśmy okazji się odezwać, więc piszemy bez żadnego haczyka.
        Po prostu z dwiema rzeczami, o których chcieliśmy dać znać.
      </p>

      <h3 style="font-family: ${FONT_HEAD}; font-size: 17px; font-weight: 600; color: ${BRAND.red}; margin: 28px 0 8px;">
        Mamy nową platformę
      </h3>
      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
        Lekcje, terminy, postępy i rozliczenia w jednym miejscu, bez szukania po mailach.
        Konto już czeka, założone na ten adres. Hasła jeszcze nie masz, więc ustaw je sam(a):
        kliknij niżej, wpisz ten adres, a my wyślemy link.
      </p>

      <div style="text-align: center; margin: 0 0 8px;">
        ${brandBtn('Ustaw hasło i zajrzyj', `${appUrl}/zapomniane-haslo`, BRAND.navy)}
      </div>

      <h3 style="font-family: ${FONT_HEAD}; font-size: 17px; font-weight: 600; color: ${BRAND.red}; margin: 32px 0 8px;">
        Twój kod polecenia
      </h3>
      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
        Wiele osób trafia do nas dlatego, że ktoś nas polecił, najczęściej zwyczajnie
        w rozmowie i zupełnie bezinteresownie. Chcemy się za to wreszcie odwdzięczyć.
      </p>

      <div style="background: ${BRAND.cream}; border-radius: 12px; padding: 18px; margin: 0 0 14px; text-align: center;">
        <p style="font-family: ${FONT_HEAD}; color: ${BRAND.navy}; font-size: 12px; font-weight: 600; letter-spacing: 1px; margin: 0 0 6px;">TWÓJ KOD</p>
        <p style="font-family: ${FONT_HEAD}; font-size: 22px; font-weight: 700; color: ${BRAND.red}; margin: 0; word-break: break-all;">${referralCode}</p>
      </div>

      <p style="font-size: 15px; line-height: 1.8; margin: 0 0 6px;">
        Przekaż go komuś, kto myśli o angielskim, a jeszcze u nas nie był.
        Kiedy ta osoba zapisze się z Twoim kodem i opłaci zajęcia za 250 zł,
        <strong style="color: ${BRAND.navy};">oboje dostajecie po 50 zł</strong> kredytu na lekcje.
      </p>
      <p style="font-size: 13px; line-height: 1.7; color: ${BRAND.muted}; margin: 0 0 24px;">
        Kredyt pojawia się na koncie automatycznie, nie trzeba się o niego upominać.
      </p>

      <div style="border-top: 1px solid ${BRAND.cream}; padding-top: 20px;">
        <p style="font-size: 15px; line-height: 1.8; margin: 0 0 16px;">
          We wrześniu ruszają nowe grupy. Jeśli myślisz o powrocie, odpisz na tego maila,
          poszukamy czegoś pod Ciebie. Jeśli nie, też w porządku. Kod zostaje Twój tak czy siak.
        </p>
        <p style="font-size: 15px; line-height: 1.8; margin: 0;">
          Do usłyszenia,<br />
          <span style="color: ${BRAND.muted};">Zespół uNick Academy</span>
        </p>
      </div>
    `, appUrl),
  }
}
