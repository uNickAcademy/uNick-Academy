import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { getStudentForUser, loadStudentContext } from '../../../../../lib/unickorn/student'
import { checkUnickornAccess } from '../../../../../lib/unickorn/access'
import { currentPeriod } from '../../../../../lib/unickorn/config'
import { SYSTEM_PROMPT, buildContextBlock } from '../../../../../lib/unickorn/prompt'
import { createAnthropicClient, ANTHROPIC_MODEL } from '../../../../../lib/anthropic'

const SESSION_START_CUE = '[SESSION_START] The student has just opened the session. Greet them warmly and ask what they would like to talk about today.'

// Runs the access check, then (if allowed) opens a new tutor_sessions row,
// counts this session against the student's monthly usage, and asks
// uNickorn for its opening greeting.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ allowed: false, reason: 'not_authenticated', action: 'login' }, { status: 401 })
  }

  const student = await getStudentForUser(user.id)
  if (!student) {
    return NextResponse.json({ allowed: false, reason: 'student_not_found', action: 'upgrade' }, { status: 404 })
  }

  const access = await checkUnickornAccess(student.id)
  if (!access.allowed) {
    return NextResponse.json(access)
  }

  const admin = createAdminClient()

  // Count this session against the student's monthly usage.
  // TODO: once voice exists, also track minutes_used as the session runs.
  await admin.rpc('increment_unickorn_usage', {
    p_student_id: student.id,
    p_period: currentPeriod(),
  })

  const { data: session, error: sessionError } = await admin
    .from('tutor_sessions')
    .insert({ student_id: student.id, started_at: new Date().toISOString() })
    .select('id')
    .single()

  if (sessionError) {
    return NextResponse.json({ allowed: false, reason: 'session_create_failed', action: null }, { status: 500 })
  }

  const { profile, recentSessions } = await loadStudentContext(student.id)
  const contextBlock = buildContextBlock({ student, profile, recentSessions })

  const anthropic = createAnthropicClient()
  const openingMessages = [{ role: 'user', content: SESSION_START_CUE }]

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n${contextBlock}`,
    messages: openingMessages,
  })

  const greeting = response.content.find((block) => block.type === 'text')?.text || ''

  return NextResponse.json({
    allowed: true,
    sessionId: session.id,
    greeting,
    history: [...openingMessages, { role: 'assistant', content: greeting }],
  })
}
