import type { SupabaseClient } from '@supabase/supabase-js'
import type { ImapFlow } from 'imapflow'
import { DEFAULT_SIGNATURE_NAME } from './signature'
import {
  MAX_REPLY_CANDIDATES_PER_RUN,
  MAX_SORT_ONLY_PER_RUN,
  REPLY_WINDOW_DAYS,
  RUN_TIME_BUDGET_MS,
  SWEEP_PER_CALL,
  VIDEO_SWEEP_PER_CALL,
  CATEGORIES,
  TRIAGE_BATCH_SIZE,
  categoryFolder,
  getInboxConfig,
  type CategoryKey,
  type InboxConfig,
} from './config'
import {
  closeMailbox,
  composeReply,
  ensureFolders,
  fetchMails,
  findFolder,
  findVideoCandidates,
  listUids,
  markAnswered,
  moveMail,
  openMailbox,
  recentSent,
  replySubject,
  sendReply,
  type FetchedMail,
  type FolderMap,
} from './mailbox'
import { classifyTeacherVideos, distillSentHistory, draftReply, isBrainConfigured, triage, type ReplyDecision, type TriageItem, type Usage } from './brain'
import { buildKnowledgeBlock, describeSender, loadKnowledge, loadState, saveState, type AgentState } from './knowledge'

// Jeden przebieg Agenta Skrzynki. Kolejka pracy to sama skrzynka odbiorcza:
// wszystko, co w niej leży, jest jeszcze nieobsłużone, a każdy obsłużony mail
// ląduje w podfolderze. Dzięki temu przerwany przebieg niczego nie gubi:
// następny po prostu zaczyna od tego, co zostało.

export type RunSummary = {
  ok: boolean
  skipped?: string
  sorted: number
  repliedAuto: number
  needsReview: number
  filedAfterManualReply: number
  errors: number
  remainingInInbox: number
  learnedProfile: boolean
  costUsd: number
  durationMs: number
  error?: string
}

const LOCK_TTL_MS = 6 * 60_000
const PROFILE_MAX_AGE_MS = 7 * 24 * 3600_000
const LARGE_FETCH_BYTES = 96 * 1024
const SMALL_FETCH_BYTES = 16 * 1024

export function defaultSignature(): string {
  return DEFAULT_SIGNATURE_NAME
}

function emptySummary(): RunSummary {
  return { ok: true, sorted: 0, repliedAuto: 0, needsReview: 0, filedAfterManualReply: 0, errors: 0, remainingInInbox: 0, learnedProfile: false, costUsd: 0, durationMs: 0 }
}

async function pool<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        results[i] = await worker(items[i])
      }
    }),
  )
  return results
}

async function acquireLock(admin: SupabaseClient): Promise<boolean> {
  await admin.from('inbox_agent_state').upsert({ id: true }, { onConflict: 'id', ignoreDuplicates: true })
  const stale = new Date(Date.now() - LOCK_TTL_MS).toISOString()
  const { data } = await admin
    .from('inbox_agent_state')
    .update({ run_started_at: new Date().toISOString() })
    .eq('id', true)
    .or(`run_started_at.is.null,run_started_at.lt.${stale}`)
    .select('id')
  return (data?.length ?? 0) > 0
}

async function logUsage(admin: SupabaseClient, usage: Usage, startedAt: number, error?: string) {
  await admin.from('agent_usage').insert({
    agent_name: 'skrzynka',
    model: usage.model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cost_usd: usage.costUsd,
    latency_ms: Date.now() - startedAt,
    success: !error,
    error: error ?? null,
  })
}

function baseRow(mail: FetchedMail) {
  return {
    message_id: mail.messageId,
    from_address: mail.from.address,
    from_name: mail.from.name || null,
    reply_to_address: mail.replyTo?.address ?? null,
    subject: mail.subject,
    received_at: mail.date.toISOString(),
    body_text: mail.text.slice(0, 20000),
    in_reply_to: mail.inReplyTo,
    references_ids: mail.references.slice(-20),
    updated_at: new Date().toISOString(),
  }
}

type Ctx = {
  admin: SupabaseClient
  client: ImapFlow
  cfg: InboxConfig
  folders: FolderMap
  state: AgentState
  summary: RunSummary
}

