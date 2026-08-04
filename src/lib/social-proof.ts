// Opinie z profilu uNick Academy na Facebooku, cytowane dosłownie.
//
// Pokazujemy je w kreatorze zapisów w momencie decyzji, dobrane do tego, kogo
// dotyczy zapis — rodzic ośmiolatka ma zobaczyć opinię innego rodzica, a nie
// dorosłego uczącego się do egzaminu. Zimny odbiorca z reklamy nie zna szkoły
// i nie ma powodu, żeby jej zaufać; to jest ten powód.
//
// Zasada: nie skracamy tak, żeby zmienić sens, i nie zmyślamy autorów.
// Skracamy wyłącznie przez wycięcie fragmentu, zaznaczone wielokropkiem.

export type ProofSegment = 'child_young' | 'child' | 'teen' | 'adult' | 'online'

export type Testimonial = {
  quote: string
  author: string
  date: string
  /** Segmenty, w których ta opinia trafia najlepiej. */
  segments: ProofSegment[]
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Dziewczynki są bardzo zadowolone, z każdej lekcji przychodzą z nowymi słówkami — 4 latka mimo, że nie rozumie wszystkiego, to zapamiętuje zwroty i w domu dopytuje o ich znaczenie. Nauka przez zabawę, wspólne gry, rysowanie, śpiewanie — polecamy w 100%!',
    author: 'Mirosława Rybińska',
    date: 'luty 2024',
    segments: ['child_young'],
  },
  {
    quote: 'Prowadzi zajęcia z moim synem i widzę duże postępy — przede wszystkim w mówieniu i pewności siebie. Zajęcia są ciekawe, dostosowane do poziomu dziecka i prowadzone w bardzo przyjaznej atmosferze.',
    author: 'Basia',
    date: 'lipiec 2025',
    segments: ['child', 'child_young'],
  },
  {
    quote: 'Mój syn niecierpiący języka angielskiego, gdyż skutecznie został do niego zniechęcony w LO, przez całe wakacje codziennie spotykał się na zoom z native speakerem i rozmawiał… Nie trzeba go było do tego namawiać ani pilnować. (…) Polecam, gdyż wcześniej już wiele szkół próbowaliśmy i się nie sprawdziły, a teraz chętnie się uczy i rozmawia w języku angielskim.',
    author: 'Joanna Sobierajska',
    date: 'wrzesień 2023',
    segments: ['teen'],
  },
  {
    quote: 'Dzięki tej szkole zaczęłam nie bać się mówić po angielsku. Polecam z czystym sumieniem każdemu, kto chce przełamać barierę językową i zyskać pewność w codziennej komunikacji.',
    author: 'Martyna Bochyńska',
    date: 'wrzesień 2025',
    segments: ['adult'],
  },
  {
    quote: 'Po wielu latach przerwy w nauce języka zapisałam się do uNick Academy. (…) Dzięki uNick Academy coraz mniej boję się mówić w języku angielskim. Dziękuję, że do Was trafiłam.',
    author: 'Magdalena Pawłowska',
    date: 'czerwiec 2023',
    segments: ['adult'],
  },
  {
    quote: 'Na początku nie byłam przekonana co do formy online, a teraz nie zamieniłabym jej na inną. Odpada logistyka, łączyliśmy się z każdego miejsca, w którym akurat jesteśmy.',
    author: 'Ola Lurc',
    date: 'grudzień 2020',
    segments: ['online'],
  },
  {
    quote: 'Syn korzysta z lekcji online z native. I po raz pierwszy od dawna z radością chodzi na lekcje. Polubił angielski i widzę postępy. Lekcje są kreatywne, ciekawe, zabawne.',
    author: 'Katarzyna Paluszkiewicz',
    date: 'kwiecień 2022',
    segments: ['online', 'child'],
  },
]

// Dobór opinii do kontekstu. Kolejność ma znaczenie: najpierw najwęższe
// dopasowanie (wiek), potem forma zajęć, na końcu cokolwiek sensownego —
// żeby nigdy nie zostać z pustym miejscem tam, gdzie miał być dowód.
export function pickTestimonial(opts: {
  audience?: 'self' | 'child' | 'company' | 'unsure' | null
  age?: number | null
  online?: boolean
  /** Pozwala pokazać różne opinie w dwóch miejscach tej samej ścieżki. */
  skip?: string
  /** Wymusza segment na początek kolejki — np. „online” tuż przed decyzją. */
  prefer?: ProofSegment
}): Testimonial | null {
  const { audience, age, online, skip, prefer } = opts

  const wanted: ProofSegment[] = []
  if (prefer) wanted.push(prefer)
  if (audience === 'child') {
    if (age != null && age <= 6) wanted.push('child_young')
    if (age != null && age >= 13) wanted.push('teen')
    wanted.push('child')
  } else if (audience === 'self') {
    wanted.push('adult')
  }
  if (online) wanted.push('online')
  if (wanted.length === 0) wanted.push('adult', 'child')

  // Kto wybrał zajęcia w Rumianku, nie powinien dostać opinii o lekcjach
  // online — brzmi, jakbyśmy nie słuchali tego, co przed chwilą wybrał.
  const pool = online === false
    ? TESTIMONIALS.filter((t) => !t.segments.includes('online'))
    : TESTIMONIALS

  for (const seg of wanted) {
    const hit = pool.find((t) => t.segments.includes(seg) && t.author !== skip)
    if (hit) return hit
  }
  return pool.find((t) => t.author !== skip) ?? null
}
