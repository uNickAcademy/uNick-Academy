import type { SupabaseClient } from '@supabase/supabase-js'

// Jedyne miejsce, przez które formularze ze strony trafiają do lejka `leads`.
// Migracja 116 uczyniła `leads` jedynym lejkiem B2C i wycofała
// `consultation_requests`, więc każde nowe wejście ma iść tędy — inaczej
// zrobią się cztery równoległe implementacje tego samego.
//
// Wymaga klienta z rolą serwisową: RLS na `leads` dopuszcza wyłącznie
// admina i recepcję, a formularze są publiczne.

export type LeadEntryPoint =
  | 'zapisy_wizard'
  | 'consultation_modal'
  | 'contact_form'
  | 'group_list_button'
  | 'advice'

export type LeadStudentType = 'child' | 'teen' | 'adult' | 'corporate'
export type LeadLocation = 'rumianek' | 'online' | 'any'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'booked' | 'won'

export type CreateLeadInput = {
  entryPoint: LeadEntryPoint
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  parentName?: string | null
  studentType?: LeadStudentType | null
  studentAge?: number | null
  location?: LeadLocation | null
  goal?: string | null
  preferredStart?: string | null
  interestedGroupId?: string | null
  consentMarketing?: boolean
  consentClause?: string | null
  campaign?: string | null
  /** Domyślnie `new`. Rezerwacja miejsca w grupie wchodzi od razu jako `booked`. */
  status?: LeadStatus
  /** Data pierwszych zajęć — zasila metryki lejka. */
  bookedSlotAt?: string | null
  /**
   * Kod polecenia podany przy zgłoszeniu. Zostaje na leadzie i wchodzi w grę
   * automatycznie, gdy ta osoba faktycznie się zapisze — także wtedy, gdy
   * najpierw przyszła tylko na rozmowę doradczą.
   */
  referralCode?: string | null
}

export type CreateLeadResult = {
  leadId: string
  /** true, gdy trafiliśmy na istniejący kontakt i dopisaliśmy się do niego. */
  isReturning: boolean
}

// Normalizacja musi odwzorować kolumny generowane z migracji 116 — inaczej
// wyszukanie duplikatu rozminie się z tym, czego pilnuje indeks unikalny.
function normEmail(email?: string | null): string | null {
  const v = (email ?? '').trim().toLowerCase()
  return v || null
}

// Telefon: same cyfry, ostatnie 9 (format PL).
function normPhone(phone?: string | null): string | null {
  const digits = (phone ?? '').replace(/[^0-9]/g, '')
  const v = digits.slice(-9)
  return v || null
}

function clean(v?: string | null): string | null {
  const s = (v ?? '').trim()
  return s || null
}

// Odpowiednik `lead_stage_rank()` z migracji 116. Kolejność etykiet w enumie
// nie odpowiada kolejności w lejku, więc porównywanie statusów wprost dałoby
// bzdurny wynik.
const STAGE_RANK: Record<string, number> = {
  new: 0, contacted: 1, qualified: 2, booked: 3, no_show: 3, won: 4, lost: 0, nurture: 0,
}
function rank(status?: string | null): number {
  return STAGE_RANK[status ?? 'new'] ?? 0
}

