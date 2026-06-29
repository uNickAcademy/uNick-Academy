'use client'

import { useState } from 'react'
import { List, Calendar as CalendarIcon, Video, MapPin } from 'lucide-react'
import type { Student, Lesson } from '@/types'

// 30-minute slots from 8:00 to 21:30
const SLOTS = Array.from({ length: 28 }, (_, i) => ({
  hour: 8 + Math.floor(i / 2),
  minute: (i % 2) * 30,
}))

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-50 text-green-600',
  A2: 'bg-green-50 text-green-600',
  B1: 'bg-amber-50 text-amber-600',
  B2: 'bg-amber-50 text-amber-600',
  C1: 'bg-violet-50 text-violet-600',
  C2: 'bg-violet-50 text-violet-600',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trial: 'Trial',
  overdue: 'Overdue',
  paused: 'Paused',
}

export function StudentsView({ students, lessons }: { students: Student[]; lessons: Lesson[] }) {
  const [view, setView] = useState<'list' | 'calendar'>('list')

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)
    return d
  })

  const lessonsForCell = (date: Date, hour: number, minute: number) =>
    lessons.filter((l) => {
      const start = new Date(l.starts_at)
      return (
        start.getFullYear() === date.getFullYear() &&
        start.getMonth() === date.getMonth() &&
        start.getDate() === date.getDate() &&
        start.getHours() === hour &&
        start.getMinutes() === minute
      )
    })

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === 'list' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <List size={15} />
          List
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === 'calendar' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <CalendarIcon size={15} />
          Calendar
        </button>
      </div>

      {view === 'list' ? (
        students.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-gray-400 text-sm">
            You don&apos;t have any assigned students yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => {
              const nextLesson = lessons
                .filter((l) => l.student_id === student.id)
                .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0]

              return (
                <div key={student.id} className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{student.full_name ?? student.profile?.full_name}</h3>
                      <p className="text-xs text-gray-400">{student.profile?.email}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${LEVEL_COLORS[student.level] ?? 'bg-gray-50 text-gray-600'}`}>
                      {student.level}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-gray-500">Status:</span>
                    <span className="text-xs font-semibold text-gray-700">{STATUS_LABELS[student.status] ?? student.status}</span>
                  </div>

                  {nextLesson ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      {nextLesson.type === 'online' ? <Video size={16} className="text-[#23479E]" /> : <MapPin size={16} className="text-[#23479E]" />}
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {new Date(nextLesson.starts_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(nextLesson.starts_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-500">{nextLesson.topic || 'Lesson'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No lessons scheduled in the next 14 days.</p>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <div className="grid min-w-max" style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
            <div className="border-b border-gray-100" />
            {days.map((d) => (
              <div key={d.toISOString()} className="border-b border-gray-100 border-l border-gray-50 px-3 py-2 text-center">
                <p className="text-xs font-medium text-gray-400">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                <p className="text-sm font-bold text-gray-900">{d.getDate()}</p>
              </div>
            ))}

            {SLOTS.map((slot, slotIdx) => (
              <div key={`row-${slotIdx}`} className="contents">
                <div className="border-b border-gray-50 px-2 py-1 text-xs text-gray-400 font-medium text-right leading-none">
                  {slot.minute === 0 ? `${slot.hour}:00` : ''}
                </div>
                {days.map((d) => {
                  const cellLessons = lessonsForCell(d, slot.hour, slot.minute)
                  return (
                    <div key={`${d.toISOString()}-${slotIdx}`} className="border-b border-gray-50 border-l border-gray-50 relative h-7">
                      {cellLessons.map((l) => (
                        <div
                          key={l.id}
                          className="absolute inset-0.5 rounded-lg px-2 py-1 bg-[#23479E] overflow-hidden"
                          title={l.topic || 'Lesson'}
                        >
                          <p className="text-white text-xs font-bold leading-tight truncate">{l.student?.full_name ?? l.student?.profile?.full_name}</p>
                          <p className="text-white/75 text-xs truncate">{l.topic || 'Lesson'}</p>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
