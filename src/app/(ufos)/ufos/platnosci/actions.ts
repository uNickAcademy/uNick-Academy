"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { parseBankCsv } from "@/lib/ufos/banking/csv-parser"

/** Add a bank account (manual / for CSV import). */
export async function addBankAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const name           = formData.get("name") as string
  const bank_name      = formData.get("bank_name") as string || null
  const account_number = formData.get("account_number") as string || null
  const iban           = formData.get("iban") as string || null
  const entity_id      = formData.get("entity_id") as string

  if (!name?.trim() || !entity_id) return

  await supabase
    .schema("ufos")
    .from("bank_accounts")
    .insert({
      name: name.trim(),
      bank_name,
      account_number,
      iban,
      entity_id,
      provider: "csv",
    })

  revalidatePath("/platnosci")
  redirect("/ufos/platnosci")
}

/** Import a bank statement CSV into bank_transactions. */
export async function importBankCsv(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const account_id = formData.get("account_id") as string
  const file       = formData.get("file") as File | null
  if (!account_id || !file || file.size === 0) return

  const { data: account } = await supabase
    .schema("ufos")
    .from("bank_accounts")
    .select("id, entity_id")
    .eq("id", account_id)
    .single()
  if (!account) return

  const content = await file.text()
  const { rows } = parseBankCsv(content)

  const valid = rows.filter((r) => r.booking_date && r.amount !== null)
  if (valid.length === 0) {
    redirect(`/ufos/platnosci/import?account=${account_id}&error=empty`)
  }

  // Deduplicate within the file by a synthetic key (date+amount+desc)
  const records = valid.map((r) => ({
    entity_id:    account.entity_id,
    account_id,
    external_id:  `csv:${r.booking_date}:${r.amount}:${(r.description ?? "").slice(0, 40)}`,
    booking_date: r.booking_date,
    amount:       r.amount,
    counterparty_name: r.counterparty_name,
    description:  r.description,
    match_status: "unmatched",
    raw_data:     r.raw,
  }))

  // upsert on (account_id, external_id) to avoid re-importing same rows
  await supabase
    .schema("ufos")
    .from("bank_transactions")
    .upsert(records, { onConflict: "account_id,external_id", ignoreDuplicates: true })

  await supabase
    .schema("ufos")
    .from("bank_accounts")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", account_id)

  revalidatePath("/platnosci")
  redirect(`/ufos/platnosci?imported=${valid.length}`)
}

/** Match a transaction to a student (reconciliation). */
export async function matchTransaction(txId: string, studentId: string | null, note: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .schema("ufos")
    .from("bank_transactions")
    .update({
      match_status: "matched",
      matched_student_id: studentId,
      matched_note: note,
      matched_by: user.id,
      matched_at: new Date().toISOString(),
    })
    .eq("id", txId)

  revalidatePath("/platnosci")
}

/** Mark a transaction as ignored (not relevant to reconciliation). */
export async function ignoreTransaction(txId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .schema("ufos")
    .from("bank_transactions")
    .update({ match_status: "ignored", matched_by: user.id, matched_at: new Date().toISOString() })
    .eq("id", txId)

  revalidatePath("/platnosci")
}

/** Reset a transaction back to unmatched. */
export async function unmatchTransaction(txId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .schema("ufos")
    .from("bank_transactions")
    .update({
      match_status: "unmatched",
      matched_student_id: null,
      matched_note: null,
      matched_by: null,
      matched_at: null,
    })
    .eq("id", txId)

  revalidatePath("/platnosci")
}
