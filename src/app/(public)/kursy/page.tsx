import Link from 'next/link'
import { Users, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function KursyPage() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('public_courses')
  const courses = (data ?? []) as { id: string; name: string; level: string; color: string; teacher: string; capacity: number; taken: number; free: number }[]

  return (
    <div className="py-16 px-4 bg-[#FFF8F0] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-gray-900">Dostępne kursy</h1>
          <p className="text-gray-500 mt-2">Wybierz grupę z wolnymi miejscami i zapisz się online</p>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400">
            Brak otwartych kursów grupowych. <Link href="/zapisy" className="text-[#23479E] hover:underline">Zapisz się na lekcje indywidualne →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {courses.map((c) => {
              const full = c.free <= 0
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="h-16 flex items-center px-5" style={{ backgroundColor: c.color }}>
                    <h3 className="text-lg font-black text-white">{c.name}</h3>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#EAF3FF] text-[#23479E]">{c.level}</span>
                      <span className="text-xs text-gray-500">{c.teacher}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 mb-4">
                      <Users size={15} className="text-gray-400" />
                      {full ? <span className="text-red-500 font-semibold">Brak wolnych miejsc</span> :
                        <span><span className="font-bold text-green-600">{c.free}</span> wolnych miejsc (z {c.capacity})</span>}
                    </div>
                    {full ? (
                      <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed">Lista zapełniona</button>
                    ) : (
                      <Link href="/zapisy" className="w-full py-2.5 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        Zapisz się <ArrowRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">Tę tabelę kursów można osadzić na własnej stronie www (link do /kursy).</p>
      </div>
    </div>
  )
}
