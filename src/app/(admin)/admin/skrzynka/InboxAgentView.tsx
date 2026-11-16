'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail, Play, Loader2, Send, FolderInput, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Trash2, Plus, BookOpen, Settings, History, HelpCircle, ShieldAlert, Sparkles, GraduationCap,
} from 'lucide-react'

export type PendingItem = {
  id: string
  from: string
  subject: string
  receivedAt: string
  body: string
  folder: string
  summary: string
  confidence: string | null
  sensitive: boolean
  question: string
  topic: string
  draft: string
  error: string
}

export type HistoryItem = {
  id: string
  from: string
  subject: string
  at: string
  folder: string
  summary: string
  status: string
  finalBody: string
  error: string
}

type KnowledgeRow = { id: string; topic: string; answer: string; source: string }

type Props = {
  configured: { mailbox: boolean; brain: boolean }
  settings: { enabled: boolean; autoReply: boolean; ownerNotes: string; signature: string }
  learnedProfile: string
  learnedProfileAt: string
  lastRunAt: string
  lastRun: Record<string, unknown> | null
  lastError: string | null
  replyWindowDays: number
  pending: PendingItem[]
  history: HistoryItem[]
  knowledge: KnowledgeRow[]
}

type Tab = 'pending' | 'history' | 'knowledge' | 'settings'

const STATUS_META: Record<string, { label: string; style: string }> = {
  sorted: { label: 'Uporządkowany', style: 'bg-gray-100 text-gray-600' },
  replied_auto: { label: 'Agent odpisał', style: 'bg-green-100 text-green-700' },
  replied_approved: { label: 'Wysłane po akceptacji', style: 'bg-blue-100 text-blue-700' },
  replied_manually: { label: 'Odpisano z poczty', style: 'bg-blue-50 text-blue-600' },
  dismissed: { label: 'Bez odpowiedzi', style: 'bg-gray-100 text-gray-500' },
  resolved_outside: { label: 'Załatwione w poczcie', style: 'bg-gray-100 text-gray-500' },
  sending: { label: 'W trakcie wysyłki', style: 'bg-amber-100 text-amber-700' },
  error: { label: 'Błąd', style: 'bg-red-100 text-red-700' },
}

const CONFIDENCE_LABEL: Record<string, string> = { high: 'wysoka', medium: 'średnia', low: 'niska' }

