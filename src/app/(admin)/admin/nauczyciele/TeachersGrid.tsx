'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Users, BookOpen, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Card = {
  id: string
  name: string
  email: string
  color: string
  rating: number
  isActive: boolean
  hourlyRate: number | null
  rateGroup: number | null
  location: string
  students: number
  lessonsWeek: number
  lessonsTotal: number
}

export function TeachersGrid({ cards }: { cards: Card[] }) {
  const [editing, setEditing] = useState<Card | null>(null)
  const router = useRouter()

  const active = cards.filter((c) => c.isActive)
  const inactive = cards.filter((c) => !c.isActive)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Nauczyciele</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {active.map((t) => <TeacherCard key={t.id} t={t} onEdit={() => setEditing(t)} />)}
      </div>

      {inactive.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mt-10 mb-4">Nieaktywni</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-60">
            {inactive.map((t) => <TeacherCard key={t.id} t={t} onEdit={() => setEditing(t)} />)}
          </div>
        </>
      )}

      {editing && (
        <EditModal t={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh() }} />
      )}
    </div>
  )
}

function TeacherCard({ t, onEdit }: { t: Card; onEdit: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="h-24 flex items-center justify-center" style={{ backgroundColor: t.color }}>
        <span className="text-5xl font-black text-white/80">{t.name[0]}</span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-black text-gray-900">{t.name}</h3>
            <p className="text-sm text-gray-400">
              {t.hourlyRate != null ? `${t.hourlyRate} zł/h` : 'brak stawki'}
              {t.location ? ` · ${t.location}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
            <Star size={14} className="fill-amber-400" />
            {t.rating}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 my-4">
          <Stat icon={Users} value={t.students} label="studentów" color="text-[#23479E]" />
          <Stat icon={BookOpen} value={t.lessonsWeek} label="lekcji/tyg." color="text-[#23479E]" />
          <Stat icon={BookOpen} value={t.lessonsTotal} label="łącznie" color="text-green-600" />
        </div>

        <button onClick={onEdit}
          className="mt-1 w-full py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Zarządzaj
        </button>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, value, label, color }: { icon: typeof Users; value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center gap-1 mb-1 ${color}`}><Icon size={14} /></div>
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}

function EditModal({ t, onClose, onSaved }: { t: Card; onClose: () => void; onSaved: () => void }) {
  const [hourlyRate, setHourlyRate] = useState(t.hourlyRate != null ? String(t.hourlyRate) : '')
  const [rateGroup, setRateGroup] = useState(t.rateGroup != null ? String(t.rateGroup) : '')
  const [location, setLocation] = useState(t.location)
  const [isActive, setIsActive] = useState(t.isActive)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('teachers')
      .update({
        hourly_rate: hourlyRate === '' ? null : Number(hourlyRate),
        rate_group: rateGroup === '' ? null : Number(rateGroup),
        location: location || null,
        is_active: isActive,
      })
      .eq('id', t.id)
    setSaving(false)
    if (error) { setError('Nie udało się zapisać: ' + error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">{t.name}</h2>
            <p className="text-xs text-gray-400">{t.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stawka indyw. (zł/h)</label>
              <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="np. 80"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stawka grupowa (zł/h)</label>
              <input type="number" value={rateGroup} onChange={(e) => setRateGroup(e.target.value)} placeholder="opc."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokalizacja</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="np. Tarnowo Podgórne / Online"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#23479E]" />
            <span className="text-sm font-medium text-gray-700">Aktywny (widoczny dla uczniów i w grafiku)</span>
          </label>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-6">
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50">
            Anuluj
          </button>
        </div>
      </div>
    </div>
  )
}
