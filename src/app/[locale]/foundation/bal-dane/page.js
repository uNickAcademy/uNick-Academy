import { redirect } from 'next/navigation'
import Reveal from '../../../components/Reveal'
import { buildMetadata } from '../../../lib/seo'
import { foundationConfig } from '../../../lib/site-config'
import { BALL, PAYMENT } from '@/lib/ball/event'
import styles from '../FoundationPage.module.css'

// Informacja o przetwarzaniu danych dla The uNickorn Ball.
//
// Musi być osobna od tej pod /pl/foundation/privacy: tamta mówi wprost, że
// dotyczy WYŁĄCZNIE deklaracji zainteresowania projektem „Kreatorzy
// Przyszłości", więc podpięcie jej pod formularz balu wprowadzałoby w błąd.
// Regulamin (§8 ust. 1) wymaga, żeby informacja była dostępna przy formularzu
// przed jego wysłaniem, a potrzeby żywieniowe mają mieć własną podstawę
// (§8 ust. 2).
//
// Treść wynika z regulaminu balu i z ustawowych okresów przechowywania.
// Przed szeroką promocją wydarzenia warto dać ją do przejrzenia prawnikowi.

const f = foundationConfig

const SECTIONS = [
  {
    title: 'Administrator danych',
    text: `Administratorem danych podanych w formularzu zgłoszeniowym na ${BALL.name} jest ${f.legalName}, `
      + `${f.address.streetAddress}, ${f.address.village}, ${f.address.postalCode} ${f.address.addressLocality}, `
      + `KRS ${f.krs}, NIP ${f.nip}, REGON ${f.regon}. Kontakt w sprawie danych: ${BALL.contactEmail}.`,
  },
  {
    title: 'Jakie dane zbieramy',
    text: 'Imię i nazwisko, adres e-mail oraz numer telefonu osoby zgłaszającej, imiona i nazwiska zgłaszanych gości, '
      + 'liczbę i rodzaj biletów, a także, jeśli zostaną podane, prośbę dotyczącą stolika oraz informacje o potrzebach '
      + 'żywieniowych. Nie zbieramy żadnych innych danych i nie profilujemy nikogo.',
  },
  {
    title: 'Cel i podstawa przetwarzania',
    text: 'Dane osoby zgłaszającej i gości przetwarzamy, aby obsłużyć zgłoszenie, zawrzeć i wykonać umowę udziału '
      + 'w balu, kontaktować się w sprawach organizacyjnych, rozliczyć wpłatę oraz rozpatrzyć ewentualną reklamację. '
      + 'Podstawą jest wykonanie umowy oraz prawnie uzasadniony interes Fundacji polegający na organizacji wydarzenia '
      + 'i kontakcie z jego uczestnikami, a w zakresie rozliczeń, obowiązek prawny.',
  },
  {
    title: 'Potrzeby żywieniowe i alergie',
    text: 'Podanie informacji o diecie lub alergiach jest całkowicie dobrowolne, a zgłoszenie można wysłać bez nich. '
      + 'Informacje te mogą ujawniać dane dotyczące zdrowia, dlatego przetwarzamy je wyłącznie na podstawie osobnej, '
      + 'wyraźnej zgody zaznaczanej przy tym polu. Wykorzystujemy je jedynie po to, aby ustalić z hotelem możliwość '
      + 'przygotowania posiłku, i przekazujemy hotelowi tylko w tym zakresie. Zgodę można wycofać w każdej chwili, '
      + `pisząc na ${BALL.contactEmail}; wycofanie nie wpływa na zgodność z prawem przetwarzania sprzed wycofania.`,
  },
  {
    title: 'Dane gości zgłaszanych przez inną osobę',
    text: 'Osoba zgłaszająca podaje imiona i nazwiska pozostałych gości, aby przygotować listę uczestników i plan '
      + 'stolików. Prosimy, aby poinformowała te osoby o zgłoszeniu i wskazała im tę informację. Dane gości '
      + 'wykorzystujemy wyłącznie do obsługi wydarzenia.',
  },
  {
    title: 'Komu przekazujemy dane',
    text: `Hotelowi, w którym odbywa się bal (${BALL.venue}, ${BALL.city}), w zakresie potrzebnym do przygotowania `
      + 'sali i posiłków. Dostawcom usług informatycznych, z których korzystamy przy prowadzeniu strony, bazy '
      + 'zgłoszeń i poczty, na podstawie umów powierzenia. Bankowi prowadzącemu rachunek Fundacji, w zakresie '
      + 'rozliczenia wpłaty. Poza tym nikomu, a danych nie sprzedajemy ani nie wykorzystujemy do promocji kursów.',
  },
  {
    title: 'Jak długo przechowujemy dane',
    text: 'Dane związane ze zgłoszeniem przechowujemy do czasu rozliczenia wydarzenia i upływu terminu na zgłoszenie '
      + 'reklamacji, a dokumenty rozliczeniowe przez okres wymagany przepisami o rachunkowości, czyli pięć lat '
      + 'liczonych od końca roku, w którym nastąpiło rozliczenie. Informacje o potrzebach żywieniowych usuwamy '
      + 'niezwłocznie po zakończeniu balu.',
  },
  {
    title: 'Twoje prawa',
    text: 'Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia lub ograniczenia przetwarzania, prawo do '
      + 'przenoszenia danych oraz prawo sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie. '
      + 'W zakresie danych przetwarzanych na podstawie zgody masz prawo wycofać ją w dowolnym momencie. Przysługuje '
      + 'Ci też prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.',
  },
  {
    title: 'Czy podanie danych jest obowiązkowe',
    text: 'Podanie imienia i nazwiska, adresu e-mail, numeru telefonu oraz danych gości jest niezbędne, aby przyjąć '
      + 'zgłoszenie i potwierdzić udział. Prośba o stolik i informacje o potrzebach żywieniowych są dobrowolne.',
  },
]

