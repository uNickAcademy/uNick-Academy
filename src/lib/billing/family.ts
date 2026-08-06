import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChargeOutcome } from './charge'

// Rozliczenie rodzinne.
//
// Rodzina = jedno konto rodzica (profil) i wiszące pod nim podkonta wszystkich
// uczestników: rodzeństwa albo rodzica i dziecka. Wspólny adres e-mail rodzica
// jest tym, co je łączy.
//
// Rodzic ma dostać jeden rachunek na miesiąc, a nie osobny za każde dziecko.
// W księgach obciążenia zostają per podkonto — inaczej historia i saldo
// pojedynczego ucznia przestałyby się zgadzać — ale do zapłaty idzie jedna
// kwota z jednym linkiem, a wpłata rozksięgowuje się z powrotem na podkonta
// (patrz allocation w lib/stripe/checkout i webhooku Stripe).

export type FamilyBill = {
  profileId: string
  email: string | null
  /** Podkonto, na które wystawiamy link do płatności — najstarsze w rodzinie. */
  payerId: string
  payerName: string
  /** Nazwa z konta rodzica — do niej adresujemy rachunek rodzinny. */
  accountName: string | null
  total: number
  items: { studentId: string; name: string; amount: number }[]
}

type Family = { profileId: string; email: string | null; accountName: string | null; joinedAt: string }

/** Profil (rodzina) dla każdego z podanych uczniów. */
export async function loadFamilyMap(
  supabase: SupabaseClient,
  studentIds: string[],
): Promise<Record<string, Family>> {
  if (studentIds.length === 0) return {}
  const { data } = await supabase
    .from('students')
    .select('id, profile_id, joined_at, profile:profiles(email, full_name)')
    .in('id', studentIds)

  const map: Record<string, Family> = {}
  for (const s of data ?? []) {
    const p = (Array.isArray(s.profile) ? s.profile[0] : s.profile) as { email?: string; full_name?: string } | undefined
    map[s.id] = {
      profileId: s.profile_id,
      email: p?.email ?? null,
      accountName: p?.full_name ?? null,
      joinedAt: s.joined_at,
    }
  }
  return map
}

/**
 * Zwija naliczenia pojedynczych uczniów w rachunki rodzinne. Uczniowie bez
 * kwoty do zapłaty są pomijani, rodziny bez żadnej kwoty nie tworzą rachunku.
 */
export function groupIntoFamilyBills(
  outcomes: ChargeOutcome[],
  families: Record<string, Family>,
): FamilyBill[] {
  const byProfile = new Map<string, FamilyBill>()
  const payerSince = new Map<string, string>()

  for (const o of outcomes) {
    if (o.charged <= 0) continue
    const fam = families[o.student.id]
    if (!fam) continue

    let bill = byProfile.get(fam.profileId)
    if (!bill) {
      bill = {
        profileId: fam.profileId,
        email: fam.email ?? o.student.email,
        payerId: o.student.id,
        payerName: o.student.name,
        accountName: fam.accountName,
        total: 0,
        items: [],
      }
      byProfile.set(fam.profileId, bill)
      payerSince.set(fam.profileId, fam.joinedAt)
    }

    // Płatnikiem zostaje najstarsze podkonto — zwykle konto rodzica.
    if (fam.joinedAt < (payerSince.get(fam.profileId) ?? fam.joinedAt)) {
      bill.payerId = o.student.id
      bill.payerName = o.student.name
      payerSince.set(fam.profileId, fam.joinedAt)
    }

    bill.items.push({ studentId: o.student.id, name: o.student.name, amount: o.charged })
    bill.total += o.charged
  }

  return [...byProfile.values()].filter((b) => b.total > 0)
}

/** Podział wpłaty na podkonta — trafia do metadanych sesji Stripe. */
export function allocationOf(bill: FamilyBill): { studentId: string; amount: number }[] {
  return bill.items.map((i) => ({ studentId: i.studentId, amount: i.amount }))
}

/**
 * Do kogo adresujemy rachunek. Przy rodzinie z kilkorgiem dzieci — do rodzica
 * (nazwa z konta), bo to on płaci; nazwiska uczestników i tak są w rozbiciu.
 * Imiona bywają zapisane raz przed, raz po nazwisku, więc nie sklejamy ich
 * w jedną etykietę — wyszłoby „Naskrętski, Naskrętski i Naskrętska".
 */
export function billLabel(bill: FamilyBill): string {
  if (bill.items.length > 1 && bill.accountName) return bill.accountName
  return bill.payerName
}

/**
 * Wystawia rodzinom rachunki za dany miesiąc: jeden link do płatności i jeden
 * mail na rodzinę. Używane i przez cron miesięczny, i przez doliczenie lekcji
 * po pierwszych zajęciach — żeby rodzic nigdy nie dostał dwóch rachunków tam,
 * gdzie powinien dostać jeden.
 */
export async function billFamilies(
  supabase: SupabaseClient,
  outcomes: ChargeOutcome[],
  monthLabel: string,
  deps: {
    createCheckout: (opts: {
      amount: number; studentId: string; email: string; description: string
      allocation: { studentId: string; amount: number }[]
    }) => Promise<string | null>
    sendPayment: (to: string, params: {
      studentName: string; monthLabel: string; amount: number
      paymentUrl?: string | null; items?: { name: string; amount: number }[]
    }) => Promise<void>
  },
): Promise<{ families: number; emailed: number; total: number }> {
  const charged = outcomes.filter((o) => o.charged > 0)
  if (charged.length === 0) return { families: 0, emailed: 0, total: 0 }

  const familyMap = await loadFamilyMap(supabase, charged.map((o) => o.student.id))
  const bills = groupIntoFamilyBills(outcomes, familyMap)

  let emailed = 0
  for (const bill of bills) {
    if (!bill.email) continue

    let paymentUrl: string | null = null
    try {
      paymentUrl = await deps.createCheckout({
        amount: bill.total,
        studentId: bill.payerId,
        email: bill.email,
        description: `Zajęcia — ${monthLabel}`,
        allocation: allocationOf(bill),
      })
    } catch (err) {
      console.error('[Billing] checkout rodzinny:', err)
    }

    await deps.sendPayment(bill.email, {
      studentName: billLabel(bill),
      monthLabel,
      amount: bill.total,
      paymentUrl,
      items: bill.items.map((i) => ({ name: i.name, amount: i.amount })),
    }).catch(() => {})
    emailed++
  }

  return {
    families: bills.length,
    emailed,
    total: bills.reduce((a, b) => a + b.total, 0),
  }
}
