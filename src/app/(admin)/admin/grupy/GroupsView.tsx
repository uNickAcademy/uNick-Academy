'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Trash2, UserPlus, UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LanguageLevel } from '@/types'

const LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const COLORS = ['#23479E', '#7c3aed', '#0891b2', '#db2777', '#16a34a', '#ea580c', '#9333ea', '#e11d48']

type Member = { id: string; name: string }
type GroupCard = {
  id: string
  name: string
  level: LanguageLevel
  color: string
  isActive: boolean
  teacherName: string
  members: Member[]
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
  const [managingMembers, setManagingMembers] = useState<GroupCard | null>(null)

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
            <div key={g.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="h-16 flex items-center px-5" style={{ backgroundColor: g.color }}>
                <h3 className="text-lg font-black text-white">{g.name}</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EAF3FF] text-[#23479E]">{g.level}</span>
                  <span className="text-xs text-gray-500">{g.teacherName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-3">
                  <UsersRound size={14} className="text-gray-400" />
                  {g.members.length} {g.members.length === 1 ? 'uczeń' : 'uczniów'}
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
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateGroupModal teacherOptions={teacherOptions} onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); router.refresh() }} />
      )}
      {managingMembers && (
        <MembersModal group={managingMembers} studentOptions={studentOptions}
          onClose={() => setManagingMembers(null)} onChanged={() => router.refresh()} />
      )}
    </div>
  )
}

function CreateGroupModal({ teacherOptions, onClose, onSaved }: {
  teacherOptions: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState(teacherOptions[0]?.id ?? '')
  const [level, setLevel] = useState<LanguageLevel>('A1')
  const [color, setColor] = useState(COLORS[0])
  const [capacity, setCapacity] = useState(6)
  const [scheduleText, setScheduleText] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!name.trim()) { setError('Podaj nazwę grupy.'); return }
    setSaving(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.from('groups').insert({
      name: name.trim(), teacher_id: teacherId || null, level, color,
      capacity, schedule_text: scheduleText.trim() || null,
      age_range: ageRange.trim() || null, description: description.trim() || null,
    })
    setSaving(false)
    if (error) { setError('Nie udało się utworzyć: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Nowa grupa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nazwa</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="np. B1 wtorki 18:00"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nauczyciel</label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Poziom</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as LanguageLevel)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#23479E]">
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Limit miejsc</label>
              <input type="number" min={1} max={30} value={capacity} onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Wiek (opc.)</label>
              <input type="text" value={ageRange} onChange={(e) => setAgeRange(e.target.value)} placeholder="np. 10–13 lat"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Harmonogram (opc.)</label>
            <input type="text" value={scheduleText} onChange={(e) => setScheduleText(e.target.value)} placeholder="np. Śr 18:20"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
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
            {saving ? 'Tworzenie...' : 'Utwórz grupę'}
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
