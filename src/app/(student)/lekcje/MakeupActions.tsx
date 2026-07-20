'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LanguageLevel } from '@/types'
import { t, type Lang } from '@/lib/i18n'

type Slot = { start: Date; end: Date }

// nasz day_of_week: 0 = poniedziałek ... 6 = niedziela
function jsToDow(d: Date) {
  return (d.getDay() + 6) % 7
}

// Świeży pokój Jitsi dla lekcji odrabianej — ta sama konwencja nazw co przy
// zapisie online (public_book_online), żeby uczeń miał w co kliknąć.
function makeMeetingUrl() {
  const bytes = new Uint8Array(5)
  crypto.getRandomValues(bytes)
  const slug = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `https://meet.jit.si/uNick-${slug}`
}

export function MakeupActions({
  lessonId,
  studentId,
  teacherId,
  level,
  originalDate,
  startsAt,
  lang,
}: {
  lessonId: string
  studentId: string
  teacherId: string
  level: LanguageLevel
  originalDate: string
  startsAt: string
  lang: Lang
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'reported' | 'finding' | 'late_cancelled'>('idle')
  const [slots, setSlots] = useState<Slot[]>([])
  const [busyMsg, setBusyMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function reportAbsence() {
    const hoursUntil = (new Date(startsAt).getTime() - Date.now()) / 3_600_000
    const inTime = hoursUntil >= 24
    // Potwierdzenie zależne od tego, czy mieści się w 24h
    const msg = inTime
      ? `${t(lang, 'cancel_lesson_q')} ${t(lang, 'cancel_ge24_info')}`
      : t(lang, 'cancel_lt24_confirm')
    if (!confirm(msg)) return
    setError(null)
    const supabase = createClient()
    const status = inTime ? 'excused' : 'late_cancellation'
    const { error } = await supabase.from('lessons').update({ attendance: status }).eq('id', lessonId)
    if (error) { setError('Nie udało się zgłosić: ' + error.message); return }
    // powiadom prowadzącego (nie blokuje UI)
    fetch('/api/notify/makeup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, kind: inTime ? 'absence' : 'late_cancel' }),
    }).catch(() => {})
    if (inTime) {
      setPhase('reported')
    } else {
      setPhase('late_cancelled')
      setTimeout(() => router.refresh(), 2000)
    }
  }

  async function findSlots() {
    setPhase('finding')
    setBusyMsg(t(lang, 'finding_slots'))
    setError(null)
    const supabase = createClient()

    const from = new Date()
    const to = new Date(Date.now() + 14 * 86400000)

    const [availRes, busyRes] = await Promise.all([
      supabase.from('availability').select('day_of_week, start_time, end_time').eq('teacher_id', teacherId),
      supabase.rpc('teacher_busy_slots', { p_teacher: teacherId, p_from: from.toISOString(), p_to: to.toISOString() }),
    ])

    const availability = availRes.data ?? []
    const busy: { start: number; end: number }[] = (busyRes.data ?? []).map((b: { starts_at: string; ends_at: string }) => ({
      start: new Date(b.starts_at).getTime(),
      end: new Date(b.ends_at).getTime(),
    }))

    const found: Slot[] = []
    for (let dayOffset = 0; dayOffset < 14 && found.length < 6; dayOffset++) {
      const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() + dayOffset)
      const dow = jsToDow(day)
      const windows = availability.filter((a) => a.day_of_week === dow)
      for (const w of windows) {
        const startHour = parseInt(w.start_time.split(':')[0], 10)
        const endHour = parseInt(w.end_time.split(':')[0], 10)
        for (let h = startHour; h < endHour && found.length < 6; h++) {
          const s = new Date(day); s.setHours(h, 0, 0, 0)
          const e = new Date(s.getTime() + 60 * 60000)
          if (s.getTime() < Date.now()) continue
          const clashes = busy.some((b) => s.getTime() < b.end && e.getTime() > b.start)
          if (clashes) continue
          if (found.some((f) => f.start.getTime() === s.getTime())) continue
          found.push({ start: s, end: e })
        }
      }
    }

    setSlots(found)
    setBusyMsg(found.length === 0 ? t(lang, 'no_slots') : null)
  }

  async function bookSlot(slot: Slot) {
    setError(null)
    const supabase = createClient()
    const { data: created, error } = await supabase.from('lessons').insert({
      student_id: studentId,
      teacher_id: teacherId,
      type: 'online',
      format: 'individual',
      level,
      topic: lang === 'en' ? `Make-up (for ${originalDate})` : `Odrabianie (za ${originalDate})`,
      starts_at: slot.start.toISOString(),
      ends_at: slot.end.toISOString(),
      meeting_url: makeMeetingUrl(),
    }).select('id').single()
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    // powiadom prowadzącego o zapisie na odrabianie
    if (created?.id) {
      fetch('/api/notify/makeup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: created.id, kind: 'booked' }) }).catch(() => {})
    }
    setDone(true)
    setTimeout(() => router.refresh(), 1200)
  }

  if (done) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-50">
        <p className="text-xs text-green-600 font-medium flex items-center gap-1.5"><Check size={13} />{t(lang, 'makeup_booked')}</p>
      </div>
    )
  }

  if (phase === 'late_cancelled') {
    return (
      <div className="mt-3 pt-3 border-t border-gray-50">
        <p className="text-xs text-orange-600 font-medium flex items-center gap-1.5"><X size={13} />{t(lang, 'late_cancel_done')}</p>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-50">
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {phase === 'idle' && (
        <button onClick={reportAbsence}
          className="text-xs text-gray-500 hover:text-red-500 font-medium flex items-center gap-1.5 transition-colors">
          <X size={13} />{t(lang, 'report_absence')}
        </button>
      )}

      {phase === 'reported' && (
        <div className="flex items-center gap-3">
          <p className="text-xs text-amber-600 font-medium">{t(lang, 'absence_reported')}.</p>
          <button onClick={findSlots}
            className="text-xs text-[#23479E] hover:underline font-semibold flex items-center gap-1.5">
            <CalendarPlus size={13} />{t(lang, 'book_makeup')}
          </button>
        </div>
      )}

      {phase === 'finding' && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><CalendarPlus size={13} />{t(lang, 'suggested_slots')}</p>
          {busyMsg && <p className="text-xs text-gray-500">{busyMsg}</p>}
          {slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button key={s.start.toISOString()} onClick={() => bookSlot(s)}
                  className="text-xs bg-[#EAF3FF] text-[#23479E] hover:bg-[#23479E] hover:text-white px-2.5 py-1.5 rounded-lg font-medium transition-colors">
                  {s.start.toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.start.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
