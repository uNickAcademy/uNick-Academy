import Link from 'next/link'
import { Users, Calendar, Clock, User as UserIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTeacherByProfileId, getTeacherStudents, getTeacherLessons } from '@/lib/supabase/queries'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const teacher = await getTeacherByProfileId(user.id)
  if (!teacher) return null

  const [students, upcomingLessons] = await Promise.all([
    getTeacherStudents(teacher.id),
    getTeacherLessons(teacher.id, new Date().toISOString()),
  ])

  const nextLessons = upcomingLessons.slice(0, 5)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">
          Welcome, {teacher.profile?.full_name?.split(' ')[0] ?? 'Teacher'}! 👋
        </h1>
        <p className="text-gray-500 mt-1">You have {nextLessons.length} upcoming lessons</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Students" value={`${students.length}`} />
        <StatCard icon={Calendar} label="Upcoming lessons" value={`${nextLessons.length}`} />
        <StatCard icon={Clock} label="Total lessons" value={`${upcomingLessons.length}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Upcoming lessons</h3>
            <Link href="/nauczyciel/uczniowie" className="text-xs text-[#23479E] font-medium hover:underline">View all</Link>
          </div>
          {nextLessons.length === 0 ? (
            <p className="text-sm text-gray-400">No lessons scheduled.</p>
          ) : (
            <div className="space-y-3">
              {nextLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex flex-col items-center justify-center text-[#23479E] flex-shrink-0">
                    <span className="text-xs font-bold leading-none">
                      {new Date(lesson.starts_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{lesson.topic || 'Lesson'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(lesson.starts_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}
                      {lesson.student?.full_name ?? lesson.student?.profile?.full_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Shortcuts</h3>
          <div className="space-y-2">
            <Link href="/nauczyciel/profil" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#EAF3FF] transition-colors">
              <UserIcon size={18} className="text-[#23479E]" />
              <span className="text-sm font-medium text-gray-700">Edit profile and contact</span>
            </Link>
            <Link href="/nauczyciel/dostepnosc" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#EAF3FF] transition-colors">
              <Calendar size={18} className="text-[#23479E]" />
              <span className="text-sm font-medium text-gray-700">Set availability</span>
            </Link>
            <Link href="/nauczyciel/uczniowie" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#EAF3FF] transition-colors">
              <Users size={18} className="text-[#23479E]" />
              <span className="text-sm font-medium text-gray-700">View students</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="w-10 h-10 rounded-xl bg-[#EAF3FF] text-[#23479E] flex items-center justify-center mb-3">
        <Icon size={18} />
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  )
}
