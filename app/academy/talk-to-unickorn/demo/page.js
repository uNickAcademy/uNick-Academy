'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const MAX_MESSAGES = 3
const STORAGE_KEY = 'unickorn_demo_count'

function getDemoCount() {
  if (typeof window === 'undefined') return 0
  return Number(localStorage.getItem(STORAGE_KEY) || '0')
}

function incrementDemoCount() {
  const next = getDemoCount() + 1
  localStorage.setItem(STORAGE_KEY, String(next))
  return next
}

function speak(text, onEnd) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-GB'
  utterance.rate = 0.95
  utterance.pitch = 1.1

  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(
    (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
  ) || voices.find((v) => v.lang.startsWith('en-GB'))
    || voices.find((v) => v.lang.startsWith('en'))
  if (preferred) utterance.voice = preferred

  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()
  window.speechSynthesis.speak(utterance)
}

export default function UnickornDemoPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voiceOn, setVoiceOn] = useState(true)
  const [demoUsed, setDemoUsed] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
    }
  }, [])

  useEffect(() => {
    const count = getDemoCount()
    setDemoUsed(count)
    if (count >= MAX_MESSAGES) {
      setLimitReached(true)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speakReply = useCallback((text) => {
    if (!voiceOn) return
    setSpeaking(true)
    speak(text, () => setSpeaking(false))
  }, [voiceOn])

  function toggleVoice() {
    if (voiceOn) {
      window.speechSynthesis?.cancel()
      setSpeaking(false)
    }
    setVoiceOn((v) => !v)
  }

  async function startDemo() {
    if (limitReached) return
    setStarted(true)
    setSending(true)

    const openingMessages = [
      { role: 'user', content: '[SESSION_START] The visitor has opened a free demo. Greet them warmly and invite them to chat in English about anything they like. Keep it short — 2 sentences max.' },
    ]

    const res = await fetch('/api/unickorn/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: openingMessages }),
    })
    const data = await res.json()
    setSending(false)

    if (data.reply) {
      setMessages([{ role: 'assistant', content: data.reply }])
      speakReply(data.reply)
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || limitReached) return

    window.speechSynthesis?.cancel()
    setSpeaking(false)

    const count = incrementDemoCount()
    setDemoUsed(count)

    const allMessages = [
      { role: 'user', content: '[SESSION_START] Free demo session.' },
      ...messages,
      { role: 'user', content: text },
    ]

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setSending(true)

    const res = await fetch('/api/unickorn/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: allMessages }),
    })
    const data = await res.json()
    setSending(false)

    if (data.reply) {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      speakReply(data.reply)
    }

    if (count >= MAX_MESSAGES) {
      setLimitReached(true)
    }
  }

  if (!started && !limitReached) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white border border-ui-border rounded-card shadow-card p-8 text-center">
          <div className="text-5xl mb-4">&#x1F984;</div>
          <h1 className="font-heading font-bold text-2xl text-navy mb-2 tracking-tight">Try uNickorn free</h1>
          <p className="text-sm text-muted mb-2">
            Talk to our AI English tutor &mdash; no account needed.
          </p>
          <p className="text-xs text-muted mb-6">
            uNickorn will speak to you! You get {MAX_MESSAGES} free messages.
          </p>
          <button
            onClick={startDemo}
            className="w-full bg-brand hover:bg-red-700 transition-colors text-white rounded-full py-3.5 font-semibold text-[15px]"
          >
            Start talking
          </button>
          <p className="text-xs text-muted mt-4">
            <Link href="/academy/signup" className="text-navy font-semibold hover:text-brand transition-colors">
              Sign up
            </Link>{' '}
            for unlimited conversations with session recaps and personalised learning.
          </p>
        </div>
      </div>
    )
  }

  if (limitReached && messages.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white border border-ui-border rounded-card shadow-card p-8 text-center">
          <div className="text-5xl mb-4">&#x1F984;</div>
          <h1 className="font-heading font-bold text-xl text-navy mb-2 tracking-tight">Demo finished</h1>
          <p className="text-sm text-muted mb-6">
            You&apos;ve used your {MAX_MESSAGES} free messages. Sign up to keep talking with uNickorn &mdash; with session recaps, vocabulary tracking, and personalised learning.
          </p>
          <Link
            href="/academy/signup"
            className="block w-full bg-brand hover:bg-red-700 transition-colors text-white rounded-full py-3.5 font-semibold text-[15px] text-center"
          >
            Sign up free
          </Link>
          <p className="text-xs text-muted mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-navy font-semibold hover:text-brand transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      <header className="bg-navy px-6 py-4 flex items-center justify-between">
        <span className="text-white font-heading font-bold tracking-tight">
          uNickorn <span className="text-xs font-body font-normal opacity-70">free demo</span>
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleVoice}
            className="text-white text-lg opacity-80 hover:opacity-100 transition-opacity"
            aria-label={voiceOn ? 'Mute voice' : 'Enable voice'}
            title={voiceOn ? 'Voice on' : 'Voice off'}
          >
            {voiceOn ? '\u{1F50A}' : '\u{1F507}'}
          </button>
          <span className="text-xs text-white opacity-70">
            {limitReached
              ? 'Demo finished'
              : `${MAX_MESSAGES - demoUsed} left`}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-card px-5 py-3.5 text-sm whitespace-pre-wrap leading-relaxed ${
              message.role === 'assistant'
                ? 'bg-white text-navy mr-auto border border-ui-border shadow-sm'
                : 'bg-navy text-white ml-auto'
            }`}
          >
            {message.content}
            {message.role === 'assistant' && speaking && i === messages.length - 1 && (
              <span className="inline-block ml-2 text-xs opacity-50 animate-pulse">
                &#x1F50A;
              </span>
            )}
          </div>
        ))}
        {sending && (
          <div className="max-w-[80%] rounded-card px-5 py-3.5 text-sm bg-white text-muted mr-auto border border-ui-border">
            uNickorn is thinking...
          </div>
        )}
        {limitReached && (
          <div className="max-w-[90%] mx-auto bg-white rounded-card p-6 text-center mt-4 border border-ui-border shadow-card">
            <p className="text-sm text-muted mb-3">
              That was your free demo! Sign up to keep talking with uNickorn.
            </p>
            <Link
              href="/academy/signup"
              className="inline-block bg-brand hover:bg-red-700 transition-colors text-white rounded-full px-6 py-2.5 font-semibold text-sm"
            >
              Sign up free
            </Link>
            <p className="text-xs text-muted mt-3">
              Already have an account?{' '}
              <Link href="/login" className="text-navy font-semibold hover:text-brand transition-colors">Log in</Link>
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!limitReached && (
        <form onSubmit={handleSend} className="px-4 py-4 bg-white border-t border-ui-border flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write something in English..."
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-xl border-[1.5px] border-ui-border text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-brand hover:bg-red-700 transition-colors text-white rounded-xl px-6 font-semibold text-sm disabled:opacity-50"
          >
            Send
          </button>
        </form>
      )}
    </div>
  )
}