async function fileAsSorted(ctx: Ctx, mail: FetchedMail, t: { category: CategoryKey; summary: string; needs_reply: boolean }, note?: string) {
  const folder = ctx.folders.categories[t.category]
  await moveMail(ctx.client, ctx.folders.inbox, mail.uid, folder)
  await ctx.admin.from('inbox_agent_messages').upsert(
    {
      ...baseRow(mail),
      category: t.category,
      folder: categoryFolder(t.category),
      summary: t.summary,
      needs_reply: t.needs_reply,
      status: 'sorted',
      error: note ?? null,
    },
    { onConflict: 'message_id' },
  )
  ctx.summary.sorted++
}

// Maile z „Do decyzji": jeśli ktoś odpisał ręcznie z poczty, odkładamy je do
// właściwego folderu. Jeśli zniknęły (przeniesione lub usunięte ręcznie),
// zamykamy sprawę w panelu.
async function reconcileReviewFolder(ctx: Ctx) {
  // Wpis, który utknął w „sending" (funkcja padła w trakcie wysyłki), wraca
  // do decyzji człowieka z ostrzeżeniem, zamiast zniknąć z panelu.
  await ctx.admin.from('inbox_agent_messages')
    .update({
      status: 'needs_review',
      error: 'Wysyłka została przerwana. Zanim wyślesz ponownie, sprawdź w folderze Wysłane, czy odpowiedź nie wyszła.',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'sending')
    .lt('updated_at', new Date(Date.now() - 10 * 60_000).toISOString())

  const { data: pending } = await ctx.admin
    .from('inbox_agent_messages')
    .select('id, message_id, category')
    .eq('status', 'needs_review')
  if (!pending || pending.length === 0) return

  const uids = await listUids(ctx.client, ctx.folders.review)
  const inFolder = new Map<string, { uid: number; flags: Set<string> }>()
  if (uids.length > 0) {
    const lock = await ctx.client.getMailboxLock(ctx.folders.review)
    try {
      const msgs = await ctx.client.fetchAll(uids.join(','), { uid: true, flags: true, envelope: true }, { uid: true })
      for (const m of msgs) {
        const id = m.envelope?.messageId?.trim()
        if (id) inFolder.set(id, { uid: m.uid, flags: m.flags ?? new Set<string>() })
      }
    } finally {
      lock.release()
    }
  }

  for (const row of pending) {
    // Maile bez nagłówka Message-ID mają identyfikator nadany przez agenta,
    // którego nie da się odszukać w folderze: zostawiamy je do ręcznej decyzji.
    if ((row.message_id as string).startsWith('<brak-id-')) continue
    const found = inFolder.get(row.message_id as string)
    if (!found) {
      await ctx.admin.from('inbox_agent_messages')
        .update({ status: 'resolved_outside', handled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', row.id).eq('status', 'needs_review')
      continue
    }
    if (found.flags.has('\\Answered')) {
      const folder = ctx.folders.categories[row.category as CategoryKey] ?? ctx.folders.categories.inne
      await moveMail(ctx.client, ctx.folders.review, found.uid, folder)
      await ctx.admin.from('inbox_agent_messages')
        .update({ status: 'replied_manually', handled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', row.id).eq('status', 'needs_review')
      ctx.summary.filedAfterManualReply++
    }
  }
}

async function refreshLearnedProfile(ctx: Ctx, force: boolean): Promise<void> {
  if (!ctx.folders.sent) return
  const age = ctx.state.learned_profile_at ? Date.now() - new Date(ctx.state.learned_profile_at).getTime() : Infinity
  if (!force && age < PROFILE_MAX_AGE_MS) return
  const startedAt = Date.now()
  const sent = (await recentSent(ctx.client, ctx.folders.sent, { limit: 70, maxBytes: SMALL_FETCH_BYTES }, ctx.cfg.user))
    .filter((m) => m.text.length > 40)
  if (sent.length < 3) return
  const { profile, usage } = await distillSentHistory(sent)
  ctx.summary.costUsd += usage.costUsd
  await logUsage(ctx.admin, usage, startedAt)
  const patch: Partial<AgentState> = { learned_profile: profile, learned_profile_at: new Date().toISOString() }
  await saveState(ctx.admin, patch)
  Object.assign(ctx.state, patch)
  ctx.summary.learnedProfile = true
}

function autoSendAllowed(state: AgentState, mail: FetchedMail, d: ReplyDecision): boolean {
  return (
    state.auto_reply &&
    !mail.automated &&
    d.needs_reply &&
    d.can_answer_fully &&
    d.confidence === 'high' &&
    !d.sensitive &&
    d.reply_body.trim().length > 0 &&
    // Nawias kwadratowy to miejsce, które agent zostawił człowiekowi do uzupełnienia.
    !/\[[^\]]*\]/.test(d.reply_body)
  )
}

// Hamulec na pętle: jednej osobie agent odpisuje sam najwyżej raz na 12 godzin.
// Druga wiadomość w tym czasie zawsze idzie do człowieka.
async function recentlyAutoReplied(admin: SupabaseClient, address: string): Promise<boolean> {
  const since = new Date(Date.now() - 12 * 3600_000).toISOString()
  const { count } = await admin
    .from('inbox_agent_messages')
    .select('id', { count: 'exact', head: true })
    .eq('from_address', address)
    .eq('status', 'replied_auto')
    .gte('handled_at', since)
  return (count ?? 0) > 0
}

async function handleReplyCandidate(ctx: Ctx, mail: FetchedMail, decision: ReplyDecision) {
  const { admin, client, cfg, folders, state } = ctx
  if (!decision.needs_reply) {
    await fileAsSorted(ctx, mail, { category: decision.category, summary: decision.summary, needs_reply: false })
    return
  }

  const row = {
    ...baseRow(mail),
    category: decision.category,
    folder: categoryFolder(decision.category),
    summary: decision.summary,
    needs_reply: true,
    confidence: decision.confidence,
    sensitive: decision.sensitive,
    owner_question: decision.question_for_owner.trim() || null,
    reusable_topic: decision.reusable_topic.trim() || null,
    draft_body: decision.reply_body.trim() || null,
  }

  const { data: existing } = await admin.from('inbox_agent_messages').select('status').eq('message_id', mail.messageId).maybeSingle()
  const alreadyReplied = ['replied_auto', 'replied_approved', 'replied_manually', 'sending'].includes(existing?.status ?? '')

  if (alreadyReplied) {
    // Mail wrócił do odbiorczej, choć już na niego odpisaliśmy: tylko odkładamy.
    await moveMail(client, folders.inbox, mail.uid, folders.categories[decision.category])
    ctx.summary.sorted++
    return
  }

  const replyTo = mail.replyTo?.address ?? mail.from.address
  if (autoSendAllowed(state, mail, decision) && !(await recentlyAutoReplied(admin, mail.from.address))) {
    const composed = composeReply(decision.reply_body, state.signature || defaultSignature(), mail)
    // Wpis „sending" powstaje PRZED wysyłką: gdyby coś padło zaraz po niej,
    // następny przebieg zobaczy go i nie wyśle tej samej odpowiedzi drugi raz.
    await admin.from('inbox_agent_messages').upsert({ ...row, status: 'sending' }, { onConflict: 'message_id' })
    try {
      await sendReply(client, cfg, folders, {
        to: replyTo,
        subject: replySubject(mail.subject),
        ...composed,
        inReplyTo: mail.messageId,
        references: [...mail.references, mail.messageId],
      })
    } catch (err) {
      // Wysyłka się nie udała, więc nic nie wyszło: oddajemy mail człowiekowi.
      await moveMail(client, folders.inbox, mail.uid, folders.review)
      await admin.from('inbox_agent_messages')
        .update({ status: 'needs_review', error: `Automatyczna wysyłka nie powiodła się: ${(err as Error).message}`.slice(0, 500) })
        .eq('message_id', mail.messageId)
      ctx.summary.needsReview++
      ctx.summary.errors++
      return
    }
    await admin.from('inbox_agent_messages')
      .update({ status: 'replied_auto', final_body: decision.reply_body.trim(), handled_at: new Date().toISOString() })
      .eq('message_id', mail.messageId)
    try {
      await markAnswered(client, folders.inbox, mail.uid)
      await moveMail(client, folders.inbox, mail.uid, folders.categories[decision.category])
    } catch (err) {
      console.error('[AgentSkrzynki] Odpowiedź wysłana, ale nie udało się odłożyć maila:', (err as Error).message)
    }
    ctx.summary.repliedAuto++
    return
  }

  await moveMail(client, folders.inbox, mail.uid, folders.review)
  await admin.from('inbox_agent_messages').upsert({ ...row, status: 'needs_review' }, { onConflict: 'message_id' })
  ctx.summary.needsReview++
}

export async function runInboxAgent(admin: SupabaseClient, opts: { relearn?: boolean } = {}): Promise<RunSummary> {
  const startedAt = Date.now()
  const summary = emptySummary()
  const finish = (patch: Partial<RunSummary>): RunSummary => ({ ...summary, ...patch, durationMs: Date.now() - startedAt })

  const cfg = getInboxConfig()
  if (!cfg) return finish({ ok: false, skipped: 'Brak danych logowania do skrzynki (INBOX_USER / INBOX_PASSWORD).' })
  if (!isBrainConfigured()) return finish({ ok: false, skipped: 'Brak klucza ANTHROPIC_API_KEY.' })

  const state = await loadState(admin)
  if (!state.enabled) return finish({ skipped: 'Agent jest wyłączony w panelu.' })
  if (!(await acquireLock(admin))) return finish({ skipped: 'Inny przebieg agenta właśnie trwa.' })

  let client: ImapFlow | null = null
  try {
    client = await openMailbox(cfg)
    const folders = await ensureFolders(client)
    const ctx: Ctx = { admin, client, cfg, folders, state, summary }
    const outOfTime = () => Date.now() - startedAt > RUN_TIME_BUDGET_MS

    await reconcileReviewFolder(ctx)

    try {
      await refreshLearnedProfile(ctx, !!opts.relearn)
    } catch (err) {
      // Nauka z „Wysłanych" jest dodatkiem: jej błąd nie zatrzymuje porządkowania.
      console.error('[AgentSkrzynki] Nauka z Wysłanych nie powiodła się:', (err as Error).message)
    }

    // ── Co leży w odbiorczej ──────────────────────────────────────────────
    const allUids = await listUids(client, folders.inbox)
    const windowStart = new Date(Date.now() - REPLY_WINDOW_DAYS * 24 * 3600_000)
    let recentUids: number[] = []
    {
      const lock = await client.getMailboxLock(folders.inbox)
      try {
        recentUids = ((await client.search({ since: windowStart }, { uid: true })) || []).sort((a, b) => b - a)
      } finally {
        lock.release()
      }
    }
    const recentSet = new Set(recentUids)
    const olderUids = allUids.filter((u) => !recentSet.has(u)).slice(0, MAX_SORT_ONLY_PER_RUN)
    const recentBatch = recentUids.slice(0, MAX_REPLY_CANDIDATES_PER_RUN * 3)

    const recent = await fetchMails(client, folders.inbox, recentBatch, LARGE_FETCH_BYTES, cfg.user)
    const older = await fetchMails(client, folders.inbox, olderUids, SMALL_FETCH_BYTES, cfg.user)

    // Maile, które już trzy razy się nie udały, zostawiamy człowiekowi w
    // odbiorczej, zamiast w kółko płacić za ich analizę.
    const ids = [...recent, ...older].map((m) => m.messageId)
    const failed = new Set<string>()
    if (ids.length > 0) {
      const { data: rows } = await admin.from('inbox_agent_messages').select('message_id, attempts').in('message_id', ids).gte('attempts', 3)
      for (const r of rows ?? []) failed.add(r.message_id as string)
    }
    const todo = [...recent, ...older].filter((m) => !failed.has(m.messageId))

    // ── Sortowanie hurtowe ────────────────────────────────────────────────
    const batches: FetchedMail[][] = []
    for (let i = 0; i < todo.length; i += TRIAGE_BATCH_SIZE) batches.push(todo.slice(i, i + TRIAGE_BATCH_SIZE))
    const triaged = new Map<string, TriageItem>()
    await pool(batches, 4, async (batch) => {
      const t0 = Date.now()
      try {
        const { items, usage } = await triage(batch)
        summary.costUsd += usage.costUsd
        await logUsage(admin, usage, t0)
        for (const item of items) {
          const mail = batch[item.index]
          if (mail) triaged.set(mail.messageId, item)
        }
      } catch (err) {
        summary.errors++
        console.error('[AgentSkrzynki] Błąd sortowania paczki:', (err as Error).message)
      }
    })

    const isRecent = (m: FetchedMail) => m.date.getTime() >= windowStart.getTime()
    const candidates: FetchedMail[] = []
    for (const mail of todo) {
      if (outOfTime()) break
      const t = triaged.get(mail.messageId)
      if (!t) continue // paczka się nie udała: mail zostaje w odbiorczej do następnego przebiegu
      const wantsReply = t.needs_reply && !mail.automated && !mail.flags.has('\\Answered')
      if (wantsReply && isRecent(mail)) {
        if (candidates.length < MAX_REPLY_CANDIDATES_PER_RUN) candidates.push(mail)
        continue // nadwyżka poczeka w odbiorczej na kolejny przebieg
      }
      try {
        const note = wantsReply ? `Starszy niż ${REPLY_WINDOW_DAYS} dni: tylko uporządkowany, bez odpowiedzi.` : undefined
        await fileAsSorted(ctx, mail, t, note)
      } catch (err) {
        summary.errors++
        await recordFailure(admin, mail, t.category, err)
      }
    }

    // ── Odpowiedzi ────────────────────────────────────────────────────────
    if (candidates.length > 0 && !outOfTime()) {
      const knowledge = buildKnowledgeBlock(state, await loadKnowledge(admin))
      // Kontekst z poczty zbieramy po kolei (jedno połączenie IMAP), a same
      // zapytania do modelu puszczamy równolegle.
      const prepared: { mail: FetchedMail; senderInfo: string; history: FetchedMail[] }[] = []
      for (const mail of candidates) {
        const senderInfo = await describeSender(admin, mail.from.address)
        let history: FetchedMail[] = []
        if (folders.sent) {
          try {
            history = await recentSent(client, folders.sent, { toAddress: mail.from.address, limit: 3, maxBytes: SMALL_FETCH_BYTES }, cfg.user)
          } catch {
            history = []
          }
        }
        prepared.push({ mail, senderInfo, history })
      }

      const decisions = await pool(prepared, 4, async (p) => {
        const t0 = Date.now()
        try {
          const { decision, usage } = await draftReply({ ...p, knowledge })
          summary.costUsd += usage.costUsd
          await logUsage(admin, usage, t0)
          return decision
        } catch (err) {
          return err as Error
        }
      })

      for (let i = 0; i < prepared.length; i++) {
        const mail = prepared[i].mail
        const decision = decisions[i]
        const fallbackCategory = triaged.get(mail.messageId)?.category ?? 'inne'
        if (decision instanceof Error) {
          summary.errors++
          await recordFailure(admin, mail, fallbackCategory, decision)
          continue
        }
        try {
          await handleReplyCandidate(ctx, mail, decision)
        } catch (err) {
          summary.errors++
          await recordFailure(admin, mail, decision.category, err)
        }
      }
    }

    summary.remainingInInbox = (await listUids(client, folders.inbox)).length

    if (summary.needsReview > 0) {
      await admin.from('admin_notifications').insert({
        kind: 'skrzynka',
        title: summary.needsReview === 1 ? 'Agent Skrzynki: 1 mail czeka na Twoją decyzję' : `Agent Skrzynki: maile czekające na Twoją decyzję (${summary.needsReview})`,
        body: 'Otwórz Skrzynkę w panelu, żeby zatwierdzić lub poprawić propozycje odpowiedzi.',
      })
    }

    const result = finish({ ok: true })
    await saveState(admin, { last_run_at: new Date().toISOString(), last_run_summary: result, last_error: null })
    return result
  } catch (err) {
    const message = (err as Error).message || 'Nieznany błąd'
    console.error('[AgentSkrzynki] Przebieg przerwany:', message)
    const result = finish({ ok: false, error: message })
    await saveState(admin, { last_run_at: new Date().toISOString(), last_run_summary: result, last_error: message })
    return result
  } finally {
    if (client) await closeMailbox(client)
    await admin.from('inbox_agent_state').update({ run_started_at: null }).eq('id', true)
  }
}

async function recordFailure(admin: SupabaseClient, mail: FetchedMail, category: string, err: unknown) {
  const message = (err as Error)?.message || 'Nieznany błąd'
  console.error(`[AgentSkrzynki] Błąd przy mailu „${mail.subject}":`, message)
  const { data: existing } = await admin.from('inbox_agent_messages').select('attempts, status').eq('message_id', mail.messageId).maybeSingle()
  // Nie nadpisujemy wpisu o mailu, na który odpowiedź już wyszła.
  if (existing && ['replied_auto', 'replied_approved', 'replied_manually', 'sending', 'needs_review'].includes(existing.status as string)) return
  await admin.from('inbox_agent_messages').upsert(
    {
      ...baseRow(mail),
      category,
      folder: categoryFolder(category),
      status: 'error',
      error: message.slice(0, 500),
      attempts: ((existing?.attempts as number | undefined) ?? 0) + 1,
    },
    { onConflict: 'message_id' },
  )
}

// ── Akcja celowana: przenieś z odbiorczej tylko jedną kategorię ─────────────
//
// Przegląda odbiorczą porcjami (od najnowszych) i przenosi do wskazanego,
// ISTNIEJĄCEGO folderu wyłącznie maile z jednej kategorii, np. aplikacje
// nauczycieli. Reszta poczty zostaje nietknięta, nic nie jest tworzone ani
// wysyłane. Panel wywołuje to w pętli, podając `beforeUid` z poprzedniej porcji.

export type SweepSummary = {
  ok: boolean
  skipped?: string
  error?: string
  folder: string
  scanned: number
  moved: number
  errors: number
  leftToScan: number
  nextBeforeUid: number | null
  costUsd: number
  durationMs: number
}

export async function sweepCategory(
  admin: SupabaseClient,
  opts: { category: CategoryKey; beforeUid?: number },
): Promise<SweepSummary> {
  const startedAt = Date.now()
  const folderName = categoryFolder(opts.category)
  const summary: SweepSummary = { ok: true, folder: folderName, scanned: 0, moved: 0, errors: 0, leftToScan: 0, nextBeforeUid: null, costUsd: 0, durationMs: 0 }
  const finish = (patch: Partial<SweepSummary>): SweepSummary => ({ ...summary, ...patch, durationMs: Date.now() - startedAt })

  const cfg = getInboxConfig()
  if (!cfg) return finish({ ok: false, skipped: 'Brak danych logowania do skrzynki (INBOX_USER / INBOX_PASSWORD).' })
  if (!isBrainConfigured()) return finish({ ok: false, skipped: 'Brak klucza ANTHROPIC_API_KEY.' })
  const state = await loadState(admin)
  if (!state.enabled) return finish({ skipped: 'Agent jest wyłączony w panelu.' })
  if (!(await acquireLock(admin))) return finish({ skipped: 'Inny przebieg agenta właśnie trwa.' })

  let client: ImapFlow | null = null
  try {
    client = await openMailbox(cfg)
    const target = await findFolder(client, folderName)
    if (!target.path) {
      return finish({
        ok: false,
        error: `Nie widzę w skrzynce folderu „${folderName}". Foldery, które widzę: ${target.allNames.join(', ')}.`,
      })
    }

    const all = await listUids(client, target.inbox)
    const pendingUids = opts.beforeUid ? all.filter((u) => u < opts.beforeUid!) : all
    const chunk = pendingUids.slice(0, SWEEP_PER_CALL)
    const mails = await fetchMails(client, target.inbox, chunk, 24 * 1024, cfg.user)
    summary.scanned = chunk.length
    summary.leftToScan = pendingUids.length - chunk.length
    summary.nextBeforeUid = summary.leftToScan > 0 && chunk.length > 0 ? Math.min(...chunk) : null

    const batches: FetchedMail[][] = []
    for (let i = 0; i < mails.length; i += TRIAGE_BATCH_SIZE) batches.push(mails.slice(i, i + TRIAGE_BATCH_SIZE))
    const hits: { mail: FetchedMail; item: TriageItem }[] = []
    await pool(batches, 4, async (batch) => {
      const t0 = Date.now()
      try {
        const { items, usage } = await triage(batch)
        summary.costUsd += usage.costUsd
        await logUsage(admin, usage, t0)
        for (const item of items) {
          const mail = batch[item.index]
          if (mail && item.category === opts.category) hits.push({ mail, item })
        }
      } catch (err) {
        summary.errors += batch.length
        console.error('[AgentSkrzynki] Błąd sortowania paczki:', (err as Error).message)
      }
    })

    // Wpisów o mailach, na które odpowiedź wyszła lub czeka na decyzję, nie nadpisujemy.
    const keep = new Set<string>()
    if (hits.length > 0) {
      const { data: rows } = await admin.from('inbox_agent_messages').select('message_id, status').in('message_id', hits.map((h) => h.mail.messageId))
      for (const r of rows ?? []) if (!['sorted', 'error'].includes(r.status as string)) keep.add(r.message_id as string)
    }

    for (const { mail, item } of hits) {
      if (Date.now() - startedAt > RUN_TIME_BUDGET_MS) {
        // Zabrakło czasu: następne wywołanie zacznie od tej samej porcji.
        summary.nextBeforeUid = opts.beforeUid ?? null
        summary.leftToScan = pendingUids.length
        break
      }
      try {
        await moveMail(client, target.inbox, mail.uid, target.path)
        summary.moved++
        if (!keep.has(mail.messageId)) {
          await admin.from('inbox_agent_messages').upsert(
            { ...baseRow(mail), category: opts.category, folder: folderName, summary: item.summary, needs_reply: item.needs_reply, status: 'sorted', error: null },
            { onConflict: 'message_id' },
          )
        }
      } catch (err) {
        summary.errors++
        console.error(`[AgentSkrzynki] Nie udało się przenieść „${mail.subject}":`, (err as Error).message)
      }
    }
    return finish({ ok: true })
  } catch (err) {
    const message = (err as Error).message || 'Nieznany błąd'
    console.error('[AgentSkrzynki] Przenoszenie kategorii przerwane:', message)
    return finish({ ok: false, error: message })
  } finally {
    if (client) await closeMailbox(client)
    await admin.from('inbox_agent_state').update({ run_started_at: null }).eq('id', true)
  }
}

// ── Akcja celowana: wideo od nauczycieli do „Teachers Videos" ───────────────
//
// Skrzynka jest już uporządkowana, więc nagrania leżą głównie w folderach
// (najczęściej w „Teachers Applications"). Akcja przegląda odbiorczą i foldery
// kategorii agenta, a w nich tylko maile z załącznikiem wideo lub z linkiem /
// wzmianką o nagraniu (wyszukiwanie po stronie serwera). Każdego kandydata
// ocenia Claude: przenosimy wyłącznie nagrania nauczycieli i kandydatów.
//
// Nie dotyka: „Do decyzji", Wysłanych, folderów utworzonych ręcznie przez
// szkołę (poza „Teachers Applications"). Niczego nie wysyła ani nie usuwa.
// Panel wywołuje akcję w pętli z kursorem { f: indeks folderu, u: UID }.

export type VideoCursor = { f: number; u: number | null }

export type VideoSweepSummary = {
  ok: boolean
  skipped?: string
  error?: string
  folder: string
  checked: number
  moved: number
  movedFrom: Record<string, number>
  errors: number
  foldersTotal: number
  next: VideoCursor | null
  costUsd: number
  durationMs: number
}

export async function sweepTeacherVideos(admin: SupabaseClient, opts: { cursor?: VideoCursor }): Promise<VideoSweepSummary> {
  const startedAt = Date.now()
  const target = categoryFolder('wideo')
  const summary: VideoSweepSummary = { ok: true, folder: target, checked: 0, moved: 0, movedFrom: {}, errors: 0, foldersTotal: 0, next: null, costUsd: 0, durationMs: 0 }
  const finish = (patch: Partial<VideoSweepSummary>): VideoSweepSummary => ({ ...summary, ...patch, durationMs: Date.now() - startedAt })

  const cfg = getInboxConfig()
  if (!cfg) return finish({ ok: false, skipped: 'Brak danych logowania do skrzynki (INBOX_USER / INBOX_PASSWORD).' })
  if (!isBrainConfigured()) return finish({ ok: false, skipped: 'Brak klucza ANTHROPIC_API_KEY.' })
  const state = await loadState(admin)
  if (!state.enabled) return finish({ skipped: 'Agent jest wyłączony w panelu.' })
  if (!(await acquireLock(admin))) return finish({ skipped: 'Inny przebieg agenta właśnie trwa.' })

  let client: ImapFlow | null = null
  try {
    client = await openMailbox(cfg)
    // Tworzy „Teachers Videos", jeśli go nie ma (obok „Teachers Applications").
    const folders = await ensureFolders(client)
    const targetPath = folders.categories.wideo
    const sources = [...new Set([
      folders.inbox,
      ...CATEGORIES.filter((c) => c.key !== 'wideo').map((c) => folders.categories[c.key]),
    ])].filter((p) => p && p !== targetPath && p !== folders.review && p !== folders.sent)
    summary.foldersTotal = sources.length

    let f = opts.cursor?.f ?? 0
    let beforeUid = opts.cursor?.u ?? null
    let budget = VIDEO_SWEEP_PER_CALL

    while (f < sources.length) {
      if (budget <= 0 || Date.now() - startedAt > RUN_TIME_BUDGET_MS - 60_000) {
        summary.next = { f, u: beforeUid }
        break
      }
      const source = sources[f]
      const all = (await findVideoCandidates(client, source)).filter((u) => beforeUid === null || u < beforeUid)
      const chunk = all.slice(0, budget)
      budget -= chunk.length

      const mails = (await fetchMails(client, source, chunk, 64 * 1024, cfg.user))
        // Biuletyny i powiadomienia z automatu nie są nagraniami nauczycieli.
        .filter((m) => !m.automated)
      summary.checked += chunk.length

      const batches: FetchedMail[][] = []
      for (let i = 0; i < mails.length; i += 15) batches.push(mails.slice(i, i + 15))
      const confirmed: { mail: FetchedMail; reason: string }[] = []
      await pool(batches, 4, async (batch) => {
        const t0 = Date.now()
        try {
          const { items, usage } = await classifyTeacherVideos(batch)
          summary.costUsd += usage.costUsd
          await logUsage(admin, usage, t0)
          for (const item of items) {
            const mail = batch[item.index]
            if (mail && item.is_teacher_video) confirmed.push({ mail, reason: item.reason })
          }
        } catch (err) {
          summary.errors += batch.length
          console.error('[AgentSkrzynki] Błąd oceny wideo:', (err as Error).message)
        }
      })

      const sourceName = source.split(/[./]/).pop() || source
      for (const { mail, reason } of confirmed) {
        try {
          await moveMail(client, source, mail.uid, targetPath)
          summary.moved++
          summary.movedFrom[sourceName] = (summary.movedFrom[sourceName] ?? 0) + 1
          const { data: existing } = await admin.from('inbox_agent_messages').select('id').eq('message_id', mail.messageId).maybeSingle()
          if (existing) {
            await admin.from('inbox_agent_messages')
              .update({ category: 'wideo', folder: target, updated_at: new Date().toISOString() })
              .eq('id', existing.id)
          } else {
            await admin.from('inbox_agent_messages').upsert(
              { ...baseRow(mail), category: 'wideo', folder: target, summary: reason, needs_reply: false, status: 'sorted' },
              { onConflict: 'message_id' },
            )
          }
        } catch (err) {
          summary.errors++
          console.error(`[AgentSkrzynki] Nie udało się przenieść „${mail.subject}":`, (err as Error).message)
        }
      }

      if (chunk.length < all.length) {
        // W tym folderze zostały jeszcze starsze maile do sprawdzenia.
        summary.next = { f, u: Math.min(...chunk) }
        break
      }
      f++
      beforeUid = null
    }
    return finish({ ok: true })
  } catch (err) {
    const message = (err as Error).message || 'Nieznany błąd'
    console.error('[AgentSkrzynki] Przenoszenie wideo przerwane:', message)
    return finish({ ok: false, error: message })
  } finally {
    if (client) await closeMailbox(client)
    await admin.from('inbox_agent_state').update({ run_started_at: null }).eq('id', true)
  }
}
