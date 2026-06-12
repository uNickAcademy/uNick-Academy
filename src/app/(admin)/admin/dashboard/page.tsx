import Link from 'next/link'
import { Users, BookOpen, DollarSign, AlertTriangle, UserX } from 'lucide-react'
import {
  getAdminStats, getOverdueReport, getAllLessons,
  getAllTeachersAdmin, getTeacherStatsMap, getChurnRisk,
} from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const [stats, overdue, todayLessons, teachers, teacherStats, churn] = await Promise.all([
    getAdminStats(),
    getOverdueReport(),
    getAllLessons(todayStart.toISOString(), todayEnd.toISOString()),
    getAllTeachersAdmin(),
    getTeacherStatsMap(),
    getChurnRisk(),
  ])

  const activeTeachers = teachers.filter((t) => t.is_active)

  const STATS = [
    { label: 'Aktywni studenci', value: String(stats.activeStudents), change: 'status „aktywny"', icon: Users, color: 'violet' },
    { label: 'Lekcje w tym tygodniu', value: String(stats.lessonsThisWeek), change: `${activeTeachers.length} nauczycieli`, icon: BookOpen, color: 'cyan' },
    { label: 'Przychód (ten miesiąc)', value: `${stats.monthlyRevenue.toLocaleString('pl-PL')} zł`, change: 'wpłaty', icon: DollarSign, color: 'green' },
    { label: 'Zaległości', value: `${overdue.students.filter((s) => s.balance < 0).length} studentów`, change: `${overdue.total.toLocaleString('pl-PL')} zł łącznie`, icon: AlertTriangle, color: 'amber' },
  ]

  const colors: Record<string, string> = {
    violet: 'bg-blue-100 text-[#23479E]',
    cyan: 'bg-cyan-100 text-[#23479E]',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl ${colors[stat.color]} flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Lekcje dziś</h2>
          {todayLessons.length === 0 ? (
            <p className="text-sm text-gray-400">Brak lekcji zaplanowanych na dziś.</p>
          ) : (
            <div className="space-y-3">
              {todayLessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-[#23479E] font-bold text-sm flex-shrink-0">
                    {new Date(lesson.starts_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{lesson.student?.profile?.full_name}</p>
                    <p className="text-xs text-gray-500">{lesson.topic || 'Lekcja'} · {lesson.teacher?.profile?.full_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lesson.type === 'online' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {lesson.type === 'online' ? 'online' : 'offline'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Nauczyciele</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeTeachers.map((t) => {
              const s = teacherStats[t.id] ?? { students: 0, lessonsWeek: 0 }
              return (
                <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: t.color }}>
                    {t.profile?.full_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{t.profile?.full_name}</p>
                    <p className="text-xs text-gray-500">{s.students} studentów · {s.lessonsWeek} lekcji/tyg.</p>
                  </div>
                  <span className="text-sm font-bold text-amber-600">★ {t.rating}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 mt-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><UserX size={18} className="text-red-500" />Zagrożeni rezygnacją (3+ nieobecności z rzędu)</h2>
        {churn.length === 0 ? (
          <p className="text-sm text-gray-400">Brak uczniów zagrożonych rezygnacją 🎉</p>
        ) : (
          <div className="space-y-2">
            {churn.map((c) => (
              <Link key={c.id} href={`/admin/studenci/${c.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors">
                <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                <span className="text-xs font-bold text-red-600">{c.consecutiveAbsences} nieobecności z rzędu</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
