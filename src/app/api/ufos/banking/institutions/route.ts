import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isGoCardlessConfigured, getAccessToken, listInstitutions } from "@/lib/ufos/banking/gocardless"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isGoCardlessConfigured()) {
    return NextResponse.json({ error: "GoCardless nie jest skonfigurowany" }, { status: 503 })
  }

  try {
    const token = await getAccessToken()
    const institutions = await listInstitutions(token, "pl")
    return NextResponse.json({
      institutions: institutions.map((i) => ({ id: i.id, name: i.name, bic: i.bic, logo: i.logo })),
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Błąd" }, { status: 500 })
  }
}
