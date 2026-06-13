import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { createAdminClient } from '../../../../../lib/supabase/admin'
import { getStudentForUser } from '../../../../../lib/unickorn/student'
import { SESSION_SUMMARY_PROMPT } from '../../../../../lib/unickorn/prompt'
import { createAnthropicClient, ANTHROPIC_MODEL } from '../../../../../lib/anthropic'

// The opening "[SESSION_START]" cue isn't a real student utterance - skip it
// when building the transcript for the summarizer.
function transcriptFromMessages(messages) {
  return messages
    .filter((m) => m.content !== undefined && !m.content.startsWith?.('[SESSION_START]'))
    .map((m) => `${m.role === 'assistant' ? 'uNickorn' : 'Student'}: ${m.content}`)
    .join('\n')
}

function parseSummary(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/)
    return JSON.parse(match ? match[0] : text)
  } catch {
    return null
  }
}

export async function POST(request) {
  const { sessionId, messages } = await request.json()

  if (!sessionId || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'sessionId and messages are required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const student = await getStudentForUser(user.id)
  if (!student) {
    return NextResponse.json({ error: 'student_not_found' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: session } = await admin
    .from('tutor_sessions')
    .select('id, started_at')
    .eq('id', sessionId)
    .eq('student_id', student.id)
    .is('ended_at', null)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  }

  const endedAt = new Date()
  const startedAt = new Date(session.started_at)
  const durationMinutes = Math.max(1, Math.round((endedAt - startedAt) / 60000))

  const transcript = transcriptFromMessages(messages)

  let parsed = null
  if (transcript) {
    const anthropic = createAnthropicClient()
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: SESSION_SUMMARY_PROMPT,
      messages: [{ role: 'user', content: transcript }],
    })
    const text = response.content.find((block) => block.type === 'text')?.text || ''
    parsed = parseSummary(text)
  }

  await admin
    .from('tutor_sessions')
    .update({
      ended_at: endedAt.toISOString(),
      duration_minutes: durationMinutes,
      topics: parsed?.topics || [],
      new_vocabulary: parsed?.new_vocabulary || [],
      gentle_corrections: parsed?.gentle_corrections || [],
      mood: parsed?.mood || null,
      summary: parsed?.summary || null,
    })
    .eq('id', sessionId)

  if (parsed?.interests_to_add?.length || parsed?.notes_to_add) {
    const { data: existingProfile } = await admin
      .from('student_profile')
      .select('*')
      .eq('student_id', student.id)
      .maybeSingle()

    const existingInterests = existingProfile?.interests || []
    const newInterests = (parsed.interests_to_add || []).filter((i) => !existingInterests.includes(i))
    const mergedInterests = [...existingInterests, ...newInterests]

    const mergedNotes = [existingProfile?.notes_freeform, parsed.notes_to_add]
      .filter(Boolean)
      .join(' ')

    await admin
      .from('student_profile')
      .upsert(
        {
          student_id: student.id,
          interests: mergedInterests,
          notes_freeform: mergedNotes || null,
          updated_at: endedAt.toISOString(),
        },
        { onConflict: 'student_id' }
      )
  }

  return NextResponse.json({
    summary: parsed?.summary || null,
    topics: parsed?.topics || [],
    newVocabulary: parsed?.new_vocabulary || [],
    gentleCorrections: parsed?.gentle_corrections || [],
    mood: parsed?.mood || null,
  })
}
