import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isGusConfigured, lookupByNip } from "@/lib/gus/client"

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isGusConfigured()) {
    return NextResponse.json({ error: "Wyszukiwanie GUS nie jest skonfigurowane" }, { status: 503 })
  }

  const nip = new URL(req.url).searchParams.get("nip") ?? ""
  if (nip.replace(/[^0-9]/g, "").length !== 10) {
    return NextResponse.json({ error: "Podaj poprawny NIP (10 cyfr)" }, { status: 400 })
  }

  try {
    const company = await lookupByNip(nip)
    return NextResponse.json(company)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Błąd GUS" }, { status: 500 })
  }
}
