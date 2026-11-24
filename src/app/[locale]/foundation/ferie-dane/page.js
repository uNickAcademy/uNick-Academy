import { redirect } from 'next/navigation'
import Reveal from '../../../components/Reveal'
import { buildMetadata } from '../../../lib/seo'
import { foundationConfig } from '../../../lib/site-config'
import { WINTER } from '@/lib/winter/event'
import styles from '../FoundationPage.module.css'

// Informacja o przetwarzaniu danych dla zgłoszeń na Winter Project Week.
//
// Osobna od /pl/foundation/privacy, bo tamta dotyczy wyłącznie deklaracji
// zainteresowania zajęciami regularnymi. Treść oparta jest na tamtej
// informacji (podstawą jest zgoda). Przed szeroką promocją wydarzenia warto
// dać ją do przejrzenia, zwłaszcza pod kątem obowiązków wobec grantodawcy.

const f = foundationConfig

const SECTIONS = [
  {
    title: 'Administrator danych',
    text: `Administratorem danych podanych w formularzu zgłoszeniowym na ${WINTER.name} jest ${f.legalName}, `
      + `${f.address.streetAddress}, ${f.address.village}, ${f.address.postalCode} ${f.address.addressLocality}, `
      + `KRS ${f.krs}, NIP ${f.nip}, REGON ${f.regon}. Kontakt w sprawie danych: ${WINTER.contactEmail}.`,
  },
  {
    title: 'Jakie dane zbieramy',
    text: 'Imię i nazwisko uczestnika, datę urodzenia, gminę zamieszkania, informację o udziale w regularnych zajęciach '
      + '„Kreatorów Przyszłości” i wskazane grupy, opcjonalne potrzeby organizacyjne i komunikacyjne oraz dane kontaktowe '
      + 'rodzica, opiekuna lub pełnoletniego uczestnika. Nie prosimy o dokładny adres, PESEL ani szczegółowe dane medyczne.',
  },
  {
    title: 'Cel i podstawa przetwarzania',
    text: 'Dane są przetwarzane w celu obsługi zgłoszenia, sprawdzenia warunków udziału, rozpatrzenia zgłoszeń z uwzględnieniem '
      + 'pierwszeństwa osób z regularnych zajęć oraz kontaktu w sprawie udziału. Podstawą jest dobrowolna zgoda, którą można '
      + 'wycofać w dowolnym momencie bez wpływu na zgodność z prawem wcześniejszego przetwarzania.',
  },
  {
    title: 'Potrzeby organizacyjne',
    text: 'Podanie informacji o szczególnych potrzebach jest dobrowolne, a zgłoszenie można wysłać bez nich. Wykorzystujemy '
      + 'je wyłącznie po to, aby lepiej przygotować wydarzenie. Prosimy nie podawać szczegółowych danych medycznych.',
  },
  {
    title: 'Komu przekazujemy dane',
    text: 'Dostęp do danych mają upoważnione osoby działające dla Fundacji oraz dostawcy usług informatycznych, z których '
      + 'korzystamy przy prowadzeniu strony, bazy zgłoszeń i poczty, na podstawie umów powierzenia i wyłącznie zgodnie '
      + 'z poleceniami Fundacji. Danych nie sprzedajemy ani nie wykorzystujemy do newslettera, ogólnego marketingu '
      + 'czy promocji płatnych kursów.',
  },
  {
    title: 'Jak długo przechowujemy dane',
    text: 'Dane przechowujemy do czasu rozpatrzenia zgłoszeń i zakończenia wydarzenia albo do wcześniejszego wycofania '
      + 'zgody. Następnie je usuwamy, chyba że dalsze przechowywanie jest wymagane do ustalenia, dochodzenia lub obrony '
      + 'roszczeń albo przepisami dotyczącymi projektu.',
  },
  {
    title: 'Twoje prawa',
    text: 'Przysługuje prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia '
      + 'danych oraz wycofania zgody. Przysługuje także prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.',
  },
  {
    title: 'Czy podanie danych jest obowiązkowe',
    text: 'Podanie danych jest dobrowolne, ale niezbędne do przesłania zgłoszenia i kontaktu w sprawie udziału. '
      + 'Informacje o szczególnych potrzebach są dobrowolne.',
  },
]

export async function generateMetadata({ params }) {
  const { locale } = await params
  if (locale !== 'pl') return { robots: { index: false } }
  return buildMetadata({
    locale,
    path: '/foundation/ferie-dane',
    title: `Informacja o przetwarzaniu danych | ${WINTER.name}`,
    description: `Jak UNICK ACADEMY FOUNDATION przetwarza dane podane w zgłoszeniu na ${WINTER.name}.`,
    availableLocales: ['pl'],
  })
}

export default async function Page({ params }) {
  const { locale } = await params
  if (locale !== 'pl') redirect('/pl/foundation/ferie-dane')

  return (
    <main className={styles.privacy}>
      <div className="container">
        <Reveal as="article">
          <span className="eyebrow">uNick Academy Foundation</span>
          <h1>Informacja o przetwarzaniu danych</h1>
          <small>Dotyczy zgłoszeń na {WINTER.name}, {WINTER.dateLabel}</small>
          <p className={styles.privacyIntro}>
            Poniższa informacja dotyczy danych podanych w formularzu zgłoszeniowym na {WINTER.name}.
            Deklaracji zainteresowania zajęciami regularnymi dotyczy{' '}
            <a href="/pl/foundation/privacy">osobna informacja</a>.
          </p>
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ))}
        </Reveal>
      </div>
    </main>
  )
}
