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
