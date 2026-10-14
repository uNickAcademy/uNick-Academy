import Image from 'next/image'
import Link from 'next/link'
import BallForm from '../../components/foundation/BallForm'
import JsonLd from '../../components/JsonLd'
import { BALL, TICKETS } from '@/lib/ball/event'
import { siteConfig } from '../../lib/site-config'
import styles from '../../[locale]/foundation/FoundationPage.module.css'

const title = `${BALL.name} – ${BALL.subtitle}`
const description = `Magiczny Bal Charytatywny ${BALL.dateLabel} w ${BALL.venue} w Tarnowie Podgórnym. Zgłoś udział i wesprzyj zajęcia edukacyjne dla dzieci.`

export const metadata = {
  title,
  description,
  alternates: { canonical: '/ball' },
  openGraph: {
    title: `${title} | uNick Academy`,
    description,
    url: `${siteConfig.url}/ball`,
    locale: 'pl_PL',
    type: 'website',
    images: [{ url: BALL.posterPath }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [BALL.posterPath] },
}

export default function BallPage() {
  const url = `${siteConfig.url}/ball`

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: BALL.name,
          description,
          url,
          image: `${siteConfig.url}${BALL.posterPath}`,
          startDate: BALL.startISO,
          endDate: BALL.endISO,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: BALL.venue,
            address: {
              '@type': 'PostalAddress',
              addressLocality: BALL.city,
              addressCountry: 'PL',
            },
          },
          organizer: {
            '@type': 'NGO',
            name: 'UNICK ACADEMY FOUNDATION',
            url: `${siteConfig.url}/pl/foundation`,
          },
        }}
      />

      <section className={styles.ball} aria-labelledby="ball-title">
        <div className="container">
          <Link href="/pl/foundation#bal" className={styles.backLink}>← Wróć do Fundacji</Link>
          <div className={styles.ballGrid}>
            <figure className={styles.ballPoster}>
              <Image
                src={BALL.posterPath}
                alt={`Plakat wydarzenia ${BALL.name}, ${BALL.dateLabel}`}
                width={1145}
                height={1374}
                priority
                sizes="(max-width: 860px) 90vw, 340px"
              />
            </figure>
            <div className={styles.ballIntro}>
              <span className={styles.ballEyebrow}>Wydarzenie charytatywne Fundacji</span>
              <h1 id="ball-title" className={styles.ballTitle}>{BALL.name}</h1>
              <p className={styles.ballSubtitle}>{BALL.subtitle}</p>
              <p className={styles.ballLead}>
                Wieczór z kolacją, muzyką i tańcem, z którego dochód wraca do dzieci z naszej gminy.
                Liczba miejsc jest ograniczona, a o ich przydziale decyduje kolejność opłaconych zgłoszeń.
              </p>
              <dl className={styles.ballFacts}>
                <div className={styles.ballFact}><dt>Data</dt><dd>{BALL.dateLabel}</dd></div>
                <div className={styles.ballFact}><dt>Godziny</dt><dd>{BALL.timeLabel}</dd></div>
                <div className={styles.ballFact}><dt>Miejsce</dt><dd>{BALL.venue}, {BALL.city}</dd></div>
                <div className={styles.ballFact}><dt>Bilet</dt><dd>{TICKETS.single.price} zł / os. · {TICKETS.couple.price} zł para</dd></div>
              </dl>
              <ul className={styles.ballIncluded}>
                <li>Kolacja</li>
                <li>Oprawa muzyczna z DJ-em</li>
                <li>Fotobudka</li>
              </ul>
              <p className={styles.ballPurpose}>
                Organizatorem jest UNICK ACADEMY FOUNDATION. Dochód z balu, czyli wpływy pomniejszone
                o koszty organizacji, przeznaczymy na zajęcia edukacyjne dla dzieci z gminy Tarnowo
                Podgórne. Po wydarzeniu podamy, ile udało się zebrać i na co poszło.
              </p>
              <p className={styles.ballTerms}>
                Przed zgłoszeniem prosimy o zapoznanie się z{' '}
                <a href={BALL.termsPath} target="_blank" rel="noreferrer">regulaminem wydarzenia</a>.
              </p>
            </div>
          </div>
          <div className={styles.ballFormWrap}>
            <header className={styles.ballFormHead}>
              <h2>Zgłoś udział</h2>
              <p>
                Wysłanie formularza rezerwuje miejsca. Dane do wpłaty wyślemy e-mailem,
                a udział potwierdzimy po zaksięgowaniu płatności.
              </p>
            </header>
            <BallForm />
          </div>
        </div>
      </section>
    </>
  )
}
