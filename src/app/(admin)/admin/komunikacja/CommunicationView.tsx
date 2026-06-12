'use client'

import { useState } from 'react'
import { Megaphone, Mail, MessageSquare, Send, Users, GraduationCap, CalendarRange, UsersRound } from 'lucide-react'

type Segment = 'all_students' | 'all_teachers' | 'group' | 'lessons_range'

const SEGMENTS: { id: Segment; label: string; icon: typeof Users; desc: string }[] = [
  { id: 'all_students', label: 'Wszyscy uczniowie', icon: Users, desc: 'Każdy zapisany uczeń' },
  { id: 'all_teachers', label: 'Wszyscy lektorzy', icon: GraduationCap, desc: 'Cały zespół nauczycieli' },
  { id: 'group', label: 'Grupa', icon: UsersRound, desc: 'Członkowie wybranej grupy' },
  { id: 'lessons_range', label: 'Uczniowie z lekcją w terminie', icon: CalendarRange, desc: 'Np. wszyscy z zajęciami w ten weekend' },
]

export function CommunicationView({
  groupOptions, emailConfigured, smsConfigured,
}: {
  groupOptions: { id: string; name: string }[]
  emailConfigured: boolean
  smsConfigured: boolean
}) {
  const [channel, setChannel] = useState<'email' | 'sms'>('email')
  const [segment, setSegment] = useState<Segment>('all_students')
  const [groupId, setGroupId] = useState(groupOptions[0]?.id ?? '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function handlePreview() {
    setResult(null); setPreviewCount(null)
    const res = await fetch('/api/admin/communication/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segment, groupId, dateFrom, dateTo, preview: true }),
    })
    const data = await res.json()
    if (!res.ok) { setResult('Błąd: ' + (data.error ?? 'nie udało się')); return }
    setPreviewCount(data.recipients)
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { setResult('Podaj temat i treść.'); return }
    if (!confirm(`Wysłać wiadomość${previewCount != null ? ` do ${previewCount} odbiorców` : ''}? Tej operacji nie można cofnąć.`)) return
    setSending(true); setResult(null)
    const res = await fetch('/api/admin/communication/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segment, subject, body, groupId, dateFrom, dateTo }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) { setResult('Błąd: ' + (data.error ?? 'nie udało się')); return }
    if (data.emailConfigured) {
      setResult(`✅ Wysłano do ${data.sent} odbiorców.`)
    } else {
      setResult(`📋 Segment obejmuje ${data.recipients} odbiorców. E-mail (Resend) jest nieaktywny — skonfiguruj RESEND_API_KEY, aby wysyłać.`)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-6"><Megaphone size={22} />Komunikacja</h1>

      {/* Kanał */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setChannel('email')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${channel === 'email' ? 'bg-[#23479E] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <Mail size={16} />E-mail {!emailConfigured && <span className="text-xs opacity-70">(nieaktywny)</span>}
        </button>
        <button onClick={() => setChannel('sms')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${channel === 'sms' ? 'bg-[#23479E] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          <MessageSquare size={16} />SMS {!smsConfigured && <span className="text-xs opacity-70">(wkrótce)</span>}
        </button>
      </div>

      {channel === 'sms' ? (
        <div className="bg-amber-50 rounded-2xl p-6 text-sm text-amber-700">
          Kanał SMS jest przygotowany, ale wymaga podłączenia dostawcy (np. SMSAPI / Twilio). Po dodaniu klucza API wysyłka SMS do segmentów zadziała tak samo jak e-mail.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Segment */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Do kogo?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SEGMENTS.map((s) => {
                const Icon = s.icon
                const active = segment === s.id
                return (
                  <button key={s.id} onClick={() => setSegment(s.id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors ${active ? 'border-[#23479E] bg-[#EAF3FF]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <Icon size={18} className={active ? 'text-[#23479E]' : 'text-gray-400'} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {segment === 'group' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupa</label>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                {groupOptions.length === 0 && <option value="">Brak grup</option>}
                {groupOptions.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          {segment === 'lessons_range' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Od</label>
                <input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Do</label>
                <input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
              </div>
            </div>
          )}

          {/* Treść */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temat</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="np. Zmiana planu na ten tydzień"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treść wiadomości</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Cześć! Chcieliśmy poinformować, że..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E] resize-none" />
            <p className="text-xs text-gray-400 mt-1">Każdy odbiorca dostanie spersonalizowane „Cześć [imię]!" na początku.</p>
          </div>

          {previewCount != null && <div className="text-sm text-[#23479E] bg-[#EAF3FF] rounded-xl px-4 py-3">Ten segment obejmuje <strong>{previewCount}</strong> odbiorców.</div>}
          {result && <div className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3">{result}</div>}

          <div className="flex gap-2">
            <button onClick={handlePreview} disabled={sending}
              className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60">
              Podgląd odbiorców
            </button>
            <button onClick={handleSend} disabled={sending}
              className="flex-1 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
              <Send size={16} />{sending ? 'Wysyłanie...' : 'Wyślij wiadomość'}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Wiadomości operacyjne idą przez Resend. Newslettery i kampanie marketingowe planujemy osobnym torem (Brevo/Zapier) — Faza 5.
          </p>
        </div>
      )}
    </div>
  )
}
