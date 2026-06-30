"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const COLORS = ["#1C2B4A", "#2E4A7A", "#4A6FA5", "#6B8CB8", "#16203A"]

/** Add a legal entity (spółka), optionally prefilled from GUS by NIP. */
export async function addEntity(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const name       = (formData.get("name") as string)?.trim()
  const short_name = (formData.get("short_name") as string)?.trim()
  const type        = (formData.get("type") as string) || "sp_zoo"
  const nip         = (formData.get("nip") as string)?.replace(/[^0-9]/g, "") || null
  const krs         = (formData.get("krs") as string)?.trim() || null
  const regon       = (formData.get("regon") as string)?.trim() || null
  const street       = (formData.get("street") as string)?.trim()
  const city          = (formData.get("city") as string)?.trim()
  const postal_code  = (formData.get("postal_code") as string)?.trim()
  const vat_payer = formData.get("vat_payer") === "on"
  const vat_rate  = vat_payer ? Number(formData.get("vat_rate") ?? 23) || 23 : 0

  if (!name || !short_name) {
    redirect("/ustawienia/spolki/nowa?error=missing")
  }

  const address = street || city || postal_code
    ? { street: street || null, city: city || null, postal_code: postal_code || null, country: "Polska" }
    : null

  const { error } = await supabase.schema("ufos").from("entities").insert({
    name,
    short_name,
    type,
    nip,
    krs,
    regon,
    address,
    vat_payer,
    vat_rate,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  })

  if (error) {
    const reason = error.code === "23505" ? "duplicate" : "save"
    redirect(`/ustawienia/spolki/nowa?error=${reason}`)
  }

  revalidatePath("/ustawienia")
  redirect("/ustawienia")
}