async function call(payload: Record<string, unknown>): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch('/api/admin/inbox-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

function runLine(s: Record<string, unknown>): string {
  if (typeof s.skipped === 'string') return s.skipped
  if (typeof s.error === 'string') return `Błąd: ${s.error}`
  const parts = [
    `uporządkowane: ${s.sorted ?? 0}`,
    `odpowiedzi agenta: ${s.repliedAuto ?? 0}`,
    `do Twojej decyzji: ${s.needsReview ?? 0}`,
    `zostało w odbiorczej: ${s.remainingInInbox ?? 0}`,
  ]
  if (Number(s.errors) > 0) parts.push(`błędy: ${s.errors}`)
  return parts.join(', ')
}

export function InboxAgentView(props: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pending')
  const [running, setRunning] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const ready = props.configured.mailbox && props.configured.brain

  const run = async (wholeInbox: boolean) => {
    setNotice(null)
    let totalSorted = 0
    let totalReview = 0
    let totalReplied = 0
    // Jeden przebieg obsługuje ograniczoną porcję maili, więc przy porządkowaniu
    // całej skrzynki powtarzamy go, dopóki coś jeszcze ubywa.
    for (let round = 1; round <= (wholeInbox ? 40 : 1); round++) {
      setRunning(wholeInbox ? `Porządkuję skrzynkę, runda ${round}. Uporządkowane do tej pory: ${totalSorted}` : 'Agent pracuje, to może potrwać kilka minut')
      const { ok, data } = await call({ action: 'run' })
      if (!ok || typeof data.error === 'string' || typeof data.skipped === 'string') {
        setNotice({ kind: 'err', text: ok ? runLine(data) : String(data.error ?? 'Nie udało się uruchomić agenta.') })
        break
      }
      const sorted = Number(data.sorted ?? 0)
      const review = Number(data.needsReview ?? 0)
      const replied = Number(data.repliedAuto ?? 0)
      totalSorted += sorted
      totalReview += review
      totalReplied += replied
      const progressed = sorted + review + replied > 0
      if (!wholeInbox || !progressed || Number(data.remainingInInbox ?? 0) === 0) {
        setNotice({
          kind: 'ok',
          text: `Gotowe. Uporządkowane: ${totalSorted}, odpowiedzi agenta: ${totalReplied}, do Twojej decyzji: ${totalReview}, zostało w odbiorczej: ${data.remainingInInbox ?? 0}.`,
        })
        break
      }
    }
    setRunning(null)
    router.refresh()
  }

  // Akcja celowana: tylko aplikacje nauczycieli, do folderu, który już jest
  // w skrzynce. Reszta poczty zostaje na miejscu.
  const sweepApplications = async () => {
    setNotice(null)
    let moved = 0
    let scanned = 0
    let beforeUid: number | undefined
    for (let round = 1; round <= 60; round++) {
      setRunning(`Szukam aplikacji nauczycieli. Przejrzane maile: ${scanned}, przeniesione: ${moved}`)
      const { ok, data } = await call({ action: 'sweep', category: 'rekrutacja', beforeUid })
      if (!ok || typeof data.error === 'string' || typeof data.skipped === 'string') {
        setNotice({ kind: 'err', text: String(data.error ?? data.skipped ?? 'Nie udało się uruchomić agenta.') })
        break
      }
      moved += Number(data.moved ?? 0)
      scanned += Number(data.scanned ?? 0)
      if (typeof data.nextBeforeUid !== 'number') {
        const failed = Number(data.errors ?? 0)
        setNotice({
          kind: 'ok',
          text: `Gotowe. Przejrzane maile w odbiorczej: ${scanned}, przeniesione do „${data.folder}": ${moved}.${failed > 0 ? ` Nie udało się sprawdzić: ${failed}, uruchom jeszcze raz.` : ''}`,
        })
        break
      }
      beforeUid = data.nextBeforeUid
    }
    setRunning(null)
    router.refresh()
  }

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: 'pending', label: `Do decyzji (${props.pending.length})`, icon: HelpCircle },
    { key: 'history', label: 'Historia', icon: History },
    { key: 'knowledge', label: 'Wiedza agenta', icon: BookOpen },
    { key: 'settings', label: 'Ustawienia', icon: Settings },
  ]

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Mail size={22} />Skrzynka</h1>
          <p className="text-sm text-gray-500 mt-1">
            Agent porządkuje pocztę w podfolderach, odpisuje na to, co wie, a z resztą przychodzi do Ciebie.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => run(false)}
            disabled={!ready || !!running}
            className="inline-flex items-center gap-2 bg-[#23479E] text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-40"
          >
            {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}Sprawdź pocztę teraz
          </button>
          <button
            onClick={() => run(true)}
            disabled={!ready || !!running}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-40"
          >
            <FolderInput size={16} />Uporządkuj całą skrzynkę
          </button>
          <button
            onClick={sweepApplications}
            disabled={!ready || !!running}
            title="Przenosi z odbiorczej tylko aplikacje o pracę do istniejącego folderu Teachers Applications. Reszta poczty zostaje na miejscu."
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-40"
          >
            <GraduationCap size={16} />Przenieś aplikacje nauczycieli
          </button>
        </div>
      </div>

      {!ready && <SetupCard mailbox={props.configured.mailbox} brain={props.configured.brain} />}

      {running && (
        <div className="mb-4 flex items-center gap-2 bg-[#EAF3FF] text-[#23479E] text-sm rounded-xl px-4 py-3">
          <Loader2 size={16} className="animate-spin flex-shrink-0" />{running}
        </div>
      )}
      {notice && (
        <div className={`mb-4 flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${notice.kind === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {notice.kind === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {ready && (
        <div className="mb-5 text-xs text-gray-500 bg-white border border-gray-100 rounded-xl px-4 py-3">
          {props.lastRunAt ? (
            <>Ostatni przebieg: <span className="font-semibold text-gray-700">{props.lastRunAt}</span>. {props.lastRun ? runLine(props.lastRun) : ''}</>
          ) : (
            'Agent jeszcze nie pracował. Kliknij „Sprawdź pocztę teraz", żeby zobaczyć pierwsze propozycje.'
          )}
          <span className="block mt-1">
            Tryb: {props.settings.enabled
              ? props.settings.autoReply ? 'pewne odpowiedzi agent wysyła sam, z resztą pyta Ciebie' : 'agent porządkuje i proponuje, każdą odpowiedź zatwierdzasz Ty'
              : 'agent wyłączony'}.
          </span>
        </div>
      )}

      <div className="flex gap-1 mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors ${tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'pending' && <PendingList items={props.pending} onDone={() => router.refresh()} />}
      {tab === 'history' && <HistoryList items={props.history} />}
      {tab === 'knowledge' && (
        <KnowledgeTab
          notes={props.settings.ownerNotes}
          knowledge={props.knowledge}
          learnedProfile={props.learnedProfile}
          learnedProfileAt={props.learnedProfileAt}
          canRun={ready && !running}
          onChanged={() => router.refresh()}
        />
      )}
      {tab === 'settings' && <SettingsTab settings={props.settings} replyWindowDays={props.replyWindowDays} onChanged={() => router.refresh()} />}
    </div>
  )
}

function SetupCard({ mailbox, brain }: { mailbox: boolean; brain: boolean }) {
  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900">
      <p className="font-bold flex items-center gap-2 mb-2"><AlertTriangle size={16} />Agent czeka na dostęp</p>
      {!mailbox && (
        <>
          <p className="mb-2">
            Dodaj dane logowania do skrzynki w Vercel (Settings, Environment Variables, środowisko Production), a potem zrób Redeploy:
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <li><code className="font-mono text-xs bg-white/70 px-1 rounded">INBOX_USER</code>: pełny adres skrzynki, np. hello@unick-academy.pl</li>
            <li><code className="font-mono text-xs bg-white/70 px-1 rounded">INBOX_PASSWORD</code>: hasło do tej skrzynki (zaznacz jako Sensitive)</li>
          </ul>
          <p className="text-xs text-amber-800">Hasło zostaje tylko w Vercel. Nie trafia do kodu, bazy ani do rozmowy z Claude.</p>
        </>
      )}
      {!brain && <p className="mt-2">Brakuje też klucza <code className="font-mono text-xs bg-white/70 px-1 rounded">ANTHROPIC_API_KEY</code> w Vercel.</p>}
    </div>
  )
}

function PendingList({ items, onDone }: { items: PendingItem[]; onDone: () => void }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400 text-sm">
        Nic nie czeka na Twoją decyzję.
      </div>
    )
  }
  return <div className="space-y-4">{items.map((m) => <PendingCard key={m.id} item={m} onDone={onDone} />)}</div>
}

function PendingCard({ item, onDone }: { item: PendingItem; onDone: () => void }) {
  const [draft, setDraft] = useState(item.draft)
  const [showOriginal, setShowOriginal] = useState(false)
  const [remember, setRemember] = useState(false)
  const [topic, setTopic] = useState(item.topic)
  const [busy, setBusy] = useState<'send' | 'dismiss' | null>(null)
  const [error, setError] = useState(item.error)
  const hasPlaceholder = /\[[^\]]*\]/.test(draft)

  const act = async (kind: 'send' | 'dismiss') => {
    setBusy(kind)
    setError('')
    const { ok, data } = await call(
      kind === 'send' ? { action: 'send', id: item.id, body: draft, remember, topic } : { action: 'dismiss', id: item.id },
    )
    setBusy(null)
    if (!ok) {
      setError(String(data.error ?? 'Coś poszło nie tak.'))
      return
    }
    onDone()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 break-words">{item.subject}</p>
          <p className="text-xs text-gray-500 mt-0.5 break-all">{item.from} · {item.receivedAt}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{item.folder}</span>
          {item.confidence && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              pewność: {CONFIDENCE_LABEL[item.confidence] ?? item.confidence}
            </span>
          )}
          {item.sensitive && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              <ShieldAlert size={11} />delikatna sprawa
            </span>
          )}
        </div>
      </div>

      {item.summary && <p className="text-sm text-gray-700 mt-3">{item.summary}</p>}

      {item.question && (
        <div className="mt-3 bg-[#EAF3FF] rounded-xl px-4 py-3 text-sm text-[#1E3282]">
          <p className="font-semibold flex items-center gap-1.5 mb-0.5"><HelpCircle size={14} />Pytanie agenta do Ciebie</p>
          <p className="whitespace-pre-wrap">{item.question}</p>
        </div>
      )}

      <button
        onClick={() => setShowOriginal((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800"
      >
        {showOriginal ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{showOriginal ? 'Ukryj treść maila' : 'Pokaż treść maila'}
      </button>
      {showOriginal && (
        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-gray-600 bg-gray-50 rounded-xl p-3 font-sans">
          {item.body || '(brak treści tekstowej)'}
        </pre>
      )}

      <label className="block text-xs font-semibold text-gray-500 mt-4 mb-1">Odpowiedź (podpis doda się sam)</label>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={Math.min(14, Math.max(5, draft.split('\n').length + 1))}
        placeholder="Agent nie przygotował szkicu. Napisz odpowiedź tutaj."
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#23479E]/30"
      />
      {hasPlaceholder && (
        <p className="text-xs text-amber-700 mt-1">
          Uzupełnij miejsca w nawiasach kwadratowych. Dopóki tam są, odpowiedź nie wyjdzie.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="inline-flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded" />
          Zapamiętaj tę odpowiedź na przyszłość
        </label>
        {remember && (
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Temat, np. Cena lekcji indywidualnej"
            className="flex-1 min-w-[200px] text-xs border border-gray-200 rounded-lg px-2.5 py-1.5"
          />
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => act('send')}
          disabled={!!busy || !draft.trim() || hasPlaceholder || (remember && !topic.trim())}
          className="inline-flex items-center gap-2 bg-[#23479E] text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-40"
        >
          {busy === 'send' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}Wyślij odpowiedź
        </button>
        <button
          onClick={() => act('dismiss')}
          disabled={!!busy}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-40"
        >
          {busy === 'dismiss' ? <Loader2 size={15} className="animate-spin" /> : <FolderInput size={15} />}Nie wymaga odpowiedzi
        </button>
      </div>
    </div>
  )
}

function HistoryList({ items }: { items: HistoryItem[] }) {
  const [open, setOpen] = useState<string | null>(null)
  if (items.length === 0) {
    return <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400 text-sm">Historia jest jeszcze pusta.</div>
  }
  return (
    <div className="space-y-2">
      {items.map((h) => {
        const meta = STATUS_META[h.status] ?? { label: h.status, style: 'bg-gray-100 text-gray-600' }
        const expandable = !!h.finalBody || !!h.error
        return (
          <div key={h.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <button className="w-full text-left" onClick={() => expandable && setOpen(open === h.id ? null : h.id)}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.style}`}>{meta.label}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">{h.folder}</span>
                <span className="text-xs text-gray-400 ml-auto">{h.at}</span>
              </div>
              <p className="font-semibold text-sm text-gray-900 mt-1.5 break-words">{h.subject}</p>
              <p className="text-xs text-gray-500 break-all">{h.from}</p>
              {h.summary && <p className="text-sm text-gray-600 mt-1">{h.summary}</p>}
            </button>
            {open === h.id && (
              <div className="mt-3 text-sm">
                {h.finalBody && <pre className="whitespace-pre-wrap break-words font-sans text-gray-700 bg-gray-50 rounded-xl p-3">{h.finalBody}</pre>}
                {h.error && <p className="text-xs text-amber-700 mt-2">{h.error}</p>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function KnowledgeTab(props: {
  notes: string
  knowledge: KnowledgeRow[]
  learnedProfile: string
  learnedProfileAt: string
  canRun: boolean
  onChanged: () => void
}) {
  const [notes, setNotes] = useState(props.notes)
  const [topic, setTopic] = useState('')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [showProfile, setShowProfile] = useState(false)

  const doCall = async (key: string, payload: Record<string, unknown>, okText: string) => {
    setBusy(key)
    setMsg('')
    const { ok, data } = await call(payload)
    setBusy(null)
    setMsg(ok ? okText : String(data.error ?? 'Nie udało się zapisać.'))
    if (ok) props.onChanged()
    return ok
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-bold text-gray-900 text-sm">Notatki dla agenta</p>
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Wpisz tu wszystko, co agent ma wiedzieć i czego ma się trzymać: aktualne ceny, zasady odwoływania zajęć, terminy, czego nie obiecywać.
          To źródło ma pierwszeństwo przed wszystkim innym.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={8}
          placeholder={'Np.\nLekcja indywidualna online 60 min kosztuje ...\nOdwołanie zajęć najpóźniej 24 godziny wcześniej ...\nNie podawaj cen dla firm, zawsze proponuj rozmowę.'}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#23479E]/30"
        />
        <button
          onClick={() => doCall('notes', { action: 'settings', ownerNotes: notes }, 'Notatki zapisane.')}
          disabled={busy === 'notes' || notes === props.notes}
          className="mt-2 bg-[#23479E] text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-40"
        >
          Zapisz notatki
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-bold text-gray-900 text-sm">Gotowe odpowiedzi</p>
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Odpowiedzi zatwierdzone z opcją „Zapamiętaj” oraz te dodane ręcznie. Agent korzysta z nich przy podobnych pytaniach.
        </p>
        <div className="grid gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Temat pytania"
            className="text-sm border border-gray-200 rounded-xl px-3 py-2"
          />
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            placeholder="Co odpowiadamy"
            className="text-sm border border-gray-200 rounded-xl px-3 py-2"
          />
          <button
            onClick={async () => {
              if (await doCall('add', { action: 'knowledge_add', topic, answer }, 'Dodane.')) {
                setTopic('')
                setAnswer('')
              }
            }}
            disabled={busy === 'add' || !topic.trim() || !answer.trim()}
            className="justify-self-start inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-40"
          >
            <Plus size={15} />Dodaj
          </button>
        </div>
        {props.knowledge.length > 0 && (
          <div className="mt-4 divide-y divide-gray-100">
            {props.knowledge.map((k) => (
              <div key={k.id} className="py-3 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{k.topic}</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{k.answer}</p>
                </div>
                <button
                  onClick={() => doCall(`del-${k.id}`, { action: 'knowledge_delete', id: k.id }, 'Usunięte.')}
                  disabled={busy === `del-${k.id}`}
                  aria-label="Usuń"
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><Sparkles size={15} />Czego agent nauczył się z wysłanych maili</p>
        <p className="text-xs text-gray-500 mt-1">
          {props.learnedProfileAt
            ? `Ostatnia nauka: ${props.learnedProfileAt}. Agent odświeża tę wiedzę sam, raz w tygodniu.`
            : 'Agent przeczyta folder Wysłane przy pierwszym przebiegu i zanotuje fakty o szkole oraz Wasz styl pisania.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {props.learnedProfile && (
            <button onClick={() => setShowProfile((v) => !v)} className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900">
              {showProfile ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{showProfile ? 'Ukryj notatkę' : 'Pokaż notatkę'}
            </button>
          )}
          <button
            onClick={() => doCall('relearn', { action: 'run', relearn: true }, 'Agent przeczytał Wysłane od nowa.')}
            disabled={!props.canRun || busy === 'relearn'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#23479E] disabled:opacity-40"
          >
            {busy === 'relearn' && <Loader2 size={13} className="animate-spin" />}Naucz się od nowa teraz
          </button>
        </div>
        {showProfile && (
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words font-sans text-xs text-gray-700 bg-gray-50 rounded-xl p-3">{props.learnedProfile}</pre>
        )}
      </div>

      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  )
}

function SettingsTab({ settings, replyWindowDays, onChanged }: { settings: Props['settings']; replyWindowDays: number; onChanged: () => void }) {
  const [enabled, setEnabled] = useState(settings.enabled)
  const [autoReply, setAutoReply] = useState(settings.autoReply)
  const [signature, setSignature] = useState(settings.signature)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async (patch: Record<string, unknown>) => {
    setBusy(true)
    setMsg('')
    const { ok, data } = await call({ action: 'settings', ...patch })
    setBusy(false)
    setMsg(ok ? 'Zapisane.' : String(data.error ?? 'Nie udało się zapisać.'))
    if (ok) onChanged()
    return ok
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <Toggle
          label="Agent włączony"
          hint="Wyłączony agent nie dotyka skrzynki: niczego nie przenosi i na nic nie odpowiada."
          checked={enabled}
          disabled={busy}
          onChange={async (v) => { setEnabled(v); if (!(await save({ enabled: v }))) setEnabled(!v) }}
        />
        <Toggle
          label="Agent sam wysyła pewne odpowiedzi"
          hint={`Dotyczy tylko maili z ostatnich ${replyWindowDays} dni, przy których agent ma komplet informacji, wysoką pewność i nie widzi delikatnej sprawy. Wszystko inne nadal trafia do Twojej decyzji. Przy wyłączonej opcji każdą odpowiedź zatwierdzasz Ty.`}
          checked={autoReply}
          disabled={busy}
          onChange={async (v) => { setAutoReply(v); if (!(await save({ autoReply: v }))) setAutoReply(!v) }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-bold text-gray-900 text-sm">Podpis pod odpowiedziami</p>
        <p className="text-xs text-gray-500 mt-1 mb-3">Doklejany pod każdą odpowiedzią wysłaną przez agenta lub z tego panelu.</p>
        <textarea
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          rows={5}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#23479E]/30"
        />
        <button
          onClick={() => save({ signature })}
          disabled={busy || signature === settings.signature}
          className="mt-2 bg-[#23479E] text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-40"
        >
          Zapisz podpis
        </button>
      </div>

      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  )
}

function Toggle(props: { label: string; hint: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{props.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{props.hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={props.checked}
        aria-label={props.label}
        disabled={props.disabled}
        onClick={() => props.onChange(!props.checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${props.checked ? 'bg-[#23479E]' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${props.checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}
