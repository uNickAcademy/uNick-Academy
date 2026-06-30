import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isGoCardlessConfigured, getAccessToken, createRequisition } from "@/lib/ufos/banking/gocardless"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isGoCardlessConfigured()) {
    return NextResponse.json({ error: "GoCardless nie jest skonfigurowany" }, { status: 503 })
  }

  const { entityId, institutionId } = await req.json()
  if (!entityId || !institutionId) {
    return NextResponse.json({ error: "Brak wymaganych danych" }, { status: 400 })
  }

  // Verify the user has access to this entity (RLS-backed check)
  const { data: entity } = await supabase
    .schema("ufos").from("entities").select("id").eq("id", entityId).single()
  if (!entity) return NextResponse.json({ error: "Brak dostępu do spółki" }, { status: 403 })

  const origin = new URL(req.url).origin
  // reference encodes entity so the callback knows where to attach accounts
  const reference = `ufos:${entityId}:${Date.now()}`
  const redirectUrl = `${origin}/api/ufos/banking/callback?entity=${entityId}`

  try {
    const token = await getAccessToken()
    const requisition = await createRequisition(token, institutionId, redirectUrl, reference)

    // Persist the requisition id so the callback can resolve linked accounts
    await supabase.schema("ufos").from("bank_accounts").insert({
      entity_id: entityId,
      name: "Łączenie w toku…",
      provider: "gocardless",
      requisition_id: requisition.id,
      active: false,
    })

    return NextResponse.json({ link: requisition.link, requisitionId: requisition.id })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Błąd" }, { status: 500 })
  }
}
