import Image from 'next/image'
import Link from 'next/link'
import Button from '../../components/Button'
import WinterWeekForm from '../../components/foundation/WinterWeekForm'
import JsonLd from '../../components/JsonLd'
import Reveal from '../../components/Reveal'
import { siteConfig } from '../../lib/site-config'
import { WINTER } from '@/lib/winter/event'
import styles from '../../[locale]/foundation/FoundationPage.module.css'

const title = `${WINTER.name}: ${WINTER.tagline}`
const description = `Pięć dni twórczej pracy młodzieży z różnych miejscowości w ramach Kreatorów Przyszłości. ${WINTER.dateLabel}, bezpłatnie, 20 uczestników w wieku 10–18 lat.`

const quickFacts = [
  [WINTER.dateLabel, 'termin'],
  ['5 dni · 9:00–15:00', 'łącznie 30 godzin z native speakerem'],
  ['0 zł', 'udział bezpłatny'],
  ['20 uczestników', 'zapewnione przekąski i ciepłe napoje'],
]

const conditions = [
  'wiek zgodny z przedziałem danej grupy,',
  'deklaracja regularnego udziału,',
  'akceptacja zasad projektu,',
  'oświadczenie uczestnika lub rodzica/opiekuna o zamieszkaniu w jednej z czterech gmin.',
]

export const metadata = {
  title,
  description,
  alternates: { canonical: WINTER.path },
  openGraph: {
    title: `${title} | uNick Academy`,
    description,
    url: `${siteConfig.url}${WINTER.path}`,
    locale: 'pl_PL',
    type: 'website',
    images: [{ url: WINTER.posterPath }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [WINTER.posterPath] },
}

export default function WinterWeekPage() {
  const url = `${siteConfig.url}${WINTER.path}`

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: WINTER.name,
          description,
          url,
          image: `${siteConfig.url}${WINTER.posterPath}`,
          startDate: '2027-02-22',
          endDate: '2027-02-26',
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          isAccessibleForFree: true,
          organizer: { '@type': 'NGO', name: 'UNICK ACADEMY FOUNDATION', url: `${siteConfig.url}/pl/foundation` },
        }}
      />

      <section className={styles.creatorsHero}>
        <div className={`container ${styles.creatorsHeroGrid}`}>
          <Reveal className={styles.creatorsPoster}>
            <Image
              src={WINTER.posterPath}
              alt={`Plakat ${WINTER.name}: Kreatywne ferie po angielsku, ${WINTER.dateLabel}`}
              width={WINTER.posterWidth}
              height={WINTER.posterHeight}
              priority
              sizes="(max-width: 860px) 88vw, 390px"
            />
          </Reveal>
          <Reveal className={styles.creatorsHeroCopy}>
            <Link href="/pl/foundation" className={styles.backLinkLight}>← Wróć do Fundacji</Link>
            <span className="eyebrow">{WINTER.tagline}</span>
            <h1>{WINTER.name}</h1>
            <p className={styles.creatorsLead}>
              <strong>Wasze pomysły, wspólne decyzje i jeden projekt, który stworzycie razem.</strong>
            </p>
            <p>
              Winter Project Week Fundacji <strong>UNICK ACADEMY FOUNDATION</strong> to pięć dni twórczej pracy, poznawania się i współpracy młodzieży z różnych miejscowości w ramach „Kreatorów Przyszłości”.
            </p>
            <p>
              To Wy wybierzecie wspólny rezultat, podzielicie się rolami i zdecydujecie, jak go zrealizować.
            </p>
            <p className={styles.creatorNoSchool}>Angielski będzie naturalnym narzędziem komunikacji, bez testów i wymaganego poziomu języka.</p>
            <Button href="#zapisy">Zgłoś udział</Button>
          </Reveal>
        </div>
        <div className={`container ${styles.creatorQuickFacts}`} aria-label="Najważniejsze informacje">
          {quickFacts.map(([value, label]) => <div key={value}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      </section>

      <section className={`section ${styles.creatorAudience}`}>
        <div className={`container ${styles.creatorAudienceGrid}`}>
          <Reveal>
            <span className="eyebrow">Dla kogo?</span>
            <h2>Dla młodzieży, która tworzy razem z nami</h2>
            <p>Dla młodzieży w wieku 10–18 lat, która brała udział w regularnych zajęciach projektu, zamieszkującej gminy Tarnowo Podgórne, Rokietnica, Kaźmierz lub Szamotuły.</p>
            <p><strong>Priorytet udziału mają osoby biorące udział w regularnych zajęciach „Kreatorów Przyszłości”.</strong></p>
          </Reveal>
          <Reveal>
            <h3 className={styles.creatorConditionsTitle}>Warunki uczestnictwa</h3>
            <ul className={styles.creatorAudienceList}>
              {conditions.map(point => <li key={point}><span aria-hidden="true">✓</span>{point}</li>)}
            </ul>
            <p className={styles.creatorLocationNote}>Można zgłaszać szczególne potrzeby organizacyjne i komunikacyjne. Kontakt: <a href={`mailto:${WINTER.contactEmail}`}>{WINTER.contactEmail}</a></p>
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.declaration}`} id="zapisy">
        <div className="container">
          <header className={styles.declarationIntro}>
            <span className="eyebrow">Zapisy na ferie</span>
            <h2>Zgłoś udział w Winter Project Week</h2>
            <div className={styles.creatorRegistrationCopy}>
              <p>Liczba miejsc jest ograniczona do <strong>20 uczestników</strong>. Wysłanie formularza nie gwarantuje miejsca, a o udziale poinformujemy po rozpatrzeniu zgłoszeń.</p>
              <p>Udział jest <strong>bezpłatny</strong>. Zapewniamy przekąski i ciepłe napoje.</p>
            </div>
          </header>
          <WinterWeekForm />
        </div>
      </section>

      <footer className={styles.creatorGrantNote}>
        <div className="container">
          <p><em>„Kreatorzy Przyszłości — program rozwoju kompetencji społecznych, przedsiębiorczych i kreatywności młodzieży” to projekt realizowany w ramach projektu grantowego Stowarzyszenia Lokalna Grupa Działania Dolina Samy „Aktywizacja społeczna w Dolinie Samy”, nr FEWP.09.06-IZ.00-0084/24, współfinansowanego ze środków Unii Europejskiej w ramach Europejskiego Funduszu Społecznego Plus oraz ze środków budżetu państwa w ramach programu Fundusze Europejskie dla Wielkopolski 2021–2027.</em></p>
          <p>#FunduszeUE #FunduszeEuropejskie</p>
        </div>
      </footer>
    </>
  )
}