export async function createLead(
  admin: SupabaseClient,
  input: CreateLeadInput
): Promise<CreateLeadResult> {
  const email = clean(input.email)
  const phone = clean(input.phone)
  if (!email && !phone) {
    // Odpowiednik ograniczenia `leads_kontakt_wymagany` — łapiemy wcześniej,
    // żeby zwrócić zrozumiały komunikat zamiast błędu bazy.
    throw new Error('Lead musi mieć e-mail albo telefon.')
  }

  const emailNorm = normEmail(email)
  const phoneNorm = normPhone(phone)

  const row = {
    source: 'form' as const,
    entry_point: input.entryPoint,
    campaign: clean(input.campaign),
    first_name: clean(input.firstName),
    last_name: clean(input.lastName),
    email,
    phone,
    parent_name: clean(input.parentName),
    student_type: input.studentType ?? null,
    student_age: input.studentAge ?? null,
    location: input.location ?? null,
    goal: clean(input.goal),
    preferred_start: clean(input.preferredStart),
    interested_group_id: input.interestedGroupId ?? null,
    consent_marketing: input.consentMarketing ?? false,
    consent_at: input.consentMarketing ? new Date().toISOString() : null,
    consent_clause: input.consentMarketing ? clean(input.consentClause) : null,
    status: input.status ?? 'new',
    booked_slot_at: input.bookedSlotAt ?? null,
    referral_code: clean(input.referralCode),
  }

  const existing = await findExisting(admin, emailNorm, phoneNorm)
  if (existing) {
    await mergeIntoExisting(admin, existing, row)
    return { leadId: existing, isReturning: true }
  }

  const { data, error } = await admin.from('leads').insert(row).select('id').single()

  if (error) {
    // 23505 = naruszenie unikalności. Dwa zgłoszenia z tego samego kontaktu
    // wysłane w tej samej chwili — drugie dopisujemy do pierwszego zamiast
    // zwracać użytkownikowi błąd.
    if (error.code === '23505') {
      const found = await findExisting(admin, emailNorm, phoneNorm)
      if (found) {
        await mergeIntoExisting(admin, found, row)
        return { leadId: found, isReturning: true }
      }
    }
    throw error
  }

  return { leadId: data.id as string, isReturning: false }
}

// Dwa osobne zapytania zamiast jednego `.or(...)`: filtr `.or()` przyjmuje
// gotowy ciąg znaków, więc adres e-mail z przecinkiem albo nawiasem —
// pochodzący wprost z formularza — zmieniłby jego strukturę. `.eq()` przekazuje
// wartość jako parametr i takiej możliwości nie ma.
async function findExisting(
  admin: SupabaseClient,
  emailNorm: string | null,
  phoneNorm: string | null
): Promise<string | null> {
  for (const [column, value] of [
    ['email_norm', emailNorm],
    ['phone_norm', phoneNorm],
  ] as const) {
    if (!value) continue
    const { data } = await admin
      .from('leads')
      .select('id')
      .eq(column, value)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (data?.id) return data.id as string
  }
  return null
}

// Ktoś już jest w lejku i odzywa się ponownie. Nie nadpisujemy tego, co wiemy —
// uzupełniamy tylko puste pola i zostawiamy ślad na osi czasu, żeby zespół
// zobaczył nowe zgłoszenie zamiast cichej aktualizacji.
async function mergeIntoExisting(
  admin: SupabaseClient,
  leadId: string,
  row: Record<string, unknown>
): Promise<void> {
  const { data: current } = await admin
    .from('leads')
    .select('first_name, last_name, phone, email, parent_name, student_type, student_age, location, goal, preferred_start, interested_group_id, booked_slot_at, consent_marketing, status, referral_code')
    .eq('id', leadId)
    .single()

  const patch: Record<string, unknown> = {}
  if (current) {
    for (const key of Object.keys(current)) {
      // `status` nie jest nullowalny i ma własną regułę niżej.
      if (key === 'status' || key === 'consent_marketing') continue
      const incoming = row[key]
      if (incoming != null && incoming !== '' && current[key as keyof typeof current] == null) {
        patch[key] = incoming
      }
    }
    // Zgoda marketingowa: tylko nadanie, nigdy odebranie — cofnięcie zgody
    // jest osobną, świadomą czynnością, nie efektem ubocznym formularza.
    if (row.consent_marketing === true && current.consent_marketing !== true) {
      patch.consent_marketing = true
      patch.consent_at = row.consent_at
      patch.consent_clause = row.consent_clause
    }
    // Status idzie tylko do przodu. Ktoś, kto pytał o ofertę, a teraz
    // zarezerwował miejsce, ma trafić na właściwy etap lejka — ale odwrotnie
    // już nie: ponowne pytanie z formularza nie cofa nikogo z „booked".
    if (rank(row.status as string) > rank(current.status as string)) {
      patch.status = row.status
    }
  }

  if (Object.keys(patch).length > 0) {
    await admin.from('leads').update(patch).eq('id', leadId)
  }

  await admin.from('lead_events').insert({
    lead_id: leadId,
    type: 'note',
    actor: 'system',
    payload: {
      entry_point: row.entry_point,
      note: 'Ponowne zgłoszenie z formularza na stronie',
      goal: row.goal ?? null,
    },
  })
}
