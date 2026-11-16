import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isInboxConfigured, REPLY_WINDOW_DAYS } from '@/lib/inbox-agent/config'
import { isBrainConfigured } from '@/lib/inbox-agent/brain'
import { loadKnowledge, loadState } from '@/lib/inbox-agent/knowledge'
import { defaultSignature } from '@/lib/inbox-agent/run'
import { InboxAgentView, type HistoryItem, type PendingItem } from './InboxAgentView'

export const dynamic = 'force-dynamic'

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' })
    : ''

export default async function SkrzynkaPage() {
  // Treści maili widzi tylko admin. Tabele agenta nie mają polityk RLS, więc
  // czytamy je kluczem serwisowym dopiero po sprawdzeniu roli.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const admin = createAdminClient()
  const [state, knowledge, pendingRes, historyRes] = await Promise.all([
    loadState(admin),
    loadKnowledge(admin),
    admin
      .from('inbox_agent_messages')
      .select('id, from_address, from_name, subject, received_at, body_text, category, folder, summary, confidence, sensitive, owner_question, reusable_topic, draft_body, error')
      .eq('status', 'needs_review')
      .order('received_at', { ascending: false })
      .limit(100),
    admin
      .from('inbox_agent_messages')
      .select('id, from_address, from_name, subject, received_at, folder, summary, status, final_body, error, updated_at')
      .neq('status', 'needs_review')
      .order('updated_at', { ascending: false })
      .limit(120),
  ])

  const pending: PendingItem[] = (pendingRes.data ?? []).map((r) => ({
    id: r.id as string,
    from: (r.from_name as string | null) ? `${r.from_name} <${r.from_address}>` : (r.from_address as string),
    subject: (r.subject as string | null) ?? '(bez tematu)',
    receivedAt: when(r.received_at as string | null),
    body: (r.body_text as string | null) ?? '',
    folder: (r.folder as string | null) ?? 'Inne',
    summary: (r.summary as string | null) ?? '',
    confidence: (r.confidence as string | null) ?? null,
    sensitive: !!r.sensitive,
    question: (r.owner_question as string | null) ?? '',
    topic: (r.reusable_topic as string | null) ?? '',
    draft: (r.draft_body as string | null) ?? '',
    error: (r.error as string | null) ?? '',
  }))

  const history: HistoryItem[] = (historyRes.data ?? []).map((r) => ({
    id: r.id as string,
    from: (r.from_name as string | null) || (r.from_address as string),
    subject: (r.subject as string | null) ?? '(bez tematu)',
    at: when((r.updated_at as string | null) ?? (r.received_at as string | null)),
    folder: (r.folder as string | null) ?? 'Inne',
    summary: (r.summary as string | null) ?? '',
    status: r.status as string,
    finalBody: (r.final_body as string | null) ?? '',
    error: (r.error as string | null) ?? '',
  }))

  return (
    <InboxAgentView
      configured={{ mailbox: isInboxConfigured(), brain: isBrainConfigured() }}
      settings={{
        enabled: state.enabled,
        autoReply: state.auto_reply,
        ownerNotes: state.owner_notes,
        signature: state.signature || defaultSignature(),
      }}
      learnedProfile={state.learned_profile}
      learnedProfileAt={when(state.learned_profile_at)}
      lastRunAt={when(state.last_run_at)}
      lastRun={state.last_run_summary}
      lastError={state.last_error}
      replyWindowDays={REPLY_WINDOW_DAYS}
      pending={pending}
      history={history}
      knowledge={knowledge.map((k) => ({ id: k.id, topic: k.topic, answer: k.answer, source: k.source }))}
    />
  )
}
