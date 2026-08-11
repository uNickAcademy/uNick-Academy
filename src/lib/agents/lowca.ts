import { generateObject } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendAgentLowcaEmail } from '@/lib/email/send'

// Agent Łowca: pierwsza automatyczna odpowiedź na nowe zapytanie B2C.
//
// Zakres (Faza 1, ustalony z Mileną): tylko e-mail, tylko JEDNA natychmiastowa
// wiadomość — ciepłe potwierdzenie + ewentualnie jedno pytanie doprecyzowujące,
// bez samodzielnego zamykania sprzedaży. Dalszą rozmowę przejmuje człowiek ze
// Skrzynki zgłoszeń (/admin/zapisy), obietnica kontaktu to 2 dni robocze —
// agent tylko skraca czas DO PIERWSZEJ odpowiedzi z dni na sekundy.
//
// Świadomie NIE wywołujemy tego dla zgłoszeń `kind: 'group'` (rezerwacja
// konkretnego miejsca) — tam klient już wie, czego chce, i dostaje osobne,
// w pełni skonkretyzowane potwierdzenie (groupReservationEmail).

const MODEL_ID = 'claude-sonnet-4-6'

// Szacunkowa cena Sonnet 4.6 (USD / token) — do weryfikacji przy realnym
// wolumenie. agent_usage.cost_usd ma domyślnie 0, więc błąd tutaj nie psuje
// niczego poza raportem kosztów.
const USD_PER_INPUT_TOKEN = 3 / 1_000_000
const USD_PER_OUTPUT_TOKEN = 15 / 1_000_000

const responseSchema = z.object({
  subject: z.string().describe('Temat maila, krótki, bez emoji, bez wielkich liter na całe słowo'),
  body: z.string().describe('Treść maila po polsku, zwykły tekst, akapity oddzielone pustą linią, bez podpisu na końcu'),
})

type LeadRow = {
  id: string
  first_name: string | null
  last_name: string | null
  parent_name: string | null
  email: string | null
  student_type: string | null
  student_age: number | null
  goal: string | null
  preferred_start: string | null
  location: string | null
  entry_point: string | null
}

const STUDENT_TYPE_PL: Record<string, string> = {
  child: 'dziecko', teen: 'nastolatek/nastolatka', adult: 'osoba dorosła', corporate: 'firma',
}
const LOCATION_PL: Record<string, string> = {
  online: 'online', rumianek: 'stacjonarnie w Rumianku', any: 'wszystko jedno, online czy stacjonarnie',
}

function buildSystemPrompt(): string {
  return `Jesteś Agentem Łowcą — piszesz PIERWSZĄ, natychmiastową odpowiedź na nowe zapytanie do uNick Academy, szkoły językowej w Polsce (Rumianek, gm. Tarnowo Podgórne, oraz online).

GŁOS MARKI (obowiązkowy):
- ciepły, naturalny, optymistyczny, ludzki, rozmowny
- nauka języka to komunikacja i relacje, nie gramatyka dla gramatyki
- unikaj języka korporacyjnego, nachalnej sprzedaży i szkolnego tonu belfra
- pisz po polsku, zwracaj się na „Ty"
- NIGDY nie używaj myślnika em dash (—) — pisz normalnym zdaniem albo dwukropkiem

TWOJE ZADANIE:
1. Podziękuj za zgłoszenie i potwierdź, że dotarło.
2. Jeśli w danych brakuje jednej kluczowej informacji (dla kogo nauka, orientacyjny poziom, forma zajęć) — zadaj o TO JEDNO pytanie, nie więcej. Jeśli wszystko już wiadomo z danych, nie pytaj o nic dodatkowego.
3. Zapowiedz, że ktoś z zespołu skontaktuje się w ciągu 2 dni roboczych z konkretną propozycją. NIE obiecuj konkretnej godziny, dnia ani nauczyciela.
4. Zaproś do odpowiedzi na tego maila, jeśli chce coś dopisać teraz.

TWARDE ZASADY:
- Nie wymyślaj faktów, których nie ma w danych poniżej (cena, dostępne terminy, konkretny nauczyciel, języki poza tym, o co zapytano).
- Nie podawaj konkretnych cen — cennik jest zależny od formy zajęć i ktoś z zespołu go dopasuje.
- Nie obiecuj rezerwacji konkretnego terminu — to robi człowiek.
- Nie pisz dłużej niż 5-6 krótkich zdań w treści.
- Nie dodawaj podpisu na końcu (np. „Zespół uNick Academy") — dodamy go automatycznie.
- Adres i telefon szkoły dodamy automatycznie w stopce — nie musisz ich wpisywać.

Kontekst firmy do wykorzystania, jeśli pasuje: uNick Academy uczy angielskiego (i kilku innych języków) dzieci, nastolatków, dorosłych i firmy, stacjonarnie w Rumianku pod Poznaniem oraz online.`
}

