import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { runInboxAgent, sweepCategory, sweepTeacherVideos } from '@/lib/inbox-agent/run'
import { CATEGORY_KEYS, type CategoryKey } from '@/lib/inbox-agent/config'
import { approveAndSend, dismiss } from '@/lib/inbox-agent/actions'
import { saveState } from '@/lib/inbox-agent/knowledge'

// Akcje panelu /admin/skrzynka. Treści maili to dane osobowe, więc wszystko
// tutaj jest tylko dla roli admin (recepcja nie ma dostępu).

export const maxDuration = 300
export const dynamic = 'force-dynamic'

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 })
  const { data: prof } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (prof?.role !== 'admin') return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 })
  return { userId: user.id }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin()
  if (gate instanceof NextResponse) return gate
  const { userId } = gate

  const body = await req.json().catch(() => ({}))
  const action = String(body.action ?? '')
  const admin = createAdminClient()

  switch (action) {
    case 'run': {
      const summary = await runInboxAgent(admin, { relearn: body.relearn === true })
      return NextResponse.json(summary)
    }
    case 'sweep': {
      const category = String(body.category ?? '') as CategoryKey
      if (!CATEGORY_KEYS.includes(category)) return NextResponse.json({ error: 'Nieznana kategoria.' }, { status: 400 })
      const beforeUid = Number.isInteger(body.beforeUid) && body.beforeUid > 0 ? (body.beforeUid as number) : undefined
      return NextResponse.json(await sweepCategory(admin, { category, beforeUid }))
    }
    case 'sweep_videos': {
      const c = body.cursor
      const cursor = c && Number.isInteger(c.f) && c.f >= 0
        ? { f: c.f as number, u: Number.isInteger(c.u) && c.u > 0 ? (c.u as number) : null }
        : undefined
      return NextResponse.json(await sweepTeacherVideos(admin, { cursor }))
    }
    case 'send': {
      const result = await approveAndSend(admin, {
        id: String(body.id ?? ''),
        body: String(body.body ?? ''),
        remember: body.remember === true,
        topic: typeof body.topic === 'string' ? body.topic : undefined,
        userId,
      })
      return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.error }, { status: result.status })
    }
    case 'dismiss': {
      const result = await dismiss(admin, { id: String(body.id ?? ''), userId })
      return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.error }, { status: result.status })
    }
    case 'settings': {
      const patch: Record<string, unknown> = {}
      if (typeof body.enabled === 'boolean') patch.enabled = body.enabled
      if (typeof body.autoReply === 'boolean') patch.auto_reply = body.autoReply
      if (typeof body.ownerNotes === 'string') patch.owner_notes = body.ownerNotes.slice(0, 20000)
      if (typeof body.signature === 'string') patch.signature = body.signature.slice(0, 2000)
      if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Brak zmian.' }, { status: 400 })
      await saveState(admin, patch)
      return NextResponse.json({ ok: true })
    }
    case 'knowledge_add': {
      const topic = String(body.topic ?? '').trim()
      const answer = String(body.answer ?? '').trim()
      if (!topic || !answer) return NextResponse.json({ error: 'Podaj temat i odpowiedź.' }, { status: 400 })
      const { error } = await admin.from('inbox_agent_knowledge').insert({ topic: topic.slice(0, 300), answer: answer.slice(0, 5000), source: 'owner', created_by: userId })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    case 'knowledge_delete': {
      const { error } = await admin.from('inbox_agent_knowledge').delete().eq('id', String(body.id ?? ''))
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    default:
      return NextResponse.json({ error: 'Nieznana akcja.' }, { status: 400 })
  }
}
