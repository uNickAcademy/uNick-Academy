'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Video, MapPin, X, Plus, Trash2, BookOpen, Check, Calendar, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AttendanceStatus, LanguageLevel, LessonType } from '@/types'

type Material = { id: string; title: string; url: string }
type Row = {
  id: string
  student: string
  startsAt: string
  endsAt: string
  type: LessonType
  level: LanguageLevel
  topic: string
  homework: string
  meetingUrl: string
  attendance: AttendanceStatus
  materials: Material[]
}

const ATT_CONFIG: Record<AttendanceStatus, { label: string; color: string }> = {
  scheduled: { label: 'Do wpisania', color: 'bg-gray-100 text-gray-600' },
  present: { label: 'Obecny', color: 'bg-green-100 text-green-700' },
  absent: { label: 'Nieobecny', color: 'bg-red-100 text-red-700' },
  excused: { label: 'Usprawiedliwiony', color: 'bg-amber-100 text-amber-700' },
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function toLocalInput(iso: string) {
  const d = new Date(iso); const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

export function RegisterView({ rows, teacherId }: { rows: Row[]; teacherId: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Row | null>(null)
  const [reschedule, setReschedule] = useState<Row | null>(null)
  const [substitute, setSubstitute] = useState<Row | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const past = rows.filter((r) => new Date(r.startsAt).getTime() < Date.now())
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
  const upcoming = rows.filter((r) => new Date(r.startsAt).getTime() >= Date.now())
  const unmarked = past.filter((r) => r.attendance === 'scheduled').length

  async function cancelLesson(id: string) {
    if (!confirm('Odwołać tę lekcję? Tej operacji nie można cofnąć.')) return
    const supabase = createClient()
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) { alert('Nie udało się odwołać: ' + error.message); return }
    router.refresh()
  }

  // Wpisanie obecności jednym kliknięciem
  async function quickMark(id: string, attendance: AttendanceStatus) {
    setSavingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('lessons').update({ attendance }).eq('id', id)
    setSavingId(null)
    if (error) { alert('Nie udało się zapisać: ' + error.message); return }
    router.refresh()
  }

  return (
    <div className="space-y-8">
      {unmarked > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              {unmarked} {unmarked === 1 ? 'lekcja bez wpisanej obecności' : unmarked < 5 ? 'lekcje bez wpisanej obecności' : 'lekcji bez wpisanej obecności'}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Zaznacz obecność jednym kliknięciem przy lekcjach poniżej — dzięki temu rozliczenia i postępy uczniów są aktualne.</p>
          </div>
        </div>
      )}

      <Section title="Nadchodzące" rows={upcoming} onOpen={setEditing} onReschedule={setReschedule} onCancel={cancelLesson} onSubstitute={setSubstitute} emptyText="Brak nadchodzących lekcji." />
      <Section title="Minione lekcje" rows={past} onOpen={setEditing} onQuickMark={quickMark} savingId={savingId} emptyText="Brak minionych lekcji." />

      {editing && (
        <LessonEditor row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />
      )}
      {reschedule && (
        <RescheduleModal row={reschedule} teacherId={teacherId} onClose={() => setReschedule(null)} onSaved={() => { setReschedule(null); router.refresh() }} />
      )}
      {substitute && (
        <SubstitutionModal row={substitute} teacherId={teacherId} onClose={() => setSubstitute(null)} onSaved={() => { setSubstitute(null); router.refresh() }} />
      )}
    </div>
  )
}

function Section({ title, rows, onOpen, onReschedule, onCancel, onSubstitute, onQuickMark, savingId, emptyText }: {
  title: string; rows: Row[]; onOpen: (r: Row) => void
  onReschedule?: (r: Row) => void; onCancel?: (id: string) => void; onSubstitute?: (r: Row) => void
  onQuickMark?: (id: string, a: AttendanceStatus) => void; savingId?: string | null; emptyText: string
}) {
  return (
    <div>
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">{title}</h2>
      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center text-gray-400 text-sm">{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const att = ATT_CONFIG[r.attendance]
            const showQuick = onQuickMark && r.attendance === 'scheduled'
            return (
              <div key={r.id} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-[#23479E] transition-colors flex items-center gap-4">
                <button onClick={() => onOpen(r)} className="flex items-center gap-4 flex-1 min-w-0 text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] text-[#23479E] flex items-center justify-center flex-shrink-0">
                    {r.type === 'online' ? <Video size={18} /> : <MapPin size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{r.student}</p>
                    <p className="text-xs text-gray-500">{fmt(r.startsAt)} · {r.topic || 'Brak tematu'}</p>
                  </div>
                  {r.materials.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400"><BookOpen size={13} />{r.materials.length}</span>
                  )}
                  {!showQuick && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${att.color}`}>{att.label}</span>}
                </button>

                {showQuick && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => onQuickMark!(r.id, 'present')} disabled={savingId === r.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition-colors disabled:opacity-50">
                      <CheckCircle2 size={14} />Obecny
                    </button>
                    <button onClick={() => onQuickMark!(r.id, 'absent')} disabled={savingId === r.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-colors disabled:opacity-50">
                      <XCircle size={14} />Nieobecny
                    </button>
                  </div>
                )}

                {onReschedule && onCancel && (
                  <div className="flex items-center gap-2 flex-shrink-0 border-l border-gray-100 pl-3">
                    <button onClick={() => onReschedule(r)} className="text-xs text-[#23479E] hover:underline font-medium">Przełóż</button>
                    {onSubstitute && <button onClick={() => onSubstitute(r)} className="text-xs text-gray-500 hover:text-[#23479E]">Zastępstwo</button>}
                    <button onClick={() => onCancel(r.id)} className="text-xs text-gray-400 hover:text-red-500">Odwołaj</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RescheduleModal({ row, teacherId, onClose, onSaved }: { row: Row; teacherId: string; onClose: () => void; onSaved: () => void }) {
  const durationMs = new Date(row.endsAt).getTime() - new Date(row.startsAt).getTime()
  const [start, setStart] = useState(toLocalInput(row.startsAt))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true); setError(null)
    const newStart = new Date(start)
    const newEnd = new Date(newStart.getTime() + durationMs)
    const supabase = createClient()
    const { data: conflicts } = await supabase
      .from('lessons').select('id, starts_at, ends_at')
      .eq('teacher_id', teacherId).neq('id', row.id)
      .lt('starts_at', newEnd.toISOString()).gt('ends_at', newStart.toISOString())
    if (conflicts && conflicts.length > 0) { setSaving(false); setError('Masz już lekcję o tej porze.'); return }
    const { error } = await supabase.from('lessons')
      .update({ starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() }).eq('id', row.id)
    setSaving(false)
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><Calendar size={18} />Przełóż lekcję</h2>
            <p className="text-xs text-gray-400">{row.student}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nowa data i godzina</label>
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60">
            {saving ? 'Zapisywanie...' : 'Zapisz nowy termin'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SubstitutionModal({ row, teacherId, onClose, onSaved }: { row: Row; teacherId: string; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('substitutions').insert({
      lesson_id: row.id, original_teacher_id: teacherId, reason: reason || null, status: 'requested',
    })
    setSaving(false)
    if (error) { setError('Nie udało się wysłać: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">Poproś o zastępstwo</h2>
            <p className="text-xs text-gray-400">{row.student} · {fmt(row.startsAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Powód (opcjonalnie)</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="np. zwolnienie lekarskie"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E] resize-none" />
        <p className="text-xs text-gray-400 mt-2">Biuro przydzieli zastępstwo.</p>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60">
            {saving ? 'Wysyłanie...' : 'Poproś o zastępstwo'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ATT_OPTIONS: AttendanceStatus[] = ['scheduled', 'present', 'absent', 'excused']

function LessonEditor({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [attendance, setAttendance] = useState<AttendanceStatus>(row.attendance)
  const [topic, setTopic] = useState(row.topic)
  const [homework, setHomework] = useState(row.homework)
  const [meetingUrl, setMeetingUrl] = useState(row.meetingUrl)
  const [materials, setMaterials] = useState<Material[]>(row.materials)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addMaterial() {
    if (!newTitle.trim() || !newUrl.trim()) return
    setMaterials((m) => [...m, { id: `tmp-${Date.now()}`, title: newTitle.trim(), url: newUrl.trim() }])
    setNewTitle(''); setNewUrl('')
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(null)
    const supabase = createClient()
    const path = `${row.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const { error: upErr } = await supabase.storage.from('lesson-files').upload(path, file)
    if (upErr) { setUploading(false); setError('Nie udało się wgrać pliku: ' + upErr.message); return }
    const { data } = supabase.storage.from('lesson-files').getPublicUrl(path)
    setMaterials((m) => [...m, { id: `tmp-${Date.now()}`, title: file.name, url: data.publicUrl }])
    setUploading(false)
    e.target.value = ''
  }
  function removeMaterial(id: string) {
    setMaterials((m) => m.filter((x) => x.id !== id))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const supabase = createClient()

    const { error: lessonErr } = await supabase
      .from('lessons')
      .update({ attendance, topic: topic || null, homework: homework || null, meeting_url: meetingUrl || null })
      .eq('id', row.id)

    if (lessonErr) { setSaving(false); setError('Nie udało się zapisać: ' + lessonErr.message); return }

    // Synchronizuj materiały: usuń istniejące, dodaj aktualne (proste replace-all)
    await supabase.from('lesson_materials').delete().eq('lesson_id', row.id)
    if (materials.length > 0) {
      await supabase.from('lesson_materials').insert(
        materials.map((m) => ({ lesson_id: row.id, title: m.title, url: m.url }))
      )
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">{row.student}</h2>
            <p className="text-xs text-gray-400">{fmt(row.startsAt)} · {row.level}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Obecność</label>
            <div className="flex flex-wrap gap-2">
              {ATT_OPTIONS.map((a) => (
                <button key={a} type="button" onClick={() => setAttendance(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${attendance === a ? 'bg-[#23479E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {ATT_CONFIG[a].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temat lekcji</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="np. Present Perfect"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Praca domowa</label>
            <textarea value={homework} onChange={(e) => setHomework(e.target.value)} rows={2} placeholder="Co uczeń ma przygotować?"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E] resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link do lekcji online (Zoom / Meet)</label>
            <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/j/..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Materiały (Quizlet, Canva, PDF, nagrania...)</label>
            <div className="space-y-2 mb-2">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <BookOpen size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{m.title}</span>
                  <a href={m.url} target="_blank" rel="noreferrer" className="text-xs text-[#23479E] hover:underline truncate max-w-[120px]">{m.url}</a>
                  <button onClick={() => removeMaterial(m.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nazwa"
                className="w-1/3 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
              <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
              <button type="button" onClick={addMaterial}
                className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium flex items-center gap-1">
                <Plus size={14} />Dodaj
              </button>
            </div>
            <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#23479E] font-medium cursor-pointer hover:underline">
              <Plus size={13} />{uploading ? 'Wgrywanie…' : 'Wgraj plik (PDF, obraz…)'}
              <input type="file" className="hidden" onChange={uploadFile} disabled={uploading} />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-6">
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
            <Check size={16} />{saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50">Anuluj</button>
        </div>
      </div>
    </div>
  )
}
