'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  CheckCircle, ArrowLeft, Monitor, MapPin, User, Baby, Building2, HelpCircle,
  Clock, CalendarDays, Users,
} from 'lucide-react'
import type { PublicGroup } from '@/lib/supabase/queries'
import { track, readCampaign, readReferralCode } from '@/lib/analytics/track'
import { pickTestimonial } from '@/lib/social-proof'
import { ProofQuote } from './SocialProof'
import { Worries } from './Reassurance'

const DAYS_PL = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela']

type Consent = { id: string; label: string; description: string; required: boolean }
type Terms = { version: number; title: string; content: string } | null

type Audience = 'self' | 'child' | 'company' | 'unsure'
type Location = 'rumianek' | 'online'
type AdultLevel = 'start' | 'blocked' | 'fluent'

// Trzy opisowe odpowiedzi zamiast liter CEFR — nikt spoza branży nie wie,
// czym różni się A2 od B1. Mapowanie na poziomy grup zostaje po naszej stronie.
const ADULT_LEVELS: { id: AdultLevel; label: string; desc: string; levels: string[] }[] = [
  { id: 'start', label: 'Dopiero zaczynam', desc: 'Od podstaw albo po długiej przerwie', levels: ['A1', 'A2'] },
  { id: 'blocked', label: 'Rozumiem, ale blokuję się przy mówieniu', desc: 'Znam słowa, gorzej z odwagą', levels: ['A2', 'B1'] },
  { id: 'fluent', label: 'Mówię swobodnie, chcę więcej naturalności', desc: 'Płynność, niuanse, swoboda', levels: ['B1', 'B2', 'C1'] },
]

const STEP_COUNT = 5

