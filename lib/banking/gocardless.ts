/**
 * GoCardless Bank Account Data (formerly Nordigen) integration.
 *
 * PSD2 Open Banking — READ ONLY access to account balances and transactions.
 * This module can NEVER initiate payments — the API itself does not grant that
 * scope, which aligns with the uFOS AI/automation safety rules.
 *
 * Setup required (CFO, one-time):
 *   1. Free account at https://bankaccountdata.gocardless.com/
 *   2. Generate a secret_id + secret_key in the developer portal
 *   3. Add to Vercel env vars:
 *        GOCARDLESS_SECRET_ID
 *        GOCARDLESS_SECRET_KEY
 *
 * Flow:
 *   getAccessToken() → listInstitutions() → createRequisition()
 *   → user authorises at their bank → getRequisition() exposes account ids
 *   → getAccountTransactions() / getAccountBalances()
 */

const BASE_URL = "https://bankaccountdata.gocardless.com/api/v2"

export function isGoCardlessConfigured(): boolean {
  return !!(process.env.GOCARDLESS_SECRET_ID && process.env.GOCARDLESS_SECRET_KEY)
}

interface TokenResponse {
  access: string
  access_expires: number
  refresh: string
  refresh_expires: number
}

/** Exchange the secret pair for a short-lived access token. */
export async function getAccessToken(): Promise<string> {
  const secret_id = process.env.GOCARDLESS_SECRET_ID
  const secret_key = process.env.GOCARDLESS_SECRET_KEY
  if (!secret_id || !secret_key) {
    throw new Error("GoCardless nie jest skonfigurowany (brak GOCARDLESS_SECRET_ID / GOCARDLESS_SECRET_KEY)")
  }

  const res = await fetch(`${BASE_URL}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ secret_id, secret_key }),
  })

  if (!res.ok) {
    throw new Error(`GoCardless token error: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as TokenResponse
  return data.access
}

export interface Institution {
  id: string
  name: string
  bic: string
  logo: string
  transaction_total_days: string
}

/** List banks available for a country (default Poland). */
export async function listInstitutions(token: string, country = "pl"): Promise<Institution[]> {
  const res = await fetch(`${BASE_URL}/institutions/?country=${country}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`GoCardless institutions error: ${res.status}`)
  return (await res.json()) as Institution[]
}

export interface Requisition {
  id: string
  status: string
  link: string
  accounts: string[]
  institution_id: string
  reference: string
}

/**
 * Create a requisition (consent). Returns a `link` to redirect the user to
 * their bank for authorisation. After they return, poll getRequisition().
 */
export async function createRequisition(
  token: string,
  institutionId: string,
  redirectUrl: string,
  reference: string,
): Promise<Requisition> {
  const res = await fetch(`${BASE_URL}/requisitions/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      redirect: redirectUrl,
      institution_id: institutionId,
      reference,
      user_language: "PL",
    }),
  })
  if (!res.ok) throw new Error(`GoCardless requisition error: ${res.status} ${await res.text()}`)
  return (await res.json()) as Requisition
}

/** Fetch a requisition — once status is LN (linked), `accounts` is populated. */
export async function getRequisition(token: string, requisitionId: string): Promise<Requisition> {
  const res = await fetch(`${BASE_URL}/requisitions/${requisitionId}/`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`GoCardless requisition fetch error: ${res.status}`)
  return (await res.json()) as Requisition
}

export interface RawTransaction {
  transactionId?: string
  internalTransactionId?: string
  bookingDate?: string
  valueDate?: string
  transactionAmount: { amount: string; currency: string }
  creditorName?: string
  debtorName?: string
  creditorAccount?: { iban?: string }
  debtorAccount?: { iban?: string }
  remittanceInformationUnstructured?: string
  remittanceInformationUnstructuredArray?: string[]
}

export interface AccountTransactions {
  transactions: {
    booked: RawTransaction[]
    pending: RawTransaction[]
  }
}

/** Get booked + pending transactions for a linked account. */
export async function getAccountTransactions(token: string, accountId: string): Promise<AccountTransactions> {
  const res = await fetch(`${BASE_URL}/accounts/${accountId}/transactions/`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`GoCardless transactions error: ${res.status}`)
  return (await res.json()) as AccountTransactions
}

export interface AccountBalances {
  balances: Array<{
    balanceAmount: { amount: string; currency: string }
    balanceType: string
  }>
}

/** Get balances for a linked account. */
export async function getAccountBalances(token: string, accountId: string): Promise<AccountBalances> {
  const res = await fetch(`${BASE_URL}/accounts/${accountId}/balances/`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`GoCardless balances error: ${res.status}`)
  return (await res.json()) as AccountBalances
}

/**
 * Normalise a raw GoCardless transaction into the shape stored in
 * ufos.bank_transactions. Positive amount = inflow.
 */
export function normalizeTransaction(raw: RawTransaction) {
  const amount = Number(raw.transactionAmount.amount)
  const isInflow = amount > 0
  const description =
    raw.remittanceInformationUnstructured ??
    raw.remittanceInformationUnstructuredArray?.join(" ") ??
    null

  return {
    external_id: raw.transactionId ?? raw.internalTransactionId ?? null,
    booking_date: raw.bookingDate ?? raw.valueDate ?? null,
    value_date: raw.valueDate ?? null,
    amount,
    currency: raw.transactionAmount.currency || "PLN",
    // For an inflow the relevant counterparty is the debtor (payer)
    counterparty_name: isInflow ? raw.debtorName ?? null : raw.creditorName ?? null,
    counterparty_iban: isInflow ? raw.debtorAccount?.iban ?? null : raw.creditorAccount?.iban ?? null,
    description,
    raw_data: raw,
  }
}
