import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Button from '../../components/Button'
import FoundationInterestForm from '../../components/foundation/FoundationInterestForm'
import JsonLd from '../../components/JsonLd'
import Reveal from '../../components/Reveal'
import SectionHeading from '../../components/SectionHeading'
import { getDictionary } from '../../lib/dictionaries'
import { siteConfig } from '../../lib/site-config'
import { projectSchedule } from '@/lib/foundation/schedule'
import { dayLabel, placeLabel, venueLabel } from '@/lib/foundation/i18n'
import styles from '../foundation/FoundationPage.module.css'

// Angielska wersja strony /creators. Polska wersja żyje pod /creators
// (poza routingiem [locale]); /pl/creators przekierowuje do niej.

const title = 'Creators of the Future: free classes for children and young people'
const description = 'A free programme developing creativity, entrepreneurship and social skills for children and young people aged 10+ from four municipalities near Poznań.'

const courseVisuals = {
  teenpreneurs: { image: '/foundation/creators/teenpreneurs-ben.jpg', emoji: '💡', alt: 'Ben and young people working on an idea together during Teenpreneurs classes' },
  podcasts_audio_video: { image: '/foundation/creators/podcasts-ben.jpg', emoji: '🎙️', alt: 'Ben and young people recording a podcast in a bright studio' },
  teenage_talk: { image: '/foundation/creators/teenage-talk-ben.jpg', emoji: '💬', alt: 'Ben talking with a group of young people during Teenage Talk classes' },
  art_performance_9_13: { image: '/foundation/creators/art-performance-ben.jpg', emoji: '🎭', alt: 'Ben and young people during creative movement and art classes' },
}

const quickFacts = [
  ['10+', 'age of participants'],
  ['4 municipalities', 'local groups'],
  ['PLN 0', 'free of charge'],
  ['about 6 months', 'programme length'],
]

const audiencePoints = [
  'are aged 10+ and live in one of the four municipalities listed,',
  'want to develop their interests and meet new people,',
  'like creating, talking, experimenting or would like to try something new,',
  'want to gain the courage to communicate in English.',
]

const organizationFacts = [
  ['Cost', 'PLN 0, completely free'],
  ['Start', 'November 2026'],
  ['Duration', 'about 6 months'],
  ['Number of groups', '8, two in each municipality'],
  ['Places', '12 people per group'],
  ['Organiser', 'uNick Academy Foundation'],
]

