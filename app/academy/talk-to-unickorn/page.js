'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REASON_COPY = {
  student_not_found: {
    title: 'Activate uNickorn',
    body: 'To start chatting with uNickorn, activate your access.',
    action: 'upgrade',
  },
  subscription_inactive: {
    title: 'Activate uNickorn',
    body: 'Your uNickorn subscription is not active. Activate it to start chatting.',
    action: 'upgrade',
  },
  usage_limit_reached: {
    title: 'Monthly limit reached',
    body: 'You have used all your sessions this month. Come back next month or contact us if you need more.',
  },
  session_create_failed: {
    title: 'Something went wrong',
    body: 'Could not start the session. Try refreshing the page.',
  },
}

const DEFAULT_COPY = {
  title: 'uNickorn is unavailable',
  body: 'Please try again later.',
}

function isVisibleMessage(message) {
  return !message.content?.startsWith?.('[SESSION_START]')
}

export default function TalkToUnickornPage() {
  const router = useRouter()
  const [status, setStatus] = useState('loading')
  const [access, setAccess] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ending, setEnding] = useState(false)
  const [recap, setRecap] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const accessRes = await fetch('/api/unickorn/access')
      const accessData = await accessRes.json()

      if (!accessData.allowed) {
        if (accessData.reason === 'not_authenticated') {
          router.push('/login')
          return
        }
        setAccess(accessData)
        setStatus('gated')
        return
      }

      const startRes = await fetch('/api/unickorn/session/start', { method: 'POST' })
      const startData = await startRes.json()

      if (!startData.allowed) {
        setAccess(startData)
        setStatus('gated')
        return
      }

      setSessionId(startData.sessionId)
      setMessages(startData.history)
      setStatus('chat')
    }
    init()
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleCheckout() {
    setCheckoutLoading(true)
    const res = await fetch('/api/unickorn/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setCheckoutLoading(false)
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    const res = await fetch('/api/unickorn/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, messages: nextMessages }),
    })
    const data = await res.json()
    setSending(false)

    if (data.reply) {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    }
  }

  async function handleEndSession() {
    setEnding(true)
    const res = await fetch('/api/unickorn/session/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, messages }),
    })
    const data = await res.json()
    setEnding(false)
    setRecap(data)
    setStatus('ended')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p className="text-navy font-semibold">Loading...</p>
      </div>
    )
  }

  if (status === 'gated') {
    const copy = REASON_COPY[access?.reason] || DEFAULT_COPY
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 text-center">
          <h1 className="text-xl font-extrabold text-navy mb-2">{copy.title}</h1>
          <p className="text-sm text-gray-500 mb-6">{copy.body}</p>
          {copy.action === 'upgrade' && (
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-brand text-white rounded-lg py-3 font-bold text-sm disabled:opacity-60"
            >
              {checkoutLoading ? 'Loading...' : 'Go to payment'}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (status === 'ended') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
          <h1 className="text-xl font-extrabold text-navy mb-2">See you next time!</h1>
          {recap?.summary && <p className="text-sm text-gray-600 mb-4">{recap.summary}</p>}

          {recap?.topics?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-bold text-navy uppercase mb-1">Topics</p>
              <p className="text-sm text-gray-600">{recap.topics.join(', ')}</p>
            </div>
          )}

          {recap?.newVocabulary?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-bold text-navy uppercase mb-1">New vocabulary</p>
              <p className="text-sm text-gray-600">{recap.newVocabulary.join(', ')}</p>
            </div>
          )}

          {recap?.gentleCorrections?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-bold text-navy uppercase mb-1">Things to practise</p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {recap.gentleCorrections.map((c, i) => (
                  <li key={i}>{typeof c === 'string' ? c : `${c.original} → ${c.corrected}`}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-brand text-white rounded-lg py-3 font-bold text-sm mt-2"
          >
            Start a new conversation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <header className="bg-navy px-6 py-4 flex items-center justify-between">
        <span className="text-white font-extrabold">uNickorn</span>
        <button
          onClick={handleEndSession}
          disabled={ending}
          className="text-sm text-white underline disabled:opacity-60"
        >
          {ending ? 'Saving...' : 'End session'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.filter(isVisibleMessage).map((message, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
              message.role === 'assistant'
                ? 'bg-white text-navy mr-auto'
                : 'bg-navy text-white ml-auto'
            }`}
          >
            {message.content}
          </div>
        ))}
        {sending && (
          <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-white text-gray-400 mr-auto">
            uNickorn is typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="px-4 py-4 bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write something in English..."
          disabled={sending}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-brand text-white rounded-lg px-6 font-bold text-sm disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  )
}
