"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const title    = formData.get("title") as string
  const category = formData.get("category") as string
  const priority = formData.get("priority") as string
  const due_date = formData.get("due_date") as string || null
  const description = formData.get("description") as string || null
  const entity_id   = formData.get("entity_id") as string || null

  if (!title?.trim()) return

  await supabase
    .schema("ufos")
    .from("tasks")
    .insert({
      title:       title.trim(),
      category,
      priority,
      due_date:    due_date || null,
      description: description || null,
      entity_id:   entity_id || null,
      created_by:  user.id,
      status:      "open",
    })

  revalidatePath("/zadania")
  redirect("/ufos/zadania")
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const update: Record<string, unknown> = { status }
  if (status === "done") update.completed_at = new Date().toISOString()

  await supabase
    .schema("ufos")
    .from("tasks")
    .update(update)
    .eq("id", taskId)

  revalidatePath("/zadania")
  revalidatePath(`/zadania/${taskId}`)
}
