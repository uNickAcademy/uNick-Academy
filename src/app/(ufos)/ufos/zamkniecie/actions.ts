"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const DEFAULT_CHECKLIST = [
  { key: "lessons_marked",    label: "Lekcje zaznaczone przez nauczycieli",  done: false },
  { key: "invoices_collected", label: "Faktury kosztowe zebrane",              done: false },
  { key: "bank_reconciled",   label: "Wyciąg bankowy zweryfikowany",          done: false },
  { key: "payroll_prepared",  label: "Listy płac przygotowane",               done: false },
  { key: "jpk_sent",          label: "JPK_VAT wysłany do US",                 done: false },
  { key: "cit_advance",       label: "Zaliczka CIT opłacona",                 done: false },
  { key: "zus_paid",          label: "ZUS zapłacony",                         done: false },
  { key: "margin_reviewed",   label: "Marżowość zweryfikowana przez Milenę",  done: false },
]

export async function openMonthClose(entityId: string, period: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .schema("ufos")
    .from("month_closes")
    .upsert({
      entity_id:  entityId,
      period,
      status:     "open",
      checklist:  DEFAULT_CHECKLIST,
      opened_by:  user.id,
    }, { onConflict: "entity_id,period" })

  revalidatePath("/zamkniecie")
}

export async function toggleChecklistItem(closeId: string, itemKey: string, currentChecklist: ChecklistItem[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const updated = currentChecklist.map((item) =>
    item.key === itemKey
      ? { ...item, done: !item.done, done_at: !item.done ? new Date().toISOString() : null, done_by: !item.done ? user.id : null }
      : item
  )

  await supabase
    .schema("ufos")
    .from("month_closes")
    .update({ checklist: updated })
    .eq("id", closeId)

  revalidatePath("/zamkniecie")
}

export async function submitForApproval(closeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .schema("ufos")
    .from("month_closes")
    .update({ status: "in_review" })
    .eq("id", closeId)

  revalidatePath("/zamkniecie")
}

export async function approveMonthClose(closeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  await supabase
    .schema("ufos")
    .from("month_closes")
    .update({
      status:      "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", closeId)

  revalidatePath("/zamkniecie")
}

interface ChecklistItem {
  key: string
  label: string
  done: boolean
  done_at?: string | null
  done_by?: string | null
}
