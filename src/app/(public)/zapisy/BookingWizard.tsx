'use client'

import { useState } from 'react'
import { CheckCircle, ArrowLeft, Monitor, MapPin, User, Users, Star, Clock, CalendarDays } from 'lucide-react'
import type { PublicGroup } from '@/lib/supabase/queries'

const DAYS_PL = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'] // 0 = poniedziałek (== day_of_week)

type Avail = { day_of_week: number; start_time: string; end_time: string }
type TeacherOpt = { id: string; name: string; levels: string[]; rating: number; color: string; availability: Avail[] }
type Consent = { id: string; label: string; description: string; required: boolean }
type Terms = { version: number; title: string; content: string } | null
type Slot = { day: number; time: string } // time "HH:MM"

// Następne wystąpienie (>= teraz) danego dnia tygodnia (0=pon) i godziny
function nextDate(day0Mon: number, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const targetDow = day0Mon === 6 ? 0 : day0Mon + 1 // JS: 0=niedziela
  const d = new Date()
  d.setSeconds(0, 0)
  let diff = (targetDow - d.getDay() + 7) % 7
  const cand = new Date(d); cand.setDate(d.getDate() + diff); cand.setHours(h, m, 0, 0)
  if (diff === 0 && cand.getTime() <= Date.now()) diff = 7
  const out = new Date(d); out.setDate(d.getDate() + diff); out.setHours(h, m, 0, 0)
  return out
}

// Bloki 1h z przedziału dostępności
function slotsFromAvailability(av: Avail[]): Slot[] {
  const out: Slot[] = []
  for (const a of av) {
    const sh = Number(a.start_time.slice(0, 2)); const eh = Number(a.end_time.slice(0, 2))
    for (let h = sh; h < eh; h++) out.push({ day: a.day_of_week, time: `${String(h).padStart(2, '0')}:00` })
  }
  return out.sort((x, y) => x.day - y.day || x.time.localeCompare(y.time))
}

