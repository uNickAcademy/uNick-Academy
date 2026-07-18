'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Trash2, UserPlus, UsersRound, Pencil, Monitor, MapPin, Clock, Flag, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LanguageLevel, LessonType } from '@/types'

const LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const COLORS = ['#23479E', '#7c3aed', '#0891b2', '#db2777', '#16a34a', '#ea580c', '#9333ea', '#e11d48']
const DAYS_PL = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

// Etykieta wieku z zakresu od/do (null = otwarta granica)
function ageLabel(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}–${max} lat`
  if (min != null) return `${min}+`
  if (max != null) return `do ${max} lat`
  return ''
}
// Pole "od"/"do": liczba lub "-"/pusto → null
function parseAge(v: string): number | null {
  const t = v.trim()
  if (t === '' || t === '-') return null
  const n = Number(t)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

type Member = { id: string; name: string }
type GroupCard = {
  id: string
  name: string
  level: LanguageLevel
  levels: LanguageLevel[]
  color: string
  isActive: boolean
  teacherId: string
  teacherName: string
  members: Member[]
  capacity: number
  scheduleText: string
  ageRange: string
  ageMin: number | null
  ageMax: number | null
  description: string
  format: LessonType | null
  pricePerMonth: number | null
  dayOfWeek: number | null
}

export function GroupsView({
  groups,
  teacherOptions,
  studentOptions,
}: {
  groups: GroupCard[]
  teacherOptions: { id: string; name: string }[]
  studentOptions: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<GroupCard | null>(null)
  const [managingMembers, setManagingMembers] = useState<GroupCard | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Zakończ kurs = ustaw grupę jako nieaktywną (znika z zapisów, uczniowie tego
  // kursu trafiają do "Nieaktywnych" w panelu Studenci). Historia zostaje.
  async function setActive(g: GroupCard, active: boolean) {
    if (!active && !confirm(`Zakończyć kurs „${g.name}”? Zniknie z publicznych zapisów, ale historia i lekcje zostaną. Można go później wznowić.`)) return
    setBusyId(g.id)
    const supabase = createClient()
    const { error } = await supabase.from('groups').update({ is_active: active }).eq('id', g.id)
    setBusyId(null)
    if (error) { alert('Nie udało się zmienić statusu: ' + error.message); return }
    router.refresh()
  }

  // Trwałe usunięcie — nieodwracalne. Najpierw czyścimy członków; jeśli grupa ma
  // historię lekcji, baza zablokuje usunięcie i proponujemy zakończenie kursu.
  async function deleteGroup(g: GroupCard) {
    if (!confirm(`Usunąć grupę „${g.name}” NA STAŁE? Tej operacji NIE MOŻNA cofnąć.\n\nJeśli chcesz tylko przestać przyjmować zapisy, użyj „Zakończ kurs”.`)) return
    setBusyId(g.id)
    const supabase = createClient()
    await supabase.from('group_members').delete().eq('group_id', g.id)
    const { error } = await supabase.from('groups').delete().eq('id', g.id)
    setBusyId(null)
    if (error) {
      alert('Nie udało się usunąć grupy (prawdopodobnie ma powiązane lekcje). Zamiast usuwać, użyj „Zakończ kurs”.\n\nSzczegóły: ' + error.message)
      return
    }
    router.refresh()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Grupy</h1>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> Nowa grupa
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400 text-sm">
          Brak grup. Utwórz pierwszą grupę, aby planować lekcje grupowe.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((g) => (
            <div key={g.id} className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${!g.isActive ? 'opacity-70' : ''}`}>
              <div className="h-16 flex items-center justify-between px-5" style={{ backgroundColor: g.color }}>
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-white truncate">{g.name}</h3>
                  {!g.isActive && <span className="text-[10px] font-bold uppercase tracking-wide text-white/80">Kurs zakończony</span>}
                </div>
                <button onClick={() => setEditing(g)} className="text-white/80 hover:text-white flex-shrink-0 ml-2">
                  <Pencil size={16} />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {(g.levels?.length ? g.levels : [g.level]).map((lv) => (
                    <span key={lv} className="text-xs font-bold px-2 py-0.5 rounded bg-[#EAF3FF] text-[#23479E]">{lv}</span>
                  ))}
                  {ageLabel(g.ageMin, g.ageMax) && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{ageLabel(g.ageMin, g.ageMax)}</span>}
                  <span className="text-xs text-gray-500">{g.teacherName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                  {g.format && (
                    <span className="flex items-center gap-1">
                      {g.format === 'online' ? <Monitor size={12} /> : <MapPin size={12} />}
                      {g.format === 'online' ? 'Online' : 'Stacjonarnie'}
                    </span>
                  )}
                  {(g.dayOfWeek != null || g.scheduleText) && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {g.dayOfWeek != null ? DAYS_PL[g.dayOfWeek] : ''}{g.dayOfWeek != null && g.scheduleText ? ' · ' : ''}{g.scheduleText}
                    </span>
                  )}
                </div>
                {g.pricePerMonth != null && (
                  <p className="text-sm font-bold text-[#23479E] mb-3">{g.pricePerMonth} zł / mies.</p>
                )}
                <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-3">
                  <UsersRound size={14} className="text-gray-400" />
                  {g.members.length} / {g.capacity} {g.members.length === 1 ? 'uczeń' : 'uczniów'}
                </div>
                {g.members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {g.members.map((m) => (
                      <span key={m.id} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-lg">{m.name}</span>
                    ))}
                  </div>
                )}
                <button onClick={() => setManagingMembers(g)}
                  className="w-full py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Zarządzaj członkami
                </button>
                <div className="flex items-center gap-2 mt-2">
                  {g.isActive ? (
                    <button onClick={() => setActive(g, false)} disabled={busyId === g.id}
                      className="flex-1 py-2 rounded-xl border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                      <Flag size={13} />Zakończ kurs
                    </button>
                  ) : (
                    <button onClick={() => setActive(g, true)} disabled={busyId === g.id}
                      className="flex-1 py-2 rounded-xl border border-green-200 text-xs font-semibold text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                      <RotateCcw size={13} />Wznów kurs
                    </button>
                  )}
                  <button onClick={() => deleteGroup(g)} disabled={busyId === g.id} title="Usuń grupę na stałe"
                    className="py-2 px-3 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                    <Trash2 size={13} />Usuń
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <GroupFormModal teacherOptions={teacherOptions} onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); router.refresh() }} />
      )}
      {editing && (
        <GroupFormModal teacherOptions={teacherOptions} group={editing} onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh() }} />
      )}
      {managingMembers && (
        <MembersModal group={managingMembers} studentOptions={studentOptions}
          onClose={() => setManagingMembers(null)} onChanged={() => router.refresh()} />
      )}
    </div>
  )
}