export async function generateMetadata({ params }) {
  const { locale } = await params
  if (locale !== 'pl') return { robots: { index: false } }
  return buildMetadata({
    locale,
    path: '/foundation/bal-dane',
    title: `Informacja o przetwarzaniu danych | ${BALL.name}`,
    description: `Jak UNICK ACADEMY FOUNDATION przetwarza dane podane w zgłoszeniu na ${BALL.name}.`,
    availableLocales: ['pl'],
  })
}

export default async function Page({ params }) {
  const { locale } = await params
  if (locale !== 'pl') redirect('/pl/foundation/bal-dane')

  return (
    <main className={styles.privacy}>
      <div className="container">
        <Reveal as="article">
          <span className="eyebrow">uNick Academy Foundation</span>
          <h1>Informacja o przetwarzaniu danych</h1>
          <small>Dotyczy zgłoszeń na {BALL.name}, {BALL.dateLabel}</small>
          <p className={styles.privacyIntro}>
            Poniższa informacja dotyczy danych podanych w formularzu zgłoszeniowym na {BALL.name}.
            Deklaracji zainteresowania projektem „Kreatorzy Przyszłości” dotyczy{' '}
            <a href="/pl/foundation/privacy">osobna informacja</a>.
          </p>
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ))}
          <section>
            <h2>Regulamin i kontakt</h2>
            <p>
              Zasady udziału opisuje{' '}
              <a href={BALL.termsPath} target="_blank" rel="noreferrer">regulamin wydarzenia</a>.
              Wpłaty przyjmujemy na rachunek {PAYMENT.iban} prowadzony dla {PAYMENT.recipient}.
              Pytania i reklamacje: <a href={`mailto:${BALL.contactEmail}`}>{BALL.contactEmail}</a>.
            </p>
          </section>
        </Reveal>
      </div>
    </main>
  )
}