export function BookingWizard({ teachers, groups, terms, consents }: {
  teachers: TeacherOpt[]; groups: PublicGroup[]; terms: Terms; consents: Consent[]
}) {
  const [screen, setScreen] = useState<'start' | 'mode' | 'groupPick' | 'onlineSearch' | 'teacher' | 'onlineSlot' | 'onlineCalendar' | 'offlineGrid' | 'form'>('start')
  const [kind, setKind] = useState<'group' | 'online' | 'stationary' | null>(null)
  const [history, setHistory] = useState<string[]>([])

  // dane wspólne
  const [groupId, setGroupId] = useState<string>('')
  const [teacherId, setTeacherId] = useState<string>('')
  const [slot, setSlot] = useState<Slot | null>(null)
  const [ongoing, setOngoing] = useState(false)
  const [offlineSlots, setOfflineSlots] = useState<Slot[]>([])
  const [address, setAddress] = useState('')
  const [studentName, setStudentName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const go = (s: typeof screen) => { setHistory((h) => [...h, screen]); setScreen(s) }
  const back = () => { setHistory((h) => { const c = [...h]; const prev = c.pop(); if (prev) setScreen(prev as typeof screen); return c }) }

  const requiredOk = consents.filter((c) => c.required).every((c) => checked[c.id])
  const teacher = teachers.find((t) => t.id === teacherId)

  async function handleSubmit() {
    setError(null)
    if (!studentName || !email) { setError('Podaj imię i e-mail.'); return }
    if (!requiredOk) { setError('Zaakceptuj wymagane zgody.'); return }
    setSubmitting(true)
    let payload: Record<string, unknown> = {
      kind: kind === 'stationary' ? 'stationary' : kind,
      fullName: studentName, childName: studentName, email, phone,
      termsVersion: terms?.version ?? null, consents: checked,
    }
    if (kind === 'group') payload = { ...payload, groupId }
    if (kind === 'online') {
      if (!slot) { setError('Wybierz termin.'); setSubmitting(false); return }
      payload = { ...payload, teacherId, slot: nextDate(slot.day, slot.time).toISOString(), ongoing, weeks: 12, referralCode, discountCode }
    }
    if (kind === 'stationary') {
      if (!address) { setError('Podaj adres zajęć.'); setSubmitting(false); return }
      payload = { ...payload, address, slots: offlineSlots, level: 'A1' }
    }
    const res = await fetch('/api/booking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({}))
    setSubmitting(false)
    if (!res.ok) { setError(data.error || 'Nie udało się wysłać. Spróbuj ponownie.'); return }
    setSubmitted(true)
  }

  if (submitted) {
    const isRequest = kind === 'stationary'
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6"><CheckCircle size={48} className="text-[#23479E]" /></div>
        <h2 className="text-3xl font-black text-gray-900 mb-3">{isRequest ? 'Wysłane! 📨' : 'Gotowe! 🎉'}</h2>
        <p className="text-gray-500 text-lg mb-2">{isRequest ? 'Prośba o zajęcia stacjonarne przyjęta.' : 'Zapis potwierdzony.'}</p>
        <p className="text-gray-400 text-sm mb-6">{isRequest
          ? <>Skontaktujemy się na <strong>{email}</strong>, aby potwierdzić termin i stawkę.</>
          : <>Twoje zajęcia są zapisane na koncie <strong>{email}</strong>.</>}</p>

        <div className="bg-[#EAF3FF] border border-blue-100 rounded-2xl p-5 text-left max-w-sm mx-auto">
          <p className="text-sm font-bold text-[#23479E] mb-2">Twoje konto w panelu</p>
          <p className="text-sm text-gray-700">Login: <strong>{email}</strong></p>
          <p className="text-sm text-gray-700">Hasło startowe: <strong>!uNickStart2026</strong></p>
          <p className="text-xs text-gray-500 mt-3">Zaloguj się na <strong>unick-academy.pl/login</strong> i zmień hasło w profilu. Jeśli masz już konto u nas, użyj swojego dotychczasowego hasła.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="min-h-72">
        {/* 1. INDYWIDUALNIE / GRUPOWO */}
        {screen === 'start' && (
          <Choice title="Jak chcesz się uczyć?" subtitle="Wybierz formę zajęć" options={[
            { icon: User, label: 'Indywidualnie', desc: 'Lekcje 1:1 z nauczycielem', on: () => { setKind(null); go('mode') } },
            { icon: Users, label: 'Grupowo', desc: 'Zajęcia w grupie, niższa cena', on: () => { setKind('group'); go('groupPick') } },
          ]} />
        )}

        {/* 2. ONLINE / STACJONARNIE */}
        {screen === 'mode' && (
          <Choice title="Online czy stacjonarnie?" subtitle="Gdzie mają odbywać się zajęcia" options={[
            { icon: Monitor, label: 'Online', desc: 'Wybierasz termin z grafiku nauczyciela', on: () => { setKind('online'); go('onlineSearch') } },
            { icon: MapPin, label: 'Stacjonarnie', desc: 'Podajesz dostępność i adres – my potwierdzamy', on: () => { setKind('stationary'); go('offlineGrid') } },
          ]} />
        )}

        {/* GRUPY */}
        {screen === 'groupPick' && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Wybierz grupę</h2>
            <p className="text-gray-500 text-center mb-6">Dostępne grupy z wolnymi miejscami</p>
            <div className="space-y-3 max-h-[26rem] overflow-y-auto">
              {groups.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Brak otwartych grup. Wybierz lekcje indywidualne.</p>}
              {groups.map((g) => {
                const full = g.spots <= 0
                return (
                  <button key={g.id} disabled={full} onClick={() => { setGroupId(g.id); go('form') }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${full ? 'border-gray-100 opacity-50 cursor-not-allowed' : groupId === g.id ? 'border-violet-500 bg-[#EAF3FF]' : 'border-gray-200 hover:border-violet-300'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{g.name}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${full ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        {full ? 'Brak miejsc' : `${g.spots} z ${g.capacity} wolne`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium">{g.level}</span>
                      {g.age_range && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{g.age_range}</span>}
                      {g.schedule_text && <span className="flex items-center gap-1"><Clock size={11} />{g.schedule_text}</span>}
                      <span>· {g.teacherName}</span>
                    </div>
                    {g.description && <p className="text-xs text-gray-400 mt-1">{g.description}</p>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ONLINE: wyszukiwarka – po nauczycielu / po terminie */}
        {screen === 'onlineSearch' && (
          <Choice title="Jak chcesz szukać terminu?" subtitle="Po nauczycielu albo po wolnej godzinie" options={[
            { icon: User, label: 'Po nauczycielu', desc: 'Wybierz lektora i zobacz jego wolne godziny', on: () => go('teacher') },
            { icon: CalendarDays, label: 'Po terminie', desc: 'Kalendarz wolnych godzin – każdy nauczyciel w swoim kolorze', on: () => { setSlot(null); setTeacherId(''); go('onlineCalendar') } },
          ]} />
        )}

        {/* ONLINE: nauczyciel */}
        {screen === 'teacher' && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Wybierz nauczyciela</h2>
            <p className="text-gray-500 text-center mb-6">Zobaczysz jego wolne terminy</p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teachers.map((t) => (
                <button key={t.id} onClick={() => { setTeacherId(t.id); setSlot(null); go('onlineSlot') }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${teacherId === t.id ? 'border-violet-500 bg-[#EAF3FF]' : 'border-gray-200 hover:border-violet-300'}`}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0" style={{ backgroundColor: t.color }}>{t.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{t.name}</span>
                      <span className="flex items-center gap-0.5 text-xs text-amber-600"><Star size={11} className="fill-amber-400 text-amber-400" />{t.rating}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{t.availability.length > 0 ? `${slotsFromAvailability(t.availability).length} wolnych godzin/tydz.` : 'Brak ustawionego grafiku'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ONLINE: wybór slotu */}
        {screen === 'onlineSlot' && teacher && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Wolne terminy – {teacher.name}</h2>
            <p className="text-gray-500 text-center mb-6">Wybierz godzinę (powtarza się co tydzień)</p>
            {(() => {
              const opts = slotsFromAvailability(teacher.availability)
              if (opts.length === 0) return <p className="text-center text-sm text-gray-400 py-8">Ten nauczyciel nie ma jeszcze ustawionego grafiku. Wróć i wybierz innego.</p>
              return (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto mb-5">
                  {opts.map((s) => {
                    const sel = slot?.day === s.day && slot?.time === s.time
                    return (
                      <button key={`${s.day}-${s.time}`} onClick={() => setSlot(s)}
                        className={`px-2 py-2 rounded-lg border text-xs font-semibold transition-all ${sel ? 'border-violet-500 bg-[#EAF3FF] text-[#23479E]' : 'border-gray-200 text-gray-600 hover:border-violet-300'}`}>
                        {DAYS_PL[s.day]} {s.time}
                      </button>
                    )
                  })}
                </div>
              )
            })()}
            <div className="flex gap-3">
              {([{ v: false, l: 'Jednorazowo' }, { v: true, l: 'Co tydzień (ongoing)' }]).map((o) => (
                <button key={String(o.v)} onClick={() => setOngoing(o.v)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${ongoing === o.v ? 'border-violet-500 bg-[#EAF3FF] text-[#23479E]' : 'border-gray-200 text-gray-600'}`}>{o.l}</button>
              ))}
            </div>
            {slot && (
              <button onClick={() => go('form')} className="w-full mt-5 py-3 rounded-full gradient-primary text-white font-semibold text-sm hover:opacity-90">
                Dalej – {DAYS_PL[slot.day]} {slot.time}{ongoing ? ' (co tydzień)' : ''}
              </button>
            )}
          </div>
        )}

        {/* ONLINE: kalendarz wolnych terminów wszystkich nauczycieli */}
        {screen === 'onlineCalendar' && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Wolne terminy</h2>
            <p className="text-gray-500 text-center mb-4">Kliknij godzinę – kolor oznacza nauczyciela</p>
            <FreeCalendar teachers={teachers} selected={slot} selectedTeacher={teacherId}
              onPick={(tid, s) => { setTeacherId(tid); setSlot(s) }} />
            {slot && teacher && (
              <>
                <div className="flex gap-3 mt-5">
                  {([{ v: false, l: 'Jednorazowo' }, { v: true, l: 'Co tydzień (ongoing)' }]).map((o) => (
                    <button key={String(o.v)} onClick={() => setOngoing(o.v)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${ongoing === o.v ? 'border-violet-500 bg-[#EAF3FF] text-[#23479E]' : 'border-gray-200 text-gray-600'}`}>{o.l}</button>
                  ))}
                </div>
                <button onClick={() => go('form')} className="w-full mt-4 py-3 rounded-full gradient-primary text-white font-semibold text-sm hover:opacity-90">
                  Dalej – {teacher.name}, {DAYS_PL[slot.day]} {slot.time}{ongoing ? ' (co tydzień)' : ''}
                </button>
              </>
            )}
          </div>
        )}

        {/* STACJONARNIE: siatka dostępności + adres */}
        {screen === 'offlineGrid' && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Twoja dostępność</h2>
            <p className="text-gray-500 text-center mb-4">Zaznacz godziny, w których możesz mieć zajęcia</p>
            <OfflineGrid selected={offlineSlots} setSelected={setOfflineSlots} />
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres zajęć</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ul. Przykładowa 1, Poznań"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
            </div>
            <button onClick={() => go('form')} disabled={offlineSlots.length === 0 || !address}
              className="w-full mt-5 py-3 rounded-full gradient-primary text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90">Dalej</button>
          </div>
        )}

        {/* WSPÓLNY FORMULARZ + ZGODY */}
        {screen === 'form' && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Twoje dane</h2>
            <p className="text-gray-500 text-center mb-6">{kind === 'stationary' ? 'Wyślemy potwierdzenie terminu i stawki' : 'Potwierdzimy zapis e-mailem'}</p>
            <div className="space-y-3">
              <Field label="Imię i nazwisko ucznia" value={studentName} onChange={setStudentName} placeholder="Jan Kowalski" />
              <Field label="E-mail (kontakt / rodzic)" type="email" value={email} onChange={setEmail} placeholder="jan@email.com" />
              <Field label="Telefon (opc.)" type="tel" value={phone} onChange={setPhone} placeholder="+48 600 000 000" />
              {kind === 'online' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Kod polecenia (opc.)" value={referralCode} onChange={(v) => setReferralCode(v.toUpperCase())} placeholder="KOD" />
                  <Field label="Kod rabatowy (opc.)" value={discountCode} onChange={(v) => setDiscountCode(v.toUpperCase())} placeholder="RABAT" />
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-1 mt-5">
              {kind === 'group' && <Row label="Grupa" value={groups.find((g) => g.id === groupId)?.name ?? '—'} />}
              {kind === 'online' && <><Row label="Nauczyciel" value={teacher?.name ?? '—'} /><Row label="Termin" value={slot ? `${DAYS_PL[slot.day]} ${slot.time}${ongoing ? ' · co tydzień' : ' · jednorazowo'}` : '—'} /></>}
              {kind === 'stationary' && <><Row label="Tryb" value="Stacjonarnie (do potwierdzenia)" /><Row label="Adres" value={address || '—'} /><Row label="Dostępność" value={`${offlineSlots.length} slotów`} /></>}
            </div>

            {terms && (
              <details className="my-4 bg-white border border-gray-200 rounded-xl p-3">
                <summary className="text-sm font-semibold text-gray-700 cursor-pointer">{terms.title} (wersja {terms.version})</summary>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed whitespace-pre-wrap">{terms.content}</p>
              </details>
            )}
            <div className="space-y-2 mt-3">
              {consents.map((c) => (
                <label key={c.id} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!checked[c.id]} onChange={(e) => setChecked({ ...checked, [c.id]: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#23479E]" />
                  <span className="text-xs text-gray-600">{c.label}{c.required && <span className="text-red-500"> *</span>}{c.description && <span className="block text-gray-400">{c.description}</span>}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}

      <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
        {history.length > 0 ? (
          <button onClick={back} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft size={16} />Wstecz</button>
        ) : <div />}
        {screen === 'form' && (
          <button onClick={handleSubmit} disabled={submitting || !requiredOk}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">
            <CheckCircle size={16} />{submitting ? 'Wysyłam...' : (kind === 'stationary' ? 'Wyślij prośbę' : 'Potwierdź zapis')}</button>
        )}
      </div>
    </div>
  )
}

function Choice({ title, subtitle, options }: { title: string; subtitle: string; options: { icon: typeof User; label: string; desc: string; on: () => void }[] }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">{title}</h2>
      <p className="text-gray-500 text-center mb-8">{subtitle}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((o) => {
          const Icon = o.icon
          return (
            <button key={o.label} onClick={o.on} className="p-5 rounded-2xl border-2 border-gray-200 hover:border-violet-400 hover:bg-[#EAF3FF] text-left transition-all">
              <Icon size={24} className="text-[#23479E]" />
              <p className="font-bold text-gray-900 mt-3">{o.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{o.desc}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function OfflineGrid({ selected, setSelected }: { selected: Slot[]; setSelected: (s: Slot[]) => void }) {
  const hours = Array.from({ length: 13 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`) // 8:00–20:00
  const has = (day: number, time: string) => selected.some((s) => s.day === day && s.time === time)
  const toggle = (day: number, time: string) => {
    setSelected(has(day, time) ? selected.filter((s) => !(s.day === day && s.time === time)) : [...selected, { day, time }])
  }
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-8 gap-1 min-w-[20rem] text-center">
        <div />
        {DAYS_PL.map((d) => <div key={d} className="text-[10px] font-bold text-gray-500">{d}</div>)}
        {hours.map((h) => (
          <FragmentRow key={h} hour={h} has={has} toggle={toggle} />
        ))}
      </div>
    </div>
  )
}

function FragmentRow({ hour, has, toggle }: { hour: string; has: (d: number, t: string) => boolean; toggle: (d: number, t: string) => void }) {
  return (
    <>
      <div className="text-[10px] text-gray-400 flex items-center justify-end pr-1">{hour}</div>
      {DAYS_PL.map((_, day) => (
        <button key={day} onClick={() => toggle(day, hour)}
          className={`h-6 rounded transition-colors ${has(day, hour) ? 'bg-[#23479E]' : 'bg-gray-100 hover:bg-violet-200'}`} />
      ))}
    </>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-gray-500">{label}</span><span className="font-semibold text-gray-900">{value}</span></div>
}

// Kalendarz wolnych godzin wszystkich nauczycieli (kolor = nauczyciel)
function FreeCalendar({ teachers, selected, selectedTeacher, onPick }: {
  teachers: TeacherOpt[]; selected: Slot | null; selectedTeacher: string
  onPick: (teacherId: string, s: Slot) => void
}) {
  // mapa "day-time" -> lista wolnych nauczycieli
  const map = new Map<string, { id: string; name: string; color: string }[]>()
  const withSlots = teachers.filter((t) => t.availability.length > 0)
  for (const t of withSlots) {
    for (const s of slotsFromAvailability(t.availability)) {
      const k = `${s.day}-${s.time}`
      ;(map.get(k) ?? map.set(k, []).get(k)!).push({ id: t.id, name: t.name, color: t.color })
    }
  }
  if (map.size === 0) return <p className="text-center text-sm text-gray-400 py-8">Brak ustawionych grafików. Wróć i wybierz „Po nauczycielu”.</p>

  const hours = Array.from(new Set([...map.keys()].map((k) => k.split('-')[1]))).sort()
  const usedTeachers = withSlots.filter((t) => [...map.values()].some((arr) => arr.some((x) => x.id === t.id)))

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[24rem]">
          <div className="grid gap-1" style={{ gridTemplateColumns: '2.6rem repeat(7, 1fr)' }}>
            <div />
            {DAYS_PL.map((d) => <div key={d} className="text-[10px] font-bold text-gray-500 text-center">{d}</div>)}
            {hours.map((h) => (
              <CalRow key={h} hour={h} map={map} selected={selected} selectedTeacher={selectedTeacher} onPick={onPick} />
            ))}
          </div>
        </div>
      </div>
      {/* legenda */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        {usedTeachers.map((t) => (
          <span key={t.id} className="flex items-center gap-1 text-[11px] text-gray-600">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: t.color }} />{t.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function CalRow({ hour, map, selected, selectedTeacher, onPick }: {
  hour: string; map: Map<string, { id: string; name: string; color: string }[]>
  selected: Slot | null; selectedTeacher: string; onPick: (teacherId: string, s: Slot) => void
}) {
  return (
    <>
      <div className="text-[10px] text-gray-400 flex items-center justify-end pr-1">{hour}</div>
      {DAYS_PL.map((_, day) => {
        const free = map.get(`${day}-${hour}`) ?? []
        return (
          <div key={day} className="min-h-7 flex flex-wrap gap-0.5 items-center justify-center p-0.5 rounded bg-gray-50">
            {free.map((t) => {
              const sel = selected?.day === day && selected?.time === hour && selectedTeacher === t.id
              const initials = t.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
              return (
                <button key={t.id} title={`${t.name} · ${DAYS_PL[day]} ${hour}`}
                  onClick={() => onPick(t.id, { day, time: hour })}
                  className={`w-5 h-5 rounded-sm flex items-center justify-center text-[8px] font-bold text-white leading-none transition-transform hover:scale-125 ${sel ? 'ring-2 ring-offset-1 ring-gray-700 scale-110' : ''}`}
                  style={{ backgroundColor: t.color }}>{initials}</button>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
