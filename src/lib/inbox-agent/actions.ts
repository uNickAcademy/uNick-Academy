import type { SupabaseClient } from '@supabase/supabase-js'
import { getInboxConfig, type CategoryKey } from './config'
import {
  closeMailbox,
  composeReplyText,
  ensureFolders,
  findByMessageId,
  markAnswered,
  moveMail,
  openMailbox,
  replySubject,
  sendReply,
} from './mailbox'
import { loadState } from './knowledge'
import { defaultSignature } from './run'

// Decyzje człowieka z panelu /admin/skrzynka: wysłanie (ewentualnie
// poprawionej) odpowiedzi albo uznanie, że mail odpowiedzi nie wymaga.

type Row = {
  id: string
  message_id: string
  from_address: string
  from_name: string | null
  reply_to_address: string | null
  subject: string | null
  received_at: string | null
  body_text: string | null
  references_ids: string[] | null
  category: string
  reusable_topic: string | null
}

export type ActionResult = { ok: true } | { ok: false; error: string; status: number }

// Przejmuje wiersz na czas akcji. Dwa kliknięcia „Wyślij" (albo dwie osoby
// w panelu naraz) nie mogą wysłać tej samej odpowiedzi dwa razy.
async function claim(admin: SupabaseClient, id: string): Promise<Row | null> {
  const { data } = await admin
    .from('inbox_agent_messages')
    .update({ status: 'sending', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'needs_review')
    .select('id, message_id, from_address, from_name, reply_to_address, subject, received_at, body_text, references_ids, category, reusable_topic')
  return (data?.[0] as Row | undefined) ?? null
}

async function release(admin: SupabaseClient, id: string, error: string) {
  await admin.from('inbox_agent_messages')
    .update({ status: 'needs_review', error: error.slice(0, 500), updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function approveAndSend(
  admin: SupabaseClient,
  opts: { id: string; body: string; remember: boolean; topic?: string; userId: string },
): Promise<ActionResult> {
  const body = opts.body.trim()
  if (!body) return { ok: false, error: 'Odpowiedź jest pusta.', status: 400 }
  if (/\[[^\]]*\]/.test(body)) {
    return { ok: false, error: 'W treści zostały miejsca do uzupełnienia w nawiasach kwadratowych. Uzupełnij je przed wysłaniem.', status: 400 }
  }
  const cfg = getInboxConfig()
  if (!cfg) return { ok: false, error: 'Skrzynka nie jest skonfigurowana.', status: 503 }

  const row = await claim(admin, opts.id)
  if (!row) return { ok: false, error: 'Ten mail został już obsłużony.', status: 409 }

  const state = await loadState(admin)
  const original = {
    from: { address: row.from_address, name: row.from_name ?? '' },
    date: row.received_at ? new Date(row.received_at) : new Date(),
    text: row.body_text ?? '',
  }

  let client
  try {
    client = await openMailbox(cfg)
    const folders = await ensureFolders(client)
    const hasRealId = !row.message_id.startsWith('<brak-id-')
    await sendReply(client, cfg, folders, {
      to: row.reply_to_address || row.from_address,
      subject: replySubject(row.subject ?? ''),
      text: composeReplyText(body, state.signature || defaultSignature(), original),
      inReplyTo: hasRealId ? row.message_id : null,
      references: hasRealId ? [...(row.references_ids ?? []), row.message_id] : [],
    })
  } catch (err) {
    if (client) await closeMailbox(client)
    const message = `Nie udało się wysłać: ${(err as Error).message}`
    await release(admin, row.id, message)
    return { ok: false, error: message, status: 502 }
  }

  // Od tego miejsca mail już wyszedł: reszta to porządki, które nie mogą
  // cofnąć statusu na „do decyzji".
  await admin.from('inbox_agent_messages')
    .update({ status: 'replied_approved', final_body: body, error: null, handled_by: opts.userId, handled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', row.id)

  try {
    const folders = await ensureFolders(client)
    const target = folders.categories[row.category as CategoryKey] ?? folders.categories.inne
    for (const folder of [folders.review, folders.inbox]) {
      const found = await findByMessageId(client, folder, row.message_id)
      if (found) {
        await markAnswered(client, folder, found.uid)
        await moveMail(client, folder, found.uid, target)
        break
      }
    }
  } catch (err) {
    console.error('[AgentSkrzynki] Odpowiedź wysłana, ale nie udało się odłożyć maila:', (err as Error).message)
  } finally {
    await closeMailbox(client)
  }

  const topic = (opts.topic ?? row.reusable_topic ?? '').trim()
  if (opts.remember && topic) {
    await admin.from('inbox_agent_knowledge').insert({
      topic,
      answer: body,
      source: 'approved_reply',
      source_message_id: row.id,
      created_by: opts.userId,
    })
  }
  return { ok: true }
}

export async function dismiss(admin: SupabaseClient, opts: { id: string; userId: string }): Promise<ActionResult> {
  const cfg = getInboxConfig()
  if (!cfg) return { ok: false, error: 'Skrzynka nie jest skonfigurowana.', status: 503 }
  const row = await claim(admin, opts.id)
  if (!row) return { ok: false, error: 'Ten mail został już obsłużony.', status: 409 }

  let client
  try {
    client = await openMailbox(cfg)
    const folders = await ensureFolders(client)
    const target = folders.categories[row.category as CategoryKey] ?? folders.categories.inne
    const found = await findByMessageId(client, folders.review, row.message_id)
    if (found) await moveMail(client, folders.review, found.uid, target)
  } catch (err) {
    const message = `Nie udało się przenieść maila: ${(err as Error).message}`
    await release(admin, row.id, message)
    return { ok: false, error: message, status: 502 }
  } finally {
    if (client) await closeMailbox(client)
  }

  await admin.from('inbox_agent_messages')
    .update({ status: 'dismissed', error: null, handled_by: opts.userId, handled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', row.id)
  return { ok: true }
}
