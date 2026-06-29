import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  isGoCardlessConfigured, getAccessToken, getAccountTransactions,
  getAccountBalances, normalizeTransaction,
} from "@/lib/banking/gocardless"

/** Pull latest transactions + balance for one connected account. */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isGoCardlessConfigured()) {
    return NextResponse.json({ error: "GoCardless nie jest skonfigurowany" }, { status: 503 })
  }

  const { accountId } = await req.json()
  if (!accountId) return NextResponse.json({ error: "Brak accountId" }, { status: 400 })

  const { data: account } = await supabase
    .schema("ufos").from("bank_accounts")
    .select("id, entity_id, provider_account_id")
    .eq("id", accountId)
    .single()

  if (!account?.provider_account_id) {
    return NextResponse.json({ error: "Konto nie jest podłączone przez Open Banking" }, { status: 400 })
  }

  try {
    const token = await getAccessToken()
    const { transactions } = await getAccountTransactions(token, account.provider_account_id)

    const booked = transactions.booked ?? []
    const records = booked
      .map(normalizeTransaction)
      .filter((t) => t.booking_date && t.external_id)
      .map((t) => ({
        entity_id: account.entity_id,
        account_id: account.id,
        external_id: t.external_id,
        booking_date: t.booking_date,
        value_date: t.value_date,
        amount: t.amount,
        currency: t.currency,
        counterparty_name: t.counterparty_name,
        counterparty_iban: t.counterparty_iban,
        description: t.description,
        match_status: "unmatched",
        raw_data: t.raw_data,
      }))

    if (records.length > 0) {
      await supabase.schema("ufos").from("bank_transactions")
        .upsert(records, { onConflict: "account_id,external_id", ignoreDuplicates: true })
    }

    // Refresh balance
    let balance: number | null = null
    try {
      const balances = await getAccountBalances(token, account.provider_account_id)
      const b = balances.balances.find((x) => x.balanceType.includes("Available")) ?? balances.balances[0]
      if (b) balance = Number(b.balanceAmount.amount)
    } catch { /* optional */ }

    await supabase.schema("ufos").from("bank_accounts")
      .update({ last_synced_at: new Date().toISOString(), current_balance: balance })
      .eq("id", account.id)

    return NextResponse.json({ synced: records.length })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Błąd" }, { status: 500 })
  }
}
