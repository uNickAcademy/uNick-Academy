import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Button from '../../components/Button'
import WinterWeekForm from '../../components/foundation/WinterWeekForm'
import JsonLd from '../../components/JsonLd'
import Reveal from '../../components/Reveal'
import { siteConfig } from '../../lib/site-config'
import { WINTER } from '@/lib/winter/event'
import styles from '../foundation/FoundationPage.module.css'

// Angielska wersja strony /ferie. Polska wersja żyje pod /ferie
// (poza routingiem [locale]); /pl/ferie przekierowuje do niej.

const DATE_LABEL = '22–26 February 2027'
const title = `${WINTER.name}: winter holidays with an idea`
const description = `Five days of creative work for young people from different towns as part of Creators of the Future. ${DATE_LABEL}, free of charge, 20 participants aged 10+.`

const quickFacts = [
  [DATE_LABEL, 'dates'],
  ['5 days · 9:00–15:00', '30 hours in total with a native speaker'],
  ['PLN 0', 'free of charge'],
  ['20 participants', 'snacks and hot drinks provided'],
]

const conditions = [
  'age matching the range of the given group,',
  'a declaration of regular attendance,',
  'acceptance of the project rules,',
  'a statement by the participant or parent/guardian that they live in one of the four municipalities.',
]

export async function generateMetadata({ params }) {
  const { locale } = await params
  if (locale !== 'en') return { robots: { index: false, follow: false }, alternates: { canonical: WINTER.path } }
  return {
    title,
    description,
    alternates: {
      canonical: '/en/ferie',
      languages: { pl: WINTER.path, en: '/en/ferie', 'x-default': WINTER.path },
    },
    openGraph: {
      title: `${title} | uNick Academy`,
      description,
      url: `${siteConfig.url}/en/ferie`,
      locale: 'en_GB',
      type: 'website',
      images: [{ url: WINTER.posterPath }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [WINTER.posterPath] },
  }
}

export default async function WinterWeekPage({ params }) {
  const { locale } = await params
  if (locale !== 'en') redirect(WINTER.path)

  const url = `${siteConfig.url}/en/ferie`

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: WINTER.name,
          description,
          url,
          inLanguage: 'en',
          image: `${siteConfig.url}${WINTER.posterPath}`,
          startDate: '2027-02-22',
          endDate: '2027-02-26',
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          isAccessibleForFree: true,
          organizer: { '@type': 'NGO', name: 'UNICK ACADEMY FOUNDATION', url: `${siteConfig.url}/en/foundation` },
        }}
      />

      <section className={styles.creatorsHero}>
        <div className={`container ${styles.creatorsHeroGrid}`}>
          <Reveal className={styles.creatorsPoster}>
            <Image
              src={WINTER.posterPath}
              alt={`${WINTER.name} poster: creative winter holidays in English, ${DATE_LABEL}`}
              width={WINTER.posterWidth}
              height={WINTER.posterHeight}
              priority
              sizes="(max-width: 860px) 88vw, 390px"
            />
          </Reveal>
          <Reveal className={styles.creatorsHeroCopy}>
            <Link href="/en/foundation" className={styles.backLinkLight}>← Back to the Foundation</Link>
            <span className="eyebrow">Winter holidays with an idea</span>
            <h1>{WINTER.name}</h1>
            <p className={styles.creatorsLead}>
              <strong>Your ideas, shared decisions and one project that you create together.</strong>
            </p>
            <p>
              Winter Project Week by <strong>UNICK ACADEMY FOUNDATION</strong> is five days of creative work, getting to know each other and collaborating for young people from different towns as part of "Creators of the Future".
            </p>
            <p>
              You choose the shared result, divide the roles and decide how to make it happen.
            </p>
            <p className={styles.creatorNoSchool}>English will be a natural tool for communication, with no tests and no required level.</p>
            <Button href="#zapisy">Sign up</Button>
          </Reveal>
        </div>
        <div className={`container ${styles.creatorQuickFacts}`} aria-label="Key information">
          {quickFacts.map(([value, label]) => <div key={value}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      </section>

      <section className={`section ${styles.creatorAudience}`}>
        <div className={`container ${styles.creatorAudienceGrid}`}>
          <Reveal>
            <span className="eyebrow">Who is it for?</span>
            <h2>For young people who create together with us</h2>
            <p>For young people aged 10+ who have taken part in the project's regular classes and live in the municipalities of Tarnowo Podgórne, Rokietnica, Kaźmierz or Szamotuły.</p>
            <p><strong>Priority goes to participants of the regular "Creators of the Future" classes.</strong></p>
          </Reveal>
          <Reveal>
            <h3 className={styles.creatorConditionsTitle}>Conditions of participation</h3>
            <ul className={styles.creatorAudienceList}>
              {conditions.map(point => <li key={point}><span aria-hidden="true">✓</span>{point}</li>)}
            </ul>
            <p className={styles.creatorLocationNote}>Special organisational and communication needs can be reported. Contact: <a href={`mailto:${WINTER.contactEmail}`}>{WINTER.contactEmail}</a></p>
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.declaration}`} id="zapisy">
        <div className="container">
          <header className={styles.declarationIntro}>
            <span className="eyebrow">Winter week sign-up</span>
            <h2>Sign up for Winter Project Week</h2>
            <div className={styles.creatorRegistrationCopy}>
              <p>The number of places is limited to <strong>20 participants</strong>. Submitting the form does not guarantee a place, and we will let you know about participation after reviewing the submissions.</p>
              <p>Participation is <strong>free</strong>. We provide snacks and hot drinks.</p>
            </div>
          </header>
          <WinterWeekForm locale="en" />
        </div>
      </section>

      <footer className={styles.creatorGrantNote}>
        <div className="container">
          <p><em>"Creators of the Future: a programme developing social, entrepreneurial and creative competences of young people" is a project carried out under the grant project of the Local Action Group Dolina Samy Association, "Social activation in the Sama Valley", no. FEWP.09.06-IZ.00-0084/24, co-financed by the European Union from the European Social Fund Plus and from the state budget under the European Funds for Wielkopolska 2021–2027 programme.</em></p>
          <p>#FunduszeUE #FunduszeEuropejskie</p>
        </div>
      </footer>
    </>
  )
}
