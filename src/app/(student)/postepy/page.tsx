'use client'

const MONTHLY_HOURS = [
  { month: 'Sty', hours: 4 },
  { month: 'Lut', hours: 6 },
  { month: 'Mar', hours: 8 },
  { month: 'Kwi', hours: 6 },
  { month: 'Maj', hours: 10 },
  { month: 'Cze', hours: 4 },
]

const SKILLS = [
  { name: 'Mówienie', value: 72, color: 'bg-[#EAF3FF]0' },
  { name: 'Słuchanie', value: 85, color: 'bg-[#EAF3FF]0' },
  { name: 'Pisanie', value: 68, color: 'bg-amber-500' },
  { name: 'Czytanie', value: 90, color: 'bg-green-500' },
  { name: 'Słownictwo', value: 75, color: 'bg-rose-500' },
]

const NOTES = [
  { date: '9 cze 2025', teacher: 'Milly', text: 'Świetna poprawa w wymowie! Pamiętaj o "th" w wyrazach "the" i "think". Ćwicz nagrywanie siebie.' },
  { date: '4 cze 2025', teacher: 'Milly', text: 'Small talk idzie bardzo dobrze. W następnej lekcji skupiamy się na idiomach biznesowych.' },
  { date: '28 maj 2025', teacher: 'Milly', text: 'Dobry postęp w konstrukcjach conditional. Zostało jeszcze 3rd conditional do omówienia.' },
]

const maxHours = Math.max(...MONTHLY_HOURS.map((m) => m.hours))

export default function PostepyPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Moje postępy</h1>

      {/* Wykres słupkowy */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
        <h2 className="font-bold text-gray-900 mb-1">Godziny nauki miesięcznie</h2>
        <p className="text-sm text-gray-500 mb-6">Łącznie: 38 godzin w tym roku</p>
        <div className="flex items-end gap-3 h-32">
          {MONTHLY_HOURS.map(({ month, hours }) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-gray-600">{hours}h</span>
              <div className="w-full flex flex-col justify-end" style={{ height: 96 }}>
                <div
                  className="w-full rounded-t-lg gradient-primary transition-all"
                  style={{ height: `${(hours / maxHours) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">{month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Umiejętności */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
        <h2 className="font-bold text-gray-900 mb-1">Poziom umiejętności</h2>
        <p className="text-sm text-gray-500 mb-6">Ocena na podstawie Twoich lekcji · poziom B2</p>
        <div className="space-y-4">
          {SKILLS.map(({ name, value, color }) => (
            <div key={name}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-gray-700">{name}</span>
                <span className="font-bold text-gray-900">{value}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-700`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notatki od nauczyciela */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h2 className="font-bold text-gray-900 mb-4">Notatki od nauczyciela</h2>
        <div className="space-y-4">
          {NOTES.map((note, i) => (
            <div key={i} className="border-l-2 border-violet-200 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[#23479E]">{note.teacher}</span>
                <span className="text-xs text-gray-400">{note.date}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