function buildUserPrompt(lead: LeadRow): string {
  const name = lead.first_name || lead.parent_name || null
  const lines = [
    `Imię/nazwa kontaktu: ${name ?? 'nieznane'}`,
    lead.parent_name && lead.parent_name !== name ? `Rodzic/opiekun: ${lead.parent_name}` : null,
    `Dla kogo nauka: ${lead.student_type ? (STUDENT_TYPE_PL[lead.student_type] ?? lead.student_type) : 'nie podano'}`,
    lead.student_age != null ? `Wiek: ${lead.student_age}` : null,
    `Forma zajęć: ${lead.location ? (LOCATION_PL[lead.location] ?? lead.location) : 'nie podano'}`,
    `Skąd zgłoszenie: ${lead.entry_point ?? 'nieznane'}`,
    lead.preferred_start ? `Preferowane pory: ${lead.preferred_start}` : null,
    lead.goal ? `Wiadomość / cel od zgłaszającego: ${lead.goal}` : 'Wiadomość od zgłaszającego: brak (nie napisał/a nic dodatkowego)',
  ].filter(Boolean)
  return lines.join('\n')
}

// Wywoływane z createLead() dla świeżych, nowych zgłoszeń (nie dla powrotów
// i nie dla już umówionych rezerwacji). Nigdy nie rzuca — błąd tutaj nie może
// zepsuć zapisu leada ani odpowiedzi dla osoby wypełniającej formularz.
export async function respondToNewLead(admin: SupabaseClient, leadId: string): Promise<void> {
  const startedAt = Date.now()
  try {
    const { data: lead, error: leadErr } = await admin
      .from('leads')
      .select('id, first_name, last_name, parent_name, email, student_type, student_age, goal, preferred_start, location, entry_point')
      .eq('id', leadId)
      .single()

    if (leadErr || !lead || !lead.email) return

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn('[AgentLowca] Brak ANTHROPIC_API_KEY — pomijam automatyczną odpowiedź.')
      return
    }

    const anthropic = createAnthropic({ apiKey })
    const result = await generateObject({
      model: anthropic(MODEL_ID),
      schema: responseSchema,
      system: buildSystemPrompt(),
      prompt: buildUserPrompt(lead as LeadRow),
    })

    const sent = await sendAgentLowcaEmail(lead.email as string, {
      subject: result.object.subject,
      body: result.object.body,
    })

    const inputTokens = result.usage?.promptTokens ?? 0
    const outputTokens = result.usage?.completionTokens ?? 0

    let conversationId: string | null = null
    let messageId: string | null = null

    if (sent) {
      const { data: conv } = await admin
        .from('conversations')
        .insert({ lead_id: leadId, channel: 'email' })
        .select('id')
        .single()
      conversationId = (conv?.id as string) ?? null

      if (conversationId) {
        const { data: msg } = await admin
          .from('messages')
          .insert({
            conversation_id: conversationId,
            lead_id: leadId,
            direction: 'out',
            author: 'agent',
            content: result.object.body,
            meta: { agent_name: 'lowca', model: MODEL_ID, subject: result.object.subject },
          })
          .select('id')
          .single()
        messageId = (msg?.id as string) ?? null
      }

      // Pierwszy kontakt już się odbył (choć automatycznie) — status idzie
      // do przodu, żeby recepcja nie próbowała robić tego samego ręcznie.
      await admin.from('leads').update({ status: 'contacted' }).eq('id', leadId).eq('status', 'new')
    }

    await admin.from('agent_usage').insert({
      agent_name: 'lowca',
      model: MODEL_ID,
      lead_id: leadId,
      message_id: messageId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: inputTokens * USD_PER_INPUT_TOKEN + outputTokens * USD_PER_OUTPUT_TOKEN,
      latency_ms: Date.now() - startedAt,
      success: sent,
      error: sent ? null : 'Wysyłka e-maila nie powiodła się (Resend).',
    })
  } catch (err) {
    console.error('[AgentLowca] Błąd generowania/wysyłki pierwszej odpowiedzi:', err)
    await admin.from('agent_usage').insert({
      agent_name: 'lowca',
      model: MODEL_ID,
      lead_id: leadId,
      latency_ms: Date.now() - startedAt,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }).then(undefined, () => {})
  }
}
