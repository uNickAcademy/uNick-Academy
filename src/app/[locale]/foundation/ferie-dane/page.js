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

const SECTIONS_EN = [
  {
    title: 'Data controller',
    text: `The controller of the data provided in the ${WINTER.name} registration form is ${f.legalName}, `
      + `${f.address.streetAddress}, ${f.address.village}, ${f.address.postalCode} ${f.address.addressLocality}, Poland, `
      + `KRS ${f.krs}, NIP ${f.nip}, REGON ${f.regon}. Contact regarding data: ${WINTER.contactEmail}.`,
  },
  {
    title: 'What data we collect',
    text: "The participant's first and last name, date of birth, municipality of residence, whether they attend the regular "
      + "Creators of the Future classes and which groups, optional organisational and communication needs, and the contact "
      + "details of the parent, guardian or adult participant. We do not ask for an exact address, PESEL number or detailed medical data.",
  },
  {
    title: 'Purpose and legal basis',
    text: 'The data is processed to handle the submission, check the conditions of participation, consider submissions giving '
      + 'priority to participants of the regular classes, and contact you about participation. The basis is voluntary consent, '
      + 'which can be withdrawn at any time without affecting the lawfulness of earlier processing.',
  },
  {
    title: 'Organisational needs',
    text: 'Providing information about special needs is voluntary and a submission can be sent without it. We use it only '
      + 'to prepare the event better. Please do not provide detailed medical data.',
  },
  {
    title: 'Who we share data with',
    text: 'Authorised persons acting for the Foundation and IT service providers we use to run the website, the submissions '
      + 'database and email have access to the data, under processing agreements and only on the Foundation\'s instructions. '
      + 'We do not sell data or use it for a newsletter, general marketing or promoting paid courses.',
  },
  {
    title: 'How long we keep data',
    text: 'We keep the data until the submissions have been considered and the event has ended, or until consent is withdrawn '
      + 'earlier. We then delete it, unless further storage is required to establish, pursue or defend legal claims or by '
      + 'project regulations.',
  },
  {
    title: 'Your rights',
    text: 'You have the right to access your data, rectify it, erase it, restrict its processing, transfer it and withdraw '
      + 'consent. You also have the right to lodge a complaint with the President of the Personal Data Protection Office (UODO).',
  },
  {
    title: 'Is providing data mandatory',
    text: 'Providing data is voluntary but necessary to send the submission and to be contacted about participation. '
      + 'Information about special needs is voluntary.',
  },
]

export async function generateMetadata({ params }) {
  const { locale } = await params
  if (!['pl', 'en'].includes(locale)) return { robots: { index: false } }
  const en = locale === 'en'
  return buildMetadata({
    locale,
    path: '/foundation/ferie-dane',
    title: en ? `Data processing information | ${WINTER.name}` : `Informacja o przetwarzaniu danych | ${WINTER.name}`,
    description: en
      ? `How UNICK ACADEMY FOUNDATION processes the data provided in the ${WINTER.name} registration.`
      : `Jak UNICK ACADEMY FOUNDATION przetwarza dane podane w zgłoszeniu na ${WINTER.name}.`,
  })
}

export default async function Page({ params }) {
  const { locale } = await params
  if (!['pl', 'en'].includes(locale)) redirect('/pl/foundation/ferie-dane')
  const en = locale === 'en'

  return (
    <main className={styles.privacy}>
      <div className="container">
        <Reveal as="article">
          <span className="eyebrow">uNick Academy Foundation</span>
          <h1>{en ? 'Data processing information' : 'Informacja o przetwarzaniu danych'}</h1>
          <small>{en ? `Applies to ${WINTER.name} registrations, 22–26 February 2027` : `Dotyczy zgłoszeń na ${WINTER.name}, ${WINTER.dateLabel}`}</small>
          <p className={styles.privacyIntro}>
            {en ? (
              <>
                The information below applies to the data provided in the {WINTER.name} registration form.
                The expression of interest in the regular classes is covered by{' '}
                <a href="/en/foundation/privacy">a separate notice</a>.
              </>
            ) : (
              <>
                Poniższa informacja dotyczy danych podanych w formularzu zgłoszeniowym na {WINTER.name}.
                Deklaracji zainteresowania zajęciami regularnymi dotyczy{' '}
                <a href="/pl/foundation/privacy">osobna informacja</a>.
              </>
            )}
          </p>
          {(en ? SECTIONS_EN : SECTIONS).map((s) => (
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