function GroupFormModal({ teacherOptions, group, onClose, onSaved }: {
  teacherOptions: { id: string; name: string }[]
  group?: GroupCard
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!group
  const [name, setName] = useState(group?.name ?? '')
  const [teacherId, setTeacherId] = useState(group?.teacherId || teacherOptions[0]?.id || '')
  const [levels, setLevels] = useState<LanguageLevel[]>(group?.levels?.length ? group.levels : (group?.level ? [group.level] : ['A1']))
  const [color, setColor] = useState(group?.color ?? COLORS[0])
  const [capacity, setCapacity] = useState(group?.capacity ?? 6)
  const [format, setFormat] = useState<LessonType | ''>(group?.format ?? '')
  const [pricePerMonth, setPricePerMonth] = useState(group?.pricePerMonth != null ? String(group.pricePerMonth) : '')
  const [dayOfWeek, setDayOfWeek] = useState(group?.dayOfWeek != null ? String(group.dayOfWeek) : '')
  const [scheduleText, setScheduleText] = useState(group?.scheduleText ?? '')
  const [ageFrom, setAgeFrom] = useState(group?.ageMin != null ? String(group.ageMin) : '')
  const [ageTo, setAgeTo] = useState(group?.ageMax != null ? String(group.ageMax) : '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleLevel(l: LanguageLevel) {
    setLevels((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l])
  }

  async function save() {
    if (!name.trim()) { setError('Podaj nazwę grupy.'); return }
    if (levels.length === 0) { setError('Wybierz przynajmniej jeden poziom.'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    // Poziomy w kolejności A1→C2; level (pojedynczy, NOT NULL) = pierwszy z nich
    const orderedLevels = LEVELS.filter((l) => levels.includes(l))
    const ageMin = parseAge(ageFrom)
    const ageMax = parseAge(ageTo)
    const payload = {
      name: name.trim(), teacher_id: teacherId || null,
      level: orderedLevels[0], levels: orderedLevels, color,
      capacity, schedule_text: scheduleText.trim() || null,
      age_min: ageMin, age_max: ageMax, age_range: ageLabel(ageMin, ageMax) || null,
      description: description.trim() || null,
      format: format || null,
      price_per_month: pricePerMonth === '' ? null : Number(pricePerMonth),
      day_of_week: dayOfWeek === '' ? null : Number(dayOfWeek),
    }
    const { error } = isEdit
      ? await supabase.from('groups').update(payload).eq('id', group!.id)
      : await supabase.from('groups').insert(payload)
    setSaving(false)
    if (error) { setError(`Nie udało się ${isEdit ? 'zapisać' : 'utworzyć'}: ` + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">{isEdit ? 'Edytuj grupę' : 'Nowa grupa'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nazwa</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="np. B1 wtorki 18:00"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nauczyciel</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
              {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Poziom (możesz wybrać kilka)</label>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <button key={l} type="button" onClick={() => toggleLevel(l)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${levels.includes(l) ? 'bg-[#23479E] text-white border-[#23479E]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#23479E]'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Forma zajęć</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as LessonType | '')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                <option value="">— wybierz —</option>
                <option value="offline">Stacjonarnie</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Wiek (od – do, „-” = bez granicy)</label>
              <div className="flex items-center gap-2">
                <input type="text" inputMode="numeric" value={ageFrom} onChange={(e) => setAgeFrom(e.target.value)} placeholder="od"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-[#23479E]" />
                <span className="text-gray-400">–</span>
                <input type="text" inputMode="numeric" value={ageTo} onChange={(e) => setAgeTo(e.target.value)} placeholder="do"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-center focus:outline-none focus:border-[#23479E]" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Limit miejsc</label>
              <input type="number" min={1} max={30} value={capacity} onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cena (zł/mies., opc.)</label>
              <input type="number" min={0} step="1" value={pricePerMonth} onChange={(e) => setPricePerMonth(e.target.value)} placeholder="np. 320"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dzień tygodnia (do filtrów)</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                <option value="">— wybierz —</option>
                {DAYS_PL.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Godzina / opis terminu</label>
              <input type="text" value={scheduleText} onChange={(e) => setScheduleText(e.target.value)} placeholder="np. 18:00"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Opis (opc.)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Krótki opis widoczny przy zapisie"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Kolor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Anuluj</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Utwórz grupę'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MembersModal({ group, studentOptions, onClose, onChanged }: {
  group: GroupCard
  studentOptions: { id: string; name: string }[]
  onClose: () => void
  onChanged: () => void
}) {
  const [members, setMembers] = useState<Member[]>(group.members)
  const [toAdd, setToAdd] = useState('')
  const [error, setError] = useState<string | null>(null)

  const available = studentOptions.filter((s) => !members.some((m) => m.id === s.id))

  async function addMember() {
    if (!toAdd) return
    const student = studentOptions.find((s) => s.id === toAdd)
    if (!student) return
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('group_members').insert({ group_id: group.id, student_id: toAdd })
    if (error) { setError('Nie udało się dodać: ' + error.message); return }
    setMembers((m) => [...m, { id: student.id, name: student.name }])
    setToAdd('')
    onChanged()
  }

  async function removeMember(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('group_members').delete().eq('group_id', group.id).eq('student_id', id)
    if (error) { setError('Nie udało się usunąć: ' + error.message); return }
    setMembers((m) => m.filter((x) => x.id !== id))
    onChanged()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Członkowie · {group.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">Brak członków.</p>
          ) : members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-700 flex-1">{m.name}</span>
              <button onClick={() => removeMember(m.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        <div className="flex gap-2 border-t border-gray-100 pt-4">
          <select value={toAdd} onChange={(e) => setToAdd(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
            <option value="">Wybierz ucznia...</option>
            {available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={addMember} disabled={!toAdd}
            className="px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5">
            <UserPlus size={15} />Dodaj
          </button>
        </div>
      </div>
    </div>
  )
}
