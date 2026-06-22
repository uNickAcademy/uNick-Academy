import { NextResponse } from 'next/server'
import { createAnthropicClient, ANTHROPIC_MODEL } from '@/lib/anthropic'
import { SYSTEM_PROMPT } from '@/lib/unickorn/prompt'

const DEMO_SYSTEM = `${SYSTEM_PROMPT}

STUDENT CONTEXT
Name: this visitor
Age band: unknown
English level: unknown

This is a free demo. The visitor has not logged in yet. Give them a warm, welcoming greeting and have a natural conversation. After 2-3 exchanges, gently mention that they can sign up for full access with session recaps, vocabulary tracking, and personalised learning.`

const MAX_DEMO_MESSAGES = 6

export async function POST(request) {
  const { messages } = await request.json()

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  const userMessages = messages.filter((m) => m.role === 'user')
  if (userMessages.length > MAX_DEMO_MESSAGES) {
    return NextResponse.json({
      error: 'demo_limit',
      reply: null,
      limitReached: true,
    })
  }

  const sanitized = messages.slice(-10).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content).slice(0, 500),
  }))

  const anthropic = createAnthropicClient()
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 512,
    system: DEMO_SYSTEM,
    messages: sanitized,
  })

  const reply = response.content.find((block) => block.type === 'text')?.text || ''

  return NextResponse.json({
    reply,
    limitReached: userMessages.length >= MAX_DEMO_MESSAGES,
    messagesLeft: MAX_DEMO_MESSAGES - userMessages.length,
  })
}
