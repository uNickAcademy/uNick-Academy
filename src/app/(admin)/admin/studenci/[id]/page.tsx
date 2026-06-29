import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Clock, User, CreditCard, BookOpen, Tag } from 'lucide-react'
import { getStudentById, getStudentLessons, getStudentTransactions } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'

export default async function Client360Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const student = await getStudentById(id)
  if (!student) notFound()

  const [lessons, transactions] = await Promise.all([
    getStudentLessons(student.id),
    getStudentTransactions(student.id),
  ])

  const now = Date.now()
  const past = lessons.filter((l) => new Date(l.starts_at).getTime() < now)
  const present = past.filter((l) => l.attendance === 'present').length
  const absent = past.filter((l) => l.attendance === 'absent').length
  const totalHours = past.reduce((acc, l) => acc + (new Date(l.ends_at).getTime() - new Date(l.starts_at).getTime()) / 3_600_000, 0)
  const customFields = student.custom_fields ?? {}

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/admin/studenci" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#23479E] mb-4">
        <ArrowLeft size={15} />Wróć do listy
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{student.full_name ?? student.profile?.full_name}</h1>
            <p className="text-sm text-gray-500 mt-1">{student.profile?.email}{student.profile?.phone ? ` · ${student.profile.phone}` : ''}</p>
            {student.guardian_name && <p className="text-xs text-gray-400 mt-0.5">Rodzic/opiekun: {student.guardian_name}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EAF3FF] text-[#23479E]">{student.level}</span>
              {student.age_group && <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{student.age_group}</span>}
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{student.status}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-violet-50 text-violet-600">{student.teacher?.profile?.full_name ?? 'bez lektora'}</span>
              <span className="text-xs text-gray-400 font-mono">{student.referral_code}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Saldo</p>
            <p className={`text-2xl font-black ${student.credit_balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
              {student.credit_balance.toLocaleString('pl-PL')} zł
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={CheckCircle} label="Obecności" value={String(present)} color="text-green-600" />
        <Stat icon={XCircle} label="Nieobecności" value={String(absent)} color="text-red-500" />
        <Stat icon={Clock} label="Godziny lekcji" value={`${Math.round(totalHours * 10) / 10}h`} color="text-[#23479E]" />
        <Stat icon={BookOpen} label="Lekcje łącznie" value={String(lessons.length)} color="text-gray-900" />
      </div>

      {Object.keys(customFields).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Tag size={16} />Własne pola</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(customFields).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-sm"><span className="text-gray-400">{k}:</span><span className="text-gray-800 font-medium">{String(v)}</span></div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><BookOpen size={16} />Historia lekcji</h2>
          {lessons.length === 0 ? <p className="text-sm text-gray-400">Brak lekcji.</p> : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {lessons.slice().reverse().map((l) => (
                <div key={l.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-gray-400 w-28 flex-shrink-0">{new Date(l.starts_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: '2-digit' })} {new Date(l.starts_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex-1 truncate text-gray-700">{l.topic || 'Lekcja'}</span>
                  {l.attendance === 'present' && <CheckCircle size={14} className="text-green-600" />}
                  {l.attendance === 'absent' && <XCircle size={14} className="text-red-500" />}
                  {l.attendance === 'excused' && <span className="text-xs text-amber-600">usp.</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><CreditCard size={16} />Historia płatności</h2>
          {transactions.length === 0 ? <p className="text-sm text-gray-400">Brak transakcji.</p> : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0">{new Date(tx.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>
                  <span className="flex-1 truncate text-gray-700">{tx.description}</span>
                  <span className={`font-bold ${tx.type === 'charge' ? 'text-red-500' : 'text-gray-900'}`}>
                    {tx.type === 'charge' ? '−' : '+'}{Number(tx.amount).toLocaleString('pl-PL')} zł
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof User; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="flex items-center gap-2 mb-2 text-gray-400"><Icon size={16} /></div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  )
}
