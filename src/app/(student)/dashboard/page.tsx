import Link from 'next/link'
import { Calendar, Clock, TrendingUp, Gift, CreditCard, Copy, Video } from 'lucide-react'

// Dane mockowe – zastąpione Supabase po podpięciu
const STUDENT = {
  name: 'Kasia Wiśniewska',
  level: 'B2',
  totalHours: 24,
  credits: 100,
  referralCode: 'KASIA8F2A',
  nextLesson: {
    date: 'Poniedziałek, 16 czerwca',
    time: '18:00',
    teacher: 'Milly',
    type: 'Online',
    link: 'https://meet.google.com/abc-defg-hij',
  },
  upcomingLessons: [
    { date: 'Pon 16 cze', time: '18:00', teacher: 'Milly', topic: 'Business English' },
    { date: 'Śr 18 cze', time: '17:00', teacher: 'Milly', topic: 'Prezentacje w pracy' },
    { date: 'Pon 23 cze', time: '18:00', teacher: 'Milly', topic: 'Negocjacje' },
  ],
}

export default function StudentDashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Witaj, {STUDENT.name.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">Masz {STUDENT.upcomingLessons.length} nadchodzące lekcje</p>
      </div>

      {/* Następna lekcja – wyróżniona */}
      <div className="gradient-primary rounded-2xl p-6 text-white mb-6">
        <p className="text-white/70 text-sm font-medium mb-1">Następna lekcja</p>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black">{STUDENT.nextLesson.date}</h2>
            <p className="text-white/80 mt-1">
              {STUDENT.nextLesson.time} · z {STUDENT.nextLesson.teacher} · {STUDENT.nextLesson.type}
            </p>
          </div>
          <a
            href={STUDENT.nextLesson.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-semibold"
          >
            <Video size={16} />
            Dołącz
          </a>
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Clock} label="Łączne godziny" value={`${STUDENT.totalHours}h`} color="violet" />
        <StatCard icon={TrendingUp} label="Aktualny poziom" value={STUDENT.level} color="cyan" />
        <StatCard icon={Gift} label="Kredyty" value={`${STUDENT.credits} zł`} color="amber" />
        <StatCard icon={Calendar} label="Zaplanowane" value={`${STUDENT.upcomingLessons.length} lekcje`} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nadchodzące lekcje */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Nadchodzące lekcje</h3>
            <Link href="/lekcje" className="text-xs text-[#23479E] font-medium hover:underline">Zobacz wszystkie</Link>
          </div>
          <div className="space-y-3">
            {STUDENT.upcomingLessons.map((lesson, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex flex-col items-center justify-center text-[#23479E] flex-shrink-0">
                  <span className="text-xs font-bold leading-none">{lesson.time}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{lesson.topic}</p>
                  <p className="text-xs text-gray-500">{lesson.date} · {lesson.teacher}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Polecenia */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Twój kod polecenia</h3>
            <Link href="/polecenia" className="text-xs text-[#23479E] font-medium hover:underline">Szczegóły</Link>
          </div>
          <div className="bg-[#EAF3FF] rounded-xl p-4 mb-4">
            <p className="text-xs text-[#23479E] font-medium mb-2">Kod do udostępnienia</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black font-mono text-[#23479E] tracking-widest">
                {STUDENT.referralCode}
              </span>
              <button className="p-2 rounded-lg hover:bg-blue-100 transition-colors text-[#23479E]">
                <Copy size={16} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Każda osoba, która dołączy z Twoim kodem, dostaje{' '}
            <strong className="text-gray-700">50 zł zniżki</strong>, a Ty zarabiasz{' '}
            <strong className="text-gray-700">50 zł kredytu</strong>!
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Zarobione kredyty</span>
            <span className="font-bold text-[#23479E]">{STUDENT.credits} zł</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Clock
  label: string
  value: string
  color: 'violet' | 'cyan' | 'amber' | 'green'
}) {
  const colors = {
    violet: 'bg-[#EAF3FF] text-[#23479E]',
    cyan: 'bg-[#EAF3FF] text-[#23479E]',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  }
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-xl font-black text-gray-900">{value}</p>
    </div>
  )
}