export function BookingWizard({ groups, terms, consents }: {
  groups: PublicGroup[]; terms: Terms; consents: Consent[]
}) {
  type Screen = 'audience' | 'location' | 'level' | 'options' | 'details' | 'advice' | 'individual' | 'done'

  const [screen, setScreen] = useState<Screen>('audience')
  const [history, setHistory] = useState<Screen[]>([])

  const [audience, setAudience] = useState<Audience | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [age, setAge] = useState<string>('')
  const [adultLevel, setAdultLevel] = useState<AdultLevel | null>(null)
  const [groupId, setGroupId] = useState<string>('')
  // Doprecyzowanie w ścieżce „jeszcze nie wiem”. `audience` zostaje 'unsure',
  // żeby nie zgubić informacji, że osoba trafiła tu niezdecydowana.
  const [unsureFor, setUnsureFor] = useState<Audience | null>(null)

  const [name, setName] = useState('')
  const [parentName, setParentName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [preferredTimes, setPreferredTimes] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  // Atrybucja z adresu: utm_campaign/utm_source z reklamy albo kod polecenia.
  // Bez tego nie da się policzyć, ile kosztował uczeń z konkretnej kreacji.
  // Czytamy przy inicjalizacji, nie w efekcie: wartość nigdzie się nie
  // renderuje, więc różnica serwer/klient nie ma jak wywołać niezgodności.
  const [campaign] = useState(() => readCampaign())
  // Kod z linku ?ref= jest tylko wartością startową — pole jest edytowalne,
  // bo większość poleceń dzieje się ustnie: ktoś podaje kod znajomej, a ta
  // wchodzi na stronę normalnie i musi mieć gdzie go wpisać. Bez przekazania
  // kodu nie odpali się register_referral i polecający nie dostanie 50 zł.
  const [referralCode, setReferralCode] = useState(() => readReferralCode() ?? '')
  // Start kreatora liczony raz na sesję odwiedzin. Inicjalizator stanu
  // uruchamia się raz, więc nie potrzeba tu efektu ani strażnika.
  useState(() => { track('zapisy_start', { campaign }); return true })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ kind: 'group' | 'advice' | 'individual'; groupName?: string; schedule?: string; firstLessonDate?: string | null } | null>(null)


  const stepNumber: Record<Screen, number | null> = {
    audience: 1, location: 2, level: 3, options: 4, details: 5,
    advice: null, individual: null, done: null,
  }

  // Każde przejście dalej to ukończony krok — stąd mierzymy w `go`, a nie
  // przy wejściu na ekran: interesuje nas, ilu ludzi krok DOKOŃCZYŁO.
  const go = (s: Screen) => {
    track('zapisy_krok', { z: screen, na: s, krok: stepNumber[screen] ?? 0, campaign })
    setHistory((h) => [...h, screen]); setScreen(s); setError(null)
  }
  const back = () => setHistory((h) => {
    const c = [...h]; const prev = c.pop()
    if (prev) { setScreen(prev); setError(null) }
    return c
  })


  const requiredConsents = consents.filter((c) => c.required)
  const optionalConsents = consents.filter((c) => !c.required)
  const requiredOk = requiredConsents.every((c) => checked[c.id])
  // Zgoda marketingowa zasila `leads.consent_marketing`; rozpoznajemy ją po
  // etykiecie, bo `consent_types` nie ma osobnego znacznika rodzaju.
  const marketingConsent = consents.find((c) => /marketing/i.test(c.label))

  const ageNum = age === '' ? null : Number(age)

  // Dopasowanie ofert: forma z kroku 2, wiek albo poziom z kroku 3.
  const matched = useMemo(() => {
    const wantFormat = location === 'online' ? 'online' : 'offline'
    const levelSet = audience === 'self'
      ? ADULT_LEVELS.find((l) => l.id === adultLevel)?.levels ?? []
      : []
    return groups
      .filter((g) => g.format === wantFormat)
      .filter((g) => g.spots > 0)
      .filter((g) => {
        if (audience === 'child') {
          if (ageNum == null || Number.isNaN(ageNum)) return true
          return (g.ageMin == null || ageNum >= g.ageMin) && (g.ageMax == null || ageNum <= g.ageMax)
        }
        if (audience === 'self') {
          // Najpierw wiek, dopiero potem poziom. Bez tego dorosły „dopiero
          // zaczynam" dostawał w propozycjach Crafty English — grupę A1,
          // ale dla sześciolatków. Poziom sam w sobie nie mówi, dla kogo
          // jest grupa.
          if (g.ageMax != null && g.ageMax < 18) return false
          if (levelSet.length === 0) return true
          const gl = g.levels?.length ? g.levels : [g.level]
          return gl.some((lv) => levelSet.includes(lv))
        }
        return true
      })
      .slice(0, 3)
  }, [groups, location, audience, ageNum, adultLevel])

  const selectedGroup = groups.find((g) => g.id === groupId) ?? null

  // Dowód dobrany do tego, kogo dotyczy zapis. W kroku 5 pokazujemy inną
  // opinię niż w kroku 4 — powtórzenie tej samej wygląda jak jedyna, jaką mamy.
  const proofOptions = pickTestimonial({ audience, age: ageNum, online: location === 'online' })
  // Tuż przed kliknięciem pokazujemy osobie wybierającej online opinię kogoś,
  // kto też miał wątpliwości co do tej formy — to najczęstsza obawa na tym etapie.
  const proofDetails = pickTestimonial({
    audience, age: ageNum, online: location === 'online', skip: proofOptions?.author,
    prefer: location === 'online' ? 'online' : undefined,
  })
  // Ścieżka doradcza ma własny dobór: tam odbiorcę poznajemy dopiero
  // z podpytania, więc `audience` wciąż brzmi 'unsure'. Bez tego rodzic,
  // który przed chwilą zaznaczył „dla dziecka”, czytał opinię dorosłego.
  const proofAdvice = pickTestimonial({
    audience: audience === 'unsure' ? unsureFor : audience,
    age: ageNum,
    online: location === 'online',
  })

  function scheduleOf(g: PublicGroup): string {
    const day = g.dayOfWeek != null ? DAYS_PL[g.dayOfWeek] : null
    return [day, g.schedule_text].filter(Boolean).join(', ') || 'termin do potwierdzenia'
  }

  async function submit(kind: 'group' | 'advice' | 'individual') {
    setError(null)
    if (!name.trim()) { setError('Podaj imię.'); return }
    if (kind === 'group' && (!email.trim() || !phone.trim())) {
      setError('Potrzebujemy e-maila i telefonu, żeby potwierdzić miejsce.'); return
    }
    if (kind !== 'group' && !email.trim() && !phone.trim()) {
      setError('Zostaw e-mail albo telefon — inaczej nie damy rady się odezwać.'); return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ten adres e-mail wygląda na niepełny. Sprawdź go, proszę.'); return
    }
    if (kind === 'group' && !requiredOk) { setError('Zaakceptuj regulamin, żeby dokończyć rezerwację.'); return }

    setSubmitting(true)
    const isChild = audience === 'child'
    const payload: Record<string, unknown> = {
      kind,
      fullName: isChild ? (parentName.trim() || name.trim()) : name.trim(),
      childName: isChild ? name.trim() : '',
      email: email.trim() || null,
      phone: phone.trim() || null,
      studentAge: ageNum != null && !Number.isNaN(ageNum) ? ageNum : null,
      location,
      audience: audience === 'unsure' ? (unsureFor ?? 'unsure') : audience,
      undecided: audience === 'unsure',
      consentMarketing: marketingConsent ? !!checked[marketingConsent.id] : false,
      consentClause: marketingConsent?.label ?? null,
      campaign,
      referralCode,
    }
    if (kind === 'group') {
      payload.groupId = groupId
      payload.termsVersion = terms?.version ?? null
      payload.consents = checked
    } else {
      payload.message = message.trim()
      payload.preferredTimes = preferredTimes.trim()
    }

    const res = await fetch('/api/booking', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSubmitting(false)
    if (!res.ok) { setError(data.error || 'Nie udało się wysłać. Spróbuj ponownie.'); return }

    track('zapisy_wyslane', {
      rodzaj: kind,
      grupa: (data.groupName as string) ?? null,
      forma: location,
      odbiorca: audience,
      campaign,
    })

    setResult({
      kind,
      groupName: data.groupName, schedule: data.schedule, firstLessonDate: data.firstLessonDate,
    })
    setScreen('done')
  }

  // ── Ekran końcowy ────────────────────────────────────────────────────────
  if (screen === 'done' && result) {
    const isGroup = result.kind === 'group'
    return (
      <div className="text-center py-10">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-[#23479E]" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-3">
          {isGroup ? 'Miejsce zarezerwowane 🎉' : 'Mamy Twoje zgłoszenie 📨'}
        </h2>

        {isGroup ? (
          <>
            <p className="text-gray-500 text-lg mb-5">{result.groupName} — {result.schedule}</p>
            {result.firstLessonDate && (
              <p className="text-gray-500 mb-5">Pierwsze zajęcia: <strong>{result.firstLessonDate}</strong></p>
            )}
            <div className="bg-[#EAF3FF] border border-blue-100 rounded-2xl p-5 text-left max-w-md mx-auto">
              <p className="text-sm font-bold text-[#23479E] mb-2">Co dalej?</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Potwierdzenie poszło na <strong>{email}</strong> — jest w nim link do ustawienia hasła
                do Twojego konta. Nie musisz teraz nic płacić: przychodzisz na pierwsze zajęcia
                i dopiero wtedy decydujesz. Jeśli nie podejdą, rezygnujesz bez żadnej opłaty.
                Dzień przed startem dostaniesz praktyczne szczegóły.
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-500 text-lg mb-5">
              Odezwiemy się <strong>w ciągu 2 dni roboczych</strong>.
            </p>
            <div className="bg-[#EAF3FF] border border-blue-100 rounded-2xl p-5 text-left max-w-md mx-auto">
              <p className="text-sm font-bold text-[#23479E] mb-2">Co dalej?</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Zadzwonimy albo napiszemy — jak Ci wygodniej. Rozmowa trwa kilkanaście minut,
                pomaga dobrać poziom i porę, i do niczego nie zobowiązuje.
                {email && <> Potwierdzenie wysłaliśmy na <strong>{email}</strong>.</>}
              </p>
            </div>
          </>
        )}
      </div>
    )
  }

  const step = stepNumber[screen]

  return (
    <div>
      {step && (
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#23479E]">Krok {step} z {STEP_COUNT}</span>
            <span className="text-xs text-gray-400">{Math.round((step / STEP_COUNT) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full gradient-primary rounded-full transition-all duration-300"
              style={{ width: `${(step / STEP_COUNT) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="min-h-72">
        {/* KROK 1 — dla kogo */}
        {screen === 'audience' && (
          <Choice title="Dla kogo szukasz zajęć?" subtitle="Od ponad 10 lat uczymy w Rumianku i online — powiedz nam, kogo szukasz, a pokażemy tylko to, co pasuje" options={[
            { icon: User, label: 'Dla mnie', desc: 'Uczę się sam/sama', on: () => { setAudience('self'); go('location') } },
            { icon: Baby, label: 'Dla mojego dziecka', desc: 'Zajęcia dla dzieci i młodzieży', on: () => { setAudience('child'); go('location') } },
            { icon: Building2, label: 'Dla mojej firmy', desc: 'Szkolenia dla zespołu', on: () => { window.location.href = '/pl/companies#zapytanie-firmowe' } },
            { icon: HelpCircle, label: 'Jeszcze nie wiem', desc: 'Doradźcie mi — opowiem, o co chodzi', on: () => { setAudience('unsure'); go('advice') } },
          ]} />
        )}

        {/* KROK 2 — gdzie */}
        {screen === 'location' && (
          <Choice title="Gdzie mają odbywać się zajęcia?" subtitle="Pokażemy tylko to, co pasuje" options={[
            { icon: MapPin, label: 'W Rumianku', desc: 'Stacjonarnie, gmina Tarnowo Podgórne', on: () => { setLocation('rumianek'); go('level') } },
            { icon: Monitor, label: 'Online', desc: 'Z dowolnego miejsca w Polsce', on: () => { setLocation('online'); go('level') } },
          ]} />
        )}

        {/* KROK 3 — wiek albo poziom */}
        {screen === 'level' && audience === 'child' && (
          <div>
            <Heading title="Ile lat ma dziecko?" subtitle="Dobierzemy grupę do wieku" />
            <div className="max-w-xs mx-auto">
              {/* Bez autoFocus: na telefonie klawiatura wjeżdża od razu i zasłania
                  przycisk „Pokaż dopasowane grupy". */}
              <input type="number" min={2} max={19} value={age} onChange={(e) => setAge(e.target.value)}
                placeholder="np. 8" inputMode="numeric"
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-center text-2xl font-bold focus:outline-none focus:border-[#23479E]" />
              <p className="text-xs text-gray-400 text-center mt-2">Uczymy dzieci od 2. roku życia</p>
            </div>
            <button onClick={() => go('options')} disabled={!age}
              className="w-full mt-7 py-3 rounded-full gradient-primary text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90">
              Pokaż dopasowane grupy
            </button>
            <Worries audience="child" />
          </div>
        )}

        {screen === 'level' && audience === 'self' && (
          <div>
            <Heading title="Jak dziś jest z Twoim angielskim?" subtitle="Bez testów — wybierz, co pasuje najbliżej" />
            <div className="space-y-3">
              {ADULT_LEVELS.map((l) => (
                <button key={l.id} onClick={() => { setAdultLevel(l.id); go('options') }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${adultLevel === l.id ? 'border-violet-500 bg-[#EAF3FF]' : 'border-gray-200 hover:border-violet-300'}`}>
                  <p className="font-bold text-gray-900">{l.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{l.desc}</p>
                </button>
              ))}
            </div>
            <Worries audience="self" />
          </div>
        )}

        {/* KROK 4 — dopasowane opcje */}
        {screen === 'options' && (
          <div>
            <Heading
              title={matched.length > 0 ? 'To pasuje do Ciebie' : 'Tego akurat nie mamy w grafiku'}
              subtitle={matched.length > 0
                ? 'Wybierz termin, który Ci odpowiada'
                : 'Ale prawie zawsze da się coś dopasować — powiedz nam, czego szukasz'}
            />

            {/* Puste wyniki to najdroższy moment całej ścieżki: za to kliknięcie
                już zapłaciliśmy. Zamiast samego „nie ma” mówimy, czego nie ma
                i co realnie możemy zaproponować zamiast tego. */}
            {matched.length === 0 && (
              <p className="text-sm text-gray-600 leading-relaxed bg-[#EAF3FF] border border-blue-100 rounded-2xl p-4 mb-5">
                {audience === 'child' && location === 'online'
                  ? 'Grupy online prowadzimy na razie tylko dla dorosłych. Dla dzieci mamy zajęcia online, ale indywidualne — dobierzemy nauczyciela i porę pod Wasz grafik. Albo zapraszamy do Rumianka, gdzie grup jest najwięcej.'
                  : 'W tym wieku i o tej porze nie mamy w tej chwili otwartej grupy. Nie znaczy to, że nie da się nic zrobić — czasem otwieramy nowy termin, gdy zgłosi się kilka osób, a zajęcia indywidualne układamy pod Wasz grafik.'}
              </p>
            )}
            <div className="space-y-3">
              {matched.map((g) => (
                <button key={g.id} onClick={() => { setGroupId(g.id); go('details') }}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 hover:border-violet-400 hover:bg-[#EAF3FF] text-left transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-gray-900">{g.name}</span>
                    {g.pricePerMonth != null && (
                      <span className="text-sm font-black text-[#23479E] whitespace-nowrap">{g.pricePerMonth} zł/mies.</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><CalendarDays size={12} />{scheduleOf(g)}</span>
                    <span className="flex items-center gap-1">
                      {g.format === 'online' ? <Monitor size={12} /> : <MapPin size={12} />}
                      {g.format === 'online' ? 'Online' : 'Rumianek'}
                    </span>
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <Users size={12} />{g.spots} z {g.capacity} miejsc wolnych
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2.5">
                    {g.teacherName && g.teacherName !== '—' && (
                      <span className="flex items-center gap-2">
                        <TeacherAvatar name={g.teacherName} photo={g.teacherPhoto} />
                        <span className="text-xs text-gray-500">
                          Prowadzi <span className="font-semibold text-gray-700">{g.teacherName}</span>
                        </span>
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg px-2 py-0.5">
                      Pierwsze zajęcia bez zobowiązań
                    </span>
                  </div>
                  {g.description && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{g.description}</p>}
                </button>
              ))}
            </div>

            {matched.length > 0 && <ProofQuote t={proofOptions} />}

            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
              <button onClick={() => go('advice')}
                className="w-full p-3 rounded-xl border border-gray-200 hover:border-violet-300 text-left transition-all">
                <p className="text-sm font-semibold text-gray-700">Żaden termin mi nie pasuje</p>
                <p className="text-xs text-gray-400">Zostaw kontakt — poszukamy czegoś pod Ciebie</p>
              </button>
              <button onClick={() => go('individual')}
                className="w-full p-3 rounded-xl border border-gray-200 hover:border-violet-300 text-left transition-all">
                <p className="text-sm font-semibold text-gray-700">Wolę zajęcia indywidualne</p>
                <p className="text-xs text-gray-400">Dobierzemy nauczyciela i porę w krótkiej rozmowie</p>
              </button>
            </div>
          </div>
        )}

        {/* KROK 5 — dane i potwierdzenie */}
        {screen === 'details' && selectedGroup && (
          <div>
            <Heading title="Ostatni krok" subtitle="Trzy pola i miejsce jest Twoje" />

            <div className="bg-gray-50 rounded-2xl p-4 mb-5 flex items-start gap-3">
              {selectedGroup.teacherName !== '—' && (
                <TeacherAvatar name={selectedGroup.teacherName} photo={selectedGroup.teacherPhoto} size={44} />
              )}
              <div className="min-w-0">
              <p className="font-bold text-gray-900">{selectedGroup.name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{scheduleOf(selectedGroup)}</p>
              {selectedGroup.teacherName && selectedGroup.teacherName !== '—' && (
                <p className="text-sm text-gray-500">Prowadzi {selectedGroup.teacherName} · grupa do {selectedGroup.capacity} osób</p>
              )}
              {selectedGroup.pricePerMonth != null && (
                <p className="text-sm font-bold text-[#23479E] mt-1">
                  {selectedGroup.pricePerMonth} zł / miesiąc
                </p>
              )}
              </div>
            </div>

            <div className="space-y-3">
              <Field label={audience === 'child' ? 'Imię dziecka' : 'Imię'} value={name} onChange={setName}
                placeholder={audience === 'child' ? 'Zosia' : 'Anna'} />
              {audience === 'child' && (
                <Field label="Twoje imię (rodzic/opiekun)" value={parentName} onChange={setParentName} placeholder="Katarzyna" />
              )}
              <Field label="Telefon" type="tel" value={phone} onChange={setPhone} placeholder="+48 600 000 000" />
              <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="anna@email.com" />
            </div>

            <ReferralField value={referralCode} onChange={setReferralCode} fromLink={!!readReferralCode()} />

            <ProofQuote t={proofDetails} />

            <TermsBlock terms={terms} requiredConsents={requiredConsents} optionalConsents={optionalConsents}
              checked={checked} setChecked={setChecked} />

            {/* Największa obawa zimnego rodzica brzmi „czy właśnie podpisuję się
                na cały rok". Nie podpisuje — i to jest jedyne miejsce, w którym
                da się to powiedzieć, zanim kliknie. */}
            <p className="text-xs text-gray-600 leading-relaxed mt-4 bg-green-50 border border-green-100 rounded-xl p-3">
              <span className="font-semibold text-green-700">Nic nie ryzykujesz.</span>{' '}
              Nie płacisz teraz. Przychodzisz na pierwsze zajęcia i dopiero wtedy decydujesz —
              jeśli nie podejdą, rezygnujesz bez żadnej opłaty.
            </p>
          </div>
        )}

        {/* ŚCIEŻKA „JESZCZE NIE WIEM" */}
        {screen === 'advice' && (
          <div>
            <Heading title="Powiedz nam, o co chodzi" subtitle="Reszta jest po naszej stronie" />
            <div className="space-y-3">
              {audience === 'unsure' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dla kogo, mniej więcej?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { v: 'child' as const, l: 'Dla dziecka' },
                      { v: 'self' as const, l: 'Dla mnie' },
                      { v: 'company' as const, l: 'Dla firmy' },
                      { v: 'unsure' as const, l: 'Naprawdę nie wiem' },
                    ]).map((o) => (
                      <button key={o.v} onClick={() => setUnsureFor(o.v)}
                        className={`py-2.5 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${unsureFor === o.v ? 'border-violet-500 bg-[#EAF3FF] text-[#23479E]' : 'border-gray-200 text-gray-600'}`}>{o.l}</button>
                    ))}
                  </div>
                </div>
              )}
              {!location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gdzie najchętniej?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([{ v: 'rumianek' as const, l: 'W Rumianku' }, { v: 'online' as const, l: 'Online' }]).map((o) => (
                      <button key={o.v} onClick={() => setLocation(o.v)}
                        className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${location === o.v ? 'border-violet-500 bg-[#EAF3FF] text-[#23479E]' : 'border-gray-200 text-gray-600'}`}>{o.l}</button>
                    ))}
                  </div>
                </div>
              )}
              <Field label="Imię" value={name} onChange={setName} placeholder="Anna" />
              {(audience === 'child' || unsureFor === 'child') && (
                <Field label="Wiek dziecka" type="number" value={age} onChange={setAge} placeholder="np. 8" />
              )}
              <Field label="Telefon" type="tel" value={phone} onChange={setPhone} placeholder="+48 600 000 000" />
              <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="anna@email.com" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Napisz w dwóch zdaniach, o co chodzi</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                  placeholder="Np. Syn ma 9 lat, w szkole angielski go zniechęca. Chcemy, żeby przestał się bać mówić."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E] resize-none" />
              </div>
              <ReferralField value={referralCode} onChange={setReferralCode} fromLink={!!readReferralCode()} />
            </div>
            <ProofQuote t={proofAdvice} />
            <ConsentList consents={optionalConsents} checked={checked} setChecked={setChecked} />
          </div>
        )}

        {/* ZAJĘCIA INDYWIDUALNE */}
        {screen === 'individual' && (
          <div>
            <Heading title="Zajęcia indywidualne" subtitle="Dobierzemy nauczyciela do celu i poziomu" />
            <p className="text-sm text-gray-600 mb-5 bg-green-50 border border-green-100 rounded-xl p-4 leading-relaxed">
              <span className="font-semibold text-green-700">Nie musisz od razu brać kursu.</span>{' '}
              Możesz umówić się na pojedyncze zajęcia, dowolnej długości. Bez umów na rok —
              z regularnych zajęć zrezygnujesz w każdej chwili, z miesięcznym wypowiedzeniem.
            </p>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Zadzwonimy w ciągu 2 dni roboczych, żeby poznać cel i poziom — dzięki temu
              dobieramy nauczyciela za pierwszym razem, zamiast zmieniać go po miesiącu.
            </p>
            <div className="space-y-3">
              <Field label={audience === 'child' ? 'Imię dziecka' : 'Imię'} value={name} onChange={setName} placeholder="Anna" />
              <Field label="Telefon" type="tel" value={phone} onChange={setPhone} placeholder="+48 600 000 000" />
              <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="anna@email.com" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cel — po co Wam angielski?</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
                  placeholder="Np. rozmowa kwalifikacyjna za trzy miesiące"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E] resize-none" />
              </div>
              <Field label="Preferowane pory" value={preferredTimes} onChange={setPreferredTimes}
                placeholder="Np. wieczory w tygodniu, po 17:00" />
              <ReferralField value={referralCode} onChange={setReferralCode} fromLink={!!readReferralCode()} />
            </div>
            <ProofQuote t={proofDetails} />
            <ConsentList consents={optionalConsents} checked={checked} setChecked={setChecked} />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}

      {/* Obietnica nad przyciskiem, nie w przycisku: w etykiecie rozbijała się
          na cztery wiersze i tłoczyła „Wstecz” na wąskim ekranie. */}
      {(screen === 'advice' || screen === 'individual') && (
        <p className="text-xs text-gray-500 text-center mt-5">
          Odezwiemy się w ciągu <strong className="text-gray-700">2 dni roboczych</strong> — telefonicznie albo mailem.
        </p>
      )}

      <div className="flex items-center justify-between gap-3 mt-4 pt-5 border-t border-gray-100">
        {history.length > 0 ? (
          <button onClick={back} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} />Wstecz
          </button>
        ) : <div />}

        {screen === 'details' && (
          <button onClick={() => submit('group')} disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">
            <CheckCircle size={16} />{submitting ? 'Rezerwuję...' : 'Rezerwuję miejsce'}
          </button>
        )}
        {(screen === 'advice' || screen === 'individual') && (
          <button onClick={() => submit(screen === 'advice' ? 'advice' : 'individual')} disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-full gradient-primary text-white font-semibold text-sm whitespace-nowrap hover:opacity-90 disabled:opacity-40">
            <Clock size={16} />{submitting ? 'Wysyłam...' : 'Wyślij zgłoszenie'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Elementy wspólne ───────────────────────────────────────────────────────

// Twarz prowadzącego. Rodzic wybiera człowieka, nie nazwę kursu — sama
// nazwa nauczyciela nic mu nie mówi, jeśli szkoły nie zna.
function TeacherAvatar({ name, photo, size = 28 }: { name: string; photo: string | null; size?: number }) {
  if (!photo) {
    return (
      <span
        className="rounded-full bg-[#EAF3FF] text-[#23479E] font-bold flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-hidden="true"
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }
  return (
    <Image
      src={photo}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">{title}</h2>
      <p className="text-gray-500 text-center mb-7">{subtitle}</p>
    </>
  )
}

function Choice({ title, subtitle, options }: {
  title: string; subtitle: string
  options: { icon: typeof User; label: string; desc: string; on: () => void }[]
}) {
  return (
    <div>
      <Heading title={title} subtitle={subtitle} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((o) => {
          const Icon = o.icon
          return (
            <button key={o.label} onClick={o.on}
              className="p-5 rounded-2xl border-2 border-gray-200 hover:border-violet-400 hover:bg-[#EAF3FF] text-left transition-all">
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

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]" />
    </div>
  )
}

function ConsentList({ consents, checked, setChecked }: {
  consents: Consent[]; checked: Record<string, boolean>; setChecked: (v: Record<string, boolean>) => void
}) {
  if (consents.length === 0) return null
  return (
    <div className="space-y-2 mt-5">
      {consents.map((c) => (
        <label key={c.id} className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={!!checked[c.id]}
            onChange={(e) => setChecked({ ...checked, [c.id]: e.target.checked })}
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#23479E]" />
          <span className="text-xs text-gray-600">
            {c.label}
            {c.description && <span className="block text-gray-400">{c.description}</span>}
          </span>
        </label>
      ))}
    </div>
  )
}

// Regulamin w dwóch warstwach: trzy zdania po ludzku + link do pełnej treści.
// Pełny dokument zostaje dostępny, ale nikt nie musi go czytać, żeby zrozumieć,
// na co się zgadza.
function TermsBlock({ terms, requiredConsents, optionalConsents, checked, setChecked }: {
  terms: Terms
  requiredConsents: Consent[]; optionalConsents: Consent[]
  checked: Record<string, boolean>; setChecked: (v: Record<string, boolean>) => void
}) {
  return (
    <div className="mt-6">
      <div className="bg-[#FFF8F0] border border-amber-100 rounded-2xl p-4 mb-4">
        <p className="text-sm font-bold text-gray-900 mb-2">Najważniejsze zasady</p>
        <ul className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
          <li>• <strong className="text-gray-900">Przyjdź na pierwsze zajęcia i zobacz.</strong> Jeśli nie podejdą, rezygnujesz bez żadnej opłaty.</li>
          <li>• Później płatność z góry, do 5. dnia każdego miesiąca.</li>
          <li>• Bez umów na rok — rezygnacja w każdej chwili, z miesięcznym wypowiedzeniem.</li>
        </ul>
        {terms && (
          <a href="/pl/terms-of-service" target="_blank" rel="noopener noreferrer"
            className="inline-block mt-3 text-xs font-bold text-[#23479E] underline">
            Przeczytaj pełny regulamin →
          </a>
        )}
      </div>

      <div className="space-y-2">
        {requiredConsents.map((c) => (
          <label key={c.id} className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={!!checked[c.id]}
              onChange={(e) => setChecked({ ...checked, [c.id]: e.target.checked })}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#23479E]" />
            <span className="text-xs text-gray-600">
              {c.label}<span className="text-red-500"> *</span>
              {c.description && <span className="block text-gray-400">{c.description}</span>}
            </span>
          </label>
        ))}
      </div>
      <ConsentList consents={optionalConsents} checked={checked} setChecked={setChecked} />
    </div>
  )
}

// Pole kodu polecenia. Wielkości liter nie ruszamy: kody mają postać
// uNickAnna8DJ9, a dopasowanie w bazie i tak jest bez rozróżniania wielkości.
function ReferralField({ value, onChange, fromLink }: {
  value: string
  onChange: (v: string) => void
  fromLink: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Kod polecenia <span className="text-gray-400 font-normal">(jeśli ktoś Wam nas polecił)</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="uNickAnna8DJ9"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#23479E]"
      />
      <p className="text-xs text-gray-500 mt-1">
        {fromLink
          ? 'Kod wczytany z linku. Możesz go zmienić.'
          : 'Po opłaceniu zajęć za 250 zł oboje dostaniecie po 50 zł na kolejne lekcje.'}
      </p>
    </div>
  )
}
