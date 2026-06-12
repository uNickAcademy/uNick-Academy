import { Star, Mail } from 'lucide-react'
import { getAllTeachers, getTeacherAvailability } from '@/lib/supabase/queries'

const DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz']

function formatTime(time: string) {
  return time.slice(0, 5)
}

export default async function NauczycielePage() {
  const teachers = await getAllTeachers()
  const availabilityByTeacher = await Promise.all(
    teachers.map((t) => getTeacherAvailability(t.id))
  )

  return (
    <div className="py-16 px-4 bg-[#FFF8F0]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-gray-900">Nasi nauczyciele</h1>
          <p className="text-gray-500 mt-2">Poznaj zespół uNick Academy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher, i) => {
            const availability = availabilityByTeacher[i]

            return (
              <div key={teacher.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="h-24 flex items-center justify-center" style={{ backgroundColor: teacher.color }}>
                  <span className="text-5xl font-black text-white/80">
                    {teacher.profile?.full_name?.[0] ?? '?'}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-black text-gray-900">{teacher.profile?.full_name}</h3>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                      <Star size={14} className="fill-amber-400" />
                      {teacher.rating}
                    </div>
                  </div>

                  {teacher.levels?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {teacher.levels.map((level) => (
                        <span key={level} className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#EAF3FF] text-[#23479E]">
                          {level}
                        </span>
                      ))}
                    </div>
                  )}

                  {teacher.bio && (
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{teacher.bio}</p>
                  )}

                  {teacher.contact_email && (
                    <a
                      href={`mailto:${teacher.contact_email}`}
                      className="flex items-center gap-2 text-sm text-[#23479E] font-medium hover:underline mb-4"
                    >
                      <Mail size={14} />
                      {teacher.contact_email}
                    </a>
                  )}

                  {availability.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Dostępność</p>
                      <div className="space-y-1">
                        {availability.map((slot) => (
                          <div key={slot.id} className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                            {DAYS[slot.day_of_week]} {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
