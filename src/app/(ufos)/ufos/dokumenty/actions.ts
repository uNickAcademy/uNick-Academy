"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const title         = formData.get("title") as string
  const document_type = formData.get("document_type") as string
  const document_date = formData.get("document_date") as string || null
  const due_date      = formData.get("due_date") as string || null
  const counterparty  = formData.get("counterparty") as string || null
  const amount        = formData.get("amount") as string || null
  const description   = formData.get("description") as string || null
  const entity_id     = formData.get("entity_id") as string || null
  const file          = formData.get("file") as File | null

  if (!title?.trim()) return

  let storage_path: string | null = null
  let file_name: string | null = null
  let file_size: number | null = null
  let mime_type: string | null = null

  if (file && file.size > 0) {
    file_name = file.name
    file_size = file.size
    mime_type = file.type

    const ext  = file.name.split(".").pop() ?? "bin"
    const path = `${entity_id ?? "global"}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from("ufos-documents")
      .upload(path, file, { contentType: file.type, upsert: false })

    if (!uploadError) {
      storage_path = path
    }
  }

  await supabase
    .schema("ufos")
    .from("documents")
    .insert({
      title:         title.trim(),
      document_type,
      document_date: document_date || null,
      due_date:      due_date || null,
      counterparty:  counterparty || null,
      amount:        amount ? Number(amount) : null,
      description:   description || null,
      entity_id:     entity_id || null,
      storage_path,
      file_name,
      file_size,
      mime_type,
      uploaded_by:   user.id,
      status:        "pending",
    })

  revalidatePath("/dokumenty")
  redirect("/ufos/dokumenty")
}

export async function updateDocumentStatus(docId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const update: Record<string, unknown> = { status }
  if (status === "reviewed" || status === "approved") {
    update.reviewed_by = user.id
    update.reviewed_at = new Date().toISOString()
  }

  await supabase
    .schema("ufos")
    .from("documents")
    .update(update)
    .eq("id", docId)

  revalidatePath("/dokumenty")
  revalidatePath(`/dokumenty/${docId}`)
}
