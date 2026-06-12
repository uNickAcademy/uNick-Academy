'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Availability } from '@/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// 30-minute slots from 8:00 to 21:30
const SLOTS = Array.from({ length: 28 }, (_, i) => ({
  hour: 8 + Math.floor(i / 2),
  minute: (i % 2) * 30,
}))

function timeToSlotIndex(time: string) {
  const [h, m] = time.split(':').map(Number)
  return (h - 8) * 2 + (m >= 30 ? 1 : 0)
}

function slotIndexToTime(index: number) {
  const hour = 8 + Math.floor(index / 2)
  const minute = (index % 2) * 30
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
}

function toCellKey(day: number, slot: number) {
  return `${day}-${slot}`
}

function availabilityToCells(availability: Availability[]): Set<string> {
  const cells = new Set<string>()
  for (const slot of availability) {
    const startSlot = timeToSlotIndex(slot.start_time)
    const endSlot = timeToSlotIndex(slot.end_time)
    for (let s = startSlot; s < endSlot; s++) {
      cells.add(toCellKey(slot.day_of_week, s))
    }
  }
  return cells
}

function cellsToAvailability(cells: Set<string>): Omit<Availability, 'id' | 'teacher_id'>[] {
  const result: Omit<Availability, 'id' | 'teacher_id'>[] = []

  for (let day = 0; day < 7; day++) {
    const slots = SLOTS.map((_, i) => i).filter((s) => cells.has(toCellKey(day, s)))
    let rangeStart: number | null = null
    let prev: number | null = null

    for (const s of slots) {
      if (rangeStart === null) {
        rangeStart = s
      } else if (prev !== null && s !== prev + 1) {
        result.push({
          day_of_week: day,
          start_time: slotIndexToTime(rangeStart),
          end_time: slotIndexToTime(prev + 1),
          is_active: true,
        })
        rangeStart = s
      }
      prev = s
    }

    if (rangeStart !== null && prev !== null) {
      result.push({
        day_of_week: day,
        start_time: slotIndexToTime(rangeStart),
        end_time: slotIndexToTime(prev + 1),
        is_active: true,
      })
    }
  }

  return result
}

export function AvailabilityGrid({
  teacherId,
  initialAvailability,
}: {
  teacherId: string
  initialAvailability: Availability[]
}) {
  const [cells, setCells] = useState<Set<string>>(() => availabilityToCells(initialAvailability))
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  function toggleCell(day: number, slot: number) {
    const key = toCellKey(day, slot)
    setCells((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setSavedMsg(null)
  }

  async function handleSave() {
    setSaving(true)
    setSavedMsg(null)

    const slots = cellsToAvailability(cells)
    const supabase = createClient()

    await supabase.from('availability').delete().eq('teacher_id', teacherId)
    if (slots.length > 0) {
      await supabase.from('availability').insert(slots.map((s) => ({ ...s, teacher_id: teacherId })))
    }

    setSaving(false)
    setSavedMsg('Saved!')
  }

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <div className="grid min-w-max" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="border-b border-gray-100" />
          {DAYS.map((day) => (
            <div key={day} className="border-b border-gray-100 border-l border-gray-50 px-3 py-2 text-center">
              <p className="text-sm font-bold text-gray-900">{day}</p>
            </div>
          ))}

          {SLOTS.map((slot, slotIdx) => (
            <div key={`row-${slotIdx}`} className="contents">
              <div className="border-b border-gray-50 px-2 py-1 text-xs text-gray-400 font-medium text-right leading-none">
                {slot.minute === 0 ? `${slot.hour}:00` : ''}
              </div>
              {DAYS.map((_, dayIdx) => {
                const active = cells.has(toCellKey(dayIdx, slotIdx))
                return (
                  <button
                    key={`${dayIdx}-${slotIdx}`}
                    type="button"
                    onClick={() => toggleCell(dayIdx, slotIdx)}
                    className={`border-b border-gray-50 border-l border-gray-50 h-6 transition-colors ${
                      active ? 'bg-[#23479E] hover:bg-[#1c3a82]' : 'hover:bg-[#EAF3FF]'
                    }`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save availability'}
        </button>
        {savedMsg && <span className="text-sm text-gray-500">{savedMsg}</span>}
      </div>
    </div>
  )
}
