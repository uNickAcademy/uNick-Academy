// Tożsamość ucznia — rozpoznawanie, kiedy dwie kartoteki to ta sama osoba.
//
// Reguła musi być identyczna z funkcją norm_name() w bazie (migracja 124),
// bo to na niej stoi indeks unikalny blokujący zakładanie duplikatów.
//
// Uwaga: wspólny e-mail NIE oznacza duplikatu. Model zakłada rodzica
// z kilkorgiem dzieci na jednym koncie — „Kurek Marcel" i „Kurek Igor" to dwie
// osoby. Duplikat to ta sama nazwa po normalizacji.

const PL_FROM = 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ'
const PL_TO = 'acelnoszzACELNOSZZ'

/** Małe litery, bez ogonków i interpunkcji, słowa posortowane alfabetycznie. */
export function normalizeName(name: string | null | undefined): string {
  const folded = [...(name ?? '')]
    .map((ch) => {
      const i = PL_FROM.indexOf(ch)
      return i >= 0 ? PL_TO[i] : ch
    })
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')

  return folded.split(' ').filter(Boolean).sort().join(' ')
}

/** Same cyfry — numery zapisywane bywają z prefiksem, spacjami i myślnikami. */
export function normalizePhone(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  return digits.length >= 9 ? digits.slice(-9) : ''
}

export type DuplicateCandidate = {
  id: string
  profileId: string
  name: string
  email: string | null
  phone: string | null
  status: string
  lessons: number
  groups: number
  transactions: number
  balance: number
  joinedAt: string
}

export type Confidence = 'pewny' | 'prawdopodobny' | 'mozliwy'

export type DuplicateGroup = {
  key: string
  confidence: Confidence
  reason: string
  members: DuplicateCandidate[]
  /** Kartoteka z największym dorobkiem — domyślnie ona zostaje. */
  suggestedKeepId: string
}

const weight = (c: DuplicateCandidate) => c.lessons + c.groups + c.transactions

function buildGroup(key: string, confidence: Confidence, reason: string, members: DuplicateCandidate[]): DuplicateGroup {
  const sorted = [...members].sort((a, b) => weight(b) - weight(a) || a.joinedAt.localeCompare(b.joinedAt))
  return { key, confidence, reason, members: sorted, suggestedKeepId: sorted[0].id }
}

/**
 * Grupuje kartoteki, które opisują tę samą osobę. Sygnały, od najmocniejszego:
 *  1. to samo konto i ta sama nazwa → na pewno duplikat,
 *  2. ta sama nazwa na dwóch kontach → ktoś zapisał się drugim adresem,
 *  3. ten sam telefon na dwóch kontach → do sprawdzenia ręcznego.
 */
export function findDuplicateGroups(students: DuplicateCandidate[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = []
  const claimed = new Set<string>()

  const collect = (
    keyOf: (c: DuplicateCandidate) => string | null,
    confidence: Confidence,
    reason: string,
    extraCheck?: (members: DuplicateCandidate[]) => boolean,
  ) => {
    const buckets: Record<string, DuplicateCandidate[]> = {}
    for (const s of students) {
      if (claimed.has(s.id)) continue
      const key = keyOf(s)
      if (!key) continue
      ;(buckets[key] ??= []).push(s)
    }
    for (const [key, members] of Object.entries(buckets)) {
      if (members.length < 2) continue
      if (extraCheck && !extraCheck(members)) continue
      members.forEach((m) => claimed.add(m.id))
      groups.push(buildGroup(`${confidence}:${key}`, confidence, reason, members))
    }
  }

  collect(
    (s) => `${s.profileId}|${normalizeName(s.name)}`,
    'pewny',
    'To samo konto i ta sama nazwa — jedna osoba w dwóch kartotekach',
  )

  collect(
    (s) => normalizeName(s.name) || null,
    'prawdopodobny',
    'Ta sama nazwa na różnych kontach — najpewniej zapis drugim adresem e-mail',
    (members) => new Set(members.map((m) => m.profileId)).size > 1,
  )

  collect(
    (s) => normalizePhone(s.phone) || null,
    'mozliwy',
    'Ten sam numer telefonu na różnych kontach — do sprawdzenia',
    (members) => new Set(members.map((m) => m.profileId)).size > 1,
  )

  const order: Record<Confidence, number> = { pewny: 0, prawdopodobny: 1, mozliwy: 2 }
  return groups.sort((a, b) => order[a.confidence] - order[b.confidence] || b.members.length - a.members.length)
}
