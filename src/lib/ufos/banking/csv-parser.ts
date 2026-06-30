/**
 * Heuristic parser for Polish bank statement CSV exports.
 *
 * Polish banks (mBank, PKO BP, ING, Santander, Millennium...) all export
 * different CSV layouts, so instead of one fixed schema we detect columns by
 * matching header keywords. Works for the common case; the user can also map
 * columns manually if detection fails.
 */

import Papa from "papaparse"

export interface ParsedBankRow {
  booking_date: string | null  // ISO yyyy-mm-dd
  amount: number | null
  counterparty_name: string | null
  description: string | null
  raw: Record<string, string>
}

// Header keyword groups (lowercased, accent-insensitive match)
const DATE_KEYS = ["data operacji", "data księgowania", "data ksiegowania", "data transakcji", "data waluty", "data"]
const AMOUNT_KEYS = ["kwota", "obciążenia/uznania", "amount", "kwota operacji", "kwota w walucie rachunku"]
const NAME_KEYS = ["nadawca", "odbiorca", "kontrahent", "nazwa nadawcy", "nadawca/odbiorca", "strona transakcji"]
const DESC_KEYS = ["tytuł", "tytul", "opis", "opis operacji", "szczegóły", "szczegoly", "tytuł operacji"]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
}

function findColumn(headers: string[], keys: string[]): string | null {
  const normKeys = keys.map(normalize)
  // exact match first
  for (const h of headers) {
    if (normKeys.includes(normalize(h))) return h
  }
  // partial match
  for (const h of headers) {
    const nh = normalize(h)
    if (normKeys.some((k) => nh.includes(k))) return h
  }
  return null
}

/** Parse a Polish-style amount: "1 234,56" or "-1.234,56" or "1234.56" → number. */
export function parsePolishAmount(raw: string): number | null {
  if (!raw) return null
  let s = raw.trim().replace(/\s/g, "").replace(/[^\d.,-]/g, "")
  if (!s) return null
  // If both separators present, the last one is the decimal separator
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".")
    } else {
      s = s.replace(/,/g, "")
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".")
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Parse a date in common Polish formats → ISO yyyy-mm-dd. */
export function parseDate(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim().slice(0, 10)
  // yyyy-mm-dd
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  // dd.mm.yyyy or dd-mm-yyyy or dd/mm/yyyy
  m = s.match(/^(\d{2})[.\-/](\d{2})[.\-/](\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return null
}

export interface ParseResult {
  rows: ParsedBankRow[]
  detectedColumns: { date: string | null; amount: string | null; name: string | null; description: string | null }
  totalRows: number
  validRows: number
}

export function parseBankCsv(content: string): ParseResult {
  // Auto-detect delimiter (Polish exports often use ; )
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    delimiter: "",  // auto
    transformHeader: (h) => h.trim(),
  })

  const headers = parsed.meta.fields ?? []
  const cols = {
    date: findColumn(headers, DATE_KEYS),
    amount: findColumn(headers, AMOUNT_KEYS),
    name: findColumn(headers, NAME_KEYS),
    description: findColumn(headers, DESC_KEYS),
  }

  const rows: ParsedBankRow[] = []
  for (const r of parsed.data) {
    const booking_date = cols.date ? parseDate(r[cols.date]) : null
    const amount = cols.amount ? parsePolishAmount(r[cols.amount]) : null
    const counterparty_name = cols.name ? (r[cols.name]?.trim() || null) : null
    const description = cols.description ? (r[cols.description]?.trim() || null) : null

    // Skip rows with neither a date nor an amount (header noise, totals)
    if (booking_date === null && amount === null) continue

    rows.push({ booking_date, amount, counterparty_name, description, raw: r })
  }

  const validRows = rows.filter((r) => r.booking_date && r.amount !== null).length

  return { rows, detectedColumns: cols, totalRows: rows.length, validRows }
}
