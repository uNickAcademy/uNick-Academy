import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  isGoCardlessConfigured, getAccessToken, getRequisition, getAccountBalances,
} from "@/lib/ufos/banking/gocardless"

/**
 * Bank redirects the user back here after authorising. The `ref` query param
 * is the requisition reference; we look up the requisition to get the now-linked
 * account ids and persist them.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const origin = url.origin
  const entityId = url.searchParams.get("entity")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  if (!isGoCardlessConfigured() || !entityId) {
    return NextResponse.redirect(`${origin}/ufos/ustawienia/bank?error=config`)
  }

  // Find the pending requisition for this entity (most recent)
  const { data: pending } = await supabase
    .schema("ufos").from("bank_accounts")
    .select("id, requisition_id")
    .eq("entity_id", entityId)
    .eq("provider", "gocardless")
    .eq("active", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!pending?.requisition_id) {
    return NextResponse.redirect(`${origin}/ufos/ustawienia/bank?error=norequisition`)
  }

  try {
    const token = await getAccessToken()
    const requisition = await getRequisition(token, pending.requisition_id)

    if (!requisition.accounts || requisition.accounts.length === 0) {
      return NextResponse.redirect(`${origin}/ufos/ustawienia/bank?error=noaccounts`)
    }

    // Remove the placeholder, create a real row per linked account
    await supabase.schema("ufos").from("bank_accounts").delete().eq("id", pending.id)

    for (const accId of requisition.accounts) {
      let balance: number | null = null
      try {
        const balances = await getAccountBalances(token, accId)
        const b = balances.balances.find((x) => x.balanceType.includes("Available")) ?? balances.balances[0]
        if (b) balance = Number(b.balanceAmount.amount)
      } catch { /* balance optional */ }

      await supabase.schema("ufos").from("bank_accounts").insert({
        entity_id: entityId,
        name: "Konto bankowe",
        provider: "gocardless",
        provider_account_id: accId,
        requisition_id: requisition.id,
        current_balance: balance,
        active: true,
      })
    }

    return NextResponse.redirect(`${origin}/ufos/ustawienia/bank?connected=1`)
  } catch {
    return NextResponse.redirect(`${origin}/ufos/ustawienia/bank?error=sync`)
  }
}