export async function generateMetadata({ params }) {
  const { locale } = await params
  if (locale !== 'en') return { robots: { index: false, follow: false }, alternates: { canonical: '/creators' } }
  return {
    title,
    description,
    alternates: {
      canonical: '/en/creators',
      languages: { pl: '/creators', en: '/en/creators', 'x-default': '/creators' },
    },
    openGraph: {
      title: `${title} | uNick Academy`,
      description,
      url: `${siteConfig.url}/en/creators`,
      locale: 'en_GB',
      type: 'website',
      images: [{ url: '/foundation/kreatorzy-przyszlosci-card-v2.png' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/foundation/kreatorzy-przyszlosci-card-v2.png'] },
  }
}

function CourseCard({ course }) {
  const visual = courseVisuals[course.id]
  return (
    <Reveal as="article" className={styles.creatorCourseCard}>
      <div className={styles.creatorCourseImage}>
        <Image src={visual.image} alt={visual.alt} width={1536} height={1024} sizes="(max-width: 700px) 100vw, 50vw" />
      </div>
      <div className={styles.creatorCourseBody}>
        <div className={styles.creatorCourseMeta}>
          <span aria-hidden="true">{visual.emoji}</span>
          <span>{course.age}</span>
        </div>
        <h3>{course.title}</h3>
        <p>{course.intro}</p>
      </div>
    </Reveal>
  )
}

export default async function CreatorsPage({ params }) {
  const { locale } = await params
  if (locale !== 'en') redirect('/creators')

  const copy = getDictionary('en').foundation
  const url = `${siteConfig.url}/en/creators`

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'EducationalOccupationalProgram',
          url,
          name: title,
          description,
          inLanguage: 'en',
          provider: { '@type': 'Organization', name: 'uNick Academy Foundation', url: siteConfig.url },
          timeToComplete: 'P6M',
          isAccessibleForFree: true,
        }}
      />

      <section className={styles.creatorsHero}>
        <div className={`container ${styles.creatorsHeroGrid}`}>
          <Reveal className={styles.creatorsPoster}>
            <Image
              src="/foundation/kreatorzy-przyszlosci-card-v2.png"
              alt="Creators of the Future, free classes for young people"
              width={1122}
              height={1402}
              priority
              sizes="(max-width: 860px) 88vw, 390px"
            />
          </Reveal>
          <Reveal className={styles.creatorsHeroCopy}>
            <Link href="/en/foundation" className={styles.backLinkLight}>← Back to the Foundation</Link>
            <span className="eyebrow">A free programme for young people</span>
            <h1>Creators of the Future</h1>
            <p className={styles.creatorsLead}>
              <strong>A free programme developing creativity, entrepreneurship and social skills for children and young people aged 10+.</strong>
            </p>
            <p>
              <strong>uNick Academy Foundation</strong> is preparing a unique space for young people from four municipalities: <strong>Tarnowo Podgórne, Rokietnica, Kaźmierz and Szamotuły</strong>.
            </p>
            <p>
              Over six months, participants will meet new people, develop their interests, discover their own abilities and carry out ideas together.
            </p>
            <p className={styles.creatorNoSchool}>No grades, tests or textbooks. Instead, lots of conversation, creativity, collaboration and hands-on action.</p>
            <Button href="#deklaracja">Express interest</Button>
          </Reveal>
        </div>
        <div className={`container ${styles.creatorQuickFacts}`} aria-label="Key information">
          {quickFacts.map(([value, label]) => <div key={value}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      </section>

      <section className={`section ${styles.creatorLanguage}`}>
        <div className={`container ${styles.creatorLanguageGrid}`}>
          <Reveal>
            <span className="eyebrow">Natural communication</span>
            <h2>English that is actually used</h2>
          </Reveal>
          <Reveal className={styles.creatorLanguageCopy}>
            <p>All classes will be taught in English by teachers from abroad, including native speakers.</p>
            <p>This is not a traditional language course, though. English will be a natural tool for communication during shared projects, discussions, recording podcasts or preparing presentations.</p>
            <p>We do not require perfect English. Openness, curiosity and willingness to take part matter more. Mistakes are a natural part of learning, and every participant can build confidence at their own pace.</p>
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.creatorCourses}`}>
        <div className="container">
          <SectionHeading
            eyebrow="Four paths"
            title="Discover our classes"
            subtitle="Every class combines hands-on action, collaboration and natural communication in English."
          />
          <div className={styles.creatorCourseGrid}>
            {copy.activities.items.map(course => <CourseCard course={course} key={course.id} />)}
          </div>
        </div>
      </section>

      <section className={`section ${styles.creatorLocations}`}>
        <div className="container">
          <SectionHeading
            eyebrow="Close to home"
            title="When and where do we meet?"
            subtitle="Choose your municipality and check the time and venue of the classes."
          />
          <div className={styles.creatorLocationGrid}>
            {projectSchedule.map(location => (
              <Reveal as="article" className={styles.creatorLocationCard} key={location.municipality}>
                <header>
                  <h3>{placeLabel(location.name, 'en')}</h3>
                  <p className={styles.creatorLocationDay}>{dayLabel(location.day, 'en')}</p>
                </header>
                <ul className={styles.creatorLocationCourses}>
                  {location.courses.map(course => (
                    <li key={course.activity}>
                      <span>{course.title}</span>
                      {course.time ? <time>{course.time}</time> : <small>Time to be confirmed</small>}
                    </li>
                  ))}
                </ul>
                {location.address ? (
                  <address className={styles.creatorLocationAddress}>
                    {location.venue && <strong>{venueLabel(location.venue, 'en')}</strong>}
                    <span>{location.address}</span>
                  </address>
                ) : (
                  <p className={styles.creatorLocationPending}>We will announce the venue address and exact times once they are confirmed.</p>
                )}
              </Reveal>
            ))}
          </div>
          <p className={styles.creatorLocationNote}>Each group has a maximum of <strong>12 participants</strong>. Taking part is completely free.</p>
        </div>
      </section>

      <section className={`section ${styles.creatorAudience}`}>
        <div className={`container ${styles.creatorAudienceGrid}`}>
          <Reveal>
            <span className="eyebrow">Who is it for?</span>
            <h2>We invite young people who want to try something new</h2>
            <p>No experience in entrepreneurship, podcasting or performing is needed. English level is not an admission criterion.</p>
          </Reveal>
          <Reveal as="ul" className={styles.creatorAudienceList}>
            {audiencePoints.map(point => <li key={point}><span aria-hidden="true">✓</span>{point}</li>)}
          </Reveal>
        </div>
      </section>

      <section className={`section ${styles.creatorOrganization}`}>
        <div className="container">
          <SectionHeading eyebrow="At a glance" title="Practical information" />
          <dl className={styles.creatorOrganizationGrid}>
            {organizationFacts.map(([label, value]) => <Reveal as="div" key={label}><dt>{label}</dt><dd>{value}</dd></Reveal>)}
          </dl>
        </div>
      </section>

      <section className={`section ${styles.declaration}`} id="deklaracja">
        <div className="container">
          <header className={styles.declarationIntro}>
            <span className="eyebrow">Programme applications</span>
            <h2>Express interest</h2>
            <div className={styles.creatorRegistrationCopy}>
              <p>We are currently running <strong>preliminary sign-ups</strong>, which let us gauge interest in individual classes and adapt the schedule to participants' needs.</p>
              <p>The number of places is limited. If the recruitment criteria are met, the order of submissions will matter.</p>
              <p><strong>A preliminary submission does not yet commit you to taking part in the project.</strong></p>
            </div>
            <p className={styles.creatorJoin}>🦄 Join the Creators of the Future!</p>
          </header>
          <FoundationInterestForm copy={copy.form} locale="en" />
        </div>
      </section>

      <footer className={styles.creatorGrantNote}>
        <div className="container">
          <p><em>The "Creators of the Future" project is being prepared by uNick Academy Foundation in connection with an application for support in a call run by LGD Dolina Samy. The start of classes depends on completing the grant formalities. The final scope and schedule will be confirmed before the project begins.</em></p>
        </div>
      </footer>
    </>
  )
}
