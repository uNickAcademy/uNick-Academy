import Link from 'next/link'
import { Users, Calendar, Clock, User as UserIcon, AlertCircle, BookOpen, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTeacherByProfileId, getTeacherStudents, getTeacherLessons } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const teacher = await getTeacherByProfileId(user.id)
  if (!teacher) return null

  const now = new Date()
  const from30 = new Date(now.getTime() - 30 * 86400000).toISOString()
  const [students, upcomingLessons, recentLessons] = await Promise.all([
    getTeacherStudents(teacher.id),
    getTeacherLessons(teacher.id, now.toISOString()),
    getTeacherLessons(teacher.id, from30, now.toISOString()),
  ])

  const nextLessons = upcomingLessons.slice(0, 5)
  const unmarked = recentLessons.filter((l) => (l.attendance ?? 'scheduled') === 'scheduled').length
  const firstName = teacher.profile?.full_name?.split(' ')[0] ?? 'Lektorze'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">
          Cześć, {firstName}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Masz {nextLessons.length} {nextLessons.length === 1 ? 'nadchodzącą lekcję' : 'nadchodzących lekcji'}</p>
      </div>

      {unmarked > 0 && (
        <Link href="/nauczyciel/dziennik" className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 hover:bg-amber-100 transition-colors">
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              {unmarked} {unmarked === 1 ? 'lekcja bez wpisanej obecności' : unmarked < 5 ? 'lekcje bez wpisanej obecności' : 'lekcji bez wpisanej obecności'}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Kliknij, aby wpisać obecność jednym dotknięciem w dzienniku →</p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Uczniowie" value={`${students.length}`} />
        <StatCard icon={Calendar} label="Nadchodzące lekcje" value={`${nextLessons.length}`} />
        <StatCard icon={Clock} label="Lekcje (30 dni)" value={`${recentLessons.length}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Nadchodzące lekcje</h3>
            <Link href="/nauczyciel/dziennik" className="text-xs text-[#23479E] font-medium hover:underline">Dziennik</Link>
          </div>
          {nextLessons.length === 0 ? (
            <p className="text-sm text-gray-400">Brak zaplanowanych lekcji.</p>
          ) : (
            <div className="space-y-3">
              {nextLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex flex-col items-center justify-center text-[#23479E] flex-shrink-0">
                    <span className="text-xs font-bold leading-none">
                      {new Date(lesson.starts_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{lesson.topic || 'Lekcja'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(lesson.starts_at).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })}
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
          <h3 className="font-bold text-gray-900 mb-4">Skróty</h3>
          <div className="space-y-2">
            <Link href="/nauczyciel/dziennik" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#EAF3FF] transition-colors">
              <BookOpen size={18} className="text-[#23479E]" />
              <span className="text-sm font-medium text-gray-700">Dziennik i obecności</span>
            </Link>
            <Link href="/nauczyciel/zarobki" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#EAF3FF] transition-colors">
              <Wallet size={18} className="text-[#23479E]" />
              <span className="text-sm font-medium text-gray-700">Moje zarobki</span>
            </Link>
            <Link href="/nauczyciel/profil" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#EAF3FF] transition-colors">
              <UserIcon size={18} className="text-[#23479E]" />
              <span className="text-sm font-medium text-gray-700">Edytuj profil i kontakt</span>
            </Link>
            <Link href="/nauczyciel/dostepnosc" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#EAF3FF] transition-colors">
              <Calendar size={18} className="text-[#23479E]" />
              <span className="text-sm font-medium text-gray-700">Ustaw dostępność</span>
            </Link>
            <Link href="/nauczyciel/uczniowie" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#EAF3FF] transition-colors">
              <Users size={18} className="text-[#23479E]" />
              <span className="text-sm font-medium text-gray-700">Moi uczniowie</span>
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
