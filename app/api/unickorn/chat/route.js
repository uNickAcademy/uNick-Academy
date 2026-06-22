import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStudentForUser, loadStudentContext } from '@/lib/unickorn/student'
import { SYSTEM_PROMPT, buildContextBlock } from '@/lib/unickorn/prompt'
import { createAnthropicClient, ANTHROPIC_MODEL } from '@/lib/anthropic'

const ACTIVE_SUBSCRIPTION_STATUSES = ['trialing', 'active']

export async function POST(request) {
  const { sessionId, messages } = await request.json()

  if (!sessionId || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'sessionId and messages are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const student = await getStudentForUser(user.id)
  if (!student || !ACTIVE_SUBSCRIPTION_STATUSES.includes(student.unickorn_subscription_status)) {
    return NextResponse.json({ error: 'subscription_inactive' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from('tutor_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('student_id', student.id)
    .is('ended_at', null)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  }

  const { profile, recentSessions } = await loadStudentContext(student.id)
  const contextBlock = buildContextBlock({ student, profile, recentSessions })

  const anthropic = createAnthropicClient()
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
    messages,
  })

  const reply = response.content.find((block) => block.type === 'text')?.text || ''

  return NextResponse.json({ reply })
}
